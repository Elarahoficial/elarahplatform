/* =============================================
   ELARAH ADMIN PANEL (Supabase)
   - Auth: só abre se profile.role === 'admin'
   - Experiências: CRUD via ElarahData (async)
   - Usuários/parceiros: lidos de public.profiles
   - Compras ainda em localStorage (legado)
   ============================================= */

(function () {
  'use strict';

  const PURCHASES_KEY = 'elarah_purchases';

  // ===== HELPERS =====
  function getFromStorage(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
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
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== BOOT (async) =====
  async function boot() {
    // Espera auth hidratar antes de decidir se é admin.
    if (window.ElarahAuth && ElarahAuth.ready) {
      try { await ElarahAuth.ready; } catch {}
    }

    if (!ElarahAuth.isAdmin()) {
      window.location.href = 'index.html';
      return;
    }

    wireNavigation();
    wireLogout();
    wireExperienceForm();
    await renderOverview();
  }

  // ===== NAVIGATION =====
  function wireNavigation() {
    const navItems = document.querySelectorAll('.admin__nav-item');
    const panels = document.querySelectorAll('.admin__panel');

    navItems.forEach(item => {
      item.addEventListener('click', async () => {
        const target = item.dataset.panel;

        navItems.forEach(n => n.classList.remove('admin__nav-item--active'));
        item.classList.add('admin__nav-item--active');

        panels.forEach(p => p.classList.remove('admin__panel--active'));
        document.getElementById('panel-' + target).classList.add('admin__panel--active');

        await refreshPanel(target);
      });
    });
  }

  async function refreshPanel(name) {
    switch (name) {
      case 'overview':    await renderOverview(); break;
      case 'users':       await renderUsers(); break;
      case 'partners':    await renderPartners(); break;
      case 'purchases':   renderPurchases(); break;
      case 'experiences': await renderExperiences(); break;
    }
  }

  // ===== LOGOUT =====
  function wireLogout() {
    const btn = document.getElementById('admin-logout');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      await ElarahAuth.logout();
      window.location.href = 'index.html';
    });
  }

  // ===== DATA GETTERS =====
  async function getProfiles() {
    const s = window.supabaseClient;
    if (!s) return [];
    const { data, error } = await s
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Admin] getProfiles error', error);
      return [];
    }
    return data || [];
  }

  async function getExperiences() {
    if (window.ElarahData && ElarahData.getAllExperiences) {
      return await ElarahData.getAllExperiences();
    }
    return [];
  }

  function getPurchases() { return getFromStorage(PURCHASES_KEY); }

  // ===== OVERVIEW =====
  async function renderOverview() {
    const [profiles, experiences] = await Promise.all([
      getProfiles(),
      getExperiences()
    ]);
    const purchases = getPurchases();
    const partners = profiles.filter(p => p.partner_status && p.partner_status !== 'none');

    document.getElementById('stat-users').textContent = profiles.length;
    document.getElementById('stat-partners').textContent = partners.filter(p => p.partner_status === 'approved').length;
    document.getElementById('stat-purchases').textContent = purchases.length;
    document.getElementById('stat-experiences').textContent = experiences.length;

    const recent = profiles.slice(0, 5);
    const tbody = document.getElementById('overview-users-body');
    const countEl = document.getElementById('overview-users-count');
    countEl.textContent = profiles.length + ' total';

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin__table-empty">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(u => `
      <tr>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.cidade || '—')}</td>
        <td>${formatDate(u.created_at)}</td>
      </tr>
    `).join('');
  }

  // ===== USERS =====
  async function renderUsers() {
    const users = await getProfiles();
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
        <td>${formatDate(u.created_at)}</td>
        <td>
          <span class="admin__badge admin__badge--${u.role === 'admin' ? 'approved' : 'pending'}">${u.role}</span>
        </td>
      </tr>
    `).join('');
  }

  // ===== PARTNERS =====
  async function renderPartners() {
    const profiles = await getProfiles();
    const partners = profiles.filter(p => p.partner_status && p.partner_status !== 'none');
    const tbody = document.getElementById('partners-body');
    const countEl = document.getElementById('partners-count');

    countEl.textContent = partners.length + ' parceiro' + (partners.length !== 1 ? 's' : '');

    if (partners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin__table-empty">Nenhum parceiro encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = partners.map(u => {
      const pd = u.partner_data || {};
      const statusClass = u.partner_status === 'approved' ? 'approved' :
                          u.partner_status === 'rejected' ? 'rejected' : 'pending';
      const statusLabel = u.partner_status === 'approved' ? 'Aprovado' :
                          u.partner_status === 'rejected' ? 'Rejeitado' : 'Pendente';
      const desc = pd.descricao || '—';
      const descShort = desc.length > 40 ? desc.slice(0, 40) + '...' : desc;

      let actions = '';
      if (u.partner_status === 'pending') {
        actions = `
          <button class="admin__action-btn admin__action-btn--approve" data-partner-approve="${escapeHtml(u.id)}">Aprovar</button>
          <button class="admin__action-btn admin__action-btn--reject" data-partner-reject="${escapeHtml(u.id)}">Rejeitar</button>
        `;
      } else if (u.partner_status === 'approved') {
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

  async function updatePartnerStatus(userId, status) {
    const s = window.supabaseClient;
    if (!s) return;
    const { error } = await s
      .from('profiles')
      .update({ partner_status: status })
      .eq('id', userId);
    if (error) {
      console.error('[Admin] updatePartnerStatus error', error);
      alert('Erro ao atualizar status: ' + error.message);
      return;
    }
    await renderPartners();
    await renderOverview();
  }

  // ===== PURCHASES (legado localStorage) =====
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
  let modal, modalBackdrop, modalClose, modalTitle, form, submitBtn, addBtn;
  let horariosList, horariosAddBtn;

  function parseCor(cor) {
    const parts = (cor || '').split(',').map(s => s.trim());
    return { cor1: parts[0] || '#f6d5a8', cor2: parts[1] || '#f0a05e' };
  }

  function addHorarioRow(value) {
    if (!horariosList) return;
    const row = document.createElement('div');
    row.className = 'admin__horario-row';
    row.innerHTML = `
      <input type="text" class="admin__horario-input" placeholder="Ex: 19h00 – 22h30">
      <button type="button" class="admin__horario-remove" aria-label="Remover horário">&times;</button>
    `;
    row.querySelector('input').value = value || '';
    row.querySelector('.admin__horario-remove').addEventListener('click', () => {
      const rows = horariosList.querySelectorAll('.admin__horario-row');
      if (rows.length > 1) row.remove();
      else row.querySelector('input').value = '';
    });
    horariosList.appendChild(row);
  }

  function renderHorarioRows(horarios) {
    if (!horariosList) return;
    horariosList.innerHTML = '';
    const initial = Array.isArray(horarios) && horarios.length ? horarios : [''];
    initial.forEach(h => addHorarioRow(h));
  }

  function collectHorarios() {
    if (!horariosList) return [];
    const inputs = horariosList.querySelectorAll('.admin__horario-input');
    return Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  }

  async function openExpModal(editId) {
    if (editId) {
      const exp = await ElarahData.getExperienceById(editId);
      if (!exp) return;

      modalTitle.textContent = 'Editar experiência';
      submitBtn.textContent = 'Atualizar experiência';

      document.getElementById('exp-nome').value = exp.nome || '';
      document.getElementById('exp-categoria').value = exp.categoria || '';
      document.getElementById('exp-data').value = exp.data || '';
      document.getElementById('exp-duracao').value = exp.duracao || '';
      document.getElementById('exp-bairro').value = exp.bairro || '';
      document.getElementById('exp-preco').value = exp.preco || '';
      document.getElementById('exp-endereco').value = exp.endereco || '';
      document.getElementById('exp-inclui').value = exp.inclui || '';
      document.getElementById('exp-imagem').value = exp.imagem || '';
      document.getElementById('exp-descricao').value = exp.descricao || '';

      const horarios = (Array.isArray(exp.horarios) && exp.horarios.length)
        ? exp.horarios
        : (exp.horario ? [exp.horario] : ['']);
      renderHorarioRows(horarios);

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
      renderHorarioRows(['']);
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

  function wireExperienceForm() {
    modal = document.getElementById('experience-modal');
    modalBackdrop = modal.querySelector('.admin__modal-backdrop');
    modalClose = document.getElementById('modal-close');
    modalTitle = document.getElementById('modal-title');
    form = document.getElementById('experience-form');
    submitBtn = document.getElementById('exp-submit-btn');
    addBtn = document.getElementById('btn-add-experience');
    horariosList = document.getElementById('exp-horarios-list');
    horariosAddBtn = document.getElementById('exp-horarios-add-btn');

    if (horariosAddBtn) {
      horariosAddBtn.addEventListener('click', () => addHorarioRow(''));
    }

    addBtn.addEventListener('click', () => openExpModal(null));
    modalBackdrop.addEventListener('click', closeExpModal);
    modalClose.addEventListener('click', closeExpModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeExpModal();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const cor1 = (document.getElementById('exp-cor1')?.value || '#f6d5a8').trim();
      const cor2 = (document.getElementById('exp-cor2')?.value || '#f0a05e').trim();

      const horarios = collectHorarios();
      if (horarios.length === 0) {
        alert('Adicione pelo menos um horário.');
        return;
      }

      const expData = {
        nome: document.getElementById('exp-nome').value.trim(),
        categoria: document.getElementById('exp-categoria').value,
        data: document.getElementById('exp-data').value.trim(),
        horario: horarios[0],
        horarios: horarios,
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

      submitBtn.disabled = true;
      try {
        if (editId) {
          await ElarahData.updateExperience(editId, expData);
        } else {
          await ElarahData.addExperience(expData);
        }
      } finally {
        submitBtn.disabled = false;
      }

      closeExpModal();
      await renderExperiences();
      await renderOverview();
    });
  }

  async function renderExperiences() {
    const experiences = await getExperiences();
    const tbody = document.getElementById('experiences-body');
    const countEl = document.getElementById('experiences-count');

    countEl.textContent = experiences.length + ' experiência' + (experiences.length !== 1 ? 's' : '');

    if (experiences.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin__table-empty">Nenhuma experiência cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = experiences.map(exp => {
      const horariosDisplay = Array.isArray(exp.horarios) && exp.horarios.length > 1
        ? exp.horarios.join(' · ')
        : (exp.horario || '');
      return `
      <tr>
        <td>${escapeHtml(exp.nome)}</td>
        <td>${escapeHtml(exp.categoria)}</td>
        <td>${escapeHtml(exp.data)}</td>
        <td>${escapeHtml(horariosDisplay)}</td>
        <td>${escapeHtml(exp.bairro)}</td>
        <td>${escapeHtml(exp.preco)}</td>
        <td>
          <button class="admin__action-btn admin__action-btn--edit" data-edit-exp="${escapeHtml(exp.id)}">Editar</button>
          <button class="admin__action-btn admin__action-btn--duplicate" data-duplicate-exp="${escapeHtml(exp.id)}">Duplicar</button>
          <button class="admin__action-btn admin__action-btn--delete" data-delete-exp="${escapeHtml(exp.id)}">Excluir</button>
        </td>
      </tr>
    `;
    }).join('');

    tbody.querySelectorAll('[data-edit-exp]').forEach(btn => {
      btn.addEventListener('click', () => openExpModal(btn.dataset.editExp));
    });
    tbody.querySelectorAll('[data-duplicate-exp]').forEach(btn => {
      btn.addEventListener('click', () => duplicateExperienceAndEdit(btn.dataset.duplicateExp));
    });
    tbody.querySelectorAll('[data-delete-exp]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja excluir esta experiência?')) {
          await ElarahData.deleteExperience(btn.dataset.deleteExp);
          await renderExperiences();
          await renderOverview();
        }
      });
    });
  }

  async function duplicateExperienceAndEdit(expId) {
    const copy = await ElarahData.duplicateExperience(expId);
    await renderExperiences();
    await renderOverview();
    if (copy) {
      await openExpModal(copy.id);
    }
  }

  // ===== START =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
