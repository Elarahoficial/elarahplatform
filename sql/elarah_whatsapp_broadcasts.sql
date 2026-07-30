-- =========================================================
-- ELARAH — Disparos de WhatsApp em massa (histórico)
-- =========================================================
-- Registra cada disparo automático de follow-up por WhatsApp
-- (Edge Function whatsapp-broadcast) pros interessados de uma
-- experiência By Elarah.
--
-- O "quem já recebeu" continua sendo gravado por pessoa em
-- byelarah_submissions (whatsapp_followup_sent_at / _count) —
-- ver sql/elarah_byelarah_followup_tracking.sql. Esta tabela é
-- só o log agregado por campanha, pro painel mostrar o histórico
-- (igual ao email_broadcasts).
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente.
-- Pré-requisito: sql/elarah_byelarah_followup_tracking.sql já rodado.
-- =========================================================

create table if not exists public.whatsapp_broadcasts (
  id                  uuid primary key default gen_random_uuid(),
  experiencia         text not null,
  item_slug           text,
  mensagem            text not null,
  total_alvo          integer not null default 0,   -- telefones únicos elegíveis no início
  enviados            integer not null default 0,
  falharam            integer not null default 0,
  sem_telefone        integer not null default 0,   -- respostas sem telefone válido
  status              text not null default 'enviando'
                      check (status in ('enviando','concluido','parcial','erro')),
  detalhe             text,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

create index if not exists whatsapp_broadcasts_created_idx
  on public.whatsapp_broadcasts (created_at desc);

create index if not exists whatsapp_broadcasts_exp_idx
  on public.whatsapp_broadcasts (experiencia);

-- ---------- RLS ----------
alter table public.whatsapp_broadcasts enable row level security;

-- Admin lê tudo; a Edge Function (service_role) ignora RLS e faz os
-- inserts/updates. Ninguém mais enxerga.
drop policy if exists whatsapp_broadcasts_admin_read on public.whatsapp_broadcasts;
create policy whatsapp_broadcasts_admin_read on public.whatsapp_broadcasts
  for select using (public.is_admin());

notify pgrst, 'reload schema';

-- =========================================================
-- VERIFICAÇÃO
--   select * from public.whatsapp_broadcasts order by created_at desc limit 10;
-- =========================================================
