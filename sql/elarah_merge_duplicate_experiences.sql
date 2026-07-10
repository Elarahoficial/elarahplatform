-- =============================================================
-- ELARAH — Merge de experiências DUPLICADAS  →  1 experiência,
--          várias opções de DATA (slots)
-- -------------------------------------------------------------
-- Junta experiências que são a MESMA coisa repetida em dias
-- diferentes (mesmo fornecedor + mesmo valor + mesma descrição;
-- foto e data podem variar). Depois do merge você tem UMA
-- experiência por card, com as várias datas aparecendo como
-- "Escolha uma data" na página.
--
-- ⚠️  RODE O DIAGNÓSTICO PRIMEIRO e confira o resultado:
--       sql/elarah_merge_duplicate_experiences_diagnostico.sql
--     Este script agrupa EXATAMENTE com o mesmo critério de lá.
--
-- COMO ELE É SEGURO
--   • NÃO apaga nada. As cópias juntadas só ficam OCULTAS
--     (is_active = false) — somem do site, mas continuam no banco.
--     Pra desfazer, é só voltar is_active = true.
--   • Antes de alterar cada cópia, salva um snapshot dela em
--     public.experiences_merge_log (backup + auditoria).
--   • Roda em transação: se der erro no meio, desfaz tudo.
--   • Idempotente: rodar de novo não faz nada (as cópias já
--     ocultas saem do grupo automaticamente).
--   • Nenhuma reserva/avaliação se perde: elas são REAPONTADAS
--     pra experiência principal antes de ocultar a cópia.
--   • Grupos com REGRA DE RECORRÊNCIA são PULADOS (recorrência é
--     avançada — trate à mão / me chame).
--
-- O QUE ACONTECE COM CADA CÓPIA (a "principal" = mais reservas,
--   depois a mais antiga; as demais são as "cópias"):
--   1. Slots (datas/horários) da cópia passam pra principal.
--   2. Reservas, avaliações, cupons, vendas manuais e despesas da
--      cópia passam a apontar pra principal.
--   3. A cópia recebe is_active = false (some do site).
--
-- Observações:
--   • A principal mantém o nome, a FOTO e a descrição dela. Se
--     você quiser outra foto/nome depois, edite no admin — leva 1 min.
--   • Se duas cópias tiverem a MESMA data+horário, a vaga fica na
--     principal e a reserva é reapontada; a data repetida da cópia
--     é descartada (não vira slot duplicado).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

begin;

-- ----- Tabela de backup/auditoria (guarda snapshot das cópias) -----
create table if not exists public.experiences_merge_log (
  id                 bigserial primary key,
  merged_at          timestamptz not null default now(),
  canonical_id       uuid,           -- experiência que ficou (principal)
  duplicate_id       uuid,           -- experiência que foi ocultada (cópia)
  duplicate_nome     text,
  duplicate_snapshot jsonb           -- linha completa da cópia, pré-merge
);

do $$
declare
  g            record;
  canonical    uuid;
  dup          uuid;
  n_grupos     int := 0;
  n_copias     int := 0;
begin
  for g in
    with base as (
      select
        e.id,
        e.nome,
        e.created_at,
        lower(btrim(coalesce(e.preco, '')))                        as preco_key,
        lower(btrim(coalesce(e.descricao, '')))                    as desc_key,
        coalesce(
          (select string_agg(lower(btrim(es.fornecedor_nome)), '|'
                             order by lower(btrim(es.fornecedor_nome)))
             from public.experience_suppliers es
            where es.experience_id = e.id),
          lower(btrim(coalesce(e.fornecedor_nome, '')))
        )                                                          as sup_key,
        (select count(*) from public.bookings b
           where b.experiencia_id = e.id)                          as n_reservas,
        exists (select 1 from public.experience_recurrence_rules r
                  where r.experience_id = e.id)                    as tem_recorrencia
      from public.experiences e
      where coalesce(e.is_active, true) <> false
    ),
    grp as (
      select
        bool_or(tem_recorrencia) as tem_recorrencia,
        (array_agg(id order by n_reservas desc, created_at asc, id asc))[1] as manter_id,
        (array_agg(id order by n_reservas desc, created_at asc, id asc))    as todos_ids
      from base
      where length(desc_key) >= 20
      group by sup_key, preco_key, md5(desc_key)
      having count(*) > 1
    )
    select manter_id,
           (todos_ids)[2:array_length(todos_ids, 1)] as juntar_ids
      from grp
     where not tem_recorrencia
  loop
    canonical := g.manter_id;
    n_grupos  := n_grupos + 1;

    foreach dup in array g.juntar_ids loop
      n_copias := n_copias + 1;

      -- 1a. Reservas em slots da cópia que a principal JÁ tem (mesma
      --     data+horário): reaponta pro slot equivalente da principal.
      update public.bookings b
         set slot_id = c.id
        from public.experience_slots ds
        join public.experience_slots c
          on c.experience_id = canonical
         and coalesce(c.data, '') = coalesce(ds.data, '')
         and c.horario = ds.horario
       where ds.experience_id = dup
         and b.slot_id = ds.id;

      -- 1b. Slots da cópia que a principal AINDA não tem: passam pra ela.
      --     (bookings desses slots seguem válidos — o id do slot não muda.)
      update public.experience_slots s
         set experience_id = canonical
       where s.experience_id = dup
         and not exists (
           select 1 from public.experience_slots c
            where c.experience_id = canonical
              and coalesce(c.data, '') = coalesce(s.data, '')
              and c.horario = s.horario
         );

      -- 1c. Sobrou algum slot na cópia = data repetida da principal.
      --     Já sem reservas (reapontadas em 1a). Descarta.
      delete from public.experience_slots where experience_id = dup;

      -- 2. Reservas da cópia passam pra principal.
      update public.bookings
         set experiencia_id = canonical
       where experiencia_id = dup;

      -- 3. Avaliações (se a tabela existir).
      if to_regclass('public.reviews') is not null then
        execute 'update public.reviews set experiencia_id = $1 where experiencia_id = $2'
          using canonical, dup;
      end if;

      -- 4. Cupons / vendas manuais / despesas — cada um só se a
      --    tabela E a coluna experience_id existirem no banco.
      if exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'coupons'
                    and column_name = 'experience_id') then
        execute 'update public.coupons set experience_id = $1 where experience_id = $2'
          using canonical, dup;
      end if;

      if exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'manual_sales'
                    and column_name = 'experience_id') then
        execute 'update public.manual_sales set experience_id = $1 where experience_id = $2'
          using canonical, dup;
      end if;

      if exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'financial_expenses'
                    and column_name = 'experience_id') then
        execute 'update public.financial_expenses set experience_id = $1 where experience_id = $2'
          using canonical, dup;
      end if;

      -- 5. Backup da cópia (snapshot completo) antes de ocultar.
      insert into public.experiences_merge_log
        (canonical_id, duplicate_id, duplicate_nome, duplicate_snapshot)
      select canonical, e.id, e.nome, to_jsonb(e.*)
        from public.experiences e
       where e.id = dup;

      -- 6. Oculta a cópia (some do site; nada é apagado).
      update public.experiences
         set is_active = false
       where id = dup;
    end loop;

    -- 7. GARANTIA "aparece sozinho": pra cada experiência do grupo
    --    (principal + cópias), se a DATA dela ainda não virou slot na
    --    principal, cria o slot agora — a partir da própria data +
    --    horários da experiência. Assim TODA data vira opção clicável
    --    na página, sem ninguém precisar registrar na mão.
    --    Slots reais (com reservas/vagas) já foram movidos acima; este
    --    passo só preenche buracos. on conflict não duplica nada.
    insert into public.experience_slots
      (experience_id, data, horario, vagas_total, vagas_restantes, event_at, is_active)
    select canonical, e.data, h.horario, e.vagas_total, e.vagas_total, e.event_at, true
      from public.experiences e
      cross join lateral unnest(e.horarios) as h(horario)
     where e.id = any (array_prepend(canonical, g.juntar_ids))
       and coalesce(btrim(e.data), '') <> ''
    on conflict (experience_id, coalesce(data, ''), horario) do nothing;
  end loop;

  raise notice 'Merge concluído: % grupo(s), % cópia(s) juntada(s) e ocultada(s).',
    n_grupos, n_copias;
end $$;

-- Recarrega o cache de schema do PostgREST (padrão do projeto).
notify pgrst, 'reload schema';

commit;

-- =============================================================
-- CONFERIR DEPOIS (rode separado):
--   -- O que foi juntado nesta rodada:
--   select canonical_id, duplicate_id, duplicate_nome, merged_at
--     from public.experiences_merge_log order by merged_at desc;
--
--   -- Uma experiência principal com suas datas (troque o id):
--   select data, horario, vagas_total, vagas_restantes
--     from public.experience_slots
--    where experience_id = '<manter_id>' order by event_at;
--
-- DESFAZER um grupo (se precisar): reative as cópias e, se quiser,
-- devolva os slots — me chame que eu monto o rollback do caso.
--   update public.experiences set is_active = true where id = '<duplicate_id>';
-- =============================================================
