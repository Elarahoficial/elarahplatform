-- =============================================================
-- ELARAH — Varredura de cobrança v2 (só o que é bug de verdade)
-- -------------------------------------------------------------
-- POR QUE ESTA VERSÃO EXISTE:
-- A varredura v1 (elarah_diag_compra_confeitaria_383_vs_83.sql,
-- consulta 5) comparava amount_total com preco x quantidade e
-- devolvia ~250 linhas. QUASE TODAS SÃO NORMAIS:
--
--   1) TAXA DE CARTÃO. O cartão repassa a taxa ao cliente
--      (gross-up por parcela, ver PAGARME_FEES / applyCardFee).
--      Por isso R$162 vira 17265, 17831, 18078... — 6% a 12%
--      A MAIS, variando com o nº de parcelas. Diferença POSITIVA
--      pequena = taxa, não é erro.
--
--   2) VARIAÇÃO MAIS CARA. preco_label guarda o preço-base, mas
--      a pessoa escolheu "Dupla"/"Trio"/opção premium. Por isso
--      "Jantar às Cegas" R$289 virou R$439/R$466. Diferença
--      POSITIVA grande = variação, não é erro.
--
-- Em ambos o cliente pagou MAIS que o base — nunca a menos.
--
-- O QUE É BUG DE VERDADE: diferença NEGATIVA. Aí o cliente pagou
-- MENOS do que a experiência custa, sem gift card nem cupom que
-- justifique. É isso que esta varredura isola.
--
-- Somente leitura.
-- =============================================================

-- =========================================================
-- 1. UNDERCHARGE — cobrado a MENOS sem desconto que explique
-- =========================================================
-- Esta é a consulta que importa. Se voltar vazia, não existe
-- bug de cálculo na plataforma: todo mundo pagou o preço cheio
-- ou mais (taxa/variação), ou pagou menos com vale/cupom.
with base as (
  select
    b.*,
    round(
      coalesce(
        nullif(replace(regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'), ',', '.'), ''),
        '0'
      )::numeric * 100
    )::int * coalesce(b.quantidade, 1) as esperado_centavos
  from public.bookings b
  where b.status = 'pago'
    and b.created_at > now() - interval '90 days'
    and b.preco_label ~ '[0-9]'
)
select
  created_at,
  nome,
  email,
  experiencia_nome,
  quantidade,
  preco_label,
  esperado_centavos,
  amount_total                                          as cobrado_centavos,
  coalesce(gift_card_centavos, 0)                       as gift_card,
  coalesce(coupon_discount_centavos, 0)                 as cupom,
  coalesce(payment_provider, 'stripe')                  as gateway,
  metadata ->> 'payment_method'                         as metodo,
  metadata ->> 'variant_selected'                       as variacao,
  (
    coalesce(amount_total, 0)
    + coalesce(gift_card_centavos, 0)
    + coalesce(coupon_discount_centavos, 0)
    - esperado_centavos
  )                                                     as falta_centavos,
  (
    coalesce(amount_total, 0)
    + coalesce(gift_card_centavos, 0)
    + coalesce(coupon_discount_centavos, 0)
    - esperado_centavos
  ) / 100.0                                             as falta_reais
from base
where (
  coalesce(amount_total, 0)
  + coalesce(gift_card_centavos, 0)
  + coalesce(coupon_discount_centavos, 0)
  - esperado_centavos
) < 0
order by falta_centavos asc;

-- =========================================================
-- 2. PIX puro — a conferência mais limpa que existe
-- =========================================================
-- PIX NÃO tem taxa (o cliente paga o valor-base limpo). Então,
-- descontando vale e cupom, o PIX tem que bater CENTAVO A CENTAVO
-- com preco x quantidade. Qualquer diferença aqui — pra mais ou
-- pra menos — é variação de preço ou bug. Sem ruído de taxa.
with pix as (
  select
    b.*,
    round(
      coalesce(
        nullif(replace(regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'), ',', '.'), ''),
        '0'
      )::numeric * 100
    )::int * coalesce(b.quantidade, 1) as esperado_centavos
  from public.bookings b
  where b.status = 'pago'
    and b.created_at > now() - interval '90 days'
    and b.preco_label ~ '[0-9]'
    and (
      b.metadata ->> 'payment_method' = 'pix'
      or b.stripe_session_id like 'MP-%'
      or b.stripe_session_id like 'PAGARME-PIX-%'
    )
)
select
  created_at,
  nome,
  email,
  experiencia_nome,
  quantidade,
  preco_label,
  esperado_centavos,
  amount_total                          as cobrado_centavos,
  coalesce(gift_card_centavos, 0)       as gift_card,
  gift_card_code,
  coalesce(coupon_discount_centavos, 0) as cupom,
  coupon_code,
  metadata ->> 'variant_selected'       as variacao,
  (
    coalesce(amount_total, 0)
    + coalesce(gift_card_centavos, 0)
    + coalesce(coupon_discount_centavos, 0)
    - esperado_centavos
  )                                     as diferenca_centavos
from pix
where (
  coalesce(amount_total, 0)
  + coalesce(gift_card_centavos, 0)
  + coalesce(coupon_discount_centavos, 0)
  - esperado_centavos
) <> 0
order by diferenca_centavos asc;

-- =========================================================
-- 3. Caso apontado pela varredura v1: Renata Albuquerque
-- =========================================================
-- Única linha NEGATIVA da varredura: Modelagem em Cerâmica
-- (seg à sexta), 3 vagas, preço R$180 (= R$540 esperado), cobrado
-- R$360 redondo, sem taxa e sem vale. R$360 = exatamente 2 x R$180.
--
-- O valor redondo e sem taxa tem cara de VENDA MANUAL lançada no
-- admin (ver supabase/functions/notify-manual-sale) — nesse caso o
-- valor foi digitado e não é bug. Esta consulta mostra a origem:
-- se stripe_session_id começar com MANUAL/ADMIN, foi lançamento
-- manual. Se for uma sessão real de pagamento, aí houve cobrança
-- de 2 vagas numa reserva de 3.
select
  b.id,
  b.created_at,
  b.nome,
  b.email,
  b.experiencia_nome,
  b.quantidade,
  b.preco_label,
  b.amount_total,
  b.status,
  b.payment_provider,
  b.stripe_session_id,
  b.metadata
from public.bookings b
where b.email = 'renata_de_albuquerque@yahoo.com.br'
  and b.experiencia_nome ilike '%Modelagem em Cerâmica%'
order by b.created_at desc;
