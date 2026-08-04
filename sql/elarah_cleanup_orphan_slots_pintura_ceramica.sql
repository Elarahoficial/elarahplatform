-- =============================================================
-- ELARAH — Limpeza de slots órfãos (horário no dia errado)
--          Pintura em Cerâmica (seg à sexta)
-- -------------------------------------------------------------
-- PROBLEMA
--   Regras atuais da experiência (ver telas do admin):
--     • Regra A: Seg, Ter, Qua, Qui  →  "19h30 – 21h30"
--     • Regra B: Qui, Sex            →  "10h00 – 12h00"
--   Nenhuma regra gera "10h00" numa TERÇA. Mas existe um slot
--   "10h00 – 12h00" em 11/08 (terça) — resquício de uma config
--   antiga. Ele ficou vivo porque teve reserva; quando a regra
--   mudou, o cleanup do admin apenas o desvinculou da regra
--   (recurrence_rule_id = NULL) e o deixou ATIVO. Resultado: o
--   horário fantasma continua aparecendo/vendendo no site e se
--   "mistura" com o horário correto do dia.
--
-- O QUE ESTE SCRIPT FAZ
--   Para a experiência Pintura em Cerâmica, DESATIVA (is_active
--   = false) todo slot FUTURO cujo horário é um rótulo de regra
--   (ex: "10h00 – 12h00") mas cai num dia da semana que NENHUMA
--   regra ativa daquele rótulo cobre. Ex.: "10h00" numa terça.
--
--   • NÃO apaga nada — só desativa. 100% reversível.
--   • NÃO toca reservas (bookings) — elas guardam o próprio
--     snapshot de data/horário e o slot_id continua válido.
--   • NÃO toca slots que batem com alguma regra (ex.: 10h00 na
--     qui/sex, 19h30 na seg–qui) — esses continuam ativos.
--   • NÃO toca slots manuais com horário que não é rótulo de
--     nenhuma regra (proteção contra desativar horário legítimo
--     criado à mão).
--
-- COMO RODAR
--   Cola tudo no SQL Editor do Supabase e clica Run. Tudo numa
--   transação única. Ele imprime o que vai desativar ANTES e o
--   estado depois.
--
-- REVERTER (se precisar reativar algo)
--   update public.experience_slots set is_active = true where id = '<slot_id>';
-- =============================================================

begin;

do $$
declare
  v_exp_id   uuid;
  v_rec      record;
  v_count    integer := 0;
begin
  -- 1. Acha a experiência
  select id into v_exp_id
    from public.experiences
   where lower(nome) like '%pintura em cer%mica%'
   order by created_at
   limit 1;

  if v_exp_id is null then
    raise exception '[cleanup] experiência "Pintura em Cerâmica" não encontrada';
  end if;

  raise notice '[cleanup] experiência = %', v_exp_id;

  -- 2. Conjunto (weekday, rótulo) permitido pelas regras ATIVAS.
  --    Usa America/Sao_Paulo pra casar com a materialização.
  --    "allowed" = pares que ALGUMA regra ativa realmente produz.
  create temp table _allowed on commit drop as
    select distinct wd as weekday, r.horario_label as horario
      from public.experience_recurrence_rules r
      cross join lateral unnest(r.weekdays) as wd
     where r.experience_id = v_exp_id
       and r.is_active is true;

  -- Rótulos que são gerados por regra (pra não mexer em slot manual
  -- com horário exclusivo).
  create temp table _rule_labels on commit drop as
    select distinct horario from _allowed;

  -- 3. Lista os órfãos ANTES de agir
  raise notice '[cleanup] slots que serão DESATIVADOS (horário de regra em dia não coberto):';
  for v_rec in
    select s.id, s.data, s.horario, s.event_at,
           extract(dow from (s.event_at at time zone 'America/Sao_Paulo'))::int as dow_local,
           s.is_active, s.vagas_restantes, s.recurrence_rule_id,
           (select count(*) from public.bookings b
             where b.slot_id = s.id and b.status in ('pending','pago')) as reservas
      from public.experience_slots s
     where s.experience_id = v_exp_id
       and s.is_active is true
       and s.event_at >= now()
       and s.horario in (select horario from _rule_labels)
       and not exists (
         select 1 from _allowed a
          where a.horario = s.horario
            and a.weekday = extract(dow from (s.event_at at time zone 'America/Sao_Paulo'))::int
       )
     order by s.event_at
  loop
    raise notice '   - slot=% data=% horario="%" dow=% reservas=% event_at=%',
      v_rec.id, v_rec.data, v_rec.horario, v_rec.dow_local, v_rec.reservas, v_rec.event_at;
  end loop;

  -- 4. DESATIVA (não apaga)
  with alvo as (
    select s.id
      from public.experience_slots s
     where s.experience_id = v_exp_id
       and s.is_active is true
       and s.event_at >= now()
       and s.horario in (select horario from _rule_labels)
       and not exists (
         select 1 from _allowed a
          where a.horario = s.horario
            and a.weekday = extract(dow from (s.event_at at time zone 'America/Sao_Paulo'))::int
       )
  )
  update public.experience_slots s
     set is_active = false
    from alvo
   where s.id = alvo.id;

  get diagnostics v_count = row_count;
  raise notice '[cleanup] OK — % slot(s) órfão(s) desativado(s). 0 reservas afetadas.', v_count;
end $$;

-- 5. Estado depois — confirma que não sobrou órfão ATIVO
select
  s.id as slot_id,
  s.data,
  s.horario,
  extract(dow from (s.event_at at time zone 'America/Sao_Paulo'))::int as dow_local,
  s.is_active,
  s.event_at
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where lower(e.nome) like '%pintura em cer%mica%'
  and s.event_at >= now()
order by s.event_at, s.horario;

commit;
