-- =============================================================
-- ELARAH — Diagnóstico: experiências DUPLICADAS (mesma experiência
--          repetida em dias diferentes)
-- -------------------------------------------------------------
-- ⚠️  SÓ LEITURA. Não altera nada. Rode PRIMEIRO, revise, e só
--     depois rode o merge (elarah_merge_duplicate_experiences.sql).
--
-- CRITÉRIO DE AGRUPAMENTO (o que conta como "a mesma experiência")
--   Duas experiências entram no mesmo grupo quando têm IGUAIS:
--     • fornecedor (via experience_suppliers, ou fornecedor_nome)
--     • NOME       (comparado sem diferenciar maiúsc/minúsc e
--                   ignorando espaços a mais)
--     • valor      (comparado só pelos dígitos: "R$ 162" = "R$162")
--   Foto, data e descrição NÃO entram na comparação.
--
--   Por que o NOME e não a descrição? Porque muitos fornecedores
--   usam a MESMA descrição-padrão em produtos diferentes (ex.: 5
--   kits "Bedazzling" distintos com o mesmo texto). O nome é o que
--   de fato distingue uma experiência da outra.
--
--   Só considera experiências VISÍVEIS (is_active <> false) e só
--   grupos com 2+ cópias.
--
-- COMO LER
--   • n_copias        → quantas cópias iguais existem hoje
--   • total_reservas  → reservas somadas (nada se perde no merge)
--   • total_slots     → datas/horários somados (viram as opções)
--   • n_descricoes    → quantas descrições DIFERENTES há no grupo.
--                       1 = todas iguais (ideal). >1 = confira.
--   • n_fotos         → quantas fotos diferentes (só informativo)
--   • acao            → PULADO (recorrência) / CONFERIR (descrições
--                       diferentes) / OK pra juntar
--   • experiencia     → nome da que será MANTIDA (a principal)
--   • nomes_no_grupo  → nomes de todas as cópias (confira se são a
--                       mesma coisa mesmo)
-- =============================================================

with base as (
  select
    e.id, e.nome, e.imagem, e.created_at,
    regexp_replace(coalesce(e.preco, ''), '[^0-9]', '', 'g')             as preco_key,
    regexp_replace(lower(btrim(coalesce(e.nome, ''))), '\s+', ' ', 'g')  as nome_key,
    md5(lower(btrim(coalesce(e.descricao, ''))))                         as desc_hash,
    coalesce(
      (select string_agg(
                regexp_replace(lower(btrim(es.fornecedor_nome)), '\s+', ' ', 'g'), '|'
                order by regexp_replace(lower(btrim(es.fornecedor_nome)), '\s+', ' ', 'g'))
         from public.experience_suppliers es
        where es.experience_id = e.id),
      regexp_replace(lower(btrim(coalesce(e.fornecedor_nome, ''))), '\s+', ' ', 'g')
    )                                                                    as sup_key,
    (select count(*) from public.bookings b
       where b.experiencia_id = e.id)                                    as n_reservas,
    (select count(*) from public.experience_slots s
       where s.experience_id = e.id)                                     as n_slots,
    exists (select 1 from public.experience_recurrence_rules r
              where r.experience_id = e.id)                              as tem_recorrencia
  from public.experiences e
  where coalesce(e.is_active, true) <> false
),
grp as (
  select
    sup_key, nome_key, preco_key,
    count(*)                                                    as n_copias,
    count(distinct desc_hash)                                   as n_descricoes,
    count(distinct imagem)                                      as n_fotos,
    bool_or(tem_recorrencia)                                    as tem_recorrencia,
    sum(n_reservas)                                             as total_reservas,
    sum(n_slots)                                                as total_slots,
    (array_agg(id   order by n_reservas desc, created_at asc, id asc))[1] as manter_id,
    (array_agg(nome order by n_reservas desc, created_at asc, id asc))[1] as manter_nome,
    array_agg(distinct nome)                                    as nomes_no_grupo
  from base
  where length(nome_key) >= 2
  group by sup_key, nome_key, preco_key
  having count(*) > 1
)
select
  sup_key                                    as fornecedor,
  manter_nome                                as experiencia,
  preco_key                                  as valor_digitos,
  n_copias,
  total_reservas,
  total_slots,
  n_descricoes,
  n_fotos,
  case when tem_recorrencia          then 'PULADO (recorrência — tratar à mão)'
       when n_descricoes > 1         then 'CONFERIR (descrições diferentes)'
       else 'OK pra juntar' end              as acao,
  nomes_no_grupo,
  manter_id
from grp
order by tem_recorrencia desc, (n_descricoes > 1) desc, n_copias desc, fornecedor;
