// =============================================================
// ELARAH — admin-reagendar-reserva Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-reagendar-reserva
//   body: {
//     booking_id: string,
//     anterior: { experiencia_id, data, horario, quantidade },
//     enviar_confirmacao?: boolean   // default true
//   }
//
// PARA QUE SERVE
// --------------
// Roda logo depois que a admin salva o "✏️ Editar" de uma reserva no
// painel (admin.js já gravou experiência/data/horário/quantidade novos).
// Sem esta função, a edição trocava só o TEXTO da reserva:
//
//   1. VAGAS: bookings.slot_id continuava apontando pra turma ANTIGA.
//      A varredura de 10 em 10 min (reconcile_all_vagas) conta vaga por
//      slot_id — então a data antiga seguia com a vaga ocupada e a nova
//      não perdia vaga nenhuma. Aqui: devolve a vaga da turma antiga,
//      segura a vaga da turma nova e religa o slot_id.
//
//   2. LEMBRETE / FEEDBACK: reminder_48h_sent_at e
//      feedback_whatsapp_sent_at ficavam carimbados da data antiga (e a
//      chave de idempotência também), então a nova data podia ficar sem
//      lembrete. Aqui: zera as colunas e sobe metadata.reagendamento_seq,
//      que entra na chave de idempotência do automated-notifications.
//
//   3. CONFIRMAÇÃO: a confirmação sai uma vez só, na compra, com a data
//      antiga. Aqui: manda a confirmação de novo (WhatsApp + e-mail) com a
//      data/horário/local NOVOS. WhatsApp usa o mesmo template aprovado da
//      confirmação, com chave própria por reagendamento (não repete se a
//      admin salvar duas vezes a mesma troca).
//
// As RPCs de vaga só têm grant pra service_role — por isso roda aqui e
// não no admin.js.
//
// SEGURANÇA: só ADMIN (mesmo esquema do admin-set-aguardando-experiencia).
// Deploy COM verify_jwt.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  bookingConfirmationEmailHtml,
  isCustomerMessagingSuppressed,
  sendEmail,
} from "../_shared/email.ts";
import {
  bookingConfirmationTemplateParams,
  bookingConfirmationWhatsAppText,
  experienceImageUrl,
  gatedSendWhatsApp,
} from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

function holdsInventory(status: unknown): boolean {
  return status === "pending" || status === "pago";
}

// Horário comparável: "10h00 – 12h00" == "10h00-12h00" == "10H00 — 12H00".
// Mesma normalização do religamento em sql/elarah_fix_vagas_turma_recriada.sql.
function normHorario(v: unknown): string {
  return String(v ?? "").replace(/[–—]/g, "-").replace(/[\s-]/g, "").toLowerCase();
}

// Hora de início ("10h00 – 12h00" → "10:00"), pra casar quando a admin
// digitou o horário de um jeito um pouco diferente do cadastrado.
function startHour(v: unknown): string | null {
  const head = String(v ?? "").split(/[–—\-]/)[0];
  const m = head.match(/(\d{1,2})(?:\s*[h:]\s*(\d{2}))?/i);
  if (!m) return null;
  return String(Number(m[1])).padStart(2, "0") + ":" + (m[2] ?? "00");
}

// "24/09", "24/09/2026", "24/9/26" → { d, m, y|null }
function parseData(v: unknown): { d: number; m: number; y: number | null } | null {
  const m = String(v ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const y = m[3] ? (Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3])) : null;
  return { d: Number(m[1]), m: Number(m[2]), y };
}

function mesmaData(a: unknown, b: unknown): boolean {
  const pa = parseData(a), pb = parseData(b);
  if (!pa || !pb) return String(a ?? "").trim() === String(b ?? "").trim();
  if (pa.d !== pb.d || pa.m !== pb.m) return false;
  return pa.y == null || pb.y == null || pa.y === pb.y;
}

// Data (fuso de SP) de um timestamptz.
function spDate(ts: unknown): { d: number; m: number; y: number } | null {
  const t = new Date(String(ts ?? "")).getTime();
  if (!Number.isFinite(t)) return null;
  const sp = new Date(t - 3 * 3600_000); // SP = UTC-3 (sem horário de verão)
  return { d: sp.getUTCDate(), m: sp.getUTCMonth() + 1, y: sp.getUTCFullYear() };
}

// deno-lint-ignore no-explicit-any
type SB = any;

// Acha a turma (experience_slots) da data/horário novos. Regra: só casa com
// certeza — data tem que bater; se houver mais de uma turma no dia, o
// horário decide. Na dúvida devolve null (a reserva fica sem turma e conta
// no contador da experiência, como qualquer reserva sem slot).
async function matchSlot(
  sb: SB,
  experienciaId: string,
  data: unknown,
  horario: unknown,
): Promise<string | null> {
  const alvo = parseData(data);
  if (!experienciaId || !alvo) return null;
  const { data: rows, error } = await sb
    .from("experience_slots")
    .select("id, data, horario, event_at, is_active")
    .eq("experience_id", experienciaId);
  if (error || !Array.isArray(rows)) return null;

  const doDia = rows.filter((s: { data?: unknown; event_at?: unknown; is_active?: unknown }) => {
    if (s.is_active === false) return false;
    const ev = s.event_at ? spDate(s.event_at) : null;
    if (ev) {
      return ev.d === alvo.d && ev.m === alvo.m && (alvo.y == null || ev.y === alvo.y);
    }
    return mesmaData(s.data, data);
  });
  if (doDia.length === 0) return null;
  if (doDia.length === 1) return doDia[0].id;

  const k = normHorario(horario);
  const exato = doDia.filter((s: { horario?: unknown }) => normHorario(s.horario) === k);
  if (exato.length >= 1) return exato[0].id;
  const h = startHour(horario);
  const porInicio = h ? doDia.filter((s: { horario?: unknown }) => startHour(s.horario) === h) : [];
  if (porInicio.length >= 1) return porInicio[0].id;
  return null;
}

async function liberar(sb: SB, slotId: string | null, expId: string | null, qty: number) {
  if (slotId) {
    const { error } = await sb.rpc("increment_slot_vagas", { p_slot_id: slotId, p_qty: qty });
    if (error) throw error;
  } else if (expId) {
    const { error } = await sb.rpc("increment_experience_vagas", { p_experience_id: expId, p_qty: qty });
    if (error) throw error;
  }
}

// true = segurou; false = não havia vaga (ficou acima da lotação).
async function segurar(sb: SB, slotId: string | null, expId: string | null, qty: number): Promise<boolean> {
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  if (!admin) {
    console.error("[admin-reagendar] env ausente (SUPABASE_URL/SERVICE_ROLE)");
    return json({ ok: false, error: "server_misconfigured" }, 500);
  }

  // ===== 1. Autoriza: precisa ser admin =====
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "missing_token", message: "Faça login como admin." }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller?.id) {
    return json({ ok: false, error: "invalid_token", message: "Sessão expirada. Faça login de novo." }, 401);
  }
  const { data: prof, error: profErr } = await admin
    .from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (profErr) return json({ ok: false, error: "authz_check_failed" }, 500);
  if (!prof || prof.role !== "admin") {
    return json({ ok: false, error: "forbidden", message: "Só admin pode usar isto." }, 403);
  }

  // ===== 2. Body =====
  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  const bookingId = String(payload.booking_id ?? "").trim();
  if (!bookingId) return json({ ok: false, error: "missing_booking_id" }, 400);
  const ant = (payload.anterior && typeof payload.anterior === "object")
    ? payload.anterior as Record<string, unknown>
    : {};
  const enviarConfirmacao = payload.enviar_confirmacao !== false;

  // ===== 3. Reserva (já com os dados novos gravados pelo painel) =====
  const { data: booking, error: readErr } = await admin
    .from("bookings").select("*, experiences(imagem)").eq("id", bookingId).maybeSingle();
  if (readErr) return json({ ok: false, error: "db_error", detail: readErr.message }, 500);
  if (!booking) return json({ ok: false, error: "booking_not_found" }, 404);
  // deno-lint-ignore no-explicit-any
  const bk = booking as any;
  const meta = (bk.metadata && typeof bk.metadata === "object") ? { ...bk.metadata } : {};

  const expAnterior = String(ant.experiencia_id ?? bk.experiencia_id ?? "") || null;
  const qtyAnterior = Math.max(1, Number(ant.quantidade ?? bk.quantidade) || 1);
  const qtyNova = Math.max(1, Number(bk.quantidade) || 1);

  const mudouEvento = expAnterior !== (bk.experiencia_id ?? null) ||
    !mesmaData(ant.data, bk.data) ||
    normHorario(ant.horario) !== normHorario(bk.horario);
  const mudouQty = qtyAnterior !== qtyNova;

  if (!mudouEvento && !mudouQty) {
    return json({ ok: true, unchanged: true });
  }

  const warnings: string[] = [];

  // ===== 4. Vagas =====
  const slotAntigo: string | null = bk.slot_id ?? null;
  const slotNovo: string | null = mudouEvento
    ? await matchSlot(admin, bk.experiencia_id, bk.data, bk.horario)
    : slotAntigo;
  // Reserva "aguardando experiência" com a vaga já devolvida: não mexe em
  // estoque (a vaga já voltou). Só religa o slot_id — ao desligar o
  // "aguardando", a vaga é re-segurada na turma NOVA.
  const vagaLiberada = meta.aguardando_experiencia_vaga_liberada === true;
  const mexeEstoque = holdsInventory(bk.status) && !vagaLiberada &&
    (slotAntigo !== slotNovo || expAnterior !== bk.experiencia_id || mudouQty);

  let vagaDevolvida = false;
  let vagaSegurada = false;
  if (mexeEstoque) {
    try {
      await liberar(admin, slotAntigo, slotAntigo ? null : expAnterior, qtyAnterior);
      vagaDevolvida = true;
    } catch (e) {
      console.error("[admin-reagendar] falha ao devolver vaga", bookingId, String((e as { message?: string })?.message ?? e));
      warnings.push("Não consegui devolver a vaga da data antiga automaticamente (a varredura de 10 min corrige).");
    }
    try {
      vagaSegurada = await segurar(admin, slotNovo, slotNovo ? null : bk.experiencia_id, qtyNova);
      if (!vagaSegurada) {
        warnings.push("A nova data não tinha vaga livre — a reserva foi mantida, mas a turma ficou acima da lotação.");
      }
    } catch (e) {
      console.error("[admin-reagendar] falha ao segurar vaga", bookingId, String((e as { message?: string })?.message ?? e));
      warnings.push("Não consegui tirar a vaga da nova data automaticamente (a varredura de 10 min corrige).");
    }
  }
  if (mudouEvento && !slotNovo) {
    warnings.push("Não achei essa data/horário entre as turmas cadastradas da experiência — a reserva ficou sem turma (conta no total da experiência).");
  }

  // ===== 5. Persiste: slot novo, lembrete/feedback liberados, histórico =====
  const update: Record<string, unknown> = {};
  if (mudouEvento) {
    update.slot_id = slotNovo;
    update.reminder_48h_sent_at = null;
    update.feedback_whatsapp_sent_at = null;
    const seq = (Number(meta.reagendamento_seq) || 0) + 1;
    meta.reagendamento_seq = seq;
  }
  const hist = Array.isArray(meta.reagendamento_history) ? meta.reagendamento_history.slice() : [];
  hist.push({
    at: new Date().toISOString(),
    by: caller.id,
    by_email: caller.email ?? null,
    from: { experiencia_id: expAnterior, data: ant.data ?? null, horario: ant.horario ?? null, quantidade: qtyAnterior, slot_id: slotAntigo },
    to: { experiencia_id: bk.experiencia_id, data: bk.data, horario: bk.horario, quantidade: qtyNova, slot_id: slotNovo },
    vaga_devolvida: vagaDevolvida,
    vaga_segurada: vagaSegurada,
  });
  meta.reagendamento_history = hist;
  update.metadata = meta;

  const { error: updErr } = await admin.from("bookings").update(update).eq("id", bookingId);
  if (updErr) {
    console.error("[admin-reagendar] erro ao salvar", bookingId, updErr.message);
    return json({ ok: false, error: "update_failed", detail: updErr.message, warnings }, 500);
  }

  // ===== 6. Nova confirmação pro cliente (data nova) =====
  const confirmacao: Record<string, unknown> = { whatsapp: null, email: null };
  const suprimida = isCustomerMessagingSuppressed({ ...bk, metadata: meta });
  if (mudouEvento && enviarConfirmacao && bk.status === "pago" && !suprimida) {
    const dados = {
      nome: bk.nome,
      experienciaNome: bk.experiencia_nome ?? "Sua experiência",
      data: bk.data,
      horario: bk.horario,
      endereco: (meta.endereco as string | null) ?? null,
      bairro: (meta.bairro as string | null) ?? null,
    };
    try {
      const texto = bookingConfirmationWhatsAppText({ ...dados, quantidade: qtyNova });
      const wa = await gatedSendWhatsApp(admin, {
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
        createdBy: caller.id,
      });
      confirmacao.whatsapp = wa.sent ? "enviado" : (wa.reason ?? wa.error ?? "nao_enviado");
    } catch (e) {
      console.error("[admin-reagendar] WhatsApp falhou", bookingId, String(e));
      confirmacao.whatsapp = "erro";
    }

    if (bk.email) {
      try {
        const html = bookingConfirmationEmailHtml({
          ...dados,
          prazoRemarcacaoHoras: (meta.politica_remarcacao_horas as number | null) ?? null,
          precoLabel: bk.preco_label,
          quantidade: qtyNova,
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
        confirmacao.email = r.ok ? "enviado" : "erro";
      } catch (e) {
        console.error("[admin-reagendar] e-mail falhou", bookingId, String(e));
        confirmacao.email = "erro";
      }
    } else {
      confirmacao.email = "sem_email";
    }
  } else if (mudouEvento && enviarConfirmacao) {
    confirmacao.whatsapp = confirmacao.email = suprimida ? "aguardando_experiencia" : "status_" + bk.status;
  }

  console.info(
    "[admin-reagendar] ok",
    "booking=" + bookingId,
    "slot=" + (slotAntigo ?? "-") + "→" + (slotNovo ?? "-"),
    "confirmacao=" + JSON.stringify(confirmacao),
    warnings.length ? "warnings=" + warnings.join(" | ") : "",
  );
  return json({
    ok: true,
    slot_anterior: slotAntigo,
    slot_novo: slotNovo,
    vaga_devolvida: vagaDevolvida,
    vaga_segurada: vagaSegurada,
    confirmacao,
    warnings,
  });
});
