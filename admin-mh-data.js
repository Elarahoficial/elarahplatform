// =============================================================
// ELARAH MENTAL HEALTH — conteúdo da plataforma corporativa
// -------------------------------------------------------------
// Só DADOS (nada de tela aqui). O admin-mh.js lê daqui:
//   ATIVIDADES   — biblioteca de experiências com o benefício pra
//                  saúde mental e o fator de risco psicossocial (NR-1)
//                  que cada uma ajuda a trabalhar.
//   PROGRAMA     — o cronograma-modelo mês a mês (tema + atividade).
//   DATAS        — datas que o RH usa (campanhas de saúde, profissões,
//                  datas de presentear) com gancho pronto e gift card.
//   MENSAGENS    — prospecção pronta por canal (e-mail, LinkedIn,
//                  WhatsApp, roteiro de ligação).
//   CAPTACAO     — ações de marketing e posts prontos pra publicar.
//
// Variáveis nas mensagens: {empresa} {contato} {segmento} {gancho}
// {data_gancho} {assinatura} — trocadas na hora de copiar.
// =============================================================
(function () {
  'use strict';

  // ---------- Fatores de risco psicossocial (NR-1 / GRO) ----------
  // Linguagem próxima do Guia de Fatores de Riscos Psicossociais do
  // MTE: é o que o RH/SESMT precisa citar no plano de ação do PGR.
  var FATORES = {
    estresse:    'Estresse e sobrecarga',
    isolamento:  'Isolamento / baixo suporte social',
    relacoes:    'Conflitos e clima nas relações',
    reconhecimento: 'Falta de reconhecimento',
    lideranca:   'Preparo das lideranças',
    pertencimento: 'Baixo pertencimento',
    esgotamento: 'Esgotamento (burnout)',
    mudancas:    'Mudanças e insegurança'
  };

  // ---------- Biblioteca de atividades ----------
  // preco: faixa por pessoa (referência pra orçamento, não é tabela).
  var ATIVIDADES = [
    { id: 'ceramica', emoji: '🏺', nome: 'Cerâmica terapêutica',
      resumo: 'Modelagem em argila com as mãos: foco total no presente, sem tela.',
      beneficio: 'Reduz ansiedade pelo foco sensorial; é um "desligar" que o time sente no mesmo dia.',
      fatores: ['estresse', 'esgotamento'], duracao: '2h', grupo: '8 a 40', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 180–260', destaque: true },
    { id: 'kintsugi', emoji: '✨', nome: 'Kintsugi — consertar com ouro',
      resumo: 'Técnica japonesa de reparar cerâmica quebrada com dourado.',
      beneficio: 'Metáfora poderosa de resiliência: as "rachaduras" viram parte da história. Perfeito pro Setembro Amarelo.',
      fatores: ['esgotamento', 'mudancas'], duracao: '2h', grupo: '8 a 30', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 190–280', destaque: true },
    { id: 'pintura', emoji: '🎨', nome: 'Pintura intuitiva',
      resumo: 'Tela, tinta e zero regra. Ninguém precisa "saber pintar".',
      beneficio: 'Libera o autojulgamento e abre espaço pra criatividade — ótimo pra times sob pressão de entrega.',
      fatores: ['estresse', 'pertencimento'], duracao: '2h', grupo: '8 a 60', formatos: ['presencial_empresa', 'presencial_atelie', 'kit_em_casa'],
      preco: 'R$ 140–220' },
    { id: 'aquarela', emoji: '🖌️', nome: 'Aquarela botânica',
      resumo: 'Folhas e flores em aquarela, passo a passo.',
      beneficio: 'Ritmo lento e respiração guiada pela pincelada; efeito calmante comprovado das atividades artísticas.',
      fatores: ['estresse'], duracao: '2h', grupo: '8 a 40', formatos: ['presencial_empresa', 'online', 'kit_em_casa'],
      preco: 'R$ 130–200' },
    { id: 'bordado', emoji: '🧵', nome: 'Bordado livre',
      resumo: 'Ponto a ponto, cada pessoa borda uma palavra ou símbolo.',
      beneficio: 'Atividade repetitiva e manual que acalma o sistema nervoso. Rende conversa boa em roda.',
      fatores: ['estresse', 'isolamento'], duracao: '2h', grupo: '6 a 30', formatos: ['presencial_empresa', 'online', 'kit_em_casa'],
      preco: 'R$ 120–190' },
    { id: 'terrario', emoji: '🌿', nome: 'Terrário & kokedama',
      resumo: 'Montar um mini jardim pra levar pra mesa de trabalho.',
      beneficio: 'Contato com a natureza + um lembrete vivo de autocuidado no posto de trabalho.',
      fatores: ['estresse', 'pertencimento'], duracao: '1h30', grupo: '8 a 80', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 150–240', destaque: true },
    { id: 'velas', emoji: '🕯️', nome: 'Velas aromáticas',
      resumo: 'Cera vegetal + óleos essenciais; cada um cria o próprio aroma.',
      beneficio: 'Aromaterapia e ritual de pausa. Presente que a pessoa leva e usa em casa.',
      fatores: ['estresse', 'reconhecimento'], duracao: '1h30', grupo: '8 a 60', formatos: ['presencial_empresa', 'kit_em_casa'],
      preco: 'R$ 140–220' },
    { id: 'sabonete', emoji: '🧼', nome: 'Sabonete artesanal',
      resumo: 'Sabonetes com ervas e argilas, embalados pra presente.',
      beneficio: 'Leve, sensorial e colaborativo — funciona bem com times grandes e datas de presentear.',
      fatores: ['reconhecimento', 'relacoes'], duracao: '1h30', grupo: '10 a 80', formatos: ['presencial_empresa', 'kit_em_casa'],
      preco: 'R$ 120–190' },
    { id: 'floral', emoji: '💐', nome: 'Arranjo floral',
      resumo: 'Flores da estação e técnica de composição.',
      beneficio: 'Beleza e cuidado como pausa; ótimo pra datas de homenagem (Mulher, Secretária, Mães).',
      fatores: ['reconhecimento'], duracao: '1h30', grupo: '8 a 50', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 160–260' },
    { id: 'journaling', emoji: '📓', nome: 'Encadernação & journaling',
      resumo: 'Cada pessoa costura o próprio caderno e aprende práticas de escrita reflexiva.',
      beneficio: 'Escrita expressiva ajuda a organizar pensamentos e emoções; o caderno vira ferramenta diária.',
      fatores: ['esgotamento', 'mudancas'], duracao: '2h', grupo: '8 a 30', formatos: ['presencial_empresa', 'online', 'kit_em_casa'],
      preco: 'R$ 150–230' },
    { id: 'visionboard', emoji: '🗺️', nome: 'Colagem de intenções (vision board)',
      resumo: 'Revistas, papéis e tesoura: o ano que cada um quer viver.',
      beneficio: 'Clareza de propósito e conversa sobre expectativas — casa com planejamento de início de ano.',
      fatores: ['pertencimento', 'mudancas'], duracao: '1h30', grupo: '8 a 60', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 110–170' },
    { id: 'mosaico', emoji: '🧩', nome: 'Mosaico coletivo',
      resumo: 'Cada pessoa faz uma peça; juntas formam um painel pra parede da empresa.',
      beneficio: 'Constrói pertencimento de forma literal: o time vê a própria obra todo dia.',
      fatores: ['pertencimento', 'relacoes'], duracao: '2h', grupo: '15 a 100', formatos: ['presencial_empresa'],
      preco: 'R$ 150–240', destaque: true },
    { id: 'macrame', emoji: '🪢', nome: 'Macramê',
      resumo: 'Nós e fios pra criar um chaveiro ou suporte de planta.',
      beneficio: 'Coordenação fina + repetição = mente quieta. Resultado bonito já na primeira vez.',
      fatores: ['estresse'], duracao: '1h30', grupo: '8 a 40', formatos: ['presencial_empresa', 'kit_em_casa'],
      preco: 'R$ 120–190' },
    { id: 'perfumaria', emoji: '🌸', nome: 'Perfumaria botânica',
      resumo: 'Criar um perfume ou body splash autoral com essências naturais.',
      beneficio: 'Olfato é memória e emoção: experiência de autocuidado muito marcante.',
      fatores: ['reconhecimento', 'estresse'], duracao: '1h30', grupo: '8 a 40', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 170–260' },
    { id: 'cozinha', emoji: '🥖', nome: 'Cozinha afetiva',
      resumo: 'Pães, massas ou quitutes juninos feitos juntos — e comidos juntos.',
      beneficio: 'Comer junto é o ritual de conexão mais antigo; aproxima áreas que não conversam.',
      fatores: ['relacoes', 'isolamento'], duracao: '2h30', grupo: '10 a 40', formatos: ['presencial_atelie'],
      preco: 'R$ 190–290' },
    { id: 'cha', emoji: '🍵', nome: 'Chá & mindfulness',
      resumo: 'Degustação de chás com práticas de atenção plena entre as xícaras.',
      beneficio: 'Introduz a pausa consciente de um jeito leve, sem "cara de terapia".',
      fatores: ['estresse', 'esgotamento'], duracao: '1h', grupo: '8 a 50', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 90–150' },
    { id: 'respiracao', emoji: '🌬️', nome: 'Respiração & meditação guiada',
      resumo: 'Técnicas de respiração pra usar em 3 minutos antes de uma reunião difícil.',
      beneficio: 'Ferramenta prática e imediata de regulação emocional. Ótimo formato online pra times híbridos.',
      fatores: ['estresse', 'esgotamento'], duracao: '45min', grupo: 'até 300', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 1.500–3.500 (turma)' },
    { id: 'yoga', emoji: '🧘', nome: 'Yoga na empresa',
      resumo: 'Aula adaptada pra roupa de trabalho, na sala de reunião ou no terraço.',
      beneficio: 'Alivia dores posturais e tensão; pode virar encontro fixo semanal/quinzenal.',
      fatores: ['estresse'], duracao: '50min', grupo: 'até 30', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 900–1.800 (turma)' },
    { id: 'roda', emoji: '🫶', nome: 'Roda de conversa com psicóloga',
      resumo: 'Encontro mediado por psicóloga sobre um tema (ansiedade, limites, luto, sobrecarga).',
      beneficio: 'Espaço seguro de escuta; reduz estigma e mostra caminhos de apoio. Casa com qualquer atividade manual.',
      fatores: ['isolamento', 'esgotamento', 'relacoes'], duracao: '1h30', grupo: '8 a 25', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 2.000–4.000 (encontro)' },
    { id: 'lideres', emoji: '🧭', nome: 'Workshop NR-1 para lideranças',
      resumo: 'Como a liderança identifica sinais de risco psicossocial e conduz conversas difíceis.',
      beneficio: 'Líder preparado é a primeira barreira de prevenção — e é o que a fiscalização quer ver no plano de ação.',
      fatores: ['lideranca', 'relacoes'], duracao: '3h', grupo: 'até 30 líderes', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 4.500–9.000 (turma)', destaque: true },
    { id: 'cnv', emoji: '💬', nome: 'Comunicação não-violenta',
      resumo: 'Vivência prática de CNV com exercícios em duplas.',
      beneficio: 'Diminui conflitos e ruído entre áreas; melhora feedback.',
      fatores: ['relacoes', 'lideranca'], duracao: '3h', grupo: 'até 40', formatos: ['presencial_empresa', 'online'],
      preco: 'R$ 3.500–7.000 (turma)' },
    { id: 'totebag', emoji: '👜', nome: 'Pintura em ecobag',
      resumo: 'Cada pessoa customiza a própria ecobag com carimbos e tinta de tecido.',
      beneficio: 'Divertido, rápido e com brinde útil — ótimo pra SIPAT e integração de novos.',
      fatores: ['pertencimento'], duracao: '1h', grupo: '15 a 150', formatos: ['presencial_empresa'],
      preco: 'R$ 90–150' },
    { id: 'kit', emoji: '📦', nome: 'Kit experiência em casa',
      resumo: 'Caixa com materiais + vídeo-aula: o colaborador faz quando e onde quiser.',
      beneficio: 'Inclui times remotos e turnos diferentes — ninguém fica de fora do programa.',
      fatores: ['isolamento', 'pertencimento'], duracao: 'livre', grupo: 'ilimitado', formatos: ['kit_em_casa'],
      preco: 'R$ 120–220 + frete' },
    { id: 'giftcard', emoji: '🎁', nome: 'Gift card Elarah',
      resumo: 'Vale-experiência pra o colaborador escolher o que quer viver (cerâmica, drinks, pintura…).',
      beneficio: 'Reconhecimento com autonomia: cada um escolhe o próprio momento de descanso.',
      fatores: ['reconhecimento'], duracao: '—', grupo: 'individual', formatos: ['kit_em_casa'],
      preco: 'a partir de R$ 100' }
  ];

  var FORMATOS = {
    presencial_empresa: 'Na empresa',
    presencial_atelie: 'No ateliê',
    online: 'Online',
    kit_em_casa: 'Kit / em casa'
  };

  // ---------- Programa-modelo (12 meses) ----------
  var PROGRAMA = [
    { mes: 1,  tema: 'Janeiro Branco — começar cuidando', atividade: 'visionboard', extra: 'roda',
      porque: 'Mês nacional da saúde mental. Abrir o ano com intenção e escuta dá o tom do programa.' },
    { mes: 2,  tema: 'Volta com leveza', atividade: 'pintura',
      porque: 'Pós-férias e Carnaval: reconectar o time sem pressão, com criatividade.' },
    { mes: 3,  tema: 'Mês das mulheres', atividade: 'perfumaria', extra: 'floral',
      porque: '8 de março. Homenagem com experiência (e não só flor na mesa).' },
    { mes: 4,  tema: 'Abril Verde — saúde e segurança', atividade: 'lideres', extra: 'respiracao',
      porque: '7/4 Saúde e 28/4 Segurança no Trabalho: momento ideal pra formar lideranças (NR-1).' },
    { mes: 5,  tema: 'Quem cuida também precisa de cuidado', atividade: 'velas',
      porque: 'Dia do Trabalhador e das Mães: ritual de pausa + presente pra levar pra casa.' },
    { mes: 6,  tema: 'Arraiá do time', atividade: 'cozinha',
      porque: 'Festa junina e Dia do Profissional de RH (3/6): celebrar quem faz a empresa.' },
    { mes: 7,  tema: 'Respiro de meio de ano', atividade: 'terrario',
      porque: 'Balanço do semestre e Dia do Amigo (20/7). Um jardim vivo na mesa de cada um.' },
    { mes: 8,  tema: 'Mãos na massa', atividade: 'ceramica',
      porque: 'Dia dos Pais e segundo semestre começando: foco no presente, longe das telas.' },
    { mes: 9,  tema: 'Setembro Amarelo — falar é cuidar', atividade: 'kintsugi', extra: 'roda',
      porque: 'Prevenção ao suicídio. Kintsugi = resiliência; a roda com psicóloga abre espaço seguro.' },
    { mes: 10, tema: 'Saúde mental em foco', atividade: 'ceramica', extra: 'cnv',
      porque: '10/10 Dia Mundial da Saúde Mental + Outubro Rosa.' },
    { mes: 11, tema: 'Gentileza e pertencimento', atividade: 'mosaico',
      porque: 'Dia da Gentileza (13/11) + Novembro Azul: uma obra coletiva pra parede da empresa.' },
    { mes: 12, tema: 'Encerrar o ciclo com gratidão', atividade: 'giftcard', extra: 'journaling',
      porque: 'Confraternização em ateliê + gift card como presente de fim de ano.' }
  ];

  // ---------- Datas pro RH ----------
  // [mes, dia, nome, categoria, relevancia(1-3), gancho pro RH, sugestão de presente/ação, atividade]
  // Categorias: saude (campanhas de saúde), homenagem (profissões e
  // pessoas), presentear (datas de presente/gift card), cultura (clima).
  var DATAS = [
    [1, 1,  'Janeiro Branco (mês todo)', 'saude', 3, 'Mês nacional da saúde mental: abra o programa do ano com escuta e intenção.', 'Roda de conversa + colagem de intenções', 'visionboard'],
    [1, 20, 'Dia do Farmacêutico', 'homenagem', 1, 'Pra farmácias, laboratórios e indústria farmacêutica: homenagem ao time técnico.', 'Gift card individual', 'giftcard'],
    [1, 25, 'Aniversário de São Paulo', 'cultura', 1, 'Feriado na cidade: ação "SP que acolhe" com experiência em ateliê paulistano.', 'Experiência em ateliê', 'ceramica'],
    [2, 1,  'Dia do Publicitário', 'homenagem', 2, 'Agências vivem de criatividade — e de prazo. Uma pausa criativa de verdade.', 'Pintura intuitiva', 'pintura'],
    [3, 8,  'Dia Internacional da Mulher', 'homenagem', 3, 'Troque o bombom por uma experiência que ela vai lembrar.', 'Perfumaria botânica ou gift card', 'perfumaria'],
    [3, 20, 'Dia Internacional da Felicidade', 'cultura', 2, 'Pergunte ao time o que traz alegria no trabalho — e comece por uma pausa criativa.', 'Chá & mindfulness', 'cha'],
    [4, 7,  'Dia Mundial da Saúde', 'saude', 3, 'Saúde é também mental: lance o programa anual nesta data.', 'Respiração guiada (online, pra todos)', 'respiracao'],
    [4, 28, 'Dia Mundial da Segurança e Saúde no Trabalho', 'saude', 3, 'Data-chave pra NR-1: mostre o plano de ação de riscos psicossociais.', 'Workshop NR-1 para lideranças', 'lideres'],
    [5, 1,  'Dia do Trabalhador', 'cultura', 2, 'Reconhecer quem faz a empresa acontecer.', 'Velas aromáticas pra levar pra casa', 'velas'],
    [5, 12, 'Dia da Enfermagem', 'homenagem', 2, 'Hospitais e clínicas: equipe com altíssimo risco de esgotamento.', 'Kit em casa + gift card', 'kit'],
    [5, 22, 'Dia do Abraço', 'cultura', 1, 'Gancho leve pra ação de integração entre áreas.', 'Cozinha afetiva', 'cozinha'],
    [6, 3,  'Dia do Profissional de RH', 'homenagem', 3, 'Quem cuida de todo mundo também precisa de cuidado. Presenteie o seu RH.', 'Gift card ou cerâmica pro time de RH', 'ceramica'],
    [6, 21, 'Dia Internacional do Yoga', 'saude', 1, 'Aula aberta de yoga na empresa.', 'Yoga na empresa', 'yoga'],
    [7, 20, 'Dia do Amigo', 'cultura', 2, 'Vínculo entre colegas protege contra isolamento — atividade em duplas.', 'Terrário em dupla', 'terrario'],
    [8, 11, 'Dia do Advogado', 'homenagem', 2, 'Escritórios de advocacia: rotina de alta pressão pede pausa.', 'Cerâmica terapêutica', 'ceramica'],
    [8, 18, 'Dia do Estagiário', 'homenagem', 1, 'Integração e pertencimento pra quem está chegando.', 'Pintura em ecobag', 'totebag'],
    [8, 27, 'Dia do Psicólogo', 'homenagem', 1, 'Parceria com o time de psicologia interno / EAP.', 'Roda de conversa', 'roda'],
    [8, 28, 'Dia do Bancário', 'homenagem', 1, 'Setor com alto índice de afastamento por saúde mental.', 'Workshop de respiração', 'respiracao'],
    [9, 1,  'Setembro Amarelo (mês todo)', 'saude', 3, 'Falar é a melhor solução. Kintsugi + roda com psicóloga.', 'Kintsugi + roda de conversa', 'kintsugi'],
    [9, 9,  'Dia do Administrador', 'homenagem', 1, 'Homenagem ao time administrativo/financeiro.', 'Gift card individual', 'giftcard'],
    [9, 15, 'Dia do Cliente', 'presentear', 2, 'Empresas presenteiam clientes: gift card de experiência encanta mais que brinde.', 'Gift cards para clientes', 'giftcard'],
    [9, 30, 'Dia da Secretária', 'presentear', 3, 'Presenteie sua secretária com uma experiência, não com flores murchas.', 'Gift card ou arranjo floral', 'floral'],
    [10, 1, 'Outubro Rosa (mês todo)', 'saude', 2, 'Cuidado com a mulher, corpo e mente.', 'Arranjo floral rosa + roda de conversa', 'floral'],
    [10, 10, 'Dia Mundial da Saúde Mental', 'saude', 3, 'A data mais importante do calendário do programa.', 'Cerâmica terapêutica para o time todo', 'ceramica'],
    [10, 12, 'Dia das Crianças', 'presentear', 2, 'Família do colaborador: kit de experiência pra fazer com os filhos.', 'Kit em casa família', 'kit'],
    [10, 15, 'Dia do Professor', 'homenagem', 3, 'Escolas e faculdades: professores estão entre os mais afastados por burnout.', 'Velas aromáticas ou gift card', 'velas'],
    [10, 18, 'Dia do Médico', 'homenagem', 2, 'Hospitais e clínicas: cuidar de quem cuida.', 'Gift card', 'giftcard'],
    [10, 19, 'Dia do Profissional de TI', 'homenagem', 2, 'Times de tecnologia: uma pausa longe das telas.', 'Cerâmica ou terrário', 'terrario'],
    [11, 1, 'Novembro Azul (mês todo)', 'saude', 2, 'Saúde do homem: falar de cuidado com leveza.', 'Cozinha afetiva / cerâmica', 'ceramica'],
    [11, 13, 'Dia Mundial da Gentileza', 'cultura', 2, 'Obra coletiva que fica na parede como símbolo do time.', 'Mosaico coletivo', 'mosaico'],
    [11, 19, 'Dia da Mulher Empreendedora', 'homenagem', 1, 'Lideranças femininas: encontro de conexão.', 'Perfumaria botânica', 'perfumaria'],
    [12, 1, 'Confraternização de fim de ano', 'presentear', 3, 'Troque o happy hour genérico por uma experiência em ateliê + presente.', 'Confraternização em ateliê + gift cards', 'giftcard'],
    [12, 11, 'Dia do Engenheiro', 'homenagem', 1, 'Construtoras e indústrias: homenagem ao time técnico.', 'Gift card individual', 'giftcard'],
    [12, 15, 'Dia do Arquiteto', 'homenagem', 1, 'Escritórios de arquitetura: criatividade com as mãos.', 'Cerâmica', 'ceramica']
  ];

  // ---------- Datas móveis ----------
  function pascoa(ano) {
    var a = ano % 19, b = Math.floor(ano / 100), c = ano % 100,
        d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }
  function nthDomingo(ano, mes, n) {
    var d = new Date(ano, mes - 1, 1);
    var off = (7 - d.getDay()) % 7;
    return new Date(ano, mes - 1, 1 + off + 7 * (n - 1));
  }
  function addDias(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  // Dia do Programador = 256º dia do ano.
  function diaProgramador(ano) { return addDias(new Date(ano, 0, 1), 255); }
  // Black Friday = sexta depois da 4ª quinta de novembro.
  function blackFriday(ano) {
    var d = new Date(ano, 10, 1);
    var off = (4 - d.getDay() + 7) % 7;
    return new Date(ano, 10, 1 + off + 21 + 1);
  }

  function datasDoAno(ano) {
    var out = DATAS.map(function (r) {
      return { data: new Date(ano, r[0] - 1, r[1]), nome: r[2], cat: r[3], rel: r[4], gancho: r[5], presente: r[6], atividade: r[7] };
    });
    var p = pascoa(ano);
    out.push({ data: addDias(p, -47), nome: 'Carnaval', cat: 'cultura', rel: 1, gancho: 'Volta do Carnaval: retomada leve e criativa.', presente: 'Pintura intuitiva', atividade: 'pintura' });
    out.push({ data: addDias(p, 0), nome: 'Páscoa', cat: 'presentear', rel: 2, gancho: 'No lugar do ovo, uma experiência (ou o ovo + gift card).', presente: 'Gift card ou cozinha afetiva', atividade: 'giftcard' });
    out.push({ data: nthDomingo(ano, 5, 2), nome: 'Dia das Mães', cat: 'presentear', rel: 3, gancho: 'Homenagem às mães do time — e presente pra elas darem às próprias mães.', presente: 'Velas aromáticas / gift card', atividade: 'velas' });
    out.push({ data: nthDomingo(ano, 8, 2), nome: 'Dia dos Pais', cat: 'presentear', rel: 3, gancho: 'Experiência pra fazer com os filhos ou gift card de presente.', presente: 'Cerâmica pai & filho / gift card', atividade: 'ceramica' });
    out.push({ data: diaProgramador(ano), nome: 'Dia do Programador', cat: 'homenagem', rel: 2, gancho: 'Tech: desligar das telas por 2 horas.', presente: 'Cerâmica ou terrário', atividade: 'ceramica' });
    out.push({ data: blackFriday(ano), nome: 'Black Friday (pico de estresse no varejo)', cat: 'saude', rel: 1, gancho: 'Varejo e e-commerce: cuidar do time depois do pico.', presente: 'Kit em casa', atividade: 'kit' });
    out.sort(function (a, b) { return a.data - b.data; });
    return out;
  }

  var CATS_DATA = {
    saude:      { label: 'Campanha de saúde', emoji: '💚', bg: '#e4f3ec', fg: '#1f6b4a' },
    homenagem:  { label: 'Homenagem / profissão', emoji: '💼', bg: '#e8edf8', fg: '#2d4f8a' },
    presentear: { label: 'Data de presentear', emoji: '🎁', bg: '#fdecdf', fg: '#a1501a' },
    cultura:    { label: 'Clima & cultura', emoji: '✨', bg: '#f1eafb', fg: '#5b3a9c' }
  };

  // ---------- Mensagens de prospecção ----------
  // angulo: nr1 (obrigação legal), data (data próxima), giftcard.
  var MENSAGENS = {
    email: [
      { id: 'email-nr1', angulo: 'NR-1', assunto: '{empresa} + NR-1: um plano de saúde mental que o time vai querer participar',
        corpo:
'Olá, {contato}!\n\n' +
'Desde maio de 2026 a NR-1 exige que as empresas incluam os riscos psicossociais (estresse, sobrecarga, esgotamento) no gerenciamento de riscos — e mostrem ações de prevenção no plano.\n\n' +
'A Elarah Mental Health monta isso de um jeito que o time AMA participar: um cronograma de experiências manuais (cerâmica terapêutica, kintsugi, terrários, rodas com psicóloga, workshop para lideranças) conectado às datas que importam — Setembro Amarelo, Dia Mundial da Saúde Mental, Janeiro Branco.\n\n' +
'Entregamos tudo pronto: planejamento pontual, semestral ou anual, execução na {empresa} ou no ateliê, lista de presença e relatório de cada ação pra anexar ao PGR.\n\n' +
'Posso te mandar um cronograma-modelo para {segmento} sem compromisso? São 15 minutos de conversa.\n\n' +
'{assinatura}' },
      { id: 'email-data', angulo: 'Data próxima', assunto: 'Ideia pro {gancho} na {empresa} 💚',
        corpo:
'Oi, {contato}! Tudo bem?\n\n' +
'Faltam poucas semanas pro {gancho} ({data_gancho}) e pensei na {empresa}.\n\n' +
'Em vez de mais um e-mail de campanha, que tal 2 horas em que o time desliga das telas e cria algo com as mãos? Nossas experiências mais pedidas pra essa data: cerâmica terapêutica, kintsugi (a arte japonesa de consertar com ouro) e roda de conversa com psicóloga.\n\n' +
'A gente leva tudo até a empresa — material, facilitadora, fotos e relatório pro RH.\n\n' +
'Te mando 3 opções com valores até amanhã?\n\n' +
'{assinatura}' },
      { id: 'email-gift', angulo: 'Gift card / presentear', assunto: 'Presente que o time não esquece (e que cabe no orçamento)',
        corpo:
'Olá, {contato}!\n\n' +
'Datas como Dia da Secretária, Dia do Cliente e fim de ano costumam virar cesta ou brinde que ninguém lembra na semana seguinte.\n\n' +
'Na Elarah, a {empresa} presenteia com gift cards de experiência: a pessoa escolhe o que quer viver — aula de cerâmica, drinks, pintura, perfumaria — em São Paulo ou com kit em casa. Vale como reconhecimento e como cuidado com a saúde mental.\n\n' +
'Montamos um calendário anual de datas pra {empresa} presentear, com valores por faixa. Quer ver?\n\n' +
'{assinatura}' }
    ],
    linkedin: [
      { id: 'li-convite', angulo: 'Convite (até 300 caracteres)',
        corpo: 'Oi, {contato}! Trabalho com programas de saúde mental para empresas (NR-1) usando experiências manuais — cerâmica, kintsugi, rodas com psicóloga. Vi o trabalho da {empresa} com pessoas e adoraria trocar ideias. Posso te adicionar?' },
      { id: 'li-followup', angulo: 'Depois que aceitar',
        corpo:
'Obrigada por aceitar, {contato}! 💚\n\n' +
'Rapidinho: estamos montando cronogramas de saúde mental para empresas de {segmento} — ações mensais que já entram no plano de riscos psicossociais da NR-1 e que o time participa de verdade (nada de palestra que ninguém assiste).\n\n' +
'Posso te mandar um modelo de calendário anual? Sem compromisso, dá pra usar como referência mesmo que não seja com a gente.' },
      { id: 'li-data', angulo: 'Gancho de data',
        corpo: '{contato}, o {gancho} ({data_gancho}) está chegando. Já tem algo planejado na {empresa}? Tenho 3 ideias de experiências de 2h que o time adora (e que viram evidência pro plano da NR-1). Posso te mandar?' }
    ],
    whatsapp: [
      { id: 'wa-primeiro', angulo: 'Primeiro contato',
        corpo:
'Olá! Aqui é da Elarah Mental Health 💚\n\n' +
'A gente cria programas de saúde mental para empresas com experiências manuais (cerâmica terapêutica, terrários, kintsugi, rodas com psicóloga) — e entrega tudo documentado pra NR-1.\n\n' +
'Com quem da {empresa} eu posso falar sobre ações para o time? (RH, Gente & Cultura ou SESMT)' },
      { id: 'wa-data', angulo: 'Data próxima',
        corpo: 'Oi, {contato}! O {gancho} é dia {data_gancho} 🗓️ Já pensou na ação da {empresa}? Montamos em 48h uma experiência de 2h pro time, na empresa ou no ateliê. Te mando as opções?' }
    ],
    ligacao: [
      { id: 'call-roteiro', angulo: 'Roteiro de ligação (60 segundos)',
        corpo:
'1) ABERTURA — "Oi, aqui é [nome], da Elarah Mental Health. Você cuida da parte de pessoas ou benefícios da {empresa}?"\n' +
'   (Se não: "Quem seria a melhor pessoa? Pode me passar o e-mail dela?")\n\n' +
'2) GANCHO — "Estou ligando porque, com a NR-1 exigindo ações sobre riscos psicossociais, muitas empresas de {segmento} estão buscando algo que o time realmente participe."\n\n' +
'3) VALOR — "A gente monta o cronograma do ano — cerâmica terapêutica, roda com psicóloga, workshop para lideranças — e entrega o relatório de cada ação pro PGR."\n\n' +
'4) PERGUNTA — "Vocês já têm algo planejado pro {gancho}?"\n\n' +
'5) PRÓXIMO PASSO — "Posso te mandar um cronograma-modelo por e-mail e marcar 15 minutos na semana que vem? Qual o melhor e-mail?"\n\n' +
'OBJEÇÕES:\n' +
'• "Já temos psicólogo / EAP" → "Ótimo! A gente complementa: o EAP atende quem já pediu ajuda; as experiências chegam em todo mundo, antes."\n' +
'• "Sem orçamento" → "Dá pra começar com uma ação pontual numa data forte, ou com gift cards no valor que couber."\n' +
'• "Manda por e-mail" → "Mando agora. Pra personalizar: quantas pessoas são no time?"' }
    ]
  };

  // ---------- Captação: ações de marketing ----------
  var CAPTACAO = [
    { titulo: 'Café com RHs', tipo: 'Evento', esforco: 'médio', impacto: 'alto',
      desc: 'Encontro mensal no ateliê para 10–15 RHs: 1h de cerâmica + 30min de conversa sobre NR-1 com uma psicóloga. Quem vive a experiência vende pra diretoria.' },
    { titulo: 'Material rico: "Calendário de Saúde Mental 2027"', tipo: 'Isca digital', esforco: 'baixo', impacto: 'alto',
      desc: 'PDF bonito com as datas do ano + uma ideia de ação por mês. Troca por e-mail na landing page. Vira lista de leads quentes.' },
    { titulo: 'Checklist NR-1: riscos psicossociais em 10 passos', tipo: 'Isca digital', esforco: 'baixo', impacto: 'alto',
      desc: 'Conteúdo educativo (sem prometer compliance jurídico) que posiciona a Elarah como quem entende do assunto.' },
    { titulo: 'Parceria com consultorias de SST e medicina do trabalho', tipo: 'Parceria', esforco: 'médio', impacto: 'alto',
      desc: 'Quem faz o PGR precisa indicar ações de prevenção. Ofereça comissão de 10% por indicação e material co-brandeado.' },
    { titulo: 'Parceria com corretoras de benefícios e plano de saúde', tipo: 'Parceria', esforco: 'médio', impacto: 'alto',
      desc: 'Corretoras querem reduzir sinistralidade dos clientes. A Elarah entra como "ação de prevenção" no pacote delas.' },
    { titulo: 'Webinar mensal "NR-1 na prática para RH"', tipo: 'Conteúdo', esforco: 'médio', impacto: 'médio',
      desc: '40 minutos com psicóloga organizacional + 1 case. Gravação vira conteúdo para LinkedIn e YouTube.' },
    { titulo: 'Caixa surpresa para RHs-alvo', tipo: 'Outbound', esforco: 'alto', impacto: 'alto',
      desc: 'Envie para 20 RHs de empresas-sonho um mini kit (vela + cartão com QR para o calendário). Follow-up por LinkedIn 3 dias depois.' },
    { titulo: 'Case + depoimento em vídeo', tipo: 'Prova social', esforco: 'baixo', impacto: 'alto',
      desc: 'Depois de cada ação, grave 30s com o RH e 2 colaboradores. Nada vende mais B2B do que outro RH falando.' },
    { titulo: 'Presença em eventos de RH', tipo: 'Evento', esforco: 'alto', impacto: 'médio',
      desc: 'CONARH, encontros da ABRH-SP e meetups de People: leve uma mesa de cerâmica ao vivo — a fila vira lista de leads.' },
    { titulo: 'Programa de indicação entre RHs', tipo: 'Indicação', esforco: 'baixo', impacto: 'médio',
      desc: 'RH que indica outra empresa ganha gift card de R$ 300 quando a indicada fecha.' },
    { titulo: 'LinkedIn Ads para cargos de RH em SP', tipo: 'Mídia paga', esforco: 'médio', impacto: 'médio',
      desc: 'Segmentar Head de Pessoas, RH, Gente & Cultura, SESMT em empresas de 50–1.000 pessoas. Criativo: vídeo do kintsugi.' },
    { titulo: 'Sequência de e-mails para leads da landing', tipo: 'Nutrição', esforco: 'baixo', impacto: 'médio',
      desc: 'D0 calendário · D3 case · D7 "o que a NR-1 pede" · D14 proposta com data próxima.' }
  ];

  // ---------- Posts prontos ----------
  var POSTS = [
    { canal: 'LinkedIn', titulo: 'Kintsugi e o seu time (troque pelo seu caso real)',
      texto:
'No Japão, quando uma cerâmica quebra, ela não vai pro lixo.\n\n' +
'Ela é consertada com ouro. As rachaduras viram a parte mais bonita da peça. Isso se chama kintsugi.\n\n' +
'[Troque por um caso real: "Esta semana levamos o kintsugi pra um time de X pessoas. No fim, alguém disse: …"]\n\n' +
'Saúde mental no trabalho não é só palestra. É criar espaço pra pausa, pra conversa, pra reparo.\n\n' +
'Com a NR-1, cuidar dos riscos psicossociais virou obrigação. Na Elarah Mental Health, a gente faz isso virar o momento que o time mais espera no mês.\n\n' +
'#SaudeMental #NR1 #RH #GenteECultura #BemEstarCorporativo' },
    { canal: 'LinkedIn', titulo: 'NR-1 sem burocracia',
      texto:
'RH, uma pergunta sincera: seu plano de ação para riscos psicossociais já está pronto?\n\n' +
'Desde maio de 2026 a NR-1 cobra que estresse, sobrecarga e esgotamento entrem no gerenciamento de riscos.\n\n' +
'O que costuma funcionar:\n' +
'✅ Um calendário anual (não uma ação solta)\n' +
'✅ Lideranças preparadas pra identificar sinais\n' +
'✅ Ações que o time QUER participar\n' +
'✅ Registro de tudo: presença, fotos, relatório\n\n' +
'A gente monta esse calendário com experiências manuais — cerâmica, terrários, rodas com psicóloga — e entrega a documentação pronta.\n\n' +
'Comenta "CALENDÁRIO" que eu te mando o modelo de 2027.' },
    { canal: 'Instagram', titulo: 'Carrossel: 5 datas que todo RH devia ter no calendário',
      texto:
'Capa: 5 datas que todo RH devia ter no calendário 🗓️\n' +
'1. Janeiro Branco — mês da saúde mental\n' +
'2. 28/4 — Dia Mundial da Segurança e Saúde no Trabalho\n' +
'3. 3/6 — Dia do Profissional de RH (cuide de quem cuida!)\n' +
'4. Setembro Amarelo — falar é a melhor solução\n' +
'5. 10/10 — Dia Mundial da Saúde Mental\n' +
'Final: A gente monta o cronograma do ano pra sua empresa. Link na bio 💚' },
    { canal: 'LinkedIn', titulo: 'Dia da Secretária (30/9)',
      texto:
'30 de setembro é Dia da Secretária.\n\n' +
'Flores murcham em 3 dias. Uma tarde fazendo cerâmica, perfume ou arranjo floral vira memória.\n\n' +
'Gift cards de experiência Elarah: ela escolhe o que quer viver, quando quiser. A partir de R$ 100.\n\n' +
'Presenteie quem segura a agenda da empresa inteira. 💐' },
    { canal: 'Instagram/Reels', titulo: 'Roteiro de Reels (15s)',
      texto:
'0–3s: close das mãos na argila + texto "o que acontece com o seu time em 2h longe das telas"\n' +
'3–10s: cortes rápidos — risadas, peças prontas, roda de conversa\n' +
'10–15s: texto "Saúde mental no trabalho que o time AMA. NR-1 em dia." + logo Elarah Mental Health\n' +
'Áudio: tendência calma/lo-fi' }
  ];

  window.ElarahMHData = {
    FATORES: FATORES,
    ATIVIDADES: ATIVIDADES,
    FORMATOS: FORMATOS,
    PROGRAMA: PROGRAMA,
    CATS_DATA: CATS_DATA,
    datasDoAno: datasDoAno,
    MENSAGENS: MENSAGENS,
    CAPTACAO: CAPTACAO,
    POSTS: POSTS,
    atividade: function (id) {
      for (var i = 0; i < ATIVIDADES.length; i++) if (ATIVIDADES[i].id === id) return ATIVIDADES[i];
      return null;
    }
  };
})();
