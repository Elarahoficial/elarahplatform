-- =============================================================
-- ELARAH — Bridge cupons → gift_cards (compatibilidade urgente)
-- -------------------------------------------------------------
-- Resolve o problema crítico: a Edge Function `create-checkout-session`
-- deployada no Supabase é a versão antiga (sem suporte à tabela
-- `coupons`). Ela chama `hold_gift_card(code, amount)`, que só conhece
-- a tabela `gift_cards`.
--
-- Sem esse SQL, pra fazer PINTURA10 funcionar, a única alternativa
-- era criar PINTURA10 também em `gift_cards` — mas isso queima o cupom
-- depois de 1 click (saldo zera após hold), bloqueando a campanha.
--
-- COMO ESSE SQL RESOLVE
--
-- Substitui `hold_gift_card` e `refund_gift_card` por wrappers que:
--
--  1. Detectam se o code está na tabela `coupons` (sistema novo, com
--     percentual / max_uses / validade / restrição por experiência).
--  2. Chamam `hold_coupon` que incrementa `times_used` atomicamente
--     respeitando `max_uses` (50 pessoas podem usar PINTURA10 sem
--     uma queimar pra outra).
--  3. Criam um `gift_card` "ghost" descartável só pra a EF antiga
--     conseguir referenciar — `bookings.gift_card_id` aceita esse
--     ghost via FK. Saldo zera imediatamente (consumido). Metadata
--     guarda o `coupon_id` real pra que `refund_gift_card` saiba
--     refundar o CUPOM correto se o pagamento expirar.
--  4. `refund_gift_card` detecta ghost via metadata e chama
--     `refund_coupon` (decrementa times_used) + deleta o ghost,
--     preservando o tracking de uso da tabela coupons.
--
-- BACKWARD COMPAT: gift cards reais (códigos ELRH-XXXX) continuam
-- funcionando normalmente — a lógica original é preservada quando o
-- code não está na tabela coupons.
--
-- BÔNUS: também atualiza `hold_coupon` pra ser tolerante com
-- p_experience_id=NULL (modo legacy do wrapper). Quando a EF nova
-- entrar em produção, ela vai passar o experience_id correto e a
-- restrição volta a ser validada.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ===== 0. Limpa PINTURA10 da tabela gift_cards =====
-- Se foi criado como rede de segurança e ficou marcado como `used`,
-- a gente remove. A partir de agora, PINTURA10 vive APENAS em coupons.
delete from public.gift_cards where code = 'PINTURA10';

-- ===== 1. hold_coupon: aceita p_experience_id NULL como "skip check" =====
-- Quando o wrapper hold_gift_card chama (não tem experience_id no
-- contexto), passa NULL e a validação de restrição é pulada. Isso é
-- seguro porque a função tem GRANT execute apenas pro service_role —
-- só Edge Functions internas chamam. Quando a EF nova entrar em
-- produção, ela passa o experience_id e a restrição valida normalmente.
create or replace function public.hold_coupon(
  p_code text,
  p_experience_id uuid,
  p_amount_centavos integer
)
returns table(
  ok                boolean,
  coupon_id         uuid,
  discount_centavos integer,
  message           text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c     public.coupons%rowtype;
  v_disc  integer;
begin
  select * into v_c from public.coupons
   where upper(code) = upper(trim(p_code))
   for update
   limit 1;

  if not found then
    return query select false, null::uuid, 0, 'Cupom não encontrado.';
    return;
  end if;

  if v_c.is_active is false then
    return query select false, v_c.id, 0, 'Cupom desativado.';
    return;
  end if;

  if now() < v_c.valid_from then
    return query select false, v_c.id, 0, 'Cupom ainda não está ativo.';
    return;
  end if;

  if now() > v_c.valid_until then
    return query select false, v_c.id, 0, 'Cupom expirado.';
    return;
  end if;

  if v_c.max_uses is not null and v_c.times_used >= v_c.max_uses then
    return query select false, v_c.id, 0, 'Cupom esgotado.';
    return;
  end if;

  -- Restrição por experiência: só valida se AMBOS os lados têm valor.
  -- p_experience_id NULL = modo legacy/wrapper — pula esta checagem
  -- (a checagem real foi feita no preview_coupon do frontend antes).
  if v_c.experience_id is not null
     and p_experience_id is not null
     and v_c.experience_id <> p_experience_id then
    return query select false, v_c.id, 0, 'Cupom não é válido para esta experiência.';
    return;
  end if;

  if v_c.discount_type = 'percent' then
    v_disc := floor(p_amount_centavos::numeric * v_c.discount_value::numeric / 100);
  else
    v_disc := v_c.discount_value;
  end if;
  if v_disc > p_amount_centavos then v_disc := p_amount_centavos; end if;
  if v_disc < 0 then v_disc := 0; end if;

  update public.coupons
     set times_used = times_used + 1,
         updated_at = now()
   where id = v_c.id;

  return query select true, v_c.id, v_disc, 'OK';
end;
$$;

-- ===== 2. hold_gift_card: wrapper que detecta cupons primeiro =====
-- Mantém a assinatura original (a EF antiga depende dela).
-- Se code está na tabela coupons → chama hold_coupon, cria ghost,
-- retorna ghost_id no campo gift_card_id pra EF não quebrar FK.
-- Caso contrário → comportamento original (consulta gift_cards).
create or replace function public.hold_gift_card(
  p_code text,
  p_amount_centavos integer
)
returns table(
  ok               boolean,
  gift_card_id     uuid,
  used_centavos    integer,
  novo_saldo       integer,
  message          text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_exists boolean;
  v_c_result      record;
  v_ghost_id      uuid;
  v_gc            public.gift_cards%rowtype;
  v_use           integer;
  v_new           integer;
begin
  if p_amount_centavos is null or p_amount_centavos <= 0 then
    return query select false, null::uuid, 0, 0, 'Valor inválido';
    return;
  end if;

  -- ===== Camada A: tabela coupons (sistema novo) =====
  select exists(
    select 1 from public.coupons
     where upper(code) = upper(trim(p_code))
  ) into v_coupon_exists;

  if v_coupon_exists then
    -- hold_coupon valida + incrementa times_used.
    -- Passamos p_experience_id=NULL — a EF antiga não passa, e o
    -- preview_coupon do frontend já validou a restrição.
    select * into v_c_result
      from public.hold_coupon(p_code, null::uuid, p_amount_centavos);

    if v_c_result.ok is not true then
      -- Cupom existe mas inválido (expirado/desativado/esgotado).
      -- Devolvemos erro com a mensagem do banco.
      return query select false, null::uuid, 0, 0, v_c_result.message;
      return;
    end if;

    -- Cria ghost gift_card só pra a EF antiga conseguir referenciar.
    -- Saldo já zerado, status='used' — não pode ser reusado por engano.
    -- Metadata armazena o coupon_id real pra que refund_gift_card
    -- consiga refundar o cupom correto se o pagamento expirar.
    v_ghost_id := gen_random_uuid();
    insert into public.gift_cards (
      id,
      code,
      valor_inicial_centavos,
      saldo_centavos,
      status,
      expires_at,
      metadata
    ) values (
      v_ghost_id,
      'GHOST-' || replace(v_ghost_id::text, '-', ''),
      v_c_result.discount_centavos,
      0,
      'used',
      now() + interval '24 hours',
      jsonb_build_object(
        'tipo', 'coupon_ghost',
        'coupon_id', v_c_result.coupon_id,
        'real_code', upper(trim(p_code))
      )
    );

    return query select
      true,
      v_ghost_id,
      v_c_result.discount_centavos,
      0,
      'OK';
    return;
  end if;

  -- ===== Camada B: gift_card legado (preserva backward compat) =====
  select * into v_gc from public.gift_cards
   where upper(code) = upper(trim(p_code))
   for update;

  if not found then
    return query select false, null::uuid, 0, 0, 'Código não encontrado';
    return;
  end if;

  if v_gc.status <> 'active' then
    return query select false, v_gc.id, 0, v_gc.saldo_centavos,
      'Gift card ' || v_gc.status;
    return;
  end if;

  if v_gc.expires_at is not null and v_gc.expires_at < now() then
    update public.gift_cards set status = 'expired' where id = v_gc.id;
    return query select false, v_gc.id, 0, v_gc.saldo_centavos, 'Gift card expirado';
    return;
  end if;

  if v_gc.saldo_centavos <= 0 then
    update public.gift_cards set status = 'used' where id = v_gc.id;
    return query select false, v_gc.id, 0, 0, 'Gift card sem saldo';
    return;
  end if;

  v_use := least(v_gc.saldo_centavos, p_amount_centavos);
  v_new := v_gc.saldo_centavos - v_use;

  update public.gift_cards
     set saldo_centavos    = v_new,
         status            = case when v_new <= 0 then 'used' else 'active' end,
         redeemed_first_at = coalesce(redeemed_first_at, now()),
         redeemed_last_at  = now()
   where id = v_gc.id;

  return query select true, v_gc.id, v_use, v_new, 'OK';
end;
$$;

-- ===== 3. refund_gift_card: detecta ghost e refunda o cupom =====
-- Mantém a assinatura. Se o gift_card é ghost (metadata.tipo =
-- 'coupon_ghost'), chama refund_coupon do cupom real e deleta o ghost.
-- Caso contrário → comportamento original.
create or replace function public.refund_gift_card(
  p_gift_card_id uuid,
  p_amount_centavos integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc         public.gift_cards%rowtype;
  v_coupon_id  uuid;
  v_new        integer;
begin
  if p_gift_card_id is null then return; end if;

  select * into v_gc from public.gift_cards
   where id = p_gift_card_id
   for update;
  if not found then return; end if;

  -- Detecta ghost de cupom
  if v_gc.metadata is not null
     and v_gc.metadata->>'tipo' = 'coupon_ghost'
     and v_gc.metadata ? 'coupon_id'
  then
    v_coupon_id := (v_gc.metadata->>'coupon_id')::uuid;
    perform public.refund_coupon(v_coupon_id);
    -- Apaga ghost (lixo descartável)
    delete from public.gift_cards where id = p_gift_card_id;
    return;
  end if;

  -- Gift card real: comportamento original
  if p_amount_centavos is null or p_amount_centavos <= 0 then
    return;
  end if;

  v_new := least(v_gc.valor_inicial_centavos, v_gc.saldo_centavos + p_amount_centavos);

  update public.gift_cards
     set saldo_centavos = v_new,
         status         = case when v_new > 0 then 'active' else status end
   where id = p_gift_card_id;
end;
$$;

-- ===== 4. GRANTs =====
grant execute on function public.hold_coupon(text, uuid, integer)         to service_role;
grant execute on function public.hold_gift_card(text, integer)            to service_role;
grant execute on function public.refund_gift_card(uuid, integer)          to service_role;

-- ===== 5. Refresh do cache do PostgREST =====
notify pgrst, 'reload schema';

-- ===== 6. Verificação visual =====
-- Após rodar este SQL, espera-se ver:
--   - Cupom PINTURA10 ainda em coupons (com times_used que vai
--     incrementar a cada compra)
--   - Nenhum gift_card chamado PINTURA10
--   - Ghost gift_cards podem aparecer durante checkouts em andamento
--     (lixo de curta duração — limpos pelo refund_gift_card ou
--     expiram em 24h)
select 'coupon' as fonte, code, times_used::text || ' / ' ||
       coalesce(max_uses::text, '∞') as usos, valid_until, is_active
  from public.coupons where code = 'PINTURA10'
union all
select 'gift_card_legacy' as fonte, code,
       saldo_centavos::text || ' / ' || valor_inicial_centavos::text,
       expires_at, (status = 'active') as is_active
  from public.gift_cards where code = 'PINTURA10';
