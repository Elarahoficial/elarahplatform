-- =============================================================
-- ELARAH — Diagnóstico: compra de R$383 que caiu R$83 no PIX
-- -------------------------------------------------------------
-- Reserva investigada:
--   Claudia Marques · ccfmarques@yahoo.com.br · (11) 99810-7339
--   "Mundo da Confeitaria Diet" · 03/09 · 19h00 – 22h30
--
-- HIPÓTESE PRINCIPAL: gift card de R$300 (valor que existe como
-- botão pronto em presentear.js: data-val="30000").
--   R$383 (preço cheio) − R$300 (gift card) = R$83 cobrados no PIX.
-- Se for isso, NÃO houve bug: o desconto foi aplicado como previsto
-- e o valor do gift card já tinha sido pago antes, na compra do vale.
--
-- Rode as consultas na ordem. A de nº 1 já responde sozinha.
-- Somente leitura — nenhuma consulta aqui altera dados.
-- =============================================================

-- =========================================================
-- 1. A RESERVA — o mapa completo do dinheiro
-- =========================================================
-- Leia assim:
--   preco_label              = preço exibido na experiência (esperado 'R$383')
--   amount_total             = o que foi efetivamente cobrado (esperado 8300)
--   gift_card_code/centavos  = vale legado abatido (hipótese: 30000)
--   coupon_code/discount     = cupom promocional abatido (alternativa)
--   quantidade               = nº de vagas (multiplica o preço base)
--   diferenca_nao_explicada  = 0 → desconto legítimo, nada sumiu.
--                              ≠ 0 → aí sim é bug de cálculo, investigar.
select
  b.id                             as booking_id,
  b.created_at,
  b.status,
  b.nome,
  b.email,
  b.experiencia_nome,
  b.data,
  b.horario,
  b.quantidade,
  b.preco_label,
  b.amount_total                   as cobrado_centavos,
  (b.amount_total / 100.0)         as cobrado_reais,
  b.gift_card_code,
  b.gift_card_centavos,
  b.coupon_code,
  b.coupon_discount_centavos,
  b.payment_provider,
  b.metadata ->> 'payment_method'  as metodo,
  b.valor_cheio_centavos,
  b.valor_repasse_centavos,
  b.valor_comissao_centavos,
  b.metadata ->> 'variant_selected' as variacao_escolhida,
  b.stripe_session_id              as ref_pagamento,
  -- Preço de tabela reconstruído a partir do rótulo ('R$383' -> 38300)
  (
    nullif(regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'), '')
  )                                as preco_label_digitos,
  -- Conferência: cobrado + descontos deveria bater com preço × quantidade
  (
    coalesce(b.amount_total, 0)
    + coalesce(b.gift_card_centavos, 0)
    + coalesce(b.coupon_discount_centavos, 0)
  )                                as cobrado_mais_descontos,
  (
    coalesce(b.amount_total, 0)
    + coalesce(b.gift_card_centavos, 0)
    + coalesce(b.coupon_discount_centavos, 0)
    - coalesce(
        round(
          coalesce(
            nullif(
              replace(
                regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'),
                ',', '.'
              ),
              ''
            ),
            '0'
          )::numeric * 100
        )::int * coalesce(b.quantidade, 1),
        0
      )
  )                                as diferenca_nao_explicada
from public.bookings b
where lower(b.email) = 'ccfmarques@yahoo.com.br'
   or b.experiencia_nome ilike '%Confeitaria Diet%'
order by b.created_at desc;

-- =========================================================
-- 2. O GIFT CARD — se a coluna gift_card_code veio preenchida
-- =========================================================
-- Mostra o vale usado: quanto valia, quanto sobrou, quem comprou.
-- Se valor_inicial_centavos = 30000, está confirmado: R$300 de vale.
select
  g.code,
  g.valor_inicial_centavos,
  (g.valor_inicial_centavos / 100.0) as valor_inicial_reais,
  g.saldo_centavos,
  (g.saldo_centavos / 100.0)         as saldo_reais,
  g.status,
  g.comprador_nome,
  g.comprador_email,
  g.destinatario_nome,
  g.destinatario_email,
  g.created_at                       as vale_comprado_em,
  g.redeemed_first_at,
  g.redeemed_last_at
from public.gift_cards g
where upper(g.code) in (
  select upper(b.gift_card_code)
  from public.bookings b
  where b.gift_card_code is not null
    and (
      lower(b.email) = 'ccfmarques@yahoo.com.br'
      or b.experiencia_nome ilike '%Confeitaria Diet%'
    )
);

-- =========================================================
-- 3. O CUPOM — alternativa ao gift card
-- =========================================================
-- Se o desconto veio de cupom promocional em vez de vale.
-- discount_type='value' → discount_value em centavos (30000 = R$300).
-- discount_type='percent' → discount_value em % (383 × % = desconto).
select
  c.code,
  c.nome,
  c.discount_type,
  c.discount_value,
  c.experience_id,
  c.valid_from,
  c.valid_until,
  c.max_uses,
  c.times_used,
  c.is_active,
  u.amount_discount_centavos,
  (u.amount_discount_centavos / 100.0) as desconto_reais,
  u.email,
  u.used_at,
  u.booking_id
from public.coupon_uses u
join public.coupons c on c.id = u.coupon_id
where lower(u.email) = 'ccfmarques@yahoo.com.br'
   or u.booking_id in (
     select b.id from public.bookings b
     where b.experiencia_nome ilike '%Confeitaria Diet%'
   );

-- =========================================================
-- 4. A EXPERIÊNCIA — o preço que o backend leu
-- =========================================================
-- O backend cobra a partir de experiences.preco (e de variant_items
-- quando a pessoa escolhe uma opção). Se preco aqui estiver 'R$83'
-- em vez de 'R$383', o problema é cadastro — não gift card.
select
  e.id,
  e.nome,
  e.preco,
  e.data,
  e.horario,
  e.horarios,
  e.vagas_total,
  e.vagas_restantes,
  e.valor_cheio_centavos,
  e.percentual_repasse,
  e.fornecedor_nome,
  e.is_active,
  e.variant_items
from public.experiences e
where e.nome ilike '%Confeitaria Diet%';

-- =========================================================
-- 5. VARREDURA GERAL — outras reservas com a mesma cara
-- =========================================================
-- Últimos 60 dias: reservas pagas onde o valor cobrado NÃO bate com
-- preço × quantidade e NÃO há gift card nem cupom que justifique.
-- Se esta consulta voltar vazia, o caso da Claudia foi isolado e
-- explicado pelo desconto. Se voltar linhas, existe bug de cálculo.
select
  b.created_at,
  b.nome,
  b.email,
  b.experiencia_nome,
  b.quantidade,
  b.preco_label,
  b.amount_total,
  b.gift_card_centavos,
  b.coupon_discount_centavos,
  (
    coalesce(b.amount_total, 0)
    + coalesce(b.gift_card_centavos, 0)
    + coalesce(b.coupon_discount_centavos, 0)
    - round(
        replace(
          regexp_replace(b.preco_label, '[^0-9,]', '', 'g'), ',', '.'
        )::numeric * 100
      )::int * coalesce(b.quantidade, 1)
  ) as diferenca_centavos
from public.bookings b
where b.status = 'pago'
  and b.created_at > now() - interval '60 days'
  and b.preco_label ~ '[0-9]'
  and (
    coalesce(b.amount_total, 0)
    + coalesce(b.gift_card_centavos, 0)
    + coalesce(b.coupon_discount_centavos, 0)
    - round(
        replace(
          regexp_replace(b.preco_label, '[^0-9,]', '', 'g'), ',', '.'
        )::numeric * 100
      )::int * coalesce(b.quantidade, 1)
  ) <> 0
order by b.created_at desc;
