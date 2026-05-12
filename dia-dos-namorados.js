// =============================================================
// ELARAH — Dia dos Namorados (preview visual / mockup)
// -------------------------------------------------------------
// Esta versão é um PREVIEW — usa mock data inline pra validar
// estética. Integração com banco (campaign_overrides,
// campaign_waitlist, campaign_upcoming_experiences) vem na Fase 3
// depois do design ser aprovado.
//
// Funcionalidades ativas no preview:
//   - Countdown até 12/06
//   - Modal de lista de espera (UI funcional, mas só simula
//     submit — não grava no banco ainda)
//   - Chips de valor do gift card (UI interativa)
// =============================================================
(function () {
  'use strict';

  // ===== Countdown até Dia dos Namorados =====
  function updateCountdown() {
    var el = document.getElementById('ddn-countdown');
    if (!el) return;
    var now = new Date();
    var year = now.getFullYear();
    var target = new Date(year + '-06-12T00:00:00-03:00');
    if (now > target) {
      target = new Date((year + 1) + '-06-12T00:00:00-03:00');
    }
    var diffMs = target - now;
    var days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      el.innerHTML = '🤍 <strong>É hoje!</strong>';
    } else if (days === 1) {
      el.innerHTML = '<strong>Amanhã</strong> é o 12 de junho';
    } else {
      el.innerHTML = 'Faltam <strong>' + days + '</strong> dias para o 12 de junho';
    }
  }
  updateCountdown();

  // ===== Chips de valor do gift card =====
  document.querySelectorAll('.ddn-gift__value-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.ddn-gift__value-chip').forEach(function (c) {
        c.classList.remove('ddn-gift__value-chip--active');
      });
      chip.classList.add('ddn-gift__value-chip--active');
      // Atualiza preview visual do cartão se valor mudar
      var preview = document.querySelector('.ddn-gift__card-preview-value');
      if (preview) preview.textContent = chip.textContent.trim();
    });
  });

  // ===== Modal de lista de espera =====
  var modal      = document.getElementById('ddn-waitlist-modal');
  var closeBtn   = document.getElementById('ddn-waitlist-close');
  var form       = document.getElementById('ddn-waitlist-form');
  var subEl      = document.getElementById('ddn-waitlist-sub');
  var hiddenName = document.getElementById('ddn-waitlist-upcoming-name');
  var formSec    = document.getElementById('ddn-waitlist-form-section');
  var successSec = document.getElementById('ddn-waitlist-success-section');

  function openModal(upcomingName) {
    if (!modal) return;
    if (hiddenName) hiddenName.value = upcomingName || '';
    if (subEl && upcomingName) {
      subEl.innerHTML = 'Deixe seu e-mail e a gente te avisa assim que <strong>' +
        escapeHtml(upcomingName) + '</strong> abrir reservas.';
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

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // Wire dos botões "Avise-me quando abrir"
  document.querySelectorAll('[data-ddn-waitlist]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.dataset.upcomingName || '');
    });
  });

  // Fechar modal
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  // Submit (PREVIEW — só simula, não grava no banco ainda)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // TODO Fase 3: enviar pra Supabase
      //   await sb.from('campaign_waitlist').insert({
      //     campaign_slug: 'dia-dos-namorados',
      //     email: ..., nome: ..., telefone: ...,
      //     mensagem: 'Interesse em ' + upcomingName,
      //     source: 'landing-ddn',
      //   });
      console.log('[DDN Preview] lead capturado (simulado):', {
        upcoming: hiddenName ? hiddenName.value : '',
        nome: document.getElementById('ddn-waitlist-nome').value,
        email: document.getElementById('ddn-waitlist-email').value,
        telefone: document.getElementById('ddn-waitlist-tel').value,
      });
      if (formSec) formSec.style.display = 'none';
      if (successSec) successSec.style.display = '';
    });
  }
})();
