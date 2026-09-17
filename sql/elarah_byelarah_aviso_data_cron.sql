-- =========================================================
-- ELARAH — Agendamento do aviso "a data saiu" (By Elarah)
-- ---------------------------------------------------------
-- Chama a Edge Function byelarah-aviso-data a cada 5 minutos. Ela consome a
-- fila byelarah_date_announcements (alimentada pela trigger de
-- sql/elarah_byelarah_aviso_data.sql) e manda o WhatsApp pra quem estava na
-- lista de interesse do evento.
--
-- Por que 5 min se o painel já chama a função na hora de salvar?
--   O painel é o caminho rápido (aviso sai em segundos). Este cron é a rede
--   de segurança: pega data publicada direto no SQL Editor, navegador
--   fechado no meio do envio, lote grande que precisa de mais de uma
--   passada, e onda que ficou parada por kill switch/rollout.
--
-- SEGURO ligar antes de liberar envios: em modo observação a função só
-- REGISTRA quem receberia (whatsapp_send_log), sem enviar nada.
--
-- Pré-requisitos:
--   * pg_cron + pg_net habilitados.
--   * sql/elarah_byelarah_aviso_data.sql já rodado.
--   * Edge Function byelarah-aviso-data deployada (verify_jwt OFF).
--   * Troque 'TROQUE_PELA_SUA_CRON_SECRET' pela sua CRON_SECRET.
-- =========================================================

do $$
begin
  perform cron.unschedule('elarah-byelarah-aviso-data');
exception when others then null;
end $$;

select cron.schedule(
  'elarah-byelarah-aviso-data',
  '*/5 * * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/byelarah-aviso-data',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_PELA_SUA_CRON_SECRET'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job
--    where jobname = 'elarah-byelarah-aviso-data';
--
--   -- Andamento das ondas:
--   select item_nome, data_texto, status, total_alvo, enviados,
--          observados, pulados, erro, created_at, processed_at
--     from byelarah_date_announcements
--    order by created_at desc limit 20;
--
--   -- Em modo observação, quem RECEBERIA:
--   select kind, phone_masked, status, created_at
--     from whatsapp_send_log
--    where kind like '%byelarah_date%'
--    order by created_at desc;
-- =========================================================
