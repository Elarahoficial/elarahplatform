# Agente "Onde estamos pecando" (Diagnóstico IA) — AUTÔNOMO

Primeiro agente da Elarah. Roda **sozinho todo dia** e, por padrão,
**sem custo nenhum**: lê os dados reais do site e das vendas (que já estão
no Supabase), gera um **diagnóstico** e:

- **grava** o resultado no banco → o painel admin mostra o último sozinho,
  sem ninguém clicar;
- **manda o resumo por e-mail** pros admins, todo dia de manhã.

Sem botão, sem conversa. Você só lê.

## Dois modos

| Modo | Custo | O que é |
|---|---|---|
| **`rules`** (padrão) | **ZERO** | Diagnóstico calculado por regras no próprio Supabase. Não usa IA, não precisa de crédito na Anthropic. |
| **`ai`** (opcional) | ~US$1–4/mês | Usa a Claude pra um diagnóstico em linguagem natural, mais "esperto". Precisa de `ANTHROPIC_API_KEY` + crédito. |

A versão `rules` já te diz onde o funil perde gente, o que vende e o que não,
tendência vs. período anterior, experiências muito vistas que vendem pouco,
erros de checkout etc. A `ai` conecta os pontos com mais nuance.

> **Observador, não operador.** Em qualquer modo ele NÃO mexe no site, nas
> vendas ou nas campanhas — só LÊ os dados e ESCREVE o próprio diagnóstico.

## Como funciona

```
[cron diário, 08h BRT]
   ↓ POST /functions/v1/analytics-insights  (service_role via pg_net)
[analytics-insights]  (Edge Function, Deno)
   1. lê analytics_events + bookings → métricas (atual vs anterior)
   2. diagnóstico:  rules (grátis)  ou  ai (Claude, pago)
   3. grava em analytics_insights_runs
   4. envia o digest por e-mail (Resend)
        ↓
   [admin.html → aba "Diagnóstico IA"]  mostra o último, sozinho
```

Arquivos:
- `supabase/functions/analytics-insights/index.ts` — a Edge Function (regras + IA).
- `supabase/functions/_shared/email.ts` — template do e-mail diário.
- `admin-insights.js` + aba **Diagnóstico IA** em `admin.html` — o painel.
- `sql/elarah_analytics_insights.sql` — tabela do log.
- `sql/elarah_analytics_insights_cron.sql` — o agendamento diário.

## Ligar a versão GRÁTIS (sem custo)

### 1. Banco (SQL Editor do Supabase, nesta ordem)

```sql
\i sql/elarah_analytics_insights.sql          -- tabela do log
\i sql/elarah_analytics_insights_cron.sql     -- agendamento (pg_cron + pg_net ON)
```

O cron reusa o segredo `elarah_service_role_key` do Vault (o mesmo dos jobs de
redes sociais). Se ainda não tiver salvo, o cabeçalho do arquivo de cron explica.

### 2. E-mail (opcional, mas recomendado)

`RESEND_API_KEY` já está no projeto. Pra escolher quem recebe:

```bash
supabase secrets set ADMIN_NOTIFY_EMAILS="maria@elarah.com.br"
```

### 3. Deploy

```bash
supabase functions deploy analytics-insights
```

Pronto — **sem nenhum crédito na Anthropic**. Roda todo dia às 08h (BRT),
grava e manda o e-mail. Quem abre a aba vê sempre o último.

## Ligar a versão com IA (depois, se quiser)

1. Cadastre o crédito/chave: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
2. No `sql/elarah_analytics_insights_cron.sql`, troque o body do cron pra
   `'{"trigger":"cron","mode":"ai","period_days":30}'` e re-rode a migration.

Custo aproximado: Opus ~US$3–4/mês · Sonnet ~US$2 · Haiku ~US$1
(troca via secret `ANTHROPIC_MODEL`).

## Frequência

Re-rode `sql/elarah_analytics_insights_cron.sql` com outro cron. Exemplos:
- `0 11 * * *` — 1x/dia, 08h BRT (default).
- `0 11,23 * * *` — 2x/dia (08h e 20h BRT).

## Botão "Atualizar agora"

Na aba tem um botão pra gerar um diagnóstico fora do horário (usa o modo
`rules`, grátis, e não manda e-mail). O automático segue rodando independente.

## Próximos passos possíveis

- Disparo de e-mail de follow-up pra todos os usuários da Elarah.
- Diagnóstico incluir também o perfil do Instagram (já há integração).
- Agentes de WhatsApp / e-mail / reuniões (precisam de API externa).
