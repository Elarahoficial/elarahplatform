// =============================================================
// ELARAH — analytics-insights Edge Function
// -------------------------------------------------------------
// POST /functions/v1/analytics-insights
//   Body (opcional): { period_days?, trigger?, send_email?, mode? }
//     mode: "rules" (padrão, CUSTO ZERO) | "ai" (usa a Claude, pago)
//
// Headers (uma das opções):
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>   (cron / pg_net)
//   Authorization: Bearer <jwt do admin>                (uso manual via UI)
//
// O agente AUTÔNOMO "Onde estamos pecando":
//   1. Valida quem chamou (service_role do cron OU admin).
//   2. Lê o que JÁ existe no Supabase:
//        - public.analytics_events (funil + tráfego)
//        - public.bookings        (vendas reais + receita)
//      e monta um resumo de métricas (período atual vs anterior).
//   3. Gera o DIAGNÓSTICO:
//        - mode "rules"  → por REGRAS, no próprio servidor. SEM IA,
//          SEM custo. É o padrão.
//        - mode "ai"     → manda as métricas pra Claude (pago).
//   4. GRAVA em public.analytics_insights_runs → o painel mostra o
//      último sozinho, sem ninguém clicar.
//   5. No cron (todo dia), ENVIA o resumo por e-mail (Resend).
//
// Observador, não operador: lê os dados e escreve só o próprio
// diagnóstico (log + e-mail). Não mexe em site/vendas/campanhas.
//
// Secrets:
//   (rules)  nenhum específico — só os que o Supabase já injeta.
//   (e-mail) RESEND_API_KEY (já usado no projeto), ADMIN_NOTIFY_EMAILS (opc.)
//   (ai)     ANTHROPIC_API_KEY  → só necessário se usar mode "ai".
//   ANTHROPIC_MODEL (opc., default claude-opus-4-8)
//
// Agendamento: sql/elarah_analytics_insights_cron.sql
// Tabela:      sql/elarah_analytics_insights.sql
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";
import { requireEnv } from "../_shared/social_config.ts";
import { sendAnalyticsDigest } from "../_shared/email.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-4-8";

const FUNNEL_STEPS: Array<{ event: string; label: string }> = [
  { event: "page_view", label: "Visitas" },
  { event: "experience_detail_view", label: "Viu detalhe de experiência" },
  { event: "reserve_click", label: "Clicou em Reservar" },
  { event: "checkout_started", label: "Iniciou checkout" },
  { event: "payment_approved", label: "Pagamento aprovado" },
];

const EXTRA_EVENTS = [
  "search_used",
  "category_filter_used",
  "whatsapp_click",
  "gift_card_click",
  "checkout_error",
  "payment_failed",
  "payment_pending",
];

interface InsightsBody {
  period_days?: number;
  trigger?: "cron" | "manual";
  send_email?: boolean;
  mode?: "rules" | "ai";
}

// O formato do diagnóstico (igual nos dois modos: regras e IA).
interface Insights {
  resumo: string;
  saude_geral: "boa" | "atencao" | "critica";
  pontos_fortes: Array<{ titulo: string; detalhe: string }>;
  problemas: Array<{ titulo: string; gravidade: "alta" | "media" | "baixa"; detalhe: string; recomendacao: string }>;
  funil_observacoes: string[];
}

// -----------------------------------------------------------
// Auth — service_role (cron) OU admin JWT (UI).
// -----------------------------------------------------------
async function authorizeRequest(
  req: Request,
): Promise<{ ok: boolean; trigger: "cron" | "manual" }> {
  const auth = req.headers.get("Authorization");
  const m = auth ? /^Bearer\s+(.+)$/i.exec(auth) : null;
  if (!m) return { ok: false, trigger: "manual" };
  const token = m[1];
  // 1) senha própria do cron (CRON_SECRET) — caminho confiável.
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  if (cronSecret && token === cronSecret) return { ok: true, trigger: "cron" };
  // 2) service_role key (compatibilidade).
  try {
    const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (token === serviceRole) return { ok: true, trigger: "cron" };
  } catch { /* segue pro admin */ }
  const adminId = await authorizeAdmin(auth);
  return { ok: !!adminId, trigger: "manual" };
}

// -----------------------------------------------------------
// Helpers de leitura
// -----------------------------------------------------------
type Sb = ReturnType<typeof getServiceClient>;

async function countEvent(sb: Sb, eventName: string, fromISO: string, toISO?: string): Promise<number> {
  let q = sb.from("analytics_events").select("*", { count: "exact", head: true })
    .eq("event_name", eventName).gte("created_at", fromISO);
  if (toISO) q = q.lt("created_at", toISO);
  const { count, error } = await q;
  if (error) { console.warn("[analytics-insights] count falhou", eventName, error.message); return 0; }
  return count ?? 0;
}

async function paidBookings(sb: Sb, fromISO: string, toISO?: string): Promise<Array<Record<string, unknown>>> {
  let q = sb.from("bookings").select("experiencia_nome, amount_total").eq("status", "pago").gte("created_at", fromISO);
  if (toISO) q = q.lt("created_at", toISO);
  const { data } = await q.limit(5000);
  return (data ?? []) as Array<Record<string, unknown>>;
}

function topBy(
  rows: Array<Record<string, unknown>>,
  keyFn: (r: Record<string, unknown>) => string | null | undefined,
  limit = 8,
): Array<{ chave: string; total: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = keyFn(r);
    const key = (raw == null || raw === "") ? "(desconhecido)" : String(raw);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([chave, total]) => ({ chave, total }))
    .sort((a, b) => b.total - a.total).slice(0, limit);
}

function brl(centavos: number): string {
  const v = (centavos / 100).toFixed(2).replace(".", ",");
  return "R$ " + v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function pct(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}
function delta(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

// -----------------------------------------------------------
// Métricas (período atual + comparativo com o período anterior)
// -----------------------------------------------------------
async function buildMetrics(periodDays: number) {
  const sb = getServiceClient();
  const now = Date.now();
  const since = new Date(now - periodDays * 86400000);
  const sinceISO = since.toISOString();
  const prevSinceISO = new Date(now - periodDays * 2 * 86400000).toISOString();

  // Funil
  const funil: Array<{ etapa: string; total: number; conversao_da_etapa_anterior_pct: number | null }> = [];
  let prev: number | null = null;
  for (const step of FUNNEL_STEPS) {
    const total = await countEvent(sb, step.event, sinceISO);
    funil.push({ etapa: step.label, total, conversao_da_etapa_anterior_pct: prev && prev > 0 ? pct(total, prev) : null });
    prev = total;
  }

  const outros: Record<string, number> = {};
  for (const ev of EXTRA_EVENTS) outros[ev] = await countEvent(sb, ev, sinceISO);

  // Tráfego (amostra de page_view)
  const { data: pvRows } = await sb.from("analytics_events")
    .select("metadata, path").eq("event_name", "page_view")
    .gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(5000);
  const pv = (pvRows ?? []) as Array<Record<string, unknown>>;
  const meta = (r: Record<string, unknown>) => (r.metadata ?? {}) as Record<string, unknown>;
  const trafego_por_origem = topBy(pv, (r) => meta(r).utm_source as string);
  const trafego_por_midia = topBy(pv, (r) => meta(r).utm_medium as string);
  const paginas_mais_vistas = topBy(pv, (r) => (r.path ?? meta(r).landing_page) as string, 10);

  // Experiências mais vistas
  const { data: detailRows } = await sb.from("analytics_events")
    .select("target_label").eq("event_name", "experience_detail_view")
    .gte("created_at", sinceISO).order("created_at", { ascending: false }).limit(5000);
  const experiencias_mais_vistas = topBy(
    (detailRows ?? []) as Array<Record<string, unknown>>, (r) => r.target_label as string, 10,
  );

  // Bookings por status
  const statuses = ["pago", "pending", "cancelado", "expirado", "reembolsado"];
  const bookings_por_status: Record<string, number> = {};
  for (const st of statuses) {
    const { count } = await sb.from("bookings").select("*", { count: "exact", head: true })
      .eq("status", st).gte("created_at", sinceISO);
    bookings_por_status[st] = count ?? 0;
  }

  // Vendas pagas + receita + top vendidas
  const paid = await paidBookings(sb, sinceISO);
  let receitaCentavos = 0;
  for (const b of paid) receitaCentavos += Number(b.amount_total) || 0;
  const experiencias_mais_vendidas = topBy(paid, (r) => r.experiencia_nome as string, 10);

  const visitas = funil[0]?.total ?? 0;
  const pagamentos = funil[funil.length - 1]?.total ?? 0;
  const conversao_geral_pct = pct(pagamentos, visitas);

  // Comparativo com o período anterior (números-chave).
  const visitasAnt = await countEvent(sb, "page_view", prevSinceISO, sinceISO);
  const pagamentosAnt = await countEvent(sb, "payment_approved", prevSinceISO, sinceISO);
  const paidAnt = await paidBookings(sb, prevSinceISO, sinceISO);
  let receitaAntCent = 0;
  for (const b of paidAnt) receitaAntCent += Number(b.amount_total) || 0;

  return {
    periodo_dias: periodDays,
    desde: sinceISO,
    funil,
    conversao_geral_visita_para_pagamento_pct: conversao_geral_pct,
    outros_eventos: outros,
    trafego_por_origem,
    trafego_por_midia,
    paginas_mais_vistas,
    experiencias_mais_vistas,
    bookings_por_status,
    vendas_pagas: paid.length,
    receita_total: brl(receitaCentavos),
    receita_total_centavos: receitaCentavos,
    experiencias_mais_vendidas,
    comparativo: {
      visitas_anterior: visitasAnt,
      pagamentos_anterior: pagamentosAnt,
      vendas_anterior: paidAnt.length,
      receita_anterior_centavos: receitaAntCent,
      conversao_anterior_pct: pct(pagamentosAnt, visitasAnt),
      delta_visitas_pct: delta(visitas, visitasAnt),
      delta_vendas_pct: delta(paid.length, paidAnt.length),
      delta_receita_pct: delta(receitaCentavos, receitaAntCent),
    },
  };
}

type Metrics = Awaited<ReturnType<typeof buildMetrics>>;

// -----------------------------------------------------------
// Diagnóstico por REGRAS (custo zero, sem IA) — padrão.
// -----------------------------------------------------------
function recoForStep(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("detalhe")) return "Quem chega na home não está clicando nas experiências. Reveja as fotos, os títulos e a vitrine inicial pra dar mais vontade de abrir.";
  if (l.includes("reservar")) return "As pessoas abrem a experiência mas não clicam em Reservar. Olhe preço, descrição, datas disponíveis e se o botão está claro e visível.";
  if (l.includes("checkout")) return "Clicam em Reservar mas não chegam a iniciar o checkout. Verifique se há fricção ou erro no passo intermediário.";
  if (l.includes("pagamento")) return "Iniciam o checkout mas não pagam. Teste um checkout real e cheque a integração de pagamento (Stripe / Mercado Pago).";
  return "Investigue por que as pessoas param nessa etapa.";
}

function diagnoseByRules(m: Metrics): Insights {
  const problemas: Insights["problemas"] = [];
  const pontos_fortes: Insights["pontos_fortes"] = [];
  const funil = m.funil;
  const visitas = funil[0]?.total ?? 0;
  const cg = m.conversao_geral_visita_para_pagamento_pct;
  const cmp = m.comparativo;

  // 1) Maior gargalo do funil
  let worst: { de: string; para: string; conv: number; perdeu: number } | null = null;
  for (let i = 1; i < funil.length; i++) {
    const s = funil[i], p = funil[i - 1];
    if (p.total > 0 && s.conversao_da_etapa_anterior_pct != null) {
      if (!worst || s.conversao_da_etapa_anterior_pct < worst.conv) {
        worst = { de: p.etapa, para: s.etapa, conv: s.conversao_da_etapa_anterior_pct, perdeu: p.total - s.total };
      }
    }
  }
  if (worst) {
    const grav: Insights["problemas"][0]["gravidade"] = worst.conv < 20 ? "alta" : worst.conv < 50 ? "media" : "baixa";
    problemas.push({
      titulo: `Maior queda do funil: ${worst.de} → ${worst.para}`,
      gravidade: grav,
      detalhe: `Só ${worst.conv}% de quem passou por "${worst.de}" avançou pra "${worst.para}" — ${worst.perdeu} pessoa(s) pararam aí.`,
      recomendacao: recoForStep(worst.para),
    });
  }

  // 2) Experiências muito vistas e pouco vendidas
  const vendidas = new Set(m.experiencias_mais_vendidas.map((e) => e.chave));
  const vistasSemVenda = m.experiencias_mais_vistas
    .filter((e) => e.chave !== "(desconhecido)" && !vendidas.has(e.chave)).slice(0, 3);
  if (vistasSemVenda.length) {
    problemas.push({
      titulo: "Experiências com muita visita e pouca venda",
      gravidade: "media",
      detalhe: `Tiveram bastante visualização mas não aparecem entre as vendidas: ${vistasSemVenda.map((e) => `${e.chave} (${e.total} views)`).join("; ")}.`,
      recomendacao: "O interesse existe, falta converter: reveja preço, fotos, datas e o texto dessas páginas.",
    });
  }

  // 3) Conversão geral baixa (só com volume mínimo)
  if (cg != null && cg < 1 && visitas >= 50) {
    problemas.push({
      titulo: "Conversão geral baixa",
      gravidade: "media",
      detalhe: `A conversão de visita → pagamento está em ${cg}%.`,
      recomendacao: "Reduza atrito no checkout e dê destaque às experiências que já vendem.",
    });
  }

  // 4) Tendência de vendas em queda
  if (cmp.delta_vendas_pct != null && cmp.delta_vendas_pct < 0) {
    problemas.push({
      titulo: `Vendas caíram ${Math.abs(cmp.delta_vendas_pct)}% vs. o período anterior`,
      gravidade: cmp.delta_vendas_pct <= -30 ? "alta" : "media",
      detalhe: `Foram ${cmp.vendas_anterior} vendas no período anterior e ${m.vendas_pagas} agora.`,
      recomendacao: "Veja se mudou o tráfego, alguma campanha pausou ou faltou data disponível.",
    });
  }

  // 5) Erros de checkout / pagamento
  const erros = (m.outros_eventos.checkout_error || 0) + (m.outros_eventos.payment_failed || 0);
  if (erros >= 5) {
    problemas.push({
      titulo: `${erros} erros de checkout/pagamento no período`,
      gravidade: "media",
      detalhe: "Gente tentando pagar e batendo em erro.",
      recomendacao: "Cheque a integração de pagamento (Stripe / Mercado Pago) e faça um checkout de teste.",
    });
  }

  // Pontos fortes
  if (m.experiencias_mais_vendidas.length) {
    const t = m.experiencias_mais_vendidas[0];
    pontos_fortes.push({ titulo: "Carro-chefe de vendas", detalhe: `${t.chave} lidera com ${t.total} venda(s) no período.` });
  }
  if (cmp.delta_vendas_pct != null && cmp.delta_vendas_pct > 0) {
    pontos_fortes.push({ titulo: "Vendas em alta", detalhe: `As vendas subiram ${cmp.delta_vendas_pct}% vs. o período anterior.` });
  }
  if (cmp.delta_receita_pct != null && cmp.delta_receita_pct > 0) {
    pontos_fortes.push({ titulo: "Receita crescendo", detalhe: `A receita subiu ${cmp.delta_receita_pct}% vs. o período anterior.` });
  }
  // Melhor etapa de conversão
  let best: { de: string; para: string; conv: number } | null = null;
  for (let i = 1; i < funil.length; i++) {
    const s = funil[i], p = funil[i - 1];
    if (s.conversao_da_etapa_anterior_pct != null && (!best || s.conversao_da_etapa_anterior_pct > best.conv)) {
      best = { de: p.etapa, para: s.etapa, conv: s.conversao_da_etapa_anterior_pct };
    }
  }
  if (best && best.conv >= 50) {
    pontos_fortes.push({ titulo: "Etapa que funciona bem", detalhe: `${best.de} → ${best.para} converte ${best.conv}%.` });
  }
  const topOrigem = m.trafego_por_origem.find((o) => o.chave !== "(desconhecido)");
  if (topOrigem) {
    pontos_fortes.push({ titulo: "Principal fonte de tráfego", detalhe: `${topOrigem.chave} trouxe ${topOrigem.total} visitas no período.` });
  }

  const funil_observacoes = funil.map((s) =>
    `${s.etapa}: ${s.total}` + (s.conversao_da_etapa_anterior_pct != null ? ` (${s.conversao_da_etapa_anterior_pct}% da etapa anterior)` : "")
  );

  const saude_geral: Insights["saude_geral"] =
    m.vendas_pagas === 0 ? "critica" : problemas.some((p) => p.gravidade === "alta") ? "atencao" : "boa";

  const dV = cmp.delta_vendas_pct;
  const trend = dV == null ? "" : dV > 0 ? ` Vendas subiram ${dV}% vs. o período anterior.` : dV < 0 ? ` Vendas caíram ${Math.abs(dV)}% vs. o período anterior.` : " Vendas estáveis vs. o período anterior.";
  const caveat = visitas < 50 ? " (Volume ainda baixo — leia como tendência, não como verdade absoluta.)" : "";
  const resumo =
    `Nos últimos ${m.periodo_dias} dias: ${visitas} visitas, ${m.vendas_pagas} vendas pagas (${m.receita_total}), ` +
    `conversão geral ${cg == null ? "—" : cg + "%"}.${trend}` +
    (worst ? ` O maior gargalo está em ${worst.de} → ${worst.para}.` : "") + caveat;

  return { resumo, saude_geral, pontos_fortes, problemas, funil_observacoes };
}

// -----------------------------------------------------------
// Diagnóstico por IA (Claude) — opcional, pago.
// -----------------------------------------------------------
const INSIGHTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    resumo: { type: "string" },
    saude_geral: { type: "string", enum: ["boa", "atencao", "critica"] },
    pontos_fortes: {
      type: "array",
      items: { type: "object", additionalProperties: false, properties: { titulo: { type: "string" }, detalhe: { type: "string" } }, required: ["titulo", "detalhe"] },
    },
    problemas: {
      type: "array",
      items: { type: "object", additionalProperties: false, properties: { titulo: { type: "string" }, gravidade: { type: "string", enum: ["alta", "media", "baixa"] }, detalhe: { type: "string" }, recomendacao: { type: "string" } }, required: ["titulo", "gravidade", "detalhe", "recomendacao"] },
    },
    funil_observacoes: { type: "array", items: { type: "string" } },
  },
  required: ["resumo", "saude_geral", "pontos_fortes", "problemas", "funil_observacoes"],
};

const SYSTEM_PROMPT =
  `Você é a analista de crescimento (growth / CRO) da Elarah, uma plataforma de ` +
  `curadoria de experiências e presentes em São Paulo. Recebe métricas reais do ` +
  `site e das vendas e produz um diagnóstico HONESTO e PRÁTICO de onde a empresa ` +
  `está pecando, o que funciona e o que fazer.\n\n` +
  `Regras: responda em português do Brasil, tom direto e acolhedor (você fala com ` +
  `a fundadora). Foque nos gargalos do funil e dê recomendações acionáveis. Seja ` +
  `específico com os números recebidos; não invente dados. Se o volume for baixo ` +
  `demais, diga isso. Não sugira ações automáticas — você só recomenda.`;

async function diagnoseByAI(metrics: Metrics, periodDays: number): Promise<Insights> {
  const userPrompt =
    `Métricas reais da Elarah dos últimos ${periodDays} dias (JSON). Analise e ` +
    `produza o diagnóstico:\n\n\`\`\`json\n${JSON.stringify(metrics, null, 2)}\n\`\`\``;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: { type: "json_schema", schema: INSIGHTS_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error("Anthropic HTTP " + res.status + " — " + (data?.error?.message ?? "erro"));
  }
  const textBlock = (data.content ?? []).find((b: { type?: string }) => b.type === "text");
  if (!textBlock?.text) throw new Error("Resposta da IA sem bloco de texto.");
  return JSON.parse(textBlock.text) as Insights;
}

// -----------------------------------------------------------
// Handler
// -----------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST." }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await authorizeRequest(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado (precisa ser admin ou cron)." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: InsightsBody = {};
  try { body = (await req.json()) as InsightsBody; } catch { /* corpo vazio ok */ }
  let periodDays = Number(body.period_days);
  if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = 30;
  periodDays = Math.min(periodDays, 365);
  const mode: "rules" | "ai" = body.mode === "ai" ? "ai" : "rules";

  // 1. Métricas
  let metrics: Metrics;
  try {
    metrics = await buildMetrics(periodDays);
  } catch (e) {
    console.error("[analytics-insights] falha ao montar métricas", e);
    return new Response(JSON.stringify({ ok: false, error: "Falha ao ler dados: " + String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Diagnóstico (regras grátis por padrão; IA só se pedido e configurado)
  let insights: Insights;
  let modelLabel: string;
  if (mode === "ai") {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({
        ok: false,
        error: "mode \"ai\" pedido, mas ANTHROPIC_API_KEY não está configurada. Use mode \"rules\" (grátis) ou cadastre o secret.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    try {
      insights = await diagnoseByAI(metrics, periodDays);
      modelLabel = ANTHROPIC_MODEL;
    } catch (e) {
      console.error("[analytics-insights] falha na IA", e);
      return new Response(JSON.stringify({ ok: false, error: "Falha ao gerar diagnóstico por IA: " + String(e) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    insights = diagnoseByRules(metrics);
    modelLabel = "análise por regras (sem IA)";
  }

  const trigger = body.trigger || auth.trigger;
  const generatedAt = new Date().toISOString();

  // 3. E-mail (no cron, ou se pedido)
  let emailed = false;
  if (trigger === "cron" || body.send_email === true) {
    try {
      const r = await sendAnalyticsDigest({ periodDays, model: modelLabel, generatedAt, insights, metrics });
      emailed = !!r.ok;
    } catch (e) {
      console.error("[analytics-insights] falha ao enviar e-mail", e);
    }
  }

  // 4. Grava o run (o painel mostra o último sozinho)
  try {
    const sb = getServiceClient();
    const { error } = await sb.from("analytics_insights_runs").insert({
      period_days: periodDays, model: modelLabel, trigger,
      saude_geral: insights.saude_geral, metrics, insights, emailed,
    });
    if (error) console.warn("[analytics-insights] não salvou o run", error.message);
  } catch (e) {
    console.warn("[analytics-insights] erro ao salvar o run", String(e));
  }

  return new Response(JSON.stringify({
    ok: true, generated_at: generatedAt, model: modelLabel, mode,
    period_days: periodDays, trigger, emailed, metrics, insights,
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
