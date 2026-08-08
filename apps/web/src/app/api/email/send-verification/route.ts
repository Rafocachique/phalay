import { NextRequest, NextResponse } from 'next/server';
import { sendAccountEmail } from '@/lib/email/sendAccountEmail';

/**
 * Endpoint genérico de ejemplo: valida el correo y, solo si pasa, envía el
 * correo de verificación por Resend. No genera el token — quien llama debe
 * pasar la URL de verificación ya armada (por ejemplo la que devuelve Supabase
 * o tu propio sistema de tokens).
 *
 * POST /api/email/send-verification
 * body: { email: string, firstName: string, actionUrl: string }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido (se esperaba JSON).' }, { status: 400 });
  }

  const { email, firstName, actionUrl } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || !email) {
    return NextResponse.json({ error: 'Falta el correo electrónico.' }, { status: 400 });
  }
  if (typeof firstName !== 'string' || !firstName) {
    return NextResponse.json({ error: 'Falta el nombre.' }, { status: 400 });
  }
  if (typeof actionUrl !== 'string' || !actionUrl) {
    return NextResponse.json({ error: 'Falta la URL de verificación.' }, { status: 400 });
  }

  const result = await sendAccountEmail({
    kind: 'verification',
    email,
    firstName,
    actionUrl,
  });

  if (!result.ok) {
    // 422 cuando el correo no pasó la validación (culpa del input, no del servidor);
    // 502 cuando Resend falló (culpa del proveedor externo).
    const status = result.step === 'validation' ? 422 : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, emailId: result.emailId });
}
