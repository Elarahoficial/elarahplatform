-- =============================================================
-- ELARAH — Cronograma de conteúdo MAIO 2026 (volume aumentado)
-- -------------------------------------------------------------
-- Substitui o seed anterior com a frequência nova:
--   TikTok:    4x/semana mínimo
--   Stories:   todos os dias
--   Reels:     3x/semana
--   Feed:      2x/semana
--   LinkedIn:  2x/semana mínimo
--
-- + WhatsApp Comunidade (engajamento) e WhatsApp Curado (promo).
--
-- IDEMPOTENTE — apaga tudo de maio antes de inserir.
-- =============================================================

delete from public.content_calendar where data >= '2026-05-01' and data <= '2026-05-31';

insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values

-- ============ SEMANA 1 (1-3/5) — abertura ============
('2026-05-01', 'Instagram', 'Feed', 'Editorial sensorial: "Maio começa devagar"', 'Maio começa devagar. Não tem pressa. Tem tempo, tem corpo, tem presença. 🤍', 'Sexta — feed editorial', 'publicado'),
('2026-05-01', 'Instagram', 'Stories', 'Story do dia: chegada de maio', '🤍 maio chegou.', '', 'publicado'),
('2026-05-01', 'Instagram', 'Reels', 'Reels: corte de cenas curtas das experiências do mês', 'Maio em 15s.', 'Sexta — reels abertura', 'publicado'),
('2026-05-01', 'TikTok', 'Reels', 'TikTok: mesmo reel do IG adaptado', 'Maio começa devagar. 🤍', 'Crosspost', 'publicado'),
('2026-05-02', 'Instagram', 'Stories', 'Stories sábado: bastidor do ateliê', 'Onde o tempo desacelera.', '', 'publicado'),
('2026-05-02', 'TikTok', 'Reels', 'TikTok: POV "minha tarde no ateliê"', '', '', 'publicado'),
('2026-05-02', 'WhatsApp', 'Mensagem', 'Curado: abertura do mês', '🤍 maio chegou na Elarah. olha o que preparamos:\n[link agenda]', '', 'publicado'),
('2026-05-03', 'Instagram', 'Stories', 'Stories editorial dominical', 'domingo é pra o corpo respirar.', '', 'publicado'),

-- ============ SEMANA 2 (4-10/5) — boas-vindas + curadoria ============
('2026-05-04', 'Instagram', 'Carrossel', 'Carrossel: "Agenda Elarah — Maio" (10 experiências)', 'Maio na Elarah. Cada experiência foi escolhida pra te tirar do automático. Salva pra escolher a sua.', 'Segunda — curadoria semanal', 'publicado'),
('2026-05-04', 'Instagram', 'Stories', 'Stories segunda: lembrete da nova agenda', 'agenda nova chegou. corre ver. 🤍', '', 'publicado'),
('2026-05-04', 'TikTok', 'Reels', 'TikTok: "10 experiências em 30s" (rápido)', '10 experiências pra esse mês 🤍', 'TikTok rapidão', 'publicado'),
('2026-05-04', 'LinkedIn', 'Post', 'B2B: "Por que empresas estão substituindo happy hour por experiências criativas"', '[post B2B sobre experiências corporativas — gancho cultura organizacional]', 'Segunda LinkedIn', 'publicado'),
('2026-05-05', 'Instagram', 'Feed', 'Conheça [Parceiro 1] — bastidor do ateliê', 'Quem está por trás de [nome do parceiro] na Elarah.', 'Terça — bastidor parceiro', 'publicado'),
('2026-05-05', 'Instagram', 'Stories', 'Stories: bastidor parceiro', 'um lugar pra desacelerar e criar.', '', 'publicado'),
('2026-05-05', 'TikTok', 'Reels', 'TikTok: 15s do parceiro montando experiência', '', 'Bastidor', 'publicado'),
('2026-05-06', 'Instagram', 'Stories', 'Stories educacionais: "Por que sair da tela faz bem" (5 cards)', '', 'Quarta educacional', 'publicado'),
('2026-05-06', 'WhatsApp', 'Mensagem', 'Curado: curadoria fim de semana', '🤍 fim de semana chegando. 3 experiências pra você viver:\n[lista]', '', 'publicado'),
('2026-05-07', 'Instagram', 'Carrossel', '"5 experiências pra esse fim de semana"', 'Sexta tá perto. Aqui vão 5 ideias pra fugir do automático.', 'Quinta — curadoria', 'publicado'),
('2026-05-07', 'Instagram', 'Stories', 'Stories quinta: contagem regressiva pro fim de semana', '', '', 'publicado'),
('2026-05-07', 'TikTok', 'Reels', 'TikTok: dicas rápidas "como ter um fim de semana offline"', '', '', 'publicado'),
('2026-05-08', 'Instagram', 'Reels', 'Reel mão criando: silencioso + 1 tipografia', 'Mãos na argila. Sem trilha. Só o som da matéria.', 'Sexta — mão em ação', 'publicado'),
('2026-05-08', 'Instagram', 'Stories', 'Stories sexta: "Boa sexta. Te vejo no ateliê"', '', '', 'publicado'),
('2026-05-08', 'TikTok', 'Reels', 'TikTok crosspost do reel sexta', '', '', 'publicado'),
('2026-05-09', 'Instagram', 'Stories', 'Stories sábado: última vaga real (3-4 stories)', 'última vaga em [exp] HOJE.', 'Urgência real', 'publicado'),
('2026-05-09', 'LinkedIn', 'Post', 'Case: empresa cliente que fez experiência em equipe', '[case real ou template] — engajamento via cultura', '2º post da semana no LI', 'publicado'),
('2026-05-10', 'Instagram', 'Feed', 'Editorial domingo: depoimento', '"foi a pausa mais necessária do meu mês." — [cliente]', 'Domingo — depoimento', 'publicado'),
('2026-05-10', 'Instagram', 'Stories', 'Stories domingo: reflexão', '', '', 'publicado'),
('2026-05-10', 'WhatsApp', 'Mensagem', 'Curado: destaque parceiro novo', '🤍 novo parceiro chegou: [nome]. olha o que ele criou:\n[link]', '', 'publicado'),

-- ============ SEMANA 3 (11-17/5) — categoria foco (floral) ============
('2026-05-11', 'Instagram', 'Feed', '"Essa semana a gente fala de flores"', 'Maio mergulhou no floral. Essa é a vez delas.', 'Segunda — abertura categoria', 'publicado'),
('2026-05-11', 'Instagram', 'Stories', 'Bastidor floricultura parceira', 'onde nascem os buquês.', '', 'publicado'),
('2026-05-11', 'TikTok', 'Reels', 'TikTok: "como nasce um buquê"', '', 'TikTok bastidor', 'publicado'),
('2026-05-11', 'LinkedIn', 'Post', 'B2B: vivências corporativas em florais (team building)', '', 'Segunda LI', 'publicado'),
('2026-05-12', 'Instagram', 'Reels', 'Reel floral + slow motion', 'O que acontece quando você corta uma flor com tempo.', 'Terça — reel emocional', 'publicado'),
('2026-05-12', 'Instagram', 'Stories', 'Stories terça', '', '', 'publicado'),
('2026-05-12', 'TikTok', 'Reels', 'TikTok do reel floral adaptado', '', 'Crosspost', 'publicado'),
('2026-05-13', 'Instagram', 'Carrossel', '"Como escolher seu primeiro buquê" (3 dicas)', 'Primeira vez fazendo um buquê? 3 coisas pra saber antes.', 'Quarta — educacional', 'planejado'),
('2026-05-13', 'Instagram', 'Stories', 'Stories quarta: dicas extras + sticker pergunta', '', '', 'planejado'),
('2026-05-13', 'TikTok', 'Reels', 'TikTok: dicas rápidas de floral', '', '', 'planejado'),
('2026-05-13', 'WhatsApp', 'Enquete', 'Comunidade: enquete "qual experiência você quer ver mais?"', 'Opções: 🎨 Pintura · 🍷 Bartender · 🌸 Floral · 🍳 Gastronomia', '', 'planejado'),
('2026-05-14', 'Instagram', 'Feed', '"Todos os ateliês de floral na Elarah" (grid)', 'Os ateliês de floral curados pela Elarah, num só lugar.', 'Quinta — grid categoria', 'planejado'),
('2026-05-14', 'Instagram', 'Stories', 'Stories quinta', '', '', 'planejado'),
('2026-05-14', 'TikTok', 'Reels', 'TikTok: galeria rápida dos ateliês', '', '', 'planejado'),
('2026-05-14', 'WhatsApp', 'Mensagem', 'Curado: última vaga da semana', '🤍 última vaga em [exp floral] esse fim de semana.\nQuer? [link]', '', 'planejado'),
('2026-05-15', 'Instagram', 'Reels', 'Reels sexta: bastidor da prep do final de semana', '', 'Sexta — bastidor', 'planejado'),
('2026-05-15', 'Instagram', 'Stories', 'Stories sexta: preparação do ateliê', '', '', 'planejado'),
('2026-05-15', 'TikTok', 'Reels', 'TikTok sexta: prep do ateliê em fast forward', '', '', 'planejado'),
('2026-05-15', 'WhatsApp', 'Mensagem', 'Comunidade: foto da equipe Elarah preparando', 'quem cuida da magia. 🤍', '', 'planejado'),
('2026-05-16', 'Instagram', 'Stories', 'Stories sábado: live ou bastidor real', '', 'Live se rolar', 'planejado'),
('2026-05-16', 'LinkedIn', 'Post', 'B2B: dado/estatística sobre cultura de bem-estar', '', '2º LI da semana', 'planejado'),
('2026-05-17', 'Instagram', 'Feed', 'Depoimento da semana de floral', '"saí com um buquê e com a cabeça leve." — [cliente]', 'Domingo — depoimento', 'planejado'),
('2026-05-17', 'Instagram', 'Stories', 'Stories domingo', '', '', 'planejado'),
('2026-05-17', 'WhatsApp', 'Mensagem', 'Curado: síntese da semana de floral', '🤍 essa semana foi floral. quer relembrar tudo?\n[link]', '', 'planejado'),

-- ============ SEMANA 4 (18-24/5) — criativo ============
('2026-05-18', 'Instagram', 'Feed', '"Coisas não óbvias pra fazer essa semana"', 'A lista de coisas que ninguém te indicou pra essa semana.', 'Segunda — curadoria criativa', 'planejado'),
('2026-05-18', 'Instagram', 'Stories', 'Stories segunda: curadoria', '', '', 'planejado'),
('2026-05-18', 'TikTok', 'Reels', 'TikTok: 3 ideias rápidas pra essa semana', '', '', 'planejado'),
('2026-05-18', 'LinkedIn', 'Post', 'B2B: "Cultura de presente: o que está mudando em 2026"', '', 'Segunda LI', 'planejado'),
('2026-05-18', 'WhatsApp', 'Enquete', 'Comunidade: enquete "o que você faz pra desacelerar?"', 'Opções: respirar · andar · cozinhar · criar · só silêncio', '', 'planejado'),
('2026-05-19', 'Instagram', 'Reels', 'POV: "Minha experiência na Elarah"', 'Quando você sai de uma experiência Elarah.', 'Terça — POV emocional', 'planejado'),
('2026-05-19', 'Instagram', 'Stories', 'Stories terça', '', '', 'planejado'),
('2026-05-19', 'TikTok', 'Reels', 'TikTok do POV adaptado', '', '', 'planejado'),
('2026-05-20', 'Instagram', 'Stories', 'Caixinha de perguntas: "que tipo de experiência você quer ver mais?"', 'Conta pra gente.', 'Quarta — interação', 'planejado'),
('2026-05-20', 'TikTok', 'Reels', 'TikTok: respondendo enquete da semana', '', '', 'planejado'),
('2026-05-20', 'WhatsApp', 'Mensagem', 'Comunidade: frase Offline is a feeling', 'Offline is a feeling. 🤍', '', 'planejado'),
('2026-05-21', 'Instagram', 'Carrossel', '"Presente diferente pra Dia dos Namorados"', 'Sem flor. Sem chocolate. Uma experiência pra vocês viverem juntos.', 'Quinta — gancho DDN', 'planejado'),
('2026-05-21', 'Instagram', 'Stories', 'Stories quinta: spoiler DDN', '', '', 'planejado'),
('2026-05-21', 'TikTok', 'Reels', 'TikTok: gancho DDN com casal real (UGC)', '', '', 'planejado'),
('2026-05-21', 'WhatsApp', 'Mensagem', 'Curado: curadoria fim de semana', '🤍 fim de semana à vista. 3 ideias pra escapar do automático:\n[lista]', '', 'planejado'),
('2026-05-22', 'Instagram', 'Reels', 'Reels: anúncio parceiro novo', 'Bem-vindo, [nome]. A partir de junho vocês podem viver isso na Elarah.', 'Sexta — anúncio', 'planejado'),
('2026-05-22', 'Instagram', 'Stories', 'Stories sexta', '', '', 'planejado'),
('2026-05-22', 'TikTok', 'Reels', 'TikTok do anúncio do novo parceiro', '', '', 'planejado'),
('2026-05-22', 'WhatsApp', 'Mensagem', 'Comunidade: spoiler experiência DDN', '🤍 spoiler: a próxima experiência DDN é... [emoji enigmático]\nadivinha?', '', 'planejado'),
('2026-05-23', 'Instagram', 'Stories', 'Stories sábado: última vaga', '🤍 1 vaga restante em [exp].', '', 'planejado'),
('2026-05-23', 'LinkedIn', 'Post', 'B2B: editorial "experiência > objeto na cultura corporativa"', '', '2º LI da semana', 'planejado'),
('2026-05-24', 'Instagram', 'Feed', 'Editorial dominical: compilado mãos criando', 'Mãos. Tempo. Memória.', 'Domingo — editorial', 'planejado'),
('2026-05-24', 'Instagram', 'Stories', 'Stories domingo', '', '', 'planejado'),

-- ============ SEMANA 5 (25-31/5) — retrospectiva + teaser DDN ============
('2026-05-25', 'Instagram', 'Carrossel', '"O que rolou na Elarah em maio"', 'Maio foi cheio. Aqui está o que vocês viveram.', 'Segunda — retrospectiva', 'planejado'),
('2026-05-25', 'Instagram', 'Stories', 'Stories segunda: highlights da retrospectiva', '', '', 'planejado'),
('2026-05-25', 'TikTok', 'Reels', 'TikTok: melhores momentos do mês', '', '', 'planejado'),
('2026-05-25', 'LinkedIn', 'Post', 'Editorial: "O que cultura organizacional virou em 2026"', '', 'Segunda LI', 'planejado'),
('2026-05-25', 'WhatsApp', 'Mensagem', 'Curado: destaque DDN', '🤍 dia dos namorados a duas semanas. olha o que separamos pra vocês:\n[link campanha DDN]', '', 'planejado'),
('2026-05-26', 'Instagram', 'Reels', 'Reels: depoimentos reais (3-4 prints/vídeos)', 'Quem viveu, conta. 🤍', 'Terça — depoimentos', 'planejado'),
('2026-05-26', 'Instagram', 'Stories', 'Stories terça', '', '', 'planejado'),
('2026-05-26', 'TikTok', 'Reels', 'TikTok: depoimentos compilados', '', '', 'planejado'),
('2026-05-26', 'WhatsApp', 'Enquete', 'Comunidade: enquete "plano pro DDN?"', 'Opções: 🍷 jantar · 🎨 experiência criativa · 🌿 viagem · ainda não sei', '', 'planejado'),
('2026-05-27', 'Instagram', 'Stories', 'Stories: caixinha "o que você quer em junho?"', '', '', 'planejado'),
('2026-05-27', 'TikTok', 'Reels', '"Maio em 30 segundos" (compilado)', 'Um mês na Elarah, em 30 segundos.', 'Quarta — reel retrospectiva', 'planejado'),
('2026-05-28', 'Instagram', 'Feed', '"Vem aí em junho" (teaser DDN)', 'Junho na Elarah começa com Dia dos Namorados. Em breve.', 'Quinta — teaser', 'planejado'),
('2026-05-28', 'Instagram', 'Stories', 'Stories quinta: teaser DDN', '', '', 'planejado'),
('2026-05-28', 'TikTok', 'Reels', 'TikTok: teaser visual DDN', '', '', 'planejado'),
('2026-05-28', 'WhatsApp', 'Mensagem', 'Comunidade: mensagem emocional fim de mês', 'maio foi gostoso de viver junto. obrigada por estar aqui. 🤍', '', 'planejado'),
('2026-05-29', 'Instagram', 'Stories', 'Stories sexta: agradecimento + CTA grupo VIP', 'Maio foi com vocês. Junho vai ser mais. 👉 entre no grupo VIP', '', 'planejado'),
('2026-05-29', 'Instagram', 'Reels', 'Reels: bastidor da equipe agradecendo', '', '', 'planejado'),
('2026-05-29', 'TikTok', 'Reels', 'TikTok: equipe Elarah em 15s', '', '', 'planejado'),
('2026-05-29', 'WhatsApp', 'Mensagem', 'Curado: agenda próximo mês', '🤍 junho a caminho. em breve as primeiras experiências.\nquem quer ser avisada primeiro? responde com 🤍', '', 'planejado'),
('2026-05-30', 'Instagram', 'Stories', 'Stories sábado: última vaga do mês', 'Última vaga de maio em [exp]. 🤍', '', 'planejado'),
('2026-05-30', 'LinkedIn', 'Post', 'B2B: "Cultura como diferencial em 2026" (fechamento)', '', '2º LI da semana', 'planejado'),
('2026-05-30', 'WhatsApp', 'Mensagem', 'Comunidade: foto da comunidade vivendo experiências', 'vocês. 🤍', '', 'planejado'),
('2026-05-31', 'Instagram', 'Feed', 'Editorial sensorial fechando o mês', 'Maio se vai com mãos limpas, peças prontas e o corpo mais leve. Junho começa amanhã. 🤍', 'Domingo — editorial fim de mês', 'planejado'),
('2026-05-31', 'Instagram', 'Stories', 'Stories domingo: fechamento', '', '', 'planejado');

-- =============================================================
-- Sanity check — distribuição por canal/semana
-- -------------------------------------------------------------
-- Esperado:
--   TikTok:   ≥ 4/semana  → ~20+ posts no mês
--   Stories:  diário      → ~31 posts no mês
--   Reels:    ≥ 3/semana  → ~15+ posts no mês
--   Feed:    ≥ 2/semana   → ~10 posts no mês
--   LinkedIn: ≥ 2/semana  → ~8 posts no mês
--   WhatsApp: ~12 posts (8 curado + 4 comunidade)
-- =============================================================
