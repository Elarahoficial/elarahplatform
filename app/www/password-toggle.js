/* =============================================================
   ELARAH — Olhinho de mostrar/ocultar senha
   -------------------------------------------------------------
   Põe um botão de olho dentro do campo de senha. Sem ele, quem
   digita errado só descobre no erro de login — e em celular, com
   teclado que troca letra, isso acontece o tempo todo.

   Uso:
     ElarahPasswordToggle.mount(input)      // liga num campo
     ElarahPasswordToggle.upgradeAll(root)  // liga em todos do escopo

   Qualquer <input type="password"> é ligado sozinho no load. Pra
   deixar um campo de fora, marque com data-no-pw-toggle.
   ============================================================= */

(function () {
  'use strict';

  // Olho aberto (senha escondida: "clique pra ver") e olho cortado
  // (senha à mostra: "clique pra esconder").
  const OLHO = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z"/>' +
    '<circle cx="12" cy="12" r="3.2"/></svg>';

  const OLHO_CORTADO = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9.9 5.7A9.9 9.9 0 0 1 12 5.5c7 0 10.5 6.5 10.5 6.5a17.6 17.6 0 0 1-3.5 4.3"/>' +
    '<path d="M6.4 7.5A17.4 17.4 0 0 0 1.5 12S5 18.5 12 18.5c1.6 0 3-.3 4.3-.9"/>' +
    '<path d="M9.8 9.9a3.2 3.2 0 0 0 4.4 4.4"/>' +
    '<line x1="3" y1="3" x2="21" y2="21"/></svg>';

  const CSS = [
    '.epw{position:relative;display:block;width:100%;}',
    '.epw__btn{position:absolute;top:50%;transform:translateY(-50%);right:6px;display:flex;align-items:center;',
      'justify-content:center;width:36px;height:36px;padding:0;border:none;background:transparent;color:#9a8b7d;',
      'cursor:pointer;border-radius:8px;line-height:0;}',
    '.epw__btn:hover{color:#5f5348;background:rgba(0,0,0,.04);}',
    '.epw__btn:focus-visible{outline:2px solid #F27623;outline-offset:1px;}',
    // O olho fica por cima do campo, então o texto precisa parar antes.
    '.epw__input{padding-right:44px !important;}',
  ].join('');

  let cssInjected = false;
  function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    const el = document.createElement('style');
    el.setAttribute('data-elarah-pw', '');
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  const montados = new WeakSet();

  function mount(input) {
    if (!input || input.tagName !== 'INPUT') return null;
    if (montados.has(input)) return null;
    if (input.hasAttribute('data-no-pw-toggle')) return null;
    if ((input.type || '').toLowerCase() !== 'password') return null;
    injectCss();
    montados.add(input);

    const wrap = document.createElement('span');
    wrap.className = 'epw';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add('epw__input');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'epw__btn';
    btn.tabIndex = 0;

    function pintar() {
      const visivel = input.type === 'text';
      btn.innerHTML = visivel ? OLHO_CORTADO : OLHO;
      btn.setAttribute('aria-label', visivel ? 'Ocultar senha' : 'Mostrar senha');
      btn.setAttribute('aria-pressed', visivel ? 'true' : 'false');
      btn.title = visivel ? 'Ocultar senha' : 'Mostrar senha';
    }

    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      // Guarda onde o cursor estava: trocar o type reposiciona ele no
      // fim em vários navegadores, e quem estava corrigindo uma letra no
      // meio perderia o lugar.
      let ini = null, fim = null;
      try { ini = input.selectionStart; fim = input.selectionEnd; } catch (e) { /* type=password nega em alguns navegadores */ }
      input.type = input.type === 'password' ? 'text' : 'password';
      pintar();
      try {
        input.focus({ preventScroll: true });
        if (ini !== null) input.setSelectionRange(ini, fim);
      } catch (e) { /* sem seleção: só o foco já basta */ }
    });

    pintar();
    wrap.appendChild(btn);
    return btn;
  }

  function upgradeAll(root) {
    const scope = root || document;
    const nodes = scope.querySelectorAll('input[type="password"]:not(.epw__input)');
    Array.prototype.forEach.call(nodes, mount);
  }

  window.ElarahPasswordToggle = { mount: mount, upgradeAll: upgradeAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { upgradeAll(); });
  } else {
    upgradeAll();
  }
})();
