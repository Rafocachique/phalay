import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// La subida ocurre en el servidor y tras verificar la sesión de admin, así que
// se usa la service role key: la anon key no puede escribir en Storage por RLS
// y eso hacía que todo cayera al respaldo base64 (imágenes enteras en la BD).
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

async function requireAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
  const verifyRes = await fetch(`${apiUrl}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: session.access_token }),
  });
  if (!verifyRes.ok) return false;

  const verifyData = await verifyRes.json();
  const user = verifyData?.data;
  return !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && user.status === 'ACTIVE';
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdminSession())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo permitido (8MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 1. Intentar subir a Supabase Storage si está configurado y el bucket existe
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        // Attempt upload; if bucket missing, create it
        let uploadResult = await supabase.storage.from('images').upload(filename, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
          // Create bucket then retry
          await supabase.storage.createBucket('images', { public: true });
          uploadResult = await supabase.storage.from('images').upload(filename, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });
        }
        const { data, error } = uploadResult;
        if (!error && data) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename);
          return NextResponse.json({ url: urlData.publicUrl });
        }
      } catch (err) {
        console.error('Error al subir a Supabase Storage, usando fallback local:', err);
      }
    }

    // 2. Fallback: Guardar localmente en el directorio public/uploads
    // Para asegurar que la web también pueda leerlo, podemos retornar la ruta relativa o una URL base64 de alta calidad.
    // Devolver una data URL (Base64) de la imagen es el fallback más universal para Next.js local sin configurar storage,
    // ya que no requiere sincronización de carpetas de disco entre Turborepo apps (admin y web) en diferentes puertos.
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    // Intentar también guardarlo físicamente en la carpeta public por si se requiere persistencia real en disco
    try {
      const publicDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(publicDir, { recursive: true });
      const filePath = path.join(publicDir, filename);
      await fs.writeFile(filePath, buffer);
      
      // Si se guardó en local, podemos retornar la url del puerto local.
      // Pero como Next.js Web corre en el 3000 y Admin en el 3001, la dataURL es más segura.
      // Retornemos la URL local o la dataURL según convenga.
      // Retornamos la dataUrl para compatibilidad absoluta instantánea:
      return NextResponse.json({ url: dataUrl });
    } catch {
      return NextResponse.json({ url: dataUrl });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error en la subida' }, { status: 500 });
  }
}
