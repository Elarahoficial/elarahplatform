// =============================================================
// ELARAH — send-manual-sale-confirmation Edge Function
// -------------------------------------------------------------
// POST /functions/v1/send-manual-sale-confirmation
//
// Envia pro CLIENTE o MESMO e-mail de confirmação de compra ("Sua
// reserva na Elarah está confirmada ✨") que sai nas compras do site,
// mas para vendas registradas MANUALMENTE pela admin (WhatsApp, Pix
// direto, dinheiro etc.). As vendas manuais não passam pelo webhook de
// pagamento, então esse e-mail nunca saía pra elas — esta função cobre
// isso, tanto no cadastro (chamada por admin.js) quanto sob demanda
// (botão "Enviar confirmação" na aba Compras, útil pras vendas já
// registradas antes desta feature).
//
// Exige JWT válido (verify_jwt=true, default) — só admin autenticada
// dispara. Espelha a montagem de resend-booking-confirmation.
//
// Body JSON:
//   { "manual_sale_id": "uuid" }
//
// Resposta: { ok: true, to } | { ok: false, error, skipped? }.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { bookingConfirmationEmailHtml, sendEmail } from "../_shared/email.ts";

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

// "YYYY-MM-DD" → "dd/mm/aaaa" pro corpo do e-mail. Deixa passar qualquer
// outro formato (texto livre) sem quebrar.
function formatDateBR(d: string | null | undefined): string | null {
  const s = String(d ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
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

  const saleId = String(payload.manual_sale_id ?? "").trim();
  if (!saleId) {
    return jsonResponse({ ok: false, error: "missing_manual_sale_id" }, 400);
  }

  const { data: sale, error } = await supabase
    .from("manual_sales")
    .select("*")
    .eq("id", saleId)
    .maybeSingle();

  if (error) {
    console.error(
      "[Elarah manual-sale-confirmation] erro ao ler venda",
      "sale_id=" + saleId,
      "error=" + error.message,
    );
    return jsonResponse({ ok: false, error: "db_error", detail: error.message }, 500);
  }
  if (!sale) {
    return jsonResponse({ ok: false, error: "sale_not_found" }, 404);
  }
  const to = String(sale.customer_email ?? "").trim();
  if (!to) {
    return jsonResponse({ ok: false, error: "sale_sem_email", skipped: true }, 200);
  }
  // Só confirma venda efetivamente paga — o texto diz "Recebemos seu
  // pagamento". Venda pendente/cancelada não deve mandar confirmação.
  if (sale.payment_status !== "pago") {
    return jsonResponse({ ok: false, error: "sale_nao_paga", skipped: true }, 200);
  }

  // Endereço/bairro/preço vêm da experiência vinculada (fonte da verdade,
  // igual à confirmação de reserva). Sem vínculo (venda por texto livre),
  // o e-mail sai sem o bloco de endereço — melhor mandar do que travar.
  let endereco: string | null = null;
  let bairro: string | null = null;
  let precoLabel: string | null = null;
  if (sale.experience_id) {
    const { data: exp } = await supabase
      .from("experiences")
      .select("endereco, bairro, preco")
      .eq("id", sale.experience_id)
      .maybeSingle();
    if (exp) {
      endereco = (exp.endereco as string | null) || null;
      bairro = (exp.bairro as string | null) || null;
      precoLabel = (exp.preco as string | null) || null;
    }
  }

  const html = bookingConfirmationEmailHtml({
    nome: sale.customer_name,
    experienciaNome: sale.experience_name ?? "Sua experiência",
    data: formatDateBR(sale.slot_date),
    horario: sale.slot_time,
    endereco,
    bairro,
    precoLabel,
    quantidade: sale.quantity ?? null,
    amountTotalCentavos: sale.total_amount_centavos ?? null,
    bookingId: sale.id,
  });

  const result = await sendEmail({
    to,
    subject: "Sua reserva na Elarah está confirmada ✨",
    html,
  });

  if (!result.ok) {
    console.error(
      "[Elarah manual-sale-confirmation] envio falhou",
      "sale_id=" + sale.id,
      "to=" + to,
      "status=" + (result.status ?? "?"),
      "error=" + (result.error ?? "?"),
    );
    return jsonResponse(
      { ok: false, error: "email_failed", detail: result.error ?? null },
      502,
    );
  }

  // Carimba o envio (best-effort — não falha a resposta se a coluna não
  // existir ainda). Deixa o painel mostrar "✓ confirmação enviada".
  try {
    await supabase
      .from("manual_sales")
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq("id", sale.id);
  } catch (_e) { /* coluna pode não existir (migração não rodada) */ }

  console.info(
    "[Elarah manual-sale-confirmation] confirmação enviada",
    "sale_id=" + sale.id,
    "to=" + to,
  );
  return jsonResponse({ ok: true, to });
});
