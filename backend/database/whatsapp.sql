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
-- Cuentas de WhatsApp independientes. La conexión QR, el modo del bot y el
-- acceso de los administradores se administran por cuenta, no globalmente.
create table if not exists public.wa_accounts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 120),
  phone_number_id text unique,
  waba_id text unique,
  owner_id uuid not null references public.users(id),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'PAUSED', 'DISCONNECTED')),
  bot_mode text not null default 'MANUAL' check (bot_mode in ('BOT', 'MANUAL', 'PAUSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.wa_account_members (
  account_id uuid not null references public.wa_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  permission text not null default 'RESPOND' check (permission in ('MANAGE', 'RESPOND')),
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);
-- Una conversación pertenece a una cuenta conectada. Se permite NULL sólo para
-- conservar conversaciones históricas creadas antes de las bandejas múltiples.
alter table public.wa_conversations
  add column if not exists account_id uuid references public.wa_accounts(id);
create index if not exists wa_conversations_account_updated_idx
  on public.wa_conversations(account_id, updated_at desc);
create index if not exists wa_account_members_user_idx on public.wa_account_members(user_id);
create index if not exists wa_messages_queue_idx on public.wa_messages(state, created_at);
create index if not exists wa_messages_conversation_idx on public.wa_messages(conversation_id, created_at);
alter table public.wa_conversations enable row level security;
alter table public.wa_messages enable row level security;
alter table public.wa_accounts enable row level security;
alter table public.wa_account_members enable row level security;
revoke all on public.wa_conversations, public.wa_messages, public.wa_accounts, public.wa_account_members from anon, authenticated;
-- Acceso únicamente desde la API NestJS con el rol de conexión del servidor.
