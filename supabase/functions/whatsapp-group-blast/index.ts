// =============================================================
// ELARAH — whatsapp-group-blast Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-group-blast
//
// Convida pro grupo da Elarah, por WhatsApp oficial (template aprovado
// `elarah_boas_vindas_grupo`), TODO MUNDO que a Elarah já tem contato e
// que ainda não recebeu — juntando DUAS fontes, deduplicadas por
// telefone:
//   • profiles           (usuários cadastrados)
//   • byelarah_submissions (interessados do formulário)
//
// Complementa a whatsapp-welcome (só cadastros novos). O controle de
// "quem já recebeu" é POR TELEFONE, na tabela whatsapp_group_invites —
// então não depende do "verde" do envio manual (que marca ao abrir, não
// ao entregar) e nunca manda 2x pro mesmo número.
//
// Auth: Bearer ELARAH_WEBHOOK_SECRET (SQL/pg_net) OU JWT de admin.
//
// Body JSON (opcional): { "batch": 200 }   // teto 250/dia da Meta
// Resposta: { ok, enviados, falharam, sem_telefone, limite_atingido, restantes }
//
// Pré-requisito: sql/elarah_whatsapp_group_invites.sql
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
const WEBHOOK_SECRET = Deno.env.get("ELARAH_WEBHOOK_SECRET") ??
  Deno.env.get("CRON_SECRET") ?? "";
const GROUP_LINK = Deno.env.get("WHATSAPP_GROUP_LINK") ??
  "https://chat.whatsapp.com/EKECUEVqH3DJo8rmdbYNLd";
const TEMPLATE = {
  name: Deno.env.get("WHATSAPP_TPL_BOAS_VINDAS") ?? "elarah_boas_vindas_grupo",
  language: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "pt_BR",
};

const MAX_BATCH = 200;
const DELAY_MS = 120;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function firstName(full: string | null | undefined): string {
  const t = String(full ?? "").trim();
  if (!t) return "tudo bem";
  return t.split(/\s+/)[0];
}

function isLimitError(status: number | undefined, err: string | undefined): boolean {
  if (status === 429) return true;
  const e = (err ?? "").toLowerCase();
  return e.includes("limit") || e.includes("limite") ||
    e.includes("131049") || e.includes("130472") || e.includes("80007");
}

interface Contact { phone: string; nome: string; }

// Junta profiles + byelarah_submissions, normaliza e deduplica por
// telefone. Guarda um nome não-vazio quando houver.
async function gatherContacts(): Promise<Contact[]> {
  const map = new Map<string, string>(); // phone -> nome

  const add = (nome: string | null, telefone: string | null) => {
    const phone = normalizePhoneBR(telefone);
    if (!phone) return;
    const existing = map.get(phone);
    if (existing === undefined) map.set(phone, (nome ?? "").trim());
    else if (!existing && nome) map.set(phone, nome.trim());
  };

  // Pagina TUDO (o PostgREST/Supabase corta em 1000 por página — sem
  // paginar, contas além de 1000 nunca entravam no disparo).
  const profs = await fetchAll("profiles", "nome, telefone", true);
  const subs = await fetchAll("byelarah_submissions", "nome, telefone", true);
  for (const r of profs) add(r.nome as string | null, r.telefone as string | null);
  for (const r of subs) add(r.nome as string | null, r.telefone as string | null);

  return [...map.entries()].map(([phone, nome]) => ({ phone, nome }));
}

// Busca TODAS as linhas de uma tabela, paginando de 1000 em 1000.
// comTelefone=true filtra só quem tem telefone preenchido.
async function fetchAll(
  table: string,
  columns: string,
  comTelefone: boolean,
): Promise<Array<Record<string, unknown>>> {
  const out: Array<Record<string, unknown>> = [];
  const page = 1000;
  for (let from = 0; from < 100000; from += page) {
    let q = supabase.from(table).select(columns).range(from, from + page - 1);
    if (comTelefone) q = q.not("telefone", "is", null).neq("telefone", "");
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as Array<Record<string, unknown>>));
    if (data.length < page) break;
  }
  return out;
}

// Telefones que já receberam (log) — paginado.
async function loadSentPhones(): Promise<Set<string>> {
  const set = new Set<string>();
  const rows = await fetchAll("whatsapp_group_invites", "phone", false);
  for (const r of rows) set.add(r.phone as string);
  return set;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Auth: segredo compartilhado OU admin.
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = (/^Bearer\s+(.+)$/i.exec(authHeader) || [])[1] || "";
  let authorized = WEBHOOK_SECRET !== "" && bearer === WEBHOOK_SECRET;
  if (!authorized) authorized = !!(await authorizeAdmin(authHeader));
  if (!authorized) return jsonResponse({ ok: false, error: "nao_autorizado" }, 401);

  if (!whatsappConfigured()) {
    return jsonResponse({ ok: false, error: "whatsapp_nao_configurado" }, 500);
  }

  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { /* corpo vazio ok */ }
  const batch = Math.min(MAX_BATCH, Math.max(1, Number(payload.batch) || MAX_BATCH));

  let contacts: Contact[];
  let sentSet: Set<string>;
  try {
    [contacts, sentSet] = await Promise.all([gatherContacts(), loadSentPhones()]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/whatsapp_group_invites/i.test(msg)) {
      return jsonResponse({
        ok: false,
        error: "tabela_ausente",
        detail: "Rode sql/elarah_whatsapp_group_invites.sql no Supabase.",
      }, 500);
    }
    return jsonResponse({ ok: false, error: "db_error", detail: msg }, 500);
  }

  const pendentes = contacts.filter((c) => !sentSet.has(c.phone));
  const lote = pendentes.slice(0, batch);

  let enviados = 0;
  let falharam = 0;
  let limiteAtingido = false;
  const sentThisRun: string[] = [];

  for (let i = 0; i < lote.length; i++) {
    const c = lote[i];
    const r = await sendWhatsAppTemplate(c.phone, TEMPLATE.name, TEMPLATE.language, [
      firstName(c.nome),
      GROUP_LINK,
    ]);
    if (r.ok) {
      enviados++;
      sentThisRun.push(c.phone);
      try {
        await supabase.from("whatsapp_group_invites")
          .upsert({ phone: c.phone, nome: c.nome || null }, { onConflict: "phone" });
      } catch (e) {
        console.warn("[whatsapp-group-blast] envio ok, log falhou —", c.phone, String(e));
      }
    } else {
      falharam++;
      console.error(
        "[whatsapp-group-blast] falha —",
        "phone=" + c.phone, "status=" + (r.status ?? "?"), "error=" + (r.error ?? "?"),
      );
      if (isLimitError(r.status, r.error)) { limiteAtingido = true; break; }
    }
    if (i < lote.length - 1) await sleep(DELAY_MS);
  }

  const restantes = Math.max(0, pendentes.length - enviados);

  // ----- Reconcilia o "verde" do painel -----
  // Marca whatsapp_followup_sent_at nas respostas do formulário cujo
  // telefone JÁ recebeu o convite (log completo — inclui rodadas
  // anteriores, então retroage pros que já foram). Best-effort.
  let marcadosVerde = 0;
  try {
    const sentAll = new Set<string>([...sentSet, ...sentThisRun]);
    const { data: subs } = await supabase
      .from("byelarah_submissions")
      .select("id, telefone, whatsapp_followup_sent_at")
      .is("whatsapp_followup_sent_at", null)
      .limit(5000);
    const ids: string[] = [];
    for (const s of (subs ?? [])) {
      const ph = normalizePhoneBR(s.telefone as string | null);
      if (ph && sentAll.has(ph)) ids.push(s.id as string);
    }
    for (let j = 0; j < ids.length; j += 200) {
      const chunk = ids.slice(j, j + 200);
      const { error } = await supabase
        .from("byelarah_submissions")
        .update({ whatsapp_followup_sent_at: new Date().toISOString() })
        .in("id", chunk);
      if (!error) marcadosVerde += chunk.length;
    }
  } catch (e) {
    console.warn("[whatsapp-group-blast] reconcile verde falhou (ok):", String(e));
  }

  console.info(
    "[whatsapp-group-blast] verde marcado no painel:", marcadosVerde,
  );

  console.info(
    "[whatsapp-group-blast] lote —",
    "enviados=" + enviados, "falharam=" + falharam,
    "restantes=" + restantes, "limite=" + limiteAtingido,
  );

  // Auto-continua: se ainda falta, HOUVE progresso e não bateu o limite
  // diário da Meta, a função reinvoca a si mesma (encadeia lotes até
  // acabar ou bater o limite). Assim o admin roda 1 comando só.
  // O guard `enviados > 0` evita loop infinito se tudo estiver falhando.
  try {
    const er = (globalThis as {
      EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void };
    }).EdgeRuntime;
    if (er && restantes > 0 && enviados > 0 && !limiteAtingido && WEBHOOK_SECRET) {
      er.waitUntil(
        fetch(`${SUPABASE_URL}/functions/v1/whatsapp-group-blast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${WEBHOOK_SECRET}`,
          },
          body: JSON.stringify({ batch }),
        }).then(() => undefined).catch(() => undefined),
      );
      console.info("[whatsapp-group-blast] auto-continua: reinvocando (restantes=" + restantes + ")");
    }
  } catch (e) {
    console.warn("[whatsapp-group-blast] auto-continua falhou (ok):", String(e));
  }

  return jsonResponse({
    ok: true,
    enviados,
    falharam,
    limite_atingido: limiteAtingido,
    restantes,
    marcados_verde: marcadosVerde,
    total_contatos: contacts.length,
    template: TEMPLATE.name,
  });
});
