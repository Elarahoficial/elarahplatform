# Frete automático — Elarah em Casa (Melhor Envio)

Guia rápido pra ligar o cálculo de frete real (Correios PAC/SEDEX) na aba
**Elarah em Casa**. Tudo no código já está pronto — falta só **colar o token**
da sua conta Melhor Envio nas configurações do Supabase.

## Como está hoje

Quando o cliente clica em **"Quero meu kit"**, o site:

1. Pede o endereço e busca tudo pelo CEP automaticamente;
2. Calcula o frete e mostra as opções (PAC/SEDEX);
3. Soma o frete ao total e cobra junto no cartão.

Estados possíveis do cálculo (escolhido automaticamente):

| Situação | O que o cliente vê |
|---|---|
| **Token Melhor Envio configurado** | Preço **real** dos Correios (produção) ✅ |
| **Sem token** (padrão atual) | Frete **estimado** por região (aproximado) |
| `SHIPPING_MODE=free` | Frete grátis (só pra promoção pontual) |

> A partir de agora o padrão **não é mais "frete grátis"**: sem o token, o site
> já cobra uma **estimativa**. Com o token, passa a cobrar o **valor exato**.

## Passo a passo pra ligar o preço real

### 1. Pegar o token no Melhor Envio

1. Entre em <https://melhorenvio.com.br> com sua conta.
2. Vá em **Configurações → Tokens / Integrações** (menu da sua conta).
3. Gere um **token de API** com permissão de **cálculo de frete**
   (`shipping-calculate`). Copie o código gerado (é um texto bem longo).

### 2. Colar o token no Supabase

1. Abra o painel do Supabase do projeto Elarah → **Project Settings →
   Edge Functions → Secrets** (ou **Configuration → Secrets**).
2. Adicione os secrets abaixo:

   | Nome do secret | Valor | Obrigatório? |
   |---|---|---|
   | `MELHOR_ENVIO_TOKEN` | o token longo que você copiou | **Sim** |
   | `SHIPPING_ORIGIN_CEP` | o CEP de onde você posta os kits (ex.: `01310-100`) | Recomendado |
   | `MELHOR_ENVIO_BASE` | deixe **em branco** (já vai pra produção). Só preencha com `https://sandbox.melhorenvio.com.br` se quiser testar | Não |

3. Salve.

### 3. Redeploy das funções

Os secrets só passam a valer depois que as Edge Functions são publicadas de
novo. Republique (redeploy) as funções `calculate-shipping` e
`create-checkout-session`. Pronto — o site já mostra o preço real dos Correios.

## Como testar

1. Abra um kit na aba **Elarah em Casa** e clique em **"Quero meu kit"**.
2. Digite um CEP e clique em **Calcular frete**.
3. Se aparecer **PAC / SEDEX (Correios)** com preços, está no ar. ✅

## Observações

- **Produtos novos** entram no cálculo automaticamente: qualquer kit com
  "kit", "diy" ou "em casa" no nome/categoria já aparece na vitrine e já usa
  o frete.
- **Peso:** hoje todo kit usa **1 kg** como padrão. Se os kits novos forem
  bem mais pesados/maiores, dá pra adicionar um campo de peso por produto
  depois — me avise que eu faço.
- **Segurança:** o frete é sempre **recalculado no servidor** na hora de
  cobrar; o site nunca confia no valor que veio da tela do cliente.
