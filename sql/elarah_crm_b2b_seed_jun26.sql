-- =============================================================
-- ELARAH — SEED B2B (empresas-alvo p/ team building) — jun/2026
-- -------------------------------------------------------------
-- 10 empresas REAIS com sede em São Paulo, fora das 44 já
-- cadastradas (Cobli, CargoX, Loft, WeWork, etc.). Alvo:
-- experiências de team building pro RH/People.
--
-- ANTI-DUPLICATA: cada empresa só entra se NÃO existir b2b_prospect
-- com o mesmo nome (case-insensitive). Rodar 2x não duplica.
--
-- CONTATO: não inventamos nome/whatsapp de pessoa. O site é confirmado;
-- o contato de RH/People deve ser achado no LinkedIn (proxima_acao).
--
-- TEXTO DE ABORDAGEM (1ª mensagem — copie e personalize {{contato}}):
--   "Oi, {{contato}}! Sou da Elarah, plataforma de experiências em São
--    Paulo (cerâmica, gastronomia, perfumaria, vinho, oficinas criativas).
--    A gente monta experiências de TEAM BUILDING pro RH — presencial, pra
--    integrar e engajar o time, fugindo do happy hour de sempre. Posso te
--    mandar 2-3 formatos com valores, sem compromisso? 🧡"
--
-- IDEMPOTENTE — rode no Supabase → SQL Editor.
-- =============================================================

insert into public.b2b_prospects
  (nome, tipo_empresa, segmento, site, contato_cargo, potencial, proxima_acao, observacoes)
select v.nome, v.tipo_empresa, v.segmento, v.site, 'RH / Head of People',
       v.potencial, 'Achar Head of People/RH no LinkedIn e enviar a 1ª mensagem de team building',
       v.observacoes
from (values
  ('Omie','tech','SaaS de gestão (ERP) para PMEs','https://www.omie.com.br','alto',
   'Time grande em SP, cultura forte. Bom alvo p/ team building criativo. Buscar RH no LinkedIn.'),
  ('Pismo','tech','Infraestrutura de pagamentos (fintech)','https://www.pismo.io','medio',
   'Fintech SP (adquirida pela Visa). Times de produto/eng — oficinas criativas funcionam bem.'),
  ('Dock','tech','Banking as a service (fintech)','https://dock.tech','alto',
   'Fintech grande em SP. Potencial alto p/ eventos de integração por squad.'),
  ('Liv Up','startup','Foodtech — comida saudável','https://www.livup.com.br','medio',
   'Marca com pegada de bem-estar — combina com experiências sensoriais (gastronomia/perfumaria).'),
  ('Loggi','tech','Logtech / entregas','https://www.loggi.com','alto',
   'Operação grande em SP. Team building por área. Buscar People/Cultura no LinkedIn.'),
  ('Petlove','tech','E-commerce / saúde pet','https://www.petlove.com.br','alto',
   'E-commerce SP com time relevante. Ótimo p/ confraternização de equipe.'),
  ('dr.consulta','clinica','Rede de clínicas (saúde)','https://www.drconsulta.com','alto',
   'Saúde, muitos colaboradores em SP. Experiências de bem-estar/gastronomia pro time.'),
  ('Alice','startup','Saúde (plano de saúde tech)','https://alice.com.br','medio',
   'Healthtech SP, cultura de cuidado — fit forte com bem-estar/perfumaria.'),
  ('Zenklub','startup','Saúde mental / bem-estar corporativo','https://zenklub.com.br','alto',
   'Vende bem-estar corporativo — pode ser parceiro E cliente. Abordar People/Parcerias.'),
  ('Singu','startup','Beleza & bem-estar a domicílio','https://www.singu.com.br','medio',
   'Marca de bem-estar SP. Experiências criativas/relax pro time. Buscar RH no LinkedIn.')
) as v(nome,tipo_empresa,segmento,site,potencial,observacoes)
where not exists (
  select 1 from public.b2b_prospects b where lower(b.nome) = lower(v.nome)
);

-- Confere quantas entraram:
-- select nome, tipo_empresa, potencial from public.b2b_prospects order by created_at desc limit 10;
