-- =============================================================
-- ELARAH — Cleanup da aba Pendentes (por e-mail + duplicatas)
-- -------------------------------------------------------------
-- Duas limpezas, ambas só sobre reservas NÃO PAGAS
-- (status pending / cancelado / expirado / reembolsado).
-- Reservas com status 'pago' NUNCA são tocadas.
--
--   PARTE A — Apaga TODAS as não-pagas destes e-mails:
--     * contato.elarah@gmail.com
--     * dudavitiello@icloud.com
--     * conta-excluida@elarah.com.br
--
--   PARTE B — Remove DUPLICATAS 100% iguais no mesmo dia:
--     Reservas não-pagas idênticas (mesmo e-mail, experiência,
--     data, horário, quantidade, valor) criadas no MESMO dia.
--     Mantém a mais antiga de cada grupo e apaga as repetidas.
--     Aplica a TODOS os e-mails, não só os da Parte A.
--
-- COMO RODAR
--   Cola tudo no SQL Editor do Supabase e clica Run.
--   Tudo em transação única (BEGIN/COMMIT).
--
-- SEGURANÇA
--   Parte A aborta se algum e-mail tiver reserva 'pago'
--   (evita apagar histórico de receita por engano).
--
-- IDEMPOTENTE
--   Rodar 2x: na 2ª vez as contagens são 0 e nada é apagado.
-- =============================================================

begin;

-- ============================================================
-- PARTE A — DELETE por e-mail (todas as não-pagas)
-- ============================================================
do $$
declare
  v_emails      text[] := array[
                   'contato.elarah@gmail.com',
                   'dudavitiello@icloud.com',
                   'conta-excluida@elarah.com.br'
                 ];
  v_paid        integer;
  v_to_delete   integer;
  v_rec         record;
  v_deleted     integer;
begin
  -- Trava — nenhum e-mail pode ter reserva paga
  select count(*) into v_paid
    from public.bookings
   where lower(trim(email)) = any (v_emails)
     and status = 'pago';

  if v_paid > 0 then
    raise exception '[A] ABORTANDO: % reserva(s) PAGA(s) nesses e-mails. Não apago receita automaticamente — revisar caso a caso.',
      v_paid;
  end if;

  select count(*) into v_to_delete
    from public.bookings
   where lower(trim(email)) = any (v_emails)
     and status <> 'pago';

  raise notice '[A] reservas não-pagas a apagar por e-mail: %', v_to_delete;

  if v_to_delete > 0 then
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

    with removed as (
      delete from public.bookings
       where lower(trim(email)) = any (v_emails)
         and status <> 'pago'
      returning id
    )
    select count(*) into v_deleted from removed;

    raise notice '[A] OK — % reserva(s) apagada(s) por e-mail.', v_deleted;
  else
    raise notice '[A] nada a fazer — já estava limpo.';
  end if;
end $$;

-- ============================================================
-- PARTE B — DELETE de duplicatas 100% iguais no mesmo dia
-- ------------------------------------------------------------
-- Chave de duplicata (só entre não-pagas):
--   lower(email), experiência (id ou nome), data, horário,
--   quantidade, valor, e o DIA de criação (date(created_at)).
-- row_number() ordena por created_at asc → rn=1 é a mais antiga
-- (fica), rn>1 são as repetidas (apaga).
-- ============================================================
do $$
declare
  v_dupes   integer;
  v_rec     record;
  v_deleted integer;
begin
  with grupos as (
    select id,
           row_number() over (
             partition by
               lower(trim(email)),
               coalesce(experiencia_id::text, coalesce(experiencia_nome, '')),
               coalesce(data, ''),
               coalesce(horario, ''),
               coalesce(quantidade, 1),
               coalesce(amount_total, 0),
               date(created_at)
             order by created_at asc, id asc
           ) as rn
      from public.bookings
     where status <> 'pago'
  )
  select count(*) into v_dupes from grupos where rn > 1;

  raise notice '[B] duplicatas exatas (mesmo dia) a apagar: %', v_dupes;

  if v_dupes > 0 then
    for v_rec in
      with grupos as (
        select id, email, experiencia_nome, status, data, horario, created_at,
               row_number() over (
                 partition by
                   lower(trim(email)),
                   coalesce(experiencia_id::text, coalesce(experiencia_nome, '')),
                   coalesce(data, ''),
                   coalesce(horario, ''),
                   coalesce(quantidade, 1),
                   coalesce(amount_total, 0),
                   date(created_at)
                 order by created_at asc, id asc
               ) as rn
          from public.bookings
         where status <> 'pago'
      )
      select id, email, experiencia_nome, status, data, horario, created_at
        from grupos where rn > 1 order by created_at desc
    loop
      raise notice '   - id=%, email=%, status=%, exp="%", data=%, criado=%',
        v_rec.id, v_rec.email, v_rec.status, v_rec.experiencia_nome, v_rec.data, v_rec.created_at;
    end loop;

    with grupos as (
      select id,
             row_number() over (
               partition by
                 lower(trim(email)),
                 coalesce(experiencia_id::text, coalesce(experiencia_nome, '')),
                 coalesce(data, ''),
                 coalesce(horario, ''),
                 coalesce(quantidade, 1),
                 coalesce(amount_total, 0),
                 date(created_at)
               order by created_at asc, id asc
             ) as rn
        from public.bookings
       where status <> 'pago'
    ),
    removed as (
      delete from public.bookings b
       using grupos g
       where b.id = g.id
         and g.rn > 1
      returning b.id
    )
    select count(*) into v_deleted from removed;

    raise notice '[B] OK — % duplicata(s) apagada(s), 1 cópia mantida por grupo.', v_deleted;
  else
    raise notice '[B] nada a fazer — sem duplicatas.';
  end if;
end $$;

-- ============================================================
-- ESTADO DEPOIS
-- ============================================================
do $$
declare
  v_emails    text[] := array[
                 'contato.elarah@gmail.com',
                 'dudavitiello@icloud.com',
                 'conta-excluida@elarah.com.br'
               ];
  v_rest_mail integer;
  v_rest_dupe integer;
begin
  select count(*) into v_rest_mail
    from public.bookings
   where lower(trim(email)) = any (v_emails)
     and status <> 'pago';

  with grupos as (
    select row_number() over (
             partition by
               lower(trim(email)),
               coalesce(experiencia_id::text, coalesce(experiencia_nome, '')),
               coalesce(data, ''),
               coalesce(horario, ''),
               coalesce(quantidade, 1),
               coalesce(amount_total, 0),
               date(created_at)
             order by created_at asc, id asc
           ) as rn
      from public.bookings
     where status <> 'pago'
  )
  select count(*) into v_rest_dupe from grupos where rn > 1;

  raise notice '[depois] não-pagas restantes nesses e-mails: % | duplicatas restantes: %',
    v_rest_mail, v_rest_dupe;
end $$;

commit;
