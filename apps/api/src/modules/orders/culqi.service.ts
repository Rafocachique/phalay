import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * Monto mínimo que Culqi acepta para crear una ORDEN (S/ 6.00 = 600 céntimos).
 * Las Órdenes son obligatorias para Yape/PagoEfectivo; los cargos con tarjeta
 * no las necesitan y por eso tienen un mínimo más bajo.
 */
export const CULQI_MIN_ORDER_CENTS = 600;

/** Monto mínimo que Culqi acepta para un CARGO con tarjeta (S/ 3.00). */
export const CULQI_MIN_CHARGE_CENTS = 300;

/** Devuelve el mínimo en soles según el método de pago elegido. */
export function getCulqiMinimum(method: string): number {
  return (method === 'yape' ? CULQI_MIN_ORDER_CENTS : CULQI_MIN_CHARGE_CENTS) / 100;
}

@Injectable()
export class CulqiService {
  private readonly logger = new Logger(CulqiService.name);
  private readonly secretKey = process.env.CULQI_SECRET_KEY;
  private readonly baseUrl = 'https://api.culqi.com/v2';

  /**
   * Crea una Orden en Culqi (necesario para Checkout v4 con Yape/PagoEfectivo)
   */
  async createOrder(data: {
    amount: number; // En céntimos
    currency_code: string;
    description: string;
    order_number: string;
    client_details: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
    expiration_date: number; // Unix timestamp
  }): Promise<string> {
    if (!this.secretKey) {
      throw new Error('CULQI_SECRET_KEY no está configurado');
    }

    if (data.amount < CULQI_MIN_ORDER_CENTS) {
      throw new BadRequestException(
        `El monto mínimo para pagar con Yape es S/ ${(CULQI_MIN_ORDER_CENTS / 100).toFixed(2)}. ` +
        `Agrega más productos a tu pedido o paga con tarjeta.`,
      );
    }

    let responseData: any;
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      responseData = await response.json();

      if (!response.ok) {
        // Se propaga el mensaje real de Culqi (antes se tragaba y el cliente
        // sólo veía "error al conectar con la pasarela", imposible de depurar).
        this.logger.error('Error al crear orden en Culqi: ' + JSON.stringify(responseData));
        throw new BadRequestException(
          responseData.merchant_message || responseData.user_message || 'Error al comunicarse con Culqi',
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error de red al comunicarse con Culqi: ${error.message}`);
      throw new BadRequestException('No se pudo conectar con la pasarela de pagos. Intenta nuevamente.');
    }

    return responseData.id; // Retorna el order_id (ej. ord_live_0CjjdWhFpEAZlxlz)
  }

  /**
   * Crea un cargo usando un Token (tarjetas)
   */
  async createCharge(data: {
    amount: number;
    currency_code: string;
    email: string;
    source_id: string; // Token ID (tkn_xxx)
  }): Promise<any> {
    if (!this.secretKey) {
      throw new Error('CULQI_SECRET_KEY no está configurado');
    }

    let responseData: any;
    try {
      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      responseData = await response.json();

      if (!response.ok) {
        this.logger.error('Error al crear cargo en Culqi: ' + JSON.stringify(responseData));
        // user_message viene redactado para el comprador (ej. "tarjeta sin fondos");
        // es el mensaje correcto a mostrar en el checkout.
        throw new BadRequestException(
          responseData.user_message || responseData.merchant_message || 'Error al procesar el pago con Culqi',
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error de red al crear cargo en Culqi: ${error.message}`);
      throw new BadRequestException('No se pudo conectar con la pasarela de pagos. Intenta nuevamente.');
    }

    return responseData; // Retorna la info del cargo
  }
}
