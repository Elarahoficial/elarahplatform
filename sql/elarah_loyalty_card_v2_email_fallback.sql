-- =============================================================
-- ELARAH — Cartão Fidelidade v2 (fix de e-mail)
-- -------------------------------------------------------------
-- PROBLEMA CORRIGIDO:
--   O cartão fidelidade mostrava ZERO carimbos para clientes que
--   tinham compras pagas, quando o e-mail em public.profiles estava
--   vazio ou divergente do e-mail das compras.
--
--   A versão anterior de sync_loyalty_card() lia o e-mail SÓ de
--   public.profiles. Se esse campo estivesse nulo (conta criada por
--   um caminho que não preencheu o e-mail), a função não casava
--   NENHUMA compra (nem reserva, nem venda manual, nem gift card) e
--   retornava 0 — mesmo com compras existindo no e-mail da pessoa.
--
-- O QUE MUDA:
--   Agora o e-mail é resolvido com fallback:
--     profiles.email  →  (se vazio)  auth.users.email
--   auth.users.email está SEMPRE preenchido (é o e-mail do login),
--   então a contagem deixa de depender do profiles.email. A função é
--   SECURITY DEFINER, então pode ler auth.users com segurança.
--
-- Continua contando os 3 tipos de compra paga:
--   1) Reservas        → bookings.status = 'pago' (por user_id OU e-mail)
--   2) Gift cards      → comprados/pagos pela pessoa (user_id OU e-mail)
--   3) Vendas manuais  → manual_sales.payment_status = 'pago' (por e-mail)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar. Não duplica cupons.
-- Rode UMA vez no SQL Editor do Supabase.
-- =============================================================

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

  -- Resolve o e-mail com fallback: profiles.email e, se vazio, o
  -- e-mail do login (auth.users.email). É o ponto-chave do fix —
  -- antes dependia só de profiles.email, que podia estar nulo.
  select nullif(lower(trim(coalesce(p.email, u.email))), '')
    into v_email
    from auth.users u
    left join public.profiles p on p.id = u.id
   where u.id = v_uid;

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
  --    vínculo é só pelo e-mail.
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

-- =============================================================
-- DIAGNÓSTICO (opcional) — rode pra ver o que o sistema enxerga
-- de uma cliente específica. Troque o e-mail abaixo.
-- É só leitura, não altera nada.
-- =============================================================
-- select
--   u.id                                   as user_id,
--   u.email                                as email_login,
--   p.email                                as email_profile,
--   (select count(*) from public.bookings b
--      where b.status = 'pago'
--        and (b.user_id = u.id
--             or lower(trim(coalesce(b.email,''))) = lower(u.email)))   as reservas_pagas,
--   (select count(*) from public.manual_sales m
--      where m.payment_status = 'pago'
--        and lower(trim(coalesce(m.customer_email,''))) = lower(u.email)) as vendas_manuais_pagas
-- from auth.users u
-- left join public.profiles p on p.id = u.id
-- where u.email ilike 'liviaelk@gmail.com';
