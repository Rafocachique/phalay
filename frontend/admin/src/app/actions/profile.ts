'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { getAuthHeader } from '@/lib/auth-header';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Cliente de Supabase que SÍ puede escribir cookies. Las cookies del panel son
 * httpOnly, así que el navegador no puede leer la sesión: todo lo que toque la
 * sesión (incluido cambiar la contraseña) tiene que pasar por el servidor.
 */
async function createWritableClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
            }),
          );
        },
      },
    },
  );
}

export interface UpdateProfileResult {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function updateOwnProfile(
  _prevState: any,
  formData: FormData,
): Promise<UpdateProfileResult> {
  const firstName = (formData.get('firstName') as string || '').trim();
  const lastName = (formData.get('lastName') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();
  const confirmPassword = (formData.get('confirmPassword') as string || '').trim();

  if (!firstName || !lastName) {
    return { error: 'El nombre y el apellido son obligatorios.' };
  }

  if (password || confirmPassword) {
    if (password !== confirmPassword) {
      return { error: 'Las contraseñas no coinciden.' };
    }
    if (password.length < 8) {
      return { error: 'La contraseña debe tener al menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return { error: 'La contraseña debe incluir mayúsculas, minúsculas y números.' };
    }
  }

  const supabase = await createWritableClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  }

  // 1. Nombre y apellido en nuestra BD (endpoint propio, no requiere SUPER_ADMIN).
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ firstName, lastName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.message || 'No pudimos guardar tus datos.' };
    }
  } catch {
    return { error: 'No pudimos conectar con el servidor. Intenta nuevamente.' };
  }

  // 2. Contraseña (opcional) contra Supabase, con la sesión del propio usuario.
  if (password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: `Tus datos se guardaron, pero la contraseña no: ${error.message}` };
    }
  }

  revalidatePath('/perfil');
  return {
    success: true,
    message: password
      ? 'Perfil y contraseña actualizados correctamente.'
      : 'Perfil actualizado correctamente.',
  };
}
