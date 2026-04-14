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
  console.info('[Elarah Admin] admin.js v16 — byelarah agrupado por experiência');

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
    const [profiles, experiences, giftCardsResult, bookings] = await Promise.all([
      getProfiles(),
      getExperiences(),
      getGiftCards(),
      getBookings().catch(() => [])
    ]);
    const partners = profiles.filter(p => p.partner_status && p.partner_status !== 'none');

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
  }

  async function renderBookings() {
    if (!document.getElementById('purchases-body')) return;
    // Renderiza gift cards na mesma tela (seção auxiliar) — assim o
    // operador vê TODAS as compras (reservas + gift cards) sem trocar
    // de menu. Não bloqueia o render principal.
    renderGiftCardsInPurchasesPanel().catch(e =>
      console.error('[admin] render gift cards in purchases failed', e)
    );
    const bookings = await getBookings();

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

    const filterExp = filterExpEl ? filterExpEl.value : '';
    const filterStatusEl = document.getElementById('bookings-filter-status');
    const filterStatus = filterStatusEl ? filterStatusEl.value : '';

    const filtered = bookings.filter(b => {
      if (filterExp && b.experiencia_nome !== filterExp) return false;
      if (filterStatus && b.status !== filterStatus) return false;
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
        const clicks = await ElarahAnalytics.rawSelect({ eventName: 'reserve_click', limit: 10000 });
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

    tbody.innerHTML = filtered.map(b => {
      const when = b.created_at
        ? new Date(b.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : '—';
      // Telefone: aceita coluna dedicada OU fallback via metadata
      // (bookings criadas antes da migração rodar ou em casos onde
      // a coluna telefone falhou e só o metadata foi preservado).
      // Extrai só dígitos pro link wa.me (formato E.164 BR: 55 + DDD + nº).
      let telefone = b.telefone || null;
      if (!telefone && b.metadata && typeof b.metadata === 'object') {
        telefone = b.metadata.telefone || b.metadata.telefone_digits || null;
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
      return `
        <tr>
          <td>${escapeHtml(when)}</td>
          <td>${escapeHtml(b.nome || '—')}</td>
          <td>${escapeHtml(b.email || '—')}</td>
          <td>${telefoneCell}</td>
          <td>${escapeHtml(b.experiencia_nome || '—')}</td>
          <td>${escapeHtml(b.data || '—')}</td>
          <td>${escapeHtml(b.horario || '—')}</td>
          <td>${escapeHtml(formatCents(b.amount_total, b.currency))}</td>
          <td>${bookingStatusBadge(b.status)}</td>
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
      const cutoffEl = document.getElementById('exp-cutoff-hours');
      if (cutoffEl) cutoffEl.value = 24;
      const vagasRestEl = document.getElementById('exp-vagas-restantes');
      if (vagasRestEl) vagasRestEl.value = '';
      const isActiveEl = document.getElementById('exp-is-active');
      if (isActiveEl) isActiveEl.checked = true;
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
        isActive: !!(document.getElementById('exp-is-active')?.checked ?? true)
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
      tbody.innerHTML = '<tr><td colspan="9" class="admin__table-empty">Nenhuma experiência cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = experiences.map(exp => {
      const horariosDisplay = Array.isArray(exp.horarios) && exp.horarios.length > 1
        ? exp.horarios.join(' · ')
        : (exp.horario || '');
      let vagasDisplay = '<span style="color:#888;">∞</span>';
      if (exp.vagasTotal != null) {
        const rest = exp.vagasRestantes != null ? exp.vagasRestantes : exp.vagasTotal;
        const cor = rest <= 0 ? '#c0392b' : (rest <= 3 ? '#b07b00' : '#1a8a4a');
        vagasDisplay = '<span style="color:' + cor + ';font-weight:600;">' +
                       rest + ' / ' + exp.vagasTotal + '</span>';
      }
      const isActive = exp.isActive !== false;
      const rowStyle = isActive ? '' : ' style="opacity:0.55;"';
      const statusBadge = isActive
        ? '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#e6f4ea;color:#1a8a4a;font-size:11px;font-weight:600;">Visível</span>'
        : '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#fdecea;color:#c0392b;font-size:11px;font-weight:600;">Oculta</span>';
      const toggleLabel = isActive ? 'Ocultar' : 'Reativar';
      const toggleClass = isActive ? 'admin__action-btn--hide' : 'admin__action-btn--show';
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
          <button class="admin__action-btn ${toggleClass}" data-toggle-exp="${escapeHtml(exp.id)}" data-toggle-active="${isActive ? '1' : '0'}">${toggleLabel}</button>
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

  async function renderByElarah() {
    if (!document.getElementById('byelarah-items-body')) return;
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
            ? `<img src="${escapeHtml(it.imagem)}" alt="" class="admin__thumb">`
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

      itemsBody.querySelectorAll('[data-by-edit]').forEach(btn => {
        btn.addEventListener('click', () => openByModal(btn.dataset.byEdit));
      });
      itemsBody.querySelectorAll('[data-by-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Remover este item By Elarah?')) {
            await ElarahByElarah.deleteItem(btn.dataset.byDelete);
            await renderByElarah();
          }
        });
      });
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
        group.rows.forEach(s => {
          const when = s.created_at
            ? new Date(s.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : '—';
          const tipoLabel = s.tipo === 'participar' ? 'Participar' : 'Espera';
          const tipoClass = s.tipo === 'participar' ? 'approved' : 'pending';
          const statusLabel = s.status || 'novo';
          const statusClass = statusLabel === 'atendido' ? 'approved'
                            : statusLabel === 'descartado' ? 'rejected' : 'pending';
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
                <button class="admin__action-btn admin__action-btn--approve" data-by-sub-done="${escapeHtml(s.id)}">Atendido</button>
                <button class="admin__action-btn admin__action-btn--delete" data-by-sub-del="${escapeHtml(s.id)}">Excluir</button>
              </td>
            </tr>
          `);
        });
      });
      subsBody.innerHTML = html.join('');

      subsBody.querySelectorAll('[data-by-sub-done]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await ElarahByElarah.updateSubmissionStatus(btn.dataset.bySubDone, 'atendido');
          await renderByElarah();
        });
      });
      subsBody.querySelectorAll('[data-by-sub-del]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Remover esta resposta?')) {
            await ElarahByElarah.deleteSubmission(btn.dataset.bySubDel);
            await renderByElarah();
          }
        });
      });
    }
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
    const expEvents = events.filter(e =>
      e.event_name === 'experience_card_click' ||
      e.event_name === 'exp_detail_open' ||
      e.event_name === 'exp_cta_click'
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
