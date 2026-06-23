-- =============================================================
-- ELARAH — Seed: Prospects de Ateliês & Experiências (lote jun/26)
-- -------------------------------------------------------------
-- Insere os prospects novos de ateliês/workshops enviados pela
-- curadoria (cerâmica, têxtil, pintura, chás, botânica, velas,
-- movimento/escrita) direto na tabela prospects.
--
-- DEDUPLICAÇÃO (removidos por já existirem na base):
--   ✗ "Cerâmica & Cia" (@ceramicaecia)  → já cadastrado como
--      "Ateliê Cerâmica & Cia" (mesmo @ceramicaecia, Vila Madalena).
--   ✗ "Coffee Lab" (@coffeelab_sp)      → já cadastrado como
--      "Coffee Lab" (escola da Isabela Raposeiras, Pinheiros).
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS por lower(nome) — pode rodar
--   várias vezes sem duplicar. Prospects já editados pelo admin
--   com esses nomes são preservados (NÃO sobrescreve nada).
--
-- WhatsApp normalizado pra dígitos (DDD + número), mesmo padrão
-- dos demais seeds. Instagram sem o "@".
-- =============================================================


-- Pré-checagem: aborta se a tabela prospects não existir
-- (depende de sql/elarah_crm_prospects.sql ter rodado antes).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prospects'
  ) then
    raise exception 'Tabela public.prospects não existe. Rode sql/elarah_crm_prospects.sql primeiro.';
  end if;
end $$;


with novos(nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes) as (
  values

    -- ============= 🏺 CERÂMICA & MODELAGEM =============
    ('Ateliê Tetê Lordello', 'ceramica', 'atelietetelordello', '11992422005', null, null, null, 'São Paulo',
     'Cerâmica e modelagem. Focado em desacelerar a rotina e trabalhar o foco por meio de oficinas criativas e fluidas de modelagem manual.'),

    ('Ateliê de Cerâmica Flavia Santoro', 'ceramica', 'flaviasantoroceramica', '11991223839', null, null, null, 'São Paulo',
     'Cerâmica utilitária. Workshops intimistas voltados à criação de xícaras, bowls e canecas personalizadas com argilas texturizadas.'),

    ('Sara Carone Ateliê', 'ceramica', 'saracarone.studio', '11999744537', null, null, null, 'São Paulo',
     'Escultura e cerâmica. Vivências focadas em modelagem figurativa e livre, ideais para destravar o potencial de expressão artística.'),

    ('Lama Ateliê', 'ceramica', 'lama.atelie', '11982021402', null, null, null, 'São Paulo',
     'Cerâmica contemporânea. Espaço moderno com foco em processos experimentais e designs geométricos para objetos de decoração.'),


    -- ============= 🧵 ARTE TÊXTIL, TUFTING & COSTURA =============
    ('Studio de Tufting Itaim', 'tufting', 'elarah.oficial', '11988004521', null, null, 'Itaim Bibi', 'São Paulo',
     'Tapeçaria e tufting (parceiro recorrente). Oficinas semanais completas usando pistolas de tufting para criar tapetes e espelhos personalizados. Agendamento pelo canal próprio @elarah.oficial.'),

    ('Escola de Choro / Galpão das Artes', 'macrame', 'escoladechorosp', '11985904990', null, null, null, 'São Paulo',
     'Macramê e fios tradicionais. Oficinas lúdicas de nós, suportes de plantas e painéis decorativos em um ambiente comunitário e inspirador.'),

    ('Laboratório de Roupas (Mariana Gonçalves Ateliê)', 'costura', 'marianagoncalvesatelie', '11945677908', null, null, null, 'São Paulo',
     'Corte, costura e upcycling. Workshops rápidos de final de semana focados em ensinar a confeccionar a própria bolsa ou customizar jaquetas.'),

    ('Ateliê Crispim Tear', 'tecelagem', 'crispim_tear', '11981153277', null, null, 'Vila Madalena', 'São Paulo',
     'Tecelagem manual e tapeçaria. Vivências imersivas de tear pente-liço e técnicas ancestrais de tramas com fios naturais na Vila Madalena.'),

    ('Bordado Studio', 'bordado', 'bordadostudio', '11971033450', null, null, null, 'São Paulo',
     'Bordado livre e aquarela em tecido. Oficinas delicadas que misturam técnicas de contornos botânicos e preenchimentos criativos em bastidores de madeira.'),


    -- ============= 🎨 PINTURA, DESENHO & PAPELARIA =============
    ('Quanta Academia de Artes', 'desenho', 'quantaacademia', '11942207624', null, null, null, 'São Paulo',
     'Ilustração e desenho artístico. Workshops curtos voltados a técnicas de aquarela, desenho de observação e criação de sketchbooks.'),

    ('Casa Locomotiva', 'gravura', 'casalocomotiva', '11980168311', null, null, 'Vila Madalena', 'São Paulo',
     'Gravura e serigrafia manual. Ateliê coletivo na Vila Madalena focado em oficinas de xilogravura e impressão manual de cartazes e ecobags.'),

    ('Espaço Mirabilis', 'pintura', 'espaco_mirabilis', '11937310001', null, null, null, 'São Paulo',
     'Pintura intuitiva e escrita. Ateliê focado em dinâmicas sensíveis, misturando café, expressão visual livre e diários de bordo visuais.'),

    ('AreaE - Escola de Artes', 'desenho', 'areae.escola', '1132077624', null, null, null, 'São Paulo',
     'Arte final e marcadores. Oficinas dinâmicas sobre o uso de marcadores profissionais (estilo Copic) e técnicas de pintura fluida.'),


    -- ============= ☕ GASTRONOMIA, CHÁS & CAFÉ =============
    ('Mori Chazeria', 'cha', 'mori.chazeria', '11917062787', null, null, 'Paraíso', 'São Paulo',
     'Introdução aos chás e matcha. Lindas oficinas sobre rituais de chás asiáticos, harmonização com wagashi e preparo cerimonial de matcha no Paraíso.'),

    ('Chá Yê!', 'cha', 'chaye_oficial', '11930120692', null, null, 'Pinheiros', 'São Paulo',
     'Degustação e cultura do chá. Workshops imersivos de Gongfu Cha (cerimônia chinesa) com degustação guiada por sommeliers em Pinheiros.'),

    ('T&M Chás & Meditação', 'cha', 'tea.and.m', '11992243341', null, null, null, 'São Paulo',
     'Mindful tea e blending. Combinação perfeita para a Elarah: oficinas para criar o próprio blend de ervas alinhado a meditações guiadas.'),

    ('Escola de Panificação Artesanal (Jardim das Bandeiras)', 'gastronomia', 'elarah.oficial', '11941021920', null, null, 'Jardim das Bandeiras', 'São Paulo',
     'Panificação sourdough e massas. Aulas super completas de massas artesanais, lasanhas do zero e pães de fermentação natural. Experiências gastronômicas autorais via @elarah.oficial.'),


    -- ============= 🌿 BOTÂNICA, JARDINAGEM & BONSAI =============
    ('Bonsai Kai', 'bonsai', 'bonsaikai', '11966651000', null, null, null, 'São Paulo',
     'Arte do bonsai e horticultura. Workshop de final de semana 100% prático, ensinando podas, aramagem e transplante com foco em meditação ativa.'),

    ('Yamadory Bonsai & Escola', 'bonsai', 'yamadorybonsai', '11975314397', null, null, null, 'São Paulo',
     'Jardinagem oriental e suiseki. Oficinas e demonstrações de modelagem de mini árvores e harmonização com pedras naturais de contemplação.'),

    ('FLO atelier botânico', 'botanica', 'floatelierbotanico', '1125896116', null, null, 'Pinheiros', 'São Paulo',
     'Arranjos vivos e terrários. Oficinas premium em Pinheiros focadas na criação de ecossistemas fechados (terrários) e composições florais esculturais.'),

    ('Kokesampa', 'botanica', 'kokesampa', '11972038841', null, null, null, 'São Paulo',
     'Kokedamas artesanais. Aulas divertidas ensinando a técnica japonesa de arranjos suspensos sem vasos, utilizando musgos e substratos.'),


    -- ============= 🧪 AROMAS, VELAS & AUTOCUIDADO =============
    ('Ateliê Elarah Velas', 'vela', 'elarah.oficial', '11966308827', null, null, null, 'São Paulo',
     'Velas de soja e botânica (produto próprio/cocriação). Experiência autoral para aprender a derreter, aromatizar com óleos essenciais e decorar velas com flores secas. Suporte centralizado.'),

    ('Aromas da Villa Ateliê', 'saboaria', 'aromasdavilla_', '11945031221', null, null, null, 'São Paulo',
     'Saboaria natural e cosmética limpa. Oficinas práticas de formulação de sabonetes em barra via Cold Process e blends de escalda-pés relaxantes.'),

    ('Ateliê Botânico de Perfumaria', 'perfumaria', 'perfumariabotanica', '11991883412', null, null, null, 'São Paulo',
     'Perfumaria ancestral e botânica. Workshop olfativo exclusivo onde cada participante monta sua própria fragrância com notas de óleos puros.'),


    -- ============= 🎭 MOVIMENTO, ESCRITA & EXPRESSÃO =============
    ('Improclube', 'teatro', 'improclube', '11913537496', null, null, null, 'São Paulo',
     'Improvisação teatral e presença. Workshops rápidos focados em destravar a timidez, exercitar a escuta ativa e rir de forma descompromissada.'),

    ('Escrevedeira', 'escrita', 'escrevedeira', '11944990141', null, null, 'Vila Madalena', 'São Paulo',
     'Escrita criativa e poesia. Oficinas literárias dinâmicas em uma charmosa casa com jardim na Vila Madalena para destravar bloqueios textuais.'),

    ('Tango B''Aires', 'danca', 'tango.baires.sp', '11987007205', null, null, null, 'São Paulo',
     'Ritmo, conexão e dança. Oficinas rápidas apelidadas de "Tango do Zero", desenhadas para quem nunca dançou interagir e socializar.'),

    ('Imágicas Laboratório Fotográfico', 'fotografia', 'clubedoanalogico', '11986693831', null, null, null, 'São Paulo',
     'Fotografia analógica e revelação. Workshops práticos de introdução ao laboratório preto e branco, onde o aluno fotografa em filme e revela a própria foto.')

)
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select n.nome, n.categoria, n.instagram, n.whatsapp, n.email, n.site, n.bairro, n.cidade, n.observacoes
from novos n
where not exists (
  select 1 from public.prospects p where lower(p.nome) = lower(n.nome)
);


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Roda essa query pra conferir os prospects novos deste lote:
--
--   select nome, categoria, bairro, whatsapp, status
--   from public.prospects
--   where categoria in ('ceramica','tufting','macrame','costura','tecelagem',
--                       'bordado','desenho','gravura','pintura','cha',
--                       'gastronomia','bonsai','botanica','vela','saboaria',
--                       'perfumaria','teatro','escrita','danca','fotografia')
--   order by categoria, nome;
--
-- Esperado: 28 linhas novas, todas com status 'nao_contatado'.
-- (Cerâmica & Cia e Coffee Lab foram removidos por já existirem.)
-- =============================================================
