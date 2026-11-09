import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PaymentTransactionStatus, YapePaymentStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { CulqiService } from './culqi.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly culqiService: CulqiService
  ) {}

  private checkoutResponse(order: any, paymentId?: string) {
    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items,
      },
      paymentDetails: { payment: { id: paymentId ?? null } },
    };
  }

  async reconcileCulqiOrder(gatewayId: string) {
    const remote = await this.culqiService.getOrder(gatewayId);
    if (remote.state !== 'paid') return;
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({ where: { gatewayTransactionId: gatewayId } });
      if (!payment) throw new NotFoundException('El pedido aún no se ha registrado. Reintenta el evento.');
      if (remote.currency_code !== payment.currency || remote.amount !== Math.round(Number(payment.amount) * 100)) {
        throw new BadRequestException('El importe o la moneda del pago no coincide.');
      }
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentTransactionStatus.INITIATED },
        data: { status: PaymentTransactionStatus.COMPLETED },
      });
      if (updated.count === 0) return;
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.COMPLETED },
      });
      await tx.order.updateMany({
        where: { id: payment.orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CONFIRMED },
      });
      await tx.orderTimeline.create({ data: {
        orderId: payment.orderId, status: OrderStatus.CONFIRMED,
        description: 'Pago de Culqi verificado en el servidor.',
      } });
    });
  }

  /**
   * Resuelve un item del carrito contra la BD: encuentra el producto y su
   * variante, y determina el precio unitario REAL. Es la única fuente de
   * verdad de precios — nunca se usa el `item.price` que manda el cliente.
   */
  private async resolveLineItem(client: any, item: any) {
    // Un carrito guardado en el navegador puede contener productos que ya se
    // eliminaron. Validamos el formato antes de consultar para no reventar con
    // un error de UUID inválido de Prisma (500) y damos un mensaje entendible.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!item?.productId || !UUID_RE.test(String(item.productId))) {
      throw new BadRequestException(
        'Uno de los productos de tu carrito ya no está disponible. Vacía tu bolsa y agrégalo nuevamente.',
      );
    }

    const product = await client.product.findUnique({
      where: { id: item.productId },
      include: { variants: true, images: true },
    });

    if (!product || product.status !== 'ACTIVE' || product.deletedAt) {
      throw new NotFoundException(
        'Uno de los productos de tu carrito ya no está disponible. Vacía tu bolsa y agrégalo nuevamente.',
      );
    }

    let variant = null;
    if (item.variantId) {
      variant = product.variants.find((v: any) => v.id === item.variantId);
    } else {
      // Fallback por size & color
      variant = product.variants.find((v: any) =>
        (v.size || '').toLowerCase() === (item.size || '').toLowerCase() &&
        (v.color || '').toLowerCase() === (item.color || '').toLowerCase()
      );
    }

    // Si el producto tiene variantes, pero no encontramos coincidencia
    if (!variant && product.variants.length > 0) {
      throw new BadRequestException(`La combinación de talla "${item.size}" y color "${item.color}" para "${product.name}" no está disponible.`);
    }

    const unitPrice = parseFloat((variant ? variant.price : product.price).toString());
    const quantity = item.quantity;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser un entero positivo.');
    }
    const totalPrice = unitPrice * quantity;

    return { product, variant, unitPrice, quantity, totalPrice };
  }

  /**
   * Calcula subtotal, envío y total leyendo precios de la BD. Se usa antes de
   * abrir la pasarela de pagos para que el monto mostrado en el popup sea el
   * mismo que se cobrará al crear la orden, sin confiar en el cliente.
   */
  async calculateTotals(items: any[], shippingDestinationId?: string) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('El carrito está vacío.');
    }

    let subtotal = 0;
    for (const item of items) {
      const { totalPrice } = await this.resolveLineItem(this.prisma, item);
      subtotal += totalPrice;
    }

    let shippingCost = 0;
    if (shippingDestinationId) {
      const destination = await this.prisma.shippingDestination.findUnique({
        where: { id: shippingDestinationId },
      });
      if (!destination || !destination.isActive) {
        throw new BadRequestException('El destino de envío seleccionado no es válido.');
      }
      shippingCost = parseFloat(destination.price.toString());
    }

    return { subtotal, shippingCost, total: subtotal + shippingCost };
  }

  async create(data: any, authenticatedUser: { id: string; email: string }) {
    const {
      email,
      name,
      dni,
      address,
      phone,
      paymentMethod,
      notes,
      items,
      shippingDestinationId,
      missingDestinationName,
      culqiToken,
      culqiOrderId,
      checkoutIdempotencyKey,
    } = data;
    // subtotal, shippingCost y total NUNCA se toman del cliente: se recalculan
    // server-side a partir de los precios reales de producto/variante y del
    // destino de envío, para evitar que el comprador fije su propio precio.

    // 0. Validar que el método de pago exista y esté habilitado por la tienda,
    // para que nadie pueda forzar un método que el admin desactivó.
    const method = String(paymentMethod || '').toLowerCase();
    const settings = await this.prisma.systemSettings.findFirst();
    const enabledByMethod: Record<string, boolean> = {
      // Los interruptores reales están en el panel de administración.
      // Conservamos los valores históricos para una instalación que aún no
      // tenga una fila de configuración.
      tarjeta: settings?.paymentCardEnabled ?? true,
      yape: settings?.paymentYapeEnabled ?? true,
      transferencia: settings?.paymentManualEnabled ?? false,
    };

    if (!(method in enabledByMethod)) {
      throw new BadRequestException('Método de pago no válido.');
    }
    if (!enabledByMethod[method]) {
      throw new BadRequestException('Ese método de pago no está disponible en este momento.');
    }

    // Validación de los datos de contacto y entrega. El cliente ya valida en el
    // formulario, pero la API no puede confiar en eso: una petición directa
    // podría traer datos vacíos o con formato inválido.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      throw new BadRequestException('El correo electrónico no es válido.');
    }
    if (!name || !String(name).trim()) {
      throw new BadRequestException('El nombre es obligatorio.');
    }
    if (!address || !String(address).trim()) {
      throw new BadRequestException('La dirección de entrega es obligatoria.');
    }
    if (!/^\d{9}$/.test(String(phone || ''))) {
      throw new BadRequestException('El teléfono debe tener exactamente 9 dígitos.');
    }
    if (!/^\d{8}$/.test(String(dni || ''))) {
      throw new BadRequestException('El DNI debe tener exactamente 8 dígitos.');
    }
    if (!shippingDestinationId && !missingDestinationName) {
      throw new BadRequestException('Debes indicar un destino de envío.');
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      throw new BadRequestException('El carrito debe contener entre 1 y 100 artículos.');
    }
    for (const item of items) {
      if (!Number.isSafeInteger(item?.quantity) || item.quantity <= 0) {
        throw new BadRequestException('La cantidad debe ser un entero positivo.');
      }
    }
    if (method === 'tarjeta' && !culqiToken) {
      throw new BadRequestException('Se requiere un token de pago con tarjeta.');
    }
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!checkoutIdempotencyKey || !UUID_RE.test(String(checkoutIdempotencyKey))) {
      throw new BadRequestException('La solicitud de compra no es válida. Recarga la página e inténtalo nuevamente.');
    }

    // El mismo intento siempre devuelve el primer pedido creado. Esto cubre
    // doble clic, reintentos del navegador y respuestas perdidas por red.
    const existingOrder = await this.prisma.order.findUnique({
      where: { checkoutIdempotencyKey },
      include: { items: true },
    });
    if (existingOrder) return this.checkoutResponse(existingOrder);

    const normalizedDni = dni ? String(dni) : null;

    // Consultar al proveedor antes de asociar un identificador enviado por el navegador.
    const remoteOrder = method === 'yape' && culqiOrderId
      ? await this.culqiService.getOrder(culqiOrderId) : null;
    if (remoteOrder && String(remoteOrder.client_details?.email).toLowerCase() !== String(email).toLowerCase()) {
      throw new BadRequestException('El pago no corresponde al correo del pedido.');
    }

    // El checkout ya exige sesión. Volvemos a comprobarlo en la API para que
    // nadie pueda fabricar pedidos para otro correo ni agotar stock mediante
    // llamadas directas a este endpoint.
    if (String(email).trim().toLowerCase() !== authenticatedUser.email.toLowerCase()) {
      throw new BadRequestException('El correo del pedido debe coincidir con tu sesión.');
    }
    let user = await this.prisma.user.findUnique({ where: { id: authenticatedUser.id } });
    if (!user) throw new BadRequestException('No encontramos tu cuenta. Vuelve a iniciar sesión.');
    if (!user.emailVerified) {
      throw new BadRequestException('Verifica tu correo antes de realizar una compra.');
    }

    // Guardamos el contacto real digitado por la clienta. Antes sólo se
    // completaban campos vacíos, por lo que un teléfono antiguo seguía
    // apareciendo aun después de cambiarlo en checkout.
    const profileChanges: { dni?: string; phone?: string } = {};
    if (normalizedDni && normalizedDni !== user.dni) profileChanges.dni = normalizedDni;
    if (phone && phone !== user.phone) profileChanges.phone = phone;
    if (Object.keys(profileChanges).length > 0) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: profileChanges });
    }

    // 2. Resolver el destino elegido (el checkout no manda city/region sueltos,
    // sólo el id del destino o, si no está en la lista, un texto libre).
    let destination: { type: string; department: string | null; province: string | null; district: string | null; isActive: boolean; price: any } | null = null;
    if (shippingDestinationId) {
      destination = await this.prisma.shippingDestination.findUnique({ where: { id: shippingDestinationId } });
      if (!destination || !destination.isActive) {
        throw new BadRequestException('El destino de envío seleccionado no es válido.');
      }
    }

    const city = destination
      ? destination.district || destination.province || destination.department || 'N/A'
      : missingDestinationName || 'Por confirmar';
    const region = destination
      ? destination.department || destination.province || (destination.type === 'LIMA_METROPOLITANA' ? 'Lima' : 'N/A')
      : missingDestinationName || 'Por confirmar';

    // 3. Reutilizar la dirección principal si es idéntica. Si cambia, se crea
    // un nuevo registro y el anterior se conserva como historial de pedidos.
    // Nunca editamos una dirección vinculada a una orden pasada.
    const addressData = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: String(phone),
      street: String(address).trim(),
      city,
      state: region,
      postalCode: '15000',
      country: 'PE',
    };
    const previousDefault = await this.prisma.shippingAddress.findFirst({
      where: { userId: user.id, isDefault: true, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    const isSameAddress = previousDefault &&
      previousDefault.firstName === addressData.firstName &&
      previousDefault.lastName === addressData.lastName &&
      previousDefault.phone === addressData.phone &&
      previousDefault.street === addressData.street &&
      previousDefault.city === addressData.city &&
      previousDefault.state === addressData.state &&
      previousDefault.postalCode === addressData.postalCode &&
      previousDefault.country === addressData.country;

    let shippingAddress = previousDefault;
    if (!isSameAddress) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
      shippingAddress = await this.prisma.shippingAddress.create({
        data: { userId: user.id, label: 'Dirección principal', isDefault: true, ...addressData },
      });
    }
    if (!shippingAddress) {
      throw new BadRequestException('No se pudo guardar la dirección de entrega. Inténtalo nuevamente.');
    }



    // 4. Generar número de orden único
    const orderNumber = `PH-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    // 5. Validar stock, reducirlo y preparar items dentro de una transacción.
    // Los precios y el costo de envío se calculan aquí a partir de la BD,
    // nunca a partir de lo que envía el cliente.
    let result: any;
    try {
      result = await this.prisma.$transaction(async (tx) => {
      const orderItemsToCreate = [];
      let subtotal = 0;

      for (const item of items) {
        const { product, variant, unitPrice, quantity, totalPrice } = await this.resolveLineItem(tx, item);

        // Si hay una variante válida, validar y descontar stock
        if (variant) {
          const reserved = await tx.productVariant.updateMany({
            where: { id: variant.id, isActive: true, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (reserved.count !== 1) {
            throw new BadRequestException('El producto no tiene suficiente stock disponible.');
          }
        }

        subtotal += totalPrice;

        orderItemsToCreate.push({
          productId: item.productId,
          variantId: variant ? variant.id : null,
          productName: product.name,
          variantName: variant ? variant.name : null,
          sku: variant ? variant.sku : (item.sku || product.sku || 'PH-PROD'),
          imageUrl: item.imageUrl || (product.images?.[0]?.url || ''),
          quantity,
          unitPrice,
          totalPrice,
          size: item.size || null,
          color: item.color || null,
        });
      }

      // El costo de envío sale del destino ya validado arriba, no del body del cliente.
      const shippingCost = destination ? parseFloat(destination.price.toString()) : 0;

      const total = subtotal + shippingCost;

      if (remoteOrder && (remoteOrder.currency_code !== 'PEN' || remoteOrder.amount !== Math.round(total * 100))) {
        throw new BadRequestException('El importe del pago no coincide con el pedido.');
      }

      // Crear la orden
      const order = await tx.order.create({
        data: {
          orderNumber,
          checkoutIdempotencyKey,
          customerId: user.id,
          addressId: shippingAddress.id,
          paymentMethod: method.toUpperCase(),
          subtotal,
          shippingCost,
          // Cuando el destino se conoce desde el checkout, el flete forma
          // parte del pago inicial. Un destino cotizado después queda aparte.
          isShippingPaid: Boolean(destination),
          total,
          shippingDestinationId: shippingDestinationId || null,
          currency: 'PEN',
          notes: notes || '',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: orderItemsToCreate,
          },
          timeline: {
            create: {
              status: OrderStatus.PENDING,
              description: 'Pedido recibido por la tienda. Esperando confirmación.',
            },
          },
        },
        include: {
          items: true,
        },
      });

      // Si el cliente no encontró su destino en la lista, registrar la
      // solicitud para que el equipo la revise (antes se perdía: el frontend
      // la enviaba pero nada la guardaba).
      if (!shippingDestinationId && missingDestinationName) {
        await tx.missingDestinationRequest.create({
          data: {
            requestedName: missingDestinationName,
            type: 'PROVINCIA',
            orderId: order.id,
            customerId: user.id,
          },
        });
      }

      // Registrar el pago. Siempre nace en INITIATED: sólo pasa a COMPLETED
      // cuando el cobro real se confirma (cargo a Culqi para tarjeta, webhook
      // para Yape, o aprobación manual del admin para transferencia).
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          customerId: user.id,
          amount: order.total,
          currency: 'PEN',
          method: method === 'tarjeta' ? 'TARJETA' : method.toUpperCase(),
          status: PaymentTransactionStatus.INITIATED,
          // Reservar el identificador que entrega Culqi desde el inicio evita
          // que dos solicitudes concurrentes utilicen el mismo pago.
          gatewayTransactionId: method === 'tarjeta'
            ? culqiToken
            : method === 'yape'
              ? culqiOrderId || null
              : null,
        },
      });
      const paymentDetails = { payment };

      return {
        order,
        paymentDetails,
      };
      });
    } catch (error: any) {
      // La restricción única es la barrera final para dos procesos que pasan
      // por la lectura inicial al mismo tiempo.
      if (error?.code === 'P2002') {
        const duplicatedOrder = await this.prisma.order.findUnique({
          where: { checkoutIdempotencyKey },
          include: { items: true },
        });
        if (duplicatedOrder) return this.checkoutResponse(duplicatedOrder);
      }
      throw error;
    }

    // Realizar el cargo real de Culqi fuera de la transacción de DB para no bloquear.
    // Usamos el total calculado en el servidor (result.order.total), nunca el del cliente.
    // El pedido sólo se marca como pagado si el cargo efectivamente tuvo éxito.
    if (culqiToken && method === 'tarjeta') {
      try {
        const charge = await this.culqiService.createCharge({
          amount: Math.round(parseFloat(result.order.total.toString()) * 100),
          currency_code: 'PEN',
          email: email,
          source_id: culqiToken,
        });

        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: result.order.id },
            data: { paymentStatus: PaymentStatus.COMPLETED, status: OrderStatus.CONFIRMED },
          }),
          this.prisma.payment.updateMany({
            where: { orderId: result.order.id },
            data: { status: PaymentTransactionStatus.COMPLETED, gatewayTransactionId: charge.id },
          }),
          this.prisma.orderTimeline.create({
            data: {
              orderId: result.order.id,
              status: OrderStatus.CONFIRMED,
              description: 'Pago recibido exitosamente vía Culqi.',
            },
          }),
        ]);
      } catch (error) {
        console.error('Error procesando cargo Culqi post-order', error);

        await this.prisma.$transaction([
          this.prisma.payment.updateMany({
            where: { orderId: result.order.id },
            data: { status: PaymentTransactionStatus.FAILED },
          }),
          this.prisma.orderTimeline.create({
            data: {
              orderId: result.order.id,
              status: OrderStatus.PENDING,
              description: 'El cargo con Culqi falló. El pedido queda pendiente de pago.',
            },
          }),
        ]);

        throw new BadRequestException('No se pudo procesar el pago con Culqi. Intenta nuevamente.');
      }
    }

    if (remoteOrder?.state === 'paid') await this.reconcileCulqiOrder(culqiOrderId);
    const current = await this.prisma.order.findUniqueOrThrow({ where: { id: result.order.id } });
    // El checkout público nunca devuelve relaciones ni campos internos de la cuenta.
    return this.checkoutResponse(
      { ...current, items: result.order.items },
      result.paymentDetails.payment.id,
    );
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        customer: true,
        address: true,
        payments: { select: { method: true, status: true, amount: true, metadata: true } },
        missingRequests: { select: { status: true } },
        destination: { select: { district: true, department: true, type: true, agencyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        address: true,
        payments: true,
        yapePayments: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const isOwner = order.customerId === user.id;
    const isStaff = ['SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('No tienes permisos para ver esta orden');
    }

    return order;
  }

  /**
   * Confirma o rechaza manualmente el pago de un pedido (Yape con QR):
   * la clienta envía su captura por WhatsApp y el equipo la valida aquí.
   * Al confirmarlo, el pedido pasa a CONFIRMED y puede seguir al envío.
   */
  async reviewManualPayment(orderId: string, approved: boolean, reviewerId: string) {
    if (typeof approved !== 'boolean') {
      throw new BadRequestException('La decisión de pago no es válida.');
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    return this.prisma.$transaction(async (tx) => {
      // Esta acción sólo es para el QR/WhatsApp. Un miembro del equipo nunca
      // debe poder marcar como pagado un pedido cuya confirmación corresponde
      // a Culqi.
      const manualPayment = await tx.payment.findFirst({
        where: {
          orderId,
          method: 'TRANSFERENCIA',
          status: { in: [PaymentTransactionStatus.INITIATED, PaymentTransactionStatus.FAILED] },
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!manualPayment) {
        throw new BadRequestException('Este pedido no usa pago manual o no tiene uno pendiente.');
      }

      const isShippingPayment = (manualPayment.metadata as { purpose?: string } | null)?.purpose === 'SHIPPING';

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          // Aprobar el flete no debe modificar el estado del pago ya hecho
          // por las prendas.
          ...(isShippingPayment
            ? { isShippingPaid: approved }
            : {
                paymentStatus: approved ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
                status: approved && order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status,
              }),
        },
      });

      await tx.payment.updateMany({
        where: { id: manualPayment.id },
        data: {
          status: approved ? PaymentTransactionStatus.COMPLETED : PaymentTransactionStatus.FAILED,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: updated.status,
          description: isShippingPayment
            ? approved
              ? `Pago de envío confirmado. Monto: S/ ${manualPayment.amount.toString()}.`
              : 'El pago de envío no pudo ser verificado.'
            : approved
              ? `Pago verificado por el equipo. Monto confirmado: S/ ${parseFloat(order.total.toString()).toFixed(2)}.`
              : 'El pago no pudo ser verificado. Se contactará a la clienta.',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: approved ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
          entity: 'Order',
          entityId: orderId,
          newValues: { orderNumber: order.orderNumber, total: order.total.toString() },
        },
      }).catch(() => undefined); // el registro de auditoría no debe bloquear la operación

      return updated;
    });
  }

  /** Crea o recupera el pago manual exclusivo de un envío cotizado. */
  async createShippingPayment(orderId: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        missingRequests: { select: { status: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Primero debe confirmarse el pago de las prendas.');
    }
    if (!order.shippingDestinationId || Number(order.shippingCost) <= 0) {
      throw new BadRequestException('El envío todavía no ha sido cotizado.');
    }
    if (!order.missingRequests.some((request) => request.status === 'RESOLVED')) {
      throw new BadRequestException('El envío de este pedido ya estaba incluido en el pago inicial.');
    }
    if (order.isShippingPaid) {
      throw new BadRequestException('El envío de este pedido ya figura como pagado.');
    }

    const existing = order.payments.find((payment) =>
      (payment.metadata as { purpose?: string } | null)?.purpose === 'SHIPPING' &&
      payment.status !== PaymentTransactionStatus.CANCELLED,
    );
    if (existing) return { payment: existing, order };

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: order.id,
          customerId,
          amount: order.shippingCost,
          currency: order.currency,
          method: 'TRANSFERENCIA',
          status: PaymentTransactionStatus.INITIATED,
          metadata: { purpose: 'SHIPPING' },
        },
      });
      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: order.status,
          description: `Pago de envío solicitado por S/ ${Number(order.shippingCost).toFixed(2)}.`,
        },
      });
      return created;
    });

    return { payment, order };
  }

  async findByEmailAndOrderNumber(email: string, orderNumber: string) {
    return this.prisma.order.findFirst({
      where: {
        orderNumber,
        customer: { email: { equals: email, mode: 'insensitive' } },
      },
      include: {
        items: true,
        address: true,
        destination: true,
        missingRequests: { select: { status: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        timeline: {
          create: {
            status,
            description: `El estado del pedido cambió a ${status}.`,
          },
        },
      },
      include: { timeline: true },
    });
  }

  /** Guarda la constancia visual y/o el número de boleta del despacho.
   * Aplica por igual a delivery de Lima y a encomiendas de provincia. */
  async updateShippingProof(id: string, proofUrl?: string, receiptNumber?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Marca el pedido como enviado antes de registrar la constancia de despacho.');
    }

    const normalizedProofUrl = proofUrl?.trim() || null;
    const normalizedReceiptNumber = receiptNumber?.trim() || null;
    if (normalizedProofUrl && !/^https:\/\//i.test(normalizedProofUrl) && !/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(normalizedProofUrl)) {
      throw new BadRequestException('La constancia debe ser una imagen segura subida por el panel.');
    }
    if (normalizedReceiptNumber && normalizedReceiptNumber.length > 120) {
      throw new BadRequestException('El número de boleta o guía es demasiado largo.');
    }

    return this.prisma.order.update({
      where: { id },
      // El cliente de Prisma se regenera en el build de API; la conversión
      // mantiene la compilación local funcional si el watcher retiene el DLL.
      data: {
        shippingProofUrl: normalizedProofUrl,
        shippingReceiptNumber: normalizedReceiptNumber,
        timeline: {
          create: {
            status: order.status,
            description: normalizedProofUrl || normalizedReceiptNumber
              ? 'Constancia de despacho registrada por el equipo.'
              : 'Constancia de despacho eliminada por el equipo.',
          },
        },
      } as any,
      include: { timeline: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findAllUserOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        address: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        // El destino permite mostrar la agencia y el tiempo estimado
        destination: { select: { type: true, agencyName: true, estimatedDays: true, department: true, district: true } },
        missingRequests: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete order items
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      // 2. Delete order timeline
      await tx.orderTimeline.deleteMany({ where: { orderId: id } });
      // 3. Delete payments
      await tx.payment.deleteMany({ where: { orderId: id } });
      // 4. Delete yape payments
      await tx.yapePayment.deleteMany({ where: { orderId: id } });
      // 5. Delete or update missing requests
      await tx.missingDestinationRequest.deleteMany({ where: { orderId: id } });
      // 6. Finally, delete the order
      await tx.order.delete({ where: { id } });
      return { success: true };
    });
  }
}
