// =============================================================
// ELARAH — VALIDAÇÃO PONTA A PONTA (E2E) do WhatsApp
// -------------------------------------------------------------
// NÃO é teste unitário nem análise estática: SIMULA o comportamento real do
// sistema em produção. Cada fluxo roda pelo CÓDIGO REAL:
//   * sendBookingConfirmationGated  (o MESMO que stripe/mp/pagarme/check-mp chamam)
//   * gatedSendWhatsApp + o portão real (whatsapp_gate.js)
//   * os builders reais das 4 mensagens (confirmação/lembrete/feedback/pendente)
//   * normalização/validação de telefone real
// O ÚNICO ponto mockado é a FRONTEIRA da Z-API (global.fetch) — assim nada
// sai da máquina — e o Supabase (um banco fake com UNIQUE(dedupe_key) real).
//
// As automações (lembrete/feedback/pendente) e o broadcast têm sua orquestração
// (o laço do cron / do disparo) ESPELHADA aqui, linha por linha, chamando as
// MESMAS funções reais — ver runAutomationPass() e runBroadcast(), anotados com
// o arquivo/linha que espelham. O núcleo de segurança (o portão) é 100% real.
//
// Para cada fluxo verificamos:
//   (a) DESTINATÁRIO correto  — a Z-API recebeu exatamente o telefone da reserva
//   (b) DADOS da MESMA reserva — nome/experiência/data/link/foto batem com a reserva
//   (c) SEM envio duplicado    — webhook 2x / webhook+polling / clique duplo = 1 envio
//   (d) NENHUM outro cliente afetado — o telefone de terceiros nunca é tocado
//   (e) whatsapp_send_log      — registrou exatamente 1 linha, no status esperado
//
// Rodar:
//   node --experimental-strip-types supabase/functions/_shared/whatsapp_e2e.test.mjs
// =============================================================

import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WA_PATH = pathToFileURL(join(HERE, "whatsapp.ts")).href;

// ---- Números FICTÍCIOS (nunca de cliente real). CLIENT_A é o "meu número". ----
const CLIENT_A = "5511999990000"; // destinatário legítimo do fluxo
const CLIENT_B = "5521988887777"; // TERCEIRO — nunca pode ser tocado
const CLIENT_C = "5531977776666"; // segunda pessoa da MESMA lista de interesse
const IMG_A = "https://elarah.com.br/assets/APEROLPINTURA.jpg";

let PASS = 0, FAIL = 0;
const out = [];
function check(name, cond, detail) {
  if (cond) { PASS++; out.push(`   ✅ ${name}`); }
  else { FAIL++; out.push(`   ❌ ${name} — ${detail ?? ""}`); }
}
function head(t) { out.push("\n" + t); }

// ============================================================
// Banco FAKE (Supabase). whatsapp_send_log com UNIQUE(dedupe_key) REAL:
// insert de chave repetida devolve {error:{code:'23505'}} — igual ao Postgres.
// ============================================================
function makeSupabase(seedBookings = [], seedSubmissions = []) {
  const bookings = new Map();
  for (const b of seedBookings) bookings.set(b.id, { ...b });
  const sendLog = new Map(); // dedupe_key -> row
  // Lista de interesse By Elarah (fluxo "a data saiu").
  const submissions = new Map();
  for (const sub of seedSubmissions) submissions.set(sub.id, { ...sub });

  function storeFor(name) {
    if (name === "bookings") return bookings;
    if (name === "byelarah_submissions") return submissions;
    return sendLog;
  }

  function tableApi(name) {
    // Builder encadeável e "thenable" (await funciona direto).
    const filters = [];
    let mode = null;   // 'select' | 'insert' | 'update'
    let payload = null;

    const matches = (row) => filters.every(([c, v]) => (
      v && typeof v === "object" && Array.isArray(v.__in)
        ? v.__in.includes(row[c])
        : row[c] === v
    ));

    const api = {
      select() { mode = "select"; return api; },
      insert(row) { mode = "insert"; payload = row; return api; },
      update(patch) { mode = "update"; payload = patch; return api; },
      eq(c, v) { filters.push([c, v]); return api; },
      in(c, vals) { filters.push([c, { __in: vals }]); return api; },
      is(c, v) { filters.push([c, v]); return api; },
      not() { return api; },
      gte() { return api; },
      lte() { return api; },
      limit() { return api; },
      order() { return api; },
      async maybeSingle() {
        const store = storeFor(name);
        for (const row of store.values()) if (matches(row)) return { data: { ...row }, error: null };
        return { data: null, error: null };
      },
      single() { return api.maybeSingle(); },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          if (mode === "insert") {
            if (name === "whatsapp_send_log") {
              const key = payload.dedupe_key;
              if (sendLog.has(key)) {                       // UNIQUE violado
                return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
              }
              sendLog.set(key, { ...payload });
              return { data: [payload], error: null };
            }
            return { data: [payload], error: null };
          }
          if (mode === "update") {
            const store = storeFor(name);
            for (const [k, row] of store.entries()) if (matches(row)) store.set(k, { ...row, ...payload });
            return { data: null, error: null };
          }
          // select-lista
          const store = storeFor(name);
          const rows = [...store.values()].filter(matches).map((r) => ({ ...r }));
          return { data: rows, error: null };
        }).then(resolve, reject);
      },
    };
    return api;
  }

  return {
    from: (name) => tableApi(name),
    _bookings: bookings,
    _sendLog: sendLog,
    _submissions: submissions,
  };
}

// ============================================================
// FRONTEIRA da Z-API mockada (global.fetch). Registra CADA chamada real que o
// adaptador faria: telefone destino + corpo (texto ou imagem+legenda).
// ============================================================
function installZapiMock() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    const body = init && init.body ? JSON.parse(init.body) : {};
    if (u.includes("/send-text") || u.includes("/send-image")) {
      calls.push({
        kind: u.includes("/send-image") ? "image" : "text",
        phone: body.phone,
        text: body.message ?? body.caption ?? "",
        image: body.image ?? null,
      });
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ messageId: "ZAPI-" + calls.length }),
      text: async () => "",
    };
  };
  return {
    calls,
    to(phone) { return calls.filter((c) => c.phone === phone); },
    reset() { calls.length = 0; },
  };
}

// FRONTEIRA da Cloud API OFICIAL mockada. Registra o que a Meta receberia:
// telefone, tipo (text/image/template), nome do template e parâmetros.
function installMetaMock() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    const body = init && init.body ? JSON.parse(init.body) : {};
    if (u.includes("/messages")) {
      const bodyComp = (body.template?.components ?? []).find((c) => c.type === "body");
      calls.push({
        url: u,
        auth: (init?.headers ?? {})["Authorization"] ?? "",
        phone: body.to,
        type: body.type,
        template: body.template?.name ?? null,
        lang: body.template?.language?.code ?? null,
        params: (bodyComp?.parameters ?? []).map((p) => p.text),
        components: body.template?.components ?? [],
        text: body.text?.body ?? body.image?.caption ?? "",
      });
    }
    const payload = JSON.stringify({ messages: [{ id: "wamid.FAKE" + calls.length }] });
    return { ok: true, status: 200, json: async () => JSON.parse(payload), text: async () => payload };
  };
  return {
    calls,
    to(phone) { return calls.filter((c) => c.phone === phone); },
  };
}

// Env do provedor OFICIAL: sem credencial da Z-API, só as da Meta.
const META_ENV = {
  WHATSAPP_SENDING_ENABLED: "true",
  WHATSAPP_ENV: "production",
  WHATSAPP_ROLLOUT_PERCENT: "100",
  META_WHATSAPP_TOKEN: "TOKEN_FAKE",
  META_WHATSAPP_PHONE_NUMBER_ID: "123456789",
};

// Carrega whatsapp.ts REAL com um env específico (re-avalia via query string).
let ENV = {};
globalThis.Deno = { env: { get: (k) => (ENV[k] ?? "") } };
let _v = 0;
async function loadWA(env) {
  ENV = env;
  _v++;
  return await import(WA_PATH + "?e2e=" + _v);
}

const PROD_ENV = {
  WHATSAPP_SENDING_ENABLED: "true",
  WHATSAPP_ENV: "production",
  WHATSAPP_ROLLOUT_PERCENT: "100", // liberado DE PROPÓSITO (fail-closed: ausente = 0)
  ZAPI_INSTANCE_ID: "INST_FAKE",
  ZAPI_TOKEN: "TOK_FAKE",
  ZAPI_CLIENT_TOKEN: "CLIENT_FAKE",
};

// ============================================================
// ESPELHO do laço das automações (automated-notifications/index.ts, runPass
// linhas ~136-186): releitura autoritativa de status+aguardando → gate real.
// Chama o gatedSendWhatsApp REAL e o builder REAL passado em `build`.
// ============================================================
async function runAutomationPass(WA, supabase, { kind, expectedStatus, rows, build }) {
  const r = { enviados: 0, observados: 0, pulados: 0 };
  for (const b of rows) {
    const { data: fresh, error } = await supabase
      .from("bookings").select("status, aguardando_experiencia").eq("id", b.id).maybeSingle();
    if (error || !fresh) { r.pulados++; continue; }            // fail-closed
    const statusAllowed = fresh.status === expectedStatus;
    const suppressed = fresh.aguardando_experiencia === true;
    const message = await build(b);
    const res = await WA.gatedSendWhatsApp(supabase, {
      kind,
      dedupeKey: kind + ":" + b.id,
      identifierOk: !!b.id && !!b.experiencia_id,
      rawPhone: b.telefone,
      suppressed,
      statusAllowed,
      image: IMG_A,
      caption: message,
      message,
      bookingId: b.id,
      experienciaId: b.experiencia_id,
    });
    if (res.sent) r.enviados++;
    else if (res.reason === "observed" || res.dryRun) r.observados++;
    else r.pulados++;
  }
  return r;
}

// ESPELHO do laço do broadcast (whatsapp-broadcast/index.ts): dedup por telefone
// + gate real com dedupeKey "bcast:"+campanha+":"+telefone.
async function runBroadcast(WA, supabase, campaignId, recipients) {
  const byPhone = new Map();
  for (const rcpt of recipients) {
    const norm = WA.normalizePhoneBR(rcpt.telefone);
    if (norm && !byPhone.has(norm)) byPhone.set(norm, rcpt);
  }
  let enviados = 0;
  for (const [phone, rcpt] of byPhone.entries()) {
    const res = await WA.gatedSendWhatsApp(supabase, {
      kind: "broadcast",
      dedupeKey: "bcast:" + campaignId + ":" + phone,
      identifierOk: true,
      rawPhone: phone,
      suppressed: false,
      statusAllowed: true, // broadcast: público interessado, sem status de reserva
      image: IMG_A,
      caption: "Novidade da Elarah 🧡",
      message: "Novidade da Elarah 🧡",
      bookingId: null,
      experienciaId: rcpt.experiencia_id ?? null,
    });
    if (res.sent) enviados++;
  }
  return enviados;
}

// ESPELHO do laço do aviso "a data saiu" (byelarah-aviso-data/index.ts):
// carrega a lista EXATA do item (item_slug), dedup por telefone, gate real com
// dedupeKey "bydate:"+onda+":"+telefone, e carimba quem recebeu.
async function runAvisoDeData(WA, supabase, onda, { agora = Date.now(), cooldownMs = 12 * 3600_000 } = {}) {
  const { data: rows } = await supabase
    .from("byelarah_submissions")
    .select("id, nome, telefone, whatsapp_followup_sent_at, whatsapp_followup_count, aviso_data_announcement_id")
    .eq("item_slug", onda.item_slug)
    .limit(2000);

  // Dedup por telefone: quem preencheu 2x recebe UMA mensagem.
  const byPhone = new Map();
  let semTelefone = 0;
  for (const r of rows ?? []) {
    const phone = WA.normalizePhoneBR(r.telefone);
    if (!phone) { semTelefone++; continue; }
    let g = byPhone.get(phone);
    if (!g) {
      g = { phone, nome: r.nome ?? "", ids: [], jaRecebeu: false, maxCount: 0, lastSentAt: null };
      byPhone.set(phone, g);
    }
    g.ids.push(r.id);
    if (!g.nome && r.nome) g.nome = r.nome;
    if (r.aviso_data_announcement_id === onda.id) g.jaRecebeu = true;
    if (r.whatsapp_followup_sent_at) {
      const t = Date.parse(r.whatsapp_followup_sent_at);
      if (Number.isFinite(t)) g.lastSentAt = Math.max(g.lastSentAt ?? 0, t);
    }
    g.maxCount = Math.max(g.maxCount, Number(r.whatsapp_followup_count) || 0);
  }

  const res = { enviados: 0, pulados: 0, semTelefone, alvo: byPhone.size };
  const fotoDoEvento = onda.imagem || IMG_A;
  for (const g of byPhone.values()) {
    if (g.jaRecebeu) { res.pulados++; continue; }
    if (g.lastSentAt !== null && agora - g.lastSentAt < cooldownMs) { res.pulados++; continue; }
    const dados = {
      nome: g.nome,
      experienciaNome: onda.item_nome,
      data: onda.data_texto,
      horarios: onda.horarios,
      local: onda.local,
      link: onda.link,
    };
    // UMA mensagem só, com ou sem data (espelha a função real).
    const mensagem = WA.byelarahAvisoWhatsAppText(dados);
    const templateParams = WA.byelarahAvisoTemplateParams(dados);
    const r = await WA.gatedSendWhatsApp(supabase, {
      kind: "byelarah_aviso",
      preferOfficial: true,
      dedupeKey: "bydate:" + chaveEvento(onda.item_nome, onda.data_texto) + ":" + g.phone,
      identifierOk: true,
      rawPhone: g.phone,
      suppressed: false,
      statusAllowed: true,
      image: fotoDoEvento,
      caption: mensagem,
      message: mensagem,
      template: { params: templateParams },
    });
    if (r.sent || r.reason === "duplicate") {
      res.enviados++;
      await supabase.from("byelarah_submissions").update({
        aviso_data_sent_at: new Date(agora).toISOString(),
        aviso_data_announcement_id: onda.id,
        whatsapp_followup_sent_at: new Date(agora).toISOString(),
        whatsapp_followup_count: g.maxCount + 1,
      }).in("id", g.ids);
    } else {
      res.pulados++;
    }
  }
  return res;
}

// ESPELHO de chaveEvento() (byelarah-aviso-data/index.ts): a idempotência é
// por EVENTO+DATA, não por onda — cadastro duplicado do mesmo evento mira a
// mesma lista e não pode mandar duas mensagens.
function chaveEvento(nome, data) {
  const norm = (t) => String(t ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return norm(nome).slice(0, 48) + ":" + norm(data).slice(0, 24);
}

function subSeed(over = {}) {
  return {
    id: over.id ?? "sub-1",
    item_slug: "perfumaria-criativa",
    experiencia: "Oficina de Perfumaria Criativa",
    nome: "Maria Silva",
    telefone: CLIENT_A,
    whatsapp_followup_sent_at: null,
    whatsapp_followup_count: 0,
    aviso_data_announcement_id: null,
    ...over,
  };
}

function bookingSeed(over = {}) {
  return {
    id: over.id ?? "bk-A",
    nome: "Maria Silva",
    telefone: CLIENT_A,
    experiencia_id: "exp-1",
    experiencia_nome: "Pintura com Aperol",
    data: "15/08",
    horario: "15h00 – 18h00",
    quantidade: 2,
    status: "pago",
    aguardando_experiencia: false,
    metadata: {},
    experiences: { imagem: IMG_A },
    ...over,
  };
}

// ============================================================
async function run() {
  const WA = await loadWA(PROD_ENV);
  const z = installZapiMock();

  out.push("╔══════════════════════════════════════════════════════════════╗");
  out.push("║  VALIDAÇÃO PONTA A PONTA — WhatsApp Elarah (produção simulada) ║");
  out.push("║  env: SENDING_ENABLED=true · ENV=production · Z-API mockada    ║");
  out.push("╚══════════════════════════════════════════════════════════════╝");

  // ---------- FLUXO 1: RESERVA CRIADA (status pending) → NÃO confirma ----------
  head("FLUXO 1 — Reserva criada (pagamento ainda pendente): NÃO envia confirmação");
  {
    z.reset();
    const sb = makeSupabase([
      bookingSeed({ id: "bk1-A", status: "pending" }),
      bookingSeed({ id: "bk1-B", telefone: CLIENT_B, status: "pending" }), // terceiro
    ]);
    const b = sb._bookings.get("bk1-A");
    const res = await WA.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    check("não enviou (status != pago)", res.sent === false && res.reason === "status_not_allowed", res.reason);
    check("Z-API não foi chamada", z.calls.length === 0, "calls=" + z.calls.length);
    check("(d) terceiro CLIENT_B intocado", z.to(CLIENT_B).length === 0);
    check("(e) send_log vazio (nada reservado)", sb._sendLog.size === 0);
  }

  // ---------- FLUXO 2: PAGAMENTO APROVADO (pago) → confirma 1x, dados certos ----------
  head("FLUXO 2 — Pagamento aprovado: confirma ao destinatário certo, dados da MESMA reserva");
  {
    z.reset();
    const sb = makeSupabase([
      bookingSeed({ id: "bk2-A" }),
      bookingSeed({ id: "bk2-B", telefone: CLIENT_B, nome: "João Terceiro", experiencia_nome: "OUTRA COISA" }),
    ]);
    const b = sb._bookings.get("bk2-A");
    const res = await WA.sendBookingConfirmationGated(sb, b, {
      telefone_digits: b.telefone, endereco: "Rua X, 123", bairro: "Pinheiros",
    });
    const c = z.to(CLIENT_A)[0];
    check("(a) destinatário = telefone da reserva", !!c && c.phone === CLIENT_A, JSON.stringify(z.calls.map(x=>x.phone)));
    check("(b) mensagem cita a experiência da reserva", !!c && c.text.includes("Pintura com Aperol"));
    check("(b) mensagem cita o nome da reserva", !!c && c.text.includes("Maria"));
    check("(b) leva a FOTO da experiência (send-image)", !!c && c.kind === "image" && c.image === IMG_A);
    check("(b) NÃO vaza dados do terceiro (experiência B)", !!c && !c.text.includes("OUTRA COISA"));
    check("(c) exatamente 1 envio", z.calls.length === 1, "calls=" + z.calls.length);
    check("(d) terceiro CLIENT_B NUNCA tocado", z.to(CLIENT_B).length === 0);
    check("(e) send_log: 1 linha, status sent", sb._sendLog.size === 1 &&
      [...sb._sendLog.values()][0].status === "sent", JSON.stringify([...sb._sendLog.values()][0] ?? {}));
    check("(e) send_log vinculado à reserva A", [...sb._sendLog.values()][0]?.booking_id === "bk2-A");
  }

  // ---------- FLUXO 2b: webhook 2x + polling (idempotência ponta a ponta) ----------
  head("FLUXO 2b — Mesmo pagamento chega por webhook 2x + polling (check-mp): 1 envio só");
  {
    z.reset();
    const sb = makeSupabase([bookingSeed({ id: "bk2b-A" })]);
    const b = sb._bookings.get("bk2b-A");
    // stripe-webhook, mp-webhook (retry) e check-mp-payment-status disparam o MESMO caminho:
    const results = await Promise.all([
      WA.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone }),
      WA.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone }),
      WA.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone }),
    ]);
    const sent = results.filter((r) => r.sent).length;
    const dup = results.filter((r) => r.reason === "duplicate").length;
    out.push(`   ── EVIDÊNCIA: 3 caminhos concorrentes → Z-API chamadas=${z.calls.length} | sent=${sent} | duplicate=${dup} | send_log=${sb._sendLog.size}`);
    check("exatamente 1 chamada à Z-API", z.calls.length === 1, "calls=" + z.calls.length);
    check("1 sent, 2 duplicate", sent === 1 && dup === 2);
    check("send_log tem exatamente 1 linha", sb._sendLog.size === 1);
  }

  // ---------- FLUXO 3: RECUPERAÇÃO DE PENDENTE (3-6h) ----------
  head("FLUXO 3 — Recuperação de reserva pendente (cron): 1 mensagem, sem tocar terceiro");
  {
    z.reset();
    const sb = makeSupabase([
      bookingSeed({ id: "bk3-A", status: "pending" }),
      bookingSeed({ id: "bk3-B", telefone: CLIENT_B, status: "pago" }), // pago não entra no pass de pendente
    ]);
    const rows = [sb._bookings.get("bk3-A")]; // janela do cron seleciona só o pendente
    const r = await runAutomationPass(WA, sb, {
      kind: "pending", expectedStatus: "pending", rows,
      build: (b) => WA.pendingRecoveryWhatsAppText({ nome: b.nome, experienciaNome: b.experiencia_nome, data: b.data, horario: b.horario }),
    });
    const c = z.to(CLIENT_A)[0];
    check("(a) destinatário certo", !!c && c.phone === CLIENT_A);
    check("(b) fala da experiência da reserva", !!c && c.text.includes("Pintura com Aperol"));
    check("(c) 1 envio", r.enviados === 1 && z.calls.length === 1);
    check("(d) terceiro pago não recebe recuperação", z.to(CLIENT_B).length === 0);
    check("(e) send_log: 1 linha (pending)", sb._sendLog.size === 1 && [...sb._sendLog.keys()][0] === "pending:bk3-A");
  }

  // ---------- FLUXO 3b: cron roda 2x (idempotência da automação) ----------
  head("FLUXO 3b — Cron dispara o mesmo pendente 2x (execuções sobrepostas): 1 envio");
  {
    z.reset();
    const sb = makeSupabase([bookingSeed({ id: "bk3b-A", status: "pending" })]);
    const rows = [sb._bookings.get("bk3b-A")];
    const pass = () => runAutomationPass(WA, sb, {
      kind: "pending", expectedStatus: "pending", rows,
      build: (b) => WA.pendingRecoveryWhatsAppText({ nome: b.nome, experienciaNome: b.experiencia_nome }),
    });
    const [a, bb] = await Promise.all([pass(), pass()]);
    check("total 1 envio nas 2 execuções", (a.enviados + bb.enviados) === 1 && z.calls.length === 1, "calls=" + z.calls.length);
    check("send_log: 1 linha", sb._sendLog.size === 1);
  }

  // ---------- FLUXO 4: LEMBRETE 48h ----------
  head("FLUXO 4 — Lembrete 48h antes: destinatário certo, dados da reserva, 1 envio");
  {
    z.reset();
    const sb = makeSupabase([
      bookingSeed({ id: "bk4-A" }),
      bookingSeed({ id: "bk4-B", telefone: CLIENT_B, aguardando_experiencia: true }), // aguardando → suprimido
    ]);
    const rows = [sb._bookings.get("bk4-A"), sb._bookings.get("bk4-B")];
    const r = await runAutomationPass(WA, sb, {
      kind: "reminder48", expectedStatus: "pago", rows,
      build: (b) => WA.reminder48hWhatsAppText({ nome: b.nome, experienciaNome: b.experiencia_nome, data: b.data, horario: b.horario }),
    });
    check("(a)(c) 1 envio, pro CLIENT_A", r.enviados === 1 && z.to(CLIENT_A).length === 1);
    check("(b) menciona a experiência", z.to(CLIENT_A)[0].text.includes("Pintura com Aperol"));
    check("(d) CLIENT_B (aguardando experiência) NÃO recebe", z.to(CLIENT_B).length === 0);
    check("(e) send_log: 1 linha (reminder48:bk4-A)", sb._sendLog.size === 1 && sb._sendLog.has("reminder48:bk4-A"));
  }

  // ---------- FLUXO 5: FEEDBACK 2 dias depois (com link de avaliação) ----------
  head("FLUXO 5 — Feedback pós-experiência: com link de avaliação (⭐), 1 envio");
  {
    z.reset();
    const sb = makeSupabase([bookingSeed({ id: "bk5-A" })]);
    const link = "https://elarah.com.br/avaliar.html?b=bk5-A&t=abc123";
    const rows = [sb._bookings.get("bk5-A")];
    const r = await runAutomationPass(WA, sb, {
      kind: "feedback", expectedStatus: "pago", rows,
      build: (b) => WA.feedbackWhatsAppText({ nome: b.nome, experienciaNome: b.experiencia_nome, link }),
    });
    const c = z.to(CLIENT_A)[0];
    check("(a)(c) 1 envio pro destinatário certo", r.enviados === 1 && !!c);
    check("(b) contém o link de avaliação da reserva", !!c && c.text.includes(link));
    check("(b) usa a estrela ⭐ (não a mãozinha amarela)", !!c && c.text.includes("⭐") && !c.text.includes("👉"));
    check("(e) send_log: 1 linha (feedback:bk5-A)", sb._sendLog.size === 1 && sb._sendLog.has("feedback:bk5-A"));
  }

  // ---------- FLUXO 6: BROADCAST (disparo em massa pros interessados) ----------
  head("FLUXO 6 — Broadcast aos interessados: dedup por telefone, 1 por pessoa");
  {
    z.reset();
    const sb = makeSupabase([]);
    const recipients = [
      { telefone: CLIENT_A, experiencia_id: "exp-1" },
      { telefone: "(11) 99999-0000", experiencia_id: "exp-1" }, // MESMA pessoa (formato diferente) → dedup
      { telefone: CLIENT_B, experiencia_id: "exp-1" },
      { telefone: "111", experiencia_id: "exp-1" },              // inválido → não envia
    ];
    const enviados = await runBroadcast(WA, sb, "campanha-verao", recipients);
    check("(c) dedup: CLIENT_A recebe 1 vez só", z.to(CLIENT_A).length === 1, "A=" + z.to(CLIENT_A).length);
    check("CLIENT_B recebe 1 vez", z.to(CLIENT_B).length === 1);
    check("telefone inválido não gera envio", z.calls.length === 2, "calls=" + z.calls.length);
    check("total enviados = 2 destinatários distintos e válidos", enviados === 2);
    check("(e) send_log: 2 linhas (1 por telefone)", sb._sendLog.size === 2);
    check("chaves de dedup por telefone", sb._sendLog.has("bcast:campanha-verao:" + CLIENT_A) && sb._sendLog.has("bcast:campanha-verao:" + CLIENT_B));
  }

  // ---------- FLUXO 6b: dois broadcasts simultâneos (clique duplo no painel) ----------
  head("FLUXO 6b — Painel dispara a MESMA campanha 2x: cada pessoa recebe 1 vez");
  {
    z.reset();
    const sb = makeSupabase([]);
    const recipients = [{ telefone: CLIENT_A, experiencia_id: "exp-1" }];
    const [x, y] = await Promise.all([
      runBroadcast(WA, sb, "camp-dbl", recipients),
      runBroadcast(WA, sb, "camp-dbl", recipients),
    ]);
    check("total 1 envio (não duplica)", (x + y) === 1 && z.to(CLIENT_A).length === 1, "calls=" + z.calls.length);
    check("send_log: 1 linha", sb._sendLog.size === 1);
  }

  // ---------- FLUXO 7: CANCELAMENTO (aprovação tardia depois do cancelamento) ----------
  head("FLUXO 7 — Reserva cancelada: aprovação/lembrete que chega DEPOIS NÃO envia");
  {
    z.reset();
    const sb = makeSupabase([bookingSeed({ id: "bk7-A", status: "cancelado" })]);
    const b = { ...sb._bookings.get("bk7-A"), status: "pago" }; // objeto do webhook chega DESATUALIZADO (dizendo pago)
    const res = await WA.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    check("releitura autoritativa pega 'cancelado' → não envia", res.sent === false && res.reason === "status_not_allowed", res.reason);
    check("Z-API não chamada", z.calls.length === 0);
    // e o lembrete/feedback do cron também respeita o status fresco:
    const r = await runAutomationPass(WA, sb, {
      kind: "reminder48", expectedStatus: "pago", rows: [sb._bookings.get("bk7-A")],
      build: (b2) => WA.reminder48hWhatsAppText({ nome: b2.nome, experienciaNome: b2.experiencia_nome }),
    });
    check("cron também pula cancelada", r.enviados === 0 && z.calls.length === 0);
    check("(e) send_log vazio", sb._sendLog.size === 0);
  }

  // ---------- FLUXO 8: REEMBOLSO ----------
  head("FLUXO 8 — Reserva reembolsada: nenhuma automação envia");
  {
    z.reset();
    const sb = makeSupabase([bookingSeed({ id: "bk8-A", status: "reembolsado" })]);
    const b = sb._bookings.get("bk8-A");
    const conf = await WA.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    const r = await runAutomationPass(WA, sb, {
      kind: "feedback", expectedStatus: "pago", rows: [b],
      build: (b2) => WA.feedbackWhatsAppText({ nome: b2.nome, experienciaNome: b2.experiencia_nome, link: "x" }),
    });
    check("confirmação não envia (reembolsado)", conf.sent === false && conf.reason === "status_not_allowed");
    check("feedback não envia (reembolsado)", r.enviados === 0);
    check("Z-API não chamada", z.calls.length === 0);
    check("(e) send_log vazio", sb._sendLog.size === 0);
  }

  // ---------- FLUXO 9: AGUARDANDO EXPERIÊNCIA ----------
  head("FLUXO 9 — 'Aguardando experiência' (cancelou sem reembolso): NENHUMA mensagem chega");
  {
    z.reset();
    const sb = makeSupabase([
      bookingSeed({ id: "bk9-A", status: "pago", aguardando_experiencia: true }), // pago, mas aguardando → suprimido
      bookingSeed({ id: "bk9-B", telefone: CLIENT_B, status: "pago", aguardando_experiencia: false }), // normal
    ]);
    const bA = sb._bookings.get("bk9-A");
    // confirmação:
    const conf = await WA.sendBookingConfirmationGated(sb, bA, { telefone_digits: bA.telefone });
    check("confirmação suprimida (aguardando)", conf.sent === false && conf.reason === "suppressed", conf.reason);
    // lembrete + feedback via cron, com os DOIS na lista:
    const rem = await runAutomationPass(WA, sb, {
      kind: "reminder48", expectedStatus: "pago", rows: [bA, sb._bookings.get("bk9-B")],
      build: (b) => WA.reminder48hWhatsAppText({ nome: b.nome, experienciaNome: b.experiencia_nome }),
    });
    check("(d) aguardando (A) NÃO recebe, mas normal (B) recebe", z.to(CLIENT_A).length === 0 && z.to(CLIENT_B).length === 1, `A=${z.to(CLIENT_A).length} B=${z.to(CLIENT_B).length}`);
    check("cron enviou só 1 (o normal)", rem.enviados === 1);
    check("(e) send_log só tem o normal (B)", sb._sendLog.size === 1 && sb._sendLog.has("reminder48:bk9-B"));
  }

  // ---------- TRAVAS DE AMBIENTE (mesmo código real, outros env) ----------
  head("TRAVAS DE AMBIENTE — o MESMO código real sob configs diferentes");
  {
    // Kill switch OFF (default): nada envia mesmo com tudo certo.
    const WAkill = await loadWA({ ...PROD_ENV, WHATSAPP_SENDING_ENABLED: "false" });
    const zk = installZapiMock();
    const sb = makeSupabase([bookingSeed({ id: "bkk-A" })]);
    const b = sb._bookings.get("bkk-A");
    const rk = await WAkill.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    check("kill switch (SENDING_ENABLED != true) → não envia", rk.sent === false && rk.reason === "sending_disabled", rk.reason);
    check("kill switch → Z-API não chamada", zk.calls.length === 0);
  }
  {
    // Staging sem allowlist → bloqueia (deploy de teste nunca atinge cliente).
    const WAstg = await loadWA({ ...PROD_ENV, WHATSAPP_ENV: "staging", WHATSAPP_TEST_ALLOWLIST: "" });
    const zs = installZapiMock();
    const sb = makeSupabase([bookingSeed({ id: "bks-A" })]);
    const b = sb._bookings.get("bks-A");
    const rs = await WAstg.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    check("staging sem allowlist → não envia", rs.sent === false && rs.reason === "staging_blocked", rs.reason);
    check("staging → Z-API não chamada", zs.calls.length === 0);
  }
  {
    // Observação → registra quem RECEBERIA na send_log (status observed) e NÃO envia.
    const WAobs = await loadWA({ ...PROD_ENV, WHATSAPP_OBSERVE_MODE: "true" });
    const zo = installZapiMock();
    const sb = makeSupabase([bookingSeed({ id: "bko-A" })]);
    const b = sb._bookings.get("bko-A");
    const ro = await WAobs.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    check("observação → não envia", ro.sent === false && ro.reason === "observed", ro.reason);
    check("observação → Z-API não chamada", zo.calls.length === 0);
    check("observação → registra na send_log (namespace observe:)", sb._sendLog.has("observe:confirmation:bko-A") &&
      [...sb._sendLog.values()][0].status === "observed");
    check("observação → NÃO consome a chave real", !sb._sendLog.has("confirmation:bko-A"));
  }
  {
    // FAIL-CLOSED: ROLLOUT_PERCENT ausente em produção → NÃO envia (nunca 100).
    const envSemRollout = { ...PROD_ENV };
    delete envSemRollout.WHATSAPP_ROLLOUT_PERCENT;
    const WAnr = await loadWA(envSemRollout);
    const znr = installZapiMock();
    const sb = makeSupabase([bookingSeed({ id: "bknr-A" })]);
    const b = sb._bookings.get("bknr-A");
    const rnr = await WAnr.sendBookingConfirmationGated(sb, b, { telefone_digits: b.telefone });
    check("ROLLOUT ausente → não envia (fail-closed)", rnr.sent === false && rnr.reason === "rollout_zero", rnr.reason);
    check("ROLLOUT ausente → Z-API não chamada", znr.calls.length === 0);
  }
  {
    // Rollout allowlist-only: mesmo em produção, só o "meu número".
    const WAro = await loadWA({ ...PROD_ENV, WHATSAPP_ALLOWLIST_ONLY: "true", WHATSAPP_TEST_ALLOWLIST: CLIENT_A });
    const zr = installZapiMock();
    const sb = makeSupabase([
      bookingSeed({ id: "bkr-A", telefone: CLIENT_A }),
      bookingSeed({ id: "bkr-B", telefone: CLIENT_B }),
    ]);
    const rA = await WAro.sendBookingConfirmationGated(sb, sb._bookings.get("bkr-A"), { telefone_digits: CLIENT_A });
    const rB = await WAro.sendBookingConfirmationGated(sb, sb._bookings.get("bkr-B"), { telefone_digits: CLIENT_B });
    check("rollout allowlist-only: meu número envia", rA.sent === true);
    check("rollout allowlist-only: fora da lista NÃO envia", rB.sent === false && rB.reason === "not_in_allowlist", rB.reason);
    check("só 1 envio (o meu)", zr.calls.length === 1 && zr.to(CLIENT_A).length === 1);
  }

  // ---------- FLUXO: "A DATA SAIU" (By Elarah) ----------
  head("FLUXO By Elarah — data publicada avisa a lista DAQUELE item, uma vez só");
  {
    const WAb = await loadWA(PROD_ENV);
    const zb = installZapiMock();
    const onda = {
      id: "onda-1",
      item_slug: "perfumaria-criativa",
      item_nome: "Oficina de Perfumaria Criativa",
      data_texto: "24 de abril",
      horarios: ["10h às 13h", "14h às 17h"],
      local: "Rua Nova Orleans, 34 — Brooklin",
      link: "https://elarah.com.br/index.html#by-elarah-perfumaria-criativa",
    };
    const sb = makeSupabase([], [
      subSeed({ id: "sub-A1" }),                                   // Maria
      subSeed({ id: "sub-A2", nome: "Maria Silva" }),              // Maria de novo (mesmo tel)
      subSeed({ id: "sub-C", nome: "Joana", telefone: CLIENT_C }), // outra da MESMA lista
      // TERCEIRA: lista de OUTRO item — não pode ser tocada.
      subSeed({ id: "sub-B", item_slug: "ourivesaria-joia", nome: "Bruna", telefone: CLIENT_B }),
    ]);

    const p1 = await runAvisoDeData(WAb, sb, onda);
    check("avisou as 2 pessoas da lista do item", p1.enviados === 2, JSON.stringify(p1));
    check("inscrição duplicada não vira 2 mensagens", zb.to(CLIENT_A).length === 1);
    check("Z-API chamada exatamente 2x", zb.calls.length === 2);
    check("TERCEIRA (outro item) NUNCA foi tocada", zb.to(CLIENT_B).length === 0);

    const msg = zb.to(CLIENT_A)[0].text;
    check("mensagem traz o nome do evento", msg.includes("Oficina de Perfumaria Criativa"));
    check("mensagem traz a data publicada", msg.includes("24 de abril"));
    check("mensagem traz os horários", msg.includes("10h às 13h") && msg.includes("14h às 17h"));
    check("mensagem traz o local", msg.includes("Brooklin"));
    check("mensagem traz o link de inscrição", msg.includes(onda.link));
    check("mensagem é pessoal (primeiro nome)", msg.startsWith("Oi, Maria!"), msg.slice(0, 20));
    check("uma mensagem só: sempre o mesmo texto de abertura",
      msg.includes("As inscrições abriram"), msg.slice(0, 40));
    check("send_log registrou por evento+data+telefone",
      sb._sendLog.has("bydate:" + chaveEvento(onda.item_nome, onda.data_texto) + ":" + CLIENT_A));
    check("as 2 linhas da mesma pessoa foram carimbadas",
      sb._submissions.get("sub-A1").aviso_data_announcement_id === "onda-1" &&
      sb._submissions.get("sub-A2").aviso_data_announcement_id === "onda-1");

    // Segunda passada (cron logo depois do disparo do painel): ninguém recebe 2x.
    const p2 = await runAvisoDeData(WAb, sb, onda);
    check("segunda passada não reenvia", p2.enviados === 0, JSON.stringify(p2));
    check("Z-API continua com 2 chamadas", zb.calls.length === 2);
  }
  {
    // Cooldown: quem recebeu follow-up manual há 1h NÃO leva o aviso junto.
    const WAc = await loadWA(PROD_ENV);
    const zc = installZapiMock();
    const onda = {
      id: "onda-2", item_slug: "perfumaria-criativa",
      item_nome: "Oficina de Perfumaria Criativa", data_texto: "24 de abril",
      horarios: [], local: "", link: "https://elarah.com.br/x",
    };
    const agora = Date.now();
    const sb = makeSupabase([], [
      subSeed({ id: "sub-rec", telefone: CLIENT_A,
        whatsapp_followup_sent_at: new Date(agora - 3600_000).toISOString(), whatsapp_followup_count: 1 }),
      subSeed({ id: "sub-old", nome: "Joana", telefone: CLIENT_C,
        whatsapp_followup_sent_at: new Date(agora - 40 * 3600_000).toISOString(), whatsapp_followup_count: 1 }),
    ]);
    const r = await runAvisoDeData(WAc, sb, onda, { agora });
    check("contatada há 1h é pulada (não recebe 2 mensagens no mesmo dia)", zc.to(CLIENT_A).length === 0);
    check("contatada há 40h recebe normalmente", zc.to(CLIENT_C).length === 1, JSON.stringify(r));
  }
  {
    // Kill switch vale também pro aviso automático.
    const WAk = await loadWA({ ...PROD_ENV, WHATSAPP_SENDING_ENABLED: "false" });
    const zk = installZapiMock();
    const onda = {
      id: "onda-3", item_slug: "perfumaria-criativa", item_nome: "Oficina de Perfumaria Criativa",
      data_texto: "24 de abril", horarios: [], local: "", link: "https://elarah.com.br/x",
    };
    const sb = makeSupabase([], [subSeed({ id: "sub-k" })]);
    const r = await runAvisoDeData(WAk, sb, onda);
    check("kill switch → aviso de data não sai", r.enviados === 0 && zk.calls.length === 0);
    check("kill switch → ninguém é carimbado como avisado",
      sb._submissions.get("sub-k").aviso_data_announcement_id === null);
  }

  {
    // CADASTRO DUPLICADO: o mesmo evento existe duas vezes no catálogo
    // (uma ativa, uma oculta que voltou), com ids diferentes. Como a lista
    // casa pelo NOME, as duas ondas miram AS MESMAS pessoas — e ninguém
    // pode receber duas vezes.
    const WAd = await loadWA(PROD_ENV);
    const zd = installZapiMock();
    const base = {
      item_slug: "pintura-aperol", item_nome: "Pintura de Quadro com Cristal & Aperol Spritz",
      data_texto: "24 de abril", horarios: ["10h às 13h"], local: "Brooklin",
      link: "https://elarah.com.br/x",
    };
    const sb = makeSupabase([], [
      subSeed({ id: "sub-d1", item_slug: "pintura-aperol", experiencia: base.item_nome }),
    ]);
    const r1 = await runAvisoDeData(WAd, sb, { ...base, id: "onda-dup-A" });
    const r2 = await runAvisoDeData(WAd, sb, { ...base, id: "onda-dup-B" });
    check("cadastro duplicado: a 1ª onda avisa", r1.enviados === 1, JSON.stringify(r1));
    check("cadastro duplicado: a 2ª NÃO manda de novo", zd.to(CLIENT_A).length === 1, JSON.stringify(r2));
    check("cadastro duplicado: Z-API chamada 1x no total", zd.calls.length === 1);
  }

  // ---------- FLUXO: PROVEDOR OFICIAL (Meta Cloud API) ----------
  head("FLUXO OFICIAL — Meta Cloud API: template aprovado, não texto solto");
  {
    const WAm = await loadWA(META_ENV);
    const zm = installMetaMock();
    check("credenciais da Meta cadastradas → oficial pronta", WAm.whatsappOfficialReady() === true);
    check("mas o provedor PADRÃO segue o legado (não migra nada sozinho)",
      WAm.whatsappProviderName() === "zapi");

    const onda = {
      id: "onda-meta", item_slug: "perfumaria-criativa",
      item_nome: "Oficina de Perfumaria Criativa", data_texto: "24 de abril",
      horarios: ["10h às 13h", "14h às 17h"], local: "Rua Nova Orleans, 34 — Brooklin",
      link: "https://elarah.com.br/index.html#by-elarah-perfumaria-criativa",
    };
    const sb = makeSupabase([], [
      subSeed({ id: "sub-m1" }),
      subSeed({ id: "sub-mB", item_slug: "ourivesaria-joia", nome: "Bruna", telefone: CLIENT_B }),
    ]);
    const r = await runAvisoDeData(WAm, sb, onda);
    check("avisou pela oficial", r.enviados === 1 && zm.calls.length === 1, JSON.stringify(r));

    const c = zm.calls[0];
    check("bateu na Graph API oficial", c.url.includes("graph.facebook.com") && c.url.endsWith("/123456789/messages"), c.url);
    check("autenticou com o token da Meta", c.auth === "Bearer TOKEN_FAKE");
    check("foi TEMPLATE (não texto solto)", c.type === "template");
    check("template correto", c.template === "elarah_inscricoes_abertas", String(c.template));
    check("idioma pt_BR", c.lang === "pt_BR");
    check("destinatário certo", c.phone === CLIENT_A);
    check("TERCEIRA (outra lista) intocada pela oficial", zm.to(CLIENT_B).length === 0);
    check("5 parâmetros na ordem do template", c.params.length === 5, JSON.stringify(c.params));
    check("{{1}} primeiro nome", c.params[0] === "Maria");
    check("{{2}} experiência", c.params[1] === "Oficina de Perfumaria Criativa");
    check("{{3}} data + horários", c.params[2].includes("24 de abril") && c.params[2].includes("10h às 13h"));
    check("{{4}} local", c.params[3].includes("Brooklin"));
    check("{{5}} link", c.params[4] === onda.link);
    check("nenhum parâmetro com quebra de linha/tab (a Meta recusa)",
      c.params.every((t) => !/[\n\t]/.test(t) && !/ {4}/.test(t) && t.trim() !== ""));
    check("sem header de imagem (template aprovado é só texto)",
      !c.components.some((comp) => comp.type === "header"));

    // Segunda passada: idempotência do portão vale igual na oficial.
    const r2 = await runAvisoDeData(WAm, sb, onda);
    check("oficial: segunda passada não reenvia", r2.enviados === 0 && zm.calls.length === 1);
  }
  {
    // Parâmetro que chegaria vazio ou multilinha não pode quebrar o envio.
    const WAm = await loadWA(META_ENV);
    const zm = installMetaMock();
    const onda = {
      id: "onda-meta2", item_slug: "perfumaria-criativa", item_nome: "Oficina de Perfumaria Criativa",
      data_texto: "24 de abril", horarios: [], local: "", link: "",
    };
    const sb = makeSupabase([], [subSeed({ id: "sub-m2", nome: "" })]);
    await runAvisoDeData(WAm, sb, onda);
    const c = zm.calls[0];
    check("sem nome/local/link → parâmetros neutros, nunca vazios",
      c.params.length === 5 && c.params.every((t) => t.trim() !== ""), JSON.stringify(c.params));
    check("link ausente vira o site da Elarah", c.params[4] === "https://elarah.com.br");
  }
  {
    // Oficial escolhida SEM credencial: fail-closed, nunca cai no legado.
    const WAm = await loadWA({ ...PROD_ENV, WHATSAPP_PROVIDER: "meta" });
    const zm = installMetaMock();
    check("oficial sem credencial → não configurado", WAm.whatsappConfigured() === false);
    const r = await WAm.sendWhatsAppTemplate({
      to: CLIENT_A, kind: "byelarah_date", template: { params: ["Maria", "Oficina", "24 de abril", "SP", "link"] },
    });
    check("oficial sem credencial → não envia", r.ok === false && r.skipped === true, JSON.stringify(r));
    check("oficial sem credencial → não chamou ninguém", zm.calls.length === 0);
  }
  {
    // Kill switch e ambiente valem igual na oficial.
    const WAm = await loadWA({ ...META_ENV, WHATSAPP_SENDING_ENABLED: "false" });
    const zm = installMetaMock();
    const r = await WAm.sendWhatsAppTemplate({
      to: CLIENT_A, kind: "byelarah_date", template: { params: ["Maria", "Oficina", "24 de abril", "SP", "link"] },
    });
    check("oficial + kill switch → não envia", r.ok === false && zm.calls.length === 0, JSON.stringify(r));

    const WAs = await loadWA({ ...META_ENV, WHATSAPP_ENV: "staging", WHATSAPP_TEST_ALLOWLIST: "" });
    const zs = installMetaMock();
    const rs = await WAs.sendWhatsAppTemplate({
      to: CLIENT_A, kind: "byelarah_date", template: { params: ["Maria", "Oficina", "24 de abril", "SP", "link"] },
    });
    check("oficial fora de produção sem allowlist → não envia", rs.ok === false && zs.calls.length === 0);
  }

  {
    // SAIU DA LISTA DE ESPERA sem data conhecida → outro template, e nenhuma
    // promessa de data que a Elarah não tem.
    const WAm = await loadWA(META_ENV);
    const zm = installMetaMock();
    const onda = {
      id: "onda-aberta", item_slug: "perfumaria-criativa",
      item_nome: "Oficina de Perfumaria Criativa", data_texto: "",
      motivo: "inscricoes", horarios: [], local: "",
      link: "https://elarah.com.br/experiencia.html?id=exp-9",
    };
    const sb = makeSupabase([], [subSeed({ id: "sub-ab" })]);
    const r = await runAvisoDeData(WAm, sb, onda);
    check("abriu inscrições sem data → avisou mesmo assim", r.enviados === 1, JSON.stringify(r));
    const c = zm.calls[0];
    check("é o MESMO template de sempre (só um existe)",
      c.template === "elarah_inscricoes_abertas", String(c.template));
    check("mesmos 5 parâmetros, com ou sem data", c.params.length === 5, JSON.stringify(c.params));
    check("sem data → {{3}} vira texto neutro, nunca vazio", c.params[2] === "data a confirmar", c.params[2]);
    check("link de checkout no {{5}}", c.params[4] === onda.link);
  }

  {
    // O ARRANJO REAL PEDIDO: confirmação/lembrete/feedback continuam no canal
    // de sempre (já funcionam, templates não aprovados na oficial), e SÓ o
    // aviso pra lista de interesse — o disparo frio — sai pela oficial.
    const MISTO = { ...PROD_ENV, ...META_ENV };   // credenciais dos dois
    const WAx = await loadWA(MISTO);
    check("misto: provedor padrão continua legado", WAx.whatsappProviderName() === "zapi");
    check("misto: oficial disponível pro fluxo que pedir", WAx.whatsappOfficialReady() === true);

    // 1) Confirmação de reserva → Z-API (texto/imagem), como hoje.
    const zz = installZapiMock();
    const sbz = makeSupabase([bookingSeed({ id: "bkx-A" })]);
    const rc = await WAx.sendBookingConfirmationGated(sbz, sbz._bookings.get("bkx-A"), {
      telefone_digits: CLIENT_A,
    });
    check("misto: confirmação sai pelo canal legado", rc.sent === true && zz.calls.length === 1,
      JSON.stringify({ sent: rc.sent, calls: zz.calls.length }));

    // 2) Aviso "a data saiu" → Meta, com template aprovado.
    const zm = installMetaMock();
    const onda = {
      id: "onda-misto", item_slug: "vitral", item_nome: "Crie seu Amuleto em Vitral",
      data_texto: "24 de abril", horarios: ["10h às 13h"], local: "Brooklin",
      link: "https://elarah.com.br/x",
    };
    const sbm = makeSupabase([], [subSeed({ id: "sub-x", item_slug: "vitral", experiencia: onda.item_nome })]);
    const rx = await runAvisoDeData(WAx, sbm, onda);
    check("misto: aviso à lista sai pela OFICIAL", rx.enviados === 1 && zm.calls.length === 1,
      JSON.stringify(rx));
    check("misto: e vai como template aprovado", zm.calls[0].template === "elarah_inscricoes_abertas");
  }

  {
    // FOTO POR PESSOA: com o template aprovado COM cabeçalho de imagem, cada
    // envio leva a foto do evento em que aquela pessoa se inscreveu. A Meta
    // aprova a estrutura; a imagem vai em cada mensagem.
    const FOTO = "https://elarah.com.br/assets/vitral.jpg";
    const onda = {
      id: "onda-foto", item_slug: "vitral", item_nome: "Crie seu Amuleto em Vitral",
      data_texto: "24 de abril", horarios: ["10h às 13h"], local: "Brooklin",
      link: "https://elarah.com.br/x", imagem: FOTO,
    };
    const seed = [subSeed({ id: "sub-f", item_slug: "vitral", experiencia: onda.item_nome })];

    // (a) secret LIGADO → cabeçalho com a foto do evento
    const WAon = await loadWA({ ...META_ENV, META_TEMPLATE_INSCRICOES_IMAGEM: "true" });
    const zOn = installMetaMock();
    await runAvisoDeData(WAon, makeSupabase([], seed), onda);
    const cOn = zOn.calls[0];
    const header = (cOn.components || []).find((c) => c.type === "header");
    check("com o secret ligado → template vai com cabeçalho de imagem", !!header);
    check("e a imagem é a FOTO DAQUELE evento",
      header && header.parameters[0].image.link === FOTO,
      JSON.stringify(header));
    check("o corpo continua com os 5 parâmetros", cOn.params.length === 5);

    // (b) secret DESLIGADO → nenhum cabeçalho (senão a Meta recusa tudo)
    const WAoff = await loadWA(META_ENV);
    const zOff = installMetaMock();
    await runAvisoDeData(WAoff, makeSupabase([], seed), onda);
    check("sem o secret → NENHUM cabeçalho é enviado",
      !(zOff.calls[0].components || []).some((c) => c.type === "header"));
  }

  // ---------- Relatório ----------
  console.log(out.join("\n"));
  console.log(`\n==== E2E: ${PASS} verificações passaram, ${FAIL} falharam ====`);
  console.log("Chamadas reais à Z-API (rede): 0 — fronteira mockada, nada saiu da máquina.");
  if (FAIL > 0) process.exit(1);
}

run().catch((e) => { console.error("ERRO no harness E2E:", e); process.exit(1); });
