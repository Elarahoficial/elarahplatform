-- =============================================================
-- ELARAH — Por onde cada WhatsApp saiu (Z-API ou Meta oficial)
-- -------------------------------------------------------------
-- Só leitura. Responde, sem achismo, duas perguntas:
--   1. A plataforma está mandando mensagem? Quantas, de que tipo?
--   2. Saiu pela Z-API (não oficial) ou pela Cloud API da Meta?
--
-- COMO A GENTE SABE O CANAL
--   Todo envio grava o ID que o provedor devolveu, em provider_id:
--     * Meta oficial → sempre começa com "wamid."
--     * Z-API        → um id curto próprio (messageId / zaapId)
--   Não tem como confundir: é o recibo do próprio provedor.
--
-- Como rodar: Supabase Dashboard → SQL Editor → cola → Run.
-- =============================================================

-- ===== 1. RESUMO: quanto saiu, de que tipo, por qual canal =====
select
  kind                                                   as tipo,
  case
    when provider_id like 'wamid.%' then 'META oficial'
    when provider_id is not null    then 'Z-API (não oficial)'
    else '(sem id — não chegou a enviar)'
  end                                                    as canal,
  status,
  count(*)                                               as envios,
  min(created_at)                                        as primeiro,
  max(created_at)                                        as ultimo
from public.whatsapp_send_log
group by 1, 2, 3
order by ultimo desc nulls last;

-- ===== 2. OS ÚLTIMOS 30 ENVIOS, um por linha =====
select
  created_at,
  kind          as tipo,
  status,
  phone_masked  as telefone,
  case
    when provider_id like 'wamid.%' then 'META oficial'
    when provider_id is not null    then 'Z-API (não oficial)'
    else '—'
  end           as canal,
  provider_id,
  error
from public.whatsapp_send_log
order by created_at desc
limit 30;

-- =============================================================
-- COMO LER
--
--   Linhas com canal "Z-API (não oficial)"  → saiu pelo número
--     conectado por QR code. É o que o código faz hoje.
--   Linhas com canal "META oficial"         → saiu pela Cloud API,
--     usando um template aprovado.
--   Tabela vazia                            → a plataforma não enviou
--     nada por este caminho (nem pela Z-API nem pela Meta).
--
-- OUTRAS FONTES, pra cruzar:
--   * Supabase → Edge Functions → Logs: mostra a chamada HTTP real
--     de cada envio (a URL diz o provedor).
--   * Meta → Gerenciador do WhatsApp → Insights (e "Ver insights" em
--     cada template): mostra o que a META entregou.
--   * Painel da Z-API: mostra o que saiu por lá.
--
-- ATENÇÃO AO TESTAR
--   O botão "testar no meu WhatsApp" do admin da Elarah e o botão
--   "Enviar mensagem" da tela de Configuração da API da Meta são
--   caminhos DIFERENTES. A mensagem chega nos dois casos — receber
--   não prova por onde saiu. Só o provider_id (ou o log) prova.
-- =============================================================
