# 06 — Pendências

O que ainda precisa ser desenvolvido, corrigido ou melhorado — consolidado a partir dos roadmaps, auditorias e do estado do código em **14/07/2026**.

---

## 1. App iOS / App Store
Fonte: `docs/app-store-auditoria-final.md`, `docs/app-store-privacidade.md`.
- [ ] **Rodar um build limpo** e confirmar no Xcode/simulador de iPad — itens do Info.plist/privacidade só são verificáveis na build (o projeto iOS nativo não é versionado).
- [ ] Confirmar visualmente as telas no **simulador de iPad Air** (grid 3→2 colunas ≤1024px).
- [ ] Garantir provisioning profile válido e NodeJS 22 no build (bloqueador real citado na auditoria).
- [ ] Revisar a jornada de compra dentro do WebView (Pix inline + Checkout dentro do `allowNavigation`).

## 2. Mercado Pago — ativar Checkout Transparente
Fonte: `docs/auditoria-mercado-pago-2026-07.md`.
- [ ] **Fornecer e configurar `MP_PUBLIC_KEY`** (mesma conta do `MP_CARD_ACCESS_TOKEN`) nos secrets — **enquanto não for definida, o cartão continua no Checkout Pro** (redirect), não no transparente.
- [ ] Deploy de `get-mp-public-key`, `create-mp-card-payment`, `create-mp-pix-payment`, `mp-webhook`, `check-mp-payment-status` após configurar a public key.
- [ ] Validar colunas novas do banco usadas pelo fluxo de cartão (há retry sem elas, mas convém aplicar).

## 3. Frete — etiqueta automática (passo 2)
Fonte: `docs/frete-etiqueta-automatica-roadmap.md`. Status: **planejado** (a cotação já está no ar).
- [ ] Pré-requisitos do lado da fundadora: saldo na carteira Melhor Envio, dados completos do remetente, **reconectar com escopos ampliados** (`cart-write`, `shipping-checkout`, `shipping-generate`, `shipping-print`).
- [ ] Adicionar **peso por kit** para a etiqueta sair correta.
- [ ] Implementar o hook no `stripe-webhook` para inserir pedidos pagos no carrinho do Melhor Envio (modo "revisar e comprar").
- [ ] Admin: mostrar status da etiqueta + link para imprimir.

## 4. Integração social (Instagram)
- [ ] Alinhar a documentação: `SOCIAL_INTEGRATION_SETUP.md` descreve login via **Meta**, mas o código migrou para **login direto Instagram** (`INSTAGRAM_APP_ID/SECRET`); `refresh-tokens` ainda usa `META_APP_ID/SECRET`. Padronizar/documentar.
- [ ] Extensão prevista para TikTok/LinkedIn (o schema já prevê múltiplos providers) — ainda não implementada no sync.

## 5. Admin redesenhado (`admin-novo.html`)
- [ ] `admin-novo.html` (com Chart.js) é uma **versão de próxima geração em progresso**, sem `admin-novo.js` dedicado — concluir ou descontinuar.

## 6. Migração de contas (motivo desta consolidação)
- [ ] Executar o checklist de migração (ver [10 — Manual §8](./10-Manual-do-Desenvolvedor.md) e [09 — Segurança §3](./09-Seguranca.md)): recriar secrets em Supabase/GitHub/Codemagic, reconectar OAuth (frete + social), atualizar `supabase-client.js`.

## 7. Dívidas técnicas / melhorias sugeridas
- [ ] **Tamanho dos bundles:** `admin.js` (~1MB) e `script.js` (276KB) são monolíticos — considerar modularização/lazy-load se o tempo de carga incomodar.
- [ ] **Migrações de banco manuais:** ~150 scripts aplicados à mão no SQL Editor; avaliar adoção de `supabase migrations` versionadas para reprodutibilidade.
- [ ] **Dados sociais em localStorage:** `admin-social.js` guarda posts em `localStorage` — não persiste entre dispositivos; avaliar mover para o banco.
- [ ] **Testes:** só há teste unitário em `_shared/booking_guard.test.ts` — ampliar cobertura de webhooks e funções financeiras.
- [ ] **Pipeline Android:** só o iOS tem CI (Codemagic); Android depende de build manual.
- [ ] **Documentar** a fonte exata da branch de GitHub Pages (qual branch serve o site) e automatizar o `.deploy-trigger` se necessário.

> Itens de marketing/conteúdo em andamento (calendário editorial, SEO long-tail, captação UGC, backlinks) estão nos respectivos guias em `docs/` e não são pendências de engenharia.
