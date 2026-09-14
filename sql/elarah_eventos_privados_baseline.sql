-- =============================================================
-- ELARAH — Eventos privados: números pra calibrar as metas
-- -------------------------------------------------------------
-- SÓ LEITURA. Nada aqui altera dado nenhum — pode rodar à vontade
-- no SQL Editor do Supabase.
--
-- Pra que serve: antes de cobrar "X eventos por semana" é preciso
-- saber quantos a gente fecha HOJE e a que ticket. Estas queries
-- respondem isso e já devolvem a meta sugerida.
--
-- PRÉ-REQUISITO: rodar antes o sql/elarah_eventos_privados_comercial.sql
-- (cria a view v_eventos_privados_historico, que é o critério único
-- de "o que conta como evento privado fechado").
--
-- A aba "Eventos privados" do admin calcula tudo isto sozinha, ao
-- vivo, toda vez que abre. Este arquivo existe pra conferir número
-- na mão e pra investigar recortes que a aba não mostra.
-- =============================================================


-- =============================================================
-- 1. RESUMO — últimos 12 meses
-- -------------------------------------------------------------
-- A foto geral: volume, gente, dinheiro e ticket médio.
-- =============================================================
select
  count(*)                                                   as eventos,
  sum(pessoas)                                               as pessoas,
  round(sum(ticket_centavos) / 100.0, 2)                     as faturamento_reais,
  round(sum(receita_elarah_centavos) / 100.0, 2)             as receita_elarah_reais,
  round(avg(ticket_centavos) / 100.0, 2)                     as ticket_medio_reais,
  -- Mediana costuma ser mais honesta que a média quando um evento
  -- gigante puxa tudo pra cima. Se as duas divergem muito, use a
  -- mediana pra calibrar a meta de receita.
  round(percentile_cont(0.5) within group (order by ticket_centavos) / 100.0, 2)
                                                             as ticket_mediana_reais
from public.v_eventos_privados_historico
where occurred_on >= current_date - interval '12 months';


-- =============================================================
-- 2. MÊS A MÊS — últimos 12 meses
-- -------------------------------------------------------------
-- Serve pra ver tendência e pra achar os meses fortes/fracos
-- (a meta semanal pode ser sazonal em vez de fixa).
-- =============================================================
select
  to_char(date_trunc('month', occurred_on), 'YYYY-MM')       as mes,
  count(*)                                                   as eventos,
  sum(pessoas)                                               as pessoas,
  round(sum(ticket_centavos) / 100.0, 2)                     as faturamento_reais,
  round(avg(ticket_centavos) / 100.0, 2)                     as ticket_medio_reais
from public.v_eventos_privados_historico
where occurred_on >= current_date - interval '12 months'
group by 1
order by 1;


-- =============================================================
-- 3. POR TIPO DE EVENTO — últimos 12 meses
-- -------------------------------------------------------------
-- Qual vertente sustenta o faturamento. Se despedida tem ticket
-- 3x o de aniversário, a meta dela não pode ser "1 evento = 1
-- evento" — vale priorizar na prospecção e no follow-up.
-- =============================================================
select
  tipo_label,
  count(*)                                                   as eventos,
  sum(pessoas)                                               as pessoas,
  round(avg(pessoas), 1)                                     as pessoas_por_evento,
  round(sum(ticket_centavos) / 100.0, 2)                     as faturamento_reais,
  round(avg(ticket_centavos) / 100.0, 2)                     as ticket_medio_reais,
  round(sum(receita_elarah_centavos) / 100.0, 2)             as receita_elarah_reais
from public.v_eventos_privados_historico
where occurred_on >= current_date - interval '12 months'
group by 1
order by faturamento_reais desc;


-- =============================================================
-- 4. META SUGERIDA — a partir dos últimos 90 dias
-- -------------------------------------------------------------
-- Esta é a query que define a régua. Lê o ritmo real dos últimos
-- 90 dias, transforma em média semanal e aplica o fator de
-- crescimento configurado em evento_privado_metas.
--
-- É exatamente a mesma conta que a aba do admin faz ao vivo.
-- =============================================================
with base as (
  select
    count(*)::numeric                    as eventos_90d,
    coalesce(avg(ticket_centavos), 0)    as ticket_medio_centavos,
    coalesce(sum(ticket_centavos), 0)    as faturamento_90d_centavos
  from public.v_eventos_privados_historico
  where occurred_on >= current_date - interval '90 days'
),
cfg as (
  select
    coalesce(max(fator_crescimento), 1.30) as fator,
    coalesce(max(meta_prospeccao_min), 30) as prospeccao_min,
    coalesce(max(meta_prospeccao_max), 50) as prospeccao_max
  from public.evento_privado_metas
)
select
  base.eventos_90d                                                       as eventos_ultimos_90d,
  round(base.eventos_90d / 12.857, 2)                                    as eventos_por_semana_hoje,
  round(base.ticket_medio_centavos / 100.0, 2)                           as ticket_medio_reais,
  cfg.fator                                                              as fator_crescimento,
  -- Meta de eventos: ritmo atual x fator, sempre pelo menos 1 —
  -- meta zero não é meta.
  greatest(1, ceil((base.eventos_90d / 12.857) * cfg.fator))             as meta_eventos_semana,
  round(
    greatest(1, ceil((base.eventos_90d / 12.857) * cfg.fator))
    * base.ticket_medio_centavos / 100.0, 2
  )                                                                      as meta_receita_semana_reais,
  cfg.prospeccao_min || '–' || cfg.prospeccao_max                        as meta_prospeccao_semana
from base, cfg;


-- =============================================================
-- 5. SAZONALIDADE — mês do ano, histórico inteiro
-- -------------------------------------------------------------
-- Onde estão os picos (formatura, fim de ano, junho de casamento).
-- Prospecção de empresa tem que sair ~60 dias ANTES do pico.
-- =============================================================
select
  to_char(occurred_on, 'MM')                                 as mes_do_ano,
  count(*)                                                   as eventos,
  round(avg(ticket_centavos) / 100.0, 2)                     as ticket_medio_reais
from public.v_eventos_privados_historico
group by 1
order by 1;


-- =============================================================
-- 6. FUNIL DE ORÇAMENTO — conversão e SLA
-- -------------------------------------------------------------
-- Só devolve número depois que a aba começar a ser usada (a tabela
-- nasce vazia). É o que mostra se o gargalo é FALTAR LEAD ou
-- PERDER LEAD — e as duas coisas pedem ações opostas.
-- =============================================================
select
  count(*)                                                                as leads,
  count(*) filter (where status = 'fechado')                              as fechados,
  count(*) filter (where status in ('perdido', 'sem_resposta'))           as perdidos,
  count(*) filter (where orcamento_enviado_at is not null)                as orcamentos_enviados,
  -- Conversão orçamento → fechado: a métrica que define quantos
  -- orçamentos são necessários pra bater a meta de eventos.
  round(
    100.0 * count(*) filter (where status = 'fechado')
    / nullif(count(*) filter (where orcamento_enviado_at is not null), 0), 1
  )                                                                       as conversao_orcamento_pct,
  -- Tempo de primeira resposta em horas CORRIDAS (a aba mostra em
  -- horas úteis, que é a régua real do SLA — aqui é aproximação).
  round(
    avg(extract(epoch from (primeira_resposta_at - lead_at)) / 3600.0)
      filter (where primeira_resposta_at is not null), 2
  )                                                                       as horas_ate_1a_resposta_media,
  round(
    avg(extract(epoch from (orcamento_enviado_at - lead_at)) / 3600.0)
      filter (where orcamento_enviado_at is not null), 2
  )                                                                       as horas_ate_orcamento_media,
  round(avg(valor_fechado_centavos) filter (where status = 'fechado') / 100.0, 2)
                                                                          as ticket_medio_fechado_reais
from public.evento_privado_leads
where lead_at >= current_date - interval '90 days';


-- =============================================================
-- 7. PROSPECÇÃO B2B — empresas novas abordadas por semana
-- -------------------------------------------------------------
-- Confere a meta de 30–50/semana. Conta a PRIMEIRA abordagem de
-- cada empresa (não os follow-ups), que é o que a meta cobra.
-- =============================================================
with primeira_abordagem as (
  select
    prospect_id,
    min(occurred_at) as abordado_em
  from public.b2b_prospect_interactions
  where tipo = 'mensagem_enviada'
  group by prospect_id
)
select
  to_char(date_trunc('week', abordado_em), 'YYYY-MM-DD')     as semana_iniciada_em,
  count(*)                                                   as empresas_abordadas
from primeira_abordagem
where abordado_em >= current_date - interval '12 weeks'
group by 1
order by 1 desc;
