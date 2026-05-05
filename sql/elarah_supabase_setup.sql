-- =========================================================
-- ELARAH PLATFORM — Supabase setup
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- É idempotente: pode rodar de novo sem quebrar.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  nome            text,
  telefone        text,
  cidade          text,
  role            text not null default 'user' check (role in ('user','admin')),
  partner_status  text not null default 'none' check (partner_status in ('none','pending','approved','rejected')),
  partner_data    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- EXPERIENCES ----------
create table if not exists public.experiences (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text not null,
  data        text,
  duracao     text,
  bairro      text,
  endereco    text,
  inclui      text,
  preco       text,
  cor         text default '#f6d5a8,#f0a05e',
  imagem      text,
  descricao   text,
  horario     text,
  horarios    text[] not null default '{}',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_experiences_updated_at on public.experiences;
create trigger trg_experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

-- ---------- Mantém experiences.horario em sincronia com horarios[0] ----------
create or replace function public.sync_experience_horario()
returns trigger
language plpgsql
as $$
begin
  if new.horarios is not null and array_length(new.horarios, 1) >= 1 then
    new.horario := new.horarios[1];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_experiences_sync_horario on public.experiences;
create trigger trg_experiences_sync_horario
  before insert or update on public.experiences
  for each row execute function public.sync_experience_horario();

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, telefone, cidade)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'telefone', ''),
    coalesce(new.raw_user_meta_data->>'cidade', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper is_admin() ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- RLS ----------
alter table public.profiles     enable row level security;
alter table public.experiences  enable row level security;

-- profiles policies
drop policy if exists "profiles_select_own"   on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_admin_select"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- experiences policies
drop policy if exists "experiences_public_read"   on public.experiences;
drop policy if exists "experiences_admin_insert"  on public.experiences;
drop policy if exists "experiences_admin_update"  on public.experiences;
drop policy if exists "experiences_admin_delete"  on public.experiences;

create policy "experiences_public_read"
  on public.experiences for select
  to anon, authenticated
  using (true);

create policy "experiences_admin_insert"
  on public.experiences for insert
  to authenticated
  with check (public.is_admin());

create policy "experiences_admin_update"
  on public.experiences for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "experiences_admin_delete"
  on public.experiences for delete
  to authenticated
  using (public.is_admin());

-- =========================================================
-- PROMOVER A CONTA ADMIN
-- Depois que o e-mail contato.elarah@gmail.com fizer signup
-- pelo site, rode uma vez:
--
--   update public.profiles
--      set role = 'admin'
--    where email = 'contato.elarah@gmail.com';
-- =========================================================

-- =========================================================
-- SEED EXPERIENCES (idempotente)
-- =========================================================
insert into public.experiences (id, nome, categoria, data, duracao, bairro, endereco, inclui, preco, cor, imagem, descricao, horario, horarios) values
  ('00000000-0000-0000-0000-000000000001', 'Vela (Cerveja & Caipirinha)', 'Vela', '12/04', '1h30', 'Brooklin', 'Rua Nova York, 345 – São Paulo', 'Coffee break + petisco + cerveja', 'R$180', '#f6e6a8,#e0c05e', 'assets/experiences/vela-cerveja.jpg', '', '10h30 – 12h00', ARRAY['10h30 – 12h00']::text[]),
  ('00000000-0000-0000-0000-000000000002', 'Pintura em Cerâmica', 'Pintura', '12/04', '3h', 'Pinheiros', 'Rua Capote Valente, 697 – São Paulo', 'Materiais inclusos', 'R$360', '#f9d1d1,#e07a7a', 'assets/experiences/pintura-ceramica.jpg', '', '15h00 – 18h00', ARRAY['15h00 – 18h00']::text[]),
  ('00000000-0000-0000-0000-000000000003', 'Aula de Tufting (Seg)', 'Tufting', 'Semanal', '2h', 'Itaim', 'Av. Brigadeiro Faria Lima, 1572 - São Paulo', 'Experiência completa', 'R$162', '#c5d4e7,#6991b3', 'assets/experiences/tufting.jpg', '', '19h00 – 21h00', ARRAY['19h00 – 21h00']::text[]),
  ('00000000-0000-0000-0000-000000000004', 'Aula de Tufting (Seg)', 'Tufting', 'Semanal', '3h', 'Itaim', 'Av. Brigadeiro Faria Lima, 1572 - São Paulo', 'Experiência completa', 'R$243', '#c5d4e7,#6991b3', 'assets/tufting1.jpg', '', '09h00 – 12h00', ARRAY['09h00 – 12h00']::text[]),
  ('00000000-0000-0000-0000-000000000005', 'Aula de Tufting (Ter/Qui/Sex)', 'Tufting', 'Semanal', '2h', 'Itaim', 'Av. Brigadeiro Faria Lima, 1572 - São Paulo', 'Experiência completa', 'R$162', '#c5d4e7,#6991b3', 'assets/tufting2.jpg', '', '17h15 – 19h15', ARRAY['17h15 – 19h15']::text[]),
  ('00000000-0000-0000-0000-000000000006', 'Aula de Tufting (Ter/Qui/Sex)', 'Tufting', 'Semanal', '2h', 'Itaim', 'Av. Brigadeiro Faria Lima, 1572 - São Paulo', 'Experiência completa', 'R$162', '#c5d4e7,#6991b3', 'assets/tufting3.jpg', '', '19h30 – 21h30', ARRAY['19h30 – 21h30']::text[]),
  ('00000000-0000-0000-0000-000000000007', 'Aula de Tufting (Ter/Qui/Sex)', 'Tufting', 'Semanal', '3h', 'Itaim', 'Av. Brigadeiro Faria Lima, 1572 - São Paulo', 'Experiência completa', 'R$243', '#c5d4e7,#6991b3', 'assets/tufting4.jpg', '', '09h00 – 12h00', ARRAY['09h00 – 12h00']::text[]),
  ('00000000-0000-0000-0000-000000000008', 'Aula de Tufting (Ter/Qui/Sex)', 'Tufting', 'Semanal', '3h', 'Itaim', 'Av. Brigadeiro Faria Lima, 1572 - São Paulo', 'Experiência completa', 'R$243', '#c5d4e7,#6991b3', 'assets/tufting5.jpg', '', '14h00 – 17h00', ARRAY['14h00 – 17h00']::text[]),
  ('00000000-0000-0000-0000-000000000009', 'Oficina de Bolsa de Crochê', 'Macramê', '25/04', '3h30', 'Brooklin', 'Rua Nova York, 345', 'Todo material incluso', 'R$144', '#f6d5a8,#f0a05e', 'assets/croche.jpg', 'Aprenda a criar sua própria bolsa de crochê do zero em uma experiência prática, criativa e super relaxante!

Nesta aula, você vai descobrir os fundamentos do crochê, desde os pontos básicos até a construção completa da peça, com acompanhamento passo a passo, mesmo que nunca tenha feito nada antes. Ao longo do workshop, você escolhe cores, aprende técnicas de acabamento e vê sua bolsa ganhar forma nas suas mãos.

Mais do que uma aula, é um momento para desacelerar, se desconectar do digital e criar algo único, feito por você.

Você sai com:
– Sua própria bolsa de crochê (em produção ou finalizada)
– Conhecimento para continuar criando depois
– Um momento leve, criativo e diferente do óbvio

Perfeito para quem quer aprender algo novo, explorar a criatividade ou simplesmente viver uma experiência offline de verdade.', '10h30 - 14h00', ARRAY['10h30 - 14h00']::text[]),
  ('00000000-0000-0000-0000-000000000010', 'Cerâmica em Torno', 'Cerâmica', '15/04', '1h30', 'Pinheiros', 'Rua Capote Valente, 697', 'Todo material incluso', 'R$248', '#f6d5a8,#f0a05e', 'assets/torno.jpg', 'Descubra a sensação única de criar com as próprias mãos no seu primeiro contato com o torno de cerâmica!

Nesta experiência, você vai aprender os fundamentos do torno: desde a centralização da argila até a modelagem das primeiras peças, com orientação passo a passo, mesmo sem nenhuma experiência prévia. É aquele momento em que tudo desacelera e você entra no ritmo do giro, da matéria e da criação.

Aqui, o processo é tão especial quanto o resultado: sentir a argila tomando forma entre as mãos, testar, errar, tentar de novo… e se surpreender com o que é capaz de criar.

Você vai:
– Aprender a usar o torno desde o zero
– Criar suas primeiras peças em cerâmica
– Entender o básico de modelagem e acabamento

Uma experiência perfeita para sair do automático, se desconectar do barulho lá fora e viver algo completamente novo: com as mãos na argila e a mente leve.', '19h30 - 21h00', ARRAY['19h30 - 21h00']::text[]),
  ('00000000-0000-0000-0000-000000000011', 'Cerâmica em Torno', 'Cerâmica', '18/04', '1h30', 'Pinheiros', 'Rua Capote Valente, 697', 'Todo material incluso', 'R$248', '#f6d5a8,#f0a05e', 'assets/torno2.jpg', 'Descubra a sensação única de criar com as próprias mãos no seu primeiro contato com o torno de cerâmica!

Nesta experiência, você vai aprender os fundamentos do torno: desde a centralização da argila até a modelagem das primeiras peças, com orientação passo a passo, mesmo sem nenhuma experiência prévia. É aquele momento em que tudo desacelera e você entra no ritmo do giro, da matéria e da criação.

Aqui, o processo é tão especial quanto o resultado: sentir a argila tomando forma entre as mãos, testar, errar, tentar de novo… e se surpreender com o que é capaz de criar.

Você vai:
– Aprender a usar o torno desde o zero
– Criar suas primeiras peças em cerâmica
– Entender o básico de modelagem e acabamento

Uma experiência perfeita para sair do automático, se desconectar do barulho lá fora e viver algo completamente novo: com as mãos na argila e a mente leve.', '10h00 - 11h30', ARRAY['10h00 - 11h30']::text[]),
  ('00000000-0000-0000-0000-000000000012', 'Risotos da Terra', 'Gastronomia', '22/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/risoto.jpg', 'O curso de risoto da terra é indicado para pessoas com qualquer nível de conhecimento. São preparos fáceis e deliciosos que você vai poder reproduzir muitas vezes em sua casa!

Turmas reduzidas então garanta sua vaga! 

Conteúdo Programático
- Risoto Milanês
- Risoto Funghi
- Risoto Toscana ao Tinto (Vegetarianos podem solicitar linguiça vegetariana. Gentileza solicitar ao receber e-mail de confirmação da compra)
- Risoto de Pera com Gorgonzola

O risoto perfeito é aquele cremoso, com o grão firme e com sabores e aromas naturais. Nesta aula você vai aprender como deixá-lo assim... irresistível!

Muitas dicas, ingredientes de excelente qualidade, ótimas receitas e ambiente descontraído fazem parte de todos os cursos da Receitaria!', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000013', 'Pão de Mel Artesanal', 'Gastronomia', '27/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/paomel.jpg', 'Uma experiência para colocar a mão na massa e sair com cheirinho de casa feliz.

Nesta aula, você aprende a fazer pão de mel do zero: da massa fofinha ao recheio cremoso e a cobertura perfeita de chocolate. Tudo com passo a passo guiado, dicas práticas e aquele toque especial que transforma uma receita simples em algo memorável.

Ao longo do workshop, você vai montar suas próprias unidades, testar combinações de recheios e entender os segredos do ponto ideal, daqueles que fazem diferença de verdade.

Conteúdo Programático:
– Pão de mel tradicional
– Massa de pão de mel vegana
– Recheios variados
– Cobertura de chocolate e finalização
– Embalagens (como apresentar e valorizar o produto)

Você vai:
– Preparar a massa do pão de mel desde o início
– Aprender recheios e técnicas de montagem
– Finalizar com cobertura de chocolate e acabamento

E claro, levar suas criações (ou pelo menos parte delas) pra casa.

Perfeito para quem ama doce, quer aprender algo novo ou simplesmente viver um momento leve, criativo e delicioso: longe do celular e perto do que importa.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000014', 'Nhoques Artesanais', 'Gastronomia', '14/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/nhoque.jpg', 'Nhoque Perfeito: do Zero ao Prato!

Uma experiência para quem ama cozinhar (ou quer começar) e quer aprender de verdade com técnica, prática e muito sabor.

Neste workshop, você mergulha na arte dos nhoques artesanais e aprende, com chefs, as técnicas tradicionais para chegar na textura perfeita: leve, macia e no ponto certo. Ao longo da aula, você prepara três tipos de massa e descobre como combiná-las com molhos irresistíveis que elevam qualquer prato.

Mais do que seguir receita, aqui você entende o porquê de cada etapa e sai com segurança para reproduzir em casa.

Conteúdo da experiência:
Massa de batata tradicional firme para rechear: preparo de nhoques clássicos, leves e estruturados, recheados com muçarela, envolvidos em molho branco e finalizados gratinados
Nhoques de abóbora: versão aromática e levemente adocicada, combinada com molho de gorgonzola que realça o sabor
Nhoques de mandioquinha: massa intensa e delicada, acompanhada de molho de manteiga e ervas, simples e sofisticado ao mesmo tempo

Você vai aprender:
Técnicas essenciais de preparo de massas artesanais
Como chegar no ponto ideal de cada tipo de nhoque
Como combinar sabores e montar pratos completos

Perfeito para quem quer sair do básico, se surpreender na cozinha e viver uma experiência gastronômica criativa, prática e muito gostosa.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000015', 'Lasanha Artesanal', 'Gastronomia', '16/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/lasanha.jpg', 'Uma experiência pensada para quem quer ir além do básico e transformar o preparo da lasanha em algo realmente especial.

Neste curso, você aprende com chefs experientes a preparar massas artesanais do zero e a combinar ingredientes de forma criativa, entendendo técnicas que fazem toda a diferença no resultado final. Ao longo da aula, você desenvolve três versões diferentes, explorando sabores clássicos e releituras surpreendentes.

Mais do que seguir receitas, aqui você aprende os fundamentos para criar lasanhas com textura, equilíbrio e sabor marcante.

Conteúdo da experiência:
Lasanha tradicional à bolonhesa: preparo da clássica lasanha com massa caseira, camadas de molho à bolonhesa, queijo e bechamel, resultando em um prato rico e reconfortante
Lasanha vegetariana de abobrinha: versão leve e cheia de sabor, com camadas de abobrinha, queijo e molho branco com espinafre
Lasanha de carne seca: combinação intensa com um toque nordestino, trazendo personalidade e profundidade ao prato

Você vai aprender:
Como preparar massa artesanal para lasanha
Técnicas de montagem e equilíbrio de camadas
Combinações de ingredientes para diferentes perfis de sabor

Perfeito para quem quer evoluir na cozinha, impressionar em um almoço ou jantar e dominar uma das receitas mais amadas de forma criativa e bem executada.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000016', 'Massa Artesanal sem Glúten', 'Gastronomia', '28/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/massasemgluten.jpg', 'Massas sem Glúten: técnica, sabor e liberdade na cozinha

Uma experiência para quem quer explorar novas formas de cozinhar sem abrir mão de textura, sabor e qualidade.

Neste curso, você aprende com chefs como preparar massas artesanais sem glúten, entendendo na prática como substituir ingredientes tradicionais e ainda assim alcançar resultados surpreendentes. Ao longo da aula, você desenvolve diferentes tipos de massas e descobre os segredos por trás de uma boa estrutura, mesmo sem o uso de farinha de trigo.

Mais do que adaptar receitas, aqui você aprende a construir uma base sólida para criar pratos inclusivos e cheios de sabor.

Conteúdo da experiência:
Nhoque sem glúten: preparo de uma versão macia e equilibrada, com técnicas para atingir a textura ideal utilizando ingredientes alternativos
Fettuccine sem glúten: desenvolvimento de uma massa fresca com excelente estrutura e sabor, mesmo sem o glúten
Ravióli livre de glúten: criação de massas recheadas com combinações criativas e técnicas para montagem e fechamento perfeitos
Técnicas de substituição de ingredientes: compreensão dos principais ingredientes alternativos e como utilizá-los para manter qualidade e autenticidade

Você vai aprender:
Como estruturar massas sem glúten com boa textura
Quais ingredientes utilizar e como combiná-los
Técnicas para preparar diferentes formatos de massas

Perfeito para quem busca uma alimentação sem glúten, quer ampliar repertório na cozinha ou simplesmente aprender algo novo de forma prática e criativa.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000017', 'Oficina de Croissant', 'Gastronomia', '30/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/croissant.jpg', 'Croissant Perfeito: a arte da massa folhada

Uma experiência para quem quer se aventurar na confeitaria e aprender, na prática, uma das técnicas mais desejadas da cozinha.

Nesta aula, o chef premiado Edgar Rodrigues compartilha todos os segredos para preparar uma massa folhada perfeita e transformar esse processo em croissants leves, aerados e cheios de sabor. Ao longo do workshop, cada participante coloca a mão na massa e desenvolve suas próprias produções do início ao fim.

Além do clássico croissant, você também explora outras variações irresistíveis, aprendendo técnicas que podem ser replicadas em diferentes preparos.

Conteúdo da experiência:
Massa folhada: fundamentos e técnica para criar camadas leves e bem estruturadas
Croissant: preparo completo, do início à finalização
Pain au chocolat: versão recheada com chocolate, clássica e deliciosa
Danish: massa folhada com diferentes combinações e recheios
Creme patissiere: base essencial da confeitaria para recheios
Outros preparos folhados: variações e possibilidades a partir da mesma técnica

Você vai aprender:
Técnicas de preparo e manuseio da massa folhada
Como atingir textura, leveza e camadas perfeitas
Dicas práticas de um chef experiente para melhorar seus resultados

Uma aula completa, com ingredientes de excelente qualidade, receitas bem estruturadas e um ambiente leve e descontraído, perfeita para quem quer aprender, se desafiar e sair com criações feitas por você.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000018', 'Bem Casado & Bem Nascido', 'Gastronomia', '24/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/bemcasado.jpg', 'Bem-casados e Bem-nascidos: do preparo à apresentação

Uma experiência deliciosa para quem quer aprender a fazer doces clássicos com acabamento profissional e sabor inesquecível.

Nesta aula, você vai preparar bem-casados e bem-nascidos do zero, aprendendo duas técnicas de massa e todos os detalhes que fazem diferença no resultado final. Do ponto da massa à montagem e finalização, cada etapa é explicada de forma prática para que você consiga reproduzir depois com segurança.

Além do preparo, você também descobre como apresentar e embalar seus doces de forma encantadora, seja para vender, presentear ou surpreender em casa.

Conteúdo da experiência:
Massa pingada: técnica para criar unidades leves e delicadas
Massa cortada: preparo estruturado para formatos mais uniformes
Recheios: combinações clássicas e saborosas
Calda: finalização que garante textura e sabor característicos
Embalagens: formas de apresentação que valorizam o produto

Você vai aprender:
Como acertar o ponto de diferentes massas
Técnicas de montagem e acabamento
Dicas para produzir, apresentar e até comercializar

Perfeito para quem ama confeitaria, quer criar doces especiais ou transformar uma receita clássica em algo ainda mais bonito e profissional.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000019', 'Massas & Molhos - Os Mais Pedidos', 'Gastronomia', '17/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/massamolho.jpg', 'Massas Artesanais: do zero aos clássicos italianos

Uma experiência completa para quem quer aprender a fazer massa fresca de verdade e transformar ingredientes simples em pratos incríveis.

Nesta aula, você prepara sua própria massa artesanal e aprende a modelar diferentes formatos, explorando técnicas que fazem toda a diferença no resultado final. Ao longo do workshop, você também descobre como combinar recheios e molhos clássicos para criar pratos cheios de sabor e personalidade.

Depois dessa experiência, a ideia de comprar massa pronta simplesmente deixa de fazer sentido.

Conteúdo da experiência:
Massa básica artesanal: preparo do zero com técnica e ponto ideal
Modelagem em espaguete, farfalle e ravióli: diferentes formatos e aplicações
Preparo à moda carbonara: técnica para um dos molhos mais clássicos da culinária italiana
Recheio de gema e espinafre: combinação rica e surpreendente para ravióli
Molho rústico de tomate com almôndegas: preparo completo, sabor intenso e caseiro

Você vai aprender:
Como fazer massa fresca com textura e estrutura perfeitas
Técnicas de modelagem para diferentes tipos de massa
Como combinar recheios e molhos de forma equilibrada

Uma aula com muitas dicas práticas, ingredientes de excelente qualidade e um ambiente leve e descontraído, perfeita para quem quer evoluir na cozinha e aproveitar cada etapa do preparo.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000020', 'Brownies & Blondies', 'Gastronomia', '28/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/brownie.jpg', 'Brownies & Blondies: textura perfeita e muito sabor

Uma experiência para quem ama doce e quer aprender de verdade os segredos por trás de brownies intensos e blondies surpreendentes.

Nesta aula, você descobre como alcançar a textura ideal do brownie: úmido por dentro, com casquinha por fora e sabor marcante. Ao longo do workshop, você prepara diferentes versões, explorando combinações criativas que vão muito além do tradicional.

Com técnicas simples e resultados incríveis, é uma aula perfeita tanto para iniciantes quanto para quem já gosta de se aventurar na cozinha.

Conteúdo da experiência:
Blondie de limão com cobertura aveludada: versão leve e cítrica, com equilíbrio perfeito de sabores
Blondie de morango com cobertura de cream cheese: combinação delicada e marcante
Brownie Mississipi: brownie com manteiga de amendoim, calda de chocolate e marshmallows assados
Brownie de chocolate com fudge de castanha: intenso, cremoso e cheio de textura

Você vai aprender:
Técnicas para acertar o ponto perfeito do brownie
Combinações de sabores e recheios
Dicas práticas para reproduzir em casa com facilidade

Perfeito para quem quer criar sobremesas irresistíveis, seja para um café da tarde, um jantar especial ou até para vender.

Turmas reduzidas, ambiente leve e descontraído e ingredientes de excelente qualidade fazem dessa aula uma experiência completa do começo ao fim.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000021', 'Cookies Recheados', 'Gastronomia', '29/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/cookies.jpg', 'Cookies Perfeitos: crocantes por fora, macios por dentro

Uma experiência para quem ama aquele cheirinho de cookie saindo do forno e quer aprender a fazer versões irresistíveis do zero.

Nesta aula, você prepara diferentes tipos de cookies, entendendo as técnicas que garantem a textura perfeita: levemente crocante por fora e macio por dentro. Ao longo do workshop, você explora sabores clássicos e criativos, além de aprender opções que vão desde o consumo em casa até ideias para presentear ou vender.

É aquele tipo de aula que envolve, perfuma o ambiente e termina do melhor jeito possível: provando tudo.

Conteúdo da experiência:
Massa tradicional: base clássica para cookies equilibrados e saborosos
Massa de chocolate triplo chocolate: intensa, rica e cheia de textura
Snickerdoodle cookie: versão aromática com toque de canela e açúcar
Red velvet cookie: combinação marcante com massa macia e sabor único
Cookies in a jar: montagem criativa para presentear ou vender

Você vai aprender:
Técnicas para acertar textura e ponto dos cookies
Combinações de sabores e variações de massa
Dicas práticas para produção em casa ou até para renda extra

Uma aula com muitas dicas, ingredientes de excelente qualidade e um ambiente leve e descontraído, perfeita para quem quer aprender, se divertir e sair com receitas que vão fazer sucesso sempre.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000022', 'Drinks & Petiscos - Gin e Moscow Mule', 'Bartenderia', '24/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/drinks.jpg', 'Happy Hour na Cozinha: drinks e petiscos para surpreender

Uma experiência perfeita para quem quer aprender, se divertir e viver um verdadeiro happy hour colocando a mão na massa.

Nesta aula, você prepara seus próprios drinks e petiscos, aprendendo combinações que funcionam de verdade e técnicas simples que fazem toda a diferença no resultado final. É o tipo de experiência leve, descontraída e ideal para ir com amigos ou conhecer gente nova enquanto cozinha e brinda.

Ao longo do workshop, você explora clássicos da coquetelaria e receitas de petiscos cheios de sabor, criando um menu completo para reproduzir depois em casa.

Conteúdo da experiência:
Dadinhos de tapioca: preparo crocante por fora e macio por dentro
Bolinho de abóbora com camarão ou carne seca: combinação intensa e cheia de sabor
Vinagrete de polvo: leve, fresco e perfeito para acompanhar
Smash de pepino: drink refrescante e equilibrado
Gim tônica de maracujá: cítrico e aromático
Moscow mule: clássico com espuma e sabor marcante

Você vai aprender:
Técnicas básicas de preparo de drinks
Combinações de sabores para petiscos e acompanhamentos
Dicas práticas para montar um happy hour completo em casa

Uma aula com ingredientes de excelente qualidade, muitas dicas e um ambiente descontraído, perfeita para quem quer aprender de forma leve, brindar e aproveitar cada momento.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000023', 'Cozinha Indiana - Comendo com as Mãos', 'Gastronomia', '18/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/indiana.jpg', 'Sabores da Índia: uma viagem pela cozinha indiana

Uma experiência intensa, aromática e cheia de descobertas para quem quer explorar novos sabores e técnicas na cozinha.

Nesta aula, você mergulha na culinária indiana e aprende a preparar receitas tradicionais com combinações marcantes de especiarias, texturas e aromas. Ao longo do workshop, você desenvolve um menu completo, passando por massas, molhos, pratos principais e acompanhamentos, entendendo como cada elemento se conecta no prato.

É uma verdadeira imersão gastronômica que vai muito além da receita, trazendo repertório e novas possibilidades para cozinhar.

Conteúdo da experiência:
Samosa: preparo do clássico salgado indiano, crocante e recheado
Potato stew: ensopado reconfortante e cheio de especiarias
Shrimp balchao: prato intenso e marcante com camarão
Layered paratha: pão em camadas, macio por dentro e levemente crocante por fora
Ginger chutney: molho aromático com toque picante e refrescante
Hung yogurt: base cremosa muito utilizada na culinária indiana
Shrikhand: sobremesa leve e aromática à base de iogurte
Masala chai: bebida quente com especiarias, perfeita para acompanhar

Você vai aprender:
Como utilizar especiarias de forma equilibrada
Técnicas tradicionais da culinária indiana
Combinações de sabores que criam pratos completos

Uma aula com ingredientes de excelente qualidade, muitas dicas práticas e um ambiente leve e descontraído, perfeita para quem quer sair do óbvio e viver uma experiência gastronômica totalmente diferente.', '16h00 - 19h30', ARRAY['16h00 - 19h30']::text[]),
  ('00000000-0000-0000-0000-000000000024', 'Bolos Caseiros', 'Gastronomia', '25/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/bolocaseiro.jpg', 'Bolos Caseiros: receitas que acolhem

Uma experiência para quem ama aquele bolo quentinho, com cheiro de casa e sabor de memória.

Nesta aula, você aprende a preparar bolos clássicos e irresistíveis, daqueles que funcionam tanto para um café da tarde quanto para presentear ou até vender. Com técnicas simples e resultados incríveis, o foco é te dar segurança para reproduzir tudo depois, sem complicação.

Ao longo do workshop, você explora diferentes tipos de massa, combinações e finalizações, entendendo o ponto certo e os detalhes que fazem toda a diferença.

Conteúdo da experiência:
Bolo pudim: combinação surpreendente de duas texturas em uma só receita
Bolo de chocolate branco com frutas vermelhas: equilibrado, delicado e cheio de sabor
Bolo mármore: clássico mesclado, visual bonito e sabor marcante
Bolo invertido de abacaxi: úmido, caramelizado e perfeito para servir

Você vai aprender:
Técnicas básicas para bolos fofinhos e bem estruturados
Combinações de sabores e variações de massa
Dicas práticas para preparar, servir ou até vender

Perfeito para quem quer trazer mais sabor para o dia a dia e viver uma experiência leve, gostosa e cheia de afeto na cozinha.', '16h00 - 19h30', ARRAY['16h00 - 19h30']::text[]),
  ('00000000-0000-0000-0000-000000000025', 'Massas & Molhos - Massas Recheadas', 'Gastronomia', '15/04', '3h30', 'Jardim das Bandeiras', 'Rua Abegoaria, 538', 'Todo material incluso', 'R$383', '#f6d5a8,#f0a05e', 'assets/massarecheada.jpg', 'Massas Artesanais com Semolina: como um chef italiano

Uma experiência para quem quer elevar o nível na cozinha e aprender a fazer massas frescas com técnica, sabor e apresentação impecável.

Nesta aula, você prepara uma massa artesanal com semolina e descobre como transformar ingredientes simples em pratos dignos de um restaurante italiano. Ao longo do workshop, você aprende diferentes modelagens, recheios e molhos, criando combinações sofisticadas e cheias de personalidade.

Mais do que seguir receitas, aqui você entende o processo e ganha confiança para reproduzir em casa com resultado profissional.

Conteúdo da experiência:
Massa básica artesanal: preparo com semolina para textura e estrutura perfeitas
Capelettis di barbabietola con salvia: massa delicada com toque de beterraba e combinação aromática
Cannelloni di prosciutto con spinaci: recheio clássico e equilibrado com presunto e espinafre
Rondelli noce e albicocca: combinação criativa com nozes e damasco
Sauce d’arancia: molho cítrico que traz frescor e leveza
Molho de gorgonzola: intenso e cremoso, perfeito para massas recheadas

Você vai aprender:
Técnicas de preparo de massa fresca com semolina
Modelagem de diferentes formatos de massas
Combinações de recheios e molhos sofisticados

Uma aula com muitas dicas práticas, ingredientes de excelente qualidade e um ambiente leve e descontraído, perfeita para quem quer cozinhar como um chef e se surpreender com o resultado.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000026', 'Modelagem em Cerâmica para 2 Pessoas - Oficina Familiar com Crianças (até 12 anos)', 'Cerâmica', '18/04', '2h00', 'Pinheiros', 'Rua Capote Valente, 697', 'Todo material incluso', 'R$495', '#f6d5a8,#f0a05e', 'assets/ceramicafamiliamenos12.jpg', 'Modelagem em Cerâmica para Família: primeiros momentos com a argila

Uma experiência pensada para famílias que querem viver um momento especial juntas, de forma leve, sensorial e cheia de afeto.

Nesta aula, adultos e crianças exploram a modelagem em cerâmica de maneira livre e guiada, com atividades adaptadas para os pequenos de até 12 anos. É um primeiro contato com a argila que estimula os sentidos, a coordenação e a curiosidade, enquanto cria memórias únicas em família.

Tudo acontece no ritmo de vocês, sem pressão por resultado, valorizando o processo, o toque e a descoberta.

Conteúdo da experiência:
Introdução à argila: contato inicial e exploração sensorial
Modelagem livre: criação de formas simples com apoio do instrutor
Técnicas básicas: apertar, enrolar e moldar de forma intuitiva
Momentos guiados: sugestões de pequenas criações para fazer em família

Você vai aprender:
Como estimular o desenvolvimento sensorial da criança
Formas simples de modelar com segurança
Como transformar o momento em uma experiência leve e divertida

Opções de participação:
Experiência para 2 ou 3 pessoas no total, ideal para um adulto e criança ou pequenos grupos familiares

Perfeito para quem quer desacelerar, se desconectar do digital e viver um momento de conexão real com quem mais importa.', '14h00 - 16h00', ARRAY['14h00 - 16h00']::text[]),
  ('00000000-0000-0000-0000-000000000027', 'Modelagem em Cerâmica para 2 Pessoas - Oficina Familiar com Crianças (a partir de 12 anos)', 'Cerâmica', '15/04', '2h00', 'Pinheiros', 'Rua Capote Valente, 697', 'Todo material incluso', 'R$495', '#f6d5a8,#f0a05e', 'assets/ceramicafamiliamais12.jpg', 'Modelagem em Cerâmica: criatividade a partir dos 12 anos

Uma experiência prática e envolvente para quem quer aprender a criar com as próprias mãos e explorar a cerâmica de forma leve e criativa.

Nesta aula, jovens a partir de 12 anos e adultos aprendem técnicas de modelagem em argila, com orientação passo a passo para desenvolver peças únicas. É um momento de desconexão do digital e conexão com o processo criativo, onde cada participante pode experimentar, testar ideias e ver suas criações ganharem forma.

Não é preciso ter experiência prévia, apenas vontade de criar.

Conteúdo da experiência:
Introdução à argila: primeiros passos e entendimento do material
Técnicas de modelagem: construção manual de peças com diferentes formas
Criação livre: desenvolvimento de peças autorais com apoio do instrutor
Acabamento básico: ajustes finais para preparar as peças

Você vai aprender:
Técnicas iniciais de modelagem em cerâmica
Como transformar ideias em peças reais
Noções básicas de acabamento e estrutura

Opções de participação:
Experiência para 2 ou 3 pessoas no total, ideal para amigos, família ou pequenos grupos

Perfeito para quem quer experimentar algo novo, desenvolver a criatividade e viver um momento diferente, colocando a mão na argila e saindo do óbvio.', '19h00 - 21h00', ARRAY['19h00 - 21h00']::text[]),
  ('00000000-0000-0000-0000-000000000028', 'Modelagem em Cerâmica para 2 Pessoas - Oficina Familiar com Crianças (a partir de 12 anos)', 'Cerâmica', '18/04', '2h00', 'Pinheiros', 'Rua Capote Valente, 697', 'Todo material incluso', 'R$495', '#f6d5a8,#f0a05e', 'assets/ceramicafamiliamais212.jpg', 'Modelagem em Cerâmica: criatividade a partir dos 12 anos

Uma experiência prática e envolvente para quem quer aprender a criar com as próprias mãos e explorar a cerâmica de forma leve e criativa.

Nesta aula, jovens a partir de 12 anos e adultos aprendem técnicas de modelagem em argila, com orientação passo a passo para desenvolver peças únicas. É um momento de desconexão do digital e conexão com o processo criativo, onde cada participante pode experimentar, testar ideias e ver suas criações ganharem forma.

Não é preciso ter experiência prévia, apenas vontade de criar.

Conteúdo da experiência:
Introdução à argila: primeiros passos e entendimento do material
Técnicas de modelagem: construção manual de peças com diferentes formas
Criação livre: desenvolvimento de peças autorais com apoio do instrutor
Acabamento básico: ajustes finais para preparar as peças

Você vai aprender:
Técnicas iniciais de modelagem em cerâmica
Como transformar ideias em peças reais
Noções básicas de acabamento e estrutura

Opções de participação:
Experiência para 2 ou 3 pessoas no total, ideal para amigos, família ou pequenos grupos

Perfeito para quem quer experimentar algo novo, desenvolver a criatividade e viver um momento diferente, colocando a mão na argila e saindo do óbvio.', '10h00 - 12h00', ARRAY['10h00 - 12h00']::text[]),
  ('00000000-0000-0000-0000-000000000029', 'Buquê de Flores', 'Floral', '19/04', '3h00', 'Brooklin', 'Rua Nova York, 345', 'Coffe break, Todo material incluso', 'R$180', '#f6d5a8,#f0a05e', 'assets/buque.jpg', 'Buquê de Flores: do básico ao arranjo perfeito

Uma experiência delicada e criativa para quem quer aprender a montar buquês bonitos, equilibrados e cheios de personalidade.

Nesta aula, você descobre como combinar flores, cores e texturas para criar arranjos harmoniosos, aprendendo técnicas usadas por floristas para dar leveza, movimento e acabamento profissional. Ao longo do workshop, cada participante monta seu próprio buquê, escolhendo elementos e desenvolvendo seu estilo.

É um momento leve, estético e inspirador, perfeito para desacelerar e criar algo lindo com as próprias mãos.

Conteúdo da experiência:
Seleção de flores: tipos, cores e combinações que funcionam
Estrutura do buquê: como montar base, volume e proporção
Técnicas de amarração: acabamento firme e elegante
Composição visual: equilíbrio entre cores, alturas e texturas

Você vai aprender:
Como montar buquês do zero
Técnicas de composição e harmonia visual
Dicas práticas para conservar e valorizar as flores

Perfeito para quem quer aprender algo novo, presentear alguém especial ou simplesmente viver um momento criativo e diferente do óbvio.', '10h30 - 13h30', ARRAY['10h30 - 13h30']::text[]),
  ('00000000-0000-0000-0000-000000000030', 'Mundo do Macramê', 'Macramê', '26/04', '4h00', 'Chácara Santo Antônio', 'divulgado após confirmação de inscrição', 'Todo material incluso', 'R$198', '#f6d5a8,#f0a05e', 'assets/macrameee.jpg', 'Macramê: crie com fios e nós

Uma experiência criativa e relaxante para quem quer aprender a transformar fios em peças decorativas cheias de estilo.

Nesta aula, você descobre as técnicas básicas do macramê e aprende, passo a passo, a construir sua própria peça, mesmo sem nenhuma experiência prévia. Ao longo do workshop, você explora diferentes tipos de nós, entende como criar formas e vê o projeto ganhar vida nas suas mãos.

É aquele momento de desacelerar, focar no processo e sair com algo único, feito por você.

Conteúdo da experiência:
Introdução ao macramê: materiais e primeiros passos
Nós básicos: técnicas fundamentais para construção das peças
Estrutura e composição: como dar forma e equilíbrio ao trabalho
Finalização: acabamento e ajustes para um resultado bonito

Você vai aprender:
Principais nós do macramê
Como criar peças decorativas do zero
Dicas práticas para continuar criando em casa

Perfeito para quem quer explorar a criatividade, aprender algo novo e viver uma experiência manual leve, estética e fora da rotina.', '8h30 - 12h30', ARRAY['8h30 - 12h30']::text[]),
  ('00000000-0000-0000-0000-000000000031', 'Workshop Luz da Colmeia - Velas de Cera de Abelha', 'Vela', '26/04', '2h30', 'Pinheiros', 'Rua Filipe de Alcaçova, 38', 'Coffee break, Todo material incluso', 'R$180', '#f6d5a8,#f0a05e', 'assets/ceradeabelha.jpg', 'Velas Naturais: criação com cera de abelha

Uma experiência sensorial e criativa para quem quer aprender a fazer velas naturais, bonitas e cheias de personalidade.

Nesta aula, você descobre como trabalhar com cera de abelha e transformar o material em velas únicas, explorando aromas, formatos e acabamentos. Com orientação passo a passo, você aprende desde o derretimento correto da cera até a finalização, entendendo cada etapa do processo.

É um momento de desacelerar, se conectar com os sentidos e criar algo que traz aconchego e bem-estar.

Conteúdo da experiência:
Introdução à cera de abelha: características e benefícios
Preparo da cera: técnicas de derretimento e manuseio
Criação das velas: escolha de formatos, pavio e montagem
Aromatização: uso de essências para personalização
Finalização: acabamento e cuidados com as velas

Você vai aprender:
Como produzir velas naturais do zero
Técnicas para um bom resultado de queima e estética
Dicas para personalizar e até presentear ou vender

Perfeito para quem quer viver uma experiência criativa, relaxante e sair com peças feitas por você, prontas para usar ou compartilhar.', '15h00 - 17h30', ARRAY['15h00 - 17h30']::text[]),
  ('00000000-0000-0000-0000-000000000032', 'Vela Aromática', 'Vela', '26/04', '3h00', 'Moema', 'Alameda das Nhambiquaras, 1388', 'Coffee break, Todo material incluso', 'R$261', '#f6d5a8,#f0a05e', 'assets/velaaromatica.jpg', 'Velas Aromáticas: crie seu próprio aroma

Uma experiência sensorial para quem quer transformar cheiros em memórias e criar velas únicas do zero.

Nesta aula, você aprende todo o processo de produção de velas aromáticas, desde a escolha da base até a combinação de fragrâncias. Com orientação passo a passo, você descobre como equilibrar aromas, trabalhar com diferentes essências e criar uma vela bonita, perfumada e com acabamento profissional.

É um momento de desacelerar, explorar os sentidos e sair com algo feito por você, que leva sua identidade em cada detalhe.

Conteúdo da experiência:
Introdução às velas aromáticas: tipos de cera e características
Preparo da base: derretimento e temperatura ideal
Aromatização: combinação de essências e criação de fragrâncias
Montagem: escolha de recipiente, pavio e estrutura
Finalização: acabamento e cura da vela

Você vai aprender:
Como produzir velas aromáticas do zero
Técnicas para fixação e intensidade do aroma
Dicas para personalizar, presentear ou até vender

Perfeito para quem quer viver uma experiência criativa, relaxante e sair com uma vela exclusiva, feita com seu próprio estilo.', '10h00 - 13h00', ARRAY['10h00 - 13h00']::text[]),
  ('00000000-0000-0000-0000-000000000033', 'Cozinha Árabe', 'Gastronomia', '14/04', '3h30', 'Brooklin', 'Rua Nova Orleans, 34', 'Todo material incluso', 'R$261', '#f6d5a8,#f0a05e', 'assets/arabe.jpg', 'Culinária Árabe: sabores, aromas e tradição

Uma experiência para quem quer explorar uma das cozinhas mais ricas e aromáticas do mundo, cheia de história, especiarias e combinações marcantes.

Nesta aula, você aprende a preparar receitas clássicas da culinária árabe, entendendo como equilibrar temperos, texturas e ingredientes para criar pratos autênticos e cheios de sabor. Ao longo do workshop, você desenvolve um menu completo, passando por preparos que vão do simples ao mais elaborado.

Mais do que receitas, é uma imersão cultural que transforma a forma de cozinhar e experimentar novos sabores.

Conteúdo da experiência:
Pratos tradicionais: preparo de receitas clássicas da culinária árabe
Uso de especiarias: combinações e equilíbrio de sabores
Pastas e acompanhamentos: texturas e contrastes no prato
Montagem e apresentação: como servir de forma harmoniosa

Você vai aprender:
Técnicas essenciais da culinária árabe
Como utilizar especiarias de forma equilibrada
Combinações que criam pratos completos e marcantes

Perfeito para quem quer sair do óbvio, expandir repertório na cozinha e viver uma experiência gastronômica rica, envolvente e cheia de sabor.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[]),
  ('00000000-0000-0000-0000-000000000034', 'Princípios da Cozinha - Básico & Bem Feito', 'Gastronomia', '16/04', '3h30', 'Brooklin', 'Rua Nova Orleans, 34', 'Todo material incluso', 'R$261', '#f6d5a8,#f0a05e', 'assets/basicobemfeito.jpg', 'Cozinha Básica: o essencial bem feito

Uma experiência para quem quer aprender a cozinhar de verdade, começando pelo que mais importa: os fundamentos.

Nesta aula, você desenvolve as bases da cozinha com técnica, clareza e prática. Ao invés de receitas soltas, o foco está em entender o porquê de cada etapa, para que você ganhe autonomia e consiga preparar diferentes pratos com segurança e consistência.

É o tipo de conhecimento que muda tudo: quando o básico é bem feito, qualquer receita funciona melhor.

Conteúdo da experiência:
Cortes e preparo de ingredientes: técnicas essenciais e organização
Métodos de cocção: refogar, grelhar, assar e cozinhar corretamente
Temperos e bases: como construir sabor do zero
Molhos básicos: fundamentos que se aplicam a diversas receitas
Ponto e textura: como identificar o momento certo de cada preparo

Você vai aprender:
Como cozinhar com técnica e confiança
Como equilibrar sabores e temperos
Como adaptar receitas e criar a partir do básico

Perfeito para quem quer sair do zero, ganhar independência na cozinha ou organizar melhor o que já sabe, com uma base sólida que serve para tudo.', '19h00 - 22h30', ARRAY['19h00 - 22h30']::text[])
on conflict (id) do nothing;
