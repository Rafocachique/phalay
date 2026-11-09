import { createHmac, timingSafeEqual } from 'node:crypto';

export function equalSecret(actual: string | undefined, expected: string | undefined): boolean {
  if (typeof actual !== 'string' || typeof expected !== 'string' || !actual || !expected) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validSignature(raw: Buffer | undefined, signature: string | undefined, secret: string | undefined): boolean {
  if (!raw || !secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return equalSecret(signature, `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`);
}

export type IncomingMessage = { id: string; customer: string; phoneId: string; body: string; at: Date; text: boolean };

export function parseMessages(payload: any, phoneId: string): IncomingMessage[] {
  if (payload?.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) return [];
  const result: IncomingMessage[] = [];
  for (const entry of payload.entry.slice(0, 100)) {
    if (!Array.isArray(entry?.changes)) continue;
    for (const change of entry.changes.slice(0, 100)) {
      const value = change?.value;
      if (change?.field !== 'messages' || value?.metadata?.phone_number_id !== phoneId || !Array.isArray(value.messages)) continue;
      for (const message of value.messages.slice(0, 100)) {
        if (typeof message?.id !== 'string' || message.id.length > 300 || !message.id ||
            typeof message.from !== 'string' || !/^\d{6,20}$/.test(message.from)) continue;
        const timestamp = Number(message.timestamp);
        if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp * 1000 > Date.now() + 300_000) continue;
        const at = new Date(timestamp * 1000);
        if (!Number.isFinite(at.getTime())) continue;
        const isText = message.type === 'text' && typeof message.text?.body === 'string' &&
          message.text.body.trim().length > 0 && message.text.body.length <= 2000;
        result.push({ id: message.id, customer: message.from, phoneId,
          body: isText ? message.text.body : '[Mensaje no compatible: requiere atención de un vendedor]',
          at: new Date(Math.min(at.getTime(), Date.now())), text: isText });
      }
    }
  }
  return result;
}
