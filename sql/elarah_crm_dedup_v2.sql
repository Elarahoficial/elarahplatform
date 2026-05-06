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
-- Roda 1x: pra cada prospect, se houver match em fornecedor_metadata
-- ou experience, marca como 'ja_parceiro' com snapshot da chave.
-- Não sobrescreve quem já está com status mais avançado.
--
-- Implementação em 2 passos via CTE: PostgreSQL não permite LATERAL
-- na FROM-clause de um UPDATE referenciando a tabela atualizada.
with matched as (
  select
    p.id              as prospect_id,
    m.fornecedor_key
  from public.prospects p,
       lateral (
         select fornecedor_key
         from public.find_matching_fornecedor(
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
       promoted_supplier_key     = matched.fornecedor_key
  from matched
 where p.id = matched.prospect_id;


notify pgrst, 'reload schema';
