-- =============================================================
-- ELARAH — Achamos: o que é a tabela message_log
-- -------------------------------------------------------------
-- A busca por tabelas de mensagem devolveu DUAS que não existem no
-- repositório da plataforma:
--     public.message_log
--     public.whatsapp_group_invites
--
-- Nenhuma das duas foi criada por este código. Alguém — ou algum
-- sistema — criou essas tabelas no mesmo banco. A message_log é
-- provavelmente o log de envio DELE.
--
-- Só leitura. Rode e me mande os 3 resultados.
-- =============================================================

-- ===== 1. QUAIS COLUNAS ELA TEM =====
-- O nome das colunas entrega o sistema: "template_name", "wamid",
-- "phone_number_id" = Cloud API da Meta. "instance"/"zaap" = Z-API.
select
  column_name    as coluna,
  data_type      as tipo
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'message_log'
order by ordinal_position;

-- ===== 2. AS 20 ÚLTIMAS LINHAS =====
-- Aqui aparece o que está sendo enviado, pra quem e quando. Se as
-- datas forem de hoje/ontem, é ESTE o sistema que está mandando as
-- 293 mensagens da semana.
select *
from public.message_log
order by 1 desc
limit 20;

-- ===== 3. DESDE QUANDO, E QUANTO =====
select
  count(*)  as total_de_linhas,
  min(created_at) as primeira,
  max(created_at) as ultima
from public.message_log;
-- Se a coluna de data tiver outro nome (a query 1 mostra), troque
-- created_at pelo nome certo e rode de novo.

-- =============================================================
-- A OUTRA TABELA
--   public.whatsapp_group_invites também não é do repositório.
--   Vale olhar depois:
--     select * from public.whatsapp_group_invites order by 1 desc limit 10;
-- =============================================================
