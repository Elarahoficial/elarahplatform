-- =============================================================
-- ELARAH — Templates de Primeiro Contato (3 canais)
-- -------------------------------------------------------------
-- Adiciona 3 templates de primeiro contato em prospect_templates,
-- um por canal (WhatsApp, DM Instagram, E-mail). Tom premium,
-- natural, curatorial — não parece disparo nem agência.
--
-- VARIÁVEIS suportadas pelo client do admin (substituídas ao
-- copiar a mensagem):
--   {{nome}}, {{categoria}}, {{bairro}}
--
-- O "[seu nome]" e os contatos pessoais NÃO são variáveis do
-- sistema — são placeholders que o admin troca à mão na hora
-- de enviar (assinatura do fundador / curadora real).
--
-- IDEMPOTÊNCIA
--   Insere via WHERE NOT EXISTS pelo nome do template. Pode
--   rodar quantas vezes for. Templates editados pelo admin
--   com esses nomes NÃO são sobrescritos.
-- =============================================================

-- Pré-checagem amigável: aborta se a tabela prospect_templates
-- ainda não existir (depende de sql/elarah_crm_prospects.sql).
do $$
begin
  if not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'prospect_templates'
  ) then
    raise exception 'Tabela prospect_templates ausente. Rode sql/elarah_crm_prospects.sql antes.';
  end if;
end$$;


-- ===== 1. Primeiro contato — WhatsApp =====
-- Canal: mobile, lido em segundos. Sem assinatura formal, sem
-- assunto. Ordem 10 pra ficar acima dos templates de follow-up
-- (que ficam em 2+) e logo abaixo do "Padrão geral" (0).
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select
  'Primeiro contato — WhatsApp',
  null::text,
  E'Oi {{nome}}, aqui é a [seu nome] da Elarah.\n\nA gente cura uma plataforma de experiências autorais em SP — e {{nome}} é exatamente o tipo de ateliê que aparece quando alguém procura {{categoria}} de verdade.\n\nFaria sentido a gente trocar uma ideia rápida sobre uma parceria? Te conto em 2-3 mensagens, sem rodeio.',
  false,
  10,
  true
where not exists (
  select 1 from public.prospect_templates
   where nome = 'Primeiro contato — WhatsApp'
);


-- ===== 2. Primeiro contato — DM Instagram =====
-- Canal: feed-first. Primeira linha vira preview na inbox da
-- pessoa, então abre com o elogio específico ao trabalho dela.
-- Pede o WhatsApp pra migrar a conversa pro canal mais
-- comercial.
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select
  'Primeiro contato — DM Instagram',
  null::text,
  E'Oi {{nome}}, há um tempo acompanho vocês por aqui e o trabalho de {{categoria}} de vocês é um dos que dá vontade de levar pra quem busca experiência autoral em SP.\n\nFaço a curadoria da Elarah — plataforma de experiências em São Paulo. Sou bem seletiva com quem entra, e {{nome}} encaixa muito.\n\nSe fizer sentido, te chamo no WhatsApp em 2-3 linhas e te explico como pensei a parceria. Manda seu número?',
  false,
  11,
  true
where not exists (
  select 1 from public.prospect_templates
   where nome = 'Primeiro contato — DM Instagram'
);


-- ===== 3. Primeiro contato — E-mail =====
-- Canal: leitura calma, tela maior. Inclui assunto sugerido na
-- primeira linha do conteúdo (admin copia o corpo todo e usa a
-- linha "Assunto:" como guia ao montar o e-mail). Encerra com
-- um CTA específico (2 horários) pra reduzir atrito de resposta.
insert into public.prospect_templates (nome, categoria, conteudo, is_default, ordem, is_active)
select
  'Primeiro contato — E-mail',
  null::text,
  E'Assunto: Conversa rápida — Elarah e {{nome}}\n\nOi {{nome}}, tudo bem?\n\nSou a [seu nome], curadora da Elarah — plataforma de experiências autorais em São Paulo. A Elarah é uma curadoria seletiva por desenho, e {{nome}} está entre os perfis mais alinhados com o que a gente entrega em {{categoria}}.\n\nAcompanho o trabalho de vocês há um tempo. Queria propor uma conversa curta — 10-15 minutos — sobre como uma parceria poderia funcionar. Sem compromisso, é mais pra você sentir se faz sentido pro momento de vocês.\n\nSe topar, me responde com dois horários que ficariam bons pra você na semana que vem — eu confirmo um.\n\nUm abraço,\n[seu nome]\nWhatsApp: [seu número]\nelarah.com.br',
  false,
  12,
  true
where not exists (
  select 1 from public.prospect_templates
   where nome = 'Primeiro contato — E-mail'
);


notify pgrst, 'reload schema';
