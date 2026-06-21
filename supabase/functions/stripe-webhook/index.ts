// =============================================================
// ELARAH — stripe-webhook Edge Function
// -------------------------------------------------------------
// POST /functions/v1/stripe-webhook
//
// Eventos tratados:
//   * checkout.session.completed
//       - reserva (kind=experience) → status='pago', envia email
//       - gift card (kind=gift_card) → gera código, envia email
//   * checkout.session.expired      → status='expirado',
//                                     refund vaga + refund cupom
//   * checkout.session.async_payment_failed → status='cancelado',
//                                     refund vaga + refund cupom
//   * charge.refunded               → status='reembolsado',
//                                     refund vaga + refund cupom
//
// Variáveis de ambiente:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY        (opcional — sem ele, e-mails são pulados)
//   ELARAH_FROM_EMAIL     (opcional)
//
// Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bookingConfirmationEmailHtml,
  generateGiftCardCode,
  giftCardEmailHtml,
  sendAdminSaleNotification,
  sendEmail,
} from "../_shared/email.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
}

async function getBookingBySession(sessionId: string): Promise<BookingRow | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, email, nome, user_id, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, gift_card_id, gift_card_centavos, coupon_id, coupon_discount_centavos, slot_id, quantidade, metadata, fornecedor_id, fornecedor_nome, valor_cheio_centavos, valor_repasse_centavos, valor_comissao_centavos, status_fornecedor",
    )
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) {
    console.error("[stripe-webhook] booking lookup error", sessionId, error);
    return null;
  }
  return (data as BookingRow) ?? null;
}

async function updateBookingBySession(
  sessionId: string,
  patch: Record<string, unknown>,
) {
  let { error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("stripe_session_id", sessionId);

  // Fallback: se a coluna `telefone` não existir no banco (migração
  // nova não rodou), remove do patch e tenta de novo. Evita que o
  // update de status='pago' falhe inteiro por causa de um campo
  // auxiliar.
  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (
      "telefone" in patch &&
      msg.includes("telefone") &&
      (msg.includes("column") || msg.includes("schema cache"))
    ) {
      console.warn(
        "[stripe-webhook] coluna telefone ausente — retry update sem ela",
        sessionId
      );
      const { telefone: _drop, ...rest } = patch;
      const retry = await supabase
        .from("bookings")
        .update(rest)
        .eq("stripe_session_id", sessionId);
      error = retry.error;
    }
  }

  if (error) {
    console.error("[stripe-webhook] booking update error", sessionId, error);
  }
}

async function refundReservationSideEffects(booking: BookingRow | null) {
  if (!booking) return;
  // Devolve a vaga — prioriza slot-level, fallback pro experience-level
  // deno-lint-ignore no-explicit-any
  const bk = booking as any;
  const qty = Number(bk.quantidade) || 1;
  if (bk.slot_id) {
    await supabase
      .rpc("increment_slot_vagas", { p_slot_id: bk.slot_id, p_qty: qty })
      .then(({ error }: { error: unknown }) => {
        if (error) console.error("[stripe-webhook] slot vagas refund", error);
      });
  } else if (booking.experiencia_id) {
    await supabase
      .rpc("increment_experience_vagas", {
        p_experience_id: booking.experiencia_id, p_qty: qty,
      })
      .then(({ error }) => {
        if (error) console.error("[stripe-webhook] vagas refund", error);
      });
  }
  // Devolve saldo ao gift card usado (legado)
  if (booking.gift_card_id && booking.gift_card_centavos) {
    await supabase
      .rpc("refund_gift_card", {
        p_gift_card_id: booking.gift_card_id,
        p_amount_centavos: booking.gift_card_centavos,
      })
      .then(({ error }) => {
        if (error) console.error("[stripe-webhook] gift refund", error);
      });
  }
  // Devolve uso ao cupom promocional (sistema novo)
  if (booking.coupon_id) {
    await supabase
      .rpc("refund_coupon", { p_coupon_id: booking.coupon_id })
      .then(({ error }) => {
        if (error) console.error("[stripe-webhook] coupon refund", error);
      });
  }
}

async function activateGiftCardFromSession(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const valor = Number(meta.valor_centavos ?? session.amount_total ?? 0);
  if (!valor || valor <= 0) {
    console.warn("[stripe-webhook] gift card sem valor", session.id);
    return;
  }

  const recipient = String(meta.recipient_email ?? "").trim();
  const recipientNome = String(meta.recipient_nome ?? "").trim() || null;
  const buyerEmail = String(meta.buyer_email ?? "").trim() || null;
  const buyerNome = String(meta.buyer_nome ?? "").trim() || null;
  const mensagem = String(meta.mensagem ?? "").trim() || null;

  // ----- Idempotência -----
  // Se o webhook já rodou antes (Stripe às vezes reentrega o mesmo
  // evento), reaproveita o gift card existente pra não gerar um novo
  // código nem enviar um e-mail com código diferente do primeiro.
  const { data: existing } = await supabase
    .from("gift_cards")
    .select("id, code, status, email_sent_at, expires_at")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  let code = "";
  let expiresAtIso = "";
  let isReplay = false;

  if (
    existing &&
    existing.status === "active" &&
    existing.code &&
    !existing.code.startsWith("PENDING-")
  ) {
    // Reentrega do webhook — reusa o código que já existe.
    code = existing.code;
    expiresAtIso = existing.expires_at ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    isReplay = true;
    console.info(
      "[stripe-webhook] gift card já ativo, reusando code existente",
      session.id,
      code,
    );
  } else {
    // Primeira execução — gera código único, tentando no máx. 5 vezes
    // em caso de colisão improvável.
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
      console.error(
        "[stripe-webhook] não foi possível gerar code único",
        session.id,
      );
      return;
    }
    expiresAtIso = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Atualiza o registro pre-criado em create-checkout-session.
    // Só atualiza se o status ainda for pending — protege contra
    // sobrescrever uma linha já ativada.
    const { data: updated, error: updErr } = await supabase
      .from("gift_cards")
      .update({
        code,
        status: "active",
        valor_inicial_centavos: valor,
        saldo_centavos: valor,
        destinatario_email: recipient || null,
        destinatario_nome: recipientNome,
        comprador_email: buyerEmail,
        comprador_nome: buyerNome,
        mensagem,
        expires_at: expiresAtIso,
        email_sent_at: null,
      })
      .eq("stripe_session_id", session.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (updErr || !updated) {
      // Pré-insert falhou; faz upsert manual.
      console.warn(
        "[stripe-webhook] update gift_card falhou, tentando insert",
        updErr,
      );
      const { error: insErr } = await supabase.from("gift_cards").insert({
        code,
        valor_inicial_centavos: valor,
        saldo_centavos: valor,
        status: "active",
        stripe_session_id: session.id,
        destinatario_email: recipient || null,
        destinatario_nome: recipientNome,
        comprador_email: buyerEmail,
        comprador_nome: buyerNome,
        mensagem,
        expires_at: expiresAtIso,
      });
      if (insErr) {
        console.error(
          "[stripe-webhook] insert gift_card fallback também falhou",
          insErr,
        );
        return;
      }
    }
  }

  // Na reentrega, se o e-mail já foi enviado da primeira vez, pula
  // (evita duplicar a notificação pro cliente).
  if (isReplay && existing && existing.email_sent_at) {
    console.info(
      "[stripe-webhook] gift card email já enviado antes, pulando reenvio",
      session.id,
    );
    return;
  }

  const expiresAtLabel = new Date(expiresAtIso).toLocaleDateString("pt-BR");

  // ----- Envia o email para o destinatário -----
  if (!recipient) {
    console.error(
      "[stripe-webhook] gift card sem recipient_email — e-mail principal " +
        "não pôde ser enviado. session=" + session.id,
    );
  } else {
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
      await supabase
        .from("gift_cards")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("stripe_session_id", session.id);
    } else {
      console.error(
        "[stripe-webhook] FALHA ao enviar gift card pro destinatário",
        "session=" + session.id,
        "to=" + recipient,
        "skipped=" + (result.skipped ? "true" : "false"),
        "status=" + (result.status ?? "?"),
        "error=" + (result.error ?? "?"),
      );
    }
  }

  // ----- E-mail de cópia ao comprador (mesmo código) -----
  // Só envia cópia se o comprador informou e-mail e se for diferente do
  // destinatário (senão ele já recebeu o e-mail acima).
  if (
    buyerEmail &&
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
        "[stripe-webhook] FALHA ao enviar cópia do gift card pro comprador",
        "session=" + session.id,
        "to=" + buyerEmail,
        "skipped=" + (buyerResult.skipped ? "true" : "false"),
        "status=" + (buyerResult.status ?? "?"),
        "error=" + (buyerResult.error ?? "?"),
      );
    }
  } else if (!buyerEmail) {
    console.warn(
      "[stripe-webhook] comprador sem e-mail — nenhuma cópia enviada. " +
        "session=" + session.id,
    );
  }
}

// Marca a booking como paga (UPDATE) e dispara o e-mail de
// confirmação. Usado tanto pelo fluxo síncrono do cartão (`completed`
// com payment_status='paid') quanto pelo fluxo assíncrono do PIX
// (`async_payment_succeeded`).
//
// Idempotente: se a booking já estiver como 'pago' quando for chamada
// de novo (ex.: Stripe reentregou o mesmo evento), o UPDATE continua
// passando mas o e-mail pode ser reenviado. Se isso virar problema,
// o ideal é adicionar uma coluna `confirmation_email_sent_at` e
// checar aqui antes de mandar. Por ora, deixa simples — e-mail
// duplicado é menos ruim do que cliente sem confirmação.
async function markBookingAsPaid(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const telefoneFromMeta = String(meta.telefone ?? "").trim() ||
    String(meta.telefone_digits ?? "").trim();
  const nomeFromMeta = String(meta.nome ?? "").trim();

  // Campos de fornecedor/financeiro no metadata — safety net. Só
  // aplica via COALESCE (DB-side) pra não sobrescrever valores já
  // persistidos pelo pre-insert. Lê o atual primeiro, só atualiza
  // o que estiver vazio.
  const existing = await getBookingBySession(session.id);

  const stripeAmountTotal = session.amount_total ?? null;
  const updatePatch: Record<string, unknown> = {
    status: "pago",
    stripe_payment_intent: session.payment_intent ?? null,
    amount_total: stripeAmountTotal,
    currency: session.currency ?? "brl",
  };
  if (telefoneFromMeta) {
    updatePatch.telefone = telefoneFromMeta;
  }
  if (nomeFromMeta) {
    updatePatch.nome = nomeFromMeta;
  }

  // ===== Boundary check: pre-insert vs Stripe amount_total =====
  // O create-checkout-session já gravou amount_total no pre-insert
  // com o valor correto (unit × quantidade − desconto + taxa). Se a
  // sessão Stripe vier com um total diferente, é sintoma de bug —
  // tipicamente "cobrou só 1 unidade". A gente NÃO pode reverter o
  // pagamento aqui (Stripe já cobrou), mas grava a divergência em
  // metadata.amount_mismatch + log AMOUNT MISMATCH em alto volume,
  // pro admin investigar e estornar manualmente se necessário.
  let amountMismatchInfo: Record<string, unknown> | null = null;
  if (existing && existing.amount_total != null && stripeAmountTotal != null) {
    const expected = Number(existing.amount_total);
    const actual = Number(stripeAmountTotal);
    if (Number.isFinite(expected) && Number.isFinite(actual) && expected !== actual) {
      // deno-lint-ignore no-explicit-any
      const ex = existing as any;
      console.error(
        "[Elarah Payment] AMOUNT MISMATCH — Stripe cobrou um valor diferente do esperado",
        "session=" + session.id,
        "booking_id=" + existing.id,
        "expected_from_pre_insert=" + expected,
        "stripe_session_amount_total=" + actual,
        "delta=" + (actual - expected),
        "quantidade=" + (ex.quantidade ?? "?"),
        "experiencia_nome=" + (existing.experiencia_nome ?? "?"),
      );
      amountMismatchInfo = {
        amount_mismatch: true,
        expected_amount_total_centavos: expected,
        stripe_amount_total_centavos: actual,
        delta_centavos: actual - expected,
        detected_at: new Date().toISOString(),
      };
    }
  }

  // Reconcilia fornecedor/financeiro se faltarem — usa metadata do
  // Stripe como fonte secundária. Evita sobrescrever valores válidos
  // já no banco.
  if (existing) {
    // deno-lint-ignore no-explicit-any
    const ex = existing as any;
    const fornId = String(meta.fornecedor_id ?? "").trim();
    const fornNome = String(meta.fornecedor_nome ?? "").trim();
    const vCheio = Number(meta.valor_cheio_centavos ?? 0);
    const vRepasse = Number(meta.valor_repasse_centavos ?? 0);
    const vComissao = Number(meta.valor_comissao_centavos ?? 0);
    if (fornId && !ex.fornecedor_id) updatePatch.fornecedor_id = fornId;
    if (fornNome && !ex.fornecedor_nome) updatePatch.fornecedor_nome = fornNome;
    if (vCheio > 0 && !ex.valor_cheio_centavos) {
      updatePatch.valor_cheio_centavos = vCheio;
    }
    if (vRepasse > 0 && !ex.valor_repasse_centavos) {
      updatePatch.valor_repasse_centavos = vRepasse;
    }
    if (vComissao > 0 && !ex.valor_comissao_centavos) {
      updatePatch.valor_comissao_centavos = vComissao;
    }
    if (!ex.status_fornecedor) {
      updatePatch.status_fornecedor = "repasse_pendente";
    }
    // Mescla flag de mismatch no metadata existente, pra preservar
    // bairro/endereco/etc. Sobrescrever metadata por inteiro perderia
    // informação útil.
    if (amountMismatchInfo) {
      updatePatch.metadata = {
        ...(existing.metadata ?? {}),
        ...amountMismatchInfo,
      };
    }
  }

  await updateBookingBySession(session.id, updatePatch);
  const booking = await getBookingBySession(session.id);
  if (!booking) {
    console.error(
      "[Elarah Payment] booking não encontrado após UPDATE — ",
      "session=" + session.id,
      "— e-mail de confirmação NÃO pode ser enviado. Verifique",
      "se create-checkout-session gravou a booking antes do",
      "redirect pro Stripe.",
    );
    return;
  }
  if (booking.status !== "pago") {
    console.warn(
      "[Elarah Payment] booking existe mas status=" + booking.status +
        " (esperado 'pago') — e-mail será enviado mesmo assim.",
    );
  }
  // Registra uso definitivo do cupom (se houve). Idempotente: o RPC
  // dedup por booking_id, então rodar 2x não duplica registro.
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
      console.error("[stripe-webhook] register_coupon_use falhou", useErr);
    } else {
      console.info(
        "[stripe-webhook] uso de cupom registrado",
        "coupon=" + booking.coupon_id,
        "booking=" + booking.id,
        "discount=" + (booking.coupon_discount_centavos ?? 0),
      );
    }
  }
  await sendBookingConfirmation(booking);
  await notifyAdminOfSale(booking, "Cartão (Stripe)");
}

// Avisa os admins da Elarah que saiu uma venda. Fica junto da
// confirmação ao cliente (mesmo ponto idempotente) pra não disparar
// duplicado. Best-effort — qualquer falha só loga.
async function notifyAdminOfSale(booking: BookingRow, paymentMethod: string) {
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  await sendAdminSaleNotification({
    experienciaNome: booking.experiencia_nome ?? "Experiência",
    clienteNome: booking.nome,
    clienteEmail: booking.email,
    data: booking.data,
    horario: booking.horario,
    quantidade: (booking as { quantidade?: number | null }).quantidade ?? null,
    amountTotalCentavos: booking.amount_total ?? null,
    precoLabel: booking.preco_label,
    bookingId: booking.id,
    paymentMethod,
    couponCode: (booking as { coupon_code?: string | null }).coupon_code ?? null,
    couponDiscountCentavos:
      (booking as { coupon_discount_centavos?: number | null }).coupon_discount_centavos ?? null,
    fornecedorNome: (booking as { fornecedor_nome?: string | null }).fornecedor_nome ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    endereco: (meta.endereco as string | null) ?? null,
  });
}

async function sendBookingConfirmation(booking: BookingRow) {
  if (!booking.email) {
    console.warn(
      "[stripe-webhook] booking sem email — não dá pra enviar confirmação",
      "booking_id=" + booking.id,
    );
    return;
  }
  console.info(
    "[stripe-webhook] enviando confirmação de reserva",
    "booking_id=" + booking.id,
    "to=" + booking.email,
    "experiencia=" + (booking.experiencia_nome ?? "?"),
  );
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
    amountTotalCentavos: booking.amount_total ?? null,
    participantes: Array.isArray((meta as { participantes?: unknown }).participantes)
      ? ((meta as { participantes?: Array<{ nome?: string | null }> }).participantes ?? null)
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
    // NÃO relança o erro — o pagamento já foi confirmado e o estado
    // da booking é 'pago'. Só loga pra diagnóstico.
    console.error(
      "[stripe-webhook] FALHA ao enviar confirmação de reserva —",
      "booking_id=" + booking.id,
      "to=" + booking.email,
      "skipped=" + (result.skipped ? "true" : "false"),
      "status=" + (result.status ?? "?"),
      "error=" + (result.error ?? "?"),
    );
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SERVICE_ROLE) {
    console.error(
      "[stripe-webhook] VARIÁVEIS DE AMBIENTE AUSENTES — webhook não pode processar eventos.",
      "STRIPE_SECRET_KEY=" + (STRIPE_SECRET_KEY ? "ok" : "MISSING"),
      "STRIPE_WEBHOOK_SECRET=" + (STRIPE_WEBHOOK_SECRET ? "ok" : "MISSING"),
      "SUPABASE_SERVICE_ROLE_KEY=" + (SERVICE_ROLE ? "ok" : "MISSING"),
      "— cadastre em Supabase → Project Settings → Edge Functions → Secrets",
    );
    return new Response("server_misconfigured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("missing_signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed", e);
    return new Response("invalid_signature", { status: 400 });
  }

  // Log de entrada — confirma que o webhook foi invocado pelo Stripe
  // e qual evento chegou. Aparece em Supabase → Edge Functions →
  // stripe-webhook → Logs. Serve de "pulso" pra saber se o webhook
  // está conectado mesmo.
  console.info(
    "[stripe-webhook] evento recebido",
    "type=" + event.type,
    "id=" + event.id,
    "livemode=" + event.livemode,
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) {
          console.warn("[stripe-webhook] completed sem session.id — ignorando");
          break;
        }
        const kind = String(session.metadata?.kind ?? "experience");
        console.info(
          "[Elarah Payment] checkout.session.completed",
          "session=" + session.id,
          "kind=" + kind,
          "payment_status=" + (session.payment_status ?? "?"),
          "amount_total=" + (session.amount_total ?? "?"),
          "payment_intent=" + (session.payment_intent ?? "?"),
        );

        if (kind === "gift_card") {
          await activateGiftCardFromSession(session);
          break;
        }

        // Stripe agora só processa cartão — pagamento é síncrono, então
        // session.payment_status deve vir 'paid'. Se por algum motivo
        // vier diferente, logamos e ainda marcamos como pago (fallback
        // conservador pra não deixar o cliente sem confirmação).
        if (session.payment_status && session.payment_status !== "paid") {
          console.warn(
            "[Elarah Payment] completed com payment_status inesperado — marcando como pago mesmo assim",
            "session=" + session.id,
            "payment_status=" + session.payment_status,
          );
        }

        await markBookingAsPaid(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) break;
        const kind = String(session.metadata?.kind ?? "experience");
        if (kind === "gift_card") {
          await supabase
            .from("gift_cards")
            .update({ status: "cancelled" })
            .eq("stripe_session_id", session.id);
          break;
        }
        const booking = await getBookingBySession(session.id);
        await updateBookingBySession(session.id, { status: "expirado" });
        await refundReservationSideEffects(booking);
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) break;
        const kind = String(session.metadata?.kind ?? "experience");
        if (kind === "gift_card") {
          await supabase
            .from("gift_cards")
            .update({ status: "cancelled" })
            .eq("stripe_session_id", session.id);
          break;
        }
        const booking = await getBookingBySession(session.id);
        await updateBookingBySession(session.id, { status: "cancelado" });
        await refundReservationSideEffects(booking);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (!pi) break;
        // Busca booking pela payment intent pra fazer side effects
        const { data: refundBookings } = await supabase
          .from("bookings")
          .select(
            "id, email, nome, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, gift_card_id, gift_card_centavos, slot_id, quantidade, metadata",
          )
          .eq("stripe_payment_intent", pi);
        if (refundBookings && refundBookings.length) {
          for (const b of refundBookings) {
            await refundReservationSideEffects(b as BookingRow);
          }
        }
        const { error } = await supabase
          .from("bookings")
          .update({ status: "reembolsado" })
          .eq("stripe_payment_intent", pi);
        if (error) console.error("[stripe-webhook] refund update error", error);
        break;
      }
      default:
        // Ignora silenciosamente eventos não usados.
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] handler exception", e);
    return new Response("handler_error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
