-- =============================================================
-- ELARAH — Variações ricas (nome + preço + foto por opção)
-- -------------------------------------------------------------
-- Evolui o sistema de variações: além do nome, cada variação pode
-- ter PREÇO próprio (ex.: tamanho maior custa mais) e FOTO própria
-- (muda a imagem do produto quando o cliente seleciona).
--
-- Modelo: coluna jsonb `variant_items` = array de objetos
--   [
--     { "nome": "Lagosta Azul P", "preco": "R$189", "imagem": "https://..." },
--     { "nome": "Lagosta Azul G", "preco": "R$249", "imagem": "https://..." }
--   ]
-- Regras:
--   - `nome` obrigatório.
--   - `preco` vazio  → usa o preço base da experiência.
--   - `imagem` vazia → usa a foto principal da experiência.
--
-- Compatibilidade: a coluna antiga `variant_options` (text[] de nomes)
-- continua existindo. O front deriva os nomes de `variant_items` quando
-- presente; senão cai no `variant_options` legado. Nada quebra.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

alter table public.experiences
  add column if not exists variant_items jsonb;

-- Refresh do PostgREST pra expor a coluna nova na API imediatamente.
notify pgrst, 'reload schema';
