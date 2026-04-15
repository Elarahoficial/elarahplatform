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
//   4. Decrementar vaga atomicamente (decrement_experience_vagas RPC).
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
  email: string | null;
  nome: string | null;
  cupomCode: string | null;
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

  // ===== 1. Busca experiência =====
  const { data: expRaw, error: expErr } = await supabase
    .from("experiences")
    .select(
      "id, nome, preco, data, horario, horarios, endereco, bairro, vagas_total, vagas_restantes, event_at, cutoff_hours, is_active",
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

  // ===== 2. Cutoff =====
  if (exp.event_at) {
    const cutoffH = Number(exp.cutoff_hours ?? 24);
    const eventTs = new Date(exp.event_at).getTime();
    const limit = Date.now() + cutoffH * 60 * 60 * 1000;
    if (limit > eventTs) {
      return {
        ok: false,
        errorCode: "experience_cutoff_passed",
        errorMessage: `As reservas para esta experiência encerraram ${cutoffH}h antes do evento.`,
        errorStatus: 409,
      };
    }
  }

  // ===== 3. Vagas prévia (não atômica — a verdade é o RPC) =====
  if (
    exp.vagas_total !== null &&
    exp.vagas_total !== undefined &&
    (exp.vagas_restantes === null || Number(exp.vagas_restantes) <= 0)
  ) {
    return {
      ok: false,
      errorCode: "experience_sold_out",
      errorMessage: "Esta experiência está esgotada.",
      errorStatus: 409,
    };
  }

  // ===== 4. Preço =====
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

  // ===== 5. Resolve user_id + nome =====
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

  // ===== 6. Hold do cupom (se informado) =====
  let giftCardId: string | null = null;
  let giftCardCentavos = 0;

  if (input.cupomCode) {
    const { data: holdRows, error: holdErr } = await supabase.rpc(
      "hold_gift_card",
      { p_code: input.cupomCode, p_amount_centavos: baseCents },
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

  const amountToChargeCents = Math.max(0, baseCents - giftCardCentavos);

  // ===== 7. Decremento atômico de vaga =====
  const { data: vagaRows, error: vagaErr } = await supabase.rpc(
    "decrement_experience_vagas",
    { p_experience_id: exp.id },
  );
  if (vagaErr) {
    console.error("[Elarah Guard] vagas decrement error", vagaErr);
    // Devolve o cupom já segurado.
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
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
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
    return {
      ok: false,
      errorCode: "experience_sold_out",
      errorMessage: "Esta experiência está esgotada.",
      errorStatus: 409,
    };
  }

  // ===== 8. Rollback closure =====
  // Caller chama se falhar depois desta função (ex: Stripe/MP erro).
  // Idempotente — dá pra chamar mais de uma vez sem estourar.
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    console.info(
      "[Elarah Guard] rollback de reserva",
      "exp=" + exp.id,
      "cupom=" + (giftCardId ?? "none"),
    );
    try {
      await supabase.rpc("increment_experience_vagas", {
        p_experience_id: exp.id,
      });
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
    rollback,
  };
}
