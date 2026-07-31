# WhatsApp Elarah — Runbook de rollout controlado

Rollout em 3 fases, sempre reversível pelo kill switch. **Regra de ouro:** se
qualquer query de anomalia (🚨) em `sql/elarah_whatsapp_monitor.sql` retornar
linha, **desligue na hora** (`WHATSAPP_SENDING_ENABLED=false`) e investigue
antes de continuar.

> **Quem faz o quê:** os secrets, a execução das funções e a leitura da
> `whatsapp_send_log` acontecem na SUA infra (Supabase) e no SEU WhatsApp —
> só você tem acesso. Este runbook é o passo a passo; cole o resultado das
> queries de monitor no chat e eu analiso cada lote.

---

## Fase 0 — Pré-requisitos (uma vez)

1. **Merge + deploy** do branch `claude/checkout-acompanhantes-fields-l2ubbg`
   (o workflow `deploy-edge-functions.yml` publica as Edge Functions).
2. **Rodar as migrações SQL** (SQL Editor), se ainda não rodou:
   `elarah_whatsapp_send_log.sql`, `elarah_bookings_automation_tracking.sql`,
   `elarah_bookings_aguardando_experiencia.sql`, `elarah_bookings_acompanhantes.sql`.
3. **Agendar o cron:** `elarah_automated_notifications_cron.sql` (troque a
   `CRON_SECRET`). Pode ligar já — sem envio liberado, ele não manda nada.
4. **Secrets base** (Edge Functions → Secrets): `ZAPI_INSTANCE_ID`,
   `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`, `WHATSAPP_ENV=production`,
   `WHATSAPP_TEST_ALLOWLIST=<SEU NÚMERO>`.
5. **Confirme que o envio está DESLIGADO:** `WHATSAPP_SENDING_ENABLED` ausente
   ou `false`. (Default = desligado.)

*(Opcional, recomendado antes da Fase 1: rode uns dias em `WHATSAPP_OBSERVE_MODE=true`.
Nada é enviado; a `whatsapp_send_log` registra quem RECEBERIA — query G do monitor.)*

---

## Fase 1 — Só o meu número

**Secrets:**

| Secret | Valor |
|---|---|
| `WHATSAPP_SENDING_ENABLED` | `true` |
| `WHATSAPP_ENV` | `production` |
| `WHATSAPP_ALLOWLIST_ONLY` | `true` |
| `WHATSAPP_TEST_ALLOWLIST` | `<SEU NÚMERO>` |
| `WHATSAPP_OBSERVE_MODE` | *(ausente/false)* |
| `WHATSAPP_DRY_RUN` | *(ausente/false)* |
| `WHATSAPP_ROLLOUT_PERCENT` | *(ausente = 100)* |

Com `ALLOWLIST_ONLY=true`, **só o seu número pode receber** — qualquer outro é
bloqueado no portão, mesmo em produção. Redeploy após salvar os secrets.

**Passos:**

1. Rode `sql/elarah_whatsapp_fase1_seed.sql` (troque o número). Cria reservas
   de teste com o seu número em cada estado.
2. **Lembrete + Feedback + Pendente** — invoque o cron uma vez (ou espere ≤30 min):
   ```
   curl -X POST 'https://<PROJ>.supabase.co/functions/v1/automated-notifications' \
     -H 'Authorization: Bearer <CRON_SECRET>' -H 'Content-Type: application/json' -d '{}'
   ```
   → Devem chegar **3 mensagens** no seu WhatsApp (lembrete, feedback com ⭐ e
   link, recuperação de pendente), cada uma com a **foto** e o **coração 🧡**.
3. **Confirmação** — o caminho real é o webhook de pagamento. Faça **1 compra
   real com o seu número** (o jeito mais fiel), ou use o painel de teste
   (Pós-evento → "testar no meu WhatsApp", tipo `confirmation`) pra validar o
   cartão de confirmação.
4. **Broadcast** — no painel, dispare em **modo teste** pro seu número (o teste
   já é travado pela allowlist).
5. **Negativos (cancelado / reembolsado / aguardando)** — as reservas de teste
   nesses estados **não devem gerar nada**. Confirme pela query A/H do monitor.

**Verificação (rode `sql/elarah_whatsapp_monitor.sql`):**
- Query **C**: o único `phone_masked` é o seu.
- Query **A** e **B**: **vazias** (nenhum envio a reserva cancelada/reembolsada/aguardando; nenhuma duplicidade).
- Query **F**: volume bate com o esperado (lembrete/feedback/pending/confirmation/broadcast = 1 cada).

Cole A, B, C, D, F aqui. Se tudo limpo → Fase 2.

---

## Fase 2 — Grupo pequeno de teste (5–10 números conhecidos)

Mantém o mesmo trilho da Fase 1, só **amplia a allowlist** para os números do
grupo de teste (pessoas conhecidas que toparam receber). Continua
`ALLOWLIST_ONLY=true` → só esses números recebem; nenhum cliente fora da lista
é tocado.

| Secret | Valor |
|---|---|
| `WHATSAPP_ALLOWLIST_ONLY` | `true` |
| `WHATSAPP_TEST_ALLOWLIST` | `<num1>,<num2>,...` (5–10 números) |

**Passos:** deixe os fluxos reais rodarem (compras reais desse grupo, cron nos
horários) por 1–2 dias. Acompanhe a `whatsapp_send_log`.

**Verificação:** rode o monitor 1–2x/dia e cole aqui. Critério de aprovação —
**A, B, D, E vazias**; **C** só mostra números do grupo; sem destinatário
incorreto, sem duplicidade.

---

## Fase 3 — Rollout gradual até 100%

Agora abrimos pra reservas reais em geral, por **porcentagem determinística**
(por `dedupe_key`). Desligue o `ALLOWLIST_ONLY` e suba o percentual em degraus,
monitorando entre cada um.

| Secret | Valor |
|---|---|
| `WHATSAPP_ALLOWLIST_ONLY` | `false` (ou remover) |
| `WHATSAPP_ROLLOUT_PERCENT` | `5` → `25` → `50` → `100` |

Entre cada degrau: aguarde algumas horas de tráfego real, rode o monitor e cole
o resultado. Só sobe pro próximo degrau com **A/B/D/E vazias**. Uma reserva
excluída num degrau só passa a receber quando o percentual ultrapassa o bucket
dela — nunca há reenvio (a `send_log` dedupe garante).

Ao chegar em `100` e ficar estável por um período de tráfego normal sem nenhuma
anomalia → **sistema pronto para operar normalmente**. Deixe `TEST_ALLOWLIST`
configurada (não atrapalha em produção) e mantenha o kill switch à mão.

---

## 🔴 Procedimento de aborto (qualquer inconsistência)

1. **Desligue o envio agora:** `WHATSAPP_SENDING_ENABLED=false` (redeploy). Isso
   corta 100% dos envios imediatamente — o portão para no kill switch.
2. Rode as queries A–E e cole aqui. Eu ajudo a diagnosticar a causa raiz.
3. Só religa depois de entender a causa e confirmar a correção. Nada de
   "tenta de novo pra ver" com o envio ligado.

> Nenhuma anomalia "some" sozinha: se apareceu uma linha em A ou B, houve (ou
> quase houve) um envio errado — trate como incidente, não como ruído.
