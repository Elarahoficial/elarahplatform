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
// Cobertura desta camada (Checkout API / Checkout Transparente):
//   - PIX:    createPixPayment   → POST /v1/payments (payment_method_id=pix)
//   - CARTÃO: createCardPayment  → POST /v1/payments (token + Secure Fields)
//   - Consulta:      getPayment  → GET  /v1/payments/:id
//   - Webhook:       verifyWebhookSignature (HMAC-SHA256)
//   - Checkout Pro:  createCheckoutPreference (fallback legado)
//
// Boas práticas de aprovação implementadas aqui (recomendações
// oficiais do Mercado Pago Developers):
//   - Device ID enviado no header `X-meli-session-id` em TODAS as
//     transações (/v1/payments). Aumenta a aprovação e reduz fraude.
//   - Payload completo: payer (email, first/last name, identification,
//     address), issuer_id, payment_method_id, installments, token,
//     description, statement_descriptor.
//   - `additional_info` com items (id, title, description, quantity,
//     unit_price, category_id) + payer (phone, address) — alimenta o
//     motor antifraude e melhora a taxa de aprovação.
//   - 3-D Secure 2 opcional (three_d_secure_mode="optional") no cartão.
//
// Docs de referência:
//   - Criar pagamento: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
//   - Consultar pagamento: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments_id/get
//   - Melhorar aprovação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/how-tos/improve-payment-approval
//   - Device ID: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/security/device-fingerprint
//   - Assinatura do webhook: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#secret-key
// =============================================================

const MP_BASE_URL = "https://api.mercadopago.com";

// User-agent / integração — a MP recomenda identificar o integrador
// via `X-Product-Id` / `User-Agent` pra rastrear a origem das chamadas.
const MP_INTEGRATION_UA = "Elarah/1.0 (+https://elarah.com.br)";

// ===== Tipos =====
// Só os campos que a gente de fato usa. Os objetos reais do MP são
// enormes — preservamos só o essencial e ignoramos o resto.

// ===== Dados opcionais recomendados pra aprovação =====
// Telefone e endereço do pagador + itens da compra. Nada disso é
// obrigatório pra criar o pagamento, mas o Mercado Pago recomenda
// FORTEMENTE enviar o máximo de informação — o motor antifraude usa
// esses dados pra aprovar mais e recusar menos pagamentos legítimos.
export interface MPPhone {
  areaCode?: string; // DDD, ex "11"
  number?: string;   // resto do número, só dígitos
}

export interface MPAddress {
  zipCode?: string;
  streetName?: string;
  streetNumber?: string | number;
  neighborhood?: string;
  city?: string;
  federalUnit?: string; // UF, ex "SP"
}

export interface MPItemInfo {
  id?: string;
  title: string;
  description?: string;
  categoryId?: string;   // ex "services", "entertainment"
  quantity: number;
  unitPriceCents: number; // centavos; convertido pra reais aqui dentro
  pictureUrl?: string;
}

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
  // ===== Boas práticas de aprovação (opcionais) =====
  deviceId?: string;              // Device ID (MercadoPago.js) → X-meli-session-id
  payerPhone?: MPPhone;
  payerAddress?: MPAddress;
  items?: MPItemInfo[];           // vira additional_info.items
  statementDescriptor?: string;   // texto na fatura (cartão)
}

// ===== Entrada específica do cartão (Checkout Transparente) =====
// O cartão exige, além dos campos acima, os dados tokenizados no
// cliente via MercadoPago.js V2 Secure Fields. NENHUM dado sensível
// do cartão (número/CVV) passa por aqui — só o `token` gerado pela MP.
export interface MPCardPaymentInput extends MPPaymentCreateInput {
  token: string;                  // card token (MercadoPago.js) — uso único
  paymentMethodId: string;        // visa | master | amex | elo | hipercard ...
  installments: number;           // parcelas escolhidas pelo cliente
  issuerId?: string;              // banco emissor (recomendado)
  payerIdentificationType?: string; // default "CPF"
  capture?: boolean;              // default true (captura imediata)
  binaryMode?: boolean;           // default false (permite in_process)
  threeDSecureMode?: "not_supported" | "optional" | "mandatory"; // default "optional"
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
  issuer_id?: string;         // banco emissor
  installments?: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;            // código copia-e-cola (EMV)
      qr_code_base64?: string;     // PNG em base64
      ticket_url?: string;         // URL de fallback
    };
  };
  // 3-D Secure 2: presente quando o pagamento exige challenge do banco.
  // O front usa external_resource_url + creq pra renderizar o desafio.
  three_ds_info?: {
    external_resource_url?: string;
    creq?: string;
  } | null;
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

// Só dígitos — normaliza CPF/telefone/CEP.
function digits(raw: unknown): string {
  return String(raw ?? "").replace(/\D+/g, "");
}

// Monta o header padrão das chamadas autenticadas à API da MP.
// `deviceId` (quando presente) vira o `X-meli-session-id` — é ASSIM
// que a MP recebe o Device ID coletado pelo MercadoPago.js no cliente.
// Sem esse header a MP não consegue correlacionar o dispositivo e a
// taxa de aprovação cai (e a Qualidade da Integração acusa a falta).
function buildAuthHeaders(
  accessToken: string,
  idempotencyKey?: string,
  deviceId?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Authorization": "Bearer " + accessToken,
    "Content-Type": "application/json",
    "User-Agent": MP_INTEGRATION_UA,
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;
  if (deviceId) headers["X-meli-session-id"] = deviceId;
  return headers;
}

// Monta o objeto `payer` do /v1/payments com o máximo de informação
// disponível (recomendação de aprovação da MP). Campos vazios são
// omitidos — a MP recusa alguns objetos parciais (ex.: address sem
// zip_code), então só incluímos o que estiver realmente preenchido.
function buildPayer(input: MPPaymentCreateInput, identificationType = "CPF") {
  const payer: Record<string, unknown> = {
    email: input.payerEmail,
  };
  if (input.payerFirstName) payer.first_name = input.payerFirstName;
  if (input.payerLastName) payer.last_name = input.payerLastName;

  const cpf = digits(input.payerCpf);
  if (cpf) {
    payer.identification = { type: identificationType, number: cpf };
  }

  if (input.payerPhone && (input.payerPhone.areaCode || input.payerPhone.number)) {
    payer.phone = {
      area_code: input.payerPhone.areaCode || "",
      number: input.payerPhone.number || "",
    };
  }

  const addr = input.payerAddress;
  if (addr && addr.zipCode && addr.streetName) {
    payer.address = {
      zip_code: digits(addr.zipCode),
      street_name: addr.streetName,
      street_number: addr.streetNumber != null ? String(addr.streetNumber) : "",
      ...(addr.neighborhood ? { neighborhood: addr.neighborhood } : {}),
      ...(addr.city ? { city: addr.city } : {}),
      ...(addr.federalUnit ? { federal_unit: addr.federalUnit } : {}),
    };
  }

  return payer;
}

// Monta `additional_info` — o bloco que mais pesa na aprovação. Inclui
// os itens da compra (com description!) e uma cópia do payer com phone
// e address. Tudo opcional; enviamos o que der.
function buildAdditionalInfo(input: MPPaymentCreateInput) {
  const info: Record<string, unknown> = {};

  const items = (input.items && input.items.length)
    ? input.items
    : [{
      title: input.description,
      description: input.description,
      quantity: 1,
      unitPriceCents: input.transactionAmountCents,
      categoryId: "services",
    } as MPItemInfo];

  info.items = items.map((it, idx) => ({
    id: it.id || (input.externalReference + "-" + idx),
    title: String(it.title).slice(0, 256),
    description: String(it.description || it.title).slice(0, 256),
    category_id: it.categoryId || "services",
    quantity: Math.max(1, Math.floor(it.quantity || 1)),
    unit_price: centsToReais(it.unitPriceCents),
    ...(it.pictureUrl ? { picture_url: it.pictureUrl } : {}),
  }));

  const aiPayer: Record<string, unknown> = {};
  if (input.payerFirstName) aiPayer.first_name = input.payerFirstName;
  if (input.payerLastName) aiPayer.last_name = input.payerLastName;
  if (input.payerPhone && (input.payerPhone.areaCode || input.payerPhone.number)) {
    aiPayer.phone = {
      area_code: input.payerPhone.areaCode || "",
      number: input.payerPhone.number || "",
    };
  }
  const addr = input.payerAddress;
  if (addr && addr.zipCode && addr.streetName) {
    aiPayer.address = {
      zip_code: digits(addr.zipCode),
      street_name: addr.streetName,
      street_number: addr.streetNumber != null ? Number(digits(addr.streetNumber)) || undefined : undefined,
    };
  }
  if (Object.keys(aiPayer).length) info.payer = aiPayer;

  return info;
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

  const body = {
    transaction_amount: centsToReais(input.transactionAmountCents),
    description: input.description.slice(0, 600),
    external_reference: input.externalReference,
    payment_method_id: "pix",
    date_of_expiration: expiresAt,
    notification_url: input.notificationUrl || undefined,
    payer: buildPayer(input),
    additional_info: buildAdditionalInfo(input),
  };

  const idemKey = input.idempotencyKey || buildIdempotencyKey();

  console.info(
    "[Elarah Payment/MP] POST /v1/payments (pix)",
    "amount=" + body.transaction_amount,
    "external_ref=" + input.externalReference,
    "device_id=" + (input.deviceId ? "yes" : "no"),
    "idem=" + idemKey,
  );

  let res: Response;
  try {
    res = await fetch(MP_BASE_URL + "/v1/payments", {
      method: "POST",
      headers: buildAuthHeaders(accessToken, idemKey, input.deviceId),
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
// API: criar pagamento no CARTÃO (Checkout Transparente / Checkout API)
// -------------------------------------------------------------
// Cria um pagamento direto no /v1/payments usando o `token` gerado no
// cliente pelo MercadoPago.js V2 (Secure Fields). É o fluxo MODERNO e
// recomendado pela MP: os dados do cartão NUNCA passam pelo nosso
// servidor (conformidade PCI garantida pelos Secure Fields), a gente
// controla 100% do payload (maximiza aprovação) e o Device ID vai no
// header `X-meli-session-id`.
//
// Diferente do Checkout Pro (redirect), aqui:
//   - o cliente digita o cartão DENTRO do site (Secure Fields em iframe);
//   - o token + issuer_id + payment_method_id + installments vêm do
//     cardForm.getCardFormData() no front;
//   - a resposta já traz o status final (approved/in_process/rejected),
//     sem redirect. O mp-webhook continua reconciliando por
//     external_reference == booking.id (mesmo fluxo do PIX).
//
// Resolve as pendências OBRIGATÓRIAS da Qualidade da Integração:
//   ✓ Device ID (MercadoPago.js V2) — via X-meli-session-id
//   ✓ Secure Fields (PCI) — captura no cliente, token aqui
//   ✓ issuer_id, payer.last_name, items.description, payer.email etc.
//
// Docs:
//   https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-cardform
// =============================================================
export async function createCardPayment(
  accessToken: string,
  input: MPCardPaymentInput,
): Promise<MPCreateResult> {
  if (!accessToken) {
    console.error("[Elarah Payment/MP] access token ausente (card)");
    return { ok: false, errorStatus: 0, errorBody: "no_access_token" };
  }
  if (!input.token) {
    console.error("[Elarah Payment/MP] card token ausente");
    return { ok: false, errorStatus: 400, errorBody: "no_card_token" };
  }
  if (!input.paymentMethodId) {
    console.error("[Elarah Payment/MP] payment_method_id ausente");
    return { ok: false, errorStatus: 400, errorBody: "no_payment_method_id" };
  }

  const installments = Math.max(1, Math.floor(input.installments || 1));

  const body: Record<string, unknown> = {
    transaction_amount: centsToReais(input.transactionAmountCents),
    token: input.token,
    description: input.description.slice(0, 600),
    installments,
    payment_method_id: input.paymentMethodId,
    external_reference: input.externalReference,
    notification_url: input.notificationUrl || undefined,
    statement_descriptor: (input.statementDescriptor || "ELARAH").slice(0, 22),
    // Captura imediata por padrão (cobra na hora). binary_mode=false
    // permite o estado in_process (ex.: análise antifraude) em vez de
    // recusar de cara — aprova mais no líquido.
    capture: input.capture ?? true,
    binary_mode: input.binaryMode ?? false,
    // 3-D Secure 2 opcional: a MP só pede o desafio quando o banco
    // emissor exige. Reduz recusas por segurança sem atritar quem não
    // precisa. O front renderiza o challenge quando três_ds_info vier.
    three_d_secure_mode: input.threeDSecureMode ?? "optional",
    payer: buildPayer(input, input.payerIdentificationType || "CPF"),
    additional_info: buildAdditionalInfo(input),
  };
  if (input.issuerId) body.issuer_id = input.issuerId;

  const idemKey = input.idempotencyKey || buildIdempotencyKey();

  console.info(
    "[Elarah Payment/MP] POST /v1/payments (card)",
    "amount=" + body.transaction_amount,
    "pmethod=" + input.paymentMethodId,
    "issuer=" + (input.issuerId ?? "?"),
    "installments=" + installments,
    "device_id=" + (input.deviceId ? "yes" : "no"),
    "3ds=" + (input.threeDSecureMode ?? "optional"),
    "external_ref=" + input.externalReference,
    "idem=" + idemKey,
  );

  let res: Response;
  try {
    res = await fetch(MP_BASE_URL + "/v1/payments", {
      method: "POST",
      headers: buildAuthHeaders(accessToken, idemKey, input.deviceId),
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("[Elarah Payment/MP] network error (card)", e);
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
      "[Elarah Payment/MP] create card payment failed",
      "status=" + res.status,
      "body=" + JSON.stringify(parsed),
    );
    return { ok: false, errorStatus: res.status, errorBody: parsed };
  }

  const payment = parsed as MPPaymentResponse;
  console.info(
    "[Elarah Payment/MP] card payment criado",
    "id=" + payment.id,
    "status=" + payment.status,
    "status_detail=" + payment.status_detail,
    "3ds_challenge=" + (payment.three_ds_info?.external_resource_url ? "yes" : "no"),
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
  description?: string;
  categoryId?: string;
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
      // description e category_id ajudam o antifraude também no
      // Checkout Pro (recomendação de aprovação da MP).
      description: String((it as { description?: string }).description || it.title).slice(0, 250),
      category_id: (it as { categoryId?: string }).categoryId || "services",
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
