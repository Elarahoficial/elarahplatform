# 08 — Infraestrutura

Todos os serviços externos utilizados e como se conectam.

---

## 1. Diagrama de conexões

```
                          ┌──────────────────────┐
        Usuário (web) ───▶ │  GitHub Pages         │  elarah.com.br (CNAME)
        Usuário (app) ───▶ │  site estático        │  ← deploy: git push
                          └──────────┬───────────┘
                                     │ Supabase JS SDK (publishable key + RLS)
                                     │ + chamadas às Edge Functions
                                     ▼
                          ┌──────────────────────────────────────────┐
                          │  SUPABASE  (nwijxjmenbfyehvscogs)          │
                          │  Auth · Postgres(RLS) · Edge Functions ·   │
                          │  Storage · Vault · pg_cron                 │
                          └───┬───────┬───────┬───────┬───────┬────────┘
                              │       │       │       │       │
        ┌─────────────────────┘       │       │       │       └───────────────┐
        ▼                             ▼       ▼       ▼                       ▼
  ┌───────────┐   ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐
  │Mercado    │   │ Stripe   │  │ Melhor   │ │ Resend   │ │Instagram │  │Anthropic │
  │Pago       │   │(gift/    │  │ Envio    │ │(e-mail)  │ │/Meta     │  │Claude    │
  │(Pix+cartão│   │ legado)  │  │(frete)   │ │          │ │(social)  │  │(IA opc.) │
  └───────────┘   └──────────┘  └──────────┘ └──────────┘ └──────────┘  └──────────┘
        ▲   webhooks (HMAC / stripe-signature) ▲                 ▲ Google Places
        └──────────────────────────────────────┘                  (prospecção)

   CI/CD:  GitHub Actions ──deploy──▶ Edge Functions + Backup do banco
           Codemagic (mac_mini_m2) ──build/assina──▶ App Store Connect ──▶ TestFlight/App Store
```

---

## 2. Serviços e papéis

| Serviço | Papel | Conecta-se via |
|---|---|---|
| **GitHub** | Repositório + hospedagem do site (Pages) + CI/CD (Actions) | git push; domínio `elarah.com.br` |
| **Supabase** | Backend central: Auth, Postgres, Edge Functions, Storage, Vault, cron | SDK (front) + secrets (funções) |
| **Mercado Pago** | Pagamentos Pix e cartão (primário) | Edge Functions + webhook `mp-webhook` |
| **Stripe** | Gift card / cartão legado | Edge Functions + webhook `stripe-webhook` |
| **Melhor Envio** | Frete Correios (PAC/SEDEX) dos kits | OAuth2 + `calculate-shipping` |
| **Resend** | E-mail transacional e broadcast | `_shared/email.ts` |
| **Instagram/Meta** | Analytics social (posts/insights) | Graph API v21.0 + OAuth |
| **Anthropic Claude** | Modo IA do diagnóstico (opcional) | `analytics-insights` |
| **Google Places** | Prospecção de leads | `prospect-finder` |
| **Apple / App Store Connect** | Distribuição iOS | Codemagic (API key `ElarahASC`) |
| **Codemagic** | Build/assinatura iOS na nuvem | `codemagic.yaml` |
| **Windsor.ai** | Import manual de dados sociais (CSV) | Aba admin "Redes Sociais" (sem segredo) |

---

## 3. Fluxos de dados entre serviços

- **Pagamento:** Front → Edge (cria pagamento) → Mercado Pago/Stripe → **webhook** → Edge reconcilia no Postgres → Resend (e-mail) → admin notificado.
- **Frete:** Front (kit) → `calculate-shipping` → Melhor Envio → preço → checkout com `shipping`.
- **Social:** Admin conecta (OAuth) → token criptografado em `social_accounts` → pg_cron (`sync-instagram` 4×/dia) → Graph API → `social_posts`/`social_post_metrics` → admin.
- **Diagnóstico IA:** pg_cron diário → `analytics-insights` lê `analytics_events`+`bookings` → (regras/Claude) → `analytics_insights_runs` → Resend (digest).
- **Backup:** GitHub Actions diário → `pg_dump` (`public`+`auth`) → compressão + AES-256 → artifact (90 dias).
- **CI de funções:** git push (branch monitorada) → GitHub Actions → `supabase functions deploy`.
- **CI do app:** botão no Codemagic → regenera projeto iOS → assina (CERT_KEY) → IPA → App Store Connect → TestFlight.

---

## 4. Hospedagem e domínio
- **Domínio:** `elarah.com.br` (via `CNAME`).
- **Hospedagem do site:** GitHub Pages (raiz do repositório, `.nojekyll`).
- **Backend:** infraestrutura gerenciada do Supabase (região do banco: `aws-1-sa-east-1` — São Paulo).
- **Não há** Vercel/Netlify configurados no repositório.

## 5. Custos recorrentes (referência)
- Supabase (plano do projeto), Mercado Pago/Stripe (taxas por transação), Resend (e-mail), Melhor Envio (frete), Codemagic (minutos de build macOS), Apple Developer (US$99/ano), Anthropic (~US$1–4/mês só se o modo IA estiver ligado). GitHub Pages e Actions: gratuitos no uso atual.
