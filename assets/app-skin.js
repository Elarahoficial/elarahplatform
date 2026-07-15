/* ============================================================
   ELARAH — ativador da "roupa Airbnb" do APP
   ------------------------------------------------------------
   - Detecta se está rodando DENTRO do app Elarah (User-Agent
     "ElarahApp") e liga o visual novo (.is-app no <html>).
   - Teste pelo navegador: ?app=1 liga e fica ativo enquanto navega.
   - Coloca EMOJI em cada categoria.
   - Deixa a busca em pílula FUNCIONAL (digitar e buscar).

   No site normal (sem app e sem ?app=1) não muda nada.
   ============================================================ */
(function () {
  var ua = navigator.userAgent || '';

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

  // ---------- Emojis por categoria ----------
  var EMOJI = {
    'todas': '✨',
    'bartenderia': '🍸', 'coquetelaria': '🍸', 'drinks': '🍸',
    'cerâmica': '🏺', 'ceramica': '🏺',
    'floral': '🌸', 'flores': '🌸',
    'gastronomia': '🍽️', 'culinária': '👩‍🍳', 'culinaria': '👩‍🍳', 'confeitaria': '🧁', 'panificação': '🥐',
    'macramê': '🧶', 'macrame': '🧶',
    'pintura': '🎨', 'desenho': '✏️', 'arte': '🎨',
    'sabonete': '🧼', 'sabonetes': '🧼',
    'tufting': '🧵', 'bordado': '🪡', 'costura': '🧵', 'crochê': '🧶', 'croche': '🧶', 'tricô': '🧶', 'trico': '🧶',
    'vela': '🕯️', 'velas': '🕯️',
    'cultura': '🎭', 'teatro': '🎭', 'música': '🎵', 'musica': '🎵', 'dança': '💃', 'danca': '💃',
    'fotografia': '📷', 'foto': '📷',
    'marcenaria': '🪵', 'madeira': '🪵',
    'jardinagem': '🌿', 'plantas': '🌿', 'bem-estar': '🌿', 'yoga': '🧘', 'meditação': '🧘',
    'vinho': '🍷', 'vinhos': '🍷', 'café': '☕', 'cafe': '☕',
    'perfumaria': '🌷', 'perfume': '🌷',
    'ourivesaria': '💍', 'joalheria': '💍', 'joias': '💍',
    'moda': '👗', 'maquiagem': '💄', 'beleza': '💄',
    'escrita': '✍️', 'gift card': '🎁', 'presente': '🎁'
  };
  var EMOJI_DEFAULT = '✨';

  function emojiFor(name) {
    var k = (name || '').trim().toLowerCase();
    if (EMOJI[k]) return EMOJI[k];
    // tenta por palavra-chave contida no nome
    for (var key in EMOJI) {
      if (EMOJI.hasOwnProperty(key) && k.indexOf(key) > -1) return EMOJI[key];
    }
    return EMOJI_DEFAULT;
  }

  function decorateCategories() {
    var links = document.querySelectorAll('.categories .category-link');
    links.forEach(function (a) {
      if (a.querySelector('.cat-ico')) return;
      var span = document.createElement('span');
      span.className = 'cat-ico';
      span.textContent = emojiFor(a.textContent);
      a.insertAdjacentElement('afterbegin', span);
    });
  }

  // ---------- Busca em pílula FUNCIONAL ----------
  function injectSearch() {
    if (document.querySelector('.sk-search')) return;
    var header = document.querySelector('.header');
    if (!header) return;

    var form = document.createElement('form');
    form.className = 'sk-search';
    form.setAttribute('role', 'search');
    form.action = 'index.html';
    form.method = 'get';
    form.innerHTML =
      '<svg class="sk-search__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
      '<input class="sk-search__input" name="busca" type="search" ' +
      'placeholder="Buscar experiências em São Paulo" ' +
      'autocomplete="off" enterkeyhint="search" aria-label="Buscar experiências">';

    form.addEventListener('submit', function (e) {
      var input = form.querySelector('.sk-search__input');
      var term = (input && input.value || '').trim();
      if (!term) { e.preventDefault(); if (input) input.focus(); return; }
      // deixa o form navegar para index.html?busca=term (comportamento nativo do GET)
    });

    header.insertAdjacentElement('afterend', form);
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

  // Categorias podem ser renderizadas depois (por JS) — observa e redecora.
  var host = document.querySelector('.categories');
  if (host && window.MutationObserver) {
    var mo = new MutationObserver(function () { decorateCategories(); });
    mo.observe(host, { childList: true, subtree: true });
  }
})();
