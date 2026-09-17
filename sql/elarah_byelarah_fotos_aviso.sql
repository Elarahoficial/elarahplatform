-- =============================================================
-- ELARAH — Conferência das FOTOS que vão no aviso de WhatsApp
-- -------------------------------------------------------------
-- O aviso pela API oficial leva a foto da experiência no cabeçalho do
-- template. A Meta só aceita **JPG e PNG** — webp, jfif, gif e afins são
-- recusados. Quando o formato não serve, o sistema manda o logo da Elarah
-- (a mensagem chega), mas a foto do evento se perde.
--
-- Esta query mostra, por evento By Elarah, se a foto cadastrada serve.
-- Só leitura: não altera nada.
--
-- Como rodar: Supabase Dashboard → SQL Editor → cola → Run.
-- =============================================================

select
  e.nome,
  coalesce(nullif(btrim(e.imagem), ''), '(sem foto)')        as foto_cadastrada,
  case
    when coalesce(btrim(e.imagem), '') = ''
      then 'SEM FOTO — vai o logo da Elarah'
    when lower(split_part(split_part(e.imagem, '?', 1), '#', 1)) ~ '\.(jpg|jpeg|png)$'
      then 'OK — vai a foto do evento'
    else 'FORMATO RECUSADO pela Meta — troque por .jpg ou .png'
  end                                                        as situacao,
  coalesce(e.cta_mode, 'buy')                                as cta_mode,
  coalesce(e.is_active, true)                                as no_ar
from public.experiences e
where e.is_elarah_original is true
order by
  case
    when coalesce(btrim(e.imagem), '') = '' then 1
    when lower(split_part(split_part(e.imagem, '?', 1), '#', 1)) ~ '\.(jpg|jpeg|png)$' then 2
    else 0                                    -- formato recusado primeiro
  end,
  e.nome;

-- =============================================================
-- O que fazer com um "FORMATO RECUSADO": abra a experiência no admin e
-- troque a imagem por um .jpg ou .png. Nada mais muda — o aviso passa a
-- levar a foto do evento sozinho.
--
-- Limite de tamanho: a Meta aceita até 5 MB por imagem. Se alguma foto
-- estiver muito pesada, vale reduzir (o site também agradece).
-- =============================================================
