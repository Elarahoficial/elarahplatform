# WhatsApp — Segurança, modos e rollout

Todo envio de WhatsApp passa pelo **portão único** (`supabase/functions/_shared/whatsapp_gate.js`),
com a tabela `whatsapp_send_log` (`UNIQUE(dedupe_key)`) como camada de
idempotência + auditoria. Regra: **fail-closed** — qualquer erro/dúvida = NÃO ENVIA.

## Controles (Secrets do Supabase → Edge Functions)

| Secret | Efeito | Padrão (ausente) |
|---|---|---|
| `WHATSAPP_SENDING_ENABLED` | **Kill switch.** Só envia se for exatamente `true`. | **desligado** |
| `WHATSAPP_ENV` | Só `production` é produção. Fora disso, exige allowlist. | não-produção |
| `WHATSAPP_TEST_ALLOWLIST` | Números (vírgula) que podem receber fora de produção / no allowlist-only. | vazio |
| `WHATSAPP_OBSERVE_MODE` | **Modo observação:** valida tudo, registra quem receberia em `whatsapp_send_log` (status `observed`), **não envia**. | desligado |
| `WHATSAPP_ALLOWLIST_ONLY` | Mesmo em produção, só a allowlist recebe (rollout etapa 1/2). | desligado |
| `WHATSAPP_ROLLOUT_PERCENT` | Fração determinística de reservas liberadas (0–100). | 100 |
| `WHATSAPP_DRY_RUN` | Simula sem enviar e **sem** gravar (preview puro). | desligado |

## Kill switch (reversão imediata)
Setar `WHATSAPP_SENDING_ENABLED` para qualquer coisa diferente de `true` (ou remover)
**corta todos os envios na hora** — confirmações e broadcast. É a primeira checagem
do envio real. (O modo observação continua rodando, pois nunca envia.)

## Modo observação (validar por dias, em produção, sem enviar)
1. `WHATSAPP_ENV=production`
2. `WHATSAPP_OBSERVE_MODE=true`
3. `WHATSAPP_SENDING_ENABLED` **não** `true` (fica desligado)

Durante o período, a `whatsapp_send_log` acumula linhas `status='observed'` com
`kind='observe:...'`, `phone_masked` e `booking_id` — exatamente **quem teria
recebido**. Revise:
```sql
select kind, phone_masked, booking_id, created_at
from whatsapp_send_log where status='observed' order by created_at desc;
```
Como usa o namespace `observe:`, isso **não consome** a chave real — ao ligar o
envio de verdade depois, as mensagens ainda saem normalmente.

## Rollout gradual (quando liberar)
1. **Só meu número:** `WHATSAPP_SENDING_ENABLED=true`, `WHATSAPP_ALLOWLIST_ONLY=true`,
   `WHATSAPP_TEST_ALLOWLIST=<meu número>`.
2. **Pequeno grupo:** adicione os números do grupo em `WHATSAPP_TEST_ALLOWLIST`.
3. **Poucas reservas reais:** `WHATSAPP_ALLOWLIST_ONLY=false`, `WHATSAPP_ROLLOUT_PERCENT=10`
   (10% determinístico; suba aos poucos: 25, 50…).
4. **Todos:** `WHATSAPP_ROLLOUT_PERCENT=100` (ou remover).

A qualquer momento, o kill switch reverte tudo.

## Testes (evidência, sem enviar nada)
```
node supabase/functions/_shared/whatsapp_gate.test.mjs         # 50 cenários fail-closed + concorrência (mock)
node --no-warnings supabase/functions/_shared/whatsapp_gate.sqlite.test.mjs  # UNIQUE real (node:sqlite)
```
Nenhum dos dois envia nada nem usa número real (mock + dry-run + allowlist fictícia).

## Pré-requisito
Rodar `sql/elarah_whatsapp_send_log.sql` no Supabase antes de habilitar qualquer envio.
