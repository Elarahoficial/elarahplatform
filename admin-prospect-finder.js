// =============================================================
// ELARAH — Botão "Buscar leads agora" (Prospecção)
// -------------------------------------------------------------
// Dispara a Edge Function prospect-finder (Google Maps) na hora.
// O agente já roda sozinho toda segunda; isto é pra testar/forçar.
// =============================================================
(function () {
  'use strict';
  var FN = 'prospect-finder';
  function el(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || null; }
  function url() {
    try { var c = sb(); if (c && c.supabaseUrl) return c.supabaseUrl; } catch (_) {}
    return 'https://nwijxjmenbfyehvscogs.supabase.co';
  }
  async function token() {
    var c = sb(); if (!c) return null;
    try { var r = await c.auth.getSession(); return r.data && r.data.session && r.data.session.access_token; } catch (_) { return null; }
  }
  function setStatus(m, color) { var s = el('pf-status'); if (s) { s.textContent = m || ''; s.style.color = color || '#888'; } }

  async function run() {
    var btn = el('pf-run');
    var t = await token();
    if (!t) { setStatus('Sessão expirou — faça login.', '#b3261e'); return; }
    if (btn) btn.disabled = true;
    setStatus('Buscando no Google Maps… (pode levar até 1 min)');
    try {
      var res = await fetch(url() + '/functions/v1/' + FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({ mode: 'run', target: 30 }),
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || !d.ok) throw new Error(d.error || ('HTTP ' + res.status));
      setStatus('✅ ' + (d.inseridos || 0) + ' novos parceiros adicionados. Atualizando a lista…', '#1c7a43');
      setTimeout(function () { window.location.reload(); }, 1400);
    } catch (e) {
      setStatus('Falha: ' + (e.message || e), '#b3261e');
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    var btn = el('pf-run');
    if (btn && !btn.dataset.wired) { btn.dataset.wired = '1'; btn.addEventListener('click', run); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
