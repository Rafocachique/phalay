'use server';
import { getAuthHeader } from '@/lib/auth-header';

export type WaConversation = { id: string; customer_wa_id: string; mode: 'BOT' | 'WAITING' | 'HUMAN'; assigned_to: string | null; updated_at: string };
export type WaMessage = { id: string; direction: 'IN' | 'OUT'; body: string; state: string; created_at: string };
export type WaStatus = { databaseReady: boolean; webhookConfigured: boolean; phoneConfigured: boolean;
  sendConfigured: boolean; botEnabled: boolean; engineConfigured: boolean; callbackPath: string };

async function call<T>(path: string, body?: unknown): Promise<{ data?: T; error?: string }> {
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) return { error: 'Inicia sesión para acceder a WhatsApp.' };
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const response = await fetch(`${base}/whatsapp/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: typeof error.message === 'string' ? error.message : 'No se pudo completar la operación de WhatsApp.' };
    }
    return { data: await response.json() as T };
  } catch { return { error: 'No se pudo contactar al servicio de WhatsApp.' }; }
}

export async function whatsappStatus() { return call<WaStatus>('status'); }
export async function whatsappConversations() { return call<WaConversation[]>('conversations'); }
export async function whatsappMessages(id: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return { error: 'Conversación inválida.' };
  return call<WaMessage[]>(`conversations/${id}/messages`);
}
export async function whatsappMode(id: string, mode: 'BOT' | 'HUMAN') {
  if (!/^[a-f0-9-]{36}$/i.test(id) || !['BOT', 'HUMAN'].includes(mode)) return { error: 'Conversación inválida.' };
  return call<WaConversation>(`conversations/${id}/mode`, { mode });
}
export async function whatsappReply(id: string, message: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id) || typeof message !== 'string' || !message.trim() || message.length > 4096) {
    return { error: 'Escribe un mensaje de hasta 4096 caracteres.' };
  }
  return call<{ sent: boolean }>(`conversations/${id}/reply`, { message });
}
export async function whatsappProcess() { return call<{ processed: number; enabled: boolean }>('process', {}); }
