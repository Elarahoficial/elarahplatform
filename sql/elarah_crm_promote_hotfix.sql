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
