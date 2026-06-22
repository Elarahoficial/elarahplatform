-- =====================================================================
-- Correção pontual — repasse da "Vela & Tarot: Galentine's Day" (Tra Art)
-- ---------------------------------------------------------------------
-- Evento colaborativo 50/50: R$ 109,00 por ingresso pra Tra Art, R$ 109,00
-- pra Elarah (ingresso cheio = R$ 218,00).
--
-- Contexto: o repasse é "congelado" em cada booking no momento da compra
-- (valor_repasse_centavos). A contabilidade usa esse valor gravado e ignora
-- o % atual da experiência — então mudar a experiência pra 50% NÃO recalcula
-- vendas já feitas. Essas bookings ficaram com o repasse antigo (70%).
--
-- IMPORTANTE — por que valor FIXO e não 50%:
--   valor_cheio_centavos está null nessas bookings, e o valor pago
--   (amount_total) varia: 5 ingressos foram R$ 229,18 (incluem ~R$ 11,18 de
--   taxa de cartão) e 2 foram R$ 218,00. Aplicar "50% do valor pago" daria
--   repasse de R$ 114,59 nos de R$ 229,18 (a Tra Art levaria metade da taxa).
--   O combinado é R$ 109,00 por ingresso, então usamos valor FIXO.
--   A comissão da Elarah = valor pago − repasse (Elarah absorve a taxa).
--
-- COMO USAR (SQL Editor do Supabase):
--   1) Rode o PASSO 1 (SELECT) e confira as linhas / os valores novos.
--   2) Confirmado, rode o PASSO 2 (UPDATE).
--   3) Rode o PASSO 3 pra conferir.
--
-- Seguro rodar de novo — sempre fixa R$ 109,00 × quantidade.
-- =====================================================================

-- Repasse combinado por ingresso, em centavos (R$ 109,00):
--   -> 10900

-- ---------- PASSO 1: PREVIEW (não altera nada) ----------
select id,
       experiencia_nome,
       fornecedor_nome,
       quantidade,
       amount_total                                          as valor_pago,
       valor_repasse_centavos                                as repasse_atual,
       valor_comissao_centavos                               as comissao_atual,
       10900 * coalesce(quantidade, 1)                       as repasse_novo,
       coalesce(valor_cheio_centavos, amount_total)
         - (10900 * coalesce(quantidade, 1))                 as comissao_nova
  from public.bookings
 where experiencia_id = 'a78196bb-41d8-4818-9d87-4796c11373ff'
 order by created_at;

-- ---------- PASSO 2: APLICA (rode só depois de conferir o PASSO 1) ----------
update public.bookings
   set valor_repasse_centavos  = 10900 * coalesce(quantidade, 1),
       valor_comissao_centavos = coalesce(valor_cheio_centavos, amount_total)
                                 - (10900 * coalesce(quantidade, 1))
 where experiencia_id = 'a78196bb-41d8-4818-9d87-4796c11373ff'
   and coalesce(valor_cheio_centavos, amount_total) is not null;

-- ---------- PASSO 3: CONFERE ----------
select id,
       experiencia_nome,
       quantidade,
       amount_total            as valor_pago,
       valor_repasse_centavos  as repasse,
       valor_comissao_centavos as comissao_elarah
  from public.bookings
 where experiencia_id = 'a78196bb-41d8-4818-9d87-4796c11373ff'
 order by created_at;
