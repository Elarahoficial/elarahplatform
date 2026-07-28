// =============================================================
// ELARAH — Pagar.me (Stone) helper — API V5 (Payment Links)
// -------------------------------------------------------------
// Wrapper fino sobre a API V5 do Pagar.me, no mesmo estilo do
// _shared/mercadopago.ts (fetch nativo do Deno, sem SDK).
//
// Estratégia: CHECKOUT HOSPEDADO via PAYMENT LINKS.
//   - POST /paymentlinks com type="order" → o Pagar.me devolve
//     { id: "pl_...", url, status }. Redirecionamos o cliente pra `url`.
//   - A página hospedada cuida de tokenização do cartão (PCI), seleção
//     de PARCELAS, PIX e antifraude do Pagar.me. Nenhum dado de cartão
//     passa pelo nosso servidor.
//
// Base URL:
//   - TESTE  (sk_test_...): https://sdx-api.pagar.me/core/v5
//   - PRODUÇÃO (sk_...):     https://api.pagar.me/core/v5
//
// Autenticação: Basic com a Secret Key como usuário e senha vazia:
//   Authorization: Basic base64("sk_xxx:")
//
// Webhooks (eventos oficiais que tratamos):
//   order.paid, order.payment_failed, charge.paid, charge.refunded
// =============================================================

const PAGARME_PROD_BASE = "https://api.pagar.me/core/v5";
const PAGARME_TEST_BASE = "https://sdx-api.pagar.me/core/v5";

function baseUrl(secretKey: string): string {
  return secretKey.startsWith("sk_test_") ? PAGARME_TEST_BASE : PAGARME_PROD_BASE;
}

// ===== Tipos =====

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
  externalReference: string; // booking.id — reconciliação no webhook
  customer: PagarmeCustomerInput;
  items?: PagarmeItemInput[];
  statementDescriptor?: string; // texto na fatura
  // Parcelamento:
  maxInstallments?: number; // default 12
  freeInstallments?: number; // parcelas SEM juros (default 1)
  monthlyInterestPct?: number; // juros a.m. repassado ao cliente (default 0)
  pixExpiresInSeconds?: number; // default 3600
}

export interface PagarmePaymentLinkResponse {
  id: string; // pl_xxxxx
  url?: string;
  status?: string;
  // A order paga é criada a partir do link — carrega o metadata que
  // enviamos (booking_id) pra reconciliação no webhook.
}

// Order retornada pela consulta / recebida no webhook.
export interface PagarmeOrderResponse {
  id: string; // or_xxxxx
  code?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  charges?: Array<{
    id: string;
    status?: string;
    payment_method?: string;
    last_transaction?: {
      status?: string;
      acquirer_message?: string;
      installments?: number;
      qr_code?: string;
      qr_code_url?: string;
    };
  }>;
}

export interface PagarmeCreateResult {
  ok: boolean;
  paymentLink?: PagarmePaymentLinkResponse;
  checkoutUrl?: string;
  errorStatus?: number;
  errorBody?: unknown;
}

// ===== Helpers internos =====

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
export function buildInstallmentOptions(
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
      total = Math.round(baseCents * Math.pow(1 + rate, n));
    }
    out.push({ number: n, total });
  }
  return out;
}

// ===== API: criar Payment Link (checkout hospedado) =====
export async function createPaymentLink(
  secretKey: string,
  input: PagarmeCheckoutInput,
): Promise<PagarmeCreateResult> {
  if (!secretKey) {
    console.error("[Elarah Payment/Pagarme] secret key ausente");
    return { ok: false, errorStatus: 0, errorBody: "no_secret_key" };
  }

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
    name: (input.description || "Reserva Elarah").slice(0, 64),
    type: "order",
    // order_code = identificador do lojista pra correlação (doc oficial).
    // A order paga carrega esse mesmo code, então o webhook reconcilia a
    // reserva por order.code == booking.id — sem depender de metadata.
    order_code: input.externalReference,
    // Cada link corresponde a UMA reserva específica da Elarah: no máximo
    // 1 sessão paga por link — impede o mesmo link gerar 2 pagamentos.
    max_paid_sessions: 1,
    payment_settings: {
      accepted_payment_methods: ["credit_card", "pix"],
      statement_descriptor: (input.statementDescriptor || "ELARAH").slice(0, 13),
      credit_card_settings: {
        operation_type: "auth_and_capture",
        installments,
      },
      // pix_settings.expires_in é OBRIGATÓRIO e vem em SEGUNDOS (doc V5:
      // "Data de expiração do Pix em segundos"). Default 3600 (1h),
      // configurável por env (PAGARME_PIX_EXPIRES_IN).
      pix_settings: {
        expires_in: input.pixExpiresInSeconds ?? 3600,
      },
    },
    cart_settings: {
      items: items.map((it) => ({
        name: String(it.description).slice(0, 64),
        description: String(it.description).slice(0, 256),
        amount: it.amountCents,
        default_quantity: Math.max(1, Math.floor(it.quantity || 1)),
      })),
    },
  };

  const url = baseUrl(secretKey) + "/paymentlinks";
  console.info(
    "[Elarah Payment/Pagarme] POST /paymentlinks",
    "base=" + (secretKey.startsWith("sk_test_") ? "sandbox" : "prod"),
    "amount=" + input.amountCents,
    "booking=" + input.externalReference,
    "installments=" + installments.length,
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": buildAuthHeader(secretKey),
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] network error (paymentlink)", e);
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
      "[Elarah Payment/Pagarme] create paymentlink failed",
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
    );
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  const link = parsed as PagarmePaymentLinkResponse;
  console.info(
    "[Elarah Payment/Pagarme] paymentlink criado",
    "id=" + link.id,
    "status=" + link.status,
    "url=" + (link.url ? "yes" : "no"),
  );

  if (!link.url) {
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  return { ok: true, paymentLink: link, checkoutUrl: link.url };
}

// ===== API: consultar order (webhook / reconciliação) =====
export async function getOrder(
  secretKey: string,
  orderId: string,
): Promise<PagarmeOrderResponse | null> {
  if (!secretKey || !orderId) return null;
  try {
    const res = await fetch(baseUrl(secretKey) + "/orders/" + orderId, {
      method: "GET",
      headers: {
        "Authorization": buildAuthHeader(secretKey),
        "Accept": "application/json",
      },
    });
    if (!res.ok) {
      console.error("[Elarah Payment/Pagarme] getOrder failed", "status=" + res.status);
      return null;
    }
    return (await res.json()) as PagarmeOrderResponse;
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] getOrder error", e);
    return null;
  }
}

// ===== Webhook: validação por Basic Auth =====
// O Pagar.me protege o webhook com HTTP Basic Auth: no painel você
// cadastra a URL com usuário/senha, e o Pagar.me envia esse Basic Auth
// em cada POST. Comparação timing-safe com o que está no env.
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
  if (decoded.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < decoded.length; i++) {
    diff |= decoded.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
