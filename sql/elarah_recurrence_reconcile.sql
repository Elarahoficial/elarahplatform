-- =============================================================
-- ELARAH — RECONCILIAÇÃO da recorrência (a raiz do "vendendo fora
--          da regra")
-- -------------------------------------------------------------
-- POR QUE O SITE VENDE FORA DAS REGRAS (a varredura, em 1 frase)
--   O motor de recorrência só SABE ADICIONAR datas, nunca RETIRAR.
--   materialize_recurrence_slots() é INSERT-only (ON CONFLICT DO
--   NOTHING). Quando você EDITA uma regra (tira um dia, muda a hora)
--   ou APAGA uma regra, as datas que a versão antiga já gerou
--   continuam vivas (is_active=true) e à venda. A única "limpeza"
--   que existia era:
--     • JS no navegador (_recurrenceCleanupOrphans), que (a) só
--       enxerga slots ainda ligados àquela MESMA regra, (b) calcula
--       o dia-da-semana no fuso do navegador (bug de timezone), e
--       (c) só roda se você reabrir e re-salvar a regra; e
--     • cleanup na DESATIVAÇÃO da regra (true→false), que não roda
--       numa simples edição.
--   Resultado: qualquer data gerada por uma forma ANTIGA da regra —
--   ou por uma regra depois apagada (FK ON DELETE SET NULL vira o
--   slot em "manual") — fica à venda pra sempre. Foi assim que
--   "segunda 17/08 10h00–12h00" continuou vendável mesmo a regra
--   atual dizendo que segunda só tem 19h30–21h30 e que 10h–12h é
--   só qui/sex.
--
-- O QUE ESTE ARQUIVO INSTALA (o conserto definitivo)
--   1. reconcile_experience_slots(exp) — função autoritativa: numa
--      experiência que USA recorrência, DESATIVA (is_active=false,
--      reversível, NÃO deleta) toda data futura que não casa com
--      NENHUMA regra ATIVA. Casar = mesmo dia-da-semana (fuso
--      America/Sao_Paulo) ∈ regra.weekdays E mesmo horário
--      normalizado. RESERVAS PAGAS/PENDENTES SÃO SAGRADAS: um slot
--      fora-da-regra COM reserva ativa NÃO é desativado — ele é
--      reportado pra você tratar à mão (ex.: o 17/08 da Samanta).
--   2. Gatilho em experience_recurrence_rules (insert/update/delete)
--      que reconcilia a experiência automaticamente — auto-cura: a
--      partir de agora, editar/apagar regra tira as datas velhas do
--      site sozinho.
--   3. Cron noturno que materializa E reconcilia todo dia (o
--      horizonte enche e as sobras somem sem ninguém mexer).
--   4. Um relatório (R0) e a execução imediata (R2).
--
-- SEGURANÇA
--   • DESATIVA, não deleta → 100% reversível (is_active=true de volta).
--   • Só age em experiências com ≥1 regra ATIVA (não mexe em
--     experiência 100% manual/avulsa).
--   • Nunca toca slot com reserva pending/pago.
--   • Idempotente. Rodar de novo não muda nada além do que falta.
--
-- PRÉ-REQUISITOS: experience_slots, experience_recurrence_rules
--   (weekdays integer[]) já existentes.
-- =============================================================


-- =============================================================
-- 0. normalize_horario_label (idempotente — pode já existir do
--    elarah_recurrence_fix_integrity.sql). Recriada aqui pra o
--    arquivo ser auto-contido.
--    "19h00 às 22h00" / "19h00 - 22h00" / "19h00 — 22h00"
--       → "19h00 – 22h00"
-- =============================================================
create or replace function public.normalize_horario_label(p_text text)
returns text
language sql
immutable
as $$
  select case
    when p_text is null then null
    else trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(p_text, '\s+(às|as)\s+', ' – ', 'gi'),
          '\s+[-—]\s+', ' – ', 'g'
        ),
        '\s+', ' ', 'g'
      )
    )
  end
$$;


-- =============================================================
-- 1. reconcile_experience_slots(p_experience_id)
-- -------------------------------------------------------------
-- Retorna 1 linha: (desativados, protegidos_com_reserva).
--   desativados            = slots fora-da-regra sem reserva que
--                            saíram do site agora.
--   protegidos_com_reserva = slots fora-da-regra QUE TÊM reserva
--                            ativa — ficaram no ar de propósito e
--                            precisam de tratamento manual.
-- =============================================================
create or replace function public.reconcile_experience_slots(p_experience_id uuid)
returns table(desativados integer, protegidos_com_reserva integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_rules integer;
begin
  select count(*) into v_active_rules
    from public.experience_recurrence_rules
   where experience_id = p_experience_id
     and is_active;

  -- Experiência sem regra ativa: não é gerida por recorrência.
  -- Não mexemos (respeita slots manuais/avulsos legítimos).
  if v_active_rules = 0 then
    return query select 0, 0;
    return;
  end if;

  -- CTE: slots futuros ATIVOS desta experiência que NÃO casam com
  -- nenhuma regra ativa (o "fora da regra").
  return query
  with off_grid as (
    select
      s.id,
      exists (
        select 1 from public.bookings b
         where b.slot_id = s.id
           and b.status in ('pending','pago')
      ) as tem_reserva
    from public.experience_slots s
    where s.experience_id = p_experience_id
      and s.is_active
      and s.event_at is not null
      and s.event_at >= now()
      and not exists (
        select 1
          from public.experience_recurrence_rules r
         where r.experience_id = p_experience_id
           and r.is_active
           and extract(dow from (s.event_at at time zone 'America/Sao_Paulo'))::int
                 = any(r.weekdays)
           and public.normalize_horario_label(s.horario)
                 = public.normalize_horario_label(r.horario_label)
      )
  ),
  desativa as (
    update public.experience_slots s
       set is_active = false
      from off_grid o
     where s.id = o.id
       and o.tem_reserva = false
    returning 1
  )
  select
    (select count(*)::int from desativa),
    (select count(*)::int from off_grid where tem_reserva);
end;
$$;


-- =============================================================
-- 2. reconcile_all_experiences_with_rules()
-- -------------------------------------------------------------
-- Roda a reconciliação em toda experiência que tem ≥1 regra ativa.
-- Usada pelo cron e pela execução imediata. Retorna totais.
-- =============================================================
create or replace function public.reconcile_all_experiences_with_rules()
returns table(experiencias integer, desativados integer, protegidos integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exp        uuid;
  v_exps       integer := 0;
  v_desat_tot  integer := 0;
  v_prot_tot   integer := 0;
  v_d          integer;
  v_p          integer;
begin
  for v_exp in
    select distinct experience_id
      from public.experience_recurrence_rules
     where is_active
  loop
    -- Alias `t` qualifica as colunas retornadas — sem isso, `desativados`
    -- colide com a coluna de saída homônima desta função (ambíguo).
    select t.desativados, t.protegidos_com_reserva
      into v_d, v_p
      from public.reconcile_experience_slots(v_exp) as t;
    v_exps      := v_exps + 1;
    v_desat_tot := v_desat_tot + coalesce(v_d, 0);
    v_prot_tot  := v_prot_tot + coalesce(v_p, 0);
  end loop;
  return query select v_exps, v_desat_tot, v_prot_tot;
end;
$$;


-- =============================================================
-- 3. Gatilho de auto-cura em experience_recurrence_rules
-- -------------------------------------------------------------
-- Sempre que uma regra é criada, editada OU apagada, reconcilia a
-- experiência afetada. Roda DEPOIS da materialização (nome/ordem
-- não importam: materialize adiciona, reconcile remove; os dois
-- convergem). Deleta nada — só desativa fora-da-regra sem reserva.
-- =============================================================
create or replace function public.trigger_reconcile_after_rule_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exp uuid;
begin
  v_exp := coalesce(NEW.experience_id, OLD.experience_id);
  if v_exp is not null then
    perform public.reconcile_experience_slots(v_exp);
  end if;
  return null;  -- AFTER trigger
end;
$$;

drop trigger if exists reconcile_after_rule_change_trg
  on public.experience_recurrence_rules;

create trigger reconcile_after_rule_change_trg
  after insert or update or delete
  on public.experience_recurrence_rules
  for each row execute function public.trigger_reconcile_after_rule_change();


-- =============================================================
-- 4. Cron noturno: materializa E reconcilia
-- -------------------------------------------------------------
-- Substitui o job só-de-materialização por um que também limpa a
-- sobra. Ordem: materializa (enche horizonte) → reconcilia (tira o
-- que não casa). Idempotente e barato.
-- =============================================================
create or replace function public.recurrence_nightly_maintenance()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mat  integer;
  v_rec  record;
begin
  select public.materialize_all_active_recurrences() into v_mat;
  select * into v_rec from public.reconcile_all_experiences_with_rules();
  return format(
    'materializados=%s · reconciliadas=%s exp · desativados=%s · protegidos_com_reserva=%s',
    v_mat, v_rec.experiencias, v_rec.desativados, v_rec.protegidos
  );
end;
$$;

grant execute on function public.reconcile_experience_slots(uuid)         to authenticated;
grant execute on function public.reconcile_all_experiences_with_rules()   to authenticated;
grant execute on function public.recurrence_nightly_maintenance()         to authenticated;

do $$
begin
  -- Remove o job antigo só-de-materialização (idempotente).
  begin perform cron.unschedule('elarah-recurrence-materialize-daily');
  exception when others then null; end;
  -- (Re)agenda o job combinado às 06h UTC (03h BRT).
  begin perform cron.unschedule('elarah-recurrence-nightly');
  exception when others then null; end;
  begin
    perform cron.schedule(
      'elarah-recurrence-nightly',
      '0 6 * * *',
      $cron$ select public.recurrence_nightly_maintenance(); $cron$
    );
  exception when undefined_table then
    raise notice 'pg_cron não habilitado — pule o agendamento (rode a manutenção pela materialização + reconcile manualmente).';
  end;
end $$;


-- =============================================================
-- R0. RELATÓRIO (rode ANTES) — o que está à venda FORA das regras.
-- -------------------------------------------------------------
-- READ-ONLY. Lista, por experiência com regra ativa, cada data
-- futura à venda que não casa com nenhuma regra. A coluna acao diz
-- o que a reconciliação fará: 'DESATIVA' (sem reserva) ou 'MANTÉM —
-- TEM RESERVA' (você trata à mão, ex.: 17/08 da Samanta).
-- =============================================================
select
  e.nome as experiencia,
  to_char(s.event_at at time zone 'America/Sao_Paulo', 'Dy DD/MM HH24:MI') as quando,
  s.horario,
  s.vagas_total, s.vagas_restantes,
  case when s.recurrence_rule_id is null then 'manual/órfão'
       else 'regra ' || left(s.recurrence_rule_id::text, 8) end as origem,
  (select count(*) from public.bookings b
     where b.slot_id = s.id and b.status in ('pending','pago')) as reservas,
  case when exists (
         select 1 from public.bookings b
          where b.slot_id = s.id and b.status in ('pending','pago'))
       then 'MANTÉM — TEM RESERVA'
       else 'DESATIVA' end as acao,
  s.id as slot_id
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where s.is_active
  and s.event_at is not null
  and s.event_at >= now()
  and exists (select 1 from public.experience_recurrence_rules r
               where r.experience_id = s.experience_id and r.is_active)
  and not exists (
    select 1 from public.experience_recurrence_rules r
     where r.experience_id = s.experience_id
       and r.is_active
       and extract(dow from (s.event_at at time zone 'America/Sao_Paulo'))::int = any(r.weekdays)
       and public.normalize_horario_label(s.horario) = public.normalize_horario_label(r.horario_label)
  )
order by e.nome, s.event_at;


-- =============================================================
-- R2. EXECUÇÃO IMEDIATA — tira do site tudo que R0 marcou DESATIVA.
-- -------------------------------------------------------------
-- Seguro: desativa (reversível), preserva reservas. Rode e leia o
-- retorno. Depois rode R0 de novo — deve sobrar só linha com
-- 'MANTÉM — TEM RESERVA'.
-- (Recomendado: um backup rápido antes, se quiser dormir tranquila:
--   create table _bkp_slots_reconcile as
--     select * from public.experience_slots;   )
-- =============================================================
select * from public.reconcile_all_experiences_with_rules();


-- =============================================================
-- REVERTER (se algum dia precisar)
--   drop trigger if exists reconcile_after_rule_change_trg on public.experience_recurrence_rules;
--   -- e reativar slots à mão: update experience_slots set is_active=true where id in (...);
-- =============================================================
