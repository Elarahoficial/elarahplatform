// =============================================================
// ELARAH — Booking guard (reserva de slot + cupom + validações)
// -------------------------------------------------------------
// Lógica compartilhada entre:
//   * create-checkout-session  (Stripe, cartão)
//   * create-mp-pix-payment    (Mercado Pago, PIX)
//
// Responsabilidades:
//   1. Buscar experiência e validar (existe, ativa, cutoff, vagas).
//   2. Resolver user_id + nome via profile (fallback pro nome).
//   3. Segurar cupom (hold_gift_card RPC).
//   4. Decrementar vaga atomicamente — por slot se existir, senão
//      por experiência (backward compat).
//   5. Devolver helper rollback() pro caller reverter side-effects
//      em caso de erro posterior.
//
// Por que um helper em vez de duplicar?
// A lógica de vagas/cupom é delicada (race conditions, rollback) —
// uma única fonte da verdade garante que ambos os fluxos de pagamento
// se comportem igual. Um bug corrigido aqui vale pra card e pra PIX.
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface GuardInput {
  experienciaId: string;
  horario: string | null;
  // Data + slot_id vindos da UI nova de chips de data (experiencia.html).
  // Opcionais — sem eles, slot lookup cai no comportamento legado.
  data?: string | null;
  slotId?: string | null;
  email: string | null;
  nome: string | null;
  cupomCode: string | null;
  quantidade: number;
}

export interface ExperienceSnapshot {
  id: string;
  nome: string;
  preco: string | null;
  data: string | null;
  horario: string | null;
  horarios: string[] | null;
  endereco: string | null;
  bairro: string | null;
  vagas_total: number | null;
  vagas_restantes: number | null;
  event_at: string | null;
  cutoff_hours: number | null;
  is_active: boolean | null;
  created_by: string | null;
  fornecedor_nome: string | null;
  valor_cheio_centavos: number | null;
  percentual_repasse: number | null;
  valor_repasse_fixo_centavos: number | null;
}

export interface GuardSuccess {
  ok: true;
  exp: ExperienceSnapshot;
  userId: string | null;
  profileNome: string | null;
  resolvedNome: string | null;       // payload > profile
  baseCents: number;                  // preço cheio da experiência
  giftCardId: string | null;
  giftCardCentavos: number;
  // Cupom promocional (sistema novo, tabela `coupons`). Quando preenchido,
  // giftCardId é null e giftCardCentavos = couponDiscountCents (pra reuso
  // do mesmo tracking de "valor abatido por código"). Caller deve gravar
  // coupon_id + coupon_code + coupon_discount_centavos na booking, e o
  // webhook chama register_coupon_use após confirmação.
  couponId: string | null;
  couponCode: string | null;
  couponDiscountCents: number;
  amountToChargeCents: number;        // baseCents - giftCardCentavos
  cupomCode: string | null;
  slotId: string | null;              // UUID do slot reservado (null = experience-level)
  slotData: string | null;            // slot.data ("DD/MM") quando disponível — usado no booking pra mostrar data específica em vez de exp.data ("Semanal")
  quantidade: number;                  // vagas reservadas (default 1)
  fornecedorId: string | null;
  fornecedorNome: string | null;
  valorCheioCentavos: number | null;
  percentualRepasse: number;
  valorRepasseFixoCentavos: number | null;
  // TRUE quando o RPC de decremento falhou em todas as camadas e o
  // pagamento prosseguiu sem decrementar vaga (fallback de emergência).
  // Caller deve gravar no metadata da booking pra reconciliação posterior.
  inventorySkipped: boolean;
  // Chamar se o caller falhar depois de reservar a vaga (ex.:
  // Stripe/MP retornar erro). Devolve vaga + saldo do cupom.
  rollback: () => Promise<void>;
}

export interface GuardFailure {
  ok: false;
  errorCode: string;
  errorMessage: string;
  errorStatus: number;
}

export type GuardResult = GuardSuccess | GuardFailure;

// ===== safeRpc =====
// O builder do supabase-js (o retorno de supabase.rpc(...)) NÃO tem o
// método .catch(): ele é um "thenable" (só .then). Chamar `.catch(...)`
// nele lançava `TypeError: supabase.rpc(...).catch is not a function`,
// abortando o rollback e devolvendo 500 em pagamentos recusados/cancelados
// (a vaga nem chegava a ser liberada). Este helper faz o await de forma
// segura: nunca lança e devolve { data, error } igual ao await normal —
// em exceção de rede/runtime, devolve { data: null, error }.
async function safeRpc<T = unknown>(
  query: PromiseLike<{ data: T; error: unknown }>,
): Promise<{ data: T | null; error: unknown }> {
  try {
    return await query;
  } catch (e) {
    return { data: null, error: e };
  }
}

// ===== parsePrecoToCents (duplicado em create-checkout-session pra
// evitar dependência circular — ambos usam a mesma implementação) =====
function parsePrecoToCents(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).replace(/\s/g, "").replace(/^R\$/i, "");
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const num = Number(normalized);
  if (!isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}

// ===== computeChargeAmount =====
// Fonte única da verdade pro cálculo do valor cobrado em qualquer
// fluxo de pagamento (Stripe cartão, MP PIX, ou cobrança direta).
// O cálculo é trivial mas centralizá-lo elimina o risco de um caller
// esquecer a multiplicação por quantidade — bug crítico que cobraria
// só uma vaga quando o cliente pediu várias.
//
// Garante:
//   subtotal_cents = unit_cents * quantity   (sempre multiplica)
//   discount_cents = min(gift_card_cents, subtotal_cents)
//   total_cents    = max(0, subtotal_cents - discount_cents)
//
// Retorna o breakdown completo pra que callers persistam audit
// trail. Lança erro pra entradas claramente inválidas (preço <= 0,
// quantidade < 1) — checagem defensiva, valida no backend mesmo se
// o frontend mandou lixo.
export interface ChargeBreakdown {
  unitCents: number;
  quantity: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}
export function computeChargeAmount(
  unitCents: unknown,
  quantity: unknown,
  giftCardCents: unknown = 0,
): ChargeBreakdown {
  const unit = Number(unitCents);
  if (!Number.isFinite(unit) || unit <= 0) {
    throw new Error("computeChargeAmount: unit_cents inválido (" + String(unitCents) + ")");
  }
  const qtyRaw = Number(quantity);
  if (!Number.isFinite(qtyRaw)) {
    throw new Error("computeChargeAmount: quantity inválido (" + String(quantity) + ")");
  }
  const qty = Math.max(1, Math.floor(qtyRaw));
  const subtotal = Math.round(unit) * qty;
  const giftRaw = Number(giftCardCents) || 0;
  const discount = Math.max(0, Math.min(giftRaw, subtotal));
  const total = Math.max(0, subtotal - discount);
  return {
    unitCents: Math.round(unit),
    quantity: qty,
    subtotalCents: subtotal,
    discountCents: discount,
    totalCents: total,
  };
}

// ===== assertExpectedTotal =====
// Sanity check que o caller chama imediatamente antes de submeter
// a cobrança ao gateway de pagamento. Aborta se o valor a ser cobrado
// for menor do que o subtotal esperado menos o desconto — protege
// contra qualquer bug de cálculo manual que tenha esquecido a
// multiplicação por quantidade.
//
// Aceita finalCharge >= expectedAfterDiscount (taxa de cartão pode
// somar acima). Rejeita se finalCharge < expectedAfterDiscount.
export function assertExpectedTotal(
  breakdown: ChargeBreakdown,
  finalChargeCents: number,
  context: string,
): void {
  const expected = breakdown.totalCents;
  if (finalChargeCents < expected) {
    const msg =
      "[Elarah Guard] AMOUNT MISMATCH em " + context + ": " +
      "esperado >= " + expected + " (subtotal " + breakdown.subtotalCents +
      " - desconto " + breakdown.discountCents + "), " +
      "calculado " + finalChargeCents + " (qty=" + breakdown.quantity +
      ", unit=" + breakdown.unitCents + "). Abortando pra não cobrar a menos.";
    console.error(msg);
    throw new Error("amount_mismatch");
  }
}


// Extrai o horário inicial ("19h00 – 21h00" -> {hh:19, mm:0}). Aceita
// 'h' ou ':' como separador, separador de range '-', en-dash ou
// em-dash. Retorna null se não conseguir parsear.
function parseStartHour(raw: string | null | undefined): { hh: number; mm: number } | null {
  if (!raw) return null;
  const head = String(raw).split(/[–—\-]/)[0].trim();
  const m = head.match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})/i);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = m[2] ? Number(m[2]) : 0;
  if (!Number.isFinite(hh) || hh < 0 || hh > 23) return null;
  if (!Number.isFinite(mm) || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

// Deriva o timestamp absoluto do evento a partir dos campos `data`
// (formato BR "DD/MM" ou "DD/MM/AAAA") e `horario` (ex.: "19h00 –
// 21h00"). Usado como fallback quando `event_at` não está preenchido
// no banco — sem isso, qualquer experiência criada antes da coluna
// existir passaria sem cutoff. Retorna null pra valores que não
// conseguimos resolver com segurança ("Semanal", string vazia, etc.).
//
// "DD/MM" sem ano = ano atual. Se ficar no passado, o cutoff guard
// rejeita a reserva (alinhado com a regra de auto-expirar exibida no
// front). Pra eventos num ano específico, admin deve usar
// "DD/MM/AAAA".
//
// Fuso fixo America/Sao_Paulo (-03:00). Edge Functions Deno rodam em
// UTC, então construir o ISO sem offset interpreta errado em 3h.
function deriveEventTimestamp(
  dataStr: string | null | undefined,
  horarioStr: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (!dataStr) return null;
  const trimmed = String(dataStr).trim();
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;

  const year = m[3]
    ? (Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3]))
    : new Date(nowMs).getFullYear();

  const h = parseStartHour(horarioStr);
  if (!h) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const iso =
    `${year}-${pad(month)}-${pad(day)}T${pad(h.hh)}:${pad(h.mm)}:00-03:00`;
  const ts = new Date(iso).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/**
 * Executa toda a validação + reserva de vaga + hold de cupom para um
 * checkout de experiência. Retorna um contexto rico com tudo que o
 * caller precisa pra chamar a API de pagamento (Stripe/MP) e inserir
 * a booking.
 *
 * Se retornar ok=false, NADA foi alterado no banco — o caller pode
 * devolver o erro direto pro frontend sem rollback.
 *
 * Se retornar ok=true, a vaga JÁ está decrementada e o cupom JÁ está
 * segurado. O caller DEVE:
 *   - Chamar rollback() se qualquer etapa posterior falhar
 *   - OU criar a booking com os valores retornados e seguir o fluxo
 */
// =============================================================
// Estados de inventário + mutação idempotente de vaga
// -------------------------------------------------------------
// Uma booking SEGURA uma vaga enquanto está `pending` ou `pago`. Quando
// vai pra `cancelado`/`expirado`/`reembolsado`, a vaga foi (ou deve ser)
// devolvida ao estoque. Historicamente a mutação de estoque era feita
// "às cegas" — increment no cancelamento, decrement só na criação — o
// que abria DOIS caminhos de overbooking:
//
//   1. Cancelamento/expiração DUPLICADO (webhook repetido ou polling +
//      webhook): devolvia a MESMA vaga duas vezes → estoque fantasma →
//      o site voltava a mostrar vaga que não existe → vende além da
//      lotação.
//
//   2. Aprovação TARDIA de uma booking já liberada (cancelado→pago,
//      expirado→pago): o pagamento caía depois da vaga ter sido
//      devolvida, mas a confirmação NÃO re-decrementava → a lotação
//      passava batido.
//
// Estes helpers tornam a mutação idempotente: só devolve vaga se ela
// estava de fato ocupada, e re-decrementa quando uma booking liberada
// volta a ser paga. É a mesma fonte da verdade pros três webhooks
// (mp-webhook, stripe-webhook, check-mp-payment-status).
export function holdsInventory(status: string | null | undefined): boolean {
  return status === "pending" || status === "pago";
}

export function wasInventoryReleased(status: string | null | undefined): boolean {
  return status === "cancelado" || status === "expirado" || status === "reembolsado";
}

interface InventoryBookingShape {
  slot_id?: string | null;
  experiencia_id?: string | null;
  quantidade?: number | null;
}

// Re-decrementa a vaga quando uma booking previamente liberada
// (cancelado/expirado/reembolsado) é confirmada de novo. Atômico via
// RPC — respeita a lotação (não deixa `vagas_restantes` ir abaixo de 0).
//
// Retorna:
//   reoccupied=true             → vaga re-ocupada com sucesso.
//   oversold=true               → não havia vaga. O pagamento JÁ caiu,
//                                 então não dá pra recusar; o caller
//                                 grava flag no metadata + alerta pra
//                                 tratamento manual (estorno/remanejo).
//   reoccupied=false/oversold=false → RPC indisponível (schema legado);
//                                 não bloqueia a confirmação, só loga.
export async function reoccupyVagaOnReapproval(
  supabase: ReturnType<typeof createClient>,
  booking: InventoryBookingShape,
): Promise<{ reoccupied: boolean; oversold: boolean }> {
  const qty = Math.max(1, Math.floor(Number(booking.quantidade) || 1));
  const useSlot = !!booking.slot_id;
  const rpc = useSlot ? "decrement_slot_vagas" : "decrement_experience_vagas";
  const arg = useSlot
    ? { p_slot_id: booking.slot_id, p_qty: qty }
    : (booking.experiencia_id
      ? { p_experience_id: booking.experiencia_id, p_qty: qty }
      : null);
  if (!arg) return { reoccupied: false, oversold: false };

  const { data, error } = await supabase.rpc(rpc, arg);
  if (error) {
    console.error(
      "[Elarah Guard] reoccupy vaga falhou (RPC) — confirmação segue sem re-decremento",
      "rpc=" + rpc,
      "error=" + JSON.stringify(error),
    );
    return { reoccupied: false, oversold: false };
  }
  const row = Array.isArray(data) ? data[0] : data;
  // deno-lint-ignore no-explicit-any
  const vr = row as any;
  if (!vr || vr.ok === false) {
    return { reoccupied: false, oversold: true };
  }
  return { reoccupied: true, oversold: false };
}

export async function reserveExperienceSlot(
  supabase: ReturnType<typeof createClient>,
  input: GuardInput,
): Promise<GuardResult> {
  const experienciaId = String(input.experienciaId || "").trim();
  if (!experienciaId) {
    return {
      ok: false,
      errorCode: "experiencia_id_required",
      errorMessage: "ID da experiência é obrigatório.",
      errorStatus: 400,
    };
  }

  const horarioInput = input.horario ? String(input.horario).trim() : null;
  const dataInput = input.data ? String(input.data).trim() : null;
  const slotIdInput = input.slotId ? String(input.slotId).trim() : null;
  const quantidade = Math.max(1, Math.floor(Number(input.quantidade) || 1));

  // ===== 1. Busca experiência =====
  const { data: expRaw, error: expErr } = await supabase
    .from("experiences")
    .select(
      "id, nome, preco, data, horario, horarios, endereco, bairro, vagas_total, vagas_restantes, event_at, cutoff_hours, is_active, created_by, fornecedor_nome, valor_cheio_centavos, percentual_repasse, valor_repasse_fixo_centavos",
    )
    .eq("id", experienciaId)
    .maybeSingle();

  if (expErr) {
    console.error("[Elarah Guard] experience lookup error", expErr);
    return {
      ok: false,
      errorCode: "experience_lookup_failed",
      errorMessage: "Não foi possível consultar a experiência.",
      errorStatus: 500,
    };
  }
  if (!expRaw) {
    return {
      ok: false,
      errorCode: "experience_not_found",
      errorMessage: "Experiência não encontrada.",
      errorStatus: 404,
    };
  }
  const exp = expRaw as ExperienceSnapshot;

  if (exp.is_active === false) {
    return {
      ok: false,
      errorCode: "experience_unavailable",
      errorMessage: "Esta experiência não está mais disponível.",
      errorStatus: 404,
    };
  }

  // ===== 2. Tenta encontrar o slot pro horário/data escolhido =====
  // Prioridade:
  //   1. slot_id explícito (UI nova já enviou o id exato)
  //   2. (exp_id, horario, data) — quando UI mandou data específica
  //   3. (exp_id, horario) — legado, pega o mais próximo no futuro
  // deno-lint-ignore no-explicit-any
  let slot: any = null;
  let slotId: string | null = null;
  let useSlotVagas = false;

  if (slotIdInput) {
    const { data: slotRow, error: slotErr } = await supabase
      .from("experience_slots")
      .select("id, vagas_total, vagas_restantes, event_at, is_active, horario, data")
      .eq("id", slotIdInput)
      .eq("experience_id", experienciaId)
      .maybeSingle();
    if (slotErr) {
      console.warn("[Elarah Guard] slot lookup por id falhou:", slotErr.message);
    } else if (slotRow) {
      slot = slotRow;
      slotId = slot.id;
      useSlotVagas = true;
      if (slot.is_active === false) {
        return {
          ok: false,
          errorCode: "slot_unavailable",
          errorMessage: "Este horário não está mais disponível.",
          errorStatus: 409,
        };
      }
    }
  } else if (horarioInput) {
    let query = supabase
      .from("experience_slots")
      .select("id, vagas_total, vagas_restantes, event_at, is_active, horario, data")
      .eq("experience_id", experienciaId)
      .eq("horario", horarioInput);
    if (dataInput) {
      query = query.eq("data", dataInput);
    }
    const { data: slotRows, error: slotErr } = await query;

    if (slotErr) {
      console.warn("[Elarah Guard] slot lookup falhou (tabela ausente?)", slotErr.message);
    } else if (Array.isArray(slotRows) && slotRows.length > 0) {
      // Múltiplos slots no mesmo horario (recorrência sem data filtrada):
      // pega o mais próximo no futuro. Cliente novo manda `data` → 1 match.
      const sorted = slotRows
        .filter((r) => r.is_active !== false)
        .sort((a, b) => {
          const ea = a.event_at ? new Date(a.event_at).getTime() : Infinity;
          const eb = b.event_at ? new Date(b.event_at).getTime() : Infinity;
          return ea - eb;
        });
      if (sorted.length > 0) {
        slot = sorted[0];
        slotId = slot.id;
        useSlotVagas = true;
      } else {
        return {
          ok: false,
          errorCode: "slot_unavailable",
          errorMessage: "Este horário não está mais disponível.",
          errorStatus: 409,
        };
      }
    }
  }

  // ===== 3. Cutoff =====
  // Prioridade pra calcular o início do evento:
  //   1. slot.event_at  (timestamptz exato do slot escolhido)
  //   2. exp.event_at   (timestamptz exato da experiência)
  //   3. derivado de exp.data + horário (DD/MM + HH'h'MM)
  // O fallback (3) garante que experiências antigas — criadas antes
  // de event_at virar coluna ou sem event_at preenchido — também
  // respeitem o cutoff. Sem ele, era possível reservar à noite uma
  // experiência que acontece no dia seguinte.
  const cutoffH = Number(exp.cutoff_hours ?? 24);
  let effectiveEventTs: number | null = null;
  const sourceEventAt = (useSlotVagas && slot?.event_at) ? slot.event_at : exp.event_at;
  if (sourceEventAt) {
    const t = new Date(sourceEventAt).getTime();
    if (Number.isFinite(t)) effectiveEventTs = t;
  }
  if (effectiveEventTs == null) {
    effectiveEventTs = deriveEventTimestamp(
      exp.data,
      horarioInput || exp.horario || (Array.isArray(exp.horarios) ? exp.horarios[0] : null),
    );
  }
  if (effectiveEventTs != null) {
    const limit = Date.now() + cutoffH * 60 * 60 * 1000;
    if (limit > effectiveEventTs) {
      return {
        ok: false,
        errorCode: "experience_cutoff_passed",
        errorMessage: `As reservas para esta experiência encerraram ${cutoffH}h antes do início.`,
        errorStatus: 409,
      };
    }
  }

  // ===== 4. Vagas prévia (não atômica — a verdade é o RPC) =====
  if (useSlotVagas) {
    // Check slot-level
    if (
      slot.vagas_total !== null &&
      (slot.vagas_restantes === null || Number(slot.vagas_restantes) < quantidade)
    ) {
      const restantes = Number(slot.vagas_restantes || 0);
      return {
        ok: false,
        errorCode: "slot_sold_out",
        errorMessage: restantes <= 0
          ? "Este horário está esgotado."
          : `Só restam ${restantes} vaga(s) neste horário.`,
        errorStatus: 409,
      };
    }
  } else {
    if (
      exp.vagas_total !== null &&
      exp.vagas_total !== undefined &&
      (exp.vagas_restantes === null || Number(exp.vagas_restantes) < quantidade)
    ) {
      const restantes = Number(exp.vagas_restantes || 0);
      return {
        ok: false,
        errorCode: "experience_sold_out",
        errorMessage: restantes <= 0
          ? "Esta experiência está esgotada."
          : `Só restam ${restantes} vaga(s) nesta experiência.`,
        errorStatus: 409,
      };
    }
  }

  // ===== 5. Preço =====
  const baseCents = parsePrecoToCents(exp.preco);
  if (!baseCents) {
    console.error("[Elarah Guard] invalid price", exp.preco);
    return {
      ok: false,
      errorCode: "invalid_price",
      errorMessage: "Preço inválido na experiência.",
      errorStatus: 422,
    };
  }

  // ===== 6. Resolve user_id + nome =====
  let userId: string | null = null;
  let profileNome: string | null = null;
  if (input.email) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("email", input.email)
      .maybeSingle();
    if (prof) {
      // deno-lint-ignore no-explicit-any
      const p = prof as any;
      userId = p.id ?? null;
      if (p.nome && String(p.nome).trim()) {
        profileNome = String(p.nome).trim();
      }
    }
  }
  const resolvedNome = (input.nome && input.nome.trim()) || profileNome;

  // ===== 6b. Resolve fornecedor (supplier) =====
  let fornecedorId: string | null = exp.created_by ?? null;
  let fornecedorNome: string | null = null;
  if (fornecedorId) {
    const { data: fornProf } = await supabase
      .from("profiles")
      .select("nome, partner_data")
      .eq("id", fornecedorId)
      .maybeSingle();
    if (fornProf) {
      // deno-lint-ignore no-explicit-any
      const fp = fornProf as any;
      fornecedorNome = (fp.partner_data?.marca) || fp.nome || null;
    }
  }

  // ===== 7. Hold do cupom OU gift card (se informado) =====
  // Tenta primeiro a tabela `coupons` (sistema novo de cupons promo:
  // percentual, restrição por experiência, limite de uso, validade).
  // Se NÃO for encontrado lá, cai pro `gift_cards` legado (saldo fixo).
  // Backward compat: códigos antigos (ELRH-XXXX) continuam funcionando.
  let giftCardId: string | null = null;        // legado — gift_card real
  let giftCardCentavos = 0;
  let couponId: string | null = null;          // novo — cupom promocional
  let couponCode: string | null = null;
  let couponDiscountCents = 0;

  const totalBaseCentsForCupom = baseCents * quantidade;
  if (input.cupomCode) {
    // Tenta cupom novo primeiro
    const { data: cpRows, error: cpErr } = await supabase.rpc(
      "hold_coupon",
      {
        p_code: input.cupomCode,
        p_experience_id: exp.id,
        p_amount_centavos: totalBaseCentsForCupom,
      },
    );
    if (cpErr) {
      // RPC não existe ainda OU erro de permissão → tenta gift_card.
      // Loga warn (não error) — fallback é esperado em deploys legados
      // que ainda não rodaram sql/elarah_coupons.sql.
      console.warn(
        "[Elarah Guard] hold_coupon falhou, fallback pra gift_card",
        cpErr.message,
      );
    } else {
      const row = Array.isArray(cpRows) ? cpRows[0] : cpRows;
      // deno-lint-ignore no-explicit-any
      const h = row as any;
      if (h && h.ok === true) {
        couponId = h.coupon_id ?? null;
        couponCode = input.cupomCode;
        couponDiscountCents = Number(h.discount_centavos || 0);
        giftCardCentavos = couponDiscountCents; // valor abatido — reaproveita o tracking
      } else if (h && h.coupon_id) {
        // Existe na tabela coupons mas inválido (expirado/restrito/esgotado).
        // NÃO cai pro gift_card — o usuário digitou um código que ELE
        // sabia que era cupom; mensagem específica é mais útil.
        return {
          ok: false,
          errorCode: "coupon_invalid",
          errorMessage: h?.message || "Cupom inválido.",
          errorStatus: 422,
        };
      }
      // h não encontrado (h.ok==false e h.coupon_id==null) → fallback
    }

    // Se não foi cupom, tenta gift card legado
    if (!couponId) {
      const { data: holdRows, error: holdErr } = await supabase.rpc(
        "hold_gift_card",
        { p_code: input.cupomCode, p_amount_centavos: totalBaseCentsForCupom },
      );
      if (holdErr) {
        console.error("[Elarah Guard] hold gift_card error", holdErr);
        return {
          ok: false,
          errorCode: "gift_card_lookup_failed",
          errorMessage: "Não foi possível validar o cupom.",
          errorStatus: 500,
        };
      }
      const hold = Array.isArray(holdRows) ? holdRows[0] : holdRows;
      // deno-lint-ignore no-explicit-any
      const h = hold as any;
      if (!h || !h.ok) {
        return {
          ok: false,
          errorCode: "gift_card_invalid",
          errorMessage: h?.message || "Cupom inválido.",
          errorStatus: 422,
        };
      }
      giftCardId = h.gift_card_id ?? null;
      giftCardCentavos = Number(h.used_centavos || 0);
    }
  }

  const totalBaseCents = baseCents * quantidade;
  const amountToChargeCents = Math.max(0, totalBaseCents - giftCardCentavos);

  // ===== 8. Decremento de vaga (com fallback robusto) =====
  // Estratégia em 3 camadas — espelha create-checkout-session pra
  // que ambos os fluxos (Stripe cartão + MP PIX) sobrevivam a schema
  // desatualizado. Pagamento NUNCA é bloqueado por falha de RPC.
  //
  //   1ª: RPC moderno com p_qty (sql/elarah_bookings_quantidade.sql)
  //   2ª: RPC legado sem p_qty em loop (sql/elarah_extensions.sql)
  //   3ª: Pula o controle e segue — overbooking transitório > checkout fora do ar
  const refundGiftCard = async () => {
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
    if (couponId) {
      const { error: refundCouponErr } = await safeRpc(
        supabase.rpc("refund_coupon", { p_coupon_id: couponId }),
      );
      if (refundCouponErr) console.warn("[Elarah Guard] refund_coupon falhou", refundCouponErr);
    }
  };

  const decrementRpc = useSlotVagas ? "decrement_slot_vagas" : "decrement_experience_vagas";
  const incrementRpc = useSlotVagas ? "increment_slot_vagas" : "increment_experience_vagas";
  const baseArg = useSlotVagas
    ? { p_slot_id: slotId }
    : { p_experience_id: exp.id };
  const soldOutCode = useSlotVagas ? "slot_sold_out" : "experience_sold_out";
  const soldOutMsg = useSlotVagas
    ? "Este horário está esgotado."
    : "Esta experiência está esgotada.";

  // Acompanha vagas efetivamente decrementadas pra rollback correto.
  let vagasDecrementadas = 0;
  let inventorySkipped = false;

  // Camada 1: moderno
  const modern = await supabase.rpc(decrementRpc, {
    ...baseArg,
    p_qty: quantidade,
  });
  let resolvedDecrement = false;

  if (!modern.error) {
    const row = Array.isArray(modern.data) ? modern.data[0] : modern.data;
    // deno-lint-ignore no-explicit-any
    const vr = row as any;
    if (!vr || vr.ok === false) {
      await refundGiftCard();
      return {
        ok: false,
        errorCode: soldOutCode,
        errorMessage: soldOutMsg,
        errorStatus: 409,
      };
    }
    vagasDecrementadas = quantidade;
    resolvedDecrement = true;
    console.info(
      "[Elarah Guard] vagas decrementadas (moderno)",
      "rpc=" + decrementRpc,
      "qty=" + quantidade,
    );
  } else {
    console.warn(
      "[Elarah Guard] decrement com p_qty falhou — tentando legado",
      "rpc=" + decrementRpc,
      "error=" + JSON.stringify(modern.error),
      "hint=rode sql/elarah_bookings_quantidade.sql no Supabase",
    );
  }

  // Camada 2: legado em loop
  if (!resolvedDecrement) {
    let decremented = 0;
    let legacyOk = true;
    for (let i = 0; i < quantidade; i++) {
      const legacy = await supabase.rpc(decrementRpc, baseArg);
      if (legacy.error) {
        // Compensa parcial e cai pra camada 3
        for (let j = 0; j < decremented; j++) {
          await safeRpc(supabase.rpc(incrementRpc, baseArg));
        }
        console.error(
          "[Elarah Guard] decrement legacy também falhou — pulando estoque",
          "rpc=" + decrementRpc,
          "error=" + JSON.stringify(legacy.error),
        );
        legacyOk = false;
        break;
      }
      const row = Array.isArray(legacy.data) ? legacy.data[0] : legacy.data;
      // deno-lint-ignore no-explicit-any
      const vr = row as any;
      if (!vr || vr.ok === false) {
        for (let j = 0; j < decremented; j++) {
          await safeRpc(supabase.rpc(incrementRpc, baseArg));
        }
        await refundGiftCard();
        return {
          ok: false,
          errorCode: soldOutCode,
          errorMessage: soldOutMsg,
          errorStatus: 409,
        };
      }
      decremented += 1;
    }
    if (legacyOk) {
      vagasDecrementadas = decremented;
      resolvedDecrement = true;
      console.info(
        "[Elarah Guard] vagas decrementadas (legacy loop)",
        "rpc=" + decrementRpc,
        "qty=" + decremented,
      );
    }
  }

  // Camada 3: estoque pulado, segue mesmo assim
  if (!resolvedDecrement) {
    inventorySkipped = true;
    console.error(
      "[Elarah Payment] CONTROLE DE ESTOQUE PULADO — pagamento prosseguindo sem decremento",
      "experiencia=" + exp.id,
      "slot=" + (slotId ?? "none"),
      "quantidade=" + quantidade,
      "ação=admin precisa rodar sql/elarah_bookings_quantidade.sql",
    );
  }

  // ===== 9. Rollback closure =====
  // Best effort: tenta moderno, depois legado. Devolve só o que foi
  // efetivamente decrementado. Se estoque foi pulado, no-op.
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    console.info(
      "[Elarah Guard] rollback de reserva",
      "exp=" + exp.id,
      "slot=" + (slotId ?? "none"),
      "cupom=" + (giftCardId ?? "none"),
      "vagas_a_devolver=" + vagasDecrementadas,
    );
    if (vagasDecrementadas > 0) {
      const modernInc = await safeRpc(
        supabase.rpc(incrementRpc, { ...baseArg, p_qty: vagasDecrementadas }),
      );
      if (modernInc.error) {
        for (let i = 0; i < vagasDecrementadas; i++) {
          await safeRpc(supabase.rpc(incrementRpc, baseArg));
        }
      }
    }
    if (giftCardId) {
      try {
        await supabase.rpc("refund_gift_card", {
          p_gift_card_id: giftCardId,
          p_amount_centavos: giftCardCentavos,
        });
      } catch (e) {
        console.error("[Elarah Guard] rollback gift_card falhou", e);
      }
    }
    if (couponId) {
      try {
        await supabase.rpc("refund_coupon", { p_coupon_id: couponId });
      } catch (e) {
        console.error("[Elarah Guard] rollback coupon falhou", e);
      }
    }
  };

  return {
    ok: true,
    exp,
    userId,
    profileNome,
    resolvedNome,
    baseCents,
    giftCardId,
    giftCardCentavos,
    couponId,
    couponCode,
    couponDiscountCents,
    amountToChargeCents,
    cupomCode: input.cupomCode,
    slotId,
    slotData: slot?.data ?? null,
    quantidade,
    fornecedorId,
    fornecedorNome: fornecedorNome || exp.fornecedor_nome || null,
    valorCheioCentavos: exp.valor_cheio_centavos ?? null,
    percentualRepasse: Number(exp.percentual_repasse ?? 90),
    // Quando preenchido (em centavos), eh valor fixo POR PESSOA que
    // sobrescreve o percentual no calculo do repasse.
    valorRepasseFixoCentavos: exp.valor_repasse_fixo_centavos ?? null,
    inventorySkipped,
    rollback,
  };
}
