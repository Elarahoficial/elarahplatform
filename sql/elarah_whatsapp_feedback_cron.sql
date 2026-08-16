-- =========================================================
-- ELARAH — Pedido de FEEDBACK por WhatsApp (cron diário, D+1)
-- =========================================================
-- Todo dia, procura reservas PAGAS cuja experiência foi ONTEM e ainda
-- não receberam o pedido de avaliação POR WHATSAPP, e chama a Edge
-- Function whatsapp-feedback (que manda o mesmo link seguro de
-- avaliar.html do e-mail).
--
-- Complementa o pedido por e-mail que já existe — os dois convivem, cada
-- um com seu próprio controle de "já enviado" (e-mail usa
-- review_request_sent_at; WhatsApp usa whatsapp_feedback_sent_at).
--
-- A data da experiência vem do slot (experience_slots.event_at), no fuso
-- de Brasília. Reservas sem slot/event_at são puladas no WhatsApp (o
-- e-mail continua cobrindo essas).
--
-- Pré-requisitos:
--   * Edge Function whatsapp-feedback deployada (verify_jwt = false).
--   * pg_cron + pg_net ligados.
--
-- ⚠️ Troque 'TROQUE_SEGREDO' pelo MESMO valor do seu ELARAH_WEBHOOK_SECRET.
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- =========================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Marca de "já pediu feedback por WhatsApp" (uma vez por reserva).
alter table public.bookings
  add column if not exists whatsapp_feedback_sent_at timestamptz;

-- Seleção das reservas cuja experiência foi ONTEM (conta no banco, fuso BR).
create or replace function public.elarah_due_feedback()
returns table (
  id uuid,
  nome text,
  telefone text,
  experiencia_nome text
)
language sql
stable
security definer
as $$
  select b.id, b.nome, b.telefone, b.experiencia_nome
  from public.bookings b
  join public.experience_slots s on s.id = b.slot_id
  where b.status = 'pago'
    and b.whatsapp_feedback_sent_at is null
    and coalesce(nullif(trim(b.telefone), ''), '') <> ''
    and s.event_at is not null
    and (s.event_at at time zone 'America/Sao_Paulo')::date
        = ((now() at time zone 'America/Sao_Paulo')::date - 1)
  limit 500;
$$;

do $$
begin
  perform cron.unschedule('elarah-whatsapp-feedback');
exception when others then null;
end $$;

-- 18h UTC = 15h BRT, todo dia.
select cron.schedule(
  'elarah-whatsapp-feedback',
  '0 18 * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/whatsapp-feedback',
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
--   select jobname, schedule, active from cron.job where jobname='elarah-whatsapp-feedback';
--   -- Quem receberia AGORA (sem enviar):
--   select * from public.elarah_due_feedback();
--   select count(*) filter (where whatsapp_feedback_sent_at is not null) feedbacks_wa from public.bookings;
-- =========================================================
