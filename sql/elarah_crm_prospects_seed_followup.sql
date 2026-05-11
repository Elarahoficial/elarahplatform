-- =============================================================
-- ELARAH — Seed: Templates de Follow-up pra Prospecção (parceiros)
-- -------------------------------------------------------------
-- Adiciona 3 templates de follow-up na tabela prospect_templates
-- pra cobrir a régua completa de retomada de contato com
-- possíveis parceiros (ateliês, professores, fornecedores de
-- experiência). Variáveis suportadas pelo client:
--   {{nome}}, {{categoria}}, {{bairro}}
--
-- ETAPAS DO FOLLOW-UP
--
--   1. Follow-up 1 — 3-5 dias após primeira mensagem
--      Leve, sem cobrança. Apenas "olha, mandei aquele dia,
--      qualquer coisa me responde mesmo que seja não".
--
--   2. Follow-up 2 — 1-2 semanas (com convite curto)
--      Reforça a proposta com 1 frase nova e oferece um
--      formato simples de conversa (10-15 min).
--
--   3. Follow-up 3 — 3+ semanas (porta aberta)
--      Última tentativa, sem desespero. "Deixa a porta aberta
--      pro futuro" — preserva relacionamento mesmo se não
--      respondeu agora.
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS pelo nome — pode rodar várias
--   vezes sem duplicar. Templates já editados pelo admin com
--   esses nomes são preservados (NÃO sobrescreve conteúdo).
-- =============================================================


-- Pré-checagem: aborta se a tabela prospect_templates não existir
-- (depende de sql/elarah_crm_prospects.sql ter rodado antes).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prospect_templates'
  ) then
    raise exception 'Tabela public.prospect_templates não existe. Rode sql/elarah_crm_prospects.sql primeiro.';
  end if;
end $$;


-- ===== Follow-up 1 — Leve (3-5 dias) =====
-- Categoria null = template global (aparece em qualquer prospect).
-- ordem=10 pra ficar agrupado com os follow-ups (a default fica em 0).
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Follow-up 1 — 3 a 5 dias (leve)', null,
'Oi, {{nome}}! Tudo bem?

Mandei uma mensagem por aqui esses dias falando da Elarah e queria só dar um up — sem pressão. Sei que a rotina é corrida, principalmente em {{categoria}}.

Se fizer sentido conversar, qualquer dia dessa semana eu consigo dar um pulo aí no {{bairro}} ou marcar um café virtual. Se não for o momento, também me avisa que aí volto a falar mais pra frente.

Um abraço!',
10, true
where not exists (
  select 1 from public.prospect_templates where lower(nome) = lower('Follow-up 1 — 3 a 5 dias (leve)')
);


-- ===== Follow-up 2 — Com convite curto (1-2 semanas) =====
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Follow-up 2 — 1 a 2 semanas (com convite)', null,
'Oi, {{nome}}! Volto aqui rapidinho 💛

Estou montando a curadoria da Elarah pros próximos meses e o seu trabalho em {{categoria}} continua sendo uma referência que eu quero muito ter na plataforma.

Topa marcar 15 minutos esta semana pra eu te contar como funciona a parceria? Promete ser objetivo — se não for pra você, sem problema nenhum.

Posso te ligar ou ir aí no {{bairro}}, o que for mais fácil.

Abraço!',
11, true
where not exists (
  select 1 from public.prospect_templates where lower(nome) = lower('Follow-up 2 — 1 a 2 semanas (com convite)')
);


-- ===== Follow-up 3 — Porta aberta (3+ semanas, última tentativa) =====
-- Tom mais final, mas sem queimar a ponte. Permite voltar no
-- futuro se o contexto mudar.
insert into public.prospect_templates (nome, categoria, conteudo, ordem, is_active)
select 'Follow-up 3 — porta aberta (3+ semanas)', null,
'Oi, {{nome}}!

Sei que mandei algumas mensagens por aqui e talvez não seja o momento — sem nenhum problema. Só queria deixar registrado que a Elarah segue interessada em parceria com o seu trabalho em {{categoria}}, e qualquer hora que fizer sentido, é só responder esta conversa.

Se preferir, também consigo te mandar um material por email pra você ler com calma quando quiser. Me avisa.

Um abraço grande,
Elarah',
12, true
where not exists (
  select 1 from public.prospect_templates where lower(nome) = lower('Follow-up 3 — porta aberta (3+ semanas)')
);


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
-- Roda essa query pra ver os 3 templates novos:
--
--   select nome, categoria, ordem, is_active
--   from public.prospect_templates
--   where nome ilike '%follow-up%'
--   order by ordem;
--
-- Esperado: 3 linhas com ordem 10, 11, 12.
