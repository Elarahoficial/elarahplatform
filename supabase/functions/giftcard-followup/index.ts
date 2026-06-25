// =============================================================
// ELARAH — giftcard-followup Edge Function
// -------------------------------------------------------------
// POST /functions/v1/giftcard-followup
//
// Dispara e-mail de follow-up pra COMPRADOR de gift card "pendente"
// (começou a compra mas não concluiu o pagamento). Dois modos:
//
//  1) MANUAL (admin) — chamado pelo modal "Follow-up por e-mail" no
//     admin. Autoriza pelo JWT do admin (Authorization: Bearer ...).
//     Body:
//       {
//         "gift_card_ids": ["uuid", ...],   // obrigatório
//         "to": "buyer" | "recipient" | "both",  // default buyer
//         "custom_message": "texto opcional"
//       }
//
//  2) AUTOMÁTICO (cron) — chamado por um agendamento (pg_cron /
//     Supabase Scheduled Function / qualquer scheduler externo).
//     Autoriza por um segredo no header:
//       X-Cron-Secret: <CRON_SECRET configurado em Secrets>
//     Body (todos opcionais):
//       {
//         "mode": "auto",
//         "min_age_hours": 48,        // só cutuca compras com 48h+
//         "resend_after_hours": 72,   // espaça reenvios em 72h
//         "max_followups": 2,         // no máximo 2 cutucadas por card
//         "limit": 50                 // teto de envios por execução
//       }
//
// Resposta:
//   { ok: true, sent: N, failed: M, results: [ { id, email, ok, ... } ] }
//
// Marca em gift_cards: followup_sent_at, followup_count (+1),
// followup_last_to. Requer rodar sql/elarah_giftcard_followup_tracking.sql.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";
import { giftCardFollowupEmailHtml, sendEmail } from "../_shared/email.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const FINISH_URL = Deno.env.get("ELARAH_GIFTCARD_FINISH_URL") ??
  "https://elarah.com.br/presentear.html";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface GiftCardRow {
  id: string;
  status: string;
  comprador_nome: string | null;
  comprador_email: string | null;
  destinatario_nome: string | null;
  destinatario_email: string | null;
  valor_inicial_centavos: number | null;
  followup_count: number | null;
  followup_sent_at: string | null;
  created_at: string | null;
}

// Decide pra qual(is) e-mail(s) mandar, conforme o destino pedido.
// Sempre cai pro outro lado se o preferido não existe — melhor mandar
// pro destinatário do que não mandar nada.
function resolveTargets(
  row: GiftCardRow,
  to: string,
): Array<{ email: string; name: string | null; isBuyer: boolean }> {
  const buyer = row.comprador_email
    ? { email: row.comprador_email, name: row.comprador_nome, isBuyer: true }
    : null;
  const recipient = row.destinatario_email
    ? { email: row.destinatario_email, name: row.destinatario_nome, isBuyer: false }
    : null;

  let chosen: Array<{ email: string; name: string | null; isBuyer: boolean }>;
  if (to === "both") chosen = [buyer, recipient].filter(Boolean) as never[];
  else if (to === "recipient") chosen = [recipient || buyer].filter(Boolean) as never[];
  // default: buyer (com fallback pro recipient)
  else chosen = [buyer || recipient].filter(Boolean) as never[];

  // Dedupe por e-mail (comprador e destinatário às vezes são o mesmo).
  const seen = new Set<string>();
  return chosen.filter((t) => {
    const key = t.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Envia o follow-up de UM gift card e atualiza o tracking. Best-effort:
// nunca relança — devolve o resultado pra agregação.
async function followupOne(
  row: GiftCardRow,
  to: string,
  customMessage: string | null,
): Promise<{ id: string; email: string | null; ok: boolean; error?: string; skipped?: boolean }> {
  if (row.status !== "pending") {
    return { id: row.id, email: null, ok: false, skipped: true, error: "not_pending" };
  }
  const targets = resolveTargets(row, to);
  if (!targets.length) {
    return { id: row.id, email: null, ok: false, skipped: true, error: "no_email" };
  }

  const sb = getServiceClient();
  let anyOk = false;
  let lastEmail: string | null = null;
  let lastError: string | undefined;

  for (const t of targets) {
    lastEmail = t.email;
    const html = giftCardFollowupEmailHtml({
      buyerName: t.isBuyer ? row.comprador_nome : null,
      recipientName: row.destinatario_nome,
      valorCentavos: row.valor_inicial_centavos,
      customMessage,
      finishUrl: FINISH_URL,
    });
    const res = await sendEmail({
      to: t.email,
      subject: "Seu gift card da Elarah está quase pronto 💛",
      html,
    });
    if (res.ok) anyOk = true;
    else lastError = res.error || `status_${res.status ?? "?"}`;
  }

  if (anyOk) {
    const { error: upErr } = await sb
      .from("gift_cards")
      .update({
        followup_sent_at: new Date().toISOString(),
        followup_count: (Number(row.followup_count) || 0) + 1,
        followup_last_to: lastEmail,
      })
      .eq("id", row.id);
    if (upErr) {
      console.error("[giftcard-followup] envio OK mas update falhou", row.id, upErr.message);
    }
    return { id: row.id, email: lastEmail, ok: true };
  }
  return { id: row.id, email: lastEmail, ok: false, error: lastError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const to = ["buyer", "recipient", "both"].includes(String(body.to))
    ? String(body.to)
    : "buyer";
  const customMessage = body.custom_message
    ? String(body.custom_message).slice(0, 600)
    : null;

  // ===== Autorização: admin (JWT) OU cron (segredo) =====
  const cronHeader = req.headers.get("x-cron-secret");
  const isCron = body.mode === "auto" || !!cronHeader;
  const sb = getServiceClient();

  if (isCron) {
    if (!CRON_SECRET || cronHeader !== CRON_SECRET) {
      return jsonResponse({ ok: false, error: "unauthorized_cron" }, 401);
    }
    // ----- Seleção dos candidatos -----
    const minAgeHours = Number(body.min_age_hours ?? 48);
    const resendAfterHours = Number(body.resend_after_hours ?? 72);
    const maxFollowups = Number(body.max_followups ?? 2);
    const limit = Math.min(Number(body.limit ?? 50) || 50, 200);

    const now = Date.now();
    const ageCutoff = new Date(now - minAgeHours * 3600 * 1000).toISOString();

    const { data, error } = await sb
      .from("gift_cards")
      .select(
        "id,status,comprador_nome,comprador_email,destinatario_nome,destinatario_email,valor_inicial_centavos,followup_count,followup_sent_at,created_at",
      )
      .eq("status", "pending")
      .lte("created_at", ageCutoff)
      .lt("followup_count", maxFollowups)
      .order("created_at", { ascending: true })
      .limit(limit * 2); // pega folga, filtra janela de reenvio no JS

    if (error) {
      console.error("[giftcard-followup] auto select error", error.message);
      return jsonResponse({ ok: false, error: "select_failed" }, 500);
    }

    const resendCutoff = now - resendAfterHours * 3600 * 1000;
    const candidates = (data as GiftCardRow[])
      .filter((r) =>
        !r.followup_sent_at || new Date(r.followup_sent_at).getTime() <= resendCutoff
      )
      .slice(0, limit);

    const results = [];
    for (const row of candidates) {
      results.push(await followupOne(row, to, customMessage));
    }
    const sent = results.filter((r) => r.ok).length;
    return jsonResponse({
      ok: true,
      mode: "auto",
      candidates: candidates.length,
      sent,
      failed: results.length - sent,
      results,
    });
  }

  // ----- Modo manual: exige admin -----
  const adminId = await authorizeAdmin(req.headers.get("authorization"));
  if (!adminId) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const ids = Array.isArray(body.gift_card_ids)
    ? (body.gift_card_ids as unknown[]).map((x) => String(x)).filter(Boolean)
    : (body.gift_card_id ? [String(body.gift_card_id)] : []);

  if (!ids.length) {
    return jsonResponse({ ok: false, error: "gift_card_ids_required" }, 400);
  }

  const { data, error } = await sb
    .from("gift_cards")
    .select(
      "id,status,comprador_nome,comprador_email,destinatario_nome,destinatario_email,valor_inicial_centavos,followup_count,followup_sent_at,created_at",
    )
    .in("id", ids);

  if (error) {
    console.error("[giftcard-followup] manual select error", error.message);
    return jsonResponse({ ok: false, error: "select_failed" }, 500);
  }

  const rows = (data as GiftCardRow[]) || [];
  const results = [];
  for (const row of rows) {
    results.push(await followupOne(row, to, customMessage));
  }
  // ids pedidos mas não encontrados no banco
  const foundIds = new Set(rows.map((r) => r.id));
  for (const id of ids) {
    if (!foundIds.has(id)) {
      results.push({ id, email: null, ok: false, skipped: true, error: "not_found" });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return jsonResponse({
    ok: true,
    mode: "manual",
    sent,
    failed: results.length - sent,
    results,
  });
});
