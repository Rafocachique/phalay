import { prisma } from '@phalay/database';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomInt, createHash, timingSafeEqual } from 'crypto';

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL o Service Role Key no configurada');
  }
  return createClient(url, key);
}

export async function sendVerificationEmailViaResend(params: {
  to: string;
  firstName: string;
  code: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'PHALAY <onboarding@resend.dev>';

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY no configurado' };
  }

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F8F8F8;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#8B5A5A;">PHALAY</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 40px 32px;color:#1a1a1a;">
                <h1 style="font-size:20px;margin:0 0 16px 0;">Hola, ${params.firstName} 👋</h1>
                <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 24px 0;">
                  Usa este código para confirmar tu cuenta en PHALAY. Vence en 15 minutos.
                </p>
                <div style="background:#F8F8F8;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px 0;">
                  <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#8B5A5A;">${params.code}</span>
                </div>
                <p style="font-size:12px;color:#999;margin:0;">Si tú no creaste esta cuenta, puedes ignorar este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: `${params.code} es tu código de verificación de PHALAY`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body?.message || `Resend respondió ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al enviar correo' };
  }
}

export const authService = {
  /**
   * Verifica un token JWT de Supabase y obtiene el usuario en Postgres
   */
  async verifyToken(token: string) {
    try {
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data, error } = await anonClient.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { supabaseAuthId: data.user.id },
      });

      return user;
    } catch {
      return null;
    }
  },

  /**
   * Registra o sincroniza un usuario nuevo
   */
  async registerUser(data: {
    supabaseAuthId: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const supabase = getSupabaseAdmin();
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      data.supabaseAuthId,
    );

    if (authError || !authUser?.user) {
      throw new Error('La cuenta de autenticación no existe.');
    }

    const authEmail = (authUser.user.email || '').toLowerCase();
    const email = (data.email || '').trim().toLowerCase();
    if (!authEmail || authEmail !== email) {
      throw new Error('El correo no corresponde a la cuenta de autenticación.');
    }

    const providers: string[] = authUser.user.app_metadata?.providers || [];
    const verifiedByProvider = providers.some((p) => p !== 'email');

    const existingById = await prisma.user.findUnique({
      where: { supabaseAuthId: data.supabaseAuthId },
    });

    if (existingById) {
      return existingById;
    }

    const existingByEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingByEmail) {
      const updated = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          supabaseAuthId: data.supabaseAuthId,
          status: 'ACTIVE',
          ...(verifiedByProvider ? { emailVerified: true } : {}),
        },
      });
      return updated;
    }

    return prisma.user.create({
      data: {
        supabaseAuthId: data.supabaseAuthId,
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: verifiedByProvider,
      },
    });
  },

  async updateOwnProfile(userId: string, data: { firstName: string; lastName: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { firstName: data.firstName, lastName: data.lastName },
    });

    try {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.updateUserById(updated.supabaseAuthId, {
        user_metadata: { first_name: data.firstName, last_name: data.lastName },
      });
    } catch {
      // Ignorar si falla la sincronización con el metadata de Supabase
    }

    return { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email };
  },

  async generateAndSendVerificationCode(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true };
    }
    if (user.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    const code = randomInt(100000, 1000000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: hashCode(code),
        verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        verificationAttempts: 0,
      },
    });

    const emailResult = await sendVerificationEmailViaResend({
      to: user.email,
      firstName: user.firstName,
      code,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    return { success: true };
  },

  async verifyEmailCode(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'No encontramos una cuenta con ese correo.' };
    }
    if (user.emailVerified) {
      return { success: true };
    }
    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return { success: false, error: 'No hay un código pendiente. Solicita uno nuevo.' };
    }
    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      return { success: false, error: 'Tu código venció. Solicita uno nuevo.' };
    }
    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return { success: false, error: 'Demasiados intentos fallidos. Solicita un código nuevo.' };
    }

    const providedHash = hashCode(code.trim());
    const storedHash = user.verificationCode;

    const matches =
      providedHash.length === storedHash.length &&
      timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));

    if (!matches) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } },
      });
      return { success: false, error: 'Código incorrecto.' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
      },
    });

    return { success: true };
  },
};
