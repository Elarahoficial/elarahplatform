-- =============================================================
-- ELARAH — DIAGNÓSTICO de integridade da recorrência
-- -------------------------------------------------------------
-- READ-ONLY. Nenhuma query muda dados. Pode rodar em produção.
--
-- OBJETIVO
--   Detectar todas as inconsistências possíveis no fluxo de
--   recorrência ANTES de aplicar qualquer correção:
--
--   Q1. Slots com experience_id divergente da regra (BUG CRÍTICO
--       "espelhamento cross-experience")
--   Q2. Duplicidade textual de horario dentro da mesma
--       experiência+data (ex: "19h00 às 22h00" vs "19h00 – 22h00")
--   Q3. Regras colidindo dentro da mesma experiência (mesmo
--       weekday + mesmo horario_label)
--   Q4. Slots órfãos (recurrence_rule_id apontando pra regra
--       inexistente — não deveria existir por ON DELETE SET NULL,
--       mas vale checar)
--   Q5. Contagem de slots por regra vs esperado
--   Q6. Resumo executivo: total de slots afetados por categoria
--       de problema, com indicação do que cada PR-B vai mexer.
--
-- COMO USAR
--   Rode bloco a bloco no SQL Editor do Supabase. Cada query
--   retorna uma tabela; copie/cole o resultado de cada uma e
--   me mande. A Q6 é a mais importante — ela é o resumo que
--   precisa ficar zerado depois do PR-B.
-- =============================================================


-- =============================================================
-- Q1. CROSS-EXPERIENCE — slots cujo experience_id não bate com
--     o experience_id da regra que os gerou.
-- -------------------------------------------------------------
-- ESPERADO: 0 linhas. Se aparecer algo aqui, é o bug crítico
-- de espelhamento real e o trigger BEFORE INSERT do PR-B vai
-- impedir que aconteça de novo.
-- =============================================================
select
  s.id                       as slot_id,
  s.experience_id            as slot_experience_id,
  e_slot.nome                as slot_experience_nome,
  s.data, s.horario, s.event_at,
  s.recurrence_rule_id,
  r.experience_id            as rule_experience_id,
  e_rule.nome                as rule_experience_nome,
  s.vagas_total, s.vagas_restantes,
  (select count(*) from public.bookings b
    where b.slot_id = s.id and b.status in ('pending','pago')) as bookings_ativos
from public.experience_slots s
join public.experience_recurrence_rules r
       on r.id = s.recurrence_rule_id
join public.experiences e_slot on e_slot.id = s.experience_id
join public.experiences e_rule on e_rule.id = r.experience_id
where s.recurrence_rule_id is not null
  and s.experience_id <> r.experience_id;


-- =============================================================
-- Q2. DUPLICIDADE TEXTUAL — slots da mesma experiência+data
--     com horario textualmente diferente mas semanticamente
--     igual (ex: "19h00 às 22h00" vs "19h00 – 22h00").
-- -------------------------------------------------------------
-- Estratégia: normaliza o horario (lowercase, remove acentos,
-- substitui " às ", " as ", " a " por " – ", colapsa espaços)
-- e agrupa por (experience_id, data, horario_normalizado). Se
-- há mais de 1 valor distinto de horario nesse grupo, é
-- duplicidade textual.
--
-- ESPERADO: 0 linhas. Cada linha aqui vira um merge no PR-B.
-- =============================================================
with norm as (
  select
    s.id as slot_id,
    s.experience_id,
    s.data,
    s.horario as horario_original,
    -- normaliza:
    --   1) lower + unaccent simulado (substitui chars comuns)
    --   2) padroniza separador: " às ", " as ", " a " → " – "
    --   3) colapsa whitespace
    --   4) trim
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(translate(s.horario,
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc')),
          ' (às|as|a|—|-) ', ' – ', 'g'
        ),
        '\s+', ' ', 'g'
      ),
      '^\s+|\s+$', '', 'g'
    ) as horario_normalizado
  from public.experience_slots s
)
select
  n.experience_id,
  e.nome           as experience_nome,
  n.data,
  n.horario_normalizado,
  array_agg(distinct n.horario_original order by n.horario_original) as variantes,
  count(*)         as total_slots,
  count(distinct n.horario_original) as variantes_distintas
from norm n
join public.experiences e on e.id = n.experience_id
group by n.experience_id, e.nome, n.data, n.horario_normalizado
having count(distinct n.horario_original) > 1
order by e.nome, n.data;


-- =============================================================
-- Q3. REGRAS COLIDINDO — regras na mesma experiência com
--     interseção de weekdays e horario_label igual (ou
--     textualmente parecido).
-- -------------------------------------------------------------
-- ESPERADO: 0 linhas. Cada par aqui indica que o admin criou
-- regras redundantes que materializam slots em conflito.
-- =============================================================
select
  r1.experience_id,
  e.nome as experience_nome,
  r1.id as rule_a_id,
  r1.weekdays as rule_a_weekdays,
  r1.horario_label as rule_a_label,
  r1.is_active as rule_a_active,
  r2.id as rule_b_id,
  r2.weekdays as rule_b_weekdays,
  r2.horario_label as rule_b_label,
  r2.is_active as rule_b_active,
  r1.weekdays && r2.weekdays as weekday_overlap
from public.experience_recurrence_rules r1
join public.experience_recurrence_rules r2
       on r1.experience_id = r2.experience_id
      and r1.id < r2.id
      and r1.weekdays && r2.weekdays
join public.experiences e on e.id = r1.experience_id
where regexp_replace(
        regexp_replace(lower(r1.horario_label), ' (às|as|a|—|-) ', ' – ', 'g'),
        '\s+', ' ', 'g'
      )
      =
      regexp_replace(
        regexp_replace(lower(r2.horario_label), ' (às|as|a|—|-) ', ' – ', 'g'),
        '\s+', ' ', 'g'
      );


-- =============================================================
-- Q4. SLOTS ÓRFÃOS — recurrence_rule_id apontando pra regra
--     que não existe mais.
-- -------------------------------------------------------------
-- ESPERADO: 0 linhas (FK é ON DELETE SET NULL). Se aparecer,
-- é estado inconsistente do banco.
-- =============================================================
select
  s.id as slot_id,
  s.experience_id,
  e.nome as experience_nome,
  s.data, s.horario, s.event_at,
  s.recurrence_rule_id as fantasma_rule_id
from public.experience_slots s
left join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
join public.experiences e on e.id = s.experience_id
where s.recurrence_rule_id is not null
  and r.id is null;


-- =============================================================
-- Q5. CONTAGEM POR REGRA — quantos slots cada regra criou e
--     quantos seriam esperados pelo horizon × len(weekdays).
-- -------------------------------------------------------------
-- "Esperado" é uma estimativa (horizon_weeks × array_length).
-- Slots passados, cancelados (is_active=false) e exceções
-- (recurrence_rule_id manualmente desligado) explicam diferenças.
-- Use pra detectar regras "explosivas" que geraram MUITO mais
-- que o esperado.
-- =============================================================
select
  r.id as rule_id,
  e.nome as experience_nome,
  r.weekdays,
  r.horario_label,
  r.horizon_weeks,
  array_length(r.weekdays, 1) as qtd_dias,
  (r.horizon_weeks * array_length(r.weekdays, 1)) as esperado_aprox,
  (select count(*) from public.experience_slots s
    where s.recurrence_rule_id = r.id) as slots_atuais,
  (select count(*) from public.experience_slots s
    where s.recurrence_rule_id = r.id and s.event_at >= now()) as slots_futuros,
  (select count(*) from public.experience_slots s
    where s.recurrence_rule_id = r.id and s.is_active = false) as slots_canceladas_excecao,
  r.is_active as regra_ativa
from public.experience_recurrence_rules r
join public.experiences e on e.id = r.experience_id
order by e.nome, r.horario_label;


-- =============================================================
-- Q6. RESUMO EXECUTIVO — o número que precisa ficar ZERO depois
--     do PR-B. Esta é a query que vamos rodar de novo no fim.
-- =============================================================
with
  q1_cross_experience as (
    select count(*)::int as n from public.experience_slots s
    join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
    where s.recurrence_rule_id is not null
      and s.experience_id <> r.experience_id
  ),
  q2_duplicidade_textual as (
    with norm as (
      select s.experience_id, s.data,
        regexp_replace(
          regexp_replace(
            regexp_replace(lower(translate(s.horario,
              'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc')),
              ' (às|as|a|—|-) ', ' – ', 'g'),
            '\s+', ' ', 'g'),
          '^\s+|\s+$', '', 'g') as hn,
        s.horario
      from public.experience_slots s
    )
    select count(*)::int as n from (
      select experience_id, data, hn
      from norm
      group by experience_id, data, hn
      having count(distinct horario) > 1
    ) g
  ),
  q3_regras_colidindo as (
    select count(*)::int as n
    from public.experience_recurrence_rules r1
    join public.experience_recurrence_rules r2
      on r1.experience_id = r2.experience_id
     and r1.id < r2.id
     and r1.weekdays && r2.weekdays
    where regexp_replace(
            regexp_replace(lower(r1.horario_label), ' (às|as|a|—|-) ', ' – ', 'g'),
            '\s+', ' ', 'g')
          =
          regexp_replace(
            regexp_replace(lower(r2.horario_label), ' (às|as|a|—|-) ', ' – ', 'g'),
            '\s+', ' ', 'g')
  ),
  q4_slots_orfaos as (
    select count(*)::int as n from public.experience_slots s
    left join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
    where s.recurrence_rule_id is not null and r.id is null
  ),
  contagens_globais as (
    select
      (select count(*)::int from public.experience_recurrence_rules) as total_regras,
      (select count(*)::int from public.experience_recurrence_rules where is_active) as regras_ativas,
      (select count(*)::int from public.experience_slots) as total_slots,
      (select count(*)::int from public.experience_slots where recurrence_rule_id is not null) as slots_de_regra,
      (select count(*)::int from public.experience_slots where event_at >= now()) as slots_futuros,
      (select count(*)::int from public.bookings where status in ('pending','pago')) as bookings_ativos
  )
select
  (select n from q1_cross_experience) as cross_experience_BUG_CRITICO,
  (select n from q2_duplicidade_textual) as duplicidade_textual_grupos,
  (select n from q3_regras_colidindo) as regras_colidindo_pares,
  (select n from q4_slots_orfaos) as slots_orfaos,
  c.total_regras, c.regras_ativas,
  c.total_slots, c.slots_de_regra, c.slots_futuros, c.bookings_ativos
from contagens_globais c;
