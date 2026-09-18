/* =====================================================================
   promo.js — PROMOÇÃO SAZONAL ELARAH (fonte única do navegador)
   ---------------------------------------------------------------------
   Um desconto que vale pra TODAS as experiências ao mesmo tempo, sem
   precisar mexer no preço de cada uma no admin. Enquanto a janela
   estiver aberta:

     preço promocional = VALOR CHEIO - PERCENTUAL%

   O valor cheio é o `valor_cheio_centavos` da experiência (o mesmo que
   já aparecia riscado no card). Quando ele não está cadastrado — caso
   das By Elarah, onde cheio == praticado — a base é o próprio preço
   praticado, que ali é o valor cheio de fato.

   TRAVA DE SEGURANÇA: o preço promocional NUNCA sobe. Se uma
   experiência já é vendida com desconto maior que o da promoção
   (ex.: cheio R$ 610 vendido a R$ 400, e 20% do cheio daria R$ 488),
   ela mantém o preço menor. Promoção que aumenta preço não é promoção.

   ATENÇÃO — ESTE ARQUIVO TEM UM GÊMEO NO BACKEND:
   supabase/functions/_shared/promo.ts. O Deno não importa JS do site,
   então não dá pra ter fonte única de verdade. As duas implementações
   precisam concordar no percentual e na janela de datas, senão a
   vitrine mostra um valor e o checkout cobra outro. MUDOU AQUI, MUDA
   LÁ. As duas trazem este mesmo aviso.

   PRA DESLIGAR A PROMOÇÃO: basta ATIVA = false aqui e em promo.ts
   (ou deixar a data FIM passar — ela desliga sozinha).
   ===================================================================== */
(function (window) {
  'use strict';

  // ----- Configuração da campanha -----
  var CONFIG = {
    // Liga/desliga geral. Com false, o site volta ao comportamento
    // normal (preço praticado) sem precisar remover nada.
    ATIVA: true,
    // Percentual de desconto sobre o valor cheio.
    PERCENTUAL: 20,
    // Janela de validade (horário de Brasília). Fora dela o desconto
    // não vale — nem na vitrine, nem no checkout.
    INICIO: '2026-09-18T00:00:00-03:00',
    FIM: '2026-09-27T23:59:59-03:00',
    // Textos do aviso no topo do site.
    TITULO: '20% OFF em todas as experiências',
    SUBTITULO: 'Desconto sobre o valor cheio · até 27/09',
  };

  // Data final formatada pra usar em texto ("27/09").
  function fimCurto() {
    var d = new Date(CONFIG.FIM);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0');
  }

  // A promoção está valendo AGORA? Datas inválidas desligam o desconto
  // (falha pro lado seguro: preço normal).
  function ativa() {
    if (!CONFIG.ATIVA) return false;
    var agora = Date.now();
    var ini = new Date(CONFIG.INICIO).getTime();
    var fim = new Date(CONFIG.FIM).getTime();
    if (isNaN(ini) || isNaN(fim)) return false;
    return agora >= ini && agora <= fim;
  }

  // Aplica o desconto sobre um valor em centavos. Devolve null pra
  // entrada inválida — quem chama decide o fallback.
  function centavos(base) {
    var n = Number(base);
    if (!isFinite(n) || n <= 0) return null;
    if (!ativa()) return Math.round(n);
    return Math.round(n * (100 - CONFIG.PERCENTUAL) / 100);
  }

  // "R$ 180" → 18000. Mesmo parser do formatPrecoBR (formato BR:
  // vírgula é decimal, ponto é milhar).
  function paraCentavos(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!s) return null;
    var match = s.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*$/);
    if (!match) return null;
    var clean = match[1].replace(/\./g, '').replace(/\s+/g, '').replace(',', '.');
    var n = parseFloat(clean);
    if (!isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }

  // Aplica o desconto num RÓTULO de preço e devolve outro rótulo:
  // "R$ 180" → "R$ 144". Usado nos preços de variação (Individual,
  // Dupla, Trio...), que não têm valor cheio próprio — ali a base do
  // desconto é o preço da própria opção.
  // Texto sem número ("Sob consulta") volta intacto.
  function label(raw) {
    if (!ativa()) return raw;
    var base = paraCentavos(raw);
    if (!base) return raw;
    var com = centavos(base);
    if (!com) return raw;
    return formatar(com);
  }

  // Centavos → "R$ 1.380,50" (centavos só quando existem de verdade).
  function formatar(cents) {
    var n = Number(cents) / 100;
    if (!isFinite(n)) return '';
    var hasCents = n % 1 !== 0;
    return 'R$ ' + n.toLocaleString('pt-BR', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  // Copia uma lista de variações (Individual/Dupla/Trio, kits...)
  // aplicando o desconto no preço de cada opção. Variação não tem
  // valor cheio próprio, então a base é o preço da própria opção.
  //
  // Devolve SEMPRE uma cópia: a lista original (exp.variantItems) é o
  // dado de cadastro que o admin edita e grava no banco — se a gente
  // mexesse nela, um salvar no admin gravaria o preço promocional como
  // preço oficial e o desconto viraria permanente.
  function itensComDesconto(items) {
    if (!Array.isArray(items)) return [];
    if (!ativa()) return items.slice();
    return items.map(function (it) {
      if (!it || typeof it !== 'object') return it;
      var copia = {};
      for (var k in it) { if (Object.prototype.hasOwnProperty.call(it, k)) copia[k] = it[k]; }
      if (copia.preco && String(copia.preco).trim()) copia.preco = label(copia.preco);
      return copia;
    });
  }

  // ===== Aviso no topo do site =====
  // Injetado por JS em vez de copiado no HTML de 50+ páginas: quando a
  // promoção acabar, some de tudo de uma vez.
  function renderBanner() {
    if (!ativa()) return;
    if (document.getElementById('elarah-promo-bar')) return;
    // Páginas internas (admin) não recebem o aviso.
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('admin') !== -1) return;

    var bar = document.createElement('div');
    bar.id = 'elarah-promo-bar';
    bar.setAttribute('role', 'status');
    bar.style.cssText = [
      'background:linear-gradient(90deg,#f0a05e,#e2833c)',
      'color:#fff',
      'text-align:center',
      'padding:9px 16px',
      'font-family:inherit',
      'font-size:.84rem',
      'line-height:1.35',
      'font-weight:600',
      'letter-spacing:.2px',
      'position:relative',
      'z-index:101',
    ].join(';');

    var titulo = document.createElement('strong');
    titulo.textContent = CONFIG.TITULO;
    titulo.style.cssText = 'font-weight:800;';

    var sub = document.createElement('span');
    sub.textContent = CONFIG.SUBTITULO;
    sub.style.cssText = 'font-weight:500;opacity:.92;margin-left:8px;';

    bar.appendChild(titulo);
    bar.appendChild(sub);

    // Vai como primeiro elemento do body: o header é sticky (não
    // fixed), então a barra rola pra fora e o header continua colando
    // no topo normalmente.
    if (document.body.firstChild) {
      document.body.insertBefore(bar, document.body.firstChild);
    } else {
      document.body.appendChild(bar);
    }
  }

  window.ElarahPromo = {
    CONFIG: CONFIG,
    ativa: ativa,
    percentual: function () { return CONFIG.PERCENTUAL; },
    centavos: centavos,
    label: label,
    itensComDesconto: itensComDesconto,
    formatar: formatar,
    paraCentavos: paraCentavos,
    fimCurto: fimCurto,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBanner);
  } else {
    renderBanner();
  }

})(window);
