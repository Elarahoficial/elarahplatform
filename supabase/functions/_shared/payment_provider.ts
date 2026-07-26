// =============================================================
// ELARAH — Payment Provider (camada de abstração de gateway)
// -------------------------------------------------------------
// Contrato ÚNICO que desacopla a lógica de negócio da Elarah
// (reserva, financeiro, e-mail, conciliação) de QUALQUER gateway
// de pagamento específico.
//
// Motivação (decisão de produto, 2026-07):
//   O checkout nasceu acoplado à Stripe, depois ganhou Mercado Pago
//   por cima (cada um com suas próprias funções e webhook, sem
//   interface comum). A migração pro Pagar.me é a oportunidade de
//   introduzir esta camada: daqui pra frente um novo gateway é uma
//   nova implementação de `PaymentProvider` — os handlers de checkout
//   e o webhook falam só com os TIPOS NORMALIZADOS abaixo, nunca com
//   o formato cru de um provedor.
//
// O que esta camada padroniza:
//   1. Vocabulário de STATUS único (NormalizedStatus) — cada provider
//      traduz o dele pro nosso. Um `switch` no webhook vale pra todos.
//   2. Formato de ENTRADA único (PixPaymentInput / CardPaymentInput) —
//      com TODOS os sinais de aprovação/antifraude (comprador completo,
//      itens, device/fingerprint, endereço) desde o começo.
//   3. Formato de SAÍDA único (NormalizedPayment / PixResult / CardResult).
//   4. Verificação de webhook + extração de referência (booking.id).
//
// O que NÃO fica aqui: a lógica de negócio (booking_guard, financial,
// email) — essa já é agnóstica de gateway e é reaproveitada por todos.
// =============================================================

// ===== Status normalizado (vocabulário único da Elarah) =====
// Todo provider TRADUZ o status cru dele pra um destes. Assim o
// webhook e a UI nunca precisam conhecer os status específicos de
// cada gateway ("approved" na MP, "paid" no Pagar.me → "approved" aqui).
export type NormalizedStatus =
  | "approved" // pago e confirmado (booking → 'pago')
  | "pending" // aguardando pagamento (PIX não pago, boleto aberto)
  | "in_process" // em análise (antifraude/3DS) — não mexe na booking
  | "rejected" // recusado pelo emissor/antifraude (booking → 'cancelado')
  | "cancelled" // cancelado antes de pagar (booking → 'cancelado')
  | "refunded" // estornado (booking → 'reembolsado')
  | "charged_back" // chargeback (booking → 'reembolsado')
  | "unknown"; // status não mapeado — trata como não-terminal (aguarda)

// Mapeia o status normalizado pro vocabulário de status da tabela
// `bookings`. Fonte única — usada pelo webhook de qualquer provider.
// Retorna null quando o status é NÃO-TERMINAL (pending/in_process/
// unknown): o caller NÃO deve alterar a booking, só aguardar.
export function bookingStatusFor(
  status: NormalizedStatus,
): "pago" | "cancelado" | "reembolsado" | null {
  switch (status) {
    case "approved":
      return "pago";
    case "rejected":
    case "cancelled":
      return "cancelado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    default:
      return null; // pending / in_process / unknown → aguarda
  }
}

// ===== Dados do comprador (todos os sinais de aprovação) =====
// Quanto mais completo, mais o antifraude aprova pagamentos legítimos.
// Nome separado, CPF, telefone e endereço são recomendação FORTE tanto
// do Pagar.me quanto do Mercado Pago.
export interface PaymentCustomer {
  email: string;
  firstName: string;
  lastName: string;
  cpf: string; // só dígitos, 11 chars
  phone?: { areaCode?: string; number?: string };
  address?: {
    zipCode?: string;
    streetName?: string;
    streetNumber?: string | number;
    neighborhood?: string;
    city?: string;
    federalUnit?: string; // UF, ex "SP"
    complement?: string;
  };
}

// ===== Item da compra =====
export interface PaymentItem {
  id?: string;
  title: string;
  description?: string;
  categoryId?: string;
  quantity: number;
  unitPriceCents: number; // centavos (inteiro)
}

// ===== Entrada base (comum a PIX e cartão) =====
export interface BasePaymentInput {
  amountCents: number; // total a cobrar, em centavos
  description: string;
  externalReference: string; // booking.id — chave de reconciliação
  customer: PaymentCustomer;
  items?: PaymentItem[];
  notificationUrl?: string; // URL do webhook do provider
  idempotencyKey?: string; // evita cobrança duplicada em retry
  // Fingerprint/Device do dispositivo, coletado no cliente. Principal
  // alavanca antifraude. Cada provider decide onde encaixar (header,
  // campo `device`, `session_id` do antifraude). Passar sempre que houver.
  deviceId?: string;
  statementDescriptor?: string; // texto na fatura do cartão
}

export interface PixPaymentInput extends BasePaymentInput {
  expiresInMinutes?: number; // default 30
}

export interface CardPaymentInput extends BasePaymentInput {
  cardToken: string; // token de uso único gerado no CLIENTE (nunca o PAN)
  installments: number; // parcelas (1 = à vista)
  // Captura imediata (auth+capture) vs. só autorização. Default true.
  capture?: boolean;
}

// ===== Saída normalizada =====
export interface NormalizedPayment {
  providerName: string; // "pagarme" | "mercado_pago" | ...
  id: string; // id do pagamento/order no provider
  chargeId?: string | null; // id da cobrança (estorno) quando aplicável
  status: NormalizedStatus;
  statusDetail?: string; // motivo cru (recusa, etc.) — pra log/UI
  amountCents: number; // valor efetivamente cobrado (do provider)
  externalReference?: string | null; // booking.id de volta
  paymentMethod?: string; // "pix" | "credit_card" | ...
  installments?: number;
  // PIX: dados pra exibir o QR inline no checkout.
  pix?: {
    qrCode?: string | null; // copia-e-cola (EMV)
    qrCodeBase64?: string | null; // PNG base64 (quando o provider dá)
    qrCodeUrl?: string | null; // URL da imagem/página (fallback)
    expiresAt?: string | null;
  };
  // Cartão: desafio 3-D Secure, quando o emissor exige.
  threeDs?: {
    url?: string | null;
  } | null;
  // Objeto cru do provider — só pra log/debug, nunca pra lógica.
  raw?: unknown;
}

export interface ProviderResult<T> {
  ok: boolean;
  data?: T;
  errorStatus?: number;
  errorBody?: unknown;
}

export type CreatePaymentResult = ProviderResult<NormalizedPayment>;

// ===== Resultado da verificação de webhook =====
export interface WebhookVerification {
  ok: boolean;
  reason?: string;
}

// =============================================================
// A interface. Toda integração de gateway implementa isto.
// =============================================================
export interface PaymentProvider {
  readonly name: string;

  // Cria um pagamento PIX. Retorna o QR normalizado.
  createPixPayment(input: PixPaymentInput): Promise<CreatePaymentResult>;

  // Cria um pagamento no cartão (à vista ou parcelado) com token do cliente.
  createCardPayment(input: CardPaymentInput): Promise<CreatePaymentResult>;

  // Consulta um pagamento/order pelo id — usado pelo webhook e pela
  // reconciliação on-demand. É a fonte AUTORITATIVA de status (não
  // confiamos no corpo do webhook; sempre re-buscamos por aqui).
  getPayment(paymentOrOrderId: string): Promise<CreatePaymentResult>;

  // Estorna (total ou parcial) uma cobrança.
  refund(
    chargeOrPaymentId: string,
    amountCents?: number,
  ): Promise<ProviderResult<{ id: string; status: NormalizedStatus }>>;

  // Verifica a autenticidade de um webhook recebido.
  verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookVerification>;

  // Extrai, do corpo do webhook, o id que permite re-buscar o
  // pagamento na API (getPayment). Retorna null se não for um evento
  // de pagamento que nos interessa.
  extractWebhookPaymentId(rawBody: string): string | null;
}
