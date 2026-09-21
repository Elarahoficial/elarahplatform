-- =============================================================
-- ELARAH — Fix: vagas negativas depois de recriar o horário
--          ("-34 / 8" na lista de experiências)
-- -------------------------------------------------------------
-- O QUE ACONTECEU (caso real: "Pintura em Taça", 10/10, 8 vagas,
-- aparecendo -34 / 8 em vermelho no admin)
--
--   1. No cadastro da experiência, o admin apagou a linha do horário
--      e digitou o horário de novo (mesmo texto) pra "zerar as vagas".
--   2. Isso não renomeia a turma: APAGA a linha de experience_slots e
--      cria outra, com id novo.
--   3. bookings.slot_id e manual_sales.slot_id são ON DELETE SET NULL.
--      Apagar o slot não apaga as vendas — arranca o VÍNCULO delas com
--      a turma. Todas as reservas e vendas manuais daquela turma ficam
--      soltas, sem turma nenhuma.
--   4. De 10 em 10 minutos, sweep_and_reconcile_vagas() recalcula
--      vagas_restantes do zero. Pra venda manual solta, ela perguntava
--      "de que turma é essa venda?" pra manual_sale_match_slot() — que
--      tinha um atalho: "se a experiência só tem UMA turma ativa, é
--      essa". Como o admin tinha acabado de deixar UMA turma só, TODAS
--      as vendas manuais históricas da experiência (qualquer data, de
--      qualquer mês) foram jogadas em cima da turma nova.
--   5. 8 vagas − 42 pessoas = -34. E o site passa a tratar a turma como
--      esgotada: o checkout recusa e o card some/trava.
--
-- O QUE ESTE ARQUIVO FAZ
--   1. manual_sale_match_slot() vira ESTRITA: venda com data só casa
--      com turma da MESMA data; o atalho da "única turma ativa" só vale
--      pra venda SEM data e pra turma que ainda não passou. Na dúvida,
--      devolve null — melhor venda sem turma do que venda na turma errada.
--   2. reconcile_all_vagas() para de RE-ADIVINHAR na hora de recontar.
--      Ele passa a usar manual_sales.slot_id, que é gravado uma vez na
--      hora da venda (pela trigger manual_sale_sync_inventory). Uma
--      varredura de manutenção nunca deve inventar vínculo novo.
--   3. Conserta o estado atual: religa o que dá pra religar com certeza
--      e roda a reconciliação.
--   4. No fim, mostra o que ficou (turmas negativas, vendas órfãs).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Como rodar: Supabase Dashboard → SQL Editor → cola este arquivo → Run.
--
-- Depende de: elarah_manual_sales_inventory.sql (trigger + reconcile),
--             elarah_vagas_sweep_reconcile_cron.sql (cron de 10 min).
-- =============================================================


-- =============================================================
-- 1. manual_sale_match_slot ESTRITA
-- -------------------------------------------------------------
-- Regra nova, em uma frase: a venda só entra numa turma quando dá pra
-- afirmar que é aquela turma. Data que não bate = não casa.
--
-- CASO 1 — venda COM data: casa por data real (event_at no fuso de SP);
--   se a turma não tem event_at, casa pelo rótulo ("10/10" ou
--   "10/10/2026"). O horário, quando informado, tem que casar por
--   prefixo. Não achou? Devolve null.
--   O bug antigo morava aqui também: o rótulo "10/10" não tem ano, e a
--   condição era um OR solto — uma venda de 10/10 do ano passado casava
--   com a turma de 10/10 deste ano mesmo com o event_at dizendo outra
--   coisa. Agora o event_at, quando existe, é a palavra final.
--
-- CASO 2 — venda SEM data: continua valendo o atalho "a experiência só
--   tem uma turma ativa, então é essa" (é como a admin cadastra venda de
--   evento de data única), mas só se essa turma ainda não passou. Turma
--   que já aconteceu não recebe venda avulsa por adivinhação.
-- =============================================================
create or replace function public.manual_sale_match_slot(
  p_experience_id uuid,
  p_slot_date     date,
  p_slot_time     text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_count integer;
  v_time  text := nullif(btrim(coalesce(p_slot_time, '')), '');
begin
  if p_experience_id is null then
    return null;
  end if;

  -- CASO 1: a venda tem data — só casa com turma da MESMA data.
  if p_slot_date is not null then
    select s.id
      into v_id
      from public.experience_slots s
     where s.experience_id = p_experience_id
       and coalesce(s.is_active, true) = true
       and (
             case
               when s.event_at is not null
                 then (s.event_at at time zone 'America/Sao_Paulo')::date = p_slot_date
               else s.data is not null
                    and s.data in (
                      to_char(p_slot_date, 'DD/MM'),
                      to_char(p_slot_date, 'DD/MM/YYYY')
                    )
             end
           )
       and (
             v_time is null
          or s.horario ilike (v_time || '%')
          or s.horario ilike (split_part(v_time, 'h', 1) || '%')
           )
     order by s.event_at nulls last
     limit 1;

    -- Sem casamento de data, devolve null de propósito: a venda fica
    -- sem turma (conta no contador da experiência) em vez de derrubar
    -- as vagas de uma turma que não é dela.
    return v_id;
  end if;

  -- CASO 2: venda sem data + experiência com uma turma ativa só.
  select count(*)
    into v_count
    from public.experience_slots s
   where s.experience_id = p_experience_id
     and coalesce(s.is_active, true) = true;

  if v_count = 1 then
    select s.id
      into v_id
      from public.experience_slots s
     where s.experience_id = p_experience_id
       and coalesce(s.is_active, true) = true
       and (s.event_at is null or s.event_at >= now() - interval '1 day')
     limit 1;
    return v_id;
  end if;

  return null;
end;
$$;


-- =============================================================
-- 2. reconcile_all_vagas() não re-adivinha mais
-- -------------------------------------------------------------
-- O vínculo venda ↔ turma é decidido UMA vez, na hora da venda, pela
-- trigger manual_sale_sync_inventory (que grava manual_sales.slot_id).
-- A varredura de 10 em 10 minutos só RECONTA — e recontar chamando o
-- adivinhador de novo era o que transformava um vínculo perdido em
-- vaga somada no lugar errado.
--
-- Venda manual sem slot_id agora cai no contador da EXPERIÊNCIA, do
-- mesmo jeito que já acontece com reserva do site sem slot_id. E só
-- entra lá quando a experiência não tem turma com vaga controlada —
-- senão uma venda antiga solta esgotaria a experiência inteira.
-- =============================================================
create or replace function public.reconcile_all_vagas()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Turmas (slots) com capacidade definida
  update public.experience_slots s
     set vagas_restantes = s.vagas_total - (
       coalesce((
         select sum(greatest(coalesce(b.quantidade, 1), 1))
           from public.bookings b
          where b.slot_id = s.id
            and b.status in ('pending', 'pago')
       ), 0)
       + coalesce((
         select sum(greatest(coalesce(ms.quantity, 1), 1))
           from public.manual_sales ms
          where ms.slot_id = s.id
            and ms.payment_status in ('pago', 'pendente')
       ), 0)
     )
   where s.vagas_total is not null;

  -- Experiências com capacidade própria (sem turma, ou vendas soltas)
  update public.experiences e
     set vagas_restantes = e.vagas_total - (
       coalesce((
         select sum(greatest(coalesce(b.quantidade, 1), 1))
           from public.bookings b
          where b.experiencia_id = e.id
            and b.slot_id is null
            and b.status in ('pending', 'pago')
       ), 0)
       + coalesce((
         select sum(greatest(coalesce(ms.quantity, 1), 1))
           from public.manual_sales ms
          where ms.experience_id = e.id
            and ms.slot_id is null
            and ms.payment_status in ('pago', 'pendente')
            and not exists (
              select 1
                from public.experience_slots s2
               where s2.experience_id = e.id
                 and coalesce(s2.is_active, true) = true
                 and s2.vagas_total is not null
            )
       ), 0)
     )
   where e.vagas_total is not null;
end;
$$;


-- =============================================================
-- 3. Conserto do estado atual
-- -------------------------------------------------------------
-- Religa o que dá pra religar COM CERTEZA. O que não dá, fica solto
-- e aparece no relatório do passo 4 pra resolver à mão — solto é
-- ruim, mas na turma errada é pior.
-- =============================================================

-- 3a) Venda manual solta que TEM data: usa a regra estrita nova.
--     Venda sem data não entra aqui de propósito — sem data, religar
--     é chute, e chute foi o que criou o -34.
update public.manual_sales ms
   set slot_id = public.manual_sale_match_slot(ms.experience_id, ms.slot_date, ms.slot_time)
 where ms.slot_id is null
   and ms.slot_date is not null
   and ms.payment_status in ('pago', 'pendente')
   and public.manual_sale_match_slot(ms.experience_id, ms.slot_date, ms.slot_time) is not null;

-- 3b) Reserva do site solta (slot_id zerado quando a turma foi apagada).
--     Só religa quando o casamento é ÚNICO e coerente no tempo:
--       · mesma experiência, mesmo rótulo de data, mesmo horário
--         (comparação tolerante a espaço/caixa/travessão);
--       · a turma existe, está ativa e tem data real (event_at);
--       · a compra aconteceu ANTES da turma e no máximo 180 dias antes
--         — é isso que impede casar "10/10" do ano passado com "10/10"
--         deste ano, já que o rótulo não tem ano;
--       · existe UM único slot candidato.
with norm_bookings as (
  select b.id, b.experiencia_id, b.created_at, b.data,
         lower(regexp_replace(translate(coalesce(b.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_horario
    from public.bookings b
   where b.slot_id is null
     and b.status in ('pending', 'pago')
),
candidatos as (
  select nb.id as booking_id,
         s.id  as slot_id,
         count(*) over (partition by nb.id) as n_candidatos
    from norm_bookings nb
    join public.experience_slots s
      on s.experience_id = nb.experiencia_id
     and coalesce(s.is_active, true) = true
     and s.event_at is not null
     and coalesce(s.data, '') = coalesce(nb.data, '')
     and lower(regexp_replace(translate(coalesce(s.horario, ''), '–—', '--'), '[\s-]', '', 'g')) = nb.k_horario
     and nb.created_at <= s.event_at
     and nb.created_at >= s.event_at - interval '180 days'
)
update public.bookings b
   set slot_id = c.slot_id
  from candidatos c
 where c.booking_id = b.id
   and c.n_candidatos = 1;

-- 3c) Recalcula tudo do zero com as regras novas.
select public.reconcile_all_vagas();


-- =============================================================
-- 4. Relatório — o que ficou de pé
-- -------------------------------------------------------------
-- Rode estas três consultas e olhe o resultado. O esperado é:
--   4a) nenhuma linha (nenhuma turma negativa);
--   4b) e 4c) podem ter linhas — são vendas que ficaram sem turma e
--       precisam de decisão humana (preencher a data da venda no
--       painel de Vendas manuais resolve a maioria).
-- =============================================================

-- 4a) Turmas com vaga negativa (overbooking real ou contador torto)
select
  e.nome                                   as experiencia,
  coalesce(s.data, '—')                    as data_rotulo,
  to_char(s.event_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_real,
  s.horario,
  s.vagas_total,
  s.vagas_restantes,
  (s.vagas_total - s.vagas_restantes)      as pessoas_contadas,
  s.id                                     as slot_id
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where s.vagas_total is not null
  and s.vagas_restantes < 0
order by s.vagas_restantes asc;

-- 4b) Vendas manuais sem turma (não entram na conta de nenhuma turma)
select
  ms.experience_name                       as experiencia,
  ms.customer_name                         as cliente,
  ms.slot_date                             as data_da_venda,
  coalesce(ms.slot_time, '—')              as horario_da_venda,
  ms.quantity                              as pessoas,
  ms.payment_status,
  to_char(ms.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as registrada_em,
  ms.id                                    as manual_sale_id
from public.manual_sales ms
where ms.slot_id is null
  and ms.payment_status in ('pago', 'pendente')
order by ms.slot_date desc nulls last, ms.created_at desc;

-- 4c) Reservas do site sem turma (vínculo perdido em alguma edição)
select
  b.experiencia_nome                       as experiencia,
  b.nome                                   as cliente,
  coalesce(b.data, '—')                    as data_comprada,
  coalesce(b.horario, '—')                 as horario_comprado,
  coalesce(b.quantidade, 1)                as pessoas,
  b.status,
  to_char(b.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as comprou_em,
  b.id                                     as booking_id
from public.bookings b
where b.slot_id is null
  and b.status in ('pending', 'pago')
order by b.created_at desc;


-- ===== Refresh do cache do PostgREST =====
notify pgrst, 'reload schema';
