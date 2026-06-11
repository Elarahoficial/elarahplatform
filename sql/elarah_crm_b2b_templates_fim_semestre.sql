-- =============================================================
-- ELARAH — Templates B2B: Experiência de Fim de Semestre
-- -------------------------------------------------------------
-- Mensagens de abordagem pra RH / Gente e Cultura oferecendo uma
-- experiência pros funcionários no fechamento de semestre. Cobrem
-- os dois formatos (Elarah vai até a empresa OU o time vai ao
-- ateliê) e os dois ganchos (confraternização + bem-estar/
-- engajamento), pra testar qual converte melhor.
--
-- Variáveis disponíveis (substituídas no client):
--   {{contato}}  {{empresa}}  {{cargo}}  {{segmento}}  {{cidade}}
--
-- IDEMPOTENTE — só insere se ainda não existir (guard por nome).
-- Pode rodar quantas vezes precisar. Como é só dado, os templates
-- aparecem na hora no botão "Templates B2B" do admin (sem deploy).
-- =============================================================

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Fim de semestre — 1º contato RH (WhatsApp)', 'data_comemorativa',
'Oi {{contato}}, tudo bem? 😊

Sou da Elarah, plataforma de experiências em São Paulo. Com o fim do semestre chegando, a gente ajuda times a fechar o período com uma experiência marcante de verdade — pode ser a Elarah levando a oficina até a {{empresa}} ou o time vindo viver a experiência num dos nossos ateliês.

São formatos curtos, presenciais e super criativos (pintura com aperol, gastronomia, velas/perfumaria, cocktails). A gente cuida de tudo: espaço, material e instrutor.

Posso te mandar 2-3 opções pensadas pro tamanho do seu time? Abraço!', false, 9
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Fim de semestre — 1º contato RH (WhatsApp)');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Fim de semestre — bem-estar e engajamento (e-mail)', 'acao_equipe',
'Olá, {{contato}}! Tudo bem?

Sou da Elarah, plataforma de experiências curadas em São Paulo. Times que fecham o semestre com um momento de conexão e descontração fora da rotina costumam voltar mais engajados — e isso pesa direto em retenção e clima.

Montamos experiências pensadas pra esse fechamento, com formato flexível: a gente vai até a {{empresa}} ou o time vem viver a experiência no ateliê. Grupos de 8 a 30 pessoas, tudo incluso (espaço, material e instrutor).

Como vocês são referência em {{segmento}}, adoraria entender o que faria mais sentido pro seu time. Tenho 20 minutos na semana — topa um café virtual pra eu te mostrar 2-3 formatos?

Um abraço,
Elarah', false, 10
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Fim de semestre — bem-estar e engajamento (e-mail)');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Fim de semestre — convite cortesia', 'convite_experiencia',
'Oi {{contato}}!

Antes de fechar a ação de fim de semestre, que tal experimentar? Posso reservar 1-2 vagas de cortesia pra você (ou alguém do time da {{empresa}}) viver uma das experiências da Elarah e sentir o formato na pele.

Sem compromisso nenhum — é só pra você ter segurança na hora de propor pro time. Topa? Me diz uma semana que funciona melhor.

Abraço!', false, 11
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Fim de semestre — convite cortesia');

insert into public.b2b_prospect_templates (nome, categoria, conteudo, is_default, ordem)
select 'Fim de semestre — follow-up', 'follow_up',
'Oi {{contato}}, tudo bem?

Só retomando aqui sobre a experiência de fim de semestre pro time da {{empresa}} — sei que essa época fica corrida no RH. 🙂

As agendas de dezembro/fechamento enchem rápido, então se fizer sentido pra vocês eu já garanto uma data com prioridade. Qualquer feedback (mesmo "fica pro próximo semestre") já me ajuda a me organizar.

Quer que eu te mande as opções com preço pra você avaliar com calma? Abraço!', false, 12
where not exists (select 1 from public.b2b_prospect_templates where nome = 'Fim de semestre — follow-up');

notify pgrst, 'reload schema';
