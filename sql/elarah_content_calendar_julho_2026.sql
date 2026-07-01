-- =============================================================
-- ELARAH — Calendário Editorial JULHO 2026
-- -------------------------------------------------------------
-- Baseado na análise estratégica das analytics:
--   - Carrossel = 6.7% eng (2x reels) → 50% do feed
--   - Autopresente = 10.7% eng (top ocasião) → pilar recorrente
--   - Amigas = 7.9% → pilar recorrente
--   - Prova social = gargalo → 1 post/semana dedicado
--   - Kids + Corporativo + Bem-estar = não explorados → novas verticais
--   - WhatsApp = 124 cliques (top) → CTA recorrente
--
-- 7 PILARES DE CONTEÚDO:
--   1. MANIFESTO (segunda) — voz Elarah
--   2. WORKSHOP FEATURE (terça)
--   3. PROVA SOCIAL (quarta) — ataca gargalo
--   4. DROP SEMANAL (quinta) — agenda curada
--   5. FIM DE SEMANA (sexta)
--   6. BASTIDOR (sábado)
--   7. PLANEJAMENTO (domingo)
-- =============================================================

-- Limpa qualquer seed anterior do mês pra ser idempotente
delete from public.content_calendar where data >= '2026-06-30' and data <= '2026-07-31';


-- ===== SEMANA 0: FIM DE JUNHO / INÍCIO JULHO (30/06 – 06/07) =====

-- Terça 30/06 (último dia de junho)
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-06-30', 'LinkedIn', 'Post', 'MANIFESTO: "Você não tá ocupada. Você tá fugindo de ficar sozinha contigo"',
 'Você não tá ocupada. Você tá fugindo de ficar sozinha contigo.

Vi isso primeiro em mim. Depois nas minhas clientes.

Quando você É o seu trabalho, descansar vira ameaça. Sentar sem propósito vira ansiedade. Tirar uma tarde "à toa" vira culpa.

A maior venda da Elarah não é workshop. É PERMISSÃO:

→ Permissão de fechar o laptop sem culpa.
→ Permissão de não responder no fim de semana.
→ Permissão de tirar duas horas pra fazer algo aparentemente inútil.

O cliente não compra a aula. Compra a desculpa de fugir dela mesma por uma tarde.

Marketing bom não convence. Ele entrega o álibi.

E sucesso adulto às vezes parece com nada. Mas pesa.

#empreendedorismo #marketing #saudemental #atencaoeconomica',
 'Postar 18h — pico de LinkedIn fim de expediente. Auto-comentário 5min depois.', 'pronto'),

('2026-06-30', 'WhatsApp', 'Mensagem', 'FIM DE JUNHO — presença ou presente',
 'Junho fechou. 💛

A pergunta antes de julho começar:

quem precisa de uma tarde TUA essa semana?

talvez você.
talvez sua mãe que segura todo mundo.
talvez aquela amiga no limite.

uma experiência Elarah pode ser presença. ou presente.

quem quer abrir julho cuidando — de si ou de alguém — entra aqui ↓
[LINK]

— Camila',
 'Postar 19h no grupo. Abre loop pra mensagem de amanhã.', 'pronto'),

('2026-06-30', 'Instagram', 'Stories', 'AQUARELA — sequência 4 stories + 1 catch-all',
 'Story 1 (15h): "sabe qual o hobby mais subestimado de SP?"
Story 2 (16h30): "aquarela versão adulta: taça, papel, pincel"
Story 3 (18h30): DETALHES [data] [bairro] [vagas] + link RESERVAR
Story 4 (20h30): "não precisa saber pintar. só precisa aparecer"
Story 5 catch-all (21h30): "aquarela não é a tua vibe? tem outras 8 experiências"',
 'Foco em vender AQUARELA (0 vendas). Sticker link "ME CONTA MAIS" nos stories 1-2, "QUERO PARTICIPAR" nos 3-5.', 'planejado');

-- Quarta 01/07 — INÍCIO JULHO
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-01', 'WhatsApp', 'Mensagem', 'JULHO COMEÇOU — recap + agenda',
 'junho fechou. 🌱

olha o que vocês criaram em 30 dias:

💛 [X] dates de Singles Day
🎁 [Y] experiências de Dia dos Namorados
🧒 [Z] tardes com a galerinha (Elarah Kids)
🌽 [W] noites juninas — sem quermesse de colégio

obrigada por terem escolhido offline com a gente.

pra julho:
↓ drops semanais (quinta e sexta)
↓ primeira newsletter sai sexta
↓ algumas surpresas que ainda guardo 👀

te vejo na semana 🌱

— Camila',
 'Postar 9h. Preencher os [X][Y][Z][W] com números reais.', 'planejado'),

('2026-07-01', 'Instagram', 'Carrossel', 'FÉRIAS KIDS NA ELARAH — 7 slides',
 'mãe, o que tu vai fazer com seu pequeno nas férias? 🫣

vem pra cá ✨

a Elarah Kids abriu 4 tardes de gastronomia em julho — cookies, cupcakes, sonhos & donuts, brigadeiro & red velvet. cada aula é uma tarde de criatividade, mãos na massa, e algo gostoso pra levar pra casa.

🍪 4 datas em Jardim das Bandeiras
⏱ 13h45 às 16h15 (2h30 cada)
👨‍🍳 todos os materiais inclusos
🎟 vagas limitadas — férias enchem rápido

salva pra escolher com calma. e me chama no whats se quiser combinar com a amiga 💬

reserva no link da bio 🌱

#elarahkids #feriasdejulho #atividadepracrianca #ferias #jardimdasbandeiras #saopaulo #aulapracrianca #cookieskids #cupcakeskids #offlineisafeeling',
 'Postar 12h30 — pega horário almoço. Capa: criança peneirando farinha.', 'planejado'),

('2026-07-01', 'TikTok', 'Reels', 'TikTok "a copa passou, e a semana?" com vídeo do acervo',
 'a copa passou.
agora o teu próximo capítulo:
cerâmica? aquarela? perfume?
tu escolhe ↓',
 'Postar 11h manhã. Vídeo de acervo de workshop + texto sobreposto. Trilha lo-fi.', 'planejado');

-- Quinta 02/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-02', 'Instagram', 'Reels', '"5 experiências pra sair da rotina em julho"',
 '5 tardes offline pra julho ✨

qual você marca primeiro?

link na bio pra reservar 🌱

#experienciaemsp #workshopsp #saopaulo #offlineisafeeling #ferias',
 'Reel 15s. Text overlay curto. Mostra 5 workshops em 3s cada.', 'planejado'),

('2026-07-02', 'WhatsApp', 'Mensagem', 'DROP SEMANAL Elarah',
 'drop semanal Elarah ✨

essa semana (até 06/07):

🍜 Cozinha Tailandesa · dom 06/07 · Jardim das Bandeiras
🍪 Cookies Kids · dom 06/07 · Jardim das Bandeiras
🎨 Pintura em Aquarela · [data] · [bairro]

vagas limitadas. me chama no PV pra eu reservar direto.

— Camila',
 'Postar 11h. Vira RITUAL semanal — mesma estrutura toda quinta.', 'planejado'),

('2026-07-02', 'Instagram', 'Stories', 'Detalhes Lip Balm 11/07 (esquenta)',
 'Story 1: "11/07 · aquele lip balm que tu sempre quis"
Story 2: detalhes data/hora/local
Story 3: countdown pra 11/07',
 '3 stories espaçados. Sticker countdown + link RESERVAR.', 'planejado');

-- Sexta 03/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-03', 'Instagram', 'Carrossel', 'ROLÊS CURADOS pra esse fim de semana — 5 slides',
 '3 jeitos de sair da mesma sexta em SP.

não é bar. não é happy hour. é presença.

slide 1: capa
slides 2-4: 3 experiências do fim de semana
slide 5: CTA link bio

qual tu escolhe pra domingo? 👀

#rolesp #dicasp #experienciaemsp #saopaulo #saopaulofimdesemana #offlineisafeeling',
 'Postar 19h. Foco em Tailandesa, Cookies Kids e outra do fds.', 'planejado'),

('2026-07-03', 'Instagram', 'Stories', 'Última chamada Cozinha Tailandesa 06/07',
 'Stories urgência: "domingo 06/07 · últimas vagas da Cozinha Tailandesa"',
 '2 stories. Sticker link RESERVAR + countdown pra 06/07.', 'planejado'),

('2026-07-03', 'TikTok', 'Reels', 'TikTok fim de semana — "3 rolês pra fugir do óbvio em SP"',
 '3 rolês pra fugir do óbvio esse fim de semana em SP ✨

link na bio 🌱

#rolesp #dicasp #saopaulo #experienciacriativa #fyp #foryou',
 'Postar 20h. Format lista rápida com cortes de workshop.', 'planejado');

-- Sábado 04/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-04', 'Instagram', 'Feed', 'BASTIDOR — foto real de você preparando um workshop',
 'eu antes do workshop começar.

o silêncio bom antes das mulheres chegarem 🌱

#bastidor #elarah #experienciaemsp #saopaulo #offlineisafeeling',
 'Post único (foto). Humaniza a marca. Sem CTA pesado.', 'planejado'),

('2026-07-04', 'Instagram', 'Stories', 'Ao vivo do workshop (se rolar)',
 'Stories em tempo real do workshop acontecendo. Momento das mãos, ambiente, cliente feliz.',
 'Bastidor real — vibe cozy.', 'planejado');

-- Domingo 05/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-05', 'Instagram', 'Carrossel', 'MANIFESTO — "O que aprendi vendendo experiências offline"',
 'aprendi 3 coisas em 6 meses vendendo offline:

1. as pessoas dizem que querem fazer algo diferente. querem mesmo. mas tem um abismo entre "querer" e "marcar".

2. o preço não é o problema. a vergonha de tirar tempo SÓ pra si é.

3. a marca mais difícil de construir é a que pede pra você desligar — porque ela compete com a sua própria desculpa.

não tô vendendo workshop. tô vendendo a coragem de aparecer.

qual dessas te bateu mais? 👀

#empreendedorismo #marca #saudemental #experienciaemsp #offlineisafeeling',
 'Postar 10h. Vira post filosófico — ganha comentário e save.', 'planejado'),

('2026-07-05', 'Instagram', 'Stories', 'Preparação semana seguinte (teaser)',
 'Story: "amanhã começa a semana mais especial de julho 👀"
Story: countdown pra segunda',
 '2 stories. Cria expectativa.', 'planejado');


-- ===== SEMANA 2: PICO DE FÉRIAS + LIP BALM + AUTOPRESENTE (07/07 – 13/07) =====

-- Segunda 07/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-07', 'Instagram', 'Carrossel', 'AUTOPRESENTE — "5 experiências pra tirar uma tarde tua"',
 'quando foi a última vez que tu se presenteou?

(sem contar comida.)

5 experiências pra tirar uma tarde SÓ tua essa semana ↓

qual chamou? conta nos comentários 💛

#autopresente #saudemental #experienciaemsp #saopaulo #offlineisafeeling #bemestar',
 'Postar 10h. Ataca ocasião TOP de engajamento (10.7%). 7 slides.', 'planejado'),

('2026-07-07', 'LinkedIn', 'Post', 'MANIFESTO segunda — "Descansar virou ato de rebeldia"',
 'Descansar virou um ato de rebeldia.

Em 2026, você não precisa de coragem pra trabalhar 80h/semana. Precisa de coragem pra fechar o laptop às 18h.

Não precisa de justificativa pra postar sua conquista. Precisa pra dizer "não fiz nada".

Descanso virou luxo. E como todo luxo, virou performático — tem gente descansando pro Instagram.

O que ninguém posta:
→ a hora que ficou sem fazer nada
→ o silêncio depois de fechar todos os apps
→ o desconforto de estar sozinha com você mesma sem produzir

A economia da atenção venceu quando te fez sentir culpada por não estar disponível.

E a virada é quando descansar deixa de ser prêmio pelo trabalho — e vira parte dele.

#empreendedorismo #saudemental #atencaoeconomica #marketing',
 'Postar 8h. LinkedIn pico manhã.', 'planejado'),

('2026-07-07', 'Instagram', 'Stories', 'Stories esquentando Cupcakes Kids + Risotos (07/07)',
 'Stories vagas restantes das aulas de hoje.',
 'Última chamada dos workshops de hoje.', 'planejado');

-- Terça 08/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-08', 'Instagram', 'Reels', 'REEL Sonhos & Donuts Kids',
 'aula de férias que dura pra sempre 🍩

seu pequeno cozinha, decora e leva pra casa uma caixinha.

08/07 · 13h45 · Jardim das Bandeiras

link na bio 🌱

#elarahkids #feriasdejulho #atividadepracrianca #donuts',
 'Reel 20s. Show do processo + criança feliz.', 'planejado'),

('2026-07-08', 'WhatsApp', 'Mensagem', 'Whats grupo — "essa semana"',
 'terça na Elarah 🌱

hoje tem Sonhos & Donuts Kids (13h45 · Jd das Bandeiras)
amanhã tem Depoimentos no feed — vai te fazer chorar 💛

essa semana ainda rolam:
🍪 Brigadeiro Kids qui 10/07
🍸 Drinks Clássicos qui 10/07 noite
💄 Lip Balm autoral sex 11/07
🎨 Pintura em Taça sáb 12/07
🌿 Vela Aromática sáb 12/07

quer que eu reserve alguma? me chama no PV.

— Camila',
 'Postar 19h. Formato "essa semana" — vira ritual.', 'planejado');

-- Quarta 09/07 — PROVA SOCIAL (ataca gargalo!)
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-09', 'Instagram', 'Carrossel', 'DEPOIMENTOS — "4 mulheres, 4 workshops, 4 tardes que ficaram" (PROVA SOCIAL)',
 'quatro mulheres. quatro workshops. quatro tardes que ficaram.

arrasta ↓

capa: título + foto editorial
slides 2-5: 1 depoimento por slide (foto + citação)
slide 6: CTA "quer viver a tua? link na bio"

qual dessas experiências chamou mais? 👀

#depoimento #experienciaemsp #saopaulo #offlineisafeeling',
 'Postar 12h. ATAQUE DIRETO AO GARGALO DE PROVA SOCIAL. Nomes podem ser reais ou pseudo.', 'planejado'),

('2026-07-09', 'Instagram', 'Stories', 'Preparação Lip Balm (sexta 11/07)',
 'Stories esquentando lip balm — mãos com materiais, foto do espaço, testemunho antigo.',
 '3 stories espaçados pelo dia. Countdown pra 11/07.', 'planejado'),

('2026-07-09', 'TikTok', 'Reels', 'TikTok "os 3 formatos mais amados pela galera na Elarah"',
 'as 3 experiências que mais bombaram na Elarah esse ano ✨

qual você faria? 👀

link na bio 🌱

#experienciaemsp #saopaulo #workshopsp #fyp #foryou',
 'Postar 20h. Formato ranking + curto.', 'planejado');

-- Quinta 10/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-10', 'Instagram', 'Reels', 'REEL "hoje: kids na tarde + drinks à noite"',
 'quinta cheia na Elarah 🌱

tarde: Brigadeiro & Red Velvet Kids (13h45)
noite: Drinks Clássicos (19h)

última chance de reservar — link na bio ✨

#elarahkids #drinks #saopaulo #bartender #experienciaemsp',
 'Reel duplo. Manhã pega os pais, noite os adultos.', 'planejado'),

('2026-07-10', 'WhatsApp', 'Mensagem', 'DROP SEMANAL Elarah',
 'drop semanal Elarah ✨

essa semana (até 13/07):

💄 Lip Balm Autoral · sex 11/07 · Cerqueira César
🎨 Pintura em Taça · sáb 12/07 · Campo Belo
🌿 Vela Aromática · sáb 12/07 · Moema

vagas limitadas. me chama no PV pra reservar.

— Camila',
 'Postar 11h. Segundo drop da semana.', 'planejado'),

('2026-07-10', 'Instagram', 'Stories', 'Últimas vagas Brigadeiro Kids + Drinks',
 'Stories urgência — sticker vaga + countdown.', 'Postar durante o dia.', 'planejado');

-- Sexta 11/07 — DIA DO LIP BALM
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-11', 'Instagram', 'Carrossel', 'LIP BALM AUTORAL — "quem já sofreu pra encontrar um lip balm que tem a tua cara?"',
 'quem aqui já sofreu pra encontrar um lip balm que tivesse a sua cara? 🤚

aquele com a textura certa, o brilho certo, o sabor que você gosta — provavelmente ainda não foi feito.

a real é simples: você pode fazer o seu ✨

dia 11/07 a gente abre o ateliê em Cerqueira César pra você criar seu lip balm autoral. textura, cor, brilho, aroma — tudo personalizado, no SEU jeito.

📅 sexta, 11/07 · 10h30 às 12h (1h30)
📍 Cerqueira César · Rua Augusta, 2690 (Galeria Ouro Fino, 2º andar)
💄 materiais, drinks e petiscos inclusos

vagas limitadas — reserva no link da bio 🌱

#workshopsp #lipbalmautoral #experienciaemsp #saopaulo #offlineisafeeling',
 'Postar 9h — hoje é O DIA. Capa: foto do espelho com paleta terracota ajustada.', 'planejado'),

('2026-07-11', 'Instagram', 'Stories', 'AO VIVO do workshop Lip Balm',
 'Stories em tempo real: mesa preparada → chegada das clientes → materiais → produto final.',
 'Documenta a experiência viva. Vira material pra próximo mês.', 'planejado'),

('2026-07-11', 'LinkedIn', 'Post', 'LinkedIn tarde: "A economia da atenção sobrevive enquanto você não percebe"',
 '3 horas por dia no celular = 45 dias da sua vida por ano. Quase 1 mês e meio.

Toda marca de "bem-estar" no Brasil diz que saúde mental é prioridade.

Mas as que mais falam disso são, em geral, as que mais consomem seu tempo de tela.

A economia da atenção sobrevive enquanto você não percebe quanto ela custou.

Eu não vim te pedir pra sair das redes. Vim te pedir pra REPARAR.

Foi por isso que eu criei a Elarah: cada experiência é uma hora longe da tela. Em escala, foram mais de 4.000 horas offline vendidas só em 2026.

Não é discurso sobre saúde mental. É prática.

Quanto tempo você passou offline esse fim de semana?

#saudemental #bemestar #economiaadaatencao #empreendedorismo #experienciasoffline',
 'Postar 18h. Post que já validamos como conversível.', 'pronto');

-- Sábado 12/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-12', 'Instagram', 'Feed', 'POST "Pintura em Taça hoje" — foto do setup',
 'hoje 10h30 · Pintura em Taça em Campo Belo ✨

taças, pincéis, mesa posta, e uma tarde só sua.

qual o setup mais bonito da semana? 🍷🎨

#pinturaemtaca #experienciaemsp #saopaulo #offlineisafeeling',
 'Post único com foto do setup real ANTES do workshop.', 'planejado'),

('2026-07-12', 'Instagram', 'Stories', 'Ao vivo dos 2 workshops (Pintura + Vela)',
 'Stories dos 2 workshops paralelos. Movimento, mãos, resultado.',
 'Dia agitado — 2 workshops em bairros diferentes.', 'planejado');

-- Domingo 13/07
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-13', 'Instagram', 'Carrossel', 'MANIFESTO — "A economia da atenção não vai te dar tempo"',
 '"saúde mental é prioridade" virou clichê.

mas quem repete mais essa frase? as marcas que mais consomem sua atenção.

toda marca de bem-estar quer que você pare mais cedo pra rolar mais tempo o feed dela.

na Elarah, a proposta é o oposto: cada workshop é uma HORA longe da tela.

não é discurso. é o produto.

qual o único jeito de recuperar o tempo? INTERROMPER o consumo.

se essa reflexão te bateu, marca uma tarde offline aqui essa semana ↓

#saudemental #atencaoeconomica #bemestar #experienciaemsp #offlineisafeeling',
 'Postar 10h. Ganha comentário/save.', 'planejado'),

('2026-07-13', 'LinkedIn', 'Post', 'Reflexão de domingo pra fundadoras',
 'Tem uma coisa que só quem construiu marca sozinha entende:

Você não escala com trabalho. Escala com CLAREZA.

O trabalho parece produtivo. Mas se a mensagem tá difusa, cada hora de esforço dilui a marca em vez de construir.

Eu passei 6 meses achando que precisava fazer MAIS.

Precisava fazer MENOS coisa. Melhor.

Menos produtos. Menos redes. Menos posicionamento tentando agradar todo mundo.

Cortei metade do que fazia. Faturei o dobro.

A lição: se você tá cansada, provavelmente a estratégia é confusa. Não é falta de esforço.

#empreendedorismo #marca #estrategia',
 'Postar 9h — LinkedIn de domingo é subestimado. Founders leem.', 'planejado');


-- ===== SEMANA 3: MEIO DE FÉRIAS + AMIGAS + CORPORATIVO (14/07 – 20/07) =====

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-14', 'Instagram', 'Carrossel', 'MANIFESTO — "Descansar virou ato de rebeldia"',
 'descansar virou rebeldia em 2026.

7 slides que a gente precisa parar de romantizar cansaço ↓

#saudemental #antihustle #bemestar #experienciaemsp #offlineisafeeling',
 'Postar 10h. Provocação forte.', 'planejado'),

('2026-07-14', 'LinkedIn', 'Post', 'Segunda LinkedIn — "Antes de otimizar produtividade, otimize descanso"',
 'Toda semana leio 3-4 posts sobre produtividade.

Nenhum sobre como descansar direito.

Isso porque descanso não é vendável. É gratuito.

Mas é ele que sustenta a produtividade.

O paradoxo é: quem melhor descansa, melhor produz. Mas ninguém quer te ensinar a descansar porque não tem produto pra vender depois.

Antes de otimizar sua próxima semana, faz isso:
→ Bloqueia 2 horas por semana pra fazer NADA
→ Escolhe um dia da semana pra deletar o Instagram do celular
→ Marca uma experiência 100% desconectada por mês

Não é workflow. É higiene.

#empreendedorismo #saudemental #produtividade',
 'Postar 8h.', 'planejado'),

('2026-07-15', 'Instagram', 'Carrossel', 'WORKSHOP FEATURE — "Experiências pra AMIGAS (não é só Galentine\'s)"',
 'experiências pra amigas — o ano inteiro, não só em Galentine\'s.

essa semana:
🎨 Pintura em Taça (sáb 12/07 — vagas ainda!)
🌿 Vela Aromática (sáb 12/07)
🍸 Drinks Clássicos (qui 17/07 — nova data!)

reserva pra 2, 3 ou 4 amigas. link na bio.

#experienciaparamigas #experienciaemsp #saopaulo #amigas #offlineisafeeling',
 'Postar 12h. Ataca 2ª melhor ocasião de eng (7.9%).', 'planejado'),

('2026-07-15', 'TikTok', 'Reels', 'TikTok "quando a gente marca essas coisas com as amigas"',
 'quando a gente marca essas coisas com as amigas ✨

qual dessas você faria com a tua? 👀

#amigas #experienciasp #rolesp #fyp',
 'Postar 12h. Formato humorístico.', 'planejado'),

('2026-07-16', 'Instagram', 'Reels', 'PROVA SOCIAL — "Cliente conta: voltar a criar depois de anos"',
 'cliente conta: "não pintava desde os 10 anos. saí de lá em prantos" 💛

essas historias são a Elarah.

qual foi a última vez que tu criou alguma coisa?

#depoimento #experienciaemsp #saopaulo #saudemental',
 'Reel 30s. Vídeo ou voz de cliente + b-roll do workshop.', 'planejado'),

('2026-07-16', 'WhatsApp', 'Mensagem', 'Whats grupo — pergunta engajamento',
 'quarta-feira e uma pergunta:

qual experiência tu ainda NÃO fez que tá te chamando? 👀

pode responder aqui — vou usar as respostas pra montar a agenda de agosto.

— Camila',
 'Postar 19h. Formato pesquisa — gera engajamento no grupo.', 'planejado'),

('2026-07-17', 'Instagram', 'Carrossel', 'CORPORATIVO — "Elarah Corporativo: 5 formatos pro seu time" (NOVA VERTICAL)',
 'seu time cansou do happy hour de sempre?

5 formatos que a Elarah criou pra empresas:

→ Kick-off criativo
→ Retrospectiva sensorial
→ Integração pra time novo
→ Comemoração de meta
→ Presente pra colaboradora

atende de 5 a 40 pessoas. em SP.

pra proposta personalizada: me chama no whats 💬

#eventocorporativo #culturadeempresa #teambuilding #saopaulo #experienciaemsp #eventoparaempresa',
 'Postar 10h. Ataca ocasião NÃO EXPLORADA. Vira post DUPLO no LinkedIn.', 'planejado'),

('2026-07-17', 'LinkedIn', 'Post', 'LinkedIn B2B — "Por que empresas estão trocando happy hour por experiência criativa"',
 'Toda semana recebo mensagens de RH e founders me contando a mesma coisa:

"O happy hour da empresa virou obrigação."

Não é falta de vontade da equipe. É que ninguém quer mais gastar sexta 20h num bar cheio conversando sobre nada.

A geração que entrou no mercado agora troca happy hour por: workshop criativo, jantar temático, oficina de arte.

Motivo? Sai da mesa comum uma HISTÓRIA. Alguém aprendeu a fazer sabão. Outra criou um perfume. Um time inteiro pintou uma tela coletiva.

Isso vira memória compartilhada. Cultura organizacional.

Happy hour vira gasto. Experiência vira patrimônio de time.

Se sua empresa ainda paga bar como benefício, considera reformular. Não precisa de orçamento maior — precisa de intenção diferente.

(Se ficou curioso pra saber como funciona: me chama no privado.)

#culturadeempresa #eventocorporativo #teambuilding #recursoshumanos',
 'Postar 10h. Post B2B — atrai leads corporativos.', 'planejado'),

('2026-07-17', 'WhatsApp', 'Mensagem', 'Drop semanal',
 'drop semanal ✨

essa semana (até 20/07):

🍸 Drinks Clássicos · qui 17/07 · Jd das Bandeiras
[+ preencher com experiências reais da semana]

vagas limitadas. me chama no PV.

— Camila',
 'Postar 11h. Ritual.', 'planejado'),

('2026-07-18', 'Instagram', 'Reels', 'Reel "Rolês de sexta em SP"',
 '3 rolês de sexta em SP que não é bar ✨

link na bio 🌱

#rolesp #dicasp #saopaulo #fyp',
 'Reel 20s. Vibe fim de semana.', 'planejado'),

('2026-07-18', 'TikTok', 'Reels', 'TikTok fim de semana — mesma vibe do reel',
 'mesmo conteúdo do reel adaptado pra TikTok, com hashtags de descoberta.',
 'Postar 20h.', 'planejado'),

('2026-07-19', 'Instagram', 'Feed', 'BASTIDOR sábado — foto de você organizando um workshop',
 'sábado, 9h30. o momento antes das mulheres chegarem 🌱

fico observando a mesa posta como se fosse a primeira vez.

essa é minha parte favorita.

#bastidor #elarah #saopaulo',
 'Post único humanização.', 'planejado'),

('2026-07-19', 'Instagram', 'Stories', 'Ao vivo do workshop de sábado',
 'Stories em tempo real.',
 '', 'planejado'),

('2026-07-20', 'Instagram', 'Carrossel', 'PLANEJAMENTO — "5 experiências pra terceira semana de férias"',
 'terceira semana de férias. e a criança tá pedindo alguma coisa 🫠

5 experiências criativas pra essa semana ↓

#ferias #atividadepracrianca #elarahkids #saopaulo',
 'Postar 10h. Continua vertical Kids.', 'planejado');


-- ===== SEMANA 4: FIM DE FÉRIAS + BEM-ESTAR (21/07 – 27/07) =====

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-21', 'Instagram', 'Carrossel', 'MANIFESTO — "Bem-estar não é uma quinta de yoga"',
 'bem-estar não é uma quinta de yoga.

é o resto dos 6 dias.

7 slides sobre por que "auto-cuidado" virou marketing e o que realmente importa ↓

#bemestar #saudemental #antihustle #experienciaemsp #offlineisafeeling',
 'Postar 10h. Introduz PILAR NOVO: BEM-ESTAR.', 'planejado'),

('2026-07-21', 'LinkedIn', 'Post', 'LinkedIn segunda — "O bem-estar performático"',
 'Bem-estar virou métrica.

Antes: "como você está?"
Agora: "quanto você meditou essa semana?"

Substituímos a pergunta pela KPI.

E é irônico: transformar bem-estar em métrica MATA o bem-estar. Vira mais uma tarefa a cumprir.

A meditação vira scroll de app. A caminhada vira minutos no relógio. O descanso vira "quantas horas de sono".

Quando bem-estar precisa ser MEDIDO pra existir, não é mais bem-estar. É produtividade disfarçada.

O paradoxo do mercado wellness em 2026: nunca faturou tanto. Nunca as pessoas se sentiram tão mal.

#bemestar #saudemental #economia',
 'Postar 8h.', 'planejado'),

('2026-07-22', 'Instagram', 'Carrossel', 'WORKSHOP FEATURE — "Experiências pra desacelerar em SP"',
 'desacelerar em SP é ATO POLÍTICO.

5 experiências curadas pra você fazer o oposto do que a cidade te pede ↓

🌿 Vela Aromática
🏺 Cerâmica
🎨 Pintura em Aquarela
[+ mais 2]

link na bio 🌱

#desacelerar #bemestar #saopaulo #experienciaemsp #offlineisafeeling',
 'Postar 12h.', 'planejado'),

('2026-07-22', 'TikTok', 'Reels', 'TikTok "as 3 experiências mais silenciosas da Elarah"',
 'as 3 experiências mais silenciosas ⏳

qual você precisa mais essa semana?

#saudemental #saopaulo #experienciacriativa #fyp',
 'Postar 20h.', 'planejado'),

('2026-07-23', 'Instagram', 'Reels', 'PROVA SOCIAL — "Antes e depois de uma experiência Elarah"',
 'antes e depois de uma experiência Elarah 💛

qual dessas emoções tu quer viver essa semana?

link na bio 🌱

#depoimento #antesedepois #experienciaemsp #saudemental',
 'Reel de contraste emocional.', 'planejado'),

('2026-07-23', 'WhatsApp', 'Mensagem', 'Whats grupo — pergunta bem-estar',
 'pergunta de quarta:

qual foi a última coisa que tu fez que NÃO produziu nada — mas fez tu se sentir bem? 👀

pode ser bobo. quero saber.

— Camila',
 'Postar 19h. Formato pesquisa emocional.', 'planejado'),

('2026-07-24', 'Instagram', 'Carrossel', 'DROP — "Última semana pra viver julho"',
 'última semana pra viver julho.

o que tem essa semana:
[+ preencher com experiências da semana]

reserva no link da bio 🌱

#saopaulo #experienciaemsp #ultimasvagas',
 'Postar 10h. Senso de fim.', 'planejado'),

('2026-07-24', 'WhatsApp', 'Mensagem', 'Drop semanal',
 'drop da última semana de julho ✨

[+ preencher com experiências reais]

quer reservar? me chama no PV.

— Camila',
 'Postar 11h.', 'planejado'),

('2026-07-25', 'Instagram', 'Reels', 'REEL "5 razões pra pausar antes de agosto"',
 '5 razões pra pausar antes de agosto começar 🌱

qual te bateu? conta ↓

link na bio pra marcar tua pausa ✨

#pausa #saudemental #saopaulo #experienciaemsp',
 'Reel 25s. Fim de semana.', 'planejado'),

('2026-07-25', 'TikTok', 'Reels', 'TikTok fim de semana',
 'Vídeo curto vibe fds.',
 'Postar 20h.', 'planejado'),

('2026-07-26', 'Instagram', 'Feed', 'BASTIDOR sábado',
 'sábado de novo. e a rotina desse ateliê é a única rotina que eu não me canso 🌱

#bastidor #elarah',
 'Post único humanização.', 'planejado'),

('2026-07-27', 'Instagram', 'Carrossel', 'PLANEJAMENTO — "Agosto vem aí: agenda inteira aberta"',
 'agosto começa em 5 dias.

agenda da Elarah TÁ ABERTA 👀

o que preparei pra você em agosto:
→ [pilares principais de agosto]
→ novidades que ainda tô guardando
→ primeira semana já com vagas

quer ser avisada primeiro? responde 🌱 no comentário.

#agosto #saopaulo #experienciaemsp',
 'Postar 10h. Cria expectativa pra agosto.', 'planejado'),

('2026-07-27', 'LinkedIn', 'Post', 'LinkedIn domingo — "3 aprendizados de julho"',
 'Julho terminando. 3 aprendizados dessa curadoria:

1. Vender "descanso" é vender coragem — não conforto.
2. Cliente que RESERVA a segunda vez virou marca — não cliente.
3. Corporativo procura MAIS experiência do que produto B2B tradicional deixa aparecer.

Julho me ensinou que o que separa um negócio pequeno de um forte não é escala. É clareza de OFERTA.

Agosto começa amanhã. E ele já tem cara.

#empreendedorismo #marketing #experienciaemsp',
 'Postar 9h.', 'planejado');


-- ===== SEMANA 5: FECHA JULHO (28/07 – 31/07) =====

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-07-28', 'Instagram', 'Carrossel', 'MANIFESTO fim de mês — "Julho me ensinou 3 coisas"',
 'julho me ensinou 3 coisas.

7 slides ↓

qual dessas te acompanha? 💛

#reflexao #julho #experienciaemsp #offlineisafeeling',
 'Postar 10h.', 'planejado'),

('2026-07-28', 'LinkedIn', 'Post', 'Fim de mês — insight sem números',
 'Última segunda de julho.

Você vai fazer o que sempre faz? Ou vai deixar essa semana ser diferente?

A gente romantiza "recomeço" no dia 1. Mas o dia 28 também vale.

Aquela pausa que você adiou o mês inteiro cabe agora.

Aquele "eu preciso de um tempo" que você não deu, ainda dá.

O único dia perdido é o que ainda não chegou.

#segundafeira #empreendedorismo #saudemental',
 'Postar 8h.', 'planejado'),

('2026-07-29', 'Instagram', 'Carrossel', 'RECAP — "Melhores momentos de julho na Elarah"',
 'julho ficou. e olha o que criamos junto 💛

7 slides com momentos + prints + peças

#julho #recap #experienciaemsp #offlineisafeeling',
 'Postar 12h. Recap emocional visual.', 'planejado'),

('2026-07-29', 'WhatsApp', 'Mensagem', 'Whats grupo — julho fechando',
 'julho quase indo 🌱

antes do mês terminar: qual foi a tua melhor tarde offline?

conta aqui — quero mesmo saber.

— Camila',
 'Postar 19h. Formato conexão.', 'planejado'),

('2026-07-30', 'Instagram', 'Reels', 'PROVA SOCIAL — "Cliente conta como foi julho"',
 'cliente contou como foi julho dela na Elarah 💛

[b-roll workshops + trecho depoimento]

#depoimento #julho #saopaulo',
 'Reel emocional 30s.', 'planejado'),

('2026-07-30', 'TikTok', 'Reels', 'TikTok "julho na Elarah em 20 segundos"',
 'julho na Elarah em 20 segundos ✨

qual foi teu momento favorito?

#julho #saopaulo #experienciacriativa #fyp',
 'Recap visual.', 'planejado'),

('2026-07-31', 'Instagram', 'Feed', 'FECHAMENTO — "Julho fechou. Agosto começa amanhã"',
 'julho fechou.

agosto começa amanhã com curadoria nova.

quem quer ser avisada primeiro, responde aqui com 💛

#fimjulho #agosto #saopaulo #experienciaemsp',
 'Post único. Post-anúncio.', 'planejado'),

('2026-07-31', 'LinkedIn', 'Post', 'Fim de julho — reflexão fundadora',
 'Fechar um mês num negócio pequeno é uma micro-morte.

Você olha o que fez, mede o que aprendeu, aceita o que não deu certo.

E na quinta às 23h59 você VIRA A PÁGINA sem cerimônia.

Foi assim em julho. Vai ser assim em agosto.

O que muda: a clareza aumenta.

Cada mês fechado é uma versão sua um pouco menos confusa.

#empreendedorismo #processocriativo',
 'Postar 18h. Fim de mês reflexivo.', 'planejado'),

('2026-07-31', 'WhatsApp', 'Mensagem', 'Fechamento julho no grupo',
 'julho fechou 🌱

obrigada por tudo que vivemos junto — cada workshop, cada tarde, cada mensagem aqui.

agosto começa amanhã. e vem com:
↓ agenda inteira nova
↓ primeira newsletter no dia 1
↓ algumas coisas que ainda tô guardando 👀

te vejo do outro lado 💛

— Camila',
 'Postar 20h. Fecha o mês com afeto.', 'planejado');


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
-- select data, canal, tipo, ideia, status
-- from public.content_calendar
-- where data >= '2026-06-30' and data <= '2026-07-31'
-- order by data, canal;
-- =============================================================
