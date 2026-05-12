-- =============================================================
-- ELARAH — Adiciona campos custom para a página da campanha
-- -------------------------------------------------------------
-- Permite admin escrever descrição/narrativa específica da campanha
-- sem alterar a descrição original da experiência.
--
-- Já existem: titulo_custom, subtitulo_custom, badge_text, imagem_custom.
-- Adiciona: descricao_custom.
--
-- IDEMPOTENTE
-- =============================================================
alter table public.campaign_overrides
  add column if not exists descricao_custom text;

comment on column public.campaign_overrides.descricao_custom is
  'Narrativa/descrição da experiência ESPECÍFICA da campanha. Quando preenchida, substitui experiences.descricao na página da campanha.';
