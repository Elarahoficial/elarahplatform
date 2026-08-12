// =============================================================
// ELARAH — whatsapp-confirmacao Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-confirmacao
//
// Manda a CONFIRMAÇÃO DE RESERVA por WhatsApp (template oficial
// `elarah_confirmacao_reserva`) assim que o pagamento é aprovado
// (booking.status vira 'pago').
//
// Chamado por um TRIGGER no banco (public.bookings, quando o status
// passa a 'pago') via pg_net — ver sql/elarah_whatsapp_confirmacao_trigger.sql.
// Como quem chama é o banco (sem JWT de usuário), roda com
// verify_jwt=false e se protege com o segredo compartilhado
// ELARAH_WEBHOOK_SECRET (header Authorization: Bearer) — o MESMO da
// boas-vindas.
//
// Body aceito (tolerante a formatos):
//   { "record": { "nome", "telefone", "experiencia_nome", "data", "horario" } }
//   { "nome", "telefone", "experiencia_nome", "data", "horario" }
//
// Template (variáveis, nesta ordem):
//   {{1}} = primeiro nome · {{2}} = experiência · {{3}} = data · {{4}} = horário
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  normalizePhoneBR,
  sendWhatsAppTemplate,
  whatsappConfigured,
} from "../_shared/whatsapp.ts";

const WEBHOOK_SECRET = Deno.env.get("ELARAH_WEBHOOK_SECRET") ??
  Deno.env.get("CRON_SECRET") ?? "";

const TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TPL_CONFIRMACAO") ?? "elarah_confirmacao_reserva",
  language: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR",
};

// Base pública do site (onde ficam as fotos em /assets/...).
const SITE_BASE = (Deno.env.get("ELARAH_SITE_BASE") ?? "https://elarah.com.br")
  .replace(/\/+$/, "");
// Foto "reserva": usada quando a experiência não tem imagem cadastrada,
// pra Meta nunca recusar por falta de imagem no cabeçalho.
const FALLBACK_IMG = Deno.env.get("WHATSAPP_CONFIRMACAO_FALLBACK_IMG") ??
  `${SITE_BASE}/assets/logo.png`;

// Chave de segurança pra transição: SÓ manda imagem no cabeçalho quando
// WHATSAPP_CONFIRMACAO_FOTO=1 nos secrets. Enquanto o template na Meta
// ainda for SÓ TEXTO, deixe desligado (default) — assim publicar este
// código não quebra o envio atual. Ligue a chave DEPOIS que o template
// for reaprovado COM header de imagem.
const HEADER_IMG_ON = (Deno.env.get("WHATSAPP_CONFIRMACAO_FOTO") ?? "") === "1";

// Transforma o valor de experiences.imagem numa URL pública https completa,
// replicando a normalização do site (script.js):
//   - http(s):// → usa como está
//   - /caminho   → SITE_BASE + caminho
//   - "arquivo.jpg" ou "assets/arquivo.jpg" → SITE_BASE + assets/arquivo.jpg
// Sem acento e minúsculo no nome do arquivo (convenção do /assets).
// Vazio/invalid → foto reserva (logo).
function experienceImageUrl(raw: unknown): string {
  let s = String(raw ?? "").trim();
  if (!s) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return SITE_BASE + s;
  s = s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const slash = s.lastIndexOf("/");
  const dir = slash >= 0 ? s.slice(0, slash + 1) : "";
  const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
  const path = /^(assets|images|img)\//i.test(s)
    ? dir.toLowerCase() + file
    : "assets/" + file;
  return `${SITE_BASE}/${path}`;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function firstName(full: string | null | undefined): string {
  const t = String(full ?? "").trim();
  if (!t) return "tudo bem";
  return t.split(/\s+/)[0];
}

// Valores de texto livre podem vir vazios — dá um fallback neutro pra
// nunca mandar a variável em branco (a Meta rejeita corpo vazio).
function orDash(v: unknown, fallback: string): string {
  const t = String(v ?? "").trim();
  return t || fallback;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Autorização: segredo compartilhado com o trigger do banco.
  if (!WEBHOOK_SECRET) {
    console.error("[Elarah whatsapp-confirmacao] ELARAH_WEBHOOK_SECRET não setado — recusando.");
    return jsonResponse({ ok: false, error: "nao_configurado" }, 500);
  }
  const auth = req.headers.get("Authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m || m[1] !== WEBHOOK_SECRET) {
    return jsonResponse({ ok: false, error: "nao_autorizado" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const rec = (payload.record && typeof payload.record === "object"
    ? payload.record
    : payload) as Record<string, unknown>;

  const nome = String(rec.nome ?? "");
  const phone = normalizePhoneBR(String(rec.telefone ?? ""));
  const experiencia = orDash(rec.experiencia_nome, "sua experiência");
  const data = orDash(rec.data, "a combinar");
  const horario = orDash(rec.horario, "a combinar");
  // Foto da experiência pro cabeçalho (real quando cadastrada; senão logo).
  const fotoUrl = experienceImageUrl(rec.foto);

  if (!phone) {
    console.info(
      "[Elarah whatsapp-confirmacao] reserva sem telefone válido — pulando confirmação.",
    );
    return jsonResponse({ ok: true, skipped: "sem_telefone" });
  }

  if (!whatsappConfigured()) {
    console.error("[Elarah whatsapp-confirmacao] WhatsApp não configurado (secrets ausentes).");
    return jsonResponse({ ok: false, error: "whatsapp_nao_configurado" }, 500);
  }

  const r = await sendWhatsAppTemplate(phone, TEMPLATE.name, TEMPLATE.language, [
    firstName(nome),
    experiencia,
    data,
    horario,
  ], HEADER_IMG_ON ? fotoUrl : undefined);

  if (!r.ok) {
    console.error(
      "[Elarah whatsapp-confirmacao] falha ao enviar confirmação —",
      "phone=" + phone,
      "status=" + (r.status ?? "?"),
      "error=" + (r.error ?? "?"),
    );
    // Não relança: um pagamento nunca deve quebrar por causa do WhatsApp.
    return jsonResponse({ ok: false, error: r.error ?? "falha_envio" }, 200);
  }

  console.info("[Elarah whatsapp-confirmacao] confirmação enviada —", "phone=" + phone);
  return jsonResponse({ ok: true, to: phone, template: TEMPLATE.name });
});
