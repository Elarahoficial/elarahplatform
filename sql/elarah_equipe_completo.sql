-- =============================================================
-- ELARAH — EQUIPE & ACESSOS (arquivo único)
-- Rode DEPOIS de sql/elarah_mental_health.sql.
-- Copie o arquivo INTEIRO (Ctrl+A no botão "Raw" do GitHub) e cole
-- no SQL Editor do Supabase. Pode rodar quantas vezes quiser.
-- Junta: coluna admin_panels + trava + login só da Mental Health.
-- =============================================================

-- 1) Coluna que diz o que cada pessoa vê (NULL = acesso total)
alter table public.profiles add column if not exists admin_panels text[];

-- 2) Quem tem acesso total (a dona)
create or replace function public.is_full_admin()
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'admin' and admin_panels is null);
$fn$;

-- 3) Trava: ninguém se dá acesso sozinho
create or replace function public.protect_profile_privileged_columns()
returns trigger language plpgsql security definer set search_path = public
as $fn$
begin
  if auth.uid() is null then return new; end if;        -- SQL Editor / servidor
  if public.is_full_admin() then return new; end if;     -- a dona pode tudo
  if new.role is distinct from old.role then new.role := old.role; end if;
  if new.admin_panels is distinct from old.admin_panels then new.admin_panels := old.admin_panels; end if;
  if new.partner_status is distinct from old.partner_status then
    if not (new.partner_status = 'pending' and old.partner_status in ('none', 'rejected')) then
      new.partner_status := old.partner_status;
    end if;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_protect_profile_privileged on public.profiles;
create trigger trg_protect_profile_privileged
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- 4) Quem é da equipe da Mental Health
create or replace function public.is_mh_team()
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (select 1 from public.profiles
                  where id = auth.uid()
                    and ((role = 'admin' and admin_panels is null)
                         or admin_panels @> array['mental-health']));
$fn$;
grant execute on function public.is_mh_team() to authenticated;

-- 5) Libera SÓ as tabelas da Mental Health pra equipe MH
do $blk$
declare t text;
begin
  foreach t in array array['mh_eventos','mh_acompanhamento','mh_cronogramas','mh_leads',
                           'b2b_prospects','b2b_prospect_interactions'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'Pulei % (tabela não existe — rode sql/elarah_mental_health.sql antes).', t;
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', t || '_mh_team', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_mh_team()) with check (public.is_mh_team())', t || '_mh_team', t);
  end loop;
end
$blk$;

-- 6) Campo de consentimento do formulário do site (se faltava)
alter table if exists public.mh_leads add column if not exists consentimento boolean;

-- 7) Conferir: quem tem acesso a quê
select email, nome, role,
  case
    when role = 'admin' and admin_panels is null then 'ACESSO TOTAL'
    when role = 'admin' then 'Equipe Elarah'
    when admin_panels @> array['mental-health'] then 'SÓ Mental Health'
    else 'sem acesso'
  end as acesso,
  admin_panels
from public.profiles
where role = 'admin' or admin_panels is not null
order by acesso, email;
