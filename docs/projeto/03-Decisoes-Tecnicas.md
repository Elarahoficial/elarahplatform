# 03 — Decisões Técnicas

Decisões de engenharia importantes e o **porquê** de cada uma. Muitas estão documentadas em comentários no próprio código-fonte.

---

## 1. Frontend estático, sem framework nem build
**Decisão:** HTML/CSS/JS puro servido diretamente por GitHub Pages, sem React/Vue/bundler.
**Motivo:** simplicidade, custo zero de hospedagem, deploy instantâneo (git push), e facilidade para uma equipe pequena editar páginas sem toolchain. O mesmo HTML é reaproveitado pelo app nativo (Capacitor) via cópia.
**Trade-off:** arquivos grandes (`admin.js` ~1MB, `script.js` 276KB) e ausência de tree-shaking/tipagem no frontend.

## 2. Supabase como backend único (BaaS)
**Decisão:** concentrar Auth, banco, funções, storage, cron e vault no Supabase.
**Motivo:** um único provedor cobre autenticação, Postgres com RLS, Edge Functions serverless e agendamento (pg_cron) — reduz superfície operacional e custo. A `publishable key` pode ir ao frontend com segurança porque o RLS protege os dados.

## 3. Row Level Security (RLS) pervasiva + `is_admin()`
**Decisão:** 130+ políticas RLS; padrão "leitura pública/autenticada, escrita só admin" via função `public.is_admin()`.
**Motivo:** permite expor a chave publishable no frontend sem risco — o banco é a fronteira de segurança, não o cliente. Ações sensíveis ficam em Edge Functions com service role.

## 4. Lógica sensível nas Edge Functions com service role
**Decisão:** pagamentos, e-mail, exclusão de conta, acesso administrativo e integrações rodam em Edge Functions que usam `SUPABASE_SERVICE_ROLE_KEY` (bypass de RLS), com autorização interna própria.
**Motivo:** segredos (tokens de pagamento, API keys) nunca chegam ao navegador; o servidor valida assinaturas/JWT e recalcula valores (preço, frete, rateio) — o cliente não é fonte de verdade.

## 5. `verify_jwt = false` apenas em endpoints públicos/webhook
**Decisão:** só `stripe-webhook`, `mp-webhook`, `oauth-callback`, `melhor-envio-callback` e `og-experience` desligam o JWT (em `config.toml`).
**Motivo:** provedores externos (Stripe/MP) e redirects de OAuth **não enviam JWT do Supabase**. Com `verify_jwt=true` o Supabase respondia 401 antes do código rodar — foi exatamente o bug que quebrou os webhooks. A autenticidade passa a ser garantida por **assinatura HMAC / `stripe-signature`** (webhooks) e por **`state` CSRF com TTL** (OAuth).

## 6. Auth em fluxo `implicit` (tokens no hash)
**Decisão:** `flowType: 'implicit'` no client Supabase.
**Motivo:** faz os links de confirmação de e-mail e de reset de senha funcionarem em **qualquer navegador**, sem depender do `code_verifier` do PKCE (que quebra quando o link é aberto em um navegador diferente do que iniciou o fluxo).

## 7. Carregamento resiliente do SDK Supabase
**Decisão:** `supabase-loader.js` carrega o SDK **local-first** (`vendor/supabase-js@2.45.0.js`) e só cai em CDNs (jsdelivr/unpkg/esm.sh) como fallback; `supabase-client.js` faz polling de até 8s e envolve todo fetch em `resilientFetch` (retry com backoff).
**Motivo:** redes corporativas, ad-blockers e o `ERR_QUIC_PROTOCOL_ERROR` do Chrome derrubavam o SDK via CDN. O local-first + retry garante que o site funcione mesmo com CDN bloqueado; após a 1ª falha QUIC o Chrome cai para HTTP/2 e o retry quase sempre passa.

## 8. Seeds de fallback embutidos no frontend
**Decisão:** `experiences-data.js` traz `FALLBACK_SEEDS` embutidos.
**Motivo:** o site continua exibindo experiências mesmo se o Supabase estiver indisponível no carregamento.

## 9. Recuperação de senha via Resend (não pelo e-mail nativo do Supabase)
**Decisão:** `send-password-recovery` gera o link server-side (`generateLink`) e envia pelo Resend.
**Motivo:** o e-mail nativo do Supabase tinha **rate limit** e não entregava para clientes reais. O endpoint sempre responde `{ok:true}` (sem enumeração de contas), valida `redirectTo` por allowlist e tem throttle de 30s/e-mail.

## 10. Mercado Pago: migração para Checkout Transparente
**Decisão:** mover o cartão de Checkout Pro (redirect) para **Checkout Transparente** (Checkout API) com MercadoPago.js V2, Secure Fields (PCI) e Device ID, mantendo Checkout Pro/Pix/Stripe como fallback.
**Motivo:** elevar o *Integration Quality Score* da MP (de ~51 rumo a 100), reduzir atrito (pagar sem sair do site) e atender requisitos antifraude (Device ID). Se `MP_PUBLIC_KEY` não estiver configurada, o cartão cai automaticamente para Checkout Pro. (Ver `docs/auditoria-mercado-pago-2026-07.md`.)

## 11. Tolerância a múltiplos nomes de segredo (migração de contas)
**Decisão:** `mp-webhook`/`create-mp-card-payment` leem tokens/segredos em ordem de fallback (`MP_CARD_ACCESS_TOKEN` → `MERCADO_PAGO_ACCESS_TOKEN` → `MP_LEGACY_ACCESS_TOKEN`; idem para public key e webhook secret).
**Motivo:** permitir **migração de conta Mercado Pago sem downtime** — durante a transição, webhooks de ambas as contas são aceitos.

## 12. Webhooks idempotentes com reconciliação e guardas
**Decisão:** `mp-webhook`/`stripe-webhook` são idempotentes, detectam divergência de valor, re-ocupam inventário, registram uso de cupom e enviam e-mails; `check-mp-payment-status` faz backup por polling.
**Motivo:** webhooks podem chegar duplicados, fora de ordem ou não chegar; a reconciliação garante consistência de vagas e financeiro.

## 13. Rateio financeiro no servidor (`financial.ts`)
**Decisão:** o preço é sempre dividido entre fornecedores (percentual/fixo) + comissão Elarah no backend.
**Motivo:** o valor e o repasse não podem depender do cliente; o `v_financial_ledger` evolui em versões (v2→v8) para cobrir fallback de fornecedor, gift cards e comissão.

## 14. Frete sempre recalculado no servidor
**Decisão:** `shipping.ts` recalcula o frete no backend (preço real Melhor Envio se conectado, senão estimativa regional; `SHIPPING_MODE=free` opcional).
**Motivo:** impedir manipulação do valor de frete pelo cliente.

## 15. Tokens de terceiros criptografados no banco (AES-GCM)
**Decisão:** tokens de OAuth (Instagram/Meta e Melhor Envio) são criptografados com `META_TOKEN_ENCRYPTION_KEY` (AES-256) antes de gravar em `social_accounts`/`melhor_envio_tokens`.
**Motivo:** mesmo com acesso ao banco, os tokens não vazam. **A chave é compartilhada** entre as duas integrações e **não pode ser rotacionada sem migração** dos registros existentes.

## 16. Service role key no Vault para o pg_cron
**Decisão:** os jobs de cron (sync social, insights) leem a service role key do **Supabase Vault** (`elarah_service_role_key`).
**Motivo:** o pg_cron precisa chamar Edge Functions autenticadas sem expor a chave em texto puro no agendamento.

## 17. Projeto iOS nativo NÃO versionado — regenerado a cada build
**Decisão:** `app/ios` (xcodeproj, Podfile, Info.plist) não é versionado; o Codemagic roda `npx cap add ios` + `cap sync ios` a cada build.
**Motivo:** build **determinístico** e independente de cache/estado; a fonte de verdade é `app/package.json` + `capacitor.config.json` + `app/www`.

## 18. Chave de assinatura iOS persistente (`CERT_KEY`)
**Decisão:** guardar a chave privada de assinatura como variável **Secure** (`CERT_KEY`, grupo `elarah_signing`) e reutilizá-la; o workflow ainda revoga certificados órfãos antes de assinar.
**Motivo:** builds em máquinas efêmeras geravam uma chave nova a cada vez, acumulando certificados até estourar o limite da Apple (**erro 409** "You already have a current Distribution certificate"). Com `CERT_KEY` persistente o certificado é criado uma vez e reutilizado.

## 19. Build number iOS por timestamp
**Decisão:** `CFBundleVersion = date +%s` a cada build.
**Motivo:** regenerar o projeto zerava o build number para 1, e o App Store Connect recusa números repetidos; o timestamp é único e sempre crescente.

## 20. `ITSAppUsesNonExemptEncryption = false` + descrições de uso no Info.plist
**Decisão:** declarar isenção de criptografia e adicionar `NSPhotoLibraryUsageDescription`/`NSCameraUsageDescription` no build.
**Motivo:** evitar ficar preso em "Missing Compliance" no TestFlight e evitar crash em `<input type=file>` nas telas de admin.

## 21. `copy-web.mjs` idempotente e com escopo fechado
**Decisão:** o app só empacota os arquivos já rastreados em `app/www` (nunca `admin/*`, `supabase/*`, `docs/*`), injetando `capacitor-bridge.js`.
**Motivo:** manter o bundle do app enxuto, previsível e sem telas administrativas.

## 22. Hospedagem em GitHub Pages (não Vercel/Netlify)
**Decisão:** site estático servido da raiz do repositório via GitHub Pages (`CNAME` + `.nojekyll`).
**Motivo:** custo zero, deploy por git push, domínio custom `elarah.com.br`. Não há `vercel.json`/`netlify.toml` no repositório.
> Observação: caso o histórico anterior tenha usado Vercel, a configuração atual do repositório é GitHub Pages. Ver [13 — Deploy](./13-Deploy.md).

## 23. Backup diário criptografado no GitHub Actions
**Decisão:** `backup-database.yml` faz dump diário de `public`+`auth`, comprime e criptografa (AES-256) como artifact de 90 dias.
**Motivo:** backup gratuito e seguro; mesmo baixando o artifact, ninguém lê sem a `BACKUP_PASSPHRASE`.

## 24. Trava de escalonamento de privilégio em `profiles`
**Decisão:** trigger `protect_profile_privileged_columns` impede que um usuário altere colunas privilegiadas (ex.: `role`).
**Motivo:** evitar que um cliente se promova a admin editando o próprio perfil.
