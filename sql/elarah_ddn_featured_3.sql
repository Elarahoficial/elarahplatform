-- =============================================================
-- ELARAH — Featured do Dia dos Namorados (curadoria da landing)
-- -------------------------------------------------------------
-- Marca SOMENTE as 3 experiencias escolhidas como featured na
-- landing /dia-dos-namorados.html. Todas as outras campaign_overrides
-- do slug 'dia-dos-namorados' viram is_featured=false (continuam no
-- catalogo /dia-dos-namorados-todas.html, soh nao aparecem na home).
--
-- Selecionadas:
--   1. Pasta & Date nas Alturas — Especial Dia dos Namorados
--   2. Flower Box — Especial Dia dos Namorados
--   3. Noite de Sabores & Amor — Especial Dia dos Namorados
--
-- A ordem na landing eh cronologica (proxima data primeiro) — display_order
-- soh eh tiebreak quando duas tem a mesma data.
-- =============================================================

-- 1) Diagnostico: lista os overrides ATIVOS de DDN com seus nomes,
--    pra confirmar quem ja esta featured e identificar os IDs corretos.
select
  o.id          as override_id,
  o.experience_id,
  e.nome,
  e.data,
  o.is_featured,
  o.display_order
from public.campaign_overrides o
join public.experiences e on e.id = o.experience_id
where o.campaign_slug = 'dia-dos-namorados'
order by o.is_featured desc, e.nome;

-- 2) Reseta TODOS os overrides DDN pra nao-featured.
update public.campaign_overrides
   set is_featured = false
 where campaign_slug = 'dia-dos-namorados';

-- 3) Marca SO os 3 escolhidos como featured. Match por ilike no nome
--    da experiencia ligada (tolera "Single's Day" com apostrofo
--    diferente, "&" vs "e", espacos extras, etc.).
update public.campaign_overrides o
   set is_featured = true
  from public.experiences e
 where o.experience_id = e.id
   and o.campaign_slug = 'dia-dos-namorados'
   and (
        e.nome ilike '%Pasta%Date nas Alturas%Dia dos Namorados%'
     or e.nome ilike '%Flower Box%Dia dos Namorados%'
     or e.nome ilike '%Noite de Sabores%Amor%Dia dos Namorados%'
   )
returning o.id, e.nome;

-- 4) Confirma o resultado final (deve mostrar exatamente 3 featured).
select
  e.nome,
  e.data,
  o.is_featured,
  o.display_order
from public.campaign_overrides o
join public.experiences e on e.id = o.experience_id
where o.campaign_slug = 'dia-dos-namorados'
  and o.is_featured = true
order by e.nome;
