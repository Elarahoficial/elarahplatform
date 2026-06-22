// =============================================================
// ELARAH — Elarah Kids
// -------------------------------------------------------------
// Carrega experiencias identificadas como kids/infantil e
// renderiza na vitrine. Match tolerante: nome OU categoria
// contendo "kids", "infantil" ou "crianca/criança". Permite a
// admin marcar uma exp como kids escrevendo simplesmente
// "Workshop Kids" no nome (sem precisar criar campo novo).
// =============================================================
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // Casa "Kids", "kids", "infantil", "criança/crianca"
  function isKidsExp(exp) {
    if (!exp) return false;
    var hay = ((exp.nome || '') + ' ' + (exp.categoria || ''))
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, ''); // remove acentos
    return hay.indexOf('kids') !== -1
        || hay.indexOf('infantil') !== -1
        || hay.indexOf('crianca') !== -1
        || hay.indexOf('infantis') !== -1;
  }

  function renderEmpty(grid) {
    grid.innerHTML =
      '<div class="ek-empty">' +
        '<div style="font-size:2.5rem;margin-bottom:14px;">✿</div>' +
        '<h3 style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:#2a1a10;margin:0 0 10px;font-weight:400;">Em curadoria</h3>' +
        '<p style="color:#5a4030;font-size:.95rem;max-width:420px;margin:0 auto;line-height:1.55;">As experiências Elarah Kids estão sendo finalizadas. Enquanto isso, ' +
          '<a href="categoria.html" style="color:#7a9a6e;font-weight:600;text-decoration:underline;">explore todas as experiências</a>.</p>' +
      '</div>';
  }

  function renderError(grid, msg) {
    grid.innerHTML =
      '<div class="ek-error">' +
        '<p style="color:#a4332b;font-size:.9rem;margin:0 0 10px;">Não foi possível carregar as experiências agora.</p>' +
        '<p style="color:#888;font-size:.78rem;margin:0;">' + esc(msg || '') + '</p>' +
        '<a href="categoria.html" style="display:inline-block;margin-top:14px;color:#7a9a6e;font-weight:600;text-decoration:underline;">Explore todas as experiências</a>' +
      '</div>';
  }

  function renderCard(e) {
    var img = e.imagem
      ? '<img src="' + esc(e.imagem) + '" alt="' + esc(e.nome) + '" loading="lazy">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#7a9a6e;font-family:\'DM Serif Display\',serif;font-size:2rem;">✿</div>';

    var preco = e.preco
      ? esc(window.ElarahData && typeof window.ElarahData.formatPrecoBR === 'function'
          ? window.ElarahData.formatPrecoBR(e.preco) : e.preco)
      : '';
    var bairro = e.bairro ? esc(e.bairro) : '';
    var data = e.data ? esc(e.data) : '';
    var tituloLimpo = String(e.nome || '').trim() || 'Experiência Kids';

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
      '<article class="ek-card">' +
        '<div class="ek-card__image">' +
          img +
          '<span class="ek-card__badge">✿ Para crianças</span>' +
          '<button type="button" class="ek-card__share" data-share-id="' + esc(e.id || '') + '" aria-label="Copiar link" title="Copiar link">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
              '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
              '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="ek-card__body">' +
          '<h3 class="ek-card__title">' + esc(tituloLimpo) + '</h3>' +
          (descTrunc ? '<p class="ek-card__desc">' + esc(descTrunc) + '</p>' : '') +
          '<div class="ek-card__meta">' +
            (data ? '<span class="ek-card__meta-row">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
              data + '</span>' : '') +
            (bairro ? '<span class="ek-card__meta-row">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
              bairro + '</span>' : '') +
          '</div>' +
          '<div class="ek-card__footer">' +
            (preco ? '<span class="ek-card__price">' + preco + '</span>' : '<span></span>') +
            '<a href="' + esc(detailUrl) + '" class="ek-card__cta">Ver detalhes →</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function wireShareButtons(grid) {
    grid.querySelectorAll('.ek-card__share').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var id = btn.dataset.shareId;
        if (!id) return;
        var url = window.location.origin + '/experiencia.html?id=' + encodeURIComponent(id);
        var original = btn.innerHTML;
        function done() {
          btn.innerHTML = '<span style="font-size:.66rem;font-weight:700;color:#7a9a6e;white-space:nowrap;">Copiado!</span>';
          btn.style.width = 'auto';
          btn.style.padding = '0 10px';
          setTimeout(function () {
            btn.innerHTML = original;
            btn.style.width = '36px';
            btn.style.padding = '0';
          }, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { prompt('Copie o link:', url); });
        } else {
          prompt('Copie o link:', url);
        }
      });
    });
  }

  async function loadAndRender() {
    var grid = document.getElementById('ek-grid');
    if (!grid) return;
    try {
      if (!window.ElarahData || typeof window.ElarahData.getVisibleExperiences !== 'function') {
        await new Promise(function (r) { setTimeout(r, 600); });
      }
      var fetcher = (window.ElarahData && window.ElarahData.getVisibleExperiences)
        || (window.ElarahData && window.ElarahData.getAllExperiences);
      if (!fetcher) { renderError(grid, 'Sistema de dados indisponível.'); return; }
      var all = await fetcher();
      var filtered = (all || []).filter(isKidsExp);
      console.info('[ElarahKids] total=' + (all || []).length + ' filtradas=' + filtered.length);
      if (!filtered.length) { renderEmpty(grid); return; }
      // Ordena por nome.
      filtered.sort(function (a, b) {
        return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
      });
      grid.innerHTML = filtered.map(renderCard).join('');
      wireShareButtons(grid);
    } catch (e) {
      console.error('[ElarahKids] erro ao carregar', e);
      renderError(grid, e && e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRender);
  } else {
    loadAndRender();
  }
})();
