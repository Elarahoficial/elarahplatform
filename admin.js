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
  console.info('[Elarah Admin] admin.js v30 — filtro fornecedor em Experiências (cache-buster bump)');

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
  // Faz checagem em camadas e LOGA cada etapa, pra que o user veja
  // exatamente onde travou em vez de redirect silencioso.
  // Quando bloqueia, mostra tela de diagnóstico (não redirect cego)
  // com instruções claras de como resolver.
  async function boot() {
    console.info('[Admin BOOT] iniciando…');

    // 1a) Espera o supabase client carregar (vendor é async).
    // Sem isso, no admin.html podemos checar window.supabaseClient
    // antes do <script> do vendor terminar de baixar — daí "lib não
    // carregou" mesmo com o banco saudável.
    if (!window.supabaseClient
        && window.ElarahSupabase
        && typeof window.ElarahSupabase.waitClient === 'function') {
      console.info('[Admin BOOT] aguardando supabase client (waitClient)…');
      try {
        const c = await window.ElarahSupabase.waitClient(8000);
        if (c) console.info('[Admin BOOT] supabase client pronto.');
        else console.warn('[Admin BOOT] timeout esperando supabase client.');
      } catch (e) {
        console.warn('[Admin BOOT] waitClient rejeitou:', e);
      }
    }

    // 1b) Espera auth hidratar antes de decidir.
    if (window.ElarahAuth && ElarahAuth.ready) {
      console.info('[Admin BOOT] aguardando ElarahAuth.ready…');
      try { await ElarahAuth.ready; console.info('[Admin BOOT] ElarahAuth pronto.'); } catch (e) {
        console.warn('[Admin BOOT] ElarahAuth.ready rejeitou:', e);
      }
    } else {
      console.warn('[Admin BOOT] window.ElarahAuth indisponível.');
    }

    let allowed = false;
    let diagState = {
      logged_in: false,
      session_user_id: null,
      session_email: null,
      profile_found: false,
      profile_role: null,
      profile_email: null,
      profile_query_error: null,
      ephemeral: false,
      reason: 'unknown',
    };

    // 2) Estado em memória do ElarahAuth.
    try {
      const memUser = ElarahAuth.getCurrentUser && ElarahAuth.getCurrentUser();
      if (memUser) {
        diagState.logged_in = true;
        diagState.session_email = memUser.email || null;
        diagState.session_user_id = memUser.id || null;
        diagState.profile_role = memUser.role || null;
        if (memUser.role === 'admin') {
          allowed = true;
          diagState.reason = 'admin (cache em memória)';
        }
        console.info('[Admin BOOT] user em memória:', { email: memUser.email, role: memUser.role });
      } else {
        console.warn('[Admin BOOT] ElarahAuth.getCurrentUser retornou null.');
      }
    } catch (e) {
      console.warn('[Admin BOOT] erro lendo currentUser em memória:', e);
    }

    // 3) Defesa contra cache stale: vai direto no Supabase.
    if (!allowed && window.supabaseClient) {
      try {
        console.info('[Admin BOOT] consultando Supabase direto…');
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session || !session.user) {
          diagState.reason = 'sem sessão Supabase (você não está logado)';
          console.warn('[Admin BOOT] sem sessão.');
        } else {
          diagState.logged_in = true;
          diagState.session_user_id = session.user.id;
          diagState.session_email = session.user.email || null;
          console.info('[Admin BOOT] sessão ativa:', { id: session.user.id, email: session.user.email });

          const { data: prof, error } = await window.supabaseClient
            .from('profiles')
            .select('id, role, email, nome')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            diagState.profile_query_error = error.message || String(error);
            diagState.reason = 'erro lendo profile: ' + diagState.profile_query_error;
            console.error('[Admin BOOT] erro lendo profile:', error);
          } else if (!prof) {
            diagState.reason = 'profile não existe na tabela public.profiles para este user_id';
            console.warn('[Admin BOOT] profile inexistente para user_id', session.user.id);
          } else {
            diagState.profile_found = true;
            diagState.profile_role = prof.role || null;
            diagState.profile_email = prof.email || null;
            console.info('[Admin BOOT] profile encontrado:', prof);
            if (prof.role === 'admin') {
              allowed = true;
              diagState.reason = 'admin (confirmado no banco)';
            } else {
              diagState.reason = 'profile existe mas role=' + JSON.stringify(prof.role) + ' (precisa ser "admin")';
            }
          }
        }
      } catch (e) {
        diagState.profile_query_error = String(e && e.message || e);
        diagState.reason = 'exceção consultando Supabase: ' + diagState.profile_query_error;
        console.error('[Admin BOOT] exceção:', e);
      }
    } else if (!allowed && !window.supabaseClient) {
      diagState.reason = 'window.supabaseClient não inicializou (lib não carregou)';
      console.error('[Admin BOOT] supabaseClient null.');
    }

    if (!allowed) {
      console.error('[Admin BOOT] ACESSO NEGADO. Motivo:', diagState.reason, diagState);
      renderAdminAccessDenied(diagState);
      return;
    }

    console.info('[Admin BOOT] acesso liberado, montando painéis…');
    wireNavigation();
    wireLogout();
    wireExperienceForm();
    wireByElarahForm();
    wireAnalyticsControls();
    wireBookingsControls();
    await renderOverview();
  }

  // Tela de diagnóstico explícita quando o boot bloqueia o acesso.
  // Substitui o redirect cego pra index.html que confundia o admin
  // ("por que ele me joga pra fora sem dizer nada?").
  function renderAdminAccessDenied(diag) {
    const container = document.querySelector('.admin') || document.body;
    const escape = function (s) {
      const d = document.createElement('div'); d.textContent = String(s == null ? '—' : s); return d.innerHTML;
    };
    const sqlPromote =
      "update public.profiles\n" +
      "   set role = 'admin'\n" +
      " where lower(email) = lower('" + (diag.session_email || diag.profile_email || 'SEU_EMAIL_AQUI') + "');";

    const html =
      '<div style="max-width:760px;margin:48px auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);font-family:inherit;">' +
        '<h1 style="margin:0 0 8px;color:#b07b00;font-size:1.4rem;">Acesso ao admin negado</h1>' +
        '<p style="margin:0 0 20px;color:#666;font-size:.92rem;">' +
          'Identificamos por que você não consegue entrar. Veja abaixo e siga a instrução correspondente.' +
        '</p>' +

        '<div style="background:#fff8ef;border:1px solid #f0d9a8;border-radius:8px;padding:14px 16px;margin-bottom:20px;">' +
          '<div style="font-size:.78rem;color:#7a6440;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Motivo identificado</div>' +
          '<div style="font-weight:600;color:#1a1a1a;">' + escape(diag.reason) + '</div>' +
        '</div>' +

        '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:.88rem;">' +
          '<tbody>' +
            '<tr><td style="padding:6px 0;color:#666;width:42%;">Logado no Supabase</td><td style="padding:6px 0;font-weight:600;">' + (diag.logged_in ? 'Sim' : 'Não') + '</td></tr>' +
            '<tr><td style="padding:6px 0;color:#666;">Email da sessão</td><td style="padding:6px 0;font-family:monospace;">' + escape(diag.session_email) + '</td></tr>' +
            '<tr><td style="padding:6px 0;color:#666;">User ID</td><td style="padding:6px 0;font-family:monospace;font-size:.78rem;">' + escape(diag.session_user_id) + '</td></tr>' +
            '<tr><td style="padding:6px 0;color:#666;">Profile existe na tabela</td><td style="padding:6px 0;font-weight:600;">' + (diag.profile_found ? 'Sim' : 'Não') + '</td></tr>' +
            '<tr><td style="padding:6px 0;color:#666;">Role no banco</td><td style="padding:6px 0;font-family:monospace;font-weight:600;color:' + (diag.profile_role === 'admin' ? '#1a8a4a' : '#b00') + ';">' + escape(diag.profile_role) + '</td></tr>' +
            (diag.profile_query_error ? '<tr><td style="padding:6px 0;color:#666;">Erro de query</td><td style="padding:6px 0;color:#b00;font-size:.82rem;">' + escape(diag.profile_query_error) + '</td></tr>' : '') +
          '</tbody>' +
        '</table>' +

        '<div style="margin-bottom:24px;">' +
          '<h3 style="margin:0 0 8px;font-size:1rem;">Como resolver agora</h3>' +
          (!diag.logged_in
            ? '<p style="margin:0;color:#444;">Você não está logado. Volte pra <a href="index.html" style="color:#b07b00;">index.html</a>, faça login com o email do admin e tente de novo.</p>'
            : !diag.profile_found
              ? '<p style="margin:0 0 12px;color:#444;">Seu user existe no auth.users mas não tem profile na tabela <code>public.profiles</code>. Rode no SQL Editor do Supabase:</p>' +
                '<pre style="background:#1a1a1a;color:#fff;padding:12px;border-radius:6px;overflow:auto;font-size:.78rem;">' + escape(
                  "insert into public.profiles (id, email, nome, role)\n" +
                  "values ('" + (diag.session_user_id || 'USER_ID') + "', '" + (diag.session_email || 'SEU_EMAIL') + "', '', 'admin')\n" +
                  "on conflict (id) do update set role = 'admin', email = excluded.email;"
                ) + '</pre>'
              : diag.profile_role !== 'admin'
                ? '<p style="margin:0 0 12px;color:#444;">Seu profile existe mas o <code>role</code> está como <strong>' + escape(diag.profile_role || '(vazio)') + '</strong>. Rode no SQL Editor do Supabase:</p>' +
                  '<pre style="background:#1a1a1a;color:#fff;padding:12px;border-radius:6px;overflow:auto;font-size:.78rem;">' + escape(sqlPromote) + '</pre>'
                : '<p style="margin:0;color:#444;">Estado inesperado. Veja o console (F12) — todos os passos foram logados com prefixo <code>[Admin BOOT]</code>.</p>'
          ) +
        '</div>' +

        '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
          '<button id="admin-retry-btn" type="button" style="padding:10px 18px;background:#f0a05e;color:#fff;border:0;border-radius:6px;font-weight:600;cursor:pointer;font-family:inherit;font-size:.92rem;">Tentar de novo</button>' +
          '<a href="index.html" style="padding:10px 18px;background:#fff;color:#666;border:1px solid #ddd;border-radius:6px;font-weight:600;text-decoration:none;font-family:inherit;font-size:.92rem;">Voltar pra home</a>' +
          '<button id="admin-logout-btn" type="button" style="padding:10px 18px;background:#fff;color:#b00;border:1px solid #b00;border-radius:6px;font-weight:600;cursor:pointer;font-family:inherit;font-size:.92rem;">Logout (limpar sessão)</button>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    const retryBtn = document.getElementById('admin-retry-btn');
    if (retryBtn) retryBtn.addEventListener('click', () => window.location.reload());

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          if (window.ElarahAuth && ElarahAuth.logout) await ElarahAuth.logout();
          else if (window.supabaseClient) await window.supabaseClient.auth.signOut();
        } catch (e) { console.warn('[Admin BOOT] logout erro:', e); }
        try { localStorage.removeItem('elarah-auth'); } catch {}
        window.location.href = 'index.html';
      });
    }
  }

  // ===== NAVIGATION =====
  // Helper exposto pra que outros pontos do admin (ex: atalho da
  // aba By Elarah → "Criar Original comprável") consigam trocar
  // de painel programaticamente sem duplicar a lógica de active
  // class + scroll-to-top + refreshPanel.
  async function navigateToPanel(target) {
    const navItems = document.querySelectorAll('.admin__nav-item');
    const panels = document.querySelectorAll('.admin__panel');
    const targetItem = document.querySelector('[data-panel="' + target + '"]');
    if (!targetItem) return;
    navItems.forEach(n => n.classList.remove('admin__nav-item--active'));
    targetItem.classList.add('admin__nav-item--active');
    panels.forEach(p => p.classList.remove('admin__panel--active'));
    const targetPanel = document.getElementById('panel-' + target);
    if (targetPanel) targetPanel.classList.add('admin__panel--active');
    try {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const mainEl = document.querySelector('.admin__main');
      if (mainEl) mainEl.scrollTop = 0;
    } catch {}
    await refreshPanel(target);
  }
  // Expõe global pra que handlers DOM-level (botão atalho By Elarah)
  // consigam chamar sem hack de eventos sintéticos.
  window._adminNavigateToPanel = navigateToPanel;

  function wireNavigation() {
    const navItems = document.querySelectorAll('.admin__nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', async () => {
        await navigateToPanel(item.dataset.panel);
      });
    });

    // Atalho do aviso na aba By Elarah → leva pra Experiências e
    // já abre o modal pré-marcado como Elarah Original comprável.
    // Resolve a confusão "cadastrei em By Elarah mas não tem checkout":
    // 1 clique e o admin está no formulário certo com defaults certos.
    const shortcutBtn = document.getElementById('btn-add-elarah-original-shortcut');
    if (shortcutBtn) {
      shortcutBtn.addEventListener('click', async () => {
        await navigateToPanel('experiences');
        // Espera o painel renderizar antes de tentar abrir o modal.
        // refreshPanel já é await acima; aqui só damos um tick extra
        // pra que o wireExperienceForm tenha rodado se for primeira vez.
        setTimeout(() => {
          const addBtn = document.getElementById('btn-add-experience');
          if (addBtn) addBtn.click();
          // Pré-marca os defaults que fazem sentido pra "Original comprável".
          // Roda em outro tick pra garantir que o modal abriu e o reset
          // do form já aconteceu.
          setTimeout(() => {
            const ieoEl = document.getElementById('exp-is-elarah-original');
            const ctaEl = document.getElementById('exp-cta-mode');
            if (ieoEl) ieoEl.checked = true;
            if (ctaEl) ctaEl.value = 'buy';
            // Foca no nome pra começar a digitar logo.
            const nomeEl = document.getElementById('exp-nome');
            if (nomeEl) try { nomeEl.focus({ preventScroll: true }); } catch {}
          }, 50);
        }, 30);
      });
    }
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
      case 'content':
        if (window.ElarahContent && window.ElarahContent.render) {
          await window.ElarahContent.render();
        }
        break;
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

    // Wire click handlers nos botões de WhatsApp: marca o usuário
    // como contatado no banco (whatsapp_contacted_at = now) e
    // atualiza visual local na hora — cor passa de laranja pra verde
    // sem precisar reload. Como o <a> abre wa.me em nova aba (target
    // _blank), o JavaScript continua rodando em paralelo, sem bloquear.
    tbody.querySelectorAll('.admin__user-wa-trigger').forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.dataset.userId;
        if (!userId) return;
        // Otimista: pinta verde já. Se a request falhar depois,
        // recarrega o painel pra refletir o estado real.
        markUserAsContactedVisually(tbody, userId);
        markUserWhatsappContacted(userId).catch((e) => {
          console.warn('[Admin] markUserWhatsappContacted falhou — recarregando lista', e);
          renderUsers();
        });
      });
    });
  }

  // Pinta todos os botões/links com este user-id como "já contatado".
  function markUserAsContactedVisually(tbody, userId) {
    const sel = '[data-user-id="' + (window.CSS && CSS.escape ? CSS.escape(userId) : userId) + '"]';
    tbody.querySelectorAll(sel).forEach(el => {
      if (el.classList.contains('admin__user-wa-btn')) {
        el.style.background = '#25D366';
        el.dataset.contacted = '1';
        el.title = 'Já convidado agora — clique pra reenviar';
      }
    });
  }

  async function markUserWhatsappContacted(userId) {
    const s = window.supabaseClient;
    if (!s || !userId) return;
    const { error } = await s
      .from('profiles')
      .update({ whatsapp_contacted_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      // Coluna ainda não existe? Avisa explicitamente.
      if (/column .* does not exist/i.test(error.message || '') ||
          /whatsapp_contacted_at/i.test(error.message || '')) {
        alert('A coluna whatsapp_contacted_at ainda não existe no banco. ' +
              'Rode sql/elarah_users_whatsapp_contacted.sql no SQL Editor do Supabase.');
      }
      throw error;
    }
    // getProfiles() não tem cache local (vai direto no banco em cada
    // call), então a próxima leitura já vê o valor atualizado.
  }

  // Monta a célula de telefone da lista de usuários: número visível + botão
  // verde ao lado que abre o WhatsApp com mensagem pronta convidando pro
  // grupo da Elarah. Usa o primeiro nome do usuário pra personalizar a
  // saudação. Sem telefone, mostra só o traço — sem botão.
  //
  // Cor do botão sinaliza se o admin já clicou:
  //   verde (#25D366) → whatsapp_contacted_at preenchido
  //   laranja (#f0a05e) → ainda não contatou — alvo prioritário
  function buildUserPhoneCell(u) {
    const tel = (u.telefone || '').trim();
    if (!tel) return '<span style="color:#bbb;">—</span>';
    const digits = tel.replace(/\D+/g, '').replace(/^55/, '');
    if (!digits) return escapeHtml(tel);
    const primeiroNome = String(u.nome || '').trim().split(/\s+/)[0] || 'tudo bem';
    const msg = 'Oii ' + primeiroNome + '! Você se cadastrou na Elarah e temos um grupo onde liberamos experiências antes de todo mundo (algumas esgotam só por lá). Entra aqui pra não perder: https://chat.whatsapp.com/LRqJa9F7zGWAIMlh2D2yjl';
    const href = 'https://wa.me/55' + digits + '?text=' + encodeURIComponent(msg);
    const contatado = !!u.whatsapp_contacted_at;
    const btnBg = contatado ? '#25D366' : '#f0a05e';
    const tooltipBotao = contatado
      ? 'Já convidado em ' + formatDate(u.whatsapp_contacted_at) + ' — clique pra reenviar'
      : 'AINDA NÃO contatado — clique pra convidar pro grupo';
    const userIdAttr = ' data-user-id="' + escapeHtml(u.id) + '"';
    const numero = '<a href="' + href + '" target="_blank" rel="noopener" class="admin__user-wa-trigger"' + userIdAttr +
      ' style="color:#1a8a4a;text-decoration:none;border-bottom:1px dotted #1a8a4a;">' + escapeHtml(tel) + '</a>';
    const botao = '<a href="' + href + '" target="_blank" rel="noopener" class="admin__user-wa-trigger admin__user-wa-btn"' + userIdAttr +
      ' title="' + escapeHtml(tooltipBotao) + '"' +
      ' style="display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:4px 10px;background:' + btnBg + ';color:#fff;border-radius:14px;font-size:12px;font-weight:600;text-decoration:none;line-height:1;vertical-align:middle;">' +
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
    const [bookingsRaw, profiles, allExperiences, fornecedoresMeta] = await Promise.all([
      getBookings(),
      getProfiles().catch(() => []),
      (window.ElarahData && ElarahData.getAllExperiences)
        ? ElarahData.getAllExperiences().catch(() => [])
        : Promise.resolve([]),
      getFornecedoresMetadata().catch(() => []),
    ]);
    // Filtra experiências de teste UMA VEZ aqui — cascata pra dropdown,
    // stats globais, gráficos (reservas por exp / conversão) e tabela.
    const bookings = withoutTestBookings(bookingsRaw);
    const expById = new Map();
    (allExperiences || []).forEach(e => {
      if (e && e.id) expById.set(e.id, e);
    });
    // Mapa: fornecedor_key → metadata (whatsapp, data_entrada, ...).
    // Centraliza o WhatsApp do fornecedor — antes ficava em
    // experiences.fornecedor_whatsapp (duplicado por experiência),
    // agora é 1 fonte da verdade vinculada por nome normalizado.
    const fornecedoresMetaByKey = new Map();
    (fornecedoresMeta || []).forEach(m => {
      if (m && m.fornecedor_key) fornecedoresMetaByKey.set(m.fornecedor_key, m);
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

    // ===== Normaliza fornecedor + valores financeiros com regra fixa =====
    // Regra única da Elarah: fornecedor 70% / comissão Elarah 30%.
    // Cada booking ganha campos "_resolvido" que aplicam o fallback
    // booking → experiência. Tudo abaixo (dropdown, filtro, tabela,
    // card de repasses pendentes) usa esses campos pra evitar
    // inconsistência entre o que aparece na tabela e o que filtra.
    bookings.forEach(b => {
      if (!b) return;
      const exp = expById.get(b.experiencia_id) || null;
      const qty = Math.max(1, Number(b.quantidade) || 1);

      // Nome do fornecedor: booking → experiência → '' (vazio).
      const fornecedorNome = (b.fornecedor_nome && b.fornecedor_nome.trim())
        || (exp && exp.fornecedorNome && String(exp.fornecedorNome).trim())
        || '';
      b._fornecedorResolvido = fornecedorNome;

      // Valor cheio: booking → experiência × qty → null.
      let valorCheio = b.valor_cheio_centavos != null ? Number(b.valor_cheio_centavos) : null;
      if (!valorCheio && exp && exp.valorCheioCentavos) {
        valorCheio = Number(exp.valorCheioCentavos) * qty;
      }
      b._valorCheioResolvido = valorCheio || null;

      // Base de cálculo: valor cheio (preferido) ou amount_total como fallback.
      const base = valorCheio || (b.amount_total != null ? Number(b.amount_total) : null);

      // Repasse 70% / Comissão 30% — regra fixa, sem percentual_repasse.
      let valorRepasse = b.valor_repasse_centavos != null ? Number(b.valor_repasse_centavos) : null;
      if (valorRepasse == null && base) valorRepasse = Math.round(base * 0.70);
      b._valorRepasseResolvido = valorRepasse;

      let valorComissao = b.valor_comissao_centavos != null ? Number(b.valor_comissao_centavos) : null;
      if (valorComissao == null && base) valorComissao = Math.round(base * 0.30);
      b._valorComissaoResolvido = valorComissao;

      // ===== WhatsApp do fornecedor =====
      // Centralizado em fornecedores_metadata.whatsapp, vinculado por
      // nome normalizado (fornecedor_key). Cadastrado uma única vez
      // no painel "Fornecedores" e reutilizado por todas as compras
      // do mesmo fornecedor. Sem fallback — se não cadastrado, o
      // botão "Avisar" mostra "— sem WhatsApp" e linka pro painel.
      let fornecedorWhatsapp = '';
      if (fornecedorNome) {
        const meta = fornecedoresMetaByKey.get(
          String(fornecedorNome).trim().toLowerCase().replace(/\s+/g, ' ')
        );
        if (meta && meta.whatsapp) fornecedorWhatsapp = String(meta.whatsapp).trim();
      }
      b._fornecedorWhatsappResolvido = fornecedorWhatsapp;

      // ===== Timestamp do evento + horas até o evento =====
      // Pra colorir o badge "Prazo" da linha. Lógica espelha a usada
      // pelo isPubliclyVisible em experiences-data.js: usa exp.eventAt
      // (se preenchido) OU deriva de exp.data + exp.horario.
      let eventTs = null;
      if (exp) {
        if (exp.eventAt) {
          const t = new Date(exp.eventAt).getTime();
          if (!isNaN(t)) eventTs = t;
        }
        if (eventTs == null && window.ElarahData && window.ElarahData.deriveEventTimestamp) {
          eventTs = window.ElarahData.deriveEventTimestamp(
            exp.data,
            exp.horario || (Array.isArray(exp.horarios) ? exp.horarios[0] : null),
            Date.now(),
          );
        }
      }
      // Fallback: se a experiência não dá pra resolver, tenta com os
      // campos do próprio booking (caso seja um booking legado e a
      // experiência tenha sido editada/removida).
      if (eventTs == null && window.ElarahData && window.ElarahData.deriveEventTimestamp) {
        eventTs = window.ElarahData.deriveEventTimestamp(
          b.data,
          b.horario,
          Date.now(),
        );
      }
      b._eventTsResolvido = eventTs;
      b._horasParaEventoResolvido = eventTs != null
        ? (eventTs - Date.now()) / (60 * 60 * 1000)
        : null;
    });

    // Popula filtro de fornecedores
    const filterFornEl = document.getElementById('bookings-filter-fornecedor');
    if (filterFornEl && filterFornEl.options.length <= 1) {
      const seenForn = new Set();
      bookings.forEach(b => {
        var fn = b._fornecedorResolvido || '';
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
      if (filterForn && (b._fornecedorResolvido || '') !== filterForn) return false;
      if (filterSf && (b.status_fornecedor || 'repasse_pendente') !== filterSf) return false;
      return true;
    });

    // Stats sobre TODAS as bookings (não filtradas).
    const paid = bookings.filter(b => b.status === 'pago');
    const pending = bookings.filter(b => b.status === 'pending');
    const revenueCents = paid.reduce((sum, b) => sum + (b.amount_total || 0), 0);

    document.getElementById('stat-bookings-paid').textContent = paid.length;
    document.getElementById('stat-bookings-pending').textContent = pending.length;
    document.getElementById('stat-bookings-revenue').textContent = formatCents(revenueCents, 'BRL');

    // ===== Card "Repasses pendentes por fornecedor" =====
    // Lista compras pagas com status_fornecedor='repasse_pendente',
    // agrupadas por fornecedor. Não respeita os filtros da tabela —
    // sempre mostra TODAS as pendências como visão executiva.
    renderRepassesPendentesCard(bookings);

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

    // ===== Helpers de Prazo (48h) e WhatsApp do fornecedor =====
    // Prazo: badge colorido baseado em horas até o evento.
    //   verde = > 48h    (ainda não precisa repassar)
    //   vermelho = <= 48h (precisa repassar)
    //   cinza   = sem data resolvível (ex: "Semanal") ou já passou
    function renderPrazoCell(b) {
      if (b.status !== 'pago') return '<td></td>';
      // Repasse já realizado: contagem regressiva não se aplica mais.
      // Mostra apenas um marcador sutil pra não poluir visualmente
      // nem disparar alarme falso de "vermelho".
      if (b.status_fornecedor === 'repasse_feito') {
        return '<td><span style="font-size:.72rem;color:#bbb;" title="Repasse já realizado — prazo não se aplica">—</span></td>';
      }
      const horas = b._horasParaEventoResolvido;
      if (horas == null) {
        return '<td><span style="font-size:.72rem;color:#888;" title="Sem data fixa pra calcular o prazo">—</span></td>';
      }
      if (horas < 0) {
        return '<td><span style="display:inline-block;padding:3px 8px;border-radius:8px;background:#eee;color:#555;font-size:.72rem;font-weight:600;" title="Evento já aconteceu">Passou</span></td>';
      }
      if (horas <= 48) {
        const horasInt = Math.max(0, Math.round(horas));
        return '<td><span style="display:inline-block;padding:3px 8px;border-radius:8px;background:#fce8e6;color:#c0392b;font-size:.72rem;font-weight:700;" title="Faltam ' + horas.toFixed(1) + 'h pro evento — janela de repasse aberta">⚠ ' + horasInt + 'h</span></td>';
      }
      const dias = Math.floor(horas / 24);
      const label = dias > 0
        ? dias + (dias === 1 ? ' dia' : ' dias')
        : Math.round(horas) + 'h';
      return '<td><span style="display:inline-block;padding:3px 8px;border-radius:8px;background:#e6f4ea;color:#1a8a4a;font-size:.72rem;font-weight:600;" title="Mais de 48h pro evento — repasse ainda não é prioridade">' + label + '</span></td>';
    }

    // Coleta nomes (comprador + acompanhantes) deduped pra mensagem
    // do WhatsApp. Espelha a lógica de dedup de renderAcompanhantes.
    function collectParticipantNames(b, nomeResolved, telefone) {
      const norm = function (s) {
        return String(s || '').normalize('NFKC')
          .replace(/[​-‍﻿ ]/g, ' ')
          .toLowerCase().replace(/\s+/g, ' ').trim();
      };
      const onlyDigits = function (s) { return String(s || '').replace(/\D+/g, ''); };
      const out = [];
      const seen = new Set();
      const compNome = (nomeResolved || '').trim();
      const compTel = onlyDigits(telefone);
      if (compNome) {
        out.push(compNome);
        seen.add(norm(compNome) + '|' + compTel);
      }
      if (b && b.metadata && Array.isArray(b.metadata.participantes)) {
        b.metadata.participantes.forEach(function (p) {
          if (!p) return;
          const pNome = String(p.nome || '').trim();
          const pTel = onlyDigits(p.telefone || p.telefone_digits || '');
          if (!pNome && !pTel) return;
          // Pula o próprio comprador.
          const nomeIgual = norm(pNome) && norm(pNome) === norm(compNome);
          const telIgual = compTel && pTel && pTel === compTel;
          if (nomeIgual && telIgual) return;
          if (nomeIgual && !pTel) return;
          if (telIgual && !pNome) return;
          // Dedup geral.
          const key = norm(pNome) + '|' + pTel;
          if (seen.has(key)) return;
          seen.add(key);
          if (pNome) out.push(pNome);
        });
      }
      return out;
    }

    function joinNames(names) {
      if (!names || !names.length) return '';
      if (names.length === 1) return names[0];
      if (names.length === 2) return names[0] + ' e ' + names[1];
      return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1];
    }

    function buildSupplierWhatsappLink(b, nomeResolved, telefone) {
      const wa = b._fornecedorWhatsappResolvido || '';
      const digits = wa.replace(/\D+/g, '');
      if (!digits) return null;
      // Brasil: prepend 55 se não tem código do país.
      const waDigits = digits.length >= 12 ? digits : ('55' + digits.replace(/^55/, ''));
      const nomes = collectParticipantNames(b, nomeResolved, telefone);
      const expNome = b.experiencia_nome || '(experiência)';
      const data = b.data || '(data)';
      const horario = b.horario || '(horário)';
      const plural = nomes.length > 1;
      const aluno = plural ? 'aluno(s) confirmado(s)' : 'aluno confirmado';
      const lista = joinNames(nomes) || '(participante)';
      const msg = 'Oi! Tudo bem? Passando para te avisar que você tem ' + aluno +
        ' para a experiência *' + expNome + '* no dia *' + data +
        '* às *' + horario + '*: *' + lista + '*.\n\n' +
        'O repasse será feito até 48h antes do evento.';
      return 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent(msg);
    }

    function renderWhatsappCell(b, nomeResolved, telefone) {
      if (b.status !== 'pago') return '<td></td>';
      const link = buildSupplierWhatsappLink(b, nomeResolved, telefone);
      if (!link) {
        return '<td><span style="font-size:.7rem;color:#bbb;" title="Cadastre o WhatsApp do fornecedor na experiência">— sem WhatsApp</span></td>';
      }
      return '<td><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" ' +
        'style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;background:#25d366;color:#fff;border-radius:6px;font-size:.74rem;font-weight:600;text-decoration:none;white-space:nowrap;" ' +
        'title="Abre o WhatsApp do fornecedor com mensagem pronta">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
        'Avisar</a></td>';
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
      // Os campos _Resolvido vêm do bloco de normalização no início
      // de renderBookings (regra fixa 70/30 com fallback booking →
      // experiência). Usar os mesmos campos no display garante que
      // o que aparece na tabela é exatamente o que o filtro vê.
      const fornecedorDisplay = b._fornecedorResolvido || '';
      const valorCheio = b._valorCheioResolvido;
      const valorRepasse = b._valorRepasseResolvido;
      const valorComissao = b._valorComissaoResolvido;

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

      // Variante escolhida pelo cliente (ex.: Pintura → Lagosta).
      // Aparece como sub-linha discreta abaixo do nome da experiência
      // pra o admin saber o que preparar sem entrar em cada booking.
      const variantLabel = b.metadata && b.metadata.variant_label;
      const variantSelected = b.metadata && b.metadata.variant_selected;
      const variantCell = (variantLabel && variantSelected)
        ? '<br><span style="font-size:.75rem;color:#a07c4c;font-weight:600;">' +
            escapeHtml(variantLabel) + ': ' + escapeHtml(variantSelected) +
          '</span>'
        : '';

      return `
        <tr>
          <td>${escapeHtml(when)}</td>
          <td>${escapeHtml(nomeResolved || '—')}${renderAcompanhantes()}</td>
          <td>${escapeHtml(b.email || '—')}</td>
          <td>${telefoneCell}</td>
          <td>${escapeHtml(b.experiencia_nome || '—')}${variantCell}</td>
          <td>${escapeHtml(b.data || '—')}</td>
          <td>${escapeHtml(b.horario || '—')}</td>
          <td>${b.quantidade && b.quantidade > 1 ? '<span style="font-weight:600;color:var(--orange,#f0a05e);">' + b.quantidade + '</span>' : '1'}</td>
          <td>${escapeHtml(formatCents(b.amount_total, b.currency))}${mismatchBadge(b)}</td>
          <td style="font-size:.82rem;">${b.status === 'pago' ? escapeHtml(fornecedorDisplay || '—') : ''}</td>
          <td>${b.status === 'pago' && valorCheio ? escapeHtml(formatCents(valorCheio, b.currency)) : (b.status === 'pago' ? '—' : '')}</td>
          <td>${b.status === 'pago' && valorRepasse ? escapeHtml(formatCents(valorRepasse, b.currency)) : (b.status === 'pago' ? '—' : '')}</td>
          <td>${b.status === 'pago' && valorComissao ? escapeHtml(formatCents(valorComissao, b.currency)) : (b.status === 'pago' ? '—' : '')}</td>
          <td>${bookingStatusBadge(b.status)}</td>
          ${renderPrazoCell(b)}
          <td>${b.status === 'pago' ? '<select class="admin__sf-select" data-booking-id="' + escapeHtml(b.id) + '" style="padding:4px 8px;border:1px solid #ddd;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;' + ((b.status_fornecedor === 'repasse_feito') ? 'background:#e6f4ea;color:#1a8a4a;' : 'background:#fff8ef;color:#b07b00;') + '"><option value="repasse_pendente"' + ((b.status_fornecedor || 'repasse_pendente') === 'repasse_pendente' ? ' selected' : '') + '>Repasse pendente</option><option value="repasse_feito"' + (b.status_fornecedor === 'repasse_feito' ? ' selected' : '') + '>Repasse feito</option></select>' : ''}</td>
          ${renderWhatsappCell(b, nomeResolved, telefone)}
        </tr>
      `;
    }

    // Cabeçalho de grupo — divisor visual entre seções (pendentes,
    // pagos, outros). Usa colspan=9 pra ocupar todas as colunas e um
    // estilo inline suave pra não depender de mudanças no CSS.
    function renderGroupHeader(label, count) {
      return `
        <tr class="admin__table-group-header">
          <td colspan="17" style="background:#faf6f0;color:#1a1a1a;font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.05em;padding:12px 14px;border-top:2px solid #f0a05e;">
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
      : '<tr><td colspan="17" class="admin__table-empty">Nenhuma compra paga encontrada.</td></tr>';

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
              // Re-renderiza pra que a célula Prazo (que agora respeita
              // status_fornecedor) e o card de repasses pendentes
              // atualizem na hora.
              renderBookings();
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
      // Atualiza o preview de imagem (se já wireado).
      if (typeof window._refreshImagePreview === 'function') {
        try { window._refreshImagePreview(); } catch (e) {}
      }

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

      // Fornecedor fields. WhatsApp do fornecedor é centralizado no
      // painel "Fornecedores" (fornecedores_metadata.whatsapp), não
      // por experiência — evita duplicação.
      var fnEl = document.getElementById('exp-fornecedor-nome');
      var vcEl = document.getElementById('exp-valor-cheio');
      var prEl = document.getElementById('exp-percentual-repasse');
      if (fnEl) fnEl.value = exp.fornecedorNome || '';
      if (window._expFornecedorCombobox) {
        window._expFornecedorCombobox.setValue(exp.fornecedorNome || '');
        window._expFornecedorCombobox.refresh();
      }
      if (vcEl) vcEl.value = exp.valorCheioCentavos != null ? 'R$' + (exp.valorCheioCentavos / 100).toFixed(0) : '';
      if (prEl) prEl.value = exp.percentualRepasse != null ? exp.percentualRepasse : 70;

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
      // form.reset() não dispara 'input', então atualiza o preview manual.
      if (typeof window._refreshImagePreview === 'function') {
        try { window._refreshImagePreview(); } catch (e) {}
      }
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
      if (window._expFornecedorCombobox) {
        window._expFornecedorCombobox.setValue('');
        window._expFornecedorCombobox.refresh();
      }
      if (vcEl2) vcEl2.value = '';
      if (prEl2) prEl2.value = 70;
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

    // ===== Preview da imagem =====
    // Mostra a imagem (ou erro) ao lado do input quando o admin
    // digita ou cola URL. Pega problemas ANTES de salvar — caso
    // típico: link de Drive/Insta/site que não é imagem direta,
    // path com typo, hotlink protection, 404. Sem isso, o admin
    // só descobre que está quebrado quando vê o card no site.
    var imagemEl = document.getElementById('exp-imagem');
    var previewWrap = document.getElementById('exp-imagem-preview-wrap');
    var previewImg = document.getElementById('exp-imagem-preview');
    var previewStatus = document.getElementById('exp-imagem-preview-status');
    function setPreviewStatus(ok, msg) {
      if (!previewStatus) return;
      previewStatus.style.color = ok ? '#1a8a4a' : '#c0392b';
      previewStatus.textContent = msg;
    }
    function refreshImagePreview() {
      if (!imagemEl || !previewWrap || !previewImg) return;
      var raw = (imagemEl.value || '').trim();
      if (!raw) {
        previewWrap.style.display = 'none';
        return;
      }
      previewWrap.style.display = 'block';
      // Normaliza igual ao front: URL absoluta ou path relativo a assets/.
      var src = /^(https?:\/\/|\/|assets\/|images\/|img\/)/i.test(raw)
        ? raw
        : 'assets/' + raw;
      setPreviewStatus(true, 'Carregando…');
      previewImg.onload = function () {
        setPreviewStatus(true, '✓ Imagem carregou. Esta é a foto que vai aparecer no card.');
      };
      previewImg.onerror = function () {
        setPreviewStatus(
          false,
          '⚠ Não consegui carregar essa imagem. Verifique se a URL é direta (.jpg/.png), pública e sem hotlink protection. ' +
          'Links de Drive/Insta/sites de compartilhamento geralmente não funcionam — use uma URL terminando em .jpg ou .png.'
        );
      };
      previewImg.src = src;
    }
    if (imagemEl) {
      imagemEl.addEventListener('input', refreshImagePreview);
      imagemEl.addEventListener('blur', refreshImagePreview);
    }
    // Expõe pra que openExpModal chame depois de preencher o input.
    window._refreshImagePreview = refreshImagePreview;

    // Combobox de fornecedor: substitui o input livre por um dropdown
    // com busca + opção "adicionar novo". Mantém o <input type=hidden
    // id="exp-fornecedor-nome"> pra preservar a leitura via getElementById
    // no submit. Criado uma vez aqui; refresh é chamado em openExpModal.
    var fornHost = document.getElementById('exp-fornecedor-combobox');
    var fornHidden = document.getElementById('exp-fornecedor-nome');
    if (fornHost && fornHidden) {
      window._expFornecedorCombobox = createSupplierCombobox(fornHost, {
        hiddenInput: fornHidden,
        placeholder: 'Selecione ou digite o fornecedor…'
      });
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

  // ===== Filtros do painel Experiências =====
  // Dois filtros independentes que combinam em AND:
  //   - activeExpFilter         → pílulas de categoria (Cerâmica, Vela…)
  //   - activeExpFornecedorFilter → select de fornecedor no header
  // Ambos persistem entre re-renders dentro da mesma sessão.
  let activeExpFilter = '';
  let activeExpFornecedorFilter = '';

  // Popula o <select id="exp-filter-fornecedor"> com os nomes únicos
  // que aparecem em qualquer experiência. Compara case-insensitive
  // pra não duplicar (ex: "accademia gastronomica" vs "Accademia
  // Gastronomica") — preserva a versão com capitalização original.
  function buildExpFornecedorFilter(experiences) {
    const sel = document.getElementById('exp-filter-fornecedor');
    if (!sel) return;
    const seen = new Map();
    (experiences || []).forEach(function (e) {
      const nome = e && e.fornecedorNome ? String(e.fornecedorNome).trim() : '';
      if (!nome) return;
      const key = nome.toLowerCase();
      if (!seen.has(key)) seen.set(key, nome);
    });
    const nomes = Array.from(seen.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    // Preserva o valor atual (e o "Todos") sem destruir o estado se
    // o admin já tinha selecionado algo. Re-cria o conjunto de
    // <option> a cada render porque a lista de fornecedores muda
    // conforme o admin cadastra/edita experiências.
    const current = activeExpFornecedorFilter || '';
    sel.innerHTML = '<option value="">Todos os fornecedores</option>' +
      nomes.map(function (n) {
        const selected = n.toLowerCase() === current.toLowerCase() ? ' selected' : '';
        const safe = String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        return '<option value="' + safe + '"' + selected + '>' + safe + '</option>';
      }).join('');

    if (!sel._wired) {
      sel._wired = true;
      sel.addEventListener('change', function () {
        activeExpFornecedorFilter = sel.value || '';
        renderExperiences();
      });
    }

    // Wire do botão Atualizar (idempotente).
    const btn = document.getElementById('btn-refresh-experiences');
    if (btn && !btn._wired) {
      btn._wired = true;
      btn.addEventListener('click', function () { renderExperiences(); });
    }
  }

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
    const allExperiencesRaw = await getExperiences();

    // Esconde Elarah Originals da aba Experiências — eles são geridos
    // exclusivamente pela aba "By Elarah" (toggle "É comprável" no
    // form de By Elarah cria/atualiza essas experiences automaticamente).
    // Sem isso, o admin veria o mesmo card em duas abas e poderia
    // editar via Experiências, dessincronizando do byelarah_item.
    const allExperiences = (allExperiencesRaw || []).filter(function (e) {
      return e && e.isElarahOriginal !== true;
    });

    // Constrói barra de filtro com TODAS as experiências (antes de filtrar)
    buildExpFilterBar(allExperiences);
    buildExpFornecedorFilter(allExperiences);

    // Aplica filtros em AND: categoria (pílulas) + fornecedor (select).
    // Pílulas e select são independentes — admin pode usar qualquer
    // combinação ou nenhum.
    const experiences = (allExperiences || []).filter(function (e) {
      if (!e) return false;
      if (activeExpFilter) {
        if (!e.categoria || e.categoria.toLowerCase() !== activeExpFilter.toLowerCase()) return false;
      }
      if (activeExpFornecedorFilter) {
        const nome = (e.fornecedorNome || '').toLowerCase();
        if (nome !== activeExpFornecedorFilter.toLowerCase()) return false;
      }
      return true;
    });
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

  // Adiciona uma linha de horário no form. slotObj é opcional e
  // permite carregar valores existentes:
  //   { id?, horario, vagasTotal, vagasRestantes }
  // O input de vagas só aparece (visualmente útil) quando
  // "É comprável" está ligado — pra cards de espera, vagas não fazem
  // sentido. Mas o input fica sempre no DOM pra não complicar a UX
  // de toggle (esconder/mostrar campos por linha causa flicker).
  function byAddHorarioRow(slotObj) {
    if (!byHorariosList) return;
    var s = (slotObj && typeof slotObj === 'object' && !Array.isArray(slotObj)) ? slotObj : {};
    // Aceita também passar só uma string (legado: byRenderHorarios([''])).
    if (typeof slotObj === 'string') s = { horario: slotObj };

    var row = document.createElement('div');
    row.className = 'admin__horario-row';
    row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px;';
    row.innerHTML =
      '<input type="text" class="admin__horario-input" placeholder="Ex: 10h às 13h" style="flex:2;">' +
      '<input type="number" class="admin__horario-vagas" min="0" step="1" placeholder="Vagas" title="Vagas totais deste horário (vazio = ilimitado)" style="flex:0 0 80px;text-align:center;">' +
      '<span class="admin__horario-restantes" style="flex:0 0 60px;font-size:.8rem;color:#888;text-align:center;" title="Vagas restantes"></span>' +
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
      var rows = byHorariosList.querySelectorAll('.admin__horario-row');
      if (rows.length > 1) row.remove();
      else {
        row.querySelector('.admin__horario-input').value = '';
        row.querySelector('.admin__horario-vagas').value = '';
        restEl.textContent = '∞';
        restEl.style.color = '#888';
        delete row.dataset.slotId;
      }
      // Recalcula modo vagas (se admin removeu o último horário,
      // libera o input "Vagas totais" pra controle global).
      byUpdateVagasTotaisMode();
    });
    // Listeners pra recalcular soma das vagas em tempo real
    // conforme admin edita horário ou número de vagas.
    var horInput = row.querySelector('.admin__horario-input');
    var vagInput = row.querySelector('.admin__horario-vagas');
    if (horInput) horInput.addEventListener('input', byUpdateVagasTotaisMode);
    if (vagInput) vagInput.addEventListener('input', byUpdateVagasTotaisMode);

    byHorariosList.appendChild(row);
  }

  function byRenderHorarios(slots) {
    if (!byHorariosList) return;
    byHorariosList.innerHTML = '';
    var initial = Array.isArray(slots) && slots.length ? slots : [{ horario: '' }];
    initial.forEach(function (s) { byAddHorarioRow(s); });
    // Atualiza o modo "vagas totais vs por horário" depois de
    // renderizar os slots — necessário tanto na abertura do modal
    // quanto em re-renders.
    byUpdateVagasTotaisMode();
  }

  // Lista flat dos horários (strings) — usado pra salvar no
  // byelarah_items.horarios (campo array text[]).
  function byCollectHorarios() {
    if (!byHorariosList) return [];
    var inputs = byHorariosList.querySelectorAll('.admin__horario-input');
    return Array.from(inputs).map(function (i) { return i.value.trim(); }).filter(Boolean);
  }

  // Lista de slots {horario, vagasTotal, id} — usado quando
  // "É comprável" está ligado pra criar/atualizar experience_slots.
  function byCollectSlots() {
    if (!byHorariosList) return [];
    var rows = byHorariosList.querySelectorAll('.admin__horario-row');
    var out = [];
    rows.forEach(function (row) {
      var h = row.querySelector('.admin__horario-input').value.trim();
      if (!h) return;
      var vRaw = row.querySelector('.admin__horario-vagas').value.trim();
      out.push({
        id: row.dataset.slotId || null,
        horario: h,
        vagasTotal: vRaw === '' ? null : Number(vRaw),
        data: null,
        eventAt: null
      });
    });
    return out;
  }

  // Atualiza visibilidade da seção "comprável" baseado no toggle.
  function byUpdatePurchasableVisibility() {
    var section = document.getElementById('by-purchasable-section');
    var checkbox = document.getElementById('by-is-purchasable');
    if (!section || !checkbox) return;
    section.style.display = checkbox.checked ? 'block' : 'none';
  }

  // ============================================================
  // FONTE ÚNICA DE VERDADE PRA VAGAS — slot OR global
  // ------------------------------------------------------------
  // Quando há horários cadastrados:
  //   - Cada horário tem suas próprias vagas (input ao lado).
  //   - O campo global "Vagas totais" é DESABILITADO e exibe a
  //     soma das vagas dos horários (auto-calculado).
  //   - Se algum horário é ilimitado (vazio) → soma vira ∞ também.
  //   - Indicador "Modo: vagas por horário" verde no topo.
  //
  // Quando NÃO há horários:
  //   - Campo "Vagas totais" habilitado normalmente.
  //   - Indicador "Modo: limite global" cinza.
  //
  // Garantia anti-duplicação: o checkout já usa IF/ELSE entre
  // slot e experience-level (auditado em create-checkout-session
  // + booking_guard.ts). Aqui só impedimos que o admin grave
  // valores conflitantes nos dois lugares.
  // ============================================================
  function byUpdateVagasTotaisMode() {
    var vagasInput = document.getElementById('by-vagas-total');
    var modoEl = document.getElementById('by-vagas-modo');
    var hintEl = document.getElementById('by-vagas-hint');
    if (!vagasInput) return;

    // Coleta os horários cadastrados (não-vazios).
    var horarios = byCollectHorarios();
    var temHorarios = horarios.length > 0;

    if (temHorarios) {
      // Modo: vagas por horário. Calcula soma das vagas dos slots.
      var slots = byCollectSlots();
      var temIlimitado = false;
      var soma = 0;
      slots.forEach(function (s) {
        if (s.vagasTotal == null) {
          // Horário ilimitado — total geral também vira ilimitado.
          temIlimitado = true;
        } else {
          soma += Number(s.vagasTotal) || 0;
        }
      });

      vagasInput.disabled = true;
      vagasInput.style.background = '#f4f4f4';
      vagasInput.style.color = '#888';
      vagasInput.style.cursor = 'not-allowed';
      vagasInput.value = temIlimitado ? '' : String(soma);
      vagasInput.placeholder = temIlimitado ? '∞ ilimitado' : 'auto';

      if (modoEl) {
        modoEl.style.display = 'inline-block';
        modoEl.style.background = '#e6f4ea';
        modoEl.style.color = '#1a8a4a';
        modoEl.textContent = '✓ Modo: vagas por horário';
      }
      if (hintEl) {
        hintEl.innerHTML =
          '🔒 Vagas controladas pelos horários abaixo. ' +
          'Total auto-calculado: <strong>' +
          (temIlimitado
            ? '∞ ilimitado (algum horário sem limite)'
            : soma + ' vaga(s)') +
          '</strong>';
        hintEl.style.color = '#1a8a4a';
      }
    } else {
      vagasInput.disabled = false;
      vagasInput.style.background = '';
      vagasInput.style.color = '';
      vagasInput.style.cursor = '';
      vagasInput.placeholder = 'Em branco = sem limite';
      if (modoEl) {
        modoEl.style.display = 'inline-block';
        modoEl.style.background = '#f4f4f4';
        modoEl.style.color = '#666';
        modoEl.textContent = 'Modo: limite global';
      }
      if (hintEl) {
        hintEl.textContent = 'Adicione um horário pra controle individual, ou use este campo como limite global da experiência.';
        hintEl.style.color = '#888';
      }
    }
  }

  // ============================================================
  // SUPPLIERS UI (múltiplos fornecedores por experiência)
  // Adiciona/edita/remove linhas dinâmicas + resumo live calculado
  // a cada keystroke. Não bloqueia salvamento se a soma não bater
  // 100% — só mostra badge amarelo (admin pode estar em edição).
  // ============================================================
  function bySuppliersListEl() { return document.getElementById('by-suppliers-list'); }

  // Adiciona uma linha de fornecedor. Recebe objeto opcional com
  // valores pré-preenchidos (vindo do banco em edição).
  function byAddSupplierRow(supplier) {
    var list = bySuppliersListEl();
    if (!list) return;
    var s = supplier || {};
    var row = document.createElement('div');
    row.className = 'admin__supplier-row';
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#fafaf6;border:1px solid #ece4d6;border-radius:8px;padding:8px;';
    row.innerHTML =
      '<div class="by-supplier-nome-host" style="flex:1;min-width:140px;"></div>' +
      '<input type="hidden" class="by-supplier-nome">' +
      '<select class="by-supplier-type" ' +
        'style="flex:0 0 100px;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:.88rem;background:#fff;">' +
        '<option value="percent">%</option>' +
        '<option value="fixed">R$ fixo</option>' +
      '</select>' +
      '<input type="number" class="by-supplier-value" step="0.01" min="0" placeholder="60" ' +
        'style="flex:0 0 90px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:.88rem;text-align:center;">' +
      '<input type="text" class="by-supplier-notas" placeholder="Notas (opcional)" ' +
        'style="flex:1.2;min-width:140px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:.82rem;color:#666;">' +
      '<button type="button" class="by-supplier-remove" aria-label="Remover" ' +
        'style="flex:0 0 28px;background:none;border:none;font-size:1.2rem;color:#999;cursor:pointer;">&times;</button>';

    var nomeHost = row.querySelector('.by-supplier-nome-host');
    var nomeHidden = row.querySelector('.by-supplier-nome');
    var typeEl = row.querySelector('.by-supplier-type');
    var valEl = row.querySelector('.by-supplier-value');
    var notasEl = row.querySelector('.by-supplier-notas');

    var combo = createSupplierCombobox(nomeHost, {
      hiddenInput: nomeHidden,
      compact: true,
      placeholder: 'Nome do fornecedor',
      onChange: function () { bySuppliersUpdateResumo(); }
    });
    if (s.fornecedorNome) combo.setValue(s.fornecedorNome);
    typeEl.value = s.shareType === 'fixed' ? 'fixed' : 'percent';
    // Pra share_type='fixed', share_value vem em centavos do banco mas
    // exibimos como R$ inteiros pro admin (ex: 12500 → 125).
    if (s.shareType === 'fixed' && s.shareValue != null) {
      valEl.value = (Number(s.shareValue) / 100).toFixed(2);
    } else if (s.shareValue != null) {
      valEl.value = s.shareValue;
    }
    notasEl.value = s.notas || '';
    if (s.id) row.dataset.supplierId = s.id;

    row.querySelector('.by-supplier-remove').addEventListener('click', function () {
      row.remove();
      bySuppliersUpdateResumo();
    });

    [typeEl, valEl, notasEl].forEach(function (el) {
      el.addEventListener('input', bySuppliersUpdateResumo);
      el.addEventListener('change', bySuppliersUpdateResumo);
    });

    list.appendChild(row);
  }

  function byRenderSuppliers(suppliers) {
    var list = bySuppliersListEl();
    if (!list) return;
    list.innerHTML = '';
    var arr = Array.isArray(suppliers) && suppliers.length ? suppliers : [];
    if (arr.length) {
      arr.forEach(function (s) { byAddSupplierRow(s); });
    } else {
      // Vazio: oferece 1 linha em branco pro admin começar.
      byAddSupplierRow();
    }
    bySuppliersUpdateResumo();
  }

  // Coleta os fornecedores do form. Converte share_value pra
  // formato do banco: 'percent' fica em %, 'fixed' converte
  // de R$ inteiros pra centavos (×100).
  function byCollectSuppliers() {
    var list = bySuppliersListEl();
    if (!list) return [];
    var rows = list.querySelectorAll('.admin__supplier-row');
    var out = [];
    rows.forEach(function (row, idx) {
      var nome = row.querySelector('.by-supplier-nome').value.trim();
      if (!nome) return;
      var shareType = row.querySelector('.by-supplier-type').value === 'fixed' ? 'fixed' : 'percent';
      var rawVal = (row.querySelector('.by-supplier-value').value || '').trim();
      var v = Number(rawVal);
      if (!Number.isFinite(v) || v < 0) v = 0;
      // 'fixed' do form vem em R$ inteiros — converte pra centavos.
      var shareValue = shareType === 'fixed' ? Math.round(v * 100) : v;
      out.push({
        id: row.dataset.supplierId || null,
        fornecedorNome: nome,
        shareType: shareType,
        shareValue: shareValue,
        ordem: idx,
        notas: row.querySelector('.by-supplier-notas').value.trim() || null
      });
    });
    return out;
  }

  // Atualiza o resumo live. Mostra cada fornecedor + comissão Elarah
  // + soma + badge (verde se bate valor cheio, amarelo se diverge).
  function bySuppliersUpdateResumo() {
    var resumoEl = document.getElementById('by-suppliers-resumo');
    if (!resumoEl) return;
    var $ = function (id) { return document.getElementById(id); };

    // Valor cheio: vem do input "by-valor-cheio" (já está no form).
    var vcRaw = ($('by-valor-cheio')?.value || '').trim();
    var valorCheioCentavos = 0;
    if (vcRaw) {
      var cleaned = vcRaw.replace(/[R$\s]/gi, '').replace(',', '.');
      var n = cleaned.includes('.') ? Math.round(Number(cleaned) * 100) : Number(cleaned) * 100;
      if (Number.isFinite(n) && n > 0) valorCheioCentavos = n;
    }

    var suppliers = byCollectSuppliers();
    var totalRepasse = 0;
    var rows = suppliers.map(function (s) {
      var v;
      if (s.shareType === 'fixed') {
        v = s.shareValue; // já em centavos
      } else {
        v = Math.round(valorCheioCentavos * (s.shareValue / 100));
      }
      totalRepasse += v;
      var label = s.shareType === 'fixed'
        ? 'R$ ' + (s.shareValue / 100).toFixed(2)
        : (s.shareValue + '%');
      return {
        nome: s.fornecedorNome,
        label: label,
        valor: v
      };
    });

    // Comissão Elarah
    var cType = ($('by-comissao-type')?.value || '').trim();
    var cValRaw = ($('by-comissao-value')?.value || '').trim();
    var comissaoCentavos = 0;
    var comissaoLabel = 'Resíduo automático';
    if (cType === 'percent' && cValRaw) {
      var cv = Number(cValRaw);
      if (Number.isFinite(cv)) {
        comissaoCentavos = Math.round(valorCheioCentavos * (cv / 100));
        comissaoLabel = cv + '%';
      }
    } else if (cType === 'fixed' && cValRaw) {
      var cv2 = Number(cValRaw);
      if (Number.isFinite(cv2)) {
        comissaoCentavos = Math.round(cv2 * 100);
        comissaoLabel = 'R$ ' + cv2.toFixed(2) + ' fixo';
      }
    } else {
      // Residual: o que sobra do valor cheio depois dos fornecedores
      comissaoCentavos = Math.max(0, valorCheioCentavos - totalRepasse);
    }

    var soma = totalRepasse + comissaoCentavos;
    var diff = valorCheioCentavos - soma;

    function brl(c) {
      return 'R$ ' + (c / 100).toFixed(2).replace('.', ',');
    }

    var html = '';
    if (valorCheioCentavos > 0) {
      html += '<div style="display:flex;justify-content:space-between;color:#666;">' +
        '<span>Valor cheio</span><strong style="color:#1a1a1a;">' + brl(valorCheioCentavos) + '</strong></div>';
    } else {
      html += '<div style="color:#a07c4c;font-style:italic;">Preencha "Valor cheio" pra ver o detalhamento em R$.</div>';
    }
    rows.forEach(function (r) {
      html += '<div style="display:flex;justify-content:space-between;color:#444;">' +
        '<span>' + escapeHtml(r.nome || '?') + ' <span style="color:#888;font-size:.82rem;">(' + r.label + ')</span></span>' +
        '<span>' + brl(r.valor) + '</span></div>';
    });
    html += '<div style="display:flex;justify-content:space-between;color:#444;border-top:1px dashed #eee;margin-top:6px;padding-top:6px;">' +
      '<span>Comissão Elarah <span style="color:#888;font-size:.82rem;">(' + comissaoLabel + ')</span></span>' +
      '<span>' + brl(comissaoCentavos) + '</span></div>';
    html += '<div style="display:flex;justify-content:space-between;color:#1a1a1a;font-weight:700;border-top:1px solid #eee;margin-top:6px;padding-top:6px;">' +
      '<span>Soma</span><span>' + brl(soma) + '</span></div>';

    if (valorCheioCentavos > 0) {
      var badgeBg, badgeColor, badgeText;
      if (diff === 0) {
        badgeBg = '#e6f4ea'; badgeColor = '#1a8a4a';
        badgeText = '✓ Bate exatamente com o valor cheio';
      } else if (diff > 0) {
        badgeBg = '#fff8ee'; badgeColor = '#a07c4c';
        badgeText = '⚠ Sobra ' + brl(diff) + ' (vira desconto cliente ou margem extra Elarah)';
      } else {
        badgeBg = '#fce8e6'; badgeColor = '#c0392b';
        badgeText = '⚠ Excede o valor cheio em ' + brl(-diff) + ' — revisar divisão';
      }
      html += '<div style="margin-top:8px;padding:8px 10px;background:' + badgeBg + ';color:' + badgeColor +
        ';border-radius:6px;font-size:.82rem;font-weight:600;">' + badgeText + '</div>';
    }

    resumoEl.innerHTML = html;
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

      // Carrega flags + dados de checkout se há experience vinculada.
      var purchEl = $('by-is-purchasable');
      if (purchEl) purchEl.checked = !!item.experienceId;

      // Reset campos de checkout (pode haver edição anterior em cache).
      $('by-preco').value = '';
      $('by-vagas-total').value = '';
      $('by-event-at').value = '';
      $('by-cutoff-hours').value = 24;
      $('by-descricao-completa').value = '';
      $('by-valor-cheio').value = '';
      // Reset suppliers UI: começa com 1 linha em branco
      byRenderSuppliers([]);
      // Reset comissão Elarah: residual automático
      if ($('by-comissao-type')) $('by-comissao-type').value = '';
      if ($('by-comissao-value')) $('by-comissao-value').value = '';
      if ($('by-variant-label')) $('by-variant-label').value = '';
      if ($('by-variant-options')) $('by-variant-options').value = '';

      if (item.experienceId && window.ElarahData && ElarahData.getExperienceById) {
        try {
          var exp = await ElarahData.getExperienceById(item.experienceId);
          if (exp) {
            $('by-preco').value = exp.preco || '';
            $('by-vagas-total').value = exp.vagasTotal != null ? exp.vagasTotal : '';
            // event_at vem como ISO; o input datetime-local quer "YYYY-MM-DDTHH:MM"
            if (exp.eventAt) {
              try {
                var d = new Date(exp.eventAt);
                if (!isNaN(d.getTime())) {
                  var pad = function (n) { return String(n).padStart(2, '0'); };
                  $('by-event-at').value =
                    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                    'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
                }
              } catch (e) {}
            }
            $('by-cutoff-hours').value = exp.cutoffHours != null ? exp.cutoffHours : 24;
            $('by-descricao-completa').value = exp.descricao || '';
            $('by-valor-cheio').value = exp.valorCheioCentavos != null
              ? 'R$ ' + (exp.valorCheioCentavos / 100).toFixed(0) : '';
            // Comissão Elarah: residual (null), percent ou fixed
            if ($('by-comissao-type')) {
              $('by-comissao-type').value = exp.comissaoType === 'percent' || exp.comissaoType === 'fixed'
                ? exp.comissaoType : '';
            }
            if ($('by-comissao-value')) {
              if (exp.comissaoType === 'fixed' && exp.comissaoValue != null) {
                // Banco grava em centavos pra fixed; UI exibe em R$.
                $('by-comissao-value').value = (Number(exp.comissaoValue) / 100).toFixed(2);
              } else {
                $('by-comissao-value').value = exp.comissaoValue != null ? exp.comissaoValue : '';
              }
            }
            // Variantes (Pintura: Lagosta/Beijo/Olho grego)
            if ($('by-variant-label')) $('by-variant-label').value = exp.variantLabel || '';
            if ($('by-variant-options')) {
              $('by-variant-options').value = Array.isArray(exp.variantOptions)
                ? exp.variantOptions.join('\n')
                : '';
            }
          }
          // Carrega fornecedores via experience_suppliers
          if (ElarahData.getSuppliersForExperience) {
            try {
              var sups = await ElarahData.getSuppliersForExperience(item.experienceId);
              if (sups && sups.length) {
                byRenderSuppliers(sups);
              } else if (exp && exp.fornecedorNome) {
                // Fallback: experience tem 1 fornecedor legado e ainda não
                // foi migrado pra experience_suppliers (backfill não rodou).
                byRenderSuppliers([{
                  fornecedorNome: exp.fornecedorNome,
                  shareType: 'percent',
                  shareValue: exp.percentualRepasse != null ? exp.percentualRepasse : 70
                }]);
              }
              bySuppliersUpdateResumo();
            } catch (errSup) {
              console.warn('[Admin/By Elarah] falha ao carregar suppliers', errSup);
            }
          }
          // Carrega slots (vagas por horário) — sobrescreve o render
          // baseado em item.horarios pra que vagas restantes / id do
          // slot existente apareçam corretamente.
          if (ElarahData.getSlotsForExperience) {
            try {
              var slots = await ElarahData.getSlotsForExperience(item.experienceId);
              if (Array.isArray(slots) && slots.length) {
                byRenderHorarios(slots);
              }
            } catch (errSlots) {
              console.warn('[Admin/By Elarah] falha ao carregar slots', errSlots);
            }
          }
        } catch (e) {
          console.warn('[Admin/By Elarah] falha ao carregar experience vinculada', e);
        }
      }
      byUpdatePurchasableVisibility();
    } else {
      byModalTitle.textContent = 'Novo item By Elarah';
      bySubmitBtn.textContent = 'Salvar item';
      byForm.reset();
      $('by-tipo').value = 'espera';
      $('by-ordem').value = 0;
      $('by-ativo').value = 'true';
      $('by-edit-id').value = '';
      byRenderHorarios(['']);
      // Reset toggle e seção
      var purchEl2 = $('by-is-purchasable');
      if (purchEl2) purchEl2.checked = false;
      $('by-cutoff-hours').value = 24;
      $('by-percentual-repasse').value = 90;
      byUpdatePurchasableVisibility();
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

    if (byHorariosAddBtn) {
      byHorariosAddBtn.addEventListener('click', function () {
        byAddHorarioRow('');
        byUpdateVagasTotaisMode();
      });
    }
    if (byAddBtn) byAddBtn.addEventListener('click', () => openByModal(null));
    if (byModalBackdrop) byModalBackdrop.addEventListener('click', closeByModal);
    if (byModalClose) byModalClose.addEventListener('click', closeByModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && byModal.classList.contains('open')) closeByModal();
    });

    // Toggle "É comprável" mostra/esconde a seção de checkout.
    var purchEl = document.getElementById('by-is-purchasable');
    if (purchEl) purchEl.addEventListener('change', byUpdatePurchasableVisibility);

    // Botão "+ Adicionar fornecedor"
    var supplierAddBtn = document.getElementById('by-supplier-add-btn');
    if (supplierAddBtn) {
      supplierAddBtn.addEventListener('click', function () {
        byAddSupplierRow();
        bySuppliersUpdateResumo();
      });
    }
    // Resumo recalcula quando admin mexe em valor cheio ou comissão.
    ['by-valor-cheio', 'by-comissao-type', 'by-comissao-value'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', bySuppliersUpdateResumo);
        el.addEventListener('change', bySuppliersUpdateResumo);
      }
    });

    byForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const $ = (id) => document.getElementById(id);
      const horarios = byCollectHorarios();
      const isPurchasable = !!$('by-is-purchasable').checked;
      const data = {
        slug: $('by-slug').value.trim(),
        nome: $('by-nome').value.trim(),
        descricao: $('by-descricao').value.trim(),
        imagem: $('by-imagem').value.trim(),
        data: $('by-data').value.trim(),
        local: $('by-local').value.trim(),
        horarios: horarios,
        // Se ligar "comprável", força tipo=participar (botão "Quero
        // participar"). Se desligar, respeita o que o admin escolheu.
        tipo: isPurchasable ? 'participar' : $('by-tipo').value,
        ordem: parseInt($('by-ordem').value, 10) || 0,
        ativo: $('by-ativo').value === 'true'
      };
      const editId = $('by-edit-id').value;
      bySubmitBtn.disabled = true;
      try {
        // ===== Sincronização byelarah_item ↔ experience =====
        // 1. Carrega item atual (se for edição) pra saber se já tem
        //    experience vinculada.
        // 2. Se isPurchasable=true: cria/atualiza a experience espelho
        //    com is_elarah_original=true e cta_mode='buy', e propaga
        //    o experience_id pro data antes de salvar.
        // 3. Se isPurchasable=false E havia experience: marca a
        //    experience como is_active=false (preserva histórico) e
        //    limpa experience_id no item.
        let existingExpId = null;
        if (editId) {
          try {
            const cur = await ElarahByElarah.getItemById(editId);
            existingExpId = cur && cur.experienceId ? cur.experienceId : null;
          } catch (e) {}
        }

        if (isPurchasable) {
          const expData = byCollectExperienceData(data);
          // Validações mínimas pra evitar criar experience inválida.
          if (!expData.preco) {
            alert('Preço é obrigatório quando "É comprável" está ligado.');
            bySubmitBtn.disabled = false;
            return;
          }
          if (!expData.descricao) {
            alert('Descrição completa é obrigatória quando "É comprável" está ligado (ela aparece na modal de "Quero participar").');
            bySubmitBtn.disabled = false;
            return;
          }

          let savedExp = null;
          try {
            if (existingExpId && window.ElarahData && ElarahData.updateExperience) {
              savedExp = await ElarahData.updateExperience(existingExpId, expData);
            } else if (window.ElarahData && ElarahData.addExperience) {
              savedExp = await ElarahData.addExperience(expData);
            }
          } catch (errExp) {
            console.error('[Admin/By Elarah] falha ao sincronizar experience', errExp);
            alert('Erro ao salvar dados de checkout. Veja o console.');
            bySubmitBtn.disabled = false;
            return;
          }
          var resolvedExpId = (savedExp && savedExp.id) || existingExpId || null;
          if (resolvedExpId) data.experienceId = resolvedExpId;

          console.info(
            '[Admin/By Elarah] sincronização experience',
            'savedExp_id=' + (savedExp ? savedExp.id : '(null)'),
            'existingExpId=' + (existingExpId || '(novo)'),
            'resolvedExpId=' + (resolvedExpId || '(NULO! save pode ter falhado)')
          );
          if (!resolvedExpId) {
            alert(
              'ATENÇÃO: A experiência espelho não foi salva. ' +
              'O item By Elarah vai funcionar como LEAD (sem checkout). ' +
              'Veja o console do navegador (F12) pra detalhes.'
            );
          }

          // Salva slots (vagas por horário). Cada horário do form
          // vira uma row em experience_slots. Se o admin não mexer
          // no input de "Vagas" da linha, o slot fica como ilimitado.
          // Decremento atômico em checkout vai usar o slot certo.
          if (resolvedExpId && window.ElarahData && ElarahData.saveSlots) {
            var slotsToSave = byCollectSlots().map(function (s) {
              return {
                id: s.id,
                horario: s.horario,
                vagasTotal: s.vagasTotal,
                // data label e eventAt preenchidos com o que está
                // no form da seção comprável — mantém slots e
                // experience consistentes em data/cutoff.
                data: expData.data || null,
                eventAt: expData.eventAt || null
              };
            });
            try {
              await ElarahData.saveSlots(resolvedExpId, slotsToSave);
              console.info('[Admin/By Elarah] slots salvos', resolvedExpId, slotsToSave.length);
            } catch (errSlots) {
              console.error('[Admin/By Elarah] saveSlots falhou', errSlots);
              alert(
                'ATENÇÃO: as vagas por horário NÃO foram salvas.\n' +
                'Erro: ' + ((errSlots && errSlots.message) || errSlots) + '\n\n' +
                'O checkout vai usar vagasTotal da experiência como fallback. ' +
                'Edite o item de novo para tentar regravar os slots.'
              );
            }
          }

          // Salva fornecedores (experience_suppliers — múltiplos por
          // experience). Sincroniza array completo: cria/atualiza/
          // deleta. Cálculo no checkout usa essas rows; se nenhuma,
          // fallback no fornecedor_nome legado da experience.
          if (resolvedExpId && window.ElarahData && ElarahData.saveSuppliers) {
            var suppliersToSave = byCollectSuppliers();
            try {
              await ElarahData.saveSuppliers(resolvedExpId, suppliersToSave);
              console.info('[Admin/By Elarah] suppliers salvos', resolvedExpId, suppliersToSave.length);
            } catch (errSup) {
              console.error('[Admin/By Elarah] saveSuppliers falhou', errSup);
              alert(
                'ATENÇÃO: os fornecedores NÃO foram salvos.\n' +
                'Erro: ' + ((errSup && errSup.message) || errSup) + '\n\n' +
                'O cálculo de repasse vai cair no fallback (fornecedor_nome legado da experience).'
              );
            }
          }
        } else {
          // Toggle desligado: se havia experience, desativa (não deleta).
          if (existingExpId && window.ElarahData && ElarahData.updateExperience) {
            try {
              await ElarahData.updateExperience(existingExpId, { isActive: false });
              console.info('[Admin/By Elarah] experience desativada após desligar comprável', existingExpId);
            } catch (e) {
              console.warn('[Admin/By Elarah] falha ao desativar experience', e);
            }
          }
          data.experienceId = null;
        }

        let savedRecord = null;
        if (editId) {
          savedRecord = await ElarahByElarah.updateItem(editId, data);
        } else {
          savedRecord = await ElarahByElarah.addItem(data);
        }
        if (!savedRecord) {
          // updateItem/addItem já alertaram dentro do byelarah-data.js.
          // Mantém o modal aberto para o admin reagir (corrigir input
          // ou fechar manualmente) — antes fechava silenciosamente
          // mesmo em erro.
          return;
        }
      } finally {
        bySubmitBtn.disabled = false;
      }
      closeByModal();
      await renderByElarah();
    });
  }

  // Coleta os campos da seção "comprável" e monta payload pra
  // ElarahData.addExperience / updateExperience. Reusa nome,
  // imagem, local, horários do form principal.
  function byCollectExperienceData(byData) {
    const $ = (id) => document.getElementById(id);
    const horariosArr = Array.isArray(byData.horarios) ? byData.horarios : [];

    // Parse valor cheio: aceita "R$ 425", "425", "425,00".
    const vcRaw = ($('by-valor-cheio').value || '').trim();
    let valorCheio = null;
    if (vcRaw) {
      const cleaned = vcRaw.replace(/[R$\s]/gi, '').replace(',', '.');
      const n = cleaned.includes('.') ? Math.round(Number(cleaned) * 100) : Number(cleaned) * 100;
      if (Number.isFinite(n) && n > 0) valorCheio = n;
    }

    // event_at: input datetime-local devolve "YYYY-MM-DDTHH:MM"
    // sem timezone. Converte pra ISO local (assume timezone do
    // navegador, igual o form de Experiências).
    const eventAtRaw = ($('by-event-at').value || '').trim();
    let eventAtIso = null;
    if (eventAtRaw) {
      const d = new Date(eventAtRaw);
      if (!isNaN(d.getTime())) eventAtIso = d.toISOString();
    }

    // Bairro/endereço: o form de By Elarah tem só "local"; espelha
    // ele em ambos os campos da experience pra retrocompat com
    // categoria.html (que mostra bairro separado).
    const local = byData.local || '';

    return {
      // Identidade
      nome: byData.nome,
      categoria: 'Elarah Originals', // categoria default fixa pros Originals
      // Conteúdo do card e modal
      imagem: byData.imagem,
      data: byData.data, // texto livre exibido no card
      duracao: '',
      bairro: local,
      endereco: local,
      inclui: '',
      preco: ($('by-preco').value || '').trim(),
      cor: '#f6d5a8,#f0a05e',
      descricao: ($('by-descricao-completa').value || '').trim(),
      horario: horariosArr[0] || '',
      horarios: horariosArr,
      // Checkout / vagas — definidas mais abaixo via vagasTotal
      // (fonte única de verdade: soma dos slots OU input global).
      eventAt: eventAtIso,
      cutoffHours: (function () {
        const v = ($('by-cutoff-hours').value || '').trim();
        if (!v) return 24;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : 24;
      })(),
      // Visibilidade respeita o ativo do form By Elarah.
      isActive: byData.ativo !== false,
      // Vagas totais: fonte única de verdade.
      // - Se há horários cadastrados → soma dos slots (ou null se
      //   algum for ilimitado). O input "Vagas totais" do form fica
      //   desabilitado nesse caso.
      // - Se NÃO há horários → usa o que admin digitou.
      // Garantia: o checkout sempre prefere slot quando existe — esta
      // sobrescrita só mantém experience.vagas_total coerente pra
      // estatísticas/listagens. Nunca há decremento duplo.
      vagasTotal: (function () {
        var slots = byCollectSlots();
        if (slots.length > 0) {
          var temIlimitado = false;
          var soma = 0;
          slots.forEach(function (s) {
            if (s.vagasTotal == null) temIlimitado = true;
            else soma += Number(s.vagasTotal) || 0;
          });
          return temIlimitado ? null : soma;
        }
        // Sem slots: respeita o input global do admin.
        var v = ($('by-vagas-total').value || '').trim();
        if (!v) return null;
        var n = parseInt(v, 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
      })(),
      // Financeiro: valor cheio. Fornecedor (legado: 1 nome) é
      // preenchido com o primeiro da lista, mas a fonte da verdade
      // são as rows em experience_suppliers (gravadas separado abaixo).
      // O percentual_repasse legado fica null porque agora cada
      // fornecedor tem seu próprio share.
      valorCheioCentavos: valorCheio,
      // Comissão Elarah (manual ou null=residual). Fixed: UI usa R$,
      // banco grava em centavos.
      comissaoType: (function () {
        var t = ($('by-comissao-type')?.value || '').trim();
        return t === 'percent' || t === 'fixed' ? t : null;
      })(),
      comissaoValue: (function () {
        var t = ($('by-comissao-type')?.value || '').trim();
        var v = ($('by-comissao-value')?.value || '').trim();
        if (!t || !v) return null;
        var n = Number(v);
        if (!Number.isFinite(n)) return null;
        // 'fixed' do form vem em R$ inteiros — converte pra centavos.
        return t === 'fixed' ? Math.round(n * 100) : n;
      })(),
      // Flags Elarah Original
      isElarahOriginal: true,
      hideFromCategorias: true, // Original By Elarah só aparece na By Elarah
      ctaMode: 'buy',
      // Variantes (escolha extra do cliente). Quando label vazio,
      // experiences-data.js grava null e o front não renderiza seletor.
      variantLabel: ($('by-variant-label')?.value || '').trim() || null,
      variantOptions: ($('by-variant-options')?.value || '')
    };
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
          // Indicador "comprável vs lead": ✓ verde se vinculado a uma
          // experience real (checkout direto); ⚠ amarelo se vai pro
          // fluxo de lead. Pega o problema raiz "salvei comprável mas
          // está caindo em lead" no admin antes de ir pra home testar.
          const isPurchasable = !!it.experienceId;
          const tipoLabel = isPurchasable
            ? '💳 Comprável'
            : (it.tipo === 'participar' ? '⚠ Participar (sem checkout)' : '📝 Lista de espera');
          const tipoClass = isPurchasable
            ? 'approved'
            : (it.tipo === 'participar' ? 'pending' : 'pending');
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

  // Salva o WhatsApp do fornecedor em fornecedores_metadata.whatsapp.
  // Fonte única — usada pelo botão "Avisar fornecedor" em Compras.
  async function saveFornecedorWhatsapp(fornecedorNome, whatsappRaw) {
    const s = window.supabaseClient;
    if (!s) return { ok: false, error: 'Supabase client indisponível' };
    const key = fornecedorKey(fornecedorNome);
    if (!key) return { ok: false, error: 'Nome do fornecedor vazio' };
    const wa = (whatsappRaw || '').trim();
    const { error } = await s.from('fornecedores_metadata').upsert(
      {
        fornecedor_key: key,
        fornecedor_nome: fornecedorNome,
        whatsapp: wa || null,
      },
      { onConflict: 'fornecedor_key' }
    );
    if (error) {
      console.error('[Admin] saveFornecedorWhatsapp error', error);
      return { ok: false, error: error.message };
    }
    fornecedoresMetaCache = null;
    return { ok: true };
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

  // Cadastra um fornecedor novo em fornecedores_metadata só com o
  // nome (sem whatsapp/data ainda). Usado pelo botão "Adicionar novo
  // fornecedor" do combobox — garante que o nome aparece na próxima
  // abertura mesmo que nenhuma experiência tenha sido salva ainda.
  async function upsertFornecedorByName(fornecedorNome) {
    const s = window.supabaseClient;
    const key = fornecedorKey(fornecedorNome);
    if (!key) return { ok: false, error: 'Nome do fornecedor vazio' };
    if (!s) return { ok: false, error: 'Supabase client indisponível' };
    const { error } = await s.from('fornecedores_metadata').upsert(
      { fornecedor_key: key, fornecedor_nome: fornecedorNome },
      { onConflict: 'fornecedor_key' }
    );
    if (error) {
      // Tabela pode não existir; o nome ainda fica no input e é
      // salvo via experiences.fornecedor_nome quando o admin salvar.
      console.warn('[Admin] upsertFornecedorByName falhou (segue mesmo assim):', error.message);
      return { ok: false, error: error.message };
    }
    fornecedoresMetaCache = null;
    return { ok: true };
  }

  // Lista unificada de fornecedores conhecidos: junta nomes da tabela
  // fornecedores_metadata com nomes presentes em experiences.fornecedor_nome.
  // Dedup case-insensitive preservando a grafia original do primeiro hit.
  // Ordena alfabético pt-BR. Usado pelo combobox.
  async function getKnownSuppliers() {
    const seen = new Map();
    const add = function (nome) {
      const trimmed = String(nome || '').trim();
      if (!trimmed) return;
      const k = trimmed.toLowerCase();
      if (!seen.has(k)) seen.set(k, trimmed);
    };
    try {
      const meta = await getFornecedoresMetadata();
      (meta || []).forEach(function (m) { add(m && m.fornecedor_nome); });
    } catch (e) { /* segue com experiences-only */ }
    try {
      const exps = await getExperiences();
      (exps || []).forEach(function (e) { add(e && e.fornecedorNome); });
    } catch (e) { /* segue mesmo sem experiences */ }
    return Array.from(seen.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });
  }

  // ============================================================
  // Supplier Combobox
  // Combobox vanilla com busca + opção "Adicionar novo fornecedor".
  // Renderiza dentro de `host` (um <div>). API: getValue, setValue,
  // refresh, destroy. `opts.hiddenInput` é um <input type=hidden>
  // opcional que recebe o valor selecionado — assim o form existente
  // continua lendo via getElementById sem mudar.
  // ============================================================
  function createSupplierCombobox(host, opts) {
    if (!host) return null;
    opts = opts || {};
    var hiddenInput = opts.hiddenInput || null;
    var compact = !!opts.compact;
    var placeholder = opts.placeholder || 'Selecione ou digite um fornecedor…';
    var onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};

    host.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'admin__supplier-combobox';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'admin__supplier-combobox__input' + (compact ? ' admin__supplier-combobox__input--compact' : '');
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    var menu = document.createElement('div');
    menu.className = 'admin__supplier-combobox__menu';
    wrap.appendChild(input);
    wrap.appendChild(menu);
    host.appendChild(wrap);

    var suppliers = [];
    var selectedValue = '';
    var lastCommitted = '';
    var activeIndex = -1;
    var renderedItems = []; // { kind: 'item'|'add'|'empty', value }

    function escapeHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function commit(val) {
      selectedValue = val || '';
      lastCommitted = selectedValue;
      input.value = selectedValue;
      if (hiddenInput) hiddenInput.value = selectedValue;
      try { onChange(selectedValue); } catch (e) {}
    }

    function open() { wrap.classList.add('is-open'); render(input.value); }
    function close() { wrap.classList.remove('is-open'); activeIndex = -1; }

    function render(query) {
      var q = String(query || '').trim().toLowerCase();
      var matches = suppliers.filter(function (n) {
        return !q || n.toLowerCase().indexOf(q) !== -1;
      });
      var html = '';
      renderedItems = [];
      if (matches.length === 0 && !q) {
        html += '<div class="admin__supplier-combobox__item admin__supplier-combobox__item--empty">Nenhum fornecedor cadastrado ainda.</div>';
        renderedItems.push({ kind: 'empty' });
      } else if (matches.length === 0) {
        html += '<div class="admin__supplier-combobox__item admin__supplier-combobox__item--empty">Nenhum resultado para "' + escapeHtml(q) + '".</div>';
        renderedItems.push({ kind: 'empty' });
      } else {
        matches.forEach(function (n, i) {
          html += '<div class="admin__supplier-combobox__item" data-idx="' + i + '">' + escapeHtml(n) + '</div>';
          renderedItems.push({ kind: 'item', value: n });
        });
      }
      // Botão "Adicionar novo" só aparece quando há texto digitado e
      // ele não bate exatamente com nenhum fornecedor existente.
      var typed = String(query || '').trim();
      var exactMatch = !!typed && suppliers.some(function (n) {
        return n.toLowerCase() === typed.toLowerCase();
      });
      if (typed && !exactMatch) {
        html += '<div class="admin__supplier-combobox__item admin__supplier-combobox__item--add" data-add="1">+ Adicionar novo fornecedor: "' + escapeHtml(typed) + '"</div>';
        renderedItems.push({ kind: 'add', value: typed });
      }
      menu.innerHTML = html;
      activeIndex = -1;
      // Wire clicks (mousedown pra disparar antes do blur do input).
      Array.prototype.forEach.call(menu.querySelectorAll('.admin__supplier-combobox__item'), function (el) {
        if (el.classList.contains('admin__supplier-combobox__item--empty')) return;
        el.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          if (el.dataset.add) {
            handleAdd(el.textContent.replace(/^\+\s+Adicionar novo fornecedor:\s*"|"$/g, ''));
          } else {
            commit(el.textContent);
            close();
          }
        });
      });
    }

    async function handleAdd(typedName) {
      var name = String(typedName || '').trim();
      if (!name) return;
      // Otimista: já reflete no input e na lista local antes do upsert.
      if (suppliers.indexOf(name) === -1) suppliers.push(name);
      suppliers.sort(function (a, b) { return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }); });
      commit(name);
      close();
      try { await upsertFornecedorByName(name); } catch (e) {}
    }

    input.addEventListener('focus', function () { open(); });
    input.addEventListener('click', function () { open(); });
    input.addEventListener('input', function () {
      wrap.classList.add('is-open');
      render(input.value);
    });
    input.addEventListener('blur', function () {
      // Pequeno delay pra permitir que o mousedown do menu dispare antes.
      setTimeout(function () {
        if (!wrap.classList.contains('is-open')) return;
        // Se digitou algo e não selecionou, restaura último valor commitado.
        input.value = lastCommitted;
        close();
      }, 120);
    });
    input.addEventListener('keydown', function (e) {
      var visible = renderedItems.filter(function (r) { return r.kind !== 'empty'; });
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!wrap.classList.contains('is-open')) open();
        if (visible.length === 0) return;
        activeIndex = Math.min(visible.length - 1, activeIndex + 1);
        highlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        highlight();
      } else if (e.key === 'Enter') {
        if (!wrap.classList.contains('is-open')) return;
        e.preventDefault();
        var pickIdx = activeIndex;
        if (pickIdx < 0) {
          // Sem seleção via teclado: se houver "add", usa ele; senão primeiro item.
          var addIdx = renderedItems.findIndex(function (r) { return r.kind === 'add'; });
          if (addIdx >= 0) {
            handleAdd(renderedItems[addIdx].value); return;
          }
          var firstItem = renderedItems.findIndex(function (r) { return r.kind === 'item'; });
          if (firstItem < 0) return;
          commit(renderedItems[firstItem].value);
          close();
          return;
        }
        var entry = visibleEntry(pickIdx);
        if (!entry) return;
        if (entry.kind === 'add') handleAdd(entry.value);
        else { commit(entry.value); close(); }
      } else if (e.key === 'Escape') {
        input.value = lastCommitted;
        close();
      }
    });

    function visibleEntry(idx) {
      var visible = renderedItems.filter(function (r) { return r.kind !== 'empty'; });
      return visible[idx] || null;
    }

    function highlight() {
      var els = menu.querySelectorAll('.admin__supplier-combobox__item:not(.admin__supplier-combobox__item--empty)');
      Array.prototype.forEach.call(els, function (el, i) {
        if (i === activeIndex) el.classList.add('is-active');
        else el.classList.remove('is-active');
      });
      var activeEl = els[activeIndex];
      if (activeEl && activeEl.scrollIntoView) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    async function refresh() {
      try { suppliers = await getKnownSuppliers(); } catch (e) { suppliers = []; }
      // Garante que o valor atual aparece na lista mesmo que ainda não
      // esteja em fornecedores_metadata (ex: experiência antiga).
      if (selectedValue && suppliers.indexOf(selectedValue) === -1) {
        suppliers.push(selectedValue);
        suppliers.sort(function (a, b) { return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }); });
      }
      if (wrap.classList.contains('is-open')) render(input.value);
    }

    function setValue(val) {
      commit(val || '');
    }
    function getValue() {
      return selectedValue;
    }
    function destroy() {
      host.innerHTML = '';
    }

    // Inicia carregando a lista em background.
    refresh();

    return { getValue: getValue, setValue: setValue, refresh: refresh, destroy: destroy };
  }

  // Card "Repasses pendentes por fornecedor" no topo da tela Compras.
  // Agrupa bookings pagas com status_fornecedor='repasse_pendente'
  // (ou null = pendente por default) por fornecedor resolvido. Click
  // numa linha aplica o filtro da tabela. Esconde quando não há
  // pendências.
  function renderRepassesPendentesCard(allBookings) {
    const card = document.getElementById('repasse-pendente-card');
    const listEl = document.getElementById('repasse-pendente-list');
    const totalEl = document.getElementById('repasse-pendente-total');
    const countEl = document.getElementById('repasse-pendente-count');
    if (!card || !listEl || !totalEl) return;

    const byForn = new Map();
    let totalGlobal = 0;
    let countGlobal = 0;
    (allBookings || []).forEach(b => {
      if (!b || b.status !== 'pago') return;
      // Default do schema é 'repasse_pendente'; trata null/undefined como pendente.
      const sf = b.status_fornecedor || 'repasse_pendente';
      if (sf !== 'repasse_pendente') return;
      const nomeRaw = (b._fornecedorResolvido || '').trim();
      const nome = nomeRaw || '— sem fornecedor —';
      const valor = Number(b._valorRepasseResolvido) || 0;
      if (!byForn.has(nome)) byForn.set(nome, { nome, count: 0, total: 0, isUnknown: !nomeRaw });
      const agg = byForn.get(nome);
      agg.count += 1;
      agg.total += valor;
      totalGlobal += valor;
      countGlobal += 1;
    });

    if (!byForn.size) {
      card.style.display = 'none';
      listEl.innerHTML = '';
      return;
    }

    card.style.display = '';
    totalEl.textContent = formatCents(totalGlobal, 'BRL');
    if (countEl) {
      countEl.textContent = countGlobal + ' reserva' + (countGlobal !== 1 ? 's' : '');
    }

    const list = Array.from(byForn.values()).sort((a, b) => b.total - a.total);
    listEl.innerHTML = list.map(f => {
      return (
        '<button type="button" class="admin__repasse-row" data-fornecedor="' +
        escapeHtml(f.isUnknown ? '' : f.nome) + '" ' +
        'style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #f0d9a8;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;width:100%;" ' +
        'title="Clique pra filtrar a tabela por este fornecedor">' +
        '<span style="flex:1;font-weight:600;color:' + (f.isUnknown ? '#a55' : '#1a1a1a') + ';">' +
        escapeHtml(f.nome) + '</span>' +
        '<span style="font-size:.78rem;color:#7a6440;min-width:90px;text-align:right;">' +
        f.count + ' reserva' + (f.count !== 1 ? 's' : '') + '</span>' +
        '<span style="font-weight:700;color:#b07b00;min-width:120px;text-align:right;">' +
        escapeHtml(formatCents(f.total, 'BRL')) + '</span>' +
        '</button>'
      );
    }).join('');

    listEl.querySelectorAll('.admin__repasse-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = btn.getAttribute('data-fornecedor') || '';
        const fornEl = document.getElementById('bookings-filter-fornecedor');
        const sfEl = document.getElementById('bookings-filter-status-fornecedor');
        if (fornEl) {
          // Garante que o option existe (caso o dropdown ainda não
          // tenha sido populado, ou o nome venha de fallback de
          // experiência ainda não vista).
          let found = false;
          Array.from(fornEl.options).forEach(o => { if (o.value === nome) found = true; });
          if (!found && nome) {
            const opt = document.createElement('option');
            opt.value = nome;
            opt.textContent = nome;
            fornEl.appendChild(opt);
          }
          fornEl.value = nome;
        }
        if (sfEl) sfEl.value = 'repasse_pendente';
        renderBookings();
        const tableWrap = document.querySelector('#panel-purchases .admin__table-wrap');
        if (tableWrap) tableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
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
      // Só conta valores pra bookings pagas.
      if (b.status !== 'pago') return;

      const exp = expById.get(b.experiencia_id);
      const qty = Math.max(1, Number(b.quantidade) || 1);
      let valorCheio = b.valor_cheio_centavos != null ? Number(b.valor_cheio_centavos) : null;
      if (!valorCheio && exp && exp.valorCheioCentavos) {
        valorCheio = Number(exp.valorCheioCentavos) * qty;
      }
      // Regra fixa Elarah: repasse 70% / comissão 30%.
      let valorComissao = b.valor_comissao_centavos != null ? Number(b.valor_comissao_centavos) : null;
      if (!valorComissao && valorCheio) valorComissao = Math.round(valorCheio * 0.30);

      // ===== AGREGA POR REPASSE (multi-fornecedor) =====
      // bookings.repasses[] é o snapshot do mapa financeiro no momento
      // da reserva. Cada item tem {fornecedor_nome, valor_centavos}.
      // Cada fornecedor entra na sua agregação. Pra bookings antigas
      // (sem repasses[]), cai no fallback legado: 1 fornecedor com
      // valor_repasse_centavos cheio.
      let repassesUsadas = [];
      if (Array.isArray(b.repasses) && b.repasses.length) {
        repassesUsadas = b.repasses
          .filter(function (r) { return r && r.fornecedor_nome; })
          .map(function (r) {
            return {
              nome: String(r.fornecedor_nome).trim(),
              valor: Number(r.valor_centavos) || 0,
            };
          });
      }
      if (!repassesUsadas.length) {
        // Legado: 1 fornecedor por booking.
        const nomeLegado = (b.fornecedor_nome && b.fornecedor_nome.trim())
          || (exp && exp.fornecedorNome) || '';
        if (nomeLegado) {
          let vRep = b.valor_repasse_centavos != null ? Number(b.valor_repasse_centavos) : null;
          if (!vRep && valorCheio) vRep = Math.round(valorCheio * 0.70);
          repassesUsadas = [{ nome: nomeLegado, valor: vRep || 0 }];
        }
      }

      if (!repassesUsadas.length) return;

      // Cada fornecedor incrementa sua própria agregação. Reservas é
      // contado em todos os fornecedores que participam (cada um vê
      // a reserva como sua).
      repassesUsadas.forEach(function (r) {
        const agg = ensureAgg(r.nome);
        if (!agg) return;
        agg.reservas += 1;
        if (valorCheio) agg.faturamentoCents += valorCheio;
        if (r.valor) {
          agg.repasseTotalCents += r.valor;
          if (b.status_fornecedor === 'repasse_feito') {
            agg.repassePagoCents += r.valor;
          } else {
            agg.repassePendenteCents += r.valor;
          }
        }
        // Comissão Elarah é uma vez por booking (não por fornecedor).
        // Atribui pro fornecedor "principal" (primeiro do array) pra
        // não duplicar no total global.
        if (r === repassesUsadas[0] && valorComissao) {
          agg.comissaoCents += valorComissao;
        }
        const ts = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (ts > agg.lastBookingTs) agg.lastBookingTs = ts;
      });
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
      tbody.innerHTML = '<tr><td colspan="10" class="admin__table-empty">Nenhum fornecedor cadastrado ainda. Preencha o campo "Fornecedor" nas experiências pra ver os dados aqui.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(f => {
      const meta = metaByKey.get(f.key);
      const dataEntradaISO = meta && meta.data_entrada ? meta.data_entrada : '';
      const whatsappVal = meta && meta.whatsapp ? meta.whatsapp : '';
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
        '<td><input type="tel" class="admin__forn-whatsapp" data-forn-nome="' + escapeHtml(f.nome) + '" value="' + escapeHtml(whatsappVal) + '" placeholder="(11) 99999-9999" style="padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:.82rem;font-family:inherit;width:140px;" title="WhatsApp do fornecedor — usado pelo botão Avisar em Compras"></td>' +
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
        // Ordem das colunas: Fornecedor=0, WhatsApp=1, DataEntrada=2, ParceiroHá=3.
        const row = el.closest('tr');
        if (row) {
          const parceiroCell = row.children[3];
          if (parceiroCell) parceiroCell.innerHTML = formatParceiroHa(value);
        }
      });
    });

    // WhatsApp por fornecedor (centralizado — usado pelo botão Avisar
    // em Compras). Salva on-blur (em vez de on-change) pra dar tempo
    // do operador digitar o número inteiro sem disparar a cada dígito.
    tbody.querySelectorAll('.admin__forn-whatsapp').forEach(input => {
      input.addEventListener('blur', async (e) => {
        const el = e.target;
        const nome = el.dataset.fornNome;
        const original = el.defaultValue || '';
        const value = el.value;
        if (value === original) return; // nada mudou
        el.disabled = true;
        const res = await saveFornecedorWhatsapp(nome, value);
        el.disabled = false;
        if (!res.ok) {
          alert('Não consegui salvar o WhatsApp. ' +
            (res.error && res.error.includes('whatsapp')
              ? 'A coluna whatsapp não existe ainda — rode sql/elarah_fornecedores_whatsapp.sql no SQL Editor do Supabase.'
              : res.error || 'Verifique se você está logada como admin.'));
          el.value = original;
          return;
        }
        el.defaultValue = value;
        // Feedback visual rápido (borda verde por 1s).
        const prev = el.style.borderColor;
        el.style.borderColor = '#1a8a4a';
        setTimeout(() => { el.style.borderColor = prev; }, 1000);
      });
    });
  }

  // =================================================
  // ============== ANALYTICS V2 =====================
  // Painel de crescimento. KPIs com Δ% vs período anterior,
  // funil de sessão, top experiências/fornecedores, segmentação
  // de clientes. Agregação 100% client-side a partir das tabelas
  // bookings + analytics_events + profiles.
  // =================================================

  // renderBars: usado também no painel Compras (booking conversion).
  // Mantido aqui pra não dispersar. NÃO é mais usado pelo analytics.
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

  // ===== Estado da UI =====
  let _anaState = { preset: '7', customStart: null, customEnd: null };
  let _anaChartEvolution = null;

  // ===== Wire dos controles (chips, custom, refresh) =====
  function wireAnalyticsControls() {
    const chipsBar = document.getElementById('ana-period-chips');
    if (chipsBar && !chipsBar._wired) {
      chipsBar._wired = true;
      chipsBar.addEventListener('click', e => {
        const chip = e.target.closest('.ana-chip');
        if (!chip) return;
        chipsBar.querySelectorAll('.ana-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        _anaState.preset = chip.dataset.range;
        const customWrap = document.getElementById('ana-period-custom');
        if (customWrap) customWrap.style.display = _anaState.preset === 'custom' ? 'flex' : 'none';
        if (_anaState.preset !== 'custom') renderAnalytics();
      });
    }
    const applyBtn = document.getElementById('ana-custom-apply');
    if (applyBtn && !applyBtn._wired) {
      applyBtn._wired = true;
      applyBtn.addEventListener('click', () => {
        const s = document.getElementById('ana-custom-start').value;
        const e = document.getElementById('ana-custom-end').value;
        if (!s || !e) { alert('Selecione data início e fim.'); return; }
        if (new Date(s) > new Date(e)) { alert('Data inicial precisa ser antes da final.'); return; }
        _anaState.customStart = s;
        _anaState.customEnd = e;
        renderAnalytics();
      });
    }
    const refresh = document.getElementById('btn-refresh-analytics');
    if (refresh && !refresh._wired) {
      refresh._wired = true;
      refresh.addEventListener('click', () => renderAnalytics(true));
    }
  }

  // ===== Helpers de período =====
  function getCurrentRange() {
    const now = new Date();
    const preset = _anaState.preset;
    if (preset === 'custom' && _anaState.customStart && _anaState.customEnd) {
      const start = new Date(_anaState.customStart + 'T00:00:00');
      const end = new Date(_anaState.customEnd + 'T23:59:59.999');
      const days = Math.max(1, Math.round((end - start) / 86400000));
      return { start, end, label: `${_anaState.customStart} a ${_anaState.customEnd}`, kind: 'custom', days };
    }
    if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start, end: now, label: 'Este mês', kind: 'month' };
    }
    const days = parseInt(preset, 10) || 7;
    const start = new Date(now.getTime() - days * 86400000);
    const labelMap = { 1: 'Últimas 24 horas', 7: 'Últimos 7 dias', 30: 'Últimos 30 dias' };
    return { start, end: now, label: labelMap[days] || `Últimos ${days} dias`, kind: 'days', days };
  }

  function getPreviousRange(curr) {
    if (curr.kind === 'month') {
      const now = new Date();
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: prevStart, end: prevEnd, label: 'mês anterior' };
    }
    const span = curr.end.getTime() - curr.start.getTime();
    const prevEnd = new Date(curr.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - span);
    return { start: prevStart, end: prevEnd, label: 'período anterior' };
  }

  function inRange(dateStr, range) {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  }

  // ===== Helpers de formatação =====
  function fmtBRL(centavos) {
    if (centavos == null || isNaN(centavos)) return 'R$ 0';
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL', maximumFractionDigits: 0
    });
  }
  function fmtPct(num) {
    if (num == null || isNaN(num)) return '—';
    return (num * 100).toFixed(1).replace('.', ',') + '%';
  }
  function fmtDelta(curr, prev) {
    if (prev == null || prev === 0) {
      if (!curr) return { text: 'sem dados no período anterior', cls: 'flat' };
      return { text: '↑ novo no período', cls: 'up' };
    }
    const pct = (curr - prev) / Math.abs(prev);
    const cls = pct > 0.001 ? 'up' : pct < -0.001 ? 'down' : 'flat';
    const arrow = pct > 0.001 ? '↑' : pct < -0.001 ? '↓' : '→';
    return { text: `${arrow} ${(pct * 100).toFixed(1).replace('.', ',')}% vs período anterior`, cls };
  }

  // ===== KPIs =====
  function computeKpis(bookingsInRange, eventsInRange) {
    const paid = bookingsInRange.filter(b => b.status === 'pago');
    const revenue = paid.reduce((s, b) => s + (Number(b.amount_total) || 0), 0);
    const orders = paid.length;
    const avgTicket = orders ? revenue / orders : 0;
    // Conversão: compras pagas / sessões únicas que demonstraram intenção
    // (clicaram em card de experiência ou abriram detalhe).
    const intentSessions = new Set();
    eventsInRange.forEach(e => {
      if (e.event_name === 'experience_card_click' || e.event_name === 'exp_detail_open') {
        if (e.session_id) intentSessions.add(e.session_id);
      }
    });
    const conversion = intentSessions.size ? orders / intentSessions.size : null;
    return { revenue, orders, avgTicket, conversion };
  }

  function renderKpis(curr, prev) {
    setKpi('kpi-revenue', fmtBRL(curr.revenue), 'kpi-revenue-delta', fmtDelta(curr.revenue, prev.revenue));
    setKpi('kpi-orders', curr.orders.toString(), 'kpi-orders-delta', fmtDelta(curr.orders, prev.orders));
    setKpi('kpi-ticket', curr.orders ? fmtBRL(curr.avgTicket) : '—', 'kpi-ticket-delta', fmtDelta(curr.avgTicket, prev.avgTicket));
    const convText = curr.conversion == null ? '—' : fmtPct(curr.conversion);
    setKpi('kpi-conv', convText, 'kpi-conv-delta', fmtDelta(curr.conversion || 0, prev.conversion || 0));
  }

  function setKpi(valueId, valueText, deltaId, delta) {
    const v = document.getElementById(valueId);
    if (v) v.textContent = valueText;
    const d = document.getElementById(deltaId);
    if (!d) return;
    d.textContent = delta.text;
    d.classList.remove('ana-kpi__delta--up', 'ana-kpi__delta--down', 'ana-kpi__delta--flat');
    d.classList.add('ana-kpi__delta--' + delta.cls);
  }

  // ===== Evolução (Chart.js) =====
  function bucketStart(date, hourly) {
    const d = new Date(date);
    if (hourly) d.setMinutes(0, 0, 0);
    else d.setHours(0, 0, 0, 0);
    return d;
  }

  function renderEvolutionChart(bookingsInRange, range) {
    const canvas = document.getElementById('ana-chart-evolution');
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      // Chart.js ainda não carregou (CDN com defer). Tenta de novo em 300ms.
      setTimeout(() => renderEvolutionChart(bookingsInRange, range), 300);
      return;
    }
    const isHourly = range.kind === 'days' && range.days === 1;
    const stepMs = isHourly ? 3600000 : 86400000;
    const startB = bucketStart(range.start, isHourly);
    const endB = bucketStart(range.end, isHourly);
    const buckets = new Map();
    for (let t = startB.getTime(); t <= endB.getTime(); t += stepMs) {
      buckets.set(t, { revenue: 0, orders: 0 });
    }
    bookingsInRange.forEach(b => {
      if (b.status !== 'pago') return;
      const t = bucketStart(new Date(b.created_at), isHourly).getTime();
      const bk = buckets.get(t);
      if (!bk) return;
      bk.revenue += (Number(b.amount_total) || 0) / 100;
      bk.orders += 1;
    });
    const labels = [], revArr = [], ordArr = [];
    Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]).forEach(([t, bk]) => {
      const d = new Date(t);
      labels.push(isHourly
        ? d.getHours().toString().padStart(2, '0') + 'h'
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      revArr.push(bk.revenue);
      ordArr.push(bk.orders);
    });

    if (_anaChartEvolution) { _anaChartEvolution.destroy(); _anaChartEvolution = null; }
    _anaChartEvolution = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Faturamento',
            data: revArr,
            borderColor: '#f0a05e',
            backgroundColor: 'rgba(240,160,94,0.12)',
            fill: true, tension: 0.35, yAxisID: 'y',
            pointRadius: 2, pointHoverRadius: 5, borderWidth: 2.5
          },
          {
            label: 'Compras',
            data: ordArr,
            borderColor: '#1a8a4a',
            backgroundColor: 'rgba(26,138,74,0)',
            fill: false, tension: 0.35, yAxisID: 'y2',
            pointRadius: 2, pointHoverRadius: 5, borderDash: [5, 4], borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const v = ctx.parsed.y;
                if (ctx.dataset.label === 'Faturamento') return ' Faturamento: R$ ' + v.toFixed(0);
                return ' Compras: ' + v;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear', position: 'left', beginAtZero: true,
            ticks: { callback: v => 'R$ ' + v }, grid: { color: '#f0ece4' }
          },
          y2: {
            type: 'linear', position: 'right', beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 }, grid: { display: false }
          },
          x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }
        }
      }
    });
  }

  // ===== Funil =====
  function renderFunnel(eventsInRange, bookingsInRange) {
    const wrap = document.getElementById('ana-funnel');
    const noteEl = document.getElementById('ana-funnel-note');
    if (!wrap) return;

    const cardClicks = new Set();
    const detailViews = new Set();
    const ctaClicks = new Set();
    eventsInRange.forEach(e => {
      if (!e.session_id) return;
      if (e.event_name === 'experience_card_click') cardClicks.add(e.session_id);
      else if (e.event_name === 'exp_detail_open') detailViews.add(e.session_id);
      else if (e.event_name === 'exp_cta_click') ctaClicks.add(e.session_id);
    });
    const purchases = bookingsInRange.filter(b => b.status === 'pago').length;

    const steps = [
      { label: 'Clicou em experiência', count: cardClicks.size },
      { label: 'Abriu o detalhe', count: detailViews.size },
      { label: 'Clicou em reservar', count: ctaClicks.size },
      { label: 'Comprou', count: purchases }
    ];
    if (steps.every(s => s.count === 0)) {
      wrap.innerHTML = '<div class="ana-funnel__empty">Sem dados de funil para o período.</div>';
      if (noteEl) noteEl.textContent = '';
      return;
    }

    const max = Math.max(...steps.map(s => s.count), 1);
    wrap.innerHTML = steps.map((s, i) => {
      const pct = Math.max(2, Math.round((s.count / max) * 100));
      const stepConv = (i > 0 && steps[i - 1].count > 0)
        ? `<div class="ana-funnel__step-conv">↓ ${((s.count / steps[i - 1].count) * 100).toFixed(1).replace('.', ',')}% passa pra próxima etapa</div>`
        : '';
      const unit = (i === 3) ? 'compras' : 'sessões';
      return stepConv + `
        <div class="ana-funnel__row">
          <div class="ana-funnel__label">${escapeHtml(s.label)}</div>
          <div class="ana-funnel__bar"><div class="ana-funnel__fill" style="width:${pct}%"></div></div>
          <div class="ana-funnel__count">${s.count.toLocaleString('pt-BR')}<small>${unit}</small></div>
        </div>
      `;
    }).join('');

    if (noteEl) {
      noteEl.textContent = 'Etapas medidas por sessão (cliques no front). Próximo passo (Fase 2): adicionar evento dedicado de checkout iniciado pra fechar o funil de ponta a ponta.';
    }
  }

  // ===== Top experiências =====
  function renderTopExperiences(bookingsInRange, eventsInRange, expById) {
    const tbody = document.getElementById('ana-top-experiences-body');
    if (!tbody) return;
    const stats = new Map();
    bookingsInRange.forEach(b => {
      if (b.status !== 'pago') return;
      const key = b.experiencia_id || b.experiencia_nome || '—';
      const exp = b.experiencia_id ? expById.get(b.experiencia_id) : null;
      const nome = b.experiencia_nome || (exp && exp.nome) || '—';
      if (isTestExperience(nome)) return;
      const e = stats.get(key) || { nome, vendas: 0, receita: 0, views: 0 };
      e.vendas += 1;
      e.receita += Number(b.amount_total) || 0;
      stats.set(key, e);
    });
    eventsInRange.forEach(ev => {
      if (ev.event_name !== 'experience_card_click' && ev.event_name !== 'exp_detail_open') return;
      const id = ev.target_id || ev.target_label;
      if (!id) return;
      const exp = expById.get(id);
      const key = exp ? exp.id : id;
      const nome = exp ? exp.nome : (ev.target_label || '—');
      if (isTestExperience(nome)) return;
      const e = stats.get(key) || { nome, vendas: 0, receita: 0, views: 0 };
      e.views += 1;
      stats.set(key, e);
    });
    const rows = Array.from(stats.values())
      .sort((a, b) => b.receita - a.receita || b.vendas - a.vendas || b.views - a.views)
      .slice(0, 10);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin__table-empty">Sem vendas nem visualizações no período.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => {
      const conv = r.views > 0 ? r.vendas / r.views : null;
      const convPill = conv == null
        ? '<span class="ana-conv-pill">—</span>'
        : (conv >= 0.05
          ? `<span class="ana-conv-pill ana-conv-pill--good">${fmtPct(conv)}</span>`
          : conv >= 0.01
            ? `<span class="ana-conv-pill ana-conv-pill--warn">${fmtPct(conv)}</span>`
            : `<span class="ana-conv-pill">${fmtPct(conv)}</span>`);
      return `
        <tr>
          <td>${escapeHtml(r.nome)}</td>
          <td class="ana-num">${r.vendas}</td>
          <td class="ana-num">${fmtBRL(r.receita)}</td>
          <td class="ana-num">${r.views || '—'}</td>
          <td class="ana-num">${convPill}</td>
        </tr>
      `;
    }).join('');
  }

  // ===== Top fornecedores =====
  function renderTopSuppliers(bookingsInRange, expById) {
    const tbody = document.getElementById('ana-top-suppliers-body');
    if (!tbody) return;
    const stats = new Map();
    bookingsInRange.forEach(b => {
      if (b.status !== 'pago') return;
      const exp = b.experiencia_id ? expById.get(b.experiencia_id) : null;
      const fn = (b.fornecedor_nome && b.fornecedor_nome.trim())
        || (exp && exp.fornecedorNome && String(exp.fornecedorNome).trim())
        || '';
      if (!fn) return;
      const k = fn.toLowerCase();
      const e = stats.get(k) || { nome: fn, vendas: 0, receita: 0 };
      e.vendas += 1;
      e.receita += Number(b.amount_total) || 0;
      stats.set(k, e);
    });
    const rows = Array.from(stats.values()).sort((a, b) => b.receita - a.receita).slice(0, 10);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin__table-empty">Sem vendas com fornecedor identificado no período.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.nome)}</td>
        <td class="ana-num">${r.vendas}</td>
        <td class="ana-num">${fmtBRL(r.receita)}</td>
        <td class="ana-num">${fmtBRL(r.receita / r.vendas)}</td>
      </tr>
    `).join('');
  }

  // ===== Clientes =====
  function renderCustomers(bookingsInRange, allBookings, profiles, range) {
    const buyers = new Set();
    bookingsInRange.forEach(b => {
      if (b.status !== 'pago') return;
      const k = b.user_id || b.email;
      if (k) buyers.add(k);
    });
    // "Novo" = primeira compra paga é dentro do período.
    // Identifica buyers que tinham compras pagas ANTES do início do período.
    const priorBuyers = new Set();
    allBookings.forEach(b => {
      if (b.status !== 'pago') return;
      const t = new Date(b.created_at).getTime();
      if (t < range.start.getTime()) {
        const k = b.user_id || b.email;
        if (k) priorBuyers.add(k);
      }
    });
    let novos = 0, recorrentes = 0;
    buyers.forEach(k => {
      if (priorBuyers.has(k)) recorrentes += 1;
      else novos += 1;
    });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpi-buyers', buyers.size.toString());
    set('kpi-buyers-hint', buyers.size === 0
      ? '—'
      : `${Math.round(novos / buyers.size * 100)}% novos · ${Math.round(recorrentes / buyers.size * 100)}% recorrentes`);
    set('kpi-new', novos.toString());
    set('kpi-recurring', recorrentes.toString());
    const recHint = document.getElementById('kpi-recurring-hint');
    if (recHint) {
      recHint.textContent = priorBuyers.size > 0
        ? `${Math.round(recorrentes / priorBuyers.size * 100)}% da base anterior voltou`
        : 'já tinham comprado antes';
    }
    set('kpi-signups', (profiles || []).length.toString());
  }

  // ===== Loop principal =====
  async function renderAnalytics(forceRefresh) {
    if (!document.getElementById('panel-analytics')) return;
    if (forceRefresh) invalidateBookings();

    const curr = getCurrentRange();
    const prev = getPreviousRange(curr);

    const labelEl = document.getElementById('ana-period-label');
    if (labelEl) labelEl.textContent = curr.label + ' · comparado com ' + prev.label;

    // Carrega tudo em paralelo. Eventos: pega desde o início do período
    // anterior pra ter dados pra comparação de conversão.
    const [bookingsAll, experiences, profiles, eventsAll] = await Promise.all([
      getBookings(),
      getExperiences(),
      getProfiles(),
      window.ElarahAnalytics
        ? window.ElarahAnalytics.rawSelect({ since: prev.start.toISOString(), limit: 10000 })
        : Promise.resolve([])
    ]);

    const bookings = withoutTestBookings(bookingsAll);
    const expById = new Map();
    (experiences || []).forEach(e => { if (e && e.id) expById.set(e.id, e); });

    const bookingsCurr = bookings.filter(b => inRange(b.created_at, curr));
    const bookingsPrev = bookings.filter(b => inRange(b.created_at, prev));
    const eventsCurr = (eventsAll || []).filter(e => inRange(e.created_at, curr));
    const eventsPrev = (eventsAll || []).filter(e => inRange(e.created_at, prev));

    const kpiCurr = computeKpis(bookingsCurr, eventsCurr);
    const kpiPrev = computeKpis(bookingsPrev, eventsPrev);

    renderKpis(kpiCurr, kpiPrev);
    renderEvolutionChart(bookingsCurr, curr);
    renderFunnel(eventsCurr, bookingsCurr);
    renderTopExperiences(bookingsCurr, eventsCurr, expById);
    renderTopSuppliers(bookingsCurr, expById);
    renderCustomers(bookingsCurr, bookings, profiles, curr);
  }

  // ===== START =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
