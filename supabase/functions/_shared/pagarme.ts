// =============================================================
// ELARAH — Pagar.me helper (implementa PaymentProvider)
// -------------------------------------------------------------
// Wrapper fino em volta da Core API v5 do Pagar.me (grupo Stone),
// o gateway DEFINITIVO do checkout da Elarah (PIX + cartão à vista +
// cartão parcelado + estorno + antifraude + webhooks).
//
// Por que uma camada fina e não o SDK?
//   Mesma razão do mercadopago.ts: em Deno Edge Runtime o `fetch`
//   nativo basta. Camada enxuta, auditável, sem dependências
//   instáveis de esm.sh/jsr. Aqui ela implementa a interface
//   `PaymentProvider` (_shared/payment_provider.ts) — então os
//   handlers de checkout e o webhook falam só com tipos normalizados.
//
// Cobertura (Core API v5):
//   - PIX / CARTÃO: createPixPayment / createCardPayment → POST /orders
//   - Consulta:     getPayment → GET /orders/:id  |  GET /charges/:id
//   - Estorno:      refund → DELETE /charges/:id
//   - Webhook:      verifyWebhook + parseWebhookEvent
//
// Sinais de aprovação/antifraude enviados em TODA transação (recomendação
// do Pagar.me pra maximizar aprovação e alimentar o antifraude):
//   - customer completo: nome, e-mail, CPF (document), telefone, endereço
//   - itens da compra com descrição
//   - device/fingerprint do cliente (em metadata.session_id) — ver §Antifraude
//   - statement_descriptor ("ELARAH") na fatura do cartão
//   - X-Idempotency-Key por booking (evita cobrança duplicada em retry)
//
// Valores: a v5 do Pagar.me trabalha com CENTAVOS inteiros em toda a
// API — igual à Elarah. Não há conversão pra reais (diferente da MP).
//
// Autenticação: Basic auth. A SECRET KEY (sk_...) vai como usuário e a
// senha fica vazia → Authorization: Basic base64("sk_xxx:"). A secret
// key NUNCA sai do servidor. O cliente usa só a PUBLIC KEY (pk_...) pra
// tokenizar o cartão (POST /tokens?appId=pk_...).
//
// Docs: https://docs.pagar.me/reference (Core API v5)
// =============================================================

import type {
  CardPaymentInput,
  CreatePaymentResult,
  NormalizedPayment,
  NormalizedStatus,
  PaymentProvider,
  PixPaymentInput,
  ProviderResult,
  WebhookVerification,
} from "./payment_provider.ts";

const PAGARME_BASE_URL = "https://api.pagar.me/core/v5";
const PAGARME_INTEGRATION_UA = "Elarah/1.0 (+https://elarah.com.br)";

// ===== Helpers internos =====

function digits(raw: unknown): string {
  return String(raw ?? "").replace(/\D+/g, "");
}

function buildIdempotencyKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "idem-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }
}

// Basic auth com a secret key como usuário e senha vazia.
function authHeader(secretKey: string): string {
  return "Basic " + btoa(secretKey + ":");
}

// Traduz o status cru do Pagar.me (order OU charge) pro vocabulário
// normalizado da Elarah. Fonte única — usada por toda normalização.
//
// Order status:  pending | paid | canceled | failed | processing
// Charge status: pending | paid | canceled | failed | processing |
//                overpaid | underpaid | refunded | chargedback |
//                authorized_pending_capture | waiting_capture |
//                partial_capture | not_authorized | waiting_payment
function mapPagarmeStatus(raw: string | null | undefined): NormalizedStatus {
  switch (String(raw || "").toLowerCase()) {
    case "paid":
    case "partial_capture": // capturado parcialmente — trata como pago
      return "approved";
    case "pending":
    case "waiting_payment":
    case "created":
      return "pending";
    case "processing":
    case "authorized_pending_capture":
    case "waiting_capture":
    case "analyzing": // em análise de antifraude
    case "overpaid":
    case "underpaid":
      return "in_process";
    case "failed":
    case "not_authorized":
      return "rejected";
    case "canceled":
    case "voided":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "chargedback":
    case "charged_back":
      return "charged_back";
    default:
      return "unknown";
  }
}

// deno-lint-ignore no-explicit-any
type Json = any;

// Normaliza uma ORDER do Pagar.me pro formato único da Elarah.
function normalizeOrder(order: Json): NormalizedPayment {
  const charge = Array.isArray(order?.charges) && order.charges.length
    ? order.charges[0]
    : null;
  return normalizeFrom(order, charge);
}

// Normaliza uma CHARGE do Pagar.me (evento charge.*). A charge carrega
// order.id/order.code pra reconciliar a booking.
function normalizeCharge(charge: Json): NormalizedPayment {
  const orderLike = charge?.order ?? {};
  // A order aninhada na charge é resumida; usamos o id/code dela mas o
  // status/valor vêm da própria charge (mais atual).
  return normalizeFrom(
    { id: orderLike.id, code: orderLike.code, status: charge?.status },
    charge,
  );
}

// Monta o NormalizedPayment a partir de (order, charge). Ambos opcionais;
// a charge (quando existe) manda no status/valor/QR.
function normalizeFrom(order: Json, charge: Json): NormalizedPayment {
  const tx = charge?.last_transaction ?? {};
  // Status: prioriza a charge (mais granular); cai pra order.
  const rawStatus = charge?.status ?? order?.status;
  const status = mapPagarmeStatus(rawStatus);

  // Valor: charge.amount (centavos) é o autoritativo; cai pra order.amount.
  const amountCents = Number(
    charge?.amount ?? charge?.paid_amount ?? order?.amount ?? 0,
  ) || 0;

  const paymentMethod = String(charge?.payment_method ?? tx?.transaction_type ?? "");

  const pmt: NormalizedPayment = {
    providerName: "pagarme",
    id: String(order?.id ?? charge?.order?.id ?? charge?.id ?? ""),
    chargeId: charge?.id ? String(charge.id) : null,
    status,
    statusDetail: String(
      tx?.acquirer_message ?? tx?.gateway_response?.errors?.[0]?.message ??
        rawStatus ?? "",
    ).slice(0, 300),
    amountCents,
    externalReference: (order?.code ?? charge?.order?.code ?? null) as
      | string
      | null,
    paymentMethod,
    installments: Number(tx?.installments ?? charge?.installments ?? 0) ||
      undefined,
    raw: undefined, // preenchido só quando pedido (evita log gigante)
  };

  // PIX: QR copia-e-cola + URL da imagem, quando presentes.
  if (paymentMethod === "pix" || tx?.qr_code) {
    pmt.pix = {
      qrCode: tx?.qr_code ?? null,
      qrCodeBase64: tx?.qr_code_base64 ?? null, // Pagar.me manda URL, não base64
      qrCodeUrl: tx?.qr_code_url ?? null,
      expiresAt: tx?.expires_at ?? tx?.expiration_date ?? null,
    };
  }

  // 3-D Secure: quando o emissor exige, a transação traz uma URL de
  // autenticação. (Depende de 3DS estar habilitado na conta.)
  const threeDsUrl = tx?.threed_authentication_url ?? tx?.three_d_secure?.url ??
    null;
  if (threeDsUrl) {
    pmt.threeDs = { url: threeDsUrl };
  }

  return pmt;
}

// =============================================================
// A implementação
// =============================================================
export class PagarmeProvider implements PaymentProvider {
  readonly name = "pagarme";
  private secretKey: string;
  private webhookUser: string;
  private webhookPassword: string;
  // Quando true, envia o device/fingerprint num campo que o antifraude
  // lê. Fica OFF por padrão porque o nome EXATO do campo depende da
  // configuração da conta/antifraude (ClearSale) — deve ser confirmado
  // no painel/contrato do Pagar.me antes de ligar. Enquanto OFF, o
  // fingerprint é preservado em metadata.session_id (não quebra nada).
  private sendSessionId: boolean;

  constructor(opts: {
    secretKey: string;
    webhookUser?: string;
    webhookPassword?: string;
    sendSessionId?: boolean;
  }) {
    this.secretKey = opts.secretKey;
    this.webhookUser = opts.webhookUser ?? "";
    this.webhookPassword = opts.webhookPassword ?? "";
    this.sendSessionId = opts.sendSessionId ?? false;
  }

  // ---- monta o objeto customer (todos os sinais de aprovação) ----
  private buildCustomer(input: PixPaymentInput | CardPaymentInput): Json {
    const c = input.customer;
    const customer: Json = {
      name: [c.firstName, c.lastName].filter(Boolean).join(" ").slice(0, 64) ||
        "Cliente Elarah",
      email: c.email,
      type: "individual",
      document: digits(c.cpf),
      document_type: "CPF",
    };
    if (c.phone && (c.phone.areaCode || c.phone.number)) {
      customer.phones = {
        mobile_phone: {
          country_code: "55",
          area_code: c.phone.areaCode || "",
          number: c.phone.number || "",
        },
      };
    }
    const addr = c.address;
    if (addr && addr.zipCode && addr.streetName) {
      customer.address = {
        line_1: [
          addr.streetNumber != null ? String(addr.streetNumber) : "",
          addr.streetName,
          addr.neighborhood ?? "",
        ].filter(Boolean).join(", ").slice(0, 256),
        ...(addr.complement ? { line_2: String(addr.complement).slice(0, 128) } : {}),
        zip_code: digits(addr.zipCode),
        city: addr.city ?? "",
        state: addr.federalUnit ?? "",
        country: "BR",
      };
    }
    return customer;
  }

  // ---- item único = valor total (garante order.amount == cobrança) ----
  // A v5 deriva o total da order da soma dos itens. Pra nunca haver
  // divergência entre o que exibimos e o que cobramos, mandamos UM item
  // com o valor total. O detalhe legível vai na descrição + metadata.
  private buildItems(
    input: PixPaymentInput | CardPaymentInput,
  ): Json[] {
    const first = input.items && input.items.length ? input.items[0] : null;
    return [{
      amount: Math.round(input.amountCents),
      description: String(first?.description ?? first?.title ?? input.description)
        .slice(0, 256),
      quantity: 1,
      code: String(first?.id ?? input.externalReference).slice(0, 52),
    }];
  }

  // ---- metadata comum (reconciliação + antifraude) ----
  private buildMetadata(
    input: PixPaymentInput | CardPaymentInput,
    extra: Json = {},
  ): Json {
    const meta: Json = {
      booking_id: input.externalReference,
      origin: "elarah-checkout",
      ...extra,
    };
    // Preserva o fingerprint SEMPRE (safe). Alimentar o antifraude com
    // ele depende de confirmar o campo correto no painel — ver §sendSessionId.
    if (input.deviceId) meta.session_id = String(input.deviceId).slice(0, 100);
    return meta;
  }

  private async postOrder(
    body: Json,
    idempotencyKey: string,
    logLabel: string,
  ): Promise<CreatePaymentResult> {
    if (!this.secretKey) {
      console.error("[Elarah Payment/Pagarme] secret key ausente");
      return { ok: false, errorStatus: 0, errorBody: "no_secret_key" };
    }

    let res: Response;
    try {
      res = await fetch(PAGARME_BASE_URL + "/orders", {
        method: "POST",
        headers: {
          "Authorization": authHeader(this.secretKey),
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": PAGARME_INTEGRATION_UA,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("[Elarah Payment/Pagarme] network error", logLabel, e);
      return { ok: false, errorStatus: 0, errorBody: String(e) };
    }

    let parsed: Json = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      console.error(
        "[Elarah Payment/Pagarme] create order failed",
        logLabel,
        "status=" + res.status,
        "body=" + JSON.stringify(parsed),
      );
      return { ok: false, errorStatus: res.status, errorBody: parsed };
    }

    const payment = normalizeOrder(parsed);
    console.info(
      "[Elarah Payment/Pagarme] order criada",
      logLabel,
      "order=" + payment.id,
      "charge=" + (payment.chargeId ?? "?"),
      "status=" + payment.status,
      "status_detail=" + (payment.statusDetail ?? ""),
    );
    return { ok: true, data: payment };
  }

  // ===== PIX =====
  async createPixPayment(input: PixPaymentInput): Promise<CreatePaymentResult> {
    const expiresMinutes = input.expiresInMinutes ?? 30;
    const idem = input.idempotencyKey || buildIdempotencyKey();

    const body: Json = {
      code: input.externalReference, // = booking.id → volta no webhook
      closed: true,
      customer: this.buildCustomer(input),
      items: this.buildItems(input),
      payments: [{
        payment_method: "pix",
        pix: {
          expires_in: expiresMinutes * 60, // segundos
          additional_information: [
            { name: "Reserva", value: String(input.description).slice(0, 64) },
          ],
        },
      }],
      metadata: this.buildMetadata(input),
      ...(input.notificationUrl ? { /* webhook é global na conta */ } : {}),
    };

    console.info(
      "[Elarah Payment/Pagarme] POST /orders (pix)",
      "amount_cents=" + input.amountCents,
      "external_ref=" + input.externalReference,
      "device=" + (input.deviceId ? "yes" : "no"),
      "idem=" + idem,
    );

    const result = await this.postOrder(body, idem, "pix");
    if (result.ok && result.data && !result.data.pix?.qrCode) {
      console.warn(
        "[Elarah Payment/Pagarme] order pix sem QR na resposta — o front usa qr_code_url/fallback",
        "order=" + result.data.id,
      );
    }
    return result;
  }

  // ===== Cartão (à vista + parcelado) =====
  async createCardPayment(
    input: CardPaymentInput,
  ): Promise<CreatePaymentResult> {
    if (!input.cardToken) {
      console.error("[Elarah Payment/Pagarme] card token ausente");
      return { ok: false, errorStatus: 400, errorBody: "no_card_token" };
    }
    const installments = Math.max(1, Math.floor(input.installments || 1));
    const idem = input.idempotencyKey || buildIdempotencyKey();

    const body: Json = {
      code: input.externalReference,
      closed: true,
      customer: this.buildCustomer(input),
      items: this.buildItems(input),
      payments: [{
        payment_method: "credit_card",
        credit_card: {
          installments,
          statement_descriptor: (input.statementDescriptor || "ELARAH")
            .replace(/[^A-Za-z0-9 ]/g, "").slice(0, 13),
          // Captura imediata por padrão (auth + capture na mesma chamada).
          operation_type: input.capture === false ? "auth_only" : "auth_and_capture",
          card_token: input.cardToken,
        },
      }],
      // antifraud: a v5 roda o antifraude automaticamente quando ele está
      // habilitado na conta; alimentamos com customer/itens/endereço. O
      // fingerprint fica no metadata (ver §sendSessionId).
      metadata: this.buildMetadata(input, {
        installments,
        card_fee_applied: true,
      }),
    };

    // Device/fingerprint no campo do antifraude — só quando confirmado
    // e ligado por env. Enquanto OFF, o valor já está no metadata.
    if (this.sendSessionId && input.deviceId) {
      body.session_id = String(input.deviceId).slice(0, 100);
    }

    console.info(
      "[Elarah Payment/Pagarme] POST /orders (card)",
      "amount_cents=" + input.amountCents,
      "installments=" + installments,
      "device=" + (input.deviceId ? "yes" : "no"),
      "device_len=" + (input.deviceId ? String(input.deviceId).length : 0),
      "send_session_id=" + this.sendSessionId,
      "external_ref=" + input.externalReference,
      "idem=" + idem,
    );

    return await this.postOrder(body, idem, "card");
  }

  // ===== Consulta (fonte autoritativa de status) =====
  // Aceita order id (or_...) OU charge id (ch_...) e normaliza os dois.
  async getPayment(paymentOrOrderId: string): Promise<CreatePaymentResult> {
    if (!this.secretKey) {
      return { ok: false, errorStatus: 0, errorBody: "no_secret_key" };
    }
    if (!paymentOrOrderId) {
      return { ok: false, errorStatus: 400, errorBody: "no_id" };
    }
    const isCharge = paymentOrOrderId.startsWith("ch_");
    const path = isCharge
      ? "/charges/" + paymentOrOrderId
      : "/orders/" + paymentOrOrderId;

    let res: Response;
    try {
      res = await fetch(PAGARME_BASE_URL + path, {
        method: "GET",
        headers: {
          "Authorization": authHeader(this.secretKey),
          "Accept": "application/json",
          "User-Agent": PAGARME_INTEGRATION_UA,
        },
      });
    } catch (e) {
      console.error("[Elarah Payment/Pagarme] network error on GET", e);
      return { ok: false, errorStatus: 0, errorBody: String(e) };
    }

    let parsed: Json = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      console.error(
        "[Elarah Payment/Pagarme] get failed",
        "path=" + path,
        "status=" + res.status,
        "body=" + JSON.stringify(parsed),
      );
      return { ok: false, errorStatus: res.status, errorBody: parsed };
    }

    const payment = isCharge ? normalizeCharge(parsed) : normalizeOrder(parsed);
    return { ok: true, data: payment };
  }

  // ===== Estorno (total ou parcial) =====
  async refund(
    chargeOrPaymentId: string,
    amountCents?: number,
  ): Promise<ProviderResult<{ id: string; status: NormalizedStatus }>> {
    if (!this.secretKey) {
      return { ok: false, errorStatus: 0, errorBody: "no_secret_key" };
    }
    // O estorno é por CHARGE. Se veio um order id, resolve a charge antes.
    let chargeId = chargeOrPaymentId;
    if (chargeId.startsWith("or_")) {
      const ord = await this.getPayment(chargeId);
      if (!ord.ok || !ord.data?.chargeId) {
        return { ok: false, errorStatus: 404, errorBody: "charge_not_found" };
      }
      chargeId = ord.data.chargeId;
    }

    let res: Response;
    try {
      res = await fetch(PAGARME_BASE_URL + "/charges/" + chargeId, {
        method: "DELETE",
        headers: {
          "Authorization": authHeader(this.secretKey),
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": PAGARME_INTEGRATION_UA,
        },
        // Sem body = estorno total; com amount = parcial.
        body: amountCents != null
          ? JSON.stringify({ amount: Math.round(amountCents) })
          : undefined,
      });
    } catch (e) {
      console.error("[Elarah Payment/Pagarme] network error on refund", e);
      return { ok: false, errorStatus: 0, errorBody: String(e) };
    }

    let parsed: Json = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      console.error(
        "[Elarah Payment/Pagarme] refund failed",
        "charge=" + chargeId,
        "status=" + res.status,
        "body=" + JSON.stringify(parsed),
      );
      return { ok: false, errorStatus: res.status, errorBody: parsed };
    }
    return {
      ok: true,
      data: {
        id: String(parsed?.id ?? chargeId),
        status: mapPagarmeStatus(parsed?.status),
      },
    };
  }

  // ===== Verificação do webhook =====
  // Estratégia em camadas (defense-in-depth). A segurança REAL é que o
  // handler SEMPRE re-busca a order/charge na API com a nossa secret key
  // (getPayment) — um atacante não consegue forjar um "pago" porque a
  // fonte da verdade é a resposta autenticada do Pagar.me, não o corpo
  // do webhook. Além disso, quando configurado:
  //   1. Basic auth (usuário/senha cadastrados no endpoint do painel).
  //   2. (Sem credenciais) aceita, com aviso — mas o re-fetch protege.
  verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookVerification> {
    // Basic auth configurado no endpoint do webhook (recomendado).
    if (this.webhookUser || this.webhookPassword) {
      const auth = headers.get("authorization") || "";
      const expected = "Basic " +
        btoa(this.webhookUser + ":" + this.webhookPassword);
      // Comparação timing-safe.
      if (auth.length !== expected.length) {
        return Promise.resolve({ ok: false, reason: "basic_auth_mismatch" });
      }
      let diff = 0;
      for (let i = 0; i < auth.length; i++) {
        diff |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      if (diff !== 0) {
        return Promise.resolve({ ok: false, reason: "basic_auth_mismatch" });
      }
      return Promise.resolve({ ok: true });
    }

    // Sem credenciais configuradas: aceita, mas avisa. O re-fetch por id
    // (getPayment) continua sendo a real fonte de verdade — nenhum status
    // é aplicado sem confirmar na API.
    console.warn(
      "[Elarah Payment/Pagarme] webhook sem Basic auth configurado " +
        "(PAGARME_WEBHOOK_USER/PASSWORD). Aceitando e confiando no re-fetch " +
        "por id. Configure as credenciais do endpoint no painel pra reforçar.",
    );
    return Promise.resolve({ ok: true });
  }

  // Extrai o id que permite re-buscar o pagamento (order id ou charge id).
  extractWebhookPaymentId(rawBody: string): string | null {
    const ev = parseWebhookEvent(rawBody);
    return ev.orderId ?? ev.chargeId ?? null;
  }
}

// ===== Parse do evento de webhook do Pagar.me =====
// Formato v5:
//   { "id": "hook_...", "type": "order.paid" | "charge.paid" |
//     "charge.payment_failed" | "charge.refunded" | "charge.chargedback" |
//     "order.payment_failed" | "order.canceled" | ...,
//     "data": { ...order ou charge... } }
//
// Para order.*  → data é a order  (data.id = or_..., data.code, data.charges)
// Para charge.* → data é a charge (data.id = ch_..., data.order.id/code)
export interface PagarmeWebhookEvent {
  type: string;
  orderId: string | null;
  chargeId: string | null;
  code: string | null; // external_reference (= booking.id) quando presente
  raw: Json;
}

export function parseWebhookEvent(rawBody: string): PagarmeWebhookEvent {
  let parsed: Json = {};
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    parsed = {};
  }
  const type = String(parsed?.type ?? "");
  const data = parsed?.data ?? {};
  let orderId: string | null = null;
  let chargeId: string | null = null;
  let code: string | null = null;

  const id = data?.id ? String(data.id) : null;
  if (id?.startsWith("or_")) orderId = id;
  else if (id?.startsWith("ch_")) chargeId = id;

  // charge.* → a order aninhada
  if (!orderId && data?.order?.id) orderId = String(data.order.id);
  if (data?.order?.code) code = String(data.order.code);
  if (!code && data?.code) code = String(data.code);

  return { type, orderId, chargeId, code, raw: parsed };
}

// ===== Helper: valida CPF por dígito verificador =====
// Mesma validação usada no fluxo do MP — evita mandar CPF inválido pro
// Pagar.me (que recusaria ou pontuaria mal no antifraude).
export function isValidCpf(raw: string): boolean {
  const d = String(raw || "").replace(/\D+/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const arr = d.split("").map(Number);
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

// ===== Factory a partir das env vars =====
export function pagarmeFromEnv(): PagarmeProvider {
  return new PagarmeProvider({
    secretKey: Deno.env.get("PAGARME_SECRET_KEY") ?? "",
    webhookUser: Deno.env.get("PAGARME_WEBHOOK_USER") ?? "",
    webhookPassword: Deno.env.get("PAGARME_WEBHOOK_PASSWORD") ?? "",
    sendSessionId: String(Deno.env.get("PAGARME_SEND_SESSION_ID") ?? "")
      .toLowerCase() === "true",
  });
}
