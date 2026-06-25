# Follow-up de gift cards pendentes (por e-mail)

Cutuca por e-mail quem começou a comprar um gift card mas não concluiu
o pagamento (status `pending`). Funciona sem WhatsApp — usa o mesmo
Resend da confirmação de compra.

## O que tem

- **Aba Gift Cards → botão "✉️ Follow-up por e-mail"** (e "✉️ Disparar
  follow-up" no cabeçalho da seção *Pendentes*). Abre um modal que lista
  os pendentes e envia o e-mail com 1 clique (ou "Enviar para todos").
- **WhatsApp também**: o formulário de compra agora pede o WhatsApp do
  comprador e do destinatário. No modal de follow-up, quando há telefone
  cadastrado, aparece um botão **WhatsApp** que abre a conversa com a
  mensagem pronta (wa.me).
- **Modo automático (opcional)**: a mesma Edge Function envia o e-mail
  sozinha quando agendada por um cron.

## ⚠️ Ordem de deploy (importante)

Rode as **migrações SQL ANTES** de re-deployar as Edge Functions de
pagamento. As funções passam a gravar `comprador_telefone` /
`destinatario_telefone` no gift card pendente — se as colunas não
existirem ainda, a pré-gravação falha e a compra é abortada. Migração
primeiro, deploy depois.

## Passo a passo pra ligar

1. **Migrações** — rode as duas no SQL Editor do Supabase:
   ```
   sql/elarah_giftcard_followup_tracking.sql   -- tracking do follow-up
   sql/elarah_giftcard_contact_phones.sql      -- telefone comprador/destinatário
   ```
   (adicionam `followup_sent_at`, `followup_count`, `followup_last_to`,
   `comprador_telefone` e `destinatario_telefone`.)

2. **Deploy das funções** (depois das migrações):
   ```
   supabase functions deploy giftcard-followup
   supabase functions deploy create-checkout-session   -- passa a salvar telefones
   supabase functions deploy create-mp-pix-payment      -- idem (PIX)
   supabase functions deploy stripe-webhook             -- persiste telefone na ativação
   ```

3. **Secret do Resend** já deve existir (`RESEND_API_KEY`) — é o mesmo
   usado pela confirmação de compra. Se ainda não, cadastre em
   Project Settings → Edge Functions → Secrets.

Pronto: o modo manual (1 clique) já funciona.

## Modo automático (opcional)

1. Crie o secret `CRON_SECRET` (uma string aleatória qualquer) em
   Edge Functions → Secrets.

2. Agende uma chamada diária. Exemplo com `pg_cron` + `pg_net`:
   ```sql
   select cron.schedule(
     'giftcard-followup-diario',
     '0 13 * * *',  -- todo dia 13h UTC (~10h BRT)
     $$
     select net.http_post(
       url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/giftcard-followup',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'X-Cron-Secret', '<MESMO_VALOR_DO_CRON_SECRET>'
       ),
       body    := jsonb_build_object('mode', 'auto')
     );
     $$
   );
   ```

### Parâmetros do modo automático (todos opcionais no body)

| Campo                | Default | O que faz                                  |
|----------------------|---------|--------------------------------------------|
| `min_age_hours`      | 48      | Só cutuca compras pendentes com 48h+       |
| `resend_after_hours` | 72      | Espaça reenvios em 72h                      |
| `max_followups`      | 2       | No máximo 2 cutucadas por gift card         |
| `limit`              | 50      | Teto de envios por execução                 |
| `to`                 | buyer   | `buyer` \| `recipient` \| `both`            |

A função marca `followup_sent_at` / `followup_count` a cada envio, então
nunca duplica e respeita o teto — manual e automático compartilham o
mesmo controle.
