-- =====================================================================
-- Correção geral — repasse calculado sobre o valor COM taxa de cartão
-- ---------------------------------------------------------------------
-- PROBLEMA (dois bugs combinados):
--   1) As experiências estão sem "Valor cheio" (valor_cheio_centavos null).
--   2) A trigger bookings_autofill_fornecedor, quando o valor cheio é null,
--      calcula o repasse sobre amount_total — que INCLUI a taxa do cartão.
--      (E usa 70% fixo, ignorando o percentual_repasse configurado.)
--   Resultado: em quase toda venda paga no cartão, o fornecedor recebeu
--   70% do valor COM taxa, em vez de 70% do preço do ingresso.
--
-- DECISÃO: manter 70/30, só tirar a taxa da base (repasse = 70% do preço
--   do ingresso, sem taxa). A comissão da Elarah = valor pago − repasse
--   (Elarah fica com 30% do ingresso + a taxa do cartão).
--
-- A "Vela & Tarot" (a78196bb...) fica de FORA — já foi corrigida à parte
-- pra 50% (R$109/ingresso). Não pode ser recalculada pra 70%.
--
-- COMO USAR (SQL Editor do Supabase) — rode na ordem, conferindo cada SELECT:
--   PARTE 1: raiz (preenche "Valor cheio" nas experiências) → corrige o futuro
--   PARTE 2: histórico (recalcula as vendas já feitas)
-- =====================================================================


-- =====================================================================
-- PARTE 1 — RAIZ: preenche "Valor cheio" a partir do preço
-- =====================================================================

-- 1.1 PREVIEW — confira se o "valor_cheio_novo" bate com o preço:
select id, nome, preco,
       round(replace(replace(regexp_replace(preco,'[^0-9,\.]','','g'),'.',''),',','.')::numeric * 100) as valor_cheio_novo
  from public.experiences
 where valor_cheio_centavos is null
   and preco ~ '[0-9]'
 order by nome;

-- 1.2 APLICA (rode após conferir o 1.1):
update public.experiences
   set valor_cheio_centavos = round(replace(replace(regexp_replace(preco,'[^0-9,\.]','','g'),'.',''),',','.')::numeric * 100)
 where valor_cheio_centavos is null
   and preco ~ '[0-9]';


-- =====================================================================
-- PARTE 2 — HISTÓRICO: recalcula vendas pagas (base sem taxa, 70/30)
-- =====================================================================
-- ticket = valor cheio da experiência (por pessoa) × quantidade
-- repasse_novo = 70% do ticket | comissao_nova = valor pago − repasse_novo
-- A coluna "pago_a_mais" mostra quanto o repasse atual está acima do novo;
-- onde status_fornecedor = 'repasse_feito', isso é o que o fornecedor já
-- recebeu a mais (você acerta com ele por fora).

-- 2.1 PREVIEW — confira as vendas afetadas, o ajuste e quais já foram pagas:
select b.id,
       b.experiencia_nome,
       b.status_fornecedor,
       greatest(coalesce(b.quantidade,1),1)                       as qtd,
       b.amount_total                                             as valor_pago,
       b.valor_repasse_centavos                                   as repasse_atual,
       round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70) as repasse_novo,
       b.valor_repasse_centavos
         - round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70) as pago_a_mais
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where b.status = 'pago'
   and b.valor_cheio_centavos is null
   and e.valor_cheio_centavos is not null
   and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'  -- Vela & Tarot (já 50%)
   and b.amount_total is not null
   and b.amount_total > 0
 order by b.status_fornecedor desc, b.experiencia_nome, b.created_at;

-- 2.2 APLICA (rode após conferir o 2.1):
update public.bookings b
   set valor_cheio_centavos    = e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1),
       valor_repasse_centavos  = round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70),
       valor_comissao_centavos = b.amount_total
                                 - round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70)
  from public.experiences e
 where b.experiencia_id = e.id
   and b.status = 'pago'
   and b.valor_cheio_centavos is null
   and e.valor_cheio_centavos is not null
   and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'  -- Vela & Tarot (já 50%)
   and b.amount_total is not null
   and b.amount_total > 0;

-- 2.3 ACERTO — fornecedores que JÁ tinham recebido (repasse_feito).
-- Reconstrói o que foi pago na regra antiga (70% do valor pago, com taxa)
-- e compara com o repasse correto (já aplicado pelo 2.2). A diferença é o
-- acerto a fazer com cada fornecedor:
--   diferenca > 0  → você ainda DEVE esse valor (pagou a menos)
--   diferenca < 0  → o fornecedor recebeu A MAIS (cobrar/abater)
-- Valores em centavos (divida por 100 pra reais).

-- 2.3a Resumo POR FORNECEDOR:
select fornecedor_nome,
       count(*)                                                    as vendas_ja_pagas,
       sum(round(amount_total * 0.70))::int                        as ja_repassado_aprox,
       sum(valor_repasse_centavos)::int                            as repasse_correto,
       sum(valor_repasse_centavos - round(amount_total * 0.70))::int as diferenca
  from public.bookings
 where status = 'pago'
   and status_fornecedor = 'repasse_feito'
   and experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
 group by fornecedor_nome
 order by diferenca;

-- 2.3b Detalhe POR VENDA (se quiser conferir caso a caso):
select b.fornecedor_nome, b.experiencia_nome,
       b.amount_total                                       as valor_pago,
       round(b.amount_total * 0.70)::int                    as repasse_pago_antigo,
       b.valor_repasse_centavos                             as repasse_correto,
       (b.valor_repasse_centavos - round(b.amount_total * 0.70))::int as diferenca
  from public.bookings b
 where b.status = 'pago'
   and b.status_fornecedor = 'repasse_feito'
   and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
 order by b.fornecedor_nome, b.experiencia_nome;
