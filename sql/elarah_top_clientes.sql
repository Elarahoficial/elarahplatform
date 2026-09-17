-- =============================================================
-- ELARAH — Top clientes (quem mais comprou)
-- -------------------------------------------------------------
-- Ranking de clientes juntando as DUAS fontes de venda:
--   * public.bookings      → checkout do site (status = 'pago')
--   * public.manual_sales  → WhatsApp/Pix/InfinityPay etc.
--                            (payment_status = 'pago')
--
-- Chave do cliente: e-mail normalizado (lower + trim). Quando não
-- há e-mail (venda manual só com WhatsApp), cai pro telefone com
-- os dígitos limpos; sem nenhum dos dois, cai pro nome.
--
-- SOMENTE LEITURA — não altera nada. Rode no SQL Editor do
-- Supabase (Dashboard → SQL Editor → cola → Run).
--
-- Ordena por VALOR GASTO. Pra ordenar por número de compras,
-- troque o ORDER BY final (comentado no fim do arquivo).
-- =============================================================

with vendas as (
  -- ===== Checkout do site =====
  select
    coalesce(
      nullif(lower(trim(b.email)), ''),
      nullif(regexp_replace(coalesce(b.telefone, ''), '\D', '', 'g'), ''),
      nullif(lower(trim(b.nome)), ''),
      b.id::text
    )                                        as cliente_key,
    nullif(trim(b.nome), '')                 as nome,
    nullif(lower(trim(b.email)), '')          as email,
    nullif(trim(b.telefone), '')             as telefone,
    coalesce(b.amount_total, 0)              as valor_centavos,
    coalesce(b.quantidade, 1)                as vagas,
    b.experiencia_nome                       as experiencia,
    b.created_at                             as comprou_em,
    'site'::text                             as origem
  from public.bookings b
  where b.status = 'pago'

  union all

  -- ===== Vendas manuais =====
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
    'manual'::text
  from public.manual_sales m
  where m.payment_status = 'pago'
)
select
  row_number() over (
    order by sum(valor_centavos) desc, count(*) desc
  )                                                      as posicao,
  -- nome mais recente que o cliente usou
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
  string_agg(distinct origem, ' + ' order by origem)     as origens
from vendas
group by cliente_key
order by total_gasto_reais desc, compras desc
limit 10;

-- -------------------------------------------------------------
-- VARIAÇÕES ÚTEIS
-- -------------------------------------------------------------
-- 1) Ranking por NÚMERO DE COMPRAS em vez de valor:
--      order by compras desc, total_gasto_reais desc
--
-- 2) Só um período (ex.: 2026): adicione dentro de cada SELECT do
--    CTE `vendas`  ...  and b.created_at >= '2026-01-01'
--                       and m.created_at >= '2026-01-01'
--
-- 3) Só quem comprou mais de uma vez (base de recorrência):
--    troque o `limit 10` por  having count(*) > 1
--
-- 4) Top 10 completo em CSV: no SQL Editor, botão "Download CSV".
-- =============================================================
