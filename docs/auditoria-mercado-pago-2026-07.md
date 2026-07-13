# Auditoria e modernização da integração Mercado Pago — Elarah

**Data:** 2026-07-13
**Objetivo:** Elevar a integração do Mercado Pago para 100% das boas práticas
atuais, resolver as pendências da ferramenta **Qualidade da Integração**
(estava em **51/100**) e maximizar a taxa de aprovação dos pagamentos.

---

## 1. Como a integração funcionava ANTES (auditoria)

A Elarah é um site estático (GitHub Pages) com backend em **Supabase Edge
Functions (Deno)**. Existem dois processadores: **Stripe** (legado) e
**Mercado Pago**. O Mercado Pago cobria:

| Fluxo | Endpoint MP | Como era | Situação |
|---|---|---|---|
| **PIX** (experiência) | `POST /v1/payments` (`payment_method_id=pix`) | Transparente, QR inline + polling | ✅ Correto, mas payload incompleto |
| **PIX** (gift card) | `POST /v1/payments` | Idem | ✅ Idem |
| **Cartão** | `POST /checkout/preferences` (**Checkout Pro**) | Criava preference e **redirecionava** pro checkout hospedado da MP | ⚠️ **Causa raiz das pendências** |
| **Webhook** | `mp-webhook` | Valida assinatura HMAC, consulta pagamento, concilia booking | ✅ Robusto |
| **Reconciliação** | `check-mp-payment-status` | Backup do webhook (polling) | ✅ Correto |

### Diagnóstico central

As pendências **obrigatórias** da Qualidade da Integração — **Device ID
(MercadoPago.js V2)** e **Secure Fields (PCI)** — e as **recomendadas**
(`issuer_id`, `payer.last_name`, `items.description`) **só existem no
Checkout API (Checkout Transparente)**. Como o cartão da Elarah usava
**Checkout Pro (redirect)**, a MP capturava o cartão na página dela e a
Elarah **não tinha como pontuar** nesses itens. Era estruturalmente
impossível chegar a 100 sem migrar o cartão para o Checkout Transparente.

Além disso, o `/v1/payments` do PIX não enviava **Device ID**,
`additional_info` (itens com `description`), telefone nem endereço do
pagador — dados que o motor antifraude da MP usa para aprovar mais.

---

## 2. O que foi feito

Migração do **cartão** para **Checkout Transparente (Checkout API)** com
**MercadoPago.js V2 + Secure Fields + Device ID**, criando o pagamento
direto no `/v1/payments`, mantendo o **Checkout Pro como fallback
automático** (zero regressão). Enriquecimento do payload de **todos** os
pagamentos (cartão e PIX) com os campos recomendados.

### 2.1 Arquivos MODIFICADOS

| Arquivo | Alteração | Motivo técnico |
|---|---|---|
| `supabase/functions/_shared/mercadopago.ts` | **+ `createCardPayment()`** (POST `/v1/payments` com token, `payment_method_id`, `issuer_id`, `installments`, 3DS, `capture`, `binary_mode`); **+ helpers** `buildPayer`, `buildAdditionalInfo`, `buildAuthHeaders`; **Device ID no header `X-meli-session-id`** em todas as chamadas; `createPixPayment` passou a enviar `additional_info` + Device ID + telefone; `MPPaymentResponse` agora expõe `issuer_id` e `three_ds_info`; Checkout Pro agora manda `items.description` e `category_id`. | Centraliza o payload "modelo aprovação" da MP num único lugar auditável. É aqui que o Device ID vira `X-meli-session-id` e que `payer`/`additional_info` completos são montados. |
| `supabase/functions/create-mp-card-payment/index.ts` | **Reescrito** para 2 modos: **(1) Transparente** quando vem `token` → cria `/v1/payments` com todos os campos recomendados + Device ID, grava booking `pending`, devolve `status`/`status_detail`/`three_ds`; **(2) Checkout Pro** (sem `token`) → mantém o fluxo antigo de preference. Recusa libera o estoque (rollback) e devolve o `status_detail`. Novo env `MP_CARD_3DS_MODE`. | Resolve as pendências obrigatórias sem quebrar nada: se o front não conseguir montar os Secure Fields, o backend ainda aceita o modo antigo. |
| `supabase/functions/create-mp-pix-payment/index.ts` | Passa `device_id` + `items` (com `description`) + telefone do pagador para `createPixPayment`, nos fluxos de **experiência** e **gift card**. | Device ID e `additional_info` também aumentam a aprovação do PIX. |
| `supabase/functions/mp-webhook/index.ts` | Log enriquecido: `status_detail`, `payment_method_id`, `payment_type_id`, `issuer_id`, `installments`. **Nunca** loga dado sensível do cartão. | Observabilidade da aprovação/recusa (pendência de logs). |
| `supabase/functions/check-mp-payment-status/index.ts` | Rótulo do método (admin) derivado do `payment_type_id` (Cartão/PIX/Carteira) em vez de fixo "Pix". | Correção: cartões conciliados via polling eram rotulados como "Pix". |
| `script.js` (frontend) | **+ MercadoPago.js V2** (carregado sob demanda) + busca da public key; **+ painel de cartão com Secure Fields** (número/validade/CVV em iframes da MP), CPF, parcelas e emissor; **tokenização no cliente**; **Device ID** via `window.MP_DEVICE_SESSION_ID`; POST ao `create-mp-card-payment` com token+device_id; tratamento de **aprovado / em análise / recusado / 3-D Secure**; **fallback automático** pro Checkout Pro. Mensagens de `status_detail` traduzidas. | Implementa Secure Fields + Device ID no cliente — o coração das pendências obrigatórias. |
| `success.html` | Mensagem da confirmação "direct" adaptada ao método real (cartão/PIX/gift card) em vez de texto fixo de gift card. | O sucesso do cartão transparente passa por essa tela. |

### 2.2 Arquivos CRIADOS

| Arquivo | Função |
|---|---|
| `supabase/functions/get-mp-public-key/index.ts` | Devolve a **public key** publicável da MP (via env) pro front inicializar o MercadoPago.js. Sem chave configurada → responde `null` e o cartão usa Checkout Pro. |
| `docs/auditoria-mercado-pago-2026-07.md` | Este relatório. |

---

## 3. Pendências da Qualidade da Integração — status

### Obrigatórias
- ✅ **Device ID (MercadoPago.js V2)** — SDK oficial carregado no checkout;
  o Device ID (`MP_DEVICE_SESSION_ID`) é coletado e enviado ao
  `/v1/payments` no header **`X-meli-session-id`** (cartão **e** PIX).
- ✅ **Secure Fields (PCI Compliance)** — número, validade e CVV agora são
  **iframes seguros da MP** (`mp.cardForm({ iframe: true })`). Nenhum dado
  de cartão passa pelo servidor da Elarah.

### Recomendadas (envio no `/v1/payments`)
- ✅ `payer.email`, ✅ `payer.first_name`, ✅ `payer.last_name`,
  ✅ `payer.identification` (CPF), ✅ `payer.phone`,
  ✅ `payer.address` (quando disponível), ✅ `issuer_id`,
  ✅ `payment_method_id`, ✅ `installments`, ✅ `token`,
  ✅ `transaction_amount`, ✅ `description`, ✅ `items` com **`description`**
  e `category_id`, ✅ `statement_descriptor` ("ELARAH").

---

## 4. Melhorias que aumentam a taxa de aprovação

1. **Device ID em todas as transações** — principal alavanca antifraude da MP.
2. **`additional_info` completo** (itens com `description`, `category_id`,
   `quantity`, `unit_price` + telefone/endereço do pagador) — quanto mais
   contexto, mais o motor aprova pagamentos legítimos.
3. **`issuer_id`** enviado — evita recusas por ambiguidade de emissor.
4. **3-D Secure 2 (`three_d_secure_mode: "optional"`)** — autenticação do
   banco só quando necessária; recupera transações que seriam recusadas por
   segurança. Front renderiza o desafio automaticamente.
5. **`binary_mode: false`** — permite `in_process` (análise) em vez de
   recusa imediata; a conciliação por webhook/polling finaliza o status.
6. **Checkout inline (sem redirect)** — menos abandono; o cliente não sai
   do site.
7. **`statement_descriptor` "ELARAH"** — reduz chargeback por
   desconhecimento da cobrança na fatura.
8. **`X-Idempotency-Key`** por booking — evita cobrança duplicada em retry.

---

## 5. Segurança e robustez (auditoria do backend)

- **Access Token** só no servidor (env); **public key** publicável no front.
- **Assinatura do webhook** validada por **HMAC-SHA256** com comparação
  *timing-safe* (mantido).
- **Idempotência**: webhook e reconciliação são idempotentes (não
  reprocessam booking já `pago`); Device ID + `X-Idempotency-Key` no create.
- **Rollback de estoque** quando a MP recusa o cartão (não deixa vaga presa).
- **Fallback em camadas**: se SDK/public key falharem → Checkout Pro; se
  colunas novas do banco faltarem → retry sem elas.
- **Logs sem dado sensível**: nunca registramos número de cartão nem CVV
  (não os recebemos — ficam nos Secure Fields da MP).

---

## 6. Passos de deploy (necessários para ativar)

> ⚠️ Enquanto a `MP_PUBLIC_KEY` **não** for configurada, o cartão continua
> no **Checkout Pro** (comportamento atual, sem regressão). Os pontos de
> Secure Fields/Device ID **só passam a valer após** os passos abaixo.

1. **Configurar env vars no Supabase** (Project → Edge Functions → Secrets):
   - `MP_PUBLIC_KEY` = public key **da mesma conta** do `MP_CARD_ACCESS_TOKEN`
     (produção: `APP_USR-...`; teste: `TEST-...`).
   - (Opcional) `MP_CARD_3DS_MODE=optional` (padrão). Use `not_supported`
     apenas se a conta ainda não tiver 3DS habilitado e a MP recusar o campo.
2. **Deploy das funções**:
   ```
   supabase functions deploy get-mp-public-key
   supabase functions deploy create-mp-card-payment
   supabase functions deploy create-mp-pix-payment
   supabase functions deploy mp-webhook --no-verify-jwt
   supabase functions deploy check-mp-payment-status
   ```
3. **Publicar o front** (`script.js`, `success.html`) — o site é estático.
4. **Testar em sandbox** com cartões de teste da MP (aprovado, recusado por
   CVV, recusado por saldo, e um que dispare 3-D Secure).
5. **Rerodar a ferramenta Qualidade da Integração** — deve subir de 51 para
   ~100 assim que a primeira transação transparente com Device ID for feita.

**Escotilhas de emergência (sem deploy):**
- `?mptransparent=0` na URL → força o Checkout Pro.
- `?mpcard=0` na URL → força o cartão de volta pro Stripe (já existia).

---

## 7. Pendências restantes / fora de escopo

- **Compra de gift card no cartão** continua via **Stripe** (não era Mercado
  Pago). Só o **PIX** de gift card passou a mandar Device ID. Migrar o cartão
  do gift card para o Checkout Transparente da MP é um próximo passo opcional.
- **Cópias do app mobile** (`app/ios/...`, `app/android/...`, `app/www/...`)
  são snapshots do Capacitor e **já estavam defasados** do root. Foram
  deixados como estão; devem ser regerados via `npx cap sync` a partir do web
  root na próxima build mobile. As mudanças valem no site (GitHub Pages) já.
- **`MP_PUBLIC_KEY` precisa ser fornecida** pelo time (credencial da conta) —
  é o único item que impede a ativação imediata.

---

## 8. Conclusão

Depois de configurar a `MP_PUBLIC_KEY` e publicar, a integração da Elarah
fica **aderente às melhores práticas atuais do Mercado Pago Developers**:
Checkout Transparente com **Secure Fields (PCI)**, **Device ID** em todas as
transações, payload completo de aprovação (`payer`, `issuer_id`,
`additional_info` com `items.description`, `statement_descriptor`), **3-D
Secure 2**, idempotência, webhook assinado e logs de auditoria — resolvendo
as pendências obrigatórias e recomendadas que travavam o score em 51/100,
sem remover nenhum fluxo existente (PIX e Checkout Pro seguem como rede de
segurança).
