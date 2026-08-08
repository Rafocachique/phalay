// =========================================
// Headers de Seguridad - CSP, OWASP Top 10
// =========================================

// Origen de la API derivado de env, sin IPs de LAN de desarrollo hardcodeadas.
function getApiOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  try {
    return new URL(apiUrl).origin;
  } catch {
    return 'http://localhost:4000';
  }
}

/**
 * Headers de seguridad para Next.js y NestJS
 * Cumple con OWASP Top 10
 */
export const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-inline' se mantiene porque Next.js App Router inyecta scripts
      // inline para hidratación/streaming (self.__next_f.push) sin infra de
      // nonces configurada; 'unsafe-eval' sí se retira porque no hace falta
      // en producción (sólo lo usaba el HMR de desarrollo). TODO: migrar a
      // CSP con nonce por request (soportado nativamente por Next.js) para
      // poder quitar también 'unsafe-inline'.
      `script-src 'self' 'unsafe-inline' https://checkout.culqi.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: https: ${getApiOrigin()}`,
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.culqi.com https://checkout.culqi.com ${getApiOrigin()}`,
      "frame-src 'self' https://checkout.culqi.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];
