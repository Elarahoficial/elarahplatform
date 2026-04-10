document.addEventListener('DOMContentLoaded', () => {
  // ===== MOBILE MENU =====
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ===== HEADER SHADOW =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow =
        window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }

  // ===== STATUS PARCEIRO =====
  const partnerCta = document.getElementById('partnerCta');
  const hostStatusBox = document.getElementById('host-status-box');
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const resumoDados = document.getElementById('resumo-dados');

  let dados = null;

  try {
    const dadosSalvos = localStorage.getItem('hostRequest');
    if (dadosSalvos) {
      dados = JSON.parse(dadosSalvos);
    }
  } catch (error) {
    console.error('Erro ao ler hostRequest:', error);
  }

  const currentUser =
  (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.getCurrentUser === 'function')
    ? ElarahAuth.getCurrentUser()
    : null;

if (
  (dados && dados.status === 'approved') ||
  (currentUser && currentUser.partnerStatus === 'approved')
) {
    if (partnerCta) partnerCta.style.display = 'none';
    if (hostStatusBox) hostStatusBox.style.display = 'block';
   if (perfilNome) perfilNome.textContent = currentUser?.nome || '';
if (perfilEmail) perfilEmail.textContent = currentUser?.email || '';

const pd = currentUser?.partnerData || {};

if (resumoDados) {
  resumoDados.innerHTML =
    '<strong>WhatsApp:</strong> ' + (currentUser?.telefone || '-') + '<br>' +
    '<strong>Categoria:</strong> ' + (pd.tipo || '-') + '<br>' +
    '<strong>Descrição:</strong> ' + (pd.descricao || 'Não informada');
}
  } else {
    if (partnerCta) partnerCta.style.display = 'flex';
    if (hostStatusBox) hostStatusBox.style.display = 'none';
  }
function irParaFluxoParceiro() {
  const currentUser =
    (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.getCurrentUser === 'function')
      ? ElarahAuth.getCurrentUser()
      : null;

 if (!currentUser) {
  if (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.openModal === 'function') {
    ElarahAuth.openModal('login', 'Faça login para se tornar parceiro');
    return;
  }

  alert('Faça login para continuar.');
  return;
}
 if (currentUser.partnerStatus === 'approved') {
  mostrarMensagemParceiro('Você já é parceiro Elarah!');
  return;
}

  window.location.href = '/elarahplatform/conta.html?section=parceiro';
}
  function mostrarMensagemParceiro(texto) {
  const msg = document.createElement('div');
  msg.innerText = texto;

  msg.style.position = 'fixed';
  msg.style.bottom = '30px';
  msg.style.left = '50%';
  msg.style.transform = 'translateX(-50%)';
  msg.style.background = '#111';
  msg.style.color = '#fff';
  msg.style.padding = '16px 24px';
  msg.style.borderRadius = '12px';
  msg.style.fontSize = '14px';
  msg.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
  msg.style.zIndex = '9999';
  msg.style.opacity = '0';
  msg.style.transition = 'all 0.3s ease';

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.style.opacity = '1';
    msg.style.transform = 'translateX(-50%) translateY(-10px)';
  }, 10);

  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transform = 'translateX(-50%) translateY(10px)';
  }, 2500);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}
  const partnerHeroBtn = document.getElementById('partnerHeroBtn');
  const partnerCtaBtn = document.getElementById('partnerCtaBtn');
  
  if (partnerHeroBtn) {
  partnerHeroBtn.addEventListener('click', irParaFluxoParceiro);
}

if (partnerCtaBtn) {
  partnerCtaBtn.addEventListener('click', irParaFluxoParceiro);
}
});
