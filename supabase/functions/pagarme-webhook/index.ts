// =============================================================
// ELARAH — pagarme-webhook Edge Function
// -------------------------------------------------------------
// POST /functions/v1/pagarme-webhook
//
// Recebe as notificações do Pagar.me (API V5) e concilia a reserva com
// PARIDADE ao fluxo do Mercado Pago/Stripe: mesmos helpers, mesmos
// efeitos, mesma idempotência. Reusa _shared/email.ts + _shared/booking_guard.ts.
//
// Eventos tratados (oficiais V5):
//   order.paid | charge.paid            → marca 'pago' (+ e-mails, re-ocupa vaga)
//   order.payment_failed | charge.payment_failed | order.canceled
//                                        → 'cancelado' (+ libera vaga/cupom/gift)
//   charge.refunded | charge.chargedback → 'reembolsado' (+ libera)
//   demais eventos                       → 200 ignored (evita retry)
//
// Segurança: Basic Auth (PAGARME_WEBHOOK_USER/PASSWORD).
// Reconciliação: order.code == booking.id (order_code enviado no Payment Link).
// Idempotência: compare-and-set (.neq('status','pago')) — efeitos rodam
//   uma única vez; libera vaga só se a booking AINDA segurava inventário.
//
// config.toml: verify_jwt=false.
// Env: PAGARME_WEBHOOK_USER / PAGARME_WEBHOOK_PASSWORD,
//      SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (e-mails).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bookingConfirmationEmailHtml,
  sendAdminSaleNotification,
  sendEmail,
} from "../_shared/email.ts";
import { sendBookingConfirmationGated } from "../_shared/whatsapp.ts";
import {
  holdsInventory,
  reoccupyVagaOnReapproval,
  wasInventoryReleased,
} from "../_shared/booking_guard.ts";
import { verifyWebhookBasicAuth } from "../_shared/pagarme.ts";

const WEBHOOK_USER = Deno.env.get("PAGARME_WEBHOOK_USER") ?? "";
const WEBHOOK_PASS = Deno.env.get("PAGARME_WEBHOOK_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// deno-lint-ignore no-explicit-any
type BookingRow = Record<string, any>;

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Rótulo do método pra notificação de venda ao admin, a partir do evento.
function paymentLabelFromEvent(data: Record<string, unknown>): string {
  const charges = (data.charges ?? (data.order as Record<string, unknown>)?.charges) as
    | Array<Record<string, unknown>>
    | undefined;
  const charge = (charges && charges[0]) ??
    (data.payment_method ? data : undefined);
  const pm = charge?.payment_method as string | undefined;
  const inst = (charge?.last_transaction as Record<string, unknown> | undefined)
    ?.installments as number | undefined;
  if (pm === "credit_card") {
    return inst && inst > 1 ? `Cartão ${inst}x (Pagar.me)` : "Cartão (Pagar.me)";
  }
  if (pm === "pix") return "Pix (Pagar.me)";
  return "Pagar.me";
}

// Código normalizado do método ('card' | 'pix' | null) pra persistir em
// metadata.payment_method. O checkout redirect grava 'card_or_pix' no
// pre-insert (não sabe qual ainda); aqui o webhook resolve pelo charge real.
function paymentMethodCodeFromEvent(data: Record<string, unknown>): string | null {
  const charges = (data.charges ?? (data.order as Record<string, unknown>)?.charges) as
    | Array<Record<string, unknown>>
    | undefined;
  const charge = (charges && charges[0]) ??
    (data.payment_method ? data : undefined);
  const pm = charge?.payment_method as string | undefined;
  if (pm === "credit_card" || pm === "debit_card") return "card";
  if (pm === "pix") return "pix";
  return null;
}

// ===== Confirmação por e-mail (idêntica ao MP/Stripe) =====
async function sendBookingConfirmation(booking: BookingRow) {
  if (!booking.email) {
    console.warn("[Elarah Payment/Pagarme] booking sem email — pulando confirmação", booking.id);
    return;
  }
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  const html = bookingConfirmationEmailHtml({
    nome: booking.nome,
    experienciaNome: booking.experiencia_nome ?? "Sua experiência",
    data: booking.data,
    horario: booking.horario,
    endereco: (meta.endereco as string | null) ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    // Prazo de remarcação congelado na compra. Reserva antiga (sem o
    // campo) cai no padrão de 48h dentro do template.
    prazoRemarcacaoHoras: (meta.politica_remarcacao_horas as number | null) ?? null,
    precoLabel: booking.preco_label,
    quantidade: booking.quantidade ?? null,
    amountTotalCentavos: booking.amount_total ?? null,
    participantes: Array.isArray(meta.participantes)
      ? (meta.participantes as Array<{ nome?: string | null }>)
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
      "booking_id=" + booking.id,
      "status=" + (result.status ?? "?"),
      "error=" + (result.error ?? "?"),
    );
  }
  // WhatsApp da confirmação — passa pelo PORTÃO ÚNICO (idempotência +
  // fail-closed + auditoria). Best-effort: nunca quebra o fluxo do pagamento.
  try {
    await sendBookingConfirmationGated(supabase, booking, meta);
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] WhatsApp confirmação exceção (ignorada)", booking.id, String(e));
  }
}

// ===== Notificação de venda pra Elarah (idêntica ao MP) =====
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
    couponCode: booking.coupon_code ?? null,
    couponDiscountCentavos: booking.coupon_discount_centavos ?? null,
    fornecedorNome: booking.fornecedor_nome ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    endereco: (meta.endereco as string | null) ?? null,
  });
}

// ===== Marca a reserva como paga (compare-and-set idempotente) =====
async function markBookingAsPaid(
  booking: BookingRow,
  paymentLabel: string,
  resolvedMethod?: string | null,
) {
  // O amount_total do Pagar.me é o do pre-insert (create-pagarme-checkout
  // grava o valor final). O webhook não re-cobra do gateway.
  const paidAmountCents = Number(booking.amount_total) || 0;

  // Resolve metadata.payment_method quando o pre-insert deixou 'card_or_pix'
  // (checkout redirect) ou vazio — pra a coluna Pagamento do admin mostrar
  // Cartão x Pix corretamente. Só toca no metadata se realmente precisar.
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  const currentPm = String(meta.payment_method ?? "");
  const needPmFix = !!resolvedMethod &&
    (currentPm === "" || currentPm === "card_or_pix" ||
      currentPm === "cartao_ou_pix" || currentPm === "card_pix");
  const paidUpdate: Record<string, unknown> = { status: "pago", currency: "brl" };
  if (needPmFix) {
    paidUpdate.metadata = { ...meta, payment_method: resolvedMethod };
  }

  // Compare-and-set: só um webhook transiciona pending→pago. Os efeitos
  // (e-mails, re-ocupação, cupom) rodam SÓ pra quem venceu essa corrida.
  const { data: won, error: updErr } = await supabase
    .from("bookings")
    .update(paidUpdate)
    .eq("id", booking.id)
    .neq("status", "pago")
    .select("id")
    .maybeSingle();

  if (updErr) {
    console.error("[Elarah Payment/Pagarme] update pago falhou", booking.id, updErr);
    return { processed: false };
  }
  if (!won) {
    // Já estava pago (replay / corrida) — não reprocessa.
    return { processed: false, idempotent: true };
  }

  console.info("[Elarah Payment/Pagarme] booking marcada como pago",
    "booking=" + booking.id, "amount_cents=" + paidAmountCents);

  // Re-ocupa vaga se a booking já tinha sido liberada (aprovação tardia).
  if (wasInventoryReleased(booking.status)) {
    const { oversold } = await reoccupyVagaOnReapproval(supabase, booking);
    if (oversold) {
      console.error(
        "[Elarah Payment/Pagarme] OVERBOOKING — pago sem vaga disponível",
        "booking=" + booking.id, "status_anterior=" + booking.status,
      );
      await supabase.from("bookings").update({
        metadata: {
          ...(booking.metadata ?? {}),
          inventory_oversold: true,
          oversold_from_status: booking.status,
          oversold_detected_at: new Date().toISOString(),
        },
      }).eq("id", booking.id);
    }
  }

  // Backfill financeiro só se o pre-insert tiver deixado vazio (rede de
  // segurança igual à do mp-webhook — normalmente já vem preenchido).
  const needsBackfill = !booking.valor_cheio_centavos ||
    !booking.valor_repasse_centavos || !booking.valor_comissao_centavos ||
    !booking.fornecedor_nome || !booking.status_fornecedor;
  if (needsBackfill && booking.experiencia_id) {
    const { data: exp } = await supabase.from("experiences")
      .select("fornecedor_nome, valor_cheio_centavos, created_by")
      .eq("id", booking.experiencia_id).maybeSingle();
    if (exp) {
      const qty = Number(booking.quantidade) || 1;
      const cheio = exp.valor_cheio_centavos ? exp.valor_cheio_centavos * qty : null;
      const patch: Record<string, unknown> = {};
      if (!booking.fornecedor_nome && exp.fornecedor_nome) patch.fornecedor_nome = exp.fornecedor_nome;
      if (!booking.fornecedor_id && exp.created_by) patch.fornecedor_id = exp.created_by;
      if (!booking.valor_cheio_centavos && cheio) patch.valor_cheio_centavos = cheio;
      if (!booking.valor_repasse_centavos && cheio) patch.valor_repasse_centavos = Math.round(cheio * 0.70);
      if (!booking.valor_comissao_centavos && cheio) patch.valor_comissao_centavos = Math.round(cheio * 0.20);
      if (!booking.status_fornecedor) patch.status_fornecedor = "repasse_pendente";
      if (Object.keys(patch).length) {
        await supabase.from("bookings").update(patch).eq("id", booking.id);
        console.info("[Elarah Payment/Pagarme] backfill financeiro", "booking=" + booking.id);
      }
    }
  }

  // Uso definitivo do cupom (audit; o trigger de banco já conta em →pago).
  // Idempotente: RPC dedup por booking_id.
  if (booking.coupon_id) {
    const { error: cErr } = await supabase.rpc("register_coupon_use", {
      p_coupon_id: booking.coupon_id,
      p_booking_id: booking.id,
      p_user_id: booking.user_id,
      p_email: booking.email,
      p_experience_id: booking.experiencia_id,
      p_amount_discount_centavos: booking.coupon_discount_centavos ?? 0,
    });
    if (cErr) console.error("[Elarah Payment/Pagarme] register_coupon_use falhou", cErr);
  }

  // Sincroniza o objeto local pro e-mail refletir o valor real.
  booking.amount_total = paidAmountCents;
  await sendBookingConfirmation(booking);       // e-mail do cliente
  await notifyAdminOfSale(booking, paymentLabel); // notificação pra Elarah
  return { processed: true };
}

// ===== Cancela/estorna: libera vaga/cupom/gift (idêntica ao MP) =====
async function cancelBooking(booking: BookingRow, newStatus: string) {
  // Só devolve inventário se a booking AINDA segurava (evita devolver a
  // mesma vaga duas vezes num webhook duplicado → estoque fantasma).
  const heldInventory = holdsInventory(booking.status);

  const { error } = await supabase.from("bookings")
    .update({ status: newStatus }).eq("id", booking.id);
  if (error) console.error("[Elarah Payment/Pagarme] update " + newStatus + " falhou", booking.id, error);

  if (!heldInventory) {
    console.info("[Elarah Payment/Pagarme] " + newStatus + " sem devolução (booking já liberada)",
      "booking=" + booking.id, "status_anterior=" + booking.status);
    return;
  }
  const qty = Number(booking.quantidade) || 1;
  if (booking.slot_id) {
    const { error: e } = await supabase.rpc("increment_slot_vagas", { p_slot_id: booking.slot_id, p_qty: qty });
    if (e) console.error("[Elarah Payment/Pagarme] refund slot vagas", e);
  } else if (booking.experiencia_id) {
    const { error: e } = await supabase.rpc("increment_experience_vagas", { p_experience_id: booking.experiencia_id, p_qty: qty });
    if (e) console.error("[Elarah Payment/Pagarme] refund vagas", e);
  }
  if (booking.gift_card_id && booking.gift_card_centavos) {
    const { error: e } = await supabase.rpc("refund_gift_card", { p_gift_card_id: booking.gift_card_id, p_amount_centavos: booking.gift_card_centavos });
    if (e) console.error("[Elarah Payment/Pagarme] refund gift_card", e);
  }
  if (booking.coupon_id) {
    const { error: e } = await supabase.rpc("refund_coupon", { p_coupon_id: booking.coupon_id });
    if (e) console.error("[Elarah Payment/Pagarme] refund coupon", e);
  }
  console.info("[Elarah Payment/Pagarme] booking " + newStatus, "booking=" + booking.id);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200 });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  // ----- Basic Auth -----
  if (!verifyWebhookBasicAuth(req.headers.get("authorization"), WEBHOOK_USER, WEBHOOK_PASS)) {
    console.warn("[Elarah Payment/Pagarme] Basic Auth inválido");
    return new Response("unauthorized", { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = await req.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  const type = String(event.type ?? "");
  const data = (event.data ?? {}) as Record<string, unknown>;
  const status = String(data.status ?? "");
  console.info("[Elarah Payment/Pagarme] evento", "type=" + type, "status=" + status);

  // Classifica o evento.
  const isPaid = type === "order.paid" || type === "charge.paid" ||
    ((type.startsWith("order.") || type.startsWith("charge.")) && status === "paid");
  const isFailed = type === "order.payment_failed" || type === "charge.payment_failed" ||
    type === "order.canceled" || type === "charge.canceled" ||
    (type.startsWith("charge.") && (status === "failed" || status === "canceled" || status === "not_authorized"));
  const isRefunded = type === "charge.refunded" || type === "charge.chargedback" ||
    (type.startsWith("charge.") && (status === "refunded" || status === "chargedback"));

  if (!isPaid && !isFailed && !isRefunded) {
    // Evento sem efeito no ciclo (order.created, charge.pending, etc.).
    // 200 pra o Pagar.me não ficar reenviando.
    return ok({ received: true, ignored: type });
  }

  // Reconciliação por order_code (== booking.id). order.paid → data.code;
  // charge.* → data.order.code. Fallback: order_code no topo.
  const orderObj = (data.order ?? data) as Record<string, unknown>;
  let bookingId = "";
  if (typeof orderObj?.code === "string") bookingId = orderObj.code as string;
  else if (typeof data.order_code === "string") bookingId = data.order_code as string;

  if (!bookingId) {
    console.warn("[Elarah Payment/Pagarme] evento sem order_code", "type=" + type);
    return ok({ received: true, no_order_code: true });
  }

  // Busca a reserva COMPLETA (precisa de todos os campos p/ e-mail/admin/estoque).
  const { data: booking } = await supabase.from("bookings")
    .select("*").eq("id", bookingId).maybeSingle();

  if (!booking) {
    console.warn("[Elarah Payment/Pagarme] booking não encontrada", "code=" + bookingId);
    return ok({ received: true, booking_not_found: true });
  }

  if (isPaid) {
    const label = paymentLabelFromEvent(data);
    const resolvedMethod = paymentMethodCodeFromEvent(data);
    const r = await markBookingAsPaid(booking as BookingRow, label, resolvedMethod);
    return ok({ received: true, paid: r.processed === true, idempotent: r.idempotent === true });
  }
  if (isRefunded) {
    await cancelBooking(booking as BookingRow, "reembolsado");
    return ok({ received: true, refunded: true });
  }
  // isFailed
  await cancelBooking(booking as BookingRow, "cancelado");
  return ok({ received: true, cancelled: true });
});
