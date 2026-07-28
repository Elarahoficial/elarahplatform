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

// ===== Taxas comerciais Pagar.me/Stone (NÃO são credenciais) =====
// Config CENTRALIZADA pra ajuste rápido se a liquidação real divergir.
// Override opcional por env PAGARME_FEES_JSON = {"fixedCents":99,"cardRatesPct":{...}}.
// Fonte: painel da conta Elarah.
//
// ANTECIPAÇÃO: a conta está com "antecipação automática ATIVA" (1,25% a.m.).
// NÃO somamos 1,25% adicional aqui — usamos EXATAMENTE as taxas do painel.
// Se a liquidação real da 1ª transação divergir, ajustar por env (sem PR).
const DEFAULT_PAGARME_FEES = {
  // Fixo por transação de cartão aprovada: processamento R$0,55 + antifraude R$0,44.
  fixedCents: 55 + 44, // 99
  // Taxa % por nº de parcelas (tabela real do painel).
  cardRatesPct: {
    1: 5.59, 2: 8.59, 3: 9.84, 4: 11.09, 5: 12.34, 6: 13.59,
    7: 15.34, 8: 16.59, 9: 17.84, 10: 19.09, 11: 20.34, 12: 21.59,
  } as Record<number, number>,
};

function loadPagarmeFees(): { fixedCents: number; cardRatesPct: Record<number, number> } {
  try {
    const raw = Deno.env.get("PAGARME_FEES_JSON");
    if (raw) {
      const o = JSON.parse(raw);
      return {
        fixedCents: Number.isFinite(o.fixedCents) ? o.fixedCents : DEFAULT_PAGARME_FEES.fixedCents,
        cardRatesPct: (o.cardRatesPct && typeof o.cardRatesPct === "object")
          ? o.cardRatesPct
          : DEFAULT_PAGARME_FEES.cardRatesPct,
      };
    }
  } catch (e) {
    console.warn("[Elarah Payment/Pagarme] PAGARME_FEES_JSON inválido — usando default", e);
  }
  return DEFAULT_PAGARME_FEES;
}

export const PAGARME_FEES = loadPagarmeFees();

// Monta a lista de parcelas com GROSS-UP: cada opção é calculada pra que,
// depois de o Pagar.me descontar a taxa% daquela parcela + o fixo, sobre o
// valor-base (B) integral pra Elarah.
//   T = teto[ (B + F) / (1 - r) ]   (centavos; arredonda p/ CIMA → líquido ≥ B)
// B já vem líquido de cupom/gift card (é o amountToChargeCents do checkout).
// O PIX NÃO passa por aqui — paga o valor-base do carrinho (cart_settings).
export function buildInstallmentOptions(
  baseCents: number,
  maxInstallments: number,
): Array<{ number: number; total: number }> {
  const max = Math.max(1, Math.min(12, Math.floor(maxInstallments || 12)));
  const F = PAGARME_FEES.fixedCents;
  const out: Array<{ number: number; total: number }> = [];
  for (let n = 1; n <= max; n++) {
    const ratePct = PAGARME_FEES.cardRatesPct[n];
    if (!Number.isFinite(ratePct)) continue; // parcela sem taxa definida → pula
    const r = ratePct / 100;
    // Arredonda p/ CIMA garante que o líquido nunca cai abaixo de B.
    const total = Math.ceil((baseCents + F) / (1 - r));
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
        // installments explícito {number,total} com os totais já grossed-up
        // por parcela. NÃO enviar installments_setup junto: em link
        // type=order os dois são MUTUAMENTE EXCLUSIVOS (a API retorna 400 —
        // confirmado no sandbox). cart_settings.items.amount fica no
        // valor-base → PIX cobra o base; só o cartão usa estes totais.
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
  // Diagnóstico: payload COMPLETO enviado (installments com os totais
  // grossed-up). Fica SÓ nos logs da Edge Function — nunca no cliente.
  console.info("[Elarah Payment/Pagarme] payload /paymentlinks", JSON.stringify(body));

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

  // Diagnóstico: resposta COMPLETA do Pagar.me (ecoa como ele interpretou
  // os installments/totais). Só nos logs — confirma se o gross-up foi aceito.
  console.info(
    "[Elarah Payment/Pagarme] resposta /paymentlinks",
    "http=" + res.status,
    JSON.stringify(parsed),
  );

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
