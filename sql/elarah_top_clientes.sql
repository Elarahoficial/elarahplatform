-- =============================================================
-- ELARAH — Top clientes (quem mais comprou)
-- -------------------------------------------------------------
-- Ranking de clientes juntando as DUAS fontes de venda:
--   * public.bookings      → checkout do site (status = 'pago')
--   * public.manual_sales  → WhatsApp/Pix/InfinityPay etc.
--                            (payment_status = 'pago')
--
-- SEGMENTO — sem isso o ranking vira uma lista de eventos
-- corporativos, que são poucas vendas de ticket altíssimo e
-- abafam a cliente de verdade. Cada venda é classificada em:
--   'corporativo' → manual_sales.event_type = 'corporativo'
--   'evento'      → grupo fechado (aniversário, despedida, meu
--                   grupo…), mesma regra da aba Eventos do admin:
--                   is_event manda; senão quantity >= 3 ou tem tipo
--   'varejo'      → o resto (todo o checkout do site + venda
--                   manual avulsa)
--
-- A QUERY 1 (o ranking principal) EXCLUI o corporativo.
-- A QUERY 2 lista o corporativo separado, pra olhar quando quiser.
--
-- Chave do cliente: e-mail normalizado (lower + trim). Quando não
-- há e-mail (venda manual só com WhatsApp), cai pro telefone com
-- os dígitos limpos; sem nenhum dos dois, cai pro nome.
--
-- SOMENTE LEITURA — não altera nada. Rode no SQL Editor do
-- Supabase (Dashboard → SQL Editor → cola → Run).
-- =============================================================


-- =============================================================
-- QUERY 1 — TOP 10 CLIENTES (sem evento corporativo)
-- =============================================================
with vendas as (
  -- ===== Checkout do site — sempre varejo =====
  select
    coalesce(
      nullif(lower(trim(b.email)), ''),
      nullif(regexp_replace(coalesce(b.telefone, ''), '\D', '', 'g'), ''),
      nullif(lower(trim(b.nome)), ''),
      b.id::text
    )                                        as cliente_key,
    nullif(trim(b.nome), '')                 as nome,
    nullif(lower(trim(b.email)), '')         as email,
    nullif(trim(b.telefone), '')             as telefone,
    coalesce(b.amount_total, 0)              as valor_centavos,
    coalesce(b.quantidade, 1)                as vagas,
    b.experiencia_nome                       as experiencia,
    b.created_at                             as comprou_em,
    'site'::text                             as origem,
    'varejo'::text                           as segmento
  from public.bookings b
  where b.status = 'pago'

  union all

  -- ===== Vendas manuais — classifica o segmento =====
  select
    coalesce(
      nullif(lower(trim(m.customer_email)), ''),
      nullif(regexp_replace(coalesce(m.customer_phone, ''), '\D', '', 'g'), ''),
      nullif(lower(trim(m.customer_name)), ''),
      m.id::text
    ),
    nullif(trim(m.customer_name), ''),
    nullif(lower(trim(m.customer_email)), ''),
    nullif(trim(m.customer_phone), ''),
    coalesce(m.total_amount_centavos, 0),
    coalesce(m.quantity, 1),
    m.experience_name,
    m.created_at,
    'manual'::text,
    case
      when m.event_type = 'corporativo' then 'corporativo'
      -- mesma regra do _isEventoSale() do admin
      when m.is_event is true then 'evento'
      when m.is_event is false then 'varejo'
      when coalesce(m.quantity, 1) >= 3 or m.event_type is not null then 'evento'
      else 'varejo'
    end
  from public.manual_sales m
  where m.payment_status = 'pago'
)
select
  row_number() over (
    order by sum(valor_centavos) desc, count(*) desc
  )                                                      as posicao,
  -- nome mais recente que a cliente usou
  (array_agg(nome order by comprou_em desc)
     filter (where nome is not null))[1]                 as cliente,
  (array_agg(email order by comprou_em desc)
     filter (where email is not null))[1]                as email,
  (array_agg(telefone order by comprou_em desc)
     filter (where telefone is not null))[1]             as telefone,
  count(*)                                               as compras,
  sum(vagas)                                             as vagas_total,
  round(sum(valor_centavos) / 100.0, 2)                  as total_gasto_reais,
  round(avg(valor_centavos) / 100.0, 2)                  as ticket_medio_reais,
  min(comprou_em)::date                                  as primeira_compra,
  max(comprou_em)::date                                  as ultima_compra,
  count(distinct experiencia)                            as experiencias_distintas,
  string_agg(distinct origem,   ' + ' order by origem)   as origens,
  string_agg(distinct segmento, ' + ' order by segmento) as segmentos
from vendas
where segmento <> 'corporativo'
group by cliente_key
order by total_gasto_reais desc, compras desc
limit 10;


-- =============================================================
-- QUERY 2 — TOP 10 CORPORATIVO (as empresas, separado)
-- =============================================================
select
  row_number() over (
    order by sum(coalesce(m.total_amount_centavos, 0)) desc, count(*) desc
  )                                                              as posicao,
  (array_agg(nullif(trim(m.customer_name), '') order by m.created_at desc)
     filter (where nullif(trim(m.customer_name), '') is not null))[1]  as cliente,
  (array_agg(nullif(lower(trim(m.customer_email)), '') order by m.created_at desc)
     filter (where nullif(trim(m.customer_email), '') is not null))[1] as email,
  (array_agg(nullif(trim(m.customer_phone), '') order by m.created_at desc)
     filter (where nullif(trim(m.customer_phone), '') is not null))[1] as telefone,
  count(*)                                                       as eventos,
  sum(coalesce(m.quantity, 1))                                   as pessoas_total,
  round(sum(coalesce(m.total_amount_centavos, 0)) / 100.0, 2)    as total_gasto_reais,
  round(avg(coalesce(m.total_amount_centavos, 0)) / 100.0, 2)    as ticket_medio_reais,
  min(m.created_at)::date                                        as primeiro_evento,
  max(m.created_at)::date                                        as ultimo_evento
from public.manual_sales m
where m.payment_status = 'pago'
  and m.event_type = 'corporativo'
group by coalesce(
  nullif(lower(trim(m.customer_email)), ''),
  nullif(regexp_replace(coalesce(m.customer_phone, ''), '\D', '', 'g'), ''),
  nullif(lower(trim(m.customer_name)), ''),
  m.id::text
)
order by total_gasto_reais desc, eventos desc
limit 10;


-- -------------------------------------------------------------
-- VARIAÇÕES ÚTEIS (na QUERY 1)
-- -------------------------------------------------------------
-- 1) Só varejo puro, tirando TAMBÉM aniversário/despedida/grupo:
--      where segmento = 'varejo'
--
-- 2) Voltar a incluir tudo (inclusive corporativo):
--      remova a linha  where segmento <> 'corporativo'
--
-- 3) Ranking por NÚMERO DE COMPRAS em vez de valor:
--      order by compras desc, total_gasto_reais desc
--
-- 4) Só um período (ex.: 2026): adicione dentro de cada SELECT do
--    CTE `vendas`  ...  and b.created_at >= '2026-01-01'
--                       and m.created_at >= '2026-01-01'
--
-- 5) Só quem comprou mais de uma vez (base de recorrência):
--    troque o `limit 10` por  having count(*) > 1
--
-- 6) Top 10 completo em CSV: no SQL Editor, botão "Download CSV".
-- =============================================================
