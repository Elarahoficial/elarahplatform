// =============================================================
// ELARAH — pagarme-webhook Edge Function
// -------------------------------------------------------------
// POST /functions/v1/pagarme-webhook
//
// Recebe notificações do Pagar.me sobre mudanças de status
// (order.paid, charge.paid, charge.payment_failed, charge.refunded,
// charge.chargedback, order.canceled, ...). Como o MP, a segurança
// real é RE-BUSCAR a order/charge na API com a nossa secret key — o
// corpo do webhook nunca é a fonte da verdade.
//
// Deploy:
//   supabase functions deploy pagarme-webhook --no-verify-jwt
//
// Env:
//   PAGARME_SECRET_KEY
//   PAGARME_WEBHOOK_USER / PAGARME_WEBHOOK_PASSWORD  (Basic auth do endpoint)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY / ELARAH_FROM_EMAIL              (opcionais — e-mail)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bookingConfirmationEmailHtml,
  generateGiftCardCode,
  giftCardEmailHtml,
  sendAdminSaleNotification,
  sendEmail,
} from "../_shared/email.ts";
import { pagarmeFromEnv, parseWebhookEvent } from "../_shared/pagarme.ts";
import { bookingStatusFor } from "../_shared/payment_provider.ts";
import {
  holdsInventory,
  reoccupyVagaOnReapproval,
  wasInventoryReleased,
} from "../_shared/booking_guard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAGARME_SECRET_KEY = Deno.env.get("PAGARME_SECRET_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pagarme = pagarmeFromEnv();

const BOOKING_COLS =
  "id, email, nome, user_id, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, gift_card_id, gift_card_centavos, coupon_id, coupon_discount_centavos, coupon_code, slot_id, quantidade, metadata, pagarme_order_id, pagarme_charge_id, payment_provider, fornecedor_id, fornecedor_nome, valor_cheio_centavos, valor_repasse_centavos, valor_comissao_centavos, status_fornecedor";

interface BookingRow {
  id: string;
  email: string | null;
  nome: string | null;
  experiencia_id: string | null;
  experiencia_nome: string | null;
  data: string | null;
  horario: string | null;
  preco_label: string | null;
  amount_total: number | null;
  status: string | null;
  gift_card_id: string | null;
  gift_card_centavos: number | null;
  coupon_id: string | null;
  coupon_discount_centavos: number | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  pagarme_order_id: string | null;
  pagarme_charge_id: string | null;
  payment_provider: string | null;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  valor_cheio_centavos: number | null;
  valor_repasse_centavos: number | null;
  valor_comissao_centavos: number | null;
  status_fornecedor: string | null;
  quantidade: number | null;
  slot_id?: string | null;
}

// ===== Lookup da booking (3 caminhos, espelha o MP) =====
async function findBooking(
  orderId: string | null,
  code: string | null,
): Promise<BookingRow | null> {
  // 1. Coluna dedicada pagarme_order_id (ideal).
  if (orderId) {
    const { data, error } = await supabase
      .from("bookings").select(BOOKING_COLS)
      .eq("pagarme_order_id", orderId).maybeSingle();
    if (!error && data) return data as BookingRow;
    // 2. Placeholder no stripe_session_id ("PME-<order_id>").
    const { data: d2 } = await supabase
      .from("bookings").select(BOOKING_COLS)
      .eq("stripe_session_id", "PME-" + orderId).maybeSingle();
    if (d2) return d2 as BookingRow;
  }
  // 3. order.code == booking.id (external reference que nós geramos).
  if (code) {
    const { data: d3 } = await supabase
      .from("bookings").select(BOOKING_COLS)
      .eq("id", code).maybeSingle();
    if (d3) return d3 as BookingRow;
  }
  return null;
}

async function markBookingAsPaid(
  booking: BookingRow,
  paidAmountCents: number,
  paymentLabel: string,
) {
  const patch: Record<string, unknown> = {
    status: "pago",
    amount_total: paidAmountCents,
    currency: "brl",
  };

  // Re-ocupa a vaga se a booking já tinha sido liberada (aprovação tardia).
  if (wasInventoryReleased(booking.status)) {
    const { oversold } = await reoccupyVagaOnReapproval(supabase, booking);
    if (oversold) {
      console.error(
        "[Elarah Payment/Pagarme] OVERBOOKING — pago sem vaga disponível",
        "booking=" + booking.id,
        "status_anterior=" + booking.status,
      );
      patch.metadata = {
        ...(booking.metadata ?? {}),
        inventory_oversold: true,
        oversold_from_status: booking.status,
        oversold_detected_at: new Date().toISOString(),
      };
    }
  }

  // Boundary check de valor (não reverte, só registra divergência).
  if (booking.amount_total != null) {
    const expected = Number(booking.amount_total);
    if (
      Number.isFinite(expected) && Number.isFinite(paidAmountCents) &&
      expected !== paidAmountCents
    ) {
      console.error(
        "[Elarah Payment/Pagarme] AMOUNT MISMATCH",
        "booking=" + booking.id,
        "expected=" + expected,
        "paid=" + paidAmountCents,
      );
      patch.metadata = {
        ...((patch.metadata as Record<string, unknown>) ?? booking.metadata ??
          {}),
        amount_mismatch: true,
        expected_amount_total_centavos: expected,
        paid_amount_centavos: paidAmountCents,
        delta_centavos: paidAmountCents - expected,
        detected_at: new Date().toISOString(),
      };
    }
  }

  // Backfill financeiro se o pre-insert caiu no fallback (colunas ausentes).
  const needsFinancialBackfill = !booking.valor_cheio_centavos ||
    !booking.valor_repasse_centavos || !booking.valor_comissao_centavos ||
    !booking.fornecedor_nome || !booking.status_fornecedor;
  if (needsFinancialBackfill && booking.experiencia_id) {
    const { data: exp } = await supabase
      .from("experiences")
      .select("fornecedor_nome, valor_cheio_centavos, created_by")
      .eq("id", booking.experiencia_id).maybeSingle();
    if (exp) {
      const qty = Number(booking.quantidade) || 1;
      const valorCheioTotal = exp.valor_cheio_centavos
        ? exp.valor_cheio_centavos * qty
        : null;
      if (!booking.fornecedor_nome && exp.fornecedor_nome) {
        patch.fornecedor_nome = exp.fornecedor_nome;
      }
      if (!booking.fornecedor_id && exp.created_by) {
        patch.fornecedor_id = exp.created_by;
      }
      if (!booking.valor_cheio_centavos && valorCheioTotal) {
        patch.valor_cheio_centavos = valorCheioTotal;
      }
      if (!booking.valor_repasse_centavos && valorCheioTotal) {
        patch.valor_repasse_centavos = Math.round(valorCheioTotal * 0.70);
      }
      if (!booking.valor_comissao_centavos && valorCheioTotal) {
        patch.valor_comissao_centavos = Math.round(valorCheioTotal * 0.20);
      }
      if (!booking.status_fornecedor) {
        patch.status_fornecedor = "repasse_pendente";
      }
    }
  }

  const { error } = await supabase.from("bookings").update(patch).eq(
    "id",
    booking.id,
  );
  if (error) {
    console.error("[Elarah Payment/Pagarme] update pago falhou", booking.id, error);
    return;
  }
  console.info(
    "[Elarah Payment/Pagarme] booking marcada como pago",
    "booking=" + booking.id,
    "amount_cents=" + paidAmountCents,
  );
  booking.amount_total = paidAmountCents;

  if (booking.coupon_id) {
    const { error: useErr } = await supabase.rpc("register_coupon_use", {
      p_coupon_id: booking.coupon_id,
      p_booking_id: booking.id,
      p_user_id: booking.user_id,
      p_email: booking.email,
      p_experience_id: booking.experiencia_id,
      p_amount_discount_centavos: booking.coupon_discount_centavos ?? 0,
    });
    if (useErr) {
      console.error("[Elarah Payment/Pagarme] register_coupon_use falhou", useErr);
    }
  }

  await sendBookingConfirmation(booking);
  await notifyAdminOfSale(booking, paymentLabel);
}

async function notifyAdminOfSale(booking: BookingRow, paymentMethod: string) {
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  await sendAdminSaleNotification({
    experienciaNome: booking.experiencia_nome ?? "Experiência",
    clienteNome: booking.nome,
    clienteEmail: booking.email,
    data: booking.data,
    horario: booking.horario,
    quantidade: booking.quantidade ?? null,
    amountTotalCentavos: booking.amount_total ?? null,
    precoLabel: booking.preco_label,
    bookingId: booking.id,
    paymentMethod,
    couponCode: (booking as { coupon_code?: string | null }).coupon_code ?? null,
    couponDiscountCentavos: booking.coupon_discount_centavos ?? null,
    fornecedorNome: booking.fornecedor_nome ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    endereco: (meta.endereco as string | null) ?? null,
  });
}

async function cancelBooking(booking: BookingRow, newStatus: string) {
  const heldInventory = holdsInventory(booking.status);
  const { error } = await supabase.from("bookings").update({
    status: newStatus,
  }).eq("id", booking.id);
  if (error) {
    console.error("[Elarah Payment/Pagarme] update cancelado falhou", booking.id, error);
  }
  if (!heldInventory) {
    console.info(
      "[Elarah Payment/Pagarme] cancelamento sem devolução de estoque (já liberada)",
      "booking=" + booking.id,
    );
    return;
  }
  const qty = Number(booking.quantidade) || 1;
  if (booking.slot_id) {
    await supabase.rpc("increment_slot_vagas", {
      p_slot_id: booking.slot_id,
      p_qty: qty,
    }).then(({ error }: { error: unknown }) => {
      if (error) console.error("[Elarah Payment/Pagarme] refund slot vagas", error);
    });
  } else if (booking.experiencia_id) {
    await supabase.rpc("increment_experience_vagas", {
      p_experience_id: booking.experiencia_id,
      p_qty: qty,
    }).then(({ error }) => {
      if (error) console.error("[Elarah Payment/Pagarme] refund vagas", error);
    });
  }
  if (booking.gift_card_id && booking.gift_card_centavos) {
    await supabase.rpc("refund_gift_card", {
      p_gift_card_id: booking.gift_card_id,
      p_amount_centavos: booking.gift_card_centavos,
    }).then(({ error }) => {
      if (error) console.error("[Elarah Payment/Pagarme] refund gift_card", error);
    });
  }
  if (booking.coupon_id) {
    await supabase.rpc("refund_coupon", { p_coupon_id: booking.coupon_id })
      .then(({ error }) => {
        if (error) console.error("[Elarah Payment/Pagarme] refund coupon", error);
      });
  }
  console.info(
    "[Elarah Payment/Pagarme] booking cancelada",
    "booking=" + booking.id,
    "novo_status=" + newStatus,
  );
}

async function sendBookingConfirmation(booking: BookingRow) {
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
    quantidade: booking.quantidade ?? null,
    amountTotalCentavos: booking.amount_total ?? null,
    participantes: Array.isArray((meta as { participantes?: unknown }).participantes)
      ? ((meta as { participantes?: Array<{ nome?: string | null }> })
        .participantes ?? null)
      : null,
    bookingId: booking.id,
    variantLabel: (meta.variant_label as string | undefined) ?? null,
    variantSelected: (meta.variant_selected as string | undefined) ?? null,
  });
  const result = await sendEmail({
    to: booking.email,
    subject: "Sua reserva na Elarah está confirmada ✨",
    html,
  });
  if (!result.ok) {
    console.error(
      "[Elarah Payment/Pagarme] envio de e-mail falhou",
      "booking=" + booking.id,
      "error=" + (result.error ?? "?"),
    );
  }
}

// ===== Gift card via Pagar.me (espelha o processGiftCardPayment do MP) =====
async function processGiftCardPayment(
  giftCardId: string,
  normalizedStatus: string,
): Promise<Response> {
  const okJson = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const { data: gc, error: gcErr } = await supabase
    .from("gift_cards")
    .select(
      "id, code, status, valor_inicial_centavos, comprador_email, comprador_nome, destinatario_email, destinatario_nome, mensagem, expires_at, email_sent_at, stripe_session_id",
    )
    .eq("id", giftCardId).maybeSingle();

  if (gcErr || !gc) {
    console.error(
      "[Elarah Payment/Pagarme gift] gift_card não encontrado",
      "id=" + giftCardId,
    );
    return okJson({ received: true, gift_card_not_found: true });
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "cancelled") {
    if (gc.status !== "cancelled" && gc.status !== "active") {
      await supabase.from("gift_cards").update({ status: "cancelled" }).eq(
        "id",
        giftCardId,
      );
    }
    return okJson({ received: true, gift_card_cancelled: true });
  }
  if (normalizedStatus !== "approved") {
    return okJson({ received: true, gift_card_pending: true });
  }

  // ----- Aprovado: ativa (idempotente) -----
  let code = "";
  let expiresAtIso = "";
  let isReplay = false;

  if (gc.status === "active" && gc.code && !gc.code.startsWith("PENDING-")) {
    code = gc.code;
    expiresAtIso = gc.expires_at ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    isReplay = true;
  } else {
    for (let i = 0; i < 5; i++) {
      const candidate = generateGiftCardCode();
      const { data: collision } = await supabase
        .from("gift_cards").select("id").eq("code", candidate).maybeSingle();
      if (!collision) {
        code = candidate;
        break;
      }
    }
    if (!code) return new Response("code_generation_failed", { status: 500 });

    expiresAtIso = gc.expires_at ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { data: updated, error: updErr } = await supabase
      .from("gift_cards")
      .update({
        code,
        status: "active",
        expires_at: expiresAtIso,
        email_sent_at: null,
      })
      .eq("id", giftCardId).eq("status", "pending").select().maybeSingle();

    if (updErr || !updated) {
      const { data: refetched } = await supabase
        .from("gift_cards")
        .select("code, status, expires_at, email_sent_at")
        .eq("id", giftCardId).maybeSingle();
      if (refetched && refetched.status === "active" && refetched.code) {
        code = refetched.code;
        expiresAtIso = refetched.expires_at || expiresAtIso;
        isReplay = !!refetched.email_sent_at;
      } else {
        return new Response("activation_failed", { status: 500 });
      }
    }
  }

  if (isReplay && gc.email_sent_at) {
    return okJson({ received: true, gift_card_active: true, idempotent: true });
  }

  const valor = Number(gc.valor_inicial_centavos || 0);
  const recipient = String(gc.destinatario_email ?? "").trim();
  const recipientNome = (gc.destinatario_nome ?? "").trim() || null;
  const buyerEmail = (gc.comprador_email ?? "").trim() || null;
  const buyerNome = (gc.comprador_nome ?? "").trim() || null;
  const mensagem = (gc.mensagem ?? "").trim() || null;
  const expiresAtLabel = expiresAtIso
    ? new Date(expiresAtIso).toLocaleDateString("pt-BR")
    : "1 ano";

  if (recipient) {
    const html = giftCardEmailHtml({
      recipientName: recipientNome,
      buyerName: buyerNome,
      code,
      valorCentavos: valor,
      message: mensagem,
      expiresAt: expiresAtLabel,
    });
    const result = await sendEmail({
      to: recipient,
      subject: "Você recebeu um gift card da Elarah ✨",
      html,
    });
    if (result.ok) {
      await supabase.from("gift_cards").update({
        email_sent_at: new Date().toISOString(),
      }).eq("id", giftCardId);
    } else {
      console.error(
        "[Elarah Payment/Pagarme gift] falha ao enviar gift card",
        "to=" + recipient,
        "error=" + (result.error ?? "?"),
      );
    }
  }

  if (
    buyerEmail && recipient &&
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
    await sendEmail({
      to: buyerEmail,
      subject: "Sua compra de gift card Elarah foi confirmada",
      html: htmlBuyer,
    });
  }

  return okJson({ received: true, gift_card_active: true });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!PAGARME_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[Elarah Payment/Pagarme] webhook: env ausente");
    return new Response("server_misconfigured", { status: 500 });
  }

  const rawBody = await req.text();

  // 1. Verifica autenticidade (Basic auth se configurado; senão confia
  //    no re-fetch por id, que é a fonte da verdade).
  const verification = await pagarme.verifyWebhook(rawBody, req.headers);
  if (!verification.ok) {
    console.error(
      "[Elarah Payment/Pagarme] webhook rejeitado",
      "reason=" + (verification.reason ?? "?"),
    );
    return new Response("invalid_signature", { status: 401 });
  }

  // 2. Parse do evento.
  const ev = parseWebhookEvent(rawBody);
  console.info(
    "[Elarah Payment/Pagarme] webhook recebido",
    "type=" + ev.type,
    "order=" + (ev.orderId ?? "?"),
    "charge=" + (ev.chargeId ?? "?"),
    "code=" + (ev.code ?? "?"),
  );

  // Só interessam eventos de pagamento (order.* / charge.*).
  if (!ev.type.startsWith("order.") && !ev.type.startsWith("charge.")) {
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fetchId = ev.orderId ?? ev.chargeId;
  if (!fetchId) {
    console.warn("[Elarah Payment/Pagarme] webhook sem id — ignorando");
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // 3. RE-BUSCA na API (fonte autoritativa de status/valor).
  const result = await pagarme.getPayment(fetchId);
  if (!result.ok || !result.data) {
    console.error(
      "[Elarah Payment/Pagarme] não consegui buscar pagamento",
      "id=" + fetchId,
      "status=" + result.errorStatus,
    );
    // 500 → o Pagar.me re-tenta.
    return new Response("pagarme_fetch_failed", { status: 500 });
  }
  const payment = result.data;

  // Status efetivo: o normalizado do re-fetch, mas o TIPO do evento
  // desempata estorno/chargeback (uma charge estornada pode aparecer
  // como "canceled" no status cru).
  let normalizedStatus = payment.status;
  if (ev.type === "charge.refunded") normalizedStatus = "refunded";
  else if (ev.type === "charge.chargedback") normalizedStatus = "charged_back";

  console.info(
    "[Elarah Payment/Pagarme] pagamento consultado",
    "order=" + payment.id,
    "status=" + normalizedStatus,
    "method=" + (payment.paymentMethod ?? "?"),
    "installments=" + (payment.installments ?? "?"),
    "code=" + (payment.externalReference ?? ev.code ?? "?"),
  );

  const code = payment.externalReference ?? ev.code;

  // 4. Roteamento gift card (code começa com "GIFT-").
  if (code && code.startsWith("GIFT-")) {
    return await processGiftCardPayment(code.slice(5), normalizedStatus);
  }

  // 5. Reconcilia a booking.
  const booking = await findBooking(payment.id, code ?? null);
  if (!booking) {
    console.error(
      "[Elarah Payment/Pagarme] booking não encontrada",
      "order=" + payment.id,
      "code=" + (code ?? "?"),
    );
    return new Response(JSON.stringify({ received: true, not_found: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Idempotência: se já paga, ignora (a menos que seja estorno/chargeback).
  if (
    booking.status === "pago" && normalizedStatus !== "refunded" &&
    normalizedStatus !== "charged_back"
  ) {
    return new Response(JSON.stringify({ received: true, idempotent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Aplica o status normalizado.
  if (normalizedStatus === "approved") {
    const paidCents = payment.amountCents || booking.amount_total || 0;
    let label = "Pagar.me";
    if (payment.paymentMethod === "pix") label = "Pix (Pagar.me)";
    else if (payment.paymentMethod === "credit_card") {
      const inst = Number(payment.installments) || 1;
      label = inst > 1 ? "Cartão " + inst + "x (Pagar.me)" : "Cartão (Pagar.me)";
    }
    await markBookingAsPaid(booking, paidCents, label);
  } else {
    const bookingStatus = bookingStatusFor(normalizedStatus);
    if (bookingStatus === "cancelado") {
      await cancelBooking(booking, "cancelado");
    } else if (bookingStatus === "reembolsado") {
      await cancelBooking(booking, "reembolsado");
    } else {
      // pending / in_process / unknown → aguarda o próximo evento.
      console.info(
        "[Elarah Payment/Pagarme] status não-terminal — aguardando",
        "status=" + normalizedStatus,
      );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
