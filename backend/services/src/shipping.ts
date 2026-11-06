import { prisma } from '@phalay/database';

export const shippingService = {
  async resolveAgencyFields(data: any) {
    if (data.type === 'AGENCY') {
      let agencyName = null;
      let agencyAddress = data.agencyAddress || null;
      if (data.agencyId) {
        const agency = await prisma.shippingAgency.findUnique({
          where: { id: data.agencyId },
        });
        if (agency) {
          agencyName = agency.name;
        }
      }
      return {
        agencyId: data.agencyId || null,
        agencyName,
        agencyAddress,
      };
    }
    return {
      agencyId: null,
      agencyName: null,
      agencyAddress: null,
    };
  },

  async findAll(onlyActive = false) {
    return prisma.shippingDestination.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ type: 'asc' }, { department: 'asc' }, { district: 'asc' }],
      include: { agency: { select: { id: true, name: true, trackingUrl: true } } },
    });
  },

  async findOne(id: string) {
    const dest = await prisma.shippingDestination.findUnique({ where: { id } });
    if (!dest) throw new Error('Destino de envío no encontrado');
    return dest;
  },

  async create(data: any) {
    const agencyFields = await this.resolveAgencyFields(data);
    return prisma.shippingDestination.create({
      data: { ...data, ...agencyFields },
    });
  },

  async update(id: string, data: any) {
    const current = await this.findOne(id);
    const agencyFields = await this.resolveAgencyFields({
      ...data,
      type: data.type ?? current.type,
    });
    return prisma.shippingDestination.update({
      where: { id },
      data: { ...data, ...agencyFields },
    });
  },

  async remove(id: string) {
    return prisma.shippingDestination.delete({ where: { id } });
  },

  async findAllAgencies(onlyActive = false) {
    return prisma.shippingAgency.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { destinations: true } } },
    });
  },

  async createAgency(data: { name: string; trackingUrl?: string; contactPhone?: string; isActive?: boolean }) {
    const name = String(data.name || '').trim();
    if (!name) throw new Error('El nombre de la agencia es obligatorio.');

    const existing = await prisma.shippingAgency.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new Error(`Ya existe una agencia registrada como "${existing.name}".`);
    }

    return prisma.shippingAgency.create({
      data: {
        name,
        trackingUrl: data.trackingUrl?.trim() || null,
        contactPhone: data.contactPhone?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });
  },

  async updateAgency(id: string, data: any) {
    const agency = await prisma.shippingAgency.findUnique({ where: { id } });
    if (!agency) throw new Error('Agencia no encontrada');

    return prisma.shippingAgency.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        trackingUrl: data.trackingUrl !== undefined ? data.trackingUrl?.trim() || null : undefined,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone?.trim() || null : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });
  },

  async removeAgency(id: string) {
    return prisma.shippingAgency.delete({ where: { id } });
  },

  async findAllRequests() {
    return prisma.missingDestinationRequest.findMany({
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, dni: true },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            subtotal: true,
            shippingCost: true,
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async createRequest(data: any) {
    return prisma.missingDestinationRequest.create({
      data: {
        requestedName:
          data.requestedName ||
          `${data.department || ''} - ${data.province || ''} - ${data.district || ''}`.trim() ||
          'Destino no especificado',
        type: data.type || 'PROVINCIA',
        orderId: data.orderId || null,
        customerId: data.customerId,
      },
    });
  },

  async resolveRequest(id: string, _destinationId?: string) {
    return prisma.missingDestinationRequest.update({
      where: { id },
      data: {
        status: 'RESOLVED',
      },
    });
  },

  async resolveRequestWithNewDestination(id: string, body: any) {
    const dest = await this.create(body);
    await this.resolveRequest(id, dest.id);
    return dest;
  },
};
