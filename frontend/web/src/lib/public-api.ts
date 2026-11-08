/**
 * Cliente exclusivo para componentes de servidor de la tienda.
 *
 * La tienda nunca debe importar servicios del backend: esos servicios usan
 * Prisma y credenciales de servidor, y Webpack intentaría incluirlos en el
 * build de Next.js. Toda lectura pública pasa por la API independiente.
 */
function getApiBaseUrl(): string {
  const configured = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

  // Durante la migración puede quedar una variable antigua en Vercel. No se
  // permite que una página de producción vuelva a Render por accidente.
  if (process.env.VERCEL && (!configured || /\.onrender\.com/i.test(configured))) {
    return 'https://phalay-api.vercel.app/api/v1';
  }

  return configured || 'http://localhost:4000/api/v1';
}

export async function fetchPublicApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, { cache: 'no-store' });
    return response.ok ? await response.json() as T : fallback;
  } catch {
    return fallback;
  }
}
