-- =============================================================
-- ELARAH — Cupom PAI15 (campanha Dia dos Pais · comunidade WhatsApp)
-- -------------------------------------------------------------
-- Cria UM cupom de campanha:
--   código:     PAI15
--   desconto:   15% OFF
--   escopo:     site todo (experience_id NULL = vale pra qualquer experiência)
--   validade:   até o Dia dos Pais (09/08/2026, 23h59 horário de São Paulo)
--   limite:     100 usos (ajuste abaixo — NULL = ilimitado)
--
-- Ajuste o que quiser antes de rodar: discount_value (o %), valid_until,
-- max_uses e o código.
--
-- IDEMPOTENTE: ON CONFLICT (code) DO NOTHING. Se já existir, não duplica.
-- Pra editar depois, use a aba "Cupons" no admin (menu lateral).
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
--
-- DEPENDÊNCIA: rodar antes sql/elarah_coupons.sql (cria a tabela).
-- =============================================================

insert into public.coupons (
  code,
  nome,
  descricao,
  discount_type,
  discount_value,
  experience_id,     -- NULL = vale pro site todo
  valid_from,
  valid_until,
  max_uses,
  is_active,
  metadata
) values (
  'PAI15',
  'Dia dos Pais — 15% OFF',
  'Cupom da comunidade WhatsApp para a campanha de Dia dos Pais.',
  'percent',
  15,                                 -- % de desconto (15 = 15% OFF)
  null,                               -- site todo
  now(),
  '2026-08-09 23:59:59-03',           -- validade (Dia dos Pais)
  100,                                -- limite de usos (NULL = ilimitado)
  true,
  jsonb_build_object(
    'campanha', 'dia-dos-pais-2026',
    'canal', 'whatsapp-comunidade'
  )
)
on conflict (code) do nothing;

-- Confere o resultado
select code, nome, discount_type, discount_value, valid_until, max_uses, times_used, is_active
from public.coupons
where code = 'PAI15';
