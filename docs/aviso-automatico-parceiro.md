# Aviso automático pra parceira a cada compra

Toda compra **paga** no site dispara, sozinha, o WhatsApp pra parceira que vai
receber a cliente — a mesma mensagem que antes dependia de alguém clicar no
botão "Avisar" da lista de Compras.

## Por onde sai

Segue o **provedor padrão**, que hoje é a **API oficial da Meta** — o número da
Elarah migrou pra Cloud API e um número não pode estar nos dois canais ao mesmo
tempo. Então este aviso vai por **template aprovado**: `elarah_aviso_parceira`.

As respostas da parceira chegam na **Caixa de Entrada do Meta Business Suite**,
não no app do WhatsApp. É lá que se lê e responde.

**Grupo não dá.** A Cloud API não envia para grupos — só 1 a 1, de número para
número. Não é configuração: o recurso não existe na API oficial. Se a parceira
tem mais de uma pessoa que precisa saber, o caminho é cadastrar mais de um
número (hoje o cadastro guarda um só).

## O template: cinco variáveis, não sete

O corpo aprovado na Meta tem os **rótulos fixos** e só os valores variáveis:

```
Olá! Você recebeu uma nova reserva pela Elarah.

Experiência: {{1}}
Quando: {{2}}
Vagas: {{3}}
Em nome de: {{4}}
Contato da cliente: {{5}}

Qualquer dúvida, é só responder por aqui.
```

Eram sete. Caíram duas, por motivos diferentes:

- **O local saiu** porque é a casa da própria parceira — ela não precisa que a
  gente diga o endereço dela.
- **Telefone e e-mail viraram um campo só** ("Contato"), porque o classificador
  da Meta recusa como Marketing um modelo que é quase só variável. Com rótulo
  fixo ao lado de cada valor, o corpo tem texto de verdade e passa como
  Utilidade — foi exatamente o que destravou o `elarah_instrucoes_pos_compra`.

⚠️ A **contagem** tem que bater: mandar 7 parâmetros num modelo de 5 faz a Meta
recusar a mensagem inteira. Se o modelo mudar lá, `supplierBookingTemplateParams`
em `whatsapp.ts` muda junto.

## A mensagem (no canal legado, de emergência)

> Oi! Tudo bem? Passando para te avisar que você tem **2 vagas confirmadas**
> para a experiência **Aula de Coquetelaria** no dia **12/04** às **15h00**.
>
> 👤 **Em nome de:** Maria Silva
> ➕ **Mais 1 pessoa** — a compra foi de 2 vagas e o nome não foi informado no checkout.
> 📱 **WhatsApp:** (11) 91234-5678
> ✉️ **E-mail:** maria@exemplo.com
> 📍 **Local:** Av. Faria Lima, 1572 — Pinheiros
>
> O repasse será feito até 48h antes do evento.

A **quantidade** vem do que foi comprado (`bookings.quantidade`), não da
contagem de nomes — era esse o furo: compra de 2 vagas com 1 nome informado
chegava como "1 aluno confirmado" e a parceira preparava material pra menos
gente. Quando todos os nomes são informados, a linha do "➕ Mais 1 pessoa" não
aparece.

Telefone e e-mail entram porque é com eles que a parceira registra a pessoa.

## Quando sai, e quando não sai

Sai logo depois da confirmação da cliente, no mesmo ponto que já manda as
outras mensagens — vale pra Stripe, Mercado Pago, Pagar.me e confirmação
manual.

**Não sai** quando:

- a reserva não está **paga**;
- a reserva está como **"aguardando experiência"** (sem data definida ainda —
  não há o que avisar);
- a parceira **não tem WhatsApp cadastrado** no painel Fornecedores (aí o
  botão manual continua lá, como sempre);
- o envio de WhatsApp está desligado (kill switch) ou fora do rollout.

⚠️ Se `WHATSAPP_ROLLOUT_PERCENT` estiver abaixo de 100, parte dos avisos não
sai — e a lista de Compras vai mostrar essas reservas como **não avisadas**,
pra você completar no botão. Pra este fluxo o ideal é 100.

## O que evita mensagem repetida

- **Uma por reserva.** Chave `fornecedor:<booking_id>` na `whatsapp_send_log`:
  webhook que chega duas vezes não manda duas mensagens.
- **Carimba `fornecedor_avisado_at`** no envio real, então a lista de Compras
  mostra **✓ Avisado** sozinha — e você enxerga na hora quem ficou de fora.
- Falha no aviso da parceira **nunca** derruba a confirmação da cliente.

## Desligar

Secret `WHATSAPP_AVISO_FORNECEDOR=false` volta tudo pro envio manual pelo
painel. O botão nunca sai da tela — o automático só chega antes.

## Peças no código

- `supabase/functions/_shared/whatsapp.ts` — `supplierBookingWhatsAppText`
  (o texto) e `sendSupplierBookingNoticeGated` (resolve a parceira, envia,
  carimba).
- `admin.js` — o botão manual, com a mesma mensagem (vendas do site e vendas
  manuais).
- `supabase/functions/_shared/whatsapp_e2e.test.mjs` — fluxo coberto na
  bateria E2E.

## Conferir

```sql
-- Avisos que saíram sozinhos:
select phone_masked, status, booking_id, created_at
  from whatsapp_send_log
 where kind = 'fornecedor'
 order by created_at desc;

-- Compras pagas que ainda não têm parceira avisada:
select id, nome, experiencia_nome, data, fornecedor_nome
  from bookings
 where status = 'pago' and fornecedor_avisado_at is null
 order by created_at desc;
```
