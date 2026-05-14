/* =============================================================
   ELARAH — admin-mobile.js
   -------------------------------------------------------------
   Comportamento de mobile no admin:
     - Toggle do drawer (hamburger button)
     - Fecha drawer ao clicar em qualquer item da nav
     - Fecha drawer ao clicar no backdrop
     - Fecha drawer com tecla Esc
     - Ajusta clique fora dos modais pra fechar no mobile

   Carregado depois do admin.js. Não substitui nada existente,
   só adiciona handlers idempotentes.
   ============================================================= */

(function () {
  'use strict';

  // Roda só uma vez
  if (window.__elarahMobileInited) return;
  window.__elarahMobileInited = true;

  // ===========================================================
  // 1) Cria o botão hamburger e o backdrop (se ainda não existem)
  // ===========================================================
  function ensureMobileChrome() {
    if (!document.querySelector('.admin-mobile-hamburger')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-mobile-hamburger';
      btn.setAttribute('aria-label', 'Abrir menu');
      btn.setAttribute('aria-controls', 'admin-sidebar');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '☰';
      document.body.appendChild(btn);
      btn.addEventListener('click', toggleDrawer);
    }
    if (!document.querySelector('.admin-mobile-backdrop')) {
      const bd = document.createElement('div');
      bd.className = 'admin-mobile-backdrop';
      document.body.appendChild(bd);
      bd.addEventListener('click', closeDrawer);
    }
  }

  // ===========================================================
  // 2) Toggle / close do drawer
  // ===========================================================
  function getSidebar()  { return document.querySelector('.admin__sidebar'); }
  function getBackdrop() { return document.querySelector('.admin-mobile-backdrop'); }
  function getBtn()      { return document.querySelector('.admin-mobile-hamburger'); }

  function openDrawer() {
    const s = getSidebar(); const b = getBackdrop(); const btn = getBtn();
    if (!s) return;
    s.classList.add('is-open');
    if (b) b.classList.add('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    const s = getSidebar(); const b = getBackdrop(); const btn = getBtn();
    if (!s) return;
    s.classList.remove('is-open');
    if (b) b.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function toggleDrawer() {
    const s = getSidebar();
    if (!s) return;
    if (s.classList.contains('is-open')) closeDrawer();
    else openDrawer();
  }

  // ===========================================================
  // 3) Fecha drawer ao clicar em qualquer item de navegação
  //    (delegação no body — funciona com qualquer .admin__nav-item)
  // ===========================================================
  function onNavClick(e) {
    const item = e.target.closest('.admin__nav-item');
    if (!item) return;
    // No mobile, fechar o drawer ao selecionar uma seção
    if (window.matchMedia('(max-width: 768px)').matches) {
      closeDrawer();
    }
  }

  // ===========================================================
  // 4) Tecla Esc fecha o drawer (e os modais — opcional)
  // ===========================================================
  function onKey(e) {
    if (e.key !== 'Escape') return;
    const s = getSidebar();
    if (s && s.classList.contains('is-open')) {
      closeDrawer();
      e.stopPropagation();
    }
  }

  // ===========================================================
  // 5) Fecha drawer ao redimensionar pra desktop
  //    (evita estado "drawer aberto" persistindo se rotaciona o tablet)
  // ===========================================================
  function onResize() {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      closeDrawer();
    }
  }

  // ===========================================================
  // BOTTOM NAVIGATION (etapa 2)
  // -----------------------------------------------------------
  // Mostra/oculta no mobile; encaminha clicks pra sidebar; tem
  // hide-on-scroll e mantém active state em sync com o painel.
  // ===========================================================

  const MQ_MOBILE = '(max-width: 768px)';
  function isMobile() { return window.matchMedia(MQ_MOBILE).matches; }

  function getBottomNav() { return document.querySelector('.m-bottom-nav'); }

  function showBottomNav() {
    const nav = getBottomNav();
    if (!nav) return;
    if (isMobile()) {
      nav.hidden = false;
    } else {
      nav.hidden = true;
    }
  }

  // Roteia o click do botão da bottom nav pro item correspondente
  // da sidebar (mantém compatibilidade com toda a lógica existente
  // de troca de painel — admin.js escuta clicks em .admin__nav-item).
  function onBottomNavClick(e) {
    const item = e.target.closest('.m-bn-item');
    if (!item) return;
    const panel  = item.getAttribute('data-panel');
    const action = item.getAttribute('data-action');

    if (action === 'open-menu') {
      openDrawer();
      return;
    }
    if (panel) {
      const navItem = document.querySelector(
        '.admin__nav-item[data-panel="' + panel + '"]'
      );
      if (navItem) {
        navItem.click();
      }
      // active state será atualizado pelo observer abaixo
    }
  }

  // Atualiza qual .m-bn-item tem --active baseado no painel ativo
  function syncBottomNavActive() {
    const nav = getBottomNav();
    if (!nav) return;
    const active = document.querySelector('.admin__panel.admin__panel--active');
    const id = active ? active.id : '';
    const panel = id.replace(/^panel-/, '');
    nav.querySelectorAll('.m-bn-item').forEach(function (b) {
      const p = b.getAttribute('data-panel');
      if (p && p === panel) b.classList.add('m-bn-item--active');
      else b.classList.remove('m-bn-item--active');
    });
  }

  // Hide-on-scroll com rAF throttle
  let lastScrollY = 0;
  let ticking = false;
  function onScroll() {
    if (!isMobile()) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      const nav = getBottomNav();
      if (!nav || nav.hidden) { ticking = false; return; }
      const y = window.scrollY || window.pageYOffset || 0;
      const dy = y - lastScrollY;
      // Pequena tolerância: só esconde scroll-down após 8px contínuos
      if (dy > 8 && y > 80) {
        nav.classList.add('is-hidden');
        // FAB acompanha a nav (escondendo junto) — coordenado em etapa 4
        document.body.classList.add('m-nav-hidden');
      } else if (dy < -8) {
        nav.classList.remove('is-hidden');
        document.body.classList.remove('m-nav-hidden');
      }
      lastScrollY = y;
      ticking = false;
    });
  }

  // Observer no painel ativo: re-sync sempre que troca de aba
  function watchPanelChanges() {
    const root = document.querySelector('.admin__panels') || document.body;
    const obs = new MutationObserver(function () {
      syncBottomNavActive();
    });
    obs.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // ===========================================================
  // MOBILE TABLE-AS-CARDS (etapa 3)
  // -----------------------------------------------------------
  // Anota cada <td> com data-label correspondente ao <th>, pra
  // que o CSS no mobile (display:block + ::before attr) consiga
  // renderizar como card. Idempotente, observa mutations.
  // ===========================================================

  function applyMobileTableCards(table) {
    if (!table) return;
    const thead = table.querySelector('thead');
    if (!thead) return;
    const ths = thead.querySelectorAll('th');
    if (!ths.length) return;
    const labels = Array.prototype.map.call(ths, function (th) {
      return (th.textContent || '').trim();
    });
    const rows = table.querySelectorAll('tbody > tr');
    rows.forEach(function (tr) {
      // Pular linha de empty state (geralmente colspan)
      const tds = tr.querySelectorAll(':scope > td');
      if (tds.length === 1 && tds[0].classList.contains('admin__table-empty')) {
        tds[0].setAttribute('data-empty', '1');
        return;
      }
      tds.forEach(function (td, i) {
        if (td.hasAttribute('data-label')) return; // idempotente
        const label = labels[i] || '';
        td.setAttribute('data-label', label);
      });
    });
  }

  function scanTables() {
    if (!isMobile()) return; // só roda no mobile pra evitar overhead
    const tables = document.querySelectorAll('table.admin__table');
    tables.forEach(applyMobileTableCards);
  }

  // Debounce no observer pra evitar overhead em tabelas grandes
  let scanTimer = null;
  function scheduleScan(table) {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(function () {
      if (table) applyMobileTableCards(table);
      else scanTables();
    }, 50);
  }

  function watchTables() {
    const obs = new MutationObserver(function (mutations) {
      if (!isMobile()) return;
      let touchedTable = null;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          // Procura ancestor table.admin__table
          let t = null;
          if (node.matches && node.matches('table.admin__table')) t = node;
          else if (node.closest) t = node.closest('table.admin__table');
          else if (node.querySelector) t = node.querySelector('table.admin__table');
          if (t) { touchedTable = t; break; }
          // Caso adicionem só tbody/tr/td
          if (node.tagName === 'TR' || node.tagName === 'TBODY' || node.tagName === 'TD') {
            const t2 = node.closest && node.closest('table.admin__table');
            if (t2) { touchedTable = t2; break; }
          }
        }
        if (touchedTable) break;
      }
      if (touchedTable) scheduleScan(touchedTable);
    });
    obs.observe(document.body, { subtree: true, childList: true });
  }

  // ===========================================================
  // 6) Init
  // ===========================================================
  function init() {
    ensureMobileChrome();
    document.body.addEventListener('click', onNavClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', function () {
      onResize();
      showBottomNav();
    });

    // Bottom nav
    showBottomNav();
    const nav = getBottomNav();
    if (nav) {
      nav.addEventListener('click', onBottomNavClick);
    }
    syncBottomNavActive();
    watchPanelChanges();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Tabela como cards (mobile only)
    scanTables();
    watchTables();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
