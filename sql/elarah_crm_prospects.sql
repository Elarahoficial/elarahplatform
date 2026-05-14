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
