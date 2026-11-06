import 'server-only';

/**
 * API pública (sin key) que hace syntax + MX + mailbox + disposable/role check.
 * Contrato real verificado en vivo (no coincide con el que describen algunos
 * tutoriales): { email, validations: { syntax, domain_exists, mx_records,
 * mailbox_exists, is_disposable, is_role_based }, score, status }.
 * status observado: VALID | DISPOSABLE | INVALID_DOMAIN | INVALID_FORMAT.
 */
const VALIDATOR_URL = 'https://rapid-email-verifier.fly.dev/api/validate';

interface RapidEmailValidatorResponse {
  email: string;
  validations: {
    syntax: boolean;
    domain_exists: boolean;
    mx_records: boolean;
    mailbox_exists: boolean;
    is_disposable: boolean;
    is_role_based: boolean;
  };
  score: number;
  status: string;
}

export interface EmailValidationResult {
  valid: boolean;
  /** Motivo listo para mostrar al usuario cuando valid=false. */
  reason?: string;
  raw?: RapidEmailValidatorResponse;
}

const BASIC_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Recorta espacios, normaliza a minúsculas y limita el largo antes de usar el email en cualquier lado. */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 254);
}

/**
 * Valida un correo contra Rapid Email Validator.
 * Bloquea: formato inválido, dominio sin MX, y correos desechables.
 * `blockRoleAccounts` (opcional) bloquea también admin@/info@/etc.
 * Si el servicio externo no responde, no bloqueamos el registro por eso:
 * devolvemos valid=true con reason='skipped_unavailable' para que quien
 * llama decida (por defecto dejamos pasar).
 */
export async function validateEmailAddress(
  rawEmail: string,
  options: { blockRoleAccounts?: boolean } = {},
): Promise<EmailValidationResult> {
  const email = sanitizeEmail(rawEmail);

  if (!BASIC_FORMAT.test(email)) {
    return { valid: false, reason: 'El correo electrónico no tiene un formato válido.' };
  }

  let data: RapidEmailValidatorResponse;
  try {
    const res = await fetch(`${VALIDATOR_URL}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return { valid: true, reason: 'skipped_unavailable' };
    }
    data = await res.json();
  } catch {
    return { valid: true, reason: 'skipped_unavailable' };
  }

  const { validations, status } = data;

  if (validations?.is_disposable) {
    return {
      valid: false,
      reason: 'No aceptamos correos temporales o desechables. Usa tu correo personal.',
      raw: data,
    };
  }

  if (options.blockRoleAccounts && validations?.is_role_based) {
    return {
      valid: false,
      reason: 'Usa un correo personal (no uno compartido como admin@ o info@).',
      raw: data,
    };
  }

  const acceptableStatus = status === 'VALID' || status === 'ACCEPT_ALL';
  if (!acceptableStatus) {
    return {
      valid: false,
      reason: 'No pudimos confirmar que este correo exista. Revisa que esté bien escrito.',
      raw: data,
    };
  }

  return { valid: true, raw: data };
}
