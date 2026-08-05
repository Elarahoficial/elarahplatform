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
--      as reservas `pending` PURAS (cartão/PIX, SEM gift card e SEM cupom)
--      mais velhas que p_minutes (default 60). Essas não têm nada a
--      reembolsar, então liberar a vaga é 100% seguro.
--      IMPORTANTE: reservas com gift_card_id/coupon_id NÃO são expiradas
--      automaticamente — se fossem, e o PIX fosse pago tarde (o webhook
--      re-ocupa a vaga mas NÃO re-debita o gift card/cupom), o cliente
--      ficaria com o saldo de volta E a reserva paga (vazamento). Essas
--      poucas ficam pro admin resolver à mão.
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
  v_count integer := 0;
  v_min   integer := greatest(15, coalesce(p_minutes, 60)); -- nunca < 15min
begin
  -- Só expira reservas PURAS (sem gift card e sem cupom) — essas não têm
  -- nada a reembolsar, então liberar é seguro e não vaza dinheiro. Um UPDATE
  -- em bloco (sem loop/refund) é mais simples e atômico.
  with expiradas as (
    update public.bookings
       set status = 'expirado'
     where status = 'pending'
       and gift_card_id is null
       and coupon_id is null
       and created_at < (now() - make_interval(mins => v_min))
    returning 1
  )
  select count(*) into v_count from expiradas;

  if v_count > 0 then
    raise notice 'expire_stale_pending_bookings: % reservas puras expiradas (> %min)', v_count, v_min;
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
