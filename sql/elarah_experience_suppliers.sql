-- =============================================================
-- ELARAH — Múltiplos fornecedores por experiência (mapa financeiro)
-- -------------------------------------------------------------
-- Permite que cada experiência tenha N fornecedores com divisão
-- flexível (% ou valor fixo) e comissão Elarah opcional/manual ou
-- residual. Substitui (sem quebrar) o modelo legado de 1 fornecedor
-- + percentual_repasse em public.experiences.
--
-- Modelo:
--   experience_suppliers (1:N com experiences):
--     fornecedor_nome  → identificação textual (admin pode editar)
--     share_type       → 'percent' (% do valor cheio) ou 'fixed' (centavos)
--     share_value      → 35.5 (= 35.5%)  OU  12500 (= R$ 125,00)
--     ordem            → ordem de exibição na UI
--     notas            → texto opcional (ex: "responsável pelo material")
--
--   experiences ganha:
--     comissao_type   → 'percent' / 'fixed' / null (= residual automático)
--     comissao_value  → numérico (% ou centavos), null se residual
--
--   bookings ganha:
--     repasses        → jsonb array, snapshot do que cada fornecedor
--                       recebeu NA HORA da reserva. Congela divisão pra
--                       que mudanças futuras na experiência não afetem
--                       bookings antigas. Formato:
--                       [{fornecedor_nome, share_type, share_value,
--                         valor_centavos}, ...]
--
-- Compatibilidade:
--   - Bookings sem repasses (legado) continuam usando os campos
--     valor_repasse_centavos / valor_comissao_centavos / fornecedor_nome.
--   - Edge functions de checkout: se experience tem rows em
--     experience_suppliers, usa o novo modelo. Senão, fallback no
--     legado (1 supplier com percentual_repasse).
--
-- Backfill:
--   Cria 1 row em experience_suppliers pra cada experience que tem
--   fornecedor_nome preenchido E ainda não tem rows. Idempotente —
--   roda quantas vezes precisar sem duplicar.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ===== 1. Tabela experience_suppliers =====
create table if not exists public.experience_suppliers (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  fornecedor_nome text not null,
  share_type text not null check (share_type in ('percent', 'fixed')),
  share_value numeric not null check (share_value >= 0),
  ordem integer not null default 0,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_experience_suppliers_experience_id
  on public.experience_suppliers (experience_id);

-- ===== 2. Comissão Elarah (opcional/manual em experiences) =====
alter table public.experiences
  add column if not exists comissao_type text;
alter table public.experiences
  add column if not exists comissao_value numeric;

-- Constraint: drop+recreate idempotente. Permite NULL pra residual
-- automático (sem comissão fixada — Elarah recebe o que sobra).
alter table public.experiences
  drop constraint if exists experiences_comissao_type_check;
alter table public.experiences
  add constraint experiences_comissao_type_check
  check (comissao_type is null or comissao_type in ('percent', 'fixed'));

-- ===== 3. bookings.repasses (snapshot por reserva) =====
alter table public.bookings
  add column if not exists repasses jsonb;

-- ===== 4. Permissões + RLS =====
-- Pattern existente do projeto: leitura pública (cards do site
-- precisam mostrar fornecedor) e escrita só pra service_role.
-- Edge functions usam service_role, admin client também.
grant all on public.experience_suppliers to service_role;
grant select on public.experience_suppliers to anon, authenticated;

alter table public.experience_suppliers enable row level security;

drop policy if exists "experience_suppliers public read" on public.experience_suppliers;
create policy "experience_suppliers public read"
  on public.experience_suppliers
  for select
  using (true);

-- Escrita restrita a admins (mesmo padrão de outras tabelas do projeto).
-- Se a tabela profiles ou a coluna role tiver outro nome, ajustar aqui.
-- Usa o helper public.is_admin() definido em elarah_supabase_setup.sql
-- (SECURITY DEFINER que checa profiles.role = 'admin' e abstrai o
-- schema interno). É o mesmo padrão que bookings, gift_cards,
-- fornecedores_metadata e analytics usam.
drop policy if exists "experience_suppliers admin write" on public.experience_suppliers;
create policy "experience_suppliers admin write"
  on public.experience_suppliers
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ===== 5. BACKFILL =====
-- Cria 1 linha em experience_suppliers pra cada experiência que tem
-- fornecedor_nome cadastrado E ainda não tem nenhum supplier ligado.
-- Usa percentual_repasse setado, ou 70% como fallback (que é o
-- percentual efetivo que o código hardcoded vinha usando antes
-- desse refactor).
insert into public.experience_suppliers
  (experience_id, fornecedor_nome, share_type, share_value, ordem)
select
  e.id,
  e.fornecedor_nome,
  'percent',
  coalesce(nullif(e.percentual_repasse::text, '')::numeric, 70),
  0
from public.experiences e
where e.fornecedor_nome is not null
  and trim(e.fornecedor_nome) <> ''
  and not exists (
    select 1 from public.experience_suppliers es
    where es.experience_id = e.id
  );

-- ===== 6. Refresh do PostgREST =====
notify pgrst, 'reload schema';
