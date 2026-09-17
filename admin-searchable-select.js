/* ============================================================
 * Busca em qualquer <select> do painel da Elarah
 * ------------------------------------------------------------
 * A dor: várias abas do admin têm listas longas (fornecedor,
 * experiência, bairro, categoria com 30 itens...) e o <select>
 * nativo só deixa rolar procurando com o olho. Aqui cada select
 * ganha um campo de texto: você digita, ele filtra, Enter escolhe.
 *
 * Como isso NÃO quebra o resto do painel:
 *   - O <select> original continua no DOM, com o mesmo id, as
 *     mesmas <option> e o mesmo .value. Ele só fica invisível.
 *     Todo o código que já existe (getElementById(...).value,
 *     addEventListener('change'), innerHTML = '<option>...')
 *     continua funcionando sem uma linha de mudança.
 *   - Escolher no menu novo faz `select.value = x` e dispara o
 *     evento 'change' — exatamente como o clique nativo faria.
 *   - Quando o código repopula o select (innerHTML), um
 *     MutationObserver refaz a lista sozinho.
 *   - Quando o código seta `select.value` na mão, um override do
 *     setter (por elemento) atualiza o texto do campo de busca.
 *
 * Quem entra e quem fica de fora:
 *   - Entra todo select de escolha única com MIN_OPTIONS ou mais
 *     opções — o limite existe porque transformar um "Sim/Não"
 *     em caixa de busca só atrapalha.
 *   - data-search="on"  força a busca mesmo com poucas opções.
 *   - data-search="off" mantém o select nativo.
 *   - Selects com <select multiple> ficam nativos.
 * ============================================================ */
(function () {
  'use strict';

  // Abaixo disso o select continua nativo (um "Sim/Não" não precisa
  // de busca). Para ligar a busca em todos, basta baixar pra 2.
  var MIN_OPTIONS = 4;

  // Menu compartilhado: só um combobox fica aberto por vez, então um
  // único elemento no body atende todos. Evita lixo no DOM quando uma
  // tabela é re-renderizada com dezenas de selects dentro.
  var menuEl = null;
  var current = null;   // combobox aberto no momento
  var wiredGlobals = false;

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Busca tolerante a acento e caixa: "ceramica" acha "Cerâmica",
  // "acao" acha "Ação". Sem isso a busca seria inútil em pt-BR.
  function normalize(s) {
    var v = String(s == null ? '' : s).toLowerCase().trim();
    try { v = v.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (_) {}
    return v;
  }

  function optionsOf(sel) {
    var out = [];
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      var grp = (opt.parentNode && opt.parentNode.tagName === 'OPTGROUP') ? opt.parentNode : null;
      out.push({
        index: i,
        value: opt.value,
        label: (opt.textContent || '').trim(),
        group: grp ? (grp.label || '').trim() : '',
        disabled: !!(opt.disabled || (grp && grp.disabled)),
      });
    }
    return out;
  }

  function selectableCount(sel) {
    var n = 0;
    for (var i = 0; i < sel.options.length; i++) if (!sel.options[i].disabled) n++;
    return n;
  }

  function shouldEnhance(sel) {
    if (!sel || sel.multiple || sel.__ssApi) return false;
    var flag = sel.getAttribute('data-search');
    if (flag === 'off') return false;
    // O seletor de repasse da tabela de Compras usa a cor de fundo pra
    // dizer o estado (verde = feito, laranja = pendente). Vira busca e
    // perde o sinal — e são só duas opções mesmo.
    if (sel.classList.contains('admin__sf-select')) return false;
    if (flag === 'on') return true;
    return selectableCount(sel) >= MIN_OPTIONS;
  }

  // ---------- menu compartilhado ----------

  function ensureMenu() {
    if (menuEl) return menuEl;
    menuEl = document.createElement('div');
    menuEl.className = 'admin__ss__menu';
    menuEl.setAttribute('role', 'listbox');
    document.body.appendChild(menuEl);
    // mousedown (não click): dispara antes do blur do input, senão o
    // blur fecharia o menu e o clique cairia no vazio.
    menuEl.addEventListener('mousedown', function (ev) {
      var item = ev.target && ev.target.closest ? ev.target.closest('.admin__ss__item') : null;
      if (!item || item.classList.contains('is-disabled')) return;
      ev.preventDefault();
      if (current) current.pick(Number(item.getAttribute('data-idx')));
    });
    return menuEl;
  }

  function positionMenu() {
    if (!current || !menuEl) return;
    // Select removido do DOM (tabela re-renderizada) — fecha e sai.
    if (!document.body.contains(current.input)) { closeCurrent(false); return; }
    var r = current.input.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    menuEl.style.minWidth = Math.max(r.width, 180) + 'px';
    menuEl.style.left = Math.max(8, Math.min(r.left, (window.innerWidth || 0) - r.width - 8)) + 'px';
    // Abre pra cima quando não cabe embaixo (selects no rodapé de modal).
    var below = vh - r.bottom - 8;
    var above = r.top - 8;
    if (below < 160 && above > below) {
      menuEl.style.maxHeight = Math.min(280, above) + 'px';
      menuEl.style.top = '';
      menuEl.style.bottom = (vh - r.top + 4) + 'px';
    } else {
      menuEl.style.maxHeight = Math.min(280, Math.max(120, below)) + 'px';
      menuEl.style.bottom = '';
      menuEl.style.top = (r.bottom + 4) + 'px';
    }
  }

  function closeCurrent(restoreText) {
    if (!current) return;
    var c = current;
    current = null;
    if (menuEl) menuEl.classList.remove('is-open');
    c.input.setAttribute('aria-expanded', 'false');
    c.typing = false;
    if (restoreText !== false) c.syncDisplay();
  }

  function wireGlobals() {
    if (wiredGlobals) return;
    wiredGlobals = true;
    document.addEventListener('mousedown', function (ev) {
      if (!current) return;
      if (current.wrap.contains(ev.target)) return;
      if (menuEl && menuEl.contains(ev.target)) return;
      closeCurrent(true);
    });
    // O menu é position:fixed, então precisa reposicionar quando a
    // página ou um container rolável se move (true = fase de captura,
    // pega scroll de qualquer ancestral).
    window.addEventListener('scroll', positionMenu, true);
    window.addEventListener('resize', positionMenu);
  }

  // ---------- rótulo acessível ----------

  function labelFor(sel) {
    var aria = sel.getAttribute('aria-label');
    if (aria) return aria;
    if (sel.id) {
      var lab = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(sel.id) : sel.id) + '"]');
      if (lab) return (lab.textContent || '').trim();
    }
    var wrapLabel = sel.closest ? sel.closest('label') : null;
    if (wrapLabel) {
      // Texto do label sem o conteúdo do próprio select.
      var clone = wrapLabel.cloneNode(true);
      var inner = clone.querySelector('select');
      if (inner && inner.parentNode) inner.parentNode.removeChild(inner);
      return (clone.textContent || '').trim();
    }
    // Barras de filtro do painel não têm <label>: o nome do campo mora
    // na primeira opção ("Todos os fornecedores", "Status fornecedor").
    // O select nativo também não tinha nome acessível nenhum aqui, então
    // isso é ganho líquido pra leitor de tela.
    var first = sel.options[0];
    if (first && !first.value) return (first.textContent || '').trim();
    return '';
  }

  // ---------- combobox ----------

  function enhance(sel) {
    var wrap = document.createElement('div');
    wrap.className = 'admin__ss';

    // O select carrega o layout dele no style inline (largura, margem,
    // flex). Isso vai pro wrapper, senão o campo novo desalinha o
    // formulário inteiro.
    var st = sel.style;
    ['width', 'minWidth', 'maxWidth', 'margin', 'marginTop', 'marginBottom',
     'marginLeft', 'marginRight', 'flex', 'flexGrow', 'flexBasis',
     'alignSelf', 'gridColumn'].forEach(function (p) {
      if (st[p]) wrap.style[p] = st[p];
    });
    wrap.style.display = (st.width === '100%') ? 'block' : 'inline-block';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'admin__ss__input';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.placeholder = sel.getAttribute('data-search-placeholder') || 'Digite para buscar…';
    // Fonte e padding são o que varia de verdade entre os selects do
    // painel (de .7rem/4px numa tabela a .92rem/14px num formulário).
    // Copiar os dois mantém cada campo com a altura que já tinha.
    if (st.fontSize) input.style.fontSize = st.fontSize;
    if (st.padding) input.style.padding = st.padding;
    input.style.paddingRight = '26px';   // espaço da setinha
    var lbl = labelFor(sel);
    if (lbl) input.setAttribute('aria-label', lbl);

    var caret = document.createElement('span');
    caret.className = 'admin__ss__caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '▾';

    // Um <select> sem largura declarada se auto-dimensiona pela opção
    // mais longa. Um <input> não faz isso — ele colapsaria. Este "sizer"
    // é um texto invisível de altura zero com a opção mais longa: ele
    // segura a largura do wrapper, e o input (width:100%) acompanha.
    // Puro CSS, então funciona mesmo com o campo dentro de modal fechado,
    // onde medir com getBoundingClientRect daria zero.
    var sizer = null;
    if (wrap.style.display === 'inline-block' && !wrap.style.width && !wrap.style.flex) {
      sizer = document.createElement('span');
      sizer.className = 'admin__ss__sizer';
      sizer.setAttribute('aria-hidden', 'true');
      if (st.fontSize) sizer.style.fontSize = st.fontSize;
      if (st.padding) sizer.style.padding = st.padding;
      sizer.style.paddingRight = '26px';
      // Nesse modo o input sai do fluxo e cobre o wrapper: se ficasse no
      // fluxo, a largura padrão de <input> (20 caracteres) mandaria mais
      // que o sizer e todo campo sairia do mesmo tamanho.
      wrap.classList.add('admin__ss--auto');
    }

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    if (sizer) wrap.appendChild(sizer);
    wrap.appendChild(input);
    wrap.appendChild(caret);
    sel.classList.add('admin__ss__native');
    sel.setAttribute('tabindex', '-1');

    var items = optionsOf(sel);
    var shown = [];        // índices de <option> visíveis no menu
    var activeIdx = -1;    // posição dentro de `shown`
    var selectedLabel = '';

    var api = {
      wrap: wrap,
      input: input,
      select: sel,
      typing: false,
      pick: pick,
      syncDisplay: syncDisplay,
      reload: reload,
    };
    sel.__ssApi = api;

    function render() {
      var menu = ensureMenu();
      var q = api.typing ? normalize(input.value) : '';
      var html = '';
      var lastGroup = null;
      shown = [];
      items.forEach(function (it) {
        if (q && normalize(it.label).indexOf(q) === -1 && normalize(it.value).indexOf(q) === -1) return;
        if (it.group && it.group !== lastGroup) {
          html += '<div class="admin__ss__group">' + escapeHtml(it.group) + '</div>';
        }
        lastGroup = it.group || null;
        var cls = 'admin__ss__item';
        if (it.disabled) cls += ' is-disabled';
        if (it.index === sel.selectedIndex) cls += ' is-selected';
        html += '<div class="' + cls + '" role="option" data-idx="' + it.index + '">' +
                escapeHtml(it.label || '—') + '</div>';
        if (!it.disabled) shown.push(it.index);
      });
      if (!shown.length) {
        html += '<div class="admin__ss__empty">' +
                (q ? 'Nada encontrado para “' + escapeHtml(input.value.trim()) + '”.'
                   : 'Nenhuma opção disponível ainda.') + '</div>';
      }
      menu.innerHTML = html;
      // Começa destacando o que já está escolhido (ou o primeiro, se
      // estiver filtrando) — assim Enter direto faz a coisa esperada.
      var pos = shown.indexOf(sel.selectedIndex);
      activeIdx = (!q && pos >= 0) ? pos : (shown.length ? 0 : -1);
      highlight();
    }

    function highlight() {
      if (!menuEl) return;
      var els = menuEl.querySelectorAll('.admin__ss__item:not(.is-disabled)');
      for (var i = 0; i < els.length; i++) {
        if (i === activeIdx) {
          els[i].classList.add('is-active');
          if (els[i].scrollIntoView) els[i].scrollIntoView({ block: 'nearest' });
        } else {
          els[i].classList.remove('is-active');
        }
      }
    }

    function open() {
      if (sel.disabled) return;
      if (current && current !== api) closeCurrent(true);
      current = api;
      ensureMenu().classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      render();
      positionMenu();
    }

    function pick(optIndex) {
      var opt = sel.options[optIndex];
      if (!opt || opt.disabled) return;
      var before = sel.value;
      sel.selectedIndex = optIndex;
      api.typing = false;
      closeCurrent(false);
      syncDisplay();
      // O 'change' é o que todo o painel já escuta. Igual ao nativo, só
      // dispara quando o valor realmente mudou.
      if (sel.value !== before) {
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      input.focus();
    }

    function syncDisplay() {
      var opt = sel.options[sel.selectedIndex];
      selectedLabel = opt ? (opt.textContent || '').trim() : '';
      if (!api.typing) input.value = selectedLabel;
      input.disabled = !!sel.disabled;
      wrap.classList.toggle('is-disabled', !!sel.disabled);
      input.title = selectedLabel;
    }

    function updateSizer() {
      if (!sizer) return;
      var longest = '';
      items.forEach(function (it) { if (it.label.length > longest.length) longest = it.label; });
      sizer.textContent = longest;
    }

    function reload() {
      items = optionsOf(sel);
      updateSizer();
      syncDisplay();
      if (current === api) { render(); positionMenu(); }
    }

    // Abre mostrando a lista inteira, com o texto atual selecionado —
    // digitar já substitui, que é o que a pessoa espera de uma busca.
    function openFresh() {
      api.typing = false;
      input.value = selectedLabel;
      input.select();
      open();
    }

    // O vaivém de clique do select nativo: clique abre, clique de novo
    // fecha. Sem o `justClosed`, o mousedown fecharia e o click logo em
    // seguida reabriria. E o click precisa abrir por conta própria
    // porque, com o campo JÁ focado, não vem evento de focus nenhum.
    var justClosed = false;
    input.addEventListener('mousedown', function () {
      if (current === api) { closeCurrent(true); justClosed = true; }
      else { justClosed = false; }
    });
    input.addEventListener('click', function () {
      if (!justClosed && current !== api) openFresh();
      justClosed = false;
    });
    input.addEventListener('focus', function () { openFresh(); });
    input.addEventListener('input', function () {
      api.typing = true;
      if (current !== api) open(); else { render(); positionMenu(); }
    });
    input.addEventListener('blur', function () {
      // Atraso pra deixar o mousedown do menu acontecer primeiro.
      setTimeout(function () {
        if (current === api) closeCurrent(true);
        else { api.typing = false; syncDisplay(); }
      }, 120);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (current !== api) { open(); return; }
        if (!shown.length) return;
        activeIdx = e.key === 'ArrowDown'
          ? Math.min(shown.length - 1, activeIdx + 1)
          : Math.max(0, activeIdx - 1);
        highlight();
      } else if (e.key === 'Enter') {
        if (current !== api) return;
        e.preventDefault();
        if (activeIdx >= 0 && shown[activeIdx] != null) pick(shown[activeIdx]);
      } else if (e.key === 'Escape') {
        if (current !== api) return;
        e.preventDefault();
        closeCurrent(true);
      } else if (e.key === 'Tab') {
        if (current === api) closeCurrent(true);
      }
    });

    // ----- sincronia com o código que já existe -----

    // innerHTML = '<option>...' (repopular fornecedores, experiências...)
    var mo = new MutationObserver(function () { reload(); });
    mo.observe(sel, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['disabled', 'selected', 'label'],
    });

    // select.value = 'x' / select.selectedIndex = n feitos na mão pelo
    // painel não disparam evento nenhum, então o texto do campo ficaria
    // velho. Envelopamos os setters só neste elemento.
    ['value', 'selectedIndex'].forEach(function (prop) {
      var d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
      if (!d || !d.set) return;
      Object.defineProperty(sel, prop, {
        configurable: true,
        enumerable: false,
        get: function () { return d.get.call(this); },
        set: function (v) { d.set.call(this, v); syncDisplay(); },
      });
    });

    sel.addEventListener('change', function () { syncDisplay(); });
    if (sel.form) sel.form.addEventListener('reset', function () { setTimeout(syncDisplay, 0); });
    // O select nativo está invisível: se o navegador reclamar dele num
    // form required, joga o foco no campo de busca pra pessoa ver onde é.
    sel.addEventListener('invalid', function () {
      setTimeout(function () { try { input.focus(); } catch (_) {} }, 0);
    });

    updateSizer();
    syncDisplay();
    return api;
  }

  // ---------- varredura ----------

  function scan() {
    var list = document.querySelectorAll('select');
    for (var i = 0; i < list.length; i++) {
      var sel = list[i];
      if (sel.__ssApi || !shouldEnhance(sel)) continue;
      try { enhance(sel); } catch (e) {
        console.warn('[admin] não consegui adicionar busca no select', sel.id || sel, e);
      }
    }
  }

  var queued = false;
  function queueScan() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; scan(); }, 60);
  }

  function start() {
    wireGlobals();
    scan();
    // Metade dos selects do painel nasce vazia e é preenchida depois
    // (fornecedores, experiências, bairros vêm do banco). O observer
    // pega tanto select novo quanto select que ganhou <option>.
    new MutationObserver(queueScan).observe(document.documentElement, {
      childList: true, subtree: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Exposto pro caso de precisar forçar na mão pelo console.
  window.AdminSearchableSelect = { scan: scan, enhance: enhance, MIN_OPTIONS: MIN_OPTIONS };
})();
