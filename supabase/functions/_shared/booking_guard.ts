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
  amountToChargeCents: number;        // baseCents - giftCardCentavos
  cupomCode: string | null;
  slotId: string | null;              // UUID do slot reservado (null = experience-level)
  quantidade: number;                  // vagas reservadas (default 1)
  fornecedorId: string | null;
  fornecedorNome: string | null;
  valorCheioCentavos: number | null;
  percentualRepasse: number;
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
  const quantidade = Math.max(1, Math.floor(Number(input.quantidade) || 1));

  // ===== 1. Busca experiência =====
  const { data: expRaw, error: expErr } = await supabase
    .from("experiences")
    .select(
      "id, nome, preco, data, horario, horarios, endereco, bairro, vagas_total, vagas_restantes, event_at, cutoff_hours, is_active, created_by, fornecedor_nome, valor_cheio_centavos, percentual_repasse",
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

  // ===== 2. Tenta encontrar o slot pro horário escolhido =====
  // deno-lint-ignore no-explicit-any
  let slot: any = null;
  let slotId: string | null = null;
  let useSlotVagas = false;

  if (horarioInput) {
    const { data: slotRow, error: slotErr } = await supabase
      .from("experience_slots")
      .select("id, vagas_total, vagas_restantes, event_at, is_active")
      .eq("experience_id", experienciaId)
      .eq("horario", horarioInput)
      .maybeSingle();

    if (slotErr) {
      // Tabela pode não existir — continua com experience-level
      console.warn("[Elarah Guard] slot lookup falhou (tabela ausente?)", slotErr.message);
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

  // ===== 7. Hold do cupom (se informado) =====
  let giftCardId: string | null = null;
  let giftCardCentavos = 0;

  const totalBaseCentsForCupom = baseCents * quantidade;
  if (input.cupomCode) {
    const { data: holdRows, error: holdErr } = await supabase.rpc(
      "hold_gift_card",
      { p_code: input.cupomCode, p_amount_centavos: totalBaseCentsForCupom },
    );
    if (holdErr) {
      console.error("[Elarah Guard] hold cupom error", holdErr);
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

  const totalBaseCents = baseCents * quantidade;
  const amountToChargeCents = Math.max(0, totalBaseCents - giftCardCentavos);

  // ===== 8. Decremento atômico de vaga =====
  // Se temos slot → decrement_slot_vagas, senão → decrement_experience_vagas
  const refundGiftCard = async () => {
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
  };

  if (useSlotVagas) {
    // Slot-level decrement
    const { data: vagaRows, error: vagaErr } = await supabase.rpc(
      "decrement_slot_vagas",
      { p_slot_id: slotId, p_qty: quantidade },
    );
    if (vagaErr) {
      console.error("[Elarah Guard] slot vagas decrement error", vagaErr);
      await refundGiftCard();
      return {
        ok: false,
        errorCode: "vagas_check_failed",
        errorMessage: "Falha ao verificar vagas do horário.",
        errorStatus: 500,
      };
    }
    const vagaRow = Array.isArray(vagaRows) ? vagaRows[0] : vagaRows;
    // deno-lint-ignore no-explicit-any
    const vr = vagaRow as any;
    if (!vr || vr.ok === false) {
      await refundGiftCard();
      return {
        ok: false,
        errorCode: "slot_sold_out",
        errorMessage: "Este horário está esgotado.",
        errorStatus: 409,
      };
    }
    console.info(
      "[Elarah Guard] slot vaga decrementada",
      "slot=" + slotId,
      "restantes=" + vr.vagas_restantes,
    );
  } else {
    // Experience-level decrement (backward compat)
    const { data: vagaRows, error: vagaErr } = await supabase.rpc(
      "decrement_experience_vagas",
      { p_experience_id: exp.id, p_qty: quantidade },
    );
    if (vagaErr) {
      console.error("[Elarah Guard] vagas decrement error", vagaErr);
      await refundGiftCard();
      return {
        ok: false,
        errorCode: "vagas_check_failed",
        errorMessage: "Falha ao verificar vagas.",
        errorStatus: 500,
      };
    }
    const vagaRow = Array.isArray(vagaRows) ? vagaRows[0] : vagaRows;
    // deno-lint-ignore no-explicit-any
    const vr = vagaRow as any;
    if (!vr || vr.ok === false) {
      await refundGiftCard();
      return {
        ok: false,
        errorCode: "experience_sold_out",
        errorMessage: "Esta experiência está esgotada.",
        errorStatus: 409,
      };
    }
  }

  // ===== 9. Rollback closure =====
  // Caller chama se falhar depois desta função (ex: Stripe/MP erro).
  // Idempotente — dá pra chamar mais de uma vez sem estourar.
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    console.info(
      "[Elarah Guard] rollback de reserva",
      "exp=" + exp.id,
      "slot=" + (slotId ?? "none"),
      "cupom=" + (giftCardId ?? "none"),
    );
    try {
      if (useSlotVagas && slotId) {
        await supabase.rpc("increment_slot_vagas", { p_slot_id: slotId, p_qty: quantidade });
      } else {
        await supabase.rpc("increment_experience_vagas", {
          p_experience_id: exp.id, p_qty: quantidade,
        });
      }
    } catch (e) {
      console.error("[Elarah Guard] rollback vagas falhou", e);
    }
    if (giftCardId) {
      try {
        await supabase.rpc("refund_gift_card", {
          p_gift_card_id: giftCardId,
          p_amount_centavos: giftCardCentavos,
        });
      } catch (e) {
        console.error("[Elarah Guard] rollback cupom falhou", e);
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
    amountToChargeCents,
    cupomCode: input.cupomCode,
    slotId,
    quantidade,
    fornecedorId,
    fornecedorNome: fornecedorNome || exp.fornecedor_nome || null,
    valorCheioCentavos: exp.valor_cheio_centavos ?? null,
    percentualRepasse: Number(exp.percentual_repasse ?? 90),
    rollback,
  };
}
