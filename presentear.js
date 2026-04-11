document.addEventListener('DOMContentLoaded', async () => {

  // ===== GIFT EXPERIENCES DATA (shared source) =====
  let giftExperiences = [];
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      giftExperiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah presentear] falha ao carregar experiências', e);
    giftExperiences = [];
  }

  // ===== DOM REFS =====
  const grid = document.getElementById('gift-grid');
  const filterBtns = document.querySelectorAll('.gift-filter-btn');
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');
  const header = document.querySelector('.header');
  const searchInput = document.getElementById('search-input');
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  let activeFilter = '';

  // ===== RENDER CARDS =====
  function renderGiftCards() {
    if (!grid) return;

    const filtered = giftExperiences.filter((exp) => {
      return !activeFilter || exp.categoria === activeFilter;
    });

    grid.innerHTML = '';

    filtered.forEach((exp) => {
      const card = document.createElement('article');
      card.className = 'card';

      const horarios = Array.isArray(exp.horarios) && exp.horarios.length
        ? exp.horarios
        : (exp.horario ? [exp.horario] : []);
      const hasMultipleHorarios = horarios.length > 1;

      const horariosBlock = hasMultipleHorarios
        ? `<div class="card__horarios">${horarios.map((h, i) =>
            `<button type="button" class="card__horario-btn${i === 0 ? ' card__horario-btn--active' : ''}" data-horario="${h.replace(/"/g, '&quot;')}">${h}</button>`
          ).join('')}</div>`
        : '';

      card.innerHTML = `
        <div class="card__image">
          <img src="${exp.imagem}" alt="${exp.nome}" class="card__image-photo">
          <button class="card__favorite" aria-label="Favoritar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <span class="card__badge">${exp.data}</span>
        </div>
        <div class="card__body">
          <span class="card__category">${exp.categoria}</span>
          <h3 class="card__title">${exp.nome}</h3>
          <div class="card__details">
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              ${exp.duracao}
            </p>
            ${horariosBlock}
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${exp.bairro}
            </p>
            <p class="card__detail card__detail--includes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
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

    grid.querySelectorAll('.card__favorite').forEach((btn) => {
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
        const expId = (titleEl && titleEl.textContent.trim()) || '';
        const result = ElarahAuth.toggleFavorite(expId);
        if (result && result.success) {
          btn.classList.toggle('active');
        }
      });
    });
  }

  // ===== FILTER BUTTONS =====
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('gift-filter-btn--active'));
      btn.classList.add('gift-filter-btn--active');
      activeFilter = btn.dataset.filter;
      renderGiftCards();
    });
  });

  // ===== SEARCH =====
  function executarBuscaPresentear() {
    const valor = searchInput?.value.trim();
    if (!valor) return;
    window.location.href = '/elarahplatform/?busca=' + encodeURIComponent(valor);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBuscaPresentear();
      }
    });
  }

  // ===== EXPLORAR DROPDOWN =====
  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');

      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) {
        chevron.style.transform = explorarDropdown.classList.contains('open')
          ? 'rotate(180deg)'
          : '';
      }
    });

    explorarDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
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
        const destino = text === 'Todas'
          ? '/elarahplatform/'
          : '/elarahplatform/?categoria=' + encodeURIComponent(text);

        window.location.href = destino;
      });
    });
  }

  // ===== MOBILE MENU =====
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ===== SMOOTH SCROLL =====
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

  // ===== HEADER SHADOW =====
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 1px 8px rgba(0,0,0,0.06)'
        : 'none';
    });
  }

  // ===== INITIAL RENDER =====
  renderGiftCards();
});
