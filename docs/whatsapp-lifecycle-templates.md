# Templates de WhatsApp do ciclo da Elarah (pra aprovar na Meta)

Todos os 5 fluxos de mensagem automática vão pela **API oficial da Meta**, que
exige um **template aprovado** por tipo de mensagem. A aprovação é a parte lenta
(de minutos a ~1 dia por template) — então **registre os 5 primeiro**, enquanto a
parte de código é construída em paralelo.

Onde registrar: **WhatsApp Manager → Modelos de mensagem → Criar modelo**.
Idioma: **Português (BR)** (`pt_BR`). Na hora de enviar pra aprovação, a Meta
pede um **exemplo** de cada variável — use os exemplos indicados.

> Regras da Meta que os textos abaixo já respeitam: o corpo não pode **terminar**
> numa variável nem ter **duas variáveis coladas**. Pode ajustar o texto, só
> mantenha essas regras e a **ordem das variáveis**.

---

## 1. Boas-vindas + grupo (no cadastro)

- **Nome:** `elarah_boas_vindas_grupo`
- **Categoria:** Marketing
- **Variáveis:** `{{1}}` = primeiro nome · `{{2}}` = link do grupo
- **Corpo:**

```
Oi {{1}}! Que bom ter você na Elarah 💛 A gente libera experiências no nosso grupo antes de todo mundo — e algumas esgotam só por lá. Entra aqui pra não perder: {{2}} — te vejo lá! ✨
```

Exemplo: `{{1}}` = Maria · `{{2}}` = https://chat.whatsapp.com/XXXXXXXX

---

## 2. Confirmação de reserva (quando a compra é paga)

- **Nome:** `elarah_confirmacao_reserva`
- **Categoria:** Utilidade
- **Variáveis:** `{{1}}` nome · `{{2}}` experiência · `{{3}}` data · `{{4}}` horário
- **Corpo:**

```
Oi {{1}}! Sua reserva na Elarah está confirmada ✨ Experiência: {{2}}, no dia {{3}} às {{4}}. Chega uns 10 minutinhos antes pra aproveitar tudo com calma. Qualquer coisa, é só responder aqui. Até lá! 💛
```

Exemplo: `{{1}}` = Maria · `{{2}}` = Oficina de Perfumaria Criativa ·
`{{3}}` = 12/08 · `{{4}}` = 15h

---

## 3. Pagamento pendente

- **Nome:** `elarah_pagamento_pendente`
- **Categoria:** Utilidade
- **Variáveis:** `{{1}}` nome · `{{2}}` experiência · `{{3}}` link de pagamento
- **Corpo:**

```
Oi {{1}}! Vi que a sua reserva da experiência {{2}} ficou com o pagamento pendente. Sua vaga ainda está guardada 💛 É só concluir por aqui 👉 {{3}} — qualquer dúvida, me chama!
```

Exemplo: `{{1}}` = Maria · `{{2}}` = Workshop de Ourivesaria ·
`{{3}}` = https://elarah.com.br/checkout/XXXX

---

## 4. Lembrete 2 dias antes

- **Nome:** `elarah_lembrete_2dias`
- **Categoria:** Utilidade
- **Variáveis:** `{{1}}` nome · `{{2}}` experiência · `{{3}}` data · `{{4}}` horário
- **Corpo:**

```
Oi {{1}}! Passando pra lembrar: a sua experiência {{2}} é daqui a 2 dias, no dia {{3}} às {{4}} 💫 A gente mal pode esperar por você. Qualquer imprevisto, é só responder aqui!
```

Exemplo: `{{1}}` = Maria · `{{2}}` = Pintura de Quadro com Cristal ·
`{{3}}` = 14/08 · `{{4}}` = 19h

---

## 5. Feedback (depois da experiência)

- **Nome:** `elarah_feedback`
- **Categoria:** Marketing (pedido de avaliação)
- **Variáveis:** `{{1}}` nome · `{{2}}` experiência · `{{3}}` link de avaliação
- **Corpo:**

```
Oi {{1}}! Como foi viver a experiência {{2}}? 🥰 A sua opinião ajuda demais a Elarah a crescer — conta pra gente em 1 minutinho aqui 👉 {{3}} — obrigada de coração! 💛
```

Exemplo: `{{1}}` = Maria · `{{2}}` = Aula de Cerâmica ·
`{{3}}` = https://elarah.com.br/avaliar.html?r=XXXX

---

## Contrato de variáveis (pro código)

Cada fluxo terá seu nome de template num secret do Supabase, e o código preenche
as variáveis na ordem acima. Categorias de custo: **utilidade** (2, 3, 4) é
barata/às vezes grátis; **marketing** (1, 5) custa uns centavos por envio.

| Fluxo | Template (secret)                        | Gatilho             |
| ----- | ---------------------------------------- | ------------------- |
| 1     | `WHATSAPP_TPL_BOAS_VINDAS`               | no cadastro         |
| 2     | `WHATSAPP_TPL_CONFIRMACAO`               | pagamento aprovado  |
| 3     | `WHATSAPP_TPL_PENDENTE`                  | reserva pendente    |
| 4     | `WHATSAPP_TPL_LEMBRETE`                  | cron diário (D-2)   |
| 5     | `WHATSAPP_TPL_FEEDBACK`                  | cron diário (D+1)   |

## Pré-requisito de dados

O checkout precisa **gravar o telefone na reserva** (hoje salva só e-mail) pra
os fluxos 2–5 saírem por WhatsApp. É o primeiro ajuste de código do plano.
