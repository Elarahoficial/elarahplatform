// =============================================================
// ELARAH — Mercado Pago helper
// -------------------------------------------------------------
// Wrapper fino em volta da REST API do Mercado Pago.
//
// Por que não usar o SDK oficial da MP?
// O SDK @mercadopago/sdk-js é feito pra Node + ambientes com
// Promise-based HTTP clients antigos. Em Deno Edge Runtime o fetch
// nativo é tudo que a gente precisa — uma camada fina aqui é mais
// enxuta, mais auditável e evita dependências instáveis em
// esm.sh/jsr.
//
// Docs de referência:
//   - Criar pagamento PIX: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
//   - Consultar pagamento: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments_id/get
//   - Assinatura do webhook: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#secret-key
// =============================================================

const MP_BASE_URL = "https://api.mercadopago.com";

// ===== Tipos =====
// Só os campos que a gente de fato usa. Os objetos reais do MP são
// enormes — preservamos só o essencial e ignoramos o resto.

export interface MPPaymentCreateInput {
  transactionAmountCents: number; // centavos; convertemos pra reais dentro
  description: string;
  externalReference: string;      // ID interno pra reconciliar depois
  payerEmail: string;
  payerFirstName: string;
  payerLastName: string;
  payerCpf: string;               // só dígitos, 11 chars
  expiresInMinutes?: number;      // default 30
  notificationUrl?: string;
  idempotencyKey?: string;        // evita duplicatas se o front retry
}

export interface MPPaymentResponse {
  id: number;
  status: string; // pending | approved | authorized | in_process | rejected | cancelled | refunded | charged_back
  status_detail: string;
  date_of_expiration: string | null;
  transaction_amount: number;
  external_reference: string | null;
  // Tipo/método do pagamento — usado só pra rotular a notificação de
  // venda pro admin (ex.: "credit_card" → "Cartão"; pix → "Pix").
  payment_type_id?: string;   // credit_card | debit_card | account_money | bank_transfer | ticket ...
  payment_method_id?: string; // pix | visa | master | ...
  installments?: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;            // código copia-e-cola (EMV)
      qr_code_base64?: string;     // PNG em base64
      ticket_url?: string;         // URL de fallback
    };
  };
}

export interface MPCreateResult {
  ok: boolean;
  payment?: MPPaymentResponse;
  errorStatus?: number;
  errorBody?: unknown;
}

// ===== Helpers internos =====

function centsToReais(cents: number): number {
  // MP espera valor em reais com 2 casas (ex: 100.00). Cuidado com
  // floats: 100 centavos → 1, mas 1999 centavos → 19.99 pode ter
  // ruído. Usa toFixed(2) pra normalizar.
  return Number((cents / 100).toFixed(2));
}

function buildIdempotencyKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "idem-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }
}

// ===== API: criar pagamento PIX =====
export async function createPixPayment(
  accessToken: string,
  input: MPPaymentCreateInput,
): Promise<MPCreateResult> {
  if (!accessToken) {
    console.error("[Elarah Payment/MP] access token ausente");
    return { ok: false, errorStatus: 0, errorBody: "no_access_token" };
  }

  const expiresMinutes = input.expiresInMinutes ?? 30;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000)
    .toISOString();

  // MP quer CPF como string de dígitos (sem formatação).
  const cpfDigits = String(input.payerCpf || "").replace(/\D+/g, "");

  const body = {
    transaction_amount: centsToReais(input.transactionAmountCents),
    description: input.description.slice(0, 600),
    external_reference: input.externalReference,
    payment_method_id: "pix",
    date_of_expiration: expiresAt,
    notification_url: input.notificationUrl || undefined,
    payer: {
      email: input.payerEmail,
      first_name: input.payerFirstName,
      last_name: input.payerLastName,
      identification: {
        type: "CPF",
        number: cpfDigits,
      },
    },
  };

  const idemKey = input.idempotencyKey || buildIdempotencyKey();

  console.info(
    "[Elarah Payment/MP] POST /v1/payments",
    "amount=" + body.transaction_amount,
    "external_ref=" + input.externalReference,
    "idem=" + idemKey,
  );

  let res: Response;
  try {
    res = await fetch(MP_BASE_URL + "/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[Elarah Payment/MP] network error", e);
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
      "[Elarah Payment/MP] create payment failed",
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
    );
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  const payment = parsed as MPPaymentResponse;
  console.info(
    "[Elarah Payment/MP] payment created",
    "id=" + payment.id,
    "status=" + payment.status,
    "status_detail=" + payment.status_detail,
  );

  return { ok: true, payment };
}

// =============================================================
// API: criar preferência de Checkout Pro (cartão)
// -------------------------------------------------------------
// Diferente do PIX (que cria um /v1/payments direto), o cartão usa
// o Checkout Pro: a gente cria uma "preference" e redireciona o
// cliente pro `init_point` hospedado pela MP. Lá ele digita o cartão,
// escolhe o parcelamento e paga. A MP então notifica o mp-webhook.
//
// Por que Checkout Pro e não Bricks/Transparente?
//   - Não passa dados de cartão pelo nosso servidor (PCI: MP cuida).
//   - Parcelamento nativo (até 12x) com os juros repassados ao
//     cliente por padrão — exatamente a regra da Elarah.
//   - Suporta carteiras (Mercado Pago, e conforme a conta, outras).
//
// O `external_reference` que passamos aqui é propagado pela MP pro
// objeto de pagamento — é assim que o mp-webhook reconcilia a booking
// (busca bookings.id == payment.external_reference). NÃO precisamos
// mexer no webhook: o fluxo de confirmação é o mesmo do PIX.
//
// Docs:
//   https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
// =============================================================

export interface MPPreferenceItem {
  title: string;
  quantity: number;
  unitPriceCents: number; // centavos; convertidos pra reais aqui dentro
}

export interface MPPreferenceInput {
  items: MPPreferenceItem[];
  externalReference: string;       // = booking.id, pro webhook reconciliar
  payerEmail: string;
  payerFirstName?: string;
  payerLastName?: string;
  payerCpf?: string;               // opcional no cartão (MP coleta na página)
  notificationUrl?: string;
  backUrls: { success: string; failure: string; pending: string };
  maxInstallments?: number;        // default 12
  statementDescriptor?: string;    // texto na fatura do cliente
  metadata?: Record<string, unknown>;
  expiresInMinutes?: number;       // default 30
  idempotencyKey?: string;
}

export interface MPPreferenceResponse {
  id: string;
  init_point: string;              // URL de produção
  sandbox_init_point: string;      // URL de teste (credenciais TEST-)
  external_reference: string | null;
}

export interface MPPreferenceResult {
  ok: boolean;
  preference?: MPPreferenceResponse;
  errorStatus?: number;
  errorBody?: unknown;
}

export async function createCheckoutPreference(
  accessToken: string,
  input: MPPreferenceInput,
): Promise<MPPreferenceResult> {
  if (!accessToken) {
    console.error("[Elarah Payment/MP] access token ausente (preference)");
    return { ok: false, errorStatus: 0, errorBody: "no_access_token" };
  }

  const maxInstallments = input.maxInstallments ?? 12;
  const cpfDigits = input.payerCpf
    ? String(input.payerCpf).replace(/\D+/g, "")
    : "";

  const expiresMinutes = input.expiresInMinutes ?? 30;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000)
    .toISOString();

  const body: Record<string, unknown> = {
    items: input.items.map((it, idx) => ({
      id: input.externalReference + "-" + idx,
      title: String(it.title).slice(0, 250),
      quantity: Math.max(1, Math.floor(it.quantity)),
      unit_price: centsToReais(it.unitPriceCents),
      currency_id: "BRL",
    })),
    external_reference: input.externalReference,
    payer: {
      email: input.payerEmail,
      ...(input.payerFirstName ? { name: input.payerFirstName } : {}),
      ...(input.payerLastName ? { surname: input.payerLastName } : {}),
      ...(cpfDigits
        ? { identification: { type: "CPF", number: cpfDigits } }
        : {}),
    },
    back_urls: input.backUrls,
    auto_return: "approved",
    // Parcelamento: até `maxInstallments`x. NÃO habilitamos
    // "parcelamento sem juros" — logo os juros do financiamento são
    // pagos pelo cliente (regra da Elarah: taxa repassada, até 12x).
    payment_methods: {
      installments: maxInstallments,
      // Não excluímos nenhum tipo — cartão de crédito/débito + carteira
      // conforme a conta. (Boleto/PIX ficam no fluxo próprio da Elarah,
      // mas manter aqui não atrapalha; o cliente escolheu "cartão".)
      excluded_payment_types: [
        { id: "ticket" }, // boleto — Elarah não usa via Checkout Pro
      ],
    },
    notification_url: input.notificationUrl || undefined,
    statement_descriptor: (input.statementDescriptor || "ELARAH").slice(0, 22),
    expires: true,
    expiration_date_to: expiresAt,
    metadata: input.metadata || undefined,
    binary_mode: false,
  };

  const idemKey = input.idempotencyKey || buildIdempotencyKey();

  console.info(
    "[Elarah Payment/MP] POST /checkout/preferences",
    "external_ref=" + input.externalReference,
    "installments=" + maxInstallments,
    "idem=" + idemKey,
  );

  let res: Response;
  try {
    res = await fetch(MP_BASE_URL + "/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[Elarah Payment/MP] network error (preference)", e);
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
      "[Elarah Payment/MP] create preference failed",
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
    );
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  const preference = parsed as MPPreferenceResponse;
  console.info(
    "[Elarah Payment/MP] preference criada",
    "id=" + preference.id,
    "external_ref=" + (preference.external_reference ?? "?"),
  );

  return { ok: true, preference };
}

// ===== API: consultar pagamento =====
// Usado pelo webhook (que recebe só o ID) e pelo endpoint de
// reconciliação on-demand.
export async function getPayment(
  accessToken: string,
  paymentId: string | number,
): Promise<MPCreateResult> {
  if (!accessToken) {
    return { ok: false, errorStatus: 0, errorBody: "no_access_token" };
  }
  if (!paymentId) {
    return { ok: false, errorStatus: 400, errorBody: "no_payment_id" };
  }

  let res: Response;
  try {
    res = await fetch(MP_BASE_URL + "/v1/payments/" + paymentId, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + accessToken,
      },
    });
  } catch (e) {
    console.error("[Elarah Payment/MP] network error on GET", e);
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
      "[Elarah Payment/MP] get payment failed",
      "id=" + paymentId,
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
    );
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  return { ok: true, payment: parsed as MPPaymentResponse };
}

// ===== Validação de assinatura do webhook =====
// Formato do header `x-signature` do Mercado Pago:
//   ts=<unix_ts>,v1=<hex_hmac>
//
// HMAC é calculado sobre a string:
//   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// usando SHA-256 + o secret cadastrado no dashboard.
//
// Se o secret não tiver sido configurado, retornamos `true` com um
// warning — permite desenvolvimento local sem quebrar o fluxo.
// Em produção SEMPRE configure `MP_WEBHOOK_SECRET`.
export async function verifyWebhookSignature(
  secret: string,
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
): Promise<boolean> {
  if (!secret) {
    console.warn(
      "[Elarah Payment/MP] MP_WEBHOOK_SECRET ausente — " +
        "aceitando webhook sem verificar assinatura. NÃO use assim em produção.",
    );
    return true;
  }
  if (!signatureHeader || !requestId || !dataId) {
    console.error(
      "[Elarah Payment/MP] headers/ids insuficientes pra verificar assinatura",
      "signature=" + (signatureHeader ? "yes" : "no"),
      "request_id=" + (requestId ? "yes" : "no"),
      "data_id=" + (dataId ? "yes" : "no"),
    );
    return false;
  }

  // Parsing: "ts=NNN,v1=HEX"
  const parts = signatureHeader.split(",").map((p) => p.trim());
  let ts: string | null = null;
  let v1: string | null = null;
  for (const p of parts) {
    const [k, v] = p.split("=", 2);
    if (k === "ts") ts = v;
    else if (k === "v1") v1 = v;
  }
  if (!ts || !v1) {
    console.error("[Elarah Payment/MP] x-signature malformado:", signatureHeader);
    return false;
  }

  const payload = `id:${dataId};request-id:${requestId};ts:${ts};`;

  // HMAC-SHA256 via Web Crypto API (Deno).
  const enc = new TextEncoder();
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch (e) {
    console.error("[Elarah Payment/MP] importKey falhou", e);
    return false;
  }

  let sigBuf: ArrayBuffer;
  try {
    sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  } catch (e) {
    console.error("[Elarah Payment/MP] sign falhou", e);
    return false;
  }

  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparação timing-safe: mesmo tamanho + XOR de todos os bytes.
  if (computed.length !== v1.length) {
    console.error(
      "[Elarah Payment/MP] assinatura length mismatch",
      "computed_len=" + computed.length,
      "received_len=" + v1.length,
    );
    return false;
  }
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  const ok = diff === 0;
  if (!ok) {
    console.error("[Elarah Payment/MP] assinatura INVÁLIDA");
  }
  return ok;
}

// ===== Helper: valida CPF por dígito verificador =====
// MP aceita CPF inválido e só erra no fluxo de pagamento (resposta
// ruim), então validamos aqui antes de chamar a API.
export function isValidCpf(raw: string): boolean {
  const digits = String(raw || "").replace(/\D+/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // 111.111.111-11, etc
  const arr = digits.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += arr[i] * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== arr[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += arr[i] * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === arr[10];
}
