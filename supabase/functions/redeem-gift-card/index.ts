// =============================================================
// ELARAH — redeem-gift-card Edge Function
// -------------------------------------------------------------
// POST /functions/v1/redeem-gift-card
//
// Body JSON:
//   { "code": "ELRH-XXXX-XXXX-XXXX", "amount_centavos": 18000 }
//
// Apenas VALIDA (preview) o gift card. NÃO consome saldo.
// O consumo real acontece em create-checkout-session via
// hold_gift_card() quando o usuário confirma a reserva.
//
// Resposta:
//   {
//     ok: true,
//     valid: true,
//     status: "active",
//     saldo_centavos: 18000,
//     used_centavos: 18000,        // quanto vai abater nessa reserva
//     remaining_centavos: 0,
//     covers_full: true            // se o gift card paga 100%
//   }
//
// Se inválido:
//   { ok: true, valid: false, message: "..." }
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

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
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return jsonResponse({ ok: false, error: "server_misconfigured" }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const code = String(payload.code ?? "").trim();
  const amountCentavos = Number(payload.amount_centavos ?? 0);
  const quantidade = Math.max(1, Math.floor(Number(payload.quantidade ?? 1)) || 1);
  const experienceId = payload.experiencia_id
    ? String(payload.experiencia_id).trim()
    : (payload.experience_id ? String(payload.experience_id).trim() : null);

  if (!code) {
    return jsonResponse({ ok: false, error: "code_required" }, 400);
  }
  if (!Number.isFinite(amountCentavos) || amountCentavos <= 0) {
    return jsonResponse({ ok: false, error: "invalid_amount" }, 400);
  }

  // ===== Tenta cupom promocional primeiro =====
  // Se a tabela `coupons` ainda não existe (migration sql/elarah_coupons.sql
  // não rodou) o RPC falha — caímos no preview_gift_card legado.
  try {
    const { data: cpData, error: cpErr } = await supabase.rpc(
      "preview_coupon",
      {
        p_code: code,
        p_experience_id: experienceId,
        p_amount_centavos: amountCentavos,
        p_quantidade: quantidade,
      },
    );
    if (!cpErr) {
      const cpRow = Array.isArray(cpData) ? cpData[0] : cpData;
      if (cpRow && cpRow.found) {
        if (cpRow.valid) {
          const used = Number(cpRow.discount_centavos || 0);
          return jsonResponse({
            ok: true,
            valid: true,
            kind: "coupon",
            discount_type: cpRow.discount_type,
            discount_value: cpRow.discount_value,
            used_centavos: used,
            remaining_centavos: 0,
            covers_full: used >= amountCentavos,
            message: cpRow.message || "OK",
          });
        }
        // Existe na tabela coupons mas inválido (expirado/restrito/esgotado).
        // Não cai pro gift_card — devolve mensagem do cupom direto.
        return jsonResponse({
          ok: true,
          valid: false,
          kind: "coupon",
          message: cpRow.message || "Cupom inválido.",
        });
      }
      // cpRow.found === false → não está na tabela coupons → tenta gift_card
    } else {
      console.warn("[redeem-gift-card] preview_coupon falhou, fallback gift_card", cpErr.message);
    }
  } catch (e) {
    console.warn("[redeem-gift-card] preview_coupon exceção, fallback gift_card", e);
  }

  // ===== Fallback: gift card legado =====
  const { data, error } = await supabase
    .rpc("preview_gift_card", { p_code: code });

  if (error) {
    console.error("[redeem-gift-card] preview gift_card error", error);
    return jsonResponse({ ok: false, error: "lookup_failed" }, 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.found) {
    return jsonResponse({
      ok: true,
      valid: false,
      message: "Código não encontrado.",
    });
  }

  if (!row.valid) {
    return jsonResponse({
      ok: true,
      valid: false,
      kind: "gift_card",
      status: row.status,
      saldo_centavos: row.saldo_centavos ?? 0,
      message: row.message ?? "Gift card indisponível.",
    });
  }

  const saldo = Number(row.saldo_centavos ?? 0);
  const used = Math.min(saldo, amountCentavos);
  const remaining = saldo - used;
  const coversFull = used >= amountCentavos;

  return jsonResponse({
    ok: true,
    valid: true,
    kind: "gift_card",
    status: "active",
    saldo_centavos: saldo,
    used_centavos: used,
    remaining_centavos: remaining,
    covers_full: coversFull,
  });
});
