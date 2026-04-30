-- =============================================================
-- ELARAH — Rede de segurança PINTURA10
-- -------------------------------------------------------------
-- USE APENAS SE: o deploy das Edge Functions novas (v6+) falhou
-- e a função `create-checkout-session` antiga ainda está em
-- produção (não tem suporte a tabela `coupons`).
--
-- Cria PINTURA10 ALSO em `gift_cards` com saldo R$ 29,90 (10% de
-- R$ 299) e expiração de 48h. Como gift card é decrementado por
-- valor (não % do total), o cliente paga R$ 269,10.
--
-- TRADE-OFF: gift cards não têm restrição por experiência. Em tese,
-- alguém que descubra o código pode usar em outra experiência. Risco
-- baixo na prática (campanha fechada, lista pequena), mas ciente.
--
-- Quando o deploy das functions novas rodar com sucesso, a versão da
-- tabela `coupons` (com restrição) começa a funcionar e este gift_card
-- pode ser deletado: status='cancelled' ou simplesmente deixar
-- expirar em 48h.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================

insert into public.gift_cards (
  code,
  valor_inicial_centavos,
  saldo_centavos,
  status,
  comprador_email,
  comprador_nome,
  destinatario_email,
  destinatario_nome,
  mensagem,
  expires_at,
  metadata
) values (
  'PINTURA10',
  2990,                                     -- R$ 29,90 = 10% de R$ 299
  2990,
  'active',
  'campanha@elarah.com.br',
  'Campanha Elarah',
  'lista-interesse@elarah.com.br',
  'Lista de Interesse Pintura',
  'Cupom 10% OFF — Pintura de Quadro com Cristal & Aperol Spritz (lista de interesse, 48h).',
  now() + interval '48 hours',
  jsonb_build_object(
    'tipo', 'rede_seguranca_cupom',
    'cupom_real_em', 'tabela coupons',
    'campanha', 'pintura-lista-interesse-2026-04'
  )
)
on conflict (code) do update
   set saldo_centavos = excluded.saldo_centavos,
       valor_inicial_centavos = excluded.valor_inicial_centavos,
       status = 'active',
       expires_at = excluded.expires_at,
       metadata = excluded.metadata;

select code, valor_inicial_centavos, saldo_centavos, status, expires_at
  from public.gift_cards where code = 'PINTURA10';
