# Elarah Mental Health — plataforma corporativa (NR-1)

Frente B2B da Elarah: programas de saúde mental para empresas, com
cronogramas (pontual, semestral ou anual) de experiências manuais.

## Onde fica

| O quê | Arquivo |
|---|---|
| Seletor "Elarah / Elarah Mental Health" (embaixo de "Painel Admin") | `admin-switcher.js` (carregado em `admin.html` e `admin-mh.html`) |
| Painel corporativo | `admin-mh.html` + `admin-mh.js` + `admin-mh.css` |
| Conteúdo (atividades, programa anual, datas pro RH, mensagens, captação) | `admin-mh-data.js` |
| Landing page para as empresas | `saude-mental-empresas.html` |
| Banco | `sql/elarah_mental_health.sql` |
| Agente das 100 empresas por semana | `supabase/functions/mh-empresas-finder` + `sql/elarah_mental_health_finder_cron.sql` |

## Abas do painel

- **Visão geral** — eventos dos próximos 30 dias, faturamento, funil, meta de prospecção (100/semana), datas pra oferecer ao RH, pedidos do site.
- **O que fazer hoje** — lista montada sozinha: meta de abordagens do dia, follow-ups, pedidos do site, eventos da semana, orçamentos parados, check-ins, janela de venda das datas.
- **Agenda de eventos** — eventos in company / ateliê / online / kit, do orçamento ao realizado.
- **Acompanhamento semanal** — check-in por empresa (termômetro 1–5, adesão, feito, próximo passo, 🚩 alerta).
- **Cronogramas** — gera o plano pontual/semestral/anual em 1 minuto, com estimativa de investimento; copia texto, imprime em PDF, salva.
- **Pedidos do site** — leads da landing page.
- **Ideias & programa anual** — "12 meses de cuidado" + biblioteca de 24 experiências com o fator de risco psicossocial que cada uma trabalha.
- **Datas para o RH** — calendário corporativo (campanhas de saúde, profissões, datas de presentear com gift card) com pitch pronto.
- **Prospecção** — empresas com telefone, WhatsApp, e-mails sugeridos, busca do RH no LinkedIn e mensagens prontas (e-mail, LinkedIn, WhatsApp, roteiro de ligação).
- **Captação** — ações de marketing/parcerias e posts prontos.

## Para ligar (uma vez)

1. **SQL Editor do Supabase** → rodar `sql/elarah_mental_health.sql`.
   Até rodar, o painel funciona em "modo rascunho" (salva só no navegador) e avisa no topo.
2. **Edge Function** `mh-empresas-finder` é publicada sozinha pelo GitHub Action
   quando entra na branch principal. Usa os secrets já existentes
   `GOOGLE_PLACES_API_KEY` e `CRON_SECRET`.
3. **Agendamento semanal**: rodar `sql/elarah_mental_health_finder_cron.sql`
   trocando `TROQUE_PELA_SUA_CRON_SECRET`.
4. **Equipe com acesso restrito**: marcar "Elarah Mental Health" no editor de
   acesso da aba Usuários. Quem tem acesso total já entra.

## Observações

- O Google Maps traz nome, telefone, site e endereço. **E-mail e LinkedIn do RH
  não vêm do Google**: o painel sugere `rh@`, `pessoas@`, `contato@` pelo domínio
  (marcados com "?") e abre a busca do RH no LinkedIn. Confirme antes de enviar.
- A landing deixa claro que as experiências **complementam** a avaliação de
  riscos do SESMT e não substituem acompanhamento psicológico.
- O post "Kintsugi e o seu time" em Captação tem um trecho entre colchetes pra
  trocar por um caso real antes de publicar.
