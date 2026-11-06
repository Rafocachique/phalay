import createMiddleware from 'next-intl/middleware';
import { i18nConfig } from '@phalay/i18n';
import { updateSession } from './lib/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(i18nConfig);

export default async function middleware(request: NextRequest) {
  // 1. Ejecutamos el middleware de internacionalización (next-intl)
  const intlResponse = intlMiddleware(request);

  // 2. Ejecutamos el middleware de Supabase pasando la respuesta de next-intl
  // Esto asegura que las cookies de sesión se refresquen sin romper las redirecciones de idioma
  const { response: authResponse, user } = await updateSession(request, intlResponse);

  // 3. Proteger rutas que requieren autenticación
  const pathname = request.nextUrl.pathname;

  // El prefijo de idioma es opcional para el idioma por defecto
  // (localePrefix: 'as-needed'), así que /checkout y /es/checkout son la misma
  // ruta. Sólo se quita el primer segmento si de verdad es un idioma; antes se
  // quitaba siempre y "/checkout" quedaba sin protección.
  const firstSegment = pathname.split('/')[1] ?? '';
  const hasLocalePrefix = (i18nConfig.locales as readonly string[]).includes(firstSegment);
  const locale = hasLocalePrefix ? firstSegment : i18nConfig.defaultLocale;
  const pathnameWithoutLocale = hasLocalePrefix
    ? pathname.slice(firstSegment.length + 1) || '/'
    : pathname;

  // Si ya inició sesión, no tiene sentido mostrarle login/registro.
  if (user && /^\/auth\/(login|registro)/.test(pathnameWithoutLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = '';
    return Response.redirect(url);
  }

  // El checkout exige una sesión REAL: `user` viene de getUser(), que valida el
  // token contra Supabase. Antes bastaba con que existiera una cookie cuyo
  // nombre contuviera "-auth-token", lo cual era trivial de falsificar.
  if (!user && pathnameWithoutLocale.startsWith('/checkout') && pathnameWithoutLocale !== '/checkout/success') {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set('redirect_to', pathname);
    return Response.redirect(url);
  }

  return authResponse;
}

export const config = {
  // Interceptar todas las rutas excepto api, _next, y archivos estáticos
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
