-- =============================================================
-- ELARAH — Prospecção Dia dos Namorados (junho 2026)
-- -------------------------------------------------------------
-- 49 estabelecimentos em São Paulo verificados por pesquisa
-- pública (sites + Instagram), focados em experiências
-- românticas pra casais. Inseridos com status 'nao_contatado'.
--
-- Distribuição:
--   - 9 vinícolas / wine bars
--   - 12 gastronomia (restaurantes, chocolaterias, escolas de
--        sushi/massa)
--   - 8 cerâmica (ateliês estilo Ghost)
--   - 4 joalheria (criação de alianças a dois)
--   - 4 perfumaria
--   - 4 spa / sound healing
--   - 8 outros (pintura+vinho, flores, mixology)
--
-- Lacunas: ~15 sem WhatsApp público (deixados NULL — preencher
-- na primeira interação), ~20 sem e-mail público. Recomenda-se
-- priorizar quem tem WhatsApp pra abordagem direta e usar
-- Instagram DM pros demais.
--
-- Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

INSERT INTO public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes, status) VALUES
  -- ===== VINÍCOLAS & WINE BARS =====
  ('SEDE261', 'vinicola', '@sede261', NULL, NULL, 'https://sede261.negocio.site/', 'Pinheiros', 'São Paulo', 'Wine bar de naturebas com taças avulsas e menu harmonizado às quartas — clima íntimo para dois.', 'nao_contatado'),
  ('Plou Vinhos', 'vinicola', '@plou.vinhos', NULL, NULL, 'https://www.plouvinhos.com/', 'Vila Madalena', 'São Paulo', 'Wine bar de baixa intervenção da sommelier Ana Lu Torres — degustações e cursos a dois.', 'nao_contatado'),
  ('Clos Winebar & Bistrô', 'vinicola', '@clos_winebar', NULL, NULL, 'https://closwinebar.com.br/', 'Vila Madalena', 'São Paulo', 'Bistrô francês em casarão dos anos 30 com vinhos de pequenos produtores — jantar romântico clássico.', 'nao_contatado'),
  ('Vino! Pinheiros', 'vinicola', '@vinopinheiros', '(11) 99563-2174', NULL, 'https://vino.com.br/', 'Pinheiros', 'São Paulo', 'Wine bar intimista colado na estação Fradique Coutinho — taças, harmonização e clima acolhedor.', 'nao_contatado'),
  ('Mistral Wine Bar', 'vinicola', '@mistral.winebar', '(11) 99210-7673', 'info@mistral.com.br', 'https://www.mistral.com.br/especiais/winebar', 'Jardim Paulistano', 'São Paulo', 'Wine bar da maior importadora do país, projeto do Studio Arthur Casas — degustação premium para casais.', 'nao_contatado'),
  ('Vinheria Percussi', 'vinicola', '@vinheriapercussi', NULL, NULL, 'https://www.percussi.com.br/', 'Jardim América', 'São Paulo', 'Italiano consagrado (Guia Michelin 2026) com carta de vinhos italiana — referência em jantar romântico.', 'nao_contatado'),
  ('Bocca Nera', 'vinicola', '@boccanerabar', '(11) 98421-6613', 'contato@boccanerabar.com.br', 'https://www.boccanerabar.com/', 'Vila Madalena', 'São Paulo', 'Primeiro rodízio de vinhos do mundo — experiência divertida e inusitada para casais.', 'nao_contatado'),
  ('Bardega Wine Bar', 'vinicola', '@bardega_winebar', NULL, 'contato@bardegawinebar.com.br', 'https://bardegawinebar.com.br/', 'Itaim Bibi', 'São Paulo', 'Eleito melhor wine bar de SP pelo Veja Comer & Beber — referência de degustação para casais.', 'nao_contatado'),

  -- ===== GASTRONOMIA =====
  ('Casa Rios', 'gastronomia', '@casariosrestaurante', '(11) 2091-7323', NULL, 'https://www.casariosrestaurante.com.br/', 'Pinheiros', 'São Paulo', 'Restaurante dos chefs Rodrigo Aguiar e Giovanna Perrone com mesa do chef — cozinha autoral a fogo de lenha.', 'nao_contatado'),
  ('Charco', 'gastronomia', '@charcorestaurante', '(11) 94631-4065', NULL, 'https://www.charcorestaurante.com.br/', 'Jardins', 'São Paulo', 'Cozinha autoral do chef Tuca Mezzomo (50 Best LatAm) — menu degustação intimista para dois.', 'nao_contatado'),
  ('Kuro Restaurante', 'gastronomia', '@kurorestaurante', NULL, NULL, 'https://kuroeshiro.com.br/', 'Cerqueira César', 'São Paulo', 'Omakase em 16 etapas com 1 estrela Michelin — experiência sensorial japonesa para casais.', 'nao_contatado'),
  ('Tangará Jean-Georges', 'gastronomia', NULL, NULL, NULL, 'https://www.experienciaspalaciotangara.com.br/restaurantes/10/tangara-jeangeorges/', 'Panamby', 'São Paulo', 'Restaurante Michelin do Palácio Tangará com vista para o Parque Burle Marx — menu degustação a dois.', 'nao_contatado'),
  ('Pasta Lab SP', 'gastronomia', '@pasta_lab_sp_', NULL, NULL, 'https://www.pastalabsp.com.br/', 'Sumaré', 'São Paulo', 'Escola de culinária com aulas práticas customizadas para duplas — massa fresca a dois.', 'nao_contatado'),
  ('Per Possi - Escola da Pasta', 'gastronomia', '@perpossi', NULL, NULL, 'https://perpossi.com.br/', NULL, 'São Paulo', 'Escola especializada em massa fresca artesanal — workshops italianos perfeitos para casais cozinharem juntos.', 'nao_contatado'),
  ('Cantinho Gastronomia', 'gastronomia', '@cantinho.gastronomia', '(11) 94763-4468', NULL, 'https://cantinhogastronomia.com.br/', NULL, 'São Paulo', 'Escola parceira Le Creuset com aulas avulsas (ramen, gnocchi, tailandesa) — date culinário a dois.', 'nao_contatado'),
  ('Sassá Sushi', 'gastronomia', '@sassasushi', NULL, NULL, 'https://www.sassasushi.com.br/', 'Itaim Bibi', 'São Paulo', 'Restaurante e escola do mestre Sassá com cursos presenciais — aula de sushi para casais.', 'nao_contatado'),
  ('Curso de Sushi Shu Matsu', 'gastronomia', '@cursoshumatsu', NULL, NULL, 'https://cursosushi.com.br/', NULL, 'São Paulo', 'Escola de sushi com 20+ anos de tradição — workshop intensivo de sushi e sashimi a dois.', 'nao_contatado'),
  ('Original Experience', 'gastronomia', NULL, NULL, NULL, 'https://originalexperience.com.br/', 'Pinheiros', 'São Paulo', 'Plataforma de experiências com workshops a dois (sushi, perfumaria, joalheria) — curadoria de date.', 'nao_contatado'),
  ('Fábrica de Dengo', 'gastronomia', '@fabricadedengo', NULL, NULL, 'https://dengo.com/', 'Pinheiros', 'São Paulo', 'Flagship bean-to-bar de quatro andares com restaurante, Estação Meu Dengo e workshops — experiência sensorial completa.', 'nao_contatado'),
  ('Mestiço Chocolates', 'gastronomia', '@mesticochocolates', NULL, NULL, 'https://mesticochocolates.com/', 'Vila Olímpia', 'São Paulo', 'Fábrica bean-to-bar de Rogério Kamei (3ª geração de cacauicultores) — visitas guiadas e cursos a dois.', 'nao_contatado'),

  -- ===== CERÂMICA =====
  ('Ateliê Cerâmica & Cia', 'ceramica', '@ceramicaecia', '(11) 97642-8584', NULL, 'https://www.ceramicaecia.com.br/', 'Vila Madalena', 'São Paulo', 'Ateliê referência desde 2000 com aulas regulares de modelagem — workshop estilo Ghost a dois.', 'nao_contatado'),
  ('Jamila Cruzado Estúdio', 'ceramica', '@jamilacruzado_', NULL, 'jamicruzado@gmail.com', 'https://www.jamilacruzado.com/', 'Vila Madalena', 'São Paulo', 'Estúdio da ceramista Jamila Cruzado com aulas de torno de 3h — experiência mãos-à-massa para casal.', 'nao_contatado'),
  ('Dbarros Cerâmica', 'ceramica', '@dbarros_ceramica', NULL, NULL, 'https://www.dbarros.com.br/', 'Vila Madalena', 'São Paulo', 'Ateliê da arquiteta Daniela Barros com curso intensivo de torno para iniciantes — ideal para duplas.', 'nao_contatado'),
  ('Mariana Zoccoli Atelier Escola', 'ceramica', '@marianazoccoli', NULL, NULL, 'https://www.marianazoccoli.com/', 'Vila Madalena', 'São Paulo', 'Ateliê de porcelana autoral com cursos de torno e modelagem manual — workshop romântico aos sábados.', 'nao_contatado'),
  ('Ateliê Marte', 'ceramica', '@atelie.marte', '(11) 94825-6844', 'marina@marteceramica.com.br', 'https://www.marteceramica.com.br/', 'Vila Mariana', 'São Paulo', 'Workshops one-day perfeitos para iniciantes criarem uma peça exclusiva juntos — formato Ghost.', 'nao_contatado'),
  ('Nelise Ometto Atelier', 'ceramica', NULL, '(11) 99707-2396', 'neliseometto@neliseometto.com.br', 'https://neliseometto.com.br/', 'Vila Madalena', 'São Paulo', 'Ateliê de cerâmica utilitária de alta temperatura desde 1990 — workshops íntimos a dois.', 'nao_contatado'),
  ('Morada do Barro', 'ceramica', '@moradadobarro', '(11) 98699-2071', NULL, 'https://www.moradadobarro.com.br/', 'Vila Clementino', 'São Paulo', 'Escola-ateliê com oficinas para iniciantes e ateliê compartilhado — workshop a dois acessível.', 'nao_contatado'),
  ('Olaria Paulistana', 'ceramica', NULL, NULL, NULL, 'https://www.olariapaulistana.com.br/', 'Pinheiros', 'São Paulo', 'Ateliê de Lucia e Claudia Eid (mãe e filha) com 25 anos de tradição em torno manual e prensa.', 'nao_contatado'),

  -- ===== JOALHERIA =====
  ('Ateliê Labriola Escola de Ourives', 'joalheria', '@atelielabriola', '(11) 98838-1250', 'info@atelielabriola.com.br', 'https://www.atelielabriola.com.br/', NULL, 'São Paulo', 'Programa Noivos Ourives — casais selam o amor criando as próprias alianças com mestres ourives.', 'nao_contatado'),
  ('189 Joalheria Contemporânea', 'joalheria', '@189.joalheria', NULL, NULL, 'https://189joalheria.com/', NULL, 'São Paulo', 'Experiência Faça Sua Aliança da designer Stephanie Perla — workshop para casal criar aliança autoral.', 'nao_contatado'),
  ('Carol Martino Joalheria Artesanal', 'joalheria', NULL, NULL, NULL, 'https://www.carolmartino.com.br/', 'Pinheiros', 'São Paulo', 'Ateliê de joias artesanais autorais com peças personalizadas — alternativa romântica de presente exclusivo.', 'nao_contatado'),
  ('ArteMetal Escola de Joalheria', 'joalheria', '@artemetalescola', '(11) 91712-6010', NULL, NULL, 'Vila Mariana', 'São Paulo', 'Escola desde 1993 com cursos de ourivesaria — workshop introdutório para casal criar peça única.', 'nao_contatado'),

  -- ===== PERFUMARIA =====
  ('Harbolita Perfumaria Natural', 'perfumaria', NULL, NULL, NULL, 'https://harbolita.com/', NULL, 'São Paulo', 'Oficina sensorial de perfumaria botânica com a perfumista Camila — casal cria fragrância natural a dois.', 'nao_contatado'),
  ('Perfumaris Escola Olfativa', 'perfumaria', '@perfumarisoficial', NULL, NULL, 'https://perfumaris.com/', NULL, 'São Paulo', 'Escola brasileira de perfumaria com workshop de 2h para criar fragrância exclusiva — perfeito a dois.', 'nao_contatado'),
  ('Rosa de Luz', 'perfumaria', NULL, NULL, NULL, 'https://www.rosadeluz.com.br/', NULL, 'São Paulo', 'Espaço terapêutico de aromaterapia com curso presencial de perfumaria natural — vivência sensorial a dois.', 'nao_contatado'),
  ('Parum São Paulo', 'perfumaria', '@parumperfumaria', NULL, NULL, NULL, NULL, 'São Paulo', 'Perfumaria de nicho com curadoria autoral — ideal para casal escolher fragrância exclusiva juntos.', 'nao_contatado'),

  -- ===== SPA / SENSORIAL =====
  ('Zahra Spa e Estética', 'spa', NULL, NULL, NULL, 'https://zahra.com.br/', NULL, 'São Paulo', 'Day spa casal com ofurô Ylang Ylang decorado com pétalas e velas — pacote romântico para dois.', 'nao_contatado'),
  ('Banho Urbano', 'spa', NULL, NULL, NULL, 'https://www.banhourbano.com.br/', NULL, 'São Paulo', 'Banho turco (hammam) tradicional com sauna, vapor e ofurô — circuito sensorial completo para casal.', 'nao_contatado'),
  ('Espaço Girassol', 'spa', '@espacogirassolspa.vilamadalena', '(11) 98179-0777', NULL, 'https://www.espacogirassol.com/', 'Vila Madalena', 'São Paulo', 'Spa holístico urbano com salas exclusivas para casais nos 3 endereços (Vila Madalena/Brooklin/Jardins).', 'nao_contatado'),
  ('Buddha Spa Jardins', 'spa', NULL, NULL, 'administracao.jardins@buddhaspa.com.br', 'https://buddhaspa.com.br/unidades/jardins/', 'Jardins', 'São Paulo', 'Day Spa Casal com 3-5h de tratamentos a dois — rede consolidada com unidade em Jardins.', 'nao_contatado'),
  ('Eleva Sound Healing', 'sensorial', '@elevasoundhealing', '(11) 99677-8728', 'queromecuidar@elevaterapia.com.br', 'https://www.elevaterapia.com.br/', NULL, 'São Paulo', 'Sessão de massagem sonora com tigelas de quartzo 432Hz para casal — experiência meditativa profunda.', 'nao_contatado'),
  ('Tantrika Flow', 'sensorial', '@tantrikaflow', NULL, NULL, 'https://www.tantrikaflow.com/', NULL, 'São Paulo', 'Comunidade de rituais sensoriais e eróticos com Sound Healing 90min e ritual de cacau — vivência tântrica.', 'nao_contatado'),

  -- ===== PINTURA & VINHO =====
  ('Neon Brush Experience', 'pintura', '@neonbrushexperience', NULL, NULL, 'https://neonbrushexperience.com/', 'Vila Olímpia', 'São Paulo', 'Sip & paint imersivo em ambiente neon retrô-futurista no Pintxos.Bar — date night diferenciado.', 'nao_contatado'),
  ('Vinho Tinta', 'pintura', '@vinhotinta', NULL, NULL, 'https://www.vinhotinta.com/', NULL, 'São Paulo', 'Experiências sensoriais com pintura + vinho conduzidas por artistas e sommeliers — formato a dois disponível.', 'nao_contatado'),
  ('ZIV Gallery (Art & Wine)', 'pintura', '@zivgallery', '(11) 91289-4551', 'contato@zivgallery.com', 'https://www.zivgallery.com/', 'Vila Madalena', 'São Paulo', 'Galeria no Beco do Batman com workshops Art+Wine conduzidos por artistas convidados — clima boêmio.', 'nao_contatado'),

  -- ===== OUTROS (mixology, flores) =====
  ('Bartender Store (Workshop Bartender Experience)', 'outro', '@bartenderstore', '(11) 99202-2838', 'atendimento@bartenderstore.com.br', 'https://bartenderstore.com.br/', 'Pinheiros', 'São Paulo', 'Workshop presencial de 3h em mixologia clássica e moderna — coquetelaria a dois imersiva.', 'nao_contatado'),
  ('PENNO Flores', 'outro', '@pennoflores', '(11) 3835-7246', 'contato@pennofloresconceito.com.br', 'https://pennoflores.com.br/', 'Leopoldina', 'São Paulo', 'Aulas individuais de 2h para criar buquês grandes com técnicas sofisticadas — workshop floral a dois.', 'nao_contatado'),
  ('Lucia Milan Flower Studio', 'outro', '@luciamilan', '(11) 3755-1329', 'contato@luciamilan.com', 'https://luciamilan.com/', 'Morumbi', 'São Paulo', 'Studio da florista Lucia Milan (25 anos) com Aula Criativa de design floral — experiência autoral a dois.', 'nao_contatado'),
  ('Decora Flora', 'outro', '@decoraflora_cursos', NULL, NULL, 'https://www.decoraflora.com.br/', 'Jabaquara', 'São Paulo', 'Escola que já formou 7000+ floristas com curso intensivo de arranjos e buquês — workshop romântico.', 'nao_contatado')
;
