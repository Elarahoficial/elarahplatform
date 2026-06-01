// =============================================================
// ELARAH — Financial breakdown (mapa financeiro da reserva)
// -------------------------------------------------------------
// Calcula como o valor cheio da experiência é dividido entre N
// fornecedores e a comissão da Elarah. Usado por
// create-checkout-session e create-mp-pix-payment pra que ambos
// fluxos (Stripe / PIX) sejam idênticos.
//
// Modelo:
//   - Cada fornecedor tem share_type ('percent' ou 'fixed') +
//     share_value. 'percent' = % do valor cheio; 'fixed' = centavos.
//   - Comissão Elarah: opcional/manual (type+value) ou residual
//     automático (sobra depois de pagar fornecedores).
//
// Compatibilidade:
//   - Se a experiência ainda usa o modelo legado (1 fornecedor +
//     percentual_repasse em experiences), passa fallback no campo
//     `legacy` e essa função monta um SupplierRow virtual.
//   - Bookings antigas (sem repasses[]) continuam funcionando — o
//     painel de fornecedores do admin lê os campos legados também.
// =============================================================

export interface SupplierRow {
  fornecedor_nome: string;
  share_type: "percent" | "fixed";
  share_value: number;
  ordem?: number;
  notas?: string | null;
}

export interface Repasse {
  fornecedor_nome: string;
  share_type: "percent" | "fixed";
  share_value: number;
  valor_centavos: number;
}

export interface FinancialBreakdown {
  repasses: Repasse[];
  totalRepasseCentavos: number;
  comissaoCentavos: number;
  fornecedorPrincipal: string | null;
  // True quando o cálculo caiu no legado (experience sem rows em
  // experience_suppliers). Útil pra logs/debug.
  usedLegacyFallback: boolean;
}

export interface ComissaoConfig {
  type: string | null | undefined;
  value: number | null | undefined;
}

export interface LegacyConfig {
  fornecedorNome: string | null | undefined;
  percentualRepasse: number | null | undefined;
  // Quando preenchido (em centavos), eh valor FIXO POR PESSOA que vai
  // pro fornecedor e sobrescreve percentualRepasse. O caller eh quem
  // multiplica por qty antes de passar valorCheioCentavos — entao aqui
  // tratamos o fixo tambem como valor TOTAL (caller multiplicou).
  valorRepasseFixoCentavos?: number | null | undefined;
}

export function computeFinancialBreakdown(
  valorCheioCentavos: number,
  suppliers: SupplierRow[] | null | undefined,
  comissao: ComissaoConfig,
  legacy: LegacyConfig,
): FinancialBreakdown {
  const valorCheio = Number.isFinite(valorCheioCentavos)
    ? Math.max(0, Math.round(valorCheioCentavos))
    : 0;

  // Fonte de fornecedores: novo modelo se houver rows; senão, legado.
  let supplierList: SupplierRow[] = Array.isArray(suppliers)
    ? suppliers.filter((s) => s && s.fornecedor_nome)
    : [];
  let usedLegacyFallback = false;

  if (supplierList.length === 0 && legacy && legacy.fornecedorNome) {
    usedLegacyFallback = true;
    // Prioridade: valor fixo (já total, multiplicado por qty antes)
    // sobrescreve percentual quando preenchido.
    const fixoRaw = legacy.valorRepasseFixoCentavos;
    if (fixoRaw != null && Number.isFinite(Number(fixoRaw)) && Number(fixoRaw) >= 0) {
      supplierList = [{
        fornecedor_nome: String(legacy.fornecedorNome),
        share_type: "fixed",
        share_value: Number(fixoRaw),
        ordem: 0,
      }];
    } else {
      const pct = Number(legacy.percentualRepasse);
      supplierList = [{
        fornecedor_nome: String(legacy.fornecedorNome),
        share_type: "percent",
        share_value: Number.isFinite(pct) ? pct : 70,
        ordem: 0,
      }];
    }
  }

  // Calcula valor de cada repasse e total.
  const repasses: Repasse[] = [];
  let totalRepasse = 0;
  for (const s of supplierList) {
    const sv = Number(s.share_value) || 0;
    const valor = s.share_type === "percent"
      ? Math.round(valorCheio * (sv / 100))
      : Math.round(sv);
    repasses.push({
      fornecedor_nome: s.fornecedor_nome,
      share_type: s.share_type,
      share_value: sv,
      valor_centavos: valor,
    });
    totalRepasse += valor;
  }

  // Comissão Elarah:
  //   - 'percent' + value → % do valor cheio
  //   - 'fixed' + value → centavos diretos
  //   - null/undefined → residual = max(0, valorCheio - totalRepasse)
  let comissaoCentavos = 0;
  const cType = comissao && comissao.type;
  const cValueRaw = comissao && comissao.value;
  if (cType === "percent" && cValueRaw != null && cValueRaw !== "") {
    const v = Number(cValueRaw);
    if (Number.isFinite(v)) {
      comissaoCentavos = Math.round(valorCheio * (v / 100));
    }
  } else if (cType === "fixed" && cValueRaw != null && cValueRaw !== "") {
    const v = Number(cValueRaw);
    if (Number.isFinite(v)) comissaoCentavos = Math.round(v);
  } else {
    comissaoCentavos = Math.max(0, valorCheio - totalRepasse);
  }

  return {
    repasses,
    totalRepasseCentavos: totalRepasse,
    comissaoCentavos,
    fornecedorPrincipal: supplierList[0]?.fornecedor_nome ?? null,
    usedLegacyFallback,
  };
}
