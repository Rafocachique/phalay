import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Señal de "sigo trabajando".
 *
 * El reloj de inactividad vive en una cookie httpOnly que refresca el
 * middleware. Si alguien pasa 20 minutos llenando un formulario largo sin
 * navegar, el servidor la daría por inactiva; el panel llama a esta ruta
 * mientras detecte actividad real para que eso no ocurra.
 *
 * No hace nada por sí misma: el valor está en que el middleware se ejecuta
 * sobre esta ruta (está incluida en su matcher) y ahí se renueva la marca.
 */
export async function POST() {
  return new NextResponse(null, { status: 204 });
}
