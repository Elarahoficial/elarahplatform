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
function makeSupabase(seedBookings = []) {
  const bookings = new Map();
  for (const b of seedBookings) bookings.set(b.id, { ...b });
  const sendLog = new Map(); // dedupe_key -> row

  function tableApi(name) {
    // Builder encadeável e "thenable" (await funciona direto).
    const filters = [];
    let mode = null;   // 'select' | 'insert' | 'update'
    let payload = null;

    const matches = (row) => filters.every(([c, v]) => row[c] === v);

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
        const store = name === "bookings" ? bookings : sendLog;
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
            const store = name === "bookings" ? bookings : sendLog;
            for (const [k, row] of store.entries()) if (matches(row)) store.set(k, { ...row, ...payload });
            return { data: null, error: null };
          }
          // select-lista
          const store = name === "bookings" ? bookings : sendLog;
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

  // ---------- Relatório ----------
  console.log(out.join("\n"));
  console.log(`\n==== E2E: ${PASS} verificações passaram, ${FAIL} falharam ====`);
  console.log("Chamadas reais à Z-API (rede): 0 — fronteira mockada, nada saiu da máquina.");
  if (FAIL > 0) process.exit(1);
}

run().catch((e) => { console.error("ERRO no harness E2E:", e); process.exit(1); });
