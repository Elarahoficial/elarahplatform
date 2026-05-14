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
      hapticTap();
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
    hapticTap();
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
    // FAB também depende do painel ativo
    syncFab();
    // Anima a entrada do painel ativo (etapa 5.1)
    applyPanelEnterAnim();
    // Skeletons se a lista do painel ainda está carregando (etapa 5.2)
    maybeShowSkeletonsForActivePanel();
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
  // FAB CONTEXTUAL (etapa 4)
  // -----------------------------------------------------------
  // Mapeia painel ativo → ação de "novo". Clica o botão real
  // existente na tela pra reusar toda a lógica (modais, handlers).
  // ===========================================================

  const FAB_MAP = {
    'prospects': {
      label: 'Novo prospect',
      targetId: 'btn-prospect-new'
    },
    'purchases': {
      label: 'Registrar venda',
      targetId: 'btn-register-manual-sale'
    }
  };

  function getFab() { return document.getElementById('m-fab'); }

  function showToast(msg) {
    // Toast leve, sem dependências. Some sozinho em 2.5s.
    let t = document.getElementById('m-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'm-toast';
      t.style.cssText = 'position:fixed;bottom:140px;left:50%;transform:translateX(-50%);background:rgba(20,18,15,.92);color:#fff;padding:10px 18px;border-radius:20px;font-size:.85rem;z-index:10001;pointer-events:none;opacity:0;transition:opacity .25s ease-out;max-width:80vw;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t.__timer);
    t.__timer = setTimeout(function () { t.style.opacity = '0'; }, 2500);
  }

  function getActivePanelKey() {
    const active = document.querySelector('.admin__panel.admin__panel--active');
    if (!active) return '';
    return (active.id || '').replace(/^panel-/, '');
  }

  function onFabClick() {
    hapticTap();
    const key = getActivePanelKey();
    const cfg = FAB_MAP[key];
    if (!cfg) return;
    const btn = document.getElementById(cfg.targetId);
    if (btn) {
      btn.click();
    } else {
      // Fallback: scroll pro topo + toast
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
      showToast('Use o botão "Novo" no topo da lista');
    }
  }

  function syncFab() {
    const fab = getFab();
    if (!fab) return;
    if (!isMobile()) { fab.hidden = true; return; }
    const key = getActivePanelKey();
    const cfg = FAB_MAP[key];
    if (cfg) {
      fab.hidden = false;
      fab.setAttribute('aria-label', cfg.label);
      fab.dataset.action = key;
    } else {
      fab.hidden = true;
      fab.removeAttribute('data-action');
    }
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
  // MICROANIMAÇÕES E FEEDBACK TÁTIL (etapa 5.1)
  // -----------------------------------------------------------
  // Haptics: vibration leve (10ms) pra taps, médio (20ms) pra
  // ações de commit (salvar/promover/etc). Wrapper try/catch
  // porque API é instável em alguns browsers.
  // Pausa quando a aba está oculta pra não vibrar em background.
  // ===========================================================

  let _hapticsPaused = false;

  function hapticTap() {
    if (_hapticsPaused) return;
    if (!isMobile()) return;
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
    } catch (_) { /* silencioso */ }
  }

  function hapticCommit() {
    if (_hapticsPaused) return;
    if (!isMobile()) return;
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(20);
      }
    } catch (_) { /* silencioso */ }
  }

  // Expor pra reuso ad-hoc
  window.elarahHapticTap = hapticTap;
  window.elarahHapticCommit = hapticCommit;

  function setupHapticPause() {
    document.addEventListener('visibilitychange', function () {
      _hapticsPaused = document.hidden;
    });
  }

  // -----------------------------------------------------------
  // Transição de painel: ao trocar a aba ativa, aplica .is-entering
  // no painel que acabou de virar visível pra disparar o fade-in.
  // -----------------------------------------------------------
  let _lastActivePanelId = null;
  function applyPanelEnterAnim() {
    if (!isMobile()) return;
    const active = document.querySelector('.admin__panel.admin__panel--active');
    if (!active) return;
    if (_lastActivePanelId === active.id) return;
    _lastActivePanelId = active.id;
    // Reaplica a classe pra re-disparar a animação CSS
    active.classList.remove('is-entering');
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    void active.offsetWidth;
    active.classList.add('is-entering');
    // Limpa depois pra não acumular
    setTimeout(function () {
      active.classList.remove('is-entering');
    }, 260);
  }

  // -----------------------------------------------------------
  // Modal entry: detecta quando .admin__modal vira display:flex
  // e aplica .is-open pra disparar slide-up.
  // -----------------------------------------------------------
  function setupModalEntryWatcher() {
    const obs = new MutationObserver(function (muts) {
      if (!isMobile()) return;
      muts.forEach(function (m) {
        if (m.type !== 'attributes') return;
        const el = m.target;
        if (!(el instanceof HTMLElement)) return;
        if (!el.classList || !el.classList.contains('admin__modal')) return;
        const styleAttr = el.getAttribute('style') || '';
        const visible = /display\s*:\s*flex/i.test(styleAttr);
        if (visible && !el.classList.contains('is-open')) {
          el.classList.add('is-open');
        } else if (!visible && el.classList.contains('is-open')) {
          el.classList.remove('is-open');
        }
      });
    });
    // Observa só os modais existentes; novos modais virão via outro observer
    // mas é raro criar modal em runtime — observamos body como fallback leve.
    document.querySelectorAll('.admin__modal').forEach(function (m) {
      obs.observe(m, { attributes: true, attributeFilter: ['style'] });
      // Estado inicial
      const styleAttr = m.getAttribute('style') || '';
      if (/display\s*:\s*flex/i.test(styleAttr)) m.classList.add('is-open');
    });
    // Watcher pra modais adicionados depois
    const bodyObs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (n) {
          if (!(n instanceof HTMLElement)) return;
          if (n.classList && n.classList.contains('admin__modal')) {
            obs.observe(n, { attributes: true, attributeFilter: ['style'] });
          }
          if (n.querySelectorAll) {
            n.querySelectorAll('.admin__modal').forEach(function (sub) {
              obs.observe(sub, { attributes: true, attributeFilter: ['style'] });
            });
          }
        });
      });
    });
    bodyObs.observe(document.body, { childList: true, subtree: true });
  }

  // ===========================================================
  // SKELETON LOADING (etapa 5.2)
  // -----------------------------------------------------------
  // Mostra placeholders animados enquanto a lista real ainda
  // não chegou. Detecção é heurística: se um painel virou ativo
  // e o tbody está vazio OU contém só texto "Carregando", injeta
  // skeletons. Quando o admin.js renderiza linhas de verdade, o
  // MutationObserver remove os skeletons.
  // ===========================================================

  // Container -> skeleton wrapper. Usamos um wrapper irmão do tbody
  // pra não conflitar com o CSS table-as-cards.
  function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'm-skeleton-card';
    card.innerHTML =
      '<div class="m-skeleton m-skeleton-title"></div>' +
      '<div class="m-skeleton m-skeleton-line-1"></div>' +
      '<div class="m-skeleton m-skeleton-line-2"></div>' +
      '<div class="m-skeleton-actions">' +
        '<div class="m-skeleton m-skeleton-btn"></div>' +
        '<div class="m-skeleton m-skeleton-btn"></div>' +
      '</div>';
    return card;
  }

  function renderSkeletons(container, n) {
    if (!container) return;
    if (typeof n !== 'number' || n < 1) n = 5;
    // Idempotente: se já tem skeletons, não duplica
    if (container.querySelector(':scope > .m-skeleton-wrapper')) return;
    const wrap = document.createElement('div');
    wrap.className = 'm-skeleton-wrapper';
    wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < n; i++) {
      wrap.appendChild(createSkeletonCard());
    }
    container.appendChild(wrap);
  }

  function removeSkeletons(container) {
    if (!container) return;
    container.querySelectorAll(':scope > .m-skeleton-wrapper').forEach(function (w) {
      w.parentNode && w.parentNode.removeChild(w);
    });
  }

  // Heurística: tbody é considerado "carregando" se:
  //   - não tem nenhum <tr> renderizado, OU
  //   - só tem 1 row e ela contém texto tipo "Carregando" / "carregando"
  function tbodyLooksLoading(tbody) {
    if (!tbody) return false;
    const rows = tbody.querySelectorAll(':scope > tr');
    if (rows.length === 0) return true;
    if (rows.length === 1) {
      const txt = (rows[0].textContent || '').trim().toLowerCase();
      if (txt.indexOf('carregando') !== -1) return true;
    }
    return false;
  }

  // Trigger: chamado quando o painel ativo muda. Pra cada table.admin__table
  // do painel ativo, se o tbody parece carregando, mostra skeletons.
  // Os skeletons ficam num wrapper irmão do .admin__table-wrap (pra não
  // misturar com o tbody) — na verdade, dentro do .admin__table-wrap.
  function maybeShowSkeletonsForActivePanel() {
    if (!isMobile()) return;
    const active = document.querySelector('.admin__panel.admin__panel--active');
    if (!active) return;
    const tables = active.querySelectorAll('table.admin__table');
    tables.forEach(function (table) {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const wrap = table.closest('.admin__table-wrap') || table.parentNode;
      if (!wrap) return;
      if (tbodyLooksLoading(tbody)) {
        renderSkeletons(wrap, 5);
      } else {
        removeSkeletons(wrap);
      }
    });
  }

  // Observer dedicado: quando tbody recebe <tr>s, remove skeletons da wrap.
  function setupSkeletonObserver() {
    const obs = new MutationObserver(function (muts) {
      if (!isMobile()) return;
      muts.forEach(function (m) {
        const target = m.target;
        if (!(target instanceof HTMLElement)) return;
        // Mudança em tbody -> reavaliar
        if (target.tagName === 'TBODY' || (target.closest && target.closest('tbody'))) {
          const tbody = target.tagName === 'TBODY' ? target : target.closest('tbody');
          if (!tbody) return;
          const table = tbody.closest('table.admin__table');
          if (!table) return;
          const wrap = table.closest('.admin__table-wrap') || table.parentNode;
          if (!wrap) return;
          if (tbodyLooksLoading(tbody)) {
            renderSkeletons(wrap, 5);
          } else {
            removeSkeletons(wrap);
          }
        }
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
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

    // FAB
    const fab = getFab();
    if (fab) fab.addEventListener('click', onFabClick);
    syncFab();

    // Microanimações + haptics (etapa 5.1)
    setupHapticPause();
    setupModalEntryWatcher();

    // Skeleton loading (etapa 5.2)
    setupSkeletonObserver();
    maybeShowSkeletonsForActivePanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
