-- =============================================================
-- ELARAH — Interesses: coluna "experiencia" (experiência desejada)
-- -------------------------------------------------------------
-- Guarda o nome da experiência que a pessoa pediu (ex: "Aula de
-- tufting"). A aba Interesses compara esse nome com as experiências
-- lançadas e mostra um alerta no topo quando sai uma com nome igual
-- ou parecido (ou da mesma categoria).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

alter table public.interesses
  add column if not exists experiencia text;

notify pgrst, 'reload schema';
