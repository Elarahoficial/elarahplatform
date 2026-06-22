-- =====================================================================
-- Correção pontual — repasse/comissão da reserva
-- "Oficina de Perfumaria Criativa & Meditação Guiada" (Lab Botanic)
-- ---------------------------------------------------------------------
-- Cliente : Ana Clara Barbosa <26anaclarabarbosa@gmail.com>
-- Data    : 04/07 · 9h30 – 12h30 · 3 pessoas
-- Parceiro: Lab Botanic
--
-- PROBLEMA
--   O painel mostrava repasse R$ 200,00 e comissão R$ 580,00 — invertido
--   e errado. O combinado é o modelo padrão da Elarah:
--
--     valor cheio  = R$ 260,00 × 3            = R$ 780,00  (78000 centavos)
--     repasse 70%  = 780 × 0,70  → Lab Botanic = R$ 546,00  (54600 centavos)
--     comissão 20% = 780 × 0,20  → Elarah      = R$ 156,00  (15600 centavos)
--     desconto 10% = 780 × 0,10  → cliente     = R$  78,00  (oferta Elarah)
--
--   Os 10% NÃO são comissão nem taxa de cartão: é o desconto que a Elarah
--   oferece sobre o preço que o parceiro cobraria (parte da proposta de
--   parceria). Por isso a comissão é 20% (R$ 156,00) e NÃO o residual de
--   30% (R$ 234,00) — o desconto sai da margem da Elarah, não do repasse.
--
-- CONTEXTO TÉCNICO
--   O repasse/comissão ficam "congelados" em cada booking no momento da
--   compra (valor_repasse_centavos / valor_comissao_centavos). A
--   contabilidade lê esses valores gravados, então a correção precisa ser
--   feita direto na linha — mudar o % da experiência não recalcula vendas
--   já feitas.
--
-- COMO USAR (SQL Editor do Supabase):
--   1) Rode o PASSO 1 (SELECT) e confira que retorna EXATAMENTE 1 linha
--      e que os valores novos batem com a tabela acima.
--   2) Confirmado, rode o PASSO 2 (UPDATE).
--   3) Rode o PASSO 3 pra conferir.
--
-- Seguro rodar de novo — sempre fixa os mesmos valores.
-- =====================================================================

-- ---------- PASSO 1: PREVIEW (não altera nada) ----------
select id,
       nome,
       email,
       experiencia_nome,
       fornecedor_nome,
       data,
       quantidade,
       amount_total                  as valor_pago,
       valor_cheio_centavos          as cheio_atual,
       valor_repasse_centavos        as repasse_atual,
       valor_comissao_centavos       as comissao_atual,
       78000                         as cheio_novo,
       54600                         as repasse_novo,    -- 70%
       15600                         as comissao_nova    -- 20% (10% = desconto)
  from public.bookings
 where lower(email) = '26anaclarabarbosa@gmail.com'
   and experiencia_nome ilike '%Perfumaria%'
   and data = '04/07';

-- ---------- PASSO 2: APLICA (rode só depois de conferir o PASSO 1) ----------
update public.bookings
   set valor_cheio_centavos    = 78000,
       valor_repasse_centavos  = 54600,   -- 70% → Lab Botanic
       valor_comissao_centavos = 15600    -- 20% → Elarah (10% é desconto)
 where lower(email) = '26anaclarabarbosa@gmail.com'
   and experiencia_nome ilike '%Perfumaria%'
   and data = '04/07';

-- ---------- PASSO 3: CONFERE ----------
select id,
       nome,
       experiencia_nome,
       quantidade,
       amount_total            as valor_pago,
       valor_cheio_centavos    as cheio,
       valor_repasse_centavos  as repasse,
       valor_comissao_centavos as comissao_elarah
  from public.bookings
 where lower(email) = '26anaclarabarbosa@gmail.com'
   and experiencia_nome ilike '%Perfumaria%'
   and data = '04/07';
