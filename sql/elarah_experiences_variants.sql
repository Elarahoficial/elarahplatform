-- =============================================================
-- ELARAH — Variantes de experiência (escolha do cliente)
-- -------------------------------------------------------------
-- Permite que uma experiência peça ao cliente uma escolha extra
-- além do horário (ex: Pintura com Cristal & Aperol → escolher
-- "Lagosta", "Beijo" ou "Olho grego" como modelo do quadro).
--
-- Modelo:
--   - variant_label   → rótulo da variação ("Modelo do quadro").
--                        Quando vazio/null, NÃO aparece seletor.
--   - variant_options → array de opções disponíveis. O cliente
--                        escolhe uma; salva em metadata.variant_selected
--                        da booking pra exibir no admin/email.
--
-- Fluxo:
--   1. Admin cadastra label + lista de opções no form de By Elarah
--      (seção comprável) ou no form de Experiências.
--   2. Front renderiza seletor de variante no modal de reserva
--      antes do horário.
--   3. Cliente escolhe → vai como variant_selected no payload do
--      create-checkout-session / create-mp-pix-payment.
--   4. Edge function salva em metadata.variant_selected.
--   5. E-mail de confirmação exibe "Modelo do quadro: Lagosta".
--   6. Admin de bookings exibe junto do nome do cliente.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

alter table public.experiences
  add column if not exists variant_label text;

alter table public.experiences
  add column if not exists variant_options text[];

-- Refresh do PostgREST pra que as colunas novas fiquem disponíveis
-- imediatamente via API REST.
notify pgrst, 'reload schema';
