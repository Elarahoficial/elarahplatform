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

## Fase 2 — a tela de Conversas

Aba **Conversas** no admin, no formato que todo mundo já sabe usar: lista à
esquerda, o fio da conversa à direita, campo de resposta embaixo.

| Parte | De onde vem |
| --- | --- |
| Bolhas da esquerda (recebidas) | `whatsapp_mensagens` |
| Bolhas da direita (enviadas) | `whatsapp_send_log` |
| Lista de conversas | view `whatsapp_conversas` |

**Tempo real:** uma inscrição no Realtime do Supabase em
`whatsapp_mensagens`. Mensagem que chega aparece na hora — se for da conversa
aberta, entra no fio; se for de outra, sobe na lista com o contador.

**Quem é a pessoa:** ao abrir a conversa, o telefone é cruzado com `bookings`
e as últimas reservas aparecem no cabeçalho. É o que um CRM tem e o WhatsApp
não: abrir a conversa e já saber o que ela comprou.

### O que precisou mudar no banco

`whatsapp_send_log` guardava o telefone **mascarado** e **não guardava o
texto**. Foi uma decisão consciente lá atrás (não vazar número em log), mas
ela impede exatamente isto: sem número inteiro não dá pra saber a qual
conversa a mensagem pertence, e sem texto não há o que mostrar.

`sql/elarah_whatsapp_conversas.sql` adiciona `telefone` e `corpo`, com limite:
as colunas só são legíveis por admin (RLS), e `phone_masked` continua lá pra
quem só quer auditar.

Mensagens com status `pending` não viram bolha — mostrar como enviada o que
ainda não saiu seria mentir pra quem lê. As que **falharam** aparecem com o
aviso e o motivo.

### Fase 3 — responder (já incluída)

A função `admin-whatsapp-responder` manda a resposta pela API oficial, pelo
mesmo portão das outras mensagens (kill switch, ambiente, registro).

**A regra das 24 horas molda tudo:** a Meta só entrega texto livre dentro de
24h da última mensagem **da pessoa**. Fora dela, só template aprovado, e a
recusa vem como erro `131047` — que sem contexto não diz nada.

Por isso a conta mora num lugar só, `janelaDe24hAberta` em
`_shared/whatsapp_inbox.ts`, usada pelos dois lados: a função confere **antes**
de tentar, e a tela mostra quanto falta antes de deixar escrever. Duas cópias
divergiriam, e o sintoma seria a mensagem sumir sem explicação.

Quem nunca escreveu tem a janela **fechada** — conversa iniciada pela Elarah
sempre precisa de template.

### O que ainda não existe

- **Mídia.** O `media_id` é guardado, mas baixar a foto/áudio da Meta (que
  exige uma chamada com o token) ainda não foi feito. Na bolha aparece o tipo
  do arquivo.
- **Responder com template** quando a janela fechou.

## Peças no código

- `sql/elarah_whatsapp_inbox.sql` — as duas tabelas, índices e RLS (só admin lê).
- `sql/elarah_whatsapp_conversas.sql` — o lado enviado, o tempo real e a view
  `whatsapp_conversas`.
- `admin-conversas.js` + o painel `panel-conversas` no `admin.html` — a tela.
- `supabase/functions/admin-whatsapp-responder/index.ts` — a resposta.
- `supabase/functions/whatsapp-webhook/index.ts` — o handler (handshake,
  assinatura, gravação).
- `supabase/functions/_shared/whatsapp_inbox.ts` — as partes puras: assinatura
  e leitura do payload.
- `supabase/functions/_shared/whatsapp_inbox.test.mjs` — 43 verificações.
  Rode com `node supabase/functions/_shared/whatsapp_inbox.test.mjs`.
- `supabase/config.toml` — `verify_jwt = false` (a Meta não manda JWT do
  Supabase).
