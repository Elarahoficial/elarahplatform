document.addEventListener('DOMContentLoaded', () => {
  const partnerHeroBtn = document.getElementById('partnerHeroBtn');
  const partnerCtaBtn = document.getElementById('partnerCtaBtn');

  function mostrarMensagemParceiro(texto) {
    const msg = document.createElement('div');
    msg.textContent = texto;
    msg.style.position = 'fixed';
    msg.style.bottom = '24px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.background = '#111';
    msg.style.color = '#fff';
    msg.style.padding = '14px 20px';
    msg.style.borderRadius = '12px';
    msg.style.fontSize = '14px';
    msg.style.zIndex = '9999';
    msg.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 2500);
  }

  async function irParaFluxoParceiro(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (typeof ElarahAuth !== 'undefined' && ElarahAuth.ready) {
      try { await ElarahAuth.ready; } catch {}
    }

    const currentUser =
      (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.getCurrentUser === 'function')
        ? ElarahAuth.getCurrentUser()
        : null;

    if (!currentUser) {
      if (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.openModal === 'function') {
        localStorage.setItem('postLoginRedirect', 'conta.html?section=parceiro');
        ElarahAuth.openModal('login', 'Faça login para se tornar parceiro');
        return;
      }

      alert('Faça login para continuar.');
      return;
    }

    if (currentUser.partnerStatus === 'approved') {
      mostrarMensagemParceiro('Você já é parceiro da Elarah!');
      return;
    }

    window.location.href = 'conta.html?section=parceiro';
  }

  if (partnerHeroBtn) {
    partnerHeroBtn.addEventListener('click', irParaFluxoParceiro);
  }

  if (partnerCtaBtn) {
    partnerCtaBtn.addEventListener('click', irParaFluxoParceiro);
  }
});
