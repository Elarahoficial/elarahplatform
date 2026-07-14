# Auditoria de Infraestrutura e Titularidade — Elarah

**Data:** 2026-07-14
**Objetivo:** Levantar todas as ferramentas, serviços, APIs e contas usadas na
plataforma Elarah, identificar qualquer dependência de **conta pessoal**, e
classificar cada item quanto ao controle da empresa.

> **Escopo desta auditoria.** Tudo abaixo foi levantado a partir do **código,
> configs, CI/CD e documentação do repositório**. O código revela *quais*
> serviços são usados, *quais segredos* eles exigem e *qual e-mail* aparece nas
> integrações — mas **não revela quem é o titular/pagador de cada painel
> externo** (isso só se confirma logando em cada dashboard). Por isso cada item
> traz uma coluna "Como confirmar a titularidade".

---

## 1. Resumo executivo — o risco central

**Existe um único ponto de falha que domina toda a plataforma: o e-mail
`contato.elarah@gmail.com` (Gmail gratuito) e a conta GitHub pessoal
`Elarahoficial`.**

- `contato.elarah@gmail.com` **não é um e-mail sob o domínio da empresa**
  (`@elarah.com.br`). É uma caixa **Gmail gratuita**. Mesmo tendo nome
  "corporativo", uma conta `@gmail.com` é, do ponto de vista jurídico e de
  recuperação, **uma conta pessoal** — pertence a quem a criou, é recuperada
  pelo telefone/e-mail de recuperação daquela pessoa, e **não pode ser
  governada nem transferida** como uma conta Google Workspace no domínio da
  empresa.
- Esse mesmo e-mail aparece explicitamente como login de: **Windsor AI**,
  **Melhor Envio**, e como e-mail de contato/notificação padrão do sistema.
  Por padrão de mercado, é quase certo que também é o login de **Supabase,
  Mercado Pago, Stripe, Resend, Meta/Instagram, Apple Developer, Google Play e
  do registrador do domínio** — precisa confirmar em cada painel.
- A conta **GitHub `Elarahoficial` é uma conta de usuário pessoal**, não uma
  **Organização**. Único admin/colaborador. O código, o site (GitHub Pages), o
  CI/CD e os backups do banco vivem todos sob ela.

**Se essa conta Gmail for desativada, perdida ou ficar indisponível, a empresa
pode perder o acesso a praticamente tudo de uma só vez.** Resolver isso é a
prioridade nº 1 e destrava a transferência de todos os outros serviços.

---

## 2. Inventário completo de serviços

Legenda de status:
- ✅ **Sob controle da empresa** (ou naturalmente neutro/sem risco de titularidade)
- ⚠️ **Precisa de ajuste / verificação**
- ❌ **Depende de conta pessoal (Gmail/GitHub pessoal)**

### 2.1 Núcleo — hospedagem, código e dados

| Serviço | Finalidade | Indispensável? | Conta/e-mail vinculado (evidência no repo) | Proprietário/Admin | Dependência pessoal? | Como transferir p/ empresa |
|---|---|---|---|---|---|---|
| **GitHub** (`Elarahoficial/elarahplatform`) | Repositório do código, **hospedagem do site** (GitHub Pages) e **CI/CD** (Actions) | **Sim** — é onde o site é publicado | Conta de **usuário** `Elarahoficial` (criada 2026-04-02, único admin). Provável login `contato.elarah@gmail.com` | `Elarahoficial` | ❌ Conta de usuário pessoal, não Organização | Criar uma **GitHub Organization** da empresa, transferir o repo pra ela, adicionar sócios como Owners. Migrar os Secrets. |
| **GitHub Pages** | Serve o site estático `elarah.com.br` (arquivo `CNAME`) | **Sim** | Segue o GitHub acima | idem | ❌ Herda o risco do GitHub | Resolve junto com a migração pra Organização |
| **GitHub Actions** | Deploy das Edge Functions, **backup diário do banco**, geração das landing pages OG | **Sim** (deploy e backup) | Secrets no repo: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`/`_ID`, `SUPABASE_DB_PASSWORD`, `BACKUP_PASSPHRASE` | idem | ❌ Herda o risco do GitHub | Migra junto; re-cadastrar os Secrets na Org |
| **Supabase** (projeto `nwijxjmenbfyehvscogs`, região `sa-east-1`) | **Banco Postgres, Auth (login), Edge Functions (backend), Storage de arquivos (bucket `experience-images`), Vault de segredos** | **Sim — é o coração da plataforma** | Não aparece no código. Anon key e publishable key estão no front (públicas, ok). Provável login `contato.elarah@gmail.com` | A confirmar no painel | ⚠️ Provável Gmail — **confirmar** | Transferir a **organização Supabase** pra um e-mail corporativo, ou adicionar membros e trocar o Owner. Verificar o cartão de cobrança. |
| **Domínio `elarah.com.br`** | Domínio principal do site | **Sim** | Registrado em um registrador `.com.br` (**Registro.br**). Não aparece no repo | A confirmar no Registro.br | ⚠️ **Confirmar** o CPF/CNPJ e o e-mail do titular | Idealmente registrar/transferir o domínio para o **CNPJ da empresa** no Registro.br. Verificar e-mail de contato do domínio. |
| **DNS** | Aponta `elarah.com.br` → GitHub Pages | **Sim** | Gerenciado no painel do registrador (Registro.br). **Não há Cloudflare** (as menções a "Cloudflare" no código são só do CDN esm.sh) | A confirmar | ⚠️ Segue o domínio | Segue a titularidade do domínio |

### 2.2 Pagamentos

| Serviço | Finalidade | Indispensável? | Conta/e-mail (evidência) | Proprietário | Dependência pessoal? | Como transferir |
|---|---|---|---|---|---|---|
| **Mercado Pago** | **Pagamentos principais**: PIX e cartão (Checkout Transparente + Checkout Pro) | **Sim — sem ele não há vendas por PIX/cartão MP** | Segredos no Supabase: `MERCADO_PAGO_ACCESS_TOKEN`, `MP_CARD_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_CARD_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `MP_CARD_WEBHOOK_SECRET` (+ tokens legados) | A confirmar no painel MP | ⚠️ **Confirmar** se a conta MP está no CNPJ da empresa | Conta MP deve estar no **CNPJ da Elarah** (recebe o dinheiro). Verificar titular, dados bancários de saque e e-mail de acesso. |
| **Stripe** | Pagamento de **cartão do gift card** (legado; cartão de experiência migrou pra MP) | Parcial — gift card no cartão depende dele | Segredos no Supabase: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | A confirmar | ⚠️ **Confirmar** titular | Conta Stripe no CNPJ da empresa; verificar conta bancária de repasse. Avaliar se ainda é necessário (ou migrar 100% pro MP). |

### 2.3 E-mail, frete e integrações externas

| Serviço | Finalidade | Indispensável? | Conta/e-mail (evidência) | Proprietário | Dependência pessoal? | Como transferir |
|---|---|---|---|---|---|---|
| **Resend** | **E-mail transacional** (confirmação de reserva, recuperação de senha, avisos de venda, digest diário) | **Sim** (comunicação com o cliente) | `RESEND_API_KEY`; remetente `ELARAH_FROM_EMAIL` = `Elarah <contato@elarah.com.br>`. **Fallback ativo pra `onboarding@resend.dev`** — sinal de que o domínio ainda **não está verificado**. Notificação padrão hardcoded = `contato.elarah@gmail.com` | A confirmar | ⚠️ Conta a confirmar + **domínio não verificado** | Verificar `elarah.com.br` no Resend (registros SPF/DKIM no DNS) para parar de cair no sandbox; conta no e-mail corporativo. |
| **Melhor Envio** | Cálculo de **frete real dos Correios** (PAC/SEDEX) para "Elarah em Casa" | Parcial — sem ele, frete vira estimativa | App OAuth registrado com **e-mail `contato.elarah@gmail.com`** (doc `frete-melhor-envio.md`). Segredos: `MELHOR_ENVIO_CLIENT_ID`, `MELHOR_ENVIO_CLIENT_SECRET`, `MELHOR_ENVIO_TOKEN` | Conta `contato.elarah@gmail.com` | ❌ Registrado no Gmail | Recriar/transferir o app do Melhor Envio para conta corporativa |
| **Meta for Developers / Instagram** | Integração de **redes sociais** (OAuth, sync de posts do `@elarah.oficial`) | Não (analítico/marketing) | `META_APP_ID`, `META_APP_SECRET`, `META_TOKEN_ENCRYPTION_KEY`. Vinculado à Página do Facebook + IG Business | A confirmar (conta pessoal do FB?) | ⚠️ App Meta normalmente sob perfil pessoal | Colocar o app dentro de um **Meta Business Manager** da empresa; adicionar sócios como admins |
| **Windsor AI** | Importa métricas de **Instagram/TikTok** para o painel de análise social | Não (analítico) | **Login `contato.elarah@gmail.com`** (doc `windsor-import.md`) | Conta `contato.elarah@gmail.com` | ❌ Registrado no Gmail | Migrar conta Windsor para e-mail corporativo |
| **Google (Cloud / OAuth / Search Console)** | **Login com Google** no site (`auth.js` → provider `google`, via Supabase Auth) e verificação do **Search Console** (meta tag em `index.html`) | Parcial (login Google é uma das opções) | OAuth Client num projeto **Google Cloud**; conta Google provável `contato.elarah@gmail.com` | A confirmar | ⚠️ Provável Gmail | Mover o projeto Google Cloud para uma Organização/Workspace da empresa |

### 2.4 Apps mobile (iOS/Android)

| Serviço | Finalidade | Indispensável? | Conta/e-mail (evidência) | Proprietário | Dependência pessoal? | Como transferir |
|---|---|---|---|---|---|---|
| **Apple Developer / App Store Connect** | Publicar o **app iOS** (Bundle `com.elarah.app`) | Só se for publicar na App Store | Integração `ElarahASC` no Codemagic; certificado em `CERT_KEY`. Conta Apple a confirmar | A confirmar | ⚠️ Confirmar se é conta **Individual** ou **Organization (CNPJ/D-U-N-S)** | Idealmente conta Apple Developer **Organization** no CNPJ da empresa (Individual fica no nome de uma pessoa) |
| **Google Play Console** | Publicar o **app Android** (`app/android`, `com.elarah.app`) | Só se for publicar na Play Store | Conta Google Play a confirmar | A confirmar | ⚠️ Confirmar titular | Conta Play Console no e-mail corporativo / conta de empresa |
| **Codemagic** | **CI que builda o app iOS** na nuvem e envia pro TestFlight | Só no fluxo de build mobile | Grupo `elarah_signing` (contém `CERT_KEY`), integração `ElarahASC` | A confirmar | ⚠️ Confirmar login | Conta Codemagic no e-mail corporativo |

### 2.5 IA e ferramentas neutras

| Serviço | Finalidade | Indispensável? | Conta/e-mail (evidência) | Dependência pessoal? | Observação |
|---|---|---|---|---|---|
| **Anthropic (Claude)** | Modo **opcional** do agente "Diagnóstico IA" (versão paga; padrão é grátis por regras) | **Não** | `ANTHROPIC_API_KEY` (só se ativar o modo `ai`) | ⚠️ A confirmar se há chave configurada | Se ativar, usar chave numa conta corporativa |
| **Capacitor** | Framework que empacota o site como app nativo | Sim (p/ mobile) | — (biblioteca, sem conta) | ✅ Neutro | Sem titularidade a transferir |
| **CDNs** (esm.sh, jsDelivr, unpkg) | Entregam bibliotecas (Supabase JS etc.) no build/browser | Sim | — (públicos, sem conta) | ✅ Neutro | Sem titularidade |
| **WhatsApp** (`wa.me/5511914455930`) | Canal de contato/fechamento de grupos | Não | Número **+55 11 91445-5930** (pessoal?) | ⚠️ Número no nome de quem? | Idealmente um número corporativo/WhatsApp Business da empresa |

### 2.6 Serviços da lista que **NÃO** são usados (verificado no código)

| Serviço perguntado | Situação |
|---|---|
| **Vercel** | ❌ Não usado — a hospedagem é **GitHub Pages** |
| **Prisma** | ❌ Não usado — o acesso ao banco é direto via cliente Supabase |
| **Sentry** | ❌ Não encontrado |
| **PostHog** | ❌ Não encontrado |
| **Google Analytics / gtag** | ❌ Não encontrado — a analítica é **própria** (tabela `analytics_events` no Supabase) |
| **Google Maps / Places API** | ❌ Não usado em produção (só aparece num script-modelo não publicado, `prospect-finder.standalone.ts`) |
| **Firebase** | ❌ Não encontrado |
| **Cloudflare** | ❌ Não usado pela Elarah (as 2 menções são do CDN esm.sh) |
| **Twilio / SendGrid / Mailgun / OneSignal / S3** | ❌ Não encontrados |
| **SMTP próprio** | ❌ Não — o e-mail é 100% via Resend |

---

## 3. Varredura de credenciais no código (segurança)

**Boa notícia: a higiene de segredos do repositório está correta.** Nenhuma
chave secreta, token privado ou senha está commitada.

| O que foi procurado | Resultado |
|---|---|
| Chaves secretas (Stripe `sk_`, MP `APP_USR-`/`TEST-`, Resend `re_`, Google `AIza`, GitHub `ghp_`, Supabase `sbp_`, service_role) | ✅ **Nenhuma no código.** Todas vivem em: Supabase Edge Function Secrets, GitHub Actions Secrets e Codemagic (env groups) |
| `.env` versionado | ✅ `.gitignore` bloqueia `.env` e `.env.*` |
| Chaves **públicas** no front (esperado e seguro) | Supabase **anon key** (JWT) e **publishable key** (`sb_publishable_…`) — publicáveis por design; `google-site-verification` (público). ✅ Sem problema |
| Certificados/chaves privadas | ✅ Não versionados (o iOS `CERT_KEY` fica só no Codemagic) |
| Webhooks | Endpoints das Edge Functions (Stripe, MP, Meta, Melhor Envio) — protegidos por **assinatura HMAC / `state` CSRF**, os segredos ficam nos Secrets ✅ |

**⚠️ Exposição de dados pessoais (não é credencial, mas é um risco de privacidade):**
o arquivo **`preview-byelarah.html`** contém **dados reais de clientes**
(nomes, e-mails e telefones) hardcoded como dados de exemplo. Recomenda-se
substituir por dados fictícios (LGPD).

**⚠️ E-mail pessoal hardcoded:** `contato.elarah@gmail.com` está fixo no código
como e-mail de notificação padrão (`_shared/email.ts`, `analytics-insights`).
Trocar por endereço no domínio corporativo depois da migração.

---

## 4. Classificação final por serviço

### ❌ Depende de conta pessoal (ação necessária)
- **GitHub** — conta de **usuário** pessoal `Elarahoficial` (não é Organização); hospeda site, CI/CD e backups.
- **GitHub Pages / GitHub Actions** — herdam o risco acima.
- **Melhor Envio** — app OAuth registrado no **Gmail** `contato.elarah@gmail.com`.
- **Windsor AI** — login **Gmail** `contato.elarah@gmail.com`.
- **E-mail `contato.elarah@gmail.com`** em si — Gmail gratuito, chave de recuperação de quase tudo.

### ⚠️ Precisa de ajuste / verificação de titularidade
- **Supabase** — confirmar Owner e cartão de cobrança (provável Gmail).
- **Domínio `elarah.com.br` + DNS** — confirmar titular no Registro.br (CPF vs CNPJ).
- **Mercado Pago** — confirmar se a conta está no **CNPJ** da empresa (recebe o dinheiro!).
- **Stripe** — confirmar titular e conta bancária de repasse.
- **Resend** — confirmar conta **e verificar o domínio** (`SPF/DKIM`) para sair do sandbox.
- **Meta/Instagram** — colocar o app num **Business Manager** da empresa.
- **Google (Cloud/OAuth/Search Console)** — mover para Organização/Workspace da empresa.
- **Apple Developer / Google Play / Codemagic** — confirmar login; preferir contas de **empresa (CNPJ)**.
- **WhatsApp** `+55 11 91445-5930` — confirmar se é número corporativo.
- **Anthropic** — só se o modo IA for ativado.

### ✅ Sob controle / sem risco de titularidade
- **Higiene de segredos do repositório** (nenhum segredo commitado).
- **Capacitor, CDNs (esm.sh/jsDelivr/unpkg)** — bibliotecas neutras, sem conta.
- **Analítica própria** (Supabase) — sem dependência de terceiros.

> Observação: nenhum serviço pôde ser marcado ✅ quanto à **titularidade** com
> base só no código, porque o titular de cada painel externo não é visível no
> repositório. Após a verificação nos dashboards, os itens ⚠️ que já estiverem
> num e-mail/CNPJ corporativo passam para ✅.

---

## 5. Risco de perda de acesso / indisponibilidade

| Se esta conta cair… | O que a Elarah perde |
|---|---|
| **`contato.elarah@gmail.com`** (Gmail) | Recuperação de acesso de praticamente **todos** os serviços de uma vez. **Risco máximo — ponto único de falha.** |
| **GitHub `Elarahoficial`** | O **site sai do ar** (GitHub Pages), para o deploy de backend (Actions) e **os backups do banco** deixam de rodar. |
| **Supabase** | **Plataforma inteira para** (banco, login, backend, uploads). Indisponibilidade total. |
| **Domínio / Registro.br** | `elarah.com.br` para de resolver — **site e e-mails fora do ar**. |
| **Mercado Pago** | **Vendas por PIX/cartão param** e, se a conta não for da empresa, risco sobre o **dinheiro recebido**. |
| **Resend** | Clientes deixam de receber confirmações e recuperação de senha. |
| **Apple/Google Play** | Perda de controle sobre os apps publicados (impossível atualizar/republicar). |

**Mitigações já existentes:** backup diário do banco criptografado no GitHub
(90 dias) e renovação automática de tokens (Melhor Envio, Meta). Isso ajuda,
mas **não protege** contra a perda da conta Gmail/GitHub em si.

---

## 6. Plano de ação recomendado (ordem de prioridade)

1. **Criar uma identidade corporativa de e-mail** — o ideal é **Google
   Workspace no domínio `elarah.com.br`** (ex.: `contato@elarah.com.br`,
   `admin@elarah.com.br`). Passa a ser a caixa dona de tudo, governável e
   transferível.
2. **GitHub:** criar uma **Organization** da Elarah, transferir o repositório,
   adicionar os sócios como Owners, re-cadastrar os Secrets.
3. **Registro.br:** confirmar/transferir o domínio para o **CNPJ** da empresa e
   revisar o e-mail de contato do domínio.
4. **Mercado Pago e Stripe:** confirmar que a conta está no **CNPJ** e com a
   conta bancária correta (é onde o dinheiro entra).
5. **Supabase:** transferir o Owner da organização para o e-mail corporativo e
   revisar a cobrança.
6. **Resend:** verificar o domínio (SPF/DKIM) e trocar o remetente/notificações
   para `@elarah.com.br`.
7. **Melhor Envio, Windsor, Meta, Google Cloud, Apple, Play, Codemagic:**
   migrar o login para o e-mail corporativo (e, onde houver, conta de empresa).
8. **Limpeza no código:** trocar `contato.elarah@gmail.com` hardcoded por
   `@elarah.com.br` e remover os dados reais de clientes de
   `preview-byelarah.html`.
9. **Cofre de segredos:** guardar `META_TOKEN_ENCRYPTION_KEY`,
   `BACKUP_PASSPHRASE` e as chaves-mestras num gerenciador da empresa
   (1Password/Bitwarden) — sem elas, backups e tokens ficam irrecuperáveis.

---

### Anexo — segredos que a plataforma usa (todos fora do código, em painéis)

`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF/_ID`, `SUPABASE_DB_PASSWORD`,
`SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_PASSPHRASE`, `MERCADO_PAGO_ACCESS_TOKEN`,
`MP_CARD_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_CARD_PUBLIC_KEY`,
`MP_WEBHOOK_SECRET`, `MP_CARD_WEBHOOK_SECRET`, `MP_LEGACY_*`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
`ELARAH_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS`, `MELHOR_ENVIO_CLIENT_ID/SECRET/TOKEN`,
`META_APP_ID`, `META_APP_SECRET`, `META_TOKEN_ENCRYPTION_KEY`,
`ADMIN_FALLBACK_RETURN_URL`, `ANTHROPIC_API_KEY` (opcional), `CRON_SECRET`,
`SHIPPING_ORIGIN_CEP`.
