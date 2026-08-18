-- =========================================================
-- ELARAH — MERGE das duas contas da mesma pessoa
--
--   CONTA A (typo)   : maju.tanganeli@gmail.com.br   -> some
--   CONTA B (correta): maju.tanganeli@gmail.com      -> FICA
--
-- Por que a CONTA B é a que sobrevive, sem discussão:
-- o domínio ".com.br" não existe pra ela, então a CONTA A
-- nunca vai receber e-mail nenhum — nem confirmação, nem
-- recuperação de senha. Só a CONTA B é utilizável.
--
-- O que este script faz:
--   1) Move TODO o histórico da CONTA A para a CONTA B
--      (reservas, gift cards, cupons, vendas manuais,
--       newsletter, waitlist, submissões byElarah).
--   2) Preenche no perfil da CONTA B os campos que estiverem
--      vazios usando os dados da CONTA A (nome, telefone,
--      cidade). Nunca sobrescreve o que já está preenchido.
--   3) SÓ APAGA a CONTA A se você pedir explicitamente
--      (v_apagar_conta_a := true, mais abaixo).
--
-- IMPORTANTE — rode PRIMEIRO o diagnóstico:
--   sql/elarah_diag_contas_duplicadas_maju.sql
-- e confira se a CONTA B é mesmo a que ela usa hoje.
--
-- Roda dentro de transação: se qualquer passo falhar, nada
-- é aplicado. Idempotente — rodar de novo não duplica nada.
-- =========================================================

begin;

do $$
declare
  -- ⚠️  TROQUE PARA true SÓ DEPOIS DE CONFERIR O RESULTADO.
  --     Com false (padrão) o histórico é unificado mas a
  --     CONTA A continua existindo, intacta, como rede de
  --     segurança. Nada é perdido.
  v_apagar_conta_a boolean := false;

  v_a_email text := 'maju.tanganeli@gmail.com.br';
  v_b_email text := 'maju.tanganeli@gmail.com';
  v_a uuid;
  v_b uuid;
  v_n integer;
  v_total integer := 0;
  r record;
begin

  select id into v_a from auth.users where lower(email) = v_a_email;
  select id into v_b from auth.users where lower(email) = v_b_email;

  if v_b is null then
    raise exception 'ABORTADO: não existe conta com o e-mail correto (%). Nada a fazer.', v_b_email;
  end if;

  if v_a is null then
    raise notice 'A CONTA A (%) não existe mais — merge provavelmente já foi feito.', v_a_email;
    raise notice 'Nada a fazer.';
    return;
  end if;

  if v_a = v_b then
    raise exception 'ABORTADO: os dois e-mails apontam para o mesmo user_id (%). Isso não deveria acontecer.', v_a;
  end if;

  raise notice 'CONTA A (some) = %', v_a;
  raise notice 'CONTA B (fica) = %', v_b;
  raise notice '-----------------------------------------';

  -- ---------------------------------------------------------
  -- 1) Move o histórico: user_id E e-mail passam a ser da B
  -- ---------------------------------------------------------
  for r in
    select * from (values
      ('public.bookings',             'user_id',           'email'),
      ('public.gift_cards',           'comprador_user_id', 'comprador_email'),
      ('public.coupon_uses',          'user_id',           'email'),
      ('public.byelarah_submissions', 'user_id',           'email'),
      ('public.analytics_events',     'user_id',           null),
      ('public.manual_sales',         null,                'customer_email'),
      ('public.newsletter_sends',     null,                'email'),
      ('public.campaign_waitlist',    null,                'email')
    ) as t(tabela, col_uid, col_mail)
  loop
    if to_regclass(r.tabela) is null then
      continue;
    end if;

    -- repontar o user_id
    if r.col_uid is not null then
      execute format('update %s set %I = $1 where %I = $2', r.tabela, r.col_uid, r.col_uid)
        using v_b, v_a;
      get diagnostics v_n = row_count;
      if v_n > 0 then
        v_total := v_total + v_n;
        raise notice '% (%) ..... % linha(s) repontada(s)', r.tabela, r.col_uid, v_n;
      end if;
    end if;

    -- corrigir o e-mail gravado (compras feitas como convidado,
    -- sem user_id, só aparecem por aqui)
    if r.col_mail is not null then
      execute format('update %s set %I = $1 where lower(%I) = $2', r.tabela, r.col_mail, r.col_mail)
        using v_b_email, v_a_email;
      get diagnostics v_n = row_count;
      if v_n > 0 then
        v_total := v_total + v_n;
        raise notice '% (%) ..... % linha(s) com e-mail corrigido', r.tabela, r.col_mail, v_n;
      end if;
    end if;
  end loop;

  -- email_opt_outs: e-mail é PRIMARY KEY. O opt-out é preferência
  -- da pessoa e não pode ser perdido — se as duas linhas existem,
  -- mantém a correta e remove a antiga.
  if to_regclass('public.email_opt_outs') is not null then
    if exists (select 1 from public.email_opt_outs where lower(email) = v_b_email) then
      delete from public.email_opt_outs where lower(email) = v_a_email;
      get diagnostics v_n = row_count;
      if v_n > 0 then
        raise notice 'public.email_opt_outs ..... % duplicada(s) removida(s)', v_n;
      end if;
    else
      update public.email_opt_outs set email = v_b_email where lower(email) = v_a_email;
      get diagnostics v_n = row_count;
      if v_n > 0 then
        v_total := v_total + v_n;
        raise notice 'public.email_opt_outs ..... % linha(s)', v_n;
      end if;
    end if;
  end if;

  -- ---------------------------------------------------------
  -- 1b) Adota as compras feitas como CONVIDADO
  --
  -- Compra sem login grava só o e-mail, com user_id nulo. Sem
  -- dono, ela não aparece em "minhas reservas" na área da conta
  -- (a policy filtra por auth.uid() = user_id). Como o e-mail é
  -- comprovadamente dela, essas linhas passam a ser da CONTA B.
  -- ---------------------------------------------------------
  if to_regclass('public.bookings') is not null then
    update public.bookings
       set user_id = v_b
     where user_id is null
       and lower(email) in (v_a_email, v_b_email);
    get diagnostics v_n = row_count;
    if v_n > 0 then
      raise notice 'public.bookings ........... % compra(s) como convidado adotada(s)', v_n;
    end if;
  end if;

  if to_regclass('public.gift_cards') is not null then
    update public.gift_cards
       set comprador_user_id = v_b
     where comprador_user_id is null
       and lower(comprador_email) in (v_a_email, v_b_email);
    get diagnostics v_n = row_count;
    if v_n > 0 then
      raise notice 'public.gift_cards ......... % gift card(s) como convidado adotado(s)', v_n;
    end if;
  end if;

  -- ---------------------------------------------------------
  -- 2) Perfil: preenche só o que estiver vazio na CONTA B
  -- ---------------------------------------------------------
  update public.profiles b
     set nome     = coalesce(nullif(trim(b.nome),     ''), nullif(trim(a.nome),     '')),
         telefone = coalesce(nullif(trim(b.telefone), ''), nullif(trim(a.telefone), '')),
         cidade   = coalesce(nullif(trim(b.cidade),   ''), nullif(trim(a.cidade),   '')),
         -- se por algum motivo a conta antiga era admin, não perde o acesso
         role     = case when a.role = 'admin' then 'admin' else b.role end,
         email    = v_b_email,
         updated_at = now()
    from public.profiles a
   where b.id = v_b
     and a.id = v_a;
  get diagnostics v_n = row_count;
  if v_n > 0 then
    raise notice 'public.profiles ........... perfil da CONTA B completado com dados da A';
  end if;

  raise notice '-----------------------------------------';
  raise notice 'TOTAL movido para a CONTA B: % linha(s).', v_total;

  -- ---------------------------------------------------------
  -- 3) Apagar a CONTA A (só com o flag ligado)
  -- ---------------------------------------------------------
  if v_apagar_conta_a then
    -- trava: não apaga se ainda sobrou qualquer coisa apontando pra ela
    if exists (select 1 from public.bookings where user_id = v_a) then
      raise exception 'ABORTADO ao apagar: ainda há reservas apontando para a CONTA A.';
    end if;

    delete from auth.users where id = v_a;   -- profiles cai junto (on delete cascade)
    raise notice 'CONTA A apagada (%).', v_a;
  else
    raise notice 'CONTA A mantida. Confira o resultado e, se estiver tudo certo,';
    raise notice 'rode de novo com v_apagar_conta_a := true para removê-la.';
  end if;

end $$;

commit;

-- ---------------------------------------------------------
-- CONFERÊNCIA (rode depois)
-- ---------------------------------------------------------
-- Não pode sobrar nada com o e-mail errado:
select 'bookings' as tabela, count(*) from public.bookings     where email          ilike '%@gmail.com.br'
union all
select 'gift_cards',         count(*) from public.gift_cards   where comprador_email ilike '%@gmail.com.br'
union all
select 'manual_sales',       count(*) from public.manual_sales where customer_email  ilike '%@gmail.com.br';

-- A conta que fica, com o histórico todo junto:
select u.id, u.email, p.nome, p.telefone, p.cidade, p.role,
       (select count(*) from public.bookings   b where b.user_id = u.id) as reservas,
       (select count(*) from public.gift_cards g where g.comprador_user_id = u.id) as gift_cards
  from auth.users u
  left join public.profiles p on p.id = u.id
 where lower(u.email) = 'maju.tanganeli@gmail.com';
