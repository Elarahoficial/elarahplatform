-- =============================================================
-- ELARAH — Seed B2B: Lote 1 — Agências & Estúdios Criativos (SP)
-- -------------------------------------------------------------
-- Popula public.b2b_prospects com o 1º lote de prospecção:
-- empresas pequenas/médias do setor criativo de São Paulo, onde
-- o decisor é acessível (sócio/dono ou Gente & Cultura) e a
-- aderência ao produto Elarah é alta.
--
-- Estratégia (ICP do lote):
--   - Setor criativo / tech com cultura forte
--   - Sede em São Paulo capital (experiências são presenciais)
--   - Decisor identificável (founder/People) por LinkedIn/Instagram
--   - Porte que comporta team building + presente corporativo
--
-- Os nomes/cargos de contato vieram de pesquisa pública (sites,
-- LinkedIn, imprensa do setor). NÃO incluímos e-mail/telefone
-- pessoal (não é dado público confiável) — o caminho de abertura
-- é o canal indicado em `observacoes`. O telefone se pega no papo.
--
-- proxima_acao_at = now() => todas entram em "Ações pra hoje" no
-- dashboard. Esse é o lote da semana: 10 contatos cirúrgicos.
--
-- IDEMPOTENTE — insere só o que ainda não existe (por nome).
-- Rode no Supabase (SQL Editor) com um usuário admin.
-- =============================================================

-- 1) Tech & Soul --------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Tech & Soul', 'agencia', '101_250', 'Publicidade / Comunicação independente',
  'São Paulo', 'https://techandsoul.com.br',
  'Liliany Samarão', 'Diretora Geral de Negócios', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template RH/People)', now(),
  'Agência independente premiada (Small Agency Awards 2025). Sócios: Claudio Kalim (CEO), Fernando Amino (CSO), Flavio Waiteman (CCO). Sede em Pinheiros (R. Alves Guimarães, 1120). Cultura criativa forte = entende valor de experiência de time. Canal: LinkedIn dos sócios / Liliany. Oferta: team building + presente de cliente.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Tech & Soul'));

-- 2) Galeria.ag ---------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Galeria.ag', 'agencia', '101_250', 'Publicidade independente (cultura + dados)',
  'São Paulo', 'https://galeria.ag',
  'Eduardo Simon', 'CEO / Fundador', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template RH/People)', now(),
  'Independente (comprou ações da Publicis em 2022). Clientes: Itaú, McDonalds, Natura. Sede na Vila Madalena. Sócios: Eduardo Simon (CEO), Rafael Urenha (CCO), Paulo Ilha, Pedro Cruz. 9 sócios adicionais (ex.: Ana Coutinho, Kaline Léssio). Alta aderência cultural. Canal: LinkedIn do Eduardo Simon ou de uma das sócias de People.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Galeria.ag'));

-- 3) Twist ---------------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, instagram, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Twist (twist®)', 'agencia', '50_100', 'Marketing full-service / 360º',
  'São Paulo', 'https://twist.com.br', '@agenciatwist', 'https://br.linkedin.com/company/agenciatwist',
  'Mauro Palacios', 'CEO / Fundador', null,
  'nao_contatado', 'medio',
  'Enviar 1º contato (template RH/People)', now(),
  'Agência full-service independente, fundada em 2008. CEO: Mauro Palacios. Diana Cotini Palacios na administração. Sede na Torre Norte do CENU (zona comercial). Canal: LinkedIn/Instagram (@agenciatwist). Oferta: team building + datas comemorativas.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Twist (twist®)'));

-- 4) Papanapa ------------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, instagram, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Papanapa', 'arquitetura_design', '1_49', 'Branding / Motion Design (estúdio)',
  'São Paulo', 'https://papanapa.com', '@papanapadesign', 'https://www.linkedin.com/company/papanapa',
  'Gustavo Garcia', 'Co-fundador / Diretor de Criação', 'https://www.linkedin.com/in/gustavosdgarcia/',
  'nao_contatado', 'medio',
  'Enviar 1º contato (template convite/experiência)', now(),
  'Estúdio independente de branding/motion, +10 anos, estética forte. Fundadores: Gustavo Garcia e André Arruda. Time enxuto = melhor pra presente corporativo / pequena ação de time. Muito ativos no Instagram (@papanapadesign) e Behance — DM tende a responder. Canal: Instagram ou LinkedIn do Gustavo.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Papanapa'));

-- 5) Estúdio Bijari ------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Estúdio Bijari', 'arquitetura_design', '1_49', 'Arte, multimídia e design',
  'São Paulo', 'https://bijari.com.br',
  'Gustavo Godoy', 'Sócio / Diretor', null,
  'nao_contatado', 'alto',
  'Enviar 1º contato (template convite/experiência)', now(),
  'Centro de criação em artes visuais, multimídia e design, fundado em 1997 por arquitetos/artistas da FAU-USP. Sede na Vila Madalena. Sócios: Gustavo Godoy, Maurício Brandão, Geandre Tomazoni, Rodrigo Araújo, Olavo Ekman, entre outros. Aderência criativa altíssima ao conceito Elarah (offline/experiência). Canal: site/LinkedIn dos sócios.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Estúdio Bijari'));

-- 6) RBR Design ----------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'RBR Design', 'arquitetura_design', '1_49', 'Branding / Identidade / Embalagem',
  'São Paulo', 'https://rbrdesign.com.br',
  'Raquel Braz Ribeiro', 'Fundadora / Diretora de Criação', null,
  'nao_contatado', 'medio',
  'Enviar 1º contato (template convite/experiência)', now(),
  'Estúdio independente criado em 2020 por Raquel Braz Ribeiro (RBR = iniciais dela), 25 anos de design. Estratégia + naming + identidade + embalagem. Estúdio pequeno: melhor pra presente corporativo ou parceria de permuta/indicação. Canal: site / LinkedIn / Instagram da Raquel.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('RBR Design'));

-- 7) Estúdio Arnold ------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Estúdio Arnold', 'arquitetura_design', '1_49', 'Design gráfico estratégico',
  'São Paulo', 'https://estudioarnold.cc',
  null, 'Sócio / Fundador (confirmar no site/LinkedIn)', null,
  'nao_contatado', 'medio',
  'Achar nome do sócio (site/LinkedIn) + enviar 1º contato', now(),
  'Estúdio de design gráfico de SP com abordagem estratégica; +10 anos com marcas grandes e pequenas, instituições e ONGs. Contato a confirmar na página /about do site (estudioarnold.cc). Canal: site / LinkedIn / Instagram.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Estúdio Arnold'));

-- 8) Trasso Design -------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Trasso Design', 'arquitetura_design', '1_49', 'Branding para empresas',
  'São Paulo', 'https://trasso.design',
  null, 'Sócio / Fundador (confirmar no site/LinkedIn)', null,
  'nao_contatado', 'medio',
  'Achar nome do sócio (site/LinkedIn) + enviar 1º contato', now(),
  'Estúdio de design/branding atendendo empresas de todo o Brasil. Contato a confirmar na página "Sobre nós" (trasso.design). Canal: site / LinkedIn / Instagram.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Trasso Design'));

-- 9) Enjoei --------------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Enjoei', 'tech', '251_500', 'Marketplace / E-commerce',
  'São Paulo', 'https://www.enjoei.com.br', 'https://br.linkedin.com/company/enjoei',
  null, 'Head of People / Gente & Gestão (achar no LinkedIn)', null,
  'nao_contatado', 'alto',
  'Achar Head of People no LinkedIn + enviar 1º contato', now(),
  'Marca descolada, comunicação muito criativa, cultura forte (Glassdoor 4.5/5, 88% recomendam). Kick Off 2024 com 40 lideranças sobre cultura. People investe em engajamento => lead quente pra team building / benefício. Maior que o resto do lote (decidir é mais lento), mas alto fit. Canal: LinkedIn da pessoa de People.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Enjoei'));

-- 10) Omie ---------------------------------------------------------------------
insert into public.b2b_prospects
  (nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site,
   contato_nome, contato_cargo, contato_linkedin,
   status_comercial, potencial, proxima_acao, proxima_acao_at, observacoes)
select
  'Omie', 'tech', '500_plus', 'SaaS / ERP para PMEs',
  'São Paulo', 'https://www.omie.com.br',
  null, 'Pessoa de People / Cultura (achar no LinkedIn)', null,
  'nao_contatado', 'medio',
  'Achar People/Cultura no LinkedIn + enviar 1º contato', now(),
  'ERP em nuvem para pequenas e médias empresas, cultura forte e time grande. Porte maior (ciclo mais longo), mas People é acessível no LinkedIn e investe em cultura. Bom pra benefício corporativo recorrente (gift card). Canal: LinkedIn de People/Cultura.'
where not exists (select 1 from public.b2b_prospects where lower(nome) = lower('Omie'));
