import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';

// La lógica y autorización se ejecutan únicamente en la API independiente.
async function proxy(req: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  const base = process.env.BACKEND_API_URL || 'http://localhost:4000/api/v1';
  const target = new URL(base.replace(/\/$/, '') + '/' + route.map(encodeURIComponent).join('/'));
  if (target.origin === req.nextUrl.origin) {
    return Response.json({ message: 'BACKEND_API_URL debe apuntar al backend independiente.' }, { status: 503 });
  }
  target.search = req.nextUrl.search;
  const headers = new Headers();
  for (const name of ['authorization', 'content-type', 'x-request-id']) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(target, {
      method: req.method, headers, cache: 'no-store', redirect: 'manual',
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
      signal: AbortSignal.timeout(30000),
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    const type = upstream.headers.get('content-type');
    if (type) responseHeaders.set('content-type', type);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: 'El backend no está disponible.' }, { status: 502 });
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE, proxy as OPTIONS };
