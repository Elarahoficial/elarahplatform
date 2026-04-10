/* =============================================
   ELARAH AUTH MODULE
   Login local por navegador/dispositivo
   Sem Firebase
   ============================================= */

const ElarahAuth = (function () {
  const USERS_KEY = 'elarah_users';
  const SESSION_KEY = 'elarah_session';
  let modalEl = null;
  let headerEventsBound = false;

  const ADMIN_CREDENTIALS = {
    email: 'contato.elarah@gmail.com',
    senha: 'Elarah2026DM@',
    role: 'admin'
  };

  function getBasePath() {
    return '/elarahplatform/';
  }

  function goTo(path) {
    window.location.href = getBasePath() + path;
  }

  function isAdminEmail(email) {
    return (email || '').trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
  }

  function generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    return localStorage.getItem(SESSION_KEY);
  }

  function setSession(userId) {
    localStorage.setItem(SESSION_KEY, userId);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function normalizeUser(user) {
    if (!user) return null;

    return {
      id: user.id,
      nome: user.nome || '',
      email: (user.email || '').trim().toLowerCase(),
      senha: user.senha || '',
      telefone: user.telefone || '',
      cidade: user.cidade || '',
      partnerStatus: user.partnerStatus || 'none',
      partnerData: user.partnerData || null,
      favorites: Array.isArray(user.favorites) ? user.favorites : []
    };
  }

  function getCurrentUser() {
    if (isAdmin()) {
      return {
        id: 'admin',
        nome: 'Admin',
        email: ADMIN_CREDENTIALS.email,
        role: 'admin',
        telefone: '',
        cidade: '',
        partnerStatus: 'none',
        partnerData: null,
        favorites: []
      };
    }

    const sessionId = getSession();
    if (!sessionId) return null;

    const users = getUsers();
    const found = users.find(user => user.id === sessionId);
    return normalizeUser(found || null);
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function register({ nome, email, senha, telefone, cidade }) {
    const users = getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!nome || !cleanEmail || !senha || !telefone) {
      return { success: false, error: 'Preencha os campos obrigatórios.' };
    }

    if (senha.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    const existing = users.find(user => (user.email || '').trim().toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Esse e-mail já está cadastrado.' };
    }

    const newUser = normalizeUser({
      id: generateId(),
      nome: nome.trim(),
      email: cleanEmail,
      senha: senha.trim(),
      telefone: (telefone || '').trim(),
      cidade: (cidade || '').trim(),
      partnerStatus: 'none',
      partnerData: null,
      favorites: []
    });

    users.push(newUser);
    saveUsers(users);
    setSession(newUser.id);

    return { success: true, user: newUser };
  }

  function login(email, senha) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSenha = (senha || '').trim();

    if (isAdminEmail(cleanEmail) && cleanSenha === ADMIN_CREDENTIALS.senha) {
      localStorage.setItem('elarah_admin', 'true');
      return {
        success: true,
        user: { nome: 'Admin', email: ADMIN_CREDENTIALS.email, role: 'admin' },
        isAdmin: true
      };
    }

    const users = getUsers();
    const found = users.find(user =>
      (user.email || '').trim().toLowerCase() === cleanEmail &&
      (user.senha || '') === cleanSenha
    );

    if (!found) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    setSession(found.id);
    return { success: true, user: normalizeUser(found) };
  }

  function isAdmin() {
    return localStorage.getItem('elarah_admin') === 'true';
  }

  function logoutAdmin() {
    localStorage.removeItem('elarah_admin');
  }

  function logout() {
    if (isAdmin()) {
      logoutAdmin();
    }

    clearSession();
    updateHeaderUI();
    document.dispatchEvent(new CustomEvent('elarah-auth-ready'));
  }

  function updateUser(data) {
    const current = getCurrentUser();
    if (!current || current.role === 'admin') {
      return { success: false, error: 'Não autenticado.' };
    }

    const users = getUsers();
    const index = users.findIndex(user => user.id === current.id);
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const updated = normalizeUser({
      ...users[index],
      ...data,
      email: users[index].email,
      senha: users[index].senha
    });

    users[index] = updated;
    saveUsers(users);

    return { success: true, user: updated };
  }

  function becomePartner(partnerData) {
    return updateUser({
      partnerStatus: 'pending',
      partnerData: {
        ...partnerData,
        requestedAt: new Date().toISOString()
      }
    });
  }

  function getFavorites() {
    const current = getCurrentUser();
    if (!current || current.role === 'admin') return [];
    return Array.isArray(current.favorites) ? current.favorites : [];
  }

  function isFavorite(experienceId) {
    return getFavorites().includes(experienceId);
  }

  function toggleFavorite(experienceId) {
    const current = getCurrentUser();
    if (!current || current.role === 'admin') {
      return { success: false, error: 'Faça login para favoritar.' };
    }

    const users = getUsers();
    const index = users.findIndex(user => user.id === current.id);
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const favorites = Array.isArray(users[index].favorites) ? [...users[index].favorites] : [];
    const favIndex = favorites.indexOf(experienceId);

    if (favIndex >= 0) {
      favorites.splice(favIndex, 1);
    } else {
      favorites.push(experienceId);
    }

    users[index].favorites = favorites;
    saveUsers(users);

    return { success: true, favorites };
  }

  function requireLogin(callback) {
    if (isLoggedIn()) {
      if (callback) callback(getCurrentUser());
      return true;
    }

    openModal('login', 'Faça login para continuar');
    return false;
  }

  function createModal() {
    if (modalEl) return modalEl;

    const div = document.createElement('div');
    div.className = 'auth-modal';
    div.id = 'auth-modal';
    div.innerHTML = `
      <div class="auth-modal__backdrop"></div>
      <div class="auth-modal__container">
        <button class="auth-modal__close" aria-label="Fechar">&times;</button>

        <div class="auth-modal__header">
          <img src="assets/logo.png" alt="Elarah" class="auth-modal__logo">
          <p class="auth-modal__message" id="auth-modal-message"></p>
        </div>

        <div class="auth-modal__tabs">
          <button class="auth-modal__tab auth-modal__tab--active" data-tab="login">Entrar</button>
          <button class="auth-modal__tab" data-tab="register">Criar conta</button>
        </div>

        <form class="auth-modal__form" id="auth-form-login">
          <div class="auth-modal__field">
            <label class="auth-modal__label">E-mail</label>
            <input type="email" class="auth-modal__input" id="auth-login-email" placeholder="seu@email.com" required>
          </div>
          <div class="auth-modal__field">
            <label class="auth-modal__label">Senha</label>
            <input type="password" class="auth-modal__input" id="auth-login-senha" placeholder="Sua senha" required>
          </div>
          <p class="auth-modal__error" id="auth-login-error"></p>
          <button type="submit" class="auth-modal__btn">Entrar</button>
        </form>

        <form class="auth-modal__form auth-modal__form--hidden" id="auth-form-register">
          <div class="auth-modal__field">
            <label class="auth-modal__label">Nome completo</label>
            <input type="text" class="auth-modal__input" id="auth-reg-nome" placeholder="Seu nome" required>
          </div>
          <div class="auth-modal__field">
            <label class="auth-modal__label">E-mail</label>
            <input type="email" class="auth-modal__input" id="auth-reg-email" placeholder="seu@email.com" required>
          </div>
          <div class="auth-modal__field">
            <label class="auth-modal__label">Senha</label>
            <input type="password" class="auth-modal__input" id="auth-reg-senha" placeholder="Mínimo 6 caracteres" required minlength="6">
          </div>
          <div class="auth-modal__row">
            <div class="auth-modal__field">
              <label class="auth-modal__label">WhatsApp</label>
              <input type="tel" class="auth-modal__input" id="auth-reg-telefone" placeholder="(11) 99999-9999" required>
            </div>
            <div class="auth-modal__field">
              <label class="auth-modal__label">Cidade <span class="auth-modal__optional">opcional</span></label>
              <input type="text" class="auth-modal__input" id="auth-reg-cidade" placeholder="São Paulo">
            </div>
          </div>
          <label class="auth-modal__checkbox">
            <input type="checkbox" id="auth-reg-termos" required>
            <span>Li e aceito os <a href="#" class="auth-modal__link">termos de uso</a> e a <a href="#" class="auth-modal__link">política de privacidade</a></span>
          </label>
          <p class="auth-modal__error" id="auth-reg-error"></p>
          <button type="submit" class="auth-modal__btn">Criar conta</button>
        </form>
      </div>
    `;

    document.body.appendChild(div);
    modalEl = div;

    div.querySelectorAll('.auth-modal__tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    div.querySelector('.auth-modal__backdrop').addEventListener('click', closeModal);
    div.querySelector('.auth-modal__close').addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    div.querySelector('#auth-form-login').addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('auth-login-email').value;
      const senha = document.getElementById('auth-login-senha').value;
      const errorEl = document.getElementById('auth-login-error');

      const result = login(email, senha);

      if (result.success) {
  if (result.isAdmin) {
    closeModal();
    window.location.href = 'admin.html';
    return;
  }

  const redirect = localStorage.getItem('postLoginRedirect');

  closeModal();
  updateHeaderUI();
  document.dispatchEvent(new CustomEvent('elarah-auth-ready'));

  if (redirect) {
    localStorage.removeItem('postLoginRedirect');
    window.location.href = redirect;
  }
}
      else {
        errorEl.textContent = result.error;
      }
    });

    div.querySelector('#auth-form-register').addEventListener('submit', (e) => {
      e.preventDefault();

      const errorEl = document.getElementById('auth-reg-error');
      const nome = document.getElementById('auth-reg-nome').value;
      const email = document.getElementById('auth-reg-email').value;
      const senha = document.getElementById('auth-reg-senha').value;
      const telefone = document.getElementById('auth-reg-telefone').value;
      const cidade = document.getElementById('auth-reg-cidade').value;
      const termos = document.getElementById('auth-reg-termos').checked;

      if (!termos) {
        errorEl.textContent = 'Aceite os termos para continuar.';
        return;
      }

      const result = register({ nome, email, senha, telefone, cidade });

     if (result.success) {
  const redirect = localStorage.getItem('postLoginRedirect');

  closeModal();
  updateHeaderUI();
  document.dispatchEvent(new CustomEvent('elarah-auth-ready'));

  if (redirect) {
    localStorage.removeItem('postLoginRedirect');
    window.location.href = redirect;
  }
}
     else {
        errorEl.textContent = result.error;
      }
    });

    return div;
  }

  function switchTab(tab) {
    if (!modalEl) return;

    const tabs = modalEl.querySelectorAll('.auth-modal__tab');
    const loginForm = modalEl.querySelector('#auth-form-login');
    const regForm = modalEl.querySelector('#auth-form-register');

    tabs.forEach(t => t.classList.remove('auth-modal__tab--active'));
    modalEl.querySelector(`[data-tab="${tab}"]`).classList.add('auth-modal__tab--active');

    if (tab === 'login') {
      loginForm.classList.remove('auth-modal__form--hidden');
      regForm.classList.add('auth-modal__form--hidden');
    } else {
      loginForm.classList.add('auth-modal__form--hidden');
      regForm.classList.remove('auth-modal__form--hidden');
    }

    modalEl.querySelectorAll('.auth-modal__error').forEach(el => {
      el.textContent = '';
    });
  }

  function openModal(tab, message) {
    const modal = createModal();
    const msgEl = modal.querySelector('#auth-modal-message');

    if (message) {
      msgEl.textContent = message;
      msgEl.style.display = 'block';
    } else {
      msgEl.style.display = 'none';
    }

    switchTab(tab || 'login');
    modal.classList.add('auth-modal--open');
    document.body.style.overflow = 'hidden';

    modal.querySelectorAll('.auth-modal__input').forEach(input => {
      input.value = '';
    });

    modal.querySelectorAll('.auth-modal__error').forEach(el => {
      el.textContent = '';
    });

    const termosCheckbox = modal.querySelector('#auth-reg-termos');
    if (termosCheckbox) termosCheckbox.checked = false;
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('auth-modal--open');
    document.body.style.overflow = '';
  }

  function bindHeaderEvents() {
    if (headerEventsBound) return;

    document.addEventListener('click', (e) => {
      const loginBtn = e.target.closest('.header__login-btn');
      if (loginBtn) {
        e.preventDefault();
        e.stopPropagation();

        const user = getCurrentUser();
        if (user) {
          goTo('conta.html');
        } else {
          openModal('login');
        }
        return;
      }

      const favBtn = e.target.closest('.header__action-btn[aria-label="Favoritos"]');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn()) {
          openModal('login', 'Faça login para ver seus favoritos');
        } else {
          goTo('conta.html?section=favoritos');
        }
      }
    });

    headerEventsBound = true;
  }

  function updateHeaderUI() {
    const loginBtn = document.querySelector('.header__login-btn');
    if (!loginBtn) return;

    const user = getCurrentUser();

    if (user) {
      const initials = (user.nome || '')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const firstName = (user.nome || '').split(' ')[0] || 'Conta';

      loginBtn.innerHTML = `
        <span class="header__user-avatar">${initials || 'EC'}</span>
        ${firstName}
      `;
    } else {
      loginBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Entrar
      `;
    }
  }

  function init() {
    bindHeaderEvents();
    updateHeaderUI();
    document.dispatchEvent(new CustomEvent('elarah-auth-ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    logoutAdmin,
    login,
    register,
    logout,
    updateUser,
    becomePartner,
    getFavorites,
    isFavorite,
    toggleFavorite,
    requireLogin,
    openModal,
    closeModal,
    updateHeaderUI,
  };
})();
