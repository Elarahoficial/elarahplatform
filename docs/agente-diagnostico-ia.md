# Agente "Onde estamos pecando" (Diagnóstico IA) — AUTÔNOMO

Primeiro agente de IA da Elarah. Roda **sozinho todo dia**: lê os dados reais
do site e das vendas (que já estão no Supabase), gera um **diagnóstico** e:

- **grava** o resultado no banco → o painel admin mostra o último sozinho,
  sem ninguém clicar;
- **manda o resumo por e-mail** pros admins, todo dia de manhã.

Sem botão, sem conversa. Você só lê.

> **O agente é observador, não operador.** Ele NÃO mexe no site, nas vendas,
> nas campanhas — só LÊ os dados e ESCREVE o próprio diagnóstico (no log e no
> e-mail).

## Como funciona (visão geral)

```
[cron diário, 08h BRT]
   ↓ POST /functions/v1/analytics-insights  (service_role via pg_net)
[analytics-insights]  (Edge Function, Deno)
   1. lê public.analytics_events + public.bookings → monta métricas
   2. manda as métricas pra Claude (claude-opus-4-8) → diagnóstico
   3. grava em public.analytics_insights_runs
   4. envia o digest por e-mail (Resend) pros admins
        ↓
   [admin.html → aba "Diagnóstico IA"]  mostra o último gravado, sozinho
```

Arquivos:
- `supabase/functions/analytics-insights/index.ts` — a Edge Function.
- `supabase/functions/_shared/email.ts` — template do e-mail diário.
- `admin-insights.js` + aba **Diagnóstico IA** em `admin.html` — o painel.
- `sql/elarah_analytics_insights.sql` — tabela do log (o painel lê daqui).
- `sql/elarah_analytics_insights_cron.sql` — o agendamento diário.

Não cria nada de dados de negócio novo: usa `analytics_events` e `bookings`
que já existem.

## Passo a passo pra deixar automático

### 1. Secrets (Supabase → Edge Functions → Secrets)

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # chave da Claude
# RESEND_API_KEY já está configurado no projeto (e-mails de venda usam ele).
# Opcional: quem recebe o e-mail diário (default: contato.elarah@gmail.com):
supabase secrets set ADMIN_NOTIFY_EMAILS="maria@elarah.com.br"
# Opcional: trocar o modelo (default claude-opus-4-8):
# supabase secrets set ANTHROPIC_MODEL=claude-opus-4-8
```

Pegue a `ANTHROPIC_API_KEY` em https://console.anthropic.com → API Keys.

### 2. Banco (SQL Editor do Supabase, nesta ordem)

```sql
-- a) tabela do log
\i sql/elarah_analytics_insights.sql
-- b) agendamento diário (precisa pg_cron + pg_net ON em Database → Extensions)
\i sql/elarah_analytics_insights_cron.sql
```

O cron reusa o mesmo segredo `elarah_service_role_key` que os jobs de redes
sociais já usam no Vault. Se ainda não tiver salvo, o cabeçalho do arquivo
`elarah_analytics_insights_cron.sql` explica como salvar (uma vez só).

### 3. Deploy da função

```bash
supabase functions deploy analytics-insights
```

Pronto. A partir daí ele roda **todo dia às 08h (BRT)**, grava o diagnóstico e
manda o e-mail. Quem abrir a aba **Diagnóstico IA** no admin vê sempre o último,
atualizado sozinho.

## Mudar a frequência

É só re-rodar `sql/elarah_analytics_insights_cron.sql` com outro cron. Exemplos:
- `0 11 * * *` — 1x ao dia, 08h BRT (default).
- `0 11,23 * * *` — 2x ao dia (08h e 20h BRT).
- `0 9-21/3 * * *` — de 3 em 3 horas durante o dia.

## Custo

Cada diagnóstico é 1 chamada à Claude com entrada pequena (só o resumo de
métricas, não os dados crus). Centavos por dia. O e-mail vai pelo Resend, que
já está em uso.

## Botão "Atualizar agora" (opcional)

Na aba tem um botão pra antecipar um diagnóstico fora do horário do automático
(não envia e-mail — é só pra olhar na hora). Útil pra checar depois de uma
campanha, por exemplo. O automático segue rodando independente disso.

## Próximos passos possíveis

- Disparo de e-mail de follow-up pra todos os usuários da Elarah.
- Agentes de WhatsApp / e-mail / reuniões (precisam de API externa — ver
  conversa de escopo).
- Entregar o digest diário também por WhatsApp (depois que a API oficial do
  WhatsApp Business estiver conectada).
