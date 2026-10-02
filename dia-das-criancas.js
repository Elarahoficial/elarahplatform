/* =============================================================
   ELARAH — Dia das Crianças
   1) Contador regressivo até 12 de outubro.
   2) Vitrine com duas fontes, somadas (sem duplicar):
      a) Marcadas no admin: campo "Campanha" = Dia das Crianças
         (campanha = 'dia-das-criancas'). Ganham o selo
         "Seleção Elarah" e vêm primeiro.
      b) Sugestão automática: experiências que o próprio cadastro
         identifica como infantis/família (nome ou categoria com
         kids, infantil, criança, família, mirim… ou descrição
         com "para crianças", "a partir de 6 anos", "pais e
         filhos"…). Assim, toda turma kids nova cadastrada já
         aparece aqui sem precisar marcar nada.
      Nada com álcool/charuto entra pela sugestão automática.
   3) Chips de filtro por categoria (+ "Em família").
   ============================================================= */

(function () {
  'use strict';

  const CAMPAIGN = 'dia-das-criancas';

  /* ---------- 0. Data do Dia das Crianças (12/10) ---------- */
  function nextChildrensDay() {
    const now = new Date();
    let target = new Date(now.getFullYear(), 9, 12, 0, 0, 0, 0); // outubro = mês 9
    // Se já passou (mais de 1 dia), usa o do ano seguinte.
    if (now.getTime() - target.getTime() > 24 * 60 * 60 * 1000) {
      target = new Date(now.getFullYear() + 1, 9, 12, 0, 0, 0, 0);
    }
    return target;
  }

  /* ---------- 1. Contador regressivo ---------- */
  (function initCountdown() {
    const root = document.getElementById('ddc-countdown');
    if (!root) return;
    const elDays = document.getElementById('ddc-cd-days');
    const elHrs  = document.getElementById('ddc-cd-hours');
    const elMin  = document.getElementById('ddc-cd-min');
    const elSec  = document.getElementById('ddc-cd-sec');
    const label  = root.querySelector('.ddc-countdown__label');
    const target = nextChildrensDay();

    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        [elDays, elHrs, elMin, elSec].forEach(function (el) { if (el) el.textContent = '00'; });
        if (label) label.textContent = 'É hoje! Feliz Dia das Crianças 🎉';
        return;
      }
      const s = Math.floor(diff / 1000);
      if (elDays) elDays.textContent = pad(Math.floor(s / 86400));
      if (elHrs) elHrs.textContent = pad(Math.floor((s % 86400) / 3600));
      if (elMin) elMin.textContent = pad(Math.floor((s % 3600) / 60));
      if (elSec) elSec.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- 2. Regras de seleção ---------- */
  function normalize(s) {
    return String(s == null ? '' : s)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // Nunca entram pela sugestão automática (só se a Elarah marcar).
  const ADULT_CATEGORIES = ['bartenderia', 'charutaria', 'vinhos', 'vinho', 'cervejaria', 'destilados', 'mixologia'];
  const ADULT_WORDS = /\b(drinks?|vinhos?|cervejas?|gin|whisky|whiskey|coquetel|coqueteis|coquetelaria|sake|charutos?|destilados?|tequila|cachaca|espumantes?|harmonizacao)\b/;

  // Nome/categoria: sinal forte de experiência pra criança/família.
  const KIDS_TITLE = /\b(kids?|infantil|infantis|criancas?|mirim|mirins|baby|familia|familias|pequenos? chefs?|chefinhos?|pais e filhos|mae e filh[oa]s?|maes e filh[oa]s?)\b/;
  // Descrição: frases que deixam claro que é pra criança.
  const KIDS_DESC = /(\bkids\b|para criancas|pra criancas|criancas de \d|criancas a partir|criancas e (adultos|pais|responsaveis)|pais e filhos|mae e filh|em familia|turma infantil|oficina infantil|idade minima|a partir de \d{1,2} anos|de \d{1,2} a \d{1,2} anos)/;
  const FAMILY = /\b(familia|familias|pais e filhos|mae e filh[oa]s?|maes e filh[oa]s?|em familia)\b/;

  function minAge(text) {
    const m = text.match(/a partir de (\d{1,2}) anos/) || text.match(/idade minima[^\d]{0,12}(\d{1,2})/);
    return m ? parseInt(m[1], 10) : null;
  }

  function isTagged(e) { return e && normalize(e.campanha) === CAMPAIGN; }

  function isAdult(e) {
    const cat = normalize(e.categoria).trim();
    if (ADULT_CATEGORIES.indexOf(cat) !== -1) return true;
    return ADULT_WORDS.test(normalize(e.nome));
  }

  function isKidsFriendly(e) {
    if (!e || isAdult(e)) return false;
    const title = normalize((e.nome || '') + ' ' + (e.categoria || ''));
    const desc = normalize(e.descricao || '');
    const age = minAge(desc);
    // "A partir de 16/18 anos" = não é pra criança, mesmo que cite família.
    if (age != null && age >= 14) return false;
    return KIDS_TITLE.test(title) || KIDS_DESC.test(desc);
  }

  function isFamily(e) {
    return FAMILY.test(normalize((e.nome || '') + ' ' + (e.categoria || '') + ' ' + (e.descricao || '')));
  }

  // ---- Ordenação: ordem manual do admin → marcadas → data → nome ----
  const MESES = { janeiro:1, fevereiro:2, marco:3, abril:4, maio:5, junho:6, julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12 };
  function dateKey(exp) {
    const raw = normalize(exp && exp.data != null ? exp.data : '').trim();
    if (!raw) return Infinity;
    let m = raw.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
    if (m) return parseInt(m[2], 10) * 100 + parseInt(m[1], 10);
    m = raw.match(/(\d{1,2})\s*de\s*([a-z]+)/);
    if (m && MESES[m[2]]) return MESES[m[2]] * 100 + parseInt(m[1], 10);
    return Infinity;
  }
  function ordemKey(e) {
    const n = Number(e && e.campanhaOrdem);
    return isTagged(e) && Number.isFinite(n) && n > 0 ? n : Infinity;
  }
  function compare(a, b) {
    const oa = ordemKey(a), ob = ordemKey(b);
    if (oa !== ob) return oa - ob;
    const ta = isTagged(a) ? 0 : 1, tb = isTagged(b) ? 0 : 1;
    if (ta !== tb) return ta - tb;
    const da = dateKey(a), db = dateKey(b);
    if (da !== db) return da - db;
    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
  }

  /* ---------- 3. Renderização ---------- */
  function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function normalizeImg(p) {
    let s = String(p == null ? '' : p).trim();
    if (!s) return '';
    if (/^(https?:\/\/|\/)/i.test(s)) return s;
    s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    const slash = s.lastIndexOf('/');
    const dir = slash >= 0 ? s.slice(0, slash + 1) : '';
    const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
    if (/^(assets|images|img)\//i.test(s)) return dir.toLowerCase() + file;
    return 'assets/' + file;
  }

  function catLabel(exp) {
    if (window.ElarahData && ElarahData.categoriaLabel) return ElarahData.categoriaLabel(exp) || exp.categoria || 'Experiência';
    return exp.categoria || 'Experiência';
  }

  const ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  function createCard(exp, idx) {
    const card = document.createElement('article');
    card.className = 'ddc-card ddc-card--c' + ((idx % 6) + 1);
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');

    // Foto exclusiva da campanha tem prioridade AQUI (só nesta aba).
    const src = (isTagged(exp) && normalizeImg(exp.campanhaImagem)) || normalizeImg(exp.imagem);
    const placeholder = '<div class="ddc-card__placeholder">🎈 ' + escapeHtml(catLabel(exp)) + '</div>';
    const media = src
      ? '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(exp.nome || '') + '" loading="lazy" ' +
        'data-fb-html="' + placeholder.replace(/"/g, '&quot;') + '" ' +
        'onerror="this.onerror=null;this.outerHTML=this.dataset.fbHtml;">'
      : placeholder;

    const badge = isTagged(exp)
      ? '<span class="ddc-card__badge ddc-card__badge--star">⭐ Seleção Elarah</span>'
      : (isFamily(exp)
          ? '<span class="ddc-card__badge">👨‍👩‍👧 Em família</span>'
          : '<span class="ddc-card__badge">🎈 Para crianças</span>');

    const meta = [];
    const data = String(exp.data || '').trim();
    const horario = String(exp.horario || '').trim();
    const bairro = String(exp.bairro || '').trim();
    if (data) meta.push('<span class="ddc-card__meta-item">' + ICON_CAL + escapeHtml(data) + '</span>');
    if (horario) meta.push('<span class="ddc-card__meta-item">' + ICON_CLOCK + escapeHtml(horario) + '</span>');
    if (bairro) meta.push('<span class="ddc-card__meta-item">' + ICON_PIN + escapeHtml(bairro) + '</span>');

    const precoRaw = String(((window.ElarahData && ElarahData.precoVigente)
      ? ElarahData.precoVigente(exp) : exp.preco) || '').trim();
    const preco = (window.ElarahData && ElarahData.formatPrecoBR) ? ElarahData.formatPrecoBR(precoRaw) : precoRaw;

    card.innerHTML =
      '<div class="ddc-card__media">' + badge + media + '</div>' +
      '<div class="ddc-card__body">' +
        '<span class="ddc-card__categoria">' + escapeHtml(catLabel(exp)) + '</span>' +
        '<h3 class="ddc-card__title">' + escapeHtml(exp.nome || 'Experiência') + '</h3>' +
        (meta.length ? '<div class="ddc-card__meta">' + meta.join('') + '</div>' : '') +
        '<div class="ddc-card__footer">' +
          (preco
            ? '<div><div class="ddc-card__price-label">A partir de</div><div class="ddc-card__price">' + escapeHtml(preco) + '</div></div>'
            : '<div></div>') +
          '<span class="ddc-card__cta">Quero essa →</span>' +
        '</div>' +
      '</div>';

    function go() {
      if (exp.id != null) window.location.href = 'experiencia.html?id=' + encodeURIComponent(exp.id);
    }
    card.addEventListener('click', go);
    card.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
    });
    return card;
  }

  /* ---------- 4. Vitrine ---------- */
  (async function initGrid() {
    const grid    = document.getElementById('ddc-grid');
    const empty   = document.getElementById('ddc-empty');
    const countEl = document.getElementById('ddc-count');
    const chipsEl = document.getElementById('ddc-chips');
    if (!grid) return;

    let experiences = [];
    try {
      if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
        experiences = await ElarahData.getVisibleExperiences();
      } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
        experiences = await ElarahData.getAllExperiences();
      }
    } catch (e) {
      console.warn('[Elarah DDC] falha ao carregar experiências', e);
      experiences = [];
    }

    // Originals exclusivos da home (hideFromCategorias) não aparecem aqui.
    experiences = (experiences || []).filter(function (e) {
      return e && e.hideFromCategorias !== true;
    });

    const seen = new Set();
    const list = [];
    let nTagged = 0, nAuto = 0;
    experiences.forEach(function (e) {
      const tagged = isTagged(e);
      if (!tagged && !isKidsFriendly(e)) return;
      const k = String(e.id != null ? e.id : e.nome);
      if (seen.has(k)) return;
      seen.add(k);
      list.push(e);
      if (tagged) nTagged++; else nAuto++;
    });
    list.sort(compare);
    console.info('[Elarah DDC] vitrine — marcadas no admin:', nTagged, '| sugestão automática:', nAuto);

    grid.innerHTML = '';
    if (!list.length) {
      if (empty) empty.style.display = 'block';
      if (countEl) countEl.textContent = '';
      return;
    }

    // Chips: "Todas" + "Em família" (se houver) + categorias presentes.
    const cats = [];
    const catSeen = new Set();
    list.forEach(function (e) {
      const key = normalize(e.categoria).trim() || 'outros';
      if (!catSeen.has(key)) { catSeen.add(key); cats.push({ key: key, label: catLabel(e) }); }
    });
    const hasFamily = list.some(isFamily);
    const filters = [{ key: '*', label: '🌈 Todas' }];
    if (hasFamily) filters.push({ key: '@familia', label: '👨‍👩‍👧 Em família' });
    if (cats.length > 1) cats.forEach(function (c) { filters.push(c); });

    let active = '*';
    function matches(e) {
      if (active === '*') return true;
      if (active === '@familia') return isFamily(e);
      return (normalize(e.categoria).trim() || 'outros') === active;
    }
    function render() {
      grid.innerHTML = '';
      const shown = list.filter(matches);
      shown.forEach(function (e, i) { grid.appendChild(createCard(e, i)); });
      if (countEl) {
        countEl.textContent = '🎈 ' + shown.length + ' experiência' + (shown.length !== 1 ? 's' : '') +
          ' pra fazer com os pequenos';
      }
      if (chipsEl) {
        chipsEl.querySelectorAll('.ddc-chip').forEach(function (b) {
          const on = b.dataset.key === active;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }
    }

    if (chipsEl && filters.length > 1) {
      filters.forEach(function (f) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ddc-chip';
        b.setAttribute('role', 'tab');
        b.dataset.key = f.key;
        b.textContent = f.label;
        b.addEventListener('click', function () { active = f.key; render(); });
        chipsEl.appendChild(b);
      });
    }
    render();

    try {
      if (window.ElarahAnalytics && ElarahAnalytics.track) {
        ElarahAnalytics.track('page_view', { page: CAMPAIGN, experiences_count: list.length });
      }
    } catch (e) {}
  })();
})();
