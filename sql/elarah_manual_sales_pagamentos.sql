-- =====================================================================
-- Vendas manuais — pagamentos (entrada + parcelas)
-- =====================================================================
-- Eventos costumam ter entrada (30%, 50%...) + restante parcelado em uma
-- ou mais datas. Esta coluna guarda esse cronograma de pagamentos numa
-- lista JSON, cada item com:
--   { "label": "Entrada", "valor_centavos": 30000, "data": "2026-07-01", "pago": true }
--
-- Aditiva e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.manual_sales
  add column if not exists payments jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
