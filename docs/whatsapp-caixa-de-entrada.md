# Caixa de entrada do WhatsApp oficial — fase 1: parar de perder

## O problema

Quando o número da Elarah migrou pra **Cloud API**, ele saiu do app do
WhatsApp. Numa conta Cloud API, mensagem que **chega** é entregue só num
**webhook** — não existe caixa de entrada nativa, e a Caixa de Entrada do Meta
Business Suite não atende número que está na API.

Sem webhook configurado, a Meta **descarta**. A resposta da cliente não fica
guardada nem lá nem aqui. Foi o que aconteceu desde a migração: centenas de
mensagens saíram por semana e nenhuma resposta foi guardada.

Isso não é recuperável pro passado. A partir da instalação abaixo, para.

## O que a fase 1 entrega

Duas tabelas e uma função. Sem tela ainda — a tela é a fase 2, e com os dados
já salvos ela vira só leitura.

| Tabela | O que guarda |
| --- | --- |
| `whatsapp_mensagens` | O que **chega**: texto, mídia, resposta citando mensagem nossa, nome do perfil de quem escreveu |
| `whatsapp_status_envio` | O que acontece com o que a gente **manda**: `sent` → `delivered` → `read`, ou `failed` com código e motivo |

A segunda responde a pergunta que já custou horas — *"será que chegou?"*. Ela
casa com `whatsapp_send_log.provider_id`, que guarda o mesmo `wa_message_id`
devolvido pela Meta no envio. E é onde aparecem, por escrito, os erros que
antes só dava pra adivinhar: template que não existe, mensagem fora da janela
de 24h, token expirado.

## Instalação

**1. Rodar o SQL**

`sql/elarah_whatsapp_inbox.sql` no SQL Editor do Supabase. Idempotente.

**2. Pegar a Chave Secreta do App na Meta**

Painel de Apps da Meta → seu app → **Configurações → Básico** → campo **Chave
Secreta do App** → *Mostrar*. É o segredo com que a Meta assina cada entrega.

**3. Inventar um token de verificação**

Qualquer texto aleatório, só seu. Serve uma vez, no handshake, pra Meta provar
que a URL é sua. Ex.: `elarah-webhook-2026-xK9mQ2`.

**4. Cadastrar os dois segredos no Supabase**

Supabase → Edge Functions → **Secrets**:

```
META_APP_SECRET            = (a chave secreta do app)
META_WEBHOOK_VERIFY_TOKEN  = (o texto que você inventou)
```

**5. Merge**

O Action `deploy-edge-functions` publica a função sozinho.

**6. Apontar o webhook na Meta**

Painel de Apps → **WhatsApp → Configuração** → seção **Webhook** → *Editar*:

```
URL de callback:        https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/whatsapp-webhook
Token de verificação:   (o mesmo do passo 3)
```

*Verificar e salvar*. Se der erro, é porque os segredos não foram salvos ou a
função ainda não foi publicada.

Depois, em **Campos do webhook**, assine **`messages`** — esse campo cobre as
duas coisas: mensagens recebidas **e** status de entrega.

**7. Testar**

Mande uma mensagem do seu celular pessoal pro número da Elarah e rode:

```sql
select wa_timestamp, telefone, nome_perfil, tipo, texto
  from whatsapp_mensagens
 order by wa_timestamp desc
 limit 10;
```

## Se o teste do painel da Meta chega mas mensagem de verdade não

Foi o que aconteceu na instalação. O botão **Teste** do painel de Webhooks
conversa **direto** com a URL, então ele prova que URL, assinatura e banco
estão certos — e mesmo assim mensagem real não chega.

Configurar webhook na Meta são **duas** coisas, e a interface não deixa claro:

1. O **app** tem uma URL de callback e assina o campo `messages`.
2. A **conta do WhatsApp (WABA)** precisa estar **inscrita nesse app**.

Faltando a 2, o silêncio é total: nenhuma entrega, nenhum erro, nada no log.
Isso é `subscribed_apps` na Graph API, e não tem botão pra isso em todo
layout do painel.

A função `admin-whatsapp-inscricao` resolve:

```bash
# Diagnóstico — quais apps a conta entrega hoje (não muda nada):
curl -s "https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/admin-whatsapp-inscricao" \
  -H "Authorization: Bearer <CRON_SECRET>"

# Correção — inscreve este app na conta (idempotente):
curl -s -X POST "https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/admin-whatsapp-inscricao" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

`apps_inscritos` vazio explica o silêncio. Se vier um app **diferente** do que
você configurou, as mensagens estão indo pra ele.

## Segurança

Toda entrega da Meta vem assinada em `X-Hub-Signature-256`:
`sha256=HMAC_SHA256(META_APP_SECRET, corpo cru)`.

- A assinatura é conferida **antes de qualquer parse**, sobre os **bytes
  crus** — re-serializar o JSON muda o corpo e quebra a conferência.
- A comparação é em **tempo constante**. Um `===` comum vaza, pelo tempo de
  resposta, quantos caracteres do começo bateram.
- **Sem `META_APP_SECRET` configurado, a função recusa tudo.** Melhor não
  gravar nada do que aceitar mensagem forjada por quem descobrir a URL.

## Por que responde 200 mesmo quando dá erro por dentro

A Meta reenvia o evento enquanto não recebe `200`, e **desativa o webhook**
depois de muitas falhas seguidas — aí volta-se a perder mensagem. Então:

- assinatura inválida → `401` (não é a Meta chamando);
- qualquer tropeço nosso depois disso → `200` + log.

O reenvio é seguro porque `wa_message_id` é **UNIQUE**: gravar duas vezes não
duplica a conversa.

## Um webhook por número

A Meta aceita **uma** URL de callback por app. Se um dia você ligar uma
ferramenta pronta (Kommo, Chatwoot, Respond.io) no mesmo número, ela toma esse
lugar e a nossa função para de receber. Não dá pra ter as duas sem alguém no
meio reencaminhando.

## O que ainda não existe (fases 2 e 3)

- **Fase 2 — a tela.** Painel "Conversas" no admin: lista, histórico,
  não-lidas, e quem é a pessoa (cruzando o telefone com reservas e parceiros).
  O download da mídia (`media_id` → arquivo) entra aqui.
- **Fase 3 — responder.** Caixa de resposta que envia pela API. Regra da Meta
  que molda tudo: texto livre só **dentro de 24h** da última mensagem da
  pessoa; fora disso, só template aprovado.

## Peças no código

- `sql/elarah_whatsapp_inbox.sql` — as duas tabelas, índices e RLS (só admin lê).
- `supabase/functions/whatsapp-webhook/index.ts` — o handler (handshake,
  assinatura, gravação).
- `supabase/functions/_shared/whatsapp_inbox.ts` — as partes puras: assinatura
  e leitura do payload.
- `supabase/functions/_shared/whatsapp_inbox.test.mjs` — 43 verificações.
  Rode com `node supabase/functions/_shared/whatsapp_inbox.test.mjs`.
- `supabase/config.toml` — `verify_jwt = false` (a Meta não manda JWT do
  Supabase).
