import 'server-only';
import { sanitizeEmail, validateEmailAddress } from './validateEmail';
import { sendEmail } from './resend';
import { accountVerificationEmail, passwordResetEmail, welcomeEmail } from './templates';

export type AccountEmailKind = 'verification' | 'password_reset' | 'welcome';

export interface SendAccountEmailInput {
  kind: AccountEmailKind;
  email: string;
  firstName: string;
  /**
   * Para 'verification'/'password_reset': URL con el token ya incluido (este
   * módulo no genera tokens). Para 'welcome': URL a la que debe llevar el botón
   * (p. ej. el catálogo) — no hay token porque no es un enlace de verificación.
   */
  actionUrl: string;
  /** Bloquea también admin@/info@/etc. Por defecto false: solo bloquea desechables. */
  blockRoleAccounts?: boolean;
}

export type SendAccountEmailResult =
  | { ok: true; emailId?: string }
  | { ok: false; step: 'validation' | 'send'; error: string };

/**
 * Orquesta: sanitizar -> validar con Rapid Email Validator -> si pasa, enviar con Resend.
 * Si la validación falla, NUNCA se llega a llamar a Resend.
 */
export async function sendAccountEmail(input: SendAccountEmailInput): Promise<SendAccountEmailResult> {
  const email = sanitizeEmail(input.email);

  const validation = await validateEmailAddress(email, { blockRoleAccounts: input.blockRoleAccounts });
  if (!validation.valid) {
    return { ok: false, step: 'validation', error: validation.reason || 'Correo inválido.' };
  }

  const { subject, html } =
    input.kind === 'verification'
      ? accountVerificationEmail({ firstName: input.firstName, verifyUrl: input.actionUrl })
      : input.kind === 'password_reset'
        ? passwordResetEmail({ firstName: input.firstName, resetUrl: input.actionUrl })
        : welcomeEmail({ firstName: input.firstName, shopUrl: input.actionUrl });

  const result = await sendEmail({ to: email, subject, html });
  if (!result.success) {
    return { ok: false, step: 'send', error: result.error || 'No se pudo enviar el correo.' };
  }

  return { ok: true, emailId: result.id };
}
