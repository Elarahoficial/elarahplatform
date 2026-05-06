-- =============================================================
-- ELARAH — Sistema Operacional Semanal (Fase 1)
-- -------------------------------------------------------------
-- 3 abas novas no admin: Painel semanal / Rotina / Conteúdo
--
-- Tabelas:
--   routine_templates  — tarefas recorrentes por dia da semana
--   routine_tasks      — instâncias de tarefas por semana
--   content_pieces     — kanban de conteúdo (7 status)
--
-- RPC:
--   ensure_routine_week(p_week_start) — gera tarefas da semana a
--     partir do template (idempotente: ON CONFLICT DO NOTHING)
--
-- Seeds:
--   ~22 tarefas template baseadas no cronograma sugerido
--   (Seg=planejamento, Ter=prospecção, Qua=reuniões/cadastro,
--    Qui=divulgação, Sex=LinkedIn/revisão)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- RLS: admin only via public.is_admin().
-- =============================================================


-- ===== 1. routine_templates =====
-- week_day: 0=segunda, 1=terça, ..., 4=sexta (sáb/dom = 5/6, raro)
-- responsavel: 'voce' | 'socia' | 'ambas' (todos editáveis depois)
create table if not exists public.routine_templates (
  id           uuid primary key default gen_random_uuid(),
  week_day     smallint not null check (week_day between 0 and 6),
  titulo       text not null,
  responsavel  text not null default 'ambas'
               check (responsavel in ('voce','socia','ambas')),
  ordem        int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists routine_templates_active_day_idx
  on public.routine_templates (is_active, week_day, ordem) where is_active = true;

drop trigger if exists trg_routine_templates_updated_at on public.routine_templates;
create trigger trg_routine_templates_updated_at
  before update on public.routine_templates
  for each row execute function public.set_updated_at();

alter table public.routine_templates enable row level security;

drop policy if exists "routine_templates_admin_all" on public.routine_templates;
create policy "routine_templates_admin_all"
  on public.routine_templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 2. routine_tasks =====
-- week_start: data da segunda-feira da semana (anchor)
-- Permite navegar entre semanas e diferenciar instâncias.
create table if not exists public.routine_tasks (
  id            uuid primary key default gen_random_uuid(),
  week_start    date not null,
  week_day      smallint not null check (week_day between 0 and 6),
  titulo        text not null,
  responsavel   text not null default 'ambas'
                check (responsavel in ('voce','socia','ambas')),
  status        text not null default 'pendente'
                check (status in ('pendente','em_andamento','concluido')),
  notas         text,
  completed_at  timestamptz,
  template_id   uuid references public.routine_templates(id) on delete set null,
  ordem         int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists routine_tasks_week_idx
  on public.routine_tasks (week_start, week_day, ordem);
create index if not exists routine_tasks_status_idx
  on public.routine_tasks (status);
create index if not exists routine_tasks_template_idx
  on public.routine_tasks (template_id);

-- Garante 1 task por (semana, template) — evita ensure_routine_week
-- duplicar. Tasks pontuais (template_id=null) podem repetir.
create unique index if not exists routine_tasks_unique_per_template
  on public.routine_tasks (week_start, template_id) where template_id is not null;

drop trigger if exists trg_routine_tasks_updated_at on public.routine_tasks;
create trigger trg_routine_tasks_updated_at
  before update on public.routine_tasks
  for each row execute function public.set_updated_at();

alter table public.routine_tasks enable row level security;

drop policy if exists "routine_tasks_admin_all" on public.routine_tasks;
create policy "routine_tasks_admin_all"
  on public.routine_tasks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 3. content_pieces =====
-- Kanban de conteúdo: Ideia → Roteiro → Gravado → Editado →
-- Agendado → Postado → Reaproveitado.
-- tipos: array — uma peça pode ser Reels + Story (cross-post).
-- objetivo: tag única semantica (venda/branding/...).
-- experience_id: opcional, vincula a uma experiência específica.
create table if not exists public.content_pieces (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  tipos           text[] not null default '{}',
  objetivo        text
                  check (objetivo is null or objetivo in (
                    'venda','bastidor','branding','prova_social',
                    'lancamento','urgencia','autoridade'
                  )),
  experience_id   uuid references public.experiences(id) on delete set null,
  status          text not null default 'ideia'
                  check (status in (
                    'ideia','roteiro','gravado','editado',
                    'agendado','postado','reaproveitado'
                  )),
  scheduled_at    timestamptz,
  posted_at       timestamptz,
  responsavel     text not null default 'ambas'
                  check (responsavel in ('voce','socia','ambas')),
  notas           text,
  links           jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists content_pieces_status_idx
  on public.content_pieces (status);
create index if not exists content_pieces_scheduled_idx
  on public.content_pieces (scheduled_at)
  where status = 'agendado';
create index if not exists content_pieces_posted_idx
  on public.content_pieces (posted_at desc)
  where status in ('postado','reaproveitado');

drop trigger if exists trg_content_pieces_updated_at on public.content_pieces;
create trigger trg_content_pieces_updated_at
  before update on public.content_pieces
  for each row execute function public.set_updated_at();

alter table public.content_pieces enable row level security;

drop policy if exists "content_pieces_admin_all" on public.content_pieces;
create policy "content_pieces_admin_all"
  on public.content_pieces
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 4. RPC ensure_routine_week =====
-- Insere as tarefas da semana a partir dos templates ativos. Se a
-- tarefa de um template já existe pra essa semana (unique index),
-- é pulada via ON CONFLICT DO NOTHING.
-- Retorna a quantidade INSERIDA nessa chamada.
create or replace function public.ensure_routine_week(
  p_week_start date
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_inserted integer;
begin
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, template_id, ordem)
    select
      p_week_start,
      t.week_day,
      t.titulo,
      t.responsavel,
      t.id,
      t.ordem
    from public.routine_templates t
    where t.is_active = true
    on conflict (week_start, template_id) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  return coalesce(v_inserted, 0);
end;
$$;

grant execute on function public.ensure_routine_week(date)
  to authenticated, service_role;


-- ===== 5. Seed de templates iniciais =====
-- Só insere se a tabela estiver VAZIA (não sobrescreve customizações).
-- Cronograma sugerido: Seg=planejamento, Ter=prospecção, Qua=reuniões,
-- Qui=divulgação, Sex=revisão.
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select * from (values
  -- ===== SEGUNDA (week_day=0) =====
  (0, 'Planejar a semana', 'ambas', 10),
  (0, 'Revisar pendências da semana anterior', 'socia', 20),
  (0, 'Definir experiências foco da semana', 'ambas', 30),
  (0, 'Atualizar plataforma (vagas, fotos, status)', 'socia', 40),
  (0, 'Gravar 1-2 conteúdos novos', 'voce', 50),

  -- ===== TERÇA (week_day=1) — PROSPECÇÃO =====
  (1, 'Pesquisar 10 prospects novos', 'socia', 10),
  (1, 'Mandar 5 mensagens iniciais', 'socia', 20),
  (1, 'Follow-up no CRM (prospects sem resposta)', 'socia', 30),
  (1, 'Conteúdo de prova social (depoimento ou bastidor)', 'voce', 40),

  -- ===== QUARTA (week_day=2) — REUNIÕES E CADASTRO =====
  (2, 'Reuniões com fornecedores quentes', 'voce', 10),
  (2, 'Coletar materiais pós-reunião (fotos, valores, datas)', 'socia', 20),
  (2, 'Cadastrar experiências novas na plataforma', 'socia', 30),
  (2, 'Definir condições e repasses dos novos parceiros', 'ambas', 40),

  -- ===== QUINTA (week_day=3) — DIVULGAÇÃO E VENDAS =====
  (3, 'Stories pesados das experiências da semana', 'voce', 10),
  (3, 'Reels de conversão', 'voce', 20),
  (3, 'Mensagem do grupo WhatsApp Elarah', 'voce', 30),
  (3, 'Atualizar vagas restantes na plataforma', 'socia', 40),
  (3, 'Follow-up de interessados (carrinho abandonado etc)', 'socia', 50),

  -- ===== SEXTA (week_day=4) — REVISÃO E LINKEDIN =====
  (4, 'LinkedIn — 1 post longo (autoridade)', 'voce', 10),
  (4, 'Métricas da semana (Painel + Analytics)', 'socia', 20),
  (4, 'Organizar pendências pra próxima semana', 'ambas', 30),
  (4, 'Revisão criativa: o que funcionou e o que não', 'voce', 40)
) as v(week_day, titulo, responsavel, ordem)
where not exists (select 1 from public.routine_templates);


notify pgrst, 'reload schema';
