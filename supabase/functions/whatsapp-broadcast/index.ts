// =============================================================
// ELARAH — whatsapp-broadcast Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-broadcast
//
// Dispara AUTOMATICAMENTE (via Z-API) um follow-up de WhatsApp pra
// TODOS os interessados de uma experiência By Elarah — a lista que
// aparece no painel "Respostas do formulário". Resolve o problema de
// ter que clicar pessoa por pessoa (90+ respostas numa experiência só).
//
// Auth: exige JWT de ADMIN (public.is_admin()). Só a dona/admin logada
// no painel consegue disparar.
//
// Body JSON:
//   {
//     "mode": "count" | "test" | "send",
//     "experiencia": "Workshop de Ourivesaria: Crie sua Joia",  // nome
//     "item_slug": "ourivesaria-crie-sua-joia",                 // opcional
//     "message": "Oi {NOME_PRIMEIRO}! ...",  // já com LINK/CUPOM resolvidos;
//                                            // só {NOME_PRIMEIRO} é preenchido aqui
//     "only_new": true,       // pula quem já recebeu (send/count)
//     "test_phone": "5511999999999",  // só no mode test
//     "batch": 50             // máx. de envios por chamada (send)
//   }
//
// Respostas:
//   count → { ok, unicos, novos, ja_contatados, sem_telefone }
//   test  → { ok, to }
//   send  → { ok, alvo, enviados, falharam, restantes, sem_telefone_ignorados }
//
// O painel chama `send` em loop até `restantes` chegar a 0 (ou parar de
// progredir), mostrando barra de progresso. O corte por chamada (batch)
// evita estourar o timeout da Edge Function em listas grandes.
//
// Tracking "quem já recebeu": grava whatsapp_followup_sent_at /
// whatsapp_followup_count em byelarah_submissions (mesma coluna do
// disparo manual). Requer sql/elarah_byelarah_followup_tracking.sql.
// Log agregado por campanha: whatsapp_broadcasts (opcional — best-effort,
// não quebra se a tabela não existir; ver sql/elarah_whatsapp_broadcasts.sql).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import {
  normalizePhoneBR,
  sendWhatsAppText,
  whatsappConfigured,
} from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Corte por chamada e intervalo entre envios. O intervalo dá uma
// "respirada" pra reduzir risco de bloqueio da Z-API/Meta e ficar
// abaixo do timeout da Edge Function. 50 × ~900ms ≈ 45s.
const MAX_BATCH = 50;
const DELAY_MS = 900;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// "Maria Silva" → "Maria". Sem nome → "" (a mensagem cai no texto puro).
function firstName(full: string | null | undefined): string {
  const t = String(full ?? "").trim();
  if (!t) return "";
  return t.split(/\s+/)[0];
}

// Substitui {NOME_PRIMEIRO} (case-sensitive) no template. Os demais
// placeholders (LINK, CUPOM, PRECO_*) já vêm resolvidos do painel.
function personalize(template: string, nome: string): string {
  const primeiro = firstName(nome);
  // Se não há nome, evita "Oi ," / "Oi {NOME_PRIMEIRO}" — troca por
  // "" e limpa vírgula/espaço solto logo após uma saudação simples.
  let out = String(template ?? "").replace(/\{NOME_PRIMEIRO\}/g, primeiro);
  if (!primeiro) {
    out = out.replace(/\b([Oo]i|[Oo]l[áa]|[Ee]i)\s*,/g, "$1");
  }
  return out;
}

interface SubRow {
  id: string;
  nome: string | null;
  telefone: string | null;
  whatsapp_followup_sent_at: string | null;
  whatsapp_followup_count: number | null;
}

// Carrega os interessados de uma experiência. Mesmo filtro do modal do
// painel: por item_slug OU por nome (ILIKE).
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

// Agrupa por telefone normalizado (dedupe): quem preencheu 2x pra a
// mesma experiência recebe UMA mensagem só. Guarda todos os ids do
// telefone pra marcar todos como contatados de uma vez.
interface PhoneGroup {
  phone: string;
  nome: string;
  ids: string[];
  anyContacted: boolean;
  maxCount: number;
}

function groupByPhone(rows: SubRow[]): {
  groups: PhoneGroup[];
  semTelefone: number;
} {
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
    // Guarda um nome não-vazio, se houver, pra personalizar.
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

  // ---- Autorização: só admin ----
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
  const message = String(payload.message ?? "");
  const onlyNew = payload.only_new !== false; // default true

  // ---- TEST: manda pro número informado (o WhatsApp da própria admin) ----
  if (mode === "test") {
    if (!whatsappConfigured()) {
      return jsonResponse({ ok: false, error: "nao_configurado" }, 400);
    }
    const testPhone = normalizePhoneBR(String(payload.test_phone ?? ""));
    if (!testPhone) {
      return jsonResponse({ ok: false, error: "telefone_teste_invalido" }, 400);
    }
    if (!message.trim()) {
      return jsonResponse({ ok: false, error: "mensagem_vazia" }, 400);
    }
    const r = await sendWhatsAppText(testPhone, personalize(message, "Você"));
    if (!r.ok) {
      return jsonResponse(
        { ok: false, error: r.error ?? "falha_envio", status: r.status ?? null },
        502,
      );
    }
    return jsonResponse({ ok: true, to: testPhone });
  }

  if (!experiencia) {
    return jsonResponse({ ok: false, error: "experiencia_obrigatoria" }, 400);
  }

  // Carrega interessados (compartilhado entre count e send).
  let rows: SubRow[];
  try {
    rows = await loadSubmissions(experiencia, itemSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Coluna de tracking ausente → dica clara.
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

  // ---- COUNT: só informa números pra o painel montar o confirm ----
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
  if (!message.trim()) {
    return jsonResponse({ ok: false, error: "mensagem_vazia" }, 400);
  }

  // Alvo = telefones pendentes (novos, se only_new; senão todos).
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
    const r = await sendWhatsAppText(g.phone, personalize(message, g.nome));
    if (r.ok) {
      enviados++;
      // Marca TODAS as respostas desse telefone como contatadas.
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
    // Intervalo entre envios (menos no último).
    if (i < lote.length - 1) await sleep(DELAY_MS);
  }

  const restantes = Math.max(0, alvo - enviados);

  // Log agregado por chamada (best-effort — não derruba o retorno).
  try {
    const status = falharam === 0
      ? (restantes === 0 ? "concluido" : "enviando")
      : (enviados > 0 ? "parcial" : "erro");
    await supabase.from("whatsapp_broadcasts").insert({
      experiencia,
      item_slug: itemSlug,
      mensagem: message,
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
  });
});
