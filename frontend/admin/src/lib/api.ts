/**
 * URL base de la API NestJS.
 *
 * Se resuelve desde NEXT_PUBLIC_API_URL para que cada entorno (local, staging,
 * producción) apunte a su propio backend. El fallback es localhost — nunca una
 * IP de la red del desarrollador, que rompería la app en cualquier otra máquina.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
