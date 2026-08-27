-- =============================================================
-- POR QUE ESTA VENDA NÃO APARECE EM "REPASSES PENDENTES"?
-- -------------------------------------------------------------
-- O card de repasses só monta a lista com vendas manuais que
-- atendem TODAS estas condições (ver renderRepassesPendentesCard):
--   1. payment_status = 'pago'        ← evento com só a entrada paga NÃO passa
--   2. payout_status  = 'pendente'    ← default da tabela é 'nao_aplicavel'
--   3. payout_amount_centavos > 0
--
-- Esta consulta lista as vendas manuais que NÃO aparecem e diz qual
-- das condições cada uma falhou. Só LÊ, não altera nada.
-- =============================================================

select
  ms.customer_name                          as cliente,
  ms.experience_name                        as experiencia,
  ms.slot_date                              as data_evento,
  ms.supplier_name                          as fornecedor,
  (ms.payout_amount_centavos / 100.0)       as repasse_reais,
  ms.payment_status,
  ms.payout_status,
  case
    when ms.payment_status <> 'pago'
      then '1. payment_status = ' || ms.payment_status ||
           ' (evento com entrada/parcelas ainda em aberto)'
    when ms.payout_status = 'nao_aplicavel'
      then '2. payout_status = nao_aplicavel (a caixinha "tem repasse" ficou desmarcada no cadastro)'
    when ms.payout_status = 'pago'
      then '— já marcado como repassado'
    when coalesce(ms.payout_amount_centavos, 0) <= 0
      then '3. valor do repasse está zerado'
    else '?? deveria estar aparecendo'
  end                                       as motivo,
  ms.id
from public.manual_sales ms
where ms.payment_status <> 'cancelado'
  and ms.payment_status <> 'reembolsado'
  and not (
    ms.payment_status = 'pago'
    and ms.payout_status = 'pendente'
    and coalesce(ms.payout_amount_centavos, 0) > 0
  )
order by ms.slot_date desc nulls last;
