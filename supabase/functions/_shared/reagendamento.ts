// =============================================================
// ELARAH — Peças comuns de remarcação de reserva
// -------------------------------------------------------------
// Usado por:
//   * admin-reagendar-reserva  (admin editou a reserva no painel)
//   * cliente-trocar-reserva   (a cliente trocou sozinha em Minhas compras)
//
// Os dois caminhos precisam mover a vaga do mesmo jeito e mandar a mesma
// confirmação com a data nova — se um divergir do outro, o estoque ou a
// mensagem da cliente sai diferente conforme quem remarcou.
//
// As RPCs de vaga só têm grant pra service_role: quem chama passa o
// client de service role.
// =============================================================

import {
  bookingConfirmationEmailHtml,
  sendEmail,
} from "./email.ts";
import {
  bookingConfirmationTemplateParams,
  bookingConfirmationWhatsAppText,
  experienceImageUrl,
  gatedSendWhatsApp,
} from "./whatsapp.ts";

// deno-lint-ignore no-explicit-any
type SB = any;

// Devolve a vaga: da turma quando há slot, senão do contador da experiência.
export async function liberarVaga(sb: SB, slotId: string | null, expId: string | null, qty: number) {
  if (slotId) {
    const { error } = await sb.rpc("increment_slot_vagas", { p_slot_id: slotId, p_qty: qty });
    if (error) throw error;
  } else if (expId) {
    const { error } = await sb.rpc("increment_experience_vagas", { p_experience_id: expId, p_qty: qty });
    if (error) throw error;
  }
}

// true = segurou; false = não havia vaga (a turma está lotada).
export async function segurarVaga(sb: SB, slotId: string | null, expId: string | null, qty: number): Promise<boolean> {
  let res;
  if (slotId) {
    res = await sb.rpc("decrement_slot_vagas", { p_slot_id: slotId, p_qty: qty });
  } else if (expId) {
    res = await sb.rpc("decrement_experience_vagas", { p_experience_id: expId, p_qty: qty });
  } else {
    return true;
  }
  if (res.error) throw res.error;
  const row = Array.isArray(res.data) ? res.data[0] : res.data;
  return !row || row.ok !== false;
}

// Manda de novo a confirmação (WhatsApp + e-mail) com a data/horário/local
// NOVOS. `bk` é a reserva JÁ atualizada e `meta` o metadata já gravado (com
// reagendamento_seq novo — entra na chave de idempotência do WhatsApp, pra
// não repetir se a mesma troca for salva duas vezes).
export async function enviarConfirmacaoReagendamento(
  sb: SB,
  // deno-lint-ignore no-explicit-any
  bk: any,
  meta: Record<string, unknown>,
  opts: { createdBy: string | null; logTag: string },
): Promise<{ whatsapp: string | null; email: string | null }> {
  const out: { whatsapp: string | null; email: string | null } = { whatsapp: null, email: null };
  const bookingId = String(bk.id);
  const qty = Math.max(1, Number(bk.quantidade) || 1);
  const dados = {
    nome: bk.nome,
    experienciaNome: bk.experiencia_nome ?? "Sua experiência",
    data: bk.data,
    horario: bk.horario,
    endereco: (meta.endereco as string | null) ?? null,
    bairro: (meta.bairro as string | null) ?? null,
  };
  try {
    const texto = bookingConfirmationWhatsAppText({ ...dados, quantidade: qty });
    const wa = await gatedSendWhatsApp(sb, {
      kind: "reagendamento",
      dedupeKey: "reagendamento:" + bookingId + ":" + meta.reagendamento_seq,
      identifierOk: !!bookingId,
      rawPhone: (meta.telefone_digits as string | undefined) ?? bk.telefone,
      suppressed: false,
      statusAllowed: true,
      image: experienceImageUrl(bk.experiences?.imagem),
      caption: texto,
      message: texto,
      template: { params: bookingConfirmationTemplateParams(dados) },
      bookingId,
      experienciaId: bk.experiencia_id ?? null,
      createdBy: opts.createdBy,
    });
    out.whatsapp = wa.sent ? "enviado" : (wa.reason ?? wa.error ?? "nao_enviado");
  } catch (e) {
    console.error("[" + opts.logTag + "] WhatsApp falhou", bookingId, String(e));
    out.whatsapp = "erro";
  }

  if (bk.email) {
    try {
      const html = bookingConfirmationEmailHtml({
        ...dados,
        prazoRemarcacaoHoras: (meta.politica_remarcacao_horas as number | null) ?? null,
        prazoCancelamentoHoras: (meta.politica_cancelamento_horas as number | null) ?? null,
        precoLabel: bk.preco_label,
        quantidade: qty,
        amountTotalCentavos: bk.amount_total ?? null,
        participantes: Array.isArray(meta.participantes) ? meta.participantes : null,
        bookingId,
        variantLabel: (meta.variant_label as string | undefined) ?? null,
        variantSelected: (meta.variant_selected as string | undefined) ?? null,
      });
      const r = await sendEmail({
        to: String(bk.email).trim(),
        subject: "Sua reserva na Elarah foi atualizada ✨",
        html,
      });
      out.email = r.ok ? "enviado" : "erro";
    } catch (e) {
      console.error("[" + opts.logTag + "] e-mail falhou", bookingId, String(e));
      out.email = "erro";
    }
  } else {
    out.email = "sem_email";
  }
  return out;
}
