# 11 — Integrações e Edge Functions

Detalhe de cada integração externa e das 24 Edge Functions (Deno/TypeScript) do projeto Supabase `nwijxjmenbfyehvscogs`.

---

## Parte A — Integrações externas

### Mercado Pago (pagamentos primários: Pix + cartão)
- **Uso:** Pix (experiências e gift cards) e cartão (Checkout Transparente com fallback Checkout Pro); reconciliação por webhook.
- **Funções:** `create-mp-pix-payment`, `create-mp-card-payment`, `mp-webhook`, `check-mp-payment-status`, `get-mp-public-key`. Lib: `_shared/mercadopago.ts` (`createPixPayment`, `createCardPayment`, `createCheckoutPreference`, `getPayment`, `verifyWebhookSignature`, `isValidCpf`, Device ID via `X-meli-session-id`).
- **Segredos:** `MERCADO_PAGO_ACCESS_TOKEN`, `MP_CARD_ACCESS_TOKEN`, `MP_LEGACY_ACCESS_TOKEN`, `MP_*_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`/`MP_CARD_PUBLIC_KEY`/`MERCADO_PAGO_PUBLIC_KEY`, `MP_CARD_3DS_MODE`.
- **Webhook:** `mp-webhook` (`verify_jwt=false`, HMAC-SHA256).

### Stripe (gift card / cartão legado)
- **Uso:** checkout de gift card e cartão via `create-checkout-session` (até 12×); confirmação via `stripe-webhook`.
- **Segredos:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. SDK `esm.sh/stripe@14.21.0`.
- **Webhook:** `stripe-webhook` (`verify_jwt=false`, `stripe-signature`). Sem publishable key no front (checkout hospedado por redirect).

### Melhor Envio (frete Correios PAC/SEDEX)
- **Uso:** cotação de frete real para os kits "Elarah em Casa" via OAuth2; roadmap de etiqueta automática.
- **Funções:** `calculate-shipping`, `melhor-envio-connect`, `melhor-envio-callback`. Libs: `_shared/melhor_envio.ts` (OAuth + refresh automático), `_shared/shipping.ts`.
- **Segredos:** `MELHOR_ENVIO_CLIENT_ID`, `MELHOR_ENVIO_CLIENT_SECRET`, `MELHOR_ENVIO_BASE`, `MELHOR_ENVIO_CONTACT`, `MELHOR_ENVIO_TOKEN`, `SHIPPING_ORIGIN_CEP`, `SHIPPING_MODE`, `META_TOKEN_ENCRYPTION_KEY`.
- **Tokens:** criptografados na tabela `melhor_envio_tokens`. Redirect: `.../functions/v1/melhor-envio-callback` (`state` CSRF).
- **Guia:** `docs/frete-melhor-envio.md`.

### Instagram / Meta (analytics social)
- **Uso:** conexão OAuth da conta Instagram Business, sync de posts/insights no admin, refresh de token de longa duração.
- **Funções:** `oauth-start`, `oauth-callback`, `sync-instagram`, `refresh-tokens`. Libs: `_shared/social_*` (config, crypto AES-GCM, db, meta client, sync helpers).
- **Segredos:** `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` (login direto Instagram), `META_APP_ID`, `META_APP_SECRET` (usados no `refresh-tokens`), `META_TOKEN_ENCRYPTION_KEY`, `ADMIN_FALLBACK_RETURN_URL`.
- **API:** Instagram Graph API `v21.0`, escopos `instagram_business_basic`, `instagram_business_manage_insights`. Tokens criptografados em `social_accounts`.
- **Nota:** a integração migrou para login direto Instagram; `SOCIAL_INTEGRATION_SETUP.md` (que fala em Meta login) precede essa mudança. Import manual via **Windsor.ai** (CSV) é um caminho separado, sem segredo (ver `docs/windsor-import.md`).

### Resend (e-mail transacional/broadcast)
- **Uso:** confirmações, recuperação de senha, mensagens fornecedor↔cliente, confirmação de venda manual, digest diário, newsletter, reviews.
- **Lib:** `_shared/email.ts` (templates HTML + fallback sandbox `onboarding@resend.dev`).
- **Segredos:** `RESEND_API_KEY`, `ELARAH_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS`.

### Anthropic Claude (IA opcional)
- **Uso:** modo `ai` do agente `analytics-insights`.
- **Segredos:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-opus-4-8`). Custo estimado US$1–4/mês (ver `docs/agente-diagnostico-ia.md`).

### Google Places (prospecção)
- **Uso:** prospect finder (busca de leads B2C/B2B). Segredo: `GOOGLE_PLACES_API_KEY`.

### Apple / App Store Connect & Codemagic
- Ver [04 — Configurações](./04-Configuracoes.md) e [13 — Deploy](./13-Deploy.md).

---

## Parte B — Biblioteca compartilhada (`supabase/functions/_shared/`)

| Arquivo | Papel |
|---|---|
| `cors.ts` | Cabeçalhos CORS (origin `*`, permite `stripe-signature`). |
| `mercadopago.ts` | Wrapper REST do Mercado Pago (Pix, cartão, preferência, getPayment, HMAC). |
| `financial.ts` | `computeFinancialBreakdown()` — rateio entre fornecedores + comissão Elarah. |
| `booking_guard.ts` (+ `.test.ts`) | Guarda de reserva: valida experiência/vagas/cutoff, segura cupom/gift card, decremento atômico de slot, rollback. |
| `email.ts` | Wrapper Resend + todos os templates de e-mail; `generateGiftCardCode()`. |
| `melhor_envio.ts` | OAuth2 + ciclo de token do Melhor Envio (com refresh). |
| `shipping.ts` | Cálculo de frete (real ou estimativa; modo grátis). |
| `social_config.ts` | Constantes da Instagram Graph API + helpers de env (`requireEnv`/`envOrDefault`). |
| `social_crypto.ts` | Criptografia AES-GCM de tokens + `generateOAuthState()`. |
| `social_db.ts` | Client service-role singleton, `authorizeAdmin()`, persistência de OAuth state, `upsertSocialAccount()`. |
| `social_meta_client.ts` | `MetaGraphClient` — fetch com paginação e backoff em rate limit. |
| `social_sync_helpers.ts` | Normalização de mídia IG, extração de hashtags, política de re-sync. |

---

## Parte C — As 24 Edge Functions

> **Convenção:** `verify_jwt=true` (default) bloqueia chamadas não autenticadas antes do código. "Service role" = usa `SUPABASE_SERVICE_ROLE_KEY` (bypass de RLS). Apenas 5 funções usam `verify_jwt=false`.

### Pagamentos
- **create-mp-pix-payment** — cria pagamento Pix (experiência ou gift card), pré-insere booking `pending`, retorna QR + copia-e-cola. Exige CPF. Segredos: `MERCADO_PAGO_ACCESS_TOKEN`, `PUBLIC_SITE_URL`. Service role.
- **create-mp-card-payment** — cartão MP: Checkout Transparente (Secure Fields + Device ID + 3DS) ou Checkout Pro (fallback). Segredos: `MP_CARD_ACCESS_TOKEN`→`MERCADO_PAGO_ACCESS_TOKEN`, `PUBLIC_SITE_URL`, `MP_CARD_3DS_MODE`, `CARD_FEE_*`. Service role.
- **create-checkout-session** — Stripe Checkout (experiência ou gift card), valida vagas/cutoff, segura cupom/gift, recalcula frete, pré-insere booking. Segredos: `STRIPE_SECRET_KEY`, `PUBLIC_SITE_URL`, `CARD_FEE_*`. Service role.
- **get-mp-public-key** — devolve a public key da MP para o front (ou `null` → Checkout Pro). Segredos: `MP_PUBLIC_KEY`/`MP_CARD_PUBLIC_KEY`/`MERCADO_PAGO_PUBLIC_KEY`. Sem client Supabase.
- **check-mp-payment-status** — backup por polling: consulta a MP e reconcilia booking/gift card. Segredos: `MERCADO_PAGO_ACCESS_TOKEN`. Service role.

### Webhooks (verify_jwt=false)
- **mp-webhook** — webhook Mercado Pago. Valida HMAC (main/card/legacy), busca o pagamento, reconcilia (marca pago, re-ocupa inventário, registra cupom, e-mails; cancela/estorna; ativa gift card `GIFT-`). Idempotente.
- **stripe-webhook** — webhook Stripe: `checkout.session.completed/expired`, `async_payment_failed`, `charge.refunded`. Idempotente, com guardas de overbooking/valor e backfill financeiro.

### Frete
- **calculate-shipping** — cotação PAC/SEDEX sem criar booking. Segredos: `SHIPPING_ORIGIN_CEP` + `MELHOR_ENVIO_*`.
- **melhor-envio-connect** — inicia OAuth (gera `state`, retorna authorize URL). Admin-gated.
- **melhor-envio-callback** (`verify_jwt=false`) — troca `code` por tokens, grava criptografado, redireciona `?frete_conectado=1`.

### Social (Instagram)
- **oauth-start** — inicia OAuth Instagram (state em `social_oauth_states`). Admin-gated. Segredos: `INSTAGRAM_APP_ID`.
- **oauth-callback** (`verify_jwt=false`) — troca `code` → token de 60 dias, criptografa, upsert em `social_accounts`. Segredos: `INSTAGRAM_APP_ID/SECRET`, `ADMIN_FALLBACK_RETURN_URL`.
- **sync-instagram** — cron/admin: lista mídias + stories, busca insights, upsert `social_posts`, snapshot `social_post_metrics`.
- **refresh-tokens** — cron/admin: renova tokens Instagram que expiram em ≤14 dias. Segredos: `META_APP_ID/SECRET`.

### E-mail / vendas / conta
- **notify-manual-sale** — e-mail "Nova venda 🎉" ao admin para vendas manuais. Via `email.ts`.
- **send-manual-sale-confirmation** — e-mail de confirmação ao cliente de venda manual (`manual_sales`, `payment_status='pago'`). Service role.
- **resend-booking-confirmation** — reenvia a confirmação de reserva (quando o admin edita depois do webhook). Service role.
- **send-supplier-customer-message** — mensagem pós-compra específica do fornecedor (fluxos BaresSp/Lado B). Service role.
- **send-password-recovery** — gera link de reset server-side e envia via Resend; sem enumeração de contas; throttle 30s; allowlist de `redirectTo`. Service role.
- **admin-account-access** — admin destrava conta de cliente (senha temporária + confirma e-mail + link). Admin-gated + service role.
- **delete-account** — LGPD/Apple: anonimiza financeiro, remove PII, apaga o usuário. Valida o próprio token; service role.
- **redeem-gift-card** — preview (sem consumo) de cupom/gift card (`preview_coupon` → fallback `preview_gift_card`). Service role.

### IA / público
- **analytics-insights** — agente de diagnóstico diário ("Onde estamos pecando"): lê `analytics_events`+`bookings`, gera diagnóstico por regras (grátis) ou IA (Claude), grava `analytics_insights_runs`, envia digest. Autoriza via `CRON_SECRET` / service role / admin. Segredos: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `CRON_SECRET`.
- **og-experience** (`verify_jwt=false`) — HTML público com Open Graph dinâmico para preview de link (WhatsApp/Facebook). Só campos públicos da experiência.

---

## Parte D — Versões standalone (deploy sem terminal)

Em `docs/deploy-sem-terminal/` há versões **single-file** (sem imports compartilhados) para colar no editor web do Supabase: `analytics-insights.standalone.ts`, `auto-newsletter.standalone.ts`, `broadcast-email.standalone.ts`, `prospect-finder.standalone.ts`, `reviews.standalone.ts`. Usam os mesmos segredos (`CRON_SECRET`, `BROADCAST_SECRET`, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, etc.). Guia: `docs/deploy-sem-terminal/COMO-SUBIR-SEM-TERMINAL.md`.
