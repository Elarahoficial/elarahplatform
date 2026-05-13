-- =============================================================
-- ELARAH — Marketing AI Skills
-- -------------------------------------------------------------
-- Catálogo de skills do agente de marketing (Claude Code) que
-- ficam centralizadas no admin. Admin importa via .md, visualiza,
-- copia o trigger pra rodar no VS Code.
-- =============================================================

create table if not exists public.marketing_skills (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  nome                text not null,
  descricao           text,
  categoria           text,
  trigger_command     text,
  prompt_full         text not null,
  use_cases           text,
  output_description  text,
  icon                text default '🤖',
  display_order       integer not null default 100,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_marketing_skills_active
  on public.marketing_skills (is_active, display_order);

create index if not exists idx_marketing_skills_categoria
  on public.marketing_skills (categoria, display_order);

drop trigger if exists set_marketing_skills_updated_at on public.marketing_skills;
create trigger set_marketing_skills_updated_at
  before update on public.marketing_skills
  for each row execute function public.set_updated_at();

alter table public.marketing_skills enable row level security;

drop policy if exists "marketing_skills_admin_all" on public.marketing_skills;
create policy "marketing_skills_admin_all"
  on public.marketing_skills for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
