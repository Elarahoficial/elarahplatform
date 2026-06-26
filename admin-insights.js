/* =============================================================
   ELARAH — Diagnóstico IA ("Onde estamos pecando") — AUTÔNOMO
   -------------------------------------------------------------
   O agente roda SOZINHO todo dia (via cron na Edge Function) e:
     - grava o diagnóstico em public.analytics_insights_runs
     - manda o resumo por e-mail pros admins

   Este front só MOSTRA o último diagnóstico gravado — abriu a aba,
   já aparece atualizado, sem ninguém clicar. Tem um "Atualizar
   agora" opcional pra quem quiser forçar um na hora.

   Auto-contido: injeta seu próprio CSS e não depende do admin.js.
   ============================================================= */
(function (window, document) {
  'use strict';

  function sb() { return window.supabaseClient || null; }

  function getSupabaseUrl() {
    try {
      if (window.SUPABASE_URL) return window.SUPABASE_URL;
      const c = sb();
      if (c && c.supabaseUrl) return c.supabaseUrl;
    } catch (_) {}
    return 'https://nwijxjmenbfyehvscogs.supabase.co';
  }

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function injectStyles() {
    if (el('insights-styles')) return;
    const css = `
      .ins-grid{display:grid;gap:14px;margin-top:6px}
      .ins-card{background:#fff;border:1px solid #f0e8de;border-radius:14px;padding:18px 20px;box-shadow:0 4px 16px rgba(0,0,0,.04)}
      .ins-resumo{font-size:1rem;line-height:1.6;color:#2a2a2a}
      .ins-badge{display:inline-block;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:999px;margin-bottom:10px}
      .ins-badge--boa{background:#e6f6ec;color:#1c7a43}
      .ins-badge--atencao{background:#fff4e0;color:#a4663b}
      .ins-badge--critica{background:#fdeaea;color:#b3261e}
      .ins-h{font-family:Georgia,serif;font-size:1.05rem;margin:0 0 10px;color:#1a1a1a}
      .ins-item{padding:12px 0;border-top:1px dashed #eee}
      .ins-item:first-of-type{border-top:none}
      .ins-item__title{font-weight:600;color:#1a1a1a;display:flex;align-items:center;gap:8px}
      .ins-grav{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 8px;border-radius:999px}
      .ins-grav--alta{background:#fdeaea;color:#b3261e}
      .ins-grav--media{background:#fff4e0;color:#a4663b}
      .ins-grav--baixa{background:#eef1f5;color:#5a6472}
      .ins-detalhe{margin:6px 0 0;color:#444;font-size:.9rem;line-height:1.55}
      .ins-reco{margin:8px 0 0;padding:8px 12px;background:#faf6f0;border-left:3px solid #f0a05e;border-radius:8px;font-size:.88rem;color:#5a4a3a}
      .ins-reco b{color:#a4663b}
      .ins-funil li{margin:4px 0;color:#444;font-size:.9rem}
      .ins-meta{font-size:.75rem;color:#aaa;margin-top:14px}
      .ins-kpis{display:flex;gap:18px;flex-wrap:wrap;margin:4px 0 0}
      .ins-kpi{background:#fff8ee;border:1px solid #f0d8bf;border-radius:12px;padding:12px 16px;min-width:130px}
      .ins-kpi__v{font-size:1.3rem;font-weight:700;color:#1a1a1a}
      .ins-kpi__l{font-size:.72rem;color:#a4663b;text-transform:uppercase;letter-spacing:.04em}
      .ins-empty{color:#777;font-size:.95rem;line-height:1.6}
    `;
    const style = document.createElement('style');
    style.id = 'insights-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function renderKpis(m) {
    if (!m) return '';
    const conv = m.conversao_geral_visita_para_pagamento_pct;
    return `
      <div class="ins-kpis">
        <div class="ins-kpi"><div class="ins-kpi__v">${esc(m.vendas_pagas ?? 0)}</div><div class="ins-kpi__l">Vendas pagas</div></div>
        <div class="ins-kpi"><div class="ins-kpi__v">${esc(m.receita_total ?? '—')}</div><div class="ins-kpi__l">Receita</div></div>
        <div class="ins-kpi"><div class="ins-kpi__v">${esc((m.funil && m.funil[0] && m.funil[0].total) || 0)}</div><div class="ins-kpi__l">Visitas</div></div>
        <div class="ins-kpi"><div class="ins-kpi__v">${conv == null ? '—' : esc(conv) + '%'}</div><div class="ins-kpi__l">Conversão geral</div></div>
      </div>`;
  }

  // Aceita tanto o formato da Edge Function (generated_at) quanto o
  // da linha gravada no banco (created_at).
  function normalize(p) {
    return {
      when: p.generated_at || p.created_at || null,
      period_days: p.period_days,
      model: p.model,
      insights: p.insights || {},
      metrics: p.metrics || {},
      trigger: p.trigger,
    };
  }

  function render(payload) {
    const root = el('insights-result');
    if (!root) return;
    const d = normalize(payload);
    const ins = d.insights;
    const m = d.metrics;

    const badgeClass = 'ins-badge--' + (ins.saude_geral || 'atencao');
    const badgeLabel = ({ boa: 'Saúde boa', atencao: 'Requer atenção', critica: 'Crítico' })[ins.saude_geral] || 'Diagnóstico';

    const fortes = (ins.pontos_fortes || []).map(p =>
      `<div class="ins-item"><div class="ins-item__title">✅ ${esc(p.titulo)}</div><p class="ins-detalhe">${esc(p.detalhe)}</p></div>`
    ).join('') || '<p class="ins-detalhe">—</p>';

    const problemas = (ins.problemas || []).map(p =>
      `<div class="ins-item">
        <div class="ins-item__title">⚠️ ${esc(p.titulo)}
          <span class="ins-grav ins-grav--${esc(p.gravidade)}">${esc(p.gravidade)}</span></div>
        <p class="ins-detalhe">${esc(p.detalhe)}</p>
        <p class="ins-reco"><b>O que fazer:</b> ${esc(p.recomendacao)}</p>
      </div>`
    ).join('') || '<p class="ins-detalhe">Nenhum problema crítico identificado.</p>';

    const funil = (ins.funil_observacoes || []).map(f => `<li>${esc(f)}</li>`).join('');
    const when = d.when ? new Date(d.when).toLocaleString('pt-BR') : '';
    const origem = d.trigger === 'cron' ? 'atualização automática' : 'atualização manual';

    root.innerHTML = `
      <div class="ins-grid">
        <div class="ins-card">
          <span class="ins-badge ${badgeClass}">${esc(badgeLabel)}</span>
          ${renderKpis(m)}
          <p class="ins-resumo" style="margin-top:14px;">${esc(ins.resumo)}</p>
        </div>
        <div class="ins-card">
          <h3 class="ins-h">Onde estamos pecando</h3>
          ${problemas}
        </div>
        <div class="ins-card">
          <h3 class="ins-h">O que está funcionando</h3>
          ${fortes}
        </div>
        ${funil ? `<div class="ins-card"><h3 class="ins-h">Leitura do funil</h3><ul class="ins-funil">${funil}</ul></div>` : ''}
        <p class="ins-meta">Última ${esc(origem)}: ${esc(when)} · período de ${esc(d.period_days)} dias · modelo ${esc(d.model)} · só leitura (nenhuma alteração foi feita).</p>
      </div>`;
    root.style.display = 'block';
  }

  function showEmpty() {
    const root = el('insights-result');
    if (!root) return;
    root.innerHTML = `
      <div class="ins-card">
        <p class="ins-empty">
          Ainda não tem diagnóstico gravado. Assim que o agente rodar (todo dia
          de manhã, automaticamente), ele aparece aqui sozinho e você recebe o
          resumo por e-mail. Se quiser ver um agora, clique em
          <strong>Atualizar agora</strong>.
        </p>
      </div>`;
    root.style.display = 'block';
  }

  // ---- Carrega o último diagnóstico já gravado (sem clicar) ----
  async function loadLatest() {
    const status = el('insights-status');
    const client = sb();
    if (!client) return;
    let session;
    try {
      const r = await client.auth.getSession();
      session = r.data && r.data.session;
    } catch (_) {}
    if (!session) return;

    try {
      const { data, error } = await client
        .from('analytics_insights_runs')
        .select('created_at, period_days, model, trigger, metrics, insights')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length) {
        render(data[0]);
        if (status) status.textContent = '';
      } else {
        showEmpty();
      }
    } catch (err) {
      console.warn('[ElarahInsights] não carregou o último:', err);
      // Tabela pode não existir ainda — não quebra a aba.
      showEmpty();
    }
  }

  // ---- Força um diagnóstico novo na hora (opcional) ----
  async function generate() {
    const btn = el('insights-generate');
    const status = el('insights-status');
    const periodSel = el('insights-period');
    const result = el('insights-result');
    if (!btn) return;

    const client = sb();
    if (!client) { if (status) status.textContent = 'Supabase não carregou.'; return; }

    let session;
    try {
      const r = await client.auth.getSession();
      session = r.data && r.data.session;
    } catch (_) {}
    if (!session) { if (status) status.textContent = 'Sessão expirou — faça login de novo.'; return; }

    const periodDays = Number((periodSel && periodSel.value) || 30);

    btn.disabled = true;
    const prevLabel = btn.textContent;
    btn.textContent = 'Analisando…';
    if (status) status.textContent = 'Lendo os dados e consultando a Claude…';

    try {
      const res = await fetch(getSupabaseUrl() + '/functions/v1/analytics-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ period_days: periodDays, trigger: 'manual' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || ('HTTP ' + res.status));
      }
      render(data);
      if (status) status.textContent = '';
    } catch (err) {
      console.error('[ElarahInsights] falhou:', err);
      if (status) status.textContent = 'Falha: ' + (err.message || err);
      if (result && result.style.display === 'none') showEmpty();
    } finally {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  }

  function init() {
    injectStyles();
    const btn = el('insights-generate');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', generate);
    }
    // Auto-carrega o último diagnóstico ao abrir a aba (sem clique).
    const nav = document.querySelector('[data-panel="insights"]');
    if (nav && !nav.dataset.insightsWired) {
      nav.dataset.insightsWired = '1';
      nav.addEventListener('click', loadLatest);
    }
    // E já tenta carregar de cara (caso a aba abra direto).
    loadLatest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
