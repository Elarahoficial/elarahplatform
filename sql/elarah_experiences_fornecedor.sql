-- =============================================================
-- ELARAH — Campos de fornecedor na tabela experiences
-- -------------------------------------------------------------
-- Adiciona dados do fornecedor e regra de repasse diretamente
-- na experiência. As bookings puxam esses valores no checkout.
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table public.experiences
  add column if not exists fornecedor_nome text,
  add column if not exists valor_cheio_centavos integer,
  add column if not exists percentual_repasse numeric(5,2) default 90.00;
