# Elarah — Documento de Transição / Handoff Completo

> **Objetivo:** dar a qualquer nova IA (ou dev) todo o contexto necessário para
> continuar o projeto **exatamente de onde parou**, sem perder conhecimento.
>
> **Como este documento foi montado:** a partir do **código-fonte deste
> repositório** (branch de produção) + do **histórico desta sessão de trabalho**
> (App Store iOS, migração de pagamentos Mercado Pago, auditoria de 3DS, bug do
> rollback, analytics, auth). Última atualização: **2026-07** (ver git log para a data exata).
>
> **⚠️ Limitação honesta:** este arquivo cobre o que está no **código** e no que
> foi discutido **nesta thread**. Podem existir **outras conversas fixadas** com
> contexto adicional (estratégia comercial, titularidade de contas, etc.). Antes
> de assumir 100% do projeto, revise também: os arquivos em `docs/` (listados no
> fim), e o **PR #456 "auditoria completa de infraestrutura e titularidade"**.

---

## 1. Visão geral da empresa e do projeto

- **Empresa:** **Elarah** — marketplace de **experiências criativas presenciais em São Paulo** (cerâmica, tufting, gastronomia, perfumaria, velas, pintura, etc.) + **gift cards / presentes**. Curadoria (experiências escolhidas a dedo), não é catálogo aberto.
- **Proposta:** "sair da tela e viver algo novo" / "Offline is a feeling". Vende **serviços/experiências do mundo real** (não conteúdo digital → **fora do IAP da Apple**).
- **Dona / operadora:** Maria Eduarda Vitiello Teixeira ("Duda"). Contatos vistos no projeto: `mafeerquiaga@gmail.com`, `dudavitiello@icloud.com`, `contato.elarah@gmail.com`. Opera via **CNPJ**.
- **Domínio:** `https://elarah.com.br`.
- **Modelo:** cliente descobre → vê detalhe → reserva slot (data/horário) → paga (Pix ou cartão) → recebe confirmação por e-mail. Há **repasse a fornecedores/parceiros** (a experiência pode ser de um parceiro; a Elarah fica com comissão).
- **App móvel:** o site empacotado como app **iOS/Android** via Capacitor (WebView). Em **revisão na App Store** (submetido nesta sessão).
- **Natureza do time:** operação enxuta; a Duda **não é desenvolvedora** e **não tem Mac** — tudo é feito por navegador + CI na nuvem. Isso molda MUITAS decisões técnicas (ver seção 7).

---

## 2. Arquitetura e tecnologias

**Stack (resumo):** site estático (HTML/CSS/JS vanilla) no **GitHub Pages** + backend **Supabase** (Auth + Postgres + Edge Functions Deno) + wrapper **Capacitor** (iOS/Android) buildado no **Codemagic**. Pagamentos por **Mercado Pago** (Pix + cartão) e **Stripe** (legado, sendo aposentado). E-mails via **Resend**. Frete via **Melhor Envio**. Social/anúncios via **Meta/Instagram** + **Windsor.ai**.

### Frontend (site)
- **HTML/CSS/JavaScript vanilla** (sem framework, sem build de bundler no sentido tradicional). ~100+ páginas `.html` na raiz.
- Arquivos-chave na raiz: `index.html` (home), `categoria.html`, `experiencia.html` (detalhe), `presentear.html` (gift cards), `conta.html` (perfil/compras/exclusão de conta), `success.html`, `reset-password.html`, `grupos.html`, `oferecer.html` (ser parceiro), `sobre.html`, etc.
- JS principal: **`script.js`** (~250KB — checkout, modais, Mercado Pago, Pix, cartão), `auth.js` (login/cadastro/reset), `conta.js`, `categoria.js`, `presentear.js`, `experiences-data.js` (dados + FALLBACK_SEEDS), `analytics.js`, `supabase-client.js` / `supabase-loader.js` (carregam o SDK do Supabase, expõem `window.ElarahSupabase.waitClient()`), `capacitor-bridge.js` (só no app).
- CSS: `styles.css` (principal), + CSS por página.
- **Cache-busting:** via query `?v=N` nos `<script>`/`<link>` (ex.: `script.js?v=75`). Ao alterar um JS/CSS, **bumpar o número**.
- **Fonte de dados de experiências:** `experiences-data.js` busca do Supabase (tabela `experiences`) e, se falhar/vazio, usa **`FALLBACK_SEEDS`** embutido (imagens locais em `assets/experiences/`). Isso mantém o site funcional offline/sem banco.

### Backend (Supabase)
- **Projeto Supabase ref:** `nwijxjmenbfyehvscogs` (URL: `https://nwijxjmenbfyehvscogs.supabase.co`).
- **Auth:** e-mail/senha + OAuth (Apple/Google no código). `flowType: 'implicit'`, `detectSessionInUrl: true`, `persistSession: true` (ver `supabase-client.js`).
- **Postgres:** tabelas principais (ver seção 5).
- **Edge Functions (Deno):** ver lista completa na seção 6.
- **RPCs (funções SQL):** `decrement_experience_vagas`/`decrement_slot_vagas`, `increment_experience_vagas`/`increment_slot_vagas`, `refund_gift_card`, `refund_coupon`, e outras (referenciadas em `booking_guard.ts`). O SQL vive em `sql/` (não versionado inteiramente aqui; rodado manualmente no Supabase Editor).

### App móvel (Capacitor)
- **appId:** `com.elarah.app`. **appName:** Elarah. `webDir: www`.
- É o **site dentro de uma WebView** + `capacitor-bridge.js` (botão voltar Android, abrir links externos, esconder splash, share).
- **Plugins usados:** `@capacitor/app`, `@capacitor/browser`, `@capacitor/share`, `@capacitor/splash-screen`, `@capacitor/status-bar`. **Push removido** (não usado — evitava rejeição na App Store).
- **`server.allowNavigation`** inclui `*.mercadopago.com*`, `*.mercadolibre/livre*`, `elarah.com.br` → o checkout do Mercado Pago abre **DENTRO** do app (sem jogar pro Safari).
- **Fonte Capacitor versionada no git** (reconstruída nesta sessão): `app/package.json`, `app/capacitor.config.json`, `app/scripts/copy-web.mjs`, `app/native-overrides/PrivacyInfo.xcprivacy`, `app/assets-src/icon.png`, `app/www/` (cópia do site). O **projeto iOS nativo** (`App.xcodeproj`, `Podfile`, `Info.plist`) **NÃO** é versionado — é **regenerado** pelo Codemagic a cada build (`cap add ios`).

### CI/Build
- **Codemagic** (`codemagic.yaml` na **raiz**): builda o app iOS na nuvem (Mac deles). Regenera o projeto nativo, aplica Info.plist/privacidade/ícone, assina e sobe pro TestFlight. Ver seção 6 e 8.
- **GitHub Actions:** `deploy-edge-functions.yml` (deploya as Edge Functions ao push na base) + GitHub Pages (deploya o site).

---

## 3. Estrutura do sistema (repositório)

```
/ (raiz)                → site (GitHub Pages): *.html, script.js, styles.css, auth.js, etc.
  /assets               → imagens (experiências, logos, PWA icons em assets/pwa/)
  /scripts              → build-og-pages.mjs, build-experiences-sitemap.mjs
  /supabase/functions   → Edge Functions (Deno) + _shared/ (libs compartilhadas)
  /sql (no Supabase)    → migrations/funcs RPC (rodadas manualmente)
  /docs                 → documentação (ver índice na seção 12)
  /app                  → Capacitor
    /www                → cópia do site (gerada por copy-web.mjs) + capacitor-bridge.js
    /ios, /android      → projetos nativos (regenerados no CI; parcialmente versionados)
    /scripts/copy-web.mjs → espelha raiz → app/www, injeta capacitor-bridge, exclui admin/*
    /native-overrides/PrivacyInfo.xcprivacy
    /assets-src/icon.png  → ícone oficial 1024x1024 (laranja)
    package.json, capacitor.config.json
  codemagic.yaml        → CI do app iOS (na RAIZ — o Codemagic lê daqui)
```

### Painéis administrativos
- `admin.html` + `admin*.js` (admin, CEO, insights, prospect, social, broadcast, eventos) — **não** entram no app (`copy-web` exclui `admin*`).

---

## 4. Principais funcionalidades

- **Descoberta:** home (hero em vídeo + "Elarah Originals"), busca, categorias, filtros (categoria/bairro/quando).
- **Experiência:** página de detalhe com foto, seletor de **data + horário (slots)**, descrição, preço, parcelamento "até 12x", botão Reservar.
- **Reserva/Checkout:** modal com dados do cliente (nome, e-mail, telefone, CPF), quantidade/participantes, cupom/gift card.
- **Pagamento:** **Pix** (QR inline) ou **Cartão** (Checkout Transparente Mercado Pago, com 3DS). Repasse de **taxa do cartão** ao cliente (`CARD_FEE_PERCENT=5.24`).
- **Gift cards / Presentear:** comprar gift card (valor livre) ou presentear experiência; resgate via `redeem-gift-card`.
- **Conta:** perfil, histórico de compras, favoritos, **exclusão de conta** (LGPD + Apple 5.1.1).
- **Grupos:** aniversário/corporativo/despedida (contato via WhatsApp).
- **Ser Parceiro:** `oferecer.html` (fornecedores oferecem experiências).
- **E-mails transacionais:** confirmação de reserva, gift card, recuperação de senha, aviso de venda ao fornecedor — todos via **Resend**.
- **Frete/etiqueta:** Melhor Envio (para produtos físicos "By Elarah"/kits).
- **Social:** sync Instagram, métricas, OAuth Meta (via `social_*` functions + Windsor).
- **Analytics próprio:** tabela `analytics_events` + função `analytics-insights` (funil, diagnóstico "onde estamos pecando").

---

## 5. Fluxos de negócio e regras implementadas

### Fluxo de pagamento (cartão — Checkout Transparente) — o mais crítico
1. **Front** (`script.js`): ao abrir o checkout, faz **warm-up** do MercadoPago.js (SDK + public key via `get-mp-public-key`) → isso já dispara o **security.js/fingerprint** que popula `window.MP_DEVICE_SESSION_ID` (**Device ID**).
2. Cliente digita o cartão nos **Secure Fields** (SDK). O front espera o Device ID (`waitForDeviceId`) **antes** de pagar (elimina race de device_id vazio).
3. Front chama **`create-mp-card-payment`** com `token`, `payment_method_id`, `issuer_id`, `installments`, `device_id`, dados do pagador, etc.
4. **`create-mp-card-payment`** (Edge Function):
   - **Guard** (`reserveExperienceSlot` em `booking_guard.ts`): valida experiência/slot, **reserva a vaga** (decrementa estoque via RPC), aplica cupom/gift card.
   - Aplica **taxa do cartão** (`applyCardFee`, `CARD_FEE_PERCENT`) → `finalChargeCents`.
   - Chama **`/v1/payments`** (Mercado Pago) via `createCardPayment` (`mercadopago.ts`) com `three_d_secure_mode` (padrão **"optional"**, controlável por `MP_CARD_3DS_MODE`), Device ID no header `X-meli-session-id`, payer + `additional_info` completos.
   - Insere `booking` com `status: 'pending'`. **Não** marca "pago" aqui (mesmo se aprovado) — deixa pro webhook (evita e-mail duplicado, reaproveita idempotência).
   - Se a MP retornar **3DS** (`three_ds_info`), devolve `three_ds` ao front, que **renderiza o desafio** (`renderThreeDsChallenge` → POST `creq` num iframe) + inicia polling.
   - Se **recusado/cancelado** → chama `rollback()` (libera a vaga) → devolve **200 `{rejected, status_detail}`**.
5. **Confirmação:** vem pelo **`mp-webhook`** (Mercado Pago notifica) → `getPayment` (tenta token principal → **token do cartão**) → `markBookingAsPaid` (status `pago`) → dispara e-mail.
6. **Backup:** front faz polling que (a) chama `check-mp-payment-status` e (b) lê `bookings.status` direto do banco. Redireciona pra `success.html` quando `pago`.

### Fluxo Pix
- `create-mp-pix-payment` cria pagamento Pix (`/v1/payments`) na conta `MERCADO_PAGO_ACCESS_TOKEN` → QR inline no modal → polling lê `bookings.status` → webhook confirma.

### Regras de estoque/vagas (`booking_guard.ts`)
- Decremento atômico de vagas via RPC (`decrement_slot_vagas`/`decrement_experience_vagas`), com **3 camadas** (RPC com quantidade → loop legado → pular estoque em último caso pra não travar checkout).
- **`rollback()`**: devolve as vagas efetivamente decrementadas + faz refund de cupom/gift card. Chamado em recusa/cancelamento/erro.
- **Cupom cobre 100%:** pula a MP, cria booking `pago` direto.

### Repasse financeiro (`financial.ts` + `experience_suppliers`)
- Cada experiência pode ter fornecedores com `share_type`/`share_value`; a Elarah calcula **repasse** vs **comissão** e grava no booking (`valor_repasse_centavos`, `valor_comissao_centavos`, `repasses`).

### Tabelas principais (Postgres)
`bookings`, `experiences`, `experience_slots`, `experience_suppliers`, `gift_cards`, `coupons` (novo) / gift_cards legado, `profiles`, `interesses`, `manual_sales`, `analytics_events`, `analytics_insights_runs`, `melhor_envio_tokens`, `social_accounts`, `social_posts`, `social_post_metrics`, `social_oauth_states`, `social_sync_runs`.

---

## 6. Integrações (detalhadas)

### Mercado Pago (pagamentos — PRINCIPAL)
- **Conta:** CNPJ da Elarah. Cartão migrado pro Checkout **Transparente** (Secure Fields + Device ID + 3DS). Pix na conta principal.
- **Edge Functions:** `create-mp-card-payment`, `create-mp-pix-payment`, `mp-webhook`, `check-mp-payment-status`, `get-mp-public-key`. Lib: `_shared/mercadopago.ts`.
- **3DS:** implementado ponta a ponta. Modo atual **"optional"** (`MP_CARD_3DS_MODE`). **Discussão em aberto:** testar **"mandatory"** para reduzir `cc_rejected_high_risk` (ver seções 8 e 11).
- **Webhook URL:** `https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/mp-webhook`. Assinatura HMAC verificada com múltiplos segredos (principal → cartão → legado).

### Supabase
- Auth + Postgres + Edge Functions + Storage. Projeto `nwijxjmenbfyehvscogs`, região `sa-east-1`.
- **Deploy das functions:** `.github/workflows/deploy-edge-functions.yml` (lista fixa de funções; usa a Supabase CLI). Algumas com `--no-verify-jwt` (endpoints públicos: `delete-account`, `analytics-insights`, `send-password-recovery`, `mp-webhook`, etc.).

### Hospedagem web
- **GitHub Pages** (site servido da branch base, domínio `elarah.com.br` via CNAME). **⚠️ Nota:** a Duda mencionou "Vercel" na lista dela; no repositório o que se vê é **GitHub Pages**. Um novo Claude deve **confirmar** se há algo em Vercel (não evidente aqui).

### Codemagic (build iOS)
- `codemagic.yaml` na raiz. Workflow **"Elarah iOS"** (`ios-elarah`), `instance_type: mac_mini_m2`, `node: 22`, integração App Store Connect chamada **`ElarahASC`**.
- **Passos:** `npm install` → `npm run build` (copy-web) → **`rm -rf ios && npx cap add ios && npx cap sync ios`** (regenera nativo) → aplica Info.plist (NSPhotoLibrary/NSCamera usage, `ITSAppUsesNonExemptEncryption=false`, **CFBundleVersion = timestamp**) → **auto-revoga certificados de distribuição órfãos** → assina (chave persistente opcional em `CERT_KEY`) → `build-ipa` (workspace) → publica no TestFlight.

### Apple / App Store Connect
- **Bundle ID:** `com.elarah.app`. App **em revisão** (submetido nesta sessão), versão **1.0**.
- Corrigidos os 2 motivos de reprovação: **exclusão de conta** (5.1.1) e **iPad responsivo** (4.0).
- Conta de teste do revisor: `dudavitiello+appreview@icloud.com` (senha definida pela Duda). Notas de revisão em inglês foram fornecidas.

### Stripe (legado)
- `create-checkout-session` + `stripe-webhook`. **Sendo aposentado** (cartão migrou pro Mercado Pago). **Tem o mesmo bug de `.rpc().catch()`** do rollback (NÃO corrigido — decisão de deixar pra depois, ver seção 8).

### Resend (e-mails)
- `_shared/email.ts` (`sendEmail`, templates). Usado por confirmação de reserva, gift card, recuperação de senha, aviso ao fornecedor.

### Melhor Envio (frete/etiqueta)
- `melhor-envio-connect`, `melhor-envio-callback`, `calculate-shipping`, `refresh-tokens`. Lib `_shared/melhor_envio.ts`, `_shared/shipping.ts`. Tokens em `melhor_envio_tokens`.

### Meta/Instagram + Windsor.ai (social/ads)
- `oauth-start`, `oauth-callback`, `sync-instagram`. Libs `_shared/social_*`. Windsor MCP disponível para ler dados de anúncios/analytics e escrever (boost de post, criar campanha, etc.). Ver `docs/windsor-import.md`.

### Lista COMPLETA de Edge Functions (24)
`admin-account-access`, `analytics-insights`, `calculate-shipping`, `check-mp-payment-status`, `create-checkout-session` (Stripe), `create-mp-card-payment`, `create-mp-pix-payment`, `delete-account`, `get-mp-public-key`, `melhor-envio-callback`, `melhor-envio-connect`, `mp-webhook`, `notify-manual-sale`, `oauth-callback`, `oauth-start`, `og-experience`, `redeem-gift-card`, `refresh-tokens`, `resend-booking-confirmation`, `send-manual-sale-confirmation`, `send-password-recovery`, `send-supplier-customer-message`, `stripe-webhook`, `sync-instagram`.

---

## 7. Decisões técnicas e motivos

- **Site vanilla + GitHub Pages:** simplicidade, custo zero de hospedagem, deploy por push. Sem framework para reduzir complexidade (time não-dev).
- **App = WebView Capacitor (não React Native):** reaproveita 100% do site; uma base de código só. `capacitor-bridge.js` melhora a experiência nativa sem duplicar lógica.
- **`allowNavigation` do Mercado Pago:** manter o checkout DENTRO do app (Apple exige jornada in-app; evita Safari).
- **Projeto iOS nativo NÃO versionado / regenerado no CI:** decisão desta sessão — antes o projeto vivia só no cache do Codemagic (frágil). Agora `cap add ios` regenera tudo a cada build a partir da fonte Capacitor no git → **determinístico**.
- **CFBundleVersion = timestamp:** garante número de build único (a Apple recusa repetidos) sem controle manual.
- **Auto-revogar certificados de distribuição órfãos no CI:** a conta não tem Mac; certificados criados em builds antigos eram inúteis (chave privada sumia) e estouravam o limite da Apple (erro 409). O build limpa sozinho.
- **Checkout Transparente + Device ID + 3DS:** recomendação oficial do Mercado Pago para **maximizar aprovação** e reduzir fraude. Device ID e Secure Fields eram pendências obrigatórias da "Qualidade da Integração".
- **Booking sempre `pending` na criação (mesmo aprovado); confirmação só pelo webhook:** idempotência + evita e-mail duplicado; mesmo fluxo do Pix.
- **`FALLBACK_SEEDS` no `experiences-data.js`:** o site nunca fica vazio se o Supabase falhar.
- **`waitClient()` no Supabase loader:** o SDK carrega assíncrono; ler `window.supabaseClient` cedo demais dava "Não foi possível carregar o Supabase". `waitClient` espera o evento de pronto.
- **Recuperação de senha via Edge Function + Resend (não o e-mail nativo do Supabase):** o e-mail nativo tem rate limit agressivo e não entregava a clientes reais. `send-password-recovery` gera o link server-side (`generateLink`) e manda pelo Resend. **Link usa `token_hash` + `verifyOtp`** (não o redirect do Supabase) → funciona em qualquer navegador/aparelho (inclusive quando o pedido sai do app e o link abre no Safari).
- **`safeRpc()` no `booking_guard.ts`:** o builder do `supabase.rpc()` **não tem `.catch()`** → usá-lo estourava `TypeError` no rollback (500 + vaga não liberada). `safeRpc` faz o await seguro.

---

## 8. Problemas enfrentados, soluções e pendências

### ✅ Resolvidos nesta sessão
| Problema | Solução |
|---|---|
| App iOS não buildava (projeto nativo não estava no git, só no cache do Codemagic) | Reconstruída a fonte Capacitor no git; CI regenera o projeto (`cap add ios`) |
| `npm run build` "Missing script" | Criado `app/package.json` + `copy-web.mjs` |
| Upload TestFlight: "build number já usado" | `CFBundleVersion = date +%s` no CI |
| Assinatura: erro 409 "already have a current Distribution certificate" | CI auto-revoga certificados de distribuição órfãos antes de assinar |
| `app/www` desatualizado (sem exclusão de conta / Safe Area) | `copy-web` re-sincroniza raiz → www |
| App Store: reprovado 5.1.1 (exclusão de conta) | Função `delete-account` + UI em `conta.html`/`conta.js` (digitar "EXCLUIR") |
| App Store: reprovado 4.0 (iPad não otimizado) | CSS responsivo + Safe Area + `viewport-fit=cover` em todas as páginas |
| Ícone genérico no build | Ícone laranja oficial 1024x1024 em `app/assets-src/icon.png` |
| Reset de senha "link inválido" | `token_hash` + `verifyOtp` (browser/device-independent) |
| Reset de senha "Não foi possível carregar o Supabase" | `waitClient()` na `reset-password.html` |
| Cartão recusado dava **500** + vaga não liberada | **`safeRpc()`** no `booking_guard.ts` (PR #461, mergeado) |
| Taxa do cartão não repassada / erro por vírgula "5,24" | `parseFeeEnv` (tolera vírgula/NaN), `CARD_FEE_PERCENT=5.24` |
| Analytics: funil "checkout→pago" subcontado | `analytics-insights` conta `paid.length` (bookings pagos reais) |
| 12x não aparecia em cards de categoria | Adicionado em `categoria.js`/`presentear.js` |

### 🟡 Pendências / decisões em aberto
1. **App Store:** aguardando revisão da Apple (submetido). Se voltar com pedido, responder no Resolution Center.
2. **3DS `mandatory`:** o Mercado Pago recomendou (chamado **WCS-42712**) para reduzir `cc_rejected_high_risk`. Pré-requisitos confirmados (Device ID=yes/len 231, transparente, fingerprint OK). **Decisão:** testar `MP_CARD_3DS_MODE=mandatory` (é **variável de ambiente**, sem deploy, reversível) — **quando a Duda autorizar**. Trade-off: força autenticação (leve atrito; recusa cartão sem 3DS). Confirmar antes que a conta CNPJ tem 3DS 2 habilitado.
3. **`check-mp-payment-status` sem fallback do token do cartão:** usa só `MERCADO_PAGO_ACCESS_TOKEN`. Se a conta do cartão for **diferente** da do Pix, esse **backup** (não o primário) não reconcilia cartão. **Impacto: NÃO causa recusa nem afeta aprovação** — só reduz resiliência se o webhook cair. **Adiado para próxima sprint** (decisão da Duda).
4. **Stripe legado (`create-checkout-session`):** tem o **mesmo bug** `.rpc().catch()` do rollback (não corrigido). Como o fluxo principal é Mercado Pago, **adiado**.
5. **Layout estilo Airbnb:** a Duda quer cards mais compactos/densos (achou "muito grande quando as fotos aparecem"). **Fazer DEPOIS da aprovação do app**, como update normal.
6. **Melhorias de conversão (não-urgentes):** experiências com views e sem venda (Mandala, Ourivesaria, Match & Movimento) — ajuste de preço/foto/texto (admin da Duda). Recuperação de Pix abandonado; SEO longtail; embaixadoras/UGC.

### ⚠️ Config a VALIDAR manualmente (não é código — ver seção 9)
- Segredos de webhook do Mercado Pago (painel MP) **= ** secrets no Supabase (o ponto mais crítico). Verificar nos **logs do `mp-webhook`** que não há `invalid_signature`/401.

---

## 9. Configurações e variáveis de ambiente (sem expor segredos)

> **Nunca commitar valores.** O `.gitignore` cobre `.env`, `.env.*`. Aqui só os **nomes** e o que são.

### Secrets das Edge Functions (Supabase → Settings → Edge Functions Secrets)
| Nome | O que é |
|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | access token da conta do **Pix** (CNPJ, `APP_USR-…`) |
| `MP_CARD_ACCESS_TOKEN` | access token da conta do **cartão** (CNPJ) — pode ser igual ao do Pix se mesma conta |
| `MP_CARD_PUBLIC_KEY` (ou `MP_PUBLIC_KEY` / `MERCADO_PAGO_PUBLIC_KEY`) | public key p/ o Transparente/Secure Fields |
| `MP_WEBHOOK_SECRET` (ou `MERCADO_PAGO_WEBHOOK_SECRET`) | segredo de assinatura do webhook (conta principal) |
| `MP_CARD_WEBHOOK_SECRET` | segredo do webhook da conta do cartão (se separada) |
| `MP_LEGACY_ACCESS_TOKEN` / `MP_LEGACY_WEBHOOK_SECRET` | rede de segurança da migração (opcional) |
| `MP_CARD_3DS_MODE` | `optional` (atual) / `mandatory` / `not_supported` |
| `CARD_FEE_PERCENT` | **`5.24`** (com **ponto**) — taxa repassada ao cliente |
| `CARD_FEE_FIXED_CENTS` | taxa fixa (0) |
| `PUBLIC_SITE_URL` | `https://elarah.com.br` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | providos pelo Supabase |
| `RESEND_API_KEY`, `ELARAH_FROM_EMAIL` | e-mails (Resend) |
| Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | legado |
| Melhor Envio / Meta / Windsor | tokens próprios (ver funções `melhor-envio-*`, `social_*`, `oauth-*`) |

### Codemagic (Environment variables / grupos)
- Integração App Store Connect: **`ElarahASC`** (chave de API da App Store Connect).
- `CERT_KEY` (opcional, grupo `elarah_signing`): chave privada de assinatura persistente. Se ausente, o CI gera uma nova a cada build (e auto-revoga órfãos). Vars: `BUNDLE_ID=com.elarah.app`, `XCODE_WORKSPACE=app/ios/App/App.xcworkspace`, etc.

### Frontend (valores públicos, no código)
- **Supabase URL** e **anon key** ficam no código do site (por design — anon key é pública). Projeto `nwijxjmenbfyehvscogs`.

### Credenciais que precisam existir / recriar (sem segredos)
- Conta **Apple Developer** + app no App Store Connect (Bundle `com.elarah.app`) + integração `ElarahASC` no Codemagic.
- Conta **Mercado Pago CNPJ** com webhook configurado (URL acima, evento payment) + 3DS 2 habilitado.
- Projeto **Supabase** `nwijxjmenbfyehvscogs`.
- **Resend** (domínio verificado p/ enviar de `@elarah.com.br`).
- **Melhor Envio**, **Meta/Instagram app**, **Windsor.ai**.
- Ver **PR #456** (auditoria de infraestrutura e titularidade) para o plano de transferência de contas.

---

## 10. Git, branches e deploy

- **Branch base / produção:** **`claude/create-elarah-homepage-VsE5i`** — é a que deploya (GitHub Pages + Edge Functions). Tudo que entra aqui vai pro ar.
- **Branch de desenvolvimento (desta sessão):** `claude/stoic-mccarthy-ubs0f7`. Fluxo: trabalhar nela → abrir PR pra base → a Duda dá merge pela UI do GitHub.
- **Deploy web:** push na base → GitHub Pages reconstrói o site.
- **Deploy functions:** push na base → `deploy-edge-functions.yml` (lista fixa; adicionar função nova lá quando criar).
- **Deploy app:** merge → Codemagic "Start new build" (workflow Elarah iOS) → TestFlight.
- **Cache-busting:** ao mudar JS/CSS, bumpar `?v=N`.
- **Nota sobre PRs mergeados:** se um PR da branch de dev já foi mergeado, reinicie a branch a partir da base atualizada antes de novo trabalho (não empilhar em cima de histórico já mergeado).

### PRs abertos (no fim desta sessão) — nenhum toca em pagamento
`#456` (infra audit), `#387` (layout card By Elarah), `#175` (formatação de horário), `#168` (cronograma SQL), `#11` (toggle visibilidade), `#1` (logo png). **#461 (fix do rollback) já mergeado.**

---

## 11. Roadmap / melhorias / tarefas em andamento

**Curto prazo (aprovação + estabilidade):**
1. Acompanhar a **revisão da Apple** (app 1.0). Responder se pedirem algo.
2. **Estabilizar produção** e acompanhar próximos pagamentos (validar que recusa agora volta 200 + vaga liberada — efeito do #461).
3. **Validar config** MP/Supabase (seção 9), com foco nos **segredos de webhook**.

**Médio prazo (quando autorizado):**
4. **Testar `MP_CARD_3DS_MODE=mandatory`** (reduzir `cc_rejected_high_risk`) + monitorar aprovação/atrito.
5. **Layout estilo Airbnb** (cards mais compactos) — após aprovação do app.
6. Fechar o **item 8** (fallback de token do cartão no `check-mp-payment-status`) e o **Stripe legado** (mesmo bug do rollback).

**Backlog (crescimento — mais da Duda que de código):**
7. Recuperação de Pix abandonado; melhorar páginas de experiências que têm view e pouca venda; SEO longtail (`docs/calendario-seo-longtail.md`, `docs/kit-backlinks-sp.md`); UGC/embaixadoras (`docs/captacao-loops-ugc.md`); calendário editorial.

**Princípio combinado com a Duda:** **não mexer em código sem evidência concreta de problema.** Estabilizar primeiro, iterar depois.

---

## 12. Contexto para um novo Claude assumir + índice de docs

### Regras de ouro (aprendidas com a Duda)
- Ela **não é dev** e **não tem Mac/terminal** — tudo por **navegador**. Explique **tela por tela**, com links diretos e prints quando possível.
- **Português**, tom próximo e direto. Ela decide; você recomenda. **Nunca** mexa em nada que possa **parar o que já funciona** (Pix/pagamento) sem autorização explícita.
- **Seja honesto** sobre o que você NÃO consegue verificar (ela valoriza isso): você não tem acesso ao painel do Supabase/MP, nem à rede externa deste ambiente, nem aos valores dos secrets.
- Trabalhe na branch de dev, abra PR pra base, **ela mergeia**.

### Ferramentas/acessos deste workspace
- **GitHub MCP** (repo `Elarahoficial/elarahplatform`) — PRs, issues, Actions, logs.
- **Windsor.ai MCP** — ler/escrever dados de anúncios/analytics (Meta, GA4, etc.).
- **Google Drive / Canva MCP** — quando conectados.
- Ambiente de execução remoto: rede externa restrita; Chromium/Playwright pré-instalado (`/opt/pw-browsers`) — usado nesta sessão pra gerar **screenshots de iPhone/iPad** (renderizando `app/www` num server local).

### Índice de documentação existente em `docs/`
- `HANDOFF-CONTEXTO-COMPLETO.md` — **este arquivo**.
- `auditoria-mercado-pago-2026-07.md` — auditoria do Mercado Pago.
- `app-store-auditoria-final.md`, `app-store-privacidade.md` — App Store (privacidade, Info.plist, labels, checklist).
- `agente-diagnostico-ia.md` — o agente de diagnóstico do funil ("onde estamos pecando").
- `frete-melhor-envio.md`, `frete-etiqueta-automatica-roadmap.md` — frete.
- `windsor-import.md` — Windsor/anúncios.
- `backup-e-restauracao.md` — backup.
- `calendario-editorial-junho-2026.md`, `calendario-seo-longtail.md`, `kit-backlinks-sp.md`, `captacao-loops-ugc.md` — marketing/SEO.
- `deploy-sem-terminal/` — versões standalone de functions p/ deploy sem terminal.
- `supabase/functions/SOCIAL_INTEGRATION_SETUP.md` — setup social.
- **PR #456** (branch `claude/elarah-infra-audit-dr99km`) — **auditoria de infraestrutura e titularidade de contas** (leia para o plano de transferência de contas/credenciais).

### Estado no fim desta sessão (2026-07)
- App iOS **1.0** submetido, **aguardando revisão** da Apple (exclusão de conta + iPad corrigidos).
- Pagamentos Mercado Pago (Pix + cartão Transparente + 3DS optional) **em produção e saudáveis** (vendas +200%, receita +142% no mês).
- Bug do rollback (**500 em recusa**) **corrigido e publicado** (#461).
- **Investigação de pagamento encerrada**; foco em **estabilizar e monitorar**. Só mexer com **evidência concreta**.

---

*Fim do documento. Se algo essencial não estiver aqui, procure em `docs/`, no código das Edge Functions (`supabase/functions/`), no `script.js` (checkout) e no `booking_guard.ts` (regras de reserva/estoque), e nas outras conversas fixadas do workspace.*
