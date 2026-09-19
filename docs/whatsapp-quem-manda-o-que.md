# Quem manda o quê no WhatsApp da Elarah

Mapa de responsabilidade. Existem **dois** sistemas mandando WhatsApp pelo
mesmo número, e este documento evita que a cliente receba em dobro.

## Os dois sistemas

### 1. Edge Functions publicadas fora do repositório

Vivem no projeto do Supabase, **não estão no GitHub**. Agendadas no `pg_cron`
(veja `select jobname, schedule, command from cron.job`):

| Agendamento | Frequência | Função |
|---|---|---|
| `elarah-whatsapp-pendente` | a cada 30 min | `whatsapp-pendente` |
| `elarah-whatsapp-lembrete` | diário, 11h | `whatsapp-lembrete` |
| `elarah-whatsapp-feedback` | diário, 15h | `whatsapp-feedback` |

Mandam pela **API oficial da Meta**, com os templates aprovados na conta, e
cobrem **cinco fluxos**: confirmação de compra, boas-vindas, lembrete,
feedback e pagamento pendente. É o que entrega ~293 mensagens por semana.

No mesmo caso (fora do repositório): `auto-newsletter`, `prospect-finder` e
`reviews`.

### 2. Esta plataforma (o repositório)

Manda só o que o outro sistema **não** manda:

- **Aviso à parceira** a cada compra paga (`fornecedor`)
- **Instruções pós-compra** por experiência (`instrucoes`)
- **Aviso "as inscrições abriram"** da lista By Elarah (`byelarah_aviso`)

## A configuração que garante isso

Secret no Supabase:

```
WHATSAPP_FLUXOS_DESLIGADOS = confirmation,reminder48,feedback,pending
```

Com isso, a plataforma nem tenta mandar os fluxos que o outro sistema cobre: a
trava age antes de tudo no portão — não reserva chave de idempotência, não
monta mensagem, não chama provedor.

**Instruções pós-compra e aviso à parceira continuam saindo**, mesmo com
`confirmation` desligado: os três saem do mesmo ponto do código, mas a trava é
por fluxo. Há teste E2E cobrindo exatamente esse cenário.

## Por que isso passou despercebido

O canal antigo (QR code) parou de funcionar quando o número foi para a Cloud
API — um número não pode estar nos dois. A partir daí, **toda** tentativa da
plataforma falhava com `Client-Token not allowed`, e a falha ficava só na
`whatsapp_send_log`. Como o outro sistema seguia entregando, ninguém percebeu:
as clientes recebiam normalmente.

Para conferir o estado a qualquer momento:

- `sql/elarah_whatsapp_por_onde_saiu.sql` — por qual canal cada envio saiu
- `sql/elarah_whatsapp_diagnostico_falhas.sql` — desde quando falha, e quem ficou sem
- `sql/elarah_quem_manda_whatsapp.sql` — procura remetentes dentro do banco

## Dívida conhecida

As seis funções fora do repositório não têm código versionado: ninguém revisa,
e um apagar acidental não tem de onde restaurar. Vale baixá-las
(`supabase functions download <nome>`) e commitar. Enquanto isso não acontece,
qualquer mudança nos fluxos delas precisa ser feita direto no Supabase.
