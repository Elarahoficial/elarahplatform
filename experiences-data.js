/* =============================================
   ELARAH EXPERIENCES DATA (Supabase + fallback)
   - Lê de public.experiences quando Supabase estiver
     disponível e a tabela tiver dados.
   - Caso contrário usa FALLBACK_SEEDS embutido, para
     que o site funcione mesmo sem o banco configurado.
   - Mutações (add/update/delete) só funcionam com
     Supabase ativo.
   ============================================= */

(function (window) {
  'use strict';

  const TABLE = 'experiences';
  let cache = null;
  let cachePromise = null;

  // Set de colunas conhecidamente existentes na tabela. Detectado na
  // primeira leitura do banco (a partir das keys da primeira linha) e
  // ampliado dinamicamente pelos retries de write. Qualquer coluna que
  // não estiver aqui é omitida dos writes pra não quebrar com
  // "column X not found in schema cache" quando alguma migration
  // (extensions.sql, visibility.sql, etc) ainda não rodou.
  //   null = ainda não sabemos → mandamos tudo e deixamos o retry
  //          corrigir o que estiver faltando.
  //   Set  = sabemos, filtra só as colunas presentes.
  let knownColumns = null;

  // Colunas que SEMPRE devem ir num write (base schema mínimo). O
  // resto só entra se estiver em knownColumns (ou ainda for null).
  const CORE_COLUMNS = new Set([
    'nome', 'categoria', 'data', 'duracao', 'bairro', 'endereco',
    'inclui', 'preco', 'cor', 'imagem', 'descricao', 'horario',
    'horarios'
  ]);
  // Colunas opcionais — só vão pro write quando sabemos (ou não sabemos
  // ainda) que existem. Cada uma depende de uma migration:
  //   vagas_total / vagas_restantes / event_at / cutoff_hours
  //     → sql/elarah_extensions.sql
  //   is_active
  //     → sql/elarah_experiences_visibility.sql
  const OPTIONAL_COLUMNS = new Set([
    'vagas_total', 'event_at', 'cutoff_hours', 'is_active',
    'fornecedor_nome', 'valor_cheio_centavos', 'percentual_repasse'
  ]);

  // ---------- FALLBACK SEEDS (usados quando o banco está
  // indisponível ou vazio). Mesmas 34 experiências da base. ----------
  const FALLBACK_SEEDS = [
    { id:"seed_022", nome:"Vela (Cerveja & Caipirinha)", categoria:"Vela", data:"12/04", duracao:"1h30", bairro:"Brooklin", endereco:"Rua Nova York, 345 – São Paulo", inclui:"Coffee break + petisco + cerveja", preco:"R$180", cor:"#f6e6a8,#e0c05e", imagem:"assets/experiences/vela-cerveja.jpg", descricao:"", horario:"10h30 – 12h00", horarios:["10h30 – 12h00"] },
    { id:"seed_023", nome:"Pintura em Cerâmica", categoria:"Pintura", data:"12/04", duracao:"3h", bairro:"Pinheiros", endereco:"Rua Capote Valente, 697 – São Paulo", inclui:"Materiais inclusos", preco:"R$360", cor:"#f9d1d1,#e07a7a", imagem:"assets/experiences/pintura-ceramica.jpg", descricao:"", horario:"15h00 – 18h00", horarios:["15h00 – 18h00"] },
    { id:"seed_024", nome:"Aula de Tufting (Seg)", categoria:"Tufting", data:"Semanal", duracao:"2h", bairro:"Itaim", endereco:"Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui:"Experiência completa", preco:"R$162", cor:"#c5d4e7,#6991b3", imagem:"assets/experiences/tufting.jpg", descricao:"Tufting: crie sua própria peça decorativa do zero\n\nUma experiência manual, criativa e super relaxante pra quem quer aprender uma técnica nova e sair com uma peça feita pelas próprias mãos.\n\nNesta aula, você descobre o tufting — técnica de criação de tapetes e peças decorativas usando uma pistola especial — e aprende, passo a passo, a transformar um desenho em um tapete ou quadro de fios. Desde escolher cores e montar o design até finalizar os acabamentos.\n\nConteúdo da experiência:\nIntrodução ao tufting: materiais, pistola e segurança\nEscolha de desenho e paleta de cores\nTécnica de aplicação: tufting loop e cut pile\nFinalização: corte, acabamento e colagem\n\nVocê vai aprender:\nComo usar a pistola de tufting com confiança\nComposição de cores e texturas\nDicas pra continuar criando em casa\n\nPerfeito pra quem quer desligar do digital e viver um momento criativo de verdade, saindo com uma peça única e cheia de personalidade.", horario:"19h00 – 21h00", horarios:["19h00 – 21h00"] },
    { id:"seed_025", nome:"Aula de Tufting (Seg)", categoria:"Tufting", data:"Semanal", duracao:"3h", bairro:"Itaim", endereco:"Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui:"Experiência completa", preco:"R$243", cor:"#c5d4e7,#6991b3", imagem:"assets/tufting1.jpg", descricao:"Tufting estendido: 3h pra criar uma peça maior e mais elaborada\n\nVersão estendida da nossa aula de tufting. Com 3 horas, você tem tempo pra explorar a técnica com calma e produzir uma peça de tamanho maior ou com desenho mais complexo.\n\nIdeal pra quem já curtiu a ideia e quer se dedicar num projeto mais ambicioso, ou pra quem prefere um ritmo mais relaxado com pausas pra conversar e ver o trabalho ganhar forma.\n\nConteúdo:\nIntrodução completa ao tufting\nDesenho personalizado e escolha de cores\nExecução com acompanhamento individual\nFinalização e acabamento profissional\n\nVocê sai com uma peça maior, mais trabalhada e pronta pra decorar a sua casa ou presentear alguém especial.", horario:"09h00 – 12h00", horarios:["09h00 – 12h00"] },
    { id:"seed_026", nome:"Aula de Tufting (Ter/Qui/Sex)", categoria:"Tufting", data:"Semanal", duracao:"2h", bairro:"Itaim", endereco:"Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui:"Experiência completa", preco:"R$162", cor:"#c5d4e7,#6991b3", imagem:"assets/tufting2.jpg", descricao:"Tufting: crie sua própria peça decorativa do zero\n\nUma experiência manual, criativa e super relaxante pra quem quer aprender uma técnica nova e sair com uma peça feita pelas próprias mãos.\n\nNesta aula, você descobre o tufting — técnica de criação de tapetes e peças decorativas usando uma pistola especial — e aprende, passo a passo, a transformar um desenho em um tapete ou quadro de fios.\n\nConteúdo da experiência:\nIntrodução ao tufting: materiais, pistola e segurança\nEscolha de desenho e paleta de cores\nTécnica de aplicação: tufting loop e cut pile\nFinalização: corte, acabamento e colagem\n\nVocê vai aprender:\nComo usar a pistola de tufting com confiança\nComposição de cores e texturas\nDicas pra continuar criando em casa\n\nPerfeito pra quem quer desligar do digital e viver um momento criativo de verdade.", horario:"17h15 – 19h15", horarios:["17h15 – 19h15"] },
    { id:"seed_027", nome:"Aula de Tufting (Ter/Qui/Sex)", categoria:"Tufting", data:"Semanal", duracao:"2h", bairro:"Itaim", endereco:"Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui:"Experiência completa", preco:"R$162", cor:"#c5d4e7,#6991b3", imagem:"assets/tufting3.jpg", descricao:"Tufting: crie sua própria peça decorativa do zero\n\nUma experiência manual, criativa e super relaxante pra quem quer aprender uma técnica nova e sair com uma peça feita pelas próprias mãos.\n\nNesta aula, você descobre o tufting — técnica de criação de tapetes e peças decorativas usando uma pistola especial — e aprende, passo a passo, a transformar um desenho em um tapete ou quadro de fios.\n\nConteúdo da experiência:\nIntrodução ao tufting: materiais, pistola e segurança\nEscolha de desenho e paleta de cores\nTécnica de aplicação: tufting loop e cut pile\nFinalização: corte, acabamento e colagem\n\nPerfeito pra quem quer viver uma experiência offline de verdade e sair com algo feito pelas próprias mãos.", horario:"19h30 – 21h30", horarios:["19h30 – 21h30"] },
    { id:"seed_028", nome:"Aula de Tufting (Ter/Qui/Sex)", categoria:"Tufting", data:"Semanal", duracao:"3h", bairro:"Itaim", endereco:"Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui:"Experiência completa", preco:"R$243", cor:"#c5d4e7,#6991b3", imagem:"assets/tufting4.jpg", descricao:"Tufting estendido: 3h pra criar uma peça maior\n\nVersão estendida da nossa aula de tufting. Com 3 horas, você tem tempo pra explorar a técnica com calma e produzir uma peça de tamanho maior ou com desenho mais complexo.\n\nIdeal pra quem já curtiu a ideia e quer se dedicar num projeto mais ambicioso, ou pra quem prefere um ritmo mais relaxado com pausas pra conversar e ver o trabalho ganhar forma.\n\nConteúdo:\nIntrodução completa ao tufting\nDesenho personalizado e escolha de cores\nExecução com acompanhamento individual\nFinalização e acabamento profissional\n\nVocê sai com uma peça maior, mais trabalhada e pronta pra decorar sua casa.", horario:"09h00 – 12h00", horarios:["09h00 – 12h00"] },
    { id:"seed_029", nome:"Aula de Tufting (Ter/Qui/Sex)", categoria:"Tufting", data:"Semanal", duracao:"3h", bairro:"Itaim", endereco:"Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui:"Experiência completa", preco:"R$243", cor:"#c5d4e7,#6991b3", imagem:"assets/tufting5.jpg", descricao:"Tufting estendido: 3h pra criar uma peça maior\n\nVersão estendida da nossa aula de tufting. Com 3 horas, você tem tempo pra explorar a técnica com calma e produzir uma peça de tamanho maior ou com desenho mais complexo.\n\nIdeal pra quem já curtiu a ideia e quer se dedicar num projeto mais ambicioso, ou pra quem prefere um ritmo mais relaxado.\n\nConteúdo:\nIntrodução completa ao tufting\nDesenho personalizado e escolha de cores\nExecução com acompanhamento individual\nFinalização e acabamento profissional", horario:"14h00 – 17h00", horarios:["14h00 – 17h00"] },
    { id:"exp_1775835623993_b1di8r", nome:"Oficina de Bolsa de Crochê", categoria:"Macramê", data:"25/04", duracao:"3h30", bairro:"Brooklin", endereco:"Rua Nova York, 345", inclui:"Todo material incluso", preco:"R$144", cor:"#f6d5a8,#f0a05e", imagem:"assets/croche.jpg", descricao:"Aprenda a criar sua própria bolsa de crochê do zero em uma experiência prática, criativa e super relaxante!\n\nNesta aula, você vai descobrir os fundamentos do crochê, desde os pontos básicos até a construção completa da peça, com acompanhamento passo a passo, mesmo que nunca tenha feito nada antes. Ao longo do workshop, você escolhe cores, aprende técnicas de acabamento e vê sua bolsa ganhar forma nas suas mãos.\n\nMais do que uma aula, é um momento para desacelerar, se desconectar do digital e criar algo único, feito por você.\n\nVocê sai com:\n– Sua própria bolsa de crochê (em produção ou finalizada)\n– Conhecimento para continuar criando depois\n– Um momento leve, criativo e diferente do óbvio\n\nPerfeito para quem quer aprender algo novo, explorar a criatividade ou simplesmente viver uma experiência offline de verdade.", horario:"10h30 - 14h00", horarios:["10h30 - 14h00"] },
    { id:"exp_1775836324375_k01u01", nome:"Cerâmica em Torno", categoria:"Cerâmica", data:"15/04", duracao:"1h30", bairro:"Pinheiros", endereco:"Rua Capote Valente, 697", inclui:"Todo material incluso", preco:"R$248", cor:"#f6d5a8,#f0a05e", imagem:"assets/torno.jpg", descricao:"Descubra a sensação única de criar com as próprias mãos no seu primeiro contato com o torno de cerâmica!\n\nNesta experiência, você vai aprender os fundamentos do torno: desde a centralização da argila até a modelagem das primeiras peças, com orientação passo a passo, mesmo sem nenhuma experiência prévia. É aquele momento em que tudo desacelera e você entra no ritmo do giro, da matéria e da criação.\n\nAqui, o processo é tão especial quanto o resultado: sentir a argila tomando forma entre as mãos, testar, errar, tentar de novo… e se surpreender com o que é capaz de criar.\n\nVocê vai:\n– Aprender a usar o torno desde o zero\n– Criar suas primeiras peças em cerâmica\n– Entender o básico de modelagem e acabamento\n\nUma experiência perfeita para sair do automático, se desconectar do barulho lá fora e viver algo completamente novo: com as mãos na argila e a mente leve.", horario:"19h30 - 21h00", horarios:["19h30 - 21h00"] },
    { id:"exp_1775836484792_e0yojh", nome:"Cerâmica em Torno", categoria:"Cerâmica", data:"18/04", duracao:"1h30", bairro:"Pinheiros", endereco:"Rua Capote Valente, 697", inclui:"Todo material incluso", preco:"R$248", cor:"#f6d5a8,#f0a05e", imagem:"assets/torno2.jpg", descricao:"Descubra a sensação única de criar com as próprias mãos no seu primeiro contato com o torno de cerâmica!\n\nNesta experiência, você vai aprender os fundamentos do torno: desde a centralização da argila até a modelagem das primeiras peças, com orientação passo a passo, mesmo sem nenhuma experiência prévia. É aquele momento em que tudo desacelera e você entra no ritmo do giro, da matéria e da criação.\n\nAqui, o processo é tão especial quanto o resultado: sentir a argila tomando forma entre as mãos, testar, errar, tentar de novo… e se surpreender com o que é capaz de criar.\n\nVocê vai:\n– Aprender a usar o torno desde o zero\n– Criar suas primeiras peças em cerâmica\n– Entender o básico de modelagem e acabamento\n\nUma experiência perfeita para sair do automático, se desconectar do barulho lá fora e viver algo completamente novo: com as mãos na argila e a mente leve.", horario:"10h00 - 11h30", horarios:["10h00 - 11h30"] },
    { id:"exp_1775837282192_tiwq34", nome:"Risotos da Terra", categoria:"Gastronomia", data:"22/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/risoto.jpg", descricao:"O curso de risoto da terra é indicado para pessoas com qualquer nível de conhecimento. São preparos fáceis e deliciosos que você vai poder reproduzir muitas vezes em sua casa!\n\nTurmas reduzidas então garanta sua vaga! \n\nConteúdo Programático\n- Risoto Milanês\n- Risoto Funghi\n- Risoto Toscana ao Tinto (Vegetarianos podem solicitar linguiça vegetariana. Gentileza solicitar ao receber e-mail de confirmação da compra)\n- Risoto de Pera com Gorgonzola\n\nO risoto perfeito é aquele cremoso, com o grão firme e com sabores e aromas naturais. Nesta aula você vai aprender como deixá-lo assim... irresistível!\n\nMuitas dicas, ingredientes de excelente qualidade, ótimas receitas e ambiente descontraído fazem parte de todos os cursos da Receitaria!", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775837970557_gk0lgm", nome:"Pão de Mel Artesanal", categoria:"Gastronomia", data:"27/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/paomel.jpg", descricao:"Uma experiência para colocar a mão na massa e sair com cheirinho de casa feliz.\n\nNesta aula, você aprende a fazer pão de mel do zero: da massa fofinha ao recheio cremoso e a cobertura perfeita de chocolate. Tudo com passo a passo guiado, dicas práticas e aquele toque especial que transforma uma receita simples em algo memorável.\n\nAo longo do workshop, você vai montar suas próprias unidades, testar combinações de recheios e entender os segredos do ponto ideal, daqueles que fazem diferença de verdade.\n\nConteúdo Programático:\n– Pão de mel tradicional\n– Massa de pão de mel vegana\n– Recheios variados\n– Cobertura de chocolate e finalização\n– Embalagens (como apresentar e valorizar o produto)\n\nVocê vai:\n– Preparar a massa do pão de mel desde o início\n– Aprender recheios e técnicas de montagem\n– Finalizar com cobertura de chocolate e acabamento\n\nE claro, levar suas criações (ou pelo menos parte delas) pra casa.\n\nPerfeito para quem ama doce, quer aprender algo novo ou simplesmente viver um momento leve, criativo e delicioso: longe do celular e perto do que importa.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775838280335_92a2m4", nome:"Nhoques Artesanais", categoria:"Gastronomia", data:"14/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/nhoque.jpg", descricao:"Nhoque Perfeito: do Zero ao Prato!\n\nUma experiência para quem ama cozinhar (ou quer começar) e quer aprender de verdade com técnica, prática e muito sabor.\n\nNeste workshop, você mergulha na arte dos nhoques artesanais e aprende, com chefs, as técnicas tradicionais para chegar na textura perfeita: leve, macia e no ponto certo. Ao longo da aula, você prepara três tipos de massa e descobre como combiná-las com molhos irresistíveis que elevam qualquer prato.\n\nMais do que seguir receita, aqui você entende o porquê de cada etapa e sai com segurança para reproduzir em casa.\n\nConteúdo da experiência:\nMassa de batata tradicional firme para rechear: preparo de nhoques clássicos, leves e estruturados, recheados com muçarela, envolvidos em molho branco e finalizados gratinados\nNhoques de abóbora: versão aromática e levemente adocicada, combinada com molho de gorgonzola que realça o sabor\nNhoques de mandioquinha: massa intensa e delicada, acompanhada de molho de manteiga e ervas, simples e sofisticado ao mesmo tempo\n\nVocê vai aprender:\nTécnicas essenciais de preparo de massas artesanais\nComo chegar no ponto ideal de cada tipo de nhoque\nComo combinar sabores e montar pratos completos\n\nPerfeito para quem quer sair do básico, se surpreender na cozinha e viver uma experiência gastronômica criativa, prática e muito gostosa.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775838780657_bmmhlx", nome:"Lasanha Artesanal", categoria:"Gastronomia", data:"16/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/lasanha.jpg", descricao:"Uma experiência pensada para quem quer ir além do básico e transformar o preparo da lasanha em algo realmente especial.\n\nNeste curso, você aprende com chefs experientes a preparar massas artesanais do zero e a combinar ingredientes de forma criativa, entendendo técnicas que fazem toda a diferença no resultado final. Ao longo da aula, você desenvolve três versões diferentes, explorando sabores clássicos e releituras surpreendentes.\n\nMais do que seguir receitas, aqui você aprende os fundamentos para criar lasanhas com textura, equilíbrio e sabor marcante.\n\nConteúdo da experiência:\nLasanha tradicional à bolonhesa: preparo da clássica lasanha com massa caseira, camadas de molho à bolonhesa, queijo e bechamel, resultando em um prato rico e reconfortante\nLasanha vegetariana de abobrinha: versão leve e cheia de sabor, com camadas de abobrinha, queijo e molho branco com espinafre\nLasanha de carne seca: combinação intensa com um toque nordestino, trazendo personalidade e profundidade ao prato\n\nVocê vai aprender:\nComo preparar massa artesanal para lasanha\nTécnicas de montagem e equilíbrio de camadas\nCombinações de ingredientes para diferentes perfis de sabor\n\nPerfeito para quem quer evoluir na cozinha, impressionar em um almoço ou jantar e dominar uma das receitas mais amadas de forma criativa e bem executada.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775839134139_dpsvm7", nome:"Massa Artesanal sem Glúten", categoria:"Gastronomia", data:"28/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/massasemgluten.jpg", descricao:"Massas sem Glúten: técnica, sabor e liberdade na cozinha\n\nUma experiência para quem quer explorar novas formas de cozinhar sem abrir mão de textura, sabor e qualidade.\n\nNeste curso, você aprende com chefs como preparar massas artesanais sem glúten, entendendo na prática como substituir ingredientes tradicionais e ainda assim alcançar resultados surpreendentes. Ao longo da aula, você desenvolve diferentes tipos de massas e descobre os segredos por trás de uma boa estrutura, mesmo sem o uso de farinha de trigo.\n\nMais do que adaptar receitas, aqui você aprende a construir uma base sólida para criar pratos inclusivos e cheios de sabor.\n\nConteúdo da experiência:\nNhoque sem glúten: preparo de uma versão macia e equilibrada, com técnicas para atingir a textura ideal utilizando ingredientes alternativos\nFettuccine sem glúten: desenvolvimento de uma massa fresca com excelente estrutura e sabor, mesmo sem o glúten\nRavióli livre de glúten: criação de massas recheadas com combinações criativas e técnicas para montagem e fechamento perfeitos\nTécnicas de substituição de ingredientes: compreensão dos principais ingredientes alternativos e como utilizá-los para manter qualidade e autenticidade\n\nVocê vai aprender:\nComo estruturar massas sem glúten com boa textura\nQuais ingredientes utilizar e como combiná-los\nTécnicas para preparar diferentes formatos de massas\n\nPerfeito para quem busca uma alimentação sem glúten, quer ampliar repertório na cozinha ou simplesmente aprender algo novo de forma prática e criativa.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775839303759_355klf", nome:"Oficina de Croissant", categoria:"Gastronomia", data:"30/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/croissant.jpg", descricao:"Croissant Perfeito: a arte da massa folhada\n\nUma experiência para quem quer se aventurar na confeitaria e aprender, na prática, uma das técnicas mais desejadas da cozinha.\n\nNesta aula, o chef premiado Edgar Rodrigues compartilha todos os segredos para preparar uma massa folhada perfeita e transformar esse processo em croissants leves, aerados e cheios de sabor. Ao longo do workshop, cada participante coloca a mão na massa e desenvolve suas próprias produções do início ao fim.\n\nAlém do clássico croissant, você também explora outras variações irresistíveis, aprendendo técnicas que podem ser replicadas em diferentes preparos.\n\nConteúdo da experiência:\nMassa folhada: fundamentos e técnica para criar camadas leves e bem estruturadas\nCroissant: preparo completo, do início à finalização\nPain au chocolat: versão recheada com chocolate, clássica e deliciosa\nDanish: massa folhada com diferentes combinações e recheios\nCreme patissiere: base essencial da confeitaria para recheios\nOutros preparos folhados: variações e possibilidades a partir da mesma técnica\n\nVocê vai aprender:\nTécnicas de preparo e manuseio da massa folhada\nComo atingir textura, leveza e camadas perfeitas\nDicas práticas de um chef experiente para melhorar seus resultados\n\nUma aula completa, com ingredientes de excelente qualidade, receitas bem estruturadas e um ambiente leve e descontraído, perfeita para quem quer aprender, se desafiar e sair com criações feitas por você.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775839570474_dcya5g", nome:"Bem Casado & Bem Nascido", categoria:"Gastronomia", data:"24/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/bemcasado.jpg", descricao:"Bem-casados e Bem-nascidos: do preparo à apresentação\n\nUma experiência deliciosa para quem quer aprender a fazer doces clássicos com acabamento profissional e sabor inesquecível.\n\nNesta aula, você vai preparar bem-casados e bem-nascidos do zero, aprendendo duas técnicas de massa e todos os detalhes que fazem diferença no resultado final. Do ponto da massa à montagem e finalização, cada etapa é explicada de forma prática para que você consiga reproduzir depois com segurança.\n\nAlém do preparo, você também descobre como apresentar e embalar seus doces de forma encantadora, seja para vender, presentear ou surpreender em casa.\n\nConteúdo da experiência:\nMassa pingada: técnica para criar unidades leves e delicadas\nMassa cortada: preparo estruturado para formatos mais uniformes\nRecheios: combinações clássicas e saborosas\nCalda: finalização que garante textura e sabor característicos\nEmbalagens: formas de apresentação que valorizam o produto\n\nVocê vai aprender:\nComo acertar o ponto de diferentes massas\nTécnicas de montagem e acabamento\nDicas para produzir, apresentar e até comercializar\n\nPerfeito para quem ama confeitaria, quer criar doces especiais ou transformar uma receita clássica em algo ainda mais bonito e profissional.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775839813063_k1fm6o", nome:"Massas & Molhos - Os Mais Pedidos", categoria:"Gastronomia", data:"17/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/massamolho.jpg", descricao:"Massas Artesanais: do zero aos clássicos italianos\n\nUma experiência completa para quem quer aprender a fazer massa fresca de verdade e transformar ingredientes simples em pratos incríveis.\n\nNesta aula, você prepara sua própria massa artesanal e aprende a modelar diferentes formatos, explorando técnicas que fazem toda a diferença no resultado final. Ao longo do workshop, você também descobre como combinar recheios e molhos clássicos para criar pratos cheios de sabor e personalidade.\n\nDepois dessa experiência, a ideia de comprar massa pronta simplesmente deixa de fazer sentido.\n\nConteúdo da experiência:\nMassa básica artesanal: preparo do zero com técnica e ponto ideal\nModelagem em espaguete, farfalle e ravióli: diferentes formatos e aplicações\nPreparo à moda carbonara: técnica para um dos molhos mais clássicos da culinária italiana\nRecheio de gema e espinafre: combinação rica e surpreendente para ravióli\nMolho rústico de tomate com almôndegas: preparo completo, sabor intenso e caseiro\n\nVocê vai aprender:\nComo fazer massa fresca com textura e estrutura perfeitas\nTécnicas de modelagem para diferentes tipos de massa\nComo combinar recheios e molhos de forma equilibrada\n\nUma aula com muitas dicas práticas, ingredientes de excelente qualidade e um ambiente leve e descontraído, perfeita para quem quer evoluir na cozinha e aproveitar cada etapa do preparo.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775840350645_6u4k67", nome:"Brownies & Blondies", categoria:"Gastronomia", data:"28/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/brownie.jpg", descricao:"Brownies & Blondies: textura perfeita e muito sabor\n\nUma experiência para quem ama doce e quer aprender de verdade os segredos por trás de brownies intensos e blondies surpreendentes.\n\nNesta aula, você descobre como alcançar a textura ideal do brownie: úmido por dentro, com casquinha por fora e sabor marcante. Ao longo do workshop, você prepara diferentes versões, explorando combinações criativas que vão muito além do tradicional.\n\nCom técnicas simples e resultados incríveis, é uma aula perfeita tanto para iniciantes quanto para quem já gosta de se aventurar na cozinha.\n\nConteúdo da experiência:\nBlondie de limão com cobertura aveludada: versão leve e cítrica, com equilíbrio perfeito de sabores\nBlondie de morango com cobertura de cream cheese: combinação delicada e marcante\nBrownie Mississipi: brownie com manteiga de amendoim, calda de chocolate e marshmallows assados\nBrownie de chocolate com fudge de castanha: intenso, cremoso e cheio de textura\n\nVocê vai aprender:\nTécnicas para acertar o ponto perfeito do brownie\nCombinações de sabores e recheios\nDicas práticas para reproduzir em casa com facilidade\n\nPerfeito para quem quer criar sobremesas irresistíveis, seja para um café da tarde, um jantar especial ou até para vender.\n\nTurmas reduzidas, ambiente leve e descontraído e ingredientes de excelente qualidade fazem dessa aula uma experiência completa do começo ao fim.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775840532175_stpbhc", nome:"Cookies Recheados", categoria:"Gastronomia", data:"29/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/cookies.jpg", descricao:"Cookies Perfeitos: crocantes por fora, macios por dentro\n\nUma experiência para quem ama aquele cheirinho de cookie saindo do forno e quer aprender a fazer versões irresistíveis do zero.\n\nNesta aula, você prepara diferentes tipos de cookies, entendendo as técnicas que garantem a textura perfeita: levemente crocante por fora e macio por dentro. Ao longo do workshop, você explora sabores clássicos e criativos, além de aprender opções que vão desde o consumo em casa até ideias para presentear ou vender.\n\nÉ aquele tipo de aula que envolve, perfuma o ambiente e termina do melhor jeito possível: provando tudo.\n\nConteúdo da experiência:\nMassa tradicional: base clássica para cookies equilibrados e saborosos\nMassa de chocolate triplo chocolate: intensa, rica e cheia de textura\nSnickerdoodle cookie: versão aromática com toque de canela e açúcar\nRed velvet cookie: combinação marcante com massa macia e sabor único\nCookies in a jar: montagem criativa para presentear ou vender\n\nVocê vai aprender:\nTécnicas para acertar textura e ponto dos cookies\nCombinações de sabores e variações de massa\nDicas práticas para produção em casa ou até para renda extra\n\nUma aula com muitas dicas, ingredientes de excelente qualidade e um ambiente leve e descontraído, perfeita para quem quer aprender, se divertir e sair com receitas que vão fazer sucesso sempre.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775840767772_86vqte", nome:"Drinks & Petiscos - Gin e Moscow Mule", categoria:"Bartenderia", data:"24/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/drinks.jpg", descricao:"Happy Hour na Cozinha: drinks e petiscos para surpreender\n\nUma experiência perfeita para quem quer aprender, se divertir e viver um verdadeiro happy hour colocando a mão na massa.\n\nNesta aula, você prepara seus próprios drinks e petiscos, aprendendo combinações que funcionam de verdade e técnicas simples que fazem toda a diferença no resultado final. É o tipo de experiência leve, descontraída e ideal para ir com amigos ou conhecer gente nova enquanto cozinha e brinda.\n\nAo longo do workshop, você explora clássicos da coquetelaria e receitas de petiscos cheios de sabor, criando um menu completo para reproduzir depois em casa.\n\nConteúdo da experiência:\nDadinhos de tapioca: preparo crocante por fora e macio por dentro\nBolinho de abóbora com camarão ou carne seca: combinação intensa e cheia de sabor\nVinagrete de polvo: leve, fresco e perfeito para acompanhar\nSmash de pepino: drink refrescante e equilibrado\nGim tônica de maracujá: cítrico e aromático\nMoscow mule: clássico com espuma e sabor marcante\n\nVocê vai aprender:\nTécnicas básicas de preparo de drinks\nCombinações de sabores para petiscos e acompanhamentos\nDicas práticas para montar um happy hour completo em casa\n\nUma aula com ingredientes de excelente qualidade, muitas dicas e um ambiente descontraído, perfeita para quem quer aprender de forma leve, brindar e aproveitar cada momento.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775841040595_agu9gq", nome:"Cozinha Indiana - Comendo com as Mãos", categoria:"Gastronomia", data:"18/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/indiana.jpg", descricao:"Sabores da Índia: uma viagem pela cozinha indiana\n\nUma experiência intensa, aromática e cheia de descobertas para quem quer explorar novos sabores e técnicas na cozinha.\n\nNesta aula, você mergulha na culinária indiana e aprende a preparar receitas tradicionais com combinações marcantes de especiarias, texturas e aromas. Ao longo do workshop, você desenvolve um menu completo, passando por massas, molhos, pratos principais e acompanhamentos, entendendo como cada elemento se conecta no prato.\n\nÉ uma verdadeira imersão gastronômica que vai muito além da receita, trazendo repertório e novas possibilidades para cozinhar.\n\nConteúdo da experiência:\nSamosa: preparo do clássico salgado indiano, crocante e recheado\nPotato stew: ensopado reconfortante e cheio de especiarias\nShrimp balchao: prato intenso e marcante com camarão\nLayered paratha: pão em camadas, macio por dentro e levemente crocante por fora\nGinger chutney: molho aromático com toque picante e refrescante\nHung yogurt: base cremosa muito utilizada na culinária indiana\nShrikhand: sobremesa leve e aromática à base de iogurte\nMasala chai: bebida quente com especiarias, perfeita para acompanhar\n\nVocê vai aprender:\nComo utilizar especiarias de forma equilibrada\nTécnicas tradicionais da culinária indiana\nCombinações de sabores que criam pratos completos\n\nUma aula com ingredientes de excelente qualidade, muitas dicas práticas e um ambiente leve e descontraído, perfeita para quem quer sair do óbvio e viver uma experiência gastronômica totalmente diferente.", horario:"16h00 - 19h30", horarios:["16h00 - 19h30"] },
    { id:"exp_1775841248670_2k24db", nome:"Bolos Caseiros", categoria:"Gastronomia", data:"25/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/bolocaseiro.jpg", descricao:"Bolos Caseiros: receitas que acolhem\n\nUma experiência para quem ama aquele bolo quentinho, com cheiro de casa e sabor de memória.\n\nNesta aula, você aprende a preparar bolos clássicos e irresistíveis, daqueles que funcionam tanto para um café da tarde quanto para presentear ou até vender. Com técnicas simples e resultados incríveis, o foco é te dar segurança para reproduzir tudo depois, sem complicação.\n\nAo longo do workshop, você explora diferentes tipos de massa, combinações e finalizações, entendendo o ponto certo e os detalhes que fazem toda a diferença.\n\nConteúdo da experiência:\nBolo pudim: combinação surpreendente de duas texturas em uma só receita\nBolo de chocolate branco com frutas vermelhas: equilibrado, delicado e cheio de sabor\nBolo mármore: clássico mesclado, visual bonito e sabor marcante\nBolo invertido de abacaxi: úmido, caramelizado e perfeito para servir\n\nVocê vai aprender:\nTécnicas básicas para bolos fofinhos e bem estruturados\nCombinações de sabores e variações de massa\nDicas práticas para preparar, servir ou até vender\n\nPerfeito para quem quer trazer mais sabor para o dia a dia e viver uma experiência leve, gostosa e cheia de afeto na cozinha.", horario:"16h00 - 19h30", horarios:["16h00 - 19h30"] },
    { id:"exp_1775841525741_p2yuah", nome:"Massas & Molhos - Massas Recheadas", categoria:"Gastronomia", data:"15/04", duracao:"3h30", bairro:"Jardim das Bandeiras", endereco:"Rua Abegoaria, 538", inclui:"Todo material incluso", preco:"R$383", cor:"#f6d5a8,#f0a05e", imagem:"assets/massarecheada.jpg", descricao:"Massas Artesanais com Semolina: como um chef italiano\n\nUma experiência para quem quer elevar o nível na cozinha e aprender a fazer massas frescas com técnica, sabor e apresentação impecável.\n\nNesta aula, você prepara uma massa artesanal com semolina e descobre como transformar ingredientes simples em pratos dignos de um restaurante italiano. Ao longo do workshop, você aprende diferentes modelagens, recheios e molhos, criando combinações sofisticadas e cheias de personalidade.\n\nMais do que seguir receitas, aqui você entende o processo e ganha confiança para reproduzir em casa com resultado profissional.\n\nConteúdo da experiência:\nMassa básica artesanal: preparo com semolina para textura e estrutura perfeitas\nCapelettis di barbabietola con salvia: massa delicada com toque de beterraba e combinação aromática\nCannelloni di prosciutto con spinaci: recheio clássico e equilibrado com presunto e espinafre\nRondelli noce e albicocca: combinação criativa com nozes e damasco\nSauce d’arancia: molho cítrico que traz frescor e leveza\nMolho de gorgonzola: intenso e cremoso, perfeito para massas recheadas\n\nVocê vai aprender:\nTécnicas de preparo de massa fresca com semolina\nModelagem de diferentes formatos de massas\nCombinações de recheios e molhos sofisticados\n\nUma aula com muitas dicas práticas, ingredientes de excelente qualidade e um ambiente leve e descontraído, perfeita para quem quer cozinhar como um chef e se surpreender com o resultado.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775841987813_al1lqb", nome:"Modelagem em Cerâmica para 2 Pessoas - Oficina Familiar com Crianças (até 12 anos)", categoria:"Cerâmica", data:"18/04", duracao:"2h00", bairro:"Pinheiros", endereco:"Rua Capote Valente, 697", inclui:"Todo material incluso", preco:"R$495", cor:"#f6d5a8,#f0a05e", imagem:"assets/ceramicafamiliamenos12.jpg", descricao:"Modelagem em Cerâmica para Família: primeiros momentos com a argila\n\nUma experiência pensada para famílias que querem viver um momento especial juntas, de forma leve, sensorial e cheia de afeto.\n\nNesta aula, adultos e crianças exploram a modelagem em cerâmica de maneira livre e guiada, com atividades adaptadas para os pequenos de até 12 anos. É um primeiro contato com a argila que estimula os sentidos, a coordenação e a curiosidade, enquanto cria memórias únicas em família.\n\nTudo acontece no ritmo de vocês, sem pressão por resultado, valorizando o processo, o toque e a descoberta.\n\nConteúdo da experiência:\nIntrodução à argila: contato inicial e exploração sensorial\nModelagem livre: criação de formas simples com apoio do instrutor\nTécnicas básicas: apertar, enrolar e moldar de forma intuitiva\nMomentos guiados: sugestões de pequenas criações para fazer em família\n\nVocê vai aprender:\nComo estimular o desenvolvimento sensorial da criança\nFormas simples de modelar com segurança\nComo transformar o momento em uma experiência leve e divertida\n\nOpções de participação:\nExperiência para 2 ou 3 pessoas no total, ideal para um adulto e criança ou pequenos grupos familiares\n\nPerfeito para quem quer desacelerar, se desconectar do digital e viver um momento de conexão real com quem mais importa.", horario:"14h00 - 16h00", horarios:["14h00 - 16h00"] },
    { id:"exp_1775842126379_w3h494", nome:"Modelagem em Cerâmica para 2 Pessoas - Oficina Familiar com Crianças (a partir de 12 anos)", categoria:"Cerâmica", data:"15/04", duracao:"2h00", bairro:"Pinheiros", endereco:"Rua Capote Valente, 697", inclui:"Todo material incluso", preco:"R$495", cor:"#f6d5a8,#f0a05e", imagem:"assets/ceramicafamiliamais12.jpg", descricao:"Modelagem em Cerâmica: criatividade a partir dos 12 anos\n\nUma experiência prática e envolvente para quem quer aprender a criar com as próprias mãos e explorar a cerâmica de forma leve e criativa.\n\nNesta aula, jovens a partir de 12 anos e adultos aprendem técnicas de modelagem em argila, com orientação passo a passo para desenvolver peças únicas. É um momento de desconexão do digital e conexão com o processo criativo, onde cada participante pode experimentar, testar ideias e ver suas criações ganharem forma.\n\nNão é preciso ter experiência prévia, apenas vontade de criar.\n\nConteúdo da experiência:\nIntrodução à argila: primeiros passos e entendimento do material\nTécnicas de modelagem: construção manual de peças com diferentes formas\nCriação livre: desenvolvimento de peças autorais com apoio do instrutor\nAcabamento básico: ajustes finais para preparar as peças\n\nVocê vai aprender:\nTécnicas iniciais de modelagem em cerâmica\nComo transformar ideias em peças reais\nNoções básicas de acabamento e estrutura\n\nOpções de participação:\nExperiência para 2 ou 3 pessoas no total, ideal para amigos, família ou pequenos grupos\n\nPerfeito para quem quer experimentar algo novo, desenvolver a criatividade e viver um momento diferente, colocando a mão na argila e saindo do óbvio.", horario:"19h00 - 21h00", horarios:["19h00 - 21h00"] },
    { id:"exp_1775842212445_eb1qnf", nome:"Modelagem em Cerâmica para 2 Pessoas - Oficina Familiar com Crianças (a partir de 12 anos)", categoria:"Cerâmica", data:"18/04", duracao:"2h00", bairro:"Pinheiros", endereco:"Rua Capote Valente, 697", inclui:"Todo material incluso", preco:"R$495", cor:"#f6d5a8,#f0a05e", imagem:"assets/ceramicafamiliamais212.jpg", descricao:"Modelagem em Cerâmica: criatividade a partir dos 12 anos\n\nUma experiência prática e envolvente para quem quer aprender a criar com as próprias mãos e explorar a cerâmica de forma leve e criativa.\n\nNesta aula, jovens a partir de 12 anos e adultos aprendem técnicas de modelagem em argila, com orientação passo a passo para desenvolver peças únicas. É um momento de desconexão do digital e conexão com o processo criativo, onde cada participante pode experimentar, testar ideias e ver suas criações ganharem forma.\n\nNão é preciso ter experiência prévia, apenas vontade de criar.\n\nConteúdo da experiência:\nIntrodução à argila: primeiros passos e entendimento do material\nTécnicas de modelagem: construção manual de peças com diferentes formas\nCriação livre: desenvolvimento de peças autorais com apoio do instrutor\nAcabamento básico: ajustes finais para preparar as peças\n\nVocê vai aprender:\nTécnicas iniciais de modelagem em cerâmica\nComo transformar ideias em peças reais\nNoções básicas de acabamento e estrutura\n\nOpções de participação:\nExperiência para 2 ou 3 pessoas no total, ideal para amigos, família ou pequenos grupos\n\nPerfeito para quem quer experimentar algo novo, desenvolver a criatividade e viver um momento diferente, colocando a mão na argila e saindo do óbvio.", horario:"10h00 - 12h00", horarios:["10h00 - 12h00"] },
    { id:"exp_1775842625611_bh337g", nome:"Buquê de Flores", categoria:"Floral", data:"19/04", duracao:"3h00", bairro:"Brooklin", endereco:"Rua Nova York, 345", inclui:"Coffe break, Todo material incluso", preco:"R$180", cor:"#f6d5a8,#f0a05e", imagem:"assets/buque.jpg", descricao:"Buquê de Flores: do básico ao arranjo perfeito\n\nUma experiência delicada e criativa para quem quer aprender a montar buquês bonitos, equilibrados e cheios de personalidade.\n\nNesta aula, você descobre como combinar flores, cores e texturas para criar arranjos harmoniosos, aprendendo técnicas usadas por floristas para dar leveza, movimento e acabamento profissional. Ao longo do workshop, cada participante monta seu próprio buquê, escolhendo elementos e desenvolvendo seu estilo.\n\nÉ um momento leve, estético e inspirador, perfeito para desacelerar e criar algo lindo com as próprias mãos.\n\nConteúdo da experiência:\nSeleção de flores: tipos, cores e combinações que funcionam\nEstrutura do buquê: como montar base, volume e proporção\nTécnicas de amarração: acabamento firme e elegante\nComposição visual: equilíbrio entre cores, alturas e texturas\n\nVocê vai aprender:\nComo montar buquês do zero\nTécnicas de composição e harmonia visual\nDicas práticas para conservar e valorizar as flores\n\nPerfeito para quem quer aprender algo novo, presentear alguém especial ou simplesmente viver um momento criativo e diferente do óbvio.", horario:"10h30 - 13h30", horarios:["10h30 - 13h30"] },
    { id:"exp_1775844307162_0q5b1e", nome:"Mundo do Macramê", categoria:"Macramê", data:"26/04", duracao:"4h00", bairro:"Chácara Santo Antônio", endereco:"divulgado após confirmação de inscrição", inclui:"Todo material incluso", preco:"R$198", cor:"#f6d5a8,#f0a05e", imagem:"assets/macrameee.jpg", descricao:"Macramê: crie com fios e nós\n\nUma experiência criativa e relaxante para quem quer aprender a transformar fios em peças decorativas cheias de estilo.\n\nNesta aula, você descobre as técnicas básicas do macramê e aprende, passo a passo, a construir sua própria peça, mesmo sem nenhuma experiência prévia. Ao longo do workshop, você explora diferentes tipos de nós, entende como criar formas e vê o projeto ganhar vida nas suas mãos.\n\nÉ aquele momento de desacelerar, focar no processo e sair com algo único, feito por você.\n\nConteúdo da experiência:\nIntrodução ao macramê: materiais e primeiros passos\nNós básicos: técnicas fundamentais para construção das peças\nEstrutura e composição: como dar forma e equilíbrio ao trabalho\nFinalização: acabamento e ajustes para um resultado bonito\n\nVocê vai aprender:\nPrincipais nós do macramê\nComo criar peças decorativas do zero\nDicas práticas para continuar criando em casa\n\nPerfeito para quem quer explorar a criatividade, aprender algo novo e viver uma experiência manual leve, estética e fora da rotina.", horario:"8h30 - 12h30", horarios:["8h30 - 12h30"] },
    { id:"exp_1775844600116_ehruyh", nome:"Workshop Luz da Colmeia - Velas de Cera de Abelha", categoria:"Vela", data:"26/04", duracao:"2h30", bairro:"Pinheiros", endereco:"Rua Filipe de Alcaçova, 38", inclui:"Coffee break, Todo material incluso", preco:"R$180", cor:"#f6d5a8,#f0a05e", imagem:"assets/ceradeabelha.jpg", descricao:"Velas Naturais: criação com cera de abelha\n\nUma experiência sensorial e criativa para quem quer aprender a fazer velas naturais, bonitas e cheias de personalidade.\n\nNesta aula, você descobre como trabalhar com cera de abelha e transformar o material em velas únicas, explorando aromas, formatos e acabamentos. Com orientação passo a passo, você aprende desde o derretimento correto da cera até a finalização, entendendo cada etapa do processo.\n\nÉ um momento de desacelerar, se conectar com os sentidos e criar algo que traz aconchego e bem-estar.\n\nConteúdo da experiência:\nIntrodução à cera de abelha: características e benefícios\nPreparo da cera: técnicas de derretimento e manuseio\nCriação das velas: escolha de formatos, pavio e montagem\nAromatização: uso de essências para personalização\nFinalização: acabamento e cuidados com as velas\n\nVocê vai aprender:\nComo produzir velas naturais do zero\nTécnicas para um bom resultado de queima e estética\nDicas para personalizar e até presentear ou vender\n\nPerfeito para quem quer viver uma experiência criativa, relaxante e sair com peças feitas por você, prontas para usar ou compartilhar.", horario:"15h00 - 17h30", horarios:["15h00 - 17h30"] },
    { id:"exp_1775845454360_ywxtui", nome:"Vela Aromática", categoria:"Vela", data:"26/04", duracao:"3h00", bairro:"Moema", endereco:"Alameda das Nhambiquaras, 1388", inclui:"Coffee break, Todo material incluso", preco:"R$261", cor:"#f6d5a8,#f0a05e", imagem:"assets/velaaromatica.jpg", descricao:"Velas Aromáticas: crie seu próprio aroma\n\nUma experiência sensorial para quem quer transformar cheiros em memórias e criar velas únicas do zero.\n\nNesta aula, você aprende todo o processo de produção de velas aromáticas, desde a escolha da base até a combinação de fragrâncias. Com orientação passo a passo, você descobre como equilibrar aromas, trabalhar com diferentes essências e criar uma vela bonita, perfumada e com acabamento profissional.\n\nÉ um momento de desacelerar, explorar os sentidos e sair com algo feito por você, que leva sua identidade em cada detalhe.\n\nConteúdo da experiência:\nIntrodução às velas aromáticas: tipos de cera e características\nPreparo da base: derretimento e temperatura ideal\nAromatização: combinação de essências e criação de fragrâncias\nMontagem: escolha de recipiente, pavio e estrutura\nFinalização: acabamento e cura da vela\n\nVocê vai aprender:\nComo produzir velas aromáticas do zero\nTécnicas para fixação e intensidade do aroma\nDicas para personalizar, presentear ou até vender\n\nPerfeito para quem quer viver uma experiência criativa, relaxante e sair com uma vela exclusiva, feita com seu próprio estilo.", horario:"10h00 - 13h00", horarios:["10h00 - 13h00"] },
    { id:"exp_1775846123869_x69c91", nome:"Cozinha Árabe", categoria:"Gastronomia", data:"14/04", duracao:"3h30", bairro:"Brooklin", endereco:"Rua Nova Orleans, 34", inclui:"Todo material incluso", preco:"R$261", cor:"#f6d5a8,#f0a05e", imagem:"assets/arabe.jpg", descricao:"Culinária Árabe: sabores, aromas e tradição\n\nUma experiência para quem quer explorar uma das cozinhas mais ricas e aromáticas do mundo, cheia de história, especiarias e combinações marcantes.\n\nNesta aula, você aprende a preparar receitas clássicas da culinária árabe, entendendo como equilibrar temperos, texturas e ingredientes para criar pratos autênticos e cheios de sabor. Ao longo do workshop, você desenvolve um menu completo, passando por preparos que vão do simples ao mais elaborado.\n\nMais do que receitas, é uma imersão cultural que transforma a forma de cozinhar e experimentar novos sabores.\n\nConteúdo da experiência:\nPratos tradicionais: preparo de receitas clássicas da culinária árabe\nUso de especiarias: combinações e equilíbrio de sabores\nPastas e acompanhamentos: texturas e contrastes no prato\nMontagem e apresentação: como servir de forma harmoniosa\n\nVocê vai aprender:\nTécnicas essenciais da culinária árabe\nComo utilizar especiarias de forma equilibrada\nCombinações que criam pratos completos e marcantes\n\nPerfeito para quem quer sair do óbvio, expandir repertório na cozinha e viver uma experiência gastronômica rica, envolvente e cheia de sabor.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] },
    { id:"exp_1775846438621_sti1xr", nome:"Princípios da Cozinha - Básico & Bem Feito", categoria:"Gastronomia", data:"16/04", duracao:"3h30", bairro:"Brooklin", endereco:"Rua Nova Orleans, 34", inclui:"Todo material incluso", preco:"R$261", cor:"#f6d5a8,#f0a05e", imagem:"assets/basicobemfeito.jpg", descricao:"Cozinha Básica: o essencial bem feito\n\nUma experiência para quem quer aprender a cozinhar de verdade, começando pelo que mais importa: os fundamentos.\n\nNesta aula, você desenvolve as bases da cozinha com técnica, clareza e prática. Ao invés de receitas soltas, o foco está em entender o porquê de cada etapa, para que você ganhe autonomia e consiga preparar diferentes pratos com segurança e consistência.\n\nÉ o tipo de conhecimento que muda tudo: quando o básico é bem feito, qualquer receita funciona melhor.\n\nConteúdo da experiência:\nCortes e preparo de ingredientes: técnicas essenciais e organização\nMétodos de cocção: refogar, grelhar, assar e cozinhar corretamente\nTemperos e bases: como construir sabor do zero\nMolhos básicos: fundamentos que se aplicam a diversas receitas\nPonto e textura: como identificar o momento certo de cada preparo\n\nVocê vai aprender:\nComo cozinhar com técnica e confiança\nComo equilibrar sabores e temperos\nComo adaptar receitas e criar a partir do básico\n\nPerfeito para quem quer sair do zero, ganhar independência na cozinha ou organizar melhor o que já sabe, com uma base sólida que serve para tudo.", horario:"19h00 - 22h30", horarios:["19h00 - 22h30"] }
  ];

  function sb() {
    return window.supabaseClient || null;
  }

  function dbRowToExperience(row) {
    if (!row) return null;
    const horarios = Array.isArray(row.horarios) ? row.horarios.slice() : [];
    const horario = horarios[0] || row.horario || '';
    return {
      id: row.id,
      nome: row.nome || '',
      categoria: row.categoria || '',
      data: row.data || '',
      duracao: row.duracao || '',
      bairro: row.bairro || '',
      endereco: row.endereco || '',
      inclui: row.inclui || '',
      preco: row.preco || '',
      cor: row.cor || '#f6d5a8,#f0a05e',
      imagem: row.imagem || '',
      descricao: row.descricao || '',
      horario: horario,
      horarios: horarios.length ? horarios : (horario ? [horario] : []),
      // ----- novos campos -----
      vagasTotal: row.vagas_total != null ? Number(row.vagas_total) : null,
      vagasRestantes: row.vagas_restantes != null ? Number(row.vagas_restantes) : null,
      eventAt: row.event_at || null,
      cutoffHours: row.cutoff_hours != null ? Number(row.cutoff_hours) : 24,
      // Visibilidade (oculta/mostra no site sem excluir).
      // Só `false` explícito esconde. Default true pra retrocompat com
      // bancos antigos sem a coluna ou com null.
      isActive: row.is_active === false ? false : true,
      // --- fornecedor ---
      fornecedorNome: row.fornecedor_nome || null,
      valorCheioCentavos: row.valor_cheio_centavos != null ? Number(row.valor_cheio_centavos) : null,
      percentualRepasse: row.percentual_repasse != null ? Number(row.percentual_repasse) : 90,
      // ------------------------
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || ''
    };
  }

  function experienceToDbRow(exp) {
    const horarios = Array.isArray(exp.horarios) && exp.horarios.length
      ? exp.horarios.map(h => (typeof h === 'string' ? h.trim() : '')).filter(Boolean)
      : (exp.horario ? [String(exp.horario).trim()] : []);

    // Aceita tanto camelCase (vagasTotal) quanto snake_case (vagas_total)
    // pra ser tolerante com formulários antigos.
    const rawVagasTotal = exp.vagasTotal != null ? exp.vagasTotal : exp.vagas_total;
    const vagasTotal = rawVagasTotal === '' || rawVagasTotal == null
      ? null
      : Number(rawVagasTotal);

    const rawEventAt = exp.eventAt != null ? exp.eventAt : exp.event_at;
    const eventAt = rawEventAt && String(rawEventAt).trim() ? String(rawEventAt).trim() : null;

    const rawCutoff = exp.cutoffHours != null ? exp.cutoffHours : exp.cutoff_hours;
    const cutoffHours = rawCutoff === '' || rawCutoff == null ? 24 : Number(rawCutoff);

    // Visibilidade: aceita isActive (camelCase) ou is_active (snake_case).
    // Só false explícito oculta — qualquer outra coisa mantém true.
    const rawIsActive = exp.isActive != null ? exp.isActive : exp.is_active;
    const isActive = rawIsActive === false ? false : true;

    // Monta o row completo primeiro, depois filtra contra knownColumns
    // (se já detectado) pra remover colunas que não existem no banco.
    const fullRow = {
      nome: (exp.nome || '').trim(),
      categoria: (exp.categoria || '').trim(),
      data: (exp.data || '').trim(),
      duracao: (exp.duracao || '').trim(),
      bairro: (exp.bairro || '').trim(),
      endereco: (exp.endereco || '').trim(),
      inclui: (exp.inclui || '').trim(),
      preco: (exp.preco || '').trim(),
      cor: (exp.cor || '#f6d5a8,#f0a05e').trim(),
      imagem: (exp.imagem || '').trim(),
      descricao: (exp.descricao || '').trim(),
      horario: horarios[0] || '',
      horarios: horarios,
      vagas_total: Number.isFinite(vagasTotal) && vagasTotal >= 0 ? vagasTotal : null,
      event_at: eventAt,
      cutoff_hours: Number.isFinite(cutoffHours) ? cutoffHours : 24,
      is_active: isActive,
      fornecedor_nome: (exp.fornecedorNome || exp.fornecedor_nome || '').trim() || null,
      valor_cheio_centavos: (function () {
        var raw = exp.valorCheioCentavos != null ? exp.valorCheioCentavos : exp.valor_cheio_centavos;
        if (raw == null || raw === '') return null;
        var n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : null;
      })(),
      percentual_repasse: (function () {
        var raw = exp.percentualRepasse != null ? exp.percentualRepasse : exp.percentual_repasse;
        if (raw == null || raw === '') return 90;
        var n = Number(raw);
        return Number.isFinite(n) ? n : 90;
      })()
    };
    return filterKnownColumns(fullRow);
  }

  // Remove do row qualquer coluna opcional que sabidamente não existe
  // no banco. Mantém o core schema sempre. Se knownColumns ainda é
  // null, devolve o row inteiro — o retry path cobre as colunas
  // faltantes no primeiro erro.
  function filterKnownColumns(row) {
    if (!row || typeof row !== 'object') return row;
    if (!knownColumns) return row;
    const out = {};
    for (const key of Object.keys(row)) {
      if (CORE_COLUMNS.has(key) || knownColumns.has(key)) {
        out[key] = row[key];
      }
    }
    return out;
  }

  function invalidateCache() {
    cache = null;
    cachePromise = null;
  }

  // Se o erro for "column X não existe no schema cache", devolve
  // o nome da coluna. Caso contrário, null. Cobre os dois formatos
  // mais comuns que o PostgREST / Postgres usam.
  //   PGRST204: "Could not find the 'cutoff_hours' column of 'experiences' in the schema cache"
  //   42703:    "column \"cutoff_hours\" does not exist"
  //             ou "column experiences.cutoff_hours does not exist"
  function extractMissingColumn(error) {
    if (!error) return null;
    const msg = String(error.message || error.details || error.hint || '');
    if (!msg) return null;
    const m1 = msg.match(/find the ['"]?([a-zA-Z_][a-zA-Z_0-9]*)['"]? column/i);
    if (m1) return m1[1];
    const m2 = msg.match(/column\s+(?:[a-zA-Z_][a-zA-Z_0-9]*\.)?["']?([a-zA-Z_][a-zA-Z_0-9]*)["']?\s+does not exist/i);
    if (m2) return m2[1];
    return null;
  }

  // Marca permanentemente que a coluna nomeada NÃO existe. Próximos
  // writes já não vão enviá-la.
  function markColumnMissing(col) {
    if (!col) return;
    if (!knownColumns) {
      // Ainda não detectamos o schema — considera tudo existente
      // menos essa coluna. O próximo SELECT corrige se precisar.
      knownColumns = new Set([
        ...CORE_COLUMNS,
        ...OPTIONAL_COLUMNS
      ]);
    }
    knownColumns.delete(col);
  }

  async function getAllExperiences() {
    if (cache) return cache.slice();
    if (cachePromise) return (await cachePromise).slice();

    const s = sb();
    if (!s) {
      console.info('[Elarah] Supabase indisponível — usando fallback de experiências.');
      cache = FALLBACK_SEEDS.slice();
      return cache.slice();
    }

    cachePromise = (async () => {
      let source = 'supabase';
      try {
        const { data, error } = await s
          .from(TABLE)
          .select('*')
          .order('created_at', { ascending: true });
        if (error) {
          source = 'fallback (supabase error)';
          console.warn('[Elarah] getAllExperiences error — usando fallback:', error.message);
          cache = FALLBACK_SEEDS.slice();
        } else {
          // Detecta o conjunto real de colunas olhando a primeira linha.
          if (Array.isArray(data) && data.length > 0 && data[0]) {
            knownColumns = new Set(Object.keys(data[0]));
          }
          const rows = (data || []).map(dbRowToExperience);
          if (rows.length) {
            cache = rows;
          } else {
            source = 'fallback (0 rows from supabase)';
            cache = FALLBACK_SEEDS.slice();
          }
        }
      } catch (e) {
        source = 'fallback (exception)';
        console.warn('[Elarah] getAllExperiences exception — usando fallback:', e);
        cache = FALLBACK_SEEDS.slice();
      }
      // Diagnóstico explícito: conta quantas experiências têm
      // descrição não-vazia. Se "com descricao = 0" aparecer, a
      // modal nunca vai abrir — sinal claro de que os dados
      // estão vazios (seja no banco ou no fallback).
      const total = cache.length;
      const comDesc = cache.filter(function (e) {
        return e && e.descricao && String(e.descricao).trim();
      }).length;
      console.info(
        '[Elarah] getAllExperiences carregadas —',
        'source=' + source,
        'total=' + total,
        'com_descricao=' + comDesc
      );
      cachePromise = null;
      return cache;
    })();
    return (await cachePromise).slice();
  }

  async function getExperienceById(id) {
    const all = await getAllExperiences();
    return all.find(e => e.id === id) || null;
  }

  // Lista pública: oculta experiências com isActive === false E
  // aquelas cujo cutoff já passou (mesmo efeito do botão "Ocultar",
  // mas automático por tempo — não mexe em is_active no banco, então
  // se o admin esticar event_at ou cutoff_hours, a experiência
  // reaparece sozinha). O bloqueio de reserva em booking_guard.ts
  // continua protegendo a página de detalhe contra link direto.
  // Admin continua usando getAllExperiences() pra ver tudo.
  // Exposta também como getActiveExperiences pra compat com código
  // que usa esse nome.
  // Extrai a hora inicial de uma string como "19h00 – 21h00" / "9h30".
  // Aceita 'h' ou ':' como separador interno e en/em-dash ou hífen
  // como separador de range. Devolve null se não der pra parsear.
  function parseStartHour(raw) {
    if (!raw) return null;
    const head = String(raw).split(/[–—\-]/)[0].trim();
    const m = head.match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})/i);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = m[2] ? Number(m[2]) : 0;
    if (!Number.isFinite(hh) || hh < 0 || hh > 23) return null;
    if (!Number.isFinite(mm) || mm < 0 || mm > 59) return null;
    return { hh: hh, mm: mm };
  }

  // Deriva o timestamp do evento a partir de `data` ("DD/MM" ou
  // "DD/MM/AAAA") + horário ("HH'h'MM ..."). Espelha a mesma lógica
  // de booking_guard.ts no backend pra que listagem pública e bloqueio
  // de reserva concordem. Fuso fixo America/Sao_Paulo (-03:00).
  //
  // "DD/MM" sem ano = ano atual. Se ficar no passado, getVisibleExperiences
  // oculta a experiência (item solicitado: experiência expira sozinha
  // depois do horário). Pra cadastrar evento futuro num ano específico,
  // admin deve usar "DD/MM/AAAA".
  function deriveEventTimestamp(dataStr, horarioStr, nowMs) {
    if (nowMs == null) nowMs = Date.now();
    if (!dataStr) return null;
    const trimmed = String(dataStr).trim();
    const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (!Number.isFinite(day) || day < 1 || day > 31) return null;
    if (!Number.isFinite(month) || month < 1 || month > 12) return null;
    const year = m[3]
      ? (Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3]))
      : new Date(nowMs).getFullYear();
    const h = parseStartHour(horarioStr);
    if (!h) return null;
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const iso = year + '-' + pad(month) + '-' + pad(day) + 'T' + pad(h.hh) + ':' + pad(h.mm) + ':00-03:00';
    const ts = new Date(iso).getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  // Lista pública: oculta automaticamente quando
  //   1. isActive === false (admin marcou pra ocultar manualmente);
  //   2. faltam menos que `cutoffHours` (default 24h) pro evento começar;
  //   3. o horário do evento já passou (auto-expira sozinha).
  // Os 3 critérios são checados pela mesma desigualdade
  // `now + cutoff*1h <= eventTs` — qualquer eventTs no passado falha
  // automaticamente porque eventTs < now < now + cutoff*1h.
  // Admin continua usando getAllExperiences() pra ver tudo.
  async function getVisibleExperiences() {
    const all = await getAllExperiences();
    const now = Date.now();
    return all.filter(e => {
      if (!e || e.isActive === false) return false;
      const cutoffH = Number.isFinite(Number(e.cutoffHours)) ? Number(e.cutoffHours) : 24;
      let eventTs = null;
      if (e.eventAt) {
        const t = new Date(e.eventAt).getTime();
        if (!isNaN(t)) eventTs = t;
      }
      if (eventTs == null) {
        eventTs = deriveEventTimestamp(
          e.data,
          e.horario || (Array.isArray(e.horarios) ? e.horarios[0] : null),
          now,
        );
      }
      if (eventTs == null) return true;
      return now + cutoffH * 60 * 60 * 1000 <= eventTs;
    });
  }
  const getActiveExperiences = getVisibleExperiences;

  // Write loop: tenta executar `doOnce(row)` e, enquanto o erro for
  // "coluna X não existe", remove a coluna do row e tenta de novo.
  // Cobre o caso de várias colunas opcionais estarem faltando (ex:
  // banco rodou só o setup.sql mas não o extensions.sql nem o
  // visibility.sql — 4+ colunas faltantes). Limita a 10 iterações
  // por segurança.
  async function writeWithColumnRetry(label, row, doOnce) {
    let current = Object.assign({}, row);
    for (let i = 0; i < 10; i++) {
      const { data, error } = await doOnce(current);
      if (!error) return { data, error: null };
      const missing = extractMissingColumn(error);
      if (!missing || !(missing in current)) {
        // Erro não é de coluna faltante, ou não conseguimos extrair,
        // ou a coluna faltante nem estava no payload. Reporta e sai.
        return { data: null, error };
      }
      console.warn(
        '[Elarah] ' + label + ': coluna "' + missing + '" ausente no ' +
        'banco. Removendo do payload e tentando de novo. Rode as ' +
        'migrations do sql/ pra habilitar todos os recursos.'
      );
      markColumnMissing(missing);
      delete current[missing];
    }
    return {
      data: null,
      error: { message: '[Elarah] ' + label + ': retries esgotados removendo colunas ausentes.' }
    };
  }

  async function addExperience(data) {
    const s = sb();
    if (!s) {
      console.error('[Elarah] addExperience: Supabase client indisponível.');
      return null;
    }

    const row = experienceToDbRow(data);

    try {
      const { data: inserted, error } = await writeWithColumnRetry(
        'addExperience',
        row,
        (payload) => s.from(TABLE).insert(payload).select().maybeSingle()
      );

      if (error) {
        console.error('[Elarah] addExperience erro do Supabase:', error);
        return null;
      }
      if (!inserted) {
        // maybeSingle retorna null quando 0 rows foram afetadas.
        // Normalmente RLS bloqueando.
        console.error(
          '[Elarah] addExperience: 0 linhas inseridas. Provável bloqueio ' +
          'por RLS — confirme que o usuário está logado como admin ' +
          '(profiles.role = "admin").'
        );
        return null;
      }
      invalidateCache();
      return dbRowToExperience(inserted);
    } catch (e) {
      console.error('[Elarah] addExperience exceção inesperada:', e);
      return null;
    }
  }

  async function updateExperience(id, data) {
    const s = sb();
    if (!s) {
      console.error('[Elarah] updateExperience: Supabase client indisponível.');
      return null;
    }
    if (!id) {
      console.error('[Elarah] updateExperience: id vazio — abortando.');
      return null;
    }

    const row = experienceToDbRow(data);

    try {
      const { data: updated, error } = await writeWithColumnRetry(
        'updateExperience',
        row,
        (payload) => s.from(TABLE).update(payload).eq('id', id).select().maybeSingle()
      );

      if (error) {
        console.error('[Elarah] updateExperience erro do Supabase:', error);
        return null;
      }
      if (!updated) {
        // maybeSingle retorna null sem erro quando 0 rows foram
        // atualizadas. Causas comuns:
        //   1) RLS bloqueou (usuário não é admin em profiles)
        //   2) id passado não existe na tabela
        console.error(
          '[Elarah] updateExperience: 0 linhas atualizadas para id=' + id +
          '. Verifique (1) se o usuário está logado como admin ' +
          '(profiles.role = "admin") e (2) se o id existe na tabela.'
        );
        return null;
      }
      invalidateCache();
      return dbRowToExperience(updated);
    } catch (e) {
      console.error('[Elarah] updateExperience exceção inesperada:', e);
      return null;
    }
  }

  async function deleteExperience(id) {
    const s = sb();
    if (!s) return false;
    const { error } = await s.from(TABLE).delete().eq('id', id);
    if (error) {
      console.error('[Elarah] deleteExperience error', error);
      return false;
    }
    invalidateCache();
    return true;
  }

  async function duplicateExperience(id) {
    const src = await getExperienceById(id);
    if (!src) return null;
    const copy = { ...src };
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    return addExperience(copy);
  }

  // Liga/desliga visibilidade sem destruir nada. Aceita id + bool.
  // Só mexe na coluna is_active (não toca nenhum outro campo).
  async function setExperienceActive(id, active) {
    const s = sb();
    if (!s) {
      console.error('[Elarah] setExperienceActive: Supabase indisponível.');
      return null;
    }
    if (!id) {
      console.error('[Elarah] setExperienceActive: id vazio — abortando.');
      return null;
    }
    try {
      const { data: updated, error } = await s
        .from(TABLE)
        .update({ is_active: !!active })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) {
        const missing = extractMissingColumn(error);
        if (missing === 'is_active') {
          markColumnMissing('is_active');
          console.error(
            '[Elarah] setExperienceActive: coluna is_active ausente. ' +
            'Rode sql/elarah_experiences_visibility.sql no Supabase ' +
            'antes de usar o botão Ocultar/Reativar.'
          );
        } else {
          console.error('[Elarah] setExperienceActive erro do Supabase:', error);
        }
        return null;
      }
      if (!updated) {
        console.error(
          '[Elarah] setExperienceActive: 0 linhas atualizadas para id=' + id +
          '. Verifique RLS (profiles.role = "admin") e se o id existe.'
        );
        return null;
      }
      invalidateCache();
      return dbRowToExperience(updated);
    } catch (e) {
      console.error('[Elarah] setExperienceActive exceção inesperada:', e);
      return null;
    }
  }

  // =============== EXPERIENCE SLOTS (vagas por horário) ===============
  // Carrega experience_slots e expõe helpers pra o admin e o frontend.
  // Se a tabela não existir (migration não rodou), retorna vazio sem erro.

  const SLOTS_TABLE = 'experience_slots';
  let slotsCache = null;    // Map<experienceId, slotObj[]>
  let slotsCachePromise = null;

  function dbRowToSlot(row) {
    return {
      id: row.id,
      experienceId: row.experience_id,
      data: row.data || null,
      horario: row.horario || '',
      vagasTotal: row.vagas_total != null ? Number(row.vagas_total) : null,
      vagasRestantes: row.vagas_restantes != null ? Number(row.vagas_restantes) : null,
      eventAt: row.event_at || null,
      isActive: row.is_active !== false,
    };
  }

  async function loadAllSlots() {
    if (slotsCache) return slotsCache;
    if (slotsCachePromise) return slotsCachePromise;

    const s = sb();
    if (!s) { slotsCache = new Map(); return slotsCache; }

    slotsCachePromise = (async () => {
      try {
        const { data, error } = await s
          .from(SLOTS_TABLE)
          .select('*')
          .order('created_at', { ascending: true });
        if (error) {
          // Tabela provavelmente não existe — silencia
          console.warn('[Elarah] loadAllSlots: ' + (error.message || 'erro'));
          slotsCache = new Map();
        } else {
          const map = new Map();
          (data || []).forEach(function (row) {
            const slot = dbRowToSlot(row);
            if (!map.has(slot.experienceId)) map.set(slot.experienceId, []);
            map.get(slot.experienceId).push(slot);
          });
          slotsCache = map;
          console.info('[Elarah] loadAllSlots: ' + (data || []).length + ' slots carregados');
        }
      } catch (e) {
        console.warn('[Elarah] loadAllSlots exception:', e);
        slotsCache = new Map();
      }
      slotsCachePromise = null;
      return slotsCache;
    })();
    return slotsCachePromise;
  }

  async function getSlotsForExperience(experienceId) {
    const map = await loadAllSlots();
    return (map.get(experienceId) || []).slice();
  }

  // Salva (upsert) slots pra uma experiência. Recebe array de objetos:
  //   [{ id?, data, horario, vagasTotal, eventAt }]
  // Slots que existiam mas não estão no array são deletados.
  async function saveSlots(experienceId, slotsArray) {
    const s = sb();
    if (!s || !experienceId) return false;

    // 1) Busca os slots atuais do banco pra esta experiência
    const { data: existing } = await s
      .from(SLOTS_TABLE)
      .select('id, horario, data')
      .eq('experience_id', experienceId);
    const existingIds = new Set((existing || []).map(function (r) { return r.id; }));

    // 2) Separa upserts dos deletes
    const toUpsert = [];
    const keepIds = new Set();
    (slotsArray || []).forEach(function (slot) {
      if (!slot.horario || !String(slot.horario).trim()) return;
      const vt = slot.vagasTotal === '' || slot.vagasTotal == null
        ? null : Number(slot.vagasTotal);
      const row = {
        experience_id: experienceId,
        data: slot.data || null,
        horario: String(slot.horario).trim(),
        vagas_total: Number.isFinite(vt) && vt >= 0 ? vt : null,
        event_at: slot.eventAt || null,
        is_active: slot.isActive !== false,
      };
      if (slot.id && existingIds.has(slot.id)) {
        row.id = slot.id;
        keepIds.add(slot.id);
      }
      toUpsert.push(row);
    });

    // 3) Deleta slots removidos do form
    const toDelete = [];
    existingIds.forEach(function (id) { if (!keepIds.has(id)) toDelete.push(id); });
    if (toDelete.length) {
      await s.from(SLOTS_TABLE).delete().in('id', toDelete);
    }

    // 4) Upsert os que ficaram/foram adicionados
    if (toUpsert.length) {
      const { error } = await s.from(SLOTS_TABLE).upsert(toUpsert, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
      if (error) {
        console.error('[Elarah] saveSlots upsert error:', error);
        return false;
      }
    }

    // Invalida cache de slots
    slotsCache = null;
    slotsCachePromise = null;
    return true;
  }

  function invalidateSlotsCache() {
    slotsCache = null;
    slotsCachePromise = null;
  }

  window.ElarahData = {
    getAllExperiences,
    getVisibleExperiences,
    getActiveExperiences,
    getExperienceById,
    addExperience,
    updateExperience,
    deleteExperience,
    duplicateExperience,
    setExperienceActive,
    invalidateCache,
    // Slots
    loadAllSlots,
    getSlotsForExperience,
    saveSlots,
    invalidateSlotsCache
  };
})(window);
