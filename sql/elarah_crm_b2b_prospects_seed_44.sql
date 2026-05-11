-- =============================================================
-- ELARAH — Seed B2B (44 empresas curadas São Paulo)
-- -------------------------------------------------------------
-- Lista curada estrategicamente pra prospecção da Elarah:
-- empresas de médio porte com cultura forte, RH ativo, perfil
-- adequado pra ações corporativas, gift cards e benefícios.
-- Foco: São Paulo (sede ou hub operacional).
--
-- O QUE ESTÁ PREENCHIDO (curadoria + estrutura):
--   ✅ nome, tipo_empresa, segmento, cidade
--   ✅ funcionarios_faixa (estimativa pública)
--   ✅ site (alta confiança — empresas conhecidas)
--   ✅ linkedin_empresa (melhor palpite do slug — verifique antes
--      do primeiro contato; o LinkedIn redireciona se errado)
--   ✅ potencial (curadoria Elarah)
--   ✅ observacoes (POR QUE essa empresa + ângulo estratégico)
--
-- O QUE FICOU EM BRANCO (preencher 1 vez por empresa, ~30s no
-- LinkedIn da empresa → aba "Pessoas" → filtra People/RH/Cultura):
--   ⬜ contato_nome, contato_cargo, contato_email
--   ⬜ contato_whatsapp, contato_linkedin
--   ⬜ instagram (handles variam muito — pesquise antes de marcar)
--
-- IMPORTANTE: Esta seed é uma BASE DE PARTIDA. Antes do primeiro
-- contato, valide o link do site e do LinkedIn (1 clique cada).
-- Sites e razões sociais foram derivados do conhecimento público
-- mais recente disponível; empresas podem ter mudado.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Insere só empresas que ainda não existem (matching por lower(nome)).
-- =============================================================


-- Pré-checagem amigável: aborta se a tabela b2b_prospects ainda
-- não existir (depende de sql/elarah_crm_b2b_prospects.sql ter
-- rodado primeiro). Mensagem clara em vez de erro críptico.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'b2b_prospects'
  ) then
    raise exception 'Tabela public.b2b_prospects não existe. Rode sql/elarah_crm_b2b_prospects.sql primeiro.';
  end if;
end $$;


-- =============================================================
-- 44 EMPRESAS CURADAS
-- =============================================================
-- Insere usando VALUES + LEFT JOIN pra idempotência.
-- Cada linha tem o motivo da curadoria na coluna observacoes.

with curated(nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa, potencial, observacoes) as (
  values

    -- ============= TECH / SAAS / STARTUPS (12) =============
    ('Cobli',
     'tech', '101_250',
     'SaaS — gestão de frota / IoT logística',
     'São Paulo',
     'https://www.cobli.co',
     'https://www.linkedin.com/company/cobli/',
     'alto',
     'Backed Y Combinator/GGV. Fundadores ex-Google/Facebook, time SP grande, cultura tech madura. RH investe em retenção (mercado tech compete por talento). Porta de entrada via People — postam vagas com frequência, indicando estrutura ativa.'),

    ('Cargo X',
     'tech', '101_250',
     'Logtech — frete rodoviário digital',
     'São Paulo',
     'https://cargox.com.br',
     'https://www.linkedin.com/company/cargo-x/',
     'medio',
     'Logtech mid-size. Cresceu rápido pós-pandemia. Time SP grande, RH em estruturação. Vale aproximar com benefício corporativo / gift card de aniversário pra atrair tech talent num mercado super competitivo.'),

    ('Pluga',
     'tech', '50_100',
     'Automação no-code (BR equivalente do Zapier)',
     'São Paulo',
     'https://pluga.co',
     'https://www.linkedin.com/company/pluga/',
     'medio',
     'Time enxuto mas culturado. Founders públicos sobre saúde mental do time, remote-first. Cliente perfeito pra ações pequenas mas significativas (datas comemorativas, onboarding). Porta via CEO.'),

    ('Trybe',
     'tech', '101_250',
     'Edtech — bootcamps de tech',
     'São Paulo',
     'https://www.betrybe.com',
     'https://www.linkedin.com/company/trybe-/',
     'medio',
     'Edtech jovem, cultura inclusiva (diversidade explícita no propósito). Time SP grande, formações de turmas geram eventos. Possível ângulo: experiência de team building pra colaboradores + também pra alunos formados.'),

    ('Pier',
     'tech', '101_250',
     'Insurtech — seguros digitais',
     'São Paulo',
     'https://pier.digital',
     'https://www.linkedin.com/company/pier-digital/',
     'medio',
     'Seguro 100% digital, cultura tech moderna. Time SP mid-size, RH proativo com benefícios diferenciados (vale pesquisar quais usam — pode entrar como add-on de gift card).'),

    ('Vittude',
     'tech', '50_100',
     'Healthtech — saúde mental B2B (terapia online)',
     'São Paulo',
     'https://www.vittude.com',
     'https://www.linkedin.com/company/vittude/',
     'alto',
     '⭐ ALIADO ESTRATÉGICO. Vendem pra MESMO comprador (RH/People). Cross-sell natural: empresa que oferece terapia também valoriza experiências de bem-estar. Possível parceria de co-marketing além de venda direta.'),

    ('CRMBonus',
     'tech', '251_500',
     'Loyalty + CRM B2B (programas de fidelidade)',
     'São Paulo',
     'https://crmbonus.com',
     'https://www.linkedin.com/company/crmbonus/',
     'alto',
     'Plataforma de fidelização B2B trabalhando com grandes varejistas. Cultura corporate forte. Mercado natural pra gift cards (eles entendem o valor de "presentear"). Time SP mid-size, RH estruturado.'),

    ('Loft',
     'tech', '251_500',
     'Proptech — compra e venda de imóveis',
     'São Paulo',
     'https://loft.com.br',
     'https://www.linkedin.com/company/loftcombr/',
     'alto',
     'Proptech grande mid-size SP. Cultura tech, time grande de operações + tech. RH ativo (postam vagas seguido). Cliente recorrente potencial pra ações trimestrais de equipe.'),

    ('Conta Simples',
     'tech', '101_250',
     'Fintech B2B — conta digital pra empresas',
     'São Paulo',
     'https://contasimples.com',
     'https://www.linkedin.com/company/contasimples/',
     'medio',
     'Fintech mid-size SP. Cresceu pós-pandemia, time tech jovem. Possível ângulo duplo: vender pra eles + parceria de gift card pra clientes deles (PJ).'),

    ('Cora',
     'tech', '251_500',
     'Fintech B2B — banco pra PMEs',
     'São Paulo',
     'https://cora.com.br',
     'https://www.linkedin.com/company/banco-cora/',
     'alto',
     'Fintech SP grande mid-size. Branding forte e jovem. Cultura interna conhecida por valorizar pessoas. Mesma lógica do Conta Simples: pode virar canal pra B2B2C com gift cards na base de clientes deles.'),

    ('BHub',
     'tech', '101_250',
     'BPO + fintech contábil B2B',
     'São Paulo',
     'https://bhub.com.br',
     'https://www.linkedin.com/company/bhub/',
     'medio',
     'Contabilidade + finance pra startups. Acessa um ecossistema gigante de PMEs via clientes. Time SP médio. Ângulo de parceria via base de clientes vale tanto quanto venda direta.'),

    ('Nuvemshop Brasil',
     'tech', '251_500',
     'Plataforma de e-commerce (Tiendanube no Brasil)',
     'São Paulo',
     'https://www.nuvemshop.com.br',
     'https://www.linkedin.com/company/nuvemshop/',
     'alto',
     'Plataforma de e-commerce com base gigante de lojistas no BR. Time SP grande, cultura LATAM (origem argentina) com forte foco em pessoas. RH ativo. Possível ângulo duplo: venda direta + parceria pra lojistas Nuvemshop comprarem gift cards Elarah pra clientes deles.'),


    -- ============= AGÊNCIAS (9) =============
    ('Loducca',
     'agencia', '101_250',
     'Publicidade independente (criativa)',
     'São Paulo',
     'https://www.loducca.com',
     'https://www.linkedin.com/company/loducca/',
     'alto',
     'Premiada em Cannes. Independente, decisões mais ágeis que multinacionais. Sócios públicos e acessíveis. Cultura forte de equipe — fazem ações criativas internas frequentes. Porta de entrada via founder/sócio.'),

    ('Tátil Design',
     'agencia', '101_250',
     'Design estratégico e branding',
     'São Paulo',
     'https://tatil.com.br',
     'https://www.linkedin.com/company/tatildesign/',
     'alto',
     'Sede no Rio, mas hub SP forte. Trabalham branding de marcas premium (Skol, Natura, Itaú). Time criativo que VALORIZA experiências por DNA. Decisor: head de operação ou diretor SP.'),

    ('WMcCann SP',
     'agencia', '251_500',
     'Publicidade global (McCann Worldgroup)',
     'São Paulo',
     'https://www.wmccann.com.br',
     'https://www.linkedin.com/company/wmccann/',
     'medio',
     'McCann no Brasil. Time SP grande. RH estruturado, processos de people maduros. Cultura mais corporate mas com criatividade. Costuma ter budget pra benefícios diferenciados.'),

    ('Wieden+Kennedy SP',
     'agencia', '50_100',
     'Agência criativa global (premium)',
     'São Paulo',
     'https://www.wk.com',
     'https://www.linkedin.com/company/wieden-kennedy/',
     'alto',
     '⭐ Cultura LENDÁRIA — W+K é referência mundial em cultura interna. Time SP pequeno e seleto. People alinhado com cultura forte. Já fazem ações criativas internas — Elarah encaixa naturalmente.'),

    ('Africa Creative',
     'agencia', '251_500',
     'Publicidade (Grupo ABC / Omnicom)',
     'São Paulo',
     'https://www.africacreative.com.br',
     'https://www.linkedin.com/company/africa-creative/',
     'medio',
     'Parte do grupo ABC, criada por Sergio Valente. Grandes clientes (Itaú, Vivo). Time SP grande. Cultura engajada com causas — possível ângulo: experiências com propósito.'),

    ('F.biz',
     'agencia', '251_500',
     'Agência digital',
     'São Paulo',
     'https://www.fbiz.com.br',
     'https://www.linkedin.com/company/f-biz/',
     'medio',
     'Uma das maiores digitais BR. Cultura tech-criativa, times multidisciplinares grandes. RH estruturado, processos formais — vale agendar reunião direta vs WhatsApp frio.'),

    ('CUBOCC',
     'agencia', '101_250',
     'Digital + performance (independente)',
     'São Paulo',
     'https://www.cubocc.com.br',
     'https://www.linkedin.com/company/cubocc/',
     'medio',
     'Digital independente focada em criatividade quantitativa. Time SP médio, cultura tech-criativa. Founders públicos sobre cultura. Porta via sócio fundador.'),

    ('Z+ Comunicação',
     'agencia', '50_100',
     'Comunicação corporativa / PR',
     'São Paulo',
     'https://zmais.com.br',
     'https://www.linkedin.com/company/z-mais-comunica%C3%A7%C3%A3o/',
     'medio',
     'PR e comunicação corporativa. Atende grandes contas (Itaú, Ambev, etc). Time enxuto e culturado. Profissional que valoriza experiências (mindset alinhado com o produto deles). Founders/sócios acessíveis no LinkedIn.'),

    ('Mutato',
     'agencia', '50_100',
     'Branding e cultura de marca',
     'São Paulo',
     'https://mutato.com.br',
     'https://www.linkedin.com/company/mutato-co/',
     'alto',
     '⭐ Sócios são referência pública em cultura de marca (Felipe Pignatari, Bruno Lutas). Cliente PERFEITO porque entendem o valor de experiência como ativo de marca. Possível co-criação de proposta de valor (ação + case).'),


    -- ============= COWORKINGS / HUBS (5) =============
    ('WeWork Brasil',
     'coworking', '251_500',
     'Espaços compartilhados premium (30+ unidades BR)',
     'São Paulo',
     'https://www.wework.com',
     'https://www.linkedin.com/company/wework/',
     'alto',
     '⭐ Canal de distribuição massivo. Atendem startups + corporativos. Possível parceria: oferecer experiências Elarah como benefício pros MEMBROS WeWork (não só funcionários do WeWork). Acesso a centenas de empresas via 1 conversa.'),

    ('Cubo Itaú',
     'coworking', '50_100',
     'Hub de inovação do Itaú (núcleo Cubo)',
     'São Paulo',
     'https://cubo.network',
     'https://www.linkedin.com/company/cubo-network/',
     'alto',
     '⭐ Hub de startups MAIS IMPORTANTE do BR. Centenas de startups membros + corporates parceiros. Parceria com Cubo = acesso a TODO ecossistema de inovação SP de uma vez. Foco em construir ponte com Felipe Andrade ou liderança Cubo.'),

    ('Distrito',
     'coworking', '50_100',
     'Inovação + corporate venture',
     'São Paulo',
     'https://distrito.me',
     'https://www.linkedin.com/company/distritocom/',
     'alto',
     'Comunidade de inovação SP. Trabalham com corporates buscando startups. Eventos frequentes — Elarah pode plugar como experiência paralela aos eventos (cross-sell pra audience corporate).'),

    ('BeerOrCoffee',
     'coworking', '50_100',
     'Rede de coworking flexível (multi-cidades)',
     'São Paulo',
     'https://beerorcoffee.com',
     'https://www.linkedin.com/company/beerorcoffee/',
     'medio',
     'Modelo "Netflix do coworking" — flexível, mensal. Atendem autônomos + empresas remote-first. Mercado underexplored e em crescimento.'),

    ('Spaces by IWG',
     'coworking', '50_100',
     'Coworking premium global (várias unidades SP)',
     'São Paulo',
     'https://www.spacesworks.com/sao-paulo/',
     'https://www.linkedin.com/company/spaces-thecollective/',
     'medio',
     'Premium pricing, members corporativos. Acesso a empresas mid-size que pagam premium por espaço — exatamente o sweet spot da Elarah indireto.'),


    -- ============= CONSTRUTORAS / PROPTECH (6) =============
    ('You Inc',
     'construtora', '251_500',
     'Construtora alto padrão (jovem/branded)',
     'São Paulo',
     'https://www.youinc.com.br',
     'https://www.linkedin.com/company/youinc/',
     'alto',
     '⭐ Construtora moderna com branding forte. Empreendimentos com unidades-conceito + amenities premium. Foco em design + lifestyle = perfil natural pra ações Elarah (eventos pra moradores futuros, brindes premium em entregas).'),

    ('JFL Realty',
     'construtora', '101_250',
     'Construtora premium / multifamily',
     'São Paulo',
     'https://jflrealty.com.br',
     'https://www.linkedin.com/company/jfl-realty/',
     'alto',
     'Empreendimentos super premium (JFL Iguatemi, etc.). Marca forte em luxo. Possível ângulo duplo: ação interna + experiências de cortesia pra moradores/clientes.'),

    ('Tegra Empreendimentos',
     'construtora', '251_500',
     'Construtora SP (JV Brookfield)',
     'São Paulo',
     'https://www.tegrainc.com.br',
     'https://www.linkedin.com/company/tegraempreendimentos/',
     'medio',
     'Joint Venture com Brookfield, foco em empreendimentos premium SP. Time grande, RH estruturado. Cultura corporate.'),

    ('VBI Real Estate',
     'imobiliaria', '50_100',
     'Real estate funds + advisory',
     'São Paulo',
     'https://vbirealestate.com',
     'https://www.linkedin.com/company/vbi-real-estate/',
     'medio',
     'Gestora de fundos imobiliários institucionais. Time profissional, cultura corporate. Possível ângulo: ações culturais executivas (não eventos massa).'),

    ('Setin Empreendimentos',
     'construtora', '101_250',
     'Construtora SP',
     'São Paulo',
     'https://www.setin.com.br',
     'https://www.linkedin.com/company/setin-empreendimentos/',
     'medio',
     'Construtora SP mid-size. Empreendimentos de médio-alto padrão. Time estável, possibilidade de ações trimestrais.'),

    ('Cipasa Empreendimentos',
     'construtora', '50_100',
     'Loteamentos premium (Cidade Tamboré, etc.)',
     'São Paulo',
     'https://www.cipasa.com.br',
     'https://www.linkedin.com/company/cipasa/',
     'medio',
     'Loteamentos high-end consolidados. Marca conhecida, RH em desenvolvimento (típico setor real estate). Ângulo bom: ações pra equipe de vendas (que é cara à empresa).'),


    -- ============= ARQUITETURA / DESIGN (6) =============
    ('Studio MK27',
     'arquitetura_design', '50_100',
     'Arquitetura premium (Marcio Kogan)',
     'São Paulo',
     'https://studiomk27.com.br',
     'https://www.linkedin.com/company/studio-mk27/',
     'alto',
     '⭐ Escritório de arquitetura mais premiado do BR. Branding pessoal de Marcio Kogan. Cultura forte de design. Marca premium = budget pra ações exclusivas (não pacotes massa). Aproximação via Kogan ou sócios.'),

    ('Triptyque Architecture',
     'arquitetura_design', '50_100',
     'Arquitetura sustentável franco-brasileira',
     'São Paulo',
     'https://triptyque.com',
     'https://www.linkedin.com/company/triptyque-architecture/',
     'alto',
     'Pioneiros em arquitetura verde no BR. Cultura criativa e internacional (sócios franco-brasileiros). Time enxuto e seleto. Ângulo de experiência com pegada sustentável combina com DNA.'),

    ('Studio Arthur Casas',
     'arquitetura_design', '50_100',
     'Arquitetura e design de interiores premium',
     'São Paulo',
     'https://www.arthurcasas.com',
     'https://www.linkedin.com/company/studio-arthur-casas/',
     'alto',
     'Branding pessoal forte do Arthur Casas. Cliente high-end (lojas Havaianas globais, hotéis luxo). Cultura criativa. Decisor: Arthur ou sócio executivo.'),

    ('Aflalo/Gasperini Arquitetos',
     'arquitetura_design', '101_250',
     'Arquitetura corporativa / comercial',
     'São Paulo',
     'https://www.aflalo-gasperini.com.br',
     'https://www.linkedin.com/company/aflalogasperini/',
     'medio',
     'Especialistas em edifícios corporativos modernos. Time SP grande, cultura tradicional mas profissional. RH em estruturação.'),

    ('Una Arquitetos',
     'arquitetura_design', '50_100',
     'Arquitetura premiada (Cristiane Muniz + Cristiane Velosa)',
     'São Paulo',
     'https://unaarquitetos.com.br',
     'https://www.linkedin.com/company/una-arquitetos/',
     'alto',
     'Premiadas, conceituadas. Cultura criativa. Time pequeno e seleto. Aproximação via sócias diretamente.'),

    ('Königsberger Vannucchi',
     'arquitetura_design', '50_100',
     'Arquitetura corporativa moderna',
     'São Paulo',
     'https://www.konigsbergervannucchi.com.br',
     'https://www.linkedin.com/company/konigsberger-vannucchi-arquitetos-associados/',
     'medio',
     'Especialistas em edifícios corporativos contemporâneos. Cliente premium. Time mid-size.'),


    -- ============= IMOBILIÁRIAS PREMIUM (4) =============
    ('Bossa Nova Sotheby''s International Realty',
     'imobiliaria', '50_100',
     'Imobiliária luxo (afiliada Sotheby''s)',
     'São Paulo',
     'https://www.bossanovasothebysrealty.com',
     'https://www.linkedin.com/company/bossa-nova-sotheby-s-international-realty/',
     'alto',
     'Imóveis high-end. Brand premium global. Equipe focada em UX cliente — vendem experiência, não só m². Ângulo: experiência exclusiva pra fechamento de venda alto valor (cliente final).'),

    ('Axpe',
     'imobiliaria', '50_100',
     'Imobiliária boutique premium',
     'São Paulo',
     'https://www.axpe.com.br',
     'https://www.linkedin.com/company/axpe-imoveis-especiais/',
     'alto',
     'Boutique fundada por sócios cool. Cultura curada (loja-conceito em Jardins). Clientes ALI ricos. Mesmo ângulo BNS: experiência pra fechamento ou marketing/lifestyle.'),

    ('Itaim Imobiliária',
     'imobiliaria', '50_100',
     'Imobiliária boutique (foco Itaim/Jardins)',
     'São Paulo',
     'https://www.itaimimobiliaria.com.br',
     'https://www.linkedin.com/company/itaim-imobili%C3%A1ria/',
     'medio',
     'Boutique tradicional Itaim Bibi. Cultura familiar mas profissional. Time enxuto. Ação simples pra equipe interna é caminho mais provável.'),

    ('Coelho da Fonseca',
     'imobiliaria', '251_500',
     'Imobiliária corporate tradicional',
     'São Paulo',
     'https://www.coelhodafonseca.com.br',
     'https://www.linkedin.com/company/coelho-da-fonseca/',
     'medio',
     'Imobiliária tradicional grande mid-size. Time SP enorme de corretores. Ângulo: ação anual pra equipe de vendas + treinamentos de equipe.'),


    -- ============= ESCRITÓRIOS JURÍDICOS (2) =============
    ('Felsberg Advogados',
     'escritorio_juridico', '251_500',
     'Direito empresarial / full-service',
     'São Paulo',
     'https://www.felsberg.com.br',
     'https://www.linkedin.com/company/felsberg-advogados/',
     'medio',
     'Boutique full-service, cultura mais leve que os gigantes (Mattos Filho, PN). RH ativo, cuidam de pessoas. Possível porta de entrada via Head of People ou diretor.'),

    ('Stocche Forbes',
     'escritorio_juridico', '251_500',
     'Direito corporativo (M&A, capital markets)',
     'São Paulo',
     'https://www.stoccheforbes.com.br',
     'https://www.linkedin.com/company/stocche-forbes-advogados/',
     'medio',
     'Boutique premium em direito corporativo. Time mid-size, cultura mais moderna que tradicionais. Decisor: managing partner ou diretor de operações.')

)
insert into public.b2b_prospects (
  nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
  linkedin_empresa, potencial, status_comercial, observacoes
)
select
  c.nome, c.tipo_empresa, c.funcionarios_faixa, c.segmento, c.cidade, c.site,
  c.linkedin_empresa, c.potencial, 'nao_contatado', c.observacoes
from curated c
where not exists (
  select 1 from public.b2b_prospects p where lower(p.nome) = lower(c.nome)
);


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Roda essa query depois pra ver o resultado:
--
--   select count(*) total,
--          count(*) filter (where potencial = 'alto') alto_potencial,
--          count(*) filter (where funcionarios_faixa in ('50_100','101_250','251_500')) sweet_spot
--   from public.b2b_prospects;
--
-- Esperado após este seed (assumindo banco vazio):
--   total = 44
--   alto_potencial = ~20
--   sweet_spot = ~40
