# Agente "Onde estamos pecando" (Diagnóstico IA)

Primeiro agente de IA da Elarah. Lê os dados reais do site e das vendas
(que já estão no Supabase) e gera um **diagnóstico** no painel admin: onde
o funil perde gente, o que está funcionando e o que mexer.

> **Modo "sempre avisar antes":** o agente é **somente leitura**. Ele gera o
> diagnóstico pra você ler — não altera o painel, não envia e-mail, não muda
> nada sozinho. Quem decide é você.

## Como funciona (visão geral)

```
admin.html  → aba "Diagnóstico IA" → botão "Gerar diagnóstico"
   ↓ POST /functions/v1/analytics-insights  (com o JWT do admin)
[analytics-insights]  (Edge Function, Deno)
   1. confere que quem chamou é admin
   2. lê public.analytics_events + public.bookings → monta métricas
   3. manda as métricas pra Claude (claude-opus-4-8)
   4. devolve o diagnóstico em JSON
admin-insights.js  → renderiza no painel
```

Arquivos:
- `supabase/functions/analytics-insights/index.ts` — a Edge Function.
- `admin-insights.js` — o front que chama e renderiza.
- aba **Diagnóstico IA** em `admin.html`.

Nenhuma tabela nova: ele usa `analytics_events` e `bookings` que já existem.

## O que precisa configurar (1 secret)

A única coisa nova é a chave da Claude. No Supabase:

**Dashboard → Edge Functions → Secrets** (ou via CLI):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Pegue a chave em https://console.anthropic.com → API Keys.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` o Supabase
já injeta sozinho — não precisa mexer.

Opcional: `ANTHROPIC_MODEL` pra trocar o modelo (default `claude-opus-4-8`).

## Deploy

```bash
supabase functions deploy analytics-insights
```

Depois é só abrir o admin, ir na aba **Diagnóstico IA**, escolher o período
e clicar em **Gerar diagnóstico**. Leva de 10 a 40 segundos.

## Custo

Cada diagnóstico é 1 chamada à Claude (entrada pequena — só o resumo de
métricas, não os dados crus). Em centavos por execução. Roda só quando você
clica no botão, então não tem custo passivo.

## Próximos passos possíveis

- Agendar um diagnóstico semanal automático (cron) que te manda por e-mail.
- Agente de disparo de e-mail pra todos os usuários (follow-up).
- Agentes de WhatsApp / e-mail / reuniões (precisam de API externa — ver
  conversa de escopo).
