-- =============================================================
-- ELARAH — ROLLBACK (desfaz o merge + a limpeza de nome)
-- -------------------------------------------------------------
-- Restaura tudo ao estado ANTES do merge, usando o backup criado
-- por elarah_snapshot_pre_merge.sql (schema backup_premerge).
--
-- Desfaz:
--   • Experiências ocultadas voltam a aparecer (is_active).
--   • Nomes voltam ao original (desfaz elarah_limpa_data_do_nome).
--   • Slots voltam pros donos originais; slots criados pelo merge
--     (materializados) são removidos.
--   • Reservas, avaliações, cupons, vendas manuais e despesas voltam
--     a apontar pra experiência original.
--
-- PRÉ-REQUISITO: o schema backup_premerge tem que existir (ou seja,
--   você rodou o snapshot antes do merge). Se não existir, este
--   script avisa e não faz nada.
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

do $$
begin
  if to_regclass('backup_premerge.experiences') is null then
    raise exception 'backup_premerge.experiences não existe — sem backup não dá pra reverter automaticamente. Me chame.';
  end if;

  -- 1. Experiências: reexibe (is_active) e restaura o nome original.
  update public.experiences e
     set is_active = b.is_active,
         nome      = b.nome
    from backup_premerge.experiences b
   where e.id = b.id;

  -- 2. Slots — reconstitui a tabela EXATAMENTE como no backup.
  if to_regclass('backup_premerge.experience_slots') is not null then
    --   2a. remove slots que o merge criou (não existiam no backup)
    delete from public.experience_slots s
     where not exists (
       select 1 from backup_premerge.experience_slots b where b.id = s.id
     );
    --   2b. recria os slots que o merge apagou (estão no backup mas
    --       sumiram do banco — ex.: data repetida entre cópias). Sem
    --       isso, reservas que apontavam pra eles quebram a FK.
    insert into public.experience_slots
    select b.* from backup_premerge.experience_slots b
     where not exists (
       select 1 from public.experience_slots s where s.id = b.id
     );
    --   2c. devolve cada slot sobrevivente ao dono original
    update public.experience_slots s
       set experience_id = b.experience_id
      from backup_premerge.experience_slots b
     where s.id = b.id
       and s.experience_id is distinct from b.experience_id;
  end if;

  -- 3. Reservas: restaura vínculo com experiência e slot.
  if to_regclass('backup_premerge.bookings') is not null then
    update public.bookings bk
       set experiencia_id = b.experiencia_id,
           slot_id        = b.slot_id
      from backup_premerge.bookings b
     where bk.id = b.id;
  end if;

  -- 4. Avaliações.
  if to_regclass('backup_premerge.reviews') is not null then
    update public.reviews r
       set experiencia_id = b.experiencia_id
      from backup_premerge.reviews b
     where r.id = b.id;
  end if;

  -- 5. Cupons.
  if to_regclass('backup_premerge.coupons') is not null then
    update public.coupons c
       set experience_id = b.experience_id
      from backup_premerge.coupons b
     where c.id = b.id;
  end if;

  -- 6. Vendas manuais.
  if to_regclass('backup_premerge.manual_sales') is not null then
    update public.manual_sales m
       set experience_id = b.experience_id
      from backup_premerge.manual_sales b
     where m.id = b.id;
  end if;

  -- 7. Despesas.
  if to_regclass('backup_premerge.financial_expenses') is not null then
    update public.financial_expenses f
       set experience_id = b.experience_id
      from backup_premerge.financial_expenses b
     where f.id = b.id;
  end if;

  raise notice 'Rollback concluído: experiências, slots, reservas e vínculos restaurados do backup.';
end $$;

notify pgrst, 'reload schema';

-- Depois de conferir que voltou tudo ao normal, os logs do merge
-- podem ser limpos (opcional):
--   truncate public.experiences_merge_log;
--   truncate public.experiences_name_cleanup_log;
