-- =============================================================
-- ELARAH — Ponte entre byelarah_items e experiences
-- -------------------------------------------------------------
-- Permite que um item By Elarah seja "comprável" (checkout direto)
-- sem precisar duplicar cadastro na aba Experiências do admin.
--
-- Modelo:
--   - byelarah_items continua sendo a fonte da verdade pro CARD
--     visual da aba By Elarah (nome, imagem, descrição curta,
--     local, data label, horários, etc).
--   - byelarah_items.experience_id (NOVO, opcional) aponta pra
--     uma row em experiences que contém os dados de checkout
--     (preço, vagas, descrição completa, fornecedor, repasse).
--
-- Fluxo:
--   * Admin edita item By Elarah → liga "É comprável" → preenche
--     campos extras → admin.js cria/atualiza experience espelho
--     com is_elarah_original=true e cta_mode='buy', e salva
--     experience_id de volta no byelarah_items.
--   * Admin desliga "É comprável" → marca a experience como
--     is_active=false (preserva histórico de bookings) e limpa
--     experience_id do byelarah_items (volta pra fluxo de lead).
--
-- Front (script.js renderOriginalsGrid):
--   * Card com experience_id preenchido → resolve a experience
--     e usa o fluxo `fromExperience=true` (botão chama
--     startCheckout, modal de descrição completa, etc).
--   * Card sem experience_id → comportamento atual (lead WhatsApp).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

alter table public.byelarah_items
  add column if not exists experience_id uuid
  references public.experiences(id) on delete set null;

-- Index parcial: só indexa rows com experience_id setado, que são
-- minoria. Acelera o JOIN no front sem inflar o índice.
create index if not exists idx_byelarah_items_experience_id
  on public.byelarah_items (experience_id)
  where experience_id is not null;

-- Refresh do PostgREST pra que a coluna nova fique imediatamente
-- disponível via API REST.
notify pgrst, 'reload schema';
