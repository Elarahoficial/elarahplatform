/* =============================================
   ELARAH — BOOKINGS / CHECKOUT (Stripe)
   - window.ElarahBookings.startCheckout(opts)
     chama a Edge Function `create-checkout-session`
     e redireciona o usuário para o Stripe Checkout.
   - Delegação global de clique em [data-reserve]:
     basta o card ter
        <button data-reserve
                data-experience-id="..."
                data-experience-nome="...">Reservar</button>
   - Tracking automático em analytics_events:
        evento "reserve_click"  (clicou no botão)
        evento "checkout_started" (sessão criada com sucesso)
        evento "checkout_failed"  (erro na criação)
   - Não bloqueia nada se Supabase/Edge estiver offline:
     mostra um alerta amigável e segue a vida.
   ============================================= */

(function (window, document) {
  'use strict';

  const FUNCTION_NAME = 'create-checkout-session';

  function track(name, data) {
    try {
      if (window.ElarahAnalytics && ElarahAnalytics.track) {
        ElarahAnalytics.track(name, data || {});
      }
    } catch {}
  }

  // Tenta achar o horário "ativo" dentro do mesmo card.
  function readActiveHorario(triggerEl) {
    if (!triggerEl) return null;
    const card = triggerEl.closest('.card, .originals__card, .exp-card');
    if (!card) return null;
    const active = card.querySelector('.card__horario-btn--active');
    if (active && active.dataset && active.dataset.horario) {
      return active.dataset.horario;
    }
    // fallback: primeiro horário visível
    const first = card.querySelector('.card__horario-btn');
    if (first && first.dataset) return first.dataset.horario || null;
    return null;
  }

  function getLoggedEmail() {
    try {
      if (window.ElarahAuth && ElarahAuth.getCurrentUser) {
        const u = ElarahAuth.getCurrentUser();
        if (u && u.email) return u.email;
      }
    } catch {}
    return null;
  }

  function getLoggedName() {
    try {
      if (window.ElarahAuth && ElarahAuth.getCurrentUser) {
        const u = ElarahAuth.getCurrentUser();
        if (u && u.nome) return u.nome;
      }
    } catch {}
    return null;
  }

  async function startCheckout(opts) {
    opts = opts || {};
    const experienceId = opts.experienceId;
    const experienceNome = opts.experienceNome || '';
    const horario = opts.horario || null;
    const trigger = opts.triggerEl || null;

    if (!experienceId) {
      console.warn('[ElarahBookings] startCheckout sem experienceId');
      alert('Não conseguimos identificar essa experiência. Recarregue a página e tente novamente.');
      return;
    }

    track('reserve_click', {
      category: 'booking',
      targetId: experienceId,
      targetLabel: experienceNome,
      metadata: { horario: horario || '' }
    });

    if (!window.supabaseClient) {
      alert('Não conseguimos iniciar o pagamento agora. Tente novamente em instantes.');
      return;
    }

    if (trigger) {
      trigger.disabled = true;
      trigger.dataset.originalLabel = trigger.dataset.originalLabel || trigger.textContent;
      trigger.textContent = 'Abrindo pagamento...';
    }

    try {
      const { data, error } = await window.supabaseClient.functions.invoke(FUNCTION_NAME, {
        body: {
          experiencia_id: experienceId,
          horario: horario,
          email: getLoggedEmail(),
          nome: getLoggedName()
        }
      });

      if (error || !data || !data.url) {
        console.error('[ElarahBookings] checkout error', error, data);
        track('checkout_failed', {
          category: 'booking',
          targetId: experienceId,
          targetLabel: experienceNome,
          metadata: { error: (error && error.message) || 'unknown' }
        });
        alert('Não foi possível abrir o pagamento. Tente novamente em instantes.');
        return;
      }

      track('checkout_started', {
        category: 'booking',
        targetId: experienceId,
        targetLabel: experienceNome,
        metadata: { session_id: data.session_id || '', horario: horario || '' }
      });

      window.location.href = data.url;
    } catch (e) {
      console.error('[ElarahBookings] checkout exception', e);
      track('checkout_failed', {
        category: 'booking',
        targetId: experienceId,
        targetLabel: experienceNome,
        metadata: { error: String(e && e.message || e) }
      });
      alert('Não foi possível abrir o pagamento agora. Tente novamente em instantes.');
    } finally {
      if (trigger) {
        trigger.disabled = false;
        if (trigger.dataset.originalLabel) {
          trigger.textContent = trigger.dataset.originalLabel;
        }
      }
    }
  }

  // Delegação global — qualquer botão com data-reserve dispara checkout.
  function wireDelegation() {
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest
        ? e.target.closest('[data-reserve]')
        : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      startCheckout({
        experienceId: btn.getAttribute('data-experience-id'),
        experienceNome: btn.getAttribute('data-experience-nome') || '',
        horario: btn.getAttribute('data-experience-horario') || readActiveHorario(btn),
        triggerEl: btn
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireDelegation);
  } else {
    wireDelegation();
  }

  window.ElarahBookings = {
    startCheckout: startCheckout
  };
})(window, document);
