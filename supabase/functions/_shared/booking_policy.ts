// =============================================================
// ELARAH — Prazos de remarcação e cancelamento
// -------------------------------------------------------------
// Duas regras DIFERENTES, que não devem ser misturadas:
//
//   REMARCAR SEM CUSTO — prazo por categoria, porque o preparo do
//   fornecedor é diferente (bartenderia compra insumo perecível com
//   bastante antecedência):
//     Bartenderia .......... 5 dias
//     Gastronomia .......... 72 horas
//     Todas as demais ...... 48 horas
//
//   CANCELAR COM REEMBOLSO — 48 horas pra todas as categorias.
//
// Ambas estão publicadas em /cancelamento.html.
//
// ATENÇÃO — a tabela de remarcação existe DUAS vezes: aqui (Deno, pro
// e-mail de confirmação) e em experiences-data.js (navegador, pro
// checkout). Deno não importa o arquivo do site, então não dá pra ter
// fonte única. Mudou aqui, muda lá. As duas trazem este mesmo aviso.
//
// Na prática o e-mail quase nunca cai nesta tabela: o prazo é
// CONGELADO em metadata.politica_remarcacao_horas no momento da compra
// e o template lê de lá, pra que uma mudança de regra não reescreva o
// que a cliente aceitou. A tabela serve pra reservas antigas (feitas
// antes deste campo existir) e como referência única do que vale hoje.
// =============================================================

export interface PrazoRemarcacao {
  horas: number;
  rotulo: string;
}

const PRAZO_POR_CATEGORIA: Record<string, PrazoRemarcacao> = {
  bartenderia: { horas: 120, rotulo: "5 dias" },
  gastronomia: { horas: 72, rotulo: "72 horas" },
};

export const PRAZO_REMARCACAO_PADRAO: PrazoRemarcacao = {
  horas: 48,
  rotulo: "48 horas",
};

// Prazo de cancelamento COM REEMBOLSO — igual pra todas as categorias.
export const PRAZO_CANCELAMENTO: PrazoRemarcacao = {
  horas: 48,
  rotulo: "48 horas",
};

// Uma experiência pode estar em mais de uma categoria ("Barismo |
// Bartenderia"). Nesse caso vale o prazo MAIS LONGO: se uma das
// parceiras precisa de 5 dias, avisar 48h faria a cliente achar que dá
// tempo quando não dá.
export function prazoRemarcacaoPorCategoria(
  categoria: string | null | undefined,
): PrazoRemarcacao {
  if (!categoria) return PRAZO_REMARCACAO_PADRAO;
  let escolhido = PRAZO_REMARCACAO_PADRAO;
  for (const parte of String(categoria).split("|")) {
    const p = PRAZO_POR_CATEGORIA[parte.trim().toLowerCase()];
    if (p && p.horas > escolhido.horas) escolhido = p;
  }
  return escolhido;
}

// Converte o prazo congelado na reserva de volta pra rótulo exibível.
// Reserva antiga (sem o campo) cai no padrão de 48h, que é a regra
// geral — nunca inventa um prazo mais curto do que o real.
export function rotuloDoPrazo(horas: unknown): string {
  const n = Number(horas);
  if (!Number.isFinite(n) || n <= 0) return PRAZO_REMARCACAO_PADRAO.rotulo;
  if (n % 24 === 0 && n >= 96) return String(n / 24) + " dias";
  return String(Math.round(n)) + " horas";
}
