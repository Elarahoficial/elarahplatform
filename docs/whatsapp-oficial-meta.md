# WhatsApp pela API OFICIAL da Meta (Cloud API)

O envio automático da Elarah roda em cima de um **adaptador com dois
provedores**. A recomendação é a **oficial da Meta** — é a que aguenta disparo
pra lista sem risco de o número ser banido:

| | oficial (Meta Cloud API) | legado (Z-API) |
|---|---|---|
| Como conecta | número aprovado no WhatsApp Manager | QR code num número comum |
| Disparo pra lista fria | **permitido**, via template aprovado | risco real de banimento |
| Texto livre | só dentro da janela de 24h | sempre |
| Custo | por mensagem (tabela da Meta, varia por categoria) | mensalidade do serviço |

Trocar de provedor é **só secret** — nenhuma linha de código muda.

## 1. Criar os templates no WhatsApp Manager

É naquela tela de **Modelos de mensagem** (WhatsApp Manager → Modelos de
mensagem → Criar modelo). Regras que fazem a Meta recusar se não seguir:

- Nome em minúsculas com `_` (é o nome que o código procura).
- Idioma **Português (BR)** → o código manda `pt_BR`.
- Variável não pode abrir nem fechar o corpo, e duas não podem ficar coladas
  (`{{1}} {{2}}`). Os textos abaixo já respeitam isso.
- Preencha os **exemplos** de cada variável — sem isso a aprovação é negada.
- Categoria: **Marketing** pro aviso de data (é divulgação), **Utilidade** pras
  que falam de uma reserva que já existe. A Meta pode reclassificar; se
  reclassificar, só muda o preço, não o funcionamento.

Crie os seis. Copie e cole o corpo exatamente como está:

### `elarah_data_saiu` — Marketing (é o do aviso automático de data)

```
Oi, {{1}}! A data saiu ✨

Você se inscreveu pra ser avisada quando {{2}} abrisse — e acabou de entrar no ar.

🗓️ {{3}}
📍 {{4}}

Garanta sua vaga aqui: {{5}}

As vagas são poucas e quem estava na lista está sabendo primeiro 🧡
```

Exemplos pras variáveis:
`{{1}}` Maria · `{{2}}` Oficina de Perfumaria Criativa ·
`{{3}}` 24 de abril · 10h às 13h ou 14h às 17h ·
`{{4}}` Rua Nova Orleans, 34 — Brooklin ·
`{{5}}` https://elarah.com.br/index.html#by-elarah-perfumaria-criativa

### `elarah_inscricoes_abertas` — Marketing (quando abre sem data definida)

```
Oi, {{1}}! As inscrições abriram ✨

Você se inscreveu pra ser avisada quando {{2}} abrisse — e as vagas acabaram de entrar no ar.

Garanta a sua aqui: {{3}}

As vagas são poucas e quem estava na lista está sabendo primeiro 🧡
```

Exemplos: `Maria` · `Oficina de Perfumaria Criativa` ·
`https://elarah.com.br/experiencia.html?id=...`

### `elarah_reserva_confirmada` — Utilidade

```
Oi, {{1}}! Sua reserva na Elarah está confirmada ✨

{{2}}
🗓️ {{3}}
📍 {{4}}

Qualquer coisa é só responder por aqui. Até logo! 🧡
```

Exemplos: Maria · Aula de Cerâmica · 12/04 · 15h00 – 18h00 ·
Rua Capote Valente, 697 — Pinheiros

### `elarah_lembrete_48h` — Utilidade

```
Oi, {{1}}! Sua experiência na Elarah é daqui a 2 dias 🧡

{{2}}
🗓️ {{3}}
📍 {{4}}

Tá tudo de pé pra você? Se precisar ajustar algo, é só responder por aqui. A gente te espera! ✨
```

### `elarah_pedido_feedback` — Utilidade

```
Oi, {{1}}! Como foi a sua experiência? 🧡

Queremos muito saber o que você achou de {{2}} — leva 1 minutinho e ajuda demais a gente a melhorar.

⭐ Avaliar aqui: {{3}}

Obrigada por viver isso com a Elarah ✨
```

### `elarah_reserva_pendente` — Utilidade

```
Oi, {{1}}! Vi que você começou a reservar {{2}} e o pagamento não foi concluído 🙈

Sua vaga ainda pode estar disponível — quer que eu te ajude a finalizar? É só me responder por aqui. 🧡
```

**Aprovou com outro nome?** Não precisa mexer em código — cadastre o nome que
você usou no secret correspondente: `META_TEMPLATE_DATA_SAIU`,
`META_TEMPLATE_INSCRICOES`, `META_TEMPLATE_CONFIRMACAO`,
`META_TEMPLATE_LEMBRETE`, `META_TEMPLATE_FEEDBACK`, `META_TEMPLATE_PENDENTE`.

## 2. Pegar as credenciais

No **WhatsApp Manager → Configuração da API** (API Setup) do seu app:

- **ID do número de telefone** (Phone number ID) → `META_WHATSAPP_PHONE_NUMBER_ID`.
  É o ID, não o número em si.
- **Token de acesso** → `META_WHATSAPP_TOKEN`. O token que aparece ali é
  temporário (expira em 24h) e só serve pra testar. Pra produção crie um
  **usuário do sistema** em Configurações do Negócio → Usuários do sistema, dê
  a ele os acessos `whatsapp_business_messaging` e
  `whatsapp_business_management` sobre a conta do WhatsApp, e gere um token
  **sem expiração**.

Guarde o token como senha: quem tem ele manda mensagem pelo número da Elarah.

## 3. Ligar no Supabase

Project Settings → Edge Functions → **Secrets**:

```
META_WHATSAPP_TOKEN            = <token permanente>
META_WHATSAPP_PHONE_NUMBER_ID  = <id do número>
WHATSAPP_PROVIDER              = meta      (opcional, ver abaixo)
```

Sem `WHATSAPP_PROVIDER`, a simples presença das duas credenciais da Meta já
manda tudo pela oficial — cadastrar os secrets **é** a decisão de migrar. Pra
voltar pro legado em caso de emergência: `WHATSAPP_PROVIDER=zapi`.

Continuam valendo os controles de sempre: `WHATSAPP_SENDING_ENABLED=true`,
`WHATSAPP_ENV=production`, `WHATSAPP_ROLLOUT_PERCENT=100`,
`WHATSAPP_TEST_ALLOWLIST`, `WHATSAPP_OBSERVE_MODE`. Ver
`docs/whatsapp-rollout.md` e `docs/whatsapp-seguranca.md`.

Depois de salvar os secrets, **redeploy das Edge Functions** (o push no
repositório já faz).

## 4. Testar antes de valer pra cliente

No admin → WhatsApp → **testar no meu número**. Na oficial o teste sai pelo
**mesmo template aprovado** que o cliente recebe (e não pelo texto de exemplo),
então o que você vê no seu WhatsApp é exatamente o que vai chegar.

Se der erro, a mensagem já vem traduzida:

| O que aparece | O que é |
|---|---|
| Token da Meta expirado/inválido | token temporário de 24h venceu → gere o permanente |
| Fora da janela de 24h | tentou texto livre em quem não escreveu pra Elarah → precisa de template |
| Template inválido | nome/idioma diferentes do aprovado, ou nº de variáveis não bate |
| Conta restrita | a Meta limitou a conta (qualidade/denúncias) |
| Limite de envio atingido | teto de mensagens do número — sobe conforme a qualidade |

## 5. O que muda no dia a dia

- **Aviso "a data saiu", confirmação, lembrete, feedback e pendente**: saem por
  template aprovado. Funcionam pra qualquer pessoa da lista, a qualquer
  momento. Nada muda na operação.
- **Disparo em massa de texto livre** (o botão "WhatsApp automático" da lista de
  respostas): na oficial, texto livre só é **entregue a quem falou com a Elarah
  nas últimas 24h**. O painel avisa isso na confirmação. Pra lista fria, use o
  aviso automático de data (template) ou aprove um template daquela campanha.
- **Resposta da cliente**: quando ela responde, abre a janela de 24h e dá pra
  conversar em texto livre normalmente.
- **Opt-in**: a pessoa preencheu o formulário de interesse pedindo pra ser
  avisada — é o consentimento que a Meta exige. Mantenha o registro (a
  `byelarah_submissions` guarda data e origem de cada inscrição).

## Onde isso vive no código

- `supabase/functions/_shared/whatsapp.ts` — os dois provedores, os templates e
  os parâmetros de cada mensagem.
- `supabase/functions/_shared/whatsapp_gate.js` — o portão (idempotência, kill
  switch, rollout). **Não muda com o provedor**: as mesmas travas valem nos dois.
- `supabase/functions/_shared/whatsapp_e2e.test.mjs` — bateria E2E, com o fluxo
  da oficial (template certo, parâmetros na ordem, nada de texto solto,
  fail-closed sem credencial).
