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
  // MP exige date_of_expiration em ISO 8601 COM offset de timezone
  // (ex: "2024-04-15T20:00:00.000-03:00"). O formato UTC com "Z"
  // (que JavaScript produz por default com toISOString()) é rejeitado
  // com 400 em muitas contas MP. Forçamos offset -03:00 (BRT).
  const expiresDate = new Date(Date.now() + expiresMinutes * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const expiresAt =
    expiresDate.getFullYear() + "-" +
    pad(expiresDate.getMonth() + 1) + "-" +
    pad(expiresDate.getDate()) + "T" +
    pad(expiresDate.getHours()) + ":" +
    pad(expiresDate.getMinutes()) + ":" +
    pad(expiresDate.getSeconds()) + ".000-03:00";

  // MP quer CPF como string de dígitos (sem formatação).
  const cpfDigits = String(input.payerCpf || "").replace(/\D+/g, "");

  // Sanitiza email: remove "+" (MP pode rejeitar sub-addressing).
  const sanitizedEmail = String(input.payerEmail || "")
    .replace(/\+/g, ".")
    .trim();

  const body = {
    transaction_amount: centsToReais(input.transactionAmountCents),
    description: input.description.slice(0, 600) || "Pagamento Elarah",
    external_reference: input.externalReference,
    payment_method_id: "pix",
    date_of_expiration: expiresAt,
    payer: {
      email: sanitizedEmail,
      first_name: input.payerFirstName || "Cliente",
      last_name: input.payerLastName || "Elarah",
      identification: {
        type: "CPF",
        number: cpfDigits,
      },
    },
  };

  const idemKey = input.idempotencyKey || buildIdempotencyKey();

  // Log estruturado do payload enviado pra MP — redacted do CPF.
  // Crítico pra debug: quando a MP devolve 400, o body aqui mostra
  // exatamente quais campos foram aceitos/rejeitados.
  const bodyForLog = {
    transaction_amount: body.transaction_amount,
    description: body.description.slice(0, 80) + (body.description.length > 80 ? "..." : ""),
    external_reference: body.external_reference,
    payment_method_id: body.payment_method_id,
    date_of_expiration: body.date_of_expiration,
    notification_url: body.notification_url ?? "(none)",
    payer: {
      email: body.payer.email,
      first_name: body.payer.first_name,
      last_name: body.payer.last_name,
      identification: {
        type: body.payer.identification.type,
        number: cpfDigits.slice(0, 3) + "********" + cpfDigits.slice(-2),
      },
    },
  };
  console.info(
    "[Elarah Payment/MP] POST /v1/payments",
    "amount=" + body.transaction_amount,
    "external_ref=" + input.externalReference,
    "idem=" + idemKey,
    "body=" + JSON.stringify(bodyForLog),
    "token_prefix=" + accessToken.slice(0, 10) + "...",
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
      "[Elarah Payment/MP] create payment FAILED",
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
      "sent_payload=" + JSON.stringify(bodyForLog),
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
