import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function safeRedirectPath(target: string | null, fallback: string): string {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  return target;
}

/**
 * Adonde Supabase manda de vuelta tras el login con Google (u otros
 * proveedores OAuth que se agreguen después). Intercambia el código por una
 * sesión y sincroniza el usuario con nuestra BD — con emailVerified=true,
 * porque Google ya confirmó ese correo por nosotros.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = safeRedirectPath(searchParams.get('redirect_to'), '/es/catalogo');

  if (!code) {
    return NextResponse.redirect(`${origin}/es/auth/login?error=oauth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/es/auth/login?error=oauth`);
  }

  const meta = data.user.user_metadata || {};
  const [firstName, ...rest] = (meta.full_name || meta.name || '').split(' ');

  try {
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseAuthId: data.user.id,
        email: data.user.email,
        firstName: firstName || 'Cliente',
        lastName: rest.join(' ') || '',
      }),
    });
  } catch (err) {
    console.warn('No se pudo sincronizar el usuario de Google con la BD:', err);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
