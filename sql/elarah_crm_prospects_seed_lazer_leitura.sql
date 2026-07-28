-- =============================================================
-- ELARAH — Seed: Prospects de Lazer/Experiências + Clubes de Leitura (SP)
-- -------------------------------------------------------------
-- Insere prospects novos direto na tabela prospects (sem passar
-- pelo import de CSV), pra não recriar prospects que o admin já
-- excluiu nem sobrescrever edições manuais.
--
-- Lote pedido pela operação (jul/2026):
--   - Circa-nos Lab .......... joalheria (Silver Clay / Alianças)
--   - Roller Jam Moema ....... patinação
--   - Tammy Montagna ......... doceria / confeitaria (Pinheiros)
--   - Tokyo SP ............... vida noturna (karaokê / rooftop)
--   - iFly São Paulo ......... voo indoor (túnel de vento)
--   - Hakuna Skate ........... skate (aulas / sessões)
--   - Meu Ateliê Arteterapia . arteterapia (Alphaville / Grande SP)
--   + 4 clubes de leitura de SP
--
-- Casa de Pedra (escalada) NÃO entra aqui — já foi semeada em
-- sql/elarah_crm_prospects_seed_experiencias_10.sql.
--
-- SOBRE OS WHATSAPP
--   Os números abaixo vieram de diretórios públicos e buscas
--   (as bios oficiais do Instagram / sites estavam bloqueadas na
--   coleta). Estão marcados no campo whatsapp pra facilitar o
--   disparo, mas CONFIRME na bio/site antes de mandar mensagem.
--   Onde não foi possível achar um número, whatsapp fica null e a
--   observação indica onde buscar.
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS por lower(nome) — pode rodar
--   várias vezes sem duplicar. Prospects já editados pelo admin
--   com esses nomes são preservados (NÃO sobrescreve nada).
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


-- ===== 1. Circa-nos Lab (joalheria) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Circa-nos Lab', 'joalheria', 'circanos.lab', null, null, 'https://www.circanos.com.br/', null, 'São Paulo',
  'Autoral e simbólico. Marca de joalheria artesanal em prata 950 e ouro (slow design, cristais e pedras naturais); o braço "Lab" (@circanos.lab) dá oficinas de Silver Clay (argila de prata) e o curso "Alianças por Nós Mesmos", em que casais fazem as próprias alianças à mão — experiência de altíssimo valor afetivo. WhatsApp a confirmar na bio do @circanos.lab (marca principal: @circa.nos).'
where not exists (select 1 from public.prospects where lower(nome) = lower('Circa-nos Lab'));

-- ===== 2. Roller Jam Moema (patinação) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Roller Jam Moema', 'patinacao', 'rollerjammoema', '11990156027', 'contatomoema@rollerjam.com.br', 'https://rollerjam.com.br/moema/', 'Moema', 'São Paulo',
  'Nostálgico e instagramável. Pista de patinação com temática retrô anos 70/80: DJs, monitores ensinando passos sobre patins, lanchonete estilo diner e fliperama, na Alameda dos Nhambiquaras 1980 (segunda unidade; matriz na Mooca). Forte pra grupos, aniversários e locação exclusiva. Também tem fixo (11) 3969-0931. WhatsApp de diretório — confirmar antes de disparar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Roller Jam Moema'));

-- ===== 3. Tammy Montagna (doceria / confeitaria) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Tammy Montagna', 'doceria', 'tammymontagna', null, null, 'https://www.tammymontagna.com/', 'Pinheiros', 'São Paulo',
  'Premium e autoral. Patisserie e café da confeiteira Tammy Montagna (passou pelo MasterChef Confeitaria), na Rua Lisboa, Pinheiros — doces autorais como assinatura e cardápio natural. Hoje é confeitaria/café (não oficina): encaixe como experiência gastronômica/doceria; confirmar se topam abrir workshop/degustação. WhatsApp a confirmar na bio.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Tammy Montagna'));

-- ===== 4. Tokyo SP (vida noturna / karaokê) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Tokyo SP', 'outro', 'tokyo.sp', null, null, 'https://tokyo011.com.br/', 'Vila Buarque', 'São Paulo',
  'Vida noturna diferenciada. Complexo em prédio histórico de 9 andares no centro (Rua Major Sertório 110): bar, restaurante, karaokê com boxes privativos, pista de dança e terraço/rooftop, mix eclético. Entrada 18+, sem reserva de mesa (por ordem de chegada). Experiência distintiva pela verticalidade + karaokê. WhatsApp a confirmar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Tokyo SP'));

-- ===== 5. iFly São Paulo (voo indoor / túnel de vento) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'iFly São Paulo', 'voo', 'iflybrazil', '11941884369', null, 'https://saopaulo.iflybrazil.com/', 'Pinheiros', 'São Paulo',
  'Raro e radical. Paraquedismo indoor em túnel de vento (Av. Dra. Ruth Cardoso 6873, Pinheiros) — voo seguro pra todas as idades, apelo forte de "presente/experiência inédita". WhatsApp da unidade SP a confirmar (número de diretório); SAC nacional (61) 3142-2210, fixo (11) 3031-0491.'
where not exists (select 1 from public.prospects where lower(nome) = lower('iFly São Paulo'));

-- ===== 6. Hakuna Skate (skate) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Hakuna Skate School', 'patinacao', 'hakunaskateschool', '11940732309', null, 'https://hakunaskate.com.br/', 'Várzea de Baixo', 'São Paulo',
  'Iniciante-friendly e coberto. Escola de skate com mini rampa em "W" e bowl (Rua Dr. Rubens Gomes Bueno 543, Várzea de Baixo, perto da CPTM João Dias); aulas pra todos os níveis e sessões livres (~R$ 65 a R$ 180), agendamento por Instagram/WhatsApp. Boa como experiência guiada de estreia no skate. WhatsApp de diretório — confirmar antes de disparar.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Hakuna Skate School'));

-- ===== 7. Meu Ateliê Arteterapia (arteterapia) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Meu Ateliê Arteterapia', 'arterapia', 'meuatelie.arterapia', '11989659668', null, 'https://meuatelie.art/', 'Alphaville', 'Santana de Parnaíba',
  'Sensorial e único. "Primeiro espaço de arteterapia do Brasil" (artista Samuel Caixeta), na Av. Pentágono 300, Alphaville — experiência imersiva de pintura/arte de ~50min pra autoconhecimento e bem-estar; formatos individual, grupo, família, corporativo e aniversário. ATENÇÃO: fica na Grande SP (Alphaville / Santana de Parnaíba), não na capital.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Meu Ateliê Arteterapia'));


-- =============================================================
-- CLUBES DE LEITURA (categoria = leitura)
-- =============================================================

-- ===== 8. Leia Mulheres SP (clube de leitura) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Leia Mulheres SP', 'leitura', 'leiamulheressp', null, null, 'https://leiamulheres.com.br/', null, 'São Paulo',
  'Comunidade forte e gratuita. Clube feminista dedicado a obras escritas por mulheres; encontros mensais itinerantes (livrarias, centros culturais e bibliotecas), ~1h30, sem inscrição. Marca nacional consolidada — ótimo pra co-criar experiências literárias e edições especiais.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Leia Mulheres SP'));

-- ===== 9. bibla (livraria + café com clube de leitura) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'bibla', 'leitura', 'bibla.bibla', null, null, 'https://www.bibla.com.br/', 'Vila Madalena', 'São Paulo',
  'Instagramável e curatorial. Livraria de rua + café em casarão na Praça Prof.ª Emília Barbosa Lima 58 (divisa Vila Madalena / Alto de Pinheiros), ~4.000 títulos; clube de leitura mensal, rodas de conversa, lançamentos e oficinas de escrita. Experiência literária + café pronta pra ativar. Agenda divulgada no Instagram; têm grupo de WhatsApp — pegar link na bio.'
where not exists (select 1 from public.prospects where lower(nome) = lower('bibla'));

-- ===== 10. Clube de Leitura da Livraria da Vila (clube de leitura) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Clube de Leitura Livraria da Vila', 'leitura', 'livrariadavila', null, null, 'https://www.livrariadavila.com.br/', 'Pinheiros', 'São Paulo',
  'Marca forte e endereço fácil. Encontros mensais na Livraria da Vila (Rua Fradique Coutinho 915, Pinheiros), com apoio de editoras; gratuito. Rede de livrarias reconhecida em SP — bom parceiro pra experiências literárias recorrentes.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Clube de Leitura Livraria da Vila'));

-- ===== 11. Clube de Leitura do Espaço Mutatis (clube de leitura) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Clube de Leitura Espaço Mutatis', 'leitura', null, null, null, null, 'Moema', 'São Paulo',
  'Intimista de bairro. Encontros mensais (~2h) unindo literatura, troca de ideias e convivência no Espaço Mutatis, Moema. Formato aconchegante de vizinhança. Confirmar @ do Instagram e a agenda dos encontros.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Clube de Leitura Espaço Mutatis'));


-- =============================================================
-- TEMPLATES DE MENSAGEM por categoria (primeiro contato)
-- -------------------------------------------------------------
-- Aparecem no seletor de templates quando o prospect é da
-- categoria correspondente. Variáveis: {{nome}}, {{bairro}}.
-- Evitamos {{categoria}} de propósito (o valor cru — ex.
-- "patinacao" — ficaria feio no texto).
-- Idempotente: só insere se ainda não existir um template com
-- o mesmo nome.
-- =============================================================

-- Patinação / Skate (Roller Jam, Hakuna Skate)
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Patinação / Skate', 'patinacao',
E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Amei o clima do {{nome}} — patinar/andar de skate é exatamente o tipo de experiência divertida e em grupo que mais bomba na nossa plataforma (aniversários, encontros de amigas, date diferente).\n\nPosso te contar como funciona uma parceria? A gente leva público novo pra você sem custo de mídia da sua parte.\n\nObrigada! 🧡',
20, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Patinação / Skate'));

-- Voo indoor / Túnel de vento (iFly)
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Voo indoor / Túnel de vento', 'voo',
E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. O {{nome}} é uma das experiências mais inéditas da cidade — voar em túnel de vento tem um apelo de "presente inesquecível" que combina demais com o nosso público.\n\nFaz sentido conversarmos sobre uma parceria? A Elarah é referência pra quem procura experiências diferentes em SP.\n\nObrigada! 🧡',
21, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Voo indoor / Túnel de vento'));

-- Arteterapia (Meu Ateliê)
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Arteterapia / Bem-estar', 'arterapia',
E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Me encantei com a proposta do {{nome}} — arteterapia é exatamente o tipo de experiência sensorial e de bem-estar que nosso público busca (autocuidado, presentes afetivos, encontros em grupo).\n\nPosso te explicar como funciona uma parceria, sem compromisso?\n\nObrigada! 🧡',
22, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Arteterapia / Bem-estar'));

-- Clube de leitura (Leia Mulheres, bibla, Livraria da Vila, Mutatis)
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Clube de leitura', 'leitura',
E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Acompanho o {{nome}} e adoraria levar o clube pra nossa curadoria — encontros literários são uma experiência de comunidade linda e muito alinhada com o público da Elarah.\n\nTopa conversar sobre uma parceria? Pode ser pra divulgar os encontros ou pra criar edições especiais juntos.\n\nObrigada! 🧡',
23, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Clube de leitura'));

-- Doceria / Confeitaria autoral (Tammy Montagna)
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Doceria / Confeitaria', 'doceria',
E'Oi! Tudo bem?\n\nSou da Elarah, plataforma de experiências offline em São Paulo. Amo o trabalho da {{nome}} no {{bairro}} — confeitaria autoral tem tudo a ver com o nosso público, seja em degustações, workshops ou experiências gastronômicas.\n\nVocês têm (ou topariam abrir) alguma experiência aberta ao público? Adoraria propor uma parceria.\n\nObrigada! 🧡',
24, true
where not exists (select 1 from public.prospect_templates where lower(nome) = lower('Doceria / Confeitaria'));


notify pgrst, 'reload schema';


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Prospects novos:
--
--   select nome, categoria, bairro, whatsapp, status
--   from public.prospects
--   where categoria in ('patinacao','voo','arterapia','leitura')
--      or lower(nome) in ('circa-nos lab','tammy montagna','tokyo sp')
--   order by categoria, nome;
--
-- Esperado: 11 linhas, todas com status 'nao_contatado'.
--
-- Templates novos:
--
--   select nome, categoria, ordem from public.prospect_templates
--   where ordem between 20 and 24 order by ordem;
--
-- Esperado: 5 linhas (patinacao, voo, arterapia, leitura, doceria).
