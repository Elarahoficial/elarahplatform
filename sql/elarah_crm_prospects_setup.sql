-- =============================================================
-- ELARAH — CRM de Prospecção de Parceiros (SETUP único)
-- =============================================================
-- VERSÃO: elarah-crm-prospects-setup-2025-05-14-A
-- -------------------------------------------------------------
-- Arquivo único, idempotente, autocontido. Substitui todas as
-- migrations anteriores (elarah_crm_prospects.sql, dedup_v2,
-- seed_followup, promote_hotfix, templates_v2 e o release
-- consolidado). Pode rodar quantas vezes precisar.
--
-- Quando rodar, a PRIMEIRA linha de resultado mostra:
--   release_version = elarah-crm-prospects-setup-2025-05-14-A
-- A ÚLTIMA linha mostra:
--   status = OK — setup concluído.
-- Se você vir as duas, deu certo.
-- =============================================================

select 'elarah-crm-prospects-setup-2025-05-14-A'::text as release_version;


-- =============================================================
-- 0) DROP de funções que mudam de retorno entre versões
-- =============================================================
-- Postgres não aceita CREATE OR REPLACE quando o shape de RETURNS
-- TABLE muda. Dropa qualquer assinatura preexistente dessas RPCs
-- antes de recriá-las.
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
         'log_prospect_interaction'
       )
  loop
    execute r.stmt;
  end loop;
end$$;


-- =============================================================
-- 1) Extensões
-- =============================================================
create extension if not exists unaccent;


-- =============================================================
-- 2) Tabela: prospects
-- =============================================================
create table if not exists public.prospects (
  id                          uuid primary key default gen_random_uuid(),
  nome                        text not null,
  categoria                   text,
  instagram                   text,
  whatsapp                    text,
  email                       text,
  site                        text,
  bairro                      text,
  cidade                      text default 'São Paulo',
  observacoes                 text,
  status                      text not null default 'nao_contatado',
  promoted_to_fornecedor_at   timestamptz,
  promoted_supplier_key       text,
  created_by                  uuid references auth.users(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- CHECK do status — recria pra incluir 'ja_parceiro' se já existia.
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

create index if not exists prospects_status_idx     on public.prospects (status);
create index if not exists prospects_categoria_idx  on public.prospects (categoria);
create index if not exists prospects_bairro_idx     on public.prospects (bairro);
create index if not exists prospects_created_idx    on public.prospects (created_at desc);
create index if not exists prospects_nome_lower_idx on public.prospects (lower(nome));

drop trigger if exists set_prospects_updated_at on public.prospects;
create trigger set_prospects_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

alter table public.prospects enable row level security;
drop policy if exists "prospects_admin_all" on public.prospects;
create policy "prospects_admin_all"
  on public.prospects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- =============================================================
-- 3) Tabela: prospect_interactions (timeline)
-- =============================================================
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
  on public.prospect_interactions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- =============================================================
-- 4) Tabela: prospect_templates
-- =============================================================
create table if not exists public.prospect_templates (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text,
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
-- No máximo 1 default
create unique index if not exists prospect_templates_one_default_idx
  on public.prospect_templates ((is_default)) where is_default = true;

drop trigger if exists set_prospect_templates_updated_at on public.prospect_templates;
create trigger set_prospect_templates_updated_at
  before update on public.prospect_templates
  for each row execute function public.set_updated_at();

alter table public.prospect_templates enable row level security;
drop policy if exists "prospect_templates_admin_all" on public.prospect_templates;
create policy "prospect_templates_admin_all"
  on public.prospect_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- =============================================================
-- 5) fornecedores_metadata: colunas extras pra dedup
-- =============================================================
alter table public.fornecedores_metadata
  add column if not exists instagram     text,
  add column if not exists email         text,
  add column if not exists site          text,
  add column if not exists tipo_parceria text,
  add column if not exists prospect_id   uuid references public.prospects(id) on delete set null;

alter table public.fornecedores_metadata
  drop constraint if exists fornecedores_metadata_tipo_parceria_check;
alter table public.fornecedores_metadata
  add constraint fornecedores_metadata_tipo_parceria_check
  check (tipo_parceria is null or tipo_parceria in ('elarah', 'byelarah', 'ambos'));


-- =============================================================
-- 6) Helpers de normalização (IMMUTABLE pra uso em índices)
-- =============================================================
create or replace function public._norm_text(s text)
returns text language sql immutable as $$
  select nullif(lower(public.unaccent(regexp_replace(coalesce(s, ''), '\s+', ' ', 'g'))), '')
$$;

create or replace function public._norm_handle(s text)
returns text language sql immutable as $$
  select nullif(
    lower(regexp_replace(
      regexp_replace(coalesce(s, ''), '^https?://(www\.)?(instagram\.com/)?', '', 'i'),
      '[@\s/]', '', 'g'
    )), ''
  )
$$;

create or replace function public._norm_phone(s text)
returns text language sql immutable as $$
  select nullif(
    regexp_replace(
      regexp_replace(coalesce(s, ''), '\D', '', 'g'),
      '^55(\d{10,11})$', '\1'
    ), ''
  )
$$;

create or replace function public._norm_email(s text)
returns text language sql immutable as $$
  select nullif(lower(trim(coalesce(s, ''))), '')
$$;

create or replace function public._norm_site(s text)
returns text language sql immutable as $$
  select nullif(
    lower(regexp_replace(
      regexp_replace(
        regexp_replace(coalesce(s, ''), '^https?://', '', 'i'),
        '^www\.', '', 'i'),
      '[/?#].*$', ''
    )), ''
  )
$$;


-- =============================================================
-- 7) RPC: find_matching_fornecedor (dedup contra 3 fontes)
-- =============================================================
create or replace function public.find_matching_fornecedor(
  p_nome                 text default null,
  p_instagram            text default null,
  p_whatsapp             text default null,
  p_email                text default null,
  p_site                 text default null,
  p_exclude_prospect_id  uuid default null
)
returns table (
  source           text,
  match_reason     text,
  ref_id           text,
  ref_nome         text,
  fornecedor_key   text
)
language sql security invoker stable as $$
  with norm as (
    select
      public._norm_text(p_nome)        as nome_n,
      public._norm_handle(p_instagram) as ig_n,
      public._norm_phone(p_whatsapp)   as wa_n,
      public._norm_email(p_email)      as email_n,
      public._norm_site(p_site)        as site_n
  ),
  by_experience as (
    select
      'experience'::text as source,
      'name'::text       as match_reason,
      e.id::text         as ref_id,
      e.fornecedor_nome  as ref_nome,
      public._norm_text(e.fornecedor_nome) as fornecedor_key
    from public.experiences e, norm n
    where n.nome_n is not null
      and e.fornecedor_nome is not null
      and coalesce(e.is_active, true) = true
      and coalesce(e.is_test, false) = false
      and public._norm_text(e.fornecedor_nome) = n.nome_n
  ),
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
        fm.id::text        as ref_id,
        fm.fornecedor_nome as ref_nome,
        fm.fornecedor_key
      from public.fornecedores_metadata fm, norm n
      where (n.nome_n  is not null and public._norm_text(fm.fornecedor_nome) = n.nome_n)
         or (n.ig_n    is not null and public._norm_handle(fm.instagram)     = n.ig_n)
         or (n.wa_n    is not null and public._norm_phone(fm.whatsapp)       = n.wa_n)
         or (n.email_n is not null and public._norm_email(fm.email)          = n.email_n)
         or (n.site_n  is not null and public._norm_site(fm.site)            = n.site_n)
    ) m where match_reason is not null
  ),
  by_prospect as (
    select * from (
      select
        'prospect'::text as source,
        case
          when n.nome_n  is not null and public._norm_text(pr.nome)        = n.nome_n  then 'name'
          when n.ig_n    is not null and public._norm_handle(pr.instagram) = n.ig_n    then 'instagram'
          when n.wa_n    is not null and public._norm_phone(pr.whatsapp)   = n.wa_n    then 'whatsapp'
          when n.email_n is not null and public._norm_email(pr.email)      = n.email_n then 'email'
          when n.site_n  is not null and public._norm_site(pr.site)        = n.site_n  then 'site'
        end as match_reason,
        pr.id::text                as ref_id,
        pr.nome                    as ref_nome,
        public._norm_text(pr.nome) as fornecedor_key
      from public.prospects pr, norm n
      where (p_exclude_prospect_id is null or pr.id <> p_exclude_prospect_id)
        and ((n.nome_n  is not null and public._norm_text(pr.nome)        = n.nome_n)
          or (n.ig_n    is not null and public._norm_handle(pr.instagram) = n.ig_n)
          or (n.wa_n    is not null and public._norm_phone(pr.whatsapp)   = n.wa_n)
          or (n.email_n is not null and public._norm_email(pr.email)      = n.email_n)
          or (n.site_n  is not null and public._norm_site(pr.site)        = n.site_n))
    ) m where match_reason is not null
  )
  select * from by_experience
  union all
  select * from by_metadata
  union all
  select * from by_prospect;
$$;

grant execute on function public.find_matching_fornecedor(text, text, text, text, text, uuid)
  to authenticated, service_role;


-- =============================================================
-- 8) RPC: promote_prospect_to_fornecedor
-- =============================================================
-- Promove um prospect a fornecedor cadastrado em fornecedores_metadata,
-- marca status='parceria_fechada' e loga interação. Qualifica todas
-- as referências a `fornecedor_key` com alias da tabela pra evitar
-- ambiguidade com o OUT parameter homônimo de RETURNS TABLE.
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
language plpgsql security invoker as $$
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

  select exists(
    select 1 from public.fornecedores_metadata fm where fm.fornecedor_key = v_key
  ) into v_existed;

  insert into public.fornecedores_metadata (
    fornecedor_key, fornecedor_nome, data_entrada,
    whatsapp, email, instagram, site, observacoes, prospect_id
  ) values (
    v_key, v_prospect.nome, current_date,
    v_prospect.whatsapp, v_prospect.email, v_prospect.instagram,
    v_prospect.site, v_prospect.observacoes, p_prospect_id
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

  update public.prospects p
     set status                    = 'parceria_fechada',
         promoted_to_fornecedor_at = now(),
         promoted_supplier_key     = v_key
   where p.id = p_prospect_id;

  insert into public.prospect_interactions (prospect_id, tipo, descricao)
  values (
    p_prospect_id, 'parceria_fechada',
    case when v_existed
         then 'Vinculado a fornecedor já existente.'
         else 'Promovido a fornecedor cadastrado.'
    end
  );

  return query select
    true, v_key, v_prospect.nome, v_existed,
    case when v_existed
         then 'Já existia como fornecedor — vínculo atualizado e prospect marcado como parceria fechada.'
         else 'Promovido com sucesso. Confira a aba Fornecedores.'
    end;
end;
$$;

grant execute on function public.promote_prospect_to_fornecedor(uuid)
  to authenticated, service_role;


-- =============================================================
-- 9) RPC: log_prospect_interaction (helper que avança o pipeline)
-- =============================================================
create or replace function public.log_prospect_interaction(
  p_prospect_id uuid,
  p_tipo        text,
  p_descricao   text default null,
  p_occurred_at timestamptz default null
)
returns uuid language plpgsql security invoker as $$
declare
  v_id uuid;
  v_new_status text;
begin
  insert into public.prospect_interactions (prospect_id, tipo, descricao, occurred_at)
  values (p_prospect_id, p_tipo, nullif(trim(p_descricao), ''), coalesce(p_occurred_at, now()))
  returning id into v_id;

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
       and case status
             when 'parceria_fechada' then false
             when 'recusou'          then v_new_status in ('parceria_fechada')
             when 'reuniao_marcada'  then v_new_status in ('parceria_fechada', 'recusou')
             when 'respondeu'        then v_new_status in ('reuniao_marcada', 'parceria_fechada', 'recusou')
             when 'mensagem_enviada' then v_new_status in ('respondeu', 'reuniao_marcada', 'parceria_fechada', 'recusou')
             else true
           end;
  end if;

  return v_id;
end;
$$;

grant execute on function public.log_prospect_interaction(uuid, text, text, timestamptz)
  to authenticated, service_role;


-- =============================================================
-- 10) Backfill: marca prospects que já são parceiros (CTE)
-- =============================================================
-- LATERAL no FROM de um UPDATE não pode referenciar a target table do
-- próprio UPDATE (Postgres 42P10). Por isso o LATERAL vive num CTE
-- onde `prospects` é só uma fonte qualquer; o UPDATE final junta por id.
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


-- =============================================================
-- 11) Seeds de templates (10 templates, idempotente por nome)
-- =============================================================
-- Padrão geral (default global)
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Padrão geral', null::text,
E'Oi! Tudo bem?\n\nSou fundadora da Elarah, uma plataforma de experiências offline em São Paulo. Conheci o trabalho de {{nome}} e acredito que faria muito sentido termos uma parceria — a Elarah já é referência pra quem busca experiências de {{categoria}} aqui em SP.\n\nPosso te mandar mais detalhes sobre como funciona a parceria? Sem qualquer compromisso.\n\nObrigada!',
true, 0, true
where not exists (select 1 from public.prospect_templates where nome = 'Padrão geral');

-- Primeiro contato — WhatsApp
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Primeiro contato — WhatsApp', null::text,
E'Oi {{nome}}, aqui é a [seu nome] da Elarah.\n\nA gente cura uma plataforma de experiências autorais em SP — e {{nome}} é exatamente o tipo de ateliê que aparece quando alguém procura {{categoria}} de verdade.\n\nFaria sentido a gente trocar uma ideia rápida sobre uma parceria? Te conto em 2-3 mensagens, sem rodeio.',
false, 10, true
where not exists (select 1 from public.prospect_templates where nome = 'Primeiro contato — WhatsApp');

-- Primeiro contato — DM Instagram
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Primeiro contato — DM Instagram', null::text,
E'Oi {{nome}}, há um tempo acompanho vocês por aqui e o trabalho de {{categoria}} de vocês é um dos que dá vontade de levar pra quem busca experiência autoral em SP.\n\nFaço a curadoria da Elarah — plataforma de experiências em São Paulo. Sou bem seletiva com quem entra, e {{nome}} encaixa muito.\n\nSe fizer sentido, te chamo no WhatsApp em 2-3 linhas e te explico como pensei a parceria. Manda seu número?',
false, 11, true
where not exists (select 1 from public.prospect_templates where nome = 'Primeiro contato — DM Instagram');

-- Primeiro contato — E-mail
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Primeiro contato — E-mail', null::text,
E'Assunto: Conversa rápida — Elarah e {{nome}}\n\nOi {{nome}}, tudo bem?\n\nSou a [seu nome], curadora da Elarah — plataforma de experiências autorais em São Paulo. A Elarah é uma curadoria seletiva por desenho, e {{nome}} está entre os perfis mais alinhados com o que a gente entrega em {{categoria}}.\n\nAcompanho o trabalho de vocês há um tempo. Queria propor uma conversa curta — 10-15 minutos — sobre como uma parceria poderia funcionar. Sem compromisso, é mais pra você sentir se faz sentido pro momento de vocês.\n\nSe topar, me responde com dois horários que ficariam bons pra você na semana que vem — eu confirmo um.\n\nUm abraço,\n[seu nome]\nWhatsApp: [seu número]\nelarah.com.br',
false, 12, true
where not exists (select 1 from public.prospect_templates where nome = 'Primeiro contato — E-mail');

-- Follow-up 1
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Follow-up 1 — 3 a 5 dias (leve)', null::text,
E'Oi, {{nome}}! Tudo bem?\n\nMandei uma mensagem por aqui esses dias falando da Elarah e queria só dar um up — sem pressão. Sei que a rotina é corrida, principalmente em {{categoria}}.\n\nSe fizer sentido conversar, qualquer dia dessa semana eu consigo dar um pulo aí no {{bairro}} ou marcar um café virtual. Se não for o momento, também me avisa que aí volto a falar mais pra frente.\n\nUm abraço!',
false, 20, true
where not exists (select 1 from public.prospect_templates where nome = 'Follow-up 1 — 3 a 5 dias (leve)');

-- Follow-up 2
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Follow-up 2 — 1 a 2 semanas (com convite)', null::text,
E'Oi, {{nome}}! Volto aqui rapidinho.\n\nEstou montando a curadoria da Elarah pros próximos meses e o seu trabalho em {{categoria}} continua sendo uma referência que eu quero muito ter na plataforma.\n\nTopa marcar 15 minutos esta semana pra eu te contar como funciona a parceria? Promete ser objetivo — se não for pra você, sem problema nenhum.\n\nPosso te ligar ou ir aí no {{bairro}}, o que for mais fácil.\n\nAbraço!',
false, 21, true
where not exists (select 1 from public.prospect_templates where nome = 'Follow-up 2 — 1 a 2 semanas (com convite)');

-- Follow-up 3
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select 'Follow-up 3 — porta aberta (3+ semanas)', null::text,
E'Oi, {{nome}}!\n\nSei que mandei algumas mensagens por aqui e talvez não seja o momento — sem nenhum problema. Só queria deixar registrado que a Elarah segue interessada em parceria com o seu trabalho em {{categoria}}, e qualquer hora que fizer sentido, é só responder esta conversa.\n\nSe preferir, também consigo te mandar um material por email pra você ler com calma quando quiser. Me avisa.\n\nUm abraço grande,\nElarah',
false, 22, true
where not exists (select 1 from public.prospect_templates where nome = 'Follow-up 3 — porta aberta (3+ semanas)');


-- =============================================================
-- 12) PostgREST: recarrega o schema (libera as RPCs pelo client)
-- =============================================================
notify pgrst, 'reload schema';


-- =============================================================
-- FIM — confirmação de sucesso
-- =============================================================
select 'OK — setup concluído.'::text as status,
       (select count(*) from public.prospect_templates) as templates_total,
       (select count(*) from public.prospects)          as prospects_total;
