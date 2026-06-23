-- =========================================================
-- ELARAH — Locais para eventos (idempotente)
-- =========================================================
-- Agenda de locais (cafés, bares, espaços, ao ar livre...) que
-- podem receber um evento da Elarah. Guarda endereço, contato,
-- se cobra ou não, valor/condições e observações livres — pra
-- quando surgir um evento já ter onde olhar e com quem falar.
--
-- Rode no SQL editor do Supabase. Pode executar várias vezes
-- sem efeito colateral (create if not exists / drop+create das
-- policies e trigger).
-- =========================================================

create table if not exists public.event_venues (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  tipo          text,            -- café, bar, restaurante, espaço, ao ar livre, outro
  endereco      text,            -- endereço completo
  bairro        text,
  cidade        text,
  contato_nome  text,            -- pessoa de contato
  whatsapp      text,
  telefone      text,
  instagram     text,
  email         text,
  cobra         text,            -- 'sim' | 'nao' | 'a_confirmar'
  valor         text,            -- condições/preço em texto livre (ex.: "R$200/h", "consumação mínima")
  capacidade    text,            -- quantas pessoas cabem (texto livre)
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists event_venues_nome_idx
  on public.event_venues (nome);

-- Trigger de updated_at (reusa set_updated_at criado no setup).
drop trigger if exists set_event_venues_updated_at
  on public.event_venues;
create trigger set_event_venues_updated_at
before update on public.event_venues
for each row execute function public.set_updated_at();

alter table public.event_venues enable row level security;

-- Admin pode tudo (select/insert/update/delete).
drop policy if exists "event_venues_admin_all"
  on public.event_venues;
create policy "event_venues_admin_all"
  on public.event_venues
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
