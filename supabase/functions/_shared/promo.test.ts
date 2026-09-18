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

Deno.test("20% sobre o preço do site — o que o banner promete", () => {
  assertEquals(precoPromocionalCentavos(18000), ativa ? 14400 : 18000);
  assertEquals(precoPromocionalCentavos(61000), ativa ? 48800 : 61000);
});

Deno.test("valor cheio NÃO entra na conta (senão o 20% viraria 11%)", () => {
  // Experiência de cheio R$ 610 vendida a R$ 549: a cliente paga 20% em
  // cima dos R$ 549 que ela via no site, não em cima dos R$ 610.
  assertEquals(precoPromocionalCentavos(54900), ativa ? 43920 : 54900);
});

Deno.test("variação (Individual/Dupla/kit) desconta sobre o preço da opção", () => {
  assertEquals(precoPromocionalCentavos(30000), ativa ? 24000 : 30000);
});

Deno.test("preço que quebra em centavos", () => {
  assertEquals(precoPromocionalCentavos(26100), ativa ? 20880 : 26100);
});

Deno.test("preço inválido volta intacto (não inventa cobrança)", () => {
  assertEquals(precoPromocionalCentavos(0), 0);
  assertEquals(precoPromocionalCentavos(-1), -1);
});

Deno.test("desconto nunca zera a cobrança", () => {
  // 1 centavo × 0,8 arredonda pra 1 — nunca pra 0, que viraria reserva
  // grátis silenciosa.
  assertEquals(precoPromocionalCentavos(1), 1);
});

Deno.test("percentual configurado é o que manda", () => {
  const base = 100000;
  assertEquals(
    precoPromocionalCentavos(base),
    ativa ? Math.round(base * (100 - PROMO.PERCENTUAL) / 100) : base,
  );
});

Deno.test("janela de datas é coerente (início antes do fim)", () => {
  const ini = new Date(PROMO.INICIO).getTime();
  const fim = new Date(PROMO.FIM).getTime();
  assertEquals(Number.isFinite(ini) && Number.isFinite(fim), true);
  assertEquals(ini < fim, true);
});

Deno.test("precoLabelBR: centavos só quando existem de verdade", () => {
  assertEquals(precoLabelBR(48800), "R$ 488");
  assertEquals(precoLabelBR(43920), "R$ 439,20");
  assertEquals(precoLabelBR(110400), "R$ 1.104");
});
