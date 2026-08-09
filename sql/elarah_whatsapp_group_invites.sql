-- =========================================================
-- ELARAH — Log do convite do grupo (por telefone)
-- =========================================================
-- Fonte única da verdade do "quem já recebeu o convite do grupo",
-- por TELEFONE — assim vale tanto pra usuários cadastrados (profiles)
-- quanto pros interessados do formulário (byelarah_submissions), sem
-- depender do marcador "verde" do envio manual (que marca ao abrir, não
-- ao entregar).
--
-- Rode UMA vez no SQL Editor do Supabase. É idempotente.
-- =========================================================

create table if not exists public.whatsapp_group_invites (
  phone       text primary key,          -- 55DDNXXXXXXXX (normalizado)
  nome        text,
  sent_at     timestamptz not null default now()
);

alter table public.whatsapp_group_invites enable row level security;

drop policy if exists whatsapp_group_invites_admin_read on public.whatsapp_group_invites;
create policy whatsapp_group_invites_admin_read on public.whatsapp_group_invites
  for select using (public.is_admin());

notify pgrst, 'reload schema';
