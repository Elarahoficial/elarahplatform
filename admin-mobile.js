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
  // 6) Init
  // ===========================================================
  function init() {
    ensureMobileChrome();
    document.body.addEventListener('click', onNavClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
