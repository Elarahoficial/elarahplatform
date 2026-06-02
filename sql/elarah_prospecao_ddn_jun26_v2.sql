-- =============================================================
-- ELARAH — Prospecção Dia dos Namorados (v2 — com WhatsApp completo)
-- -------------------------------------------------------------
-- 38 estabelecimentos em São Paulo, TODOS com WhatsApp público
-- verificado em pelo menos 1 fonte (site/Instagram/Google Maps/
-- BaresSP/Tripadvisor/Yelp). Idempotente — pode rodar mesmo se
-- a versão anterior ja foi rodada (NOT EXISTS dedupe por nome).
--
-- Versao anterior (elarah_prospecao_ddn_jun26.sql) tinha 49
-- entradas, sendo 3 ja existentes no banco (Decora Flora, Lucia
-- Milan, Ateliê Cerâmica & Cia — removidos) e 8 sem WhatsApp
-- publico (dropados nesta versao: SEDE261, Jamila Cruzado,
-- Mariana Zoccoli, 189 Joalheria, Carol Martino, Tantrika Flow,
-- Neon Brush, Vinho Tinta).
--
-- Rode UMA VEZ no SQL Editor do Supabase. Status default:
-- 'nao_contatado'. Cidade default: 'São Paulo'.
-- =============================================================

INSERT INTO public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes, status)
SELECT 'Plou Vinhos', 'vinicola', '@plou.vinhos', '(11) 91211-1794', NULL, 'https://www.plouvinhos.com/', 'Vila Madalena', 'São Paulo', 'Wine bar e loja com 500+ rótulos, sommelière Ana Lu Torres', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Plou Vinhos'))
UNION ALL
SELECT 'Clos Winebar & Bistrô', 'vinicola', '@clos_winebar', '(11) 94188-0199', NULL, 'https://closwinebar.com.br/', 'Vila Madalena', 'São Paulo', 'Bistrô de chef vencedora do MasterChef; reservas confirmadas via WhatsApp', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Clos Winebar & Bistrô'))
UNION ALL
SELECT 'Vino! Pinheiros', 'vinicola', '@vino.pinheiros', '(11) 99563-2174', NULL, 'https://vino.com.br/', 'Pinheiros', 'São Paulo', 'Wine bar intimista colado na estação Fradique Coutinho', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Vino! Pinheiros'))
UNION ALL
SELECT 'Mistral Wine Bar', 'vinicola', '@mistral.winebar', '(11) 99210-7673', 'info@mistral.com.br', 'https://www.mistral.com.br/especiais/winebar', 'Jardim Paulistano', 'São Paulo', 'Wine bar da maior importadora do país, projeto Studio Arthur Casas', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Mistral Wine Bar'))
UNION ALL
SELECT 'Vinheria Percussi', 'vinicola', '@vinheriapercussi', '(11) 93735-5912', NULL, 'https://www.percussi.com.br/', 'Jardim América', 'São Paulo', 'Italiano dal 1985, Michelin Guide 2026; tel fixo (11) 3088-4920', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Vinheria Percussi'))
UNION ALL
SELECT 'Bocca Nera', 'vinicola', '@boccanerabar', '(11) 98421-6613', 'contato@boccanerabar.com.br', 'https://www.boccanerabar.com/', 'Vila Madalena', 'São Paulo', 'Primeiro rodízio de vinhos do mundo — clima boêmio pra casais', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Bocca Nera'))
UNION ALL
SELECT 'Bardega Wine Bar', 'vinicola', '@bardega_winebar', '(11) 95828-0480', 'reservas@bardega.com.br', 'https://bardegawinebar.com.br/', 'Itaim Bibi', 'São Paulo', '12 máquinas Enomatic com 110 vinhos em taça', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Bardega Wine Bar'))
UNION ALL
SELECT 'Casa Rios', 'gastronomia', '@casariosrestaurante', '(11) 2091-7323', NULL, 'https://www.casariosrestaurante.com.br/', 'Pinheiros', 'São Paulo', 'Restaurante dos chefs Rodrigo Aguiar e Giovanna Perrone, fogo de lenha', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Casa Rios'))
UNION ALL
SELECT 'Charco', 'gastronomia', '@charcorestaurante', '(11) 94631-4065', NULL, 'https://www.charcorestaurante.com.br/', 'Jardins', 'São Paulo', 'Cozinha autoral do chef Tuca Mezzomo (50 Best LatAm)', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Charco'))
UNION ALL
SELECT 'Kuro Restaurante', 'gastronomia', '@kurorestaurante', '(11) 91255-0906', NULL, 'https://kuroeshiro.com.br/', 'Cerqueira César', 'São Paulo', 'Omakase 1 estrela Michelin; só 10 pessoas por sessão', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Kuro Restaurante'))
UNION ALL
SELECT 'Tangará Jean-Georges', 'gastronomia', '@palaciotangara', '(11) 4904-4072', 'JeanGeorges.Tangara@oetkerhotels.com', 'https://www.experienciaspalaciotangara.com.br/', 'Panamby', 'São Paulo', 'Estrela Michelin no Palácio Tangará; pacotes Dia dos Namorados', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Tangará Jean-Georges'))
UNION ALL
SELECT 'Pasta Lab SP', 'gastronomia', '@pasta_lab_sp_', '(11) 99332-9223', 'pastalabsp@gmail.com', 'https://www.pastalabsp.com.br/', 'Sumaré', 'São Paulo', 'Escola culinária do Chef Marcelo Neri — aulas pra duplas', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Pasta Lab SP'))
UNION ALL
SELECT 'Per Possi - Escola da Pasta', 'gastronomia', '@perpossi', '(11) 97233-3821', NULL, 'https://perpossi.com.br/', NULL, 'São Paulo', 'Chef Fernanda Possi, Advisor ALMA Italia — massa fresca a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Per Possi - Escola da Pasta'))
UNION ALL
SELECT 'Cantinho Gastronomia', 'gastronomia', '@cantinho.gastronomia', '(11) 94763-4468', NULL, 'https://cantinhogastronomia.com.br/', NULL, 'São Paulo', 'Escola parceira Le Creuset — date culinário a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Cantinho Gastronomia'))
UNION ALL
SELECT 'Sassá Sushi', 'gastronomia', '@sassasushi', '(11) 99201-1605', NULL, 'https://www.sassasushi.com.br/', 'Itaim Bibi', 'São Paulo', 'Restaurante e escola do mestre Sassá — aula de sushi pra casais', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Sassá Sushi'))
UNION ALL
SELECT 'Curso de Sushi Shu Matsu', 'gastronomia', '@cursoshumatsu', '(11) 96383-8389', NULL, 'https://cursosushi.com.br/', NULL, 'São Paulo', 'Mais de 20 anos, 3000+ alunos — workshop intensivo a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Curso de Sushi Shu Matsu'))
UNION ALL
SELECT 'Original Experience', 'gastronomia', '@originalexperiencebrasil', '(11) 95555-9139', 'contato@originalexperience.com.br', 'https://originalexperience.com.br/', 'Barra Funda', 'São Paulo', 'Presentes de experiências criativas e gastronômicas pra duplas', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Original Experience'))
UNION ALL
SELECT 'Fábrica de Dengo', 'gastronomia', '@fabricadedengo', '(11) 91018-9842', NULL, 'https://dengo.com/', 'Pinheiros', 'São Paulo', 'Loja conceito bean-to-bar com tour, oficinas e personalização', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Fábrica de Dengo'))
UNION ALL
SELECT 'Mestiço Chocolates', 'gastronomia', '@mesticochocolates', '(11) 98957-5999', NULL, 'https://mesticochocolates.com/', 'Vila Olímpia', 'São Paulo', 'Bean-to-bar artesanal de Rogério Kamei — visitas e cursos a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Mestiço Chocolates'))
UNION ALL
SELECT 'Dbarros Cerâmica', 'ceramica', '@dbarros_ceramica', '(11) 99918-9132', NULL, 'https://www.dbarros.com.br/', 'Vila Madalena', 'São Paulo', 'Ateliê da arquiteta Daniela Barros — torno e esmaltação pra duplas', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Dbarros Cerâmica'))
UNION ALL
SELECT 'Ateliê Marte', 'ceramica', '@atelie.marte', '(11) 94825-6844', 'marina@marteceramica.com.br', 'https://www.marteceramica.com.br/', 'Vila Mariana', 'São Paulo', 'Workshops one-day pra iniciantes — formato Ghost a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Ateliê Marte'))
UNION ALL
SELECT 'Nelise Ometto Atelier', 'ceramica', '@neliseometto', '(11) 99707-2396', 'neliseometto@neliseometto.com.br', 'https://neliseometto.com.br/', 'Vila Madalena', 'São Paulo', 'Ateliê de cerâmica utilitária de alta temperatura desde 1990', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Nelise Ometto Atelier'))
UNION ALL
SELECT 'Morada do Barro', 'ceramica', '@moradadobarro', '(11) 98699-2071', NULL, 'https://www.moradadobarro.com.br/', 'Vila Clementino', 'São Paulo', 'Escola-ateliê com oficinas pra iniciantes — workshop a dois acessível', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Morada do Barro'))
UNION ALL
SELECT 'Olaria Paulistana', 'ceramica', '@olariapaulistana', '(11) 98224-1843', NULL, 'https://www.olariapaulistana.com.br/', 'Vila Madalena', 'São Paulo', 'Lucia e Claudia Eid (mãe e filha) — 25 anos de tradição em torno', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Olaria Paulistana'))
UNION ALL
SELECT 'Ateliê Labriola Escola de Ourives', 'joalheria', '@atelielabriola', '(11) 98838-1250', 'info@atelielabriola.com.br', 'https://www.atelielabriola.com.br/', NULL, 'São Paulo', 'Programa Noivos Ourives — casais criam as próprias alianças', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Ateliê Labriola Escola de Ourives'))
UNION ALL
SELECT 'ArteMetal Escola de Joalheria', 'joalheria', '@artemetalescola', '(11) 91712-6010', NULL, NULL, 'Vila Mariana', 'São Paulo', 'Escola desde 1993 — workshop introdutório pra casal criar peça única', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('ArteMetal Escola de Joalheria'))
UNION ALL
SELECT 'Harbolita Perfumaria Natural', 'perfumaria', '@harbolita', '(11) 97546-9023', 'contato@harbolita.com', 'https://harbolita.com/', 'Pinheiros', 'São Paulo', 'Oficinas presenciais na R. Artur de Azevedo (Pinheiros); sede Mogi das Cruzes', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Harbolita Perfumaria Natural'))
UNION ALL
SELECT 'Perfumaris Escola Olfativa', 'perfumaria', '@perfumaris.consultoria', '(11) 91036-9563', NULL, 'https://perfumaris.com/', 'Lapa', 'São Paulo', 'Rua Dom João V, 153 — Lapa; workshop 2h pra casal', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Perfumaris Escola Olfativa'))
UNION ALL
SELECT 'Rosa de Luz', 'perfumaria', '@rosadeluzbr', '(11) 99777-9666', NULL, 'https://www.rosadeluz.com.br/', 'Aclimação', 'São Paulo', 'Aromaterapia e óleos essenciais com Janaina Sauer', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Rosa de Luz'))
UNION ALL
SELECT 'Parum São Paulo', 'perfumaria', '@parumperfumaria', '(11) 91007-2786', 'contato@parum.com.br', 'https://www.parumsaopaulo.com/', 'Vila Mariana', 'São Paulo', 'Loja Shopping Plaza Sul (Vila Mariana); matriz em Cotia', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Parum São Paulo'))
UNION ALL
SELECT 'Zahra Spa e Estética', 'spa', '@spazahra', '(11) 5096-0610', 'contato@zahra.com.br', 'https://zahra.com.br/', 'Moema', 'São Paulo', 'Avenida Cotovia, 261 — Moema; ofurô Ylang Ylang pra casal', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Zahra Spa e Estética'))
UNION ALL
SELECT 'Banho Urbano', 'spa', '@banhourbano', '(11) 98461-0354', NULL, 'https://www.banhourbano.com.br/', 'Pinheiros', 'São Paulo', 'Sauna finlandesa e hammam; Rua Mourato Coelho, 1095', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Banho Urbano'))
UNION ALL
SELECT 'Espaço Girassol', 'spa', '@espacogirassolspa.vilamadalena', '(11) 98179-0777', NULL, 'https://www.espacogirassol.com/', 'Vila Madalena', 'São Paulo', 'Spa holístico urbano com salas exclusivas pra casais', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Espaço Girassol'))
UNION ALL
SELECT 'Buddha Spa Jardins', 'spa', '@buddhaspa', '(11) 91132-1847', 'administracao.jardins@buddhaspa.com.br', 'https://buddhaspa.com.br/unidades/jardins/', 'Jardim Paulista', 'São Paulo', 'Rua José Maria Lisboa, 549; Day Spa Casal 3-5h', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Buddha Spa Jardins'))
UNION ALL
SELECT 'Eleva Sound Healing', 'sensorial', '@elevasoundhealing', '(11) 99677-8728', 'queromecuidar@elevaterapia.com.br', 'https://www.elevaterapia.com.br/', NULL, 'São Paulo', 'Massagem sonora com tigelas de quartzo 432Hz pra casal', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Eleva Sound Healing'))
UNION ALL
SELECT 'ZIV Gallery', 'pintura', '@zivgallery', '(11) 91289-4551', 'contato@zivgallery.com', 'https://www.zivgallery.com/', 'Vila Madalena', 'São Paulo', 'Galeria no Beco do Batman com workshops Art+Wine', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('ZIV Gallery'))
UNION ALL
SELECT 'Bartender Store', 'outro', '@bartenderstore', '(11) 99202-2838', 'atendimento@bartenderstore.com.br', 'https://bartenderstore.com.br/', 'Pinheiros', 'São Paulo', 'Workshop presencial 3h em mixologia — coquetelaria a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('Bartender Store'))
UNION ALL
SELECT 'PENNO Flores', 'outro', '@pennoflores', '(11) 3835-7246', 'contato@pennofloresconceito.com.br', 'https://pennoflores.com.br/', 'Leopoldina', 'São Paulo', 'Aulas individuais 2h pra criar buquês — workshop floral a dois', 'nao_contatado'
WHERE NOT EXISTS (SELECT 1 FROM public.prospects WHERE LOWER(nome) = LOWER('PENNO Flores'))
;
