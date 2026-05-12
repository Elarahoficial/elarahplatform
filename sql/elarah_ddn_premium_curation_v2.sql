-- =============================================================
-- ELARAH — Curadoria DDN v2 (relaxada: 15 garantidas)
-- -------------------------------------------------------------
-- v1 marcou só 3 porque o filtro `score > 0` era estrito.
-- v2:
--   - Janela ampliada: 14/05 a 06/07 (60 dias em torno do 12/06)
--   - REMOVE filtro `score > 0` — qualquer experiência com slot
--     na janela é candidata
--   - Score base 10 pra qualquer experiência (sempre positivo)
--   - Top 15 GARANTIDAS por score desc
--
-- IDEMPOTENTE — pode rodar várias vezes.
-- =============================================================

-- 1. Reset
update public.campaign_overrides
set is_featured = false
where campaign_slug = 'dia-dos-namorados';


-- 2. Curadoria v2
with experiencias_com_slot_ddn as (
  select distinct on (e.nome)
    e.id as experience_id,
    e.nome,
    e.categoria,
    s.event_at as proxima_data,
    abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp))/86400)::int as dias_distancia
  from public.experiences e
  join public.experience_slots s on s.experience_id = e.id
  where e.is_active = true
    and s.is_active = true
    and s.event_at >= '2026-05-14'::timestamp
    and s.event_at < '2026-07-06'::timestamp
    and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
  order by e.nome, abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp)))
),
com_score as (
  select
    d.*,
    (
      10 +   -- score base: qualquer experiência com slot na janela passa
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
      case
        when lower(d.categoria) like '%bartender%' then 50
        when lower(d.categoria) like '%pintura%' then 50
        when lower(d.categoria) like '%vela%' then 40
        when lower(d.categoria) like '%cer%mic%' then 50
        when lower(d.categoria) like '%gastronom%' then 35
        when lower(d.categoria) like '%floral%' then 30
        else 10
      end +
      greatest(0, 30 - d.dias_distancia) +
      case when lower(d.nome) like '%dia das m%' then -200 else 0 end +
      case when length(d.nome) > 60 then -20 else 0 end
    ) as score
  from experiencias_com_slot_ddn d
),
ranqueado as (
  select *,
    row_number() over (order by score desc, dias_distancia asc, nome) as rank
  from com_score
)
-- 3. Top 15 GARANTIDAS
update public.campaign_overrides o
set
  is_featured = true,
  display_order = r.rank * 10
from ranqueado r
where o.experience_id = r.experience_id
  and o.campaign_slug = 'dia-dos-namorados'
  and r.rank <= 15;


-- =============================================================
-- Sanity check — DEVE retornar 15 linhas
-- -------------------------------------------------------------
select
  o.display_order,
  e.categoria,
  o.titulo_custom,
  (select min(s.event_at) from public.experience_slots s
     where s.experience_id = e.id and s.is_active
       and s.event_at >= '2026-05-14' and s.event_at < '2026-07-06'
  ) as proxima_data
from public.campaign_overrides o
join public.experiences e on e.id = o.experience_id
where o.campaign_slug = 'dia-dos-namorados' and o.is_featured
order by o.display_order;
-- =============================================================
