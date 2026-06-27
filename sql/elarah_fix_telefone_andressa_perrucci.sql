-- =============================================================
-- ELARAH — Correção de telefone (27/06/2026)
-- -------------------------------------------------------------
-- Cliente: Andressa Alves de Oliveira Perrucci
-- Cadastrou o número errado na plataforma:
--   ERRADO:   (11) 9724-3615   (faltava 1 dígito — só 8 no local)
--   CORRETO:  (11) 97241-3615  (celular com 9 dígitos)
--
-- O telefone é salvo "como digitado" (apenas trim) tanto em
-- public.profiles.telefone (cadastro) quanto em
-- public.bookings.telefone (reservas). Este script corrige os
-- dois lugares.
--
-- O match do número errado é feito por DÍGITOS (ignora máscara),
-- então funciona independentemente de como ficou formatado:
-- "(11) 9724-3615", "11 9724-3615", "1197243615", etc.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar. Se o número
-- já estiver corrigido, nada é alterado.
-- Rode no Supabase (SQL Editor) com um usuário admin.
-- =============================================================

-- Cadastro do cliente (profiles)
update public.profiles set
  telefone   = '(11) 97241-3615',
  updated_at = now()
where nome ilike '%Andressa%Perrucci%'
  and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') in ('1197243615', '97243615');

-- Reservas eventualmente feitas com o número errado (bookings)
update public.bookings set
  telefone   = '(11) 97241-3615',
  updated_at = now()
where nome ilike '%Andressa%Perrucci%'
  and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') in ('1197243615', '97243615');

-- -------------------------------------------------------------
-- Conferência (opcional): rode pra ver como ficou.
-- -------------------------------------------------------------
-- select 'profiles' as origem, nome, telefone from public.profiles
--   where nome ilike '%Andressa%Perrucci%'
-- union all
-- select 'bookings' as origem, nome, telefone from public.bookings
--   where nome ilike '%Andressa%Perrucci%';
