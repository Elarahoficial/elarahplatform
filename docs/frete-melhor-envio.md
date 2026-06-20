# Frete real dos Correios — Elarah em Casa (Melhor Envio)

Guia pra ligar o **preço exato** dos Correios (PAC/SEDEX) na aba **Elarah em
Casa**, via integração OAuth com o Melhor Envio. Toda a parte de código já está
pronta — inclusive a **renovação automática do token** (ele nunca vence sem
alguém perceber). Falta só a configuração abaixo.

## Como funciona o cálculo (escolhido automaticamente)

| Situação | O que o cliente vê |
|---|---|
| **Melhor Envio conectado** (este guia) | Preço **real** dos Correios ✅ |
| Sem conexão (padrão) | Frete **estimado** por região (aproximado) |
| `SHIPPING_MODE=free` | Frete grátis (promoção pontual) |

O checkout **sempre recalcula o frete no servidor** — nunca confia no valor que
veio da tela do cliente.

## Peças do código (já implementadas)

- `sql/elarah_melhor_envio_tokens.sql` — tabela dos tokens (criptografados).
- `supabase/functions/_shared/melhor_envio.ts` — OAuth + refresh automático.
- `supabase/functions/melhor-envio-connect` — inicia a conexão (admin).
- `supabase/functions/melhor-envio-callback` — recebe a autorização.
- `conectar-frete.html` — página com o botão de conectar.
- `calculate-shipping` e `create-checkout-session` — já usam o token real.

## Passo a passo (uma vez só)

### 1. Criar o aplicativo no Melhor Envio

1. Entre em <https://melhorenvio.com.br> → menu **Integrações → Área Dev.**
2. Clique em **CADASTRAR APLICATIVO** (ambiente de **produção**).
3. Preencha:
   - **Nome:** `Elarah`
   - **E-mail:** `contato.elarah@gmail.com`
   - **URL de redirecionamento (redirect URI):**
     `https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/melhor-envio-callback`
     > ⚠️ Tem que ser **idêntica** a essa, senão a autorização falha.
   - **Permissões/Escopos:** marque pelo menos **Calcular fretes**
     (`shipping-calculate`).
4. Salve e **copie** o **Client ID** e o **Client Secret**.

### 2. Adicionar os secrets no Supabase

Painel do Supabase → **Project Settings → Edge Functions → Secrets**:

| Secret | Valor | Obrigatório? |
|---|---|---|
| `MELHOR_ENVIO_CLIENT_ID` | Client ID do app | **Sim** |
| `MELHOR_ENVIO_CLIENT_SECRET` | Client Secret do app | **Sim** |
| `META_TOKEN_ENCRYPTION_KEY` | chave AES de 32 bytes (`openssl rand -base64 32`) | **Sim** (já existe se a integração do Instagram estiver ligada — é a mesma) |
| `SHIPPING_ORIGIN_CEP` | CEP de onde você posta os kits | Recomendado |
| `MELHOR_ENVIO_BASE` | deixe **em branco** (já vai pra produção) | Não |

### 3. Rodar a migration

No Supabase → **SQL Editor**, rode o conteúdo de
`sql/elarah_melhor_envio_tokens.sql` (cria a tabela dos tokens).

### 4. Publicar (deploy) as funções

Publique/republique estas Edge Functions:
`melhor-envio-connect`, `melhor-envio-callback`, `calculate-shipping`,
`create-checkout-session`.

> A função `melhor-envio-callback` é pública (sem JWT) — isso já está
> declarado em `supabase/config.toml`. A segurança vem do `state` (CSRF).

### 5. Conectar a conta

1. **Logada no admin** da Elarah, abra **`/conectar-frete.html`**.
2. Clique em **"Conectar minha conta Melhor Envio"**.
3. Você vai pro Melhor Envio → **Autorizar** → volta pro site com
   ✅ *"Frete conectado!"*.

Pronto. A partir daí o token se renova sozinho.

## Como testar

1. Abra um kit na aba **Elarah em Casa** → **"Quero meu kit"**.
2. Digite um CEP → **Calcular frete**.
3. Deve aparecer **Correios PAC / SEDEX** com o preço real. ✅

## Observações

- **Produtos novos** entram no cálculo automaticamente (qualquer kit com
  "kit", "diy" ou "em casa" no nome/categoria).
- **Peso:** hoje todo kit usa **1 kg** como padrão. Se os kits novos forem bem
  mais pesados, dá pra adicionar peso por produto depois.
- **Reconectar:** se algum dia o frete real parar (ex.: você revogou o app no
  Melhor Envio), é só abrir `/conectar-frete.html` e conectar de novo.
