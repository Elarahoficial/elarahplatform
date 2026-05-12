-- =============================================================
-- ELARAH — Diagnóstico: por que só 3 entraram?
-- -------------------------------------------------------------
-- Read-only. Mostra o que aconteceu com a curadoria.
-- =============================================================

-- 1. Contagem geral de experiências
select
  count(*) filter (where is_active) as ativas,
  count(*) filter (
    where is_active and exists (
      select 1 from public.experience_slots s
       where s.experience_id = experiences.id
         and s.is_active
         and s.event_at >= '2026-05-21'::timestamp
         and s.event_at < '2026-07-01'::timestamp
    )
  ) as com_slot_janela_estreita,
  count(*) filter (
    where is_active and exists (
      select 1 from public.experience_slots s
       where s.experience_id = experiences.id
         and s.is_active
         and s.event_at >= '2026-05-14'::timestamp
         and s.event_at < '2026-07-06'::timestamp
    )
  ) as com_slot_janela_estendida
from public.experiences;


-- 2. Candidatas + score (top 30 pra ver a distribuição)
with candidatas as (
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
    and s.event_at >= '2026-05-21'::timestamp
    and s.event_at < '2026-07-01'::timestamp
    and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
  order by e.nome, abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp)))
),
com_score as (
  select
    c.*,
    (
      case when lower(c.nome) ~ 'ta[çc]a' then 100 else 0 end +
      case when lower(c.nome) ~ 'wine|vinho' then 100 else 0 end +
      case when lower(c.nome) ~ 'drinks?' then 80 else 0 end +
      case when lower(c.nome) ~ 'coquetel|negroni|gin' then 70 else 0 end +
      case when lower(c.nome) ~ 'harmoniza' then 80 else 0 end +
      case when lower(c.nome) ~ 'pintura em t[ae]l' then 60 else 0 end +
      case when lower(c.nome) ~ 'torno|cer[âa]mica' then 70 else 0 end +
      case when lower(c.nome) ~ 'vela aromatic|vela arom[áa]tica' then 60 else 0 end +
      case when lower(c.nome) ~ 'macar|chocolate|brigad' then 50 else 0 end +
      case when lower(c.nome) ~ 'massa|nhoque|risotto|risoto' then 50 else 0 end +
      case when lower(c.nome) ~ 'sushi|izakaya|japonesa' then 55 else 0 end +
      case when lower(c.nome) ~ 'flore|floral|buqu[êe]' then 50 else 0 end +
      case when lower(c.nome) ~ 'crochet|crochê|macram[êe]|tufting' then 30 else 0 end +
      case when lower(c.nome) ~ 'sabonete|perfume|aromaterapia' then 35 else 0 end +
      case
        when lower(c.categoria) like '%bartender%' then 50
        when lower(c.categoria) like '%pintura%' then 50
        when lower(c.categoria) like '%vela%' then 40
        when lower(c.categoria) like '%cer%mic%' then 50
        when lower(c.categoria) like '%gastronom%' then 35
        when lower(c.categoria) like '%floral%' then 30
        else 10
      end +
      greatest(0, 30 - c.dias_distancia) +
      case when lower(c.nome) like '%dia das m%' then -200 else 0 end +
      case when length(c.nome) > 60 then -20 else 0 end
    ) as score
  from candidatas c
)
select
  to_char(proxima_data, 'DD/MM') as data,
  categoria, nome, score,
  case when score > 0 then '✓ entraria' else '✗ score zero' end as status
from com_score
order by score desc, data asc
limit 30;
