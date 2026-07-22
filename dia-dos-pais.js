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

    // A vitrine mostra EXCLUSIVAMENTE as experiências marcadas na campanha
    // pelo admin (campo "Campanha" = Dia dos Pais no cadastro). Sem
    // curadoria automática: aparece só o que a Elarah escolher marcar.
    // Enquanto nada estiver marcado, cai no estado "em breve".
    const filtered = experiences
      .filter(function (e) { return e && normalize(e.campanha) === CAMPAIGN; })
      .sort(sortByDateThenName);
    console.info('[Elarah DDP] vitrine por campanha (marcadas no admin):', filtered.length);

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

    // ---- Agrupa por categoria (evita fila de fotos repetidas) ----
    function catLabel(exp) {
      if (window.ElarahData && ElarahData.categoriaLabel) return ElarahData.categoriaLabel(exp);
      return exp.categoria || 'Experiência';
    }
    const GASTRO = 'gastronomia';
    const groups = {};
    filtered.forEach(function (exp) {
      const key = normalize(exp.categoria) || 'outros';
      if (!groups[key]) groups[key] = { key: key, label: catLabel(exp) || (exp.categoria || 'Experiência'), items: [] };
      groups[key].items.push(exp);
    });
    // Ordem: alfabético, com gastronomia por último (é o bloco grande).
    const keys = Object.keys(groups).sort(function (a, b) {
      if (a === GASTRO) return 1;
      if (b === GASTRO) return -1;
      return String(groups[a].label).localeCompare(String(groups[b].label), 'pt-BR');
    });

    grid.classList.add('ddp-experiences__grid--grouped');

    // Bloco especial da gastronomia: foto grande + lista de títulos
    // clicáveis (muitas experiências → escolha a preferida e reserve).
    function buildGastroBlock(g) {
      const wrap = document.createElement('div');
      wrap.className = 'ddp-gastro';

      let hero = '';
      for (let i = 0; i < g.items.length; i++) {
        const src = normalizeImg(g.items[i].campanhaImagem) || normalizeImg(g.items[i].imagem);
        if (src) { hero = src; break; }
      }
      if (!hero) hero = 'assets/gastronomiamolecular.jpg';

      const rows = g.items.map(function (exp) {
        const precoRaw = (exp.preco || '').trim();
        const preco = (window.ElarahData && ElarahData.formatPrecoBR) ? ElarahData.formatPrecoBR(precoRaw) : precoRaw;
        const meta = [exp.bairro, exp.data]
          .map(function (x) { return (x == null ? '' : String(x)).trim(); })
          .filter(Boolean).map(escapeHtml).join(' · ');
        return '<a class="ddp-gastro__item" href="experiencia.html?id=' + encodeURIComponent(exp.id) + '">' +
          '<span class="ddp-gastro__item-main">' +
            '<span class="ddp-gastro__item-name">' + escapeHtml(exp.nome || 'Experiência') + '</span>' +
            (meta ? '<span class="ddp-gastro__item-meta">' + meta + '</span>' : '') +
          '</span>' +
          (preco ? '<span class="ddp-gastro__item-price">' + escapeHtml(preco) + '</span>' : '') +
          '<span class="ddp-gastro__item-arrow" aria-hidden="true">→</span>' +
        '</a>';
      }).join('');

      wrap.innerHTML =
        '<div class="ddp-gastro__media">' +
          '<img src="' + escapeHtml(hero) + '" alt="Gastronomia — Dia dos Pais" loading="lazy">' +
          '<span class="ddp-gastro__media-badge">Gastronomia</span>' +
        '</div>' +
        '<div class="ddp-gastro__panel">' +
          '<p class="ddp-gastro__lead">São muitas aulas e jantares chegando. <strong>Escolha a preferida dele</strong> e clique pra reservar:</p>' +
          '<div class="ddp-gastro__list">' + rows + '</div>' +
        '</div>';
      return wrap;
    }

    keys.forEach(function (key) {
      const g = groups[key];
      const section = document.createElement('section');
      section.className = 'ddp-catgroup';
      const head = document.createElement('div');
      head.className = 'ddp-catgroup__head';
      head.innerHTML =
        '<h3 class="ddp-catgroup__title">' + escapeHtml(g.label) + '</h3>' +
        '<span class="ddp-catgroup__count">' + g.items.length + ' experiência' + (g.items.length !== 1 ? 's' : '') + '</span>';
      section.appendChild(head);

      if (key === GASTRO) {
        section.appendChild(buildGastroBlock(g));
      } else {
        const cg = document.createElement('div');
        cg.className = 'ddp-catgroup__grid';
        g.items.forEach(function (exp) { cg.appendChild(createCard(exp)); });
        section.appendChild(cg);
      }
      grid.appendChild(section);
    });

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
