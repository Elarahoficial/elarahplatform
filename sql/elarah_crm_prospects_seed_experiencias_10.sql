-- =============================================================
-- ELARAH — Seed: 10 Prospects de Experiências Esportivas/Adrenalina (SP)
-- -------------------------------------------------------------
-- Insere APENAS os 10 prospects novos de experiências
-- diferenciadas (golfe, kart, paintball, escalada, etc.) direto
-- na tabela prospects — sem passar pelo import de CSV, pra não
-- recriar prospects que o admin já excluiu nem sobrescrever
-- edições manuais (ex: WhatsApp adicionado na mão).
--
-- Mesmos dados de data/prospects-seed-v1.csv (linhas 46-55).
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


-- ===== 1. FPG Golf Center (golfe) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'FPG Golf Center', 'golfe', null, null, null, 'https://cefpgolfe.com.br/', 'Aeroporto', 'São Paulo',
  'Raro e acessível. Primeiro campo de golfe aberto ao público do Brasil, ao lado do Aeroporto de Congonhas, único driving range do país com tecnologia Toptracer; aulas para iniciantes a partir de R$ 15 — golfe sem precisar de clube fechado.'
where not exists (select 1 from public.prospects where lower(nome) = lower('FPG Golf Center'));

-- ===== 2. Speedland Kart Center (kart) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Speedland Kart Center', 'kart', null, null, null, 'https://speedland.com.br/', 'Tatuapé', 'São Paulo',
  'Premium e referência. Maior complexo de kart com entretenimento do país, fundado pelo piloto Tuka Rocha: pista híbrida indoor/outdoor de 1,2km com túnel estilo Mônaco, simuladores de F1 e bar — formato forte para grupos e eventos corporativos.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Speedland Kart Center'));

-- ===== 3. Adrena Paintball & Airsoft (paintball) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Adrena Paintball & Airsoft', 'paintball', null, null, null, 'https://adrenapaintball.com/', null, 'São Paulo',
  'Estabelecido e cinematográfico. Mais de 18 anos de mercado e 3 bases com cenários imersivos (Favela de 5.000m², Afeganistão); ideal para team building corporativo, despedidas de solteiro e grupos grandes.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Adrena Paintball & Airsoft'));

-- ===== 4. Hatchet House Brasil (arremesso de machado) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Hatchet House Brasil', 'machado', null, null, null, null, 'Vila Olímpia', 'São Paulo',
  'Raro e experiencial. Primeira casa de arremesso de machado do Brasil: 600m² com 8 pistas, instrutores, bar e cozinha autoral na Rua Prof. Vahia de Abreu 587 — experiência urbana inusitada e muito fotogênica.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Hatchet House Brasil'));

-- ===== 5. Casa de Pedra (escalada) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Casa de Pedra', 'escalada', null, null, null, 'https://casadepedra.com.br/', 'Pompeia', 'São Paulo',
  'Referência e acessível. Maior ginásio de escalada da América do Sul, com unidades na Pompeia e em Moema; day pass com instrução inicial inclusa, boulder e top rope para iniciantes sem agendamento.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Casa de Pedra'));

-- ===== 6. Arco e Flecha Panizo (arquearia) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Arco e Flecha Panizo', 'arquearia', null, null, null, 'https://www.arcopanizo.com.br/', null, 'São Paulo',
  'Autoral e raríssimo. Escola do tricampeão mundial de arco e flecha Panizo, com mais de 33 anos de experiência; aulas avulsas de 1h para duplas, casais e pequenos grupos — formato de experiência pronto.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Arco e Flecha Panizo'));

-- ===== 7. Escape 60' (escape room) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Escape 60''', 'escape', null, null, null, 'https://escape60.com.br/', 'Vila Olímpia', 'São Paulo',
  'Estabelecido e corporativo. Maior rede de escape rooms do Brasil, com 5 unidades em SP (Vila Olímpia, Pinheiros, Tatuapé, Moema, Jardins); salas temáticas imersivas para grupos de 2 a 12 pessoas e forte atuação em team building.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Escape 60'''));

-- ===== 8. Escola de Vela Kaluanã (náutica) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Escola de Vela Kaluanã', 'nautica', null, null, null, 'https://www.escolakaluana.com.br/', 'Guarapiranga', 'São Paulo',
  'Raro e sofisticado. Escola de vela na Represa Guarapiranga, uma das melhores raias do país (águas calmas e vento constante); curso básico de 12h em turmas de 1-2 alunos e vivências de um dia — experiência náutica sem sair da cidade.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Escola de Vela Kaluanã'));

-- ===== 9. Trapézio Voador (circo) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'Trapézio Voador', 'circo', 'trapeziovoador', null, null, 'https://www.trapeziovoador.com.br/', 'Butantã', 'São Paulo',
  'Raríssimo e instagramável. Escola de artes circenses com trapézio voador (grand volant), tecido acrobático e lira na Rua Alvarenga 150, perto do metrô Butantã; aula experimental com rede e lonja de segurança — frio na barriga garantido.'
where not exists (select 1 from public.prospects where lower(nome) = lower('Trapézio Voador'));

-- ===== 10. AVSP - Autódromo Virtual de São Paulo (simulador) =====
insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, bairro, cidade, observacoes)
select 'AVSP - Autódromo Virtual de São Paulo', 'simulador', null, '11947430590', null, 'https://www.avsp.com.br/', 'Vila Romana', 'São Paulo',
  'Jovem e tecnológico. Centro de automobilismo virtual com simuladores profissionais na Rua Catão 904, baterias agendadas e campeonatos amadores — experiência de pilotagem realista, alternativa indoor ao kart.'
where not exists (select 1 from public.prospects where lower(nome) = lower('AVSP - Autódromo Virtual de São Paulo'));


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Roda essa query pra conferir os 10 prospects novos:
--
--   select nome, categoria, bairro, status
--   from public.prospects
--   where categoria in ('golfe','kart','paintball','machado','escalada',
--                       'arquearia','escape','nautica','circo','simulador')
--   order by nome;
--
-- Esperado: 10 linhas, todas com status 'nao_contatado'.
