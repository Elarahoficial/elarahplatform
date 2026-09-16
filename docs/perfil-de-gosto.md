# Perfil de gosto — como a Elarah descobre quem quer o quê

> **A pergunta que isso responde:** "subi uma experiência nova — pra quem
> eu mando?"

---

## 1. O diagnóstico: por que ninguém responde

A observação que originou isso está certa e vale repetir: **nem a
avaliação está voltando.** A avaliação é 1 clique numa estrela e mesmo
assim quase ninguém responde. Se ela não volta, um formulário de
preferências ia voltar menos ainda.

O motivo não é preguiça da cliente. São três coisas na estrutura do
pedido:

| O que a avaliação faz | Efeito |
|---|---|
| Pede **favor** ("sua opinião ajuda a Elarah") | A pessoa não ganha nada. Ela já viveu a experiência, já foi embora. |
| Chega **dias depois**, por e-mail | O pico emocional passou. E-mail em BR abre pouco. |
| Pede pra **escrever** | Digitar no celular é trabalho. |

Um formulário de preferências repetiria os três erros. Então a saída
não é fazer um formulário melhor — é **não fazer formulário**.

---

## 2. A estratégia: três camadas, e só uma delas pergunta algo

### Camada 1 — Parar de perguntar o que já dá pra deduzir *(a maior)*

O banco já sabe muita coisa que ninguém nunca perguntou:

- `analytics_events` — tudo que cada pessoa olhou, clicou e filtrou
- `bookings` — o que comprou, quanto pagou, quando, com quantas pessoas
- `interesses` — quem pediu explicitamente pra ser avisada
- `reviews` — quem amou e quem não

Faltava uma coisa só: **ligar a sessão anônima à pessoa.** O truque é
que a mesma sessão que navegou anônima dispara `payment_approved` com
o `booking_id` no fim — e o booking tem e-mail. Dá pra voltar no tempo:

> "esta sessão, que olhou cerâmica 3 vezes antes de comprar, é a Bia."

Resultado: **o perfil de gosto de boa parte da base já existe hoje,
retroativo, sem ninguém ter respondido nada.** No teste com dados
reais de exemplo, a Bia — que nunca respondeu coisa alguma — aparece
corretamente classificada como interessada em cerâmica.

### Camada 2 — Quando perguntar, perguntar direito

Quatro regras, todas o oposto do que a avaliação faz hoje:

1. **Toque, não digitação.** Chip com emoji. Teclado só se a pessoa quiser.
2. **Salva a cada toque.** Não existe botão "Enviar" que decide se o dado
   existe. Quem toca 1 chip e fecha a aba já deixou o dado.
3. **Recompensa egoísta.** "Receba experiências com a sua cara", nunca
   "ajude a Elarah a melhorar".
4. **Hora certa.** Na tela logo depois de pagar — o único momento do
   funil em que a pessoa está feliz e sem nada pra fazer naquela aba.

### Camada 3 — Transformar isso em venda

O dado só vale se virar uma lista de nomes com o WhatsApp do lado.
É o que a aba **Perfil de gosto** faz.

---

## 3. O que foi construído

| Arquivo | O que é |
|---|---|
| `sql/elarah_perfil_gosto.sql` | Tabela, views e o motor de match. **Rode primeiro.** |
| `taste-capture.js` | O widget de 1 toque. Reutilizável em qualquer página. |
| `success.html` | Widget na tela pós-pagamento *(o ponto principal)* |
| `avaliar.html` | Widget **depois** da avaliação enviada |
| `combina-comigo.html` | Quiz público — capta quem ainda não comprou |
| `admin-perfil-gosto.js` | A aba nova do painel |

### Os três pontos de captura, e por que cada um

**a) Pós-compra** (`success.html`) — o principal. A pessoa acabou de
pagar. Três telas: *o que você quer viver* → *com quem você costuma vir*
→ *quer receber no WhatsApp*. E-mail, nome e telefone vêm preenchidos da
própria reserva: ela não redigita nada.

**b) Depois da avaliação** (`avaliar.html`) — aparece **só depois** de a
avaliação ser enviada, nunca antes. Antes, competiria com a avaliação e
derrubaria as duas taxas. Depois, o pedido já foi atendido e a pergunta
muda de natureza: deixa de ser favor e vira serviço.

> Detalhe de privacidade: essa página roda sem login, então de propósito
> **não recebe o e-mail de ninguém** — só o `booking_id`, que já está na
> URL. Quem identifica a pessoa é o banco, no join com `bookings`.

**c) Quiz público** (`combina-comigo.html`) — os dois de cima só alcançam
quem já comprou. Este alcança quem não comprou, que é justamente de quem
a Elarah menos sabe. A troca é invertida: a pessoa responde 4 chips, **vê
na hora 3 experiências escolhidas pra ela**, e só então aparece o "quer
que eu te avise?". Ela dá o WhatsApp porque já viu o valor.

Como o resultado é uma frase sobre ela mesma ("você é do tipo que junta
as amigas e inventa um programa que ninguém esquece"), a página é
compartilhável — serve de link na bio e de story. Vira captação, não só
coleta.

---

## 4. Como ligar (3 passos)

1. **Rode o SQL.** Supabase → SQL Editor → cole
   `sql/elarah_perfil_gosto.sql` inteiro → Run. É idempotente: se rodar
   duas vezes, não acontece nada de mau. *(Requer Postgres 15+, que é o
   caso de qualquer projeto Supabase atual.)*
2. **Publique o site.** Os arquivos novos já estão ligados nas páginas.
3. **Abra o painel → "Perfil de gosto"** (no grupo "Hoje", logo abaixo
   de Feedbacks).

A aba já funciona no passo 1, **antes de qualquer pessoa responder
qualquer coisa** — porque a Camada 1 usa dado que já existe.

---

## 5. A rotina semanal (é aqui que vira dinheiro)

**Toda vez que subir experiência nova:**

1. Painel → Perfil de gosto → "Pra quem eu mando isso?"
2. Escolhe a experiência → **Buscar pessoas**
3. Sai a lista ordenada por chance de compra, com o motivo e o WhatsApp
   escrito. Começa pelas de score alto.

A mensagem já vem personalizada com o motivo verdadeiro:

> *"Oi Duda! Aqui é da Elarah 🧡 Abriu 'Cerâmica no Torno' e abriu
> exatamente o que você pediu pra eu te avisar. Quer que eu te mande os
> detalhes?"*

Mandar pra 20 pessoas certas vende mais que pra 2.000 aleatórias — e não
queima a base.

**Uma vez por mês:** olhe o bloco "O que o público quer". O ranking de
desejo é o que dizer pro fornecedor. E os **pedidos escritos à mão** são
ouro: pouca gente digita, então quem digitou está pedindo de verdade.
Cada linha ali é uma experiência que já tem comprador esperando.

### Como a pontuação funciona

| Sinal | Pontos |
|---|---|
| Declarou querer essa categoria | +40 |
| Está na lista de espera dela | +30 |
| Tem histórico com a categoria (olhou/comprou/pediu) | +18 |
| Já comprou nessa categoria | +15 |
| Viu **esta** experiência | +12 |
| Cliente recorrente (2+ compras) | +12 |
| Faixa de preço declarada bate | +10 |
| Avaliou com 4-5 estrelas | +8 |
| Autorizou WhatsApp | +6 |
| **Já viveu esta experiência** | **−35** |

Quem pediu descadastro (`email_opt_outs`) **nunca** aparece.

---

## 6. O que medir

O primeiro número do painel responde "isso está funcionando?":
**% das compras do período que responderam**.

- Abaixo de 15% → algo está errado (widget não apareceu, ou apareceu tarde)
- 25–40% → é o esperado pra captura de 1 toque no pico
- Acima de 50% → ótimo, dá pra pedir mais um passo

Compare com a taxa de avaliação de hoje. Se o widget converter muito
mais que a avaliação — e a estrutura toda aposta que sim — vale mover o
pedido de avaliação pro WhatsApp também, com o link de estrela pronta
(`avaliar.html?nota=5`, que o código já suporta).

---

## 7. O que NÃO fazer

- **Não transformar isso em formulário.** Se acrescentar uma quarta e
  quinta pergunta no pós-compra, a taxa cai. Perfil parcial é perfil.
- **Não insistir.** O widget some sozinho pra quem já respondeu. Insistir
  é o jeito mais rápido de a pessoa passar a ignorar tudo que a Elarah
  manda.
- **Não disparar pra base inteira** só porque agora é fácil. O valor está
  em mandar pouco e certo.
- **Não prometer o que não vai cumprir.** O widget diz "só quando abrir
  algo do que você marcou". Se virar lista de novidades genérica, a
  próxima pessoa não responde.

---

## 8. Segurança e privacidade

- A tabela `taste_responses` é **caixa de correio**: o site escreve, só
  a admin lê. É o mesmo padrão já usado em `analytics_events`.
- As views usam `security_invoker = true`. Sem isso, view no Postgres
  roda como dono e passa por cima do RLS — e qualquer cliente logada
  leria nome, e-mail e telefone da base inteira. *(Esse furo existiu
  durante o desenvolvimento e foi fechado; o teste que o pegou está
  descrito abaixo.)*
- O motor de match é `SECURITY DEFINER` com `is_admin()` na primeira
  linha, e o `EXECUTE` foi revogado de `PUBLIC` — não basta revogar de
  `anon`, porque o Postgres concede a `PUBLIC` por padrão e `anon`
  herda.
- A página de avaliação nunca recebe dado pessoal no navegador.

Fronteiras verificadas contra um Postgres 16 local, com o RLS real
reproduzido:

| Quem | Escrever | Ler a base | Rodar o matcher |
|---|---|---|---|
| Visitante (`anon`) | ✅ | ❌ | ❌ |
| Cliente logada | ✅ | ❌ (0 linhas) | ❌ |
| Admin | ✅ | ✅ | ✅ |
