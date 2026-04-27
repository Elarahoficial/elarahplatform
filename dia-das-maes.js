/* =============================================================
   ELARAH — Dia das Mães
   Filtra experiências cujo nome contenha "mãe" ou "mães" (sem
   acento, case-insensitive) e renderiza em cards temáticos
   premium. Não interfere com nenhuma outra página.
   ============================================================= */

(async function () {
  'use strict';

  const grid    = document.getElementById('ddm-grid');
  const empty   = document.getElementById('ddm-empty');
  const countEl = document.getElementById('ddm-count');
  if (!grid) return;

  // Espera ElarahData ficar disponível (script.js + experiences-data
  // já tratam o waitClient internamente).
  let experiences = [];
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
      experiences = await ElarahData.getVisibleExperiences();
    } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      experiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah DDM] falha ao carregar experiências', e);
    experiences = [];
  }

  // Originals exclusivos da home (hideFromCategorias) NÃO aparecem
  // aqui — landing temática se comporta como uma "categoria virtual".
  experiences = (experiences || []).filter(function (e) {
    return e && e.hideFromCategorias !== true;
  });

  // Normaliza string pra comparação: NFKD + remove diacríticos + lower.
  // "Mãe" e "Mae" caem no mesmo bucket.
  function normalize(s) {
    return String(s == null ? '' : s)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // Critério: o NOME contém "mae" ou "maes" como palavra (não match
  // dentro de outras palavras tipo "amamentar"). Usa \b regex.
  const motherRegex = /\b(mae|maes)\b/;

  const filtered = experiences.filter(function (exp) {
    return motherRegex.test(normalize(exp && exp.nome));
  });

  console.info('[Elarah DDM] experiências encontradas:', filtered.length, 'de', experiences.length);

  // Render
  if (filtered.length === 0) {
    if (empty) empty.style.display = 'block';
    if (countEl) countEl.textContent = '';
    return;
  }

  if (countEl) {
    countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '') +
      ' selecionada' + (filtered.length !== 1 ? 's' : '');
  }

  // Normaliza path de imagem (mesmo NFKD do categoria.js — bate com
  // arquivos sem acento em /assets).
  function normalizeImg(p) {
    let s = String(p == null ? '' : p).trim();
    if (!s) return '';
    if (/^(https?:\/\/|\/)/i.test(s)) return s;
    if (/^(assets|images|img)\//i.test(s)) {
      return s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    }
    return 'assets/' + s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  }

  function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Cria um card temático. Mantém o click → experiencia.html?id=...
  // (mesmo destino dos cards regulares, pra não quebrar o fluxo de
  // checkout existente).
  function createCard(exp) {
    const card = document.createElement('article');
    card.className = 'ddm-card';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');

    const img = normalizeImg(exp.imagem);
    const placeholder =
      '<div class="ddm-card__placeholder">' + escapeHtml(exp.categoria || 'Experiência') + '</div>';

    const mediaInner = img
      ? '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(exp.nome || '') + '" loading="lazy" ' +
        'onerror="if(this.dataset.fb!==\'1\'){this.dataset.fb=\'1\';this.outerHTML=this.dataset.fbHtml;}" ' +
        'data-fb-html="' + placeholder.replace(/"/g, '&quot;') + '">'
      : placeholder;

    const data = (exp.data || '').trim();
    const horario = (exp.horario || '').trim();
    const bairro = (exp.bairro || '').trim();
    const preco = (exp.preco || '').trim();

    const metaItems = [];
    if (data) {
      metaItems.push(
        '<span class="ddm-card__meta-item">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
        escapeHtml(data) + '</span>'
      );
    }
    if (horario) {
      metaItems.push(
        '<span class="ddm-card__meta-item">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
        escapeHtml(horario) + '</span>'
      );
    }
    if (bairro) {
      metaItems.push(
        '<span class="ddm-card__meta-item">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
        escapeHtml(bairro) + '</span>'
      );
    }

    card.innerHTML =
      '<div class="ddm-card__media">' +
        '<span class="ddm-card__badge">Para mães</span>' +
        mediaInner +
      '</div>' +
      '<div class="ddm-card__body">' +
        (exp.categoria ? '<span class="ddm-card__categoria">' + escapeHtml(exp.categoria) + '</span>' : '') +
        '<h3 class="ddm-card__title">' + escapeHtml(exp.nome || 'Experiência') + '</h3>' +
        (metaItems.length ? '<div class="ddm-card__meta">' + metaItems.join('') + '</div>' : '') +
        '<div class="ddm-card__price">' +
          (preco
            ? '<div><div class="ddm-card__price-label">A partir de</div>' + escapeHtml(preco) + '</div>'
            : '<div></div>'
          ) +
          '<span class="ddm-card__price-cta">Ver experiência →</span>' +
        '</div>' +
      '</div>';

    function go() {
      if (exp.id != null) {
        window.location.href = 'experiencia.html?id=' + encodeURIComponent(exp.id);
      }
    }
    card.addEventListener('click', go);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });

    return card;
  }

  // Ordena: experiências com data marcada primeiro, depois alfabético.
  filtered.sort(function (a, b) {
    const aHasData = !!(a.data && String(a.data).trim());
    const bHasData = !!(b.data && String(b.data).trim());
    if (aHasData !== bHasData) return aHasData ? -1 : 1;
    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
  });

  filtered.forEach(function (exp) {
    grid.appendChild(createCard(exp));
  });

  // Analytics opcional (sem quebrar se tracker indisponível).
  try {
    if (window.ElarahAnalytics && ElarahAnalytics.track) {
      ElarahAnalytics.track('page_view', {
        page: 'dia-das-maes',
        experiences_count: filtered.length,
      });
    }
  } catch (e) {}
})();
