-- =============================================================
-- ELARAH — SEED de Prospecção (fornecedores de experiências) — jun/2026
-- -------------------------------------------------------------
-- 22 fornecedores REAIS de experiências "fora do óbvio" em SP
-- (cerâmica, perfumaria, vinho, vela, cosmético/batom, coquetelaria,
-- marcenaria, vitral, pintura). Pesquisados na web em jun/2026.
--
-- ANTI-DUPLICATA (à prova de bala):
--   Cada linha só entra se NÃO existir prospect com o MESMO nome
--   (case-insensitive) na tabela ao vivo. Rodar 2x não duplica.
--
-- CONTATOS:
--   - WhatsApp/telefone preenchido SÓ quando confirmado em fonte pública.
--   - Onde não foi possível confirmar com segurança, o campo fica vazio
--     e o @/site na observação é a fonte (1 clique) — nunca inventamos número.
--
-- Status inicial = 'nao_contatado'. Categoria usa o enum do schema
-- (ceramica, pintura, joalheria, gastronomia, tufting, vela, outro).
-- IDEMPOTENTE — rode no Supabase → SQL Editor.
-- =============================================================

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, observacoes)
select v.nome, v.categoria, nullif(v.instagram,''), nullif(v.whatsapp,''),
       nullif(v.email,''), nullif(v.site,''), v.observacoes
from (values
  -- ===== Cerâmica =====
  ('Ateliê Marte','ceramica','@atelie.marte','11 94825-6844','marina@marteceramica.com.br','https://www.marteceramica.com.br',
   'Cerâmica (torno + modelagem) · Vila Mariana (R. Dona Inácia Uchôa, 371). Tem workshop a dois — ótimo pra Dia dos Namorados/casais. WhatsApp confirmado.'),
  ('A Oficina Cerâmica','ceramica','@aoficinaceramica','','','https://www.aoficinaceramica.com',
   'Cerâmica (torno/modelagem) · Mooca (R. dos Campineiros, 398). Faz workshops corporativos. WhatsApp: pegar no site/IG.'),
  ('Ateliê Cerâmica & Cia','ceramica','@ceramicaecia','','','https://www.ceramicaecia.com.br',
   'Cerâmica + loja · Vila Madalena (R. Fidalga, 387). WhatsApp: pegar no site/IG.'),
  ('Morada do Barro (Do Barro)','ceramica','@do.barro','','','https://www.moradadobarro.com.br',
   'Escola de cerâmica · Vila Mariana (R. Napoleão de Barros, 167). WhatsApp: pegar no site/IG.'),
  ('Terra W Estúdio','ceramica','','','','https://www.terrawestudio.com.br',
   'Cerâmica · cursos e workshops. Contato pelo site. Confirmar IG/WhatsApp.'),
  ('Escola Olive','ceramica','@escolaolive','','','',
   'Escola de cerâmica · Água Branca (R. Dona Germaine Burchard, 239). WhatsApp: pegar na bio do IG.'),
  -- ===== Perfumaria (categoria=outro) =====
  ('Paralela Escola Olfativa','outro','@paralelaescolaolfativa','11 3853-7576','','https://paralelaescolaolfativa.com.br',
   'Perfumaria — crie seu perfume · Pinheiros (R. Claudio Soares, 72 cj 504). Tel/loja confirmado; confirmar se atende WhatsApp.'),
  ('Harbolita','outro','@harbolita','11 97546-9023','contato@harbolita.com','https://harbolita.com',
   'Perfumaria natural/artesanal (oficina presencial em SP). WhatsApp + e-mail confirmados.'),
  ('Original Experience','outro','','','','https://originalexperience.com.br',
   'Perfumaria — "crie sua essência" (grupos 4-12). Bom pra evento a dois e corporativo. Contato pelo site.'),
  -- ===== Vinho / coquetelaria / gin (categoria=gastronomia) =====
  ('Del Vino Wine Club','gastronomia','','','','https://www.delvinoclub.com.br',
   'Curso/degustação de vinho com harmonização · Moema (Av. Sabiá). Faz eventos corporativos. WhatsApp: pegar no site.'),
  ('Bartender Store','gastronomia','','','','https://bartenderstore.com.br',
   'Workshop de coquetelaria/drinks (Bartender Experience, 3h). Bom pra casais e grupos. Contato pelo site.'),
  ('Drink Design','gastronomia','','','','https://www.drinkdesign.com.br',
   'Cursos de coquetelaria de alto padrão · Jardim Europa. Contato pelo site.'),
  ('Arapuru Gin','gastronomia','','','','https://arapuru.com.br',
   'Curso de gin (3h, 80% prática/degustação). Experiência diferente pra casais. Contato pelo site.'),
  -- ===== Vela =====
  ('As Velas (Andréa Fragoso)','vela','@as.velas','','','',
   'Curso de velas aromáticas. WhatsApp: pegar na bio do IG.'),
  ('Empório das Velas','vela','@emporiodasvelas','11 5051-1857','','https://www.emporiodasvelas.com.br',
   'Velas aromáticas (25 anos) · Moema (Av. Moema, 140). Tel confirmado; confirmar WhatsApp.'),
  -- ===== Cosmético / batom / sabonete (categoria=outro) =====
  ('Juni Lab','outro','','','','https://www.junilab.com.br',
   'Cosméticos naturais — faça seu próprio (skincare/batom/autocuidado). Exatamente o "fazer seu batom". Contato pelo site.'),
  ('Aldeia Sabão','outro','','','','https://www.aldeiasabao.com',
   'Sabonetes/cosméticos naturais — oficinas. Contato pelo site.'),
  ('Casa do Sabonete','outro','','','','https://www.casadosabonete.com.br',
   'Sabonete, vela e perfume artesanal — cursos. Contato pelo site.'),
  -- ===== Marcenaria / vitral (categoria=outro) =====
  ('Cose di Legno','outro','@cosedilegno','11 93338-9922','','https://cosedilegno.com.br',
   'Escola de marcenaria/design em madeira · Pinheiros (R. Antônio Bicudo, 22). WhatsApp confirmado.'),
  ('Vitral & Mosaico (vitral.mosaicos)','outro','@vitral.mosaicos','','','',
   'Vitral e mosaico (arte/decoração) — experiência super diferente. WhatsApp: pegar na bio do IG.'),
  -- ===== Pintura =====
  ('Neon Brush (Paint in the Dark)','pintura','','','','https://neonbrushexperience.com',
   'Pintura em tela + drinks sob luz negra · Pinheiros. Vibe jovem/casais. Contato pelo site.'),
  ('Vinho Tinta','pintura','@vinhotinta','','','https://www.vinhotinta.com',
   'Pintura + vinho. ATENÇÃO: também faz team building corporativo — pode virar parceria dupla (B2C + B2B). Contato pelo site (resposta em ~30min).')
) as v(nome,categoria,instagram,whatsapp,email,site,observacoes)
where not exists (
  select 1 from public.prospects p where lower(p.nome) = lower(v.nome)
);

-- Confere quantos entraram:
-- select count(*) from public.prospects where status = 'nao_contatado';
