# Integração com redes sociais — guia de deploy

Documentação interna para configurar e fazer deploy da integração
de redes sociais (Instagram inicial, extensível pra TikTok e LinkedIn).

## Visão geral

```
[admin.html]
   ↓ POST /functions/v1/oauth-start (com JWT do admin)
[oauth-start]
   ↓ devolve URL de autorização Meta
[admin.html] → redireciona pro Facebook
   ↓ usuário autoriza
[Meta] → redireciona pra /functions/v1/oauth-callback?code=...
[oauth-callback]
   ↓ troca code por token, criptografa e salva em social_accounts
   ↓ redireciona pro admin.html?social_connected=1
```

## Pré-requisitos no banco

Aplicar nesta ordem (SQL Editor do Supabase):

1. `sql/elarah_social_integration.sql` — tabelas base
2. `sql/elarah_social_token_storage.sql` — colunas de token criptografado + tabela de OAuth state

Confere que pg_net e pgcrypto estão habilitados (Database → Extensions).

## Variáveis de ambiente

Configurar no Supabase via Dashboard → Edge Functions → Secrets,
ou via CLI:

```bash
supabase secrets set META_APP_ID=1234567890123456
supabase secrets set META_APP_SECRET=abcdef...           # nunca commitar
supabase secrets set META_TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
supabase secrets set ADMIN_FALLBACK_RETURN_URL=https://elarah.com.br/admin.html
```

Variáveis que o Supabase já injeta sozinho (não precisa setar):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Sobre `META_TOKEN_ENCRYPTION_KEY`

- Tem que ter exatamente **32 bytes em base64** (256 bits AES).
- **Não rotacione sem migração.** Se rotacionar, todos os tokens
  já criptografados deixam de descriptografar. A coluna
  `token_encryption_version` em `social_accounts` permite
  fazer rotação coordenada no futuro.
- Backup recomendado: 1Password / cofre da empresa. Sem ela, todas
  as conexões precisam ser refeitas.

### Sobre `ADMIN_FALLBACK_RETURN_URL`

- URL pra onde redirecionamos no callback caso a sessão de
  conexão tenha expirado (`return_to` perdido).
- Em produção: `https://elarah.com.br/admin.html`.
- Em dev: `http://localhost:8080/admin.html` (se servir local).

## Configuração no app Meta

Painel do app no Meta for Developers → Facebook Login for Business
→ Configurações:

- **URI de redirecionamento OAuth válido**: cole a URL exata da
  Edge Function `oauth-callback` do seu projeto. Exemplo:

  ```
  https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/oauth-callback
  ```

  (substitua pelo project ID do `config.toml`).

## Deploy das Edge Functions

```bash
# Fase 2 — fluxo OAuth
supabase functions deploy oauth-start
supabase functions deploy oauth-callback

# Fase 3 — sync de posts e renovação de tokens
supabase functions deploy sync-instagram
supabase functions deploy refresh-tokens
```

### Migrations da Fase 3

Aplicar **depois** das functions estarem deployadas:

1. `sql/elarah_social_cron.sql` — agenda os jobs do pg_cron
   (sync 4x/dia, refresh tokens 1x/mês, purge OAuth states 1x/dia).

   Antes de rodar essa migration, execute uma vez no SQL Editor:

   ```sql
   ALTER DATABASE postgres
     SET app.elarah_service_role_key = 'eyJhbGciOi...';
   ```

   Substitua pela `service_role` key do projeto (Settings → API).
   Sem isso, os jobs do cron rodam mas as Edge Functions retornam
   401 — porque a key não chega no header Authorization.

Após o deploy, a URL final é:

- `https://<project>.supabase.co/functions/v1/oauth-start`
- `https://<project>.supabase.co/functions/v1/oauth-callback`

## Como o frontend chama

```js
// admin-social.js (exemplo)
async function connectInstagram() {
  const sb = window.supabaseClient;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error("Faça login antes.");

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/oauth-start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        provider: "instagram",
        return_to: window.location.href,
      }),
    },
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  window.location.href = data.url;
}
```

Após autorizar na Meta, o usuário volta pra `return_to` com:

- `?social_connected=1&social_provider=instagram&social_username=elarah.oficial` em caso de sucesso
- `?social_connected=0&social_error=<motivo>` em caso de erro

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| `401 Não autorizado` no oauth-start | JWT do admin expirou ou usuário não tem `is_admin = true` em `profiles`. |
| `Provider não suportado` | Body do POST sem `provider: "instagram"` ou typo. |
| Volta com `social_error=Resposta inválida da Meta` | Browser pulou direto pro callback sem completar o flow. |
| Volta com `social_error=Sessão de conexão expirou` | Levou >15 min entre clicar conectar e completar. |
| Volta com `social_error=Nenhuma Página... encontrada` | Conta IG não está vinculada a uma Página do Facebook. |
| Volta com `social_error=Nenhuma Página tem Instagram Business...` | A Página do FB existe, mas não tem o IG Business vinculado. |
| `META_TOKEN_ENCRYPTION_KEY tem N bytes` | Chave gerada errada. Use `openssl rand -base64 32`. |
