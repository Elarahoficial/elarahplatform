// Bateria de testes de quebra do portão de WhatsApp.
// Importa o MÓDULO REAL (whatsapp_gate.js) — não uma reimplementação.
// Nada é enviado: `send` é um mock que só CONTA chamadas.
import { gatedSend, normalizePhoneBR, maskPhone, rolloutBucket } from
  "./whatsapp_gate.js";

const MY_TEST = "5511999990000"; // "meu número de teste" (fictício, autorizado)
let PASS = 0, FAIL = 0;
const log = [];
function check(name, cond, detail) {
  if (cond) { PASS++; log.push(`  ✅ ${name}`); }
  else { FAIL++; log.push(`  ❌ ${name} — ${detail || ""}`); }
}

// ---- Mock do whatsapp_send_log com UNIQUE(dedupe_key) ATÔMICO ----
// has/add síncronos entre si = modela a atomicidade do INSERT do Postgres
// (sem await no meio → dois concorrentes nunca reservam a mesma chave).
function makeStore(opts = {}) {
  const keys = new Set();
  const rows = new Map();
  return {
    keys, rows,
    async reserve(key, meta) {
      if (opts.failReserve) return { error: true };          // falha de banco
      if (keys.has(key)) return { duplicate: true };          // UNIQUE violado
      keys.add(key);                                          // reserva atômica
      rows.set(key, { ...meta, status: "pending" });
      return { reserved: true };
    },
    async finalize(key, patch) {
      if (opts.failFinalize) throw new Error("update falhou");
      const r = rows.get(key) || {};
      rows.set(key, { ...r, ...patch });
    },
  };
}
function makeSender(opts = {}) {
  const state = { calls: 0, phones: [] };
  const send = async ({ phone }) => {
    state.calls++; state.phones.push(phone);
    if (opts.throw) throw new Error("z-api timeout");
    if (opts.fail) return { ok: false, error: "z-api 500" };
    return { ok: true, id: "MSG" + state.calls };
  };
  return { send, state };
}
const PROD = { isProd: true, sendingDisabled: false, dryRun: false, allowlist: null };

function baseParams(over = {}) {
  return Object.assign({
    kind: "confirmation",
    dedupeKey: "confirmation:booking-1",
    identifierOk: true,
    rawPhone: MY_TEST,
    suppressed: false,
    statusAllowed: true,
    message: "oi",
    bookingId: "booking-1",
  }, over);
}

// ---------- CENÁRIOS ----------
async function run() {
  // 0) Sanidade da normalização de telefone (nunca inventa BR)
  log.push("normalização de telefone (fail-closed):");
  check("BR válido passa", normalizePhoneBR("(11) 99999-0000") === "5511999990000");
  check("US 11 díg rejeitado", normalizePhoneBR("12025550123") === null, normalizePhoneBR("12025550123"));
  check("Portugal 12 díg rejeitado", normalizePhoneBR("351912345678") === null);
  check("México +52 rejeitado", normalizePhoneBR("525512345678") === null || normalizePhoneBR("525512345678") !== null && false || normalizePhoneBR("525512345678") === null);
  check("incompleto rejeitado", normalizePhoneBR("1199999") === null);
  check("DDD inválido (10) rejeitado", normalizePhoneBR("1099999999") === null);
  check("celular sem 9 rejeitado", normalizePhoneBR("1181234567") === null);
  check("vazio rejeitado", normalizePhoneBR("") === null);

  // 1) webhook chegando 2x (sequencial) → 1 envio, 2º duplicado
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const a = await gatedSend(deps, baseParams());
    const b = await gatedSend(deps, baseParams());
    check("1) webhook 2x → 1 envio", s.state.calls === 1, "calls=" + s.state.calls);
    check("1) 2º = duplicate", a.sent === true && b.sent === false && b.reason === "duplicate");
  }

  // 2) webhook + polling simultâneos (mesma chave) → 1 envio
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const [a, b] = await Promise.all([gatedSend(deps, baseParams()), gatedSend(deps, baseParams())]);
    check("2) webhook+polling → 1 envio", s.state.calls === 1, "calls=" + s.state.calls);
    check("2) exatamente 1 sent", (a.sent ? 1 : 0) + (b.sent ? 1 : 0) === 1);
  }

  // 3) dois polls simultâneos → 1 envio
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const res = await Promise.all(Array.from({ length: 5 }, () => gatedSend(deps, baseParams())));
    check("3) 5 polls simultâneos → 1 envio", s.state.calls === 1, "calls=" + s.state.calls);
    check("3) só 1 sent", res.filter(r => r.sent).length === 1);
  }

  // 4) dois broadcasts ao mesmo tempo (mesmo destinatário/campanha) → 1 envio
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const key = "bcast:campanha-x:5511999990000";
    const res = await Promise.all([
      gatedSend(deps, baseParams({ kind: "broadcast", dedupeKey: key })),
      gatedSend(deps, baseParams({ kind: "broadcast", dedupeKey: key })),
    ]);
    check("4) 2 broadcasts → 1 envio", s.state.calls === 1, "calls=" + s.state.calls);
    check("4) só 1 sent", res.filter(r => r.sent).length === 1);
  }

  // 5) clique duplo (10 simultâneos) → 1 envio
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const res = await Promise.all(Array.from({ length: 10 }, () => gatedSend(deps, baseParams())));
    check("5) clique duplo x10 → 1 envio", s.state.calls === 1, "calls=" + s.state.calls);
    check("5) só 1 sent", res.filter(r => r.sent).length === 1);
  }

  // 6) mesma booking, mesma mensagem de novo (depois) → duplicate
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    await gatedSend(deps, baseParams());
    const b = await gatedSend(deps, baseParams());
    check("6) reenvio bloqueado", b.sent === false && b.reason === "duplicate" && s.state.calls === 1);
  }

  // 7) falha no INSERT do send_log → não envia (fail-closed)
  {
    const st = makeStore({ failReserve: true }); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const r = await gatedSend(deps, baseParams());
    check("7) reserve falhou → não envia", r.sent === false && r.reason === "reserve_error" && s.state.calls === 0);
  }

  // 8) falha no UPDATE (finalize) → não gera 2º envio nem crash
  {
    const st = makeStore({ failFinalize: true }); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const r = await gatedSend(deps, baseParams());
    const again = await gatedSend(deps, baseParams());
    check("8) finalize falha → 1 envio só, sem crash", s.state.calls === 1 && r.sent === true && again.reason === "duplicate");
  }

  // 9) Z-API falha/timeout → não envia com sucesso; retry não duplica
  {
    const st = makeStore(); const sT = makeSender({ throw: true });
    const depsT = { config: PROD, ...st, send: sT.send };
    const r = await gatedSend(depsT, baseParams());
    const retry = await gatedSend(depsT, baseParams()); // mesma chave
    check("9) timeout → sent=false", r.sent === false);
    check("9) retry não redispara (duplicate)", retry.reason === "duplicate");

    const st2 = makeStore(); const sF = makeSender({ fail: true });
    const r2 = await gatedSend({ config: PROD, ...st2, send: sF.send }, baseParams());
    check("9) z-api 500 → sent=false", r2.sent === false);
  }

  // 10) telefone inválido/incompleto → não envia
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const r = await gatedSend(deps, baseParams({ rawPhone: "1199", dedupeKey: "confirmation:b-badphone" }));
    check("10) telefone inválido → não envia", r.sent === false && r.reason === "invalid_phone" && s.state.calls === 0);
  }

  // 11) Aguardando experiência (suppressed=true) → não envia
  {
    const st = makeStore(); const s = makeSender();
    const r = await gatedSend({ config: PROD, ...st, send: s.send }, baseParams({ suppressed: true, dedupeKey: "confirmation:b-agu" }));
    check("11) aguardando experiência → não envia", r.sent === false && r.reason === "suppressed" && s.state.calls === 0);
  }

  // 12/13) cancelada / reembolsada (statusAllowed=false) → não envia
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const c = await gatedSend(deps, baseParams({ statusAllowed: false, dedupeKey: "confirmation:b-cancel" }));
    const rf = await gatedSend(deps, baseParams({ statusAllowed: false, dedupeKey: "confirmation:b-refund" }));
    check("12) cancelada → não envia", c.sent === false && c.reason === "status_not_allowed");
    check("13) reembolsada → não envia", rf.sent === false && rf.reason === "status_not_allowed");
    check("12/13) zero envios", s.state.calls === 0);
  }

  // 14) aprovação tardia sobre reserva cancelada → status não permite → não envia
  {
    const st = makeStore(); const s = makeSender();
    const r = await gatedSend({ config: PROD, ...st, send: s.send }, baseParams({ statusAllowed: false, dedupeKey: "confirmation:b-late" }));
    check("14) aprovação tardia (cancelada) → não envia", r.sent === false && s.state.calls === 0);
  }

  // 15) identificador inconsistente (identifierOk=false) → não envia
  {
    const st = makeStore(); const s = makeSender();
    const r = await gatedSend({ config: PROD, ...st, send: s.send }, baseParams({ identifierOk: false, dedupeKey: "confirmation:b-noid" }));
    check("15) sem identificador exato → não envia", r.sent === false && r.reason === "missing_identifier" && s.state.calls === 0);
  }

  // 16) dado obrigatório ausente (dedupeKey) → não envia
  {
    const st = makeStore(); const s = makeSender();
    const r = await gatedSend({ config: PROD, ...st, send: s.send }, baseParams({ dedupeKey: null }));
    check("16) dado obrigatório ausente → não envia", r.sent === false && r.reason === "missing_dedupe_key" && s.state.calls === 0);
  }

  // 17) staging/preview (isProd=false, sem allowlist) → não envia
  {
    const st = makeStore(); const s = makeSender();
    const cfg = { isProd: false, sendingDisabled: false, dryRun: false, allowlist: null };
    const r = await gatedSend({ config: cfg, ...st, send: s.send }, baseParams({ dedupeKey: "confirmation:b-staging" }));
    check("17) staging sem allowlist → não envia", r.sent === false && r.reason === "staging_blocked" && s.state.calls === 0);

    // staging COM meu número na allowlist → pode (só pra mim)
    const st2 = makeStore(); const s2 = makeSender();
    const cfg2 = { isProd: false, sendingDisabled: false, dryRun: false, allowlist: new Set([MY_TEST]) };
    const r2 = await gatedSend({ config: cfg2, ...st2, send: s2.send }, baseParams({ dedupeKey: "confirmation:b-staging2" }));
    check("17) staging com allowlist (meu nº) → envia", r2.sent === true && s2.state.calls === 1);
  }

  // 18) kill switch → não envia
  {
    const st = makeStore(); const s = makeSender();
    const cfg = { isProd: true, sendingDisabled: true, dryRun: false, allowlist: null };
    const r = await gatedSend({ config: cfg, ...st, send: s.send }, baseParams({ dedupeKey: "confirmation:b-kill" }));
    check("18) kill switch → não envia", r.sent === false && r.reason === "sending_disabled" && s.state.calls === 0);
  }

  // 19) dry-run → reserva mas NÃO chama Z-API
  {
    const st = makeStore(); const s = makeSender();
    const cfg = { isProd: true, sendingDisabled: false, dryRun: true, allowlist: null };
    const r = await gatedSend({ config: cfg, ...st, send: s.send }, baseParams({ dedupeKey: "confirmation:b-dry" }));
    check("19) dry-run → não chama Z-API", r.sent === false && r.dryRun === true && s.state.calls === 0);
  }

  // 20) CONCORRÊNCIA PESADA: 50 simultâneos, mesma chave → exatamente 1 envio
  {
    const st = makeStore(); const s = makeSender();
    const deps = { config: PROD, ...st, send: s.send };
    const res = await Promise.all(Array.from({ length: 50 }, () => gatedSend(deps, baseParams({ dedupeKey: "confirmation:stress" }))));
    const sent = res.filter(r => r.sent).length;
    const dup = res.filter(r => r.reason === "duplicate").length;
    log.push(`  ── EVIDÊNCIA #20: requisições=50 | chamadas à Z-API(mock)=${s.state.calls} | sent=${sent} | duplicate=${dup} | linhas na send_log=${st.keys.size}`);
    check("20) 50 simultâneos → exatamente 1 envio", s.state.calls === 1, "calls=" + s.state.calls);
    check("20) exatamente 1 sent, 49 duplicate", sent === 1 && dup === 49);
    check("20) send_log tem exatamente 1 linha", st.keys.size === 1, "rows=" + st.keys.size);
  }

  // 21) MODO OBSERVAÇÃO: registra quem receberia, NÃO envia, não consome a
  //     chave real (envio real depois ainda ocorre).
  {
    const st = makeStore(); const s = makeSender();
    const cfg = { ...PROD, observe: true, sendingDisabled: true }; // observe roda mesmo com kill switch
    const deps = { config: cfg, ...st, send: s.send };
    const r = await gatedSend(deps, baseParams({ dedupeKey: "confirmation:obs-1" }));
    check("21) observe → não envia", r.sent === false && r.reason === "observed" && s.state.calls === 0);
    check("21) observe registra na send_log (namespace observe:)", st.keys.has("observe:confirmation:obs-1"));
    check("21) observe NÃO consome a chave real", !st.keys.has("confirmation:obs-1"));
    // Depois, com observe desligado e envio ligado, a chave real ainda envia:
    const r2 = await gatedSend({ config: PROD, ...st, send: s.send }, baseParams({ dedupeKey: "confirmation:obs-1" }));
    check("21) envio real depois do observe ocorre", r2.sent === true && s.state.calls === 1);
  }

  // 22) ROLLOUT etapa 1/2: allowlist-only (só meu número, mesmo em produção)
  {
    const st = makeStore(); const s = makeSender();
    const cfg = { ...PROD, allowlistOnly: true, allowlist: new Set([MY_TEST]) };
    // fora da allowlist → não envia
    const outro = await gatedSend({ config: cfg, ...st, send: s.send },
      baseParams({ rawPhone: "5521988887777", dedupeKey: "confirmation:al-out" }));
    check("22) allowlist-only: fora da lista → não envia", outro.sent === false && outro.reason === "not_in_allowlist");
    // meu número → envia
    const meu = await gatedSend({ config: cfg, ...st, send: s.send },
      baseParams({ rawPhone: MY_TEST, dedupeKey: "confirmation:al-me" }));
    check("22) allowlist-only: meu número → envia", meu.sent === true);
    check("22) só 1 envio (só o meu)", s.state.calls === 1);
  }

  // 23) ROLLOUT etapa 3: porcentagem determinística
  {
    // pct=0 → ninguém
    {
      const st = makeStore(); const s = makeSender();
      const r = await gatedSend({ config: { ...PROD, rolloutPercent: 0 }, ...st, send: s.send }, baseParams({ dedupeKey: "confirmation:r0" }));
      check("23) rollout 0% → não envia", r.sent === false && r.reason === "rollout_zero" && s.state.calls === 0);
    }
    // pct=100 → envia
    {
      const st = makeStore(); const s = makeSender();
      const r = await gatedSend({ config: { ...PROD, rolloutPercent: 100 }, ...st, send: s.send }, baseParams({ dedupeKey: "confirmation:r100" }));
      check("23) rollout 100% → envia", r.sent === true);
    }
    // pct=50 sobre 1000 chaves → ~metade, e DETERMINÍSTICO (mesmo conjunto ao repetir)
    const incl = (key) => rolloutBucket(key) < 50;
    let included = 0;
    for (let i = 0; i < 1000; i++) if (incl("confirmation:booking-" + i)) included++;
    check("23) rollout 50% libera ~metade (medido=" + included + ")", included > 400 && included < 600, "incl=" + included);
    const sameKey = "confirmation:booking-777";
    check("23) rollout é determinístico (mesma chave, mesmo bucket)", rolloutBucket(sameKey) === rolloutBucket(sameKey));
  }

  // Relatório
  console.log(log.join("\n"));
  console.log(`\n==== RESULTADO: ${PASS} passaram, ${FAIL} falharam ====`);
  console.log("Total de chamadas reais à Z-API nos testes:", "0 (tudo mock)");
  if (FAIL > 0) process.exit(1);
}
run();
