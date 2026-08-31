// =============================================================
// ELARAH — resend-booking-confirmation Edge Function
// -------------------------------------------------------------
// POST /functions/v1/resend-booking-confirmation
//
// Reenvia o MESMO e-mail de confirmação de reserva ("Sua reserva na
// Elarah está confirmada ✨") que sai automaticamente no webhook de
// pagamento (Stripe / Mercado Pago). Serve para o caso em que a admin
// editou a reserva no painel (troca de experiência, data, horário,
// quantidade) e precisa mandar a confirmação atualizada pro cliente —
// o webhook original já rodou com os dados antigos e não roda de novo.
//
// Chamado por admin.js (botão "Reenviar confirmação" na lista de
// reservas). Exige JWT válido (verify_jwt=true, default) — só admin
// autenticada consegue disparar. Espelha a mesma montagem do e-mail
// do mp-webhook/sendBookingConfirmation pra ficar idêntico ao original.
//
// Body JSON:
//   { "booking_id": "uuid" }                      -> manda pro e-mail da reserva
//   { "booking_id": "uuid", "to": "outro@x.com" } -> manda uma CÓPIA pro
//                                                    endereço informado
//
// O campo "to" é opcional e só muda o destinatário — o conteúdo é sempre
// montado a partir da reserva (nada vem do cliente). Serve pro caso de a
// admin precisar mandar a confirmação pra um segundo e-mail (presenteado,
// e-mail corporativo, conferência interna) sem alterar a reserva.
//
// Resposta: { ok: true, to: "destino@email", copy: false } ou
//           { ok: false, error }.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  bookingConfirmationEmailHtml,
  isCustomerMessagingSuppressed,
  sendEmail,
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

  // Destinatário alternativo (cópia). Validado aqui porque o painel pode
  // ser burlado — só aceita um endereço simples e bem formado.
  const overrideTo = String(payload.to ?? "").trim().toLowerCase();
  if (overrideTo && !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(overrideTo)) {
    return jsonResponse({ ok: false, error: "invalid_email" }, 400);
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error(
      "[Elarah resend-confirmation] erro ao ler booking",
      "booking_id=" + bookingId,
      "error=" + error.message,
    );
    return jsonResponse({ ok: false, error: "db_error", detail: error.message }, 500);
  }
  if (!booking) {
    return jsonResponse({ ok: false, error: "booking_not_found" }, 404);
  }
  if (!booking.email && !overrideTo) {
    return jsonResponse({ ok: false, error: "booking_sem_email" }, 422);
  }

  // Destino final: o "to" informado (cópia) ou o e-mail da própria reserva.
  const destino = overrideTo || String(booking.email).trim();
  const isCopy = !!overrideTo &&
    overrideTo !== String(booking.email ?? "").trim().toLowerCase();
  // Reserva "aguardando experiência" (cliente desmarcou sem reembolso) não
  // pode receber confirmação — mesmo que a admin clique sem querer. Guarda
  // no servidor porque o botão do painel pode ser burlado.
  if (isCustomerMessagingSuppressed(booking)) {
    console.info(
      "[Elarah resend-confirmation] envio bloqueado (aguardando_experiencia)",
      "booking_id=" + booking.id,
    );
    return jsonResponse({ ok: false, error: "aguardando_experiencia" }, 409);
  }

  // Mesma montagem do mp-webhook/sendBookingConfirmation — os dados
  // (experiência, data, horário, quantidade, valor) vêm da reserva JÁ
  // editada no painel, então o e-mail reenviado reflete a troca.
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  const html = bookingConfirmationEmailHtml({
    nome: booking.nome,
    experienciaNome: booking.experiencia_nome ?? "Sua experiência",
    data: booking.data,
    horario: booking.horario,
    endereco: (meta.endereco as string | null) ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    precoLabel: booking.preco_label,
    quantidade: booking.quantidade ?? null,
    amountTotalCentavos: booking.amount_total ?? null,
    participantes: Array.isArray((meta as { participantes?: unknown }).participantes)
      ? ((meta as { participantes?: Array<{ nome?: string | null }> }).participantes ?? null)
      : null,
    bookingId: booking.id,
    variantLabel: (meta.variant_label as string | undefined) ?? null,
    variantSelected: (meta.variant_selected as string | undefined) ?? null,
  });

  const result = await sendEmail({
    to: destino,
    // Cópia leva o prefixo no assunto pra quem recebe entender na hora que
    // é um reenvio pra outro endereço, não uma segunda reserva.
    subject: isCopy
      ? "Cópia — Sua reserva na Elarah está confirmada ✨"
      : "Sua reserva na Elarah está confirmada ✨",
    html,
  });

  if (!result.ok) {
    console.error(
      "[Elarah resend-confirmation] envio de e-mail falhou",
      "booking_id=" + booking.id,
      "to=" + destino,
      "copy=" + isCopy,
      "status=" + (result.status ?? "?"),
      "error=" + (result.error ?? "?"),
    );
    return jsonResponse(
      { ok: false, error: "email_failed", detail: result.error ?? null },
      502,
    );
  }

  console.info(
    "[Elarah resend-confirmation] confirmação reenviada",
    "booking_id=" + booking.id,
    "to=" + destino,
    "copy=" + isCopy,
  );
  return jsonResponse({ ok: true, to: destino, copy: isCopy });
});
