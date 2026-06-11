-- =============================================================
-- ELARAH — Lista de Interessados (aba "Interesses")
-- -------------------------------------------------------------
-- Quando uma pessoa procura a Elarah querendo uma experiência que
-- ainda não está disponível, a admin cadastra aqui o nome, a
-- categoria de interesse, o WhatsApp e uma observação. A data de
-- cadastro fica salva (created_at) pra dar pra acompanhar quando
-- entrar em contato. Quando a experiência abrir, é só clicar em
-- "Avisar" que abre o WhatsApp com a mensagem pronta.
--
-- Tabela:
--   interesses — uma linha por pessoa interessada / na lista de espera
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Multiusuário-ready: RLS por public.is_admin() (mesmo padrão da
-- aba Prospecção).
-- =============================================================

create table if not exists public.interesses (
  id           uuid primary key default gen_random_uuid(),
  -- Quem é a pessoa interessada
  nome         text not null,
  categoria    text,                          -- ceramica, perfumaria, vela, gastronomia, etc.
  whatsapp     text,                           -- BR format livre (ex: 11 91234-5678)
  observacao   text,                           -- texto livre (o que ela quer, contexto, etc.)
  -- Pipeline simples: aguardando aviso x já avisada
  status       text not null default 'aguardando'
               check (status in ('aguardando', 'avisado')),
  avisado_at   timestamptz,                    -- quando a admin clicou em "Avisar"
  -- Auditoria (multi-user ready)
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),  -- "data em que adicionei"
  updated_at   timestamptz not null default now()
);

create index if not exists interesses_status_idx     on public.interesses (status);
create index if not exists interesses_categoria_idx   on public.interesses (categoria);
create index if not exists interesses_created_idx     on public.interesses (created_at desc);
create index if not exists interesses_nome_lower_idx  on public.interesses (lower(nome));

drop trigger if exists set_interesses_updated_at on public.interesses;
create trigger set_interesses_updated_at
  before update on public.interesses
  for each row execute function public.set_updated_at();

alter table public.interesses enable row level security;

drop policy if exists "interesses_admin_all" on public.interesses;
create policy "interesses_admin_all"
  on public.interesses
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
