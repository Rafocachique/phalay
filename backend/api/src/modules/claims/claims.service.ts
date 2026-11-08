import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

type ClaimInput = {
  type: 'RECLAMO' | 'QUEJA'; firstName: string; lastName: string;
  documentType: string; documentNumber: string; email: string; phone: string;
  address: string; isMinor?: boolean; guardianName?: string; productOrService: string;
  amount?: number | string; orderNumber?: string; detail: string; request: string;
};

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  private required(value: unknown, label: string, max = 200) {
    const clean = String(value ?? '').trim();
    if (!clean) throw new BadRequestException(`${label} es obligatorio.`);
    if (clean.length > max) throw new BadRequestException(`${label} es demasiado extenso.`);
    return clean;
  }

  async create(data: ClaimInput) {
    if (!['RECLAMO', 'QUEJA'].includes(data.type)) {
      throw new BadRequestException('Selecciona si es reclamo o queja.');
    }
    const email = this.required(data.email, 'El correo electrónico', 120).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('Ingresa un correo electrónico válido.');
    const phone = this.required(data.phone, 'El teléfono', 25).replace(/[^\d+ ]/g, '');
    const isMinor = Boolean(data.isMinor);
    const guardianName = isMinor ? this.required(data.guardianName, 'El nombre de la madre, padre o apoderado') : null;
    const amount = data.amount === undefined || data.amount === null || data.amount === '' ? null : Number(data.amount);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) throw new BadRequestException('El monto debe ser válido.');

    const payload = {
      type: data.type,
      firstName: this.required(data.firstName, 'El nombre'),
      lastName: this.required(data.lastName, 'El apellido'),
      documentType: this.required(data.documentType, 'El tipo de documento', 30),
      documentNumber: this.required(data.documentNumber, 'El número de documento', 30),
      email,
      phone,
      address: this.required(data.address, 'El domicilio', 300),
      isMinor,
      guardianName,
      productOrService: this.required(data.productOrService, 'El producto o servicio', 300),
      amount,
      orderNumber: String(data.orderNumber ?? '').trim().slice(0, 80) || null,
      detail: this.required(data.detail, 'El detalle', 3000),
      request: this.required(data.request, 'El pedido', 1500),
    };

    // El código no expone IDs internos y se entrega como constancia a la persona.
    for (let attempt = 0; attempt < 3; attempt++) {
      const claimNumber = `REC-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
      try {
        const claim = await this.prisma.consumerClaim.create({ data: { ...payload, claimNumber } });
        return { claimNumber: claim.claimNumber, createdAt: claim.createdAt };
      } catch (error: any) {
        if (error?.code !== 'P2002' || attempt === 2) throw error;
      }
    }
    throw new BadRequestException('No pudimos generar el código de constancia. Inténtalo nuevamente.');
  }

  async findAll() {
    return this.prisma.consumerClaim.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async answer(id: string, response: string, status: string) {
    if (!['PENDING', 'IN_PROGRESS', 'ANSWERED', 'CLOSED'].includes(status)) throw new BadRequestException('Estado no válido.');
    const existing = await this.prisma.consumerClaim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Registro no encontrado.');
    return this.prisma.consumerClaim.update({
      where: { id },
      data: { status, response: response?.trim() || null, respondedAt: response?.trim() ? new Date() : null },
    });
  }
}
