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
  // SWIPE ACTIONS EM CARDS (etapa 5.3)
  // -----------------------------------------------------------
  // Cards de prospects ganham swipe esquerda pra revelar ações.
  // Aplicado SÓ em linhas que têm botão com data-prospect-id —
  // section headers e linhas sem id são ignorados.
  // ===========================================================

  const SWIPE_THRESHOLD = 60;     // px pra considerar revelado
  const SWIPE_MAX       = 120;    // distância em que actions ficam
  let _openSwipeRow = null;       // referência ao tr atualmente aberto

  function closeOpenSwipe() {
    if (!_openSwipeRow) return;
    const tr = _openSwipeRow;
    tr.classList.remove('is-revealed');
    tr.classList.remove('is-swiping');
    tr.style.transform = '';
    _openSwipeRow = null;
  }

  function findProspectIdInRow(tr) {
    if (!tr) return null;
    const btn = tr.querySelector('[data-prospect-id]');
    if (!btn) return null;
    return btn.getAttribute('data-prospect-id');
  }

  function findRowActionBtn(tr, action) {
    if (!tr) return null;
    return tr.querySelector('[data-prospect-action="' + action + '"][data-prospect-id]');
  }

  function buildSwipeActions(tr) {
    // Detecta quais ações estão disponíveis pra esta linha
    const editBtn = findRowActionBtn(tr, 'edit');
    if (!editBtn) return null;  // sem id/edit, não monta swipe

    const wrap = document.createElement('div');
    wrap.className = 'm-swipe-actions';
    wrap.setAttribute('aria-hidden', 'true');

    // Action: Editar
    const editAction = document.createElement('button');
    editAction.type = 'button';
    editAction.className = 'm-swipe-action m-swipe-action--edit';
    editAction.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
      '<span>Editar</span>';
    editAction.addEventListener('click', function (ev) {
      ev.stopPropagation();
      hapticCommit();
      closeOpenSwipe();
      // Dispara o click original do botão real
      editBtn.click();
    });
    wrap.appendChild(editAction);

    // Action: Promover (só se botão promote existir — promote é dinâmico
    // dependendo do status. Se não tiver, pula).
    const promoteBtn = findRowActionBtn(tr, 'promote') || tr.querySelector('button[data-prospect-action="promote"]');
    if (promoteBtn) {
      const promoteAction = document.createElement('button');
      promoteAction.type = 'button';
      promoteAction.className = 'm-swipe-action m-swipe-action--promote';
      promoteAction.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 15 8.5 22 9.3 17 14l1.5 7L12 17.5 5.5 21 7 14 2 9.3 9 8.5z"/></svg>' +
        '<span>Promover</span>';
      promoteAction.addEventListener('click', function (ev) {
        ev.stopPropagation();
        hapticCommit();
        closeOpenSwipe();
        promoteBtn.click();
      });
      wrap.appendChild(promoteAction);
    }

    return wrap;
  }

  function enableSwipeForRow(tr) {
    if (!tr || tr.classList.contains('m-swipe-enabled')) return;
    // Pula linhas que claramente não são prospects (section header tem colspan)
    const tds = tr.querySelectorAll(':scope > td');
    if (tds.length === 1 && tds[0].getAttribute('colspan')) return;
    // TODO: se não conseguir achar prospect id, NÃO habilita swipe
    const pid = findProspectIdInRow(tr);
    if (!pid) return;

    const actions = buildSwipeActions(tr);
    if (!actions) return;
    tr.classList.add('m-swipe-enabled');
    tr.appendChild(actions);

    // Estado por-row do swipe
    const state = { startX: 0, startY: 0, dx: 0, dy: 0, active: false, decided: false, isSwipe: false };

    tr.addEventListener('touchstart', function (e) {
      if (!isMobile()) return;
      // Fecha qualquer card aberto que não seja este
      if (_openSwipeRow && _openSwipeRow !== tr) {
        closeOpenSwipe();
      }
      const t = e.touches[0];
      state.startX = t.clientX;
      state.startY = t.clientY;
      state.dx = 0;
      state.dy = 0;
      state.active = true;
      state.decided = false;
      state.isSwipe = false;
      tr.classList.add('is-swiping');
    }, { passive: true });

    tr.addEventListener('touchmove', function (e) {
      if (!state.active) return;
      const t = e.touches[0];
      state.dx = t.clientX - state.startX;
      state.dy = t.clientY - state.startY;
      // Decide direção apenas 1 vez por gesture
      if (!state.decided) {
        if (Math.abs(state.dx) < 6 && Math.abs(state.dy) < 6) return;
        if (Math.abs(state.dy) > Math.abs(state.dx)) {
          // Scroll vertical: cancela o swipe
          state.active = false;
          tr.classList.remove('is-swiping');
          return;
        }
        state.decided = true;
        state.isSwipe = true;
      }
      if (!state.isSwipe) return;
      // Limita a -SWIPE_MAX e ignora swipe pra direita quando fechado
      let translate = state.dx;
      if (translate > 0) translate = 0;
      if (translate < -SWIPE_MAX) translate = -SWIPE_MAX;
      tr.style.transform = 'translateX(' + translate + 'px)';
    }, { passive: true });

    tr.addEventListener('touchend', function () {
      if (!state.active) return;
      state.active = false;
      tr.classList.remove('is-swiping');
      if (!state.isSwipe) return;
      if (state.dx < -SWIPE_THRESHOLD) {
        // Revela
        tr.style.transform = 'translateX(-' + SWIPE_MAX + 'px)';
        tr.classList.add('is-revealed');
        _openSwipeRow = tr;
        hapticTap();
      } else {
        // Volta
        tr.style.transform = '';
        tr.classList.remove('is-revealed');
        if (_openSwipeRow === tr) _openSwipeRow = null;
      }
    }, { passive: true });

    tr.addEventListener('touchcancel', function () {
      state.active = false;
      tr.classList.remove('is-swiping');
      tr.style.transform = '';
      tr.classList.remove('is-revealed');
      if (_openSwipeRow === tr) _openSwipeRow = null;
    }, { passive: true });
  }

  // Aplica swipe em todas as rows de prospects no DOM
  function scanProspectSwipe() {
    if (!isMobile()) return;
    const panel = document.getElementById('panel-prospects');
    if (!panel) return;
    const rows = panel.querySelectorAll('table.admin__table tbody > tr');
    rows.forEach(enableSwipeForRow);
  }

  // Tap fora do card aberto: fecha
  function setupSwipeOutsideClose() {
    document.addEventListener('click', function (e) {
      if (!_openSwipeRow) return;
      const tr = _openSwipeRow;
      if (tr.contains(e.target)) return;
      closeOpenSwipe();
    }, true);
    // Touch também (alguns browsers não disparam click em scroll)
    document.addEventListener('touchstart', function (e) {
      if (!_openSwipeRow) return;
      const tr = _openSwipeRow;
      if (tr.contains(e.target)) return;
      closeOpenSwipe();
    }, { passive: true });
  }

  function setupSwipeObserver() {
    const obs = new MutationObserver(function (muts) {
      if (!isMobile()) return;
      let needsScan = false;
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.tagName === 'TR' && n.closest('#panel-prospects')) {
            needsScan = true;
            break;
          }
          if (n.querySelector && n.querySelector('#panel-prospects tbody tr')) {
            needsScan = true;
            break;
          }
        }
        if (needsScan) break;
      }
      if (needsScan) {
        // Debounce leve
        clearTimeout(setupSwipeObserver._t);
        setupSwipeObserver._t = setTimeout(scanProspectSwipe, 80);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ===========================================================
  // PULL-TO-REFRESH (etapa 5.4)
  // -----------------------------------------------------------
  // Indicador flutuante que aparece quando o usuário puxa pra
  // baixo no topo da página. Soltar passando do threshold dispara
  // window.location.reload() (não há função global de reload
  // exposta pelo admin.js — TODO se algum dia for criada).
  // ===========================================================

  const PTR_THRESHOLD = 60;
  const PTR_MAX       = 80;

  function ensurePtrIndicator() {
    let ptr = document.getElementById('m-ptr');
    if (ptr) return ptr;
    ptr = document.createElement('div');
    ptr.id = 'm-ptr';
    ptr.className = 'm-ptr';
    ptr.setAttribute('aria-hidden', 'true');
    ptr.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>' +
        '<path d="M3 3v5h5"/>' +
        '<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>' +
        '<path d="M16 16h5v5"/>' +
      '</svg>';
    document.body.appendChild(ptr);
    return ptr;
  }

  function enablePullToRefresh(onRefresh) {
    const ptr = ensurePtrIndicator();
    const state = {
      startY: 0,
      dy: 0,
      active: false,
      decided: false,
      isPull: false,
      refreshing: false
    };

    function atScrollTop() {
      return (window.scrollY || window.pageYOffset || 0) <= 0;
    }

    document.addEventListener('touchstart', function (e) {
      if (!isMobile()) return;
      if (state.refreshing) return;
      if (!atScrollTop()) return;
      // Não interfere se touch começa num card com swipe aberto
      if (_openSwipeRow && _openSwipeRow.contains(e.target)) return;
      const t = e.touches[0];
      state.startY = t.clientY;
      state.dy = 0;
      state.active = true;
      state.decided = false;
      state.isPull = false;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!state.active) return;
      if (state.refreshing) return;
      const t = e.touches[0];
      state.dy = t.clientY - state.startY;
      if (!state.decided) {
        if (state.dy < 8) return;  // ainda não decidiu direção
        // Só ativa pull se estamos no topo e movimento é descendente
        if (!atScrollTop()) {
          state.active = false;
          return;
        }
        state.decided = true;
        state.isPull = true;
      }
      if (!state.isPull) return;
      const dragged = Math.min(state.dy * 0.5, PTR_MAX);
      if (dragged > 0) {
        ptr.classList.add('is-pulling');
        ptr.style.top = (20 + (dragged - PTR_THRESHOLD)) + 'px';
        if (dragged < PTR_THRESHOLD) {
          ptr.style.top = (-60 + dragged) + 'px';
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', function () {
      if (!state.active) return;
      state.active = false;
      if (!state.isPull) return;
      const dragged = Math.min(state.dy * 0.5, PTR_MAX);
      if (dragged >= PTR_THRESHOLD) {
        // Dispara refresh
        ptr.classList.add('is-pulling');
        ptr.classList.add('is-refreshing');
        ptr.style.top = '';  // volta pra "20px" da classe
        state.refreshing = true;
        hapticCommit();
        // Pequeno delay pra usuário ver o spinner
        setTimeout(function () {
          try { onRefresh(); }
          catch (_) { window.location.reload(); }
        }, 250);
      } else {
        // Cancela
        ptr.classList.remove('is-pulling');
        ptr.style.top = '';
      }
    }, { passive: true });

    document.addEventListener('touchcancel', function () {
      state.active = false;
      if (state.refreshing) return;
      ptr.classList.remove('is-pulling');
      ptr.style.top = '';
    }, { passive: true });
  }

  // Função de refresh: tenta achar helper global; senão reload.
  function ptrRefreshHandler() {
    // Procura função global custom (futura)
    const candidates = ['reloadProspects', 'fetchProspects', 'refreshAdmin'];
    for (const name of candidates) {
      if (typeof window[name] === 'function') {
        try {
          window[name]();
          // Limpa indicador depois de 800ms (não temos await pra terminar)
          setTimeout(hidePtr, 800);
          return;
        } catch (_) { /* tenta próximo */ }
      }
    }
    // Fallback: reload da página
    window.location.reload();
  }

  function hidePtr() {
    const ptr = document.getElementById('m-ptr');
    if (!ptr) return;
    ptr.classList.remove('is-refreshing');
    ptr.classList.remove('is-pulling');
    ptr.style.top = '';
  }

  // ===========================================================
  // VIRTUALIZAÇÃO DE LISTAS LONGAS (etapa 6.1)
  // -----------------------------------------------------------
  // Pra listas mobile com >50 linhas, esconde tudo após N (batch=30)
  // e usa IntersectionObserver no sentinel pra revelar mais. Reduz
  // o custo de layout/paint em tabelas grandes (tipo prospects).
  // ===========================================================

  const VIRT_THRESHOLD = 50;
  const VIRT_BATCH     = 30;
  const VIRT_HIDDEN_ATTR = 'data-m-virt-hidden';
  const VIRT_DONE_ATTR   = 'data-m-virt-applied';

  function virtualizeList(tbody, threshold, batch) {
    if (!tbody) return;
    if (!isMobile()) return;
    if (window.__elarahMobileNoVirt) return;
    threshold = threshold || VIRT_THRESHOLD;
    batch     = batch || VIRT_BATCH;
    const rows = tbody.querySelectorAll(':scope > tr');
    if (rows.length <= threshold) {
      // Lista pequena: desfaz qualquer virt anterior
      unvirtualize(tbody);
      return;
    }
    if (tbody.getAttribute(VIRT_DONE_ATTR) === '1') {
      // Já virtualizado: reaplica caso novas linhas tenham chegado
      reapplyVirt(tbody, batch);
      return;
    }
    tbody.setAttribute(VIRT_DONE_ATTR, '1');
    // Esconde tudo a partir do índice `batch`
    rows.forEach(function (tr, i) {
      if (i >= batch) {
        tr.style.display = 'none';
        tr.setAttribute(VIRT_HIDDEN_ATTR, '1');
      }
    });
    addOrUpdateSentinel(tbody, batch);
  }

  function reapplyVirt(tbody, batch) {
    const rows = tbody.querySelectorAll(':scope > tr:not([' + VIRT_HIDDEN_ATTR + '])');
    // Conta quantas já estão visíveis. Pra novas linhas, esconde se passou.
    let visibleCount = 0;
    tbody.querySelectorAll(':scope > tr').forEach(function (tr) {
      if (tr.getAttribute(VIRT_HIDDEN_ATTR) === '1') return;
      visibleCount++;
    });
    // Não mexe nas que já estão visíveis. Adiciona sentinel se ainda houver hidden.
    addOrUpdateSentinel(tbody);
  }

  function unvirtualize(tbody) {
    tbody.removeAttribute(VIRT_DONE_ATTR);
    tbody.querySelectorAll(':scope > tr[' + VIRT_HIDDEN_ATTR + ']').forEach(function (tr) {
      tr.style.display = '';
      tr.removeAttribute(VIRT_HIDDEN_ATTR);
    });
    const sentinel = tbody.querySelector(':scope > tr.m-virt-sentinel');
    if (sentinel && sentinel.__io) {
      try { sentinel.__io.disconnect(); } catch (_) {}
    }
    if (sentinel) sentinel.remove();
  }

  function addOrUpdateSentinel(tbody, batch) {
    batch = batch || VIRT_BATCH;
    // Se ainda há linhas escondidas, garantimos um sentinel ao fim
    const hidden = tbody.querySelectorAll(':scope > tr[' + VIRT_HIDDEN_ATTR + ']');
    if (!hidden.length) {
      const old = tbody.querySelector(':scope > tr.m-virt-sentinel');
      if (old) {
        if (old.__io) try { old.__io.disconnect(); } catch (_) {}
        old.remove();
      }
      return;
    }
    let sentinel = tbody.querySelector(':scope > tr.m-virt-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('tr');
      sentinel.className = 'm-virt-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'height:1px;background:transparent;border:none;';
      // td filho com colspan grande pra cobrir
      const td = document.createElement('td');
      td.setAttribute('colspan', '20');
      td.style.cssText = 'padding:0;border:none;background:transparent;';
      sentinel.appendChild(td);
    }
    // Move sentinel pra antes da primeira linha escondida
    const firstHidden = hidden[0];
    tbody.insertBefore(sentinel, firstHidden);

    if (!sentinel.__io) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          // Revela o próximo batch
          const stillHidden = tbody.querySelectorAll(':scope > tr[' + VIRT_HIDDEN_ATTR + ']');
          for (let i = 0; i < batch && i < stillHidden.length; i++) {
            stillHidden[i].style.display = '';
            stillHidden[i].removeAttribute(VIRT_HIDDEN_ATTR);
          }
          // Re-posiciona sentinel
          addOrUpdateSentinel(tbody, batch);
        });
      }, { rootMargin: '300px 0px' });
      io.observe(sentinel);
      sentinel.__io = io;
    }
  }

  function scanVirtualize() {
    if (!isMobile()) return;
    if (window.__elarahMobileNoVirt) return;
    const tbodies = document.querySelectorAll('table.admin__table tbody');
    tbodies.forEach(function (tb) { virtualizeList(tb); });
  }

  function setupVirtualizeObserver() {
    let t = null;
    const obs = new MutationObserver(function (muts) {
      if (!isMobile()) return;
      if (window.__elarahMobileNoVirt) return;
      let touchedTbody = null;
      for (const m of muts) {
        const target = m.target;
        if (target && target.tagName === 'TBODY' && target.closest('table.admin__table')) {
          touchedTbody = target;
          break;
        }
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.tagName === 'TR' && n.parentNode && n.parentNode.tagName === 'TBODY') {
            touchedTbody = n.parentNode;
            break;
          }
        }
        if (touchedTbody) break;
      }
      if (!touchedTbody) return;
      // Se foi mutation causada pelo próprio virtualize (sentinel sendo movido),
      // ignora pra evitar loop. Sentinel tem classe m-virt-sentinel.
      if (touchedTbody.getAttribute(VIRT_DONE_ATTR) === '1') {
        // Re-aplica suave (debounce)
        clearTimeout(t);
        t = setTimeout(function () {
          // Se o tbody foi RE-renderizado do zero pelo admin.js, o atributo
          // pode persistir mas as linhas são novas — re-virtualizamos.
          const stillHasHidden = touchedTbody.querySelector('[' + VIRT_HIDDEN_ATTR + ']');
          if (!stillHasHidden) {
            // Tbody novo: limpa marker e re-virtualiza
            touchedTbody.removeAttribute(VIRT_DONE_ATTR);
          }
          virtualizeList(touchedTbody);
        }, 80);
        return;
      }
      clearTimeout(t);
      t = setTimeout(function () { virtualizeList(touchedTbody); }, 80);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // Expor pra debug
  window.elarahVirtualizeList = virtualizeList;
  window.elarahScanVirtualize = scanVirtualize;

  // ===========================================================
  // OTIMIZAÇÃO DE SCROLL E DEBOUNCE (etapa 6.2)
  // -----------------------------------------------------------
  // - Helper de debounce 200ms exposto em window.elarahMobileDebounce
  // - Aplica debounce em campos de busca/filtro do mobile (sem
  //   substituir handlers existentes — escutamos `input` em paralelo
  //   com data-debounce-applied como guard de idempotência)
  // - Listeners de scroll/touch passivos por padrão (já estávamos
  //   passando { passive: true } onde possível). Mantemos auditoria
  //   leve aqui só pra documentar a regra.
  // ===========================================================

  function mobileDebounce(fn, ms) {
    if (typeof ms !== 'number') ms = 200;
    let t = null;
    return function debounced() {
      const ctx = this;
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        try { fn.apply(ctx, args); } catch (_) {}
      }, ms);
    };
  }
  window.elarahMobileDebounce = mobileDebounce;

  // Aplica um listener ADICIONAL com debounce em inputs de busca no
  // mobile. Não substitui o listener original do admin.js — apenas
  // adiciona um "input" debounced que dispara um change sintético
  // suave quando o usuário para de digitar. Como o admin.js já
  // escuta `input` no input em tempo real, na prática isso evita
  // disparos extras desnecessários — adicionamos só pra hooks
  // futuros baseados em data-mobile-debounced.
  //
  // ESTRATÉGIA SEGURA: detectamos inputs de busca/filtro e marcamos
  // com data-mobile-debounced; quem quiser pode consumir o evento
  // customizado 'm-debounced-input' que disparamos.
  function setupSearchDebounce() {
    if (!isMobile()) return;
    const inputs = document.querySelectorAll(
      'input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"], input[placeholder*="Filtrar"], input[placeholder*="filtrar"]'
    );
    inputs.forEach(function (inp) {
      if (inp.getAttribute('data-debounce-applied') === '1') return;
      inp.setAttribute('data-debounce-applied', '1');
      const debounced = mobileDebounce(function () {
        // Dispara evento custom; quem quiser pode escutar.
        try {
          inp.dispatchEvent(new CustomEvent('m-debounced-input', {
            bubbles: true,
            detail: { value: inp.value }
          }));
        } catch (_) { /* IE/old: ignora */ }
      }, 200);
      inp.addEventListener('input', debounced, { passive: true });
    });
  }

  function setupSearchDebounceObserver() {
    const obs = new MutationObserver(function (muts) {
      if (!isMobile()) return;
      let added = false;
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.tagName === 'INPUT' || (n.querySelector && n.querySelector('input'))) {
            added = true;
            break;
          }
        }
        if (added) break;
      }
      if (added) {
        clearTimeout(setupSearchDebounceObserver._t);
        setupSearchDebounceObserver._t = setTimeout(setupSearchDebounce, 120);
      }
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

    // Swipe actions em cards de prospects (etapa 5.3)
    scanProspectSwipe();
    setupSwipeObserver();
    setupSwipeOutsideClose();

    // Pull-to-refresh (etapa 5.4)
    enablePullToRefresh(ptrRefreshHandler);

    // Virtualização de listas longas (etapa 6.1)
    scanVirtualize();
    setupVirtualizeObserver();

    // Debounce em campos de busca (etapa 6.2)
    setupSearchDebounce();
    setupSearchDebounceObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
