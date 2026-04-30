-- =========================================================
-- ELARAH — Agendamento das Edge Functions de redes sociais
-- =========================================================
-- Aplicar SOMENTE depois que as Edge Functions sync-instagram
-- e refresh-tokens estiverem deployadas.
--
-- Pré-requisitos no Supabase (Database → Extensions):
--   * pg_cron → ON
--   * pg_net  → ON
--
-- Como o pg_cron chama a Edge Function:
--   pg_net.http_post() faz uma requisição HTTP do banco pra
--   URL pública da Edge Function. O header Authorization leva
--   a service_role key — sync-instagram e refresh-tokens
--   reconhecem ela e tratam a chamada como cron (sem JWT de admin).
--
-- IMPORTANTE — preencha as duas variáveis abaixo antes de rodar:
--   * project_url       → URL do seu projeto Supabase (sem barra final)
--   * service_role_key  → Settings → API → service_role key
--
-- A service_role key fica armazenada no banco. Isso é aceitável
-- porque tabelas de cron já são restritas ao postgres role
-- (ninguém via PostgREST/Supabase JS consegue ler de cron.job).
-- =========================================================

-- Limpa schedules antigos (idempotência)
do $$
begin
  perform cron.unschedule(jobname)
    from cron.job
   where jobname in (
     'elarah-sync-instagram',
     'elarah-refresh-social-tokens',
     'elarah-purge-oauth-states'
   );
exception
  when undefined_table then null; -- pg_cron não habilitada ainda
end $$;


-- =========================================================
-- 1) Sync de Instagram — 4x ao dia (00h, 06h, 12h, 18h BRT)
-- =========================================================
-- BRT = UTC-3, então 03h, 09h, 15h, 21h em UTC.
-- Frequência cobre Stories (vivem 24h) sem perder demais.
select cron.schedule(
  'elarah-sync-instagram',
  '0 3,9,15,21 * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/sync-instagram',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.elarah_service_role_key', true)
      ),
      body    := '{"trigger":"cron"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $$
);


-- =========================================================
-- 2) Refresh de tokens — 1x por mês (dia 1, 04h UTC = 01h BRT)
-- =========================================================
select cron.schedule(
  'elarah-refresh-social-tokens',
  '0 4 1 * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/refresh-tokens',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.elarah_service_role_key', true)
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $$
);


-- =========================================================
-- 3) Limpeza de OAuth states expirados — 1x por dia (05h UTC)
-- =========================================================
select cron.schedule(
  'elarah-purge-oauth-states',
  '0 5 * * *',
  $$ select public.purge_expired_oauth_states(); $$
);


-- =========================================================
-- 4) IMPORTANTE: configurar a service_role key
-- =========================================================
-- Os jobs acima leem `app.elarah_service_role_key` como custom
-- GUC. Você precisa setar esse parâmetro UMA VEZ no banco:
--
--   ALTER DATABASE postgres
--     SET app.elarah_service_role_key = 'eyJhbGciOi...';   -- service_role key
--
-- Pega a key em:
--   Supabase Dashboard → Settings → API → "service_role" (secret)
--
-- Depois desse ALTER DATABASE, as próximas conexões já enxergam
-- a variável. Para validar:
--   select current_setting('app.elarah_service_role_key');
--
-- Se você prefere não armazenar a service_role key dessa forma,
-- alternativa é hardcodar dentro do `headers := jsonb_build_object(...)`
-- de cada job — mas o ALTER DATABASE é mais limpo e permite
-- rotacionar a key sem editar 3 jobs.
-- =========================================================


-- =========================================================
-- Útil pra debug: ver os jobs e últimas execuções
-- =========================================================
-- select jobid, jobname, schedule, active from cron.job order by jobname;
-- select * from cron.job_run_details
--   where jobid in (select jobid from cron.job where jobname like 'elarah-%')
--   order by start_time desc limit 20;
