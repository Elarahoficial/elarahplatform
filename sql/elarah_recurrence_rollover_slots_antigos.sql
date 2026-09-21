-- =============================================================
-- ELARAH — "Reativar" não traz a experiência semanal de volta
-- -------------------------------------------------------------
-- SINTOMA
--   Experiência recorrente (Semanal) fica com o selo "Oculta". A admin
--   clica em Reativar, o painel diz que reativou, e ela continua oculta.
--   Clica de novo, mesma coisa.
--
-- CAUSA
--   experience_slots tem chave única por (experience_id, data, horario),
--   e `data` é o RÓTULO "DD/MM" — SEM ANO. A turma de 23/10 do ano
--   passado ocupa exatamente a mesma chave da turma de 23/10 deste ano.
--   materialize_recurrence_slots() insere com ON CONFLICT DO NOTHING,
--   então ele tenta criar as próximas semanas, esbarra nos rótulos
--   antigos, não insere nada e devolve 0.
--
--   Resultado: a experiência segue sem NENHUMA turma futura (o event_at
--   dos slots antigos está no passado) e o site continua escondendo ela.
--
-- O QUE ESTE SCRIPT FAZ
--   Apaga as turmas VENCIDAS geradas por regra de recorrência que não
--   têm reserva nem venda manual vinculada, liberando os rótulos DD/MM
--   pra regra materializar de novo. Depois re-materializa.
--
-- O QUE ELE NUNCA APAGA
--   • Turma com reserva (bookings pending/pago)
--   • Turma com venda manual (manual_sales pago/pendente)
--   • Turma FUTURA (só mexe no que já passou)
--   • Turma manual, sem regra (recurrence_rule_id null)
--   Essas ficam como estão — inclusive o histórico da contabilidade.
--
-- SEGURO RODAR MAIS DE UMA VEZ. As partes 1 e 2 são só leitura; a
-- parte 3 é a que altera e está isolada num bloco separado.
--
-- Como rodar: Supabase → SQL Editor → cola → Run.
-- =============================================================


-- =============================================================
-- PARTE 1 (leitura) — Quem está travado nessa situação
-- -------------------------------------------------------------
-- Lista as experiências com regra de recorrência ATIVA que não têm
-- nenhuma turma futura. São exatamente as que aparecem "Oculta" no
-- painel e não voltam no botão Reativar.
-- =============================================================
select
  e.id,
  e.nome,
  e.is_active,
  (select count(*) from public.experience_recurrence_rules r
    where r.experience_id = e.id and r.is_active is true)          as regras_ativas,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.event_at >= now())          as turmas_futuras,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.event_at < now()
      and s.recurrence_rule_id is not null)                        as turmas_vencidas_de_regra,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.event_at < now()
      and s.recurrence_rule_id is not null
      and not exists (select 1 from public.bookings b
                       where b.slot_id = s.id and b.status in ('pending','pago'))
      and not exists (select 1 from public.manual_sales m
                       where m.slot_id = s.id and m.payment_status in ('pago','pendente'))
  )                                                                as vencidas_sem_reserva
  from public.experiences e
 where exists (select 1 from public.experience_recurrence_rules r
                where r.experience_id = e.id and r.is_active is true)
   and not exists (select 1 from public.experience_slots s
                    where s.experience_id = e.id and s.event_at >= now())
 order by e.nome;


-- =============================================================
-- PARTE 2 (leitura) — As turmas vencidas que seriam apagadas
-- -------------------------------------------------------------
-- Confira antes de rodar a parte 3. Se alguma linha aqui te
-- surpreender, PARE e me chame.
-- =============================================================
select
  e.nome                                as experiencia,
  s.data                                as rotulo,
  s.horario,
  s.event_at,
  s.vagas_total,
  s.vagas_restantes
  from public.experience_slots s
  join public.experiences e on e.id = s.experience_id
 where s.event_at < now()
   and s.recurrence_rule_id is not null
   and not exists (select 1 from public.bookings b
                    where b.slot_id = s.id and b.status in ('pending','pago'))
   and not exists (select 1 from public.manual_sales m
                    where m.slot_id = s.id and m.payment_status in ('pago','pendente'))
   and not exists (select 1 from public.experience_slots f
                    where f.experience_id = s.experience_id and f.event_at >= now())
 order by e.nome, s.event_at;


-- =============================================================
-- PARTE 3 (ALTERA) — Limpa as vencidas e recria as próximas
-- -------------------------------------------------------------
-- Só toca em experiência que está SEM turma futura (o caso travado).
-- Se quiser limitar a UMA experiência, descomente a linha do filtro
-- por nome e ajuste o texto.
-- =============================================================
do $$
declare
  v_apagados integer := 0;
  v_criados  integer := 0;
  v_regra    record;
  v_n        integer;
begin
  -- Autoriza o DELETE de slot vinculado a regra só dentro desta
  -- transação (a trigger enforce_recurrence_slot_delete exige a flag).
  perform set_config('elarah.allow_recurrence_slot_delete', 'true', true);

  with alvo as (
    delete from public.experience_slots s
     where s.event_at < now()
       and s.recurrence_rule_id is not null
       -- sem reserva
       and not exists (select 1 from public.bookings b
                        where b.slot_id = s.id and b.status in ('pending','pago'))
       -- sem venda manual
       and not exists (select 1 from public.manual_sales m
                        where m.slot_id = s.id and m.payment_status in ('pago','pendente'))
       -- só experiências que estão SEM nenhuma turma futura
       and not exists (select 1 from public.experience_slots f
                        where f.experience_id = s.experience_id
                          and f.event_at >= now())
       -- filtro opcional por experiência:
       -- and s.experience_id = (select id from public.experiences
       --                         where nome = 'Modelagem em Cerâmica' limit 1)
    returning 1
  )
  select count(*) into v_apagados from alvo;

  -- Recria as próximas turmas de toda regra ativa (idempotente).
  for v_regra in
    select r.id from public.experience_recurrence_rules r where r.is_active is true
  loop
    select public.materialize_recurrence_slots(v_regra.id) into v_n;
    v_criados := v_criados + coalesce(v_n, 0);
  end loop;

  raise notice '[rollover] % turma(s) vencida(s) apagada(s), % turma(s) futura(s) criada(s).',
    v_apagados, v_criados;
end $$;


-- =============================================================
-- PARTE 4 (leitura) — Confere o resultado
-- =============================================================
select
  e.nome,
  count(*) filter (where s.event_at >= now()) as turmas_futuras,
  min(s.event_at) filter (where s.event_at >= now()) as proxima_turma
  from public.experiences e
  join public.experience_slots s on s.experience_id = e.id
 where exists (select 1 from public.experience_recurrence_rules r
                where r.experience_id = e.id and r.is_active is true)
 group by e.nome
 order by e.nome;
