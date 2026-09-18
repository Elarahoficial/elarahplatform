/* =====================================================================
   promo.js — DESCONTO GERAL DO SITE (fonte única do navegador)
   ---------------------------------------------------------------------
   Um percentual que vale pra TODAS as experiências ao mesmo tempo,
   com validade. Enquanto a janela estiver aberta:

     preço promocional = PREÇO DO SITE - PERCENTUAL%

   A base é o preço que está no ar (experiences.preco) — o mesmo que a
   cliente vê antes da campanha. É o que faz o banner ser verdade:
   anunciou 20%, ela paga 20% a menos do que pagaria ontem.

   QUEM MANDA É O ADMIN: a configuração (ativo, percentual, início,
   fim, textos) mora na tabela public.desconto_geral e é editada na aba
   "Desconto geral" do painel. Nada aqui é chumbado — sem o banco, ou
   com a linha desligada, o site simplesmente não dá desconto nenhum.

   POR QUE O PADRÃO É "SEM DESCONTO": se a leitura do banco falhar, a
   vitrine mostra o preço cheio e o servidor cobra o preço cheio. Os
   dois erram pro mesmo lado. O contrário — vitrine anunciando 20% que
   a cobrança não honra — seria propaganda enganosa.

   ORDEM DE CARREGAMENTO: quem desenha preço espera por carregar().
   O experiences-data.js faz isso dentro do próprio load do catálogo,
   então nenhuma tela pinta preço antes do desconto ser conhecido.

   ATENÇÃO — A MESMA REGRA EXISTE NO BACKEND:
   supabase/functions/_shared/promo.ts lê a MESMA tabela e recalcula o
   preço na hora de cobrar (o preço nunca vem do cliente). As duas
   implementações precisam concordar na conta; a configuração, essa
   sim, é uma só — o banco.
   ===================================================================== */
(function (window) {
  'use strict';

  // Tabela de linha única com a configuração (sql/elarah_desconto_geral.sql).
  var TABELA = 'desconto_geral';

  // Estado efetivo. Começa desligado: sem resposta do banco, sem
  // desconto — nem na tela, nem na cobrança.
  var CONFIG = {
    ATIVA: false,
    PERCENTUAL: 0,
    INICIO: null,
    FIM: null,
    TITULO: null,
    SUBTITULO: null,
  };

  var carregado = false;
  var carregarPromise = null;

  // Lê a configuração do banco. Idempotente: várias chamadas
  // simultâneas compartilham a mesma promise (o catálogo, o banner e
  // a página de detalhe chamam quase ao mesmo tempo).
  function carregar() {
    if (carregarPromise) return carregarPromise;
    carregarPromise = (async function () {
      try {
        var s = window.supabaseClient;
        if (!s && window.ElarahSupabase && typeof window.ElarahSupabase.waitClient === 'function') {
          s = await window.ElarahSupabase.waitClient(8000);
        }
        if (!s) {
          console.info('[Elarah Promo] Supabase indisponível — sem desconto geral.');
          return CONFIG;
        }
        var res = await s.from(TABELA).select('*').eq('id', 1).maybeSingle();
        if (res.error) {
          // Tabela ainda não migrada (sql/elarah_desconto_geral.sql) ou
          // erro de leitura: segue sem desconto.
          console.warn('[Elarah Promo] não foi possível ler o desconto geral:', res.error.message);
          return CONFIG;
        }
        if (res.data) aplicarLinha(res.data);
      } catch (e) {
        console.warn('[Elarah Promo] exceção ao ler o desconto geral:', e);
      } finally {
        carregado = true;
      }
      return CONFIG;
    })();
    return carregarPromise;
  }

  // Row do banco → CONFIG. Tolerante: qualquer campo inválido
  // simplesmente não liga o desconto.
  function aplicarLinha(row) {
    var pct = Number(row.percentual);
    CONFIG.PERCENTUAL = (isFinite(pct) && pct > 0 && pct <= 90) ? Math.round(pct) : 0;
    CONFIG.ATIVA = row.ativo === true && CONFIG.PERCENTUAL > 0;
    CONFIG.INICIO = row.inicio || null;
    CONFIG.FIM = row.fim || null;
    CONFIG.TITULO = (row.titulo && String(row.titulo).trim()) || null;
    CONFIG.SUBTITULO = (row.subtitulo && String(row.subtitulo).trim()) || null;
  }

  // Data final formatada pra usar em texto ("20/09").
  function fimCurto() {
    if (!CONFIG.FIM) return '';
    var d = new Date(CONFIG.FIM);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0');
  }

  // O desconto está valendo AGORA? Datas inválidas ou faltando
  // desligam (falha pro lado seguro: preço normal).
  function ativa() {
    if (!CONFIG.ATIVA || !CONFIG.PERCENTUAL) return false;
    if (!CONFIG.INICIO || !CONFIG.FIM) return false;
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

  // Textos do aviso. O admin pode escrever os dele nos campos de texto
  // da aba "Desconto geral"; vazio = o site monta sozinho a partir do
  // percentual e da data de fim, que é o que a maioria das campanhas
  // precisa.
  function tituloDoAviso() {
    return CONFIG.TITULO || (CONFIG.PERCENTUAL + '% OFF em todas as experiências');
  }

  function subtituloDoAviso() {
    if (CONFIG.SUBTITULO) return CONFIG.SUBTITULO;
    var dia = fimCurto();
    return dia ? ('Só até ' + dia) : '';
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
    titulo.textContent = tituloDoAviso();
    titulo.style.cssText = 'font-weight:800;';

    var sub = document.createElement('span');
    sub.textContent = subtituloDoAviso();
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
    // Carrega a configuração do banco. Quem desenha preço DEVE esperar
    // por esta promise antes de pintar qualquer valor na tela.
    carregar: carregar,
    carregado: function () { return carregado; },
    ativa: ativa,
    percentual: function () { return CONFIG.PERCENTUAL; },
    centavos: centavos,
    label: label,
    itensComDesconto: itensComDesconto,
    formatar: formatar,
    paraCentavos: paraCentavos,
    fimCurto: fimCurto,
  };

  // O aviso só pode ser desenhado depois de saber se existe desconto —
  // e o body precisa existir pra receber a barra.
  function iniciar() {
    carregar().then(renderBanner).catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})(window);
