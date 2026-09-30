// =============================================================
// ELARAH — cliente-trocar-reserva Edge Function
// -------------------------------------------------------------
// POST /functions/v1/cliente-trocar-reserva   (JWT da cliente logada)
//
//   { acao: "cotar", booking_id, experiencia_id, slot_id?, horario? }
//      → confere a troca e devolve a diferença a pagar (0 = troca direta)
//        e as parcelas do cartão (já com a taxa), sem mexer em nada.
//
//   { acao: "trocar", booking_id, experiencia_id, slot_id?, horario?,
//     pagamento?: { metodo: "pix", cpf }
//               | { metodo: "cartao", cpf, card_token, installments, address } }
//      → sem diferença: troca na hora.
//      → com diferença: cobra (Pix = QR na hora; cartão = Pagar.me) e a troca
//        só é aplicada quando o pagamento aprova (webhook ou "status").
//
//   { acao: "status", troca_id, verificar? }
//      → situação do pagamento da diferença. Com verificar=true, consulta o
//        gateway (botão "Já paguei") e aplica a troca se já aprovou.
//
//   { acao: "reembolso", booking_id, motivo? }
//      → só REGISTRA o pedido (a cliente fala com a Elarah no WhatsApp).
//
// Regras da troca em _shared/troca_cliente.ts (validarTroca). Resumo:
// reserva dela, paga, dentro do prazo de remarcação sem custo, 1 vez só;
// data nova à venda no site com vaga; outra experiência sem variações/kit/
// agendamento livre. Mais cara → paga a diferença do preço de tabela.
//
// Deploy COM verify_jwt (chamada sempre da cliente logada).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createPixPayment, getPayment, isValidCpf } from "../_shared/mercadopago.ts";
import { buildInstallmentOptions, createCardOrder, getOrder } from "../_shared/pagarme.ts";
import {
  aplicarTroca,
  localDe,
  type Pedido,
  processarPagamentoTroca,
  REF_TROCA,
  snapshotTroca,
  validarTroca,
} from "../_shared/troca_cliente.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
const PAGARME_SECRET_KEY = Deno.env.get("PAGARME_SECRET_KEY") ?? "";
const MAX_INSTALLMENTS = Math.max(1, Math.min(12, Math.floor(Number(Deno.env.get("PAGARME_MAX_INSTALLMENTS")) || 12)));
const PIX_EXPIRA_MIN = 30;

const admin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function falha(error: string, message: string, status = 409) {
  return json({ ok: false, error, message }, status);
}

// deno-lint-ignore no-explicit-any
type Row = any;

function splitNome(nome: unknown): { first: string; last: string } {
  const partes = String(nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return { first: "Cliente", last: "Elarah" };
  return { first: partes[0], last: partes.slice(1).join(" ") || partes[0] };
}

function pedidoDe(payload: Record<string, unknown>): Pedido {
  return {
    experiencia_id: String(payload.experiencia_id ?? "").trim(),
    slot_id: payload.slot_id ? String(payload.slot_id).trim() : null,
    horario: payload.horario != null ? String(payload.horario).trim() : null,
  };
}

function mesmoPedido(a: unknown, b: Pedido): boolean {
  const p = (a && typeof a === "object") ? a as Pedido : null;
  return !!p && p.experiencia_id === b.experiencia_id &&
    (p.slot_id ?? null) === (b.slot_id ?? null) &&
    String(p.horario ?? "") === String(b.horario ?? "");
}

// Resposta pública de uma linha de troca (o que a tela da cliente precisa).
function situacao(linha: Row) {
  const dados = (linha.pagamento_dados && typeof linha.pagamento_dados === "object") ? linha.pagamento_dados : {};
  return {
    ok: true,
    troca_id: linha.id,
    status: linha.status,
    metodo: linha.pagamento_metodo ?? null,
    valor_centavos: linha.pagamento_valor_centavos ?? null,
    diferenca_centavos: linha.diferenca_centavos ?? null,
    expira_em: linha.pagamento_expira_em ?? null,
    qr_code: dados.qr_code ?? null,
    qr_code_base64: dados.qr_code_base64 ?? null,
    ticket_url: dados.ticket_url ?? null,
    reserva: { experiencia_nome: linha.para_experiencia_nome, data: linha.para_data, horario: linha.para_horario },
    observacao: linha.observacao ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!admin) {
    console.error("[cliente-trocar] env ausente (SUPABASE_URL/SERVICE_ROLE)");
    return json({ ok: false, error: "server_misconfigured" }, 500);
  }

  // ===== Quem está chamando =====
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return falha("missing_token", "Faça login pra trocar sua reserva.", 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller?.id) return falha("invalid_token", "Sua sessão expirou. Entre de novo.", 401);

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  const acao = String(payload.acao ?? "trocar");

  // ===== Situação do pagamento da diferença =====
  if (acao === "status") {
    const trocaId = String(payload.troca_id ?? "").trim();
    if (!trocaId) return json({ ok: false, error: "missing_troca_id" }, 400);
    const { data: linhaRow } = await admin.from("trocas_reserva").select("*").eq("id", trocaId).maybeSingle();
    let linha = linhaRow as Row;
    if (!linha || linha.user_id !== caller.id) return falha("troca_not_found", "Não encontramos essa troca.", 404);
    if (payload.verificar === true && linha.status === "aguardando_pagamento" && linha.pagamento_id) {
      let resultado: "aprovado" | "recusado" | null = null;
      let valor: number | null = null;
      if (linha.pagamento_metodo === "pix" && MP_ACCESS_TOKEN) {
        const r = await getPayment(MP_ACCESS_TOKEN, linha.pagamento_id);
        const st = String(r.payment?.status ?? "");
        if (st === "approved" || st === "authorized") {
          resultado = "aprovado";
          valor = Math.round(Number(r.payment?.transaction_amount ?? 0) * 100) || null;
        } else if (st === "rejected" || st === "cancelled") resultado = "recusado";
      } else if (linha.pagamento_metodo === "cartao" && PAGARME_SECRET_KEY) {
        const o = await getOrder(PAGARME_SECRET_KEY, linha.pagamento_id) as Row;
        const st = String(o?.status ?? "");
        if (st === "paid") resultado = "aprovado";
        else if (st === "failed" || st === "canceled") resultado = "recusado";
      }
      if (resultado) {
        await processarPagamentoTroca(admin, trocaId, resultado, {
          valorCentavos: valor, pagamentoId: linha.pagamento_id, logTag: "cliente-trocar/status",
        });
        const { data: nova } = await admin.from("trocas_reserva").select("*").eq("id", trocaId).maybeSingle();
        if (nova) linha = nova;
      }
    }
    return json(situacao(linha));
  }

  const bookingId = String(payload.booking_id ?? "").trim();
  if (!bookingId) return json({ ok: false, error: "missing_booking_id" }, 400);

  // ===== Reserva: é dela =====
  const { data: booking, error: readErr } = await admin
    .from("bookings").select("*, experiences(imagem)").eq("id", bookingId).maybeSingle();
  if (readErr) return json({ ok: false, error: "db_error", detail: readErr.message }, 500);
  const bk = booking as Row;
  if (!bk || bk.user_id !== caller.id) {
    return falha("booking_not_found", "Não encontramos essa reserva na sua conta.", 404);
  }
  const meta: Record<string, unknown> = (bk.metadata && typeof bk.metadata === "object") ? { ...bk.metadata } : {};
  const qty = Math.max(1, Number(bk.quantidade) || 1);

  // ===== Pedido de reembolso: só registra =====
  if (acao === "reembolso") {
    if (bk.status !== "pago") return falha("booking_not_paid", "Só dá pra pedir reembolso de reservas confirmadas.");
    const { data: jaExiste } = await admin
      .from("trocas_reserva").select("id")
      .eq("booking_id", bookingId).eq("tipo", "reembolso").is("resolvido_at", null)
      .limit(1);
    if (Array.isArray(jaExiste) && jaExiste.length) return json({ ok: true, ja_registrado: true });
    const { data: expAtual } = bk.experiencia_id
      ? await admin.from("experiences").select("fornecedor_nome, endereco, bairro").eq("id", bk.experiencia_id).maybeSingle()
      : { data: null };
    const { error: insErr } = await admin.from("trocas_reserva").insert({
      tipo: "reembolso",
      booking_id: bookingId,
      user_id: caller.id,
      cliente_nome: bk.nome ?? null,
      cliente_email: bk.email ?? caller.email ?? null,
      cliente_telefone: (meta.telefone_digits as string | undefined) ?? bk.telefone ?? null,
      quantidade: qty,
      de_experiencia_id: bk.experiencia_id ?? null,
      de_experiencia_nome: bk.experiencia_nome ?? null,
      de_data: bk.data ?? null,
      de_horario: bk.horario ?? null,
      de_fornecedor_nome: bk.fornecedor_nome ?? (expAtual as Row)?.fornecedor_nome ?? null,
      de_endereco: localDe(expAtual as Row, meta) || null,
      motivo: String(payload.motivo ?? "").slice(0, 500) || null,
    });
    if (insErr) {
      console.error("[cliente-trocar] erro registrando reembolso", bookingId, insErr.message);
      return json({ ok: false, error: "insert_failed" }, 500);
    }
    return json({ ok: true });
  }

  if (acao !== "trocar" && acao !== "cotar") return json({ ok: false, error: "acao_invalida" }, 400);

  // ===== Confere a troca =====
  const pedido = pedidoDe(payload);
  const v = await validarTroca(admin, bk, pedido);
  if (!v.ok) return json({ ok: false, error: v.error, message: v.message }, v.status);
  const ctx = v.ctx;
  const dif = ctx.diferencaCentavos;

  if (acao === "cotar") {
    return json({
      ok: true,
      diferenca_centavos: dif,
      parcelas: dif > 0 ? buildInstallmentOptions(dif, MAX_INSTALLMENTS) : [],
    });
  }

  // ===== Sem diferença: troca na hora =====
  if (dif <= 0) {
    const r = await aplicarTroca(admin, ctx, {
      callerId: caller.id, callerEmail: caller.email ?? null, logTag: "cliente-trocar",
    });
    if (!r.ok) return json({ ok: false, error: r.error, message: r.message }, r.status);
    return json({ ok: true, status: "aplicada", modalidade: r.modalidade, reserva: r.reserva, confirmacao: r.confirmacao });
  }

  // ===== Com diferença: cobra primeiro =====
  const pg = (payload.pagamento && typeof payload.pagamento === "object") ? payload.pagamento as Record<string, unknown> : null;
  const metodo = pg ? String(pg.metodo ?? "") : "";
  if (metodo !== "pix" && metodo !== "cartao") {
    return json({ ok: false, error: "pagar_diferenca", diferenca_centavos: dif, message: "Essa troca tem diferença a pagar." }, 402);
  }
  const cpf = String(pg!.cpf ?? "").replace(/\D+/g, "");
  if (!isValidCpf(cpf)) return falha("cpf_invalido", "Confira o CPF.", 400);
  const email = String(bk.email ?? caller.email ?? "").trim();
  if (!email) return falha("sem_email", "Sua reserva está sem e-mail. Fale com a gente no WhatsApp.", 400);

  // Pix pendente pro MESMO pedido e ainda válido → devolve o mesmo QR em vez
  // de gerar outra cobrança.
  const agora = Date.now();
  const { data: pendentes } = await admin.from("trocas_reserva").select("*")
    .eq("booking_id", bookingId).eq("tipo", "troca").eq("status", "aguardando_pagamento");
  for (const p of (Array.isArray(pendentes) ? pendentes : []) as Row[]) {
    const valido = p.pagamento_expira_em && new Date(p.pagamento_expira_em).getTime() > agora + 60_000;
    if (metodo === "pix" && p.pagamento_metodo === "pix" && valido && mesmoPedido(p.pedido, pedido)) {
      return json(situacao(p));
    }
  }
  // Outras tentativas em aberto saem da frente (se alguma for paga mesmo
  // assim, o webhook ainda processa — e, se a reserva já tiver sido trocada,
  // a linha vira 'pago_sem_aplicar' pra Elarah devolver).
  if (Array.isArray(pendentes) && pendentes.length) {
    await admin.from("trocas_reserva").update({ status: "cancelada" })
      .in("id", (pendentes as Row[]).map((p) => p.id)).eq("status", "aguardando_pagamento");
  }

  const snap = snapshotTroca(ctx);
  const nome = splitNome(bk.nome);
  const descricao = ("Diferença de troca · " + (ctx.novaExp.nome ?? "Experiência")).slice(0, 64);

  if (metodo === "pix") {
    if (!MP_ACCESS_TOKEN) return json({ ok: false, error: "pix_indisponivel", message: "Pix indisponível agora. Tente o cartão." }, 503);
    const { data: ins, error: insErr } = await admin.from("trocas_reserva").insert({
      tipo: "troca", status: "aguardando_pagamento", booking_id: bookingId, user_id: caller.id,
      ...snap, pedido, diferenca_centavos: dif, pagamento_metodo: "pix", pagamento_valor_centavos: dif,
      pagamento_status: "pendente",
    }).select("*").single();
    if (insErr || !ins) {
      console.error("[cliente-trocar] erro criando troca pendente", bookingId, insErr?.message);
      return json({ ok: false, error: "insert_failed", message: "Não conseguimos iniciar o pagamento. Tente de novo." }, 500);
    }
    const r = await createPixPayment(MP_ACCESS_TOKEN, {
      transactionAmountCents: dif,
      description: descricao,
      externalReference: REF_TROCA + ins.id,
      payerEmail: email,
      payerFirstName: nome.first,
      payerLastName: nome.last,
      payerCpf: cpf,
      expiresInMinutes: PIX_EXPIRA_MIN,
      notificationUrl: SUPABASE_URL.replace(/\/+$/, "") + "/functions/v1/mp-webhook",
      idempotencyKey: ins.id,
      items: [{
        id: String(ctx.novaExp.id), title: descricao, description: descricao,
        categoryId: "entertainment", quantity: 1, unitPriceCents: dif,
      }],
    });
    const tx = r.payment?.point_of_interaction?.transaction_data;
    if (!r.ok || !r.payment || (!tx?.qr_code && !tx?.ticket_url)) {
      console.error("[cliente-trocar] Pix da diferença falhou", bookingId, r.errorStatus, JSON.stringify(r.errorBody ?? null));
      await admin.from("trocas_reserva").update({ status: "erro_pagamento" }).eq("id", ins.id);
      return json({ ok: false, error: "pix_falhou", message: "Não conseguimos gerar o Pix agora. Tente de novo ou use o cartão." }, 502);
    }
    const expira = r.payment.date_of_expiration ?? new Date(agora + PIX_EXPIRA_MIN * 60_000).toISOString();
    const { data: upd } = await admin.from("trocas_reserva").update({
      pagamento_id: String(r.payment.id),
      pagamento_expira_em: expira,
      pagamento_dados: { qr_code: tx?.qr_code ?? null, qr_code_base64: tx?.qr_code_base64 ?? null, ticket_url: tx?.ticket_url ?? null },
    }).eq("id", ins.id).select("*").single();
    return json(situacao(upd ?? ins));
  }

  // ===== Cartão (Pagar.me, com a taxa da parcela) =====
  if (!PAGARME_SECRET_KEY) return json({ ok: false, error: "cartao_indisponivel", message: "Cartão indisponível agora. Tente o Pix." }, 503);
  const cardToken = String(pg!.card_token ?? "").trim();
  if (!cardToken) return falha("card_token_ausente", "Confira os dados do cartão.", 400);
  const parcelas = Math.max(1, Math.floor(Number(pg!.installments) || 1));
  const opcao = buildInstallmentOptions(dif, MAX_INSTALLMENTS).find((o) => o.number === parcelas);
  if (!opcao) return falha("parcelas_invalidas", "Escolha uma opção de parcelamento válida.", 400);
  const addr = (pg!.address && typeof pg!.address === "object") ? pg!.address as Record<string, unknown> : {};
  const cep = String(addr.zip_code ?? "").replace(/\D+/g, "");
  const line1 = String(addr.line_1 ?? "").trim();
  const city = String(addr.city ?? "").trim();
  const uf = String(addr.state ?? "").trim().toUpperCase();
  if (cep.length !== 8 || !line1 || !city || !/^[A-Z]{2}$/.test(uf)) {
    return falha("endereco_invalido", "Confira o endereço de cobrança do cartão.", 400);
  }
  const tel = String((meta.telefone_digits as string | undefined) ?? bk.telefone ?? "").replace(/\D+/g, "").replace(/^55(?=\d{10,11}$)/, "");

  const { data: ins, error: insErr } = await admin.from("trocas_reserva").insert({
    tipo: "troca", status: "aguardando_pagamento", booking_id: bookingId, user_id: caller.id,
    ...snap, pedido, diferenca_centavos: dif, pagamento_metodo: "cartao",
    pagamento_valor_centavos: opcao.total, pagamento_parcelas: parcelas, pagamento_status: "pendente",
  }).select("*").single();
  if (insErr || !ins) {
    console.error("[cliente-trocar] erro criando troca pendente", bookingId, insErr?.message);
    return json({ ok: false, error: "insert_failed", message: "Não conseguimos iniciar o pagamento. Tente de novo." }, 500);
  }
  const card = await createCardOrder(PAGARME_SECRET_KEY, {
    amountCents: opcao.total,
    installments: parcelas,
    cardToken,
    bookingId: REF_TROCA + ins.id,
    description: descricao,
    customer: {
      name: String(bk.nome ?? "Cliente Elarah"),
      email,
      cpf,
      phone: tel.length >= 10 ? { areaCode: tel.slice(0, 2), number: tel.slice(2) } : undefined,
      address: { zipCode: cep, line1, city, state: uf, country: "BR" },
    },
    statementDescriptor: "ELARAH",
    itemCode: String(ctx.novaExp.id),
    idempotencyKey: ins.id,
  });
  const orderStatus = String(card.orderStatus || "");
  const txStatus = String(card.transactionStatus || "");
  const recusadoEmissor = txStatus === "not_authorized" || txStatus === "refused";
  const falhou = !card.ok || recusadoEmissor || orderStatus === "failed" || orderStatus === "canceled" ||
    txStatus === "with_error" || txStatus === "error_on_sending_to_acquirer";
  if (falhou) {
    console.info("[cliente-trocar] cartão da diferença recusado", bookingId, "order=" + orderStatus, "tx=" + txStatus,
      card.ok ? "" : JSON.stringify(card.errorBody ?? null));
    await admin.from("trocas_reserva").update({
      status: "pagamento_recusado", pagamento_status: "recusado", pagamento_id: card.orderId ?? null,
    }).eq("id", ins.id);
    return json({
      ok: false,
      error: "cartao_recusado",
      message: recusadoEmissor
        ? "Pagamento recusado pelo banco. Tente outro cartão ou pague no Pix."
        : "Não foi possível processar o pagamento. Confira os dados ou tente o Pix.",
    }, 402);
  }
  await admin.from("trocas_reserva").update({ pagamento_id: card.orderId ?? null }).eq("id", ins.id);
  // Aprovou na hora → aplica já (o webhook que chegar depois é ignorado).
  if (orderStatus === "paid") {
    await processarPagamentoTroca(admin, ins.id, "aprovado", {
      valorCentavos: opcao.total, pagamentoId: card.orderId ?? null, logTag: "cliente-trocar/cartao",
    });
  }
  const { data: final } = await admin.from("trocas_reserva").select("*").eq("id", ins.id).maybeSingle();
  return json(situacao(final ?? ins));
});
