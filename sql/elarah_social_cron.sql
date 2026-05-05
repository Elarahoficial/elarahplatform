-- =========================================================
-- ELARAH — Agendamento das Edge Functions de redes sociais
-- =========================================================
-- Aplicar SOMENTE depois que as Edge Functions sync-instagram
-- e refresh-tokens estiverem deployadas.
--
-- Pré-requisitos no Supabase (Database → Extensions):
--   * pg_cron → ON
--   * pg_net  → ON
--   * vault   → ON (já é nativa, geralmente já está ligada)
--
-- Como o pg_cron chama a Edge Function:
--   pg_net.http_post() faz uma requisição HTTP do banco pra
--   URL pública da Edge Function. O header Authorization carrega
--   a service_role key, lida do Supabase Vault em runtime.
--
-- Antes de rodar essa migration, salve a service_role key no
-- Vault UMA ÚNICA VEZ (use o SQL Editor):
--
--   select vault.create_secret(
--     'eyJhbGciOi...',                         -- a key (Settings → API → service_role)
--     'elarah_service_role_key',               -- nome lógico
--     'Service role key usada pelos jobs de cron de redes sociais'
--   );
--
-- Confirma com:
--   select count(*) from vault.secrets where name = 'elarah_service_role_key';
--   -- Esperado: 1
--
-- Pra rotacionar a key no futuro:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'elarah_service_role_key'),
--     'eyJ_NOVA_KEY...'
--   );
-- =========================================================


-- Limpa schedules antigos (idempotência — pode rodar a migration várias vezes)
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
        'Authorization', 'Bearer ' || (
          select decrypted_secret
            from vault.decrypted_secrets
           where name = 'elarah_service_role_key'
           limit 1
        )
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
        'Authorization', 'Bearer ' || (
          select decrypted_secret
            from vault.decrypted_secrets
           where name = 'elarah_service_role_key'
           limit 1
        )
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
-- VERIFICAÇÃO
-- =========================================================
-- Lista os jobs ativos:
--   select jobid, jobname, schedule, active from cron.job
--    where jobname like 'elarah-%' order by jobname;
--
-- Histórico das últimas execuções:
--   select * from cron.job_run_details
--    where jobid in (select jobid from cron.job where jobname like 'elarah-%')
--    order by start_time desc limit 20;
-- =========================================================
