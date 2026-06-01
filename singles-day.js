// =============================================================
// ELARAH — Single's Day
// -------------------------------------------------------------
// Carrega experiências cujo nome contém "Single's Day" (case-
// insensitive, com ou sem apóstrofe) e renderiza no grid.
// Sem dependência de campaign_overrides — fluxo simples por
// nome, basta o admin nomear a experiência com o padrão.
// =============================================================
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // Casa "Single's Day", "Singles Day", "single´s day", etc.
  function isSinglesExp(exp) {
    if (!exp || !exp.nome) return false;
    var nome = String(exp.nome).toLowerCase().replace(/[´'']/g, "'").replace(/\s+/g, ' ');
    return nome.indexOf("single's day") !== -1
        || nome.indexOf("singles day") !== -1
        || nome.indexOf("galentine") !== -1;
  }

  // ===== Countdown =====
  function updateCountdown() {
    var el = document.getElementById('sd-countdown');
    if (!el) return;
    var now = new Date();
    var year = now.getFullYear();
    var target = new Date(year + '-06-12T00:00:00-03:00');
    if (now > target) target = new Date((year + 1) + '-06-12T00:00:00-03:00');
    var diffMs = target - now;
    var days = Math.ceil(diffMs / 86400000);
    if (days <= 0) el.innerHTML = '✨ <strong>É hoje!</strong>';
    else if (days === 1) el.innerHTML = '<strong>Amanhã</strong> é o 12 de junho';
    else el.innerHTML = 'Faltam <strong>' + days + '</strong> dias para o 12 de junho';
  }
  updateCountdown();

  function renderEmpty(grid) {
    grid.innerHTML =
      '<div class="sd-empty">' +
        '<div class="sd-empty__icon">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 2v6"/><path d="M12 22v-6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/>' +
            '<path d="M2 12h6"/><path d="M22 12h-6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M14.83 9.17l4.24-4.24"/>' +
          '</svg>' +
        '</div>' +
        '<h3 style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:var(--sd-ink);margin:0 0 10px;font-weight:400;">Curadoria a caminho</h3>' +
        '<p style="color:var(--sd-ink-soft);font-size:.95rem;max-width:420px;margin:0 auto;line-height:1.55;">As experiências de Single\'s Day estão sendo finalizadas. Enquanto isso, ' +
          '<a href="categoria.html" style="color:var(--sd-coral-dark);font-weight:600;text-decoration:underline;">explore todas as experiências</a>.</p>' +
      '</div>';
  }

  function renderError(grid, msg) {
    grid.innerHTML =
      '<div class="sd-error">' +
        '<p style="color:#a4332b;font-size:.9rem;margin:0 0 10px;">Não foi possível carregar as experiências agora.</p>' +
        '<p style="color:#888;font-size:.78rem;margin:0;">' + esc(msg || '') + '</p>' +
        '<a href="categoria.html" style="display:inline-block;margin-top:14px;color:var(--sd-coral-dark);font-weight:600;text-decoration:underline;">Explore todas as experiências</a>' +
      '</div>';
  }

  function renderCard(e) {
    var img = e.imagem
      ? '<img src="' + esc(e.imagem) + '" alt="' + esc(e.nome) + '" loading="lazy">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#c44e3a;font-family:\'DM Serif Display\',serif;font-size:2rem;">✨</div>';

    var preco = e.preco ? esc(e.preco) : '';
    var bairro = e.bairro ? esc(e.bairro) : '';
    var data = e.data ? esc(e.data) : '';
    // Limpa "Single's Day" do título pra não repetir com o badge.
    var tituloLimpo = String(e.nome || '')
      .replace(/[:\-–—]?\s*(single['´']?s?\s*day|galentine[''´]?s?\s*day)/gi, '')
      .trim() || e.nome;

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
      '<article class="sd-card">' +
        '<div class="sd-card__image">' +
          img +
          '<span class="sd-card__badge">✨ Single\'s Day</span>' +
          '<button type="button" class="sd-card__share" data-share-id="' + esc(e.id || '') + '" aria-label="Copiar link" title="Copiar link">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
              '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
              '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="sd-card__body">' +
          '<h3 class="sd-card__title">' + esc(tituloLimpo) + '</h3>' +
          (descTrunc ? '<p class="sd-card__desc">' + esc(descTrunc) + '</p>' : '') +
          '<div class="sd-card__meta">' +
            (data ? '<span class="sd-card__meta-row">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
              data + '</span>' : '') +
            (bairro ? '<span class="sd-card__meta-row">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
              bairro + '</span>' : '') +
          '</div>' +
          '<div class="sd-card__footer">' +
            (preco ? '<span class="sd-card__price">' + preco + '</span>' : '<span></span>') +
            '<a href="' + esc(detailUrl) + '" class="sd-card__cta">Ver detalhes →</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function wireShareButtons(grid) {
    grid.querySelectorAll('.sd-card__share').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var id = btn.dataset.shareId;
        if (!id) return;
        var url = window.location.origin + '/experiencia.html?id=' + encodeURIComponent(id);
        var original = btn.innerHTML;
        function done() {
          btn.innerHTML = '<span style="font-size:.66rem;font-weight:700;color:#c44e3a;white-space:nowrap;">Copiado!</span>';
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
    var grid = document.getElementById('sd-grid');
    if (!grid) return;
    try {
      if (!window.ElarahData || typeof window.ElarahData.getVisibleExperiences !== 'function') {
        // Fallback se experiences-data.js ainda não carregou — espera um pouco.
        await new Promise(function (r) { setTimeout(r, 600); });
      }
      var fetcher = (window.ElarahData && window.ElarahData.getVisibleExperiences)
        || (window.ElarahData && window.ElarahData.getAllExperiences);
      if (!fetcher) { renderError(grid, 'Sistema de dados não disponível.'); return; }
      var all = await fetcher();
      var filtered = (all || []).filter(isSinglesExp);
      console.info('[SinglesDay] total=' + (all || []).length + ' filtradas=' + filtered.length);
      if (!filtered.length) { renderEmpty(grid); return; }
      // Ordena por data se houver, depois por nome.
      filtered.sort(function (a, b) {
        return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
      });
      grid.innerHTML = filtered.map(renderCard).join('');
      wireShareButtons(grid);
    } catch (e) {
      console.error('[SinglesDay] erro ao carregar', e);
      renderError(grid, e && e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRender);
  } else {
    loadAndRender();
  }
})();
