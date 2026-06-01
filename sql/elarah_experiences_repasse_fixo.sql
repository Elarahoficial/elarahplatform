-- =============================================================
-- ELARAH — Repasse fixo por pessoa (em vez de percentual)
-- -------------------------------------------------------------
-- Adiciona valor_repasse_fixo_centavos na experiences. Quando
-- preenchido, sobrescreve percentual_repasse no calculo do
-- repasse pro fornecedor:
--
--   repasse = valor_repasse_fixo_centavos × quantidade
--
-- Util para fornecedores que cobram um cache fixo por pessoa
-- independente do preco cheio (ex: instrutor R$80/aluno).
--
-- Quando NULL → mantém comportamento legado (% sobre cheio).
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table public.experiences
  add column if not exists valor_repasse_fixo_centavos integer;

comment on column public.experiences.valor_repasse_fixo_centavos is
  'Valor fixo POR PESSOA que vai pro fornecedor. Quando preenchido, sobrescreve percentual_repasse no calculo do repasse.';
