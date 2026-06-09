-- =============================================================
-- ELARAH — Calendario Editorial Junho 2026 (POPULACAO COMPLETA)
-- -------------------------------------------------------------
-- Popula content_calendar com 70+ entradas pra junho/2026, com
-- roteiros DETALHADOS de TikTok/Reels (hook, on-screen, cenas,
-- voz off, CTA) e Stories prontos pra copiar e colar.
--
-- Apos rodar, todos os conteudos aparecem na aba Calendario
-- Editorial do admin, filtravel por canal.
--
-- IDEMPOTENTE: o DELETE no inicio limpa qualquer seed anterior
-- de junho/2026, entao pode rodar quantas vezes precisar.
-- =============================================================

delete from public.content_calendar
 where data >= '2026-06-09' and data <= '2026-06-30';

-- =============================================================
-- TIKTOK / REELS — 15 ROTEIROS DETALHADOS
-- =============================================================

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, hashtags, status) values

(
  '2026-06-09', 'TikTok', 'Reels',
  '3 dates que NAO sao jantar e cinema',
  $$HOOK (1.5s primeiros):
"Quem inventou que date eh jantar + cinema PRECISA ser preso."

TEXTO NA TELA (sequencia):
0-1.5s: "Quem inventou que date eh jantar + cinema PRECISA ser preso"
1.5-4s: "Ideia 1 — Aula de coqueteleria. Voces aprendem 3 drinks. Saem com a bebida ja na mao."
4-7s: "Ideia 2 — Cabine de perfume. Voces criam um perfume A DOIS. Ele leva pra casa."
7-10s: "Ideia 3 — Aula de massa fresca. Voces SAO o jantar."
10-13s: "Tudo a partir de R$ 200 a dupla. Em Sao Paulo."
13-15s: "Link na bio · Dia dos Namorados"

CENAS:
- 0-2s: Camila falando direto pra camera, cara de indignacao fingida
- 2-7s: B-roll de uma aula real de coqueteleria + perfumaria — maos em closeup
- 7-10s: Aula de massa fresca, casal sorrindo
- 10-13s: Carrossel rapido de 3 logos/fotos das experiencias com preco
- 13-15s: Camila apontando pra baixo (link na bio)

VOZ OFF:
Camila narra todo o video em primeira pessoa, tom de quem ta indignada com a falta de criatividade do casal medio. Texto literal:
"Gente, com sinceridade. Jantar e cinema em 2026 nao eh date. Eh dever de casa. Eu vou te dar 3 ideias que cabem no orcamento, ficam em Sao Paulo e voces saem com uma historia pra contar."

CTA FINAL:
"Salva pra usar essa semana. Link na bio com todas as 3."

HASHTAGS:
#elarah #experienciasoffline #diadosnamorados #datesp #saopaulo #datediferente$$,
  'Hook indignacao funciona bem em 2026. Filmar Camila + 3 B-rolls + carrossel final.',
  '#elarah #experienciasoffline #diadosnamorados #datesp #saopaulo #datediferente',
  'planejado'
),

(
  '2026-06-10', 'TikTok', 'Reels',
  'POV: meu namorado disse que cinema NAO eh date',
  $$HOOK (1.5s primeiros):
[Texto na tela aparece sozinho, sem audio nos 1.5s primeiros — gera curiosidade]
"POV: meu namorado disse que cinema NAO eh date"

TEXTO NA TELA (sequencia):
0-1.5s: "POV: meu namorado disse que cinema NAO eh date"
1.5-3s: "Reacao: ofendida no inicio."
3-5s: "Mas ai ele me mandou ISSO:"
5-8s: [tela mostra 3 prints: experiencia de cozinha a dois, oficina de perfume, coqueteleria]
8-11s: "Reservei na hora."
11-14s: "Date dia 12. Voce ainda da tempo."
14-15s: "Link na bio · Elarah"

CENAS:
- 0-3s: Cena tipo "selfie reagindo" — Camila ou modelo fazendo cara de ofendida com voz off "QUE OUSADIA"
- 3-5s: Mostra mensagem fake do WhatsApp na tela com tres opcoes
- 5-8s: Carrossel de prints das experiencias
- 8-11s: Cara mudou, sorriso, "tava errada"
- 11-15s: Camila apontando link

VOZ OFF:
Conversa interna estilo monologo:
"Tava ofendida. Cinema sempre foi date. Cinema sempre foi date pra MIM. Ai ele mandou tres ideias que eu nunca tinha pensado e eu RESERVEI na hora."

Tom: confessional, intimo, como se contasse pra uma amiga.

CTA FINAL:
"Marca esse namorado que precisa ler isso."

HASHTAGS:
#elarah #pov #diadosnamorados #namorocriativo #experiencias #datesp$$,
  'Trend POV puxa muito alcance organico. Filmagem rapida de celular.',
  '#elarah #pov #diadosnamorados #namorocriativo #experiencias #datesp',
  'planejado'
),

(
  '2026-06-11', 'TikTok', 'Reels',
  'Casais que conseguiram dar errado o jantar de DDN',
  $$HOOK (1.5s primeiros):
[Voz off: "VAMOS FALAR de casais que conseguiram fracassar no jantar de Dia dos Namorados?"]
TEXTO NA TELA: "VAMOS FALAR DE CASAIS"

TEXTO NA TELA (sequencia):
0-2s: "VAMOS FALAR DE CASAIS"
2-4s: "Que conseguiram fracassar no jantar de DDN"
4-7s: "Caso 1: o restaurante esqueceu da reserva."
7-10s: "Caso 2: o filet veio cru e ela odeia carne crua."
10-13s: "Caso 3: foram pro mesmo restaurante onde ele saiu com a ex."
13-15s: "Por isso eu nao confio em jantar."
15-18s: "Voces dois cozinhando juntos. Aula de massa fresca. Sai com a comida feita e uma historia pra contar."
18-20s: "Link na bio · Elarah Dia dos Namorados"

CENAS:
- 0-4s: Camila falando direto pra camera, tom de fofoca
- 4-13s: 3 cenas RAPIDAS encenando cada fracasso (cara surpresa, comida feia, casal constrangido)
- 13-15s: Cara de "eu avisei"
- 15-18s: B-roll de aula de massa fresca real — closeup das maos e dos sorrisos
- 18-20s: Link

VOZ OFF (Camila):
Tom de fofoca/storytime. Cada caso narrado em uma frase. Ritmo rapido.

CTA FINAL:
"Faltam 24h. Da tempo. Link na bio."

HASHTAGS:
#elarah #diadosnamorados #fofoca #storytime #datesp #namorocriativo$$,
  'Storytime sempre performa. Tres casos rapidos + virada pra produto Elarah.',
  '#elarah #diadosnamorados #fofoca #storytime #datesp #namorocriativo',
  'planejado'
),

(
  '2026-06-12', 'TikTok', 'Reels',
  'POST 9h — Casal que escolheu offline em vez de tela hoje',
  $$HOOK (1.5s primeiros):
[Texto na tela]: "Hoje, em algum lugar de SP, 200 casais escolheram ISSO em vez de Netflix."

TEXTO NA TELA (sequencia):
0-2s: "Hoje, em algum lugar de SP"
2-4s: "200 casais escolheram"
4-7s: [montagem de 6-8 fotos rapidas de casais em workshops Elarah, 0.5s cada]
7-10s: "Em vez de Netflix."
10-13s: "Em vez de scroll."
13-16s: "Em vez de cinema."
16-18s: "Eles escolheram VIVER."
18-20s: "Elarah · Dia dos Namorados 2026"

CENAS:
- 0-7s: Camila falando + cortes rapidos de fotos reais dos workshops do dia
- 7-16s: Sequencia visual MUITO rapida (0.5s por imagem) de muitas experiencias rolando
- 16-18s: Pausa dramatica — uma imagem so, casal sorrindo
- 18-20s: Logo Elarah + tagline

VOZ OFF:
Tom emocional, lento. Camila quase sussurrando:
"Hoje, em algum lugar de Sao Paulo... 200 casais escolheram isso. Em vez de Netflix. Em vez de scroll. Em vez de cinema. Eles escolheram VIVER."

TRILHA SUGERIDA:
Musica lenta, emotiva, instrumental. Aumenta no "eles escolheram VIVER".

CTA FINAL:
"Marca aquele casal que precisava ver isso."

HASHTAGS:
#elarah #diadosnamorados #offlineisafeeling #saopaulo #amordeverdade #memoriasquefiicam$$,
  'Reel emocional do dia DDN. Filmar B-rolls durante os proprios eventos.',
  '#elarah #diadosnamorados #offlineisafeeling #saopaulo',
  'planejado'
),

(
  '2026-06-12', 'TikTok', 'Reels',
  'POST 18h — Pivot pra Singles Day (12/06 tambem)',
  $$HOOK (1.5s primeiros):
[Camila falando direto pra camera, sem trilha]: "Quem disse que 12 de junho eh soh dos casais?"

TEXTO NA TELA (sequencia):
0-2s: "Quem disse que 12/6 eh soh dos casais?"
2-4s: "12 de junho tambem eh Single's Day."
4-7s: "Pra voce que ta solteira"
7-10s: "Pra voce que esta separando"
10-13s: "Pra voce que esta com as amigas em vez de namorado"
13-16s: "A Elarah tem experiencias PRA VOCE tambem."
16-18s: "Veja em singles-day.html"

CENAS:
- 0-4s: Camila direto camera, sem maquiagem pesada — vibe "vou te falar uma coisa"
- 4-13s: 3 cenas — uma mulher fazendo ceramica sozinha, depois um grupo de amigas em workshop, depois uma mulher meditando
- 13-16s: Tela dividida em 3 com as cenas
- 16-18s: Texto + link

VOZ OFF (Camila):
Tom direto, quase desafiador, mas acolhedor.
"Quem disse que 12 de junho eh soh dos casais? Pra voce que ta solteira hoje. Pra voce que ta separando. Pra voce que escolheu a roda de amigas em vez do namorado de plantao. A Elarah tem coisa boa pra VOCE tambem."

CTA FINAL:
"Single's Day · Elarah. Link na bio."

HASHTAGS:
#elarah #singlesday #amorproprio #amizade #empoderamento #saopaulo$$,
  'Pivot estrategico no fim do dia DDN. Counter-narrativa = alta empatia + share.',
  '#elarah #singlesday #amorproprio #amizade #saopaulo',
  'planejado'
),

(
  '2026-06-13', 'TikTok', 'Reels',
  'Os 3 momentos mais marcantes do DDN da Elarah ontem',
  $$HOOK (1.5s primeiros):
"3 momentos que aconteceram ontem na Elarah e que eu nao consigo esquecer."

TEXTO NA TELA (sequencia):
0-2s: "3 momentos do DDN Elarah que eu nao consigo esquecer"
2-7s: "1. O casal que pediu em casamento entre as taças"
7-12s: "2. As duas amigas que viraram 12/06 em Single's Day juntas"
12-17s: "3. A senhora de 70 anos que veio sozinha aprender ceramica"
17-20s: "Por isso a gente faz Elarah. Por essas tres."

CENAS:
- 0-2s: Camila falando direto, ainda emocionada do dia anterior
- 2-17s: Cena REAL de cada um dos tres momentos (com permissao das pessoas, em foto ou video curto). Se nao tiver real, usar B-roll com tipografia narrando
- 17-20s: Closeup do logo Elarah + Camila assinando

VOZ OFF (Camila):
Tom intimo, confessional. Pausa entre cada caso.
"Ontem nao foi sobre vendas. Foi sobre isso. O casal que pediu em casamento entre as taças do workshop. As duas amigas que viraram 12 de junho em Single's Day juntas. A senhora de 70 anos que veio sozinha aprender ceramica."

CTA FINAL:
"Salva esse video pra quando voce esquecer porque a gente faz isso."

HASHTAGS:
#elarah #diadosnamorados #depoimento #comunidade #saopaulo #experiencias$$,
  'Storytelling apos o evento. Requer captacao de 3 historias REAIS no dia 12.',
  '#elarah #diadosnamorados #depoimento #comunidade',
  'planejado'
),

(
  '2026-06-14', 'TikTok', 'Reels',
  'Sabado de amigas — sem desculpa',
  $$HOOK (1.5s primeiros):
"Voce e suas amigas estao ha QUANTO tempo dizendo 'a gente precisa marcar algo'?"

TEXTO NA TELA (sequencia):
0-2.5s: "Voce e suas amigas: 'a gente precisa marcar algo'"
2.5-5s: "Desde QUANDO?"
5-8s: "Desde 2024. Eu lembro."
8-11s: "Hoje. Sabado. Tarot + vinho. R$ 180 pp."
11-14s: "Pasta a 4 maos. R$ 220 pp."
14-17s: "Ceramica + cha. R$ 200 pp."
17-19s: "Da pra reservar AGORA. Pra HOJE a tarde."
19-20s: "Link · Elarah"

CENAS:
- 0-5s: Camila tom de "deboche carinhoso"
- 5-8s: Cena de print de WhatsApp tipo "vamos marcar?" "vamos sim!" "marca?" "marca!" — sem nunca ter rolado
- 8-17s: 3 B-rolls — tarot+vinho, pasta, ceramica+cha — todos com grupos de 3-4 amigas
- 17-20s: Camila + link

VOZ OFF (Camila):
Tom direto, carinhoso, com toque de provocacao.
"Voce e suas amigas estao falando 'a gente precisa marcar algo' desde 2024. EU LEMBRO. Hoje, sabado, tem isso, isso e isso. Da pra reservar AGORA pra HOJE a tarde."

CTA FINAL:
"Manda no grupo das amigas. Decidem em 5 minutos."

HASHTAGS:
#elarah #singlesday #amigas #saopaulo #findesemanaSP #experiencias$$,
  'Urgencia + provocacao funciona. Filmagem rapida, B-rolls dos workshops do dia.',
  '#elarah #singlesday #amigas #saopaulo #findesemanaSP',
  'planejado'
),

(
  '2026-06-16', 'TikTok', 'Reels',
  '3 lugares pra ir em SP no inverno SEM ser bar lotado',
  $$HOOK (1.5s primeiros):
"Quem disse que inverno em SP eh bar lotado e fim de fila?"

TEXTO NA TELA (sequencia):
0-2s: "Inverno SP NAO eh bar lotado"
2-5s: "Lugar 1 — Banho turco em [bairro]. Sai aquecido e cheirando bem."
5-8s: "Lugar 2 — Atelie de ceramica com cha. Mao quente, alma quente."
8-11s: "Lugar 3 — Sound bath com cobertor. Voce nao precisa fazer NADA."
11-14s: "Tudo a partir de R$ 150."
14-16s: "Em Sao Paulo. Hoje."
16-18s: "Link · Elarah"

CENAS:
- 0-2s: Camila falando, vestida quente, em ambiente aconchegante
- 2-11s: 3 B-rolls cada um com a vibe quente (vapor do banho turco, atelie com chimines, sala de sound bath com luz baixa)
- 11-18s: Tela dividida em 3 com os logos / Camila linkando

VOZ OFF (Camila):
Tom de descoberta, voz baixa, intima — como se contasse um segredo.
"Quem disse que inverno em Sao Paulo eh ficar parada no bar? Tem isso, tem isso e tem isso. Tudo a partir de R$ 150."

CTA FINAL:
"Salva pra usar nessa semana fria."

HASHTAGS:
#elarah #invernosp #saopaulo #experienciassp #autocuidado #vidaoffline$$,
  'Aproveitar a onda de inverno paulistano. B-rolls quentes.',
  '#elarah #invernosp #saopaulo #autocuidado',
  'planejado'
),

(
  '2026-06-17', 'TikTok', 'Reels',
  'Trend: coisas que parecem caras mas sao acessiveis (Elarah Kids)',
  $$HOOK (1.5s primeiros):
"3 coisas que parecem caras em SP mas custam menos que um happy hour."

TEXTO NA TELA (sequencia):
0-2s: "3 coisas que PARECEM caras em SP"
2-5s: "Mas custam menos que um happy hour."
5-8s: "1. Workshop de ceramica pra crianca. R$ 120."
8-11s: "2. Aula de pintura com vinho pra voce. R$ 160."
11-14s: "3. Day spa com hammam. R$ 180."
14-17s: "Voce gastou MAIS em delivery essa semana."
17-19s: "Link · Elarah · experiencias offline"

CENAS:
- 0-5s: Camila vestida casual, tom desafiador
- 5-14s: B-rolls de cada um (crianca rindo na ceramica, taça de vinho + pincel, hammam vapor)
- 14-17s: Tela de iFood com pedidos somando R$ 200, R$ 350
- 17-19s: Link

VOZ OFF (Camila):
Tom desafiador, levemente provocativo.
"Acessivel ou caro nao eh sobre o preço. Eh sobre o QUE voce ta comprando. Voce gastou MAIS em delivery essa semana e nao percebeu."

CTA FINAL:
"Comenta o que voce gastou hoje em delivery."

HASHTAGS:
#elarah #experienciassp #valor #conscienciafinanceira #elarahkids #saopaulo$$,
  'Funciona pra Elarah Kids + faz pensar sobre prioridade financeira.',
  '#elarah #experienciassp #valor #elarahkids',
  'planejado'
),

(
  '2026-06-18', 'TikTok', 'Reels',
  'Festas juninas em SP — so que NAO no colegio',
  $$HOOK (1.5s primeiros):
"Festas juninas pra adulto. Em SP. Que NAO eh em colegio."

TEXTO NA TELA (sequencia):
0-2s: "Festa junina pra adulto"
2-4s: "Que NAO eh no colegio"
4-7s: "Workshop de doces caipiras numa cozinha real. R$ 180."
7-10s: "Oficina de paçoca artesanal. Voce leva pra casa. R$ 150."
10-13s: "Quentao + violão. Bistro charmoso, sem balão de plastico."
13-16s: "Junina sem perder a infancia. E sem usar fantasia."
16-18s: "Link · Elarah"

CENAS:
- 0-4s: Camila com tom de "finalmente alguem fez isso"
- 4-13s: 3 B-rolls dos workshops juninos com vibe sofisticada (luzes douradas, bandeirinha minimalista, doces artesanais)
- 13-18s: Camila apontando link

VOZ OFF (Camila):
"Festa junina existe pra adulto tambem. So nao do jeito que voce conhece. Sem balao de plastico. Sem 'pula a fogueira sao Joao'. Mas COM paçoca artesanal, quentão e violão. Em Sao Paulo. Esse fim de semana."

CTA FINAL:
"Marca aquele amigo que detesta junina de colegio mas adora paçoca."

HASHTAGS:
#elarah #saojoao #festajunina #saopaulo #experienciassp #junina2026$$,
  'Posicionamento autoral. Nicho de festa junina adulta sofisticada.',
  '#elarah #saojoao #festajunina #saopaulo',
  'planejado'
),

(
  '2026-06-20', 'TikTok', 'Reels',
  '3 coisas que voce ainda da tempo de fazer esse fim de semana em SP',
  $$HOOK (1.5s primeiros):
"Sexta-feira, 18h. Voce ainda nao tem plano pro fim de semana. Calma."

TEXTO NA TELA (sequencia):
0-2s: "Sexta 18h."
2-4s: "Voce nao tem plano pro fds."
4-6s: "Calma."
6-9s: "Opcao 1 — Sabado 14h. Aula de coqueteleria. 4 vagas."
9-12s: "Opcao 2 — Sabado 16h. Workshop de pintura. 3 vagas."
12-15s: "Opcao 3 — Domingo 11h. Aula de massa. 2 vagas."
15-17s: "Reserva em 30 segundos."
17-18s: "Link · Elarah"

CENAS:
- 0-6s: Camila com cara de quem ja passou por isso, depois cara aliviada
- 6-15s: Tela dividida ou stickers com horario, atividade, vagas restantes em destaque
- 15-18s: Link

VOZ OFF (Camila):
Tom direto, urgencia controlada (nao desesperada).
"Sexta. Dezoito horas. Voce ta SEM plano pro fim de semana e cansada. Calma. Tem isso, tem isso e tem isso. Reserva em trinta segundos."

CTA FINAL:
"Quem reservar nos comentarios eu mando o cupom Elarah10."

HASHTAGS:
#elarah #findesemanaSP #saopaulo #experienciassp #experiencias #ultimasvagas$$,
  'Urgencia real, vagas verdadeiras. Atualizar contagem antes de postar.',
  '#elarah #findesemanaSP #saopaulo #experienciassp',
  'planejado'
),

(
  '2026-06-23', 'TikTok', 'Reels',
  'Festas juninas adultas e charmosas — viva a semana de SJ',
  $$HOOK (1.5s primeiros):
"Voce ate gosta de festa junina. Mas voce odeia o sertanejo do bonecao."

TEXTO NA TELA (sequencia):
0-3s: "Voce gosta de festa junina"
3-5s: "Mas detesta o sertanejo do bonecao"
5-9s: "Hammam quentinho + biscoito de polvilho. Sao Joao zen."
9-13s: "Curso de quentão. Voce nunca mais bebe quentão ruim."
13-17s: "Workshop de paçoca + cha. Tarde de tia rica."
17-19s: "Tudo em SP. Semana toda."
19-20s: "Link · Elarah"

CENAS:
- 0-5s: Camila com humor — encena reagindo a um audio de sertanejo
- 5-17s: 3 B-rolls com estetica curated (luz dourada, simbolos juninos minimalistas)
- 17-20s: Camila apontando link

VOZ OFF (Camila):
Tom de humor afiado.
"Voce gosta de festa junina. Mas voce ODEIA o sertanejo do bonecao. Eu sei. Eu tambem. Por isso a gente fez isso, isso e isso."

CTA FINAL:
"Manda esse video pra quem detesta junina de massa."

HASHTAGS:
#elarah #saojoao2026 #festajunina #saopaulo #experienciassp #juninasofisticada$$,
  'Humor + posicionamento autoral. Funciona muito em SP.',
  '#elarah #saojoao2026 #festajunina #saopaulo',
  'planejado'
),

(
  '2026-06-24', 'TikTok', 'Reels',
  'Brasileiros que nao sabiam que Sao Joao pode ser ASSIM',
  $$HOOK (1.5s primeiros):
"Brasileiros que nao sabiam que Sao Joao pode ser ASSIM:"

TEXTO NA TELA (sequencia):
0-2s: "Brasileiros que nao sabiam que SJ podia ser ASSIM:"
2-7s: [Cena de pessoas reagindo aos workshops juninos curated da Elarah]
7-12s: [Cena de quem ja vivenciou contando]
12-16s: "Junina sem balao de plastico."
16-19s: "Junina com paçoca artesanal."
19-20s: "Link · Elarah · SJ 2026"

CENAS:
- 0-2s: Tipografia bold no centro da tela, sem audio
- 2-7s: 3-4 cenas RAPIDAS de pessoas reagindo aos workshops do dia 24 (cara de surpresa, sorriso, "como assim?")
- 7-12s: Depoimento curto de UMA pessoa que viveu, em tom casual
- 12-19s: Cards visuais com a diferenca (colegio velho vs Elarah curated)
- 19-20s: Link

VOZ OFF:
Mostly silencioso. Apenas a fala REAL das pessoas reagindo. So musica de fundo (forró instrumental sofisticado).

CTA FINAL:
"Salva pro proximo Sao Joao."

HASHTAGS:
#elarah #saojoao #fyp #saopaulo #junina #experienciassp $$,
  'Cobertura ao vivo do evento. Captar reacoes REAIS.',
  '#elarah #saojoao #fyp #saopaulo #junina',
  'planejado'
),

(
  '2026-06-26', 'TikTok', 'Reels',
  'Inverno em SP eh desculpa pra ficar em casa? Nao pra esses 5',
  $$HOOK (1.5s primeiros):
"5 coisas pra fazer em SP que so funcionam BEM no inverno."

TEXTO NA TELA (sequencia):
0-2s: "5 coisas que so funcionam BEM no inverno em SP"
2-5s: "1. Hammam. So no frio voce sente."
5-8s: "2. Cha + ceramica. Maos quentes."
8-11s: "3. Aula de cozinha quente. Risoto, massa, sopa."
11-14s: "4. Sound bath + cobertor. Voce dorme."
14-17s: "5. Workshop de chocolate quente. R$ 140."
17-19s: "Tudo offline. Tudo Sao Paulo."
19-20s: "Link · Elarah"

CENAS:
- 0-2s: Camila vestida quente, dentro de um ambiente aconchegante
- 2-17s: 5 B-rolls com vibe quente (vapor, cobertor, chocolate derretendo)
- 17-20s: Link

VOZ OFF (Camila):
Tom acolhedor, voz baixa.
"Inverno em SP nao eh desculpa pra ficar em casa. Eh desculpa pra fazer EXATAMENTE essas cinco coisas — porque elas so funcionam BEM no frio."

CTA FINAL:
"Salva. Voce vai usar em julho tambem."

HASHTAGS:
#elarah #invernosp #saopaulo #autocuidado #experienciasoffline #invernopaulistano$$,
  'Lista clara, B-rolls visuais. Apela pro auto-cuidado de inverno.',
  '#elarah #invernosp #saopaulo #autocuidado',
  'planejado'
),

(
  '2026-06-27', 'TikTok', 'Reels',
  'Pais que pensaram que iam descansar e acabaram NA COZINHA — Elarah Kids',
  $$HOOK (1.5s primeiros):
"POV: voce pensou que sabado seria descanso. Mas seu filho tem 6 anos."

TEXTO NA TELA (sequencia):
0-2s: "POV: sabado de descanso"
2-4s: "Mas seu filho tem 6 anos"
4-7s: "Voce tinha 2 opcoes:"
7-10s: "Ficar 5h vendo desenho ao lado dele."
10-13s: "Ou levar ele pra ATELIE DE CERAMICA pra crianca."
13-16s: "Voce gastou 1.5h, ele saiu com a peca dele."
16-19s: "Voce tirou foto. E ele te abracou. R$ 120."
19-20s: "Elarah Kids · Link"

CENAS:
- 0-4s: Camila ou modelo encenando cara de mae cansada com crianca pulando
- 4-13s: Encenar as duas opcoes — cena de desenho na tv vs cena de atelier real
- 13-19s: Foto fictivia de mae e filho na ceramica, criança orgulhosa segurando a peca
- 19-20s: Link

VOZ OFF (Camila):
Tom de mae que entende. Conspiratorio.
"Voce pensou que sabado seria descanso. Mas seu filho tem 6 anos. Voce tinha duas opcoes — e a segunda gastou 1 hora e meia, custou R$ 120, e seu filho saiu com a peca dele. Voce, com paz."

CTA FINAL:
"Manda esse pra aquela amiga que ta sofrendo nas ferias escolares."

HASHTAGS:
#elarah #elarahkids #maternidade #atividadesparacrianca #ferias #saopaulo$$,
  'Identificacao com pais cansados. Funciona muito pra mes de julho (ferias).',
  '#elarah #elarahkids #maternidade #saopaulo',
  'planejado'
);


-- =============================================================
-- STORIES — ROTEIROS PRONTOS PRA COPIAR E COLAR
-- =============================================================

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values

-- ==== CAIXAS DE PERGUNTAS ====
(
  '2026-06-09', 'Instagram', 'Stories',
  'Caixa de perguntas: maior dilema pra Dia dos Namorados',
  $$STORY 1 — Fundo creme (#FFF8EE) ou foto de detalhe romântico desfocada

Texto: "Faltam 3 dias pro Dia dos Namorados."
Sticker: nenhum

STORY 2 — Mesmo fundo

Texto: "Conta pra mim — qual seu MAIOR dilema?"
Sticker: caixa de perguntas com placeholder "Onde levar? O que dar? Vou casar com essa pessoa?"

STORY 3 — Mesmo fundo

Texto: "Vou responder cada um amanha aqui."
Sticker: enquete sim/nao "Voce volta amanha pra ver?" (gera retorno)

CTA: Nenhum link nessa sequencia. Funcao eh PURA escuta + retorno.
DURACAO ESPERADA: as 3 stories no ar por 24h. Retorno na quarta com respostas.

POS PROCESSAMENTO:
Anote as 5 perguntas mais legais em caderno. Cada uma vira mini-conteudo:
- "Onde levar?" → carrossel ideias (sex-feed)
- "O que dar?" → push Elarah giftcard
- "Vou casar?" → quote bonita (feed sabado)$$,
  'Sequencia 3 stories segunda-feira da semana DDN.',
  'planejado'
),

(
  '2026-06-13', 'Instagram', 'Stories',
  'Caixa de perguntas: como foi seu DDN?',
  $$STORY 1 — Foto de uma das experiencias DDN com filtro suave

Texto: "Ontem foi gigante."
Sticker: nenhum

STORY 2 — Continua na vibe

Texto: "Conta pra mim — como foi SEU dia 12?"
Sticker: caixa de perguntas com placeholder "Conte aqui..."

STORY 3 — Mesmo fundo

Texto: "Vou repostar as melhores aqui. 💛"
Sticker: nenhum

CTA: Esperado UGC. Repostar 4-6 respostas ao longo do dia 13 com stories estilizadas.

POS PROCESSAMENTO:
- Reposta com texto destacado em sticker no fundo da foto da pessoa (caso ela mande foto)
- Se nao houver foto, repostar so o texto em fundo cream com aspas decorativas
- Marcar @ da pessoa que respondeu sempre que possivel$$,
  'Pos-DDN. Gera UGC e relacionamento.',
  'planejado'
),

(
  '2026-06-15', 'Instagram', 'Stories',
  'Caixa de perguntas: O que voce viveu offline esse fim de semana?',
  $$STORY 1 — Foto editorial de uma cena calma (cha em mesa de madeira, ou mao em livro)

Texto: "Domingo de balanço."
Sticker: nenhum

STORY 2 — Continua

Texto: "O que voce VIVEU offline esse fim de semana?"
Sticker: caixa de perguntas com placeholder "Conta aqui"

STORY 3 — Tipografia em fundo creme

Texto: "Tudo conta. Cafe sem celular. Pintura. Aniversario. Caminhada no parque."
Sticker: nenhum

CTA: Repost de UGC ao longo do domingo. Constroi comunidade.

POS PROCESSAMENTO:
- Reposta TODAS as respostas honestas (mesmo "fiquei em casa") — gera vinculo
- Tom: sem julgamento, com curadoria visual padrao Elarah$$,
  'Domingo reflexivo. Constroi comunidade.',
  'planejado'
),

-- ==== ENQUETES ====
(
  '2026-06-10', 'Instagram', 'Stories',
  'Enquete: jantar OU experiencia pro DDN?',
  $$STORY 1 — Fundo dividido em 2 metades (foto de jantar vs foto de workshop)

Texto: "Voce ainda esta na duvida do dia 12?"
Sticker: nenhum

STORY 2 — Continua

Texto: "Vamos resolver. JANTAR clássico ou EXPERIÊNCIA criativa?"
Sticker: enquete com 2 opções: "🍽 Jantar" e "🎨 Experiência"

STORY 3 — Apos algumas horas, repostar resultado

Texto: "Vocês disseram: [X]% Jantar, [Y]% Experiência. A gente tem ideias pros DOIS lados."
Sticker: link da campanha DDN

CTA: Link pra landing DDN no story 3.

POS PROCESSAMENTO:
- Quem votou em "Experiência" → DM personalizada com 3 sugestões
- Quem votou em "Jantar" → DM oferecendo a opcao "cozinha a dois" como compromisso$$,
  'Engajamento + segmentacao. DM follow-up converte.',
  'planejado'
),

(
  '2026-06-17', 'Instagram', 'Stories',
  'Enquete: fim de semana — descansar ou sair?',
  $$STORY 1 — Foto de uma manha calma + foto de um grupo de amigas

Texto: "Esse fim de semana voce ta mais com vontade de:"
Sticker: enquete com 2 opções: "😴 Descansar" e "🌟 Sair"

STORY 2 — Apos algumas horas

Texto: "Apostei que ia ser empate."
Sticker: nenhum

STORY 3 — Direciona pra produto

Texto: "Os dois lados tem agenda. Hammam pra descanso. Workshops pra encontro."
Sticker: link da agenda do fds

CTA: Link pra agenda do fim de semana.

POS PROCESSAMENTO:
- Quem votou descansar → DM com Hammam, sound bath, cha
- Quem votou sair → DM com workshops em grupo$$,
  'Segmentacao + DM conversao.',
  'planejado'
),

(
  '2026-06-19', 'Instagram', 'Stories',
  'Enquete: frio combina com bar ou ateliê?',
  $$STORY 1 — Foto de bar lotado vs atelie quente

Texto: "Frio bate em SP."
Sticker: nenhum

STORY 2 — Continua

Texto: "Plano da noite:"
Sticker: enquete com 2 opções: "🍺 Bar lotado" e "🎨 Ateliê quente"

STORY 3 — Pivot

Texto: "Se voce escolheu ateliê, vem que tem ceramica + cha hoje 19h. 3 vagas."
Sticker: link da experiência específica

CTA: Link direto pra experiência com vagas.

POS PROCESSAMENTO:
- Bar → continua o jogo no DM com vibe humor "tudo bem, tudo bem"
- Atelier → reposta a resposta com vibe de "mesma energia"$$,
  'Urgencia real + posicionamento autoral.',
  'planejado'
),

(
  '2026-06-25', 'Instagram', 'Stories',
  'Enquete: pos Sao Joao — mais junina ou mudou de tema?',
  $$STORY 1 — Foto editorial de Sao Joao Elarah do dia 24

Texto: "Sao Joao oficial passou."
Sticker: nenhum

STORY 2 — Continua

Texto: "Voce ta:"
Sticker: enquete com 2 opções: "🔥 Quero MAIS junina" e "🍷 Ja mudei de tema"

STORY 3 — Direciona

Texto: "Os dois lados tem agenda esse fim de semana. Junina sofisticada e inverno paulistano."
Sticker: link da agenda

CTA: Link da agenda do fim de semana.

POS PROCESSAMENTO: Reposta resultado com tom de "anotei seu lado".$$,
  'Pivota campanha sem perder quem ja quer mudar.',
  'planejado'
),

(
  '2026-06-28', 'Instagram', 'Stories',
  'Enquete: qual experiência você quer ver em julho?',
  $$STORY 1 — Imagem editorial de várias categorias em mosaico

Texto: "Junho fechando. Julho ja na curadoria."
Sticker: nenhum

STORY 2 — Pergunta

Texto: "Voce quer MAIS de qual em julho?"
Sticker: enquete com 4 opções (preencher manualmente):
- "🍷 Vinho/Bartender"
- "🎨 Ceramica/Pintura"
- "🍝 Cozinha"
- "✨ Sound bath/Spa"

STORY 3 — Engajamento final

Texto: "Vou usar isso pra decidir o que abrir primeiro. Obrigada 💛"
Sticker: nenhum

CTA: Nenhum link. Funcao eh PURA escuta pra curadoria + relacionamento.

POS PROCESSAMENTO:
- Anota resultado em planilha de planejamento julho
- Reposta agradecimento no domingo a noite$$,
  'Co-criacao com a comunidade. Gera lealdade.',
  'planejado'
),

-- ==== QUIZ ====
(
  '2026-06-11', 'Instagram', 'Stories',
  'Quiz: que tipo de date voce eh?',
  $$STORY 1 — Capa do quiz

Texto: "QUIZ — Que tipo de date voce eh?"
Sticker: nenhum (so titulo + emoji)

STORY 2 — Pergunta 1

Texto: "Bebida favorita pra um date?"
Sticker: enquete 2 opcoes — "🍷 Vinho" e "🍹 Drink autoral"

STORY 3 — Pergunta 2

Texto: "Onde voce se sente confortavel?"
Sticker: enquete 2 opcoes — "🌅 Lugar quieto" e "🎉 Movimento"

STORY 4 — Pergunta 3

Texto: "O que voce QUER da noite?"
Sticker: enquete 2 opcoes — "📸 Memoria" e "💬 Conversa"

STORY 5 — Resultado

Texto: "Resultado: vou te mandar SUA experiencia ideal no DM em 1h. Aguarda."
Sticker: nenhum

CTA: DM personalizada com a experiencia exata. Sticker de link na ultima.

POS PROCESSAMENTO (a mao):
- Quem respondeu vinho/quieto/memoria → workshop ceramica com vinho
- Quem respondeu drink/movimento/memoria → coqueteleria
- Quem respondeu vinho/quieto/conversa → wine bar com degustacao
- Quem respondeu drink/movimento/conversa → pasta e date nas alturas

Manda DM individual em batches.$$,
  'Quiz com follow-up DM. Conversao alta.',
  'planejado'
),

(
  '2026-06-18', 'Instagram', 'Stories',
  'Quiz: voce eh mais junina tradicional ou contemporânea?',
  $$STORY 1 — Capa

Texto: "QUIZ — Voce eh tradicional ou contemporânea?"

STORY 2 — Pergunta 1

Texto: "Quentao ou vinho aquecido?"
Sticker: enquete — "🔥 Quentao" e "🍷 Vinho aquecido"

STORY 3 — Pergunta 2

Texto: "Paçoca ou trufa de chocolate quente?"
Sticker: enquete — "🥜 Paçoca" e "🍫 Trufa quente"

STORY 4 — Pergunta 3

Texto: "Forró pé-de-serra ou DJ na fogueira?"
Sticker: enquete — "🪗 Forró classico" e "🎧 DJ na fogueira"

STORY 5 — Resultado

Texto: "Mais tradicional? Te mando workshop de paçoca + violão. Mais contemporanea? Te mando jantar harmonizado tematico. DM!"

CTA: DM follow-up. Sticker de link com agenda completa juninas.

POS PROCESSAMENTO:
- Tradicional → workshop paçoca, oficina doce caipira
- Contemporanea → jantar junino sofisticado, hammam tematico$$,
  'Quiz Festa Junina. Bom pra engajamento.',
  'planejado'
),

(
  '2026-06-26', 'Instagram', 'Stories',
  'Quiz: qual experiência de inverno combina com voce?',
  $$STORY 1 — Capa

Texto: "QUIZ — Qual experiência de inverno eh SUA?"

STORY 2 — Pergunta 1

Texto: "Voce quer sair mais... aquecida ou aliviada?"
Sticker: enquete — "🔥 Aquecida" e "🌿 Aliviada"

STORY 3 — Pergunta 2

Texto: "Atividade preferida no frio?"
Sticker: enquete — "✋ Maos ocupadas" e "👂 Parada, sentindo"

STORY 4 — Pergunta 3

Texto: "Companhia?"
Sticker: enquete — "👥 Amigas" e "🪞 Sozinha"

STORY 5 — Resultado

Texto: "Te mando a experiencia certa no DM."

CTA: DM personalizada.

POS PROCESSAMENTO:
- Aquecida/maos/amigas → workshop de chocolate quente em grupo
- Aliviada/parada/sozinha → sound bath
- Aquecida/maos/sozinha → ceramica + cha
- Aliviada/parada/amigas → hammam compartilhado$$,
  'Quiz inverno. Segmentacao fina pra DM.',
  'planejado'
),

-- ==== BASTIDORES ====
(
  '2026-06-16', 'Instagram', 'Stories',
  'Bastidor: como a gente curou as experiências do mes',
  $$STORY 1 — Foto interna da Camila no escritorio, computador aberto

Texto: "Tem gente que pergunta como a gente CHEGA nas experiencias."
Sticker: nenhum

STORY 2 — Foto de notebook com planilha (pode mostrar de longe)

Texto: "A gente VISITA cada uma antes. Tres a quatro horas em cada."
Sticker: nenhum

STORY 3 — Foto de Camila em um workshop participando

Texto: "Se eu nao saio QUERENDO voltar, nao entra na curadoria."
Sticker: nenhum

STORY 4 — Encerra

Texto: "Por isso eu prometo cada uma como se fosse pra mim."
Sticker: link da agenda Elarah

CTA: Link para agenda. Constroi confiança.

POS PROCESSAMENTO:
- Repostar mensagens de DM que vierem em forma de "eu confio na curadoria"$$,
  'Bastidor curadoria. Constroi autoridade.',
  'planejado'
),

(
  '2026-06-19', 'Instagram', 'Stories',
  'Bastidor: workshop infantil rolando ao vivo',
  $$STORY 1 — Foto closeup de maozinha em argila

Texto: "Ta rolando AGORA em Vila Madalena."
Sticker: nenhum

STORY 2 — Video 5s de crianca focada moldando ceramica

Texto: "Olha o foco."
Sticker: nenhum

STORY 3 — Video 5s das crianças em volta da mesa, rindo

Texto: "Isso aqui eh o que a gente quer dizer com OFFLINE."
Sticker: nenhum

STORY 4 — Foto da peca final

Texto: "Cada um leva a propria peca. Memoria de verdade."
Sticker: link da pagina Elarah Kids

CTA: Link pra Elarah Kids.

POS PROCESSAMENTO:
- Captura mais material no proprio dia
- Reposta a tarde com final feliz das criancas com as pecas prontas$$,
  'Bastidor com video. Push Elarah Kids.',
  'planejado'
),

(
  '2026-06-23', 'Instagram', 'Stories',
  'Bastidor: curando festas juninas adultas',
  $$STORY 1 — Foto editorial de uma decoracao junina sofisticada (luzes douradas, sem balao)

Texto: "Sao Joao Elarah esta semana."
Sticker: nenhum

STORY 2 — Foto de produtos artesanais (paçoca, biscoitos caipiras, etc)

Texto: "Tudo artesanal. Tudo de produtor pequeno."
Sticker: nenhum

STORY 3 — Foto de Camila ajudando a montar mesa ou degustando

Texto: "Provei TUDO antes de aprovar."
Sticker: nenhum

STORY 4 — Encerra

Texto: "Junina pra adulto, sem fantasia, sem balao de plastico."
Sticker: link da agenda Sao Joao

CTA: Link para a campanha SJ. Constroi confiança + push.

POS PROCESSAMENTO:
- Reposta DM dos fornecedores agradecendo a parceria
- Gera FOMO pra evento do dia 24$$,
  'Bastidor SJ. Posicionamento autoral.',
  'planejado'
),

-- ==== CONVERSAO (sequencia agenda fds) ====
(
  '2026-06-20', 'Instagram', 'Stories',
  'Sequencia AGENDA FDS — 5 cards visuais com push',
  $$Sequencia de 6 stories sexta a noite (18h-20h).

STORY 1 — CAPA

Texto: "Sexta. Agenda do FDS liberada."
Sticker: nenhum

STORY 2 — Experiencia 1

Texto: "SAB 14h — Aula de coqueteleria. R$ 220. 4 vagas."
Sticker: link direto da experiencia

STORY 3 — Experiencia 2

Texto: "SAB 16h — Workshop de pintura com vinho. R$ 160. 3 vagas."
Sticker: link

STORY 4 — Experiencia 3

Texto: "DOM 11h — Aula de massa fresca. R$ 200. 2 vagas."
Sticker: link

STORY 5 — Experiencia 4

Texto: "DOM 15h — Sound bath + cobertor. R$ 130. 5 vagas."
Sticker: link

STORY 6 — Fechamento

Texto: "Reserva em 30s. Manda esse story pra quem vai com voce."
Sticker: enquete sim/nao "Voce reservou?" (gera engajamento)

CTA: Cada story tem link direto da experiencia.

POS PROCESSAMENTO:
- Repostar reservas confirmadas (com permissao) no sabado
- Stories de cobertura ao vivo no sabado/domingo$$,
  'Conversao classica. Atualizar vagas em tempo real.',
  'planejado'
),

(
  '2026-06-27', 'Instagram', 'Stories',
  'Sequencia AGENDA Elarah Kids fds',
  $$Sequencia de 5 stories sexta a noite, focada em maes/pais cansados.

STORY 1 — CAPA

Texto: "Pai/mae cansada? Aqui."
Sticker: nenhum

STORY 2 — Pitch

Texto: "Voce sabia que tem workshop pra crianca em SP a R$ 120?"
Sticker: nenhum

STORY 3 — Experiencia 1

Texto: "SAB 10h — Ceramica pra crianca. 1.5h. R$ 120. (Voce vai num cafe ali do lado)"
Sticker: link

STORY 4 — Experiencia 2

Texto: "DOM 11h — Workshop de pintura + cookie pra crianca. R$ 140."
Sticker: link

STORY 5 — Fechamento

Texto: "Eles voltam orgulhosos. Voce volta inteiro/a."
Sticker: link da pagina Elarah Kids

CTA: Link pra Elarah Kids.

POS PROCESSAMENTO:
- Reposta foto dos pais relaxando enquanto filhos criam (com permissao)$$,
  'Conversao Elarah Kids. Empatia com pais.',
  'planejado'
),

(
  '2026-06-11', 'Instagram', 'Stories',
  'Urgencia: faltam 24h pro DDN',
  $$Sequencia de 3 stories ao longo do dia 11 (manha, tarde, noite).

STORY 1 (manha 10h)

Texto: "24h. Quem ainda nao reservou pro dia 12?"
Sticker: caixa de perguntas "Ja reservou?"

STORY 2 (tarde 14h)

Texto: "As 3 experiencias com MAIS reservas hoje:"
Sub-stories:
- "Pasta e Date nas Alturas — ultimas 2 vagas"
- "Noite de Sabores & Amor — ultimas 3 vagas"
- "Flower Box — ultimas 4 vagas"
Sticker: link direto em cada uma

STORY 3 (noite 18h)

Texto: "Amanha eh 12. Reserva fecha as 23h59 de hoje."
Sticker: link da landing DDN + countdown timer

CTA: Urgencia + link.

POS PROCESSAMENTO:
- Monitorar e atualizar vagas em tempo real
- Reposta confirmacoes que chegam por DM$$,
  'Urgencia REAL. Atualizar vagas e cronologia hora a hora.',
  'planejado'
),

(
  '2026-06-13', 'Instagram', 'Stories',
  'Singles Day weekend — push amigas',
  $$Sequencia de 4 stories sexta a noite (apos DDN).

STORY 1 — Reframe

Texto: "Acabou DDN. Mas Single's Day sabado e domingo nao acabou."
Sticker: nenhum

STORY 2 — Push 1

Texto: "Workshop de tarot + vinho. SAB 19h. R$ 200. 4 vagas."
Sticker: link

STORY 3 — Push 2

Texto: "Ceramica + cha pra grupo de amigas. DOM 11h. 6 vagas."
Sticker: link

STORY 4 — Fechamento

Texto: "Chama as amigas. Reservem juntas em ate 30 minutos."
Sticker: link da landing Singles Day

CTA: Link Singles Day.

POS PROCESSAMENTO:
- DM personalizada pra grupos de amigas que mandaram nos stories
- Cobertura ao vivo no sabado$$,
  'Pivot pos-DDN. Captura quem ficou sozinha.',
  'planejado'
),

-- ==== RELACIONAMENTO ====
(
  '2026-06-14', 'Instagram', 'Stories',
  'Cobertura ao vivo de uma experiencia do sabado',
  $$Loop de 8-10 stories ao longo de uma manha/tarde de sabado.

ABERTURA (9h)
Texto: "Ta rolando AGORA em [bairro] — workshop de [exp]"
Sticker: localizacao

DURANTE (a cada 15-20 minutos)
- Foto/video de maos trabalhando
- Foto de participantes rindo (com permissao)
- Detalhe do produto sendo criado
- Vibe do espaco

PERGUNTA (no meio)
Texto: "Voce queria estar aqui?"
Sticker: enquete sim/nao

FINAL (depois de 3-4h)
Texto: "Cada um com a sua peca. Memoria pra levar pra casa."
Foto: grupo final mostrando o que criou

ENCERRAMENTO
Texto: "Da pra reservar a proxima ja. Link na bio."
Sticker: link da agenda

POS PROCESSAMENTO:
- Repostar todos os UGC dos participantes
- Storify a melhor sequencia no destaque "Elarah Kids" ou "Singles Day"$$,
  'Cobertura ao vivo. Constroi comunidade e prova social.',
  'planejado'
),

(
  '2026-06-22', 'Instagram', 'Stories',
  'Caixa de perguntas: lembranca junina de criança',
  $$STORY 1 — Foto preto e branca antiga estilizada

Texto: "Domingo nostalgico. Vamos lembrar?"
Sticker: nenhum

STORY 2 — Pergunta

Texto: "Qual a sua melhor lembranca junina de crianca?"
Sticker: caixa de perguntas

STORY 3 — Apos algumas horas

Texto: "Olha o que vocês contaram."
Repost 3-5 respostas mais legais em formato de quote em fundo cream.

CTA: Sem link. Funcao de relacionamento puro.

POS PROCESSAMENTO:
- Em monday seguinte criar um carrossel "as melhores lembranças juninas que voces compartilharam"
- UGC vira post de feed na semana seguinte$$,
  'Engajamento + UGC. Material pra feed semana seguinte.',
  'planejado'
),

(
  '2026-06-29', 'Instagram', 'Stories',
  'Caixa de perguntas: experiencia favorita de junho?',
  $$STORY 1 — Foto editorial de uma das experiencias do mes

Texto: "Junho fechou."
Sticker: nenhum

STORY 2 — Pergunta

Texto: "Conta pra mim — qual SUA experiencia favorita do mes?"
Sticker: caixa de perguntas

STORY 3 — Reposta as melhores ao longo do dia

Formato: print da resposta com fundo cream + tag pra pessoa

CTA: Sem link. Pura escuta + relacionamento.

POS PROCESSAMENTO:
- Anota as 5 mais citadas — vira post institutional na seg seguinte
- DM pessoal pra quem citou (oferta de cupom 10% pra julho)$$,
  'Engajamento + dado pra planejamento de julho.',
  'planejado'
);


-- =============================================================
-- FEED INSTAGRAM — 12 entradas estrategicas
-- =============================================================

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, hashtags, status) values

('2026-06-09', 'Instagram', 'Carrossel', '5 ideias de date a R$ 200 ou menos',
$$LEGENDA:
"5 ideias de date a R$ 200 ou menos.

Jantar + cinema custa o mesmo. Só não memoriza.

Salva pra usar essa semana — Dia dos Namorados ta na esquina.

→ Link na bio · curadoria DDN 2026"

CARROSSEL (5 slides + capa):
- Capa: "5 ideias de date a R$ 200 ou menos"
- Slide 1: Aula de coqueteleria (foto + R$ 220 + bairro)
- Slide 2: Workshop de perfumaria (foto + R$ 180 + bairro)
- Slide 3: Aula de massa fresca (foto + R$ 200 + bairro)
- Slide 4: Wine bar com degustacao (foto + R$ 160 + bairro)
- Slide 5: Day spa ofuro (foto + R$ 250 + bairro)
- Slide final: "Link na bio. Reserva em 30s."$$,
'Carrossel DDN. CTA explicito.',
'#elarah #diadosnamorados #datesp #experienciassp #saopaulo',
'planejado'),

('2026-06-11', 'Instagram', 'Feed', 'Post manifesto DDN',
$$LEGENDA:
"Algumas memorias começam quando vocês param o cinema. Encostam no balcao. E criam juntos.

12 de junho. Elarah."

IMAGEM: Foto romantica de um workshop Elarah em closeup (maos juntas, taca de vinho, etc).
FORMATO: Quadrado único. Sem CTA agressivo. Vibe editorial.$$,
'Manifesto curto. Constroi marca.',
'#elarah #diadosnamorados #offlineisafeeling',
'planejado'),

('2026-06-12', 'Instagram', 'Carrossel', 'Hoje em 12 lugares de SP — DDN Elarah',
$$LEGENDA:
"Hoje, em 12 lugares de Sao Paulo, casais e amigas estao fazendo isso em vez de rolar feed.

Por isso a gente faz Elarah. Por elas. Por eles. Por voces.

Obrigada por escolher offline hoje."

CARROSSEL (12 fotos + capa):
- Capa: "Hoje em 12 lugares de SP" + Elarah logo
- 12 fotos REAIS das experiencias rolando, uma por slide, com nome do bairro
- Slide final: "Quer viver isso? Link na bio."$$,
'Carrossel comunidade. Posta a tarde do dia 12.',
'#elarah #diadosnamorados #saopaulo #comunidade',
'planejado'),

('2026-06-13', 'Instagram', 'Feed', 'Gratidao + push Singles Day weekend',
$$LEGENDA:
"Ontem foi enorme.

Obrigada por dividir o dia mais importante do ano da Elarah com a gente.

E pra quem ficou de fora — Single's Day continua todo o fim de semana. Chama as amigas.

→ Link na bio · singles-day"

IMAGEM: Foto preto e branco editorial de uma cena do dia 12 (casal abraçado, ou grupo de amigas).
FORMATO: Quadrado.$$,
'Pivot pos-DDN. Constroi marca + push fds.',
'#elarah #singlesday #saopaulo #findesemanaSP',
'planejado'),

('2026-06-16', 'Instagram', 'Carrossel', 'Junho em SP — 10 experiencias fora do obvio',
$$LEGENDA:
"Junho em Sao Paulo nao eh so DDN.

10 experiencias autorais pra voce sair do automatico esse mes. Salva pra escolher a sua."

CARROSSEL (10 + capa):
- Capa: "Junho em SP — 10 experiencias fora do obvio"
- 10 slides com curadoria mixada (ceramica, bartender, hammam, ELarah Kids, etc.)
- Slide final: CTA pra explorar todas$$,
'Pos-DDN, reset pro mes. Autoral.',
'#elarah #saopaulo #experienciassp #junho2026',
'planejado'),

('2026-06-18', 'Instagram', 'Feed', 'Depoimento de cliente que viveu DDN',
$$LEGENDA:
"\"A gente ia mais uma vez pro mesmo restaurante. Em vez disso, fizemos massa fresca junto. Saimos com a comida feita, com farinha no cabelo, e com uma historia que a gente VAI contar. Obrigada.\"

— Patricia & Felipe, casal Elarah DDN 2026"

IMAGEM: Foto deles no workshop (com permissao) — ou foto editorial generica de maos em massa.
FORMATO: Quadrado.$$,
'Prova social. Funciona bem mid-week.',
'#elarah #depoimento #saopaulo',
'planejado'),

('2026-06-20', 'Instagram', 'Feed', 'Quote forte para fim de semana',
$$LEGENDA:
"O melhor do fim de semana NUNCA acontece na frente de uma tela."

IMAGEM: Foto editorial — uma maos em movimento (ceramica girando, pincel, faca de cozinha). Vibe cinematografica.
FORMATO: Quadrado.$$,
'Quote forte. Boa pra fds.',
'#elarah #offlineisafeeling',
'planejado'),

('2026-06-23', 'Instagram', 'Carrossel', 'Sao Joao em SP — 6 experiencias autorais',
$$LEGENDA:
"Sao Joao em Sao Paulo, sem balao de plastico nem fantasia de tia.

6 experiencias autorais pra voce viver essa semana. Tradicionais? Sim. Mas com curadoria.

→ Link na bio · São João Elarah"

CARROSSEL (6 + capa):
- Capa: "Sao Joao em SP — sem balao e sem fantasia"
- 6 slides com workshops juninos autorais
- Slide final: CTA campanha Sao Joao$$,
'Carrossel SJ. Posicionamento autoral.',
'#elarah #saojoao #junina2026 #saopaulo',
'planejado'),

('2026-06-24', 'Instagram', 'Feed', 'Quote autoral Sao Joao',
$$LEGENDA:
"As melhores tradicoes nao envolvem balao.

Envolvem voce la."

IMAGEM: Foto editorial preta e branca de uma cena junina autoral (fogueira pequena, paçoca artesanal, etc).
FORMATO: Quadrado.$$,
'Quote autoral SJ.',
'#elarah #saojoao #saopaulo',
'planejado'),

('2026-06-26', 'Instagram', 'Feed', 'Elarah Kids push: workshop ceramica',
$$LEGENDA:
"Final de semana de inverno eh desculpa pra criar.

Workshops Elarah Kids esse sabado e domingo.

Eles voltam orgulhosos. Voce volta inteiro.

→ Link na bio · elarah-kids"

IMAGEM: Foto editorial de mao infantil em ceramica.
FORMATO: Quadrado.$$,
'Push Elarah Kids.',
'#elarah #elarahkids #saopaulo',
'planejado'),

('2026-06-27', 'Instagram', 'Carrossel', 'Por que os pais amam a Elarah Kids — 6 motivos',
$$LEGENDA:
"6 motivos pelos quais pais que tentaram, voltaram.

→ Link na bio · elarah-kids"

CARROSSEL (6 + capa):
- Capa: "Por que os pais amam a Elarah Kids"
- Slide 1: "A primeira peca de ceramica feita sozinha"
- Slide 2: "Uma nova amizade"
- Slide 3: "Mais confianca pra criar"
- Slide 4: "Atividades criativas e presenciais"
- Slide 5: "Educativas sem parecer aula"
- Slide 6: "Ambientes seguros e acolhedores"
- Slide final: CTA Elarah Kids$$,
'Carrossel push final do mes.',
'#elarah #elarahkids #maternidade #saopaulo',
'planejado'),

('2026-06-30', 'Instagram', 'Feed', 'Junho na Elarah em numeros — balanco institucional',
$$LEGENDA:
"Junho na Elarah.

X casais.
Y amigas.
Z criancas.
W experiencias vividas.

Obrigada por escolher offline com a gente.

Julho ja ta em curadoria."

IMAGEM: Foto collage/grid com momentos do mes — vibe agradecimento.
FORMATO: Quadrado.$$,
'Balanco institucional. Constroi marca.',
'#elarah #junho2026 #comunidade #saopaulo',
'planejado');


-- =============================================================
-- LINKEDIN — 8 posts estrategicos
-- =============================================================

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values

('2026-06-09', 'LinkedIn', 'Post', 'Por que romantizamos jantar+cinema e ignoramos a economia das experiencias',
$$LEGENDA (Camila):

"Em 2026, mais brasileiros gastaram R$ 200 num jantar de Dia dos Namorados do que em qualquer experiencia presencial que poderia ter virado memoria.

Isso é dado, nao opiniao.

A pergunta nao eh se a economia da experiencia esta crescendo. A pergunta eh: por que ela ainda nao virou padrao na hora de comemorar com outro humano?

Tres apostas que estou fazendo na Elarah:

1) A geracao que cresceu com tela ja saturou de Netflix em casa.
2) O mercado de experiencias ainda eh visto como nicho premium — quando deveria ser DEFAULT.
3) Quem vender experiencia como ALTERNATIVA a jantar+cinema, ganha o ano de 2026.

A gente esta apostando alto. Cada experiencia que vendemos no Dia dos Namorados eh um ponto de prova de que jantar+cinema ja eh patrimonio cultural ultrapassado.

Comenta sua aposta de date pra esse ano."

CTA: Comentario aberto + tag em quem trabalha no setor.$$,
'Camila como voz. Posicionamento de mercado.',
'planejado'),

('2026-06-12', 'LinkedIn', 'Post', 'Hoje fechamos X experiencias — primeira DDN da Elarah',
$$LEGENDA (Camila — postar dia 13 manha):

"Ontem fechamos X experiencias no primeiro Dia dos Namorados oficial da Elarah.

3 aprendizados que vou levar pra sempre:

1) Casal nao quer reservar com 1 mes de antecedencia. Quer reservar segunda pra quinta. O lead-time real eh 72h. Toda a curadoria precisa estar pronta na sexta-feira anterior.

2) A categoria que MAIS converteu nao foi a mais cara — foi a com MELHOR storytelling no Instagram. Curadoria visual > preco.

3) Single's Day no mesmo dia 12 captou 28% das vendas. Counter-narrativa funciona. Vamos manter no calendario anual.

A economia da experiencia vai ser o canal mais relevante do varejo emocional na segunda metade da decada. Quem nao estiver posicionado ate 2027 ja perdeu o melhor lugar.

A gente comecou a Elarah ha [X meses] e hoje virou divisor de aguas.

Obrigada a quem confiou."

CTA: Reflection question final aberta.$$,
'Balanço pos-DDN. Posicionamento founder.',
'planejado'),

('2026-06-16', 'LinkedIn', 'Post', 'Por que junho eh o mes de maior conversao pra experiencias offline',
$$LEGENDA (Camila):

"Junho eh o mes com maior conversao de venda de experiencias presenciais no Brasil. Mas quase ninguem fala isso.

Dados internos da Elarah (mes a mes, ano corrente):

- Janeiro: 100 (base)
- Marco: 142
- Maio: 168
- Junho: 251

Por que junho?

1) Dia dos Namorados eh o catalisador.
2) Festas Juninas geram CONTEXTO para sair de casa em SP onde o frio era empecilho.
3) Inverno paulistano cria demanda por experiencias INDOOR aconchegantes (banho turco, ceramica, cozinha) — categoria que vinha sub-atendida.

Conclusao: nicho de experiencias offline eh sazonal, com pico no segundo trimestre. Quem planeja a partir disso, ganha o ano.

Como esse padrao se aplica ao seu mercado?"

CTA: Pergunta + dado.$$,
'Post de dados/insight. Conecta com fundadores e estrategistas.',
'planejado'),

('2026-06-19', 'LinkedIn', 'Post', 'Saude mental, telas e a economia da atencao',
$$LEGENDA (Camila):

"\"Saude mental eh prioridade\" virou clichê. Mas as marcas que mais investem em \"bem-estar\" estao usando seu tempo de tela como produto.

A economia da atenção sobrevive enquanto voce nao percebe quanto custou ela.

Tres horas de scroll por dia = 1.095 horas por ano = 45 dias de vida = QUASE UM MES E MEIO DA SUA VIDA EM 12 MESES.

Eu nao estou pedindo pra voce sair das redes. Estou pedindo pra voce REPARAR.

A Elarah comeca essa conversa com produto: cada experiencia eh uma hora longe da tela. Em escala — mais de 4.000 horas offline vendidas em 2026.

Nao eh sobre saude mental como discurso. Eh sobre saude mental como prática diaria.

Voce ja contou quanto tempo voce passou offline esse fim de semana?"

CTA: Conta nos comentarios.$$,
'Camila com tom autoral. Engajamento + reflexao.',
'planejado'),

('2026-06-23', 'LinkedIn', 'Post', 'Por que festas tradicionais brasileiras sao patrimonio mal aproveitado',
$$LEGENDA (Camila):

"O Brasil tem mais de 30 festas tradicionais por ano com identidade cultural unica. O mercado de experiencias presenciais explora 3 delas. Em SP, talvez 2.

Festas Juninas movimentam R$ 3 bilhoes por ano no nordeste. No sudeste, ainda fica restrito a quermesse de colegio.

Por que?

1) Branding ruim. Festa junina parece coisa de crianca.
2) Falta de curadoria. Quem quer fazer junina autoral nao sabe onde achar.
3) Tradição mal traduzida pra adulto urbano com bolso medio-alto.

Estamos testando esse ano com Sao Joao Elarah em Sao Paulo — workshops de paçoca artesanal, oficinas de quentão, jantares juninos sem balao de plastico.

Hipotese: cada festa tradicional brasileira eh um mercado emocional latente. Quem chegar primeiro com curadoria de qualidade, ganha o nicho INTEIRO.

Posso estar errado. Mas eu nao acho que estou."

CTA: Sua aposta?$$,
'Posicionamento autoral + insight de mercado.',
'planejado'),

('2026-06-26', 'LinkedIn', 'Post', 'Bastidores: como construimos a Elarah Kids em 30 dias',
$$LEGENDA (Camila):

"Em 30 dias construimos a vertical Elarah Kids do zero.

A historia rapida:

- Dia 1: Recebemos 4 reservas separadas de mes pedindo experiencia pra crianca.
- Dia 4: Definimos posicionamento — emocional, nao racional. Nao competir com colonia de ferias. Competir com tempo de tela.
- Dia 10: 6 fornecedores parceiros prontos.
- Dia 18: Pagina lancada. Primeiro hero: 'Eles vao esquecer o desenho que assistiram hoje. Mas talvez nunca esquecam a primeira peca que criaram com as proprias maos.'
- Dia 27: 38 reservas no primeiro fim de semana.

Aprendizado:

1) Voce nao precisa de 12 meses pra validar uma vertical. Precisa de demanda nao atendida + posicionamento certo.
2) Comunicar com PAIS (quem decide) nao eh igual a comunicar com CRIANCAS (quem usa). Maior erro de marketing infantil eh esquecer disso.
3) Memoria vende mais que beneficio educacional. \"Sua filha vai aprender coordenacao motora\" perdeu pra \"Sua filha vai sair com a peca dela.\"

Pra equipes pequenas: a velocidade nao eh sobre tamanho. Eh sobre clareza de tese."

CTA: Conta uma vertical sua que comecou rapido.$$,
'Construcao + storytelling. Engaja fundadores e PMs.',
'planejado'),

('2026-06-30', 'LinkedIn', 'Post', 'Balanço institucional Junho',
$$LEGENDA (Camila):

"Junho da Elarah em 5 numeros:

[X] casais vivenciaram experiencias offline em vez de jantar+cinema.
[Y] amigas viraram dia 12 em Single's Day juntas.
[Z] criancas saíram de um workshop com a propria peca.
[W] festas juninas autorais venderam vagas em ate 24h.
[V] horas offline vendidas (sim, calculamos).

Numeros importam. Mas o que importa MAIS sao os nomes por tras dos numeros.

Patricia & Felipe que viveram a primeira massa fresca juntos. Helena & Carol que decidiram 12/06 com workshop de ceramica. Joao de 6 anos com a primeira peça da vida dele.

Eh por isso que a gente faz Elarah.

Julho vai ser maior. Te vejo la."

CTA: Marca quem viveu uma Elarah em junho.$$,
'Balanço fim de mes. Constroi marca + reciprocidade.',
'planejado');


-- =============================================================
-- WHATSAPP COMUNIDADE — 10 envios (seg/qua/sex)
-- =============================================================

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values

('2026-06-09', 'WhatsApp', 'Mensagem', 'Newsletter — abertura semana DDN',
$$Envio: SEGUNDA 10h

LEGENDA (copiar e colar):

"Bom dia 💛

Última semana antes do Dia dos Namorados oficial.

As 5 experiências mais escondidas — pra quem quer fugir do óbvio:

1. [Nome exp 1] · [bairro] · [data/horário]
[link]

2. [Nome exp 2] · [bairro] · [data/horário]
[link]

3. [Nome exp 3] · [bairro] · [data/horário]
[link]

4. [Nome exp 4] · [bairro] · [data/horário]
[link]

5. [Nome exp 5] · [bairro] · [data/horário]
[link]

Reserva em 30 segundos.

— Camila"$$,
'Newsletter weekly. Atualizar nomes/links com dados reais.',
'planejado'),

('2026-06-11', 'WhatsApp', 'Mensagem', 'Urgência 24h DDN',
$$Envio: QUARTA 14h

LEGENDA:

"Faltam 24h ⏳

As 3 experiências com MAIS reservas hoje:

1. Pasta e Date nas Alturas
Últimas 2 vagas · 12/06 · [link]

2. Noite de Sabores & Amor
Últimas 3 vagas · 12/06 · [link]

3. Flower Box
Últimas 4 vagas · 12/06 · [link]

Reserva ANTES do almoço de quinta — fechamos as 23h59.

— Elarah"$$,
'Urgencia. Atualizar contagem antes de enviar.',
'planejado'),

('2026-06-13', 'WhatsApp', 'Mensagem', 'Push Singles Day weekend',
$$Envio: SEXTA 18h

LEGENDA:

"Sexta 💛

Obrigada por dividir o Dia dos Namorados ontem com a gente.

Agora é Single's Day weekend — chama as amigas:

1. Tarot + Vinho · SAB 19h · 4 vagas
[link]

2. Cerâmica + Chá pra grupo · DOM 11h · 6 vagas
[link]

3. Aula de pintura com vinho · DOM 16h · 3 vagas
[link]

Reservem juntas. Decidem em 15 min.

— Elarah"$$,
'Pivot Singles Day. Pos DDN.',
'planejado'),

('2026-06-16', 'WhatsApp', 'Mensagem', 'Newsletter semana 2 — reset junho',
$$Envio: SEGUNDA 10h

LEGENDA:

"Bom dia 💛

Junho começou de verdade. Reset.

As 3 experiências mais reservadas essa semana:

1. [Nome exp 1] · [bairro] · [data]
[link]

2. [Nome exp 2] · [bairro] · [data]
[link]

3. [Nome exp 3] · [bairro] · [data]
[link]

Spoiler: festas juninas chegando próxima semana. Curadoria autoral, sem balão de plástico.

— Camila"$$,
'Newsletter. Reset pos-DDN.',
'planejado'),

('2026-06-18', 'WhatsApp', 'Mensagem', 'Push Festas Juninas autorais',
$$Envio: QUARTA 14h

LEGENDA:

"Festas juninas chegando 🔥

Olha o que a gente armou:

1. Oficina de paçoca artesanal · 23/06 · R$ 150
Você leva pra casa. [link]

2. Workshop de doces caipiras numa cozinha real · 24/06 · R$ 180
[link]

3. Quentão + violão em bistrô charmoso · 24/06 · R$ 200
Sem balão de plástico. [link]

Junina sem perder a infância. E sem usar fantasia.

— Elarah"$$,
'Push SJ. Curadoria autoral.',
'planejado'),

('2026-06-20', 'WhatsApp', 'Mensagem', 'Agenda do fim de semana',
$$Envio: SEXTA 18h

LEGENDA:

"Sexta 💛 Agenda liberada.

3 experiências com vagas pro fim de semana:

1. SAB 14h — Coqueteleria · 4 vagas · [link]
2. DOM 11h — Aula de massa · 2 vagas · [link]
3. DOM 16h — Pintura com vinho · 3 vagas · [link]

Reserva em 30 segundos.

Cupom da comunidade: VIPCOMUNIDADE10 (10% off, até domingo).

— Elarah"$$,
'Agenda + cupom exclusivo comunidade.',
'planejado'),

('2026-06-23', 'WhatsApp', 'Mensagem', 'Newsletter Sao Joao week',
$$Envio: SEGUNDA 10h

LEGENDA:

"Bom dia 💛

Semana de São João começa hoje.

3 que ainda têm vaga (e somem rápido):

1. Oficina de paçoca artesanal · 23/06 19h · 5 vagas
[link]

2. Workshop de doces caipiras · 24/06 14h · 4 vagas
[link]

3. Quentão + violão em bistrô · 24/06 20h · 6 vagas
[link]

Junina sem balão. Junina com paçoca artesanal.

— Camila"$$,
'Newsletter SJ.',
'planejado'),

('2026-06-25', 'WhatsApp', 'Mensagem', 'Recap SJ + spoiler julho',
$$Envio: QUARTA 14h

LEGENDA:

"São João Elarah em dois dias rendeu:

✓ 4 workshops esgotados
✓ 220 paçocas artesanais feitas
✓ 1 forró ao vivo num bistrô lotado
✓ Zero balão de plástico

Próxima semana abre julho. Spoiler:

→ Chá da tarde em ateliê de cerâmica
→ Cozinha de inverno (risoto, massa, sopa)
→ Workshop infantil de chocolate quente

Adianta o que mais te interessa respondendo aqui?

— Camila"$$,
'Recap + spoiler julho. Engajamento.',
'planejado'),

('2026-06-27', 'WhatsApp', 'Mensagem', 'Push Elarah Kids — fim de semana',
$$Envio: SEXTA 18h

LEGENDA:

"Fim de semana com criança em casa? 💛

Olha o que armamos pra famílias:

1. Ceramica pra crianca · SAB 10h · R$ 120 · 6 vagas
1.5h. Cafezinho ali do lado pra você. [link]

2. Workshop de pintura + cookie · DOM 11h · R$ 140 · 4 vagas
Eles voltam orgulhosos. [link]

3. Aula de chocolate quente pra crianca · DOM 15h · R$ 140 · 5 vagas
[link]

Elarah Kids · curadoria pra crianças. E pra você descansar inteiro.

— Camila"$$,
'Push Elarah Kids. Empatia pais.',
'planejado'),

('2026-06-30', 'WhatsApp', 'Mensagem', 'Balanço junho + boas-vindas julho',
$$Envio: SEGUNDA 10h

LEGENDA:

"Junho fechou 💛

Vocês viveram:
[X] experiências DDN
[Y] dates de Singles Day
[Z] workshops infantis de Elarah Kids
[W] noites juninas autorais

Obrigada por escolher offline com a gente.

Julho chega amanhã. Em breve a primeira newsletter do mes — com agenda completa.

Quem quer ser avisada PRIMEIRO de quinta sexta com a curadoria nova, responde com 💛.

— Camila"$$,
'Balanço fim de mes. Constroi reciprocidade.',
'planejado');


-- =============================================================
-- SANITY CHECK
-- =============================================================
-- Apos rodar, conferir total:
--
-- select canal, count(*) from public.content_calendar
-- where data >= '2026-06-09' and data <= '2026-06-30'
-- group by canal;
--
-- Esperado:
--   TikTok:    15
--   Instagram: ~22 (12 feed + ~10 stories)
--   LinkedIn:   7
--   WhatsApp:  10
--   TOTAL:    ~54
-- =============================================================
