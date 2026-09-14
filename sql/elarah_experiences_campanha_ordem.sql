-- =============================================================
-- ELARAH — ordem manual da experiência dentro da página da campanha
-- -------------------------------------------------------------
-- Contexto: a aba "Campanhas" do admin saiu do menu. A curadoria de
-- campanha passou a ser feita no próprio formulário da experiência:
-- escolhe a campanha (coluna `campanha`, já existente) e diz em que
-- posição ela aparece na página daquela campanha.
--
-- campanha_ordem:
--   1     → primeira da página
--   2     → segunda, e assim por diante
--   NULL  → sem ordem definida; a página usa o critério automático
--           (data / curadoria) e joga essas no fim.
--
-- Rodar uma vez no SQL Editor do Supabase. Idempotente.
-- =============================================================

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS campanha_ordem integer;

COMMENT ON COLUMN public.experiences.campanha_ordem IS
  'Posição manual da experiência na página da campanha (1 = primeira). NULL = ordem automática.';

-- Índice pequeno: só as linhas que realmente têm campanha e ordem.
-- As páginas de campanha filtram por `campanha` e ordenam por isto.
CREATE INDEX IF NOT EXISTS experiences_campanha_ordem_idx
  ON public.experiences (campanha, campanha_ordem)
  WHERE campanha IS NOT NULL;

-- Confere:
-- SELECT id, nome, campanha, campanha_ordem
--   FROM public.experiences
--  WHERE campanha IS NOT NULL
--  ORDER BY campanha, campanha_ordem NULLS LAST, nome;
