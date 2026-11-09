-- Ejecutar manualmente en Supabase. No modifica tablas existentes ni Prisma.
-- RLS sin políticas: ningún cliente anon/authenticated puede leer o editar.
-- El servicio usa service_role sólo del lado servidor y filtra store_id.
create table if not exists public.chatbot_knowledge (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  title text not null check (length(title) between 1 and 200),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 30),
  answer text not null check (length(answer) between 1 and 4000),
  enabled boolean not null default false
);
alter table public.chatbot_knowledge enable row level security;
revoke all on public.chatbot_knowledge from anon, authenticated;
grant select on public.chatbot_knowledge to service_role;
create index if not exists chatbot_knowledge_store_enabled_idx
  on public.chatbot_knowledge (store_id, enabled);
