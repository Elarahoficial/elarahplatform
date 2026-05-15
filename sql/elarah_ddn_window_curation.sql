-- =============================================================
-- ELARAH — Curadoria com janela estratégica do Dia dos Namorados
-- -------------------------------------------------------------
-- Janela = 21/05 a 30/06 do ano corrente.
-- (Dia dos Namorados é 12/06 — pegamos 3 semanas antes até
-- ~3 semanas depois pra cobrir compra antecipada e pós-data.)
--
-- LÓGICA
--   1. Limpa is_featured (false em TUDO da campanha)
--   2. Marca is_featured = true SOMENTE em experiências que têm
--      slot ou event_at DENTRO da janela (21/05–30/06)
--   3. Top 2 por categoria — diversidade > quantidade
--
-- IDEMPOTENTE
--   Pode rodar várias vezes. Recalcula based no estado atual de
--   slots disponíveis dentro da janela.
--
-- AJUSTES ANUAIS
--   Janela hardcoded pra 2026. Em 2027, ajustar as datas no início
--   do arquivo OU criar nova campanha 'dia-dos-namorados-2027'.
-- =============================================================

-- Janela estratégica fixa
-- (DDN sempre dia 12/06 — janela 21/05 a 30/06)
do $$ begin perform 1; end $$;  -- noop, só pra deixar a doc visível

-- Reset: desmarca todas
update public.campaign_overrides
set is_featured = false
where campaign_slug = 'dia-dos-namorados';


-- Curadoria automática com janela DDN
with janela as (
  select
    '2026-05-21'::timestamp as ddn_inicio,
    '2026-07-01'::timestamp as ddn_fim
),
experiencias_na_janela as (
  select
    e.id as experience_id,
    e.nome,
    e.categoria,
    -- Menor data dentro da janela (slot ou event_at direto)
    least(
      (select min(s.event_at)
         from public.experience_slots s, janela j
         where s.experience_id = e.id
           and s.is_active = true
           and s.event_at >= j.ddn_inicio
           and s.event_at < j.ddn_fim
           and (
             s.vagas_total is null
             or s.vagas_restantes is null
             or s.vagas_restantes > 0
           )
      ),
      (select e.event_at
         from janela j
         where e.event_at is not null
           and e.event_at >= j.ddn_inicio
           and e.event_at < j.ddn_fim
      )
    ) as proxima_data
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
      order by d.proxima_data asc, d.nome
    ) as rank_in_cat
  from experiencias_na_janela d
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
-- select
--   o.display_order,
--   e.categoria,
--   o.titulo_custom,
--   (select min(s.event_at)
--      from public.experience_slots s
--      where s.experience_id = e.id
--        and s.is_active = true
--        and s.event_at >= '2026-05-21'
--        and s.event_at < '2026-07-01'
--   ) as proxima_data_na_janela
-- from public.campaign_overrides o
-- join public.experiences e on e.id = o.experience_id
-- where o.campaign_slug = 'dia-dos-namorados'
--   and o.is_featured = true
-- order by o.display_order;
--
-- Esperado: até 12 linhas (2 por categoria das 6 principais),
-- TODAS com proxima_data_na_janela preenchida (entre 21/05 e 30/06).
-- =============================================================
