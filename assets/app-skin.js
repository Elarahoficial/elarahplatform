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
    'pintura': '🖌️', 'desenho': '✏️', 'arte': '🎨',
    'barismo': '☕', 'barista': '☕',
    'wellness': '🏋️', 'academia': '🏋️', 'fitness': '🏋️', 'pilates': '🤸',
    'mandala': '🪷', 'mandalas': '🪷', 'lótus': '🪷',
    'sabonete': '🧼', 'sabonetes': '🧼',
    'tufting': '🧵', 'bordado': '🪡', 'costura': '🧵', 'crochê': '🧶', 'croche': '🧶', 'tricô': '🧶', 'trico': '🧶',
    'vela': '🕯️', 'velas': '🕯️',
    'cultura': '🎭', 'teatro': '🎭', 'música': '🎵', 'musica': '🎵', 'dança': '💃', 'danca': '💃',
    'fotografia': '📷', 'foto': '📷',
    'marcenaria': '🪵', 'madeira': '🪵',
    'jardinagem': '🌿', 'plantas': '🌿', 'bem-estar': '🌿', 'yoga': '🧘', 'meditação': '🧘',
    'vinho': '🍷', 'vinhos': '🍷', 'café': '☕', 'cafe': '☕',
    'perfumaria': '🌷', 'perfume': '🌷',
    'perfumaria de ambiente': '🏠', 'aromatizador': '🏠', 'aromatizadores': '🏠', 'ambiente': '🏠', 'home': '🏠',
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
      if (a.getAttribute('data-emoji')) return;
      // IMPORTANTE: o emoji vai num ATRIBUTO (mostrado via CSS ::before),
      // NÃO no texto do link — senão quebra o filtro (que lê o texto).
      a.setAttribute('data-emoji', emojiFor(a.textContent));
    });
  }

  // Elarah Originals: some com os detalhes; deixa só nome + "ver mais" + botão.
  // "ver mais" abre (mostra) tudo que está incluso, ali mesmo no card.
  function decorateOriginals() {
    var cards = document.querySelectorAll('.originals .originals__card');
    cards.forEach(function (card) {
      if (card.querySelector('.sk-vermais')) return;
      var body = card.querySelector('.originals__card-body');
      if (!body) return;
      var btn = card.querySelector('.originals__card-btn');
      var link = document.createElement('button');
      link.type = 'button';
      link.className = 'sk-vermais';
      link.textContent = 'ver mais';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var open = card.classList.toggle('sk-open');
        link.textContent = open ? 'ver menos' : 'ver mais';
      });
      if (btn) body.insertBefore(link, btn);
      else body.appendChild(link);
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

    // Fileira: [☰ menu] + [busca]. Move o botão de menu (hambúrguer) do
    // cabeçalho pra cá, do lado esquerdo da busca (como você pediu).
    var row = document.createElement('div');
    row.className = 'sk-searchrow';
    var toggle = header.querySelector('.header__mobile-toggle');
    if (toggle) {
      toggle.classList.add('sk-menu-moved');
      row.appendChild(toggle);
    }
    row.appendChild(form);
    header.insertAdjacentElement('afterend', row);
  }

  // Filtros viram menu suspenso: toca no título -> abre/fecha os controles.
  function decorateFilters() {
    var filters = document.querySelector('.filters');
    if (!filters || filters.getAttribute('data-sk-filters')) return;
    var title = filters.querySelector('.filters__title');
    if (!title) return;
    filters.setAttribute('data-sk-filters', '1');
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', 'false');
    function toggle() {
      var open = filters.classList.toggle('sk-open');
      title.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    title.addEventListener('click', toggle);
    title.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  function enhance() {
    decorateCategories();
    decorateOriginals();
    decorateFilters();
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
