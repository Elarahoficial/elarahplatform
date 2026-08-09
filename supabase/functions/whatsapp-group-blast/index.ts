// =============================================================
// ELARAH — whatsapp-group-blast Edge Function
// -------------------------------------------------------------
// POST /functions/v1/whatsapp-group-blast
//
// Convida os usuários JÁ CADASTRADOS (que ainda não receberam) pra
// entrar no grupo da Elarah, disparando o template oficial aprovado
// `elarah_boas_vindas_grupo`. Complementa a whatsapp-welcome (que só
// pega cadastros novos daqui pra frente): esta faz o "backfill" da
// base existente, em lotes, respeitando o limite diário da Meta.
//
// Auth: aceita DOIS jeitos —
//   1) Bearer ELARAH_WEBHOOK_SECRET  → dá pra disparar por SQL/pg_net.
//   2) JWT de admin (public.is_admin) → pra um botão no painel no futuro.
//
// Tracking "quem já recebeu": coluna profiles.group_invite_sent_at
// (migração sql/elarah_profiles_group_invite.sql). Quem já tem a data
// não é reenviado.
//
// Body JSON (tudo opcional):
//   { "batch": 200 }   // máx. de envios nesta chamada (teto 250/dia da Meta)
//
// Resposta: { ok, enviados, falharam, sem_telefone, limite_atingido, restantes_aprox }
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

// Teto por chamada. Nunca mais que 250 (limite diário de número novo na
// Meta). Intervalo curto entre envios — a API oficial aguenta ritmo alto,
// mas mantemos um respiro pra qualidade.
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  // ---- Auth: segredo compartilhado OU admin ----
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = (/^Bearer\s+(.+)$/i.exec(authHeader) || [])[1] || "";
  let authorized = false;
  if (WEBHOOK_SECRET && bearer === WEBHOOK_SECRET) {
    authorized = true;
  } else {
    const adminId = await authorizeAdmin(authHeader);
    if (adminId) authorized = true;
  }
  if (!authorized) {
    return jsonResponse({ ok: false, error: "nao_autorizado" }, 401);
  }

  if (!whatsappConfigured()) {
    return jsonResponse({ ok: false, error: "whatsapp_nao_configurado" }, 500);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch { /* corpo vazio é ok */ }
  const batch = Math.min(MAX_BATCH, Math.max(1, Number(payload.batch) || MAX_BATCH));

  // Carrega quem ainda não recebeu e tem telefone.
  let rows: Array<{ id: string; nome: string | null; telefone: string | null }>;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, telefone")
      .not("telefone", "is", null)
      .neq("telefone", "")
      .is("group_invite_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(batch);
    if (error) throw error;
    rows = (data ?? []) as typeof rows;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/group_invite_sent_at/i.test(msg)) {
      return jsonResponse({
        ok: false,
        error: "coluna_ausente",
        detail: "Rode sql/elarah_profiles_group_invite.sql no Supabase.",
      }, 500);
    }
    return jsonResponse({ ok: false, error: "db_error", detail: msg }, 500);
  }

  let enviados = 0;
  let falharam = 0;
  let semTelefone = 0;
  let limiteAtingido = false;

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    const phone = normalizePhoneBR(p.telefone);
    if (!phone) {
      semTelefone++;
      // Marca pra não reprocessar toda vez (telefone inválido).
      try {
        await supabase.from("profiles")
          .update({ group_invite_sent_at: new Date().toISOString() })
          .eq("id", p.id);
      } catch { /* best-effort */ }
      continue;
    }

    const r = await sendWhatsAppTemplate(phone, TEMPLATE.name, TEMPLATE.language, [
      firstName(p.nome),
      GROUP_LINK,
    ]);

    if (r.ok) {
      enviados++;
      try {
        await supabase.from("profiles")
          .update({ group_invite_sent_at: new Date().toISOString() })
          .eq("id", p.id);
      } catch (e) {
        console.warn("[whatsapp-group-blast] envio ok, update falhou —", "id=" + p.id, String(e));
      }
    } else {
      falharam++;
      console.error(
        "[whatsapp-group-blast] falha —",
        "phone=" + phone,
        "status=" + (r.status ?? "?"),
        "error=" + (r.error ?? "?"),
      );
      // Se bateu o limite diário da Meta, para o lote (o resto tenta amanhã).
      if (isLimitError(r.status, r.error)) {
        limiteAtingido = true;
        break;
      }
    }
    if (i < rows.length - 1) await sleep(DELAY_MS);
  }

  // Quantos ainda faltam (aprox — não valida telefone no SQL).
  let restantes = 0;
  try {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("telefone", "is", null)
      .neq("telefone", "")
      .is("group_invite_sent_at", null);
    restantes = count ?? 0;
  } catch { /* ok */ }

  console.info(
    "[whatsapp-group-blast] lote concluído —",
    "enviados=" + enviados, "falharam=" + falharam,
    "sem_telefone=" + semTelefone, "restantes=" + restantes,
    "limite=" + limiteAtingido,
  );

  return jsonResponse({
    ok: true,
    enviados,
    falharam,
    sem_telefone: semTelefone,
    limite_atingido: limiteAtingido,
    restantes_aprox: restantes,
    template: TEMPLATE.name,
  });
});
