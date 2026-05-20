-- =========================================================
-- ELARAH — Renomear fornecedor "A Gastronomica" → "Accademia Gastronomica"
-- =========================================================
-- One-shot. Idempotente: rodar várias vezes não causa efeito
-- colateral (busca pelo nome antigo, não acha mais nada no segundo
-- run). Cobre os 6 lugares onde o nome aparece:
--
--   1. experiences.fornecedor_nome
--   2. bookings.fornecedor_nome (snapshot por reserva)
--   3. bookings.repasses[].fornecedor_nome (multi-fornecedor — o RPC
--      financial_by_supplier lê de dentro desse JSONB array)
--   4. fornecedores_metadata.fornecedor_nome + fornecedor_key
--   5. manual_sales.supplier_name + supplier_key (vendas manuais)
--   6. financial_expenses.supplier_name + supplier_key (despesas)
--
-- A comparação é case/whitespace-tolerante (trim + lower).
-- Rode no SQL Editor do Supabase. Confira os COUNTS no fim
-- pra validar que bateu o número esperado.
-- =========================================================

begin;

-- 1) Experiências
update public.experiences
   set fornecedor_nome = 'Accademia Gastronomica'
 where lower(trim(fornecedor_nome)) = 'a gastronomica';

-- 2) Bookings (coluna snapshot — incluindo pendentes; repasse pendente
--    é cálculo em cima dessa coluna, então renomear aqui já corrige o
--    painel de "Repasses pendentes por fornecedor").
update public.bookings
   set fornecedor_nome = 'Accademia Gastronomica'
 where lower(trim(fornecedor_nome)) = 'a gastronomica';

-- 3) Bookings.repasses — multi-fornecedor armazena cada split como
--    elemento de um JSONB array. O RPC financial_by_supplier lê
--    fornecedor_nome de dentro desses elementos (não só da coluna),
--    então sem renomear aqui o agregado continua aparecendo no nome
--    antigo.
update public.bookings
   set repasses = (
     select jsonb_agg(
       case
         when lower(trim(coalesce(elem->>'fornecedor_nome',''))) = 'a gastronomica'
           then jsonb_set(elem, '{fornecedor_nome}', '"Accademia Gastronomica"'::jsonb)
         else elem
       end
     )
     from jsonb_array_elements(repasses) elem
   )
 where repasses is not null
   and jsonb_typeof(repasses) = 'array'
   and exists (
     select 1 from jsonb_array_elements(repasses) elem
     where lower(trim(coalesce(elem->>'fornecedor_nome',''))) = 'a gastronomica'
   );

-- 4) Metadata: nome bonito + key normalizada (lowercased).
--    Se já existe linha pra "accademia gastronomica" (improvável,
--    mas seguro), faz merge das observações pra não perder dado.
do $$
declare
  v_old_id uuid;
  v_new_id uuid;
  v_old_obs text;
  v_old_data date;
begin
  -- Encontra a linha antiga (key da "A Gastronomica")
  select id, observacoes, data_entrada
    into v_old_id, v_old_obs, v_old_data
    from public.fornecedores_metadata
   where fornecedor_key = 'a gastronomica'
   limit 1;

  if v_old_id is null then
    return; -- nada pra fazer
  end if;

  -- Existe linha já com a key nova?
  select id into v_new_id
    from public.fornecedores_metadata
   where fornecedor_key = 'accademia gastronomica'
   limit 1;

  if v_new_id is null then
    -- Caso comum: só renomeia in-place (key + nome).
    update public.fornecedores_metadata
       set fornecedor_key  = 'accademia gastronomica',
           fornecedor_nome = 'Accademia Gastronomica',
           updated_at      = now()
     where id = v_old_id;
  else
    -- Caso raro: já existe Accademia. Faz merge: data_entrada
    -- mais antiga e concatena observações se necessário, depois
    -- deleta a linha velha.
    update public.fornecedores_metadata
       set data_entrada = least(coalesce(data_entrada, v_old_data), coalesce(v_old_data, data_entrada)),
           observacoes  = case
             when coalesce(observacoes, '') = '' then v_old_obs
             when coalesce(v_old_obs, '') = '' then observacoes
             when observacoes = v_old_obs then observacoes
             else observacoes || E'\n---\n' || v_old_obs
           end,
           updated_at = now()
     where id = v_new_id;

    delete from public.fornecedores_metadata where id = v_old_id;
  end if;
end $$;

-- 5) Vendas manuais (snapshot por venda — alimentam o RPC
--    financial_by_supplier diretamente).
update public.manual_sales
   set supplier_name = 'Accademia Gastronomica',
       supplier_key  = 'accademia gastronomica'
 where lower(trim(coalesce(supplier_name, ''))) = 'a gastronomica'
    or supplier_key = 'a gastronomica';

-- 6) Despesas financeiras (mesmo padrão: snapshot por despesa).
update public.financial_expenses
   set supplier_name = 'Accademia Gastronomica',
       supplier_key  = 'accademia gastronomica'
 where lower(trim(coalesce(supplier_name, ''))) = 'a gastronomica'
    or supplier_key = 'a gastronomica';

-- Diagnóstico final: quantas linhas ainda têm o nome antigo?
-- Esperado: zero em todos os seis.
select 'experiences'                         as tabela, count(*) as remanescentes
  from public.experiences
 where lower(trim(fornecedor_nome)) = 'a gastronomica'
union all
select 'bookings.fornecedor_nome'            as tabela, count(*)
  from public.bookings
 where lower(trim(fornecedor_nome)) = 'a gastronomica'
union all
select 'bookings.repasses[].fornecedor_nome' as tabela, count(*)
  from public.bookings
 where repasses is not null
   and jsonb_typeof(repasses) = 'array'
   and exists (
     select 1 from jsonb_array_elements(repasses) elem
     where lower(trim(coalesce(elem->>'fornecedor_nome',''))) = 'a gastronomica'
   )
union all
select 'fornecedores_metadata'               as tabela, count(*)
  from public.fornecedores_metadata
 where fornecedor_key = 'a gastronomica'
union all
select 'manual_sales'                        as tabela, count(*)
  from public.manual_sales
 where lower(trim(coalesce(supplier_name, ''))) = 'a gastronomica'
    or supplier_key = 'a gastronomica'
union all
select 'financial_expenses'                  as tabela, count(*)
  from public.financial_expenses
 where lower(trim(coalesce(supplier_name, ''))) = 'a gastronomica'
    or supplier_key = 'a gastronomica';

commit;
