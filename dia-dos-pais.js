/* =============================================================
   ELARAH — Dia dos Pais
   1) Contador regressivo até o Dia dos Pais (2º domingo de agosto).
   2) Reflexão interativa: quantos Dias dos Pais provavelmente
      ainda restam — o argumento de presença acima de presente.
   3) Vitrine: experiências marcadas com "pai/pais" + curadoria
      de categorias com a cara dele (bartenderia, gastronomia,
      cerâmica), com variedade e limite. Não interfere em nenhuma
      outra página.
   ============================================================= */

(function () {
  'use strict';

  /* ---------- 0. Data do Dia dos Pais (2º domingo de agosto) ---------- */
  function fathersDay(year) {
    // 1º dia do mês
    const d = new Date(year, 7, 1); // agosto = mês 7
    const firstSundayOffset = (7 - d.getDay()) % 7; // dias até o 1º domingo
    const secondSunday = 1 + firstSundayOffset + 7;
    return new Date(year, 7, secondSunday, 0, 0, 0, 0);
  }
  function nextFathersDay() {
    const now = new Date();
    let target = fathersDay(now.getFullYear());
    // Se já passou (mais de 1 dia), usa o do ano seguinte.
    if (now.getTime() - target.getTime() > 24 * 60 * 60 * 1000) {
      target = fathersDay(now.getFullYear() + 1);
    }
    return target;
  }

  /* ---------- 1. Contador regressivo ---------- */
  (function initCountdown() {
    const root = document.getElementById('ddp-countdown');
    if (!root) return;
    const elDays = document.getElementById('ddp-cd-days');
    const elHrs  = document.getElementById('ddp-cd-hours');
    const elMin  = document.getElementById('ddp-cd-min');
    const elSec  = document.getElementById('ddp-cd-sec');
    const target = nextFathersDay();

    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        if (elDays) elDays.textContent = '00';
        if (elHrs) elHrs.textContent = '00';
        if (elMin) elMin.textContent = '00';
        if (elSec) elSec.textContent = '00';
        return;
      }
      const s = Math.floor(diff / 1000);
      const days = Math.floor(s / 86400);
      const hours = Math.floor((s % 86400) / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      if (elDays) elDays.textContent = pad(days);
      if (elHrs) elHrs.textContent = pad(hours);
      if (elMin) elMin.textContent = pad(mins);
      if (elSec) elSec.textContent = pad(secs);
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- 2. Reflexão interativa (Dias dos Pais que restam) ---------- */
  (function initCalc() {
    const input = document.getElementById('ddp-calc-input');
    const btn = document.getElementById('ddp-calc-btn');
    const result = document.getElementById('ddp-calc-result');
    if (!input || !btn || !result) return;

    // Horizonte otimista de convivência. Não é previsão — é um convite
    // a valorizar o tempo. Mantido generoso de propósito.
    const HORIZON = 90;

    const bigNum = document.getElementById('ddp-calc-num');
    const bigLabel = document.getElementById('ddp-calc-num-label');
    const note = document.getElementById('ddp-calc-note');

    function run() {
      const age = parseInt(input.value, 10);
      if (isNaN(age) || age < 1 || age > 120) {
        input.focus();
        input.style.borderColor = '#E7C489';
        return;
      }

      let remaining = HORIZON - age;
      let numText, labelText, noteHtml;

      if (remaining <= 0) {
        numText = 'Agora';
        labelText = 'É o único momento que existe';
        noteHtml = 'Cada dia ao lado dele já é um presente raro. ' +
          '<strong>Não deixe este Dia dos Pais passar em branco.</strong>';
      } else {
        remaining = Math.max(1, remaining);
        numText = '≈ ' + remaining;
        labelText = remaining === 1 ? 'Dia dos Pais pela frente' : 'Dias dos Pais pela frente';
        noteHtml = 'São <strong>cerca de ' + remaining + ' domingos de agosto</strong> — e nem todos ' +
          'vocês vão passar juntos. Os que já foram, ninguém devolve. ' +
          'Este, você ainda pode escolher <strong>viver</strong>.';
      }

      if (bigNum) bigNum.textContent = numText;
      if (bigLabel) bigLabel.textContent = labelText;
      if (note) note.innerHTML = noteHtml;
      result.classList.add('is-visible');

      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('ddp_calc_used', { age: age, remaining: remaining });
        }
      } catch (e) {}
    }

    btn.addEventListener('click', run);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); run(); }
      input.style.borderColor = '';
    });
  })();

  /* ---------- 3. Vitrine de experiências ---------- */
  (async function initGrid() {
    const grid    = document.getElementById('ddp-grid');
    const empty   = document.getElementById('ddp-empty');
    const countEl = document.getElementById('ddp-count');
    if (!grid) return;

    let experiences = [];
    try {
      if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
        experiences = await ElarahData.getVisibleExperiences();
      } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
        experiences = await ElarahData.getAllExperiences();
      }
    } catch (e) {
      console.warn('[Elarah DDP] falha ao carregar experiências', e);
      experiences = [];
    }

    // Originals exclusivos da home (hideFromCategorias) não aparecem aqui.
    experiences = (experiences || []).filter(function (e) {
      return e && e.hideFromCategorias !== true;
    });

    function normalize(s) {
      return String(s == null ? '' : s)
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
    }

    const CAMPAIGN = 'dia-dos-pais';

    function sortByDateThenName(a, b) {
      const ad = !!(a.data && String(a.data).trim());
      const bd = !!(b.data && String(b.data).trim());
      if (ad !== bd) return ad ? -1 : 1;
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
    }

    // ---- FONTE PRIMÁRIA: experiências marcadas na campanha pelo admin ----
    // (campo "Campanha" = Dia dos Pais no cadastro). Isso dá controle
    // total: aparece exatamente o que a Elarah escolher marcar.
    const tagged = experiences.filter(function (e) {
      return e && normalize(e.campanha) === CAMPAIGN;
    });

    let filtered;
    if (tagged.length) {
      filtered = tagged.slice().sort(sortByDateThenName);
      console.info('[Elarah DDP] vitrine por campanha (marcadas no admin):', filtered.length);
    } else {
      // ---- FALLBACK: enquanto nada estiver marcado, a página não fica
      // vazia. Prioriza menção a "pai/pais" no texto e completa com
      // curadoria de categorias com a cara dele (rodízio, variedade). ----
      const fatherRegex = /\b(pai|pais|papai)\b/;
      function matchesFather(exp) {
        if (!exp) return false;
        return fatherRegex.test(normalize(exp.nome)) ||
               fatherRegex.test(normalize(exp.categoria)) ||
               fatherRegex.test(normalize(exp.descricao));
      }
      const DAD_CATEGORIES = ['bartenderia', 'gastronomia', 'ceramica'];
      const MAX = 12;
      const seen = new Set();
      const picked = [];
      function add(exp) {
        if (!exp || exp.id == null) return;
        const k = String(exp.id);
        if (seen.has(k)) return;
        seen.add(k);
        picked.push(exp);
      }
      experiences.filter(matchesFather).forEach(add);
      if (picked.length < MAX) {
        const buckets = {};
        DAD_CATEGORIES.forEach(function (c) { buckets[c] = []; });
        experiences.forEach(function (exp) {
          const c = normalize(exp && exp.categoria);
          if (buckets[c]) buckets[c].push(exp);
        });
        Object.keys(buckets).forEach(function (c) { buckets[c].sort(sortByDateThenName); });
        let progress = true;
        while (picked.length < MAX && progress) {
          progress = false;
          for (let i = 0; i < DAD_CATEGORIES.length && picked.length < MAX; i++) {
            const bucket = buckets[DAD_CATEGORIES[i]];
            if (bucket && bucket.length) { add(bucket.shift()); progress = true; }
          }
        }
      }
      filtered = picked.slice(0, MAX);
      console.info('[Elarah DDP] vitrine por curadoria (fallback — nenhuma marcada):', filtered.length);
    }

    if (filtered.length === 0) {
      if (empty) empty.style.display = 'block';
      if (countEl) countEl.textContent = '';
      return;
    }
    if (countEl) {
      countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '') +
        ' selecionada' + (filtered.length !== 1 ? 's' : '');
    }

    function normalizeImg(p) {
      let s = String(p == null ? '' : p).trim();
      if (!s) return '';
      if (/^(https?:\/\/|\/)/i.test(s)) return s;
      s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
      const slash = s.lastIndexOf('/');
      const dir = slash >= 0 ? s.slice(0, slash + 1) : '';
      const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
      if (/^(assets|images|img)\//i.test(s)) {
        return dir.toLowerCase() + file;
      }
      return 'assets/' + file;
    }

    function escapeHtml(str) {
      if (str == null) return '';
      const d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }

    function createCard(exp) {
      const card = document.createElement('article');
      card.className = 'ddp-card';
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');

      // Foto exclusiva da campanha tem prioridade AQUI (só nesta aba);
      // a foto oficial (exp.imagem) segue no resto do site.
      const primary = normalizeImg(exp.campanhaImagem) || normalizeImg(exp.imagem);
      const catFallback = '';
      const initialSrc = primary || catFallback;
      const placeholder =
        '<div class="ddp-card__placeholder">' + escapeHtml(exp.categoria || 'Experiência') + '</div>';

      const mediaInner = initialSrc
        ? '<img src="' + escapeHtml(initialSrc) + '" alt="' + escapeHtml(exp.nome || '') + '" loading="lazy" ' +
          'data-cat-fb="' + escapeHtml(catFallback) + '" ' +
          'data-fb-html="' + placeholder.replace(/"/g, '&quot;') + '" ' +
          'onerror="' +
            'if(this.dataset.fbStep===\'final\'){return;}' +
            'if(!this.dataset.fbStep&&this.dataset.catFb&&this.src.indexOf(this.dataset.catFb)===-1){' +
              'this.dataset.fbStep=\'cat\';this.src=this.dataset.catFb;return;' +
            '}' +
            'this.dataset.fbStep=\'final\';this.outerHTML=this.dataset.fbHtml;' +
          '">'
        : placeholder;

      const data = (exp.data || '').trim();
      const horario = (exp.horario || '').trim();
      const bairro = (exp.bairro || '').trim();
      const precoRaw = (exp.preco || '').trim();
      const preco = (window.ElarahData && ElarahData.formatPrecoBR)
        ? ElarahData.formatPrecoBR(precoRaw)
        : precoRaw;

      const metaItems = [];
      if (data) {
        metaItems.push(
          '<span class="ddp-card__meta-item">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
          escapeHtml(data) + '</span>'
        );
      }
      if (horario) {
        metaItems.push(
          '<span class="ddp-card__meta-item">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          escapeHtml(horario) + '</span>'
        );
      }
      if (bairro) {
        metaItems.push(
          '<span class="ddp-card__meta-item">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
          escapeHtml(bairro) + '</span>'
        );
      }

      card.innerHTML =
        '<div class="ddp-card__media">' +
          '<span class="ddp-card__badge">Para o pai</span>' +
          mediaInner +
        '</div>' +
        '<div class="ddp-card__body">' +
          (exp.categoria ? '<span class="ddp-card__categoria">' + escapeHtml((window.ElarahData && ElarahData.categoriaLabel) ? ElarahData.categoriaLabel(exp) : exp.categoria) + '</span>' : '') +
          '<h3 class="ddp-card__title">' + escapeHtml(exp.nome || 'Experiência') + '</h3>' +
          (metaItems.length ? '<div class="ddp-card__meta">' + metaItems.join('') + '</div>' : '') +
          '<div class="ddp-card__price">' +
            (preco
              ? '<div><div class="ddp-card__price-label">A partir de</div>' + escapeHtml(preco) + '</div>'
              : '<div></div>'
            ) +
            '<span class="ddp-card__price-cta">Ver experiência →</span>' +
          '</div>' +
        '</div>';

      function go() {
        if (exp.id != null) {
          window.location.href = 'experiencia.html?id=' + encodeURIComponent(exp.id);
        }
      }
      card.addEventListener('click', go);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
      return card;
    }

    filtered.forEach(function (exp) { grid.appendChild(createCard(exp)); });

    try {
      if (window.ElarahAnalytics && ElarahAnalytics.track) {
        ElarahAnalytics.track('page_view', {
          page: 'dia-dos-pais',
          experiences_count: filtered.length,
        });
      }
    } catch (e) {}
  })();
})();
