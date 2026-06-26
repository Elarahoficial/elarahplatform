// =============================================================
// ELARAH — analytics-insights Edge Function
// -------------------------------------------------------------
// POST /functions/v1/analytics-insights
//   Body (opcional): { period_days?: number }   (default 30)
//
// Headers:
//   Authorization: Bearer <jwt do admin>   (uso manual via UI)
//
// O que faz — o agente "Onde estamos pecando":
//   1. Valida que quem chamou é admin (mesma checagem das outras
//      functions sensíveis).
//   2. Lê os dados que JÁ existem no Supabase:
//        - public.analytics_events (funil de navegação + tráfego)
//        - public.bookings        (vendas reais + receita)
//      e monta um resumo compacto de métricas.
//   3. Manda esse resumo pra Claude (claude-opus-4-8) e pede um
//      DIAGNÓSTICO em português: o que funciona, onde a conversão
//      cai, onde a gente está pecando, e o que fazer.
//   4. Devolve { metrics, insights } pro painel admin renderizar.
//
// IMPORTANTE — modo "sempre avisar antes":
//   Esta function é READ-ONLY. Ela NÃO altera nada no banco, não
//   envia e-mail, não muda o painel sozinha. Só gera o diagnóstico
//   pra Maria Fernanda ler e decidir. Nenhuma ação automática.
//
// Secrets necessários (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY   sk-ant-...   (chave da Claude / Anthropic)
//   (SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY o
//    Supabase já injeta sozinho.)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
// Modelo padrão. Pode sobrescrever via secret se quiser trocar.
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-4-8";

// -----------------------------------------------------------
// Eventos do funil (na ordem em que o cliente atravessa o site).
// Os nomes batem com os que analytics.js emite no front.
// -----------------------------------------------------------
const FUNNEL_STEPS: Array<{ event: string; label: string }> = [
  { event: "page_view", label: "Visitas (page view)" },
  { event: "experience_detail_view", label: "Viu detalhe de experiência" },
  { event: "reserve_click", label: "Clicou em Reservar" },
  { event: "checkout_started", label: "Iniciou checkout" },
  { event: "payment_approved", label: "Pagamento aprovado" },
];

// Outros eventos úteis pra leitura de comportamento.
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
}

// Conta eventos por nome no período (sem puxar as linhas — usa COUNT).
async function countEvent(
  sb: ReturnType<typeof getServiceClient>,
  eventName: string,
  sinceISO: string,
): Promise<number> {
  const { count, error } = await sb
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_name", eventName)
    .gte("created_at", sinceISO);
  if (error) {
    console.warn("[analytics-insights] count falhou", eventName, error.message);
    return 0;
  }
  return count ?? 0;
}

// Agrega uma lista de linhas por uma chave (ex.: utm_source), devolve
// top N como [{ chave, total }] ordenado desc.
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
  return [...map.entries()]
    .map(([chave, total]) => ({ chave, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function brl(centavos: number): string {
  const v = (centavos / 100).toFixed(2).replace(".", ",");
  return "R$ " + v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// -----------------------------------------------------------
// Monta o resumo de métricas a partir do que existe no banco.
// -----------------------------------------------------------
async function buildMetrics(periodDays: number) {
  const sb = getServiceClient();
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const sinceISO = since.toISOString();

  // ---- Funil: contagem por etapa ----
  const funnel: Array<{ etapa: string; total: number; conversao_da_etapa_anterior_pct: number | null }> = [];
  let prev: number | null = null;
  for (const step of FUNNEL_STEPS) {
    const total = await countEvent(sb, step.event, sinceISO);
    const conv = prev && prev > 0 ? Math.round((total / prev) * 1000) / 10 : null;
    funnel.push({ etapa: step.label, total, conversao_da_etapa_anterior_pct: conv });
    prev = total;
  }

  // ---- Outros eventos ----
  const outros: Record<string, number> = {};
  for (const ev of EXTRA_EVENTS) {
    outros[ev] = await countEvent(sb, ev, sinceISO);
  }

  // ---- Tráfego: agrega page_view por utm_source/medium (amostra) ----
  const { data: pvRows } = await sb
    .from("analytics_events")
    .select("metadata, path")
    .eq("event_name", "page_view")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(5000);
  const pv = (pvRows ?? []) as Array<Record<string, unknown>>;
  const meta = (r: Record<string, unknown>) =>
    (r.metadata ?? {}) as Record<string, unknown>;
  const trafego_por_origem = topBy(pv, (r) => meta(r).utm_source as string);
  const trafego_por_midia = topBy(pv, (r) => meta(r).utm_medium as string);
  const paginas_mais_vistas = topBy(pv, (r) => (r.path ?? meta(r).landing_page) as string, 10);

  // ---- Experiências mais vistas (detalhe) ----
  const { data: detailRows } = await sb
    .from("analytics_events")
    .select("target_label")
    .eq("event_name", "experience_detail_view")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(5000);
  const experiencias_mais_vistas = topBy(
    (detailRows ?? []) as Array<Record<string, unknown>>,
    (r) => r.target_label as string,
    10,
  );

  // ---- Vendas reais (bookings) ----
  const statuses = ["pago", "pending", "cancelado", "expirado", "reembolsado"];
  const bookings_por_status: Record<string, number> = {};
  for (const st of statuses) {
    const { count } = await sb
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", st)
      .gte("created_at", sinceISO);
    bookings_por_status[st] = count ?? 0;
  }

  // Receita + experiências mais vendidas (só pagas).
  const { data: paidRows } = await sb
    .from("bookings")
    .select("experiencia_nome, amount_total")
    .eq("status", "pago")
    .gte("created_at", sinceISO)
    .limit(5000);
  const paid = (paidRows ?? []) as Array<Record<string, unknown>>;
  let receitaCentavos = 0;
  for (const b of paid) receitaCentavos += Number(b.amount_total) || 0;
  const experiencias_mais_vendidas = topBy(
    paid,
    (r) => r.experiencia_nome as string,
    10,
  );

  // Conversão geral: visitas -> pagamento aprovado.
  const visitas = funnel[0]?.total ?? 0;
  const pagamentos = funnel[funnel.length - 1]?.total ?? 0;
  const conversao_geral_pct = visitas > 0
    ? Math.round((pagamentos / visitas) * 10000) / 100
    : null;

  return {
    periodo_dias: periodDays,
    desde: sinceISO,
    funil: funnel,
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
  };
}

// -----------------------------------------------------------
// Esquema do diagnóstico que a Claude devolve (structured output).
// -----------------------------------------------------------
const INSIGHTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    resumo: { type: "string" },
    saude_geral: { type: "string", enum: ["boa", "atencao", "critica"] },
    pontos_fortes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          detalhe: { type: "string" },
        },
        required: ["titulo", "detalhe"],
      },
    },
    problemas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          gravidade: { type: "string", enum: ["alta", "media", "baixa"] },
          detalhe: { type: "string" },
          recomendacao: { type: "string" },
        },
        required: ["titulo", "gravidade", "detalhe", "recomendacao"],
      },
    },
    funil_observacoes: { type: "array", items: { type: "string" } },
  },
  required: ["resumo", "saude_geral", "pontos_fortes", "problemas", "funil_observacoes"],
};

const SYSTEM_PROMPT =
  `Você é a analista de crescimento (growth / CRO) da Elarah, uma plataforma ` +
  `de curadoria de experiências e presentes em São Paulo. Você recebe métricas ` +
  `reais do site e das vendas e produz um diagnóstico HONESTO e PRÁTICO de onde ` +
  `a empresa está pecando, o que está funcionando, e o que fazer a seguir.\n\n` +
  `Regras:\n` +
  `- Responda em português do Brasil, tom direto e acolhedor (você fala com a ` +
  `fundadora, Maria Fernanda).\n` +
  `- Foque em onde o funil perde gente e por quê. Aponte gargalos concretos.\n` +
  `- Para cada problema, dê uma recomendação acionável (o que mexer essa semana).\n` +
  `- Seja específico com os números que recebeu; não invente dados que não estão lá.\n` +
  `- Se os volumes forem baixos demais pra conclusões fortes, diga isso com clareza ` +
  `em vez de fingir certeza.\n` +
  `- Não sugira nenhuma ação automática: você só recomenda, quem decide é a Maria Fernanda.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---- Autorização: só admin ----
  const adminId = await authorizeAdmin(req.headers.get("Authorization"));
  if (!adminId) {
    return new Response(
      JSON.stringify({ ok: false, error: "Não autorizado (precisa ser admin)." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "ANTHROPIC_API_KEY não configurada. Cadastre o secret em " +
          "Supabase → Edge Functions → Secrets e faça redeploy.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: InsightsBody = {};
  try {
    body = (await req.json()) as InsightsBody;
  } catch { /* corpo vazio é ok */ }
  let periodDays = Number(body.period_days);
  if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = 30;
  periodDays = Math.min(periodDays, 365);

  // ---- 1. Métricas do banco ----
  let metrics;
  try {
    metrics = await buildMetrics(periodDays);
  } catch (e) {
    console.error("[analytics-insights] falha ao montar métricas", e);
    return new Response(
      JSON.stringify({ ok: false, error: "Falha ao ler dados do banco: " + String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ---- 2. Diagnóstico via Claude ----
  const userPrompt =
    `Aqui estão as métricas reais da Elarah dos últimos ${periodDays} dias ` +
    `(JSON). Analise e produza o diagnóstico:\n\n` +
    "```json\n" + JSON.stringify(metrics, null, 2) + "\n```";

  let insights;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        // Espaço pro raciocínio (thinking conta no max_tokens) + o JSON.
        // 16k fica abaixo do limite de timeout pra requisição não-streaming.
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: INSIGHTS_SCHEMA },
        },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[analytics-insights] Anthropic rejeitou", res.status, JSON.stringify(data).slice(0, 800));
      return new Response(
        JSON.stringify({
          ok: false,
          error: "A IA recusou a requisição (HTTP " + res.status + ").",
          details: data?.error?.message ?? null,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Com structured output, o primeiro bloco de texto é o JSON válido.
    const textBlock = (data.content ?? []).find(
      (b: { type?: string }) => b.type === "text",
    );
    if (!textBlock?.text) {
      throw new Error("Resposta da IA sem bloco de texto.");
    }
    insights = JSON.parse(textBlock.text);
  } catch (e) {
    console.error("[analytics-insights] falha na chamada à IA", e);
    return new Response(
      JSON.stringify({ ok: false, error: "Falha ao gerar diagnóstico: " + String(e) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      generated_at: new Date().toISOString(),
      model: ANTHROPIC_MODEL,
      period_days: periodDays,
      metrics,
      insights,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
