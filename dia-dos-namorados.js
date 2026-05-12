// =============================================================
// ELARAH — Dia dos Namorados
// -------------------------------------------------------------
// Carrega dados REAIS do banco:
//   - campaign_overrides JOIN experiences → vitrine curada
//   - campaign_upcoming_experiences → cards "em breve"
//   - campaign_waitlist (insert) → captura de leads
// =============================================================
(function () {
  'use strict';

  var CAMPAIGN_SLUG = 'dia-dos-namorados';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // ===== Countdown =====
  function updateCountdown() {
    var el = document.getElementById('ddn-countdown');
    if (!el) return;
    var now = new Date();
    var year = now.getFullYear();
    var target = new Date(year + '-06-12T00:00:00-03:00');
    if (now > target) target = new Date((year + 1) + '-06-12T00:00:00-03:00');
    var diffMs = target - now;
    var days = Math.ceil(diffMs / 86400000);
    if (days <= 0) el.innerHTML = '🤍 <strong>É hoje!</strong>';
    else if (days === 1) el.innerHTML = '<strong>Amanhã</strong> é o 12 de junho';
    else el.innerHTML = 'Faltam <strong>' + days + '</strong> dias para o 12 de junho';
  }
  updateCountdown();

  // ===== Gift card chips =====
  document.querySelectorAll('.ddn-gift__value-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.ddn-gift__value-chip').forEach(function (c) {
        c.classList.remove('ddn-gift__value-chip--active');
      });
      chip.classList.add('ddn-gift__value-chip--active');
      var preview = document.querySelector('.ddn-gift__card-preview-value');
      if (preview) preview.textContent = chip.textContent.trim();
    });
  });

  // ===== Renderiza vitrine real (campaign_overrides) =====
  async function renderVitrine() {
    var grid = document.getElementById('ddn-grid');
    if (!grid) return;
    var sb = window.supabaseClient;
    if (!sb) return;

    try {
      var { data: overrides, error: oErr } = await sb
        .from('campaign_overrides')
        .select('id, experience_id, titulo_custom, badge_text, display_order')
        .eq('campaign_slug', CAMPAIGN_SLUG)
        .order('display_order', { ascending: true });

      if (oErr) {
        console.warn('[DDN] overrides erro:', oErr.message);
        return;
      }
      if (!overrides || !overrides.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px 20px;font-style:italic;">Curadoria sendo finalizada — volte logo.</p>';
        return;
      }

      var expIds = overrides.map(function (o) { return o.experience_id; });
      var { data: exps, error: eErr } = await sb
        .from('experiences')
        .select('id, nome, categoria, preco, duracao, bairro, imagem, vagas_total, vagas_restantes, is_active')
        .in('id', expIds)
        .eq('is_active', true);

      if (eErr) {
        console.warn('[DDN] experiences erro:', eErr.message);
        return;
      }

      var expById = new Map();
      (exps || []).forEach(function (e) { expById.set(e.id, e); });

      grid.innerHTML = overrides.map(function (o) {
        var e = expById.get(o.experience_id);
        if (!e) return '';
        var titulo = (o.titulo_custom && o.titulo_custom.trim()) || e.nome;
        var badge = (o.badge_text && o.badge_text.trim()) || 'Especial Dia dos Namorados';
        var preco = e.preco || '';
        var meta = [];
        if (e.duracao) meta.push('<span class="ddn-card__meta-item">' + esc(e.duracao) + '</span>');
        if (e.bairro) meta.push('<span class="ddn-card__meta-item">' + esc(e.bairro) + '</span>');
        if (e.vagas_total) meta.push('<span class="ddn-card__meta-item">' + esc(e.vagas_total) + ' vagas</span>');

        var media = e.imagem
          ? '<img src="' + esc(e.imagem) + '" alt="' + esc(titulo) + '" onerror="this.style.display=\'none\';this.parentNode.querySelector(\'.ddn-card__placeholder\').style.display=\'flex\';">' +
            '<div class="ddn-card__placeholder" style="display:none;">' + esc(e.categoria || 'Experiência') + '</div>'
          : '<div class="ddn-card__placeholder">' + esc(e.categoria || 'Experiência') + '</div>';

        return '<article class="ddn-card">' +
          '<div class="ddn-card__media">' +
            '<span class="ddn-card__badge">' + esc(badge) + '</span>' +
            media +
          '</div>' +
          '<div class="ddn-card__body">' +
            (e.categoria ? '<span class="ddn-card__categoria">' + esc(e.categoria) + '</span>' : '') +
            '<h3 class="ddn-card__title">' + esc(titulo) + '</h3>' +
            (meta.length ? '<div class="ddn-card__meta">' + meta.join('') + '</div>' : '') +
            '<div class="ddn-card__price">' +
              '<div>' +
                '<div class="ddn-card__price-label">A partir de</div>' +
                '<div class="ddn-card__price-value">' + esc(preco) + '</div>' +
              '</div>' +
              '<a href="experiencia.html?id=' + encodeURIComponent(e.id) + '" class="ddn-card__price-cta">Ver experiência →</a>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');
    } catch (err) {
      console.warn('[DDN] renderVitrine exception:', err);
    }
  }

  // ===== Renderiza "em breve" real =====
  async function renderUpcoming() {
    var sb = window.supabaseClient;
    if (!sb) return;
    var section = document.querySelector('.ddn-upcoming__grid');
    if (!section) return;

    try {
      var { data, error } = await sb
        .from('campaign_upcoming_experiences')
        .select('*')
        .eq('campaign_slug', CAMPAIGN_SLUG)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.warn('[DDN] upcoming erro:', error.message);
        return;
      }

      if (!data || !data.length) {
        section.parentElement.parentElement.style.display = 'none';
        return;
      }

      section.innerHTML = data.map(function (r) {
        var iconDefault = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8c-3 6-3 9 0 12s3 6 0 12-3 6 0 8"/><path d="M14 28a10 10 0 0 0 20 0c0-5-5-9-10-14-5 5-10 9-10 14z"/></svg>';
        var mediaIcon = r.imagem
          ? '<img src="' + esc(r.imagem) + '" alt="' + esc(r.nome) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
          : iconDefault;
        return '<article class="ddn-upcoming-card">' +
          '<div class="ddn-upcoming-card__icon">' + mediaIcon + '</div>' +
          '<div class="ddn-upcoming-card__status">' + esc(r.expected_label || 'em breve') + '</div>' +
          '<h3 class="ddn-upcoming-card__title">' + esc(r.nome) + '</h3>' +
          (r.descricao_curta
            ? '<p class="ddn-upcoming-card__desc">' + esc(r.descricao_curta) + '</p>'
            : '<p class="ddn-upcoming-card__desc"></p>') +
          '<button type="button" class="ddn-upcoming-card__cta" data-ddn-waitlist data-upcoming-id="' + esc(r.id) + '" data-upcoming-name="' + esc(r.nome) + '">' +
            'Avise-me quando abrir' +
          '</button>' +
        '</article>';
      }).join('');

      wireWaitlistButtons();
    } catch (err) {
      console.warn('[DDN] renderUpcoming exception:', err);
    }
  }

  // ===== Modal de waitlist =====
  var modal      = document.getElementById('ddn-waitlist-modal');
  var closeBtn   = document.getElementById('ddn-waitlist-close');
  var form       = document.getElementById('ddn-waitlist-form');
  var subEl      = document.getElementById('ddn-waitlist-sub');
  var hiddenName = document.getElementById('ddn-waitlist-upcoming-name');
  var formSec    = document.getElementById('ddn-waitlist-form-section');
  var successSec = document.getElementById('ddn-waitlist-success-section');
  var currentUpcomingId = null;
  var currentUpcomingName = null;

  function openModal(upcomingName, upcomingId) {
    if (!modal) return;
    currentUpcomingId = upcomingId || null;
    currentUpcomingName = upcomingName || null;
    if (hiddenName) hiddenName.value = upcomingName || '';
    if (subEl) {
      subEl.innerHTML = upcomingName
        ? 'Deixe seu e-mail e a gente te avisa assim que <strong>' + esc(upcomingName) + '</strong> abrir reservas.'
        : 'Deixe seu e-mail e a gente te avisa assim que essa experiência abrir reservas.';
    }
    if (formSec) formSec.style.display = '';
    if (successSec) successSec.style.display = 'none';
    if (form) form.reset();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var nomeInput = document.getElementById('ddn-waitlist-nome');
      if (nomeInput) nomeInput.focus();
    }, 200);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function wireWaitlistButtons() {
    document.querySelectorAll('[data-ddn-waitlist]').forEach(function (btn) {
      if (btn.__wired) return;
      btn.__wired = true;
      btn.addEventListener('click', function () {
        openModal(btn.dataset.upcomingName || '', btn.dataset.upcomingId || '');
      });
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  // ===== Submit (grava no banco) =====
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var sb = window.supabaseClient;
      if (!sb) {
        alert('Conexão indisponível. Tente novamente em alguns segundos.');
        return;
      }
      var nome = document.getElementById('ddn-waitlist-nome').value.trim();
      var email = document.getElementById('ddn-waitlist-email').value.trim();
      var tel = document.getElementById('ddn-waitlist-tel').value.trim();
      if (!email || email.length < 5) {
        alert('Informe um e-mail válido.');
        return;
      }

      var submitBtn = form.querySelector('.ddn-waitlist-modal__submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';
      }

      try {
        var payload = {
          campaign_slug: CAMPAIGN_SLUG,
          email: email,
          nome: nome || null,
          telefone: tel || null,
          upcoming_id: currentUpcomingId || null,
          mensagem: currentUpcomingName ? ('Interesse em: ' + currentUpcomingName) : null,
          source: 'landing-ddn',
        };
        var { error } = await sb.from('campaign_waitlist').insert(payload);
        if (error) {
          console.error('[DDN] waitlist insert error:', error);
          alert('Não foi possível registrar agora. Tente em alguns minutos.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar na lista de espera';
          }
          return;
        }
        if (formSec) formSec.style.display = 'none';
        if (successSec) successSec.style.display = '';
      } catch (err) {
        console.error('[DDN] waitlist exception:', err);
        alert('Erro inesperado. Tente novamente.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar na lista de espera';
        }
      }
    });
  }

  // ===== Boot =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderVitrine();
      renderUpcoming();
      wireWaitlistButtons();
    });
  } else {
    renderVitrine();
    renderUpcoming();
    wireWaitlistButtons();
  }
})();
