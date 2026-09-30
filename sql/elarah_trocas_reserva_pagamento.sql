-- =============================================================
-- ELARAH — Troca pela cliente com DIFERENÇA A PAGAR
-- -------------------------------------------------------------
-- Complementa sql/elarah_trocas_reserva.sql (rode aquele antes).
--
-- Quando a cliente troca por uma opção mais cara, ela paga a diferença
-- (Pix no Mercado Pago ou cartão no Pagar.me) e a troca só é aplicada
-- quando o pagamento aprova. Enquanto isso a linha fica em
-- trocas_reserva com status 'aguardando_pagamento' e o pedido guardado.
--
-- status:
--   aplicada              troca feita (com ou sem diferença)
--   aguardando_pagamento  cobrança criada, esperando aprovar
--   processando           pagamento aprovou, aplicando a troca
--   pagamento_recusado    cartão recusado / Pix expirou ou foi cancelado
--   cancelada             a cliente abriu outra tentativa
--   erro_pagamento        o gateway não criou a cobrança
--   pago_sem_vaga         PAGOU mas a data esgotou → Elarah resolve
--   pago_sem_aplicar      PAGOU mas a reserva mudou → Elarah resolve
-- (linhas antigas, de antes deste arquivo, ficam com status vazio = aplicada)
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

alter table public.trocas_reserva
  add column if not exists status                    text,
  add column if not exists pedido                    jsonb,
  add column if not exists diferenca_centavos        integer,
  add column if not exists pagamento_metodo          text,
  add column if not exists pagamento_id              text,
  add column if not exists pagamento_status          text,
  add column if not exists pagamento_valor_centavos  integer,
  add column if not exists pagamento_parcelas        integer,
  add column if not exists pagamento_expira_em       timestamptz,
  add column if not exists pagamento_dados           jsonb,
  add column if not exists pago_at                   timestamptz;

create index if not exists trocas_reserva_status_idx
  on public.trocas_reserva (status);
