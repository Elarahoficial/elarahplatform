-- =============================================================
-- ELARAH — Backfill: preenche dados de fornecedor em bookings
-- existentes a partir dos dados cadastrados nas experiências.
--
-- Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

-- Preenche fornecedor_nome, valor_cheio, repasse e comissao
-- para bookings que já existem mas não têm esses dados.
UPDATE public.bookings b
   SET fornecedor_nome = COALESCE(b.fornecedor_nome, e.fornecedor_nome),
       valor_cheio_centavos = CASE
         WHEN b.valor_cheio_centavos IS NULL AND e.valor_cheio_centavos IS NOT NULL
         THEN e.valor_cheio_centavos * COALESCE(b.quantidade, 1)
         ELSE b.valor_cheio_centavos
       END,
       valor_repasse_centavos = CASE
         WHEN b.valor_repasse_centavos IS NULL AND b.amount_total IS NOT NULL AND b.amount_total > 0
         THEN ROUND(b.amount_total * COALESCE(e.percentual_repasse, 90) / 100)
         ELSE b.valor_repasse_centavos
       END,
       valor_comissao_centavos = CASE
         WHEN b.valor_comissao_centavos IS NULL AND b.amount_total IS NOT NULL AND b.amount_total > 0
         THEN b.amount_total - ROUND(b.amount_total * COALESCE(e.percentual_repasse, 90) / 100)
         ELSE b.valor_comissao_centavos
       END
  FROM public.experiences e
 WHERE b.experiencia_id = e.id
   AND b.status = 'pago'
   AND (b.fornecedor_nome IS NULL OR b.valor_repasse_centavos IS NULL);
