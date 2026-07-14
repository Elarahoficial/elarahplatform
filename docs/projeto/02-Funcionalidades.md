# 02 — Funcionalidades Desenvolvidas

Lista de todas as funcionalidades implementadas até **14/07/2026**, agrupadas por área.

---

## A. Site público — descoberta e conversão

| Funcionalidade | Onde | O que faz |
|---|---|---|
| **Home / catálogo** | `index.html` + `script.js` | Vitrine de experiências com cards, abas de categoria, seção By Elarah, busca, filtro de datas. |
| **Detalhe da experiência** | `experiencia.html` | Página de uma experiência com datas/slots, seleção de quantidade e checkout. |
| **Navegação por categoria** | `categoria.html` + `categoria.js` | Lista experiências filtradas por categoria e data; esconde originais marcados `hide_from_categorias`. |
| **Filtro de datas** | `date-filter.js` | Chips "Este fim de semana", "Próxima semana", "Próximo mês" + intervalo customizado De/Até. |
| **Menu Explorar / Busca** | `explorar-menu.js`, `header-nav.js` | Mega-menu de exploração e busca; header mobile compartilhado. |
| **Como funciona** | `como-funciona.html` | Página explicativa do funcionamento. |
| **Blog / guias** | `blog.html` | Índice de conteúdo editorial. |

## B. Presentear e gift cards

| Funcionalidade | Onde | O que faz |
|---|---|---|
| **Presentear / vale-presente** | `presentear.html` + `presentear.js` | Fluxo de dar experiências de presente. |
| **Gift cards** | Edge `create-*-payment` (mode gift_card) + `redeem-gift-card` | Compra de gift card (Pix/cartão), geração de código, validação/preview e resgate no checkout. |
| **Cupons de desconto** | `script.js` (validação) + tabela `coupons` | Cupom por valor/percentual, com limites de uso, escopo por categoria e contagem só quando pago. |

## C. Verticais / linhas de produto

| Funcionalidade | Onde | O que faz |
|---|---|---|
| **Elarah em Casa (kits)** | `elarah-em-casa.html` + `elarah-em-casa.js` + `kit-checkout.js` | Kits físicos com entrega: modal de endereço, cálculo de frete (Correios via Melhor Envio) e checkout com objeto `shipping`. |
| **Elarah Kids** | `elarah-kids.html` + `elarah-kids.js` | Vertical de experiências infantis. |
| **Grupos** | `grupos.html` | Experiências para grupos. |
| **By Elarah (Originais)** | `byelarah.html`, `byelarah-parceiros.html` + `byelarah-data.js` | Experiências próprias curadas + formulário de interesse. |
| **Eventos corporativos** | `eventos-corporativos.html` | Vertical B2B de eventos. |

## D. Campanhas sazonais

- **Dia das Mães** — `dia-das-maes.html` (+ JS/CSS).
- **Dia dos Namorados** — cluster `dia-dos-namorados.html`, `-detalhe.html`, `-presentear.html`, `-todas.html` (+ JS/CSS) com curadoria extensa (tabelas `campaign_*`).
- **Despedidas** (`despedidas.html`), **Aniversários** (`aniversarios.html`), **Singles Day** (`singles-day.html`).

## E. SEO / conteúdo (long-tail SP)
Páginas de intenção de busca em São Paulo: `aula-de-ceramica-em-sp`, `aula-de-coquetelaria-em-sp`, `aula-de-pintura-em-sp`, `o-que-fazer-em-sp-a-noite/com-chuva/final-de-semana`, `date-diferente-em-sp`, `despedida-de-solteira-em-sp`, `atividades-com-amigas-em-sp`, `programa-em-sp-sozinha`, `presente-de-experiencia-em-sp`, `joias.html`, `perfumes.html`, entre outras. (12 posts pilar+cluster — ver `docs/calendario-seo-longtail.md`.)

## F. Conta e transacional

| Funcionalidade | Onde | O que faz |
|---|---|---|
| **Minha conta** | `conta.html` + `conta.js` | Dashboard do cliente: reservas, perfil, gift cards; guarda de auth. |
| **Login / cadastro / OAuth** | `auth.js` | Email+senha, Google, Apple. |
| **Recuperação de senha** | `reset-password.html` + Edge `send-password-recovery` | E-mail de reset via Resend (contorna o rate limit do e-mail nativo do Supabase); link independente de navegador. |
| **Sucesso / cancelamento de pagamento** | `success.html`, `cancel.html` | Páginas de retorno do checkout. |
| **Avaliação pós-experiência** | `avaliar.html` + tabela `reviews` | Cliente avalia a experiência; pedido de review enviado por cron. |
| **Cancelamento** | `cancelamento.html` | Política/solicitação de cancelamento. |
| **Exclusão de conta (LGPD/Apple)** | Edge `delete-account` | Anonimiza registros financeiros, remove PII e apaga o usuário. |
| **Páginas legais** | `sobre.html`, `termos.html`, `privacidade.html`, `seguranca.html` | Institucionais/legais. |

## G. Parceiros (lado da oferta)

| Funcionalidade | Onde | O que faz |
|---|---|---|
| **Seja parceiro** | `oferecer.html` + `oferecer.js` | Onboarding de parceiro (`becomePartner`). |
| **Conectar frete** | `conectar-frete.html` | Inicia o OAuth do Melhor Envio para habilitar frete real. |
| **Rateio multi-fornecedor** | `financial.ts` + `experience_suppliers` | Divide o valor entre N fornecedores (percentual/fixo) + comissão Elarah. |

## H. Pagamentos (backend)

- **Pix (Mercado Pago)** — `create-mp-pix-payment` (QR inline + copia-e-cola, exige CPF).
- **Cartão (Mercado Pago)** — `create-mp-card-payment`: Checkout Transparente (Secure Fields + Device ID + 3-D Secure) com fallback para Checkout Pro.
- **Cartão / gift card (Stripe)** — `create-checkout-session` (até 12× com fallback à vista).
- **Webhooks** — `mp-webhook` e `stripe-webhook` reconciliam pagamentos de forma idempotente.
- **Backup por polling** — `check-mp-payment-status` ("Já paguei, verificar").
- **Guarda de reserva** — `booking_guard.ts`: valida vagas/cutoff, segura cupom/gift card, decrementa slot atomicamente, faz rollback.

## I. E-mails transacionais (Resend)
Confirmação de reserva, gift card, recuperação de senha, notificação de venda ao admin, mensagens fornecedor↔cliente (fluxos dedicados BaresSp/Lado B), confirmação de venda manual, reenvio de confirmação, digest diário de diagnóstico, newsletter e pedidos de review.

## J. Frete (Melhor Envio)
- `calculate-shipping` — cotação PAC/SEDEX (preço real se conectado; estimativa regional senão).
- `melhor-envio-connect` / `melhor-envio-callback` — OAuth com refresh automático de token.
- **Roadmap:** etiqueta automática (ver `docs/frete-etiqueta-automatica-roadmap.md`).

---

## K. Painel administrativo (`admin.html` + `admin.js`)

SPA de abas. Marcador de versão em código: **Admin v.69**. Abas/painéis:

| Aba | Função |
|---|---|
| **Visão geral** | Dashboard com tiles (usuários, parceiros, compras, experiências, gift cards ativos). |
| **Painel semanal** | Performance da semana. |
| **Rotina** | Checklist operacional (tabelas `routine_*`). |
| **Conteúdo / Calendário Editorial** | Motor de conteúdo e calendário editorial (`content_calendar`). |
| **Captação** | Aquisição de clientes (`growth_*`). |
| **Usuários / Interesses** | Base de usuários e submissões de interesse. |
| **Parceiros / Fornecedores** | Gestão de parceiros e diretório de fornecedores. |
| **Compras / Pendentes / Pós-compra** | Gestão de reservas, pendências e follow-up pós-evento. |
| **Eventos / Locais p/ eventos** | Gestão de eventos e diretório de locais (`event_venues`). |
| **Prospecção / Prospecção B2B** | Pipeline de leads (Google Maps) B2C e B2B (`prospects`, `b2b_prospects`). |
| **Experiências / Experiências foco** | CRUD de experiências e destaques. |
| **By Elarah** | CRUD de originais + submissões de interesse. |
| **Campanhas** | Gestão de campanhas sazonais. |
| **Gift Cards / Cupons** | Gestão de vale-presentes e códigos de desconto. |
| **Contabilidade** | Financeiro (`v_financial_ledger`, `financial_*`, anexos privados). |
| **Redes Sociais** | Dashboard de análise social (`admin-social.js`, `admin-social-analysis.js`). |
| **Analytics** | Dashboards + Agente de Eventos IA (`admin-eventos.js`). |
| **Diagnóstico IA** | Diagnóstico autônomo diário "Onde estamos pecando" (`admin-insights.js`). |
| **Novidades (Broadcast)** | E-mail em massa (`admin-broadcast.js`). |
| **CEO** | Agente CEO com plano estratégico (`admin-ceo.js`). |
| **Modo Feed** | Abre `feed.html` (visualizador contínuo/gravação). |

### Módulos de IA do admin (client-side, baseados em regras)
- **Agente CEO** (`admin-ceo.js`) — agrega receita/vendas/tráfego/ocupação vs. semana anterior e sugere plano de 2 semanas.
- **Agente de Eventos IA** (`admin-eventos.js`) — best sellers, categorias mais desejadas, sazonalidade, ocupação de turmas, sugestões de parceiros.
- **Diagnóstico IA** (`admin-insights.js` + Edge `analytics-insights`) — diagnóstico diário autônomo (modo regras grátis ou IA/Claude), armazenado em `analytics_insights_runs` e enviado por e-mail.
- **Análise de prospecção** (`admin-prospect-analise.js`) — taxa de resposta, funil, efeito de follow-up.
- **Prospect finder** (`admin-prospect-finder.js` + Edge) — busca leads via Google Places (semanal ou sob demanda).
- **Análise social estratégica** (`admin-social-analysis.js`) — relatório de 10 seções sobre o Instagram, exportável.

### `admin-novo.html`
Versão redesenhada do admin ("Admin — Elarah", com Chart.js), em progresso — dashboard de próxima geração.

---

## L. Automações (pg_cron)
- Diagnóstico IA diário · Pedido de reviews diário · Materialização de recorrência diária · Newsletter diária · Sync do Instagram 4×/dia · Refresh de tokens sociais mensal · Prospect finder semanal · Limpeza de estados OAuth diária.
(Ver [12 — Banco de Dados](./12-Banco-de-Dados.md) para agendamentos exatos.)

## M. Inventário e recorrência
- Slots por data/hora (`experience_slots`) com vagas e decremento/incremento atômico.
- Regras de recorrência (`experience_recurrence_rules`) que materializam slots automaticamente.
- Vendas manuais (`manual_sales`) que sincronizam inventário e podem disparar confirmação ao cliente.

## N. PWA e app nativo
- Site instalável como PWA (iPhone/Android) via `manifest.webmanifest`.
- App Capacitor iOS/Android empacotando o site; rastreio de "aberturas do app" no analytics/painel CEO.
