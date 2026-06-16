// =============================================================
// ELARAH — Kit Checkout (Elarah em Casa / produtos físicos)
// -------------------------------------------------------------
// Fluxo de compra dos KITS (produto físico com entrega). Para kits,
// o botão "Reservar" vira "Quero meu kit" e, ao clicar, abre um modal
// que coleta o endereço, calcula o frete (Correios via Edge Function
// calculate-shipping) e envia tudo pro create-checkout-session com o
// objeto `shipping` — que recalcula o frete no servidor e cobra junto.
//
// É autocontido (injeta o próprio CSS) e NÃO altera o checkout das
// experiências presenciais: só intercepta cliques quando a experiência
// aberta é um kit (categoria/nome com "kit", "diy" ou "em casa").
// =============================================================
(function () {
  'use strict';

  var FN_BASE = 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1';
  var ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aWp4am1lbmJmeWVodnNjb2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA1MjQsImV4cCI6MjA5MTQyNjUyNH0.HPLrWNczhDxXH3eBLZHhsmrc3Tviah0eUuO1BsULQ-c';
  var KIT_WEIGHT_KG = 1; // peso default do kit (ajuste por produto no futuro)

  var kitExp = null;        // experiência atual, se for kit
  var selectedOption = null; // opção de frete escolhida

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isKit(exp) {
    if (!exp) return false;
    var hay = norm((exp.nome || '') + ' ' + (exp.categoria || ''));
    return hay.indexOf('kit') !== -1 || hay.indexOf('diy') !== -1 || hay.indexOf('em casa') !== -1;
  }
  function precoToCents(preco) {
    var raw = String(preco == null ? '' : preco).replace(/[^\d.,]/g, '');
    if (!raw) return 0;
    if (raw.indexOf(',') !== -1) raw = raw.replace(/\./g, '').replace(',', '.');
    var n = Math.round(Number(raw) * 100);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function brl(cents) {
    return 'R$ ' + (Number(cents || 0) / 100).toFixed(2).replace('.', ',');
  }

  function getIdFromUrl() {
    try {
      var p = new URLSearchParams(location.search);
      return p.get('id') || p.get('experiencia') || '';
    } catch (e) { return ''; }
  }

  async function getSessionEmailToken() {
    var out = { email: '', token: ANON_KEY };
    try {
      if (window.supabaseClient && window.supabaseClient.auth) {
        var r = await window.supabaseClient.auth.getSession();
        var s = r && r.data && r.data.session;
        if (s) {
          if (s.access_token) out.token = s.access_token;
          if (s.user && s.user.email) out.email = s.user.email;
        }
      }
    } catch (e) {}
    return out;
  }

  // ---------- CSS ----------
  function injectStyles() {
    if (document.getElementById('kit-checkout-styles')) return;
    var css = ''
      + '.kc-overlay{position:fixed;inset:0;background:rgba(44,33,26,.55);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px;}'
      + '.kc-overlay.open{display:flex;}'
      + '.kc-modal{background:#fff;border-radius:18px;max-width:520px;width:100%;max-height:92vh;overflow:auto;font-family:"DM Sans",sans-serif;color:#2c211a;box-shadow:0 24px 60px rgba(0,0,0,.3);}'
      + '.kc-head{padding:22px 24px 14px;border-bottom:1px solid #ece0d0;position:relative;}'
      + '.kc-title{font-family:"DM Serif Display",serif;font-size:1.5rem;margin:0;color:#2c211a;}'
      + '.kc-sub{font-size:.86rem;color:#6a584a;margin:6px 0 0;}'
      + '.kc-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border:none;background:#f4ebde;border-radius:50%;cursor:pointer;font-size:1.1rem;color:#6a584a;}'
      + '.kc-body{padding:18px 24px 8px;}'
      + '.kc-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}'
      + '.kc-field{margin-bottom:12px;}'
      + '.kc-field label{display:block;font-size:.78rem;font-weight:600;margin-bottom:4px;color:#2c211a;}'
      + '.kc-field input{width:100%;padding:10px;border:1px solid #d8c9b6;border-radius:8px;font-family:inherit;font-size:.92rem;box-sizing:border-box;}'
      + '.kc-field input:focus{outline:none;border-color:#b9764f;}'
      + '.kc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px 18px;border:none;border-radius:999px;font-family:inherit;font-weight:700;font-size:.98rem;cursor:pointer;transition:background .15s,opacity .15s;}'
      + '.kc-btn--ghost{background:#f4ebde;color:#a3633f;}'
      + '.kc-btn--primary{background:#b9764f;color:#fff;}'
      + '.kc-btn--primary:disabled{opacity:.5;cursor:not-allowed;}'
      + '.kc-options{margin:6px 0 4px;}'
      + '.kc-opt{display:flex;align-items:center;gap:10px;border:1px solid #e0d2c0;border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer;}'
      + '.kc-opt--on{border-color:#b9764f;background:#fbf2e9;}'
      + '.kc-opt input{accent-color:#b9764f;}'
      + '.kc-opt__name{font-weight:600;font-size:.92rem;}'
      + '.kc-opt__meta{font-size:.78rem;color:#6a584a;}'
      + '.kc-opt__price{margin-left:auto;font-family:"DM Serif Display",serif;color:#a3633f;font-size:1.05rem;}'
      + '.kc-summary{background:#faf4ec;border-radius:12px;padding:14px 16px;margin:10px 0 14px;font-size:.9rem;}'
      + '.kc-summary .kc-line{display:flex;justify-content:space-between;padding:3px 0;color:#6a584a;}'
      + '.kc-summary .kc-total{display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:1px solid #e7d9c7;font-weight:700;color:#2c211a;font-size:1.05rem;}'
      + '.kc-foot{padding:4px 24px 22px;}'
      + '.kc-msg{font-size:.82rem;margin:0 0 10px;min-height:1em;}'
      + '.kc-msg--err{color:#c0392b;}'
      + '@media(max-width:520px){.kc-row{grid-template-columns:1fr;}}';
    var el = document.createElement('style');
    el.id = 'kit-checkout-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ---------- Modal ----------
  function buildModal() {
    if (document.getElementById('kc-overlay')) return;
    var ov = document.createElement('div');
    ov.className = 'kc-overlay';
    ov.id = 'kc-overlay';
    ov.innerHTML = ''
      + '<div class="kc-modal" role="dialog" aria-modal="true" aria-label="Comprar kit">'
      +   '<div class="kc-head">'
      +     '<h2 class="kc-title">Quero meu kit</h2>'
      +     '<p class="kc-sub" id="kc-kit-name"></p>'
      +     '<button type="button" class="kc-close" id="kc-close" aria-label="Fechar">×</button>'
      +   '</div>'
      +   '<div class="kc-body">'
      +     '<div class="kc-field"><label>Nome de quem recebe *</label><input type="text" id="kc-dest" autocomplete="name"></div>'
      +     '<div class="kc-field"><label>E-mail *</label><input type="email" id="kc-email" autocomplete="email"></div>'
      +     '<div class="kc-row">'
      +       '<div class="kc-field"><label>CEP *</label><input type="text" id="kc-cep" inputmode="numeric" placeholder="00000-000" autocomplete="postal-code"></div>'
      +       '<div class="kc-field"><label>Número *</label><input type="text" id="kc-numero" autocomplete="address-line2"></div>'
      +     '</div>'
      +     '<div class="kc-field"><label>Endereço *</label><input type="text" id="kc-logradouro" autocomplete="address-line1"></div>'
      +     '<div class="kc-field"><label>Complemento</label><input type="text" id="kc-complemento" placeholder="apto, bloco, referência"></div>'
      +     '<div class="kc-row">'
      +       '<div class="kc-field"><label>Bairro</label><input type="text" id="kc-bairro"></div>'
      +       '<div class="kc-field"><label>Cidade</label><input type="text" id="kc-cidade"></div>'
      +     '</div>'
      +     '<div class="kc-field" style="max-width:120px;"><label>UF</label><input type="text" id="kc-uf" maxlength="2" style="text-transform:uppercase;"></div>'
      +     '<button type="button" class="kc-btn kc-btn--ghost" id="kc-calc">Calcular frete</button>'
      +     '<div class="kc-options" id="kc-options"></div>'
      +     '<div class="kc-summary" id="kc-summary" style="display:none;">'
      +       '<div class="kc-line"><span>Kit</span><span id="kc-sum-kit"></span></div>'
      +       '<div class="kc-line"><span id="kc-sum-frete-label">Frete</span><span id="kc-sum-frete"></span></div>'
      +       '<div class="kc-total"><span>Total</span><span id="kc-sum-total"></span></div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="kc-foot">'
      +     '<p class="kc-msg" id="kc-msg"></p>'
      +     '<button type="button" class="kc-btn kc-btn--primary" id="kc-buy" disabled>Quero meu kit</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    document.getElementById('kc-close').addEventListener('click', closeModal);
    document.getElementById('kc-cep').addEventListener('blur', onCepBlur);
    document.getElementById('kc-calc').addEventListener('click', calcularFrete);
    document.getElementById('kc-buy').addEventListener('click', comprar);
  }

  function setMsg(text, isErr) {
    var m = document.getElementById('kc-msg');
    if (!m) return;
    m.textContent = text || '';
    m.className = 'kc-msg' + (isErr ? ' kc-msg--err' : '');
  }

  function openModal(exp) {
    injectStyles();
    buildModal();
    selectedOption = null;
    document.getElementById('kc-kit-name').textContent = exp.nome || '';
    document.getElementById('kc-options').innerHTML = '';
    document.getElementById('kc-summary').style.display = 'none';
    document.getElementById('kc-buy').disabled = true;
    setMsg('');
    getSessionEmailToken().then(function (s) {
      if (s.email && !document.getElementById('kc-email').value) {
        document.getElementById('kc-email').value = s.email;
      }
    });
    document.getElementById('kc-overlay').classList.add('open');
  }
  function closeModal() {
    var ov = document.getElementById('kc-overlay');
    if (ov) ov.classList.remove('open');
  }

  // ViaCEP — autopreenche endereço a partir do CEP.
  async function onCepBlur() {
    var cepEl = document.getElementById('kc-cep');
    var cep = (cepEl.value || '').replace(/\D+/g, '');
    if (cep.length !== 8) return;
    try {
      var r = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
      var d = await r.json();
      if (d && !d.erro) {
        if (d.logradouro) document.getElementById('kc-logradouro').value = d.logradouro;
        if (d.bairro) document.getElementById('kc-bairro').value = d.bairro;
        if (d.localidade) document.getElementById('kc-cidade').value = d.localidade;
        if (d.uf) document.getElementById('kc-uf').value = d.uf;
        document.getElementById('kc-numero').focus();
      }
    } catch (e) { /* silencioso — usuário preenche manual */ }
  }

  async function calcularFrete() {
    var cep = (document.getElementById('kc-cep').value || '').replace(/\D+/g, '');
    if (cep.length !== 8) { setMsg('Informe um CEP válido (8 dígitos).', true); return; }
    var btn = document.getElementById('kc-calc');
    btn.disabled = true; btn.textContent = 'Calculando…';
    setMsg('');
    try {
      var resp = await fetch(FN_BASE + '/calculate-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ANON_KEY,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ cep: cep, weight_kg: KIT_WEIGHT_KG }),
      });
      var data = await resp.json();
      if (!resp.ok || !data.options || !data.options.length) {
        setMsg((data && data.message) || 'Não foi possível calcular o frete pra esse CEP.', true);
        return;
      }
      renderOptions(data.options);
    } catch (e) {
      setMsg('Erro ao calcular o frete. Tente de novo.', true);
    } finally {
      btn.disabled = false; btn.textContent = 'Calcular frete';
    }
  }

  function renderOptions(options) {
    var wrap = document.getElementById('kc-options');
    wrap.innerHTML = options.map(function (o, i) {
      var prazo = o.delivery_days ? ('chega em ~' + o.delivery_days + ' dia(s)') : '';
      return '<label class="kc-opt" data-i="' + i + '">'
        + '<input type="radio" name="kc-frete" value="' + i + '">'
        + '<span><span class="kc-opt__name">' + esc(o.carrier + ' ' + o.service) + '</span>'
        + (prazo ? '<br><span class="kc-opt__meta">' + esc(prazo) + '</span>' : '') + '</span>'
        + '<span class="kc-opt__price">' + brl(o.cost_centavos) + '</span>'
        + '</label>';
    }).join('');
    wrap.querySelectorAll('input[name="kc-frete"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var i = Number(inp.value);
        selectedOption = options[i];
        wrap.querySelectorAll('.kc-opt').forEach(function (el) { el.classList.remove('kc-opt--on'); });
        var lbl = wrap.querySelector('.kc-opt[data-i="' + i + '"]');
        if (lbl) lbl.classList.add('kc-opt--on');
        updateSummary();
      });
    });
  }

  function updateSummary() {
    if (!selectedOption || !kitExp) return;
    var kitCents = precoToCents(kitExp.preco);
    var freteCents = selectedOption.cost_centavos;
    document.getElementById('kc-sum-kit').textContent = brl(kitCents);
    document.getElementById('kc-sum-frete-label').textContent =
      'Frete (' + selectedOption.carrier + ' ' + selectedOption.service + ')';
    document.getElementById('kc-sum-frete').textContent = brl(freteCents);
    document.getElementById('kc-sum-total').textContent = brl(kitCents + freteCents);
    document.getElementById('kc-summary').style.display = 'block';
    document.getElementById('kc-buy').disabled = false;
  }

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  async function comprar() {
    if (!kitExp) return;
    if (!selectedOption) { setMsg('Escolha uma opção de frete.', true); return; }
    var dest = val('kc-dest');
    var email = val('kc-email');
    var cep = val('kc-cep').replace(/\D+/g, '');
    var numero = val('kc-numero');
    var logradouro = val('kc-logradouro');
    if (!dest) { setMsg('Informe o nome de quem recebe.', true); return; }
    if (!email || email.indexOf('@') === -1) { setMsg('Informe um e-mail válido.', true); return; }
    if (cep.length !== 8) { setMsg('CEP inválido.', true); return; }
    if (!numero) { setMsg('Informe o número do endereço.', true); return; }
    if (!logradouro) { setMsg('Informe o endereço.', true); return; }

    var btn = document.getElementById('kc-buy');
    btn.disabled = true; btn.textContent = 'Indo pro pagamento…';
    setMsg('');
    try {
      var s = await getSessionEmailToken();
      var resp = await fetch(FN_BASE + '/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + s.token,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          experiencia_id: kitExp.id,
          email: email,
          nome: dest,
          quantidade: 1,
          shipping: {
            service: selectedOption.service,
            weight_kg: KIT_WEIGHT_KG,
            destinatario: dest,
            cep: cep,
            logradouro: logradouro,
            numero: numero,
            complemento: val('kc-complemento'),
            bairro: val('kc-bairro'),
            cidade: val('kc-cidade'),
            uf: val('kc-uf').toUpperCase(),
          },
        }),
      });
      var data = await resp.json();
      if (resp.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg((data && data.message) || 'Não foi possível iniciar o pagamento. Tente novamente.', true);
    } catch (e) {
      setMsg('Erro ao iniciar o pagamento. Tente novamente.', true);
    } finally {
      btn.disabled = false; btn.textContent = 'Quero meu kit';
    }
  }

  // ---------- Integração com a página ----------
  // Troca o texto dos botões "Reservar" por "Quero meu kit".
  function relabelButtons() {
    if (!kitExp) return;
    document.querySelectorAll('[data-reserve]').forEach(function (b) {
      if (b.dataset.kcRelabeled) return;
      // Só relabela botões cujo texto seja o de reserva (evita mexer noutros).
      if (/reservar|quero participar/i.test(b.textContent || '')) {
        b.textContent = 'Quero meu kit';
        b.dataset.kcRelabeled = '1';
      }
    });
  }

  // Intercepta o clique de compra ANTES do handler global do script.js.
  function interceptClicks() {
    document.addEventListener('click', function (e) {
      if (!kitExp) return;
      var btn = e.target && e.target.closest && e.target.closest('[data-reserve]');
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openModal(kitExp);
    }, true); // capture: roda antes da delegação (bubble) do script.js
  }

  async function init() {
    var id = getIdFromUrl();
    if (!id) return;
    try {
      if (!window.ElarahData || typeof window.ElarahData.getExperienceById !== 'function') {
        await new Promise(function (r) { setTimeout(r, 600); });
      }
      if (!window.ElarahData || !window.ElarahData.getExperienceById) return;
      var exp = await window.ElarahData.getExperienceById(id);
      if (!exp || !isKit(exp)) return; // não é kit → fluxo normal intacto
      kitExp = exp;
      interceptClicks();
      relabelButtons();
      // Botões são renderizados de forma assíncrona — observa e relabela.
      var mo = new MutationObserver(relabelButtons);
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
      console.warn('[KitCheckout] init falhou', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
