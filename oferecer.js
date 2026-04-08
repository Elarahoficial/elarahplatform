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
   if (perfilNome) perfilNome.textContent = (dados?.nome || currentUser?.nome || '');
if (perfilEmail) perfilEmail.textContent = (dados?.email || currentUser?.email || '');
  
    if (resumoDados) {
      resumoDados.innerHTML =
        '<strong>WhatsApp:</strong> ' + (dados.whatsapp || '-') + '<br>' +
        '<strong>Categoria:</strong> ' + (dados.tipo || '-') + '<br>' +
        '<strong>Descrição:</strong> ' + (dados.descricao || 'Não informada');
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
     function irParaFluxoParceiro() {
  const currentUser =
    (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.getCurrentUser === 'function')
      ? ElarahAuth.getCurrentUser()
      : null;

  // NÃO LOGADO → continua igual
  if (!currentUser) {
    if (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.openModal === 'function') {
    localStorage.setItem('postLoginRedirect', '/elarahplatform/conta.html?section=parceiro');
      );
      ElarahAuth.openModal('login', 'Faça login para se tornar parceiro');
      return;
    }

    alert('Faça login para continuar.');
    return;
  }

  // SE JÁ FOR PARCEIRO
  if (currentUser.partnerStatus === 'approved') {
    alert('Você já é parceiro Elarah!');
    return;
  }

  if (currentUser.partnerStatus === 'pending') {
    alert('Sua solicitação de parceria já está em análise!');
    return;
  }

  // ✅ AQUI ESTÁ A CORREÇÃO PRINCIPAL
 window.location.href = '/elarahplatform/conta.html?section=parceiro';
}
}

  const partnerHeroBtn = document.getElementById('partnerHeroBtn');
  const partnerCtaBtn = document.getElementById('partnerCtaBtn');
  const headerLoginBtn = document.querySelector('.header__login-btn');

  if (partnerHeroBtn) {
    partnerHeroBtn.addEventListener('click', irParaFluxoParceiro);
  }

  if (partnerCtaBtn) {
    partnerCtaBtn.addEventListener('click', irParaFluxoParceiro);
  }

  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => {
      if (typeof ElarahAuth !== 'undefined' && typeof ElarahAuth.openModal === 'function') {
        ElarahAuth.openModal('login');
      }
    });
  }
});
