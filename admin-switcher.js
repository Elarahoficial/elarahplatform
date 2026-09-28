// =============================================================
// ELARAH — seletor de plataforma no topo do menu do admin
// -------------------------------------------------------------
// Fica embaixo de "Painel Admin" nos dois painéis:
//   • Elarah                → admin.html     (B2C, eventos fechados)
//   • Elarah Mental Health  → admin-mh.html  (corporativo, NR-1)
// Autocontido (injeta o próprio CSS) pra não depender de versão
// de admin.css em cache.
// =============================================================
(function () {
  'use strict';

  var PLATAFORMAS = [
    { id: 'elarah', nome: 'Elarah', desc: 'Experiências, aniversários e eventos fechados', href: 'admin.html', cor: '#F27623' },
    { id: 'mh', nome: 'Elarah Mental Health', desc: 'Empresas, NR-1 e cronogramas corporativos', href: 'admin-mh.html', cor: '#8fb3a0' }
  ];

  var CSS =
    '.plat-sw{position:relative;margin-top:12px}' +
    '.plat-sw__btn{width:100%;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);' +
      'color:#fff;border-radius:10px;padding:8px 10px;font:inherit;font-size:.82rem;font-weight:600;cursor:pointer;text-align:left}' +
    '.plat-sw__btn:hover{background:rgba(255,255,255,.14)}' +
    '.plat-sw i.plat-sw__dot{display:block;width:9px;height:9px;border-radius:50%;flex-shrink:0}' +
    '.plat-sw__btn em.nm{display:block;font-style:normal;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.plat-sw__btn svg{flex-shrink:0;transition:transform .15s}' +
    '.plat-sw.is-open .plat-sw__btn svg{transform:rotate(180deg)}' +
    '.plat-sw__menu{display:none;position:absolute;left:0;right:-40px;top:calc(100% + 6px);background:#fff;color:#1a1a1a;border-radius:12px;' +
      'box-shadow:0 12px 32px rgba(0,0,0,.28);padding:6px;z-index:50}' +
    '.plat-sw.is-open .plat-sw__menu{display:block}' +
    '.plat-sw__opt{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:8px;text-decoration:none;color:inherit}' +
    '.plat-sw__opt:hover{background:#f4f2ee}' +
    '.plat-sw__opt i.dot{display:block;width:10px;height:10px;border-radius:50%;margin-top:5px;flex-shrink:0}' +
    '.plat-sw__opt strong{display:block;font-size:.86rem;color:#1a1a1a}' +
    '.plat-sw__opt em{display:block;font-style:normal;font-size:.74rem;color:#777;margin-top:1px;line-height:1.3}' +
    '.plat-sw__opt.is-cur{background:#f4f2ee}' +
    '.plat-sw__opt b.ok{margin-left:auto;color:#1c7a43;font-weight:700}' +
    '@media (max-width:768px){.plat-sw__btn em.nm,.plat-sw__btn svg{display:none}.plat-sw__btn{justify-content:center;padding:8px 0}' +
      '.plat-sw__menu{left:0;right:auto;width:260px}}';

  function atual() {
    return /admin-mh(\.html)?$/i.test(location.pathname) ? 'mh' : 'elarah';
  }

  function montar() {
    var logo = document.querySelector('.admin__logo, .mh__logo');
    if (!logo || logo.querySelector('.plat-sw')) return;

    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var curId = atual();
    var cur = PLATAFORMAS.filter(function (p) { return p.id === curId; })[0];

    var wrap = document.createElement('div');
    wrap.className = 'plat-sw';
    wrap.innerHTML =
      '<button type="button" class="plat-sw__btn" aria-haspopup="true" aria-expanded="false" title="Trocar de plataforma">' +
        '<i class="plat-sw__dot" style="background:' + cur.cor + '"></i>' +
        '<em class="nm">' + cur.nome + '</em>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="plat-sw__menu" role="menu">' +
        PLATAFORMAS.map(function (p) {
          var isCur = p.id === curId;
          return '<a role="menuitem" class="plat-sw__opt' + (isCur ? ' is-cur' : '') + '" href="' + p.href + '">' +
            '<i class="dot" style="background:' + p.cor + '"></i>' +
            '<div><strong>' + p.nome + '</strong><em>' + p.desc + '</em></div>' +
            (isCur ? '<b class="ok">✓</b>' : '') +
          '</a>';
        }).join('') +
      '</div>';
    logo.appendChild(wrap);

    var btn = wrap.querySelector('.plat-sw__btn');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !wrap.classList.contains('is-open');
      wrap.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
