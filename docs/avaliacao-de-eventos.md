# Pedir avaliação de quem fechou evento

A aba **Feedbacks** do painel agora tem dois lados. O menu **“Estou vendo”**,
no topo, troca entre eles:

| Lado | Quem é | Como o pedido sai |
| --- | --- | --- |
| **Experiências (compras do site)** | quem comprou em elarah.com.br (`bookings`) | sozinho: WhatsApp automático + e-mail |
| **Eventos fechados (grupos)** | quem fechou evento de grupo — aniversário, despedida, corporativo (`manual_sales` com `is_event`) | na mão, pelo botão **Pedir no WhatsApp**, e por e-mail no mesmo cron |

Os dois usam o **mesmo link de avaliação** (`avaliar.html`) e a **mesma tabela**
`public.reviews`. Muda só de onde veio: `booking_id` (experiência) ou
`manual_sale_id` (evento). A nota do evento conta como prova social na página
da experiência, igual à da compra normal.

---

## Ligar (duas coisas, uma vez só)

### 1. Rodar o SQL

Supabase → **SQL Editor** → cole e rode `sql/elarah_reviews_eventos.sql`.

Ele cria as colunas `reviews.manual_sale_id`, `reviews.tipo`,
`reviews.evento_tipo` e, em `manual_sales`, `feedback_solicitado_at`,
`feedback_solicitado_by` e `review_request_sent_at`. É idempotente: rodar duas
vezes não faz mal.

Enquanto não rodar, a aba mostra um aviso amarelo dizendo exatamente isso.

### 2. Atualizar a Edge Function `reviews`

Supabase → **Edge Functions** → função **`reviews`** → apague o conteúdo do
`index.ts` e cole o de `docs/deploy-sem-terminal/reviews.standalone.ts` →
**Deploy**.

Mantenha o **Verify JWT desligado** (o envio da nota é público, validado pelo
token do link).

O que mudou nela:

- `mode: "submit"` aceita `sale_id` (evento), além de `booking_id`;
- `mode: "link"` (novo) devolve o link assinado pro painel — só admin logado;
- `mode: "request"` (o cron) também manda o e-mail “como foi seu evento?”.

O token do link é um HMAC com segredo do servidor, por isso o painel **pede** o
link pra função em vez de montar sozinho. Sem esse deploy, os botões da aba
avisam que a função precisa ser atualizada.

---

## No dia a dia

No lado **Eventos**, a tabela **Pedir avaliação** lista os eventos pagos que já
aconteceram há 24h ou mais:

- **💬 Pedir no WhatsApp** — abre a conversa com a mensagem pronta e o link, e
  marca o evento como *pedido enviado*.
- **🔗 Copiar link** — copia o link pra colar onde você quiser. **Não** marca o
  pedido; use o botão do WhatsApp pra isso.
- **↺** — desfaz a marcação, se você mandou sem querer.

Quando a cliente responde, a linha vira *Respondeu ★★★★☆* e a nota entra nos
cards, na distribuição, no ranking por tipo de evento e na lista de comentários
— tudo filtrável por período, nota, tipo de evento, experiência e parceiro.
