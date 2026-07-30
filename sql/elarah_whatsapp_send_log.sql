-- =========================================================
-- ELARAH — whatsapp_send_log (idempotência + auditoria de WhatsApp)
-- -----------------------------------------------------
-- Rode no SQL Editor do Supabase. Idempotente.
--
-- Camada CENTRAL anti-duplicidade: TODO envio de WhatsApp reserva uma
-- linha aqui ANTES de chamar a Z-API. O UNIQUE(dedupe_key) garante que,
-- sob concorrência (webhook 2x, webhook+polling, clique duplo, dois
-- broadcasts), apenas UM processo consegue reservar — os outros veem
-- violação de UNIQUE e NÃO enviam. Também serve de auditoria (quem, o
-- quê, quando, resultado).
--
-- dedupe_key (exemplos):
--   confirmation:<booking_id>
--   reminder48:<booking_id>
--   feedback:<booking_id>
--   pending:<booking_id>
--   bcast:<campaign_id>:<phone>
-- =========================================================

create table if not exists public.whatsapp_send_log (
  id            uuid primary key default gen_random_uuid(),
  dedupe_key    text not null,
  kind          text not null,
  booking_id    uuid,
  experiencia_id uuid,
  phone_masked  text,                       -- NUNCA o número inteiro
  status        text not null default 'pending'
    check (status in ('pending','sent','failed','dry_run','skipped')),
  provider_id   text,
  error         text,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- A trava. Uma linha por (destinatário + tipo + contexto).
create unique index if not exists whatsapp_send_log_dedupe_uidx
  on public.whatsapp_send_log (dedupe_key);

create index if not exists whatsapp_send_log_booking_idx
  on public.whatsapp_send_log (booking_id);

create index if not exists whatsapp_send_log_created_idx
  on public.whatsapp_send_log (created_at desc);

-- Só service_role (edge functions) escreve/le. Sem acesso anônimo.
alter table public.whatsapp_send_log enable row level security;
-- (Sem policies = ninguém além de service_role acessa. Service role
--  ignora RLS por definição.)

comment on table public.whatsapp_send_log is
  'Idempotência + auditoria de TODO envio de WhatsApp. Reserva-antes-de-enviar via UNIQUE(dedupe_key). Ver supabase/functions/_shared/whatsapp_gate.js.';

notify pgrst, 'reload schema';
