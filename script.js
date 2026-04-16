/* =============================================================
   ELARAH — script.js
   -------------------------------------------------------------
   Versão explícita pra diagnóstico de cache. Se você NÃO vê esse
   log no console do navegador, o browser ou CDN está servindo
   um script.js antigo.
   ============================================================= */
console.info('[Elarah] script.js v13 carregado — filtros dinâmicos de categoria/bairro');

document.addEventListener('DOMContentLoaded', async () => {
  let experiences = [];
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
      experiences = await ElarahData.getVisibleExperiences();
    } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      experiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah] falha ao carregar experiências, seguindo com lista vazia', e);
    experiences = [];
  }

  // Carrega disponibilidade por slot (vagas por horário)
  window._elarahSlotMap = {};
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.loadAllSlots) {
      var sMap = await ElarahData.loadAllSlots();
      if (sMap && sMap.forEach) {
        sMap.forEach(function (slots, expId) {
          var byHorario = {};
          slots.forEach(function (sl) { byHorario[sl.horario] = sl; });
          window._elarahSlotMap[expId] = byHorario;
        });
      }
    }
  } catch (e) { /* tabela pode não existir */ }

  let activeCategoria = '';
  let activeBairro = '';
  let activeBusca = '';

  const params = new URLSearchParams(window.location.search);
const buscaURL = params.get('busca');
const categoriaURL = params.get('categoria');

if (buscaURL) activeBusca = buscaURL;
if (categoriaURL) activeCategoria = categoriaURL;

  const grid = document.getElementById('experiences-grid');
  const countEl = document.getElementById('experiences-count');
  const emptyEl = document.getElementById('experiences-empty');
  const filterBairro = document.getElementById('filter-bairro');
  const filterCategoria = document.getElementById('filter-categoria');
  const filterBtn = document.getElementById('filter-btn');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // =====================================================
  //  POPULA DROPDOWNS/STRIPS DINAMICAMENTE A PARTIR DO BANCO
  // =====================================================
  // Substitui as options/links hardcoded no HTML por uma lista
  // derivada das experiências reais. Quando o admin cadastra uma
  // experiência com categoria NOVA, ela aparece automaticamente
  // nos filtros na próxima vez que a página carrega.
  function populateFiltersFromExperiences() {
    // --- Categorias únicas do banco ---
    const categoriasSet = new Set();
    const categoriasOriginalCase = new Map();
    (experiences || []).forEach(function (exp) {
      if (!exp || !exp.categoria) return;
      const c = String(exp.categoria).trim();
      if (!c) return;
      const k = c.toLowerCase();
      if (!categoriasSet.has(k)) {
        categoriasSet.add(k);
        categoriasOriginalCase.set(k, c);
      }
    });
    const categorias = Array.from(categoriasOriginalCase.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    // --- Bairros únicos do banco ---
    const bairrosSet = new Set();
    const bairrosMap = new Map();
    (experiences || []).forEach(function (exp) {
      if (!exp || !exp.bairro) return;
      const b = String(exp.bairro).trim();
      if (!b) return;
      const k = b.toLowerCase();
      if (!bairrosSet.has(k)) {
        bairrosSet.add(k);
        bairrosMap.set(k, b);
      }
    });
    const bairros = Array.from(bairrosMap.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    console.log('[Elarah Home] filtros dinâmicos:',
      categorias.length + ' categorias,',
      bairros.length + ' bairros');

    // --- Popula o <select id="filter-categoria"> ---
    if (filterCategoria) {
      const current = filterCategoria.value;
      // Mantém o primeiro <option value=""> (Todas as experiências)
      // e substitui todos os outros pelas categorias dinâmicas.
      const first = filterCategoria.querySelector('option[value=""]');
      filterCategoria.innerHTML = '';
      if (first) filterCategoria.appendChild(first);
      else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Todas as experiências';
        filterCategoria.appendChild(placeholder);
      }
      categorias.forEach(function (c) {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        filterCategoria.appendChild(opt);
      });
      // Restaura seleção se ainda existe nas novas options
      if (current && categorias.indexOf(current) !== -1) {
        filterCategoria.value = current;
      } else if (activeCategoria && categorias.indexOf(activeCategoria) !== -1) {
        filterCategoria.value = activeCategoria;
      }
    }

    // --- Popula o <select id="filter-bairro"> ---
    if (filterBairro) {
      const current = filterBairro.value;
      const first = filterBairro.querySelector('option[value=""]');
      filterBairro.innerHTML = '';
      if (first) filterBairro.appendChild(first);
      else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Todos os bairros';
        filterBairro.appendChild(placeholder);
      }
      bairros.forEach(function (b) {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        filterBairro.appendChild(opt);
      });
      if (current && bairros.indexOf(current) !== -1) {
        filterBairro.value = current;
      } else if (activeBairro && bairros.indexOf(activeBairro) !== -1) {
        filterBairro.value = activeBairro;
      }
    }

    // --- Popula o strip de categorias (links .category-link) ---
    // O strip fica dentro de <nav class="categories__inner">. Mantém
    // o link "Todas" + adiciona um link por categoria do banco.
    const categoriesNav = document.querySelector('.categories__inner');
    if (categoriesNav) {
      // Preserva apenas o "Todas" (primeiro link)
      const todasLink = categoriesNav.querySelector('.category-link--active') ||
        categoriesNav.querySelector('.category-link');
      categoriesNav.innerHTML = '';
      if (todasLink) {
        todasLink.classList.add('category-link', 'category-link--active');
        categoriesNav.appendChild(todasLink);
      } else {
        const todas = document.createElement('a');
        todas.href = 'categoria.html';
        todas.className = 'category-link category-link--active';
        todas.textContent = 'Todas';
        categoriesNav.appendChild(todas);
      }
      categorias.forEach(function (c) {
        const a = document.createElement('a');
        a.href = 'categoria.html?cat=' + encodeURIComponent(c);
        a.className = 'category-link';
        a.textContent = c;
        categoriesNav.appendChild(a);
      });
    }
  }

  populateFiltersFromExperiences();

  // Atualizado depois da geração dinâmica (links novos).
  const categoryLinks = document.querySelectorAll('.category-link');

  const MAX_HOME_CARDS = 3;

  function renderCards() {
    if (!grid || !countEl || !emptyEl) return;

    const filtered = experiences.filter((exp) => {
      const matchCat = !activeCategoria || exp.categoria === activeCategoria;
      const matchBairro = !activeBairro || exp.bairro === activeBairro;

      const textoBusca = activeBusca.toLowerCase();
      const matchBusca =
        !textoBusca ||
        exp.nome.toLowerCase().includes(textoBusca) ||
        exp.categoria.toLowerCase().includes(textoBusca) ||
        exp.bairro.toLowerCase().includes(textoBusca) ||
        exp.endereco.toLowerCase().includes(textoBusca) ||
        exp.inclui.toLowerCase().includes(textoBusca) ||
        exp.data.toLowerCase().includes(textoBusca);

      return matchCat && matchBairro && matchBusca;
    });

    grid.innerHTML = '';
    emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
    countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '');

    // Remove old "ver mais" link
    const oldLink = document.querySelector('.experiences__ver-mais');
    if (oldLink) oldLink.remove();

    const isFiltered = activeCategoria || activeBairro || activeBusca;
    const toShow = isFiltered ? filtered.slice(0, MAX_HOME_CARDS) : filtered.slice(0, MAX_HOME_CARDS * 3);

    toShow.forEach((exp) => {
      grid.appendChild(createCard(exp));
    });

    // Show "Ver mais" if there are more results
    if (filtered.length > toShow.length) {
      const verMais = document.createElement('div');
      verMais.className = 'experiences__ver-mais';
      const href = activeCategoria
        ? 'categoria.html?cat=' + encodeURIComponent(activeCategoria)
        : 'categoria.html';
      verMais.innerHTML = `
        <a href="${href}" class="experiences__ver-mais-btn">
          Ver todas as ${filtered.length} experiências
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </a>
      `;
      grid.parentNode.insertBefore(verMais, grid.nextSibling);
    }

    grid.querySelectorAll('.card__favorite').forEach((btn) => {
      const expId = btn.dataset.id;
      if (typeof ElarahAuth !== 'undefined' && ElarahAuth.isFavorite(expId)) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof ElarahAuth === 'undefined') {
          alert('Não foi possível carregar a sua conta. Recarregue a página.');
          return;
        }
        if (!ElarahAuth.isLoggedIn()) {
          ElarahAuth.openModal('login', 'Faça login para favoritar');
          return;
        }
        const result = ElarahAuth.toggleFavorite(expId);
        if (result && result.success) {
          btn.classList.toggle('active');
        }
      });
    });
  }

  function createCard(exp) {
    const colors = (exp.cor || '#f6d5a8,#f0a05e').split(',');
    const card = document.createElement('article');
    card.className = 'card';

    const horarios = Array.isArray(exp.horarios) && exp.horarios.length
      ? exp.horarios
      : (exp.horario ? [exp.horario] : []);
    const hasMultipleHorarios = horarios.length > 1;

    // Slot availability lookup (populated by loadSlotAvailability)
    var slotMap = (window._elarahSlotMap && window._elarahSlotMap[exp.id]) || {};

    const imageContent = exp.imagem
      ? `<img src="${exp.imagem}" alt="${exp.nome}" class="card__image-photo">`
      : `<div class="card__image-placeholder" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});"><span>${exp.categoria}</span></div>`;

    const horarioLine = hasMultipleHorarios
      ? `${exp.data}`
      : `${exp.data}${horarios[0] ? ' &middot; ' + horarios[0] : ''}`;

    const horariosBlock = hasMultipleHorarios
      ? `<div class="card__horarios">${horarios.map((h, i) => {
          var sl = slotMap[h];
          var soldOut = sl && sl.vagasTotal != null && sl.vagasRestantes != null && sl.vagasRestantes <= 0;
          var label = soldOut ? h + ' (esgotado)' : h;
          var cls = 'card__horario-btn' + (i === 0 && !soldOut ? ' card__horario-btn--active' : '') + (soldOut ? ' card__horario-btn--sold-out' : '');
          return '<button type="button" class="' + cls + '"' + (soldOut ? ' disabled' : '') + ' data-horario="' + h.replace(/"/g, '&quot;') + '">' + label + '</button>';
        }).join('')}</div>`
      : '';

    card.innerHTML = `
      <div class="card__image">
        ${imageContent}
        <button class="card__favorite" data-id="${exp.nome}_${exp.data}_${horarios[0] || ''}" aria-label="Favoritar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <span class="card__badge">${exp.data}</span>
      </div>
      <div class="card__body">
        <span class="card__category">${exp.categoria}</span>
        <h3 class="card__title"><a href="experiencia.html?id=${encodeURIComponent(exp.id)}" class="card__title-link">${exp.nome}</a></h3>
        <div class="card__details">
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${horarioLine}
          </p>
          ${horariosBlock}
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${exp.duracao}
          </p>
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${exp.bairro}
          </p>
          <p class="card__detail card__detail--address">${exp.endereco}</p>
          <p class="card__detail card__detail--includes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            ${exp.inclui}
          </p>
        </div>
        <div class="card__footer">
          <p class="card__price"><strong>${exp.preco}</strong></p>
          <button type="button" class="card__reserve-btn"
            data-reserve
            data-experience-id="${exp.id}"
            data-experience-nome="${(exp.nome || '').replace(/"/g, '&quot;')}"
            data-analytics="reserve_click"
            data-analytics-category="booking"
            data-analytics-label="${(exp.nome || '').replace(/"/g, '&quot;')}">
            Reservar
          </button>
          <button type="button" class="card__share-btn" data-share-id="${exp.id}" aria-label="Copiar link" title="Copiar link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
    `;

    if (hasMultipleHorarios) {
      card.querySelectorAll('.card__horario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.querySelectorAll('.card__horario-btn').forEach(b => b.classList.remove('card__horario-btn--active'));
          btn.classList.add('card__horario-btn--active');
          const favBtn = card.querySelector('.card__favorite');
          if (favBtn) {
            favBtn.dataset.id = `${exp.nome}_${exp.data}_${btn.dataset.horario}`;
          }
        });
      });
    }

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

    return card;
  }

  if (categoryLinks.length && filterCategoria) {
    categoryLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activeBusca = '';
        window.history.replaceState({}, '', '/');
        if (searchInput) searchInput.value = '';

        categoryLinks.forEach((c) => c.classList.remove('category-link--active'));
        link.classList.add('category-link--active');

        const text = link.textContent.trim();
        activeCategoria = text === 'Todas' ? '' : text;
        filterCategoria.value = activeCategoria;

        renderCards();
      });
    });
  }

  if (filterBtn && filterBairro && filterCategoria) {
    filterBtn.addEventListener('click', () => {
      activeBusca = '';
      window.history.replaceState({}, '', '/');
      if (searchInput) searchInput.value = '';

      activeBairro = filterBairro.value;
      activeCategoria = filterCategoria.value;

      if (categoryLinks.length) {
        categoryLinks.forEach((c) => {
          c.classList.remove('category-link--active');
          const text = c.textContent.trim();
          if ((!activeCategoria && text === 'Todas') || text === activeCategoria) {
            c.classList.add('category-link--active');
          }
        });
      }

      renderCards();

      const experienciasEl = document.getElementById('experiencias');
      if (experienciasEl) {
        experienciasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (filterBairro) {
    filterBairro.addEventListener('change', () => {
      activeBairro = filterBairro.value;
      renderCards();
    });
  }

  if (filterCategoria) {
    filterCategoria.addEventListener('change', () => {
      activeCategoria = filterCategoria.value;

      if (categoryLinks.length) {
        categoryLinks.forEach((c) => {
          c.classList.remove('category-link--active');
          const text = c.textContent.trim();
          if ((!activeCategoria && text === 'Todas') || text === activeCategoria) {
            c.classList.add('category-link--active');
          }
        });
      }

      renderCards();
    });
  }

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

  renderCards();

  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');

      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) {
        chevron.style.transform = explorarDropdown.classList.contains('open') ? 'rotate(180deg)' : '';
      }
    });

    document.addEventListener('click', () => {
      explorarDropdown.classList.remove('open');
      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) chevron.style.transform = '';
    });

    explorarDropdown.querySelectorAll('.header__dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const text = item.textContent.trim();

        if (grid && filterCategoria) {
          activeBusca = '';
          if (searchInput) searchInput.value = '';

          activeCategoria = text === 'Todas' ? '' : text;

          if (categoryLinks.length) {
            categoryLinks.forEach((c) => {
              c.classList.remove('category-link--active');
              const linkText = c.textContent.trim();
              if ((!activeCategoria && linkText === 'Todas') || linkText === activeCategoria) {
                c.classList.add('category-link--active');
              }
            });
          }

          filterCategoria.value = activeCategoria;
          renderCards();

          const experienciasEl = document.getElementById('experiencias');
          if (experienciasEl) {
            experienciasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          const destino = text === 'Todas'
            ? 'categoria.html'
            : 'categoria.html?cat=' + encodeURIComponent(text);
          window.location.href = destino;
        }

        explorarDropdown.classList.remove('open');
        const chevron = explorarBtn.querySelector('.header__nav-chevron');
        if (chevron) chevron.style.transform = '';
      });
    });
  }

  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }

  // ===== ELARAH ORIGINALS DYNAMIC RENDER =====
  // Re-renderiza os cards da seção By Elarah a partir do Supabase
  // assim que estiver disponível, mantendo o HTML estático como
  // fallback visual (sem flash).
  function renderOriginalsGrid(items) {
    var grid = document.querySelector('.originals__grid');
    if (!grid || !Array.isArray(items) || !items.length) return;

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Mapa de fallback por slug/nome — garante que mesmo se o
    // Supabase devolver imagem vazia ou com path quebrado a foto
    // certa ainda apareça (a seção tem cards conhecidos).
    var ORIGINALS_IMAGE_FALLBACKS = {
      'pintura-aperol': 'assets/pintura-aperol.png',
      'perfumaria-criativa': 'assets/perfumariaa.jpg',
      'ourivesaria-joia': 'assets/ourivesariaa.jpg',
      'pintura de quadro com cristal & aperol spritz': 'assets/pintura-aperol.png',
      'oficina de perfumaria criativa': 'assets/perfumariaa.jpg',
      'workshop de ourivesaria: crie sua joia': 'assets/ourivesariaa.jpg'
    };
    var DEFAULT_ORIGINALS_IMAGE = 'assets/pintura-aperol.png';

    function normalizeImagePath(p) {
      var s = String(p == null ? '' : p).trim();
      if (!s) return '';
      // URL absoluta — usa como está
      if (/^https?:\/\//i.test(s)) return s;
      // path absoluto local — usa como está
      if (s.charAt(0) === '/') return s;
      // já tem prefixo de pasta conhecido
      if (/^(assets|images|img)\//i.test(s)) return s;
      // nome de arquivo solto — assume assets/
      return 'assets/' + s;
    }

    function resolveImage(it) {
      var raw = normalizeImagePath(it.imagem);
      if (raw) return raw;
      var bySlug = it.slug && ORIGINALS_IMAGE_FALLBACKS[String(it.slug).toLowerCase()];
      if (bySlug) return bySlug;
      var byName = it.nome && ORIGINALS_IMAGE_FALLBACKS[String(it.nome).toLowerCase()];
      if (byName) return byName;
      return DEFAULT_ORIGINALS_IMAGE;
    }

    var html = items.map(function(it) {
      var horariosHtml = '';
      if (Array.isArray(it.horarios) && it.horarios.length) {
        horariosHtml =
          '<p class="originals__card-detail">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
            esc(it.horarios.join(' | ')) +
          '</p>';
      }
      var localHtml = it.local
        ? '<p class="originals__card-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(it.local) + '</p>'
        : '';
      var dataHtml = it.data
        ? '<p class="originals__card-detail' + (it.tipo === 'espera' ? ' originals__card-detail--soon' : '') + '">' +
            (it.tipo === 'espera'
              ? esc(it.data)
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + esc(it.data)) +
          '</p>'
        : '';
      var descHtml = it.descricao && it.tipo === 'espera'
        ? '<p class="originals__card-detail originals__card-detail--highlight"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' + esc(it.descricao) + '</p>'
        : '';

      var btnClass = it.tipo === 'participar'
        ? 'originals__card-btn'
        : 'originals__card-btn originals__card-btn--outline';
      var btnLabel = it.tipo === 'participar'
        ? 'Quero participar'
        : 'Entrar na lista de espera';

      var imgSrc = resolveImage(it);
      var imgFallback = (it.slug && ORIGINALS_IMAGE_FALLBACKS[String(it.slug).toLowerCase()])
        || (it.nome && ORIGINALS_IMAGE_FALLBACKS[String(it.nome).toLowerCase()])
        || DEFAULT_ORIGINALS_IMAGE;

      return '' +
        '<article class="originals__card">' +
          '<div class="originals__card-image">' +
            '<img src="' + esc(imgSrc) + '" alt="' + esc(it.nome) + '" class="originals__image" loading="lazy" ' +
              'onerror="if(this.dataset.fb!==&quot;1&quot;){this.dataset.fb=&quot;1&quot;;this.src=&quot;' + esc(imgFallback) + '&quot;;}">' +
            '<span class="originals__card-badge">Original Elarah</span>' +
          '</div>' +
          '<div class="originals__card-body">' +
            '<h3 class="originals__card-title">' + esc(it.nome) + '</h3>' +
            '<div class="originals__card-details">' +
              descHtml + dataHtml + horariosHtml + localHtml +
            '</div>' +
            '<button class="' + btnClass + '" data-experience="' + esc(it.nome) + '" data-type="' + esc(it.tipo) + '">' + esc(btnLabel) + '</button>' +
          '</div>' +
        '</article>';
    }).join('');

    grid.innerHTML = html;

    // Re-vincula os cliques nos botões (porque substituímos o HTML).
    grid.querySelectorAll('.originals__card-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openOriginalsModal(btn.dataset.experience, btn.dataset.type);
      });
    });
  }

  // ===== ELARAH ORIGINALS MODAL =====
  const originalsModal = document.getElementById('originals-modal');
  const originalsModalBackdrop = document.getElementById('originals-modal-backdrop');
  const originalsModalClose = document.getElementById('originals-modal-close');
  const originalsModalTitle = document.getElementById('originals-modal-title');
  const originalsModalDesc = document.getElementById('originals-modal-desc');
  const originalsModalForm = document.getElementById('originals-modal-form');
  const originalsModalBody = document.getElementById('originals-modal-body');
  const originalsModalSuccess = document.getElementById('originals-modal-success');
  const originalsModalExperience = document.getElementById('originals-modal-experience');
  const originalsModalSuccessClose = document.getElementById('originals-modal-success-close');

  async function openOriginalsModal(experienceName, type) {
    if (!originalsModal) return;
    if (originalsModalExperience) originalsModalExperience.value = experienceName;
    if (originalsModalTitle) originalsModalTitle.textContent = experienceName;

    // Tenta resolver a descrição real do item By Elarah (descricao do
    // banco/fallback seeds). Se não houver, cai pro texto genérico.
    let customDesc = '';
    try {
      if (window.ElarahByElarah && typeof ElarahByElarah.getAllItems === 'function') {
        const items = await ElarahByElarah.getAllItems();
        const match = items && items.find(function (i) { return i.nome === experienceName; });
        if (match && match.descricao && String(match.descricao).trim()) {
          customDesc = String(match.descricao).trim();
          console.log('[Elarah Description Flow] originals: descrição encontrada para', experienceName);
        } else {
          console.warn('[Elarah Description Flow] originals: sem descrição para', experienceName);
        }
      }
    } catch (err) {
      console.warn('[Elarah Description Flow] originals: falha ao buscar descrição', err);
    }

    if (originalsModalDesc) {
      if (customDesc) {
        // Preserva quebras de linha como <br>, escapa HTML.
        const escaped = customDesc
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        originalsModalDesc.innerHTML = escaped;
      } else {
        originalsModalDesc.textContent = type === 'participar'
          ? 'Preencha seus dados para registrar seu interesse nessa experiência.'
          : 'Entre na lista de espera e avisaremos você assim que a data for definida.';
      }
    }
    var horarioField = document.getElementById('originals-horario-field');
    if (horarioField) {
      horarioField.style.display = type === 'participar' ? 'block' : 'none';
    }
    const submitBtn = document.getElementById('originals-modal-submit');
    if (submitBtn) {
      submitBtn.textContent = type === 'participar' ? 'Quero participar' : 'Entrar na lista de espera';
    }
    originalsModalBody.style.display = 'block';
    originalsModalSuccess.style.display = 'none';
    originalsModalForm.reset();
    originalsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeOriginalsModal() {
    if (!originalsModal) return;
    originalsModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.originals__card-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openOriginalsModal(btn.dataset.experience, btn.dataset.type);
    });
  });

  if (originalsModalBackdrop) {
    originalsModalBackdrop.addEventListener('click', closeOriginalsModal);
  }
  if (originalsModalClose) {
    originalsModalClose.addEventListener('click', closeOriginalsModal);
  }
  if (originalsModalSuccessClose) {
    originalsModalSuccessClose.addEventListener('click', closeOriginalsModal);
  }

  if (originalsModalForm) {
    originalsModalForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      var submitBtn = document.getElementById('originals-modal-submit');
      if (submitBtn) submitBtn.disabled = true;

      var experiencia = (originalsModalExperience && originalsModalExperience.value) || '';
      var nomeEl = document.getElementById('originals-nome');
      var emailEl = document.getElementById('originals-email');
      var telefoneEl = document.getElementById('originals-telefone');
      var nome = (nomeEl && nomeEl.value) || '';
      var email = (emailEl && emailEl.value) || '';
      var telefone = (telefoneEl && telefoneEl.value) || '';
      var horarioEl = document.getElementById('originals-horario');
      var horarioField = document.getElementById('originals-horario-field');
      var horario = (horarioField && horarioField.style.display !== 'none' && horarioEl)
        ? horarioEl.value : null;
      var tipo = (horarioField && horarioField.style.display !== 'none')
        ? 'participar' : 'espera';

      // Tenta resolver o slug a partir do nome da experiência.
      var itemSlug = null;
      try {
        if (window.ElarahByElarah && ElarahByElarah.getAllItems) {
          var items = await ElarahByElarah.getAllItems();
          var match = items.find(function(i) { return i.nome === experiencia; });
          if (match) itemSlug = match.slug;
        }
      } catch (err) { /* fallback silencioso */ }

      // Persiste no Supabase (se disponível).
      try {
        if (window.ElarahByElarah && ElarahByElarah.submitInterest) {
          await ElarahByElarah.submitInterest({
            itemSlug: itemSlug,
            experiencia: experiencia,
            tipo: tipo,
            nome: nome,
            email: email,
            telefone: telefone,
            horario: horario
          });
        }
      } catch (err) {
        console.warn('[Originals] submitInterest falhou:', err);
      }

      // Registra evento de analytics.
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('byelarah_submission', {
            category: 'byelarah',
            targetId: itemSlug || experiencia,
            targetLabel: experiencia,
            metadata: { tipo: tipo, horario: horario || '' }
          });
        }
      } catch (err) { /* ignore */ }

      if (submitBtn) submitBtn.disabled = false;
      originalsModalBody.style.display = 'none';
      originalsModalSuccess.style.display = 'block';
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && originalsModal && originalsModal.classList.contains('open')) {
      closeOriginalsModal();
    }
  });

  // Hidrata os cards a partir do Supabase (se disponível).
  // Mantém o HTML estático como fallback para não piscar.
  if (window.ElarahByElarah && ElarahByElarah.getActiveItems) {
    ElarahByElarah.getActiveItems().then(function(items) {
      if (items && items.length) renderOriginalsGrid(items);
    }).catch(function(){});
  }

  // ===== GROUP SECTION =====
  var groupBtns = document.querySelectorAll('.group-section__btn');
  var groupForm = document.getElementById('group-form');
  var groupPlaceholder = document.querySelector('.group-section__form-placeholder');
  var groupTipo = document.getElementById('group-tipo');
  var groupFormTitle = document.getElementById('group-form-title');
  var groupSuccess = document.getElementById('group-success');
  var groupSuccessClose = document.getElementById('group-success-close');

  groupBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      groupBtns.forEach(function(b) { b.classList.remove('group-section__btn--active'); });
      btn.classList.add('group-section__btn--active');

      if (groupPlaceholder) groupPlaceholder.style.display = 'none';
      if (groupSuccess) groupSuccess.style.display = 'none';
      if (groupForm) {
        groupForm.style.display = 'block';
        groupForm.style.animation = 'none';
        groupForm.offsetHeight;
        groupForm.style.animation = '';
      }
      if (groupTipo) groupTipo.value = btn.dataset.event;
      if (groupFormTitle) groupFormTitle.textContent = btn.dataset.event === 'Evento corporativo'
        ? 'Conte mais sobre seu evento corporativo'
        : btn.dataset.event === 'Aniversário'
          ? 'Conte mais sobre o aniversário'
          : 'Conte mais sobre seu grupo';
    });
  });

if (groupForm) {
  groupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var nome = document.getElementById('group-nome').value;
    var whatsapp = document.getElementById('group-whatsapp').value;
    var tipoEvento = document.getElementById('group-tipo').value;
    var pessoas = document.getElementById('group-pessoas').value;
    var data = document.getElementById('group-data').value;
    var experiencia = document.getElementById('group-experiencia').value;
    var observacoes = document.getElementById('group-obs').value;

    const mensagem =
  'Oi! Quero organizar uma experiência com a Elarah ✨%0A%0A' +
  '📌 Tipo de evento: ' + tipoEvento + '%0A' +
  '👤 Nome: ' + nome + '%0A' +
  '📱 WhatsApp: ' + whatsapp + '%0A' +
  '👥 Número de pessoas: ' + pessoas + '%0A' +
  '📅 Data desejada: ' + (data ? data.split('-').reverse().join('/') : 'Não informada') + '%0A' +
  '🎨 Tipo de experiência: ' + (experiencia || 'Ainda não sei') + '%0A' +
  '📝 Observações: ' + (observacoes || 'Nenhuma');

    var numeroElarah = '5511914455930'; // WhatsApp oficial Elarah

    var url = 'https://wa.me/' + numeroElarah + '?text=' + mensagem;

    window.open(url, '_blank');
  });
}

  if (groupSuccessClose) {
    groupSuccessClose.addEventListener('click', function() {
      if (groupSuccess) groupSuccess.style.display = 'none';
      if (groupPlaceholder) groupPlaceholder.style.display = 'flex';
      if (groupForm) groupForm.reset();
      groupBtns.forEach(function(b) { b.classList.remove('group-section__btn--active'); });
    });
  }

  // ===== STORIES READER =====
  var storiesData = [
    {
      title: 'Ideias criativas para um encontro diferente',
      author: 'Por Elarah',
      image: 'assets/experiences/pintura-ceramica.jpg',
      text: '<p>Cansar de fazer sempre a mesma coisa é natural. Jantar fora, cinema, passeio no shopping… tudo tem seu charme, mas existe um mundo de possibilidades quando o assunto é viver algo diferente a dois.</p><p><strong>E se em vez de assistir, vocês fizessem algo juntos?</strong></p><p>Imagina pintar um quadro lado a lado, com uma taça de vinho na mão e uma playlist suave ao fundo. Ou modelar argila em uma oficina de cerâmica, sentindo a textura do barro e criando algo com as próprias mãos — juntos, do zero.</p><p>Essas experiências criam memórias que ficam. Não é sobre o resultado final, mas sobre o processo: rir dos erros, se surpreender com os acertos, descobrir algo novo sobre o outro.</p><p><strong>Algumas ideias para começar:</strong></p><p>Uma aula de gastronomia japonesa, onde vocês preparam sushi lado a lado. Uma oficina de velas perfumadas para levar uma lembrança para casa. Ou até uma sessão de tufting para criar um tapete personalizado.</p><p>Na Elarah, acreditamos que as melhores histórias de amor são escritas offline. E a próxima pode começar aqui.</p>'
    },
    {
      title: 'Experiências para presentear alguém especial',
      author: 'Por Elarah',
      image: 'assets/experiences/vela-floral.jpg',
      text: '<p>Chega de presente genérico. Chega de vale-presente sem alma. Se você quer surpreender alguém de verdade, dê algo que ela vai <strong>sentir, viver e lembrar para sempre</strong>.</p><p>Presentear com experiência é o novo luxo. É mostrar que você pensou, escolheu e quis proporcionar algo que vai muito além do material.</p><p><strong>Para a mãe que merece mais:</strong> uma oficina de perfumaria criativa, onde ela cria sua própria fragrância. Para a amiga que ama novidade: uma aula de bartenderia com drinks autorais. Para aquele casal que tem tudo: uma experiência de pintura em cerâmica com vinho.</p><p>A Elarah oferece gift cards com valor livre e experiências específicas, todas com envio digital imediato. Você pode personalizar com uma mensagem especial e agendar para o dia perfeito.</p><p><strong>É simples:</strong> escolha, personalize, envie. Quem recebe escolhe o melhor dia e vive algo único.</p><p>Porque o melhor presente não se embrulha — se vive.</p>'
    },
    {
      title: 'O que fazer em São Paulo além do óbvio',
      author: 'Por Elarah',
      image: 'assets/experiences/ceo-kitchen.jpg',
      text: '<p>São Paulo é uma cidade que não dorme, não para e não deixa ninguém entediado — desde que você saiba onde procurar.</p><p>Além dos bares descolados e dos restaurantes da moda, existe uma cena criativa crescendo em cada bairro. <strong>Oficinas, ateliês, espaços colaborativos e experiências que transformam a rotina.</strong></p><p>No Brooklin, você pode fazer velas artesanais com aromas exclusivos em um estúdio aconchegante. Em Pinheiros, oficinas de cerâmica que parecem meditação. No Itaim, sessões de tufting onde você cria seu próprio tapete com uma pistola de agulha.</p><p><strong>E a gastronomia?</strong> Aulas imersivas de cozinha japonesa, tailandesa, lamen artesanal — tudo com a mão na massa e ingredientes premium.</p><p>O segredo de São Paulo não está nos guias turísticos. Está nas experiências que só quem vive descobre. E na Elarah, a gente cuida para que cada uma delas seja memorável.</p><p>Saia da tela. Viva a cidade. <strong>Offline is a feeling.</strong></p>'
    }
  ];

  var storyReader = document.getElementById('story-reader');
  var storyReaderBackdrop = document.getElementById('story-reader-backdrop');
  var storyReaderClose = document.getElementById('story-reader-close');
  var storyReaderImage = document.getElementById('story-reader-image');
  var storyReaderTitle = document.getElementById('story-reader-title');
  var storyReaderAuthor = document.getElementById('story-reader-author');
  var storyReaderText = document.getElementById('story-reader-text');

  function openStoryReader(index) {
    var story = storiesData[index];
    if (!story || !storyReader) return;
    storyReaderImage.src = story.image;
    storyReaderImage.alt = story.title;
    storyReaderTitle.textContent = story.title;
    storyReaderAuthor.textContent = story.author;
    storyReaderText.innerHTML = story.text;
    storyReader.classList.add('open');
    storyReader.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeStoryReader() {
    if (!storyReader) return;
    storyReader.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.stories__card').forEach(function(card) {
    card.addEventListener('click', function() {
      var index = parseInt(card.dataset.story, 10);
      openStoryReader(index);
    });
  });

  if (storyReaderBackdrop) storyReaderBackdrop.addEventListener('click', closeStoryReader);
  if (storyReaderClose) storyReaderClose.addEventListener('click', closeStoryReader);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && storyReader && storyReader.classList.contains('open')) {
      closeStoryReader();
    }
  });

  // ===== STRIPE CHECKOUT — Reservar =====
  // Delegação global: qualquer botão com [data-reserve] dispara
  // a Edge Function `create-checkout-session` e redireciona para
  // o Stripe Checkout.
  (function () {
    // Base pra todas as Edge Functions. CHECKOUT_FN_URL continua
    // apontando pra create-checkout-session (cartão/Stripe); as novas
    // funções da Mercado Pago (PIX) e reconcile usam a mesma base.
    const CHECKOUT_FN_BASE =
      'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1';
    const CHECKOUT_FN_URL =
      CHECKOUT_FN_BASE + '/create-checkout-session';
    const MP_PIX_FN_URL =
      CHECKOUT_FN_BASE + '/create-mp-pix-payment';
    const REDEEM_FN_URL =
      CHECKOUT_FN_BASE + '/redeem-gift-card';
    // Anon key do Supabase (JWT). Pode ficar exposta no front — é o
    // "publishable key" do projeto, sem privilégios além do RLS.
    const SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aWp4am1lbmJmeWVodnNjb2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA1MjQsImV4cCI6MjA5MTQyNjUyNH0.HPLrWNczhDxXH3eBLZHhsmrc3Tviah0eUuO1BsULQ-c';

    function readActiveHorario(triggerEl) {
      if (!triggerEl) return null;
      // Trigger pode trazer um data-horario explícito (ex.: ghost button
      // criado pelo resumePendingCheckout após login).
      if (triggerEl.dataset && triggerEl.dataset.horario) {
        return triggerEl.dataset.horario;
      }
      const card = triggerEl.closest && triggerEl.closest('.card, .originals__card, .exp-card');
      if (!card) return null;
      const active = card.querySelector('.card__horario-btn--active');
      if (active && active.dataset && active.dataset.horario) {
        return active.dataset.horario;
      }
      const first = card.querySelector('.card__horario-btn');
      if (first && first.dataset) return first.dataset.horario || null;
      return null;
    }

    function readPrecoFromCard(triggerEl) {
      if (!triggerEl) return '';
      const card = triggerEl.closest('.card, .originals__card, .exp-card');
      if (!card) return '';
      const el = card.querySelector('[data-experience-preco], .card__price, .card__preco');
      if (!el) return '';
      return (el.getAttribute('data-experience-preco') || el.textContent || '').trim();
    }

    // "R$ 1.234,50" / "R$383" / "383,00" -> 38300
    function parsePrecoToCents(raw) {
      if (raw == null) return null;
      const text = String(raw).replace(/\s/g, '').replace(/^R\$/i, '');
      if (!text) return null;
      const norm = text.indexOf(',') !== -1
        ? text.replace(/\./g, '').replace(',', '.')
        : text;
      const num = Number(norm);
      if (!isFinite(num) || num <= 0) return null;
      return Math.round(num * 100);
    }

    function brl(centavos) {
      return 'R$ ' + (Number(centavos || 0) / 100).toFixed(2).replace('.', ',');
    }

    // Pega e-mail + nome do usuário logado (para pré-preencher o modal
    // de reserva). NÃO retorna o access_token — as Edge Functions usam
    // service role internamente, então o JWT do usuário não serve pra
    // nada lá. Todas as chamadas vão com o anon key (JWT válido, nunca
    // expira).
    //
    // O `nome` é resolvido nessa ordem:
    //   1. profiles.nome (fonte canônica, setada no cadastro)
    //   2. user_metadata.nome / full_name / name (fallback)
    async function getAuthInfo() {
      try {
        if (window.supabaseClient && window.supabaseClient.auth) {
          const { data } = await window.supabaseClient.auth.getSession();
          var session = data && data.session;
          if (session && session.user) {
            let nome = null;
            try {
              const { data: prof } = await window.supabaseClient
                .from('profiles')
                .select('nome')
                .eq('id', session.user.id)
                .maybeSingle();
              if (prof && prof.nome) {
                nome = String(prof.nome).trim() || null;
              }
            } catch (e) {
              console.warn('[Elarah checkout] prefill nome (profile) falhou', e);
            }
            if (!nome) {
              const meta = session.user.user_metadata || {};
              const rawNome = meta.nome || meta.full_name || meta.name || null;
              if (rawNome) nome = String(rawNome).trim() || null;
            }
            return { email: session.user.email || null, nome: nome };
          }
        }
      } catch (e) {
        console.warn('[Elarah checkout] auth lookup falhou', e);
      }
      return { email: null, nome: null };
    }

    // Chave usada pra reter o pedido enquanto o usuário faz login.
    const PENDING_KEY = 'elarah:pendingCheckout';

    function isUserLogged() {
      try {
        if (typeof ElarahAuth !== 'undefined' && ElarahAuth && typeof ElarahAuth.isLoggedIn === 'function') {
          return !!ElarahAuth.isLoggedIn();
        }
      } catch (e) {}
      return false;
    }

    function openLoginModal(msg) {
      try {
        if (typeof ElarahAuth !== 'undefined' && ElarahAuth && typeof ElarahAuth.openModal === 'function') {
          ElarahAuth.openModal('login', msg || 'Faça login para concluir sua reserva');
          return true;
        }
      } catch (e) {}
      return false;
    }

    // ===== Modal de confirmação de reserva (com campo de cupom) =====
    let modalRoot = null;
    function buildReservationModal() {
      if (modalRoot) return modalRoot;
      modalRoot = document.createElement('div');
      modalRoot.id = 'elarah-reserve-modal';
      modalRoot.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(20,12,4,.55);padding:20px;font-family:"DM Sans",sans-serif;';
      modalRoot.innerHTML = ''
        + '<div style="background:#fff;border-radius:18px;max-width:440px;width:100%;padding:28px 28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto;">'
        +   '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:6px;">'
        +     '<h3 id="erm-title" style="font-family:\'DM Serif Display\',serif;font-size:1.35rem;color:#1a1a1a;margin:0;">Confirmar reserva</h3>'
        +     '<button type="button" id="erm-close" aria-label="Fechar" style="background:none;border:none;font-size:24px;line-height:1;color:#999;cursor:pointer;padding:0 4px;">&times;</button>'
        +   '</div>'
        +   // ===== SEÇÃO FORMULÁRIO (default) =====
            '<div id="erm-form-section">'
        +   '<p id="erm-exp" style="margin:0 0 4px;color:#1a1a1a;font-size:1rem;font-weight:600;"></p>'
        +   '<p id="erm-meta" style="margin:0 0 18px;color:#666;font-size:.88rem;"></p>'
        +   // ===== SELEÇÃO DE MÉTODO DE PAGAMENTO =====
            // Cartão tem repasse de taxa; PIX é o preço limpo. A seleção
            // altera o breakdown acima e o valor final enviado pro Stripe.
            '<div style="margin-bottom:12px;">'
        +     '<label style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">Forma de pagamento</label>'
        +     '<div id="erm-pm-group" style="display:flex;gap:8px;">'
        +       '<button type="button" class="erm-pm-btn" data-pm="card" style="flex:1;padding:11px 10px;border:1px solid #f0a05e;background:#fff8ef;color:#1a1a1a;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;">Cartão</button>'
        +       '<button type="button" class="erm-pm-btn" data-pm="pix" style="flex:1;padding:11px 10px;border:1px solid #ddd;background:#fff;color:#666;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;">PIX</button>'
        +     '</div>'
        +     '<p id="erm-pm-hint" style="margin:6px 0 0;font-size:.78rem;color:#888;min-height:1em;">Cartão tem taxa de processamento. PIX não tem taxa.</p>'
        +   '</div>'
        +   '<div style="background:#faf6f0;border-radius:12px;padding:14px 16px;margin-bottom:16px;">'
        +     '<div style="display:flex;justify-content:space-between;font-size:.88rem;color:#666;"><span>Subtotal</span><span id="erm-subtotal"></span></div>'
        +     '<div id="erm-discount-row" style="display:none;justify-content:space-between;font-size:.88rem;color:#1a8a4a;margin-top:6px;"><span>Gift card</span><span id="erm-discount"></span></div>'
        +     '<div id="erm-fee-row" style="display:none;justify-content:space-between;font-size:.88rem;color:#666;margin-top:6px;"><span>Taxa do cartão</span><span id="erm-fee"></span></div>'
        +     '<div style="display:flex;justify-content:space-between;font-size:1.05rem;color:#1a1a1a;font-weight:700;margin-top:8px;border-top:1px solid #ece4d6;padding-top:8px;"><span>Total</span><span id="erm-total"></span></div>'
        +   '</div>'
        +   // ===== CAMPO NOME COMPLETO (obrigatório) =====
            '<label for="erm-nome" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">Nome completo <span style="color:#c0392b;">*</span></label>'
        +   '<input id="erm-nome" type="text" required autocomplete="name" placeholder="Seu nome completo" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +   '<p id="erm-nome-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Como você quer aparecer na sua reserva.</p>'
        +   // ===== CAMPO TELEFONE / WHATSAPP (obrigatório) =====
            '<label for="erm-telefone" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">WhatsApp <span style="color:#c0392b;">*</span></label>'
        +   '<input id="erm-telefone" type="tel" required inputmode="tel" autocomplete="tel-national" placeholder="(11) 91234-5678" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +   '<p id="erm-telefone-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Usamos pra te avisar sobre a experiência e mudanças de horário.</p>'
        +   // ===== CAMPO CPF (obrigatório só quando método = PIX) =====
            '<div id="erm-cpf-wrap" style="display:none;">'
        +     '<label for="erm-cpf" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">CPF <span style="color:#c0392b;">*</span></label>'
        +     '<input id="erm-cpf" type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +     '<p id="erm-cpf-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Exigido pelo Mercado Pago pra gerar o PIX.</p>'
        +   '</div>'
        +   '<label style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;">Cupom / Gift Card (opcional)</label>'
        +   '<div style="display:flex;gap:8px;">'
        +     '<input id="erm-cupom" type="text" placeholder="ELRH-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" style="flex:1;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;text-transform:uppercase;">'
        +     '<button type="button" id="erm-validate" style="padding:11px 14px;border:1px solid #f0a05e;background:#fff;color:#f0a05e;border-radius:10px;font-weight:600;font-size:.88rem;cursor:pointer;white-space:nowrap;">Aplicar</button>'
        +   '</div>'
        +   '<p id="erm-cupom-msg" style="margin:6px 0 0;font-size:.82rem;min-height:1.1em;"></p>'
        +   '<button type="button" id="erm-confirm" style="width:100%;margin-top:18px;padding:14px;border:none;border-radius:12px;background:#f0a05e;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">Confirmar e pagar</button>'
        +   '<p id="erm-error" style="color:#c0392b;font-size:.85rem;margin:10px 0 0;min-height:1em;"></p>'
        +   '</div>' // fim erm-form-section
        +   // ===== SEÇÃO PIX QR CODE (só aparece após gerar o PIX) =====
            '<div id="erm-pix-section" style="display:none;">'
        +     '<p style="margin:0 0 4px;color:#1a1a1a;font-size:1rem;font-weight:600;">Pague com PIX pra confirmar sua reserva</p>'
        +     '<p id="erm-pix-exp" style="margin:0 0 14px;color:#666;font-size:.85rem;"></p>'
        +     '<div style="background:#faf6f0;border-radius:12px;padding:16px;margin-bottom:14px;text-align:center;">'
        +       '<img id="erm-pix-qr" alt="QR Code PIX" style="max-width:220px;width:100%;height:auto;margin:0 auto 10px;display:block;background:#fff;border-radius:8px;padding:8px;">'
        +       '<p style="margin:0;font-size:.82rem;color:#666;">Escaneie com o app do seu banco</p>'
        +     '</div>'
        +     '<label style="display:block;font-size:.78rem;color:#666;margin-bottom:4px;">Ou copie o código PIX:</label>'
        +     '<div style="display:flex;gap:6px;margin-bottom:14px;">'
        +       '<input id="erm-pix-code" type="text" readonly style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.75rem;background:#fafafa;color:#666;font-family:monospace;box-sizing:border-box;">'
        +       '<button type="button" id="erm-pix-copy" style="padding:10px 14px;border:1px solid #f0a05e;background:#fff;color:#f0a05e;border-radius:10px;font-weight:600;font-size:.85rem;cursor:pointer;white-space:nowrap;">Copiar</button>'
        +     '</div>'
        +     '<div id="erm-pix-status" style="padding:12px 14px;border-radius:10px;background:#fff8ef;border:1px solid #f4c48a;color:#8a5a1a;font-size:.88rem;text-align:center;margin-bottom:10px;">'
        +       '<span id="erm-pix-status-text">Aguardando confirmação do pagamento...</span>'
        +       '<div id="erm-pix-spinner" style="display:inline-block;width:12px;height:12px;border:2px solid #f0a05e;border-top-color:transparent;border-radius:50%;margin-left:8px;vertical-align:middle;animation:erm-spin 0.8s linear infinite;"></div>'
        +     '</div>'
        +     '<p id="erm-pix-expires" style="margin:0 0 10px;font-size:.78rem;color:#888;text-align:center;"></p>'
        +     '<button type="button" id="erm-pix-check" style="width:100%;padding:11px;border:1px solid #ddd;background:#fff;color:#666;border-radius:10px;font-weight:600;font-size:.88rem;cursor:pointer;margin-bottom:8px;">Já paguei, verificar agora</button>'
        +     '<button type="button" id="erm-pix-cancel" style="width:100%;padding:11px;border:none;background:transparent;color:#999;border-radius:10px;font-size:.85rem;cursor:pointer;">Cancelar e voltar</button>'
        +     '<style>@keyframes erm-spin { to { transform: rotate(360deg); } }</style>'
        +   '</div>' // fim erm-pix-section
        + '</div>';
      document.body.appendChild(modalRoot);

      modalRoot.addEventListener('click', function (e) {
        if (e.target === modalRoot) closeReservationModal();
      });
      modalRoot.querySelector('#erm-close').addEventListener('click', closeReservationModal);

      // Máscara simples de telefone BR: formata enquanto digita.
      // (11) 91234-5678 ou (11) 1234-5678 — aceita ambos.
      const telInput = modalRoot.querySelector('#erm-telefone');
      if (telInput) {
        telInput.addEventListener('input', function () {
          const raw = telInput.value.replace(/\D+/g, '').slice(0, 11);
          let formatted = raw;
          if (raw.length >= 1) formatted = '(' + raw.slice(0, 2);
          if (raw.length >= 3) formatted += ') ' + raw.slice(2, raw.length >= 11 ? 7 : 6);
          if (raw.length >= 7) {
            formatted += '-' + raw.slice(raw.length >= 11 ? 7 : 6);
          }
          telInput.value = formatted;
        });
      }

      // Máscara CPF: 000.000.000-00
      const cpfInput = modalRoot.querySelector('#erm-cpf');
      if (cpfInput) {
        cpfInput.addEventListener('input', function () {
          cpfInput.value = formatCpf(cpfInput.value);
        });
      }

      return modalRoot;
    }

    function closeReservationModal() {
      if (!modalRoot) return;
      stopPixPolling();
      modalRoot.style.display = 'none';
      document.body.style.overflow = '';
      // Volta o modal pro estado "formulário" pra próxima abertura.
      const form = modalRoot.querySelector('#erm-form-section');
      const pix = modalRoot.querySelector('#erm-pix-section');
      if (form) form.style.display = 'block';
      if (pix) pix.style.display = 'none';
    }

    // ===== PIX polling state =====
    // Gerenciado num só lugar pra facilitar cleanup no close/cancel.
    let pixPollingHandle = null;
    let pixPollingStartedAt = 0;
    const PIX_POLLING_INTERVAL_MS = 3000; // 3s
    const PIX_POLLING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

    function stopPixPolling() {
      if (pixPollingHandle) {
        clearInterval(pixPollingHandle);
        pixPollingHandle = null;
        console.log('[Elarah Payment/MP] polling parado');
      }
    }

    async function pollBookingStatus(bookingId) {
      try {
        if (!window.supabaseClient) return null;
        const { data, error } = await window.supabaseClient
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .maybeSingle();
        if (error) {
          console.warn('[Elarah Payment/MP] polling erro:', error.message);
          return null;
        }
        return data ? data.status : null;
      } catch (e) {
        console.warn('[Elarah Payment/MP] polling exceção:', e);
        return null;
      }
    }

    function startPixPolling(bookingId) {
      stopPixPolling();
      pixPollingStartedAt = Date.now();
      console.log('[Elarah Payment/MP] polling iniciado pra booking', bookingId);
      const tick = async function () {
        const elapsed = Date.now() - pixPollingStartedAt;
        if (elapsed > PIX_POLLING_TIMEOUT_MS) {
          stopPixPolling();
          const statusEl = modalRoot && modalRoot.querySelector('#erm-pix-status');
          const statusText = modalRoot && modalRoot.querySelector('#erm-pix-status-text');
          const spinner = modalRoot && modalRoot.querySelector('#erm-pix-spinner');
          if (statusEl) statusEl.style.background = '#fdecea';
          if (statusEl) statusEl.style.borderColor = '#f5b4ae';
          if (statusEl) statusEl.style.color = '#9c2f22';
          if (statusText) statusText.textContent = 'Tempo esgotado. Se você já pagou, clique em "Já paguei, verificar agora".';
          if (spinner) spinner.style.display = 'none';
          return;
        }
        const status = await pollBookingStatus(bookingId);
        if (status === 'pago') {
          stopPixPolling();
          console.log('[Elarah Payment/MP] pagamento confirmado! redirect pra success');
          window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(bookingId);
        } else if (status === 'cancelado' || status === 'expirado' || status === 'reembolsado') {
          stopPixPolling();
          const statusEl = modalRoot && modalRoot.querySelector('#erm-pix-status');
          const statusText = modalRoot && modalRoot.querySelector('#erm-pix-status-text');
          const spinner = modalRoot && modalRoot.querySelector('#erm-pix-spinner');
          if (statusEl) statusEl.style.background = '#fdecea';
          if (statusEl) statusEl.style.borderColor = '#f5b4ae';
          if (statusEl) statusEl.style.color = '#9c2f22';
          if (statusText) statusText.textContent = 'Pagamento ' + status + '. Feche e tente de novo.';
          if (spinner) spinner.style.display = 'none';
        }
        // status === 'pending' ou null → continua polling
      };
      pixPollingHandle = setInterval(tick, PIX_POLLING_INTERVAL_MS);
      // Tick imediato pra não esperar 3s se o webhook foi rápido.
      tick();
    }

    // Transforma o modal do estado "formulário" pro estado "QR code PIX".
    function showPixPanel(resp, ctx) {
      if (!modalRoot) return;
      const form = modalRoot.querySelector('#erm-form-section');
      const pix = modalRoot.querySelector('#erm-pix-section');
      if (form) form.style.display = 'none';
      if (pix) pix.style.display = 'block';

      // QR code (imagem PNG base64)
      const img = modalRoot.querySelector('#erm-pix-qr');
      if (img && resp.qr_code_base64) {
        img.src = 'data:image/png;base64,' + resp.qr_code_base64;
      }
      // Código copia-e-cola
      const codeInput = modalRoot.querySelector('#erm-pix-code');
      if (codeInput) codeInput.value = resp.qr_code || '';
      // Meta
      const metaEl = modalRoot.querySelector('#erm-pix-exp');
      if (metaEl) metaEl.textContent = [ctx.experienceNome, ctx.horario].filter(Boolean).join(' · ');
      // Expiração
      const expEl = modalRoot.querySelector('#erm-pix-expires');
      if (expEl && resp.expires_at) {
        try {
          const when = new Date(resp.expires_at);
          expEl.textContent = 'Válido até ' + when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { expEl.textContent = ''; }
      }
      // Status reset
      const statusEl = modalRoot.querySelector('#erm-pix-status');
      const statusText = modalRoot.querySelector('#erm-pix-status-text');
      const spinner = modalRoot.querySelector('#erm-pix-spinner');
      if (statusEl) { statusEl.style.background = '#fff8ef'; statusEl.style.borderColor = '#f4c48a'; statusEl.style.color = '#8a5a1a'; }
      if (statusText) statusText.textContent = 'Aguardando confirmação do pagamento...';
      if (spinner) spinner.style.display = 'inline-block';

      // Binds (cada show redefine pra ter closure do ctx/booking atual)
      const copyBtn = modalRoot.querySelector('#erm-pix-copy');
      if (copyBtn) {
        copyBtn.onclick = function () {
          try {
            const codeInputEl = modalRoot.querySelector('#erm-pix-code');
            codeInputEl.select();
            document.execCommand('copy');
            copyBtn.textContent = 'Copiado!';
            setTimeout(function () { copyBtn.textContent = 'Copiar'; }, 1800);
          } catch (e) { console.warn('[Elarah Payment/MP] copy falhou', e); }
        };
      }
      const cancelBtn = modalRoot.querySelector('#erm-pix-cancel');
      if (cancelBtn) {
        cancelBtn.onclick = function () { closeReservationModal(); };
      }
      const checkBtn = modalRoot.querySelector('#erm-pix-check');
      if (checkBtn) {
        checkBtn.onclick = async function () {
          checkBtn.disabled = true;
          checkBtn.textContent = 'Verificando...';
          try {
            // Chama endpoint de reconciliação pra forçar sincronização
            // com a MP (backup do webhook).
            await fetch(CHECKOUT_FN_BASE + '/check-mp-payment-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ booking_id: resp.booking_id }),
            });
          } catch (e) {
            console.warn('[Elarah Payment/MP] check manual falhou:', e);
          }
          checkBtn.disabled = false;
          checkBtn.textContent = 'Já paguei, verificar agora';
          // Tick imediato do polling
          const status = await pollBookingStatus(resp.booking_id);
          if (status === 'pago') {
            stopPixPolling();
            window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(resp.booking_id);
          }
        };
      }

      // Começa polling
      startPixPolling(resp.booking_id);
    }

    let currentReservationCtx = null;

    // ===== Fee config cache =====
    // Busca as taxas do backend uma vez por sessão do navegador. Se
    // o backend não responder, cai no fallback 0/0 (sem repasse) —
    // nunca trava o checkout por causa da taxa. O admin pode mudar
    // os valores via env var; cliente velho pega novos valores no
    // próximo F5.
    let cachedFeeConfig = null;
    let feeConfigPromise = null;
    async function getFeeConfig() {
      if (cachedFeeConfig) return cachedFeeConfig;
      if (feeConfigPromise) return feeConfigPromise;
      feeConfigPromise = (async () => {
        try {
          const res = await fetch(CHECKOUT_FN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ mode: 'fee_config' }),
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data) {
            cachedFeeConfig = {
              percent: Number(data.card_fee_percent || 0),
              fixedCents: Number(data.card_fee_fixed_cents || 0),
            };
            console.log('[Elarah Payment] fee config carregado:', cachedFeeConfig);
          } else {
            console.warn('[Elarah Payment] fee config falhou, usando fallback 0/0', data);
            cachedFeeConfig = { percent: 0, fixedCents: 0 };
          }
        } catch (e) {
          console.warn('[Elarah Payment] fee config exceção, fallback 0/0:', e);
          cachedFeeConfig = { percent: 0, fixedCents: 0 };
        }
        return cachedFeeConfig;
      })();
      return feeConfigPromise;
    }

    // Calcula quanto de taxa seria adicionado pra um dado valor de
    // base (em centavos). Espelha o backend (applyCardFee).
    function computeCardFee(baseCents, feeConfig) {
      if (!feeConfig || baseCents <= 0) return 0;
      const pct = Math.round(baseCents * (feeConfig.percent / 100));
      return pct + feeConfig.fixedCents;
    }

    // Re-renderiza subtotal / desconto / taxa / total baseado no
    // estado atual do ctx (cupom aplicado + método escolhido).
    function refreshPriceBreakdown() {
      if (!currentReservationCtx || !modalRoot) return;
      const ctx = currentReservationCtx;
      const root = modalRoot;
      const cupomCents = Number(ctx.cupomCentavos || 0);
      const baseAfterCupom = Math.max(0, (ctx.precoCentavos || 0) - cupomCents);

      // Taxa só incide sobre o valor que cai no cartão.
      let feeCents = 0;
      if (ctx.paymentMethod === 'card' && baseAfterCupom > 0 && ctx.feeConfig) {
        feeCents = computeCardFee(baseAfterCupom, ctx.feeConfig);
      }
      const total = baseAfterCupom + feeCents;

      ctx.totalCentavos = total;
      ctx.feeCents = feeCents;

      root.querySelector('#erm-subtotal').textContent = brl(ctx.precoCentavos);
      root.querySelector('#erm-total').textContent = brl(total);

      const feeRow = root.querySelector('#erm-fee-row');
      if (feeCents > 0) {
        feeRow.style.display = 'flex';
        root.querySelector('#erm-fee').textContent = '+ ' + brl(feeCents);
      } else {
        feeRow.style.display = 'none';
      }

      // Atualiza texto do botão — deixa claro pro usuário.
      const confirmBtn = root.querySelector('#erm-confirm');
      if (total === 0) {
        confirmBtn.textContent = 'Confirmar reserva';
      } else if (ctx.paymentMethod === 'pix') {
        confirmBtn.textContent = 'Confirmar e pagar com PIX';
      } else {
        confirmBtn.textContent = 'Confirmar e pagar com cartão';
      }
    }

    // Visual toggle dos botões Cartão / PIX. Também mostra/esconde
    // o campo CPF (obrigatório só pra PIX via Mercado Pago).
    function updatePaymentMethodButtons() {
      if (!modalRoot || !currentReservationCtx) return;
      const ctx = currentReservationCtx;
      const buttons = modalRoot.querySelectorAll('.erm-pm-btn');
      buttons.forEach(function (btn) {
        const pm = btn.getAttribute('data-pm');
        if (pm === ctx.paymentMethod) {
          btn.style.background = '#fff8ef';
          btn.style.borderColor = '#f0a05e';
          btn.style.color = '#1a1a1a';
        } else {
          btn.style.background = '#fff';
          btn.style.borderColor = '#ddd';
          btn.style.color = '#666';
        }
      });
      const hint = modalRoot.querySelector('#erm-pm-hint');
      if (hint) {
        hint.textContent = ctx.paymentMethod === 'pix'
          ? 'PIX via Mercado Pago — sem taxa. Pague pelo QR Code e a reserva confirma sozinha.'
          : 'Cartão via Stripe — taxa de processamento é repassada ao cliente.';
      }
      // Mostra/esconde campo CPF. O reset do valor NÃO acontece aqui
      // pra preservar o que o usuário digitou se ele alternar entre
      // os dois métodos.
      const cpfWrap = modalRoot.querySelector('#erm-cpf-wrap');
      if (cpfWrap) {
        cpfWrap.style.display = ctx.paymentMethod === 'pix' ? 'block' : 'none';
      }
    }

    // Valida CPF por dígito verificador (espelha o helper do backend).
    function isValidCpfFront(raw) {
      const digits = String(raw || '').replace(/\D+/g, '');
      if (digits.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(digits)) return false;
      const arr = digits.split('').map(Number);
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += arr[i] * (10 - i);
      let d1 = (sum * 10) % 11;
      if (d1 === 10) d1 = 0;
      if (d1 !== arr[9]) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += arr[i] * (11 - i);
      let d2 = (sum * 10) % 11;
      if (d2 === 10) d2 = 0;
      return d2 === arr[10];
    }

    // Formata CPF: 000.000.000-00
    function formatCpf(digits) {
      const d = String(digits || '').replace(/\D+/g, '').slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
      if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
      return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    }

    function openReservationModal(ctx) {
      const root = buildReservationModal();
      currentReservationCtx = ctx;
      root.querySelector('#erm-exp').textContent = ctx.experienceNome || 'Experiência';
      root.querySelector('#erm-meta').textContent = [ctx.horario, ctx.precoLabel]
        .filter(Boolean).join(' · ');
      root.querySelector('#erm-subtotal').textContent = brl(ctx.precoCentavos);
      root.querySelector('#erm-total').textContent = brl(ctx.precoCentavos);
      root.querySelector('#erm-discount-row').style.display = 'none';
      root.querySelector('#erm-cupom').value = '';
      root.querySelector('#erm-cupom-msg').textContent = '';
      root.querySelector('#erm-cupom-msg').style.color = '#666';
      root.querySelector('#erm-error').textContent = '';
      // Reset + prefill nome — usa o que já veio do auth/profile no ctx.
      const nomeInput = root.querySelector('#erm-nome');
      const nomeMsg = root.querySelector('#erm-nome-msg');
      if (nomeInput) {
        nomeInput.value = (ctx.nome || '').trim();
        if (nomeMsg) {
          nomeMsg.style.color = '#888';
          nomeMsg.textContent = 'Como você quer aparecer na sua reserva.';
        }
      }
      // Reset telefone field — cada reserva começa limpa.
      const telefoneInput = root.querySelector('#erm-telefone');
      if (telefoneInput) {
        telefoneInput.value = '';
        root.querySelector('#erm-telefone-msg').style.color = '#888';
        root.querySelector('#erm-telefone-msg').textContent =
          'Usamos pra te avisar sobre a experiência e mudanças de horário.';
      }
      // Reset CPF.
      const cpfInputReset = root.querySelector('#erm-cpf');
      if (cpfInputReset) {
        cpfInputReset.value = '';
        const cpfMsgReset = root.querySelector('#erm-cpf-msg');
        if (cpfMsgReset) {
          cpfMsgReset.style.color = '#888';
          cpfMsgReset.textContent = 'Exigido pelo Mercado Pago pra gerar o PIX.';
        }
      }
      // Garante o estado "formulário" (pode estar no PIX section
      // de uma abertura anterior).
      const formSectionInit = root.querySelector('#erm-form-section');
      const pixSectionInit = root.querySelector('#erm-pix-section');
      if (formSectionInit) formSectionInit.style.display = 'block';
      if (pixSectionInit) pixSectionInit.style.display = 'none';
      stopPixPolling();
      const confirmBtn = root.querySelector('#erm-confirm');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar e pagar';

      // Reset cupom state on context
      ctx.cupomCode = null;
      ctx.cupomCentavos = 0;
      ctx.totalCentavos = ctx.precoCentavos;

      // ===== Estado do método de pagamento =====
      // Default: cartão — preserva UX atual pra quem já tá acostumado.
      ctx.paymentMethod = ctx.paymentMethod || 'card';
      ctx.feeCents = 0;
      ctx.feeConfig = cachedFeeConfig || null;
      // Esconde a linha de taxa até o fee_config carregar.
      const feeRowInit = root.querySelector('#erm-fee-row');
      if (feeRowInit) feeRowInit.style.display = 'none';
      updatePaymentMethodButtons();
      refreshPriceBreakdown();
      // Busca as taxas assincronamente — quando responder, re-renderiza.
      getFeeConfig().then(function (cfg) {
        if (!currentReservationCtx) return;
        currentReservationCtx.feeConfig = cfg;
        refreshPriceBreakdown();
      });

      root.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Pré-preenche nome + telefone se o usuário já tiver cadastrado
      // no perfil. Usa fetch async sem bloquear o render — se der erro
      // ou demorar, o usuário digita manualmente. Só pré-preenche se o
      // campo ainda estiver vazio (ex.: auth.nome não veio antes da
      // abertura do modal).
      if (nomeInput || telefoneInput) {
        (async function prefillFromProfile() {
          try {
            if (!window.supabaseClient || !window.supabaseClient.auth) return;
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session || !session.user) return;
            const { data: prof, error } = await window.supabaseClient
              .from('profiles')
              .select('nome, telefone')
              .eq('id', session.user.id)
              .maybeSingle();
            if (error) {
              console.warn('[Elarah checkout] prefill profile falhou:', error.message);
              return;
            }
            if (!prof) return;
            if (nomeInput && prof.nome && !nomeInput.value) {
              nomeInput.value = String(prof.nome).trim();
              if (currentReservationCtx) currentReservationCtx.nome = nomeInput.value;
              console.log('[Elarah checkout] nome pré-preenchido do perfil');
            }
            if (telefoneInput && prof.telefone && !telefoneInput.value) {
              telefoneInput.value = prof.telefone;
              console.log('[Elarah checkout] telefone pré-preenchido do perfil');
            }
          } catch (e) {
            console.warn('[Elarah checkout] prefill profile exceção:', e);
          }
        })();
      }

      // Foca nome (ou telefone se o nome já estiver preenchido) pra
      // reduzir atrito.
      setTimeout(function () {
        try {
          if (nomeInput && !nomeInput.value) {
            nomeInput.focus({ preventScroll: true });
          } else if (telefoneInput) {
            telefoneInput.focus({ preventScroll: true });
          }
        } catch (e) {}
      }, 150);

      // Bind buttons (uma vez por abertura, com remoção do antigo)
      const validateBtn = root.querySelector('#erm-validate');
      validateBtn.onclick = function () { handleValidateCupom(); };
      confirmBtn.onclick = function () { handleConfirmReservation(); };

      // ===== Binds dos botões de método de pagamento =====
      // Clicar troca o método no ctx e re-renderiza o breakdown.
      // Não chama backend — tudo local até o confirm final.
      const pmButtons = root.querySelectorAll('.erm-pm-btn');
      pmButtons.forEach(function (btn) {
        btn.onclick = function () {
          if (!currentReservationCtx) return;
          const pm = btn.getAttribute('data-pm');
          if (pm !== 'card' && pm !== 'pix') return;
          if (currentReservationCtx.paymentMethod === pm) return;
          currentReservationCtx.paymentMethod = pm;
          console.log('[Elarah Payment] método trocado para', pm);
          updatePaymentMethodButtons();
          refreshPriceBreakdown();
        };
      });
      root.querySelector('#erm-cupom').onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); handleValidateCupom(); }
      };
      if (nomeInput) {
        nomeInput.onkeydown = function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (telefoneInput) {
              try { telefoneInput.focus({ preventScroll: true }); } catch (err) {}
            } else {
              handleConfirmReservation();
            }
          }
        };
      }
      if (telefoneInput) {
        telefoneInput.onkeydown = function (e) {
          if (e.key === 'Enter') { e.preventDefault(); handleConfirmReservation(); }
        };
      }
    }

    async function handleValidateCupom() {
      if (!currentReservationCtx) return;
      const root = modalRoot;
      const input = root.querySelector('#erm-cupom');
      const msg = root.querySelector('#erm-cupom-msg');
      const code = (input.value || '').trim().toUpperCase();
      if (!code) {
        msg.style.color = '#c0392b';
        msg.textContent = 'Digite um código.';
        return;
      }
      msg.style.color = '#666';
      msg.textContent = 'Validando...';

      try {
        const res = await fetch(REDEEM_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            code: code,
            amount_centavos: currentReservationCtx.precoCentavos,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data || !data.ok) {
          msg.style.color = '#c0392b';
          msg.textContent = (data && data.error) || 'Não foi possível validar o cupom.';
          return;
        }
        if (!data.valid) {
          msg.style.color = '#c0392b';
          msg.textContent = data.message || 'Cupom inválido.';
          currentReservationCtx.cupomCode = null;
          currentReservationCtx.cupomCentavos = 0;
          root.querySelector('#erm-discount-row').style.display = 'none';
          refreshPriceBreakdown();
          return;
        }
        const used = Number(data.used_centavos || 0);
        currentReservationCtx.cupomCode = code;
        currentReservationCtx.cupomCentavos = used;

        msg.style.color = '#1a8a4a';
        msg.textContent = data.covers_full
          ? 'Cupom cobre 100% — você não paga nada extra.'
          : 'Cupom aplicado: ' + brl(used) + ' de desconto.';
        const drow = root.querySelector('#erm-discount-row');
        drow.style.display = 'flex';
        root.querySelector('#erm-discount').textContent = '- ' + brl(used);
        // Re-renderiza pra atualizar taxa + total corretamente
        // (taxa é recalculada sobre o valor pós-cupom).
        refreshPriceBreakdown();
      } catch (e) {
        console.error('[Elarah checkout] validate cupom', e);
        msg.style.color = '#c0392b';
        msg.textContent = 'Erro ao validar o cupom.';
      }
    }

    // Valida telefone BR: pelo menos 10 dígitos (fixo) ou 11 (celular).
    // Aceita qualquer formato, só conta dígitos. Retorna a versão
    // só-dígitos (E.164 BR: 55 + DDD + número).
    function normalizePhoneBR(raw) {
      const digits = String(raw || '').replace(/\D+/g, '');
      if (digits.length < 10 || digits.length > 13) return null;
      // Se veio com 55 no início e tiver 12 ou 13 chars, remove.
      if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
        return digits.slice(2);
      }
      return digits;
    }

    async function handleConfirmReservation() {
      if (!currentReservationCtx) return;
      const ctx = currentReservationCtx;
      const root = modalRoot;
      const confirmBtn = root.querySelector('#erm-confirm');
      const errEl = root.querySelector('#erm-error');
      errEl.textContent = '';

      // ===== VALIDAÇÃO NOME =====
      const nomeInput = root.querySelector('#erm-nome');
      const nomeMsg = root.querySelector('#erm-nome-msg');
      const nomeRaw = nomeInput ? nomeInput.value.trim().replace(/\s+/g, ' ') : '';
      if (!nomeRaw || nomeRaw.length < 3) {
        if (nomeMsg) {
          nomeMsg.style.color = '#c0392b';
          nomeMsg.textContent = 'Informe seu nome completo.';
        }
        if (nomeInput) {
          try { nomeInput.focus({ preventScroll: true }); } catch (e) {}
        }
        console.warn('[Elarah checkout] nome inválido bloqueou o submit:', nomeRaw);
        return;
      }
      if (nomeMsg) {
        nomeMsg.style.color = '#888';
        nomeMsg.textContent = 'Como você quer aparecer na sua reserva.';
      }
      // Persiste no ctx pra que retries / fallbacks continuem tendo acesso.
      ctx.nome = nomeRaw;

      // ===== VALIDAÇÃO TELEFONE =====
      const telefoneInput = root.querySelector('#erm-telefone');
      const telefoneMsg = root.querySelector('#erm-telefone-msg');
      const telefoneRaw = telefoneInput ? telefoneInput.value.trim() : '';
      const telefoneNormalized = normalizePhoneBR(telefoneRaw);
      if (!telefoneNormalized) {
        if (telefoneMsg) {
          telefoneMsg.style.color = '#c0392b';
          telefoneMsg.textContent = 'Informe um WhatsApp válido com DDD (ex: 11 91234-5678).';
        }
        if (telefoneInput) {
          try { telefoneInput.focus({ preventScroll: true }); } catch (e) {}
        }
        console.warn('[Elarah checkout] telefone inválido bloqueou o submit:', telefoneRaw);
        return;
      }
      if (telefoneMsg) {
        telefoneMsg.style.color = '#888';
        telefoneMsg.textContent = 'Usamos pra te avisar sobre a experiência e mudanças de horário.';
      }
      console.log('[Elarah checkout] telefone válido:', telefoneNormalized);

      // ===== VALIDAÇÃO CPF (só pra PIX) =====
      let cpfDigits = '';
      if (ctx.paymentMethod === 'pix') {
        const cpfInput = root.querySelector('#erm-cpf');
        const cpfMsg = root.querySelector('#erm-cpf-msg');
        const cpfRaw = cpfInput ? cpfInput.value.trim() : '';
        cpfDigits = cpfRaw.replace(/\D+/g, '');
        if (!isValidCpfFront(cpfDigits)) {
          if (cpfMsg) {
            cpfMsg.style.color = '#c0392b';
            cpfMsg.textContent = 'CPF inválido. PIX via Mercado Pago exige CPF válido.';
          }
          if (cpfInput) {
            try { cpfInput.focus({ preventScroll: true }); } catch (e) {}
          }
          console.warn('[Elarah Payment/MP] CPF inválido bloqueou o submit:', cpfDigits);
          return;
        }
        if (cpfMsg) {
          cpfMsg.style.color = '#888';
          cpfMsg.textContent = 'Exigido pelo Mercado Pago pra gerar o PIX.';
        }
        ctx.cpf = cpfDigits;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processando...';

      try {
        const auth = await getAuthInfo();
        const headers = {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        };

        // Side-effect: atualiza telefone + nome no perfil do usuário
        // pra próxima reserva pré-preencher. Fire-and-forget, não
        // bloqueia o fluxo se falhar (RLS/network).
        try {
          if (window.supabaseClient && window.supabaseClient.auth) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user && session.user.id) {
              window.supabaseClient
                .from('profiles')
                .update({ telefone: telefoneRaw, nome: nomeRaw })
                .eq('id', session.user.id)
                .then(function (res) {
                  if (res && res.error) {
                    console.warn('[Elarah checkout] salvar telefone/nome no profile falhou (OK, segue):', res.error.message);
                  } else {
                    console.log('[Elarah checkout] telefone + nome salvos no perfil do usuário');
                  }
                });
            }
          }
        } catch (e) {
          console.warn('[Elarah checkout] não foi possível atualizar profile.telefone:', e);
        }

        // ===== Branch: PIX (Mercado Pago) OU Cartão (Stripe) =====
        if (ctx.paymentMethod === 'pix') {
          const pixBody = {
            experiencia_id: ctx.experienceId,
            horario: ctx.horario,
            email: auth.email || ctx.email,
            nome: ctx.nome || null,
            cpf: cpfDigits,
            telefone: telefoneRaw,
            telefone_digits: telefoneNormalized,
            cupom: ctx.cupomCode || null,
          };
          console.log('[Elarah Payment/MP] criando PIX', {
            base: ctx.precoCentavos,
            cupom: ctx.cupomCentavos || 0,
            total: ctx.totalCentavos || 0,
          });
          const res = await fetch(MP_PIX_FN_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(pixBody),
          });
          const data = await res.json().catch(() => null);

          if (!res.ok || !data) {
            let msg = (data && (data.message || data.error)) || 'Não foi possível gerar o PIX.';
            if (data && data.detail) {
              const d = data.detail;
              const causes = Array.isArray(d.cause)
                ? d.cause.map(function(c) { return c.description; }).filter(Boolean)
                : [];
              const mpDetail = causes.length
                ? causes.join('; ')
                : (d.message || (typeof d === 'string' ? d : JSON.stringify(d)));
              if (mpDetail) msg += ' (MP: ' + mpDetail + ')';
              console.error('[Elarah PIX] MP error detail:', JSON.stringify(d));
            }
            errEl.textContent = msg;
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          if (data.direct === true) {
            // Cupom cobriu 100% — vai direto pra success.
            window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(data.booking_id || '');
            return;
          }

          if (!data.booking_id) {
            errEl.textContent = 'Resposta inesperada do servidor.';
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          // Fallback: se não veio QR inline mas veio ticket_url,
          // redireciona pra página da MP com o PIX.
          if (!data.qr_code_base64 && data.ticket_url) {
            window.location.href = data.ticket_url;
            return;
          }
          if (!data.qr_code_base64) {
            errEl.textContent = 'Resposta inesperada do servidor (QR code ausente).';
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          // Troca o modal pro painel de QR code e começa o polling.
          showPixPanel(data, ctx);
          return;
        }

        // ===== Cartão: Stripe Checkout =====
        const body = {
          experiencia_id: ctx.experienceId,
          horario: ctx.horario,
          email: auth.email || ctx.email,
          nome: ctx.nome || null,
          telefone: telefoneRaw,
          telefone_digits: telefoneNormalized,
          cupom: ctx.cupomCode || null,
          payment_method: 'card',
        };
        console.log('[Elarah Payment] enviando checkout cartão', {
          base: ctx.precoCentavos,
          cupom: ctx.cupomCentavos || 0,
          fee: ctx.feeCents || 0,
          total: ctx.totalCentavos || 0,
        });
        const res = await fetch(CHECKOUT_FN_URL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          const msg = (data && (data.message || data.error)) || 'Não foi possível processar a reserva.';
          errEl.textContent = msg;
          confirmBtn.disabled = false;
          refreshPriceBreakdown();
          return;
        }

        if (data.direct === true) {
          window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(data.booking_id || '');
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        errEl.textContent = 'Resposta inesperada do servidor.';
        confirmBtn.disabled = false;
        refreshPriceBreakdown();
      } catch (e) {
        console.error('[Elarah Payment] confirm erro:', e);
        errEl.textContent = 'Erro ao confirmar. Tente novamente.';
        confirmBtn.disabled = false;
        refreshPriceBreakdown();
      }
    }

    // =====================================================
    //  DESCRIPTION GATE — modal intermediária antes do checkout
    // =====================================================
    // Estado do gate. Guard pra impedir que dois cliques em sequência
    // abram duas modais e pra permitir cancelar um gate anterior
    // quando o usuário clica em Reservar de uma experiência diferente.
    let descriptionGateState = {
      open: false,
      currentExpId: null,
      resolve: null, // Promise resolver pendente
      cleanup: null, // Função pra desmontar a modal
    };

    function htmlEscape(str) {
      if (str == null) return '';
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }

    // Converte texto com quebras de linha em <p>s separados,
    // preservando parágrafos da descrição. Escapa HTML.
    function descriptionTextToHtml(text) {
      const raw = String(text || '').trim();
      if (!raw) return '';
      const paragraphs = raw.split(/\n{2,}|\r\n{2,}/);
      return paragraphs
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          // Quebras de linha simples dentro de um parágrafo viram <br>
          const escaped = htmlEscape(p).replace(/\n/g, '<br>');
          return '<p style="margin:0 0 14px;line-height:1.65;color:#3a3a3a;font-size:.95rem;">' + escaped + '</p>';
        })
        .join('');
    }

    // Destrói a modal atual (se existir). Se `resolveWith` for passado,
    // resolve a Promise pendente com esse valor antes de remover o DOM.
    function tearDownDescriptionGate(resolveWith) {
      const s = descriptionGateState;
      if (typeof s.resolve === 'function') {
        try { s.resolve(resolveWith === true); } catch (e) {}
      }
      if (typeof s.cleanup === 'function') {
        try { s.cleanup(); } catch (e) {}
      }
      descriptionGateState = {
        open: false,
        currentExpId: null,
        resolve: null,
        cleanup: null,
      };
      // Libera o scroll do body se não tiver outra modal aberta.
      if (!document.querySelector('.elarah-desc-modal.open')) {
        document.body.style.overflow = '';
      }
    }

    // Ponto de entrada principal. Resolve para `true` se o usuário
    // confirmou o "Continuar para pagamento", `false` caso contrário
    // (inclusive se a experiência não tiver descrição — nesse caso
    // resolvemos true imediatamente pra o fluxo seguir normalmente).
    async function runDescriptionGate(experienceId, experienceNome, triggerBtn) {
      // --- Fast path 1: ElarahData indisponível ---
      if (!window.ElarahData || typeof window.ElarahData.getExperienceById !== 'function') {
        console.warn('[Elarah Description Flow] ElarahData indisponível, indo direto para checkout');
        return true;
      }

      // --- Fast path 2: já tem uma modal aberta pra esta experiência ---
      // (proteção contra double-click no mesmo botão)
      if (descriptionGateState.open && descriptionGateState.currentExpId === experienceId) {
        console.warn('[Elarah Description Flow] modal já aberta pra esta experiência, ignorando clique duplicado');
        return false;
      }

      // --- Fast path 3: existe modal aberta pra OUTRA experiência ---
      // (usuário clicou em Reservar de outra experiência sem fechar)
      if (descriptionGateState.open) {
        console.log('[Elarah Description Flow] fechando modal anterior de outra experiência');
        tearDownDescriptionGate(false);
      }

      // --- Busca a experiência com timeout defensivo ---
      let exp = null;
      try {
        const fetchPromise = window.ElarahData.getExperienceById(experienceId);
        // Timeout de 3s — se ElarahData estiver travado, não bloqueia
        // o checkout. Default: pula a modal e segue direto.
        exp = await Promise.race([
          Promise.resolve(fetchPromise),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
      } catch (e) {
        console.warn('[Elarah Description Flow] falha ao carregar experiência, indo direto para checkout:', e && e.message ? e.message : e);
        return true;
      }

      if (!exp) {
        console.warn('[Elarah Description Flow] experiência não encontrada em ElarahData, indo direto para checkout');
        return true;
      }

      // --- Log completo do objeto experiência pra diagnóstico ---
      // Se "descricao" não aparecer aqui ou vier vazia, o problema
      // é nos DADOS (banco/seeds), não no código do modal.
      console.log('[Elarah Description] exp objeto retornado pelo ElarahData:', {
        id: exp.id,
        nome: exp.nome,
        categoria: exp.categoria,
        preco: exp.preco,
        imagem: exp.imagem,
        descricao_present: exp.descricao != null,
        descricao_length: exp.descricao ? String(exp.descricao).length : 0,
        descricao_preview: exp.descricao ? String(exp.descricao).slice(0, 120) + '...' : '(vazio)',
      });

      // --- Checa se existe descrição cadastrada ---
      // Aceita tanto exp.descricao (PT) quanto exp.description (EN)
      // por compatibilidade futura.
      const descRaw = exp.descricao != null ? exp.descricao : exp.description;
      const desc = (descRaw == null ? '' : String(descRaw)).trim();
      if (!desc) {
        console.warn('[Elarah Description Flow] sem descrição (' + experienceId + '), indo direto para checkout');
        return true;
      }

      console.log('[Elarah Description Flow] descrição encontrada (' + desc.length + ' chars), abrindo modal v2');

      // --- Monta e mostra a modal ---
      return new Promise(function (resolve) {
        openDescriptionModal(exp, triggerBtn, resolve);
      });
    }

    function openDescriptionModal(exp, triggerBtn, resolve) {
      const horario = readActiveHorario(triggerBtn) || exp.horario || '';
      const precoLabel = exp.preco || (triggerBtn && triggerBtn.getAttribute('data-experience-preco')) || '';
      const imagem = exp.imagem && String(exp.imagem).trim() ? exp.imagem : '';
      const bairro = exp.bairro || '';
      const data = exp.data || '';
      const duracao = exp.duracao || '';
      const inclui = exp.inclui || '';
      const endereco = exp.endereco || '';

      // Altura inicial e mínima do hero (mobile-first).
      // Ajusta via CSS var no scroll pra efeito collapsible suave.
      const HERO_MAX_PX = 280; // altura inicial em px (desktop)
      const HERO_MIN_PX = 72;  // altura colapsada
      const SCROLL_RANGE = 240; // px de rolagem até colapsar totalmente

      // Root do modal
      const root = document.createElement('div');
      root.className = 'elarah-desc-modal';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Detalhes da experiência: ' + (exp.nome || ''));
      // Diagnóstico: marca a versão da modal no próprio DOM. Dá pra
      // inspecionar no DevTools → Elements e confirmar que é a V2.
      root.setAttribute('data-elarah-modal-version', '2');
      console.log('[Elarah Modal Render OK] openDescriptionModal v2 — hero collapsible, body scroll, footer fixo');
      root.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:10000',
        'display:flex', 'align-items:center', 'justify-content:center',
        'padding:0',
        'background:rgba(20,12,4,0.55)',
        'font-family:"DM Sans",-apple-system,BlinkMacSystemFont,sans-serif',
        'animation:elarahDescFadeIn 180ms ease',
      ].join(';');

      // Keyframes + mobile media queries (injeta só uma vez)
      if (!document.getElementById('elarah-desc-modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'elarah-desc-modal-keyframes';
        style.textContent =
          '@keyframes elarahDescFadeIn{from{opacity:0}to{opacity:1}}' +
          '@keyframes elarahDescSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
          // Scrollbar discreta no body do modal
          '.elarah-desc-modal .elarah-desc-scroll::-webkit-scrollbar{width:6px;}' +
          '.elarah-desc-modal .elarah-desc-scroll::-webkit-scrollbar-thumb{background:#e5d8c5;border-radius:3px;}' +
          '.elarah-desc-modal .elarah-desc-scroll::-webkit-scrollbar-track{background:transparent;}' +
          // Mobile: card full-screen, hero menor
          '@media (max-width:640px){' +
            '.elarah-desc-modal{padding:0 !important;}' +
            '.elarah-desc-modal .elarah-desc-card{border-radius:0 !important;max-height:100vh !important;max-height:100dvh !important;width:100% !important;}' +
            '.elarah-desc-modal .elarah-desc-body{padding:20px 20px 28px !important;}' +
            '.elarah-desc-modal .elarah-desc-title{font-size:1.5rem !important;}' +
            '.elarah-desc-modal .elarah-desc-footer{padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px)) !important;}' +
          '}';
        document.head.appendChild(style);
      }

      // Card — contêiner principal, flex column
      const card = document.createElement('div');
      card.className = 'elarah-desc-card';
      card.style.cssText = [
        'position:relative',
        'background:#fff',
        'border-radius:22px',
        'max-width:680px',
        'width:calc(100% - 24px)',
        'max-height:92vh',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'box-shadow:0 24px 60px rgba(0,0,0,0.28)',
        'animation:elarahDescSlideUp 220ms ease',
      ].join(';');

      // Botão fechar (X) — ABSOLUTO no card inteiro, sempre visível
      // independente de scroll/hero.
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Fechar');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = [
        'position:absolute',
        'top:14px', 'right:14px',
        'width:40px', 'height:40px',
        'border:none',
        'background:rgba(255,255,255,0.95)',
        'border-radius:50%',
        'font-size:26px', 'line-height:1', 'color:#1a1a1a',
        'cursor:pointer',
        'z-index:20',
        'box-shadow:0 3px 12px rgba(0,0,0,0.18)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'padding:0',
        'transition:transform .15s ease',
      ].join(';');
      closeBtn.addEventListener('mouseenter', function () {
        closeBtn.style.transform = 'scale(1.06)';
      });
      closeBtn.addEventListener('mouseleave', function () {
        closeBtn.style.transform = 'scale(1)';
      });

      // ===== HERO (collapsible) =====
      // Wrapper que muda de altura conforme scroll. Começa em HERO_MAX_PX
      // e colapsa até HERO_MIN_PX. position:sticky pra ficar "colando"
      // no topo do scroll container enquanto encolhe.
      const hero = document.createElement('div');
      hero.className = 'elarah-desc-hero';
      hero.style.cssText = [
        'position:sticky',
        'top:0',
        'z-index:5',
        'width:100%',
        'height:' + HERO_MAX_PX + 'px',
        'background:linear-gradient(135deg,#f6d5a8,#f0a05e)',
        'overflow:hidden',
        'flex-shrink:0',
        'transition:height 220ms cubic-bezier(.22,.61,.36,1)',
        'will-change:height',
      ].join(';');

      // Gradient overlay no bottom pro contraste do título (se hover)
      const heroOverlay = document.createElement('div');
      heroOverlay.style.cssText = [
        'position:absolute', 'inset:0',
        'background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.35) 100%)',
        'pointer-events:none',
        'transition:opacity 220ms ease',
        'opacity:1',
      ].join(';');

      // Image (se houver)
      let heroImg = null;
      if (imagem) {
        heroImg = document.createElement('img');
        heroImg.src = imagem;
        heroImg.alt = exp.nome || '';
        heroImg.style.cssText = [
          'width:100%', 'height:100%',
          'object-fit:cover',
          'display:block',
          'transition:transform 220ms cubic-bezier(.22,.61,.36,1), opacity 220ms ease',
          'will-change:transform,opacity',
        ].join(';');
        heroImg.onerror = function () {
          if (heroImg) heroImg.style.display = 'none';
          console.warn('[Elarah Description Flow] falha ao carregar imagem:', imagem);
        };
        hero.appendChild(heroImg);
      }
      hero.appendChild(heroOverlay);

      // Título flutuante no hero (aparece sobre a imagem, desaparece ao
      // colapsar porque o próprio hero encolhe).
      const heroTitle = document.createElement('div');
      heroTitle.style.cssText = [
        'position:absolute',
        'left:0', 'right:0', 'bottom:0',
        'padding:20px 24px 22px',
        'color:#fff',
        'text-shadow:0 2px 10px rgba(0,0,0,0.4)',
        'transition:opacity 200ms ease, transform 220ms ease',
        'pointer-events:none',
      ].join(';');
      if (exp.categoria) {
        const catTag = document.createElement('div');
        catTag.textContent = exp.categoria;
        catTag.style.cssText = 'font-size:.7rem;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:6px;opacity:.92;';
        heroTitle.appendChild(catTag);
      }
      const heroTitleH = document.createElement('div');
      heroTitleH.textContent = exp.nome || '';
      heroTitleH.style.cssText = "font-family:'DM Serif Display',Georgia,serif;font-size:1.6rem;font-weight:400;line-height:1.2;";
      heroTitle.appendChild(heroTitleH);
      hero.appendChild(heroTitle);

      // ===== SCROLL CONTAINER =====
      // Contém hero (sticky) + body. Todo o scroll do modal acontece aqui.
      const scrollContainer = document.createElement('div');
      scrollContainer.className = 'elarah-desc-scroll';
      scrollContainer.style.cssText = [
        'flex:1 1 auto',
        'overflow-y:auto',
        '-webkit-overflow-scrolling:touch',
        'position:relative',
      ].join(';');

      // ===== BODY TEXTUAL =====
      const body = document.createElement('div');
      body.className = 'elarah-desc-body';
      body.style.cssText = [
        'padding:28px 32px 32px',
        'background:#fff',
        'position:relative',
      ].join(';');

      // Título repetido no body pra quando o hero colapsa — mais
      // legível que o título over-image. A categoria acima faz eyebrow.
      if (exp.categoria) {
        const cat = document.createElement('div');
        cat.textContent = exp.categoria;
        cat.style.cssText = 'font-size:.7rem;color:#a4663b;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:8px;';
        body.appendChild(cat);
      }
      const title = document.createElement('h2');
      title.className = 'elarah-desc-title';
      title.textContent = exp.nome || '';
      title.style.cssText = "font-family:'DM Serif Display',Georgia,serif;font-size:1.8rem;color:#1a1a1a;margin:0 0 16px;font-weight:400;line-height:1.22;";
      body.appendChild(title);

      // Meta chips: data · horário · duração · bairro
      const metaBits = [];
      if (data) metaBits.push({ icon: '📅', text: data });
      if (horario) metaBits.push({ icon: '⏱', text: horario });
      if (duracao) metaBits.push({ icon: '⏳', text: duracao });
      if (bairro) metaBits.push({ icon: '📍', text: bairro });
      if (metaBits.length) {
        const meta = document.createElement('div');
        meta.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;';
        metaBits.forEach(function (m) {
          const chip = document.createElement('span');
          chip.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:6px',
            'padding:7px 13px',
            'background:#faf6f0',
            'border:1px solid #f0e8de',
            'border-radius:999px',
            'font-size:.82rem',
            'color:#5a4a3a',
            'white-space:nowrap',
          ].join(';');
          chip.textContent = m.icon + ' ' + m.text;
          meta.appendChild(chip);
        });
        body.appendChild(meta);
      }

      // Divisor sutil
      const divider = document.createElement('div');
      divider.style.cssText = 'height:1px;background:#f0e8de;margin:0 0 22px;';
      body.appendChild(divider);

      // Seção "Sobre a experiência"
      const descHeader = document.createElement('div');
      descHeader.textContent = 'Sobre a experiência';
      descHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:12px;';
      body.appendChild(descHeader);

      // Descrição (multi-parágrafo, XSS-safe)
      // Agora com mais line-height, font-size e cor mais confortável.
      const descWrap = document.createElement('div');
      descWrap.className = 'elarah-desc-prose';
      descWrap.innerHTML = descriptionTextToHtml(exp.descricao || exp.description || '');
      // Override: seta line-height e font-size mais confortáveis
      // diretamente nos <p>s que descriptionTextToHtml gerou.
      descWrap.querySelectorAll('p').forEach(function (p) {
        p.style.margin = '0 0 16px';
        p.style.lineHeight = '1.72';
        p.style.color = '#3a3a3a';
        p.style.fontSize = '1rem';
      });
      body.appendChild(descWrap);

      // "O que inclui" (se o campo existir)
      if (inclui && String(inclui).trim()) {
        const incluiWrap = document.createElement('div');
        incluiWrap.style.cssText = 'margin-top:28px;padding:18px 20px;background:#fff8ee;border-radius:14px;border:1px solid #f0cfa0;';
        const incluiHeader = document.createElement('div');
        incluiHeader.textContent = 'O que está incluso';
        incluiHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:8px;';
        incluiWrap.appendChild(incluiHeader);
        const incluiText = document.createElement('div');
        incluiText.textContent = String(inclui).trim();
        incluiText.style.cssText = 'font-size:.92rem;color:#3a2410;line-height:1.55;';
        incluiWrap.appendChild(incluiText);
        body.appendChild(incluiWrap);
      }

      // "Onde acontece" (se endereço estiver disponível)
      if (endereco && String(endereco).trim() && bairro) {
        const enderecoWrap = document.createElement('div');
        enderecoWrap.style.cssText = 'margin-top:20px;padding:16px 20px;background:#faf6f0;border-radius:12px;border:1px solid #f0e8de;';
        const enderecoHeader = document.createElement('div');
        enderecoHeader.textContent = 'Onde acontece';
        enderecoHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#666;margin-bottom:6px;';
        enderecoWrap.appendChild(enderecoHeader);
        const enderecoText = document.createElement('div');
        enderecoText.textContent = String(endereco).trim();
        enderecoText.style.cssText = 'font-size:.88rem;color:#444;line-height:1.5;';
        enderecoWrap.appendChild(enderecoText);
        body.appendChild(enderecoWrap);
      }

      // Spacer pra o conteúdo poder rolar além do footer
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height:20px;';
      body.appendChild(spacer);

      scrollContainer.appendChild(hero);
      scrollContainer.appendChild(body);

      // ===== FOOTER STICKY =====
      // FORA do scrollContainer, sempre visível.
      const footer = document.createElement('div');
      footer.className = 'elarah-desc-footer';
      footer.style.cssText = [
        'padding:16px 24px',
        'border-top:1px solid #f0e8de',
        'background:#fff',
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'gap:14px',
        'flex-wrap:nowrap',
        'flex-shrink:0',
        'z-index:10',
        'box-shadow:0 -4px 14px rgba(0,0,0,0.04)',
      ].join(';');

      if (precoLabel) {
        const priceTag = document.createElement('div');
        priceTag.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;';
        const priceLabelEl = document.createElement('span');
        priceLabelEl.textContent = 'Valor';
        priceLabelEl.style.cssText = 'font-size:.68rem;color:#999;text-transform:uppercase;letter-spacing:.5px;font-weight:600;';
        const priceValEl = document.createElement('strong');
        priceValEl.textContent = precoLabel;
        priceValEl.style.cssText = 'font-size:1.15rem;color:#1a1a1a;font-weight:700;';
        priceTag.appendChild(priceLabelEl);
        priceTag.appendChild(priceValEl);
        footer.appendChild(priceTag);
      }

      const continueBtn = document.createElement('button');
      continueBtn.type = 'button';
      continueBtn.textContent = 'Continuar para pagamento';
      continueBtn.style.cssText = [
        'flex:1 1 auto',
        'min-width:0',
        'padding:15px 22px',
        'border:none',
        'border-radius:999px',
        'background:#f0a05e',
        'color:#fff',
        'font-size:.95rem',
        'font-weight:700',
        'letter-spacing:.3px',
        'cursor:pointer',
        'transition:background .18s ease, transform .12s ease, box-shadow .18s ease',
        'box-shadow:0 4px 14px rgba(240,160,94,0.35)',
      ].join(';');
      continueBtn.addEventListener('mouseenter', function () {
        continueBtn.style.background = '#e08c45';
        continueBtn.style.boxShadow = '0 6px 18px rgba(240,160,94,0.45)';
      });
      continueBtn.addEventListener('mouseleave', function () {
        continueBtn.style.background = '#f0a05e';
        continueBtn.style.boxShadow = '0 4px 14px rgba(240,160,94,0.35)';
      });
      continueBtn.addEventListener('mousedown', function () {
        continueBtn.style.transform = 'scale(0.98)';
      });
      continueBtn.addEventListener('mouseup', function () {
        continueBtn.style.transform = 'scale(1)';
      });
      footer.appendChild(continueBtn);

      // ===== MONTAGEM FINAL =====
      card.appendChild(scrollContainer);
      card.appendChild(footer);
      card.appendChild(closeBtn); // absolute sobre o card inteiro
      root.appendChild(card);
      document.body.appendChild(root);
      document.body.style.overflow = 'hidden';
      root.classList.add('open');

      // ===== SCROLL HANDLER — collapsible hero =====
      // Ao rolar, diminui a altura do hero e aplica fade+scale na
      // imagem. Throttle via requestAnimationFrame pra suavidade.
      let rafPending = false;
      function onScroll() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          const st = scrollContainer.scrollTop;
          // progress vai de 0 (hero cheio) a 1 (hero colapsado)
          const progress = Math.max(0, Math.min(1, st / SCROLL_RANGE));
          const newHeight = HERO_MAX_PX - (HERO_MAX_PX - HERO_MIN_PX) * progress;
          hero.style.height = newHeight + 'px';
          if (heroImg) {
            // Pequeno parallax + fade
            const scale = 1 + progress * 0.08;
            const translateY = progress * 18;
            heroImg.style.transform = 'scale(' + scale + ') translateY(-' + translateY + 'px)';
            heroImg.style.opacity = String(1 - progress * 0.45);
          }
          // Esconde o título flutuante conforme colapsa
          heroTitle.style.opacity = String(Math.max(0, 1 - progress * 1.4));
          heroTitle.style.transform = 'translateY(' + (progress * 20) + 'px)';
          // Suaviza o overlay quando o hero fica pequeno
          heroOverlay.style.opacity = String(Math.max(0, 1 - progress * 0.8));
        });
      }
      scrollContainer.addEventListener('scroll', onScroll, { passive: true });

      // ===== HANDLERS =====
      function dismiss(confirmed) {
        document.removeEventListener('keydown', onKey, true);
        root.removeEventListener('click', onBackdrop, true);
        scrollContainer.removeEventListener('scroll', onScroll);
        closeBtn.removeEventListener('click', onClose);
        continueBtn.removeEventListener('click', onContinue);
        root.style.animation = 'elarahDescFadeIn 140ms ease reverse';
        setTimeout(function () {
          if (root.parentNode) root.parentNode.removeChild(root);
        }, 140);
        const wasResolve = descriptionGateState.resolve;
        descriptionGateState = {
          open: false,
          currentExpId: null,
          resolve: null,
          cleanup: null,
        };
        if (!document.querySelector('.elarah-desc-modal.open')) {
          document.body.style.overflow = '';
        }
        if (typeof wasResolve === 'function') {
          try { wasResolve(confirmed === true); } catch (e) {}
        }
      }

      function onContinue(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        // Guard contra double-click no botão final — desabilita e muda
        // o texto pra avisar o usuário que está processando.
        if (continueBtn.disabled) return;
        continueBtn.disabled = true;
        continueBtn.textContent = 'Abrindo pagamento…';
        continueBtn.style.opacity = '0.85';
        continueBtn.style.cursor = 'wait';
        console.log('[Elarah Description Flow] usuário clicou Continuar para pagamento (' + (exp.id || '?') + ')');
        dismiss(true);
      }
      function onClose(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        console.log('[Elarah Description Flow] usuário fechou a modal sem continuar');
        dismiss(false);
      }
      function onBackdrop(e) {
        if (e.target === root) { onClose(e); }
      }
      function onKey(e) {
        if (e.key === 'Escape') { onClose(e); }
      }

      closeBtn.addEventListener('click', onClose);
      continueBtn.addEventListener('click', onContinue);
      root.addEventListener('click', onBackdrop, true);
      document.addEventListener('keydown', onKey, true);

      descriptionGateState = {
        open: true,
        currentExpId: exp.id || null,
        resolve: resolve,
        cleanup: function () {
          document.removeEventListener('keydown', onKey, true);
          root.removeEventListener('click', onBackdrop, true);
          scrollContainer.removeEventListener('scroll', onScroll);
          if (root.parentNode) root.parentNode.removeChild(root);
        },
      };

      // Foco inicial no botão Continuar (acessibilidade + mobile).
      // preventScroll evita que o foco auto-role a página por baixo.
      try { continueBtn.focus({ preventScroll: true }); } catch (e) {}
    }

    async function startCheckout(btn, opts) {
      opts = opts || {};
      const experienceId = btn.getAttribute('data-experience-id');
      const experienceNome = btn.getAttribute('data-experience-nome') || '';

      if (!experienceId) {
        alert('Não conseguimos identificar essa experiência. Recarregue a página e tente novamente.');
        return;
      }

      // === [NEW] GATE DE DESCRIÇÃO ===
      // Antes de qualquer outra coisa (antes do login, do tracking, do
      // preço), mostra uma modal intermediária com a descrição completa
      // da experiência — SE houver descrição cadastrada. Isso dá ao
      // usuário contexto total antes de começar o fluxo de pagamento,
      // melhorando conversão.
      //
      // Skip quando:
      //   - opts.skipDescription === true (resume após login já confirmou)
      //   - experiência não tem descricao cadastrada (null/undefined/'')
      //   - ElarahData indisponível ou falha ao buscar
      //   - descricao contém só espaços em branco
      if (!opts.skipDescription) {
        const proceed = await runDescriptionGate(experienceId, experienceNome, btn);
        if (!proceed) {
          // Usuário fechou a modal sem continuar OU modal já estava
          // aberta pra outra experiência — não damos sequência.
          return;
        }
        // Chegou aqui = usuário clicou "Continuar para pagamento".
      }

      // === GATE DE LOGIN OBRIGATÓRIO ===
      if (!isUserLogged()) {
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify({
            experienceId: experienceId,
            experienceNome: experienceNome,
            horario: readActiveHorario(btn),
            descriptionAcknowledged: true,
            ts: Date.now(),
          }));
        } catch (e) {}
        const opened = openLoginModal('Faça login para concluir sua reserva');
        if (!opened) {
          alert('Faça login para concluir sua reserva.');
        }
        return;
      }

      // Tracking opcional
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('reserve_click', {
            category: 'booking',
            targetId: experienceId,
            targetLabel: experienceNome,
          });
        }
      } catch (e) {}

      // Resolve preço (do botão, do card ou do cache de experiências).
      const horario = readActiveHorario(btn);
      let precoLabel = btn.getAttribute('data-experience-preco') || readPrecoFromCard(btn);
      let precoCentavos = parsePrecoToCents(precoLabel);

      if (!precoCentavos && window.ElarahData && typeof ElarahData.getExperienceById === 'function') {
        try {
          const exp = await ElarahData.getExperienceById(experienceId);
          if (exp) {
            precoLabel = exp.preco || precoLabel;
            precoCentavos = parsePrecoToCents(exp.preco) || precoCentavos;
          }
        } catch (e) {}
      }
      if (!precoCentavos) {
        // Fallback: deixa o backend dizer. Sem cupom faz sentido nesse caso.
        precoCentavos = 0;
        precoLabel = precoLabel || '';
      }

      const auth = await getAuthInfo();

      openReservationModal({
        experienceId: experienceId,
        experienceNome: experienceNome,
        horario: horario,
        precoLabel: precoLabel,
        precoCentavos: precoCentavos,
        email: auth.email,
        // Pré-preenche com o nome do profile (se disponível). O usuário
        // ainda pode editar no modal antes de confirmar.
        nome: auth.nome || null,
      });
    }

    // Capture phase + stopImmediatePropagation: garante que SOMENTE este
    // handler trate o clique, mesmo se outro script também escutar.
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest
        ? e.target.closest('[data-reserve]')
        : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
      startCheckout(btn);
    }, true);

    // === Retomar checkout pendente após login ===
    // Quando o usuário faz login pelo modal aberto pelo gate de
    // checkout, o Supabase emite SIGNED_IN. Nesse momento, recuperamos
    // a intenção salva em sessionStorage e relançamos o startCheckout
    // automaticamente, encontrando o botão correspondente na página.
    function resumePendingCheckout() {
      let pending = null;
      try {
        const raw = sessionStorage.getItem(PENDING_KEY);
        if (raw) pending = JSON.parse(raw);
      } catch (e) {}
      if (!pending || !pending.experienceId) return;
      // Pendência expira em 30 minutos pra não disparar checkout antigo.
      if (pending.ts && (Date.now() - pending.ts) > 30 * 60 * 1000) {
        try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
        return;
      }
      try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}

      // Tenta achar o botão real na página pra preservar loading state.
      const selector = '[data-reserve][data-experience-id="' + pending.experienceId + '"]';
      // Na retomada pós-login NUNCA re-exibimos a description modal —
      // o usuário já clicou "Continuar para pagamento" antes do login.
      // skipDescription evita dupla exibição (seria pedagogicamente
      // estranho + reduz conversão).
      const resumeOpts = { skipDescription: true };
      const btn = document.querySelector(selector);
      if (btn) {
        startCheckout(btn, resumeOpts);
        return;
      }
      // Fallback: cria um botão fantasma só pra carregar os dados.
      const ghost = document.createElement('button');
      ghost.setAttribute('data-reserve', '');
      ghost.setAttribute('data-experience-id', pending.experienceId);
      if (pending.experienceNome) {
        ghost.setAttribute('data-experience-nome', pending.experienceNome);
      }
      if (pending.horario) {
        ghost.setAttribute('data-horario', pending.horario);
      }
      startCheckout(ghost, resumeOpts);
    }

    // Hook no Supabase: retoma assim que o usuário entra.
    try {
      if (window.supabaseClient && window.supabaseClient.auth &&
          typeof window.supabaseClient.auth.onAuthStateChange === 'function') {
        window.supabaseClient.auth.onAuthStateChange(function (event, session) {
          if (event === 'SIGNED_IN' && session) {
            // Pequeno delay pra UI do modal fechar antes do redirect.
            setTimeout(resumePendingCheckout, 250);
          }
        });
      }
    } catch (e) {
      console.warn('[Elarah checkout] não foi possível ouvir login', e);
    }

    // Caso o usuário já estivesse logado quando abrimos o modal (caso
    // raro de race), tenta retomar logo após o load.
    setTimeout(function () {
      if (isUserLogged()) resumePendingCheckout();
    }, 600);
  })();
});
