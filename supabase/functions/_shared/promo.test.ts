// =============================================================
// ELARAH — Tests do desconto geral (_shared/promo.ts)
// -------------------------------------------------------------
// O que estes tests protegem: o preço que o SERVIDOR cobra durante uma
// campanha. Se ele divergir do que a vitrine anuncia, a cliente vê
// R$ 144 e o cartão passa R$ 180.
//
// A configuração (percentual e validade) vem do banco — aba "Desconto
// geral" do admin. Aqui ela é injetada à mão, então os casos valem
// hoje e daqui a um ano, com ou sem campanha no ar.
//
// Rodar:
//   deno test supabase/functions/_shared/promo.test.ts
// =============================================================

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type DescontoGeral,
  descontoAtivo,
  descontoCarrinhoPct,
  precoCarrinhoCentavos,
  precoFinalCentavos,
  precoLabelBR,
  precoPromocionalCentavos,
  SEM_DESCONTO,
} from "./promo.ts";

const ONTEM = new Date(Date.now() - 86_400_000).toISOString();
const AMANHA = new Date(Date.now() + 86_400_000).toISOString();
const SEMANA_PASSADA = new Date(Date.now() - 7 * 86_400_000).toISOString();

const VINTE: DescontoGeral = {
  ativo: true,
  percentual: 20,
  inicio: ONTEM,
  fim: AMANHA,
};

Deno.test("20% sobre o preço do site — o que o banner promete", () => {
  assertEquals(precoPromocionalCentavos(18000, VINTE), 14400);
  assertEquals(precoPromocionalCentavos(61000, VINTE), 48800);
  assertEquals(precoPromocionalCentavos(26100, VINTE), 20880);
});

Deno.test("percentual configurado é o que manda", () => {
  assertEquals(precoPromocionalCentavos(10000, { ...VINTE, percentual: 15 }), 8500);
  assertEquals(precoPromocionalCentavos(10000, { ...VINTE, percentual: 50 }), 5000);
});

Deno.test("desligado no admin: preço intacto, mesmo dentro da validade", () => {
  assertEquals(precoPromocionalCentavos(18000, { ...VINTE, ativo: false }), 18000);
});

Deno.test("fora da validade: preço intacto, mesmo ligado", () => {
  const vencido = { ...VINTE, inicio: SEMANA_PASSADA, fim: ONTEM };
  assertEquals(descontoAtivo(vencido), false);
  assertEquals(precoPromocionalCentavos(18000, vencido), 18000);

  const futuro = { ...VINTE, inicio: AMANHA, fim: AMANHA };
  assertEquals(descontoAtivo(futuro), false);
  assertEquals(precoPromocionalCentavos(18000, futuro), 18000);
});

Deno.test("sem configuração (banco fora do ar) = sem desconto", () => {
  assertEquals(precoPromocionalCentavos(18000, SEM_DESCONTO), 18000);
  assertEquals(precoPromocionalCentavos(18000, null), 18000);
  assertEquals(precoPromocionalCentavos(18000, undefined), 18000);
});

Deno.test("datas faltando ou inválidas não ligam desconto", () => {
  assertEquals(descontoAtivo({ ...VINTE, fim: null }), false);
  assertEquals(descontoAtivo({ ...VINTE, inicio: "não é data" }), false);
});

Deno.test("percentual zero ou negativo não desconta", () => {
  assertEquals(precoPromocionalCentavos(18000, { ...VINTE, percentual: 0 }), 18000);
  assertEquals(precoPromocionalCentavos(18000, { ...VINTE, percentual: -10 }), 18000);
});

Deno.test("variação (Individual/Dupla/kit) desconta sobre o preço da opção", () => {
  assertEquals(precoPromocionalCentavos(30000, VINTE), 24000);
});

Deno.test("preço inválido volta intacto (não inventa cobrança)", () => {
  assertEquals(precoPromocionalCentavos(0, VINTE), 0);
  assertEquals(precoPromocionalCentavos(-1, VINTE), -1);
});

Deno.test("desconto nunca zera a cobrança", () => {
  // 1 centavo × 0,8 arredonda pra 1 — nunca pra 0, que viraria reserva
  // grátis silenciosa.
  assertEquals(precoPromocionalCentavos(1, VINTE), 1);
  assertEquals(precoPromocionalCentavos(1, { ...VINTE, percentual: 90 }), 1);
});

Deno.test("precoLabelBR: centavos só quando existem de verdade", () => {
  assertEquals(precoLabelBR(48800), "R$ 488");
  assertEquals(precoLabelBR(43920), "R$ 439,20");
  assertEquals(precoLabelBR(110400), "R$ 1.104");
});

// ===== Desconto do carrinho (10% com 1 pessoa, 15% por pessoa com 2+) =====

Deno.test("carrinho: 1 pessoa leva 10%, 2 ou mais levam 15% cada", () => {
  assertEquals(descontoCarrinhoPct(1), 10);
  assertEquals(descontoCarrinhoPct(2), 15);
  assertEquals(descontoCarrinhoPct(7), 15);
  assertEquals(descontoCarrinhoPct(0), 0);
  assertEquals(precoCarrinhoCentavos(18000, 1), 16200);
  assertEquals(precoCarrinhoCentavos(18000, 2), 15300);
  assertEquals(precoCarrinhoCentavos(26100, 3), 22185);
});

Deno.test("carrinho: sem campanha geral, vale o desconto por quantidade", () => {
  assertEquals(precoFinalCentavos(18000, SEM_DESCONTO, 1), { cents: 16200, origem: "carrinho", pct: 10 });
  assertEquals(precoFinalCentavos(18000, SEM_DESCONTO, 2), { cents: 15300, origem: "carrinho", pct: 15 });
});

Deno.test("carrinho: não acumula com a campanha geral — vale a campanha", () => {
  assertEquals(precoFinalCentavos(18000, VINTE, 1), { cents: 14400, origem: "geral", pct: 20 });
  assertEquals(precoFinalCentavos(18000, VINTE, 3), { cents: 14400, origem: "geral", pct: 20 });
});
