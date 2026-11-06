import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Obtiene el header Authorization con el JWT de la sesión admin actual,
 * para adjuntarlo a las llamadas server-side hacia la API NestJS.
 * Sin esto, las mutaciones llegan sin token y la API las rechaza (401)
 * ya que los endpoints de escritura requieren JwtGuard + RolesGuard.
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}
