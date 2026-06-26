// =============================================================
// ELARAH — Agente de Eventos IA (seção dentro da aba Analytics)
// -------------------------------------------------------------
// 100% client-side, custo zero. Lê reservas pagas + experiências +
// slots (tudo que o admin já pode ler) e responde, por regra:
//   • o que VENDE MAIS  • temas (categorias) mais procurados
//   • sazonalidade (melhores meses)  • lotação das próximas turmas
//   • sugestões: onde buscar parceiro / o que rever.
// Renderiza em #evtia-root.
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
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  var loading = false;

  async function loadData() {
    var client = sb();
    if (!client) throw new Error('Supabase não carregou.');
    // Reservas pagas
    var bRes = await client.from('bookings')
      .select('experiencia_id, experiencia_nome, amount_total, quantidade, created_at, status')
      .eq('status', 'pago').limit(20000);
    if (bRes.error) throw new Error('Não consegui ler as reservas: ' + bRes.error.message);
    var bookings = bRes.data || [];

    // Experiências (categoria, nome, ativo) via ElarahData
    var exps = [];
    try {
      if (window.ElarahData && ElarahData.getAllExperiences) exps = await ElarahData.getAllExperiences();
    } catch (_) {}
    var byId = {};
    exps.forEach(function (e) { if (e && e.id) byId[e.id] = e; });

    // Slots (lotação)
    var slotsMap = new Map();
    try {
      if (window.ElarahData && ElarahData.loadAllSlots) slotsMap = await ElarahData.loadAllSlots();
    } catch (_) {}

    return { bookings: bookings, exps: exps, byId: byId, slotsMap: slotsMap };
  }

  function catOf(b, byId) {
    var e = b.experiencia_id ? byId[b.experiencia_id] : null;
    if (e && e.categoria) return String(e.categoria).trim();
    return '(sem categoria)';
  }
  function qOf(b) { var q = Number(b.quantidade); return Number.isFinite(q) && q > 0 ? q : 1; }

  // ---- Agregações ----
  function topSellers(bookings, byId) {
    var map = {};
    bookings.forEach(function (b) {
      var key = b.experiencia_id || b.experiencia_nome || '?';
      var nome = b.experiencia_nome || (byId[b.experiencia_id] && byId[b.experiencia_id].nome) || '—';
      var o = map[key] || (map[key] = { nome: nome, vendas: 0, receita: 0 });
      o.vendas += qOf(b); o.receita += Number(b.amount_total) || 0;
    });
    return Object.values(map).sort(function (a, b) { return b.receita - a.receita; });
  }
  function byTheme(bookings, byId) {
    var map = {};
    bookings.forEach(function (b) {
      var c = catOf(b, byId);
      var o = map[c] || (map[c] = { categoria: c, vendas: 0, receita: 0 });
      o.vendas += qOf(b); o.receita += Number(b.amount_total) || 0;
    });
    return Object.values(map).sort(function (a, b) { return b.vendas - a.vendas; });
  }
  function seasonality(bookings) {
    // Últimos 12 meses (chave AAAA-MM)
    var now = new Date();
    var keys = [];
    var map = {};
    for (var i = 11; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      keys.push({ k: k, label: MESES[d.getMonth()] + '/' + String(d.getFullYear()).slice(2) });
      map[k] = { vendas: 0, receita: 0 };
    }
    bookings.forEach(function (b) {
      if (!b.created_at) return;
      var d = new Date(b.created_at);
      if (isNaN(d)) return;
      var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      if (map[k]) { map[k].vendas += qOf(b); map[k].receita += Number(b.amount_total) || 0; }
    });
    return keys.map(function (x) { return { label: x.label, vendas: map[x.k].vendas, receita: map[x.k].receita }; });
  }
  function occupancy(exps, slotsMap) {
    var now = Date.now();
    var out = [];
    exps.forEach(function (e) {
      if (!e || !e.id) return;
      var slots = (slotsMap && slotsMap.get) ? (slotsMap.get(e.id) || []) : [];
      // só experiências com data futura
      var hasFuture = true;
      try {
        if (window.ElarahData && ElarahData.experienceFutureDates) {
          hasFuture = ElarahData.experienceFutureDates(e, slots, now).length > 0;
        }
      } catch (_) {}
      if (!hasFuture) return;
      var total = 0, rest = 0, contou = false;
      slots.forEach(function (s) {
        if (s.isActive === false) return;
        if (s.vagasTotal == null) return;
        contou = true;
        total += Number(s.vagasTotal) || 0;
        rest += (s.vagasRestantes != null ? Number(s.vagasRestantes) : Number(s.vagasTotal)) || 0;
      });
      if (!contou || total <= 0) return;
      var vendidas = Math.max(0, total - rest);
      out.push({ nome: e.nome || '—', categoria: e.categoria || '', total: total, vendidas: vendidas, fill: Math.round((vendidas / total) * 100) });
    });
    return out.sort(function (a, b) { return b.fill - a.fill; });
  }

  function activeCountByCat(exps) {
    var map = {};
    exps.forEach(function (e) {
      if (!e || e.isActive === false || !e.categoria) return;
      var c = String(e.categoria).trim();
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }

  // ---- Render ----
  function bar(val, max) {
    var pct = max > 0 ? Math.round((val / max) * 100) : 0;
    return '<div style="background:#f0e6d8;border-radius:6px;height:8px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:#f0a05e;"></div></div>';
  }

  function render(d) {
    var root = el('evtia-root');
    if (!root) return;
    var paid = d.bookings;
    if (!paid.length) {
      root.innerHTML = '<div style="color:#999;font-size:.9rem;">Ainda não há reservas pagas pra analisar. Assim que as vendas entrarem, o agente preenche aqui.</div>';
      return;
    }
    var sellers = topSellers(paid, d.byId);
    var themes = byTheme(paid, d.byId);
    var season = seasonality(paid);
    var occ = occupancy(d.exps, d.slotsMap);
    var catCount = activeCountByCat(d.exps);

    var maxRec = Math.max.apply(null, sellers.map(function (s) { return s.receita; }).concat([1]));
    var maxThemeV = Math.max.apply(null, themes.map(function (s) { return s.vendas; }).concat([1]));
    var maxSeason = Math.max.apply(null, season.map(function (s) { return s.vendas; }).concat([1]));

    // Sugestões por regra
    var sug = [];
    if (sellers[0]) sug.push('🏆 <strong>Carro-chefe:</strong> ' + esc(sellers[0].nome) + ' (' + sellers[0].vendas + ' vendas, ' + brl(sellers[0].receita) + ') — destaque na home e em campanha.');
    // tema com procura e pouca oferta
    themes.slice(0, 4).forEach(function (t) {
      if (t.categoria === '(sem categoria)') return;
      var ativos = catCount[t.categoria] || 0;
      if (t.vendas >= 3 && ativos <= 2) {
        sug.push('🔎 <strong>Procura alta em ' + esc(t.categoria) + '</strong> (' + t.vendas + ' vendas) mas só ' + ativos + ' experiência(s) ativa(s) — vale <strong>buscar mais parceiro de ' + esc(t.categoria) + '</strong>.');
      }
    });
    // melhor mês
    var bestMonth = season.slice().sort(function (a, b) { return b.vendas - a.vendas; })[0];
    if (bestMonth && bestMonth.vendas > 0) sug.push('📅 <strong>Mês mais forte:</strong> ' + esc(bestMonth.label) + ' (' + bestMonth.vendas + ' vendas) — prepare oferta/estoque pra repetir.');
    // quase lotando
    var quase = occ.filter(function (o) { return o.fill >= 80; }).slice(0, 3);
    quase.forEach(function (o) { sug.push('🔥 <strong>' + esc(o.nome) + '</strong> está ' + o.fill + '% lotada — pode <strong>abrir nova turma/data</strong>.'); });
    // encalhadas
    var encalhada = occ.filter(function (o) { return o.fill <= 20; }).slice(0, 3);
    encalhada.forEach(function (o) { sug.push('🐢 <strong>' + esc(o.nome) + '</strong> só ' + o.fill + '% cheia — rever preço/foto/divulgação.'); });

    function tbl(rows) { return rows.join(''); }

    root.innerHTML =
      // Top vendedoras
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Mais vendem</h3>' +
      '<div style="display:grid;gap:8px;margin-bottom:20px;">' +
      tbl(sellers.slice(0, 8).map(function (s) {
        return '<div style="display:grid;grid-template-columns:1fr 90px 80px;gap:10px;align-items:center;font-size:.85rem;">' +
          '<div><div style="color:#1a1a1a;font-weight:600;">' + esc(s.nome) + '</div>' + bar(s.receita, maxRec) + '</div>' +
          '<div style="text-align:right;color:#1c7a43;font-weight:700;">' + brl(s.receita) + '</div>' +
          '<div style="text-align:right;color:#666;">' + s.vendas + ' vend.</div></div>';
      })) + '</div>' +

      // Temas
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Temas mais procurados</h3>' +
      '<div style="display:grid;gap:8px;margin-bottom:20px;">' +
      tbl(themes.slice(0, 8).map(function (t) {
        return '<div style="display:grid;grid-template-columns:1fr 90px 70px;gap:10px;align-items:center;font-size:.85rem;">' +
          '<div><div style="color:#1a1a1a;font-weight:600;">' + esc(t.categoria) + '</div>' + bar(t.vendas, maxThemeV) + '</div>' +
          '<div style="text-align:right;color:#1c7a43;font-weight:700;">' + brl(t.receita) + '</div>' +
          '<div style="text-align:right;color:#666;">' + t.vendas + '</div></div>';
      })) + '</div>' +

      // Sazonalidade
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Sazonalidade (12 meses)</h3>' +
      '<div style="display:flex;gap:6px;align-items:flex-end;height:90px;margin-bottom:6px;">' +
      season.map(function (s) {
        var h = Math.round((s.vendas / maxSeason) * 78) + 2;
        return '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;" title="' + s.vendas + ' vendas · ' + brl(s.receita) + '">' +
          '<div style="font-size:.62rem;color:#888;">' + (s.vendas || '') + '</div>' +
          '<div style="width:100%;background:#f0a05e;border-radius:4px 4px 0 0;height:' + h + 'px;"></div></div>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:22px;">' +
      season.map(function (s) { return '<div style="flex:1;text-align:center;font-size:.6rem;color:#aaa;">' + esc(s.label) + '</div>'; }).join('') + '</div>' +

      // Lotação
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Lotação das próximas turmas</h3>' +
      (occ.length ? '<div style="display:grid;gap:8px;margin-bottom:20px;">' +
        tbl(occ.slice(0, 10).map(function (o) {
          var cor = o.fill >= 80 ? '#c0392b' : o.fill <= 20 ? '#8a8a8a' : '#1c7a43';
          return '<div style="display:grid;grid-template-columns:1fr 120px 60px;gap:10px;align-items:center;font-size:.85rem;">' +
            '<div><div style="color:#1a1a1a;font-weight:600;">' + esc(o.nome) + '</div>' + bar(o.fill, 100) + '</div>' +
            '<div style="text-align:right;color:#666;">' + o.vendidas + '/' + o.total + ' vagas</div>' +
            '<div style="text-align:right;color:' + cor + ';font-weight:700;">' + o.fill + '%</div></div>';
        })) + '</div>'
        : '<div style="color:#999;font-size:.85rem;margin-bottom:20px;">Sem turmas futuras com controle de vagas pra calcular lotação.</div>') +

      // Sugestões
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">O que o agente sugere</h3>' +
      '<div style="display:grid;gap:9px;">' +
      (sug.length ? sug.map(function (s) {
        return '<div style="font-size:.86rem;color:#444;line-height:1.5;background:#faf6f0;border-left:3px solid #f0a05e;border-radius:8px;padding:9px 12px;">' + s + '</div>';
      }).join('') : '<div style="color:#999;font-size:.85rem;">Sem alertas no momento — está tudo equilibrado.</div>') +
      '</div>';
  }

  async function run() {
    if (loading) return;
    loading = true;
    var root = el('evtia-root');
    if (root) root.innerHTML = '<div style="color:#999;font-size:.9rem;">Analisando vendas, temas e lotação…</div>';
    try {
      var d = await loadData();
      render(d);
    } catch (e) {
      if (root) root.innerHTML = '<div style="color:#b3261e;font-size:.9rem;">Falha: ' + esc(e.message || e) + '</div>';
    } finally { loading = false; }
  }

  function init() {
    var btn = el('evtia-refresh');
    if (btn && !btn.dataset.wired) { btn.dataset.wired = '1'; btn.addEventListener('click', run); }
    var nav = document.querySelector('[data-panel="analytics"]');
    if (nav && !nav.dataset.evtiaWired) {
      nav.dataset.evtiaWired = '1';
      nav.addEventListener('click', function () { setTimeout(run, 150); });
    }
    // Se já abrir direto na aba analytics
    var p = document.getElementById('panel-analytics');
    if (p && p.classList.contains('admin__panel--active')) run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
