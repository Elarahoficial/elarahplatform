-- =============================================================
-- ELARAH — CRM hotfix v4: corrige DE VEZ promote_prospect_to_fornecedor
-- -------------------------------------------------------------
-- Sintoma (produção): clicar "Promover a fornecedor" retorna
--   "Erro: column reference 'fornecedor_key' is ambiguous".
--
-- Causa raiz: a função declara OUT parameters via RETURNS TABLE com
-- os nomes `fornecedor_key` e `fornecedor_nome` — exatamente iguais a
-- colunas de public.fornecedores_metadata. Em PL/pgSQL, esses OUT
-- params viram variáveis no escopo da função; qualquer referência a
-- `fornecedor_key` (em especial o INFERENCE do ON CONFLICT, que NÃO
-- aceita prefixo de tabela) fica ambígua entre a variável e a coluna.
-- O hotfix v3 qualificou referências, mas não dá pra qualificar o
-- alvo do ON CONFLICT — então o conflito sobrevivia.
--
-- Correção definitiva: RENOMEAR os OUT params que colidem
--   fornecedor_key  -> out_fornecedor_key
--   fornecedor_nome -> out_fornecedor_nome
-- Sem variável homônima, o nome `fornecedor_key` passa a se referir
-- inequivocamente à COLUNA. Reforço com a diretiva
-- `#variable_conflict use_column` (cinto + suspensório).
--
-- Front-end não quebra: admin.js lê apenas row.ok e row.message
-- (os nomes renomeados não são consumidos no cliente).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

drop function if exists public.promote_prospect_to_fornecedor(uuid);

create or replace function public.promote_prospect_to_fornecedor(
  p_prospect_id uuid
)
returns table (
  ok                   boolean,
  out_fornecedor_key   text,
  out_fornecedor_nome  text,
  was_already_partner  boolean,
  message              text
)
language plpgsql
security invoker
as $$
#variable_conflict use_column
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
    select 1
      from public.fornecedores_metadata fm
     where fm.fornecedor_key = v_key
  ) into v_existed;

  -- Upsert em fornecedores_metadata. Como não há mais OUT param homônimo,
  -- `fornecedor_key` no ON CONFLICT é, sem ambiguidade, a coluna.
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

  update public.prospects p
     set status                    = 'parceria_fechada',
         promoted_to_fornecedor_at = now(),
         promoted_supplier_key     = v_key
   where p.id = p_prospect_id;

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
