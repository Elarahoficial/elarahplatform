# 01 — Arquitetura da Plataforma

## 1. Visão geral

A Elarah é composta por **quatro camadas**:

1. **Frontend web** — site multipágina estático (HTML/CSS/JS puro), sem framework nem build, servido por GitHub Pages.
2. **Backend Supabase** — Auth, Postgres, Edge Functions (Deno/TypeScript), pg_cron, Storage e Vault.
3. **App nativo** — Capacitor 7 empacota o site como WebView para iOS/Android; build iOS na nuvem via Codemagic.
4. **Serviços externos** — pagamentos, frete, e-mail, redes sociais, IA e hospedagem/CI.

O princípio central é **simplicidade radical no frontend** e **concentração da lógica sensível no backend** (Edge Functions com service role + RLS no banco).

---

## 2. Tecnologias utilizadas

### Frontend
- **HTML5 + CSS3 + JavaScript (ES6, vanilla)** — sem React/Vue/framework, sem bundler.
- **Supabase JS SDK v2.45.0** — carregado de `vendor/supabase-js@2.45.0.js` (local-first) com fallbacks de CDN (jsdelivr/unpkg/esm.sh).
- **PWA** — `manifest.webmanifest` (instalável em iOS/Android), ícones em `/assets/pwa/`.
- **Chart.js** — apenas no `admin-novo.html` (dashboard redesenhado, em progresso).
- **MercadoPago.js V2** — Secure Fields + Device ID no checkout transparente de cartão.

### Backend
- **Supabase** (BaaS): PostgreSQL, Auth (GoTrue), Edge Functions, Storage, Vault, pg_cron.
- **Deno / TypeScript** — runtime das 24 Edge Functions.
- **PostgreSQL** — ~50 tabelas, Row Level Security pervasiva, funções `plpgsql`, triggers, views, extensões (`pg_cron`, `pgcrypto`/`vault`).

### App nativo
- **Capacitor 7** (`@capacitor/core`, `ios`, `android`, `app`, `browser`, `share`, `splash-screen`, `status-bar`).
- **@capacitor/assets 3** — geração de ícones/splash.
- **Node 22, Xcode latest, CocoaPods** — toolchain de build iOS (Codemagic).

### Infra / DevOps
- **GitHub** — repositório, GitHub Pages (hospedagem do site), GitHub Actions (CI/CD).
- **Codemagic** — CI/CD do app iOS (`mac_mini_m2`).
- **Supabase CLI** — deploy das Edge Functions via GitHub Actions.

---

## 3. Estrutura do projeto

```
elarahplatform/
├── index.html, experiencia.html, categoria.html, presentear.html, …   ← páginas públicas
├── conta.html, reset-password.html, success.html, cancel.html, avaliar.html
├── admin.html, admin-novo.html                                        ← painel administrativo
├── script.js (276KB)            ← engine da home/core (cards, filtros, cupons)
├── auth.js                      ← ElarahAuth (login, OAuth, reset de senha, papéis)
├── experiences-data.js (108KB)  ← ElarahData (leitura/CRUD de experiences + seeds fallback)
├── byelarah-data.js             ← ElarahByElarah (originais)
├── categoria.js, presentear.js, conta.js, kit-checkout.js             ← controllers de página
├── analytics.js                 ← ElarahAnalytics (eventos → analytics_events)
├── supabase-client.js           ← inicialização resiliente do client Supabase
├── supabase-loader.js           ← carregamento em camadas do SDK (local + CDNs)
├── header-nav.js, date-filter.js, explorar-menu.js                    ← utilitários de UI
├── admin.js (~1MB)              ← todo o painel admin (SPA de abas)
├── admin-ceo.js, admin-eventos.js, admin-insights.js, admin-broadcast.js,
│   admin-social.js, admin-social-analysis.js, admin-prospect-*.js      ← módulos admin
├── styles.css, admin.css, auth.css, *.css                             ← estilos
├── vendor/                      ← supabase-js versionado (local-first)
├── assets/                      ← imagens, PWA, experiências
├── og/                          ← landing pages de preview (Open Graph), geradas
├── data/                        ← seeds (CSV de prospects)
├── scripts/                     ← build-experiences-sitemap.mjs, build-og-pages.mjs
│
├── supabase/
│   ├── config.toml              ← project_id + verify_jwt por função
│   └── functions/               ← 24 Edge Functions (Deno/TS)
│       ├── _shared/             ← libs compartilhadas (mercadopago, email, frete, social, …)
│       ├── create-mp-pix-payment/, create-mp-card-payment/, mp-webhook/, …
│       ├── create-checkout-session/, stripe-webhook/
│       ├── calculate-shipping/, melhor-envio-connect/, melhor-envio-callback/
│       ├── oauth-start/, oauth-callback/, sync-instagram/, refresh-tokens/
│       ├── analytics-insights/, redeem-gift-card/, delete-account/, …
│       └── SOCIAL_INTEGRATION_SETUP.md
│
├── sql/                         ← ~150 scripts SQL versionados (esquema evolutivo)
│
├── app/                         ← app Capacitor
│   ├── package.json, capacitor.config.json
│   ├── scripts/copy-web.mjs     ← reconstrói app/www a partir do site
│   ├── www/                     ← cópia do site + capacitor-bridge.js (gerada)
│   ├── native-overrides/        ← PrivacyInfo.xcprivacy
│   ├── assets-src/              ← ícone oficial
│   ├── ios/, android/           ← projetos nativos (iOS não versionado; regenerado no build)
│   └── codemagic.yaml (raiz)    ← workflow de build iOS
│
├── .github/workflows/
│   ├── deploy-edge-functions.yml
│   ├── backup-database.yml
│   └── build-og-pages.yml
│
├── docs/                        ← documentação operacional e auditorias
│   └── projeto/                 ← ESTE acervo consolidado
│
├── CNAME (elarah.com.br), .nojekyll, robots.txt, sitemap*.xml, manifest.webmanifest
└── .gitignore
```

---

## 4. Fluxo da aplicação

### 4.1 Carregamento de página (frontend)
1. O HTML carrega `supabase-loader.js` (SDK local `vendor/` → fallback CDN) e `supabase-client.js`.
2. `supabase-client.js` cria o client com a **publishable key** e um `resilientFetch` (retry/backoff em falhas de rede/QUIC). Dispara o evento `elarah:supabase-ready`.
3. Módulos de dados (`experiences-data.js`, `auth.js`, etc.) usam `ElarahSupabase.waitClient()` para esperar o client, com **seeds de fallback** embutidos caso o Supabase esteja indisponível.
4. `analytics.js` registra `page_view` e cliques `[data-analytics]` na tabela `analytics_events`.

### 4.2 Autenticação
- Centralizada em `auth.js` (`ElarahAuth`): email/senha, Google e Apple OAuth, reset de senha.
- **Flow `implicit`** (tokens no hash) — escolhido para que links de confirmação/reset funcionem em qualquer navegador sem depender do `code_verifier` do PKCE.
- Perfis em `public.profiles`; papel em `role` (`user`/`admin`); trilha de parceiro em `partner_status`/`partner_data`.
- Roteamento: `conta.js` redireciona admin para `admin.html`; anônimos em páginas de conta/checkout são levados à home.

### 4.3 Reserva e pagamento (o fluxo mais crítico)
```
Cliente escolhe experiência/slot em experiencia.html
        │
        ├─ Pix (Mercado Pago)     → Edge create-mp-pix-payment
        ├─ Cartão (Mercado Pago)  → Edge create-mp-card-payment (Checkout Transparente ou Pro)
        └─ Cartão/gift (Stripe)   → Edge create-checkout-session
        │
        ▼
Edge valida experiência/slot/cutoff/vagas (booking_guard.ts),
segura cupom/gift card, calcula rateio financeiro (financial.ts),
recalcula frete (kits), insere booking `pending` e retorna QR/URL
        │
        ▼  (cliente paga)
Webhook do provedor → mp-webhook / stripe-webhook (verify_jwt=false, valida assinatura)
        │
        ▼
Reconciliação idempotente: marca booking `paid`, decrementa vaga,
registra uso de cupom, envia e-mail de confirmação (Resend) e
notificação de venda ao admin. check-mp-payment-status faz backup por polling.
```

### 4.4 Painel administrativo
- `admin.html` é uma SPA de abas: `<nav>` de botões `data-panel` alterna `#panel-*`. Guardado por `role==='admin'`.
- Ler/gravar dados usa o SDK com o **JWT do admin** (RLS gate `is_admin()`), e Edge Functions admin-gated para ações sensíveis (broadcast, prospecção, acesso de conta, social).

### 4.5 App nativo
- `app/scripts/copy-web.mjs` copia o site para `app/www` e injeta `capacitor-bridge.js` antes de `</body>` em cada HTML.
- Capacitor empacota `app/www` num WebView; `allowNavigation` libera domínios do Mercado Pago e da Elarah para o checkout dentro do app.

---

## 5. Backend, frontend e banco de dados (resumo)

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|------------------|
| **Frontend** | HTML/CSS/JS puro + Supabase JS | UI, leitura via RLS, iniciar pagamentos, admin |
| **Backend** | Supabase Edge Functions (Deno/TS) | Pagamentos, e-mail, frete, OAuth social, IA, ações admin |
| **Banco** | PostgreSQL (Supabase) | ~50 tabelas, RLS, funções de inventário/cupom/financeiro, cron |
| **Storage** | Supabase Storage | `experience-images` (público), `financial-attachments` (privado) |
| **App** | Capacitor 7 | WebView nativo iOS/Android |

Detalhes de banco em [12 — Banco de Dados](./12-Banco-de-Dados.md); de integrações e Edge Functions em [11 — Integrações](./11-Integracoes.md).

---

## 6. Integrações (visão de arquitetura)

- **Pagamentos:** Mercado Pago (Pix + cartão, primário) e Stripe (gift card / legado).
- **Frete:** Melhor Envio (preços reais Correios PAC/SEDEX via OAuth) para os kits "Elarah em Casa".
- **E-mail:** Resend (confirmações, recuperação de senha, notificações, digest de IA, newsletter).
- **Redes sociais:** Instagram/Meta Graph API (OAuth + sync de posts/insights).
- **IA:** Anthropic Claude (modo opcional do agente de diagnóstico).
- **Prospecção:** Google Places (prospect finder).
- **Distribuição mobile:** Apple / App Store Connect via Codemagic.

Cada integração e seus segredos estão detalhados em [11 — Integrações](./11-Integracoes.md), [04 — Configurações](./04-Configuracoes.md) e [09 — Segurança](./09-Seguranca.md).
