/* =====================================================================
   date-filter.js
   Controla a barra de chips de filtro por data:
   - Chips rápidos: "Este fim de semana", "Próxima semana", "Próximo mês"
   - Botão "Escolher data" abre popover com De/Até (Até é opcional)
   Compartilhado entre a home e a página de categoria.

   Uso: ElarahDateFilter.init({ onChange: function (range) { ... } })
   range = { startMs, endMs } ou null (filtro limpo).
   ===================================================================== */
(function () {
  'use strict';

  window.ElarahDateFilter = {
    init: function (opts) {
      opts = opts || {};
      var onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};
      var bar = document.getElementById('date-filter');
      if (!bar || !window.ElarahData || typeof ElarahData.dateQuickRange !== 'function') {
        return;
      }

      var chips = bar.querySelectorAll('[data-date-range]');
      var customBtn = bar.querySelector('#date-filter-custom-btn');
      var customLabel = bar.querySelector('#date-filter-custom-label');
      var popover = bar.querySelector('#date-filter-popover');
      var fromInput = bar.querySelector('#date-filter-from');
      var toInput = bar.querySelector('#date-filter-to');
      var popApply = bar.querySelector('#date-filter-popover-apply');
      var popClear = bar.querySelector('#date-filter-popover-clear');
      var clearBtn = bar.querySelector('#date-filter-clear');

      function fmtBR(yyyymmdd) {
        if (!yyyymmdd) return '';
        var p = String(yyyymmdd).split('-');
        if (p.length !== 3) return '';
        return p[2] + '/' + p[1];
      }

      function resetVisual() {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        if (customBtn) customBtn.classList.remove('is-active');
        if (customLabel) customLabel.textContent = 'Escolher data';
        if (clearBtn) clearBtn.hidden = true;
      }

      function emit(range) {
        if (clearBtn) clearBtn.hidden = !range;
        onChange(range || null);
      }

      // No mobile a barra de chips usa overflow-x:auto + mask-image, que
      // recortam o popover (filho absoluto) e o deixam invisivel. Por isso,
      // no mobile, movemos o popover pro <body> e o exibimos como modal
      // centralizado, fora de qualquer container que faca clipping.
      var popoverHome = popover ? popover.parentNode : null;
      var backdrop = null;

      function isMobile() {
        return window.matchMedia('(max-width: 768px)').matches;
      }

      function closePopover() {
        if (popover) {
          popover.hidden = true;
          popover.classList.remove('date-filter__popover--modal');
          // Devolve o popover pro lugar original (caso tenha virado modal).
          if (popoverHome && popover.parentNode !== popoverHome) {
            popoverHome.appendChild(popover);
          }
        }
        if (backdrop) {
          backdrop.remove();
          backdrop = null;
        }
      }

      function openPopover() {
        if (!popover) return;
        if (isMobile()) {
          if (popover.parentNode !== document.body) {
            document.body.appendChild(popover);
          }
          popover.classList.add('date-filter__popover--modal');
          backdrop = document.createElement('div');
          backdrop.className = 'date-filter__backdrop';
          backdrop.addEventListener('click', closePopover);
          document.body.appendChild(backdrop);
        }
        popover.hidden = false;
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var wasActive = chip.classList.contains('is-active');
          resetVisual();
          if (fromInput) fromInput.value = '';
          if (toInput) toInput.value = '';
          closePopover();
          if (wasActive) { emit(null); return; }
          chip.classList.add('is-active');
          emit(ElarahData.dateQuickRange(chip.getAttribute('data-date-range')));
        });
      });

      if (customBtn) {
        customBtn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (popover && !popover.hidden) {
            closePopover();
          } else {
            openPopover();
          }
        });
      }

      if (popApply) {
        popApply.addEventListener('click', function () {
          var v1 = fromInput ? fromInput.value : '';
          var v2 = toInput ? toInput.value : '';
          if (!v1 && !v2) { alert('Escolha pelo menos a data inicial.'); return; }
          // Se so tem "Ate" e nao tem "De", trata "Ate" como o dia unico.
          if (!v1 && v2) { v1 = v2; v2 = ''; }
          var p1 = v1.split('-');
          var y1 = Number(p1[0]), m1 = Number(p1[1]) - 1, d1 = Number(p1[2]);
          if (!Number.isFinite(y1) || !Number.isFinite(m1) || !Number.isFinite(d1)) {
            alert('Data inicial invalida.');
            return;
          }
          var startMs = new Date(y1, m1, d1, 0, 0, 0, 0).getTime();
          var endMs;
          if (v2) {
            var p2 = v2.split('-');
            var y2 = Number(p2[0]), m2 = Number(p2[1]) - 1, d2 = Number(p2[2]);
            if (!Number.isFinite(y2) || !Number.isFinite(m2) || !Number.isFinite(d2)) {
              alert('Data final invalida.');
              return;
            }
            endMs = new Date(y2, m2, d2, 23, 59, 59, 999).getTime();
            if (endMs < startMs) {
              alert('A data final precisa ser depois da inicial.');
              return;
            }
          } else {
            // So um dia
            endMs = new Date(y1, m1, d1, 23, 59, 59, 999).getTime();
          }
          resetVisual();
          if (customBtn) customBtn.classList.add('is-active');
          if (customLabel) {
            customLabel.textContent = v2
              ? (fmtBR(v1) + ' – ' + fmtBR(v2))
              : fmtBR(v1);
          }
          closePopover();
          emit({ startMs: startMs, endMs: endMs });
        });
      }

      if (popClear) {
        popClear.addEventListener('click', function () {
          if (fromInput) fromInput.value = '';
          if (toInput) toInput.value = '';
          resetVisual();
          closePopover();
          emit(null);
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          if (fromInput) fromInput.value = '';
          if (toInput) toInput.value = '';
          resetVisual();
          closePopover();
          emit(null);
        });
      }

      // Fecha o popover ao clicar fora dele.
      document.addEventListener('click', function (ev) {
        if (!popover || popover.hidden) return;
        var t = ev.target;
        if (popover.contains(t) || (customBtn && customBtn.contains(t))) return;
        closePopover();
      });

      // ESC fecha o popover.
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && popover && !popover.hidden) closePopover();
      });
    },
  };
})();
