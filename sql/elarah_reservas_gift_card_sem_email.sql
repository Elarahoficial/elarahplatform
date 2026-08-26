-- =============================================================
-- QUEM COMPROU COM GIFT CARD E NUNCA RECEBEU CONFIRMAÇÃO
-- -------------------------------------------------------------
-- Quando o gift card / cupom cobre 100% do valor, o checkout gravava a
-- reserva direto como 'pago' e NÃO chamava o envio de e-mail. Não existe
-- registro no Resend dessas confirmações — elas nunca foram criadas.
-- Esta consulta lista, do próprio banco, todos os clientes atingidos.
--
-- Onde rodar: Supabase → SQL Editor → colar → Run.
-- Só LÊ dados. Não altera nada.
-- =============================================================

select
  (b.created_at at time zone 'America/Sao_Paulo')::date as comprou_em,
  b.nome,
  b.email,
  b.telefone,
  b.experiencia_nome,
  b.data     as data_experiencia,
  b.horario,
  b.quantidade,
  coalesce(b.gift_card_code, b.coupon_code) as codigo_usado,
  b.id       as booking_id
from bookings b
where b.status = 'pago'
  and (
    b.metadata->>'paid_with_gift_card_only' = 'true'
    or b.stripe_session_id like 'GIFT-%'
    or b.stripe_session_id like 'MP-GIFT-%'
    or b.stripe_session_id like 'PAGARME-GIFT-%'
  )
order by b.created_at desc;

-- Só o total, se quiser o número rápido:
-- select count(*) from bookings b
-- where b.status = 'pago'
--   and (b.metadata->>'paid_with_gift_card_only' = 'true'
--        or b.stripe_session_id like 'GIFT-%'
--        or b.stripe_session_id like 'MP-GIFT-%'
--        or b.stripe_session_id like 'PAGARME-GIFT-%');
