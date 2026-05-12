-- =============================================================
-- ELARAH — Curadoria DDN v4 (após backfill de event_at)
-- -------------------------------------------------------------
-- Roda DEPOIS do elarah_backfill_slots_event_at.sql.
-- Agora que ~100 slots têm event_at preenchido, a curadoria
-- vai pegar todas as experiências reais da janela 25/05-25/06.
--
-- Mantém top 15 por score, com INSERT ON CONFLICT (cria
-- override pra experiências que ainda não estão).
-- =============================================================

-- 1. Reset is_featured
update public.campaign_overrides
set is_featured = false
where campaign_slug = 'dia-dos-namorados';


-- 2. Calcula top 15 (janela 25/05-25/06)
with experiencias_com_slot as (
  select distinct on (e.nome)
    e.id as experience_id,
    e.nome,
    e.categoria,
    s.event_at as proxima_data,
    abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp))/86400)::int as dias_distancia
  from public.experiences e
  join public.experience_slots s on s.experience_id = e.id
  where e.is_active is true
    and s.is_active is not false
    and s.event_at >= '2026-05-25 00:00:00+00'::timestamptz
    and s.event_at <  '2026-06-25 23:59:59+00'::timestamptz
    and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
  order by e.nome, abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp)))
),
com_score as (
  select d.*, (
    10 +
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
  from experiencias_com_slot d
),
top_15 as (
  select *, row_number() over (order by score desc, dias_distancia asc, nome) as rank
  from com_score
)
insert into public.campaign_overrides
  (campaign_slug, experience_id, titulo_custom, badge_text, is_featured, display_order)
select
  'dia-dos-namorados',
  r.experience_id,
  case
    when lower(r.categoria) like '%bartender%' then 'Workshop de Coquetelaria a Dois'
    when lower(r.categoria) like '%pintura%' then r.nome || ' — Especial Dia dos Namorados'
    when lower(r.categoria) like '%vela%' then r.nome || ' — Aroma da Memória'
    when lower(r.categoria) like '%cer%mic%' then r.nome || ' — Edição Casal'
    when lower(r.categoria) like '%floral%' then r.nome || ' a Dois'
    when lower(r.categoria) like '%gastronom%' then r.nome || ' — Jantar a Dois'
    else r.nome
  end,
  'Especial Dia dos Namorados',
  true,
  r.rank * 10
from top_15 r
where r.rank <= 15
on conflict (campaign_slug, experience_id) do update set
  is_featured = excluded.is_featured,
  display_order = excluded.display_order;


-- =============================================================
-- Confirma: deve retornar 15
-- =============================================================
select count(*) as featured_count
from public.campaign_overrides
where campaign_slug = 'dia-dos-namorados' and is_featured;
