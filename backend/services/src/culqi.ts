export const CULQI_MIN_ORDER_CENTS = 600;
export const CULQI_MIN_CHARGE_CENTS = 300;

export function getCulqiMinimum(method: string): number {
  return (method === 'yape' ? CULQI_MIN_ORDER_CENTS : CULQI_MIN_CHARGE_CENTS) / 100;
}

export const culqiService = {
  getSecretKey() {
    return process.env.CULQI_SECRET_KEY;
  },

  async createOrder(data: {
    amount: number;
    currency_code: string;
    description: string;
    order_number: string;
    client_details: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
    expiration_date: number;
  }): Promise<string> {
    const secretKey = this.getSecretKey();
    if (!secretKey) {
      throw new Error('CULQI_SECRET_KEY no está configurado');
    }

    if (data.amount < CULQI_MIN_ORDER_CENTS) {
      throw new Error(
        `El monto mínimo para pagar con Yape es S/ ${(CULQI_MIN_ORDER_CENTS / 100).toFixed(2)}.`,
      );
    }

    const response = await fetch('https://api.culqi.com/v2/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(
        responseData.merchant_message || responseData.user_message || 'Error al comunicarse con Culqi',
      );
    }

    return responseData.id;
  },

  async createCharge(data: {
    amount: number;
    currency_code: string;
    email: string;
    source_id: string;
  }): Promise<any> {
    const secretKey = this.getSecretKey();
    if (!secretKey) {
      throw new Error('CULQI_SECRET_KEY no está configurado');
    }

    const response = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(
        responseData.merchant_message || responseData.user_message || 'Error al procesar el cargo en Culqi',
      );
    }

    return responseData;
  },
};
