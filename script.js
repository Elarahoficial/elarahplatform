document.addEventListener('DOMContentLoaded', () => {
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
    { data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Praia)", horario: "13h00 – 14h30", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-praia.jpg" },
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
    { data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "14h00 – 17h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" }
  ];

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
  const categoryLinks = document.querySelectorAll('.category-link');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

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
        if (typeof ElarahAuth === 'undefined' || !ElarahAuth.isLoggedIn()) {
          ElarahAuth.openModal('login', 'Faça login para favoritar');
          return;
        }
        const result = ElarahAuth.toggleFavorite(expId);
        if (result.success) {
          btn.classList.toggle('active');
        }
      });
    });
  }

  function createCard(exp) {
    const colors = exp.cor.split(',');
    const card = document.createElement('article');
    card.className = 'card';

    const imageContent = exp.imagem
      ? `<img src="${exp.imagem}" alt="${exp.nome}" class="card__image-photo">`
      : `<div class="card__image-placeholder" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});"><span>${exp.categoria}</span></div>`;

    card.innerHTML = `
      <div class="card__image">
        ${imageContent}
        <button class="card__favorite" data-id="${exp.nome}_${exp.data}_${exp.horario}" aria-label="Favoritar">
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
          <p class="card__detail card__detail--address">${exp.endereco}</p>
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
    return card;
  }

  if (categoryLinks.length && filterCategoria) {
    categoryLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activeBusca = '';
        window.history.replaceState({}, '', '/elarahplatform/');
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
      window.history.replaceState({}, '', '/elarahplatform/');
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
    window.location.href = '/elarahplatform/?busca=' + encodeURIComponent(valor);
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
  ? '/elarahplatform/'
  : '/elarahplatform/?categoria=' + encodeURIComponent(text);

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

  function openOriginalsModal(experienceName, type) {
    if (!originalsModal) return;
    originalsModalExperience.value = experienceName;
    originalsModalTitle.textContent = experienceName;
    originalsModalDesc.textContent = type === 'participar'
      ? 'Preencha seus dados para registrar seu interesse nessa experiência.'
      : 'Entre na lista de espera e avisaremos você assim que a data for definida.';
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
    originalsModalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      originalsModalBody.style.display = 'none';
      originalsModalSuccess.style.display = 'block';
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && originalsModal && originalsModal.classList.contains('open')) {
      closeOriginalsModal();
    }
  });

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
      groupForm.style.display = 'none';
      if (groupSuccess) groupSuccess.style.display = 'block';
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
});

