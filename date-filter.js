/* =====================================================================
   date-filter.js
   Controla a barra de chips de filtro por data ("Este fim de semana",
   "Próxima semana", "Próximo mês" + seletor de data específica).
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
      var dateChip = bar.querySelector('.date-filter__chip--date');
      var dateInput = bar.querySelector('#date-filter-input');
      var dateLabel = bar.querySelector('.date-filter__date-label');
      var clearBtn = bar.querySelector('#date-filter-clear');

      function resetVisual() {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        if (dateChip) dateChip.classList.remove('is-active');
        if (dateLabel) dateLabel.textContent = 'Escolher data';
        if (clearBtn) clearBtn.hidden = true;
      }

      function emit(range) {
        if (clearBtn) clearBtn.hidden = !range;
        onChange(range || null);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var wasActive = chip.classList.contains('is-active');
          resetVisual();
          if (dateInput) dateInput.value = '';
          if (wasActive) { emit(null); return; }
          chip.classList.add('is-active');
          emit(ElarahData.dateQuickRange(chip.getAttribute('data-date-range')));
        });
      });

      if (dateInput) {
        dateInput.addEventListener('change', function () {
          var v = dateInput.value; // 'aaaa-mm-dd'
          resetVisual();
          if (!v) { emit(null); return; }
          var p = v.split('-');
          var yy = Number(p[0]), mm = Number(p[1]) - 1, dd = Number(p[2]);
          if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
            emit(null);
            return;
          }
          if (dateChip) dateChip.classList.add('is-active');
          if (dateLabel) {
            dateLabel.textContent =
              String(dd).padStart(2, '0') + '/' + String(mm + 1).padStart(2, '0');
          }
          emit({
            startMs: new Date(yy, mm, dd, 0, 0, 0, 0).getTime(),
            endMs: new Date(yy, mm, dd, 23, 59, 59, 999).getTime(),
          });
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          resetVisual();
          if (dateInput) dateInput.value = '';
          emit(null);
        });
      }
    },
  };
})();
