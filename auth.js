/* =============================================
   ELARAH AUTH MODULE (Supabase)
   - Email/senha, Google, Apple, reset de senha
   - Perfil armazenado em public.profiles
   - isAdmin lido de profiles.role = 'admin'
   - API sync-friendly via cache em memória:
     getCurrentUser/isLoggedIn/isAdmin retornam
     do cache, que é hidratado no boot. Aguarde
     ElarahAuth.ready antes de chamadas críticas.
   ============================================= */

const ElarahAuth = (function () {
  'use strict';

  // ===== Internal state =====
  let supabase = null;
  let currentSession = null;
  let currentProfile = null;
  let hydrated = false;

  let readyResolve;
  const ready = new Promise((resolve) => { readyResolve = resolve; });

  function sb() {
    if (!supabase) {
      supabase = window.supabaseClient || null;
    }
    return supabase;
  }

  // ===== Favorites (localStorage, per user) =====
  function favKey() {
    return currentProfile ? 'elarah_fav_' + currentProfile.id : null;
  }
  function getFavorites() {
    const k = favKey();
    if (!k) return [];
    try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
  }
  function setFavorites(list) {
    const k = favKey();
    if (!k) return;
    localStorage.setItem(k, JSON.stringify(list));
  }
  function isFavorite(id) { return getFavorites().includes(id); }
  function toggleFavorite(id) {
    if (!currentProfile) {
      return { success: false, error: 'Faça login para favoritar.' };
    }
    const favs = getFavorites();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1); else favs.push(id);
    setFavorites(favs);
    return { success: true };
  }

  // ===== Sync getters (cache-backed) =====
  function getCurrentUser() {
    if (!currentProfile) return null;
    return {
      id: currentProfile.id,
      email: currentProfile.email || '',
      nome: currentProfile.nome || '',
      telefone: currentProfile.telefone || '',
      cidade: currentProfile.cidade || '',
      role: currentProfile.role || 'user',
      partnerStatus: currentProfile.partner_status || 'none',
      partnerData: currentProfile.partner_data || null,
      favorites: getFavorites()
    };
  }
  function isLoggedIn() { return !!currentSession && !!currentProfile; }
  function isAdmin() { return !!currentProfile && currentProfile.role === 'admin'; }

  // ===== Hydration =====
  async function fetchProfile(userId) {
    const s = sb();
    if (!s) return null;
    // Retry uma vez em caso de falha transitória de rede.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data, error } = await s
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) {
          console.warn('[Elarah] fetchProfile error (tentativa ' + (attempt + 1) + ')', error);
          if (attempt === 0) continue;
          return null;
        }
        return data;
      } catch (e) {
        console.warn('[Elarah] fetchProfile exception (tentativa ' + (attempt + 1) + ')', e);
        if (attempt === 0) continue;
        return null;
      }
    }
    return null;
  }

  async function hydrate() {
    const s = sb();
    if (!s) {
      hydrated = true;
      readyResolve();
      return;
    }
    try {
      const { data: { session } } = await s.auth.getSession();
      currentSession = session || null;
      if (currentSession) {
        currentProfile = await fetchProfile(currentSession.user.id);
      }
    } catch (e) {
      console.warn('[Elarah] hydrate error', e);
    }
    hydrated = true;
    readyResolve();

    try {
      document.dispatchEvent(new Event('elarah-auth-ready'));
    } catch {}

    updateHeaderUI();

    s.auth.onAuthStateChange(async (_event, session) => {
      try {
        currentSession = session || null;
        if (currentSession) {
          // Só re-fetch se ainda não tiver perfil para este user.
          // Evita sobrescrever um perfil válido com null em caso
          // de falha transitória de rede.
          if (!currentProfile || currentProfile.id !== currentSession.user.id) {
            const fetched = await fetchProfile(currentSession.user.id);
            if (fetched) currentProfile = fetched;
          }
        } else {
          currentProfile = null;
        }
      } catch (e) {
        console.warn('[Elarah] onAuthStateChange error', e);
      }
      try { updateHeaderUI(); } catch (e) { console.warn('[Elarah] updateHeaderUI error', e); }
    });
  }

  // ===== Auth actions =====
  async function register({ nome, email, senha, telefone, cidade }) {
    const s = sb();
    if (!s) return { success: false, error: 'Supabase indisponível.' };
    try {
      const { data, error } = await s.auth.signUp({
        email: (email || '').trim().toLowerCase(),
        password: (senha || '').trim(),
        options: {
          data: {
            nome: (nome || '').trim(),
            telefone: (telefone || '').trim(),
            cidade: (cidade || '').trim()
          }
        }
      });
      if (error) {
        return { success: false, error: translateError(error) };
      }
      // Se o provedor exige confirmação por email, session vem null.
      if (data.session) {
        currentSession = data.session;
        currentProfile = await fetchProfile(data.user.id);
      }
      return { success: true, user: getCurrentUser(), needsEmailConfirm: !data.session };
    } catch (e) {
      return { success: false, error: 'Erro ao criar conta.' };
    }
  }

  async function login(email, senha) {
    const s = sb();
    if (!s) return { success: false, error: 'Supabase indisponível.' };
    try {
      const { data, error } = await s.auth.signInWithPassword({
        email: (email || '').trim().toLowerCase(),
        password: (senha || '').trim()
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
          return { success: false, error: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.' };
        }
        if (msg.includes('invalid login credentials') || msg.includes('invalid')) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }
        return { success: false, error: error.message || 'E-mail ou senha incorretos.' };
      }
      currentSession = data.session;
      currentProfile = await fetchProfile(data.user.id);
      const isAdminUser = !!currentProfile && currentProfile.role === 'admin';
      return { success: true, user: getCurrentUser(), isAdmin: isAdminUser };
    } catch (e) {
      // Detecta erro de rede transitório (mais comum: ERR_QUIC_PROTOCOL_ERROR
      // quando rede bloqueia HTTP/3, ou Failed to fetch genérico).
      // Devolve mensagem específica com orientação clara em vez do
      // "Erro ao entrar" genérico que confunde o usuário.
      const msg = String((e && e.message) || e).toLowerCase();
      if (/failed to fetch|network|quic|connection|timeout/.test(msg)) {
        return {
          success: false,
          error:
            'Sem conexão com nosso servidor. ' +
            'Causa provável: rede bloqueando o site. ' +
            'Tente: (1) outra rede (4G no celular como hotspot), ' +
            '(2) outro navegador (Firefox), ' +
            '(3) desabilitar antivírus/extensões temporariamente. ' +
            'Se persistir, fale com o suporte (F12 → Console → print).',
          networkError: true
        };
      }
      return { success: false, error: 'Erro ao entrar.' };
    }
  }

  async function loginWithProvider(provider) {
    const s = sb();
    if (!s) return { success: false, error: 'Supabase indisponível.' };
    const base = (window.ElarahSupabase && window.ElarahSupabase.siteBase())
      || (window.location.origin + '/');
    const redirectTo = base + 'conta.html';
    const { error } = await s.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async function loginWithGoogle() { return loginWithProvider('google'); }
  async function loginWithApple()  { return loginWithProvider('apple'); }

  async function resetPassword(email) {
    const s = sb();
    if (!s) return { success: false, error: 'Supabase indisponível.' };
    const base = (window.ElarahSupabase && window.ElarahSupabase.siteBase())
      || (window.location.origin + '/');
    const redirectTo = base + 'reset-password.html';
    const { error } = await s.auth.resetPasswordForEmail(
      (email || '').trim().toLowerCase(),
      { redirectTo }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async function logout() {
    const s = sb();
    if (s) { try { await s.auth.signOut(); } catch {} }
    currentSession = null;
    currentProfile = null;
    updateHeaderUI();
  }

  // Compat com fluxo antigo do admin (manter assinatura).
  function logoutAdmin() { return logout(); }

  async function updateUser(data) {
    const s = sb();
    if (!s || !currentProfile) {
      return { success: false, error: 'Não autenticado.' };
    }
    const patch = {};
    if ('nome' in data)          patch.nome = data.nome || '';
    if ('telefone' in data)      patch.telefone = data.telefone || '';
    if ('cidade' in data)        patch.cidade = data.cidade || '';
    if ('partnerStatus' in data) patch.partner_status = data.partnerStatus;
    if ('partnerData' in data)   patch.partner_data = data.partnerData;

    const { data: updated, error } = await s
      .from('profiles')
      .update(patch)
      .eq('id', currentProfile.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    currentProfile = updated;
    return { success: true, user: getCurrentUser() };
  }

  async function becomePartner(partnerData) {
    return updateUser({
      partnerStatus: 'pending',
      partnerData: {
        ...partnerData,
        requestedAt: new Date().toISOString()
      }
    });
  }

  function translateError(error) {
    const msg = (error && error.message) || '';
    if (/already/i.test(msg) && /registered/i.test(msg)) {
      return 'Este e-mail já está cadastrado.';
    }
    if (/password/i.test(msg) && /short|weak/i.test(msg)) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    return msg || 'Erro ao criar conta.';
  }

  function requireLogin(callback) {
    if (isLoggedIn()) {
      if (callback) callback(getCurrentUser());
      return true;
    }
    openModal('login', 'Faça login para continuar');
    return false;
  }

  // ===== Modal UI (preserva layout anterior + Google/Apple + reset) =====
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
          <p class="auth-modal__success" id="auth-login-success" style="display:none;color:#2e7d32;font-size:0.85rem;margin:6px 0 0;"></p>
          <button type="submit" class="auth-modal__btn">Entrar</button>
          <p style="text-align:center;margin-top:10px;font-size:0.85rem;">
            <a href="#" class="auth-modal__link" id="auth-forgot-link">Esqueci minha senha</a>
          </p>
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
          <p class="auth-modal__success" id="auth-reg-success" style="display:none;color:#2e7d32;font-size:0.85rem;margin:6px 0 0;"></p>
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

    // Login form
    div.querySelector('#auth-form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-login-email').value;
      const senha = document.getElementById('auth-login-senha').value;
      const errorEl = document.getElementById('auth-login-error');
      errorEl.textContent = '';

      const result = await login(email, senha);

      if (result.success) {
        if (result.isAdmin) {
          closeModal();
          window.location.href = 'admin.html';
          return;
        }
        const redirect = localStorage.getItem('postLoginRedirect');
        closeModal();
        if (redirect) {
          localStorage.removeItem('postLoginRedirect');
          window.location.href = redirect;
          return;
        }
        updateHeaderUI();
      } else {
        errorEl.textContent = result.error;
      }
    });

    // Forgot password link
    div.querySelector('#auth-forgot-link').addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-login-email').value.trim();
      const errorEl = document.getElementById('auth-login-error');
      const successEl = document.getElementById('auth-login-success');
      errorEl.textContent = '';
      successEl.style.display = 'none';
      if (!email) {
        errorEl.textContent = 'Digite seu e-mail acima para receber o link de recuperação.';
        return;
      }
      const result = await resetPassword(email);
      if (result.success) {
        successEl.textContent = 'Enviamos um link de recuperação para ' + email + '.';
        successEl.style.display = 'block';
      } else {
        errorEl.textContent = result.error || 'Não foi possível enviar o link.';
      }
    });

    // Register form
    div.querySelector('#auth-form-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('auth-reg-error');
      const successEl = document.getElementById('auth-reg-success');
      errorEl.textContent = '';
      successEl.style.display = 'none';

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
        if (result.needsEmailConfirm) {
          successEl.textContent = 'Conta criada. Confirme seu e-mail para continuar.';
          successEl.style.display = 'block';
          return;
        }
        const redirect = localStorage.getItem('postLoginRedirect');
        closeModal();
        if (redirect) {
          localStorage.removeItem('postLoginRedirect');
          window.location.href = redirect;
          return;
        }
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

    modalEl.querySelectorAll('.auth-modal__error').forEach(el => el.textContent = '');
    modalEl.querySelectorAll('.auth-modal__success').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
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

    modal.querySelectorAll('.auth-modal__input').forEach(input => input.value = '');
    modal.querySelectorAll('.auth-modal__error').forEach(el => el.textContent = '');
    modal.querySelectorAll('.auth-modal__success').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
    const termosCheckbox = modal.querySelector('#auth-reg-termos');
    if (termosCheckbox) termosCheckbox.checked = false;
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('auth-modal--open');
    document.body.style.overflow = '';
  }

  // Handler unificado: sempre aguarda ready antes de decidir o
  // destino. Evita race condition onde o clique acontece antes
  // do hydrate completar.
  async function handleHeaderLoginClick(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try { await ready; } catch {}
    if (isAdmin()) {
      window.location.href = 'admin.html';
      return;
    }
    if (isLoggedIn()) {
      window.location.href = 'conta.html';
      return;
    }
    openModal('login');
  }

  async function handleHeaderFavClick(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try { await ready; } catch {}
    if (!isLoggedIn()) {
      openModal('login', 'Faça login para ver seus favoritos');
    } else {
      window.location.href = 'conta.html?section=favoritos';
    }
  }

  function updateHeaderUI() {
    const user = getCurrentUser();
    const loginBtn = document.querySelector('.header__login-btn');
    const favBtn = document.querySelector('.header__action-btn[aria-label="Favoritos"]');

    if (!loginBtn) return;

    if (user) {
      const fullName = (user.nome || '').trim();
      const initials = fullName
        ? fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'EC';

      const firstName = fullName ? fullName.split(' ')[0] : 'Conta';

      loginBtn.innerHTML = `
        <span class="header__user-avatar">${initials}</span>
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

    // Handler único e resiliente em ambos os estados.
    loginBtn.onclick = handleHeaderLoginClick;

    if (favBtn) {
      favBtn.onclick = handleHeaderFavClick;
    }
  }

  // ===== Bootstrap =====
  function init() {
    updateHeaderUI(); // primeiro render: provavelmente "Entrar"
    hydrate();         // assíncrono; re-renderiza ao terminar
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    ready,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    logoutAdmin,
    loginWithGoogle,
    loginWithApple,
    resetPassword,
    updateUser,
    becomePartner,
    getFavorites,
    isFavorite,
    toggleFavorite,
    requireLogin,
    openModal,
    closeModal,
    updateHeaderUI
  };
})();
