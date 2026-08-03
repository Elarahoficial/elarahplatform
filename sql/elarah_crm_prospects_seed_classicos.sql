-- =============================================================
-- ELARAH — Seed: Prospects "clássicos" (crochê, perfumaria, cerâmica,
--                floral, gastronomia, bordado, vela, doceria) — SP
-- -------------------------------------------------------------
-- Insere prospects novos direto na tabela prospects (sem CSV), pra
-- não recriar o que o admin já excluiu nem sobrescrever edições.
--
-- Nomes já cadastrados no seed CSV (data/prospects-seed-v1.csv) NÃO
-- se repetem aqui. Ainda assim, tudo é idempotente por lower(nome).
--
-- SOBRE OS WHATSAPP
--   Números vieram de sites oficiais e diretórios públicos (bios do
--   Instagram/sites davam 403 na coleta). Estão no campo whatsapp
--   pra facilitar o disparo, mas CONFIRME na bio/site antes de
--   mandar mensagem. Onde não achei número, whatsapp fica null e a
--   observação indica onde buscar (site/Instagram/e-mail).
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS por lower(nome) — pode rodar várias
--   vezes sem duplicar. Prospects já editados são preservados.
-- =============================================================


-- Pré-checagem: aborta se a tabela prospects não existir.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prospects'
  ) then
    raise exception 'Tabela public.prospects não existe. Rode sql/elarah_crm_prospects.sql primeiro.';
  end if;
end $$;



-- =============================================================
-- CROCHÊ / TRICÔ / TÊXTIL
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Novelaria', 'croche', 'novelaria', '11970992463', null, 'https://novelaria.com.br/', 'Pinheiros', 'São Paulo', 'Referência e comunitário. Knit café + loja de fios com salas de aula de tricô, crochê, macramê, punch needle e costura, do básico ao avançado, com professoras convidadas (também unidade em Moema, Av. Ibijaú 301). Quase um clube — ótimo pra experiências abertas ao público. Fixo alternativo (11) 3729-7188.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Novelaria'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Mi Atelier Handmade', 'croche', 'miatelier.handmade', '11986686485', null, 'https://miatelierhandmade.com/', 'Pinheiros', 'São Paulo', 'Autoral e acolhedor. Cursos presenciais de tricô, crochê, costura e bordado em turmas pequenas, com comunidade forte de alunas e foco em ensino próximo e projetos autorais. Confirmar endereço exato no contato.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Mi Atelier Handmade'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Tikva Handmade', 'croche', 'tikvahandmade', '11982109493', null, 'https://tikvahandmade.com.br/', 'Pacaembu', 'São Paulo', 'Boutique e afetivo. Ateliê da artesã Adriana (Tikva = esperança) com pacotes de aulas e oficinas de crochê, tricô e bordado, pra adultos e kids/teens, em turmas reduzidas. Confirmar endereço exato no contato.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Tikva Handmade'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Entrelinhas Espaço Criativo', 'croche', 'costuraentrelinhas', '11989777471', null, 'https://costuraentrelinhas.com.br/', 'Ipiranga', 'São Paulo', 'Escola-ateliê consolidada (desde 2013). Aulas presenciais, online e workshops de um dia em costura criativa, bordado, patchwork e crochê. Visitas com agendamento. Fixo (11) 4119-9449.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Entrelinhas Espaço Criativo'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Juliana Maia Ateliê Têxtil', 'croche', 'jumaia18', null, null, 'https://juliana-maia.com/', 'Vila Anglo Brasileira', 'São Paulo', 'Autoral e premium. Artesã têxtil que ministra cursos de tecelagem manual em tear de pente liço (iniciante a avançado), produzindo tapeçarias de parede a partir de projetos próprios. Forte apelo artístico. WhatsApp a pegar no site/Instagram.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Juliana Maia Ateliê Têxtil'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Curso Donna Rô Macramê', 'croche', 'cursodonnaromacrame', null, null, null, 'Tatuapé', 'São Paulo', 'Nicho de macramê. Rosana Affonso dá cursos presenciais recorrentes (terças e quartas) do básico aos nós avançados, no Ateliê Palácio das Bonecas (Tatuapé/Vila Carrão). Agendamento pelo Instagram — pegar WhatsApp na bio.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Curso Donna Rô Macramê'));


-- =============================================================
-- PERFUMARIA / AROMATERAPIA
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Perfumaris Escola de Perfumaria', 'perfumaria', 'perfumarisoficial', null, null, 'https://perfumaris.com/', 'Alto da Lapa', 'São Paulo', 'Casa técnica e séria. Escola brasileira de perfumaria (ensino e pesquisa) na Rua Sales Júnior 334; além das formações longas, roda oficinas de 2h em que o participante cria seu perfume guiado por perfumista, com acervo de matérias-primas finas. WhatsApp a confirmar (inscrições pelo site).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Perfumaris Escola de Perfumaria'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Rosa de Luz', 'perfumaria', 'rosadeluzbr', '11997779666', null, 'https://rosadeluz.com.br/', 'Aclimação', 'São Paulo', 'Perfumaria com propósito. Espaço terapêutico e loja de aromaterapia (Janaina Sauer) na Rua Diamante 74; curso teórico-prático de perfumaria natural 100% óleos essenciais (com Theo Bibancos). Cruza criação autoral com bem-estar. WhatsApp de diretório — confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Rosa de Luz'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Realindo', 'perfumaria', 'realindo_', null, null, 'https://realindo.com.br/', 'Pinheiros', 'São Paulo', 'Design e narrativa. Marca paulistana de perfumes autorais que roda oficinas (~3h) com Bruno Dalto no M.o.a Estúdio (Rua Cônego Eugênio Leite 944): cada um trabalha memórias e sai com um perfume próprio. Público jovem/urbano. WhatsApp a pegar no site (realindo.com.br/oficina).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Realindo'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select '1 Nariz', 'perfumaria', '1nariz', null, 'oi@1nariz.com.br', 'https://1nariz.com.br/', null, 'São Paulo', 'Autoridade no tema. Cursos e consultoria de perfumaria de Dênis Pagani (referência olfativa no Brasil desde 2012), com aulas presenciais aos sábados focadas em alfabetização olfativa. Nome forte pra conteúdo/co-marketing. Local varia por turma; contato oi@1nariz.com.br.'
where not exists (select 1 from public.prospects where lower(nome) = lower('1 Nariz'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Aromaflora', 'aromaterapia', 'aromaflora_aromaterapia', '11977116744', null, 'https://aromaflora.com.br/', 'Vila Mariana', 'São Paulo', 'Base científica e sensorial. Escola de aromaterapia (desde 2004) com oficinas presenciais como Aromas e Emoções e Aromas Ambientais, ensinando a compor perfumes pessoais e ambientais. Bom pra experiências de autoconhecimento. Também fixo (11) 5084-2921.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Aromaflora'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Oficina da Essência', 'perfumaria', null, null, null, null, 'Ipiranga', 'São Paulo', 'Lúdico e acessível. Criação de perfumes personalizados via perfumoterapia, com kit de 14 acordes olfativos pré-compostos pro participante montar a fragrância — formato leve de grupo/presente (Rua Bom Pastor 1509). Confirmar Instagram e telefone/WhatsApp (fixo listado (11) 2066-4500).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Oficina da Essência'));


-- =============================================================
-- CERÂMICA
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'A Oficina Cerâmica', 'ceramica', 'aoficinaceramica', null, null, 'https://aoficinaceramica.com/', 'Mooca', 'São Paulo', 'Nova e bem equipada. Escola inaugurada em 2025 pela ceramista Marina (Rua dos Campineiros 398): salas de modelagem, sala com 4 tornos, esmaltação e jardim; aulas regulares, ateliê livre e workshops de torno/modelagem pra todos os níveis. WhatsApp a confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('A Oficina Cerâmica'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Escola Olive', 'ceramica', 'escolaolive', '11910106175', null, 'https://escolaolive.com.br/', 'Água Branca', 'São Paulo', 'Curadoria estética e boa infra. Marca de cerâmica utilitária com escola própria ao lado do Parque da Água Branca (Rua Dona Germaine Burchard 239); workshops de 3h (o aluno leva a peça; esmaltação e queima por conta da escola) e cursos regulares. WhatsApp de snippet — confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Escola Olive'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Niuá Cerâmica', 'ceramica', 'niua.ceramica', null, null, 'https://niua-ceramica.com.br/', 'Mirandópolis', 'São Paulo', 'Autoral e intimista. Ateliê da ceramista Carol Tsai (Rua Luís Góis 357) com cursos de torno elétrico e modelagem, oficinas pontuais (inclusive infantis) e curso de ilustração em cerâmica; turmas pequenas. Inscrições por site/Linktree — pegar WhatsApp na bio.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Niuá Cerâmica'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Terra W Estúdio', 'ceramica', 'terrawestudio', '11991627946', 'contatoterraw@gmail.com', 'https://terrawestudio.com.br/', 'Alto de Pinheiros', 'São Paulo', 'Tradicional e consolidado. Ateliê-escola de cerâmica de alta temperatura da ceramista Diane Cossermelli, fundado em 1998 — um dos mais consolidados da cidade (17k seguidores). Peso de legado. WhatsApp/telefone oficial (11) 99162-7946.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Terra W Estúdio'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Casa Baró', 'ceramica', 'casa.baro', null, null, 'https://casabaro.com.br/', 'Tremembé', 'São Paulo', 'Estética cuidada e história familiar. Fundado em 2020 por Luciana Verzaro e a filha Gabriela (arquiteta); workshops presenciais de modelagem em alta temperatura, inclusive formato workshop-presente — encaixe natural com o modelo Elarah. Reservas por link no site/Instagram.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Casa Baró'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Cerâmica Ártico', 'ceramica', 'ceramicasartico', null, null, 'https://ceramicasartico.com.br/', 'Cidade São Francisco', 'São Paulo', 'Experiência criativa e eventos temáticos. Ateliê coletivo (Rua Mal. Olímpio Mourão Filho 87, Zona Oeste) com aulas presenciais, workshops temáticos ao longo do ano e serviço de queima em forno elétrico. WhatsApp a confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Cerâmica Ártico'));


-- =============================================================
-- FLORAL
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'A Pequena Loja de Flores', 'floral', 'apequenalojadeflores', '11983351683', null, 'https://apequenalojadeflores.com/', 'Pinheiros', 'São Paulo', 'Charmosa e intimista. Banca-ateliê na Rua Fradique Coutinho 211 (aberta nos fins de semana) referência em arranjos autorais; oficinas de 8 a 10 alunos com flores, folhagens e vaso inclusos — o aluno monta e leva a peça. Confirmar @ e se o telefone é WhatsApp.'
where not exists (select 1 from public.prospects where lower(nome) = lower('A Pequena Loja de Flores'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Se Flor Pra Ser', 'floral', 'seflorpraser', '11947099980', null, 'https://seflorpraser.com.br/', 'Vila Ester', 'São Paulo', 'Colorido e descontraído (~53k seguidores). Ateliê floral na Rua Maria Curupaiti 441 (Zona Norte) com workshops mãos-à-obra e voucher-presente de oficina — ótimo gancho de parceria de experiência. WhatsApp de diretório — confirmar (havia também (11) 97234-2711).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Se Flor Pra Ser'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Decora Flora', 'floral', 'decoraflora', '11976212192', null, 'https://decoraflora.com.br/', 'Jabaquara', 'São Paulo', 'Profissionalizante e estruturada. Escola (com estacionamento) no Green Work Boulevard, a 700m do metrô Jabaquara; cursos presenciais e online de arte floral, arranjos e buquês (2 a 3 dias, ~10 técnicas). Bom pra público que quer aprofundar. Confirmar @.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Decora Flora'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'ICI Flores', 'floral', 'iciflores', '11976111010', null, 'https://iciflores.com.br/', 'Vila Madalena', 'São Paulo', 'Curatorial e midiática. Escola desde 2004 da arquiteta e paisagista Lú Gallottini (Rua Dr. Alberto Seabra 774); cursos de flores naturais que incluem visita guiada ao Mercadão das Flores — experiência além da bancada. Também fixo (11) 3023-3039.'
where not exists (select 1 from public.prospects where lower(nome) = lower('ICI Flores'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Escola Técnica de Arte Floral (ETAF)', 'floral', 'escolatecnicadeartefloral', null, null, 'https://escolatecnicadeartefloral.com.br/', 'Tatuapé', 'São Paulo', 'Técnica e autoral de alto nível. Fundada pelo artista Val du Arte (Rua Nova Jerusalém 1150); apontada como 1ª escola do Brasil a emitir o certificado europeu Floral Designer (FlorCert/Itália), turmas até 12, até 70% práticas com material incluso. WhatsApp a confirmar (fixo (11) 2092-2439).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Escola Técnica de Arte Floral (ETAF)'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Escola Paulista de Arte Floral', 'floral', null, '11995040428', null, 'https://escolapaulistadeartefloral.com.br/', 'Zona Norte', 'São Paulo', 'Formação em design floral com aulas teóricas e práticas e locação de salas equipadas (Rua Hayden, Zona Norte). Foi a de menos dados confirmados do lote — confirmar Instagram, bairro exato e WhatsApp (de snippet) antes de priorizar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Escola Paulista de Arte Floral'));


-- =============================================================
-- GASTRONOMIA
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Kosu', 'gastronomia', 'kosusushi', '11987660030', null, 'https://kosu.com.br/', 'Vila Romana', 'São Paulo', 'Imersão de um dia. Escola de culinária japonesa descomplicada (quase 10 anos formando sushimen) na Rua Espártaco 115; curso hands-on de sushi e sashimi aos sábados (6h) com faca, avental e tábua inclusos. WhatsApp oficial confirmado (11) 98766-0030.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Kosu'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Mission Chocolate', 'gastronomia', 'missionchocolate', null, 'arcelia@missionchocolate.com', 'https://missionchocolate.com.br/', 'Brooklin', 'São Paulo', 'Premium e premiado. Marca de Arcelia Gallardo (chocolate mais premiado do Brasil, 50+ prêmios); degustações e aulas bean-to-bar do cacau à barra (fábrica na Rua Nova York 498; café na Rua Califórnia 808). Contato de cursos por e-mail.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Mission Chocolate'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Accademia Gastronomica', 'gastronomia', 'agastronomica', null, null, 'https://agastronomica.com.br/', 'Moema', 'São Paulo', 'Mão na massa sem stress. Escola na Rua Inhambu 1126 com salas pra execução individual e terraço com forno de pizza; aulas monotemáticas avulsas (3-4h), formato perfeito pra experiências pontuais. WhatsApp a confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Accademia Gastronomica'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Liceu Casa Gastronômica', 'gastronomia', 'liceucasagastronomica', '11945379537', null, 'https://liceucasagastronomica.com.br/', 'Ipiranga', 'São Paulo', 'Panificação e confeitaria. Casa de cursos práticos com material incluso (Rua Bom Pastor 1694, sobreloja); aulas de um dia (10h-17h) que ensinam o levain do zero, além de doces finos. WhatsApp oficial confirmado (11) 94537-9537.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Liceu Casa Gastronômica'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Instituto Brasil a Gosto', 'gastronomia', 'institutobrasilagosto', null, null, 'https://brasilagosto.org/', 'Liberdade', 'São Paulo', 'Cozinha brasileira com narrativa. Instituto da chef Ana Luiza Trajano; entre os cursos hands-on está o de Queijos Brasileiros (queijo fresco, cru e coalhada, com degustação comparativa). Aulas vendidas pela plataforma FoodPass.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Instituto Brasil a Gosto'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Receitaria Escola Gourmet', 'gastronomia', 'receitaria', '11968095409', null, 'https://receitaria.com/', 'Pinheiros', 'São Paulo', 'Recreativa e de alta rotatividade. Escola que usa utensílios domésticos pra qualquer nível reproduzir pratos de chefs (Rua Fradique Coutinho 600; 2ª unidade no Jardim das Bandeiras); aulas rápidas de culinária, confeitaria, panificação e cozinhas do mundo. WhatsApp visto em post do perfil — confirmar (fixo (11) 2892-0031).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Receitaria Escola Gourmet'));


-- =============================================================
-- BORDADO
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'O Clube do Bordado', 'bordado', 'clubedobordado', null, null, 'https://oclubedobordado.com.br/', 'Vila Romana', 'São Paulo', 'Marca com comunidade enorme (340k+ seguidores). Um dos maiores nomes de bordado livre do Brasil, cursos presenciais e online com linguagem contemporânea e estética cuidada — ótima pra atrair iniciantes. Confirmar endereço atual da turma presencial.'
where not exists (select 1 from public.prospects where lower(nome) = lower('O Clube do Bordado'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Cursos Thelma Korte', 'bordado', null, null, null, 'https://cursostk.com/', 'Sumaré', 'São Paulo', 'Nicho sofisticado. Ateliê-escola de bordado com pedrarias, missangas e customização (inclusive chinelos bordados) na Rua Apinajés 1866, perto do metrô Vila Madalena; oficinas de 1 a 2 dias. Confirmar Instagram e WhatsApp (fixo listado (11) 4119-2011).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Cursos Thelma Korte'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Maii Handmade', 'bordado', 'maii__handmade', null, null, 'https://maiihandmade.com/', null, 'São Paulo', 'Punch needle autoral. Artista referência em punch needle com workshops de dia inteiro, inclusive retrato bordado a partir de foto; forte apelo visual. ATENÇÃO: base/cidade não confirmada em fonte confiável — confirmar se a oficina fica em SP antes de abordar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Maii Handmade'));


-- =============================================================
-- VELA / AROMATERAPIA
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Empório das Velas', 'vela', 'emporiodasvelas', '11967670305', null, 'https://emporiodasvelas.com.br/', 'Moema', 'São Paulo', 'Loja + escola consolidada. Vende matéria-prima (ceras, pavios, essências) e dá cursos presenciais e online de velas artesanais (Av. Pavão 580, Indianópolis). Bom pra parceria com fornecimento de insumos junto à experiência. WhatsApp de diretório — confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Empório das Velas'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Vê.la Velas Aromáticas', 'vela', 've.la_natural', null, null, 'https://velanatural.com.br/', 'Pinheiros', 'São Paulo', 'Autoral, vegana e sensorial. Marca de velas aromáticas veganas (ceras vegetais) com oficina criativa de 2h+ conduzida pela aromaterapeuta Tatiana Lobo (R. Artur de Azevedo 675; edições também no Jardim Pamplona Shopping). Muito alinhada ao posicionamento Elarah. Reservas pelo site.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Vê.la Velas Aromáticas'));


-- =============================================================
-- DOCERIA / CONFEITARIA
-- =============================================================
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Flakes Academy', 'doceria', 'flakesacademy', null, null, 'https://escolaflakes.com.br/', 'Moema', 'São Paulo', 'Apelo pop e viral (1M+ seguidores da marca). Escola de confeitaria 100% prática com cursos curtos e longos (Alameda Jauaperi 1241; unidades Itaim e Brooklin) — ótima pra atrair público jovem pra workshops de curta duração. WhatsApp a confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Flakes Academy'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Les Chefs Academia', 'doceria', null, '11934116688', null, 'https://leschefsacademia.com.br/', 'Tatuapé', 'São Paulo', 'Base francesa acessível. Academia de culinária com foco em confeitaria francesa (Rua Henrique Vasconcelos 10); cursos de chef confeiteiro, brigadeiro gourmet e patisserie, inclusive módulos curtos. Confirmar Instagram e WhatsApp (também fixo (11) 2097-0806).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Les Chefs Academia'));

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Escola Fran Tonello', 'doceria', null, null, null, 'https://escolafrantonello.com.br/', 'Vila Olímpia', 'São Paulo', 'Nicho saudável/funcional. Escola de gastronomia funcional (R. Gomes de Carvalho 621, sala 1202) com workshop presencial de trufas e bombons saudáveis (sem açúcar e sem lactose) e temperagem de chocolate — ângulo curatorial distinto. Confirmar Instagram e WhatsApp (fixo (11) 2307-6772).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Escola Fran Tonello'));


-- =============================================================
-- TEMPLATES DE MENSAGEM por categoria (primeiro contato)
-- Variáveis: {{nome}}, {{bairro}}. (Evitamos {{categoria}} pra não
-- exibir o valor cru.) Idempotente por nome.
-- =============================================================
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Crochê / Tricô / Têxtil', 'croche', E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Amei o trabalho de {{nome}} no {{bairro}} — oficinas de crochê/tricô/têxtil são exatamente o tipo de experiência manual e afetiva que mais converte na nossa plataforma (encontros de amigas, autocuidado, presentes).\n\nPosso te explicar como funciona uma parceria? Em geral, parceiros recebem alunos novos todo mês, sem custo de mídia.\n\nObrigada! 🧡', 30, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Crochê / Tricô / Têxtil'));

insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Perfumaria olfativa', 'perfumaria', E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Acompanho o {{nome}} e adorei a proposta — criar o próprio perfume é uma das experiências sensoriais que mais encantam o nosso público (presente, date, autoconhecimento).\n\nFaz sentido conversarmos sobre uma parceria? Sem compromisso.\n\nObrigada! 🧡', 31, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Perfumaria olfativa'));

insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Arranjos florais', 'floral', E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Me apaixonei pelo trabalho de {{nome}} — oficinas de arranjos florais têm um apelo lindo de experiência (presente afetivo, encontro em grupo, autocuidado) e combinam demais com o nosso público.\n\nPosso te contar como funciona uma parceria?\n\nObrigada! 🧡', 32, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Arranjos florais'));

insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Bordado', 'bordado', E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Amo o trabalho de {{nome}} — bordado é uma experiência manual e meditativa que nosso público adora (encontros de amigas, autocuidado, presentes autorais).\n\nTopa conversar sobre uma parceria? Levamos alunos novos sem custo de mídia pra você.\n\nObrigada! 🧡', 33, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Bordado'));

insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Velas aromáticas', 'vela', E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Adorei a proposta do {{nome}} — oficinas de velas aromáticas são uma experiência sensorial e relaxante que combina muito com o nosso público (autocuidado, presente, encontro em grupo).\n\nPosso te explicar como funciona uma parceria?\n\nObrigada! 🧡', 34, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Velas aromáticas'));

notify pgrst, 'reload schema';

-- VERIFICAÇÃO:
--   select categoria, count(*) from public.prospects
--   where categoria in ('croche','perfumaria','aromaterapia','ceramica','floral','gastronomia','bordado','vela','doceria')
--   group by categoria order by categoria;