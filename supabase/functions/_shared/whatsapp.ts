// =============================================================
// ELARAH — WhatsApp helper (Meta WhatsApp Cloud API — OFICIAL)
// -------------------------------------------------------------
// Wrapper pra disparo via API OFICIAL da Meta (graph.facebook.com).
// Substitui a antiga integração Z-API (número comum), que foi
// restringida pela Meta ao passar do volume. A API oficial é feita
// pra escala e não corre risco de ban.
//
// ⚠️ DIFERENÇA CRÍTICA da API oficial: pra quem NÃO te mandou mensagem
// nas últimas 24h (o caso da lista do formulário), a Meta só permite
// enviar um TEMPLATE de mensagem pré-aprovado por ela — não dá pra
// mandar texto livre. Por isso este helper envia por `type: template`,
// com variáveis posicionais ({{1}}, {{2}}, {{3}}).
//
// Configure em Supabase → Project Settings → Edge Functions → Secrets:
//
//   WHATSAPP_PHONE_NUMBER_ID   ID do número (WhatsApp Manager → API Setup)
//   WHATSAPP_ACCESS_TOKEN      Token PERMANENTE (System User no Business)
//   WHATSAPP_TEMPLATE_NAME     nome do template aprovado (default:
//                              "elarah_followup_experiencia")
//   WHATSAPP_TEMPLATE_LANG     idioma do template (default "pt_BR")
//   WHATSAPP_API_VERSION       opcional (default "v21.0")
//
// Contrato de variáveis do template (nesta ordem):
//   {{1}} = primeiro nome da pessoa
//   {{2}} = nome da experiência
//   {{3}} = link
// =============================================================

const GRAPH_BASE = Deno.env.get("WHATSAPP_GRAPH_BASE") ?? "https://graph.facebook.com";
const API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") ?? "v21.0";
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";

// True quando as credenciais mínimas (número + token) existem.
export function whatsappConfigured(): boolean {
  return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}

export interface WaResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  id?: string;
}

// Normaliza telefone BR pra E.164 sem "+" (55DDNXXXXXXXX) — formato
// que a Cloud API aceita em `to`. Aceita "(11) 91234-5678",
// "11912345678", "+5511912345678", etc. Retorna null se inválido.
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

// Traduz erros comuns da Cloud API em mensagem amigável pro painel.
function friendlyMetaError(status: number, text: string): string {
  let friendly = text.slice(0, 400);
  try {
    const j = JSON.parse(text) as {
      error?: {
        code?: number;
        message?: string;
        error_data?: { details?: string };
        error_subcode?: number;
      };
    };
    const e = j.error ?? {};
    const details = e.error_data?.details ? ` — ${e.error_data.details}` : "";
    friendly = (e.message ?? friendly) + details;
    if (e.code === 190) {
      friendly = "Token de acesso inválido ou expirado — gere um token " +
        "PERMANENTE de System User no Meta Business. " + friendly;
    } else if (e.code === 132001 || /translation|template/i.test(e.message ?? "")) {
      friendly = "Template não encontrado ou ainda não aprovado com esse " +
        "nome + idioma na Meta. Confira WHATSAPP_TEMPLATE_NAME/LANG. " + friendly;
    } else if (e.code === 131030) {
      friendly = "Número do destinatário não está na lista de permitidos " +
        "(modo de teste). Adicione-o em WhatsApp Manager → API Setup, ou " +
        "publique o app. " + friendly;
    } else if (e.code === 131049 || e.code === 131047) {
      friendly = "Limite de qualidade/entrega da Meta atingido pra esse " +
        "número no momento. " + friendly;
    } else if (e.code === 80007 || status === 429) {
      friendly = "Limite de envio (rate limit) da Meta atingido — reduza o " +
        "ritmo/volume. " + friendly;
    }
  } catch (_) { /* corpo não-JSON — usa o texto cru */ }
  return friendly;
}

// Envia uma mensagem de TEMPLATE aprovado pela Cloud API.
//   phone       → normalizado (55DDNXXXXXXXX)
//   templateName→ nome do template aprovado na Meta
//   languageCode→ ex.: "pt_BR"
//   bodyParams  → valores das variáveis do corpo, em ordem ({{1}}, {{2}}…)
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
): Promise<WaResult> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return {
      ok: false,
      skipped: true,
      error:
        "WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN ausentes nos secrets " +
        "do Supabase. Cadastre em Edge Functions → Secrets e faça redeploy.",
    };
  }

  const url = `${GRAPH_BASE}/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const components = bodyParams.length
    ? [{
      type: "body",
      parameters: bodyParams.map((t) => ({ type: "text", text: String(t ?? "") })),
    }]
    : [];

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[elarah/whatsapp] Cloud API rejeitou o envio —",
        "status=" + res.status,
        "phone=" + phone,
        "template=" + templateName,
        "body=" + text.slice(0, 600),
      );
      return { ok: false, status: res.status, error: friendlyMetaError(res.status, text) };
    }

    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const messages = (data as { messages?: Array<{ id?: string }> }).messages;
    const id = messages && messages[0] ? messages[0].id : undefined;
    return { ok: true, status: res.status, id };
  } catch (e) {
    console.error("[elarah/whatsapp] exceção durante envio", e);
    return { ok: false, error: String(e) };
  }
}
