document.addEventListener('DOMContentLoaded', () => {
  // ===== Mobile menu toggle =====
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');

  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ===== Smooth scroll for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Header shadow on scroll =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 1px 8px rgba(0,0,0,0.06)'
        : 'none';
    });
  }

  // ===== ELEMENTOS DA SEÇÃO FINAL =====
  const partnerCta = document.getElementById('partnerCta');
  const hostStatusBox = document.getElementById('host-status-box');
  const perfilNome = document.getElementById('perfil-nome');
  const perfilEmail = document.getElementById('perfil-email');
  const resumoDados = document.getElementById('resumo-dados');

  // ===== DADOS SALVOS =====
  let dados = null;

  try {
    const dadosSalvos = localStorage.getItem('hostRequest');
    if (dadosSalvos) {
      dados = JSON.parse(dadosSalvos);
    }
  } catch (error) {
    console.error('Erro ao ler hostRequest do localStorage:', error);
  }

  // ===== REGRA DE EXIBIÇÃO =====
  // Sem cadastro -> mostra botão
  // Cadastro enviado, mas não aprovado -> mostra botão
  // Aprovado -> esconde botão e mostra box
  if (dados && dados.status === 'approved') {
    if (partnerCta) {
      partnerCta.style.display = 'none';
    }

    if (hostStatusBox) {
      hostStatusBox.style.display = 'block';
    }

    if (perfilNome) {
      perfilNome.textContent = dados.nome || '';
    }

    if (perfilEmail) {
      perfilEmail.textContent = dados.email || '';
    }

    if (resumoDados) {
      resumoDados.innerHTML =
        '<strong>WhatsApp:</strong> ' + (dados.whatsapp || '-') + '<br>' +
        '<strong>Categoria:</strong> ' + (dados.tipo || '-') + '<br>' +
        '<strong>Descrição:</strong> ' + (dados.descricao || 'Não informada');
    }
  } else {
    if (partnerCta) {
      partnerCta.style.display = 'flex';
    }

    if (hostStatusBox) {
      hostStatusBox.style.display = 'none';
    }
  }
});
