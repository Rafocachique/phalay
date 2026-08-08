import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────
  //  ShippingDestinations (CRUD)
  // ──────────────────────────────────

  async findAll(onlyActive = false) {
    return this.prisma.shippingDestination.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ type: 'asc' }, { department: 'asc' }, { district: 'asc' }],
      include: { agency: { select: { id: true, name: true, trackingUrl: true } } },
    });
  }

  async findOne(id: string) {
    const dest = await this.prisma.shippingDestination.findUnique({ where: { id } });
    if (!dest) throw new NotFoundException('Destino de envío no encontrado');
    return dest;
  }

  async create(data: {
    type: string;
    department?: string;
    province?: string;
    district?: string;
    agencyId?: string;
    agencyAddress?: string;
    price: number;
    estimatedDays?: string;
    isActive?: boolean;
  }) {
    const agencyFields = await this.resolveAgencyFields(this.prisma, data);
    return this.prisma.shippingDestination.create({
      data: { ...data, ...agencyFields } as any,
    });
  }

  async update(id: string, data: any) {
    const current = await this.findOne(id);
    const agencyFields = await this.resolveAgencyFields(this.prisma, {
      ...data,
      type: data.type ?? current.type,
    });
    return this.prisma.shippingDestination.update({
      where: { id },
      data: { ...data, ...agencyFields },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shippingDestination.delete({ where: { id } });
  }

  // ──────────────────────────────────
  //  Agencias de transporte (catálogo)
  // ──────────────────────────────────

  async findAllAgencies(onlyActive = false) {
    return this.prisma.shippingAgency.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { destinations: true } } },
    });
  }

  async createAgency(data: { name: string; trackingUrl?: string; contactPhone?: string; isActive?: boolean }) {
    const name = String(data.name || '').trim();
    if (!name) {
      throw new BadRequestException('El nombre de la agencia es obligatorio.');
    }

    const existing = await this.prisma.shippingAgency.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe una agencia registrada como "${existing.name}".`);
    }

    return this.prisma.shippingAgency.create({
      data: {
        name,
        trackingUrl: data.trackingUrl?.trim() || null,
        contactPhone: data.contactPhone?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateAgency(id: string, data: any) {
    const agency = await this.prisma.shippingAgency.findUnique({ where: { id } });
    if (!agency) throw new NotFoundException('Agencia no encontrada');

    const name = data.name !== undefined ? String(data.name).trim() : undefined;
    if (name !== undefined) {
      if (!name) throw new BadRequestException('El nombre de la agencia es obligatorio.');
      const duplicate = await this.prisma.shippingAgency.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } },
      });
      if (duplicate) {
        throw new BadRequestException(`Ya existe una agencia registrada como "${duplicate.name}".`);
      }
    }

    const updated = await this.prisma.shippingAgency.update({
      where: { id },
      data: {
        name,
        trackingUrl: data.trackingUrl !== undefined ? data.trackingUrl?.trim() || null : undefined,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone?.trim() || null : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    // El nombre está denormalizado en los destinos para poder mostrarlo sin join:
    // si cambió, se sincroniza para que no queden nombres viejos.
    if (name && name !== agency.name) {
      await this.prisma.shippingDestination.updateMany({
        where: { agencyId: id },
        data: { agencyName: name },
      });
    }

    return updated;
  }

  async removeAgency(id: string) {
    const agency = await this.prisma.shippingAgency.findUnique({
      where: { id },
      include: { _count: { select: { destinations: true } } },
    });
    if (!agency) throw new NotFoundException('Agencia no encontrada');

    // No se borra una agencia en uso: se desactiva para no dejar destinos huérfanos.
    if (agency._count.destinations > 0) {
      throw new BadRequestException(
        `"${agency.name}" está siendo usada por ${agency._count.destinations} destino(s). Desactívala en lugar de eliminarla.`,
      );
    }

    return this.prisma.shippingAgency.delete({ where: { id } });
  }

  /**
   * Resuelve la agencia elegida y devuelve los campos a guardar en el destino.
   * Sólo se aceptan agencias del catálogo: así el dato queda estandarizado.
   */
  private async resolveAgencyFields(client: any, data: any) {
    if (data.type !== 'PROVINCIA') {
      // Lima es delivery a domicilio: no interviene agencia.
      return { agencyId: null, agencyName: null, agencyAddress: null };
    }

    if (!data.agencyId) {
      throw new BadRequestException('Selecciona la agencia de transporte para el envío a provincia.');
    }

    const agency = await client.shippingAgency.findUnique({ where: { id: data.agencyId } });
    if (!agency || !agency.isActive) {
      throw new BadRequestException('La agencia seleccionada no es válida o está inactiva.');
    }

    return {
      agencyId: agency.id,
      agencyName: agency.name,
      agencyAddress: data.agencyAddress?.trim() || null,
    };
  }

  // ──────────────────────────────────
  //  Missing Destination Requests
  // ──────────────────────────────────

  async findAllRequests() {
    return this.prisma.missingDestinationRequest.findMany({
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, dni: true },
        },
        // Se incluye la dirección y el detalle del pedido para que el equipo
        // sepa exactamente a dónde va el envío antes de fijarle un precio.
        order: {
          select: {
            id: true,
            orderNumber: true,
            subtotal: true,
            shippingCost: true,
            total: true,
            createdAt: true,
            address: { select: { street: true, city: true, state: true } },
            items: { select: { productName: true, quantity: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Aplica un destino a la solicitud: marca la solicitud como resuelta y,
   * si hay un pedido asociado, le asigna el destino y recalcula el costo de
   * envío y el total (el pedido se había creado con envío S/ 0.00 "por cotizar").
   */
  private async applyDestinationToRequest(tx: any, requestId: string, destinationId: string) {
    const request = await tx.missingDestinationRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Solicitud de destino no encontrada');
    }

    const destination = await tx.shippingDestination.findUnique({ where: { id: destinationId } });
    if (!destination) {
      throw new NotFoundException('Destino de envío no encontrado');
    }

    await tx.missingDestinationRequest.update({
      where: { id: requestId },
      data: { status: 'RESOLVED' },
    });

    if (request.orderId) {
      const order = await tx.order.findUnique({ where: { id: request.orderId } });
      if (order) {
        const shippingCost = parseFloat(destination.price.toString());
        const total = parseFloat(order.subtotal.toString()) + shippingCost;

        await tx.order.update({
          where: { id: order.id },
          data: {
            shippingDestinationId: destination.id,
            shippingType: 'DESTINO_CONFIGURADO',
            shippingCost,
            total,
          },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: order.status,
            description: `Envío cotizado a ${destination.district || destination.province || destination.department}: S/ ${shippingCost.toFixed(2)}. Nuevo total: S/ ${total.toFixed(2)}.`,
          },
        });
      }
    }

    return destination;
  }

  async resolveRequest(id: string, destinationId?: string) {
    if (!destinationId) {
      // Sin destino sólo se archiva la solicitud (p. ej. si no hay cobertura).
      return this.prisma.missingDestinationRequest.update({
        where: { id },
        data: { status: 'RESOLVED' },
      });
    }

    return this.prisma.$transaction(async (tx) => this.applyDestinationToRequest(tx, id, destinationId));
  }

  /**
   * Crea un destino nuevo a partir de una solicitud y la resuelve en un solo
   * paso: el destino queda disponible en el checkout y el pedido pendiente
   * recibe su costo de envío real.
   */
  async resolveRequestWithNewDestination(
    requestId: string,
    data: {
      type: string;
      department?: string;
      province?: string;
      district?: string;
      agencyId?: string;
      agencyAddress?: string;
      price: number;
      estimatedDays?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.missingDestinationRequest.findUnique({ where: { id: requestId } });
      if (!request) {
        throw new NotFoundException('Solicitud de destino no encontrada');
      }
      if (request.status === 'RESOLVED') {
        throw new BadRequestException('Esta solicitud ya fue resuelta.');
      }

      const agencyFields = await this.resolveAgencyFields(tx, data);
      const destination = await tx.shippingDestination.create({
        data: { ...data, ...agencyFields, isActive: data.isActive ?? true } as any,
      });

      await this.applyDestinationToRequest(tx, requestId, destination.id);
      return destination;
    });
  }

  async createRequest(data: {
    requestedName: string;
    type: string;
    orderId?: string;
    customerId: string;
  }) {
    return this.prisma.missingDestinationRequest.create({ data });
  }
}
