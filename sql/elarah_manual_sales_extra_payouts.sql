-- =====================================================================
-- Vendas manuais / Eventos — repasses a MAIS DE UM fornecedor
-- =====================================================================
-- Um evento (aniversário, despedida, corporativo) às vezes junta dois
-- fornecedores no mesmo pacote — ex.: buffet + oficina de coquetelaria.
-- O fornecedor PRINCIPAL continua nas colunas já existentes
-- (supplier_name / payout_amount_centavos / payout_status / payout_paid_at).
-- Os fornecedores EXTRAS ficam nesta lista JSON, cada item com:
--   {
--     "supplier_name": "Buffet da Ana",
--     "supplier_key": "buffet da ana",
--     "amount_centavos": 45000,
--     "status": "pendente",          -- "pendente" | "pago"
--     "paid_at": "2026-07-01T12:00:00.000Z"  -- carimbado quando "pago"
--   }
--
-- Aditiva e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.manual_sales
  add column if not exists extra_payouts jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
