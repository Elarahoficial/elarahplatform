// =============================================================
// ELARAH — Desconto geral (backend / o preço que é cobrado)
// -------------------------------------------------------------
// Percentual que vale pra TODAS as experiências durante uma janela de
// datas, configurado pela admin na aba "Desconto geral":
//
//     preço promocional = PREÇO DO SITE - percentual%
//
// A base é experiences.preco — o preço que estava no ar antes da
// campanha. É o que faz o banner ser verdade: anunciou 20%, cobra 20%
// a menos do que cobraria ontem.
//
// NÃO usamos valor_cheio_centavos como base: aquele campo é a
// referência riscada e a base do rateio com o fornecedor
// (computeFinancialBreakdown). Descontar sobre ele daria menos que o
// anunciado sempre que cheio > praticado.
//
// POR QUE ISSO EXISTE NO SERVIDOR: o preço cobrado nunca vem do
// cliente (ver booking_guard §5). Se só a vitrine aplicasse o
// desconto, o site anunciaria R$ 144 e o gateway cobraria R$ 180.
//
// FONTE DA VERDADE: public.desconto_geral (sql/elarah_desconto_geral.sql),
// a MESMA linha que o promo.js lê no navegador. Não há configuração
// duplicada — só a conta é que existe nos dois lados.
//
// SEM RESPOSTA DO BANCO = SEM DESCONTO: a vitrine faz igual, então os
// dois erram pro mesmo lado (preço cheio na tela, preço cheio na
// cobrança). O contrário seria cobrar mais do que foi anunciado.
// =============================================================

// deno-lint-ignore no-explicit-any
type Supabase = any;

export interface DescontoGeral {
  ativo: boolean;
  percentual: number;
  inicio: string | null;
  fim: string | null;
}

export const SEM_DESCONTO: DescontoGeral = {
  ativo: false,
  percentual: 0,
  inicio: null,
  fim: null,
};

// Cache por instância da function. Instâncias quentes atendem várias
// reservas seguidas; sem isto, toda cobrança faria um select a mais.
// TTL curto porque desligar a campanha no admin precisa valer agora.
const TTL_MS = 30_000;
let cache: { valor: DescontoGeral; em: number } | null = null;

export async function carregarDescontoGeral(
  supabase: Supabase,
): Promise<DescontoGeral> {
  const agora = Date.now();
  if (cache && agora - cache.em < TTL_MS) return cache.valor;

  try {
    const { data, error } = await supabase
      .from("desconto_geral")
      .select("ativo, percentual, inicio, fim")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      // Tabela ainda não migrada, ou leitura falhou. Reaproveita o
      // último valor conhecido (mesmo vencido) antes de desistir: numa
      // falha passageira, manter o desconto que a vitrine está
      // anunciando é melhor do que cobrar o preço cheio.
      console.error(
        "[Elarah Promo] falha ao ler desconto_geral:",
        error.message,
        cache ? "— usando último valor conhecido" : "— seguindo SEM desconto",
      );
      return cache?.valor ?? SEM_DESCONTO;
    }

    const pct = Number(data?.percentual);
    const valor: DescontoGeral = {
      percentual: Number.isFinite(pct) && pct > 0 && pct <= 90 ? Math.round(pct) : 0,
      ativo: data?.ativo === true,
      inicio: data?.inicio ?? null,
      fim: data?.fim ?? null,
    };
    cache = { valor, em: agora };
    return valor;
  } catch (e) {
    console.error("[Elarah Promo] exceção ao ler desconto_geral:", e);
    return cache?.valor ?? SEM_DESCONTO;
  }
}

// O desconto está valendo neste instante?
export function descontoAtivo(
  cfg: DescontoGeral | null | undefined,
  agora: Date = new Date(),
): boolean {
  if (!cfg || !cfg.ativo || !(cfg.percentual > 0)) return false;
  if (!cfg.inicio || !cfg.fim) return false;
  const ini = new Date(cfg.inicio).getTime();
  const fim = new Date(cfg.fim).getTime();
  const now = agora.getTime();
  if (!isFinite(ini) || !isFinite(fim) || !isFinite(now)) return false;
  return now >= ini && now <= fim;
}

// Preço unitário (em centavos) que deve ser COBRADO agora.
//   precoCents — preço do site da experiência, ou o da variação
//                escolhida (Individual/Dupla/kit), que é o preço dela.
//   cfg        — o que carregarDescontoGeral() devolveu.
// Fora da janela devolve o mesmo preço, sem tocar em nada.
export function precoPromocionalCentavos(
  precoCents: number,
  cfg: DescontoGeral | null | undefined,
): number {
  const praticado = Math.round(Number(precoCents));
  if (!isFinite(praticado) || praticado <= 0) return praticado;
  if (!descontoAtivo(cfg)) return praticado;

  const comDesconto = Math.round(praticado * (100 - cfg!.percentual) / 100);
  return comDesconto > 0 ? comDesconto : praticado;
}

// Centavos → rótulo "R$ 1.380,50" (centavos só quando existem de
// verdade). Usado pra reescrever o preco_label da reserva, que é o que
// aparece nos e-mails de confirmação.
export function precoLabelBR(cents: number): string {
  const n = Number(cents) / 100;
  if (!isFinite(n)) return "";
  const hasCents = n % 1 !== 0;
  return "R$ " + n.toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

// =============================================================
// DESCONTO DO CARRINHO (progressivo por quantidade)
// -------------------------------------------------------------
// Toda experiência colocada no carrinho sai com desconto:
//
//     1 pessoa          → 10% OFF
//     2 pessoas ou mais → 15% OFF em CADA pessoa
//
// Só o preço da EXPERIÊNCIA desconta. A taxa do cartão (gross-up da
// parcela no Pagar.me / repasse no Mercado Pago) é calculada DEPOIS,
// em cima do valor já descontado — ela continua sendo cobrada. Frete
// e kits físicos (fluxo com `shipping`) não entram.
//
// NÃO ACUMULA com o desconto geral: com uma campanha no ar, vale a
// campanha (é o preço que a vitrine inteira está anunciando). Assim a
// conta da tela e a do servidor partem sempre do mesmo preço.
//
// A MESMA REGRA EXISTE NO NAVEGADOR: promo.js (ElarahPromo.carrinho*).
// As duas precisam concordar — o servidor é quem cobra.
// =============================================================
export const DESCONTO_CARRINHO_1_PCT = 10;
export const DESCONTO_CARRINHO_2_MAIS_PCT = 15;

export function descontoCarrinhoPct(quantidade: number): number {
  const q = Math.floor(Number(quantidade));
  if (!Number.isFinite(q) || q < 1) return 0;
  return q >= 2 ? DESCONTO_CARRINHO_2_MAIS_PCT : DESCONTO_CARRINHO_1_PCT;
}

// Preço unitário (centavos) com o desconto do carrinho. Chamar com o
// preço JÁ resolvido (site ou variação) e SÓ quando o desconto geral
// não estiver no ar — ver precoFinalCentavos.
export function precoCarrinhoCentavos(
  precoCents: number,
  quantidade: number,
): number {
  const praticado = Math.round(Number(precoCents));
  if (!isFinite(praticado) || praticado <= 0) return praticado;
  const pct = descontoCarrinhoPct(quantidade);
  if (!pct) return praticado;
  const comDesconto = Math.round(praticado * (100 - pct) / 100);
  return comDesconto > 0 ? comDesconto : praticado;
}

// O preço unitário que é COBRADO: campanha geral quando está no ar,
// senão o desconto do carrinho pela quantidade.
export function precoFinalCentavos(
  precoCents: number,
  cfg: DescontoGeral | null | undefined,
  quantidade: number,
): { cents: number; origem: "geral" | "carrinho" | null; pct: number } {
  if (descontoAtivo(cfg)) {
    const cents = precoPromocionalCentavos(precoCents, cfg);
    return { cents, origem: cents !== Math.round(Number(precoCents)) ? "geral" : null, pct: cfg!.percentual };
  }
  const cents = precoCarrinhoCentavos(precoCents, quantidade);
  const mudou = cents !== Math.round(Number(precoCents));
  return { cents, origem: mudou ? "carrinho" : null, pct: mudou ? descontoCarrinhoPct(quantidade) : 0 };
}
