-- =========================================================
-- ELARAH — Cron de PAGAMENTO PENDENTE por WhatsApp
-- =========================================================
-- A cada 30 minutos, procura reservas que ficaram com pagamento
-- pendente (há mais de ~30 min e menos de ~3 dias) e ainda não
-- receberam o lembrete, e chama a Edge Function whatsapp-pendente,
-- que manda o convite pra concluir o pagamento (uma vez por reserva).
--
-- Pré-requisitos:
--   * Edge Function whatsapp-pendente deployada (verify_jwt = false).
--   * pg_cron + pg_net ligados (Database → Extensions).
--   * Colunas de follow-up em bookings:
--       rode sql/elarah_bookings_followup.sql UMA vez.
--
-- ⚠️ Troque 'TROQUE_SEGREDO' pelo MESMO valor do seu ELARAH_WEBHOOK_SECRET
--    (o mesmo da boas-vindas / confirmação).
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- =========================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Garante as colunas de follow-up (idempotente).
alter table public.bookings
  add column if not exists followup_status text not null default 'nenhum'
    check (followup_status in ('nenhum', 'primeiro_enviado', 'segundo_enviado', 'recuperado', 'expirado')),
  add column if not exists followup_1_at timestamptz,
  add column if not exists followup_2_at timestamptz;

do $$
begin
  perform cron.unschedule('elarah-whatsapp-pendente');
exception when others then null;
end $$;

-- A cada 30 minutos.
select cron.schedule(
  'elarah-whatsapp-pendente',
  '*/30 * * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/whatsapp-pendente',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_SEGREDO'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job where jobname='elarah-whatsapp-pendente';
--   select count(*) filter (where followup_status='primeiro_enviado') lembrados from public.bookings;
-- =========================================================
