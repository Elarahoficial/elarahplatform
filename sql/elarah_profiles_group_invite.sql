-- =========================================================
-- ELARAH — Coluna de controle do convite do grupo (backfill)
-- =========================================================
-- Marca quem já recebeu o convite do grupo por WhatsApp, pra o
-- disparo em massa (whatsapp-group-blast) não repetir ninguém.
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente.
-- =========================================================

alter table public.profiles
  add column if not exists group_invite_sent_at timestamptz;

create index if not exists profiles_group_invite_pending_idx
  on public.profiles (created_at)
  where group_invite_sent_at is null;

notify pgrst, 'reload schema';
