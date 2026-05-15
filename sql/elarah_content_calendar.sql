-- =============================================================
-- ELARAH — Calendário Editorial / Cronograma de Conteúdo
-- -------------------------------------------------------------
-- Cada linha = 1 post planejado num dia/canal específico.
-- Admin gerencia tudo via aba "Conteúdo".
-- =============================================================

create table if not exists public.content_calendar (
  id              uuid primary key default gen_random_uuid(),
  data            date not null,
  canal           text not null,           -- 'Instagram' | 'TikTok' | 'LinkedIn' | 'WhatsApp'
  tipo            text,                    -- 'Feed' | 'Reels' | 'Stories' | 'Carrossel' | 'Editorial'
  ideia           text not null,
  legenda         text,
  observacao      text,
  hashtags        text,
  status          text default 'planejado', -- 'planejado' | 'pronto' | 'agendado' | 'publicado'
  display_order   integer default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_content_calendar_data
  on public.content_calendar (data, canal);

create index if not exists idx_content_calendar_canal
  on public.content_calendar (canal, data);

drop trigger if exists set_content_calendar_updated_at on public.content_calendar;
create trigger set_content_calendar_updated_at
  before update on public.content_calendar
  for each row execute function public.set_updated_at();

alter table public.content_calendar enable row level security;

drop policy if exists "content_calendar_admin_all" on public.content_calendar;
create policy "content_calendar_admin_all"
  on public.content_calendar for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- SEED — Cronograma Maio 2026 baseado no template editorial
-- =============================================================

-- Limpa qualquer seed anterior do mesmo mês pra ser idempotente
delete from public.content_calendar where data >= '2026-05-01' and data <= '2026-05-31';

-- ===== SEMANA 1: BOAS-VINDAS AO MÊS =====
insert into public.content_calendar (data, canal, tipo, ideia, legenda, observacao, status) values
('2026-05-01', 'Instagram', 'Feed', 'Editorial sensorial de abertura: "Maio começa devagar"', 'Maio começa devagar. Não tem pressa. Tem tempo, tem corpo, tem presença. ☁️', 'Sexta — abertura suave do mês', 'publicado'),
('2026-05-02', 'Instagram', 'Stories', 'Stories sábado: bastidor do ateliê', 'Onde o tempo desacelera. 🤍', 'Sábado bastidor', 'publicado'),
('2026-05-02', 'WhatsApp', 'Mensagem', 'Abertura do mês: agenda nova', '🤍 Maio chegou na Elarah. Olha o que preparamos pra esse mês:\n\n[link da agenda]', 'WhatsApp Curado — abertura do mês', 'publicado'),
('2026-05-03', 'Instagram', 'Feed', 'Editorial sensorial domingo: "O domingo é pra o corpo respirar"', 'O domingo é pra o corpo respirar. Sem CTA. Sem urgência. Só o tempo.', 'Domingo editorial', 'publicado'),
('2026-05-04', 'Instagram', 'Carrossel', 'Carrossel: "Agenda Elarah — Maio" (10 experiências do mês)', 'Maio na Elarah. Cada experiência foi escolhida pra te tirar do automático. Salva pra escolher a sua.', 'Segunda — curadoria semanal', 'publicado'),
('2026-05-05', 'Instagram', 'Feed', 'Conheça [Parceiro 1] — bastidor do ateliê', 'Quem está por trás de [nome do parceiro] na Elarah. Um lugar pra desacelerar e criar.', 'Terça — bastidor parceiro', 'publicado'),
('2026-05-05', 'TikTok', 'Reels', 'Reels: 15s do parceiro montando a experiência', 'Bastidor [nome do parceiro] — Elarah.', 'Curto e silencioso', 'publicado'),
('2026-05-06', 'WhatsApp', 'Mensagem', 'Curadoria de fim de semana', '🤍 Fim de semana chegando. 3 experiências pra você viver:\n\n[lista]', 'WhatsApp — curadoria sex/sab', 'publicado'),
('2026-05-06', 'Instagram', 'Stories', 'Stories educacionais: "Por que sair da tela faz bem" (5 cards)', '5 cards educativos com dados de bem-estar', 'Quarta educacional', 'publicado'),
('2026-05-07', 'Instagram', 'Carrossel', '"5 experiências pra esse fim de semana"', 'Sexta tá perto. Aqui vão 5 ideias pra fugir do automático.', 'Quinta — curadoria fim de semana', 'publicado'),
('2026-05-08', 'Instagram', 'Reels', 'Reel mão criando: silencioso + 1 tipografia', 'Mãos na argila. Sem trilha. Só o som da matéria.', 'Sexta — mão em ação', 'publicado'),
('2026-05-08', 'Instagram', 'Stories', 'Stories sexta: "Boa sexta. Te vejo no ateliê"', 'Boa sexta. Te vejo no ateliê. 🤍', 'Sticker de link', 'publicado'),
('2026-05-09', 'Instagram', 'Stories', 'Última vaga real (3-4 stories ao longo do dia)', 'Última vaga em [nome da exp] HOJE às [hora]. Quem fica?', 'Sábado — urgência real', 'publicado'),
('2026-05-10', 'WhatsApp', 'Mensagem', 'Destaque parceiro novo', '🤍 Novo parceiro chegou: [nome]. Olha o que ele criou pra Elarah:\n\n[link]', 'WhatsApp — destaque parceiro', 'publicado'),
('2026-05-10', 'Instagram', 'Feed', 'Editorial domingo sensorial', 'Domingo é pausa, não fim. 🤍', 'Domingo editorial', 'publicado'),

-- ===== SEMANA 2: CATEGORIA EM FOCO (FLORAL) =====
('2026-05-11', 'Instagram', 'Feed', '"Essa semana a gente fala de flores"', 'Maio mergulhou no floral. Toda semana, uma categoria em foco — essa é a vez delas: as flores.', 'Segunda — abertura categoria', 'publicado'),
('2026-05-11', 'Instagram', 'Stories', 'Stories: bastidor da floricultura parceira', 'Onde nascem os buquês da semana.', '', 'publicado'),
('2026-05-12', 'TikTok', 'Reels', 'Reel floral + slow motion', 'O que acontece quando você corta uma flor com tempo.', 'Terça — reels emocional', 'publicado'),
('2026-05-13', 'Instagram', 'Carrossel', 'Carrossel educativo: "Como escolher seu primeiro buquê" (3 dicas)', 'Primeira vez fazendo um buquê? 3 coisas pra você saber antes.', 'Quarta — educacional', 'planejado'),
('2026-05-14', 'WhatsApp', 'Mensagem', 'Última vaga da semana', '🤍 Última vaga em [exp floral] esse fim de semana.\n\nQuer? [link]', 'WhatsApp — urgência real', 'planejado'),
('2026-05-14', 'Instagram', 'Feed', '"Todos os ateliês de floral na Elarah" (grid)', 'Os ateliês de floral curados pela Elarah, num só lugar.', 'Quinta — grid categoria', 'planejado'),
('2026-05-15', 'Instagram', 'Stories', 'Bastidor da prep do final de semana no ateliê', 'O que rola antes de você chegar.', 'Sexta — bastidor', 'planejado'),
('2026-05-16', 'Instagram', 'Stories', 'Live ou bastidor real (se possível)', 'Live no ateliê — 20min de bastidor', 'Sábado — live se rolar', 'planejado'),
('2026-05-17', 'WhatsApp', 'Mensagem', 'Categoria em foco', '🤍 Toda semana a gente mergulha numa categoria. Essa semana foi floral. Quer relembrar tudo?\n\n[link]', 'WhatsApp — síntese da semana', 'planejado'),
('2026-05-17', 'Instagram', 'Feed', 'Depoimento de cliente da semana', '"Foi a melhor pausa que eu dei pra mim em meses." — [cliente]', 'Domingo — depoimento', 'planejado'),

-- ===== SEMANA 3: CRIATIVO =====
('2026-05-18', 'Instagram', 'Feed', '"Coisas não óbvias pra fazer essa semana"', 'A lista de coisas que ninguém te indicou pra essa semana.', 'Segunda — curadoria criativa', 'planejado'),
('2026-05-19', 'TikTok', 'Reels', 'POV: "Minha experiência na Elarah"', 'Quando você sai de uma experiência Elarah.', 'Terça — POV emocional', 'planejado'),
('2026-05-20', 'Instagram', 'Stories', 'Caixinha: "Que tipo de experiência você quer ver mais?"', 'Conta pra gente.', 'Quarta — interação', 'planejado'),
('2026-05-21', 'WhatsApp', 'Mensagem', 'Curadoria fim de semana', '🤍 Fim de semana à vista. 3 ideias pra escapar do automático:\n\n[lista]', 'WhatsApp', 'planejado'),
('2026-05-21', 'Instagram', 'Carrossel', '"Presente diferente pra Dia dos Namorados"', 'Sem flor. Sem chocolate. Uma experiência pra vocês viverem juntos.', 'Quinta — gancho DDN', 'planejado'),
('2026-05-22', 'Instagram', 'Feed', 'Parceiro novo do mês (anúncio)', 'Bem-vindo, [nome]. A partir de junho vocês podem viver isso na Elarah.', 'Sexta — anúncio', 'planejado'),
('2026-05-23', 'Instagram', 'Stories', 'Última vaga', '🤍 1 vaga restante em [exp].', '', 'planejado'),
('2026-05-24', 'Instagram', 'Reels', 'Reel editorial: compilado de mãos criando (15-20s)', 'Mãos. Tempo. Memória.', 'Domingo — editorial visual', 'planejado'),

-- ===== SEMANA 4: COBERTURA + RETROSPECTIVA =====
('2026-05-25', 'WhatsApp', 'Mensagem', 'Destaque pra data comemorativa', '🤍 Dia dos Namorados a duas semanas. Olha o que separamos pra vocês viverem juntos:\n\n[link campanha DDN]', 'WhatsApp — DDN', 'planejado'),
('2026-05-25', 'Instagram', 'Carrossel', '"O que rolou na Elarah em maio"', 'Maio foi cheio. Aqui está o que vocês viveram.', 'Segunda — retrospectiva', 'planejado'),
('2026-05-26', 'Instagram', 'Stories', 'Depoimentos reais (3-4 prints)', 'Quem viveu, conta. 🤍', 'Terça', 'planejado'),
('2026-05-27', 'TikTok', 'Reels', '"Maio em 30 segundos" (compilado)', 'Um mês na Elarah, em 30 segundos.', 'Quarta — reel retrospectiva', 'planejado'),
('2026-05-28', 'Instagram', 'Feed', '"Vem aí em junho" (teaser DDN)', 'Junho na Elarah começa com Dia dos Namorados. Em breve.', 'Quinta — teaser próximo mês', 'planejado'),
('2026-05-29', 'WhatsApp', 'Mensagem', 'Agenda próximo mês começa a chegar', '🤍 Junho a caminho. Em breve as primeiras experiências.\n\nQuem quer ser avisado primeiro? Responde com 🤍', 'WhatsApp — antecipação', 'planejado'),
('2026-05-29', 'Instagram', 'Stories', 'Agradecimento + CTA pra grupo WhatsApp', 'Maio foi com vocês. Junho vai ser mais.\n\n👉 Entre no grupo VIP pra ser avisada primeiro.', 'Sexta', 'planejado'),
('2026-05-30', 'Instagram', 'Stories', 'Última vaga do mês', 'Última vaga de maio em [exp]. 🤍', 'Sábado', 'planejado'),
('2026-05-31', 'Instagram', 'Feed', 'Editorial sensorial fechando o mês', 'Maio se vai com mãos limpas, peças prontas e o corpo mais leve. Junho começa amanhã. 🤍', 'Domingo — editorial fim de mês', 'planejado'),

-- ===== LINKEDIN — uma vez por semana =====
('2026-05-04', 'LinkedIn', 'Post', 'B2B: "Por que empresas estão substituindo happy hour por experiências criativas"', '[post B2B sobre experiências corporativas — gancho cultura organizacional]', 'Segunda LinkedIn', 'publicado'),
('2026-05-11', 'LinkedIn', 'Post', 'Case: empresa cliente que fez experiência em equipe', '[case real ou template] — engajamento via cultura', '', 'publicado'),
('2026-05-18', 'LinkedIn', 'Post', 'Dado/estatística: cultura de bem-estar nas empresas', '[post com gancho dados Gallup, sebrae, etc.]', '', 'planejado'),
('2026-05-25', 'LinkedIn', 'Post', 'Editorial: "O que cultura organizacional virou em 2026"', '[post mais opinativo]', 'Última semana', 'planejado'),

-- ===== WHATSAPP COMUNIDADE — engajamento (não promocional, sem link) =====
('2026-05-13', 'WhatsApp', 'Enquete', 'Enquete: "Qual experiência você quer ver mais na Elarah?"', 'Opções: 🎨 Pintura · 🍷 Bartender · 🌸 Floral · 🍳 Gastronomia', 'Comunidade — voto', 'planejado'),
('2026-05-15', 'WhatsApp', 'Mensagem', 'Bastidor humano: foto da equipe Elarah preparando o ateliê', 'Quem cuida da magia. 🤍', 'Comunidade — bastidor humano', 'planejado'),
('2026-05-18', 'WhatsApp', 'Enquete', 'Enquete: "O que você faz pra desacelerar?"', 'Opções: respirar · andar · cozinhar · criar com as mãos · só silêncio', 'Comunidade — interação leve', 'planejado'),
('2026-05-20', 'WhatsApp', 'Mensagem', 'Frase do dia: "Offline is a feeling"', 'Offline is a feeling. 🤍', 'Comunidade — frase', 'planejado'),
('2026-05-22', 'WhatsApp', 'Mensagem', 'Spoiler de experiência em breve', '🤍 Spoiler: a próxima experiência DDN é... [emoji enigmático]\n\nAdivinha?', 'Comunidade — FOMO', 'planejado'),
('2026-05-26', 'WhatsApp', 'Enquete', 'Enquete: "Qual seu plano pro Dia dos Namorados?"', 'Opções: 🍷 jantar · 🎨 experiência criativa · 🌿 viagem · ainda não sei', 'Comunidade — voto', 'planejado'),
('2026-05-28', 'WhatsApp', 'Mensagem', 'Mensagem emocional fim de mês', 'Maio foi gostoso de viver junto. Obrigada por estar aqui. 🤍', 'Comunidade — conexão', 'planejado'),
('2026-05-30', 'WhatsApp', 'Mensagem', 'Pertencimento: foto da comunidade vivendo experiências', 'Vocês. 🤍', 'Comunidade — pertencimento', 'planejado');


-- =============================================================
-- Sanity check
-- -------------------------------------------------------------
-- select data, canal, ideia from public.content_calendar
-- where data >= '2026-05-01' and data <= '2026-05-31'
-- order by data, canal;
-- =============================================================
