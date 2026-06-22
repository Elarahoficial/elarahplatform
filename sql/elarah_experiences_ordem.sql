-- =============================================================
-- ELARAH — Ordem manual de exibição das experiências
-- -------------------------------------------------------------
-- Adiciona a coluna `ordem` (integer) na tabela experiences.
-- Permite que o admin reordene as experiências arrastando na
-- lista (admin.html → Experiências). Quem fica em cima recebe o
-- menor número e aparece primeiro no site — em TODAS as listagens
-- (home, categoria.html, Elarah em Casa, etc.).
--
-- Regra de ordenação no frontend:
--   ordem definida (0,1,2…)  → aparece primeiro, em ordem crescente
--   ordem NULL               → vai pro fim, mantendo o sort padrão
--                              de cada página (cronológico / alfabético)
--
-- Por padrão a coluna é NULL pra TODAS as experiências existentes,
-- então nada muda no site até o admin arrastar a primeira vez —
-- comportamento atual 100% preservado.
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table public.experiences
  add column if not exists ordem integer;

comment on column public.experiences.ordem is
  'Ordem manual de exibição definida pelo admin (arrastar pra reordenar). Menor número aparece primeiro no site, em todas as listagens. NULL = sem ordem definida, cai no fim mantendo o sort padrão da página.';

-- Índice pra ordenar rápido por ordem.
create index if not exists idx_experiences_ordem
  on public.experiences (ordem);
