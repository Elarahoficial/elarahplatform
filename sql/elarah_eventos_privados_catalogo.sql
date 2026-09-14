-- =============================================================
-- ELARAH — Catálogo: novidades e campeãs (pra calibrar as mensagens)
-- -------------------------------------------------------------
-- SÓ LEITURA. Não altera nada — pode rodar à vontade.
--
-- PRA QUE SERVE: o painel de Eventos privados calcula sozinho as
-- campeãs e injeta em {{top_experiencias}}. Estas queries existem
-- pra DUAS coisas que o painel não faz:
--   1. listar as experiências NOVAS (e se já venderam);
--   2. sair do navegador — dá pra colar o resultado numa conversa,
--      mandar pra fornecedor, revisar texto de campanha.
--
-- Cole o resultado da query 1 aqui na conversa que eu escrevo as
-- mensagens citando as novidades pelo nome certo.
-- =============================================================


-- =============================================================
-- 1. NOVIDADES — experiências criadas nos últimos 120 dias
-- -------------------------------------------------------------
-- Ordenadas por faturamento: as de cima já pegaram, as de baixo
-- (0 venda) são as que precisam de empurrão — e são exatamente as
-- que valem oferecer num evento fechado, onde o grupo inteiro vem
-- de uma vez e a experiência estreia cheia.
-- =============================================================
with novas as (
  select id, nome, categoria, created_at,
         coalesce(is_active, true) as ativa
    from public.experiences
   where created_at >= now() - interval '120 days'
),
vendas as (
  select experiencia_id                       as id,
         count(*)                             as vendas,
         sum(coalesce(quantidade, 1))         as pessoas,
         sum(coalesce(amount_total, 0))       as bruto_centavos,
         max(created_at)                      as ultima_venda
    from public.bookings
   where status = 'pago'
   group by 1
)
select
  n.nome,
  n.categoria,
  to_char(n.created_at, 'DD/MM/YY')                      as criada_em,
  case when n.ativa then 'sim' else 'NÃO' end            as ativa,
  coalesce(v.vendas, 0)                                  as vendas,
  coalesce(v.pessoas, 0)                                 as pessoas,
  round(coalesce(v.bruto_centavos, 0) / 100.0, 2)        as faturamento,
  case when v.ultima_venda is null then '—'
       else to_char(v.ultima_venda, 'DD/MM/YY') end      as ultima_venda
from novas n
left join vendas v on v.id = n.id
order by coalesce(v.bruto_centavos, 0) desc, n.created_at desc;


-- =============================================================
-- 2. CAMPEÃS EM EVENTO FECHADO — 12 meses
-- -------------------------------------------------------------
-- O que grupo fechado realmente contrata (≠ do que vende no site).
-- É a lista que alimenta {{top_experiencias}} nas mensagens.
-- Precisa da view do sql/elarah_eventos_privados_comercial.sql.
-- =============================================================
select
  experience_name                                        as experiencia,
  count(*)                                               as eventos,
  sum(pessoas)                                           as pessoas,
  round(avg(pessoas), 1)                                 as pessoas_por_evento,
  round(sum(ticket_centavos) / 100.0, 2)                 as faturamento,
  round(avg(ticket_centavos) / 100.0, 2)                 as ticket_medio
from public.v_eventos_privados_historico
where occurred_on >= current_date - interval '12 months'
  and coalesce(experience_name, '') <> ''
group by 1
order by faturamento desc
limit 20;


-- =============================================================
-- 3. CAMPEÃ DE CADA TIPO DE EVENTO — 12 meses
-- -------------------------------------------------------------
-- Despedida e corporativo não compram a mesma coisa. Esta query
-- diz o que oferecer primeiro em cada conversa.
-- =============================================================
select tipo_label, experiencia, eventos, pessoas, faturamento
from (
  select
    tipo_label,
    experience_name                                      as experiencia,
    count(*)                                             as eventos,
    sum(pessoas)                                         as pessoas,
    round(sum(ticket_centavos) / 100.0, 2)               as faturamento,
    row_number() over (
      partition by tipo_label order by sum(ticket_centavos) desc
    )                                                    as posicao
  from public.v_eventos_privados_historico
  where occurred_on >= current_date - interval '12 months'
    and coalesce(experience_name, '') <> ''
  group by tipo_label, experience_name
) ranked
where posicao <= 3
order by tipo_label, posicao;


-- =============================================================
-- 4. O QUE ELAS PROCURAM E A GENTE NÃO TEM — 90 dias
-- -------------------------------------------------------------
-- Termos digitados na busca do site. Serve pra dois lados: pauta de
-- prospecção de fornecedor, e assunto de conversa com cliente que
-- pede "algo diferente".
-- =============================================================
select
  lower(btrim(target_label))                             as termo,
  count(*)                                               as buscas
from public.analytics_events
where event_name = 'search_used'
  and created_at >= now() - interval '90 days'
  and coalesce(btrim(target_label), '') <> ''
group by 1
having count(*) >= 2
order by buscas desc, termo
limit 40;
