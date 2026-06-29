// =============================================================
// ELARAH — prospect-finder (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// Agente caça-parceiros. Toda segunda busca no Google Maps ateliês/
// estúdios em SP nas categorias da Elarah, REMOVE os repetidos (quem
// já está na Prospecção) e adiciona os novos na tabela prospects —
// prontos pra você contatar. Nada inventado: dados reais do Google.
//
// DESLIGUE "Verify JWT" nas Settings (auth é por dentro).
// Pré-requisitos (SQL): elarah_crm_prospects.sql + elarah_prospect_finder.sql.
//
// Secrets:
//   SUPABASE_* (auto)
//   GOOGLE_PLACES_API_KEY  → sua chave do Google Places (obrigatória)
//   CRON_SECRET            → senha do disparo automático (opcional)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

// Alvo por rodada (semana). Sem teto rígido: pega todos os novos de
// qualidade até esse número. body.target pode aumentar/diminuir.
const DEFAULT_TARGET = 30;
const HARD_CEILING = 120;

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

async function authorize(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  const m = auth ? /^Bearer\s+(.+)$/i.exec(auth) : null;
  if (!m) return false;
  const token = m[1];
  if (CRON_SECRET && token === CRON_SECRET) return true;
  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) return true;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u } = await client.auth.getUser(token);
  if (!u?.user) return false;
  const { data: isAdmin } = await client.rpc("is_admin");
  return !!isAdmin;
}

function norm(s: unknown): string {
  return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Categorias × termos de busca. Os bairros dão PROFUNDIDADE (resultados
// diferentes a cada semana, sem repetir). A função para assim que junta
// leads novos suficientes, então a lista pode ser generosa.
const BAIRROS = ["Pinheiros", "Vila Madalena", "Itaim Bibi", "Moema", "Brooklin", "Vila Mariana", "Tatuapé", "Santana", "Perdizes", "Jardins"];
// CATEGORIAS NOVAS — experiências que a Elarah ainda NÃO tem, pra
// EXPANDIR o catálogo (não repetir cerâmica/vela/pintura etc.). Edite
// essa lista pra mirar os tipos de experiência que você quer oferecer.
const CATS: Array<{ categoria: string; termo: string }> = [
  { categoria: "vinho", termo: "degustação de vinhos" },
  { categoria: "queijos e vinhos", termo: "degustação de queijos e vinhos" },
  { categoria: "sushi", termo: "aula de sushi" },
  { categoria: "massas", termo: "aula de massas artesanais" },
  { categoria: "chocolate", termo: "oficina de chocolate artesanal" },
  { categoria: "café", termo: "curso de barista café especial" },
  { categoria: "cerveja", termo: "experiência de cervejaria artesanal" },
  { categoria: "coquetelaria", termo: "aula de coquetelaria e drinks" },
  { categoria: "dança", termo: "aula de dança de salão" },
  { categoria: "fotografia", termo: "aula de fotografia" },
  { categoria: "vitral", termo: "oficina de vitral" },
  { categoria: "marcenaria", termo: "oficina de marcenaria criativa" },
  { categoria: "arco e flecha", termo: "experiência de arco e flecha" },
  { categoria: "chá", termo: "degustação de chás" },
  { categoria: "terrário", termo: "oficina de terrário e plantas" },
  { categoria: "aromaterapia", termo: "oficina de aromaterapia" },
];
// Monta a fila de buscas: primeiro categoria + cidade, depois por bairro.
function buildQueries(): Array<{ categoria: string; query: string }> {
  const out: Array<{ categoria: string; query: string }> = [];
  for (const c of CATS) out.push({ categoria: c.categoria, query: `${c.termo} em São Paulo` });
  for (const b of BAIRROS) for (const c of CATS) out.push({ categoria: c.categoria, query: `${c.termo} ${b} São Paulo` });
  return out;
}

interface Lead { place_id: string; nome: string; categoria: string; telefone: string | null; site: string | null; endereco: string | null; rating: number | null; maps: string | null; }

const FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.googleMapsUri,nextPageToken";

// Uma página de resultados do Places (New).
async function placesSearch(query: string, pageToken?: string): Promise<{ places: any[]; nextPageToken?: string; error?: string }> {
  const body: Record<string, unknown> = {
    textQuery: query, languageCode: "pt-BR", regionCode: "BR", pageSize: 20,
    locationBias: { circle: { center: { latitude: -23.5505, longitude: -46.6333 }, radius: 35000 } },
  };
  if (pageToken) body.pageToken = pageToken;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": FIELD_MASK },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { places: [], error: "Google " + res.status + " " + (await res.text().catch(() => "")).slice(0, 200) };
  const data = await res.json();
  return { places: data.places || [], nextPageToken: data.nextPageToken };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST." }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!(await authorize(req))) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!GOOGLE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "GOOGLE_PLACES_API_KEY não configurada nos secrets." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: { mode?: string; target?: number } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const mode = body.mode === "preview" ? "preview" : "run";
  const target = Math.min(HARD_CEILING, Math.max(1, Number(body.target) > 0 ? Number(body.target) : DEFAULT_TARGET));
  const sb = sbc();

  try {
    // Já existentes: place_ids + nomes normalizados (dedupe forte).
    const { data: existing, error: exErr } = await sb.from("prospects").select("google_place_id, nome").limit(100000);
    if (exErr) throw new Error("Falha ao ler prospects: " + exErr.message + " (rodou os SQLs?)");
    const seenPid = new Set<string>();
    const seenName = new Set<string>();
    (existing ?? []).forEach((p: { google_place_id: string | null; nome: string | null }) => {
      if (p.google_place_id) seenPid.add(p.google_place_id);
      if (p.nome) seenName.add(norm(p.nome));
    });

    const queries = buildQueries();
    const novos: Lead[] = [];
    let googleCalls = 0;
    let lastErr = "";

    outer:
    for (const q of queries) {
      if (novos.length >= target) break;
      let pageToken: string | undefined = undefined;
      for (let page = 0; page < 2; page++) {
        if (novos.length >= target) break outer;
        const r = await placesSearch(q.query, pageToken);
        googleCalls++;
        if (r.error) { lastErr = r.error; break; }
        for (const pl of r.places) {
          const pid = pl.id;
          const nome = pl.displayName?.text || "";
          if (!pid || !nome) continue;
          if (seenPid.has(pid) || seenName.has(norm(nome))) continue;
          seenPid.add(pid); seenName.add(norm(nome));
          novos.push({
            place_id: pid, nome, categoria: q.categoria,
            telefone: pl.nationalPhoneNumber || null, site: pl.websiteUri || null,
            endereco: pl.formattedAddress || null, rating: typeof pl.rating === "number" ? pl.rating : null,
            maps: pl.googleMapsUri || null,
          });
          if (novos.length >= target) break;
        }
        if (!r.nextPageToken) break;
        pageToken = r.nextPageToken;
      }
    }

    if (mode === "preview") {
      return new Response(JSON.stringify({ ok: true, mode, encontrados: novos.length, google_calls: googleCalls, amostra: novos.slice(0, 30), aviso: lastErr || undefined }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insere (ignora se o place_id já existir — corrida segura).
    let inseridos = 0;
    if (novos.length) {
      const rows = novos.map((l) => ({
        nome: l.nome, categoria: l.categoria, whatsapp: l.telefone, site: l.site,
        cidade: "São Paulo", status: "nao_contatado", origem: "google_places", google_place_id: l.place_id,
        observacoes: [l.rating != null ? `Nota Google ${l.rating}` : null, l.endereco, l.maps].filter(Boolean).join(" · "),
      }));
      const { data: ins, error: insErr } = await sb.from("prospects")
        .upsert(rows, { onConflict: "google_place_id", ignoreDuplicates: true }).select("id");
      if (insErr) throw new Error("Falha ao inserir: " + insErr.message);
      inseridos = (ins ?? []).length;
    }

    return new Response(JSON.stringify({ ok: true, mode, encontrados: novos.length, inseridos, google_calls: googleCalls, aviso: lastErr || undefined }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
