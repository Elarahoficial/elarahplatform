# 09 — Segurança

Mapa de todas as credenciais necessárias — **sem expor valores** — indicando **onde cada uma é configurada** e **onde é usada**. Complementa [04 — Configurações](./04-Configuracoes.md).

---

## 1. Princípios de segurança do projeto
- **Fronteira no banco, não no cliente:** o frontend usa a *publishable key* (anon); todo dado é protegido por **RLS**. A chave pode ser pública porque sozinha não dá acesso além do que as políticas permitem.
- **Segredos só no servidor:** tokens de pagamento, API keys e service role ficam em Edge Functions / secrets — nunca no navegador.
- **Webhooks autenticados por assinatura** (HMAC/`stripe-signature`), não por JWT.
- **OAuth protegido por `state` CSRF com TTL.**
- **Tokens de terceiros criptografados** (AES-256) no banco.
- **Anti-escalonamento de privilégio** via trigger em `profiles`.
- **Nenhum segredo versionado:** `.gitignore` bloqueia `.env*`.

---

## 2. Credenciais por local de configuração

### A) Frontend (público por design — `supabase-client.js`)
| Credencial | Uso | Sensibilidade |
|---|---|---|
| `SUPABASE_URL` | Endpoint do projeto | Pública |
| `SUPABASE_PUBLISHABLE_KEY` (anon) | Acesso do front via RLS | Pública (protegida por RLS) |

### B) Supabase — Edge Function Secrets
| Credencial | Onde é usada |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` *(auto-injetada)* | Quase todas as funções (bypass RLS) e Vault p/ cron |
| `SUPABASE_ANON_KEY` / `ANON_KEY` *(auto)* | `admin-account-access`, `delete-account`, `social_db` |
| `STRIPE_SECRET_KEY` | `create-checkout-session`, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` (valida assinatura) |
| `MERCADO_PAGO_ACCESS_TOKEN` | `create-mp-pix-payment`, `check-mp-payment-status`, `mp-webhook`, fallback cartão |
| `MP_CARD_ACCESS_TOKEN` | `create-mp-card-payment`, `mp-webhook` |
| `MP_LEGACY_ACCESS_TOKEN` | `mp-webhook` (migração de conta) |
| `MP_WEBHOOK_SECRET` / `MERCADO_PAGO_WEBHOOK_SECRET` / `MP_CARD_WEBHOOK_SECRET` / `MP_LEGACY_WEBHOOK_SECRET` | `mp-webhook` (HMAC) |
| `MP_PUBLIC_KEY` / `MP_CARD_PUBLIC_KEY` / `MERCADO_PAGO_PUBLIC_KEY` | `get-mp-public-key` (servida ao front) |
| `MP_CARD_3DS_MODE` | `create-mp-card-payment` |
| `CARD_FEE_PERCENT`, `CARD_FEE_FIXED_CENTS` | funções de checkout (taxa de cartão) |
| `PUBLIC_SITE_URL` | redirects de checkout |
| `MELHOR_ENVIO_CLIENT_ID` / `_CLIENT_SECRET` | `melhor-envio-connect/callback`, `_shared/melhor_envio.ts` |
| `MELHOR_ENVIO_BASE` / `_CONTACT` / `_TOKEN` | `_shared/melhor_envio.ts`, `_shared/shipping.ts` |
| `SHIPPING_ORIGIN_CEP`, `SHIPPING_MODE` | `calculate-shipping`, `_shared/shipping.ts` |
| `INSTAGRAM_APP_ID` / `_APP_SECRET` | `oauth-start`, `oauth-callback` |
| `META_APP_ID` / `_APP_SECRET` | `refresh-tokens` |
| `META_TOKEN_ENCRYPTION_KEY` | criptografia AES de tokens (Instagram **e** Melhor Envio) — **não rotacionar sem migrar** |
| `ADMIN_FALLBACK_RETURN_URL` | `oauth-callback` |
| `RESEND_API_KEY` | `_shared/email.ts` (todos os e-mails) |
| `ELARAH_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS` | remetente / destinatários de notificação |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | `analytics-insights` (modo IA) |
| `CRON_SECRET` | autoriza chamadas de cron (`analytics-insights`, standalone) |
| `BROADCAST_SECRET` | autoriza broadcast/newsletter (standalone) |
| `GOOGLE_PLACES_API_KEY` | prospect finder |

### C) Supabase — Vault
| Segredo | Uso |
|---|---|
| `elarah_service_role_key` | pg_cron chamar Edge Functions autenticadas (sync social, insights) |

### D) GitHub Actions — Secrets
| Segredo | Uso |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | deploy de Edge Functions (`deploy-edge-functions.yml`) |
| `SUPABASE_PROJECT_REF` / `SUPABASE_PROJECT_ID` | ref do projeto no deploy |
| `SUPABASE_DB_PASSWORD` | dump do banco (`backup-database.yml`) |
| `BACKUP_PASSPHRASE` | criptografa/descriptografa o backup (AES-256) |
| `GITHUB_TOKEN` *(default)* | commit das landings OG (`build-og-pages.yml`) |

### E) Codemagic — Integração + grupo de variáveis
| Item | Uso |
|---|---|
| Integração `ElarahASC` (App Store Connect API key) | autenticação/publicação iOS |
| `CERT_KEY` (grupo `elarah_signing`, **Secure**) | chave de assinatura persistente (evita erro 409) |

---

## 3. Checklist de rotação/migração de credenciais
- **Migração de contas (o motivo desta consolidação):** substituir os secrets de cada serviço nos **Edge Function Secrets do Supabase**, **GitHub Secrets** e **Codemagic** do novo projeto/contas. Os fallbacks de nome do Mercado Pago (`MP_*`/`MERCADO_PAGO_*`/`MP_LEGACY_*`) permitem transição sem downtime nos webhooks.
- **`META_TOKEN_ENCRYPTION_KEY`:** se trocar, os tokens já gravados (Instagram/Melhor Envio) ficam ilegíveis — reconecte as contas ou migre os registros.
- **`BACKUP_PASSPHRASE`:** guarde com segurança; sem ela os backups não abrem.
- **`CERT_KEY`:** reutilizada entre builds; revogar/recriar exige limpar certificados órfãos na Apple.
- **Publishable key trocada:** atualizar `supabase-client.js` (frontend) e o bundle do app (`app/www`).

## 4. Conformidade e privacidade
- **LGPD/Apple:** exclusão de conta implementada (`delete-account`) — anonimiza financeiro e remove PII.
- **Privacy manifest iOS:** `app/native-overrides/PrivacyInfo.xcprivacy`; App Privacy Labels em `docs/app-store-privacidade.md` (sem tracking/ATT).
- **Sem enumeração de contas:** `send-password-recovery` sempre responde genérico.
