// =============================================================
// ELARAH — analytics-insights (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// Esta é a MESMA função de supabase/functions/analytics-insights/,
// mas com TUDO junto num arquivo só (sem imports de ../_shared).
// Serve pra colar direto no editor de Edge Functions do site do
// Supabase e clicar em Deploy — SEM terminal, SEM instalar nada.
//
// Modo padrão: "rules" (diagnóstico por regras, CUSTO ZERO).
// "ai" (Claude, pago) só roda se você mandar mode:"ai" e tiver
// ANTHROPIC_API_KEY cadastrada.
//
// Secrets (a maioria o Supabase já injeta sozinho):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY  (automáticos)
//   RESEND_API_KEY            → pro e-mail (já existe no projeto)
//   ADMIN_NOTIFY_EMAILS       → quem recebe (opcional)
//   ELARAH_FROM_EMAIL         → remetente (opcional)
//   ANTHROPIC_API_KEY/MODEL   → só se usar mode "ai"
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
const ADMIN_NOTIFY_EMAILS = Deno.env.get("ADMIN_NOTIFY_EMAILS") ?? "";
const DEFAULT_ADMIN_EMAIL = "contato.elarah@gmail.com";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-4-8";
// Senha própria do cron (você define em Edge Functions → Secrets). Mais
// confiável que depender da service_role key bater com a do ambiente.
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

// ---------- CORS ----------
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

// ---------- Auth: service_role (cron) OU admin (UI) ----------
async function authorizeRequest(req: Request): Promise<{ ok: boolean; trigger: "cron" | "manual" }> {
  const auth = req.headers.get("Authorization");
  const m = auth ? /^Bearer\s+(.+)$/i.exec(auth) : null;
  if (!m) return { ok: false, trigger: "manual" };
  const token = m[1];
  // 1) senha própria do cron (caminho confiável)
  if (CRON_SECRET && token === CRON_SECRET) return { ok: true, trigger: "cron" };
  // 2) service_role key (compatibilidade)
  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, trigger: "cron" };
  }
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData?.user) return { ok: false, trigger: "manual" };
  const { data: isAdmin, error: rpcErr } = await client.rpc("is_admin");
  if (rpcErr || !isAdmin) return { ok: false, trigger: "manual" };
  return { ok: true, trigger: "manual" };
}

// ---------- E-mail (Resend) ----------
function adminNotifyRecipients(): string[] {
  const raw = (ADMIN_NOTIFY_EMAILS || "").trim();
  const list = (raw ? raw.split(/[,;\s]+/) : []).map((s) => s.trim()).filter(Boolean);
  return list.length ? list : [DEFAULT_ADMIN_EMAIL];
}
function isFromAddressError(status: number, body: string): boolean {
  if (status === 403) return true;
  const b = (body || "").toLowerCase();
  return (b.includes("domain") && (b.includes("not verified") || b.includes("not_verified") || b.includes("not found") || b.includes("validation_error") || b.includes("unauthorized"))) ||
    b.includes("from address") || b.includes("verify your domain") || b.includes("invalid `from`");
}
async function postToResend(fromAddress: string, to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromAddress, to, subject, html }),
  });
  const text = res.ok ? "" : await res.text().catch(() => "");
  return { res, text };
}
async function sendEmail(to: string[], subject: string, html: string): Promise<{ ok: boolean }> {
  if (!RESEND_API_KEY) { console.error("[email] RESEND_API_KEY ausente"); return { ok: false }; }
  try {
    let attempt = await postToResend(FROM, to, subject, html);
    if (attempt.res.ok) return { ok: true };
    const mainIsSandbox = FROM.toLowerCase().includes("onboarding@resend.dev");
    if (!mainIsSandbox && isFromAddressError(attempt.res.status, attempt.text)) {
      const retry = await postToResend(FALLBACK_FROM, to, subject, html);
      if (retry.res.ok) return { ok: true };
    }
    console.error("[email] Resend rejeitou", attempt.res.status, attempt.text.slice(0, 400));
    return { ok: false };
  } catch (e) { console.error("[email] exceção", e); return { ok: false }; }
}
function escapeHtml(s: string): string {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function htmlShell(inner: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:32px 0;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06);">
      <tr><td style="padding:28px 36px 20px;text-align:center;background:linear-gradient(135deg,#f6d5a8,#f0a05e);">
        <h1 style="font-family:Georgia,serif;color:#1a1a1a;margin:0;font-size:24px;">Elarah</h1></td></tr>
      <tr><td style="padding:28px 34px;font-size:15px;line-height:1.6;color:#222;">${inner}</td></tr>
    </table></td></tr></table></body></html>`;
}

interface Insights {
  resumo: string;
  saude_geral: "boa" | "atencao" | "critica";
  pontos_fortes: Array<{ titulo: string; detalhe: string }>;
  problemas: Array<{ titulo: string; gravidade: "alta" | "media" | "baixa"; detalhe: string; recomendacao: string }>;
  funil_observacoes: string[];
}

function digestEmailHtml(periodDays: number, model: string, insights: Insights, metrics: Metrics): string {
  const saudeMap: Record<string, { label: string; bg: string; fg: string }> = {
    boa: { label: "Saúde boa", bg: "#e6f6ec", fg: "#1c7a43" },
    atencao: { label: "Requer atenção", bg: "#fff4e0", fg: "#a4663b" },
    critica: { label: "Crítico", bg: "#fdeaea", fg: "#b3261e" },
  };
  const saude = saudeMap[insights.saude_geral] || saudeMap.atencao;
  const funil = metrics.funil || [];
  const visitas = funil[0] ? Number(funil[0].total) || 0 : 0;
  const conv = metrics.conversao_geral_visita_para_pagamento_pct;
  const kpi = (v: string, l: string) =>
    `<td style="padding:0 6px;"><div style="background:#fff8ee;border:1px solid #f0d8bf;border-radius:10px;padding:10px 12px;text-align:center;"><div style="font-size:20px;font-weight:700;color:#1a1a1a;">${escapeHtml(v)}</div><div style="font-size:11px;color:#a4663b;text-transform:uppercase;">${escapeHtml(l)}</div></div></td>`;
  const gravColor: Record<string, string> = { alta: "#b3261e", media: "#a4663b", baixa: "#5a6472" };
  const problemasHtml = insights.problemas.map((p) =>
    `<div style="padding:12px 0;border-top:1px dashed #eee;"><div style="font-weight:600;color:#1a1a1a;">⚠️ ${escapeHtml(p.titulo)} <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:${gravColor[p.gravidade] || "#5a6472"};">· ${escapeHtml(p.gravidade)}</span></div><div style="margin:4px 0 0;color:#444;font-size:14px;line-height:1.5;">${escapeHtml(p.detalhe)}</div><div style="margin:8px 0 0;padding:8px 12px;background:#faf6f0;border-left:3px solid #f0a05e;border-radius:8px;font-size:13px;color:#5a4a3a;"><strong style="color:#a4663b;">O que fazer:</strong> ${escapeHtml(p.recomendacao)}</div></div>`
  ).join("") || `<div style="color:#444;font-size:14px;">Nenhum problema crítico identificado.</div>`;
  const fortesHtml = insights.pontos_fortes.map((p) =>
    `<div style="padding:10px 0;border-top:1px dashed #eee;"><div style="font-weight:600;color:#1a1a1a;">✅ ${escapeHtml(p.titulo)}</div><div style="margin:4px 0 0;color:#444;font-size:14px;line-height:1.5;">${escapeHtml(p.detalhe)}</div></div>`
  ).join("") || `<div style="color:#444;font-size:14px;">—</div>`;
  const funilHtml = insights.funil_observacoes.map((f) => `<li style="margin:4px 0;color:#444;font-size:14px;">${escapeHtml(f)}</li>`).join("");
  const inner = `
    <h2 style="font-family:Georgia,serif;color:#1a1a1a;margin:0 0 6px;font-size:22px;">Onde estamos pecando 🔍</h2>
    <p style="margin:0 0 12px;color:#555;">Diagnóstico automático dos últimos ${escapeHtml(String(periodDays))} dias.</p>
    <div style="display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;padding:4px 12px;border-radius:999px;background:${saude.bg};color:${saude.fg};margin-bottom:12px;">${escapeHtml(saude.label)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;"><tr>
      ${kpi(String(metrics.vendas_pagas ?? 0), "Vendas")}${kpi(String(metrics.receita_total ?? "—"), "Receita")}${kpi(String(visitas), "Visitas")}${kpi(conv == null ? "—" : conv + "%", "Conversão")}
    </tr></table>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2a2a2a;">${escapeHtml(insights.resumo)}</p>
    <h3 style="font-family:Georgia,serif;color:#1a1a1a;margin:16px 0 2px;font-size:17px;">Onde estamos pecando</h3>${problemasHtml}
    <h3 style="font-family:Georgia,serif;color:#1a1a1a;margin:20px 0 2px;font-size:17px;">O que está funcionando</h3>${fortesHtml}
    ${funilHtml ? `<h3 style="font-family:Georgia,serif;color:#1a1a1a;margin:20px 0 6px;font-size:17px;">Leitura do funil</h3><ul style="padding-left:20px;margin:0;">${funilHtml}</ul>` : ""}
    <p style="margin:20px 0 0;font-size:12px;color:#999;">Gerado automaticamente · ${escapeHtml(model)}. Só leitura — nada foi alterado.</p>`;
  return htmlShell(inner);
}

// ---------- Métricas ----------
const FUNNEL_STEPS = [
  { event: "page_view", label: "Visitas" },
  { event: "experience_detail_view", label: "Viu detalhe de experiência" },
  // cta_click = clique em "Reservar" canônico (conta 1x). Antes usávamos
  // reserve_click, que dispara 2x (botão + handler) e inflava o passo.
  { event: "cta_click", label: "Clicou em Reservar" },
  { event: "checkout_started", label: "Iniciou checkout" },
  { event: "payment_approved", label: "Pagamento aprovado" },
];
const EXTRA_EVENTS = ["search_used", "category_filter_used", "whatsapp_click", "gift_card_click", "checkout_error", "payment_failed", "payment_pending"];

type Sb = SupabaseClient;
async function countEvent(sb: Sb, eventName: string, fromISO: string, toISO?: string): Promise<number> {
  let q = sb.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_name", eventName).gte("created_at", fromISO);
  if (toISO) q = q.lt("created_at", toISO);
  const { count, error } = await q;
  if (error) { console.warn("count falhou", eventName, error.message); return 0; }
  return count ?? 0;
}
async function paidBookings(sb: Sb, fromISO: string, toISO?: string): Promise<Array<Record<string, unknown>>> {
  let q = sb.from("bookings").select("experiencia_nome, amount_total").eq("status", "pago").gte("created_at", fromISO);
  if (toISO) q = q.lt("created_at", toISO);
  const { data } = await q.limit(5000);
  return (data ?? []) as Array<Record<string, unknown>>;
}
function topBy(rows: Array<Record<string, unknown>>, keyFn: (r: Record<string, unknown>) => string | null | undefined, limit = 8) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = keyFn(r);
    const key = (raw == null || raw === "") ? "(desconhecido)" : String(raw);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([chave, total]) => ({ chave, total })).sort((a, b) => b.total - a.total).slice(0, limit);
}
function brl(c: number): string { return "R$ " + (c / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function pct(part: number, whole: number): number | null { return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null; }
function delta(cur: number, prev: number): number | null { if (prev === 0) return cur > 0 ? 100 : null; return Math.round(((cur - prev) / prev) * 1000) / 10; }

async function buildMetrics(periodDays: number) {
  const sb = getServiceClient();
  const now = Date.now();
  const since = new Date(now - periodDays * 86400000);
  const sinceISO = since.toISOString();
  const prevSinceISO = new Date(now - periodDays * 2 * 86400000).toISOString();

  const funil: Array<{ etapa: string; total: number; conversao_da_etapa_anterior_pct: number | null }> = [];
  let prev: number | null = null;
  for (const step of FUNNEL_STEPS) {
    const total = await countEvent(sb, step.event, sinceISO);
    funil.push({ etapa: step.label, total, conversao_da_etapa_anterior_pct: prev && prev > 0 ? pct(total, prev) : null });
    prev = total;
  }
  const outros: Record<string, number> = {};
  for (const ev of EXTRA_EVENTS) outros[ev] = await countEvent(sb, ev, sinceISO);

  const { data: pvRows } = await sb.from("analytics_events").select("metadata, path").eq("event_name", "page_view").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(5000);
  const pv = (pvRows ?? []) as Array<Record<string, unknown>>;
  const meta = (r: Record<string, unknown>) => (r.metadata ?? {}) as Record<string, unknown>;
  const trafego_por_origem = topBy(pv, (r) => meta(r).utm_source as string);
  const trafego_por_midia = topBy(pv, (r) => meta(r).utm_medium as string);
  const paginas_mais_vistas = topBy(pv, (r) => (r.path ?? meta(r).landing_page) as string, 10);

  const { data: detailRows } = await sb.from("analytics_events").select("target_label").eq("event_name", "experience_detail_view").gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(5000);
  const experiencias_mais_vistas = topBy((detailRows ?? []) as Array<Record<string, unknown>>, (r) => r.target_label as string, 10);

  const statuses = ["pago", "pending", "cancelado", "expirado", "reembolsado"];
  const bookings_por_status: Record<string, number> = {};
  for (const st of statuses) {
    const { count } = await sb.from("bookings").select("*", { count: "exact", head: true }).eq("status", st).gte("created_at", sinceISO);
    bookings_por_status[st] = count ?? 0;
  }
  const paid = await paidBookings(sb, sinceISO);
  let receitaCentavos = 0; for (const b of paid) receitaCentavos += Number(b.amount_total) || 0;
  const experiencias_mais_vendidas = topBy(paid, (r) => r.experiencia_nome as string, 10);

  // Correção de medição: a última etapa ("Pagamento aprovado") vinha do
  // evento client-side, que não dispara quando o Pix é pago no app do
  // banco e o cliente não volta ao site — subcontando vendas. Usamos o
  // nº real de reservas pagas (status='pago'), mesma fonte de vendas_pagas.
  const lastStep = funil[funil.length - 1];
  if (lastStep && lastStep.etapa === "Pagamento aprovado") {
    lastStep.total = paid.length;
    const prevTotal = funil.length >= 2 ? funil[funil.length - 2].total : 0;
    lastStep.conversao_da_etapa_anterior_pct =
      prevTotal > 0 ? pct(paid.length, prevTotal) : null;
  }

  const visitas = funil[0]?.total ?? 0;
  const pagamentos = funil[funil.length - 1]?.total ?? 0;
  const conversao_geral_pct = pct(pagamentos, visitas);

  const visitasAnt = await countEvent(sb, "page_view", prevSinceISO, sinceISO);
  const paidAnt = await paidBookings(sb, prevSinceISO, sinceISO);
  let receitaAntCent = 0; for (const b of paidAnt) receitaAntCent += Number(b.amount_total) || 0;

  return {
    periodo_dias: periodDays, desde: sinceISO, funil,
    conversao_geral_visita_para_pagamento_pct: conversao_geral_pct,
    outros_eventos: outros, trafego_por_origem, trafego_por_midia, paginas_mais_vistas,
    experiencias_mais_vistas, bookings_por_status, vendas_pagas: paid.length,
    receita_total: brl(receitaCentavos), receita_total_centavos: receitaCentavos, experiencias_mais_vendidas,
    comparativo: {
      visitas_anterior: visitasAnt, pagamentos_anterior: paidAnt.length, vendas_anterior: paidAnt.length,
      receita_anterior_centavos: receitaAntCent, conversao_anterior_pct: pct(paidAnt.length, visitasAnt),
      delta_visitas_pct: delta(visitas, visitasAnt), delta_vendas_pct: delta(paid.length, paidAnt.length), delta_receita_pct: delta(receitaCentavos, receitaAntCent),
    },
  };
}
type Metrics = Awaited<ReturnType<typeof buildMetrics>>;

// ---------- Diagnóstico por REGRAS (grátis) ----------
function recoForStep(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("detalhe")) return "Quem chega na home não está clicando nas experiências. Reveja fotos, títulos e a vitrine inicial.";
  if (l.includes("reservar")) return "Abrem a experiência mas não clicam em Reservar. Olhe preço, descrição, datas e se o botão está claro.";
  if (l.includes("checkout")) return "Clicam em Reservar mas não iniciam o checkout. Veja se há fricção ou erro no passo intermediário.";
  if (l.includes("pagamento")) return "Iniciam o checkout mas não pagam. Teste um checkout real e cheque a integração de pagamento.";
  return "Investigue por que as pessoas param nessa etapa.";
}
function diagnoseByRules(m: Metrics): Insights {
  const problemas: Insights["problemas"] = [];
  const pontos_fortes: Insights["pontos_fortes"] = [];
  const funil = m.funil;
  const visitas = funil[0]?.total ?? 0;
  const cg = m.conversao_geral_visita_para_pagamento_pct;
  const cmp = m.comparativo;

  let worst: { de: string; para: string; conv: number; perdeu: number } | null = null;
  for (let i = 1; i < funil.length; i++) {
    const s = funil[i], p = funil[i - 1];
    if (p.total > 0 && s.conversao_da_etapa_anterior_pct != null) {
      if (!worst || s.conversao_da_etapa_anterior_pct < worst.conv) worst = { de: p.etapa, para: s.etapa, conv: s.conversao_da_etapa_anterior_pct, perdeu: p.total - s.total };
    }
  }
  if (worst) {
    const grav: Insights["problemas"][0]["gravidade"] = worst.conv < 20 ? "alta" : worst.conv < 50 ? "media" : "baixa";
    problemas.push({ titulo: `Maior queda do funil: ${worst.de} → ${worst.para}`, gravidade: grav, detalhe: `Só ${worst.conv}% de quem passou por "${worst.de}" avançou pra "${worst.para}" — ${worst.perdeu} pessoa(s) pararam aí.`, recomendacao: recoForStep(worst.para) });
  }
  const vendidas = new Set(m.experiencias_mais_vendidas.map((e) => e.chave));
  const vistasSemVenda = m.experiencias_mais_vistas.filter((e) => e.chave !== "(desconhecido)" && !vendidas.has(e.chave)).slice(0, 3);
  if (vistasSemVenda.length) problemas.push({ titulo: "Experiências com muita visita e pouca venda", gravidade: "media", detalhe: `Tiveram visualização mas não aparecem entre as vendidas: ${vistasSemVenda.map((e) => `${e.chave} (${e.total} views)`).join("; ")}.`, recomendacao: "O interesse existe, falta converter: reveja preço, fotos, datas e o texto dessas páginas." });
  if (cg != null && cg < 1 && visitas >= 50) problemas.push({ titulo: "Conversão geral baixa", gravidade: "media", detalhe: `Conversão de visita → pagamento está em ${cg}%.`, recomendacao: "Reduza atrito no checkout e destaque as experiências que já vendem." });
  if (cmp.delta_vendas_pct != null && cmp.delta_vendas_pct < 0) problemas.push({ titulo: `Vendas caíram ${Math.abs(cmp.delta_vendas_pct)}% vs. o período anterior`, gravidade: cmp.delta_vendas_pct <= -30 ? "alta" : "media", detalhe: `Foram ${cmp.vendas_anterior} vendas antes e ${m.vendas_pagas} agora.`, recomendacao: "Veja se mudou o tráfego, alguma campanha pausou ou faltou data disponível." });
  const erros = (m.outros_eventos.checkout_error || 0) + (m.outros_eventos.payment_failed || 0);
  if (erros >= 5) problemas.push({ titulo: `${erros} erros de checkout/pagamento no período`, gravidade: "media", detalhe: "Gente tentando pagar e batendo em erro.", recomendacao: "Cheque a integração de pagamento (Stripe / Mercado Pago) e faça um checkout de teste." });

  if (m.experiencias_mais_vendidas.length) { const t = m.experiencias_mais_vendidas[0]; pontos_fortes.push({ titulo: "Carro-chefe de vendas", detalhe: `${t.chave} lidera com ${t.total} venda(s) no período.` }); }
  if (cmp.delta_vendas_pct != null && cmp.delta_vendas_pct > 0) pontos_fortes.push({ titulo: "Vendas em alta", detalhe: `As vendas subiram ${cmp.delta_vendas_pct}% vs. o período anterior.` });
  if (cmp.delta_receita_pct != null && cmp.delta_receita_pct > 0) pontos_fortes.push({ titulo: "Receita crescendo", detalhe: `A receita subiu ${cmp.delta_receita_pct}% vs. o período anterior.` });
  let best: { de: string; para: string; conv: number } | null = null;
  for (let i = 1; i < funil.length; i++) { const s = funil[i], p = funil[i - 1]; if (s.conversao_da_etapa_anterior_pct != null && (!best || s.conversao_da_etapa_anterior_pct > best.conv)) best = { de: p.etapa, para: s.etapa, conv: s.conversao_da_etapa_anterior_pct }; }
  if (best && best.conv >= 50) pontos_fortes.push({ titulo: "Etapa que funciona bem", detalhe: `${best.de} → ${best.para} converte ${best.conv}%.` });
  const topOrigem = m.trafego_por_origem.find((o) => o.chave !== "(desconhecido)");
  if (topOrigem) pontos_fortes.push({ titulo: "Principal fonte de tráfego", detalhe: `${topOrigem.chave} trouxe ${topOrigem.total} visitas no período.` });

  const funil_observacoes = funil.map((s) => `${s.etapa}: ${s.total}` + (s.conversao_da_etapa_anterior_pct != null ? ` (${s.conversao_da_etapa_anterior_pct}% da etapa anterior)` : ""));
  const saude_geral: Insights["saude_geral"] = m.vendas_pagas === 0 ? "critica" : problemas.some((p) => p.gravidade === "alta") ? "atencao" : "boa";
  const dV = cmp.delta_vendas_pct;
  const trend = dV == null ? "" : dV > 0 ? ` Vendas subiram ${dV}% vs. o período anterior.` : dV < 0 ? ` Vendas caíram ${Math.abs(dV)}% vs. o período anterior.` : " Vendas estáveis vs. o período anterior.";
  const caveat = visitas < 50 ? " (Volume ainda baixo — leia como tendência.)" : "";
  const resumo = `Nos últimos ${m.periodo_dias} dias: ${visitas} visitas, ${m.vendas_pagas} vendas pagas (${m.receita_total}), conversão geral ${cg == null ? "—" : cg + "%"}.${trend}${worst ? ` O maior gargalo está em ${worst.de} → ${worst.para}.` : ""}${caveat}`;
  return { resumo, saude_geral, pontos_fortes, problemas, funil_observacoes };
}

// ---------- Diagnóstico por IA (opcional, pago) ----------
const INSIGHTS_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    resumo: { type: "string" }, saude_geral: { type: "string", enum: ["boa", "atencao", "critica"] },
    pontos_fortes: { type: "array", items: { type: "object", additionalProperties: false, properties: { titulo: { type: "string" }, detalhe: { type: "string" } }, required: ["titulo", "detalhe"] } },
    problemas: { type: "array", items: { type: "object", additionalProperties: false, properties: { titulo: { type: "string" }, gravidade: { type: "string", enum: ["alta", "media", "baixa"] }, detalhe: { type: "string" }, recomendacao: { type: "string" } }, required: ["titulo", "gravidade", "detalhe", "recomendacao"] } },
    funil_observacoes: { type: "array", items: { type: "string" } },
  },
  required: ["resumo", "saude_geral", "pontos_fortes", "problemas", "funil_observacoes"],
};
async function diagnoseByAI(metrics: Metrics, periodDays: number): Promise<Insights> {
  const userPrompt = `Métricas reais da Elarah dos últimos ${periodDays} dias (JSON). Analise e produza o diagnóstico:\n\n\`\`\`json\n${JSON.stringify(metrics, null, 2)}\n\`\`\``;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL, max_tokens: 16000, thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: { type: "json_schema", schema: INSIGHTS_SCHEMA } },
      system: "Você é a analista de growth/CRO da Elarah (experiências e presentes em SP). Recebe métricas reais e faz um diagnóstico honesto e prático de onde a empresa está pecando, em português do Brasil, com recomendações acionáveis. Não invente dados; se o volume for baixo, diga.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Anthropic HTTP " + res.status + " — " + (data?.error?.message ?? "erro"));
  const textBlock = (data.content ?? []).find((b: { type?: string }) => b.type === "text");
  if (!textBlock?.text) throw new Error("Resposta da IA sem texto.");
  return JSON.parse(textBlock.text) as Insights;
}

// ---------- Handler ----------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "Use POST." }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const auth = await authorizeRequest(req);
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, error: "Não autorizado (admin ou cron)." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: { period_days?: number; trigger?: "cron" | "manual"; send_email?: boolean; mode?: "rules" | "ai" } = {};
  try { body = await req.json(); } catch { /* vazio ok */ }
  let periodDays = Number(body.period_days);
  if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = 30;
  periodDays = Math.min(periodDays, 365);
  const mode: "rules" | "ai" = body.mode === "ai" ? "ai" : "rules";

  let metrics: Metrics;
  try { metrics = await buildMetrics(periodDays); }
  catch (e) { return new Response(JSON.stringify({ ok: false, error: "Falha ao ler dados: " + String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  let insights: Insights; let modelLabel: string;
  if (mode === "ai") {
    if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ ok: false, error: "mode ai pedido, mas ANTHROPIC_API_KEY não configurada." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try { insights = await diagnoseByAI(metrics, periodDays); modelLabel = ANTHROPIC_MODEL; }
    catch (e) { return new Response(JSON.stringify({ ok: false, error: "Falha na IA: " + String(e) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  } else {
    insights = diagnoseByRules(metrics); modelLabel = "análise por regras (sem IA)";
  }

  const trigger = body.trigger || auth.trigger;
  const generatedAt = new Date().toISOString();

  let emailed = false;
  if (trigger === "cron" || body.send_email === true) {
    try {
      const saudeTxt = ({ boa: "✅", atencao: "⚠️", critica: "🚨" } as Record<string, string>)[insights.saude_geral] || "🔍";
      const n = insights.problemas.length;
      const subject = `${saudeTxt} Elarah — diagnóstico do dia` + (n ? ` (${n} ${n === 1 ? "ponto" : "pontos"} de atenção)` : "");
      const r = await sendEmail(adminNotifyRecipients(), subject, digestEmailHtml(periodDays, modelLabel, insights, metrics));
      emailed = r.ok;
    } catch (e) { console.error("falha e-mail", e); }
  }

  try {
    const sb = getServiceClient();
    const { error } = await sb.from("analytics_insights_runs").insert({ period_days: periodDays, model: modelLabel, trigger, saude_geral: insights.saude_geral, metrics, insights, emailed });
    if (error) console.warn("não salvou o run", error.message);
  } catch (e) { console.warn("erro ao salvar run", String(e)); }

  return new Response(JSON.stringify({ ok: true, generated_at: generatedAt, model: modelLabel, mode, period_days: periodDays, trigger, emailed, metrics, insights }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
