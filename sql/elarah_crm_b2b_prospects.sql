-- =============================================================
-- ELARAH — CRM de Prospecção B2B (Empresas)
-- -------------------------------------------------------------
-- Espelha a arquitetura de prospects (parceiros) mas voltada
-- pra prospecção comercial em EMPRESAS — vender experiências
-- corporativas, gift cards, ações de engajamento, benefícios pra
-- colaboradores (RH/People/Cultura/Endomarketing).
--
-- Por que tabelas separadas (e não 1 só com `tipo`):
--   - Schema bem diferente (campos específicos B2B: tipo_empresa,
--     funcionarios_faixa, contato_nome, potencial, etc.)
--   - Pipelines diferentes (parceiro fecha contrato; cliente B2B
--     pode virar "cliente_ativo" recorrente)
--   - Queries simples — filtros e dashboards sem WHERE tipo='b2b'
--   - Permite RLS evoluir diferente no futuro (ex: SDR só vê B2B)
--
-- Tabelas:
--   b2b_prospects                 — empresas-alvo + contato principal
--   b2b_prospect_interactions     — timeline de cada interação
--   b2b_prospect_templates        — mensagens-base reutilizáveis
--
-- Múltiplos contatos por empresa (futuro):
--   Hoje o contato principal vive direto em b2b_prospects (campos
--   contato_*). Quando precisar de RH + People + CEO na mesma
--   empresa, criar b2b_prospect_contacts (1:N) e migrar o contato
--   principal pra primeira linha. Não bloqueia evolução.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Multiusuário-ready: RLS por public.is_admin().
-- =============================================================


-- ===== 1. b2b_prospects =====
-- Status comercial reflete o funil B2B real, separando "fechado"
-- (ação pontual fechada) de "cliente_ativo" (conta recorrente).
-- "pausado" pra leads que esfriaram mas não recusaram explicitamente.
--
-- Tipos de empresa cobrem o sweet spot da Elarah (médio porte com
-- preocupação cultural). Incluí imobiliaria/arquitetura/jurídico/
-- clinica/industria_leve por terem alto potencial pra experiências
-- corporativas (eventos, datas comemorativas, benefício pra equipe).
create table if not exists public.b2b_prospects (
  id                          uuid primary key default gen_random_uuid(),
  -- Identificação
  nome                        text not null,                  -- nome fantasia / razão social
  tipo_empresa                text check (tipo_empresa in (
                                'tech',
                                'agencia',
                                'coworking',
                                'construtora',
                                'startup',
                                'escritorio',
                                'imobiliaria',
                                'arquitetura_design',
                                'escritorio_juridico',
                                'clinica',
                                'industria_leve',
                                'outro'
                              )),
  -- Porte (5 faixas; 50-500 é o sweet spot da Elarah, destaque no UI)
  funcionarios_faixa          text check (funcionarios_faixa in (
                                '1_49',
                                '50_100',
                                '101_250',
                                '251_500',
                                '500_plus'
                              )),
  segmento                    text,                            -- livre: "SaaS B2B", "Construção residencial"...
  -- Localização
  cidade                      text default 'São Paulo',
  -- Canais da empresa
  site                        text,
  linkedin_empresa            text,
  instagram                   text,                            -- opcional pra B2B
  -- Contato principal (futura tabela 1:N — ver header)
  contato_nome                text,
  contato_cargo               text,                            -- "Head of People", "Diretora de RH"
  contato_email               text,
  contato_whatsapp            text,
  contato_linkedin            text,
  -- Pipeline comercial
  status_comercial            text not null default 'nao_contatado'
                              check (status_comercial in (
                                'nao_contatado',
                                'mensagem_enviada',
                                'respondeu',
                                'reuniao_marcada',
                                'proposta_enviada',
                                'negociacao',
                                'fechado',           -- ação pontual fechada (ex: gift cards de fim de ano)
                                'cliente_ativo',     -- conta recorrente da Elarah
                                'pausado',           -- esfriou mas não recusou
                                'recusou'
                              )),
  -- Potencial qualitativo (manual hoje; pode virar score automático
  -- depois com base em funcionarios + setor + interações)
  potencial                   text not null default 'medio'
                              check (potencial in ('baixo', 'medio', 'alto')),
  -- Próxima ação operacional (alimenta a view "Ações pra hoje")
  proxima_acao                text,                            -- livre: "ligar terça", "enviar proposta"
  proxima_acao_at             timestamptz,                     -- quando — filtro principal do dashboard B2B
  -- Texto livre
  observacoes                 text,
  -- Auditoria
  created_by                  uuid references auth.users(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Índices pra cobrir os filtros principais do admin
create index if not exists b2b_prospects_status_idx          on public.b2b_prospects (status_comercial);
create index if not exists b2b_prospects_tipo_idx            on public.b2b_prospects (tipo_empresa);
create index if not exists b2b_prospects_funcionarios_idx    on public.b2b_prospects (funcionarios_faixa);
create index if not exists b2b_prospects_potencial_idx       on public.b2b_prospects (potencial);
create index if not exists b2b_prospects_cidade_idx          on public.b2b_prospects (cidade);
create index if not exists b2b_prospects_created_idx         on public.b2b_prospects (created_at desc);
-- "Ações pra hoje" — query frequente: WHERE proxima_acao_at <= NOW()
create index if not exists b2b_prospects_proxima_acao_idx    on public.b2b_prospects (proxima_acao_at)
  where proxima_acao_at is not null;
-- Busca case-insensitive por nome de empresa
create index if not exists b2b_prospects_nome_lower_idx      on public.b2b_prospects (lower(nome));

drop trigger if exists set_b2b_prospects_updated_at on public.b2b_prospects;
create trigger set_b2b_prospects_updated_at
  before update on public.b2b_prospects
  for each row execute function public.set_updated_at();

alter table public.b2b_prospects enable row level security;

drop policy if exists "b2b_prospects_admin_all" on public.b2b_prospects;
create policy "b2b_prospects_admin_all"
  on public.b2b_prospects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 2. b2b_prospect_interactions =====
-- Timeline ordenada por occurred_at desc. Tipos incluem todo o
-- funil pra permitir relatórios e badges visuais sem precisar
-- abrir o lead (ex: "última interação foi reuniao_realizada há 3 dias").
create table if not exists public.b2b_prospect_interactions (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references public.b2b_prospects(id) on delete cascade,
  tipo          text not null check (tipo in (
                  'mensagem_enviada',
                  'respondeu',
                  'reuniao_marcada',
                  'reuniao_realizada',
                  'proposta_enviada',
                  'negociacao',
                  'fechado',
                  'cliente_ativo',
                  'pausado',
                  'recusou',
                  'follow_up',
                  'observacao'
                )),
  descricao     text,
  occurred_at   timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists b2b_prospect_interactions_prospect_idx
  on public.b2b_prospect_interactions (prospect_id, occurred_at desc);
create index if not exists b2b_prospect_interactions_tipo_idx
  on public.b2b_prospect_interactions (tipo);

alter table public.b2b_prospect_interactions enable row level security;

drop policy if exists "b2b_prospect_interactions_admin_all" on public.b2b_prospect_interactions;
create policy "b2b_prospect_interactions_admin_all"
  on public.b2b_prospect_interactions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 3. b2b_prospect_templates =====
-- Mensagens-base com variáveis substituídas no client:
--   {{empresa}}, {{contato}}, {{cargo}}, {{segmento}}, {{cidade}}
--
-- Categoria classifica o uso (primeiro_contato, follow_up, etc.) pra
-- o admin filtrar rápido. is_default marca um único template global
-- pra abrir nos modals novos.
create table if not exists public.b2b_prospect_templates (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,                                   -- "Primeiro contato — Head of People"
  categoria   text check (categoria in (
                'primeiro_contato',
                'follow_up',
                'pos_reuniao',
                'convite_experiencia',
                'data_comemorativa',
                'beneficio_corporativo',
                'acao_equipe',
                'gift_card_corporativo',
                'outro'
              )),
  conteudo    text not null,
  is_default  boolean not null default false,
  ordem       integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists b2b_prospect_templates_categoria_idx
  on public.b2b_prospect_templates (categoria);
create index if not exists b2b_prospect_templates_active_idx
  on public.b2b_prospect_templates (is_active, ordem);

-- Garante: no máximo 1 template marcado como default
create unique index if not exists b2b_prospect_templates_one_default_idx
  on public.b2b_prospect_templates ((is_default))
  where is_default = true;

drop trigger if exists set_b2b_prospect_templates_updated_at on public.b2b_prospect_templates;
create trigger set_b2b_prospect_templates_updated_at
  before update on public.b2b_prospect_templates
  for each row execute function public.set_updated_at();

alter table public.b2b_prospect_templates enable row level security;

drop policy if exists "b2b_prospect_templates_admin_all" on public.b2b_prospect_templates;
create policy "b2b_prospect_templates_admin_all"
  on public.b2b_prospect_templates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 4. Seeds de templates iniciais =====
-- Templates práticos pros cenários B2B mais comuns. Admin pode
-- editar/desativar/excluir depois. Insere só se ainda não existem
-- (idempotente via name uniqueness por categoria + nome).
insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Primeiro contato — RH/People', 'primeiro_contato',
'Olá, {{contato}}! Tudo bem?

Sou da Elarah, plataforma de experiências curadas em São Paulo. A gente trabalha com workshops criativos, gastronômicos e culturais que empresas como a {{empresa}} usam pra ações de cultura, datas comemorativas e benefícios pra equipe.

Vi que vocês são referência em {{segmento}} — adoraria entender se faz sentido a gente conversar sobre formatos pensados pro time. Tenho 20 minutos livres na semana, topa um café virtual?

Um abraço,
Elarah', true, 1
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Primeiro contato — RH/People');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Follow-up leve (3-5 dias)', 'follow_up', 'Oi {{contato}}, tudo bem?

Só dando um up por aqui no caso da minha mensagem ter passado batida na correria. Sem pressão — qualquer feedback (mesmo "não é o momento") já me ajuda muito.

Se topar uma conversa curta, me avisa que ajusto na sua agenda.

Abraço!', false, 2
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Follow-up leve (3-5 dias)');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Pós reunião — próximos passos', 'pos_reuniao', 'Oi {{contato}}, obrigada pela conversa de hoje!

Como combinado, vou organizar uma proposta pensada na {{empresa}} considerando o que conversamos sobre o time e os objetivos do semestre. Te mando aqui até {{prazo}}.

Qualquer ponto que esquecemos, é só responder esse email.

Um abraço!', false, 3
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Pós reunião — próximos passos');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Convite — experiência aberta', 'convite_experiencia', 'Oi {{contato}}!

A Elarah tá com uma experiência aberta no próximo mês que casaria muito bem com o time da {{empresa}} — formato curto, presencial, super criativo.

Caso queira mandar 1-2 pessoas do time pra experimentar antes de fechar uma ação interna, posso reservar vaga de cortesia. Topa?

Abraço!', false, 4
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Convite — experiência aberta');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Data comemorativa', 'data_comemorativa', 'Oi {{contato}}, tudo bem?

{{data}} tá chegando e a Elarah tem formatos pensados pra essa data: experiências que dá pra fazer com todo o time presencialmente ou enviar como benefício individual via gift card pra colaboradores remotos.

Se quiser, te mando 2-3 opções já com preço pra {{empresa}}. Me responde qual formato faz mais sentido?

Abraço!', false, 5
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Data comemorativa');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Benefício corporativo', 'beneficio_corporativo', 'Oi {{contato}}!

Várias empresas no segmento de {{segmento}} estão incluindo experiências como benefício pros colaboradores — formato gift card mensal ou pacote anual.

A Elarah tem um modelo B2B onde a {{empresa}} compra créditos e cada colaborador escolhe a experiência que quiser. Engajamento alto, sem dor de cabeça operacional.

Posso te explicar em 15 min como funciona?

Abraço!', false, 6
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Benefício corporativo');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Ação pra equipe (team building)', 'acao_equipe', 'Oi {{contato}}!

Pra ações de team building, a Elarah tem formatos presenciais que viraram queridinhos das empresas: pintura em quadro com aperol, gastronomia molecular, workshop de velas/perfumaria, oficina de cocktails.

Ideal pra grupos de 8-30 pessoas. A gente cuida de tudo — espaço, material, instrutor.

Quer que eu mande 3 sugestões pensadas pro time da {{empresa}}?

Abraço!', false, 7
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Ação pra equipe (team building)');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Gift Card corporativo', 'gift_card_corporativo', 'Oi {{contato}}!

A Elarah tem gift cards corporativos com valor livre que dá pra usar em qualquer experiência da nossa curadoria. Empresas como a {{empresa}} usam pra:

— Brinde de fim de ano
— Premiação por performance
— Onboarding de novos colaboradores
— Datas comemorativas individuais (aniversário, casamento)

Compra centralizada, entrega digital, sem logística. Posso te mandar a tabela B2B?

Abraço!', false, 8
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Gift Card corporativo');
