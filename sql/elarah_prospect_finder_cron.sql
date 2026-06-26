-- =========================================================
-- ELARAH — Agendamento do caça-parceiros (toda segunda)
-- =========================================================
-- Toda SEGUNDA de manhã o agente busca e adiciona novos parceiros na
-- Prospecção (sem repetir). Pré-requisitos:
--   * Edge Function prospect-finder deployada (Verify JWT OFF).
--   * GOOGLE_PLACES_API_KEY nos secrets da função.
--   * pg_cron + pg_net ligados; SQLs prospects + prospect_finder rodados.
--
-- Troque 'TROQUE_PELA_SUA_CRON_SECRET' pela sua CRON_SECRET.
-- Pra mudar a meta da semana, troque "target".
-- =========================================================

do $$
begin
  perform cron.unschedule('elarah-prospect-finder-weekly');
exception when others then null;
end $$;

-- 11h UTC = 08h BRT, toda segunda (dia 1).
select cron.schedule(
  'elarah-prospect-finder-weekly',
  '0 11 * * 1',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/prospect-finder',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{"mode":"run","target":30}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job where jobname='elarah-prospect-finder-weekly';
--   select nome, categoria, whatsapp, site from public.prospects
--     where origem='google_places' order by created_at desc limit 30;
-- =========================================================
