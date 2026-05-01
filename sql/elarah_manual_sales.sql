-- =============================================================
-- ELARAH — Vendas manuais (fora do site)
-- -------------------------------------------------------------
-- Vendas que acontecem por WhatsApp, Pix direto, transferência,
-- InfinityPay, dinheiro etc. Tabela SEPARADA de bookings (bookings
-- é fonte de verdade do checkout do site, escrita por webhook).
--
-- Aparece visualmente em duas telas:
--   1) Compras — merge visual com bookings, com badge "Venda manual".
--   2) Contabilidade — entra no livro-caixa via view v_financial_ledger.
--
-- Repasse a fornecedor é INLINE (campos payout_*) pra manter simples.
-- Se no futuro precisar histórico de eventos de repasse, criar tabela
-- separada manual_sale_payouts sem alterar esta.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: experiences, public.is_admin(), public.set_updated_at().
-- =============================================================

create table if not exists public.manual_sales (
  id                       uuid primary key default gen_random_uuid(),

  -- Cliente (snapshot — não cria profile)
  customer_name            text not null,
  customer_email           text,
  customer_phone           text,

  -- Experiência
  experience_id            uuid references public.experiences(id) on delete set null,
  experience_name          text,                                  -- snapshot
  slot_date                date,                                  -- data do evento (não da venda)
  slot_time                text,                                  -- ex: "19h00"

  -- Valores (centavos, mesma convenção de bookings)
  quantity                 integer not null default 1 check (quantity > 0),
  unit_price_centavos      integer not null check (unit_price_centavos >= 0),
  total_amount_centavos    integer not null check (total_amount_centavos >= 0),

  -- Pagamento
  payment_method           text check (payment_method is null or payment_method in
                             ('pix','cartao','dinheiro','transferencia','boleto','infinitypay','outro')),
  payment_status           text not null default 'pago'
                           check (payment_status in ('pago','pendente','cancelado','reembolsado')),

  -- Fonte da venda
  sale_source              text check (sale_source is null or sale_source in
                             ('whatsapp','instagram','indicacao','presencial','outro')),

  -- Cupom/desconto (texto livre — não bate em coupons.id)
  coupon_code              text,
  discount_centavos        integer not null default 0 check (discount_centavos >= 0),

  -- Repasse INLINE (mesma semântica de bookings.status_fornecedor)
  supplier_key             text,
  supplier_name            text,
  payout_amount_centavos   integer not null default 0 check (payout_amount_centavos >= 0),
  payout_status            text not null default 'nao_aplicavel'
                           check (payout_status in ('nao_aplicavel','pendente','pago')),
  payout_paid_at           timestamptz,
  payout_attachment_path   text,                                  -- comprovante de repasse

  notes                    text,
  created_by               uuid references auth.users(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists manual_sales_payment_status_idx
  on public.manual_sales (payment_status);
create index if not exists manual_sales_experience_idx
  on public.manual_sales (experience_id);
create index if not exists manual_sales_slot_date_idx
  on public.manual_sales (slot_date);
create index if not exists manual_sales_payout_status_idx
  on public.manual_sales (payout_status);
create index if not exists manual_sales_supplier_idx
  on public.manual_sales (supplier_key);
create index if not exists manual_sales_created_idx
  on public.manual_sales (created_at desc);

drop trigger if exists trg_manual_sales_updated_at on public.manual_sales;
create trigger trg_manual_sales_updated_at
  before update on public.manual_sales
  for each row execute function public.set_updated_at();

alter table public.manual_sales enable row level security;

drop policy if exists "manual_sales_admin_all" on public.manual_sales;
create policy "manual_sales_admin_all"
  on public.manual_sales for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
