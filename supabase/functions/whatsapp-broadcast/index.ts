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
  gatedSendWhatsApp,
  normalizePhoneBR,
  sendWhatsAppText,
  whatsappAllowlistHas,
  whatsappConfigured,
  whatsappDryRun,
  whatsappSendingDisabled,
} from "../_shared/whatsapp.ts";
import { maskPhone } from "../_shared/whatsapp_gate.js";

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
// JANELA ANTI-REENVIO: mesmo com only_new=false ("reenviar a todos"), um
// número contatado nas últimas N horas NÃO recebe de novo. Isso mata o
// cenário "cliquei duas vezes / re-disparei sem querer" — que, como o
// campaign_id muda a cada clique, o portão sozinho NÃO deduplicaria entre
// campanhas distintas. Uma recampanha legítima (dias depois) passa normal.
const RECONTACT_COOLDOWN_MS = 12 * 3600_000; // 12h

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

// Carrega os interessados de UMA experiência.
//
// SEGURANÇA (fix crítico): usa MATCH EXATO — nunca "pedaço do nome".
// Antes era `experiencia ILIKE '%NOME%'`, que casava "Vela" com "Vela
// Aromática", "Vela (Cerveja...)", etc. → carregava gente de VÁRIAS
// experiências e mandava pra quem não era. Além disso o nome ia cru pro
// `.or(...)` do PostgREST, e nome com vírgula/parênteses quebrava a query.
//
// Regra agora:
//   - Se veio item_slug → filtra SÓ por ele (identificador único, exato).
//   - Senão → filtra pelo nome EXATO (.eq), com parâmetro seguro (sem
//     interpolar em string de filtro). Under-match (não achar) é seguro;
//     over-match (mandar pra estranho) não é.
async function loadSubmissions(
  experiencia: string,
  itemSlug: string | null,
): Promise<SubRow[]> {
  let query = supabase
    .from("byelarah_submissions")
    .select("id, nome, telefone, whatsapp_followup_sent_at, whatsapp_followup_count")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (itemSlug) {
    query = query.eq("item_slug", itemSlug);
  } else {
    query = query.eq("experiencia", experiencia);
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
  lastSentAt: number | null; // ms do envio mais recente (null = nunca)
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
      g = { phone, nome: r.nome ?? "", ids: [], anyContacted: false, maxCount: 0, lastSentAt: null };
      map.set(phone, g);
    }
    g.ids.push(r.id);
    // Guarda um nome não-vazio, se houver, pra personalizar.
    if (!g.nome && r.nome) g.nome = r.nome;
    if (r.whatsapp_followup_sent_at) {
      g.anyContacted = true;
      const t = Date.parse(r.whatsapp_followup_sent_at);
      if (Number.isFinite(t)) g.lastSentAt = Math.max(g.lastSentAt ?? 0, t);
    }
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
  // ID da campanha (o painel gera 1 por clique em "enviar"). Entra na chave
  // de idempotência (bcast:<campaign>:<phone>) → dois lotes/cliques da MESMA
  // campanha nunca reenviam pro mesmo número; uma campanha NOVA (id novo) pode.
  const campaignId = String(payload.campaign_id ?? "").trim() ||
    ("noid-" + (itemSlug || experiencia).replace(/\s+/g, "_").slice(0, 40));

  // ---- TEST: manda pro número informado (o WhatsApp da própria admin) ----
  if (mode === "test") {
    if (!whatsappConfigured()) {
      return jsonResponse({ ok: false, error: "nao_configurado" }, 400);
    }
    const testPhone = normalizePhoneBR(String(payload.test_phone ?? ""));
    if (!testPhone) {
      return jsonResponse({ ok: false, error: "telefone_teste_invalido" }, 400);
    }
    // TRAVA: o teste só pode ir pra número na allowlist — nunca pra um
    // estranho, mesmo em produção, mesmo com typo da admin.
    if (!whatsappAllowlistHas(testPhone)) {
      return jsonResponse(
        { ok: false, error: "fora_da_allowlist", message: "O teste só envia pra números em WHATSAPP_TEST_ALLOWLIST." },
        403,
      );
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

  // ---- LIST: dispara pra uma lista avulsa (nome + telefone) colada no painel.
  //      Mesmo PORTÃO (telefone validado, idempotência, kill switch, pausa
  //      entre envios). Usado pro convite do grupo pros usuários. dedupe_key
  //      grpinvite:<campaign>:<phone> — com campaign_id FIXO do painel, a
  //      mesma pessoa nunca recebe 2x, mesmo re-clicando/re-rodando. ----
  if (mode === "list") {
    if (whatsappSendingDisabled()) {
      return jsonResponse({ ok: false, error: "envio_desligado", detail: "WHATSAPP_SENDING_ENABLED=false (kill switch)." }, 423);
    }
    if (!whatsappConfigured()) return jsonResponse({ ok: false, error: "nao_configurado" }, 400);
    if (!message.trim()) return jsonResponse({ ok: false, error: "mensagem_vazia" }, 400);
    // deno-lint-ignore no-explicit-any
    const rawRecipients: any[] = Array.isArray(payload.recipients) ? payload.recipients : [];
    // Normaliza + dedupe por telefone (inválido é descartado, nunca coagido).
    const seen = new Set<string>();
    const alvos: { nome: string; phone: string }[] = [];
    let invalidos = 0;
    for (const r of rawRecipients) {
      const phone = normalizePhoneBR(String(r?.telefone ?? ""));
      if (!phone) { invalidos++; continue; }
      if (seen.has(phone)) continue;
      seen.add(phone);
      alvos.push({ nome: String(r?.nome ?? ""), phone });
    }
    if (!alvos.length) return jsonResponse({ ok: false, error: "lista_vazia", invalidos }, 400);
    const dryL = whatsappDryRun();
    let enviadosL = 0, falharamL = 0, duplicadosL = 0;
    let abortL: string | null = null;
    for (let i = 0; i < alvos.length; i++) {
      const g = alvos[i];
      const res = await gatedSendWhatsApp(supabase, {
        kind: "group_invite",
        dedupeKey: "grpinvite:" + campaignId + ":" + g.phone,
        identifierOk: true,
        rawPhone: g.phone,
        suppressed: false,
        statusAllowed: true,
        message: personalize(message, g.nome),
        createdBy: adminId,
      });
      if (res.reason === "sending_disabled" || res.reason === "staging_blocked") { abortL = res.reason; break; }
      if (res.sent || res.dryRun) enviadosL++;
      else if (res.reason === "duplicate") duplicadosL++; // já tinha recebido antes
      else falharamL++;
      if (i < alvos.length - 1 && !res.dryRun && res.reason !== "duplicate") await sleep(DELAY_MS);
    }
    return jsonResponse({
      ok: true, total: alvos.length, enviados: enviadosL, duplicados: duplicadosL,
      falharam: falharamL, invalidos, dry_run: dryL, abort_reason: abortL,
    });
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
    // Amostra pra CONFIRMAÇÃO FINAL da audiência (trava #3/#10): nome +
    // telefone MASCARADO + motivo. Nunca devolve o número inteiro.
    const alvoSample = (onlyNew ? groups.filter((g) => !g.anyContacted) : groups).slice(0, 8);
    const motivo = itemSlug
      ? ("Preencheu o formulário de interesse (" + (experiencia || itemSlug) + ")")
      : ("Interesse na experiência: " + experiencia);
    const amostra = alvoSample.map((g) => ({
      nome: g.nome || "(sem nome)",
      telefone_mascarado: maskPhone(g.phone),
      motivo,
    }));
    return jsonResponse({
      ok: true,
      unicos,
      novos,
      ja_contatados: jaContatados,
      sem_telefone: semTelefone,
      experiencia,
      item_slug: itemSlug,
      amostra,
    });
  }

  // ---- SEND ----
  if (mode !== "send") {
    return jsonResponse({ ok: false, error: "mode_invalido" }, 400);
  }
  // KILL SWITCH: se o envio estiver desligado, nem começa.
  if (whatsappSendingDisabled()) {
    return jsonResponse(
      { ok: false, error: "envio_desligado", detail: "WHATSAPP_SENDING_ENABLED=false — envio bloqueado (kill switch)." },
      423,
    );
  }
  if (!whatsappConfigured()) {
    return jsonResponse({ ok: false, error: "nao_configurado" }, 400);
  }
  if (!message.trim()) {
    return jsonResponse({ ok: false, error: "mensagem_vazia" }, 400);
  }

  const dryRun = whatsappDryRun();

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
  let puladosCooldown = 0;
  let abortReason: string | null = null;
  const nowIso = () => new Date().toISOString();
  const agora = Date.now();

  for (let i = 0; i < lote.length; i++) {
    const g = lote[i];
    // JANELA ANTI-REENVIO (fail-closed contra clique-duplo / re-disparo):
    // contatado nas últimas RECONTACT_COOLDOWN_MS → PULA, mesmo com
    // only_new=false. O portão só deduplica por campaign_id, e o painel gera
    // um id novo a cada clique — então esta é a trava que impede a mesma
    // pessoa de receber duas vezes entre cliques/campanhas próximas.
    if (g.lastSentAt !== null && (agora - g.lastSentAt) < RECONTACT_COOLDOWN_MS) {
      puladosCooldown++;
      continue;
    }
    // PORTÃO ÚNICO: idempotência (bcast:<campaign>:<phone>) + fail-closed +
    // kill switch + ambiente. Dois broadcasts simultâneos → só 1 reserva/envia.
    const res = await gatedSendWhatsApp(supabase, {
      kind: "broadcast",
      dedupeKey: "bcast:" + campaignId + ":" + g.phone,
      identifierOk: true, // experiência veio por slug/nome EXATO (match .eq)
      rawPhone: g.phone,
      suppressed: false,
      statusAllowed: true,
      message: personalize(message, g.nome),
      createdBy: adminId,
    });
    // Trava global / ambiente errado → para TUDO na hora.
    if (res.reason === "sending_disabled" || res.reason === "staging_blocked") {
      abortReason = res.reason;
      break;
    }
    if (res.sent || res.dryRun || res.reason === "duplicate") {
      enviados++; // conta pra barra andar (enviado, simulado ou já-enviado)
      // Marca o tracking de campanha só em envio REAL (não em dry-run nem
      // duplicate). Se a marcação falhar, ABORTA pra não arriscar re-spam.
      if (res.sent) {
        const { error: upErr } = await supabase
          .from("byelarah_submissions")
          .update({
            whatsapp_followup_sent_at: nowIso(),
            whatsapp_followup_count: g.maxCount + 1,
          })
          .in("id", g.ids);
        if (upErr) {
          console.error(
            "[Elarah whatsapp-broadcast] envio OK mas TRACKING FALHOU — abortando lote —",
            "err=" + upErr.message,
          );
          abortReason = "tracking_failed";
          break;
        }
      }
    } else {
      falharam++;
      console.error(
        "[Elarah whatsapp-broadcast] não enviado —",
        "phone=" + g.phone,
        "motivo=" + (res.reason ?? "?"),
      );
    }
    // Intervalo entre envios (menos no último).
    if (i < lote.length - 1) await sleep(DELAY_MS);
  }

  // Cooldown-pulados contam como "resolvidos" (não serão reenviados nesta
  // sessão) — senão o painel ficaria re-chamando send em loop pra eles.
  const restantes = Math.max(0, alvo - enviados - puladosCooldown);

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
    pulados_cooldown: puladosCooldown,
    restantes,
    sem_telefone_ignorados: semTelefone,
    dry_run: dryRun,
    // Quando o tracking falha, o painel deve PARAR o loop (não rechamar send)
    // pra não arriscar duplicar. Mostra o aviso pra admin.
    abort_reason: abortReason,
  });
});
