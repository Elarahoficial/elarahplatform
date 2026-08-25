-- =============================================================
-- ELARAH — Cronograma Onda 1
-- -------------------------------------------------------------
-- Atualiza o cronograma semanal pra refletir a estratégia revisada
-- (volume real de prospecção 44/sem + comunidade WA pulsando 4x +
-- LinkedIn 2x + TikTok cross-post + retenção pós-evento + reflexão
-- semanal).
--
-- Operações:
--   1. UPDATE 3 templates existentes (rename) — só toca se ainda
--      estão com o título original (preserva customizações)
--   2. INSERT 8 novos templates — só insere se não existir título
--      exatamente igual
--   3. UPDATE tasks da semana atual e futuras pra refletir os novos
--      títulos (preserva tasks pontuais — kind='manual' não toca)
--
-- IDEMPOTENTE: condições garantem no-op em re-runs.
-- REVERSÍVEL: re-rodar elarah_op_semanal.sql NÃO restaura títulos
--   originais (a UPDATE é one-way) — se precisar reverter, ajusta
--   manualmente via UI Templates.
-- =============================================================


-- ===== 1. RENAMES =====
-- Cada UPDATE só altera se o título ainda for o original.

update public.routine_templates
   set titulo = '🎯 Pesquisar 22 prospects novos (1ª metade — meta 44/sem)'
 where week_day = 1
   and titulo  = 'Pesquisar 10 prospects novos';

update public.routine_templates
   set titulo = '✉️ Mandar 11 mensagens iniciais (1ª metade)'
 where week_day = 1
   and titulo  = 'Mandar 5 mensagens iniciais';

update public.routine_templates
   set titulo = '💬 Mensagem grupo WA #3 — lista da semana com links pra reservar'
 where week_day = 3
   and titulo  = 'Mensagem do grupo WhatsApp Elarah';


-- ===== 2. INSERTS de novos templates =====
-- Pattern padrão: insere uma row no values, só se não houver um
-- template com mesmo (week_day, titulo).

-- TERÇA: TikTok cross-post
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select v.week_day, v.titulo, v.responsavel, v.ordem
  from (values
    (1, '📱 TikTok #1 — reaproveitar Reel da semana anterior', 'voce', 60)
  ) as v(week_day, titulo, responsavel, ordem)
 where not exists (
   select 1 from public.routine_templates t
    where t.week_day = v.week_day and t.titulo = v.titulo
 );

-- QUARTA: WA #2 + LinkedIn case
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select v.week_day, v.titulo, v.responsavel, v.ordem
  from (values
    (2, '💬 Mensagem grupo WA #2 — teaser dos novos parceiros (foto + nome)', 'voce', 50),
    (2, '🔗 LinkedIn — case ou aprendizado da semana (autoridade prática)',  'voce', 60)
  ) as v(week_day, titulo, responsavel, ordem)
 where not exists (
   select 1 from public.routine_templates t
    where t.week_day = v.week_day and t.titulo = v.titulo
 );

-- QUINTA: TikTok #2 cross-post do Reel
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select v.week_day, v.titulo, v.responsavel, v.ordem
  from (values
    (3, '📱 TikTok #2 — cross-post do Reel de conversão de hoje', 'voce', 25)
  ) as v(week_day, titulo, responsavel, ordem)
 where not exists (
   select 1 from public.routine_templates t
    where t.week_day = v.week_day and t.titulo = v.titulo
 );

-- SEXTA: prospects 2ª metade + WA #4 + lição aprendida
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select v.week_day, v.titulo, v.responsavel, v.ordem
  from (values
    (4, '🎯 Pesquisar 22 prospects novos (2ª metade)',                            'socia', 5),
    (4, '✉️ Mandar 11 mensagens iniciais (2ª metade)',                            'socia', 8),
    (4, '💬 Mensagem grupo WA #4 — programação do fim de semana',                 'voce',  15),
    (4, '🧠 Lição aprendida da semana (1 frase: o que funcionou e o que não)',    'ambas', 35)
  ) as v(week_day, titulo, responsavel, ordem)
 where not exists (
   select 1 from public.routine_templates t
    where t.week_day = v.week_day and t.titulo = v.titulo
 );

-- SÁBADO: DM privado pós-evento
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select v.week_day, v.titulo, v.responsavel, v.ordem
  from (values
    (5, '❤️ DM privado agradecendo 5-10 participantes (retenção)', 'voce', 50)
  ) as v(week_day, titulo, responsavel, ordem)
 where not exists (
   select 1 from public.routine_templates t
    where t.week_day = v.week_day and t.titulo = v.titulo
 );


-- ===== 3. PROPAGAR RENAMES pra tasks da semana atual e futuras =====
-- Tasks com kind='template' herdam título do template atualizado.
-- Tasks manuais ou de experiência permanecem.
update public.routine_tasks rt
   set titulo = tpl.titulo
  from public.routine_templates tpl
 where rt.template_id = tpl.id
   and rt.kind = 'template'
   and rt.week_start >= current_date - interval '7 days'
   and rt.titulo <> tpl.titulo;


-- ===== 4. Validação =====
-- Esperado:
--   templates_ativos = 36 (28 base + 8 novos)
--   tem_emoji_alvo = 2 (prospects 1ª e 2ª metades)
--   msgs_wa_estruturadas = 3 (#2, #3, #4)
--   posts_linkedin = 2 (Qua case + Sex post longo)
--   tiktoks = 2 (Ter + Qui)
select
  (select count(*) from public.routine_templates
    where is_active = true) as templates_ativos,
  (select count(*) from public.routine_templates
    where is_active = true and titulo like '🎯%') as tem_emoji_alvo,
  (select count(*) from public.routine_templates
    where is_active = true and titulo like '💬 Mensagem grupo WA%') as msgs_wa_estruturadas,
  (select count(*) from public.routine_templates
    where is_active = true and (titulo like '🔗 LinkedIn%' or titulo like 'LinkedIn%')) as posts_linkedin,
  (select count(*) from public.routine_templates
    where is_active = true and titulo like '📱 TikTok%') as tiktoks;


notify pgrst, 'reload schema';
