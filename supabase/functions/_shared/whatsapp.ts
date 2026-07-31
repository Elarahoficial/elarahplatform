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

// Portão de segurança (lógica pura, fail-closed + idempotência). Ver
// _shared/whatsapp_gate.js. TODO envio automatizado passa por gatedSendWhatsApp.
import { gatedSend } from "./whatsapp_gate.js";

const ZAPI_BASE = Deno.env.get("ZAPI_BASE_URL") ?? "https://api.z-api.io";
const INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "";
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";

// DDDs válidos no Brasil (usado pra NUNCA coagir número estrangeiro/torto
// num BR plausível). DEFINIDO AQUI EM CIMA de propósito: normalizePhoneBR o
// usa, e TEST_ALLOWLIST (abaixo) chama normalizePhoneBR na carga do módulo —
// se VALID_DDDS ficasse depois, dava "Cannot access before initialization"
// (crash no boot de TODA função que importa este arquivo).
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

// ===== TRAVAS DE SEGURANÇA (fail-closed) =====
// KILL SWITCH + fail-closed: SÓ envia se WHATSAPP_SENDING_ENABLED === "true".
// Ausente/qualquer outro valor = DESLIGADO — nada sai até habilitar de
// propósito. (Antes era "ligado a menos que false"; agora é o contrário,
// pra manter tudo desligado até a liberação explícita.)
const SENDING_ENABLED =
  (Deno.env.get("WHATSAPP_SENDING_ENABLED") ?? "").trim().toLowerCase() === "true";
const SENDING_DISABLED = !SENDING_ENABLED;
// DRY-RUN: WHATSAPP_DRY_RUN = "true"/"1" → simula (loga) mas NÃO chama a Z-API.
const DRY_RUN = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_DRY_RUN") ?? "").trim().toLowerCase(),
);
// AMBIENTE: só "production" é produção. Fora disso (staging/preview/local),
// exige allowlist — assim um deploy de teste NUNCA atinge cliente real.
const IS_PROD =
  (Deno.env.get("WHATSAPP_ENV") ?? "").trim().toLowerCase() === "production";
// Allowlist de teste (números que PODEM receber fora de produção), por vírgula.
const TEST_ALLOWLIST = new Set(
  (Deno.env.get("WHATSAPP_TEST_ALLOWLIST") ?? "")
    .split(/[,\s]+/)
    .map((x) => normalizePhoneBR(x))
    .filter((x): x is string => !!x),
);

// MODO OBSERVAÇÃO: WHATSAPP_OBSERVE_MODE = "true" → roda tudo em produção,
// registra na whatsapp_send_log quem RECEBERIA, mas NÃO envia. Pra validar
// por dias antes de ligar de verdade.
const OBSERVE_MODE = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_OBSERVE_MODE") ?? "").trim().toLowerCase(),
);
// ROLLOUT ETAPA 1/2: WHATSAPP_ALLOWLIST_ONLY = "true" → mesmo em produção,
// só a allowlist recebe (só meu número → pequeno grupo).
const ALLOWLIST_ONLY = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_ALLOWLIST_ONLY") ?? "").trim().toLowerCase(),
);
// ROLLOUT ETAPA 3: WHATSAPP_ROLLOUT_PERCENT = 0..100 (fração de reservas
// reais liberada). Determinístico por dedupe_key.
// FAIL-CLOSED: ausente OU inválido (não-numérico) → 0 (NÃO envia). Nunca
// assume 100. Pra liberar geral é preciso setar WHATSAPP_ROLLOUT_PERCENT=100
// DE PROPÓSITO — mesmo princípio do kill switch (desligado por padrão).
const ROLLOUT_PERCENT = (() => {
  const raw = (Deno.env.get("WHATSAPP_ROLLOUT_PERCENT") ?? "").trim();
  if (raw === "") return 0; // ausente → fail-closed
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0; // inválido → fail-closed
  return Math.max(0, Math.min(100, n));
})();

export function whatsappSendingDisabled(): boolean {
  return SENDING_DISABLED;
}
export function whatsappDryRun(): boolean {
  return DRY_RUN;
}
export function whatsappIsProd(): boolean {
  return IS_PROD;
}
export function whatsappObserveMode(): boolean {
  return OBSERVE_MODE;
}
// True se o número (bruto) está na allowlist de teste. Usado pra travar o
// "testar no meu WhatsApp" — só números autorizados, nunca um estranho.
export function whatsappAllowlistHas(rawPhone: unknown): boolean {
  const p = normalizePhoneBR(typeof rawPhone === "string" ? rawPhone : String(rawPhone ?? ""));
  return !!p && TEST_ALLOWLIST.has(p);
}

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
    console.info("[elarah/whatsapp] DRY-RUN — NÃO enviado", "msg=" + message.slice(0, 80));
    return { ok: true, skipped: true, status: 0 };
  }
  // Backstop de ambiente: fora de produção, só número da allowlist. Vale até
  // pra chamadas diretas ao adaptador (ex.: teste), não só as gateadas.
  if (!IS_PROD && !TEST_ALLOWLIST.has(phone)) {
    console.warn("[elarah/whatsapp] fora de produção + fora da allowlist — bloqueado");
    return { ok: false, skipped: true, error: "staging_blocked" };
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
    console.info("[elarah/whatsapp] DRY-RUN imagem — NÃO enviada", "caption=" + (opts.caption ?? "").slice(0, 80));
    return { ok: true, skipped: true, status: 0 };
  }
  if (!IS_PROD && !TEST_ALLOWLIST.has(phone)) {
    console.warn("[elarah/whatsapp] imagem fora de produção + fora da allowlist — bloqueada");
    return { ok: false, skipped: true, error: "staging_blocked" };
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

interface MsgOpts {
  nome?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horario?: unknown;
  endereco?: unknown;
  bairro?: unknown;
}
function _linhaDataLocal(opts: MsgOpts): string[] {
  const out: string[] = [];
  const dataHora = [String(opts.data ?? "").trim(), String(opts.horario ?? "").trim()]
    .filter(Boolean).join(" · ");
  if (dataHora) out.push(`🗓️ ${dataHora}`);
  const local = [String(opts.endereco ?? "").trim(), String(opts.bairro ?? "").trim()]
    .filter(Boolean).join(" — ");
  if (local) out.push(`📍 ${local}`);
  return out;
}

// Lembrete 48h antes da experiência.
export function reminder48hWhatsAppText(opts: MsgOpts): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Sua experiência na Elarah é daqui a 2 dias 🧡`);
  linhas.push("");
  linhas.push(`*${exp}*`);
  linhas.push(..._linhaDataLocal(opts));
  linhas.push("");
  linhas.push("Tá tudo de pé pra você? Se precisar ajustar algo, é só responder por aqui. A gente te espera! ✨");
  return linhas.join("\n");
}

// Pós-compra / feedback (2 dias depois da experiência) — COM link de avaliação.
export function feedbackWhatsAppText(opts: MsgOpts & { link?: unknown }): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const link = String(opts.link ?? "").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Como foi a sua experiência? 🧡`);
  linhas.push("");
  linhas.push(`Queremos muito saber o que você achou de *${exp}* — leva 1 minutinho e ajuda demais a gente a melhorar.`);
  if (link) {
    linhas.push("");
    linhas.push(`⭐ Avaliar aqui: ${link}`);
  }
  linhas.push("");
  linhas.push("Obrigada por viver isso com a Elarah ✨");
  return linhas.join("\n");
}

// Recuperação de pendente (3–6h depois, se não pagou) — 1x só por reserva.
export function pendingRecoveryWhatsAppText(opts: MsgOpts): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "a experiência").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Vi que você começou a reservar *${exp}* e o pagamento não foi concluído 🙈`);
  linhas.push("");
  linhas.push("Sua vaga ainda pode estar disponível — quer que eu te ajude a finalizar? É só me responder por aqui. 🧡");
  const dl = _linhaDataLocal(opts);
  if (dl.length) { linhas.push(""); linhas.push(...dl); }
  return linhas.join("\n");
}

// ===== PORTÃO ÚNICO (idempotência + auditoria + fail-closed) =====
// deno-lint-ignore no-explicit-any
type SB = any;

export interface GatedResult extends WaResult {
  sent: boolean;
  reason: string | null;
}

// Envio gateado: reserva na whatsapp_send_log (UNIQUE) ANTES de chamar a
// Z-API. Sob concorrência, só UM reserva; os demais veem duplicate e não
// enviam. Qualquer erro/dúvida = não envia (fail-closed). Ver whatsapp_gate.js.
export async function gatedSendWhatsApp(
  supabase: SB,
  params: {
    kind: string;
    dedupeKey: string;
    identifierOk: boolean;
    rawPhone: unknown;
    suppressed: boolean | undefined;
    statusAllowed: boolean | undefined;
    message?: string;
    image?: string;
    caption?: string;
    bookingId?: string | null;
    experienciaId?: string | null;
    createdBy?: string | null;
  },
): Promise<GatedResult> {
  const deps = {
    config: {
      sendingDisabled: SENDING_DISABLED,
      dryRun: DRY_RUN,
      isProd: IS_PROD,
      allowlist: TEST_ALLOWLIST,
      observe: OBSERVE_MODE,
      allowlistOnly: ALLOWLIST_ONLY,
      rolloutPercent: ROLLOUT_PERCENT,
    },
    reserve: async (key: string, meta: Record<string, unknown>) => {
      const { error } = await supabase.from("whatsapp_send_log").insert({
        dedupe_key: key,
        kind: meta.kind ?? params.kind,
        booking_id: meta.booking_id ?? null,
        experiencia_id: meta.experiencia_id ?? null,
        phone_masked: meta.phone_masked ?? null,
        status: (meta.status as string) ?? "pending",
        created_by: params.createdBy ?? null,
      });
      if (!error) return { reserved: true };
      const code = (error as { code?: string }).code;
      if (code === "23505" || /duplicate key|unique/i.test(error.message ?? "")) {
        return { duplicate: true };
      }
      // Qualquer outro erro de banco → FAIL-CLOSED (não envia sem registrar).
      console.error("[whatsapp gate] reserve erro (fail-closed) —", key, error.message);
      return { error: true };
    },
    finalize: async (key: string, patch: Record<string, unknown>) => {
      await supabase.from("whatsapp_send_log")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("dedupe_key", key);
    },
    send: async (o: { phone: string; message?: string; image?: string; caption?: string }) => {
      if (o.image) return await sendWhatsAppImage({ to: o.phone, image: o.image, caption: o.caption });
      return await sendWhatsAppText({ to: o.phone, message: o.message ?? o.caption ?? "" });
    },
    log: (_level: string, _msg: string, _fields?: unknown) => {},
  };
  return (await gatedSend(deps, params)) as GatedResult;
}

// URL pública da foto da experiência (ou logo da Elarah como fallback).
const ELARAH_SITE = "https://elarah.com.br";
export function experienceImageUrl(rawImagem: unknown): string {
  const s = String(rawImagem ?? "").trim();
  if (!s) return ELARAH_SITE + "/assets/logo.png";
  if (/^https?:\/\//i.test(s)) return s;
  return ELARAH_SITE + "/" + s.replace(/^\/+/, "");
}

// Confirmação de reserva GATEADA — caminho ÚNICO das 4 funções de pagamento
// (stripe/mp/pagarme/check-mp). Calcula suppression e status aqui, fail-closed.
export async function sendBookingConfirmationGated(
  supabase: SB,
  // deno-lint-ignore no-explicit-any
  booking: any,
  meta: Record<string, unknown>,
): Promise<GatedResult> {
  const bookingId = String(booking?.id ?? "");
  // RELEITURA AUTORITATIVA (fail-closed): não confia no objeto que o webhook
  // trouxe (pode estar desatualizado). Busca status + aguardando_experiencia
  // + a foto da experiência AGORA. Se a leitura falhar → assume o pior.
  let statusAllowed = false;
  let aguardando: boolean = true;
  let imagem: string = ELARAH_SITE + "/assets/logo.png";
  if (bookingId) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("status, aguardando_experiencia, experiences(imagem)")
        .eq("id", bookingId)
        .maybeSingle();
      if (!error && data) {
        statusAllowed = data.status === "pago";
        aguardando = data.aguardando_experiencia === true ||
          (meta && (meta.aguardando_experiencia === true || meta.suppress_customer_messaging === true));
        const exp = (data as { experiences?: { imagem?: unknown } }).experiences;
        imagem = experienceImageUrl(exp?.imagem);
      }
    } catch (_e) {
      // fail-closed: mantém statusAllowed=false / aguardando=true
    }
  }
  const rawPhone = (meta?.telefone_digits as string | undefined) ?? booking?.telefone;
  const texto = bookingConfirmationWhatsAppText({
    nome: booking?.nome,
    experienciaNome: booking?.experiencia_nome ?? "Sua experiência",
    data: booking?.data,
    horario: booking?.horario,
    endereco: (meta?.endereco as string | null) ?? null,
    bairro: (meta?.bairro as string | null) ?? null,
    quantidade: booking?.quantidade ?? null,
  });
  return await gatedSendWhatsApp(supabase, {
    kind: "confirmation",
    dedupeKey: "confirmation:" + String(booking?.id ?? ""),
    identifierOk: !!booking?.id,
    rawPhone,
    suppressed: aguardando ? true : false,
    statusAllowed,
    image: imagem, // foto da experiência (cartão)
    caption: texto,
    message: texto,
    bookingId: booking?.id ?? null,
    experienciaId: booking?.experiencia_id ?? null,
  });
}
