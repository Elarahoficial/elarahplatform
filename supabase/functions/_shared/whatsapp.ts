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

// ===== TRAVAS DE SEGURANÇA (contra envio errado / em massa acidental) =====
// KILL SWITCH: WHATSAPP_SENDING_ENABLED = "false" desliga TODO envio na hora
// (botão de pânico). Ausente/qualquer outro valor = ligado (não quebra o que
// já funciona). Setar "false" nos Secrets bloqueia todos os disparos.
const SENDING_DISABLED =
  (Deno.env.get("WHATSAPP_SENDING_ENABLED") ?? "").trim().toLowerCase() === "false";
// DRY-RUN: WHATSAPP_DRY_RUN = "true"/"1" → simula (loga o destinatário e a
// mensagem) mas NÃO chama a Z-API. Pra validar quem receberia sem enviar nada.
const DRY_RUN = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_DRY_RUN") ?? "").trim().toLowerCase(),
);

export function whatsappSendingDisabled(): boolean {
  return SENDING_DISABLED;
}
export function whatsappDryRun(): boolean {
  return DRY_RUN;
}

// DDDs válidos no Brasil (usado pra NUNCA coagir número estrangeiro/torto
// num BR plausível — o que mandaria mensagem pra desconhecido).
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

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
// "+5511912345678", etc.
//
// SEGURANÇA (fix crítico): NUNCA coage um número estrangeiro/torto num BR
// plausível. Só devolve um número se ele for CLARAMENTE brasileiro válido
// (DDD real + formato de celular/fixo). Qualquer outra coisa → null (o
// chamador PULA o envio, em vez de mandar pra um desconhecido).
export function normalizePhoneBR(raw: string | null | undefined): string | null {
  let d = String(raw ?? "").replace(/\D+/g, "");
  if (!d) return null;
  // Remove o código do país 55 SÓ quando sobra um número nacional válido
  // (55 + 11 díg = 13, ou 55 + 10 díg = 12). Assim "5511..." vira "11...".
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2);
  else if (d.length === 12 && d.startsWith("55")) d = d.slice(2);
  // Agora precisa ser nacional: 11 dígitos (celular) ou 10 (fixo).
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = Number(d.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) return null;
  // Celular (11 díg): o 3º dígito é obrigatoriamente 9.
  if (d.length === 11 && d[2] !== "9") return null;
  // Fixo (10 díg): o 3º dígito vai de 2 a 5. (WhatsApp normalmente só entrega
  // em celular; fixo é aceito aqui mas a Z-API simplesmente não vai achar.)
  if (d.length === 10 && !/[2-5]/.test(d[2])) return null;
  return "55" + d;
}
// Alias — nome usado pelo fluxo de confirmação de reserva.
export const normalizeWhatsAppPhoneBR = normalizePhoneBR;

// Núcleo do envio (telefone JÁ normalizado em 55DDNXXXXXXXX).
async function sendTextCore(phone: string, message: string): Promise<WaResult> {
  if (SENDING_DISABLED) {
    console.warn("[elarah/whatsapp] KILL SWITCH ligado (WHATSAPP_SENDING_ENABLED=false) — envio bloqueado", "phone=" + phone);
    return { ok: false, skipped: true, error: "sending_disabled" };
  }
  if (DRY_RUN) {
    console.info("[elarah/whatsapp] DRY-RUN — NÃO enviado", "phone=" + phone, "msg=" + message.slice(0, 120));
    return { ok: true, skipped: true, status: 0 };
  }
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

// Envia uma imagem com legenda (caption) pela Z-API. `image` pode ser uma
// URL pública (ex.: foto da experiência) ou um data URI base64. Usado pelas
// mensagens que mostram a foto da experiência (ou o logo da Elarah).
export async function sendWhatsAppImage(opts: {
  to: unknown;
  image: string;
  caption?: string;
}): Promise<WaResult> {
  const phone = normalizePhoneBR(
    typeof opts.to === "string" ? opts.to : String(opts.to ?? ""),
  );
  if (!phone) return { ok: false, error: "invalid_phone" };
  if (SENDING_DISABLED) {
    console.warn("[elarah/whatsapp] KILL SWITCH ligado — imagem bloqueada", "phone=" + phone);
    return { ok: false, skipped: true, error: "sending_disabled" };
  }
  if (DRY_RUN) {
    console.info("[elarah/whatsapp] DRY-RUN imagem — NÃO enviada", "phone=" + phone, "caption=" + (opts.caption ?? "").slice(0, 120));
    return { ok: true, skipped: true, status: 0 };
  }
  if (!opts.image) {
    // Sem imagem: cai pro texto puro, pra não deixar de avisar o cliente.
    return sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
  }
  if (!INSTANCE || !TOKEN) {
    return { ok: false, skipped: true, error: "ZAPI_INSTANCE_ID/ZAPI_TOKEN ausentes." };
  }
  const url = `${ZAPI_BASE}/instances/${INSTANCE}/token/${TOKEN}/send-image`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, image: opts.image, caption: opts.caption ?? "" }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[elarah/whatsapp] Z-API send-image erro", "status=" + res.status, "body=" + text.slice(0, 300));
      // Fallback: se a imagem falhar (URL inacessível etc.), manda o texto.
      const fb = await sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
      return fb.ok ? fb : { ok: false, status: res.status, error: text.slice(0, 300) };
    }
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const id = (data as { messageId?: string }).messageId ?? (data as { id?: string }).id;
    return { ok: true, status: res.status, id };
  } catch (e) {
    console.error("[elarah/whatsapp] exceção send-image", e);
    // Fallback pro texto.
    return sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
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
