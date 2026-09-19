-- =============================================================
-- ELARAH — Instruções pós-compra por experiência
-- -------------------------------------------------------------
-- PROBLEMA QUE ISSO RESOLVE
--   Algumas experiências exigem uma AÇÃO da cliente logo depois da
--   compra: preencher o cadastro do parceiro, entrar num link, saber
--   em que sala é, levar algum documento. Hoje essa mensagem depende
--   de alguém lembrar de mandar — e quando esquece, a pessoa chega no
--   dia sem estar registrada.
--
--   Agora: o texto fica cadastrado NA EXPERIÊNCIA, e assim que a
--   compra é confirmada (pago), a cliente recebe sozinha um WhatsApp
--   com exatamente o que ela precisa fazer.
--
-- COMO FUNCIONA
--   * Campo vazio  → nada muda: a cliente recebe só a confirmação.
--   * Campo escrito → logo após a confirmação sai uma SEGUNDA mensagem
--     com essas instruções. Uma por reserva (idempotente pelo portão
--     de WhatsApp: chave instrucoes:<booking_id>).
--
--   Vale pra qualquer forma de pagamento (Stripe, Mercado Pago,
--   Pagar.me e a confirmação manual), porque o envio está no mesmo
--   ponto que já manda a confirmação.
--
-- O QUE ESCREVER
--   Texto livre, com quebras de linha. Ex.:
--
--     Pra garantir seu lugar, o parceiro precisa te registrar na aula.
--     Preencha este cadastro: https://exemplo.com/cadastro
--     Leva 2 minutinhos 🧡
--
--   Ou:
--
--     A aula é na sala 1607 (16º andar).
--     Chegue 10 minutos antes — não temos sala de espera.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

alter table public.experiences
  add column if not exists instrucoes_pos_compra text;

comment on column public.experiences.instrucoes_pos_compra is
  'Texto enviado por WhatsApp à cliente logo após a compra ser confirmada (cadastro do parceiro, sala, link, orientações). Vazio = não envia nada.';

notify pgrst, 'reload schema';

-- =============================================================
-- VERIFICAÇÃO
--   -- Quais experiências já têm instrução cadastrada:
--   select nome, instrucoes_pos_compra
--     from experiences
--    where coalesce(btrim(instrucoes_pos_compra), '') <> ''
--    order by nome;
--
--   -- Quem recebeu a mensagem de instruções (auditoria do portão):
--   select phone_masked, status, booking_id, created_at
--     from whatsapp_send_log
--    where kind = 'instrucoes'
--    order by created_at desc;
-- =============================================================
