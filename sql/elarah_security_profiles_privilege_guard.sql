-- =========================================================
-- ELARAH — SEGURANÇA: trava de escalonamento de privilégio
--
-- PROBLEMA (CRÍTICO): a policy "profiles_update_own" permite
-- que qualquer usuário logado dê UPDATE na própria linha da
-- tabela public.profiles. No Postgres, RLS NÃO restringe
-- QUAIS colunas podem ser alteradas — só QUAIS linhas. Ou
-- seja: com a chave pública (anon/publishable), que está no
-- frontend, qualquer conta registrada podia rodar no console
-- do navegador:
--
--     await supabaseClient
--       .from('profiles')
--       .update({ role: 'admin' })
--       .eq('id', <o proprio id>)
--
-- e virar admin. Como TODO o controle de acesso do sistema
-- depende de is_admin() (que lê profiles.role), isso dava
-- controle total: ler/editar todos os bookings, financeiro,
-- dados de clientes e fornecedores, cupons, etc.
-- O mesmo valia para partner_status = 'approved' (auto-virar
-- parceiro aprovado sem passar pela curadoria).
--
-- CORREÇÃO: um trigger BEFORE UPDATE que, para quem NÃO é
-- admin, ignora qualquer tentativa de mudar `role` ou de se
-- auto-aprovar em `partner_status`. Continua permitindo que o
-- usuário edite os dados dele (nome, telefone, cidade, etc.)
-- e que se candidate a parceiro (partner_status = 'pending').
-- Admins seguem podendo alterar tudo (inclusive promover).
--
-- Rode UMA vez no SQL Editor do Supabase. Idempotente.
-- =========================================================

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin pode tudo (promover/aprovar/rejeitar).
  if public.is_admin() then
    return new;
  end if;

  -- Não-admin: `role` fica congelado no valor antigo.
  -- Qualquer tentativa de escalonar é silenciosamente revertida.
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;

  -- Não-admin: pode se CANDIDATAR (none -> pending), mas nunca
  -- se auto-aprovar/rejeitar. Aprovação só via painel admin.
  if new.partner_status is distinct from old.partner_status then
    if new.partner_status = 'pending' and old.partner_status in ('none', 'rejected') then
      -- candidatura legítima: permite
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

-- =========================================================
-- VERIFICAÇÃO (opcional): confirme que admins continuam admin
-- e que ninguém virou admin sem você saber.
-- =========================================================
--   select email, role, partner_status
--     from public.profiles
--    where role = 'admin'
--       or partner_status = 'approved'
--    order by role desc, email;
--
-- Se aparecer alguma conta admin que NÃO deveria ser, rebaixe:
--   update public.profiles set role = 'user'
--    where email = 'conta_suspeita@exemplo.com';
