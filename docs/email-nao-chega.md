# O e-mail não está chegando (nem o de compra) — o que fazer

## O sintoma que você viu

No painel, ao clicar em **📧 Reenviar confirmação**, apareceu:

> Não consegui reenviar a confirmação.
> Motivo: **Edge Function returned a non-2xx status code**

Essa frase **não é a causa** — é a mensagem genérica que a biblioteca do
Supabase mostra quando a Edge Function responde erro. O motivo real vinha no
corpo da resposta, que o painel jogava fora. Isso foi corrigido: agora o alerta
mostra a frase de verdade (ex.: *"A conta do Resend está em MODO TESTE…"*).

## Por que o e-mail de compra também não chega

**Todo** e-mail da plataforma sai pelo mesmo lugar — `_shared/email.ts` → Resend:

| E-mail | Quem dispara |
| --- | --- |
| Confirmação de reserva | `stripe-webhook`, `mp-webhook`, `pagarme-webhook` |
| Reenvio de confirmação | `resend-booking-confirmation` (botão do painel) |
| Gift card | `stripe-webhook`, `mp-webhook` |
| Recuperação de senha | `send-password-recovery` |
| Aviso de venda pra admin | `sendAdminSaleNotification` |
| Mensagem do fornecedor | `send-supplier-customer-message` |

Se o Resend recusa, **nada disso sai**. E — importante — o webhook **não
quebra**: o pagamento é confirmado e a reserva é criada normalmente, então o
único sinal é o log da Edge Function. Por isso "não chegou e-mail nenhum" é o
sintoma esperado quando o Resend está mal configurado.

## As 4 causas possíveis (em ordem de frequência)

1. **Conta do Resend em modo teste** — enquanto **nenhum domínio está
   verificado**, o Resend só entrega no e-mail do dono da conta e responde
   `403 "You can only send testing emails to your own email address"`.
   Você recebe os testes; **cliente nenhum recebe**.
   → Resend → **Domains** → verificar `elarah.com.br` (colar os registros DNS).
2. **`RESEND_API_KEY` ausente** nos Secrets do Supabase.
   → Supabase → Project Settings → Edge Functions → Secrets → redeploy.
3. **Chave inválida/revogada** — Resend responde `401`.
   → Resend → API Keys → gerar outra → atualizar o Secret.
4. **`ELARAH_FROM_EMAIL` com domínio que não está verificado** no Resend.
   → Ajustar o Secret pra um domínio verificado.

## Como descobrir qual é, em 10 segundos

Painel admin → aba **Pós-evento** → bloco **📧 Diagnóstico de e-mail**:

- **🔎 Checar configuração** — não envia nada. Diz se a chave existe, se o
  Resend a aceita, quais domínios estão cadastrados e em que status, e se o
  remetente bate com algum deles. Termina numa frase única com o veredito.
- **✉️ Enviar e-mail de teste** — envia de verdade pro e-mail que você digitar
  e mostra o **erro cru do Resend traduzido**. Se sair pelo remetente sandbox
  (`onboarding@resend.dev`), o painel avisa — é sinal de domínio não verificado.

O detalhamento completo aparece no quadro abaixo dos botões (dá pra copiar).

## Deploy

Pelo terminal:

```
supabase functions deploy admin-email-health
supabase functions deploy resend-booking-confirmation
supabase functions deploy send-supplier-customer-message
supabase functions deploy stripe-webhook
supabase functions deploy mp-webhook
supabase functions deploy pagarme-webhook
```

(As três últimas só pra pegarem o `_shared/email.ts` atualizado — sem isso os
webhooks continuam com o retry inútil e o log velho.)

**Sem terminal:** cole `docs/deploy-sem-terminal/admin-email-health.standalone.ts`
no editor de Edge Functions do Supabase, com o nome exato `admin-email-health`, e
deixe o *Verify JWT* **ligado** (a função confere admin por dentro). O passo a
passo do editor está em `docs/deploy-sem-terminal/COMO-SUBIR-SEM-TERMINAL.md`.

## Onde ver os logs

Supabase → **Edge Functions** → escolha a função → **Logs**. Procure por
`[elarah/email]`:

- `sendEmail() chamado` — a função foi acionada
- `ENVIADO ✓` — o Resend aceitou
- `CONTA RESEND EM MODO TESTE` — causa nº 1 acima
- `RESEND_API_KEY AUSENTE` — causa nº 2
- `Resend rejeitou o envio (tentativa 1)` — vem com o corpo do erro

## Teste automatizado

`node --experimental-strip-types supabase/functions/_shared/email_health.test.mjs`

Cobre as classificações de erro e o diagnóstico da conta com a rede mockada —
nenhuma chamada real ao Resend, nenhum e-mail enviado.
