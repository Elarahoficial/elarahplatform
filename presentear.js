document.addEventListener('DOMContentLoaded', () => {

  // ===== GIFT EXPERIENCES DATA (curated for gifting) =====
  const giftExperiences = [
    { data: "06/04", categoria: "Gastronomia", nome: "Pães Alemães", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", inclui: "Aula completa", preco: "R$383", imagem: "assets/experiences/paes-alemaes.jpg" },
    { data: "06/04", categoria: "Gastronomia", nome: "The Art of Lamen", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", inclui: "Aula completa", preco: "R$383", imagem: "assets/experiences/art-of-lemmen.jpg" },
    { data: "07/04", categoria: "Gastronomia", nome: "CEO Kitchen (Comida Asiática)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", inclui: "Aula completa", preco: "R$383", imagem: "assets/experiences/ceo-kitchen.jpg" },
    { data: "08/04", categoria: "Gastronomia", nome: "Cozinha Tailandesa", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", inclui: "Aula completa", preco: "R$383", imagem: "assets/experiences/cozinha-tailandesa.jpg" },
    { data: "09/04", categoria: "Gastronomia", nome: "Cozinha Japonesa (Sushi/Sashimi)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", inclui: "Aula completa", preco: "R$383", imagem: "assets/experiences/cozinha-japonesa.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Café Gelado)", horario: "10h30 – 11h30", duracao: "1h", bairro: "Brooklin", inclui: "Coffee break", preco: "R$180", imagem: "assets/experiences/vela-cafe.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Floral)", horario: "15h30 – 17h00", duracao: "1h30", bairro: "Brooklin", inclui: "Coffee break", preco: "R$180", imagem: "assets/experiences/vela-floral.jpg" },
    { data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", inclui: "Vinho à vontade", preco: "R$262", imagem: "assets/experiences/pintura-taca.jpg" },
    { data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", inclui: "Vinho à vontade", preco: "R$158", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", inclui: "Vinho à vontade", preco: "R$262", imagem: "assets/experiences/vela-personalizada.jpg" },
    { data: "12/04", categoria: "Pintura", nome: "Pintura em Cerâmica", horario: "15h00 – 18h00", duracao: "3h", bairro: "Pinheiros", inclui: "Materiais inclusos", preco: "R$360", imagem: "assets/experiences/pintura-ceramica.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting", horario: "19h00 – 21h00", duracao: "2h", bairro: "Itaim", inclui: "Experiência completa", preco: "R$162", imagem: "assets/experiences/tufting.jpg" },
  ];

  // ===== DOM REFS =====
  const grid = document.getElementById('gift-grid');
  const filterBtns = document.querySelectorAll('.gift-filter-btn');
  let activeFilter = '';

  // ===== RENDER CARDS =====
  function renderGiftCards() {
    const filtered = giftExperiences.filter((exp) => {
      return !activeFilter || exp.categoria === activeFilter;
    });

    grid.innerHTML = '';

    filtered.forEach((exp) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card__image">
          <img src="${exp.imagem}" alt="${exp.nome}" class="card__image-photo">
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${exp.duracao}
            </p>
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${exp.bairro}
            </p>
            <p class="card__detail card__detail--includes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              ${exp.inclui}
            </p>
          </div>
          <div class="card__footer">
            <p class="card__price"><strong>${exp.preco}</strong></p>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Favorite toggle
    grid.querySelectorAll('.card__favorite').forEach((btn) => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
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

  // ===== INITIAL RENDER =====
  renderGiftCards();
// ===== Explorar dropdown toggle + redirect =====
const explorarBtn = document.getElementById('explorar-btn');
const explorarDropdown = document.getElementById('explorar-dropdown');

if (explorarBtn && explorarDropdown) {
  explorarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    explorarDropdown.classList.toggle('open');

    const chevron = explorarBtn.querySelector('.header__nav-chevron');
    if (chevron) {
      chevron.style.transform = explorarDropdown.classList.contains('open')
        ? 'rotate(180deg)'
        : '';
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
      const destino = text === 'Todas'
        ? '/elarahplatform/'
        : '/elarahplatform/?busca=' + encodeURIComponent(text);

      window.location.href = destino;
    });
  });
}

  // ===== Mobile menu toggle =====
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ===== Smooth scroll for anchor links =====
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

  // ===== Header shadow on scroll =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }
});
// ===== SEARCH REDIRECT FINAL =====
const input = document.getElementById('search-input');

if (input) {
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();

      const valor = input.value.trim();

      if (valor !== '') {
        window.location.href = '/elarahplatform/?busca=' + encodeURIComponent(valor);
      }
    }
  });
}
