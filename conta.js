document.addEventListener('DOMContentLoaded', () => {
  // ===== AUTH GUARD =====
  const user = ElarahAuth.getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // ===== POPULATE SIDEBAR =====
  const initials = (user.nome || '')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarEl = document.getElementById('account-avatar');
  const nameEl = document.getElementById('account-name');
  const emailEl = document.getElementById('account-email');
  const badgeEl = document.getElementById('account-badge');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = user.nome || '';
  if (emailEl) emailEl.textContent = user.email || '';

  if (badgeEl) {
    if (user.partnerStatus === 'approved') {
      badgeEl.textContent = 'Parceiro';
      badgeEl.className = 'account__badge account__badge--partner';
    } else if (user.partnerStatus === 'pending') {
      badgeEl.textContent = 'Em análise';
      badgeEl.className = 'account__badge account__badge--user';
    } else if (user.partnerStatus === 'rejected') {
      badgeEl.textContent = 'Revisar cadastro';
      badgeEl.className = 'account__badge account__badge--user';
    } else {
      badgeEl.textContent = 'Usuário';
      badgeEl.className = 'account__badge account__badge--user';
    }
  }

 // ===== SECTION NAVIGATION =====
const menuItems = document.querySelectorAll('.account__menu-item');
const sections = document.querySelectorAll('.account__section');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.section;

    menuItems.forEach(m => m.classList.remove('account__menu-item--active'));
    item.classList.add('account__menu-item--active');

    sections.forEach(s => s.classList.remove('account__section--active'));

    const targetSection = document.getElementById('section-' + target);
    if (targetSection) targetSection.classList.add('account__section--active');
  });
});

const sectionParam = new URLSearchParams(window.location.search).get('section');

if (sectionParam) {
  const targetBtn = document.querySelector(`.account__menu-item[data-section="${sectionParam}"]`);
  if (targetBtn) targetBtn.click();
}
   
  // ===== HEADER FAVORITES SHORTCUT =====
  const headerFav = document.querySelector('.header__action-btn[aria-label="Favoritos"]');
  if (headerFav) {
    headerFav.addEventListener('click', (e) => {
      e.preventDefault();
      const favoritosBtn = document.querySelector('.account__menu-item[data-section="favoritos"]');
      if (favoritosBtn) favoritosBtn.click();
    });
  }

  // ===== MEUS DADOS FORM =====
  const dadosNome = document.getElementById('dados-nome');
  const dadosEmail = document.getElementById('dados-email');
  const dadosTelefone = document.getElementById('dados-telefone');
  const dadosCidade = document.getElementById('dados-cidade');
  const formDados = document.getElementById('form-dados');

  if (dadosNome) dadosNome.value = user.nome || '';
  if (dadosEmail) dadosEmail.value = user.email || '';
  if (dadosTelefone) dadosTelefone.value = user.telefone || '';
  if (dadosCidade) dadosCidade.value = user.cidade || '';

  if (formDados) {
    formDados.addEventListener('submit', (e) => {
      e.preventDefault();

      const result = ElarahAuth.updateUser({
        nome: dadosNome ? dadosNome.value.trim() : '',
        telefone: dadosTelefone ? dadosTelefone.value.trim() : '',
        cidade: dadosCidade ? dadosCidade.value.trim() : ''
      });

      if (result.success) {
        const successEl = document.getElementById('dados-success');
        if (successEl) {
          successEl.classList.add('account__form-success--show');
          setTimeout(() => {
            successEl.classList.remove('account__form-success--show');
          }, 3000);
        }

        if (nameEl) nameEl.textContent = result.user.nome || '';

        const newInitials = (result.user.nome || '')
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        if (avatarEl) avatarEl.textContent = newInitials;

        ElarahAuth.updateHeaderUI();
      }
    });
  }

  // ===== PARTNER SECTION =====
  function renderPartnerSection() {
    const currentUser = ElarahAuth.getCurrentUser();

    const formWrap = document.getElementById('parceiro-form-wrap');
    const pendingWrap = document.getElementById('parceiro-pending');
    const approvedWrap = document.getElementById('parceiro-approved');
    const rejectedWrap = document.getElementById('parceiro-rejected');
    const parceiroInfo = document.getElementById('parceiro-info');

    if (formWrap) formWrap.style.display = 'none';
    if (pendingWrap) pendingWrap.style.display = 'none';
    if (approvedWrap) approvedWrap.style.display = 'none';
    if (rejectedWrap) rejectedWrap.style.display = 'none';

    if (currentUser.partnerStatus === 'pending') {
      if (pendingWrap) pendingWrap.style.display = 'block';
      return;
    }

    if (currentUser.partnerStatus === 'approved' && currentUser.partnerData) {
      if (approvedWrap) approvedWrap.style.display = 'block';

      const pd = currentUser.partnerData || {};

      if (parceiroInfo) {
        parceiroInfo.innerHTML = `
          <div class="account__partner-detail"><strong>Marca</strong><span>${pd.marca || ''}</span></div>
          <div class="account__partner-detail"><strong>Categoria</strong><span>${pd.tipo || ''}</span></div>
          <div class="account__partner-detail"><strong>Local</strong><span>${pd.bairro || ''}, ${pd.cidade || ''}</span></div>
          ${pd.social ? `<div class="account__partner-detail"><strong>Redes</strong><span>${pd.social}</span></div>` : ''}
          <div class="account__partner-detail"><strong>Descrição</strong><span>${pd.descricao || ''}</span></div>
          ${pd.approvedAt ? `<div class="account__partner-detail"><strong>Aprovado em</strong><span>${new Date(pd.approvedAt).toLocaleDateString('pt-BR')}</span></div>` : ''}
        `;
      }

      return;
    }

    if (currentUser.partnerStatus === 'rejected') {
      if (rejectedWrap) rejectedWrap.style.display = 'block';
      return;
    }

    if (formWrap) formWrap.style.display = 'block';
  }

  renderPartnerSection();

  // ===== PARTNER FORM SUBMIT =====
  const parceiroForm = document.getElementById('form-parceiro');
  if (parceiroForm) {
    parceiroForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const partnerData = {
        marca: document.getElementById('parceiro-marca')?.value.trim() || '',
        tipo: document.getElementById('parceiro-tipo')?.value || '',
        bairro: document.getElementById('parceiro-bairro')?.value.trim() || '',
        cidade: document.getElementById('parceiro-cidade')?.value.trim() || '',
        social: document.getElementById('parceiro-social')?.value.trim() || '',
        descricao: document.getElementById('parceiro-descricao')?.value.trim() || ''
      };

      const result = ElarahAuth.becomePartner(partnerData);

      if (result.success) {
        if (badgeEl) {
          badgeEl.textContent = 'Em análise';
          badgeEl.className = 'account__badge account__badge--user';
        }

        renderPartnerSection();
      }
    });
  }

  // ===== LOGOUT =====
  const logoutBtn = document.getElementById('account-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ElarahAuth.logout();
      window.location.href = 'index.html';
    });
  }
// ===== HEADER SEARCH (COPIADO DA HOME) =====
const searchInput = document.querySelector('.header__search-input');

function executarBuscaConta() {
  const valor = searchInput?.value.trim();
  if (!valor) return;

  window.location.href = 'index.html?busca=' + encodeURIComponent(valor);
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executarBuscaConta();
    }
  });
}
  
  // ===== EXPLORAR DROPDOWN =====
  // ===== EXPLORAR DROPDOWN =====
const explorarBtn = document.getElementById('explorar-btn');
const explorarDropdown = document.getElementById('explorar-dropdown');

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
        ? 'index.html'
        : 'index.html?categoria=' + encodeURIComponent(text);

      window.location.href = destino;
    });
  });
}
  
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
      header.style.boxShadow = window.scrollY > 10
        ? '0 1px 8px rgba(0,0,0,0.06)'
        : 'none';
    });
  }
});
