import { Controller, Post, Body, Req, Query, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { CulqiService, getCulqiMinimum } from '../orders/culqi.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly culqiService: CulqiService,
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Crea una Orden en Culqi. Sólo es necesaria para Yape (los pagos con
   * tarjeta usan token + cargo directo y no requieren Orden).
   * El monto se recalcula en el servidor a partir del carrito, para que el
   * popup de Culqi muestre exactamente lo que después se cobrará.
   */
  @Post('culqi-order')
  @ApiOperation({ summary: 'Genera una orden en Culqi (para pagos con Yape)' })
  async createCulqiOrder(
    @Body() dto: {
      items: any[];
      shippingDestinationId?: string;
      email: string;
      name: string;
      phone: string;
    },
  ) {
    if (!dto.email) {
      throw new BadRequestException('El correo es obligatorio para generar la orden de pago.');
    }

    const { total } = await this.ordersService.calculateTotals(dto.items, dto.shippingDestinationId);

    const culqiOrderId = await this.culqiService.createOrder({
      amount: Math.round(total * 100), // a céntimos
      currency_code: 'PEN',
      description: 'Compra en PHALAY',
      order_number: `PH-${Date.now()}`,
      client_details: {
        first_name: dto.name || 'Cliente',
        last_name: 'Phalay',
        email: dto.email,
        phone_number: dto.phone || '999999999',
      },
      expiration_date: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
    });

    return { success: true, orderId: culqiOrderId, amount: total };
  }

  /**
   * Devuelve el total calculado por el servidor. El checkout lo usa para
   * abrir el popup de tarjeta con el monto correcto sin crear una Orden,
   * y para saber si el pedido alcanza el mínimo que exige la pasarela.
   */
  @Post('quote')
  @ApiOperation({ summary: 'Calcula el total real del carrito en el servidor' })
  async quote(@Body() dto: { items: any[]; shippingDestinationId?: string; method?: string }) {
    const totals = await this.ordersService.calculateTotals(dto.items, dto.shippingDestinationId);

    if (dto.method === 'tarjeta' || dto.method === 'yape') {
      const minimum = getCulqiMinimum(dto.method);
      if (totals.total < minimum) {
        throw new BadRequestException(
          `El monto mínimo para pagar con ${dto.method === 'yape' ? 'Yape' : 'tarjeta'} es S/ ${minimum.toFixed(2)}. ` +
          `Tu pedido suma S/ ${totals.total.toFixed(2)} — agrega más productos para continuar.`,
        );
      }
    }

    return totals;
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook para recibir eventos de Culqi' })
  async culqiWebhook(@Req() req: Request, @Query('secret') secret: string) {
    // Culqi no firma el payload por defecto: la mitigación recomendada es
    // registrar la URL del webhook con un secreto en el query string
    // (?secret=...) y validarlo aquí antes de confiar en el body.
    const expectedSecret = this.config.get<string>('CULQI_WEBHOOK_SECRET');
    if (!expectedSecret) {
      throw new UnauthorizedException('Webhook de Culqi no configurado');
    }
    const provided = Buffer.from(secret || '');
    const expected = Buffer.from(expectedSecret);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const event = req.body;

    // Culqi envía un objeto JSON con type y data
    if (event.object === 'event') {
      console.log('Webhook de Culqi recibido:', event.type);
      
      if (event.type === 'order.status.changed' || event.type === 'charge.creation.succeeded') {
        // Obtenemos el ID de la orden interna o el cargo
        // En Culqi Checkout, cuando un cargo es exitoso, podemos buscar la orden
        // por el id del order_id en metadata o directamente
      }
    }
    
    // Siempre respondemos 200 OK para que Culqi no reintente
    return { received: true };
  }
}
