// =============================================================
// ELARAH — Análise da abordagem de prospecção (aba Prospecção)
// -------------------------------------------------------------
// 100% client-side, custo zero. Lê prospects + prospect_interactions
// (+ templates) e responde, por regra: taxa de resposta, funil, quem
// responde mais por categoria, efeito do follow-up e sugestões pra
// melhorar a abordagem. Renderiza em #pa-root.
// =============================================================
(function () {
  'use strict';
  function el(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pct(p, w) { return w > 0 ? Math.round((p / w) * 1000) / 10 : null; }

  var RESPONDED = ['respondeu', 'reuniao_marcada', 'parceria_fechada', 'recusou'];
  var loading = false;

  async function load() {
    var c = sb();
    if (!c) throw new Error('Supabase não carregou.');
    var pr = await c.from('prospects').select('id, categoria, status, created_at, origem').limit(50000);
    if (pr.error) throw new Error('prospects: ' + pr.error.message);
    var it = await c.from('prospect_interactions').select('prospect_id, tipo, occurred_at').limit(50000);
    var tp = await c.from('prospect_templates').select('id, is_active').limit(2000);
    return { prospects: pr.data || [], inter: (it && it.data) || [], templates: (tp && tp.data) || [] };
  }

  function analyze(d) {
    var P = d.prospects;
    var contatados = P.filter(function (p) { return p.status && p.status !== 'nao_contatado'; });
    var responderam = P.filter(function (p) { return RESPONDED.indexOf(p.status) !== -1; });
    var fechadas = P.filter(function (p) { return p.status === 'parceria_fechada'; });
    var naoContatado = P.filter(function (p) { return !p.status || p.status === 'nao_contatado'; });
    var reunioes = P.filter(function (p) { return p.status === 'reuniao_marcada' || p.status === 'parceria_fechada'; });

    var taxaResp = pct(responderam.length, contatados.length);
    var taxaFech = pct(fechadas.length, contatados.length);

    // Por categoria (só com volume mínimo)
    var byCat = {};
    contatados.forEach(function (p) {
      var k = (p.categoria || '(sem categoria)');
      var o = byCat[k] || (byCat[k] = { cat: k, cont: 0, resp: 0 });
      o.cont++; if (RESPONDED.indexOf(p.status) !== -1) o.resp++;
    });
    var cats = Object.values(byCat).filter(function (o) { return o.cont >= 3; })
      .map(function (o) { o.taxa = pct(o.resp, o.cont); return o; })
      .sort(function (a, b) { return (b.taxa || 0) - (a.taxa || 0); });

    // Efeito do follow-up
    var fuSet = {};
    d.inter.forEach(function (i) { if (i.tipo === 'follow_up') fuSet[i.prospect_id] = true; });
    var comFU = contatados.filter(function (p) { return fuSet[p.id]; });
    var semFU = contatados.filter(function (p) { return !fuSet[p.id]; });
    var respComFU = pct(comFU.filter(function (p) { return RESPONDED.indexOf(p.status) !== -1; }).length, comFU.length);
    var respSemFU = pct(semFU.filter(function (p) { return RESPONDED.indexOf(p.status) !== -1; }).length, semFU.length);

    // Contatados parados (mensagem_enviada, sem follow-up, há 3+ dias)
    var now = Date.now();
    var parados = contatados.filter(function (p) {
      return p.status === 'mensagem_enviada' && !fuSet[p.id] &&
        (now - new Date(p.created_at).getTime()) > 3 * 86400000;
    }).length;

    var templatesAtivos = d.templates.filter(function (t) { return t.is_active !== false; }).length;

    return {
      total: P.length, contatados: contatados.length, responderam: responderam.length,
      reunioes: reunioes.length, fechadas: fechadas.length, naoContatado: naoContatado.length,
      taxaResp: taxaResp, taxaFech: taxaFech, cats: cats,
      comFU: comFU.length, semFU: semFU.length, respComFU: respComFU, respSemFU: respSemFU,
      parados: parados, templatesAtivos: templatesAtivos,
    };
  }

  function sugestoes(m) {
    var s = [];
    if (m.contatados < 5) {
      s.push({ p: 2, txt: 'Ainda há poucos contatos registrados — quanto mais você registrar (mensagem enviada / respondeu) na timeline, mais afiada fica esta análise.' });
    }
    if (m.taxaResp != null && m.taxaResp < 20 && m.contatados >= 5) {
      s.push({ p: 1, txt: '📉 <strong>Taxa de resposta em ' + m.taxaResp + '%</strong> (um bom número fica em 20-30%+). Teste uma <strong>abertura mais curta e pessoal</strong>, citando algo específico do parceiro (uma peça, um post) em vez de texto padrão.' });
    } else if (m.taxaResp != null && m.contatados >= 5) {
      s.push({ p: 3, txt: '👍 <strong>Taxa de resposta em ' + m.taxaResp + '%</strong> — saudável. Mantenha o padrão e teste pequenas variações pra subir mais.' });
    }
    if (m.cats.length >= 2) {
      var best = m.cats[0], worst = m.cats[m.cats.length - 1];
      if (best.taxa != null && best.taxa > 0) s.push({ p: 2, txt: '🎯 <strong>' + esc(best.cat) + '</strong> é quem mais responde (' + best.taxa + '%) — <strong>priorize esse nicho</strong> na prospecção.' });
      if (worst.taxa != null && worst.cat !== best.cat && worst.taxa < (best.taxa || 0) / 2) s.push({ p: 3, txt: '🐢 <strong>' + esc(worst.cat) + '</strong> quase não responde (' + worst.taxa + '%) — repense a abordagem desse nicho ou despriorize.' });
    }
    if (m.respComFU != null && m.respSemFU != null && m.comFU >= 3 && m.respComFU > m.respSemFU) {
      s.push({ p: 1, txt: '🔁 <strong>Com follow-up: ' + m.respComFU + '% respondem · sem follow-up: ' + m.respSemFU + '%.</strong> O follow-up funciona — <strong>sempre mande pelo menos 1 lembrete</strong> em quem não respondeu.' });
    }
    if (m.parados >= 3) {
      s.push({ p: 1, txt: '⏰ Você tem <strong>' + m.parados + ' parceiros contatados há 3+ dias sem follow-up</strong>. Mande um lembrete simples hoje — boa parte responde no 2º toque.' });
    }
    if (m.templatesAtivos <= 1) {
      s.push({ p: 2, txt: '✍️ Você usa <strong>' + m.templatesAtivos + ' template' + (m.templatesAtivos === 1 ? '' : 's') + '</strong>. Crie <strong>2-3 variações</strong> de abertura e compare qual traz mais resposta (teste A/B na unha).' });
    }
    if (m.naoContatado >= 5) {
      s.push({ p: 2, txt: '📨 Há <strong>' + m.naoContatado + ' leads não contatados</strong> na fila. O caça-parceiros traz, mas alguém precisa mandar a primeira mensagem — defina uma meta semanal.' });
    }
    s.sort(function (a, b) { return a.p - b.p; });
    return s;
  }

  function bar(v, max, color) {
    var p = max > 0 ? Math.round((v / max) * 100) : 0;
    return '<div style="background:#f0e6d8;border-radius:6px;height:8px;overflow:hidden;"><div style="width:' + p + '%;height:100%;background:' + (color || '#f0a05e') + ';"></div></div>';
  }

  function render(d) {
    var root = el('pa-root');
    if (!root) return;
    var m = analyze(d);
    var sug = sugestoes(m);

    var funil = [
      { l: 'Cadastrados', v: m.total },
      { l: 'Contatados', v: m.contatados },
      { l: 'Responderam', v: m.responderam },
      { l: 'Reuniões', v: m.reunioes },
      { l: 'Parcerias', v: m.fechadas },
    ];
    var maxF = Math.max.apply(null, funil.map(function (f) { return f.v; }).concat([1]));
    var maxCat = Math.max.apply(null, m.cats.map(function (c) { return c.taxa || 0; }).concat([1]));

    root.innerHTML =
      // KPIs
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px;">' +
      [['Taxa de resposta', m.taxaResp == null ? '—' : m.taxaResp + '%'],
       ['Contatados', String(m.contatados)],
       ['Responderam', String(m.responderam)],
       ['Parcerias', String(m.fechadas)]].map(function (k) {
        return '<div style="background:#fff8ee;border:1px solid #f0d8bf;border-radius:10px;padding:11px 13px;"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:#a4663b;">' + k[0] + '</div><div style="font-size:1.4rem;font-weight:800;color:#1a1a1a;">' + k[1] + '</div></div>';
      }).join('') + '</div>' +

      // Funil
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Funil de prospecção</h3>' +
      '<div style="display:grid;gap:7px;margin-bottom:18px;">' +
      funil.map(function (f) {
        return '<div style="display:grid;grid-template-columns:110px 1fr 40px;gap:10px;align-items:center;font-size:.85rem;"><div style="color:#555;">' + esc(f.l) + '</div>' + bar(f.v, maxF) + '<div style="text-align:right;font-weight:700;color:#1a1a1a;">' + f.v + '</div></div>';
      }).join('') + '</div>' +

      // Por categoria
      (m.cats.length ? '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Quem responde mais (por categoria)</h3>' +
        '<div style="display:grid;gap:7px;margin-bottom:18px;">' +
        m.cats.slice(0, 8).map(function (c) {
          return '<div style="display:grid;grid-template-columns:130px 1fr 50px;gap:10px;align-items:center;font-size:.85rem;"><div style="color:#1a1a1a;font-weight:600;">' + esc(c.cat) + '</div>' + bar(c.taxa || 0, maxCat, '#1c7a43') + '<div style="text-align:right;color:#1c7a43;font-weight:700;">' + (c.taxa == null ? '—' : c.taxa + '%') + '</div></div>';
        }).join('') + '</div>' : '') +

      // Follow-up
      (m.comFU >= 1 ? '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">Efeito do follow-up</h3>' +
        '<div style="font-size:.86rem;color:#444;margin-bottom:18px;">Com follow-up: <strong style="color:#1c7a43;">' + (m.respComFU == null ? '—' : m.respComFU + '%') + '</strong> respondem · Sem follow-up: <strong>' + (m.respSemFU == null ? '—' : m.respSemFU + '%') + '</strong>.</div>' : '') +

      // Sugestões
      '<h3 style="font-size:1rem;color:#1a1a1a;margin:4px 0 8px;">O que o agente sugere</h3>' +
      '<div style="display:grid;gap:9px;">' +
      (sug.length ? sug.map(function (a) {
        var cor = a.p === 1 ? '#b3261e' : a.p === 2 ? '#a4663b' : '#1c7a43';
        return '<div style="font-size:.86rem;color:#444;line-height:1.5;background:#faf6f0;border-left:3px solid ' + cor + ';border-radius:8px;padding:9px 12px;">' + a.txt + '</div>';
      }).join('') : '<div style="color:#999;font-size:.85rem;">Sem alertas — sua prospecção está equilibrada.</div>') +
      '</div>' +

      '<p style="margin:14px 0 0;font-size:.74rem;color:#bbb;">Análise baseada no funil e na timeline de contatos. Dica: registre cada "mensagem enviada", "respondeu" e "follow-up" na timeline pra deixar a análise cada vez mais precisa.</p>';
  }

  async function run() {
    if (loading) return; loading = true;
    var root = el('pa-root');
    if (root) root.innerHTML = '<div style="color:#999;font-size:.9rem;">Analisando funil e timeline…</div>';
    try { render(await load()); }
    catch (e) { if (root) root.innerHTML = '<div style="color:#b3261e;font-size:.9rem;">Falha: ' + esc(e.message || e) + '</div>'; }
    finally { loading = false; }
  }

  function init() {
    var btn = el('pa-refresh');
    if (btn && !btn.dataset.wired) { btn.dataset.wired = '1'; btn.addEventListener('click', run); }
    var nav = document.querySelector('[data-panel="prospects"]');
    if (nav && !nav.dataset.paWired) { nav.dataset.paWired = '1'; nav.addEventListener('click', function () { setTimeout(run, 200); }); }
    var p = document.getElementById('panel-prospects');
    if (p && p.classList.contains('admin__panel--active')) run();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
