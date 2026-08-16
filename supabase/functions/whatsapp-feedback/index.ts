// =============================================================
// ELARAH — whatsapp-feedback Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-feedback
//
// Pedido de avaliação por WhatsApp (template oficial `elarah_feedback`),
// no dia seguinte à experiência (D+1). Manda UMA vez por reserva.
// Complementa (não substitui) o pedido por e-mail que já existe — usa
// EXATAMENTE o mesmo link/token de avaliar.html, então cai na mesma
// página segura.
//
// Disparado por um CRON diário via pg_net — ver
// sql/elarah_whatsapp_feedback_cron.sql. Autentica com o segredo
// compartilhado (Authorization: Bearer ELARAH_WEBHOOK_SECRET) OU admin.
//
// A seleção "experiência foi ontem" é feita no BANCO (RPC
// public.elarah_due_feedback), juntando experience_slots.event_at no
// fuso de Brasília. Marca whatsapp_feedback_sent_at só no sucesso.
//
// Template (variáveis, nesta ordem):
//   {{1}} = primeiro nome · {{2}} = experiência · {{3}} = link de avaliação
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import {
  normalizePhoneBR,
  sendWhatsAppTemplate,
  whatsappConfigured,
} from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("ELARAH_WEBHOOK_SECRET") ??
  Deno.env.get("CRON_SECRET") ?? "";
const SITE_BASE = (Deno.env.get("ELARAH_SITE_BASE") ?? "https://elarah.com.br")
  .replace(/\/+$/, "");

// Segredo que assina o token do link de avaliação. TEM QUE SER O MESMO
// que a função `reviews` usa (mesma ordem de precedência), senão o token
// não valida em avaliar.html.
const TOKEN_SECRET = Deno.env.get("BROADCAST_SECRET") ||
  Deno.env.get("CRON_SECRET") || SERVICE_ROLE || "elarah-fallback-secret";

const TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TPL_FEEDBACK") ?? "elarah_feedback",
  language: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR",
};

const DELAY_MS = 120;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function firstName(full: string | null | undefined): string {
  const t = String(full ?? "").trim();
  if (!t) return "tudo bem";
  return t.split(/\s+/)[0];
}

// Mesmo token da função `reviews`: HMAC-SHA256("review:"+id) em hex.
async function tokenFor(bookingId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("review:" + bookingId),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function linkAvaliacao(bookingId: string): Promise<string> {
  const t = await tokenFor(bookingId);
  return `${SITE_BASE}/avaliar.html?b=${encodeURIComponent(bookingId)}&t=${t}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = (/^Bearer\s+(.+)$/i.exec(authHeader) || [])[1] || "";
  let authorized = WEBHOOK_SECRET !== "" && bearer === WEBHOOK_SECRET;
  if (!authorized) authorized = !!(await authorizeAdmin(authHeader));
  if (!authorized) return jsonResponse({ ok: false, error: "nao_autorizado" }, 401);

  if (!whatsappConfigured()) {
    return jsonResponse({ ok: false, error: "whatsapp_nao_configurado" }, 500);
  }

  // MODO TESTE: { test_to: "55..." } manda UMA mensagem só pra esse número
  // (link real de exemplo) e sai — não toca em nenhuma reserva real.
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* corpo vazio ok */ }
  if (body.test_to) {
    const tp = normalizePhoneBR(String(body.test_to));
    if (!tp) return jsonResponse({ ok: false, error: "test_to_invalido" }, 400);
    const link = await linkAvaliacao(String(body.test_booking_id ?? "teste-0000"));
    const r = await sendWhatsAppTemplate(tp, TEMPLATE.name, TEMPLATE.language, [
      String(body.test_nome ?? "Maria"),
      String(body.test_experiencia ?? "Oficina de Perfumaria"),
      link,
    ]);
    return jsonResponse({ ok: r.ok, teste: true, to: tp, error: r.error });
  }

  // Quem teve experiência ONTEM (conta feita no banco).
  let candidatos: Array<Record<string, unknown>>;
  try {
    const { data, error } = await supabase.rpc("elarah_due_feedback");
    if (error) throw error;
    candidatos = (data as Array<Record<string, unknown>>) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/elarah_due_feedback|does not exist|function/i.test(msg)) {
      return jsonResponse({
        ok: false,
        error: "rpc_ausente",
        detail: "Rode sql/elarah_whatsapp_feedback_cron.sql no Supabase.",
      }, 500);
    }
    return jsonResponse({ ok: false, error: "db_error", detail: msg }, 500);
  }

  let enviados = 0;
  let falharam = 0;
  let semTelefone = 0;

  for (let i = 0; i < candidatos.length; i++) {
    const b = candidatos[i];
    const phone = normalizePhoneBR(b.telefone as string | null);
    if (!phone) { semTelefone++; continue; }

    const link = await linkAvaliacao(b.id as string);
    const r = await sendWhatsAppTemplate(phone, TEMPLATE.name, TEMPLATE.language, [
      firstName(b.nome as string | null),
      String(b.experiencia_nome ?? "sua experiência").trim() || "sua experiência",
      link,
    ]);

    if (r.ok) {
      enviados++;
      try {
        await supabase.from("bookings")
          .update({ whatsapp_feedback_sent_at: new Date().toISOString() })
          .eq("id", b.id as string);
      } catch (e) {
        console.warn("[whatsapp-feedback] envio ok, marca falhou —", b.id, String(e));
      }
    } else {
      falharam++;
      console.error(
        "[whatsapp-feedback] falha —",
        "booking=" + b.id, "status=" + (r.status ?? "?"), "error=" + (r.error ?? "?"),
      );
    }
    if (i < candidatos.length - 1) await sleep(DELAY_MS);
  }

  console.info(
    "[whatsapp-feedback] lote —",
    "candidatos=" + candidatos.length, "enviados=" + enviados,
    "falharam=" + falharam, "sem_telefone=" + semTelefone,
  );

  return jsonResponse({
    ok: true,
    candidatos: candidatos.length,
    enviados,
    falharam,
    sem_telefone: semTelefone,
    template: TEMPLATE.name,
  });
});
