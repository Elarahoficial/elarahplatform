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
- **Agenda & datas do RH** — eventos in company / ateliê / kit em casa (do orçamento ao realizado), datas fortes pro RH, agenda de captação e o "Hora de oferecer" com pitch pronto.
- **Acompanhamento semanal** — check-in por empresa (termômetro 1–5, adesão, feito, próximo passo, 🚩 alerta).
- **Cronogramas** — gera o plano pontual/semestral/anual em 1 minuto, com estimativa de investimento; copia texto, imprime em PDF, salva.
- **Pedidos do site** — leads da landing page.
- **Ideias & programa anual** — "12 meses de cuidado" + biblioteca de 24 experiências com o fator de risco psicossocial que cada uma trabalha.
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
4. **Equipe e parceiras**: rodar `sql/elarah_mh_equipe.sql` uma vez. Depois, no
   admin da Elarah → **Usuários → Equipe & acessos → + Novo acesso**:
   - **Só Elarah Mental Health** (parceira): entra em `admin-mh.html` e vê só as
     abas marcadas. Não é admin, então o painel e os dados da Elarah ficam
     fechados pelo banco.
   - **Equipe Elarah**: abas do admin da Elarah (marque "Elarah Mental Health"
     pra ver as duas plataformas).
   A senha aparece uma vez na tela (com mensagem pronta pra mandar) e não fica
   salva; "Nova senha" gera outra quando precisar. Tudo passa pela Edge Function
   `admin-equipe`, que só aceita quem tem acesso total.

## Novidades (v2)

- **Landing:** todo botão de orçamento/WhatsApp abre um formulário rápido (nome, WhatsApp, e-mail, empresa, cargo, tamanho do time, encontros/ano). Os dados são salvos em `mh_leads` **antes** de abrir o WhatsApp, com o botão de origem e a campanha (`utm_*`). Rode o SQL de novo para criar as colunas novas.
- **Landing:** seções de Arteterapia, “Monte seu cronograma” (a empresa escolhe quantos encontros), Quem somos e Conheça a Elarah. Encontros podem ser trocados por gift cards Elarah.
- **Fotos do Quem somos:** salve como `assets/mh-fundadora.jpg` e `assets/mh-larissa.jpg` — aparecem sozinhas.
- **O que fazer hoje:** rotina de uma pessoa só (seg a sex, com horário e tempo estimado) + alertas do sistema.
- **Agenda & datas do RH:** uma aba só (antes eram duas iguais), com calendário do ano com bolinhas por dia e opção de lista.
- **Acompanhamento semanal:** placar automático da operação (abordagens, respostas, reuniões, propostas, fechamentos) + histórico de 4 semanas.
- **Cronogramas:** modelos prontos (1, 4, 6 e 12 encontros) e montagem pela quantidade de encontros.
- **Prospecção:** mensagens personalizadas por setor, assinatura Larissa Setzer e botão “↺ Desfazer” para abordagem marcada sem querer. Cliques de teste feitos antes de 29/09/2026 são desfeitos automaticamente na primeira abertura do painel.
- **Pedidos do site:** análise por botão de origem, tamanho do time e encontros.

## Observações

- O Google Maps traz nome, telefone, site e endereço. **E-mail e LinkedIn do RH
  não vêm do Google**: o painel sugere `rh@`, `pessoas@`, `contato@` pelo domínio
  (marcados com "?") e abre a busca do RH no LinkedIn. Confirme antes de enviar.
- A landing deixa claro que as experiências **complementam** a avaliação de
  riscos do SESMT e não substituem acompanhamento psicológico.
