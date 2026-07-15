/* ============================================================
   ELARAH — ativador da "roupa Airbnb" do APP
   ------------------------------------------------------------
   - Detecta se está rodando DENTRO do app Elarah (pela marca no
     User-Agent "ElarahApp", que o app adiciona) e liga o visual
     novo colocando a classe .is-app no <html>.
   - Também dá pra testar no navegador adicionando ?app=1 na URL.
   - Injeta os iconezinhos nas categorias (estilo Airbnb).

   No site normal (sem app e sem ?app=1) este script não muda nada.
   ============================================================ */
(function () {
  var ua = navigator.userAgent || '';

  // Modo de teste pelo navegador: ?app=1 liga e FICA ligado enquanto navega
  // (guardamos na sessão). Some ao fechar a aba. Não afeta o site normal.
  var qApp = /[?&]app=1\b/.test(window.location.search);
  var stored = false;
  try {
    if (qApp) sessionStorage.setItem('elarah_app_preview', '1');
    stored = sessionStorage.getItem('elarah_app_preview') === '1';
  } catch (e) {}

  var isApp =
    ua.indexOf('ElarahApp') > -1 ||
    qApp ||
    stored ||
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  if (!isApp) return;

  var root = document.documentElement;
  root.classList.add('is-app');

  // Ícones de categoria (traço fino, estilo Airbnb)
  var ICONS = {
    'todas':       '<path d="M12 3l2.2 5.5L20 9l-4.5 4 1.4 6L12 16l-4.9 3 1.4-6L4 9l5.8-.5z"/>',
    'cerâmica':    '<path d="M4 11h16"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 11V6a2 2 0 114 0"/>',
    'ceramica':    '<path d="M4 11h16"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 11V6a2 2 0 114 0"/>',
    'pintura':     '<path d="M12 3a9 9 0 000 18c1.7 0 2-1.3 1.2-2.2-.8-.9-.4-2.3 1-2.3H17a4 4 0 004-4c0-4.4-4-7.5-9-7.5z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>',
    'gastronomia': '<path d="M6 3v8a2 2 0 004 0V3"/><path d="M8 11v10"/><path d="M17 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/>',
    'floral':      '<circle cx="12" cy="12" r="3"/><path d="M12 9c0-3 1.5-5 0-6-1.5 1 0 3 0 6zM12 15c0 3-1.5 5 0 6 1.5-1 0-3 0-6zM9 12c-3 0-5-1.5-6 0 1 1.5 3 0 6 0zM15 12c3 0 5 1.5 6 0-1-1.5-3 0-6 0z"/>',
    'vela':        '<path d="M9 3h6v4a3 3 0 01-6 0z"/><path d="M9 7c-2 3-3 6-3 9a6 6 0 0012 0c0-3-1-6-3-9"/>',
    'bartenderia': '<path d="M5 3l7 8 7-8"/><path d="M12 11v7"/><path d="M8 21h8"/>',
    'macramê':     '<path d="M6 3v6M18 3v6"/><path d="M6 9c0 4 2.5 6 6 6s6-2 6-6"/><path d="M12 15v6"/>',
    'macrame':     '<path d="M6 3v6M18 3v6"/><path d="M6 9c0 4 2.5 6 6 6s6-2 6-6"/><path d="M12 15v6"/>',
    'sabonete':    '<rect x="4" y="9" width="16" height="11" rx="3"/><path d="M12 9c0-3 2-5 2-5"/>',
    'tufting':     '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8v8M12 8v8M16 8v8"/>'
  };
  var DEFAULT_ICON = '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>';

  function normalize(s) {
    return (s || '').trim().toLowerCase();
  }

  function decorateCategories() {
    var links = document.querySelectorAll('.categories .category-link');
    links.forEach(function (a) {
      if (a.querySelector('.cat-ico')) return; // já feito
      var key = normalize(a.textContent);
      var inner = ICONS[key] || DEFAULT_ICON;
      var svg =
        '<svg class="cat-ico" viewBox="0 0 24 24" aria-hidden="true">' + inner + '</svg>';
      a.insertAdjacentHTML('afterbegin', svg);
    });
  }

  // Busca em pílula no topo (só no app). Toca -> abre a página de busca.
  function injectSearch() {
    if (document.querySelector('.sk-search')) return;
    var header = document.querySelector('.header');
    if (!header) return;
    var bar = document.createElement('a');
    bar.className = 'sk-search';
    bar.href = 'categoria.html';
    bar.setAttribute('aria-label', 'Buscar experiências');
    bar.innerHTML =
      '<svg class="sk-search__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
      '<span class="sk-search__txt"><span class="sk-search__a">Buscar experiências</span>' +
      '<span class="sk-search__b">São Paulo · qualquer data</span></span>';
    header.insertAdjacentElement('afterend', bar);
  }

  function enhance() {
    decorateCategories();
    injectSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }

  // Caso as categorias sejam renderizadas depois (por JS), observa o container.
  var host = document.querySelector('.categories');
  if (host && window.MutationObserver) {
    var mo = new MutationObserver(function () { decorateCategories(); });
    mo.observe(host, { childList: true, subtree: true });
  }
})();
