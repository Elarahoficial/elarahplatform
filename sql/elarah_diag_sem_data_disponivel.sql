-- =============================================================
-- ELARAH — Quem está no site mas abre em "Sem datas disponíveis"
-- -------------------------------------------------------------
-- SÓ LEITURA. Não altera nada. Pode rodar quantas vezes quiser.
--
-- Lista as experiências que o cliente VÊ na vitrine mas não consegue
-- comprar: clica no card e a página abre com "Sem datas disponíveis
-- no momento". Some do funil sem sumir da lista.
--
-- Usa a MESMA regra do site (experiencia.html) pra decidir se uma
-- turma é comprável:
--   • turma ativa (is_active não é false)
--   • com data/hora definida (event_at preenchido)
--   • fora da janela de antecedência: event_at >= agora + cutoff
--       cutoff = experiences.cutoff_hours quando preenchido,
--                senão 48h em Gastronomia e 24h nas demais
--   • com vaga: vagas_total nulo (ilimitado) OU vagas_restantes > 0
--
-- A coluna `motivo` já diz o que fazer em cada caso.
--
-- Como rodar: Supabase → SQL Editor → cola → Run.
-- =============================================================

with exp as (
  select
    e.id,
    e.nome,
    e.categoria,
    e.bairro,
    e.fornecedor_nome,
    -- Mesma conta de effectiveCutoffHours() do experiences-data.js
    case
      when e.cutoff_hours is not null then e.cutoff_hours
      when lower(btrim(coalesce(e.categoria, ''))) = 'gastronomia' then 48
      else 24
    end as cutoff_h,
    -- Agenda aberta (voucher): vende sem turma, então não entra na lista
    coalesce(btrim(coalesce(e.horario_funcionamento, '')), '') <> '' as agenda_livre
    from public.experiences e
   where coalesce(e.is_active, true) is true      -- não foi ocultada no admin
     and coalesce(e.arquivada, false) is false    -- não foi arquivada
),
contagem as (
  select
    x.id,
    count(s.id)                                                          as turmas,
    count(s.id) filter (
      where s.is_active is not false and s.event_at >= now()
    )                                                                    as futuras,
    count(s.id) filter (
      where s.is_active is not false
        and s.event_at >= now() + make_interval(hours => x.cutoff_h)
        and (s.vagas_total is null or coalesce(s.vagas_restantes, s.vagas_total) > 0)
    )                                                                    as compraveis,
    count(s.id) filter (
      where s.is_active is not false
        and s.event_at >= now()
        and s.vagas_total is not null
        and coalesce(s.vagas_restantes, s.vagas_total) <= 0
    )                                                                    as esgotadas,
    count(s.id) filter (
      where s.is_active is not false
        and s.event_at >= now()
        and s.event_at < now() + make_interval(hours => x.cutoff_h)
        and (s.vagas_total is null or coalesce(s.vagas_restantes, s.vagas_total) > 0)
    )                                                                    as dentro_do_prazo,
    count(s.id) filter (
      where s.is_active is not false and s.event_at is null
    )                                                                    as sem_data,
    count(s.id) filter (
      where s.is_active is false and s.event_at >= now()
    )                                                                    as desativadas_futuras,
    min(s.event_at) filter (where s.is_active is not false and s.event_at >= now())
                                                                         as proxima_turma
    from exp x
    left join public.experience_slots s on s.experience_id = x.id
   group by x.id
)
select
  x.nome                                          as experiencia,
  x.categoria,
  x.bairro,
  coalesce(x.fornecedor_nome, '—')                as fornecedor,
  x.cutoff_h                                      as prazo_h,
  c.turmas,
  c.futuras,
  c.esgotadas,
  c.dentro_do_prazo,
  c.sem_data,
  c.desativadas_futuras                           as desativadas,
  to_char(c.proxima_turma at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as proxima_turma,
  case
    when c.turmas = 0
      then 'Sem nenhuma turma cadastrada — cadastre as datas (ou materialize a recorrência).'
    when c.futuras = 0 and c.sem_data = 0 and c.desativadas_futuras > 0
      then 'A(s) turma(s) futura(s) está(ão) desativada(s)/cancelada(s) — reative no painel ou crie outra data.'
    when c.futuras = 0 and c.sem_data = 0
      then 'Todas as turmas já passaram — crie as próximas datas.'
    when c.esgotadas > 0 and c.dentro_do_prazo = 0 and c.sem_data = 0
      then 'Esgotada: turma futura sem nenhuma vaga — abra vagas ou crie nova data.'
    when c.dentro_do_prazo > 0 and c.esgotadas = 0 and c.sem_data = 0
      then 'A(s) turma(s) futura(s) está(ão) dentro do prazo mínimo de ' || x.cutoff_h ||
           'h — o site só vende com essa antecedência. Crie uma data mais adiante.'
    when c.sem_data > 0 and c.esgotadas = 0 and c.dentro_do_prazo = 0
      then 'Turma sem data definida — o site não oferece turma sem data. Preencha a data dos horários.'
    else 'Nenhuma data comprável: ' || c.esgotadas || ' esgotada(s), ' ||
         c.dentro_do_prazo || ' dentro do prazo de ' || x.cutoff_h || 'h, ' ||
         c.sem_data || ' sem data.'
  end                                             as motivo
  from exp x
  join contagem c on c.id = x.id
 where c.compraveis = 0        -- nenhuma data pra comprar
   and x.agenda_livre is false -- voucher/agenda aberta vende sem turma: fora
 order by c.futuras desc, x.categoria, x.nome;
