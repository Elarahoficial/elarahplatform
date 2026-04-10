/* =============================================
   ELARAH ADMIN PANEL
   Gerenciamento da plataforma via localStorage
   ============================================= */

(function () {
  'use strict';

  // ===== AUTH CHECK =====
  if (!ElarahAuth.isAdmin()) {
    window.location.href = 'index.html';
    return;
  }

  // ===== STORAGE KEYS =====
  const USERS_KEY = 'elarah_users';
  const PURCHASES_KEY = 'elarah_purchases';

  // ===== HELPERS =====

  function getFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function formatDate(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoString;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== PANEL NAVIGATION =====

  const navItems = document.querySelectorAll('.admin__nav-item');
  const panels = document.querySelectorAll('.admin__panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.panel;

      navItems.forEach(n => n.classList.remove('admin__nav-item--active'));
      item.classList.add('admin__nav-item--active');

      panels.forEach(p => p.classList.remove('admin__panel--active'));
      document.getElementById('panel-' + target).classList.add('admin__panel--active');

      refreshPanel(target);
    });
  });

  function refreshPanel(name) {
    switch (name) {
      case 'overview': renderOverview(); break;
      case 'users': renderUsers(); break;
      case 'partners': renderPartners(); break;
      case 'purchases': renderPurchases(); break;
      case 'experiences': renderExperiences(); break;
    }
  }

  // ===== LOGOUT =====

  document.getElementById('admin-logout').addEventListener('click', () => {
    ElarahAuth.logoutAdmin();
    window.location.href = 'index.html';
  });

  // ===== DATA GETTERS =====

  function getUsers() {
    return getFromStorage(USERS_KEY);
  }

  function getExperiences() {
    if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      return ElarahData.getAllExperiences();
    }
    return [];
  }

  function getPurchases() {
    return getFromStorage(PURCHASES_KEY);
  }

  function getPartners() {
    return getUsers().filter(u =>
      u.partnerStatus === 'pending' ||
      u.partnerStatus === 'approved' ||
      u.partnerStatus === 'rejected'
    );
  }

  // ===== OVERVIEW =====

  function renderOverview() {
    const users = getUsers();
    const partners = getPartners();
    const purchases = getPurchases();
    const experiences = getExperiences();

    document.getElementById('stat-users').textContent = users.length;
    document.getElementById('stat-partners').textContent = partners.filter(p => p.partnerStatus === 'approved').length;
    document.getElementById('stat-purchases').textContent = purchases.length;
    document.getElementById('stat-experiences').textContent = experiences.length;

    // Recent users (last 5)
    const recent = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const tbody = document.getElementById('overview-users-body');
    const countEl = document.getElementById('overview-users-count');

    countEl.textContent = users.length + ' total';

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin__table-empty">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(u => `
      <tr>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.cidade || '—')}</td>
        <td>${formatDate(u.createdAt)}</td>
      </tr>
    `).join('');
  }

  // ===== USERS =====

  function renderUsers() {
    const users = getUsers();
    const tbody = document.getElementById('users-body');
    const countEl = document.getElementById('users-count');

    countEl.textContent = users.length + ' usuário' + (users.length !== 1 ? 's' : '');

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin__table-empty">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.telefone || '—')}</td>
        <td>${escapeHtml(u.cidade || '—')}</td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
          <button class="admin__action-btn admin__action-btn--delete" data-delete-user="${escapeHtml(u.id)}">Excluir</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-delete-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteUser;
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
          deleteUser(id);
        }
      });
    });
  }

  function deleteUser(userId) {
    const users = getUsers().filter(u => u.id !== userId);
    saveToStorage(USERS_KEY, users);
    renderUsers();
    renderOverview();
  }

  // ===== PARTNERS =====

  function renderPartners() {
    const partners = getPartners();
    const tbody = document.getElementById('partners-body');
    const countEl = document.getElementById('partners-count');

    countEl.textContent = partners.length + ' parceiro' + (partners.length !== 1 ? 's' : '');

    if (partners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin__table-empty">Nenhum parceiro encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = partners.map(u => {
      const pd = u.partnerData || {};
      const statusClass = u.partnerStatus === 'approved' ? 'approved' :
                          u.partnerStatus === 'rejected' ? 'rejected' : 'pending';
      const statusLabel = u.partnerStatus === 'approved' ? 'Aprovado' :
                          u.partnerStatus === 'rejected' ? 'Rejeitado' : 'Pendente';

      const desc = pd.descricao || '—';
      const descShort = desc.length > 40 ? desc.slice(0, 40) + '...' : desc;

      let actions = '';
      if (u.partnerStatus === 'pending') {
        actions = `
          <button class="admin__action-btn admin__action-btn--approve" data-partner-approve="${escapeHtml(u.id)}">Aprovar</button>
          <button class="admin__action-btn admin__action-btn--reject" data-partner-reject="${escapeHtml(u.id)}">Rejeitar</button>
        `;
      } else if (u.partnerStatus === 'approved') {
        actions = `
          <button class="admin__action-btn admin__action-btn--edit" data-partner-pending="${escapeHtml(u.id)}">Pendente</button>
          <button class="admin__action-btn admin__action-btn--reject" data-partner-reject="${escapeHtml(u.id)}">Rejeitar</button>
        `;
      } else {
        actions = `
          <button class="admin__action-btn admin__action-btn--approve" data-partner-approve="${escapeHtml(u.id)}">Aprovar</button>
          <button class="admin__action-btn admin__action-btn--edit" data-partner-pending="${escapeHtml(u.id)}">Pendente</button>
        `;
      }

      return `
        <tr>
          <td>${escapeHtml(pd.marca || u.nome || '—')}</td>
          <td>${escapeHtml(pd.tipo || '—')}</td>
          <td>${escapeHtml(pd.bairro || '—')}</td>
          <td>${escapeHtml(pd.cidade || '—')}</td>
          <td>${escapeHtml(pd.social || '—')}</td>
          <td title="${escapeHtml(desc)}">${escapeHtml(descShort)}</td>
          <td><span class="admin__badge admin__badge--${statusClass}">${statusLabel}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');

    // Bind approve/pending/reject buttons
    tbody.querySelectorAll('[data-partner-approve]').forEach(btn => {
      btn.addEventListener('click', () => updatePartnerStatus(btn.dataset.partnerApprove, 'approved'));
    });
    tbody.querySelectorAll('[data-partner-pending]').forEach(btn => {
      btn.addEventListener('click', () => updatePartnerStatus(btn.dataset.partnerPending, 'pending'));
    });
    tbody.querySelectorAll('[data-partner-reject]').forEach(btn => {
      btn.addEventListener('click', () => updatePartnerStatus(btn.dataset.partnerReject, 'rejected'));
    });
  }

  function updatePartnerStatus(userId, status) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return;

    users[index].partnerStatus = status;
    saveToStorage(USERS_KEY, users);
    renderPartners();
    renderOverview();
  }

  // ===== PURCHASES =====

  function renderPurchases() {
    const purchases = getPurchases();
    const tbody = document.getElementById('purchases-body');
    const countEl = document.getElementById('purchases-count');

    countEl.textContent = purchases.length + ' compra' + (purchases.length !== 1 ? 's' : '');

    if (purchases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin__table-empty">Nenhuma compra registrada.</td></tr>';
      return;
    }

    tbody.innerHTML = purchases.map(p => {
      const statusClass = p.status === 'confirmada' ? 'approved' :
                          p.status === 'cancelada' ? 'rejected' : 'pending';
      const statusLabel = p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Pendente';

      return `
        <tr>
          <td>${escapeHtml(p.nome || p.userName || '—')}</td>
          <td>${escapeHtml(p.experiencia || p.experienceName || '—')}</td>
          <td>${escapeHtml(p.data || '—')}</td>
          <td>${escapeHtml(p.horario || '—')}</td>
          <td><span class="admin__badge admin__badge--${statusClass}">${statusLabel}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ===== EXPERIENCES CRUD =====

  const modal = document.getElementById('experience-modal');
  const modalBackdrop = modal.querySelector('.admin__modal-backdrop');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('experience-form');
  const submitBtn = document.getElementById('exp-submit-btn');
  const addBtn = document.getElementById('btn-add-experience');

  function parseCor(cor) {
    const parts = (cor || '').split(',').map(s => s.trim());
    return {
      cor1: parts[0] || '#f6d5a8',
      cor2: parts[1] || '#f0a05e'
    };
  }

  function openExpModal(editId) {
    if (editId) {
      const exp = getExperiences().find(e => e.id === editId);
      if (!exp) return;

      modalTitle.textContent = 'Editar experiência';
      submitBtn.textContent = 'Atualizar experiência';

      document.getElementById('exp-nome').value = exp.nome || '';
      document.getElementById('exp-categoria').value = exp.categoria || '';
      document.getElementById('exp-data').value = exp.data || '';
      document.getElementById('exp-horario').value = exp.horario || '';
      document.getElementById('exp-duracao').value = exp.duracao || '';
      document.getElementById('exp-bairro').value = exp.bairro || '';
      document.getElementById('exp-preco').value = exp.preco || '';
      document.getElementById('exp-endereco').value = exp.endereco || '';
      document.getElementById('exp-inclui').value = exp.inclui || '';
      document.getElementById('exp-imagem').value = exp.imagem || '';
      document.getElementById('exp-descricao').value = exp.descricao || '';

      const cores = parseCor(exp.cor);
      const cor1El = document.getElementById('exp-cor1');
      const cor2El = document.getElementById('exp-cor2');
      if (cor1El) cor1El.value = cores.cor1;
      if (cor2El) cor2El.value = cores.cor2;

      document.getElementById('exp-edit-id').value = editId;
    } else {
      modalTitle.textContent = 'Nova experiência';
      submitBtn.textContent = 'Salvar experiência';
      form.reset();

      const cor1El = document.getElementById('exp-cor1');
      const cor2El = document.getElementById('exp-cor2');
      if (cor1El) cor1El.value = '#f6d5a8';
      if (cor2El) cor2El.value = '#f0a05e';

      document.getElementById('exp-edit-id').value = '';
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeExpModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  addBtn.addEventListener('click', () => openExpModal(null));
  modalBackdrop.addEventListener('click', closeExpModal);
  modalClose.addEventListener('click', closeExpModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeExpModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cor1 = (document.getElementById('exp-cor1')?.value || '#f6d5a8').trim();
    const cor2 = (document.getElementById('exp-cor2')?.value || '#f0a05e').trim();

    const expData = {
      nome: document.getElementById('exp-nome').value.trim(),
      categoria: document.getElementById('exp-categoria').value,
      data: document.getElementById('exp-data').value.trim(),
      horario: document.getElementById('exp-horario').value.trim(),
      duracao: document.getElementById('exp-duracao').value.trim(),
      bairro: document.getElementById('exp-bairro').value.trim(),
      preco: document.getElementById('exp-preco').value.trim(),
      endereco: document.getElementById('exp-endereco').value.trim(),
      inclui: document.getElementById('exp-inclui').value.trim(),
      imagem: document.getElementById('exp-imagem').value.trim(),
      descricao: document.getElementById('exp-descricao').value.trim(),
      cor: cor1 + ',' + cor2
    };

    const editId = document.getElementById('exp-edit-id').value;

    if (editId) {
      ElarahData.updateExperience(editId, expData);
    } else {
      ElarahData.addExperience(expData);
    }

    closeExpModal();
    renderExperiences();
    renderOverview();
  });

  function renderExperiences() {
    const experiences = getExperiences();
    const tbody = document.getElementById('experiences-body');
    const countEl = document.getElementById('experiences-count');

    countEl.textContent = experiences.length + ' experiência' + (experiences.length !== 1 ? 's' : '');

    if (experiences.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin__table-empty">Nenhuma experiência cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = experiences.map(exp => `
      <tr>
        <td>${escapeHtml(exp.nome)}</td>
        <td>${escapeHtml(exp.categoria)}</td>
        <td>${escapeHtml(exp.data)}</td>
        <td>${escapeHtml(exp.horario)}</td>
        <td>${escapeHtml(exp.bairro)}</td>
        <td>${escapeHtml(exp.preco)}</td>
        <td>
          <button class="admin__action-btn admin__action-btn--edit" data-edit-exp="${escapeHtml(exp.id)}">Editar</button>
          <button class="admin__action-btn admin__action-btn--delete" data-delete-exp="${escapeHtml(exp.id)}">Excluir</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit-exp]').forEach(btn => {
      btn.addEventListener('click', () => openExpModal(btn.dataset.editExp));
    });
    tbody.querySelectorAll('[data-delete-exp]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja excluir esta experiência?')) {
          deleteExperience(btn.dataset.deleteExp);
        }
      });
    });
  }

  function deleteExperience(expId) {
    ElarahData.deleteExperience(expId);
    renderExperiences();
    renderOverview();
  }

  // ===== INITIAL RENDER =====
  renderOverview();

})();
