// =============================================================
// ELARAH — email helper (Resend)
// -------------------------------------------------------------
// Wrapper minimalista pra disparo de e-mail transacional via
// Resend (https://resend.com). Configure em Supabase Secrets:
//
//   RESEND_API_KEY     re_xxx
//   ELARAH_FROM_EMAIL  "Elarah <contato@elarah.com.br>"  (opcional)
//
// Se RESEND_API_KEY não estiver setado, sendEmail() loga um warn
// e retorna { ok: false, skipped: true } — assim o resto do
// fluxo (gravar gift card, marcar booking pago) NÃO quebra em
// produção enquanto o e-mail não é configurado.
// =============================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ELARAH_FROM_EMAIL") ?? "Elarah <contato@elarah.com.br>";

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
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    // Antes isto era um console.warn silencioso e dava a impressão
    // de que o pagamento tinha falhado por e-mail. Loga como ERROR
    // pra ficar óbvio no painel de Logs do Supabase (Edge Functions
    // → stripe-webhook) quando a secret não está configurada.
    console.error(
      "[elarah/email] RESEND_API_KEY AUSENTE — e-mail NÃO enviado para",
      JSON.stringify(msg.to),
      "— cadastre RESEND_API_KEY em Supabase → Project Settings → " +
        "Edge Functions → Secrets e faça redeploy do stripe-webhook.",
    );
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY missing in Supabase secrets",
    };
  }

  const to = Array.isArray(msg.to) ? msg.to : [msg.to];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject: msg.subject,
        html: msg.html,
        reply_to: msg.reply_to,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Loga STATUS + BODY completo (até 800 chars) pra diagnosticar
      // domínio não verificado, from address recusado, quota, etc.
      console.error(
        "[elarah/email] Resend rejeitou o envio —",
        "status=" + res.status,
        "to=" + JSON.stringify(to),
        "from=" + FROM,
        "body=" + text.slice(0, 800),
      );
      return { ok: false, status: res.status, error: text };
    }

    const data = await res.json().catch(() => ({}));
    console.info(
      "[elarah/email] enviado",
      "to=" + JSON.stringify(to),
      "resend_id=" + (data.id ?? "?"),
    );
    return { ok: true, status: res.status, id: data.id };
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
  precoLabel?: string | null;
}): string {
  const greeting = opts.nome ? `Olá, ${opts.nome}!` : "Reserva confirmada!";
  const linha = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">${label}</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;text-align:right;">${escapeHtml(value)}</td></tr>`
      : "";
  const inner = `
    <h2 style="font-family:Georgia,'DM Serif Display',serif;color:#1a1a1a;margin:0 0 12px;font-size:22px;">${greeting}</h2>
    <p style="margin:0 0 18px;">Recebemos seu pagamento. Sua reserva está confirmada — já estamos preparando tudo pra te receber.</p>
    <div style="margin:16px 0;padding:18px 20px;background:#faf6f0;border-radius:12px;">
      <div style="font-family:Georgia,serif;font-size:18px;color:#1a1a1a;margin-bottom:10px;">${escapeHtml(opts.experienciaNome)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${linha("Data", opts.data)}
        ${linha("Horário", opts.horario)}
        ${linha("Endereço", opts.endereco)}
        ${linha("Valor pago", opts.precoLabel)}
      </table>
    </div>
    <p style="margin:18px 0 0;">Qualquer dúvida, é só responder este e-mail. A gente te espera ✨</p>
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
