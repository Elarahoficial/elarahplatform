// =============================================================
// ELARAH — WhatsApp helper (Z-API)
// -------------------------------------------------------------
// Adaptador ÚNICO de disparo de WhatsApp via Z-API (https://z-api.io),
// usado por dois recursos:
//   1) whatsapp-broadcast  — disparo em massa pros interessados.
//   2) confirmação de reserva — mensagem automática na hora da compra
//      (stripe/mp/pagarme webhooks + check-mp-payment-status).
//
// Configure em Supabase → Project Settings → Edge Functions → Secrets:
//   ZAPI_INSTANCE_ID    ID da instância (painel Z-API)
//   ZAPI_TOKEN          Token da instância (painel Z-API)
//   ZAPI_CLIENT_TOKEN   Account Security Token (Z-API → Segurança) —
//                       obrigatório no header se a conta tiver o token ativo.
//   ZAPI_BASE_URL       (opcional) base da API; default https://api.z-api.io
//
// Se ZAPI_INSTANCE_ID / ZAPI_TOKEN não estiverem setados, o envio retorna
// { ok:false, skipped:true } com erro claro — nada quebra enquanto o
// WhatsApp não está configurado (mesma filosofia do _shared/email.ts).
//
// IMPORTANTE (risco de banimento): Z-API automatiza um número de WhatsApp
// comum (não é a API oficial da Meta). Disparo em massa frio pode fazer a
// Meta banir o número — dispare com bom senso (número aquecido, mensagens
// personalizadas, intervalo entre envios, sem links suspeitos).
// =============================================================

const ZAPI_BASE = Deno.env.get("ZAPI_BASE_URL") ?? "https://api.z-api.io";
const INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "";
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";

// True quando as credenciais mínimas (instância + token) existem.
export function whatsappConfigured(): boolean {
  return !!(INSTANCE && TOKEN);
}
// Alias — nome usado pelo fluxo de confirmação de reserva.
export const isWhatsAppConfigured = whatsappConfigured;

export interface WaResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  id?: string;
}
// Alias de tipo (compat com o código de confirmação).
export type WhatsAppResult = WaResult;

// Normaliza telefone BR pra E.164 sem "+" (55DDNXXXXXXXX) — formato que a
// Z-API aceita em `phone`. Aceita "(11) 91234-5678", "11912345678",
// "+5511912345678", etc. Retorna null se inválido.
export function normalizePhoneBR(raw: string | null | undefined): string | null {
  const digits = String(raw ?? "").replace(/\D+/g, "");
  if (!digits) return null;
  // Já vem com 55 (E.164 completo): 12 dígitos (fixo) ou 13 (celular).
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith("55")) return digits;
    return "55" + digits.slice(-11);
  }
  // 10 (fixo) ou 11 (celular) dígitos: assume BR sem o 55.
  if (digits.length === 10 || digits.length === 11) {
    return "55" + digits;
  }
  return null;
}
// Alias — nome usado pelo fluxo de confirmação de reserva.
export const normalizeWhatsAppPhoneBR = normalizePhoneBR;

// Núcleo do envio (telefone JÁ normalizado em 55DDNXXXXXXXX).
async function sendTextCore(phone: string, message: string): Promise<WaResult> {
  if (!INSTANCE || !TOKEN) {
    return {
      ok: false,
      skipped: true,
      error:
        "ZAPI_INSTANCE_ID/ZAPI_TOKEN ausentes nos secrets do Supabase. " +
        "Cadastre em Edge Functions → Secrets e faça redeploy.",
    };
  }

  const url = `${ZAPI_BASE}/instances/${INSTANCE}/token/${TOKEN}/send-text`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[elarah/whatsapp] Z-API rejeitou o envio —",
        "status=" + res.status,
        "phone=" + phone,
        "body=" + text.slice(0, 500),
      );
      // Mensagens amigáveis pros 4xx mais comuns:
      //   401/403 → Client-Token errado/ausente
      //   4xx "not connected"/"disconnected" → instância deslogada
      let friendly = text.slice(0, 300);
      const low = (text || "").toLowerCase();
      if (res.status === 401 || res.status === 403) {
        friendly = "Client-Token inválido ou ausente (Z-API → Segurança). " + friendly;
      } else if (low.includes("not connected") || low.includes("disconnected") || low.includes("smartphone")) {
        friendly = "Instância Z-API desconectada — reconecte o WhatsApp (QR code) no painel Z-API. " + friendly;
      }
      return { ok: false, status: res.status, error: friendly };
    }

    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const id =
      (data as { messageId?: string }).messageId ??
      (data as { id?: string }).id ??
      (data as { zaapId?: string }).zaapId;
    return { ok: true, status: res.status, id };
  } catch (e) {
    console.error("[elarah/whatsapp] exceção durante envio", e);
    return { ok: false, error: String(e) };
  }
}

// Envia uma mensagem de texto. Aceita as DUAS formas de chamada, pra
// atender os dois recursos sem mudar quem já chama:
//   sendWhatsAppText(phone, message)      → usado pelo whatsapp-broadcast
//   sendWhatsAppText({ to, message })     → usado pelas confirmações
// Em ambos os casos o telefone é normalizado aqui (idempotente).
export async function sendWhatsAppText(
  phoneOrOpts: string | { to: unknown; message: string },
  message?: string,
): Promise<WaResult> {
  let rawPhone: unknown;
  let msg: string;
  if (typeof phoneOrOpts === "object" && phoneOrOpts !== null) {
    rawPhone = phoneOrOpts.to;
    msg = phoneOrOpts.message;
  } else {
    rawPhone = phoneOrOpts;
    msg = message ?? "";
  }
  const phone = normalizePhoneBR(
    typeof rawPhone === "string" ? rawPhone : String(rawPhone ?? ""),
  );
  if (!phone) {
    console.warn("[elarah/whatsapp] telefone inválido — não enviado", String(rawPhone ?? ""));
    return { ok: false, error: "invalid_phone" };
  }
  return sendTextCore(phone, msg);
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
