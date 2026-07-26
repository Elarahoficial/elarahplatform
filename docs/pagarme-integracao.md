# Integração Pagar.me — gateway definitivo da Elarah

**Data:** 2026-07-26
**Decisão:** o Pagar.me (grupo Stone) passa a ser o **gateway único** do
checkout da Elarah — PIX + cartão à vista + cartão parcelado + estorno +
chargeback + antifraude + webhooks — substituindo o Mercado Pago. Esta
implementação já nasce com a camada de abstração `PaymentProvider`, pra
que a lógica da Elarah **nunca mais** fique acoplada a um gateway
específico.

---

## 1. Arquitetura

```
                    ┌───────────────────────────────────────────┐
  Navegador         │  Supabase Edge Functions (Deno)           │
  (checkout)        │                                           │
  ┌───────────┐     │  create-pagarme-pix-payment ─┐            │
  │pagarme-   │──►  │  create-pagarme-card-payment ─┼─► _shared/ │
  │checkout.js│     │  get-pagarme-public-key       │   pagarme.ts (PagarmeProvider)
  └───────────┘     │  pagarme-webhook  ◄───────────┘        │   │
        │           │        │  reutiliza:                    │   │
        │           │        ├─ _shared/payment_provider.ts (interface)
        │ tokeniza   │        ├─ _shared/booking_guard.ts  (reserva/estoque)
        │ o cartão   │        ├─ _shared/financial.ts      (repasse/comissão)
        ▼            │        └─ _shared/email.ts          (confirmações)
  api.pagar.me/     │                                           │
  core/v5/tokens    └───────────────────────────────────────────┘
```

- **`_shared/payment_provider.ts`** — a interface `PaymentProvider` + os
  tipos normalizados (status, entrada, saída). É o contrato. Qualquer
  gateway futuro implementa isto e o resto do sistema não muda.
- **`_shared/pagarme.ts`** — `PagarmeProvider implements PaymentProvider`.
  Wrapper fino da Core API v5 (orders, charges, webhook). Valores em
  **centavos inteiros** (igual à Elarah — sem conversão pra reais).
- **Edge Functions** — espelham 1:1 o padrão do Mercado Pago e
  **reaproveitam** `booking_guard`, `financial` e `email`. A lógica de
  reserva, estoque, cupom, mapa financeiro e e-mails é a mesma; muda só o
  provider.
- **`pagarme-checkout.js`** — módulo frontend autocontido: busca a public
  key, **tokeniza o cartão no cliente** (número/CVV nunca tocam nosso
  servidor) e chama as functions.

### Reconciliação (como o webhook acha a booking)
O `code` da order no Pagar.me = `booking.id`. O webhook re-busca a order
na API (fonte da verdade) e reconcilia em 3 camadas:
1. `bookings.pagarme_order_id == order.id`
2. `bookings.stripe_session_id == 'PME-' + order.id` (placeholder no UNIQUE)
3. `bookings.id == order.code`

---

## 2. Segurança

- **Secret key (`sk_...`)** só no servidor (env). **Public key (`pk_...`)**
  é publicável — vai pro front só pra tokenizar.
- **Tokenização client-side**: o cartão é tokenizado direto no
  `api.pagar.me/core/v5/tokens?appId=pk_...`. O backend recebe só o
  `card_token` (uso único, expira em 60s). **PCI safe.**
- **Webhook**: a segurança real é o **re-fetch da order por id** com a
  nossa secret key — o corpo do webhook nunca é confiado. Em cima disso,
  se `PAGARME_WEBHOOK_USER`/`PAGARME_WEBHOOK_PASSWORD` estiverem
  configurados no endpoint do painel, validamos a **Basic auth**.
- **Idempotência**: `Idempotency-Key` por booking no create; o webhook é
  idempotente (não reprocessa booking já `pago`); estoque com
  re-ocupação atômica em aprovação tardia (mesma lógica do MP).
- **Rollback de estoque** quando o Pagar.me recusa o cartão.

---

## 3. Variáveis de ambiente (Supabase → Edge Functions → Secrets)

| Env | Onde | Obrigatória | Descrição |
|---|---|---|---|
| `PAGARME_SECRET_KEY` | backend | ✅ | `sk_test_...` / `sk_...`. Basic auth das chamadas à API. |
| `PAGARME_PUBLIC_KEY` | backend→front | ✅ | `pk_test_...` / `pk_...`. Devolvida por `get-pagarme-public-key` pra tokenização. |
| `PAGARME_WEBHOOK_USER` | webhook | recomendada | Usuário da Basic auth do endpoint do webhook (cadastrado no painel). |
| `PAGARME_WEBHOOK_PASSWORD` | webhook | recomendada | Senha da Basic auth do endpoint do webhook. |
| `PAGARME_SEND_SESSION_ID` | backend | opcional | `true` liga o envio do fingerprint no campo do antifraude. Só ligue depois de confirmar o campo com o Pagar.me (ver §6). Padrão: `false`. |
| `CARD_FEE_PERCENT` / `CARD_FEE_FIXED_CENTS` | backend | opcional | Taxa do cartão repassada ao cliente (mesmas envs do fluxo atual). |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | backend | ✅ | Já existem. |
| `RESEND_API_KEY` / `ELARAH_FROM_EMAIL` | webhook | opcional | E-mails de confirmação (já existem). |

---

## 4. Passos de deploy

1. **Rodar a migration** no Supabase (SQL editor):
   ```
   sql/elarah_bookings_pagarme.sql
   ```
   Adiciona `bookings.pagarme_order_id`, `bookings.pagarme_charge_id` e
   `gift_cards.pagarme_order_id` (idempotente; enquanto não roda, as
   functions gravam sem elas via fallback e o metadata preserva os ids).

2. **Configurar as envs** da §3 (pelo menos `PAGARME_SECRET_KEY` e
   `PAGARME_PUBLIC_KEY`).

3. **Deploy das funções**:
   ```
   supabase functions deploy get-pagarme-public-key
   supabase functions deploy create-pagarme-pix-payment
   supabase functions deploy create-pagarme-card-payment
   supabase functions deploy pagarme-webhook --no-verify-jwt
   ```

4. **Cadastrar o webhook** no painel do Pagar.me apontando pra:
   ```
   https://<project>.supabase.co/functions/v1/pagarme-webhook
   ```
   Eventos: `order.paid`, `charge.paid`, `charge.payment_failed`,
   `charge.refunded`, `charge.chargedback`, `order.canceled`,
   `order.payment_failed`. Cadastre também a **Basic auth** (user/senha) e
   coloque os mesmos valores em `PAGARME_WEBHOOK_USER/PASSWORD`.

5. **Registrar o domínio** `elarah.com.br` no painel do Pagar.me (exigido
   pra tokenização pelo `/tokens`).

6. **Publicar o front** — subir `pagarme-checkout.js` e virar o checkout
   (§5). O site é estático (GitHub Pages).

7. **Testar em sandbox** (`sk_test_`/`pk_test_`) com os cartões de teste do
   Pagar.me: aprovado, recusado, e um PIX (simulador de PIX do painel).

---

## 5. Como virar o checkout (staged, reversível)

O `pagarme-checkout.js` **não** altera o fluxo existente — ele expõe
`window.ElarahPagarme`. Pra ativar:

1. Incluir o módulo nas páginas de checkout (antes do `script.js`):
   ```html
   <script src="/pagarme-checkout.js" defer></script>
   ```

2. No boot do checkout (dentro do IIFE do `script.js`), inicializar:
   ```js
   window.ElarahPagarme.init({
     fnBase: CHECKOUT_FN_BASE,
     anonKey: SUPABASE_ANON_KEY,
   });
   ```

3. Rotear cartão/PIX pro Pagar.me. Sugestão de **feature-flag** (mesmo
   padrão do `?mpcard`/`?mptransparent` já usado):
   ```js
   const GATEWAY = new URLSearchParams(location.search).get('gw') || 'pagarme';
   // cartão:
   const res = await window.ElarahPagarme.payWithCard({
     experiencia_id, horario, data, slot_id, email, nome, cpf,
     telefone, telefone_digits, cupom, quantidade, participantes,
     variant_label, variant_selected, variant_price_expected_centavos,
     installments,                       // parcelas escolhidas
     card: { number, holderName, holderDocument, expMonth, expYear, cvv },
   });
   // res: { booking_id, order_id, status, three_ds? } | { rejected, status_detail }
   // PIX:
   const pix = await window.ElarahPagarme.payWithPix({ /* mesmos campos, sem card */ });
   // pix: { booking_id, order_id, qr_code, qr_code_url, expires_at }
   ```
   O QR do PIX vem em `qr_code` (copia-e-cola) + `qr_code_url` (imagem). O
   modal do PIX atual pode renderizar `qr_code_url` num `<img>` ou gerar o
   QR a partir de `qr_code`.

4. Rollout: comece com `?gw=pagarme` liberado só pra você, valide vendas
   reais, depois torne padrão. Emergência: `?gw=mp` (ou remover o flag)
   volta pro fluxo antigo sem deploy.

> A confirmação de pagamento (marcar `pago`, e-mails, repasse) continua
> vindo do **webhook** — igual ao PIX de hoje. O front só cria a cobrança e
> mostra o resultado imediato; o polling/`success.html` cobre o resto.

---

## 6. ⚠️ Confirmar no contrato/conta Pagar.me ANTES de produção

Como combinado, estes pontos dependem da configuração comercial da conta —
**confirme com o Pagar.me** antes de tratar como garantidos:

- [ ] **Antifraude habilitado** e em qual modelo (ClearSale integrado?
      revisão manual? corte de score?). A v5 roda o antifraude
      automaticamente quando ligado na conta; nós já alimentamos com
      customer completo + itens + endereço.
- [ ] **Fingerprint/Device**: qual o **app id** do fingerprint da conta e o
      snippet oficial a incluir na página. Hoje mandamos um `session_id`
      em `metadata` (seguro). Pra alimentar de fato o motor, adicione o
      snippet e ligue `PAGARME_SEND_SESSION_ID=true` (o campo exato do
      order pode variar por conta — confirme antes de ligar).
- [ ] **Parcelamento**: nº máximo de parcelas contratado (queremos **12x**)
      e a regra de juros (repassado ao cliente / sem juros até Nx).
- [ ] **Retentativa inteligente / multiadquirência**: se a conta tem
      roteamento entre adquirentes e retry automático (alavanca de
      aprovação) — e se precisa ser habilitado.
- [ ] **3-D Secure 2**: se está habilitado (recupera transações que
      seriam recusadas por segurança). Se sim, o `three_ds.url` da resposta
      deve ser renderizado no front.
- [ ] **Taxas efetivas** (PIX, crédito à vista, por faixa de parcelas) e
      **prazo de recebimento / antecipação** negociados — pra alinhar o
      `CARD_FEE_*` repassado ao cliente.
- [ ] **Descritor na fatura** ("ELARAH") aprovado pela conta.

---

## 7. O que NÃO foi alterado

- O fluxo do **Mercado Pago** e do **Stripe** continua intacto no código —
  nada foi removido. A virada pro Pagar.me é feita pelo front (§5), o que
  permite rollback imediato. Depois que o Pagar.me estiver validado em
  produção, o MP/Stripe podem ser aposentados numa limpeza posterior.
- **Estorno pelo admin**: o `PagarmeProvider.refund()` já existe na
  camada; ligar um botão de estorno no painel admin é um próximo passo
  pequeno (chama `refund(charge_id)` → webhook `charge.refunded` marca
  `reembolsado`).
