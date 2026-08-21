-- =====================================================================
-- ELARAH — Repasse SEMPRE = porcentagem em cima do VALOR CHEIO
-- ---------------------------------------------------------------------
-- PROBLEMA
--   A mesma experiência, comprada duas vezes, aparecia com repasses
--   diferentes só porque o pagamento foi por meios diferentes
--   (ex.: Cartão R$130,00 x Pix R$129,50 na mesma reserva de R$185,00).
--
--   Causa: quando a experiência estava SEM "Valor cheio", a trigger
--   bookings_autofill_fornecedor caía em `amount_total` como base do
--   cálculo. E `amount_total` MUDA com o meio de pagamento:
--     - cartão → sai com gross-up da taxa da adquirente (e ainda varia
--       por número de parcelas);
--     - Pix    → sai o valor-base do carrinho.
--   Cupom e gift card também mexem no amount_total.
--   Resultado: base diferente ⇒ repasse diferente pro mesmo produto.
--
--   Além disso a trigger usava 70/30 fixo, ignorando o
--   percentual_repasse / valor_repasse_fixo_centavos cadastrados e a
--   comissão padrão de 20% (regra atual, ver
--   elarah_financial_ledger_v8_comissao_padrao_20.sql).
--
-- REGRA (única, pra todo mundo)
--   base    = VALOR CHEIO (nunca o valor pago)
--             experiência × qtd → snapshot da reserva → preço × qtd
--   repasse = valor_repasse_fixo_centavos × qtd
--             OU base × percentual_repasse/100  (default 70%)
--   comissão= comissao_type/comissao_value cadastrados
--             OU 20% da base (padrão Elarah)
--   Sem base nenhuma → NÃO inventa repasse (deixa null pra aparecer
--   vazio no admin em vez de sair um número errado).
--
-- COMO USAR (SQL Editor do Supabase) — na ordem, conferindo cada SELECT:
--   PARTE 1: corrige o FUTURO (trigger)
--   PARTE 2: prévia do histórico (SELECT)
--   PARTE 3: corrige o histórico (UPDATE)
--   PARTE 4: corrige o snapshot repasses[] (multi-fornecedor)
-- =====================================================================


-- =====================================================================
-- PARTE 1 — RAIZ: trigger nunca mais calcula repasse sobre o valor pago
-- =====================================================================
create or replace function public.bookings_autofill_fornecedor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exp_fornecedor_nome   text;
  v_exp_valor_cheio       integer;
  v_exp_preco             text;
  v_exp_pct               numeric;
  v_exp_repasse_fixo      integer;
  v_exp_comissao_type     text;
  v_exp_comissao_value    numeric;
  v_exp_created_by        uuid;
  v_profile_nome          text;
  v_profile_partner_data  jsonb;
  v_qty                   integer;
  v_preco_centavos        integer;
  v_base_centavos         integer;
begin
  -- Só age em bookings pagas.
  if new.status is null or new.status <> 'pago' then
    return new;
  end if;

  -- Já tem tudo preenchido? Apenas garante status_fornecedor não-nulo.
  if (new.fornecedor_nome is not null and trim(new.fornecedor_nome) <> '')
     and new.valor_repasse_centavos is not null
     and new.valor_comissao_centavos is not null then
    if new.status_fornecedor is null then
      new.status_fornecedor := 'repasse_pendente';
    end if;
    return new;
  end if;

  -- Dados da experiência (se houver). Variáveis escalares continuam null
  -- se experiencia_id é null OU se a experiência não existe — sem erro.
  if new.experiencia_id is not null then
    select e.fornecedor_nome,
           e.valor_cheio_centavos,
           e.preco,
           e.percentual_repasse,
           e.valor_repasse_fixo_centavos,
           e.comissao_type,
           e.comissao_value,
           e.created_by
      into v_exp_fornecedor_nome,
           v_exp_valor_cheio,
           v_exp_preco,
           v_exp_pct,
           v_exp_repasse_fixo,
           v_exp_comissao_type,
           v_exp_comissao_value,
           v_exp_created_by
      from public.experiences e
     where e.id = new.experiencia_id
     limit 1;
  end if;

  -- Profile do dono da experiência (pra fallback de nome).
  if v_exp_created_by is not null then
    select p.nome,
           p.partner_data
      into v_profile_nome,
           v_profile_partner_data
      from public.profiles p
     where p.id = v_exp_created_by
     limit 1;
  end if;

  -- fornecedor_nome
  if new.fornecedor_nome is null or trim(new.fornecedor_nome) = '' then
    new.fornecedor_nome := coalesce(
      nullif(trim(v_exp_fornecedor_nome), ''),
      nullif(v_profile_partner_data ->> 'marca', ''),
      nullif(v_profile_nome, ''),
      'Desconhecido'
    );
  end if;

  -- fornecedor_id
  if new.fornecedor_id is null and v_exp_created_by is not null then
    new.fornecedor_id := v_exp_created_by;
  end if;

  -- Quantidade pra cálculo do valor cheio.
  v_qty := greatest(coalesce(new.quantidade, 1), 1);

  -- valor_cheio_centavos: usa o do booking; senão o da experiência × qtd.
  if new.valor_cheio_centavos is null
     and v_exp_valor_cheio is not null
     and v_exp_valor_cheio > 0 then
    new.valor_cheio_centavos := v_exp_valor_cheio * v_qty;
  end if;

  -- BASE DO RATEIO — nunca amount_total (muda com taxa de cartão, cupom
  -- e gift card). Sem valor cheio, usa o PREÇO da experiência × qtd, que
  -- é igual pra qualquer meio de pagamento.
  v_base_centavos := new.valor_cheio_centavos;

  if v_base_centavos is null and v_exp_preco ~ '[0-9]' then
    begin
      v_preco_centavos := round(
        replace(replace(regexp_replace(v_exp_preco, '[^0-9,\.]', '', 'g'), '.', ''), ',', '.')::numeric * 100
      );
    exception when others then
      v_preco_centavos := null;
    end;
    if v_preco_centavos is not null and v_preco_centavos > 0 then
      v_base_centavos := v_preco_centavos * v_qty;
    end if;
  end if;

  if v_base_centavos is not null and v_base_centavos > 0 then
    if new.valor_repasse_centavos is null then
      -- Valor fixo por pessoa sobrescreve o percentual, igual ao admin.
      if v_exp_repasse_fixo is not null and v_exp_repasse_fixo >= 0 then
        new.valor_repasse_centavos := v_exp_repasse_fixo * v_qty;
      else
        new.valor_repasse_centavos :=
          round(v_base_centavos * (coalesce(v_exp_pct, 70) / 100.0));
      end if;
    end if;

    if new.valor_comissao_centavos is null then
      if v_exp_comissao_type = 'percent' and v_exp_comissao_value is not null then
        new.valor_comissao_centavos := round(v_base_centavos * (v_exp_comissao_value / 100.0));
      elsif v_exp_comissao_type = 'fixed' and v_exp_comissao_value is not null then
        new.valor_comissao_centavos := round(v_exp_comissao_value);
      else
        -- Padrão Elarah: 20% do valor cheio.
        new.valor_comissao_centavos := round(v_base_centavos * 0.20);
      end if;
    end if;
  end if;

  -- Garante status_fornecedor sempre presente.
  if new.status_fornecedor is null then
    new.status_fornecedor := 'repasse_pendente';
  end if;

  return new;
end;
$$;

-- Recria a trigger (idempotente).
drop trigger if exists trg_bookings_autofill_fornecedor on public.bookings;
create trigger trg_bookings_autofill_fornecedor
  before insert or update on public.bookings
  for each row execute function public.bookings_autofill_fornecedor();


-- =====================================================================
-- PARTE 2 — PRÉVIA do histórico (não altera nada)
-- ---------------------------------------------------------------------
-- Mostra as reservas pagas cujo repasse/comissão gravados não batem com
-- a regra, junto do meio de pagamento — é onde aparece o "cartão x Pix".
-- Reservas com VARIAÇÃO (Individual/Dupla/Trio) ficam de fora: o valor
-- cheio da opção só existe no snapshot da própria reserva.
-- =====================================================================
with calc as (
  select
    b.id,
    b.experiencia_nome,
    b.fornecedor_nome,
    coalesce(b.metadata->>'payment_method', '—')            as meio_pagamento,
    greatest(coalesce(b.quantidade, 1), 1)                  as qtd,
    b.amount_total                                          as valor_pago,
    b.valor_cheio_centavos                                  as cheio_atual,
    b.valor_repasse_centavos                                as repasse_atual,
    b.valor_comissao_centavos                               as comissao_atual,
    coalesce(
      nullif(e.valor_cheio_centavos, 0) * greatest(coalesce(b.quantidade, 1), 1),
      nullif(b.valor_cheio_centavos, 0),
      case when e.preco ~ '[0-9]' then
        round(replace(replace(regexp_replace(e.preco, '[^0-9,\.]', '', 'g'), '.', ''), ',', '.')::numeric * 100)
          * greatest(coalesce(b.quantidade, 1), 1)
      end
    )::numeric                                              as base,
    e.percentual_repasse,
    e.valor_repasse_fixo_centavos,
    e.comissao_type,
    e.comissao_value
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where b.status = 'pago'
   and coalesce(b.metadata->>'variant_selected', '') = ''
   and lower(coalesce(b.experiencia_nome, '')) not in ('teste', 'teste 1')
),
shares as (
  -- Multi-fornecedor: o total do repasse é a soma das REGRAS gravadas em
  -- repasses[] (share_type + share_value) reaplicadas sobre a base. Assim
  -- o campo legado valor_repasse_centavos bate com a soma do array.
  select b.id,
         bool_and(
           (t.elem->>'share_type') in ('percent', 'fixed')
           and (t.elem->>'share_value') ~ '^[0-9]+(\.[0-9]+)?$'
         )                                                    as tem_regra,
         sum(
           case
             when t.elem->>'share_type' = 'percent'
               then round(c.base * ((t.elem->>'share_value')::numeric / 100.0))
             when t.elem->>'share_type' = 'fixed'
               then round((t.elem->>'share_value')::numeric)
             else 0
           end
         )                                                    as total
    from calc c
    join public.bookings b on b.id = c.id
    cross join lateral jsonb_array_elements(b.repasses) with ordinality as t(elem, ord)
   where jsonb_typeof(b.repasses) = 'array'
     and jsonb_array_length(b.repasses) > 1
     and c.base is not null and c.base > 0
   group by b.id
),
regra as (
  select c.*,
    coalesce(
      case when s.tem_regra then s.total end,
      case
        when c.valor_repasse_fixo_centavos is not null
          then c.valor_repasse_fixo_centavos * c.qtd
        else round(c.base * (coalesce(c.percentual_repasse, 70) / 100.0))
      end
    )::bigint as repasse_novo,
    case
      when c.comissao_type = 'percent' and c.comissao_value is not null
        then round(c.base * (c.comissao_value / 100.0))
      when c.comissao_type = 'fixed' and c.comissao_value is not null
        then round(c.comissao_value)
      else round(c.base * 0.20)
    end::bigint as comissao_nova
  from calc c
  left join shares s on s.id = c.id
 where c.base is not null and c.base > 0
)
select id, experiencia_nome, fornecedor_nome, meio_pagamento, qtd,
       valor_pago, cheio_atual, base::bigint as cheio_novo,
       repasse_atual, repasse_novo, (repasse_novo - coalesce(repasse_atual, 0)) as diferenca_repasse,
       comissao_atual, comissao_nova
  from regra
 where coalesce(repasse_atual, -1) <> repasse_novo
    or coalesce(comissao_atual, -1) <> comissao_nova
    or coalesce(cheio_atual, -1) <> base::bigint
 order by experiencia_nome, meio_pagamento, id;


-- =====================================================================
-- PARTE 3 — APLICA no histórico (rode após conferir a PARTE 2)
-- =====================================================================
with calc as (
  select
    b.id,
    greatest(coalesce(b.quantidade, 1), 1)                  as qtd,
    coalesce(
      nullif(e.valor_cheio_centavos, 0) * greatest(coalesce(b.quantidade, 1), 1),
      nullif(b.valor_cheio_centavos, 0),
      case when e.preco ~ '[0-9]' then
        round(replace(replace(regexp_replace(e.preco, '[^0-9,\.]', '', 'g'), '.', ''), ',', '.')::numeric * 100)
          * greatest(coalesce(b.quantidade, 1), 1)
      end
    )::numeric                                              as base,
    e.percentual_repasse,
    e.valor_repasse_fixo_centavos,
    e.comissao_type,
    e.comissao_value
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where b.status = 'pago'
   and coalesce(b.metadata->>'variant_selected', '') = ''
   and lower(coalesce(b.experiencia_nome, '')) not in ('teste', 'teste 1')
),
shares as (
  -- Multi-fornecedor: o total do repasse é a soma das REGRAS gravadas em
  -- repasses[] (share_type + share_value) reaplicadas sobre a base. Assim
  -- o campo legado valor_repasse_centavos bate com a soma do array.
  select b.id,
         bool_and(
           (t.elem->>'share_type') in ('percent', 'fixed')
           and (t.elem->>'share_value') ~ '^[0-9]+(\.[0-9]+)?$'
         )                                                    as tem_regra,
         sum(
           case
             when t.elem->>'share_type' = 'percent'
               then round(c.base * ((t.elem->>'share_value')::numeric / 100.0))
             when t.elem->>'share_type' = 'fixed'
               then round((t.elem->>'share_value')::numeric)
             else 0
           end
         )                                                    as total
    from calc c
    join public.bookings b on b.id = c.id
    cross join lateral jsonb_array_elements(b.repasses) with ordinality as t(elem, ord)
   where jsonb_typeof(b.repasses) = 'array'
     and jsonb_array_length(b.repasses) > 1
     and c.base is not null and c.base > 0
   group by b.id
),
regra as (
  select c.id, c.base,
    coalesce(
      case when s.tem_regra then s.total end,
      case
        when c.valor_repasse_fixo_centavos is not null
          then c.valor_repasse_fixo_centavos * c.qtd
        else round(c.base * (coalesce(c.percentual_repasse, 70) / 100.0))
      end
    )::bigint as repasse_novo,
    case
      when c.comissao_type = 'percent' and c.comissao_value is not null
        then round(c.base * (c.comissao_value / 100.0))
      when c.comissao_type = 'fixed' and c.comissao_value is not null
        then round(c.comissao_value)
      else round(c.base * 0.20)
    end::bigint as comissao_nova
  from calc c
  left join shares s on s.id = c.id
 where c.base is not null and c.base > 0
)
update public.bookings b
   set valor_cheio_centavos    = r.base::bigint,
       valor_repasse_centavos  = r.repasse_novo,
       valor_comissao_centavos = r.comissao_nova
  from regra r
 where b.id = r.id
   and (coalesce(b.valor_cheio_centavos, -1)    <> r.base::bigint
     or coalesce(b.valor_repasse_centavos, -1)  <> r.repasse_novo
     or coalesce(b.valor_comissao_centavos, -1) <> r.comissao_nova);


-- =====================================================================
-- PARTE 4 — snapshot repasses[] (multi-fornecedor)
-- ---------------------------------------------------------------------
-- O painel de fornecedores e a financial_by_supplier leem
-- repasses[].valor_centavos quando o array existe. Cada item guarda a
-- REGRA (share_type + share_value), então dá pra reaplicá-la sobre o
-- valor cheio já corrigido na PARTE 3 — o rateio entre os parceiros
-- continua igual, só o valor sai certo.
--
-- ATENÇÃO: pra array de 1 item NÃO dá pra reaplicar o share_value gravado —
-- ele pode estar velho e brigar com o cadastro atual (ex.: snapshot com 70%
-- numa experiência que hoje está com 80%). Nesse caso o valor vem direto do
-- valor_repasse_centavos que a PARTE 3 acabou de gravar, e os dois campos
-- ficam sempre iguais. Só multi-fornecedor reaplica a regra de cada parceiro.
--
-- 4a PRÉVIA:
with novo as (
  select b.id, b.experiencia_nome, b.fornecedor_nome,
         b.valor_cheio_centavos, b.valor_repasse_centavos,
         b.repasses as repasses_atual,
         case
           when jsonb_array_length(b.repasses) = 1 then
             jsonb_build_array(
               (b.repasses->0) || jsonb_build_object('valor_centavos', b.valor_repasse_centavos))
           else (
             select jsonb_agg(
               case
                 when t.elem->>'share_type' = 'percent' and (t.elem->>'share_value') ~ '^[0-9]+(\.[0-9]+)?$'
                   then t.elem || jsonb_build_object('valor_centavos',
                          round(b.valor_cheio_centavos * ((t.elem->>'share_value')::numeric / 100.0)))
                 when t.elem->>'share_type' = 'fixed' and (t.elem->>'share_value') ~ '^[0-9]+(\.[0-9]+)?$'
                   then t.elem || jsonb_build_object('valor_centavos', round((t.elem->>'share_value')::numeric))
                 else t.elem
               end order by t.ord)
               from jsonb_array_elements(b.repasses) with ordinality as t(elem, ord))
         end as repasses_novo
    from public.bookings b
   where b.status = 'pago'
     and b.valor_cheio_centavos is not null
     and b.valor_repasse_centavos is not null
     and jsonb_typeof(b.repasses) = 'array'
     and jsonb_array_length(b.repasses) > 0
     and coalesce(b.metadata->>'variant_selected', '') = ''
)
select * from novo
 where repasses_novo is distinct from repasses_atual
 order by experiencia_nome;

-- 4b APLICA (rode após conferir o 4a):
with novo as (
  select b.id,
         case
           when jsonb_array_length(b.repasses) = 1 then
             jsonb_build_array(
               (b.repasses->0) || jsonb_build_object('valor_centavos', b.valor_repasse_centavos))
           else (
             select jsonb_agg(
               case
                 when t.elem->>'share_type' = 'percent' and (t.elem->>'share_value') ~ '^[0-9]+(\.[0-9]+)?$'
                   then t.elem || jsonb_build_object('valor_centavos',
                          round(b.valor_cheio_centavos * ((t.elem->>'share_value')::numeric / 100.0)))
                 when t.elem->>'share_type' = 'fixed' and (t.elem->>'share_value') ~ '^[0-9]+(\.[0-9]+)?$'
                   then t.elem || jsonb_build_object('valor_centavos', round((t.elem->>'share_value')::numeric))
                 else t.elem
               end order by t.ord)
               from jsonb_array_elements(b.repasses) with ordinality as t(elem, ord))
         end as arr
    from public.bookings b
   where b.status = 'pago'
     and b.valor_cheio_centavos is not null
     and b.valor_repasse_centavos is not null
     and jsonb_typeof(b.repasses) = 'array'
     and jsonb_array_length(b.repasses) > 0
     and coalesce(b.metadata->>'variant_selected', '') = ''
)
update public.bookings b
   set repasses = n.arr
  from novo n
 where b.id = n.id
   and n.arr is not null
   and n.arr is distinct from b.repasses;

-- 4c CONFERE — soma do array tem que bater com valor_repasse_centavos:
select id, experiencia_nome, valor_repasse_centavos,
       (select sum((e->>'valor_centavos')::bigint)
          from jsonb_array_elements(repasses) e) as soma_do_array
  from public.bookings
 where status = 'pago'
   and jsonb_typeof(repasses) = 'array' and jsonb_array_length(repasses) > 0
   and valor_repasse_centavos is distinct from
       (select sum((e->>'valor_centavos')::bigint) from jsonb_array_elements(repasses) e)
 order by experiencia_nome;

-- 4d SNAPSHOT COM FORNECEDOR ERRADO — reservas cujo repasses[] aponta pra
-- outra parceira (sobra de edição de reserva). O painel de fornecedores
-- credita o repasse pelo nome do array, então isso paga a pessoa errada.
select id, experiencia_nome,
       fornecedor_nome                     as fornecedor_da_reserva,
       repasses->0->>'fornecedor_nome'     as fornecedor_no_snapshot,
       valor_repasse_centavos
  from public.bookings
 where status = 'pago'
   and jsonb_typeof(repasses) = 'array' and jsonb_array_length(repasses) = 1
   and lower(regexp_replace(coalesce(repasses->0->>'fornecedor_nome', ''), '\s+', ' ', 'g'))
       is distinct from lower(regexp_replace(coalesce(fornecedor_nome, ''), '\s+', ' ', 'g'))
 order by experiencia_nome;

-- 4e CORRIGE o nome no snapshot (só rode depois de conferir o 4d):
-- update public.bookings b
--    set repasses = jsonb_build_array(
--          (b.repasses->0) || jsonb_build_object('fornecedor_nome', b.fornecedor_nome))
--  where b.status = 'pago'
--    and jsonb_typeof(b.repasses) = 'array' and jsonb_array_length(b.repasses) = 1
--    and coalesce(b.fornecedor_nome, '') <> ''
--    and lower(regexp_replace(coalesce(b.repasses->0->>'fornecedor_nome', ''), '\s+', ' ', 'g'))
--        is distinct from lower(regexp_replace(coalesce(b.fornecedor_nome, ''), '\s+', ' ', 'g'));


-- =====================================================================
-- CONFERÊNCIA FINAL — mesma experiência, meios de pagamento diferentes,
-- o repasse tem que ser IGUAL (mesma qtd).
-- =====================================================================
select experiencia_nome,
       greatest(coalesce(quantidade, 1), 1)          as qtd,
       coalesce(metadata->>'payment_method', '—')    as meio_pagamento,
       count(*)                                      as reservas,
       min(valor_repasse_centavos)                   as repasse_min,
       max(valor_repasse_centavos)                   as repasse_max
  from public.bookings
 where status = 'pago'
   and coalesce(metadata->>'variant_selected', '') = ''
 group by 1, 2, 3
 order by experiencia_nome, qtd, meio_pagamento;

-- Mesma conferência agrupando por EXPERIÊNCIA (id), pra separar experiências
-- diferentes que têm o mesmo nome (duplicadas com preços diferentes).
select b.experiencia_id,
       max(b.experiencia_nome)                         as experiencia_nome,
       greatest(coalesce(b.quantidade, 1), 1)          as qtd,
       coalesce(b.metadata->>'payment_method', '—')    as meio_pagamento,
       count(*)                                        as reservas,
       min(b.valor_repasse_centavos)                   as repasse_min,
       max(b.valor_repasse_centavos)                   as repasse_max
  from public.bookings b
 where b.status = 'pago'
   and coalesce(b.metadata->>'variant_selected', '') = ''
 group by b.experiencia_id, 3, 4
 order by experiencia_nome, qtd, meio_pagamento;
