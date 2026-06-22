-- =============================================================
-- ELARAH — Vendas manuais visíveis pra própria cliente
-- -------------------------------------------------------------
-- A tabela manual_sales tem RLS admin-only (a cliente não pode
-- ler direto). Mas pra que a venda manual apareça na aba
-- "Minhas compras" da conta, a cliente precisa enxergar as
-- vendas registradas com o e-mail dela.
--
-- Solução: RPC SECURITY DEFINER que devolve SOMENTE as vendas
-- manuais cujo customer_email == e-mail cadastrado do usuário
-- logado (auth.uid()). A cliente nunca vê venda de outra pessoa,
-- e campos internos (repasse a fornecedor, notas, etc.) não são
-- expostos — só o que interessa pra ela ver a própria compra.
--
-- IDEMPOTENTE — create or replace.
-- =============================================================

create or replace function public.get_my_manual_sales()
returns table(
  id               uuid,
  experiencia_nome text,
  slot_date        date,
  horario          text,
  quantidade       integer,
  amount_total     integer,
  payment_status   text,
  created_at       timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    return;
  end if;

  -- Qualifica com alias p.* — a função tem uma coluna de retorno
  -- chamada "id" (RETURNS TABLE), então "where id = v_uid" sem
  -- qualificar fica ambíguo e quebra a função em runtime.
  select nullif(lower(trim(p.email)), '') into v_email
    from public.profiles p where p.id = v_uid;

  if v_email is null then
    return;
  end if;

  return query
    select
      ms.id,
      ms.experience_name,
      ms.slot_date,
      ms.slot_time,
      ms.quantity,
      ms.total_amount_centavos,
      ms.payment_status,
      ms.created_at
    from public.manual_sales ms
    where lower(trim(coalesce(ms.customer_email, ''))) = v_email
    order by ms.created_at desc;
end;
$$;

grant execute on function public.get_my_manual_sales() to authenticated;

notify pgrst, 'reload schema';
