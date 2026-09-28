-- =============================================================
-- ELARAH MENTAL HEALTH — plataforma corporativa (NR-1)
-- -------------------------------------------------------------
-- Frente B2B da Elarah: programas de saúde mental e bem-estar
-- para empresas (NR-1 / riscos psicossociais), com cronograma
-- pontual, semestral ou anual de experiências manuais.
--
-- O painel é o admin-mh.html. Ele FUNCIONA sem este SQL (guarda
-- tudo no navegador e mostra um aviso), mas só depois de rodar
-- este arquivo os dados passam a ser compartilhados com a equipe
-- e ficam salvos no banco.
--
-- Tabelas:
--   mh_eventos          — eventos corporativos (agenda + orçamentos)
--   mh_acompanhamento   — check-in semanal de cada empresa cliente
--   mh_cronogramas      — planos (pontual / semestral / anual) por empresa
--   mh_leads            — pedidos que chegam pela landing page
--                         (saude-mental-empresas.html)
--
-- Também prepara public.b2b_prospects (já existente) pra receber
-- as ~100 empresas/semana do agente mh-empresas-finder sem repetir.
--
-- Pré-requisitos: sql/elarah_crm_b2b_prospects.sql (b2b_prospects,
-- is_admin(), set_updated_at()).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================


-- ===== 1. b2b_prospects: colunas do agente de busca =====
alter table public.b2b_prospects add column if not exists origem          text;
alter table public.b2b_prospects add column if not exists google_place_id text;
alter table public.b2b_prospects add column if not exists telefone        text;
alter table public.b2b_prospects add column if not exists endereco        text;
-- Qual frente está trabalhando o lead: 'elarah' (B2C / eventos fechados)
-- ou 'mh' (Elarah Mental Health). Leads antigos ficam null = Elarah.
alter table public.b2b_prospects add column if not exists frente          text;

-- Dedupe entre semanas (mesma lógica do prospect-finder de parceiros).
create unique index if not exists b2b_prospects_google_place_id_uidx
  on public.b2b_prospects (google_place_id);
create index if not exists b2b_prospects_frente_idx
  on public.b2b_prospects (frente);


-- ===== 2. mh_eventos =====
create table if not exists public.mh_eventos (
  id              uuid primary key default gen_random_uuid(),
  empresa         text not null,
  prospect_id     uuid references public.b2b_prospects(id) on delete set null,
  titulo          text not null,             -- "Cerâmica terapêutica — Setembro Amarelo"
  atividade       text,                      -- id da biblioteca de ideias
  data_evento     date,
  horario         text,
  formato         text default 'presencial_empresa'
                  check (formato in ('presencial_empresa','presencial_atelie','online','kit_em_casa')),
  participantes   int,
  valor_centavos  bigint,
  status          text not null default 'orcamento'
                  check (status in ('orcamento','proposta_enviada','confirmado','realizado','cancelado')),
  contato         text,
  observacoes     text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists mh_eventos_data_idx on public.mh_eventos (data_evento);

drop trigger if exists set_mh_eventos_updated_at on public.mh_eventos;
create trigger set_mh_eventos_updated_at before update on public.mh_eventos
  for each row execute function public.set_updated_at();


-- ===== 3. mh_acompanhamento (semanal) =====
create table if not exists public.mh_acompanhamento (
  id              uuid primary key default gen_random_uuid(),
  empresa         text not null,
  prospect_id     uuid references public.b2b_prospects(id) on delete set null,
  semana          date not null,             -- segunda-feira da semana
  humor_time      int check (humor_time between 1 and 5),   -- termômetro 1-5 do RH
  participacao    int check (participacao between 0 and 100), -- % de adesão
  feito           text,
  proximo_passo   text,
  alerta          boolean not null default false,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists mh_acompanhamento_semana_idx on public.mh_acompanhamento (semana desc);

drop trigger if exists set_mh_acompanhamento_updated_at on public.mh_acompanhamento;
create trigger set_mh_acompanhamento_updated_at before update on public.mh_acompanhamento
  for each row execute function public.set_updated_at();


-- ===== 4. mh_cronogramas =====
-- itens = [{ mes, dia?, data_key?, titulo, atividade, tipo:'data'|'acao', gift_card:boolean }]
create table if not exists public.mh_cronogramas (
  id              uuid primary key default gen_random_uuid(),
  empresa         text not null,
  prospect_id     uuid references public.b2b_prospects(id) on delete set null,
  plano           text not null default 'anual' check (plano in ('pontual','semestral','anual')),
  ano             int not null default extract(year from now())::int,
  colaboradores   int,
  itens           jsonb not null default '[]'::jsonb,
  status          text not null default 'rascunho' check (status in ('rascunho','enviado','aprovado')),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists set_mh_cronogramas_updated_at on public.mh_cronogramas;
create trigger set_mh_cronogramas_updated_at before update on public.mh_cronogramas
  for each row execute function public.set_updated_at();


-- ===== 5. mh_leads (landing page) =====
-- Qualquer visitante pode INSERIR (o formulário é público), mas só
-- admin lê/edita. Campos com limite de tamanho pra ninguém entupir.
create table if not exists public.mh_leads (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (char_length(nome) <= 120),
  empresa         text not null check (char_length(empresa) <= 160),
  cargo           text check (char_length(cargo) <= 120),
  email           text check (char_length(email) <= 160),
  whatsapp        text check (char_length(whatsapp) <= 40),
  colaboradores   text check (char_length(colaboradores) <= 20),
  plano           text check (char_length(plano) <= 20),
  mensagem        text check (char_length(mensagem) <= 2000),
  status          text not null default 'novo' check (status in ('novo','em_contato','convertido','descartado')),
  created_at      timestamptz not null default now()
);
create index if not exists mh_leads_created_idx on public.mh_leads (created_at desc);

-- Análise de dados dos pedidos (v2): de qual botão veio, quantos
-- encontros a empresa quer no ano e de qual campanha/link chegou.
alter table public.mh_leads add column if not exists origem    text check (char_length(origem) <= 60);
alter table public.mh_leads add column if not exists encontros int  check (encontros between 1 and 52);
alter table public.mh_leads add column if not exists utm       text check (char_length(utm) <= 300);
alter table public.mh_leads add column if not exists pagina    text check (char_length(pagina) <= 300);
alter table public.mh_leads add column if not exists referrer  text check (char_length(referrer) <= 300);


-- ===== 6. RLS =====
alter table public.mh_eventos        enable row level security;
alter table public.mh_acompanhamento enable row level security;
alter table public.mh_cronogramas    enable row level security;
alter table public.mh_leads          enable row level security;

drop policy if exists "mh_eventos_admin_all" on public.mh_eventos;
create policy "mh_eventos_admin_all" on public.mh_eventos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mh_acompanhamento_admin_all" on public.mh_acompanhamento;
create policy "mh_acompanhamento_admin_all" on public.mh_acompanhamento
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mh_cronogramas_admin_all" on public.mh_cronogramas;
create policy "mh_cronogramas_admin_all" on public.mh_cronogramas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mh_leads_admin_all" on public.mh_leads;
create policy "mh_leads_admin_all" on public.mh_leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Formulário público: só INSERT, sempre com status 'novo'.
drop policy if exists "mh_leads_public_insert" on public.mh_leads;
create policy "mh_leads_public_insert" on public.mh_leads
  for insert to anon, authenticated with check (status = 'novo');

grant insert on public.mh_leads to anon;


-- =============================================================
-- VERIFICAÇÃO
--   select count(*) from public.mh_eventos;
--   select * from public.mh_leads order by created_at desc limit 20;
--   select frente, origem, count(*) from public.b2b_prospects group by 1,2;
-- =============================================================
