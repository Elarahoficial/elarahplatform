-- =============================================================
-- ELARAH — Cleanup de reservas pendentes por e-mail
-- -------------------------------------------------------------
-- Apaga da aba "Pendentes" do admin todas as reservas NÃO PAGAS
-- (status pending / cancelado / expirado / reembolsado) dos
-- e-mails abaixo. Reservas com status 'pago' NUNCA são tocadas.
--
--   * contato.elarah@gmail.com
--   * dudavitiello@icloud.com
--
-- COMO RODAR
--   Cola tudo no SQL Editor do Supabase e clica Run.
--   Tudo em transação única (BEGIN/COMMIT).
--
-- COMPORTAMENTO
--   1. Aborta se algum dos e-mails tiver reserva 'pago' — nesse
--      caso investigar caso a caso antes (a trava evita apagar
--      histórico de receita por engano).
--   2. Loga cada reserva que será apagada.
--   3. DELETE das não-pagas.
--
-- IDEMPOTENTE
--   Rodar 2x: na 2ª vez a contagem é 0 e nada é apagado.
-- =============================================================

begin;

do $$
declare
  v_emails      text[] := array['contato.elarah@gmail.com','dudavitiello@icloud.com'];
  v_paid        integer;
  v_to_delete   integer;
  v_rec         record;
  v_deleted     integer;
begin
  -- ============================================================
  -- 1. TRAVA — nenhum e-mail pode ter reserva paga
  -- ============================================================
  select count(*) into v_paid
    from public.bookings
   where lower(trim(email)) = any (v_emails)
     and status = 'pago';

  if v_paid > 0 then
    raise exception '[cleanup] ABORTANDO: % reserva(s) PAGA(s) encontrada(s) nesses e-mails. Não apago receita automaticamente — revisar caso a caso.',
      v_paid;
  end if;

  -- ============================================================
  -- 2. CONTA não-pagas alvo do DELETE
  -- ============================================================
  select count(*) into v_to_delete
    from public.bookings
   where lower(trim(email)) = any (v_emails)
     and status <> 'pago';

  raise notice '[cleanup] reservas não-pagas a apagar: %', v_to_delete;

  if v_to_delete = 0 then
    raise notice '[cleanup] nada a fazer — já estava limpo.';
    return;
  end if;

  -- ============================================================
  -- 3. LOG do que vai ser apagado (antes do DELETE)
  -- ============================================================
  for v_rec in
    select id, email, experiencia_nome, status, data, horario, created_at
      from public.bookings
     where lower(trim(email)) = any (v_emails)
       and status <> 'pago'
     order by created_at desc
  loop
    raise notice '   - id=%, email=%, status=%, exp="%", data=%, criado=%',
      v_rec.id, v_rec.email, v_rec.status, v_rec.experiencia_nome, v_rec.data, v_rec.created_at;
  end loop;

  -- ============================================================
  -- 4. DELETE
  -- ============================================================
  with removed as (
    delete from public.bookings
     where lower(trim(email)) = any (v_emails)
       and status <> 'pago'
    returning id
  )
  select count(*) into v_deleted from removed;

  if v_deleted <> v_to_delete then
    raise exception '[cleanup] ABORTANDO: DELETE apagou % mas esperava %. Rollback.',
      v_deleted, v_to_delete;
  end if;

  raise notice '[cleanup] OK — % reserva(s) apagada(s), 0 pagas afetadas.', v_deleted;
end $$;

-- ============================================================
-- 5. ESTADO DEPOIS — confirma que só restam pagas (ou nada)
-- ============================================================
do $$
declare
  v_emails    text[] := array['contato.elarah@gmail.com','dudavitiello@icloud.com'];
  v_remaining integer;
begin
  select count(*) into v_remaining
    from public.bookings
   where lower(trim(email)) = any (v_emails)
     and status <> 'pago';

  raise notice '[depois] reservas não-pagas restantes nesses e-mails: %', v_remaining;
end $$;

commit;
