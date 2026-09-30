# Trocas feitas pela própria cliente

## O que mudou

Antes, pra trocar a data a cliente chamava a Elarah no WhatsApp. Agora ela faz sozinha em
**Minha conta → Minhas compras**, no link **"Remarcar"** do card da reserva (as duas opções só aparecem depois do clique). Vale **1 remarcação por reserva**; depois disso, só pelo WhatsApp.

- **Mesma experiência, outra data**: mostra só as datas que estão à venda no site (turma ativa,
  antes do encerramento de vendas e com vaga pra quantidade da reserva).
- **Outra experiência**: qualquer experiência à venda no site. Se for **mais cara**, a cliente
  paga a diferença do preço de tabela (× quantidade) no **Pix** (Mercado Pago) ou no **cartão**
  (Pagar.me, com a taxa da parcela, igual ao checkout). Se for **mais barata**, a sobra vira
  **crédito** (cupom de valor fixo, uso único, 90 dias — opção em destaque) ou, num link discreto,
  **reembolso por Pix** na chave que ela informar (a Elarah tem 72h; fica pendente na aba).
  - **A pagar** = preço de hoje da nova (com promoção) − o que ela pagou por pessoa.
  - **A receber** = o que ela pagou − o preço **cheio** da nova. **Promoção nunca vira crédito
    nem Pix**: trocar pra algo que só está mais barato por causa da campanha é troca sem diferença.
  - **Mesma experiência** (mesma ficha ou ficha com o mesmo nome e parceiro) nunca tem diferença.
  - Experiência de **agendamento livre** (ex.: Charutaria) aparece com "agendamento com a
    Elarah": a cliente deixa dia/hora de preferência (opcionais) e a Elarah combina.
  - Experiência com opções pra escolher (Individual/Dupla, modelo de pintura…) ou kit não
    aparece: nesses casos a cliente fala com a Elarah.
- **Mesma experiência em fichas separadas**: fichas com o mesmo nome e o mesmo parceiro (a mesma
  aula cadastrada várias vezes, uma data em cada) aparecem juntas em "Mesma experiência, outra
  data". Se alguma custar mais, a data mostra a diferença.
- **Prazo**: o botão só aparece dentro do prazo de remarcação sem custo congelado na compra
  (bartenderia 5 dias, gastronomia 72h, demais 48h). Fora do prazo continua o link do WhatsApp.
- **Reembolso**: continua com a Elarah. O link "Prefere reembolso?" abre o WhatsApp
  e registra o pedido na aba do painel. Fica dentro da janela de remarcação, não no card.

Na troca, o servidor segura a vaga da data nova, devolve a da antiga, atualiza a reserva (e
parceira, local e repasse quando muda de experiência) e manda a confirmação nova pra cliente
(WhatsApp + e-mail).

## Diferença a pagar

1. A cliente escolhe a opção mais cara → aparece "Diferença a pagar: R$ X".
2. Escolhe Pix (QR na hora, vale 30 min) ou cartão (parcelas com a taxa).
3. **A troca só acontece quando o pagamento aprova** (webhook do Mercado Pago / Pagar.me, ou o
   botão "Já paguei"). Até lá a reserva original continua valendo.
4. Aprovou → a reserva muda, o valor pago soma no total da reserva e a confirmação nova sai.

A vaga da data nova é conferida antes de cobrar e segurada quando o pagamento aprova (a varredura
de vagas de 10 em 10 min desfaria qualquer "segurar" fora de uma reserva). Se a data esgotar
nesse meio-tempo, a troca aparece na aba do painel em vermelho: **"pagou, mas a data esgotou"**,
pra Elarah combinar outra data ou devolver a diferença.

## Painel: aba "Trocas e reembolsos"

Cada troca aparece com o **antes → depois** e os botões de WhatsApp com a mensagem pronta:

| Tipo de troca | Aviso |
|---|---|
| Mesma experiência, outra data | 1 botão: remarcação pra parceira |
| Outra experiência, mesma parceira | 1 botão: remarcação pra parceira |
| Outra experiência, outra parceira | 2 botões: cancelamento pra antiga, reserva nova pra nova |

O clique marca como avisado (e deixa verde o "Avisar" da aba Compras). O número vermelho no
menu mostra quantas estão pendentes.

## Pra ativar (uma vez)

1. No SQL Editor do Supabase, rode `sql/elarah_trocas_reserva.sql` e depois
   `sql/elarah_trocas_reserva_pagamento.sql` (colunas do pagamento da diferença) e
   `sql/elarah_trocas_reserva_devolucao.sql` (crédito / reembolso Pix da sobra).
2. Publique as Edge Functions: GitHub → Actions → **Deploy Supabase Edge Functions** →
   **Run workflow**. Entra a função nova `cliente-trocar-reserva` e a `admin-reagendar-reserva`
   atualizada (agora divide o código de remarcação com a função nova, em
   `_shared/reagendamento.ts`).

## Arquivos

- `conta-trocas.js`: janela de troca em Minhas compras
- `supabase/functions/cliente-trocar-reserva/`: confere e aplica a troca (e registra os reembolsos)
- `supabase/functions/_shared/troca_cliente.ts`: regras da troca, aplicação e pagamento da diferença
- `supabase/functions/_shared/reagendamento.ts`: mover vaga e reenviar a confirmação
- `mp-webhook` / `pagarme-webhook`: pagamento com referência `TROCA-<id>` aplica a troca
- `admin-trocas.js`: aba "Trocas e reembolsos"
- `sql/elarah_trocas_reserva.sql`: tabela `trocas_reserva`
