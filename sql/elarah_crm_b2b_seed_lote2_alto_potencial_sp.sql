-- =============================================================
-- ELARAH — Seed B2B: Lote 2 — Alta probabilidade de fechar (SP)
-- -------------------------------------------------------------
-- 10 empresas de São Paulo com o MAIOR fit com a Elarah: negócios
-- que vivem de criatividade/experiência/cultura, onde o decisor
-- (sócio-fundador ou Head de Gente) é acessível e entende o valor
-- de uma vivência presencial na hora.
--
-- Categorias do lote (todas alto potencial):
--   - Estúdios de design/branding (Casa Rex, Oz, Lobo)
--   - Agências criativas independentes (Suno)
--   - Agências de live marketing / brand experience (EAÍ?!, F/Malta)
--   - Coworkings / hubs de comunidade (Impact Hub SP, Distrito)
--   - HR-techs de cultura e engajamento (Pin People, Qulture.Rocks)
--
-- Nomes/cargos de contato confirmados em pesquisa pública (sites,
-- LinkedIn, imprensa do setor). SEM e-mail/telefone pessoal — abrir
-- pelo canal indicado em `observacoes` e pegar o telefone no papo.
--
-- proxima_acao_at = now() + 7 dias  => esse é o lote da PRÓXIMA
-- semana (combinado: começa a atacar semana que vem).
--
-- IDEMPOTENTE — insere só o que ainda não existe (por nome).
-- Rode no Supabase (SQL Editor) com um usuário admin.
-- =============================================================

-- 1) Casa Rex -----------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Casa Rex', 'arquitetura_design', '1_49', 'Design gráfico / Branding (estúdio)',
  'São Paulo', 'https://casarex.com', 'https://www.linkedin.com/company/casa-rex',
  'Gustavo Piqueira', 'Sócio-fundador / Diretor de Criação', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template convite/experiência)', now() + interval '7 days',
  'Casa de design multipremiada (+200 prêmios), 40+ profissionais. Fundadores: Gustavo Piqueira e Samia Jacintho. Aderência altíssima ao universo Elarah (cultura visual, fazer manual). Canal: LinkedIn do Gustavo / site. Oferta: presente corporativo + team building criativo.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Casa Rex'));

-- 2) Oz estratégia+design -----------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Oz estratégia+design', 'arquitetura_design', '1_49', 'Branding / Estratégia + Design',
  'São Paulo', 'https://ozdesign.com.br', 'https://br.linkedin.com/company/oz-design',
  'Ronald Kapaz', 'Sócio-fundador', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template convite/experiência)', now() + interval '7 days',
  'Estúdio de branding pioneiro na Vila Madalena (R. Andrade Fernandes, 303). Fundadores: André Poppovic, Giovanni Vannucchi e Ronald Kapaz (se conheceram na arquitetura). Cultura criativa forte. Canal: LinkedIn dos sócios / site.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Oz estratégia+design'));

-- 3) Suno United Creators -----------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Suno United Creators', 'agencia', '101_250', 'Agência criativa / Comunicação',
  'São Paulo', 'https://sunocreators.com', 'https://br.linkedin.com/company/suno-unitedcreators',
  'Carolina Gil', 'Head de RH', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template RH/People)', now() + interval '7 days',
  'Agência independente nova geração (fundada 2017), Vila Madalena (R. Fidalga, 593). Sócios: Guga Ketzer (CEO), chef Alex Atala, Sérgio Chaia, entre outros. Carolina Gil é Head de RH = contato ideal pra team building. Effie "Agência mais eficaz" 2020, prata em Cannes 2021. Canal: LinkedIn da Carolina (RH) ou do Guga.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Suno United Creators'));

-- 4) Lobo ---------------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Lobo', 'arquitetura_design', '1_49', 'Estúdio de animação e design',
  'São Paulo', 'https://lobo.cx',
  'Mateus de Paula Santos', 'CCO / Co-fundador', 'https://www.linkedin.com/in/mateus-de-paula-santos-9407096/',
  'nao_contatado', 'alto',
  'Enviar 1º contato (template convite/experiência)', now() + interval '7 days',
  'Estúdio de animação e design premiado (Cannes, Clio, D&AD), com escritórios em SP, NY e Londres. Fundadores: Mateus de Paula Santos (CCO) e Nando Cohen. Time muito criativo = adoram experiência. Canal: LinkedIn do Mateus / site. Oferta: team building criativo.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Lobo'));

-- 5) EAÍ?! Content Experience -------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'EAÍ?! Content Experience', 'agencia', '50_100', 'Live marketing / Brand experience',
  'São Paulo', 'https://eaimkt.com.br', 'https://br.linkedin.com/company/eaimkt',
  'Paulo Farnese', 'Co-fundador / CEO', 'https://www.linkedin.com/in/paulofarnese/',
  'nao_contatado', 'alto',
  'Enviar 1º contato (template ação de equipe)', now() + interval '7 days',
  'Agência de live marketing (fundada 2016), ~90 pessoas, +30 prêmios (Caio, Ampro). Sócios: Paulo Farnese (CEO), Rodolfo Brizoti, Carolina Gouvea, Gisele Antunes, Carolina Stellato. Vivem de experiência => entendem o valor na hora (cliente interno + potencial parceria). Canal: LinkedIn do Paulo.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('EAÍ?! Content Experience'));

-- 6) F/Malta ------------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'F/Malta', 'agencia', '1_49', 'Live marketing / Experiência de marca',
  'São Paulo', 'https://www.fmalta.com.br', 'https://br.linkedin.com/company/fmalta',
  'Felipe Malta', 'Fundador / CEO', 'https://br.linkedin.com/in/felipemalta',
  'nao_contatado', 'alto',
  'Enviar 1º contato (template ação de equipe)', now() + interval '7 days',
  'Agência de live marketing, 15 anos, 45+ colaboradores. Fundador/CEO: Felipe Malta Lefevre. Clientes: Google, PagSeguro, Land Rover. Vive de experiência => fit altíssimo pra team building interno e parceria. Canal: LinkedIn do Felipe.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('F/Malta'));

-- 7) Impact Hub São Paulo -----------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Impact Hub São Paulo', 'coworking', '1_49', 'Coworking / Comunidade de impacto',
  'São Paulo', 'https://saopaulo.impacthub.net', 'https://br.linkedin.com/company/impact-hub-s%C3%A3o-paulo',
  'Henrique Bussacos', 'Sócio-diretor / Co-fundador', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template convite/experiência)', now() + interval '7 days',
  'Coworking + comunidade de inovação social (Pinheiros), o Impact Hub mais antigo do mundo em operação. Fundadores: Henrique Bussacos e Pablo Handl. Programa eventos pra comunidade de membros => fit pra experiências como ativação/benefício de comunidade. Canal: LinkedIn do Henrique / contato do site.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Impact Hub São Paulo'));

-- 8) Distrito -----------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Distrito', 'coworking', '101_250', 'Hub de inovação / Coworking',
  'São Paulo', 'https://www.distrito.me',
  'Gustavo Araujo', 'Co-fundador / CEO', 'https://www.linkedin.com/in/gusaraujo/',
  'nao_contatado', 'alto',
  'Enviar 1º contato (template convite/experiência)', now() + interval '7 days',
  'Maior hub de inovação do Brasil (eleito pela ABStartups), 3 hubs em SP. Co-fundador/CEO: Gustavo Araujo. Conecta startups e empresas, faz muito evento/comunidade => fit pra experiências em ativações e pro próprio time. Canal: LinkedIn do Gustavo. Porte maior: ciclo um pouco mais longo.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Distrito'));

-- 9) Pin People ---------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Pin People', 'tech', '50_100', 'HR Tech / Cultura e clima organizacional',
  'São Paulo', 'https://pinpeople.com.br', 'https://www.linkedin.com/company/pin-people',
  'Frederico Lacerda', 'CEO / Co-fundador', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template benefício corporativo)', now() + interval '7 days',
  'HR-tech de escuta organizacional, cultura e experiência do colaborador (IA). Fundadores: Frederico Lacerda (CEO), Isabella Botelho, Caio Torres. VENDEM experiência do colaborador => fit duplo: cliente interno + parceria (recomendar Elarah pros clientes deles). Canal: LinkedIn do Frederico.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Pin People'));

-- 10) Qulture.Rocks -----------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Qulture.Rocks', 'tech', '50_100', 'HR Tech / Gestão de desempenho e cultura',
  'São Paulo', 'https://qulture.rocks',
  'Francisco Homem de Mello', 'Fundador / CEO', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template benefício corporativo)', now() + interval '7 days',
  'Plataforma de gestão de desempenho, feedback e cultura (fundada 2015), ~1000 clientes (Nubank, Loggi, C&A). Fundador/CEO: Francisco Homem de Mello (escreveu sobre cultura do grupo 3G). Pauta de cultura forte => fit pra benefício/engajamento. Hoje no grupo UOL EdTech. Canal: LinkedIn do Francisco.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Qulture.Rocks'));
