document.addEventListener('DOMContentLoaded', () => {

  // ===== FORM HOST → WHATSAPP =====
const form = document.getElementById('host-contact-form');

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // pegar valores
    var nome = document.getElementById('host-nome').value;
    var email = document.getElementById('host-email').value;
    var whatsapp = document.getElementById('host-whatsapp').value;
    var tipo = document.getElementById('host-tipo').value;
    var descricao = document.getElementById('host-descricao').value;

    // montar mensagem
    var mensagem =
      'Oi! Quero ser parceiro da Elarah!%0A%0A' +
      'Nome: ' + nome + '%0A' +
      'Email: ' + email + '%0A' +
      'WhatsApp: ' + whatsapp + '%0A' +
      'Tipo de experiência: ' + tipo + '%0A' +
      'Descrição: ' + (descricao || 'Não informada');

    // seu número
    var numeroElarah = '5511914455930'; // CONFERE ESSE

    var url = 'https://wa.me/' + numeroElarah + '?text=' + mensagem;
    var hostRequest = {
    nome: nome,
    email: email,
    whatsapp: whatsapp,
    tipo: tipo,
    descricao: descricao,
    status: 'Aprovado'
};

localStorage.setItem('hostRequest', JSON.stringify(hostRequest));
    window.open(url, '_blank');
  });
}
  
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
      header.style.boxShadow = window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }
    // ===== MOSTRAR DADOS SALVOS =====
  var dadosSalvos = localStorage.getItem('hostRequest');

  if (dadosSalvos) {
    var dados = JSON.parse(dadosSalvos);

    document.getElementById('host-status-box').style.display = 'block';

    document.getElementById('perfil-nome').textContent = dados.nome;
    document.getElementById('perfil-email').textContent = dados.email;

    document.getElementById('resumo-dados').innerHTML =
      '<strong>WhatsApp:</strong> ' + dados.whatsapp + '<br>' +
      '<strong>Tipo:</strong> ' + dados.tipo + '<br>' +
      '<strong>Descrição:</strong> ' + (dados.descricao || 'Não informada');

    document.getElementById('host-contact-form').style.display = 'none';
  }
});

