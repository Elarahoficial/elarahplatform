# 04 — Configurações

Todas as configurações relevantes por serviço. **Nenhum valor secreto** é reproduzido aqui — apenas nomes e onde configurar. Para o mapa de credenciais e "onde cada uma é usada", ver [09 — Segurança](./09-Seguranca.md).

---

## 1. GitHub

- **Repositório:** `Elarahoficial/elarahplatform`.
- **Hospedagem do site:** GitHub Pages, servindo a raiz do repositório. Arquivos-chave: `CNAME` (`elarah.com.br`), `.nojekyll`, `robots.txt`, `sitemap.xml`, `sitemap-experiencias.xml`.
- **Secrets (Settings → Secrets and variables → Actions):**
  - `SUPABASE_ACCESS_TOKEN` — token do Supabase CLI (deploy de funções).
  - `SUPABASE_PROJECT_REF` **ou** `SUPABASE_PROJECT_ID` — ref do projeto (`nwijxjmenbfyehvscogs`).
  - `SUPABASE_DB_PASSWORD` — senha do banco (backup).
  - `BACKUP_PASSPHRASE` — senha forte para criptografar/descriptografar o backup.
- **Workflows (`.github/workflows/`):**
  - `deploy-edge-functions.yml` — deploy das Edge Functions (push em branches `claude/*` que tocam `supabase/functions/**`, ou dispatch manual).
  - `backup-database.yml` — backup diário 06:00 UTC (cron) + botão manual.
  - `build-og-pages.yml` — regenera as landings OG (dispatch manual); commita `og/`.

## 2. Supabase

- **Project ID/ref:** `nwijxjmenbfyehvscogs` (em `supabase/config.toml`).
- **Frontend (hardcoded, público — `supabase-client.js`):**
  - `SUPABASE_URL = https://nwijxjmenbfyehvscogs.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY = sb_publishable_HKveTG-kF0ZDsbiHYvwBdA_Kg5PUOlJ` (chave anon, protegida por RLS — pública por design).
- **`config.toml` — `verify_jwt = false`** para: `stripe-webhook`, `mp-webhook`, `oauth-callback`, `melhor-envio-callback`, `og-experience`. As demais funções mantêm `verify_jwt = true`.
- **Edge Function Secrets** (Dashboard → Edge Functions → Secrets): ver lista completa na seção 8 e em [09 — Segurança](./09-Seguranca.md).
- **Vault:** `elarah_service_role_key` (usado pelos jobs pg_cron).
- **Storage buckets:** `experience-images` (leitura pública, escrita admin), `financial-attachments` (privado, só admin).

## 3. Codemagic (CI iOS)

- **Arquivo:** `codemagic.yaml` (raiz). Workflow `ios-elarah` ("Elarah iOS"), `instance_type: mac_mini_m2`, `max_build_duration: 60`.
- **Integração:** `app_store_connect: ElarahASC` (App Store Connect API key).
- **Variable group `elarah_signing`:** `CERT_KEY` (chave privada de assinatura, PEM ou base64, marcada **Secure**).
- **Vars:** `XCODE_PROJECT`, `XCODE_WORKSPACE`, `XCODE_SCHEME`, `BUNDLE_ID=com.elarah.app`.
- **Toolchain:** `node: 22`, `xcode: latest`, `cocoapods: default`.
- **Publishing:** `submit_to_testflight: true`, `auth: integration`.

## 4. Vercel

- **Não utilizado no repositório atual.** Não há `vercel.json` nem `.vercel`. O site é servido por GitHub Pages. (Ver [13 — Deploy](./13-Deploy.md), observação sobre histórico.)

## 5. Mercado Pago

- **Secrets (Supabase Edge Functions):**
  - `MERCADO_PAGO_ACCESS_TOKEN`, `MP_CARD_ACCESS_TOKEN`, `MP_LEGACY_ACCESS_TOKEN` (tokens server-side; múltiplos para migração de conta).
  - `MP_PUBLIC_KEY` / `MP_CARD_PUBLIC_KEY` / `MERCADO_PAGO_PUBLIC_KEY` (public key servida ao front por `get-mp-public-key`; **necessária para ativar o Checkout Transparente/Secure Fields** — sem ela, cai no Checkout Pro).
  - `MP_WEBHOOK_SECRET` / `MERCADO_PAGO_WEBHOOK_SECRET` / `MP_CARD_WEBHOOK_SECRET` / `MP_LEGACY_WEBHOOK_SECRET` (HMAC do webhook).
  - `MP_CARD_3DS_MODE` (modo 3-D Secure; default `optional`).
- **Webhook:** URL da função `mp-webhook` cadastrada no painel Mercado Pago; valida `x-signature` (HMAC-SHA256).

## 6. Apple / App Store Connect

- **Bundle ID:** `com.elarah.app`.
- **App Store Connect API key** cadastrada no Codemagic como integração **ElarahASC**.
- **`CERT_KEY`** no grupo `elarah_signing` (Codemagic) — chave de assinatura persistente.
- **Info.plist aplicado no build:** `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription`, `ITSAppUsesNonExemptEncryption=false`, `CFBundleVersion` por timestamp.
- **Privacy manifest:** `app/native-overrides/PrivacyInfo.xcprivacy`. (Ver `docs/app-store-privacidade.md`.)

## 7. APIs externas (outras)

| API | Secrets | Uso |
|---|---|---|
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Gift card / cartão legado; webhook `stripe-webhook`. |
| **Melhor Envio** | `MELHOR_ENVIO_CLIENT_ID`, `MELHOR_ENVIO_CLIENT_SECRET`, `MELHOR_ENVIO_BASE`, `MELHOR_ENVIO_CONTACT`, `MELHOR_ENVIO_TOKEN`, `SHIPPING_ORIGIN_CEP`, `SHIPPING_MODE` | Frete Correios. Redirect: `.../functions/v1/melhor-envio-callback`. |
| **Instagram/Meta** | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `META_TOKEN_ENCRYPTION_KEY`, `ADMIN_FALLBACK_RETURN_URL` | Graph API v21.0. Redirect: `.../functions/v1/oauth-callback`. |
| **Resend** | `RESEND_API_KEY`, `ELARAH_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS` | E-mails transacionais. |
| **Anthropic** | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-opus-4-8`) | Modo IA do diagnóstico (opcional). |
| **Google Places** | `GOOGLE_PLACES_API_KEY` | Prospect finder. |

## 8. Variáveis de ambiente (inventário completo — Edge Functions)

**Injetadas automaticamente pelo Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (alias `ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`.

**Pagamentos/checkout:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`, `MP_CARD_ACCESS_TOKEN`, `MP_LEGACY_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MP_CARD_WEBHOOK_SECRET`, `MP_LEGACY_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`, `MP_CARD_PUBLIC_KEY`, `MERCADO_PAGO_PUBLIC_KEY`, `MP_CARD_3DS_MODE`, `CARD_FEE_PERCENT`, `CARD_FEE_FIXED_CENTS`, `PUBLIC_SITE_URL`.

**Frete:** `MELHOR_ENVIO_CLIENT_ID`, `MELHOR_ENVIO_CLIENT_SECRET`, `MELHOR_ENVIO_BASE`, `MELHOR_ENVIO_CONTACT`, `MELHOR_ENVIO_TOKEN`, `SHIPPING_ORIGIN_CEP`, `SHIPPING_MODE`.

**E-mail:** `RESEND_API_KEY`, `ELARAH_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS`.

**Social:** `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `META_TOKEN_ENCRYPTION_KEY`, `ADMIN_FALLBACK_RETURN_URL`.

**IA/cron:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `CRON_SECRET`, `BROADCAST_SECRET`, `GOOGLE_PLACES_API_KEY`.

**GitHub Actions:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`/`SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`, `BACKUP_PASSPHRASE` (não-secretos no backup: `DB_HOST=aws-1-sa-east-1.pooler.supabase.com`, `DB_PORT=5432`, `DB_USER=postgres.nwijxjmenbfyehvscogs`, `DB_NAME=postgres`).

**Codemagic:** `CERT_KEY` (grupo `elarah_signing`), `BUNDLE_ID`, `XCODE_*`.

> `.gitignore` exclui `.env`, `.env.*`, `node_modules/`, `supabase/.temp/` e artefatos do Capacitor. **Nenhum `.env` é versionado.**

## 9. Webhooks

| Webhook | Função | Autenticação | verify_jwt |
|---|---|---|---|
| Mercado Pago | `mp-webhook` | HMAC `x-signature` | false |
| Stripe | `stripe-webhook` | `stripe-signature` | false |
| OAuth Instagram (redirect) | `oauth-callback` | `state` CSRF + TTL | false |
| OAuth Melhor Envio (redirect) | `melhor-envio-callback` | `state` CSRF + TTL | false |

## 10. Build e Deploy (resumo — detalhes em [13 — Deploy](./13-Deploy.md))

- **Site:** git push na branch de Pages → publicado em `elarah.com.br`.
- **Edge Functions:** push em branch monitorada tocando `supabase/functions/**` → `deploy-edge-functions.yml` roda `supabase functions deploy` (flags `--no-verify-jwt` por função conforme o caso).
- **App iOS:** botão "Start new build" no Codemagic (workflow "Elarah iOS") → regenera projeto → assina → IPA → TestFlight.
- **Landings OG:** dispatch manual de `build-og-pages.yml`.
