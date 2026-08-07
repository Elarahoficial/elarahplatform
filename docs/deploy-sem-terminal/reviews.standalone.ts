// =============================================================
// ELARAH — reviews (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// Sistema de avaliações reais. Três modos num arquivo só:
//   • POST mode "submit"  (público, validado por token) → cliente
//       que viveu a experiência manda nota (1-5) + comentário.
//   • POST mode "request" (cron) → acha quem viveu a experiência
//       nos últimos dias e ainda não foi convidado, e manda o
//       e-mail "como foi? deixe sua avaliação" com link único.
//   • POST mode "link"    (admin) → devolve pra admin o link único
//       (avaliar.html?b=&t=) de UMA reserva, pra enviar manualmente
//       (WhatsApp etc.) e o cliente avaliar no site.
//
// DESLIGUE "Verify JWT" nas Settings (submit é público com token).
// Pré-requisitos (SQL): elarah_reviews.sql.
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

async function tokenFor(bookingId: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("review:" + bookingId));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
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

function requestEmailHtml(nome: string, expNome: string, link: string): string {
  const ola = nome ? `Oi, ${esc(nome.split(/\s+/)[0])}!` : "Oi!";
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
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#444;">Como foi a sua experiência <strong>${esc(expNome)}</strong>?</p>
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

  let body: { mode?: string; booking_id?: string; token?: string; nota?: number; comentario?: string } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const sb = sbc();

  // ---------- LINK: admin pega o link de avaliação de uma reserva ----------
  // Devolve pra admin o MESMO link único (avaliar.html?b=&t=) que o cron
  // manda por e-mail, pra ela poder enviar manualmente (WhatsApp etc.) e o
  // cliente avaliar no site. Só ADMIN: valida o access token do caller e
  // confere profiles.role === 'admin' (a função roda com Verify JWT OFF, por
  // isso a checagem é feita aqui dentro).
  if (body.mode === "link") {
    const auth = req.headers.get("Authorization") || "";
    const callerToken = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim() || "";
    if (!callerToken) return new Response(JSON.stringify({ ok: false, error: "Faça login como admin." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: userData, error: userErr } = await sb.auth.getUser(callerToken);
    const caller = userData?.user;
    if (userErr || !caller?.id) return new Response(JSON.stringify({ ok: false, error: "Sessão expirada. Faça login de novo." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: prof } = await sb.from("profiles").select("role").eq("id", caller.id).maybeSingle();
    if (!prof || prof.role !== "admin") return new Response(JSON.stringify({ ok: false, error: "Só admin pode gerar o link." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const bookingId = String(body.booking_id || "").trim();
    if (!bookingId) return new Response(JSON.stringify({ ok: false, error: "booking_id obrigatório." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: bk } = await sb.from("bookings").select("id, experiencia_nome, nome, data").eq("id", bookingId).maybeSingle();
    if (!bk) return new Response(JSON.stringify({ ok: false, error: "Reserva não encontrada." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const linkToken = await tokenFor(bookingId);
    const link = `${SITE}/avaliar.html?b=${encodeURIComponent(bookingId)}&t=${linkToken}`;
    return new Response(JSON.stringify({ ok: true, link, booking: { experiencia_nome: bk.experiencia_nome, nome: bk.nome, data: bk.data } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ---------- SUBMIT: cliente envia avaliação (público, token) ----------
  if (body.mode !== "request") {
    const bookingId = String(body.booking_id || "").trim();
    const token = String(body.token || "").trim();
    const nota = Math.round(Number(body.nota));
    const comentario = String(body.comentario || "").trim().slice(0, 1000);
    if (!bookingId || !token) return new Response(JSON.stringify({ ok: false, error: "Link inválido." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!(nota >= 1 && nota <= 5)) return new Response(JSON.stringify({ ok: false, error: "Escolha uma nota de 1 a 5." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (token !== (await tokenFor(bookingId))) return new Response(JSON.stringify({ ok: false, error: "Link inválido ou expirado." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: bk } = await sb.from("bookings").select("id, experiencia_id, experiencia_nome, nome, status").eq("id", bookingId).maybeSingle();
    if (!bk) return new Response(JSON.stringify({ ok: false, error: "Reserva não encontrada." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: existing } = await sb.from("reviews").select("id").eq("booking_id", bookingId).maybeSingle();
    if (existing) return new Response(JSON.stringify({ ok: true, already: true, message: "Você já avaliou — obrigado!" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const nomePrimeiro = bk.nome ? String(bk.nome).split(/\s+/)[0] : null;
    const { error: insErr } = await sb.from("reviews").insert({
      booking_id: bookingId, experiencia_id: bk.experiencia_id, experiencia_nome: bk.experiencia_nome,
      nome: nomePrimeiro, nota, comentario: comentario || null, aprovado: true,
    });
    if (insErr) return new Response(JSON.stringify({ ok: false, error: "Não consegui salvar: " + insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, message: "Avaliação registrada. Obrigado! 🧡" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
  return new Response(JSON.stringify({ ok: true, mode: "request", candidatos: (bks ?? []).length, enviados }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
