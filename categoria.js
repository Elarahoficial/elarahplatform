document.addEventListener('DOMContentLoaded', async () => {

  // ===== SHARED DATA SOURCE =====
  let experiences = [];
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
      experiences = await ElarahData.getVisibleExperiences();
    } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      experiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah categoria] falha ao carregar experiências', e);
    experiences = [];
  }

  // Esconde Originals exclusivos: experiências marcadas com
  // hide_from_categorias só aparecem na aba "By Elarah" da home,
  // não nas listagens de categoria. Default false → comportamento
  // antigo preservado pra todas as experiências existentes.
  experiences = experiences.filter(function (e) {
    return e && e.hideFromCategorias !== true;
  });

  // ===== SLOTS + DATAS FUTURAS (pro filtro de data) =====
  // Recorrentes têm as datas reais nos slots, não em exp.data.
  let slotMapRaw = new Map();
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.loadAllSlots) {
      slotMapRaw = await ElarahData.loadAllSlots();
    }
  } catch (e) { /* tabela pode não existir */ }
  const _nowMs = Date.now();
  experiences.forEach(function (e) {
    e._slots = slotMapRaw.get(e.id) || [];
    e._futureDates = (typeof ElarahData !== 'undefined' && ElarahData.experienceFutureDates)
      ? ElarahData.experienceFutureDates(e, e._slots, _nowMs)
      : [];
  });
  // Varredura: recorrente com turmas datadas mas sem ocorrência futura =
  // vencida. Turmas sem data ("Semanal") são agenda aberta e mantêm a
  // experiência na listagem — regra em ElarahData.
  experiences = experiences.filter(function (e) {
    if (typeof ElarahData !== 'undefined' && ElarahData.isExpiredRecurring) {
      return !ElarahData.isExpiredRecurring(e, slotMapRaw.get(e.id) || [], _nowMs);
    }
    return true;
  });

  // ===== URL PARAMS =====
  const params = new URLSearchParams(window.location.search);
  let activeCategoria = params.get('cat') || '';
  let activeBairro = '';
  let activeDateRange = null;

  // ===== DOM REFS =====
  const grid = document.getElementById('cat-grid');
  const emptyEl = document.getElementById('cat-empty');
  const titleEl = document.getElementById('cat-title');
  const countEl = document.getElementById('cat-count');
  const breadcrumb = document.getElementById('cat-breadcrumb-current');
  const filterCategoria = document.getElementById('cat-filter-categoria');
  const filterBairro = document.getElementById('cat-filter-bairro');

  // ===== POPULATE BAIRRO DROPDOWN (dinâmico do banco) =====
  const bairros = [...new Set(
    experiences
      .map(e => (e && e.bairro ? String(e.bairro).trim() : ''))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  bairros.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    filterBairro.appendChild(opt);
  });

  // ===== POPULATE CATEGORIA DROPDOWN (dinâmico do banco) =====
  // Substitui as options hardcoded no HTML pelas categorias reais
  // das experiências carregadas. Quando o admin cadastra uma
  // categoria nova, ela aparece automaticamente aqui na próxima
  // vez que a página carrega.
  const catSet = new Set();
  const catMap = new Map();
  experiences.forEach(exp => {
    if (!exp || !exp.categoria) return;
    const c = String(exp.categoria).trim();
    if (!c) return;
    const k = c.toLowerCase();
    // "Kit em casa" não entra na navegação de categorias — acessível
    // só pelo link "Elarah em Casa" no topo do header.
    if (k === 'kit em casa') return;
    if (!catSet.has(k)) {
      catSet.add(k);
      catMap.set(k, c);
    }
  });
  const categoriasDinamicas = Array.from(catMap.values()).sort(
    (a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );
  console.log('[Elarah categoria] filtros dinâmicos:',
    categoriasDinamicas.length + ' categorias,',
    bairros.length + ' bairros');
  // Mantém a primeira option ("Todas") e substitui o resto.
  if (filterCategoria) {
    const first = filterCategoria.querySelector('option[value=""]');
    filterCategoria.innerHTML = '';
    if (first) filterCategoria.appendChild(first);
    else {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Todas';
      filterCategoria.appendChild(placeholder);
    }
    categoriasDinamicas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      filterCategoria.appendChild(opt);
    });
  }

  // ===== SET INITIAL FILTER STATE =====
  if (activeCategoria) {
    filterCategoria.value = activeCategoria;
  }

  function updateTitle() {
    const cat = activeCategoria;
    titleEl.textContent = cat ? cat : 'Todas as experiências';
    breadcrumb.textContent = cat || 'Todas as experiências';
    // SEO: título + meta description únicos e ricos em palavra-chave por
    // categoria (antes todas dividiam a mesma descrição = clique zerado).
    document.title = cat
      ? `${cat} em SP: aulas e experiências — Elarah`
      : 'Experiências criativas em SP por categoria — Elarah';
    const metaDesc = document.querySelector('meta[name="description"]');
    const descContent = cat
      ? `Aulas e experiências de ${cat} em São Paulo com a Elarah — para fazer sozinha, a dois ou em grupo. Materiais inclusos e curadoria fora do óbvio. Reserve em minutos.`
      : 'Explore experiências presenciais em São Paulo por categoria: cerâmica, pintura, coquetelaria, gastronomia, velas e mais. Reserve sua experiência em minutos.';
    if (metaDesc) metaDesc.setAttribute('content', descContent);

    // SEO: canonical + Open Graph por categoria (nunca quebra).
    try {
      const canonUrl = 'https://elarah.com.br/categoria.html' + (cat ? '?cat=' + encodeURIComponent(cat) : '');
      const upsertLink = (rel, href) => {
        let l = document.querySelector(`link[rel="${rel}"]`);
        if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); }
        l.href = href;
      };
      const upsertMeta = (prop, content) => {
        let m = document.querySelector(`meta[property="${prop}"]`);
        if (!m) { m = document.createElement('meta'); m.setAttribute('property', prop); document.head.appendChild(m); }
        m.setAttribute('content', content);
      };
      upsertLink('canonical', canonUrl);
      upsertMeta('og:type', 'website');
      upsertMeta('og:title', document.title);
      upsertMeta('og:description', descContent);
      upsertMeta('og:url', canonUrl);
      upsertMeta('og:image', 'https://elarah.com.br/assets/logo.png');
    } catch (e) { /* seo enrichment não deve quebrar a página */ }
  }

  // =================================================
  //  CARD BUILDER (helper — mesmo markup usado nos
  //  dois modos de render: flat grid e carrossel por
  //  categoria). Idêntico ao card original — não muda
  //  nada no data-reserve, card__favorite etc.
  // =================================================
  function createCardEl(exp) {
    const colors = (exp.cor || '#f6d5a8,#f0a05e').split(',');
    const card = document.createElement('article');
    card.className = 'card';

    const horariosRaw = Array.isArray(exp.horarios) && exp.horarios.length
      ? exp.horarios
      : (exp.horario ? [exp.horario] : []);
    // Dedup textual — recorrência popula horarios com 1 entrada por
    // slot/data (8 datas × 2 horários = 16 entradas). Sem dedup, card
    // mostra 16 chips idênticos.
    const seenH = new Set();
    const horarios = [];
    horariosRaw.forEach(function (h) {
      const k = String(h || '').trim();
      if (!k || seenH.has(k)) return;
      seenH.add(k);
      horarios.push(h);
    });
    const hasMultipleHorarios = horarios.length > 1;

    // Normaliza path: nome solto vira "assets/...". URLs absolutas e
    // paths absolutos passam direto. Aplica NFKD + remove diacríticos
    // (cedilha/acento) pra bater com a convenção dos arquivos do
    // projeto, que são sempre sem acento ("velamacadoamor.jpg" mesmo
    // se admin cadastrou "velamaçadoamor.jpg"). Também lowercase do
    // basename pra cobrir admin que digitou "PERFUMES.jpg".
    const normalizeImg = function (p) {
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
    };
    // Fallback por categoria (espelho do mesmo map em script.js etc.).
    const CATEGORY_DEFAULT_IMG = {
      'sabonete':    'assets/sabonete.jpg',
      'perfumaria':  'assets/perfumaria.jpg',
      'ceramica':    'assets/ceramica-fria.jpg',
      'tufting':     'assets/tufting1.jpg',
      'pintura':     'assets/pinturataca.jpg',
      'vela':        'assets/velaaromatica.jpg',
      'gastronomia': 'assets/cookies.jpg',
      'macrame':     'assets/macrameee.jpg',
      'floral':      'assets/florseca.jpg',
      'bartenderia': 'assets/drinks.jpg',
    };
    const defaultImgForCategory = function (cat) {
      if (!cat) return '';
      const key = String(cat).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
      return CATEGORY_DEFAULT_IMG[key] || '';
    };
    const placeholderHtml = `<div class="card__image-placeholder" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});"><span>${exp.categoria || ''}</span></div>`;
    const primaryImg = normalizeImg(exp.imagem);
    const catFallback = defaultImgForCategory(exp.categoria);
    const imgSrc = primaryImg || catFallback;
    const imageContent = imgSrc
      ? `<img src="${imgSrc}" alt="${exp.nome}" class="card__image-photo" loading="lazy" ` +
        `data-cat-fb="${catFallback}" ` +
        `data-original-src="${imgSrc}" ` +
        `data-fb-html="${placeholderHtml.replace(/"/g, '&quot;')}" ` +
        `onerror="` +
          `if(this.dataset.fbStep==='final')return;` +
          `if(!this.dataset.fbStep&&this.dataset.catFb&&this.src.indexOf(this.dataset.catFb)===-1){` +
            `this.dataset.fbStep='cat';this.src=this.dataset.catFb;return;` +
          `}` +
          `console.warn('[Elarah] imagem do card falhou: '+this.dataset.originalSrc);` +
          `this.dataset.fbStep='final';this.outerHTML=this.dataset.fbHtml;` +
        `">`
      : placeholderHtml;

    // Pacote/Passaporte: quando exp.pacoteDatas tem 2+ datas, monta
    // bloco multi-linha com TODAS as datas inclusas. Cliente ve
    // imediatamente no card que vai a varios encontros, sem precisar
    // abrir o detalhe.
    const pacote = Array.isArray(exp.pacoteDatas) ? exp.pacoteDatas.filter(Boolean) : [];
    const isPackage = pacote.length >= 2;
    const horarioSuffix = (!hasMultipleHorarios && horarios[0]) ? ' &middot; ' + horarios[0] : '';
    let horarioLine;
    if (isPackage) {
      horarioLine = pacote.map(function (d, i) {
        return '<span style="display:block;' + (i > 0 ? 'margin-top:3px;' : '') + '"><b style="color:#a05f1e;">' + String(d).replace(/[&<>"]/g, '') + '</b>' +
          (horarioSuffix) +
        '</span>';
      }).join('');
    } else {
      horarioLine = `${exp.data || ''}${horarioSuffix}`;
    }

    const horariosBlock = hasMultipleHorarios
      ? `<div class="card__horarios">${horarios.map((h, i) =>
          `<button type="button" class="card__horario-btn${i === 0 ? ' card__horario-btn--active' : ''}" data-horario="${String(h).replace(/"/g, '&quot;')}">${h}</button>`
        ).join('')}</div>`
      : '';

    // Badges de data sobre a imagem: 1 badge laranja arredondada por
    // data. Quando eh pacote (2+ datas), empilha verticalmente (uma em
    // cima da outra) pra cliente ver de cara que tem multiplos
    // encontros sem abrir o detalhe. Padrao laranja existente preservado.
    // Badge base no CSS fica em top:12px. Pra cada badge extra,
    // empilha 32px abaixo (~22px altura do badge + 10px gap).
    const badgesHtml = isPackage
      ? pacote.map(function (d, i) {
          var topStyle = i === 0 ? '' : ('top:' + (12 + i * 32) + 'px;');
          return '<span class="card__badge"' + (topStyle ? ' style="' + topStyle + '"' : '') + '>' +
            String(d).replace(/[&<>"]/g, '') +
          '</span>';
        }).join('')
      : `<span class="card__badge">${exp.data || ''}</span>`;

    // Selo de escassez (mesma regra honesta de ElarahData / página da
    // experiência) — só com turma futura enchendo de verdade.
    var _scRest = (window.ElarahData && ElarahData.scarcityForSlots)
      ? ElarahData.scarcityForSlots(exp._slots || [], Date.now()) : null;
    var scarcePill = _scRest != null
      ? '<span class="card__scarce" style="position:absolute;left:12px;bottom:12px;background:#c0392b;color:#fff;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px;padding:4px 9px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.28);z-index:3;">' +
          (_scRest === 1 ? 'última vaga' : 'últimas ' + _scRest + ' vagas') +
        '</span>'
      : '';

    card.innerHTML = `
      <div class="card__image">
        ${imageContent}
        <button class="card__favorite" aria-label="Favoritar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${badgesHtml}
        ${scarcePill}
      </div>
      <div class="card__body">
        <span class="card__category">${exp.categoria || ''}</span>
        <h3 class="card__title"><a href="experiencia.html?id=${encodeURIComponent(exp.id || '')}" class="card__title-link">${exp.nome || ''}</a></h3>
        <div class="card__details">
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${horarioLine}
          </p>
          ${horariosBlock}
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${exp.duracao || ''}
          </p>
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${exp.bairro || ''}
          </p>
          <p class="card__detail card__detail--address">${exp.endereco || ''}</p>
          <p class="card__detail card__detail--includes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            ${exp.inclui || ''}
          </p>
        </div>
        <div class="card__footer">
          <p class="card__price"><strong>${(window.ElarahData && ElarahData.formatPrecoBR ? ElarahData.formatPrecoBR(exp.preco || '') : (exp.preco || ''))}</strong></p>
          <button type="button" class="card__reserve-btn"
            data-reserve
            data-experience-id="${exp.id || ''}"
            data-experience-nome="${(exp.nome || '').replace(/"/g, '&quot;')}"
            data-analytics="reserve_click"
            data-analytics-category="booking"
            data-analytics-label="${(exp.nome || '').replace(/"/g, '&quot;')}">
            Reservar
          </button>
          <button type="button" class="card__share-btn" data-share-id="${exp.id || ''}" aria-label="Copiar link" title="Copiar link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
    `;

    // Share button handler
    var shareBtn = card.querySelector('.card__share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var url = window.location.origin + '/experiencia.html?id=' + encodeURIComponent(shareBtn.dataset.shareId);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            shareBtn.innerHTML = '<span style="font-size:.75rem;font-weight:600;color:var(--orange,#f0a05e);">Link copiado!</span>';
            setTimeout(function () {
              shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
            }, 2500);
          });
        } else {
          prompt('Copie o link:', url);
        }
      });
    }

    if (hasMultipleHorarios) {
      card.querySelectorAll('.card__horario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.querySelectorAll('.card__horario-btn').forEach(b => b.classList.remove('card__horario-btn--active'));
          btn.classList.add('card__horario-btn--active');
        });
      });
    }

    return card;
  }

  // =================================================
  //  AGRUPAMENTO POR CATEGORIA
  // =================================================
  // Agrupa uma lista de experiências pela chave `categoria`,
  // jogando as sem categoria (null, undefined, '') em "Outros".
  // Retorna um array de { categoria, experiences } ordenado por
  // contagem desc — categorias mais populares aparecem primeiro.
  // "Outros" sempre vai pro final independente da contagem.
  function groupByCategoria(list) {
    const map = new Map();
    const order = [];
    list.forEach(function (exp) {
      if (!exp) return;
      let cat = exp.categoria;
      if (cat == null || String(cat).trim() === '') {
        cat = 'Outros';
      } else {
        cat = String(cat).trim();
      }
      if (!map.has(cat)) {
        order.push(cat);
        map.set(cat, []);
      }
      map.get(cat).push(exp);
    });
    // Ordena por popularidade (desc), com "Outros" sempre no fim.
    const groups = order.map(function (cat) {
      return { categoria: cat, experiences: map.get(cat) };
    });
    groups.sort(function (a, b) {
      if (a.categoria === 'Outros') return 1;
      if (b.categoria === 'Outros') return -1;
      return b.experiences.length - a.experiences.length;
    });
    return groups;
  }

  // =================================================
  //  RENDER PRINCIPAL
  // =================================================
  function renderCards() {
    // Filter by bairro only — categoria drive o modo de render.
    const base = experiences.filter(function (exp) {
      // Kits "Elarah em Casa" são produto, não experiência: fora da
      // listagem (só aparecem na vitrine própria em-casa.html).
      if (window.ElarahData && ElarahData.isHomeKit && ElarahData.isHomeKit(exp)) return false;
      if (activeBairro && exp.bairro !== activeBairro) return false;
      if (activeDateRange) {
        const hit = (exp._futureDates || []).some(function (ts) {
          return ts >= activeDateRange.startMs && ts <= activeDateRange.endMs;
        });
        if (!hit) return false;
      }
      return true;
    });

    // Ordem manual do admin primeiro (quem foi arrastado pra cima vem
    // antes); empate/sem ordem cai no cronológico pela proxima ocorrencia
    // (futureDates[0]). Sem data futura conhecida vai pro fim.
    base.sort(function (a, b) {
      var oa = (typeof ElarahData !== 'undefined' && ElarahData.ordemKey) ? ElarahData.ordemKey(a) : Infinity;
      var ob = (typeof ElarahData !== 'undefined' && ElarahData.ordemKey) ? ElarahData.ordemKey(b) : Infinity;
      if (oa !== ob) return oa - ob;
      var ta = (a._futureDates && a._futureDates.length) ? a._futureDates[0] : Infinity;
      var tb = (b._futureDates && b._futureDates.length) ? b._futureDates[0] : Infinity;
      return ta - tb;
    });

    grid.innerHTML = '';
    updateTitle();

    // Limpa qualquer seção de categoria antiga (rerender)
    const oldSections = document.querySelectorAll('.cat-section');
    oldSections.forEach(function (el) { el.remove(); });

    if (activeCategoria) {
      // ===== MODO 1: categoria específica — flat grid =====
      // Normaliza dos dois lados pra matching tolerante: trim + lowercase
      // + remove acentos. Antes era === estrito, que falhava se a
      // categoria no banco tivesse caixa diferente ("cultural" vs
      // "Cultural"), espaços ou acentos sutis. Sintoma: clicar em
      // Cultural no dropdown abria categoria vazia mesmo tendo
      // experiências cadastradas.
      const norm = function (s) {
        return String(s == null ? '' : s)
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .toLowerCase().trim();
      };
      const targetNorm = norm(activeCategoria);
      const filtered = base.filter(function (exp) {
        return norm(exp.categoria) === targetNorm;
      });
      grid.style.display = '';
      emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
      countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '');

      filtered.forEach(function (exp) {
        grid.appendChild(createCardEl(exp));
      });

      wireFavorites(grid);
      return;
    }

    // ===== MODO 2: sem filtro de categoria — agrupa por seções =====
    if (base.length === 0) {
      grid.style.display = '';
      emptyEl.style.display = 'block';
      countEl.textContent = '0 experiências';
      return;
    }

    const grouped = groupByCategoria(base);
    console.log('[Elarah] categorias agrupadas', grouped.map(function (g) {
      return { categoria: g.categoria, count: g.experiences.length };
    }));

    grid.style.display = 'none';
    emptyEl.style.display = 'none';
    countEl.textContent = base.length + ' experiência' + (base.length !== 1 ? 's' : '') +
      ' · ' + grouped.length + ' categoria' + (grouped.length !== 1 ? 's' : '');

    const parent = grid.parentNode;
    grouped.forEach(function (group) {
      const section = document.createElement('section');
      section.className = 'cat-section';
      section.setAttribute('data-categoria', group.categoria);

      const header = document.createElement('div');
      header.className = 'cat-section__header';
      header.innerHTML =
        '<h2 class="cat-section__title">' + escapeHtml(group.categoria) + '</h2>' +
        '<a class="cat-section__see-all" href="categoria.html?cat=' +
          encodeURIComponent(group.categoria) + '">Ver todas (' + group.experiences.length + ')</a>';
      section.appendChild(header);

      const scroller = document.createElement('div');
      scroller.className = 'cat-section__scroller';
      group.experiences.forEach(function (exp) {
        const card = createCardEl(exp);
        scroller.appendChild(card);
      });
      section.appendChild(scroller);

      parent.insertBefore(section, grid.nextSibling);
    });

    // Liga favoritar em todas as seções novas.
    document.querySelectorAll('.cat-section').forEach(function (sec) {
      wireFavorites(sec);
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  // Wire handlers de favoritar pros cards de um container.
  // Extraído pra funcionar tanto no flat grid quanto em cada seção
  // de categoria.
  function wireFavorites(container) {
    if (!container) return;
    container.querySelectorAll('.card__favorite').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (typeof ElarahAuth === 'undefined') {
          alert('Não foi possível carregar a sua conta. Recarregue a página.');
          return;
        }
        if (!ElarahAuth.isLoggedIn()) {
          ElarahAuth.openModal('login', 'Faça login para favoritar');
          return;
        }
        const card = btn.closest('.card');
        const titleEl = card && card.querySelector('.card__title');
        const expId = (titleEl && titleEl.textContent.trim()) || btn.getAttribute('aria-label') || '';
        const result = ElarahAuth.toggleFavorite(expId);
        if (result && result.success) {
          btn.classList.toggle('active');
        }
      });
    });
  }

  // ===== FILTER EVENTS =====
  filterCategoria.addEventListener('change', () => {
    activeCategoria = filterCategoria.value;
    // Update URL without reload
    const url = new URL(window.location);
    if (activeCategoria) {
      url.searchParams.set('cat', activeCategoria);
    } else {
      url.searchParams.delete('cat');
    }
    window.history.replaceState({}, '', url);
    renderCards();
  });

  filterBairro.addEventListener('change', () => {
    activeBairro = filterBairro.value;
    renderCards();
  });

  // Filtro por data — chips rápidos + seletor de data.
  if (window.ElarahDateFilter) {
    ElarahDateFilter.init({
      onChange: function (range) {
        activeDateRange = range;
        renderCards();
      },
    });
  }

  // ===== SEARCH REDIRECT =====
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  function executarBusca() {
    const valor = searchInput?.value.trim();
    if (!valor) return;
   window.location.href = '/?busca=' + encodeURIComponent(valor);
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', executarBusca);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBusca();
      }
    });
  }

  // ===== INITIAL RENDER =====
  renderCards();

  // Header (mobile menu, explorar dropdown, scroll shadow) já é
  // inicializado por script.js, que esta página também carrega.
  // Listeners duplicados aqui faziam o toggle se cancelar (add+remove
  // no mesmo clique) — por isso o hambúrguer não abria.

});
