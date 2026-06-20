/* =====================================================================
   header-nav.js
   Liga os controles do header (Explorar, Buscar e menu mobile) em
   páginas que NÃO têm a lógica completa da home (script.js) nem a de
   presentear.js/categoria.js — caso das páginas de campanha
   (singles-day, dia-dos-namorados, elarah-kids, elarah-em-casa).

   Sem este script, nessas páginas o dropdown "Explorar" nunca abre
   (a classe .open só é adicionada via JS) e a busca não responde,
   prendendo o usuário na página da campanha.

   É idempotente: marca os elementos já inicializados (dataset
   elarahHeaderNav) para nunca atachar handlers duas vezes, mesmo se
   convivendo com outro script de header.
   ===================================================================== */
(function () {
  'use strict';

  function init() {
    initExplorar();
    initBusca();
    initMobile();
  }

  // ===== EXPLORAR (dropdown de categorias) =====
  // Os itens do dropdown são <a href="categoria.html?cat=..."> reais,
  // então navegam sozinhos. Aqui só precisamos abrir/fechar o menu.
  function initExplorar() {
    var btn = document.getElementById('explorar-btn');
    var dd = document.getElementById('explorar-dropdown');
    if (!btn || !dd) return;
    if (btn.dataset.elarahHeaderNav === '1') return;
    btn.dataset.elarahHeaderNav = '1';

    function setChevron(open) {
      var chevron = btn.querySelector('.header__nav-chevron');
      if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dd.classList.toggle('open');
      setChevron(dd.classList.contains('open'));
    });

    // Clique dentro do dropdown não fecha antes do link navegar.
    dd.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    // Clique fora fecha.
    document.addEventListener('click', function () {
      dd.classList.remove('open');
      setChevron(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        dd.classList.remove('open');
        setChevron(false);
      }
    });
  }

  // ===== BUSCAR =====
  // Manda para a home com ?busca= — a home aplica o filtro de busca.
  function initBusca() {
    var input = document.getElementById('search-input');
    var btn = document.getElementById('search-btn');
    if (!input) return;
    if (input.dataset.elarahHeaderNav === '1') return;
    input.dataset.elarahHeaderNav = '1';

    function buscar() {
      var valor = (input.value || '').trim();
      if (!valor) return;
      window.location.href = '/?busca=' + encodeURIComponent(valor);
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscar();
      }
    });
    if (btn) btn.addEventListener('click', buscar);
  }

  // ===== MENU MOBILE =====
  function initMobile() {
    var toggle = document.getElementById('mobile-toggle');
    var nav = document.querySelector('.header__nav');
    if (!toggle || !nav) return;
    if (toggle.dataset.elarahHeaderNav === '1') return;
    toggle.dataset.elarahHeaderNav = '1';

    function close() { nav.classList.remove('mobile-open'); }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      nav.classList.toggle('mobile-open');
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('mobile-open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', close);
    });

    window.addEventListener('scroll', function () {
      if (nav.classList.contains('mobile-open')) close();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
