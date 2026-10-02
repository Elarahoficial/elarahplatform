-- =============================================================
-- ELARAH — Prazo de cancelamento com reembolso por experiência
-- -------------------------------------------------------------
-- Regra geral: reembolso só com cancelamento até 48h antes. Algumas
-- experiências (parceira compra material antes) precisam de prazo
-- maior. O admin agora tem o campo "Cancelar com reembolso até"
-- (horas ou dias) no cadastro da experiência, gravado aqui em HORAS.
--
--   null → regra geral (48h)
--   N    → reembolso só se o cancelamento chegar N horas antes
--
-- O checkout mostra o prazo, a cliente aceita e ele é congelado na
-- reserva (bookings.metadata.politica_cancelamento_horas).
--
-- Já deixa "Crie Sua Joia & Brinde com Vinho - Ingresso 2 Pessoas"
-- com 7 dias (168h).
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

alter table public.experiences
  add column if not exists politica_cancelamento_horas integer;

alter table public.experiences
  drop constraint if exists experiences_politica_cancelamento_horas_chk;
alter table public.experiences
  add constraint experiences_politica_cancelamento_horas_chk
  check (politica_cancelamento_horas is null
         or (politica_cancelamento_horas > 0 and politica_cancelamento_horas <= 720));

comment on column public.experiences.politica_cancelamento_horas is
  'Cancelar com reembolso até N horas antes. null = regra geral (48h). Editado no admin.';

update public.experiences
   set politica_cancelamento_horas = 168
 where translate(lower(nome), 'óò', 'oo') like '%crie sua joia%brinde com vinho%2 pessoas%';

notify pgrst, 'reload schema';

-- Conferência: deve listar a experiência da joia com 168.
select id, nome, politica_cancelamento_horas
  from public.experiences
 where politica_cancelamento_horas is not null;
