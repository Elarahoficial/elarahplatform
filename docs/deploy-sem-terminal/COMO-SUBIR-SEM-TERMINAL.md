# Subir a função SEM terminal (pelo site do Supabase)

Sem instalar nada. Só copiar, colar e clicar. ~5 minutos.

---

## Passo 1 — Abrir o editor de funções

1. Entre no **app.supabase.com** e escolha o projeto da Elarah.
2. No menu da esquerda, clique em **Edge Functions** (ícone de raio ⚡).
3. Clique no botão **"Deploy a new function"** (ou "Create a new function") e
   escolha a opção **"Via Editor"** (editor no navegador).
   - Se aparecer direto um editor de código, melhor ainda.

## Passo 2 — Nomear e colar

1. No campo do nome da função, digite **exatamente**:

   ```
   analytics-insights
   ```

   ⚠️ Tem que ser esse nome igualzinho (com o hífen). É ele que o agendamento
   que você já criou vai procurar.

2. No editor de código (o arquivo `index.ts`), **apague tudo o que estiver lá**
   e **cole TODO o conteúdo** do arquivo:

   `docs/deploy-sem-terminal/analytics-insights.standalone.ts`

   (É o arquivo que te mandei junto. Abra ele, selecione tudo — Ctrl+A —,
   copie — Ctrl+C — e cole no editor — Ctrl+V.)

## Passo 3 — Deploy

1. Clique em **"Deploy function"** (ou "Deploy updates").
2. Espere aparecer o ✅ de sucesso. Pronto, a função está no ar.

---

## Passo 4 — Criar a tabela (se ainda não fez)

A função grava o diagnóstico numa tabela. No menu esquerdo → **SQL Editor** →
cole e rode o conteúdo de `sql/elarah_analytics_insights.sql`.

(Pra conferir se já existe, rode `select count(*) from analytics_insights_runs;`
— se voltar um número, já está criada.)

## Passo 5 (opcional) — Escolher quem recebe o e-mail

Por padrão o e-mail diário vai pra `contato.elarah@gmail.com`. Pra mudar:

- Menu esquerdo → **Edge Functions** → **Secrets** (ou Settings → Edge Functions
  → Secrets) → adicione:
  - Nome: `ADMIN_NOTIFY_EMAILS`
  - Valor: `seu-email@exemplo.com`

O `RESEND_API_KEY` (que manda o e-mail) **já está configurado** no projeto —
não precisa mexer.

---

## Testar agora (sem esperar amanhã)

No editor da função (Edge Functions → analytics-insights), procure o botão de
**testar / invoke**. No corpo (body) da requisição, coloque:

```json
{ "trigger": "manual", "send_email": true, "mode": "rules" }
```

e envie. Se tudo estiver certo, o e-mail chega na hora e a resposta vem com
`"ok": true`. 🎉

Deu erro? Me manda o que apareceu que eu te ajudo.
