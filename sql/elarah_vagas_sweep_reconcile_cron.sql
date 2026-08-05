-- =============================================================
-- ELARAH — Vagas: varredura de pendentes abandonados + reconciliação
-- -------------------------------------------------------------
-- CAUSA RAIZ do "esgotou mas não esgotou":
--   Uma reserva SEGURA a vaga já em `pending` (no momento em que o
--   checkout é criado), não só quando paga. Se o cliente abandona o
--   carrinho (fecha a aba, não paga o PIX), a vaga fica presa PARA
--   SEMPRE — não existia nenhuma rotina que soltasse pendentes velhos.
--   Com `quantidade`, cada carrinho abandonado tranca N vagas. Resultado:
--   a experiência aparece ESGOTADA sem ninguém ter pago.
--
-- Esta migração cria:
--   1. expire_stale_pending_bookings(p_minutes): marca como `expirado`
--      as reservas `pending` mais velhas que p_minutes (default 60) e
--      devolve o saldo de gift card / uso de cupom que ficaram segurados.
--      OBS: se um PIX for pago DEPOIS (aprovação tardia), o webhook
--      re-ocupa a vaga automaticamente (reoccupyVagaOnReapproval), então
--      expirar cedo é seguro.
--   2. sweep_and_reconcile_vagas(): expira os pendentes E roda o
--      reconcile_all_vagas() (recomputo ABSOLUTO de vagas_restantes a
--      partir das reservas reais), curando qualquer desvio do contador
--      incremental (webhook que falhou, corrida, etc.).
--   3. Agenda tudo no pg_cron a cada 10 minutos.
--
-- Pré-requisitos (Database → Extensions): pg_cron ON.
-- Depende de: reconcile_all_vagas() (elarah_manual_sales_inventory.sql),
--   refund_gift_card()/refund_coupon() (elarah_extensions/elarah_coupons).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Como rodar: Supabase Dashboard → SQL Editor → cola → Run.
-- =============================================================

-- ===== 1. Expira pendentes abandonados e libera os holds =====
create or replace function public.expire_stale_pending_bookings(
  p_minutes integer default 60
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row   record;
  v_count integer := 0;
  v_min   integer := greatest(15, coalesce(p_minutes, 60)); -- nunca < 15min
begin
  for v_row in
    select id, gift_card_id, gift_card_centavos, coupon_id
      from public.bookings
     where status = 'pending'
       and created_at < (now() - make_interval(mins => v_min))
     for update skip locked
  loop
    -- Devolve o saldo do gift card segurado no checkout (mesma lógica do
    -- rollback de pagamento recusado). Best-effort: erro não trava a varredura.
    if v_row.gift_card_id is not null then
      begin
        perform public.refund_gift_card(
          v_row.gift_card_id, coalesce(v_row.gift_card_centavos, 0)
        );
      exception when others then
        raise notice 'refund_gift_card falhou p/ booking %: %', v_row.id, sqlerrm;
      end;
    end if;

    -- Devolve o uso de cupom segurado.
    if v_row.coupon_id is not null then
      begin
        perform public.refund_coupon(v_row.coupon_id);
      exception when others then
        raise notice 'refund_coupon falhou p/ booking %: %', v_row.id, sqlerrm;
      end;
    end if;

    update public.bookings
       set status = 'expirado'
     where id = v_row.id;

    v_count := v_count + 1;
  end loop;

  if v_count > 0 then
    raise notice 'expire_stale_pending_bookings: % reservas expiradas (> %min)', v_count, v_min;
  end if;
  return v_count;
end;
$$;

-- ===== 2. Varredura + reconciliação num passo só =====
create or replace function public.sweep_and_reconcile_vagas()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Primeiro solta os pendentes velhos (saem da contagem de ocupação)...
  perform public.expire_stale_pending_bookings(60);
  -- ...depois recomputa vagas_restantes ABSOLUTO a partir da verdade.
  perform public.reconcile_all_vagas();
end;
$$;

grant execute on function public.expire_stale_pending_bookings(integer) to service_role;
grant execute on function public.sweep_and_reconcile_vagas() to service_role;

-- ===== 3. Roda agora pra corrigir o estado atual de uma vez =====
select public.sweep_and_reconcile_vagas();

-- ===== 4. Agenda no pg_cron (a cada 10 minutos) =====
do $$
begin
  perform cron.unschedule('elarah-vagas-sweep-reconcile');
exception
  when others then null; -- job ainda não existia
end $$;

select cron.schedule(
  'elarah-vagas-sweep-reconcile',
  '*/10 * * * *',
  $$ select public.sweep_and_reconcile_vagas(); $$
);

notify pgrst, 'reload schema';
