-- =====================================================================
-- Relatório (somente leitura) — repasses: o que apareceu x o que era certo
-- ---------------------------------------------------------------------
-- Mostra, por venda paga afetada:
--   valor_cheio          = preço cheio do ingresso × quantidade
--   apareceu_transferir  = o que o sistema mostrou pra você pagar
--                          (regra antiga: 70% do valor pago, COM taxa)
--   era_pra_transferir   = o correto (70% do preço cheio, SEM taxa)
--   diferenca            = era_pra_transferir − apareceu_transferir
--                            > 0  → você transferiu A MENOS
--                            < 0  → você transferiu A MAIS
-- Valores já em reais. Vela & Tarot fica de fora (tratada à parte).
-- =====================================================================

-- ----- Detalhe POR VENDA -----
select b.experiencia_nome                                   as evento,
       b.fornecedor_nome                                    as fornecedor,
       greatest(coalesce(b.quantidade,1),1)                 as qtd,
       round((e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1)) / 100.0, 2)              as valor_cheio,
       round(round(b.amount_total * 0.70) / 100.0, 2)                                                 as apareceu_transferir,
       round(round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70) / 100.0, 2)  as era_pra_transferir,
       round((round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70)
              - round(b.amount_total * 0.70)) / 100.0, 2)                                             as diferenca
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where b.status = 'pago'
   and e.valor_cheio_centavos is not null
   and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
 order by b.experiencia_nome, b.created_at;

-- ----- Resumo POR FORNECEDOR -----
select b.fornecedor_nome                                    as fornecedor,
       count(*)                                             as vendas,
       round(sum(round(b.amount_total * 0.70)) / 100.0, 2)  as apareceu_total,
       round(sum(round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70)) / 100.0, 2) as era_pra_total,
       round((sum(round(e.valor_cheio_centavos * greatest(coalesce(b.quantidade,1),1) * 0.70))
              - sum(round(b.amount_total * 0.70))) / 100.0, 2) as diferenca_total
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where b.status = 'pago'
   and e.valor_cheio_centavos is not null
   and b.experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
 group by b.fornecedor_nome
 order by b.fornecedor_nome;
