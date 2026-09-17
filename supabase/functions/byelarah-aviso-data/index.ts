// =============================================================
// ELARAH — byelarah-aviso-data Edge Function
// -------------------------------------------------------------
// Envia, sozinha, o aviso "a data saiu" pra quem se inscreveu na lista de
// interesse de um evento By Elarah enquanto ele ainda era "Data em breve".
//
// FLUXO COMPLETO
//   1. Admin publica a data no item By Elarah (painel ou SQL).
//   2. Trigger do banco enfileira UMA onda em byelarah_date_announcements
//      (ver sql/elarah_byelarah_aviso_data.sql). A trigger NÃO envia nada.
//   3. Esta função consome a fila e manda o WhatsApp com data, horário,
//      local e o LINK de inscrição.
//
// QUEM CHAMA
//   * pg_cron a cada 5 min (Authorization: Bearer CRON_SECRET) — a rede de
//     segurança: pega onda enfileirada por SQL, retoma lote interrompido.
//   * O próprio painel, logo depois de salvar o item (JWT de admin) — é o
//     que faz o aviso sair em segundos, não em minutos.
//
// TUDO passa pelo PORTÃO ÚNICO (gatedSendWhatsApp): idempotência
// (whatsapp_send_log UNIQUE), kill switch, modo observação, rollout,
// allowlist, fail-closed. Esta função não tem caminho que fure o portão.
//
// RETOMADA: cada envio real carimba aviso_data_announcement_id na
// byelarah_submissions. Uma chamada processa no máximo MAX_ENVIOS_POR_RUN
// telefones; a onda fica em 'enviando' e a chamada seguinte continua de onde
// parou. Onda pendente há mais de EXPIRA_HORAS é encerrada sem enviar — data
// velha nunca vira disparo surpresa.
//
// Deploy com verify_jwt OFF (autentica por dentro: cron OU admin).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import {
  byelarahDateAnnouncementTemplateParams,
  byelarahDateAnnouncementWhatsAppText,
  byelarahOpenEnrollmentTemplateParams,
  byelarahOpenEnrollmentWhatsAppText,
  experienceImageUrl,
  gatedSendWhatsApp,
  normalizePhoneBR,
  whatsappConfigured,
  whatsappSendingDisabled,
} from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Corte por chamada: fica abaixo do timeout da Edge Function (60 × ~1s ≈ 60s)
// e dá uma respirada entre envios pra reduzir risco de bloqueio da Z-API.
const MAX_ENVIOS_POR_RUN = 60;
const MAX_ONDAS_POR_RUN = 3;
const DELAY_MS = 1000;
// Onda que não conseguiu sair nesse tempo é encerrada sem enviar. Evita que
// uma data de meses atrás dispare quando o kill switch/rollout for religado.
const EXPIRA_HORAS = 72;
// Quem recebeu QUALQUER WhatsApp de follow-up nas últimas N horas não recebe o
// aviso agora. Mata o cenário "a admin acabou de disparar o lote na mão e a
// trigger mandou de novo" — o portão sozinho não pega isso (chaves diferentes).
const COOLDOWN_MS = 12 * 3600_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Announcement {
  id: string;
  item_id: string | null;
  item_slug: string;
  item_nome: string;
  data_texto: string;
  local: string | null;
  horarios: unknown;
  imagem: string | null;
  link: string | null;
  // 'data' = tem data pra anunciar · 'inscricoes' = abriu sem data conhecida
  motivo: string | null;
  status: string;
  total_alvo: number | null;
  enviados: number | null;
  observados: number | null;
  pulados: number | null;
  started_at: string | null;
  created_at: string;
}

interface SubRow {
  id: string;
  nome: string | null;
  telefone: string | null;
  whatsapp_followup_sent_at: string | null;
  whatsapp_followup_count: number | null;
  aviso_data_announcement_id: string | null;
}

// Um destinatário = um telefone. Quem preencheu o formulário duas vezes pro
// mesmo item recebe UMA mensagem (e as duas linhas são carimbadas juntas).
interface PhoneGroup {
  phone: string;
  nome: string;
  ids: string[];
  jaRecebeuEstaOnda: boolean;
  maxCount: number;
  lastSentAt: number | null;
}

function groupByPhone(rows: SubRow[], announcementId: string): {
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
      g = {
        phone,
        nome: r.nome ?? "",
        ids: [],
        jaRecebeuEstaOnda: false,
        maxCount: 0,
        lastSentAt: null,
      };
      map.set(phone, g);
    }
    g.ids.push(r.id);
    if (!g.nome && r.nome) g.nome = r.nome;
    if (r.aviso_data_announcement_id === announcementId) g.jaRecebeuEstaOnda = true;
    if (r.whatsapp_followup_sent_at) {
      const t = Date.parse(r.whatsapp_followup_sent_at);
      if (Number.isFinite(t)) g.lastSentAt = Math.max(g.lastSentAt ?? 0, t);
    }
    g.maxCount = Math.max(g.maxCount, Number(r.whatsapp_followup_count) || 0);
  }
  return { groups: [...map.values()], semTelefone };
}

function horariosArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((h) => String(h ?? "").trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((h) => String(h ?? "").trim()).filter(Boolean);
      }
    } catch { /* texto solto */ }
    return [raw.trim()];
  }
  return [];
}

interface OndaResult {
  id: string;
  item: string;
  data: string;
  status: string;
  alvo: number;
  enviados: number;
  observados: number;
  pulados: number;
  restantes: number;
  sem_telefone: number;
  abort_reason?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // ---- Autorização: cron (secret/service role) OU admin logada no painel ----
  const rawAuth = req.headers.get("Authorization") ?? "";
  const tk = rawAuth.replace(/^Bearer\s+/i, "").trim();
  const isCron = (!!CRON_SECRET && tk === CRON_SECRET) ||
    (!!SERVICE_ROLE && tk === SERVICE_ROLE);
  let adminId: string | null = null;
  if (!isCron) {
    adminId = await authorizeAdmin(rawAuth);
    if (!adminId) return json({ ok: false, error: "nao_autorizado" }, 401);
  }

  let payload: Record<string, unknown> = {};
  if (req.headers.get("content-length") !== "0") {
    try {
      payload = (await req.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }
  const onlyId = payload.announcement_id ? String(payload.announcement_id) : null;

  // ---- Fila: ondas ainda não resolvidas ----
  let q = supabase
    .from("byelarah_date_announcements")
    .select(
      "id, item_id, item_slug, item_nome, data_texto, local, horarios, imagem, link, motivo, status, total_alvo, enviados, observados, pulados, started_at, created_at",
    )
    .in("status", ["pendente", "enviando"])
    .order("created_at", { ascending: true })
    .limit(MAX_ONDAS_POR_RUN);
  if (onlyId) q = q.eq("id", onlyId);

  const { data: ondasRaw, error: filaErr } = await q;
  if (filaErr) {
    // Tabela ausente = SQL não rodou ainda. Mensagem clara em vez de 500 seco.
    if (/byelarah_date_announcements/i.test(filaErr.message ?? "")) {
      return json({
        ok: false,
        error: "fila_ausente",
        detail: "Rode sql/elarah_byelarah_aviso_data.sql no Supabase.",
      }, 500);
    }
    return json({ ok: false, error: "db_error", detail: filaErr.message }, 500);
  }
  const ondas = (ondasRaw ?? []) as Announcement[];
  if (!ondas.length) return json({ ok: true, ondas: [], nada_a_fazer: true });

  // ---- Expira ondas velhas ANTES de qualquer envio ----
  const agora = Date.now();
  const vivas: Announcement[] = [];
  const expiradas: string[] = [];
  for (const a of ondas) {
    const nascida = Date.parse(a.created_at);
    if (Number.isFinite(nascida) && agora - nascida > EXPIRA_HORAS * 3600_000) {
      expiradas.push(a.id);
    } else {
      vivas.push(a);
    }
  }
  if (expiradas.length) {
    await supabase
      .from("byelarah_date_announcements")
      .update({
        status: "cancelado",
        erro: "expirado_" + EXPIRA_HORAS + "h",
        processed_at: new Date().toISOString(),
      })
      .in("id", expiradas);
  }
  if (!vivas.length) return json({ ok: true, ondas: [], expiradas: expiradas.length });

  // ---- Travas globais: não mexe na fila, só informa (a onda continua lá) ----
  if (!whatsappConfigured()) {
    return json({ ok: false, error: "nao_configurado", pendentes: vivas.length }, 400);
  }
  if (whatsappSendingDisabled()) {
    return json({
      ok: false,
      error: "envio_desligado",
      detail: "WHATSAPP_SENDING_ENABLED=false (kill switch). As ondas continuam na fila.",
      pendentes: vivas.length,
    }, 423);
  }

  let orcamento = MAX_ENVIOS_POR_RUN; // envios reais restantes nesta chamada
  const resultados: OndaResult[] = [];

  for (const onda of vivas) {
    if (orcamento <= 0) break;

    // Lista EXATA deste item: só quem se inscreveu neste slug. Match exato de
    // propósito — mandar pra lista de outro evento é o pior erro possível.
    const { data: subsRaw, error: subsErr } = await supabase
      .from("byelarah_submissions")
      .select(
        "id, nome, telefone, whatsapp_followup_sent_at, whatsapp_followup_count, aviso_data_announcement_id",
      )
      .eq("item_slug", onda.item_slug)
      .limit(2000);
    if (subsErr) {
      console.error("[byelarah-aviso-data] falha ao carregar lista —", onda.id, subsErr.message);
      await supabase.from("byelarah_date_announcements")
        .update({ erro: "db: " + subsErr.message }).eq("id", onda.id);
      continue;
    }

    // Fallback só pra lead ANTIGO, salvo antes do formulário gravar item_slug:
    // casa pelo nome EXATO da experiência (mesmo critério do painel). Exato de
    // propósito — "contém o nome" misturaria "Vela" com "Vela Aromática".
    let subs = (subsRaw ?? []) as SubRow[];
    if (!subs.length && onda.item_nome) {
      const { data: legado } = await supabase
        .from("byelarah_submissions")
        .select(
          "id, nome, telefone, whatsapp_followup_sent_at, whatsapp_followup_count, aviso_data_announcement_id",
        )
        .eq("experiencia", onda.item_nome)
        .limit(2000);
      subs = (legado ?? []) as SubRow[];
    }

    const { groups, semTelefone } = groupByPhone(subs, onda.id);
    const pendentes = groups.filter((g) => !g.jaRecebeuEstaOnda);

    // Marca a onda como "enviando" (e fixa o alvo na primeira passada).
    if (onda.status === "pendente") {
      await supabase.from("byelarah_date_announcements").update({
        status: "enviando",
        started_at: onda.started_at ?? new Date().toISOString(),
        total_alvo: groups.length,
      }).eq("id", onda.id);
    }

    const horarios = horariosArray(onda.horarios);
    const imagem = experienceImageUrl(onda.imagem);

    let enviados = 0;
    let observados = 0;
    let pulados = 0;
    let abortReason: string | null = null;
    const lote = pendentes.slice(0, orcamento);

    for (let i = 0; i < lote.length; i++) {
      const g = lote[i];

      // Cooldown anti-mensagem-dupla (ver COOLDOWN_MS). Não carimba: a pessoa
      // segue pendente e entra na próxima passada, quando a janela fechar.
      if (g.lastSentAt !== null && agora - g.lastSentAt < COOLDOWN_MS) {
        pulados++;
        continue;
      }

      const dados = {
        nome: g.nome,
        experienciaNome: onda.item_nome,
        data: onda.data_texto,
        horarios,
        local: onda.local,
        link: onda.link,
      };
      // Duas mensagens possíveis: "a data saiu" (quando há data) e "as
      // inscrições abriram" (quando o item saiu da lista de espera sem data
      // conhecida). Nunca prometemos uma data que não temos.
      // Mesmo conteúdo nos dois provedores: texto livre no legado, template
      // aprovado na oficial da Meta (obrigatório — é mensagem que a Elarah
      // inicia, fora da janela de 24h).
      const semData = onda.motivo === "inscricoes" || !String(onda.data_texto ?? "").trim();
      const kind = semData ? "byelarah_open" : "byelarah_date";
      const mensagem = semData
        ? byelarahOpenEnrollmentWhatsAppText(dados)
        : byelarahDateAnnouncementWhatsAppText(dados);
      const templateParams = semData
        ? byelarahOpenEnrollmentTemplateParams(dados)
        : byelarahDateAnnouncementTemplateParams(dados);

      const res = await gatedSendWhatsApp(supabase, {
        kind,
        // Chave por ONDA + telefone: a mesma pessoa nunca recebe o mesmo
        // aviso duas vezes, nem com duas chamadas simultâneas (cron + painel).
        dedupeKey: "bydate:" + onda.id + ":" + g.phone,
        identifierOk: true, // veio de item_slug exato
        rawPhone: g.phone,
        suppressed: false,
        statusAllowed: true,
        image: imagem,
        caption: mensagem,
        message: mensagem,
        template: { params: templateParams },
        experienciaId: null,
        createdBy: adminId,
      });

      if (res.reason === "sending_disabled" || res.reason === "staging_blocked") {
        abortReason = res.reason;
        break;
      }

      if (res.sent || res.reason === "duplicate") {
        // duplicate = já saiu numa chamada concorrente: carimba igual, pra não
        // ficar rodando atrás dessa pessoa pra sempre.
        enviados++;
        const { error: upErr } = await supabase
          .from("byelarah_submissions")
          .update({
            aviso_data_sent_at: new Date().toISOString(),
            aviso_data_announcement_id: onda.id,
            whatsapp_followup_sent_at: new Date().toISOString(),
            whatsapp_followup_count: g.maxCount + 1,
          })
          .in("id", g.ids);
        if (upErr) {
          // Enviou mas não conseguiu registrar → PARA. Continuar arriscaria
          // reenviar pra essa pessoa na próxima passada.
          console.error("[byelarah-aviso-data] envio OK mas tracking falhou —", upErr.message);
          abortReason = "tracking_failed";
          break;
        }
        if (res.sent) orcamento--;
      } else if (res.reason === "observed" || res.reason === "dry_run") {
        // Modo observação / dry-run: registrou quem receberia, não enviou e
        // NÃO carimba — quando o envio real for ligado, essa gente recebe.
        observados++;
      } else {
        pulados++;
        console.error(
          "[byelarah-aviso-data] não enviado —",
          "onda=" + onda.id,
          "motivo=" + (res.reason ?? "?"),
        );
      }

      if (i < lote.length - 1 && res.sent) await sleep(DELAY_MS);
      if (orcamento <= 0) break;
    }

    // Quem ainda falta receber DE VERDADE nesta onda.
    const restantes = Math.max(0, pendentes.length - enviados);
    const concluida = restantes === 0 && !abortReason;

    // Contadores ABSOLUTOS, não acumulados: a lista inteira é relida a cada
    // passada, então somar o que já estava gravado contaria duas vezes.
    const jaAvisadosAntes = groups.length - pendentes.length;
    const enviadosTotal = jaAvisadosAntes + enviados;

    await supabase.from("byelarah_date_announcements").update({
      status: concluida ? "concluido" : "enviando",
      total_alvo: groups.length,
      enviados: enviadosTotal,
      observados,
      pulados: pulados + semTelefone,
      erro: abortReason,
      processed_at: concluida ? new Date().toISOString() : null,
    }).eq("id", onda.id);

    resultados.push({
      id: onda.id,
      item: onda.item_nome,
      data: onda.data_texto,
      status: concluida ? "concluido" : "enviando",
      alvo: groups.length,
      enviados: enviadosTotal,
      observados,
      pulados,
      restantes,
      sem_telefone: semTelefone,
      abort_reason: abortReason,
    });

    if (abortReason === "sending_disabled" || abortReason === "staging_blocked") break;
  }

  return json({ ok: true, ondas: resultados, expiradas: expiradas.length });
});
