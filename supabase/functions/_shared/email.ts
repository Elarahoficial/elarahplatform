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
