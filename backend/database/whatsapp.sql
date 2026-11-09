-- Aplicar manualmente en Supabase antes de habilitar WhatsApp. No borra datos.
create table if not exists public.wa_conversations (
  id uuid primary key default gen_random_uuid(),
  phone_number_id text not null,
  customer_wa_id text not null,
  mode text not null default 'BOT' check (mode in ('BOT', 'WAITING', 'HUMAN')),
  assigned_to text,
  last_customer_at timestamptz not null,
  updated_at timestamptz not null default now(),
  busy_until timestamptz not null default 'epoch',
  lease_token uuid,
  unique(phone_number_id, customer_wa_id)
);
create table if not exists public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.wa_conversations(id),
  external_id text unique,
  reply_to uuid unique references public.wa_messages(id),
  direction text not null check (direction in ('IN', 'OUT')),
  body text not null,
  state text not null check (state in ('QUEUED', 'PROCESSING', 'RECEIVED', 'SENDING', 'SENT', 'UNKNOWN', 'REVIEW')),
  created_at timestamptz not null default now()
);
create index if not exists wa_messages_queue_idx on public.wa_messages(state, created_at);
create index if not exists wa_messages_conversation_idx on public.wa_messages(conversation_id, created_at);
alter table public.wa_conversations enable row level security;
alter table public.wa_messages enable row level security;
revoke all on public.wa_conversations, public.wa_messages from anon, authenticated;
-- Acceso únicamente desde la API NestJS con el rol de conexión del servidor.
