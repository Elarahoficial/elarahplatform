-- =============================================================
-- ELARAH — Correção de telefones B2B (16/06/2026)
-- -------------------------------------------------------------
-- Varredura de verificação (só fonte OFICIAL — site da própria
-- empresa) revelou que vários telefones adicionados no
-- enriquecimento de jun/2026 vinham de diretórios de terceiros
-- (econodata, casadosdados, RocketReach, ZoomInfo...) e NÃO
-- existem quando discados. Este script limpa/corrige esses casos.
--
-- Veredito da verificação:
--   F/Malta      (11) 4564-5494 → NÃO CONFIRMÁVEL  → remover
--   EAÍ?!        (11) 99363-9180 → NÃO CONFIRMÁVEL → remover
--   Suno         (11) 4637-0518 → NÃO CONFIRMÁVEL  → remover
--   Twist        (11) 3060-2626 → NÃO CONFIRMÁVEL  → remover
--   Tech & Soul  (11) 3477-1993 → ERRADO; oficial é (11) 3031-3131
--   Oz           (11) 3024-2670 → CONFERE (mantém)
--   Bijari       (11) 3814-0815 / 99319-3106 → CONFERE (mantém)
--
-- As remoções são GUARDADAS pelo valor exato do número errado:
-- se você já corrigiu manualmente, este script não mexe.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar (a nota de
-- correção só é anexada uma vez, via marcador "[correção tel 16/06]").
-- Rode no Supabase (SQL Editor) com um usuário admin.
-- =============================================================

-- Remove telefones não confirmáveis (só se ainda estiverem com o nº errado)
update public.b2b_prospects set
  contato_whatsapp = null,
  updated_at = now(),
  observacoes = case when observacoes like '%[correção tel 16/06]%' then observacoes
    else observacoes || E'\n\n[correção tel 16/06] Telefone removido: não consta em fonte oficial e não existe ao discar. Abrir por LinkedIn / e-mail.' end
where lower(nome) = lower('F/Malta') and contato_whatsapp = '+55 11 4564-5494';

update public.b2b_prospects set
  contato_whatsapp = null,
  updated_at = now(),
  observacoes = case when observacoes like '%[correção tel 16/06]%' then observacoes
    else observacoes || E'\n\n[correção tel 16/06] Telefone removido: não consta em fonte oficial e não existe ao discar. Abrir por LinkedIn / e-mail.' end
where lower(nome) = lower('EAÍ?! Content Experience') and contato_whatsapp = '+55 11 99363-9180';

update public.b2b_prospects set
  contato_whatsapp = null,
  updated_at = now(),
  observacoes = case when observacoes like '%[correção tel 16/06]%' then observacoes
    else observacoes || E'\n\n[correção tel 16/06] Telefone removido: não consta em fonte oficial e não existe ao discar. Abrir por LinkedIn / e-mail.' end
where lower(nome) = lower('Suno United Creators') and contato_whatsapp = '+55 11 4637-0518';

update public.b2b_prospects set
  contato_whatsapp = null,
  updated_at = now(),
  observacoes = case when observacoes like '%[correção tel 16/06]%' then observacoes
    else observacoes || E'\n\n[correção tel 16/06] Telefone removido: não consta em fonte oficial e não existe ao discar. Abrir por LinkedIn / e-mail.' end
where lower(nome) = lower('Twist (twist®)') and contato_whatsapp = '+55 11 3060-2626';

-- Corrige o número errado da Tech & Soul pelo oficial do site
update public.b2b_prospects set
  contato_whatsapp = '+55 11 3031-3131',
  updated_at = now(),
  observacoes = case when observacoes like '%[correção tel 16/06]%' then observacoes
    else observacoes || E'\n\n[correção tel 16/06] Telefone corrigido para (11) 3031-3131 (confirmado no site oficial techandsoul.com.br/contato). O anterior (3477-1993) estava errado.' end
where lower(nome) = lower('Tech & Soul') and contato_whatsapp = '+55 11 3477-1993';
