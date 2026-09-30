-- =============================================================
-- ELARAH — Desconto geral por CATEGORIA
-- -------------------------------------------------------------
-- Adiciona a coluna `categoria` à linha única de public.desconto_geral.
--   NULL / ''  → o desconto vale pra TODAS as experiências (como antes)
--   'Barismo'  → só as experiências dessa categoria levam o desconto;
--                as demais ficam no preço normal.
-- Comparação sem caixa nem acento, e experiência com várias categorias
-- ("Barismo | Bartenderia") entra se UMA delas bater. Mesma regra no
-- navegador (promo.js) e na cobrança (_shared/promo.ts).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: sql/elarah_desconto_geral.sql.
-- =============================================================

alter table public.desconto_geral
  add column if not exists categoria text;

notify pgrst, 'reload schema';

-- -------------------------------------------------------------
-- CAMPANHA: 10% OFF em Barismo SÓ em 01/10/2026 (00h00 → 23h59).
-- O "Mês do Cliente" (10% / 15% com 2+ pessoas) acaba sozinho em
-- 30/09 23h59 — está no código, não nesta tabela.
-- Dá pra mudar depois na aba "Desconto geral" do admin.
-- -------------------------------------------------------------
update public.desconto_geral
   set ativo      = true,
       percentual = 10,
       categoria  = 'Barismo',
       inicio     = timestamptz '2026-10-01 00:00:00-03',
       fim        = timestamptz '2026-10-01 23:59:59-03',
       titulo     = null,
       subtitulo  = null
 where id = 1
returning ativo, percentual, categoria, inicio, fim;
