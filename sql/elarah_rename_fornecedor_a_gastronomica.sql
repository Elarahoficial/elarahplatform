-- =========================================================
-- ELARAH — Renomear fornecedor "A Gastronomica" → "Accademia Gastronomica"
-- =========================================================
-- One-shot. Idempotente: rodar várias vezes não causa efeito
-- colateral (busca pelo nome antigo, não acha mais nada no segundo
-- run). Cobre os 3 lugares onde o nome aparece:
--
--   1. experiences.fornecedor_nome
--   2. bookings.fornecedor_nome (snapshot por reserva)
--   3. fornecedores_metadata.fornecedor_nome + fornecedor_key
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

-- 2) Bookings (incluindo pendentes — repasse pendente é cálculo
--    em cima dessa coluna, então renomear aqui já corrige o
--    painel de "Repasses pendentes por fornecedor").
update public.bookings
   set fornecedor_nome = 'Accademia Gastronomica'
 where lower(trim(fornecedor_nome)) = 'a gastronomica';

-- 3) Metadata: nome bonito + key normalizada (lowercased).
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

-- Diagnóstico final: quantas linhas ainda têm o nome antigo?
-- Esperado: zero em todos os três.
select 'experiences'        as tabela, count(*) as remanescentes
  from public.experiences
 where lower(trim(fornecedor_nome)) = 'a gastronomica'
union all
select 'bookings'            as tabela, count(*)
  from public.bookings
 where lower(trim(fornecedor_nome)) = 'a gastronomica'
union all
select 'fornecedores_metadata' as tabela, count(*)
  from public.fornecedores_metadata
 where fornecedor_key = 'a gastronomica';

commit;
