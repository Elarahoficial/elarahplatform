// =============================================================
// ELARAH — check-mp-payment-status Edge Function
// -------------------------------------------------------------
// POST /functions/v1/check-mp-payment-status
//
// Backup do webhook da MP. Consulta o status real de um pagamento
// direto na API do Mercado Pago e reconcilia a booking local se
// necessário.
//
// Usado quando:
//   - Webhook atrasou ou falhou e o cliente clicou "Já paguei,
//     verificar" no frontend
//   - Admin quer forçar reconciliação de uma booking pending
//
// Payload:
//   { "booking_id": "uuid" }
//     OU
//   { "payment_id": "1234567890" }
//
// Resposta:
//   {
//     booking_id, mp_payment_id, mp_status, booking_status,
//     updated: true|false
//   }
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getPayment } from "../_shared/mercadopago.ts";
import {
  bookingConfirmationEmailHtml,
  generateGiftCardCode,
  giftCardEmailHtml,
  sendEmail,
} from "../_shared/email.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
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

// deno-lint-ignore no-explicit-any
type Booking = any;

async function findBooking(
  bookingId: string | null,
  paymentId: string | null,
): Promise<Booking | null> {
  if (bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (data) return data;
  }
  if (paymentId) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("mp_payment_id", paymentId)
      .maybeSingle();
    if (data) return data;
    // Fallback: placeholder em stripe_session_id
    const { data: byPlaceholder } = await supabase
      .from("bookings")
      .select("*")
      .eq("stripe_session_id", "MP-" + paymentId)
      .maybeSingle();
    if (byPlaceholder) return byPlaceholder;
  }
  return null;
}

async function sendConfirmationEmail(booking: Booking) {
  if (!booking.email) return;
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  const html = bookingConfirmationEmailHtml({
    nome: booking.nome,
    experienciaNome: booking.experiencia_nome ?? "Sua experiência",
    data: booking.data,
    horario: booking.horario,
    endereco: (meta.endereco as string | null) ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    precoLabel: booking.preco_label,
    quantidade: (booking as { quantidade?: number | null }).quantidade ?? null,
    participantes: Array.isArray((meta as { participantes?: unknown }).participantes)
      ? ((meta as { participantes?: Array<{ nome?: string | null }> }).participantes ?? null)
      : null,
    bookingId: booking.id,
  });
  const result = await sendEmail({
    to: booking.email,
    subject: "Sua reserva na Elarah está confirmada ✨",
    html,
  });
  if (!result.ok) {
    console.error(
      "[Elarah Payment/MP] reconcile: e-mail falhou",
      "booking_id=" + booking.id,
      "error=" + (result.error ?? "?"),
    );
  }
}

// ===== Reconciliação de gift card via PIX =====
// Polling do frontend chama isto com gift_card_id. Lê status atual
// no banco; se ainda não está ativo, consulta a MP pelo mp_payment_id
// salvo no metadata e ativa se a MP já aprovou (cobre atraso/falha
// do webhook). Retorno é seguro pra o front exibir status final ao
// usuário sem precisar de RLS abrindo a tabela gift_cards pro anon.
async function reconcileGiftCard(giftCardId: string): Promise<Response> {
  const { data: gc, error: gcErr } = await supabase
    .from("gift_cards")
    .select(
      "id, code, status, valor_inicial_centavos, comprador_email, comprador_nome, " +
        "destinatario_email, destinatario_nome, mensagem, expires_at, email_sent_at, metadata",
    )
    .eq("id", giftCardId)
    .maybeSingle();

  if (gcErr || !gc) {
    return jsonResponse({ error: "gift_card_not_found" }, 404);
  }

  // Já ativo? devolve direto pro front saber que pode mostrar sucesso.
  if (gc.status === "active") {
    return jsonResponse({
      gift_card_id: gc.id,
      gift_card_status: "active",
      mp_status: "approved",
      updated: false,
    });
  }
  if (gc.status === "cancelled") {
    return jsonResponse({
      gift_card_id: gc.id,
      gift_card_status: "cancelled",
      mp_status: "cancelled",
      updated: false,
    });
  }

  // Ainda pending — consulta a MP pra ver se já aprovaram.
  const meta = (gc.metadata ?? {}) as Record<string, unknown>;
  const mpPaymentId = String(meta.mp_payment_id ?? "");
  if (!mpPaymentId) {
    return jsonResponse({
      gift_card_id: gc.id,
      gift_card_status: gc.status,
      mp_status: null,
      updated: false,
      message: "Gift card sem mp_payment_id no metadata.",
    });
  }

  const result = await getPayment(MP_ACCESS_TOKEN, mpPaymentId);
  if (!result.ok || !result.payment) {
    return jsonResponse(
      {
        gift_card_id: gc.id,
        gift_card_status: gc.status,
        mp_status: null,
        updated: false,
        error: "mp_fetch_failed",
        detail: result.errorBody,
      },
      502,
    );
  }
  const payment = result.payment;
  const mpStatus = payment.status;

  // MP recusou ou cancelou — marca o gift_card como cancelled.
  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    await supabase
      .from("gift_cards")
      .update({ status: "cancelled" })
      .eq("id", giftCardId);
    return jsonResponse({
      gift_card_id: gc.id,
      gift_card_status: "cancelled",
      mp_status: mpStatus,
      updated: true,
    });
  }

  // Ainda intermediário — devolve sem alterar o banco.
  if (mpStatus !== "approved" && mpStatus !== "authorized") {
    return jsonResponse({
      gift_card_id: gc.id,
      gift_card_status: gc.status,
      mp_status: mpStatus,
      updated: false,
    });
  }

  // MP aprovou mas o gift_card ainda está pending — ativa aqui (mesma
  // lógica do mp-webhook.processGiftCardPayment, replicada porque
  // edge functions Deno não compartilham módulos custom entre si).
  let code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = generateGiftCardCode();
    const { data: collision } = await supabase
      .from("gift_cards")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!collision) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return jsonResponse(
      { error: "code_generation_failed", message: "Falha ao gerar código." },
      500,
    );
  }

  const expiresAtIso = gc.expires_at ||
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: updated, error: updErr } = await supabase
    .from("gift_cards")
    .update({
      code,
      status: "active",
      expires_at: expiresAtIso,
      email_sent_at: null,
    })
    .eq("id", giftCardId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (updErr || !updated) {
    // Pode ter sido ativado pelo webhook entre nossa leitura e o update.
    const { data: refetched } = await supabase
      .from("gift_cards")
      .select("status, code")
      .eq("id", giftCardId)
      .maybeSingle();
    if (refetched && refetched.status === "active" && refetched.code) {
      return jsonResponse({
        gift_card_id: gc.id,
        gift_card_status: "active",
        mp_status: mpStatus,
        updated: false,
      });
    }
    return jsonResponse(
      { error: "activation_failed", detail: updErr },
      500,
    );
  }

  // Envia e-mails (destinatário + cópia pro comprador). Idempotência:
  // só envia se email_sent_at vier null — se já tem timestamp, é
  // replay e a gente pula.
  const valor = Number(gc.valor_inicial_centavos || 0);
  const recipient = String(gc.destinatario_email ?? "").trim();
  const recipientNome = (gc.destinatario_nome ?? "").trim() || null;
  const buyerEmail = (gc.comprador_email ?? "").trim() || null;
  const buyerNome = (gc.comprador_nome ?? "").trim() || null;
  const mensagem = (gc.mensagem ?? "").trim() || null;
  const expiresAtLabel = new Date(expiresAtIso).toLocaleDateString("pt-BR");

  if (recipient) {
    const html = giftCardEmailHtml({
      recipientName: recipientNome,
      buyerName: buyerNome,
      code,
      valorCentavos: valor,
      message: mensagem,
      expiresAt: expiresAtLabel,
    });
    const sendResult = await sendEmail({
      to: recipient,
      subject: "Você recebeu um gift card da Elarah ✨",
      html,
    });
    if (sendResult.ok) {
      await supabase
        .from("gift_cards")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", giftCardId);
    } else {
      console.error(
        "[Elarah Payment/MP gift reconcile] e-mail destinatário falhou",
        "gift_card_id=" + giftCardId,
        "error=" + (sendResult.error ?? "?"),
      );
    }
  }

  if (
    buyerEmail &&
    recipient &&
    buyerEmail.toLowerCase() !== recipient.toLowerCase()
  ) {
    const htmlBuyer = giftCardEmailHtml({
      recipientName: buyerNome,
      buyerName: buyerNome,
      code,
      valorCentavos: valor,
      message: "Cópia para você. O código original foi enviado para " +
        recipient + ".",
      expiresAt: expiresAtLabel,
    });
    const buyerResult = await sendEmail({
      to: buyerEmail,
      subject: "Sua compra de gift card Elarah foi confirmada",
      html: htmlBuyer,
    });
    if (!buyerResult.ok) {
      console.error(
        "[Elarah Payment/MP gift reconcile] e-mail comprador falhou",
        "gift_card_id=" + giftCardId,
        "error=" + (buyerResult.error ?? "?"),
      );
    }
  }

  return jsonResponse({
    gift_card_id: gc.id,
    gift_card_status: "active",
    mp_status: mpStatus,
    updated: true,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_ROLE) {
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const bookingId = payload.booking_id ? String(payload.booking_id) : null;
  const paymentIdFromPayload = payload.payment_id
    ? String(payload.payment_id)
    : null;
  const giftCardId = payload.gift_card_id ? String(payload.gift_card_id) : null;

  if (!bookingId && !paymentIdFromPayload && !giftCardId) {
    return jsonResponse(
      { error: "booking_id_or_payment_id_or_gift_card_id_required" },
      400,
    );
  }

  // ===== Gift card via PIX =====
  // Quando o front polla com gift_card_id, reconcilia o status e
  // dispara ativação se a MP confirmou mas o webhook ainda não rodou
  // (atraso/falha temporária). Mesmo princípio do fluxo de booking
  // mais abaixo, mas operando em gift_cards.
  if (giftCardId) {
    return await reconcileGiftCard(giftCardId);
  }

  const booking = await findBooking(bookingId, paymentIdFromPayload);
  if (!booking) {
    return jsonResponse({ error: "booking_not_found" }, 404);
  }

  const mpPaymentId = booking.mp_payment_id ||
    (booking.stripe_session_id?.startsWith("MP-")
      ? booking.stripe_session_id.slice(3)
      : null) ||
    paymentIdFromPayload;

  if (!mpPaymentId) {
    return jsonResponse(
      {
        booking_id: booking.id,
        mp_payment_id: null,
        mp_status: null,
        booking_status: booking.status,
        updated: false,
        message: "Booking não tem mp_payment_id — não é via Mercado Pago.",
      },
      200,
    );
  }

  console.info(
    "[Elarah Payment/MP] reconcile request",
    "booking=" + booking.id,
    "mp_payment=" + mpPaymentId,
  );

  const result = await getPayment(MP_ACCESS_TOKEN, mpPaymentId);
  if (!result.ok || !result.payment) {
    return jsonResponse(
      {
        error: "mp_fetch_failed",
        mp_status: null,
        detail: result.errorBody,
      },
      502,
    );
  }

  const payment = result.payment;
  const mpStatus = payment.status;
  let updated = false;

  // Só atualiza se o estado local estiver "atrás" do que a MP diz.
  if (booking.status !== "pago" &&
      (mpStatus === "approved" || mpStatus === "authorized")) {
    const paidCents = Math.round((payment.transaction_amount || 0) * 100);
    const patch: Record<string, unknown> = {
      status: "pago",
      amount_total: paidCents,
      currency: "brl",
    };

    // Reconcilia fornecedor/financeiro se faltarem — idêntico ao
    // mp-webhook markBookingAsPaid. Cobre o caso em que o pre-insert
    // caiu no fallback sem esses campos.
    const needsFinancialBackfill =
      !booking.valor_cheio_centavos ||
      !booking.valor_repasse_centavos ||
      !booking.valor_comissao_centavos ||
      !booking.fornecedor_nome ||
      !booking.status_fornecedor;

    if (needsFinancialBackfill && booking.experiencia_id) {
      const { data: exp } = await supabase
        .from("experiences")
        .select("fornecedor_nome, valor_cheio_centavos, created_by")
        .eq("id", booking.experiencia_id)
        .maybeSingle();
      if (exp) {
        const qty = Number(booking.quantidade) || 1;
        const valorCheioTotal = exp.valor_cheio_centavos
          ? exp.valor_cheio_centavos * qty : null;
        const valorRepasse = valorCheioTotal
          ? Math.round(valorCheioTotal * 0.70) : null;
        const valorComissao = valorCheioTotal
          ? Math.round(valorCheioTotal * 0.20) : null;
        if (!booking.fornecedor_nome && exp.fornecedor_nome) {
          patch.fornecedor_nome = exp.fornecedor_nome;
        }
        if (!booking.fornecedor_id && exp.created_by) {
          patch.fornecedor_id = exp.created_by;
        }
        if (!booking.valor_cheio_centavos && valorCheioTotal) {
          patch.valor_cheio_centavos = valorCheioTotal;
        }
        if (!booking.valor_repasse_centavos && valorRepasse) {
          patch.valor_repasse_centavos = valorRepasse;
        }
        if (!booking.valor_comissao_centavos && valorComissao) {
          patch.valor_comissao_centavos = valorComissao;
        }
        if (!booking.status_fornecedor) {
          patch.status_fornecedor = "repasse_pendente";
        }
      }
    }

    const { error: updErr } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", booking.id);
    if (!updErr) {
      updated = true;
      console.info(
        "[Elarah Payment/MP] reconcile: booking marcada como pago",
        "booking=" + booking.id,
      );
      // Envia confirmação — o webhook pode não ter rodado.
      booking.status = "pago";
      booking.amount_total = paidCents;
      await sendConfirmationEmail(booking);
    } else {
      console.error(
        "[Elarah Payment/MP] reconcile: update falhou",
        updErr,
      );
    }
  } else if (
    booking.status !== "cancelado" &&
    booking.status !== "reembolsado" &&
    (mpStatus === "rejected" || mpStatus === "cancelled")
  ) {
    const { error: updErr } = await supabase
      .from("bookings")
      .update({ status: "cancelado" })
      .eq("id", booking.id);
    if (!updErr) {
      updated = true;
      // Devolve vaga + cupom — prioriza slot, fallback pra experiência
      // deno-lint-ignore no-explicit-any
      const bk = booking as any;
      const qty = Number(bk.quantidade) || 1;
      if (bk.slot_id) {
        await supabase.rpc("increment_slot_vagas", { p_slot_id: bk.slot_id, p_qty: qty });
      } else if (booking.experiencia_id) {
        await supabase.rpc("increment_experience_vagas", {
          p_experience_id: booking.experiencia_id, p_qty: qty,
        });
      }
      if (booking.gift_card_id && booking.gift_card_centavos) {
        await supabase.rpc("refund_gift_card", {
          p_gift_card_id: booking.gift_card_id,
          p_amount_centavos: booking.gift_card_centavos,
        });
      }
    }
  }

  return jsonResponse({
    booking_id: booking.id,
    mp_payment_id: String(mpPaymentId),
    mp_status: mpStatus,
    booking_status: updated ? (mpStatus === "approved" ? "pago" : "cancelado") : booking.status,
    updated,
  });
});
