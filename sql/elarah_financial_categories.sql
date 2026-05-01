-- =============================================================
-- ELARAH — Categorias financeiras (gastos / receitas)
-- -------------------------------------------------------------
-- Tabela de categorias usada por financial_expenses (e, no futuro,
-- por receitas avulsas se necessário). Seed com as 16 categorias
-- iniciais; admin pode adicionar mais via UI.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: public.is_admin(), public.set_updated_at().
-- =============================================================

create table if not exists public.financial_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,                   -- ex: 'materiais', 'bebidas'
  label       text not null,                          -- ex: 'Materiais'
  kind        text not null default 'expense'
              check (kind in ('expense','income','both')),
  is_active   boolean not null default true,
  ordem       integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists financial_categories_active_idx
  on public.financial_categories (is_active, ordem);

drop trigger if exists trg_financial_categories_updated_at on public.financial_categories;
create trigger trg_financial_categories_updated_at
  before update on public.financial_categories
  for each row execute function public.set_updated_at();

alter table public.financial_categories enable row level security;

-- Leitura: todo admin lê. (Usuários comuns não têm motivo pra ver.)
drop policy if exists "financial_categories_admin_select" on public.financial_categories;
create policy "financial_categories_admin_select"
  on public.financial_categories for select
  to authenticated
  using (public.is_admin());

drop policy if exists "financial_categories_admin_write" on public.financial_categories;
create policy "financial_categories_admin_write"
  on public.financial_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== SEED — 16 categorias iniciais =====
-- ON CONFLICT DO NOTHING garante idempotência: se admin renomear
-- depois, esta migration não desfaz a edição.
insert into public.financial_categories (slug, label, kind, ordem) values
  ('materiais',           'Materiais',                'expense', 10),
  ('bebidas',             'Bebidas',                  'expense', 20),
  ('comidas',             'Comidas/Aperitivos',       'expense', 30),
  ('aluguel-espaco',      'Aluguel de espaço',        'expense', 40),
  ('fornecedor',          'Fornecedor/Parceiro',      'expense', 50),
  ('artista',             'Artista/Instrutor',        'expense', 60),
  ('decoracao',           'Decoração',                'expense', 70),
  ('marketing',           'Marketing/Anúncios',       'expense', 80),
  ('transporte',          'Transporte',               'expense', 90),
  ('plataforma',          'Plataforma/Sistema',       'expense', 100),
  ('taxas-pagamento',     'Taxas de pagamento',       'expense', 110),
  ('impostos',            'Impostos',                 'expense', 120),
  ('brindes',             'Brindes',                  'expense', 130),
  ('producao-conteudo',   'Produção de conteúdo',     'expense', 140),
  ('fotografo',           'Fotógrafo/Videomaker',     'expense', 150),
  ('outros',              'Outros',                   'expense', 999)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
