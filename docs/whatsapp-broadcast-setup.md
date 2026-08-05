# WhatsApp automático pra interessados (Meta Cloud API — oficial)

Dispara automaticamente o follow-up de WhatsApp pra **todos os interessados de
uma experiência** (a lista de "Respostas do formulário" no admin), em vez de
abrir o WhatsApp pessoa por pessoa. Feito pra listas grandes (90, 170+).

> **Por que a API oficial?** A integração antiga (Z-API, número comum) foi
> restringida pela Meta ao passar do volume. A Cloud API oficial é feita pra
> escala e não corre risco de ban.

## ⚠️ O ponto que muda tudo: template aprovado

Pra quem **não te mandou mensagem nas últimas 24h** (o caso da lista do
formulário), a Meta **só deixa enviar um TEMPLATE de mensagem pré-aprovado**.
Não dá pra mandar texto livre. Então:

- Você registra o texto **uma vez** na Meta, ele é aprovado, e aí pode disparar
  pra milhares sem ban.
- O texto tem **variáveis posicionais**. O contrato que o código usa é:
  - `{{1}}` = primeiro nome da pessoa
  - `{{2}}` = nome da experiência
  - `{{3}}` = link
- Editar o corpo depois exige reaprovar na Meta.

O campo de mensagem no painel continua valendo pro **envio manual** (botões
individuais, que abrem o WhatsApp). O **disparo automático** usa o template.

## Template sugerido pra registrar (categoria: MARKETING, idioma: Português (BR))

**Nome:** `elarah_followup_experiencia`

**Corpo:**

```
Oi {{1}}! 💫 Acabou de abrir uma experiência nova aqui na Elarah: {{2}}. As vagas são bem limitadas e costumam voar. Garante a sua por aqui 👉 {{3}} — te espero!
```

Exemplos de valores (a Meta pede na hora de enviar pra aprovação):
`{{1}}` = Maria · `{{2}}` = Workshop de Ourivesaria: Crie sua Joia ·
`{{3}}` = https://elarah.com.br/joias.html

> Dica: a Meta não deixa o corpo **terminar** numa variável nem ter duas
> variáveis coladas — por isso o texto termina em "te espero!".

Depois dá pra ter templates dedicados por campanha (joia, perfumaria…) — basta
aprová-los com o **mesmo contrato de 3 variáveis** e adicionar em
`TEMPLATE_CAMPAIGNS` no `whatsapp-broadcast/index.ts`.

## Peças no código

- `supabase/functions/whatsapp-broadcast/index.ts` — Edge Function (auth de
  admin, carrega interessados, dispara em lotes, marca quem recebeu).
- `supabase/functions/_shared/whatsapp.ts` — adaptador Meta Cloud API
  (`type: template`) + normalização de telefone BR.
- `sql/elarah_byelarah_followup_tracking.sql` — colunas de "quem já recebeu".
- `sql/elarah_whatsapp_broadcasts.sql` — log agregado por campanha.
- `admin.html` / `admin.js` — botões e a lógica do modal.

## Passo a passo pra ligar

### 1. Criar a conta e o número na Meta

1. **Meta Business** (business.facebook.com) → crie/tenha um Business.
2. **WhatsApp Business Account (WABA)** dentro do Business.
3. Um app no **developers.facebook.com** com o produto **WhatsApp** adicionado.
4. **Número dedicado** pra API — ⚠️ ele **não pode ser usado no app normal do
   WhatsApp ao mesmo tempo**. Use um número **novo/separado** pra não perder seu
   WhatsApp de conversar manualmente.
5. Em **WhatsApp Manager → API Setup**, anote o **Phone Number ID**.
6. Crie um **System User** no Business com acesso ao WABA e gere um
   **token PERMANENTE** (não use o token temporário de 24h da tela de teste).

### 2. Registrar o template

Em **WhatsApp Manager → Modelos de mensagem**, crie o template do bloco acima e
aguarde a aprovação (de minutos a ~1 dia).

### 3. Rodar o SQL (uma vez, no SQL Editor do Supabase)

```sql
-- se ainda não rodou:
\i sql/elarah_byelarah_followup_tracking.sql
-- histórico dos disparos:
\i sql/elarah_whatsapp_broadcasts.sql
```

### 4. Cadastrar os secrets no Supabase

Project Settings → Edge Functions → **Secrets**:

| Secret                    | Valor                                            |
| ------------------------- | ------------------------------------------------ |
| `WHATSAPP_PHONE_NUMBER_ID`| Phone Number ID (API Setup)                      |
| `WHATSAPP_ACCESS_TOKEN`   | Token permanente do System User                  |
| `WHATSAPP_TEMPLATE_NAME`  | `elarah_followup_experiencia` (ou o que aprovar) |
| `WHATSAPP_TEMPLATE_LANG`  | `pt_BR`                                           |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem.

### 5. Deploy da função

```bash
supabase functions deploy whatsapp-broadcast
```

A função exige JWT de admin (`is_admin()`), então só a dona/admin logada dispara.

## Limites de volume (número novo)

Número novo começa limitado a **250 destinatários diferentes por 24h**, e sobe
(1.000 → 10.000 → 100.000) conforme o uso com boa qualidade + a verificação do
negócio. Pras listas de até ~172 dá tranquilo; pra volumes maiores no mesmo dia,
espace em dias. O envio já vai pausado (~0,35s entre cada) e em lotes.

## Trocar/ampliar de provedor

Todo o sistema (lista, lotes, tracking, botão, progresso) é agnóstico ao
provedor. Pra trocar (ex.: um BSP como 360dialog) ou ampliar, mexe só em
`_shared/whatsapp.ts`.
