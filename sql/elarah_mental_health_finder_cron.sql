-- =========================================================
-- ELARAH MENTAL HEALTH — 100 empresas novas toda segunda
-- =========================================================
-- Toda SEGUNDA de manhã o agente mh-empresas-finder busca ~100
-- empresas novas (sem repetir) e coloca na aba Prospecção do
-- painel Elarah Mental Health (admin-mh.html).
--
-- Pré-requisitos:
--   * sql/elarah_mental_health.sql rodado.
--   * Edge Function mh-empresas-finder publicada (o GitHub Action
--     de deploy publica sozinho ao entrar na branch principal).
--   * GOOGLE_PLACES_API_KEY e CRON_SECRET nos secrets das funções
--     (os mesmos do caça-parceiros).
--   * pg_cron + pg_net ligados.
--
-- Troque 'TROQUE_PELA_SUA_CRON_SECRET' pela sua CRON_SECRET.
-- Pra mudar a meta da semana, troque "target" (máx 150).
-- =========================================================

do $$
begin
  perform cron.unschedule('elarah-mh-empresas-finder-weekly');
exception when others then null;
end $$;

-- 10h30 UTC = 07h30 BRT, toda segunda — chega antes da reunião da semana.
select cron.schedule(
  'elarah-mh-empresas-finder-weekly',
  '30 10 * * 1',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/mh-empresas-finder',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{"target":100}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job
--     where jobname = 'elarah-mh-empresas-finder-weekly';
--   select nome, segmento, telefone, site, created_at from public.b2b_prospects
--     where frente = 'mh' order by created_at desc limit 30;
-- =========================================================
