-- =============================================================
-- ELARAH — Coração laranja 🧡 (regra de marca)
-- -------------------------------------------------------------
-- A marca é LARANJA. O coração amarelo 💛 saiu de tudo que a
-- Elarah escreve — no código isso já foi trocado, mas os textos
-- que ficam guardados no BANCO precisam ser corrigidos também,
-- senão a próxima mensagem enviada sai amarela de novo.
--
-- O QUE ESTE SCRIPT MEXE: só o que ainda vai ser ENVIADO ou
-- publicado — templates de mensagem, calendário editorial, pauta
-- de conteúdo e as mensagens prontas da aba Eventos privados.
--
-- O QUE ELE NÃO MEXE, DE PROPÓSITO: histórico. Broadcast já
-- disparado, e-mail já enviado, interação já registrada. Aquilo
-- é registro do que aconteceu — reescrever o passado faria o log
-- deixar de bater com o que a pessoa recebeu de fato.
--
-- Cada UPDATE é guardado por um IF de existência: se a tabela não
-- existe neste banco, o bloco é pulado em vez de dar erro.
--
-- IDEMPOTENTE — rodar de novo não acha mais nada pra trocar.
--
-- ATENÇÃO: este arquivo é o ÚNICO do repositório que contém o
-- coração amarelo de propósito — ele é o padrão de BUSCA. Uma
-- troca automática de 💛 por 🧡 no repositório inteiro deixaria
-- este script procurando laranja e gravando laranja, ou seja,
-- sem efeito nenhum. Se for rodar uma substituição em massa,
-- pule este arquivo.
--
-- Rode no SQL Editor do Supabase.
-- =============================================================

do $$
begin
  -- ----- Templates do CRM de parceiros -----
  if to_regclass('public.prospect_templates') is not null then
    update public.prospect_templates
       set conteudo = replace(conteudo, '💛', '🧡')
     where conteudo like '%💛%';
    update public.prospect_templates
       set nome = replace(nome, '💛', '🧡')
     where nome like '%💛%';
  end if;

  -- ----- Templates do CRM B2B -----
  if to_regclass('public.b2b_prospect_templates') is not null then
    update public.b2b_prospect_templates
       set conteudo = replace(conteudo, '💛', '🧡')
     where conteudo like '%💛%';
    update public.b2b_prospect_templates
       set nome = replace(nome, '💛', '🧡')
     where nome like '%💛%';
  end if;

  -- ----- Calendário editorial -----
  if to_regclass('public.content_calendar') is not null then
    update public.content_calendar
       set ideia      = replace(coalesce(ideia, ''), '💛', '🧡'),
           legenda    = replace(coalesce(legenda, ''), '💛', '🧡'),
           observacao = replace(coalesce(observacao, ''), '💛', '🧡')
     where coalesce(ideia, '')      like '%💛%'
        or coalesce(legenda, '')    like '%💛%'
        or coalesce(observacao, '') like '%💛%';
  end if;

  -- ----- Kanban de conteúdo -----
  if to_regclass('public.content_pieces') is not null then
    update public.content_pieces
       set titulo = replace(titulo, '💛', '🧡')
     where titulo like '%💛%';
    update public.content_pieces
       set notas = replace(notas, '💛', '🧡')
     where notas like '%💛%';
  end if;

  -- ----- Mensagens prontas da aba Eventos privados -----
  -- jsonb não tem replace: vira texto, troca e volta pra jsonb.
  if to_regclass('public.evento_privado_metas') is not null then
    update public.evento_privado_metas
       set mensagens = replace(mensagens::text, '💛', '🧡')::jsonb
     where mensagens::text like '%💛%';
    update public.evento_privado_metas
       set observacoes = replace(observacoes, '💛', '🧡')
     where observacoes like '%💛%';
  end if;
end $$;


-- ===== Conferência =====
-- Deve voltar 0 em todas as colunas. Se alguma vier com número,
-- me manda o resultado que eu vejo de onde está saindo.
select
  (select count(*) from public.prospect_templates      where conteudo like '%💛%')      as templates_parceiros,
  (select count(*) from public.b2b_prospect_templates  where conteudo like '%💛%')      as templates_b2b,
  (select count(*) from public.content_calendar        where coalesce(legenda,'') like '%💛%'
                                                          or coalesce(ideia,'')   like '%💛%') as calendario,
  (select count(*) from public.evento_privado_metas    where mensagens::text like '%💛%') as mensagens_eventos;
