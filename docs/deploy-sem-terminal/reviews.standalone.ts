// =============================================================
// ELARAH — reviews (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// Sistema de avaliações reais. Três funções num arquivo só:
//   • POST mode "submit"  (público, validado por token) → cliente
//       que viveu a experiência manda nota (1-5) + comentário.
//       booking_id = compra do site · sale_id = EVENTO fechado
//       (venda manual com is_event).
//   • POST mode "request" (cron) → acha quem viveu a experiência ou
//       o evento nos últimos dias e ainda não foi convidado, e manda
//       o e-mail "como foi? deixe sua avaliação" com link único.
//   • POST mode "link"    (admin logado) → devolve o link tokenizado
//       de uma reserva ou de um evento, pra aba Feedbacks do painel
//       mandar no WhatsApp na mão. O token é HMAC com segredo do
//       servidor, então o painel não tem como montar sozinho.
//
// DESLIGUE "Verify JWT" nas Settings (submit é público com token;
// o mode "link" valida o admin por conta própria).
// Pré-requisitos (SQL): elarah_reviews.sql, elarah_reviews_eventos.sql.
// Secrets: SUPABASE_* (auto), RESEND_API_KEY, ELARAH_FROM_EMAIL (opc),
//   CRON_SECRET (opc), BROADCAST_SECRET (opc — assina o token).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ELARAH_FROM_EMAIL") ?? "Elarah <contato@elarah.com.br>";
const FALLBACK_FROM = "Elarah <onboarding@resend.dev>";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const SECRET = Deno.env.get("BROADCAST_SECRET") || CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY || "elarah-fallback-secret";
const SITE = "https://elarah.com.br";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let _svc: SupabaseClient | null = null;
function sbc(): SupabaseClient {
  if (_svc) return _svc;
  _svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return _svc;
}

async function hmacHex(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Reserva do site: "review:<id>" — como sempre foi (links antigos
// continuam valendo). Evento fechado: "review:sale:<id>", namespace
// próprio pra um id nunca abrir a porta do outro.
function tokenFor(bookingId: string): Promise<string> {
  return hmacHex("review:" + bookingId);
}
function tokenForSale(saleId: string): Promise<string> {
  return hmacHex("review:sale:" + saleId);
}

function linkAvaliacao(kind: "booking" | "evento", id: string, token: string): string {
  const p = kind === "evento" ? "v" : "b";
  return `${SITE}/avaliar.html?${p}=${encodeURIComponent(id)}&t=${token}`;
}

// Evento fechado = venda manual marcada como evento. Mesma regra do
// painel (admin-eventos-privados.js): is_event manda; sem ele, 3+
// pessoas ou um tipo de evento preenchido.
function isEventoSale(s: { is_event?: boolean | null; quantity?: number | null; event_type?: string | null }): boolean {
  if (s.is_event === false) return false;
  if (s.is_event === true) return true;
  return Number(s.quantity ?? 0) >= 3 || !!s.event_type;
}

function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ---- data do evento (mesma regra do site) ----
function parseStartHour(raw: string): { hh: number; mm: number } | null {
  if (!raw) return null;
  const head = String(raw).split(/[–—\-]/)[0].trim();
  const m = head.match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})/i);
  if (!m) return null;
  const hh = Number(m[1]), mm = m[2] ? Number(m[2]) : 0;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}
function deriveEventTs(dataStr: string | null, horarioStr: string | null, nowMs: number): number | null {
  if (!dataStr) return null;
  const m = String(dataStr).trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const year = m[3] ? (Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3])) : new Date(nowMs).getUTCFullYear();
  const h = parseStartHour(horarioStr || "");
  if (!h) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h.hh)}:${pad(h.mm)}:00-03:00`).getTime();
  return Number.isFinite(ts) ? ts : null;
}

// Data do evento fechado: slot_date é date (YYYY-MM-DD) e slot_time
// texto livre ("19h", "19h00 – 22h"). Sem horário, assume meio-dia —
// o que importa aqui é só saber se o dia já passou.
function saleEventTs(slotDate: string | null, slotTime: string | null): number | null {
  if (!slotDate) return null;
  const d = String(slotDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!d) return null;
  const h = parseStartHour(slotTime || "");
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = new Date(`${d[1]}-${d[2]}-${d[3]}T${pad(h ? h.hh : 12)}:${pad(h ? h.mm : 0)}:00-03:00`).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function requestEmailHtml(nome: string, expNome: string, link: string, ehEvento = false): string {
  const ola = nome ? `Oi, ${esc(nome.split(/\s+/)[0])}!` : "Oi!";
  const pergunta = ehEvento
    ? `Como foi o seu evento <strong>${esc(expNome)}</strong>?`
    : `Como foi a sua experiência <strong>${esc(expNome)}</strong>?`;
  const stars = [1, 2, 3, 4, 5].map((n) =>
    `<a href="${link}&nota=${n}" style="text-decoration:none;font-size:30px;color:#f0a05e;">★</a>`
  ).join(" ");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06);">
      <tr><td style="padding:28px 34px 16px;text-align:center;background:linear-gradient(135deg,#f6d5a8,#f0a05e);">
        <div style="font-family:Georgia,serif;color:#1a1a1a;font-size:24px;">Elarah</div></td></tr>
      <tr><td style="padding:28px 34px;text-align:center;">
        <p style="margin:0 0 8px;font-size:16px;color:#2a2a2a;">${ola}</p>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#444;">${pergunta}</p>
        <p style="margin:0 0 16px;font-size:14px;color:#777;">Leva 20 segundos e ajuda demais quem está pensando em viver isso também. 🧡</p>
        <div style="margin:6px 0 18px;">${stars}</div>
        <a href="${link}" style="display:inline-block;background:#f0a05e;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:999px;">Deixar minha avaliação</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  async function post(from: string) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    return { ok: r.ok, status: r.status, body: r.ok ? "" : await r.text().catch(() => "") };
  }
  let a = await post(FROM);
  if (!a.ok && (a.status === 403 || /domain|verify|from address/i.test(a.body))) a = await post(FALLBACK_FROM);
  return a.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "Use POST." }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: {
    mode?: string;
    booking_id?: string;
    sale_id?: string;
    kind?: string;
    id?: string;
    token?: string;
    nota?: number;
    comentario?: string;
  } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const sb = sbc();

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // ---------- LINK: painel pede o link tokenizado (só admin) ----------
  // A aba Feedbacks manda o pedido de avaliação na mão (WhatsApp), e o
  // token é HMAC com segredo do servidor — o navegador não tem como
  // assinar. Então o painel pede aqui, provando que é admin.
  if (body.mode === "link") {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ ok: false, error: "Faça login como admin." }, 401);
    const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
    const caller = userData?.user;
    if (userErr || !caller?.id) return json({ ok: false, error: "Sessão expirada. Faça login de novo." }, 401);
    const { data: prof } = await sb.from("profiles").select("role").eq("id", caller.id).maybeSingle();
    if (!prof || prof.role !== "admin") return json({ ok: false, error: "Só admin pode gerar link de avaliação." }, 403);

    const id = String(body.id || body.sale_id || body.booking_id || "").trim();
    if (!id) return json({ ok: false, error: "Faltou o id." }, 400);
    const ehEvento = body.kind === "evento" || (!body.booking_id && !!body.sale_id);

    if (ehEvento) {
      const { data: sale } = await sb.from("manual_sales")
        .select("id, customer_name, experience_name, event_type, event_type_custom, is_event, quantity")
        .eq("id", id).maybeSingle();
      if (!sale) return json({ ok: false, error: "Evento não encontrado." }, 404);
      if (!isEventoSale(sale)) return json({ ok: false, error: "Esta venda não está marcada como evento." }, 400);
      const token = await tokenForSale(sale.id);
      return json({
        ok: true, kind: "evento", id: sale.id,
        link: linkAvaliacao("evento", sale.id, token),
        cliente: sale.customer_name ?? null,
        experiencia: sale.experience_name ?? null,
      });
    }

    const { data: bk } = await sb.from("bookings").select("id, nome, experiencia_nome").eq("id", id).maybeSingle();
    if (!bk) return json({ ok: false, error: "Reserva não encontrada." }, 404);
    const token = await tokenFor(bk.id);
    return json({
      ok: true, kind: "booking", id: bk.id,
      link: linkAvaliacao("booking", bk.id, token),
      cliente: bk.nome ?? null,
      experiencia: bk.experiencia_nome ?? null,
    });
  }

  // ---------- SUBMIT: cliente envia avaliação (público, token) ----------
  if (body.mode !== "request") {
    const saleId = String(body.sale_id || "").trim();
    const bookingId = String(body.booking_id || "").trim();
    const token = String(body.token || "").trim();
    const nota = Math.round(Number(body.nota));
    const comentario = String(body.comentario || "").trim().slice(0, 1000);
    if ((!bookingId && !saleId) || !token) return json({ ok: false, error: "Link inválido." }, 400);
    if (!(nota >= 1 && nota <= 5)) return json({ ok: false, error: "Escolha uma nota de 1 a 5." }, 400);

    // ---- Evento fechado (venda manual) ----
    if (saleId && !bookingId) {
      if (token !== (await tokenForSale(saleId))) return json({ ok: false, error: "Link inválido ou expirado." }, 401);

      const { data: sale } = await sb.from("manual_sales")
        .select("id, customer_name, experience_id, experience_name, event_type, event_type_custom, is_event, quantity")
        .eq("id", saleId).maybeSingle();
      if (!sale) return json({ ok: false, error: "Evento não encontrado." }, 404);
      if (!isEventoSale(sale)) return json({ ok: false, error: "Este link não é de um evento." }, 400);

      const { data: jaTem } = await sb.from("reviews").select("id").eq("manual_sale_id", saleId).maybeSingle();
      if (jaTem) return json({ ok: true, already: true, message: "Você já avaliou — obrigado!" });

      const primeiro = sale.customer_name ? String(sale.customer_name).split(/\s+/)[0] : null;
      const { error: insErr } = await sb.from("reviews").insert({
        manual_sale_id: sale.id,
        tipo: "evento",
        evento_tipo: sale.event_type_custom || sale.event_type || null,
        experiencia_id: sale.experience_id,
        experiencia_nome: sale.experience_name,
        nome: primeiro, nota, comentario: comentario || null, aprovado: true,
      });
      if (insErr) {
        // Coluna nova ausente = migração de eventos não rodou ainda.
        const falta = /manual_sale_id|tipo|evento_tipo/.test(insErr.message) && /column|schema cache/i.test(insErr.message);
        return json({
          ok: false,
          error: falta
            ? "Avaliação de evento ainda não está liberada no banco (rode sql/elarah_reviews_eventos.sql)."
            : "Não consegui salvar: " + insErr.message,
        }, 500);
      }
      return json({ ok: true, message: "Avaliação registrada. Obrigado! 🧡" });
    }

    // ---- Reserva do site ----
    if (token !== (await tokenFor(bookingId))) return json({ ok: false, error: "Link inválido ou expirado." }, 401);

    const { data: bk } = await sb.from("bookings").select("id, experiencia_id, experiencia_nome, nome, status").eq("id", bookingId).maybeSingle();
    if (!bk) return json({ ok: false, error: "Reserva não encontrada." }, 404);

    const { data: existing } = await sb.from("reviews").select("id").eq("booking_id", bookingId).maybeSingle();
    if (existing) return json({ ok: true, already: true, message: "Você já avaliou — obrigado!" });

    const nomePrimeiro = bk.nome ? String(bk.nome).split(/\s+/)[0] : null;
    const { error: insErr } = await sb.from("reviews").insert({
      booking_id: bookingId, experiencia_id: bk.experiencia_id, experiencia_nome: bk.experiencia_nome,
      nome: nomePrimeiro, nota, comentario: comentario || null, aprovado: true,
    });
    if (insErr) return json({ ok: false, error: "Não consegui salvar: " + insErr.message }, 500);
    return json({ ok: true, message: "Avaliação registrada. Obrigado! 🧡" });
  }

  // ---------- REQUEST: cron manda os pedidos de avaliação ----------
  const auth = req.headers.get("Authorization") || "";
  const tk = /^Bearer\s+(.+)$/i.exec(auth)?.[1] || "";
  const okAuth = (CRON_SECRET && tk === CRON_SECRET) || (SUPABASE_SERVICE_ROLE_KEY && tk === SUPABASE_SERVICE_ROLE_KEY);
  if (!okAuth) return new Response(JSON.stringify({ ok: false, error: "Não autorizado (request é só cron)." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const now = Date.now();
  const desde = new Date(now - 21 * 86400000).toISOString();
  // Reservas pagas recentes, sem pedido de avaliação ainda.
  // NOTA: depende da coluna aguardando_experiencia (migração
  // sql/elarah_bookings_aguardando_experiencia.sql). Rode a migração ANTES
  // de re-deployar esta função. Reservas "aguardando experiência" (cliente
  // desmarcou sem reembolso) NÃO recebem o pedido de avaliação.
  const { data: bks, error } = await sb.from("bookings")
    .select("id, email, nome, experiencia_nome, data, horario, status, aguardando_experiencia, created_at, review_request_sent_at")
    .eq("status", "pago").eq("aguardando_experiencia", false).is("review_request_sent_at", null).gte("created_at", desde).limit(500);
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let enviados = 0;
  for (const b of (bks ?? [])) {
    // Defesa extra além do filtro SQL: nunca manda avaliação pra reserva
    // aguardando experiência.
    if (b.aguardando_experiencia === true) continue;
    const ts = deriveEventTs(b.data, b.horario, now);
    // Já aconteceu (entre 12h e 14 dias atrás). Sem data derivável: usa
    // created_at + 2 dias como aproximação.
    const eventTs = ts != null ? ts : (new Date(b.created_at).getTime() + 2 * 86400000);
    if (!(eventTs < now - 12 * 3600000 && eventTs > now - 14 * 86400000)) continue;
    if (!b.email) continue;
    const token = await tokenFor(b.id);
    const link = `${SITE}/avaliar.html?b=${encodeURIComponent(b.id)}&t=${token}`;
    const ok = await sendEmail(b.email, "Como foi sua experiência na Elarah? 🧡", requestEmailHtml(b.nome || "", b.experiencia_nome || "sua experiência", link));
    if (ok) {
      enviados++;
      await sb.from("bookings").update({ review_request_sent_at: new Date().toISOString() }).eq("id", b.id);
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  // ---- Eventos fechados (vendas manuais) ----
  // Mesma regra da experiência, só que a data do evento é slot_date +
  // slot_time e o convite fala "seu evento". Se a migração de eventos
  // ainda não rodou, a coluna não existe: o bloco sai de fininho e o
  // pedido das experiências segue funcionando.
  let eventosCandidatos = 0;
  let eventosEnviados = 0;
  let eventosErro: string | null = null;

  const { data: sales, error: salesErr } = await sb.from("manual_sales")
    .select("id, customer_name, customer_email, experience_name, slot_date, slot_time, quantity, event_type, is_event, payment_status, created_at, review_request_sent_at")
    .eq("payment_status", "pago").is("review_request_sent_at", null).gte("created_at", desde).limit(500);

  if (salesErr) {
    eventosErro = salesErr.message;
    console.warn("[reviews] eventos ignorados:", salesErr.message);
  } else {
    for (const v of (sales ?? [])) {
      if (!isEventoSale(v)) continue;
      if (!v.customer_email) continue;
      const base = saleEventTs(v.slot_date, v.slot_time);
      const eventTs = base != null ? base : (new Date(v.created_at).getTime() + 2 * 86400000);
      if (!(eventTs < now - 12 * 3600000 && eventTs > now - 14 * 86400000)) continue;
      eventosCandidatos++;
      const token = await tokenForSale(v.id);
      const link = linkAvaliacao("evento", v.id, token);
      const ok = await sendEmail(
        v.customer_email,
        "Como foi o seu evento na Elarah? 🧡",
        requestEmailHtml(v.customer_name || "", v.experience_name || "seu evento", link, true),
      );
      if (ok) {
        eventosEnviados++;
        await sb.from("manual_sales").update({ review_request_sent_at: new Date().toISOString() }).eq("id", v.id);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    mode: "request",
    candidatos: (bks ?? []).length,
    enviados,
    eventos_candidatos: eventosCandidatos,
    eventos_enviados: eventosEnviados,
    eventos_erro: eventosErro,
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
