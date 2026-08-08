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

    if (!product) {
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
    const quantity = parseInt(item.quantity);
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

  async create(data: any) {
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
    } = data;
    // subtotal, shippingCost y total NUNCA se toman del cliente: se recalculan
    // server-side a partir de los precios reales de producto/variante y del
    // destino de envío, para evitar que el comprador fije su propio precio.

    // 0. Validar que el método de pago exista y esté habilitado por la tienda,
    // para que nadie pueda forzar un método que el admin desactivó.
    const method = String(paymentMethod || '').toLowerCase();
    const settings = await this.prisma.systemSettings.findFirst();
    const enabledByMethod: Record<string, boolean> = {
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

    const normalizedDni = dni ? String(dni) : null;

    // 1. Encontrar o crear usuario (Cliente) por email
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Phalay';

      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          dni: normalizedDni,
          // supabaseAuthId es único: cada invitado necesita su propio UUID.
          // Antes se usaba un placeholder fijo, así que sólo podía existir un
          // cliente invitado en toda la tienda y el segundo fallaba.
          supabaseAuthId: randomUUID(),
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
    } else {
      // La cuenta ya existía: completamos los datos que aún no tenga para no
      // volver a pedírselos y para que el equipo pueda contactarla.
      const missing: { dni?: string; phone?: string } = {};
      if (normalizedDni && !user.dni) missing.dni = normalizedDni;
      if (phone && !user.phone) missing.phone = phone;

      if (Object.keys(missing).length > 0) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: missing });
      }
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

    // 3. Crear dirección de envío
    const shippingAddress = await this.prisma.shippingAddress.create({
      data: {
        userId: user.id,
        label: 'Checkout ' + new Date().toLocaleDateString(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone,
        street: address,
        city,
        state: region,
        postalCode: '15000',
        country: 'PE',
      },
    });



    // 4. Generar número de orden único
    const orderNumber = `PH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 5. Validar stock, reducirlo y preparar items dentro de una transacción.
    // Los precios y el costo de envío se calculan aquí a partir de la BD,
    // nunca a partir de lo que envía el cliente.
    const result = await this.prisma.$transaction(async (tx) => {
      const orderItemsToCreate = [];
      let subtotal = 0;

      for (const item of items) {
        const { product, variant, unitPrice, quantity, totalPrice } = await this.resolveLineItem(tx, item);

        // Si hay una variante válida, validar y descontar stock
        if (variant) {
          if (variant.stock < quantity) {
            throw new BadRequestException(`El producto "${product.name}" (Talla: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}) no tiene suficiente stock. Disponible: ${variant.stock}, Solicitado: ${quantity}.`);
          }

          // Descontar stock
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stock: {
                decrement: quantity
              }
            }
          });
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

      // Crear la orden
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: user.id,
          addressId: shippingAddress.id,
          paymentMethod: method.toUpperCase(),
          subtotal,
          shippingCost,
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
          customer: true,
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
          gatewayTransactionId: culqiOrderId || null,
        },
      });
      const paymentDetails = { payment };

      return {
        order,
        paymentDetails,
      };
    });

    // Realizar el cargo real de Culqi fuera de la transacción de DB para no bloquear.
    // Usamos el total calculado en el servidor (result.order.total), nunca el del cliente.
    // El pedido sólo se marca como pagado si el cargo efectivamente tuvo éxito.
    if (culqiToken && method === 'tarjeta') {
      try {
        await this.culqiService.createCharge({
          amount: Math.round(parseFloat(result.order.total.toString()) * 100),
          currency_code: 'PEN',
          email: email,
          source_id: culqiToken,
        });

        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: result.order.id },
            data: { paymentStatus: PaymentStatus.COMPLETED },
          }),
          this.prisma.payment.updateMany({
            where: { orderId: result.order.id },
            data: { status: PaymentTransactionStatus.COMPLETED, gatewayTransactionId: culqiToken },
          }),
          this.prisma.orderTimeline.create({
            data: {
              orderId: result.order.id,
              status: OrderStatus.PROCESSING,
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

    return {
      success: true,
      order: result.order,
      paymentDetails: result.paymentDetails,
    };
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
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (order.paymentStatus === PaymentStatus.COMPLETED && approved) {
      throw new BadRequestException('Este pedido ya figura como pagado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: approved ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
          // Al confirmar el pago el pedido queda listo para prepararse.
          status: approved && order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status,
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: approved ? PaymentTransactionStatus.COMPLETED : PaymentTransactionStatus.FAILED,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: updated.status,
          description: approved
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

  async findAllUserOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        address: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        // El destino permite mostrar la agencia y el tiempo estimado
        destination: { select: { type: true, agencyName: true, estimatedDays: true, department: true, district: true } },
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
