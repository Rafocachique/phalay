import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async subscribe(input: { email?: string; website?: string; consent?: boolean }) {
    // Campo honeypot: los visitantes reales no lo ven. No revelamos el filtro.
    if (String(input.website || '').trim()) {
      return { success: true, message: 'Revisa tu correo para conocer nuestras novedades.' };
    }

    const email = String(input.email || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || email.length > 120) {
      throw new BadRequestException('Ingresa un correo electrónico válido.');
    }
    if (input.consent !== true) {
      throw new BadRequestException('Debes aceptar la Política de Privacidad para suscribirte.');
    }

    const subscriber = await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, status: 'ACTIVE', source: 'FOOTER' },
      update: { status: 'ACTIVE', unsubscribedAt: null, consentAt: new Date() },
    });

    // El registro no depende del correo. Si Resend todavía no está configurado,
    // la persona queda suscrita y no se finge que se envió un mensaje.
    const emailSent = await this.sendWelcomeEmail(email);
    return {
      success: true,
      message: emailSent
        ? '¡Listo! Revisa tu correo para conocer nuestras novedades.'
        : '¡Listo! Tu correo quedó registrado para recibir novedades.',
      subscribedAt: subscriber.subscribedAt,
    };
  }

  async list() {
    return this.prisma.newsletterSubscriber.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, email: true, source: true, consentAt: true, subscribedAt: true },
      orderBy: { subscribedAt: 'desc' },
      take: 500,
    });
  }

  private async sendWelcomeEmail(to: string): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) return false;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [to],
          subject: 'Bienvenida al boletín de PHALAY',
          html: '<h1>¡Bienvenida a PHALAY!</h1><p>Tu suscripción a novedades y lanzamientos exclusivos quedó registrada.</p>',
        }),
      });
      if (!response.ok) {
        this.logger.warn(`No se pudo enviar el correo de bienvenida (${response.status}).`);
        return false;
      }
      return true;
    } catch {
      this.logger.warn('No se pudo conectar con el proveedor de correo para el boletín.');
      return false;
    }
  }
}
