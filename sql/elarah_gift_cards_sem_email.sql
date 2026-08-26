-- =============================================================
-- GIFT CARDS QUE NUNCA CHEGARAM NO E-MAIL DO DESTINATÁRIO
-- -------------------------------------------------------------
-- `email_sent_at` só é gravado quando o envio dá certo (ver
-- stripe-webhook/mp-webhook). Se está NULL, o cliente comprou o gift
-- card e o destinatário nunca recebeu o código.
--
-- Onde rodar: Supabase → SQL Editor → colar → Run. Só LÊ.
-- =============================================================

select
  (g.created_at at time zone 'America/Sao_Paulo') as comprou_em,
  g.code                                          as codigo,
  g.destinatario_nome,
  g.destinatario_email,
  g.comprador_nome,
  g.comprador_email,
  (g.valor_inicial_centavos / 100.0)              as valor_reais,
  (g.saldo_centavos / 100.0)                      as saldo_reais,
  (g.expires_at at time zone 'America/Sao_Paulo')::date as expira_em,
  g.mensagem,
  g.status
from gift_cards g
where g.email_sent_at is null
  and g.status = 'active'
order by g.created_at desc;
