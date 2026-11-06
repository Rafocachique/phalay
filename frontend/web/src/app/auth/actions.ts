'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { validateEmailAddress } from '@/lib/email/validateEmail';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Devuelve una ruta interna segura para redirigir tras autenticarse.
 * Sólo se aceptan rutas relativas del propio sitio: así un `redirect_to`
 * manipulado no puede llevar a la clienta a un dominio externo (open redirect).
 */
function safeRedirectPath(target: string | null, fallback: string): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}

export async function login(_prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirect_to') as string | null;

  if (!email || !password) {
    return { error: 'Por favor, ingresa correo y contraseña.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let msg = error.message;
    if (msg.toLowerCase().includes('invalid login credentials')) {
      msg = 'Correo electrónico o contraseña incorrectos.';
    } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
      msg = 'Este correo electrónico ya se encuentra registrado.';
    } else if (msg.toLowerCase().includes('password should be')) {
      msg = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (msg.toLowerCase().includes('rate limit')) {
      msg = 'Has realizado demasiados intentos. Por favor espera un momento.';
    } else if (msg.toLowerCase().includes('email validation') || msg.toLowerCase().includes('confirm your email')) {
      msg = 'Por favor confirma tu dirección de correo electrónico.';
    }
    return { error: msg };
  }

  // Cuentas creadas pero nunca verificadas no deben poder navegar la tienda:
  // las mandamos a terminar la verificación en vez de dejarlas pasar.
  // OJO: redirect() lanza una excepción especial de Next.js — nunca debe
  // llamarse dentro de un try/catch o ese catch se la comería.
  let needsVerification = false;
  try {
    const meRes = data.session?.access_token
      ? await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: 'no-store',
        })
      : null;
    if (meRes?.ok) {
      const { data: profile } = await meRes.json();
      needsVerification = profile?.emailVerified === false;
    }
  } catch (err) {
    console.warn('No se pudo verificar el estado de la cuenta:', err);
  }

  if (needsVerification) {
    await supabase.auth.signOut();
    redirect(`/es/auth/verificar?email=${encodeURIComponent(email)}`);
  }

  // Volvemos a donde la clienta quería ir (p. ej. el checkout) o al catálogo.
  // La ruta lleva locale porque next-intl lo exige en todas las URLs.
  redirect(safeRedirectPath(redirectTo, '/es/catalogo'));
}

export async function signup(_prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  if (!email || !password || !confirmPassword || !firstName || !lastName) {
    return { error: 'Por favor, completa todos los campos requeridos.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' };
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  // Bloqueamos correos desechables/inexistentes antes de crear nada en Supabase.
  // No bloqueamos cuentas de rol (admin@, info@) por defecto: puede ser una
  // clienta legítima usando el correo de su negocio.
  const emailCheck = await validateEmailAddress(email, { blockRoleAccounts: false });
  if (!emailCheck.valid) {
    return { error: emailCheck.reason || 'El correo electrónico no es válido.' };
  }

  const supabase = await createClient();

  // Guardamos datos adicionales en el metadata de Auth. El rol nunca se define
  // aquí: es la API quien decide (siempre CUSTOMER en el registro público).
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (authError) {
    let msg = authError.message;
    if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
      msg = 'Este correo electrónico ya se encuentra registrado.';
    } else if (msg.toLowerCase().includes('password should be')) {
      msg = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (msg.toLowerCase().includes('rate limit')) {
      msg = 'Has realizado demasiados intentos de registro. Espera un momento.';
    }
    return { error: msg };
  }

  // Si el signup fue exitoso, sincronizar el usuario con nuestra BD.
  // El rol NO se envía: la API siempre crea al usuario como CUSTOMER y sólo un
  // SUPER_ADMIN puede elevar permisos después.
  if (authData.user?.id) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseAuthId: authData.user.id,
          email,
          firstName,
          lastName,
        }),
      });

      if (!res.ok) {
        return { error: 'Tu cuenta se creó, pero no pudimos activarla. Escríbenos para ayudarte.' };
      }
    } catch (error) {
      console.error('Error registrando usuario en BD:', error);
      return { error: 'No pudimos conectar con el servidor. Intenta nuevamente en unos minutos.' };
    }
  }

  // Enviamos nuestro propio código de 6 dígitos por Resend (no el enlace feo
  // de Supabase). La cuenta queda con emailVerified=false hasta que lo confirme
  // en /auth/verificar — sin importar si Supabase ya le dio sesión o no.
  try {
    await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    console.warn('No se pudo enviar el código de verificación:', error);
  }

  redirect(`/es/auth/verificar?email=${encodeURIComponent(email)}`);
}

export async function verifyAccountCode(_prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const code = formData.get('code') as string;

  if (!email || !code) {
    return { error: 'Ingresa el código que te enviamos.' };
  }

  const res = await fetch(`${API_BASE_URL}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.message || 'Código incorrecto.' };
  }

  // Este proyecto de Supabase exige confirmar el correo, así que signUp() no
  // dejó sesión activa. En vez de mandarla a loguearse de nuevo con su
  // contraseña, generamos una sesión real ahora que ya confirmó su cuenta.
  try {
    const admin = createAdminClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    const hashedToken = linkData?.properties?.hashed_token;
    if (!linkError && hashedToken) {
      const supabase = await createClient();
      // Sólo token_hash + type: mandar `email` junto con token_hash hace que
      // Supabase rechace la petición ("Only the token_hash and type should be provided").
      const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: hashedToken, type: 'magiclink' });
      if (otpError) {
        console.warn('verifyOtp falló al iniciar sesión automáticamente:', otpError.message);
      }
    } else if (linkError) {
      console.warn('generateLink falló al iniciar sesión automáticamente:', linkError.message);
    }
  } catch (err) {
    console.warn('No se pudo iniciar sesión automáticamente tras verificar:', err);
  }

  redirect('/es/catalogo');
}

export async function resendVerificationCode(email: string): Promise<{ error?: string }> {
  if (!email) return { error: 'Falta el correo electrónico.' };

  const res = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body?.message || 'No pudimos reenviar el código.' };
  }

  return {};
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/es/auth/login');
}
