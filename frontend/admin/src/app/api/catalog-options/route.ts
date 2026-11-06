import { NextResponse } from 'next/server';
import { getCatalogOptions } from '@/lib/catalog-data';

export const dynamic = 'force-dynamic';

/**
 * Proxy del mismo origen para tipos de prenda y colecciones.
 *
 * Las páginas que son client components no pueden recibirlos como props del
 * servidor, y si piden la API directamente desde el navegador chocan con CORS
 * en producción. Llamando a esta ruta (mismo origen) el fetch real ocurre en el
 * servidor de Next, donde CORS no aplica.
 */
export async function GET() {
  const options = await getCatalogOptions();
  return NextResponse.json(options, {
    status: options.failed ? 502 : 200,
  });
}
