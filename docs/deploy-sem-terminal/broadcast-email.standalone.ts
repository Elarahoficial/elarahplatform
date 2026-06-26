// =============================================================
// ELARAH — broadcast-email (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// O "agente de novidades": dispara UM e-mail pra TODOS os
// destinatários de uma vez (cadastrados + quem já comprou), com
// link de descadastro (LGPD). Tudo num arquivo só, sem imports de
// ../_shared — pra colar no editor de Edge Functions do Supabase e
// clicar em Deploy. SEM terminal.
//
// Esta MESMA função responde a duas coisas:
//   • POST  (admin)   → contar / testar / enviar a novidade
//   • GET   (público) → descadastrar quem clicou no link do e-mail
// Por isso: DESLIGUE "Verify JWT" nas Settings desta função (igual
// você fez na analytics-insights) — a autorização é feita por dentro.
//
// Secrets (a maioria o Supabase injeta sozinho):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY  (auto)
//   RESEND_API_KEY        → envio (já existe no projeto)
//   ELARAH_FROM_EMAIL     → remetente (opcional; padrão contato@elarah.com.br)
//   CRON_SECRET           → senha p/ disparo sem login (opcional)
//   BROADCAST_SECRET      → assina o link de descadastro (opcional;
//                           cai pra CRON_SECRET ou service_role key)
//
// Pré-requisito: rode antes sql/elarah_email_broadcasts.sql.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ---------- ENV ----------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ELARAH_FROM_EMAIL") ?? "Elarah <contato@elarah.com.br>";
const FALLBACK_FROM = "Elarah <onboarding@resend.dev>";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const BROADCAST_SECRET =
  Deno.env.get("BROADCAST_SECRET") || CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY || "elarah-fallback-secret";

// Quantos e-mails no MÁXIMO por disparo. O plano grátis do Resend
// permite ~100/dia; por isso o padrão é 100. Suba se tiver plano pago.
const DEFAULT_MAX_PER_RUN = 100;

// ---------- CORS ----------
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ---------- Supabase service client (singleton) ----------
let _service: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (_service) return _service;
  _service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

// ---------- Auth do POST: admin (UI) OU CRON_SECRET ----------
async function authorizePost(req: Request): Promise<{ ok: boolean; userId: string | null }> {
  const auth = req.headers.get("Authorization");
  const m = auth ? /^Bearer\s+(.+)$/i.exec(auth) : null;
  if (!m) return { ok: false, userId: null };
  const token = m[1];
  if (CRON_SECRET && token === CRON_SECRET) return { ok: true, userId: null };
  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) return { ok: true, userId: null };
  // JWT de admin logado no painel
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData?.user) return { ok: false, userId: null };
  const { data: isAdmin, error: rpcErr } = await client.rpc("is_admin");
  if (rpcErr || !isAdmin) return { ok: false, userId: null };
  return { ok: true, userId: userData.user.id };
}

// ---------- HMAC (token do link de descadastro) ----------
async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function tokenFor(email: string): Promise<string> {
  return hmacHex(email.trim().toLowerCase(), BROADCAST_SECRET);
}

// ---------- HTML helpers ----------
function escapeHtml(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
// Quebra de linha do textarea vira parágrafos/brs, com escape.
function messageToHtml(msg: string): string {
  const blocks = String(msg || "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((b) =>
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2a2a2a;">${
      escapeHtml(b).replace(/\n/g, "<br>")
    }</p>`
  ).join("");
}

// ---------- Template do e-mail ----------
function broadcastEmailHtml(assunto: string, mensagem: string, unsubscribeUrl: string, nome: string | null): string {
  const ola = nome ? `Oi, ${escapeHtml(nome.split(/\s+/)[0])}! ` : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06);">
      <tr><td style="padding:30px 36px 18px;text-align:center;background:linear-gradient(135deg,#f6d5a8,#f0a05e);">
        <h1 style="font-family:Georgia,serif;color:#1a1a1a;margin:0;font-size:26px;">Elarah</h1>
        <p style="margin:4px 0 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7a4a1e;">Experiências & presentes</p>
      </td></tr>
      <tr><td style="padding:30px 36px 8px;">
        <h2 style="font-family:Georgia,serif;color:#1a1a1a;margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(assunto)}</h2>
        ${ola ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2a2a2a;">${ola}</p>` : ""}
        ${messageToHtml(mensagem)}
      </td></tr>
      <tr><td style="padding:18px 36px 30px;">
        <a href="https://elarah.com.br" style="display:inline-block;background:#f0a05e;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px;">Ver experiências</a>
      </td></tr>
      <tr><td style="padding:18px 36px 28px;border-top:1px solid #f0e6d8;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#a89a86;">
          Você recebeu este e-mail porque tem cadastro ou já fez um pedido na Elarah.<br>
          Não quer mais receber novidades? <a href="${unsubscribeUrl}" style="color:#a89a86;text-decoration:underline;">Descadastrar</a>.
        </p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function unsubPageHtml(titulo: string, msg: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Elarah</title></head>
<body style="margin:0;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:60px auto;background:#fff;border-radius:18px;padding:40px 32px;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.06);">
    <h1 style="font-family:Georgia,serif;color:#1a1a1a;font-size:24px;margin:0 0 12px;">Elarah</h1>
    <h2 style="color:#1a1a1a;font-size:19px;margin:0 0 10px;">${escapeHtml(titulo)}</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">${escapeHtml(msg)}</p>
    <a href="https://elarah.com.br" style="display:inline-block;background:#f0a05e;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;">Ir pra Elarah</a>
  </div>
</body></html>`;
}

// ---------- Resend ----------
function isFromAddressError(status: number, body: string): boolean {
  if (status === 403) return true;
  const b = (body || "").toLowerCase();
  return (b.includes("domain") && (b.includes("not verified") || b.includes("not_verified") || b.includes("not found"))) ||
    b.includes("from address") || b.includes("verify your domain") || b.includes("invalid `from`");
}
// Envia UM lote (até 100) pela API batch do Resend. Retorna quantos OK.
async function sendBatch(fromAddress: string, items: Array<{ to: string; subject: string; html: string }>): Promise<{ ok: number; status: number; body: string }> {
  if (!items.length) return { ok: 0, status: 200, body: "" };
  const payload = items.map((it) => ({ from: fromAddress, to: [it.to], subject: it.subject, html: it.html }));
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = res.ok ? "" : await res.text().catch(() => "");
  // O batch responde 200 com { data: [...] } — assumimos todos OK no 200.
  return { ok: res.ok ? items.length : 0, status: res.status, body: text };
}

// ---------- Destinatários ----------
async function fetchAudience(sb: SupabaseClient): Promise<Array<{ email: string; nome: string | null }>> {
  const { data, error } = await sb.from("email_audience").select("email, nome").limit(50000);
  if (error) throw new Error("Falha ao ler destinatários: " + error.message + " (rodou o SQL elarah_email_broadcasts.sql?)");
  return (data ?? []) as Array<{ email: string; nome: string | null }>;
}

// Base da URL desta função (pro link de descadastro), derivada do request.
function functionBaseUrl(req: Request): string {
  const u = new URL(req.url);
  return u.origin + u.pathname;
}

// =============================================================
// HANDLER
// =============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ---------- GET = descadastro (público, vem do clique no e-mail) ----------
  if (req.method === "GET") {
    try {
      const u = new URL(req.url);
      const email = (u.searchParams.get("u") || "").trim().toLowerCase();
      const token = u.searchParams.get("t") || "";
      if (!email || !token) {
        return new Response(unsubPageHtml("Link inválido", "Esse link de descadastro está incompleto."), {
          status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      const expected = await tokenFor(email);
      if (token !== expected) {
        return new Response(unsubPageHtml("Link inválido", "Não foi possível validar esse link de descadastro."), {
          status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      const sb = getServiceClient();
      await sb.from("email_opt_outs").upsert({ email, motivo: "link" }, { onConflict: "email" });
      return new Response(
        unsubPageHtml("Pronto, você foi descadastrado", "Você não vai mais receber e-mails de novidade da Elarah. Sentiremos sua falta! 🧡"),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    } catch (e) {
      return new Response(unsubPageHtml("Ops", "Algo deu errado: " + String(e)), {
        status: 500, headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST." }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---------- POST = admin: count / test / send ----------
  const auth = await authorizePost(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado (admin)." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { mode?: string; assunto?: string; mensagem?: string; test_email?: string; max_per_run?: number } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const mode = body.mode === "send" ? "send" : body.mode === "test" ? "test" : "count";
  const assunto = String(body.assunto || "").trim();
  const mensagem = String(body.mensagem || "").trim();
  const sb = getServiceClient();
  const base = functionBaseUrl(req);

  try {
    // ----- COUNT: só conta quantos receberiam -----
    if (mode === "count") {
      const aud = await fetchAudience(sb);
      return new Response(JSON.stringify({ ok: true, mode, total: aud.length }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!assunto || !mensagem) {
      return new Response(JSON.stringify({ ok: false, error: "Preencha o assunto e a mensagem." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY não configurada." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- TEST: manda 1 e-mail de teste pro próprio admin -----
    if (mode === "test") {
      const to = (body.test_email || "").trim();
      if (!to) {
        return new Response(JSON.stringify({ ok: false, error: "Informe o e-mail de teste." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const unsub = base + "?u=" + encodeURIComponent(to.toLowerCase()) + "&t=" + (await tokenFor(to));
      const html = broadcastEmailHtml(assunto, mensagem, unsub, null);
      let r = await sendBatch(FROM, [{ to, subject: "[TESTE] " + assunto, html }]);
      if (!r.ok && !FROM.toLowerCase().includes("onboarding@resend.dev") && isFromAddressError(r.status, r.body)) {
        r = await sendBatch(FALLBACK_FROM, [{ to, subject: "[TESTE] " + assunto, html }]);
      }
      return new Response(JSON.stringify({ ok: r.ok > 0, mode, sent_to: to, detail: r.ok > 0 ? "" : ("Resend " + r.status + " " + r.body.slice(0, 200)) }), {
        status: r.ok > 0 ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- SEND: dispara pra todos (até o limite do dia) -----
    const maxPerRun = Number.isFinite(Number(body.max_per_run)) && Number(body.max_per_run) > 0
      ? Math.min(Number(body.max_per_run), 2000) : DEFAULT_MAX_PER_RUN;

    const audAll = await fetchAudience(sb);
    const total = audAll.length;
    const aud = audAll.slice(0, maxPerRun);

    // Registra o disparo (status "enviando").
    const { data: bcast } = await sb.from("email_broadcasts").insert({
      assunto, mensagem, audiencia: "cadastrados_e_compradores",
      total_destinatarios: total, status: "enviando", created_by: auth.userId,
    }).select("id").maybeSingle();
    const broadcastId = bcast?.id ?? null;

    let enviados = 0;
    let falharam = 0;
    let useFrom = FROM;
    // Lotes de 100 (limite do batch do Resend).
    for (let i = 0; i < aud.length; i += 100) {
      const chunk = aud.slice(i, i + 100);
      const items = await Promise.all(chunk.map(async (p) => {
        const unsub = base + "?u=" + encodeURIComponent(p.email) + "&t=" + (await tokenFor(p.email));
        return { to: p.email, subject: assunto, html: broadcastEmailHtml(assunto, mensagem, unsub, p.nome) };
      }));
      let r = await sendBatch(useFrom, items);
      if (!r.ok && useFrom !== FALLBACK_FROM && isFromAddressError(r.status, r.body)) {
        useFrom = FALLBACK_FROM;
        r = await sendBatch(useFrom, items);
      }
      enviados += r.ok;
      falharam += (chunk.length - r.ok);
      // Educado com o rate limit do Resend entre lotes.
      if (i + 100 < aud.length) await new Promise((res) => setTimeout(res, 700));
    }

    const restantes = Math.max(0, total - enviados);
    const status = falharam > 0 ? "parcial" : "concluido";
    const detalhe = restantes > 0
      ? `Enviados ${enviados}. Faltam ${restantes} (limite de ${maxPerRun}/disparo). Rode de novo pra continuar.`
      : "";
    if (broadcastId) {
      await sb.from("email_broadcasts").update({ enviados, falharam, status, detalhe }).eq("id", broadcastId);
    }

    return new Response(JSON.stringify({
      ok: true, mode, total, enviados, falharam, restantes, status, detalhe, broadcast_id: broadcastId,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
