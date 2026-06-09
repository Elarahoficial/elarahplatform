-- =============================================================
-- ELARAH — Migracao: operacao solo (so "voce")
-- -------------------------------------------------------------
-- Admin agora opera sozinha. Migrar todas as tarefas/conteudos
-- existentes que tinham responsavel='socia' ou 'ambas' pra 'voce'.
-- Tambem atualiza defaults e constraints pra refletir o novo
-- modelo (so 'voce' nas 3 tabelas operacionais; 'voce' OU 'externo'
-- na de captacao porque pode terceirizar item pontual).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ===== 1) routine_templates (templates de tarefa fixa da Rotina) =====

-- Converte registros antigos
update public.routine_templates
   set responsavel = 'voce'
 where responsavel in ('socia','ambas');

-- Atualiza CHECK constraint
alter table public.routine_templates
  drop constraint if exists routine_templates_responsavel_check;
alter table public.routine_templates
  add constraint routine_templates_responsavel_check
  check (responsavel in ('voce'));

-- Atualiza default
alter table public.routine_templates
  alter column responsavel set default 'voce';


-- ===== 2) routine_tasks (tarefas concretas da semana) =====

update public.routine_tasks
   set responsavel = 'voce'
 where responsavel in ('socia','ambas');

alter table public.routine_tasks
  drop constraint if exists routine_tasks_responsavel_check;
alter table public.routine_tasks
  add constraint routine_tasks_responsavel_check
  check (responsavel in ('voce'));

alter table public.routine_tasks
  alter column responsavel set default 'voce';


-- ===== 3) content_pieces (aba Conteudo) =====

update public.content_pieces
   set responsavel = 'voce'
 where responsavel in ('socia','ambas');

alter table public.content_pieces
  drop constraint if exists content_pieces_responsavel_check;
alter table public.content_pieces
  add constraint content_pieces_responsavel_check
  check (responsavel in ('voce'));

alter table public.content_pieces
  alter column responsavel set default 'voce';


-- ===== 4) growth_tasks (aba Captacao) =====
-- Aqui mantemos 'externo' pra parceiros pontuais.

update public.growth_tasks
   set responsavel = 'voce'
 where responsavel in ('socia','ambas');

alter table public.growth_tasks
  drop constraint if exists growth_tasks_responsavel_check;
alter table public.growth_tasks
  add constraint growth_tasks_responsavel_check
  check (responsavel in ('voce','externo'));

alter table public.growth_tasks
  alter column responsavel set default 'voce';


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
-- Apos rodar, conferir que nao sobrou nenhuma 'socia' ou 'ambas':
--
-- select 'routine_templates' as tabela, responsavel, count(*)
--   from public.routine_templates group by responsavel
-- union all
-- select 'routine_tasks', responsavel, count(*)
--   from public.routine_tasks group by responsavel
-- union all
-- select 'content_pieces', responsavel, count(*)
--   from public.content_pieces group by responsavel
-- union all
-- select 'growth_tasks', responsavel, count(*)
--   from public.growth_tasks group by responsavel;
--
-- Resultado esperado: soh 'voce' (e 'externo' em growth_tasks).
-- =============================================================
