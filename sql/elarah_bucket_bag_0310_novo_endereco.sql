-- =============================================================
-- ELARAH — "Crie sua Própria Bolsa - Bucket Bag" 03/10 (10h00–15h00):
-- novo endereço
-- -------------------------------------------------------------
-- Antes:  R. Oscar Freire — Cerqueira César
-- Agora:  Av. Brig. Faria Lima, 4440 — Itaim Bibi
--
-- O endereço da experiência já foi alterado no site (tabela
-- experiences), mas cada reserva guarda uma CÓPIA do endereço em
-- bookings.metadata.endereco / metadata.bairro, gravada no momento da
-- compra. A aba "Compras" da conta da cliente e o e-mail de
-- confirmação (inclusive o "📧 Reenviar confirmação" do painel) leem
-- dessa cópia, então as reservas já feitas continuam com o endereço
-- antigo até este script rodar.
--
-- O script copia o endereço/bairro ATUAIS da experiência para as
-- reservas dessa data e guarda o endereço antigo em
-- metadata.endereco_anterior / bairro_anterior (auditoria). Só roda se
-- a experiência já estiver com "Faria Lima" no endereço — trava contra
-- copiar o endereço antigo por engano.
--
-- Como usar (Supabase → SQL Editor):
--   1. Rode o PASSO 1 e confira a lista (nomes, data, endereço novo).
--   2. Rode o PASSO 2 (update).
--   3. No painel admin → Reservas, clique "📧 Reenviar confirmação" em
--      cada reserva listada: o e-mail já sai com o endereço novo.
--   4. Rode o PASSO 3: cada linha traz o link de WhatsApp da cliente
--      com a mensagem já preenchida — é só abrir e enviar.
--
-- IDEMPOTENTE — rodar de novo não muda nada (só atualiza quem ainda
-- está com endereço diferente do da experiência).
-- Vendas manuais (manual_sales) não precisam do PASSO 2: o e-mail
-- delas já lê o endereço direto da experiência.
-- =============================================================

-- PASSO 1 — conferência (não altera nada)
select b.id, b.nome, b.email, b.telefone, b.data, b.horario, b.status, b.quantidade,
       b.metadata->>'endereco' as endereco_na_reserva,
       b.metadata->>'bairro'   as bairro_na_reserva,
       e.endereco              as endereco_novo,
       e.bairro                as bairro_novo
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where e.nome ilike '%bucket bag%'
   and b.data ~ '(2026-10-03|03/10)'
   and b.status = 'pago'
 order by b.created_at;

-- PASSO 2 — atualiza o endereço nas reservas
update public.bookings b
   set metadata = coalesce(b.metadata, '{}'::jsonb) || jsonb_build_object(
         'endereco',             e.endereco,
         'bairro',               e.bairro,
         'endereco_anterior',    b.metadata->'endereco',
         'bairro_anterior',      b.metadata->'bairro',
         'endereco_alterado_em', now()
       )
  from public.experiences e
 where e.id = b.experiencia_id
   and e.nome ilike '%bucket bag%'
   and e.endereco ilike '%faria lima%'
   and b.data ~ '(2026-10-03|03/10)'
   and b.status = 'pago'
   and (b.metadata->>'endereco' is distinct from e.endereco
        or b.metadata->>'bairro' is distinct from e.bairro)
returning b.id, b.nome, b.email, b.metadata->>'endereco' as endereco_atual,
          b.metadata->>'bairro' as bairro_atual;

-- PASSO 3 — links de WhatsApp com a mensagem pronta (não altera nada)
-- Abra o link_whatsapp de cada linha: o WhatsApp já abre na conversa da
-- cliente com o texto preenchido (usa api.whatsapp.com/send em vez de
-- wa.me — o wa.me quebra emojis em alguns celulares).
with r as (
  select b.id, b.nome, b.telefone,
         split_part(trim(coalesce(b.nome, '')), ' ', 1) as primeiro_nome,
         regexp_replace(coalesce(b.telefone, ''), '\D', '', 'g') as digitos
    from public.bookings b
    join public.experiences e on e.id = b.experiencia_id
   where e.nome ilike '%bucket bag%'
     and b.data ~ '(2026-10-03|03/10)'
     and b.status = 'pago'
), m as (
  select r.*,
         case when length(digitos) in (10, 11) then '55' || digitos else digitos end as fone,
         'Oi' || case when primeiro_nome <> '' then ', ' || primeiro_nome else '' end || '! Tudo bem? 💛' || E'\n\n' ||
         'Aqui é da Elarah! Passando pra te contar uma novidade sobre o *Crie sua Própria Bolsa – Bucket Bag* deste sábado, 03/10, das 10h às 15h: mudamos o local! ✨' || E'\n\n' ||
         'Encontramos um espaço ainda mais aconchegante, com a carinha da experiência que preparamos pra vocês — achamos que vai ficar tudo ainda mais gostoso por lá.' || E'\n\n' ||
         '📍 *Novo endereço:* Av. Brig. Faria Lima, 4440 – Itaim Bibi, São Paulo' || E'\n' ||
         '(o endereço anterior, na R. Oscar Freire, não vale mais)' || E'\n\n' ||
         'O horário e todo o resto continuam iguaizinhos. O endereço novo já está no site, em *Minha conta → Compras*, e também reenviamos o e-mail de confirmação atualizado.' || E'\n\n' ||
         'Qualquer dúvida, é só chamar aqui. Te esperamos! 🧡' as mensagem
    from r
)
select m.nome, m.telefone, m.mensagem,
       'https://api.whatsapp.com/send?phone=' || m.fone || '&text=' ||
       (select string_agg(
                 case when x.byte between 48 and 57 or x.byte between 65 and 90
                        or x.byte between 97 and 122 or x.byte in (45, 46, 95, 126)
                      then chr(x.byte)
                      else '%' || upper(lpad(to_hex(x.byte), 2, '0'))
                 end, '' order by x.i)
          from (select i, get_byte(convert_to(m.mensagem, 'UTF8'), i) as byte
                  from generate_series(0, octet_length(convert_to(m.mensagem, 'UTF8')) - 1) as i) x
       ) as link_whatsapp
  from m
 order by m.nome;
