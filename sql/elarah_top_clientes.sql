-- =============================================================
-- ELARAH — Top clientes recorrentes (quem comprou mais de uma vez)
-- -------------------------------------------------------------
-- O QUE ESTA QUERY RESPONDE
-- Quem é a cliente que voltou — comprou mais de uma experiência.
-- NÃO é "quem gastou mais": ranking por valor vira uma lista de
-- evento corporativo e grupo fechado, porque uma venda de 30
-- pessoas vale mais que 10 compras avulsas de uma cliente fiel.
-- Aqui o que manda é QUANTAS experiências diferentes ela comprou.
--
-- Fontes:
--   * public.bookings      → checkout do site (status = 'pago')
--   * public.manual_sales  → WhatsApp/Pix/InfinityPay etc.
--                            (payment_status = 'pago')
--
-- FICA DE FORA — evento corporativo e grupo fechado. Uma venda é
-- descartada quando QUALQUER uma destas bate:
--   a) manual_sales.event_type = 'corporativo'
--   b) manual_sales.is_event = true
--   c) is_event nulo e (quantity >= 3 ou tem event_type)
--      → mesma regra do _isEventoSale() do admin, e é ela que
--        pega o corporativo ANTIGO que ninguém marcou: grupão de
--        20 pessoas cai aqui mesmo sem tag
--   d) a venda está amarrada a um lead de evento privado
--      (evento_privado_leads.manual_sale_id) que é corporativo
--      ou tem empresa preenchida
-- Sobra o 'varejo': todo o checkout do site + venda manual avulsa.
--
-- Chave do cliente: e-mail normalizado (lower + trim). Sem e-mail,
-- cai pro telefone só-dígitos; sem os dois, cai pro nome.
--
-- SOMENTE LEITURA — não altera nada. Rode no SQL Editor do
-- Supabase (Dashboard → SQL Editor → cola → Run).
-- =============================================================

with lead_corp as (
  -- Vendas manuais que nasceram de um lead corporativo/de empresa.
  select distinct l.manual_sale_id
  from public.evento_privado_leads l
  where l.manual_sale_id is not null
    and (l.tipo_evento = 'corporativo'
         or nullif(trim(l.empresa), '') is not null)
),
vendas as (
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
    nullif(trim(b.experiencia_nome), '')     as experiencia,
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
    nullif(trim(m.experience_name), ''),
    m.created_at,
    'manual'::text,
    case
      when m.event_type = 'corporativo'                  then 'corporativo'
      when lc.manual_sale_id is not null                 then 'corporativo'
      when m.is_event is true                            then 'evento'
      when m.is_event is false                           then 'varejo'
      when coalesce(m.quantity, 1) >= 3                  then 'evento'
      when m.event_type is not null                      then 'evento'
      else 'varejo'
    end
  from public.manual_sales m
  left join lead_corp lc on lc.manual_sale_id = m.id
  where m.payment_status = 'pago'
)
select
  row_number() over (
    order by count(distinct experiencia) desc,
             count(*) desc,
             sum(valor_centavos) desc
  )                                                      as posicao,
  -- nome mais recente que a cliente usou
  (array_agg(nome order by comprou_em desc)
     filter (where nome is not null))[1]                 as cliente,
  (array_agg(email order by comprou_em desc)
     filter (where email is not null))[1]                as email,
  (array_agg(telefone order by comprou_em desc)
     filter (where telefone is not null))[1]             as telefone,
  count(distinct experiencia)                            as experiencias_distintas,
  count(*)                                               as compras,
  round(sum(valor_centavos) / 100.0, 2)                  as total_gasto_reais,
  round(avg(valor_centavos) / 100.0, 2)                  as ticket_medio_reais,
  min(comprou_em)::date                                  as primeira_compra,
  max(comprou_em)::date                                  as ultima_compra,
  (max(comprou_em)::date - min(comprou_em)::date)        as dias_entre_1a_e_ultima,
  string_agg(distinct experiencia, ' · ')                as o_que_comprou,
  string_agg(distinct origem, ' + ' order by origem)     as origens
from vendas
where segmento = 'varejo'
group by cliente_key
having count(*) > 1            -- só quem VOLTOU
order by experiencias_distintas desc, compras desc, total_gasto_reais desc
limit 10;


-- -------------------------------------------------------------
-- VARIAÇÕES ÚTEIS
-- -------------------------------------------------------------
-- 1) Exigir experiências DIFERENTES (quem repetiu a mesma aula 3x
--    sai da lista):
--      having count(distinct experiencia) > 1
--
-- 2) Ranking por valor gasto entre as recorrentes:
--      order by total_gasto_reais desc, compras desc
--
-- 3) Trazer de volta os grupos fechados (mantendo fora só o
--    corporativo):
--      where segmento <> 'corporativo'
--
-- 4) Ver o extrato de uma cliente (troque o e-mail):
--      select * from vendas where cliente_key = 'fulana@email.com'
--      order by comprou_em;   -- precisa rodar junto com os CTEs
--
-- 5) Só um período (ex.: 2026): adicione dentro de cada SELECT do
--    CTE `vendas`  ...  and b.created_at >= '2026-01-01'
--                       and m.created_at >= '2026-01-01'
--
-- 6) Quantas clientes recorrentes existem no total (sem limit):
--    troque o SELECT final por um count sobre o mesmo group/having.
--
-- 7) Baixar em CSV: no SQL Editor, botão "Download CSV".
-- =============================================================
