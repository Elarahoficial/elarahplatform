# Follow-up de gift cards pendentes (por e-mail)

Cutuca por e-mail quem começou a comprar um gift card mas não concluiu
o pagamento (status `pending`). Funciona sem WhatsApp — usa o mesmo
Resend da confirmação de compra.

## O que tem

- **Aba Gift Cards → botão "✉️ Follow-up por e-mail"** (e "✉️ Disparar
  follow-up" no cabeçalho da seção *Pendentes*). Abre um modal que lista
  os pendentes e envia o e-mail com 1 clique (ou "Enviar para todos").
- **Modo automático (opcional)**: a mesma Edge Function envia sozinha
  quando agendada por um cron.

## Passo a passo pra ligar

1. **Migração** — rode no SQL Editor do Supabase:
   ```
   sql/elarah_giftcard_followup_tracking.sql
   ```
   (adiciona `followup_sent_at`, `followup_count`, `followup_last_to`.)

2. **Deploy da função**:
   ```
   supabase functions deploy giftcard-followup
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
