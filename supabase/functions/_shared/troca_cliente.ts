// =============================================================
// ELARAH — Troca de reserva feita pela própria cliente
// -------------------------------------------------------------
// Usado por:
//   * cliente-trocar-reserva  (a cliente escolhe a data/experiência nova e,
//                              se for mais cara, paga a diferença)
//   * mp-webhook              (Pix da diferença aprovado → aplica a troca)
//   * pagarme-webhook         (cartão da diferença aprovado → aplica a troca)
//
// DOIS CAMINHOS, UMA TROCA
//   1. Sem diferença a pagar → validarTroca + aplicarTroca na hora.
//   2. Com diferença → a troca fica em trocas_reserva com
//      status='aguardando_pagamento' e o pedido (experiência/turma) em
//      `pedido`. O pagamento carrega a referência "TROCA-<id da linha>".
//      Quando o webhook confirma, processarPagamentoTroca revalida (sem o
//      prazo e o preço, que já foram conferidos na hora de cobrar) e aplica.
//
// A VAGA durante o pagamento: NÃO é segurada. A varredura de vagas de 10 em
// 10 min (reconcile_all_vagas) conta só reservas, então um "segurar" fora de
// uma reserva seria desfeito sozinho. A vaga é conferida antes de cobrar e
// segurada quando o pagamento aprova; se esgotou nesse meio-tempo, a linha
// vira 'pago_sem_vaga' e aparece na aba do painel pra Elarah resolver.
// =============================================================

import { effectiveCutoffHours } from "./booking_guard.ts";
import { carregarDescontoGeral, precoFinalCentavos, precoLabelBR } from "./promo.ts";
import { prazoRemarcacaoPorCategoria, PRAZO_REMARCACAO_PADRAO } from "./booking_policy.ts";
import { sendEmail } from "./email.ts";
import {
  enviarConfirmacaoReagendamento,
  liberarVaga,
  segurarVaga,
} from "./reagendamento.ts";

// deno-lint-ignore no-explicit-any
type SB = any;
// deno-lint-ignore no-explicit-any
type Row = any;

// Prefixo da referência do pagamento da diferença (external_reference no
// Mercado Pago, order.code no Pagar.me). "TROCA-" + uuid = 42 caracteres.
export const REF_TROCA = "TROCA-";

// ===== Datas (fuso fixo de SP, UTC-3, sem horário de verão) =====

function parseStartHour(raw: unknown): { hh: number; mm: number } | null {
  const head = String(raw ?? "").split(/[–—\-]/)[0].trim();
  const m = head.match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})/i);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = m[2] ? Number(m[2]) : 0;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

// "24/09" ou "24/09/2026" + "19h00 – 21h00" → timestamp. Sem ano: ano
// corrente, e se isso cair mais de 30 dias no passado, o ano seguinte
// (mesma regra de "Minhas compras" pra reserva de dezembro pra janeiro).
export function deriveTs(data: unknown, horario: unknown, nowMs: number): number | null {
  const m = String(data ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const h = parseStartHour(horario) ?? { hh: 0, mm: 0 };
  const pad = (n: number) => String(n).padStart(2, "0");
  const build = (y: number) =>
    new Date(`${y}-${pad(month)}-${pad(day)}T${pad(h.hh)}:${pad(h.mm)}:00-03:00`).getTime();
  if (m[3]) {
    const y = Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3]);
    const t = build(y);
    return Number.isFinite(t) ? t : null;
  }
  const y = new Date(nowMs - 3 * 3600_000).getUTCFullYear();
  let t = build(y);
  if (Number.isFinite(t) && nowMs - t > 30 * 86400_000) t = build(y + 1);
  return Number.isFinite(t) ? t : null;
}

function tsDeTimestamptz(v: unknown): number | null {
  if (!v) return null;
  const t = new Date(String(v)).getTime();
  return Number.isFinite(t) ? t : null;
}

// Rótulo "DD/MM" (fuso de SP) de um timestamp.
function ddmm(ts: number): string {
  const sp = new Date(ts - 3 * 3600_000);
  return String(sp.getUTCDate()).padStart(2, "0") + "/" + String(sp.getUTCMonth() + 1).padStart(2, "0");
}

function normHorario(v: unknown): string {
  return String(v ?? "").replace(/[–—]/g, "-").replace(/[\s-]/g, "").toLowerCase();
}

// ===== Preço de tabela (mesma leitura BR do booking_guard) =====
export function parsePrecoToCents(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).replace(/\s/g, "").replace(/^R\$/i, "").replace(/^[^\d]+/, "");
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/\./g, "");
  const num = Number(normalized);
  if (!isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function temVariacoes(exp: Row): boolean {
  const items = Array.isArray(exp.variant_items) ? exp.variant_items : [];
  const opts = Array.isArray(exp.variant_options) ? exp.variant_options : [];
  return items.length > 0 || opts.filter((o: unknown) => String(o ?? "").trim()).length > 0;
}

function isKit(exp: Row): boolean {
  const cat = String(exp.categoria ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return cat.includes("em casa");
}

// Quanto a cliente PAGOU DE VERDADE por pessoa (centavos): já com
// promoção, cupom e crédito descontados, e SEM a taxa do cartão (que ficou
// com a operadora). É a base das duas contas da troca — usar o preço de
// tabela aqui faria a Elarah devolver desconto que a cliente nunca pagou.
//   1. total_after_discount_centavos  (Pix / cartão Mercado Pago)
//   2. amount_before_grossup_centavos (cartão Pagar.me, antes da taxa)
//   3. amount_total − taxa do cartão   (Stripe / demais)
// E nunca acima do preço unitário gravado na compra (quando existe).
// null = não dá pra saber (reserva sem nenhum valor gravado); 0 = pagou nada.
export function pagoPorPessoa(bk: Row, meta: Record<string, unknown>, qty: number): number | null {
  const q = Math.max(1, qty || 1);
  // 0 é válido (compra paga inteira com cupom/crédito: não pagou nada).
  const n = (v: unknown) => {
    if (v == null || v === "") return null;
    const x = Number(v);
    return Number.isFinite(x) && x >= 0 ? x : null;
  };
  let total = n(meta.total_after_discount_centavos) ?? n(meta.amount_before_grossup_centavos);
  if (total == null) {
    const bruto = n(bk.amount_total);
    if (bruto != null) total = Math.max(0, bruto - (n(meta.card_fee_total_centavos) ?? 0));
  }
  // Teto só com o preço unitário GRAVADO na compra (o rótulo pode ser o
  // preço base de uma variação mais cara, tipo "Dupla").
  const unit = n(meta.unit_price_centavos);
  if (total == null) return unit ?? parsePrecoToCents(bk.preco_label) ?? null;
  const porPessoa = Math.round(total / q);
  return unit != null && unit > 0 ? Math.min(unit, porPessoa) : porPessoa;
}

function chaveTexto(v: unknown): string {
  return String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function fornecedorKey(nome: unknown): string {
  return String(nome ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function localDe(exp: Row | null, meta: Record<string, unknown>): string {
  const end = String((exp && exp.endereco) || meta.endereco || "").trim();
  const bairro = String((exp && exp.bairro) || meta.bairro || "").trim();
  return end && bairro ? end + " — " + bairro : (end || bairro);
}

// Mesmo cálculo do "Editar reserva" do painel (computeFinancials em
// admin.js): repasse fixo por pessoa quando preenchido, senão percentual
// (70% se vazio). Sem valor cheio cadastrado → null (não recalcula).
function financeiro(exp: Row, qty: number) {
  if (exp.valor_cheio_centavos == null) return null;
  const cheio = (Number(exp.valor_cheio_centavos) || 0) * qty;
  const pct = exp.percentual_repasse != null && Number.isFinite(Number(exp.percentual_repasse))
    ? Number(exp.percentual_repasse)
    : 70;
  const fixo = exp.valor_repasse_fixo_centavos != null && Number.isFinite(Number(exp.valor_repasse_fixo_centavos))
    ? Number(exp.valor_repasse_fixo_centavos)
    : null;
  const repasse = fixo != null ? fixo * qty : Math.round(cheio * (pct / 100));
  return {
    cheio,
    repasse,
    comissao: Math.max(0, cheio - repasse),
    shareType: fixo != null ? "fixed" : "percent",
    shareValue: fixo != null ? fixo : pct,
  };
}

// ===== Validação =====

export interface Pedido {
  experiencia_id: string;
  slot_id: string | null;
  horario: string | null;
  // Preço por pessoa cobrado na hora do pagamento da diferença (fica
  // gravado no pedido; a aprovação usa este, não o do catálogo depois).
  preco_unit?: number | null;
}

export interface TrocaCtx {
  bk: Row;
  meta: Record<string, unknown>;
  qty: number;
  expAtual: Row | null;
  novaExp: Row;
  mesmaExp: boolean;
  slotIdNovo: string | null;
  novaData: string;
  novoHorario: string;
  // Diferença a pagar (total da reserva, em centavos). 0 = troca direta.
  diferencaCentavos: number;
  // Preço por pessoa cobrado hoje pela experiência nova (com promoção).
  precoNovoUnit: number | null;
  // Nova mais BARATA: quanto sobra pra cliente (crédito ou reembolso Pix).
  sobraCentavos: number;
}

// O que fazer com a sobra quando a nova é mais barata.
//   credito → cupom de valor fixo, uso único, 90 dias (tabela coupons — não
//             entra como receita nova na contabilidade, vira desconto).
//   pix     → a Elarah devolve por Pix em até 72h (fica pendente na aba).
export interface Devolucao {
  tipo: "credito" | "pix";
  chavePix?: string | null;
  titular?: string | null; // nome do titular da conta que recebe o Pix
}
export const CREDITO_DIAS = 90;
export const REEMBOLSO_PIX_HORAS = 72;

function gerarCodigoCredito(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alfabeto[bytes[i] % alfabeto.length];
  return "CREDITO-" + out;
}

function brl(c: number): string {
  return "R$ " + (c / 100).toFixed(2).replace(".", ",");
}

function dataBR(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear();
}

export type Falha = { ok: false; error: string; message: string; status: number };
export type Resultado<T> = ({ ok: true } & T) | Falha;

function falha(error: string, message: string, status = 409): Falha {
  return { ok: false, error, message, status };
}

// Confere tudo que a troca exige. `pagamentoConfirmado` é o caminho do
// webhook: a cliente já pagou a diferença, então prazo, preço e
// encerramento de vendas (conferidos na hora de cobrar) não barram mais —
// só o que tornaria a troca impossível (reserva mudou, turma sumiu).
export async function validarTroca(
  sb: SB,
  bk: Row,
  pedido: Pedido,
  opts: { pagamentoConfirmado?: boolean; diferencaPaga?: number } = {},
): Promise<Resultado<{ ctx: TrocaCtx }>> {
  const now = Date.now();
  if (bk.status !== "pago") return falha("booking_not_paid", "Só dá pra alterar reservas confirmadas.");
  const meta: Record<string, unknown> = (bk.metadata && typeof bk.metadata === "object") ? { ...bk.metadata } : {};
  const qty = Math.max(1, Number(bk.quantidade) || 1);

  if (bk.aguardando_experiencia === true || meta.aguardando_experiencia_vaga_liberada === true) {
    return falha("aguardando_experiencia", "Essa reserva já está com a equipe da Elarah. Fale com a gente no WhatsApp.");
  }
  // Remarcação pela conta vale UMA vez por reserva.
  if (meta.troca_cliente_feita_at) {
    return falha("ja_remarcada", "Você já usou sua remarcação pela conta. Pra mudar de novo, fale com a gente no WhatsApp.");
  }

  const { data: expAtualRow } = bk.experiencia_id
    ? await sb.from("experiences").select("*").eq("id", bk.experiencia_id).maybeSingle()
    : { data: null };
  const expAtual = expAtualRow as Row | null;
  if (expAtual && isKit(expAtual)) {
    return falha("kit", "Kits não entram na troca. Fale com a gente no WhatsApp.");
  }

  // Prazo da reserva atual.
  if (!opts.pagamentoConfirmado) {
    let inicioAtual: number | null = null;
    if (bk.slot_id) {
      const { data: slotAtual } = await sb
        .from("experience_slots").select("event_at").eq("id", bk.slot_id).maybeSingle();
      inicioAtual = tsDeTimestamptz((slotAtual as Row)?.event_at);
    }
    if (inicioAtual == null) inicioAtual = deriveTs(bk.data, bk.horario, now);
    if (inicioAtual == null) {
      return falha("sem_data", "Não conseguimos identificar a data dessa reserva. Fale com a gente no WhatsApp.");
    }
    const horasCongeladas = Number(meta.politica_remarcacao_horas);
    const prazoHoras = Number.isFinite(horasCongeladas) && horasCongeladas > 0
      ? horasCongeladas
      : Math.max(PRAZO_REMARCACAO_PADRAO.horas, prazoRemarcacaoPorCategoria(expAtual?.categoria).horas);
    if (now > inicioAtual - prazoHoras * 3600_000) {
      return falha("prazo_encerrado", "O prazo pra trocar sem custo já passou. Fale com a gente no WhatsApp.");
    }
  }

  // Experiência nova.
  const novaExpId = String(pedido.experiencia_id ?? "").trim();
  if (!novaExpId) return falha("missing_experiencia_id", "Escolha a nova experiência.", 400);
  const { data: novaExpRow, error: expErr } = await sb
    .from("experiences").select("*").eq("id", novaExpId).maybeSingle();
  if (expErr) return falha("db_error", "Erro ao buscar a experiência. Tente de novo.", 500);
  const novaExp = novaExpRow as Row;
  if (!novaExp || novaExp.is_active === false || novaExp.arquivada === true) {
    return falha("experiencia_indisponivel", "Essa experiência não está mais disponível.");
  }
  const mesmaExp = novaExp.id === bk.experiencia_id;
  // Só experiências com DATA marcada entram na troca. Agendamento livre
  // (voucher, horario_funcionamento) fica com a Elarah no WhatsApp.
  if (novaExp.horario_funcionamento && String(novaExp.horario_funcionamento).trim()) {
    return falha("agendamento_livre", "Essa experiência tem agendamento direto com a Elarah. Fale com a gente no WhatsApp.");
  }
  let diferencaCentavos = 0;
  let sobraCentavos = 0;
  let precoNovoUnit: number | null = null;
  // "Gêmea": outra ficha com o MESMO nome e a MESMA parceira (a mesma aula
  // cadastrada várias vezes, uma data em cada). Pra cliente é a mesma
  // experiência → nunca tem diferença, nem a pagar nem a receber.
  const gemea = !mesmaExp && !!expAtual &&
    chaveTexto(novaExp.nome) === chaveTexto(expAtual.nome) &&
    fornecedorKey(novaExp.fornecedor_nome) === fornecedorKey(expAtual.fornecedor_nome);
  if (!mesmaExp) {
    if (isKit(novaExp)) return falha("kit", "Kits não entram na troca. Fale com a gente no WhatsApp.");
    if (temVariacoes(novaExp)) {
      return falha("tem_variacoes", "Essa experiência tem opções pra escolher. Fale com a gente no WhatsApp pra trocar por ela.");
    }
  }
  if (opts.pagamentoConfirmado) {
    // Diferença JÁ PAGA: nada de recalcular preço (o catálogo pode ter
    // mudado desde a cobrança) — nem cobrar de novo, nem gerar sobra.
    diferencaCentavos = opts.diferencaPaga ?? 0;
    precoNovoUnit = Number(pedido.preco_unit) || null;
  } else if (!mesmaExp && !gemea) {
    // A PAGAR  = o que o site cobra HOJE pela nova (com a promoção no ar,
    //            igual ao checkout) − o que a cliente PAGOU por pessoa.
    // A RECEBER = o que ela PAGOU − o preço CHEIO da nova (sem promoção).
    //            Promoção nunca vira crédito nem Pix: quem comprou antes da
    //            campanha não "resgata" o desconto trocando de experiência.
    // Entre um e outro (nova mais cara só por causa da promoção sair, ou
    // mais barata só por causa da promoção) → troca sem diferença.
    // O que ela pagou = metadata.unit_price_centavos (gravado no checkout,
    // já com promoção); reserva antiga sem o campo cai no rótulo.
    const tabelaNova = parsePrecoToCents(novaExp.preco);
    const precoNovo = tabelaNova
      ? precoFinalCentavos(tabelaNova, await carregarDescontoGeral(sb), qty, new Date(), novaExp.categoria ?? null).cents
      : null;
    const precoAntigo = pagoPorPessoa(bk, meta, qty);
    precoNovoUnit = precoNovo;
    // precoAntigo = 0 é válido (compra paga inteira com cupom/crédito).
    if (!precoNovo || !tabelaNova || precoAntigo == null) {
      return falha("preco_invalido", "Não conseguimos calcular o valor dessa troca. Fale com a gente no WhatsApp.");
    }
    if (precoNovo > precoAntigo) diferencaCentavos = (precoNovo - precoAntigo) * qty;
    else if (tabelaNova < precoAntigo) sobraCentavos = (precoAntigo - tabelaNova) * qty;
  }

  // Turma nova: ativa, à venda e com vaga.
  const cutoffH = effectiveCutoffHours(novaExp.categoria, novaExp.cutoff_hours);
  const slotIdNovo = pedido.slot_id ? String(pedido.slot_id).trim() : null;
  let novaData: string;
  let novoHorario: string;
  let inicioNovo: number | null;
  if (slotIdNovo) {
    const { data: slotRow } = await sb
      .from("experience_slots")
      .select("id, experience_id, data, horario, vagas_total, vagas_restantes, event_at, is_active")
      .eq("id", slotIdNovo).maybeSingle();
    const sl = slotRow as Row;
    if (!sl || sl.experience_id !== novaExp.id || sl.is_active === false) {
      return falha("turma_indisponivel", "Essa data não está mais disponível. Escolha outra.");
    }
    inicioNovo = tsDeTimestamptz(sl.event_at) ?? deriveTs(sl.data, sl.horario, now);
    if (inicioNovo == null) return falha("turma_indisponivel", "Essa data não está mais disponível. Escolha outra.");
    if (sl.vagas_total != null && (sl.vagas_restantes == null || Number(sl.vagas_restantes) < qty)) {
      return falha("sem_vaga", "Essa data não tem mais vaga" + (qty > 1 ? " pra " + qty + " pessoas" : "") + ". Escolha outra.");
    }
    novaData = String(sl.data ?? "").trim() || ddmm(inicioNovo);
    novoHorario = String(sl.horario ?? "").trim();
  } else {
    // Experiência sem turmas cadastradas: data e horário da própria
    // experiência (um evento só). Se ela tem turmas ativas, exige slot_id.
    const { data: ativas } = await sb
      .from("experience_slots").select("id").eq("experience_id", novaExp.id).eq("is_active", true).limit(1);
    if (Array.isArray(ativas) && ativas.length) {
      return falha("turma_indisponivel", "Escolha uma das datas disponíveis.");
    }
    const horarios: string[] = (Array.isArray(novaExp.horarios) ? novaExp.horarios : [])
      .map((h: unknown) => String(h ?? "").trim()).filter(Boolean);
    if (novaExp.horario) horarios.push(String(novaExp.horario).trim());
    const escolhido = horarios.find((h) => normHorario(h) === normHorario(pedido.horario));
    if (!escolhido) return falha("turma_indisponivel", "Esse horário não está disponível. Escolha outro.");
    novaData = String(novaExp.data ?? "").trim();
    novoHorario = escolhido;
    inicioNovo = tsDeTimestamptz(novaExp.event_at) ?? deriveTs(novaData, novoHorario, now);
    if (inicioNovo == null) return falha("turma_indisponivel", "Essa experiência não tem data definida.");
    if (novaExp.vagas_total != null &&
      (novaExp.vagas_restantes == null || Number(novaExp.vagas_restantes) < qty)) {
      return falha("sem_vaga", "Essa experiência não tem mais vaga. Escolha outra.");
    }
  }
  if (!opts.pagamentoConfirmado && now + cutoffH * 3600_000 > inicioNovo) {
    return falha("turma_encerrada", "As vendas pra essa data já encerraram. Escolha outra.");
  }
  if (inicioNovo <= now) return falha("turma_passou", "Essa data já passou.");
  const slotIdAntigo: string | null = bk.slot_id ?? null;
  const mesmaTurma = mesmaExp && (
    slotIdNovo ? slotIdNovo === slotIdAntigo
      : (!slotIdAntigo && String(bk.data ?? "").trim() === novaData && normHorario(bk.horario) === normHorario(novoHorario))
  );
  if (mesmaTurma) return falha("mesma_data", "Essa já é a data da sua reserva.");

  return {
    ok: true,
    ctx: { bk, meta, qty, expAtual, novaExp, mesmaExp, slotIdNovo, novaData, novoHorario, diferencaCentavos, sobraCentavos, precoNovoUnit },
  };
}

// Snapshot "de → para" pra gravar em trocas_reserva.
export function snapshotTroca(ctx: TrocaCtx) {
  const { bk, meta, expAtual, novaExp, mesmaExp } = ctx;
  const deFornecedor = bk.fornecedor_nome ?? expAtual?.fornecedor_nome ?? null;
  const paraFornecedor = mesmaExp ? deFornecedor : (novaExp.fornecedor_nome ?? null);
  const modalidade = mesmaExp
    ? "mesma_experiencia"
    : (deFornecedor && fornecedorKey(deFornecedor) === fornecedorKey(paraFornecedor)
      ? "mesmo_parceiro"
      : "outro_parceiro");
  return {
    modalidade,
    cliente_nome: bk.nome ?? null,
    cliente_email: bk.email ?? null,
    cliente_telefone: (meta.telefone_digits as string | undefined) ?? bk.telefone ?? null,
    quantidade: ctx.qty,
    de_experiencia_id: bk.experiencia_id ?? null,
    de_experiencia_nome: bk.experiencia_nome ?? null,
    de_data: bk.data ?? null,
    de_horario: bk.horario ?? null,
    de_fornecedor_nome: deFornecedor,
    de_endereco: localDe(expAtual, meta) || null,
    para_experiencia_id: novaExp.id,
    para_experiencia_nome: novaExp.nome ?? bk.experiencia_nome ?? null,
    para_data: ctx.novaData,
    para_horario: ctx.novoHorario,
    para_fornecedor_nome: paraFornecedor,
    para_endereco: localDe(novaExp, mesmaExp ? meta : {}) || null,
  };
}

// ===== Aplicação =====

export interface PagamentoDiferenca {
  valorCentavos: number;       // o que a cliente pagou (cartão: com a taxa da parcela)
  diferencaCentavos: number;   // diferença de preço (sem taxa)
  metodo: "pix" | "cartao";
  pagamentoId: string | null;
  parcelas?: number | null;
}

// Move a vaga, atualiza a reserva, registra em trocas_reserva e manda a
// confirmação nova. `trocaId` = linha já criada (caminho com pagamento);
// sem ela, cria a linha aqui.
export async function aplicarTroca(
  sb: SB,
  ctx: TrocaCtx,
  opts: {
    callerId: string | null;
    callerEmail: string | null;
    trocaId?: string | null;
    pagamento?: PagamentoDiferenca | null;
    devolucao?: Devolucao | null;
    logTag: string;
  },
): Promise<Resultado<{ modalidade: string; confirmacao: unknown; reserva: Record<string, unknown>; credito?: Record<string, unknown> | null }>> {
  const { bk, meta, qty, novaExp, mesmaExp, slotIdNovo } = ctx;
  const bookingId = String(bk.id);
  const snap = snapshotTroca(ctx);

  // Vagas: segura a nova ANTES de soltar a antiga.
  let segurou = false;
  try {
    segurou = await segurarVaga(sb, slotIdNovo, slotIdNovo ? null : novaExp.id, qty);
  } catch (e) {
    console.error("[" + opts.logTag + "] falha ao segurar vaga", bookingId, String((e as { message?: string })?.message ?? e));
    return falha("vaga_erro", "Não conseguimos reservar a nova data agora. Tente de novo em instantes.", 500);
  }
  if (!segurou) return falha("sem_vaga", "Essa data acabou de esgotar. Escolha outra.");

  const slotIdAntigo: string | null = bk.slot_id ?? null;
  let vagaAntigaDevolvida = false;
  try {
    await liberarVaga(sb, slotIdAntigo, slotIdAntigo ? null : (bk.experiencia_id ?? null), qty);
    vagaAntigaDevolvida = true;
  } catch (e) {
    // Não trava a troca: a varredura de 10 em 10 min recalcula as vagas.
    console.error("[" + opts.logTag + "] falha ao devolver vaga antiga", bookingId, String((e as { message?: string })?.message ?? e));
  }

  const update: Record<string, unknown> = {
    experiencia_id: snap.para_experiencia_id,
    experiencia_nome: snap.para_experiencia_nome,
    data: snap.para_data,
    horario: snap.para_horario,
    slot_id: slotIdNovo,
    reminder_48h_sent_at: null,
    feedback_whatsapp_sent_at: null,
    // Botão "Avisar" da aba Compras volta a vermelho: a parceira ainda não
    // sabe da data nova (ou, se trocou de parceira, a nova nem sabe da reserva).
    fornecedor_avisado_at: null,
  };
  if (!mesmaExp) {
    update.fornecedor_nome = snap.para_fornecedor_nome;
    update.fornecedor_id = novaExp.created_by ?? null;
    const fin = financeiro(novaExp, qty);
    // Experiência nova sem valor cheio cadastrado: o repasse não é
    // recalculado — marca pra Elarah conferir o repasse da parceira nova.
    if (!fin) meta.troca_repasse_revisar = true;
    if (fin) {
      update.valor_cheio_centavos = fin.cheio;
      update.valor_repasse_centavos = fin.repasse;
      update.valor_comissao_centavos = fin.comissao;
    }
    // Snapshot de repasse: mesma regra do painel — só reescreve quando é de
    // UMA parceira (com rateio entre várias, a Elarah acerta à mão).
    const repAtual = Array.isArray(bk.repasses) ? bk.repasses : [];
    if (repAtual.length <= 1) {
      update.repasses = snap.para_fornecedor_nome && fin
        ? [{
          fornecedor_nome: snap.para_fornecedor_nome,
          share_type: fin.shareType,
          share_value: fin.shareValue,
          valor_centavos: fin.repasse,
        }]
        : null;
    } else {
      meta.troca_repasse_revisar = true;
    }
    meta.endereco = novaExp.endereco != null && String(novaExp.endereco).trim() ? String(novaExp.endereco).trim() : null;
    meta.bairro = novaExp.bairro != null && String(novaExp.bairro).trim() ? String(novaExp.bairro).trim() : null;
    // O prazo de remarcação passa a ser o da experiência nova.
    meta.politica_remarcacao_horas = prazoRemarcacaoPorCategoria(novaExp.categoria).horas;
  }
  const sobra = ctx.sobraCentavos > 0 ? ctx.sobraCentavos : 0;
  const devolucao: Devolucao | null = sobra > 0 ? (opts.devolucao ?? { tipo: "credito" }) : null;
  if (devolucao) {
    // Nova mais barata: a sobra sai da reserva (vira crédito ou volta por
    // Pix), então o total da reserva cai junto.
    update.preco_label = novaExp.preco ?? bk.preco_label;
    update.amount_total = Math.max(0, (Number(bk.amount_total) || 0) - sobra);
    // Passa a valer o que ficou pago: o de antes menos a sobra devolvida.
    const pagoAntes = pagoPorPessoa(bk, meta, qty) ?? 0;
    if (pagoAntes) meta.unit_price_centavos = Math.max(0, pagoAntes - Math.round(sobra / qty));
    meta.troca_devolucao = {
      tipo: devolucao.tipo,
      valor_centavos: sobra,
      chave_pix: devolucao.tipo === "pix" ? (devolucao.chavePix ?? null) : null,
      titular: devolucao.tipo === "pix" ? (devolucao.titular ?? null) : null,
      troca_id: opts.trocaId ?? null,
    };
  }
  if (opts.pagamento) {
    // Pagou a diferença: a reserva passa a valer a experiência nova. O
    // valor pago entra no total da reserva (a contabilidade soma daqui) e
    // o detalhe fica no metadata.
    update.preco_label = ctx.precoNovoUnit ? precoLabelBR(ctx.precoNovoUnit) : (novaExp.preco ?? bk.preco_label);
    // Próximas comparações (e o e-mail) partem do que ela passou a pagar.
    if (ctx.precoNovoUnit) meta.unit_price_centavos = ctx.precoNovoUnit;
    update.amount_total = (Number(bk.amount_total) || 0) + opts.pagamento.valorCentavos;
    meta.troca_diferenca = {
      diferenca_centavos: opts.pagamento.diferencaCentavos,
      pago_centavos: opts.pagamento.valorCentavos,
      metodo: opts.pagamento.metodo,
      pagamento_id: opts.pagamento.pagamentoId,
      parcelas: opts.pagamento.parcelas ?? null,
      troca_id: opts.trocaId ?? null,
    };
  }
  meta.reagendamento_seq = (Number(meta.reagendamento_seq) || 0) + 1;
  const agoraIso = new Date().toISOString();
  meta.troca_cliente_feita_at = agoraIso;
  const hist = Array.isArray(meta.reagendamento_history) ? meta.reagendamento_history.slice() : [];
  hist.push({
    at: agoraIso,
    by: opts.callerId,
    by_email: opts.callerEmail,
    origem: "cliente",
    from: { experiencia_id: snap.de_experiencia_id, data: snap.de_data, horario: snap.de_horario, quantidade: qty, slot_id: slotIdAntigo },
    to: { experiencia_id: snap.para_experiencia_id, data: snap.para_data, horario: snap.para_horario, quantidade: qty, slot_id: slotIdNovo },
    vaga_devolvida: vagaAntigaDevolvida,
    vaga_segurada: true,
    diferenca_paga_centavos: opts.pagamento?.valorCentavos ?? 0,
  });
  meta.reagendamento_history = hist;
  // Mesmo histórico que o "Editar reserva" do painel grava: é dele que a
  // aba Compras tira a mensagem "era dia X, passou pro dia Y" pra parceira.
  const editHist = Array.isArray(meta.admin_edit_history) ? meta.admin_edit_history.slice() : [];
  editHist.push({
    at: agoraIso,
    origem: "cliente",
    from: { nome: bk.nome, email: bk.email, experiencia_id: snap.de_experiencia_id, experiencia_nome: snap.de_experiencia_nome, data: snap.de_data, horario: snap.de_horario, quantidade: qty },
    to: { nome: bk.nome, email: bk.email, experiencia_id: snap.para_experiencia_id, experiencia_nome: snap.para_experiencia_nome, data: snap.para_data, horario: snap.para_horario, quantidade: qty },
  });
  meta.admin_edit_history = editHist;
  update.metadata = meta;

  // Trava otimista: só grava se a reserva não mudou desde a leitura. Dois
  // cliques seguidos (ou dois avisos do webhook) não movem a vaga duas vezes.
  let updQuery = sb.from("bookings").update(update).eq("id", bookingId);
  if (bk.updated_at) updQuery = updQuery.eq("updated_at", bk.updated_at);
  const { data: updRows, error: updErr } = await updQuery.select("id");
  const conflito = !updErr && (!Array.isArray(updRows) || updRows.length === 0);
  if (updErr || conflito) {
    console.error("[" + opts.logTag + "] erro ao salvar reserva", bookingId, updErr?.message ?? "conflito (reserva mudou no meio)");
    try { await liberarVaga(sb, slotIdNovo, slotIdNovo ? null : novaExp.id, qty); } catch (_e) { /* varredura corrige */ }
    if (vagaAntigaDevolvida) {
      try { await segurarVaga(sb, slotIdAntigo, slotIdAntigo ? null : (bk.experiencia_id ?? null), qty); } catch (_e) { /* varredura corrige */ }
    }
    return conflito
      ? falha("conflito", "Sua reserva acabou de ser alterada. Recarregue a página e confira.")
      : falha("update_failed", "Não conseguimos salvar a troca. Tente de novo.", 500);
  }

  // Registro pra aba "Trocas e reembolsos".
  const linha: Record<string, unknown> = {
    tipo: "troca",
    status: "aplicada",
    booking_id: bookingId,
    user_id: bk.user_id ?? opts.callerId,
    ...snap,
  };
  if (opts.pagamento) {
    linha.pago_at = agoraIso;
    linha.pagamento_status = "aprovado";
  }

  // Sobra: gera o cupom de crédito (ou registra o reembolso Pix pendente).
  let credito: Record<string, unknown> | null = null;
  if (devolucao) {
    linha.devolucao_tipo = devolucao.tipo;
    linha.devolucao_centavos = sobra;
    if (devolucao.tipo === "pix") {
      linha.reembolso_pix_chave = devolucao.chavePix ?? null;
      linha.reembolso_pix_titular = devolucao.titular ?? null;
      linha.reembolso_prazo = new Date(Date.now() + REEMBOLSO_PIX_HORAS * 3600_000).toISOString();
    } else {
      const validade = new Date(Date.now() + CREDITO_DIAS * 86400_000).toISOString();
      let codigo = "";
      let couponId: string | null = null;
      for (let tentativa = 0; tentativa < 3 && !couponId; tentativa++) {
        codigo = gerarCodigoCredito();
        const { data: cup, error: cupErr } = await sb.from("coupons").insert({
          code: codigo,
          nome: "Crédito de troca",
          descricao: "Crédito da troca da reserva " + bookingId.slice(-8).toUpperCase() + " (" + (bk.email ?? "") + ")",
          discount_type: "value",
          discount_value: sobra,
          valid_until: validade,
          max_uses: 1,
          is_active: true,
          metadata: { origem: "troca_cliente", booking_id: bookingId, email: bk.email ?? null, troca_id: opts.trocaId ?? null },
        }).select("id").single();
        if (!cupErr && cup) couponId = cup.id;
        else console.error("[" + opts.logTag + "] erro criando cupom de crédito", bookingId, cupErr?.message);
      }
      if (couponId) {
        credito = { codigo, valor_centavos: sobra, valido_ate: validade };
        linha.credito_codigo = codigo;
        linha.credito_expira_em = validade;
        meta.troca_devolucao = { ...(meta.troca_devolucao as Record<string, unknown>), codigo, valido_ate: validade };
        await sb.from("bookings").update({ metadata: meta }).eq("id", bookingId);
        if (bk.email) {
          try {
            await sendEmail({
              to: String(bk.email).trim(),
              subject: "Seu crédito Elarah de " + brl(sobra) + " 🎟",
              html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2b2420;">' +
                "<h2>Seu crédito na Elarah 🧡</h2>" +
                "<p>Oi" + (bk.nome ? ", " + String(bk.nome).split(" ")[0] : "") + "! Como a experiência nova custa menos, " +
                "a diferença virou crédito pra você usar no site.</p>" +
                '<p style="font-size:22px;font-weight:bold;letter-spacing:1px;background:#fff3ea;border-radius:10px;padding:14px;text-align:center;">' + codigo + "</p>" +
                "<p><strong>Valor:</strong> " + brl(sobra) + "<br><strong>Válido até:</strong> " + dataBR(validade) + "</p>" +
                "<p>É só colar o código no campo de cupom na hora de reservar. Vale pra uma compra.</p>" +
                "</div>",
            });
          } catch (e) {
            console.error("[" + opts.logTag + "] e-mail do crédito falhou", bookingId, String(e));
          }
        }
      } else {
        linha.observacao = "Crédito não foi gerado — criar o cupom à mão.";
      }
    }
  }
  const gravar = (l: Record<string, unknown>) => opts.trocaId
    ? sb.from("trocas_reserva").update(l).eq("id", opts.trocaId)
    : sb.from("trocas_reserva").insert(l);
  let { error: logErr } = await gravar(linha);
  const erroDeColuna = (e: unknown) => /column|schema cache/i.test(String((e as { message?: string })?.message ?? ""));
  // Banco sem alguma coluna nova: tira SÓ as mais recentes primeiro, pra não
  // perder o registro do dinheiro devido (devolução, status) por causa de um
  // campo opcional.
  if (logErr && erroDeColuna(logErr)) {
    console.warn("[" + opts.logTag + "] trocas_reserva sem coluna nova — gravando sem o titular", logErr.message);
    const { reembolso_pix_titular: _rt, ...semTitular } = linha;
    if (_rt) semTitular.observacao = [semTitular.observacao, "Titular do Pix: " + _rt].filter(Boolean).join(" · ");
    ({ error: logErr } = await gravar(semTitular));
    if (logErr && erroDeColuna(logErr)) {
      console.warn("[" + opts.logTag + "] trocas_reserva sem colunas de pagamento — gravando o básico", logErr.message);
      const {
        status: _s, pago_at: _p, pagamento_status: _ps, devolucao_tipo: _dt, devolucao_centavos: _dc,
        reembolso_pix_chave: _rk, reembolso_prazo: _rp, credito_codigo: _cc, credito_expira_em: _ce, ...basica
      } = semTitular;
      if (_dt) {
        basica.observacao = [basica.observacao, "DEVOLUÇÃO: " + _dt + " " + (_dc ?? "") + " centavos" + (_rk ? " · chave " + _rk : "") + (_cc ? " · cupom " + _cc : "")]
          .filter(Boolean).join(" · ");
      }
      ({ error: logErr } = await gravar(basica));
    }
  }
  // Caminho do pagamento: a reserva JÁ foi trocada — tenta de novo antes de
  // desistir, senão a linha ficaria "processando" (falso "não entrou").
  for (let i = 0; logErr && opts.trocaId && i < 2; i++) {
    await new Promise((res) => setTimeout(res, 500));
    ({ error: logErr } = await gravar({ status: "aplicada", pago_at: linha.pago_at ?? agoraIso, pagamento_status: "aprovado" }));
  }
  if (logErr) {
    // A troca já valeu; sem o registro ela não aparece na aba, mas a aba
    // Compras mostra o "Avisar" em vermelho do mesmo jeito.
    console.error("[" + opts.logTag + "] erro gravando trocas_reserva", bookingId, logErr.message);
  }

  const confirmacao = await enviarConfirmacaoReagendamento(
    sb,
    { ...bk, ...update, experiences: novaExp.imagem ? { imagem: novaExp.imagem } : bk.experiences },
    meta,
    { createdBy: opts.callerId, logTag: opts.logTag },
  );

  console.info(
    "[" + opts.logTag + "] troca aplicada",
    "booking=" + bookingId,
    "modalidade=" + snap.modalidade,
    "de=" + snap.de_experiencia_id + " " + snap.de_data + " " + snap.de_horario,
    "para=" + snap.para_experiencia_id + " " + snap.para_data + " " + snap.para_horario,
    "diferenca_paga=" + (opts.pagamento?.valorCentavos ?? 0),
  );
  return {
    ok: true,
    modalidade: snap.modalidade,
    confirmacao,
    reserva: { experiencia_nome: snap.para_experiencia_nome, data: snap.para_data, horario: snap.para_horario },
    credito,
  };
}

// ===== Pagamento da diferença: resultado vindo do gateway =====
//
// Chamado pelo mp-webhook / pagarme-webhook (e pela consulta "já paguei"
// da própria cliente). Idempotente: só age sobre linha em
// 'aguardando_pagamento', e a passagem pra 'processando' é compare-and-set
// — dois avisos simultâneos do gateway não aplicam a troca duas vezes.
export async function processarPagamentoTroca(
  sb: SB,
  trocaId: string,
  resultado: "aprovado" | "recusado" | "reembolsado",
  info: { valorCentavos?: number | null; pagamentoId?: string | null; logTag: string },
): Promise<{ status: string }> {
  const { data: linhaRow } = await sb.from("trocas_reserva").select("*").eq("id", trocaId).maybeSingle();
  const linha = linhaRow as Row;
  if (!linha) {
    console.warn("[" + info.logTag + "] troca não encontrada", trocaId);
    return { status: "nao_encontrada" };
  }

  if (resultado === "reembolsado") {
    // Estorno/contestação da diferença JÁ PAGA: a troca pode ter sido
    // aplicada. Não desfaz sozinho — sinaliza pra Elarah revisar.
    if (linha.pagamento_status !== "reembolsado") {
      await sb.from("trocas_reserva").update({
        pagamento_status: "reembolsado",
        observacao: "Pagamento da diferença foi estornado/contestado — revisar a reserva.",
        resolvido_at: null,
      }).eq("id", trocaId);
    }
    return { status: String(linha.status ?? "") };
  }

  if (resultado === "recusado") {
    const { data } = await sb.from("trocas_reserva")
      .update({ status: "pagamento_recusado", pagamento_status: "recusado" })
      .eq("id", trocaId).eq("status", "aguardando_pagamento").select("id");
    return { status: Array.isArray(data) && data.length ? "pagamento_recusado" : String(linha.status ?? "") };
  }

  // Aprovado → trava a linha.
  const agoraIso = new Date().toISOString();
  let { data: trava, error: travaErr } = await sb.from("trocas_reserva")
    .update({ status: "processando", pagamento_status: "aprovado", pago_at: agoraIso })
    // 'cancelada' entra: a cliente pode pagar um Pix antigo depois de abrir
    // outra tentativa. O dinheiro caiu, então processa (e, se a reserva já
    // tiver sido trocada pela outra, a linha fica 'pago_sem_aplicar').
    .eq("id", trocaId).in("status", ["aguardando_pagamento", "pagamento_recusado", "cancelada", "erro_pagamento"]).select("id");
  if (travaErr && String(travaErr.code) === "23505") {
    // Pagou uma tentativa antiga enquanto OUTRA está em aberto (índice
    // trocas_reserva_uma_pendente): o dinheiro caiu — nunca some; vai pro
    // painel como "pagou, troca não entrou" pra Elarah resolver.
    await sb.from("trocas_reserva").update({
      status: "pago_sem_aplicar", pagamento_status: "aprovado", pago_at: agoraIso,
      observacao: "Pagou uma tentativa antiga enquanto outra estava aberta — conferir e devolver se preciso.",
    }).eq("id", trocaId);
    console.error("[" + info.logTag + "] pagamento de tentativa antiga com outra em aberto", trocaId);
    return { status: "pago_sem_aplicar" };
  }
  if ((!Array.isArray(trava) || !trava.length) && linha.status === "processando" && linha.pago_at &&
    Date.now() - new Date(linha.pago_at).getTime() > 5 * 60_000) {
    // Travada há mais de 5 min (a função caiu no meio): retoma.
    ({ data: trava } = await sb.from("trocas_reserva")
      .update({ pago_at: agoraIso })
      .eq("id", trocaId).eq("status", "processando").eq("pago_at", linha.pago_at).select("id"));
  }
  if (!Array.isArray(trava) || !trava.length) return { status: String(linha.status ?? "") };

  const pedido = (linha.pedido && typeof linha.pedido === "object") ? linha.pedido as Pedido : null;
  const marcar = async (status: string, motivo: string) => {
    console.error("[" + info.logTag + "] diferença paga mas troca NÃO aplicada", trocaId, status, motivo);
    await sb.from("trocas_reserva").update({ status, observacao: motivo }).eq("id", trocaId);
    return { status };
  };
  if (!pedido || !linha.booking_id) return await marcar("pago_sem_aplicar", "Reserva ou pedido não encontrado.");

  const pago = Number(info.valorCentavos ?? linha.pagamento_valor_centavos) || 0;
  // Um "conflito" (a reserva foi tocada entre a leitura e a gravação —
  // lembrete automático, edição no painel) não pode virar falha definitiva
  // de uma troca JÁ PAGA: relê e tenta de novo.
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const { data: bkRow } = await sb.from("bookings").select("*, experiences(imagem)").eq("id", linha.booking_id).maybeSingle();
    const bk = bkRow as Row;
    if (!bk) return await marcar("pago_sem_aplicar", "Reserva não encontrada.");
    // A troca DESTE pagamento já foi aplicada (a gravação da linha falhou
    // depois): só acerta a linha — nunca a marca como "não entrou".
    const td = (bk.metadata && typeof bk.metadata === "object") ? (bk.metadata as Row).troca_diferenca : null;
    if (td && td.troca_id === trocaId) {
      await sb.from("trocas_reserva").update({ status: "aplicada" }).eq("id", trocaId);
      return { status: "aplicada" };
    }
    const v = await validarTroca(sb, bk, pedido, {
      pagamentoConfirmado: true,
      diferencaPaga: Number(linha.diferenca_centavos) || 0,
    });
    if (!v.ok) {
      return await marcar(v.error === "sem_vaga" ? "pago_sem_vaga" : "pago_sem_aplicar", v.message);
    }
    const r = await aplicarTroca(sb, v.ctx, {
      callerId: linha.user_id ?? null,
      callerEmail: linha.cliente_email ?? null,
      trocaId,
      logTag: info.logTag,
      pagamento: {
        valorCentavos: pago,
        diferencaCentavos: Number(linha.diferenca_centavos) || 0,
        metodo: linha.pagamento_metodo === "cartao" ? "cartao" : "pix",
        pagamentoId: info.pagamentoId ?? linha.pagamento_id ?? null,
        parcelas: linha.pagamento_parcelas ?? null,
      },
    });
    if (r.ok) return { status: "aplicada" };
    if (r.error === "conflito" && tentativa < 3) {
      await new Promise((res) => setTimeout(res, 400 * tentativa));
      continue;
    }
    return await marcar(r.error === "sem_vaga" ? "pago_sem_vaga" : "pago_sem_aplicar", r.message);
  }
  return await marcar("pago_sem_aplicar", "Não foi possível aplicar a troca.");
}
