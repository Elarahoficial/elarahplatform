# Promoção 20% OFF — como funciona e como desligar

Campanha que coloca **todas as experiências** com 20% de desconto **sobre o
preço que está no site**, sem precisar reeditar preço nenhum no admin.

**Janela configurada:** 18/09/2026 → 20/09/2026, 23h59 (horário de Brasília).
Flash de fim de semana.

---

## A regra do preço

```
preço promocional = PREÇO DO SITE - 20%
```

A base é o preço que estava no ar antes da campanha (`experiences.preco`) — o
mesmo que a cliente via ontem. É o que faz o banner ser verdade: anunciou 20%,
ela paga 20% a menos do que pagaria ontem.

| Preço no site | Na promoção |
|---|---|
| R$ 180 | **R$ 144** |
| R$ 610 | **R$ 488** |
| R$ 261 | **R$ 208,80** |

**Variações** (Individual / Dupla / Trio, kits) descontam sobre o preço da
opção escolhida, que é o preço dela.

### Por que NÃO usamos o `valor_cheio_centavos` como base

Aquele campo é resquício do modelo antigo, em que o catálogo já entrava com 10%
embutido e o cheio era só a referência riscada. Com o catálogo vendendo pelo
preço inteiro, descontar sobre o cheio daria **menos de 20% na tela**: numa
experiência de cheio R$ 610 vendida a R$ 549, o "20% OFF" viraria R$ 488 — 11%
de desconto real pra quem olha a página. O cheio continua servindo só pro "de"
riscado, quando estiver cadastrado e for maior que o preço do site.

(Ele também é a base do rateio com o fornecedor em `computeFinancialBreakdown`
— mexer nele mexeria em todo repasse.)

---

## Onde isso vive

| Arquivo | Papel |
|---|---|
| `promo.js` | Configuração + matemática do **navegador**, e o aviso no topo do site |
| `supabase/functions/_shared/promo.ts` | Configuração + matemática do **servidor** (o que é cobrado de verdade) |
| `experiences-data.js` | `precoVigente()` / `precoVigenteCentavos()` — o preço que toda vitrine exibe |
| `booking_guard.ts` §5c | Aplica o desconto no PIX/cartão (Mercado Pago, Pagar.me) |
| `create-checkout-session/index.ts` | Aplica o desconto no fluxo Stripe |

> ⚠️ **`promo.js` e `promo.ts` são gêmeos.** O Deno não importa o JS do site,
> então a configuração está duplicada de propósito. **Mudou em um, muda no
> outro** — percentual E datas. Se divergirem, o site anuncia um valor e o
> cartão passa outro.

O preço de cadastro no banco **não é tocado** em momento nenhum. O desconto é
calculado na hora, na exibição e na cobrança. Por isso o admin continua
mostrando (e salvando) o preço real — e desligar a promoção devolve tudo ao
normal sem nenhuma migração.

---

## Como desligar

Qualquer um dos dois:

1. **Deixar a data passar.** Depois de `FIM` a promoção se desliga sozinha, nos
   dois lados.
2. **Desligar na mão:** `ATIVA: false` em `promo.js` **e** em
   `supabase/functions/_shared/promo.ts`, e redeploy (site + edge functions).

Pra prorrogar ou mudar o percentual, é o mesmo caminho: `FIM` / `PERCENTUAL`
nos dois arquivos.

## Deploy

O desconto só fica coerente com os **dois lados no ar**:

- **Site:** publicar os arquivos estáticos (as tags `?v=` já foram
  incrementadas, então ninguém fica com JS velho em cache).
- **Edge functions:** `create-checkout-session`, `create-mp-pix-payment`,
  `create-mp-card-payment`, `create-pagarme-checkout`,
  `create-pagarme-pix-payment`, `create-pagarme-card-payment` — todas leem
  `_shared/promo.ts` e precisam ser redeployadas.

Se só o site subir, a vitrine anuncia 20% OFF e a cobrança sai cheia — o pior
dos dois erros. Suba o backend primeiro.

## Testes

```
deno test supabase/functions/_shared/promo.test.ts
```

Os casos são escritos pros dois mundos: com a campanha no ar checam o desconto;
depois que a janela fechar, checam que o preço volta intacto.

---

## Dois avisos que valem dinheiro

**1. O desconto sai inteiro da comissão da Elarah.** O repasse ao fornecedor
continua sendo calculado sobre o `valor_cheio_centavos` — não sobre o que foi
cobrado. Numa experiência de R$ 610 com 70% de repasse:

| | Fora da promoção | Na promoção |
|---|---|---|
| Cliente paga | R$ 610 | R$ 488 |
| Fornecedor recebe | R$ 427 | R$ 427 |
| Sobra pra Elarah | R$ 183 | **R$ 61** |

Em experiências com repasse acima de 80% do valor cheio, a venda passa a dar
prejuízo. Vale conferir as faixas de repasse antes de anunciar, ou combinar a
divisão do desconto com os fornecedores.

**2. O app (iOS/Android) não entra nesta campanha.** O bundle em `app/www` está
atrás do site (não tem nem o "de" riscado que já existe na web), então
sincronizá-lo traria junto várias mudanças não relacionadas. Enquanto isso, o
app mostra o preço cheio e **cobra o promocional** (o servidor é o mesmo) — o
cliente paga menos do que viu, nunca mais. Pra anunciar a promoção no app
também, é preciso rodar `npm run build` em `app/` e revisar o bundle inteiro.
