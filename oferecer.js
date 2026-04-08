document.addEventListener('DOMContentLoaded', () => {
  // ===== CONFIG =====
  const BASE = '/elarahplatform/';
  const LOGIN_URL = BASE + 'login.html';
  const CONTA_URL = BASE + 'minha-conta.html?tab=oferecer-experiencia';
  const BUSCA_URL = BASE + 'resultado-busca.html';
  const CATEGORIA_URL = BASE + 'categoria.html';

  // ===== MOBILE MENU =====
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ===== HEADER SHADOW =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow =
        window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }

  // ===== SCROLL SUAVE SÓ PARA ÂNCORAS INTERNAS REAIS =====
  const internalAnchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  internalAnchors.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== EXPLORAR =====
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');
  const dropdownItems = document.querySelectorAll('.header__dropdown-item');

  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      explorarDropdown.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (
        !explorarDropdown.contains(e.target) &&
        !explorarBtn.contains(e.target)
      ) {
        explorarDropdown.classList.remove('is-open');
      }
    });
  }

  if (dropdownItems.length) {
    dropdownItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        const categoria = item.textContent.trim().toLowerCase();

        if (categoria === 'todas') {
          window.location.href = CATEGORIA_URL;
          return;
        }

        window.location.href =
          CATEGORIA_URL + '?categoria=' + encodeURIComponent(categoria);
      });
    });
  }

  // ===== BUSCAR =====
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  function executarBusca() {
    if (!searchInput) return;

    const termo = searchInput.value.trim();
    if (!termo) return;

    window.location.href = BUSCA_URL + '?busca=' + encodeURIComponent(termo);
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', executarBusca);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBusca();
      }
    });
  }

  // ===== BOTÃO ENTRAR DO HEADER =====
  const headerLoginBtn = document.querySelector('.header__login-btn');
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => {
      window.location.href = LOGIN_URL;
    });
  }

  // ===== STATUS PARCEIRO =====
  const partnerCta = document.getElementById('partnerCta');
  const hostStatusBox = document.getElementById('host-status-box');
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const resumoDados = document.getElementById('resumo-dados');

  let dados = null;

  try {
    const dadosSalvos = localStorage.getItem('hostRequest');
    if (dadosSalvos) {
      dados = JSON.parse(dadosSalvos);
    }
  } catch (error) {
    console.error('Erro ao ler hostRequest:', error);
  }

  if (dados && dados.status === 'approved') {
    if (partnerCta) partnerCta.style.display = 'none';
    if (hostStatusBox) hostStatusBox.style.display = 'block';
    if (perfilNome) perfilNome.textContent = dados.nome || '';
    if (perfilEmail) perfilEmail.textContent = dados.email || '';

    if (resumoDados) {
      resumoDados.innerHTML =
        '<strong>WhatsApp:</strong> ' + (dados.whatsapp || '-') + '<br>' +
        '<strong>Categoria:</strong> ' + (dados.tipo || '-') + '<br>' +
        '<strong>Descrição:</strong> ' + (dados.descricao || 'Não informada');
    }
  } else {
    if (partnerCta) partnerCta.style.display = 'flex';
    if (hostStatusBox) hostStatusBox.style.display = 'none';
  }

  // ===== FLUXO PARCEIRO =====
  function irParaFluxoParceiro() {
    let usuarioLogado = null;

    try {
      usuarioLogado = JSON.parse(localStorage.getItem('loggedUser'));
    } catch (error) {
      console.error('Erro ao ler loggedUser:', error);
    }

    if (usuarioLogado) {
      window.location.href = CONTA_URL;
    } else {
      window.location.href =
        LOGIN_URL + '?redirect=' + encodeURIComponent(CONTA_URL);
    }
  }

  const partnerHeroBtn = document.getElementById('partnerHeroBtn');
  const partnerCtaBtn = document.getElementById('partnerCtaBtn');

  if (partnerHeroBtn) {
    partnerHeroBtn.addEventListener('click', irParaFluxoParceiro);
  }

  if (partnerCtaBtn) {
    partnerCtaBtn.addEventListener('click', irParaFluxoParceiro);
  }
});
