// =============================================================
// ELARAH — auto-newsletter (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// Agente de newsletter automática (1x/semana, personalizada).
// Sozinho ele:
//   1) escolhe as experiências EM ALTA (mais vistas + vendidas);
//   2) monta o top por CATEGORIA;
//   3) manda pra cada cliente o que combina com o que ELE mais vê
//      (quem nunca logou recebe as "em alta" do geral);
//   4) respeita o limite grátis do Resend: o conteúdo fica fixo por
//      semana e o envio se espalha em lotes diários, sem repetir.
//
// Roda chamada por um cron DIÁRIO. Cria a campanha da semana na 1ª
// rodada de terça em diante; nos dias seguintes só continua a fila.
//
// DESLIGUE "Verify JWT" nas Settings (auth é feita por dentro).
// Pré-requisitos (SQL Editor): elarah_email_broadcasts.sql E
// elarah_newsletter.sql.
//
// Secrets: SUPABASE_* (auto), RESEND_API_KEY, ELARAH_FROM_EMAIL (opc),
//   CRON_SECRET (opc), BROADCAST_SECRET (opc — assina descadastro).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ELARAH_FROM_EMAIL") ?? "Elarah <contato@elarah.com.br>";
const FALLBACK_FROM = "Elarah <onboarding@resend.dev>";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const BROADCAST_SECRET =
  Deno.env.get("BROADCAST_SECRET") || CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY || "elarah-fallback-secret";
const SITE = "https://elarah.com.br";

// Quantos e-mails por DIA (plano grátis do Resend = ~100/dia).
const DAILY_CAP = 95;
// A newsletter da semana começa a sair a partir de TERÇA (ISO weekday 2).
const SEND_FROM_WEEKDAY = 2;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let _service: SupabaseClient | null = null;
function sbc(): SupabaseClient {
  if (_service) return _service;
  _service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

// ---------- Auth ----------
async function authorize(req: Request): Promise<{ ok: boolean }> {
  const auth = req.headers.get("Authorization");
  const m = auth ? /^Bearer\s+(.+)$/i.exec(auth) : null;
  if (!m) return { ok: false };
  const token = m[1];
  if (CRON_SECRET && token === CRON_SECRET) return { ok: true };
  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) return { ok: true };
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData?.user) return { ok: false };
  const { data: isAdmin } = await client.rpc("is_admin");
  return { ok: !!isAdmin };
}

// ---------- HMAC descadastro ----------
async function tokenFor(email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(BROADCAST_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
// O link de descadastro aponta pra função broadcast-email (GET).
function unsubBase(): string { return SUPABASE_URL + "/functions/v1/broadcast-email"; }

// ---------- Datas (semana ISO) ----------
function isoWeekKey(d: Date): string {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return dt.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}
function isoWeekday(d: Date): number { return d.getUTCDay() || 7; } // 1=seg ... 7=dom

// ---------- HTML ----------
function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function precoBR(raw: unknown): string {
  const s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  const mt = s.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*$/);
  if (!mt) return s;
  const n = parseFloat(mt[1].replace(/\./g, "").replace(/\s+/g, "").replace(",", "."));
  if (!isFinite(n)) return s;
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}
function imgUrl(raw: unknown): string {
  const s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return SITE + "/" + s.replace(/^\//, "");
}

interface Exp { id: string; nome: string; categoria: string; preco: string; imagem: string; }

function cardHtml(e: Exp): string {
  const img = imgUrl(e.imagem);
  const link = SITE + "/experiencia.html?id=" + encodeURIComponent(e.id);
  const imgBlock = img
    ? `<a href="${link}"><img src="${img}" alt="${esc(e.nome)}" width="100%" style="display:block;width:100%;height:170px;object-fit:cover;border-radius:12px 12px 0 0;"></a>`
    : `<a href="${link}" style="display:block;height:170px;border-radius:12px 12px 0 0;background:linear-gradient(135deg,#f6d5a8,#f0a05e);"></a>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #f0e6d8;border-radius:12px;overflow:hidden;margin:0 0 14px;">
    <tr><td>${imgBlock}</td></tr>
    <tr><td style="padding:13px 15px 16px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#a4663b;font-weight:700;">${esc(e.categoria)}</div>
      <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin:3px 0 8px;line-height:1.3;">${esc(e.nome)}</div>
      <table role="presentation" width="100%"><tr>
        <td style="font-size:15px;font-weight:700;color:#1a1a1a;">${esc(precoBR(e.preco))}</td>
        <td align="right"><a href="${link}" style="display:inline-block;background:#f0a05e;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:9px 18px;border-radius:999px;">Reservar</a></td>
      </tr></table>
    </td></tr>
  </table>`;
}

function newsletterHtml(intro: string, exps: Exp[], unsubUrl: string, nome: string | null): string {
  const ola = nome ? `Oi, ${esc(nome.split(/\s+/)[0])}! ` : "Oi! ";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:30px 0;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:26px 30px 16px;text-align:center;background:linear-gradient(135deg,#f6d5a8,#f0a05e);border-radius:18px 18px 0 0;">
        <div style="font-family:Georgia,serif;color:#1a1a1a;font-size:26px;">Elarah</div>
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a4a1e;margin-top:2px;">Experiências & presentes</div>
      </td></tr>
      <tr><td style="padding:22px 30px 6px;background:#fff;">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2a2a2a;">${ola}${esc(intro)}</p>
      </td></tr>
      <tr><td style="padding:0 30px;background:#fff;">
        ${exps.map(cardHtml).join("")}
      </td></tr>
      <tr><td style="padding:10px 30px 26px;background:#fff;text-align:center;">
        <a href="${SITE}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px;">Ver todas as experiências</a>
      </td></tr>
      <tr><td style="padding:16px 30px 24px;background:#fff;border-radius:0 0 18px 18px;border-top:1px solid #f0e6d8;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#a89a86;">
          Você recebe porque tem cadastro ou já comprou na Elarah.
          <a href="${unsubUrl}" style="color:#a89a86;text-decoration:underline;">Descadastrar</a>.
        </p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

// ---------- Resend ----------
function isFromAddressError(status: number, body: string): boolean {
  if (status === 403) return true;
  const b = (body || "").toLowerCase();
  return (b.includes("domain") && (b.includes("not verified") || b.includes("not_verified"))) ||
    b.includes("from address") || b.includes("invalid `from`");
}
async function sendBatch(from: string, items: Array<{ to: string; subject: string; html: string }>): Promise<{ ok: number; status: number; body: string }> {
  if (!items.length) return { ok: 0, status: 200, body: "" };
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(items.map((it) => ({ from, to: [it.to], subject: it.subject, html: it.html }))),
  });
  const text = res.ok ? "" : await res.text().catch(() => "");
  return { ok: res.ok ? items.length : 0, status: res.status, body: text };
}

// ---------- Conteúdo da semana (em alta + top por categoria) ----------
async function buildContent(sb: SupabaseClient): Promise<{ assunto: string; trending: Exp[]; byCategory: Record<string, Exp[]> }> {
  // Contagem de views por experiência (últimos 14 dias).
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: ev } = await sb.from("analytics_events")
    .select("target_id").eq("event_name", "experience_detail_view")
    .gte("created_at", since).not("target_id", "is", null).limit(20000);
  const views = new Map<string, number>();
  (ev ?? []).forEach((r: { target_id: string }) => views.set(r.target_id, (views.get(r.target_id) ?? 0) + 1));

  // Experiências ativas (fonte da verdade pra foto/preço/categoria).
  const { data: exps } = await sb.from("experiences")
    .select("id, nome, categoria, preco, imagem, is_active").limit(5000);
  const active = (exps ?? []).filter((e: { is_active?: boolean }) => e.is_active !== false) as Array<Exp & { is_active?: boolean }>;
  const score = (e: Exp) => views.get(e.id) ?? 0;

  const trending = [...active].sort((a, b) => score(b) - score(a)).slice(0, 8)
    .map((e) => ({ id: e.id, nome: e.nome, categoria: e.categoria, preco: e.preco, imagem: e.imagem }));

  const byCategory: Record<string, Exp[]> = {};
  active.forEach((e) => {
    const k = String(e.categoria || "").trim();
    if (!k) return;
    (byCategory[k] = byCategory[k] || []).push({ id: e.id, nome: e.nome, categoria: e.categoria, preco: e.preco, imagem: e.imagem });
  });
  Object.keys(byCategory).forEach((k) => {
    byCategory[k] = byCategory[k].sort((a, b) => score(b) - score(a)).slice(0, 4);
  });

  return { assunto: "✨ Experiências em alta essa semana na Elarah", trending, byCategory };
}

async function getOrCreateCampaign(sb: SupabaseClient, weekKey: string) {
  const { data: found } = await sb.from("newsletter_campaigns").select("*").eq("week_key", weekKey).maybeSingle();
  if (found) return found;
  const content = await buildContent(sb);
  const { data: created } = await sb.from("newsletter_campaigns")
    .insert({ week_key: weekKey, assunto: content.assunto, conteudo: content })
    .select("*").maybeSingle();
  return created;
}

// Top categoria de cada user (pelos detail_view com metadata.experiencia_categoria).
async function topCategoryByUser(sb: SupabaseClient, userIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!userIds.length) return out;
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data } = await sb.from("analytics_events")
    .select("user_id, metadata").eq("event_name", "experience_detail_view")
    .in("user_id", userIds).gte("created_at", since).limit(20000);
  const counts: Record<string, Record<string, number>> = {};
  (data ?? []).forEach((r: { user_id: string; metadata: Record<string, unknown> | null }) => {
    const cat = r.metadata && (r.metadata.experiencia_categoria as string);
    if (!r.user_id || !cat) return;
    (counts[r.user_id] = counts[r.user_id] || {})[cat] = (counts[r.user_id]?.[cat] ?? 0) + 1;
  });
  Object.keys(counts).forEach((uid) => {
    out[uid] = Object.entries(counts[uid]).sort((a, b) => b[1] - a[1])[0][0];
  });
  return out;
}

// =============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST." }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const auth = await authorize(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { mode?: string; force?: boolean; daily_cap?: number; test_email?: string } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const mode = body.mode === "preview" ? "preview" : body.mode === "test" ? "test" : "run";
  const sb = sbc();
  const now = new Date();
  const weekKey = isoWeekKey(now);

  try {
    // ----- PREVIEW: mostra o conteúdo desta semana, sem enviar -----
    if (mode === "preview") {
      const content = await buildContent(sb);
      return new Response(JSON.stringify({ ok: true, mode, week_key: weekKey, assunto: content.assunto, trending: content.trending, categorias: Object.keys(content.byCategory) }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const campaign = await getOrCreateCampaign(sb, weekKey);
    if (!campaign) throw new Error("Não consegui criar/ler a campanha da semana.");
    const conteudo = campaign.conteudo || {};
    const trending: Exp[] = conteudo.trending || [];
    const byCategory: Record<string, Exp[]> = conteudo.byCategory || {};
    if (!trending.length) throw new Error("Sem experiências pra montar a newsletter (cadastre experiências ativas).");

    // ----- TEST: manda 1 e-mail de teste pro admin (versão "em alta") -----
    if (mode === "test") {
      const to = (body.test_email || "").trim();
      if (!to) throw new Error("Informe o test_email.");
      const unsub = unsubBase() + "?u=" + encodeURIComponent(to.toLowerCase()) + "&t=" + (await tokenFor(to));
      const html = newsletterHtml("essas são as experiências que estão bombando essa semana — separamos pra você:", trending.slice(0, 4), unsub, null);
      let r = await sendBatch(FROM, [{ to, subject: "[TESTE] " + campaign.assunto, html }]);
      if (!r.ok && isFromAddressError(r.status, r.body)) r = await sendBatch(FALLBACK_FROM, [{ to, subject: "[TESTE] " + campaign.assunto, html }]);
      return new Response(JSON.stringify({ ok: r.ok > 0, mode, sent_to: to, detail: r.ok > 0 ? "" : ("Resend " + r.status + " " + r.body.slice(0, 200)) }), {
        status: r.ok > 0 ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- RUN (cron diário): manda o próximo lote da fila -----
    // Trava de dia: a newsletter da semana só começa a partir de terça,
    // a menos que force=true. (Cron roda todo dia; seg não envia.)
    if (!body.force && isoWeekday(now) < SEND_FROM_WEEKDAY) {
      return new Response(JSON.stringify({ ok: true, mode, week_key: weekKey, skipped: "antes do dia de envio (terça)", enviados_agora: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada.");

    const cap = Number.isFinite(Number(body.daily_cap)) && Number(body.daily_cap) > 0 ? Math.min(Number(body.daily_cap), 2000) : DAILY_CAP;

    // Audiência total e quem já recebeu ESTA campanha.
    const { data: audAll, error: audErr } = await sb.from("email_audience").select("email, nome").limit(50000);
    if (audErr) throw new Error("Falha ao ler audiência: " + audErr.message + " (rodou elarah_email_broadcasts.sql?)");
    const { data: already } = await sb.from("newsletter_sends").select("email").eq("campaign_id", campaign.id).limit(50000);
    const sentSet = new Set((already ?? []).map((r: { email: string }) => r.email));
    const pending = (audAll ?? []).filter((r: { email: string }) => !sentSet.has(r.email));
    const totalAud = (audAll ?? []).length;

    if (!pending.length) {
      return new Response(JSON.stringify({ ok: true, mode, week_key: weekKey, total_audiencia: totalAud, ja_enviados: sentSet.size, enviados_agora: 0, restantes: 0, status: "semana_concluida" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chunk = pending.slice(0, cap) as Array<{ email: string; nome: string | null }>;

    // Mapeia e-mail -> user_id (pra personalizar logados).
    const { data: profs } = await sb.from("profiles").select("id, email").not("email", "is", null).limit(50000);
    const emailToUid = new Map<string, string>();
    (profs ?? []).forEach((p: { id: string; email: string }) => {
      if (p.email) emailToUid.set(p.email.trim().toLowerCase(), p.id);
    });
    const userIds = chunk.map((c) => emailToUid.get(c.email)).filter(Boolean) as string[];
    const topCat = await topCategoryByUser(sb, userIds);

    // Monta e envia (lote único; chunk <= ~95).
    const items = await Promise.all(chunk.map(async (c) => {
      const uid = emailToUid.get(c.email);
      const cat = uid ? topCat[uid] : null;
      const picked = (cat && byCategory[cat] && byCategory[cat].length) ? byCategory[cat] : trending;
      const intro = (cat && byCategory[cat] && byCategory[cat].length)
        ? `separamos experiências de ${cat} (que é a sua praia) e o que está bombando:`
        : "essas são as experiências que estão bombando essa semana — dá uma olhada:";
      const unsub = unsubBase() + "?u=" + encodeURIComponent(c.email) + "&t=" + (await tokenFor(c.email));
      return { to: c.email, subject: campaign.assunto, html: newsletterHtml(intro, picked.slice(0, 4), unsub, c.nome) };
    }));

    let useFrom = FROM;
    let r = await sendBatch(useFrom, items);
    if (!r.ok && isFromAddressError(r.status, r.body)) { useFrom = FALLBACK_FROM; r = await sendBatch(useFrom, items); }
    const enviados = r.ok;

    // Registra quem recebeu (só os que de fato saíram).
    if (enviados > 0) {
      const rows = chunk.map((c) => ({ campaign_id: campaign.id, email: c.email }));
      await sb.from("newsletter_sends").upsert(rows, { onConflict: "campaign_id,email" });
    }
    const restantes = Math.max(0, pending.length - enviados);

    return new Response(JSON.stringify({
      ok: true, mode, week_key: weekKey, total_audiencia: totalAud,
      ja_enviados: sentSet.size + enviados, enviados_agora: enviados, restantes,
      status: restantes > 0 ? "fila_em_andamento" : "semana_concluida",
      detalhe: r.ok ? "" : ("Resend " + r.status + " " + r.body.slice(0, 200)),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
