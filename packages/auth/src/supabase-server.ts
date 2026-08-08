// =========================================
// Cliente Supabase para el Servidor (SSR)
// =========================================

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crea cliente Supabase para Server Components y Route Handlers.
 * Maneja cookies de forma segura con HttpOnly y SameSite=Lax.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              }),
            );
          } catch {
            // Se ignora en Server Components (solo lectura)
          }
        },
      },
    },
  );
}
