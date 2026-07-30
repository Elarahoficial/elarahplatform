# WhatsApp Elarah — caminho da mensagem e onde cada trava atua

Do evento (compra, cron, disparo no painel) até a chamada da Z-API, **toda**
mensagem passa pelo mesmo portão único (`_shared/whatsapp_gate.js`). As travas
são avaliadas em ordem **fail-closed**: na primeira que reprova, PARA e NÃO
envia. Nada chega à Z-API sem passar por todas.

```
  EVENTOS (origens)
  ┌───────────────────────┬───────────────────────┬──────────────────────┐
  │ Pagamento aprovado    │ Cron (a cada 30 min)  │ Painel admin         │
  │  stripe / mp /        │  automated-           │  whatsapp-broadcast  │
  │  pagarme / check-mp   │  notifications        │  (interessados)      │
  └───────────┬───────────┴───────────┬───────────┴──────────┬───────────┘
              │                       │                      │
   sendBookingConfirmationGated  runPass (lembrete/      laço de broadcast
              │                  feedback/pendente)     (dedup por telefone)
              │                       │                      │
              ▼                       ▼                      ▼
  ╔══════════════════════════════════════════════════════════════════════╗
  ║   RELEITURA AUTORITATIVA (fecha a race) — lê status + aguardando      ║
  ║   AGORA no banco; não confia no objeto do webhook/da query em lote.   ║
  ║   Leitura falhou/sumiu → assume o pior (NÃO envia).      [AUDITORIA]  ║
  ╚═══════════════════════════════════════╤══════════════════════════════╝
                                          │
                     ┌────────────────────▼─────────────────────┐
                     │           PORTÃO ÚNICO  gatedSend()       │
                     │            (ordem fail-closed)            │
                     ├───────────────────────────────────────────┤
   [VÍNCULO EXATO]   │ 1. identifierOk?      não → PARA          │  ← sem id/slug/booking confiável
   [DADO OBRIGAT.]   │ 2. dedupeKey?         não → PARA          │  ← chave de idempotência ausente
   [SUPRESSÃO]       │ 3. suppressed !==false → PARA             │  ← "Aguardando experiência" / cancel
   [STATUS]          │ 4. statusAllowed !==true → PARA           │  ← só o status certo (pago/pending) segue
   [TELEFONE]        │ 5. normalizePhoneBR   inválido → PARA     │  ← nunca coage nº estrangeiro/torto p/ BR
   [AMBIENTE]        │ 7. isProd? senão exige allowlist → PARA   │  ← staging/preview nunca atinge cliente
   [ALLOWLIST-ONLY]  │ 7b. rollout etapa 1/2 fora da lista → PARA│  ← "só meu número → grupo pequeno"
   [ROLLOUT %]       │ 7c. bucket determinístico ≥ % → PARA      │  ← libera fração controlada das reservas
   [OBSERVAÇÃO]      │ 7d. observe? registra 'observed', NÃO env.│  ← valida em produção sem enviar nada
   [KILL SWITCH]     │ 8. SENDING_ENABLED != true → PARA         │  ← desligado por padrão (default OFF)
   [DRY-RUN]         │ 9. dryRun? simula, NÃO reserva/NÃO env.   │  ← não "envenena" a idempotência
   [IDEMPOTÊNCIA]    │10. reserve UNIQUE(dedupe_key)             │  ← INSERT atômico; 2º concorrente=duplicate
   │                 │      duplicate/erro de banco → PARA       │      (erro de banco = fail-closed)
   ▼                 └───────────────────────┬───────────────────┘
  whatsapp_send_log                          │ (só UM reserva)
  (1 linha por envio)                        ▼
                                   ╔════════════════════╗
                                   ║  ENVIO Z-API real  ║  send-text / send-image (foto)
                                   ╚═════════╤══════════╝
                                             ▼
                                    finalize(status: sent/failed)  → grava resultado na send_log
```

## Resumo das travas

| # | Trava | O que garante | Falha → |
|---|-------|---------------|---------|
| — | **Releitura autoritativa** | status/aguardando são lidos na hora, não do objeto stale | não envia |
| 1 | **Vínculo exato** | recipiente veio de id/slug/booking confiável (sem ILIKE/adivinhação) | não envia |
| 2 | **Dado obrigatório** | dedupeKey presente | não envia |
| 3 | **Supressão** | "Aguardando experiência"/cancelada não recebem (fail-closed: só `false` segue) | não envia |
| 4 | **Status** | só status certo (pago p/ confirmação-lembrete-feedback; pending p/ recuperação) | não envia |
| 5 | **Telefone** | número BR válido (DDD real + formato); nunca coage estrangeiro | não envia |
| 7 | **Ambiente** | fora de produção exige allowlist | não envia |
| 7b | **Allowlist-only** | rollout etapa 1/2: só números autorizados | não envia |
| 7c | **Rollout %** | libera fração determinística por dedupeKey | não envia |
| 7d | **Observação** | registra quem receberia (status `observed`), sem enviar | não envia (por design) |
| 8 | **Kill switch** | `WHATSAPP_SENDING_ENABLED` precisa ser `"true"` (default OFF) | não envia |
| 9 | **Dry-run** | simula sem reservar nem enviar | não envia (por design) |
| 10 | **Idempotência** | `UNIQUE(dedupe_key)`: 1 envio por (destinatário+tipo+contexto), mesmo sob concorrência | não envia (duplicate) |
| — | **Auditoria** | cada tentativa grava na `whatsapp_send_log` (mascarada) | — |

## Evidência (E2E — nada sai da máquina)

`node --experimental-strip-types supabase/functions/_shared/whatsapp_e2e.test.mjs`
roda os 9 fluxos pelo código real (Z-API mockada na fronteira): **62/62**.
Complementam: `whatsapp_gate.test.mjs` (50/50, testes de quebra),
`whatsapp_gate.sqlite.test.mjs` (6/6, `UNIQUE` real do SQLite),
`whatsapp_boot.test.mjs` (boot do módulo).
