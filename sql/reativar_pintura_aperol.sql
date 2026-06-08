-- =============================================================
-- ELARAH — Reativar experiencia "Pintura de Quadro com Cristal
-- & Aperol Spritz" manualmente
-- -------------------------------------------------------------
-- Use SOMENTE se o botao Reativar no admin nao estiver funcionando
-- e voce ja diagnosticou que eh problema de RLS/permissao.
--
-- Roda direto no SQL Editor do Supabase como service_role
-- (o editor sempre usa service_role, entao bypassa RLS).
--
-- O update eh restrito por nome pra nao afetar outras experiencias.
-- =============================================================

-- 1) Confere antes: lista as experiencias com esse nome (deve ser 1).
select id, nome, categoria, data, is_active, hide_from_categorias,
       is_elarah_original, created_at
from public.experiences
where nome ilike '%Pintura de Quadro com Cristal%Aperol Spritz%'
order by created_at desc;

-- 2) Reativa todas que batem (revise o select acima primeiro).
--    Se houver mais de uma e voce quer reativar apenas a especifica,
--    troque o WHERE pra `where id = 'UUID-AQUI'` usando o id da
--    query acima.
update public.experiences
   set is_active = true,
       hide_from_categorias = false       -- libera ela tambem em /categoria
 where nome ilike '%Pintura de Quadro com Cristal%Aperol Spritz%'
   and is_active = false
returning id, nome, is_active, hide_from_categorias;

-- 3) Diagnostico extra: confere que seu usuario eh admin.
--    Se a query abaixo devolver "admin" voce eh admin e RLS deveria
--    ter permitido o UPDATE — entao o problema do botao nao eh
--    permissao. Se voltar "user" ou vazio, ai esta a raiz.
select p.id, p.email, p.role, public.is_admin() as eh_admin_via_funcao
from public.profiles p
where p.email = auth.email();
