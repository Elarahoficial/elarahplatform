-- =============================================================
-- ELARAH — By Elarah Originals em experiences
-- -------------------------------------------------------------
-- Adiciona 3 colunas em public.experiences pra suportar:
--   * is_elarah_original   → marca a experiência como "Elarah Original"
--                            e exibe na aba By Elarah da home
--   * hide_from_categorias → se true, não aparece em categoria.html
--                            (útil pra Originals "exclusivos da aba")
--   * cta_mode             → 'buy' (checkout direto) ou 'waitlist'
--                            (botão de lista de espera/lead)
--
-- Defaults garantem retrocompatibilidade:
--   - is_elarah_original = false → comportamento atual
--   - hide_from_categorias = false → continua visível em categorias
--   - cta_mode = 'buy' → fluxo de checkout (default razoável pra
--                        experiências regulares já existentes)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================

alter table public.experiences
  add column if not exists is_elarah_original boolean not null default false;

alter table public.experiences
  add column if not exists hide_from_categorias boolean not null default false;

alter table public.experiences
  add column if not exists cta_mode text not null default 'buy';

-- Constraint pra cta_mode aceitar só os dois valores válidos.
-- Drop-and-recreate pra ser idempotente — uma vez criada, dropar
-- antes de recriar não causa erro mesmo na primeira execução
-- (graças ao if exists).
alter table public.experiences
  drop constraint if exists experiences_cta_mode_check;

alter table public.experiences
  add constraint experiences_cta_mode_check
  check (cta_mode in ('buy', 'waitlist'));

-- Index parcial pra acelerar a query "todos os Originals ativos"
-- usada no render da aba By Elarah da home. Só indexa as linhas com
-- a flag true (a maioria das experiências não é Original).
create index if not exists idx_experiences_elarah_original
  on public.experiences (is_elarah_original)
  where is_elarah_original = true;

-- Refresh do cache do PostgREST pra que as colunas novas fiquem
-- disponíveis imediatamente via API REST.
notify pgrst, 'reload schema';
