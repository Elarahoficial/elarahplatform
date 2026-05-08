-- =============================================================
-- ELARAH — Rotina: soft delete via dismissed_at
-- -------------------------------------------------------------
-- Bug: ao excluir uma tarefa de template/experiência, ela era
-- deletada do banco mas o ensure_routine_week (chamado logo
-- depois ao re-renderizar) RE-INSERIA a partir do template.
-- Resultado: tarefa some por 1s e volta.
--
-- Fix: soft delete. A tarefa fica gravada mas com dismissed_at
-- preenchido. Não aparece na UI, e a unique constraint
-- (week_start, template_id / experience_id+kind+ordem) impede
-- o ensure_routine_week de inserir uma nova.
--
-- Próximas semanas geram tudo do zero (week_start diferente),
-- então o "dismiss" é só pra semana específica — comportamento
-- desejado.
--
-- IDEMPOTENTE.
-- =============================================================

alter table public.routine_tasks
  add column if not exists dismissed_at timestamptz;

create index if not exists routine_tasks_dismissed_idx
  on public.routine_tasks (week_start)
  where dismissed_at is null;

notify pgrst, 'reload schema';
