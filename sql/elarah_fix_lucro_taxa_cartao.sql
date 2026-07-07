-- =============================================================
-- ELARAH — Correção: taxa do cartão inflava o LUCRO
-- -------------------------------------------------------------
-- Mesmo erro da comissão, agora nos relatórios de LUCRO:
--   financial_summary   → aba Contabilidade, card "Lucro estimado"
--   financial_by_experience → Lucro/Margem por experiência
--
-- Ambos faziam lucro = receita − repasses − gastos, com
-- receita = amount_total (o valor pago pelo cliente, que INCLUI a taxa
-- do cartão cobrada por cima). Como a taxa é repassada à adquirente (não
-- é lucro da Elarah), o lucro saía inflado pela soma das taxas.
--
-- CORREÇÃO: subtrair a taxa do cartão do lucro. A RECEITA (GMV) fica
--   como está (é o que o cliente pagou). Só o LUCRO passa a descontar a
--   taxa. A taxa vem de bookings.metadata->>'card_fee_total_centavos'
--   (0 no PIX / vendas sem taxa), lida via LEFT JOIN — NÃO mexe na view
--   v_financial_ledger (por isso não dá o erro 42P16).
--
-- Só reescreve as DUAS funções de relatório (read-only). Não toca em
-- pagamento, trigger, nem grava nada. Preserva a contagem por
-- participantes (sum(quantity)) da versão contadores_por_quantidade.
--
-- IDEMPOTENTE. REVERSÍVEL: re-rodar elarah_contadores_por_quantidade.sql.
-- =============================================================


-- ===== financial_summary — lucro sem a taxa do cartão =====
create or replace function public.financial_summary(
  p_date_from   timestamptz default null,
  p_date_to     timestamptz default null,
  p_experience  uuid        default null,
  p_supplier    text        default null,
  p_sources     text[]      default null,
  p_include_test boolean    default false
)
returns table (
  receita_confirmada_centavos    bigint,
  receita_pendente_centavos      bigint,
  receita_cancelada_centavos     bigint,
  receita_reembolsada_centavos   bigint,
  gastos_pagos_centavos          bigint,
  gastos_pendentes_centavos      bigint,
  repasses_pendentes_centavos    bigint,
  repasses_pagos_centavos        bigint,
  lucro_estimado_centavos        bigint,
  qty_bookings_pagos             integer,
  qty_manual_sales_pagas         integer,
  qty_giftcards_pagos            integer,
  qty_expenses                   integer,
  gross_confirmado_centavos      bigint,
  discount_confirmado_centavos   bigint
)
language sql
security invoker
stable
as $$
  with l as (
    select
      v.*,
      -- Taxa do cartão da venda (só bookings; 0 no resto). Lida direto
      -- de bookings, sem alterar a view.
      coalesce(
        case when v.source = 'booking'
          then round(nullif(b.metadata->>'card_fee_total_centavos','')::numeric)::bigint
          else 0 end, 0)                                            as card_fee_centavos
    from public.v_financial_ledger v
    left join public.bookings b
      on v.source = 'booking' and b.id::text = v.id
    where (p_date_from   is null or v.occurred_at >= p_date_from)
      and (p_date_to     is null or v.occurred_at <= p_date_to)
      and (p_experience  is null or v.experience_id = p_experience)
      and (p_supplier    is null
           or lower(regexp_replace(coalesce(v.supplier_name,''), '\s+', ' ', 'g'))
              = lower(regexp_replace(p_supplier,                  '\s+', ' ', 'g')))
      and (p_sources     is null or v.source = any(p_sources))
      and (p_include_test = true or v.is_test = false)
  ),
  recs as (
    select
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then amount_centavos else 0 end) as rc,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status in ('pending','pendente')                 then amount_centavos else 0 end) as rp,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status in ('cancelado','expirado')               then amount_centavos else 0 end) as rcanc,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'reembolsado'                           then amount_centavos else 0 end) as rref,
      sum(case when source = 'expense' and status = 'pago'           then amount_centavos else 0 end) as gp,
      sum(case when source = 'expense' and status = 'pendente'       then amount_centavos else 0 end) as gpe,
      sum(case when source in ('booking','manual_sale')
                and status = 'pago'
                and payout_status = 'repasse_pendente'               then payout_centavos else 0 end) as rpp,
      sum(case when source in ('booking','manual_sale')
                and status = 'pago'
                and payout_status = 'repasse_feito'                  then payout_centavos else 0 end) as rpf,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then gross_centavos else 0 end)    as gross_c,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then discount_centavos else 0 end) as disc_c,
      -- Soma das taxas de cartão da receita confirmada (sai do lucro).
      sum(case when source = 'booking'
                and status = 'pago'                                  then card_fee_centavos else 0 end) as cardfee_c,
      coalesce(sum(quantity) filter (where source = 'booking'     and status = 'pago'), 0)    as qbp,
      coalesce(sum(quantity) filter (where source = 'manual_sale' and status = 'pago'), 0)    as qmp,
      coalesce(sum(quantity) filter (where source = 'giftcard'    and status = 'pago'), 0)    as qgp,
      count(*) filter (where source = 'expense')                                              as qex
    from l
  )
  select
    coalesce(rc,    0)::bigint,
    coalesce(rp,    0)::bigint,
    coalesce(rcanc, 0)::bigint,
    coalesce(rref,  0)::bigint,
    coalesce(gp,    0)::bigint,
    coalesce(gpe,   0)::bigint,
    coalesce(rpp,   0)::bigint,
    coalesce(rpf,   0)::bigint,
    -- Lucro estimado: receita − gastos − repasses − TAXA DO CARTÃO.
    (coalesce(rc,0) - coalesce(gp,0) - coalesce(rpp,0) - coalesce(rpf,0)
       - coalesce(cardfee_c,0))::bigint,
    coalesce(qbp,   0)::integer,
    coalesce(qmp,   0)::integer,
    coalesce(qgp,   0)::integer,
    coalesce(qex,   0)::integer,
    coalesce(gross_c, 0)::bigint,
    coalesce(disc_c,  0)::bigint
  from recs;
$$;

grant execute on function public.financial_summary(timestamptz, timestamptz, uuid, text, text[], boolean)
  to authenticated, service_role;


-- ===== financial_by_experience — lucro sem a taxa do cartão =====
create or replace function public.financial_by_experience(
  p_date_from   timestamptz default null,
  p_date_to     timestamptz default null
)
returns table (
  experience_id              uuid,
  experience_name            text,
  qty_site                   integer,
  qty_manual                 integer,
  receita_centavos           bigint,
  repasse_centavos           bigint,
  gastos_centavos            bigint,
  lucro_centavos             bigint
)
language sql
security invoker
stable
as $$
  with l as (
    select
      v.*,
      coalesce(
        case when v.source = 'booking'
          then round(nullif(b.metadata->>'card_fee_total_centavos','')::numeric)::bigint
          else 0 end, 0)                                            as card_fee_centavos
    from public.v_financial_ledger v
    left join public.bookings b
      on v.source = 'booking' and b.id::text = v.id
    where (p_date_from is null or v.occurred_at >= p_date_from)
      and (p_date_to   is null or v.occurred_at <= p_date_to)
      and v.is_test = false
      and v.experience_id is not null
  )
  select
    l.experience_id,
    coalesce(max(l.experience_name), '')::text                                    as experience_name,
    coalesce(sum(quantity) filter (where source = 'booking'     and status = 'pago'), 0)::int as qty_site,
    coalesce(sum(quantity) filter (where source = 'manual_sale' and status = 'pago'), 0)::int as qty_manual,
    sum(case when source in ('booking','manual_sale') and status = 'pago'
             then amount_centavos else 0 end)::bigint                             as receita,
    sum(case when source in ('booking','manual_sale') and status = 'pago'
             then payout_centavos else 0 end)::bigint                             as repasse,
    sum(case when source = 'expense'  and status = 'pago'
             then amount_centavos else 0 end)::bigint                             as gastos,
    -- Lucro = receita − repasse − gastos − TAXA DO CARTÃO.
    (sum(case when source in ('booking','manual_sale') and status = 'pago'
             then amount_centavos else 0 end)
     - sum(case when source in ('booking','manual_sale') and status = 'pago'
             then payout_centavos else 0 end)
     - sum(case when source = 'expense' and status = 'pago'
             then amount_centavos else 0 end)
     - sum(case when source = 'booking' and status = 'pago'
             then card_fee_centavos else 0 end))::bigint                          as lucro
  from l
  group by l.experience_id
  order by receita desc nulls last;
$$;

grant execute on function public.financial_by_experience(timestamptz, timestamptz)
  to authenticated, service_role;


notify pgrst, 'reload schema';
