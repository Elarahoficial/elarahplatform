// =============================================================
// ELARAH — Tests pra booking_guard (cálculo de cobrança)
// -------------------------------------------------------------
// Cobre computeChargeAmount + assertExpectedTotal — funções que
// são fonte única da verdade pro total cobrado em qualquer fluxo
// de pagamento (Stripe cartão, MP PIX, gift card direto).
//
// Rodar:
//   deno test supabase/functions/_shared/booking_guard.test.ts
//
// O Supabase CLI traz Deno embutido; basta `supabase functions
// serve` ter sido invocado uma vez no projeto pra que o binário
// esteja disponível.
// =============================================================

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  assertExpectedTotal,
  computeChargeAmount,
  holdsInventory,
  reoccupyVagaOnReapproval,
  wasInventoryReleased,
} from "./booking_guard.ts";

Deno.test("computeChargeAmount: 1 vaga sem desconto", () => {
  const r = computeChargeAmount(10000, 1, 0);
  assertEquals(r.unitCents, 10000);
  assertEquals(r.quantity, 1);
  assertEquals(r.subtotalCents, 10000);
  assertEquals(r.discountCents, 0);
  assertEquals(r.totalCents, 10000);
});

Deno.test("computeChargeAmount: 3 vagas — multiplicação correta", () => {
  const r = computeChargeAmount(10000, 3, 0);
  assertEquals(r.subtotalCents, 30000);
  assertEquals(r.totalCents, 30000);
});

Deno.test("computeChargeAmount: 5 vagas com desconto parcial", () => {
  const r = computeChargeAmount(8000, 5, 12000);
  // subtotal 40000, desconto 12000, total 28000
  assertEquals(r.subtotalCents, 40000);
  assertEquals(r.discountCents, 12000);
  assertEquals(r.totalCents, 28000);
});

Deno.test("computeChargeAmount: desconto cobre 100% — total zera", () => {
  const r = computeChargeAmount(10000, 2, 25000);
  assertEquals(r.subtotalCents, 20000);
  assertEquals(r.discountCents, 20000); // capado no subtotal
  assertEquals(r.totalCents, 0);
});

Deno.test("computeChargeAmount: desconto maior que subtotal não vira negativo", () => {
  const r = computeChargeAmount(5000, 1, 99999);
  assertEquals(r.totalCents, 0);
  assertEquals(r.discountCents, 5000);
});

Deno.test("computeChargeAmount: quantity inválida vira 1 (defesa)", () => {
  const r1 = computeChargeAmount(10000, 0, 0);
  assertEquals(r1.quantity, 1);
  assertEquals(r1.totalCents, 10000);

  const r2 = computeChargeAmount(10000, -5, 0);
  assertEquals(r2.quantity, 1);
});

Deno.test("computeChargeAmount: quantity fracionária é truncada pra inteiro", () => {
  const r = computeChargeAmount(10000, 2.7, 0);
  assertEquals(r.quantity, 2);
  assertEquals(r.subtotalCents, 20000);
});

Deno.test("computeChargeAmount: quantity NaN explode", () => {
  assertThrows(
    () => computeChargeAmount(10000, NaN, 0),
    Error,
    "quantity inválido",
  );
});

Deno.test("computeChargeAmount: unit zero/negativo explode", () => {
  assertThrows(() => computeChargeAmount(0, 3, 0), Error, "unit_cents inválido");
  assertThrows(() => computeChargeAmount(-100, 3, 0), Error, "unit_cents inválido");
});

Deno.test("computeChargeAmount: unit string ou null explode", () => {
  assertThrows(() => computeChargeAmount(null, 3, 0), Error, "unit_cents inválido");
  assertThrows(
    () => computeChargeAmount("abc" as unknown, 3, 0),
    Error,
    "unit_cents inválido",
  );
});

Deno.test("computeChargeAmount: gift card cents string é parseado", () => {
  const r = computeChargeAmount(10000, 2, "5000" as unknown);
  assertEquals(r.discountCents, 5000);
  assertEquals(r.totalCents, 15000);
});

Deno.test("computeChargeAmount: gift card cents lixo vira 0", () => {
  const r = computeChargeAmount(10000, 2, "abc" as unknown);
  assertEquals(r.discountCents, 0);
  assertEquals(r.totalCents, 20000);
});

Deno.test("assertExpectedTotal: aceita >= esperado (taxa pode somar)", () => {
  const breakdown = computeChargeAmount(10000, 3, 0);
  // total esperado: 30000. Cobrar 30000 ou 30300 (com taxa) é OK.
  assertExpectedTotal(breakdown, 30000, "test ok");
  assertExpectedTotal(breakdown, 30300, "test ok com taxa");
  assertExpectedTotal(breakdown, 99999, "test ok cobrando muito mais");
});

Deno.test("assertExpectedTotal: rejeita < esperado (cobraria a menos)", () => {
  const breakdown = computeChargeAmount(10000, 3, 0);
  // Esperado 30000. Cobrar 10000 (qty=1 escondido) deve abortar.
  assertThrows(
    () => assertExpectedTotal(breakdown, 10000, "qty perdido"),
    Error,
    "amount_mismatch",
  );
  assertThrows(
    () => assertExpectedTotal(breakdown, 29999, "delta de 1 centavo"),
    Error,
    "amount_mismatch",
  );
});

Deno.test("assertExpectedTotal: edge case — total zero é aceito", () => {
  const breakdown = computeChargeAmount(10000, 2, 99999);
  // Desconto cobre tudo: totalCents=0, finalCharge=0 (gift card 100%).
  assertExpectedTotal(breakdown, 0, "gift card cobre 100%");
});

// ===== Cenário regressivo: o bug que motivou a investigação =====
// "qty=N mas só cobra 1 unidade" — assert deve pegar esse caso.
Deno.test("regressão bug: qty=5 mas Stripe foi chamado com unit_amount=preço unitário", () => {
  const breakdown = computeChargeAmount(10000, 5, 0);
  // breakdown diz: total 50000.
  // Cenário de bug: alguém passou cents (10000) ao invés do total
  // pra Stripe. Assert tem que abortar.
  assertThrows(
    () => assertExpectedTotal(breakdown, 10000, "stripe checkout session"),
    Error,
    "amount_mismatch",
  );
});

Deno.test("regressão bug: cálculo correto passa o assert sem soluço", () => {
  const breakdown = computeChargeAmount(10000, 5, 0);
  // Cenário OK: cobrar 50000 (5 × 10000). Assert passa.
  assertExpectedTotal(breakdown, 50000, "stripe checkout session ok");
});

// =============================================================
// Estados de inventário + re-ocupação (fix de overbooking)
// -------------------------------------------------------------
// holdsInventory / wasInventoryReleased classificam o status da
// booking. reoccupyVagaOnReapproval re-decrementa quando uma
// booking liberada volta a ser paga. Estes cobrem o bug que
// permitia "vender além da lotação".
// =============================================================

Deno.test("holdsInventory: pending e pago seguram vaga; resto não", () => {
  assertEquals(holdsInventory("pending"), true);
  assertEquals(holdsInventory("pago"), true);
  assertEquals(holdsInventory("cancelado"), false);
  assertEquals(holdsInventory("expirado"), false);
  assertEquals(holdsInventory("reembolsado"), false);
  assertEquals(holdsInventory(null), false);
  assertEquals(holdsInventory(undefined), false);
});

Deno.test("wasInventoryReleased: só os terminais liberados", () => {
  assertEquals(wasInventoryReleased("cancelado"), true);
  assertEquals(wasInventoryReleased("expirado"), true);
  assertEquals(wasInventoryReleased("reembolsado"), true);
  assertEquals(wasInventoryReleased("pending"), false);
  assertEquals(wasInventoryReleased("pago"), false);
  assertEquals(wasInventoryReleased(null), false);
});

// Mock mínimo do client Supabase: registra a chamada rpc e devolve
// o que o teste configurar.
// deno-lint-ignore no-explicit-any
function mockSupabase(rpcResult: any) {
  const calls: Array<{ fn: string; args: unknown }> = [];
  const client = {
    // deno-lint-ignore no-explicit-any
    rpc(fn: string, args: unknown): Promise<any> {
      calls.push({ fn, args });
      return Promise.resolve(rpcResult);
    },
  };
  return { client, calls };
}

Deno.test("reoccupy: slot com vaga → re-decrementa e não é oversold", async () => {
  const { client, calls } = mockSupabase({ data: [{ ok: true, vagas_restantes: 0 }], error: null });
  // deno-lint-ignore no-explicit-any
  const r = await reoccupyVagaOnReapproval(client as any, {
    slot_id: "slot-1", experiencia_id: "exp-1", quantidade: 1,
  });
  assertEquals(r.reoccupied, true);
  assertEquals(r.oversold, false);
  assertEquals(calls[0].fn, "decrement_slot_vagas");
  assertEquals(calls[0].args, { p_slot_id: "slot-1", p_qty: 1 });
});

Deno.test("reoccupy: sem vaga (ok=false) → oversold=true (pagamento já caiu)", async () => {
  const { client } = mockSupabase({ data: [{ ok: false, vagas_restantes: 0 }], error: null });
  // deno-lint-ignore no-explicit-any
  const r = await reoccupyVagaOnReapproval(client as any, {
    slot_id: "slot-1", quantidade: 2,
  });
  assertEquals(r.reoccupied, false);
  assertEquals(r.oversold, true);
});

Deno.test("reoccupy: sem slot_id cai pro nível experiência", async () => {
  const { client, calls } = mockSupabase({ data: [{ ok: true, vagas_restantes: 3 }], error: null });
  // deno-lint-ignore no-explicit-any
  const r = await reoccupyVagaOnReapproval(client as any, {
    slot_id: null, experiencia_id: "exp-1", quantidade: 1,
  });
  assertEquals(r.reoccupied, true);
  assertEquals(calls[0].fn, "decrement_experience_vagas");
  assertEquals(calls[0].args, { p_experience_id: "exp-1", p_qty: 1 });
});

Deno.test("reoccupy: RPC indisponível (error) → não bloqueia, oversold=false", async () => {
  const { client } = mockSupabase({ data: null, error: { message: "function does not exist" } });
  // deno-lint-ignore no-explicit-any
  const r = await reoccupyVagaOnReapproval(client as any, {
    slot_id: "slot-1", quantidade: 1,
  });
  assertEquals(r.reoccupied, false);
  assertEquals(r.oversold, false);
});
