-- =============================================================
-- ELARAH — Limpeza: sincroniza horário LEGADO com os slots reais
-- -------------------------------------------------------------
-- CONTEXTO:
--   O campo legado da experiência (experiences.horario / .horarios) é uma
--   cópia denormalizada usada nos CARDS e no modal de reserva rápida. Quando
--   a experiência passa a ser gerenciada por slots (recorrência/manual) e o
--   horário muda, esse campo legado NÃO é atualizado sozinho — fica defasado
--   (ex.: cerâmica com "13h00 – 15h00" salvo, mas os slots reais são
--   11h00–13h00 e 15h30–17h30). Era daí que saía o "horário fantasma".
--
--   A trava do servidor (booking_guard / create-checkout-session) já RECUSA
--   comprar um horário que não bate com slot ativo. Esta limpeza ataca a
--   CAUSA na origem: deixa o campo legado IGUAL aos rótulos dos slots ativos.
--   Depois disso, card e modal só oferecem horários que existem de verdade.
--
--   Seguro: só toca experiências ATIVAS, gerenciadas por slots (>=1 slot
--   ativo) e que NÃO são agendamento livre (voucher). Experiências legadas
--   puras (sem slot) e vouchers ficam intactas. Idempotente: só atualiza
--   linhas realmente defasadas; rodar de novo não muda nada.
--
-- COMO RODAR: Supabase → SQL Editor. Rode a Q0 (preview) primeiro pra ver
--   o antes/depois; se estiver ok, rode o bloco UPDATE.
-- =============================================================


-- =============================================================
-- Q0 — PREVIEW (só leitura): o que MUDARIA. Rode isto primeiro.
-- -------------------------------------------------------------
-- Mostra o valor legado atual x o valor novo (rótulos dos slots ativos,
-- ordenados pela data mais próxima). Só lista o que está defasado.
-- =============================================================
with slot_labels as (
  select s.experience_id, s.horario, min(s.event_at) as first_event
    from public.experience_slots s
   where s.is_active is true
   group by s.experience_id, s.horario
),
agg as (
  select experience_id,
         array_agg(horario order by first_event nulls last) as labels
    from slot_labels
   group by experience_id
)
select
  e.id,
  e.nome,
  e.horario               as horario_legado_atual,
  a.labels[1]             as horario_legado_novo,
  e.horarios              as horarios_legado_atual,
  a.labels                as horarios_legado_novo
from public.experiences e
join agg a on a.experience_id = e.id
where e.is_active is true
  and coalesce(nullif(trim(e.horario_funcionamento), ''), null) is null
  and (
        e.horarios is distinct from a.labels
     or e.horario  is distinct from a.labels[1]
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
agg as (
  select experience_id,
         array_agg(horario order by first_event nulls last) as labels
    from slot_labels
   group by experience_id
)
update public.experiences e
   set horarios   = a.labels,
       horario    = a.labels[1],
       updated_at = now()
  from agg a
 where a.experience_id = e.id
   and e.is_active is true
   and coalesce(nullif(trim(e.horario_funcionamento), ''), null) is null
   and (
         e.horarios is distinct from a.labels
      or e.horario  is distinct from a.labels[1]
       );

-- Recarrega o schema cache do PostgREST (boa prática após update em massa).
notify pgrst, 'reload schema';


-- =============================================================
-- Q1 — CONFERÊNCIA pós-update (só leitura): não deve sobrar defasagem.
--      Rode de novo a Q0 acima — o resultado deve vir VAZIO.
-- =============================================================
