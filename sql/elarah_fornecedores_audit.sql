-- =============================================================
-- ELARAH — Diagnóstico estrutural de Fornecedores/Parceiros
-- -------------------------------------------------------------
-- Script 100% SELECT — não altera nada. Cada bloco responde uma
-- pergunta específica do relatório de auditoria. Roda os blocos
-- separadamente no SQL Editor do Supabase e me passa o output.
--
-- Cobertura:
--   1. Quem é o fornecedor "Desconhecido" e quanto ele movimentou
--   2. Bookings pagas com fornecedor_nome NULL ou vazio
--   3. Experiências sem fornecedor_nome
--   4. Manual sales sem supplier_name
--   5. fornecedores_metadata órfãs (sem booking/experience)
--   6. Duplicidade de fornecedores (mesmo nome, keys diferentes)
--   7. Prospects com promoted_supplier_key inválido
--   8. Função set_updated_at() existe? (afeta save de data_entrada)
--   9. Diagnóstico final consolidado
-- =============================================================


-- =============================================================
-- BLOCO 1 — Quem é o "Desconhecido" e quanto ele movimentou
-- -------------------------------------------------------------
-- O nome 'Desconhecido' vem da trigger bookings_autofill_fornecedor
-- (sql/elarah_bookings_fornecedor_autofill.sql:94) — fallback final
-- quando experience.fornecedor_nome + profile.partner_data + profile.nome
-- estão TODOS vazios.
--
-- Esperado: ver quais experiências/profiles geraram bookings com
-- esse fallback, e quanto de receita está afetada.
-- =============================================================
select
  b.id                                               as booking_id,
  b.created_at,
  b.experiencia_id,
  b.experiencia_nome,
  b.amount_total,
  b.status,
  b.status_fornecedor,
  e.id                                               as experience_id_lookup,
  e.fornecedor_nome                                  as exp_fornecedor_nome,
  e.created_by                                       as exp_created_by,
  pr.nome                                            as profile_nome,
  pr.partner_data->>'marca'                          as profile_marca
from public.bookings b
left join public.experiences e on e.id = b.experiencia_id
left join public.profiles pr   on pr.id = e.created_by
where lower(coalesce(b.fornecedor_nome, '')) = 'desconhecido'
order by b.created_at desc;


-- =============================================================
-- BLOCO 2 — Resumo do "Desconhecido": qty + receita
-- -------------------------------------------------------------
-- Pergunta: quantos bookings, qual receita confirmada e pendente.
-- =============================================================
select
  count(*)                                                          as qty_total,
  count(*) filter (where status = 'pago')                           as qty_pagos,
  count(*) filter (where status = 'pending')                        as qty_pendentes,
  coalesce(sum(amount_total) filter (where status = 'pago'), 0)     as receita_pago_centavos,
  coalesce(sum(amount_total) filter (where status = 'pending'), 0)  as receita_pendente_centavos,
  ((coalesce(sum(amount_total) filter (where status = 'pago'), 0)) / 100.0)::numeric(14,2) as receita_pago_reais
from public.bookings
where lower(coalesce(fornecedor_nome, '')) = 'desconhecido';


-- =============================================================
-- BLOCO 3 — Bookings PAGAS com fornecedor_nome vazio/NULL
-- -------------------------------------------------------------
-- Casos que escaparam até da trigger. Indica problema no fluxo
-- de criação (edge function antiga, insert manual, etc.).
-- =============================================================
select
  b.id, b.created_at, b.experiencia_id, b.experiencia_nome,
  b.amount_total, b.status, b.fornecedor_nome,
  e.fornecedor_nome as exp_fornecedor_nome
from public.bookings b
left join public.experiences e on e.id = b.experiencia_id
where b.status = 'pago'
  and (b.fornecedor_nome is null or trim(b.fornecedor_nome) = '')
order by b.created_at desc
limit 50;


-- =============================================================
-- BLOCO 4 — Experiências sem fornecedor_nome
-- -------------------------------------------------------------
-- Causa raiz mais comum do "Desconhecido": admin criou experiência
-- sem preencher o campo Fornecedor.
-- =============================================================
select
  e.id, e.nome, e.is_active, e.is_test, e.fornecedor_nome,
  e.created_at, e.created_by, pr.nome as profile_nome
from public.experiences e
left join public.profiles pr on pr.id = e.created_by
where (e.fornecedor_nome is null or trim(e.fornecedor_nome) = '')
  and coalesce(e.is_test, false) = false
order by e.created_at desc;


-- =============================================================
-- BLOCO 5 — Manual sales sem supplier_name
-- -------------------------------------------------------------
-- Mesma checagem pra vendas registradas manualmente.
-- =============================================================
select
  ms.id, ms.created_at, ms.experience_id, ms.experience_name,
  ms.payment_status, ms.total_amount_centavos,
  ms.supplier_name, ms.supplier_key,
  e.fornecedor_nome as exp_fornecedor_nome
from public.manual_sales ms
left join public.experiences e on e.id = ms.experience_id
where ms.payment_status = 'pago'
  and (ms.supplier_name is null or trim(ms.supplier_name) = '')
order by ms.created_at desc
limit 50;


-- =============================================================
-- BLOCO 6 — Possível duplicidade no fornecedores_metadata
-- -------------------------------------------------------------
-- Acha 2+ entradas com nomes que normalizam pra mesma chave
-- (acentuação, espaços, caixa) — indicaria bug histórico de
-- normalização. Hoje a coluna fornecedor_key é UNIQUE, então
-- duplicata exata é impossível, mas casos histéricos podem ter
-- ficado com keys diferentes.
-- =============================================================
select
  lower(unaccent(regexp_replace(coalesce(fornecedor_nome, ''), '\s+', ' ', 'g'))) as nome_norm,
  array_agg(fornecedor_key) as keys,
  array_agg(fornecedor_nome) as nomes,
  count(*) as qty
from public.fornecedores_metadata
group by lower(unaccent(regexp_replace(coalesce(fornecedor_nome, ''), '\s+', ' ', 'g')))
having count(*) > 1;


-- =============================================================
-- BLOCO 7 — Fornecedores em bookings/experiences que NÃO existem em
-- fornecedores_metadata (órfãos invertidos)
-- -------------------------------------------------------------
-- Lista nomes de fornecedor que aparecem em bookings ou experiences
-- mas não têm linha de metadata (whatsapp, data_entrada, tipo_parceria
-- ainda vazios). Esses são os "esperando primeiro click pra criar
-- a row de metadata".
-- =============================================================
with todos_nomes as (
  select distinct trim(fornecedor_nome) as nome
    from public.bookings
   where fornecedor_nome is not null and trim(fornecedor_nome) <> ''
  union
  select distinct trim(fornecedor_nome) as nome
    from public.experiences
   where fornecedor_nome is not null and trim(fornecedor_nome) <> ''
     and coalesce(is_test, false) = false
)
select t.nome,
       lower(unaccent(regexp_replace(t.nome, '\s+', ' ', 'g'))) as fornecedor_key_esperada
from todos_nomes t
left join public.fornecedores_metadata fm
       on fm.fornecedor_key = lower(unaccent(regexp_replace(t.nome, '\s+', ' ', 'g')))
where fm.fornecedor_key is null
order by t.nome;


-- =============================================================
-- BLOCO 8 — fornecedores_metadata sem rastro em bookings/experiences
-- -------------------------------------------------------------
-- Inverso do bloco 7: linhas de metadata SEM nenhuma referência
-- na operação. São fornecedores promovidos via Prospecção mas
-- sem nenhuma experiência/venda ainda.
-- =============================================================
with refs as (
  select distinct lower(unaccent(regexp_replace(coalesce(fornecedor_nome, ''), '\s+', ' ', 'g'))) as k
    from public.bookings
   where fornecedor_nome is not null
  union
  select distinct lower(unaccent(regexp_replace(coalesce(fornecedor_nome, ''), '\s+', ' ', 'g')))
    from public.experiences
   where fornecedor_nome is not null
)
select fm.fornecedor_key,
       fm.fornecedor_nome,
       fm.data_entrada,
       fm.tipo_parceria,
       fm.prospect_id,
       fm.created_at
from public.fornecedores_metadata fm
left join refs r on r.k = fm.fornecedor_key
where r.k is null
order by fm.created_at desc;


-- =============================================================
-- BLOCO 9 — Prospects com promoted_supplier_key inválido
-- -------------------------------------------------------------
-- Prospect tem promoted_supplier_key mas não há linha em
-- fornecedores_metadata com essa key. Indicaria que a promoção
-- falhou no meio (ex: o bug fornecedor_key ambiguous).
-- =============================================================
select
  p.id, p.nome, p.status,
  p.promoted_supplier_key,
  p.promoted_to_fornecedor_at
from public.prospects p
left join public.fornecedores_metadata fm
       on fm.fornecedor_key = p.promoted_supplier_key
where p.promoted_supplier_key is not null
  and fm.fornecedor_key is null;


-- =============================================================
-- BLOCO 10 — set_updated_at() existe?
-- -------------------------------------------------------------
-- A função é referenciada por trigger em fornecedores_metadata.
-- Se não existe, qualquer UPDATE na tabela falha — inclusive
-- save de data_entrada / tipo_parceria.
-- =============================================================
select
  routine_name,
  routine_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'set_updated_at';
-- Esperado: 1 linha. Se vier vazio, é a causa raiz do bug 2.


-- =============================================================
-- BLOCO 11 — Triggers ativos em fornecedores_metadata
-- -------------------------------------------------------------
-- Confere que o trigger set_fornecedores_metadata_updated_at
-- está habilitado E aponta pra função existente.
-- =============================================================
select
  tgname                                    as trigger_name,
  pg_get_triggerdef(t.oid)                  as definition,
  tgenabled                                 as enabled_state -- 'O' = origin (default), 'D' = disabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where c.relname = 'fornecedores_metadata'
  and not t.tgisinternal;


-- =============================================================
-- BLOCO 12 — RLS atual em fornecedores_metadata
-- -------------------------------------------------------------
-- Lista as policies pra confirmar que admin consegue UPDATE.
-- Se policy is_admin() está com bug, save falha silenciosamente.
-- =============================================================
select
  schemaname, tablename, policyname, permissive,
  roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'fornecedores_metadata';


-- =============================================================
-- BLOCO 13 — Sumário consolidado da auditoria
-- -------------------------------------------------------------
-- Uma tabela com a contagem de cada problema. Bate em <30s.
-- =============================================================
select
  -- Nº 1: Desconhecido
  (select count(*) from public.bookings
    where lower(coalesce(fornecedor_nome, '')) = 'desconhecido')         as bookings_desconhecido,
  (select count(*) from public.bookings
    where lower(coalesce(fornecedor_nome, '')) = 'desconhecido' and status = 'pago') as bookings_desconhecido_pagos,

  -- Nº 2: bookings pagas sem fornecedor (mesmo após trigger)
  (select count(*) from public.bookings
    where status = 'pago'
      and (fornecedor_nome is null or trim(fornecedor_nome) = ''))       as bookings_sem_fornecedor,

  -- Nº 3: experiências sem fornecedor_nome (não-teste)
  (select count(*) from public.experiences
    where (fornecedor_nome is null or trim(fornecedor_nome) = '')
      and coalesce(is_test, false) = false)                              as experiencias_sem_fornecedor,

  -- Nº 4: manual sales pagas sem supplier_name
  (select count(*) from public.manual_sales
    where payment_status = 'pago'
      and (supplier_name is null or trim(supplier_name) = ''))           as manual_sales_sem_supplier,

  -- Nº 5: fornecedores em bookings/experiences sem metadata
  (select count(*) from (
     with todos as (
       select distinct lower(unaccent(regexp_replace(fornecedor_nome,'\s+',' ','g'))) as k
       from public.bookings where fornecedor_nome is not null
       union
       select distinct lower(unaccent(regexp_replace(fornecedor_nome,'\s+',' ','g')))
       from public.experiences where fornecedor_nome is not null
     )
     select t.k from todos t
     left join public.fornecedores_metadata fm on fm.fornecedor_key = t.k
     where fm.fornecedor_key is null
   ) sub)                                                                as fornecedores_sem_metadata,

  -- Nº 6: prospects com promoted_supplier_key órfão
  (select count(*) from public.prospects p
    left join public.fornecedores_metadata fm on fm.fornecedor_key = p.promoted_supplier_key
    where p.promoted_supplier_key is not null
      and fm.fornecedor_key is null)                                     as prospects_promoted_orfaos,

  -- Nº 7: fornecedores_metadata órfãos
  (select count(*) from (
     with refs as (
       select distinct lower(unaccent(regexp_replace(fornecedor_nome,'\s+',' ','g'))) as k
       from public.bookings where fornecedor_nome is not null
       union
       select distinct lower(unaccent(regexp_replace(fornecedor_nome,'\s+',' ','g')))
       from public.experiences where fornecedor_nome is not null
     )
     select fm.fornecedor_key from public.fornecedores_metadata fm
     left join refs r on r.k = fm.fornecedor_key
     where r.k is null
   ) sub)                                                                as metadata_orfaos,

  -- Nº 8: set_updated_at() existe?
  (select count(*) from information_schema.routines
    where routine_schema = 'public' and routine_name = 'set_updated_at') as set_updated_at_existe;
