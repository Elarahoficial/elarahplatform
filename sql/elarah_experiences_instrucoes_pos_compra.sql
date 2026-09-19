-- =============================================================
-- ELARAH — Instruções pós-compra (por PARCEIRO e por EXPERIÊNCIA)
-- -------------------------------------------------------------
-- PROBLEMA QUE ISSO RESOLVE
--   Algumas experiências exigem uma AÇÃO da cliente logo depois da
--   compra: preencher o cadastro do parceiro, entrar num link, saber
--   em que sala é, levar algum documento. Hoje essa mensagem depende
--   de alguém lembrar de mandar — e quando esquece, a pessoa chega no
--   dia sem estar registrada.
--
--   Agora: o texto fica cadastrado, e assim que a compra é confirmada
--   (pago), a cliente recebe sozinha um WhatsApp com exatamente o que
--   ela precisa fazer.
--
-- DOIS LUGARES PRA ESCREVER — o de sempre é o do PARCEIRO
--   * fornecedores_metadata.instrucoes_pos_compra
--       O texto padrão do parceiro. Vale pra TODAS as experiências
--       dele. É aqui que você escreve normalmente: a mensagem quase
--       sempre é a mesma do parceiro, não muda de experiência pra
--       experiência.
--
--   * experiences.instrucoes_pos_compra
--       Exceção. Preenchido, SUBSTITUI o texto do parceiro só naquela
--       experiência (ex.: uma aula que é em outra sala).
--
--   Ordem na hora de enviar:
--       experiência (se escrita) → parceiro (se escrito) → não envia.
--
-- COMO FUNCIONA
--   * Os dois vazios → nada muda: a cliente recebe só a confirmação.
--   * Algum escrito  → logo após a confirmação sai uma SEGUNDA mensagem
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

-- 1) O texto padrão do PARCEIRO (o que você vai usar quase sempre).
alter table public.fornecedores_metadata
  add column if not exists instrucoes_pos_compra text;

comment on column public.fornecedores_metadata.instrucoes_pos_compra is
  'Texto padrão enviado por WhatsApp à cliente logo após a compra ser confirmada, em QUALQUER experiência deste parceiro (cadastro, sala, link). Uma experiência pode sobrescrever em experiences.instrucoes_pos_compra. Vazio = não envia nada.';

-- 2) A exceção POR EXPERIÊNCIA (sobrescreve o texto do parceiro).
alter table public.experiences
  add column if not exists instrucoes_pos_compra text;

comment on column public.experiences.instrucoes_pos_compra is
  'Sobrescreve o texto do parceiro (fornecedores_metadata.instrucoes_pos_compra) só nesta experiência. Vazio = usa o do parceiro.';

notify pgrst, 'reload schema';

-- =============================================================
-- VERIFICAÇÃO
--   -- Parceiros com texto padrão cadastrado:
--   select fornecedor_nome, instrucoes_pos_compra
--     from fornecedores_metadata
--    where coalesce(btrim(instrucoes_pos_compra), '') <> ''
--    order by fornecedor_nome;
--
--   -- Experiências que sobrescrevem o texto do parceiro:
--   select nome, fornecedor_nome, instrucoes_pos_compra
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
