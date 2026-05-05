-- =============================================================
-- ELARAH — financial_expenses: vínculo opcional com By Elarah
-- -------------------------------------------------------------
-- Permite que um gasto seja vinculado a um item By Elarah (curso,
-- workshop, etc.) — não só a uma experiência tradicional. Exemplo:
-- "Material da Mentoria By Elarah" → byelarah_item_id setado.
--
-- Os dois FKs são mutuamente exclusivos na UI (admin escolhe um OU
-- outro), mas o schema permite ambos NULL (gasto operacional geral)
-- e até ambos preenchidos (caso futuro de gasto compartilhado).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: financial_expenses, byelarah_items.
-- =============================================================

alter table public.financial_expenses
  add column if not exists byelarah_item_id uuid
    references public.byelarah_items(id) on delete set null;

create index if not exists financial_expenses_byelarah_idx
  on public.financial_expenses (byelarah_item_id);

notify pgrst, 'reload schema';
