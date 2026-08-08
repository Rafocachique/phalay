import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Todo el panel admin requiere autenticación por defecto ("fail closed").
  // Sólo /login es público; cualquier ruta nueva queda protegida automáticamente.
  const publicRoutes = ['/login'];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isPublic) {
    return NextResponse.next();
  }

  // /register crea cuentas de administrador: sólo un SUPER_ADMIN ya autenticado puede acceder.
  const superAdminOnlyRoutes = ['/register'];
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

    // Pass user data to Server Components via headers
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-user-first-name', user.firstName || '');
    response.headers.set('x-user-last-name', user.lastName || '');
    response.headers.set('x-user-email', user.email || '');
  } catch (err) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
