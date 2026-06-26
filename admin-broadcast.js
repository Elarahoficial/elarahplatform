// =============================================================
// ELARAH — Painel "Novidades" (disparo de e-mail em massa)
// -------------------------------------------------------------
// UI da aba data-panel="broadcast". Fala com a Edge Function
// broadcast-email (count / test / send). Auth = JWT do admin logado.
// =============================================================
(function () {
  'use strict';

  var FN = 'broadcast-email';

  function el(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || null; }

  function getSupabaseUrl() {
    try {
      var c = sb();
      if (c && c.supabaseUrl) return c.supabaseUrl;
    } catch (_) {}
    return 'https://nwijxjmenbfyehvscogs.supabase.co';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function session() {
    var c = sb();
    if (!c) return null;
    try {
      var r = await c.auth.getSession();
      return (r.data && r.data.session) || null;
    } catch (_) { return null; }
  }

  // Chama a Edge Function com o token do admin.
  async function callFn(payload) {
    var s = await session();
    if (!s) throw new Error('Sessão expirou — faça login de novo.');
    var res = await fetch(getSupabaseUrl() + '/functions/v1/' + FN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + s.access_token,
      },
      body: JSON.stringify(payload),
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || !data.ok) throw new Error(data.error || data.detail || ('HTTP ' + res.status));
    return data;
  }

  function setStatus(msg, color) {
    var st = el('bc-status');
    if (st) { st.textContent = msg || ''; st.style.color = color || '#888'; }
  }

  // ----- Quantos destinatários (mode count) -----
  async function loadCount() {
    var span = el('bc-count');
    if (span) span.textContent = '…';
    try {
      var data = await callFn({ mode: 'count' });
      if (span) span.textContent = data.total;
    } catch (e) {
      if (span) span.textContent = '?';
    }
  }

  // ----- Prévia client-side (aproximação do e-mail) -----
  function preview() {
    var assunto = (el('bc-assunto') || {}).value || '';
    var msg = (el('bc-mensagem') || {}).value || '';
    var box = el('bc-preview');
    if (!box) return;
    if (!assunto && !msg) { box.style.display = 'none'; return; }
    var paras = String(msg).replace(/\r\n/g, '\n').split(/\n{2,}/).map(function (b) {
      return '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#2a2a2a;">' +
        esc(b).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    box.innerHTML =
      '<div style="font-size:.78rem;color:#aaa;margin-bottom:8px;">Prévia (aproximada) do que o cliente recebe:</div>' +
      '<div style="border:1px solid #eee;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.05);">' +
        '<div style="padding:22px;text-align:center;background:linear-gradient(135deg,#f6d5a8,#f0a05e);">' +
          '<div style="font-family:Georgia,serif;font-size:22px;color:#1a1a1a;">Elarah</div></div>' +
        '<div style="padding:24px;background:#fff;">' +
          '<h2 style="font-family:Georgia,serif;color:#1a1a1a;margin:0 0 14px;font-size:20px;">' + esc(assunto) + '</h2>' +
          paras +
          '<div style="margin-top:8px;"><span style="display:inline-block;background:#f0a05e;color:#fff;font-weight:700;font-size:14px;padding:11px 22px;border-radius:999px;">Ver experiências</span></div>' +
          '<p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #f0e6d8;font-size:11px;color:#a89a86;">Não quer mais receber novidades? <u>Descadastrar</u>.</p>' +
        '</div>' +
      '</div>';
    box.style.display = 'block';
  }

  function validate() {
    var assunto = ((el('bc-assunto') || {}).value || '').trim();
    var msg = ((el('bc-mensagem') || {}).value || '').trim();
    if (!assunto) { setStatus('Escreva o assunto.', '#b3261e'); return null; }
    if (!msg) { setStatus('Escreva a mensagem.', '#b3261e'); return null; }
    return { assunto: assunto, mensagem: msg };
  }

  // ----- Enviar teste pra mim -----
  async function sendTest() {
    var v = validate();
    if (!v) return;
    var s = await session();
    var myEmail = s && s.user && s.user.email;
    if (!myEmail) { setStatus('Não achei seu e-mail de login.', '#b3261e'); return; }
    var btn = el('bc-test-btn');
    if (btn) btn.disabled = true;
    setStatus('Enviando teste pra ' + myEmail + '…');
    try {
      await callFn({ mode: 'test', assunto: v.assunto, mensagem: v.mensagem, test_email: myEmail });
      setStatus('✅ Teste enviado pra ' + myEmail + ' — confira a caixa de entrada.', '#1c7a43');
    } catch (e) {
      setStatus('Falha no teste: ' + (e.message || e), '#b3261e');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ----- Enviar pra todos -----
  async function sendAll() {
    var v = validate();
    if (!v) return;
    var total = (el('bc-count') || {}).textContent || '?';
    var ok = window.confirm(
      'Enviar a novidade "' + v.assunto + '" para ' + total + ' pessoa(s)?\n\n' +
      'Isso manda e-mail de verdade pra todo mundo. Recomendo ter enviado um teste antes.'
    );
    if (!ok) return;
    var btn = el('bc-send-btn');
    if (btn) btn.disabled = true;
    setStatus('Disparando… (pode levar alguns segundos)');
    try {
      var data = await callFn({ mode: 'send', assunto: v.assunto, mensagem: v.mensagem });
      var msg = '✅ Enviados: ' + data.enviados + ' de ' + data.total + '.';
      if (data.falharam) msg += ' Falharam: ' + data.falharam + '.';
      if (data.restantes) msg += ' Faltam ' + data.restantes + ' — rode de novo pra continuar.';
      setStatus(msg, data.falharam ? '#a4663b' : '#1c7a43');
      loadHistory();
    } catch (e) {
      setStatus('Falha no envio: ' + (e.message || e), '#b3261e');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ----- Histórico de disparos (lê direto via RLS admin) -----
  async function loadHistory() {
    var box = el('bc-history');
    var c = sb();
    if (!box || !c) return;
    try {
      var r = await c.from('email_broadcasts').select('*').order('created_at', { ascending: false }).limit(10);
      var rows = r.data || [];
      if (!rows.length) { box.innerHTML = ''; return; }
      var items = rows.map(function (b) {
        var when = '';
        try { when = new Date(b.created_at).toLocaleString('pt-BR'); } catch (_) { when = b.created_at; }
        var badge = b.status === 'concluido' ? '#1c7a43' : b.status === 'parcial' ? '#a4663b' : b.status === 'erro' ? '#b3261e' : '#888';
        return '<div style="padding:12px 0;border-top:1px dashed #eee;">' +
          '<div style="font-weight:600;color:#1a1a1a;">' + esc(b.assunto) + '</div>' +
          '<div style="font-size:.8rem;color:#777;margin-top:2px;">' + esc(when) +
            ' · <span style="color:' + badge + ';font-weight:600;">' + esc(b.status) + '</span>' +
            ' · ' + b.enviados + '/' + b.total_destinatarios + ' enviados' +
            (b.falharam ? ' · ' + b.falharam + ' falharam' : '') + '</div>' +
          (b.detalhe ? '<div style="font-size:.78rem;color:#a4663b;margin-top:3px;">' + esc(b.detalhe) + '</div>' : '') +
        '</div>';
      }).join('');
      box.innerHTML = '<h3 style="font-size:1rem;color:#1a1a1a;margin:0 0 4px;">Disparos recentes</h3>' + items;
    } catch (_) { /* tabela pode não existir ainda */ }
  }

  function init() {
    var wired = el('bc-send-btn');
    if (wired && !wired.dataset.wired) {
      wired.dataset.wired = '1';
      wired.addEventListener('click', sendAll);
      var t = el('bc-test-btn'); if (t) t.addEventListener('click', sendTest);
      var p = el('bc-preview-btn'); if (p) p.addEventListener('click', preview);
      var a = el('bc-assunto'); if (a) a.addEventListener('input', function () { var b = el('bc-preview'); if (b && b.style.display !== 'none') preview(); });
      var m = el('bc-mensagem'); if (m) m.addEventListener('input', function () { var b = el('bc-preview'); if (b && b.style.display !== 'none') preview(); });
    }
    // Ao abrir a aba, carrega contagem + histórico.
    var nav = document.querySelector('[data-panel="broadcast"]');
    if (nav && !nav.dataset.bcWired) {
      nav.dataset.bcWired = '1';
      nav.addEventListener('click', function () { loadCount(); loadHistory(); });
    }
    // Se a aba já abriu direto.
    if (document.getElementById('panel-broadcast')) { loadCount(); loadHistory(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
