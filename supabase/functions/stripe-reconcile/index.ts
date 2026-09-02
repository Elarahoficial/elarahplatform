// =============================================================
// ELARAH — stripe-reconcile Edge Function
// -------------------------------------------------------------
// POST /functions/v1/stripe-reconcile
//
// REDE DE SEGURANÇA do pagamento por cartão (Stripe).
//
// Problema que resolve:
//   O fluxo normal depende do webhook `stripe-webhook` receber o
//   evento `checkout.session.completed` do Stripe pra marcar a
//   reserva como 'pago', avisar o admin e mandar a confirmação pro
//   cliente. Se o webhook falhar (endpoint mal configurado, signing
//   secret errado, função fora do ar, Stripe sem entregar), o cliente
//   PAGA mas a reserva fica presa em 'pending' — some do painel e
//   ninguém recebe e-mail. Foi exatamente isso que aconteceu.
//
// O que esta função faz:
//   1. Lista as reservas em 'pending' com stripe_session_id 'cs_...'
//      criadas nos últimos N dias.
//   2. Pra CADA uma, consulta o Stripe (fonte da verdade) o status
//      real da sessão de checkout.
//   3. Se o Stripe confirma pagamento (payment_status='paid'),
//      RECUPERA a reserva: marca 'pago', grava o payment_intent,
//      registra uso de cupom, envia a confirmação pro cliente e o
//      aviso de venda pro admin — igual o webhook faria.
//   4. Devolve um resumo do que recuperou.
//
// Idempotente: só toca em reservas que AINDA estão 'pending'. Depois
// de recuperada, a reserva vira 'pago' e não é reprocessada. Grava
// metadata.reconciled_at pra rastreio.
//
// Segurança conservadora: NÃO mexe em estoque de vagas (o pre-insert
// já decrementou a vaga quando a reserva nasceu) e só age quando o
// Stripe confirma o pagamento — nunca marca pago no escuro.
//
// Auth (uma das opções):
//   Authorization: Bearer <CRON_SECRET>              (cron / pg_cron)
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>(cron)
//   Authorization: Bearer <jwt do admin>             (uso manual)
//
// Body (opcional):
//   { period_days?: number = 3, limit?: number = 200, dry_run?: bool }
//
// Deploy:
//   supabase functions deploy stripe-reconcile --no-verify-jwt
//
// Agendamento: sql/elarah_stripe_reconcile_cron.sql
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  bookingConfirmationEmailHtml,
  sendAdminSaleNotification,
  sendEmail,
} from "../_shared/email.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

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
  stripe_session_id: string | null;
  coupon_id: string | null;
  coupon_code: string | null;
  coupon_discount_centavos: number | null;
  user_id: string | null;
  quantidade: number | null;
  fornecedor_nome: string | null;
  metadata: Record<string, unknown> | null;
}

// -----------------------------------------------------------
// Auth — CRON_SECRET / service_role (cron) OU admin JWT (UI).
// -----------------------------------------------------------
async function authorizeRequest(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return false;
  const token = m[1].trim();

  // Cron: bate com CRON_SECRET ou com a própria service_role key.
  if (CRON_SECRET && token === CRON_SECRET) return true;
  if (SERVICE_ROLE && token === SERVICE_ROLE) return true;

  // Admin manual: valida o JWT e confere is_admin() no banco.
  if (!SUPABASE_ANON_KEY) return false;
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error } = await client.auth.getUser(token);
    if (error || !userData?.user) return false;
    const { data: isAdmin, error: rpcErr } = await client.rpc("is_admin");
    if (rpcErr || !isAdmin) return false;
    return true;
  } catch (_e) {
    return false;
  }
}

// Marca a reserva paga e dispara os e-mails — espelha o que o
// stripe-webhook faz no checkout.session.completed, mas sem mexer em
// estoque (a vaga já foi decrementada no pre-insert). Só é chamada
// depois que o Stripe confirmou o pagamento.
async function fulfillBooking(
  booking: BookingRow,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  const paymentIntent = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  const patch: Record<string, unknown> = {
    status: "pago",
    stripe_payment_intent: paymentIntent,
    amount_total: session.amount_total ?? booking.amount_total,
    currency: session.currency ?? "brl",
    metadata: {
      ...meta,
      reconciled_at: new Date().toISOString(),
      reconciled_source: "stripe-reconcile",
    },
  };

  // Só marca 'pago' se AINDA estiver 'pending' — trava anti-corrida
  // com o webhook. Se o webhook chegou primeiro, o .eq('status',
  // 'pending') não casa, nada é atualizado e a gente não reenvia
  // e-mail duplicado.
  const { data: updated, error: updErr } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", booking.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updErr) {
    console.error(
      "[stripe-reconcile] falha ao marcar pago",
      "booking=" + booking.id,
      updErr,
    );
    throw updErr;
  }
  if (!updated) {
    // Alguém (webhook) já processou entre a leitura e o update.
    console.info(
      "[stripe-reconcile] booking já não estava pending — pulando e-mails",
      "booking=" + booking.id,
    );
    return;
  }

  // Registra uso definitivo do cupom (idempotente por booking_id).
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
      console.error("[stripe-reconcile] register_coupon_use falhou", useErr);
    }
  }

  // Confirmação pro cliente.
  if (booking.email) {
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
      amountTotalCentavos: booking.amount_total ?? session.amount_total ?? null,
      participantes: Array.isArray((meta as { participantes?: unknown }).participantes)
        ? ((meta as { participantes?: Array<{ nome?: string | null }> }).participantes ?? null)
        : null,
      bookingId: booking.id,
      variantLabel: (meta.variant_label as string | undefined) ?? null,
      variantSelected: (meta.variant_selected as string | undefined) ?? null,
    });
    const res = await sendEmail({
      to: booking.email,
      subject: "Sua reserva na Elarah está confirmada ✨",
      html,
    });
    if (!res.ok) {
      console.error(
        "[stripe-reconcile] FALHA ao enviar confirmação",
        "booking=" + booking.id,
        "to=" + booking.email,
        "error=" + (res.error ?? "?"),
      );
    }
  } else {
    console.warn(
      "[stripe-reconcile] booking sem email — confirmação não enviada",
      "booking=" + booking.id,
    );
  }

  // Aviso de venda pro admin.
  await sendAdminSaleNotification({
    experienciaNome: booking.experiencia_nome ?? "Experiência",
    clienteNome: booking.nome,
    clienteEmail: booking.email,
    data: booking.data,
    horario: booking.horario,
    quantidade: booking.quantidade ?? null,
    amountTotalCentavos: booking.amount_total ?? session.amount_total ?? null,
    precoLabel: booking.preco_label,
    bookingId: booking.id,
    paymentMethod: "Cartão (Stripe · recuperado)",
    couponCode: booking.coupon_code ?? null,
    couponDiscountCentavos: booking.coupon_discount_centavos ?? null,
    fornecedorNome: booking.fornecedor_nome ?? null,
    bairro: (meta.bairro as string | null) ?? null,
    endereco: (meta.endereco as string | null) ?? null,
  });

  console.info(
    "[stripe-reconcile] RECUPERADA",
    "booking=" + booking.id,
    "experiencia=" + (booking.experiencia_nome ?? "?"),
    "email=" + (booking.email ?? "?"),
    "amount=" + (session.amount_total ?? "?"),
  );
}

interface Summary {
  scanned: number;
  recovered: Array<{ booking_id: string; email: string | null; experiencia: string | null; amount_total: number | null }>;
  still_unpaid: Array<{ booking_id: string; session_id: string | null; payment_status: string | null }>;
  errors: Array<{ booking_id: string; error: string }>;
  dry_run: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!STRIPE_SECRET_KEY || !SERVICE_ROLE || !SUPABASE_URL) {
    console.error(
      "[stripe-reconcile] VARIÁVEIS DE AMBIENTE AUSENTES",
      "STRIPE_SECRET_KEY=" + (STRIPE_SECRET_KEY ? "ok" : "MISSING"),
      "SUPABASE_SERVICE_ROLE_KEY=" + (SERVICE_ROLE ? "ok" : "MISSING"),
    );
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authorized = await authorizeRequest(req);
  if (!authorized) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { period_days?: number; limit?: number; dry_run?: boolean } = {};
  try {
    const txt = await req.text();
    if (txt) body = JSON.parse(txt);
  } catch {
    // body opcional — segue com defaults.
  }

  const periodDays = Math.min(Math.max(Number(body.period_days) || 3, 1), 60);
  const limit = Math.min(Math.max(Number(body.limit) || 200, 1), 500);
  const dryRun = body.dry_run === true;
  const sinceIso = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
    .toISOString();

  const summary: Summary = {
    scanned: 0,
    recovered: [],
    still_unpaid: [],
    errors: [],
    dry_run: dryRun,
  };

  // Busca reservas presas em 'pending' com sessão Stripe real.
  const { data: pendings, error: qErr } = await supabase
    .from("bookings")
    .select(
      "id, email, nome, user_id, experiencia_id, experiencia_nome, data, horario, preco_label, amount_total, status, stripe_session_id, coupon_id, coupon_code, coupon_discount_centavos, quantidade, fornecedor_nome, metadata",
    )
    .eq("status", "pending")
    .like("stripe_session_id", "cs_%")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (qErr) {
    console.error("[stripe-reconcile] query pendings error", qErr);
    return new Response(JSON.stringify({ error: "query_failed", detail: qErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows = (pendings ?? []) as BookingRow[];
  summary.scanned = rows.length;
  console.info(
    "[stripe-reconcile] início",
    "period_days=" + periodDays,
    "pendentes=" + rows.length,
    "dry_run=" + dryRun,
  );

  for (const booking of rows) {
    const sessionId = booking.stripe_session_id;
    if (!sessionId) continue;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paid = session.payment_status === "paid" ||
        session.payment_status === "no_payment_required";
      if (!paid) {
        summary.still_unpaid.push({
          booking_id: booking.id,
          session_id: sessionId,
          payment_status: session.payment_status ?? null,
        });
        continue;
      }
      if (dryRun) {
        summary.recovered.push({
          booking_id: booking.id,
          email: booking.email,
          experiencia: booking.experiencia_nome,
          amount_total: session.amount_total ?? booking.amount_total,
        });
        continue;
      }
      await fulfillBooking(booking, session);
      summary.recovered.push({
        booking_id: booking.id,
        email: booking.email,
        experiencia: booking.experiencia_nome,
        amount_total: session.amount_total ?? booking.amount_total,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        "[stripe-reconcile] erro ao processar booking",
        "booking=" + booking.id,
        "session=" + sessionId,
        msg,
      );
      summary.errors.push({ booking_id: booking.id, error: msg });
    }
  }

  console.info(
    "[stripe-reconcile] fim",
    "recuperadas=" + summary.recovered.length,
    "ainda_nao_pagas=" + summary.still_unpaid.length,
    "erros=" + summary.errors.length,
  );

  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
