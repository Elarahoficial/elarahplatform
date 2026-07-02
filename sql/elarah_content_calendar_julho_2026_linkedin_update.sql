-- =============================================================
-- ELARAH — Atualização dos posts LinkedIn (julho 2026)
-- -------------------------------------------------------------
-- LinkedIn em 2026: algoritmo pune texto longo, premia FOTO+CURTO.
-- Refazendo os 10 posts pra formato foto-first, humano, conversacional.
-- =============================================================

-- 30/06 · Fim de junho
UPDATE public.content_calendar
SET ideia = 'Foto: ateliê à noite com mesa desarrumada + texto curto',
    legenda = '20h30.
todas foram embora.

esse foi o meu ateliê essa noite.
15 mulheres pintaram taças.
1 delas chorou. de leveza.

junho fechou aqui. 💛',
    observacao = 'FORMATO FOTO-FIRST. Postar 18h. Auto-comentário: "que semana boa essa foi. e a sua?"'
WHERE data = '2026-06-30' AND canal = 'LinkedIn';


-- 07/07 · Segunda descanso
UPDATE public.content_calendar
SET ideia = 'Foto: laptop fechado + café + mãos + texto sobre pausa',
    legenda = 'segunda, 15h.
laptop fechado.
sem culpa.

não sou produtiva o tempo todo.
sou intencional na hora certa.',
    observacao = 'FORMATO FOTO-FIRST. Postar 8h. Auto-comentário: "qual foi sua pausa dessa semana?"'
WHERE data = '2026-07-07' AND canal = 'LinkedIn';


-- 11/07 · Presença real
UPDATE public.content_calendar
SET ideia = 'Foto: mãos das clientes no workshop lip balm + texto curto',
    legenda = 'foto do meu workshop hoje.

zero celulares na mesa.
1h30 de silêncio bom.

quando elas saíram, uma disse:
"faz tempo que eu não me sentia tão presente."

é isso que eu vendo.',
    observacao = 'FORMATO FOTO-FIRST. Postar 18h após workshop.'
WHERE data = '2026-07-11' AND canal = 'LinkedIn';


-- 13/07 · Domingo intencional
UPDATE public.content_calendar
SET ideia = 'Foto: café + livro OU vista de janela + texto sobre pausar',
    legenda = 'domingo, 9h.
lista de tarefas ficou em casa.
café ficou aqui.

fundador é bom em produzir.
fundador precisa virar bom em pausar.',
    observacao = 'FORMATO FOTO-FIRST. Postar 9h.'
WHERE data = '2026-07-13' AND canal = 'LinkedIn';


-- 14/07 · Ateliê antes
UPDATE public.content_calendar
SET ideia = 'Foto: ateliê vazio antes das clientes chegarem, mesa preparada',
    legenda = 'esse é o momento antes.

antes das mulheres chegarem.
antes do papo, do barro, do vinho.

meu momento mais tranquilo do dia.
e ninguém enxerga esse trabalho de fora.',
    observacao = 'FORMATO FOTO-FIRST. Postar 8h.'
WHERE data = '2026-07-14' AND canal = 'LinkedIn';


-- 17/07 · Corporativo real
UPDATE public.content_calendar
SET ideia = 'Foto: time de empresa cliente em workshop + insight curto',
    legenda = 'foto do time de uma empresa cliente hoje.

14 pessoas.
1 workshop de cerâmica.
0 pessoas conferindo email.

happy hour da firma nunca mais vai ser bar. 👀',
    observacao = 'FORMATO FOTO-FIRST. Postar 10h. Foto REAL de time cliente (com permissão).'
WHERE data = '2026-07-17' AND canal = 'LinkedIn';


-- 21/07 · Cliente que abraçou
UPDATE public.content_calendar
SET ideia = 'Foto: você com cliente ou detalhe emocional real',
    legenda = 'nunca postei essa foto.

tirei quando eu tava exausta e uma cliente veio agradecer.
disse: "esse workshop me salvou o mês."

é caro construir marca de bem-estar.
mas é ainda mais caro esquecer POR QUE tá construindo.',
    observacao = 'FORMATO FOTO-FIRST. Postar 8h. Post pessoal — o mais forte da semana.'
WHERE data = '2026-07-21' AND canal = 'LinkedIn';


-- 27/07 · 3 lições
UPDATE public.content_calendar
SET ideia = 'Foto: mesa fim de workshop ou cliente saindo com peça',
    legenda = 'último domingo de julho.
3 coisas que aprendi esse mês:

1. cliente feliz vende mais que anúncio.
2. sua marca é o que ACONTECE, não o que tu diz.
3. produtividade sem descanso é dívida no cartão de crédito.

agosto começa em 5 dias.',
    observacao = 'FORMATO FOTO-FIRST. Postar 9h.'
WHERE data = '2026-07-27' AND canal = 'LinkedIn';


-- 28/07 · Ritual segunda
UPDATE public.content_calendar
SET ideia = 'Foto: caderno + caneta + café da manhã (mão escrevendo)',
    legenda = 'esse é meu ritual toda segunda.

nem sempre sigo o plano.
mas escrever o plano me ensina a executar.

última segunda de julho.
sua começa como?',
    observacao = 'FORMATO FOTO-FIRST. Postar 8h. Pergunta no fim = comentários.'
WHERE data = '2026-07-28' AND canal = 'LinkedIn';


-- 31/07 · Fim de julho
UPDATE public.content_calendar
SET ideia = 'Foto: mesa preparada pra workshop, luz de fim de tarde',
    legenda = 'essa foi a última mesa que preparei esse mês.

7 nomes escritos.
7 histórias que vão acontecer nas próximas 3 horas.

julho fechou aqui.
agosto começa amanhã com nomes novos.

te vejo do outro lado.',
    observacao = 'FORMATO FOTO-FIRST. Postar 18h.'
WHERE data = '2026-07-31' AND canal = 'LinkedIn';


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
-- select data, ideia, substring(legenda, 1, 60) as preview, observacao, status
-- from public.content_calendar
-- where canal = 'LinkedIn' and data >= '2026-06-30' and data <= '2026-07-31'
-- order by data;
-- =============================================================
