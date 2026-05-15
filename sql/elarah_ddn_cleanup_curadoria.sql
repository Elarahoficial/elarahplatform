-- =============================================================
-- ELARAH — Cleanup da curadoria Dia dos Namorados
-- -------------------------------------------------------------
-- Objetivo: deixar a landing realmente CURADA, não catalogada.
--
--   1. Desmarca is_featured de TODOS os overrides da campanha.
--      Admin marca individualmente no painel quais aparecem.
--
--   2. Limpa títulos custom — remove resíduos de campanhas
--      antigas tipo ": Especial Dia das Mães (1 pessoa)" do nome
--      base ANTES de aplicar o sufixo da campanha.
--
-- IDEMPOTENTE
--   Pode rodar várias vezes. Atualiza todos os overrides existentes.
--
-- NÃO TOCA EM
--   - experiences (nome global preservado)
--   - campaign_upcoming_experiences
--   - campaign_waitlist
-- =============================================================

update public.campaign_overrides o
set
  is_featured = false,
  titulo_custom =
    case
      when lower(e.categoria) like '%bartender%' then
        'Workshop de Coquetelaria a Dois'
      when lower(e.categoria) like '%vela%' then
        trim(
          regexp_replace(
            regexp_replace(e.nome, ':?\s*Especial Dia das M[ãa]es\s*\(1 pessoa\)', '', 'g'),
            ':?\s*Especial Dia das M[ãa]es', '', 'g'
          )
        ) || ' — Aroma da Memória'
      when lower(e.categoria) like '%pintura%' then
        trim(
          regexp_replace(
            regexp_replace(e.nome, ':?\s*Especial Dia das M[ãa]es\s*\(1 pessoa\)', '', 'g'),
            ':?\s*Especial Dia das M[ãa]es', '', 'g'
          )
        ) || ' — Especial Dia dos Namorados'
      when lower(e.categoria) like '%cer%mic%' then
        trim(
          regexp_replace(
            regexp_replace(e.nome, ':?\s*Especial Dia das M[ãa]es\s*\(1 pessoa\)', '', 'g'),
            ':?\s*Especial Dia das M[ãa]es', '', 'g'
          )
        ) || ' — Edição Casal'
      when lower(e.categoria) like '%floral%' then
        trim(
          regexp_replace(
            regexp_replace(e.nome, ':?\s*Especial Dia das M[ãa]es\s*\(1 pessoa\)', '', 'g'),
            ':?\s*Especial Dia das M[ãa]es', '', 'g'
          )
        ) || ' a Dois'
      when lower(e.categoria) like '%gastronom%' then
        trim(
          regexp_replace(
            regexp_replace(e.nome, ':?\s*Especial Dia das M[ãa]es\s*\(1 pessoa\)', '', 'g'),
            ':?\s*Especial Dia das M[ãa]es', '', 'g'
          )
        ) || ' — Jantar a Dois'
      else
        trim(
          regexp_replace(
            regexp_replace(e.nome, ':?\s*Especial Dia das M[ãa]es\s*\(1 pessoa\)', '', 'g'),
            ':?\s*Especial Dia das M[ãa]es', '', 'g'
          )
        )
    end
from public.experiences e
where o.experience_id = e.id
  and o.campaign_slug = 'dia-dos-namorados';


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
--   select
--     (select count(*) from public.campaign_overrides where campaign_slug='dia-dos-namorados') as total,
--     (select count(*) from public.campaign_overrides where campaign_slug='dia-dos-namorados' and is_featured) as featured;
--
-- Esperado depois do cleanup:
--   total = 96 (intocado — todos ainda estão na lista)
--   featured = 0 (admin marca manualmente quais entram na landing)
-- =============================================================
