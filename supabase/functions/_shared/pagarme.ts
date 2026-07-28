// =============================================================
// ELARAH — Pagar.me (Stone) helper — API V5
// -------------------------------------------------------------
// Wrapper fino sobre a REST API V5 do Pagar.me, no mesmo estilo do
// _shared/mercadopago.ts (fetch nativo do Deno, sem SDK).
//
// Estratégia: CHECKOUT HOSPEDADO (Pagar.me Checkout via Orders).
//   - Criamos uma "order" com payment_method="checkout" e o Pagar.me
//     devolve uma URL hospedada (payment_url) pra onde redirecionamos
//     o cliente — igual ao Checkout Pro (MP) e ao Stripe Checkout que
//     já existem no projeto.
//   - A página hospedada cuida de: tokenização do cartão (PCI),
//     seleção de PARCELAS, PIX, e antifraude do Pagar.me.
//   - Nenhum dado de cartão passa pelo nosso servidor.
//
// Cobertura:
//   - createCheckoutOrder → POST /orders (cartão à vista + parcelado + Pix)
//   - getOrder            → GET  /orders/:id (reconciliação/webhook)
//   - verifyWebhookBasicAuth → valida o Basic Auth do webhook
//
// Autenticação: Basic com a Secret Key como usuário e senha vazia:
//   Authorization: Basic base64("sk_xxx:")
//
// Docs: https://docs.pagar.me/reference (API Core V5 — Pedidos/Orders)
// =============================================================

const PAGARME_BASE_URL = "https://api.pagar.me/core/v5";

// ===== Tipos (só o essencial que a gente usa) =====

export interface PagarmeCustomerInput {
  name: string;
  email: string;
  cpf: string; // só dígitos
  phone?: { areaCode?: string; number?: string };
}

export interface PagarmeItemInput {
  description: string;
  amountCents: number; // preço unitário em centavos
  quantity: number;
  code?: string;
}

export interface PagarmeCheckoutInput {
  amountCents: number; // total da cobrança em centavos
  description: string;
  externalReference: string; // booking.id — pra reconciliar no webhook
  customer: PagarmeCustomerInput;
  items?: PagarmeItemInput[];
  successUrl: string; // pra onde o cliente volta após pagar
  statementDescriptor?: string; // texto na fatura
  // Parcelamento:
  maxInstallments?: number; // default 12
  freeInstallments?: number; // parcelas SEM juros (default 1)
  monthlyInterestPct?: number; // juros a.m. repassado ao cliente (default 0)
  pixExpiresInSeconds?: number; // default 3600
}

export interface PagarmeOrderResponse {
  id: string; // or_xxxxx
  code?: string;
  status: string; // pending | paid | canceled | failed ...
  amount?: number;
  // Charges = tentativas de cobrança da order (cartão/pix)
  charges?: Array<{
    id: string;
    status: string; // pending | paid | ... | failed
    payment_method?: string; // credit_card | pix
    last_transaction?: {
      status?: string;
      acquirer_message?: string; // motivo da recusa (ex.: "high risk")
      installments?: number;
      // PIX:
      qr_code?: string;
      qr_code_url?: string;
    };
  }>;
  // Checkout hospedado: a URL pra redirecionar o cliente
  checkouts?: Array<{
    id: string;
    status?: string;
    payment_url?: string;
    success_url?: string;
  }>;
}

export interface PagarmeCreateResult {
  ok: boolean;
  order?: PagarmeOrderResponse;
  checkoutUrl?: string;
  errorStatus?: number;
  errorBody?: unknown;
}

// ===== Helpers internos =====

// Basic auth com a secret key como "usuário" e senha vazia.
function buildAuthHeader(secretKey: string): string {
  return "Basic " + btoa(secretKey + ":");
}

function digits(raw: unknown): string {
  return String(raw ?? "").replace(/\D+/g, "");
}

// Monta a lista de parcelas com o TOTAL de cada opção (em centavos).
// É aqui que o repasse de juros ao cliente acontece: até
// `freeInstallments` o total é o valor base (sem juros); a partir daí
// aplicamos juros compostos mensais (`monthlyInterestPct`).
// O Pagar.me Checkout mostra cada opção com o total calculado.
function buildInstallmentOptions(
  baseCents: number,
  maxInstallments: number,
  freeInstallments: number,
  monthlyInterestPct: number,
): Array<{ number: number; total: number }> {
  const max = Math.max(1, Math.min(12, Math.floor(maxInstallments || 12)));
  const free = Math.max(1, Math.floor(freeInstallments || 1));
  const rate = Math.max(0, Number(monthlyInterestPct || 0)) / 100;
  const out: Array<{ number: number; total: number }> = [];
  for (let n = 1; n <= max; n++) {
    let total = baseCents;
    if (n > free && rate > 0) {
      // Juros compostos: total = base * (1 + i)^n. Arredonda pra centavo.
      total = Math.round(baseCents * Math.pow(1 + rate, n));
    }
    out.push({ number: n, total });
  }
  return out;
}

// ===== API: criar order com Checkout hospedado =====
export async function createCheckoutOrder(
  secretKey: string,
  input: PagarmeCheckoutInput,
): Promise<PagarmeCreateResult> {
  if (!secretKey) {
    console.error("[Elarah Payment/Pagarme] secret key ausente");
    return { ok: false, errorStatus: 0, errorBody: "no_secret_key" };
  }

  const cpf = digits(input.customer.cpf);
  const items = (input.items && input.items.length)
    ? input.items
    : [{
      description: input.description.slice(0, 256),
      amountCents: input.amountCents,
      quantity: 1,
    }];

  const installments = buildInstallmentOptions(
    input.amountCents,
    input.maxInstallments ?? 12,
    input.freeInstallments ?? 1,
    input.monthlyInterestPct ?? 0,
  );

  const body: Record<string, unknown> = {
    // code = referência externa pra achar a order depois (booking.id)
    code: input.externalReference,
    items: items.map((it) => ({
      amount: it.amountCents,
      description: String(it.description).slice(0, 256),
      quantity: Math.max(1, Math.floor(it.quantity || 1)),
      code: it.code,
    })),
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      type: "individual",
      document: cpf,
      document_type: "CPF",
      ...(input.customer.phone &&
          (input.customer.phone.areaCode || input.customer.phone.number)
        ? {
          phones: {
            mobile_phone: {
              country_code: "55",
              area_code: input.customer.phone.areaCode || "",
              number: input.customer.phone.number || "",
            },
          },
        }
        : {}),
    },
    payments: [
      {
        payment_method: "checkout",
        checkout: {
          expires_in: 3600,
          default_payment_method: "credit_card",
          accepted_payment_methods: ["credit_card", "pix"],
          success_url: input.successUrl,
          customer_editable: true,
          skip_checkout_success_page: true,
          credit_card: {
            statement_descriptor: (input.statementDescriptor || "ELARAH")
              .slice(0, 13),
            installments,
          },
          pix: {
            expires_in: input.pixExpiresInSeconds ?? 3600,
          },
        },
      },
    ],
  };

  console.info(
    "[Elarah Payment/Pagarme] POST /orders (checkout)",
    "amount=" + input.amountCents,
    "external_ref=" + input.externalReference,
    "max_installments=" + (input.maxInstallments ?? 12),
  );

  let res: Response;
  try {
    res = await fetch(PAGARME_BASE_URL + "/orders", {
      method: "POST",
      headers: {
        "Authorization": buildAuthHeader(secretKey),
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] network error (order)", e);
    return { ok: false, errorStatus: 0, errorBody: String(e) };
  }

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    console.error(
      "[Elarah Payment/Pagarme] create order failed",
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
    );
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  const order = parsed as PagarmeOrderResponse;
  const checkoutUrl = order.checkouts?.[0]?.payment_url;

  console.info(
    "[Elarah Payment/Pagarme] order criada",
    "id=" + order.id,
    "status=" + order.status,
    "checkout_url=" + (checkoutUrl ? "yes" : "no"),
  );

  if (!checkoutUrl) {
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  return { ok: true, order, checkoutUrl };
}

// ===== API: consultar order (webhook / reconciliação) =====
export async function getOrder(
  secretKey: string,
  orderId: string,
): Promise<PagarmeOrderResponse | null> {
  if (!secretKey || !orderId) return null;
  try {
    const res = await fetch(PAGARME_BASE_URL + "/orders/" + orderId, {
      method: "GET",
      headers: {
        "Authorization": buildAuthHeader(secretKey),
        "Accept": "application/json",
      },
    });
    if (!res.ok) {
      console.error(
        "[Elarah Payment/Pagarme] getOrder failed",
        "status=" + res.status,
      );
      return null;
    }
    return (await res.json()) as PagarmeOrderResponse;
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] getOrder error", e);
    return null;
  }
}

// ===== Webhook: validação por Basic Auth =====
// O Pagar.me V5 protege o webhook com HTTP Basic Auth: no painel você
// cadastra a URL com usuário/senha, e o Pagar.me envia esse Basic Auth
// em cada POST. A gente compara (timing-safe) com o que está no env.
export function verifyWebhookBasicAuth(
  authHeader: string | null,
  expectedUser: string,
  expectedPass: string,
): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  if (!expectedUser && !expectedPass) return false;
  let decoded = "";
  try {
    decoded = atob(authHeader.slice(6).trim());
  } catch {
    return false;
  }
  const expected = expectedUser + ":" + expectedPass;
  // Comparação timing-safe (mesmo comprimento) pra não vazar por timing.
  if (decoded.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < decoded.length; i++) {
    diff |= decoded.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
