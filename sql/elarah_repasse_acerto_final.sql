-- =====================================================================
-- Acerto final do repasse + exclusão da "Retratos a Dois"
-- ---------------------------------------------------------------------
-- PARTE A — Reverte as vendas JÁ PAGAS (status_fornecedor='repasse_feito')
--   pro valor que foi realmente pago (regra antiga: 70% do valor pago).
--   Assim a contabilidade passada reflete a realidade. As vendas PENDENTES
--   continuam com o valor corrigido (vão ser pagas pelo valor certo) e as
--   futuras já nascem certas. A Vela & Tarot fica de fora (já tratada).
--
-- PARTE B — Exclui a experiência "Retratos a Dois — Especial Dia dos
--   Namorados" (não aconteceu, sem repasse).
--
-- Rode na ordem, conferindo cada SELECT antes do comando que altera.
-- =====================================================================


-- =====================================================================
-- PARTE A — Reverter as já pagas pro valor realmente pago
-- =====================================================================

-- A.1 PREVIEW — confira o que volta (repasse_atual = corrigido; repasse_volta
--     = o que foi pago de fato):
select fornecedor_nome,
       count(*)                                as vendas,
       sum(valor_repasse_centavos)::int        as repasse_atual,
       sum(round(amount_total * 0.70))::int     as repasse_volta
  from public.bookings
 where status = 'pago'
   and status_fornecedor = 'repasse_feito'
   and experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
   and amount_total is not null
 group by fornecedor_nome
 order by fornecedor_nome;

-- A.2 APLICA (rode após conferir o A.1):
update public.bookings
   set valor_repasse_centavos  = round(amount_total * 0.70),
       valor_comissao_centavos = amount_total - round(amount_total * 0.70),
       valor_cheio_centavos    = null
 where status = 'pago'
   and status_fornecedor = 'repasse_feito'
   and experiencia_id <> 'a78196bb-41d8-4818-9d87-4796c11373ff'
   and amount_total is not null;


-- =====================================================================
-- PARTE B — Excluir a experiência "Retratos a Dois"
-- =====================================================================

-- B.1 CONFERE se há vendas ligadas a ela (IMPORTANTE rodar antes):
--     Se vier alguma linha com status='pago', PARE e me avise — aí tem
--     cliente que pagou e precisa de tratamento (reembolso), não exclusão.
select id, status, status_fornecedor, amount_total, created_at
  from public.bookings
 where experiencia_id = '006895d3-4e61-4dd5-a41e-bc32e86cb8fb';

-- B.2 EXCLUI (só rode se o B.1 não trouxe venda paga).
--     Apaga dependências primeiro pra não travar em foreign key.
--     Se alguma tabela não existir no seu banco, ignore o erro dela.
delete from public.experience_suppliers
 where experience_id = '006895d3-4e61-4dd5-a41e-bc32e86cb8fb';

delete from public.experience_slots
 where experience_id = '006895d3-4e61-4dd5-a41e-bc32e86cb8fb';

delete from public.experiences
 where id = '006895d3-4e61-4dd5-a41e-bc32e86cb8fb';
