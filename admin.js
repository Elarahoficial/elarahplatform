/* =============================================
   ELARAH ADMIN PANEL (Supabase)
   - Auth: só abre se profile.role === 'admin'
   - Experiências: CRUD via ElarahData (async)
   - Usuários/parceiros: lidos de public.profiles
   - Compras ainda em localStorage (legado)
   ============================================= */

(function () {
  'use strict';

  // Version banner — abra o Console (F12) do admin pra confirmar
  // qual versão do admin.js tá realmente rodando no seu navegador.
  // Se você ainda vê a tabela plana do By Elarah, é sinal de que
  // o arquivo antigo foi cacheado e este log NÃO vai aparecer.
  console.info('[Elarah Admin] admin.js v20 — By Elarah Originals: is_elarah_original + cta_mode + hide_from_categorias');

  const PURCHASES_KEY = 'elarah_purchases';

  // ===== EXPERIÊNCIAS DE TESTE (escondidas do admin) =====
  // Bookings cuja experiencia_nome bate com qualquer destes nomes
  // (case-insensitive, trim) NÃO entram em listas, dropdowns, gráficos
  // ou métricas do admin. Os dados continuam no banco — é só um filtro
  // visual pra não poluir as compras reais.
  //
  // Pra adicionar/remover, edite só este array. O filtro normaliza
  // lowercase + trim, então pode escrever em qualquer caixa.
  const TEST_EXPERIENCE_NAMES = ['teste', 'teste 1'];

  function isTestExperience(nome) {
    if (!nome) return false;
    const n = String(nome).toLowerCase().trim();
    return TEST_EXPERIENCE_NAMES.indexOf(n) !== -1;
  }

  // Filtra um array de bookings removendo as de experiências de teste.
  // Usado no topo de cada função render pra que TODO o resto (dropdown,
  // stats, gráficos, tabela) opere só sobre bookings reais.
  function withoutTestBookings(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.filter(function (b) { return !isTestExperience(b && b.experiencia_nome); });
  }

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

    let allowed = ElarahAuth.isAdmin();

    // Defesa contra cache stale / fetchProfile falho:
    // confirma diretamente no Supabase antes de redirecionar,
    // evitando loop admin.html ↔ index.html quando a checagem
    // do role em memória estiver desatualizada.
    if (!allowed && window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          const { data: prof, error } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          if (!error && prof && prof.role === 'admin') {
            allowed = true;
          }
        }
      } catch (e) {
        console.warn('[Admin] verificação direta de role falhou:', e);
      }
    }

    if (!allowed) {
      window.location.href = 'index.html';
      return;
    }

    wireNavigation();
    wireLogout();
    wireExperienceForm();
    wireByElarahForm();
    wireAnalyticsControls();
    wireBookingsControls();
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
        const targetPanel = document.getElementById('panel-' + target);
        if (targetPanel) {
          targetPanel.classList.add('admin__panel--active');
        }

        // Volta o scroll pro topo — senão o usuário cai na posição
        // vertical da aba anterior (ex.: veio de "Compras" com 300+
        // linhas, clica By Elarah, e o topo da aba fica acima da
        // viewport). Reseta tanto o window quanto os containers mais
        // prováveis pra cobrir navegadores/configs diferentes.
        try {
          window.scrollTo(0, 0);
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
          const mainEl = document.querySelector('.admin__main');
          if (mainEl) mainEl.scrollTop = 0;
        } catch {}

        await refreshPanel(target);
      });
    });
  }

  async function refreshPanel(name) {
    switch (name) {
      case 'overview':    await renderOverview(); break;
      case 'users':       await renderUsers(); break;
      case 'partners':    await renderPartners(); break;
      case 'purchases':   await renderBookings(); break;
      case 'fornecedores': await renderFornecedores(); break;
      case 'purchases-pending': await renderPendingBookings(); break;
      case 'experiences': await renderExperiences(); break;
      case 'byelarah':    await renderByElarah(); break;
      case 'giftcards':   await renderGiftCards(); break;
      case 'analytics':   await renderAnalytics(); break;
    }
  }

  // ===== GIFT CARDS =====
  // Cache compartilhado com a seção de gift cards do painel de Compras
  // e com a stat do overview. Uma única query Supabase alimenta os
  // três locais, evitando hits repetidos.
  let giftCardsCache = null;
  async function getGiftCards() {
    if (giftCardsCache) return giftCardsCache;
    const sb = window.supabaseClient;
    if (!sb) return { rows: [], error: new Error('Supabase client indisponível') };

    const { data, error } = await sb
      .from('gift_cards')
      .select('id, code, valor_inicial_centavos, saldo_centavos, status, comprador_email, comprador_nome, destinatario_email, destinatario_nome, stripe_session_id, created_at, email_sent_at, expires_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[admin/gift_cards] load error', error);
      return { rows: [], error };
    }
    giftCardsCache = { rows: data || [], error: null };
    return giftCardsCache;
  }
  function invalidateGiftCardsCache() { giftCardsCache = null; }

  function giftCardErrorHint(error) {
    if (!error) return '';
    const msg = String(error.message || error.details || '').toLowerCase();
    if (msg.includes('gift_cards') && (msg.includes('does not exist') || msg.includes('relation'))) {
      return 'A tabela public.gift_cards não existe. Rode sql/elarah_extensions.sql no SQL Editor do Supabase.';
    }
    if (msg.includes('permission denied') || msg.includes('row-level')) {
      return 'RLS bloqueou a leitura. Confirme que seu usuário está marcado como admin em public.profiles (role = \'admin\') e que as policies de gift_cards foram criadas pelo elarah_extensions.sql.';
    }
    return error.message || 'Erro ao carregar gift cards.';
  }

  const giftCardBrl = (cents) => 'R$ ' + ((Number(cents) || 0) / 100).toFixed(2).replace('.', ',');
  const giftCardStatusBadge = (s) => {
    const colors = {
      active:    '#1a8a4a',
      used:      '#888',
      expired:   '#c0392b',
      pending:   '#b07b00',
      cancelled: '#c0392b'
    };
    const labels = {
      active:    'ativo',
      used:      'usado',
      expired:   'expirado',
      pending:   'pendente',
      cancelled: 'cancelado'
    };
    const c = colors[s] || '#666';
    const l = labels[s] || s || '—';
    return '<span style="color:' + c + ';font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.5px;">' + l + '</span>';
  };

  function giftCardRowsHtml(rows, colspan) {
    if (!rows.length) {
      return '<tr><td colspan="' + colspan + '" class="admin__table-empty">Nenhum gift card emitido ainda.</td></tr>';
    }
    return rows.map(g => {
      const dt = g.created_at ? new Date(g.created_at).toLocaleString('pt-BR') : '';
      const compradorLabel = (g.comprador_nome || '') + (g.comprador_email ? ' <' + g.comprador_email + '>' : '');
      const destLabel = (g.destinatario_nome || '') + (g.destinatario_email ? ' <' + g.destinatario_email + '>' : '');
      const codeDisplay = g.status === 'pending' ? '—' : (g.code || '');
      return '<tr>' +
        '<td style="font-family:Menlo,Consolas,monospace;font-size:12px;">' + escapeHtml(codeDisplay) + '</td>' +
        '<td>' + escapeHtml(compradorLabel.trim() || '—') + '</td>' +
        '<td>' + escapeHtml(destLabel.trim() || '—') + '</td>' +
        '<td>' + escapeHtml(giftCardBrl(g.valor_inicial_centavos)) + '</td>' +
        '<td>' + escapeHtml(giftCardBrl(g.saldo_centavos)) + '</td>' +
        '<td>' + giftCardStatusBadge(g.status) + '</td>' +
        '<td>' + escapeHtml(dt) + '</td>' +
        '</tr>';
    }).join('');
  }

  async function renderGiftCards() {
    const tbody = document.getElementById('giftcards-body');
    const countEl = document.getElementById('giftcards-count');
    if (!tbody) return;

    const { rows, error } = await getGiftCards();

    if (error) {
      const hint = giftCardErrorHint(error);
      tbody.innerHTML =
        '<tr><td colspan="7" class="admin__table-empty" style="color:#c0392b;">' +
        'Erro ao carregar gift cards: ' + escapeHtml(hint) +
        '</td></tr>';
      if (countEl) countEl.textContent = 'erro';
      return;
    }

    // Estatística por status (útil pro operador ver rapidamente
    // quantos gift cards estão pagos/pendentes etc).
    const byStatus = rows.reduce((acc, g) => {
      const s = g.status || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const paidCount   = byStatus.active || 0;
    const pendingCount= byStatus.pending || 0;
    const usedCount   = byStatus.used || 0;

    if (countEl) {
      const parts = [rows.length + ' total'];
      if (paidCount)    parts.push(paidCount + ' ativos');
      if (pendingCount) parts.push(pendingCount + ' pendentes');
      if (usedCount)    parts.push(usedCount + ' usados');
      countEl.textContent = parts.join(' · ');
    }

    tbody.innerHTML = giftCardRowsHtml(rows, 7);
  }

  // Tabela compacta injetada no painel de Compras pra o operador não
  // precisar navegar até o menu Gift Cards. Mesma fonte de dados.
  async function renderGiftCardsInPurchasesPanel() {
    const tbody = document.getElementById('purchases-giftcards-body');
    const countEl = document.getElementById('purchases-giftcards-count');
    if (!tbody) return;

    const { rows, error } = await getGiftCards();

    if (error) {
      const hint = giftCardErrorHint(error);
      tbody.innerHTML =
        '<tr><td colspan="7" class="admin__table-empty" style="color:#c0392b;">' +
        'Erro ao carregar gift cards: ' + escapeHtml(hint) +
        '</td></tr>';
      if (countEl) countEl.textContent = 'erro';
      return;
    }

    if (countEl) {
      countEl.textContent = rows.length + ' gift card' + (rows.length !== 1 ? 's' : '');
    }
    tbody.innerHTML = giftCardRowsHtml(rows, 7);
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
    const [profiles, experiences, giftCardsResult, bookingsRaw] = await Promise.all([
      getProfiles(),
      getExperiences(),
      getGiftCards(),
      getBookings().catch(() => [])
    ]);
    const partners = profiles.filter(p => p.partner_status && p.partner_status !== 'none');
    // Esconde bookings de experiências de teste do contador da home.
    const bookings = withoutTestBookings(bookingsRaw);

    // "Compras" no overview = reservas pagas via Stripe + gift cards
    // ativos. Antes lia de localStorage (legado) e sempre mostrava 0.
    const bookingsPaid = (bookings || []).filter(b => b.status === 'pago').length;
    const giftCardsActive = (giftCardsResult.rows || []).filter(
      g => g.status === 'active' || g.status === 'used'
    ).length;
    const totalCompras = bookingsPaid + giftCardsActive;

    document.getElementById('stat-users').textContent = profiles.length;
    document.getElementById('stat-partners').textContent = partners.filter(p => p.partner_status === 'approved').length;
    document.getElementById('stat-purchases').textContent = totalCompras;
    document.getElementById('stat-experiences').textContent = experiences.length;

    // Atualiza a stat-gift opcional se o painel de overview tiver
    // essa box. A box é criada no admin.html — se não existir, apenas
    // pula silenciosamente pra não quebrar layouts antigos.
    const statGiftEl = document.getElementById('stat-giftcards');
    if (statGiftEl) {
      const total = (giftCardsResult.rows || []).length;
      const active = giftCardsActive;
      statGiftEl.textContent = active + (total > active ? ' / ' + total : '');
      statGiftEl.title = total + ' total, ' + active + ' ativos/usados';
    }

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
    const totalEl = document.getElementById('stat-users-total');

    countEl.textContent = users.length + ' usuário' + (users.length !== 1 ? 's' : '');
    if (totalEl) totalEl.textContent = users.length;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin__table-empty">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${buildUserPhoneCell(u)}</td>
        <td>${escapeHtml(u.cidade || '—')}</td>
        <td>${formatDate(u.created_at)}</td>
        <td>
          <span class="admin__badge admin__badge--${u.role === 'admin' ? 'approved' : 'pending'}">${u.role}</span>
        </td>
      </tr>
    `).join('');
  }

  // Monta a célula de telefone da lista de usuários: número visível + botão
  // verde ao lado que abre o WhatsApp com mensagem pronta convidando pro
  // grupo da Elarah. Usa o primeiro nome do usuário pra personalizar a
  // saudação. Sem telefone, mostra só o traço — sem botão.
  function buildUserPhoneCell(u) {
    const tel = (u.telefone || '').trim();
    if (!tel) return '<span style="color:#bbb;">—</span>';
    const digits = tel.replace(/\D+/g, '').replace(/^55/, '');
    if (!digits) return escapeHtml(tel);
    const primeiroNome = String(u.nome || '').trim().split(/\s+/)[0] || 'tudo bem';
    const msg = 'Oii ' + primeiroNome + '! Você se cadastrou na Elarah e temos um grupo onde liberamos experiências antes de todo mundo (algumas esgotam só por lá). Entra aqui pra não perder: https://chat.whatsapp.com/LRqJa9F7zGWAIMlh2D2yjl';
    const href = 'https://wa.me/55' + digits + '?text=' + encodeURIComponent(msg);
    const numero = '<a href="' + href + '" target="_blank" rel="noopener" style="color:#1a8a4a;text-decoration:none;border-bottom:1px dotted #1a8a4a;">' + escapeHtml(tel) + '</a>';
    const botao = '<a href="' + href + '" target="_blank" rel="noopener" title="Convidar para o grupo no WhatsApp" style="display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:4px 10px;background:#25D366;color:#fff;border-radius:14px;font-size:12px;font-weight:600;text-decoration:none;line-height:1;vertical-align:middle;">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.78 11.78 0 0 0 12.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.65a11.9 11.9 0 0 0 5.77 1.47h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.17-3.45-8.42zM12.05 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.98 1-3.62-.23-.37a9.85 9.85 0 0 1-1.51-5.27c0-5.45 4.43-9.88 9.87-9.88 2.64 0 5.12 1.03 6.99 2.9a9.81 9.81 0 0 1 2.89 6.99c-.01 5.45-4.44 9.86-9.89 9.86zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/></svg>' +
      'WhatsApp</a>';
    return numero + botao;
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

  // ===== BOOKINGS (Supabase) =====
  let bookingsCache = null;

  async function getBookings() {
    if (bookingsCache) return bookingsCache.slice();
    const s = window.supabaseClient;
    if (!s) return [];
    const { data, error } = await s
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Admin] getBookings error', error);
      return [];
    }
    bookingsCache = data || [];
    return bookingsCache.slice();
  }

  function invalidateBookings() { bookingsCache = null; }

  function formatCents(amountCents, currency) {
    if (amountCents == null) return '—';
    const value = (amountCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: (currency || 'BRL').toUpperCase()
    });
    return value;
  }

  function bookingStatusBadge(status) {
    const cls = status === 'pago' ? 'approved'
              : status === 'pending' ? 'pending'
              : status === 'reembolsado' ? 'pending'
              : 'rejected';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
    return `<span class="admin__badge admin__badge--${cls}">${escapeHtml(label)}</span>`;
  }

  function wireBookingsControls() {
    const refreshBtn = document.getElementById('btn-refresh-bookings');
    const filterExp = document.getElementById('bookings-filter-exp');
    const filterStatus = document.getElementById('bookings-filter-status');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
      invalidateBookings();
      invalidateGiftCardsCache();
      renderBookings();
    });
    if (filterExp) filterExp.addEventListener('change', () => renderBookings());
    if (filterStatus) filterStatus.addEventListener('change', () => renderBookings());
    var filterFornInit = document.getElementById('bookings-filter-fornecedor');
    var filterSfInit = document.getElementById('bookings-filter-status-fornecedor');
    if (filterFornInit) filterFornInit.addEventListener('change', () => renderBookings());
    if (filterSfInit) filterSfInit.addEventListener('change', () => renderBookings());
  }

  async function renderBookings() {
    if (!document.getElementById('purchases-body')) return;
    // Renderiza gift cards na mesma tela (seção auxiliar) — assim o
    // operador vê TODAS as compras (reservas + gift cards) sem trocar
    // de menu. Não bloqueia o render principal.
    renderGiftCardsInPurchasesPanel().catch(e =>
      console.error('[admin] render gift cards in purchases failed', e)
    );
    // Carrega bookings + profiles em paralelo. Os profiles viram um
    // mapa telefone por user_id / email pra funcionar como fallback
    // quando a coluna bookings.telefone está vazia (bookings antigas
    // OU edge function create-checkout-session sem a versão nova
    // deployada ainda). O frontend do checkout grava telefone no
    // profile como side-effect, então aqui a gente resgata o dado.
    // Experiências entram pra servir de fallback dos campos
    // fornecedor/valor_cheio/repasse/comissão quando o booking
    // foi criado antes do deploy que começou a gravar esses campos.
    const [bookingsRaw, profiles, allExperiences] = await Promise.all([
      getBookings(),
      getProfiles().catch(() => []),
      (window.ElarahData && ElarahData.getAllExperiences)
        ? ElarahData.getAllExperiences().catch(() => [])
        : Promise.resolve([]),
    ]);
    // Filtra experiências de teste UMA VEZ aqui — cascata pra dropdown,
    // stats globais, gráficos (reservas por exp / conversão) e tabela.
    const bookings = withoutTestBookings(bookingsRaw);
    const expById = new Map();
    (allExperiences || []).forEach(e => {
      if (e && e.id) expById.set(e.id, e);
    });
    const telefonePorUserId = new Map();
    const telefonePorEmail = new Map();
    // Fallback de nome: bookings antigas (ou geradas por front antigo)
    // podem não ter o `nome` salvo. Se o user_id / email bater com um
    // profile cadastrado, exibimos o profile.nome no lugar de '—'.
    const nomePorUserId = new Map();
    const nomePorEmail = new Map();
    (profiles || []).forEach(p => {
      if (!p) return;
      const tel = (p.telefone || '').trim();
      if (tel) {
        if (p.id) telefonePorUserId.set(p.id, tel);
        if (p.email) telefonePorEmail.set(String(p.email).toLowerCase(), tel);
      }
      const nm = (p.nome || '').trim();
      if (nm) {
        if (p.id) nomePorUserId.set(p.id, nm);
        if (p.email) nomePorEmail.set(String(p.email).toLowerCase(), nm);
      }
    });

    // Popula filtro de experiências (apenas uma vez por load).
    const filterExpEl = document.getElementById('bookings-filter-exp');
    if (filterExpEl && filterExpEl.options.length <= 1) {
      const seen = new Set();
      bookings.forEach(b => {
        if (b.experiencia_nome && !seen.has(b.experiencia_nome)) {
          seen.add(b.experiencia_nome);
          const opt = document.createElement('option');
          opt.value = b.experiencia_nome;
          opt.textContent = b.experiencia_nome;
          filterExpEl.appendChild(opt);
        }
      });
    }

    // Popula filtro de fornecedores
    const filterFornEl = document.getElementById('bookings-filter-fornecedor');
    if (filterFornEl && filterFornEl.options.length <= 1) {
      const seenForn = new Set();
      bookings.forEach(b => {
        var fn = b.fornecedor_nome || '';
        if (fn && !seenForn.has(fn)) {
          seenForn.add(fn);
          var opt = document.createElement('option');
          opt.value = fn;
          opt.textContent = fn;
          filterFornEl.appendChild(opt);
        }
      });
    }

    const filterExp = filterExpEl ? filterExpEl.value : '';
    const filterStatusEl = document.getElementById('bookings-filter-status');
    const filterStatus = filterStatusEl ? filterStatusEl.value : '';
    const filterForn = filterFornEl ? filterFornEl.value : '';
    const filterSfEl = document.getElementById('bookings-filter-status-fornecedor');
    const filterSf = filterSfEl ? filterSfEl.value : '';

    // Este painel só mostra bookings PAGAS
    const filtered = bookings.filter(b => {
      if (b.status !== 'pago') return false;
      if (filterExp && b.experiencia_nome !== filterExp) return false;
      if (filterForn && (b.fornecedor_nome || '') !== filterForn) return false;
      if (filterSf && (b.status_fornecedor || '') !== filterSf) return false;
      return true;
    });

    // Stats sobre TODAS as bookings (não filtradas).
    const paid = bookings.filter(b => b.status === 'pago');
    const pending = bookings.filter(b => b.status === 'pending');
    const revenueCents = paid.reduce((sum, b) => sum + (b.amount_total || 0), 0);

    document.getElementById('stat-bookings-paid').textContent = paid.length;
    document.getElementById('stat-bookings-pending').textContent = pending.length;
    document.getElementById('stat-bookings-revenue').textContent = formatCents(revenueCents, 'BRL');

    // Conversão = pagas / cliques de Reservar (vem dos analytics_events).
    let conversionLabel = '—';
    try {
      if (window.ElarahAnalytics && ElarahAnalytics.rawSelect) {
        const allClicks = await ElarahAnalytics.rawSelect({ eventName: 'reserve_click', limit: 10000 });
        // Remove cliques de experiências de teste pra que a conversão
        // global e o gráfico por experiência não exibam linhas de teste.
        const clicks = (allClicks || []).filter(function (c) {
          return !isTestExperience(c && (c.target_label || c.target_id));
        });
        if (clicks && clicks.length) {
          const rate = (paid.length / clicks.length) * 100;
          conversionLabel = rate.toFixed(1) + '% (' + paid.length + '/' + clicks.length + ')';

          // Conversão por experiência
          const clicksByExp = new Map();
          clicks.forEach(c => {
            const k = c.target_label || c.target_id || '—';
            clicksByExp.set(k, (clicksByExp.get(k) || 0) + 1);
          });
          const paidByExp = new Map();
          paid.forEach(b => {
            const k = b.experiencia_nome || '—';
            paidByExp.set(k, (paidByExp.get(k) || 0) + 1);
          });
          const rows = Array.from(clicksByExp.entries()).map(([k, totalClicks]) => {
            const totalPaid = paidByExp.get(k) || 0;
            const r = totalClicks > 0 ? Math.round((totalPaid / totalClicks) * 100) : 0;
            return { key: k, label: k + ' — ' + totalPaid + '/' + totalClicks + ' (' + r + '%)', count: r };
          }).sort((a, b) => b.count - a.count);
          renderBars('bookings-conversion-list', rows);
        }
      }
    } catch (e) {
      console.warn('[Admin] conversion calc failed', e);
    }
    document.getElementById('stat-bookings-conversion').textContent = conversionLabel;

    // Reservas por experiência (pagas + pendentes contam aqui).
    const byExp = new Map();
    bookings.forEach(b => {
      const k = b.experiencia_nome || '—';
      byExp.set(k, (byExp.get(k) || 0) + 1);
    });
    const byExpRows = Array.from(byExp.entries())
      .map(([k, c]) => ({ key: k, label: k, count: c }))
      .sort((a, b) => b.count - a.count);
    renderBars('bookings-by-exp', byExpRows);

    // Tabela
    const tbody = document.getElementById('purchases-body');
    const countEl = document.getElementById('purchases-count');
    countEl.textContent = filtered.length + ' reserva' + (filtered.length !== 1 ? 's' : '');

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin__table-empty">Nenhuma reserva para esses filtros.</td></tr>';
      return;
    }

    // Badge de alerta quando o webhook detectou que o gateway cobrou
    // um valor diferente do esperado (metadata.amount_mismatch). Sem
    // isso, divergências passam despercebidas — o admin precisa de
    // sinalização visual pra estornar manualmente quando preciso.
    function mismatchBadge(b) {
      if (!b || !b.metadata || typeof b.metadata !== 'object') return '';
      if (b.metadata.amount_mismatch !== true) return '';
      const expected = Number(b.metadata.expected_amount_total_centavos);
      const delta = Number(b.metadata.delta_centavos);
      const tooltipParts = [];
      if (Number.isFinite(expected)) {
        tooltipParts.push('Esperado: ' + formatCents(expected, b.currency || 'BRL'));
      }
      if (Number.isFinite(delta)) {
        tooltipParts.push('Delta: ' + (delta > 0 ? '+' : '') + formatCents(delta, b.currency || 'BRL'));
      }
      const tooltip = tooltipParts.length
        ? tooltipParts.join(' · ')
        : 'Valor cobrado divergente do esperado';
      return ' <span title="' + escapeHtml(tooltip) +
        '" style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:8px;' +
        'background:#fce8e6;color:#c0392b;font-size:.7rem;font-weight:700;cursor:help;">⚠ valor</span>';
    }

    // Renderiza uma linha da tabela. Extraído pra reaproveitar em
    // cada grupo (pendentes / pagos / outros) sem duplicar o código
    // de resolução de telefone + nome.
    function renderBookingRow(b) {
      const when = b.created_at
        ? new Date(b.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : '—';
      // Telefone: ordem de resolução (tolerante a migrações/deploy parciais)
      //   1. coluna bookings.telefone (caminho ideal — edge function nova)
      //   2. metadata.telefone / metadata.telefone_digits (retry sem coluna)
      //   3. profiles.telefone via user_id (fallback quando a edge function
      //      antiga tá rodando mas o frontend já grava no profile como
      //      side-effect do checkout)
      //   4. profiles.telefone via email (catch-all)
      let telefone = b.telefone || null;
      if (!telefone && b.metadata && typeof b.metadata === 'object') {
        telefone = b.metadata.telefone || b.metadata.telefone_digits || null;
      }
      if (!telefone && b.user_id && telefonePorUserId.has(b.user_id)) {
        telefone = telefonePorUserId.get(b.user_id);
      }
      if (!telefone && b.email) {
        const key = String(b.email).toLowerCase();
        if (telefonePorEmail.has(key)) telefone = telefonePorEmail.get(key);
      }
      // Nome: coluna bookings.nome é a fonte canônica (setada pelo
      // create-checkout-session). Se estiver vazia (booking antiga
      // OU edge function antiga sem o fallback), tenta recuperar
      // pelo profile (user_id primeiro, email como catch-all).
      let nomeResolved = (b.nome || '').trim() || null;
      if (!nomeResolved && b.user_id && nomePorUserId.has(b.user_id)) {
        nomeResolved = nomePorUserId.get(b.user_id);
      }
      if (!nomeResolved && b.email) {
        const nk = String(b.email).toLowerCase();
        if (nomePorEmail.has(nk)) nomeResolved = nomePorEmail.get(nk);
      }

      let telefoneCell;
      if (telefone) {
        const digits = String(telefone).replace(/\D+/g, '');
        const waDigits = digits.length >= 10 ? ('55' + digits.replace(/^55/, '')) : digits;
        const href = waDigits ? 'https://wa.me/' + waDigits : '';
        telefoneCell = href
          ? '<a href="' + href + '" target="_blank" rel="noopener" style="color:#1a8a4a;text-decoration:none;border-bottom:1px dotted #1a8a4a;">' + escapeHtml(telefone) + '</a>'
          : escapeHtml(telefone);
      } else {
        telefoneCell = '<span style="color:#bbb;">—</span>';
      }
      // Fallback de fornecedor + valores: se o booking não tem esses
      // campos (caso típico: experiência sem valor_cheio_centavos
      // cadastrado OU booking criado antes do deploy que começou a
      // gravar), puxa da experiência correspondente e calcula o
      // repasse/comissão com a mesma fórmula da edge function
      // (repasse = 70% do cheio, comissão = 20%). Se a experiência
      // também estiver vazia, volta pra '—' — aí o admin sabe que
      // precisa preencher o campo "Valor cheio" no formulário.
      const exp = expById.get(b.experiencia_id) || null;
      const qty = Math.max(1, Number(b.quantidade) || 1);
      const fornecedorDisplay = (b.fornecedor_nome && b.fornecedor_nome.trim())
        || (exp && exp.fornecedorNome && String(exp.fornecedorNome).trim())
        || '';
      let valorCheio = b.valor_cheio_centavos != null ? Number(b.valor_cheio_centavos) : null;
      if (!valorCheio && exp && exp.valorCheioCentavos) {
        valorCheio = Number(exp.valorCheioCentavos) * qty;
      }
      let valorRepasse = b.valor_repasse_centavos != null ? Number(b.valor_repasse_centavos) : null;
      if (!valorRepasse && valorCheio) {
        valorRepasse = Math.round(valorCheio * 0.70);
      }
      let valorComissao = b.valor_comissao_centavos != null ? Number(b.valor_comissao_centavos) : null;
      if (!valorComissao && valorCheio) {
        valorComissao = Math.round(valorCheio * 0.20);
      }

      // Renderiza acompanhantes (participantes adicionais) abaixo do
      // nome do comprador, com WhatsApp clicável quando o telefone
      // estiver disponível.
      //
      // Dedup defensivo: o checkout grava o próprio comprador como
      // participantes[0]. Em vez de fazer slice(1) cego (que assumiria
      // sempre essa ordem e poderia esconder dados de bookings antigas
      // com formato diferente), filtramos por nome E telefone iguais
      // aos do comprador. Cobre:
      //   - bookings novas (comprador no índice 0) → filtra ele fora
      //   - bookings antigas (sem comprador no array) → mostra tudo
      //   - duplicatas acidentais → mostra cada pessoa uma vez
      function renderAcompanhantes() {
        if (!b.metadata || !Array.isArray(b.metadata.participantes)) return '';
        if (!b.metadata.participantes.length) return '';

        // Normalização agressiva: lowercase + remove zero-width / NBSP /
        // outros chars invisíveis que podem entrar via copy-paste do
        // checkout, e colapsa whitespace. Sem isso, "duda vitiello" e
        // "duda​ vitiello" não bateriam e o dedup falharia silente.
        const norm = function (s) {
          return String(s || '')
            .normalize('NFKC')
            .replace(/[​-‍﻿ ]/g, ' ')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
        };
        const onlyDigits = function (s) { return String(s || '').replace(/\D+/g, ''); };
        const compradorNome = norm(nomeResolved);
        const compradorTel = onlyDigits(telefone);

        const seen = new Set();
        const extras = b.metadata.participantes.filter(function (p) {
          if (!p) return false;
          const pNome = norm(p.nome);
          const pTel = onlyDigits(p.telefone || p.telefone_digits || '');
          if (!pNome && !pTel) return false;

          // Identifica o próprio comprador no array com critério mais
          // estrito: só pula quando há evidência forte de ser ele,
          // pra não esconder um acompanhante real que esteja usando
          // o mesmo telefone (caso comum: pais/casais com 1 número
          // só, testes onde se reusa o próprio número).
          //
          // Pula só se:
          //   - nome E telefone batem; ou
          //   - nome bate e a entry não tem telefone (booking antiga); ou
          //   - telefone bate e a entry não tem nome (improvável).
          const nomeIgual = compradorNome && pNome && pNome === compradorNome;
          const telIgual = compradorTel && pTel && pTel === compradorTel;
          if (nomeIgual && telIgual) return false;
          if (nomeIgual && !pTel) return false;
          if (telIgual && !pNome) return false;

          // Dedup entre acompanhantes (mesma pessoa gravada 2x).
          const key = pNome + '|' + pTel;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (!extras.length) return '';

        const items = extras.map(function (p) {
          const pNome = escapeHtml((p && p.nome) || '?');
          const pTelRaw = String((p && (p.telefone || p.telefone_digits)) || '').trim();
          if (!pTelRaw) {
            return '<span style="font-size:.75rem;color:#888;display:block;margin-top:2px;">+ ' + pNome + '</span>';
          }
          const pDigits = onlyDigits(pTelRaw);
          const pWa = pDigits.length >= 10 ? ('55' + pDigits.replace(/^55/, '')) : pDigits;
          const pTelDisplay = escapeHtml(p.telefone || pDigits);
          const link = pWa
            ? '<a href="https://wa.me/' + pWa + '" target="_blank" rel="noopener" style="color:#1a8a4a;text-decoration:none;border-bottom:1px dotted #1a8a4a;">' + pTelDisplay + '</a>'
            : pTelDisplay;
          return '<span style="font-size:.75rem;color:#888;display:block;margin-top:2px;">+ ' + pNome + ' · ' + link + '</span>';
        }).join('');
        return '<br>' + items;
      }

      return `
        <tr>
          <td>${escapeHtml(when)}</td>
          <td>${escapeHtml(nomeResolved || '—')}${renderAcompanhantes()}</td>
          <td>${escapeHtml(b.email || '—')}</td>
          <td>${telefoneCell}</td>
          <td>${escapeHtml(b.experiencia_nome || '—')}</td>
          <td>${escapeHtml(b.data || '—')}</td>
          <td>${escapeHtml(b.horario || '—')}</td>
          <td>${b.quantidade && b.quantidade > 1 ? '<span style="font-weight:600;color:var(--orange,#f0a05e);">' + b.quantidade + '</span>' : '1'}</td>
          <td>${escapeHtml(formatCents(b.amount_total, b.currency))}${mismatchBadge(b)}</td>
          <td style="font-size:.82rem;">${b.status === 'pago' ? escapeHtml(fornecedorDisplay || '—') : ''}</td>
          <td>${b.status === 'pago' && valorCheio ? escapeHtml(formatCents(valorCheio, b.currency)) : (b.status === 'pago' ? '—' : '')}</td>
          <td>${b.status === 'pago' && valorRepasse ? escapeHtml(formatCents(valorRepasse, b.currency)) : (b.status === 'pago' ? '—' : '')}</td>
          <td>${b.status === 'pago' && valorComissao ? escapeHtml(formatCents(valorComissao, b.currency)) : (b.status === 'pago' ? '—' : '')}</td>
          <td>${bookingStatusBadge(b.status)}</td>
          <td>${b.status === 'pago' ? '<select class="admin__sf-select" data-booking-id="' + escapeHtml(b.id) + '" style="padding:4px 8px;border:1px solid #ddd;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;' + ((b.status_fornecedor === 'repasse_feito') ? 'background:#e6f4ea;color:#1a8a4a;' : 'background:#fff8ef;color:#b07b00;') + '"><option value="repasse_pendente"' + ((b.status_fornecedor || 'repasse_pendente') === 'repasse_pendente' ? ' selected' : '') + '>Repasse pendente</option><option value="repasse_feito"' + (b.status_fornecedor === 'repasse_feito' ? ' selected' : '') + '>Repasse feito</option></select>' : ''}</td>
        </tr>
      `;
    }

    // Cabeçalho de grupo — divisor visual entre seções (pendentes,
    // pagos, outros). Usa colspan=9 pra ocupar todas as colunas e um
    // estilo inline suave pra não depender de mudanças no CSS.
    function renderGroupHeader(label, count) {
      return `
        <tr class="admin__table-group-header">
          <td colspan="15" style="background:#faf6f0;color:#1a1a1a;font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.05em;padding:12px 14px;border-top:2px solid #f0a05e;">
            ${escapeHtml(label)} <span style="color:#999;font-weight:500;margin-left:6px;">(${count})</span>
          </td>
        </tr>
      `;
    }

    // Ordenação dentro de um grupo: sempre created_at desc (mais
    // recentes no topo). Bookings sem created_at vão pro fundo.
    function sortByCreatedDesc(list) {
      return list.slice().sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
    }

    // Agrupa por status:
    //   1. Pendentes (mais importantes — ação necessária)
    //   2. Pagos
    //   3. Outros (expirado, cancelado, reembolsado) — preservados
    //      em um terceiro grupo pra não serem perdidos.
    // Painel de pagas: lista flat, sem grupos
    const sorted = sortByCreatedDesc(filtered);
    tbody.innerHTML = sorted.length
      ? sorted.map(renderBookingRow).join('')
      : '<tr><td colspan="15" class="admin__table-empty">Nenhuma compra paga encontrada.</td></tr>';

    // Wire editable status_fornecedor dropdowns
    tbody.querySelectorAll('.admin__sf-select').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var bookingId = sel.dataset.bookingId;
        var newStatus = sel.value;
        sel.disabled = true;
        try {
          var s = window.supabaseClient;
          if (s) {
            var { error } = await s.from('bookings').update({ status_fornecedor: newStatus }).eq('id', bookingId);
            if (error) {
              console.error('[Admin] status_fornecedor update error', error);
              alert('Erro ao atualizar status do fornecedor. Veja o console.');
            } else {
              sel.style.background = newStatus === 'repasse_feito' ? '#e6f4ea' : '#fff8ef';
              sel.style.color = newStatus === 'repasse_feito' ? '#1a8a4a' : '#b07b00';
              invalidateBookings();
            }
          }
        } catch (e) {
          console.error('[Admin] status_fornecedor exception', e);
        }
        sel.disabled = false;
      });
    });
  }

  // ===== PENDENTES =====
  async function renderPendingBookings() {
    if (!document.getElementById('pending-body')) return;
    // Filtra experiências de teste — cascata pra dropdown e tabela.
    const bookings = withoutTestBookings(await getBookings());
    const profiles = await getProfiles();

    const nomePorUserId = new Map();
    const nomePorEmail = new Map();
    const telPorUserId = new Map();
    const telPorEmail = new Map();
    (profiles || []).forEach(function (p) {
      var nm = (p.nome || '').trim();
      var tel = (p.telefone || '').trim();
      if (nm && p.id) nomePorUserId.set(p.id, nm);
      if (nm && p.email) nomePorEmail.set(String(p.email).toLowerCase(), nm);
      if (tel && p.id) telPorUserId.set(p.id, tel);
      if (tel && p.email) telPorEmail.set(String(p.email).toLowerCase(), tel);
    });

    // Filters
    var filterExpEl = document.getElementById('pending-filter-exp');
    if (filterExpEl && filterExpEl.options.length <= 1) {
      var seen = new Set();
      bookings.forEach(function (b) {
        if (b.experiencia_nome && !seen.has(b.experiencia_nome)) {
          seen.add(b.experiencia_nome);
          var opt = document.createElement('option');
          opt.value = b.experiencia_nome;
          opt.textContent = b.experiencia_nome;
          filterExpEl.appendChild(opt);
        }
      });
    }
    var filterExp = filterExpEl ? filterExpEl.value : '';
    var filterStatusEl = document.getElementById('pending-filter-status');
    var filterStatus = filterStatusEl ? filterStatusEl.value : '';
    var filterFuEl = document.getElementById('pending-filter-followup');
    var filterFu = filterFuEl ? filterFuEl.value : '';

    // Only non-paid bookings
    var filtered = bookings.filter(function (b) {
      if (b.status === 'pago') return false;
      if (filterExp && b.experiencia_nome !== filterExp) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      if (filterFu && (b.followup_status || 'nenhum') !== filterFu) return false;
      return true;
    });

    var countEl = document.getElementById('pending-count');
    if (countEl) countEl.textContent = filtered.length + ' reserva' + (filtered.length !== 1 ? 's' : '');

    var tbody = document.getElementById('pending-body');
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="admin__table-empty">Nenhuma reserva pendente.</td></tr>';
      return;
    }

    filtered.sort(function (a, b) {
      var ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      var tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    // Separa pendentes de cancelados/expirados/reembolsados. Pendentes
    // são os que ainda podem virar pago (vale follow-up); o resto é
    // contexto histórico. Sub-cabeçalhos só aparecem quando as duas
    // seções têm conteúdo — se o admin filtrou por um status só,
    // mostra a lista direta sem quebrar o visual.
    var pendentes = filtered.filter(function (b) { return b.status === 'pending'; });
    var cancelados = filtered.filter(function (b) { return b.status !== 'pending'; });
    var showSubHeaders = pendentes.length > 0 && cancelados.length > 0;
    var subHeaderBase = 'background:#fdf6e9;border-top:2px solid #f0cfa0;border-bottom:1px solid #f0cfa0;padding:10px 16px;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#7a5a2e;';
    var subHeaderMuted = 'background:#f4f4f4;border-top:2px solid #d9d9d9;border-bottom:1px solid #d9d9d9;padding:10px 16px;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#666;';

    function buildRow(b) {
      var telefone = b.telefone || '';
      if (!telefone && b.user_id && telPorUserId.has(b.user_id)) telefone = telPorUserId.get(b.user_id);
      if (!telefone && b.email) { var ek = String(b.email).toLowerCase(); if (telPorEmail.has(ek)) telefone = telPorEmail.get(ek); }
      var nomeResolved = (b.nome || '').trim() || null;
      if (!nomeResolved && b.user_id && nomePorUserId.has(b.user_id)) nomeResolved = nomePorUserId.get(b.user_id);
      if (!nomeResolved && b.email) { var nk = String(b.email).toLowerCase(); if (nomePorEmail.has(nk)) nomeResolved = nomePorEmail.get(nk); }
      var when = b.created_at ? new Date(b.created_at).toLocaleDateString('pt-BR') : '—';
      var telefoneCell = telefone
        ? '<a href="https://wa.me/55' + String(telefone).replace(/\D+/g, '').replace(/^55/, '') + '" target="_blank" rel="noopener" style="color:#1a8a4a;text-decoration:none;">' + escapeHtml(telefone) + '</a>'
        : '<span style="color:#bbb;">—</span>';
      var fuStatus = b.followup_status || 'nenhum';
      var fuBadge = '';
      if (fuStatus === 'nenhum') fuBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#fff8ef;color:#b07b00;font-size:11px;font-weight:600;">Sem follow-up</span>';
      else if (fuStatus === 'primeiro_enviado') fuBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#e8f0fe;color:#1a73e8;font-size:11px;font-weight:600;">1º enviado</span>';
      else if (fuStatus === 'segundo_enviado') fuBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#fce8e6;color:#c0392b;font-size:11px;font-weight:600;">2º enviado</span>';
      else if (fuStatus === 'recuperado') fuBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#e6f4ea;color:#1a8a4a;font-size:11px;font-weight:600;">Recuperado</span>';
      else fuBadge = '<span style="font-size:11px;color:#888;">' + escapeHtml(fuStatus) + '</span>';

      var waBtn = '';
      if (b.status === 'pending' && telefone && fuStatus !== 'segundo_enviado') {
        var firstName = (nomeResolved || '').split(' ')[0] || 'Oi';
        var msg = 'Oi, ' + firstName + '! Vimos que você quase reservou a experiência *' + (b.experiencia_nome || '') + '* ✨\n' +
          'As vagas estão nas últimas e essa pode ser sua última chance de garantir.\n' +
          'Se quiser, posso te mandar o link para finalizar sua reserva 💛';
        var waDigits = String(telefone).replace(/\D+/g, '').replace(/^55/, '');
        var waUrl = 'https://wa.me/55' + waDigits + '?text=' + encodeURIComponent(msg);
        var btnLabel = fuStatus === 'nenhum' ? '1º Follow-up' : '2º Follow-up';
        waBtn = '<button class="admin__fu-btn" data-booking-id="' + escapeHtml(b.id) + '" data-fu-next="' + (fuStatus === 'nenhum' ? 'primeiro_enviado' : 'segundo_enviado') + '" data-wa-url="' + escapeHtml(waUrl) + '" style="padding:4px 10px;border:1px solid #1a8a4a;background:#fff;color:#1a8a4a;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;white-space:nowrap;">' + btnLabel + '</button>';
      }

      return '<tr>' +
        '<td>' + escapeHtml(when) + '</td>' +
        '<td>' + escapeHtml(nomeResolved || '—') + '</td>' +
        '<td>' + escapeHtml(b.email || '—') + '</td>' +
        '<td>' + telefoneCell + '</td>' +
        '<td>' + escapeHtml(b.experiencia_nome || '—') + '</td>' +
        '<td>' + escapeHtml(b.data || '—') + '</td>' +
        '<td>' + escapeHtml(b.horario || '—') + '</td>' +
        '<td>' + (b.quantidade > 1 ? b.quantidade : '1') + '</td>' +
        '<td>' + escapeHtml(formatCents(b.amount_total, b.currency)) + '</td>' +
        '<td>' + bookingStatusBadge(b.status) + '</td>' +
        '<td>' + fuBadge + '</td>' +
        '<td>' + waBtn + '</td>' +
        '</tr>';
    }

    var htmlParts = [];
    if (showSubHeaders && pendentes.length > 0) {
      htmlParts.push(
        '<tr class="admin__sub-header"><td colspan="12" style="' + subHeaderBase + '">' +
          'Pendentes <span style="color:#a07c4c;font-weight:500;text-transform:none;letter-spacing:0;">· ' +
          pendentes.length + ' reserva' + (pendentes.length !== 1 ? 's' : '') +
        '</span></td></tr>'
      );
    }
    pendentes.forEach(function (b) { htmlParts.push(buildRow(b)); });

    if (showSubHeaders && cancelados.length > 0) {
      htmlParts.push(
        '<tr class="admin__sub-header"><td colspan="12" style="' + subHeaderMuted + '">' +
          'Cancelados / expirados <span style="color:#888;font-weight:500;text-transform:none;letter-spacing:0;">· ' +
          cancelados.length + ' reserva' + (cancelados.length !== 1 ? 's' : '') +
        '</span></td></tr>'
      );
    }
    cancelados.forEach(function (b) { htmlParts.push(buildRow(b)); });

    tbody.innerHTML = htmlParts.join('');

    // Wire follow-up buttons
    tbody.querySelectorAll('.admin__fu-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var bookingId = btn.dataset.bookingId;
        var nextStatus = btn.dataset.fuNext;
        var waUrl = btn.dataset.waUrl;
        // Open WhatsApp with pre-filled message
        window.open(waUrl, '_blank');
        // Update follow-up status in DB
        btn.disabled = true;
        btn.textContent = 'Salvando...';
        try {
          var s = window.supabaseClient;
          if (s) {
            var tsField = nextStatus === 'primeiro_enviado' ? 'followup_1_at' : 'followup_2_at';
            var patch = { followup_status: nextStatus };
            patch[tsField] = new Date().toISOString();
            await s.from('bookings').update(patch).eq('id', bookingId);
            invalidateBookings();
            renderPendingBookings();
          }
        } catch (e) {
          console.error('[Admin] follow-up update error', e);
          btn.disabled = false;
          btn.textContent = 'Erro';
        }
      });
    });
  }

  // Wire pending filters
  (function () {
    var fe = document.getElementById('pending-filter-exp');
    var fs = document.getElementById('pending-filter-status');
    var ff = document.getElementById('pending-filter-followup');
    if (fe) fe.addEventListener('change', function () { renderPendingBookings(); });
    if (fs) fs.addEventListener('change', function () { renderPendingBookings(); });
    if (ff) ff.addEventListener('change', function () { renderPendingBookings(); });
  })();

  // ===== EXPERIENCES CRUD =====
  let modal, modalBackdrop, modalClose, modalTitle, form, submitBtn, addBtn;
  let horariosList, horariosAddBtn;

  function parseCor(cor) {
    const parts = (cor || '').split(',').map(s => s.trim());
    return { cor1: parts[0] || '#f6d5a8', cor2: parts[1] || '#f0a05e' };
  }

  // slotObj = { id?, horario, vagasTotal, vagasRestantes }
  function addHorarioRow(slotObj) {
    if (!horariosList) return;
    var s = slotObj || {};
    var row = document.createElement('div');
    row.className = 'admin__horario-row';
    row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px;';
    row.innerHTML =
      '<input type="text" class="admin__horario-input" placeholder="Ex: 19h00 – 22h30" style="flex:2;">' +
      '<input type="number" class="admin__horario-vagas" min="0" step="1" placeholder="Vagas" title="Vagas totais (vazio = ilimitado)" style="flex:0 0 70px;text-align:center;">' +
      '<span class="admin__horario-restantes" style="flex:0 0 50px;font-size:.8rem;color:#888;text-align:center;" title="Vagas restantes"></span>' +
      '<button type="button" class="admin__horario-remove" aria-label="Remover horário" style="flex:0 0 28px;">&times;</button>';
    row.querySelector('.admin__horario-input').value = s.horario || '';
    row.querySelector('.admin__horario-vagas').value = s.vagasTotal != null ? s.vagasTotal : '';
    var restEl = row.querySelector('.admin__horario-restantes');
    if (s.vagasTotal != null && s.vagasRestantes != null) {
      restEl.textContent = s.vagasRestantes + ' rest.';
      var cor = s.vagasRestantes <= 0 ? '#c0392b' : (s.vagasRestantes <= 3 ? '#b07b00' : '#1a8a4a');
      restEl.style.color = cor;
      restEl.style.fontWeight = '600';
    } else {
      restEl.textContent = '∞';
    }
    if (s.id) row.dataset.slotId = s.id;
    row.querySelector('.admin__horario-remove').addEventListener('click', function () {
      var rows = horariosList.querySelectorAll('.admin__horario-row');
      if (rows.length > 1) row.remove();
      else {
        row.querySelector('.admin__horario-input').value = '';
        row.querySelector('.admin__horario-vagas').value = '';
        row.querySelector('.admin__horario-restantes').textContent = '∞';
        row.querySelector('.admin__horario-restantes').style.color = '#888';
        delete row.dataset.slotId;
      }
    });
    horariosList.appendChild(row);
  }

  function renderHorarioRows(slots) {
    if (!horariosList) return;
    horariosList.innerHTML = '';
    var initial = Array.isArray(slots) && slots.length ? slots : [{ horario: '' }];
    initial.forEach(function (s) { addHorarioRow(s); });
  }

  function collectHorarios() {
    if (!horariosList) return [];
    var inputs = horariosList.querySelectorAll('.admin__horario-input');
    return Array.from(inputs).map(function (i) { return i.value.trim(); }).filter(Boolean);
  }

  // Coleta slots com vagas pra salvar via ElarahData.saveSlots()
  function collectSlots() {
    if (!horariosList) return [];
    var rows = horariosList.querySelectorAll('.admin__horario-row');
    var out = [];
    rows.forEach(function (row) {
      var h = row.querySelector('.admin__horario-input').value.trim();
      if (!h) return;
      var vRaw = row.querySelector('.admin__horario-vagas').value.trim();
      out.push({
        id: row.dataset.slotId || null,
        horario: h,
        vagasTotal: vRaw === '' ? null : Number(vRaw),
        data: null, // será preenchido com exp.data no save
        eventAt: null, // será preenchido com exp.eventAt no save
      });
    });
    return out;
  }

  // Popula o <datalist id="exp-categoria-datalist"> com todas as
  // categorias já cadastradas no banco (+ um seed mínimo pra não
  // deixar vazio se não houver nenhuma experiência ainda).
  // É chamado toda vez que o modal abre pra garantir que a lista
  // reflita o estado atual (ex: o admin criou outra categoria
  // antes e quer escolher de novo).
  async function populateCategoriaDatalist() {
    const datalist = document.getElementById('exp-categoria-datalist');
    if (!datalist) return;
    const seed = [
      'Gastronomia', 'Cerâmica', 'Pintura', 'Vela', 'Sabonete',
      'Tufting', 'Floral', 'Macramê', 'Bartenderia',
    ];
    let dbCategorias = [];
    try {
      if (window.ElarahData && ElarahData.getAllExperiences) {
        const all = await ElarahData.getAllExperiences();
        dbCategorias = (all || [])
          .map(e => (e && e.categoria ? String(e.categoria).trim() : ''))
          .filter(Boolean);
      }
    } catch (e) {
      console.warn('[Admin] populateCategoriaDatalist: falha ao carregar categorias do banco', e);
    }
    // Unique + sorted (case-insensitive)
    const set = new Set();
    seed.concat(dbCategorias).forEach(c => {
      if (c && !set.has(c.toLowerCase())) set.add(c.toLowerCase());
    });
    // Reconstrói mantendo a capitalização original de cada uma
    // (prefere a do banco sobre a do seed).
    const seen = new Map();
    dbCategorias.forEach(c => {
      const k = c.toLowerCase();
      if (!seen.has(k)) seen.set(k, c);
    });
    seed.forEach(c => {
      const k = c.toLowerCase();
      if (!seen.has(k)) seen.set(k, c);
    });
    const final = Array.from(seen.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });
    datalist.innerHTML = final
      .map(c => '<option value="' + escapeHtml(c) + '"></option>')
      .join('');
    console.log('[Admin] datalist de categorias populado:', final.length, 'categorias');
  }

  async function openExpModal(editId) {
    // Garante que o datalist de categorias esteja atualizado ANTES
    // de abrir o modal — assim o autocomplete funciona na hora.
    await populateCategoriaDatalist();

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

      // Vagas e cutoff
      const vagasTotalEl = document.getElementById('exp-vagas-total');
      const vagasRestEl = document.getElementById('exp-vagas-restantes');
      const eventAtEl = document.getElementById('exp-event-at');
      const cutoffEl = document.getElementById('exp-cutoff-hours');
      if (vagasTotalEl) vagasTotalEl.value = exp.vagasTotal != null ? exp.vagasTotal : '';
      if (vagasRestEl)  vagasRestEl.value  = exp.vagasRestantes != null ? exp.vagasRestantes : '';
      if (eventAtEl) {
        // Converte ISO -> "YYYY-MM-DDTHH:MM" pro input datetime-local
        if (exp.eventAt) {
          const d = new Date(exp.eventAt);
          if (!isNaN(d.getTime())) {
            const pad = n => String(n).padStart(2, '0');
            eventAtEl.value =
              d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' +
              pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
          } else {
            eventAtEl.value = '';
          }
        } else {
          eventAtEl.value = '';
        }
      }
      if (cutoffEl) cutoffEl.value = exp.cutoffHours != null ? exp.cutoffHours : 24;

      const isActiveEl = document.getElementById('exp-is-active');
      if (isActiveEl) isActiveEl.checked = exp.isActive !== false;

      // By Elarah / Originals fields
      var ieoEl = document.getElementById('exp-is-elarah-original');
      var hfcEl = document.getElementById('exp-hide-from-categorias');
      var ctaEl = document.getElementById('exp-cta-mode');
      if (ieoEl) ieoEl.checked = exp.isElarahOriginal === true;
      if (hfcEl) hfcEl.checked = exp.hideFromCategorias === true;
      if (ctaEl) ctaEl.value = exp.ctaMode === 'waitlist' ? 'waitlist' : 'buy';

      // Fornecedor fields
      var fnEl = document.getElementById('exp-fornecedor-nome');
      var vcEl = document.getElementById('exp-valor-cheio');
      var prEl = document.getElementById('exp-percentual-repasse');
      if (fnEl) fnEl.value = exp.fornecedorNome || '';
      if (vcEl) vcEl.value = exp.valorCheioCentavos != null ? 'R$' + (exp.valorCheioCentavos / 100).toFixed(0) : '';
      if (prEl) prEl.value = exp.percentualRepasse != null ? exp.percentualRepasse : 90;

      // Carrega slots do banco — cada horário com sua vaga
      var slotsFromDb = [];
      try {
        if (ElarahData.getSlotsForExperience) {
          slotsFromDb = await ElarahData.getSlotsForExperience(editId);
        }
      } catch (e) { console.warn('[Admin] slots load failed', e); }

      if (slotsFromDb.length) {
        renderHorarioRows(slotsFromDb);
      } else {
        // Fallback: horarios sem slots (experiência pré-migração)
        var horarios = (Array.isArray(exp.horarios) && exp.horarios.length)
          ? exp.horarios
          : (exp.horario ? [exp.horario] : ['']);
        renderHorarioRows(horarios.map(function (h) { return { horario: h }; }));
      }

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
      renderHorarioRows([{ horario: '' }]);
      const cor1El = document.getElementById('exp-cor1');
      const cor2El = document.getElementById('exp-cor2');
      if (cor1El) cor1El.value = '#f6d5a8';
      if (cor2El) cor2El.value = '#f0a05e';
      const cutoffEl = document.getElementById('exp-cutoff-hours');
      if (cutoffEl) cutoffEl.value = 24;
      const vagasRestEl = document.getElementById('exp-vagas-restantes');
      if (vagasRestEl) vagasRestEl.value = '';
      const isActiveEl = document.getElementById('exp-is-active');
      if (isActiveEl) isActiveEl.checked = true;
      var fnEl2 = document.getElementById('exp-fornecedor-nome');
      var vcEl2 = document.getElementById('exp-valor-cheio');
      var prEl2 = document.getElementById('exp-percentual-repasse');
      if (fnEl2) fnEl2.value = '';
      if (vcEl2) vcEl2.value = '';
      if (prEl2) prEl2.value = 90;
      // By Elarah / Originals — defaults pra novo cadastro
      var ieoEl2 = document.getElementById('exp-is-elarah-original');
      var hfcEl2 = document.getElementById('exp-hide-from-categorias');
      var ctaEl2 = document.getElementById('exp-cta-mode');
      if (ieoEl2) ieoEl2.checked = false;
      if (hfcEl2) hfcEl2.checked = false;
      if (ctaEl2) ctaEl2.value = 'buy';
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
      horariosAddBtn.addEventListener('click', () => addHorarioRow({ horario: '' }));
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

      const vagasTotalRaw = (document.getElementById('exp-vagas-total')?.value || '').trim();
      const eventAtRaw    = (document.getElementById('exp-event-at')?.value || '').trim();
      const cutoffRaw     = (document.getElementById('exp-cutoff-hours')?.value || '').trim();

      // datetime-local devolve "YYYY-MM-DDTHH:MM" sem timezone — convertemos
      // pro horário local do navegador e mandamos como ISO.
      let eventAtIso = null;
      if (eventAtRaw) {
        const d = new Date(eventAtRaw);
        if (!isNaN(d.getTime())) eventAtIso = d.toISOString();
      }

      const expData = {
        nome: document.getElementById('exp-nome').value.trim(),
        categoria: (document.getElementById('exp-categoria').value || '').trim(),
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
        cor: cor1 + ',' + cor2,
        vagasTotal: vagasTotalRaw === '' ? null : Number(vagasTotalRaw),
        eventAt: eventAtIso,
        cutoffHours: cutoffRaw === '' ? 24 : Number(cutoffRaw),
        isActive: !!(document.getElementById('exp-is-active')?.checked ?? true),
        fornecedorNome: (document.getElementById('exp-fornecedor-nome')?.value || '').trim() || null,
        valorCheioCentavos: (function () {
          var raw = (document.getElementById('exp-valor-cheio')?.value || '').trim();
          if (!raw) return null;
          var cleaned = raw.replace(/[R$\s]/gi, '').replace(',', '.');
          var n = Math.round(Number(cleaned) * (cleaned.includes('.') ? 1 : 100));
          if (raw.match(/^\d+$/)) n = Number(raw) * 100;
          return Number.isFinite(n) && n > 0 ? n : null;
        })(),
        percentualRepasse: Number(document.getElementById('exp-percentual-repasse')?.value || 90),
        // By Elarah / Originals
        isElarahOriginal: !!(document.getElementById('exp-is-elarah-original')?.checked),
        hideFromCategorias: !!(document.getElementById('exp-hide-from-categorias')?.checked),
        ctaMode: (function () {
          var raw = (document.getElementById('exp-cta-mode')?.value || 'buy').trim();
          return raw === 'waitlist' ? 'waitlist' : 'buy';
        })()
      };

      const editId = document.getElementById('exp-edit-id').value;

      submitBtn.disabled = true;
      let saved = null;
      let caughtErr = null;
      try {
        if (editId) {
          saved = await ElarahData.updateExperience(editId, expData);
        } else {
          saved = await ElarahData.addExperience(expData);
        }
      } catch (e) {
        caughtErr = e;
        console.error('[Admin] exceção ao salvar experiência:', e);
      } finally {
        submitBtn.disabled = false;
      }

      // Se o save falhou (retorno null OU exceção), NÃO fecha o modal e
      // avisa o admin. Evita o bug antigo de "cliquei em salvar, o
      // modal fechou e a mudança não apareceu no site" — que na real
      // era uma falha silenciosa do Supabase.
      if (!saved) {
        const extra = caughtErr
          ? '\n\nDetalhe: ' + (caughtErr.message || String(caughtErr))
          : '';
        alert(
          'Não foi possível salvar a experiência. Abra o console do ' +
          'navegador (F12 → Console) para ver o erro exato. Causas ' +
          'comuns: usuário não está logado como admin, sessão expirada, ' +
          'ou falha de rede com o Supabase.' + extra
        );
        return;
      }

      // Salva slots (vagas por horário) na tabela experience_slots
      if (saved && saved.id && ElarahData.saveSlots) {
        try {
          var slotsToSave = collectSlots();
          // Preenche data e eventAt do slot com os valores da experiência
          slotsToSave.forEach(function (sl) {
            sl.data = expData.data || null;
            sl.eventAt = eventAtIso || null;
          });
          await ElarahData.saveSlots(saved.id, slotsToSave);
        } catch (slotErr) {
          console.error('[Admin] saveSlots falhou:', slotErr);
        }
        ElarahData.invalidateSlotsCache && ElarahData.invalidateSlotsCache();
      }

      closeExpModal();
      await renderExperiences();
      await renderOverview();
    });
  }

  // ===== Filtro por categoria =====
  let activeExpFilter = '';

  function buildExpFilterBar(experiences) {
    const bar = document.getElementById('exp-filter-bar');
    if (!bar) return;
    // Extrai categorias únicas (case-insensitive, preserva capitalização original)
    const seen = new Map();
    (experiences || []).forEach(function (e) {
      if (!e || !e.categoria) return;
      var key = e.categoria.toLowerCase();
      if (!seen.has(key)) seen.set(key, e.categoria);
    });
    var cats = Array.from(seen.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    bar.innerHTML = '';
    // Botão "Todas"
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'Todas';
    allBtn.className = 'admin__filter-pill' + (!activeExpFilter ? ' admin__filter-pill--active' : '');
    allBtn.addEventListener('click', function () {
      activeExpFilter = '';
      renderExperiences();
    });
    bar.appendChild(allBtn);

    cats.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = cat;
      btn.className = 'admin__filter-pill' + (activeExpFilter.toLowerCase() === cat.toLowerCase() ? ' admin__filter-pill--active' : '');
      btn.addEventListener('click', function () {
        activeExpFilter = cat;
        renderExperiences();
      });
      bar.appendChild(btn);
    });
  }

  async function renderExperiences() {
    const allExperiences = await getExperiences();

    // Constrói barra de filtro com TODAS as experiências (antes de filtrar)
    buildExpFilterBar(allExperiences);

    // Aplica filtro
    const experiences = activeExpFilter
      ? allExperiences.filter(function (e) {
          return e && e.categoria && e.categoria.toLowerCase() === activeExpFilter.toLowerCase();
        })
      : allExperiences;
    const tbody = document.getElementById('experiences-body');
    const countEl = document.getElementById('experiences-count');

    // Carrega todos os slots pra exibir vagas por horário
    var allSlotsMap = new Map();
    try {
      if (ElarahData.loadAllSlots) allSlotsMap = await ElarahData.loadAllSlots();
    } catch (e) { /* tabela pode não existir */ }

    if (activeExpFilter) {
      countEl.textContent = experiences.length + ' de ' + allExperiences.length + ' experiência' + (allExperiences.length !== 1 ? 's' : '');
    } else {
      countEl.textContent = allExperiences.length + ' experiência' + (allExperiences.length !== 1 ? 's' : '');
    }

    if (experiences.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin__table-empty">' +
        (activeExpFilter ? 'Nenhuma experiência na categoria "' + escapeHtml(activeExpFilter) + '".' : 'Nenhuma experiência cadastrada.') +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = experiences.map(exp => {
      const horariosDisplay = Array.isArray(exp.horarios) && exp.horarios.length > 1
        ? exp.horarios.join(' · ')
        : (exp.horario || '');

      // Vagas: mostra por slot se existirem, senão experience-level
      var expSlots = allSlotsMap.get(exp.id) || [];
      let vagasDisplay = '';
      if (expSlots.length) {
        vagasDisplay = expSlots.map(function (sl) {
          if (sl.vagasTotal == null) return '<span style="color:#888;font-size:.8rem;">' + escapeHtml(sl.horario) + ': ∞</span>';
          var rest = sl.vagasRestantes != null ? sl.vagasRestantes : sl.vagasTotal;
          var cor = rest <= 0 ? '#c0392b' : (rest <= 3 ? '#b07b00' : '#1a8a4a');
          return '<span style="color:' + cor + ';font-weight:600;font-size:.8rem;">' + escapeHtml(sl.horario) + ': ' + rest + '/' + sl.vagasTotal + '</span>';
        }).join('<br>');
      } else if (exp.vagasTotal != null) {
        const rest = exp.vagasRestantes != null ? exp.vagasRestantes : exp.vagasTotal;
        const cor = rest <= 0 ? '#c0392b' : (rest <= 3 ? '#b07b00' : '#1a8a4a');
        vagasDisplay = '<span style="color:' + cor + ';font-weight:600;">' +
                       rest + ' / ' + exp.vagasTotal + '</span>';
      } else {
        vagasDisplay = '<span style="color:#888;">∞</span>';
      }
      const isActive = exp.isActive !== false;
      // Status efetivo: refletir o que o usuário vê no site, não só
      // a flag is_active. Reusa ElarahData.isPubliclyVisible — mesma
      // regra do filtro público (getVisibleExperiences).
      const publicVisible =
        window.ElarahData && typeof window.ElarahData.isPubliclyVisible === 'function'
          ? window.ElarahData.isPubliclyVisible(exp)
          : isActive;
      const isHidden = !publicVisible;
      // Diferenciamos auto-oculta (passou) de oculta manual só no
      // tooltip e no comportamento do clique do botão "Reativar".
      // Visualmente o admin pediu pra ficar idêntico (vermelho).
      const autoHidden = isHidden && isActive;
      const tooltip = autoHidden
        ? 'Ocultada automaticamente — horário já passou ou está dentro do bloqueio de 24h. Clique em Reativar pra editar a data.'
        : (isHidden ? 'Ocultada manualmente pelo admin.' : '');
      const statusBadge = isHidden
        ? '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#fdecea;color:#c0392b;font-size:11px;font-weight:600;" title="' + escapeHtml(tooltip) + '">Oculta</span>'
        : '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#e6f4ea;color:#1a8a4a;font-size:11px;font-weight:600;">Visível</span>';
      const rowStyle = isHidden ? ' style="opacity:0.55;"' : '';
      // Botão de toggle: oculta -> Reativar, visível -> Ocultar.
      // data-auto-hidden marca o caso em que isActive=true mas o
      // evento já passou, pra que o handler abra o modal de edição
      // (única forma real de "reativar" — mudar a data) em vez de
      // chamar setExperienceActive(true) que seria no-op.
      const toggleLabel = isHidden ? 'Reativar' : 'Ocultar';
      const toggleClass = isHidden ? 'admin__action-btn--show' : 'admin__action-btn--hide';
      return `
      <tr${rowStyle}>
        <td>${escapeHtml(exp.nome)}</td>
        <td>${escapeHtml(exp.categoria)}</td>
        <td>${escapeHtml(exp.data)}</td>
        <td>${escapeHtml(horariosDisplay)}</td>
        <td>${escapeHtml(exp.bairro)}</td>
        <td>${escapeHtml(exp.preco)}</td>
        <td>${vagasDisplay}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="admin__action-btn admin__action-btn--edit" data-edit-exp="${escapeHtml(exp.id)}">Editar</button>
          <button class="admin__action-btn ${toggleClass}" data-toggle-exp="${escapeHtml(exp.id)}" data-toggle-active="${isActive ? '1' : '0'}" data-auto-hidden="${autoHidden ? '1' : '0'}">${toggleLabel}</button>
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
    tbody.querySelectorAll('[data-toggle-exp]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.toggleExp;
        const currentlyActive = btn.dataset.toggleActive === '1';
        const autoHidden = btn.dataset.autoHidden === '1';
        // Reativar uma experiência auto-oculta (passou do horário ou
        // está dentro do cutoff de 24h) só faz sentido se o admin
        // mudar a data — alternar is_active seria no-op porque já
        // está true. Abre o modal de edição direto.
        if (autoHidden) {
          openExpModal(id);
          return;
        }
        const nextActive = !currentlyActive;
        const verb = nextActive ? 'reativar' : 'ocultar';
        if (!confirm('Deseja ' + verb + ' esta experiência? Os dados são preservados.')) return;
        btn.disabled = true;
        try {
          if (ElarahData && typeof ElarahData.setExperienceActive === 'function') {
            const updated = await ElarahData.setExperienceActive(id, nextActive);
            if (!updated) {
              alert(
                'Não foi possível atualizar a visibilidade. Veja o ' +
                'console (F12) pra detalhes — causas comuns: coluna ' +
                'is_active ausente (rode sql/elarah_experiences_visibility.sql) ' +
                'ou usuário não é admin.'
              );
            }
          } else {
            alert('Função setExperienceActive indisponível. Recarregue a página.');
          }
        } finally {
          btn.disabled = false;
        }
        await renderExperiences();
        await renderOverview();
      });
    });
    tbody.querySelectorAll('[data-delete-exp]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja excluir esta experiência? Essa ação é permanente — se quiser apenas tirar do site, use "Ocultar".')) {
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

  // =================================================
  // ============ BY ELARAH (Originals) ==============
  // =================================================
  let byModal, byModalBackdrop, byModalClose, byModalTitle;
  let byForm, bySubmitBtn, byAddBtn;
  let byHorariosList, byHorariosAddBtn;

  function byAddHorarioRow(value) {
    if (!byHorariosList) return;
    const row = document.createElement('div');
    row.className = 'admin__horario-row';
    row.innerHTML = `
      <input type="text" class="admin__horario-input" placeholder="Ex: 10h às 13h">
      <button type="button" class="admin__horario-remove" aria-label="Remover horário">&times;</button>
    `;
    row.querySelector('input').value = value || '';
    row.querySelector('.admin__horario-remove').addEventListener('click', () => {
      const rows = byHorariosList.querySelectorAll('.admin__horario-row');
      if (rows.length > 1) row.remove();
      else row.querySelector('input').value = '';
    });
    byHorariosList.appendChild(row);
  }

  function byRenderHorarios(horarios) {
    if (!byHorariosList) return;
    byHorariosList.innerHTML = '';
    const initial = Array.isArray(horarios) && horarios.length ? horarios : [''];
    initial.forEach(h => byAddHorarioRow(h));
  }

  function byCollectHorarios() {
    if (!byHorariosList) return [];
    const inputs = byHorariosList.querySelectorAll('.admin__horario-input');
    return Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
  }

  async function openByModal(editId) {
    if (!byModal) return;
    const $ = (id) => document.getElementById(id);

    if (editId) {
      const item = await ElarahByElarah.getItemById(editId);
      if (!item) return;
      byModalTitle.textContent = 'Editar item By Elarah';
      bySubmitBtn.textContent = 'Atualizar item';
      $('by-nome').value = item.nome || '';
      $('by-descricao').value = item.descricao || '';
      $('by-imagem').value = item.imagem || '';
      $('by-data').value = item.data || '';
      $('by-local').value = item.local || '';
      $('by-tipo').value = item.tipo || 'espera';
      $('by-ordem').value = item.ordem || 0;
      $('by-ativo').value = item.ativo === false ? 'false' : 'true';
      $('by-slug').value = item.slug || '';
      $('by-edit-id').value = editId;
      byRenderHorarios(item.horarios || []);
    } else {
      byModalTitle.textContent = 'Novo item By Elarah';
      bySubmitBtn.textContent = 'Salvar item';
      byForm.reset();
      $('by-tipo').value = 'espera';
      $('by-ordem').value = 0;
      $('by-ativo').value = 'true';
      $('by-edit-id').value = '';
      byRenderHorarios(['']);
    }
    byModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeByModal() {
    if (!byModal) return;
    byModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function wireByElarahForm() {
    byModal = document.getElementById('byelarah-modal');
    if (!byModal) return;
    byModalBackdrop = byModal.querySelector('.admin__modal-backdrop');
    byModalClose = document.getElementById('byelarah-modal-close');
    byModalTitle = document.getElementById('byelarah-modal-title');
    byForm = document.getElementById('byelarah-form');
    bySubmitBtn = document.getElementById('by-submit-btn');
    byAddBtn = document.getElementById('btn-add-byelarah');
    byHorariosList = document.getElementById('by-horarios-list');
    byHorariosAddBtn = document.getElementById('by-horarios-add-btn');

    if (byHorariosAddBtn) byHorariosAddBtn.addEventListener('click', () => byAddHorarioRow(''));
    if (byAddBtn) byAddBtn.addEventListener('click', () => openByModal(null));
    if (byModalBackdrop) byModalBackdrop.addEventListener('click', closeByModal);
    if (byModalClose) byModalClose.addEventListener('click', closeByModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && byModal.classList.contains('open')) closeByModal();
    });

    byForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const $ = (id) => document.getElementById(id);
      const horarios = byCollectHorarios();
      const data = {
        slug: $('by-slug').value.trim(),
        nome: $('by-nome').value.trim(),
        descricao: $('by-descricao').value.trim(),
        imagem: $('by-imagem').value.trim(),
        data: $('by-data').value.trim(),
        local: $('by-local').value.trim(),
        horarios: horarios,
        tipo: $('by-tipo').value,
        ordem: parseInt($('by-ordem').value, 10) || 0,
        ativo: $('by-ativo').value === 'true'
      };
      const editId = $('by-edit-id').value;
      bySubmitBtn.disabled = true;
      try {
        if (editId) {
          await ElarahByElarah.updateItem(editId, data);
        } else {
          await ElarahByElarah.addItem(data);
        }
      } finally {
        bySubmitBtn.disabled = false;
      }
      closeByModal();
      await renderByElarah();
    });
  }

  // Chave de agrupamento estável: normaliza case/espaço pra que
  // "Pintura com Aperol" e "pintura com  aperol" caiam no mesmo
  // bloco. Não muda o valor exibido — só a chave usada pra agrupar.
  function byElarahGroupKey(nome) {
    return String(nome || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  // Agrupa uma lista por experience name preservando a ordem da
  // primeira ocorrência de cada grupo (estável). Retorna um array
  // de { nome, rows } pronto pra iterar.
  function groupByExperienceName(list, getName) {
    const order = [];
    const map = new Map();
    for (const row of list) {
      const nome = (getName(row) || '').trim() || '— sem nome —';
      const key = byElarahGroupKey(nome);
      if (!map.has(key)) {
        order.push(key);
        map.set(key, { nome, rows: [] });
      }
      map.get(key).rows.push(row);
    }
    return order.map(k => map.get(k));
  }

  // Detecta turno a partir da string de horário (ex: "10h às 13h" → manha,
  // "14h às 17h" → tarde). Pega o primeiro número que aparece.
  function byElarahPeriodOf(horario) {
    if (!horario) return 'sem';
    const m = String(horario).match(/(\d{1,2})/);
    if (!m) return 'sem';
    const h = parseInt(m[1], 10);
    if (isNaN(h)) return 'sem';
    if (h < 12) return 'manha';
    if (h < 18) return 'tarde';
    return 'noite';
  }

  const BY_ELARAH_PERIOD_ORDER = ['manha', 'tarde', 'noite', 'sem'];
  const BY_ELARAH_PERIOD_LABEL = {
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
    sem: 'Sem horário'
  };

  // Quebra rows por turno, preservando a ordem original (data desc).
  // Devolve só os buckets não-vazios, na ordem manha → tarde → noite → sem.
  function bucketByPeriod(rows) {
    const buckets = { manha: [], tarde: [], noite: [], sem: [] };
    rows.forEach(r => buckets[byElarahPeriodOf(r.horario)].push(r));
    return BY_ELARAH_PERIOD_ORDER
      .filter(p => buckets[p].length > 0)
      .map(p => ({ period: p, label: BY_ELARAH_PERIOD_LABEL[p], rows: buckets[p] }));
  }

  // Acha o item By Elarah correspondente à experiência da submissão.
  // Match case-insensitive pelo nome, via byElarahGroupKey (mesma
  // normalização que o agrupamento da tabela usa).
  function findByElarahItemFor(items, expName) {
    if (!Array.isArray(items) || !expName) return null;
    const key = byElarahGroupKey(expName);
    return items.find(i => byElarahGroupKey(i && i.nome) === key) || null;
  }

  // Monta URL wa.me com mensagem pré-preenchida de "última chance"
  // pro follow-up de By Elarah. Pega dados estruturados do item
  // (local, data, horários) quando disponíveis. Se não houver telefone
  // válido, devolve '' — caller não renderiza botão.
  function buildByElarahWaUrl(sub, item) {
    const digits = String(sub.telefone || '').replace(/\D+/g, '').replace(/^55/, '');
    if (!digits) return '';
    const firstName = String(sub.nome || '').trim().split(/\s+/)[0] || 'Oi';
    const exp = (sub.experiencia || (item && item.nome) || '').trim();
    const local = (item && item.local || '').trim();
    const data = (item && item.data || '').trim();
    const horariosList = Array.isArray(item && item.horarios)
      ? item.horarios.map(h => String(h || '').trim()).filter(Boolean)
      : [];
    const horariosStr = horariosList.length ? horariosList.join(' ou ') : '';

    const lines = [
      'Oii ' + firstName + ' 💛',
      '',
      'Passando pra te contar que essa experiência é pra sair do automático e viver algo diferente ✨'
    ];
    if (exp) {
      lines.push('');
      lines.push('Você vai participar de *' + exp + '* — um encontro pra relaxar, criar e conhecer gente nova 💫');
    }
    if (local || data || horariosStr) {
      lines.push('');
      if (local) lines.push('📍 ' + local);
      if (data) lines.push('🗓️ ' + data);
      if (horariosStr) lines.push('⏰ ' + horariosStr);
    }
    lines.push('');
    lines.push('As vagas estão nas últimas — essa pode ser a sua *última chance* de garantir seu lugar! 🧡');
    lines.push('Se quiser, eu te envio o link pra confirmar agora mesmo.');

    return 'https://wa.me/55' + digits + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  // Fica fora do render pra sobreviver entre re-renders — se
  // re-adicionássemos listeners a cada innerHTML, o mesmo click
  // dispararia múltiplas vezes (memory leak + ação em duplicidade).
  let byElarahListenersWired = false;
  function wireByElarahTableListeners() {
    if (byElarahListenersWired) return;
    const itemsBody = document.getElementById('byelarah-items-body');
    const subsBody = document.getElementById('byelarah-subs-body');
    if (!itemsBody || !subsBody) return;
    byElarahListenersWired = true;

    itemsBody.addEventListener('click', async (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;
      const editBtn = target.closest('[data-by-edit]');
      if (editBtn) {
        openByModal(editBtn.dataset.byEdit);
        return;
      }
      const delBtn = target.closest('[data-by-delete]');
      if (delBtn) {
        if (confirm('Remover este item By Elarah?')) {
          await ElarahByElarah.deleteItem(delBtn.dataset.byDelete);
          await renderByElarah();
        }
      }
    });

    subsBody.addEventListener('click', async (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;
      const doneBtn = target.closest('[data-by-sub-done]');
      if (doneBtn) {
        await ElarahByElarah.updateSubmissionStatus(doneBtn.dataset.bySubDone, 'atendido');
        await renderByElarah();
        return;
      }
      const delBtn = target.closest('[data-by-sub-del]');
      if (delBtn) {
        if (confirm('Remover esta resposta?')) {
          await ElarahByElarah.deleteSubmission(delBtn.dataset.bySubDel);
          await renderByElarah();
        }
      }
    });
  }

  async function renderByElarah() {
    if (!document.getElementById('byelarah-items-body')) return;
    wireByElarahTableListeners();
    const [items, subs] = await Promise.all([
      ElarahByElarah.getAllItems(),
      ElarahByElarah.getAllSubmissions()
    ]);

    // Stats
    document.getElementById('stat-byelarah-items').textContent = items.length;
    document.getElementById('stat-byelarah-subs').textContent = subs.length;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = subs.filter(s => new Date(s.created_at).getTime() > dayAgo).length;
    document.getElementById('stat-byelarah-new').textContent = recent;

    // ========== Items table — GROUPED BY NAME ==========
    const itemsBody = document.getElementById('byelarah-items-body');
    const itemsCount = document.getElementById('byelarah-items-count');

    if (!items.length) {
      itemsCount.textContent = '0 itens';
      itemsBody.innerHTML = '<tr><td colspan="8" class="admin__table-empty">Nenhum item By Elarah cadastrado.</td></tr>';
    } else {
      // Ordena itens por `ordem` antes de agrupar — dentro de cada
      // grupo os itens saem na ordem natural definida no admin.
      const sortedItems = items.slice().sort((a, b) => {
        const oa = Number(a.ordem) || 0;
        const ob = Number(b.ordem) || 0;
        return oa - ob;
      });
      const itemGroups = groupByExperienceName(sortedItems, it => it.nome);
      const nGroups = itemGroups.length;
      itemsCount.textContent =
        items.length + ' item' + (items.length !== 1 ? 's' : '') +
        ' · ' + nGroups + ' experiência' + (nGroups !== 1 ? 's' : '');

      console.info('[Admin/byelarah] rendering', itemGroups.length, 'item groups from', items.length, 'items');
      const html = [];
      itemGroups.forEach(group => {
        const nSessions = group.rows.length;
        const sessoesLabel = nSessions + ' sess' + (nSessions === 1 ? 'ão' : 'ões');
        // Inline styles como fallback — garantem que o header
        // apareça mesmo se admin.css estiver cacheado numa versão
        // antiga sem as classes .admin__group-header.
        const headerStyle = 'background:linear-gradient(90deg,#fff8ee 0%,#fdf4e3 100%);border-top:3px solid #f0a05e;border-bottom:1px solid #f0cfa0;padding:18px 16px 14px;';
        const titleStyle = "font-family:'DM Serif Display',serif;font-size:1.1rem;color:#1a1a1a;";
        const pillStyle = 'display:inline-block;padding:4px 12px;border-radius:999px;background:#f0a05e;color:#fff;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-left:12px;vertical-align:middle;';
        html.push(
          '<tr class="admin__group-header">' +
            '<td colspan="8" style="' + headerStyle + '">' +
              '<div class="admin__group-header-inner" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
                '<span class="admin__group-header-title" style="' + titleStyle + '">' + escapeHtml(group.nome) + '</span>' +
                '<span class="admin__group-header-pill" style="' + pillStyle + '">' + escapeHtml(sessoesLabel) + '</span>' +
              '</div>' +
            '</td>' +
          '</tr>'
        );
        group.rows.forEach(it => {
          const horariosStr = Array.isArray(it.horarios) && it.horarios.length
            ? it.horarios.join(' · ') : '—';
          const tipoLabel = it.tipo === 'participar' ? 'Participar' : 'Lista de espera';
          const tipoClass = it.tipo === 'participar' ? 'approved' : 'pending';
          const statusLabel = it.ativo === false ? 'Oculto' : 'Ativo';
          const statusClass = it.ativo === false ? 'rejected' : 'approved';
          const imgHtml = it.imagem
            ? `<img src="${escapeHtml(it.imagem)}" alt="" class="admin__thumb" loading="lazy" decoding="async">`
            : '<span class="admin__thumb admin__thumb--placeholder">—</span>';
          const isDbItem = typeof it.id === 'string' && it.id && !it.id.startsWith('fallback-');
          const actions = isDbItem
            ? `
              <button class="admin__action-btn admin__action-btn--edit" data-by-edit="${escapeHtml(it.id)}">Editar</button>
              <button class="admin__action-btn admin__action-btn--delete" data-by-delete="${escapeHtml(it.id)}">Excluir</button>
            `
            : '<span class="admin__badge admin__badge--pending">Fallback</span>';
          html.push(`
            <tr>
              <td>${it.ordem || 0}</td>
              <td>${imgHtml}</td>
              <td>${escapeHtml(it.nome)}</td>
              <td>${escapeHtml(it.data || '—')}</td>
              <td><span class="admin__badge admin__badge--${tipoClass}">${tipoLabel}</span></td>
              <td>${escapeHtml(horariosStr)}</td>
              <td><span class="admin__badge admin__badge--${statusClass}">${statusLabel}</span></td>
              <td>${actions}</td>
            </tr>
          `);
        });
      });
      itemsBody.innerHTML = html.join('');
      // Listeners são registrados uma única vez via delegação em
      // wireByElarahTableListeners() — não re-wirar aqui.
    }

    // ========== Submissions table — GROUPED BY EXPERIENCE ==========
    const subsBody = document.getElementById('byelarah-subs-body');
    const subsCount = document.getElementById('byelarah-subs-count');

    if (!subs.length) {
      subsCount.textContent = '0 respostas';
      subsBody.innerHTML = '<tr><td colspan="9" class="admin__table-empty">Nenhuma resposta registrada.</td></tr>';
    } else {
      // Ordena por data desc ANTES de agrupar — dentro de cada
      // grupo as respostas mais novas ficam no topo.
      const sortedSubs = subs.slice().sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      const subGroups = groupByExperienceName(sortedSubs, s => s.experiencia);
      // Ordena grupos: mais recentes (pela resposta mais nova do
      // grupo) primeiro, pra experiências com movimento recente
      // ficarem no topo.
      subGroups.sort((ga, gb) => {
        const ta = ga.rows[0] && ga.rows[0].created_at ? new Date(ga.rows[0].created_at).getTime() : 0;
        const tb = gb.rows[0] && gb.rows[0].created_at ? new Date(gb.rows[0].created_at).getTime() : 0;
        return tb - ta;
      });
      const nGroups = subGroups.length;
      subsCount.textContent =
        subs.length + ' resposta' + (subs.length !== 1 ? 's' : '') +
        ' · ' + nGroups + ' experiência' + (nGroups !== 1 ? 's' : '');

      console.info('[Admin/byelarah] rendering', subGroups.length, 'submission groups from', subs.length, 'responses');
      // Inline styles como fallback — garantem visibilidade mesmo
      // com admin.css cacheado numa versão antiga.
      const headerStyle = 'background:linear-gradient(90deg,#fff8ee 0%,#fdf4e3 100%);border-top:3px solid #f0a05e;border-bottom:1px solid #f0cfa0;padding:18px 16px 14px;';
      const titleStyle = "font-family:'DM Serif Display',serif;font-size:1.1rem;color:#1a1a1a;";
      const pillBase = 'display:inline-block;padding:4px 12px;border-radius:999px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:middle;';
      const pillOrange = pillBase + 'background:#f0a05e;color:#fff;';
      const pillMuted = pillBase + 'background:#e5d8c5;color:#7a5a2e;';
      const pillGreen = pillBase + 'background:#1a8a4a;color:#fff;';

      const html = [];
      subGroups.forEach(group => {
        const n = group.rows.length;
        const respLabel = n + ' resposta' + (n !== 1 ? 's' : '');
        // Conta novas nas últimas 24h dentro do grupo (útil pra
        // identificar experiências com demanda recente).
        const novasDoGrupo = group.rows.filter(r =>
          r.created_at && new Date(r.created_at).getTime() > dayAgo
        ).length;
        const novasPill = novasDoGrupo > 0
          ? '<span class="admin__group-header-pill" style="' + pillGreen + 'margin-left:8px;">' + novasDoGrupo + ' nova' + (novasDoGrupo !== 1 ? 's' : '') + ' (24h)</span>'
          : '';
        html.push(
          '<tr class="admin__group-header">' +
            '<td colspan="9" style="' + headerStyle + '">' +
              '<div class="admin__group-header-inner" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
                '<span class="admin__group-header-title" style="' + titleStyle + '">' + escapeHtml(group.nome) + '</span>' +
                '<span class="admin__group-header-pill admin__group-header-pill--muted" style="' + pillOrange + '">' + respLabel + '</span>' +
                novasPill +
              '</div>' +
            '</td>' +
          '</tr>'
        );

        // Sub-agrupamento por turno (manhã/tarde/noite). Só aparece
        // sub-cabeçalho quando o grupo tem mais de um turno — pra
        // grupos com um único horário, mantém o visual compacto.
        const buckets = bucketByPeriod(group.rows);
        const showSubHeaders = buckets.length > 1;
        const subHeaderStyle = 'background:#fdf6e9;border-bottom:1px solid #f0cfa0;padding:10px 16px;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#7a5a2e;';

        buckets.forEach(bucket => {
          if (showSubHeaders) {
            const nb = bucket.rows.length;
            const subLabel = nb + ' resposta' + (nb !== 1 ? 's' : '');
            html.push(
              '<tr class="admin__sub-header">' +
                '<td colspan="9" style="' + subHeaderStyle + '">' +
                  escapeHtml(bucket.label) +
                  ' <span style="color:#a07c4c;font-weight:500;text-transform:none;letter-spacing:0;">· ' + subLabel + '</span>' +
                '</td>' +
              '</tr>'
            );
          }
          bucket.rows.forEach(s => {
            const when = s.created_at
              ? new Date(s.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
              : '—';
            const tipoLabel = s.tipo === 'participar' ? 'Participar' : 'Espera';
            const tipoClass = s.tipo === 'participar' ? 'approved' : 'pending';
            const statusLabel = s.status || 'novo';
            const statusClass = statusLabel === 'atendido' ? 'approved'
                              : statusLabel === 'descartado' ? 'rejected' : 'pending';

            // Botão WhatsApp de "última chance" — só aparece quando há
            // telefone válido. Abre wa.me com mensagem pré-preenchida
            // em aba nova. Status no banco não é alterado (diferente
            // do follow-up de Pendentes): pra By Elarah, usar "Atendido"
            // manualmente quando a pessoa responder.
            const matchedItem = findByElarahItemFor(items, s.experiencia);
            const waUrl = buildByElarahWaUrl(s, matchedItem);
            const waBtn = waUrl
              ? `<a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener" class="admin__action-btn" style="background:#fff;color:#1a8a4a;border:1px solid #1a8a4a;text-decoration:none;display:inline-block;" title="Abrir WhatsApp com mensagem de última chance">WhatsApp</a>`
              : '';

            html.push(`
              <tr>
                <td>${escapeHtml(when)}</td>
                <td>${escapeHtml(s.experiencia || '—')}</td>
                <td><span class="admin__badge admin__badge--${tipoClass}">${tipoLabel}</span></td>
                <td>${escapeHtml(s.nome || '—')}</td>
                <td>${escapeHtml(s.email || '—')}</td>
                <td>${escapeHtml(s.telefone || '—')}</td>
                <td>${escapeHtml(s.horario || '—')}</td>
                <td><span class="admin__badge admin__badge--${statusClass}">${statusLabel}</span></td>
                <td>
                  ${waBtn}
                  <button class="admin__action-btn admin__action-btn--approve" data-by-sub-done="${escapeHtml(s.id)}">Atendido</button>
                  <button class="admin__action-btn admin__action-btn--delete" data-by-sub-del="${escapeHtml(s.id)}">Excluir</button>
                </td>
              </tr>
            `);
          });
        });
      });
      subsBody.innerHTML = html.join('');
      // Listeners são registrados uma única vez via delegação em
      // wireByElarahTableListeners() — não re-wirar aqui.
    }
  }

  // =================================================
  // ================ FORNECEDORES ===================
  // =================================================
  // Análise financeira por fornecedor: agrega reservas pagas e
  // experiências por `fornecedor_nome` (match case-insensitive),
  // combina com `data_entrada` editável guardada em
  // fornecedores_metadata (tabela criada em
  // sql/elarah_fornecedores_metadata.sql — se ainda não rodou,
  // o admin mostra tudo sem a data e o save do input vai avisar).
  //
  // Fonte dos fornecedores é a UNIÃO de:
  //   - bookings.fornecedor_nome  (de reservas, inclusive pendentes)
  //   - experiences.fornecedorNome (pra capturar fornecedores que
  //     ainda não venderam nada)
  // Assim fornecedor novo (0 reservas) aparece, e fornecedor antigo
  // com experiências deletadas também não some.
  function fornecedorKey(nome) {
    return String(nome || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // Formata diferença em dias pra string humana.
  // 0 → "entrou hoje", 1 → "1 dia", 2-29 → "X dias",
  // 30-89 → "X meses" arredondado, 90-364 → "X meses",
  // >= 365 → "X anos" ou "X anos e Y meses"
  function formatParceiroHa(dataEntrada) {
    if (!dataEntrada) return '<span style="color:#bbb;">—</span>';
    const start = new Date(dataEntrada + 'T00:00:00');
    if (isNaN(start.getTime())) return '<span style="color:#bbb;">—</span>';
    const now = new Date();
    const ms = now.getTime() - start.getTime();
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (dias < 0) return '<span style="color:#c33;">data futura</span>';
    if (dias === 0) return 'entrou hoje';
    if (dias === 1) return '1 dia';
    if (dias < 30) return dias + ' dias';
    if (dias < 365) {
      const meses = Math.round(dias / 30);
      return meses + (meses === 1 ? ' mês' : ' meses');
    }
    const anos = Math.floor(dias / 365);
    const mesesResto = Math.round((dias - anos * 365) / 30);
    if (mesesResto === 0) return anos + (anos === 1 ? ' ano' : ' anos');
    return anos + (anos === 1 ? ' ano' : ' anos') + ' e ' + mesesResto + (mesesResto === 1 ? ' mês' : ' meses');
  }

  // Cache simples — invalidada ao salvar data_entrada.
  let fornecedoresMetaCache = null;
  async function getFornecedoresMetadata() {
    if (fornecedoresMetaCache) return fornecedoresMetaCache.slice();
    const s = window.supabaseClient;
    if (!s) return [];
    const { data, error } = await s.from('fornecedores_metadata').select('*');
    if (error) {
      // Tabela pode não existir ainda — migração pendente.
      console.warn('[Admin] getFornecedoresMetadata error (tabela ausente?)', error.message);
      return [];
    }
    fornecedoresMetaCache = data || [];
    return fornecedoresMetaCache.slice();
  }

  async function saveFornecedorDataEntrada(fornecedorNome, dataEntradaISO) {
    const s = window.supabaseClient;
    if (!s) return { ok: false, error: 'Supabase client indisponível' };
    const key = fornecedorKey(fornecedorNome);
    if (!key) return { ok: false, error: 'Nome do fornecedor vazio' };
    const { error } = await s.from('fornecedores_metadata').upsert(
      {
        fornecedor_key: key,
        fornecedor_nome: fornecedorNome,
        data_entrada: dataEntradaISO || null,
      },
      { onConflict: 'fornecedor_key' }
    );
    if (error) {
      console.error('[Admin] saveFornecedorDataEntrada error', error);
      return { ok: false, error: error.message };
    }
    fornecedoresMetaCache = null;
    return { ok: true };
  }

  async function renderFornecedores() {
    if (!document.getElementById('fornecedores-body')) return;

    const [bookingsRaw, allExperiences, metadata] = await Promise.all([
      getBookings(),
      (window.ElarahData && ElarahData.getAllExperiences)
        ? ElarahData.getAllExperiences().catch(() => [])
        : Promise.resolve([]),
      getFornecedoresMetadata(),
    ]);
    // Esconde bookings de teste pra não inflar faturamento/repasse
    // do fornecedor associado.
    const bookings = withoutTestBookings(bookingsRaw);

    const metaByKey = new Map();
    (metadata || []).forEach(m => {
      if (m && m.fornecedor_key) metaByKey.set(m.fornecedor_key, m);
    });

    // Agrega por fornecedor_key. Começa pelas experiences pra
    // capturar fornecedores com 0 vendas.
    const aggByKey = new Map();
    function ensureAgg(nomeRaw) {
      const nome = String(nomeRaw || '').trim();
      if (!nome) return null;
      const key = fornecedorKey(nome);
      if (!aggByKey.has(key)) {
        aggByKey.set(key, {
          key,
          nome,
          experiencesTotal: 0,
          experiencesAtivas: 0,
          reservas: 0,
          faturamentoCents: 0,
          repasseTotalCents: 0,
          repassePagoCents: 0,
          repassePendenteCents: 0,
          comissaoCents: 0,
          lastBookingTs: 0,
        });
      }
      return aggByKey.get(key);
    }

    (allExperiences || []).forEach(e => {
      if (!e) return;
      const agg = ensureAgg(e.fornecedorNome);
      if (!agg) return;
      agg.experiencesTotal += 1;
      if (e.isActive !== false) agg.experiencesAtivas += 1;
    });

    // Para fallback de valores: map experience id → exp object.
    const expById = new Map();
    (allExperiences || []).forEach(e => {
      if (e && e.id) expById.set(e.id, e);
    });

    (bookings || []).forEach(b => {
      if (!b) return;
      // Pega fornecedor do booking OU da experiência de fallback.
      const exp = expById.get(b.experiencia_id);
      const nome = (b.fornecedor_nome && b.fornecedor_nome.trim())
        || (exp && exp.fornecedorNome) || '';
      if (!nome) return;
      const agg = ensureAgg(nome);
      if (!agg) return;

      // Só conta valores pra bookings pagas.
      if (b.status !== 'pago') return;

      agg.reservas += 1;

      const qty = Math.max(1, Number(b.quantidade) || 1);
      let valorCheio = b.valor_cheio_centavos != null ? Number(b.valor_cheio_centavos) : null;
      if (!valorCheio && exp && exp.valorCheioCentavos) {
        valorCheio = Number(exp.valorCheioCentavos) * qty;
      }
      let valorRepasse = b.valor_repasse_centavos != null ? Number(b.valor_repasse_centavos) : null;
      if (!valorRepasse && valorCheio) valorRepasse = Math.round(valorCheio * 0.70);
      let valorComissao = b.valor_comissao_centavos != null ? Number(b.valor_comissao_centavos) : null;
      if (!valorComissao && valorCheio) valorComissao = Math.round(valorCheio * 0.20);

      if (valorCheio) agg.faturamentoCents += valorCheio;
      if (valorRepasse) {
        agg.repasseTotalCents += valorRepasse;
        if (b.status_fornecedor === 'repasse_feito') {
          agg.repassePagoCents += valorRepasse;
        } else {
          agg.repassePendenteCents += valorRepasse;
        }
      }
      if (valorComissao) agg.comissaoCents += valorComissao;

      const ts = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (ts > agg.lastBookingTs) agg.lastBookingTs = ts;
    });

    const list = Array.from(aggByKey.values());
    // Ordena por faturamento desc (fornecedor mais rentável primeiro).
    list.sort((a, b) => b.faturamentoCents - a.faturamentoCents);

    // Stats globais.
    const totalCount = list.length;
    const totalGross = list.reduce((s, f) => s + f.faturamentoCents, 0);
    const totalComissao = list.reduce((s, f) => s + f.comissaoCents, 0);
    const totalPendente = list.reduce((s, f) => s + f.repassePendenteCents, 0);

    document.getElementById('stat-fornecedores-count').textContent = totalCount;
    document.getElementById('stat-fornecedores-gross').textContent = formatCents(totalGross, 'BRL');
    document.getElementById('stat-fornecedores-comissao').textContent = formatCents(totalComissao, 'BRL');
    document.getElementById('stat-fornecedores-pendente').textContent = formatCents(totalPendente, 'BRL');

    const countEl = document.getElementById('fornecedores-count');
    if (countEl) countEl.textContent = totalCount + ' fornecedor' + (totalCount !== 1 ? 'es' : '');

    const tbody = document.getElementById('fornecedores-body');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin__table-empty">Nenhum fornecedor cadastrado ainda. Preencha o campo "Fornecedor" nas experiências pra ver os dados aqui.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(f => {
      const meta = metaByKey.get(f.key);
      const dataEntradaISO = meta && meta.data_entrada ? meta.data_entrada : '';
      const parceiroHa = formatParceiroHa(dataEntradaISO);
      const experienciasLabel = f.experiencesAtivas === f.experiencesTotal
        ? f.experiencesTotal
        : f.experiencesAtivas + ' / ' + f.experiencesTotal;
      const repasseLabel = f.repassePendenteCents > 0
        ? formatCents(f.repasseTotalCents, 'BRL') +
          '<br><span style="font-size:.72rem;color:#b07b00;">' +
          formatCents(f.repassePendenteCents, 'BRL') + ' pendente</span>'
        : formatCents(f.repasseTotalCents, 'BRL');
      const lastBookingLabel = f.lastBookingTs
        ? new Date(f.lastBookingTs).toLocaleDateString('pt-BR')
        : '<span style="color:#bbb;">—</span>';
      return '<tr>' +
        '<td style="font-weight:600;">' + escapeHtml(f.nome) + '</td>' +
        '<td><input type="date" class="admin__forn-data-entrada" data-forn-key="' + escapeHtml(f.key) + '" data-forn-nome="' + escapeHtml(f.nome) + '" value="' + escapeHtml(dataEntradaISO) + '" style="padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:.82rem;font-family:inherit;"></td>' +
        '<td>' + parceiroHa + '</td>' +
        '<td>' + experienciasLabel + '</td>' +
        '<td>' + f.reservas + '</td>' +
        '<td style="font-weight:600;">' + escapeHtml(formatCents(f.faturamentoCents, 'BRL')) + '</td>' +
        '<td>' + repasseLabel + '</td>' +
        '<td style="color:var(--orange,#f0a05e);font-weight:600;">' + escapeHtml(formatCents(f.comissaoCents, 'BRL')) + '</td>' +
        '<td>' + lastBookingLabel + '</td>' +
      '</tr>';
    }).join('');

    // Wire edit handlers. Uses delegation via querySelectorAll —
    // acceptable aqui porque o tbody é inteiro re-renderizado a
    // cada refresh, não acumula listeners fantasmas.
    tbody.querySelectorAll('.admin__forn-data-entrada').forEach(input => {
      input.addEventListener('change', async (e) => {
        const el = e.target;
        const nome = el.dataset.fornNome;
        const value = el.value; // '' ou 'yyyy-mm-dd'
        el.disabled = true;
        const res = await saveFornecedorDataEntrada(nome, value);
        el.disabled = false;
        if (!res.ok) {
          alert('Não consegui salvar a data. ' +
            (res.error && res.error.includes('fornecedores_metadata')
              ? 'A tabela fornecedores_metadata não existe no banco — rode sql/elarah_fornecedores_metadata.sql no SQL Editor do Supabase.'
              : res.error || 'Verifique se você está logada como admin.'));
          return;
        }
        // Recalcula "Parceiro há" na célula irmã sem re-renderizar tudo.
        const row = el.closest('tr');
        if (row) {
          const parceiroCell = row.children[2];
          if (parceiroCell) parceiroCell.innerHTML = formatParceiroHa(value);
        }
      });
    });
  }

  // =================================================
  // ================== ANALYTICS ====================
  // =================================================
  function wireAnalyticsControls() {
    const btn = document.getElementById('btn-refresh-analytics');
    const sel = document.getElementById('analytics-range');
    if (btn) btn.addEventListener('click', () => renderAnalytics());
    if (sel) sel.addEventListener('change', () => renderAnalytics());
  }

  function groupCount(items, keyFn, labelFn) {
    const map = new Map();
    items.forEach(it => {
      const k = keyFn(it);
      if (!k) return;
      const prev = map.get(k);
      if (prev) { prev.count += 1; }
      else { map.set(k, { key: k, label: labelFn ? labelFn(it) : k, count: 1 }); }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  function renderBars(containerId, rows, emptyMsg) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = `<p class="admin__analytics-empty">${escapeHtml(emptyMsg || 'Sem dados para o período.')}</p>`;
      return;
    }
    const max = rows[0].count || 1;
    el.innerHTML = rows.slice(0, 10).map(r => {
      const pct = Math.max(4, Math.round((r.count / max) * 100));
      return `
        <div class="admin__bar">
          <div class="admin__bar-label" title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</div>
          <div class="admin__bar-track"><div class="admin__bar-fill" style="width:${pct}%"></div></div>
          <div class="admin__bar-count">${r.count}</div>
        </div>
      `;
    }).join('');
  }

  async function renderAnalytics() {
    if (!document.getElementById('panel-analytics')) return;
    const sel = document.getElementById('analytics-range');
    const days = sel ? parseInt(sel.value, 10) : 7;
    const events = await ElarahAnalytics.getAllEvents(days || null);

    // Stats
    const totalEvents = events.length;
    const pageviews = events.filter(e => e.event_name === 'page_view');
    const sessions = new Set();
    events.forEach(e => { if (e.session_id) sessions.add(e.session_id); });
    const byConversions = events.filter(e => e.event_name === 'byelarah_submission').length;

    document.getElementById('stat-ana-events').textContent = totalEvents;
    document.getElementById('stat-ana-pageviews').textContent = pageviews.length;
    document.getElementById('stat-ana-sessions').textContent = sessions.size;
    document.getElementById('stat-ana-conversions').textContent = byConversions;

    // Top pages (pageviews by page)
    const topPages = groupCount(
      pageviews,
      e => e.page || e.path || '—',
      e => (e.page || e.path || '—')
    );
    renderBars('ana-top-pages', topPages);

    // Top experiences (experience_card_click + exp_detail_open + exp_cta_click)
    // Esconde eventos de experiências de teste pra não poluir o ranking.
    const expEvents = events.filter(e =>
      (e.event_name === 'experience_card_click' ||
        e.event_name === 'exp_detail_open' ||
        e.event_name === 'exp_cta_click') &&
      !isTestExperience(e.target_label || e.target_id)
    );
    const topExperiences = groupCount(
      expEvents,
      e => e.target_label || e.target_id || '—',
      e => e.target_label || e.target_id || '—'
    );
    renderBars('ana-top-experiences', topExperiences);

    // Top categories (category_nav_click + category filters)
    const catEvents = events.filter(e =>
      e.event_name === 'category_nav_click' ||
      e.event_name === 'category_filter_click'
    );
    const topCategories = groupCount(
      catEvents,
      e => e.target_label || e.target_id || '—',
      e => e.target_label || e.target_id || '—'
    );
    renderBars('ana-top-categories', topCategories);

    // Top buttons & CTAs
    const btnEvents = events.filter(e =>
      e.category === 'cta' ||
      e.category === 'click' ||
      e.event_name === 'header_nav_click' ||
      e.event_name === 'group_button_click'
    );
    const topButtons = groupCount(
      btnEvents,
      e => (e.target_label || e.event_name || '—'),
      e => e.target_label || e.event_name || '—'
    );
    renderBars('ana-top-buttons', topButtons);

    // By Elarah items
    const byEvents = events.filter(e =>
      e.event_name === 'byelarah_card_click' ||
      e.event_name === 'byelarah_submission'
    );
    const topBy = groupCount(
      byEvents,
      e => e.target_label || e.target_id || '—',
      e => e.target_label || e.target_id || '—'
    );
    renderBars('ana-byelarah-items', topBy);

    // Event categories
    const topCatEvents = groupCount(
      events,
      e => e.category || 'general',
      e => e.category || 'general'
    );
    renderBars('ana-event-categories', topCatEvents);

    // Recent events
    const recentBody = document.getElementById('ana-recent-body');
    const recent = events.slice(0, 30);
    if (!recent.length) {
      recentBody.innerHTML = '<tr><td colspan="5" class="admin__table-empty">Nenhum evento registrado.</td></tr>';
    } else {
      recentBody.innerHTML = recent.map(e => {
        const when = e.created_at
          ? new Date(e.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
          : '—';
        return `
          <tr>
            <td>${escapeHtml(when)}</td>
            <td>${escapeHtml(e.event_name || '—')}</td>
            <td>${escapeHtml(e.category || '—')}</td>
            <td>${escapeHtml(e.page || '—')}</td>
            <td>${escapeHtml(e.target_label || e.target_id || '—')}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // ===== START =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
