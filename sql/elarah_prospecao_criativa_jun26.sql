-- =============================================================
-- ELARAH — Prospecção Criativa / Desestresse (junho 2026 — lote 2)
-- -------------------------------------------------------------
-- 19 estabelecimentos enviados pela curadoria Elarah, com nome,
-- WhatsApp e Instagram. São os REALMENTE NOVOS: já removidos os
-- que existiam na base (conferido por nome, Instagram e WhatsApp
-- contra data/prospects-seed-v1.csv + seeds DDN + o lote cultural
-- elarah_prospecao_cultural_jun26.sql).
--
-- REMOVIDOS desta inserção por já existirem na base:
--   Cerâmica & Cia (@ceramicaecia), Escola de Choro/Galpão das
--   Artes (@escoladechorosp), Mori Chazeria, T&M Chás & Meditação,
--   Coffee Lab, Improclube, Tango B'Aires, Imágicas Laboratório
--   Fotográfico.
--
-- NÃO INCLUÍDOS (são canais/parceiros da própria Elarah, marcados
-- com @elarah.oficial — não são prospecção a frio):
--   Studio de Tufting Itaim, Escola de Panificação Artesanal,
--   Ateliê Elarah Velas.
--
-- IDEMPOTENTE + dedupe forte: insere só quando o nome, o Instagram
-- E o WhatsApp (normalizado) NÃO existirem ainda na base. Pode
-- rodar quantas vezes precisar sem duplicar nem sobrescrever.
-- Status default: 'nao_contatado'. Cidade default: 'São Paulo'.
-- =============================================================


-- Pré-checagem: aborta com mensagem clara se a tabela não existir.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prospects'
  ) then
    raise exception 'Tabela public.prospects não existe. Rode sql/elarah_crm_prospects.sql primeiro.';
  end if;
end $$;


with curated(nome, categoria, instagram, whatsapp, bairro, observacoes) as (
  values

    -- ============= CERÂMICA & MODELAGEM =============
    ('Ateliê Tetê Lordello', 'ceramica', '@atelietetelordello', '(11) 99242-2005', null,
     'Oficinas criativas e fluidas de modelagem manual, com foco em desacelerar a rotina e trabalhar o foco.'),
    ('Ateliê de Cerâmica Flavia Santoro', 'ceramica', '@flaviasantoroceramica', '(11) 99122-3839', null,
     'Workshops intimistas de criação de xícaras, bowls e canecas personalizadas com argilas texturizadas.'),
    ('Sara Carone Ateliê', 'ceramica', '@saracarone.studio', '(11) 99974-4537', null,
     'Vivências de modelagem figurativa e livre (escultura e cerâmica) para destravar a expressão artística.'),
    ('Lama Ateliê', 'ceramica', '@lama.atelie', '(11) 98202-1402', null,
     'Espaço de cerâmica contemporânea com foco em processos experimentais e designs geométricos para decoração.'),

    -- ============= ARTE TÊXTIL, COSTURA & BORDADO =============
    ('Laboratório de Roupas (Mariana Gonçalves Ateliê)', 'costura', '@marianagoncalvesatelie', '(11) 94567-7908', null,
     'Workshops rápidos de fim de semana de corte, costura e upcycling — confecção de bolsa e customização de jaquetas.'),
    ('Ateliê Crispim Tear', 'tecelagem', '@crispim_tear', '(11) 98115-3277', 'Vila Madalena',
     'Vivências imersivas de tear pente-liço e técnicas ancestrais de tramas com fios naturais.'),
    ('Bordado Studio', 'bordado', '@bordadostudio', '(11) 97103-3450', null,
     'Oficinas de bordado livre e aquarela em tecido, com contornos botânicos e preenchimentos criativos em bastidores.'),

    -- ============= PINTURA, DESENHO & PAPELARIA =============
    ('Quanta Academia de Artes', 'desenho', '@quantaacademia', '(11) 94220-7624', null,
     'Workshops curtos de ilustração, aquarela, desenho de observação e criação de sketchbooks.'),
    ('Casa Locomotiva', 'gravura', '@casalocomotiva', '(11) 98016-8311', 'Vila Madalena',
     'Ateliê coletivo de gravura e serigrafia manual — xilogravura e impressão de cartazes e ecobags.'),
    ('Espaço Mirabilis', 'pintura', '@espaco_mirabilis', '(11) 93731-0001', null,
     'Ateliê de pintura intuitiva e escrita, com dinâmicas sensíveis, café e diários de bordo visuais.'),
    ('AreaE - Escola de Artes', 'desenho', '@areae.escola', '(11) 3207-7624', null,
     'Oficinas de arte final com marcadores profissionais (estilo Copic) e técnicas de pintura fluida.'),

    -- ============= CHÁS & DEGUSTAÇÃO =============
    ('Chá Yê!', 'degustacao_cha', '@chaye_oficial', '(11) 93012-0692', 'Pinheiros',
     'Workshops imersivos de Gongfu Cha (cerimônia chinesa) com degustação guiada por sommeliers.'),

    -- ============= BOTÂNICA, JARDINAGEM & BONSAI =============
    ('Bonsai Kai', 'bonsai', '@bonsaikai', '(11) 96665-1000', null,
     'Workshop prático de fim de semana: podas, aramagem e transplante com foco em meditação ativa.'),
    ('Yamadory Bonsai & Escola', 'bonsai', '@yamadorybonsai', '(11) 97531-4397', null,
     'Oficinas e demonstrações de modelagem de mini árvores e harmonização com pedras de contemplação (suiseki).'),
    ('FLO atelier botânico', 'jardinagem', '@floatelierbotanico', '(11) 2589-6116', 'Pinheiros',
     'Oficinas premium de terrários (ecossistemas fechados) e composições florais esculturais.'),
    ('Kokesampa', 'kokedama', '@kokesampa', '(11) 97203-8841', null,
     'Aulas da técnica japonesa de kokedama — arranjos suspensos sem vasos, com musgos e substratos.'),

    -- ============= AROMAS, SABOARIA & PERFUMARIA =============
    ('Aromas da Villa Ateliê', 'saboaria', '@aromasdavilla_', '(11) 94503-1221', null,
     'Oficinas de saboaria natural (cold process) e blends de escalda-pés relaxantes.'),
    ('Ateliê Botânico de Perfumaria', 'perfumaria', '@perfumariabotanica', '(11) 99188-3412', null,
     'Workshop olfativo exclusivo em que cada participante monta a própria fragrância com notas de óleos puros.'),

    -- ============= ESCRITA & EXPRESSÃO =============
    ('Escrevedeira', 'escrita_criativa', '@escrevedeira', '(11) 94499-0141', 'Vila Madalena',
     'Oficinas literárias de escrita criativa e poesia numa casa com jardim, para destravar bloqueios textuais.')

)
insert into public.prospects (
  nome, categoria, instagram, whatsapp, bairro, cidade, observacoes, status
)
select
  c.nome, c.categoria, c.instagram, c.whatsapp, c.bairro,
  'São Paulo', c.observacoes, 'nao_contatado'
from curated c
where not exists (
  select 1 from public.prospects p
  where lower(p.nome) = lower(c.nome)
     or (c.instagram is not null and lower(trim(p.instagram)) = lower(trim(c.instagram)))
     or (
          nullif(regexp_replace(coalesce(c.whatsapp,''), '\D', '', 'g'), '') is not null
          and regexp_replace(coalesce(p.whatsapp,''), '\D', '', 'g')
            = regexp_replace(c.whatsapp, '\D', '', 'g')
        )
);


-- =============================================================
-- VERIFICAÇÃO
-- =============================================================
--   select nome, categoria, whatsapp, instagram, status
--   from public.prospects
--   where instagram in (
--     '@atelietetelordello','@flaviasantoroceramica','@saracarone.studio',
--     '@lama.atelie','@marianagoncalvesatelie','@crispim_tear','@bordadostudio',
--     '@quantaacademia','@casalocomotiva','@espaco_mirabilis','@areae.escola',
--     '@chaye_oficial','@bonsaikai','@yamadorybonsai','@floatelierbotanico',
--     '@kokesampa','@aromasdavilla_','@perfumariabotanica','@escrevedeira'
--   )
--   order by nome;
--
-- Esperado: 19 prospects novos, todos 'nao_contatado'.
-- =============================================================
