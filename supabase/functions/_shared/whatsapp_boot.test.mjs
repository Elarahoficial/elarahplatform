// SMOKE TEST DE BOOT: carrega o módulo real (mockando o Deno) pra pegar erros
// que só aparecem ao SUBIR a função (ex.: "Cannot access X before
// initialization" por ordem de const). O bundle do deploy NÃO executa o
// módulo, então esse tipo de erro passa batido no deploy e só quebra em runtime.
//
// Rodar: node --experimental-strip-types supabase/functions/_shared/whatsapp_boot.test.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

globalThis.Deno = {
  env: {
    get: (k) => ({
      WHATSAPP_TEST_ALLOWLIST: "5511999998888, 11988887777",
      WHATSAPP_ENV: "production",
    })[k] ?? "",
  },
};

const here = dirname(fileURLToPath(import.meta.url));
let fail = 0;
try {
  const m = await import(join(here, "whatsapp.ts"));
  const need = [
    "gatedSendWhatsApp", "sendBookingConfirmationGated", "normalizePhoneBR",
    "whatsappAllowlistHas", "bookingConfirmationWhatsAppText",
    "reminder48hWhatsAppText", "feedbackWhatsAppText", "pendingRecoveryWhatsAppText",
  ];
  for (const n of need) {
    if (typeof m[n] !== "function") { console.log("❌ export ausente:", n); fail++; }
  }
  // Sanidade: allowlist funciona (usa VALID_DDDS na carga → pega TDZ).
  if (m.whatsappAllowlistHas("11999998888") !== true) { console.log("❌ allowlist não reconheceu número válido"); fail++; }
  if (m.whatsappAllowlistHas("999") !== false) { console.log("❌ allowlist aceitou número inválido"); fail++; }
  if (fail === 0) console.log("✅ whatsapp.ts BOOT OK — módulo carrega e exports presentes.");
} catch (e) {
  console.log("❌ BOOT FALHOU:", e.message);
  console.log(String(e.stack).split("\n").slice(0, 4).join("\n"));
  fail++;
}
if (fail > 0) process.exit(1);
