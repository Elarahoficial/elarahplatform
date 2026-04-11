/* =============================================
   ELARAH — ANALYTICS
   - Gravador de eventos em public.analytics_events.
   - Registra page_view automático no load.
   - Captura cliques em qualquer [data-analytics]
     e também em âncoras/botões conhecidos da home
     (experience cards, tabs, by elarah cards etc).
   - Seguro: se Supabase não estiver disponível,
     vira no-op e nunca quebra o site.
   - Expõe window.ElarahAnalytics.track(name, meta)
     para instrumentação manual.
   ============================================= */

(function (window, document) {
  'use strict';

  const TABLE = 'analytics_events';
  const SESSION_KEY = 'elarah_analytics_session';
  const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

  function sb() {
    return window.supabaseClient || null;
  }

  function nowISO() { return new Date().toISOString(); }

  function pageKey() {
    const path = window.location.pathname || '';
    const match = path.match(/([^/]+\.html)$/i);
    if (match) return match[1].toLowerCase();
    if (path.endsWith('/') || path === '') return 'index.html';
    return path.toLowerCase();
  }

  function getSessionId() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.ts && (Date.now() - parsed.ts) < SESSION_TTL_MS) {
          // renova timestamp
          parsed.ts = Date.now();
          localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
          return parsed.id;
        }
      }
    } catch {}
    const id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
    } catch {}
    return id;
  }

  let currentUserId = null;
  function primeUser() {
    const client = sb();
    if (!client) return;
    client.auth.getSession().then(res => {
      const s = res && res.data && res.data.session;
      currentUserId = s && s.user ? s.user.id : null;
    }).catch(() => {});
    try {
      client.auth.onAuthStateChange((_evt, session) => {
        currentUserId = session && session.user ? session.user.id : null;
      });
    } catch {}
  }

  async function track(eventName, opts) {
    try {
      if (!eventName) return;
      const client = sb();
      if (!client) return; // no-op sem Supabase

      opts = opts || {};
      const row = {
        event_name: String(eventName),
        category: String(opts.category || 'general'),
        target_id: opts.targetId != null ? String(opts.targetId) : null,
        target_label: opts.targetLabel != null ? String(opts.targetLabel).slice(0, 200) : null,
        page: pageKey(),
        path: (window.location.pathname || '') + (window.location.search || ''),
        session_id: getSessionId(),
        user_id: currentUserId,
        metadata: opts.metadata || {},
        user_agent: (navigator.userAgent || '').slice(0, 300)
      };

      const { error } = await client.from(TABLE).insert(row);
      if (error && window.ElarahAnalyticsDebug) {
        console.warn('[ElarahAnalytics] insert error', error);
      }
    } catch (e) {
      if (window.ElarahAnalyticsDebug) {
        console.warn('[ElarahAnalytics] track exception', e);
      }
    }
  }

  function trackPageView(extra) {
    track('page_view', {
      category: 'page',
      targetId: pageKey(),
      targetLabel: document.title || '',
      metadata: Object.assign({
        referrer: document.referrer || ''
      }, extra || {})
    });
  }

  // Auto-instrumentação por data-attributes:
  //   <button data-analytics="cta-comprar"
  //           data-analytics-category="cta"
  //           data-analytics-label="Comprar agora">...</button>
  function wireAutoClicks() {
    document.addEventListener('click', function (e) {
      try {
        const el = e.target && e.target.closest
          ? e.target.closest('[data-analytics]')
          : null;
        if (!el) return;
        const name = el.getAttribute('data-analytics') || 'click';
        const category = el.getAttribute('data-analytics-category') || 'click';
        const label = el.getAttribute('data-analytics-label')
          || (el.textContent || '').trim().slice(0, 120);
        const targetId = el.getAttribute('data-analytics-id')
          || el.id
          || el.getAttribute('data-experience')
          || null;
        const metaRaw = el.getAttribute('data-analytics-meta');
        let metadata = {};
        if (metaRaw) {
          try { metadata = JSON.parse(metaRaw); } catch {}
        }
        track(name, { category, targetLabel: label, targetId, metadata });
      } catch {}
    }, true);
  }

  // Auto-instrumentação específica da home:
  // captura cliques em experiences cards, dropdown links,
  // botões de CTA, botões By Elarah e de grupo.
  function wireHomeHeuristics() {
    document.addEventListener('click', function (e) {
      try {
        const target = e.target;
        if (!target || !target.closest) return;

        // já capturado por data-analytics
        if (target.closest('[data-analytics]')) return;

        // By Elarah cards
        const originalsBtn = target.closest('.originals__card-btn');
        if (originalsBtn) {
          track('byelarah_card_click', {
            category: 'byelarah',
            targetId: originalsBtn.getAttribute('data-experience') || '',
            targetLabel: (originalsBtn.textContent || '').trim().slice(0, 120),
            metadata: { tipo: originalsBtn.getAttribute('data-type') || '' }
          });
          return;
        }

        // Experiences cards (home + categoria)
        const expCard = target.closest('[data-experience-id], .exp-card, .experience-card');
        if (expCard) {
          track('experience_card_click', {
            category: 'experience',
            targetId: expCard.getAttribute('data-experience-id')
              || expCard.getAttribute('data-id')
              || '',
            targetLabel: (expCard.querySelector && expCard.querySelector('.exp-card__title, .experience-card__title')
              ? expCard.querySelector('.exp-card__title, .experience-card__title').textContent.trim().slice(0, 120)
              : '')
          });
          return;
        }

        // Category dropdown links
        const dropdownItem = target.closest('.header__dropdown-item');
        if (dropdownItem) {
          track('category_nav_click', {
            category: 'navigation',
            targetId: dropdownItem.getAttribute('href') || '',
            targetLabel: (dropdownItem.textContent || '').trim().slice(0, 120)
          });
          return;
        }

        // Header nav
        const navLink = target.closest('.header__nav-link');
        if (navLink) {
          track('header_nav_click', {
            category: 'navigation',
            targetLabel: (navLink.textContent || '').trim().slice(0, 120),
            targetId: navLink.getAttribute('href') || navLink.id || ''
          });
          return;
        }

        // Botões de grupo (Aniversário / Corporativo / Meu grupo)
        const groupBtn = target.closest('.group-section__btn');
        if (groupBtn) {
          track('group_button_click', {
            category: 'group',
            targetLabel: groupBtn.getAttribute('data-event') || (groupBtn.textContent || '').trim().slice(0, 120)
          });
          return;
        }
      } catch {}
    }, true);
  }

  function init() {
    primeUser();
    wireAutoClicks();
    wireHomeHeuristics();
    // page view é disparado após carregar DOM — aguarda um tick
    // pra garantir que document.title já está pronto.
    setTimeout(() => trackPageView(), 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================
  // QUERY HELPERS (apenas admin)
  // ============================
  async function rawSelect(opts) {
    const client = sb();
    if (!client) return [];
    let q = client.from(TABLE).select('*');
    if (opts && opts.since) q = q.gte('created_at', opts.since);
    if (opts && opts.category) q = q.eq('category', opts.category);
    if (opts && opts.eventName) q = q.eq('event_name', opts.eventName);
    q = q.order('created_at', { ascending: false }).limit((opts && opts.limit) || 5000);
    const { data, error } = await q;
    if (error) {
      console.error('[ElarahAnalytics] rawSelect error', error);
      return [];
    }
    return data || [];
  }

  async function getAllEvents(sinceDays) {
    const since = sinceDays
      ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    return await rawSelect({ since, limit: 10000 });
  }

  window.ElarahAnalytics = {
    track,
    trackPageView,
    getSessionId,
    getAllEvents,
    rawSelect
  };
})(window, document);
