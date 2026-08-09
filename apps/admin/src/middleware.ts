import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Todo el panel admin requiere autenticación por defecto ("fail closed").
  // Sólo /login es público; cualquier ruta nueva queda protegida automáticamente.
  const publicRoutes = ['/login'];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Las cabeceras x-user-* las inyecta este middleware con datos ya validados.
  // Se limpian de la petición entrante para que nadie pueda falsificarlas
  // mandándolas a mano desde el navegador.
  const sanitizedHeaders = new Headers(request.headers);
  ['x-user-id', 'x-user-role', 'x-user-first-name', 'x-user-last-name', 'x-user-email'].forEach((h) =>
    sanitizedHeaders.delete(h),
  );

  if (isPublic) {
    return NextResponse.next({ request: { headers: sanitizedHeaders } });
  }

  // Gestión del equipo: crear cuentas (/register) y ver/editar usuarios (/users)
  // son exclusivos del SUPER_ADMIN. Ocultar el menú no basta: un ADMIN podría
  // escribir la URL a mano.
  const superAdminOnlyRoutes = ['/register', '/users'];
  const requiresSuperAdmin = superAdminOnlyRoutes.some(route => pathname.startsWith(route));

  let response = NextResponse.next({ request });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    // Sin sesión válida, redirigir a login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validación de rol y estado llamando al backend NestJS
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const verifyRes = await fetch(`${apiUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!verifyRes.ok) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.success || !verifyData.data) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const user = verifyData.data;
    if ((user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') || user.status !== 'ACTIVE') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (requiresSuperAdmin && user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Los Server Components leen estos datos con headers(), que devuelve las
    // cabeceras de la PETICIÓN. Ponerlas en la respuesta no sirve para eso.
    sanitizedHeaders.set('x-user-id', user.id);
    sanitizedHeaders.set('x-user-role', user.role);
    sanitizedHeaders.set('x-user-first-name', user.firstName || '');
    sanitizedHeaders.set('x-user-last-name', user.lastName || '');
    sanitizedHeaders.set('x-user-email', user.email || '');

    const finalResponse = NextResponse.next({ request: { headers: sanitizedHeaders } });
    // Conservar las cookies refrescadas por Supabase durante getSession().
    response.cookies.getAll().forEach((cookie) => finalResponse.cookies.set(cookie));
    return finalResponse;
  } catch (err) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
