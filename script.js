document.addEventListener('DOMContentLoaded', () => {

  // ===== Explorar dropdown toggle =====
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');
      explorarBtn.querySelector('.header__nav-chevron').style.transform =
        explorarDropdown.classList.contains('open') ? 'rotate(180deg)' : '';
    });

    document.addEventListener('click', () => {
      explorarDropdown.classList.remove('open');
      explorarBtn.querySelector('.header__nav-chevron').style.transform = '';
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

  // ===== Favorite button toggle =====
  document.querySelectorAll('.card__favorite').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
    });
  });

  // ===== Category link selection =====
  document.querySelectorAll('.category-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.category-link').forEach((c) =>
        c.classList.remove('category-link--active')
      );
      link.classList.add('category-link--active');
    });
  });

  // ===== Smooth scroll for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Header background on scroll =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }
});
