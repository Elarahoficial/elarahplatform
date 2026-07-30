// =============================================================
// ELARAH — WhatsApp helper (Z-API)
// -------------------------------------------------------------
// Envio de mensagens de WhatsApp via Z-API (https://z-api.io).
// Configure em Supabase → Project Settings → Edge Functions → Secrets:
//
//   ZAPI_INSTANCE_ID    id da instância (na tela da instância no Z-API)
//   ZAPI_TOKEN          token da instância
//   ZAPI_CLIENT_TOKEN   "Account Security Token" (vai no header Client-Token)
//
// Se QUALQUER um faltar, sendWhatsAppText() loga um ERROR e retorna
// { ok:false, skipped:true } — assim o resto do fluxo (marcar booking
// paga, mandar e-mail) NÃO quebra enquanto o WhatsApp não está configurado.
// Mesma filosofia do _shared/email.ts.
//
// IMPORTANTE: a instância do Z-API precisa estar CONECTADA (QR code lido
// com o WhatsApp da Elarah) pra as mensagens saírem.
// =============================================================

const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "";
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";

export interface WhatsAppResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
}

export function isWhatsAppConfigured(): boolean {
  return !!(ZAPI_INSTANCE_ID && ZAPI_TOKEN && ZAPI_CLIENT_TOKEN);
}

// Normaliza pra formato E.164 sem o "+": 55 (Brasil) + DDD + número.
// Aceita: "11999999999" (DDD+num → prefixa 55), "5511999999999" (já ok),
// telefones com máscara/espaços. Devolve null se não parecer um número BR.
export function normalizeWhatsAppPhoneBR(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D+/g, "");
  if (!digits) return null;
  let d = digits;
  // Sem código do país (10 = fixo, 11 = celular com 9) → prefixa 55.
  if (d.length === 10 || d.length === 11) d = "55" + d;
  // Já com 55 e tamanho de BR (12 ou 13) → ok.
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

// Envia uma mensagem de texto simples pelo Z-API.
export async function sendWhatsAppText(opts: {
  to: unknown;
  message: string;
}): Promise<WhatsAppResult> {
  const phone = normalizeWhatsAppPhoneBR(opts.to);
  if (!phone) {
    console.warn("[Elarah WhatsApp] telefone inválido — não enviado", String(opts.to ?? ""));
    return { ok: false, error: "invalid_phone" };
  }
  if (!isWhatsAppConfigured()) {
    console.error(
      "[Elarah WhatsApp] Z-API não configurado — pulando envio.",
      "Cadastre ZAPI_INSTANCE_ID / ZAPI_TOKEN / ZAPI_CLIENT_TOKEN nos Secrets.",
    );
    return { ok: false, skipped: true };
  }
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone, message: opts.message }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(
        "[Elarah WhatsApp] Z-API respondeu erro",
        "status=" + resp.status,
        "body=" + body.slice(0, 300),
      );
      return { ok: false, status: resp.status, error: body.slice(0, 300) };
    }
    return { ok: true, status: resp.status };
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e);
    console.error("[Elarah WhatsApp] exceção ao chamar Z-API", msg);
    return { ok: false, error: msg };
  }
}

// ===== Textos das mensagens =====

// Primeiro nome, pra deixar a mensagem pessoal.
function primeiroNome(nome: unknown): string {
  const n = String(nome ?? "").trim();
  return n ? n.split(/\s+/)[0] : "";
}

// Confirmação de reserva — espelha o e-mail "Sua reserva está confirmada ✨".
export function bookingConfirmationWhatsAppText(opts: {
  nome?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horario?: unknown;
  endereco?: unknown;
  bairro?: unknown;
  quantidade?: unknown;
}): string {
  const nome = primeiroNome(opts.nome);
  const saud = nome ? `Oi, ${nome}! ` : "Oi! ";
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const linhas: string[] = [];
  linhas.push(`${saud}Sua reserva na Elarah está confirmada ✨`);
  linhas.push("");
  linhas.push(`*${exp}*`);
  const dataHora = [String(opts.data ?? "").trim(), String(opts.horario ?? "").trim()]
    .filter(Boolean).join(" · ");
  if (dataHora) linhas.push(`🗓️ ${dataHora}`);
  const local = [String(opts.endereco ?? "").trim(), String(opts.bairro ?? "").trim()]
    .filter(Boolean).join(" — ");
  if (local) linhas.push(`📍 ${local}`);
  const qtd = Number(opts.quantidade) || 1;
  if (qtd > 1) linhas.push(`👥 ${qtd} pessoas`);
  linhas.push("");
  linhas.push("Qualquer coisa é só responder por aqui. Até logo! 🧡");
  return linhas.join("\n");
}
