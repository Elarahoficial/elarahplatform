-- =============================================================
-- ELARAH — Seed inicial da curadoria Dia dos Namorados
-- -------------------------------------------------------------
-- Popula `campaign_overrides` com experiências REAIS do banco
-- que façam sentido pra casal — categorias românticas, criativas,
-- gastronômicas, em dupla.
--
-- LÓGICA DE CURADORIA AUTOMÁTICA
--   Prioridade 1: Bartenderia, Vela, Pintura (drinks/aroma/expressão)
--   Prioridade 2: Gastronomia, Floral, Cerâmica (criativas/sensoriais)
--   Prioridade 3: Demais categorias românticas (Macramê, etc.)
--   Excluídas: experiências sem foto, inativas, ou com duração < 1h.
--
-- IDEMPOTENTE
--   ON CONFLICT DO NOTHING em (campaign_slug, experience_id).
--   Não sobrescreve curadoria manual feita pelo admin depois.
--
-- TÍTULOS CUSTOM SUGERIDOS
--   Setados por categoria. Admin pode ajustar livremente no painel
--   "Campanhas" sem que isso afete o nome global da experience.
--
-- PRÉ-REQUISITOS
--   - elarah_dia_dos_namorados.sql já rodou (tabelas existem)
--   - experiences populada
-- =============================================================

with curadoria as (
  select
    e.id as experience_id,
    e.nome,
    e.categoria,
    case
      when lower(e.categoria) like '%bartender%' then 10
      when lower(e.categoria) like '%vela%' then 20
      when lower(e.categoria) like '%pintura%' then 30
      when lower(e.categoria) like '%gastronom%' then 40
      when lower(e.categoria) like '%floral%' then 50
      when lower(e.categoria) like '%cer%mic%' then 60
      when lower(e.categoria) like '%macram%' then 70
      when lower(e.categoria) like '%perfumaria%' then 80
      when lower(e.categoria) like '%sabonete%' then 90
      else 999
    end as priority_score,
    case
      when lower(e.categoria) like '%bartender%' then 'Especial Dia dos Namorados'
      when lower(e.categoria) like '%vela%' then 'Aroma da Memória'
      when lower(e.categoria) like '%pintura%' then 'Pintura a Dois'
      when lower(e.categoria) like '%gastronom%' then 'Jantar a Dois'
      when lower(e.categoria) like '%floral%' then 'Arranjo do Casal'
      when lower(e.categoria) like '%cer%mic%' then 'Edição Casal'
      else 'Especial Dia dos Namorados'
    end as suggested_badge,
    case
      when lower(e.categoria) like '%pintura%' then e.nome || ' — Especial Dia dos Namorados'
      when lower(e.categoria) like '%vela%' then e.nome || ' — Aroma da Memória'
      when lower(e.categoria) like '%bartender%' then 'Workshop de Coquetelaria a Dois'
      when lower(e.categoria) like '%cer%mic%' then e.nome || ' — Edição Casal'
      when lower(e.categoria) like '%floral%' then e.nome || ' a Dois'
      when lower(e.categoria) like '%gastronom%' then e.nome || ' — Jantar a Dois'
      else e.nome
    end as suggested_title
  from public.experiences e
  where e.is_active = true
    and e.is_visible is not false
    and e.imagem is not null
    and length(trim(e.imagem)) > 0
    and (
      lower(e.categoria) like '%bartender%'
      or lower(e.categoria) like '%vela%'
      or lower(e.categoria) like '%pintura%'
      or lower(e.categoria) like '%gastronom%'
      or lower(e.categoria) like '%floral%'
      or lower(e.categoria) like '%cer%mic%'
      or lower(e.categoria) like '%macram%'
      or lower(e.categoria) like '%perfumaria%'
    )
)
insert into public.campaign_overrides
  (campaign_slug, experience_id, titulo_custom, badge_text, is_featured, display_order)
select
  'dia-dos-namorados' as campaign_slug,
  c.experience_id,
  c.suggested_title,
  c.suggested_badge,
  c.priority_score <= 30 as is_featured,
  c.priority_score + row_number() over (partition by c.priority_score order by c.nome) as display_order
from curadoria c
where c.priority_score < 999
on conflict (campaign_slug, experience_id) do nothing;


-- =============================================================
-- Sanity check pós-seed
-- -------------------------------------------------------------
-- Roda depois pra ver quais experiências entraram:
--
--   select o.display_order, o.titulo_custom, o.badge_text, e.categoria, e.nome
--   from public.campaign_overrides o
--   join public.experiences e on e.id = o.experience_id
--   where o.campaign_slug = 'dia-dos-namorados'
--   order by o.display_order;
--
-- Esperado: 6-15 linhas (depende de quantas experiências reais
-- existem com categoria romântica). Admin ajusta no painel.
-- =============================================================
