// =============================================================
// ELARAH — Reserva paga 100% com cupom/crédito (total R$ 0)
// -------------------------------------------------------------
// Quando o cupom cobre a compra inteira, as funções de pagamento
// (create-*-payment / create-checkout-session / create-pagarme-checkout)
// gravam a reserva direto como "pago" — não existe cobrança, então
// nenhum webhook roda. Sem isto, a reserva nascia sem confirmação pra
// cliente, sem aviso pro parceiro e sem aviso de venda pros admins.
//
// confirmarReservaSemCobranca() faz o que o webhook faria:
//   1. SOBRA DE CRÉDITO: se o cupom era um crédito da Elarah (valor fixo
//      de experiência guardada / troca / sobra anterior) e a experiência
//      custou MENOS que ele, gera um cupom novo com a diferença — mesma
//      validade do original, uso único. Fica em metadata.credito_sobra,
//      aparece na conta da cliente e vai por e-mail.
//      Taxa de cartão nunca entra aqui: a sobra só existe quando o total
//      da compra é R$ 0, ou seja, nada passou pelo cartão.
//   2. E-mail de confirmação pra cliente (mesmo do webhook).
//   3. WhatsApp de confirmação + aviso pro parceiro
//      (sendBookingConfirmationGated — o mesmo portão dos webhooks).
//   4. Aviso de venda pros admins.
//
// Best-effort: cada passo loga e segue; nunca derruba a reserva, que
// já está gravada e paga.
// =============================================================

import {
  bookingConfirmationEmailHtml,
  isCustomerMessagingSuppressed,
  sendAdminSaleNotification,
  sendEmail,
} from "./email.ts";
import { sendBookingConfirmationGated } from "./whatsapp.ts";
import { gerarCodigoCredito } from "./troca_cliente.ts";

// deno-lint-ignore no-explicit-any
type SB = any;

// Cupons que são crédito da cliente (dinheiro dela guardado na Elarah).
const ORIGENS_CREDITO = new Set(["aguardando_experiencia", "troca_cliente", "sobra_credito"]);

function brl(c: number): string {
  return "R$ " + (c / 100).toFixed(2).replace(".", ",");
}

function dataBR(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear();
}

// Gera o cupom com a sobra do crédito. Idempotente: se a reserva já tem
// metadata.credito_sobra (ou já existe cupom de sobra dela), não cria outro.
// deno-lint-ignore no-explicit-any
export async function gerarSobraDeCredito(supabase: SB, booking: any): Promise<Record<string, unknown> | null> {
  const bookingId = String(booking?.id ?? "");
  if (!bookingId || !booking.coupon_id) return null;
  const meta = (booking.metadata && typeof booking.metadata === "object") ? { ...booking.metadata } : {};
  if (meta.credito_sobra && typeof meta.credito_sobra === "object") return meta.credito_sobra;

  const { data: cup, error: cupErr } = await supabase
    .from("coupons")
    .select("id, code, discount_type, discount_value, valid_until, metadata")
    .eq("id", booking.coupon_id)
    .maybeSingle();
  if (cupErr || !cup) {
    if (cupErr) console.error("[reserva-credito] erro lendo cupom", bookingId, cupErr.message);
    return null;
  }
  const origem = String((cup.metadata as Record<string, unknown> | null)?.origem ?? "");
  if (cup.discount_type !== "value" || !ORIGENS_CREDITO.has(origem)) return null;

  const usado = Math.max(0, Number(booking.coupon_discount_centavos) || 0);
  const sobra = Math.max(0, Number(cup.discount_value) - usado);
  if (sobra <= 0) return null;

  // Já existe cupom de sobra desta reserva (chamada repetida)?
  const { data: ja } = await supabase
    .from("coupons")
    .select("id, code, discount_value, valid_until")
    .eq("metadata->>origem", "sobra_credito")
    .eq("metadata->>booking_id", bookingId)
    .limit(1);
  let credito: Record<string, unknown> | null = null;
  let novo = false;
  if (Array.isArray(ja) && ja.length) {
    credito = {
      codigo: ja[0].code,
      coupon_id: ja[0].id,
      valor_centavos: ja[0].discount_value,
      valido_ate: ja[0].valid_until,
    };
  } else {
    // Mesma validade do crédito original (a sobra não ganha prazo novo).
    const validade = String(cup.valid_until);
    for (let tentativa = 0; tentativa < 3 && !credito; tentativa++) {
      const codigo = gerarCodigoCredito();
      const { data: novoCup, error: insErr } = await supabase.from("coupons").insert({
        code: codigo,
        nome: "Sobra de crédito",
        descricao: "Sobra do crédito " + cup.code + " usado na reserva " + bookingId.slice(-8).toUpperCase() +
          " (" + (booking.email ?? "") + ")",
        discount_type: "value",
        discount_value: sobra,
        valid_until: validade,
        max_uses: 1,
        is_active: true,
        metadata: {
          origem: "sobra_credito",
          booking_id: bookingId,
          cupom_origem_id: cup.id,
          cupom_origem_code: cup.code,
          email: booking.email ?? null,
        },
      }).select("id").single();
      if (!insErr && novoCup) {
        credito = { codigo, coupon_id: novoCup.id, valor_centavos: sobra, valido_ate: validade };
        novo = true;
      } else {
        console.error("[reserva-credito] erro criando cupom de sobra", bookingId, insErr?.message);
      }
    }
  }
  if (!credito) return null;

  credito.cupom_origem_code = cup.code;
  credito.criado_at = new Date().toISOString();
  meta.credito_sobra = credito;
  const { error: updErr } = await supabase.from("bookings").update({ metadata: meta }).eq("id", bookingId);
  if (updErr) console.error("[reserva-credito] erro gravando credito_sobra", bookingId, updErr.message);
  booking.metadata = meta;

  if (novo && booking.email) {
    try {
      await sendEmail({
        to: String(booking.email).trim(),
        subject: "Sobrou " + brl(sobra) + " de crédito na Elarah 🎟",
        html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2b2420;">' +
          "<h2>Seu crédito continua aqui 🧡</h2>" +
          "<p>Oi" + (booking.nome ? ", " + String(booking.nome).split(" ")[0] : "") + "! A experiência" +
          (booking.experiencia_nome ? " <strong>" + String(booking.experiencia_nome) + "</strong>" : "") +
          " custou menos que o seu crédito, então a diferença continua com você:</p>" +
          '<p style="font-size:22px;font-weight:bold;letter-spacing:1px;background:#fff3ea;border-radius:10px;padding:14px;text-align:center;">' +
          String(credito.codigo) + "</p>" +
          "<p><strong>Valor:</strong> " + brl(sobra) + "<br><strong>Válido até:</strong> " + dataBR(String(credito.valido_ate)) + "</p>" +
          "<p>É só colar o código no campo de cupom na próxima reserva. O código também fica na sua conta, em Minhas compras.</p>" +
          "</div>",
      });
    } catch (e) {
      console.error("[reserva-credito] falha ao enviar e-mail da sobra", bookingId, String((e as { message?: string })?.message ?? e));
    }
  }
  return credito;
}

export async function confirmarReservaSemCobranca(
  supabase: SB,
  bookingId: string,
  paymentLabel: string,
): Promise<void> {
  let booking: Record<string, unknown> | null = null;
  try {
    const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    if (error || !data) {
      console.error("[reserva-credito] não consegui ler a reserva", bookingId, error?.message ?? "não encontrada");
      return;
    }
    booking = data;
  } catch (e) {
    console.error("[reserva-credito] exceção lendo a reserva", bookingId, String(e));
    return;
  }
  // deno-lint-ignore no-explicit-any
  const bk = booking as any;
  if (bk.status !== "pago") return;

  // 1. Sobra de crédito
  try {
    await gerarSobraDeCredito(supabase, bk);
  } catch (e) {
    console.error("[reserva-credito] falha na sobra de crédito", bookingId, String(e));
  }

  const meta = (bk.metadata ?? {}) as Record<string, unknown>;

  // 2. E-mail de confirmação pra cliente
  if (bk.email && !isCustomerMessagingSuppressed(bk)) {
    try {
      const html = bookingConfirmationEmailHtml({
        nome: bk.nome,
        experienciaNome: bk.experiencia_nome ?? "Sua experiência",
        data: bk.data,
        horario: bk.horario,
        endereco: (meta.endereco as string | null) ?? null,
        bairro: (meta.bairro as string | null) ?? null,
        prazoRemarcacaoHoras: (meta.politica_remarcacao_horas as number | null) ?? null,
        prazoCancelamentoHoras: (meta.politica_cancelamento_horas as number | null) ?? null,
        precoLabel: bk.preco_label,
        quantidade: bk.quantidade ?? null,
        amountTotalCentavos: bk.amount_total ?? null,
        participantes: Array.isArray(meta.participantes)
          ? (meta.participantes as Array<{ nome?: string | null }>)
          : null,
        bookingId: bk.id,
        variantLabel: (meta.variant_label as string | undefined) ?? null,
        variantSelected: (meta.variant_selected as string | undefined) ?? null,
      });
      const r = await sendEmail({
        to: String(bk.email).trim(),
        subject: "Sua reserva na Elarah está confirmada ✨",
        html,
      });
      if (!r.ok) console.error("[reserva-credito] e-mail de confirmação falhou", bookingId, r.error ?? "?");
    } catch (e) {
      console.error("[reserva-credito] exceção no e-mail de confirmação", bookingId, String(e));
    }
  }

  // 3. WhatsApp de confirmação + aviso pro parceiro (mesmo portão dos webhooks)
  try {
    await sendBookingConfirmationGated(supabase, bk, meta);
  } catch (e) {
    console.error("[reserva-credito] falha no WhatsApp/aviso ao parceiro", bookingId, String(e));
  }

  // 4. Aviso de venda pros admins
  try {
    await sendAdminSaleNotification({
      experienciaNome: bk.experiencia_nome ?? "Experiência",
      clienteNome: bk.nome,
      clienteEmail: bk.email,
      data: bk.data,
      horario: bk.horario,
      quantidade: bk.quantidade ?? null,
      amountTotalCentavos: bk.amount_total ?? null,
      precoLabel: bk.preco_label,
      bookingId: bk.id,
      paymentMethod: paymentLabel,
      couponCode: bk.coupon_code ?? null,
      couponDiscountCentavos: bk.coupon_discount_centavos ?? null,
      fornecedorNome: bk.fornecedor_nome ?? null,
      bairro: (meta.bairro as string | null) ?? null,
      prazoRemarcacaoHoras: (meta.politica_remarcacao_horas as number | null) ?? null,
      endereco: (meta.endereco as string | null) ?? null,
    });
  } catch (e) {
    console.error("[reserva-credito] falha no aviso de venda", bookingId, String(e));
  }
}
