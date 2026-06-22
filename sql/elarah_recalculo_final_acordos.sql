-- =====================================================================
-- Recálculo final — acordos especiais + relatório correto
-- ---------------------------------------------------------------------
-- O recálculo geral anterior aplicou 70% em tudo, o que sobrescreveu os
-- acordos especiais. Aqui acertamos SÓ esses casos pro valor real:
--   Giovanna (Tela & Tinta)            → R$90 fixo por pessoa
--   Perséfone (as 2 Ourivesaria)       → R$160 fixo por pessoa
--   Accademia (Pasta & Date DDN)       → 80% do valor cheio
-- As experiências de 70% ficam como estão (decisão: "deixar como foi pago").
-- Vela & Tarot fica de fora (já tratada). Eventos são venda manual (à parte).
--
-- comissão Elarah = valor pago − repasse.
-- Rode cada PREVIEW antes do UPDATE correspondente.
-- =====================================================================

-- ============ PARTE 1 — acertar os acordos especiais ============

-- 1.1 PREVIEW (o que vai mudar nas 3):
select b.experiencia_nome, b.fornecedor_nome,
       greatest(coalesce(b.quantidade,1),1) as qtd,
       b.amount_total as valor_pago,
       b.valor_repasse_centavos as repasse_atual,
       case
         when b.experiencia_nome ilike '%Tela & Tinta%' then 9000 * greatest(coalesce(b.quantidade,1),1)
         when b.experiencia_nome ilike '%Ourivesaria%'  then 16000 * greatest(coalesce(b.quantidade,1),1)
         else round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.80)
       end as repasse_correto
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where b.status='pago' and b.amount_total is not null
   and ( b.experiencia_nome ilike '%Tela & Tinta%'
      or b.experiencia_nome ilike '%Ourivesaria%'
      or (b.experiencia_nome ilike '%Dia dos Namorados%' and b.fornecedor_nome ilike '%accademia%') )
 order by b.fornecedor_nome, b.experiencia_nome;

-- 1.2 Giovanna (Tela & Tinta) = R$90/pessoa
update public.bookings b
   set valor_repasse_centavos  = 9000 * greatest(coalesce(b.quantidade,1),1),
       valor_comissao_centavos = b.amount_total - 9000 * greatest(coalesce(b.quantidade,1),1)
 where b.status='pago' and b.amount_total is not null
   and b.experiencia_nome ilike '%Tela & Tinta%';

-- 1.3 Perséfone (Ourivesaria) = R$160/pessoa
update public.bookings b
   set valor_repasse_centavos  = 16000 * greatest(coalesce(b.quantidade,1),1),
       valor_comissao_centavos = b.amount_total - 16000 * greatest(coalesce(b.quantidade,1),1)
 where b.status='pago' and b.amount_total is not null
   and b.experiencia_nome ilike '%Ourivesaria%';

-- 1.4 Accademia (Pasta & Date DDN) = 80% do valor cheio
update public.bookings b
   set valor_repasse_centavos  = round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.80),
       valor_comissao_centavos = b.amount_total - round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.80)
  from public.experiences e
 where b.experiencia_id = e.id
   and b.status='pago' and b.amount_total is not null
   and b.experiencia_nome ilike '%Dia dos Namorados%'
   and b.fornecedor_nome ilike '%accademia%';


-- ============ PARTE 2 — RELATÓRIO correto (somente leitura) ============
-- correto = regra real de cada experiência. Vela & Tarot fica de fora.

-- 2.1 Resumo POR FORNECEDOR:
with calc as (
  select b.fornecedor_nome,
         round(b.amount_total * 0.70) as setenta_do_pago,
         case
           when b.experiencia_nome ilike '%Tela & Tinta%' then 9000 * greatest(coalesce(b.quantidade,1),1)
           when b.experiencia_nome ilike '%Ourivesaria%'  then 16000 * greatest(coalesce(b.quantidade,1),1)
           when b.experiencia_nome ilike '%Dia dos Namorados%' and b.fornecedor_nome ilike '%accademia%'
                then round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.80)
           else round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70)
         end as correto
    from public.bookings b
    join public.experiences e on e.id = b.experiencia_id
   where b.status='pago' and e.valor_cheio_centavos is not null
     and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
)
select fornecedor_nome,
       count(*) as vendas,
       round(sum(correto)/100.0, 2) as repasse_correto_total
  from calc
 group by fornecedor_nome
 order by fornecedor_nome;

-- 2.2 Detalhe POR EXPERIÊNCIA:
with calc as (
  select b.experiencia_nome, b.fornecedor_nome,
         greatest(coalesce(b.quantidade,1),1) as qtd,
         case
           when b.experiencia_nome ilike '%Tela & Tinta%' then 9000 * greatest(coalesce(b.quantidade,1),1)
           when b.experiencia_nome ilike '%Ourivesaria%'  then 16000 * greatest(coalesce(b.quantidade,1),1)
           when b.experiencia_nome ilike '%Dia dos Namorados%' and b.fornecedor_nome ilike '%accademia%'
                then round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.80)
           else round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70)
         end as correto
    from public.bookings b
    join public.experiences e on e.id = b.experiencia_id
   where b.status='pago' and e.valor_cheio_centavos is not null
     and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
)
select experiencia_nome, fornecedor_nome,
       count(*) as vendas, sum(qtd) as ingressos,
       round(sum(correto)/100.0, 2) as repasse_correto_total
  from calc
 group by experiencia_nome, fornecedor_nome
 order by experiencia_nome;
