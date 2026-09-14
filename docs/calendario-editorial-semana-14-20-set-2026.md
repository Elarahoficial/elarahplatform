# Calendário Editorial Elarah — Semana 14 a 20/09/2026

> **Período:** segunda 14/09 a domingo 20/09/2026
> **Base:** dados reais do Agente de Eventos (vendas, temas, lotação das turmas), não catálogo de exemplo.
> **Gancho:** **primavera entra dia 22/09.** É o único gancho de calendário da semana — e por sorte ele aponta exatamente pros temas que mais dão dinheiro.
> **Formato-carro-chefe:** carrossel (melhor performance na análise) — 3 na semana.

---

## 1. O que os dados dizem (e o que isso muda no conteúdo)

**Ticket médio da casa: R$ 203,74** (865 unidades / R$ 176.232,28 nos 8 temas principais).

### Temas, ordenados pelo que importa — ticket, não volume

| Tema | Receita | Un. | **Ticket** | % receita | |
|---|---|---|---|---|---|
| Gastronomia | R$ 18.645,68 | 55 | **R$ 339,01** | 10,6% | 🔼 acima da média |
| Floral | R$ 13.818,03 | 56 | **R$ 246,75** | 7,8% | 🔼 acima da média |
| Perfumaria | R$ 26.274,61 | 116 | **R$ 226,51** | 14,9% | 🔼 acima da média |
| Cerâmica | R$ 33.516,08 | 153 | **R$ 219,06** | 19,0% | 🔼 acima — **mas lotada** |
| Vela | R$ 31.967,64 | 178 | R$ 179,59 | 18,1% | 🔽 |
| Pintura | R$ 34.002,78 | 195 | R$ 174,37 | 19,3% | 🔽 |
| Crochê | R$ 8.896,20 | 53 | R$ 167,85 | 5,0% | 🔽 |
| Sabonete | R$ 9.111,26 | 59 | R$ 154,43 | 5,2% | 🔽 |

### As cinco leituras que montam a semana

**1. Pintura lidera em receita mas é a 3ª pior em ticket (R$ 174).** É porta de entrada, não caixa registradora. Serve pra alcance — não gaste carrossel de conversão com ela.

**2. Os quatro temas acima do ticket médio são Gastronomia, Floral, Perfumaria e Cerâmica.** Cerâmica está 100% lotada. **Sobram três pra empurrar essa semana: Gastronomia, Floral e Perfumaria** — e a primavera (22/09) cai em cima de Floral e Perfumaria botânica. O gancho sazonal e o dado apontam pro mesmo lugar.

**3. Não venda o que está esgotado.** Incensos Naturais 118%, Ourives por 1 Dia 100%, Modelagem em Cerâmica 100%. Conteúdo sobre esses não converte — converte em frustração. Use pra **capturar lista de espera** e justificar turma nova.

**4. Três turmas com 20% são o alvo real do conteúdo da semana:** Modelagem em Cerâmica (a outra turma), **Jantar às Cegas – Sabores, Sensações e Sentidos** e Faça seu Amigurumi. O Jantar às Cegas é o caso mais gritante: Gastronomia é o **maior ticket da casa (R$ 339)**, o conceito é sensorial e nativo de vídeo, e está parado em 20%. Não é problema de produto — é problema de ninguém saber que existe.

**5. Joalheria é o maior ticket individual: R$ 509,43** (11 vendas, R$ 5.603,75). E Ourives por 1 Dia está 100% lotada. Desejo alto, oferta curta. Merece conteúdo de presente/premium e turma nova — não desconto.

### Carro-chefe confirmado
**Criando seu Perfume Natural** — 47 vendas, R$ 8.650,94, ticket R$ 184. Mais vendido da casa. Perfumaria inteira: R$ 26.274,61 com ticket R$ 226,51.

---

## 2. ⚠️ Achado fora do calendário: a busca do site está perdendo venda

O painel lista em *"categorias novas (o que buscam e a gente não tem)"*:

- **`bolsa croche` (2 buscas)** → mas *Oficina de Bolsa de Crochê* existe e vendeu **33 unidades / R$ 5.545,87**
- **`sabonetes` (1 busca)** → mas Sabonete é um tema com **59 unidades / R$ 9.111,26**
- **`pintura em porcelana`, `pintura giz`** → Pintura é o maior tema da casa

Essas pessoas **não** buscaram algo que você não tem. Elas buscaram algo que você tem e o site respondeu "não achei".

**Causa, em `script.js:320-329`:** o filtro é `campo.toLowerCase().includes(termo)` puro. Sem normalizar acento e sem quebrar em palavras. Então:

- `"bolsa croche"` falha duas vezes: `crochê ≠ croche` **e** o título é *"Bolsa **de** Crochê"* — a frase não é contígua
- `"sabonetes"` falha porque `"Sabonete Artesanal".includes("sabonetes")` é falso — plural
- qualquer busca de duas palavras que não estejam exatamente coladas na mesma ordem falha

`categoria.js` e `admin.js` já normalizam com `normalize('NFD')` — só a busca da home ficou de fora.

**Correção:** normalizar acento e casar termo a termo (todas as palavras presentes em qualquer campo), em vez de exigir a frase inteira. É uma mudança pequena e contida. **Não mexi no código** — é fora do escopo de calendário. Fica a decisão.

---

## 3. Resumo da semana

| Dia | Carrossel | Reel / TikTok | Stories | WhatsApp | LinkedIn |
|---|---|---|---|---|---|
| **Seg 14** | — | — | Abertura + "se eu fosse sua amiga" | ✅ 13h — **as 3 novidades** | — |
| **Ter 15** | ✅ **Primavera: Floral + Perfumaria** | — | Bastidor + enquete | — | — |
| **Qua 16** | — | ✅ **Jantar às Cegas** | Prévia + chamada pra comunidade | ✅ 14h — **votação do cupom** | — |
| **Qui 17** | ✅ **Com a sua amiga (turmas vazias)** | — | Parcial da votação + quiz | — | ✅ 9h |
| **Sex 18** | ✅ **Fim de semana com vaga** | — | Agenda, 1 link por card | ✅ 18h — **cupom + lista de espera** | — |
| **Sáb 19** | — | ✅ **Bastidor do Perfume Natural** | Cobertura + #fizelarah | — | — |
| **Dom 20** | — | — | "Último domingo de inverno" | — | — |

> **Regra da semana:** o conteúdo vende **o que tem vaga**. Nada de carrossel lindo de Ourives com 100% de lotação.

---

## 4. Os 3 carrosséis

### 🟠 Carrossel 1 — Terça 15/09, 19h · **Primavera**
**Título:** *"A primavera começa dia 22. Essas experiências já estão cheirando a ela."*
**Por que esse:** Floral (ticket R$ 246,75) e Perfumaria (R$ 226,51) estão **acima do ticket médio da casa**, e a estação entrando dá o motivo pra falar delas agora sem parecer anúncio.

| Card | Conteúdo |
|---|---|
| 1 | Capa: *"A primavera começa dia 22"* |
| 2 | *"Falta uma semana. Dá tempo de fazer alguma coisa que marque a virada — em vez de só reparar que as árvores mudaram."* |
| 3 | **Criando seu Perfume Natural** — carro-chefe (47 vendas), ~R$ 184 |
| 4 | **Buquê de Flores & Home Spray** — ~R$ 209 |
| 5 | **Oficina Olfativa Botânica** — perfume botânico, ~R$ 365 |
| 6 | **Arranjos Florais** — ~R$ 325 |
| 7 | *"Salva. A primavera começa dia 22 e você vai lembrar disso no dia 21."* |

**Legenda:**
> A primavera começa dia 22. Faltam sete dias.
>
> Separei o que a gente tem que já é cheiro e cor de primavera — perfume que você mesma formula, buquê, arranjo.
>
> 🧡 Salva aí. Você vai lembrar disso no dia 21, e aí já era.
> Link na bio.
>
> #primavera #oquefazeremsp #saopaulo #perfumaria #experienciasoffline #elarah

---

### 🟠 Carrossel 2 — Quinta 17/09, 19h · **Com a amiga**
**Título:** *"5 coisas pra fazer com a sua amiga em SP que não são bar"*
**Por que esse:** é o formato mais compartilhável da casa — e aqui ele serve de propósito duplo: **todos os cards são turmas que precisam encher.**

| Card | Conteúdo |
|---|---|
| 1 | Capa |
| 2 | *"Vocês duas já tentaram marcar 4 vezes esse mês. Sempre vira 'bora tomar alguma coisa' e acaba em conversa de 40 minutos no barulho."* |
| 3 | **Jantar às Cegas – Sabores, Sensações e Sentidos** (20% cheio · o mais forte do carrossel) |
| 4 | **Faça seu Amigurumi** (20% cheio) |
| 5 | **Modelagem em Cerâmica** — *só a turma com vaga* |
| 6 | **Oficina de Bolsa de Crochê** (33 vendas, funciona) |
| 7 | **"Marca a amiga que você ia chamar."** — não tire, é o card que gera alcance |

**Legenda:**
> Marcar com amiga em SP virou isso: grupo no WhatsApp, 4 tentativas, e no fim "bora tomar alguma coisa".
>
> Aqui vão 5 programas que vocês fazem juntas e saem com alguma coisa na mão — não só com a conta.
>
> 👯‍♀️ Marca ela aqui embaixo.
>
> #atividadescomamigas #oquefazeremsp #amigas #saopaulo #elarah

**Link:** `elarah.com.br/atividades-com-amigas-em-sp.html` (landing já existe)

---

### 🟠 Carrossel 3 — Sexta 18/09, 12h · **Fim de semana**
**Título:** *"O que fazer neste fim de semana em SP · 19 e 20/09"*
**Regra de montagem:** só experiências com **vaga real** confirmada no admin. Se uma encheu entre quinta e sexta, tira do carrossel.

| Card | Conteúdo |
|---|---|
| 2 | *"Último fim de semana de inverno. Sábado que vem já é outra estação."* |
| 3-5 | Experiências com vaga, **horário visível em cada card** |
| 6 | *"Últimas vagas. Link na bio."* |

**Link:** `elarah.com.br/o-que-fazer-em-sp-final-de-semana.html`

---

## 5. Os 2 Reels (mesmo corte no TikTok)

### 🎬 Reel 1 — Quarta 16/09, 18h · **Jantar às Cegas**
**Por que esse e não outro:** Gastronomia tem o **maior ticket da casa (R$ 339)**, o conceito é sensorial — vídeo é o único formato que explica — e a turma está em **20%**. É o maior descompasso entre potencial e ocupação no painel inteiro.

**Roteiro · 25-30s**
- **0-2s:** *"Você janta no escuro total. Sem ver nada. Em São Paulo."*
- **3-10s:** como funciona — venda nos olhos, não sabe o que vai comer, tem que adivinhar pelo gosto
- **11-20s:** *"O paladar muda quando você tira a visão. É por isso que existe — não é gimmick."*
- **21-28s:** *"Marca quem toparia. E quem definitivamente não."*

O último CTA é de propósito: **"quem NÃO toparia"** gera mais marcação que "quem toparia" — a graça é implicar a amiga medrosa.

---

### 🎬 Reel 2 — Sábado 19/09, durante o workshop · **Perfume Natural**
**Por que esse:** é o carro-chefe (47 vendas) e é o mais bonito de filmar da casa — pipeta, notas, frasco, a pessoa cheirando a própria fórmula.

**Roteiro · 15-20s**
- **0-2s:** *"Sábado, 15h. Essas pessoas estão formulando o próprio perfume."*
- **3-15s:** cenas cruas — pipeta, gota, o cheirar, o frasco fechando, o rótulo escrito à mão
- **16-20s:** *"Você sai com ele pronto. Semana que vem tem de novo."*

5 minutos de celular do próprio fornecedor bastam. Vertical, som ambiente.

---

## 6. WhatsApp Comunidade

### 📲 Segunda 14/09, 13h — **As 3 novidades**
> Oi, gente 🧡
> Semana nova, e é a última semana de inverno — a primavera entra dia 22.
>
> Entraram 3 experiências novas na agenda:
> 1. [NOME] → https://elarah.com.br/experiencia.html?id=d48708e2-a860-4292-9faf-13d77e6842f6
> 2. [NOME] → https://elarah.com.br/experiencia.html?id=e59a76ab-6000-4f79-855d-9e80093e1a3d
> 3. [NOME] → https://elarah.com.br/experiencia.html?id=abcd50ef-f32b-4773-a496-6fb5a700f175
>
> Quarta eu volto com uma pergunta — e dela sai um cupom só pra vocês 👀

> ⚠️ Os links estão certos e prontos pra colar. **Não consegui puxar os nomes** — o site e o Supabase estão bloqueados pela política de rede desta sessão. Me manda os três nomes que eu preencho.

---

### 📲 Quarta 16/09, 14h — **Votação do cupom** ⭐
> Gente, vou soltar um cupom só pra comunidade essa sexta.
> Só que eu quero soltar o que realmente serve pra vocês. Então vota aí 👇
>
> **Qual desses te faria reservar essa semana?**
> 🅑 Leve sua amiga: as duas com 10% OFF
> 🅐 15% OFF em qualquer experiência
> 🅒 R$ 50 OFF em experiências acima de R$ 250
> 🅓 Traga 4 pessoas e a 4ª entra por metade
>
> Responde com a letra. Sexta às 18h eu solto o mais votado com código e validade. 🧡

**Use a enquete nativa do WhatsApp** — responde em um toque e a contagem vem pronta.

> **Por que B, agora com o dado na mão:** o ticket médio é **R$ 203,74**, e as três turmas que precisam encher são de dupla por natureza (jantar, cerâmica, crochê). B enche **duas cadeiras por reserva** e dilui o desconto sobre duas vendas — é a única opção que ataca o problema real da semana, que é lotação, não preço.
>
> - **A (15%)** com margem de 20% come quase tudo. Só com teto ("os 20 primeiros") ou rateio com o fornecedor.
> - **C (R$ 50 acima de R$ 250)** = 20% efetivo. Mesmo problema, disfarçado. *Mas* pega Joalheria (R$ 509) e Olfativa Botânica (R$ 365), onde há folga real — considere restringir C só a esses.
> - **D** só fecha se o fornecedor topar antes. Em grupo de 4 ele ganha escala e costuma topar. **Não coloque na votação sem alinhar.**
> - **Não acumula com FIZ10** — deixe explícito, senão canibaliza o #fizelarah.

---

### 📲 Sexta 18/09, 18h — Cupom + lista de espera
> Vocês votaram e ganhou: **[opção]** 🎉
> Código: **[CUPOM]** · vale até domingo 20/09, 23h59 · não acumula
>
> Com vaga esse fim de semana:
> 1. [nome + horário + link]
> 2. [nome + horário + link]
> 3. [nome + horário + link]
>
> E três encheram: **Incensos Naturais**, **Ourives por 1 Dia** e **Modelagem em Cerâmica**.
> Responde "QUERO" + o nome que eu te aviso primeiro quando abrir turma nova 🧡

**A lista de espera é o ativo da semana** — três turmas cheias (uma a 118%) é a prova de que a demanda existe. Capture antes de abrir a data.

---

## 7. LinkedIn — Quinta 17/09, 9h

**Tema:** *"Passei meses achando que faltava produto. Faltava acento."*

- **Hook:** *"O painel me dizia que as pessoas procuravam coisas que eu não vendia. Duas delas eu vendia — e bem."*
- Alguém buscou `bolsa croche`. A Oficina de Bolsa de Crochê já tinha vendido 33 unidades. A busca respondeu "não encontrado" porque o título é *Bolsa **de** Crochê*: acento diferente, e as palavras não coladas.
- Alguém buscou `sabonetes`. No plural. A busca exigia a palavra exata.
- *"A leitura fácil era 'o mercado quer coisas que eu não tenho'. A leitura certa era 'meu site não sabe procurar no meu próprio catálogo'."*
- **Fechamento:** *"Antes de concluir que falta produto, verifique se o problema é o produto ou a pergunta. Relatório nenhum avisa quando a métrica está medindo a coisa errada."*

Sem link no corpo (o LinkedIn entrega menos) — link no primeiro comentário. Zero emoji.

> **Alternativa**, se preferir não expor o bug: *"O produto que mais vende não é o que mais dá dinheiro"* — Perfume Natural são 47 vendas a R$ 184; Joalheria são 11 a R$ 509. Mesmo mês, quase a mesma receita, operações completamente diferentes.

---

## 8. Stories

| Dia | Sequência |
|---|---|
| **Seg 14** | "Última semana de inverno" → **"se eu fosse sua amiga eu te mandaria fazer isso"** (3 picks) → caixa: *"o que você tá com vontade de fazer e não fez?"* |
| **Ter 15** | Bastidor da curadoria de primavera + enquete: *"perfume, flor ou cerâmica?"* — segmenta a base pro resto da semana |
| **Qua 16** | Prévia do Jantar às Cegas → Reel completo → **"a votação do cupom tá rolando na comunidade"** + link |
| **Qui 17** | Parcial da votação ("tá 40% na B!") → carrossel repostado → quiz *"você é mais perfume, cerâmica ou cozinha?"* com resultado linkado |
| **Sex 18** | Agenda do fim de semana, **1 link por card** + card do cupom + **card de lista de espera das 3 lotadas** |
| **Sáb 19** | Cobertura ao vivo + repost #fizelarah (lembrar do FIZ10 no direct) |
| **Dom 20** | *"Último domingo de inverno. O que você fez offline essa semana?"* + caixa |

**Regra:** todo link vai pra **aquela** experiência, nunca pra home.

---

## 9. O que medir no domingo

| Canal | Métrica | Sinal de que funcionou |
|---|---|---|
| Carrossel primavera | Salvamentos | >5% sobre alcance |
| Carrossel amigas | Compartilhamentos + marcações | marcações > curtidas |
| **Jantar às Cegas** | **Ocupação da turma** | sair de 20% → 50%+ |
| Reel perfume | Envios no direct | envios > curtidas |
| WhatsApp | % que votou | >25% |
| Lista de espera | Nº de "QUERO" | >15 justifica abrir turma nova |
| LinkedIn | Comentários | >8 reais |

**Decisão de sexta que vem:** se o carrossel de primavera (ticket alto) converter mais que o de amigas (volume), a próxima semana vai de **tema premium** — Joalheria (R$ 509) e Olfativa Botânica (R$ 365), que é onde está a margem. Se for o contrário, mantém o eixo de ocasião.

---

## 10. Antes de começar

- [ ] **Me mandar os nomes das 3 novidades** (links já estão prontos na mensagem de segunda)
- [ ] Confirmar no admin **qual turma de Modelagem em Cerâmica está com vaga** — a outra está 100%, não pode entrar no carrossel
- [ ] Confirmar vagas reais de **sáb 19 e dom 20** → alimenta o carrossel de sexta
- [ ] Alinhar com fornecedor se a **opção D** entra na votação
- [ ] Combinar a gravação de sábado do **Perfume Natural** (5 min de celular)
- [ ] Criar o cupom com validade até **20/09 23h59** e trava de "não acumula com FIZ10"
- [ ] Decidir se conserta a **busca do site** (seção 2) — é venda perdida medida, não hipótese

---

*Semana de 14 a 20/09/2026. Refazer na sexta 18/09 usando a decisão da seção 9.*
