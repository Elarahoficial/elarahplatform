-- =========================================================
-- ELARAH — Unificar as categorias das fichas de parceiro
-- -------------------------------------------------------------
-- Deixa a categoria da FICHA (aba Parceiros) falando a mesma língua
-- da categoria das EXPERIÊNCIAS (o que a cliente vê no site).
--
-- O QUE ESTE ARQUIVO FAZ (decisões de set/2026):
--
--   1. Conserta a quebra pela vírgula.
--      "Casa, Arte & Design" tem vírgula no nome, e a ficha guardava
--      a lista separada por vírgula — então virava "Casa" + "Arte &
--      Design", duas categorias falsas. Agora a lista passa a usar
--      ponto e vírgula, e qualquer categoria do site que tenha vírgula
--      no nome fica inteira.
--      (Afeta as fichas de Papelizei Academy, The Cozy Home e
--       Estudio Êsa, e qualquer outra no mesmo caso.)
--
--   2. "Beadazzeld" → "Beadazzled"  (erro de digitação)
--
--   3. "Vidro" → "Vitral"  (mesma coisa, um nome só — fica o do site)
--
--   4. BaresSP: sai "Bartenderia", entram "Drinks & Vinhos" e
--      "Barismo", que é onde ela realmente atua.
--
--   5. Categorias tiradas de ficha específica, a pedido:
--        Sarques            → sai "Joalheria"
--        Papelizei Academy  → sai "Artesanato"
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente: rodar de
-- novo não acha mais nada pra mudar e não estraga nada.
--
-- Mexe SÓ na coluna categoria de public.fornecedores_metadata (a
-- ficha do parceiro). Não toca em experiência, reserva nem dinheiro.
-- =========================================================


-- =========================================================
-- ANTES — guarde este resultado pra comparar depois.
-- =========================================================
select fornecedor_nome as "parceiro", categoria as "categoria hoje"
  from public.fornecedores_metadata
 where categoria is not null
   and (categoria like '%,%' or categoria ilike '%beadazzeld%'
        or categoria ilike '%vidro%' or categoria ilike '%bartenderia%')
 order by 1;


begin;

-- =========================================================
-- PASSO 1 — separador vira ";", protegendo categoria com vírgula
-- -------------------------------------------------------------
-- chr(1) é um caractere de controle que não aparece em texto
-- digitado: serve de esconderijo temporário pra vírgula que faz
-- parte do NOME da categoria.
-- =========================================================
do $$
declare
  c record;
begin
  -- 1a) esconde a vírgula de dentro das categorias do site que a têm
  for c in
    select distinct trim(tok) as categoria
      from public.experiences e
      cross join lateral regexp_split_to_table(coalesce(e.categoria, ''), '\|') as tok
     where trim(tok) like '%,%'
  loop
    update public.fornecedores_metadata
       set categoria = replace(categoria, c.categoria, replace(c.categoria, ',', chr(1)))
     where categoria is not null
       and categoria not like '%;%'            -- ficha já convertida fica quieta
       and categoria like '%' || c.categoria || '%';
  end loop;

  -- 1b) o que sobrou de vírgula é separador de verdade → vira ';'
  update public.fornecedores_metadata
     set categoria = replace(categoria, ',', ';')
   where categoria is not null
     and categoria not like '%;%'
     and categoria like '%,%';

  -- 1c) devolve a vírgula que fazia parte do nome
  update public.fornecedores_metadata
     set categoria = replace(categoria, chr(1), ',')
   where categoria like '%' || chr(1) || '%';
end $$;


-- =========================================================
-- PASSO 2 — correções de nome, item por item
-- -------------------------------------------------------------
-- Trabalha por PEDAÇO da lista (não por "contém"), pra não trocar
-- no meio de outra palavra. Compara sem acento e sem maiúscula.
-- =========================================================
do $$
declare
  r      record;
  toks   text[];
  novo   text[];
  novo_str text;
  t      text;
  chave  text;
  ehBares boolean;
begin
  for r in
    select fornecedor_key, fornecedor_nome, categoria
      from public.fornecedores_metadata
     where coalesce(trim(categoria), '') <> ''
  loop
    toks := string_to_array(r.categoria, ';');
    novo := '{}';
    ehBares := lower(trim(r.fornecedor_nome)) = 'baressp';

    foreach t in array toks loop
      t := trim(t);
      continue when t = '';

      chave := lower(regexp_replace(translate(t,
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g'));

      -- 2) erro de digitação
      if chave = 'beadazzeld' then t := 'Beadazzled'; end if;

      -- 3) um nome só pro vidro: fica "Vitral", que é o do site
      if chave = 'vidro' then t := 'Vitral'; end if;

      -- 4 e 5) Remoções pedidas, por ficha. Pra tirar outra no futuro,
      -- é só acrescentar uma linha aqui: (nome do parceiro em
      -- minúsculas, categoria em minúsculas e sem acento).
      if exists (
        select 1 from (values
          ('baressp',           'bartenderia'),
          ('sarques',           'joalheria'),
          ('papelizei academy', 'artesanato')
        ) as rem(parceiro, categoria)
        where rem.parceiro = lower(trim(r.fornecedor_nome))
          and rem.categoria = chave
      ) then continue; end if;

      if not (novo @> array[t]) then novo := array_append(novo, t); end if;
    end loop;

    -- 4b) garante as duas categorias certas da BaresSP
    if ehBares then
      if not (novo @> array['Drinks & Vinhos']) then novo := array_append(novo, 'Drinks & Vinhos'); end if;
      if not (novo @> array['Barismo'])         then novo := array_append(novo, 'Barismo');         end if;
    end if;

    -- Monta o valor final ANTES de comparar. Uma ficha cuja única
    -- categoria é "Casa, Arte & Design" não muda de texto, mas precisa
    -- do ';' pendurado — senão a leitura continua partindo em duas.
    -- Comparar depois de montar é o que faz esse caso ser corrigido.
    novo_str := case
      when array_length(novo, 1) = 1 and novo[1] like '%,%' then novo[1] || ';'
      else array_to_string(novo, '; ')
    end;

    if novo_str is distinct from r.categoria then
      update public.fornecedores_metadata
         set categoria = novo_str,
             updated_at = now()
       where fornecedor_key = r.fornecedor_key;
    end if;
  end loop;
end $$;

commit;


-- =========================================================
-- DEPOIS — como ficou.
-- Compare com o "ANTES" lá de cima.
-- =========================================================
select fornecedor_nome as "parceiro", categoria as "categoria agora"
  from public.fornecedores_metadata
 where categoria is not null
   and (categoria like '%,%' or categoria like '%;%'
        or categoria ilike '%vitral%' or categoria ilike '%beadazzled%')
 order by 1;


-- =========================================================
-- QUEM AINDA ESTÁ EM "ARTESANATO"
-- Nenhuma linha = nenhuma ficha de parceiro nessa categoria.
-- (A categoria continua existindo no site se alguma experiência
--  estiver nela — isto olha só as fichas.)
-- =========================================================
select fornecedor_nome as "ficha ainda em Artesanato"
  from public.fornecedores_metadata m
 where exists (
   select 1
     from regexp_split_to_table(m.categoria,
            case when m.categoria like '%;%' then ';' else ',' end) tok
    where lower(trim(tok)) = 'artesanato'
 )
 order by 1;
