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

// =============================================================
// Backfill financeiro (rede de segurança dos webhooks)
// -------------------------------------------------------------
// Quando o pre-insert do checkout não gravou os campos financeiros,
// o webhook recalcula a partir da experiência. A regra é a MESMA do
// admin e da trigger do banco:
//   base    = valor cheio × qtd  (NUNCA o valor pago: ele muda com a
//             taxa/gross-up do cartão, com cupom e com gift card — e o
//             repasse não pode mudar por causa do meio de pagamento)
//   repasse = valor_repasse_fixo_centavos × qtd
//             OU base × percentual_repasse/100  (default 70%)
//   comissão= comissao_type/comissao_value cadastrados
//             OU 20% da base (padrão Elarah)
// Antes cada webhook usava 70/20 fixo, ignorando o percentual da
// parceira — duas reservas da mesma experiência podiam sair com
// repasses diferentes dependendo de qual caminho preencheu o campo.
// =============================================================

export interface BackfillExperience {
  valor_cheio_centavos?: number | null;
  percentual_repasse?: number | string | null;
  valor_repasse_fixo_centavos?: number | null;
  comissao_type?: string | null;
  comissao_value?: number | string | null;
}

export interface BackfillValues {
  valorCheioTotal: number | null;
  valorRepasse: number | null;
  valorComissao: number | null;
}

export function computeBackfillValues(
  exp: BackfillExperience | null | undefined,
  quantidade: number | null | undefined,
): BackfillValues {
  const qty = Math.max(1, Math.floor(Number(quantidade) || 1));
  const cheioUnit = Number(exp?.valor_cheio_centavos);
  const base = Number.isFinite(cheioUnit) && cheioUnit > 0 ? cheioUnit * qty : null;
  if (base == null) {
    return { valorCheioTotal: null, valorRepasse: null, valorComissao: null };
  }

  const fixo = Number(exp?.valor_repasse_fixo_centavos);
  let valorRepasse: number;
  if (exp?.valor_repasse_fixo_centavos != null && Number.isFinite(fixo) && fixo >= 0) {
    valorRepasse = Math.round(fixo) * qty;
  } else {
    const pct = Number(exp?.percentual_repasse);
    valorRepasse = Math.round(base * ((Number.isFinite(pct) ? pct : 70) / 100));
  }

  const cValue = Number(exp?.comissao_value);
  let valorComissao: number;
  if (exp?.comissao_type === "percent" && Number.isFinite(cValue)) {
    valorComissao = Math.round(base * (cValue / 100));
  } else if (exp?.comissao_type === "fixed" && Number.isFinite(cValue)) {
    valorComissao = Math.round(cValue);
  } else {
    valorComissao = Math.round(base * 0.20);
  }

  return { valorCheioTotal: base, valorRepasse, valorComissao };
}
