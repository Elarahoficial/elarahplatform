-- =============================================================
-- ELARAH — Gastos financeiros (despesas operacionais)
-- -------------------------------------------------------------
-- Tabela de gastos vinculados ou não a uma experiência/fornecedor.
-- Comprovante (foto/print) é armazenado no bucket privado
-- 'financial-attachments' e referenciado via attachment_path.
--
-- ocr_raw é placeholder pra integração futura com Vision/Document AI:
-- a UI já permite upload do comprovante e o usuário preenche manual;
-- quando o OCR for ativado, o serviço grava aqui o JSON bruto da
-- leitura sem alterar nada do fluxo atual.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: experiences, financial_categories, public.is_admin(),
--             public.set_updated_at().
-- =============================================================

create table if not exists public.financial_expenses (
  id                uuid primary key default gen_random_uuid(),

  description       text not null,
  amount_centavos   integer not null check (amount_centavos >= 0),
  expense_date      date not null default current_date,

  category_id       uuid references public.financial_categories(id) on delete set null,
  experience_id     uuid references public.experiences(id) on delete set null,

  -- Fornecedor: snapshot textual + chave normalizada (mesmo padrão de
  -- bookings.fornecedor_nome). Não usa FK porque a "tabela canônica"
  -- de fornecedor é fornecedores_metadata, que é por chave textual.
  supplier_key      text,
  supplier_name     text,

  payment_method    text check (payment_method is null or payment_method in
                      ('pix','cartao','dinheiro','transferencia','boleto','infinitypay','outro')),
  status            text not null default 'pago'
                    check (status in ('pago','pendente','reembolsado','cancelado')),

  notes             text,
  attachment_path   text,                              -- caminho no bucket privado
  ocr_raw           jsonb,                             -- placeholder pra OCR futuro

  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists financial_expenses_date_idx
  on public.financial_expenses (expense_date desc);
create index if not exists financial_expenses_experience_idx
  on public.financial_expenses (experience_id);
create index if not exists financial_expenses_supplier_idx
  on public.financial_expenses (supplier_key);
create index if not exists financial_expenses_status_idx
  on public.financial_expenses (status);
create index if not exists financial_expenses_category_idx
  on public.financial_expenses (category_id);

drop trigger if exists trg_financial_expenses_updated_at on public.financial_expenses;
create trigger trg_financial_expenses_updated_at
  before update on public.financial_expenses
  for each row execute function public.set_updated_at();

alter table public.financial_expenses enable row level security;

drop policy if exists "financial_expenses_admin_all" on public.financial_expenses;
create policy "financial_expenses_admin_all"
  on public.financial_expenses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
