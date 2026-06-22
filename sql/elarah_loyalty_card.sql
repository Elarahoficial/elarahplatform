-- =============================================================
-- ELARAH — Cartão Fidelidade (loyalty card)
-- -------------------------------------------------------------
-- Programa de fidelidade por e-mail/conta:
--   * A cada 10 compras PAGAS, o cliente ganha 1 cupom de 20% OFF
--     em qualquer experiência (uso único, validade de 90 dias).
--   * Programa contínuo: ganha de novo a cada novo bloco de 10
--     (10, 20, 30 ...).
--
-- O que conta como "compra paga":
--   1) Reservas de experiência  → bookings.status = 'pago'
--   2) Gift cards COMPRADOS pela pessoa (com valor) →
--      gift_cards.status in ('active','used','expired') e o usuário
--      é o comprador (user_id ou e-mail). Gift cards 'pending'
--      (não pago) e 'cancelled' (falhou) NÃO contam.
--   3) Vendas manuais pagas (WhatsApp/Pix/dinheiro) →
--      manual_sales.payment_status = 'pago' registradas com o
--      e-mail da cliente.
--
-- Por que reaproveitar a tabela `coupons` (em vez de uma nova)?
--   O sistema de cupons já existe e já está plugado no checkout
--   (preview_coupon / hold_coupon / register_coupon_use). Um cupom
--   de fidelidade é só um cupom percentual de uso único, marcado
--   com metadata.loyalty=true e o user_id de quem ganhou.
--
-- Segurança:
--   sync_loyalty_card() roda como SECURITY DEFINER (ignora RLS),
--   mas SEMPRE usa auth.uid() pra identificar o usuário e contar
--   apenas as compras DELE — o cliente não consegue inflar a
--   contagem nem emitir cupom pra outra pessoa.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar. Chamar a RPC
-- várias vezes não duplica cupons (compara cupons já emitidos com
-- os blocos de 10 completados).
-- =============================================================

-- =========================================================
-- RPC: sync_loyalty_card()
-- -------------------------------------------------------------
-- Conta as compras pagas do usuário logado, emite os cupons de
-- fidelidade que ele tem direito (e que ainda não foram emitidos)
-- e devolve o estado completo do cartão como jsonb.
--
-- Retorno (jsonb):
--   {
--     "total_paid":       int,   -- total de compras pagas
--     "experiences_paid": int,
--     "giftcards_paid":   int,
--     "goal":             10,
--     "stamps":           int,   -- carimbos no cartão atual (0..10)
--     "rewards_total":    int,   -- nº de prêmios já conquistados
--     "coupons": [               -- cupons de fidelidade do usuário
--       { "code", "discount_value", "valid_until",
--         "expired": bool, "used": bool }
--     ]
--   }
-- =========================================================
create or replace function public.sync_loyalty_card()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_email        text;
  v_exp          integer := 0;
  v_gift         integer := 0;
  v_manual       integer := 0;
  v_total        integer := 0;
  v_goal         constant integer := 10;
  v_due          integer := 0;   -- blocos de 10 completados
  v_existing     integer := 0;   -- cupons de fidelidade já emitidos
  v_to_issue     integer := 0;
  v_code         text;
  v_stamps       integer := 0;
  v_coupons      jsonb;
  i              integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select nullif(lower(trim(email)), '') into v_email
    from public.profiles where id = v_uid;

  -- 1) Experiências pagas (reservas). Conta por user_id E por e-mail
  --    cadastrado — cobre compras feitas como convidado (user_id nulo)
  --    com o mesmo e-mail antes de logar.
  select count(*) into v_exp
    from public.bookings
   where status = 'pago'
     and (
           user_id = v_uid
           or (v_email is not null
               and lower(trim(coalesce(email, ''))) = v_email)
         );

  -- 2) Gift cards comprados e pagos pela própria pessoa.
  select count(*) into v_gift
    from public.gift_cards
   where status in ('active', 'used', 'expired')
     and (
           comprador_user_id = v_uid
           or (v_email is not null
               and lower(trim(coalesce(comprador_email, ''))) = v_email)
         );

  -- 3) Vendas manuais pagas registradas com o e-mail da cliente.
  --    manual_sales é snapshot (não tem user_id de cliente), então o
  --    vínculo é só pelo e-mail cadastrado.
  select count(*) into v_manual
    from public.manual_sales
   where payment_status = 'pago'
     and v_email is not null
     and lower(trim(coalesce(customer_email, ''))) = v_email;

  v_total := coalesce(v_exp, 0) + coalesce(v_gift, 0) + coalesce(v_manual, 0);
  v_due   := floor(v_total / v_goal);

  -- Quantos cupons de fidelidade já foram emitidos pra este usuário.
  select count(*) into v_existing
    from public.coupons
   where (metadata->>'loyalty') = 'true'
     and (metadata->>'user_id') = v_uid::text;

  v_to_issue := v_due - v_existing;

  -- Emite os cupons devidos (um por bloco de 10 ainda não premiado).
  if v_to_issue > 0 then
    for i in 1..v_to_issue loop
      -- Gera código único (FIEL + 6 chars). Loop protege contra
      -- colisão improvável.
      loop
        v_code := 'FIEL' ||
                  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
        exit when not exists (
          select 1 from public.coupons where upper(code) = upper(v_code)
        );
      end loop;

      insert into public.coupons (
        code, nome, descricao,
        discount_type, discount_value,
        valid_from, valid_until,
        max_uses, is_active, created_by, metadata
      ) values (
        v_code,
        'Cartão Fidelidade Elarah',
        'Recompensa de fidelidade — 20% OFF em qualquer experiência.',
        'percent', 20,
        now(), now() + interval '90 days',
        1, true, v_uid,
        jsonb_build_object(
          'loyalty', true,
          'user_id', v_uid::text,
          'email', v_email,
          'block', v_existing + i
        )
      );
    end loop;
  end if;

  -- Carimbos no cartão atual: resto da divisão por 10. Quando o total
  -- é múltiplo exato de 10 (e > 0) o cartão acabou de fechar — mostra
  -- ele cheio (10) antes de zerar visualmente na próxima compra.
  v_stamps := v_total - (v_due * v_goal);
  if v_stamps = 0 and v_total > 0 then
    v_stamps := v_goal;
  end if;

  -- Monta a lista de cupons de fidelidade do usuário (mais novos no topo).
  select coalesce(jsonb_agg(sub.c order by sub.created_at desc), '[]'::jsonb)
    into v_coupons
  from (
    select
      jsonb_build_object(
        'code', code,
        'discount_value', discount_value,
        'valid_until', valid_until,
        'expired', (now() > valid_until),
        'used', (not is_active)
                or (max_uses is not null and times_used >= max_uses)
      ) as c,
      created_at
    from public.coupons
    where (metadata->>'loyalty') = 'true'
      and (metadata->>'user_id') = v_uid::text
  ) sub;

  return jsonb_build_object(
    'total_paid',       v_total,
    'experiences_paid', coalesce(v_exp, 0),
    'giftcards_paid',   coalesce(v_gift, 0),
    'manual_paid',      coalesce(v_manual, 0),
    'goal',             v_goal,
    'stamps',           v_stamps,
    'rewards_total',    v_due,
    'coupons',          v_coupons
  );
end;
$$;

grant execute on function public.sync_loyalty_card() to authenticated;

-- Refresh do cache do PostgREST pra a RPC aparecer na API REST.
notify pgrst, 'reload schema';
