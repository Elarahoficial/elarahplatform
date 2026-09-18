# Promoção 20% OFF — como funciona e como desligar

Campanha que coloca **todas as experiências** com 20% de desconto **sobre o
valor cheio**, sem precisar reeditar preço nenhum no admin.

**Janela configurada:** 18/09/2026 → 27/09/2026, 23h59 (horário de Brasília).

---

## A regra do preço

```
preço promocional = VALOR CHEIO - 20%
```

- **Valor cheio** = o campo `valor_cheio_centavos` da experiência (o mesmo que
  já aparecia riscado no card). É a base do desconto.
- **Sem valor cheio cadastrado** (By Elarah, onde cheio == praticado): a base
  vira o próprio preço praticado.
- **Variações** (Individual / Dupla / Trio, kits): não têm valor cheio próprio,
  então os 20% saem do preço da opção escolhida.
- **Trava de segurança:** a promoção **nunca aumenta preço**. Se a experiência
  já era vendida abaixo de "cheio − 20%", ela mantém o preço menor.

Exemplos:

| Experiência | Valor cheio | Preço praticado | Na promoção |
|---|---|---|---|
| Parceira | R$ 610 | R$ 549 | **R$ 488** |
| By Elarah (sem cheio) | — | R$ 180 | **R$ 144** |
| Já vendida barata | R$ 610 | R$ 400 | **R$ 400** (trava) |

O "de" riscado na vitrine passa a ser sempre a maior referência honesta: o
valor cheio quando existe, senão o preço praticado.

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
continua sendo calculado sobre o **valor cheio** (`computeFinancialBreakdown`
não olha o que foi cobrado). Numa experiência de R$ 610 com 70% de repasse:

| | Fora da promoção | Na promoção |
|---|---|---|
| Cliente paga | R$ 549 | R$ 488 |
| Fornecedor recebe | R$ 427 | R$ 427 |
| Sobra pra Elarah | R$ 122 | **R$ 61** |

Em experiências com repasse acima de 80% do valor cheio, a venda passa a dar
prejuízo. Vale conferir as faixas de repasse antes de anunciar, ou combinar a
divisão do desconto com os fornecedores.

**2. O app (iOS/Android) não entra nesta campanha.** O bundle em `app/www` está
atrás do site (não tem nem o "de" riscado que já existe na web), então
sincronizá-lo traria junto várias mudanças não relacionadas. Enquanto isso, o
app mostra o preço cheio e **cobra o promocional** (o servidor é o mesmo) — o
cliente paga menos do que viu, nunca mais. Pra anunciar a promoção no app
também, é preciso rodar `npm run build` em `app/` e revisar o bundle inteiro.
