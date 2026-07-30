-- =========================================================
-- ELARAH — Agendamento das automações de WhatsApp
-- -----------------------------------------------------
-- Chama a Edge Function automated-notifications a cada 30 min. Ela decide,
-- por reserva, se é hora de lembrete (48h antes), feedback (2 dias depois)
-- ou recuperação de pendente (3-6h) — SEMPRE passando pelo portão de
-- segurança (idempotência, kill switch, modo observação, rollout).
--
-- SEGURO ligar mesmo antes de liberar envios: em modo observação a função
-- só REGISTRA quem receberia (na whatsapp_send_log), sem enviar nada.
--
-- Pré-requisitos:
--   * pg_cron + pg_net habilitados.
--   * Edge Function automated-notifications deployada (verify_jwt OFF).
--   * sql/elarah_whatsapp_send_log.sql e
--     sql/elarah_bookings_automation_tracking.sql já rodados.
--   * Troque 'TROQUE_PELA_SUA_CRON_SECRET' pela sua CRON_SECRET.
--   * Confirme a URL do projeto (functions/v1/automated-notifications).
-- =========================================================

do $$
begin
  perform cron.unschedule('elarah-automated-notifications');
exception when others then null;
end $$;

select cron.schedule(
  'elarah-automated-notifications',
  '*/30 * * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/automated-notifications',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job where jobname='elarah-automated-notifications';
--   -- Em modo observação, veja quem RECEBERIA:
--   select kind, phone_masked, booking_id, created_at
--     from whatsapp_send_log where status='observed' order by created_at desc;
-- =========================================================
