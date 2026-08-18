-- =========================================================
-- ELARAH — FIX: e-mail cadastrado errado (typo no domínio)
--
--   ERRADO : maju.tanganeli@gmail.com.br
--   CERTO  : maju.tanganeli@gmail.com
--
-- A menina se cadastrou com ".com.br" no final. Isso quebra:
--   * login (o e-mail de login é o da auth.users)
--   * recuperação de senha
--   * confirmação de reserva / e-mails transacionais
--
-- Este script troca o e-mail em TODOS os lugares onde ele
-- pode ter sido gravado: auth (login), profiles, reservas,
-- gift cards, vendas manuais, cupons, newsletter, waitlist,
-- submissões byElarah e opt-outs.
--
-- Rode UMA vez no SQL Editor do Supabase (role postgres).
-- É idempotente: rodar de novo não quebra nada, só informa
-- que não achou mais nada com o e-mail antigo.
--
-- ALTERNATIVA (recomendada pelo Supabase para a parte de
-- auth): trocar o e-mail pela Admin API em vez de SQL —
--   supabase.auth.admin.updateUserById(<uuid>, {
--     email: 'maju.tanganeli@gmail.com',
--     email_confirm: true
--   })
-- Se usar a Admin API, pule a SEÇÃO 1 e rode só a SEÇÃO 2.
-- =========================================================

do $$
declare
  v_old      text := 'maju.tanganeli@gmail.com.br';
  v_new      text := 'maju.tanganeli@gmail.com';
  v_user_id  uuid;
  v_conflito uuid;
  v_n        integer;
  v_total    integer := 0;
  r          record;
begin

  -- ---------------------------------------------------------
  -- SEÇÃO 0 — Diagnóstico e trava de segurança
  -- ---------------------------------------------------------
  select id into v_user_id   from auth.users where lower(email) = lower(v_old);
  select id into v_conflito  from auth.users where lower(email) = lower(v_new);

  if v_conflito is not null and v_user_id is not null and v_conflito <> v_user_id then
    raise exception
      'ABORTADO: já existe outra conta (%) com o e-mail correto %. '
      'São duas contas separadas — decida qual fica e faça o merge à mão '
      'antes de rodar este script.', v_conflito, v_new;
  end if;

  if v_user_id is null then
    if v_conflito is not null then
      raise notice 'auth.users: e-mail já está correto (user_id=%). Nada a fazer no login.', v_conflito;
      v_user_id := v_conflito;
    else
      raise notice 'auth.users: nenhuma conta encontrada com % nem com %.', v_old, v_new;
    end if;
  else
    raise notice 'auth.users: conta encontrada — user_id=%', v_user_id;
  end if;

  -- ---------------------------------------------------------
  -- SEÇÃO 1 — Auth (é isto que faz o login voltar a funcionar)
  -- ---------------------------------------------------------
  update auth.users
     set email              = v_new,
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         raw_user_meta_data = case
           when raw_user_meta_data ? 'email'
             then jsonb_set(raw_user_meta_data, '{email}', to_jsonb(v_new))
           else raw_user_meta_data
         end,
         updated_at         = now()
   where lower(email) = lower(v_old);
  get diagnostics v_n = row_count;
  if v_n > 0 then
    v_total := v_total + v_n;
    raise notice 'auth.users ............... % linha(s)', v_n;
  end if;

  -- A identity do provider 'email' guarda o e-mail duplicado.
  -- Sem isto o login por senha continua batendo no e-mail velho.
  update auth.identities
     set identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_new)),
         updated_at    = now()
   where provider = 'email'
     and lower(identity_data->>'email') = lower(v_old);
  get diagnostics v_n = row_count;
  if v_n > 0 then
    v_total := v_total + v_n;
    raise notice 'auth.identities .......... % linha(s)', v_n;
  end if;

  -- ---------------------------------------------------------
  -- SEÇÃO 2 — Tabelas do app (histórico, reservas, marketing)
  -- ---------------------------------------------------------
  for r in
    select * from (values
      ('public.profiles',              'email'),
      ('public.bookings',              'email'),
      ('public.gift_cards',            'comprador_email'),
      ('public.gift_cards',            'destinatario_email'),
      ('public.manual_sales',          'customer_email'),
      ('public.coupon_uses',           'email'),
      ('public.newsletter_sends',      'email'),
      ('public.campaign_waitlist',     'email'),
      ('public.byelarah_submissions',  'email')
    ) as t(tabela, coluna)
  loop
    -- pula tabela que ainda não existe neste ambiente
    if to_regclass(r.tabela) is null then
      continue;
    end if;

    execute format(
      'update %s set %I = $1 where lower(%I) = lower($2)',
      r.tabela, r.coluna, r.coluna
    ) using v_new, v_old;

    get diagnostics v_n = row_count;
    if v_n > 0 then
      v_total := v_total + v_n;
      raise notice '% (%) ... % linha(s)', r.tabela, r.coluna, v_n;
    end if;
  end loop;

  -- email_opt_outs tem o e-mail como PRIMARY KEY: se as duas
  -- linhas existirem, o update violaria a PK. Mantém o opt-out
  -- (é preferência da pessoa, não pode ser perdida) e some com
  -- a linha antiga.
  if to_regclass('public.email_opt_outs') is not null then
    if exists (select 1 from public.email_opt_outs where lower(email) = lower(v_new)) then
      delete from public.email_opt_outs where lower(email) = lower(v_old);
      get diagnostics v_n = row_count;
      if v_n > 0 then
        raise notice 'public.email_opt_outs .... % linha(s) duplicada(s) removida(s)', v_n;
      end if;
    else
      update public.email_opt_outs set email = v_new where lower(email) = lower(v_old);
      get diagnostics v_n = row_count;
      if v_n > 0 then
        v_total := v_total + v_n;
        raise notice 'public.email_opt_outs .... % linha(s)', v_n;
      end if;
    end if;
  end if;

  raise notice '-----------------------------------------';
  raise notice 'TOTAL corrigido: % linha(s).', v_total;
  if v_total = 0 then
    raise notice 'Nada encontrado com %. Ou já foi corrigido antes, ou o cadastro está em outro e-mail.', v_old;
  end if;

end $$;

-- ---------------------------------------------------------
-- SEÇÃO 3 — Conferência (rode depois e confira o resultado)
-- ---------------------------------------------------------
-- Não pode sobrar NENHUMA linha com o e-mail antigo:
select 'auth.users'             as origem, id::text as ref, email            as email from auth.users            where email            ilike '%maju.tanganeli@gmail.com.br'
union all
select 'profiles',              id::text,  email                                     from public.profiles        where email            ilike '%maju.tanganeli@gmail.com.br'
union all
select 'bookings',              id::text,  email                                     from public.bookings        where email            ilike '%maju.tanganeli@gmail.com.br'
union all
select 'manual_sales',          id::text,  customer_email                            from public.manual_sales    where customer_email   ilike '%maju.tanganeli@gmail.com.br'
union all
select 'gift_cards (comprador)',id::text,  comprador_email                           from public.gift_cards      where comprador_email  ilike '%maju.tanganeli@gmail.com.br';

-- E o e-mail certo tem que aparecer no login e no profile:
select u.id, u.email, u.email_confirmed_at, p.nome, p.telefone
  from auth.users u
  left join public.profiles p on p.id = u.id
 where lower(u.email) = 'maju.tanganeli@gmail.com';
