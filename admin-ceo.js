// =============================================================
// ELARAH — Agente CEO (aba própria, client-side, custo zero)
// -------------------------------------------------------------
// Junta faturamento + vendas + tráfego + lotação + parceiros da
// SEMANA (vs semana anterior) e gera, por regra, um plano de
// "se eu fosse o CEO, nas próximas 2 semanas eu faria…".
// Renderiza em #ceo-root.
// =============================================================
(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || null; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function brl(cent) {
    var n = (Number(cent) || 0) / 100;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function pct(part, whole) { return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null; }
  function delta(cur, prev) { if (prev === 0) return cur > 0 ? 100 : null; if (prev == null) return null; return Math.round(((cur - prev) / prev) * 1000) / 10; }
  function inRange(ts, a, b) { return ts >= a && ts < b; }

  var DAY = 86400000;
  var loading = false;

  async function loadData() {
    var c = sb();
    if (!c) throw new Error('Supabase não carregou.');
    var now = Date.now();
    var since14 = new Date(now - 14 * DAY).toISOString();

    var bk = await c.from('bookings').select('amount_total, quantidade, experiencia_nome, status, created_at').gte('created_at', since14).limit(20000);
    if (bk.error) throw new Error('reservas: ' + bk.error.message);

    var ev = await c.from('analytics_events').select('event_name, created_at').gte('created_at', since14).limit(50000);
    var pf = await c.from('profiles').select('created_at').gte('created_at', since14).limit(50000);
    var pr = await c.from('prospects').select('status, origem, created_at').limit(50000);
    var rv = await c.from('reviews').select('nota, comentario, experiencia_nome, created_at').limit(5000);
    // Buscas do site (90d) — pra sugerir experiência/categoria nova.
    var since90 = new Date(now - 90 * DAY).toISOString();
    var se = await c.from('analytics_events').select('target_label, metadata').eq('event_name', 'search_used').gte('created_at', since90).limit(20000);

    // App instalado (PWA): quem abriu pela tela inicial estando logado (90d).
    var pwaEv = await c.from('analytics_events')
      .select('user_id, created_at, metadata')
      .eq('event_name', 'pwa_open')
      .not('user_id', 'is', null)
      .gte('created_at', since90).limit(20000);
    var pwaRows = (pwaEv && pwaEv.data) || [];
    var pwaUsers = [];
    var pwaIds = Array.from(new Set(pwaRows.map(function (r) { return r.user_id; }).filter(Boolean)));
    if (pwaIds.length) {
      var pu = await c.from('profiles').select('id, nome, email').in('id', pwaIds).limit(5000);
      pwaUsers = (pu && pu.data) || [];
    }

    var exps = [], slotsMap = new Map();
    try { if (window.ElarahData && ElarahData.getAllExperiences) exps = await ElarahData.getAllExperiences(); } catch (_) {}
    try { if (window.ElarahData && ElarahData.loadAllSlots) slotsMap = await ElarahData.loadAllSlots(); } catch (_) {}

    return {
      now: now,
      bookings: bk.data || [],
      events: (ev && ev.data) || [],
      profiles: (pf && pf.data) || [],
      prospects: (pr && pr.data) || [],
      reviews: (rv && rv.data) || [],
      searches: (se && se.data) || [],
      pwaRows: pwaRows, pwaUsers: pwaUsers,
      exps: exps, slotsMap: slotsMap,
    };
  }

  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  // Termo mais buscado que a Elarah NÃO oferece (candidato a experiência nova).
  function topUnmetSearch(searches, exps) {
    var oferta = exps.map(function (x) { return norm((x.nome || '') + ' ' + (x.categoria || '')); }).join(' | ');
    var map = {};
    searches.forEach(function (e) {
      var t = norm((e.metadata && e.metadata.term) || e.target_label || '');
      if (!t || t.length < 3) return;
      if (oferta.indexOf(t) !== -1) return; // já oferecemos algo parecido
      map[t] = (map[t] || 0) + 1;
    });
    var rows = Object.keys(map).map(function (t) { return { termo: t, total: map[t] }; }).sort(function (a, b) { return b.total - a.total; });
    return rows[0] && rows[0].total >= 2 ? rows[0] : null;
  }

  function qOf(b) { var q = Number(b.quantidade); return Number.isFinite(q) && q > 0 ? q : 1; }

  function occupancy(exps, slotsMap, now) {
    var out = [];
    exps.forEach(function (e) {
      if (!e || !e.id) return;
      var slots = (slotsMap && slotsMap.get) ? (slotsMap.get(e.id) || []) : [];
      var hasFuture = true;
      try { if (window.ElarahData && ElarahData.experienceFutureDates) hasFuture = ElarahData.experienceFutureDates(e, slots, now).length > 0; } catch (_) {}
      if (!hasFuture) return;
      var total = 0, rest = 0, contou = false;
      slots.forEach(function (s) {
        if (s.isActive === false || s.vagasTotal == null) return;
        contou = true; total += Number(s.vagasTotal) || 0;
        rest += (s.vagasRestantes != null ? Number(s.vagasRestantes) : Number(s.vagasTotal)) || 0;
      });
      if (!contou || total <= 0) return;
      out.push({ nome: e.nome || '—', fill: Math.round(((total - rest) / total) * 100) });
    });
    return out.sort(function (a, b) { return b.fill - a.fill; });
  }

  function compute(d) {
    var now = d.now;
    var w1a = now - 7 * DAY, w1b = now;          // esta semana
    var w0a = now - 14 * DAY, w0b = now - 7 * DAY; // semana anterior

    function paidSum(a, b) {
      var fat = 0, vendas = 0;
      d.bookings.forEach(function (x) {
        if (x.status !== 'pago') return;
        var ts = new Date(x.created_at).getTime();
        if (!inRange(ts, a, b)) return;
        fat += Number(x.amount_total) || 0; vendas += qOf(x);
      });
      return { fat: fat, vendas: vendas };
    }
    function evCount(name, a, b) {
      var n = 0;
      d.events.forEach(function (e) {
        if (e.event_name !== name) return;
        var ts = new Date(e.created_at).getTime();
        if (inRange(ts, a, b)) n++;
      });
      return n;
    }
    function profCount(a, b) {
      var n = 0; d.profiles.forEach(function (p) { var ts = new Date(p.created_at).getTime(); if (inRange(ts, a, b)) n++; }); return n;
    }

    var cur = paidSum(w1a, w1b), prev = paidSum(w0a, w0b);
    var visitas = evCount('page_view', w1a, w1b), visitasPrev = evCount('page_view', w0a, w0b);
    var cadastros = profCount(w1a, w1b), cadastrosPrev = profCount(w0a, w0b);
    // App instalado (PWA): aberturas pelo ícone da tela inicial (iPhone + Android)
    var pwaOpens = evCount('pwa_open', w1a, w1b), pwaOpensPrev = evCount('pwa_open', w0a, w0b);

    // Funil desta semana
    var steps = [
      { ev: 'page_view', label: 'Visitas' },
      { ev: 'experience_detail_view', label: 'Viu experiência' },
      { ev: 'cta_click', label: 'Clicou em Reservar' },
      { ev: 'checkout_started', label: 'Iniciou checkout' },
    ];
    var funnel = steps.map(function (s) { return { label: s.label, total: evCount(s.ev, w1a, w1b) }; });
    var worst = null;
    for (var i = 1; i < funnel.length; i++) {
      var p = funnel[i - 1], s2 = funnel[i];
      if (p.total > 0) {
        var conv = pct(s2.total, p.total);
        if (worst == null || (conv != null && conv < worst.conv)) worst = { de: p.label, para: s2.label, conv: conv == null ? 0 : conv };
      }
    }

    // Top seller da semana
    var sellMap = {};
    d.bookings.forEach(function (x) {
      if (x.status !== 'pago') return;
      var ts = new Date(x.created_at).getTime(); if (!inRange(ts, w1a, w1b)) return;
      var k = x.experiencia_nome || '—'; sellMap[k] = (sellMap[k] || 0) + qOf(x);
    });
    var topSeller = Object.keys(sellMap).map(function (k) { return { nome: k, v: sellMap[k] }; }).sort(function (a, b) { return b.v - a.v; })[0] || null;

    // Cancelamentos/reembolsos da semana
    var cancel = 0;
    d.bookings.forEach(function (x) {
      if (x.status !== 'cancelado' && x.status !== 'reembolsado') return;
      var ts = new Date(x.created_at).getTime(); if (inRange(ts, w1a, w1b)) cancel++;
    });

    // Prospects
    var leadsSemana = 0, pendentes = 0;
    d.prospects.forEach(function (p) {
      if (p.status === 'nao_contatado') pendentes++;
      if (p.origem === 'google_places') { var ts = new Date(p.created_at).getTime(); if (inRange(ts, w1a, w1b)) leadsSemana++; }
    });

    var occ = occupancy(d.exps, d.slotsMap, now);
    var lotando = occ.filter(function (o) { return o.fill >= 80; });
    var encalhada = occ.filter(function (o) { return o.fill <= 20; });

    var conv = pct(cur.vendas, visitas);
    var ticket = cur.vendas > 0 ? Math.round(cur.fat / cur.vendas) : 0;

    // Avaliações (feedback do cliente)
    var rv = d.reviews || [];
    var notaSoma = 0, baixasSemana = 0;
    rv.forEach(function (x) {
      notaSoma += Number(x.nota) || 0;
      var ts = new Date(x.created_at).getTime();
      if ((Number(x.nota) || 0) <= 2 && inRange(ts, w1a, w1b)) baixasSemana++;
    });
    var notaMedia = rv.length ? Math.round((notaSoma / rv.length) * 10) / 10 : null;
    var unmet = topUnmetSearch(d.searches || [], d.exps || []);

    return {
      cur: cur, prev: prev, visitas: visitas, visitasPrev: visitasPrev,
      cadastros: cadastros, cadastrosPrev: cadastrosPrev, conv: conv, ticket: ticket,
      pwaOpens: pwaOpens, pwaOpensPrev: pwaOpensPrev,
      funnel: funnel, worst: worst, topSeller: topSeller, cancel: cancel,
      leadsSemana: leadsSemana, pendentes: pendentes, lotando: lotando, encalhada: encalhada,
      notaMedia: notaMedia, totalReviews: rv.length, baixasSemana: baixasSemana, unmet: unmet,
    };
  }

  // Gera o plano "se eu fosse CEO". Cada ação: {p: prioridade(1 alta..3), txt}
  function plano(m) {
    var acoes = [];
    var dV = delta(m.cur.vendas, m.prev.vendas);
    if (dV != null && dV < 0) acoes.push({ p: dV <= -20 ? 1 : 2, txt: '📉 <strong>Vendas caíram ' + Math.abs(dV) + '%</strong> vs. a semana passada. Reativar quem visitou e não comprou (e-mail/novidade) e checar se alguma campanha caiu.' });
    if (m.worst && m.worst.conv != null) {
      var l = m.worst.para.toLowerCase();
      var rec = l.indexOf('experiência') !== -1 ? 'reveja a vitrine da home (fotos/títulos).'
        : l.indexOf('reservar') !== -1 ? 'reveja preço, datas e clareza do botão Reservar na página.'
        : l.indexOf('checkout') !== -1 ? 'tire atrito entre Reservar e o checkout.'
        : 'investigue por que param aí.';
      acoes.push({ p: m.worst.conv < 20 ? 1 : 2, txt: '🔍 <strong>Maior vazamento do funil: ' + esc(m.worst.de) + ' → ' + esc(m.worst.para) + ' (' + m.worst.conv + '%)</strong> — ' + rec });
    }
    m.lotando.slice(0, 2).forEach(function (o) { acoes.push({ p: 1, txt: '🔥 <strong>' + esc(o.nome) + '</strong> está ' + o.fill + '% lotada — <strong>abra nova data/turma</strong> enquanto a demanda está quente.' }); });
    if (m.pendentes >= 5) acoes.push({ p: 2, txt: '🤝 Você tem <strong>' + m.pendentes + ' parceiros não contatados</strong> na Prospecção. Meta: contatar os <strong>10 melhores</strong> nas próximas 2 semanas.' });
    m.encalhada.slice(0, 2).forEach(function (o) { acoes.push({ p: 3, txt: '🐢 <strong>' + esc(o.nome) + '</strong> está só ' + o.fill + '% cheia — reposicione (preço/foto) ou divulgue, senão pause.' }); });
    if (m.conv != null && m.conv < 1 && m.visitas >= 100) acoes.push({ p: 2, txt: '🛒 <strong>Conversão em ' + m.conv + '%</strong> — reduza atrito no checkout e destaque o carro-chefe na home.' });
    if (m.topSeller) acoes.push({ p: 2, txt: '🏆 <strong>Dobre no carro-chefe (' + esc(m.topSeller.nome) + ')</strong>: campanha dedicada + mais turmas. O que já vende, vende mais com empurrão.' });
    if (m.cancel >= 3) acoes.push({ p: 1, txt: '⚠️ <strong>' + m.cancel + ' cancelamentos/reembolsos</strong> essa semana — investigue o motivo (preço? data? expectativa?).' });
    // Criar experiência nova (do que buscam e não temos)
    if (m.unmet) acoes.push({ p: 2, txt: '✨ <strong>Criar uma experiência de "' + esc(m.unmet.termo) + '"</strong> — ' + m.unmet.total + ' pessoa(s) buscaram isso no site e a Elarah não tem. Demanda esperando.' });
    // Feedback do cliente
    if (m.baixasSemana >= 1) acoes.push({ p: 1, txt: '😟 <strong>' + m.baixasSemana + ' avaliação(ões) baixa(s) (≤2) esta semana</strong> — fale com esses clientes, entenda e recupere a relação.' });
    if (m.totalReviews === 0) acoes.push({ p: 2, txt: '⭐ <strong>Ative o sistema de avaliações</strong> (já está pronto) — sem prova social na página você perde conversão todo dia.' });
    else if (m.notaMedia != null && m.notaMedia < 4) acoes.push({ p: 1, txt: '⭐ <strong>Nota média em ' + String(m.notaMedia).replace('.', ',') + '</strong> — abaixo de 4 acende alerta. Leia os comentários e aja na causa.' });

    acoes.sort(function (a, b) { return a.p - b.p; });
    return acoes.slice(0, 6);
  }

  function kpi(label, value, deltaPct, invert) {
    var d = deltaPct;
    var arrow = '', color = '#888';
    if (d != null) {
      var good = invert ? d < 0 : d > 0;
      arrow = (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + Math.abs(d) + '%';
      color = d === 0 ? '#888' : good ? '#1c7a43' : '#b3261e';
    }
    return '<div style="background:#fff8ee;border:1px solid #f0d8bf;border-radius:12px;padding:13px 15px;">' +
      '<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.4px;color:#a4663b;">' + esc(label) + '</div>' +
      '<div style="font-size:1.5rem;font-weight:800;color:#1a1a1a;margin-top:2px;">' + esc(value) + '</div>' +
      (d != null ? '<div style="font-size:.74rem;color:' + color + ';margin-top:2px;">' + arrow + ' vs. semana passada</div>' : '') +
      '</div>';
  }

  // Agrupa as aberturas do app por pessoa (só quem tem conta).
  function pwaUsersList(rows, users) {
    var byId = {};
    (users || []).forEach(function (u) { byId[u.id] = u; });
    var agg = {};
    (rows || []).forEach(function (r) {
      var id = r.user_id; if (!id) return;
      if (!agg[id]) agg[id] = { count: 0, last: 0, platform: '' };
      agg[id].count++;
      var ts = new Date(r.created_at).getTime();
      if (ts > agg[id].last) {
        agg[id].last = ts;
        agg[id].platform = (r.metadata && r.metadata.platform) || '';
      }
    });
    return Object.keys(agg).map(function (id) {
      var a = agg[id], u = byId[id] || {};
      return {
        nome: u.nome || '(cliente sem nome no cadastro)',
        email: u.email || '',
        count: a.count, last: a.last, platform: a.platform
      };
    }).sort(function (a, b) { return b.last - a.last; });
  }

  function pwaSection(d) {
    var list = pwaUsersList(d.pwaRows, d.pwaUsers);
    var head = '<h2 style="font-family:Georgia,serif;font-size:1.25rem;color:#1a1a1a;margin:22px 0 4px;">📱 Quem está usando o app</h2>' +
      '<p style="margin:0 0 12px;font-size:.8rem;color:#999;">Clientes cadastrados que abriram o app pela tela inicial (últimos 90 dias). Visitantes sem conta não aparecem aqui.</p>';
    if (!list.length) {
      return head + '<p style="font-size:.9rem;color:#666;background:#faf6f0;border-radius:12px;padding:13px 16px;margin:0 0 4px;">Ninguém com conta abriu o app ainda — ou quem abriu não estava logado. Assim que clientes cadastrados usarem o app, eles aparecem aqui. 🧡</p>';
    }
    var rows = list.slice(0, 100).map(function (u) {
      var plat = u.platform === 'ios' ? '🍎 iPhone' : (u.platform === 'android_desktop' ? '🤖 Android' : '');
      var quando = u.last ? new Date(u.last).toLocaleDateString('pt-BR') : '—';
      return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;background:#fff;border:1px solid #eee;border-radius:10px;padding:10px 13px;">' +
        '<div style="min-width:0;"><div style="font-size:.92rem;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(u.nome) + '</div>' +
        '<div style="font-size:.78rem;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(u.email) + '</div></div>' +
        '<div style="text-align:right;font-size:.78rem;color:#666;white-space:nowrap;">' + u.count + ' abertura' + (u.count > 1 ? 's' : '') + '<br>' + quando + ' ' + plat + '</div></div>';
    }).join('');
    return head + '<div style="display:grid;gap:8px;margin-bottom:4px;">' + rows + '</div>';
  }

  function render(d) {
    var root = el('ceo-root');
    if (!root) return;
    var m = compute(d);
    var acoes = plano(m);

    var dV = delta(m.cur.vendas, m.prev.vendas);
    var dF = delta(m.cur.fat, m.prev.fat);
    var saude = m.cur.vendas === 0 ? { t: 'Semana fria', bg: '#fdeaea', fg: '#b3261e' }
      : (dV != null && dV < -20) ? { t: 'Requer atenção', bg: '#fff4e0', fg: '#a4663b' }
      : { t: 'No caminho', bg: '#e6f6ec', fg: '#1c7a43' };

    var trend = dV == null ? '' : dV > 0 ? ' Vendas subiram ' + dV + '% vs. a semana passada.' : dV < 0 ? ' Vendas caíram ' + Math.abs(dV) + '%.' : ' Vendas estáveis.';
    var resumo = 'Nesta semana: <strong>' + brl(m.cur.fat) + '</strong> de faturamento em <strong>' + m.cur.vendas + '</strong> venda(s), conversão ' +
      (m.conv == null ? '—' : m.conv + '%') + ', ' + m.cadastros + ' cadastro(s) novo(s) e ' + m.leadsSemana + ' lead(s) de parceiro.' + trend +
      (m.notaMedia != null ? ' Nota média dos clientes: ' + String(m.notaMedia).replace('.', ',') + ' (' + m.totalReviews + ').' : '') +
      (m.worst ? ' Maior gargalo: ' + esc(m.worst.de) + ' → ' + esc(m.worst.para) + '.' : '');

    root.innerHTML =
      '<div style="display:inline-block;font-size:.72rem;font-weight:700;text-transform:uppercase;padding:3px 12px;border-radius:999px;background:' + saude.bg + ';color:' + saude.fg + ';margin-bottom:12px;">' + esc(saude.t) + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px;">' +
      kpi('Faturamento', brl(m.cur.fat), dF, false) +
      kpi('Vendas', String(m.cur.vendas), dV, false) +
      kpi('Conversão', m.conv == null ? '—' : m.conv + '%', null, false) +
      kpi('Cadastros novos', String(m.cadastros), delta(m.cadastros, m.cadastrosPrev), false) +
      kpi('📱 Aberturas do app', String(m.pwaOpens), delta(m.pwaOpens, m.pwaOpensPrev), false) +
      '</div>' +
      '<p style="font-size:.95rem;line-height:1.6;color:#2a2a2a;background:#faf6f0;border-radius:12px;padding:13px 16px;margin:0 0 20px;">' + resumo + '</p>' +

      '<h2 style="font-family:Georgia,serif;font-size:1.25rem;color:#1a1a1a;margin:0 0 4px;">Se eu fosse o CEO, nas próximas 2 semanas eu faria:</h2>' +
      '<p style="margin:0 0 12px;font-size:.8rem;color:#999;">Por ordem de prioridade — do mais urgente pro estrutural.</p>' +
      '<ol style="margin:0;padding:0;list-style:none;display:grid;gap:10px;">' +
      acoes.map(function (a, i) {
        var cor = a.p === 1 ? '#b3261e' : a.p === 2 ? '#a4663b' : '#5a6472';
        var lbl = a.p === 1 ? 'AGORA' : a.p === 2 ? 'IMPORTANTE' : 'QUANDO DER';
        return '<li style="display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;background:#fff;border:1px solid #eee;border-left:4px solid ' + cor + ';border-radius:10px;padding:11px 13px;">' +
          '<div style="font-size:1.1rem;font-weight:800;color:' + cor + ';">' + (i + 1) + '</div>' +
          '<div><div style="font-size:.64rem;font-weight:700;letter-spacing:.4px;color:' + cor + ';margin-bottom:2px;">' + lbl + '</div>' +
          '<div style="font-size:.9rem;line-height:1.5;color:#333;">' + a.txt + '</div></div></li>';
      }).join('') + '</ol>' +

      pwaSection(d) +

      '<details style="margin-top:18px;"><summary style="cursor:pointer;font-size:.82rem;color:#888;">Ver números completos da semana</summary>' +
      '<div style="font-size:.84rem;color:#555;line-height:1.7;margin-top:8px;">' +
      'Funil: ' + m.funnel.map(function (s) { return esc(s.label) + ' ' + s.total; }).join(' → ') + '<br>' +
      'Ticket médio: ' + brl(m.ticket) + ' · Visitas: ' + m.visitas + ' · Cancelamentos: ' + m.cancel + '<br>' +
      'Parceiros: ' + m.leadsSemana + ' novos esta semana · ' + m.pendentes + ' não contatados no total · ' +
      m.lotando.length + ' turma(s) lotando · ' + m.encalhada.length + ' encalhada(s).' +
      '</div></details>';
  }

  async function run() {
    if (loading) return;
    loading = true;
    var root = el('ceo-root');
    if (root) root.innerHTML = '<div style="color:#999;font-size:.9rem;">Lendo faturamento, tráfego, lotação e parceiros…</div>';
    try { render(await loadData()); }
    catch (e) { if (root) root.innerHTML = '<div style="color:#b3261e;font-size:.9rem;">Falha: ' + esc(e.message || e) + '</div>'; }
    finally { loading = false; }
  }

  function init() {
    var btn = el('ceo-refresh');
    if (btn && !btn.dataset.wired) { btn.dataset.wired = '1'; btn.addEventListener('click', run); }
    var nav = document.querySelector('[data-panel="ceo"]');
    if (nav && !nav.dataset.ceoWired) { nav.dataset.ceoWired = '1'; nav.addEventListener('click', function () { setTimeout(run, 150); }); }
    var p = document.getElementById('panel-ceo');
    if (p && p.classList.contains('admin__panel--active')) run();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
