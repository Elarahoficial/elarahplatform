-- =========================================================
-- ELARAH — Fornecedores metadata (idempotente)
-- =========================================================
-- Guarda dados soltos por fornecedor que NÃO estão em
-- bookings/experiences: data de entrada na plataforma e
-- observações livres do admin.
--
-- Keyed por `fornecedor_key` (nome lowercased normalizado),
-- porque fornecedor_nome aparece em vários sítios como texto
-- livre — nem sempre há um profiles.id.
--
-- Rode no SQL editor do Supabase. Pode executar várias vezes
-- sem efeito colateral.
-- =========================================================

create table if not exists public.fornecedores_metadata (
  id              uuid primary key default gen_random_uuid(),
  fornecedor_key  text unique not null,
  fornecedor_nome text not null,
  data_entrada    date,
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists fornecedores_metadata_key_idx
  on public.fornecedores_metadata (fornecedor_key);

-- Trigger de updated_at (reusa set_updated_at criado no setup).
drop trigger if exists set_fornecedores_metadata_updated_at
  on public.fornecedores_metadata;
create trigger set_fornecedores_metadata_updated_at
before update on public.fornecedores_metadata
for each row execute function public.set_updated_at();

alter table public.fornecedores_metadata enable row level security;

-- Admin pode tudo (select/insert/update/delete).
drop policy if exists "fornecedores_metadata_admin_all"
  on public.fornecedores_metadata;
create policy "fornecedores_metadata_admin_all"
  on public.fornecedores_metadata
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
