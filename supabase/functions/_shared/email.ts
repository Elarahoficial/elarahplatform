// =============================================================
// ELARAH — email helper (Resend)
// -------------------------------------------------------------
// Wrapper minimalista pra disparo de e-mail transacional via
// Resend (https://resend.com). Configure em Supabase Secrets:
//
//   RESEND_API_KEY     re_xxx
//   ELARAH_FROM_EMAIL  "Elarah <contato@elarah.com.br>"  (opcional)
//
// Se RESEND_API_KEY não estiver setado, sendEmail() loga um ERROR
// e retorna { ok: false, skipped: true } — assim o resto do
// fluxo (gravar gift card, marcar booking pago) NÃO quebra em
// produção enquanto o e-mail não é configurado.
//
// Fallback automático: se o FROM configurado for rejeitado pelo
// Resend com erro de domínio não-verificado, o wrapper tenta
// AUTOMATICAMENTE de novo usando `onboarding@resend.dev`, que é o
// endereço sandbox do Resend (funciona sem verificação de domínio).
// Isso evita o fluxo ficar travado enquanto o cliente não verifica
// o domínio dele.
// =============================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ELARAH_FROM_EMAIL") ?? "Elarah <contato@elarah.com.br>";
// Endereço sandbox do Resend que funciona sem verificação.
const FALLBACK_FROM = "Elarah <onboarding@resend.dev>";

// Para quem mandar o aviso de "nova venda". Pode ser 1 ou vários
// e-mails separados por vírgula/espaço em Supabase Secrets:
//   ADMIN_NOTIFY_EMAILS  "maria@elarah.com.br, socio@elarah.com.br"
// Se não setar, cai no e-mail de contato padrão da Elarah.
const ADMIN_NOTIFY_EMAILS = Deno.env.get("ADMIN_NOTIFY_EMAILS") ?? "";
const DEFAULT_ADMIN_EMAIL = "contato.elarah@gmail.com";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
}

export interface EmailResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  id?: string;
  usedFallbackFrom?: boolean;
}

// Detecta erros do Resend que indicam domínio/FROM inválido. Usado
// pra decidir se vale a pena retry com o endereço sandbox.
function isFromAddressError(status: number, body: string): boolean {
  if (status === 403) return true;
  const b = (body || "").toLowerCase();
  return (
    b.includes("domain") && (
      b.includes("not verified") ||
      b.includes("not_verified") ||
      b.includes("not found") ||
      b.includes("validation_error") ||
      b.includes("unauthorized")
    )
  ) ||
    b.includes("from address") ||
    b.includes("verify your domain") ||
    b.includes("invalid `from`");
}

// Chama a API do Resend uma vez com o FROM informado.
async function postToResend(
  fromAddress: string,
  to: string[],
  msg: EmailMessage,
): Promise<{ res: Response; text: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: msg.subject,
      html: msg.html,
      reply_to: msg.reply_to,
    }),
  });
  const text = res.ok ? "" : await res.text().catch(() => "");
  return { res, text };
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const to = Array.isArray(msg.to) ? msg.to : [msg.to];

  // Log de entrada pra confirmar que a função foi chamada. Aparece
  // em Supabase → Edge Functions → <function> → Logs.
  console.info(
    "[elarah/email] sendEmail() chamado",
    "to=" + JSON.stringify(to),
    "subject=" + JSON.stringify(msg.subject),
    "from=" + FROM,
  );

  if (!RESEND_API_KEY) {
    console.error(
      "[elarah/email] RESEND_API_KEY AUSENTE — e-mail NÃO enviado para",
      JSON.stringify(to),
      "— cadastre RESEND_API_KEY em Supabase → Project Settings → " +
        "Edge Functions → Secrets e faça redeploy do stripe-webhook.",
    );
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY missing in Supabase secrets",
    };
  }

  try {
    // ---- Tentativa 1: com o FROM configurado ----
    let attempt = await postToResend(FROM, to, msg);

    if (attempt.res.ok) {
      const data = await attempt.res.json().catch(() => ({} as Record<string, unknown>));
      console.info(
        "[elarah/email] ENVIADO ✓",
        "to=" + JSON.stringify(to),
        "from=" + FROM,
        "resend_id=" + ((data as { id?: string }).id ?? "?"),
      );
      return {
        ok: true,
        status: attempt.res.status,
        id: (data as { id?: string }).id,
      };
    }

    // ---- Tentativa 1 falhou: analisa o motivo ----
    console.error(
      "[elarah/email] Resend rejeitou o envio (tentativa 1) —",
      "status=" + attempt.res.status,
      "to=" + JSON.stringify(to),
      "from=" + FROM,
      "body=" + attempt.text.slice(0, 800),
    );

    // ---- Tentativa 2: fallback para onboarding@resend.dev ----
    // Só ativa se o FROM principal é diferente do fallback E o erro
    // parece ser por domínio/FROM não-verificado. Emails ainda saem,
    // só que do endereço sandbox do Resend.
    const mainIsSandbox = FROM.toLowerCase().includes("onboarding@resend.dev");
    if (!mainIsSandbox && isFromAddressError(attempt.res.status, attempt.text)) {
      console.warn(
        "[elarah/email] FROM principal parece não-verificado. " +
          "Tentando fallback automático com " + FALLBACK_FROM + ".",
      );
      const retry = await postToResend(FALLBACK_FROM, to, msg);
      if (retry.res.ok) {
        const data = await retry.res.json().catch(() => ({} as Record<string, unknown>));
        console.info(
          "[elarah/email] ENVIADO VIA FALLBACK ✓",
          "to=" + JSON.stringify(to),
          "from=" + FALLBACK_FROM,
          "resend_id=" + ((data as { id?: string }).id ?? "?"),
          "— recomendo verificar elarah.com.br em Resend → Domains " +
            "pra voltar ao FROM principal.",
        );
        return {
          ok: true,
          status: retry.res.status,
          id: (data as { id?: string }).id,
          usedFallbackFrom: true,
        };
      }
      console.error(
        "[elarah/email] Fallback onboarding@resend.dev também falhou —",
        "status=" + retry.res.status,
        "body=" + retry.text.slice(0, 800),
      );
      return {
        ok: false,
        status: retry.res.status,
        error: retry.text,
      };
    }

    return { ok: false, status: attempt.res.status, error: attempt.text };
  } catch (e) {
    console.error("[elarah/email] exceção durante envio", e);
    return { ok: false, error: String(e) };
  }
}

// ---------------- TEMPLATES ----------------

function htmlShell(inner: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf6f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 36px 24px;text-align:center;background:linear-gradient(135deg,#f6d5a8,#f0a05e);">
          <h1 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0;font-size:26px;">Elarah</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#3a2410;letter-spacing:.5px;text-transform:uppercase;">curadoria de experiências</p>
        </td></tr>
        <tr><td style="padding:32px 36px;font-size:15px;line-height:1.6;color:#222;">
          ${inner}
        </td></tr>
        <tr><td style="padding:18px 36px 28px;font-size:12px;color:#888;text-align:center;border-top:1px solid #f0e8de;">
          Recebeu por engano? Pode ignorar este e-mail. Dúvidas: <a href="mailto:contato.elarah@gmail.com" style="color:#f0a05e;">contato.elarah@gmail.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function brl(centavos: number): string {
  const v = (centavos / 100).toFixed(2).replace(".", ",");
  return "R$ " + v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function giftCardEmailHtml(opts: {
  recipientName?: string | null;
  buyerName?: string | null;
  code: string;
  valorCentavos: number;
  message?: string | null;
  expiresAt?: string | null;
}): string {
  const greeting = opts.recipientName ? `Olá, ${opts.recipientName}!` : "Olá!";
  const from = opts.buyerName ? `<strong>${escapeHtml(opts.buyerName)}</strong>` : "alguém especial";
  const personal = opts.message
    ? `<div style="margin:18px 0;padding:14px 16px;background:#faf6f0;border-left:3px solid #f0a05e;border-radius:8px;font-style:italic;color:#5a4a3a;">"${escapeHtml(opts.message)}"</div>`
    : "";
  const exp = opts.expiresAt
    ? `<p style="margin:8px 0 0;font-size:13px;color:#888;">Validade: ${escapeHtml(opts.expiresAt)}</p>`
    : "";

  const inner = `
    <h2 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0 0 12px;font-size:22px;">${greeting}</h2>
    <p style="margin:0 0 12px;">Você recebeu um gift card da Elarah de ${from}. Use no checkout pra pagar (parcial ou totalmente) qualquer experiência da nossa curadoria.</p>
    ${personal}
    <div style="margin:24px 0;padding:22px;background:#fff8ee;border:1.5px dashed #f0a05e;border-radius:14px;text-align:center;">
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:#a4663b;">Seu código</div>
      <div style="font-family:Menlo,Consolas,monospace;font-size:28px;letter-spacing:4px;color:#1a1a1a;margin:8px 0 6px;font-weight:700;">${escapeHtml(opts.code)}</div>
      <div style="font-size:14px;color:#3a2410;">Valor: <strong>${brl(opts.valorCentavos)}</strong></div>
      ${exp}
    </div>
    <h3 style="font-family:Georgia,serif;color:#1a1a1a;margin:24px 0 8px;font-size:17px;">Como usar</h3>
    <ol style="padding-left:20px;margin:0 0 16px;color:#3a3a3a;">
      <li>Acesse <a href="https://elarah.com.br" style="color:#f0a05e;">elarah.com.br</a> e escolha uma experiência.</li>
      <li>Clique em <em>Reservar</em>.</li>
      <li>No campo <strong>Cupom / Gift Card</strong>, cole o código acima.</li>
      <li>O valor é abatido automaticamente. Se cobrir tudo, você não paga nada extra.</li>
    </ol>
    <p style="margin:18px 0 0;font-size:13px;color:#666;">Se sobrar saldo, você pode usar em outra reserva. Se faltar, paga só a diferença pelo cartão.</p>
  `;
  return htmlShell(inner);
}

// ---------------- FOLLOW-UP DE GIFT CARD PENDENTE ----------------

// E-mail enviado pro COMPRADOR de um gift card que ficou "pendente"
// (começou a compra mas não concluiu o pagamento). Tom gentil, sem
// cobrança — só um empurrãozinho pra finalizar. NÃO mostra código:
// o gift card ainda não existe de fato até o pagamento confirmar.
export function giftCardFollowupEmailHtml(opts: {
  buyerName?: string | null;
  recipientName?: string | null;
  valorCentavos?: number | null;
  customMessage?: string | null;
  finishUrl?: string | null;
}): string {
  const firstName = (opts.buyerName || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Oi, ${firstName}!` : "Oi!";
  const url = opts.finishUrl || "https://elarah.com.br/presentear.html";
  const valor = Number(opts.valorCentavos);
  const valorLinha = Number.isFinite(valor) && valor > 0
    ? `<div style="margin:20px 0;padding:18px;background:#fff8ee;border:1.5px dashed #f0a05e;border-radius:14px;text-align:center;">
         <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a4663b;">Gift card reservado</div>
         <div style="font-size:28px;font-weight:700;color:#1a1a1a;margin-top:4px;">${brl(valor)}</div>
       </div>`
    : "";
  const paraQuem = opts.recipientName
    ? ` pra <strong>${escapeHtml(opts.recipientName)}</strong>`
    : "";
  const personal = opts.customMessage
    ? `<div style="margin:18px 0;padding:14px 16px;background:#faf6f0;border-left:3px solid #f0a05e;border-radius:8px;color:#5a4a3a;">${escapeHtml(opts.customMessage)}</div>`
    : "";

  const inner = `
    <h2 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0 0 12px;font-size:22px;">${greeting}</h2>
    <p style="margin:0 0 12px;">Vimos que você começou a presentear${paraQuem} com um gift card da Elarah, mas o pagamento ainda não foi concluído 💛</p>
    <p style="margin:0 0 4px;">Quando você quiser, é só finalizar — leva menos de 1 minuto e o gift card é enviado na hora por e-mail, pronto pra usar em qualquer experiência da nossa curadoria.</p>
    ${valorLinha}
    ${personal}
    <div style="text-align:center;margin:26px 0 8px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#f0a05e;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:999px;">Concluir meu gift card</a>
    </div>
    <p style="margin:18px 0 0;font-size:13px;color:#666;text-align:center;">Já concluiu ou mudou de ideia? Pode ignorar este e-mail tranquilamente.</p>
  `;
  return htmlShell(inner);
}

// ---------------- FOLLOW-UP DE RESERVA PENDENTE ----------------

// E-mail pro cliente que quase reservou uma experiência mas não
// concluiu o pagamento. Tom leve, com CTA pra finalizar. Mesmo papel
// do botão de WhatsApp na aba "Compras Pendentes" do admin.
export function bookingFollowupEmailHtml(opts: {
  nome?: string | null;
  experienciaNome?: string | null;
  data?: string | null;
  horario?: string | null;
  finishUrl?: string | null;
  customMessage?: string | null;
}): string {
  const firstName = (opts.nome || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Oi, ${firstName}!` : "Oi!";
  const exp = opts.experienciaNome ? `<strong>${escapeHtml(opts.experienciaNome)}</strong>` : "uma experiência da Elarah";
  const url = opts.finishUrl || "https://elarah.com.br";
  const quando = [opts.data, opts.horario].filter(Boolean).map((s) => escapeHtml(String(s))).join(" · ");
  const quandoLinha = quando
    ? `<p style="margin:0 0 4px;font-size:14px;color:#666;text-align:center;">${quando}</p>`
    : "";
  const personal = opts.customMessage
    ? `<div style="margin:18px 0;padding:14px 16px;background:#faf6f0;border-left:3px solid #f0a05e;border-radius:8px;color:#5a4a3a;">${escapeHtml(opts.customMessage)}</div>`
    : "";

  const inner = `
    <h2 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0 0 12px;font-size:22px;">${greeting}</h2>
    <p style="margin:0 0 12px;">Vimos que você quase garantiu sua vaga em ${exp}, mas a reserva não foi concluída ✨</p>
    <p style="margin:0 0 4px;">As vagas são limitadas e essa ainda pode ser sua. Quando quiser finalizar, é rapidinho:</p>
    ${quandoLinha}
    ${personal}
    <div style="text-align:center;margin:26px 0 8px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#f0a05e;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:999px;">Garantir minha vaga</a>
    </div>
    <p style="margin:18px 0 0;font-size:13px;color:#666;text-align:center;">Qualquer dúvida, é só responder este e-mail — a gente te ajuda 💛</p>
  `;
  return htmlShell(inner);
}

export function bookingConfirmationEmailHtml(opts: {
  nome?: string | null;
  experienciaNome: string;
  data?: string | null;
  horario?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  precoLabel?: string | null;
  quantidade?: number | null;
  amountTotalCentavos?: number | null;
  participantes?: Array<{ nome?: string | null }> | null;
  bookingId?: string | null;
  variantLabel?: string | null;
  variantSelected?: string | null;
}): string {
  const firstName = (opts.nome || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Olá, ${firstName}!` : "Reserva confirmada!";
  const linha = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;width:38%;">${label}</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;text-align:right;">${escapeHtml(value)}</td></tr>`
      : "";
  // Junta endereço + bairro em uma linha só quando os dois existem.
  const enderecoFull = opts.endereco && opts.bairro
    ? `${opts.endereco} — ${opts.bairro}`
    : (opts.endereco || opts.bairro || null);
  // Quantidade só aparece se for grupo (>1). Reserva individual é o
  // caso default — não precisa destacar.
  const qty = Number(opts.quantidade || 1);
  const qtyLabel = qty > 1 ? `${qty} pessoas` : null;
  // "Valor pago" = valor REAL cobrado (amount_total). precoLabel é
  // unitário e seria enganoso pra grupos (cliente vê "R$100" depois
  // de pagar R$300). Quando temos amount_total, exibimos formatado;
  // como fallback (booking antiga sem amount_total ou nulo), volta
  // pro precoLabel pra não deixar a linha vazia.
  const amountCents = Number(opts.amountTotalCentavos);
  const valorPagoLabel = Number.isFinite(amountCents) && amountCents > 0
    ? brl(amountCents)
    : (opts.precoLabel || null);
  // Detalhe "qty × precoLabel" pra grupo — aparece como linha extra
  // pra deixar transparente que multiplicou. Só quando temos os dois.
  const subtotalDetailLabel = qty > 1 && opts.precoLabel
    ? `${qty} × ${opts.precoLabel}`
    : null;
  // Lista de participantes: só mostra nomes extras (além do titular),
  // que são os acompanhantes do grupo. Se a lista tem o mesmo tamanho
  // que a quantidade, pega do 2º em diante.
  const extras = Array.isArray(opts.participantes) ? opts.participantes : [];
  const acompanhantesHtml = extras.length > 0
    ? `<div style="margin-top:14px;padding-top:12px;border-top:1px dashed #e8dfd0;">
         <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">Acompanhantes</div>
         <div style="font-size:14px;color:#3a3a3a;line-height:1.5;">
           ${extras.map(p => escapeHtml((p && p.nome) || "—")).join("<br>")}
         </div>
       </div>`
    : "";
  // Referência da reserva — últimos 8 chars do UUID, útil se a pessoa
  // precisar citar no suporte. Não exibe se não tiver ID.
  const refHtml = opts.bookingId
    ? `<p style="margin:18px 0 0;font-size:12px;color:#999;text-align:center;letter-spacing:.5px;">
         Ref. da reserva: <span style="font-family:Menlo,Consolas,monospace;color:#666;">${escapeHtml(
           String(opts.bookingId).slice(-8).toUpperCase()
         )}</span>
       </p>`
    : "";

  const inner = `
    <h2 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0 0 12px;font-size:22px;">${greeting}</h2>
    <p style="margin:0 0 8px;">Recebemos seu pagamento 💛 Sua reserva está <strong>confirmada</strong>.</p>
    <p style="margin:0 0 20px;color:#555;">Já estamos preparando tudo pra te receber — guarde este email, ele tem todas as informações que você vai precisar no dia.</p>
    <div style="margin:16px 0;padding:20px 22px;background:#faf6f0;border-radius:12px;border:1px solid #f0e8de;">
      <div style="font-family:Georgia,serif;font-size:19px;color:#1a1a1a;margin-bottom:14px;line-height:1.3;">${escapeHtml(opts.experienciaNome)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${linha("Data", opts.data)}
        ${linha("Horário", opts.horario)}
        ${linha("Endereço", enderecoFull)}
        ${linha("Pessoas", qtyLabel)}
        ${linha(opts.variantLabel || "Variação", opts.variantSelected || null)}
        ${linha("Detalhe", subtotalDetailLabel)}
        ${linha("Valor pago", valorPagoLabel)}
      </table>
      ${acompanhantesHtml}
    </div>
    <h3 style="font-family:Georgia,serif;color:#1a1a1a;margin:24px 0 10px;font-size:16px;">O que esperar</h3>
    <ul style="padding-left:20px;margin:0 0 8px;color:#3a3a3a;line-height:1.7;font-size:14px;">
      <li>Chegue <strong>10 minutos antes</strong> do horário pra aproveitar tudo com calma.</li>
      <li>Qualquer imprevisto ou mudança, responde este email que a gente resolve junto.</li>
      <li>Se for em grupo, avisa se algum acompanhante não conseguir ir.</li>
    </ul>
    <p style="margin:22px 0 0;color:#555;">A gente te espera ✨</p>
    ${refHtml}
  `;
  return htmlShell(inner);
}

// ---------------- NOTIFICAÇÃO DE VENDA (ADMIN) ----------------

// Lista de destinatários do aviso de venda. Lê ADMIN_NOTIFY_EMAILS
// (vírgula/ponto-e-vírgula/espaço como separador). Vazio = e-mail
// padrão da Elarah, pra a notificação funcionar sem configurar nada.
export function adminNotifyRecipients(): string[] {
  const raw = (ADMIN_NOTIFY_EMAILS || "").trim();
  const list = (raw ? raw.split(/[,;\s]+/) : [])
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [DEFAULT_ADMIN_EMAIL];
}

export interface AdminSaleNotificationOpts {
  experienciaNome: string;
  clienteNome?: string | null;
  clienteEmail?: string | null;
  data?: string | null;
  horario?: string | null;
  quantidade?: number | null;
  amountTotalCentavos?: number | null;
  precoLabel?: string | null;
  bookingId?: string | null;
  // Texto amigável do meio de pagamento, ex.: "Cartão (Stripe)".
  paymentMethod?: string | null;
  couponCode?: string | null;
  couponDiscountCentavos?: number | null;
  fornecedorNome?: string | null;
  bairro?: string | null;
  endereco?: string | null;
}

export function adminSaleNotificationEmailHtml(opts: AdminSaleNotificationOpts): string {
  const linha = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;width:40%;">${label}</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;text-align:right;">${escapeHtml(value)}</td></tr>`
      : "";

  const qty = Number(opts.quantidade || 1);
  const qtyLabel = qty > 1 ? `${qty} pessoas` : "1 pessoa";

  const amountCents = Number(opts.amountTotalCentavos);
  const valorLabel = Number.isFinite(amountCents) && amountCents > 0
    ? brl(amountCents)
    : (opts.precoLabel || "—");

  const enderecoFull = opts.endereco && opts.bairro
    ? `${opts.endereco} — ${opts.bairro}`
    : (opts.endereco || opts.bairro || null);

  const cupomLabel = opts.couponCode
    ? `${opts.couponCode}` + (
        Number(opts.couponDiscountCentavos) > 0
          ? ` (−${brl(Number(opts.couponDiscountCentavos))})`
          : ""
      )
    : null;

  const clienteLinha = opts.clienteEmail
    ? `${opts.clienteNome ? escapeHtml(opts.clienteNome) + " · " : ""}<a href="mailto:${escapeHtml(opts.clienteEmail)}" style="color:#f0a05e;">${escapeHtml(opts.clienteEmail)}</a>`
    : (opts.clienteNome ? escapeHtml(opts.clienteNome) : "—");

  const inner = `
    <h2 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0 0 6px;font-size:22px;">Nova venda 🎉</h2>
    <p style="margin:0 0 18px;color:#555;">Saiu mais uma! Aqui estão os detalhes do pedido.</p>
    <div style="margin:0 0 18px;padding:18px 20px;background:#fff8ee;border:1.5px solid #f0d8bf;border-radius:14px;text-align:center;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a4663b;">Valor da venda</div>
      <div style="font-size:30px;font-weight:700;color:#1a1a1a;margin-top:4px;">${valorLabel}</div>
    </div>
    <div style="margin:16px 0;padding:20px 22px;background:#faf6f0;border-radius:12px;border:1px solid #f0e8de;">
      <div style="font-family:Georgia,serif;font-size:19px;color:#1a1a1a;margin-bottom:14px;line-height:1.3;">${escapeHtml(opts.experienciaNome)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;width:40%;">Cliente</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;text-align:right;">${clienteLinha}</td></tr>
        ${linha("Data", opts.data)}
        ${linha("Horário", opts.horario)}
        ${linha("Quantidade", qtyLabel)}
        ${linha("Endereço", enderecoFull)}
        ${linha("Cupom", cupomLabel)}
        ${linha("Pagamento", opts.paymentMethod)}
        ${linha("Fornecedor", opts.fornecedorNome)}
      </table>
    </div>
    ${
      opts.bookingId
        ? `<p style="margin:14px 0 0;font-size:12px;color:#999;text-align:center;letter-spacing:.5px;">Ref. da reserva: <span style="font-family:Menlo,Consolas,monospace;color:#666;">${escapeHtml(String(opts.bookingId).slice(-8).toUpperCase())}</span></p>`
        : ""
    }
    <p style="margin:18px 0 0;font-size:13px;color:#888;text-align:center;">Pode responder este e-mail pra falar direto com o cliente.</p>
  `;
  return htmlShell(inner);
}

// Envia o aviso de venda pros admins. Best-effort: loga e nunca
// relança — uma falha aqui não pode derrubar o fluxo de pagamento
// (a booking já está paga e o cliente já foi avisado).
export async function sendAdminSaleNotification(
  opts: AdminSaleNotificationOpts,
): Promise<EmailResult> {
  const to = adminNotifyRecipients();
  const amountCents = Number(opts.amountTotalCentavos);
  const valorLabel = Number.isFinite(amountCents) && amountCents > 0
    ? brl(amountCents)
    : (opts.precoLabel || "");
  const subject = `🎉 Nova venda: ${opts.experienciaNome}` +
    (valorLabel ? ` — ${valorLabel}` : "");
  const result = await sendEmail({
    to,
    subject,
    html: adminSaleNotificationEmailHtml(opts),
    // Responder o aviso fala direto com o cliente.
    reply_to: opts.clienteEmail ?? undefined,
  });
  if (!result.ok) {
    console.error(
      "[elarah/email] FALHA ao enviar aviso de venda pro admin —",
      "to=" + JSON.stringify(to),
      "booking_id=" + (opts.bookingId ?? "?"),
      "skipped=" + (result.skipped ? "true" : "false"),
      "error=" + (result.error ?? "?"),
    );
  }
  return result;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Geração de código humano-friendly: prefixo ELRH + 12 chars (sem 0/O/1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateGiftCardCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3 || i === 7) out += "-";
  }
  return "ELRH-" + out;
}
