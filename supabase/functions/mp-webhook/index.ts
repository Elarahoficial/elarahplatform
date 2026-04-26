// =============================================================
// ELARAH — mp-webhook Edge Function
// -------------------------------------------------------------
// POST /functions/v1/mp-webhook
//
// Recebe notificações do Mercado Pago sobre mudanças de status
// de pagamentos. Diferente do Stripe, a MP só manda o ID — a
// gente precisa buscar o pagamento completo pra ver o status.
//
// Deploy:
//   supabase functions deploy mp-webhook --no-verify-jwt
//
// Variáveis de ambiente:
//   MERCADO_PAGO_ACCESS_TOKEN
//   MP_WEBHOOK_SECRET           (preferido — padrão atual)
//     OU MERCADO_PAGO_WEBHOOK_SECRET (alias legado, também aceito)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY        (opcional — sem ele, e-mail é pulado)
//   ELARAH_FROM_EMAIL     (opcional)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bookingConfirmationEmailHtml,
  sendEmail,
} from "../_shared/email.ts";
import {
  getPayment,
  verifyWebhookSignature,
} from "../_shared/mercadopago.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
// Aceita tanto o nome curto (MP_WEBHOOK_SECRET) quanto o longo
// (MERCADO_PAGO_WEBHOOK_SECRET) — quem configurar primeiro vence.
const MP_WEBHOOK_SECRET =
  Deno.env.get("MP_WEBHOOK_SECRET") ??
  Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ===== Tipos =====
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
  metadata: Record<string, unknown> | null;
  mp_payment_id: string | null;
  payment_provider: string | null;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  valor_cheio_centavos: number | null;
  valor_repasse_centavos: number | null;
  valor_comissao_centavos: number | null;
  status_fornecedor: string | null;
  quantidade: number | null;
}

// ===== Helpers de DB =====
async function findBookingByMpPaymentId(
  paymentId: string,
): Promise<BookingRow | null> {
  // Tenta primeiro pela coluna dedicada (caminho ideal).
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, email, nome, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, gift_card_id, gift_card_centavos, slot_id, quantidade, metadata, mp_payment_id, payment_provider, fornecedor_id, fornecedor_nome, valor_cheio_centavos, valor_repasse_centavos, valor_comissao_centavos, status_fornecedor",
    )
    .eq("mp_payment_id", paymentId)
    .maybeSingle();
  if (!error && data) return data as BookingRow;
  if (error) {
    console.warn(
      "[Elarah Payment/MP] lookup mp_payment_id falhou, tentando stripe_session_id",
      error.message,
    );
  }
  // Fallback: pelo placeholder "MP-<id>" na coluna stripe_session_id.
  const { data: data2 } = await supabase
    .from("bookings")
    .select(
      "id, email, nome, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, gift_card_id, gift_card_centavos, slot_id, quantidade, metadata, mp_payment_id, payment_provider, fornecedor_id, fornecedor_nome, valor_cheio_centavos, valor_repasse_centavos, valor_comissao_centavos, status_fornecedor",
    )
    .eq("stripe_session_id", "MP-" + paymentId)
    .maybeSingle();
  return (data2 as BookingRow) ?? null;
}

async function markBookingAsPaid(booking: BookingRow, paidAmountCents: number) {
  const patch: Record<string, unknown> = {
    status: "pago",
    amount_total: paidAmountCents,
    currency: "brl",
  };

  // ===== Boundary check: pre-insert vs MP transaction_amount =====
  // O create-mp-pix-payment já gravou amount_total no pre-insert com
  // o valor correto (unit × quantidade − desconto). Se a MP confirmar
  // um valor diferente (ex.: PIX foi gerado errado e cobrou 1 vaga),
  // a gente NÃO pode reverter (já caiu o PIX), mas grava a divergência
  // em metadata.amount_mismatch + log AMOUNT MISMATCH em alto volume,
  // pro admin investigar e estornar manualmente se necessário.
  if (booking.amount_total != null) {
    const expected = Number(booking.amount_total);
    if (
      Number.isFinite(expected) &&
      Number.isFinite(paidAmountCents) &&
      expected !== paidAmountCents
    ) {
      console.error(
        "[Elarah Payment/MP] AMOUNT MISMATCH — MP cobrou um valor diferente do esperado",
        "booking_id=" + booking.id,
        "mp_payment_id=" + (booking.mp_payment_id ?? "?"),
        "expected_from_pre_insert=" + expected,
        "mp_paid_amount=" + paidAmountCents,
        "delta=" + (paidAmountCents - expected),
        "quantidade=" + (booking.quantidade ?? "?"),
        "experiencia_nome=" + (booking.experiencia_nome ?? "?"),
      );
      patch.metadata = {
        ...(booking.metadata ?? {}),
        amount_mismatch: true,
        expected_amount_total_centavos: expected,
        mp_paid_amount_centavos: paidAmountCents,
        delta_centavos: paidAmountCents - expected,
        detected_at: new Date().toISOString(),
      };
    }
  }

  // Reconcilia fornecedor/financeiro se o pre-insert tiver caído no
  // fallback (colunas ausentes ou retry sem dados). Busca a
  // experiência pra recalcular e preencher só o que estiver vazio.
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
      console.info(
        "[Elarah Payment/MP] reconciliando campos financeiros via experience",
        "booking=" + booking.id,
        "exp=" + booking.experiencia_id,
      );
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", booking.id);
  if (error) {
    console.error("[Elarah Payment/MP] update pago falhou", booking.id, error);
    return;
  }
  console.info(
    "[Elarah Payment/MP] booking marcada como pago",
    "booking=" + booking.id,
    "amount_cents=" + paidAmountCents,
  );
  // Dispara confirmação por e-mail.
  await sendBookingConfirmation(booking);
}

async function cancelBooking(booking: BookingRow, newStatus: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", booking.id);
  if (error) {
    console.error(
      "[Elarah Payment/MP] update cancelado falhou",
      booking.id,
      error,
    );
  }
  // Devolve vaga — prioriza slot, fallback pra experiência
  // deno-lint-ignore no-explicit-any
  const bk = booking as any;
  const qty = Number(bk.quantidade) || 1;
  if (bk.slot_id) {
    await supabase
      .rpc("increment_slot_vagas", { p_slot_id: bk.slot_id, p_qty: qty })
      .then(({ error }: { error: unknown }) => {
        if (error) console.error("[Elarah Payment/MP] refund slot vagas", error);
      });
  } else if (booking.experiencia_id) {
    await supabase
      .rpc("increment_experience_vagas", {
        p_experience_id: booking.experiencia_id, p_qty: qty,
      })
      .then(({ error }) => {
        if (error) console.error("[Elarah Payment/MP] refund vagas", error);
      });
  }
  // Devolve cupom
  if (booking.gift_card_id && booking.gift_card_centavos) {
    await supabase
      .rpc("refund_gift_card", {
        p_gift_card_id: booking.gift_card_id,
        p_amount_centavos: booking.gift_card_centavos,
      })
      .then(({ error }) => {
        if (error) console.error("[Elarah Payment/MP] refund cupom", error);
      });
  }
  console.info(
    "[Elarah Payment/MP] booking cancelada",
    "booking=" + booking.id,
    "novo_status=" + newStatus,
  );
}

async function sendBookingConfirmation(booking: BookingRow) {
  if (!booking.email) {
    console.warn(
      "[Elarah Payment/MP] booking sem email — pulando confirmação",
      "booking_id=" + booking.id,
    );
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
      "[Elarah Payment/MP] envio de e-mail falhou",
      "booking_id=" + booking.id,
      "to=" + booking.email,
      "status=" + (result.status ?? "?"),
      "error=" + (result.error ?? "?"),
    );
  }
}

// ===== Handler =====
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
      "[Elarah Payment/MP] webhook: env ausente",
      "MP_TOKEN=" + (MP_ACCESS_TOKEN ? "ok" : "MISSING"),
      "SUPABASE_URL=" + (SUPABASE_URL ? "ok" : "MISSING"),
      "SERVICE_ROLE=" + (SERVICE_ROLE ? "ok" : "MISSING"),
    );
    return new Response("server_misconfigured", { status: 500 });
  }

  // MP manda o payload no body como JSON.
  // Exemplo:
  //   {
  //     "action": "payment.updated",
  //     "api_version": "v1",
  //     "data": { "id": "1234567890" },
  //     "date_created": "...",
  //     "id": 123,
  //     "live_mode": true,
  //     "type": "payment",
  //     "user_id": ...
  //   }
  const rawBody = await req.text();
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("[Elarah Payment/MP] webhook body inválido");
    return new Response("invalid_json", { status: 400 });
  }

  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  // deno-lint-ignore no-explicit-any
  const data = (event.data as any) || {};
  const dataId = data.id ? String(data.id) : null;

  console.info(
    "[Elarah Payment/MP] webhook recebido",
    "action=" + (event.action ?? "?"),
    "type=" + (event.type ?? "?"),
    "data_id=" + (dataId ?? "?"),
    "request_id=" + (requestId ?? "?"),
  );

  // Assinatura
  const signatureOk = await verifyWebhookSignature(
    MP_WEBHOOK_SECRET,
    signatureHeader,
    requestId,
    dataId,
  );
  if (!signatureOk) {
    return new Response("invalid_signature", { status: 401 });
  }

  // Só interessa eventos de pagamento.
  const eventType = String(event.type ?? "");
  if (eventType !== "payment") {
    console.info(
      "[Elarah Payment/MP] evento ignorado (type != payment)",
      eventType,
    );
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!dataId) {
    console.warn("[Elarah Payment/MP] webhook sem data.id — ignorando");
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // Busca o pagamento completo na MP.
  const result = await getPayment(MP_ACCESS_TOKEN, dataId);
  if (!result.ok || !result.payment) {
    console.error(
      "[Elarah Payment/MP] não consegui buscar pagamento",
      "id=" + dataId,
      "status=" + result.errorStatus,
    );
    // Retorna 500 pra que a MP tente de novo.
    return new Response("mp_fetch_failed", { status: 500 });
  }

  const payment = result.payment;
  console.info(
    "[Elarah Payment/MP] pagamento consultado",
    "id=" + payment.id,
    "status=" + payment.status,
    "status_detail=" + payment.status_detail,
    "external_reference=" + (payment.external_reference ?? "?"),
  );

  // Busca a booking via mp_payment_id primeiro; fallback pra
  // external_reference (que é o booking.id gerado por nós).
  let booking = await findBookingByMpPaymentId(String(payment.id));
  if (!booking && payment.external_reference) {
    const { data: byExt } = await supabase
      .from("bookings")
      .select(
        "id, email, nome, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, gift_card_id, gift_card_centavos, slot_id, quantidade, metadata, mp_payment_id, payment_provider, fornecedor_id, fornecedor_nome, valor_cheio_centavos, valor_repasse_centavos, valor_comissao_centavos, status_fornecedor",
      )
      .eq("id", payment.external_reference)
      .maybeSingle();
    if (byExt) booking = byExt as BookingRow;
  }
  if (!booking) {
    console.error(
      "[Elarah Payment/MP] booking não encontrada pro pagamento",
      "payment_id=" + payment.id,
      "external_ref=" + payment.external_reference,
    );
    // Retorna 200 mesmo assim — não há o que fazer, retry não resolve.
    return new Response(JSON.stringify({ received: true, not_found: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Idempotência: se já tá paga, só retorna OK sem reprocessar.
  if (booking.status === "pago") {
    console.info(
      "[Elarah Payment/MP] booking já está pago — ignorando webhook duplicado",
      "booking=" + booking.id,
    );
    return new Response(JSON.stringify({ received: true, idempotent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Processa conforme status do pagamento.
  switch (payment.status) {
    case "approved":
    case "authorized": {
      // MP confirmou o PIX.
      const paidCents = Math.round((payment.transaction_amount || 0) * 100);
      await markBookingAsPaid(booking, paidCents);
      break;
    }
    case "rejected":
    case "cancelled": {
      await cancelBooking(booking, "cancelado");
      break;
    }
    case "refunded":
    case "charged_back": {
      await cancelBooking(booking, "reembolsado");
      break;
    }
    case "in_process":
    case "pending":
    default: {
      // Aguarda próximo webhook — não mexe na booking.
      console.info(
        "[Elarah Payment/MP] status não-terminal — aguardando",
        "status=" + payment.status,
      );
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
