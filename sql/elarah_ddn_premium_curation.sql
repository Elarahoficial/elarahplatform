-- =============================================================
-- ELARAH — Curadoria PREMIUM Dia dos Namorados
-- -------------------------------------------------------------
-- Curadoria de verdade: scoring por palavra-chave + categoria +
-- proximidade ao DDN + dedup de nomes repetidos.
--
-- LÓGICA
--   1. Reset is_featured em tudo
--   2. Calcula score pra cada experiência:
--      - Bonus por keywords premium ("taça", "vela aromática", "drinks",
--        "wine", "torno", "harmonização", etc.)
--      - Bonus por categoria romântica
--      - Bonus se tem slot na janela DDN (21/05–30/06)
--   3. Dedup: DISTINCT ON (nome) — só 1 por nome único, escolhendo
--      o com slot mais próximo de 12/06
--   4. Marca is_featured = true nas 15 com maior score
--   5. display_order ordenado por score desc
--
-- JANELA ESTRATÉGICA
--   Slots considerados: 21/05/2026 a 30/06/2026 (3 semanas antes/depois)
--
-- IDEMPOTENTE
-- =============================================================

-- 1. Reset
update public.campaign_overrides
set is_featured = false
where campaign_slug = 'dia-dos-namorados';


-- 2. Pra cada nome único (dedup), pega a experiência com slot
--    mais próximo de 12/06 e calcula score
with experiencias_com_slot_ddn as (
  select distinct on (e.nome)
    e.id as experience_id,
    e.nome,
    e.categoria,
    e.descricao,
    s.event_at as proxima_data,
    -- Distância em dias até 12/06 (menor = melhor)
    abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp))/86400)::int as dias_distancia
  from public.experiences e
  join public.experience_slots s on s.experience_id = e.id
  where e.is_active = true
    and s.is_active = true
    and s.event_at >= '2026-05-21'::timestamp
    and s.event_at < '2026-07-01'::timestamp
    and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
  order by e.nome, abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp)))
),
com_score as (
  select
    d.*,
    (
      -- Keywords premium pra casal/romântico (forte intenção de date)
      case when lower(d.nome) ~ 'ta[çc]a' then 100 else 0 end +
      case when lower(d.nome) ~ 'wine|vinho' then 100 else 0 end +
      case when lower(d.nome) ~ 'drinks?' then 80 else 0 end +
      case when lower(d.nome) ~ 'coquetel|negroni|gin' then 70 else 0 end +
      case when lower(d.nome) ~ 'harmoniza' then 80 else 0 end +
      case when lower(d.nome) ~ 'pintura em t[ae]l' then 60 else 0 end +
      case when lower(d.nome) ~ 'torno|cer[âa]mica' then 70 else 0 end +
      case when lower(d.nome) ~ 'vela aromatic|vela arom[áa]tica' then 60 else 0 end +
      case when lower(d.nome) ~ 'macar|chocolate|brigad' then 50 else 0 end +
      case when lower(d.nome) ~ 'massa|nhoque|risotto|risoto' then 50 else 0 end +
      case when lower(d.nome) ~ 'sushi|izakaya|japonesa' then 55 else 0 end +
      case when lower(d.nome) ~ 'flore|floral|buqu[êe]' then 50 else 0 end +
      case when lower(d.nome) ~ 'crochet|crochê|macram[êe]|tufting' then 30 else 0 end +
      case when lower(d.nome) ~ 'sabonete|perfume|aromaterapia' then 35 else 0 end +
      -- Categoria score (base por categoria)
      case
        when lower(d.categoria) like '%bartender%' then 50
        when lower(d.categoria) like '%pintura%' then 50
        when lower(d.categoria) like '%vela%' then 40
        when lower(d.categoria) like '%cer%mic%' then 50
        when lower(d.categoria) like '%gastronom%' then 35
        when lower(d.categoria) like '%floral%' then 30
        else 10
      end +
      -- Proximidade ao 12/06: até +30 pontos
      greatest(0, 30 - d.dias_distancia) +
      -- Penaliza nomes com resíduo de campanhas antigas
      case when lower(d.nome) like '%dia das m%' then -200 else 0 end +
      -- Penaliza nomes muito longos ou estranhos
      case when length(d.nome) > 60 then -20 else 0 end
    ) as score
  from experiencias_com_slot_ddn d
),
ranqueado as (
  select
    *,
    row_number() over (order by score desc, dias_distancia asc) as rank
  from com_score
  where score > 0
)
-- 3. Aplica curadoria: top 15 viram featured
update public.campaign_overrides o
set
  is_featured = true,
  display_order = r.rank * 10
from ranqueado r
where o.experience_id = r.experience_id
  and o.campaign_slug = 'dia-dos-namorados'
  and r.rank <= 15;


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
-- Vê as 15 que entraram + score + próxima data:
--
-- with rec as (
--   select o.experience_id, o.titulo_custom, o.display_order, e.categoria,
--          (select min(s.event_at) from public.experience_slots s
--             where s.experience_id = e.id and s.is_active
--               and s.event_at >= '2026-05-21' and s.event_at < '2026-07-01'
--             ) as proxima_data
--   from public.campaign_overrides o
--   join public.experiences e on e.id = o.experience_id
--   where o.campaign_slug = 'dia-dos-namorados' and o.is_featured
-- )
-- select * from rec order by display_order;
--
-- Esperado: 15 linhas, datas todas entre 21/05 e 30/06, mix
-- de categorias (drinks/pintura/cerâmica/vela/gastronomia/floral).
-- =============================================================
