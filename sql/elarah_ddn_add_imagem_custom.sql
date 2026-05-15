-- =============================================================
-- ELARAH — Adiciona imagem_custom em campaign_overrides
-- -------------------------------------------------------------
-- Permite escolher uma foto específica APENAS pra campanha,
-- sem afetar a foto original da experiência.
--
-- Frontend: usa imagem_custom se preenchida, senão fallback
-- pra experiences.imagem.
--
-- IDEMPOTENTE
-- =============================================================
alter table public.campaign_overrides
  add column if not exists imagem_custom text;

comment on column public.campaign_overrides.imagem_custom is
  'URL da foto pra exibir SÓ na landing da campanha. Null = usa experiences.imagem.';
