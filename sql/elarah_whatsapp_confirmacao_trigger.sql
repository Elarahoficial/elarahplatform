-- =========================================================
-- ELARAH — Trigger de CONFIRMAÇÃO de reserva por WhatsApp
-- =========================================================
-- Quando uma reserva é PAGA (public.bookings.status vira 'pago'),
-- chama a Edge Function whatsapp-confirmacao via pg_net, que dispara
-- a confirmação com experiência, data e horário.
--
-- Cobre os 3 caminhos que marcam 'pago':
--   * Mercado Pago (webhook)   — UPDATE status → 'pago'
--   * Stripe (webhook)         — UPDATE status → 'pago'
--   * Cupom que cobre 100%     — INSERT já com status 'pago'
--
-- Pré-requisitos:
--   * Edge Function whatsapp-confirmacao deployada (verify_jwt = false).
--   * Extensão pg_net ligada (Database → Extensions → pg_net).
--   * Secrets no Supabase já cadastrados: WHATSAPP_PHONE_NUMBER_ID,
--     WHATSAPP_ACCESS_TOKEN, ELARAH_WEBHOOK_SECRET.
--
-- ⚠️ Troque 'TROQUE_SEGREDO' pelo MESMO valor que você já usou no
--    trigger de boas-vindas (o seu ELARAH_WEBHOOK_SECRET).
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente.
-- =========================================================

create extension if not exists pg_net;

create or replace function public.elarah_send_whatsapp_confirmacao()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Só dispara quando a reserva está PAGA.
  if new.status is distinct from 'pago' then
    return new;
  end if;

  -- No UPDATE, só quando ACABOU de virar 'pago' (evita reenvio se
  -- qualquer outra coluna for atualizada depois).
  if tg_op = 'UPDATE' and old.status = 'pago' then
    return new;
  end if;

  -- Sem telefone não tem pra onde mandar (a função revalida do lado de lá).
  if coalesce(nullif(trim(new.telefone), ''), '') = '' then
    return new;
  end if;

  perform net.http_post(
    url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/whatsapp-confirmacao',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer TROQUE_SEGREDO'
    ),
    body    := jsonb_build_object(
      'record', jsonb_build_object(
        'nome',             new.nome,
        'telefone',         new.telefone,
        'experiencia_nome', new.experiencia_nome,
        'data',             new.data,
        'horario',          new.horario
      )
    ),
    timeout_milliseconds := 8000
  );

  return new;
exception when others then
  -- NUNCA deixa o pagamento falhar por causa do WhatsApp.
  raise warning '[elarah] whatsapp-confirmacao trigger falhou: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists elarah_whatsapp_confirmacao_trg on public.bookings;
create trigger elarah_whatsapp_confirmacao_trg
  after insert or update on public.bookings
  for each row
  execute function public.elarah_send_whatsapp_confirmacao();

-- =========================================================
-- VERIFICAÇÃO
--   Faça uma compra de teste (ou marque uma reserva como paga) e veja
--   os logs em Supabase → Edge Functions → whatsapp-confirmacao → Logs.
-- =========================================================
