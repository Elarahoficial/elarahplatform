document.addEventListener('DOMContentLoaded', () => {

  // ===== EXPERIENCES DATA =====
  const experiences = [
    { data: "06/04", categoria: "Gastronomia", nome: "Pães Alemães", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#d4e7c5,#8cb369", imagem: "assets/experiences/paes-alemaes.jpg" },
    { data: "06/04", categoria: "Gastronomia", nome: "The Art of Lamen", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#e7d4c5,#b38a69", imagem: "assets/experiences/art-of-lemmen.jpg" },
    { data: "07/04", categoria: "Gastronomia", nome: "CEO Kitchen (Comida Asiática)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#f6d5a8,#f0a05e", imagem: "assets/experiences/ceo-kitchen.jpg" },
    { data: "08/04", categoria: "Gastronomia", nome: "Cozinha Tailandesa", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#d4e7c5,#8cb369", imagem: "assets/experiences/cozinha-tailandesa.jpg" },
    { data: "09/04", categoria: "Gastronomia", nome: "Cozinha Japonesa (Sushi/Sashimi)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#e7d4c5,#b38a69", imagem: "assets/experiences/cozinha-japonesa.jpg" },
    { data: "10/04", categoria: "Gastronomia", nome: "Torta Salgada", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#f6d5a8,#f0a05e", imagem: "assets/experiences/torta-salgada.jpg" },
    { data: "10/04", categoria: "Gastronomia", nome: "Izakaya (Japonesa)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#d4e7c5,#8cb369", imagem: "assets/experiences/izakaya.jpg" },
    { data: "11/04", categoria: "Gastronomia", nome: "Bolo Caseiro da Fazenda", horario: "16h00 – 19h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#e7d4c5,#b38a69", imagem: "assets/experiences/bolo-caseiro.jpg" },
    { data: "11/04", categoria: "Gastronomia", nome: "Churrasco sem Churrasqueira", horario: "16h00 – 19h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#f6d5a8,#f0a05e", imagem: "assets/experiences/churrasco.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Café Gelado)", horario: "10h30 – 11h30", duracao: "1h", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-cafe.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Praia)", horario: "13h00 – 14h30", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-praia.jpg"  },
    { data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Floral)", horario: "15h30 – 17h00", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-floral.jpg" },
    { data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-taca.jpg" },
    { data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "13h30 – 15h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-taca.jpg" },
    { data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "16h00 – 18h00", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-taca.jpg" },
    { data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$158", cor: "#d5c5e7,#9369b3", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "13h30 – 15h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$158", cor: "#d5c5e7,#9369b3", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "16h00 – 18h00", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$158", cor: "#d5c5e7,#9369b3", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-personalizada.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "13h30 – 15h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-personalizada.jpg" },
    { data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "16h00 – 18h00", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-personalizada.jpg" },
    { data: "12/04", categoria: "Vela", nome: "Vela (Cerveja & Caipirinha)", horario: "10h30 – 12h00", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break + petisco + cerveja", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-cerveja.jpg" },
    { data: "12/04", categoria: "Pintura", nome: "Pintura em Cerâmica", horario: "15h00 – 18h00", duracao: "3h", bairro: "Pinheiros", endereco: "Rua Capote Valente, 697 – São Paulo", inclui: "Materiais inclusos", preco: "R$360", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-ceramica.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Seg)", horario: "19h00 – 21h00", duracao: "2h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$162", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Seg)", horario: "09h00 – 12h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "17h15 – 19h15", duracao: "2h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$162", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "19h30 – 21h30", duracao: "2h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$162", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "09h00 – 12h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "14h00 – 17h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
  ];

  // ===== STATE =====
  let activeCategoria = '';
  let activeBairro = '';

  // ===== DOM REFS =====
  const grid = document.getElementById('experiences-grid');
  const countEl = document.getElementById('experiences-count');
  const emptyEl = document.getElementById('experiences-empty');
  const filterBairro = document.getElementById('filter-bairro');
  const filterCategoria = document.getElementById('filter-categoria');
  const filterBtn = document.getElementById('filter-btn');
  const categoryLinks = document.querySelectorAll('.category-link');

  // ===== RENDER CARDS =====
  function renderCards() {
    const filtered = experiences.filter((exp) => {
      const matchCat = !activeCategoria || exp.categoria === activeCategoria;
      const matchBairro = !activeBairro || exp.bairro === activeBairro;
      return matchCat && matchBairro;
    });

    grid.innerHTML = '';
    emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
    countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '');

    filtered.forEach((exp) => {
      const colors = exp.cor.split(',');
      const card = document.createElement('article');
      card.className = 'card';
      const imageContent = exp.imagem
        ? `<img src="${exp.imagem}" alt="${exp.nome}" class="card__image-photo">`
        : `<div class="card__image-placeholder" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});"><span>${exp.categoria}</span></div>`;

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
              ${exp.data} &middot; ${exp.horario}
            </p>
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${exp.duracao}
            </p>
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${exp.bairro}
            </p>
            <p class="card__detail card__detail--address">
              ${exp.endereco}
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

    // Re-attach favorite toggle
    grid.querySelectorAll('.card__favorite').forEach((btn) => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    });
  }

  // ===== CATEGORY LINK CLICK =====
  categoryLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      categoryLinks.forEach((c) => c.classList.remove('category-link--active'));
      link.classList.add('category-link--active');

      const text = link.textContent.trim();
      activeCategoria = text === 'Todas' ? '' : text;

      // Sync the dropdown
      filterCategoria.value = activeCategoria;

      renderCards();
    });
  });

  // ===== FILTER BUTTON =====
  filterBtn.addEventListener('click', () => {
    activeBairro = filterBairro.value;
    activeCategoria = filterCategoria.value;

    // Sync category links
    categoryLinks.forEach((c) => {
      c.classList.remove('category-link--active');
      const text = c.textContent.trim();
      if ((!activeCategoria && text === 'Todas') || text === activeCategoria) {
        c.classList.add('category-link--active');
      }
    });

    renderCards();

    // Scroll to results
    document.getElementById('experiencias').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ===== ALSO FILTER ON SELECT CHANGE =====
  filterBairro.addEventListener('change', () => {
    activeBairro = filterBairro.value;
    renderCards();
  });

  filterCategoria.addEventListener('change', () => {
    activeCategoria = filterCategoria.value;
    // Sync category links
    categoryLinks.forEach((c) => {
      c.classList.remove('category-link--active');
      const text = c.textContent.trim();
      if ((!activeCategoria && text === 'Todas') || text === activeCategoria) {
        c.classList.add('category-link--active');
      }
    });
    renderCards();
  });

  // ===== INITIAL RENDER =====
  renderCards();

  // ===== Explorar dropdown toggle =====
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');
      explorarBtn.querySelector('.header__nav-chevron').style.transform =
        explorarDropdown.classList.contains('open') ? 'rotate(180deg)' : '';
    });

    document.addEventListener('click', () => {
      explorarDropdown.classList.remove('open');
      explorarBtn.querySelector('.header__nav-chevron').style.transform = '';
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
