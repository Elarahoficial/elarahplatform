-- =========================================================
-- ELARAH — Newsletter automática (1x/semana, personalizada)
-- =========================================================
-- Base do agente que, sozinho, escolhe as experiências em alta e
-- manda pra cada cliente com base no que ele mais vê. Respeita o
-- limite do plano grátis do Resend: o conteúdo é fixado por SEMANA
-- e o envio se espalha em lotes diários (uma fila), sem repetir.
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- Pré-requisito: rode antes sql/elarah_email_broadcasts.sql
-- (usa a view email_audience e a tabela email_opt_outs de lá).
-- =========================================================

-- ---------- Campanha da semana ----------
-- 1 linha por semana. "conteudo" guarda as experiências escolhidas
-- (em alta + top por categoria) pra ficarem ESTÁVEIS durante a semana,
-- mesmo o envio acontecendo em vários dias.
create table if not exists public.newsletter_campaigns (
  id          uuid primary key default gen_random_uuid(),
  week_key    text not null unique,          -- ex.: '2026-W26'
  assunto     text not null,
  conteudo    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- Quem já recebeu a campanha (fila/anti-duplicado) ----------
create table if not exists public.newsletter_sends (
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  email       text not null,
  sent_at     timestamptz not null default now(),
  primary key (campaign_id, email)
);

create index if not exists newsletter_sends_campaign_idx
  on public.newsletter_sends (campaign_id);

-- ---------- RLS ----------
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_sends     enable row level security;

drop policy if exists newsletter_campaigns_admin_read on public.newsletter_campaigns;
create policy newsletter_campaigns_admin_read on public.newsletter_campaigns
  for select using (public.is_admin());

drop policy if exists newsletter_sends_admin_read on public.newsletter_sends;
create policy newsletter_sends_admin_read on public.newsletter_sends
  for select using (public.is_admin());

-- =========================================================
-- VERIFICAÇÃO
--   select week_key, assunto, created_at from public.newsletter_campaigns order by created_at desc;
--   select campaign_id, count(*) from public.newsletter_sends group by 1;
-- =========================================================
