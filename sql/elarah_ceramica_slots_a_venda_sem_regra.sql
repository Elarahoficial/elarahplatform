-- =============================================================
-- ELARAH — Diagnóstico: datas À VENDA sem regra de recorrência
--          (foco nas experiências de Cerâmica)
-- -------------------------------------------------------------
-- POR QUE ESTE ARQUIVO EXISTE
--   Relato: uma cliente comprou "Modelagem em Cerâmica (seg à sexta)"
--   em 17/08 (segunda) 10h00–12h00 — data que NÃO estava cadastrada
--   em nenhuma regra de recorrência. Como isso é possível?
--
--   Porque o SITE vende QUALQUER slot em experience_slots que esteja
--   is_active=true, com event_at no futuro e com vaga — INDEPENDENTE
--   de ter regra de recorrência (experiencia.html:591-604 ignora
--   recurrence_rule_id de propósito). Slots podem existir sem regra por:
--     1) importação legada (1 slot por horário antigo de experiences)
--     2) criação manual no admin (aba Horários)
--     3) ÓRFÃOS: a FK recurrence_rule_id é ON DELETE SET NULL, então
--        apagar uma regra deixa os slots já materializados vivos e
--        à venda, agora com recurrence_rule_id = NULL.
--
--   Pior: o painel "Recorrência" do admin ANTES escondia todo slot sem
--   regra — então a dona configurava só sáb/dom e não via as datas de
--   seg-a-sexta que estavam à venda. (O fix de admin.js passou a mostrar
--   essas datas num bloco "Datas à venda SEM regra de recorrência".)
--
-- O QUE ESTE SQL FAZ
--   100% READ-ONLY nas queries D1–D4. Pode rodar em produção.
--   A seção CORREÇÃO (no fim) está TODA comentada e é opcional — só
--   desative depois de conferir o diagnóstico. Ela NUNCA mexe em slot
--   com reserva ativa (pending/pago), então a compra da Samanta em 17/08
--   fica intocada.
--
-- COMO USAR
--   Rode bloco a bloco no SQL Editor do Supabase e leia o resultado.
-- =============================================================


-- =============================================================
-- D0. Identifica as experiências de cerâmica envolvidas
-- -------------------------------------------------------------
-- Confirma os UUIDs de "seg à sexta" e "sáb e domingo" pelo nome.
-- Anote os ids — as queries abaixo usam o filtro por nome, mas se
-- preferir pode trocar por "where e.id in ('...','...')".
-- =============================================================
select
  e.id,
  e.nome,
  e.is_active                                            as experiencia_ativa,
  (select count(*) from public.experience_recurrence_rules r
     where r.experience_id = e.id and r.is_active)       as regras_ativas,
  (select count(*) from public.experience_slots s
     where s.experience_id = e.id
       and s.is_active and s.event_at >= now())          as slots_futuros_a_venda
from public.experiences e
where e.nome ilike '%cerâmic%' or e.nome ilike '%ceramic%' or e.nome ilike '%modelagem%'
order by e.nome;


-- =============================================================
-- D1. TODAS as datas futuras À VENDA por experiência de cerâmica,
--     classificadas pela ORIGEM.
-- -------------------------------------------------------------
-- origem:
--   'REGRA ATIVA'   -> slot vem de regra de recorrência ainda ativa (ok)
--   'REGRA INATIVA' -> vem de regra que foi desativada (revisar)
--   'ÓRFÃO'         -> recurrence_rule_id aponta pra regra inexistente
--   'MANUAL/LEGADO' -> recurrence_rule_id NULL (nunca teve regra, ou
--                       virou manual quando a regra foi apagada)
--
-- É AQUI que o "17/08 10h00–12h00 seg à sexta" deve aparecer, muito
-- provavelmente como MANUAL/LEGADO. Olhe a coluna reservas_ativas: se
-- > 0, há gente que pagou — NÃO apague, resolva com o cliente.
-- =============================================================
select
  e.nome                                                 as experiencia,
  to_char(s.event_at at time zone 'America/Sao_Paulo',
          'Dy DD/MM HH24:MI')                            as quando,
  s.horario,
  s.is_active                                            as no_site,
  case
    when s.recurrence_rule_id is null                    then 'MANUAL/LEGADO'
    when r.id is null                                    then 'ÓRFÃO'
    when r.is_active                                     then 'REGRA ATIVA'
    else                                                      'REGRA INATIVA'
  end                                                    as origem,
  s.vagas_total,
  s.vagas_restantes,
  (select count(*) from public.bookings b
     where b.slot_id = s.id and b.status in ('pending','pago')) as reservas_ativas,
  s.id                                                   as slot_id,
  s.recurrence_rule_id
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
left join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
where (e.nome ilike '%cerâmic%' or e.nome ilike '%ceramic%' or e.nome ilike '%modelagem%')
  and s.is_active
  and s.event_at >= now()
order by e.nome, s.event_at;


-- =============================================================
-- D2. RESUMO — quantas datas à venda vêm (ou não) de regra ativa,
--     por experiência. O número que interessa é "sem_regra_ativa".
-- =============================================================
select
  e.nome as experiencia,
  count(*)                                                          as total_a_venda,
  count(*) filter (where s.recurrence_rule_id is not null
                     and r.is_active)                               as com_regra_ativa,
  count(*) filter (where s.recurrence_rule_id is null
                     or r.id is null
                     or not r.is_active)                            as sem_regra_ativa,
  count(*) filter (where s.recurrence_rule_id is null)              as manual_legado,
  count(*) filter (where s.recurrence_rule_id is not null
                     and r.id is null)                              as orfaos
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
left join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
where (e.nome ilike '%cerâmic%' or e.nome ilike '%ceramic%' or e.nome ilike '%modelagem%')
  and s.is_active
  and s.event_at >= now()
group by e.nome
order by e.nome;


-- =============================================================
-- D3. O SLOT ESPECÍFICO do relato: 17/08 10h00–12h00.
-- -------------------------------------------------------------
-- Mostra tudo dele — origem, se tem reserva paga, qual regra (se
-- alguma). Ajuste o filtro de data/horário se precisar.
-- =============================================================
select
  e.nome as experiencia,
  s.data, s.horario,
  to_char(s.event_at at time zone 'America/Sao_Paulo', 'Dy DD/MM/YYYY HH24:MI') as quando,
  s.is_active as no_site,
  s.recurrence_rule_id,
  case when s.recurrence_rule_id is null then 'MANUAL/LEGADO — nunca veio de regra'
       else 'vinculado a regra ' || s.recurrence_rule_id::text end as origem,
  (select count(*) from public.bookings b
     where b.slot_id = s.id and b.status in ('pending','pago')) as reservas_ativas
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where (e.nome ilike '%cerâmic%' or e.nome ilike '%ceramic%' or e.nome ilike '%modelagem%')
  and (s.data = '17/08' or s.event_at::date = date '2026-08-17')
  and s.horario ilike '%10h%';


-- =============================================================
-- CORREÇÃO (OPCIONAL — TUDO COMENTADO)
-- -------------------------------------------------------------
-- Só rode DEPOIS de ler D1–D3 e decidir. Duas opções:
--
-- (A) Preferível: use o painel "Recorrência" do admin. Agora ele
--     mostra o bloco "Datas à venda SEM regra de recorrência" e cada
--     data tem botão "Cancelar data". Um clique por data, com trava
--     de reservas pagas na própria UI. Mais seguro que SQL.
--
-- (B) Em massa via SQL — tira do site TODA data futura sem regra
--     ativa das experiências de cerâmica, MENOS as que têm reserva
--     paga/pendente (essas ficam pra você tratar com o cliente).
--     NÃO deleta nada: só marca is_active=false (reversível).
--
--   update public.experience_slots s
--      set is_active = false
--     from public.experiences e
--    where e.id = s.experience_id
--      and (e.nome ilike '%cerâmic%' or e.nome ilike '%ceramic%' or e.nome ilike '%modelagem%')
--      and s.is_active
--      and s.event_at >= now()
--      and s.recurrence_rule_id is null            -- só as sem regra
--      and not exists (                            -- preserva reservas ativas
--        select 1 from public.bookings b
--         where b.slot_id = s.id
--           and b.status in ('pending','pago')
--      );
--
--   -- Confira quantas saíram do site:
--   --   (rode D2 de novo — sem_regra_ativa deve cair; a linha do
--   --    17/08 com reserva paga CONTINUA à venda de propósito, pra
--   --    não bagunçar a compra da Samanta. Trate essa data à parte.)
-- =============================================================
