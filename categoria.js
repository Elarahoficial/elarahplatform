document.addEventListener('DOMContentLoaded', async () => {

  // ===== SHARED DATA SOURCE =====
  let experiences = [];
  try {
 claude/add-experience-visibility-toggle-VcLu4
    if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
      experiences = await ElarahData.getVisibleExperiences();

    if (typeof ElarahData !== 'undefined' && ElarahData.getActiveExperiences) {
      experiences = await ElarahData.getActiveExperiences();
 claude/create-elarah-homepage-VsE5i
    } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      experiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah categoria] falha ao carregar experiências', e);
    experiences = [];
  }

  // ===== URL PARAMS =====
  const params = new URLSearchParams(window.location.search);
  let activeCategoria = params.get('cat') || '';
  let activeBairro = '';

  // ===== DOM REFS =====
  const grid = document.getElementById('cat-grid');
  const emptyEl = document.getElementById('cat-empty');
  const titleEl = document.getElementById('cat-title');
  const countEl = document.getElementById('cat-count');
  const breadcrumb = document.getElementById('cat-breadcrumb-current');
  const filterCategoria = document.getElementById('cat-filter-categoria');
  const filterBairro = document.getElementById('cat-filter-bairro');

  // ===== POPULATE BAIRRO DROPDOWN =====
  const bairros = [...new Set(experiences.map(e => e.bairro))].sort();
  bairros.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    filterBairro.appendChild(opt);
  });

  // ===== SET INITIAL FILTER STATE =====
  if (activeCategoria) {
    filterCategoria.value = activeCategoria;
  }

  function updateTitle() {
    const cat = activeCategoria || 'Todas as experiências';
    titleEl.textContent = activeCategoria ? activeCategoria : 'Todas as experiências';
    breadcrumb.textContent = activeCategoria || 'Todas as experiências';
    document.title = (activeCategoria || 'Experiências') + ' — Elarah';
  }

  // ===== RENDER =====
  function renderCards() {
    const filtered = experiences.filter(exp => {
      const matchCat = !activeCategoria || exp.categoria === activeCategoria;
      const matchBairro = !activeBairro || exp.bairro === activeBairro;
      return matchCat && matchBairro;
    });

    grid.innerHTML = '';
    emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
    countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '');
    updateTitle();

    filtered.forEach(exp => {
      const colors = (exp.cor || '#f6d5a8,#f0a05e').split(',');
      const card = document.createElement('article');
      card.className = 'card';

      const horarios = Array.isArray(exp.horarios) && exp.horarios.length
        ? exp.horarios
        : (exp.horario ? [exp.horario] : []);
      const hasMultipleHorarios = horarios.length > 1;

      const imageContent = exp.imagem
        ? `<img src="${exp.imagem}" alt="${exp.nome}" class="card__image-photo">`
        : `<div class="card__image-placeholder" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});"><span>${exp.categoria}</span></div>`;

      const horarioLine = hasMultipleHorarios
        ? `${exp.data}`
        : `${exp.data}${horarios[0] ? ' &middot; ' + horarios[0] : ''}`;

      const horariosBlock = hasMultipleHorarios
        ? `<div class="card__horarios">${horarios.map((h, i) =>
            `<button type="button" class="card__horario-btn${i === 0 ? ' card__horario-btn--active' : ''}" data-horario="${h.replace(/"/g, '&quot;')}">${h}</button>`
          ).join('')}</div>`
        : '';

      card.innerHTML = `
        <div class="card__image">
          ${imageContent}
          <button class="card__favorite" aria-label="Favoritar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <span class="card__badge">${exp.data}</span>
        </div>
        <div class="card__body">
          <span class="card__category">${exp.categoria}</span>
          <h3 class="card__title">${exp.nome}</h3>
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
          </div>
        </div>
      `;

      if (hasMultipleHorarios) {
        card.querySelectorAll('.card__horario-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.querySelectorAll('.card__horario-btn').forEach(b => b.classList.remove('card__horario-btn--active'));
            btn.classList.add('card__horario-btn--active');
          });
        });
      }

      grid.appendChild(card);
    });

    grid.querySelectorAll('.card__favorite').forEach(btn => {
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

  // ===== EXPLORAR DROPDOWN =====
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');
      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) chevron.style.transform = explorarDropdown.classList.contains('open') ? 'rotate(180deg)' : '';
    });

    document.addEventListener('click', () => {
      explorarDropdown.classList.remove('open');
      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) chevron.style.transform = '';
    });
  }

  // ===== MOBILE MENU =====
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => nav.classList.toggle('mobile-open'));
  }

  // ===== HEADER SHADOW =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }

});
