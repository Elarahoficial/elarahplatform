# Aviso automático "a data saiu" (eventos By Elarah)

Todo evento By Elarah abre primeiro como **lista de espera** ("Data em breve"):
as pessoas deixam nome e WhatsApp no formulário da home e ficam esperando. Antes,
quando a data era publicada, alguém tinha que lembrar de abrir o painel e
disparar o follow-up. Agora, **no momento em que a data é publicada, quem está na
lista daquele evento recebe sozinho** um WhatsApp com a data, o horário, o local
e o link pra garantir a vaga.

Exemplo do que a pessoa recebe:

> Oi, Maria! A data saiu ✨
>
> Você se inscreveu pra ser avisada quando **Oficina de Perfumaria Criativa**
> abrisse — e acabou de entrar no ar.
>
> 🗓️ 24 de abril
> 🕒 10h às 13h ou 14h às 17h
> 📍 Rua Nova Orleans, 34 — Brooklin
>
> ✨ Garanta sua vaga aqui: https://elarah.com.br/…
>
> As vagas são poucas e quem estava na lista está sabendo primeiro 🧡

## O que dispara o aviso

Dois sinais, e **qualquer um deles basta** — o que acontecer primeiro manda:

- **A data foi publicada.** O campo *Data* deixa de ser "Data em breve" e vira
  uma data de verdade (`24 de abril`, `12/10`). Também vale remarcação: mudou
  pra outra data, a lista é avisada da nova.
- **O item saiu da lista de espera.** O *Tipo* vira "Quero participar" ou você
  liga **É comprável** (abre o checkout). Esse sinal não depende de interpretar
  texto nenhum — é o mais confiável dos dois.

Quando o item abre pelo checkout e o campo *Data* ainda está com um texto
qualquer, a data real é buscada na experiência vinculada (`event_at` da
experiência ou do próximo horário com vaga). Se não houver data em lugar
nenhum, a mensagem muda pra **"as inscrições abriram"** — a Elarah nunca
promete uma data que ainda não tem.

E se você fizer tudo em dois saves seguidos (publica a data, depois liga o
checkout), sai **uma mensagem só**: uma onda por item a cada 48h.

## Como funciona

1. No admin, aba **By Elarah**, você edita o item: publica a data, tira da lista
   de espera, ou os dois.
2. Ao salvar, uma **trigger no banco** percebe a virada e enfileira uma "onda de
   avisos" (`byelarah_date_announcements`). A trigger não envia nada — só
   enfileira.
3. A Edge Function **`byelarah-aviso-data`** consome a fila e envia. Ela é
   chamada por dois caminhos:
   - pelo **próprio painel**, logo depois de salvar → o aviso sai em segundos;
   - pelo **cron, a cada 5 minutos** → rede de segurança pra data publicada
     direto no SQL Editor, navegador fechado no meio do envio, lista grande que
     precisa de mais de uma passada.
4. Terminado o envio, o painel mostra quantas pessoas foram avisadas.

Todo envio passa pelo **portão único de WhatsApp** (`gatedSendWhatsApp`) — o
mesmo das confirmações e lembretes: idempotência, kill switch, modo observação,
rollout, allowlist, fail-closed. Ver `docs/whatsapp-seguranca.md`.

**Por qual canal sai:** pela **API oficial da Meta** (Cloud API), usando o
template aprovado `elarah_data_saiu` (ou `elarah_inscricoes_abertas`, quando
abre sem data) — é o que permite avisar a lista inteira
sem risco de o número ser banido. O texto acima é o corpo do template; o que
muda por pessoa são as cinco variáveis (nome, evento, data/horários, local,
link). Como criar o template e ligar as credenciais:
`docs/whatsapp-oficial-meta.md`.

## O que impede um disparo errado

- **Só na virada.** O aviso sai na transição pra "aberto" (data publicada ou
  fora da lista de espera). Reeditar local, horário, preço ou reordenar o item
  depois **não** reenvia.
- **Uma onda por item a cada 48h.** Publicar a data e ligar o checkout em saves
  separados manda uma mensagem, não duas.
- **Uma onda por data.** `UNIQUE (item_id, data_texto)`: a mesma data do mesmo
  item só gera uma onda, pra sempre. Desligar e religar o item não reenvia.
- **Uma mensagem por pessoa.** Dedup por telefone (quem preencheu o formulário
  duas vezes recebe uma vez) e chave de idempotência `bydate:<onda>:<telefone>`
  no `whatsapp_send_log` — painel e cron rodando juntos não duplicam.
- **Lista exata.** Só quem se inscreveu naquele `item_slug`. Nunca "nome
  parecido".
- **Cooldown de 12h.** Quem recebeu qualquer follow-up nas últimas 12h não leva o
  aviso junto (evita duas mensagens no mesmo dia se você acabou de disparar na
  mão).
- **Só data de verdade.** "Data em breve", "a definir", "nova data em breve",
  "próxima turma" continuam sendo lista de espera. A regra é conservadora: na
  dúvida, não avisa (você continua podendo disparar na mão).
- **Validade de 72h.** Onda que não conseguiu sair em 72h é encerrada sem enviar
  — uma data velha nunca vira disparo surpresa quando o envio for religado.
- **Chave por item.** O checkbox **📲 Avisar a lista quando a data for
  publicada** desliga o automático num item específico.

## Peças no código

- `sql/elarah_byelarah_aviso_data.sql` — colunas de controle, fila de ondas,
  regra `byelarah_data_definida()` e a trigger.
- `sql/elarah_byelarah_aviso_data_cron.sql` — agendamento (a cada 5 min).
- `supabase/functions/byelarah-aviso-data/index.ts` — Edge Function que envia.
- `supabase/functions/_shared/whatsapp.ts` — texto da mensagem
  (`byelarahDateAnnouncementWhatsAppText`).
- `admin.html` / `admin.js` — checkbox, campo de link e o disparo imediato ao
  salvar.
- `supabase/functions/_shared/whatsapp_e2e.test.mjs` — fluxo "By Elarah" na
  bateria E2E (lista certa, sem duplicata, cooldown, kill switch).

## Passo a passo pra ligar

1. **Rode o SQL** no Supabase (SQL Editor → cola → Run):
   `sql/elarah_byelarah_aviso_data.sql`.
2. **Deploy da Edge Function**: o workflow `deploy-edge-functions.yml` publica
   `byelarah-aviso-data` sozinho no próximo push (ela autentica por dentro:
   cron secret, service role ou JWT de admin).
3. **Agende o cron**: abra `sql/elarah_byelarah_aviso_data_cron.sql`, troque
   `TROQUE_PELA_SUA_CRON_SECRET` pela sua `CRON_SECRET` e rode.
4. **Aprove os templates `elarah_data_saiu` e `elarah_inscricoes_abertas`** no WhatsApp Manager e cadastre as
   credenciais da Meta nos secrets — passo a passo em
   `docs/whatsapp-oficial-meta.md`. Sem template aprovado, a Meta recusa o
   envio (a onda fica na fila e o erro aparece em `byelarah_date_announcements.erro`).
5. Confira que o envio de WhatsApp está ligado (`WHATSAPP_SENDING_ENABLED`,
   `WHATSAPP_ROLLOUT_PERCENT`) — ver `docs/whatsapp-rollout.md`. Com o envio
   desligado ou em modo observação, as ondas ficam na fila e nada sai.

## Acompanhar

```sql
-- Andamento das ondas
select item_nome, data_texto, status, total_alvo, enviados,
       observados, pulados, erro, created_at, processed_at
  from byelarah_date_announcements
 order by created_at desc limit 20;

-- Quem recebeu o aviso de um evento
select nome, telefone, aviso_data_sent_at
  from byelarah_submissions
 where item_slug = 'perfumaria-criativa'
   and aviso_data_announcement_id is not null;

-- Em modo observação: quem RECEBERIA
select kind, phone_masked, status, created_at
  from whatsapp_send_log
 where kind like '%byelarah_date%'
 order by created_at desc;
```

Cancelar uma onda **antes** de ela sair (só funciona enquanto o envio não
começou — o painel dispara em segundos):

```sql
update byelarah_date_announcements
   set status = 'cancelado'
 where id = '<id>' and status = 'pendente';
```

## Perguntas comuns

**Tirei da lista de espera e ninguém recebeu.** Se outra onda desse mesmo item
saiu nas últimas 48h, a segunda não é enfileirada de propósito (é a trava
anti-mensagem-dupla). Fora isso, vale a mesma checagem abaixo.

**Publiquei a data e ninguém recebeu.** Confira, nessa ordem: (1) o SQL foi
rodado? (a fila existe?); (2) o item tem `slug`?; (3) o texto da data passa na
regra? (`select byelarah_data_definida('sua data');`); (4) o envio de WhatsApp
está ligado? (kill switch / rollout / modo observação); (5) as pessoas da lista
têm telefone válido? — quem não tem entra em `pulados` e precisa de contato
manual.

**Mudei a data de novo (remarcação).** É uma data nova → é uma onda nova → a
lista é avisada de novo, uma vez só, com a data nova.

**Quero avisar sem mexer na data.** Use o disparo manual de sempre (botão
**📱 WhatsApp automático** na lista de respostas do formulário).
