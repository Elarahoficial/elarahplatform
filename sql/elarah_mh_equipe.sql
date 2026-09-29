-- =============================================================
-- ELARAH MENTAL HEALTH — LOGIN SÓ DA MENTAL HEALTH (parceiras)
-- -------------------------------------------------------------
-- Pra quem vai trabalhar SÓ na Elarah Mental Health (ex.: a Larissa)
-- sem enxergar nada da Elarah (compras, clientes, caixa…).
--
-- Como funciona:
--   • A conta dela fica com role = 'user' (NÃO é admin). Por isso o
--     painel da Elarah (admin.html) e todas as tabelas da Elarah ficam
--     fechados pra ela — pelo banco, não só escondidos no menu.
--   • profiles.admin_panels = {mental-health, mh:visao, mh:prosp, …}
--     diz que ela entra no admin-mh.html e QUAIS abas vê lá.
--     Só 'mental-health' (sem nenhuma 'mh:…') = todas as abas da MH.
--   • A função is_mh_team() abaixo libera pra ela SÓ as tabelas da
--     Mental Health: mh_eventos, mh_acompanhamento, mh_cronogramas,
--     mh_leads e a prospecção B2B (b2b_prospects e interações).
--   • Ela não consegue se dar mais acesso: a trava de
--     sql/elarah_equipe_acessos.sql congela role e admin_panels pra
--     quem não tem acesso total.
--
-- Os logins são criados pela aba Usuários → "Equipe & acessos"
-- (Edge Function admin-equipe). Não precisa abrir o Supabase.
--
-- Pré-requisitos: sql/elarah_equipe_acessos.sql (coluna admin_panels
-- e a trava) e sql/elarah_mental_health.sql (tabelas mh_*).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================


-- ===== 1. Quem é da equipe da Mental Health =====
-- Acesso total (a dona) OU quem tem 'mental-health' liberado.
create or replace function public.is_mh_team()
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
       and (
         (role = 'admin' and admin_panels is null)
         or admin_panels @> array['mental-health']
       )
  );
$$;

grant execute on function public.is_mh_team() to authenticated;


-- ===== 2. Tabelas da Mental Health liberadas pra equipe MH =====
-- As policies antigas (só admin) continuam; estas SOMAM acesso.
do $$
declare
  t text;
begin
  foreach t in array array[
    'mh_eventos', 'mh_acompanhamento', 'mh_cronogramas', 'mh_leads',
    'b2b_prospects', 'b2b_prospect_interactions'
  ] loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabela % não existe ainda — rode o SQL dela e depois este de novo.', t;
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', t || '_mh_team', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_mh_team()) with check (public.is_mh_team())',
      t || '_mh_team', t
    );
    raise notice 'OK: % liberada pra equipe da Mental Health.', t;
  end loop;
end $$;


-- =============================================================
-- CONFERIR — quem entra em quê
-- =============================================================
select
  email,
  nome,
  role,
  case
    when role = 'admin' and admin_panels is null           then 'ACESSO TOTAL (Elarah + Mental Health)'
    when role = 'admin' and admin_panels @> array['mental-health'] then 'Equipe Elarah + Mental Health'
    when role = 'admin'                                     then 'Equipe Elarah'
    when admin_panels @> array['mental-health']             then 'SÓ Elarah Mental Health'
    else 'sem acesso'
  end as acesso,
  admin_panels
from public.profiles
where role = 'admin' or admin_panels is not null
order by acesso, email;
