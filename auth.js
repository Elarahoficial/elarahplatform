/* =============================================
   ELARAH AUTH MODULE
   Sistema de autenticação com localStorage
   Preparado para migração futura para API/backend
   ============================================= */

const ElarahAuth = (function () {
  const STORAGE_KEY = 'elarah_users';
  const SESSION_KEY = 'elarah_session';
   let firebaseCurrentUser = null;

  // ===== ADMIN CONFIG =====
  const ADMIN_CREDENTIALS = {
    email: 'contato.elarah@gmail.com',
    senha: 'Elarah2026DM@',
    role: 'admin'
  };

  function isAdminEmail(email) {
    return email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
  }

  // ===== STORAGE HELPERS =====

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function setSession(userId) {
    localStorage.setItem(SESSION_KEY, userId);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ===== PUBLIC API =====

 function normalizeUser(user) {
  if (!user) return null;

  if (!user.partnerStatus) {
    user.partnerStatus = user.isPartner ? 'approved' : 'none';
  }

  if (typeof user.partnerData === 'undefined') {
    user.partnerData = null;
  }

  if (!Array.isArray(user.favorites)) {
    user.favorites = [];
  }

  return user;
}

function getCurrentUser() {
  const user = firebaseCurrentUser;
  if (!user) return null;

  const key = `elarah_user_${user.email}`;
  const localData = JSON.parse(localStorage.getItem(key)) || {};

  return {
    id: user.uid,
    email: user.email,
    nome: localData.nome || user.displayName || user.email.split('@')[0],
    telefone: localData.telefone || '',
    cidade: localData.cidade || '',
    partnerStatus: localData.partnerStatus || 'none',
    partnerData: localData.partnerData || null,
    favorites: Array.isArray(localData.favorites) ? localData.favorites : []
  };
}
  function isLoggedIn() {
  const current = getCurrentUser();
  return !!current;
  }

 async function register({ nome, email, senha, telefone, cidade }) {
  try {
    const { auth, createUserWithEmailAndPassword } = window.ElarahFirebase;

    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      senha.trim()
    );

    firebaseCurrentUser = cred.user;

    const userData = {
      nome: nome.trim(),
      telefone: (telefone || '').trim(),
      cidade: (cidade || '').trim(),
      partnerStatus: 'none',
      partnerData: null,
      favorites: []
    };

    localStorage.setItem(
      `elarah_user_${cred.user.email}`,
      JSON.stringify(userData)
    );

    return {
      success: true,
      user: {
        id: cred.user.uid,
        nome: userData.nome,
        email: cred.user.email,
        telefone: userData.telefone,
        cidade: userData.cidade,
        partnerStatus: userData.partnerStatus,
        partnerData: userData.partnerData,
        favorites: userData.favorites
      }
    };

  } catch (error) {
    return { success: false, error: 'Erro ao criar conta.' };
  }
}

async function login(email, senha) {
  // Check admin login first
  if (isAdminEmail(email) && senha === ADMIN_CREDENTIALS.senha) {
    localStorage.setItem('elarah_admin', 'true');
    return { success: true, user: { nome: 'Admin', role: 'admin' }, isAdmin: true };
  }

  try {
    const { auth, signInWithEmailAndPassword } = window.ElarahFirebase;

    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      senha.trim()
    );

    firebaseCurrentUser = cred.user;

    return {
      success: true,
      user: getCurrentUser()
    };
  } catch (error) {
    return { success: false, error: 'E-mail ou senha incorretos.' };
  }
}

  function isAdmin() {
    return localStorage.getItem('elarah_admin') === 'true';
  }

  function logoutAdmin() {
    localStorage.removeItem('elarah_admin');
  }

  async function logout() {
  if (isAdmin()) {
    logoutAdmin();
  }

  if (window.ElarahFirebase && window.ElarahFirebase.auth) {
    const { auth, signOut } = window.ElarahFirebase;
    await signOut(auth);
  }

  firebaseCurrentUser = null;
  updateHeaderUI();
}
function updateUser(data) {
  const current = getCurrentUser();
  if (!current) return { success: false, error: 'Não autenticado.' };

  const key = `elarah_user_${current.email}`;
  const existing = JSON.parse(localStorage.getItem(key)) || {};

  const updated = {
    ...existing,
    ...data
  };

  localStorage.setItem(key, JSON.stringify(updated));

  return {
    success: true,
    user: {
      ...current,
      ...updated
    }
  };
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

  function requireLogin(callback) {
    if (isLoggedIn()) {
      if (callback) callback(getCurrentUser());
      return true;
    }
    openModal('login', 'Faça login para continuar');
    return false;
  }

  // ===== MODAL =====

  let modalEl = null;

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

        <!-- LOGIN FORM -->
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

        <!-- REGISTER FORM -->
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

    // Tab switching
    div.querySelectorAll('.auth-modal__tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Close
    div.querySelector('.auth-modal__backdrop').addEventListener('click', closeModal);
    div.querySelector('.auth-modal__close').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Login submit
    div.querySelector('#auth-form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-login-email').value;
      const senha = document.getElementById('auth-login-senha').value;
      const errorEl = document.getElementById('auth-login-error');

      const result = await login(email, senha);
      if (result.success) {
        if (result.isAdmin) {
          closeModal();
          window.location.href = 'admin.html';
          return;
        }
        closeModal();
        updateHeaderUI();
      } else {
        errorEl.textContent = result.error;
      }
    });

    // Register submit
     div.querySelector('#auth-form-register').addEventListener('submit', async (e) => {
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

      if (senha.length < 6) {
        errorEl.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        return;
      }

     const result = await register({ nome, email, senha, telefone, cidade });
      if (result.success) {
        closeModal();
        updateHeaderUI();
      } else {
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

    // Clear errors
    modalEl.querySelectorAll('.auth-modal__error').forEach(el => el.textContent = '');
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

    // Clear form fields
    modal.querySelectorAll('.auth-modal__input').forEach(input => input.value = '');
    modal.querySelectorAll('.auth-modal__error').forEach(el => el.textContent = '');
    const termosCheckbox = modal.querySelector('#auth-reg-termos');
    if (termosCheckbox) termosCheckbox.checked = false;
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('auth-modal--open');
    document.body.style.overflow = '';
  }

  // ===== HEADER UI UPDATE =====

  function updateHeaderUI() {
    const user = getCurrentUser();
    const loginBtn = document.querySelector('.header__login-btn');
    const favBtn = document.querySelector('.header__action-btn[aria-label="Favoritos"]');

    if (!loginBtn) return;

    if (user) {
      const initials = user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      loginBtn.innerHTML = `
        <span class="header__user-avatar">${initials}</span>
        ${user.nome.split(' ')[0]}
      `;
      loginBtn.onclick = () => { window.location.href = 'conta.html'; };
    } else {
      loginBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Entrar
      `;
      loginBtn.onclick = () => openModal('login');
    }

    // Favorite button: require login
    if (favBtn) {
      favBtn.onclick = () => {
        if (!isLoggedIn()) {
          openModal('login', 'Faça login para ver seus favoritos');
        } else {
          window.location.href = 'conta.html?section=favoritos';
        }
      };
    }
  }

  // ===== INIT =====

 function init() {
  if (window.ElarahFirebase && window.ElarahFirebase.auth && window.ElarahFirebase.onAuthStateChanged) {
    const { auth, onAuthStateChanged } = window.ElarahFirebase;

    onAuthStateChanged(auth, (user) => {
      firebaseCurrentUser = user || null;
      updateHeaderUI();
    });

  } else {
    updateHeaderUI();
  }
}

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== PUBLIC INTERFACE =====
   function getFavorites() {
  const current = getCurrentUser();
  if (!current) return [];

  const key = `elarah_user_${current.email}`;
  const data = JSON.parse(localStorage.getItem(key)) || {};

  return data.favorites || [];
}
function isFavorite(experienceId) {
  const favorites = getFavorites();
  return favorites.includes(experienceId);
}

function toggleFavorite(experienceId) {
  const current = getCurrentUser();
  if (!current) {
    return { success: false, error: 'Faça login para favoritar.' };
  }

  const key = `elarah_user_${current.email}`;
  const data = JSON.parse(localStorage.getItem(key)) || {};

  const favorites = data.favorites || [];
  const index = favorites.indexOf(experienceId);

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(experienceId);
  }

  localStorage.setItem(key, JSON.stringify({
    ...data,
    favorites
  }));

  return { success: true };
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

