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

   if (currentUser.partnerStatus === 'approved') {
  if (approvedWrap) approvedWrap.style.display = 'block';

  const dadosSalvos = localStorage.getItem('hostRequest');
 const pd = dadosSalvos ? JSON.parse(dadosSalvos) : (currentUser.partnerData || {});

    if (parceiroInfo) {
  parceiroInfo.innerHTML = `
    <div class="account__partner-detail"><strong>Nome</strong><span>${pd.nome || ''}</span></div>
    <div class="account__partner-detail"><strong>Email</strong><span>${pd.email || ''}</span></div>
    <div class="account__partner-detail"><strong>WhatsApp</strong><span>${pd.whatsapp || ''}</span></div>
    <div class="account__partner-detail"><strong>Categoria</strong><span>${pd.tipo || ''}</span></div>
    <div class="account__partner-detail"><strong>Descrição</strong><span>${pd.descricao || ''}</span></div>
    <div class="account__partner-detail"><strong>Status</strong><span>${pd.status || 'Aprovado'}</span></div>
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
  
// ===== FAVORITOS =====
function renderFavoritos() {
  const favoritos = ElarahAuth.getFavorites();
  const empty = document.getElementById('favoritos-empty');
  const lista = document.getElementById('favoritos-lista');

  const imageMap = {
    "Pães Alemães": "assets/experiences/paes-alemaes.jpg",
    "The Art of Lamen": "assets/experiences/art-of-lemmen.jpg",
    "CEO Kitchen (Comida Asiática)": "assets/experiences/ceo-kitchen.jpg",
    "Cozinha Tailandesa": "assets/experiences/cozinha-tailandesa.jpg",
    "Cozinha Japonesa (Sushi/Sashimi)": "assets/experiences/cozinha-japonesa.jpg",
    "Torta Salgada": "assets/experiences/torta-salgada.jpg",
    "Izakaya (Japonesa)": "assets/experiences/izakaya.jpg",
    "Bolo Caseiro da Fazenda": "assets/experiences/bolo-caseiro.jpg",
    "Churrasco sem Churrasqueira": "assets/experiences/churrasco.jpg",
    "Vela + Home Spray (Café Gelado)": "assets/experiences/vela-cafe.jpg",
    "Vela + Home Spray (Praia)": "assets/experiences/vela-praia.jpg",
    "Vela + Home Spray (Floral)": "assets/experiences/vela-floral.jpg",
    "Pintura em Taça": "assets/experiences/pintura-taca.jpg",
    "Sabonete Artesanal": "assets/experiences/sabonete-artesanal.jpg",
    "Vela Personalizada": "assets/experiences/vela-personalizada.jpg",
    "Vela (Cerveja & Caipirinha)": "assets/experiences/vela-cerveja.jpg",
    "Pintura em Cerâmica": "assets/experiences/pintura-ceramica.jpg",
    "Aula de Tufting (Seg)": "assets/experiences/tufting.jpg",
    "Aula de Tufting (Ter/Qui/Sex)": "assets/experiences/tufting.jpg"
  };

  if (!empty || !lista) return;

  if (!favoritos.length) {
    empty.style.display = 'block';
    lista.style.display = 'none';
    lista.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  lista.style.display = 'grid';
lista.style.gridTemplateColumns = '1fr 1fr';
lista.style.gap = '20px';

  lista.innerHTML = favoritos.map(f => {
    const [nome, data, horario] = f.split('_');
    const imagem = imageMap[nome] || '';

    return `
      <div style="
        border: 1px solid #eee;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 20px;
        background: #fff;
      ">
      <div style="
  width: 100%;
  aspect-ratio: 1/1;
  background: #f5f5f5;
">
          ${imagem ? `<img src="${imagem}" alt="${nome}" style="width:100%; height:100%; object-fit:cover; display:block;">` : ''}
        </div>

        <div style="padding:16px;">
          <span style="
            font-size:12px;
            color:#ff6a00;
            font-weight:600;
            letter-spacing:0.5px;
          ">
            EXPERIÊNCIA
          </span>

          <h3 style="
            margin:8px 0;
            font-size:18px;
          ">
            ${nome}
          </h3>

          <p style="
            font-size:14px;
            color:#666;
          ">
            ${data || ''}${horario ? ' · ' + horario : ''}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

renderFavoritos();
  // ===== LOGOUT =====
  const logoutBtn = document.getElementById('account-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ElarahAuth.logout();
      window.location.href = 'index.html';
    });
  }

  // ===== HEADER SEARCH =====
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
