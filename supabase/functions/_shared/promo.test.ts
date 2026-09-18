// =============================================================
// ELARAH — Tests da promoção sazonal (_shared/promo.ts)
// -------------------------------------------------------------
// O que estes tests protegem: o preço que o SERVIDOR cobra durante a
// campanha. Se ele divergir do que a vitrine anuncia (promo.js), a
// cliente vê R$ 144 e o cartão passa R$ 180 — exatamente o bug que a
// duplicação de configuração entre navegador e Deno pode causar.
//
// Rodar:
//   deno test supabase/functions/_shared/promo.test.ts
//
// Os casos são escritos pros DOIS mundos: com a campanha no ar eles
// checam o desconto; depois que a janela fechar (FIM no passado) eles
// checam que o preço volta intacto. Assim o arquivo não fica vermelho
// no dia seguinte ao fim da promoção.
// =============================================================

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  PROMO,
  precoLabelBR,
  precoPromocionalCentavos,
  promoAtiva,
} from "./promo.ts";

const ativa = promoAtiva();

Deno.test("parceira: 20% sobre o VALOR CHEIO, não sobre o praticado", () => {
  // Cheio R$ 610, praticado R$ 549 → 610 - 20% = R$ 488.
  // (20% sobre o praticado daria R$ 439,20 — não é a regra.)
  assertEquals(precoPromocionalCentavos(54900, 61000), ativa ? 48800 : 54900);
});

Deno.test("By Elarah (sem valor cheio): base é o próprio preço", () => {
  assertEquals(precoPromocionalCentavos(18000, null), ativa ? 14400 : 18000);
});

Deno.test("valor cheio igual ao praticado: desconta igual", () => {
  assertEquals(precoPromocionalCentavos(24800, 24800), ativa ? 19840 : 24800);
});

Deno.test("TRAVA: promoção nunca aumenta preço", () => {
  // Cheio R$ 610 mas a experiência já é vendida a R$ 400. Cheio - 20%
  // daria R$ 488 — mais CARO que o preço atual. Mantém os R$ 400.
  assertEquals(precoPromocionalCentavos(40000, 61000), 40000);
});

Deno.test("variação (sem valor cheio próprio) desconta sobre a opção", () => {
  assertEquals(precoPromocionalCentavos(30000, null), ativa ? 24000 : 30000);
});

Deno.test("valor cheio zerado/inválido cai no preço praticado", () => {
  assertEquals(precoPromocionalCentavos(18000, 0), ativa ? 14400 : 18000);
  assertEquals(precoPromocionalCentavos(18000, -1), ativa ? 14400 : 18000);
});

Deno.test("preço inválido volta intacto (não inventa cobrança)", () => {
  assertEquals(precoPromocionalCentavos(0, 61000), 0);
});

Deno.test("percentual configurado é o que manda", () => {
  const base = 100000;
  const esperado = ativa
    ? Math.round(base * (100 - PROMO.PERCENTUAL) / 100)
    : base;
  assertEquals(precoPromocionalCentavos(base, base), esperado);
});

Deno.test("janela de datas é coerente (início antes do fim)", () => {
  const ini = new Date(PROMO.INICIO).getTime();
  const fim = new Date(PROMO.FIM).getTime();
  assertEquals(Number.isFinite(ini) && Number.isFinite(fim), true);
  assertEquals(ini < fim, true);
});

Deno.test("precoLabelBR: centavos só quando existem de verdade", () => {
  assertEquals(precoLabelBR(48800), "R$ 488");
  assertEquals(precoLabelBR(19840), "R$ 198,40");
  assertEquals(precoLabelBR(110400), "R$ 1.104");
});
