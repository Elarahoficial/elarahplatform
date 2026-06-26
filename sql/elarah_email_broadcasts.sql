-- =========================================================
-- ELARAH — Novidades por e-mail (disparo em massa)
-- =========================================================
-- Base do "agente de novidades": registra cada disparo e guarda
-- quem pediu pra NÃO receber mais (descadastro / LGPD).
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente.
-- Pré-requisito: tabelas public.profiles e public.bookings já existem.
-- =========================================================

-- ---------- Descadastros (opt-out de novidades) ----------
-- Tabela própria (não coluna em profiles) porque precisa cobrir TAMBÉM
-- quem comprou como convidado, sem conta. Chave = e-mail minúsculo.
create table if not exists public.email_opt_outs (
  email       text primary key,
  motivo      text,
  created_at  timestamptz not null default now()
);

comment on table public.email_opt_outs is
  'E-mails que pediram pra não receber novidades (link de descadastro). O disparo em massa SEMPRE exclui quem está aqui.';

-- ---------- Histórico de disparos ----------
create table if not exists public.email_broadcasts (
  id                uuid primary key default gen_random_uuid(),
  assunto           text not null,
  mensagem          text not null,
  audiencia         text not null default 'cadastrados_e_compradores',
  total_destinatarios integer not null default 0,
  enviados          integer not null default 0,
  falharam          integer not null default 0,
  status            text not null default 'enviando'
                    check (status in ('enviando','concluido','parcial','erro')),
  detalhe           text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists email_broadcasts_created_idx
  on public.email_broadcasts (created_at desc);

-- ---------- RLS ----------
alter table public.email_opt_outs   enable row level security;
alter table public.email_broadcasts enable row level security;

-- Admin lê tudo; a Edge Function (service_role) ignora RLS e faz os
-- inserts/updates. Ninguém mais enxerga.
drop policy if exists email_optouts_admin_read on public.email_opt_outs;
create policy email_optouts_admin_read on public.email_opt_outs
  for select using (public.is_admin());

drop policy if exists email_broadcasts_admin_read on public.email_broadcasts;
create policy email_broadcasts_admin_read on public.email_broadcasts
  for select using (public.is_admin());

-- ---------- Lista de destinatários (cadastrados + compradores) ----------
-- View que une os e-mails dos usuários cadastrados (profiles) com os de
-- quem JÁ COMPROU (bookings.status = 'pago'), tira duplicados e remove
-- quem está descadastrado. A Edge Function lê daqui — uma fonte só.
create or replace view public.email_audience as
with todos as (
  select lower(trim(email)) as email, coalesce(nullif(trim(nome), ''), null) as nome
    from public.profiles
   where email is not null and trim(email) <> ''
  union
  select lower(trim(email)) as email, coalesce(nullif(trim(nome), ''), null) as nome
    from public.bookings
   where status = 'pago' and email is not null and trim(email) <> ''
)
select t.email, max(t.nome) as nome
  from todos t
 where t.email like '%_@_%.__%'                       -- e-mail minimamente válido
   and t.email not in (select email from public.email_opt_outs)
 group by t.email;

-- A view roda como o dono (postgres), então a Edge Function (service_role)
-- enxerga tudo. Não exponha essa view ao anon/authenticated.
revoke all on public.email_audience from anon, authenticated;

-- =========================================================
-- VERIFICAÇÃO
--   select count(*) from public.email_audience;            -- quantos recebem
--   select * from public.email_broadcasts order by created_at desc limit 10;
--   select * from public.email_opt_outs order by created_at desc limit 10;
-- =========================================================
