-- =============================================================
-- ELARAH — Auto-fill de fornecedor e repasse em bookings pagas
-- -------------------------------------------------------------
-- Quando um booking é INSERIDO ou ATUALIZADO com status='pago'
-- e os campos financeiros estão vazios, a trigger preenche
-- automaticamente a partir da experiência. Garante que o admin
-- nunca veja uma compra paga sem fornecedor/repasse vinculados.
--
-- Regra fixa da Elarah: fornecedor 70% / comissão Elarah 30%.
-- Não depende de experiences.percentual_repasse — usa 70/30
-- direto na trigger pra evitar variações.
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

-- ===== 1. Padroniza default da coluna percentual_repasse pra 70 =====
-- Mantém a coluna pra compat (admin lê/escreve em outros lugares),
-- mas o default agora reflete a regra real.
alter table public.experiences
  alter column percentual_repasse set default 70.00;

-- Atualiza experiências que ainda estão com o default antigo (90).
-- Se admin já tinha customizado pra outro valor, deixa como está.
update public.experiences
   set percentual_repasse = 70.00
 where percentual_repasse = 90.00;

-- ===== 2. Função que preenche os campos do fornecedor =====
create or replace function public.bookings_autofill_fornecedor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exp record;
  v_profile record;
  v_qty integer;
  v_base_centavos integer;
begin
  -- Só age em bookings pagas.
  if new.status is null or new.status <> 'pago' then
    return new;
  end if;

  -- Só preenche se algo está faltando — não sobrescreve dados existentes.
  if (new.fornecedor_nome is not null and trim(new.fornecedor_nome) <> '')
     and new.valor_repasse_centavos is not null
     and new.valor_comissao_centavos is not null then
    -- Garante status_fornecedor não-nulo (default já cuida em INSERT,
    -- mas defensivo em UPDATE).
    if new.status_fornecedor is null then
      new.status_fornecedor := 'repasse_pendente';
    end if;
    return new;
  end if;

  -- Busca experiência associada (pode ser null em bookings legados).
  if new.experiencia_id is not null then
    select e.id, e.fornecedor_nome, e.valor_cheio_centavos, e.created_by
      into v_exp
      from public.experiences e
     where e.id = new.experiencia_id
     limit 1;
  end if;

  -- Profile do dono da experiência (pra tirar partner_data->>'marca'
  -- ou nome quando experiences.fornecedor_nome estiver vazio).
  if v_exp.created_by is not null then
    select p.id, p.nome, p.partner_data
      into v_profile
      from public.profiles p
     where p.id = v_exp.created_by
     limit 1;
  end if;

  -- fornecedor_nome
  if new.fornecedor_nome is null or trim(new.fornecedor_nome) = '' then
    new.fornecedor_nome := coalesce(
      nullif(trim(v_exp.fornecedor_nome), ''),
      nullif(v_profile.partner_data ->> 'marca', ''),
      nullif(v_profile.nome, ''),
      'Desconhecido'
    );
  end if;

  -- fornecedor_id
  if new.fornecedor_id is null and v_exp.created_by is not null then
    new.fornecedor_id := v_exp.created_by;
  end if;

  -- Quantidade pra cálculo do valor cheio.
  v_qty := greatest(coalesce(new.quantidade, 1), 1);

  -- valor_cheio_centavos: usa o do booking; senão usa o da experiência
  -- × quantidade; senão usa amount_total como base mínima.
  if new.valor_cheio_centavos is null then
    if v_exp.valor_cheio_centavos is not null and v_exp.valor_cheio_centavos > 0 then
      new.valor_cheio_centavos := v_exp.valor_cheio_centavos * v_qty;
    end if;
  end if;

  -- Base de cálculo do repasse: prioriza valor cheio (preço de tabela
  -- do fornecedor); se não houver, cai pro amount_total.
  v_base_centavos := coalesce(new.valor_cheio_centavos, new.amount_total);

  if v_base_centavos is not null and v_base_centavos > 0 then
    if new.valor_repasse_centavos is null then
      new.valor_repasse_centavos := round(v_base_centavos * 0.70);
    end if;
    if new.valor_comissao_centavos is null then
      new.valor_comissao_centavos := round(v_base_centavos * 0.30);
    end if;
  end if;

  -- Garante status_fornecedor sempre presente.
  if new.status_fornecedor is null then
    new.status_fornecedor := 'repasse_pendente';
  end if;

  return new;
end;
$$;

-- ===== 3. Trigger BEFORE INSERT / UPDATE em bookings =====
drop trigger if exists trg_bookings_autofill_fornecedor on public.bookings;
create trigger trg_bookings_autofill_fornecedor
  before insert or update on public.bookings
  for each row execute function public.bookings_autofill_fornecedor();

-- ===== Diagnóstico (opcional) =====
-- Confere que tudo funciona simulando um update:
--   update public.bookings set status = status where id = '<algum-id-pago>';
-- Os campos vazios devem ser preenchidos automaticamente.
