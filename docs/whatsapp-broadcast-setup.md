# WhatsApp automático pra interessados (Z-API)

Dispara automaticamente o follow-up de WhatsApp pra **todos os interessados de
uma experiência** (a lista de "Respostas do formulário" no admin), em vez de
abrir o WhatsApp pessoa por pessoa. Feito pra quando uma experiência tem 90, 19,
100+ respostas e precisa avisar todo mundo rápido ("acabou de abrir, só 5 vagas").

## Como funciona (visão geral)

1. No admin, na lista **Respostas do formulário**, cada experiência agora tem um
   botão verde **📱 WhatsApp automático** no cabeçalho. (O mesmo botão também
   está na aba de itens By Elarah, como "📱 Follow-up WhatsApp".)
2. Abre o modal de follow-up com a mensagem pronta (template da campanha, com
   link e cupom já resolvidos).
3. Botão **🚀 Enviar automático pra todos**: conta os destinatários, pede
   confirmação e dispara sozinho via Z-API — uma mensagem a cada ~1 segundo,
   com barra de progresso. Quem já foi contatado é pulado (respeitando o filtro
   "Esconder já contatados"). Quem preencheu duas vezes recebe só uma mensagem.
4. Botão **Testar no meu WhatsApp**: manda a mensagem só pra um número que você
   digitar, pra conferir antes.

Peças no código:

- `supabase/functions/whatsapp-broadcast/index.ts` — Edge Function (auth de admin,
  carrega os interessados, dispara em lotes, marca quem recebeu).
- `supabase/functions/_shared/whatsapp.ts` — adaptador Z-API (`send-text`).
- `sql/elarah_byelarah_followup_tracking.sql` — colunas de "quem já recebeu"
  (já existia; reaproveitado).
- `sql/elarah_whatsapp_broadcasts.sql` — log agregado por campanha (histórico).
- `admin.html` / `admin.js` — botões e a lógica do modal.

## Passo a passo pra ligar

### 1. Criar a conta na Z-API e conectar o WhatsApp

1. Crie uma conta em <https://z-api.io> e uma **instância**.
2. Conecte a instância ao número de WhatsApp escaneando o **QR code** no painel
   da Z-API (igual WhatsApp Web). Use um número da Elarah, **não** o pessoal.
3. Anote do painel:
   - **ID da instância** (`ZAPI_INSTANCE_ID`)
   - **Token da instância** (`ZAPI_TOKEN`)
   - **Account Security Token** (menu Segurança) → `ZAPI_CLIENT_TOKEN`

### 2. Rodar o SQL (uma vez, no SQL Editor do Supabase)

```sql
-- se ainda não rodou:
\i sql/elarah_byelarah_followup_tracking.sql
-- histórico dos disparos:
\i sql/elarah_whatsapp_broadcasts.sql
```

(Ou cole o conteúdo dos arquivos direto no SQL Editor.)

### 3. Cadastrar os secrets no Supabase

Project Settings → Edge Functions → **Secrets**:

| Secret              | Valor                              |
| ------------------- | ---------------------------------- |
| `ZAPI_INSTANCE_ID`  | ID da instância Z-API              |
| `ZAPI_TOKEN`        | Token da instância Z-API           |
| `ZAPI_CLIENT_TOKEN` | Account Security Token (Segurança) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem no
projeto (a função usa pra validar o admin e ler o banco).

### 4. Fazer o deploy da função

```bash
supabase functions deploy whatsapp-broadcast
```

A função exige JWT de admin (`verify_jwt` no padrão `true` + checagem de
`public.is_admin()`), então só a dona/admin logada consegue disparar.

## ⚠️ Sobre risco de banimento

A Z-API automatiza um número de WhatsApp comum — **não é a API oficial da Meta**.
Disparo em massa "frio" pode fazer a Meta **banir o número**. Boas práticas:

- Aquecer o número antes (uso normal por alguns dias).
- Mensagens personalizadas (o `{NOME_PRIMEIRO}` ajuda) e sem parecer spam.
- Não exagerar no volume de uma vez; o envio já vai pausado (~1s entre cada).
- Idealmente usar um número dedicado a isso (se banir, não derruba o principal).

Se um dia quiser risco zero, dá pra trocar o adaptador `_shared/whatsapp.ts` pela
API oficial (Meta Cloud / 360dialog) — só muda a função de envio; o resto do
sistema (lista, tracking, botão, lotes) continua igual.

## Placeholders da mensagem

Resolvidos na hora do disparo:

- `{NOME_PRIMEIRO}` — primeiro nome da pessoa (preenchido pelo servidor).
- `{EXPERIENCIA_NOME}`, `{LINK}` — nome e link da experiência/landing.
- `{CUPOM}`, `{DESCONTO_PERCENT}`, `{PRECO_CHEIO}`, `{PRECO_DESCONTO}` — do cupom
  ativo vinculado à experiência (se houver).
