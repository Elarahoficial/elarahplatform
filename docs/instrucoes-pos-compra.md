# Instruções automáticas depois da compra

Algumas experiências exigem uma **ação da cliente** logo depois da compra:
preencher o cadastro do parceiro, entrar num link, saber em que sala é, levar
um documento. Antes, essa mensagem dependia de alguém lembrar de mandar — e
quando esquecia, a pessoa chegava no dia sem estar registrada.

Agora o texto fica cadastrado, e sai sozinho.

## Onde escrever — o normal é no PARCEIRO

A mensagem quase sempre é a mesma do parceiro, não muda de experiência pra
experiência. Por isso há dois lugares, e a regra é simples:

| Onde | Pra que serve |
| --- | --- |
| **Admin → Fornecedores → abrir o parceiro** | O texto **padrão** dele. Vale pra **todas** as experiências desse parceiro. É aqui que você escreve normalmente. |
| **Admin → Experiências → editar a experiência** | A **exceção**. Preenchido, **substitui** o texto do parceiro só naquela experiência. |

Na hora de enviar, a ordem é:

```
texto da experiência  →  texto do parceiro  →  não envia nada
```

Os dois vazios = a cliente recebe só a confirmação, como sempre foi.

O parceiro é encontrado pelo **nome** (o mesmo que aparece na experiência),
então basta o parceiro estar cadastrado em Fornecedores com esse nome.

## Como usar

Escreva o texto como você mandaria no WhatsApp, com quebras de linha:

```
Pra garantir seu lugar, o parceiro precisa te registrar na aula.
Preencha este cadastro: https://exemplo.com/cadastro
Leva 2 minutinhos 🧡
```

**Vazio = não envia nada** — as experiências que não precisam continuam
exatamente como estão hoje.

A cliente recebe assim:

> Oi, Maria! Só mais um passo pra sua vaga ficar certinha 🧡
>
> **Aula de Coquetelaria**
>
> Pra garantir seu lugar, o parceiro precisa te registrar na aula.
> Preencha este cadastro: https://exemplo.com/cadastro
> Leva 2 minutinhos 🧡
>
> Qualquer dúvida é só responder por aqui ✨

## Quando sai

Logo depois da **confirmação de reserva**, como uma **segunda mensagem**. É
separada de propósito: é uma ação a fazer, e misturada na confirmação ela se
perde no meio de data, local e horário.

Vale pra qualquer forma de pagamento (Stripe, Mercado Pago, Pagar.me e a
confirmação manual), porque o envio está no mesmo ponto que já manda a
confirmação.

## O que impede mensagem repetida ou indevida

Passa pelo mesmo portão das outras mensagens automáticas:

- **Uma por reserva.** Chave `instrucoes:<booking_id>` na `whatsapp_send_log`.
  Webhook que chega duas vezes não manda duas mensagens.
- **Só reserva paga.** Reserva pendente ou cancelada não dispara nada.
- **Respeita "aguardando experiência".** Reserva suprimida não recebe nem a
  confirmação nem as instruções.
- **Kill switch, rollout, allowlist e modo observação** valem igual.
- Se a segunda mensagem falhar, a confirmação **não** é afetada — o erro fica
  no log.

## Fornecedores com fluxo próprio (BaresSp, Lado B)

Continuam funcionando como antes, pelo botão do painel. A diferença é que
agora dá pra fazer o mesmo **sem código**: cole o texto deles na **ficha do
parceiro** (Fornecedores), uma vez só, e vale pra todas as experiências
daquele parceiro.

## Se um dia o transacional migrar pra API oficial da Meta

Hoje essas mensagens saem pelo canal de sempre e aceitam texto livre, com
quebras de linha e links. Na API oficial, a mensagem precisaria de template
aprovado — e **parâmetro de template não aceita quebra de linha**, então o
texto viraria uma linha só.

O código já manda os parâmetros do template `elarah_instrucoes_pos_compra`
({{1}} nome, {{2}} experiência, {{3}} o que fazer) pra esse caso. Se isso
acontecer, o ideal é aprovar um template por instrução recorrente, com o texto
fixo no corpo, em vez de uma variável gigante.

## Peças no código

- `sql/elarah_experiences_instrucoes_pos_compra.sql` — as duas colunas
  (`fornecedores_metadata.instrucoes_pos_compra` e
  `experiences.instrucoes_pos_compra`).
- `supabase/functions/_shared/whatsapp.ts` —
  `postPurchaseInstructionsWhatsAppText` e o envio dentro de
  `sendBookingConfirmationGated`.
- `admin.html` / `admin.js` / `experiences-data.js` — o campo na experiência.
- `admin.js` (`openFornecedorModal`) — o campo na ficha do parceiro.
- `supabase/functions/_shared/whatsapp_e2e.test.mjs` — fluxo coberto na
  bateria E2E (sai junto da confirmação, não duplica em webhook repetido, não
  sai sem texto cadastrado, não sai em reserva suprimida, cai no texto do
  parceiro quando a experiência não tem, e o da experiência sobrescreve o do
  parceiro).

## Conferir

```sql
-- Parceiros com texto padrão cadastrado:
select fornecedor_nome, instrucoes_pos_compra
  from fornecedores_metadata
 where coalesce(btrim(instrucoes_pos_compra), '') <> ''
 order by fornecedor_nome;

-- Experiências que sobrescrevem o texto do parceiro:
select nome, fornecedor_nome, instrucoes_pos_compra
  from experiences
 where coalesce(btrim(instrucoes_pos_compra), '') <> ''
 order by nome;

-- Quem recebeu:
select phone_masked, status, booking_id, created_at
  from whatsapp_send_log
 where kind = 'instrucoes'
 order by created_at desc;
```
