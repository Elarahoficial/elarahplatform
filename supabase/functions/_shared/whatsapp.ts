// =============================================================
// ELARAH — WhatsApp helper (Z-API)
// -------------------------------------------------------------
// Wrapper minimalista pra disparo de WhatsApp via Z-API
// (https://z-api.io). Configure em Supabase → Project Settings →
// Edge Functions → Secrets:
//
//   ZAPI_INSTANCE_ID    ID da instância (painel Z-API)
//   ZAPI_TOKEN          Token da instância (painel Z-API)
//   ZAPI_CLIENT_TOKEN   Account Security Token (Z-API → Segurança) — opcional
//                       mas RECOMENDADO. Se a conta tiver o token de
//                       segurança ativo, ele é OBRIGATÓRIO no header.
//
// Se ZAPI_INSTANCE_ID / ZAPI_TOKEN não estiverem setados, sendWhatsAppText()
// retorna { ok:false, skipped:true } com um erro claro — assim o painel
// avisa "configure as credenciais" em vez de quebrar.
//
// IMPORTANTE (risco de banimento): Z-API automatiza um número de
// WhatsApp comum (não é a API oficial da Meta). Disparo em massa frio
// pode fazer a Meta banir o número. O whatsapp-broadcast já dá um
// intervalo entre mensagens; ainda assim, dispare com bom senso
// (aquecer o número, mensagens personalizadas, evitar links suspeitos).
// =============================================================

const ZAPI_BASE = Deno.env.get("ZAPI_BASE_URL") ?? "https://api.z-api.io";
const INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "";
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";

// True quando as credenciais mínimas (instância + token) existem.
export function whatsappConfigured(): boolean {
  return !!(INSTANCE && TOKEN);
}

export interface WaResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  id?: string;
}

// Normaliza telefone BR pra E.164 sem "+" (55DDNXXXXXXXX) — formato
// que a Z-API aceita em `phone`. Aceita "(11) 91234-5678",
// "11912345678", "+5511912345678", etc. Retorna null se inválido.
// (Espelha normalizePhoneForWhatsApp do admin.js — fonte única aqui
// no servidor pra o disparo em massa.)
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

// Envia uma mensagem de texto simples pela Z-API.
// `phone` deve estar normalizado (55DDNXXXXXXXX).
export async function sendWhatsAppText(
  phone: string,
  message: string,
): Promise<WaResult> {
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
      // 4xx mais comuns pra dar mensagem amigável no painel:
      //   401/403 → Client-Token errado/ausente
      //   4xx com "not connected"/"disconnected" → instância deslogada
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
