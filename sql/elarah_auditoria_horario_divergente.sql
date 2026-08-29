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
-- Nem toda divergência é horário errado. "19h00 – 21h00" e
-- "19h às 21h" são a MESMA turma escrita de dois jeitos: contam como
-- divergentes na consulta 1, mas ninguém comprou errado. Isso acontece
-- quando o rótulo do slot foi reescrito depois da venda.
--
-- O discriminador é a HORA DE INÍCIO: o primeiro número de cada rótulo.
-- Se bate, é cosmético. Se não bate (comprou 09h, turma é 15h), é
-- gente na turma errada.
--
-- Agrupa por par de rótulos pra você ver o padrão de uma vez, em vez
-- de ler 112 linhas. Comece por aqui, não pela consulta 1.
--
--   divergencia = REAL       → hora de início diferente. É problema.
--   divergencia = so_escrita → mesma hora, rótulo reescrito. Ignorar.
-- =============================================================
with norm as (
  select
    b.horario  as horario_comprado,
    s.horario  as horario_real,
    s.event_at,
    b.experiencia_nome,
    lower(regexp_replace(translate(coalesce(b.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_comprado,
    lower(regexp_replace(translate(coalesce(s.horario, ''), '–—', '--'), '[\s-]', '', 'g')) as k_real,
    -- hora de início = primeiro número do rótulo
    (regexp_match(coalesce(b.horario, ''), '(\d{1,2})'))[1]::int as ini_comprado,
    (regexp_match(coalesce(s.horario, ''), '(\d{1,2})'))[1]::int as ini_real
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
  count(*)                                    as quantas,
  count(*) filter (where event_at >= now())   as ainda_vao_acontecer,
  count(distinct experiencia_nome)            as experiencias
from classificado
group by divergencia, ordem, horario_comprado, horario_real
order by ordem, quantas desc;


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
