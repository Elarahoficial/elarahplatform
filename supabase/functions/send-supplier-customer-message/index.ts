// =============================================================
// ELARAH — send-supplier-customer-message Edge Function
// -------------------------------------------------------------
// POST /functions/v1/send-supplier-customer-message
//
// Envia pro CLIENTE a mensagem pós-compra específica de um fornecedor
// com fluxo dedicado (BaresSp / Lado B). O conteúdo vem de
// _shared/email.ts (supplierCustomerMessage) — mesma fonte da verdade
// do texto que o painel usa pro WhatsApp, então e-mail e WhatsApp
// dizem exatamente a mesma coisa.
//
// Chamado por admin.js (botão "Enviar e-mail" na lista de Compras).
// Exige JWT válido (verify_jwt=true, default) — só admin autenticada
// consegue disparar.
//
// Body JSON:
//   { "booking_id": "uuid", "fornecedor_nome": "BaresSp" (opcional) }
//
// O fornecedor é resolvido no servidor a partir da reserva
// (fornecedor_nome + repasses[]); `fornecedor_nome` no body entra só
// como candidato extra (o painel já resolveu o nome exibido). Se
// nenhum candidato casar com um fornecedor de fluxo dedicado, devolve
// 422 sem enviar nada.
//
// Resposta: { ok: true, to, label } ou { ok: false, error }.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  explainEmailFailure,
  isCustomerMessagingSuppressed,
  sendEmail,
  supplierCustomerMessage,
  supplierCustomerMessageHtml,
} from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const bookingId = String(payload.booking_id ?? "").trim();
  if (!bookingId) {
    return jsonResponse({ ok: false, error: "missing_booking_id" }, 400);
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error(
      "[Elarah supplier-msg] erro ao ler booking",
      "booking_id=" + bookingId,
      "error=" + error.message,
    );
    return jsonResponse({ ok: false, error: "db_error", detail: error.message }, 500);
  }
  if (!booking) {
    return jsonResponse({ ok: false, error: "booking_not_found" }, 404);
  }
  if (!booking.email) {
    return jsonResponse({ ok: false, error: "booking_sem_email" }, 422);
  }
  // Reserva "aguardando experiência" não recebe nenhuma mensagem — inclui
  // a mensagem pós-compra do fornecedor. Guarda no servidor.
  if (isCustomerMessagingSuppressed(booking)) {
    console.info(
      "[Elarah supplier-msg] envio bloqueado (aguardando_experiencia)",
      "booking_id=" + booking.id,
    );
    return jsonResponse({ ok: false, error: "aguardando_experiencia" }, 409);
  }

  // Candidatos de nome do fornecedor: o que o painel exibia (body) +
  // fornecedor_nome da reserva + os nomes do snapshot repasses[].
  // Basta um casar com BaresSp / Lado B.
  //
  // repasses[] é o snapshot gravado no CHECKOUT e fica velho quando a
  // admin troca o fornecedor da reserva no painel. Por isso ele só entra
  // como candidato quando é de fato multi-fornecedor (2+ itens); com 1
  // fornecedor manda o fornecedor_nome atual, senão o fluxo da parceira
  // ANTIGA podia ser escolhido pra uma reserva já trocada.
  const candidatos: string[] = [];
  const bodyForn = String(payload.fornecedor_nome ?? "").trim();
  if (bodyForn) candidatos.push(bodyForn);
  if (booking.fornecedor_nome) candidatos.push(String(booking.fornecedor_nome));
  if (Array.isArray(booking.repasses) && booking.repasses.length > 1) {
    for (const r of booking.repasses) {
      if (r && (r as { fornecedor_nome?: string }).fornecedor_nome) {
        candidatos.push(String((r as { fornecedor_nome?: string }).fornecedor_nome));
      }
    }
  }

  const primeiroNome = String(booking.nome ?? "").trim().split(/\s+/)[0] || "";
  let msg = null;
  for (const nome of candidatos) {
    msg = supplierCustomerMessage(nome, primeiroNome);
    if (msg) break;
  }
  if (!msg) {
    return jsonResponse({ ok: false, error: "fornecedor_sem_fluxo" }, 422);
  }

  const result = await sendEmail({
    to: booking.email,
    subject: msg.subject,
    html: supplierCustomerMessageHtml(msg),
  });

  if (!result.ok) {
    console.error(
      "[Elarah supplier-msg] envio de e-mail falhou",
      "booking_id=" + booking.id,
      "to=" + booking.email,
      "fornecedor=" + msg.label,
      "status=" + (result.status ?? "?"),
      "error=" + (result.error ?? "?"),
    );
    return jsonResponse(
      {
        ok: false,
        error: "email_failed",
        message: explainEmailFailure(result),
        sandbox_restricted: !!result.sandboxRestricted,
        detail: result.error ?? null,
      },
      502,
    );
  }

  // Best-effort: registra no metadata que a mensagem do fornecedor foi
  // enviada por e-mail (auditoria leve — nunca derruba o retorno de
  // sucesso se o update falhar).
  try {
    const meta = (booking.metadata && typeof booking.metadata === "object")
      ? { ...(booking.metadata as Record<string, unknown>) }
      : {};
    const hist = Array.isArray((meta as { supplier_msg_sent?: unknown }).supplier_msg_sent)
      ? ((meta as { supplier_msg_sent?: unknown[] }).supplier_msg_sent as unknown[]).slice()
      : [];
    hist.push({ at: new Date().toISOString(), channel: "email", fornecedor: msg.key });
    (meta as Record<string, unknown>).supplier_msg_sent = hist;
    await supabase.from("bookings").update({ metadata: meta }).eq("id", booking.id);
  } catch (e) {
    console.warn("[Elarah supplier-msg] não consegui gravar metadata (ok):", String(e));
  }

  console.info(
    "[Elarah supplier-msg] mensagem enviada",
    "booking_id=" + booking.id,
    "to=" + booking.email,
    "fornecedor=" + msg.label,
  );
  return jsonResponse({ ok: true, to: booking.email, label: msg.label });
});
