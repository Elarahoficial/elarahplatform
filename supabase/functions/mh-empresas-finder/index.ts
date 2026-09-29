// =============================================================
// ELARAH MENTAL HEALTH — mh-empresas-finder Edge Function
// -------------------------------------------------------------
// Agente que acha EMPRESAS (não parceiros) pra prospecção da frente
// corporativa: ~100 novas por semana, sem repetir, direto em
// public.b2b_prospects (frente = 'mh').
//
// POST /functions/v1/mh-empresas-finder
//   Body (opcional): { target?: number (padrão 100, máx 150),
//                      cidade?: string (padrão "São Paulo") }
//
// Autorização (uma das opções):
//   Authorization: Bearer <CRON_SECRET>            (pg_cron semanal)
//   Authorization: Bearer <SERVICE_ROLE_KEY>
//   Authorization: Bearer <jwt de admin>           (botão no painel)
//
// Fonte: Google Places API (New) — Text Search. Traz nome, telefone,
// site, endereço e link do Maps. E-mail e LinkedIn do RH o Google não
// dá: o painel monta o link de busca no LinkedIn e sugere o e-mail
// pelo domínio do site na hora de abordar (sem inventar dado aqui).
//
// Dedupe: google_place_id é UNIQUE em b2b_prospects
// (sql/elarah_mental_health.sql), então rodar 2x não duplica.
//
// Secrets: GOOGLE_PLACES_API_KEY (o mesmo do prospect-finder),
//          CRON_SECRET (opcional, pro cron).
// Agendamento: sql/elarah_mental_health_finder_cron.sql
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PLACES_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Buscas que trazem empresas de médio porte com RH estruturado —
// o perfil que compra programa de saúde mental. Cada busca rende até
// 60 lugares (3 páginas). A ordem gira por semana pra variar a safra.
const BUSCAS: Array<{ q: string; tipo: string; segmento: string }> = [
  { q: "empresa de tecnologia", tipo: "tech", segmento: "Tecnologia" },
  { q: "empresa de software", tipo: "tech", segmento: "Software" },
  { q: "startup", tipo: "startup", segmento: "Startup" },
  { q: "fintech", tipo: "tech", segmento: "Fintech" },
  { q: "empresa de telecomunicações", tipo: "tech", segmento: "Telecom" },
  { q: "empresa de telemetria e rastreamento", tipo: "tech", segmento: "Telemetria" },
  { q: "e-commerce escritório", tipo: "tech", segmento: "E-commerce" },
  { q: "agência de publicidade", tipo: "agencia", segmento: "Publicidade" },
  { q: "agência de marketing digital", tipo: "agencia", segmento: "Marketing digital" },
  { q: "produtora audiovisual", tipo: "agencia", segmento: "Audiovisual / mídia" },
  { q: "escritório de advocacia", tipo: "escritorio_juridico", segmento: "Jurídico" },
  { q: "escritório de contabilidade", tipo: "escritorio", segmento: "Contabilidade" },
  { q: "consultoria empresarial", tipo: "escritorio", segmento: "Consultoria" },
  { q: "empresa de recursos humanos", tipo: "escritorio", segmento: "RH / recrutamento" },
  { q: "construtora", tipo: "construtora", segmento: "Construção" },
  { q: "incorporadora imobiliária", tipo: "imobiliaria", segmento: "Incorporação" },
  { q: "escritório de arquitetura", tipo: "arquitetura_design", segmento: "Arquitetura" },
  { q: "empresa de engenharia", tipo: "construtora", segmento: "Engenharia" },
  { q: "coworking", tipo: "coworking", segmento: "Coworking" },
  { q: "banco escritório corporativo", tipo: "escritorio", segmento: "Financeiro" },
  { q: "corretora de seguros", tipo: "escritorio", segmento: "Seguros" },
  { q: "hospital", tipo: "clinica", segmento: "Saúde" },
  { q: "indústria farmacêutica", tipo: "industria_leve", segmento: "Farmacêutica" },
  { q: "indústria de alimentos e bebidas", tipo: "industria_leve", segmento: "Alimentos e bebidas" },
  { q: "indústria", tipo: "industria_leve", segmento: "Indústria" },
  { q: "empresa de logística", tipo: "outro", segmento: "Logística" },
  { q: "call center", tipo: "outro", segmento: "Atendimento / call center" },
  { q: "escola particular", tipo: "outro", segmento: "Educação" },
  { q: "faculdade", tipo: "outro", segmento: "Educação superior" },
  { q: "rede de varejo escritório", tipo: "outro", segmento: "Varejo" },
  { q: "marca de moda escritório", tipo: "outro", segmento: "Moda" },
  { q: "hotel", tipo: "outro", segmento: "Hotelaria" },
  { q: "empresa de energia", tipo: "outro", segmento: "Energia" },
  { q: "empresa do agronegócio", tipo: "outro", segmento: "Agronegócio" },
  { q: "concessionária de veículos", tipo: "outro", segmento: "Automotivo" },
];

// No máximo 10 empresas novas de cada setor por rodada: 100 empresas
// = 10 setores diferentes. A cada semana a rodada começa em setores
// novos, então a fila fica sempre variada.
const POR_SETOR = 10;

interface Place {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function searchPage(textQuery: string, pageToken?: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.businessStatus",
        "nextPageToken",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "pt-BR",
      regionCode: "BR",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Places ${res.status}: ${t.slice(0, 200)}`);
  }
  return (await res.json()) as { places?: Place[]; nextPageToken?: string };
}

// Semana do ano — gira a ordem das buscas pra cada segunda trazer
// segmentos diferentes primeiro.
function weekOfYear(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.floor((d.getTime() - start) / (7 * 86400000));
}

// Equipe só da Mental Health (sql/elarah_mh_equipe.sql → is_mh_team)
// também pode buscar empresas pelo botão do painel.
async function authorizeEquipeMH(jwt: string): Promise<string | null> {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!jwt || !url || !anon) return null;
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: u, error } = await client.auth.getUser(jwt);
  if (error || !u?.user) return null;
  const { data: ok, error: rpcErr } = await client.rpc("is_mh_team");
  return !rpcErr && ok ? u.user.id : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const rawAuth = req.headers.get("Authorization") ?? "";
  const tk = rawAuth.replace(/^Bearer\s+/i, "").trim();
  const isCron = (!!CRON_SECRET && tk === CRON_SECRET) || (!!SERVICE_ROLE && tk === SERVICE_ROLE);
  if (!isCron) {
    const adminId = (await authorizeAdmin(rawAuth)) || (await authorizeEquipeMH(tk));
    if (!adminId) return json({ ok: false, error: "nao_autorizado" }, 401);
  }
  if (!PLACES_KEY) {
    return json({ ok: false, error: "GOOGLE_PLACES_API_KEY não configurada nos secrets das Edge Functions." }, 500);
  }

  let payload: { target?: number; cidade?: string } = {};
  try { payload = await req.json(); } catch { payload = {}; }
  const target = Math.max(1, Math.min(150, Number(payload.target) || 100));
  const cidade = String(payload.cidade || "São Paulo").slice(0, 60);

  const sb = getServiceClient();
  const porSetor = Math.max(1, Math.min(30, Number((payload as { porSetor?: number }).porSetor) || POR_SETOR));
  const setoresPorRodada = Math.ceil(target / porSetor);
  const offset = (weekOfYear() * setoresPorRodada) % BUSCAS.length;
  const ordem = [...BUSCAS.slice(offset), ...BUSCAS.slice(0, offset)];

  const vistos = new Set<string>();
  const novos: Record<string, unknown>[] = [];
  const erros: string[] = [];
  const started = Date.now();

  for (const b of ordem) {
    if (novos.length >= target) break;
    if (Date.now() - started > 110_000) break; // folga pro timeout do cron
    let pageToken: string | undefined;
    let doSetor = 0;
    for (let page = 0; page < 3 && novos.length < target && doSetor < porSetor; page++) {
      let data;
      try {
        data = await searchPage(`${b.q} em ${cidade}`, pageToken);
      } catch (e) {
        erros.push(String((e as Error).message || e));
        break;
      }
      const places = (data.places || []).filter((p) =>
        p.id && !vistos.has(p.id) && p.businessStatus !== "CLOSED_PERMANENTLY"
      );
      places.forEach((p) => vistos.add(p.id));
      if (places.length) {
        // Descarta quem já está no banco (de semanas anteriores).
        const ids = places.map((p) => p.id);
        const { data: exist } = await sb.from("b2b_prospects").select("google_place_id").in("google_place_id", ids);
        const ja = new Set((exist || []).map((r: { google_place_id: string }) => r.google_place_id));
        for (const p of places) {
          if (ja.has(p.id) || novos.length >= target || doSetor >= porSetor) continue;
          // Sem site nem telefone não dá pra abordar — pula.
          if (!p.websiteUri && !p.nationalPhoneNumber) continue;
          novos.push({
            nome: (p.displayName?.text || "Empresa").slice(0, 160),
            tipo_empresa: b.tipo,
            segmento: b.segmento,
            cidade,
            site: p.websiteUri || null,
            telefone: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
            endereco: p.formattedAddress || null,
            google_place_id: p.id,
            origem: "google_places_mh",
            frente: "mh",
            status_comercial: "nao_contatado",
            potencial: "medio",
            observacoes: p.googleMapsUri ? `Google Maps: ${p.googleMapsUri}` : null,
          });
          doSetor++;
        }
      }
      pageToken = data.nextPageToken;
      if (!pageToken) break;
      // O Google pede um respiro antes de usar o nextPageToken.
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  let inseridos = 0;
  if (novos.length) {
    const { data, error } = await sb
      .from("b2b_prospects")
      .upsert(novos, { onConflict: "google_place_id", ignoreDuplicates: true })
      .select("id");
    if (error) return json({ ok: false, error: error.message, erros }, 500);
    inseridos = (data || []).length;
  }

  return json({ ok: true, inseridos, buscados: vistos.size, target, erros: erros.slice(0, 5) });
});
