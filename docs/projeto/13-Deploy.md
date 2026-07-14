# 13 — Deploy

Como cada parte da plataforma é publicada.

---

## 1. Site (frontend estático) — GitHub Pages

- **Mecanismo:** o site é servido diretamente da raiz do repositório por **GitHub Pages** no domínio `elarah.com.br` (`CNAME` + `.nojekyll`, sem build).
- **Publicar:** basta **commitar e dar push** na branch configurada como fonte do Pages. Não há passo de compilação.
- **Arquivo `.deploy-trigger`:** um timestamp que pode ser alterado para forçar um redeploy quando necessário.
- **SEO:** `robots.txt` bloqueia áreas internas (`/admin.html`, `/conta.html`, checkout, `/og/`); `sitemap.xml` + `sitemap-experiencias.xml` (gerado por `scripts/build-experiences-sitemap.mjs`).

> **Observação sobre Vercel:** não há configuração de Vercel/Netlify no repositório atual. Se o projeto já usou Vercel no passado, o estado atual é GitHub Pages. Para migrar para Vercel bastaria conectar o repositório e servir os estáticos da raiz (sem build command).

---

## 2. Edge Functions — GitHub Actions + Supabase CLI

- **Workflow:** `.github/workflows/deploy-edge-functions.yml`.
- **Gatilho:** push em branches monitoradas (lista `claude/*` no workflow) que toquem `supabase/functions/**`, **ou** dispatch manual.
- **Secrets:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` (ou `SUPABASE_PROJECT_ID`). O workflow valida os secrets antes de rodar.
- **Comando:** `supabase functions deploy <nome>` por função, com `--no-verify-jwt` nas públicas/webhook:
  - `--no-verify-jwt`: `create-checkout-session`, `create-mp-pix-payment`, `create-mp-card-payment`, `get-mp-public-key`, `stripe-webhook`, `mp-webhook`, `check-mp-payment-status`, `redeem-gift-card`, `delete-account`, `send-password-recovery`, `analytics-insights`, `calculate-shipping`, `melhor-envio-callback`.
  - **Com** verify_jwt (só admin): `admin-account-access`, `notify-manual-sale`, `resend-booking-confirmation`, `send-supplier-customer-message`, `send-manual-sale-confirmation`, `melhor-envio-connect`.
- **Deploy sem terminal:** alternativa pelo dashboard web do Supabase para as versões standalone — ver `docs/deploy-sem-terminal/COMO-SUBIR-SEM-TERMINAL.md`.

> **Importante:** para adicionar uma branch nova ao deploy automático, inclua-a na lista `on.push.branches` do workflow. `verify_jwt` também é fixado em `supabase/config.toml` (fonte de verdade para 5 funções públicas).

---

## 3. Banco de dados — SQL Editor

- **Aplicar mudanças:** Supabase → SQL Editor → colar e rodar o script de `sql/`. Não há migração automática por CI; os scripts são aplicados manualmente na ordem lógica (setup → domínio → evoluções → seeds).
- **Backup:** `.github/workflows/backup-database.yml` roda diariamente (06:00 UTC), dump de `public`+`auth`, compressão + AES-256, artifact de 90 dias. Restore em `docs/backup-e-restauracao.md`.

---

## 4. App iOS — Codemagic → TestFlight

**Workflow `ios-elarah`** ("Elarah iOS", `codemagic.yaml`). Passos:
1. `cd app && npm install` — dependências Capacitor.
2. `npm run build` — `copy-web.mjs` reconstrói `app/www` a partir do site + injeta `capacitor-bridge.js`.
3. **Regenera o projeto nativo:** `rm -rf ios && npx cap add ios && npx cap sync ios` (o projeto iOS não é versionado).
4. Aplica ajustes no Info.plist (permissões de foto/câmera, `ITSAppUsesNonExemptEncryption=false`, `CFBundleVersion` por timestamp) + `PrivacyInfo.xcprivacy`.
5. Gera ícones/splash (ícone oficial `assets-src/icon.png`, laranja `#F27725`).
6. Limpa certificados de distribuição órfãos (evita erro 409 da Apple).
7. Configura assinatura com `CERT_KEY` persistente (grupo `elarah_signing`) e `fetch-signing-files`.
8. `xcode-project build-ipa` → IPA.
9. **Publica:** `submit_to_testflight: true` (auto-envio ao TestFlight; promoção à App Store pública é manual no App Store Connect).

**Como disparar:** botão **"Start new build"** no workflow "Elarah iOS" do Codemagic.

**Pré-requisitos (feitos uma vez):** conta Apple Developer; app no App Store Connect com Bundle ID `com.elarah.app`; integração `ElarahASC` no Codemagic; `CERT_KEY` (Secure) no grupo `elarah_signing`.

**Android:** o projeto `app/android` existe e o Capacitor suporta Android; o pipeline de CI atual é focado em iOS. Para Android, gerar via `npx cap add android && npx cap sync android` e buildar em Android Studio/Gradle.

---

## 5. Landings OG — GitHub Actions (manual)
- **Workflow:** `build-og-pages.yml` (dispatch manual). Roda `scripts/build-og-pages.mjs` e commita `og/`. Use após cadastrar/editar experiências para regenerar os previews de link.

---

## 6. Ordem recomendada num deploy completo
1. Aplicar SQL novo (se houver) no SQL Editor.
2. Definir/atualizar secrets no Supabase (Edge Functions).
3. Push → deploy das Edge Functions (Actions).
4. Push → publicação do site (Pages).
5. (Se app mudou) build no Codemagic → TestFlight.
6. (Se experiências mudaram) rodar `build-og-pages`.
