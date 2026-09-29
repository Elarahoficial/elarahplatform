// =============================================================
// ELARAH MENTAL HEALTH — painel corporativo (admin-mh.html)
// -------------------------------------------------------------
// Plataforma B2B da Elarah: saúde mental nas empresas (NR-1) com
// cronogramas de experiências manuais. Abas:
//
//   Hoje       → Visão geral · O que fazer hoje
//   Clientes   → Agenda & datas do RH · Acompanhamento semanal ·
//                Cronogramas · Pedidos do site
//   Conteúdo   → Ideias & programa anual
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
  // E-mail de envio da Mental Health (fica salvo neste navegador). O Gmail
  // abre direto nessa conta — ela só precisa estar logada no navegador.
  function emailEnvio() { return lsGet('elarah_mh_email_envio', '') || ''; }
  function gmailLink(to, assunto, corpo) {
    var conta = emailEnvio();
    return 'https://mail.google.com/mail/' + (conta ? '?authuser=' + encodeURIComponent(conta) + '&' : '?') + 'view=cm&fs=1' + (to ? '&to=' + encodeURIComponent(to) : '') +
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
      // Prospecção mista: qualquer empresa pode ter evento corporativo
      // ou programa de saúde mental, então a lista traz todos os B2B.
      var r = await c.from('b2b_prospects').select('*').order('created_at', { ascending: false }).limit(2000);
      if (!r.error) { S.prospects = r.data || []; return; }
      if (tabelaFaltando(r.error)) LOCAL_MODE.b2b_prospects = true;
      else console.warn('[MH] prospects', r.error);
    } else LOCAL_MODE.b2b_prospects = true;
    S.prospects = lsGet(lsKey('b2b_prospects'), []);
  }
  async function carregarInteracoes() {
    var desde = addDays(weekStart(), -35).toISOString(); // 5 semanas: placar + histórico
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
    { key: 'eventos', ico: '🗓', label: 'Agenda & datas do RH' },
    { key: 'acomp', ico: '📈', label: 'Acompanhamento semanal' },
    { key: 'cronograma', ico: '🧭', label: 'Cronogramas' },
    { key: 'leads', ico: '📥', label: 'Pedidos do site', badge: function () { return S.leads.filter(function (l) { return l.status === 'novo'; }).length; } },
    { grupo: 'Conteúdo' },
    { key: 'ideias', ico: '💡', label: 'Ideias & programa anual' },
    { grupo: 'Comercial' },
    { key: 'prosp', ico: '🎯', label: 'Prospecção' },
    { key: 'captacao', ico: '📣', label: 'Captação' }
  ];

  // Abas liberadas pra quem está logado (profiles.admin_panels → 'mh:<aba>').
  // null = todas (a dona, ou quem tem só 'mental-health' sem abas marcadas).
  var ABAS = null;
  function podeAba(k) { return !ABAS || ABAS.indexOf(k) >= 0; }
  function primeiraAba() {
    for (var i = 0; i < PANELS.length; i++) if (PANELS[i].key && podeAba(PANELS[i].key)) return PANELS[i].key;
    return 'visao';
  }
  function abasDe(panels) {
    var lista = panels;
    if (lista == null) return null;
    if (typeof lista === 'string') lista = lista.replace(/^\{|\}$/g, '').split(',');
    var mh = (lista || []).map(function (x) { return String(x).trim().replace(/^"|"$/g, ''); })
      .filter(function (x) { return x.indexOf('mh:') === 0; }).map(function (x) { return x.slice(3); });
    return mh.length ? mh : null;
  }

  function renderNav() {
    var visiveis = PANELS.filter(function (p, i) {
      if (!p.grupo) return podeAba(p.key);
      // Título do grupo só aparece se sobrou alguma aba embaixo dele.
      for (var j = i + 1; j < PANELS.length && !PANELS[j].grupo; j++) if (podeAba(PANELS[j].key)) return true;
      return false;
    });
    $('mh-nav').innerHTML = visiveis.map(function (p) {
      if (p.grupo) return '<div class="mh__nav-group">' + p.grupo + '</div>';
      var b = p.badge ? p.badge() : 0;
      return '<button class="mh__nav-item' + (S.panel === p.key ? ' mh__nav-item--active' : '') + '" data-panel="' + p.key + '">' +
        '<span class="ico">' + p.ico + '</span><span class="lbl">' + p.label + '</span>' +
        (b ? '<span class="badge">' + b + '</span>' : '') + '</button>';
    }).join('');
  }

  function ir(panel) {
    if (panel === 'datas') panel = 'eventos';
    if (!podeAba(panel)) panel = primeiraAba();
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
    }
    return out;
  }

  function head(titulo, sub, acoes) {
    return '<div class="mh__head"><div><h1>' + titulo + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (acoes ? '<div class="mh__head-actions">' + acoes + '</div>' : '') + '</div>' + banner();
  }

  function render() {
    if (S.panel === 'datas') S.panel = 'eventos';
    if (!podeAba(S.panel)) S.panel = primeiraAba();
    renderNav();
    var fn = {
      visao: rVisao, hoje: rHoje, eventos: rEventos, acomp: rAcomp, cronograma: rCronograma,
      leads: rLeads, ideias: rIdeias, datas: rEventos, prosp: rProsp, captacao: rCaptacao
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
  // CALENDÁRIO DO ANO (bolinhas por dia, igual ao painel Elarah)
  // =============================================================
  // porDia = { 'YYYY-MM-DD': [{ label, bg, fg, forte, html }] }
  // kind   = qual tela (cada uma guarda o próprio dia selecionado).
  var WD1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  function calendarioAno(ano, porDia, kind, legenda, sub) {
    var hoje = today0(), hk = dayKey(hoje);
    var sel = (S.ui.diaSel || {})[kind] || '';
    var html = (legenda ? '<div class="mh-legenda">' + legenda + '</div>' : '') + '<div class="mh-cal">';
    for (var m = 0; m < 12; m++) {
      var primeiro = new Date(ano, m, 1), n = new Date(ano, m + 1, 0).getDate(), cels = '', total = 0;
      for (var v = 0; v < primeiro.getDay(); v++) cels += '<span class="mh-dia mh-dia--vazio"></span>';
      for (var d = 1; d <= n; d++) {
        var dt = new Date(ano, m, d), k = dayKey(dt), its = porDia[k];
        var cls = 'mh-dia' + (dt < hoje ? ' mh-dia--passou' : '') + (k === hk ? ' mh-dia--hoje' : '') + (k === sel ? ' mh-dia--sel' : '');
        if (its && its.length) {
          total += its.length;
          var top = its[0];
          cls += ' mh-dia--tem' + (top.forte ? ' mh-dia--forte' : '');
          cels += '<button type="button" class="' + cls + '" style="--c-bg:' + top.bg + ';--c-fg:' + top.fg + '" data-dia="' + k + '" data-dia-kind="' + kind + '" title="' +
            esc(its.map(function (x) { return x.label; }).join(' · ')) + '">' + d + (its.length > 1 ? '<b>' + its.length + '</b>' : '') + '</button>';
        } else cels += '<span class="' + cls + '">' + d + '</span>';
      }
      var det = '';
      if (sel && sel.slice(0, 7) === dayKey(primeiro).slice(0, 7) && porDia[sel]) {
        det = '<div class="mh-cal-det"><b>' + fmtData(sel) + '</b>' + porDia[sel].map(function (x) { return x.html; }).join('') + '</div>';
      }
      html += '<section class="mh-cal-mes"><div class="mh-cal-head"><h4>' + MESES[m] + '</h4><span>' + (sub && sub[m] ? esc(sub[m]) : (total ? total + ' item(ns)' : '')) + '</span></div>' +
        '<div class="mh-grade">' + WD1.map(function (w) { return '<span class="mh-wd">' + w + '</span>'; }).join('') + cels + '</div>' + det + '</section>';
    }
    return html + '</div>';
  }
  function add(porDia, k, item) { (porDia[k] = porDia[k] || []).push(item); }
  function ordenarDia(porDia) { Object.keys(porDia).forEach(function (k) { porDia[k].sort(function (a, b) { return (b.forte ? 1 : 0) - (a.forte ? 1 : 0) || (b.peso || 0) - (a.peso || 0); }); }); }
  function legItem(bg, fg, txt) { return '<span><i style="background:' + bg + ';border-color:' + fg + '"></i>' + txt + '</span>'; }
  function toggleVista(kind, atual) {
    return '<div class="mh-seg"><button class="' + (atual === 'cal' ? 'on' : '') + '" data-vista="' + kind + '|cal">📅 Calendário</button><button class="' + (atual === 'lista' ? 'on' : '') + '" data-vista="' + kind + '|lista">☰ Lista</button></div>';
  }

  // =============================================================
  // O QUE FAZER HOJE — rotina de uma pessoa só + o que o sistema achou
  // =============================================================
  // Semana do mês (1-5) pra encaixar as tarefas mensais.
  function semanaDoMes(d) { return Math.floor((d.getDate() - 1) / 7) + 1; }
  function rotinaDoDia(d) {
    var dow = d.getDay();
    var base = (D.ROTINA[dow] || { nome: dow === 0 || dow === 6 ? 'Fim de semana — descanso (ou evento marcado)' : '', itens: [] });
    var itens = base.itens.map(function (x, i) { return Object.assign({ id: 'rot-' + dow + '-' + i, tipo: 'rotina' }, x); });
    D.ROTINA_MES.forEach(function (x, i) {
      if (x.dia === dow && x.semana === semanaDoMes(d)) itens.push(Object.assign({ id: 'mes-' + i, tipo: 'mensal', h: '15:00' }, x));
    });
    return { nome: base.nome, itens: itens };
  }
  function tarefasHoje() {
    var feitas = lsGet('elarah_mh_tarefas_' + dayKey(), {});
    var t = [];
    var hoje = today0();
    var dow = hoje.getDay();
    var util = dow >= 1 && dow <= 5;
    var ps = prospStats();

    // 1. Rotina do dia (o esqueleto do trabalho de uma pessoa só).
    rotinaDoDia(hoje).itens.forEach(function (x) {
      var desc = x.d;
      if (x.go === 'prosp' && /abordage|e-mails|convites|ligações|WhatsApps/.test(x.t)) {
        desc += ' Semana: ' + ps.contatadas + '/' + META_SEMANA + ' abordadas.';
      }
      if (/Instagram/.test(x.t)) desc += ' 💡 Ideia de hoje: ' + D.IDEIAS_FOTO[(hoje.getDate() + dow) % D.IDEIAS_FOTO.length];
      t.push({ id: x.id, prio: 2, h: x.h, min: x.min, titulo: x.t, go: x.go, desc: desc, tipo: x.tipo });
    });

    // 2. O que o sistema encontrou (urgente vem primeiro).
    var fim = new Date(); fim.setHours(23, 59, 59, 999);
    S.leads.filter(function (l) { return l.status === 'novo'; }).forEach(function (l) {
      t.push({ id: 'lead-' + l.id, prio: 1, titulo: '📥 Responder pedido do site: ' + l.empresa, go: 'leads', min: 10, tipo: 'alerta',
        desc: l.nome + (l.whatsapp ? ' · ' + l.whatsapp : '') + ' — responda em até 2h, é o lead mais quente que existe.' });
    });
    S.eventos.forEach(function (e) {
      var d = parseDay(e.data_evento); if (!d || e.status === 'cancelado') return;
      var n = diasAte(d);
      if (n === 0) t.push({ id: 'evt0-' + e.id, prio: 1, titulo: '🎉 Evento hoje: ' + e.titulo, go: 'eventos', tipo: 'alerta', desc: e.empresa + (e.horario ? ' às ' + e.horario : '') + '. Lista de presença, fotos (com autorização) e 1 frase do RH pro relatório.' });
      else if (n > 0 && n <= 7 && e.status === 'confirmado') t.push({ id: 'evt7-' + e.id, prio: 1, titulo: '📦 Preparar: ' + e.titulo + ' (' + fmtDia(d) + ')', go: 'eventos', min: 30, tipo: 'alerta', desc: 'Confirmar arteterapeuta, material para ' + (e.participantes || '?') + ' pessoas e local com ' + e.empresa + '.' });
      else if (n < 0 && n >= -3 && e.status === 'confirmado') t.push({ id: 'evtpos-' + e.id, prio: 1, titulo: '📝 Pós-evento: ' + e.titulo, go: 'eventos', min: 30, tipo: 'alerta', desc: 'Marcar como realizado, mandar relatório + fotos ao RH e propor o próximo encontro do cronograma.' });
      if ((e.status === 'orcamento' || e.status === 'proposta_enviada') && e.updated_at && (Date.now() - new Date(e.updated_at)) > 5 * DAY) {
        t.push({ id: 'orc-' + e.id, prio: 1, titulo: '⏳ Proposta parada: ' + e.empresa, go: 'eventos', min: 10, tipo: 'alerta', desc: '"' + e.titulo + '" sem resposta há ' + Math.floor((Date.now() - new Date(e.updated_at)) / DAY) + ' dias. Mande o follow-up com a data como gancho.' });
      }
    });
    var follow = S.prospects.filter(function (p) {
      return p.proxima_acao_at && new Date(p.proxima_acao_at) <= fim && ['recusou', 'fechado', 'cliente_ativo', 'pausado', 'nao_contatado'].indexOf(p.status_comercial) < 0;
    });
    if (follow.length) t.push({ id: 'fu-lote', prio: 1, titulo: '↩️ ' + follow.length + ' follow-up(s) vencendo hoje', go: 'prosp', min: follow.length * 3, tipo: 'alerta',
      desc: follow.slice(0, 6).map(function (p) { return p.nome; }).join(', ') + (follow.length > 6 ? '…' : '') + '. Use a mensagem “Follow-up (3 dias depois)”.' });
    if (util) datasProximas(45, 3).forEach(function (x) {
      var n = diasAte(x.data);
      if (n >= 20 && n <= 45) t.push({ id: 'data-' + dayKey(x.data) + x.nome, prio: 2, titulo: '🎁 Janela de venda: ' + x.nome + ' (' + fmtDia(x.data) + ')', go: 'eventos', min: 20, tipo: 'alerta', desc: 'Faltam ' + n + ' dias. Mande o pitch pros clientes e prospects quentes. Sugestão: ' + x.presente + '.' });
    });

    t.forEach(function (x) { x.feita = !!feitas[x.id]; });
    return t;
  }
  function rHoje() {
    var t = tarefasHoje();
    var hoje = today0();
    var rot = rotinaDoDia(hoje);
    var alertas = t.filter(function (x) { return x.tipo === 'alerta'; });
    var rotina = t.filter(function (x) { return x.tipo !== 'alerta'; }).sort(function (a, b) { return String(a.h).localeCompare(String(b.h)); });
    var feitas = t.filter(function (x) { return x.feita; }).length;
    var mins = t.filter(function (x) { return !x.feita; }).reduce(function (s, x) { return s + (x.min || 0); }, 0);
    function linha(x) {
      return '<div class="mh-task' + (x.feita ? ' done' : '') + '"><input type="checkbox" data-task="' + esc(x.id) + '"' + (x.feita ? ' checked' : '') + '>' +
        (x.h ? '<span class="mh-hora">' + x.h + '</span>' : '<span class="mh-prio" style="background:' + (x.prio === 1 ? '#d9774b' : '#e2b04a') + '"></span>') +
        '<div class="t"><strong>' + esc(x.titulo) + (x.min ? ' <small class="mh-min">~' + x.min + ' min</small>' : '') + (x.tipo === 'mensal' ? ' <span class="mh-chip mh-chip--terra">do mês</span>' : '') + '</strong><p>' + esc(x.desc) + '</p></div>' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-go="' + x.go + '">Abrir</button></div>';
    }
    var semana = [1, 2, 3, 4, 5].map(function (dw) {
      var d = addDays(weekStart(), dw - 1), r = rotinaDoDia(d);
      return '<div class="mh-dayplan' + (dw === hoje.getDay() ? ' on' : '') + '"><b>' + (D.ROTINA[dw] ? D.ROTINA[dw].nome.split(' — ')[0] : '') + ' ' + fmtDia(d) + '</b><small>' + esc((D.ROTINA[dw] || {}).nome.split(' — ')[1] || '') + '</small>' +
        '<ul>' + r.itens.map(function (x) { return '<li>' + esc(x.t) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    return head('O que fazer hoje', 'Rotina pensada pra uma pessoa só tocar a Elarah Mental Health: ~4 horas de comercial e conteúdo por dia, o resto livre pra executar os eventos.') +
      '<div class="mh-grid mh-grid--4" style="margin-bottom:16px">' +
        kpi('Hoje', esc(rot.nome.split(' — ')[1] || rot.nome), fmtData(hoje)) +
        kpi('Feitas', feitas + ' / ' + t.length, '<div class="mh-progress"><i style="width:' + (t.length ? Math.round(feitas / t.length * 100) : 0) + '%"></i></div>') +
        kpi('Tempo restante', mins >= 60 ? Math.floor(mins / 60) + 'h' + pad2(mins % 60) : mins + ' min', 'estimativa das tarefas abertas') +
        kpi('Prospecção da semana', prospStats().contatadas + ' / ' + META_SEMANA, 'abordagens registradas') +
      '</div>' +
      (alertas.length ? '<div class="mh-card" style="margin-bottom:16px;border-left:4px solid var(--mh-terra)"><h3>🔔 Não deixe passar <small>' + alertas.length + '</small></h3>' + alertas.map(linha).join('') + '</div>' : '') +
      '<div class="mh-card" style="margin-bottom:16px"><h3>🗓️ Sua rotina de hoje <small>marque conforme for fazendo</small></h3>' +
        (rotina.length ? rotina.map(linha).join('') : '<div class="mh-empty">Fim de semana: descanse. Se tiver evento marcado, ele aparece em “Não deixe passar”. 💚</div>') + '</div>' +
      '<div class="mh-card"><h3>A semana inteira</h3><div class="mh-week">' + semana + '</div></div>';
  }

  // =============================================================
  // AGENDA DE EVENTOS
  // =============================================================
  var COR_EVT = {
    orcamento: ['#f0efeb', '#6b6b6b'], proposta_enviada: ['#fff1d6', '#a86b00'], confirmado: ['#e2f3e8', '#1c7a43'],
    realizado: ['#e6efe9', '#1f4d3f'], cancelado: ['#fde5e3', '#b3261e']
  };
  // Agenda própria da Elarah Mental Health (captação), pra agenda nunca
  // ficar vazia e a Larissa enxergar o mês de longe.
  function nthWeekday(ano, mes, dow, n) {
    var d = new Date(ano, mes, 1); var off = (dow - d.getDay() + 7) % 7;
    return new Date(ano, mes, 1 + off + 7 * (n - 1));
  }
  function agendaPropria(ano) {
    var out = [];
    for (var m = 0; m < 12; m++) {
      out.push({ data: nthWeekday(ano, m, 4, 3), label: '☕ Café com RHs (ateliê)', desc: '10–15 RHs convidados: 1h de Arteterapia + conversa sobre NR-1. Convites na quinta anterior.' });
      out.push({ data: nthWeekday(ano, m, 2, 2), label: '🎙️ Live/webinar “NR-1 na prática”', desc: '40 min no LinkedIn com convidada (psicóloga/SST). Gravação vira conteúdo.' });
    }
    return out;
  }
  function rEventos() {
    var vista = S.ui.vistaEventos || 'cal';
    var ano = S.ui.anoEventos || today0().getFullYear();
    var acts = '<button class="mh-btn mh-btn--terra" data-new-evento>+ Novo evento</button>';
    var resumo = '<div class="mh-grid mh-grid--4" style="margin-bottom:16px">' +
      ['orcamento', 'proposta_enviada', 'confirmado', 'realizado'].map(function (k) {
        var l = S.eventos.filter(function (e) { return e.status === k; });
        return kpi(STATUS_EVT[k], l.length, brl(l.reduce(function (s, e) { return s + (Number(e.valor_centavos) || 0); }, 0)));
      }).join('') + '</div>';

    if (vista === 'cal') {
      var porDia = {};
      S.eventos.forEach(function (e) {
        if (!e.data_evento) return;
        var c = COR_EVT[e.status] || COR_EVT.orcamento;
        add(porDia, String(e.data_evento).slice(0, 10), { label: e.titulo + ' · ' + e.empresa, bg: c[0], fg: c[1], forte: e.status === 'confirmado', peso: 3, html: rowEvento(e) });
      });
      agendaPropria(ano).forEach(function (x) {
        add(porDia, dayKey(x.data), { label: x.label, bg: '#fbe9df', fg: '#b95c32', peso: 1,
          html: '<div class="mh-row">' + dateBox(x.data) + '<div class="body"><strong>' + esc(x.label) + '</strong><p>' + esc(x.desc) + '</p></div></div>' });
      });
      D.datasDoAno(ano).filter(function (x) { return x.rel === 3; }).forEach(function (x) {
        add(porDia, dayKey(x.data), { label: x.nome, bg: '#e8edf8', fg: '#2d4f8a', peso: 2, html: rowData(x) });
      });
      ordenarDia(porDia);
      var leg = legItem(COR_EVT.confirmado[0], COR_EVT.confirmado[1], 'Evento confirmado (cheio)') + legItem(COR_EVT.proposta_enviada[0], COR_EVT.proposta_enviada[1], 'Proposta / orçamento') +
        legItem('#e8edf8', '#2d4f8a', 'Data forte pro RH') + legItem('#fbe9df', '#b95c32', 'Agenda de captação (Café com RHs, live)');
      return head('Agenda & datas do RH', 'O ano inteiro de longe: eventos das empresas, datas fortes pro RH e a agenda de captação. Comece a oferecer cada data ~30 dias antes. Toque num dia colorido pra ver os detalhes e copiar o pitch.', acts) + radarRH() + resumo +
        '<div class="mh-toolbar">' + toggleVista('eventos', vista) +
          '<select class="mh-select" data-ano-kind="eventos">' + [ano - 1, ano, ano + 1].map(function (a) { return '<option' + (a === ano ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
        calendarioAno(ano, porDia, 'eventos', leg, CAMPANHA_MES);
    }

    var f = S.ui.evtFiltro || 'futuros';
    var lista = S.eventos.slice().sort(function (a, b) { return String(a.data_evento || '').localeCompare(String(b.data_evento || '')); });
    if (f === 'futuros') lista = lista.filter(function (e) { var d = parseDay(e.data_evento); return !d || diasAte(d) >= 0; }).filter(function (e) { return e.status !== 'cancelado'; });
    else if (f !== 'todos') lista = lista.filter(function (e) { return e.status === f; });
    var porMes = {};
    lista.forEach(function (e) {
      var d = parseDay(e.data_evento);
      var k = d ? MESES[d.getMonth()] + ' ' + d.getFullYear() : 'Sem data';
      (porMes[k] = porMes[k] || []).push(e);
    });
    var filtros = { futuros: 'Próximos', orcamento: 'Orçamentos', proposta_enviada: 'Propostas', confirmado: 'Confirmados', realizado: 'Realizados', cancelado: 'Cancelados', todos: 'Todos' };
    return head('Agenda & datas do RH', 'Eventos in company, no ateliê ou kits em casa — do orçamento ao relatório final.', acts) + radarRH() + resumo +
      '<div class="mh-toolbar">' + toggleVista('eventos', vista) + Object.keys(filtros).map(function (k) {
        return '<button class="mh-btn mh-btn--sm ' + (f === k ? '' : 'mh-btn--ghost') + '" data-evt-filtro="' + k + '">' + filtros[k] + '</button>';
      }).join('') + '</div>' +
      (lista.length ? Object.keys(porMes).map(function (m) {
        return '<div class="mh-card" style="margin-bottom:14px"><h3>' + m + ' <small>' + porMes[m].length + ' evento(s)</small></h3><div class="mh-list">' + porMes[m].map(rowEvento).join('') + '</div></div>';
      }).join('') : '<div class="mh-card"><div class="mh-empty">Nenhum evento com esse filtro. Veja o calendário pra enxergar as datas fortes e a agenda de captação.</div></div>');
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
  // ACOMPANHAMENTO SEMANAL — placar da operação + check-in dos clientes
  // =============================================================
  var HUMOR = ['', '😣', '😕', '😐', '🙂', '😄'];
  var METAS = { abordagens: META_SEMANA, respostas: 10, reunioes: 3, propostas: 2, fechados: 1, conteudos: 4 };
  function placarSemana(ws) {
    var ini = ws.getTime(), fim = addDays(ws, 7).getTime();
    function dentro(v) { var t = new Date(v).getTime(); return t >= ini && t < fim; }
    var inter = S.interacoes;
    function conta(tipo) { var ids = {}; inter.forEach(function (i) { if (i.tipo === tipo && dentro(i.occurred_at)) ids[i.prospect_id] = 1; }); return Object.keys(ids).length; }
    // Tarefas de conteúdo da rotina: post LinkedIn (seg), story (ter), post IG (qua), case (sex).
    var CONTEUDO = ['rot-1-3', 'rot-2-2', 'rot-3-0', 'rot-5-1'];
    var rotinaFeita = 0;
    for (var i = 0; i < 7; i++) {
      var f = lsGet('elarah_mh_tarefas_' + dayKey(addDays(ws, i)), {});
      CONTEUDO.forEach(function (k) { if (f[k]) rotinaFeita++; });
    }
    return {
      abordagens: conta('mensagem_enviada'),
      respostas: conta('respondeu'),
      reunioes: conta('reuniao_marcada') + conta('reuniao_realizada'),
      propostas: conta('proposta_enviada') + S.eventos.filter(function (e) { return e.status === 'proposta_enviada' && dentro(e.updated_at || e.created_at); }).length,
      fechados: conta('fechado') + S.eventos.filter(function (e) { return e.status === 'confirmado' && dentro(e.updated_at || e.created_at); }).length,
      leads: S.leads.filter(function (l) { return dentro(l.created_at); }).length,
      conteudos: rotinaFeita
    };
  }
  function rAcomp() {
    var ws = S.ui.semana ? parseDay(S.ui.semana) : weekStart();
    var wk = dayKey(ws);
    var p = placarSemana(ws);
    var nomes = { abordagens: '🎯 Abordagens', respostas: '💬 Respostas', reunioes: '🤝 Reuniões', propostas: '📄 Propostas', fechados: '✅ Fechamentos', leads: '📥 Pedidos do site', conteudos: '📣 Tarefas de conteúdo' };
    var cards = Object.keys(nomes).map(function (k) {
      var meta = METAS[k], v = p[k];
      var pct = meta ? Math.min(100, Math.round(v / meta * 100)) : null;
      return '<div class="mh-card mh-kpi"><div class="lbl">' + nomes[k] + '</div><div class="val">' + v + (meta ? '<span style="font-size:1rem;color:var(--mh-muted)"> / ' + meta + '</span>' : '') + '</div>' +
        (pct != null ? '<div class="mh-progress"><i style="width:' + pct + '%"></i></div>' : '<div class="sub">sem meta</div>') + '</div>';
    }).join('');
    var hist = [0, 1, 2, 3].map(function (i) {
      var w = addDays(weekStart(), -7 * i), q = placarSemana(w);
      return '<tr><td>' + fmtDia(w) + '</td><td>' + q.abordagens + '</td><td>' + q.respostas + '</td><td>' + q.reunioes + '</td><td>' + q.propostas + '</td><td>' + q.fechados + '</td><td>' + q.leads + '</td>' +
        '<td>' + (q.abordagens ? Math.round(q.respostas / q.abordagens * 100) + '%' : '—') + '</td></tr>';
    }).join('');
    var lista = clientes();
    var extras = S.acomp.filter(function (a) { return a.semana === wk && lista.indexOf(a.empresa) < 0; }).map(function (a) { return a.empresa; });
    lista = lista.concat(extras);
    var dica = p.abordagens < METAS.abordagens * 0.5 ? 'Poucas abordagens: reserve 1h amanhã cedo só pra prospecção (e-mail personalizado é o mais rápido).'
      : p.respostas === 0 ? 'Muitas abordagens e nenhuma resposta: teste o gancho de data ou ligue para 5 empresas.'
      : p.reunioes === 0 ? 'Tem respostas: proponha 15 minutos de conversa com 2 horários fixos.'
      : 'Bom ritmo! Mande o cronograma em PDF no mesmo dia de cada reunião.';
    return head('Acompanhamento semanal', 'Seu placar da semana (calculado sozinho) e o check-in de cada empresa cliente — o histórico que mostra valor na renovação.',
        '<button class="mh-btn mh-btn--terra" data-acomp-novo>+ Check-in de cliente</button>') +
      '<div class="mh-toolbar mh-weeknav"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-semana="' + dayKey(addDays(ws, -7)) + '">← semana anterior</button>' +
        '<b style="font-size:.9rem">Semana de ' + fmtDia(ws) + ' a ' + fmtDia(addDays(ws, 6)) + '</b>' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-semana="' + dayKey(addDays(ws, 7)) + '">próxima →</button></div>' +
      '<div class="mh-grid mh-grid--4">' + cards + '<div class="mh-card" style="background:var(--mh-sage-soft)"><div class="lbl" style="font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--mh-green)">💡 Dica da semana</div><p style="margin:8px 0 0;font-size:.88rem">' + dica + '</p></div></div>' +
      '<div class="mh-card" style="margin-top:16px"><h3>Últimas 4 semanas</h3><div class="mh-table-wrap"><table class="mh-table"><thead><tr><th>Semana</th><th>Abordagens</th><th>Respostas</th><th>Reuniões</th><th>Propostas</th><th>Fechados</th><th>Pedidos site</th><th>Taxa de resposta</th></tr></thead><tbody>' + hist + '</tbody></table></div></div>' +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-weight:400;margin:26px 0 12px">Empresas clientes</h2>' +
      (lista.length ? '<div class="mh-grid mh-grid--2">' + lista.map(function (emp) {
        var reg = S.acomp.filter(function (a) { return a.empresa === emp && a.semana === wk; })[0];
        var h = S.acomp.filter(function (a) { return a.empresa === emp; }).sort(function (a, b) { return a.semana.localeCompare(b.semana); }).slice(-8);
        return '<div class="mh-card"><h3>' + esc(emp) + (reg && reg.alerta ? ' <span class="mh-chip mh-chip--danger">🚩 atenção</span>' : '') + '</h3>' +
          (reg
            ? '<p style="margin:0 0 6px"><span class="mh-humor">' + (HUMOR[reg.humor_time] || '—') + '</span> ' + (reg.participacao != null ? '<span class="mh-chip">' + reg.participacao + '% de adesão</span>' : '') + '</p>' +
              (reg.feito ? '<p style="font-size:.84rem;margin:4px 0"><b>Feito:</b> ' + esc(reg.feito) + '</p>' : '') +
              (reg.proximo_passo ? '<p style="font-size:.84rem;margin:4px 0"><b>Próximo passo:</b> ' + esc(reg.proximo_passo) + '</p>' : '')
            : '<div class="mh-empty" style="padding:4px 0 8px">Sem check-in nesta semana.</div>') +
          (h.length > 1 ? '<p style="font-size:.76rem;color:var(--mh-muted);margin:8px 0 0">Termômetro: ' + h.map(function (x) { return '<span title="' + fmtDia(x.semana) + '">' + (HUMOR[x.humor_time] || '·') + '</span>'; }).join(' ') + '</p>' : '') +
          '<div style="margin-top:10px"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-acomp-emp="' + esc(emp) + '">' + (reg ? 'Editar' : 'Registrar') + '</button></div></div>';
      }).join('') + '</div>'
      : '<div class="mh-card"><div class="mh-empty">Quando a primeira empresa fechar (evento confirmado, cronograma aprovado ou status “Fechou” na Prospecção), ela aparece aqui pra você registrar o check-in semanal com o RH.</div></div>');
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
  var PLANOS = { pontual: 'Pontual', semestral: 'Semestral', anual: 'Anual' };
  // Gera os itens do cronograma. A empresa escolhe QUANTOS encontros
  // quer; os meses são escolhidos pela força das datas (Saúde Mental,
  // Setembro Amarelo, Janeiro Branco…) dentro da janela do plano.
  function gerarItens(opt) {
    var itens = [];
    if (opt.plano === 'pontual') {
      var x = opt.pontualData;
      if (x) itens.push({ data_key: dayKey(x.data), mes: x.data.getMonth() + 1, ano: x.data.getFullYear(), titulo: x.nome, atividade: x.atividade, tipo: 'acao', nota: x.gancho });
      return itens;
    }
    var janela = opt.plano === 'semestral' ? 6 : 12;
    var meses = [];
    for (var i = 0; i < janela; i++) {
      var abs = opt.mesIni - 1 + i;
      meses.push({ m: (abs % 12) + 1, a: opt.ano + Math.floor(abs / 12) });
    }
    var n = Math.max(1, Math.min(janela, opt.encontros || janela));
    var escolhidos = meses;
    if (opt.meses && opt.meses.length) {
      escolhidos = meses.filter(function (x) { return opt.meses.indexOf(x.m) >= 0; });
    } else if (n < janela) {
      var ordem = D.PRIORIDADE_MESES;
      escolhidos = meses.slice().sort(function (a, b) { return ordem.indexOf(a.m) - ordem.indexOf(b.m); }).slice(0, n)
        .sort(function (a, b) { return meses.indexOf(a) - meses.indexOf(b); });
    }
    escolhidos.forEach(function (x) {
      var prog = D.PROGRAMA[x.m - 1];
      itens.push({ mes: x.m, ano: x.a, titulo: prog.tema, atividade: prog.atividade, tipo: 'acao', nota: prog.porque });
      if (prog.extra && n >= 12 && [1, 4, 9, 10].indexOf(x.m) >= 0) {
        itens.push({ mes: x.m, ano: x.a, titulo: 'Complemento: ' + D.atividade(prog.extra).nome, atividade: prog.extra, tipo: 'acao', nota: 'Reforço de escuta/lideranças no mês-chave.' });
      }
    });
    if (opt.incluirDatas) {
      meses.forEach(function (x) {
        D.datasDoAno(x.a).filter(function (d) { return d.data.getMonth() + 1 === x.m && d.cat === 'presentear' && d.rel >= 2; }).forEach(function (d) {
          itens.push({ data_key: dayKey(d.data), mes: x.m, ano: x.a, titulo: d.nome, atividade: 'giftcard', tipo: 'data', nota: d.presente });
        });
      });
      itens.sort(function (a, b) { return (a.ano - b.ano) || (a.mes - b.mes) || String(a.data_key || '').localeCompare(String(b.data_key || '')); });
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
  function encontrosDe(dr) { return dr.itens.filter(function (i) { return i.tipo === 'acao'; }).length; }

  function rCronograma() {
    var dr = S.ui.draft;
    var salvos = S.crons;
    var hoje = today0();
    var modelos = D.MODELOS.map(function (m) {
      var itens = gerarItens({ plano: m.plano, ano: hoje.getFullYear() + (hoje.getMonth() >= 10 ? 1 : 0), mesIni: m.plano === 'semestral' ? ((hoje.getMonth() + 1) % 12) + 1 : 1, encontros: m.encontros, meses: m.meses,
        pontualData: m.plano === 'pontual' ? datasProximas(365, 3).filter(function (x) { return x.cat === 'saude'; })[0] : null });
      var est = estimativa(itens, 50);
      return '<div class="mh-card mh-idea"><div class="meta"><span class="mh-chip mh-chip--terra">' + m.encontros + ' encontro' + (m.encontros > 1 ? 's' : '') + '</span></div>' +
        '<h4>' + esc(m.nome) + '</h4><p>' + esc(m.desc) + '</p>' +
        '<p style="font-size:.8rem;color:var(--mh-muted)">' + itens.filter(function (i) { return i.tipo === 'acao'; }).map(function (i) { var a = D.atividade(i.atividade); return (i.data_key ? fmtDia(i.data_key) : MES3[i.mes - 1]) + ' ' + (a ? a.emoji : ''); }).join(' · ') + '</p>' +
        '<div class="foot"><small style="color:var(--mh-muted)">50 pessoas: ' + brlN(est.lo) + '–' + brlN(est.hi) + '</small><button class="mh-btn mh-btn--sm" data-modelo="' + m.id + '">Usar este modelo</button></div></div>';
    }).join('');
    return head('Cronogramas', 'A empresa escolhe quantos encontros quer — 1, 4, 6, 12 ou o que fizer sentido — e o sistema monta o cronograma nas melhores datas. Copie, imprima em PDF ou salve.',
        '<button class="mh-btn mh-btn--terra" data-cron-novo>+ Montar sob medida</button>') +
      (dr ? rDraft(dr) : '') +
      '<h2 style="font-family:\'DM Serif Display\',serif;font-weight:400;margin:4px 0 12px">Modelos prontos</h2>' +
      '<div class="mh-grid mh-grid--4" style="margin-bottom:22px">' + modelos + '</div>' +
      '<div class="mh-card"><h3>Cronogramas das empresas <small>' + salvos.length + '</small></h3>' +
      (salvos.length ? '<div class="mh-table-wrap"><table class="mh-table"><thead><tr><th>Empresa</th><th>Plano</th><th>Ano</th><th>Encontros</th><th>Status</th><th></th></tr></thead><tbody>' +
        salvos.map(function (c) {
          var itens = Array.isArray(c.itens) ? c.itens : [];
          return '<tr><td><b>' + esc(c.empresa) + '</b>' + (c.colaboradores ? '<br><small>' + c.colaboradores + ' pessoas</small>' : '') + '</td><td>' + (PLANOS[c.plano] || c.plano) + '</td><td>' + c.ano + '</td><td>' + itens.filter(function (i) { return i.tipo === 'acao'; }).length + '</td>' +
            '<td><span class="mh-chip ' + (c.status === 'aprovado' ? 'mh-chip--ok' : c.status === 'enviado' ? 'mh-chip--warn' : 'mh-chip--gray') + '">' + c.status + '</span></td>' +
            '<td style="white-space:nowrap"><button class="mh-btn mh-btn--ghost mh-btn--sm" data-cron-abrir="' + c.id + '">Abrir</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="mh-empty">Nenhum cronograma de empresa ainda. Use um modelo acima e troque o nome da empresa — leva 1 minuto.</div>') +
      '</div>';
  }
  function rDraft(dr) {
    var est = estimativa(dr.itens, dr.colaboradores);
    return '<div class="mh-card" style="margin-bottom:16px" id="mh-draft"><h3>' + esc(dr.empresa || 'Nova empresa') + ' — ' + (PLANOS[dr.plano] || '') + ' ' + dr.ano +
        ' <small>' + encontrosDe(dr) + ' encontro(s)' + (dr.colaboradores ? ' · estimativa ' + brlN(est.lo) + ' – ' + brlN(est.hi) : '') + '</small></h3>' +
      '<div class="mh-toolbar"><input class="mh-input" data-draft-empresa placeholder="Nome da empresa" value="' + esc(dr.empresa || '') + '" style="flex:1;min-width:180px">' +
        '<input class="mh-input" type="number" min="1" data-draft-pessoas placeholder="Nº de pessoas" value="' + esc(dr.colaboradores || '') + '" style="width:150px"></div>' +
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
  function abrirNovoCron(preset) {
    preset = preset || {};
    var hoje = today0();
    var datas = datasProximas(365, 2);
    modal('Montar cronograma',
      empresasDatalist() +
      '<label>Empresa<input class="mh-input" name="empresa" list="mh-emp-list" value="' + esc(preset.empresa || '') + '"></label>' +
      '<label>Nº de pessoas<input class="mh-input" type="number" min="1" name="colaboradores" placeholder="Ex.: 120" value="' + esc(preset.colaboradores || '') + '"></label>' +
      '<label>Período<select class="mh-select" name="plano">' + optList({ pontual: 'Pontual (uma data)', semestral: 'Semestral (6 meses)', anual: 'Anual (12 meses)' }, preset.plano || 'anual') + '</select></label>' +
      '<label>Quantos encontros?<input class="mh-input" type="number" min="1" max="12" name="encontros" value="' + (preset.encontros || 12) + '"></label>' +
      '<label>Começa em<select class="mh-select" name="mes">' + MESES.map(function (m, i) {
        var nxt = (hoje.getMonth() + 1) % 12; return '<option value="' + (i + 1) + '"' + (i === nxt ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>' +
      '<label>Ano<input class="mh-input" type="number" name="ano" value="' + (hoje.getMonth() >= 10 ? hoje.getFullYear() + 1 : hoje.getFullYear()) + '"></label>' +
      '<label class="full">Data (só para plano pontual)<select class="mh-select" name="pontual">' + datas.map(function (x) {
        return '<option value="' + esc(dayKey(x.data) + '|' + x.nome) + '">' + fmtDia(x.data) + ' — ' + esc(x.nome) + '</option>'; }).join('') + '</select></label>' +
      '<label class="full check"><input type="checkbox" name="datas"' + (preset.datas === false ? '' : ' checked') + '> Incluir datas de presentear com gift card (Mães, Pais, Secretária, Cliente, fim de ano…)</label>' +
      '<p class="full" style="font-size:.8rem;color:var(--mh-muted);margin:0">Com menos encontros que meses, o sistema escolhe os meses mais fortes (10/10, Setembro Amarelo, Janeiro Branco, Abril Verde, fim de ano…).</p>',
      {
        okLabel: 'Gerar',
        onOpen: function (form) {
          form.elements.plano.addEventListener('change', function () {
            form.elements.encontros.value = this.value === 'pontual' ? 1 : this.value === 'semestral' ? 6 : 12;
          });
        },
        onSubmit: function (d) {
          var ano = parseInt(d.ano, 10) || hoje.getFullYear();
          S.ui.draft = {
            empresa: d.empresa, colaboradores: d.colaboradores ? parseInt(d.colaboradores, 10) : null, plano: d.plano, ano: ano, status: 'rascunho',
            itens: gerarItens({ plano: d.plano, ano: ano, mesIni: parseInt(d.mes, 10) || 1, encontros: parseInt(d.encontros, 10) || 12,
              incluirDatas: !!d.datas, meses: preset.meses || null, pontualData: d.pontual ? acharData(d.pontual) : null })
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
    linhas.push('', 'Inclui: planejamento, arteterapeutas, materiais, fotos, lista de presença e relatório de cada ação para o plano de riscos psicossociais (NR-1). Qualquer encontro pode ser trocado por gift cards Elarah.');
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
      '<div class="box"><b>O que está incluso:</b> planejamento, arteterapeutas, materiais, fotos, lista de presença e relatório de cada ação para anexar ao plano de ação de riscos psicossociais (NR-1). Qualquer encontro pode ser trocado por gift cards Elarah.' +
      (dr.colaboradores ? '<br><br><b>Investimento de referência:</b> ' + brlN(est.lo) + ' a ' + brlN(est.hi) + ' — proposta final sob medida.' : '') + '</div>' +
      '<p style="margin-top:28px;font-size:.84rem;color:#6b716d">contato.elarah@gmail.com · +55 11 91445-5930 · elarah.com.br</p>' +
      '<script>setTimeout(function(){window.print()},600)<\/script></body></html>');
    w.document.close();
  }

  // =============================================================
  // PEDIDOS DO SITE (landing) + análise
  // =============================================================
  var STATUS_LEAD = { novo: 'Novo', em_contato: 'Em contato', convertido: 'Convertido', descartado: 'Descartado' };
  var ORIGEM_LABEL = {
    hero: 'Topo da página', nav: 'Menu', plano_pontual: 'Plano pontual', plano_semestral: 'Plano semestral', plano_anual: 'Plano anual',
    simulador: 'Monte seu cronograma', cronograma: 'Calendário (Monte o seu)', simulador_como: 'Simulador (Como funciona)', plano_pontual_simulador: 'Plano pontual → simulador', plano_semestral_simulador: 'Plano semestral → simulador', plano_anual_simulador: 'Plano anual → simulador', problema: 'Seção “o problema”', gift: 'Gift cards', whatsapp_flutuante: 'Botão WhatsApp', formulario: 'Formulário final', quem_somos: 'Quem somos'
  };
  function barras(titulo, contagem) {
    var ks = Object.keys(contagem).sort(function (a, b) { return contagem[b] - contagem[a]; });
    var max = ks.length ? contagem[ks[0]] : 0;
    return '<div class="mh-card"><h3>' + titulo + '</h3>' + (ks.length ? ks.map(function (k) {
      return '<div class="mh-bar"><span>' + esc(k) + '</span><i style="width:' + Math.max(6, Math.round(contagem[k] / max * 100)) + '%"></i><b>' + contagem[k] + '</b></div>';
    }).join('') : '<div class="mh-empty">Sem dados ainda.</div>') + '</div>';
  }
  function rLeads() {
    var L = S.leads;
    function conta(fn) { var c = {}; L.forEach(function (l) { var k = fn(l); if (k) c[k] = (c[k] || 0) + 1; }); return c; }
    var ult30 = L.filter(function (l) { return Date.now() - new Date(l.created_at) < 30 * DAY; }).length;
    var conv = L.filter(function (l) { return l.status === 'convertido'; }).length;
    var tempos = L.filter(function (l) { return l.status !== 'novo'; }).length;
    return head('Pedidos do site', 'Quem pediu orçamento pela landing <a href="saude-mental-empresas.html" target="_blank" rel="noopener">saude-mental-empresas.html</a>. Todo botão de orçamento/WhatsApp da página pede os dados antes — então todo mundo que clicou está aqui.') +
      '<div class="mh-grid mh-grid--4" style="margin-bottom:16px">' +
        kpi('Pedidos (total)', L.length, ult30 + ' nos últimos 30 dias') +
        kpi('Aguardando resposta', L.filter(function (l) { return l.status === 'novo'; }).length, 'responda em até 2h') +
        kpi('Convertidos', conv, L.length ? Math.round(conv / L.length * 100) + '% dos pedidos' : '—') +
        kpi('Já atendidos', tempos, 'em contato, convertidos ou descartados') +
      '</div>' +
      '<div class="mh-grid mh-grid--3" style="margin-bottom:16px">' +
        barras('De qual botão vieram', conta(function (l) { return ORIGEM_LABEL[l.origem] || l.origem || 'Formulário'; })) +
        barras('Tamanho do time', conta(function (l) { return l.colaboradores; })) +
        barras('Interesse / encontros no ano', conta(function (l) { return l.encontros ? l.encontros + ' encontro(s)' : l.plano; })) +
      '</div>' +
      '<div class="mh-card">' + (L.length ? '<div class="mh-table-wrap"><table class="mh-table"><thead><tr><th>Quando</th><th>Empresa</th><th>Contato</th><th>Time</th><th>Interesse</th><th>Origem</th><th>Status</th><th></th></tr></thead><tbody>' +
        L.map(function (l) {
          var wa = waLink(l.whatsapp, 'Oi, ' + (l.nome || '').split(' ')[0] + '! Aqui é a Larissa, da Elarah Mental Health 💚 Recebi seu pedido pela ' + l.empresa + ' e já estou montando o cronograma de vocês. Posso te fazer 3 perguntas rápidas?');
          return '<tr><td>' + fmtDia(new Date(l.created_at)) + '<br><small>' + new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</small></td><td><b>' + esc(l.empresa) + '</b>' + (l.mensagem ? '<br><small>' + esc(l.mensagem) + '</small>' : '') + '</td>' +
            '<td>' + esc(l.nome) + (l.cargo ? '<br><small>' + esc(l.cargo) + '</small>' : '') + (l.email ? '<br><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>' : '') + (l.whatsapp ? '<br><small>' + esc(l.whatsapp) + '</small>' : '') + '</td>' +
            '<td>' + esc(l.colaboradores || '—') + '</td><td>' + esc(l.encontros ? l.encontros + ' encontro(s)' : (l.plano || '—')) + '</td>' +
            '<td><small>' + esc(ORIGEM_LABEL[l.origem] || l.origem || '—') + (l.utm ? '<br>' + esc(l.utm) : '') + '</small></td>' +
            '<td><select class="mh-select" data-lead-status="' + l.id + '">' + optList(STATUS_LEAD, l.status) + '</select></td>' +
            '<td style="white-space:nowrap">' + (wa ? '<a class="mh-btn mh-btn--sm" href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a> ' : '') +
            '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-lead-cron="' + l.id + '">Cronograma</button> ' +
            '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-lead-prosp="' + l.id + '">→ Prospecção</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="mh-empty">Nenhum pedido ainda. Coloque o link da landing na bio do Instagram, na assinatura do e-mail e nos posts do LinkedIn.</div>') + '</div>';
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
  // DATAS PARA O RH — agora dentro da Agenda (aba única)
  // =============================================================
  var CAMPANHA_MES = ['Janeiro Branco', 'Volta às aulas / Carnaval', 'Mês da Mulher', 'Abril Verde', 'Maio Amarelo', 'Festa junina / Dia do RH', 'Férias / Dia do Amigo', 'Agosto Lilás', 'Setembro Amarelo', 'Outubro Rosa / Saúde Mental', 'Novembro Azul', 'Fim de ano'];
  // "Hora de oferecer": datas com janela de venda aberta (7 a 45 dias),
  // com o pitch pronto pra copiar. Aparece no topo da Agenda.
  function radarRH() {
    var radar = datasProximas(45, 2).filter(function (x) { return diasAte(x.data) >= 7; });
    if (!radar.length) return '';
    return '<div class="mh-card" style="margin-bottom:16px;border-left:4px solid var(--mh-terra)"><h3>📡 Hora de oferecer <small>janela de venda aberta</small></h3><div class="mh-radar">' +
      radar.map(function (x) { return '<button class="mh-radar-item" data-pitch="' + esc(dayKey(x.data) + '|' + x.nome) + '"><b>' + esc(x.nome) + '</b><span>' + fmtDia(x.data) + ' · em ' + diasAte(x.data) + ' dias · copiar pitch</span></button>'; }).join('') + '</div></div>';
  }

  // =============================================================
  // PROSPECÇÃO
  // =============================================================
  var STATUS_P = {
    nao_contatado: 'Não contatada', mensagem_enviada: 'Mensagem enviada', respondeu: 'Respondeu', reuniao_marcada: 'Reunião marcada',
    proposta_enviada: 'Proposta enviada', negociacao: 'Negociação', fechado: 'Fechou', cliente_ativo: 'Cliente ativo', pausado: 'Pausado', recusou: 'Recusou'
  };
  // Assinatura padrão: Larissa Setzer. Dá pra trocar no botão "Minha assinatura".
  var ASSINATURA_PADRAO = 'Um abraço,\nLarissa Setzer\nArteterapeuta · Elarah Mental Health\n+55 11 91445-5930\nelarah.com.br/saude-mental-empresas.html';
  function assinatura() {
    var v = lsGet('elarah_mh_assinatura', null);
    // Quem salvou a assinatura antiga com "[Seu nome]" passa a ver a da Larissa.
    if (!v || /\[Seu nome\]/.test(v)) return ASSINATURA_PADRAO;
    return v;
  }
  function preencher(txt, p) {
    p = p || {};
    var g = ganchoAtual();
    var seg = D.segmentoDe(p);
    var contato = (p.contato_nome || '').split(' ')[0];
    return String(txt)
      .replace(/Olá, \{contato\}!/g, contato ? 'Olá, ' + contato + '!' : 'Olá!')
      .replace(/Oi, \{contato\}!/g, contato ? 'Oi, ' + contato + '!' : 'Oi!')
      .replace(/Obrigada por aceitar, \{contato\}!/g, contato ? 'Obrigada por aceitar, ' + contato + '!' : 'Obrigada por aceitar o convite!')
      .replace(/\{contato\}, /g, contato ? contato + ', ' : '')
      .replace(/\{contato\}/g, contato || 'pessoal do RH')
      .replace(/\{promessa\}/g, D.PROMESSA)
      .replace(/\{dor\}/g, seg.dor)
      .replace(/\{atividade\}/g, seg.atividade)
      .replace(/\{data_seg\}/g, seg.data)
      .replace(/\{ajuste\}/g, seg.ajuste)
      .replace(/\{empresa\}/g, p.nome || 'sua empresa')
      .replace(/\{segmento\}/g, (p.segmento || seg.label).toLowerCase())
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

  // Fila equilibrada: no máximo 10 empresas NÃO contatadas por segmento.
  // Só apaga quem veio da busca automática da Mental Health, nunca foi
  // abordado e não tem nenhuma anotação. Fica quem tem site + telefone
  // e, depois, as mais novas.
  async function limparFila() {
    var comInter = {};
    S.interacoes.forEach(function (i) { comInter[i.prospect_id] = 1; });
    var porSeg = {};
    S.prospects.forEach(function (p) {
      if (p.status_comercial !== 'nao_contatado' || comInter[p.id]) return;
      if (p.frente && p.frente !== 'mh') return;
      if (p.origem && p.origem !== 'google_places_mh') return;
      var k = p.segmento || 'Sem segmento';
      (porSeg[k] = porSeg[k] || []).push(p);
    });
    var apagar = [], resumo = [];
    Object.keys(porSeg).forEach(function (k) {
      var l = porSeg[k].sort(function (a, b) {
        var ca = (a.site ? 1 : 0) + (a.telefone ? 1 : 0), cb = (b.site ? 1 : 0) + (b.telefone ? 1 : 0);
        if (ca !== cb) return cb - ca;
        return String(b.created_at || '').localeCompare(String(a.created_at || ''));
      });
      if (l.length > 10) { apagar = apagar.concat(l.slice(10)); resumo.push(k + ': ' + l.length + ' → 10'); }
    });
    if (!apagar.length) return toast('A fila já está equilibrada: nenhum segmento passa de 10.');
    if (!confirm('Vou deixar no máximo 10 empresas não contatadas por segmento e apagar ' + apagar.length + ':\n\n' + resumo.join('\n') + '\n\nQuem já foi abordado não é apagado. Continuar?')) return;
    var c = sb(), ids = apagar.map(function (p) { return p.id; });
    try {
      if (c && !LOCAL_MODE.b2b_prospects) {
        for (var i = 0; i < ids.length; i += 100) {
          var r = await c.from('b2b_prospects').delete().in('id', ids.slice(i, i + 100));
          if (r.error) throw new Error(r.error.message);
        }
      } else {
        lsSet(lsKey('b2b_prospects'), lsGet(lsKey('b2b_prospects'), []).filter(function (p) { return ids.indexOf(p.id) < 0; }));
      }
      var fora = {}; ids.forEach(function (id) { fora[id] = 1; });
      S.prospects = S.prospects.filter(function (p) { return !fora[p.id]; });
      toast('Pronto: ' + ids.length + ' empresas saíram da fila.');
      render();
    } catch (e) { toast('Não deu pra limpar: ' + e.message); }
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
    return head('Prospecção', 'Meta: ' + META_SEMANA + ' empresas abordadas por semana. O agente traz ~100 empresas novas toda segunda (Google Maps), 10 de cada setor; cada linha já vem com e-mail, LinkedIn, WhatsApp e roteiro de ligação prontos.',
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
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-email-envio title="Conta do Gmail que abre no botão Abrir no Gmail">📧 ' + (emailEnvio() ? 'Envio: ' + esc(emailEnvio()) : 'E-mail de envio da Mental Health') + '</button>' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-assinatura>✍️ Minha assinatura</button>' +
        '<button class="mh-btn mh-btn--ghost mh-btn--sm" data-limpar-fila title="Deixa no máximo 10 empresas não contatadas por segmento">🧹 Deixar 10 por segmento</button>' +
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
      '<td style="white-space:nowrap"><button class="mh-btn mh-btn--sm ' + (open ? '' : 'mh-btn--ghost') + '" data-p-open="' + p.id + '">' + (open ? 'Fechar' : 'Abordar') + '</button>' +
        (p.status_comercial === 'mensagem_enviada' ? '<br><button class="mh-btn mh-btn--ghost mh-btn--sm" style="margin-top:4px" data-p-desfazer="' + p.id + '" title="Cliquei sem querer — voltar para Não contatada">↺ Desfazer</button>' : '') + '</td></tr>';
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
    var seg = D.segmentoDe(p);
    return '<p style="margin:0 0 10px;font-size:.84rem">✨ Mensagens personalizadas para <b>' + esc(seg.label) + '</b> — dor do setor, experiência e data que mais conversam com essa empresa. Confira o nome do contato antes de enviar.</p>' +
      '<div class="mh-channels">' +
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

  // Desfaz uma abordagem marcada sem querer: volta pra "Não contatada",
  // limpa o follow-up e apaga o registro de mensagem enviada.
  async function desfazerAbordagem(id, silencioso) {
    var p = S.prospects.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var patch = { status_comercial: 'nao_contatado', proxima_acao: null, proxima_acao_at: null };
    await dbSave('b2b_prospects', Object.assign({ id: id }, patch));
    Object.assign(p, patch);
    var alvo = S.interacoes.filter(function (i) { return i.prospect_id === id && i.tipo === 'mensagem_enviada'; });
    for (var k = 0; k < alvo.length; k++) { if (alvo[k].id) { try { await dbDelete('b2b_prospect_interactions', alvo[k].id); } catch (_) {} } }
    S.interacoes = S.interacoes.filter(function (i) { return alvo.indexOf(i) < 0; });
    if (!silencioso) { toast('↺ ' + p.nome + ' voltou para Não contatada'); render(); }
  }
  // Correção única: as abordagens marcadas antes do painel ir pro ar
  // foram cliques de teste (nenhuma empresa foi contatada de verdade).
  // Só mexe no que foi criado pelo botão da Mental Health.
  var CORTE_TESTE = new Date('2026-09-29T03:00:00Z').getTime();
  async function corrigirTestes() {
    var ids = {};
    S.interacoes.forEach(function (i) {
      if (i.tipo === 'mensagem_enviada' && /^Abordagem Elarah Mental Health/.test(i.descricao || '') && new Date(i.occurred_at).getTime() < CORTE_TESTE) ids[i.prospect_id] = 1;
    });
    var alvo = S.prospects.filter(function (p) { return ids[p.id] && p.status_comercial === 'mensagem_enviada'; });
    for (var k = 0; k < alvo.length; k++) { try { await desfazerAbordagem(alvo[k].id, true); } catch (e) { console.warn('[MH] corrigirTestes', e); } }
    if (alvo.length) toast('↺ ' + alvo.map(function (p) { return p.nome; }).join(', ') + ' voltou para Não contatada (clique de teste)');
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
      if (ds.dia) {
        S.ui.diaSel = S.ui.diaSel || {};
        S.ui.diaSel[ds.diaKind] = S.ui.diaSel[ds.diaKind] === ds.dia ? '' : ds.dia;
        return render();
      }
      if (ds.vista) {
        var pv = ds.vista.split('|');
        if (pv[0] === 'eventos') S.ui.vistaEventos = pv[1]; else S.ui.vistaDatas = pv[1];
        return render();
      }
      if (ds.modelo) {
        var mo = D.MODELOS.filter(function (x) { return x.id === ds.modelo; })[0];
        return abrirNovoCron({ plano: mo.plano, encontros: mo.encontros, meses: mo.meses });
      }
      if (ds.leadCron) {
        var lc = S.leads.filter(function (x) { return x.id === ds.leadCron; })[0];
        var nEnc = parseInt(lc.encontros, 10) || (/pontual/i.test(lc.plano || '') ? 1 : /semestral/i.test(lc.plano || '') ? 6 : 12);
        var colab = parseInt(String(lc.colaboradores || '').replace(/\D.*$/, ''), 10) || null;
        ir('cronograma');
        return abrirNovoCron({ empresa: lc.empresa, colaboradores: colab, encontros: nEnc, plano: nEnc === 1 ? 'pontual' : nEnc <= 6 && /semestral/i.test(lc.plano || '') ? 'semestral' : 'anual' });
      }
      if (ds.pDesfazer) { try { await desfazerAbordagem(ds.pDesfazer); } catch (err) { alert('Não deu: ' + err.message); } return; }
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
      if ('emailEnvio' in ds) {
        var ev = prompt('E-mail de envio da Mental Health (a conta do Gmail que vai abrir no "Abrir no Gmail").\n\nEssa conta precisa estar logada neste navegador. Deixe vazio para usar a conta padrão.', emailEnvio());
        if (ev != null) {
          ev = ev.trim();
          if (ev && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev)) { toast('E-mail inválido.'); return; }
          lsSet('elarah_mh_email_envio', ev); render();
          toast(ev ? 'Os e-mails vão abrir em ' + ev : 'Voltou para a conta padrão do navegador');
        }
        return;
      }
      if ('limparFila' in ds) return limparFila();
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
      if (ds.anoKind) { S.ui.anoEventos = parseInt(t.value, 10); return render(); }
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
      if ('draftEmpresa' in e.target.dataset) { S.ui.draft.empresa = e.target.value; return; }
      if ('draftPessoas' in e.target.dataset) { S.ui.draft.colaboradores = parseInt(e.target.value, 10) || null; return; }
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
    if (!prof) return lock('Sua conta não tem acesso ao painel administrativo.');
    // Equipe só da Mental Health: role 'user' com 'mental-health' liberado
    // (sql/elarah_mh_equipe.sql). Não é admin, então a Elarah fica fechada.
    var soMH = prof.role !== 'admin' && prof.admin_panels != null && podeMH(prof.admin_panels);
    if (prof.role !== 'admin' && !soMH) return lock('Sua conta não tem acesso ao painel administrativo.');
    if (!podeMH(prof.admin_panels)) return lock('Seu acesso não inclui a plataforma Elarah Mental Health. Peça para liberar em Usuários → Equipe & acessos.');
    ABAS = abasDe(prof.admin_panels);
    var donaTotal = prof.role === 'admin' && prof.admin_panels == null;
    if (soMH) {
      // Sem seletor de plataforma: ela só tem a Mental Health.
      var sw = document.querySelector('.plat-sw'); if (sw) sw.remove();
      document.documentElement.classList.add('mh-so-mh');
    }
    if (donaTotal) {
      var foot = document.querySelector('.mh__foot');
      if (foot && !foot.querySelector('[data-equipe-link]')) {
        var a = document.createElement('a');
        a.href = 'admin.html#equipe'; a.setAttribute('data-equipe-link', '');
        a.textContent = '👥 Equipe & acessos';
        foot.insertBefore(a, foot.firstChild);
      }
    }

    $('mh-app').hidden = false;
    $('mh-main').innerHTML = '<div class="mh-empty">Carregando…</div>';
    var h = (location.hash || '').replace('#', '');
    if (h === 'datas') h = 'eventos';
    if (PANELS.some(function (p) { return p.key === h; })) S.panel = h;
    if (!podeAba(S.panel)) S.panel = primeiraAba();
    bind();
    $('mh-logout').addEventListener('click', async function () {
      try { if (window.ElarahAuth && ElarahAuth.logout) await ElarahAuth.logout(); else await c.auth.signOut(); } catch (_) {}
      location.href = 'index.html';
    });
    renderNav();
    try { await carregarTudo(); } catch (e) { console.error('[MH] carregar', e); }
    try { await corrigirTestes(); } catch (e) { console.warn('[MH] corrigirTestes', e); }
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
