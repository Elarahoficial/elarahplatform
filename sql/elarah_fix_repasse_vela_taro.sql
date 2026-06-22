-- =====================================================================
-- Correção pontual — repasse 50/50 do evento colaborativo "Vela Tarô"
-- (parceria com Tra Art / Atraarte).
-- ---------------------------------------------------------------------
-- Contexto: o repasse ao fornecedor é "congelado" em cada booking no
-- momento da compra (coluna valor_repasse_centavos). A contabilidade usa
-- esse valor gravado e ignora o % atual da experiência — então mudar a
-- experiência pra 50% NÃO recalcula vendas já feitas. Essas bookings
-- foram criadas com o repasse antigo de 70% e precisam ir pra 50%
-- (valor cheio dividido meio a meio: metade fornecedor, metade Elarah).
--
-- COMO USAR (SQL Editor do Supabase):
--   1) Rode só o PASSO 1 (SELECT). Confira se as linhas são EXATAMENTE
--      as vendas da Vela Tarô que você quer corrigir.
--        - Se o filtro pegar vendas que NÃO são desse evento (ex.: outras
--          experiências da Tra Art), copie o experiencia_id da linha certa
--          e troque o WHERE do PASSO 2 por:  where experiencia_id = 'cole-o-id'
--   2) Confirmado, rode o PASSO 2 (UPDATE).
--   3) Rode o PASSO 3 pra confirmar (repasse = comissão = metade do cheio).
--
-- Seguro rodar de novo — sempre recalcula 50/50 a partir do valor cheio.
-- =====================================================================

-- ---------- PASSO 1: PREVIEW (não altera nada) ----------
select id,
       experiencia_id,
       experiencia_nome,
       fornecedor_nome,
       quantidade,
       valor_cheio_centavos,
       valor_repasse_centavos                                            as repasse_atual,
       valor_comissao_centavos                                           as comissao_atual,
       round(coalesce(valor_cheio_centavos, amount_total) * 0.50)        as repasse_novo,
       coalesce(valor_cheio_centavos, amount_total)
         - round(coalesce(valor_cheio_centavos, amount_total) * 0.50)    as comissao_nova
  from public.bookings
 where experiencia_nome ilike '%vela%tar%'
    or fornecedor_nome  ilike '%tra%art%'
 order by created_at;

-- ---------- PASSO 2: APLICA (rode só depois de conferir o PASSO 1) ----------
update public.bookings
   set valor_repasse_centavos  = round(coalesce(valor_cheio_centavos, amount_total) * 0.50),
       valor_comissao_centavos = coalesce(valor_cheio_centavos, amount_total)
                                 - round(coalesce(valor_cheio_centavos, amount_total) * 0.50)
 where (experiencia_nome ilike '%vela%tar%' or fornecedor_nome ilike '%tra%art%')
   and coalesce(valor_cheio_centavos, amount_total) is not null;

-- ---------- PASSO 3: CONFERE ----------
select id,
       experiencia_nome,
       valor_cheio_centavos,
       valor_repasse_centavos,
       valor_comissao_centavos
  from public.bookings
 where experiencia_nome ilike '%vela%tar%'
    or fornecedor_nome  ilike '%tra%art%'
 order by created_at;
