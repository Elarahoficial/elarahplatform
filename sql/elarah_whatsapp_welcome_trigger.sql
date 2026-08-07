-- =========================================================
-- ELARAH — Trigger de boas-vindas por WhatsApp (no cadastro)
-- =========================================================
-- Quando uma pessoa se cadastra (nova linha em public.profiles), chama
-- a Edge Function whatsapp-welcome via pg_net, que dispara a mensagem
-- de boas-vindas com o link do grupo.
--
-- Pré-requisitos:
--   * Edge Function whatsapp-welcome deployada (verify_jwt = false).
--   * Extensão pg_net ligada (Database → Extensions → pg_net).
--   * Secrets no Supabase (Edge Functions → Secrets):
--       WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN  (já cadastrados)
--       ELARAH_WEBHOOK_SECRET  → um segredo QUALQUER que você inventa,
--                                 e cola no lugar de TROQUE_SEGREDO abaixo.
--
-- ⚠️ Troque 'TROQUE_SEGREDO' (nos DOIS lugares? não — só aqui) pelo MESMO
--    valor que você cadastrar em ELARAH_WEBHOOK_SECRET nos secrets.
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente.
-- =========================================================

create extension if not exists pg_net;

create or replace function public.elarah_send_whatsapp_welcome()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Só tenta se tiver telefone (a função também revalida do lado de lá).
  if coalesce(nullif(trim(new.telefone), ''), '') = '' then
    return new;
  end if;

  perform net.http_post(
    url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/whatsapp-welcome',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer TROQUE_SEGREDO'
    ),
    body    := jsonb_build_object(
      'record', jsonb_build_object(
        'nome',     new.nome,
        'telefone', new.telefone
      )
    ),
    timeout_milliseconds := 8000
  );

  return new;
exception when others then
  -- NUNCA deixa o cadastro falhar por causa do WhatsApp.
  raise warning '[elarah] whatsapp-welcome trigger falhou: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists elarah_whatsapp_welcome_trg on public.profiles;
create trigger elarah_whatsapp_welcome_trg
  after insert on public.profiles
  for each row
  execute function public.elarah_send_whatsapp_welcome();

-- =========================================================
-- VERIFICAÇÃO
--   Faça um cadastro de teste no site e veja os logs em
--   Supabase → Edge Functions → whatsapp-welcome → Logs.
-- =========================================================
