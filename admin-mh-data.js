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
    { id: 'pausa-arte', emoji: '🎨', nome: 'Pausa com Arte (Arteterapia)',
      resumo: 'Vivência de pintura e expressão artística conduzida por arteterapeuta. Ninguém precisa saber desenhar.',
      beneficio: 'Desacelera, alivia as tensões do cotidiano e estimula o autoconhecimento — o foco é o processo, não o resultado.',
      fatores: ['estresse', 'esgotamento'], duracao: '2h', grupo: '8 a 40', formatos: ['presencial_empresa', 'presencial_atelie', 'online'],
      preco: 'R$ 150–240', destaque: true },
    { id: 'criatividade', emoji: '💡', nome: 'Criatividade e novas perspectivas',
      resumo: 'Vivência de Arteterapia com tinta, argila, desenho e colagem para experimentar e flexibilizar padrões.',
      beneficio: 'Desbloqueio criativo: ajuda o time a sair do automático e enxergar novas possibilidades.',
      fatores: ['mudancas', 'esgotamento'], duracao: '2h', grupo: '8 a 30', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 160–250', destaque: true },
    { id: 'conexao', emoji: '🤝', nome: 'Conexão e desenvolvimento de equipes',
      resumo: 'Criação artística compartilhada que trabalha escuta, empatia e colaboração — para times e lideranças.',
      beneficio: 'Fortalece as relações e o clima; ótimo para times novos, fusões de áreas e lideranças.',
      fatores: ['relacoes', 'pertencimento', 'lideranca'], duracao: '2h30', grupo: '8 a 40', formatos: ['presencial_empresa', 'presencial_atelie'],
      preco: 'R$ 170–260', destaque: true },
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

  // ---------- Personalização por segmento ----------
  // Cada empresa recebe a mensagem com a DOR do setor dela, a data que
  // mais conversa com o time e a experiência que mais combina.
  // match: regex testada em "segmento + tipo_empresa + nome".
  var SEGMENTOS = [
    { id: 'tech', label: 'Tecnologia', match: /tech|software|fintech|startup|ti\b|tecnolog|sistemas|digital|dados|saas/i,
      dor: 'times de tecnologia passam o dia inteiro em tela, com prazos apertados e muita reunião — é onde o esgotamento aparece primeiro',
      atividade: 'cerâmica terapêutica (2 horas sem tela, só mãos na argila)', data: 'Dia do Programador e o Dia Mundial da Saúde Mental', ajuste: 'e temos formato online e kit em casa para quem é remoto' },
    { id: 'juridico', label: 'Jurídico', match: /advoga|jur[ií]dic|direito|law|legal/i,
      dor: 'escritórios de advocacia vivem de prazo, pressão por resultado e jornada longa — um cenário clássico de sobrecarga',
      atividade: 'kintsugi, a arte japonesa de consertar cerâmica com ouro (vira uma conversa linda sobre pressão e recomeço)', data: 'o Dia do Advogado (11/8) e o Setembro Amarelo', ajuste: 'no fim do expediente, no próprio escritório, em 2 horas' },
    { id: 'saude', label: 'Saúde', match: /hospital|cl[ií]nic|sa[uú]de|m[eé]dic|laborat|odonto|enferm|farm/i,
      dor: 'quem trabalha cuidando dos outros é quem mais adoece — equipes de saúde estão entre as mais afastadas por esgotamento',
      atividade: 'velas aromáticas ou terrário (ritual de pausa que cabe entre plantões)', data: 'o Dia da Enfermagem, o Dia do Médico e o Dia Mundial da Saúde Mental', ajuste: 'em horários diferentes para cobrir todos os turnos' },
    { id: 'educacao', label: 'Educação', match: /escola|col[eé]gio|faculdade|universidade|educa|ensino|curso/i,
      dor: 'professores estão entre os profissionais mais afastados por burnout no Brasil',
      atividade: 'bordado livre ou cerâmica (atividade manual que acalma e aproxima a equipe)', data: 'o Dia do Professor (15/10) e o Janeiro Branco', ajuste: 'nas semanas de planejamento pedagógico, sem atrapalhar as aulas' },
    { id: 'agencia', label: 'Agência / marketing', match: /ag[eê]ncia|publicidade|marketing|comunica|propaganda|design|criativ/i,
      dor: 'agências vivem de criatividade — e de prazo impossível, o que drena a própria criatividade do time',
      atividade: 'pintura intuitiva ou mosaico coletivo (criar sem briefing e sem cliente)', data: 'o Dia do Publicitário e o Dia Mundial da Saúde Mental', ajuste: 'num fim de tarde, na própria agência' },
    { id: 'financeiro', label: 'Financeiro', match: /banco|financ|seguro|investim|cr[eé]dito|contab|cont[aá]bil|auditoria|corretora/i,
      dor: 'o setor financeiro combina meta agressiva, fechamento de mês e cobrança constante — muito estresse acumulado',
      atividade: 'cerâmica terapêutica ou chá & mindfulness', data: 'o Dia do Bancário/Contador e o Setembro Amarelo', ajuste: 'fora das semanas de fechamento' },
    { id: 'construcao', label: 'Construção / engenharia', match: /constru|engenharia|incorpora|obra|arquitet|imobili/i,
      dor: 'obra, prazo e cliente cobrando: o time administrativo e de engenharia carrega muita pressão invisível',
      atividade: 'terrário ou cerâmica (mãos na terra, cabeça no presente)', data: 'o Abril Verde (segurança e saúde no trabalho) e o Dia do Engenheiro', ajuste: 'no escritório ou em ateliê parceiro perto da empresa' },
    { id: 'industria', label: 'Indústria / logística', match: /ind[uú]stria|f[aá]brica|log[ií]stica|transport|distribui|manufat/i,
      dor: 'em operação e turnos, o cuidado com a saúde mental quase nunca chega em todo mundo',
      atividade: 'pintura em ecobag ou sabonete artesanal (rápido, para turmas grandes)', data: 'a SIPAT e o Abril Verde', ajuste: 'em turmas rápidas de 1 hora dentro da SIPAT' },
    { id: 'varejo', label: 'Varejo / atendimento', match: /varejo|loja|call ?center|atendimento|e-?commerce|shopping|supermerc/i,
      dor: 'atendimento ao público e datas de pico (Black Friday, Natal) deixam o time no limite',
      atividade: 'velas aromáticas ou kit em casa (cuidado depois do pico)', data: 'o Dia do Cliente e o pós-Black Friday', ajuste: 'logo depois das datas de pico' },
    { id: 'rh', label: 'RH / consultoria', match: /recursos humanos|\brh\b|recrut|consultoria|coworking|escrit[oó]rio/i,
      dor: 'quem cuida das pessoas da empresa raramente tem tempo de planejar o próprio calendário de cuidado',
      atividade: 'cerâmica terapêutica ou roda de conversa com psicóloga', data: 'o Dia do Profissional de RH (3/6) e o Dia Mundial da Saúde Mental', ajuste: 'no formato que couber na agenda de vocês' }
  ];
  var SEG_PADRAO = { id: 'geral', label: 'Geral',
    dor: 'o time está cansado e as ações de sempre (palestra, cartaz, e-mail de campanha) não engajam',
    atividade: 'cerâmica terapêutica ou kintsugi', data: 'o Dia Mundial da Saúde Mental e o Janeiro Branco', ajuste: 'na empresa, no ateliê ou online' };
  function segmentoDe(p) {
    var txt = [p && p.segmento, p && p.tipo_empresa, p && p.nome].join(' ');
    for (var i = 0; i < SEGMENTOS.length; i++) if (SEGMENTOS[i].match.test(txt)) return SEGMENTOS[i];
    return SEG_PADRAO;
  }

  // A promessa central, repetida em todas as mensagens: ninguém da
  // empresa precisa se preocupar com nada.
  var PROMESSA = 'A gente cuida de tudo: nosso time de arteterapeutas monta o cronograma com a quantidade de encontros que vocês quiserem — um evento pontual, um semestre ou o ano inteiro —, leva todo o material, organiza o local e entrega o relatório de cada ação para a NR-1. Se num mês não der pra reunir o time, o encontro pode virar gift cards Elarah pra cada pessoa usar quando quiser. O RH só aprova as datas.';

  // ---------- Mensagens de prospecção ----------
  // Variáveis: {empresa} {contato} {dor} {atividade} {data_seg} {ajuste}
  // {gancho} {data_gancho} {promessa} {assinatura}
  var MENSAGENS = {
    email: [
      { id: 'email-personalizado', angulo: 'Personalizada para o setor (recomendada)', assunto: 'Um ano de cuidado com o time da {empresa} — sem trabalho pro RH',
        corpo:
'Olá, {contato}!\n\n' +
'Sou a Larissa Setzer, arteterapeuta da Elarah Mental Health — depois de mais de 20 anos no mercado corporativo, hoje levo a Arteterapia para dentro das empresas. Escrevo porque {dor}.\n\n' +
'Com a NR-1, os riscos psicossociais passaram a fazer parte do gerenciamento de riscos das empresas — e a pergunta deixou de ser "se" e virou "o que vamos fazer e como vamos registrar".\n\n' +
'Para a {empresa}, eu começaria por um workshop de Arteterapia com {atividade}, aproveitando {data_seg}, {ajuste}. Ninguém precisa saber desenhar: o foco é a pausa, não o resultado.\n\n' +
'{promessa}\n\n' +
'Posso te mandar um cronograma de exemplo montado para a {empresa}? Leva 1 dia e não tem compromisso.\n\n' +
'{assinatura}' },
      { id: 'email-data', angulo: 'Gancho da próxima data forte', assunto: '{gancho} na {empresa}: já tem algo planejado?',
        corpo:
'Oi, {contato}! Tudo bem?\n\n' +
'O {gancho} é dia {data_gancho} — e costuma ser a data em que o RH decide em cima da hora o que fazer.\n\n' +
'Para a {empresa} eu sugiro {atividade}: 2 horas em que o time desliga das telas e cria algo com as mãos. Levamos tudo até vocês, tiramos fotos e entregamos o relatório da ação.\n\n' +
'E se fizer sentido depois, transformamos isso num cronograma (semestral ou anual) com a quantidade de encontros que vocês preferirem — sem vocês precisarem se preocupar com nada.\n\n' +
'Te mando 3 opções com valores até amanhã?\n\n' +
'{assinatura}' },
      { id: 'email-followup', angulo: 'Follow-up (3 dias depois)', assunto: 'Re: cronograma de saúde mental da {empresa}',
        corpo:
'Oi, {contato}! Passando rapidinho aqui.\n\n' +
'Sei que a agenda do RH é corrida, então resumi em uma linha: você escolhe quantos encontros quer no ano, a gente monta o cronograma, executa tudo e entrega o relatório para a NR-1.\n\n' +
'Faz sentido eu te mandar o modelo pronto para a {empresa}? É só responder "sim".\n\n' +
'{assinatura}' },
      { id: 'email-gift', angulo: 'Gift cards para datas de presentear', assunto: 'Presente que o time da {empresa} não esquece',
        corpo:
'Olá, {contato}!\n\n' +
'Dia da Secretária, Dia do Cliente, Dia das Mães, fim de ano… essas datas costumam virar cesta ou brinde que ninguém lembra na semana seguinte.\n\n' +
'Com os gift cards Elarah, cada pessoa escolhe a experiência que quer viver — cerâmica, pintura, perfumaria, drinks — em São Paulo ou com kit em casa. É reconhecimento e cuidado com a saúde mental ao mesmo tempo.\n\n' +
'Posso montar o calendário de presentes do ano da {empresa}, com valores por faixa? Vocês só escolhem as datas.\n\n' +
'{assinatura}' }
    ],
    linkedin: [
      { id: 'li-convite', angulo: 'Convite de conexão (até 300 caracteres)',
        corpo: 'Oi, {contato}! Sou a Larissa, arteterapeuta da Elarah Mental Health. Levamos workshops de Arteterapia para empresas (saúde mental / NR-1) e cuidamos de todo o cronograma. Adoraria trocar ideias sobre o time da {empresa}!' },
      { id: 'li-followup', angulo: 'Depois que aceitar',
        corpo:
'Obrigada por aceitar, {contato}! 💚\n\n' +
'Vou direto ao ponto: {dor}.\n\n' +
'A gente monta o cronograma de saúde mental da empresa — 1 evento pontual, um semestre ou o ano todo, com quantos encontros vocês quiserem — e executa tudo. Para a {empresa}, começaria com {atividade}.\n\n' +
'Posso te mandar um modelo pronto? Sem compromisso.' },
      { id: 'li-data', angulo: 'Gancho de data',
        corpo: '{contato}, o {gancho} ({data_gancho}) está chegando. Já tem algo planejado na {empresa}? Tenho uma ideia de 2 horas que o time adora — e a gente cuida de tudo, do material ao relatório pra NR-1. Te mando?' }
    ],
    whatsapp: [
      { id: 'wa-primeiro', angulo: 'Primeiro contato',
        corpo:
'Olá! Aqui é a Larissa, da Elarah Mental Health 💚\n\n' +
'A gente monta e executa o cronograma de saúde mental das empresas — pontual, semestral ou anual — com workshops de Arteterapia (pintura, argila, colagem, kintsugi) conduzidos por arteterapeutas, e o relatório pronto para a NR-1. O RH não precisa se preocupar com nada.\n\n' +
'Com quem da {empresa} eu falo sobre ações para o time? (RH, Gente & Cultura ou SESMT)' },
      { id: 'wa-contato', angulo: 'Quando já tem o nome do RH',
        corpo: 'Oi, {contato}! Aqui é a Larissa, da Elarah Mental Health 💚 Pensei na {empresa} porque {dor}. A gente monta o cronograma do ano com a quantidade de encontros que vocês quiserem e cuida de tudo. Posso te mandar um modelo em PDF?' },
      { id: 'wa-data', angulo: 'Data próxima',
        corpo: 'Oi, {contato}! O {gancho} é dia {data_gancho} 🗓️ Já tem algo para o time da {empresa}? Organizo uma experiência de 2 horas ({atividade}) na empresa ou no ateliê, com tudo incluso. Te mando as opções?' }
    ],
    ligacao: [
      { id: 'call-roteiro', angulo: 'Roteiro de ligação (60 segundos)',
        corpo:
'1) ABERTURA — "Oi, aqui é a Larissa, da Elarah Mental Health. Você cuida da parte de pessoas ou benefícios da {empresa}?"\n' +
'   (Se não: "Quem seria a melhor pessoa? Pode me passar o e-mail dela?")\n\n' +
'2) GANCHO — "Estou ligando porque {dor}. E com a NR-1 as empresas precisam mostrar ações sobre riscos psicossociais."\n\n' +
'3) VALOR — "A gente monta o cronograma — com quantos encontros vocês quiserem, pontual, semestral ou anual —, executa tudo e entrega o relatório de cada ação. O RH só aprova as datas."\n\n' +
'4) PERGUNTA — "Vocês já têm algo planejado para o {gancho}?"\n\n' +
'5) FECHAMENTO — "Posso te mandar hoje um cronograma de exemplo montado para a {empresa} e a gente conversa 15 minutos na semana que vem? Qual o melhor e-mail?"\n\n' +
'OBJEÇÕES:\n' +
'• "Já temos psicólogo / EAP" → "Ótimo! A gente complementa: o EAP atende quem já pediu ajuda; as experiências chegam em todo mundo, antes."\n' +
'• "Sem orçamento" → "Dá pra começar com 1 encontro numa data forte, ou com gift cards no valor que couber."\n' +
'• "Não tenho tempo pra organizar" → "Esse é justamente o ponto: a gente organiza tudo. Você só aprova."\n' +
'• "Manda por e-mail" → "Mando agora. Pra personalizar: quantas pessoas são no time?"' }
    ]
  };

  // ---------- Cronogramas-modelo ----------
  // Prontos pra usar: escolhe o modelo, põe o nome da empresa, pronto.
  // meses = quais meses do programa entram (1-12).
  var MODELOS = [
    { id: 'pontual', nome: 'Pontual — 1 encontro', plano: 'pontual', encontros: 1, meses: [10],
      desc: 'Uma ação numa data forte (ex.: Dia Mundial da Saúde Mental). Porta de entrada ideal pra fechar rápido.' },
    { id: 'trimestral', nome: 'Essencial — 4 encontros no ano', plano: 'anual', encontros: 4, meses: [1, 4, 9, 10],
      desc: 'Os 4 meses-chave: Janeiro Branco, Abril Verde (lideranças), Setembro Amarelo e 10/10.' },
    { id: 'semestral', nome: 'Semestral — 6 encontros', plano: 'semestral', encontros: 6, meses: null,
      desc: 'Um encontro por mês durante 6 meses, a partir do mês que a empresa escolher.' },
    { id: 'anual', nome: 'Anual — 12 meses de cuidado', plano: 'anual', encontros: 12, meses: null,
      desc: 'O programa completo, com reforços nos meses-chave e datas de presentear com gift card.' }
  ];
  // Ordem de prioridade dos meses quando a empresa quer menos de 12 encontros.
  var PRIORIDADE_MESES = [10, 9, 1, 4, 12, 3, 5, 6, 8, 11, 7, 2];

  // ---------- Rotina de uma pessoa só ----------
  // Pensada pra Larissa tocar sozinha: ~4 a 5 horas de trabalho comercial
  // e de conteúdo por dia, o resto livre pra executar os eventos.
  // go = aba do painel que resolve a tarefa.
  var ROTINA = {
    1: { nome: 'Segunda — planejar e abrir a semana', itens: [
      { h: '09:00', min: 20, t: '☕ Planejar a semana', d: 'Abra a Visão geral: eventos da semana, orçamentos parados e a próxima data forte. Escolha 3 prioridades.', go: 'visao' },
      { h: '09:20', min: 30, t: '🔎 Revisar as empresas novas da semana', d: 'O agente trouxe ~100 empresas. Marque as 20 com mais cara de fechar (porte, setor com dor forte).', go: 'prosp' },
      { h: '10:00', min: 60, t: '✉️ 20 e-mails personalizados', d: 'Use a mensagem “Personalizada para o setor”. Abra no Gmail, confira o nome e envie.', go: 'prosp' },
      { h: '11:00', min: 20, t: '💼 Post no LinkedIn', d: 'Post educativo sobre NR-1 ou saúde mental (tem pronto na aba Captação). Responda os comentários até o fim do dia.', go: 'captacao' },
      { h: '14:00', min: 30, t: '↩️ Follow-ups do dia', d: 'Quem recebeu mensagem há 3 dias e não respondeu.', go: 'prosp' }
    ] },
    2: { nome: 'Terça — LinkedIn e ligações', itens: [
      { h: '09:00', min: 45, t: 'in 20 convites no LinkedIn', d: 'Use “Achar o RH” em cada empresa e mande o convite curto (até 300 caracteres).', go: 'prosp' },
      { h: '10:00', min: 60, t: '📞 10 ligações para RH', d: 'Roteiro de 60 segundos na aba Prospecção → Ligação. Objetivo: conseguir o e-mail e um “pode mandar”.', go: 'prosp' },
      { h: '11:15', min: 15, t: '📸 Story no Instagram', d: 'Bastidor: separando material de um evento, argila, peças secando, a mesa montada.', go: 'captacao' },
      { h: '14:00', min: 30, t: '↩️ Follow-ups + respostas', d: 'Responda quem aceitou convite no LinkedIn com a mensagem “Depois que aceitar”.', go: 'prosp' }
    ] },
    3: { nome: 'Quarta — conteúdo e propostas', itens: [
      { h: '09:00', min: 30, t: '📷 Post no Instagram (foto)', d: 'Foto real de mãos na argila, peça de kintsugi ou equipe criando. Legenda curta + convite para o RH chamar no WhatsApp.', go: 'captacao' },
      { h: '09:30', min: 60, t: '✉️ 20 abordagens (e-mail ou WhatsApp)', d: 'Priorize os setores com a data forte mais próxima.', go: 'prosp' },
      { h: '10:45', min: 45, t: '🧭 Montar cronogramas e propostas', d: 'Para quem pediu: gere o cronograma, imprima em PDF e envie no mesmo dia.', go: 'cronograma' },
      { h: '14:00', min: 20, t: '📥 Pedidos do site', d: 'Responda todo pedido em até 2 horas. Lead do site é o mais quente.', go: 'leads' }
    ] },
    4: { nome: 'Quinta — reuniões e relacionamento', itens: [
      { h: '09:00', min: 60, t: '📞 10 ligações + 10 WhatsApps', d: 'Empresas que abriram e-mail/aceitaram convite mas não responderam.', go: 'prosp' },
      { h: '10:00', min: 60, t: '🤝 Reuniões e apresentações', d: 'Deixe as quintas pra reuniões de 15–20 minutos com RHs.', go: 'eventos' },
      { h: '11:00', min: 20, t: '💼 Convite pro Café com RHs', d: 'Convide 5 RHs da lista pro próximo encontro no ateliê (1h de cerâmica + conversa).', go: 'captacao' },
      { h: '14:00', min: 30, t: '📈 Check-in com clientes', d: 'Mensagem pro RH de cada cliente: “como o time está essa semana?” e registre.', go: 'acomp' }
    ] },
    5: { nome: 'Sexta — fechar a semana', itens: [
      { h: '09:00', min: 45, t: '↩️ Follow-ups de propostas', d: 'Toda proposta enviada na semana recebe um “alguma dúvida?” hoje.', go: 'eventos' },
      { h: '10:00', min: 30, t: '🎥 Case ou depoimento', d: 'Depois de um evento, poste fotos + 1 frase do RH (com autorização). Sem evento na semana? Poste bastidor.', go: 'captacao' },
      { h: '10:30', min: 20, t: '📊 Placar da semana', d: 'Abra Acompanhamento semanal e veja abordagens, respostas, reuniões e propostas. O que funcionou mais?', go: 'acomp' },
      { h: '11:00', min: 30, t: '🗓️ Planejar conteúdo da próxima semana', d: 'Escolha o post de LinkedIn, a foto do Instagram e o gancho de data da semana que vem.', go: 'datas' }
    ] }
  };
  // Tarefas que aparecem em semanas específicas do mês.
  var ROTINA_MES = [
    { semana: 1, dia: 1, t: '🎁 Disparar a data forte do mês', d: 'Mande o pitch da próxima data forte para clientes e prospects quentes (aba Datas para o RH).', go: 'datas', min: 30 },
    { semana: 2, dia: 2, t: '🎙️ Preparar o webinar/live do mês', d: '“NR-1 na prática para RH” — 40 min com uma psicóloga parceira. Divulgue no LinkedIn.', go: 'captacao', min: 45 },
    { semana: 3, dia: 4, t: '☕ Café com RHs', d: 'Encontro no ateliê com 10–15 RHs: 1h de cerâmica + conversa. Quem vive a experiência vende pra diretoria.', go: 'captacao', min: 120 },
    { semana: 4, dia: 5, t: '📈 Fechamento do mês', d: 'Some leads, reuniões, propostas e fechamentos do mês. Ajuste a meta do próximo.', go: 'acomp', min: 30 }
  ];

  // Ideias de foto/post pro Instagram (gira por dia).
  var IDEIAS_FOTO = [
    'Close das mãos modelando argila — legenda: “2 horas sem tela. Seu time merece.”',
    'Peça de kintsugi com o dourado brilhando — legenda sobre recomeço e Setembro Amarelo.',
    'Mesa montada antes do evento (argila, aventais, flores) — “Tudo pronto: o RH só aprovou a data.”',
    'Terrários prontos enfileirados — “Cada pessoa levou um pedacinho de calma pra mesa de trabalho.”',
    'Carrossel: “5 datas que todo RH devia ter no calendário”.',
    'Vídeo de 10s do forno/peças secando — bastidor gera curiosidade.',
    'Foto do time rindo durante a atividade (com autorização) — prova social vale ouro.',
    'Print do cronograma anual (sem nome do cliente) — “É assim que a gente organiza o ano de uma empresa.”'
  ];

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
    { canal: 'LinkedIn', titulo: 'Kintsugi e o seu time',
      texto:
'No Japão, quando uma cerâmica quebra, ela não vai pro lixo.\n\n' +
'Ela é consertada com ouro. As rachaduras viram a parte mais bonita da peça. Isso se chama kintsugi.\n\n' +
'É isso que a gente faz nas empresas: 2 horas em que o time desliga das telas, conserta uma peça com as próprias mãos e conversa sobre pressão, cansaço e recomeço — sem cara de palestra.\n\n' +
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
    SEGMENTOS: SEGMENTOS,
    segmentoDe: segmentoDe,
    PROMESSA: PROMESSA,
    MODELOS: MODELOS,
    PRIORIDADE_MESES: PRIORIDADE_MESES,
    ROTINA: ROTINA,
    ROTINA_MES: ROTINA_MES,
    IDEIAS_FOTO: IDEIAS_FOTO,
    atividade: function (id) {
      for (var i = 0; i < ATIVIDADES.length; i++) if (ATIVIDADES[i].id === id) return ATIVIDADES[i];
      return null;
    }
  };
})();
