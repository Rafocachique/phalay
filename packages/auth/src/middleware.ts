// =========================================
// Middleware de Autenticación para Next.js
// =========================================

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ['/cuenta', '/account', '/pedidos', '/orders'];
const SELLER_ROUTES = ['/seller', '/vendedor'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/registro', '/register'];

/**
 * Middleware de autenticación y autorización.
 * Renueva tokens automáticamente y protege rutas sensibles.
 */
export async function authMiddleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            }),
          );
        },
      },
    },
  );

  // Refrescar sesión automáticamente
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Redirigir usuarios autenticados fuera de login/registro
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isSellerRoute = SELLER_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isProtected =
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) || isSellerRoute || isAdminRoute;

  if (!isProtected) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Las rutas de admin/seller además requieren el rol correspondiente.
  // El rol vive en nuestra BD (no en Supabase Auth), así que se valida
  // contra el backend en vez de confiar en metadata del propio usuario.
  if (isAdminRoute || isSellerRoute) {
    const role = user.app_metadata?.role ?? user.user_metadata?.role;
    const requiredRoles = isAdminRoute ? ['ADMIN', 'SUPER_ADMIN'] : ['SELLER', 'ADMIN', 'SUPER_ADMIN'];
    if (!role || !requiredRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}
