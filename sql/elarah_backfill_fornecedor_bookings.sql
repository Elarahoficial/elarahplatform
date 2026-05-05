-- =============================================================
-- ELARAH — Backfill: preenche dados de fornecedor + repasse em
-- bookings pagas que ficaram sem esses campos.
--
-- Regra padrão da Elarah: fornecedor recebe 70% do valor cheio,
-- comissão Elarah é 30%. Esse arquivo NÃO usa percentual_repasse
-- da experiência — usa 70/30 fixo intencionalmente.
--
-- Rode UMA VEZ no SQL Editor do Supabase.
-- Idempotente: pode rodar de novo sem efeito colateral.
-- =============================================================

-- ===== 1. fornecedor_nome / fornecedor_id =====
-- Preenche a partir da experiência associada. Para o nome usa, na
-- ordem: experiences.fornecedor_nome → profile.partner_data->>'marca'
-- → profile.nome → 'Desconhecido'.
update public.bookings b
   set fornecedor_nome = coalesce(
         nullif(trim(e.fornecedor_nome), ''),
         nullif(p.partner_data ->> 'marca', ''),
         nullif(p.nome, ''),
         'Desconhecido'
       ),
       fornecedor_id = coalesce(b.fornecedor_id, e.created_by)
  from public.experiences e
  left join public.profiles p on p.id = e.created_by
 where b.experiencia_id = e.id
   and b.status = 'pago'
   and (b.fornecedor_nome is null or trim(b.fornecedor_nome) = '');

-- ===== 2. valor_cheio_centavos =====
-- Se o booking não tem valor cheio gravado, usa o cadastrado na
-- experiência multiplicado pela quantidade. Se a experiência também
-- não tem, deixa como está — admin completa manualmente.
update public.bookings b
   set valor_cheio_centavos = e.valor_cheio_centavos * coalesce(b.quantidade, 1)
  from public.experiences e
 where b.experiencia_id = e.id
   and b.status = 'pago'
   and b.valor_cheio_centavos is null
   and e.valor_cheio_centavos is not null
   and e.valor_cheio_centavos > 0;

-- ===== 3. valor_repasse_centavos = 70% do valor cheio =====
-- Se não tem valor cheio, usa amount_total como base.
update public.bookings b
   set valor_repasse_centavos = round(
         coalesce(b.valor_cheio_centavos, b.amount_total) * 0.70
       )
 where b.status = 'pago'
   and b.valor_repasse_centavos is null
   and (b.valor_cheio_centavos is not null or b.amount_total is not null);

-- ===== 4. valor_comissao_centavos = 30% do valor cheio =====
update public.bookings b
   set valor_comissao_centavos = round(
         coalesce(b.valor_cheio_centavos, b.amount_total) * 0.30
       )
 where b.status = 'pago'
   and b.valor_comissao_centavos is null
   and (b.valor_cheio_centavos is not null or b.amount_total is not null);

-- ===== 5. status_fornecedor =====
-- Coluna tem default 'repasse_pendente' do schema, mas se algum
-- booking antigo ficou com null por qualquer razão, normaliza.
update public.bookings
   set status_fornecedor = 'repasse_pendente'
 where status = 'pago'
   and status_fornecedor is null;

-- ===== Diagnóstico (opcional, descomente pra verificar) =====
-- select count(*) as bookings_pagas_total,
--        count(*) filter (where fornecedor_nome is null or trim(fornecedor_nome)='') as sem_fornecedor,
--        count(*) filter (where valor_repasse_centavos is null) as sem_repasse,
--        count(*) filter (where status_fornecedor = 'repasse_pendente') as repasse_pendente,
--        count(*) filter (where status_fornecedor = 'repasse_feito') as repasse_feito
--   from public.bookings
--  where status = 'pago';
