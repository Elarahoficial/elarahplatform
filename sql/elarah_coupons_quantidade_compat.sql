-- =============================================================
-- ELARAH — Cupons: compatibilidade com p_quantidade
-- -------------------------------------------------------------
-- PROBLEMA
-- O site (checkout) e as funções de pagamento chamam
--   preview_coupon(p_code, p_experience_id, p_amount_centavos, p_quantidade)
--   hold_coupon   (p_code, p_experience_id, p_amount_centavos, p_quantidade)
-- mas no banco pode existir só a versão de 3 parâmetros (sem
-- p_quantidade) — por exemplo quando elarah_coupons_categoria.sql /
-- elarah_coupon_count_only_when_paid.sql rodaram e a versão com
-- quantidade não ficou. Aí a chamada dá "function does not exist" e o
-- checkout mostra "Código não encontrado." pra QUALQUER cupom.
--
-- O QUE ESTE ARQUIVO FAZ
-- Cria a versão de 4 parâmetros SÓ SE ela não existir, como um
-- "embrulho" da versão de 3 parâmetros que já está no banco (mantém
-- todas as regras que ela tem hoje: validade, ativo, limite de uso,
-- experiência, categoria, contagem só quando paga). Por cima, aplica a
-- regra de quantidade mínima (coupons.min_quantity, ex.: PAI15 = 2+).
--
-- A versão nova NÃO tem default no p_quantidade, pra não ficar ambígua
-- com a de 3 parâmetros.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar. Não mexe nas
-- funções que já existem.
--
-- Como rodar: Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================

alter table public.coupons add column if not exists min_quantity integer;

do $do$
begin
  -- ===== preview_coupon (aplicar cupom no checkout) =====
  if to_regprocedure('public.preview_coupon(text,uuid,integer,integer)') is null
     and to_regprocedure('public.preview_coupon(text,uuid,integer)') is not null then
    execute $f$
      create function public.preview_coupon(
        p_code text,
        p_experience_id uuid,
        p_amount_centavos integer,
        p_quantidade integer
      )
      returns table(
        found             boolean,
        valid             boolean,
        coupon_id         uuid,
        discount_type     text,
        discount_value    integer,
        discount_centavos integer,
        message           text
      )
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_r   record;
        v_tem boolean := false;
        v_min integer;
        v_qty integer := greatest(1, coalesce(p_quantidade, 1));
      begin
        for v_r in select * from public.preview_coupon(p_code, p_experience_id, p_amount_centavos) loop
          v_tem := true;
          exit;
        end loop;
        if not v_tem then
          return query select false, false, null::uuid, null::text, null::integer, 0, 'Cupom não encontrado.'::text;
          return;
        end if;
        if v_r.found and v_r.valid then
          select c.min_quantity into v_min from public.coupons c where c.id = v_r.coupon_id;
          if v_min is not null and v_min > 1 and v_qty < v_min then
            return query select true, false, v_r.coupon_id, v_r.discount_type, v_r.discount_value, 0,
              ('Cupom válido só na compra de ' || v_min || ' lugares ou mais.')::text;
            return;
          end if;
        end if;
        return query select v_r.found, v_r.valid, v_r.coupon_id, v_r.discount_type,
          v_r.discount_value, v_r.discount_centavos, v_r.message;
      end;
      $body$
    $f$;
    execute 'grant execute on function public.preview_coupon(text, uuid, integer, integer) to anon, authenticated, service_role';
    raise notice 'preview_coupon com p_quantidade criada.';
  else
    raise notice 'preview_coupon com p_quantidade já existe (ou falta a de 3 parâmetros) — nada a fazer.';
  end if;

  -- ===== hold_coupon (trava o cupom no pagamento) =====
  if to_regprocedure('public.hold_coupon(text,uuid,integer,integer)') is null
     and to_regprocedure('public.hold_coupon(text,uuid,integer)') is not null then
    execute $f$
      create function public.hold_coupon(
        p_code text,
        p_experience_id uuid,
        p_amount_centavos integer,
        p_quantidade integer
      )
      returns table(
        ok                boolean,
        coupon_id         uuid,
        discount_centavos integer,
        message           text
      )
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_id  uuid;
        v_min integer;
        v_qty integer := greatest(1, coalesce(p_quantidade, 1));
      begin
        -- Quantidade mínima ANTES de travar o cupom.
        select c.id, c.min_quantity into v_id, v_min
          from public.coupons c
         where upper(c.code) = upper(trim(p_code))
         limit 1;
        if v_id is not null and v_min is not null and v_min > 1 and v_qty < v_min then
          return query select false, v_id, 0,
            ('Cupom válido só na compra de ' || v_min || ' lugares ou mais.')::text;
          return;
        end if;
        return query select h.ok, h.coupon_id, h.discount_centavos, h.message
          from public.hold_coupon(p_code, p_experience_id, p_amount_centavos) h;
      end;
      $body$
    $f$;
    execute 'grant execute on function public.hold_coupon(text, uuid, integer, integer) to service_role';
    raise notice 'hold_coupon com p_quantidade criada.';
  else
    raise notice 'hold_coupon com p_quantidade já existe (ou falta a de 3 parâmetros) — nada a fazer.';
  end if;
end;
$do$;

notify pgrst, 'reload schema';

-- =============================================================
-- Conferência (rode depois): as duas devem aparecer com 3 e 4 parâmetros.
--   select oid::regprocedure from pg_proc where proname in ('preview_coupon', 'hold_coupon');
-- E o teste do checkout:
--   select * from public.preview_coupon('CODIGO', (select id from public.experiences where is_active limit 1), 30000, 1);
-- =============================================================
