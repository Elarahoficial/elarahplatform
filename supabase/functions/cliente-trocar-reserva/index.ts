// =============================================================
// ELARAH — cliente-trocar-reserva Edge Function
// -------------------------------------------------------------
// POST /functions/v1/cliente-trocar-reserva   (JWT da cliente logada)
//
//   { acao: "trocar", booking_id, experiencia_id, slot_id?, data?, horario? }
//      → troca a reserva pela MESMA experiência em outra data ou por
//        OUTRA experiência (mesmo parceiro ou não).
//
//   { acao: "reembolso", booking_id, motivo? }
//      → só REGISTRA o pedido (a cliente fala com a Elarah no WhatsApp).
//        Serve pra o pedido aparecer na aba "Trocas e reembolsos".
//
// PARA QUE SERVE
// --------------
// A troca de data chegava toda pelo WhatsApp. Agora a cliente faz sozinha
// em "Minhas compras" e a Elarah só avisa a(s) parceira(s) pela aba
// "Trocas e reembolsos" do painel (um clique abre o WhatsApp pronto).
//
// REGRAS (todas conferidas AQUI — o front só mostra):
//   1. A reserva é dela (bookings.user_id = quem chamou), está paga e não
//      está "aguardando experiência".
//   2. PRAZO da reserva atual: faltam mais horas do que o prazo de
//      remarcação sem custo congelado na compra
//      (metadata.politica_remarcacao_horas — bartenderia 5 dias,
//      gastronomia 72h, demais 48h). Reserva antiga sem o campo: prazo da
//      categoria da experiência, nunca menos de 48h.
//   3. A NOVA data está à venda no site: experiência ativa e não arquivada,
//      turma ativa, antes do encerramento de vendas (cutoff) e com vaga
//      pra quantidade da reserva.
//   4. Só UMA remarcação pela conta por reserva
//      (metadata.troca_cliente_feita_at).
//   5. OUTRA experiência: preço de tabela igual ou menor que o da compra
//      (mais cara → diferença a pagar, fala com a Elarah) e sem opções de
//      variação (Individual/Dupla, modelo de pintura…), que exigiriam uma
//      escolha que a tela de troca não faz. Agendamento livre (voucher) e
//      kits também ficam de fora.
//
// O QUE FAZ na troca: segura a vaga na turma nova (atômico — se esgotou no
// meio do caminho, nada muda), devolve a da antiga, atualiza a reserva
// (experiência, data, horário, turma, local, parceira e repasse quando
// mudou de experiência), libera lembrete/feedback pra data nova, grava a
// linha em trocas_reserva e reenvia a confirmação pra cliente.
//
// Deploy COM verify_jwt (chamada sempre da cliente logada).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { effectiveCutoffHours } from "../_shared/booking_guard.ts";
import { prazoRemarcacaoPorCategoria, PRAZO_REMARCACAO_PADRAO } from "../_shared/booking_policy.ts";
import {
  enviarConfirmacaoReagendamento,
  liberarVaga,
  segurarVaga,
} from "../_shared/reagendamento.ts";

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

function falha(error: string, message: string, status = 409) {
  return json({ ok: false, error, message }, status);
}

// deno-lint-ignore no-explicit-any
type Row = any;

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
function deriveTs(data: unknown, horario: unknown, nowMs: number): number | null {
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
function parsePrecoToCents(raw: unknown): number | null {
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

function fornecedorKey(nome: unknown): string {
  return String(nome ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function localDe(exp: Row | null, meta: Record<string, unknown>): string {
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!admin) {
    console.error("[cliente-trocar] env ausente (SUPABASE_URL/SERVICE_ROLE)");
    return json({ ok: false, error: "server_misconfigured" }, 500);
  }

  // ===== 1. Quem está chamando =====
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
  const bookingId = String(payload.booking_id ?? "").trim();
  if (!bookingId) return json({ ok: false, error: "missing_booking_id" }, 400);

  // ===== 2. Reserva: é dela e está paga =====
  const { data: booking, error: readErr } = await admin
    .from("bookings").select("*, experiences(imagem)").eq("id", bookingId).maybeSingle();
  if (readErr) return json({ ok: false, error: "db_error", detail: readErr.message }, 500);
  const bk = booking as Row;
  if (!bk || bk.user_id !== caller.id) {
    return falha("booking_not_found", "Não encontramos essa reserva na sua conta.", 404);
  }
  if (bk.status !== "pago") {
    return falha("booking_not_paid", "Só dá pra alterar reservas confirmadas.");
  }
  const meta: Record<string, unknown> = (bk.metadata && typeof bk.metadata === "object") ? { ...bk.metadata } : {};
  const qty = Math.max(1, Number(bk.quantidade) || 1);

  const { data: expAtualRow } = bk.experiencia_id
    ? await admin.from("experiences").select("*").eq("id", bk.experiencia_id).maybeSingle()
    : { data: null };
  const expAtual = expAtualRow as Row | null;

  // ===== Pedido de reembolso: só registra =====
  if (acao === "reembolso") {
    const { data: jaExiste } = await admin
      .from("trocas_reserva").select("id")
      .eq("booking_id", bookingId).eq("tipo", "reembolso").is("resolvido_at", null)
      .limit(1);
    if (Array.isArray(jaExiste) && jaExiste.length) return json({ ok: true, ja_registrado: true });
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
      de_fornecedor_nome: bk.fornecedor_nome ?? expAtual?.fornecedor_nome ?? null,
      de_endereco: localDe(expAtual, meta) || null,
      motivo: String(payload.motivo ?? "").slice(0, 500) || null,
    });
    if (insErr) {
      console.error("[cliente-trocar] erro registrando reembolso", bookingId, insErr.message);
      return json({ ok: false, error: "insert_failed" }, 500);
    }
    return json({ ok: true });
  }

  if (acao !== "trocar") return json({ ok: false, error: "acao_invalida" }, 400);

  if (bk.aguardando_experiencia === true || meta.aguardando_experiencia_vaga_liberada === true) {
    return falha("aguardando_experiencia", "Essa reserva já está com a equipe da Elarah. Fale com a gente no WhatsApp.");
  }

  // Remarcação pela conta vale UMA vez por reserva. Depois disso (ou se a
  // Elarah precisar mexer de novo), é pelo WhatsApp / painel.
  if (meta.troca_cliente_feita_at) {
    return falha("ja_remarcada", "Você já usou sua remarcação pela conta. Pra mudar de novo, fale com a gente no WhatsApp.");
  }

  // ===== 3. Prazo da reserva atual =====
  const now = Date.now();
  let inicioAtual: number | null = null;
  if (bk.slot_id) {
    const { data: slotAtual } = await admin
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

  // ===== 4. Experiência nova =====
  const novaExpId = String(payload.experiencia_id ?? "").trim();
  if (!novaExpId) return json({ ok: false, error: "missing_experiencia_id" }, 400);
  const { data: novaExpRow, error: expErr } = await admin
    .from("experiences").select("*").eq("id", novaExpId).maybeSingle();
  if (expErr) return json({ ok: false, error: "db_error", detail: expErr.message }, 500);
  const novaExp = novaExpRow as Row;
  if (!novaExp || novaExp.is_active === false || novaExp.arquivada === true) {
    return falha("experiencia_indisponivel", "Essa experiência não está mais disponível.");
  }
  const mesmaExp = novaExp.id === bk.experiencia_id;
  if (novaExp.horario_funcionamento && String(novaExp.horario_funcionamento).trim()) {
    return falha("agendamento_livre", "Essa experiência tem agendamento direto com o parceiro. Fale com a gente no WhatsApp.");
  }
  if (!mesmaExp) {
    if (isKit(novaExp)) return falha("kit", "Kits não entram na troca. Fale com a gente no WhatsApp.");
    if (temVariacoes(novaExp)) {
      return falha("tem_variacoes", "Essa experiência tem opções pra escolher. Fale com a gente no WhatsApp pra trocar por ela.");
    }
    const precoNovo = parsePrecoToCents(novaExp.preco);
    const precoAntigo = Math.max(
      parsePrecoToCents(bk.preco_label) ?? 0,
      Number(meta.unit_price_centavos) || 0,
    );
    if (!precoNovo || !precoAntigo || precoNovo > precoAntigo) {
      return falha("preco_maior", "Essa experiência custa mais que a sua. Fale com a gente no WhatsApp pra pagar a diferença.");
    }
  }

  // ===== 5. Turma nova: ativa, à venda e com vaga =====
  const cutoffH = effectiveCutoffHours(novaExp.categoria, novaExp.cutoff_hours);
  const slotIdNovo = payload.slot_id ? String(payload.slot_id).trim() : null;
  let novaData: string;
  let novoHorario: string;
  let inicioNovo: number | null;
  if (slotIdNovo) {
    const { data: slotRow } = await admin
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
    const { data: ativas } = await admin
      .from("experience_slots").select("id").eq("experience_id", novaExp.id).eq("is_active", true).limit(1);
    if (Array.isArray(ativas) && ativas.length) {
      return falha("turma_indisponivel", "Escolha uma das datas disponíveis.");
    }
    const horarios: string[] = (Array.isArray(novaExp.horarios) ? novaExp.horarios : [])
      .map((h: unknown) => String(h ?? "").trim()).filter(Boolean);
    if (novaExp.horario) horarios.push(String(novaExp.horario).trim());
    const pedido = String(payload.horario ?? "").trim();
    const escolhido = horarios.find((h) => normHorario(h) === normHorario(pedido));
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
  if (now + cutoffH * 3600_000 > inicioNovo) {
    return falha("turma_encerrada", "As vendas pra essa data já encerraram. Escolha outra.");
  }
  const slotIdAntigo: string | null = bk.slot_id ?? null;
  const mesmaTurma = mesmaExp && (
    slotIdNovo ? slotIdNovo === slotIdAntigo
      : (!slotIdAntigo && String(bk.data ?? "").trim() === novaData && normHorario(bk.horario) === normHorario(novoHorario))
  );
  if (mesmaTurma) return falha("mesma_data", "Essa já é a data da sua reserva.");

  // ===== 6. Vagas: segura a nova ANTES de soltar a antiga =====
  let segurou = false;
  try {
    segurou = await segurarVaga(admin, slotIdNovo, slotIdNovo ? null : novaExp.id, qty);
  } catch (e) {
    console.error("[cliente-trocar] falha ao segurar vaga", bookingId, String((e as { message?: string })?.message ?? e));
    return json({ ok: false, error: "vaga_erro", message: "Não conseguimos reservar a nova data agora. Tente de novo em instantes." }, 500);
  }
  if (!segurou) return falha("sem_vaga", "Essa data acabou de esgotar. Escolha outra.");

  let vagaAntigaDevolvida = false;
  try {
    await liberarVaga(admin, slotIdAntigo, slotIdAntigo ? null : (bk.experiencia_id ?? null), qty);
    vagaAntigaDevolvida = true;
  } catch (e) {
    // Não trava a troca: a varredura de 10 em 10 min (reconcile_all_vagas)
    // recalcula as vagas por slot_id e corrige a turma antiga.
    console.error("[cliente-trocar] falha ao devolver vaga antiga", bookingId, String((e as { message?: string })?.message ?? e));
  }

  // ===== 7. Atualiza a reserva =====
  const de = {
    experiencia_id: bk.experiencia_id ?? null,
    experiencia_nome: bk.experiencia_nome ?? null,
    data: bk.data ?? null,
    horario: bk.horario ?? null,
    quantidade: qty,
    slot_id: slotIdAntigo,
    fornecedor_nome: bk.fornecedor_nome ?? expAtual?.fornecedor_nome ?? null,
    local: localDe(expAtual, meta) || null,
  };
  const para = {
    experiencia_id: novaExp.id,
    experiencia_nome: novaExp.nome ?? bk.experiencia_nome ?? null,
    data: novaData,
    horario: novoHorario,
    quantidade: qty,
    slot_id: slotIdNovo,
    fornecedor_nome: mesmaExp ? de.fornecedor_nome : (novaExp.fornecedor_nome ?? null),
    local: localDe(novaExp, mesmaExp ? meta : {}) || null,
  };

  const update: Record<string, unknown> = {
    experiencia_id: para.experiencia_id,
    experiencia_nome: para.experiencia_nome,
    data: para.data,
    horario: para.horario,
    slot_id: para.slot_id,
    reminder_48h_sent_at: null,
    feedback_whatsapp_sent_at: null,
    // Botão "Avisar" da aba Compras volta a vermelho: a parceira ainda não
    // sabe da data nova (ou, se trocou de parceira, a nova nem sabe da reserva).
    fornecedor_avisado_at: null,
  };
  if (!mesmaExp) {
    update.fornecedor_nome = para.fornecedor_nome;
    update.fornecedor_id = novaExp.created_by ?? null;
    const fin = financeiro(novaExp, qty);
    if (fin) {
      update.valor_cheio_centavos = fin.cheio;
      update.valor_repasse_centavos = fin.repasse;
      update.valor_comissao_centavos = fin.comissao;
    }
    // Snapshot de repasse: mesma regra do painel — só reescreve quando é de
    // UMA parceira (com rateio entre várias, a Elarah acerta à mão).
    const repAtual = Array.isArray(bk.repasses) ? bk.repasses : [];
    if (repAtual.length <= 1) {
      update.repasses = para.fornecedor_nome && fin
        ? [{
          fornecedor_nome: para.fornecedor_nome,
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
  meta.reagendamento_seq = (Number(meta.reagendamento_seq) || 0) + 1;
  const agoraIso = new Date().toISOString();
  meta.troca_cliente_feita_at = agoraIso;
  const hist = Array.isArray(meta.reagendamento_history) ? meta.reagendamento_history.slice() : [];
  hist.push({
    at: agoraIso,
    by: caller.id,
    by_email: caller.email ?? null,
    origem: "cliente",
    from: { experiencia_id: de.experiencia_id, data: de.data, horario: de.horario, quantidade: qty, slot_id: de.slot_id },
    to: { experiencia_id: para.experiencia_id, data: para.data, horario: para.horario, quantidade: qty, slot_id: para.slot_id },
    vaga_devolvida: vagaAntigaDevolvida,
    vaga_segurada: true,
  });
  meta.reagendamento_history = hist;
  // Mesmo histórico que o "Editar reserva" do painel grava: é dele que a
  // aba Compras tira a mensagem "era dia X, passou pro dia Y" pra parceira.
  const editHist = Array.isArray(meta.admin_edit_history) ? meta.admin_edit_history.slice() : [];
  editHist.push({
    at: agoraIso,
    origem: "cliente",
    from: { nome: bk.nome, email: bk.email, experiencia_id: de.experiencia_id, experiencia_nome: de.experiencia_nome, data: de.data, horario: de.horario, quantidade: qty },
    to: { nome: bk.nome, email: bk.email, experiencia_id: para.experiencia_id, experiencia_nome: para.experiencia_nome, data: para.data, horario: para.horario, quantidade: qty },
  });
  meta.admin_edit_history = editHist;
  update.metadata = meta;

  // Trava otimista: só grava se a reserva não mudou desde a leitura. Dois
  // cliques seguidos (ou duas abas) não movem a vaga duas vezes.
  let updQuery = admin.from("bookings").update(update).eq("id", bookingId);
  if (bk.updated_at) updQuery = updQuery.eq("updated_at", bk.updated_at);
  const { data: updRows, error: updErr } = await updQuery.select("id");
  const conflito = !updErr && (!Array.isArray(updRows) || updRows.length === 0);
  if (updErr || conflito) {
    console.error("[cliente-trocar] erro ao salvar reserva", bookingId, updErr?.message ?? "conflito (reserva mudou no meio)");
    // Desfaz as vagas pra não deixar a turma nova ocupada à toa.
    try { await liberarVaga(admin, slotIdNovo, slotIdNovo ? null : novaExp.id, qty); } catch (_e) { /* varredura corrige */ }
    if (vagaAntigaDevolvida) {
      try { await segurarVaga(admin, slotIdAntigo, slotIdAntigo ? null : (bk.experiencia_id ?? null), qty); } catch (_e) { /* varredura corrige */ }
    }
    return conflito
      ? falha("conflito", "Sua reserva acabou de ser alterada. Recarregue a página e confira.")
      : json({ ok: false, error: "update_failed", message: "Não conseguimos salvar a troca. Tente de novo." }, 500);
  }

  // ===== 8. Registro pra aba "Trocas e reembolsos" =====
  const modalidade = mesmaExp
    ? "mesma_experiencia"
    : (de.fornecedor_nome && fornecedorKey(de.fornecedor_nome) === fornecedorKey(para.fornecedor_nome)
      ? "mesmo_parceiro"
      : "outro_parceiro");
  const { error: logErr } = await admin.from("trocas_reserva").insert({
    tipo: "troca",
    modalidade,
    booking_id: bookingId,
    user_id: caller.id,
    cliente_nome: bk.nome ?? null,
    cliente_email: bk.email ?? caller.email ?? null,
    cliente_telefone: (meta.telefone_digits as string | undefined) ?? bk.telefone ?? null,
    quantidade: qty,
    de_experiencia_id: de.experiencia_id,
    de_experiencia_nome: de.experiencia_nome,
    de_data: de.data,
    de_horario: de.horario,
    de_fornecedor_nome: de.fornecedor_nome,
    de_endereco: de.local,
    para_experiencia_id: para.experiencia_id,
    para_experiencia_nome: para.experiencia_nome,
    para_data: para.data,
    para_horario: para.horario,
    para_fornecedor_nome: para.fornecedor_nome,
    para_endereco: para.local,
  });
  if (logErr) {
    // A troca já valeu; sem o registro ela não aparece na aba, mas a aba
    // Compras mostra o "Avisar" em vermelho do mesmo jeito.
    console.error("[cliente-trocar] erro gravando trocas_reserva (rodou sql/elarah_trocas_reserva.sql?)", bookingId, logErr.message);
  }

  // ===== 9. Confirmação nova pra cliente =====
  const confirmacao = await enviarConfirmacaoReagendamento(
    admin,
    { ...bk, ...update, experiences: novaExp.imagem ? { imagem: novaExp.imagem } : bk.experiences },
    meta,
    { createdBy: caller.id, logTag: "cliente-trocar" },
  );

  console.info(
    "[cliente-trocar] ok",
    "booking=" + bookingId,
    "modalidade=" + modalidade,
    "de=" + de.experiencia_id + " " + de.data + " " + de.horario,
    "para=" + para.experiencia_id + " " + para.data + " " + para.horario,
    "confirmacao=" + JSON.stringify(confirmacao),
  );
  return json({
    ok: true,
    modalidade,
    reserva: { experiencia_nome: para.experiencia_nome, data: para.data, horario: para.horario },
    confirmacao,
  });
});
