-- =============================================================
-- ELARAH — ordem manual dos cards na seção "By Elarah / Originals"
-- -------------------------------------------------------------
-- Contexto: a seção "Elarah Originals" (home + byelarah.html) é
-- montada a partir de DUAS fontes:
--   1. byelarah_items  → já tem a coluna `ordem`
--   2. experiences com is_elarah_original = true → NÃO tinha
--      nenhuma coluna de ordem própria da faixa By Elarah.
--
-- A coluna `ordem` de experiences já é usada pela ordenação GLOBAL
-- (grid da home + páginas de categoria). Reaproveitá-la aqui faria
-- o arrasto na aba By Elarah bagunçar a ordem do resto do site, por
-- isso a faixa ganha uma coluna própria — mesmo padrão já usado por
-- `campanha_ordem` (ordem dentro da página de campanha).
--
-- byelarah_ordem:
--   1     → primeiro card da faixa By Elarah
--   2     → segundo, e assim por diante
--   NULL  → sem ordem definida; cai no fim da faixa, mantendo a
--           ordem natural de hoje (retrocompatível).
--
-- Rodar uma vez no SQL Editor do Supabase. Idempotente.
-- =============================================================

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS byelarah_ordem integer;

COMMENT ON COLUMN public.experiences.byelarah_ordem IS
  'Posição manual do card na seção By Elarah / Elarah Originals (1 = primeiro). NULL = vai pro fim.';

-- Índice parcial: só as linhas que realmente são Originals. A faixa
-- filtra por is_elarah_original e ordena por isto.
CREATE INDEX IF NOT EXISTS experiences_byelarah_ordem_idx
  ON public.experiences (byelarah_ordem)
  WHERE is_elarah_original = true;

-- Refresh do cache do PostgREST pra coluna nova ficar disponível
-- imediatamente na API REST (sem esperar o reload automático).
NOTIFY pgrst, 'reload schema';

-- Confere:
-- SELECT id, nome, byelarah_ordem
--   FROM public.experiences
--  WHERE is_elarah_original = true
--  ORDER BY byelarah_ordem NULLS LAST, nome;
