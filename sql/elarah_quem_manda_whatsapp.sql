-- =============================================================
-- ELARAH — QUEM está mandando WhatsApp pela Meta
-- -------------------------------------------------------------
-- A Meta mostra que as mensagens SAÍRAM, mas não de onde. Este
-- arquivo procura o remetente dentro do seu próprio Supabase.
--
-- Todas as queries são SÓ LEITURA. Rode o arquivo inteiro de uma vez
-- e me mande o resultado das 4.
-- =============================================================

-- ===== 1. O QUE O BANCO DISPARA SOZINHO =====
-- O pg_cron guarda o COMANDO de cada agendamento — e o comando traz a
-- URL chamada. Se existe um agendamento chamando qualquer coisa além
-- das funções conhecidas, ele aparece aqui, com a URL na cara.
select
  jobid,
  jobname,
  schedule,
  active,
  command
from cron.job
order by jobid;

-- ===== 2. FUNÇÕES DO BANCO QUE FALAM COM A META =====
-- Procura, no código-fonte de TODAS as funções do banco, qualquer
-- referência à API do WhatsApp. Se alguém criou uma função que manda
-- mensagem, ela aparece aqui.
select
  n.nspname   as schema,
  p.proname   as funcao,
  left(p.prosrc, 300) as trecho
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog', 'information_schema')
  and (
    p.prosrc ilike '%graph.facebook%'
    or p.prosrc ilike '%messaging_product%'
    or p.prosrc ilike '%message_templates%'
    or p.prosrc ilike '%whatsapp%'
  )
order by 1, 2;

-- ===== 3. O BANCO ESTÁ FAZENDO CHAMADAS HTTP? =====
-- O pg_net registra as respostas das chamadas feitas pelo banco.
-- Muitas respostas recentes = tem algo chamando API de dentro daqui.
-- (Se der erro de tabela inexistente, o pg_net não está em uso: ignore.)
select
  count(*)                              as respostas_registradas,
  min(created)                          as mais_antiga,
  max(created)                          as mais_recente,
  count(*) filter (where status_code between 200 and 299) as ok,
  count(*) filter (where status_code >= 400)              as com_erro
from net._http_response;

-- ===== 4. TABELAS QUE GUARDAM ALGO DE WHATSAPP/META =====
-- Se outro sistema grava log/fila no MESMO banco, a tabela dele
-- aparece aqui — e o nome costuma entregar o dono.
select
  table_schema,
  table_name
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
  and (
    table_name ilike '%whatsapp%'
    or table_name ilike '%wpp%'
    or table_name ilike '%zap%'
    or table_name ilike '%meta%'
    or table_name ilike '%mensagem%'
    or table_name ilike '%message%'
    or table_name ilike '%notif%'
  )
order by 1, 2;

-- =============================================================
-- COMO LER
--
--   Query 1: agendamentos conhecidos são
--     elarah-automated-notifications, elarah-byelarah-aviso-data,
--     elarah-analytics-insights e backups. QUALQUER outro nome, ou
--     qualquer URL que não seja do seu próprio Supabase, é o suspeito.
--
--   Query 2: hoje NENHUMA função do banco deveria mandar WhatsApp —
--     quem manda são as Edge Functions. Se aparecer função aqui,
--     alguém criou por fora.
--
--   Query 3: número alto de respostas = o banco chama API sozinho.
--
--   Query 4: tabela desconhecida com nome de mensagem/whatsapp =
--     outro sistema usando o mesmo banco.
-- =============================================================
