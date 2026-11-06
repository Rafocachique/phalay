import { createClient as createBrowserClient } from './supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Función base para hacer peticiones al backend NestJS.
 * Automáticamente inyecta el token de Supabase en los headers si hay una sesión activa.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  let token: string | undefined = undefined;

  if (typeof window !== 'undefined') {
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
      }
    } catch (e) {
      console.warn('Error fetching session in browser:', e);
    }
  } else {
    try {
      const { createClient: createServerClient } = await import('./supabase/server');
      const supabase = await createServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
      }
    } catch (e) {
      // Ignorar si no se puede obtener la sesión (ej. en Next.js build time o estático)
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error en la petición a la API');
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
