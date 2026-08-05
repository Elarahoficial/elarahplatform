// =============================================================
// ELARAH — whatsapp-broadcast Edge Function (Meta Cloud API oficial)
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-broadcast
//
// Dispara AUTOMATICAMENTE (via API OFICIAL da Meta) um follow-up de
// WhatsApp pra TODOS os interessados de uma experiência By Elarah — a
// lista de "Respostas do formulário". Resolve o problema de clicar
// pessoa por pessoa (90+ respostas numa experiência só).
//
// Migrou de Z-API (número comum, restringido pela Meta) pra Cloud API
// oficial. Como esses contatos são "frios" (não mandaram mensagem nas
// últimas 24h), a Meta exige um TEMPLATE aprovado — ver _shared/whatsapp.ts.
//
// Contrato de variáveis do template (nesta ordem):
//   {{1}} = primeiro nome · {{2}} = nome da experiência · {{3}} = link
//
// Auth: exige JWT de ADMIN (public.is_admin()).
//
// Body JSON:
//   {
//     "mode": "count" | "test" | "send",
//     "experiencia": "Workshop de Ourivesaria: Crie sua Joia",
//     "item_slug": "ourivesaria-crie-sua-joia",   // opcional
//     "link": "https://elarah.com.br/joias.html",  // {{3}} do template
//     "only_new": true,        // pula quem já recebeu (send/count)
//     "test_phone": "5511999999999",  // só no mode test
//     "batch": 50,             // máx. de envios por chamada (send)
//     "message": "..."         // opcional: só pro log/auditoria
//   }
//
// Respostas:
//   count → { ok, unicos, novos, ja_contatados, sem_telefone }
//   test  → { ok, to, template }
//   send  → { ok, alvo, enviados, falharam, restantes, sem_telefone_ignorados, template }
//
// Tracking "quem já recebeu": whatsapp_followup_sent_at /
// whatsapp_followup_count em byelarah_submissions (mesma coluna do
// disparo manual). Requer sql/elarah_byelarah_followup_tracking.sql.
// Log agregado: whatsapp_broadcasts (best-effort).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import {
  normalizePhoneBR,
  sendWhatsAppTemplate,
  whatsappConfigured,
} from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Corte por chamada e intervalo entre envios. A Cloud API aguenta um
// ritmo bem maior que a Z-API, mas número novo tem limite de qualidade —
// mantemos um respiro curto. 50 × ~350ms ≈ 18s (abaixo do timeout).
const MAX_BATCH = 50;
const DELAY_MS = 350;

// ----- Template registry -----
// Default vem dos secrets; opcionalmente dá pra ter um template por
// campanha (mesma ordem de variáveis: nome, experiência, link). Todos
// os templates precisam estar APROVADOS na Meta com esse mesmo contrato.
const DEFAULT_TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "elarah_followup_experiencia",
  language: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR",
};
const TEMPLATE_CAMPAIGNS: Array<{ keywords: string[]; name: string; language?: string }> = [
  // Ex.: quando tiver um template dedicado aprovado pra joia:
  // { keywords: ["joia"], name: "elarah_followup_joia" },
];
function resolveTemplate(experienceName: string): { name: string; language: string } {
  const norm = String(experienceName ?? "")
    .toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  for (const c of TEMPLATE_CAMPAIGNS) {
    if (c.keywords.every((k) => norm.includes(k))) {
      return { name: c.name, language: c.language ?? DEFAULT_TEMPLATE.language };
    }
  }
  return { name: DEFAULT_TEMPLATE.name, language: DEFAULT_TEMPLATE.language };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// "Maria Silva" → "Maria". Sem nome → "tudo bem" (evita variável vazia,
// que a Meta rejeita; casa com o tom do envio manual).
function firstName(full: string | null | undefined): string {
  const t = String(full ?? "").trim();
  if (!t) return "tudo bem";
  return t.split(/\s+/)[0];
}

interface SubRow {
  id: string;
  nome: string | null;
  telefone: string | null;
  whatsapp_followup_sent_at: string | null;
  whatsapp_followup_count: number | null;
}

async function loadSubmissions(
  experiencia: string,
  itemSlug: string | null,
): Promise<SubRow[]> {
  let query = supabase
    .from("byelarah_submissions")
    .select("id, nome, telefone, whatsapp_followup_sent_at, whatsapp_followup_count")
    .order("created_at", { ascending: false })
    .limit(2000);

  const nomeLike = "%" + experiencia.replace(/[%_]/g, " ") + "%";
  if (itemSlug) {
    query = query.or(`item_slug.eq.${itemSlug},experiencia.ilike.${nomeLike}`);
  } else {
    query = query.ilike("experiencia", nomeLike);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SubRow[];
}

interface PhoneGroup {
  phone: string;
  nome: string;
  ids: string[];
  anyContacted: boolean;
  maxCount: number;
}

function groupByPhone(rows: SubRow[]): { groups: PhoneGroup[]; semTelefone: number } {
  const map = new Map<string, PhoneGroup>();
  let semTelefone = 0;
  for (const r of rows) {
    const phone = normalizePhoneBR(r.telefone);
    if (!phone) {
      semTelefone++;
      continue;
    }
    let g = map.get(phone);
    if (!g) {
      g = { phone, nome: r.nome ?? "", ids: [], anyContacted: false, maxCount: 0 };
      map.set(phone, g);
    }
    g.ids.push(r.id);
    if (!g.nome && r.nome) g.nome = r.nome;
    if (r.whatsapp_followup_sent_at) g.anyContacted = true;
    g.maxCount = Math.max(g.maxCount, Number(r.whatsapp_followup_count) || 0);
  }
  return { groups: [...map.values()], semTelefone };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  const adminId = await authorizeAdmin(req.headers.get("Authorization"));
  if (!adminId) {
    return jsonResponse({ ok: false, error: "nao_autorizado" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  const mode = String(payload.mode ?? "").trim();
  const experiencia = String(payload.experiencia ?? "").trim();
  const itemSlug = payload.item_slug ? String(payload.item_slug).trim() : null;
  const link = String(payload.link ?? "").trim() || "https://elarah.com.br";
  const previewMsg = String(payload.message ?? "");
  const onlyNew = payload.only_new !== false; // default true

  // ---- TEST: manda o template pro número informado ----
  if (mode === "test") {
    if (!whatsappConfigured()) {
      return jsonResponse({ ok: false, error: "nao_configurado" }, 400);
    }
    const testPhone = normalizePhoneBR(String(payload.test_phone ?? ""));
    if (!testPhone) {
      return jsonResponse({ ok: false, error: "telefone_teste_invalido" }, 400);
    }
    const tpl = resolveTemplate(experiencia);
    const r = await sendWhatsAppTemplate(testPhone, tpl.name, tpl.language, [
      "Você",
      experiencia || "nossa nova experiência",
      link,
    ]);
    if (!r.ok) {
      return jsonResponse(
        { ok: false, error: r.error ?? "falha_envio", status: r.status ?? null },
        502,
      );
    }
    return jsonResponse({ ok: true, to: testPhone, template: tpl.name });
  }

  if (!experiencia) {
    return jsonResponse({ ok: false, error: "experiencia_obrigatoria" }, 400);
  }

  let rows: SubRow[];
  try {
    rows = await loadSubmissions(experiencia, itemSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/whatsapp_followup/i.test(msg)) {
      return jsonResponse(
        {
          ok: false,
          error: "tracking_ausente",
          detail: "Rode sql/elarah_byelarah_followup_tracking.sql no Supabase.",
        },
        500,
      );
    }
    return jsonResponse({ ok: false, error: "db_error", detail: msg }, 500);
  }

  const { groups, semTelefone } = groupByPhone(rows);
  const unicos = groups.length;
  const jaContatados = groups.filter((g) => g.anyContacted).length;
  const novos = unicos - jaContatados;

  // ---- COUNT ----
  if (mode === "count") {
    return jsonResponse({
      ok: true,
      unicos,
      novos,
      ja_contatados: jaContatados,
      sem_telefone: semTelefone,
    });
  }

  // ---- SEND ----
  if (mode !== "send") {
    return jsonResponse({ ok: false, error: "mode_invalido" }, 400);
  }
  if (!whatsappConfigured()) {
    return jsonResponse({ ok: false, error: "nao_configurado" }, 400);
  }

  const tpl = resolveTemplate(experiencia);

  const pendentes = onlyNew ? groups.filter((g) => !g.anyContacted) : groups;
  const alvo = pendentes.length;

  const batchLimit = Math.min(
    MAX_BATCH,
    Math.max(1, Number(payload.batch) || MAX_BATCH),
  );
  const lote = pendentes.slice(0, batchLimit);

  let enviados = 0;
  let falharam = 0;
  const nowIso = () => new Date().toISOString();

  for (let i = 0; i < lote.length; i++) {
    const g = lote[i];
    const r = await sendWhatsAppTemplate(g.phone, tpl.name, tpl.language, [
      firstName(g.nome),
      experiencia,
      link,
    ]);
    if (r.ok) {
      enviados++;
      try {
        await supabase
          .from("byelarah_submissions")
          .update({
            whatsapp_followup_sent_at: nowIso(),
            whatsapp_followup_count: g.maxCount + 1,
          })
          .in("id", g.ids);
      } catch (e) {
        console.warn(
          "[Elarah whatsapp-broadcast] envio ok, mas update de tracking falhou —",
          "phone=" + g.phone,
          "err=" + String(e),
        );
      }
    } else {
      falharam++;
      console.error(
        "[Elarah whatsapp-broadcast] falha no envio —",
        "phone=" + g.phone,
        "status=" + (r.status ?? "?"),
        "error=" + (r.error ?? "?"),
      );
    }
    if (i < lote.length - 1) await sleep(DELAY_MS);
  }

  const restantes = Math.max(0, alvo - enviados);

  try {
    const status = falharam === 0
      ? (restantes === 0 ? "concluido" : "enviando")
      : (enviados > 0 ? "parcial" : "erro");
    await supabase.from("whatsapp_broadcasts").insert({
      experiencia,
      item_slug: itemSlug,
      mensagem: previewMsg || ("[template: " + tpl.name + "]"),
      total_alvo: alvo,
      enviados,
      falharam,
      sem_telefone: semTelefone,
      status,
      created_by: adminId,
    });
  } catch (e) {
    console.warn(
      "[Elarah whatsapp-broadcast] log em whatsapp_broadcasts falhou (ok):",
      String(e),
    );
  }

  return jsonResponse({
    ok: true,
    alvo,
    enviados,
    falharam,
    restantes,
    sem_telefone_ignorados: semTelefone,
    template: tpl.name,
  });
});
