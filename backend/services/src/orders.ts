import { prisma, PaymentTransactionStatus, OrderStatus, PaymentStatus } from '@phalay/database';
import { randomUUID } from 'crypto';
import { culqiService } from './culqi';

export const ordersService = {
  async resolveLineItem(client: any, item: any) {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!item?.productId || !UUID_RE.test(String(item.productId))) {
      throw new Error(
        'Uno de los productos de tu carrito ya no está disponible. Vacía tu bolsa y agrégalo nuevamente.',
      );
    }

    const product = await client.product.findUnique({
      where: { id: item.productId },
      include: { variants: true, images: true },
    });

    if (!product || product.status !== 'ACTIVE' || product.deletedAt) {
      throw new Error(
        'Uno de los productos de tu carrito ya no está disponible. Vacía tu bolsa y agrégalo nuevamente.',
      );
    }

    let variant = null;
    if (item.variantId) {
      variant = product.variants.find((v: any) => v.id === item.variantId);
    } else {
      variant = product.variants.find(
        (v: any) =>
          (v.size || '').toLowerCase() === (item.size || '').toLowerCase() &&
          (v.color || '').toLowerCase() === (item.color || '').toLowerCase(),
      );
    }

    if (!variant && product.variants.length > 0) {
      throw new Error(`La combinación de talla "${item.size}" y color "${item.color}" para "${product.name}" no está disponible.`);
    }

    const unitPrice = parseFloat((variant ? variant.price : product.price).toString());
    const quantity = item.quantity;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('La cantidad debe ser un entero positivo.');
    }
    const totalPrice = unitPrice * quantity;

    return { product, variant, unitPrice, quantity, totalPrice };
  },

  async calculateTotals(items: any[], shippingDestinationId?: string) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    let subtotal = 0;
    for (const item of items) {
      const { totalPrice } = await this.resolveLineItem(prisma, item);
      subtotal += totalPrice;
    }

    let shippingCost = 0;
    if (shippingDestinationId) {
      const destination = await prisma.shippingDestination.findUnique({
        where: { id: shippingDestinationId },
      });
      if (!destination || !destination.isActive) {
        throw new Error('El destino de envío seleccionado no es válido.');
      }
      shippingCost = parseFloat(destination.price.toString());
    }

    return { subtotal, shippingCost, total: subtotal + shippingCost };
  },

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

    const method = String(paymentMethod || '').toLowerCase();
    const settings = await prisma.systemSettings.findFirst();
    const enabledByMethod: Record<string, boolean> = {
      tarjeta: settings?.paymentCardEnabled ?? true,
      yape: settings?.paymentYapeEnabled ?? true,
      transferencia: settings?.paymentManualEnabled ?? false,
    };

    if (!(method in enabledByMethod)) {
      throw new Error('Método de pago no válido.');
    }
    if (!enabledByMethod[method]) {
      throw new Error('Ese método de pago no está disponible en este momento.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      throw new Error('El correo electrónico no es válido.');
    }
    if (!name || !String(name).trim()) {
      throw new Error('El nombre es obligatorio.');
    }
    if (!address || !String(address).trim()) {
      throw new Error('La dirección de entrega es obligatoria.');
    }
    if (!/^\d{9}$/.test(String(phone || ''))) {
      throw new Error('El teléfono debe tener exactamente 9 dígitos.');
    }
    if (!/^\d{8}$/.test(String(dni || ''))) {
      throw new Error('El DNI debe tener exactamente 8 dígitos.');
    }
    if (!shippingDestinationId && !missingDestinationName) {
      throw new Error('Debes indicar un destino de envío.');
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      throw new Error('El carrito debe contener entre 1 y 100 artículos.');
    }
    for (const item of items) {
      if (!Number.isSafeInteger(item?.quantity) || item.quantity <= 0) {
        throw new Error('La cantidad debe ser un entero positivo.');
      }
    }
    if (method === 'tarjeta' && !culqiToken) {
      throw new Error('Se requiere un token de pago con tarjeta.');
    }
    const normalizedDni = dni ? String(dni) : null;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Phalay';

      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          dni: normalizedDni,
          supabaseAuthId: randomUUID(),
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
    } else {
      const missing: { dni?: string; phone?: string } = {};
      if (normalizedDni && !user.dni) missing.dni = normalizedDni;
      if (phone && !user.phone) missing.phone = phone;

      if (Object.keys(missing).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: missing });
      }
    }

    let destination: any = null;
    if (shippingDestinationId) {
      destination = await prisma.shippingDestination.findUnique({ where: { id: shippingDestinationId } });
      if (!destination || !destination.isActive) {
        throw new Error('El destino de envío seleccionado no es válido.');
      }
    }

    const city = destination
      ? destination.district || destination.province || destination.department || 'N/A'
      : missingDestinationName || 'Por confirmar';
    const region = destination
      ? destination.department || destination.province || (destination.type === 'LIMA_METROPOLITANA' ? 'Lima' : 'N/A')
      : missingDestinationName || 'Por confirmar';

    const shippingAddress = await prisma.shippingAddress.create({
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

    const orderNumber = `PH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await prisma.$transaction(async (tx) => {
      const orderItemsToCreate = [];
      let subtotal = 0;

      for (const item of items) {
        const { product, variant, unitPrice, quantity, totalPrice } = await this.resolveLineItem(tx, item);

        if (variant) {
          const reserved = await tx.productVariant.updateMany({
            where: { id: variant.id, isActive: true, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (reserved.count !== 1) {
            throw new Error('El producto no tiene suficiente stock disponible.');
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

      const shippingCost = destination ? parseFloat(destination.price.toString()) : 0;
      const total = subtotal + shippingCost;

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
        },
      });

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

      return { order, paymentDetails: { payment } };
    });

    if (culqiToken && method === 'tarjeta') {
      try {
        await culqiService.createCharge({
          amount: Math.round(parseFloat(result.order.total.toString()) * 100),
          currency_code: 'PEN',
          email: email,
          source_id: culqiToken,
        });

        await prisma.$transaction([
          prisma.order.update({
            where: { id: result.order.id },
            data: { paymentStatus: PaymentStatus.COMPLETED },
          }),
          prisma.payment.updateMany({
            where: { orderId: result.order.id },
            data: { status: PaymentTransactionStatus.COMPLETED, gatewayTransactionId: culqiToken },
          }),
          prisma.orderTimeline.create({
            data: {
              orderId: result.order.id,
              status: OrderStatus.PROCESSING,
              description: 'Pago recibido exitosamente vía Culqi.',
            },
          }),
        ]);
      } catch (error) {
        console.error('Error procesando cargo Culqi post-order', error);
        await prisma.$transaction([
          prisma.payment.updateMany({
            where: { orderId: result.order.id },
            data: { status: PaymentTransactionStatus.FAILED },
          }),
          prisma.orderTimeline.create({
            data: {
              orderId: result.order.id,
              status: OrderStatus.PENDING,
              description: 'El cargo con Culqi falló. El pedido queda pendiente de pago.',
            },
          }),
        ]);
        throw new Error('No se pudo procesar el pago con Culqi. Intenta nuevamente.');
      }
    }

    return {
      success: true,
      order: result.order,
      paymentDetails: result.paymentDetails,
    };
  },

  async findAll() {
    return prisma.order.findMany({
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
  },

  async findOne(id: string, user?: { id: string; role: string }) {
    const order = await prisma.order.findUnique({
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
    if (!order) throw new Error('Orden no encontrada');

    if (user && user.role === 'CUSTOMER' && order.customerId !== user.id) {
      throw new Error('No tienes permisos para ver esta orden');
    }

    return order;
  },

  async reviewManualPayment(orderId: string, approved: boolean, _reviewerId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    if (order.paymentStatus === PaymentStatus.COMPLETED && approved) {
      throw new Error('Este pedido ya figura como pagado.');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: approved ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
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

      return updated;
    });
  },

  async findByEmailAndOrderNumber(email: string, orderNumber: string) {
    return prisma.order.findFirst({
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
  },

  async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
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
  },

  async findAllUserOrders(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        address: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        destination: { select: { type: true, agencyName: true, estimatedDays: true, department: true, district: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.orderTimeline.deleteMany({ where: { orderId: id } });
      await tx.payment.deleteMany({ where: { orderId: id } });
      await tx.yapePayment.deleteMany({ where: { orderId: id } });
      await tx.missingDestinationRequest.deleteMany({ where: { orderId: id } });
      return tx.order.delete({ where: { id } });
    });
  },
};
