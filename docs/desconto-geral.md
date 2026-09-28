# Desconto geral — o percentual que vale pro site inteiro

Aba **Desconto geral** do admin (grupo Vendas). Um percentual em cima do preço
de **todas as experiências**, com validade, ligado e desligado pela admin —
sem deploy, sem mexer no preço de nenhuma experiência.

```
preço promocional = PREÇO DO SITE - percentual%
```

A base é `experiences.preco`, o preço que estava no ar antes da campanha. É o
que faz o banner ser verdade: anunciou 20%, a cliente paga 20% a menos do que
pagaria ontem. Variações (Individual / Dupla / kits) descontam sobre o preço da
própria opção.

| Preço no site | Com 20% |
|---|---|
| R$ 180 | **R$ 144** |
| R$ 610 | **R$ 488** |
| R$ 261 | **R$ 208,80** |

---

## Como usar

1. Admin → **Desconto geral**.
2. Marque **Desconto ligado**, ponha o **percentual** e as duas datas
   (começa em / vale até).
3. Os dois campos de texto do aviso são opcionais — em branco, o site escreve
   sozinho ("20% OFF em todas as experiências" / "Só até 20/09").
4. **Salvar.** Vale na hora, na vitrine e no checkout.

Os atalhos embaixo de "Vale até" (**Hoje 23h59**, **Amanhã**, **7 dias**)
preenchem a data com um clique — é onde mais escapa erro de digitação, e um
prazo digitado errado faz a barra prometer uma coisa e o site praticar outra.

O cartão **Agora no site** mostra o que está valendo neste instante, e a
**prévia** mostra a barra exatamente como ela aparece no topo do site,
contagem regressiva incluída.

### A barra no site

- Mostra **contagem regressiva** quando falta menos de 48h, sempre **com os
  segundos correndo** ("acaba em 2h 23min 56s") — é o dígito mudando na frente
  da pessoa que cria urgência; o mesmo prazo parado parece só um aviso. Acima
  de 48h ela não aparece: "acaba em 9d 4h" não apressa ninguém e ainda avisa
  que dá pra deixar pra depois.
- Se os campos de texto ficarem em branco, o site escreve sozinho — e escreve
  **"Acaba hoje à meia-noite"** quando o prazo termina hoje, em vez da data
  (quem lê "18/09" precisa parar pra lembrar que dia é hoje).
- **Quando o prazo vira com a página aberta**, a barra troca pra "A promoção
  acabou — os preços voltaram ao normal" com um botão de atualizar. Não
  recarrega sozinha de propósito: recarregar apagaria o formulário de quem
  está no meio do checkout.

Pra encerrar antes da hora: **Desligar agora**. Se a data de fim passar, o site
volta ao preço normal sozinho — não existe "desfazer" pra esquecer de fazer.

---

## O que NÃO acontece

- **O preço cadastrado de cada experiência não muda.** O desconto é calculado
  na hora, na exibição e na cobrança. Por isso a aba Experiências continua
  mostrando (e salvando) o preço real, e encerrar a campanha não exige
  redigitar preço nenhum.
- **O repasse ao fornecedor não muda.** Ele continua saindo do
  `valor_cheio_centavos` (ver aviso no fim).

---

## Onde isso vive

| Arquivo | Papel |
|---|---|
| `sql/elarah_desconto_geral.sql` | Tabela `public.desconto_geral` (linha única, id = 1) — a fonte da verdade |
| `admin.html` + `admin.js` (`renderDescontoGeral`) | A aba: lê e grava essa linha |
| `promo.js` | Lê a linha no navegador, aplica o desconto e desenha o aviso no topo |
| `experiences-data.js` | `precoVigente()` / `precoVigenteCentavos()` — o preço que toda vitrine exibe |
| `_shared/promo.ts` | Lê a MESMA linha no servidor e recalcula o preço cobrado |
| `booking_guard.ts` §5c | Aplica no PIX/cartão (Mercado Pago, Pagar.me) |
| `create-checkout-session/index.ts` | Aplica no fluxo Stripe |

**Configuração é uma só — o banco.** Navegador e servidor leem a mesma linha; o
que existe nos dois lados é só a conta. O preço cobrado nunca vem do cliente
(ver `booking_guard` §5), por isso o servidor precisa aplicar o desconto por
conta própria.

**Sem resposta do banco = sem desconto**, nos dois lados: a vitrine mostra o
preço cheio e a cobrança sai cheia. Os dois erram para o mesmo lado. O
contrário — vitrine anunciando 20% que a cobrança não honra — seria propaganda
enganosa. (No servidor há um cache de 30s que, numa falha passageira, reusa o
último valor conhecido em vez de cobrar cheio.)

---

## Deploy

1. **Rodar a migração** `sql/elarah_desconto_geral.sql` no Supabase. Ela cria a
   tabela e já deixa a linha com a campanha combinada (20% até 20/09, 23h59).
   Rodar de novo nunca sobrescreve o que a admin configurou depois.
2. **Edge functions:** `create-checkout-session`, `create-mp-pix-payment`,
   `create-mp-card-payment`, `create-pagarme-checkout`,
   `create-pagarme-pix-payment`, `create-pagarme-card-payment` — todas leem
   `_shared/promo.ts`.
3. **Site:** publicar os estáticos (as tags `?v=` já foram incrementadas).

Enquanto a migração não rodar, ninguém dá desconto — site e checkout seguem com
o preço normal. Nenhuma ordem de deploy quebra preço.

## Testes

```
deno test supabase/functions/_shared/promo.test.ts
```

A configuração é injetada nos testes, então eles valem com ou sem campanha no ar.

---

## Dois avisos que valem dinheiro

**1. O desconto sai inteiro da comissão da Elarah.** O repasse ao fornecedor
continua sendo calculado sobre o `valor_cheio_centavos` — não sobre o que foi
cobrado. Numa experiência de R$ 610 com 70% de repasse:

| | Sem campanha | Com 20% |
|---|---|---|
| Cliente paga | R$ 610 | R$ 488 |
| Fornecedor recebe | R$ 427 | R$ 427 |
| Sobra pra Elarah | R$ 183 | **R$ 61** |

Em experiências com repasse acima de 80% do valor cheio, a venda passa a dar
prejuízo. Vale conferir as faixas de repasse antes de ligar um percentual alto,
ou combinar a divisão do desconto com os fornecedores.

**2. O app (iOS/Android) não entra.** O bundle em `app/www` está atrás do site
(não tem nem o "de" riscado que já existe na web), então sincronizá-lo traria
junto várias mudanças não relacionadas. Enquanto isso, o app mostra o preço
cheio e **cobra o promocional** (o servidor é o mesmo) — o cliente paga menos do
que viu, nunca mais. Pra anunciar a campanha no app também, é preciso rodar
`npm run build` em `app/` e revisar o bundle inteiro.

---

## Desconto do carrinho (progressivo por quantidade)

Toda experiência comprada no site sai com desconto automático, sem cupom:

| Pessoas na compra | Desconto |
|---|---|
| 1 | **10% OFF** |
| 2 ou mais | **15% OFF em cada pessoa** |

Exemplo, experiência de R$ 180: 1 pessoa paga **R$ 162**; 3 pessoas pagam
3 × **R$ 153** = R$ 459.

**Na tela:**
- Faixa no topo de todas as páginas: "Até 15% OFF em todas as experiências ·
  10% OFF em qualquer experiência · 15% por pessoa comprando 2 ou mais".
- Toda vitrine mostra o preço de 1 pessoa (10% OFF) com o preço do site
  riscado: ~~R$ 180~~ **R$ 162**.
- No checkout, o Subtotal mostra o preço do site e a linha **"Desconto do
  carrinho (15% por pessoa)"** faz o abatimento.

**Regras:**
- **Só o preço da experiência desconta.** A taxa do cartão (acréscimo da
  parcela no Pagar.me / repasse no Mercado Pago) é calculada depois, em cima
  do valor já descontado — ela continua sendo cobrada. O frete dos kits não
  desconta. Compra de vale-presente não entra.
- **Não acumula com o Desconto geral.** Com uma campanha no ar, vale a
  campanha (a faixa e os preços passam a ser os dela). Cupom continua valendo
  por cima (calculado sobre o valor já descontado).
- Como o desconto geral, sai inteiro da comissão da Elarah (o repasse ao
  fornecedor não muda).
- Só no site; o app (iOS/Android) segue sem.

Onde vive: `precoFinalCentavos()` em `_shared/promo.ts` (servidor, é quem
cobra) e `promo.js` (tela: `percentualVitrine`, `carrinhoCentavos`,
`baseDe`). Os percentuais são as constantes `DESCONTO_CARRINHO_*` /
`CARRINHO_*` nos dois arquivos — mudar um exige mudar o outro.
