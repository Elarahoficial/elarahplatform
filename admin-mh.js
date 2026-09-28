// =============================================================
// ELARAH MENTAL HEALTH — painel corporativo (admin-mh.html)
// -------------------------------------------------------------
// Plataforma B2B da Elarah: saúde mental nas empresas (NR-1) com
// cronogramas de experiências manuais. Abas:
//
//   Hoje       → Visão geral · O que fazer hoje
//   Clientes   → Agenda de eventos · Acompanhamento semanal ·
//                Cronogramas · Pedidos do site
//   Conteúdo   → Ideias & programa anual · Datas para o RH
//   Comercial  → Prospecção (100 empresas/semana) · Captação
//
// Banco: sql/elarah_mental_health.sql. Se as tabelas mh_* ainda não
// existirem, o painel NÃO quebra: guarda no navegador e avisa no
// topo — assim dá pra usar hoje e migrar depois de rodar o SQL.
//
// Conteúdo fixo (atividades, datas, mensagens): admin-mh-data.js.
// =============================================================
(function () {
  'use strict';

  var D = window.ElarahMHData;
  var DAY = 86400000;
  var META_SEMANA = 100;

  // ---------------- Helpers ----------------
  function $(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || null; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  // YYYY-MM-DD local (toISOString viraria "amanhã" depois das 21h no Brasil).
  function dayKey(d) { var x = d ? new Date(d) : new Date(); return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate()); }
  function parseDay(k) { return k ? new Date(String(k).slice(0, 10) + 'T12:00:00') : null; }
  function today0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function weekStart(d) {
    var x = new Date(d || Date.now()); x.setHours(0, 0, 0, 0);
    var dow = x.getDay(); x.setDate(x.getDate() - (dow === 0 ? 6 : dow - 1));
    return x;
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function fmtDia(d) { d = d instanceof Date ? d : parseDay(d); if (!d || isNaN(d)) return '—'; return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1); }
  function fmtData(d) { d = d instanceof Date ? d : parseDay(d); if (!d || isNaN(d)) return '—'; return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''); }
  function dateBox(d) {
    d = d instanceof Date ? d : parseDay(d);
    if (!d || isNaN(d)) return '<div class="date">—</div>';
    return '<div class="date"><b>' + d.getDate() + '</b>' + MES3[d.getMonth()] + '</div>';
  }
  function brl(cent) {
    var n = (Number(cent) || 0) / 100;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function diasAte(d) { return Math.round((d - today0()) / DAY); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'loc-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (_) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'mh-toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function copiar(txt) {
    var ok = function () { toast('Copiado ✓'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, function () { fallbackCopy(txt); ok(); });
    } else { fallbackCopy(txt); ok(); }
  }
  function fallbackCopy(txt) {
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (_) {} ta.remove();
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function waLink(tel, texto) {
    var d = digits(tel); if (!d) return null;
    if (d.length <= 11) d = '55' + d;
    return 'https://wa.me/' + d + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }
  // Celular BR tem 9 depois do DDD (11 dígitos). Fixo não tem WhatsApp (em regra).
  function ehCelular(tel) { var d = digits(tel).replace(/^55/, ''); return d.length === 11 && d[2] === '9'; }
  function dominio(site) {
    if (!site) return null;
    try { return new URL(/^https?:/i.test(site) ? site : 'https://' + site).hostname.replace(/^www\./, ''); } catch (_) { return null; }
  }
  function gmailLink(to, assunto, corpo) {
    return 'https://mail.google.com/mail/?view=cm&fs=1' + (to ? '&to=' + encodeURIComponent(to) : '') +
      '&su=' + encodeURIComponent(assunto || '') + '&body=' + encodeURIComponent(corpo || '');
  }

  // ---------------- Armazenamento ----------------
  // Tenta o Supabase; se a tabela não existe ainda, cai pro navegador.
  var LOCAL_MODE = {};
  function tabelaFaltando(err) {
    if (!err) return false;
    var m = String(err.message || '') + ' ' + String(err.code || '');
    return /42P01|PGRST205|PGRST204|42703|does not exist|Could not find the table|schema cache/i.test(m);
  }
  function lsKey(t) { return 'elarah_mh_local_' + t; }

  async function dbList(table, build) {
    var c = sb();
    if (c && !LOCAL_MODE[table]) {
      try {
        var q = c.from(table).select('*');
        if (build) q = build(q);
        var r = await q;
        if (!r.error) return r.data || [];
        if (tabelaFaltando(r.error)) LOCAL_MODE[table] = true;
        else console.warn('[MH] erro lendo', table, r.error);
      } catch (e) { console.warn('[MH] exceção lendo', table, e); LOCAL_MODE[table] = true; }
    } else if (!c) LOCAL_MODE[table] = true;
    return lsGet(lsKey(table), []);
  }
  async function dbSave(table, row) {
    var c = sb();
    var isNew = !row.id;
    if (c && !LOCAL_MODE[table]) {
      var r = isNew
        ? await c.from(table).insert(row).select().maybeSingle()
        : await c.from(table).update(row).eq('id', row.id).select().maybeSingle();
      if (!r.error) return r.data || row;
      if (!tabelaFaltando(r.error)) throw new Error(r.error.message || 'erro ao salvar');
      LOCAL_MODE[table] = true;
    }
    var all = lsGet(lsKey(table), []);
    if (isNew) { row.id = uuid(); row.created_at = new Date().toISOString(); all.unshift(row); }
    else {
      var i = all.findIndex(function (x) { return x.id === row.id; });
      if (i >= 0) all[i] = Object.assign({}, all[i], row); else all.unshift(row);
    }
    row.updated_at = new Date().toISOString();
    lsSet(lsKey(table), all);
    return row;
  }
  async function dbDelete(table, id) {
    var c = sb();
    if (c && !LOCAL_MODE[table]) {
      var r = await c.from(table).delete().eq('id', id);
      if (!r.error) return;
      if (!tabelaFaltando(r.error)) throw new Error(r.error.message);
      LOCAL_MODE[table] = true;
    }
    lsSet(lsKey(table), lsGet(lsKey(table), []).filter(function (x) { return x.id !== id; }));
  }

  // ---------------- Estado ----------------
  var S = {
    panel: 'visao',
    eventos: [], acomp: [], crons: [], leads: [], prospects: [], interacoes: [],
    prospSemFrente: false, // banco ainda sem a coluna frente
    ui: {}
  };

  async function carregarProspects() {
    var c = sb();
    S.prospSemFrente = false;
    if (c && !LOCAL_MODE.b2b_prospects) {
      var r = await c.from('b2b_prospects').select('*').eq('frente', 'mh').order('created_at', { ascending: false }).limit(2000);
      if (r.error && /frente|42703/i.test(String(r.error.message) + r.error.code)) {
        // SQL da MH ainda não rodou: mostra os B2B existentes mesmo assim.
        S.prospSemFrente = true;
        r = await c.from('b2b_prospects').select('*').order('created_at', { ascending: false }).limit(2000);
      }
      if (!r.error) { S.prospects = r.data || []; return; }
      if (tabelaFaltando(r.error)) LOCAL_MODE.b2b_prospects = true;
      else console.warn('[MH] prospects', r.error);
    } else LOCAL_MODE.b2b_prospects = true;
    S.prospects = lsGet(lsKey('b2b_prospects'), []);
  }
  async function carregarInteracoes() {
    var desde = addDays(weekStart(), -7).toISOString();
    S.interacoes = await dbList('b2b_prospect_interactions', function (q) { return q.gte('occurred_at', desde).limit(2000); });
    var ids = {}; S.prospects.forEach(function (p) { ids[p.id] = 1; });
    S.interacoes = S.interacoes.filter(function (i) { return ids[i.prospect_id]; });
  }

  async function carregarTudo() {
    var res = await Promise.all([
      dbList('mh_eventos', function (q) { return q.order('data_evento', { ascending: true }).limit(1000); }),
      dbList('mh_acompanhamento', function (q) { return q.order('semana', { ascending: false }).limit(1000); }),
      dbList('mh_cronogramas', function (q) { return q.order('created_at', { ascending: false }).limit(300); }),
      dbList('mh_leads', function (q) { return q.order('created_at', { ascending: false }).limit(500); }),
      carregarProspects()
    ]);
    S.eventos = res[0]; S.acomp = res[1]; S.crons = res[2]; S.leads = res[3];
    await carregarInteracoes();
  }

  // Empresas "clientes": quem tem evento confirmado/realizado, cronograma,
  // prospect fechado/ativo ou acompanhamento já registrado.
  function clientes() {
    var set = {};
    S.eventos.forEach(function (e) { if (e.status === 'confirmado' || e.status === 'realizado') set[e.empresa] = 1; });
    S.crons.forEach(function (c) { if (c.status === 'aprovado') set[c.empresa] = 1; });
    S.prospects.forEach(function (p) { if (p.status_comercial === 'fechado' || p.status_comercial === 'cliente_ativo') set[p.nome] = 1; });
    S.acomp.forEach(function (a) { set[a.empresa] = 1; });
    return Object.keys(set).filter(Boolean).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
  }
  function todasEmpresas() {
    var set = {};
    clientes().forEach(function (n) { set[n] = 1; });
    S.eventos.forEach(function (e) { set[e.empresa] = 1; });
    S.crons.forEach(function (c) { set[c.empresa] = 1; });
    S.prospects.slice(0, 800).forEach(function (p) { set[p.nome] = 1; });
    S.leads.forEach(function (l) { set[l.empresa] = 1; });
    return Object.keys(set).filter(Boolean).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
  }

  function datasProximas(dias, minRel) {
    var hoje = today0(), ano = hoje.getFullYear();
    var lista = D.datasDoAno(ano).concat(D.datasDoAno(ano + 1));
    return lista.filter(function (x) {
      var n = diasAte(x.data); return n >= 0 && n <= dias && x.rel >= (minRel || 1);
    });
  }
  // Próxima data forte (≥14 dias à frente, dá tempo de vender) pra gancho de mensagem.
  function ganchoAtual() {
    var l = datasProximas(120, 3).filter(function (x) { return diasAte(x.data) >= 14; });
    return l[0] || datasProximas(365, 2)[0];
  }

  // ---------------- Navegação ----------------
  var PANELS = [
    { grupo: 'Hoje' },
    { key: 'visao', ico: '◎', label: 'Visão geral' },
    { key: 'hoje', ico: '☀', label: 'O que fazer hoje', badge: function () { return tarefasHoje().filter(function (t) { return !t.feita; }).length; } },
    { grupo: 'Clientes' },
    { key: 'eventos', ico: '🗓', label: 'Agenda de eventos' },
    { key: 'acomp', ico: '📈', label: 'Acompanhamento semanal' },
    { key: 'cronograma', ico: '🧭', label: 'Cronogramas' },
    { key: 'leads', ico: '📥', label: 'Pedidos do site', badge: function () { return S.leads.filter(function (l) { return l.status === 'novo'; }).length; } },
    { grupo: 'Conteúdo' },
    { key: 'ideias', ico: '💡', label: 'Ideias & programa anual' },
    { key: 'datas', ico: '🎁', label: 'Datas para o RH' },
    { grupo: 'Comercial' },
    { key: 'prosp', ico: '🎯', label: 'Prospecção' },
    { key: 'captacao', ico: '📣', label: 'Captação' }
  ];

  function renderNav() {
    $('mh-nav').innerHTML = PANELS.map(function (p) {
      if (p.grupo) return '<div class="mh__nav-group">' + p.grupo + '</div>';
      var b = p.badge ? p.badge() : 0;
      return '<button class="mh__nav-item' + (S.panel === p.key ? ' mh__nav-item--active' : '') + '" data-panel="' + p.key + '">' +
        '<span class="ico">' + p.ico + '</span><span class="lbl">' + p.label + '</span>' +
        (b ? '<span class="badge">' + b + '</span>' : '') + '</button>';
    }).join('');
  }

  function ir(panel) {
    S.panel = panel;
    try { history.replaceState(null, '', '#' + panel); } catch (_) {}
    render();
    window.scrollTo(0, 0);
  }

  function banner() {
    var faltam = Object.keys(LOCAL_MODE).filter(function (k) { return LOCAL_MODE[k]; });
    var out = '';
    if (faltam.length) {
      out += '<div class="mh-banner">⚠️ Modo rascunho: <b>' + faltam.join(', ') + '</b> ainda não existe(m) no banco, então o que você cadastrar fica salvo só neste navegador. ' +
        'Rode <code>sql/elarah_mental_health.sql</code> no SQL Editor do Supabase pra salvar tudo e compartilhar com a equipe.</div>';
    } else if (S.prospSemFrente) {
      out += '<div class="mh-banner">ℹ️ A Prospecção está mostrando todos os leads B2B porque a coluna <code>frente</code> ainda não existe. Rode <code>sql/elarah_mental_health.sql</code> pra separar os leads da Mental Health.</div>';
    }
    return out;
  }

  function head(titulo, sub, acoes) {
    return '<div class="mh__head"><div><h1>' + titulo + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (acoes ? '<div class="mh__head-actions">' + acoes + '</div>' : '') + '</div>' + banner();
  }

  function render() {
    renderNav();
    var fn = {
      visao: rVisao, hoje: rHoje, eventos: rEventos, acomp: rAcomp, cronograma: rCronograma,
      leads: rLeads, ideias: rIdeias, datas: rDatas, prosp: rProsp, captacao: rCaptacao
    }[S.panel] || rVisao;
    $('mh-main').innerHTML = fn();
    var after = AFTER[S.panel]; if (after) after();
  }
  var AFTER = {};

  // ---------------- Modal genérico ----------------
  function modal(titulo, corpo, opts) {
    opts = opts || {};
    var m = document.createElement('div');
    m.className = 'mh-modal';
    m.innerHTML = '<div class="mh-modal__box" role="dialog" aria-modal="true"><h2>' + esc(titulo) + '</h2>' +
      '<form class="mh-form" novalidate>' + corpo + '</form>' +
      '<div class="mh-modal__acts"><div>' + (opts.onDelete ? '<button type="button" class="mh-btn mh-btn--danger" data-act="del">Excluir</button>' : '') + '</div>' +
      '<div style="display:flex;gap:8px"><button type="button" class="mh-btn mh-btn--ghost" data-act="cancel">Cancelar</button>' +
      (opts.onSubmit ? '<button type="button" class="mh-btn" data-act="ok">' + (opts.okLabel || 'Salvar') + '</button>' : '') + '</div></div></div>';
    document.body.appendChild(m);
    var form = m.querySelector('form');
    function fechar() { m.remove(); }
    m.addEventListener('click', async function (e) {
      if (e.target === m) return fechar();
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'cancel') fechar();
      if (act === 'del' && confirm('Excluir mesmo?')) {
        try { await opts.onDelete(); fechar(); } catch (err) { alert('Não deu: ' + err.message); }
      }
      if (act === 'ok') {
        var data = {};
        Array.prototype.forEach.call(form.elements, function (el) {
          if (!el.name) return;
          data[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
        });
        e.target.disabled = true;
        try { var keep = await opts.onSubmit(data); if (keep !== false) fechar(); }
        catch (err) { alert('Não deu pra salvar: ' + err.message); }
        e.target.disabled = false;
      }
    });
    var first = form.querySelector('input,select,textarea'); if (first) first.focus();
    if (opts.onOpen) opts.onOpen(form);
    return m;
  }
  function optList(obj, sel) {
    return Object.keys(obj).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(obj[k]) + '</option>'; }).join('');
  }
  function atividadeOptions(sel) {
    return '<option value="">—</option>' + D.ATIVIDADES.map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + a.emoji + ' ' + esc(a.nome) + '</option>';
    }).join('');
  }
  function empresasDatalist() {
    return '<datalist id="mh-emp-list">' + todasEmpresas().slice(0, 600).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>';
  }

  // =============================================================
  // VISÃO GERAL
  // =============================================================
  function prospStats() {
    var ws = weekStart().getTime();
    var novas = S.prospects.filter(function (p) { return new Date(p.created_at).getTime() >= ws; }).length;
    var contatadasIds = {};
    S.interacoes.forEach(function (i) {
      if (i.tipo === 'mensagem_enviada' && new Date(i.occurred_at).getTime() >= ws) contatadasIds[i.prospect_id] = 1;
    });
    var contatadas = Object.keys(contatadasIds).length;
    var hojeIds = {};
    var t0 = today0().getTime();
    S.interacoes.forEach(function (i) { if (i.tipo === 'mensagem_enviada' && new Date(i.occurred_at).getTime() >= t0) hojeIds[i.prospect_id] = 1; });
    var funil = S.prospects.filter(function (p) { return ['respondeu', 'reuniao_marcada', 'proposta_enviada', 'negociacao'].indexOf(p.status_comercial) >= 0; }).length;
    var naFila = S.prospects.filter(function (p) { return p.status_comercial === 'nao_contatado'; }).length;
    return { novas: novas, contatadas: contatadas, hoje: Object.keys(hojeIds).length, funil: funil, naFila: naFila };
  }

  function rVisao() {
    var hoje = today0();
    var ano = hoje.getFullYear();
    var prox30 = S.eventos.filter(function (e) {
      var d = parseDay(e.data_evento); return d && e.status !== 'cancelado' && diasAte(d) >= 0 && diasAte(d) <= 30;
    });
    var receitaAno = S.eventos.filter(function (e) {
      var d = parseDay(e.data_evento); return d && d.getFullYear() === ano && (e.status === 'confirmado' || e.status === 'realizado');
    }).reduce(function (s, e) { return s + (Number(e.valor_centavos) || 0); }, 0);
    var pipeline = S.eventos.filter(function (e) { return e.status === 'orcamento' || e.status === 'proposta_enviada'; })
      .reduce(function (s, e) { return s + (Number(e.valor_centavos) || 0); }, 0);
    var ps = prospStats();
    var pct = Math.min(100, Math.round(ps.contatadas / META_SEMANA * 100));
    var datas = datasProximas(60, 2).slice(0, 6);
    var ws = dayKey(weekStart());
    var alertas = S.acomp.filter(function (a) { return a.alerta && a.semana >= dayKey(addDays(weekStart(), -7)); });
    var semCheckin = clientes().filter(function (c) {
      return !S.acomp.some(function (a) { return a.empresa === c && a.semana === ws; });
    });
    var leadsNovos = S.leads.filter(function (l) { return l.status === 'novo'; });

    var proxEventos = S.eventos.filter(function (e) { var d = parseDay(e.data_evento); return d && diasAte(d) >= 0 && e.status !== 'cancelado'; }).slice(0, 6);

    return head('Visão geral', 'Elarah Mental Health — saúde mental nas empresas com experiências que o time ama. ' + fmtData(hoje) + '.',
        '<button class="mh-btn mh-btn--ghost" data-go="hoje">☀ O que fazer hoje</button><button class="mh-btn mh-btn--terra" data-new-evento>+ Novo evento</button>') +
      '<div class="mh-grid mh-grid--4">' +
        kpi('Eventos nos próximos 30 dias', prox30.length, prox30.filter(function (e) { return e.status === 'confirmado'; }).length + ' confirmados') +
        kpi('Faturamento ' + ano, brl(receitaAno), 'confirmados + realizados · ' + brl(pipeline) + ' em orçamento') +
        kpi('Empresas no funil', ps.funil, clientes().length + ' clientes ativos') +
        '<div class="mh-card mh-kpi"><div class="lbl">Prospecção da semana</div><div class="val">' + ps.contatadas + '<span style="font-size:1rem;color:var(--mh-muted)"> / ' + META_SEMANA + '</span></div>' +
          '<div class="mh-progress"><i style="width:' + pct + '%"></i></div><div class="sub">' + ps.novas + ' empresas novas · ' + ps.naFila + ' na fila</div></div>' +
      '</div>' +
      '<div class="mh-grid mh-grid--2" style="margin-top:16px">' +
        '<div class="mh-card"><h3>Próximos eventos <a href="#eventos" data-go="eventos" style="font-size:.8rem">ver agenda →</a></h3>' +
          (proxEventos.length ? '<div class="mh-list">' + proxEventos.map(rowEvento).join('') + '</div>' : '<div class="mh-empty">Nenhum evento agendado. Que tal oferecer a próxima data forte pros clientes?</div>') +
        '</div>' +
        '<div class="mh-card"><h3>Datas pra oferecer ao RH <small>próximos 60 dias</small></h3>' +
          (datas.length ? '<div class="mh-list">' + datas.map(rowData).join('') + '</div>' : '<div class="mh-empty">Sem datas fortes nos próximos 60 dias.</div>') +
        '</div>' +
      '</div>' +
      '<div class="mh-grid mh-grid--3" style="margin-top:16px">' +
        '<div class="mh-card"><h3>Pedidos do site <small>' + leadsNovos.length + ' novos</small></h3>' +
          (leadsNovos.length ? '<div class="mh-list">' + leadsNovos.slice(0, 4).map(function (l) {
            return '<div class="mh-row"><div class="body"><strong>' + esc(l.empresa) + '</strong><p>' + esc(l.nome) + (l.colaboradores ? ' · ' + esc(l.colaboradores) + ' pessoas' : '') + (l.plano ? ' · ' + esc(l.plano) : '') + '</p></div></div>';
          }).join('') + '</div><button class="mh-btn mh-btn--ghost mh-btn--sm" data-go="leads">Abrir pedidos</button>' : '<div class="mh-empty">Nenhum pedido novo pela landing page.</div>') +
        '</div>' +
        '<div class="mh-card"><h3>Acompanhamento <small>semana de ' + fmtDia(weekStart()) + '</small></h3>' +
          (alertas.length ? alertas.map(function (a) { return '<div class="mh-row"><div class="body"><strong>🚩 ' + esc(a.empresa) + '</strong><p>' + esc(a.proximo_passo || a.feito || 'Sinal de atenção registrado') + '</p></div></div>'; }).join('') : '') +
          (semCheckin.length ? '<p style="font-size:.84rem;margin:6px 0">Sem check-in nesta semana: <b>' + semCheckin.slice(0, 8).map(esc).join(', ') + (semCheckin.length > 8 ? '…' : '') + '</b></p>' : '<div class="mh-empty">Todos os clientes com check-in nesta semana. 💚</div>') +
          '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-go="acomp">Abrir acompanhamento</button>' +
        '</div>' +
        '<div class="mh-card"><h3>Ideia de conteúdo do dia</h3>' + postDoDia() + '</div>' +
      '</div>';
  }
  function kpi(lbl, val, sub) {
    return '<div class="mh-card mh-kpi"><div class="lbl">' + lbl + '</div><div class="val">' + val + '</div><div class="sub">' + sub + '</div></div>';
  }
  function postDoDia() {
    var doy = Math.floor((today0() - new Date(today0().getFullYear(), 0, 0)) / DAY);
    var p = D.POSTS[doy % D.POSTS.length];
    return '<span class="mh-chip">' + esc(p.canal) + '</span><p style="font-weight:600;margin:8px 0 4px">' + esc(p.titulo) + '</p>' +
      '<p style="font-size:.82rem;color:var(--mh-muted);margin:0 0 10px">' + esc(p.texto.slice(0, 140)) + '…</p>' +
      '<button class="mh-btn mh-btn--sm" data-copy-post="' + D.POSTS.indexOf(p) + '">Copiar post</button>';
  }

  var STATUS_EVT = { orcamento: 'Orçamento', proposta_enviada: 'Proposta enviada', confirmado: 'Confirmado', realizado: 'Realizado', cancelado: 'Cancelado' };
  var STATUS_EVT_CHIP = { orcamento: 'mh-chip--gray', proposta_enviada: 'mh-chip--warn', confirmado: 'mh-chip--ok', realizado: '', cancelado: 'mh-chip--danger' };
  function rowEvento(e) {
    var a = D.atividade(e.atividade);
    return '<div class="mh-row">' + dateBox(e.data_evento) + '<div class="body"><strong>' + esc(e.titulo) + '</strong>' +
      '<p>' + esc(e.empresa) + (e.horario ? ' · ' + esc(e.horario) : '') + (e.participantes ? ' · ' + e.participantes + ' pessoas' : '') + (a ? ' · ' + a.emoji + ' ' + esc(a.nome) : '') + '</p></div>' +
      '<div class="acts"><span class="mh-chip ' + (STATUS_EVT_CHIP[e.status] || '') + '">' + (STATUS_EVT[e.status] || e.status) + '</span>' +
      '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-edit-evento="' + e.id + '">Editar</button></div></div>';
  }
  function rowData(x, i) {
    var cat = D.CATS_DATA[x.cat] || {};
    var n = diasAte(x.data);
    var key = dayKey(x.data) + '|' + x.nome;
    return '<div class="mh-row">' + dateBox(x.data) + '<div class="body"><strong>' + esc(x.nome) + '</strong>' +
      '<p>' + esc(x.gancho) + '</p><p>💡 ' + esc(x.presente) + ' · <span class="mh-chip" style="background:' + cat.bg + ';color:' + cat.fg + '">' + cat.emoji + ' ' + cat.label + '</span> · ' +
      (n === 0 ? '<b>hoje</b>' : 'em ' + n + ' dias') + '</p></div>' +
      '<div class="acts"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-pitch="' + esc(key) + '">Copiar pitch</button>' +
      '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-evento-data="' + esc(key) + '">+ Evento</button></div></div>';
  }
  function acharData(key) {
    var parts = String(key).split('|'); var d = parseDay(parts[0]);
    var l = D.datasDoAno(d.getFullYear());
    return l.filter(function (x) { return dayKey(x.data) === parts[0] && x.nome === parts[1]; })[0];
  }
  function pitchRH(x) {
    var a = D.atividade(x.atividade);
    return 'Oi, {contato}! Tudo bem? 💚\n\n' +
      'Dia ' + fmtDia(x.data) + ' é ' + x.nome + '. ' + x.gancho + '\n\n' +
      'Nossa sugestão pra {empresa}: ' + x.presente + (a ? ' — ' + a.beneficio : '') + '\n\n' +
      'Organizamos tudo (material, facilitadora, fotos e relatório pro RH) e também temos gift cards de experiência Elarah a partir de R$ 100 por pessoa.\n\n' +
      'Te mando uma proposta com valores até amanhã?';
  }

  // =============================================================
  // O QUE FAZER HOJE
  // =============================================================
  function tarefasHoje() {
    var feitas = lsGet('elarah_mh_tarefas_' + dayKey(), {});
    var t = [];
    var hoje = today0();
    var dow = hoje.getDay();
    var util = dow >= 1 && dow <= 5;
    var ps = prospStats();

    if (util) {
      var metaDia = Math.ceil(Math.max(0, META_SEMANA - ps.contatadas + ps.hoje) / Math.max(1, 6 - dow));
      t.push({ id: 'prosp', prio: 1, titulo: '🎯 Abordar ' + metaDia + ' empresas hoje', go: 'prosp',
        desc: 'Meta de ' + META_SEMANA + ' por semana. Já foram ' + ps.contatadas + ' nesta semana (' + ps.hoje + ' hoje). Mensagens prontas na aba Prospecção.',
        auto: ps.hoje >= metaDia });
    }
    var fim = new Date(); fim.setHours(23, 59, 59, 999);
    var follow = S.prospects.filter(function (p) {
      return p.proxima_acao_at && new Date(p.proxima_acao_at) <= fim && ['recusou', 'fechado', 'cliente_ativo', 'pausado'].indexOf(p.status_comercial) < 0;
    });
    follow.slice(0, 15).forEach(function (p) {
      t.push({ id: 'fu-' + p.id, prio: 1, titulo: '↩️ Follow-up: ' + p.nome, go: 'prosp', desc: (p.proxima_acao || 'Retomar contato') + ' · combinado para ' + fmtDia(new Date(p.proxima_acao_at)) });
    });
    S.leads.filter(function (l) { return l.status === 'novo'; }).forEach(function (l) {
      t.push({ id: 'lead-' + l.id, prio: 1, titulo: '📥 Responder pedido do site: ' + l.empresa, go: 'leads', desc: l.nome + (l.whatsapp ? ' · ' + l.whatsapp : '') + ' — responda em até 2h, é lead quente.' });
    });
    S.eventos.forEach(function (e) {
      var d = parseDay(e.data_evento); if (!d || e.status === 'cancelado') return;
      var n = diasAte(d);
      if (n === 0) t.push({ id: 'evt0-' + e.id, prio: 1, titulo: '🎉 Evento hoje: ' + e.titulo, go: 'eventos', desc: e.empresa + (e.horario ? ' às ' + e.horario : '') + '. Levar lista de presença e tirar fotos pro relatório NR-1.' });
      else if (n > 0 && n <= 7 && e.status === 'confirmado') t.push({ id: 'evt7-' + e.id, prio: 2, titulo: '📦 Preparar: ' + e.titulo + ' (' + fmtDia(d) + ')', go: 'eventos', desc: 'Confirmar facilitadora, material para ' + (e.participantes || '?') + ' pessoas e local com ' + e.empresa + '.' });
      else if (n < 0 && n >= -3 && e.status === 'confirmado') t.push({ id: 'evtpos-' + e.id, prio: 2, titulo: '📝 Pós-evento: ' + e.titulo, go: 'eventos', desc: 'Marcar como realizado, enviar relatório + fotos ao RH e pedir depoimento em vídeo.' });
      if ((e.status === 'orcamento' || e.status === 'proposta_enviada') && e.updated_at && (Date.now() - new Date(e.updated_at)) > 5 * DAY) {
        t.push({ id: 'orc-' + e.id, prio: 2, titulo: '⏳ Orçamento parado: ' + e.empresa, go: 'eventos', desc: '"' + e.titulo + '" sem movimento há ' + Math.floor((Date.now() - new Date(e.updated_at)) / DAY) + ' dias. Mande um follow-up com a data como gancho.' });
      }
    });
    if (util && dow >= 3) {
      var ws = dayKey(weekStart());
      clientes().filter(function (c) { return !S.acomp.some(function (a) { return a.empresa === c && a.semana === ws; }); }).slice(0, 10).forEach(function (c) {
        t.push({ id: 'acomp-' + c, prio: 3, titulo: '📈 Check-in semanal: ' + c, go: 'acomp', desc: 'Perguntar ao RH como o time está (termômetro 1–5) e registrar.' });
      });
    }
    datasProximas(45, 3).forEach(function (x) {
      var n = diasAte(x.data);
      if (n >= 20 && n <= 45) t.push({ id: 'data-' + dayKey(x.data) + x.nome, prio: 2, titulo: '🎁 Oferecer "' + x.nome + '" (' + fmtDia(x.data) + ')', go: 'datas', desc: 'Janela de venda aberta: mande o pitch pros clientes e pros prospects quentes. Sugestão: ' + x.presente + '.' });
    });
    if (util) t.push({ id: 'post', prio: 3, titulo: '📣 Publicar o conteúdo do dia', go: 'captacao', desc: 'Post pronto na aba Captação — LinkedIn funciona melhor entre 8h e 10h.' });

    t.forEach(function (x) { x.feita = !!feitas[x.id] || !!x.auto; });
    t.sort(function (a, b) { return (a.feita - b.feita) || (a.prio - b.prio); });
    return t;
  }
  function rHoje() {
    var t = tarefasHoje();
    var feitas = t.filter(function (x) { return x.feita; }).length;
    var cores = { 1: '#d9774b', 2: '#e2b04a', 3: '#8fb3a0' };
    return head('O que fazer hoje', 'Lista montada sozinha a partir da agenda, prospecção, pedidos e datas. Marque conforme for fazendo.') +
      '<div class="mh-card"><h3>' + feitas + ' de ' + t.length + ' feitas <small>' + fmtData(today0()) + '</small></h3>' +
      '<div class="mh-progress" style="margin:0 0 10px"><i style="width:' + (t.length ? Math.round(feitas / t.length * 100) : 100) + '%"></i></div>' +
      (t.length ? t.map(function (x) {
        return '<div class="mh-task' + (x.feita ? ' done' : '') + '"><input type="checkbox" data-task="' + esc(x.id) + '"' + (x.feita ? ' checked' : '') + '>' +
          '<span class="mh-prio" style="background:' + cores[x.prio] + '"></span>' +
          '<div class="t"><strong>' + esc(x.titulo) + '</strong><p>' + esc(x.desc) + '</p></div>' +
          '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-go="' + x.go + '">Abrir</button></div>';
      }).join('') : '<div class="mh-empty">Nada pendente. Aproveite pra criar conteúdo ou montar um cronograma novo. ✨</div>') +
      '</div>';
  }

  // =============================================================
  // AGENDA DE EVENTOS
  // =============================================================
  function rEventos() {
    var f = S.ui.evtFiltro || 'futuros';
    var lista = S.eventos.slice().sort(function (a, b) { return String(a.data_evento || '').localeCompare(String(b.data_evento || '')); });
    if (f === 'futuros') lista = lista.filter(function (e) { var d = parseDay(e.data_evento); return !d || diasAte(d) >= 0; }).filter(function (e) { return e.status !== 'cancelado'; });
    else if (f !== 'todos') lista = lista.filter(function (e) { return e.status === f; });
    if (f === 'realizado' || f === 'todos') lista.reverse();

    var porMes = {};
    lista.forEach(function (e) {
      var d = parseDay(e.data_evento);
      var k = d ? MESES[d.getMonth()] + ' ' + d.getFullYear() : 'Sem data';
      (porMes[k] = porMes[k] || []).push(e);
    });
    var filtros = { futuros: 'Próximos', orcamento: 'Orçamentos', proposta_enviada: 'Propostas', confirmado: 'Confirmados', realizado: 'Realizados', cancelado: 'Cancelados', todos: 'Todos' };
    return head('Agenda de eventos', 'Eventos in company, no ateliê, online ou kits em casa — do orçamento ao relatório final.',
        '<button class="mh-btn mh-btn--terra" data-new-evento>+ Novo evento</button>') +
      '<div class="mh-toolbar">' + Object.keys(filtros).map(function (k) {
        var n = k === 'futuros' || k === 'todos' ? '' : ' (' + S.eventos.filter(function (e) { return e.status === k; }).length + ')';
        return '<button class="mh-btn mh-btn--sm ' + (f === k ? '' : 'mh-btn--ghost') + '" data-evt-filtro="' + k + '">' + filtros[k] + n + '</button>';
      }).join('') + '</div>' +
      (lista.length ? Object.keys(porMes).map(function (m) {
        var tot = porMes[m].reduce(function (s, e) { return s + (Number(e.valor_centavos) || 0); }, 0);
        return '<div class="mh-card" style="margin-bottom:14px"><h3>' + m + ' <small>' + porMes[m].length + ' evento(s) · ' + brl(tot) + '</small></h3><div class="mh-list">' + porMes[m].map(rowEvento).join('') + '</div></div>';
      }).join('') : '<div class="mh-card"><div class="mh-empty">Nenhum evento aqui ainda. Cadastre o primeiro orçamento — ou use “+ Evento” numa data da aba Datas para o RH.</div></div>');
  }

  function abrirEvento(ev, preset) {
    ev = ev || Object.assign({ status: 'orcamento', formato: 'presencial_empresa' }, preset || {});
    modal(ev.id ? 'Editar evento' : 'Novo evento',
      empresasDatalist() +
      '<label class="full">Título<input class="mh-input" name="titulo" required value="' + esc(ev.titulo || '') + '" placeholder="Ex.: Cerâmica terapêutica — Setembro Amarelo"></label>' +
      '<label>Empresa<input class="mh-input" name="empresa" list="mh-emp-list" required value="' + esc(ev.empresa || '') + '"></label>' +
      '<label>Contato (RH)<input class="mh-input" name="contato" value="' + esc(ev.contato || '') + '" placeholder="Nome · e-mail/WhatsApp"></label>' +
      '<label>Atividade<select class="mh-select" name="atividade">' + atividadeOptions(ev.atividade) + '</select></label>' +
      '<label>Formato<select class="mh-select" name="formato">' + optList(D.FORMATOS, ev.formato) + '</select></label>' +
      '<label>Data<input class="mh-input" type="date" name="data_evento" value="' + esc(ev.data_evento || '') + '"></label>' +
      '<label>Horário<input class="mh-input" name="horario" value="' + esc(ev.horario || '') + '" placeholder="14h – 16h"></label>' +
      '<label>Participantes<input class="mh-input" type="number" min="0" name="participantes" value="' + esc(ev.participantes || '') + '"></label>' +
      '<label>Valor total (R$)<input class="mh-input" type="number" min="0" step="0.01" name="valor" value="' + (ev.valor_centavos ? (ev.valor_centavos / 100) : '') + '"></label>' +
      '<label class="full">Status<select class="mh-select" name="status">' + optList(STATUS_EVT, ev.status) + '</select></label>' +
      '<label class="full">Observações<textarea class="mh-textarea" name="observacoes" placeholder="Local, restrições, quem é a facilitadora, materiais…">' + esc(ev.observacoes || '') + '</textarea></label>',
      {
        onSubmit: async function (d) {
          if (!d.titulo || !d.empresa) { alert('Preencha título e empresa.'); return false; }
          var row = {
            titulo: d.titulo, empresa: d.empresa, contato: d.contato || null, atividade: d.atividade || null,
            formato: d.formato, data_evento: d.data_evento || null, horario: d.horario || null,
            participantes: d.participantes ? parseInt(d.participantes, 10) : null,
            valor_centavos: d.valor ? Math.round(parseFloat(d.valor.replace(',', '.')) * 100) : null,
            status: d.status, observacoes: d.observacoes || null
          };
          if (ev.id) row.id = ev.id;
          await dbSave('mh_eventos', row);
          S.eventos = await dbList('mh_eventos', function (q) { return q.order('data_evento', { ascending: true }).limit(1000); });
          toast('Evento salvo ✓'); render();
        },
        onDelete: ev.id ? async function () {
          await dbDelete('mh_eventos', ev.id);
          S.eventos = S.eventos.filter(function (x) { return x.id !== ev.id; }); render();
        } : null,
        onOpen: function (form) {
          // Título automático ao escolher a atividade (se ainda vazio).
          form.elements.atividade.addEventListener('change', function () {
            var a = D.atividade(this.value);
            if (a && !form.elements.titulo.value) form.elements.titulo.value = a.nome;
          });
        }
      });
  }

  // =============================================================
  // ACOMPANHAMENTO SEMANAL
  // =============================================================
  var HUMOR = ['', '😣', '😕', '😐', '🙂', '😄'];
  function rAcomp() {
    var ws = S.ui.semana ? parseDay(S.ui.semana) : weekStart();
    var wk = dayKey(ws);
    var lista = clientes();
    var extras = S.acomp.filter(function (a) { return a.semana === wk && lista.indexOf(a.empresa) < 0; }).map(function (a) { return a.empresa; });
    lista = lista.concat(extras);
    return head('Acompanhamento semanal', 'Um check-in por empresa por semana: como o time está, o que foi feito e o próximo passo. É o histórico que mostra valor na renovação — e evidência pro plano da NR-1.',
        '<button class="mh-btn mh-btn--terra" data-acomp-novo>+ Registrar semana</button>') +
      '<div class="mh-toolbar mh-weeknav"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-semana="' + dayKey(addDays(ws, -7)) + '">← semana anterior</button>' +
        '<b style="font-size:.9rem">Semana de ' + fmtDia(ws) + ' a ' + fmtDia(addDays(ws, 6)) + '</b>' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-semana="' + dayKey(addDays(ws, 7)) + '">próxima →</button></div>' +
      (lista.length ? '<div class="mh-grid mh-grid--2">' + lista.map(function (emp) {
        var reg = S.acomp.filter(function (a) { return a.empresa === emp && a.semana === wk; })[0];
        var hist = S.acomp.filter(function (a) { return a.empresa === emp; }).sort(function (a, b) { return a.semana.localeCompare(b.semana); }).slice(-8);
        return '<div class="mh-card"><h3>' + esc(emp) + (reg && reg.alerta ? ' <span class="mh-chip mh-chip--danger">🚩 atenção</span>' : '') + '</h3>' +
          (reg
            ? '<p style="margin:0 0 6px"><span class="mh-humor">' + (HUMOR[reg.humor_time] || '—') + '</span> ' +
                (reg.participacao != null ? '<span class="mh-chip">' + reg.participacao + '% de adesão</span>' : '') + '</p>' +
              (reg.feito ? '<p style="font-size:.84rem;margin:4px 0"><b>Feito:</b> ' + esc(reg.feito) + '</p>' : '') +
              (reg.proximo_passo ? '<p style="font-size:.84rem;margin:4px 0"><b>Próximo passo:</b> ' + esc(reg.proximo_passo) + '</p>' : '')
            : '<div class="mh-empty" style="padding:4px 0 8px">Sem check-in nesta semana.</div>') +
          (hist.length > 1 ? '<p style="font-size:.76rem;color:var(--mh-muted);margin:8px 0 0">Termômetro: ' + hist.map(function (h) { return '<span title="' + fmtDia(h.semana) + '">' + (HUMOR[h.humor_time] || '·') + '</span>'; }).join(' ') + '</p>' : '') +
          '<div style="margin-top:10px"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-acomp-emp="' + esc(emp) + '">' + (reg ? 'Editar' : 'Registrar') + '</button></div>' +
        '</div>';
      }).join('') + '</div>'
      : '<div class="mh-card"><div class="mh-empty">Ainda não há clientes. Uma empresa entra aqui quando tem evento confirmado, cronograma aprovado, status "fechado/cliente ativo" na prospecção — ou quando você registra a primeira semana.</div></div>');
  }
  function abrirAcomp(emp) {
    var wk = S.ui.semana || dayKey(weekStart());
    var reg = emp ? S.acomp.filter(function (a) { return a.empresa === emp && a.semana === wk; })[0] : null;
    reg = reg || { empresa: emp || '', semana: wk };
    modal('Check-in da semana',
      empresasDatalist() +
      '<label>Empresa<input class="mh-input" name="empresa" list="mh-emp-list" value="' + esc(reg.empresa) + '"></label>' +
      '<label>Semana (segunda)<input class="mh-input" type="date" name="semana" value="' + esc(reg.semana) + '"></label>' +
      '<label>Como está o time? (1–5)<select class="mh-select" name="humor_time"><option value="">—</option>' + [5, 4, 3, 2, 1].map(function (n) {
        return '<option value="' + n + '"' + (Number(reg.humor_time) === n ? ' selected' : '') + '>' + HUMOR[n] + ' ' + n + '</option>'; }).join('') + '</select></label>' +
      '<label>Adesão às ações (%)<input class="mh-input" type="number" min="0" max="100" name="participacao" value="' + esc(reg.participacao != null ? reg.participacao : '') + '"></label>' +
      '<label class="full">O que foi feito<textarea class="mh-textarea" name="feito" placeholder="Ex.: Kintsugi com 28 pessoas; RH elogiou; 2 pediram indicação de psicóloga">' + esc(reg.feito || '') + '</textarea></label>' +
      '<label class="full">Próximo passo<textarea class="mh-textarea" name="proximo_passo" placeholder="Ex.: Enviar relatório até sexta; propor workshop para líderes em outubro">' + esc(reg.proximo_passo || '') + '</textarea></label>' +
      '<label class="full check"><input type="checkbox" name="alerta"' + (reg.alerta ? ' checked' : '') + '> 🚩 Sinal de atenção (clima ruim, sobrecarga, conflito, afastamentos)</label>',
      {
        onSubmit: async function (d) {
          if (!d.empresa) { alert('Informe a empresa.'); return false; }
          var semana = dayKey(weekStart(parseDay(d.semana || wk)));
          var row = {
            empresa: d.empresa, semana: semana, humor_time: d.humor_time ? parseInt(d.humor_time, 10) : null,
            participacao: d.participacao !== '' ? Math.max(0, Math.min(100, parseInt(d.participacao, 10))) : null,
            feito: d.feito || null, proximo_passo: d.proximo_passo || null, alerta: !!d.alerta
          };
          var existente = S.acomp.filter(function (a) { return a.empresa === d.empresa && a.semana === semana; })[0];
          if (existente) row.id = existente.id;
          await dbSave('mh_acompanhamento', row);
          S.acomp = await dbList('mh_acompanhamento', function (q) { return q.order('semana', { ascending: false }).limit(1000); });
          toast('Check-in salvo ✓'); render();
        },
        onDelete: reg.id ? async function () {
          await dbDelete('mh_acompanhamento', reg.id);
          S.acomp = S.acomp.filter(function (x) { return x.id !== reg.id; }); render();
        } : null
      });
  }

  // =============================================================
  // CRONOGRAMAS
  // =============================================================
  var PLANOS = { pontual: 'Pontual (1 ação)', semestral: 'Semestral (6 meses)', anual: 'Anual (12 meses)' };
  function gerarItens(plano, ano, mesIni, incluirDatas, pontualData) {
    var itens = [];
    if (plano === 'pontual') {
      var x = pontualData;
      if (x) itens.push({ data_key: dayKey(x.data), mes: x.data.getMonth() + 1, titulo: x.nome, atividade: x.atividade, tipo: 'acao', nota: x.gancho });
      return itens;
    }
    var n = plano === 'semestral' ? 6 : 12;
    for (var i = 0; i < n; i++) {
      var mesAbs = mesIni - 1 + i;
      var m = (mesAbs % 12) + 1, a = ano + Math.floor(mesAbs / 12);
      var prog = D.PROGRAMA[m - 1];
      itens.push({ mes: m, ano: a, titulo: prog.tema, atividade: prog.atividade, tipo: 'acao', nota: prog.porque });
      if (prog.extra && plano === 'anual' && [1, 4, 9, 10].indexOf(m) >= 0) {
        itens.push({ mes: m, ano: a, titulo: 'Complemento: ' + D.atividade(prog.extra).nome, atividade: prog.extra, tipo: 'acao', nota: 'Reforço de escuta/lideranças no mês-chave.' });
      }
      if (incluirDatas) {
        D.datasDoAno(a).filter(function (x) { return x.data.getMonth() + 1 === m && x.cat === 'presentear' && x.rel >= 2; }).forEach(function (x) {
          itens.push({ data_key: dayKey(x.data), mes: m, ano: a, titulo: x.nome, atividade: 'giftcard', tipo: 'data', nota: x.presente });
        });
      }
    }
    return itens;
  }
  function estimativa(itens, pessoas) {
    var lo = 0, hi = 0;
    pessoas = Number(pessoas) || 0;
    itens.forEach(function (it) {
      var a = D.atividade(it.atividade); if (!a) return;
      var m = a.preco.match(/R\$\s*([\d.]+)(?:–([\d.]+))?/);
      if (!m) return;
      var l = parseFloat(m[1].replace(/\./g, '')), h = parseFloat((m[2] || m[1]).replace(/\./g, ''));
      if (/turma|encontro/.test(a.preco)) { lo += l; hi += h; }
      else { lo += l * pessoas; hi += h * pessoas; }
    });
    return { lo: lo, hi: hi };
  }
  function brlN(n) { return 'R$ ' + Math.round(n).toLocaleString('pt-BR'); }

  function rCronograma() {
    var dr = S.ui.draft;
    var salvos = S.crons;
    return head('Cronogramas', 'Monte o plano pontual, semestral ou anual de uma empresa em 1 minuto: temas do mês + atividades + datas de presentear. Copie, imprima em PDF ou salve.',
        '<button class="mh-btn mh-btn--terra" data-cron-novo>+ Montar cronograma</button>') +
      (dr ? rDraft(dr) : '') +
      '<div class="mh-card"><h3>Cronogramas salvos <small>' + salvos.length + '</small></h3>' +
      (salvos.length ? '<div class="mh-table-wrap"><table class="mh-table"><thead><tr><th>Empresa</th><th>Plano</th><th>Ano</th><th>Ações</th><th>Status</th><th></th></tr></thead><tbody>' +
        salvos.map(function (c) {
          var itens = Array.isArray(c.itens) ? c.itens : [];
          return '<tr><td><b>' + esc(c.empresa) + '</b>' + (c.colaboradores ? '<br><small>' + c.colaboradores + ' pessoas</small>' : '') + '</td><td>' + (PLANOS[c.plano] || c.plano) + '</td><td>' + c.ano + '</td><td>' + itens.length + '</td>' +
            '<td><span class="mh-chip ' + (c.status === 'aprovado' ? 'mh-chip--ok' : c.status === 'enviado' ? 'mh-chip--warn' : 'mh-chip--gray') + '">' + c.status + '</span></td>' +
            '<td style="white-space:nowrap"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-cron-abrir="' + c.id + '">Abrir</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="mh-empty">Nenhum cronograma salvo ainda.</div>') +
      '</div>';
  }
  function rDraft(dr) {
    var est = estimativa(dr.itens, dr.colaboradores);
    return '<div class="mh-card" style="margin-bottom:16px" id="mh-draft"><h3>' + esc(dr.empresa || 'Nova empresa') + ' — ' + (PLANOS[dr.plano] || '') + ' ' + dr.ano +
        ' <small>' + dr.itens.length + ' itens' + (dr.colaboradores ? ' · estimativa ' + brlN(est.lo) + ' – ' + brlN(est.hi) : '') + '</small></h3>' +
      dr.itens.map(function (it, i) {
        var a = D.atividade(it.atividade);
        var when = it.data_key ? fmtDia(it.data_key) : MES3[it.mes - 1] + (it.ano && it.ano !== dr.ano ? '/' + String(it.ano).slice(2) : '');
        return '<div class="mh-plan-item"><div class="when">' + when + '</div><div><b>' + (it.tipo === 'data' ? '🎁 ' : '') + esc(it.titulo) + '</b>' +
          '<div style="margin:5px 0"><select class="mh-select" data-draft-atv="' + i + '" style="padding:4px 8px;font-size:.8rem">' + atividadeOptions(it.atividade) + '</select></div>' +
          (it.nota ? '<small style="color:var(--mh-muted)">' + esc(it.nota) + '</small>' : '') +
          (a ? '<div style="margin-top:4px"><span class="mh-chip mh-chip--gray">' + esc(a.duracao) + '</span> <span class="mh-chip mh-chip--gray">' + esc(a.preco) + '</span></div>' : '') +
        '</div><button class="mh-btn mh-btn--ghost mh-btn--sm" data-draft-rm="' + i + '" title="Remover">✕</button></div>';
      }).join('') +
      '<div class="mh-modal__acts"><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="mh-btn mh-btn--ghost" data-draft-copy>Copiar texto</button>' +
        '<button class="mh-btn mh-btn--ghost" data-draft-print>Imprimir / PDF</button>' +
        (dr.id ? '<button class="mh-btn mh-btn--danger" data-draft-del>Excluir</button>' : '') +
      '</div><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<select class="mh-select" data-draft-status>' + optList({ rascunho: 'Rascunho', enviado: 'Enviado ao RH', aprovado: 'Aprovado' }, dr.status || 'rascunho') + '</select>' +
        '<button class="mh-btn mh-btn--ghost" data-draft-close>Fechar</button><button class="mh-btn" data-draft-save>Salvar cronograma</button>' +
      '</div></div></div>';
  }
  function abrirNovoCron() {
    var hoje = today0();
    var datas = datasProximas(365, 2);
    modal('Montar cronograma',
      empresasDatalist() +
      '<label>Empresa<input class="mh-input" name="empresa" list="mh-emp-list"></label>' +
      '<label>Colaboradores<input class="mh-input" type="number" min="1" name="colaboradores" placeholder="Ex.: 120"></label>' +
      '<label>Plano<select class="mh-select" name="plano">' + optList(PLANOS, 'anual') + '</select></label>' +
      '<label>Começa em<select class="mh-select" name="mes">' + MESES.map(function (m, i) {
        var nxt = (hoje.getMonth() + 1) % 12; return '<option value="' + (i + 1) + '"' + (i === nxt ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>' +
      '<label>Ano<input class="mh-input" type="number" name="ano" value="' + (hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear()) + '"></label>' +
      '<label>Data (plano pontual)<select class="mh-select" name="pontual">' + datas.map(function (x) {
        return '<option value="' + esc(dayKey(x.data) + '|' + x.nome) + '">' + fmtDia(x.data) + ' — ' + esc(x.nome) + '</option>'; }).join('') + '</select></label>' +
      '<label class="full check"><input type="checkbox" name="datas" checked> Incluir datas de presentear com gift card (Mães, Pais, Secretária, Cliente, fim de ano…)</label>',
      {
        okLabel: 'Gerar',
        onSubmit: function (d) {
          var ano = parseInt(d.ano, 10) || hoje.getFullYear();
          var mes = parseInt(d.mes, 10) || 1;
          if (d.plano === 'semestral' || d.plano === 'anual') {
            // Ano/mês de início valem pro programa; o gerador já vira o ano sozinho.
          }
          S.ui.draft = {
            empresa: d.empresa, colaboradores: d.colaboradores ? parseInt(d.colaboradores, 10) : null, plano: d.plano, ano: ano, status: 'rascunho',
            itens: gerarItens(d.plano, ano, mes, !!d.datas, d.pontual ? acharData(d.pontual) : null)
          };
          render();
          var el = $('mh-draft'); if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      });
  }
  function textoCron(dr) {
    var est = estimativa(dr.itens, dr.colaboradores);
    var linhas = ['CRONOGRAMA DE SAÚDE MENTAL — ' + (dr.empresa || '').toUpperCase(), 'Elarah Mental Health · ' + (PLANOS[dr.plano] || '') + ' · ' + dr.ano, ''];
    dr.itens.forEach(function (it) {
      var a = D.atividade(it.atividade);
      var when = it.data_key ? fmtDia(it.data_key) : MESES[it.mes - 1];
      linhas.push('• ' + when + ' — ' + it.titulo + (a ? ': ' + a.emoji + ' ' + a.nome + ' (' + a.duracao + ')' : ''));
      if (a) linhas.push('   ' + a.beneficio);
    });
    if (dr.colaboradores) linhas.push('', 'Investimento estimado para ' + dr.colaboradores + ' pessoas: ' + brlN(est.lo) + ' a ' + brlN(est.hi) + ' (valores de referência; proposta final sob medida).');
    linhas.push('', 'Inclui: planejamento, facilitadoras, materiais, fotos, lista de presença e relatório de cada ação para o plano de riscos psicossociais (NR-1).');
    return linhas.join('\n');
  }
  function imprimirCron(dr) {
    var est = estimativa(dr.itens, dr.colaboradores);
    var w = window.open('', '_blank');
    if (!w) { alert('Libere pop-ups pra imprimir.'); return; }
    var rows = dr.itens.map(function (it) {
      var a = D.atividade(it.atividade);
      var when = it.data_key ? fmtDia(it.data_key) : MESES[it.mes - 1];
      return '<tr><td class="w">' + esc(when) + '</td><td><b>' + esc(it.titulo) + '</b>' + (a ? '<br>' + a.emoji + ' ' + esc(a.nome) + ' · ' + esc(a.duracao) + '<br><span class="b">' + esc(a.beneficio) + '</span>' : '') + '</td></tr>';
    }).join('');
    w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cronograma — ' + esc(dr.empresa) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">' +
      '<style>body{font-family:"DM Sans",sans-serif;color:#16302a;max-width:780px;margin:40px auto;padding:0 24px}h1{font-family:"DM Serif Display",serif;font-weight:400;font-size:2.2rem;margin:0}' +
      '.k{color:#d9774b;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:.75rem}table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:12px 8px;border-top:1px solid #e3e0d8;vertical-align:top;font-size:.92rem}' +
      '.w{width:110px;color:#1f4d3f;font-weight:700;text-transform:uppercase;font-size:.8rem}.b{color:#6b716d;font-size:.84rem}.box{background:#e6efe9;border-radius:12px;padding:16px 18px;margin-top:24px;font-size:.9rem}</style></head><body>' +
      '<div class="k">Elarah Mental Health</div><h1>Cronograma de saúde mental</h1><p>' + esc(dr.empresa) + ' · ' + esc(PLANOS[dr.plano] || '') + ' · ' + dr.ano + (dr.colaboradores ? ' · ' + dr.colaboradores + ' colaboradores' : '') + '</p>' +
      '<table>' + rows + '</table>' +
      '<div class="box"><b>O que está incluso:</b> planejamento, facilitadoras, materiais, fotos, lista de presença e relatório de cada ação para anexar ao plano de ação de riscos psicossociais (NR-1).' +
      (dr.colaboradores ? '<br><br><b>Investimento de referência:</b> ' + brlN(est.lo) + ' a ' + brlN(est.hi) + ' — proposta final sob medida.' : '') + '</div>' +
      '<p style="margin-top:28px;font-size:.84rem;color:#6b716d">contato.elarah@gmail.com · +55 11 91445-5930 · elarah.com.br</p>' +
      '<script>setTimeout(function(){window.print()},600)<\/script></body></html>');
    w.document.close();
  }

  // =============================================================
  // PEDIDOS DO SITE (landing)
  // =============================================================
  var STATUS_LEAD = { novo: 'Novo', em_contato: 'Em contato', convertido: 'Convertido', descartado: 'Descartado' };
  function rLeads() {
    return head('Pedidos do site', 'Quem pediu proposta pela landing page <a href="saude-mental-empresas.html" target="_blank" rel="noopener">saude-mental-empresas.html</a>. Responda em até 2 horas.') +
      '<div class="mh-card">' + (S.leads.length ? '<div class="mh-table-wrap"><table class="mh-table"><thead><tr><th>Quando</th><th>Empresa</th><th>Contato</th><th>Time</th><th>Interesse</th><th>Status</th><th></th></tr></thead><tbody>' +
        S.leads.map(function (l) {
          var wa = waLink(l.whatsapp, 'Oi, ' + (l.nome || '').split(' ')[0] + '! Aqui é da Elarah Mental Health 💚 Recebemos seu pedido pela ' + l.empresa + ' e já estou montando uma proposta. Posso te fazer 3 perguntas rápidas?');
          return '<tr><td>' + fmtDia(new Date(l.created_at)) + '</td><td><b>' + esc(l.empresa) + '</b>' + (l.mensagem ? '<br><small>' + esc(l.mensagem) + '</small>' : '') + '</td>' +
            '<td>' + esc(l.nome) + (l.cargo ? '<br><small>' + esc(l.cargo) + '</small>' : '') + (l.email ? '<br><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>' : '') + '</td>' +
            '<td>' + esc(l.colaboradores || '—') + '</td><td>' + esc(l.plano || '—') + '</td>' +
            '<td><select class="mh-select" data-lead-status="' + l.id + '">' + optList(STATUS_LEAD, l.status) + '</select></td>' +
            '<td style="white-space:nowrap">' + (wa ? '<a class="mh-btn mh-btn--sm" href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a> ' : '') +
            '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-lead-prosp="' + l.id + '">→ Prospecção</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="mh-empty">Nenhum pedido ainda. Divulgue a landing page no LinkedIn e nas mensagens de prospecção.</div>') + '</div>';
  }

  // =============================================================
  // IDEIAS & PROGRAMA ANUAL
  // =============================================================
  function rIdeias() {
    var f = S.ui.fator || '';
    var fm = S.ui.formato || '';
    var ativs = D.ATIVIDADES.filter(function (a) {
      return (!f || a.fatores.indexOf(f) >= 0) && (!fm || a.formatos.indexOf(fm) >= 0);
    });
    return head('Ideias & programa anual', 'O programa-modelo mês a mês e a biblioteca de experiências — com o benefício pra saúde mental e o fator de risco psicossocial (NR-1) que cada uma ajuda a trabalhar.',
        '<button class="mh-btn mh-btn--terra" data-cron-novo>Usar num cronograma</button>') +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-weight:400;margin:6px 0 12px">Programa anual “12 meses de cuidado”</h2>' +
      '<div class="mh-grid mh-grid--4">' + D.PROGRAMA.map(function (p) {
        var a = D.atividade(p.atividade), x = p.extra ? D.atividade(p.extra) : null;
        return '<div class="mh-card mh-month"><div class="m">' + MESES[p.mes - 1] + '</div><b style="display:block;margin:4px 0 6px">' + esc(p.tema) + '</b>' +
          '<div class="meta" style="display:flex;gap:4px;flex-wrap:wrap"><span class="mh-chip">' + a.emoji + ' ' + esc(a.nome) + '</span>' + (x ? '<span class="mh-chip mh-chip--terra">+ ' + x.emoji + ' ' + esc(x.nome) + '</span>' : '') + '</div>' +
          '<p style="font-size:.8rem;color:var(--mh-muted);margin:8px 0 0">' + esc(p.porque) + '</p></div>';
      }).join('') + '</div>' +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-weight:400;margin:28px 0 12px">Biblioteca de experiências <small style="font-family:\'DM Sans\';font-size:.85rem;color:var(--mh-muted)">' + ativs.length + '</small></h2>' +
      '<div class="mh-toolbar"><select class="mh-select" data-filtro-fator><option value="">Todos os fatores de risco</option>' + optList(D.FATORES, f) + '</select>' +
        '<select class="mh-select" data-filtro-formato><option value="">Todos os formatos</option>' + optList(D.FORMATOS, fm) + '</select></div>' +
      '<div class="mh-grid mh-grid--3">' + ativs.map(function (a) {
        return '<div class="mh-card mh-idea"><div class="emo">' + a.emoji + '</div><h4>' + esc(a.nome) + (a.destaque ? ' <span class="mh-chip mh-chip--terra">⭐ campeã</span>' : '') + '</h4>' +
          '<p>' + esc(a.resumo) + '</p><p style="color:var(--mh-green)"><b>Por que funciona:</b> ' + esc(a.beneficio) + '</p>' +
          '<div class="meta">' + a.fatores.map(function (k) { return '<span class="mh-chip mh-chip--gray">' + esc(D.FATORES[k]) + '</span>'; }).join('') + '</div>' +
          '<div class="meta"><span class="mh-chip">⏱ ' + esc(a.duracao) + '</span><span class="mh-chip">👥 ' + esc(a.grupo) + '</span>' + a.formatos.map(function (k) { return '<span class="mh-chip">' + D.FORMATOS[k] + '</span>'; }).join('') + '</div>' +
          '<div class="foot"><b style="font-size:.86rem">' + esc(a.preco) + '</b><button class="mh-btn mh-btn--ghost mh-btn--sm" data-evento-atv="' + a.id + '">+ Evento</button></div></div>';
      }).join('') + '</div>';
  }

  // =============================================================
  // DATAS PARA O RH
  // =============================================================
  function rDatas() {
    var ano = S.ui.ano || today0().getFullYear();
    var cat = S.ui.cat || '';
    var lista = D.datasDoAno(ano).filter(function (x) { return !cat || x.cat === cat; });
    var porMes = {};
    lista.forEach(function (x) { (porMes[x.data.getMonth()] = porMes[x.data.getMonth()] || []).push(x); });
    return head('Datas para o RH', 'Calendário corporativo: campanhas de saúde, homenagens por profissão e datas de presentear. Comece a oferecer ~30 dias antes. Gift cards Elarah entram como presente em qualquer data.') +
      '<div class="mh-toolbar"><select class="mh-select" data-ano>' + [ano - 1, ano, ano + 1].map(function (a) { return '<option' + (a === ano ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>' +
        '<button class="mh-btn mh-btn--sm ' + (!cat ? '' : 'mh-btn--ghost') + '" data-cat="">Todas</button>' +
        Object.keys(D.CATS_DATA).map(function (k) { var c = D.CATS_DATA[k]; return '<button class="mh-btn mh-btn--sm ' + (cat === k ? '' : 'mh-btn--ghost') + '" data-cat="' + k + '">' + c.emoji + ' ' + c.label + '</button>'; }).join('') +
      '</div>' +
      Object.keys(porMes).map(function (m) {
        return '<div class="mh-card" style="margin-bottom:14px"><h3>' + MESES[m] + '</h3><div class="mh-list">' + porMes[m].map(function (x) {
          var n = diasAte(x.data);
          var tag = n < 0 ? '<span class="mh-chip mh-chip--gray">passou</span>' : n <= 30 ? '<span class="mh-chip mh-chip--danger">em ' + n + ' dias — urgente</span>' : n <= 60 ? '<span class="mh-chip mh-chip--warn">oferecer agora</span>' : '';
          return rowData(x).replace('</strong>', '</strong>' + (x.rel === 3 ? ' <span class="mh-chip mh-chip--terra">★ forte</span> ' : ' ') + tag);
        }).join('') + '</div></div>';
      }).join('');
  }

  // =============================================================
  // PROSPECÇÃO
  // =============================================================
  var STATUS_P = {
    nao_contatado: 'Não contatada', mensagem_enviada: 'Mensagem enviada', respondeu: 'Respondeu', reuniao_marcada: 'Reunião marcada',
    proposta_enviada: 'Proposta enviada', negociacao: 'Negociação', fechado: 'Fechou', cliente_ativo: 'Cliente ativo', pausado: 'Pausado', recusou: 'Recusou'
  };
  function assinatura() { return lsGet('elarah_mh_assinatura', 'Um abraço,\n[Seu nome]\nElarah Mental Health\n+55 11 91445-5930 · elarah.com.br/saude-mental-empresas'); }
  function preencher(txt, p) {
    var g = ganchoAtual();
    var contato = (p.contato_nome || '').split(' ')[0] || 'tudo bem';
    return String(txt)
      .replace(/Olá, \{contato\}!/g, p.contato_nome ? 'Olá, ' + contato + '!' : 'Olá!')
      .replace(/Oi, \{contato\}!/g, p.contato_nome ? 'Oi, ' + contato + '!' : 'Oi!')
      .replace(/\{contato\}, /g, p.contato_nome ? contato + ', ' : '')
      .replace(/\{contato\}/g, p.contato_nome ? contato : 'pessoal do RH')
      .replace(/\{empresa\}/g, p.nome || 'sua empresa')
      .replace(/\{segmento\}/g, (p.segmento || 'seu setor').toLowerCase())
      .replace(/\{gancho\}/g, g ? g.nome : 'próximo mês')
      .replace(/\{data_gancho\}/g, g ? fmtDia(g.data) : '')
      .replace(/\{assinatura\}/g, assinatura());
  }
  function emailsSugeridos(p) {
    var out = [];
    if (p.contato_email) out.push(p.contato_email);
    var dom = dominio(p.site);
    if (dom && !/instagram|facebook|linktr|wa\.me|google/.test(dom)) ['rh', 'pessoas', 'contato'].forEach(function (u) { out.push(u + '@' + dom); });
    return out;
  }

  function rProsp() {
    var ps = prospStats();
    var pct = Math.min(100, Math.round(ps.contatadas / META_SEMANA * 100));
    var fs = S.ui.pStatus || 'nao_contatado';
    var q = (S.ui.pBusca || '').toLowerCase();
    var seg = S.ui.pSeg || '';
    var lista = S.prospects.filter(function (p) {
      return (fs === 'todos' || p.status_comercial === fs) &&
        (!q || (p.nome + ' ' + (p.segmento || '') + ' ' + (p.contato_nome || '')).toLowerCase().indexOf(q) >= 0) &&
        (!seg || p.segmento === seg);
    });
    var segs = {}; S.prospects.forEach(function (p) { if (p.segmento) segs[p.segmento] = 1; });
    var pag = S.ui.pPag || 50;
    var g = ganchoAtual();
    return head('Prospecção', 'Meta: ' + META_SEMANA + ' empresas abordadas por semana. O agente traz ~100 empresas novas toda segunda (Google Maps); cada linha já vem com e-mail, LinkedIn, WhatsApp e roteiro de ligação prontos.',
        '<button class="mh-btn mh-btn--terra" id="mh-finder">🔎 Buscar 100 empresas agora</button><button class="mh-btn mh-btn--ghost" data-prosp-novo>+ Empresa</button><button class="mh-btn mh-btn--ghost" data-prosp-import>Importar lista</button>') +
      '<div id="mh-finder-status" style="font-size:.84rem;margin:-8px 0 12px;color:var(--mh-muted)"></div>' +
      '<div class="mh-grid mh-grid--4" style="margin-bottom:16px">' +
        '<div class="mh-card mh-kpi"><div class="lbl">Abordadas na semana</div><div class="val">' + ps.contatadas + ' <span style="font-size:1rem;color:var(--mh-muted)">/ ' + META_SEMANA + '</span></div><div class="mh-progress"><i style="width:' + pct + '%"></i></div><div class="sub">' + ps.hoje + ' hoje</div></div>' +
        kpi('Novas na semana', ps.novas, 'chegaram desde segunda') +
        kpi('Na fila', ps.naFila, 'ainda não contatadas') +
        kpi('Gancho da vez', g ? esc(g.nome) : '—', g ? fmtDia(g.data) + ' · usado nas mensagens' : '') +
      '</div>' +
      '<div class="mh-toolbar">' +
        '<select class="mh-select" data-p-status><option value="todos">Todos os status</option>' + optList(STATUS_P, fs) + '</select>' +
        '<select class="mh-select" data-p-seg><option value="">Todos os segmentos</option>' + Object.keys(segs).sort().map(function (s) { return '<option' + (s === seg ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<input class="mh-input" data-p-busca placeholder="Buscar empresa…" value="' + esc(S.ui.pBusca || '') + '" style="flex:1;min-width:160px">' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-assinatura>✍️ Minha assinatura</button>' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-csv>⬇ CSV</button>' +
      '</div>' +
      '<div class="mh-card"><h3>' + lista.length + ' empresa(s)</h3>' +
      (lista.length ? '<div class="mh-table-wrap"><table class="mh-table"><thead><tr><th>Empresa</th><th>Segmento</th><th>Contato</th><th>Status</th><th></th></tr></thead><tbody>' +
        lista.slice(0, pag).map(rowProsp).join('') + '</tbody></table></div>' +
        (lista.length > pag ? '<div style="text-align:center;margin-top:12px"><button class="mh-btn mh-btn--ghost" data-p-mais>Mostrar mais (' + (lista.length - pag) + ')</button></div>' : '')
        : '<div class="mh-empty">Nada aqui. Clique em “Buscar 100 empresas agora” ou importe uma lista (nome; site; telefone; e-mail; LinkedIn; contato; cargo; segmento).</div>') +
      '</div>';
  }
  function rowProsp(p) {
    var open = S.ui.pOpen === p.id;
    var tel = p.telefone || p.contato_whatsapp;
    var html = '<tr class="' + (open ? 'is-open' : '') + '"><td><b>' + esc(p.nome) + '</b>' + (p.site ? '<br><a href="' + esc(/^https?:/i.test(p.site) ? p.site : 'https://' + p.site) + '" target="_blank" rel="noopener" style="font-size:.78rem">' + esc(dominio(p.site) || p.site) + '</a>' : '') + '</td>' +
      '<td>' + esc(p.segmento || '—') + '</td>' +
      '<td>' + (p.contato_nome ? esc(p.contato_nome) + (p.contato_cargo ? '<br><small>' + esc(p.contato_cargo) + '</small>' : '') : '') + (tel ? '<br><small>' + esc(tel) + '</small>' : '') + '</td>' +
      '<td><select class="mh-select" data-p-set-status="' + p.id + '" style="padding:4px 8px;font-size:.8rem">' + optList(STATUS_P, p.status_comercial) + '</select>' +
        (p.proxima_acao_at ? '<br><small>↩ ' + fmtDia(new Date(p.proxima_acao_at)) + '</small>' : '') + '</td>' +
      '<td style="white-space:nowrap"><button class="mh-btn mh-btn--sm ' + (open ? '' : 'mh-btn--ghost') + '" data-p-open="' + p.id + '">' + (open ? 'Fechar' : 'Abordar') + '</button></td></tr>';
    if (open) html += '<tr class="is-open"><td colspan="5">' + painelAbordagem(p) + '</td></tr>';
    return html;
  }
  function painelAbordagem(p) {
    var canal = S.ui.canal || 'email';
    var tel = p.telefone || p.contato_whatsapp;
    var emails = emailsSugeridos(p);
    var liEmp = 'https://www.linkedin.com/search/results/companies/?keywords=' + encodeURIComponent(p.nome);
    var liRH = 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(p.nome + ' RH OR "gente e cultura" OR people');
    var msgs = D.MENSAGENS[canal] || [];
    var nomes = { email: '✉️ E-mail', linkedin: 'in LinkedIn', whatsapp: '💬 WhatsApp', ligacao: '📞 Ligação' };
    return '<div class="mh-channels">' +
      (tel ? '<a class="mh-btn mh-btn--ghost mh-btn--sm" href="tel:' + digits(tel) + '">📞 ' + esc(tel) + '</a>' : '') +
      (tel && ehCelular(tel) ? '<a class="mh-btn mh-btn--ghost mh-btn--sm" href="' + waLink(tel) + '" target="_blank" rel="noopener">💬 WhatsApp</a>' : '') +
      emails.map(function (e, i) { return '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-copy-txt="' + esc(e) + '" title="' + (i === 0 && p.contato_email ? 'e-mail cadastrado' : 'sugestão pelo domínio — confirme antes') + '">✉️ ' + esc(e) + (i === 0 && p.contato_email ? '' : ' ?') + '</button>'; }).join('') +
      (p.contato_linkedin ? '<a class="mh-btn mh-btn--ghost mh-btn--sm" href="' + esc(p.contato_linkedin) + '" target="_blank" rel="noopener">in Perfil</a>' : '') +
      '<a class="mh-btn mh-btn--ghost mh-btn--sm" href="' + liRH + '" target="_blank" rel="noopener">in Achar o RH</a>' +
      '<a class="mh-btn mh-btn--ghost mh-btn--sm" href="' + liEmp + '" target="_blank" rel="noopener">in Página da empresa</a>' +
      '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-p-edit="' + p.id + '">✏️ Dados</button>' +
      '</div>' +
      '<div class="mh-tabs">' + Object.keys(nomes).map(function (k) { return '<button class="mh-tab' + (canal === k ? ' mh-tab--on' : '') + '" data-canal="' + k + '">' + nomes[k] + '</button>'; }).join('') + '</div>' +
      msgs.map(function (m) {
        var corpo = preencher(m.corpo, p);
        var assunto = m.assunto ? preencher(m.assunto, p) : '';
        var extra = '';
        if (canal === 'email') extra = '<a class="mh-btn mh-btn--sm" href="' + gmailLink(emails[0], assunto, corpo) + '" target="_blank" rel="noopener" data-p-enviado="' + p.id + '" data-canal-tipo="e-mail">Abrir no Gmail</a>';
        if (canal === 'whatsapp' && tel && ehCelular(tel)) extra = '<a class="mh-btn mh-btn--sm" href="' + waLink(tel, corpo) + '" target="_blank" rel="noopener" data-p-enviado="' + p.id + '" data-canal-tipo="WhatsApp">Enviar no WhatsApp</a>';
        return '<div class="mh-msg"><div class="hd"><b>' + esc(m.angulo) + (canal === 'linkedin' && m.id === 'li-convite' ? ' · ' + corpo.length + '/300' : '') + '</b><div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-copy-txt="' + esc((assunto ? 'Assunto: ' + assunto + '\n\n' : '') + corpo) + '">Copiar</button>' + extra + '</div></div>' +
          (assunto ? '<pre style="font-weight:700;margin-bottom:6px">' + esc(assunto) + '</pre>' : '') + '<pre>' + esc(corpo) + '</pre></div>';
      }).join('') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center">' +
        '<button class="mh-btn" data-p-marcar="' + p.id + '">✓ Marquei como abordada (follow-up em 3 dias)</button>' +
        '<button class="mh-btn mh-btn--ghost" data-p-evento="' + p.id + '">+ Criar orçamento</button>' +
      '</div>';
  }

  async function registrarAbordagem(id, canalTxt) {
    var p = S.prospects.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var fu = addDays(today0(), 3); fu.setHours(9, 0, 0, 0);
    var patch = { proxima_acao: 'Follow-up da 1ª mensagem' + (canalTxt ? ' (' + canalTxt + ')' : ''), proxima_acao_at: fu.toISOString() };
    if (p.status_comercial === 'nao_contatado') patch.status_comercial = 'mensagem_enviada';
    try {
      await dbSave('b2b_prospects', Object.assign({ id: id }, patch));
      Object.assign(p, patch);
      var inter = { prospect_id: id, tipo: 'mensagem_enviada', descricao: 'Abordagem Elarah Mental Health' + (canalTxt ? ' via ' + canalTxt : ''), occurred_at: new Date().toISOString() };
      await dbSave('b2b_prospect_interactions', inter);
      S.interacoes.push(inter);
      toast('Abordagem registrada ✓ follow-up ' + fmtDia(fu));
      render();
    } catch (e) { alert('Não deu pra registrar: ' + e.message); }
  }

  function abrirProspect(p) {
    p = p || { status_comercial: 'nao_contatado', potencial: 'medio', cidade: 'São Paulo' };
    modal(p.id ? 'Dados da empresa' : 'Nova empresa',
      '<label class="full">Empresa<input class="mh-input" name="nome" value="' + esc(p.nome || '') + '"></label>' +
      '<label>Segmento<input class="mh-input" name="segmento" value="' + esc(p.segmento || '') + '"></label>' +
      '<label>Site<input class="mh-input" name="site" value="' + esc(p.site || '') + '"></label>' +
      '<label>Telefone<input class="mh-input" name="telefone" value="' + esc(p.telefone || '') + '"></label>' +
      '<label>WhatsApp do contato<input class="mh-input" name="contato_whatsapp" value="' + esc(p.contato_whatsapp || '') + '"></label>' +
      '<label>Contato (nome)<input class="mh-input" name="contato_nome" value="' + esc(p.contato_nome || '') + '"></label>' +
      '<label>Cargo<input class="mh-input" name="contato_cargo" value="' + esc(p.contato_cargo || '') + '" placeholder="Head de Pessoas, RH, SESMT…"></label>' +
      '<label>E-mail<input class="mh-input" name="contato_email" value="' + esc(p.contato_email || '') + '"></label>' +
      '<label>LinkedIn do contato<input class="mh-input" name="contato_linkedin" value="' + esc(p.contato_linkedin || '') + '"></label>' +
      '<label>Próxima ação<input class="mh-input" name="proxima_acao" value="' + esc(p.proxima_acao || '') + '"></label>' +
      '<label>Quando<input class="mh-input" type="date" name="proxima_data" value="' + (p.proxima_acao_at ? dayKey(new Date(p.proxima_acao_at)) : '') + '"></label>' +
      '<label class="full">Observações<textarea class="mh-textarea" name="observacoes">' + esc(p.observacoes || '') + '</textarea></label>',
      {
        onSubmit: async function (d) {
          if (!d.nome) { alert('Informe o nome da empresa.'); return false; }
          var row = {
            nome: d.nome, segmento: d.segmento || null, site: d.site || null, telefone: d.telefone || null,
            contato_whatsapp: d.contato_whatsapp || null, contato_nome: d.contato_nome || null, contato_cargo: d.contato_cargo || null,
            contato_email: d.contato_email || null, contato_linkedin: d.contato_linkedin || null,
            proxima_acao: d.proxima_acao || null, proxima_acao_at: d.proxima_data ? new Date(d.proxima_data + 'T09:00:00').toISOString() : null,
            observacoes: d.observacoes || null
          };
          if (p.id) row.id = p.id;
          else { row.frente = 'mh'; row.origem = 'manual_mh'; row.status_comercial = 'nao_contatado'; row.potencial = 'medio'; row.cidade = 'São Paulo'; }
          await salvarProspect(row);
          await carregarProspects(); toast('Empresa salva ✓'); render();
        }
      });
  }
  // Se o banco ainda não tem as colunas novas (telefone/frente/origem),
  // tenta de novo sem elas em vez de travar o cadastro.
  async function salvarProspect(row) {
    try { return await dbSave('b2b_prospects', row); }
    catch (e) {
      if (!/column|telefone|frente|origem|endereco/i.test(e.message)) throw e;
      var r = Object.assign({}, row);
      if (r.telefone && !r.contato_whatsapp) r.contato_whatsapp = r.telefone;
      delete r.telefone; delete r.frente; delete r.origem; delete r.endereco; delete r.google_place_id;
      return await dbSave('b2b_prospects', r);
    }
  }

  function abrirImport() {
    modal('Importar lista de empresas',
      '<label class="full">Cole uma empresa por linha (separe por ponto e vírgula ou tab)<textarea class="mh-textarea" name="csv" style="min-height:200px" placeholder="nome; site; telefone; e-mail; linkedin; contato; cargo; segmento\nAcme Tecnologia; acme.com.br; (11) 3333-4444; rh@acme.com.br; ; Ana Souza; Head de Pessoas; Tecnologia"></textarea></label>' +
      '<p class="full" style="font-size:.8rem;color:var(--mh-muted);margin:0">Dica: dá pra exportar do Apollo, Econodata, Casa dos Dados ou Sales Navigator e colar aqui. Só o nome é obrigatório.</p>',
      {
        okLabel: 'Importar',
        onSubmit: async function (d) {
          var linhas = d.csv.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
          if (linhas.length && /^nome/i.test(linhas[0])) linhas.shift();
          var existentes = {}; S.prospects.forEach(function (p) { existentes[p.nome.toLowerCase()] = 1; });
          var n = 0, pulos = 0;
          for (var i = 0; i < linhas.length; i++) {
            var c = linhas[i].split(/\t|;/).map(function (x) { return x.trim(); });
            if (!c[0] || existentes[c[0].toLowerCase()]) { pulos++; continue; }
            existentes[c[0].toLowerCase()] = 1;
            await salvarProspect({
              nome: c[0], site: c[1] || null, telefone: c[2] || null, contato_email: c[3] || null, contato_linkedin: c[4] || null,
              contato_nome: c[5] || null, contato_cargo: c[6] || null, segmento: c[7] || null,
              frente: 'mh', origem: 'import_mh', status_comercial: 'nao_contatado', potencial: 'medio', cidade: 'São Paulo'
            });
            n++;
          }
          await carregarProspects(); toast(n + ' importadas' + (pulos ? ' · ' + pulos + ' repetidas/puladas' : '')); render();
        }
      });
  }

  async function rodarFinder() {
    var btn = $('mh-finder'), st = $('mh-finder-status');
    var c = sb(); if (!c) return;
    var s = await c.auth.getSession();
    var tk = s.data && s.data.session && s.data.session.access_token;
    if (!tk) { st.textContent = 'Sessão expirou — entre de novo.'; return; }
    btn.disabled = true;
    st.textContent = 'Buscando empresas no Google Maps… pode levar até 2 minutos.';
    try {
      var url = (c.supabaseUrl || 'https://nwijxjmenbfyehvscogs.supabase.co') + '/functions/v1/mh-empresas-finder';
      var res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk }, body: JSON.stringify({ target: META_SEMANA }) });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || !d.ok) throw new Error(d.error || ('HTTP ' + res.status + (res.status === 404 ? ' — a função mh-empresas-finder ainda não foi publicada' : '')));
      st.innerHTML = '✅ <b>' + (d.inseridos || 0) + '</b> empresas novas adicionadas.';
      await carregarProspects(); S.ui.pStatus = 'nao_contatado'; render();
    } catch (e) {
      st.innerHTML = '<span style="color:var(--mh-danger)">Não deu: ' + esc(e.message || e) + '</span>';
      btn.disabled = false;
    }
  }

  function exportarCSV() {
    var cols = ['nome', 'segmento', 'site', 'telefone', 'contato_nome', 'contato_cargo', 'contato_email', 'contato_linkedin', 'status_comercial'];
    var linhas = [cols.join(';')].concat(S.prospects.map(function (p) {
      return cols.map(function (c) { return String(p[c] == null ? '' : p[c]).replace(/[;\n\r]/g, ' '); }).join(';');
    }));
    var blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'prospeccao-mental-health-' + dayKey() + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // =============================================================
  // CAPTAÇÃO
  // =============================================================
  function rCaptacao() {
    var st = lsGet('elarah_mh_captacao', {});
    var ST = { ideia: 'Ideia', fazendo: 'Fazendo', feito: 'Feito' };
    return head('Captação', 'Como chegar nas empresas além da prospecção direta: ações de marketing, parcerias, iscas digitais e posts prontos pra publicar.') +
      '<div class="mh-card" style="margin-bottom:16px;background:linear-gradient(120deg,#1f4d3f,#2e6a57);color:#fff;border:0">' +
        '<h3 style="color:#fff">Ritmo semanal sugerido</h3>' +
        '<div class="mh-grid mh-grid--4" style="gap:10px">' +
          [['Seg', 'Post LinkedIn (educativo NR-1)'], ['Qua', 'Carrossel/Reels no Instagram (bastidores)'], ['Qui', 'Convite pro Café com RHs / webinar'], ['Sex', 'Case da semana + pedir depoimento']].map(function (x) {
            return '<div style="background:rgba(255,255,255,.1);border-radius:10px;padding:10px 12px"><b>' + x[0] + '</b><div style="font-size:.84rem;opacity:.9">' + x[1] + '</div></div>';
          }).join('') +
        '</div></div>' +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-weight:400;margin:6px 0 12px">Ações para chegar nas empresas</h2>' +
      '<div class="mh-grid mh-grid--3">' + D.CAPTACAO.map(function (a, i) {
        var s = st[i] || 'ideia';
        return '<div class="mh-card mh-idea"><div class="meta"><span class="mh-chip">' + esc(a.tipo) + '</span><span class="mh-chip mh-chip--gray">esforço ' + a.esforco + '</span><span class="mh-chip ' + (a.impacto === 'alto' ? 'mh-chip--terra' : 'mh-chip--gray') + '">impacto ' + a.impacto + '</span></div>' +
          '<h4>' + esc(a.titulo) + '</h4><p>' + esc(a.desc) + '</p>' +
          '<div class="foot"><select class="mh-select" data-capt="' + i + '" style="padding:4px 8px;font-size:.8rem">' + optList(ST, s) + '</select></div></div>';
      }).join('') + '</div>' +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-weight:400;margin:28px 0 12px">Posts prontos</h2>' +
      '<div class="mh-grid mh-grid--2">' + D.POSTS.map(function (p, i) {
        return '<div class="mh-card"><h3>' + esc(p.titulo) + ' <span class="mh-chip">' + esc(p.canal) + '</span></h3><div class="mh-msg" style="margin-top:0"><pre>' + esc(p.texto) + '</pre></div>' +
          '<div style="margin-top:10px"><button class="mh-btn mh-btn--sm" data-copy-post="' + i + '">Copiar</button></div></div>';
      }).join('') + '</div>';
  }

  // =============================================================
  // EVENTOS DE TELA (delegação)
  // =============================================================
  function bind() {
    document.addEventListener('click', async function (e) {
      var t = e.target.closest('button, a');
      if (!t) return;
      var ds = t.dataset;
      if (t.classList.contains('mh__nav-item')) return ir(ds.panel);
      if (ds.go) { e.preventDefault(); return ir(ds.go); }
      if ('newEvento' in ds) return abrirEvento();
      if (ds.editEvento) return abrirEvento(S.eventos.filter(function (x) { return x.id === ds.editEvento; })[0]);
      if (ds.eventoData) {
        var x = acharData(ds.eventoData);
        return abrirEvento(null, { titulo: x.nome + ' — ' + (D.atividade(x.atividade) || {}).nome, data_evento: dayKey(x.data), atividade: x.atividade, observacoes: x.presente });
      }
      if (ds.eventoAtv) { var a = D.atividade(ds.eventoAtv); return abrirEvento(null, { titulo: a.nome, atividade: a.id, formato: a.formatos[0] }); }
      if (ds.pitch) { var xx = acharData(ds.pitch); return copiar(preencher(pitchRH(xx), {})); }
      if (ds.copyPost != null) return copiar(D.POSTS[+ds.copyPost].texto);
      if (ds.copyTxt != null) return copiar(ds.copyTxt);
      if (ds.evtFiltro) { S.ui.evtFiltro = ds.evtFiltro; return render(); }
      if (ds.semana) { S.ui.semana = ds.semana; return render(); }
      if ('acompNovo' in ds) return abrirAcomp('');
      if (ds.acompEmp) return abrirAcomp(ds.acompEmp);
      if ('cronNovo' in ds) { if (S.panel !== 'cronograma') ir('cronograma'); return abrirNovoCron(); }
      if (ds.cronAbrir) {
        var c = S.crons.filter(function (x) { return x.id === ds.cronAbrir; })[0];
        S.ui.draft = JSON.parse(JSON.stringify(c)); S.ui.draft.itens = Array.isArray(S.ui.draft.itens) ? S.ui.draft.itens : [];
        render(); var el = $('mh-draft'); if (el) el.scrollIntoView({ behavior: 'smooth' }); return;
      }
      if (ds.draftRm != null) { S.ui.draft.itens.splice(+ds.draftRm, 1); return render(); }
      if ('draftClose' in ds) { S.ui.draft = null; return render(); }
      if ('draftCopy' in ds) return copiar(textoCron(S.ui.draft));
      if ('draftPrint' in ds) return imprimirCron(S.ui.draft);
      if ('draftDel' in ds) {
        if (!confirm('Excluir este cronograma?')) return;
        await dbDelete('mh_cronogramas', S.ui.draft.id); S.crons = S.crons.filter(function (x) { return x.id !== S.ui.draft.id; });
        S.ui.draft = null; return render();
      }
      if ('draftSave' in ds) {
        var dr = S.ui.draft;
        if (!dr.empresa) { dr.empresa = prompt('Nome da empresa:') || ''; if (!dr.empresa) return; }
        var row = { empresa: dr.empresa, colaboradores: dr.colaboradores || null, plano: dr.plano, ano: dr.ano, itens: dr.itens, status: dr.status || 'rascunho' };
        if (dr.id) row.id = dr.id;
        try {
          var saved = await dbSave('mh_cronogramas', row);
          S.ui.draft.id = saved.id;
          S.crons = await dbList('mh_cronogramas', function (q) { return q.order('created_at', { ascending: false }).limit(300); });
          toast('Cronograma salvo ✓'); render();
        } catch (err) { alert('Não deu pra salvar: ' + err.message); }
        return;
      }
      if (ds.leadProsp) {
        var l = S.leads.filter(function (x) { return x.id === ds.leadProsp; })[0];
        return abrirProspect({ nome: l.empresa, contato_nome: l.nome, contato_cargo: l.cargo, contato_email: l.email, contato_whatsapp: l.whatsapp, observacoes: 'Veio pela landing. ' + (l.mensagem || ''), status_comercial: 'respondeu' });
      }
      if (ds.cat != null && S.panel === 'datas') { S.ui.cat = ds.cat; return render(); }
      if ('prospNovo' in ds) return abrirProspect();
      if ('prospImport' in ds) return abrirImport();
      if (t.id === 'mh-finder') return rodarFinder();
      if ('csv' in ds) return exportarCSV();
      if ('assinatura' in ds) {
        var v = prompt('Sua assinatura nos e-mails (use \\n para quebrar linha):', assinatura().replace(/\n/g, '\\n'));
        if (v != null) { lsSet('elarah_mh_assinatura', v.replace(/\\n/g, '\n')); render(); }
        return;
      }
      if (ds.pOpen) { S.ui.pOpen = S.ui.pOpen === ds.pOpen ? null : ds.pOpen; return render(); }
      if (ds.canal) { S.ui.canal = ds.canal; return render(); }
      if (ds.pEdit) return abrirProspect(S.prospects.filter(function (x) { return x.id === ds.pEdit; })[0]);
      if (ds.pMarcar) return registrarAbordagem(ds.pMarcar, '');
      if (ds.pEnviado) { setTimeout(function () { registrarAbordagem(ds.pEnviado, ds.canalTipo); }, 300); return; }
      if (ds.pEvento) {
        var pp = S.prospects.filter(function (x) { return x.id === ds.pEvento; })[0];
        return abrirEvento(null, { empresa: pp.nome, contato: [pp.contato_nome, pp.contato_email || pp.contato_whatsapp].filter(Boolean).join(' · ') });
      }
      if ('pMais' in ds) { S.ui.pPag = (S.ui.pPag || 50) + 100; return render(); }
    });

    document.addEventListener('change', async function (e) {
      var t = e.target, ds = t.dataset;
      if (ds.task) {
        var k = 'elarah_mh_tarefas_' + dayKey(); var f = lsGet(k, {});
        if (t.checked) f[ds.task] = 1; else delete f[ds.task];
        lsSet(k, f); return render();
      }
      if ('filtroFator' in ds) { S.ui.fator = t.value; return render(); }
      if ('filtroFormato' in ds) { S.ui.formato = t.value; return render(); }
      if ('ano' in ds) { S.ui.ano = parseInt(t.value, 10); return render(); }
      if (ds.draftAtv != null) { S.ui.draft.itens[+ds.draftAtv].atividade = t.value; return render(); }
      if ('draftStatus' in ds) { S.ui.draft.status = t.value; return; }
      if ('pStatus' in ds) { S.ui.pStatus = t.value; S.ui.pPag = 50; return render(); }
      if ('pSeg' in ds) { S.ui.pSeg = t.value; return render(); }
      if (ds.pSetStatus) {
        var p = S.prospects.filter(function (x) { return x.id === ds.pSetStatus; })[0];
        try {
          await dbSave('b2b_prospects', { id: p.id, status_comercial: t.value });
          p.status_comercial = t.value;
          if (STATUS_P[t.value]) await dbSave('b2b_prospect_interactions', { prospect_id: p.id, tipo: t.value === 'nao_contatado' ? 'observacao' : t.value, descricao: 'Status → ' + STATUS_P[t.value], occurred_at: new Date().toISOString() }).catch(function () {});
          toast('Status atualizado ✓');
        } catch (err) { alert('Não deu: ' + err.message); }
        return;
      }
      if (ds.leadStatus) {
        try { await dbSave('mh_leads', { id: ds.leadStatus, status: t.value }); S.leads.forEach(function (l) { if (l.id === ds.leadStatus) l.status = t.value; }); renderNav(); toast('Atualizado ✓'); }
        catch (err) { alert('Não deu: ' + err.message); }
        return;
      }
      if (ds.capt != null) { var st = lsGet('elarah_mh_captacao', {}); st[ds.capt] = t.value; lsSet('elarah_mh_captacao', st); return; }
    });

    var tBusca;
    document.addEventListener('input', function (e) {
      if ('pBusca' in e.target.dataset) {
        clearTimeout(tBusca);
        var v = e.target.value;
        tBusca = setTimeout(function () {
          S.ui.pBusca = v; render();
          var el = document.querySelector('[data-p-busca]'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); }
        }, 250);
      }
    });
  }

  // =============================================================
  // BOOT: só admin (ou equipe com 'mental-health' liberado)
  // =============================================================
  function lock(msg) {
    var l = $('mh-lock');
    l.hidden = false;
    l.innerHTML = '<img src="assets/logo.png" alt="Elarah" style="height:36px;margin-bottom:14px"><h1>Elarah Mental Health</h1><p>' + msg + '</p>' +
      '<p style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><a class="mh-btn" href="index.html">Entrar na minha conta</a><a class="mh-btn mh-btn--ghost" href="admin.html">Ir para o painel Elarah</a></p>';
  }
  function podeMH(panels) {
    if (panels == null) return true;
    var lista = panels;
    if (typeof lista === 'string') lista = lista.replace(/^\{|\}$/g, '').split(',');
    return Array.isArray(lista) && lista.map(function (x) { return String(x).trim().replace(/^"|"$/g, ''); }).indexOf('mental-health') >= 0;
  }

  async function boot() {
    try {
      if (window.ElarahAuth && ElarahAuth.ready) await Promise.race([ElarahAuth.ready, new Promise(function (r) { setTimeout(r, 8000); })]);
    } catch (_) {}
    var t0 = Date.now();
    while (!sb() && Date.now() - t0 < 8000) await new Promise(function (r) { setTimeout(r, 150); });
    var c = sb();
    if (!c) return lock('Não consegui conectar ao banco. Recarregue a página.');
    var s = await c.auth.getSession();
    var user = s.data && s.data.session && s.data.session.user;
    if (!user) return lock('Entre com sua conta de administradora para acessar.');
    var r = await c.from('profiles').select('role, admin_panels').eq('id', user.id).maybeSingle();
    if (r.error && /admin_panels/i.test(r.error.message || '')) r = await c.from('profiles').select('role').eq('id', user.id).maybeSingle();
    var prof = r.data;
    if (!prof || prof.role !== 'admin') return lock('Sua conta não tem acesso ao painel administrativo.');
    if (!podeMH(prof.admin_panels)) return lock('Seu acesso não inclui a plataforma Elarah Mental Health. Peça para liberar em Usuários → acesso ao painel.');

    $('mh-app').hidden = false;
    $('mh-main').innerHTML = '<div class="mh-empty">Carregando…</div>';
    var h = (location.hash || '').replace('#', '');
    if (PANELS.some(function (p) { return p.key === h; })) S.panel = h;
    bind();
    $('mh-logout').addEventListener('click', async function () {
      try { if (window.ElarahAuth && ElarahAuth.logout) await ElarahAuth.logout(); else await c.auth.signOut(); } catch (_) {}
      location.href = 'index.html';
    });
    renderNav();
    try { await carregarTudo(); } catch (e) { console.error('[MH] carregar', e); }
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
