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
  // Contexto de tráfego/UTM persistido na sessão. Capturado da PRIMEIRA
  // página da sessão (referrer + utm_*) e enviado em TODOS os eventos
  // até a sessão expirar. Crítico pra atribuição: queremos saber se
  // o usuário que comprou veio de Instagram ads, orgânico, link direto
  // de WhatsApp, etc.
  const TRAFFIC_KEY = 'elarah_analytics_traffic';

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

  // Detecta device/browser/OS do user-agent. Heurística leve — sem
  // dependência externa. Resultado é apenas pra agrupar no admin
  // (mobile vs desktop, Chrome vs Safari, etc.) — precisão de 90%
  // é suficiente.
  function parseDevice(ua) {
    const u = String(ua || '').toLowerCase();
    let device = 'desktop';
    if (/mobi|iphone|ipod|android.*mobile|blackberry|windows phone/.test(u)) device = 'mobile';
    else if (/ipad|tablet|android(?!.*mobile)/.test(u)) device = 'tablet';
    let browser = 'other';
    if (/edg\//.test(u)) browser = 'edge';
    else if (/chrome\//.test(u) && !/edg\//.test(u)) browser = 'chrome';
    else if (/firefox\//.test(u)) browser = 'firefox';
    else if (/safari\//.test(u) && !/chrome\//.test(u)) browser = 'safari';
    else if (/opr\//.test(u)) browser = 'opera';
    let os = 'other';
    if (/windows/.test(u)) os = 'windows';
    else if (/mac os/.test(u)) os = 'mac';
    else if (/iphone|ipad|ipod/.test(u)) os = 'ios';
    else if (/android/.test(u)) os = 'android';
    else if (/linux/.test(u)) os = 'linux';
    return { device, browser, os };
  }

  // Extrai UTM params + alias comuns (gclid, fbclid). Retorna objeto
  // com chaves só pros params presentes — assim o metadata fica enxuto.
  function extractUtmFromUrl(href) {
    try {
      const u = new URL(href);
      const out = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
        .forEach(k => { const v = u.searchParams.get(k); if (v) out[k] = v.slice(0, 100); });
      const gclid = u.searchParams.get('gclid');
      if (gclid) out.gclid = gclid.slice(0, 200);
      const fbclid = u.searchParams.get('fbclid');
      if (fbclid) out.fbclid = fbclid.slice(0, 200);
      return out;
    } catch { return {}; }
  }

  // Source bonita derivada do referrer quando não há utm_source.
  // Permite no admin ver "instagram", "whatsapp", "google" sem
  // depender de tagueamento perfeito.
  function deriveSourceFromReferrer(ref) {
    if (!ref) return null;
    const r = String(ref).toLowerCase();
    if (/instagram\.com/.test(r)) return 'instagram';
    if (/wa\.me|whatsapp\.com/.test(r)) return 'whatsapp';
    if (/facebook\.com|fb\.com/.test(r)) return 'facebook';
    if (/google\./.test(r)) return 'google';
    if (/bing\./.test(r)) return 'bing';
    if (/tiktok\.com/.test(r)) return 'tiktok';
    if (/twitter\.com|x\.com/.test(r)) return 'twitter';
    if (/youtube\.com/.test(r)) return 'youtube';
    if (/linkedin\.com/.test(r)) return 'linkedin';
    return 'referral';
  }

  // Captura o contexto de tráfego na PRIMEIRA visita da sessão.
  // Subsequentes hits dentro da mesma sessão preservam a origem
  // original — um usuário que entrou via UTM do Instagram e
  // navegou pelo site continua atribuído ao Instagram até a sessão
  // expirar (30min de inatividade).
  function ensureTrafficContext() {
    try {
      const raw = sessionStorage.getItem(TRAFFIC_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.captured_at) return parsed;
      }
    } catch {}
    const utm = extractUtmFromUrl(window.location.href);
    const referrer = document.referrer || '';
    const utmSource = utm.utm_source || deriveSourceFromReferrer(referrer) || (referrer ? null : 'direct');
    const ctx = {
      captured_at: nowISO(),
      landing_page: pageKey(),
      landing_path: (window.location.pathname || '') + (window.location.search || ''),
      referrer: referrer.slice(0, 500),
      utm_source: utmSource,
      utm_medium: utm.utm_medium || (referrer ? 'referral' : (utmSource === 'direct' ? 'none' : null)),
      utm_campaign: utm.utm_campaign || null,
      utm_term: utm.utm_term || null,
      utm_content: utm.utm_content || null,
      gclid: utm.gclid || null,
      fbclid: utm.fbclid || null,
    };
    try { sessionStorage.setItem(TRAFFIC_KEY, JSON.stringify(ctx)); } catch {}
    return ctx;
  }

  function getViewport() {
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 0,
      h: window.innerHeight || document.documentElement.clientHeight || 0,
    };
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
      // Contexto automático: contexto de tráfego (UTM/referrer) +
      // device/browser/OS + viewport. Vai em TODO evento pra que o
      // admin consiga atribuir compras a campanhas/origens sem
      // precisar de queries malucas.
      const traffic = ensureTrafficContext();
      const ua = navigator.userAgent || '';
      const dev = parseDevice(ua);
      const vp = getViewport();
      const baseMeta = {
        utm_source: traffic.utm_source,
        utm_medium: traffic.utm_medium,
        utm_campaign: traffic.utm_campaign,
        utm_term: traffic.utm_term,
        utm_content: traffic.utm_content,
        gclid: traffic.gclid,
        fbclid: traffic.fbclid,
        referrer: traffic.referrer,
        landing_page: traffic.landing_page,
        device: dev.device,
        browser: dev.browser,
        os: dev.os,
        viewport_w: vp.w,
        viewport_h: vp.h,
      };
      // Caller metadata wins (caso queira sobrescrever algum campo).
      const metadata = Object.assign({}, baseMeta, opts.metadata || {});
      // Limpa null/undefined pra deixar o jsonb enxuto.
      Object.keys(metadata).forEach(k => {
        if (metadata[k] == null || metadata[k] === '') delete metadata[k];
      });

      const row = {
        event_name: String(eventName),
        category: String(opts.category || 'general'),
        target_id: opts.targetId != null ? String(opts.targetId) : null,
        target_label: opts.targetLabel != null ? String(opts.targetLabel).slice(0, 200) : null,
        page: pageKey(),
        path: (window.location.pathname || '') + (window.location.search || ''),
        session_id: getSessionId(),
        user_id: currentUserId,
        metadata: metadata,
        user_agent: ua.slice(0, 300)
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

        // WhatsApp clicks — qualquer link wa.me OU api.whatsapp.com.
        // Importante pra entender se WhatsApp gera mais conversão
        // do que outros canais de saída.
        const waLink = target.closest('a[href*="wa.me/"], a[href*="api.whatsapp.com"]');
        if (waLink) {
          track('whatsapp_click', {
            category: 'outbound',
            targetLabel: (waLink.textContent || '').trim().slice(0, 80) || 'whatsapp',
            metadata: { href: (waLink.getAttribute('href') || '').slice(0, 200) }
          });
          // Não return — pode ter outras heurísticas relevantes pra
          // mesma URL (ex: data-analytics no link).
        }

        // Gift card clicks — botões/links em /presentear, /grupos,
        // ou em qualquer card de gift card.
        const giftEl = target.closest('[data-gift-card], .gift-card-btn, [href*="presentear"]');
        if (giftEl) {
          track('gift_card_click', {
            category: 'gift_card',
            targetLabel: (giftEl.textContent || '').trim().slice(0, 80) || 'gift_card',
            targetId: giftEl.getAttribute('data-gift-card') || null
          });
        }

        // Favorite (coração nos cards). Já tem listener próprio em
        // script.js que chama ElarahAuth — adicionamos só o tracking
        // sem mexer naquela lógica.
        const favBtn = target.closest('.card__favorite');
        if (favBtn) {
          track('favorite_click', {
            category: 'engagement',
            targetId: favBtn.getAttribute('data-id') || null,
            targetLabel: (favBtn.getAttribute('aria-label') || 'Favoritar').slice(0, 80)
          });
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
