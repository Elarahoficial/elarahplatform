-- =============================================================
-- ELARAH — Diagnóstico: experiências DUPLICADAS (mesmo fornecedor,
--          mesmo valor, mesma descrição — só muda foto/data)
-- -------------------------------------------------------------
-- ⚠️  SÓ LEITURA. Este arquivo NÃO altera nada no banco.
--     Rode PRIMEIRO, revise o resultado, e só depois rode o
--     merge (sql/elarah_merge_duplicate_experiences.sql).
--
-- O QUE ELE FAZ
--   Acha grupos de experiências que são a MESMA coisa repetida
--   em dias diferentes. Duas experiências entram no mesmo grupo
--   quando têm, IGUAIS:
--     • fornecedor  (via experience_suppliers, ou o campo legado
--                    experiences.fornecedor_nome)
--     • valor       (experiences.preco)
--     • descrição   (experiences.descricao)
--   Foto e data NÃO entram na comparação de propósito — é
--   exatamente o que muda entre as cópias.
--
--   Só considera experiências VISÍVEIS (is_active <> false), pra
--   não mexer no que você já arquivou de propósito, e só grupos
--   com 2+ cópias.
--
-- COMO LER O RESULTADO (Consulta 1 — resumo por grupo)
--   • n_copias        → quantas experiências iguais existem hoje
--   • manter_id/nome  → qual delas o merge vai MANTER (a "principal")
--   • juntar_ids      → as que viram slots de data e são ocultadas
--   • total_reservas  → reservas somadas do grupo (nada se perde)
--   • total_slots     → datas/horários somados (viram as opções de data)
--   • tem_recorrencia → se TRUE, o grupo é PULADO no merge automático
--                       (recorrência é avançada; me chame pra tratar à mão)
--
-- Prontos os pré-requisitos (migrations já rodadas neste projeto):
--   elarah_supabase_setup.sql, elarah_experiences_fornecedor.sql,
--   elarah_experiences_visibility.sql, elarah_experience_suppliers.sql,
--   elarah_experience_slots.sql, elarah_bookings.sql
-- =============================================================

-- ---------- Consulta 1: RESUMO POR GRUPO (rode esta) ----------
with base as (
  select
    e.id,
    e.nome,
    e.imagem,
    e.created_at,
    lower(btrim(coalesce(e.preco, '')))                          as preco_key,
    lower(btrim(coalesce(e.descricao, '')))                      as desc_key,
    coalesce(
      (select string_agg(lower(btrim(es.fornecedor_nome)), '|'
                         order by lower(btrim(es.fornecedor_nome)))
         from public.experience_suppliers es
        where es.experience_id = e.id),
      lower(btrim(coalesce(e.fornecedor_nome, '')))
    )                                                            as sup_key,
    (select count(*) from public.bookings b
       where b.experiencia_id = e.id)                            as n_reservas,
    (select count(*) from public.experience_slots s
       where s.experience_id = e.id)                             as n_slots,
    exists (select 1 from public.experience_recurrence_rules r
              where r.experience_id = e.id)                      as tem_recorrencia
  from public.experiences e
  where coalesce(e.is_active, true) <> false
),
grp as (
  select
    sup_key,
    preco_key,
    md5(desc_key) as desc_hash,
    count(*)                                                     as n_copias,
    bool_or(tem_recorrencia)                                     as tem_recorrencia,
    sum(n_reservas)                                              as total_reservas,
    sum(n_slots)                                                 as total_slots,
    -- ordem de escolha da "principal": mais reservas primeiro,
    -- depois a mais antiga, depois id (desempate estável).
    (array_agg(id  order by n_reservas desc, created_at asc, id asc))[1] as manter_id,
    (array_agg(nome order by n_reservas desc, created_at asc, id asc))[1] as manter_nome,
    array_agg(nome order by n_reservas desc, created_at asc, id asc)     as todos_nomes,
    array_agg(id   order by n_reservas desc, created_at asc, id asc)     as todos_ids
  from base
  where length(desc_key) >= 20          -- ignora descrição vazia/curtíssima
  group by sup_key, preco_key, md5(desc_key)
  having count(*) > 1
)
select
  sup_key                                    as fornecedor,
  preco_key                                  as valor,
  n_copias,
  total_reservas,
  total_slots,
  tem_recorrencia,
  case when tem_recorrencia then 'PULADO (recorrência — tratar à mão)'
       else 'OK pra juntar' end              as acao,
  manter_id,
  manter_nome,
  (todos_ids)[2:array_length(todos_ids,1)]   as juntar_ids,
  todos_nomes
from grp
order by tem_recorrencia desc, n_copias desc, fornecedor;

-- ---------- Consulta 2: DETALHE LINHA A LINHA (opcional) ----------
-- Rode SEPARADO se quiser conferir cada experiência de cada grupo
-- (nome exato, foto e data que cada cópia tem hoje).
--
-- with base as ( ... mesma CTE `base` acima ... )
-- select sup_key as fornecedor, preco_key as valor, id, nome, imagem,
--        n_reservas, n_slots, created_at
--   from base
--  where length(lower(btrim(coalesce(desc_key,'')))) >= 20
--  order by fornecedor, valor, created_at;
