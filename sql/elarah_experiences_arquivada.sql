-- =============================================================
-- ELARAH — Arquivar experiência (some do admin, nada é apagado)
-- -------------------------------------------------------------
-- POR QUE ARQUIVAR EM VEZ DE EXCLUIR
--   Excluir uma experiência mexe na contabilidade, mesmo sem apagar
--   nenhuma venda:
--     * financial_expenses.experience_id → vira NULL (a despesa
--       deixa de estar ligada à experiência);
--     * manual_sales.experience_id → vira NULL, e a venda pode
--       perder nome e fornecedor, que são lidos da ficha quando a
--       linha não tem os campos preenchidos;
--     * bookings.experiencia_id → vira NULL (valores continuam, mas
--       o relatório por ficha deixa de enxergar a reserva).
--
--   Arquivar não apaga nada: a ficha continua no banco, ligada a
--   tudo que sempre esteve. Ela só some da lista de experiências do
--   admin (e do site, por garantia). Dá pra desarquivar a qualquer
--   momento pelo próprio painel.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ===== 1. Coluna =====
alter table public.experiences
  add column if not exists arquivada boolean not null default false;

create index if not exists experiences_arquivada_idx
  on public.experiences (arquivada) where arquivada = true;

comment on column public.experiences.arquivada is
  'Arquivada pelo admin: some da lista de experiências do painel e do site, sem apagar a ficha nem quebrar os vínculos de contabilidade (despesas, vendas manuais e reservas continuam apontando pra ela). Reversível pelo botão Desarquivar.';


-- ===== 2. Arquiva as aulas de Tufting antigas =====
-- São as 7 que estão ocultas no painel: "Aula de Tufting (Seg)",
-- "(Ter/Qui/Sex)" e "(2h)". O padrão exige o parêntese logo depois
-- de "Aula de Tufting", então as turmas novas
-- ("Aula de Tufting – Para Uma 1ª Vez!") ficam de fora.
update public.experiences
   set arquivada = true
 where categoria ~* '(^|\|)\s*Tufting & Punch\s*($|\|)'
   and nome ~ '^Aula de Tufting \(';

-- ===== 3. Conferência =====
-- Esperado: as 7 antigas com arquivada = true e as novas com false.
select nome, categoria, is_active, arquivada
  from public.experiences
 where categoria ~* '(^|\|)\s*Tufting & Punch\s*($|\|)'
 order by arquivada desc, nome;
