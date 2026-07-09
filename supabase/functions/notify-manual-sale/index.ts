// =============================================================
// ELARAH — notify-manual-sale Edge Function
// -------------------------------------------------------------
// POST /functions/v1/notify-manual-sale
//
// Dispara o MESMO e-mail de "Nova venda 🎉" que sai nas vendas
// automáticas (Stripe/Mercado Pago), mas para vendas registradas
// manualmente pela admin no painel de Contabilidade.
//
// Chamado por admin.js (_finSaveManualSale) logo após inserir uma
// venda nova em `manual_sales`. Exige JWT válido (verify_jwt=true,
// default) — só admin autenticada consegue disparar.
//
// Body JSON (campos da venda manual, todos opcionais exceto o nome
// da experiência):
//   {
//     "experience_name": "...",
//     "customer_name": "...",
//     "customer_email": "...",
//     "slot_date": "2026-07-10",
//     "slot_time": "19:00",
//     "quantity": 2,
//     "total_amount_centavos": 24000,
//     "payment_method": "pix",
//     "payment_status": "pago",
//     "coupon_code": "...",
//     "discount_centavos": 0,
//     "supplier_name": "..."
//   }
//
// Resposta: { ok: true, skipped?: boolean } ou { ok: false, error }.
// Best-effort no cliente: uma falha aqui NÃO deve derrubar o
// salvamento da venda (a venda já foi gravada antes de chamar).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { sendAdminSaleNotification } from "../_shared/email.ts";

// Rótulo amigável do tipo de evento pro assunto/corpo do e-mail.
// Espelha o <select id="ms-event-type"> do painel. Retorna null quando
// não é evento (ou não dá pra saber o tipo):
//   - is_event === false  → "Não é evento" (nunca rotula)
//   - event_type presente → rótulo do tipo ("outro" usa o texto livre)
//   - sem tipo + qty >= 2  → "Evento" genérico (mesma regra da aba Eventos)
function eventoLabel(payload: Record<string, unknown>): string | null {
  const map: Record<string, string> = {
    meu_grupo: "Meu grupo",
    aniversario_adulto: "Aniversário adulto",
    aniversario_kids: "Aniversário kids",
    despedida_solteira: "Despedida de solteira",
    despedida_solteiro: "Despedida de solteiro",
    corporativo: "Corporativo",
  };
  if (payload.is_event === false) return null;
  const t = payload.event_type ? String(payload.event_type) : "";
  if (t) {
    if (t === "outro") {
      const custom = String(payload.event_type_custom ?? "").trim();
      return custom || "Evento";
    }
    return map[t] ?? t;
  }
  // Sem tipo explícito: a aba Eventos lista vendas com mais de 2 pessoas.
  const qty = Number(payload.quantity);
  if (Number.isFinite(qty) && qty >= 3) return "Evento";
  return null;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Texto amigável do meio de pagamento pro e-mail. Mapeia os valores
// do <select> de venda manual e sempre deixa claro que é manual.
function paymentLabel(
  method?: string | null,
  status?: string | null,
): string {
  const map: Record<string, string> = {
    pix: "Pix",
    cartao: "Cartão",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    dinheiro: "Dinheiro",
    transferencia: "Transferência",
    boleto: "Boleto",
    link: "Link de pagamento",
  };
  const base = method ? (map[method] ?? method) : null;
  const parts = [base, "venda manual"].filter(Boolean);
  let label = parts.join(" · ");
  // Deixa explícito quando ainda não foi pago, pra não parecer venda fechada.
  if (status && status !== "pago") {
    label += ` (${status})`;
  }
  return label;
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

  const experienciaNome = String(payload.experience_name ?? "").trim();
  if (!experienciaNome) {
    return jsonResponse({ ok: false, error: "experience_name_required" }, 400);
  }

  const num = (v: unknown): number | null => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const result = await sendAdminSaleNotification({
    experienciaNome,
    eventoLabel: eventoLabel(payload),
    clienteNome: (payload.customer_name as string | null) || null,
    clienteEmail: (payload.customer_email as string | null) || null,
    data: (payload.slot_date as string | null) || null,
    horario: (payload.slot_time as string | null) || null,
    quantidade: num(payload.quantity),
    amountTotalCentavos: num(payload.total_amount_centavos),
    paymentMethod: paymentLabel(
      payload.payment_method as string | null,
      payload.payment_status as string | null,
    ),
    couponCode: (payload.coupon_code as string | null) || null,
    couponDiscountCentavos: num(payload.discount_centavos),
    fornecedorNome: (payload.supplier_name as string | null) || null,
  });

  if (!result.ok) {
    // Aviso é best-effort — devolve 200 com skipped/erro pra não
    // fazer o cliente tratar como falha crítica do salvamento.
    return jsonResponse({
      ok: false,
      skipped: result.skipped ?? false,
      error: result.error ?? "send_failed",
    });
  }

  return jsonResponse({ ok: true });
});
