// =============================================================
// ELARAH — booking-followup Edge Function
// -------------------------------------------------------------
// POST /functions/v1/booking-followup
//
// Dispara e-mail de follow-up pra cliente que quase reservou uma
// experiência mas não concluiu o pagamento (booking status='pending').
// É o par por E-MAIL do botão de WhatsApp da aba "Compras Pendentes".
//
// Autoriza pelo JWT do admin (Authorization: Bearer ...). Compartilha o
// mesmo controle do follow-up por WhatsApp: avança followup_status
// (nenhum → primeiro_enviado → segundo_enviado) e grava o timestamp
// (followup_1_at / followup_2_at). Assim os badges da aba ficam certos
// independente do canal usado.
//
// Body:
//   {
//     "booking_ids": ["uuid", ...],     // obrigatório
//     "custom_message": "texto opcional"
//   }
//
// Resposta:
//   { ok: true, sent: N, failed: M, results: [ { id, email, ok, next_status } ] }
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";
import { bookingFollowupEmailHtml, sendEmail } from "../_shared/email.ts";

const SITE_URL = (Deno.env.get("PUBLIC_SITE_URL") ?? "https://elarah.com.br")
  .replace(/\/$/, "");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface BookingRow {
  id: string;
  email: string | null;
  nome: string | null;
  experiencia_id: string | null;
  experiencia_nome: string | null;
  data: string | null;
  horario: string | null;
  status: string | null;
  followup_status: string | null;
}

function nextFollowupStatus(current: string | null): { status: string; field: string } | null {
  const c = current || "nenhum";
  if (c === "nenhum") return { status: "primeiro_enviado", field: "followup_1_at" };
  if (c === "primeiro_enviado") return { status: "segundo_enviado", field: "followup_2_at" };
  // Já mandou os dois — não avança mais (mas ainda deixa reenviar e-mail).
  return null;
}

function finishUrlFor(row: BookingRow): string {
  if (row.experiencia_id) {
    return `${SITE_URL}/experiencia.html?id=${encodeURIComponent(row.experiencia_id)}`;
  }
  return SITE_URL;
}

async function followupOne(
  row: BookingRow,
  customMessage: string | null,
): Promise<{ id: string; email: string | null; ok: boolean; next_status?: string; error?: string; skipped?: boolean }> {
  if (row.status !== "pending") {
    return { id: row.id, email: row.email, ok: false, skipped: true, error: "not_pending" };
  }
  if (!row.email) {
    return { id: row.id, email: null, ok: false, skipped: true, error: "no_email" };
  }

  const html = bookingFollowupEmailHtml({
    nome: row.nome,
    experienciaNome: row.experiencia_nome,
    data: row.data,
    horario: row.horario,
    finishUrl: finishUrlFor(row),
    customMessage,
  });
  const subject = row.experiencia_nome
    ? `Sua vaga em ${row.experiencia_nome} ainda está te esperando ✨`
    : "Sua reserva na Elarah ainda está te esperando ✨";

  const res = await sendEmail({ to: row.email, subject, html });
  if (!res.ok) {
    return {
      id: row.id,
      email: row.email,
      ok: false,
      error: res.error || `status_${res.status ?? "?"}`,
    };
  }

  // Avança o follow-up (igual ao botão de WhatsApp). Se já estava no 2º,
  // o e-mail sai mesmo assim mas não regride/avança o status.
  const next = nextFollowupStatus(row.followup_status);
  if (next) {
    const sb = getServiceClient();
    const patch: Record<string, unknown> = { followup_status: next.status };
    patch[next.field] = new Date().toISOString();
    const { error: upErr } = await sb.from("bookings").update(patch).eq("id", row.id);
    if (upErr) {
      console.error("[booking-followup] envio OK mas update falhou", row.id, upErr.message);
    }
  }
  return { id: row.id, email: row.email, ok: true, next_status: next ? next.status : (row.followup_status || undefined) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  const adminId = await authorizeAdmin(req.headers.get("authorization"));
  if (!adminId) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const ids = Array.isArray(body.booking_ids)
    ? (body.booking_ids as unknown[]).map((x) => String(x)).filter(Boolean)
    : (body.booking_id ? [String(body.booking_id)] : []);
  if (!ids.length) {
    return jsonResponse({ ok: false, error: "booking_ids_required" }, 400);
  }
  const customMessage = body.custom_message
    ? String(body.custom_message).slice(0, 600)
    : null;

  const sb = getServiceClient();
  const { data, error } = await sb
    .from("bookings")
    .select("id,email,nome,experiencia_id,experiencia_nome,data,horario,status,followup_status")
    .in("id", ids);

  if (error) {
    console.error("[booking-followup] select error", error.message);
    return jsonResponse({ ok: false, error: "select_failed" }, 500);
  }

  const rows = (data as BookingRow[]) || [];
  const results = [];
  for (const row of rows) {
    results.push(await followupOne(row, customMessage));
  }
  const foundIds = new Set(rows.map((r) => r.id));
  for (const id of ids) {
    if (!foundIds.has(id)) {
      results.push({ id, email: null, ok: false, skipped: true, error: "not_found" });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return jsonResponse({
    ok: true,
    sent,
    failed: results.length - sent,
    results,
  });
});
