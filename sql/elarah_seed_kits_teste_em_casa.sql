-- =============================================================
-- ELARAH — Seed de TESTE: 2 kits "Elarah em Casa"
-- -------------------------------------------------------------
-- Cria 2 produtos de exemplo só pra popular a vitrine da página
-- elarah-em-casa.html e a gente ver a cara do site.
--
-- Como a vitrine funciona (elarah-em-casa.js): mostra qualquer
-- experiência cujo NOME ou CATEGORIA contenha "kit", "diy" ou
-- "em casa". Por isso a categoria aqui é "Kit em casa".
--
-- Os filtros por coleção/tipo casam por palavra-chave:
--   - "Ritual da Noite" → coleção Ritual (termos: ritual/noite)
--   - "A Dois"          → coleção A Dois  (termos: dois/date/...)
--   - "Velas"           → tipo Velas      (termos: vela/aroma)
--   - "Cerâmica"        → tipo Cerâmica   (termos: ceram/argila)
--
-- Usa só colunas do schema base (sempre presentes) + reaproveita
-- imagens que já existem em /assets. IDEMPOTENTE (insere 1x por nome).
-- Rode no Supabase (SQL Editor) com usuário admin.
--
-- ⚠️ TESTE: estes são "experiências" reaproveitadas pra demo visual.
-- A venda de produto físico de verdade (frete/estoque/endereço) ainda
-- depende das mudanças do panorama — ver chat.
-- =============================================================

-- 1) Kit de Velas — Ritual da Noite -----------------------------------------
insert into public.experiences
  (nome, categoria, data, duracao, bairro, endereco, inclui, preco, cor, imagem, descricao, horario, horarios, fornecedor_nome)
select
  'Kit de Velas — Ritual da Noite',
  'Kit em casa',
  'Sob demanda',
  'No seu tempo',
  'Entrega em casa',
  'Enviamos para todo o Brasil',
  'Cera de soja, 2 pavios, essência relaxante (lavanda), recipiente de vidro, termômetro e guia de ritual impresso.',
  'R$189',
  '#b9764f,#8a9a80',
  'assets/velaaromatica.jpg',
  'O fim de dia que você merece, dentro de casa.

Um kit completo pra você criar sua própria vela aromática e transformar a noite num ritual de desacelerar. Acende, respira e deixa o mundo lá fora esperar.

O que você vai viver:
— Derreter a cera e sentir o aroma tomar conta do ambiente
— Montar sua vela do jeitinho que você gosta
— Fechar o dia com presença, sem telas

Chega em casa. O resto é com você.',
  '',
  '{}',
  'Elarah em Casa'
where not exists (
  select 1 from public.experiences where lower(nome) = lower('Kit de Velas — Ritual da Noite')
);

-- 2) Kit de Cerâmica — A Dois ------------------------------------------------
insert into public.experiences
  (nome, categoria, data, duracao, bairro, endereco, inclui, preco, cor, imagem, descricao, horario, horarios, fornecedor_nome)
select
  'Kit de Cerâmica — A Dois',
  'Kit em casa',
  'Sob demanda',
  'No seu tempo',
  'Entrega em casa',
  'Enviamos para todo o Brasil',
  'Argila que seca ao ar (500g), 2 jogos de ferramentas, base giratória, tintas, pincéis e guia passo a passo — pensado pra duas pessoas.',
  'R$249',
  '#a3633f,#b9764f',
  'assets/torno.jpg',
  'Troquem o jantar fora por uma noite criando juntos.

Um date em casa de verdade: duas porções de argila, ferramentas pra dois e tempo pra modelar lado a lado. No fim, cada um leva uma peça feita à mão — a lembrança de uma noite sem pressa.

O que vocês vão viver:
— Colocar a mão na argila, juntos, sem precisar saber nada antes
— Modelar, errar, rir e tentar de novo
— Guardar uma peça que vira memória

Um presente e um programa, no mesmo box.',
  '',
  '{}',
  'Elarah em Casa'
where not exists (
  select 1 from public.experiences where lower(nome) = lower('Kit de Cerâmica — A Dois')
);
