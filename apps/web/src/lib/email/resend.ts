import 'server-only';
import { Resend } from 'resend';

// Nunca importar este módulo desde un componente cliente: 'server-only' lo
// hace fallar en build si alguien lo intenta, para que la API key jamás
// termine en el bundle del navegador.

let client: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no está configurada en las variables de entorno.');
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Por defecto usa RESEND_FROM_EMAIL. Debe ser un dominio verificado en Resend. */
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailInput): Promise<SendEmailResult> {
  const fromAddress = from || process.env.RESEND_FROM_EMAIL;
  if (!fromAddress) {
    return { success: false, error: 'No hay un remitente configurado (RESEND_FROM_EMAIL).' };
  }

  try {
    const { data, error } = await getClient().emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      // Resend devuelve error.name (p. ej. 'validation_error', 'missing_api_key')
      // y error.message con el detalle (dominio no verificado, etc.).
      return { success: false, error: error.message || 'Resend rechazó el envío del correo.' };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al enviar el correo.';
    return { success: false, error: message };
  }
}
