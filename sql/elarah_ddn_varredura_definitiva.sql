-- =============================================================
-- ELARAH — VARREDURA DEFINITIVA: tudo sobre categorias DDN
-- -------------------------------------------------------------
-- Roda esta query única. Retorna 1 linha por experiência das
-- categorias estratégicas, mostrando TUDO que precisamos saber:
--
-- - slots ativos na janela 25/05-25/06
-- - slots com is_active=null (bug #5)
-- - slots com event_at fora da janela
-- - slots com event_at NULL
-- - se tem experiences.event_at OU experiences.data textual
-- - status final: APARECE / FORA JANELA / SEM DATA / INATIVA
-- =============================================================

with categoria_filtro as (
  select id from public.experiences where is_active is true
    and (
      lower(categoria) like '%bartender%'
      or lower(categoria) like '%gastronom%'
      or lower(categoria) like '%pintura%'
      or lower(categoria) like '%vela%'
      or lower(categoria) like '%cer%mic%'
      or lower(categoria) like '%floral%'
      or lower(categoria) like '%macram%'
      or lower(categoria) like '%perfumaria%'
      or lower(categoria) like '%sabonete%'
      or lower(categoria) like '%bem%estar%'
      or lower(categoria) like '%aromaterapia%'
      or lower(categoria) like '%originals%'
      or lower(categoria) like '%beadazz%'
      or lower(categoria) like '%joalh%'
    )
)
select
  e.nome,
  e.categoria,
  e.is_active as exp_ativa,
  e.data as exp_data_texto,
  e.event_at as exp_event_at,
  -- Slots
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id) as total_slots,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.is_active is true) as slots_active_true,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.is_active is null) as slots_active_null,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.is_active is false) as slots_active_false,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.event_at is null) as slots_sem_event_at,
  -- Slots NA janela (25/05-25/06)
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25 00:00:00+00'::timestamptz
      and s.event_at <  '2026-06-25 23:59:59+00'::timestamptz
      and s.is_active is not false) as slots_na_janela_completos,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25 00:00:00+00'::timestamptz
      and s.event_at <  '2026-06-25 23:59:59+00'::timestamptz
      and s.is_active is not false
      and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
  ) as slots_na_janela_com_vagas,
  (select min(s.event_at) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25 00:00:00+00'::timestamptz
      and s.event_at <  '2026-06-25 23:59:59+00'::timestamptz
      and s.is_active is not false
      and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
  ) as primeira_data_na_janela,
  -- Verdict
  case
    when e.is_active is false then '❌ EXP INATIVA'
    when (select count(*) from public.experience_slots s
            where s.experience_id = e.id
              and s.event_at >= '2026-05-25 00:00:00+00'::timestamptz
              and s.event_at <  '2026-06-25 23:59:59+00'::timestamptz
              and s.is_active is not false
              and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
         ) > 0 then '✅ APARECE'
    when (select count(*) from public.experience_slots s
            where s.experience_id = e.id) = 0 then '⚠ SEM SLOT NENHUM'
    when (select count(*) from public.experience_slots s
            where s.experience_id = e.id and s.event_at is null) > 0
         and (select count(*) from public.experience_slots s
                where s.experience_id = e.id and s.event_at is not null) = 0
         then '⚠ SLOTS SEM event_at'
    when (select count(*) from public.experience_slots s
            where s.experience_id = e.id and s.is_active is false) > 0
         and (select count(*) from public.experience_slots s
                where s.experience_id = e.id and s.is_active is not false) = 0
         then '⚠ TODOS SLOTS INATIVOS'
    else '⚠ FORA DA JANELA'
  end as status
from public.experiences e
where e.id in (select id from categoria_filtro)
order by e.categoria, e.nome;
