# 07 — Histórico

Resumo cronológico das principais etapas do projeto.

> **Nota sobre a fonte:** o histórico do git no repositório atual concentra-se em **julho/2026** (muitos commits "Add files via upload", indicando re-upload/consolidação do código). Por isso a cronologia abaixo é **reconstruída** a partir das datas dos documentos em `docs/`, dos nomes das branches/PRs de funcionalidade e do estado do código — não de um log linear completo.

---

## Linha do tempo (reconstruída)

### Fundação da plataforma
- Definição da stack: **site estático (HTML/CSS/JS) + Supabase** como backend único.
- Catálogo de experiências (`experiences`), reservas (`bookings`), autenticação (`profiles`, papéis).
- Setup de segurança: **RLS pervasiva** + função `is_admin()` + trigger anti-escalonamento em `profiles`.
- Painel administrativo (`admin.html`/`admin.js`) evoluindo por abas (marcador atual: **Admin v.69**).

### Pagamentos e checkout
- Integração inicial com **Stripe** (gift cards / cartão) — `create-checkout-session` + `stripe-webhook`.
- Integração com **Mercado Pago**: Pix (`create-mp-pix-payment`) e cartão (`create-mp-card-payment`), webhook `mp-webhook`, backup por polling `check-mp-payment-status`.
- Correção crítica: **webhooks com `verify_jwt=false`** (o Supabase respondia 401 antes do código — quebrava Stripe/MP).
- Guarda de reserva compartilhada (`booking_guard.ts`) + rateio financeiro (`financial.ts`) + ledger financeiro evoluindo `v2→v8`.
- **Jul/2026 — Auditoria Mercado Pago** (`docs/auditoria-mercado-pago-2026-07.md`): migração para **Checkout Transparente** (Secure Fields + Device ID + 3DS), elevando o Integration Quality Score.

### Inventário, recorrência e vendas manuais
- Slots por data/hora (`experience_slots`) com decremento atômico de vagas.
- Regras de recorrência (`experience_recurrence_rules`) que materializam slots (cron diário).
- Vendas manuais (`manual_sales`) com sincronização de inventário e confirmação ao cliente.
- Curadoria/merge de experiências duplicadas e limpeza de nomes (com logs de auditoria).

### Cupons, gift cards e financeiro
- Sistema de cupons (`coupons`/`coupon_uses`) com escopo por categoria e contagem só quando pago.
- Gift cards (`gift_cards`) com preview/hold/refund; bridge unificando cupom+gift.
- Contabilidade no admin (`v_financial_ledger`, `financial_*`, anexos privados).

### Frete (Elarah em Casa)
- Kits físicos com checkout de endereço (`kit-checkout.js`).
- **Melhor Envio** via OAuth (`melhor-envio-connect/callback`) + `calculate-shipping` com refresh automático de token (`docs/frete-melhor-envio.md`).
- Roadmap de **etiqueta automática** documentado (`docs/frete-etiqueta-automatica-roadmap.md`).

### CRM, prospecção e crescimento
- Pipeline de prospects B2C e B2B (`prospects`, `b2b_prospects`) com dedup e promoção a fornecedor.
- **Prospect finder** via Google Places (cron semanal + sob demanda).
- Áreas/tarefas/KPIs de growth e rotina operacional semanal.

### Marketing, conteúdo e SEO
- Calendário editorial (`content_calendar`) e **calendário editorial junho/2026**.
- **12 landing pages SEO long-tail** (SP) publicadas (`docs/calendario-seo-longtail.md`).
- Campanhas sazonais: Dia das Mães, **Dia dos Namorados** (cluster com curadoria extensa), Despedidas, Aniversários, Singles Day, Eventos Corporativos.
- Programa de **captação/UGC `#fizelarah`** e kit de backlinks (`docs/captacao-loops-ugc.md`, `docs/kit-backlinks-sp.md`).

### Redes sociais
- Integração **Instagram/Meta** (OAuth + sync de posts/insights, `sync-instagram` 4×/dia, `refresh-tokens` mensal).
- Migração para **login direto Instagram** (`INSTAGRAM_APP_ID/SECRET`).
- Dashboards e **análise estratégica de 10 seções** no admin; import via Windsor.ai (CSV).

### Inteligência (agentes)
- **Agente CEO** e **Agente de Eventos IA** (client-side, regras).
- **Agente de Diagnóstico IA** (`analytics-insights`) — cron diário, modo regras (grátis) ou Claude (`docs/agente-diagnostico-ia.md`).

### App nativo e PWA
- Site tornado **instalável como PWA** (iPhone/Android).
- App **Capacitor** empacotando o site; build iOS na nuvem via **Codemagic** com assinatura persistente (`CERT_KEY`) e submissão automática ao **TestFlight**.
- Rastreamento de "aberturas do app" no analytics/painel CEO.
- **Auditoria de App Store** e checklist de privacidade (`docs/app-store-*`).

### Infra, segurança e operação
- **Backup diário criptografado** do banco via GitHub Actions.
- Exclusão de conta (**LGPD/Apple**) via `delete-account`.
- Recuperação de senha por **Resend** (contornando o rate limit do e-mail nativo).
- Carregamento resiliente do SDK Supabase (local-first + retry) para redes hostis.

### Jul/2026 — Consolidação e migração
- **06–13/07/2026:** commits de consolidação (uploads) e ajustes finos (ex.: bug de scroll no admin, mensagem de venda manual dual-fornecedor).
- **14/07/2026:** criação **deste acervo de documentação** (`docs/projeto/`) para preservar o conhecimento antes da **migração definitiva das contas**.
