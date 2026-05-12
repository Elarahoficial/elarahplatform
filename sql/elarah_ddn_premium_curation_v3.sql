-- =============================================================
-- ELARAH — Curadoria DDN v3 (FIX: INSERT ON CONFLICT)
-- -------------------------------------------------------------
-- BUG do v2: o UPDATE só tocava em rows que JÁ ESTAVAM em
-- campaign_overrides. Das 15 top candidatas, só 3 estavam — as
-- outras 12 nem eram processadas.
--
-- v3: INSERT ON CONFLICT — cria override se não existe, atualiza
-- is_featured + display_order se existe. PRESERVA titulo_custom,
-- badge_text e imagem_custom já editados pelo admin (coalesce).
--
-- IDEMPOTENTE
-- =============================================================

-- 1. Reset is_featured em tudo da campanha
update public.campaign_overrides
set is_featured = false
where campaign_slug = 'dia-dos-namorados';


-- 2. Calcula top 15 candidatas
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
  from experiencias_com_slot_ddn d
),
top_15 as (
  select *,
    row_number() over (order by score desc, dias_distancia asc, nome) as rank
  from com_score
)
-- 3. INSERT ON CONFLICT — cria se não existe, atualiza se existe.
--    Preserva edições manuais do admin (titulo_custom, badge_text,
--    imagem_custom) usando coalesce no DO UPDATE.
insert into public.campaign_overrides
  (campaign_slug, experience_id, titulo_custom, badge_text, is_featured, display_order)
select
  'dia-dos-namorados',
  r.experience_id,
  -- Sugestão de título por categoria (admin pode trocar)
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
  -- titulo_custom / badge_text / imagem_custom NÃO sobrescritos —
  -- admin pode ter editado e queremos preservar


-- =============================================================
-- Sanity check — DEVE retornar 15 linhas
-- =============================================================
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
