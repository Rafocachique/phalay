'use server';

import { getAuthHeader } from '@/lib/auth-header';

export type BotPreview = {
  answer: string;
  action: 'answer' | 'clarify' | 'handoff' | 'paused';
  reason: string;
  sources: string[];
  suggestions: string[];
  similarity: number;
};

export async function previewChatbot(message: string, humanActive: boolean): Promise<{ data?: BotPreview; error?: string }> {
  if (typeof message !== 'string' || !message.trim() || message.length > 2000 || typeof humanActive !== 'boolean') {
    return { error: 'Escribe una consulta de entre 1 y 2000 caracteres.' };
  }
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return { error: 'Inicia sesión para probar el asistente.' };
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const response = await fetch(`${base}/chatbot/preview`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, humanActive }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return { error: response.status === 403 ? 'Se requiere una cuenta de administrador.' :
        'No se pudo consultar el bot. Revisa la sesión y la configuración del servicio.' };
    }
    return { data: await response.json() as BotPreview };
  } catch {
    return { error: 'El servicio del chatbot no está disponible en este momento.' };
  }
}
