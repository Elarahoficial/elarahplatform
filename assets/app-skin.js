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

  // Detecção original: estava DENTRO do app? (ElarahApp no User-Agent,
  // ?app=1 no navegador, sessionStorage ou Capacitor nativo).
  var isNativeOrAppView =
    ua.indexOf('ElarahApp') > -1 ||
    qApp ||
    stored ||
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  // Agora o visual "app" (estilo Airbnb) vale TAMBÉM no site aberto no
  // navegador, pra TODOS os visitantes — não só dentro do app. Por isso
  // ligamos sempre. (A "ponte nativa" mais abaixo continua rodando só no
  // app real, via Capacitor.isNativePlatform().)
  // Para voltar a "visual só no app", troque a linha por:
  //   var isApp = isNativeOrAppView;
  var isApp = true || isNativeOrAppView;

  if (!isApp) return;

  var root = document.documentElement;
  root.classList.add('is-app');

  // Páginas de conteúdo com cabeçalho próprio (blog etc.) usam .topbar —
  // essas NÃO devem receber os ajustes de card/layout do app-skin.
  if (document.querySelector('.topbar')) root.classList.add('sk-article');

  // ---------- Emojis por categoria ----------
  var EMOJI = {
    'todas': '✨',
    'bartenderia': '🍸', 'coquetelaria': '🍸', 'drinks': '🍸',
    'cerâmica': '🏺', 'ceramica': '🏺',
    'floral': '🌸', 'flores': '🌸',
    'gastronomia': '🍽️', 'culinária': '👩‍🍳', 'culinaria': '👩‍🍳', 'confeitaria': '🧁', 'panificação': '🥐',
    'macramê': '🧶', 'macrame': '🧶',
    'pintura': '🖌️', 'desenho': '✏️', 'arte': '🖌️', 'arte & ilustração': '🖌️', 'ilustração': '🖌️', 'ilustracao': '🖌️',
    'barismo': '☕', 'barista': '☕',
    'wellness': '🏋️', 'academia': '🏋️', 'fitness': '🏋️', 'pilates': '🤸',
    'mandala': '🪷', 'mandalas': '🪷', 'lótus': '🪷',
    'sabonete': '🧼', 'sabonetes': '🧼',
    'tufting': '🧵', 'bordado': '🪡', 'costura': '🧵', 'crochê': '🧶', 'croche': '🧶', 'tricô': '🧶', 'trico': '🧶',
    'vela': '🕯️', 'velas': '🕯️',
    'cultura': '🇧🇷', 'cultural': '🇧🇷', 'teatro': '🇧🇷', 'música': '🎵', 'musica': '🎵', 'dança': '💃', 'danca': '💃',
    'fotografia': '📷', 'foto': '📷',
    'marcenaria': '🪵', 'madeira': '🪵',
    'jardinagem': '🌿', 'plantas': '🌿', 'bem-estar': '🌿', 'yoga': '🧘', 'meditação': '🧘',
    'vinho': '🍷', 'vinhos': '🍷', 'café': '☕', 'cafe': '☕',
    'perfumaria': '🌷', 'perfume': '🌷',
    'perfumaria de ambiente': '🏠', 'aromatizador': '🏠', 'aromatizadores': '🏠', 'ambiente': '🏠', 'home': '🏠',
    'ourivesaria': '💍', 'joalheria': '💍', 'joias': '💍',
    'moda': '👗', 'maquiagem': '💄', 'beleza': '💄',
    'acessório': '👛', 'acessorio': '👛', 'acessórios': '👛', 'acessorios': '👛',
    'cervejaria': '🍺', 'cerveja': '🍺', 'cervejas': '🍺',
    'charutaria': '🚬', 'charuto': '🚬', 'charutos': '🚬',
    'colagem': '✂️', 'colagens': '✂️', 'collage': '✂️',
    'lip balm': '💄', 'lipbalm': '💄', 'lip-balm': '💄',
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

  // Capa enxuta de boas-vindas (só no app): explica o que é a Elarah.
  function injectIntro() {
    if (document.querySelector('.sk-intro')) return;
    var anchor = document.querySelector('.sk-searchrow') || document.querySelector('.header');
    if (!anchor) return;
    var intro = document.createElement('section');
    intro.className = 'sk-intro';
    intro.innerHTML =
      '<h1 class="sk-intro__title">Experiências criativas em São Paulo</h1>' +
      '<p class="sk-intro__sub">Saia da rotina e viva algo novo, presencial e feito à mão.</p>';
    anchor.insertAdjacentElement('afterend', intro);
  }

  // É a página inicial? (home tem a capa, busca, originais)
  var path = window.location.pathname || '';
  var isHome = path === '' || path === '/' || /(^|\/)index\.html$/i.test(path);

  // Está buscando/filtrando? (?busca= ou ?categoria=)
  function filterParams() {
    try {
      var sp = new URLSearchParams(window.location.search);
      return { busca: sp.get('busca'), cat: sp.get('categoria') || sp.get('cat') };
    } catch (e) { return {}; }
  }

  // Card INTEIRO clicável (foto e corpo abrem a experiência; coração e
  // links/botões continuam funcionando normalmente).
  function enableCardTap() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input, select, textarea, label')) return;
      var card = e.target.closest('.card');
      if (!card) return;
      var link = card.querySelector('.card__title-link') || card.querySelector('a[href]');
      var href = link && link.getAttribute('href');
      if (href) window.location.assign(href);
    });
  }

  // Ao buscar, esconde a capa + "By Elarah" e mostra só os resultados.
  function applyFilterView() {
    var f = filterParams();
    if (!f.busca && !f.cat) return;
    root.classList.add('is-filtering');
    var titleEl = document.querySelector('.experiences__title');
    if (titleEl) {
      titleEl.textContent = f.busca
        ? 'Resultados para "' + f.busca + '"'
        : (f.cat || 'Resultados');
    }
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.assign('index.html');
  }

  // Faz os botões "Voltar" da página funcionarem no app.
  // (O site usa href="javascript:history.back()", que o webview do app
  // costuma bloquear — aqui interceptamos o clique e voltamos via JS.)
  function enableBackLinks() {
    document.addEventListener('click', function (e) {
      var back = e.target.closest('.exp-detail__back, [href="javascript:history.back()"], .js-voltar, .voltar');
      if (!back) return;
      e.preventDefault();
      goBack();
    }, true);
  }

  // Voltar arrastando o dedo da borda esquerda pra direita (swipe back).
  function enableSwipeBack() {
    var x0 = 0, y0 = 0, on = false;
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { on = false; return; }
      var t = e.touches[0];
      if (t.clientX > 28) { on = false; return; } // só perto da borda esquerda
      x0 = t.clientX; y0 = t.clientY; on = true;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!on) return;
      on = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      if (dx > 60 && Math.abs(dy) < 50) goBack();
    }, { passive: true });
  }

  // O menu (☰) abre abaixo da fileira de busca (senão cobriria o ☰).
  function fixMenuPosition() {
    var nav = document.querySelector('.header__nav');
    if (!nav || !window.MutationObserver) return;
    function reposition() {
      if (!nav.classList.contains('mobile-open')) return;
      var row = document.querySelector('.sk-searchrow') || document.querySelector('.header');
      if (!row) return;
      var bottom = Math.max(0, Math.round(row.getBoundingClientRect().bottom));
      nav.style.top = bottom + 'px';
      nav.style.maxHeight = 'calc(100dvh - ' + bottom + 'px)';
    }
    var mo = new MutationObserver(reposition);
    mo.observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  function enhance() {
    decorateCategories();
    enableCardTap();
    enableBackLinks();
    enableSwipeBack();
    applyFilterView();
    // Capa, busca e Originais só na página inicial (páginas internas ficam limpas)
    if (isHome) {
      decorateOriginals();
      decorateFilters();
      injectSearch();
      injectIntro();
      fixMenuPosition();
    }
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

  // ============================================================
  // PONTE NATIVA — só roda DENTRO do app (Capacitor nativo).
  // Como o app carrega o site ao vivo, esta ponte precisa viver
  // no site. No navegador normal, nada disso roda.
  // ============================================================
  (function nativeBridge() {
    var Cap = window.Capacitor;
    if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

    function plugin(name) {
      return (Cap.Plugins && Cap.Plugins[name]) || null;
    }
    var AppP = plugin('App');
    var SITE_HOSTS = ['elarah.com.br', 'www.elarah.com.br', 'localhost'];

    function openExternal(url) {
      var Browser = plugin('Browser');
      if (Browser && Browser.open) Browser.open({ url: url });
      else if (AppP && AppP.openUrl) AppP.openUrl({ url: url });
      else window.open(url, '_system');
    }

    // 1) Botão voltar (Android)
    if (AppP && AppP.addListener) {
      AppP.addListener('backButton', function (e) {
        if (window.history.length > 1 && e.canGoBack !== false) window.history.back();
        else AppP.exitApp();
      });
    }

    // 2) Links externos -> navegador do sistema (não trava dentro do app)
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      var u;
      try { u = new URL(href, window.location.href); } catch (err) { return; }
      var isHttp = u.protocol === 'http:' || u.protocol === 'https:';
      if (!isHttp) { ev.preventDefault(); openExternal(href); return; }
      var isSameSite = SITE_HOSTS.indexOf(u.hostname) !== -1;
      if (!isSameSite || a.target === '_blank') { ev.preventDefault(); openExternal(u.href); }
    }, true);

    // 3) Esconde a splash quando carrega
    function hideSplash() { var S = plugin('SplashScreen'); if (S && S.hide) S.hide(); }
    if (document.readyState === 'complete') hideSplash();
    else window.addEventListener('load', hideSplash);

    // 4) Compartilhamento nativo nos botões de compartilhar
    var SHARE_BASE = 'https://elarah.com.br';
    var SHARE_SELECTOR = '.card__share-btn, .originals__card-share-btn, #exp-share-btn, .exp-detail__share-btn';
    document.addEventListener('click', function (ev) {
      var Share = plugin('Share');
      if (!Share || !Share.share) return;
      var btn = ev.target && ev.target.closest ? ev.target.closest(SHARE_SELECTOR) : null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var id = btn.dataset.shareId || btn.dataset.shareExperienceId;
      var url = id
        ? SHARE_BASE + '/experiencia.html?id=' + encodeURIComponent(id)
        : SHARE_BASE + window.location.pathname + window.location.search;
      var nome = (document.title || 'Elarah').split('—')[0].split('|')[0].trim() || 'Elarah';
      Share.share({
        title: 'Elarah',
        text: 'Descubra essa experiência na Elarah: ' + nome,
        url: url,
        dialogTitle: 'Compartilhar experiência'
      }).catch(function () {});
    }, true);
  })();
})();
