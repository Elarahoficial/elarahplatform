// =============================================================
// ELARAH — calculate-shipping Edge Function
// -------------------------------------------------------------
// POST /functions/v1/calculate-shipping
//
// Body:
//   {
//     "cep": "01310-100",          // CEP de destino (obrigatório)
//     "weight_kg": 1,              // opcional (default 1)
//     "width_cm": 20, "height_cm": 15, "length_cm": 20  // opcionais
//   }
//
// Resposta:
//   {
//     "origin_cep": "01310100",
//     "options": [
//       { "service":"PAC","carrier":"Correios","cost_centavos":1900,"delivery_days":3,"source":"estimativa" },
//       ...
//     ]
//   }
//
// Modo estimativa (sem credenciais) por padrão. Com MELHOR_ENVIO_TOKEN
// setado, devolve preços reais dos Correios. Ver _shared/shipping.ts.
//
// Função ISOLADA: não cria booking, não cobra, não toca no checkout.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getShippingOptions, isValidCep } from "../_shared/shipping.ts";

const ORIGIN_CEP = (Deno.env.get("SHIPPING_ORIGIN_CEP") ?? "01310-100").replace(/\D+/g, "");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const cep = String(payload.cep ?? "").trim();
  if (!isValidCep(cep)) {
    return jsonResponse(
      { error: "cep_invalid", message: "CEP inválido. Use 8 dígitos." },
      422,
    );
  }

  const pkg = {
    weight_kg: payload.weight_kg != null ? Number(payload.weight_kg) : undefined,
    width_cm: payload.width_cm != null ? Number(payload.width_cm) : undefined,
    height_cm: payload.height_cm != null ? Number(payload.height_cm) : undefined,
    length_cm: payload.length_cm != null ? Number(payload.length_cm) : undefined,
  };

  try {
    const options = await getShippingOptions(cep, pkg);
    if (!options.length) {
      return jsonResponse(
        { error: "shipping_unavailable", message: "Não conseguimos calcular o frete pra esse CEP agora." },
        502,
      );
    }
    return jsonResponse({ origin_cep: ORIGIN_CEP, options });
  } catch (e) {
    console.error("[calculate-shipping] erro", e);
    return jsonResponse({ error: "shipping_failed" }, 500);
  }
});
