// =============================================================
// ELARAH — whatsapp-pendente Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-pendente
//
// Recuperação de venda: manda um lembrete por WhatsApp (template
// oficial `elarah_pagamento_pendente`) pra quem começou a reserva mas
// deixou o pagamento PENDENTE. Manda UMA vez por reserva, só depois de
// um tempinho (pra não cobrar quem ainda está finalizando).
//
// Disparado por um CRON diário/horário via pg_net — ver
// sql/elarah_whatsapp_pendente_cron.sql. Autentica com o segredo
// compartilhado (Authorization: Bearer ELARAH_WEBHOOK_SECRET) OU admin.
//
// Controle de "já mandou": colunas followup_status / followup_1_at em
// public.bookings (sql/elarah_bookings_followup.sql). Marca
// 'primeiro_enviado' só quando o envio dá certo.
//
// Template (variáveis, nesta ordem):
//   {{1}} = primeiro nome · {{2}} = experiência · {{3}} = link p/ concluir
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

const TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TPL_PENDENTE") ?? "elarah_pagamento_pendente",
  language: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR",
};

// Espera mínima antes de cobrar (minutos) e janela máxima (dias) — não
// cobra reserva antiga demais.
const MIN_IDADE_MIN = Number(Deno.env.get("PENDENTE_MIN_IDADE_MIN") ?? "30");
const MAX_IDADE_DIAS = Number(Deno.env.get("PENDENTE_MAX_IDADE_DIAS") ?? "3");
const MAX_BATCH = 200;
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

// Link pra concluir: a página da experiência (onde dá pra refazer o
// checkout). Sem experiencia_id, cai na home.
function linkConcluir(experienciaId: string | null | undefined): string {
  return experienciaId
    ? `${SITE_BASE}/experiencia.html?id=${experienciaId}`
    : SITE_BASE;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Auth: segredo compartilhado OU admin.
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = (/^Bearer\s+(.+)$/i.exec(authHeader) || [])[1] || "";
  let authorized = WEBHOOK_SECRET !== "" && bearer === WEBHOOK_SECRET;
  if (!authorized) authorized = !!(await authorizeAdmin(authHeader));
  if (!authorized) return jsonResponse({ ok: false, error: "nao_autorizado" }, 401);

  if (!whatsappConfigured()) {
    return jsonResponse({ ok: false, error: "whatsapp_nao_configurado" }, 500);
  }

  // MODO TESTE: se vier { test_to: "55..." } no corpo, manda UMA mensagem
  // só pra esse número (com dados de exemplo) e sai — não toca em nenhuma
  // reserva real. Pra a Elarah ver a mensagem no próprio WhatsApp.
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* corpo vazio ok */ }
  if (body.test_to) {
    const tp = normalizePhoneBR(String(body.test_to));
    if (!tp) return jsonResponse({ ok: false, error: "test_to_invalido" }, 400);
    const r = await sendWhatsAppTemplate(tp, TEMPLATE.name, TEMPLATE.language, [
      String(body.test_nome ?? "Maria"),
      String(body.test_experiencia ?? "Oficina de Perfumaria"),
      linkConcluir(null),
    ]);
    return jsonResponse({ ok: r.ok, teste: true, to: tp, error: r.error });
  }

  const agora = Date.now();
  const teto = new Date(agora - MIN_IDADE_MIN * 60_000).toISOString();
  const piso = new Date(agora - MAX_IDADE_DIAS * 86_400_000).toISOString();

  // Reservas pendentes, na janela, que ainda não receberam follow-up.
  let candidatos: Array<Record<string, unknown>>;
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, nome, telefone, experiencia_id, experiencia_nome, created_at, followup_status")
      .eq("status", "pending")
      .eq("followup_status", "nenhum")
      .not("telefone", "is", null)
      .neq("telefone", "")
      .gte("created_at", piso)
      .lte("created_at", teto)
      .order("created_at", { ascending: true })
      .limit(MAX_BATCH);
    if (error) throw error;
    candidatos = data ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/followup_status/i.test(msg)) {
      return jsonResponse({
        ok: false,
        error: "coluna_ausente",
        detail: "Rode sql/elarah_bookings_followup.sql no Supabase.",
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
      String(b.experiencia_nome ?? "sua experiência").trim() || "sua experiência",
      linkConcluir(b.experiencia_id as string | null),
    ]);

    if (r.ok) {
      enviados++;
      try {
        await supabase.from("bookings")
          .update({ followup_status: "primeiro_enviado", followup_1_at: new Date().toISOString() })
          .eq("id", b.id as string);
      } catch (e) {
        console.warn("[whatsapp-pendente] envio ok, marca falhou —", b.id, String(e));
      }
    } else {
      falharam++;
      console.error(
        "[whatsapp-pendente] falha —",
        "booking=" + b.id, "status=" + (r.status ?? "?"), "error=" + (r.error ?? "?"),
      );
    }
    if (i < candidatos.length - 1) await sleep(DELAY_MS);
  }

  console.info(
    "[whatsapp-pendente] lote —",
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
