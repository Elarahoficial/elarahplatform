-- =========================================================
-- ELARAH — Agendamento da Newsletter automática
-- =========================================================
-- Roda TODO DIA de manhã. A função decide sozinha:
--   • Seg: não envia (a newsletter da semana começa terça).
--   • Ter: cria a campanha da semana e manda o 1º lote (até 95).
--   • Qua..Dom: continua a fila até todo mundo receber, sem repetir.
-- Assim 1 newsletter/semana cabe no plano grátis do Resend.
--
-- Pré-requisitos:
--   * Edge Function auto-newsletter deployada (Verify JWT OFF).
--   * pg_cron + pg_net ligados (Database → Extensions).
--   * SQL elarah_email_broadcasts.sql e elarah_newsletter.sql rodados.
--
-- Troque 'TROQUE_PELA_SUA_CRON_SECRET' pela mesma CRON_SECRET que
-- está nos secrets das funções.
-- =========================================================

do $$
begin
  perform cron.unschedule('elarah-newsletter-daily');
exception when others then null;
end $$;

-- 11h UTC = 08h BRT, todo dia.
select cron.schedule(
  'elarah-newsletter-daily',
  '0 11 * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/auto-newsletter',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{"mode":"run"}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job where jobname = 'elarah-newsletter-daily';
--   select * from cron.job_run_details
--     where jobid in (select jobid from cron.job where jobname='elarah-newsletter-daily')
--     order by start_time desc limit 10;
-- =========================================================
