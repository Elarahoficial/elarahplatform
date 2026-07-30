// EVIDÊNCIA do UNIQUE de verdade (não mock): usa node:sqlite pra criar a
// mesma tabela/constraint e provar que, sob concorrência, o UNIQUE deixa
// UMA reserva passar e rejeita as demais. O gate real é wired nessa tabela.
// (Postgres UNIQUE tem a mesma semântica: INSERT concorrente → 1 vence,
//  os outros levam unique_violation.)
import { DatabaseSync } from "node:sqlite";
import { gatedSend } from "./whatsapp_gate.js";

const MY_TEST = "5511999990000";
let PASS = 0, FAIL = 0;
function check(name, cond, detail) {
  if (cond) { PASS++; console.log(`  ✅ ${name}`); }
  else { FAIL++; console.log(`  ❌ ${name} — ${detail || ""}`); }
}

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`create table whatsapp_send_log(
    dedupe_key text not null,
    kind text, status text, phone_masked text,
    created_at text default (datetime('now'))
  );`);
  // A TRAVA — idêntica ao Postgres.
  db.exec(`create unique index wsl_uidx on whatsapp_send_log(dedupe_key);`);
  return db;
}

// --- PROVA 1: martelar o UNIQUE direto (200 inserts concorrentes, 1 chave) ---
async function prova1() {
  console.log("PROVA 1 — 200 INSERTs concorrentes da MESMA chave no UNIQUE real:");
  const db = freshDb();
  const stmt = db.prepare("insert into whatsapp_send_log(dedupe_key,status) values(?, 'pending')");
  let ok = 0, viol = 0;
  await Promise.all(Array.from({ length: 200 }, () => (async () => {
    try { stmt.run("confirmation:booking-XYZ"); ok++; }
    catch (e) { if (/UNIQUE/i.test(String(e))) viol++; else throw e; }
  })()));
  const rows = db.prepare("select count(*) c from whatsapp_send_log").get().c;
  console.log(`  ── EVIDÊNCIA: inserts_ok=${ok} | unique_violations=${viol} | linhas_na_tabela=${rows}`);
  check("1 insert vence", ok === 1, "ok=" + ok);
  check("199 rejeitados pelo UNIQUE", viol === 199, "viol=" + viol);
  check("tabela com exatamente 1 linha", rows === 1, "rows=" + rows);
  db.close();
}

// --- PROVA 2: gate REAL wired no SQLite, 50 gatedSend concorrentes ---
async function prova2() {
  console.log("\nPROVA 2 — gate real + UNIQUE real: 50 gatedSend concorrentes, mesma chave:");
  const db = freshDb();
  const insert = db.prepare(
    "insert into whatsapp_send_log(dedupe_key,kind,status,phone_masked) values(?,?,?,?)",
  );
  let zapiCalls = 0;
  const deps = {
    config: { isProd: true, sendingDisabled: false, dryRun: false, allowlist: null, rolloutPercent: 100 },
    reserve: async (key, meta) => {
      try {
        insert.run(key, meta.kind ?? "confirmation", meta.status ?? "pending", meta.phone_masked ?? null);
        return { reserved: true };
      } catch (e) {
        if (/UNIQUE/i.test(String(e))) return { duplicate: true };
        return { error: true };
      }
    },
    finalize: async (key, patch) => {
      db.prepare("update whatsapp_send_log set status=? where dedupe_key=?").run(patch.status ?? "sent", key);
    },
    send: async () => { zapiCalls++; return { ok: true, id: "MSG" + zapiCalls }; },
  };
  const params = {
    kind: "confirmation", dedupeKey: "confirmation:booking-REAL", identifierOk: true,
    rawPhone: MY_TEST, suppressed: false, statusAllowed: true, message: "oi", bookingId: "b-REAL",
  };
  const res = await Promise.all(Array.from({ length: 50 }, () => gatedSend(deps, params)));
  const sent = res.filter(r => r.sent).length;
  const dup = res.filter(r => r.reason === "duplicate").length;
  const rows = db.prepare("select count(*) c from whatsapp_send_log").get().c;
  const sentRows = db.prepare("select count(*) c from whatsapp_send_log where status='sent'").get().c;
  console.log(`  ── EVIDÊNCIA: gatedSend=50 | chamadas_Z-API=${zapiCalls} | sent=${sent} | duplicate=${dup} | linhas=${rows} | status='sent'=${sentRows}`);
  check("apenas 1 chamada chegou à Z-API", zapiCalls === 1, "zapi=" + zapiCalls);
  check("apenas 1 gatedSend enviou", sent === 1 && dup === 49);
  check("UNIQUE deixou só 1 linha", rows === 1, "rows=" + rows);
  db.close();
}

async function run() {
  await prova1();
  await prova2();
  console.log(`\n==== SQLite/UNIQUE: ${PASS} passaram, ${FAIL} falharam ====`);
  if (FAIL > 0) process.exit(1);
}
run();
