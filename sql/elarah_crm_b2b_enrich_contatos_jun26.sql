-- =============================================================
-- ELARAH — Enriquecimento de contatos B2B (jun/2026)
-- -------------------------------------------------------------
-- Preenche telefone (contato_whatsapp), LinkedIn do decisor
-- (contato_linkedin), e-mail (contato_email) e LinkedIn da empresa
-- (linkedin_empresa) das empresas-alvo já cadastradas na aba de
-- prospecção, com base em pesquisa pública (sites oficiais,
-- diretórios e resultados do LinkedIn) feita em 16/06/2026.
--
-- Por que UPDATE (e não novo seed):
--   Os seeds usam `insert ... where not exists`, então NÃO tocam
--   linhas já existentes. Estas empresas já estão na base — logo,
--   o enriquecimento precisa ser via UPDATE casado por nome.
--
-- Regras de qualidade:
--   - Só dados confirmados em fonte pública. Nada inventado.
--   - Telefones: a maioria é linha comercial (recepção); celular/
--     WhatsApp provável vai marcado no campo e na observação.
--   - Slugs de LinkedIn normalizados para ASCII (LinkedIn não usa
--     acentos em URL). Confira com 1 clique antes de prospectar —
--     o LinkedIn bloqueia verificação automática.
--   - PENDENTES (fora deste script, decisor/contato não confirmado):
--       Enjoei, Omie, Estúdio Arnold, Trasso Design, RBR Design
--       e o LinkedIn pessoal do sócio do Estúdio Bijari.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar (a nota de
-- contato só é anexada uma vez, via marcador "[contato jun/2026]").
-- Rode no Supabase (SQL Editor) com um usuário admin.
-- =============================================================

-- 1) F/Malta ------------------------------------------------------------------
-- ATENÇÃO: há 2 perfis "Felipe Malta"; este é o rotulado como dono da F/Malta.
update public.b2b_prospects set
  contato_email    = coalesce(contato_email, 'contato@fmalta.com.br'),
  contato_linkedin = 'https://www.linkedin.com/in/felipe-malta-lefevre-85687144',
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Sem telefone oficial confirmado — abrir por LinkedIn ou e-mail contato@fmalta.com.br. LinkedIn do Felipe ambíguo (existe tb /in/felipemalta atribuído à AMPRO) — usar o slug -lefevre- e conferir antes.' end
where lower(nome) = lower('F/Malta');

-- 2) EAÍ?! Content Experience -------------------------------------------------
update public.b2b_prospects set
  contato_email    = coalesce(contato_email, 'eai@eaimkt.com.br'),
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/paulofarnese'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Sem telefone oficial confirmado — abrir por LinkedIn ou e-mails eai@eaimkt.com.br / RH vempraca@eaimkt.com.br.' end
where lower(nome) = lower('EAÍ?! Content Experience');

-- 3) Qulture.Rocks ------------------------------------------------------------
update public.b2b_prospects set
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/franciscoshmello'),
  linkedin_empresa = coalesce(linkedin_empresa, 'https://www.linkedin.com/company/qulturerocks'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] LinkedIn do Kiko: /in/franciscoshmello. Telefone público não localizado — abrir por LinkedIn.' end
where lower(nome) = lower('Qulture.Rocks');

-- 4) Pin People ---------------------------------------------------------------
update public.b2b_prospects set
  contato_email    = coalesce(contato_email, 'contato@pinpeople.com.br'),
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/frelacerda'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] LinkedIn do Frederico: /in/frelacerda; e-mail contato@pinpeople.com.br. Telefone público não localizado.' end
where lower(nome) = lower('Pin People');

-- 5) Impact Hub São Paulo -----------------------------------------------------
update public.b2b_prospects set
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/henriquebussacos'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] LinkedIn do Henrique: /in/henriquebussacos. Site usa formulário (sem telefone público). Endereço: R. Dr. Virgílio de Carvalho Pinto, 445, Pinheiros.' end
where lower(nome) = lower('Impact Hub São Paulo');

-- 6) Casa Rex -----------------------------------------------------------------
update public.b2b_prospects set
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/gustavo-piqueira-4768116'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] LinkedIn do Gustavo Piqueira: /in/gustavo-piqueira-4768116. Telefone público não localizado — abrir por LinkedIn.' end
where lower(nome) = lower('Casa Rex');

-- 7) Oz estratégia+design -----------------------------------------------------
-- ATENÇÃO: dado público indica que Ronald Kapaz deixou a liderança da Oz em 2019.
update public.b2b_prospects set
  contato_whatsapp = '+55 11 3024-2670',
  contato_email    = coalesce(contato_email, 'contato@ozdesign.com.br'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Tel. comercial (11) 3024-2670; e-mail contato@ozdesign.com.br. ATENÇÃO: Ronald Kapaz deixou a liderança da Oz em 2019 — revisar quem é o decisor atual antes de abordar.' end
where lower(nome) = lower('Oz estratégia+design');

-- 8) Suno United Creators -----------------------------------------------------
update public.b2b_prospects set
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/carolinagil'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Sem telefone oficial confirmado (site só tem e-mail suno@sunocreators.com); LinkedIn da Carolina Gil (CHRO): /in/carolinagil.' end
where lower(nome) = lower('Suno United Creators');

-- 9) Tech & Soul --------------------------------------------------------------
update public.b2b_prospects set
  contato_whatsapp = '+55 11 3031-3131',
  contato_email    = coalesce(contato_email, 'contato@techandsoul.com.br'),
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/liliany-samarao-3b822b13'),
  linkedin_empresa = coalesce(linkedin_empresa, 'https://www.linkedin.com/company/techandsoul'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Tel. comercial (11) 3031-3131 (confirmado no site oficial); e-mail contato@techandsoul.com.br; LinkedIn da Liliany Samarão: /in/liliany-samarao-3b822b13.' end
where lower(nome) = lower('Tech & Soul');

-- 10) Galeria.ag --------------------------------------------------------------
update public.b2b_prospects set
  contato_email    = coalesce(contato_email, 'galeria@galeria.ag'),
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/edu-simon'),
  linkedin_empresa = coalesce(linkedin_empresa, 'https://www.linkedin.com/company/galeria-estrategia-e-comunicacao'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] E-mail galeria@galeria.ag; LinkedIn do Eduardo Simon: /in/edu-simon. Telefone público não localizado.' end
where lower(nome) = lower('Galeria.ag');

-- 11) Twist (twist®) ----------------------------------------------------------
update public.b2b_prospects set
  contato_email    = coalesce(contato_email, 'contato@twist.com.br'),
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/mauropalacios'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Sem telefone oficial confirmado (site só tem e-mail contato@twist.com.br); LinkedIn do Mauro Palacios: /in/mauropalacios.' end
where lower(nome) = lower('Twist (twist®)');

-- 12) Papanapa ----------------------------------------------------------------
update public.b2b_prospects set
  contato_linkedin = coalesce(contato_linkedin, 'https://www.linkedin.com/in/gustavosdgarcia'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] LinkedIn do Gustavo Garcia: /in/gustavosdgarcia. Telefone público não localizado — Instagram (@papanapadesign) também responde.' end
where lower(nome) = lower('Papanapa');

-- 13) Estúdio Bijari ----------------------------------------------------------
-- LinkedIn pessoal do sócio (Gustavo Godoy) ainda PENDENTE (homônimos).
update public.b2b_prospects set
  contato_whatsapp = '+55 11 99319-3106',
  contato_email    = coalesce(contato_email, 'contato@bijari.com.br'),
  linkedin_empresa = coalesce(linkedin_empresa, 'https://www.linkedin.com/company/bijari'),
  updated_at       = now(),
  observacoes      = case when observacoes like '%[contato jun/2026]%' then observacoes
    else observacoes || E'\n\n[contato jun/2026] Celular/WhatsApp provável (11) 99319-3106 (fixo (11) 3814-0815); e-mails contato@bijari.com.br e godoy@bijari.com.br. LinkedIn pessoal do Godoy ainda não confirmado (homônimos).' end
where lower(nome) = lower('Estúdio Bijari');
