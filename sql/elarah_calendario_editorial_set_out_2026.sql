-- =============================================================
-- ELARAH — Calendário editorial: 15/09 a 01/11 de 2026
-- -------------------------------------------------------------
-- Montado em cima dos números reais do Agente de Eventos (set/26),
-- não de achismo. As decisões e o porquê de cada uma:
--
-- 1. PERFUMARIA É O CARRO-CHEFE (Criando seu Perfume Natural: 47
--    vendas, R$ 8.650). Ganha uma semana inteira, não um post solto.
--
-- 2. TUDO QUE VENDE É "LEVA PRA CASA" — as oito campeãs são objeto
--    feito pela pessoa (perfume, cerâmica, buquê, joia, bolsa,
--    arranjo, folding book). Nenhuma de puro consumo. Vira o eixo
--    da semana 3 e o tom de todas as legendas.
--
-- 3. TICKET ALTO ≠ VOLUME: Joalheria faz R$ 5,6 mil com 11 vendas;
--    Crochê faz R$ 5,5 mil com 33. Conteúdo de joia fala de peça
--    única; o de crochê fala de turma cheia e amiga junto.
--
-- 4. TEMAS POR PROCURA: pintura (195), vela (178), cerâmica (153),
--    perfumaria (116). São os quatro que puxam alcance — aparecem
--    nos Reels, que é onde o alcance importa.
--
-- 5. TURMAS LOTADAS = ESCASSEZ REAL (Incensos Naturais 118%,
--    Ourives 100%, Modelagem em Cerâmica 100%). Escassez verdadeira
--    converte; escassez inventada queima a marca. Só essas viram
--    post de urgência.
--
-- 6. TURMAS ENCALHADAS (Jantar às Cegas, Amigurumi e uma turma de
--    Modelagem em Cerâmica a 20%) ganham post próprio. Turma a 20%
--    não é falta de demanda no tema — cerâmica é o 3º tema da casa
--    —, é falta de gente sabendo daquela data.
--
-- 7. BUSCAS SEM OFERTA (maquiagem, bolsa de crochê, pintura em
--    porcelana, joia em vidro, mandalas, pintura giz) viram enquete.
--    Engajamento de graça e, de quebra, valida a fila de prospecção
--    de fornecedor.
--
-- 8. AGOSTO FOI O PICO (757 vendas). Fim de ano é o próximo, e
--    prospecção de RH sai 60 dias antes — por isso o LinkedIn
--    corporativo começa já em setembro, não em novembro.
--
-- 9. AS TRÊS NOVIDADES (Joias em Cerâmica R$189, Literatura &
--    Vinhos R$239, Incensaria Mud Stick R$315) abrem o mês. E a
--    Incensaria, conduzida por uma taróloga, cai no Halloween sem
--    nenhuma forçada de barra.
--
-- IDEMPOTENTE: limpa a própria janela antes de inserir, então pode
-- rodar de novo depois de editar o arquivo.
-- Rode no SQL Editor do Supabase.
-- =============================================================

delete from public.content_calendar
 where data >= '2026-09-15' and data <= '2026-11-01';

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, hashtags, status, display_order) values

-- =============================================================
-- SEMANA 1 (15–20/09) — AS TRÊS NOVIDADES
-- =============================================================
('2026-09-15', 'WhatsApp', 'Mensagem',
 'Lançamento das 3 novidades no grupo',
 $$Chegou coisa nova 🧡✨

Três experiências novinhas entraram no site — e primeira turma sempre voa 👀

1️⃣ *Faça suas Joias em Cerâmica* 💍
Você escolhe as cores, modela e monta até *2 peças* (brinco, colar, pulseira, anel ou chaveiro) com fecho de aço dourado ou prata. Sai de lá já usando 😍
📍 Cerqueira César · 3h · *R$ 189* · material incluso + voucher de R$ 50 no café

2️⃣ *Literatura & Vinhos: Orgulho e Preconceito* 📖🍷
Clube do livro com *vinho à vontade* e uma seleção inspirada nos personagens da Jane Austen.
📍 Moema · 3h · *R$ 239*

3️⃣ *Workshop Incensaria Natural: Mud Stick* 🌿🔥
Incenso natural feito por você, do jeito ancestral, com a Ana Laura — psicóloga, taróloga e bruxa em tempo integral 🔮
📍 Pinheiros · 4h · *R$ 315* · material incluso

Qual você faria primeiro? Me conta aqui 👇🧡$$,
 'Links de cada experiência vão no lugar das linhas de local. A de joias abre porque é a mais barata e a que melhor encaixa no padrão "leva pra casa e usa" — e porque Joalheria Contemporânea tem o maior ticket por venda do top 8.',
 NULL, 'planejado', 1),

('2026-09-15', 'Instagram', 'Stories',
 'Enquete: qual das 3 novidades você faria?',
 $$Story 1: "Entraram TRÊS coisas novas no site hoje 👀"
Story 2 (enquete de 3 opções): Joias em cerâmica 💍 / Literatura & vinhos 📖🍷 / Incensaria natural 🌿
Story 3: print do resultado no fim do dia + link da mais votada$$,
 'Enquete antes do post de feed: o resultado diz qual das três merece o Reels de quinta. Deixa o público escolher o que a gente vai empurrar.',
 NULL, 'planejado', 2),

('2026-09-16', 'Instagram', 'Carrossel',
 'As 3 novidades — um card pra cada',
 $$Card 1: "3 experiências novas em São Paulo 🧡"
Card 2: Joias em Cerâmica — "você sai usando o que fez" · R$ 189 · Cerqueira César
Card 3: Literatura & Vinhos — "Jane Austen com vinho à vontade" · R$ 239 · Moema
Card 4: Incensaria Mud Stick — "a prática ancestral que virou workshop" · R$ 315 · Pinheiros
Card 5: "Link na bio. Primeira turma sempre voa."

LEGENDA:
Três estreias de uma vez — e cada uma pra um tipo de sábado.

💍 Joias em Cerâmica: escolhe as cores, modela, monta e sai de lá usando. Até 2 peças, material todo incluso.
📖 Literatura & Vinhos: clube do livro com vinho à vontade. Orgulho e Preconceito, Parte I.
🌿 Incensaria Mud Stick: incenso natural feito por você, conduzido pela Ana Laura.

Qual é a sua? 🧡$$,
 'Carrossel é o formato que segura mais tempo e funciona pra comparar opções. Um card por experiência, sempre terminando no que a pessoa leva pra casa.',
 '#experienciasp #oquefazeremsp #saopaulo #artesanato', 'planejado', 1),

('2026-09-17', 'TikTok', 'Reels',
 'POV: você faz a própria joia em 3h',
 $$HOOK (0-1.5s): "Você não precisa COMPRAR o brinco. Você pode FAZER."

TEXTO NA TELA:
0-1.5s: "Você não precisa comprar o brinco"
1.5-4s: "Escolhe a cor da cerâmica"
4-7s: "Modela do jeito que quiser"
7-10s: "Queima 30 min (café rolando)"
10-13s: "Monta com fecho de aço dourado ou prata"
13-16s: "Sai de lá USANDO. R$ 189, 3h, Cerqueira César"

CENAS: mãos em closeup o tempo todo — cor, modelagem, forno, montagem. Último take: a pessoa com o brinco na orelha, sorrindo.
ÁUDIO: trend do momento, corte seco a cada frase.$$,
 'Reels de mão em closeup é o que roda em artesanato. Joia tem o maior ticket por venda do top 8 (R$ 5,6 mil em 11 vendas) — vale o esforço do Reels.',
 '#diyjoias #polymerclay #oquefazeremsp #experienciasp', 'planejado', 1),

('2026-09-18', 'WhatsApp', 'Mensagem',
 'Agenda do fim de semana',
 $$Bom dia 🧡

O que ainda tem vaga pro fim de semana:

[3 experiências com vaga, com horário e link]

Se for pra ir com alguém, chama a pessoa agora — as turmas pequenas fecham na quinta 😉$$,
 'Sexta de manhã é o horário que melhor converte pro fim de semana. Puxar da aba Experiências as turmas com vaga.',
 NULL, 'planejado', 1),

('2026-09-19', 'Instagram', 'Stories',
 'Bastidor de sábado: turma acontecendo',
 $$3 a 5 stories da turma do dia. Regra: mostrar MÃOS e PEÇA PRONTA, não rosto de longe. Fechar com "amanhã tem" + link.$$,
 'Prova social ao vivo. Sábado é o dia de maior movimento — usar.',
 NULL, 'planejado', 1),

-- =============================================================
-- SEMANA 2 (21–27/09) — PERFUMARIA, O CARRO-CHEFE
-- =============================================================
('2026-09-21', 'LinkedIn', 'Editorial',
 'Confraternização de fim de ano comeca em setembro',
 $$Toda empresa lembra da confraternização em novembro. Aí sobra o quê? Buffet lotado e a mesma noite de sempre.

Os times que a gente atendeu este ano fecharam data em setembro e outubro.

E tem uma coisa que os números mostram e eu não esperava: as experiências que mais vendem não são as de comer e beber. São as em que a pessoa FAZ alguma coisa e leva pra casa — perfume, cerâmica, buquê.

Custa o mesmo que um jantar. A diferença é que o jantar acaba às 23h e o perfume fica na estante da pessoa.

Se você cuida de gente numa empresa e quer olhar formatos, me chama. 🧡$$,
 'Prospecção de RH tem que sair 60 dias antes do pico. Agosto foi o mês mais forte (757 vendas); o próximo é dezembro. Este post é isca pra aba Prospecção B2B.',
 NULL, 'planejado', 1),

('2026-09-22', 'TikTok', 'Reels',
 'A experiencia mais vendida da Elarah nao e a que voce imagina',
 $$HOOK (0-2s): "A experiência mais vendida da Elarah não é cerâmica. Não é gastronomia. É PERFUME."

TEXTO NA TELA:
0-2s: "A mais vendida não é o que você pensa"
2-5s: "47 pessoas fizeram o próprio perfume esse ano"
5-9s: "Você escolhe as notas. Do zero."
9-12s: "Sai com o frasco na bolsa"
12-15s: "Criando seu Perfume Natural — link na bio"

CENAS: frascos, pipetas, a pessoa cheirando a blotter, o frasco final na mão.$$,
 'Carro-chefe com 47 vendas e R$ 8.650. Hook de contra-expectativa funciona porque a maioria das pessoas chuta cerâmica. Perfumaria é o 4º tema em procura (116) com ticket alto.',
 '#perfume #perfumaria #experienciasp #oquefazeremsp', 'planejado', 1),

('2026-09-24', 'Instagram', 'Carrossel',
 'Duas formas de fazer o seu perfume',
 $$Card 1: "Quer fazer o seu perfume? Tem dois caminhos 🧡"
Card 2: Criando seu Perfume Natural — o clássico da casa, o mais vendido
Card 3: Oficina Olfativa Botânica — o caminho botânico, mais autoral
Card 4: "As duas você sai com o frasco. Link na bio."

LEGENDA:
A pergunta que mais chega no direct: "qual das duas de perfume eu faço?"

A primeira é a mais pedida da casa — construção da fórmula do zero, do jeito mais direto.
A segunda vai pelo lado botânico, com um olhar mais autoral sobre as notas.

Não tem errada. Tem a sua. 🧡$$,
 'As duas de perfumaria estão no top 8 (47 e 17 vendas). Em vez de competirem entre si no feed, o carrossel posiciona as duas e responde a dúvida que já chega no direct.',
 '#perfumaria #perfumenatural #experienciasp', 'planejado', 1),

('2026-09-25', 'WhatsApp', 'Mensagem',
 'Agenda do fim de semana + aviso de turma lotando',
 $$Bom dia 🧡

Duas coisas rápidas:

1. O que tem vaga esse fim de semana: [lista + links]

2. *Modelagem em Cerâmica* está com turma lotada de novo — abrimos data nova, e essas costumam fechar na mesma semana. Link aqui: [link]

Bom fim de semana! ✨$$,
 'Modelagem em Cerâmica está 100% lotada segundo o painel. Escassez REAL — é o único tipo que vale anunciar.',
 NULL, 'planejado', 1),

('2026-09-26', 'Instagram', 'Stories',
 'Enquete: o que a gente ainda nao tem',
 $$Story 1: "Vocês pesquisam no site e a gente vê 👀"
Story 2: "Essas foram procuradas e a gente AINDA não tem:"
Story 3 (enquete): maquiagem / pintura em porcelana / mandalas / joia em vidro
Story 4: "A mais votada eu vou atrás de parceira essa semana. Promessa. 🧡"$$,
 'Termos reais buscados no site sem resultado (maquiagem, bolsa de crochê, pintura em porcelana, joia em vidro, mandalas, pintura giz). Engajamento alto e valida a fila de prospecção de fornecedor.',
 NULL, 'planejado', 1),

-- =============================================================
-- SEMANA 3 (28/09–04/10) — O EIXO: LEVA PRA CASA
-- =============================================================
('2026-09-29', 'TikTok', 'Reels',
 '8 coisas que voce leva pra casa (nenhuma e comida)',
 $$HOOK (0-2s): "Oito coisas que dá pra fazer com as próprias mãos em SP — e nenhuma delas é comida."

TEXTO NA TELA (corte rápido, 1 por item):
perfume · peça de cerâmica · buquê + home spray · joia · bolsa de crochê · arranjo floral · folding book · vela

FECHAMENTO: "Você entra de mãos vazias. Sai com uma coisa sua."

CENAS: 1,5s de cada peça pronta na mão de alguém. Ritmo rápido, mesmo enquadramento.$$,
 'Este Reels É o dado: as oito campeãs de faturamento são todas objeto feito pela pessoa. É o argumento mais forte da marca e ninguém tinha falado ele em voz alta ainda.',
 '#feitoamao #artesanato #oquefazeremsp #experienciasp', 'planejado', 1),

('2026-10-01', 'Instagram', 'Feed',
 'Foto das pecas das alunas do mes',
 $$Foto única, bem produzida: peças reais feitas pelas alunas de setembro reunidas — joias, cerâmica, velas, buquês.

LEGENDA:
Tudo nessa foto foi feito por alguém que chegou dizendo "mas eu não tenho jeito pra isso". 🧡

Setembro teve [N] pessoas passando por aqui. Cada uma saiu com uma coisa que não existia antes.

Outubro tem data nova. Link na bio.$$,
 'Prova social com objeto, não com depoimento. Reforça o eixo "leva pra casa" com a peça real.',
 '#feitoamao #artesanatosp #experienciasp', 'planejado', 1),

('2026-10-02', 'WhatsApp', 'Mensagem',
 'Agenda + Jantar as Cegas com vaga',
 $$Bom dia 🧡

Agenda do fim de semana: [lista + links]

E um convite meio diferente: o *Jantar às Cegas* ainda tem lugar. É aquela experiência que ninguém sabe explicar direito e todo mundo sai falando — você janta sem enxergar, só pelo cheiro, textura e sabor.

Se você tá procurando um programa que não seja "mais um restaurante", é esse 😉 [link]$$,
 'Jantar às Cegas está com 20% de ocupação. Não é falta de demanda, é falta de gente entendendo o que é — então a mensagem EXPLICA em vez de só anunciar.',
 NULL, 'planejado', 1),

('2026-10-03', 'Instagram', 'Stories',
 'Bastidor + caixinha de perguntas',
 $$Stories do sábado + caixinha "pode perguntar qualquer coisa sobre as oficinas". Responder em stories no domingo — vira conteúdo de graça.$$,
 'Caixinha de perguntas alimenta pauta da semana seguinte sem custo.',
 NULL, 'planejado', 1),

-- =============================================================
-- SEMANA 4 (05–11/10) — DIA DAS CRIANÇAS (12/10)
-- =============================================================
('2026-10-06', 'Instagram', 'Carrossel',
 'Dia das Criancas: presente que nao e brinquedo',
 $$Card 1: "Dia das Crianças não precisa ser mais um brinquedo 🧡"
Card 2: "Que tal uma tarde fazendo cerâmica JUNTAS?"
Card 3: Modelagem em Cerâmica — Oficina Familiar (a partir de 12 anos / até 12 anos)
Card 4: "Vocês duas saem com uma peça. E com a tarde."
Card 5: "Link na bio — 12 de outubro é segunda, dá pra emendar no fim de semana"

LEGENDA:
O brinquedo dura duas semanas. A tarde que vocês passaram juntas fica.

A gente tem oficina de cerâmica em dupla pensada pra mãe e filha (tem versão até 12 anos e a partir de 12). Cada uma faz a sua peça, as duas saem com algo na mão.

Dia das Crianças cai numa segunda esse ano — dá pra emendar no fim de semana. 🧡$$,
 'Cerâmica é o 3º tema em procura (153) e já existem as versões familiares no catálogo. 12/10 cai numa segunda — vale avisar que dá pra antecipar pro fim de semana.',
 '#diadascriancas #maeefilha #ceramica #experienciasp', 'planejado', 1),

('2026-10-08', 'TikTok', 'Reels',
 'Mae e filha fazendo ceramica juntas',
 $$HOOK (0-2s): "Presente de Dia das Crianças que a criança lembra em 2036."

TEXTO NA TELA:
0-2s: "Presente que ela lembra daqui 10 anos"
2-5s: "Não é brinquedo"
5-9s: "É a tarde que vocês passaram fazendo isso"
9-13s: [peça pronta nas duas mãos]
13-15s: "Oficina de cerâmica mãe e filha — link na bio"

CENAS: mãos pequenas e mãos adultas no mesmo barro. Sem falar, só música.$$,
 'Reels emocional para data comemorativa. Mão de criança + mão de adulto no mesmo barro é a imagem que para o scroll.',
 '#diadascriancas #maeefilha #ceramica', 'planejado', 1),

('2026-10-09', 'WhatsApp', 'Mensagem',
 'Dia das Criancas: ultimas vagas em dupla',
 $$Oi 🧡

Dia das Crianças cai na segunda (12/10) — e as oficinas em dupla de cerâmica costumam fechar antes.

Tem vaga no sábado e no domingo: [links]

Cada uma faz a sua peça. As duas levam pra casa. ✨$$,
 'Sexta antes da data. Urgência real (turma em dupla tem poucas vagas por natureza).',
 NULL, 'planejado', 1),

-- =============================================================
-- SEMANA 5 (12–18/10) — GRUPO DE AMIGAS E PRESENTE
-- =============================================================
('2026-10-13', 'TikTok', 'Reels',
 'Clube do livro com vinho a vontade',
 $$HOOK (0-2s): "Clube do livro, mas com vinho à vontade."

TEXTO NA TELA:
0-2s: "Clube do livro com vinho à vontade"
2-5s: "Orgulho e Preconceito — Parte I"
5-9s: "Vinhos escolhidos pensando nos personagens"
9-12s: "3h conversando sobre um clássico"
12-15s: "R$ 239 · Moema · link na bio"

CENAS: taça sendo servida, livro aberto na mesa, roda de conversa, risada real.$$,
 'Literatura & Vinhos é novidade e tem ticket médio-alto (R$ 239). O público de clube do livro é muito específico e engaja forte — vale Reels próprio, não só carrossel de novidades.',
 '#clubedolivro #janeausten #vinho #oquefazeremsp', 'planejado', 1),

('2026-10-15', 'Instagram', 'Carrossel',
 'O que fazer com as amigas que nao seja bar',
 $$Card 1: "Programa com as amigas que não é bar 🧡"
Card 2: Literatura & Vinhos — pra quem quer conversa de verdade
Card 3: Joias em Cerâmica — cada uma sai com uma peça
Card 4: Bolsa de Crochê — a turma inteira aprendendo junto
Card 5: "Aniversário, despedida, ou terça à toa. Link na bio."

LEGENDA:
Bar é ótimo. Mas tem dia que você quer sair de um lugar com alguma coisa além da conta dividida. 😅

Três programas pra ir em grupo — e nos três cada uma leva o que fez.

Faz aniversário ou despedida também. Chama no direct que a gente monta. 🧡$$,
 'Ponte entre conteúdo e evento privado: o carrossel termina convidando pro orçamento de grupo. Bolsa de Crochê entra porque tem volume (33 vendas) e ticket acessível, boa pra grupo grande.',
 '#programacomasamigas #despedidadesolteira #experienciasp', 'planejado', 1),

('2026-10-16', 'WhatsApp', 'Mensagem',
 'Agenda + Amigurumi com vaga',
 $$Bom dia 🧡

Agenda do fim de semana: [lista + links]

E se você já quis aprender amigurumi (aqueles bichinhos de crochê) — tem vaga nessa turma e ela é ótima pra quem nunca pegou numa agulha. Sai de lá com o bichinho pronto 🧸 [link]$$,
 'Faça seu Amigurumi está a 20% de ocupação. Crochê é o 8º tema em procura (53), então o tema tem público — o que falta é gente sabendo que essa turma existe.',
 NULL, 'planejado', 1),

('2026-10-17', 'Instagram', 'Stories',
 'Prova social: depoimento em video',
 $$Pedir pra uma aluna do sábado gravar 15s dizendo o que fez e mostrando a peça. Repostar no domingo.$$,
 'UGC custa zero e converte mais que foto profissional.',
 NULL, 'planejado', 1),

-- =============================================================
-- SEMANA 6 (19–25/10) — CORPORATIVO E FIM DE ANO
-- =============================================================
('2026-10-19', 'LinkedIn', 'Editorial',
 'O que a gente aprendeu atendendo times esse ano',
 $$Três coisas que os números da Elarah mostraram sobre ação pra equipe:

1. O que funciona é mão na massa. As experiências mais contratadas são aquelas em que cada pessoa faz e leva algo — perfume, cerâmica, buquê. Consumo passivo não aparece no topo.

2. Grupo grande e grupo pequeno pedem coisas diferentes. Tem experiência que rende com 30 pessoas e outra que só faz sentido com 12. Orçamento honesto começa por essa pergunta.

3. Quem fecha em setembro escolhe data. Quem procura em novembro escolhe o que sobrou.

Se você cuida de pessoas numa empresa e quer conversar sobre formatos, estou por aqui. 🧡$$,
 'Post de autoridade com dado próprio. Alimenta a prospecção de RH que a aba Eventos privados cobra (30-50 empresas/semana).',
 NULL, 'planejado', 1),

('2026-10-20', 'Instagram', 'Carrossel',
 'Confraternizacao que nao e no bar',
 $$Card 1: "Confraternização de fim de ano sem ser mais um bar 🧡"
Card 2: "Todo mundo faz. Todo mundo leva pra casa."
Card 3: Perfume — cada pessoa sai com o frasco dela
Card 4: Cerâmica — a peça fica na mesa da pessoa o ano inteiro
Card 5: "A partir de 12 pessoas. Chama no direct que a gente monta."

LEGENDA:
A confraternização acaba às 23h. O perfume que a pessoa fez fica na estante dela.

A gente cuida de tudo — local, material, condução. O time só aparece.

Fim de ano fecha agenda rápido: quem procura agora escolhe data. 📩$$,
 'Versão Instagram do mesmo argumento do LinkedIn — o decisor de RH também está no Instagram, e o formato visual vende melhor a experiência.',
 '#confraternizacao #eventocorporativo #experienciacorporativa', 'planejado', 1),

('2026-10-22', 'TikTok', 'Reels',
 'Empresa levando o time pra fazer perfume',
 $$HOOK (0-2s): "A empresa levou o time inteiro pra fazer perfume."

TEXTO NA TELA:
0-2s: "A empresa levou o time pra fazer perfume"
2-5s: "Cada um montou o seu"
5-9s: "Ninguém ficou no celular"
9-12s: "Todo mundo saiu com o frasco"
12-15s: "Ação pro seu time? direct 🧡"

CENAS: grupo grande rindo, mesas com frascos, alguém cheirando e fazendo careta.$$,
 'Reels corporativo com cara de gente, não de institucional. "Ninguém ficou no celular" é a dor real de quem organiza.',
 '#eventocorporativo #rh #confraternizacao', 'planejado', 1),

('2026-10-23', 'WhatsApp', 'Mensagem',
 'Agenda + aviso de gift card pro fim de ano',
 $$Bom dia 🧡

Agenda do fim de semana: [lista + links]

Ah — já dá pra garantir presente de fim de ano com *gift card*: a pessoa escolhe a experiência e a data que quiser. Sem risco de errar o presente 🎁 [link]$$,
 'Começar a plantar gift card em outubro. Em novembro a disputa por atenção triplica.',
 NULL, 'planejado', 1),

-- =============================================================
-- SEMANA 7 (26/10–01/11) — HALLOWEEN E VIRADA PRO FIM DE ANO
-- =============================================================
('2026-10-27', 'TikTok', 'Reels',
 'Workshop conduzido por uma bruxa de verdade',
 $$HOOK (0-2s): "Esse workshop é conduzido por uma bruxa. Literalmente."

TEXTO NA TELA:
0-2s: "Conduzido por uma bruxa. Literal."
2-6s: "Ana Laura: psicóloga, taróloga e bruxa em tempo integral"
6-10s: "Incensaria natural — prática ancestral, não incenso de banca"
10-13s: "Você sai com os seus incensos"
13-15s: "Pinheiros · 4h · link na bio"

CENAS: fumaça em contraluz, ervas, mãos moldando o mud stick, close na fumaça subindo.$$,
 'Semana do Halloween e a Incensaria é conduzida por uma taróloga — encaixe natural, sem forçar fantasia. E incenso tem demanda comprovada: a outra oficina de incenso está 118% lotada.',
 '#halloween #incenso #bruxaria #experienciasp', 'planejado', 1),

('2026-10-29', 'Instagram', 'Carrossel',
 'Halloween sem fantasia',
 $$Card 1: "Halloween sem fantasia, sem festa lotada 🔮"
Card 2: Incensaria Natural — a fumaça sagrada, com a Ana Laura
Card 3: "Prática ancestral, ritualística e medicinal"
Card 4: "Você sai com os seus incensos + com a cabeça mais leve"
Card 5: "31/10 é sábado. Link na bio."

LEGENDA:
Tem quem goste da festa. E tem quem prefira passar o Halloween fazendo incenso natural com uma taróloga em Pinheiros. 🔮🌿

A incensaria é uma prática ancestral — ritualística e medicinal. A Ana Laura conduz, e você sai com os seus.

Sem fantasia, sem fila. 🧡$$,
 'Segmenta o público que não curte Halloween comercial — e que é exatamente o público desta oficina.',
 '#halloween #incenso #autocuidado #experienciasp', 'planejado', 1),

('2026-10-30', 'WhatsApp', 'Mensagem',
 'Agenda de Halloween + virada de mes',
 $$Bom dia 🧡

Sábado é Halloween — e a gente tem uma coisa bem diferente: *Incensaria Natural* com a Ana Laura, taróloga. Você sai com os seus incensos 🔮 [link]

Resto da agenda do fim de semana: [lista + links]

Em novembro abre a agenda de fim de ano — se você já quer garantir data pra grupo ou empresa, me chama que eu seguro 😉$$,
 'Fecha o mês plantando a agenda de fim de ano, que é o próximo pico. Convite direto pra fechar grupo antes da corrida de novembro.',
 NULL, 'planejado', 1),

('2026-11-01', 'Instagram', 'Stories',
 'Retrospectiva de outubro + o que vem',
 $$Story 1: prints das peças de outubro
Story 2: "Novembro abre com agenda de fim de ano"
Story 3: "Grupo, empresa ou presente — chama no direct"
Story 4: enquete "você já pensou no presente de fim de ano?" sim/ainda não$$,
 'Vira o mês já falando de fim de ano e capta quem respondeu "ainda não" pra remarketing.',
 NULL, 'planejado', 1);


-- =============================================================
-- Conferência — deve mostrar 7 semanas preenchidas
-- =============================================================
select
  to_char(date_trunc('week', data), 'DD/MM')             as semana_de,
  count(*)                                               as posts,
  count(*) filter (where canal = 'Instagram')            as instagram,
  count(*) filter (where canal = 'TikTok')               as tiktok,
  count(*) filter (where canal = 'WhatsApp')             as whatsapp,
  count(*) filter (where canal = 'LinkedIn')             as linkedin
from public.content_calendar
where data between '2026-09-15' and '2026-11-01'
group by 1
order by 1;
