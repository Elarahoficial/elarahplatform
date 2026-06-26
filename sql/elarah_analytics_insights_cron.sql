-- =========================================================
-- ELARAH — Agendamento do agente "Onde estamos pecando"
-- =========================================================
-- Faz o diagnóstico rodar SOZINHO todo dia e mandar o e-mail —
-- sem ninguém clicar em botão.
--
-- Aplicar SOMENTE depois que a Edge Function analytics-insights
-- estiver deployada e a tabela analytics_insights_runs criada
-- (sql/elarah_analytics_insights.sql).
--
-- Pré-requisitos no Supabase (Database → Extensions):
--   * pg_cron → ON
--   * pg_net  → ON
--   * vault   → ON (nativa)
--
-- Reusa o MESMO secret de service_role já salvo no Vault pelos
-- jobs de redes sociais ('elarah_service_role_key'). Se você ainda
-- não salvou, rode uma vez (SQL Editor):
--
--   select vault.create_secret(
--     'eyJhbGciOi...',                  -- Settings → API → service_role
--     'elarah_service_role_key',
--     'Service role key usada pelos jobs de cron'
--   );
-- =========================================================

-- Limpa schedule antigo (idempotência).
do $$
begin
  perform cron.unschedule('elarah-analytics-insights-daily');
exception
  when others then null; -- job não existia ainda
end $$;

-- =========================================================
-- Diagnóstico diário — todo dia às 11h UTC (08h BRT).
-- =========================================================
-- 08h da manhã: o e-mail chega cedo, com a leitura do dia anterior.
-- trigger:"cron" faz a function gravar o run E mandar o e-mail.
--
-- mode "rules" = CUSTO ZERO (diagnóstico por regras, sem IA). É o
-- padrão. Pra usar a IA (Claude, pago ~US$1-4/mês): cadastre o secret
-- ANTHROPIC_API_KEY e troque o body pra '{"trigger":"cron","mode":"ai"}'.
--
-- AUTENTICAÇÃO: usa a senha própria CRON_SECRET (cadastrada em
-- Edge Functions → Secrets). Troque 'TROQUE_PELA_SUA_CRON_SECRET'
-- pelo mesmo valor que você pôs no secret. (Mais confiável que
-- depender da service_role key bater com a do ambiente.)
select cron.schedule(
  'elarah-analytics-insights-daily',
  '0 11 * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/analytics-insights',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{"trigger":"cron","mode":"rules","period_days":30}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
-- =========================================================
--   select jobid, jobname, schedule, active from cron.job
--    where jobname = 'elarah-analytics-insights-daily';
--
--   select * from cron.job_run_details
--    where jobid in (select jobid from cron.job where jobname = 'elarah-analytics-insights-daily')
--    order by start_time desc limit 10;
--
-- Pra mudar o horário, é só re-rodar essa migration com outro cron
-- (ex.: '0 11,23 * * *' = 2x ao dia, 08h e 20h BRT).
-- =========================================================
