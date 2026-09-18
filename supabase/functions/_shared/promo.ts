// =============================================================
// ELARAH — PROMOÇÃO SAZONAL (backend / fonte única do servidor)
// -------------------------------------------------------------
// Desconto que vale pra TODAS as experiências durante uma janela de
// datas, sem mexer no preço cadastrado de cada uma:
//
//     preço promocional = VALOR CHEIO - PERCENTUAL%
//
// O valor cheio é experiences.valor_cheio_centavos (o mesmo que o site
// já mostrava riscado). Quando não está cadastrado — By Elarah, onde
// cheio == praticado — a base é o próprio preço praticado.
//
// TRAVA DE SEGURANÇA: o preço promocional NUNCA sobe. Experiência já
// vendida abaixo de "cheio - PERCENTUAL%" mantém o preço menor.
//
// POR QUE ISSO VIVE NO SERVIDOR TAMBÉM: o preço cobrado nunca vem do
// cliente (ver booking_guard §5). Se só a vitrine aplicasse o
// desconto, o site anunciaria R$ 144 e o gateway cobraria R$ 180.
//
// ATENÇÃO — ESTE ARQUIVO TEM UM GÊMEO NO SITE: /promo.js (navegador).
// Deno não importa o JS do site, então não dá pra ter fonte única. As
// duas implementações precisam concordar no percentual E na janela de
// datas. MUDOU AQUI, MUDA LÁ. As duas trazem este mesmo aviso.
//
// PRA DESLIGAR: ATIVA = false nos dois arquivos (ou deixar FIM passar,
// que desliga sozinho).
// =============================================================

export const PROMO = {
  ATIVA: true,
  PERCENTUAL: 20,
  // Janela em horário de Brasília (UTC-3).
  INICIO: "2026-09-18T00:00:00-03:00",
  FIM: "2026-09-27T23:59:59-03:00",
} as const;

export function promoAtiva(agora: Date = new Date()): boolean {
  if (!PROMO.ATIVA) return false;
  const ini = new Date(PROMO.INICIO).getTime();
  const fim = new Date(PROMO.FIM).getTime();
  const now = agora.getTime();
  if (!isFinite(ini) || !isFinite(fim) || !isFinite(now)) return false;
  return now >= ini && now <= fim;
}

// Preço unitário (em centavos) que deve ser COBRADO hoje.
//   precoCents      — preço praticado da experiência (ou da variação)
//   valorCheioCents — valor cheio cadastrado; null quando não existe
//                     (variações e By Elarah) → a base vira o praticado
// Fora da janela da promoção devolve o praticado, sem tocar em nada.
export function precoPromocionalCentavos(
  precoCents: number,
  valorCheioCents?: number | null,
): number {
  const praticado = Math.round(Number(precoCents));
  if (!isFinite(praticado) || praticado <= 0) return praticado;
  if (!promoAtiva()) return praticado;

  const cheioRaw = Number(valorCheioCents);
  const cheio = isFinite(cheioRaw) && cheioRaw > 0 ? Math.round(cheioRaw) : 0;
  // Base do desconto: valor cheio quando é maior que o praticado;
  // senão o praticado (que ali JÁ é o valor cheio).
  const base = cheio > praticado ? cheio : praticado;

  const comDesconto = Math.round(base * (100 - PROMO.PERCENTUAL) / 100);
  if (comDesconto <= 0) return praticado;
  // TRAVA: promoção nunca aumenta preço.
  return Math.min(comDesconto, praticado);
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
