# Aviso automático pra parceira a cada compra

Toda compra **paga** no site dispara, sozinha, o WhatsApp pra parceira que vai
receber a cliente — a mesma mensagem que antes dependia de alguém clicar no
botão "Avisar" da lista de Compras.

## Por que pelo número da Elarah (e não pela API oficial)

Vai pelo **canal de sempre**: o número da Elarah conectado por QR code. Isso é
uma decisão, não uma limitação:

- a conversa aparece **no WhatsApp da Elarah**, como qualquer outra;
- dá pra **ler o que a parceira responde** e responder ali mesmo;
- o histórico fica junto com o resto da conversa com aquela parceira.

Pela API oficial da Meta o número sai do app: as respostas chegariam só por
webhook, e seria preciso uma ferramenta externa pra ver as conversas. Pra
mensagem de cliente (disparo frio, centenas de pessoas) a oficial compensa;
pra conversa com parceira, não — são poucas mensagens por dia, pra gente que
já conversa com a Elarah e responde.

Por isso este aviso **nunca** usa template oficial, mesmo com as credenciais da
Meta cadastradas.

## A mensagem

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
