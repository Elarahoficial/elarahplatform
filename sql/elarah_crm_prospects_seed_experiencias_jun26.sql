-- =============================================================
-- ELARAH — SEED de Prospecção (fornecedores de experiências) — jun/2026
-- *** VERSÃO 2 — SOMENTE SÃO PAULO CAPITAL (bairro confirmado) ***
-- -------------------------------------------------------------
-- 22 fornecedores REAIS de experiências "fora do óbvio", TODOS com
-- endereço/bairro confirmado na CIDADE DE SÃO PAULO (jun/2026).
-- Removidos os que não eram SP capital (ex: Aldeia Sabão = Portugal)
-- ou sem endereço confirmável.
--
-- ANTI-DUPLICATA: cada linha só entra se NÃO existir prospect com o
-- mesmo nome (case-insensitive). Rodar 2x não duplica.
--
-- CONTATO: WhatsApp/telefone preenchido só quando confirmado em fonte
-- pública. Onde não confirmei, fica vazio e o @/site na observação é a
-- fonte (não inventamos número).
--
-- IDEMPOTENTE — rode no Supabase → SQL Editor.
-- =============================================================

insert into public.prospects (nome, categoria, instagram, whatsapp, email, site, observacoes)
select v.nome, v.categoria, nullif(v.instagram,''), nullif(v.whatsapp,''),
       nullif(v.email,''), nullif(v.site,''), v.observacoes
from (values
  -- ===== Cerâmica (SP capital) =====
  ('Ateliê Marte','ceramica','@atelie.marte','11 94825-6844','marina@marteceramica.com.br','https://www.marteceramica.com.br',
   'SP · Vila Mariana (R. Dona Inácia Uchôa, 371). Cerâmica torno/modelagem; tem workshop a dois. WhatsApp confirmado.'),
  ('A Oficina Cerâmica','ceramica','@aoficinaceramica','','','https://www.aoficinaceramica.com',
   'SP · Mooca (R. dos Campineiros, 398). Faz workshops corporativos. WhatsApp: pegar no site/IG.'),
  ('Ateliê Cerâmica & Cia','ceramica','@ceramicaecia','','','https://www.ceramicaecia.com.br',
   'SP · Vila Madalena. Cerâmica + loja, turmas individualizadas. WhatsApp: pegar no site/IG.'),
  ('Morada do Barro (Do Barro)','ceramica','@do.barro','','','https://www.moradadobarro.com.br',
   'SP · Vila Mariana (R. Napoleão de Barros, 167). Escola de cerâmica. WhatsApp: pegar no site/IG.'),
  ('Terra W Estúdio','ceramica','','','','https://www.terrawestudio.com.br',
   'SP · Alto de Pinheiros. Ateliê de cerâmica (torno/modelagem). Contato pelo site.'),
  ('Escola Olive','ceramica','@escolaolive','','','',
   'SP · Água Branca (R. Dona Germaine Burchard, 239). Escola de cerâmica. WhatsApp: pegar na bio do IG.'),
  -- ===== Perfumaria (categoria=outro, SP capital) =====
  ('Paralela Escola Olfativa','outro','@paralelaescolaolfativa','11 3853-7576','','https://paralelaescolaolfativa.com.br',
   'SP · Pinheiros (R. Claudio Soares, 72 cj 504). Crie seu perfume. Tel confirmado.'),
  ('Harbolita','outro','@harbolita','11 97546-9023','contato@harbolita.com','https://harbolita.com',
   'SP · Pinheiros (R. Artur de Azevedo, 675). Perfumaria natural (Camila Pazini). WhatsApp + e-mail confirmados.'),
  ('Original Experience','outro','','','','https://originalexperience.com.br',
   'SP · Barra Funda (R. Norma P. Giannotti, 665). Crie sua essência; tem formato corporativo. Contato pelo site.'),
  -- ===== Vinho / coquetelaria / gin / chocolate (categoria=gastronomia, SP capital) =====
  ('Del Vino Wine Club','gastronomia','','','','https://www.delvinoclub.com.br',
   'SP · Moema (Av. Sabiá). Curso/degustação de vinho com harmonização; faz corporativo. WhatsApp: pegar no site.'),
  ('Bartender Store','gastronomia','','11 3500-2450','','https://bartenderstore.com.br',
   'SP · Pinheiros (Av. Pedroso de Morais, 998) e Tatuapé. Workshop de drinks. Tel da unidade confirmado.'),
  ('Drink Design','gastronomia','','','','https://www.drinkdesign.com.br',
   'SP · Jardim Europa. Cursos de coquetelaria de alto padrão. Contato pelo site.'),
  ('Arapuru Gin','gastronomia','','','','https://arapuru.com.br',
   'SP capital. Curso de gin (3h, prática/degustação). Contato pelo site.'),
  ('Chocolândia','gastronomia','','','','https://www.chocolandiaonline.com.br',
   'SP · Santo Amaro (Av. João Dias, 24). Cursos de chocolate/confeitaria. Contato pelo site.'),
  -- ===== Vela (SP capital) =====
  ('Empório das Velas','vela','@emporiodasvelas','11 5051-1857','','https://www.emporiodasvelas.com.br',
   'SP · Moema (Av. Moema, 140). Velas aromáticas (oficinas). Tel confirmado.'),
  -- ===== Marcenaria (categoria=outro, SP capital) =====
  ('Cose di Legno','outro','@cosedilegno','11 93338-9922','','https://cosedilegno.com.br',
   'SP · Pinheiros (R. Antônio Bicudo, 22). Marcenaria/design em madeira. WhatsApp confirmado.'),
  -- ===== Pintura (SP capital) =====
  ('Neon Brush (Paint in the Dark)','pintura','','','','https://neonbrushexperience.com',
   'SP · Pinheiros (R. Belmiro Braga, 112, no Colecta). Pintura + drinks sob luz negra. Contato pelo site.'),
  ('Vinho Tinta','pintura','@vinhotinta','','','https://www.vinhotinta.com',
   'SP capital (Vila Madalena/Pinheiros) — faz +30 experiências/sem. Pintura + vinho E team building (parceria dupla B2C+B2B). Contato pelo site.'),
  -- ===== Tufting (categoria=tufting, SP capital) =====
  ('Bengal Studio','tufting','','','','https://bengalstudio.com.br',
   'SP · Bom Retiro (R. Prates, 557) / Brás (R. Bresser, 879). Workshop de tufting (tapete). Contato pelo site.'),
  -- ===== Joalheria (SP capital) =====
  ('Ateliê Labriola','joalheria','','','','https://www.atelielabriola.com.br',
   'SP capital. Escola de ourives — "Ourives por 1 dia" e "Noivos Ourives" (fazer aliança a dois). Contato pelo site.'),
  ('Brutalita','joalheria','','','','https://brutalita.com.br',
   'SP · Vila Mariana (R. Manoel de Paiva, 333). Oficina de joalheria artesanal (anel em prata). Contato pelo site.'),
  -- ===== Mosaico (categoria=outro, SP capital) =====
  ('Oficina de Mosaicos','outro','','','','http://www.oficinademosaicos.com.br',
   'SP · Vila Madalena (R. Rodésia, 398). Workshop de mosaico — experiência bem diferente. Contato pelo site.')
) as v(nome,categoria,instagram,whatsapp,email,site,observacoes)
where not exists (
  select 1 from public.prospects p where lower(p.nome) = lower(v.nome)
);

-- Confere quantos entraram:
-- select nome, categoria, whatsapp from public.prospects order by created_at desc limit 22;
