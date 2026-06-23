-- =============================================================
-- ELARAH — Prospecção Cultural (junho 2026)
-- -------------------------------------------------------------
-- 50 estabelecimentos REAIS em São Paulo capital, pesquisados
-- por busca pública (sites oficiais + Instagram ativo), focados
-- em SEGMENTOS CULTURAIS NOVOS — deliberadamente fora do que a
-- Elarah já cobre (cerâmica, vela, vinho/wine bar, perfumaria,
-- spa, gastronomia padrão). Status default: 'nao_contatado'.
--
-- Ênfase em cultura, leitura e vivências sensoriais diferentes:
--   - Literatura & escrita (clubes de leitura, escrita criativa,
--        poesia/sarau, caligrafia, contação) ............... 12
--   - Cultura japonesa & chá (cerimônia do chá, ikebana,
--        origami, shodô, sumi-ê, sake) .................... 11
--   - Artes visuais & impressão (gravura, serigrafia,
--        tipografia, aquarela/urban sketch, mosaico, vitral) . 8
--   - Música, dança & teatro (gafieira, tango, choro, vinil,
--        improv, teatro, fotografia analógica, percussão) .. 10
--   - Natureza & ofícios (bonsai, kokedama, jardinagem,
--        tecelagem, costura criativa, astronomia) .......... 9
--
-- DEDUPE: nenhum destes repete os parceiros/prospects já na base
-- (conferido contra data/prospects-seed-v1.csv e os seeds
-- elarah_prospecao_ddn_jun26[_v2].sql). Mesmo assim, a inserção
-- usa WHERE NOT EXISTS por lower(nome) — idempotente, pode rodar
-- quantas vezes precisar sem duplicar nem sobrescrever edições
-- feitas na mão pelo admin.
--
-- LACUNAS DE CONTATO: e-mail/WhatsApp públicos são raros nesses
-- segmentos. Deixados NULL onde não confirmados (preencher na
-- 1a interação). A abordagem inicial mais provável aqui é DM no
-- Instagram. Onde o handle foi inferido da busca (sem abrir o
-- perfil 1 a 1), vale conferir antes do primeiro contato — vide
-- nota no rodapé.
--
-- Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================


-- Pré-checagem: aborta com mensagem clara se a tabela prospects
-- ainda não existir (depende de sql/elarah_crm_prospects.sql).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prospects'
  ) then
    raise exception 'Tabela public.prospects não existe. Rode sql/elarah_crm_prospects.sql primeiro.';
  end if;
end $$;


with curated(nome, categoria, instagram, whatsapp, email, site, bairro, observacoes) as (
  values

    -- ============= LITERATURA & ESCRITA (12) =============
    ('Tarayrefúgio', 'escrita_criativa', '@tarayrefugio', null, 'tarayrefugio@gmail.com', 'https://www.tarayrefugio.com.br', 'Vila Madalena',
     'Refúgio criativo com oficinas de escrita criativa, encontros literários e clubes de leitura em ambiente acolhedor.'),
    ('Casa do Saber', 'escrita_criativa', '@casadosaber', null, null, 'https://www.casadosaber.com.br', 'Itaim Bibi',
     'Centro cultural com cursos e oficinas de escrita criativa, literatura e clubes de leitura conduzidos por escritores renomados.'),
    ('Estúdio L21', 'escrita_criativa', '@estudio21sp', null, null, 'https://www.estudio21.com.br', 'Vila Madalena',
     'Escola de escrita criativa com oficinas de conto, romance e narrativa conduzidas por autores premiados.'),
    ('Livraria Megafauna', 'clube_leitura', '@livrariamegafauna', null, null, 'https://www.livrariamegafauna.com.br', 'Centro (Edifício Copan)',
     'Livraria-ícone no Copan com clubes de leitura, lançamentos, debates e festival de poesia.'),
    ('Tapera Taperá', 'clube_leitura', '@taperatapera', null, null, 'https://taperatapera.com.br', 'República (Galeria Metrópole)',
     'Livraria e centro cultural sem fins lucrativos no centro com clubes de leitura, minicursos, debates e lançamentos.'),
    ('Banca Tatuí', 'clube_leitura', '@bancatatui', null, null, null, 'Santa Cecília',
     'Livraria independente especializada em fanzines e literatura alternativa, com saraus e encontros literários.'),
    ('Livraria Patuscada', 'clube_leitura', '@livrariapatuscada', null, null, null, 'Vila Madalena',
     'Livraria-café da editora Patuá que promove saraus, recitais, oficinas literárias e clubes de leitura.'),
    ('Sarau da Cooperifa', 'poesia', '@saraudacooperifa', null, null, null, 'Capão Redondo',
     'Sarau de poesia mais icônico da periferia de SP, encontro cultural semanal às quartas-feiras.'),
    ('Casa das Rosas', 'poesia', '@casadasrosas.poesia', null, null, 'https://www.casadasrosas.org.br', 'Av. Paulista',
     'Museu de literatura na Avenida Paulista com saraus, recitais de poesia e oficinas literárias.'),
    ('Estúdio Lettering SP', 'caligrafia', '@estudiolettering', null, null, null, 'Vila Madalena',
     'Estúdio dedicado a workshops de caligrafia e lettering, com aulas de brush pen e caligrafia tradicional.'),
    ('Caligrafia Capilé', 'caligrafia', '@marianacapile', null, null, null, 'Pinheiros',
     'Calígrafa profissional que ministra workshops de caligrafia com pena e tinta em ambiente intimista.'),
    ('Quchá', 'contacao', '@qucha.cha', null, null, null, 'Pinheiros',
     'Casa de chá e espaço cultural que une contação de histórias e literatura à cerimônia do chá.'),


    -- ============= CULTURA JAPONESA & CHÁ (11) =============
    ('Mori Chazeria', 'cerimonia_cha', '@mori.chazeria', null, null, null, 'Paraíso',
     'Casa de chá nipônica da sommelier Paty Akemi, com cerimônia de matcha, workshops e wagashi.'),
    ('T&M Chás & Meditação', 'degustacao_cha', '@teaandm.oficial', null, null, null, 'Vila Nova Conceição',
     'Casa de chá e meditação com experiências sensoriais e workshops de cerimônia do chá japonesa.'),
    ('Chá Dō', 'cerimonia_cha', '@chado.oficial', null, 'falecom@chado.com.br', 'https://chado.com.br', 'Alto de Pinheiros',
     'Sommelier de chá que oferece vivências e demonstrações da cerimônia do chá (chadô).'),
    ('Centro de Chado Urasenke do Brasil', 'cerimonia_cha', '@cerimoniacha', null, null, 'https://www.chadourasenke.org.br', 'Liberdade',
     'Representante oficial da escola Urasenke no Brasil, com cursos e demonstrações de chanoyu.'),
    ('Aliança Cultural Brasil-Japão', 'shodo', '@culturaalianca', null, null, 'https://site.aliancacultural.org.br', 'Liberdade',
     'Centro cultural com cursos presenciais de shodô, sumi-ê, origami e ikebana.'),
    ('Ikebana Sogetsu São Paulo', 'ikebana', null, null, null, 'https://www.ikebanasogetsu.com.br', 'São Paulo',
     'Escola da tradição Sogetsu com aulas presenciais de arranjo floral japonês.'),
    ('Adelina Instituto', 'sumie', null, null, 'oi@adelina.org.br', 'https://adelina.org.br', 'Perdizes',
     'Instituto cultural com oficinas de ikebana e sumi-ê conduzidas por mestres formados no Japão.'),
    ('Japan House São Paulo', 'shodo', '@japanhousesp', null, null, 'https://japanhousesp.com.br', 'Bela Vista',
     'Centro cultural na Paulista com workshops de shodô, degustação de matcha e festival do sake.'),
    ('Fundação Japão em São Paulo', 'origami', '@japanfoundation_sp', null, 'info@fjsp.org.br', 'https://fjsp.org.br', 'Vila Mariana',
     'Instituição oficial japonesa com oficinas de origami, kirigami, sumi-ê e shodô.'),
    ('Adega de Sake', 'sake', '@adegadesake', null, null, 'https://www.adegadesake.com.br', 'Moema',
     'Primeira loja especializada em saquê do Brasil, com curadoria Sake Samurai e degustações.'),
    ('Itigo Sake House', 'sake', null, null, null, null, 'Jardins',
     'Izakaya especializada em saquê com mais de 30 rótulos e menus de degustação guiada.'),


    -- ============= ARTES VISUAIS & IMPRESSÃO (8) =============
    ('Ateliê Piratininga', 'gravura', '@ateliepiratininga', null, null, 'https://ateliepiratininga.com.br', 'Vila Madalena',
     'Ateliê-escola tradicional de gravura em metal, xilogravura e litografia com cursos regulares e oficinas avulsas.'),
    ('Sarará Estúdio', 'serigrafia', '@sarara.estudio', null, null, null, 'Vila Madalena',
     'Estúdio de serigrafia artesanal que oferece workshops de impressão manual em papel e tecido.'),
    ('Ateliê Fidalga', 'gravura', '@ateliefidalga', null, null, 'https://ateliefidalga.com.br', 'Vila Madalena',
     'Reconhecido ateliê de artistas com cursos de gravura e processos de impressão de arte contemporânea.'),
    ('Tipografia Some', 'tipografia', '@tipografiasome', null, null, null, 'Barra Funda',
     'Estúdio de tipografia e impressão tipográfica (letterpress) com oficinas em prensas antigas.'),
    ('Escola São Paulo', 'aquarela', '@escolasaopaulo', null, null, 'https://www.escolasaopaulo.org', 'Pinheiros',
     'Escola de criatividade com cursos livres de aquarela, desenho de observação e urban sketching.'),
    ('Clube de Desenho', 'urban_sketch', '@clubededesenho', null, null, null, 'Pinheiros',
     'Coletivo que organiza encontros de urban sketching e desenho de observação pela cidade.'),
    ('Atelier Mosaico Brasil', 'mosaico', '@mosaicobrasil', null, null, 'https://www.mosaicobrasil.com.br', 'Pinheiros',
     'Ateliê especializado em mosaico com cursos regulares e workshops de iniciação à técnica.'),
    ('Bug Vitrais', 'vitral', '@bugvitrais', null, null, null, 'Vila Mariana',
     'Ateliê de vitrais que oferece cursos da técnica Tiffany e workshops de criação de peças autorais.'),


    -- ============= MÚSICA, DANÇA & TEATRO (10) =============
    ('Gafieira da Ladeira', 'danca_salao', '@gafieiradaladeira', null, null, null, null,
     'Escola de SP focada em samba de gafieira, com aulas e bailes há mais de 10 anos.'),
    ('Espaço Vila', 'danca_salao', '@espacoviladancaearte', null, null, 'https://www.espacovila.com.br', null,
     'Escola de dança de salão com turmas de gafieira, forró e tango e aula experimental.'),
    ('Tango B''Aires São Paulo', 'tango', '@tango.baires.sp', null, null, null, null,
     'Espaço com 25 anos de experiência em tango, ideal para aulas e vivências para casais.'),
    ('Escola de Choro de São Paulo', 'choro', '@escoladechorosp', null, null, 'https://escoladechorosp.wixsite.com/ecsp', 'Vila Madalena',
     'Rodas de choro abertas e gratuitas toda quinta às 19h, além de aulas de instrumentos.'),
    ('Sala Bar', 'vinil', '@salabarsp', null, null, null, 'Pinheiros',
     '"Boteco de discos" e sala de música com curadoria em vinil, clima intimista.'),
    ('Caracol Bar', 'vinil', '@caracol.bar', null, null, null, 'Santa Cecília',
     'Um dos primeiros listening bars de SP, com coquetelaria autoral e música analógica.'),
    ('Improclube', 'improv', '@improclube', null, null, 'https://www.osimprovaveis.com', null,
     'Escola e companhia de improvisação teatral com aulas presenciais em SP.'),
    ('Teatro Escola Braapa', 'teatro', null, null, null, 'https://cursodeteatro.com.br', 'Higienópolis',
     'Escola de teatro com workshops de clown e jogos de improvisação em grupo.'),
    ('Imágicas Laboratório Fotográfico', 'fotografia', null, null, null, 'https://www.imagicas.com.br', null,
     'Laboratório de revelação analógica P&B com cursos, oficinas e o Clube do Analógico.'),
    ('Sala do Batuque', 'percussao', '@saladobatuque_', null, null, 'https://saladobatuque.com.br', null,
     'Escola de percussão brasileira fundada em 2010, com aulas e oficinas em grupo.'),


    -- ============= NATUREZA & OFÍCIOS (9) =============
    ('Suiseki Bonsai', 'bonsai', '@suisekibonsai', null, null, 'https://www.suisekibonsai.com.br', 'Saúde',
     'Um dos maiores centros de bonsai da América Latina, com workshops para iniciantes e venda de pré-bonsai.'),
    ('Mestre Bonsai', 'bonsai', '@mestrebonsai', null, null, 'https://www.mestrebonsai.com.br', 'Vila Mariana',
     'Espaço com cursos presenciais e oficinas de bonsai para todos os níveis.'),
    ('Ateliê Verde Vivo', 'kokedama', '@verdevivokokedama', null, null, null, 'Pinheiros',
     'Oficinas de kokedama e terrários com plantas ornamentais para iniciantes.'),
    ('Quintal Agroecológico', 'jardinagem', '@quintalagroecologico', null, null, null, null,
     'Vivências de horta urbana e agroecologia em São Paulo.'),
    ('Ateliê Vivenda Tear', 'tecelagem', '@vivendatear', null, null, null, null,
     'Ateliê de tecelagem manual com cursos de tear de pente liço e tapeçaria.'),
    ('A Trama Tecelagem', 'tecelagem', '@atrama.tecelagem', null, null, null, null,
     'Estúdio de tecelagem manual com workshops de tear e fios naturais.'),
    ('Sítio do Tear', 'tecelagem', null, null, null, 'https://www.sitiodotear.com.br', null,
     'Escola de tecelagem manual e fiação com cursos presenciais para iniciantes.'),
    ('Atelier Mariana Audi', 'costura', '@marianaaudi', null, null, 'https://www.marianaaudi.com.br', 'Pinheiros',
     'Ateliê-escola de costura criativa e moda com cursos de modelagem e upcycling.'),
    ('Fundação Planetário de São Paulo', 'astronomia', null, null, null, null, 'Ibirapuera',
     'Sessões de cúpula e observação astronômica abertas ao público no Parque Ibirapuera.')

)
insert into public.prospects (
  nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes, status
)
select
  c.nome, c.categoria, c.instagram, c.whatsapp, c.email, c.site, c.bairro,
  'São Paulo', c.observacoes, 'nao_contatado'
from curated c
where not exists (
  select 1 from public.prospects p where lower(p.nome) = lower(c.nome)
);


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Confira o resultado deste seed:
--
--   select categoria, count(*)
--   from public.prospects
--   where categoria in (
--     'escrita_criativa','clube_leitura','poesia','caligrafia','contacao',
--     'cerimonia_cha','degustacao_cha','shodo','ikebana','sumie','origami','sake',
--     'gravura','serigrafia','tipografia','aquarela','urban_sketch','mosaico','vitral',
--     'danca_salao','tango','choro','vinil','improv','teatro','fotografia','percussao',
--     'bonsai','kokedama','jardinagem','tecelagem','costura','astronomia'
--   )
--   group by categoria order by categoria;
--
-- Esperado (banco sem estes nomes antes): 50 prospects novos,
-- todos com status 'nao_contatado'.
--
-- -------------------------------------------------------------
-- HANDLES A CONFERIR antes do 1o contato (inferidos na pesquisa,
-- perfil não aberto 1 a 1): @teaandm.oficial, @cerimoniacha,
-- @sarara.estudio, @tipografiasome, @clubededesenho, @bugvitrais,
-- @espacoviladancaearte, @caracol.bar, @improclube. O LinkedIn/
-- Instagram redireciona se o handle estiver errado — 1 clique
-- resolve.
-- =============================================================
