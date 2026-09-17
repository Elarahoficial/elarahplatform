-- =============================================================
-- ELARAH — ACESSO POR ABA PRA EQUIPE
-- -------------------------------------------------------------
-- Problema: profiles.role só tinha dois valores, 'user' e 'admin'.
-- Quem virava admin via TUDO — contabilidade, compras, analytics,
-- base de usuárias. Não dava pra contratar alguém pro comercial sem
-- entregar o caixa junto.
--
-- Solução: a coluna public.profiles.admin_panels (text[]) diz QUAIS
-- abas do painel a pessoa vê.
--     admin_panels IS NULL  → acesso total (você, dona da casa)
--     admin_panels = '{…}'  → só as abas listadas aparecem no menu
--
-- Rode este arquivo UMA vez no SQL Editor do Supabase. É idempotente:
-- rodar de novo não estraga nada.
--
-- ORDEM DAS COISAS:
--   1. Rode a PARTE 1 (coluna + travas). Pode rodar já.
--   2. Crie as duas contas no Supabase → Authentication → Users →
--      "Add user" (email + senha + marcar "Auto Confirm User").
--   3. Rode a PARTE 2 pra ligar cada conta ao seu conjunto de abas.
--   4. Confira com a PARTE 3.
--
-- ATENÇÃO, e isto importa: isto organiza o PAINEL, não é um cofre.
-- No banco as duas continuam com role='admin', então as policies de
-- RLS seguem liberando os dados pra elas — quem souber mexer no
-- console do navegador alcança o que o menu escondeu. Serve pra cada
-- uma trabalhar na área dela sem se perder (e sem esbarrar no caixa
-- sem querer), não pra guardar segredo de quem quer burlar.
-- =============================================================


-- =============================================================
-- PARTE 1 — COLUNA E TRAVAS
-- =============================================================

alter table public.profiles
  add column if not exists admin_panels text[];

comment on column public.profiles.admin_panels is
  'Abas do painel admin que esta conta enxerga. NULL = acesso total. '
  'Array = só essas abas (chaves = data-panel do menu em admin.html). '
  'Só tem efeito quando role = ''admin''.';


-- Quem tem acesso TOTAL: role admin E sem escopo de abas.
-- É esta função que separa a dona (pode promover, pode mexer no acesso
-- das outras) da equipe (trabalha nas abas dela e ponto).
create or replace function public.is_full_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role = 'admin'
       and admin_panels is null
  );
$$;


-- Trava de escalonamento, atualizada.
-- Substitui a versão do elarah_security_profiles_privilege_guard.sql
-- (aquele arquivo continua valendo como explicação do problema).
--
-- Muda duas coisas:
--   a) admin_panels entra na lista de colunas congeladas — senão a
--      comercial abria o console e se dava contabilidade sozinha.
--   b) agora só quem tem acesso TOTAL passa livre. Antes bastava
--      role='admin', o que na prática deixaria a equipe se promover.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sem usuária logada = está rodando pelo SQL Editor / service_role
  -- (você, aqui, agora). Passa livre; é o único jeito de promover a
  -- primeira admin e de rodar a PARTE 2 logo abaixo.
  -- (Sem esta linha, o próprio elarah_promote_admin.sql não funciona:
  -- auth.uid() é NULL no SQL Editor, o trigger não reconhecia a dona e
  -- revertia o UPDATE em silêncio.)
  if auth.uid() is null then
    return new;
  end if;

  -- Acesso total: pode tudo (promover, aprovar, limitar aba).
  if public.is_full_admin() then
    return new;
  end if;

  -- Daqui pra baixo: ou é cliente comum, ou é equipe com escopo.
  -- Nos dois casos, `role` e `admin_panels` ficam congelados.
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;

  if new.admin_panels is distinct from old.admin_panels then
    new.admin_panels := old.admin_panels;
  end if;

  -- Pode se CANDIDATAR a parceira (none -> pending), nunca se aprovar.
  if new.partner_status is distinct from old.partner_status then
    if new.partner_status = 'pending' and old.partner_status in ('none', 'rejected') then
      null;
    else
      new.partner_status := old.partner_status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged on public.profiles;
create trigger trg_protect_profile_privileged
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();


-- =============================================================
-- PARTE 2 — LIGAR AS DUAS CONTAS
-- -------------------------------------------------------------
-- Antes de rodar: crie as contas em Authentication → Users → Add user,
-- com "Auto Confirm User" marcado. Se o email abaixo não existir, o
-- bloco avisa (não quebra nada).
--
-- Trocar os emails aqui é seguro: é a única coisa que precisa bater
-- com o que você cadastrou lá.
-- =============================================================

do $$
declare
  -- ===== TROQUE AQUI SE USAR OUTROS EMAILS =====
  email_eventos   text := 'eventos@elarah.com.br';
  email_comercial text := 'comercial@elarah.com.br';

  -- Perfil 1 — Orçamentos & Eventos.
  -- Espelha a tabela + Visão geral e Interesses (nenhuma das duas
  -- mostra dinheiro; Interesses é lead na mão pra vender).
  paineis_eventos text[] := array[
    'overview',           -- Visão geral
    'insights',           -- O que fazer hoje
    'feedbacks',
    'eventos',
    'eventos-privados',
    'experiences',        -- Experiências
    'byelarah',           -- By Elarah
    'cotacao',            -- Cotação
    'locais',             -- Locais p/ eventos
    'partners',           -- Parceiros
    'prospects',          -- Prospecção
    'interesses'
  ];

  -- Perfil 2 — Comercial.
  paineis_comercial text[] := array[
    'overview',
    'insights',
    'feedbacks',
    'experiences',
    'byelarah',
    'partners',
    'prospects',
    'interesses'
  ];

  achou int;
begin
  -- --- Perfil 1 ---
  update public.profiles
     set role = 'admin',
         admin_panels = paineis_eventos
   where lower(email) = lower(email_eventos);
  get diagnostics achou = row_count;
  if achou = 0 then
    raise notice 'NÃO ACHEI a conta % — crie em Authentication → Users → Add user e rode a PARTE 2 de novo.', email_eventos;
  else
    raise notice 'OK: % agora vê % abas (Orçamentos & Eventos).', email_eventos, array_length(paineis_eventos, 1);
  end if;

  -- --- Perfil 2 ---
  update public.profiles
     set role = 'admin',
         admin_panels = paineis_comercial
   where lower(email) = lower(email_comercial);
  get diagnostics achou = row_count;
  if achou = 0 then
    raise notice 'NÃO ACHEI a conta % — crie em Authentication → Users → Add user e rode a PARTE 2 de novo.', email_comercial;
  else
    raise notice 'OK: % agora vê % abas (Comercial).', email_comercial, array_length(paineis_comercial, 1);
  end if;
end $$;


-- Conta criada pelo painel do Supabase às vezes não ganha linha em
-- public.profiles na hora (o trigger handle_new_user roda no signup
-- pela aplicação). Este bloco cria a linha que estiver faltando, pra
-- qualquer conta do auth. Rodar de novo não duplica nada.
insert into public.profiles (id, email, nome, telefone, cidade, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'nome', ''),
  coalesce(u.raw_user_meta_data->>'telefone', ''),
  coalesce(u.raw_user_meta_data->>'cidade', ''),
  'user'
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null;
-- Se este insert criou a linha das meninas agora, rode o bloco DO $$
-- acima mais uma vez: aí ele encontra os emails.


-- =============================================================
-- PARTE 3 — CONFERIR
-- =============================================================

-- Quem tem acesso ao painel e até onde vai:
select
  email,
  nome,
  role,
  case
    when role <> 'admin'        then 'sem acesso ao painel'
    when admin_panels is null   then 'ACESSO TOTAL'
    else array_length(admin_panels, 1)::text || ' abas'
  end                                as acesso,
  admin_panels
from public.profiles
where role = 'admin'
order by (admin_panels is null) desc, email;


-- =============================================================
-- RECEITAS DO DIA A DIA
-- -------------------------------------------------------------
-- Tudo isto também dá pra fazer clicando, no painel:
-- aba Usuários → botão "Editar acesso" na linha da pessoa.
-- =============================================================

-- Tirar o acesso de alguém (ela vira cliente comum de novo):
--   update public.profiles
--      set role = 'user', admin_panels = null
--    where lower(email) = lower('fulana@elarah.com.br');
--
-- CUIDADO: admin_panels = null com role = 'admin' é ACESSO TOTAL.
-- Pra tirar acesso, mude o role junto, como no exemplo acima.

-- Dar uma aba a mais pra quem já tem escopo (ex.: Compras):
--   update public.profiles
--      set admin_panels = array_append(admin_panels, 'purchases')
--    where lower(email) = lower('eventos@elarah.com.br')
--      and not admin_panels @> array['purchases'];

-- Tirar uma aba:
--   update public.profiles
--      set admin_panels = array_remove(admin_panels, 'purchases')
--    where lower(email) = lower('eventos@elarah.com.br');

-- Chaves das abas (o nome que aparece no menu está ao lado):
--   overview             Visão geral          insights      O que fazer hoje
--   feedbacks            Feedbacks            purchases     Compras
--   eventos              Eventos              eventos-privados  Eventos privados
--   giftcards            Gift Cards           coupons       Cupons
--   experiences          Experiências         byelarah      By Elarah
--   cotacao              Cotação              locais        Locais p/ eventos
--   partners             Parceiros            users         Usuários
--   interesses           Interesses           prospects     Prospecção
--   b2b-prospects        Prospecção B2B       captacao      Captação
--   contabilidade        Contabilidade        analytics     Analytics
--   broadcast            Novidades            calendario-editorial  Cronograma
