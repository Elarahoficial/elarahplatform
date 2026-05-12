-- =============================================================
-- ELARAH — Curadoria INTELIGENTE Dia dos Namorados
-- -------------------------------------------------------------
-- Marca is_featured=true automaticamente nas experiências que:
--   1. TÊM slots disponíveis entre 25/05 e 25/06 (semana antes/depois)
--   2. Pertencem às categorias-chave pra casal/date
--   3. Não estão esgotadas
--
-- ESTRATÉGIA
--   Pega TOP 2 por categoria principal — diversidade > quantidade.
--   Resultado: ~12 experiências balanceadas (Bartenderia, Pintura,
--   Vela, Gastronomia, Cerâmica, Floral).
--
-- ORDENAÇÃO
--   display_order = cat_priority * 100 + rank_dentro_categoria
--   Garante que as categorias aparecem ordenadas e dentro de cada
--   categoria, a de data mais próxima vem primeiro.
--
-- IDEMPOTENTE
--   Pode rodar várias vezes — recalcula based no estado atual de
--   slots disponíveis.
--
-- ⚠️ ATENÇÃO
--   Reset SUAS escolhas manuais. Se você marcou/desmarcou featured
--   no admin, rodar este SQL sobrescreve com base no algoritmo.
--   Recomendado: rodar UMA vez como ponto de partida, depois
--   ajustar manualmente no admin.
-- =============================================================

-- Limpa featured atuais (do cleanup anterior — já deveriam estar false)
update public.campaign_overrides
set is_featured = false
where campaign_slug = 'dia-dos-namorados';

-- Encontra experiências com disponibilidade no período + ranqueia
with experiencias_disponiveis as (
  select
    e.id as experience_id,
    e.nome,
    e.categoria,
    -- Próxima data disponível no período
    (
      select min(s.event_at)
      from public.experience_slots s
      where s.experience_id = e.id
        and s.is_active = true
        and s.event_at >= (current_date)::timestamp
        and s.event_at <= (current_date + interval '45 days')
        and (
          s.vagas_total is null
          or s.vagas_restantes is null
          or s.vagas_restantes > 0
        )
    ) as proxima_data,
    -- Slots totais no período (indica quão "viva" a experiência está)
    (
      select count(*)
      from public.experience_slots s
      where s.experience_id = e.id
        and s.is_active = true
        and s.event_at >= (current_date)::timestamp
        and s.event_at <= (current_date + interval '45 days')
        and (
          s.vagas_total is null
          or s.vagas_restantes is null
          or s.vagas_restantes > 0
        )
    ) as slots_periodo
  from public.experiences e
  where e.is_active = true
),
ranqueado as (
  select
    d.*,
    case
      when lower(d.categoria) like '%bartender%' then 1
      when lower(d.categoria) like '%pintura%' then 2
      when lower(d.categoria) like '%vela%' then 3
      when lower(d.categoria) like '%gastronom%' then 4
      when lower(d.categoria) like '%cer%mic%' then 5
      when lower(d.categoria) like '%floral%' then 6
      else 99
    end as cat_priority,
    row_number() over (
      partition by case
        when lower(d.categoria) like '%bartender%' then 1
        when lower(d.categoria) like '%pintura%' then 2
        when lower(d.categoria) like '%vela%' then 3
        when lower(d.categoria) like '%gastronom%' then 4
        when lower(d.categoria) like '%cer%mic%' then 5
        when lower(d.categoria) like '%floral%' then 6
        else 99
      end
      order by d.proxima_data asc nulls last, d.slots_periodo desc, d.nome
    ) as rank_in_cat
  from experiencias_disponiveis d
  where d.proxima_data is not null
)
update public.campaign_overrides o
set
  is_featured = true,
  display_order = r.cat_priority * 100 + r.rank_in_cat
from ranqueado r
where o.experience_id = r.experience_id
  and o.campaign_slug = 'dia-dos-namorados'
  and r.cat_priority < 99
  and r.rank_in_cat <= 2;


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
-- Vê o resultado da curadoria automática:
--
-- select
--   o.display_order,
--   e.categoria,
--   o.titulo_custom,
--   (
--     select min(s.event_at)
--     from public.experience_slots s
--     where s.experience_id = e.id
--       and s.is_active = true
--       and s.event_at >= now()
--       and s.event_at <= now() + interval '45 days'
--   ) as proxima_data
-- from public.campaign_overrides o
-- join public.experiences e on e.id = o.experience_id
-- where o.campaign_slug = 'dia-dos-namorados'
--   and o.is_featured = true
-- order by o.display_order;
--
-- Esperado: ~12 linhas (2 por categoria das 6 principais), ordenadas
-- por categoria e depois por data mais próxima.
-- =============================================================
