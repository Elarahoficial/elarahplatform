-- =============================================================
-- ELARAH — Limpeza: sincroniza horário LEGADO com os slots reais
-- -------------------------------------------------------------
-- CONTEXTO:
--   O campo legado da experiência (experiences.horario / .horarios) é uma
--   cópia denormalizada usada nos CARDS e no modal de reserva rápida. Quando
--   a experiência passa a ser gerenciada por slots (recorrência/manual) e o
--   horário muda, esse campo legado NÃO é atualizado sozinho — fica defasado
--   (ex.: "13h00 – 15h00" salvo, mas os slots reais são 11h00–13h00 e
--   15h30–17h30). Era daí que saía o "horário fantasma".
--
--   IMPORTANTE (por que isto não é só cosmético): a trava do servidor casa o
--   horário por texto EXATO (.eq("horario", ...)). Os slots usam travessão
--   "–" e o legado costuma usar hífen "-"; sem normalizar, uma reserva feita
--   pelo CARD (que manda o texto legado) não bateria com o slot e seria
--   recusada. Esta limpeza normaliza o legado pros MESMOS rótulos dos slots
--   ativos, então card + modal só oferecem horários que existem de verdade.
--
--   REGRA DE SEGURANÇA sobre o horário PRINCIPAL (experiences.horario):
--     • Se o horário principal atual AINDA existe como slot ativo (ignorando
--       traço/espaços), ele é PRESERVADO (só troca o traço) — não mudamos o
--       horário "de vitrine" do card à toa.
--     • Se o principal atual é fantasma (não existe em slot ativo), aí sim
--       vira o slot ativo mais próximo.
--   O array `horarios` recebe TODOS os rótulos de slots ativos distintos,
--   com o principal em primeiro.
--
--   Seguro: só toca experiências ATIVAS, gerenciadas por slots (>=1 slot
--   ativo) e que NÃO são agendamento livre (voucher). Idempotente: só
--   atualiza o que está defasado; rodar de novo não muda nada.
--
-- COMO RODAR: Supabase → SQL Editor. Rode a Q0 (preview) primeiro; se estiver
--   ok, rode o bloco UPDATE. Recomendado rodar ANTES/junto do deploy.
-- =============================================================


-- =============================================================
-- Q0 — PREVIEW (só leitura): o que MUDARIA. Rode isto primeiro.
-- =============================================================
with slot_labels as (
  select s.experience_id, s.horario, min(s.event_at) as first_event
    from public.experience_slots s
   where s.is_active is true
   group by s.experience_id, s.horario
),
prim as (
  -- Escolhe o horário principal: preserva o atual se ainda existe como slot
  -- ativo (comparando sem traço/espaço); senão, o slot ativo mais próximo.
  select
    sl.experience_id,
    coalesce(
      max(case
            when regexp_replace(lower(sl.horario),        '[-–[:space:]]', '', 'g')
               = regexp_replace(lower(coalesce(e.horario,'')), '[-–[:space:]]', '', 'g')
            then sl.horario end),
      (array_agg(sl.horario order by sl.first_event nulls last))[1]
    ) as primary_horario
  from slot_labels sl
  join public.experiences e on e.id = sl.experience_id
  group by sl.experience_id
),
agg as (
  select
    sl.experience_id,
    p.primary_horario,
    array_agg(sl.horario order by (sl.horario = p.primary_horario) desc,
                                  sl.first_event nulls last) as labels
  from slot_labels sl
  join prim p on p.experience_id = sl.experience_id
  group by sl.experience_id, p.primary_horario
)
select
  e.id,
  e.nome,
  e.horario   as horario_atual,
  a.primary_horario as horario_novo,
  e.horarios  as horarios_atual,
  a.labels    as horarios_novo
from public.experiences e
join agg a on a.experience_id = e.id
where e.is_active is true
  and coalesce(nullif(trim(e.horario_funcionamento), ''), null) is null
  and (
        e.horarios is distinct from a.labels
     or e.horario  is distinct from a.primary_horario
      )
order by e.nome;


-- =============================================================
-- UPDATE — aplica a sincronização. Rode depois de conferir a Q0.
-- =============================================================
with slot_labels as (
  select s.experience_id, s.horario, min(s.event_at) as first_event
    from public.experience_slots s
   where s.is_active is true
   group by s.experience_id, s.horario
),
prim as (
  select
    sl.experience_id,
    coalesce(
      max(case
            when regexp_replace(lower(sl.horario),        '[-–[:space:]]', '', 'g')
               = regexp_replace(lower(coalesce(e.horario,'')), '[-–[:space:]]', '', 'g')
            then sl.horario end),
      (array_agg(sl.horario order by sl.first_event nulls last))[1]
    ) as primary_horario
  from slot_labels sl
  join public.experiences e on e.id = sl.experience_id
  group by sl.experience_id
),
agg as (
  select
    sl.experience_id,
    p.primary_horario,
    array_agg(sl.horario order by (sl.horario = p.primary_horario) desc,
                                  sl.first_event nulls last) as labels
  from slot_labels sl
  join prim p on p.experience_id = sl.experience_id
  group by sl.experience_id, p.primary_horario
)
update public.experiences e
   set horarios   = a.labels,
       horario    = a.primary_horario,
       updated_at = now()
  from agg a
 where a.experience_id = e.id
   and e.is_active is true
   and coalesce(nullif(trim(e.horario_funcionamento), ''), null) is null
   and (
         e.horarios is distinct from a.labels
      or e.horario  is distinct from a.primary_horario
       );

-- Recarrega o schema cache do PostgREST (boa prática após update em massa).
notify pgrst, 'reload schema';


-- =============================================================
-- Q1 — CONFERÊNCIA pós-update: rode a Q0 de novo; deve vir VAZIO.
-- =============================================================
