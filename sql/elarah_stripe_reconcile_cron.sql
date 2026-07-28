-- =========================================================
-- ELARAH — Agendamento da rede de segurança do Stripe
-- =========================================================
-- Faz a função stripe-reconcile rodar SOZINHA a cada 10 minutos.
-- Ela confere no Stripe as reservas presas em 'pending' e recupera
-- as que foram REALMENTE pagas no cartão: marca 'pago', te manda o
-- e-mail de "Nova venda" e a confirmação pro cliente — mesmo que o
-- webhook `stripe-webhook` tenha falhado em avisar.
--
-- Com isso, uma falha no webhook para de "sumir" com vendas: no
-- máximo 10 minutos depois, a venda é reconciliada automaticamente.
--
-- Aplicar SOMENTE depois que a Edge Function stripe-reconcile
-- estiver deployada.
--
-- Pré-requisitos no Supabase (Database → Extensions):
--   * pg_cron → ON
--   * pg_net  → ON
--
-- AUTENTICAÇÃO: usa o secret CRON_SECRET (cadastrado em
-- Edge Functions → Secrets). Troque 'TROQUE_PELA_SUA_CRON_SECRET'
-- pelo mesmo valor salvo no secret. (Pode usar a service_role key
-- no lugar, mas o CRON_SECRET é mais estável entre ambientes.)
-- =========================================================

-- Limpa schedule antigo (idempotência).
do $$
begin
  perform cron.unschedule('elarah-stripe-reconcile');
exception
  when others then null; -- job não existia ainda
end $$;

-- A cada 10 minutos. period_days=1 olha só o dia corrente (leve e
-- suficiente pro caso normal). Se um dia precisar recuperar mais pra
-- trás, chame a função manualmente com period_days maior.
select cron.schedule(
  'elarah-stripe-reconcile',
  '*/10 * * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/stripe-reconcile',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{"period_days":1}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);

-- =========================================================
-- RECUPERAÇÃO IMEDIATA (rode uma vez, agora)
-- =========================================================
-- Pra recuperar as vendas que já ficaram presas nos últimos dias,
-- dispare a função uma vez olhando 7 dias pra trás. As reservas
-- pagas vão pra 'pago' e os e-mails saem na hora.
--
--   select net.http_post(
--     url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/stripe-reconcile',
--     headers := jsonb_build_object(
--       'Content-Type',  'application/json',
--       'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
--     ),
--     body    := '{"period_days":7}'::jsonb,
--     timeout_milliseconds := 120000
--   );
--
-- Pra só CONFERIR sem alterar nada (dry run), use:
--   body := '{"period_days":7,"dry_run":true}'::jsonb
-- =========================================================

-- =========================================================
-- VERIFICAÇÃO
-- =========================================================
--   select jobid, jobname, schedule, active from cron.job
--    where jobname = 'elarah-stripe-reconcile';
--
--   select * from cron.job_run_details
--    where jobid in (select jobid from cron.job where jobname = 'elarah-stripe-reconcile')
--    order by start_time desc limit 10;
-- =========================================================
