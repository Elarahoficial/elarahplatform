// =============================================================
// ELARAH — whatsapp-lembrete Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-lembrete
//
// Lembrete carinhoso 2 dias antes da experiência (template oficial
// `elarah_lembrete_2dias`). Manda UMA vez por reserva.
//
// Disparado por um CRON diário via pg_net — ver
// sql/elarah_whatsapp_lembrete_cron.sql. Autentica com o segredo
// compartilhado (Authorization: Bearer ELARAH_WEBHOOK_SECRET) OU admin.
//
// A seleção de "quem tem experiência daqui a 2 dias" é feita no BANCO
// (RPC public.elarah_due_lembrete), que junta bookings + experience_slots
// e calcula a data no fuso de Brasília — assim nunca erra o dia por
// causa de fuso ou de data em texto livre. Marca lembrete_2dias_sent_at
// só quando o envio dá certo.
//
// Template (variáveis, nesta ordem):
//   {{1}} = primeiro nome · {{2}} = experiência · {{3}} = data · {{4}} = horário
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

const TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TPL_LEMBRETE") ?? "elarah_lembrete_2dias",
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

function orDash(v: unknown, fallback: string): string {
  const t = String(v ?? "").trim();
  return t || fallback;
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

  // Quem tem experiência daqui a 2 dias (conta feita no banco).
  let candidatos: Array<Record<string, unknown>>;
  try {
    const { data, error } = await supabase.rpc("elarah_due_lembrete");
    if (error) throw error;
    candidatos = (data as Array<Record<string, unknown>>) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/elarah_due_lembrete|does not exist|function/i.test(msg)) {
      return jsonResponse({
        ok: false,
        error: "rpc_ausente",
        detail: "Rode sql/elarah_whatsapp_lembrete_cron.sql no Supabase.",
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

    const r = await sendWhatsAppTemplate(phone, TEMPLATE.name, TEMPLATE.language, [
      firstName(b.nome as string | null),
      orDash(b.experiencia_nome, "sua experiência"),
      orDash(b.data, "em breve"),
      orDash(b.horario, "a combinar"),
    ]);

    if (r.ok) {
      enviados++;
      try {
        await supabase.from("bookings")
          .update({ lembrete_2dias_sent_at: new Date().toISOString() })
          .eq("id", b.id as string);
      } catch (e) {
        console.warn("[whatsapp-lembrete] envio ok, marca falhou —", b.id, String(e));
      }
    } else {
      falharam++;
      console.error(
        "[whatsapp-lembrete] falha —",
        "booking=" + b.id, "status=" + (r.status ?? "?"), "error=" + (r.error ?? "?"),
      );
    }
    if (i < candidatos.length - 1) await sleep(DELAY_MS);
  }

  console.info(
    "[whatsapp-lembrete] lote —",
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
