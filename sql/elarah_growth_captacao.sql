-- =====================================================================
-- elarah_growth_captacao.sql
--
-- Sistema operacional de Captação de Clientes (Growth OS).
--
-- Estrutura:
--   growth_areas  — categorias de growth (Loops, Embaixadoras, ...)
--   growth_tasks  — tarefas com horizonte/prioridade/responsável/freq
--   growth_kpis   — métricas-alvo (CAC, K-factor, NPS, ...)
--
-- Idempotente: roda quantas vezes precisar. Seed só insere se não
-- existir (ON CONFLICT por slug/titulo).
--
-- RLS: admin only via public.is_admin().
-- =====================================================================

-- ===== 1. growth_areas =====
create table if not exists public.growth_areas (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  nome         text not null,
  descricao    text,
  cor          text not null default '#1a8a4a',
  icone        text,
  ordem        int  not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists growth_areas_active_ordem_idx
  on public.growth_areas (is_active, ordem) where is_active = true;

drop trigger if exists trg_growth_areas_updated_at on public.growth_areas;
create trigger trg_growth_areas_updated_at
  before update on public.growth_areas
  for each row execute function public.set_updated_at();

alter table public.growth_areas enable row level security;

drop policy if exists "growth_areas_admin_all" on public.growth_areas;
create policy "growth_areas_admin_all"
  on public.growth_areas
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 2. growth_tasks =====
create table if not exists public.growth_tasks (
  id            uuid primary key default gen_random_uuid(),
  area_id       uuid references public.growth_areas(id) on delete set null,
  titulo        text not null,
  descricao     text,
  prioridade    text not null default 'media'
                check (prioridade in ('alta','media','baixa')),
  status        text not null default 'pendente'
                check (status in ('pendente','em_andamento','concluido','pausado')),
  responsavel   text not null default 'ambas'
                check (responsavel in ('voce','socia','ambas','externo')),
  frequencia    text not null default 'unica'
                check (frequencia in ('unica','semanal','quinzenal','mensal','trimestral')),
  horizonte     text check (horizonte in ('semana','mes','trimestre')),
  due_date      date,
  notas         text,
  completed_at  timestamptz,
  ordem         int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists growth_tasks_area_idx on public.growth_tasks (area_id);
create index if not exists growth_tasks_status_idx on public.growth_tasks (status);
create index if not exists growth_tasks_due_idx on public.growth_tasks (due_date);
create index if not exists growth_tasks_horizonte_idx on public.growth_tasks (horizonte);

drop trigger if exists trg_growth_tasks_updated_at on public.growth_tasks;
create trigger trg_growth_tasks_updated_at
  before update on public.growth_tasks
  for each row execute function public.set_updated_at();

alter table public.growth_tasks enable row level security;

drop policy if exists "growth_tasks_admin_all" on public.growth_tasks;
create policy "growth_tasks_admin_all"
  on public.growth_tasks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 3. growth_kpis =====
create table if not exists public.growth_kpis (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  nome         text not null,
  unidade      text not null default '',
  meta         numeric,
  valor_atual  numeric not null default 0,
  cor          text not null default '#1a8a4a',
  observacao   text,
  ordem        int  not null default 0,
  is_active    boolean not null default true,
  updated_at   timestamptz not null default now()
);

create index if not exists growth_kpis_active_ordem_idx
  on public.growth_kpis (is_active, ordem) where is_active = true;

drop trigger if exists trg_growth_kpis_updated_at on public.growth_kpis;
create trigger trg_growth_kpis_updated_at
  before update on public.growth_kpis
  for each row execute function public.set_updated_at();

alter table public.growth_kpis enable row level security;

drop policy if exists "growth_kpis_admin_all" on public.growth_kpis;
create policy "growth_kpis_admin_all"
  on public.growth_kpis
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =====================================================================
-- SEED: áreas, tarefas e KPIs.
-- ON CONFLICT garante que pode rodar várias vezes sem duplicar.
-- Não toca em rows que a admin tenha editado depois — só insere
-- as que ainda não existem (DO NOTHING).
-- =====================================================================

insert into public.growth_areas (slug, nome, descricao, cor, ordem) values
  ('loops-ugc',    'Loops & UGC',           'Conteúdo gerado por cliente pós-experiência + reposting sistemático.',  '#e6794a', 1),
  ('embaixadoras', 'Embaixadoras',          'Programa de embaixadoras universitárias, co-livings e comunidades.',   '#7144a8', 2),
  ('fornecedor',   'Fornecedor-canal',      'Cada fornecedor como canal de aquisição via kit + bônus + selo.',      '#1a8a4a', 3),
  ('seo',          'SEO & descoberta',      'Páginas long-tail dominando "o que fazer em SP" no Google.',           '#3068a8', 4),
  ('parcerias',    'Parcerias & B2B',       'Lojas físicas, co-livings, startups, wedding market.',                 '#b07b00', 5),
  ('pr-creators',  'PR & Creators',         'Pitching de mídia tier-1 + gifting de creators (não-pago).',           '#c0392b', 6)
on conflict (slug) do nothing;

-- ----- Loops & UGC -----
with a as (select id from public.growth_areas where slug = 'loops-ugc')
insert into public.growth_tasks (area_id, titulo, descricao, prioridade, frequencia, horizonte, responsavel, ordem) values
  ((select id from a), 'Imprimir 200 cartões "obrigada + QR + cupom 15% off"',
    'Cartão físico entregue no fim de toda experiência. QR leva pra cupom único que só ativa se a cliente marcar @elarah no story.',
    'alta',  'unica',  'semana', 'voce',  1),
  ((select id from a), 'Contratar fotógrafa freelancer (3 experiências/sem)',
    'Foto profissional entregue pra cliente em 24h via WhatsApp → ela reposta = UGC de alta qualidade.',
    'alta',  'unica',  'mes',    'socia', 2),
  ((select id from a), 'Repost sistemático de stories marcados (até 30min)',
    'Todo story marcando @elarah vira repost na nossa conta em até 30min — gera FOMO.',
    'alta',  'semanal','semana', 'ambas', 3),
  ((select id from a), 'Criar hashtag #fizelarah e moderar',
    'Hashtag oficial, monitorar diariamente e usar pra repostar.',
    'media', 'semanal','semana', 'ambas', 4),
  ((select id from a), 'Áudio da fundadora 24h antes da experiência',
    'Mensagem pessoal por WhatsApp → cliente faz screenshot, abre stories, vira UGC.',
    'alta',  'unica',  'semana', 'voce',  5),
  ((select id from a), 'Programa 2x1 primeira compra',
    'Primeira reserva: 2 vagas pelo preço de 1.5. Cliente traz amiga = LTV ↑.',
    'alta',  'unica',  'mes',    'voce',  6)
on conflict do nothing;

-- ----- Embaixadoras -----
with a as (select id from public.growth_areas where slug = 'embaixadoras')
insert into public.growth_tasks (area_id, titulo, descricao, prioridade, frequencia, horizonte, responsavel, ordem) values
  ((select id from a), 'Criar formulário Tally de candidatura',
    'Perguntas: universidade, curso, redes, motivação. Filtra por influência interna, não por seguidores.',
    'alta',  'unica',  'semana', 'voce',  1),
  ((select id from a), 'Post de abertura do programa no IG',
    'Anúncio principal + 3 stories + 1 reel explicando benefícios.',
    'alta',  'unica',  'semana', 'socia', 2),
  ((select id from a), 'Recrutar 5 embaixadoras iniciais (USP/FGV/ESPM/Mackenzie/FAAP)',
    'Uma por universidade. Escolha por engajamento social local, não vanity metrics.',
    'alta',  'unica',  'semana', 'ambas', 3),
  ((select id from a), 'Criar grupo WhatsApp de embaixadoras',
    'Grupo fechado, posts diários da fundadora, competição mensal.',
    'media', 'unica',  'semana', 'voce',  4),
  ((select id from a), 'Onboard mensal de embaixadoras (kit pronto)',
    'Kit: cupom único + frase pronta + 5 stories pra postar + role-play de FAQ.',
    'alta',  'mensal', 'mes',    'ambas', 5),
  ((select id from a), 'Expandir pra 15 universidades',
    'Adicionar Insper, Belas Artes, FECAP, PUC, UNIFESP, Mackenzie-Tamboré, ESPM-Vila Olímpia, etc.',
    'alta',  'unica',  'mes',    'voce',  6),
  ((select id from a), 'Competição mensal entre embaixadoras',
    'Quem trouxer mais clientes ganha experiência VIP + destaque no feed.',
    'media', 'mensal', 'mes',    'socia', 7),
  ((select id from a), 'Abrir programa de embaixadoras de co-livings',
    'Howu, Cohome, Movile, Sleeping Belmiro. 1 residente por co-living.',
    'media', 'unica',  'mes',    'socia', 8),
  ((select id from a), '50+ embaixadoras ativas',
    'Meta trimestre: universidades + co-livings + comunidades nicho combinadas.',
    'alta',  'unica',  'trimestre','ambas', 9)
on conflict do nothing;

-- ----- Fornecedor-canal -----
with a as (select id from public.growth_areas where slug = 'fornecedor')
insert into public.growth_tasks (area_id, titulo, descricao, prioridade, frequencia, horizonte, responsavel, ordem) values
  ((select id from a), 'Criar 30 cupons únicos (1 por fornecedor)',
    'Padrão CUPOM_NOMEFORNECEDOR. Tracking puro de origem.',
    'alta',  'unica',  'semana', 'voce',  1),
  ((select id from a), 'Montar Kit Fornecedor Parceiro',
    '5 stories prontos + 3 posts de feed + frase de assinatura "vagas pelo @elarah" — entregar pronto, sem fricção.',
    'alta',  'unica',  'semana', 'socia', 2),
  ((select id from a), 'Enviar kit pra todos 30 fornecedores',
    'WhatsApp individual com kit + cupom único + mensagem da fundadora.',
    'alta',  'unica',  'semana', 'ambas', 3),
  ((select id from a), 'Setup bônus por bookings novas (R$200 a cada 5 novas)',
    'Tracking via UTM. Comunicar bônus antes de mandar kit.',
    'media', 'unica',  'mes',    'voce',  4),
  ((select id from a), 'Selo "Top Elarah" mensal',
    'Os 5 fornecedores que mais convertem ganham selo + destaque no feed Elarah. Status > dinheiro.',
    'baixa', 'mensal', 'mes',    'socia', 5),
  ((select id from a), 'Co-storytelling em todo sold-out',
    'Toda vez que fornecedor faz sold-out, postar celebração + ele reposta. Autoridade mútua.',
    'media', 'semanal','semana', 'ambas', 6),
  ((select id from a), '10 fornecedores divulgando ativamente com tracking',
    'Meta trimestre: 10 fornecedores recorrentes postando e gerando bookings rastreadas.',
    'alta',  'unica',  'trimestre','ambas', 7)
on conflict do nothing;

-- ----- SEO & descoberta -----
with a as (select id from public.growth_areas where slug = 'seo')
insert into public.growth_tasks (area_id, titulo, descricao, prioridade, frequencia, horizonte, responsavel, ordem) values
  ((select id from a), 'Lançar 3 páginas foundation SEO',
    '/o-que-fazer-em-sp-final-de-semana, /atividades-com-amigas-em-sp, /date-diferente-em-sp.',
    'alta',  'unica',  'semana', 'voce',  1),
  ((select id from a), 'Cadastrar Search Console + sitemap',
    'Setup técnico básico, submeter sitemap, monitorar indexação.',
    'alta',  'unica',  'semana', 'voce',  2),
  ((select id from a), 'Contratar redatora freelancer (R$80/post)',
    'Vagas no Workana ou indicação. Briefing: long-tail, voz pessoal, não corporativa.',
    'alta',  'unica',  'semana', 'socia', 3),
  ((select id from a), 'Calendário 12 posts long-tail',
    '"Aniversário diferente SP", "Despedida de solteira SP", "Programa em SP sozinha", etc.',
    'alta',  'unica',  'mes',    'socia', 4),
  ((select id from a), 'Update mensal das páginas-âncora',
    'Toda quinta atualizar "o que fazer no final de semana" com experiências do fim de semana.',
    'media', 'mensal', 'mes',    'socia', 5),
  ((select id from a), 'Backlink em 5 sites SP (blogs/parceiros)',
    'Trocar guest post com Quanta, blogs de viagem SP, lifestyle locais.',
    'media', 'unica',  'mes',    'externo', 6),
  ((select id from a), 'Top 10 em 5 keywords principais',
    'Meta trimestre: ranquear top 10 em 5 das 8 páginas-âncora.',
    'alta',  'unica',  'trimestre','ambas', 7)
on conflict do nothing;

-- ----- Parcerias & B2B -----
with a as (select id from public.growth_areas where slug = 'parcerias')
insert into public.growth_tasks (area_id, titulo, descricao, prioridade, frequencia, horizonte, responsavel, ordem) values
  ((select id from a), 'Listar 10 lojas físicas-alvo em SP',
    'Casa Juisi, Companhia das Letras café, Naguchi, Empório Santa Tereza, Granado VM, etc. Curadoria + público compatível.',
    'alta',  'unica',  'semana', 'socia', 1),
  ((select id from a), 'Contatar 5 lojas pra collab presencial',
    'Apresentar Elarah, propor cartão no balcão + mini-experiência demo em troca de co-marketing.',
    'alta',  'unica',  'semana', 'ambas', 2),
  ((select id from a), 'Imprimir cartões "Elarah" pra balcão',
    'Pacote de 100 cartões por loja parceira. Design pequeno e bonito (não panfleto).',
    'media', 'unica',  'mes',    'socia', 3),
  ((select id from a), 'Listing em wedding sites',
    'Casamentos.com.br + Zankyou. Foco: despedida de solteira (ticket alto, decisor único).',
    'media', 'unica',  'mes',    'socia', 4),
  ((select id from a), 'Pacote happy hour B2B startups',
    'Pacote fechado pra startup 30-150 funcionários. Cada funcionária = lead Elarah.',
    'media', 'unica',  'mes',    'voce',  5),
  ((select id from a), 'Lista 50 startups SP target',
    'Crunchbase + LinkedIn. Filtro: people/HR contactáveis, startups 30-150 funcionários, área SP.',
    'media', 'unica',  'mes',    'voce',  6),
  ((select id from a), '5 startups B2B recorrentes',
    'Meta trimestre: 5 startups fazendo 1 evento/mês cada.',
    'media', 'unica',  'trimestre','voce',  7),
  ((select id from a), 'Embaixadora em 5 co-livings',
    'Howu, Cohome, Movile, Sleeping Belmiro, outro. 1 residente embaixadora por co-living.',
    'media', 'unica',  'mes',    'socia', 8)
on conflict do nothing;

-- ----- PR & Creators -----
with a as (select id from public.growth_areas where slug = 'pr-creators')
insert into public.growth_tasks (area_id, titulo, descricao, prioridade, frequencia, horizonte, responsavel, ordem) values
  ((select id from a), 'Press kit Elarah',
    'PDF + dropbox: foto fundadoras, métricas-âncora (30+ parceiros, 150+ vendas), 3 cases, contato direto.',
    'alta',  'unica',  'semana', 'voce',  1),
  ((select id from a), 'Lista 30 micro-creators SP (5-30k seguidores)',
    'Filtro: SP, jovens 22-32, lifestyle/wellness/arte/comida. Salvar handle + email + nicho.',
    'alta',  'unica',  'semana', 'socia', 2),
  ((select id from a), 'Gift de experiência pra 5 creators iniciais',
    'Sem contrapartida. Vaga ociosa = custo zero. 30% postam organicamente.',
    'alta',  'unica',  'semana', 'voce',  3),
  ((select id from a), '3 pitches tier-1 (Veja SP / Time Out / Quanta)',
    'Pitches DIFERENTES pra cada veículo. Ganchos: "Tinder das experiências", "millennials fugindo do feed", "marketplace curado vs Sympla".',
    'alta',  'unica',  'mes',    'voce',  4),
  ((select id from a), 'Programa creator gifting 8/mês',
    'Recorrente. Vaga ociosa pra micro-creator novo a cada quinta-feira. Tracking de quem postou.',
    'alta',  'mensal', 'mes',    'socia', 5),
  ((select id from a), 'Plantar 3 threads Reddit r/saopaulo',
    'Conteúdo REAL (não spam). "O que fazer com amigas em SP", "atividades criativas SP", "date diferente SP". Login antigo + karma.',
    'baixa', 'mensal', 'mes',    'externo', 6),
  ((select id from a), '1 menção tier-1 confirmada',
    'Meta trimestre: 1 menção em Veja SP, Time Out, Quanta, Catraca Livre ou Folha Cotidiano.',
    'alta',  'unica',  'trimestre','voce',  7)
on conflict do nothing;


-- ===== KPIs =====
insert into public.growth_kpis (slug, nome, unidade, meta, valor_atual, cor, ordem, observacao) values
  ('cac',            'CAC médio',            'R$', 30,   0, '#e6794a', 1, 'Custo de aquisição por cliente (com UTM rigoroso por canal).'),
  ('kfactor',        'K-factor',             '',   0.3,  0, '#7144a8', 2, 'Novos clientes / clientes atuais — meta 0.3 em 90 dias.'),
  ('nps',            'NPS',                  '',   70,   0, '#1a8a4a', 3, 'Net Promoter Score medido pós-experiência.'),
  ('ugc-tags',       'UGC tags @elarah/mês', '',   50,   0, '#3068a8', 4, 'Posts/stories marcando @elarah por mês.'),
  ('embaixadoras',   'Embaixadoras ativas',  '',   50,   0, '#b07b00', 5, 'Universidades + co-livings + comunidades nicho.'),
  ('repeat-rate',    'Repeat rate 90d',      '%',  25,   0, '#c0392b', 6, '% de clientes que voltam a reservar em 90 dias.'),
  ('seo-keywords',   'Keywords top 10',      '',   5,    0, '#3068a8', 7, 'Páginas-âncora ranqueadas no top 10 do Google.'),
  ('pr-mencoes',     'Menções tier-1',       '',   1,    0, '#c0392b', 8, 'Veja SP, Time Out, Quanta, Catraca Livre, Folha.')
on conflict (slug) do nothing;
