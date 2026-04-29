-- =============================================================
-- ELARAH — Seed do cupom PINTURA10 (campanha lista de interesse)
-- -------------------------------------------------------------
-- Cria UM cupom específico:
--   código:     PINTURA10
--   desconto:   10% OFF
--   restrição:  Pintura de Quadro com Cristal & Aperol Spritz (Baia Lara)
--   validade:  48h a partir do momento que rodar este SQL
--   limite:     50 usos (ajuste o valor abaixo se precisar)
--
-- Usa subquery pra buscar o experience_id por nome — assim o seed
-- funciona em qualquer ambiente (staging/prod) sem precisar copiar UUID.
-- O ILIKE com wildcards tolera variações leves de nome ("Cristal" vs
-- "Cristal & Aperol Spritz" etc.). Se o seed não achar, devolve erro
-- explícito em vez de criar cupom genérico.
--
-- IDEMPOTENTE: ON CONFLICT (code) DO NOTHING. Se o cupom já existe,
-- não duplica. Pra atualizar, use a aba Cupons no admin (menu lateral).
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
--
-- DEPENDÊNCIA: rodar antes sql/elarah_coupons.sql.
-- =============================================================

do $$
declare
  v_exp_id uuid;
begin
  -- Busca o ID da experiência. Tolera "Pintura" + "Cristal" + "Aperol"
  -- em qualquer ordem/caixa. Se houver mais de 1 match, pega o mais recente.
  select id into v_exp_id
    from public.experiences
   where nome ilike '%pintura%cristal%aperol%'
      or nome ilike '%pintura de quadro%aperol%'
      or (nome ilike '%pintura%' and nome ilike '%cristal%')
   order by created_at desc nulls last
   limit 1;

  if v_exp_id is null then
    raise exception 'Experiência "Pintura de Quadro com Cristal & Aperol Spritz" não encontrada. Verifique se está cadastrada em public.experiences e tente de novo.';
  end if;

  insert into public.coupons (
    code,
    nome,
    descricao,
    discount_type,
    discount_value,
    experience_id,
    valid_from,
    valid_until,
    max_uses,
    is_active,
    metadata
  ) values (
    'PINTURA10',
    'Pintura — lista de interesse 10% OFF',
    'Ação focada em conversão pra leads que demonstraram interesse na 2ª edição. Disparo via WhatsApp com urgência (48h).',
    'percent',
    10,
    v_exp_id,
    now(),
    now() + interval '48 hours',
    50,                    -- ajuste o limite se precisar (NULL = ilimitado)
    true,
    jsonb_build_object(
      'campanha', 'pintura-lista-interesse-2026-04',
      'canal', 'whatsapp',
      'preco_cheio_centavos', 29900,
      'preco_com_desconto_centavos', 26910
    )
  )
  on conflict (code) do nothing;

  -- Confirmação visível nos logs do SQL Editor
  raise notice 'Cupom PINTURA10 criado/garantido para experiência %', v_exp_id;
end $$;

-- =====================================================
-- Confere o resultado
-- =====================================================
select
  c.code,
  c.nome,
  c.discount_type,
  c.discount_value,
  e.nome as experiencia,
  c.valid_until,
  c.max_uses,
  c.times_used,
  c.is_active
from public.coupons c
left join public.experiences e on e.id = c.experience_id
where c.code = 'PINTURA10';
