document.addEventListener('DOMContentLoaded', async () => {

  // Mesmo normalizador dos cards: NFKD + lowercase do basename pra
  // tolerar admin que cadastrou "PERFUMES.jpg" ou "velamaçadoamor.jpg".
  function normalizeImg(p) {
    let s = String(p == null ? '' : p).trim();
    if (!s) return '';
    if (/^(https?:\/\/|\/)/i.test(s)) return s;
    s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    const slash = s.lastIndexOf('/');
    const dir = slash >= 0 ? s.slice(0, slash + 1) : '';
    const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
    if (/^(assets|images|img)\//i.test(s)) {
      return dir.toLowerCase() + file;
    }
    return 'assets/' + file;
  }

  // ===== GIFT EXPERIENCES DATA (shared source) =====
  let giftExperiences = [];
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
      giftExperiences = await ElarahData.getVisibleExperiences();
    } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      giftExperiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah presentear] falha ao carregar experiências', e);
    giftExperiences = [];
  }

  // ===== DOM REFS =====
  const grid = document.getElementById('gift-grid');
  const filterBtns = document.querySelectorAll('.gift-filter-btn');
  const mobileToggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');
  const header = document.querySelector('.header');
  const searchInput = document.getElementById('search-input');
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  let activeFilter = '';

  // ===== RENDER CARDS =====
  function renderGiftCards() {
    if (!grid) return;

    const filtered = giftExperiences.filter((exp) => {
      return !activeFilter || exp.categoria === activeFilter;
    });

    grid.innerHTML = '';

    filtered.forEach((exp) => {
      const card = document.createElement('article');
      card.className = 'card';

      const horarios = Array.isArray(exp.horarios) && exp.horarios.length
        ? exp.horarios
        : (exp.horario ? [exp.horario] : []);
      const hasMultipleHorarios = horarios.length > 1;

      const horariosBlock = hasMultipleHorarios
        ? `<div class="card__horarios">${horarios.map((h, i) =>
            `<button type="button" class="card__horario-btn${i === 0 ? ' card__horario-btn--active' : ''}" data-horario="${h.replace(/"/g, '&quot;')}">${h}</button>`
          ).join('')}</div>`
        : '';

      const imgSrc = normalizeImg(exp.imagem);
      card.innerHTML = `
        <div class="card__image">
          <img src="${imgSrc}" alt="${exp.nome}" class="card__image-photo" onerror="this.style.display='none'">
          <button class="card__favorite" aria-label="Favoritar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <span class="card__badge">${exp.data}</span>
        </div>
        <div class="card__body">
          <span class="card__category">${exp.categoria}</span>
          <h3 class="card__title">${exp.nome}</h3>
          <div class="card__details">
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              ${exp.duracao}
            </p>
            ${horariosBlock}
            <p class="card__detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${exp.bairro}
            </p>
            <p class="card__detail card__detail--includes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
              ${exp.inclui}
            </p>
          </div>
          <div class="card__footer">
            <p class="card__price"><strong>${exp.preco}</strong></p>
            <button type="button" class="card__reserve-btn"
              data-reserve
              data-experience-id="${exp.id}"
              data-experience-nome="${(exp.nome || '').replace(/"/g, '&quot;')}"
              data-analytics="reserve_click"
              data-analytics-category="booking"
              data-analytics-label="${(exp.nome || '').replace(/"/g, '&quot;')}">
              Reservar
            </button>
          </div>
        </div>
      `;

      if (hasMultipleHorarios) {
        card.querySelectorAll('.card__horario-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.querySelectorAll('.card__horario-btn').forEach(b => b.classList.remove('card__horario-btn--active'));
            btn.classList.add('card__horario-btn--active');
          });
        });
      }

      grid.appendChild(card);
    });

    grid.querySelectorAll('.card__favorite').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof ElarahAuth === 'undefined') {
          alert('Não foi possível carregar a sua conta. Recarregue a página.');
          return;
        }
        if (!ElarahAuth.isLoggedIn()) {
          ElarahAuth.openModal('login', 'Faça login para favoritar');
          return;
        }
        const card = btn.closest('.card');
        const titleEl = card && card.querySelector('.card__title');
        const expId = (titleEl && titleEl.textContent.trim()) || '';
        const result = ElarahAuth.toggleFavorite(expId);
        if (result && result.success) {
          btn.classList.toggle('active');
        }
      });
    });
  }

  // ===== FILTER BUTTONS =====
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('gift-filter-btn--active'));
      btn.classList.add('gift-filter-btn--active');
      activeFilter = btn.dataset.filter;
      renderGiftCards();
    });
  });

  // ===== SEARCH =====
  function executarBuscaPresentear() {
    const valor = searchInput?.value.trim();
    if (!valor) return;
    window.location.href = '/?busca=' + encodeURIComponent(valor);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBuscaPresentear();
      }
    });
  }

  // ===== EXPLORAR DROPDOWN =====
  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');

      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) {
        chevron.style.transform = explorarDropdown.classList.contains('open')
          ? 'rotate(180deg)'
          : '';
      }
    });

    explorarDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', () => {
      explorarDropdown.classList.remove('open');
      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) chevron.style.transform = '';
    });

    explorarDropdown.querySelectorAll('.header__dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const text = item.textContent.trim();
        const destino = text === 'Todas'
          ? '/'
          : '/?categoria=' + encodeURIComponent(text);

        window.location.href = destino;
      });
    });
  }

  // ===== MOBILE MENU =====
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  // ===== SMOOTH SCROLL =====
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

  // ===== HEADER SHADOW =====
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 1px 8px rgba(0,0,0,0.06)'
        : 'none';
    });
  }

  // ===== INITIAL RENDER =====
  renderGiftCards();

  // =================================================
  // ===== GIFT CARD PURCHASE FLOW ===================
  // =================================================
  const CHECKOUT_FN_URL =
    'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/create-checkout-session';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aWp4am1lbmJmeWVodnNjb2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA1MjQsImV4cCI6MjA5MTQyNjUyNH0.HPLrWNczhDxXH3eBLZHhsmrc3Tviah0eUuO1BsULQ-c';

  function brl(centavos) {
    return 'R$ ' + (Number(centavos || 0) / 100).toFixed(2).replace('.', ',');
  }

  let giftModal = null;
  function buildGiftModal() {
    if (giftModal) return giftModal;
    giftModal = document.createElement('div');
    giftModal.id = 'elarah-giftcard-modal';
    giftModal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(20,12,4,.55);padding:20px;font-family:"DM Sans",sans-serif;';
    giftModal.innerHTML = ''
      + '<div style="background:#fff;border-radius:18px;max-width:480px;width:100%;padding:28px 28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.18);max-height:92vh;overflow-y:auto;">'
      +   '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;">'
      +     '<h3 style="font-family:\'DM Serif Display\',serif;font-size:1.45rem;color:#1a1a1a;margin:0;">Comprar gift card</h3>'
      +     '<button type="button" id="gcm-close" aria-label="Fechar" style="background:none;border:none;font-size:24px;line-height:1;color:#999;cursor:pointer;padding:0 4px;">&times;</button>'
      +   '</div>'
      +   '<form id="gcm-form">'
      +     '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Valor</label>'
      +     '<div id="gcm-values" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px;">'
      +       '<button type="button" class="gcm-val" data-val="10000">R$100</button>'
      +       '<button type="button" class="gcm-val" data-val="20000">R$200</button>'
      +       '<button type="button" class="gcm-val" data-val="30000">R$300</button>'
      +       '<button type="button" class="gcm-val" data-val="50000">R$500</button>'
      +     '</div>'
      +     '<input type="number" id="gcm-custom" min="50" step="1" placeholder="Outro valor (R$, mínimo 50)" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:14px;">'
      +     '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Seu nome</label>'
      +     '<input type="text" id="gcm-buyer-nome" placeholder="Como você quer assinar" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;">'
      +     '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Seu e-mail <span style="color:#a4663b;font-weight:600;">(recebe cópia do gift card)</span></label>'
      +     '<input type="email" id="gcm-buyer-email" placeholder="seu@email" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;">'
      +     '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Nome de quem vai receber</label>'
      +     '<input type="text" id="gcm-rec-nome" placeholder="Nome do presenteado" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;">'
      +     '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">E-mail de quem vai receber</label>'
      +     '<input type="email" id="gcm-rec-email" placeholder="presenteado@email" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;">'
      +     '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Mensagem (opcional)</label>'
      +     '<textarea id="gcm-msg" rows="3" placeholder="Uma mensagem carinhosa para acompanhar o presente" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;resize:vertical;margin-bottom:14px;font-family:inherit;"></textarea>'
      +     '<div style="background:#faf6f0;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      +       '<span style="color:#666;font-size:.9rem;">Total</span>'
      +       '<span id="gcm-total" style="color:#1a1a1a;font-weight:700;font-size:1.1rem;">R$ 0,00</span>'
      +     '</div>'
      +     '<button type="submit" id="gcm-submit" style="width:100%;padding:14px;border:none;border-radius:12px;background:#f0a05e;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">Pagar e enviar gift card</button>'
      +     '<p id="gcm-error" style="color:#c0392b;font-size:.85rem;margin:10px 0 0;min-height:1em;"></p>'
      +     '<p style="color:#888;font-size:.78rem;margin:12px 0 0;text-align:center;">O código será enviado por e-mail logo após a confirmação do pagamento.</p>'
      +   '</form>'
      + '</div>';

    // Estilo dos botões de valor
    const styleEl = document.createElement('style');
    styleEl.textContent =
      '#gcm-values .gcm-val{padding:11px 6px;border:1.5px solid #e5d8c5;background:#fff;border-radius:10px;font-weight:600;font-size:.9rem;cursor:pointer;color:#3a3a3a;}'
      + '#gcm-values .gcm-val.gcm-val--active{border-color:#f0a05e;background:#fff8ee;color:#a4663b;}';
    giftModal.appendChild(styleEl);

    document.body.appendChild(giftModal);

    giftModal.addEventListener('click', function (e) {
      if (e.target === giftModal) closeGiftModal();
    });
    giftModal.querySelector('#gcm-close').addEventListener('click', closeGiftModal);

    // Estado do valor selecionado
    let selectedCentavos = 0;
    const totalEl = giftModal.querySelector('#gcm-total');
    const customEl = giftModal.querySelector('#gcm-custom');

    function updateTotal() {
      totalEl.textContent = brl(selectedCentavos);
    }

    giftModal.querySelectorAll('.gcm-val').forEach(function (btn) {
      btn.addEventListener('click', function () {
        giftModal.querySelectorAll('.gcm-val').forEach(b => b.classList.remove('gcm-val--active'));
        btn.classList.add('gcm-val--active');
        selectedCentavos = Number(btn.getAttribute('data-val')) || 0;
        customEl.value = '';
        updateTotal();
      });
    });

    customEl.addEventListener('input', function () {
      const v = Number(customEl.value);
      giftModal.querySelectorAll('.gcm-val').forEach(b => b.classList.remove('gcm-val--active'));
      selectedCentavos = isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
      updateTotal();
    });

    giftModal.querySelector('#gcm-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const errEl = giftModal.querySelector('#gcm-error');
      const submitBtn = giftModal.querySelector('#gcm-submit');
      errEl.textContent = '';

      const buyerEmail = (giftModal.querySelector('#gcm-buyer-email').value || '').trim();
      const buyerNome  = (giftModal.querySelector('#gcm-buyer-nome').value || '').trim();
      const recEmail   = (giftModal.querySelector('#gcm-rec-email').value || '').trim();
      const recNome    = (giftModal.querySelector('#gcm-rec-nome').value || '').trim();
      const mensagem   = (giftModal.querySelector('#gcm-msg').value || '').trim();

      if (selectedCentavos < 5000) {
        errEl.textContent = 'O valor mínimo do gift card é R$ 50.';
        return;
      }
      if (selectedCentavos > 500000) {
        errEl.textContent = 'O valor máximo é R$ 5.000. Para valores maiores, fale com a gente.';
        return;
      }
      if (!recEmail || !/.+@.+\..+/.test(recEmail)) {
        errEl.textContent = 'Informe um e-mail válido para o presenteado.';
        return;
      }
      if (!buyerEmail || !/.+@.+\..+/.test(buyerEmail)) {
        errEl.textContent = 'Informe seu e-mail — é nele que você recebe a cópia do gift card.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Abrindo pagamento...';

      try {
        // Auth opcional — comprar gift card não exige login.
        // Sempre usa anon key (JWT válido, nunca expira) para as
        // Edge Functions — elas usam service role internamente.
        let prefilledEmail = buyerEmail;
        if (!prefilledEmail && window.supabaseClient && window.supabaseClient.auth) {
          try {
            const { data } = await window.supabaseClient.auth.getSession();
            const session = data && data.session;
            if (session && session.user) {
              prefilledEmail = session.user.email || prefilledEmail;
            }
          } catch {}
        }

        const res = await fetch(CHECKOUT_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            mode: 'gift_card',
            gift_card_value_centavos: selectedCentavos,
            buyer_email: prefilledEmail,
            buyer_nome: buyerNome,
            recipient_email: recEmail,
            recipient_nome: recNome,
            mensagem: mensagem,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.url) {
          errEl.textContent = (data && (data.message || data.error)) || 'Não foi possível abrir o pagamento.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Pagar e enviar gift card';
          return;
        }
        window.location.href = data.url;
      } catch (err) {
        console.error('[Elarah gift] purchase error', err);
        errEl.textContent = 'Erro ao iniciar o pagamento. Tente novamente.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Pagar e enviar gift card';
      }
    });

    return giftModal;
  }

  function openGiftModal() {
    const m = buildGiftModal();
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeGiftModal() {
    if (!giftModal) return;
    giftModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-giftcard-form]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openGiftModal();
    });
  });
});
