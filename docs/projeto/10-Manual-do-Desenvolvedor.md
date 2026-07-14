# 10 — Manual do Desenvolvedor

Como instalar, executar, publicar e manter a plataforma Elarah. Feito para um desenvolvedor que **nunca viu o projeto**.

---

## 1. Pré-requisitos
- **Git** e conta com acesso ao repositório `Elarahoficial/elarahplatform`.
- **Node.js 22** (para o app Capacitor, scripts `.mjs` e Supabase CLI).
- **Navegador moderno** (o site roda direto, sem build).
- Para o app iOS: **conta Apple Developer** + **Codemagic** (build na nuvem — dispensa Mac local).
- Acessos administrativos: **Supabase**, **GitHub**, **Codemagic**, **Mercado Pago**, **Stripe**, **Melhor Envio**, **Resend**, **Meta/Instagram**, **Anthropic**, **Google Cloud (Places)**.

---

## 2. Instalar e rodar o site localmente

O site é 100% estático — não precisa de `npm install`. Basta servir a raiz:

```bash
git clone <url-do-repo> elarahplatform
cd elarahplatform

# Opção A: Python
python3 -m http.server 8000

# Opção B: Node
npx serve .
```
Abra `http://localhost:8000`. O frontend se conecta ao **Supabase de produção** (URL + publishable key em `supabase-client.js`) — leituras funcionam via RLS; para testar sem afetar produção, aponte para um projeto Supabase de staging trocando `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` nesse arquivo.

> **Observação:** o site abre a partir de arquivos estáticos, mas pagamentos/checkout dependem das Edge Functions em produção. Para o fluxo completo, use um projeto Supabase próprio com os secrets configurados.

---

## 3. Rodar/instalar o app (Capacitor)

```bash
cd app
npm install
npm run build        # copy-web.mjs: reconstrói app/www a partir do site
npx cap sync ios     # ou: npx cap add ios (primeira vez)
npx cap open ios     # abre no Xcode (requer Mac) — opcional
```
O projeto iOS **não é versionado** — é regenerado. Para produção, o build acontece no Codemagic (ver seção 6).

---

## 4. Trabalhar com o backend (Supabase)

### Edge Functions
```bash
# Instalar a CLI
npm i -g supabase        # ou: npx supabase

# Login e link ao projeto
supabase login
supabase link --project-ref nwijxjmenbfyehvscogs

# Rodar uma função localmente (Deno)
supabase functions serve create-mp-pix-payment

# Deploy manual (o CI também faz isso automaticamente)
supabase functions deploy create-mp-pix-payment --no-verify-jwt
```
Configure os **secrets** em Dashboard → Edge Functions → Secrets (lista em [09 — Segurança](./09-Seguranca.md)).

### Banco
- Aplique scripts de `sql/` pelo **SQL Editor** do Supabase, na ordem lógica (setup → domínio → evoluções → seeds). Não há migração automática por CI.

---

## 5. Publicar mudanças

| Mudou o quê | Como publicar |
|---|---|
| **Site (HTML/CSS/JS)** | commit + push na branch do GitHub Pages → publica em `elarah.com.br`. |
| **Edge Function** | push na branch monitorada tocando `supabase/functions/**` → CI deploya. Ou `supabase functions deploy`. |
| **Banco** | rodar o SQL no SQL Editor. |
| **App iOS** | "Start new build" no Codemagic → TestFlight. |
| **Landings OG** | dispatch de `build-og-pages.yml`. |

Detalhes completos em [13 — Deploy](./13-Deploy.md).

---

## 6. Publicar o app iOS (passo a passo)
1. Garanta que a integração `ElarahASC` e o `CERT_KEY` (grupo `elarah_signing`, Secure) existem no Codemagic.
2. Codemagic → workflow **"Elarah iOS"** → **Start new build**.
3. O pipeline: instala deps → `copy-web` → regenera projeto iOS → ajusta Info.plist/privacidade → gera ícones → limpa certificados órfãos → assina → gera IPA → envia ao **TestFlight**.
4. No App Store Connect, promova do TestFlight para a App Store pública quando quiser.
5. Antes de submeter, revise `docs/app-store-privacidade.md` e `docs/app-store-auditoria-final.md`.

---

## 7. Manter a plataforma (rotina)

- **Backups:** automáticos (diário). Guarde a `BACKUP_PASSPHRASE`. Restore: `docs/backup-e-restauracao.md`.
- **Cron jobs:** 8 jobs pg_cron (ver [12 — Banco de Dados](./12-Banco-de-Dados.md)). Se um parar, confira o Vault (`elarah_service_role_key`) e os logs das funções.
- **Webhooks:** confirme que as URLs de `mp-webhook`/`stripe-webhook` estão cadastradas nos painéis Mercado Pago/Stripe e que os `*_WEBHOOK_SECRET` batem.
- **Tokens sociais:** renovados por `refresh-tokens` (mensal); se o Instagram desconectar, reconecte pelo admin.
- **Frete:** se as cotações falharem, reconecte o Melhor Envio em `/conectar-frete.html`.
- **E-mail:** monitore o Resend (`ELARAH_FROM_EMAIL` verificado, domínio autenticado).
- **Diagnóstico IA:** chega por e-mail diário; para ligar o modo Claude, defina `ANTHROPIC_API_KEY` e invoque com `"mode":"ai"`.

---

## 8. Migração de contas (checklist prático — motivo desta consolidação)
1. **Supabase:** criar/definir o novo projeto; aplicar todos os SQL de `sql/`; recriar buckets (`experience-images`, `financial-attachments`); configurar RLS (já nos scripts); recriar Vault (`elarah_service_role_key`); definir **todos** os Edge Function Secrets.
2. **Frontend:** atualizar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` em `supabase-client.js` (e no bundle `app/www`).
3. **GitHub:** recriar Secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `BACKUP_PASSPHRASE`); ajustar a lista de branches do deploy.
4. **Codemagic:** recriar integração `ElarahASC` + grupo `elarah_signing` (`CERT_KEY`).
5. **Pagamentos:** novos tokens/secrets Mercado Pago e Stripe; cadastrar as novas URLs de webhook; usar os fallbacks `MP_LEGACY_*` durante a transição.
6. **Demais integrações:** novos secrets de Melhor Envio, Instagram/Meta, Resend, Anthropic, Google Places; reconectar OAuth (frete e social) — lembre que `META_TOKEN_ENCRYPTION_KEY` novo invalida tokens antigos.
7. **DNS/domínio:** manter `CNAME` `elarah.com.br` apontando para o GitHub Pages da nova conta, se o repositório mudar de owner.
8. **Backup antes de tudo:** rode `backup-database.yml` e guarde o artifact.

---

## 9. Onde procurar quando algo quebra
- **Pagamento não confirma:** logs de `mp-webhook`/`stripe-webhook`; rode `check-mp-payment-status`; confira `*_WEBHOOK_SECRET`.
- **Login/reset falha:** `auth.js`, `send-password-recovery`; verifique Resend e allowlist de `redirectTo`.
- **Site não carrega dados:** console do navegador; `supabase-client.js`/`supabase-loader.js` (bloqueio de CDN/QUIC) — o `resilientFetch` retenta.
- **Vagas erradas:** funções de inventário e `reconcile_all_vagas` (ver [12](./12-Banco-de-Dados.md)).
- **Build iOS falha (409):** passo "Limpar certificados órfãos" + `CERT_KEY` no `codemagic.yaml`.
