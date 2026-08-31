-- =============================================================
-- ELARAH — Compra da Claudia: TUDO numa consulta só
-- -------------------------------------------------------------
-- Claudia Marques · ccfmarques@yahoo.com.br
-- "Mundo da Confeitaria Diet" · 03/09 · 19h00 – 22h30
-- Comprou R$383, caiu R$83 no PIX. Cadê os R$300?
--
-- POR QUE ESTE ARQUIVO EXISTE: o SQL Editor do Supabase mostra
-- só o resultado da ÚLTIMA instrução quando você roda um arquivo
-- com várias consultas. Aqui é UMA consulta só — cola, roda, lê.
--
-- COMO LER O RESULTADO (as 3 colunas que importam):
--
--   veredito                → a resposta em texto puro. Leia esta.
--   desconto_total_reais    → quanto foi abatido (esperado: 300,00)
--   diferenca_nao_explicada → 0 = tudo certo. ≠ 0 = bug de verdade.
--
-- As demais colunas mostram QUEM deu o desconto: gc_* é gift card
-- (vale presente), cp_* é cupom promocional. Só uma das duas vem
-- preenchida.
--
-- Somente leitura.
-- =============================================================

select
  -- ===== O VEREDITO =====
  case
    when coalesce(b.gift_card_centavos, 0) > 0
      then 'GIFT CARD — vale de R$ '
           || to_char(coalesce(b.gift_card_centavos, 0) / 100.0, 'FM999G999D00')
           || ' abatido. Cobrança correta, o vale já tinha sido pago antes.'
    when coalesce(b.coupon_discount_centavos, 0) > 0
      then 'CUPOM — desconto de R$ '
           || to_char(coalesce(b.coupon_discount_centavos, 0) / 100.0, 'FM999G999D00')
           || ' aplicado. Cobrança correta.'
    when coalesce(b.amount_total, 0) < round(
           coalesce(nullif(replace(regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'), ',', '.'), ''), '0')::numeric * 100
         )::int * coalesce(b.quantidade, 1)
      then 'ATENÇÃO — cobrado a menos SEM vale nem cupom. Isso é bug, investigar.'
    else 'OK — cobrado o valor cheio (ou mais, se teve taxa de cartão/variação).'
  end                                                      as veredito,

  -- ===== A RESERVA =====
  b.id                                                     as booking_id,
  b.created_at,
  b.status,
  b.nome,
  b.email,
  b.experiencia_nome,
  b.data,
  b.horario,
  b.quantidade,
  b.preco_label,
  b.amount_total / 100.0                                   as cobrado_reais,
  (coalesce(b.gift_card_centavos, 0) + coalesce(b.coupon_discount_centavos, 0)) / 100.0
                                                           as desconto_total_reais,
  b.payment_provider,
  b.metadata ->> 'payment_method'                          as metodo,
  b.metadata ->> 'variant_selected'                        as variacao,
  b.stripe_session_id                                      as ref_pagamento,

  -- ===== A CONFERÊNCIA =====
  round(
    coalesce(nullif(replace(regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'), ',', '.'), ''), '0')::numeric * 100
  )::int * coalesce(b.quantidade, 1) / 100.0               as esperado_reais,
  (
    coalesce(b.amount_total, 0)
    + coalesce(b.gift_card_centavos, 0)
    + coalesce(b.coupon_discount_centavos, 0)
    - round(
        coalesce(nullif(replace(regexp_replace(coalesce(b.preco_label, ''), '[^0-9,]', '', 'g'), ',', '.'), ''), '0')::numeric * 100
      )::int * coalesce(b.quantidade, 1)
  ) / 100.0                                                as diferenca_nao_explicada,

  -- ===== SE FOI GIFT CARD =====
  b.gift_card_code                                         as gc_codigo,
  g.valor_inicial_centavos / 100.0                         as gc_valor_original,
  g.saldo_centavos / 100.0                                 as gc_saldo_restante,
  g.status                                                 as gc_status,
  g.comprador_nome                                         as gc_quem_comprou,
  g.comprador_email                                        as gc_email_comprador,
  g.destinatario_nome                                      as gc_para_quem,
  g.created_at                                             as gc_comprado_em,

  -- ===== SE FOI CUPOM =====
  b.coupon_code                                            as cp_codigo,
  c.nome                                                   as cp_campanha,
  c.discount_type                                          as cp_tipo,
  c.discount_value                                         as cp_valor,
  c.times_used                                             as cp_vezes_usado,

  -- ===== A EXPERIÊNCIA (preço que o backend leu) =====
  e.preco                                                  as exp_preco_cadastrado,
  e.variant_items                                          as exp_variacoes

from public.bookings b
left join public.gift_cards g
       on upper(g.code) = upper(b.gift_card_code)
left join public.coupons c
       on c.id = b.coupon_id
left join public.experiences e
       on e.id = b.experiencia_id
where lower(b.email) = 'ccfmarques@yahoo.com.br'
   or b.experiencia_nome ilike '%Confeitaria Diet%'
order by b.created_at desc;
