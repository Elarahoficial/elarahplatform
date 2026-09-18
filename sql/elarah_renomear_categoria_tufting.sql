-- =============================================================
-- ELARAH — Renomeia a categoria "Tufting" → "Tufting e Punch"
-- -------------------------------------------------------------
-- A categoria antiga "Tufting" ficou duplicando com o nome que o
-- site usa hoje ("Tufting e Punch"). Em vez de apagar as
-- experiências (que quebraria o vínculo das reservas antigas com a
-- ficha), este script só troca o NOME da categoria.
--
-- O QUE MUDA
--   1. experiences.categoria           → o que manda no site
--   2. coupons.categoria               → cupom preso a categoria
--   3. campaign_upcoming_experiences   → cards "em breve" das campanhas
--
-- O QUE **NÃO** MUDA
--   Nada é apagado. Reservas, turmas, regras de recorrência, fotos,
--   preços e histórico continuam exatamente como estão — as
--   experiências são as mesmas, só passam a se chamar de outro jeito.
--
-- DETALHE: uma experiência pode estar em mais de uma categoria, no
-- formato "Tufting|Macramê". O script troca só o pedaço "Tufting" e
-- preserva as outras categorias da experiência.
--
-- O menu "Explorar" do site é montado a partir das categorias reais
-- do banco (explorar-menu.js), então ele se ajusta sozinho depois
-- que isso rodar.
--
-- IDEMPOTENTE — rodar de novo não faz nada, porque já não sobra
-- nenhuma linha com o nome antigo.
-- =============================================================


-- =============================================================
-- PARTE 1 — CONFERÊNCIA (não muda nada)
-- =============================================================

-- 1a. Como as categorias com "tufting"/"punch" estão escritas hoje.
--     Serve pra confirmar a grafia exata que o site já usa — se
--     aparecer algo diferente de "Tufting e Punch" (ex.: "Tufting &
--     Punch"), ajuste o v_novo da PARTE 2 pra bater com ela.
select e.categoria, count(*) as experiencias
  from public.experiences e
 where e.categoria ~* 'tufting|punch'
 group by e.categoria
 order by 2 desc, 1;

-- 1b. As experiências que vão ser renomeadas.
select e.id, e.nome, e.categoria, e.is_active
  from public.experiences e
 where e.categoria ~* '(^|\|)\s*tufting\s*($|\|)'
 order by e.nome;

-- 1c. Cupons presos à categoria antiga (o cupom compara o nome da
--     categoria por texto — sem esta troca, ele pararia de valer).
select c.id, c.code, c.categoria
  from public.coupons c
 where lower(trim(c.categoria)) = 'tufting';


-- =============================================================
-- PARTE 2 — RENOMEAR
-- -------------------------------------------------------------
-- Rode o bloco inteiro (do begin ao commit). Ele imprime quantas
-- linhas mudaram em cada tabela.
-- =============================================================

begin;

do $$
declare
  v_antigo constant text := 'Tufting';
  v_novo   constant text := 'Tufting e Punch';
  v_exps   integer;
  v_cupons integer := 0;
  v_camp   integer := 0;
begin
  -- 1. experiences — troca só o token "Tufting" dentro da lista de
  --    categorias, preservando as demais ("Tufting|Macramê" vira
  --    "Tufting e Punch|Macramê").
  with alvo as (
    update public.experiences e
       set categoria = regexp_replace(
             e.categoria,
             '(^|\|)\s*' || v_antigo || '\s*($|\|)',
             '\1' || v_novo || '\2',
             'gi')
     where e.categoria ~* ('(^|\|)\s*' || v_antigo || '\s*($|\|)')
    returning 1
  )
  select count(*) into v_exps from alvo;

  -- 2. coupons.categoria — match por texto inteiro, sem "|".
  begin
    with alvo as (
      update public.coupons c
         set categoria = v_novo
       where lower(trim(c.categoria)) = lower(v_antigo)
      returning 1
    )
    select count(*) into v_cupons from alvo;
  exception when undefined_table then
    raise notice '[tufting] tabela coupons não existe neste banco — ignorado';
  end;

  -- 3. campaign_upcoming_experiences.categoria — rótulo dos cards
  --    "em breve" das campanhas (Dia dos Namorados etc.).
  begin
    with alvo as (
      update public.campaign_upcoming_experiences u
         set categoria = v_novo
       where lower(trim(u.categoria)) = lower(v_antigo)
      returning 1
    )
    select count(*) into v_camp from alvo;
  exception when undefined_table then
    raise notice '[tufting] tabela campaign_upcoming_experiences não existe neste banco — ignorado';
  end;

  raise notice '[tufting] renomeado para "%": % experiência(s), % cupom(ns), % card(s) de campanha',
    v_novo, v_exps, v_cupons, v_camp;
end $$;

commit;


-- =============================================================
-- PARTE 3 — CONFERÊNCIA FINAL
-- =============================================================
-- Esperado: só "Tufting e Punch" (nenhuma linha com "Tufting" puro).
select e.categoria, count(*) as experiencias
  from public.experiences e
 where e.categoria ~* 'tufting|punch'
 group by e.categoria
 order by 1;
