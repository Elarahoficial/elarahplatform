-- =========================================================
-- ELARAH — Renomear fornecedores (set/2026)
--
--   "Nata Manchon"   →  "Naia Cerâmica"
--   "Mariana Kuntz"  →  "Corpo Contato"
--
-- =========================================================
-- Rode UMA vez no SQL Editor do Supabase. É idempotente: no
-- segundo run ele não acha mais o nome antigo e não faz nada.
--
-- O nome do fornecedor não mora num lugar só — ele é copiado
-- (snapshot) pra dentro de cada reserva, venda e despesa, pra
-- que o histórico não mude quando um cadastro muda. Por isso o
-- rename precisa passar em SETE lugares; se esquecer um, o
-- fornecedor aparece duas vezes no painel, com o dinheiro
-- dividido entre os dois nomes:
--
--   1. experiences.fornecedor_nome            (modelo legado, 1 fornecedor)
--   2. experience_suppliers.fornecedor_nome   (modelo multi-fornecedor)
--   3. bookings.fornecedor_nome               (snapshot por reserva)
--   4. bookings.repasses[].fornecedor_nome    (split multi-fornecedor, JSONB)
--   5. fornecedores_metadata (nome + key)     (a ficha do parceiro)
--   6. manual_sales.supplier_name/key         (vendas manuais)
--   7. financial_expenses.supplier_name/key   (despesas)
--
-- (O irmão mais velho deste arquivo,
--  elarah_rename_fornecedor_a_gastronomica.sql, cobria só seis:
--  experience_suppliers ficou de fora. Aqui entra.)
--
-- Pra renomear outro fornecedor no futuro, é só trocar os pares
-- na lista logo abaixo e rodar de novo — o resto do arquivo não
-- precisa mudar.
-- =========================================================

begin;

do $$
declare
  r        record;
  chave_antiga text;
  chave_nova   text;
  v_old_id uuid;
  v_new_id uuid;
  v_old_obs  text;
  v_old_data date;
begin
  for r in
    -- ===== TROQUE AQUI PRA RENOMEAR OUTROS =====
    -- (nome como está hoje, nome novo)
    select * from (values
      ('Nata Manchon',  'Naia Cerâmica'),
      ('Mariana Kuntz', 'Corpo Contato')
    ) as t(nome_antigo, nome_novo)
  loop
    -- Mesma normalização que o painel usa em fornecedorKey():
    -- minúsculas, sem espaço sobrando.
    chave_antiga := regexp_replace(lower(trim(r.nome_antigo)), '\s+', ' ', 'g');
    chave_nova   := regexp_replace(lower(trim(r.nome_novo)),   '\s+', ' ', 'g');

    -- 1) Experiências (modelo legado de 1 fornecedor)
    update public.experiences
       set fornecedor_nome = r.nome_novo
     where regexp_replace(lower(trim(fornecedor_nome)), '\s+', ' ', 'g') = chave_antiga;

    -- 2) Mapa multi-fornecedor por experiência
    update public.experience_suppliers
       set fornecedor_nome = r.nome_novo
     where regexp_replace(lower(trim(fornecedor_nome)), '\s+', ' ', 'g') = chave_antiga;

    -- 3) Reservas (coluna snapshot). Inclui as pendentes: o repasse
    --    a pagar é calculado em cima dessa coluna, então renomear
    --    aqui já arruma "Repasses pendentes por fornecedor".
    update public.bookings
       set fornecedor_nome = r.nome_novo
     where regexp_replace(lower(trim(fornecedor_nome)), '\s+', ' ', 'g') = chave_antiga;

    -- 4) Reservas com split multi-fornecedor: cada parte é um
    --    elemento de um array JSONB, e o RPC financial_by_supplier
    --    lê o nome de DENTRO do array — não só da coluna acima.
    update public.bookings
       set repasses = (
         select jsonb_agg(
           case
             when regexp_replace(lower(trim(coalesce(elem->>'fornecedor_nome',''))), '\s+', ' ', 'g') = chave_antiga
               then jsonb_set(elem, '{fornecedor_nome}', to_jsonb(r.nome_novo))
             else elem
           end
         )
         from jsonb_array_elements(repasses) elem
       )
     where repasses is not null
       and jsonb_typeof(repasses) = 'array'
       and exists (
         select 1 from jsonb_array_elements(repasses) elem
         where regexp_replace(lower(trim(coalesce(elem->>'fornecedor_nome',''))), '\s+', ' ', 'g') = chave_antiga
       );

    -- 5) Ficha do parceiro (fornecedores_metadata): nome bonito + key.
    --    Se já existir uma ficha com o nome NOVO, funde as duas em vez
    --    de estourar o unique da key — e não perde observação nem a
    --    data de entrada mais antiga.
    select id, observacoes, data_entrada
      into v_old_id, v_old_obs, v_old_data
      from public.fornecedores_metadata
     where fornecedor_key = chave_antiga
     limit 1;

    if v_old_id is not null then
      select id into v_new_id
        from public.fornecedores_metadata
       where fornecedor_key = chave_nova
       limit 1;

      if v_new_id is null then
        update public.fornecedores_metadata
           set fornecedor_key  = chave_nova,
               fornecedor_nome = r.nome_novo,
               updated_at      = now()
         where id = v_old_id;
      else
        update public.fornecedores_metadata
           set data_entrada = least(coalesce(data_entrada, v_old_data), coalesce(v_old_data, data_entrada)),
               observacoes  = case
                 when coalesce(observacoes, '') = '' then v_old_obs
                 when coalesce(v_old_obs, '')  = '' then observacoes
                 when observacoes = v_old_obs       then observacoes
                 else observacoes || E'\n---\n' || v_old_obs
               end,
               updated_at = now()
         where id = v_new_id;

        delete from public.fornecedores_metadata where id = v_old_id;
      end if;

      v_old_id := null;
      v_new_id := null;
    end if;

    -- 6) Vendas manuais
    update public.manual_sales
       set supplier_name = r.nome_novo,
           supplier_key  = chave_nova
     where regexp_replace(lower(trim(coalesce(supplier_name, ''))), '\s+', ' ', 'g') = chave_antiga
        or supplier_key = chave_antiga;

    -- 7) Despesas
    update public.financial_expenses
       set supplier_name = r.nome_novo,
           supplier_key  = chave_nova
     where regexp_replace(lower(trim(coalesce(supplier_name, ''))), '\s+', ' ', 'g') = chave_antiga
        or supplier_key = chave_antiga;

    raise notice 'Renomeado: % → %', r.nome_antigo, r.nome_novo;
  end loop;
end $$;

commit;


-- =========================================================
-- CONFERÊNCIA — esperado: zero em todas as linhas.
-- Se sobrar algum número, me mande esta tabela.
-- =========================================================
with antigos as (
  select unnest(array['nata manchon', 'mariana kuntz']) as chave
)
select 'experiences' as tabela, count(*) as sobrou
  from public.experiences e, antigos a
 where regexp_replace(lower(trim(e.fornecedor_nome)), '\s+', ' ', 'g') = a.chave
union all
select 'experience_suppliers', count(*)
  from public.experience_suppliers s, antigos a
 where regexp_replace(lower(trim(s.fornecedor_nome)), '\s+', ' ', 'g') = a.chave
union all
select 'bookings.fornecedor_nome', count(*)
  from public.bookings b, antigos a
 where regexp_replace(lower(trim(b.fornecedor_nome)), '\s+', ' ', 'g') = a.chave
union all
select 'bookings.repasses[]', count(*)
  from public.bookings b
 where b.repasses is not null
   and jsonb_typeof(b.repasses) = 'array'
   and exists (
     select 1 from jsonb_array_elements(b.repasses) elem, antigos a
     where regexp_replace(lower(trim(coalesce(elem->>'fornecedor_nome',''))), '\s+', ' ', 'g') = a.chave
   )
union all
select 'fornecedores_metadata', count(*)
  from public.fornecedores_metadata m, antigos a
 where m.fornecedor_key = a.chave
union all
select 'manual_sales', count(*)
  from public.manual_sales ms, antigos a
 where regexp_replace(lower(trim(coalesce(ms.supplier_name, ''))), '\s+', ' ', 'g') = a.chave
    or ms.supplier_key = a.chave
union all
select 'financial_expenses', count(*)
  from public.financial_expenses fe, antigos a
 where regexp_replace(lower(trim(coalesce(fe.supplier_name, ''))), '\s+', ' ', 'g') = a.chave
    or fe.supplier_key = a.chave;


-- =========================================================
-- E os nomes novos, quantas linhas têm?
-- Serve pra confirmar que o dinheiro foi junto com o nome.
-- =========================================================
with novos as (
  select unnest(array['naia cerâmica', 'corpo contato']) as chave
)
select n.chave as fornecedor,
       (select count(*) from public.experiences e
         where regexp_replace(lower(trim(e.fornecedor_nome)), '\s+', ' ', 'g') = n.chave)      as experiencias,
       (select count(*) from public.bookings b
         where regexp_replace(lower(trim(b.fornecedor_nome)), '\s+', ' ', 'g') = n.chave)      as reservas,
       (select count(*) from public.manual_sales ms
         where ms.supplier_key = n.chave)                                                      as vendas_manuais
  from novos n;
