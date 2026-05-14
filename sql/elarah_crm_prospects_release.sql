-- =============================================================
-- ELARAH — CRM de Prospecção de Parceiros (RELEASE consolidado)
-- -------------------------------------------------------------
-- Arquivo único, idempotente, pra rodar de uma vez só no Supabase
-- SQL Editor e garantir que toda a infraestrutura de prospecção
-- de PARCEIROS (ateliês, marcas autorais) esteja no estado mais
-- recente.
--
-- O QUE ESSE ARQUIVO INCLUI (em ordem):
--   0) PRÉ-CLEANUP ......................... drop blindado de RPCs
--   1) elarah_crm_prospects.sql ............ tabelas + RPCs base
--      ↳ public.prospects, prospect_interactions, prospect_templates
--      ↳ RPC promote_prospect_to_fornecedor, log_prospect_interaction
--      ↳ Seeds iniciais de templates (Padrão geral + 3 por categoria)
--   2) elarah_crm_dedup_v2.sql ............. RPC de dedup + índices
--      ↳ public.find_prospect_matches contra experiences + metadata
--   3) elarah_crm_prospects_seed_followup.sql  templates de follow-up
--      ↳ Follow-up 1 (3-5 dias), 2 (1-2 semanas), 3 (porta aberta)
--   4) elarah_crm_promote_hotfix.sql ....... hotfix do promote
--   5) elarah_crm_prospects_templates_v2.sql  3 templates novos
--      ↳ Primeiro contato — WhatsApp / DM Instagram / E-mail
--
-- TODOS são idempotentes:
--   - Tabelas usam CREATE TABLE IF NOT EXISTS
--   - Índices usam CREATE INDEX IF NOT EXISTS
--   - Policies usam DROP POLICY IF EXISTS antes do CREATE
--   - Seeds usam INSERT ... WHERE NOT EXISTS pelo nome
--   - RPCs são dropadas no BLOCO 0 antes dos CREATEs
--
-- Rode quantas vezes quiser. Não destrói dados existentes (linhas
-- de prospects/interactions/templates) nem sobrescreve templates
-- editados manualmente pelo admin. As funções (RPCs) sim são
-- recriadas a cada execução.
--
-- DEPOIS DE RODAR ESSE SQL:
--   1) Abra o admin → aba "Prospecção"
--   2) Clique em "Importar CSV" e selecione data/prospects-seed-v1.csv
--   3) Clique em "Importar CSV" de novo e selecione data/prospects-seed-v2.csv
--   4) Os novos templates de primeiro contato (WhatsApp/DM/E-mail)
--      aparecem no dropdown do modal de timeline de cada prospect.
-- =============================================================


-- =============================================================
-- BLOCO 0/5 — PRÉ-CLEANUP de RPCs (drop blindado)
-- -------------------------------------------------------------
-- As funções abaixo evoluíram o RETURNS TABLE entre versões e o
-- Postgres não aceita CREATE OR REPLACE quando o shape de retorno
-- muda. Esse bloco dropa QUALQUER variante existente dessas
-- funções (qualquer assinatura) antes que os blocos seguintes
-- recriem na versão final. Sem isso, o release quebra com:
--   ERROR 42P13: cannot change return type of existing function
-- =============================================================
do $$
declare r record;
begin
  for r in
    select format('drop function %s cascade', p.oid::regprocedure) as stmt
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'promote_prospect_to_fornecedor',
         'find_matching_fornecedor',
         'find_prospect_matches'
       )
  loop
    execute r.stmt;
  end loop;
end$$;


-- =============================================================
-- BLOCO 1/5 — elarah_crm_prospects.sql
-- =============================================================
-- =============================================================
-- ELARAH — CRM de Prospecção de Parceiros
-- -------------------------------------------------------------
-- Estrutura para a aba "Prospecção" do admin: armazena possíveis
-- parceiros (workshops, ateliês, restaurantes, etc.) com pipeline
-- de status, timeline de interações e templates de mensagem
-- comerciais reutilizáveis.
--
-- Tabelas:
--   prospects                 — empresas/locais a serem contatados
--   prospect_interactions     — timeline (cada contato/resposta/etc)
--   prospect_templates        — mensagens-base com variáveis
--
-- RPCs:
--   promote_prospect_to_fornecedor — vira parceiro ativo (cria/upsert
--     em fornecedores_metadata + marca prospect.promoted_at)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Multiusuário-ready: RLS por public.is_admin() (hoje só você, mas
-- já preparado pra liberar pra outras admins futuramente).
-- =============================================================


-- ===== 1. prospects =====
create table if not exists public.prospects (
  id                          uuid primary key default gen_random_uuid(),
  -- Identificação
  nome                        text not null,
  categoria                   text,                          -- ceramica, pintura, joalheria, gastronomia, tufting, vela, outro
  -- Contatos (MVP: 1 por canal; schema preparado pra evoluir)
  instagram                   text,                          -- handle (@xxx) ou URL
  whatsapp                    text,                          -- BR format livre
  email                       text,
  site                        text,
  -- Localização
  bairro                      text,
  cidade                      text default 'São Paulo',
  -- Texto livre + pipeline
  observacoes                 text,
  status                      text not null default 'nao_contatado'
                              check (status in (
                                'nao_contatado',
                                'mensagem_enviada',
                                'respondeu',
                                'reuniao_marcada',
                                'parceria_fechada',
                                'recusou'
                              )),
  -- Snapshot da promoção pra fornecedor (preenchido pela RPC)
  promoted_to_fornecedor_at   timestamptz,
  promoted_supplier_key       text,
  -- Auditoria (multi-user ready)
  created_by                  uuid references auth.users(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists prospects_status_idx     on public.prospects (status);
create index if not exists prospects_categoria_idx  on public.prospects (categoria);
create index if not exists prospects_bairro_idx     on public.prospects (bairro);
create index if not exists prospects_created_idx    on public.prospects (created_at desc);
-- Busca por nome case-insensitive
create index if not exists prospects_nome_lower_idx on public.prospects (lower(nome));

drop trigger if exists set_prospects_updated_at on public.prospects;
create trigger set_prospects_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

alter table public.prospects enable row level security;

drop policy if exists "prospects_admin_all" on public.prospects;
create policy "prospects_admin_all"
  on public.prospects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 2. prospect_interactions =====
-- Timeline de cada interação. Multi-evento por prospect, ordenado
-- por occurred_at desc. tipo é discreto pra dashboard simples
-- (contagem por tipo etc.); descricao é texto livre opcional.
create table if not exists public.prospect_interactions (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references public.prospects(id) on delete cascade,
  tipo          text not null check (tipo in (
                  'mensagem_enviada',
                  'respondeu',
                  'follow_up',
                  'reuniao_marcada',
                  'reuniao_realizada',
                  'parceria_fechada',
                  'recusou',
                  'observacao'
                )),
  descricao     text,
  occurred_at   timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists prospect_interactions_prospect_idx
  on public.prospect_interactions (prospect_id, occurred_at desc);
create index if not exists prospect_interactions_tipo_idx
  on public.prospect_interactions (tipo);

alter table public.prospect_interactions enable row level security;

drop policy if exists "prospect_interactions_admin_all" on public.prospect_interactions;
create policy "prospect_interactions_admin_all"
  on public.prospect_interactions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 3. prospect_templates =====
-- Mensagens-base reutilizáveis com variáveis {{nome}}, {{categoria}},
-- {{bairro}} substituídas no client. categoria=null → template global
-- (fallback). is_default marca um único template global como padrão
-- pra abrir nos modals novos.
create table if not exists public.prospect_templates (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text,                                          -- null = global
  conteudo    text not null,
  is_default  boolean not null default false,
  ordem       integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists prospect_templates_categoria_idx
  on public.prospect_templates (categoria);
create index if not exists prospect_templates_active_idx
  on public.prospect_templates (is_active, ordem);

-- Garante: no máximo 1 template marcado como default (global)
create unique index if not exists prospect_templates_one_default_idx
  on public.prospect_templates ((is_default))
  where is_default = true;

drop trigger if exists set_prospect_templates_updated_at on public.prospect_templates;
create trigger set_prospect_templates_updated_at
  before update on public.prospect_templates
  for each row execute function public.set_updated_at();

alter table public.prospect_templates enable row level security;

drop policy if exists "prospect_templates_admin_all" on public.prospect_templates;
create policy "prospect_templates_admin_all"
  on public.prospect_templates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ===== 4. Seeds de templates =====
-- Template global default + 3 exemplos por categoria. Admin edita
-- ou cria novos pela UI. on conflict (nome) seria mais defensivo
-- mas como nome não é unique, só inserimos se não houver nenhum.
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem)
select * from (values
  (
    'Padrão geral',
    null::text,
    E'Oi! Tudo bem?\n\nSou fundadora da Elarah, uma plataforma de experiências offline em São Paulo. Conheci o trabalho de {{nome}} e acredito que faria muito sentido termos uma parceria — a Elarah já é referência pra quem busca experiências de {{categoria}} aqui em SP.\n\nPosso te mandar mais detalhes sobre como funciona a parceria? Sem qualquer compromisso.\n\nObrigada! 🧡',
    true,
    0
  ),
  (
    'Cerâmica / Tufting / Vela / Pintura',
    'ceramica',
    E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Adorei o trabalho de {{nome}} no {{bairro}} — workshops manuais como o de vocês são exatamente o tipo de experiência que mais converte na nossa plataforma.\n\nPosso te explicar como funciona uma parceria com a gente? Em geral, parceiros chegam a +20-30 alunos novos por mês.\n\nObrigada! 🧡',
    false,
    1
  ),
  (
    'Gastronomia',
    'gastronomia',
    E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. {{nome}} chamou atenção pelo {{categoria}} — a gente tem um público muito engajado pra workshops gastronômicos e jantares experienciais.\n\nFaz sentido conversarmos sobre uma parceria?\n\nObrigada! 🧡',
    false,
    2
  ),
  (
    'Joalheria',
    'joalheria',
    E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências em São Paulo. Acompanho o trabalho de {{nome}} no {{bairro}} e queria propor uma parceria — a aba de joias da Elarah cresceu bastante e está alinhada exatamente com o seu público.\n\nPosso te mandar como funcionaria?\n\nObrigada! 🧡',
    false,
    3
  )
) as v(nome, categoria, conteudo, is_default, ordem)
where not exists (select 1 from public.prospect_templates);


-- ===== 5. RPC promote_prospect_to_fornecedor =====
-- Promove um prospect a fornecedor cadastrado:
--   - Insere/atualiza fornecedores_metadata (whatsapp, observacoes,
--     data_entrada = hoje quando ainda não existir)
--   - Marca prospect.status = 'parceria_fechada'
--   - Marca prospect.promoted_to_fornecedor_at = now() e
--     promoted_supplier_key
--   - Loga interação 'parceria_fechada' na timeline
--
-- IMPORTANTE: o "fornecedor" no admin não tem tabela própria — é
-- derivado de bookings.fornecedor_nome / experiences.fornecedor_nome.
-- A promoção aqui só popula fornecedores_metadata pra que o
-- fornecedor já apareça com WhatsApp/data de entrada na aba
-- Fornecedores. Pra começar a aparecer com vendas, ainda precisa
-- criar uma experiência atribuída a ele (fluxo separado).
-- DROP antes do CREATE OR REPLACE porque versões posteriores
-- (dedup_v2, promote_hotfix) mudam o shape do RETURNS TABLE, e
-- Postgres não aceita REPLACE quando a forma do retorno muda.
drop function if exists public.promote_prospect_to_fornecedor(uuid);

create or replace function public.promote_prospect_to_fornecedor(
  p_prospect_id uuid
)
returns table (
  ok                boolean,
  fornecedor_key    text,
  fornecedor_nome   text,
  message           text
)
language plpgsql
security invoker
as $$
declare
  v_prospect public.prospects%rowtype;
  v_key      text;
begin
  -- Busca o prospect (RLS aplicada — admin only)
  select * into v_prospect from public.prospects where id = p_prospect_id;
  if not found then
    return query select false, null::text, null::text, 'Prospect não encontrado.';
    return;
  end if;

  -- Normaliza a key (mesmo padrão usado em outras migrations)
  v_key := lower(trim(regexp_replace(v_prospect.nome, '\s+', ' ', 'g')));

  -- Upsert em fornecedores_metadata (não sobrescreve dados existentes)
  insert into public.fornecedores_metadata (
    fornecedor_key, fornecedor_nome, data_entrada, whatsapp, observacoes
  ) values (
    v_key,
    v_prospect.nome,
    current_date,
    v_prospect.whatsapp,
    v_prospect.observacoes
  )
  on conflict (fornecedor_key) do update set
    fornecedor_nome = excluded.fornecedor_nome,
    data_entrada    = coalesce(public.fornecedores_metadata.data_entrada, excluded.data_entrada),
    whatsapp        = coalesce(nullif(trim(public.fornecedores_metadata.whatsapp), ''), excluded.whatsapp),
    observacoes     = coalesce(nullif(trim(public.fornecedores_metadata.observacoes), ''), excluded.observacoes);

  -- Marca o prospect como parceria fechada + snapshot
  update public.prospects
     set status                      = 'parceria_fechada',
         promoted_to_fornecedor_at   = now(),
         promoted_supplier_key       = v_key
   where id = p_prospect_id;

  -- Loga interação de fechamento
  insert into public.prospect_interactions (prospect_id, tipo, descricao)
  values (p_prospect_id, 'parceria_fechada', 'Promovido a fornecedor cadastrado.');

  return query select
    true,
    v_key,
    v_prospect.nome,
    'Promovido com sucesso. Confira a aba Fornecedores.';
end;
$$;

grant execute on function public.promote_prospect_to_fornecedor(uuid)
  to authenticated, service_role;


-- ===== 6. RPC log_prospect_interaction (helper) =====
-- Registra interação E atualiza prospects.status quando o tipo
-- mapear pra um status do pipeline. Mantém os dois consistentes.
create or replace function public.log_prospect_interaction(
  p_prospect_id uuid,
  p_tipo        text,
  p_descricao   text default null,
  p_occurred_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_new_status text;
begin
  insert into public.prospect_interactions (prospect_id, tipo, descricao, occurred_at)
  values (p_prospect_id, p_tipo, nullif(trim(p_descricao), ''), coalesce(p_occurred_at, now()))
  returning id into v_id;

  -- Mapeamento tipo de interação → status de pipeline.
  -- 'follow_up', 'reuniao_realizada' e 'observacao' não alteram status.
  v_new_status := case p_tipo
    when 'mensagem_enviada' then 'mensagem_enviada'
    when 'respondeu'        then 'respondeu'
    when 'reuniao_marcada'  then 'reuniao_marcada'
    when 'parceria_fechada' then 'parceria_fechada'
    when 'recusou'          then 'recusou'
    else null
  end;

  if v_new_status is not null then
    update public.prospects
       set status = v_new_status
     where id = p_prospect_id
       -- Não regride o pipeline (ex: 'parceria_fechada' não volta pra 'respondeu')
       and case status
             when 'parceria_fechada'  then false
             when 'recusou'           then v_new_status in ('parceria_fechada')
             when 'reuniao_marcada'   then v_new_status in ('parceria_fechada', 'recusou')
             when 'respondeu'         then v_new_status in ('reuniao_marcada', 'parceria_fechada', 'recusou')
             when 'mensagem_enviada'  then v_new_status in ('respondeu', 'reuniao_marcada', 'parceria_fechada', 'recusou')
             else true
           end;
  end if;

  return v_id;
end;
$$;

grant execute on function public.log_prospect_interaction(uuid, text, text, timestamptz)
  to authenticated, service_role;


notify pgrst, 'reload schema';


-- =============================================================
-- BLOCO 2/5 — elarah_crm_dedup_v2.sql
-- =============================================================
-- =============================================================
-- ELARAH — CRM dedup v2: detecção automática de parceiros existentes
-- -------------------------------------------------------------
-- Problema resolvido: hoje qualquer pessoa importa um prospect
-- (manual ou via CSV) que JÁ é fornecedor da Elarah. Aparece como
-- "novo prospect" e o operador perde tempo prospectando alguém
-- que já é parceiro.
--
-- Solução:
--   1. Estende fornecedores_metadata com instagram/email/site +
--      tipo_parceria (Elarah / By Elarah / Ambos).
--   2. Adiciona status 'ja_parceiro' aos prospects.
--   3. Cria helpers de normalização (lowercase, sem acento, etc.).
--   4. RPC find_matching_fornecedor compara nome+IG+WA+email+site
--      contra experiences + fornecedores_metadata + outros prospects.
--   5. Atualiza promote_prospect_to_fornecedor pra preencher os
--      novos campos no upsert.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- REVERSÍVEL: drops são "if exists", colunas adicionadas via
-- "if not exists".
-- =============================================================


-- ===== 1. Extensão unaccent (pra remover acentos no match) =====
-- Já costuma vir habilitada em projetos Supabase, mas garantindo
-- aqui pra não falhar se for uma instância nova.
create extension if not exists unaccent;


-- ===== 2. Helpers de normalização =====
-- Funções pequenas reusadas em vários CHECKs e RPCs. Marcadas
-- IMMUTABLE pra que possam ser usadas em índices funcionais
-- (ex: criar índice em _norm_text(nome)).

-- Texto: lowercase + sem acento + colapsa espaços
create or replace function public._norm_text(s text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(public.unaccent(regexp_replace(coalesce(s, ''), '\s+', ' ', 'g'))),
    ''
  )
$$;

-- Handle (Instagram): remove @, espaços, barras, aceita URL
create or replace function public._norm_handle(s text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(regexp_replace(
      regexp_replace(coalesce(s, ''), '^https?://(www\.)?(instagram\.com/)?', '', 'i'),
      '[@\s/]', '', 'g'
    )),
    ''
  )
$$;

-- Telefone: só dígitos. DDI 55 é normalizado removendo o prefixo
-- (assim "+55 11 99999" e "11 99999" batem).
create or replace function public._norm_phone(s text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(coalesce(s, ''), '\D', '', 'g'),
      '^55(\d{10,11})$', '\1'
    ),
    ''
  )
$$;

-- Email: lowercase + trim
create or replace function public._norm_email(s text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(coalesce(s, ''))), '')
$$;

-- Site: tira protocolo, www., trailing slash e path
create or replace function public._norm_site(s text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(regexp_replace(
      regexp_replace(
        regexp_replace(coalesce(s, ''), '^https?://', '', 'i'),
        '^www\.', '', 'i'),
      '[/?#].*$', ''
    )),
    ''
  )
$$;


-- ===== 3. fornecedores_metadata: novas colunas =====
-- instagram/email/site pra dedup completo + tipo_parceria pra
-- categorizar a relação (Elarah marketplace / By Elarah produtos /
-- ambos). prospect_id permite ir do fornecedor de volta pro prospect.
alter table public.fornecedores_metadata
  add column if not exists instagram     text,
  add column if not exists email         text,
  add column if not exists site          text,
  add column if not exists tipo_parceria text,
  add column if not exists prospect_id   uuid references public.prospects(id) on delete set null;

-- CHECK em tipo_parceria (drop+add pra ser idempotente)
alter table public.fornecedores_metadata
  drop constraint if exists fornecedores_metadata_tipo_parceria_check;
alter table public.fornecedores_metadata
  add constraint fornecedores_metadata_tipo_parceria_check
  check (tipo_parceria is null or tipo_parceria in ('elarah', 'byelarah', 'ambos'));


-- ===== 4. prospects: status 'ja_parceiro' =====
-- Recria o CHECK pra incluir o novo valor.
alter table public.prospects
  drop constraint if exists prospects_status_check;
alter table public.prospects
  add constraint prospects_status_check
  check (status in (
    'nao_contatado',
    'mensagem_enviada',
    'respondeu',
    'reuniao_marcada',
    'parceria_fechada',
    'ja_parceiro',
    'recusou'
  ));


-- ===== 5. RPC find_matching_fornecedor =====
-- Recebe os campos de um prospect candidato e devolve TODAS as
-- correspondências encontradas em 3 fontes:
--   - experiences          (fornecedor_nome de exp ativa não-teste)
--   - fornecedores_metadata (nome / IG / WA / email / site)
--   - prospects             (nome / IG / WA / email / site)
--
-- Cliente decide o que fazer com cada match (vincular como
-- 'ja_parceiro', pular, ou ignorar).
--
-- Excludes auto-self via p_exclude_prospect_id (útil quando edita
-- um prospect existente — não quer matchar consigo mesmo).
drop function if exists public.find_matching_fornecedor(text, text, text, text, text, uuid);

create or replace function public.find_matching_fornecedor(
  p_nome                 text default null,
  p_instagram            text default null,
  p_whatsapp             text default null,
  p_email                text default null,
  p_site                 text default null,
  p_exclude_prospect_id  uuid default null
)
returns table (
  source           text,        -- 'experience' | 'fornecedor_metadata' | 'prospect'
  match_reason     text,        -- 'name' | 'instagram' | 'whatsapp' | 'email' | 'site'
  ref_id           text,
  ref_nome         text,
  fornecedor_key   text         -- chave normalizada pra vincular o prospect
)
language sql
security invoker
stable
as $$
  with norm as (
    select
      public._norm_text(p_nome)        as nome_n,
      public._norm_handle(p_instagram) as ig_n,
      public._norm_phone(p_whatsapp)   as wa_n,
      public._norm_email(p_email)      as email_n,
      public._norm_site(p_site)        as site_n
  ),
  -- Match em experiências ativas e não-teste
  by_experience as (
    select
      'experience'::text                as source,
      'name'::text                      as match_reason,
      e.id::text                        as ref_id,
      e.fornecedor_nome                 as ref_nome,
      public._norm_text(e.fornecedor_nome) as fornecedor_key
    from public.experiences e, norm n
    where n.nome_n is not null
      and e.fornecedor_nome is not null
      and coalesce(e.is_active, true) = true
      and coalesce(e.is_test, false) = false
      and public._norm_text(e.fornecedor_nome) = n.nome_n
  ),
  -- Match em fornecedores_metadata
  by_metadata as (
    select * from (
      select
        'fornecedor_metadata'::text as source,
        case
          when n.nome_n  is not null and public._norm_text(fm.fornecedor_nome) = n.nome_n  then 'name'
          when n.ig_n    is not null and public._norm_handle(fm.instagram)     = n.ig_n    then 'instagram'
          when n.wa_n    is not null and public._norm_phone(fm.whatsapp)       = n.wa_n    then 'whatsapp'
          when n.email_n is not null and public._norm_email(fm.email)          = n.email_n then 'email'
          when n.site_n  is not null and public._norm_site(fm.site)            = n.site_n  then 'site'
        end as match_reason,
        fm.id::text         as ref_id,
        fm.fornecedor_nome  as ref_nome,
        fm.fornecedor_key
      from public.fornecedores_metadata fm, norm n
      where (n.nome_n  is not null and public._norm_text(fm.fornecedor_nome) = n.nome_n)
         or (n.ig_n    is not null and public._norm_handle(fm.instagram)     = n.ig_n)
         or (n.wa_n    is not null and public._norm_phone(fm.whatsapp)       = n.wa_n)
         or (n.email_n is not null and public._norm_email(fm.email)          = n.email_n)
         or (n.site_n  is not null and public._norm_site(fm.site)            = n.site_n)
    ) m
    where match_reason is not null
  ),
  -- Match em prospects (excluindo self na edição)
  by_prospect as (
    select * from (
      select
        'prospect'::text as source,
        case
          when n.nome_n  is not null and public._norm_text(pr.nome)      = n.nome_n  then 'name'
          when n.ig_n    is not null and public._norm_handle(pr.instagram) = n.ig_n    then 'instagram'
          when n.wa_n    is not null and public._norm_phone(pr.whatsapp)   = n.wa_n    then 'whatsapp'
          when n.email_n is not null and public._norm_email(pr.email)      = n.email_n then 'email'
          when n.site_n  is not null and public._norm_site(pr.site)        = n.site_n  then 'site'
        end as match_reason,
        pr.id::text          as ref_id,
        pr.nome              as ref_nome,
        public._norm_text(pr.nome) as fornecedor_key
      from public.prospects pr, norm n
      where (p_exclude_prospect_id is null or pr.id <> p_exclude_prospect_id)
        and ((n.nome_n  is not null and public._norm_text(pr.nome)      = n.nome_n)
          or (n.ig_n    is not null and public._norm_handle(pr.instagram) = n.ig_n)
          or (n.wa_n    is not null and public._norm_phone(pr.whatsapp)   = n.wa_n)
          or (n.email_n is not null and public._norm_email(pr.email)      = n.email_n)
          or (n.site_n  is not null and public._norm_site(pr.site)        = n.site_n))
    ) m
    where match_reason is not null
  )
  -- Fornecedor (experience > metadata) tem prioridade visual sobre prospect.
  -- Cliente pode usar source pra escolher mensagem de aviso adequada.
  select * from by_experience
  union all
  select * from by_metadata
  union all
  select * from by_prospect;
$$;

grant execute on function public.find_matching_fornecedor(text, text, text, text, text, uuid)
  to authenticated, service_role;


-- ===== 6. promote_prospect_to_fornecedor v2 =====
-- Inclui IG/email/site no upsert + retorna se já era parceiro
-- (pra UI ajustar a mensagem). Mantém retrocompat com schema antigo.
drop function if exists public.promote_prospect_to_fornecedor(uuid);

create or replace function public.promote_prospect_to_fornecedor(
  p_prospect_id uuid
)
returns table (
  ok                boolean,
  fornecedor_key    text,
  fornecedor_nome   text,
  was_already_partner boolean,
  message           text
)
language plpgsql
security invoker
as $$
declare
  v_prospect public.prospects%rowtype;
  v_key      text;
  v_existed  boolean;
begin
  select * into v_prospect from public.prospects where id = p_prospect_id;
  if not found then
    return query select false, null::text, null::text, false, 'Prospect não encontrado.';
    return;
  end if;

  v_key := public._norm_text(v_prospect.nome);

  select exists(
    select 1 from public.fornecedores_metadata where fornecedor_key = v_key
  ) into v_existed;

  -- Upsert em fornecedores_metadata: preserva dados existentes não-vazios
  -- (NÃO sobrescreve WhatsApp/email/site/observações já preenchidos).
  insert into public.fornecedores_metadata (
    fornecedor_key, fornecedor_nome, data_entrada,
    whatsapp, email, instagram, site, observacoes,
    prospect_id
  ) values (
    v_key,
    v_prospect.nome,
    current_date,
    v_prospect.whatsapp,
    v_prospect.email,
    v_prospect.instagram,
    v_prospect.site,
    v_prospect.observacoes,
    p_prospect_id
  )
  on conflict (fornecedor_key) do update set
    fornecedor_nome = excluded.fornecedor_nome,
    data_entrada    = coalesce(public.fornecedores_metadata.data_entrada, excluded.data_entrada),
    whatsapp        = coalesce(nullif(trim(public.fornecedores_metadata.whatsapp), ''),  excluded.whatsapp),
    email           = coalesce(nullif(trim(public.fornecedores_metadata.email), ''),     excluded.email),
    instagram       = coalesce(nullif(trim(public.fornecedores_metadata.instagram), ''), excluded.instagram),
    site            = coalesce(nullif(trim(public.fornecedores_metadata.site), ''),      excluded.site),
    observacoes     = coalesce(nullif(trim(public.fornecedores_metadata.observacoes), ''), excluded.observacoes),
    prospect_id     = coalesce(public.fornecedores_metadata.prospect_id, excluded.prospect_id);

  -- Marca o prospect como parceria fechada + snapshot
  update public.prospects
     set status                      = 'parceria_fechada',
         promoted_to_fornecedor_at   = now(),
         promoted_supplier_key       = v_key
   where id = p_prospect_id;

  -- Loga interação
  insert into public.prospect_interactions (prospect_id, tipo, descricao)
  values (
    p_prospect_id,
    'parceria_fechada',
    case when v_existed
         then 'Vinculado a fornecedor já existente.'
         else 'Promovido a fornecedor cadastrado.'
    end
  );

  return query select
    true,
    v_key,
    v_prospect.nome,
    v_existed,
    case when v_existed
         then 'Já existia como fornecedor — vínculo atualizado e prospect marcado como parceria fechada.'
         else 'Promovido com sucesso. Confira a aba Fornecedores.'
    end;
end;
$$;

grant execute on function public.promote_prospect_to_fornecedor(uuid)
  to authenticated, service_role;


-- ===== 7. Backfill: marca prospects existentes que já são parceiros =====
-- Roda toda vez: pra cada prospect ainda não-parceiro, se houver
-- match em fornecedor_metadata/experience, marca como 'ja_parceiro'
-- com snapshot da chave. Quem já tá em parceria_fechada/ja_parceiro/
-- recusou não é tocado.
--
-- Uso um CTE em vez de `update ... from lateral (...)` direto porque
-- o Postgres não permite que um LATERAL no FROM de um UPDATE
-- referencie a target table do UPDATE (erro 42P10). O CTE calcula
-- os matches num escopo onde `prospects` é só uma fonte qualquer,
-- e o UPDATE junta por id.
with prospect_matches as (
  select p.id as prospect_id, m.fornecedor_key
    from public.prospects p
    cross join lateral (
      select * from public.find_matching_fornecedor(
        p.nome, p.instagram, p.whatsapp, p.email, p.site, p.id
      )
      where source in ('experience', 'fornecedor_metadata')
      limit 1
    ) m
   where p.status not in ('parceria_fechada', 'ja_parceiro', 'recusou')
     and m.fornecedor_key is not null
)
update public.prospects p
   set status                    = 'ja_parceiro',
       promoted_to_fornecedor_at = coalesce(p.promoted_to_fornecedor_at, now()),
       promoted_supplier_key     = pm.fornecedor_key
  from prospect_matches pm
 where pm.prospect_id = p.id;


notify pgrst, 'reload schema';


-- =============================================================
-- BLOCO 3/5 — elarah_crm_prospects_seed_followup.sql
-- =============================================================
-- =============================================================
-- ELARAH — Seed: Templates de Follow-up pra Prospecção (parceiros)
-- -------------------------------------------------------------
-- Adiciona 3 templates de follow-up na tabela prospect_templates
-- pra cobrir a régua completa de retomada de contato com
-- possíveis parceiros (ateliês, professores, fornecedores de
-- experiência). Variáveis suportadas pelo client:
--   {{nome}}, {{categoria}}, {{bairro}}
--
-- ETAPAS DO FOLLOW-UP
--
--   1. Follow-up 1 — 3-5 dias após primeira mensagem
--      Leve, sem cobrança. Apenas "olha, mandei aquele dia,
--      qualquer coisa me responde mesmo que seja não".
--
--   2. Follow-up 2 — 1-2 semanas (com convite curto)
--      Reforça a proposta com 1 frase nova e oferece um
--      formato simples de conversa (10-15 min).
--
--   3. Follow-up 3 — 3+ semanas (porta aberta)
--      Última tentativa, sem desespero. "Deixa a porta aberta
--      pro futuro" — preserva relacionamento mesmo se não
--      respondeu agora.
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS pelo nome — pode rodar várias
--   vezes sem duplicar. Templates já editados pelo admin com
--   esses nomes são preservados (NÃO sobrescreve conteúdo).
-- =============================================================


-- Pré-checagem: aborta se a tabela prospect_templates não existir
-- (depende de sql/elarah_crm_prospects.sql ter rodado antes).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prospect_templates'
  ) then
    raise exception 'Tabela public.prospect_templates não existe. Rode sql/elarah_crm_prospects.sql primeiro.';
  end if;
end $$;


-- ===== Follow-up 1 — Leve (3-5 dias) =====
-- Categoria null = template global (aparece em qualquer prospect).
-- ordem=10 pra ficar agrupado com os follow-ups (a default fica em 0).
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Follow-up 1 — 3 a 5 dias (leve)', null,
'Oi, {{nome}}! Tudo bem?

Mandei uma mensagem por aqui esses dias falando da Elarah e queria só dar um up — sem pressão. Sei que a rotina é corrida, principalmente em {{categoria}}.

Se fizer sentido conversar, qualquer dia dessa semana eu consigo dar um pulo aí no {{bairro}} ou marcar um café virtual. Se não for o momento, também me avisa que aí volto a falar mais pra frente.

Um abraço!',
10, true
where not exists (
  select 1 from public.prospect_templates where lower(nome) = lower('Follow-up 1 — 3 a 5 dias (leve)')
);


-- ===== Follow-up 2 — Com convite curto (1-2 semanas) =====
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Follow-up 2 — 1 a 2 semanas (com convite)', null,
'Oi, {{nome}}! Volto aqui rapidinho 💛

Estou montando a curadoria da Elarah pros próximos meses e o seu trabalho em {{categoria}} continua sendo uma referência que eu quero muito ter na plataforma.

Topa marcar 15 minutos esta semana pra eu te contar como funciona a parceria? Promete ser objetivo — se não for pra você, sem problema nenhum.

Posso te ligar ou ir aí no {{bairro}}, o que for mais fácil.

Abraço!',
11, true
where not exists (
  select 1 from public.prospect_templates where lower(nome) = lower('Follow-up 2 — 1 a 2 semanas (com convite)')
);


-- ===== Follow-up 3 — Porta aberta (3+ semanas, última tentativa) =====
-- Tom mais final, mas sem queimar a ponte. Permite voltar no
-- futuro se o contexto mudar.
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Follow-up 3 — porta aberta (3+ semanas)', null,
'Oi, {{nome}}!

Sei que mandei algumas mensagens por aqui e talvez não seja o momento — sem nenhum problema. Só queria deixar registrado que a Elarah segue interessada em parceria com o seu trabalho em {{categoria}}, e qualquer hora que fizer sentido, é só responder esta conversa.

Se preferir, também consigo te mandar um material por email pra você ler com calma quando quiser. Me avisa.

Um abraço grande,
Elarah',
12, true
where not exists (
  select 1 from public.prospect_templates where lower(nome) = lower('Follow-up 3 — porta aberta (3+ semanas)')
);


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Roda essa query pra ver os 3 templates novos:
--
--   select nome, categoria, ordem, is_active
--   from public.prospect_templates
--   where nome ilike '%follow-up%'
--   order by ordem;
--
-- Esperado: 3 linhas com ordem 10, 11, 12.


-- =============================================================
-- BLOCO 4/5 — elarah_crm_promote_hotfix.sql
-- =============================================================
-- =============================================================
-- ELARAH — CRM hotfix v3: corrige promote_prospect_to_fornecedor
-- -------------------------------------------------------------
-- Bug detectado em produção: ao clicar "Promover a fornecedor" o
-- admin recebia "Erro: column reference 'fornecedor_key' is
-- ambiguous". Causa: a função plpgsql declara um OUT parameter
-- `fornecedor_key` (via RETURNS TABLE) que conflita com a coluna
-- de mesmo nome em fornecedores_metadata. Dentro do corpo da
-- função, qualquer referência não-qualificada a `fornecedor_key`
-- (ex: na cláusula WHERE de SELECT EXISTS, ou na ON CONFLICT)
-- vira ambígua.
--
-- Correção: qualificar TODAS as referências a colunas com alias
-- de tabela (fm.fornecedor_key). ON CONFLICT precisa de tratamento
-- especial — usa-se a coluna pelo nome simples mas DENTRO do
-- DO UPDATE SET o uso do prefixo da tabela ainda é ambíguo, então
-- também qualificamos.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

drop function if exists public.promote_prospect_to_fornecedor(uuid);

create or replace function public.promote_prospect_to_fornecedor(
  p_prospect_id uuid
)
returns table (
  ok                  boolean,
  fornecedor_key      text,
  fornecedor_nome     text,
  was_already_partner boolean,
  message             text
)
language plpgsql
security invoker
as $$
declare
  v_prospect public.prospects%rowtype;
  v_key      text;
  v_existed  boolean;
begin
  select * into v_prospect from public.prospects p where p.id = p_prospect_id;
  if not found then
    return query select false, null::text, null::text, false, 'Prospect não encontrado.';
    return;
  end if;

  v_key := public._norm_text(v_prospect.nome);

  -- Qualificado com alias fm pra evitar ambiguidade com OUT parameter
  -- `fornecedor_key` (de RETURNS TABLE).
  select exists(
    select 1
      from public.fornecedores_metadata fm
     where fm.fornecedor_key = v_key
  ) into v_existed;

  -- Upsert em fornecedores_metadata. As referências dentro do DO UPDATE
  -- SET precisam ser qualificadas com o nome da tabela pra evitar
  -- conflito com o OUT parameter homônimo.
  insert into public.fornecedores_metadata (
    fornecedor_key, fornecedor_nome, data_entrada,
    whatsapp, email, instagram, site, observacoes,
    prospect_id
  ) values (
    v_key,
    v_prospect.nome,
    current_date,
    v_prospect.whatsapp,
    v_prospect.email,
    v_prospect.instagram,
    v_prospect.site,
    v_prospect.observacoes,
    p_prospect_id
  )
  on conflict (fornecedor_key) do update set
    fornecedor_nome = excluded.fornecedor_nome,
    data_entrada    = coalesce(public.fornecedores_metadata.data_entrada, excluded.data_entrada),
    whatsapp        = coalesce(nullif(trim(public.fornecedores_metadata.whatsapp),    ''), excluded.whatsapp),
    email           = coalesce(nullif(trim(public.fornecedores_metadata.email),       ''), excluded.email),
    instagram       = coalesce(nullif(trim(public.fornecedores_metadata.instagram),   ''), excluded.instagram),
    site            = coalesce(nullif(trim(public.fornecedores_metadata.site),        ''), excluded.site),
    observacoes     = coalesce(nullif(trim(public.fornecedores_metadata.observacoes), ''), excluded.observacoes),
    prospect_id     = coalesce(public.fornecedores_metadata.prospect_id, excluded.prospect_id);

  -- Marca o prospect como parceria fechada + snapshot. Qualifica com p
  -- pra deixar a intenção clara (promoted_supplier_key não é OUT, mas
  -- fica padronizado).
  update public.prospects p
     set status                    = 'parceria_fechada',
         promoted_to_fornecedor_at = now(),
         promoted_supplier_key     = v_key
   where p.id = p_prospect_id;

  -- Loga interação de fechamento
  insert into public.prospect_interactions (prospect_id, tipo, descricao)
  values (
    p_prospect_id,
    'parceria_fechada',
    case when v_existed
         then 'Vinculado a fornecedor já existente.'
         else 'Promovido a fornecedor cadastrado.'
    end
  );

  return query select
    true,
    v_key,
    v_prospect.nome,
    v_existed,
    case when v_existed
         then 'Já existia como fornecedor — vínculo atualizado e prospect marcado como parceria fechada.'
         else 'Promovido com sucesso. Confira a aba Fornecedores.'
    end;
end;
$$;

grant execute on function public.promote_prospect_to_fornecedor(uuid)
  to authenticated, service_role;

notify pgrst, 'reload schema';


-- =============================================================
-- BLOCO 5/5 — elarah_crm_prospects_templates_v2.sql
-- =============================================================
-- =============================================================
-- ELARAH — Templates de Primeiro Contato (3 canais)
-- -------------------------------------------------------------
-- Adiciona 3 templates de primeiro contato em prospect_templates,
-- um por canal (WhatsApp, DM Instagram, E-mail). Tom premium,
-- natural, curatorial — não parece disparo nem agência.
--
-- VARIÁVEIS suportadas pelo client do admin (substituídas ao
-- copiar a mensagem):
--   {{nome}}, {{categoria}}, {{bairro}}
--
-- O "[seu nome]" e os contatos pessoais NÃO são variáveis do
-- sistema — são placeholders que o admin troca à mão na hora
-- de enviar (assinatura do fundador / curadora real).
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS pelo nome do template. Pode
--   rodar quantas vezes for. Templates editados pelo admin
--   com esses nomes NÃO são sobrescritos.
-- =============================================================

-- Pré-checagem amigável: aborta se a tabela prospect_templates
-- ainda não existir (depende de sql/elarah_crm_prospects.sql).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'prospect_templates'
  ) then
    raise exception 'Tabela prospect_templates ausente. Rode sql/elarah_crm_prospects.sql antes.';
  end if;
end$$;


-- ===== 1. Primeiro contato — WhatsApp =====
-- Canal: mobile, lido em segundos. Sem assinatura formal, sem
-- assunto. Ordem 10 pra ficar acima dos templates de follow-up
-- (que ficam em 2+) e logo abaixo do "Padrão geral" (0).
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select
  'Primeiro contato — WhatsApp',
  null::text,
  E'Oi {{nome}}, aqui é a [seu nome] da Elarah.\n\nA gente cura uma plataforma de experiências autorais em SP — e {{nome}} é exatamente o tipo de ateliê que aparece quando alguém procura {{categoria}} de verdade.\n\nFaria sentido a gente trocar uma ideia rápida sobre uma parceria? Te conto em 2-3 mensagens, sem rodeio.',
  false,
  10,
  true
where not exists (
  select 1 from public.prospect_templates
   where nome = 'Primeiro contato — WhatsApp'
);


-- ===== 2. Primeiro contato — DM Instagram =====
-- Canal: feed-first. Primeira linha vira preview na inbox da
-- pessoa, então abre com o elogio específico ao trabalho dela.
-- Pede o WhatsApp pra migrar a conversa pro canal mais
-- comercial.
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select
  'Primeiro contato — DM Instagram',
  null::text,
  E'Oi {{nome}}, há um tempo acompanho vocês por aqui e o trabalho de {{categoria}} de vocês é um dos que dá vontade de levar pra quem busca experiência autoral em SP.\n\nFaço a curadoria da Elarah — plataforma de experiências em São Paulo. Sou bem seletiva com quem entra, e {{nome}} encaixa muito.\n\nSe fizer sentido, te chamo no WhatsApp em 2-3 linhas e te explico como pensei a parceria. Manda seu número?',
  false,
  11,
  true
where not exists (
  select 1 from public.prospect_templates
   where nome = 'Primeiro contato — DM Instagram'
);


-- ===== 3. Primeiro contato — E-mail =====
-- Canal: leitura calma, tela maior. Inclui assunto sugerido na
-- primeira linha do conteúdo (admin copia o corpo todo e usa a
-- linha "Assunto:" como guia ao montar o e-mail). Encerra com
-- um CTA específico (2 horários) pra reduzir atrito de resposta.
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select
  'Primeiro contato — E-mail',
  null::text,
  E'Assunto: Conversa rápida — Elarah e {{nome}}\n\nOi {{nome}}, tudo bem?\n\nSou a [seu nome], curadora da Elarah — plataforma de experiências autorais em São Paulo. A Elarah é uma curadoria seletiva por desenho, e {{nome}} está entre os perfis mais alinhados com o que a gente entrega em {{categoria}}.\n\nAcompanho o trabalho de vocês há um tempo. Queria propor uma conversa curta — 10-15 minutos — sobre como uma parceria poderia funcionar. Sem compromisso, é mais pra você sentir se faz sentido pro momento de vocês.\n\nSe topar, me responde com dois horários que ficariam bons pra você na semana que vem — eu confirmo um.\n\nUm abraço,\n[seu nome]\nWhatsApp: [seu número]\nelarah.com.br',
  false,
  12,
  true
where not exists (
  select 1 from public.prospect_templates
   where nome = 'Primeiro contato — E-mail'
);


notify pgrst, 'reload schema';
