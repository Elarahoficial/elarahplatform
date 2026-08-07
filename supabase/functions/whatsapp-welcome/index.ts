// =============================================================
// ELARAH — whatsapp-welcome Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-welcome
//
// Dispara a mensagem de BOAS-VINDAS por WhatsApp (template oficial
// `elarah_boas_vindas_grupo`) logo que uma pessoa se cadastra,
// convidando pra entrar no grupo da Elarah — onde as novidades de
// experiências são anunciadas (estratégia: grupo em vez de disparo
// pago por pessoa).
//
// Chamado por um TRIGGER no banco (public.profiles AFTER INSERT) via
// pg_net — ver sql/elarah_whatsapp_welcome_trigger.sql. Como quem chama
// é o banco (sem JWT de usuário), esta função roda com verify_jwt=false
// e se protege com um segredo compartilhado (ELARAH_WEBHOOK_SECRET,
// enviado no header Authorization: Bearer).
//
// Body aceito (tolerante a formatos):
//   { "record": { "nome": "...", "telefone": "..." } }   (Database Webhook)
//   { "nome": "...", "telefone": "..." }                  (chamada direta)
//
// Template (variáveis, nesta ordem):
//   {{1}} = primeiro nome · {{2}} = link do grupo
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  normalizePhoneBR,
  sendWhatsAppTemplate,
  whatsappConfigured,
} from "../_shared/whatsapp.ts";

// Segredo compartilhado com o trigger do banco. Se não estiver setado,
// a função recusa tudo (fail-safe) pra não virar endpoint público.
const WEBHOOK_SECRET = Deno.env.get("ELARAH_WEBHOOK_SECRET") ??
  Deno.env.get("CRON_SECRET") ?? "";

// Link do grupo da Elarah (pode sobrescrever via secret). Default = o
// link atual usado no site.
const GROUP_LINK = Deno.env.get("WHATSAPP_GROUP_LINK") ??
  "https://chat.whatsapp.com/EKECUEVqH3DJo8rmdbYNLd";

const TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TPL_BOAS_VINDAS") ?? "elarah_boas_vindas_grupo",
  language: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Autorização: segredo compartilhado com o trigger do banco.
  if (!WEBHOOK_SECRET) {
    console.error("[Elarah whatsapp-welcome] ELARAH_WEBHOOK_SECRET não setado — recusando.");
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

  // Aceita { record: {...} } (Database Webhook) ou o objeto direto.
  const rec = (payload.record && typeof payload.record === "object"
    ? payload.record
    : payload) as Record<string, unknown>;

  const nome = String(rec.nome ?? "");
  const phone = normalizePhoneBR(String(rec.telefone ?? ""));

  if (!phone) {
    // Sem telefone válido não tem o que enviar — não é erro (o cadastro
    // segue normal). Só registra e sai.
    console.info(
      "[Elarah whatsapp-welcome] cadastro sem telefone válido — pulando boas-vindas.",
    );
    return jsonResponse({ ok: true, skipped: "sem_telefone" });
  }

  if (!whatsappConfigured()) {
    console.error("[Elarah whatsapp-welcome] WhatsApp não configurado (secrets ausentes).");
    return jsonResponse({ ok: false, error: "whatsapp_nao_configurado" }, 500);
  }

  const r = await sendWhatsAppTemplate(phone, TEMPLATE.name, TEMPLATE.language, [
    firstName(nome),
    GROUP_LINK,
  ]);

  if (!r.ok) {
    console.error(
      "[Elarah whatsapp-welcome] falha ao enviar boas-vindas —",
      "phone=" + phone,
      "status=" + (r.status ?? "?"),
      "error=" + (r.error ?? "?"),
    );
    // Não relança: um cadastro nunca deve quebrar por causa do WhatsApp.
    return jsonResponse({ ok: false, error: r.error ?? "falha_envio" }, 200);
  }

  console.info("[Elarah whatsapp-welcome] boas-vindas enviada —", "phone=" + phone);
  return jsonResponse({ ok: true, to: phone, template: TEMPLATE.name });
});
