-- =========================================================
-- ELARAH — Fluxograma da operação (parceiros, clientes, eventos)
-- =========================================================
-- Guarda o fluxograma editável de admin-fluxograma.html: etapas,
-- setas, responsáveis e status de automação. É UMA linha só
-- (id = 'principal') com tudo dentro de um jsonb, porque a página
-- salva o desenho inteiro a cada alteração — quem abrir depois vê
-- exatamente o que a última pessoa deixou.
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- Pré-requisito: public.is_admin() (helper SECURITY DEFINER já
-- criado no projeto) e a tabela public.profiles com role.
-- =========================================================

create table if not exists public.fluxograma (
  id          text primary key,
  dados       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

comment on table public.fluxograma is
  'Fluxograma operacional editado em /admin-fluxograma.html. 1 linha por quadro (hoje só "principal").';

-- ---------- RLS: só admin lê e escreve ----------
alter table public.fluxograma enable row level security;

drop policy if exists fluxograma_admin_read on public.fluxograma;
create policy fluxograma_admin_read on public.fluxograma
  for select using (public.is_admin());

drop policy if exists fluxograma_admin_insert on public.fluxograma;
create policy fluxograma_admin_insert on public.fluxograma
  for insert with check (public.is_admin());

drop policy if exists fluxograma_admin_update on public.fluxograma;
create policy fluxograma_admin_update on public.fluxograma
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- Realtime ----------
-- Faz a edição de uma pessoa aparecer na tela da outra sem recarregar.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fluxograma'
  ) then
    alter publication supabase_realtime add table public.fluxograma;
  end if;
exception when undefined_object then
  -- publicação supabase_realtime não existe neste projeto: ignora.
  null;
end $$;

-- =========================================================
-- VERIFICAÇÃO
--   select id, updated_at, jsonb_array_length(dados->'nodes') as etapas
--     from public.fluxograma;
-- =========================================================
