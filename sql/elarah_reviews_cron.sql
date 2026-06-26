-- =========================================================
-- ELARAH — Agendamento do pedido de avaliação (diário)
-- =========================================================
-- Todo dia de manhã o agente procura quem viveu a experiência nos
-- últimos dias e ainda não foi convidado, e manda o e-mail pedindo
-- a avaliação (com link único e seguro). Marca quem já recebeu.
--
-- Pré-requisitos:
--   * Edge Function reviews deployada (Verify JWT OFF).
--   * pg_cron + pg_net ligados; SQL elarah_reviews.sql rodado.
-- Troque 'TROQUE_PELA_SUA_CRON_SECRET' pela sua CRON_SECRET.
-- =========================================================

do $$
begin
  perform cron.unschedule('elarah-reviews-request-daily');
exception when others then null;
end $$;

-- 12h UTC = 09h BRT, todo dia.
select cron.schedule(
  'elarah-reviews-request-daily',
  '0 12 * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/reviews',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{"mode":"request"}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job where jobname='elarah-reviews-request-daily';
--   select count(*) filter (where review_request_sent_at is not null) pedidos_enviados from public.bookings;
-- =========================================================
