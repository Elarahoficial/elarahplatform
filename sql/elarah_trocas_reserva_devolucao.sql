-- =============================================================
-- ELARAH — Troca por opção MAIS BARATA: o que fazer com a sobra
-- -------------------------------------------------------------
-- Complementa sql/elarah_trocas_reserva.sql e
-- sql/elarah_trocas_reserva_pagamento.sql (rode aqueles antes).
--
-- Quando a cliente troca por uma experiência mais barata, a sobra vira:
--   credito → cupom de valor fixo (tabela coupons), uso único, 90 dias.
--             Fica como desconto, não entra como receita nova.
--   pix     → a Elarah devolve por Pix em até 72h. Fica pendente na aba
--             "Trocas e reembolsos" até marcar como feito.
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

alter table public.trocas_reserva
  add column if not exists devolucao_tipo        text,   -- credito | pix
  add column if not exists devolucao_centavos    integer,
  add column if not exists credito_codigo        text,
  add column if not exists credito_expira_em     timestamptz,
  add column if not exists reembolso_pix_chave   text,
  add column if not exists reembolso_prazo       timestamptz,
  add column if not exists reembolso_feito_at    timestamptz;
