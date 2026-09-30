# Trocas feitas pela própria cliente

## O que mudou

Antes, pra trocar a data a cliente chamava a Elarah no WhatsApp. Agora ela faz sozinha em
**Minha conta → Minhas compras**, no link **"Remarcar"** do card da reserva (as duas opções só aparecem depois do clique). Vale **1 remarcação por reserva**; depois disso, só pelo WhatsApp.

- **Mesma experiência, outra data**: mostra só as datas que estão à venda no site (turma ativa,
  antes do encerramento de vendas e com vaga pra quantidade da reserva).
- **Outra experiência**: qualquer experiência à venda no site com **preço igual ou menor** que o
  da compra. Se for mais barata, a tela avisa que a diferença não é devolvida. Experiência mais
  cara, com opções pra escolher (Individual/Dupla, modelo de pintura…), agendamento livre ou kit
  não aparece: nesses casos a cliente fala com a Elarah.
- **Prazo**: o botão só aparece dentro do prazo de remarcação sem custo congelado na compra
  (bartenderia 5 dias, gastronomia 72h, demais 48h). Fora do prazo continua o link do WhatsApp.
- **Reembolso**: continua com a Elarah. O link "Prefere reembolso?" abre o WhatsApp
  e registra o pedido na aba do painel. Fica dentro da janela de remarcação, não no card.

Na troca, o servidor segura a vaga da data nova, devolve a da antiga, atualiza a reserva (e
parceira, local e repasse quando muda de experiência) e manda a confirmação nova pra cliente
(WhatsApp + e-mail).

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

1. No SQL Editor do Supabase, rode `sql/elarah_trocas_reserva.sql`.
2. Publique as Edge Functions: GitHub → Actions → **Deploy Supabase Edge Functions** →
   **Run workflow**. Entra a função nova `cliente-trocar-reserva` e a `admin-reagendar-reserva`
   atualizada (agora divide o código de remarcação com a função nova, em
   `_shared/reagendamento.ts`).

## Arquivos

- `conta-trocas.js`: janela de troca em Minhas compras
- `supabase/functions/cliente-trocar-reserva/`: confere e aplica a troca (e registra os reembolsos)
- `supabase/functions/_shared/reagendamento.ts`: mover vaga e reenviar a confirmação
- `admin-trocas.js`: aba "Trocas e reembolsos"
- `sql/elarah_trocas_reserva.sql`: tabela `trocas_reserva`
