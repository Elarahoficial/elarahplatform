document.addEventListener('DOMContentLoaded', () => {

  // ===== AUTH GUARD =====
  const user = ElarahAuth.getCurrentUser();
  if (!user) {
    window.location.href = '/';
    return;
  }

  // ===== POPULATE SIDEBAR =====
  const initials = user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('account-avatar').textContent = initials;
  document.getElementById('account-name').textContent = user.nome;
  document.getElementById('account-email').textContent = user.email;

  const badge = document.getElementById('account-badge');
  if (user.isPartner) {
    badge.textContent = 'Parceiro';
    badge.className = 'account__badge account__badge--partner';
  } else {
    badge.textContent = 'Usuário';
    badge.className = 'account__badge account__badge--user';
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
      document.getElementById('section-' + target).classList.add('account__section--active');
    });
  });

  // ===== MEUS DADOS FORM =====
  document.getElementById('dados-nome').value = user.nome;
  document.getElementById('dados-email').value = user.email;
  document.getElementById('dados-telefone').value = user.telefone;
  document.getElementById('dados-cidade').value = user.cidade || '';

  document.getElementById('form-dados').addEventListener('submit', (e) => {
    e.preventDefault();
    const result = ElarahAuth.updateUser({
      nome: document.getElementById('dados-nome').value.trim(),
      telefone: document.getElementById('dados-telefone').value.trim(),
      cidade: document.getElementById('dados-cidade').value.trim()
    });

    if (result.success) {
      const successEl = document.getElementById('dados-success');
      successEl.classList.add('account__form-success--show');
      setTimeout(() => successEl.classList.remove('account__form-success--show'), 3000);

      // Update sidebar
      document.getElementById('account-name').textContent = result.user.nome;
      const newInitials = result.user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      document.getElementById('account-avatar').textContent = newInitials;

      ElarahAuth.updateHeaderUI();
    }
  });

  // ===== PARTNER SECTION =====
  function renderPartnerSection() {
    const currentUser = ElarahAuth.getCurrentUser();
    const formWrap = document.getElementById('parceiro-form-wrap');
    const confirmed = document.getElementById('parceiro-confirmed');

    if (currentUser.isPartner && currentUser.partnerData) {
      formWrap.style.display = 'none';
      confirmed.style.display = 'block';

      const pd = currentUser.partnerData;
      document.getElementById('parceiro-info').innerHTML = `
        <div class="account__partner-detail"><strong>Marca</strong><span>${pd.marca}</span></div>
        <div class="account__partner-detail"><strong>Categoria</strong><span>${pd.tipo}</span></div>
        <div class="account__partner-detail"><strong>Local</strong><span>${pd.bairro}, ${pd.cidade}</span></div>
        ${pd.social ? `<div class="account__partner-detail"><strong>Redes</strong><span>${pd.social}</span></div>` : ''}
        <div class="account__partner-detail"><strong>Descrição</strong><span>${pd.descricao}</span></div>
        <div class="account__partner-detail"><strong>Parceiro desde</strong><span>${new Date(pd.registeredAt).toLocaleDateString('pt-BR')}</span></div>
      `;
    } else {
      formWrap.style.display = 'block';
      confirmed.style.display = 'none';
    }
  }

  renderPartnerSection();

  document.getElementById('form-parceiro').addEventListener('submit', (e) => {
    e.preventDefault();

    const partnerData = {
      marca: document.getElementById('parceiro-marca').value.trim(),
      tipo: document.getElementById('parceiro-tipo').value,
      bairro: document.getElementById('parceiro-bairro').value.trim(),
      cidade: document.getElementById('parceiro-cidade').value.trim(),
      social: document.getElementById('parceiro-social').value.trim(),
      descricao: document.getElementById('parceiro-descricao').value.trim()
    };

    const result = ElarahAuth.becomePartner(partnerData);
    if (result.success) {
      // Update badge
      const badgeEl = document.getElementById('account-badge');
      badgeEl.textContent = 'Parceiro';
      badgeEl.className = 'account__badge account__badge--partner';

      renderPartnerSection();
    }
  });

  // ===== LOGOUT =====
  document.getElementById('account-logout').addEventListener('click', () => {
    ElarahAuth.logout();
    window.location.href = '/';
  });

  // ===== EXPLORAR DROPDOWN =====
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
