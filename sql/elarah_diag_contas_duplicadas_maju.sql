-- =========================================================
-- ELARAH — DIAGNÓSTICO: duas contas da mesma pessoa
--
--   CONTA A (typo)   : maju.tanganeli@gmail.com.br
--   CONTA B (correta): maju.tanganeli@gmail.com
--
-- Este script NÃO ALTERA NADA. Só lê e monta um comparativo
-- lado a lado das duas contas, pra decidir o merge com
-- segurança: onde está o histórico de compras, qual tem
-- perfil preenchido, qual ela realmente usa pra entrar.
--
-- Rode no SQL Editor do Supabase e olhe a tabela de resultado.
-- =========================================================

drop table if exists tmp_diag_maju;
create temp table tmp_diag_maju (
  ordem        int,
  item         text,
  conta_a_typo text,
  conta_b_ok   text
);

do $$
declare
  v_a_email text := 'maju.tanganeli@gmail.com.br';
  v_b_email text := 'maju.tanganeli@gmail.com';
  v_a uuid;
  v_b uuid;
  v_ordem int := 0;

  -- (tabela, coluna_user_id, coluna_email) — coluna nula = não se aplica
  v_fontes text[][] := array[
    ['public.bookings',             'user_id',            'email'],
    ['public.gift_cards',           'comprador_user_id',  'comprador_email'],
    ['public.manual_sales',         null,                 'customer_email'],
    ['public.coupon_uses',          'user_id',            'email'],
    ['public.byelarah_submissions', 'user_id',            'email'],
    ['public.newsletter_sends',     null,                 'email'],
    ['public.campaign_waitlist',    null,                 'email'],
    ['public.email_opt_outs',       null,                 'email']
  ];
  v_tab text; v_col_uid text; v_col_mail text;
  v_a_n int; v_b_n int;
  i int;
begin
  select id into v_a from auth.users where lower(email) = v_a_email;
  select id into v_b from auth.users where lower(email) = v_b_email;

  -- ---------- Identidade das contas ----------
  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju values (v_ordem, 'user_id', coalesce(v_a::text,'(não existe)'), coalesce(v_b::text,'(não existe)'));

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'conta criada em',
         (select to_char(created_at,'DD/MM/YYYY HH24:MI') from auth.users where id = v_a),
         (select to_char(created_at,'DD/MM/YYYY HH24:MI') from auth.users where id = v_b);

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'último login',
         coalesce((select to_char(last_sign_in_at,'DD/MM/YYYY HH24:MI') from auth.users where id = v_a), 'NUNCA entrou'),
         coalesce((select to_char(last_sign_in_at,'DD/MM/YYYY HH24:MI') from auth.users where id = v_b), 'NUNCA entrou');

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'e-mail confirmado',
         coalesce((select to_char(email_confirmed_at,'DD/MM/YYYY') from auth.users where id = v_a), 'não'),
         coalesce((select to_char(email_confirmed_at,'DD/MM/YYYY') from auth.users where id = v_b), 'não');

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'como entra (provider)',
         (select string_agg(provider, ', ') from auth.identities where user_id = v_a),
         (select string_agg(provider, ', ') from auth.identities where user_id = v_b);

  -- ---------- Perfil ----------
  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'perfil: nome',
         (select nullif(trim(nome),'')     from public.profiles where id = v_a),
         (select nullif(trim(nome),'')     from public.profiles where id = v_b);

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'perfil: telefone',
         (select nullif(trim(telefone),'') from public.profiles where id = v_a),
         (select nullif(trim(telefone),'') from public.profiles where id = v_b);

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'perfil: cidade',
         (select nullif(trim(cidade),'')   from public.profiles where id = v_a),
         (select nullif(trim(cidade),'')   from public.profiles where id = v_b);

  v_ordem := v_ordem + 1;
  insert into tmp_diag_maju
  select v_ordem, 'perfil: role',
         (select role from public.profiles where id = v_a),
         (select role from public.profiles where id = v_b);

  -- ---------- Volume de dados em cada tabela ----------
  for i in 1 .. array_length(v_fontes, 1) loop
    v_tab      := v_fontes[i][1];
    v_col_uid  := v_fontes[i][2];
    v_col_mail := v_fontes[i][3];

    if to_regclass(v_tab) is null then
      continue;
    end if;

    -- conta linhas que pertencem à conta, seja por user_id, seja por e-mail
    execute format(
      'select count(*) from %s where %s lower(%I) = $1',
      v_tab,
      case when v_col_uid is null
           then '($2::uuid is not null and false) or '
           else format('%I = $2 or ', v_col_uid) end,
      v_col_mail
    ) into v_a_n using v_a_email, v_a;

    execute format(
      'select count(*) from %s where %s lower(%I) = $1',
      v_tab,
      case when v_col_uid is null
           then '($2::uuid is not null and false) or '
           else format('%I = $2 or ', v_col_uid) end,
      v_col_mail
    ) into v_b_n using v_b_email, v_b;

    if v_a_n > 0 or v_b_n > 0 then
      v_ordem := v_ordem + 1;
      insert into tmp_diag_maju
      values (v_ordem, replace(v_tab, 'public.', '') || ' (linhas)', v_a_n::text, v_b_n::text);
    end if;
  end loop;

end $$;

-- ---------- RESULTADO ----------
select item                          as "o que",
       coalesce(conta_a_typo, '—')   as "CONTA A  (.com.br — errada)",
       coalesce(conta_b_ok,   '—')   as "CONTA B  (.com — correta)"
  from tmp_diag_maju
 order by ordem;
