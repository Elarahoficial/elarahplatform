# Roadmap — Etiqueta automática no Melhor Envio (próximo passo)

Objetivo: quando um kit for **pago**, o pedido entra **sozinho** no Melhor
Envio (sem copiar/colar endereço), e a etiqueta fica pronta pra postar.

> Status: **planejado** (a cotação de frete já está no ar; isto é o passo 2).

## O que já temos (não precisa refazer)
- Cálculo de frete real (Correios) via Melhor Envio — OAuth + refresh.
- Endereço de entrega salvo em `bookings.metadata.shipping` e exibido no admin.

## Pré-requisitos (lado da Duda) — antes de eu construir
1. **Saldo na carteira do Melhor Envio.** Etiquetas são pagas; sem saldo, não
   dá pra gerar. (A compra da etiqueta debita desse saldo.)
2. **Dados de remetente completos** cadastrados no Melhor Envio: nome/razão,
   CPF ou CNPJ, endereço de origem completo, telefone e e-mail. É o que vai
   impresso como "remetente" na etiqueta.
3. **Reconectar a conta com mais permissões.** Hoje o app só tem permissão de
   *calcular frete*. Pra criar/comprar/imprimir etiqueta, precisa de escopos
   novos (`cart-write`, `shipping-checkout`, `shipping-generate`,
   `shipping-print`). Eu atualizo o código e você clica em conectar de novo
   pra autorizar as permissões novas.

## Decisão de produto (importante)
Como a etiqueta **custa dinheiro**, existem dois modos:

- **(A) Revisar e comprar — RECOMENDADO.** Quando o kit é pago, o pedido cai
  **no carrinho** do Melhor Envio já com endereço e serviço preenchidos. Você
  entra, confere e compra a etiqueta com 1 clique. *Não gasta saldo sozinho.*
- **(B) Automático total.** Assim que o kit é pago, o sistema **compra e gera**
  a etiqueta sozinho (debita o saldo na hora). Zero cliques, mas gasta
  automaticamente — e qualquer endereço errado vira etiqueta paga errada.

## Plano técnico (lado do Claude)
1. Ampliar `MELHOR_ENVIO_SCOPES` em `_shared/melhor_envio.ts` e refazer o
   connect (reautorização).
2. Hook no `stripe-webhook` (quando a booking de kit vira `pago`):
   - lê `metadata.shipping`;
   - `POST /api/v2/me/cart` (add ao carrinho) com remetente, destinatário,
     serviço escolhido (PAC/SEDEX), dimensões/peso e opções (seguro, etc.);
   - guarda o id retornado em `metadata.shipping.melhor_envio_order_id`.
   - **Modo B** adiciona: `shipment/checkout` → `generate` → `print` (PDF).
3. Admin: mostrar status da etiqueta + link pra imprimir/abrir no Melhor Envio.

## Observações
- O peso por produto (hoje fixo em 1 kg) fica mais importante aqui — vale
  adicionar peso por kit junto deste passo, pra etiqueta sair correta.
- Idempotência: garantir que um mesmo pagamento não gere etiqueta duplicada
  (chave pelo `stripe_session_id` / booking id).
