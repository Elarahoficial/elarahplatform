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

## O arranjo padrão: só o disparo frio na oficial

Cadastrar as credenciais da Meta **não migra nada sozinho**. O que acontece é:

| Fluxo | Canal | Por quê |
|---|---|---|
| **Aviso "as inscrições abriram"** | **oficial**, assim que as credenciais existirem | é disparo pra lista fria — o que de fato arrisca banir um número comum |
| Confirmação, lembrete 48h, feedback, pendente | segue no canal de sempre | já funcionam, e são mensagens pra quem acabou de comprar (baixo risco) |

Ou seja: pra ligar o aviso automático você precisa aprovar **só um template**. Os outros quatro só entram em cena se/quando você
migrar o resto — e aí é uma decisão explícita: `WHATSAPP_PROVIDER=meta`.

⚠️ **Não** cadastre `WHATSAPP_PROVIDER=meta` antes de ter os quatro templates
transacionais aprovados: as confirmações de reserva passariam a ser recusadas
pela Meta por falta de template.

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

**Pro aviso automático, só o primeiro é obrigatório.** Os outros quatro ficam
pra quando (e se) você migrar os fluxos transacionais. Copie e cole o corpo
exatamente como está:

### `elarah_inscricoes_abertas` — Marketing (o ÚNICO do aviso By Elarah)

Uma mensagem só, que funciona com e sem data — por isso existe um template
só pra aprovar e manter.

```
Oi, {{1}}! As inscrições abriram ✨

Você se inscreveu pra ser avisada quando {{2}} abrisse — e as vagas acabaram de entrar no ar.

🗓️ {{3}}
📍 {{4}}

Garanta a sua aqui: {{5}}

As vagas são poucas e quem estava na lista está sabendo primeiro 🧡
```

Exemplos pras variáveis:
`{{1}}` Maria · `{{2}}` Crie seu Amuleto em Vitral ·
`{{3}}` 24 de abril · 10h às 13h ·
`{{4}}` Rua Nova Orleans, 34 — Brooklin ·
`{{5}}` https://elarah.com.br/experiencia.html?id=123

Quando o evento abre sem data conhecida, `{{3}}` vira **"data a confirmar"** —
nenhuma variável fica vazia (a Meta recusa) e nenhuma data é prometida à toa.

**Com a foto do evento (recomendado).** No passo "Cabeçalho" do editor,
escolha **Mídia → Imagem** e suba qualquer foto como exemplo. A Meta aprova a
ESTRUTURA, não a imagem: na hora do envio cada mensagem leva a foto do evento
em que aquela pessoa se inscreveu. Depois de aprovado assim, cadastre também o
secret:

```
META_TEMPLATE_INSCRICOES_IMAGEM = true
```

⚠️ O secret e o template têm que combinar. Template **com** cabeçalho e secret
desligado (ou o contrário) faz a Meta recusar **todos** os envios. Se não quiser
foto, aprove sem cabeçalho e não cadastre o secret. A foto tem que ser JPG ou
PNG numa URL pública (as do site servem); sem foto cadastrada no evento, vai o
logo da Elarah.

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
você usou no secret correspondente: `META_TEMPLATE_INSCRICOES`,
`META_TEMPLATE_CONFIRMACAO`,
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
META_WHATSAPP_TOKEN             = <token permanente>
META_WHATSAPP_PHONE_NUMBER_ID   = <id do número>
META_TEMPLATE_INSCRICOES_IMAGEM = true   (só se aprovou COM cabeçalho de imagem)
```

Só isso. Com esses dois secrets, o **aviso à lista** passa a sair pela oficial
e **nada mais muda** — confirmação, lembrete e feedback continuam no canal de
sempre.

Quando (e se) quiser migrar o resto, aí sim adicione
`WHATSAPP_PROVIDER=meta` — **depois** de aprovar os quatro templates
transacionais. `WHATSAPP_PROVIDER=zapi` volta tudo pro legado.

Continuam valendo os controles de sempre: `WHATSAPP_SENDING_ENABLED=true`,
`WHATSAPP_ENV=production`, `WHATSAPP_ROLLOUT_PERCENT=100`,
`WHATSAPP_TEST_ALLOWLIST`, `WHATSAPP_OBSERVE_MODE`. Ver
`docs/whatsapp-rollout.md` e `docs/whatsapp-seguranca.md`.

Depois de salvar os secrets, **redeploy das Edge Functions** (o push no
repositório já faz).

## 4. Testar antes de valer pra cliente

No admin → WhatsApp → **testar no meu número**. O botão roxo
**📲 Aviso de inscrições abertas** manda o aviso do By Elarah pelo mesmo caminho do
envio real: template aprovado, pela oficial. Os outros botões seguem o canal
padrão. Assim o que você vê no seu WhatsApp é exatamente o que a cliente vê.

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
