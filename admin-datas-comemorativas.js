// =============================================================
// DATAS COMEMORATIVAS — calendário de marketing do ano
// -------------------------------------------------------------
// Todas as datas que rendem conteúdo/campanha pra Elarah: feriados,
// grandes datas do varejo, "dia do amigo", "dia da cachaça", dia das
// profissões (B2B), campanhas de cor do mês etc. Cada data tem:
//   - categoria (pra filtrar)
//   - relevância pra Elarah (3 = quente, 2 = vale post, 1 = lembrete)
//   - ideia de gancho pronta pra virar post/campanha
//   - antecedência sugerida pra começar a divulgar
//
// As datas móveis (Carnaval, Páscoa, Mães, Pais, Black Friday…) são
// calculadas pro ano escolhido — o calendário serve pra qualquer ano.
//
// O botão "+ Cronograma" abre o modal do Calendário Editorial já com
// a data e a ideia preenchidas; e o próprio Cronograma mostra as
// datas comemorativas no cabeçalho de cada dia.
// =============================================================
(function () {
  'use strict';

  // ---------- Categorias ----------
  var CATS = {
    'feriado':    { label: 'Feriado',             emoji: '🇧🇷', bg: '#fde8e8', fg: '#a4262c' },
    'comercial':  { label: 'Grande data varejo',  emoji: '🛍️', bg: '#fff1dc', fg: '#9a5a00' },
    'relacoes':   { label: 'Amor, amigos, família', emoji: '💞', bg: '#ffe9f1', fg: '#b03a64' },
    'gastro':     { label: 'Comida & bebida',     emoji: '🍹', bg: '#eaf6e6', fg: '#2f6b1f' },
    'cultura':    { label: 'Arte & cultura',      emoji: '🎨', bg: '#efe8fb', fg: '#5b3a9c' },
    'bem-estar':  { label: 'Bem-estar',           emoji: '🧘', bg: '#e3f4f4', fg: '#1d6b6b' },
    'profissoes': { label: 'Profissões (B2B)',    emoji: '💼', bg: '#e6edf8', fg: '#2a4f8a' },
    'causas':     { label: 'Causas & consciência', emoji: '🎗️', bg: '#f3eee6', fg: '#6b5433' },
    'divertidas': { label: 'Datas divertidas',    emoji: '🎉', bg: '#fff6c9', fg: '#7a6300' },
    'estacao':    { label: 'Estações & temporadas', emoji: '🌦️', bg: '#eef3f7', fg: '#3d5a70' }
  };

  // ---------- Datas fixas ----------
  // [mês, dia, nome, categoria, relevância, ideia, antecedência(dias, opcional)]
  var FIXAS = [
    // JANEIRO
    [1, 1,  'Confraternização Universal (Ano Novo)', 'feriado', 3, 'Metas do ano em forma de experiência: "este ano eu vou aprender cerâmica". Lista de 12 experiências pra fazer no ano (1 por mês).', 14],
    [1, 6,  'Dia de Reis', 'divertidas', 1, 'Encerramento das festas: último post de "desmontar a árvore com as amigas".'],
    [1, 7,  'Dia do Leitor', 'cultura', 1, 'Indicar clubes do livro / experiências literárias em SP.'],
    [1, 20, 'Dia do Farmacêutico', 'profissoes', 1, 'Lembrete B2B: experiência de presente pra equipe de farmácias/laboratórios.'],
    [1, 20, 'Dia Nacional do Queijo', 'gastro', 2, 'Degustação de queijos e vinhos — post "queijos pra levar num piquenique".'],
    [1, 25, 'Aniversário de São Paulo (feriado municipal)', 'feriado', 3, '"Parabéns, SP: X experiências que só existem aqui". Roteiro de feriado paulistano, ótimo pra SEO local.', 10],
    [1, 30, 'Dia da Saudade', 'relacoes', 2, '"Marca aquela amiga que você não vê há meses" + convite pra uma experiência a dois.'],
    [1, 31, 'Dia do Mágico', 'divertidas', 1, 'Elarah Kids: experiências mágicas pras férias das crianças.'],

    // FEVEREIRO
    [2, 2,  'Dia de Iemanjá', 'cultura', 1, 'Conteúdo leve sobre cultura afro-brasileira e oferendas de flores (se fizer sentido com a marca).'],
    [2, 11, 'Dia Internacional das Mulheres e Meninas na Ciência', 'causas', 1, 'Destacar parceiras/instrutoras que são cientistas ou empreendedoras.'],
    [2, 13, 'Galentine\'s Day (dia das amigas)', 'relacoes', 3, 'Perfeito pro público Elarah: "o dia de celebrar as amigas" — combos de atividades com amigas.', 10],
    [2, 14, 'Valentine\'s Day (dia dos namorados gringo)', 'relacoes', 2, '"No resto do mundo hoje é dia dos namorados" — date diferente em SP, sem esperar junho.'],
    [2, 19, 'Dia do Esportista', 'bem-estar', 1, 'Experiências ativas: yoga, dança, trilha.'],

    // MARÇO
    [3, 8,  'Dia Internacional da Mulher', 'relacoes', 3, 'Data-chave da Elarah: homenagear clientes/parceiras, campanha de presente entre mulheres, eventos corporativos femininos.', 21],
    [3, 12, 'Dia do Bibliotecário', 'profissoes', 1, 'Post curto de livros/leitura.'],
    [3, 15, 'Dia do Consumidor', 'comercial', 3, '"Black Friday de março": cupom relâmpago ou gift card com bônus.', 10],
    [3, 19, 'Dia do Artesão', 'cultura', 3, 'Homenagem às parceiras artesãs + vitrine das oficinas (cerâmica, bordado, pintura).', 7],
    [3, 20, 'Dia Internacional da Felicidade', 'bem-estar', 2, '"O que te faz feliz?" — enquete + experiências que viraram memória boa.'],
    [3, 21, 'Dia Mundial da Poesia', 'cultura', 1, 'Frase/poema com fotos das experiências.'],
    [3, 21, 'Dia Internacional contra a Discriminação Racial', 'causas', 1, 'Pauta institucional: diversidade entre parceiras e clientes.'],
    [3, 22, 'Dia Mundial da Água', 'causas', 1, 'Sustentabilidade nas oficinas (reuso, materiais naturais).'],
    [3, 27, 'Dia Mundial do Teatro / Dia do Circo', 'cultura', 2, 'Roteiro de peças/stand-ups em SP + experiências de expressão corporal.'],

    // ABRIL
    [4, 1,  'Dia da Mentira', 'divertidas', 2, 'Post brincalhão: "verdade ou mentira?" com fatos curiosos das experiências.'],
    [4, 7,  'Dia Mundial da Saúde', 'bem-estar', 2, 'Experiências de bem-estar: meditação, yoga, spa day.'],
    [4, 7,  'Dia do Jornalista', 'profissoes', 1, 'Bom dia pra mandar release/pauta pra imprensa.'],
    [4, 13, 'Dia do Beijo', 'relacoes', 2, 'Date diferente em SP — "lugares pra um primeiro beijo inesquecível".'],
    [4, 15, 'Dia Mundial da Arte', 'cultura', 3, 'Vitrine de oficinas de pintura, cerâmica e desenho. Reels do processo criativo.', 7],
    [4, 18, 'Dia Nacional do Livro Infantil', 'cultura', 1, 'Elarah Kids: contação de histórias / atividades pra crianças.'],
    [4, 19, 'Dia dos Povos Indígenas', 'causas', 1, 'Conteúdo educativo; artesanato de origem indígena (com respeito e crédito).'],
    [4, 21, 'Tiradentes (feriado nacional)', 'feriado', 2, '"O que fazer no feriado em SP" — ótimo pra SEO e agenda de fim de semana prolongado.', 7],
    [4, 21, 'Dia Mundial da Criatividade e Inovação', 'cultura', 2, 'Experiências criativas + "desbloqueie sua criatividade".'],
    [4, 22, 'Dia da Terra', 'causas', 1, 'Oficinas com materiais naturais, hortas, terrários.'],
    [4, 23, 'Dia Mundial do Livro', 'cultura', 2, 'Clube do livro + experiência; presente "livro + oficina".'],
    [4, 23, 'Dia de São Jorge', 'cultura', 1, 'Referência cultural paulista/carioca — post leve.'],
    [4, 24, 'Dia do Churrasco', 'gastro', 1, 'Conteúdo gastronômico / confraternizações.'],
    [4, 28, 'Dia da Sogra', 'divertidas', 2, '"Conquiste a sogra": experiência pra fazer com ela (bem-humorado).'],
    [4, 29, 'Dia Internacional da Dança', 'cultura', 2, 'Aulas de dança, forró, samba de gafieira — Reels dançando.'],
    [4, 30, 'Dia Internacional do Jazz', 'cultura', 1, 'Bares de jazz em SP pra um date à noite.'],

    // MAIO
    [5, 1,  'Dia do Trabalho (feriado nacional)', 'feriado', 2, '"Você merece uma pausa": experiências de descanso no feriado.', 7],
    [5, 8,  'Dia do Artista Plástico', 'cultura', 2, 'Homenagem às instrutoras de pintura/escultura.'],
    [5, 12, 'Dia do Enfermeiro', 'profissoes', 1, 'B2B: experiência de presente pra equipes de hospitais.'],
    [5, 13, 'Dia Mundial do Coquetel', 'gastro', 3, 'Aula de coquetelaria em destaque, receita de drink em Reels.', 7],
    [5, 13, 'Abolição da Escravatura', 'causas', 1, 'Pauta institucional/histórica (tom respeitoso).'],
    [5, 15, 'Dia Internacional da Família', 'relacoes', 2, 'Experiências pra fazer em família / Elarah Kids.'],
    [5, 18, 'Dia Internacional dos Museus', 'cultura', 1, 'Roteiro de museus em SP + oficina depois.'],
    [5, 20, 'Dia Mundial das Abelhas', 'causas', 1, 'Oficinas com cera de abelha, velas, mel.'],
    [5, 21, 'Dia Internacional do Chá', 'gastro', 2, 'Chá da tarde com as amigas / cerimônia do chá.'],
    [5, 22, 'Dia do Abraço', 'relacoes', 2, '"Marca quem merece um abraço (e uma experiência)".'],
    [5, 24, 'Dia Nacional do Café', 'gastro', 2, 'Degustação de cafés especiais, barista por um dia.'],
    [5, 25, 'Dia do Orgulho Nerd / Dia da Toalha', 'divertidas', 1, 'Experiências de jogos, escape room, board games.'],
    [5, 28, 'Dia Mundial do Hambúrguer', 'gastro', 1, 'Aula de culinária / roteiro de hamburguerias.'],
    [5, 31, 'Dia Mundial sem Tabaco', 'bem-estar', 1, 'Bem-estar e hábitos saudáveis.'],

    // JUNHO
    [6, 1,  'Dia da Imprensa', 'profissoes', 1, 'Bom momento pra pautas com jornalistas.'],
    [6, 5,  'Dia Mundial do Meio Ambiente', 'causas', 2, 'Oficinas sustentáveis: terrário, reaproveitamento, tingimento natural.'],
    [6, 12, 'Dia dos Namorados', 'relacoes', 3, 'A maior data da Elarah no 1º semestre: date diferente, presente de experiência, gift card. Já existe página dedicada — começar cedo.', 30],
    [6, 13, 'Santo Antônio (santo casamenteiro)', 'relacoes', 2, 'Solteiras: "simpatia moderna = sair e conhecer gente" — experiências em grupo.'],
    [6, 18, 'Dia Internacional do Piquenique', 'divertidas', 3, 'Piquenique com as amigas no parque + oficina ao ar livre. Muito Elarah.', 7],
    [6, 18, 'Dia Internacional do Sushi', 'gastro', 1, 'Aula de sushi / culinária japonesa (Liberdade).'],
    [6, 19, 'Dia do Cinema Brasileiro', 'cultura', 1, 'Sessões de cinema diferentes em SP.'],
    [6, 21, 'Dia Internacional do Yoga', 'bem-estar', 2, 'Aulas de yoga, meditação, retiros de um dia.'],
    [6, 21, 'Dia Mundial da Música', 'cultura', 2, 'Aulas de música, rodas de samba, karaokê com as amigas.'],
    [6, 24, 'Dia de São João', 'cultura', 3, 'Festa junina: oficinas de comidas típicas, arraiá, quentão. Conteúdo de temporada.', 14],
    [6, 28, 'Dia do Orgulho LGBTQIA+', 'causas', 2, 'Posicionamento inclusivo: todas são bem-vindas nas experiências.'],
    [6, 29, 'Dia de São Pedro', 'cultura', 1, 'Encerramento da temporada junina.'],

    // JULHO
    [7, 7,  'Dia Mundial do Chocolate', 'gastro', 3, 'Oficina de chocolate/bombons, degustação — conteúdo muito "salvável".', 7],
    [7, 9,  'Revolução Constitucionalista (feriado estadual SP)', 'feriado', 2, 'Feriado paulista: "o que fazer em SP no feriado de 9 de julho".', 7],
    [7, 10, 'Dia da Pizza', 'gastro', 2, 'SP é capital da pizza: aula de pizza napolitana, roteiro de pizzarias.'],
    [7, 13, 'Dia Mundial do Rock', 'cultura', 1, 'Bares/rolês de rock em SP.'],
    [7, 17, 'Dia Mundial do Emoji', 'divertidas', 1, 'Post interativo: "descreva sua experiência dos sonhos em emojis".'],
    [7, 20, 'Dia do Amigo', 'relacoes', 3, 'Data-chave: atividades com amigas, combos para grupos, "marca sua dupla".', 14],
    [7, 24, 'Dia Internacional do Autocuidado', 'bem-estar', 3, 'Programa em SP sozinha, spa, meditação, oficinas terapêuticas.', 7],
    [7, 25, 'Dia da Mulher Negra Latino-americana e Caribenha', 'causas', 2, 'Destacar empreendedoras e parceiras negras.'],
    [7, 25, 'Dia do Escritor', 'cultura', 1, 'Oficinas de escrita criativa / clube do livro.'],
    [7, 26, 'Dia dos Avós', 'relacoes', 3, 'Experiência pra fazer com a avó/avô: cerâmica, culinária, chá da tarde.', 10],
    [7, 28, 'Dia do Agricultor', 'causas', 1, 'Hortas, feiras orgânicas, culinária com produtor local.'],
    [7, 30, 'Dia Internacional da Amizade', 'relacoes', 2, 'Segunda chance do Dia do Amigo: repostar conteúdo de amigas.'],

    // AGOSTO
    [8, 8,  'Dia Internacional do Gato', 'divertidas', 1, 'Cafés com gatos, conteúdo fofo.'],
    [8, 11, 'Dia do Estudante', 'divertidas', 2, 'Cupom estudante / experiências pra aprender algo novo.'],
    [8, 11, 'Dia do Advogado', 'profissoes', 1, 'B2B: presente de experiência pra escritórios.'],
    [8, 12, 'Dia Internacional da Juventude', 'causas', 1, 'Público jovem: experiências acessíveis.'],
    [8, 13, 'Dia do Canhoto', 'divertidas', 1, 'Curiosidade: canhotas na cerâmica/pintura.'],
    [8, 15, 'Dia do Solteiro', 'relacoes', 2, 'Experiências pra conhecer gente nova, programa sozinha, despedidas de solteira.'],
    [8, 17, 'Dia do Pão de Queijo', 'gastro', 1, 'Post leve de culinária mineira.'],
    [8, 19, 'Dia Mundial da Fotografia', 'cultura', 2, 'Oficinas de fotografia com celular; repost de fotos das clientes.'],
    [8, 22, 'Dia do Folclore', 'cultura', 1, 'Artesanato e cultura popular brasileira.'],
    [8, 26, 'Dia Internacional do Cachorro', 'divertidas', 1, 'Experiências pet friendly em SP.'],
    [8, 27, 'Dia do Psicólogo', 'profissoes', 1, 'Saúde mental + parcerias com psicólogas.'],
    [8, 29, 'Dia do Gamer', 'divertidas', 1, 'Escape rooms, jogos de tabuleiro.'],
    [8, 31, 'Dia do Nutricionista', 'profissoes', 1, 'Culinária saudável.'],

    // SETEMBRO
    [9, 1,  'Dia do Profissional de Educação Física', 'profissoes', 1, 'Experiências ativas.'],
    [9, 5,  'Dia do Irmão', 'relacoes', 2, 'Experiência pra fazer com a irmã/irmão.'],
    [9, 5,  'Dia da Amazônia', 'causas', 1, 'Sustentabilidade e ingredientes amazônicos.'],
    [9, 6,  'Dia do Sexo', 'divertidas', 1, 'Tom leve e cuidadoso: dates românticos/"apimentar a rotina". Avaliar se combina com a marca.'],
    [9, 7,  'Independência do Brasil (feriado nacional)', 'feriado', 2, '"O que fazer no feriado em SP" + brasilidades (samba, cachaça, artesanato).', 7],
    [9, 9,  'Dia do Administrador', 'profissoes', 1, 'B2B: gift card corporativo.'],
    [9, 13, 'Dia da Cachaça', 'gastro', 3, 'Degustação de cachaças, aula de caipirinha/coquetelaria brasileira.', 7],
    [9, 15, 'Dia do Cliente', 'comercial', 3, 'Agradecer clientes: cupom, sorteio, depoimentos. Ótimo pra reativar quem já comprou.', 10],
    [9, 21, 'Dia da Árvore', 'causas', 1, 'Oficinas com plantas: terrário, kokedama.'],
    [9, 22, 'Dia do Contador', 'profissoes', 1, 'B2B.'],
    [9, 23, 'Dia Nacional do Sorvete', 'gastro', 2, 'Roteiro de sorveterias/gelatos + oficina de sobremesa.'],
    [9, 27, 'Dia de Cosme e Damião / Dia do Doce', 'gastro', 2, 'Oficina de doces, confeitaria, brigadeiro gourmet.'],
    [9, 27, 'Dia Mundial do Turismo', 'cultura', 2, '"Turista na própria cidade": roteiros de experiências em SP.'],
    [9, 30, 'Dia da Secretária', 'profissoes', 2, 'B2B forte: empresas presenteiam secretárias — gift card de experiência.', 10],

    // OUTUBRO
    [10, 1,  'Dia Internacional do Café', 'gastro', 2, 'Degustação de cafés especiais, barismo.'],
    [10, 1,  'Dia Internacional da Pessoa Idosa', 'relacoes', 2, 'Experiências pra fazer com mãe/avó; acessibilidade.'],
    [10, 4,  'Dia dos Animais', 'divertidas', 1, 'Experiências pet friendly.'],
    [10, 10, 'Dia Mundial da Saúde Mental', 'bem-estar', 3, 'Oficinas manuais como terapia (cerâmica, bordado) — "desacelera".', 7],
    [10, 12, 'Nossa Senhora Aparecida (feriado) + Dia das Crianças', 'comercial', 3, 'Elarah Kids: experiências e presentes pra crianças; programação do feriado.', 21],
    [10, 15, 'Dia do Professor', 'profissoes', 2, 'Presente pra professora (pais e escolas) — gift card.', 7],
    [10, 16, 'Dia Mundial da Alimentação', 'gastro', 1, 'Aulas de culinária, alimentação consciente.'],
    [10, 18, 'Dia do Médico', 'profissoes', 1, 'B2B: clínicas e hospitais.'],
    [10, 25, 'Dia Mundial do Macarrão', 'gastro', 2, 'Aula de massa fresca — conteúdo de processo rende muito.'],
    [10, 25, 'Dia do Dentista', 'profissoes', 1, 'B2B.'],
    [10, 31, 'Halloween / Dia das Bruxas', 'divertidas', 2, 'Oficinas temáticas (velas, poções = drinks), festa à fantasia.', 10],
    [10, 31, 'Dia do Saci', 'cultura', 1, 'Versão brasileira do Halloween: folclore.'],
    [10, 31, 'Dia Nacional da Poesia', 'cultura', 1, 'Oficina de escrita / sarau.'],

    // NOVEMBRO
    [11, 1,  'Dia Mundial do Veganismo', 'gastro', 1, 'Culinária vegana, oficinas plant-based.'],
    [11, 2,  'Finados (feriado nacional)', 'feriado', 1, 'Evitar tom festivo; post de feriado discreto.'],
    [11, 13, 'Dia Mundial da Gentileza', 'bem-estar', 2, '"Presenteie alguém sem motivo" — gift card de experiência.'],
    [11, 15, 'Proclamação da República (feriado nacional)', 'feriado', 2, 'Roteiro de feriado em SP.', 7],
    [11, 19, 'Dia da Mulher Empreendedora', 'causas', 3, 'Homenagear as parceiras (quase todas empreendedoras) + Clube de Mentoras.', 7],
    [11, 19, 'Dia Internacional do Homem', 'relacoes', 1, 'Presente de experiência pra ele.'],
    [11, 20, 'Dia da Consciência Negra (feriado nacional)', 'feriado', 2, 'Valorizar cultura e empreendedoras negras; roteiro de feriado.', 7],
    [11, 22, 'Dia do Músico (Santa Cecília)', 'cultura', 1, 'Aulas de música, rodas de samba.'],

    // DEZEMBRO
    [12, 1,  'Dia Mundial de Luta contra a AIDS', 'causas', 1, 'Pauta de conscientização (Dezembro Vermelho).'],
    [12, 2,  'Dia Nacional do Samba', 'cultura', 2, 'Rodas de samba, aula de samba no pé.'],
    [12, 3,  'Dia Internacional da Pessoa com Deficiência', 'causas', 1, 'Acessibilidade nas experiências.'],
    [12, 4,  'Dia do Publicitário', 'profissoes', 1, 'B2B agências.'],
    [12, 8,  'Dia Nacional da Família', 'relacoes', 2, 'Experiências em família antes do Natal.'],
    [12, 11, 'Dia do Engenheiro', 'profissoes', 1, 'B2B.'],
    [12, 15, 'Dia do Arquiteto', 'profissoes', 1, 'Oficinas de cerâmica/design de interiores.'],
    [12, 24, 'Véspera de Natal', 'comercial', 2, 'Última chance: gift card digital chega na hora (presente de última hora).'],
    [12, 25, 'Natal (feriado nacional)', 'comercial', 3, 'Presente de experiência / gift card; amigo secreto; oficinas de decoração natalina.', 45],
    [12, 31, 'Réveillon', 'divertidas', 2, 'Retrospectiva do ano com fotos das clientes + "metas-experiência" pro ano novo.']
  ];

  // Campanhas de cor/conscientização do mês (mostradas no topo do mês).
  var MESES_CAMPANHA = {
    1:  'Janeiro Branco (saúde mental) · férias escolares',
    2:  'Fevereiro Roxo e Laranja (lúpus, fibromialgia, leucemia) · Carnaval',
    3:  'Março Lilás (câncer de colo do útero) · mês da mulher',
    4:  'Abril Azul (autismo) · Páscoa',
    5:  'Maio Amarelo (trânsito) · mês das mães',
    6:  'Junho Vermelho (doação de sangue) · festas juninas · mês dos namorados',
    7:  'Julho Amarelo (hepatites) · férias escolares',
    8:  'Agosto Lilás (violência contra a mulher) · Agosto Dourado (amamentação)',
    9:  'Setembro Amarelo (prevenção do suicídio) · primavera',
    10: 'Outubro Rosa (câncer de mama) · mês das crianças',
    11: 'Novembro Azul (saúde do homem) · Black Friday',
    12: 'Dezembro Vermelho (HIV/AIDS) · Natal e confraternizações de empresa'
  };

  // ---------- Datas móveis ----------
  function pascoa(ano) {
    // Algoritmo de Meeus/Jones/Butcher (calendário gregoriano).
    var a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31);
    var dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }
  function somaDias(dt, n) { var r = new Date(dt); r.setDate(r.getDate() + n); return r; }
  // n-ésimo dia da semana (0=dom) do mês (1-12). n = 1..5
  function nEsimo(ano, mes, diaSemana, n) {
    var d = new Date(ano, mes - 1, 1);
    var delta = (diaSemana - d.getDay() + 7) % 7;
    return new Date(ano, mes - 1, 1 + delta + (n - 1) * 7);
  }

  function moveis(ano) {
    var p = pascoa(ano);
    var blackFriday = somaDias(nEsimo(ano, 11, 4, 4), 1);
    // Dia do Programador: 256º dia do ano.
    var programador = somaDias(new Date(ano, 0, 1), 255);
    return [
      [somaDias(p, -48), 'Segunda de Carnaval', 'feriado', 2, 'Ponto facultativo: agenda pra quem foge do bloquinho.'],
      [somaDias(p, -47), 'Carnaval', 'estacao', 3, '"Carnaval fora do bloco": oficinas, drinks, programa tranquilo em SP. Fantasias e maquiagem artística.', 21],
      [somaDias(p, -46), 'Quarta-feira de Cinzas', 'estacao', 1, '"Ressaca de Carnaval": experiências de descanso e autocuidado.'],
      [somaDias(p, -2),  'Sexta-feira Santa (feriado nacional)', 'feriado', 2, 'Feriado prolongado: roteiro de experiências.', 7],
      [p,                'Páscoa', 'comercial', 3, 'Oficina de ovos de chocolate, experiência em família, Elarah Kids.', 21],
      [nEsimo(ano, 5, 0, 2), 'Dia das Mães', 'comercial', 3, 'A maior data do 1º semestre: atividade com a mãe, presente de experiência, gift card. Já existe página dedicada.', 30],
      [nEsimo(ano, 6, 0, 1), 'Dia Nacional do Vinho', 'gastro', 2, 'Degustação de vinhos, harmonização com queijos.'],
      [nEsimo(ano, 6, 6, 2), 'Dia Mundial do Gin', 'gastro', 2, 'Aula de coquetelaria com gin tônica autoral.'],
      [somaDias(p, 60),  'Corpus Christi (ponto facultativo / feriado em SP capital)', 'feriado', 2, 'Feriado prolongado em SP: roteiro de experiências.', 7],
      [nEsimo(ano, 8, 5, 1), 'Dia Internacional da Cerveja', 'gastro', 1, 'Degustação de cervejas artesanais.'],
      [nEsimo(ano, 8, 0, 2), 'Dia dos Pais', 'comercial', 3, 'Presente de experiência pro pai, programa pai + filha. Já existe página dedicada.', 30],
      [programador, 'Dia do Programador (256º dia do ano)', 'profissoes', 1, 'B2B: empresas de tecnologia — confraternização/experiência pra time tech.'],
      [blackFriday, 'Black Friday', 'comercial', 3, 'Maior janela de vendas: gift cards com desconto, combos, experiências pro ano seguinte. Aquecer a lista antes.', 30],
      [somaDias(blackFriday, 3), 'Cyber Monday', 'comercial', 2, 'Última chamada da Black Friday no digital.'],
      // Estações (datas aproximadas; variam ±1 dia conforme o ano).
      [new Date(ano, 2, 20),  'Início do outono (aprox.)', 'estacao', 1, 'Experiências indoor aconchegantes.'],
      [new Date(ano, 5, 21),  'Início do inverno (aprox.)', 'estacao', 2, '"O que fazer em SP no frio": fondue, vinho, oficinas indoor.'],
      [new Date(ano, 8, 22),  'Início da primavera (aprox.)', 'estacao', 2, 'Oficinas com flores, piqueniques, arranjos florais.'],
      [new Date(ano, 11, 21), 'Início do verão (aprox.)', 'estacao', 1, 'Experiências ao ar livre, drinks refrescantes.'],
      // Temporadas comerciais.
      [new Date(ano, 10, 1),  'Temporada de confraternizações de empresa (novembro–dezembro)', 'comercial', 3, 'Vender eventos corporativos/confraternização — prospectar empresas desde outubro.', 45]
    ];
  }

  function ymd(dt) {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }

  var _cacheAno = {};
  // Lista completa do ano, ordenada por data.
  function doAno(ano) {
    if (_cacheAno[ano]) return _cacheAno[ano];
    var lista = [];
    FIXAS.forEach(function (f) {
      var dt = new Date(ano, f[0] - 1, f[1]);
      lista.push({ dt: dt, ymd: ymd(dt), nome: f[2], cat: f[3], rel: f[4], ideia: f[5], ante: f[6], movel: false });
    });
    moveis(ano).forEach(function (m) {
      lista.push({ dt: m[0], ymd: ymd(m[0]), nome: m[1], cat: m[2], rel: m[3], ideia: m[4], ante: m[5], movel: true });
    });
    lista.forEach(function (e) {
      if (!e.ante) e.ante = e.rel === 3 ? 14 : e.rel === 2 ? 5 : 1;
      e.inicio = somaDias(e.dt, -e.ante);
    });
    lista.sort(function (a, b) { return a.dt - b.dt || b.rel - a.rel; });
    _cacheAno[ano] = lista;
    return lista;
  }

  function porDia(ymdStr) {
    var ano = parseInt(String(ymdStr).slice(0, 4), 10);
    if (!ano) return [];
    return doAno(ano).filter(function (e) { return e.ymd === ymdStr; });
  }

  // =============================================================
  // UI do painel
  // =============================================================
  // vista: 'lista' (linhas com a ideia) ou 'calendario' (grade de jan a dez,
  // dias com data comemorativa pintados num círculo). A escolha fica no
  // navegador de quem usa.
  var S = { ano: new Date().getFullYear(), cat: '', rel: 1, busca: '', vista: 'lista', diaSel: '' };
  try { if (localStorage.getItem('elarah_dc_vista') === 'calendario') S.vista = 'calendario'; } catch (e) { /* sem storage */ }
  var WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function ddmm(dt) { return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0'); }
  function estrelas(n) { return '★★★'.slice(0, n) + '<span style="opacity:.25">' + '★★★'.slice(n) + '</span>'; }
  function hoje0() { var h = new Date(); return new Date(h.getFullYear(), h.getMonth(), h.getDate()); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function filtrada() {
    var q = norm(S.busca);
    return doAno(S.ano).filter(function (e) {
      if (S.cat && e.cat !== S.cat) return false;
      if (e.rel < S.rel) return false;
      if (q && norm(e.nome + ' ' + e.ideia + ' ' + CATS[e.cat].label).indexOf(q) === -1) return false;
      return true;
    });
  }

  function chip(cat) {
    var c = CATS[cat];
    return '<span class="dc-chip" style="background:' + c.bg + ';color:' + c.fg + ';">' + c.emoji + ' ' + esc(c.label) + '</span>';
  }

  function linha(e, idx, hoje) {
    var passou = e.dt < hoje;
    var ehHoje = +e.dt === +hoje;
    return '<div class="dc-row' + (passou ? ' dc-row--passou' : '') + (ehHoje ? ' dc-row--hoje' : '') + '">' +
      '<div class="dc-data"><strong>' + ddmm(e.dt) + '</strong><span>' + WD[e.dt.getDay()] + '</span></div>' +
      '<div class="dc-corpo">' +
        '<div class="dc-titulo">' + esc(e.nome) + (e.movel ? ' <span class="dc-movel" title="Data móvel — calculada pra ' + S.ano + '">móvel</span>' : '') + '</div>' +
        '<div class="dc-meta">' + chip(e.cat) + '<span class="dc-stars" title="Relevância pra Elarah">' + estrelas(e.rel) + '</span>' +
          (e.rel >= 2 ? '<span class="dc-ante">divulgar a partir de ' + ddmm(e.inicio) + '</span>' : '') + '</div>' +
        '<div class="dc-ideia">💡 ' + esc(e.ideia) + '</div>' +
      '</div>' +
      '<button type="button" class="dc-add" data-idx="' + idx + '" title="Criar conteúdo no Cronograma com essa data">+ Cronograma</button>' +
    '</div>';
  }

  var _visiveis = [];

  function render() {
    var root = el('dc-root');
    if (!root) return;
    var hoje = hoje0();
    var lista = filtrada();
    _visiveis = lista;

    // Radar: o que já está na janela de divulgação (início ≤ hoje ≤ data), só ano corrente.
    var radar = doAno(S.ano).filter(function (e) {
      return e.rel >= 2 && e.inicio <= hoje && e.dt >= hoje;
    }).slice(0, 8);
    var radarHtml = '';
    if (radar.length) {
      radarHtml = '<section class="dc-radar"><h3>📡 Hora de divulgar</h3><p>Datas cuja janela de divulgação já abriu:</p><div class="dc-radar-list">' +
        radar.map(function (e) {
          var dias = Math.round((e.dt - hoje) / 86400000);
          return '<div class="dc-radar-item"><strong>' + esc(e.nome) + '</strong><span>' + ddmm(e.dt) + ' · ' +
            (dias === 0 ? 'é hoje!' : 'faltam ' + dias + ' dia' + (dias > 1 ? 's' : '')) + '</span></div>';
        }).join('') + '</div></section>';
    }

    el('dc-stats').innerHTML = '<strong>' + lista.length + '</strong> datas em ' + S.ano +
      ' · <strong>' + lista.filter(function (e) { return e.rel === 3; }).length + '</strong> quentes (★★★)';

    if (S.vista === 'calendario') {
      root.innerHTML = radarHtml + calendarioHtml(lista, hoje);
      return;
    }

    var porMes = {};
    lista.forEach(function (e, i) {
      var m = e.dt.getMonth();
      (porMes[m] = porMes[m] || []).push(linha(e, i, hoje));
    });

    var mesesHtml = '';
    for (var m = 0; m < 12; m++) {
      if (!porMes[m] && (S.cat || S.busca)) continue;
      mesesHtml += '<section class="dc-mes" id="dc-mes-' + m + '">' +
        '<div class="dc-mes-head"><h3>' + MESES[m] + '</h3><span>' + esc(MESES_CAMPANHA[m + 1]) + '</span></div>' +
        (porMes[m] ? porMes[m].join('') : '<p class="dc-vazio">Nenhuma data com esses filtros.</p>') +
      '</section>';
    }

    root.innerHTML = radarHtml + (mesesHtml || '<p class="dc-vazio">Nenhuma data encontrada.</p>');
  }

  // ---------- Vista calendário ----------
  // Índices (em _visiveis) das datas de cada dia, pra montar os círculos
  // e o detalhe do dia clicado.
  function indicePorDia(lista) {
    var m = {};
    lista.forEach(function (e, i) { (m[e.ymd] = m[e.ymd] || []).push(i); });
    return m;
  }

  function legendaHtml() {
    return '<div class="dc-legenda">' +
      Object.keys(CATS).map(function (k) {
        return '<span><i style="background:' + CATS[k].bg + ';border-color:' + CATS[k].fg + ';"></i>' + esc(CATS[k].label) + '</span>';
      }).join('') +
      '<span><i style="background:#5C2426;border-color:#5C2426;"></i>Círculo cheio = data quente ★★★</span>' +
    '</div>';
  }

  function detalheDiaHtml(ymdStr, idxs, hoje) {
    if (!ymdStr || !idxs || !idxs.length) {
      return '<p class="dc-detalhe-dica">Toque num dia colorido pra ver as datas.</p>';
    }
    return idxs.map(function (i) { return linha(_visiveis[i], i, hoje); }).join('');
  }

  function calendarioHtml(lista, hoje) {
    var porDiaIdx = indicePorDia(lista);
    var hojeYmd = ymd(hoje);
    var html = legendaHtml() + '<div class="dc-cal">';
    for (var m = 0; m < 12; m++) {
      var primeiro = new Date(S.ano, m, 1);
      var nDias = new Date(S.ano, m + 1, 0).getDate();
      var cels = '';
      for (var v = 0; v < primeiro.getDay(); v++) cels += '<span class="dc-dia dc-dia--vazio"></span>';
      for (var d = 1; d <= nDias; d++) {
        var dt = new Date(S.ano, m, d);
        var key = ymd(dt);
        var idxs = porDiaIdx[key];
        var cls = 'dc-dia';
        var style = '';
        var title = '';
        if (idxs) {
          var top = _visiveis[idxs[0]]; // já vem ordenado por relevância dentro do dia
          var c = CATS[top.cat];
          cls += ' dc-dia--tem' + (top.rel === 3 ? ' dc-dia--quente' : '');
          style = ' style="--dc-bg:' + c.bg + ';--dc-fg:' + c.fg + ';"';
          title = idxs.map(function (i) { return _visiveis[i].nome; }).join(' · ');
        }
        if (dt < hoje) cls += ' dc-dia--passou';
        if (key === hojeYmd) cls += ' dc-dia--hoje';
        if (key === S.diaSel) cls += ' dc-dia--sel';
        cels += idxs
          ? '<button type="button" class="' + cls + '"' + style + ' data-ymd="' + key + '" title="' + esc(title) + '">' + d +
              (idxs.length > 1 ? '<b>' + idxs.length + '</b>' : '') + '</button>'
          : '<span class="' + cls + '">' + d + '</span>';
      }
      var selNoMes = S.diaSel && S.diaSel.slice(0, 7) === key.slice(0, 7) ? S.diaSel : '';
      html += '<section class="dc-mes dc-mes--cal" id="dc-mes-' + m + '">' +
        '<div class="dc-mes-head"><h3>' + MESES[m] + '</h3><span>' + esc(MESES_CAMPANHA[m + 1]) + '</span></div>' +
        '<div class="dc-grade">' +
          WD.map(function (w) { return '<span class="dc-wd">' + w.charAt(0).toUpperCase() + '</span>'; }).join('') +
          cels +
        '</div>' +
        '<div class="dc-detalhe" id="dc-det-' + m + '">' + detalheDiaHtml(selNoMes, porDiaIdx[selNoMes], hoje) + '</div>' +
      '</section>';
    }
    return html + '</div>';
  }

  function selecionarDia(ymdStr) {
    S.diaSel = S.diaSel === ymdStr ? '' : ymdStr;
    // Atualiza só o mês clicado (sem re-render geral, pra não pular a rolagem).
    var root = el('dc-root');
    root.querySelectorAll('.dc-dia--sel').forEach(function (b) { b.classList.remove('dc-dia--sel'); });
    root.querySelectorAll('.dc-detalhe').forEach(function (det) {
      det.innerHTML = detalheDiaHtml('', null);
    });
    if (!S.diaSel) return;
    var btn = root.querySelector('.dc-dia[data-ymd="' + S.diaSel + '"]');
    if (btn) btn.classList.add('dc-dia--sel');
    var mes = parseInt(S.diaSel.slice(5, 7), 10) - 1;
    var det = el('dc-det-' + mes);
    if (det) det.innerHTML = detalheDiaHtml(S.diaSel, indicePorDia(_visiveis)[S.diaSel], hoje0());
  }

  function abrirNoCronograma(e) {
    if (typeof window._adminCalNovoConteudo !== 'function') {
      alert('Cronograma indisponível. Abra a aba Cronograma uma vez e tente de novo.');
      return;
    }
    window._adminCalNovoConteudo({
      data: e.ymd,
      ideia: e.nome,
      legenda: '',
      observacao: '[data comemorativa] ' + e.ideia
    });
  }

  function baixarCsv() {
    var linhas = [['Data', 'Dia da semana', 'Data comemorativa', 'Categoria', 'Relevância (1-3)', 'Começar a divulgar', 'Ideia pra Elarah']];
    filtrada().forEach(function (e) {
      linhas.push([ddmm(e.dt) + '/' + S.ano, WD[e.dt.getDay()], e.nome, CATS[e.cat].label, e.rel, ddmm(e.inicio), e.ideia]);
    });
    var csv = linhas.map(function (l) {
      return l.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'datas-comemorativas-' + S.ano + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function wire() {
    var root = el('panel-datas-comemorativas');
    if (!root || root.dataset.dcWired) return;
    root.dataset.dcWired = '1';

    var sel = el('dc-ano');
    var atual = new Date().getFullYear();
    sel.innerHTML = [atual - 1, atual, atual + 1, atual + 2].map(function (a) {
      return '<option value="' + a + '"' + (a === S.ano ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    sel.addEventListener('change', function () { S.ano = parseInt(sel.value, 10); render(); });

    el('dc-cats').innerHTML = '<button type="button" class="dc-cat dc-cat--on" data-cat="">Todas</button>' +
      Object.keys(CATS).map(function (k) {
        return '<button type="button" class="dc-cat" data-cat="' + k + '">' + CATS[k].emoji + ' ' + esc(CATS[k].label) + '</button>';
      }).join('');
    el('dc-cats').addEventListener('click', function (ev) {
      var b = ev.target.closest('.dc-cat');
      if (!b) return;
      el('dc-cats').querySelectorAll('.dc-cat').forEach(function (x) { x.classList.remove('dc-cat--on'); });
      b.classList.add('dc-cat--on');
      S.cat = b.dataset.cat;
      render();
    });

    el('dc-rel').addEventListener('change', function () { S.rel = parseInt(el('dc-rel').value, 10); render(); });
    var t;
    el('dc-busca').addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { S.busca = el('dc-busca').value.trim(); render(); }, 150);
    });
    el('dc-csv').addEventListener('click', baixarCsv);
    el('dc-hoje').addEventListener('click', function () {
      if (S.ano !== atual) { S.ano = atual; sel.value = String(atual); render(); }
      var sec = el('dc-mes-' + new Date().getMonth());
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    function pintarVista() {
      el('dc-vistas').querySelectorAll('.dc-vista').forEach(function (b) {
        b.classList.toggle('dc-vista--on', b.dataset.vista === S.vista);
      });
    }
    pintarVista();
    el('dc-vistas').addEventListener('click', function (ev) {
      var b = ev.target.closest('.dc-vista');
      if (!b || b.dataset.vista === S.vista) return;
      S.vista = b.dataset.vista;
      try { localStorage.setItem('elarah_dc_vista', S.vista); } catch (e) { /* sem storage */ }
      pintarVista();
      render();
    });
    el('dc-root').addEventListener('click', function (ev) {
      var dia = ev.target.closest('.dc-dia[data-ymd]');
      if (dia) { selecionarDia(dia.dataset.ymd); return; }
      var b = ev.target.closest('.dc-add');
      if (!b) return;
      var e = _visiveis[parseInt(b.dataset.idx, 10)];
      if (e) abrirNoCronograma(e);
    });
  }

  function run() { wire(); render(); }

  function init() {
    var nav = document.querySelector('[data-panel="datas-comemorativas"]');
    if (nav && !nav.dataset.dcWired) {
      nav.dataset.dcWired = '1';
      nav.addEventListener('click', function () { setTimeout(run, 50); });
    }
    var p = el('panel-datas-comemorativas');
    if (p && p.classList.contains('admin__panel--active')) run();
  }

  window.ElarahDatasComemorativas = {
    run: run,
    doAno: doAno,
    porDia: porDia,
    categorias: CATS
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
