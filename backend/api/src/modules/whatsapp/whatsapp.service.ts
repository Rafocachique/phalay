import { ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { equalSecret, parseMessages, validSignature } from './whatsapp.security';

type Conversation = { id: string; phone_number_id: string; customer_wa_id: string; mode: 'BOT' | 'HUMAN' | 'WAITING';
  account_id: string | null; assigned_to: string | null; last_customer_at: Date; busy_until: Date; updated_at: Date; lease_token: string | null };
type Message = { id: string; conversation_id: string; body: string; state: string; direction: string; created_at: Date };
export type WhatsappAccount = { id: string; display_name: string; phone_number_id: string | null; waba_id: string | null;
  owner_id: string; status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'DISCONNECTED'; bot_mode: 'BOT' | 'MANUAL' | 'PAUSED';
  permission?: 'MANAGE' | 'RESPOND'; member_count?: number; created_at: Date; updated_at: Date };

@Injectable()
export class WhatsappService {
  constructor(private readonly db: PrismaService, private readonly config: ConfigService,
    private readonly chatbot: ChatbotService) {}

  private phoneId(): string {
    const id = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!id || !/^\d+$/.test(id)) throw new ServiceUnavailableException('Configura el número de WhatsApp');
    return id;
  }

  private async connectedAccounts() {
    return this.db.$queryRaw<WhatsappAccount[]>`
      SELECT * FROM public.wa_accounts
      WHERE status = 'ACTIVE' AND phone_number_id IS NOT NULL`;
  }

  verify(mode: string | undefined, token: string | undefined, challenge: string | undefined): string {
    const secret = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (!secret || secret.length < 32) throw new ServiceUnavailableException('Configura la verificación de WhatsApp');
    if (mode !== 'subscribe' || !equalSecret(token, secret) || typeof challenge !== 'string' || !challenge || challenge.length > 1000) {
      throw new ForbiddenException('Verificación inválida');
    }
    return challenge;
  }

  async receive(raw: Buffer | undefined, signature: string | undefined, payload: unknown) {
    const secret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!secret) throw new ServiceUnavailableException('Configura el secreto de la app de Meta');
    if (!validSignature(raw, signature, secret)) throw new ForbiddenException('Firma inválida');
    const accounts = await this.connectedAccounts();
    // El número de pruebas existente sigue funcionando durante la migración.
    const allowedPhoneIds = new Set([this.phoneId(), ...accounts.map((account) => account.phone_number_id!).filter(Boolean)]);
    const accountByPhone = new Map(accounts.map((account) => [account.phone_number_id!, account]));
    const messages = parseMessages(payload, allowedPhoneIds);
    for (const message of messages) {
      const account = accountByPhone.get(message.phoneId);
      // Un solo commit guarda conversación y mensaje. El ID de Meta elimina duplicados.
      await this.db.$transaction(async (tx) => {
        const existing = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM public.wa_messages WHERE external_id = ${message.id}`;
        if (existing.length) return;
        const conversations = await tx.$queryRaw<Conversation[]>`
          INSERT INTO public.wa_conversations(account_id, phone_number_id, customer_wa_id, last_customer_at)
          VALUES (${account?.id ?? null}::uuid, ${message.phoneId}, ${message.customer}, ${message.at})
          ON CONFLICT (phone_number_id, customer_wa_id) DO UPDATE
          SET account_id = COALESCE(EXCLUDED.account_id, wa_conversations.account_id),
              last_customer_at = GREATEST(wa_conversations.last_customer_at, EXCLUDED.last_customer_at), updated_at = now()
          RETURNING *`;
        const conversation = conversations[0];
        const inserted = await tx.$queryRaw<{ id: string }[]>`
          INSERT INTO public.wa_messages(conversation_id, external_id, direction, body, state)
          VALUES (${conversation.id}::uuid, ${message.id}, 'IN', ${message.body},
            ${message.text && conversation.mode === 'BOT' && account?.bot_mode === 'BOT' ? 'QUEUED' : 'RECEIVED'})
          ON CONFLICT (external_id) DO NOTHING RETURNING id`;
        if (inserted.length && !message.text && conversation.mode === 'BOT') {
          await tx.$executeRaw`UPDATE public.wa_conversations SET mode = 'WAITING' WHERE id = ${conversation.id}::uuid`;
        }
      });
    }
    return { received: true };
  }

  async list(userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) return this.db.$queryRaw<Conversation[]>`
      SELECT id, account_id, phone_number_id, customer_wa_id, mode, assigned_to, last_customer_at, updated_at, busy_until
      FROM public.wa_conversations ORDER BY updated_at DESC LIMIT 100`;
    return this.db.$queryRaw<Conversation[]>`
      SELECT c.id, c.account_id, c.phone_number_id, c.customer_wa_id, c.mode, c.assigned_to, c.last_customer_at, c.updated_at, c.busy_until
      FROM public.wa_conversations c JOIN public.wa_account_members m ON m.account_id = c.account_id
      WHERE m.user_id = ${userId}::uuid ORDER BY c.updated_at DESC LIMIT 100`;
  }

  async history(id: string, userId: string, isSuperAdmin: boolean) {
    await this.find(id, userId, isSuperAdmin);
    // Últimos 100 mensajes, ordenados cronológicamente por el panel.
    return this.db.$queryRaw<Message[]>`
      SELECT id, direction, body, state, created_at FROM public.wa_messages
      WHERE conversation_id = ${id}::uuid ORDER BY created_at DESC, id DESC LIMIT 100`;
  }

  private async find(id: string, userId: string, isSuperAdmin: boolean): Promise<Conversation> {
    const rows = isSuperAdmin
      ? await this.db.$queryRaw<Conversation[]>`SELECT * FROM public.wa_conversations WHERE id = ${id}::uuid`
      : await this.db.$queryRaw<Conversation[]>`
          SELECT c.* FROM public.wa_conversations c JOIN public.wa_account_members m ON m.account_id = c.account_id
          WHERE c.id = ${id}::uuid AND m.user_id = ${userId}::uuid`;
    if (!rows.length) throw new NotFoundException('Conversación no encontrada');
    return rows[0];
  }

  async setMode(id: string, mode: 'BOT' | 'HUMAN', userId: string, isSuperAdmin: boolean) {
    await this.find(id, userId, isSuperAdmin);
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Conversation[]>`
        UPDATE public.wa_conversations SET mode = ${mode}, assigned_to = ${mode === 'HUMAN' ? userId : null}, lease_token = NULL, updated_at = now()
        WHERE id = ${id}::uuid AND busy_until <= now() RETURNING *`;
      if (!rows.length) throw new ConflictException('Hay un envío en curso. Espera y vuelve a intentar.');
      // No responder automáticamente mensajes anteriores al volver al bot.
      await tx.$executeRaw`UPDATE public.wa_messages SET state = 'RECEIVED'
        WHERE conversation_id = ${id}::uuid AND state = 'QUEUED'`;
      return rows[0];
    });
  }

  async status() {
    const tables = await this.db.$queryRaw<{ ready: boolean }[]>`
      SELECT to_regclass('public.wa_conversations') IS NOT NULL AND to_regclass('public.wa_messages') IS NOT NULL AS ready`;
    return { databaseReady: tables[0]?.ready === true,
      webhookConfigured: (this.config.get<string>('WHATSAPP_VERIFY_TOKEN')?.length ?? 0) >= 32 && !!this.config.get('WHATSAPP_APP_SECRET'),
      phoneConfigured: !!this.config.get('WHATSAPP_PHONE_NUMBER_ID'),
      sendConfigured: !!this.config.get('WHATSAPP_ACCESS_TOKEN') && !!this.config.get('WHATSAPP_GRAPH_VERSION'),
      botEnabled: this.config.get('WHATSAPP_BOT_ENABLED') === 'true',
      engineConfigured: !!this.config.get('CHATBOT_SERVICE_URL') && !!this.config.get('CHATBOT_API_KEY'),
      callbackPath: '/api/v1/whatsapp/webhook' };
  }

  /** Lista sólo las bandejas que el usuario puede atender. El superadmin ve todas. */
  async accounts(userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) return this.db.$queryRaw<WhatsappAccount[]>`
      SELECT a.*, (SELECT count(*)::int FROM public.wa_account_members m WHERE m.account_id = a.id) AS member_count
      FROM public.wa_accounts a ORDER BY a.created_at DESC`;
    return this.db.$queryRaw<WhatsappAccount[]>`
      SELECT a.*, m.permission, (SELECT count(*)::int FROM public.wa_account_members am WHERE am.account_id = a.id) AS member_count
      FROM public.wa_accounts a
      JOIN public.wa_account_members m ON m.account_id = a.id
      WHERE m.user_id = ${userId}::uuid ORDER BY a.created_at DESC`;
  }

  /** Crea una bandeja pendiente; el QR oficial sólo se muestra después de configurar Meta Embedded Signup. */
  async createAccount(displayName: string, ownerId: string) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<WhatsappAccount[]>`
        INSERT INTO public.wa_accounts(display_name, owner_id) VALUES (${displayName}, ${ownerId}::uuid) RETURNING *`;
      const account = rows[0];
      await tx.$executeRaw`INSERT INTO public.wa_account_members(account_id, user_id, permission)
        VALUES (${account.id}::uuid, ${ownerId}::uuid, 'MANAGE') ON CONFLICT DO NOTHING`;
      return account;
    });
  }

  private async manageable(accountId: string, userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) return;
    const rows = await this.db.$queryRaw<{ account_id: string }[]>`
      SELECT account_id FROM public.wa_account_members WHERE account_id = ${accountId}::uuid
      AND user_id = ${userId}::uuid AND permission = 'MANAGE'`;
    if (!rows.length) throw new ForbiddenException('Sólo el propietario o superadministrador puede gestionar esta cuenta');
  }

  async addMember(accountId: string, memberId: string, permission: 'MANAGE' | 'RESPOND', userId: string, isSuperAdmin: boolean) {
    await this.manageable(accountId, userId, isSuperAdmin);
    await this.db.$executeRaw`INSERT INTO public.wa_account_members(account_id, user_id, permission)
      VALUES (${accountId}::uuid, ${memberId}::uuid, ${permission})
      ON CONFLICT (account_id, user_id) DO UPDATE SET permission = EXCLUDED.permission`;
    return { assigned: true };
  }

  async setAccountBotMode(accountId: string, mode: 'BOT' | 'MANUAL' | 'PAUSED', userId: string, isSuperAdmin: boolean) {
    await this.manageable(accountId, userId, isSuperAdmin);
    const rows = await this.db.$queryRaw<WhatsappAccount[]>`
      UPDATE public.wa_accounts SET bot_mode = ${mode}, updated_at = now() WHERE id = ${accountId}::uuid RETURNING *`;
    if (!rows.length) throw new NotFoundException('Cuenta de WhatsApp no encontrada');
    return rows[0];
  }

  private async claim(id: string): Promise<Conversation> {
    const lease = randomUUID();
    const rows = await this.db.$queryRaw<Conversation[]>`
      UPDATE public.wa_conversations SET busy_until = now() + interval '90 seconds', lease_token = ${lease}::uuid
      WHERE id = ${id}::uuid AND busy_until <= now() RETURNING *`;
    if (!rows.length) throw new ConflictException('Conversación ocupada');
    return rows[0];
  }

  private async release(conversation: Conversation) {
    await this.db.$executeRaw`UPDATE public.wa_conversations SET busy_until = 'epoch', lease_token = NULL
      WHERE id = ${conversation.id}::uuid AND lease_token = ${conversation.lease_token}::uuid`;
  }

  private async send(conversation: Conversation, body: string, replyTo: string | null) {
    if (Date.now() - new Date(conversation.last_customer_at).getTime() >= 24 * 60 * 60 * 1000) {
      throw new ConflictException('Pasaron 24 horas desde el último mensaje del cliente. Se requiere una plantilla aprobada.');
    }
    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const version = this.config.get<string>('WHATSAPP_GRAPH_VERSION');
    if (!token || !version || !/^v\d+\.\d+$/.test(version)) throw new ServiceUnavailableException('Configura el acceso de WhatsApp');
    const id = randomUUID();
    const owned = await this.db.$executeRaw`UPDATE public.wa_conversations SET busy_until = now() + interval '45 seconds'
      WHERE id = ${conversation.id}::uuid AND lease_token = ${conversation.lease_token}::uuid AND busy_until > now()`;
    if (!owned) throw new ConflictException('La conversación cambió de responsable. Revisa su estado.');
    // Persistir ANTES de la llamada. Si hay timeout/caída, no reenviar automáticamente.
    await this.db.$executeRaw`INSERT INTO public.wa_messages(id, conversation_id, reply_to, direction, body, state)
      VALUES (${id}::uuid, ${conversation.id}::uuid, ${replyTo}::uuid, 'OUT', ${body}, 'SENDING')`;
    try {
      const response = await fetch(`https://graph.facebook.com/${version}/${conversation.phone_number_id}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: conversation.customer_wa_id,
          type: 'text', text: { body, preview_url: false } }),
        signal: AbortSignal.timeout(10_000), redirect: 'error',
      });
      const data = await response.json() as { messages?: { id?: string }[] };
      const externalId = data.messages?.[0]?.id;
      if (!response.ok || typeof externalId !== 'string') throw new Error('No confirmed send');
      await this.db.$executeRaw`UPDATE public.wa_messages SET state = 'SENT', external_id = ${externalId} WHERE id = ${id}::uuid`;
      await this.db.$executeRaw`UPDATE public.wa_conversations SET updated_at = now() WHERE id = ${conversation.id}::uuid`;
      return { sent: true };
    } catch {
      await this.db.$executeRaw`UPDATE public.wa_messages SET state = 'UNKNOWN' WHERE id = ${id}::uuid`;
      throw new ServiceUnavailableException('No se pudo confirmar el envío. Comprueba WhatsApp antes de volver a enviarlo.');
    }
  }

  async manualReply(id: string, body: string, userId: string, isSuperAdmin: boolean) {
    await this.find(id, userId, isSuperAdmin);
    const conversation = await this.claim(id);
    try {
      if (conversation.mode !== 'HUMAN' || (!isSuperAdmin && conversation.assigned_to !== userId)) {
        throw new ConflictException('Toma la conversación antes de responder');
      }
      return await this.send(conversation, body, null);
    } finally { await this.release(conversation); }
  }

  async processQueue() {
    // Fallar cerrado. Activar sólo después de probar el webhook, credenciales y FAQs.
    if (this.config.get('WHATSAPP_BOT_ENABLED') !== 'true') return { processed: 0, enabled: false };
    // Trabajos interrumpidos pasan a revisión; nunca se repite un envío incierto.
    await this.db.$executeRaw`UPDATE public.wa_messages m SET state = 'REVIEW'
      FROM public.wa_conversations c WHERE m.conversation_id = c.id
      AND m.state IN ('PROCESSING', 'SENDING') AND c.busy_until <= now()`;
    // Si se cambia una cuenta a Manual o Pausado, ningún mensaje pendiente queda
    // oculto en la cola: queda visible para que un administrador lo atienda.
    await this.db.$executeRaw`UPDATE public.wa_messages m SET state = 'RECEIVED'
      FROM public.wa_conversations c JOIN public.wa_accounts a ON a.id = c.account_id
      WHERE m.conversation_id = c.id AND m.state = 'QUEUED'
      AND (a.status <> 'ACTIVE' OR a.bot_mode <> 'BOT')`;
    const jobs = await this.db.$queryRaw<Message[]>`
      SELECT m.* FROM public.wa_messages m JOIN public.wa_conversations c ON c.id = m.conversation_id
      LEFT JOIN public.wa_accounts a ON a.id = c.account_id
      WHERE m.state = 'QUEUED' AND c.mode = 'BOT' AND c.busy_until <= now()
      AND (c.account_id IS NULL OR (a.status = 'ACTIVE' AND a.bot_mode = 'BOT'))
      ORDER BY m.created_at, m.id LIMIT 1`;
    let processed = 0;
    for (const job of jobs) {
      let conversation: Conversation;
      try { conversation = await this.claim(job.conversation_id); }
      catch (error) { if (error instanceof ConflictException) continue; throw error; }
      try {
        const claimed = await this.db.$executeRaw`UPDATE public.wa_messages SET state = 'PROCESSING'
          WHERE id = ${job.id}::uuid AND state = 'QUEUED'`;
        if (!claimed) continue;
        if (conversation.mode !== 'BOT') {
          await this.db.$executeRaw`UPDATE public.wa_messages SET state = 'RECEIVED' WHERE id = ${job.id}::uuid`;
          continue;
        }
        const reply = await this.chatbot.preview(job.body);
        if (reply.action === 'handoff' || reply.action === 'paused') {
          const changed = await this.db.$executeRaw`UPDATE public.wa_conversations SET mode = 'WAITING', updated_at = now()
            WHERE id = ${conversation.id}::uuid AND lease_token = ${conversation.lease_token}::uuid AND busy_until > now()`;
          if (!changed) throw new ConflictException('La conversación cambió de responsable');
        }
        const answer = reply.action === 'clarify' ? `${reply.answer}\n${reply.suggestions.join('\n')}` : reply.answer;
        if (answer && reply.action !== 'paused') await this.send(conversation, answer.slice(0, 4096), job.id);
        await this.db.$executeRaw`UPDATE public.wa_messages SET state = 'RECEIVED' WHERE id = ${job.id}::uuid`;
        processed++;
      } catch {
        await this.db.$executeRaw`UPDATE public.wa_messages SET state = 'REVIEW' WHERE id = ${job.id}::uuid`;
        await this.db.$executeRaw`UPDATE public.wa_conversations SET mode = 'WAITING', updated_at = now()
          WHERE id = ${conversation.id}::uuid AND lease_token = ${conversation.lease_token}::uuid`;
      } finally { await this.release(conversation); }
    }
    return { processed, enabled: true };
  }
}
