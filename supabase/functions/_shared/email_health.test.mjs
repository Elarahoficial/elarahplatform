// TESTE DO DIAGNÓSTICO DE E-MAIL (_shared/email.ts)
// -------------------------------------------------------------
// Cobre o caminho que faz o e-mail de compra NÃO chegar sem ninguém
// perceber: o Resend recusa o envio, o webhook segue em frente (pagamento
// confirmado, reserva criada) e o erro fica só no log da Edge Function.
//
// Aqui a fronteira de rede (fetch pro api.resend.com) é 100% mockada —
// nenhum e-mail sai e nenhuma chamada real acontece.
//
// Rodar:
//   node --experimental-strip-types supabase/functions/_shared/email_health.test.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ENV = {
  RESEND_API_KEY: "re_teste_1234567890",
  ELARAH_FROM_EMAIL: "Elarah <contato@elarah.com.br>",
  ADMIN_NOTIFY_EMAILS: "",
};
globalThis.Deno = { env: { get: (k) => ENV[k] ?? "" } };

// ---- mock de fetch: guarda as chamadas e devolve o que o teste mandar ----
let calls = [];
let nextResponses = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
  const r = nextResponses.shift();
  if (!r) throw new Error("mock sem resposta programada para " + url);
  return {
    ok: r.status >= 200 && r.status < 300,
    status: r.status,
    text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? {})),
    json: async () => (typeof r.body === "string" ? JSON.parse(r.body) : (r.body ?? {})),
  };
};
function reset(responses) { calls = []; nextResponses = responses.slice(); }

const here = dirname(fileURLToPath(import.meta.url));
const m = await import(join(here, "email.ts"));

let pass = 0, fail = 0;
function check(nome, cond, extra) {
  if (cond) { pass++; console.log("  ✅ " + nome); }
  else { fail++; console.log("  ❌ " + nome + (extra ? " → " + extra : "")); }
}

// ===== 1) fromEmailDomain =====
console.log("1) fromEmailDomain");
check("extrai domínio de 'Nome <a@b.com>'", m.fromEmailDomain("Elarah <contato@elarah.com.br>") === "elarah.com.br");
check("extrai domínio de endereço puro", m.fromEmailDomain("contato@elarah.com.br") === "elarah.com.br");
check("null quando não tem @", m.fromEmailDomain("Elarah") === null);

// ===== 2) trava de modo teste do Resend =====
console.log("2) isSandboxRecipientRestriction");
const SANDBOX_BODY = JSON.stringify({
  statusCode: 403,
  message: "You can only send testing emails to your own email address (contato.elarah@gmail.com).",
});
check("reconhece o 403 de modo teste", m.isSandboxRecipientRestriction(403, SANDBOX_BODY) === true);
check("não confunde com domínio não verificado",
  m.isSandboxRecipientRestriction(403, '{"message":"The elarah.com.br domain is not verified"}') === false);
check("ignora status diferente de 403", m.isSandboxRecipientRestriction(422, SANDBOX_BODY) === false);

// ===== 3) sendEmail: modo teste NÃO faz retry inútil =====
// Repetir com onboarding@resend.dev não resolve (a trava é do
// DESTINATÁRIO), então tem que sair na primeira e explicar.
console.log("3) sendEmail com conta em modo teste");
reset([{ status: 403, body: SANDBOX_BODY }]);
let r = await m.sendEmail({ to: "cliente@gmail.com", subject: "x", html: "<p>x</p>" });
check("não envia", r.ok === false);
check("marca sandboxRestricted", r.sandboxRestricted === true);
check("chamou o Resend UMA vez só (sem retry inútil)", calls.length === 1, "chamadas=" + calls.length);
check("explicação fala em modo teste", /modo teste/i.test(m.explainEmailFailure(r)), m.explainEmailFailure(r));

// ===== 4) sendEmail: domínio não verificado ainda cai no fallback =====
console.log("4) sendEmail com domínio não verificado (fallback sandbox)");
reset([
  { status: 403, body: '{"message":"The elarah.com.br domain is not verified. Please verify your domain"}' },
  { status: 200, body: { id: "email_123" } },
]);
r = await m.sendEmail({ to: "cliente@gmail.com", subject: "x", html: "<p>x</p>" });
check("envia pelo fallback", r.ok === true);
check("marca usedFallbackFrom", r.usedFallbackFrom === true);
check("segunda tentativa usou onboarding@resend.dev",
  calls.length === 2 && String(calls[1].body.from).includes("onboarding@resend.dev"));

// ===== 5) sendEmail: caminho feliz =====
console.log("5) sendEmail no caminho feliz");
reset([{ status: 200, body: { id: "email_ok" } }]);
r = await m.sendEmail({ to: "cliente@gmail.com", subject: "x", html: "<p>x</p>" });
check("ok", r.ok === true && r.id === "email_ok");
check("usou o FROM configurado", calls[0].body.from === "Elarah <contato@elarah.com.br>");

// ===== 6) explainEmailFailure cobre os erros comuns =====
console.log("6) explainEmailFailure");
check("chave ausente", /RESEND_API_KEY/.test(m.explainEmailFailure({ ok: false, skipped: true })));
check("chave inválida", /inválida ou revogada/.test(
  m.explainEmailFailure({ ok: false, status: 401, error: '{"message":"API key is invalid"}' })));
check("limite de envio", /Limite de envio/.test(m.explainEmailFailure({ ok: false, status: 429, error: "{}" })));
check("falha de rede (sem status)", /rede/.test(m.explainEmailFailure({ ok: false, error: "TypeError: failed" })));

// ===== 7) resendDiagnostics lê a conta sem enviar nada =====
console.log("7) resendDiagnostics");
reset([{ status: 200, body: { data: [{ name: "elarah.com.br", status: "verified", region: "us-east-1" }] } }]);
let d = await m.resendDiagnostics();
check("bate no endpoint /domains", calls[0].url === "https://api.resend.com/domains");
check("chave válida", d.key_valid === true);
check("domínio do FROM verificado", d.from_domain_status === "verified");
check("não vaza a chave inteira", d.api_key_prefix === "re_tes…" && !JSON.stringify(d).includes(ENV.RESEND_API_KEY));
check("diagnóstico positivo", m.explainResendDiagnostics(d).startsWith("✅"), m.explainResendDiagnostics(d));

reset([{ status: 200, body: { data: [] } }]);
d = await m.resendDiagnostics();
check("sem domínio verificado → acusa modo teste", /modo teste/i.test(m.explainResendDiagnostics(d)));

reset([{ status: 200, body: { data: [{ name: "outrodominio.com", status: "verified" }] } }]);
d = await m.resendDiagnostics();
check("FROM fora dos domínios cadastrados", d.from_domain_status === "nao_cadastrado");
check("diagnóstico aponta o FROM errado", /NÃO está cadastrado/.test(m.explainResendDiagnostics(d)));

reset([{ status: 401, body: '{"message":"API key is invalid"}' }]);
d = await m.resendDiagnostics();
check("401 → chave inválida", d.key_valid === false);
check("diagnóstico acusa chave inválida", /inválida ou foi revogada/.test(m.explainResendDiagnostics(d)));

console.log("\n==== E-MAIL: " + pass + " passaram, " + fail + " falharam ====");
console.log("Chamadas reais ao Resend (rede): 0 — fronteira mockada, nenhum e-mail saiu.");
if (fail > 0) process.exit(1);
