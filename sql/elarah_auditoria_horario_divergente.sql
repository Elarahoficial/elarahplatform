-- =============================================================
-- ELARAH — Auditoria: reservas com HORÁRIO divergente do slot
-- -------------------------------------------------------------
-- Só CONSULTA. Não altera nada. Pode rodar quantas vezes quiser.
--
-- POR QUE ISSO EXISTE
-- O seletor de horário do checkout listava os horários de TODAS as
-- datas da experiência, não os da data escolhida. Trocar o horário lá
-- dentro mudava só o RÓTULO (bookings.horario) — o bookings.slot_id
-- continuava o da escolha feita na página. Resultado: a reserva foi
-- gravada com o texto de um horário e a vaga baixada em outro.
--
-- O bug já está corrigido no site. Estas consultas servem pra achar o
-- que foi vendido ENQUANTO ele estava no ar: quem comprou com horário
-- trocado e em qual turma a pessoa realmente está.
--
-- COMO LER O RESULTADO
--   horario_comprado  → o que a pessoa viu e acha que comprou
--   horario_real      → a turma onde a vaga foi de fato reservada
-- Divergiu, é um cliente pra avisar.
-- =============================================================


-- =============================================================
-- HELPER — horário de início de um rótulo, em minutos
-- -------------------------------------------------------------
-- Os rótulos são texto livre e vieram de várias épocas do site:
-- "14h00 – 15h30", "9h30 às 12h30", "12:30 - 16:30", "10h – 13h".
-- Esta função extrai só o começo e devolve minutos desde a meia-noite,
-- pra dar pra comparar rótulos escritos de jeitos diferentes.
-- Sem "HH" reconhecível, devolve NULL (a consulta marca conferir_na_mao).
--
-- IMMUTABLE + sem acesso a tabela: é só parsing de texto.
-- =============================================================
create or replace function public.elarah_inicio_min(rotulo text)
returns integer
language sql
immutable
as $$
  select case
    when m is null then null
    else (m[1])::int * 60 + coalesce((m[2])::int, 0)
  end
  from (
    select regexp_match(coalesce(rotulo, ''), '(\d{1,2})\s*[h:]\s*(\d{2})?') as m
  ) x;
$$;


-- =============================================================
-- 1) AS RESERVAS DIVERGENTES (o que importa)
-- -------------------------------------------------------------
-- Compara o rótulo gravado na reserva com o rótulo do slot que ela
-- de fato ocupa. A comparação normaliza espaços, caixa e os travessões
-- (– — -), senão "15h00 – 18h00" e "15h00-18h00" apareceriam como
-- divergência sem serem.
-- =============================================================
with norm as (
  select
    b.id,
    b.created_at,
    b.status,
    b.nome,
    b.email,
    b.telefone,
    b.quantidade,
    b.experiencia_nome,
    b.horario                      as horario_comprado,
    b.data                         as data_comprada,
    s.horario                      as horario_real,
    s.event_at,
    s.id                           as slot_id,
    lower(regexp_replace(translate(coalesce(b.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_comprado,
    lower(regexp_replace(translate(coalesce(s.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_real
  from public.bookings b
  join public.experience_slots s on s.id = b.slot_id
  where b.slot_id is not null
    and b.status in ('pago', 'pending')
)
select
  to_char(event_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as data_da_turma,
  experiencia_nome,
  horario_comprado,
  horario_real,
  case
    when event_at < now() then 'JÁ ACONTECEU'
    else 'ainda vai acontecer'
  end                        as situacao,
  nome,
  email,
  telefone,
  quantidade,
  status,
  to_char(created_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as comprou_em,
  id                         as booking_id,
  slot_id
from norm
where k_comprado <> ''
  and k_real <> ''
  and k_comprado <> k_real
order by event_at asc, experiencia_nome asc;


-- =============================================================
-- 2) RESUMO — quantas, quanto tempo, quais experiências
-- -------------------------------------------------------------
-- Roda a mesma comparação e devolve uma linha só. Serve pra medir o
-- tamanho do estrago sem ler a lista inteira.
-- =============================================================
with norm as (
  select
    b.id, b.created_at, b.status, b.experiencia_nome, s.event_at,
    lower(regexp_replace(translate(coalesce(b.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_comprado,
    lower(regexp_replace(translate(coalesce(s.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_real
  from public.bookings b
  join public.experience_slots s on s.id = b.slot_id
  where b.slot_id is not null
    and b.status in ('pago', 'pending')
),
div as (
  select * from norm
  where k_comprado <> '' and k_real <> '' and k_comprado <> k_real
)
select
  (select count(*) from div)                                             as reservas_divergentes,
  (select count(*) from div where event_at >= now())                     as ainda_vao_acontecer,
  (select count(*) from div where event_at <  now())                     as ja_aconteceram,
  (select count(distinct experiencia_nome) from div)                     as experiencias_afetadas,
  (select to_char(min(created_at) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') from div) as primeira_compra,
  (select to_char(max(created_at) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') from div) as ultima_compra,
  (select count(*) from norm)                                            as total_conferido;


-- =============================================================
-- 2B) TRIAGEM — divergência REAL ou só jeito de escrever?
-- -------------------------------------------------------------
-- Nem toda divergência é horário errado. "9h30 às 12h30" e
-- "9h30 – 12h30" são a MESMA turma escrita de dois jeitos: contam como
-- divergentes na consulta 1, mas ninguém comprou errado. Isso acontece
-- quando o rótulo do slot foi reescrito depois da venda.
--
-- O discriminador é o HORÁRIO DE INÍCIO, em hora E minuto. Comparar só
-- a hora era grosseiro demais: "15h30" e "15h00" têm a mesma hora e são
-- meia hora de diferença — gente chegando na hora errada classificada
-- como cosmética.
--
--   REAL       → início diferente. A pessoa chega na hora errada.
--   so_escrita → mesmo início, rótulo escrito de outro jeito (ou com
--                fim diferente, o que não muda a hora de chegar).
--
-- `diferenca_min` é (início real − início comprado), o tamanho do erro:
--   positivo → a turma começa DEPOIS do que a pessoa acha: ela chega
--              ADIANTADA e espera (comprou 13h, aula é 14h → +60).
--   negativo → a turma começa ANTES: ela chega ATRASADA e perde parte
--              da aula (comprou 14h30, aula é 14h → −30). Pior caso.
-- =============================================================
with norm as (
  select
    b.horario  as horario_comprado,
    s.horario  as horario_real,
    s.event_at,
    b.experiencia_nome,
    lower(regexp_replace(translate(coalesce(b.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_comprado,
    lower(regexp_replace(translate(coalesce(s.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_real,
    -- Início em minutos desde a meia-noite. Pega o primeiro "HH" seguido
    -- de h ou :, e os "MM" logo depois quando existirem ("10h" = 10h00).
    public.elarah_inicio_min(b.horario) as ini_comprado,
    public.elarah_inicio_min(s.horario) as ini_real
  from public.bookings b
  join public.experience_slots s on s.id = b.slot_id
  where b.slot_id is not null
    and b.status in ('pago', 'pending')
),
classificado as (
  -- Classifica ANTES de agrupar: a chave de ordenação precisa existir
  -- como coluna pra poder entrar no group by junto.
  select
    case
      when ini_comprado is null or ini_real is null then 'conferir_na_mao'
      when ini_comprado = ini_real then 'so_escrita'
      else 'REAL'
    end as divergencia,
    case
      when ini_comprado is null or ini_real is null then 1
      when ini_comprado = ini_real then 2
      else 0
    end as ordem,
    (ini_real - ini_comprado) as diferenca_min,
    horario_comprado,
    horario_real,
    event_at,
    experiencia_nome
  from norm
  where k_comprado <> ''
    and k_real <> ''
    and k_comprado <> k_real
)
select
  divergencia,
  horario_comprado,
  horario_real,
  diferenca_min,
  count(*)                                    as quantas,
  count(*) filter (where event_at >= now())   as ainda_vao_acontecer,
  count(distinct experiencia_nome)            as experiencias
from classificado
group by divergencia, ordem, diferenca_min, horario_comprado, horario_real
order by ordem, quantas desc;


-- =============================================================
-- 2C) A CAUSA — bug do checkout ou rótulo da turma reescrito?
-- -------------------------------------------------------------
-- Isso muda o que você fala com o cliente, então vale separar.
--
--   bug_do_checkout    → o horário comprado EXISTE como rótulo em
--                        outra data da mesma experiência. É a assinatura
--                        do bug: o modal oferecia os horários das outras
--                        datas, a pessoa escolheu um e ficou no slot
--                        errado. Ela NUNCA foi avisada — acha mesmo que
--                        a aula é naquela hora.
--
--   turma_foi_remarcada→ o horário comprado não existe em nenhuma data
--                        dessa experiência. Mais provável que o rótulo
--                        do slot tenha sido reescrito depois da venda
--                        (turma remarcada). Nesse caso a pessoa PODE já
--                        ter sido avisada por fora — confira antes de
--                        mandar mensagem, pra não confundir.
--
-- Só olha divergência REAL de início e turma que ainda vai acontecer.
-- =============================================================
with div as (
  select
    b.id, b.nome, b.email, b.telefone, b.quantidade, b.status,
    b.horario as horario_comprado,
    s.horario as horario_real,
    s.experience_id, s.id as slot_id, s.event_at,
    b.experiencia_nome,
    public.elarah_inicio_min(b.horario) as ini_comprado,
    public.elarah_inicio_min(s.horario) as ini_real
  from public.bookings b
  join public.experience_slots s on s.id = b.slot_id
  where b.slot_id is not null
    and b.status in ('pago', 'pending')
    and s.event_at >= now()
)
select
  case when exists (
    select 1
    from public.experience_slots s2
    where s2.experience_id = d.experience_id
      and s2.id <> d.slot_id
      and public.elarah_inicio_min(s2.horario) = d.ini_comprado
  ) then 'bug_do_checkout' else 'turma_foi_remarcada' end as causa_provavel,
  count(*)                          as reservas,
  sum(d.quantidade)                 as pessoas,
  count(distinct d.experiencia_nome) as experiencias
from div d
where d.ini_comprado is not null
  and d.ini_real is not null
  and d.ini_comprado <> d.ini_real
group by 1
order by 2 desc;


-- =============================================================
-- 2D) LISTA DE AÇÃO — quem avisar, agrupado por turma
-- -------------------------------------------------------------
-- O que sobra pra fazer na prática: as turmas FUTURAS que têm gente
-- esperando outro horário. Uma linha por cliente, na ordem das turmas
-- que acontecem primeiro — é por onde começar a avisar.
--
-- `chega` traduz o erro pra linguagem de gente: quanto a pessoa vai
-- chegar adiantada ou atrasada se ninguém avisar.
-- =============================================================
select
  to_char(s.event_at at time zone 'America/Sao_Paulo', 'DD/MM (Dy) HH24:MI') as turma,
  b.experiencia_nome                        as oficina,
  s.horario                                 as horario_real,
  b.horario                                 as horario_que_a_pessoa_acha,
  case
    when public.elarah_inicio_min(s.horario) > public.elarah_inicio_min(b.horario)
      then (public.elarah_inicio_min(s.horario) - public.elarah_inicio_min(b.horario)) || ' min ADIANTADA'
    else (public.elarah_inicio_min(b.horario) - public.elarah_inicio_min(s.horario)) || ' min ATRASADA'
  end                                       as chega,
  b.nome, b.email, b.telefone, b.quantidade, b.status,
  b.id                                      as booking_id
from public.bookings b
join public.experience_slots s on s.id = b.slot_id
where b.slot_id is not null
  and b.status in ('pago', 'pending')
  and s.event_at >= now()
  and public.elarah_inicio_min(b.horario) is not null
  and public.elarah_inicio_min(s.horario) is not null
  and public.elarah_inicio_min(b.horario) <> public.elarah_inicio_min(s.horario)
order by s.event_at asc, b.nome asc;


-- =============================================================
-- 3) DATA divergente (o caso mais grave, se existir)
-- -------------------------------------------------------------
-- Pior que horário trocado é DIA trocado. Compara o rótulo de data da
-- reserva ("DD/MM") com o dia real do slot, em America/Sao_Paulo.
-- Ignora reservas sem rótulo de data e agendamento livre (onde a data
-- é preferência do cliente, não turma).
-- =============================================================
select
  to_char(s.event_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as data_real_da_turma,
  b.data              as data_comprada,
  b.horario           as horario_comprado,
  s.horario           as horario_real,
  b.experiencia_nome,
  b.nome, b.email, b.telefone, b.quantidade, b.status,
  b.id                as booking_id
from public.bookings b
join public.experience_slots s on s.id = b.slot_id
where b.slot_id is not null
  and b.status in ('pago', 'pending')
  and b.data is not null
  and b.data ~ '^\d{1,2}/\d{1,2}'
  and left(b.data, 5) <> to_char(s.event_at at time zone 'America/Sao_Paulo', 'DD/MM')
order by s.event_at asc;


-- =============================================================
-- 4) CONFERÊNCIA DE VAGAS por turma futura
-- -------------------------------------------------------------
-- Se as vagas baixaram na turma errada, o contador do slot pode não
-- bater com quem realmente comprou. Aqui: vagas_restantes gravado vs.
-- o que sobra recontando do zero.
--
-- A regra de "ocupa vaga" é a MESMA que o banco já usa em
-- reconcile_all_vagas() (sql/elarah_manual_sales_inventory.sql):
-- bookings pending/pago + vendas manuais pago/pendente. Reserva
-- pendente segura a vaga — o decremento acontece na criação do
-- checkout, não no pagamento —, então contar só as pagas acusaria
-- divergência onde não há.
--
-- A coluna `confere` é o que interessa:
--   OK          → contador certo
--   DIVERGENTE  → contador precisa de correção antes de abrir a turma
--
-- COMO CORRIGIR o que sair como DIVERGENTE: o banco já tem a rotina
-- pronta, idempotente (recalcula do zero, não soma):
--     select public.reconcile_all_vagas();
-- Rode a consulta abaixo de novo depois — tem que voltar tudo OK.
-- =============================================================
with pessoas as (
  select
    s.id as slot_id,
    coalesce((
      select sum(b.quantidade) from public.bookings b
      where b.slot_id = s.id and b.status in ('pending', 'pago')
    ), 0) as pessoas_site,
    coalesce((
      select sum(ms.quantity) from public.manual_sales ms
      where ms.slot_id = s.id and ms.payment_status in ('pago', 'pendente')
    ), 0) as pessoas_manual
  from public.experience_slots s
)
select
  to_char(s.event_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as turma,
  e.nome            as oficina,
  s.horario,
  s.vagas_total,
  s.vagas_restantes                                        as restantes_gravado,
  (p.pessoas_site + p.pessoas_manual)                      as pessoas_confirmadas,
  (s.vagas_total - (p.pessoas_site + p.pessoas_manual))    as restantes_calculado,
  case
    when s.vagas_restantes is null then 'DIVERGENTE'
    when s.vagas_restantes = s.vagas_total - (p.pessoas_site + p.pessoas_manual) then 'OK'
    else 'DIVERGENTE'
  end               as confere,
  s.id              as slot_id
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
join pessoas p on p.slot_id = s.id
where s.is_active
  and s.event_at >= now()
  and s.vagas_total is not null
order by
  case when s.vagas_restantes is distinct from
       s.vagas_total - (p.pessoas_site + p.pessoas_manual) then 0 else 1 end,
  s.event_at asc;
