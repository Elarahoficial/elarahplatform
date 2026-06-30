// =============================================================
// ELARAH — Elarah em Casa (Kits de experiência DIY)
// -------------------------------------------------------------
// Reaproveita o pipeline de experiências (experiences-data.js) e
// renderiza na vitrine os itens marcados como kit/DIY/em casa.
// Match tolerante por nome OU categoria — a admin só precisa
// escrever algo como "Kit Vela DIY" ou usar a categoria "Kit em
// casa" pro produto aparecer aqui (sem precisar de campo novo).
//
// Os banners de coleção (.ec-collection[data-colecao]) e os atalhos
// por tipo (.ec-type[data-tipo]) filtram a vitrine no cliente por
// palavra-chave. Enquanto não houver produtos, mostra placeholder.
// =============================================================
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, ''); // remove acentos
  }

  // Casa "kit", "diy", "faça você mesmo", "em casa"
  // "em casa" exige palavra inteira (\b) — senão "Bem Casado" (b-em-casa-do)
  // cai aqui por engano e não há como tirar pelo admin.
  function isCasaKit(exp) {
    if (!exp) return false;
    var hay = norm((exp.nome || '') + ' ' + (exp.categoria || ''));
    return hay.indexOf('kit') !== -1
        || hay.indexOf('diy') !== -1
        || hay.indexOf('faca voce mesmo') !== -1
        || /\bem casa\b/.test(hay);
  }

  // Mapa de palavras-chave por tipo/coleção pros filtros do cliente.
  var FILTERS = {
    // tipos
    velas:    ['vela', 'aroma', 'difusor'],
    chas:     ['cha', 'infus', 'tea'],
    ceramica: ['ceram', 'argila', 'barro'],
    pintura:  ['pintura', 'tela', 'aquarela', 'pincel'],
    fios:     ['macrame', 'tufting', 'bordado', 'trico', 'la '],
    banho:    ['sabonete', 'banho', 'sais', 'pele', 'autocuidado'],
    // coleções por intenção
    ritual:   ['ritual', 'noite', 'dormir'],
    casulo:   ['casulo', 'inverno', 'aconchego'],
    'a-dois': ['casal', 'dois', 'date', 'namorad', 'amor']
  };

  var _allKits = [];   // cache dos kits carregados

  function renderEmpty(grid, custom) {
    grid.innerHTML =
      '<div class="ec-empty">' +
        '<div style="font-size:2.4rem;margin-bottom:14px;">🕯️</div>' +
        '<h3 style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:#2c211a;margin:0 0 10px;font-weight:400;">' +
          esc(custom && custom.title ? custom.title : 'Chegando em casa') + '</h3>' +
        '<p style="color:#6a584a;font-size:.95rem;max-width:440px;margin:0 auto;line-height:1.55;">' +
          (custom && custom.text ? esc(custom.text) :
            'Os kits Elarah em Casa estão sendo finalizados com todo o carinho. Enquanto isso, ') +
          (custom && custom.text ? '' :
            '<a href="categoria.html" style="color:#b9764f;font-weight:600;text-decoration:underline;">explore as experiências presenciais</a>.') +
        '</p>' +
      '</div>';
  }

  function renderError(grid, msg) {
    grid.innerHTML =
      '<div class="ec-error">' +
        '<p style="color:#a4332b;font-size:.9rem;margin:0 0 10px;">Não foi possível carregar os kits agora.</p>' +
        '<p style="color:#888;font-size:.78rem;margin:0;">' + esc(msg || '') + '</p>' +
        '<a href="categoria.html" style="display:inline-block;margin-top:14px;color:#b9764f;font-weight:600;text-decoration:underline;">Explore as experiências</a>' +
      '</div>';
  }

  function renderCard(e) {
    var img = e.imagem
      ? '<img src="' + esc(e.imagem) + '" alt="' + esc(e.nome) + '" loading="lazy">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#b9764f;font-family:\'DM Serif Display\',serif;font-size:2rem;">🕯️</div>';

    var preco = e.preco
      ? esc(window.ElarahData && typeof window.ElarahData.formatPrecoBR === 'function'
          ? window.ElarahData.formatPrecoBR(e.preco) : e.preco)
      : '';
    var titulo = String(e.nome || '').trim() || 'Kit Elarah em Casa';

    var descTrunc = '';
    if (e.descricao) {
      var d = String(e.descricao).replace(/\s+/g, ' ').trim();
      if (d.length > 110) {
        var cut = d.slice(0, 110);
        var lastSpace = cut.lastIndexOf(' ');
        if (lastSpace > 70) cut = cut.slice(0, lastSpace);
        d = cut.replace(/[\s,;:.!?\-–—]+$/, '') + '…';
      }
      descTrunc = d;
    }

    var detailUrl = '/experiencia.html?id=' + encodeURIComponent(e.id || '');

    return '' +
      '<article class="ec-card">' +
        '<div class="ec-card__image">' +
          img +
          '<span class="ec-card__badge">Kit em casa</span>' +
        '</div>' +
        '<div class="ec-card__body">' +
          '<h3 class="ec-card__title">' + esc(titulo) + '</h3>' +
          (descTrunc ? '<p class="ec-card__desc">' + esc(descTrunc) + '</p>' : '<p class="ec-card__desc"></p>') +
          '<div class="ec-card__footer">' +
            (preco ? '<span class="ec-card__price">' + preco + '</span>' : '<span></span>') +
            '<a href="' + esc(detailUrl) + '" class="ec-card__cta">Ver kit →</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderList(grid, list) {
    if (!list.length) { renderEmpty(grid); return; }
    grid.innerHTML = list.map(renderCard).join('');
  }

  // Filtra os kits já carregados por palavra-chave (tipo/coleção).
  function applyFilter(key) {
    var grid = document.getElementById('ec-grid');
    if (!grid) return;
    var terms = FILTERS[key];
    if (!terms || !_allKits.length) { renderList(grid, _allKits); return; }
    var filtered = _allKits.filter(function (e) {
      var hay = norm((e.nome || '') + ' ' + (e.categoria || '') + ' ' + (e.descricao || ''));
      return terms.some(function (t) { return hay.indexOf(t) !== -1; });
    });
    if (!filtered.length) {
      // Sem itens nessa coleção ainda — mostra todos, sem frustrar.
      renderList(grid, _allKits);
    } else {
      renderList(grid, filtered);
    }
  }

  function wireFilters() {
    document.querySelectorAll('[data-colecao],[data-tipo]').forEach(function (el) {
      el.addEventListener('click', function () {
        var key = el.getAttribute('data-colecao') || el.getAttribute('data-tipo');
        // o href="#ec-vitrine" já cuida do scroll; aqui só filtramos
        if (key) applyFilter(key);
      });
    });
  }

  async function loadAndRender() {
    var grid = document.getElementById('ec-grid');
    if (!grid) return;
    try {
      if (!window.ElarahData || typeof window.ElarahData.getVisibleExperiences !== 'function') {
        await new Promise(function (r) { setTimeout(r, 600); });
      }
      var fetcher = (window.ElarahData && window.ElarahData.getVisibleExperiences)
        || (window.ElarahData && window.ElarahData.getAllExperiences);
      if (!fetcher) { renderError(grid, 'Sistema de dados indisponível.'); return; }
      var all = await fetcher();
      _allKits = (all || []).filter(isCasaKit);
      // Ordem manual do admin primeiro (arrastar pra cima = aparece antes);
      // empate/sem ordem cai no alfabético.
      _allKits.sort(function (a, b) {
        var oa = (window.ElarahData && ElarahData.ordemKey) ? ElarahData.ordemKey(a) : Infinity;
        var ob = (window.ElarahData && ElarahData.ordemKey) ? ElarahData.ordemKey(b) : Infinity;
        if (oa !== ob) return oa - ob;
        return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
      });
      console.info('[ElarahEmCasa] total=' + (all || []).length + ' kits=' + _allKits.length);
      renderList(grid, _allKits);
      wireFilters();
    } catch (e) {
      console.error('[ElarahEmCasa] erro ao carregar', e);
      renderError(grid, e && e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRender);
  } else {
    loadAndRender();
  }
})();
