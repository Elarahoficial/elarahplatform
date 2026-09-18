-- =========================================================
-- ELARAH — "QUAL CATEGORIA ESTÁ ERRADA?"  (uma consulta só)
-- -------------------------------------------------------------
-- SÓ LEITURA. Não muda nada. Pode rodar quantas vezes quiser.
--
-- COMO USAR: copie este arquivo inteiro, cole no SQL Editor do
-- Supabase e clique em RUN. Sai UMA tabela com tudo.
--
-- O QUE ELE RESPONDE
-- A lista de categorias da aba Cotação é a soma de dois lugares:
--   • a categoria das EXPERIÊNCIAS (o que a cliente vê no site);
--   • a categoria que você digitou na FICHA de cada parceiro.
-- Quando o que está na ficha não é igual ao que está no site, nasce
-- uma categoria a mais, que não leva a lugar nenhum.
--
-- A tabela tem uma linha por problema, na coluna "problema":
--   "1. nao existe no site"  → alguém digitou uma grafia que o site
--                              não tem ("Beadazzeld" x "Beadazzled")
--   "2. quebrada pela virgula" → a ficha estava CERTA; o nome da
--                              categoria é que tem vírgula ("Casa,
--                              Arte & Design") e era lido como duas
--   "3. ficha sem categoria" → parceiro sem categoria nenhuma
--
-- Nenhuma linha = está tudo unificado, nada a fazer.
-- =========================================================

with
-- Tira acento e maiúscula pra comparar, igual o painel faz.
site as (
  select distinct
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave,
    trim(tok) as categoria
  from public.experiences e
  cross join lateral regexp_split_to_table(coalesce(e.categoria, ''), '\|') as tok
  where trim(tok) <> ''
),
ficha as (
  select
    m.fornecedor_nome,
    trim(tok) as categoria,
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave
  from public.fornecedores_metadata m
  cross join lateral regexp_split_to_table(
    coalesce(m.categoria, ''),
    case when m.categoria like '%;%' then ';' else ',' end
  ) as tok
  where trim(tok) <> ''
),
-- Fichas cuja string inteira é uma categoria do site: a vírgula do
-- nome é que partia em duas. Não é erro de digitação.
virgula as (
  select m.fornecedor_nome, s.categoria
  from public.fornecedores_metadata m
  join site s
    on s.chave = lower(regexp_replace(translate(trim(m.categoria),
         'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
         'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g'))
  where m.categoria like '%,%'
    and m.categoria not like '%;%'
)

-- ===== 1. grafia que o site não tem =====
select
  '1. nao existe no site'                    as "problema",
  string_agg(distinct f.categoria, ' / ')    as "o que está na ficha",
  string_agg(distinct f.fornecedor_nome, ', ') as "de quem é a ficha",
  coalesce((
    select s.categoria from site s
     where left(s.chave, 4) = left(f.chave, 4)
     order by s.categoria limit 1
  ), 'ver a lista do site')                  as "provavelmente deveria ser"
from ficha f
where not exists (select 1 from site s where s.chave = f.chave)
  -- Não repete aqui o que já é explicado pela vírgula (item 2).
  and not exists (select 1 from virgula v where v.fornecedor_nome = f.fornecedor_nome)
group by f.chave

union all

-- ===== 2. categoria partida pela vírgula do próprio nome =====
select
  '2. quebrada pela virgula',
  v.categoria,
  string_agg(distinct v.fornecedor_nome, ', '),
  'nada a digitar: o painel novo já lê certo'
from virgula v
group by v.categoria

union all

-- ===== 3. ficha sem categoria nenhuma =====
select
  '3. ficha sem categoria',
  '—',
  string_agg(distinct m.fornecedor_nome, ', '),
  'abrir a ficha em Parceiros e marcar a categoria'
from public.fornecedores_metadata m
where coalesce(trim(m.categoria), '') = ''
having count(*) > 0

order by 1, 2;
