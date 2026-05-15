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

  // Fallback por categoria (espelho de script.js / categoria.js).
  const CATEGORY_DEFAULT_IMG = {
    'sabonete':    'assets/sabonete.jpg',
    'perfumaria':  'assets/perfumaria.jpg',
    'ceramica':    'assets/ceramica-fria.jpg',
    'tufting':     'assets/tufting1.jpg',
    'pintura':     'assets/pinturataca.jpg',
    'vela':        'assets/velaaromatica.jpg',
    'gastronomia': 'assets/cookies.jpg',
    'macrame':     'assets/macrameee.jpg',
    'floral':      'assets/florseca.jpg',
    'bartenderia': 'assets/drinks.jpg',
  };
  function defaultImgForCategory(cat) {
    if (!cat) return '';
    const key = String(cat).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    return CATEGORY_DEFAULT_IMG[key] || '';
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

      const horariosRaw = Array.isArray(exp.horarios) && exp.horarios.length
        ? exp.horarios
        : (exp.horario ? [exp.horario] : []);
      // Dedup textual — recorrência popula horarios com 1 entrada por slot.
      const seenH = new Set();
      const horarios = [];
      horariosRaw.forEach(function (h) {
        const k = String(h || '').trim();
        if (!k || seenH.has(k)) return;
        seenH.add(k);
        horarios.push(h);
      });
      const hasMultipleHorarios = horarios.length > 1;

      const horariosBlock = hasMultipleHorarios
        ? `<div class="card__horarios">${horarios.map((h, i) =>
            `<button type="button" class="card__horario-btn${i === 0 ? ' card__horario-btn--active' : ''}" data-horario="${h.replace(/"/g, '&quot;')}">${h}</button>`
          ).join('')}</div>`
        : '';

      const primaryImg = normalizeImg(exp.imagem);
      const catFallback = defaultImgForCategory(exp.categoria);
      const imgSrc = primaryImg || catFallback;
      const onErr =
        "if(this.dataset.fbStep==='final')return;" +
        "if(!this.dataset.fbStep&&this.dataset.catFb&&this.src.indexOf(this.dataset.catFb)===-1){" +
          "this.dataset.fbStep='cat';this.src=this.dataset.catFb;return;" +
        "}" +
        "this.dataset.fbStep='final';this.style.display='none';";
      card.innerHTML = `
        <div class="card__image">
          <img src="${imgSrc}" alt="${exp.nome}" class="card__image-photo" data-cat-fb="${catFallback}" onerror="${onErr}">
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
            <p class="card__price"><strong>${(window.ElarahData && ElarahData.formatPrecoBR ? ElarahData.formatPrecoBR(exp.preco) : exp.preco)}</strong></p>
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
  // Mesmo comportamento de script.js#initMobileHeader: fecha ao
  // clicar fora, em link interno, ao rolar ou apertar ESC.
  // Idempotente — flag elarahHeaderInit evita atachar 2x se o
  // helper global existir.
  if (mobileToggle && nav && mobileToggle.dataset.elarahHeaderInit !== '1') {
    mobileToggle.dataset.elarahHeaderInit = '1';

    const closeMenu = () => nav.classList.remove('mobile-open');

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      nav.classList.toggle('mobile-open');
    });

    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('mobile-open')) return;
      if (nav.contains(e.target) || mobileToggle.contains(e.target)) return;
      closeMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('scroll', () => {
      if (nav.classList.contains('mobile-open')) closeMenu();
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
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

  // =================================================================
  // ===== GIFT CARD PURCHASE FLOW (rewritten 2026-05-09) ==========
  // -----------------------------------------------------------------
  // Refatoração completa pra alinhar com o padrão do checkout de
  // experiência (script.js), que está estável em produção. Pontos
  // chave dessa reescrita:
  //
  //   1. Estrutura: 2 sections claramente separadas — `gcm-form-section`
  //      (formulário) e `gcm-pix-section` (QR + código + status).
  //      showPixPanel() troca a visibilidade só dessas duas — sem
  //      um terceiro painel "success" inline pra contaminar estado.
  //   2. Sucesso = redirect: quando o pagamento confirma, a página
  //      redireciona pra /success.html?gift=1 (mesma página que o
  //      fluxo de cartão Stripe usa). Sem painel intermediário.
  //   3. Polling: setInterval gerenciado em pixPollingHandle; cleanup
  //      garantido em closeGiftModal e showPixPanel (sempre stop antes
  //      de start). Timeout de 10min mostra mensagem clara.
  //   4. Reset: closeGiftModal força form-section visível e pix-section
  //      hidden — próxima abertura sempre começa no estado correto.
  //   5. Sem ifs defensivos espalhados: validação acontece em UM lugar
  //      (submit handler) com mensagens específicas por tipo de erro.
  //      showPixPanel só é chamado depois que validamos o payload.
  // =================================================================

  const CHECKOUT_FN_URL =
    'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/create-checkout-session';
  const MP_PIX_FN_URL =
    'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/create-mp-pix-payment';
  const MP_CHECK_STATUS_FN_URL =
    'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/check-mp-payment-status';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aWp4am1lbmJmeWVodnNjb2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA1MjQsImV4cCI6MjA5MTQyNjUyNH0.HPLrWNczhDxXH3eBLZHhsmrc3Tviah0eUuO1BsULQ-c';

  function brl(centavos) {
    const v = Number(centavos);
    if (!isFinite(v) || v <= 0) return 'R$ 0,00';
    return 'R$ ' + (v / 100).toFixed(2).replace('.', ',');
  }

  // Validador CPF (algoritmo dos dígitos verificadores). Mesmo do
  // checkout de experiência (script.js#isValidCpfFront). Replicado
  // pra não acoplar presentear.js a script.js (páginas distintas).
  function isValidCpfDigits(raw) {
    const d = String(raw || '').replace(/\D+/g, '');
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
    let v1 = (sum * 10) % 11;
    if (v1 === 10) v1 = 0;
    if (v1 !== parseInt(d[9], 10)) return false;
    sum = 0;
    for (let j = 0; j < 10; j++) sum += parseInt(d[j], 10) * (11 - j);
    let v2 = (sum * 10) % 11;
    if (v2 === 10) v2 = 0;
    return v2 === parseInt(d[10], 10);
  }

  // ===== PIX polling state =====
  // Centralizado fora da modal pra cleanup robusto. Mesma estratégia
  // do script.js (pixPollingHandle global no closure).
  let pixPollingHandle = null;
  let pixPollingStartedAt = 0;
  const PIX_POLLING_INTERVAL_MS = 3000;       // 3s, igual experiência
  const PIX_POLLING_TIMEOUT_MS = 10 * 60 * 1000;

  function stopPixPolling() {
    if (pixPollingHandle) {
      clearInterval(pixPollingHandle);
      pixPollingHandle = null;
      console.log('[Elarah gift PIX] polling parado');
    }
  }

  // ===== Modal singleton =====
  let giftModal = null;
  let pixGiftCardId = null;        // id atual do gift card pending
  let selectedCentavos = 0;
  let paymentMethod = 'card';      // 'card' | 'pix'

  function buildGiftModal() {
    if (giftModal) return giftModal;

    giftModal = document.createElement('div');
    giftModal.id = 'elarah-giftcard-modal';
    giftModal.style.cssText =
      'position:fixed;inset:0;z-index:9999;display:none;align-items:center;' +
      'justify-content:center;background:rgba(20,12,4,.55);padding:20px;' +
      'font-family:"DM Sans",sans-serif;';

    // Estrutura: header + form-section + pix-section. Mesma divisão
    // do modal de experiência. SEM success-panel inline — sucesso
    // redireciona pra /success.html?gift=1.
    giftModal.innerHTML =
      '<div style="background:#fff;border-radius:18px;max-width:480px;width:100%;' +
        'padding:28px 28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.18);max-height:92vh;overflow-y:auto;">' +

        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;">' +
          '<h3 style="font-family:\'DM Serif Display\',serif;font-size:1.45rem;color:#1a1a1a;margin:0;">Comprar gift card</h3>' +
          '<button type="button" id="gcm-close" aria-label="Fechar" style="background:none;border:none;font-size:24px;line-height:1;color:#999;cursor:pointer;padding:0 4px;">&times;</button>' +
        '</div>' +

        // ===== FORM SECTION =====
        '<div id="gcm-form-section">' +
          '<form id="gcm-form" novalidate>' +
            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Valor</label>' +
            '<div id="gcm-values" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px;">' +
              '<button type="button" class="gcm-val" data-val="10000">R$100</button>' +
              '<button type="button" class="gcm-val" data-val="20000">R$200</button>' +
              '<button type="button" class="gcm-val" data-val="30000">R$300</button>' +
              '<button type="button" class="gcm-val" data-val="50000">R$500</button>' +
            '</div>' +
            '<input type="number" id="gcm-custom" min="50" step="1" placeholder="Outro valor (R$, mínimo 50)" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:14px;box-sizing:border-box;">' +

            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Seu nome</label>' +
            '<input type="text" id="gcm-buyer-nome" placeholder="Como você quer assinar" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;box-sizing:border-box;">' +

            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Seu e-mail <span style="color:#a4663b;font-weight:600;">(recebe cópia)</span></label>' +
            '<input type="email" id="gcm-buyer-email" placeholder="seu@email" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;box-sizing:border-box;">' +

            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Nome de quem vai receber</label>' +
            '<input type="text" id="gcm-rec-nome" placeholder="Nome do presenteado" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;box-sizing:border-box;">' +

            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">E-mail de quem vai receber</label>' +
            '<input type="email" id="gcm-rec-email" placeholder="presenteado@email" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;margin-bottom:10px;box-sizing:border-box;">' +

            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">Mensagem (opcional)</label>' +
            '<textarea id="gcm-msg" rows="3" placeholder="Uma mensagem carinhosa para acompanhar o presente" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;resize:vertical;margin-bottom:14px;font-family:inherit;box-sizing:border-box;"></textarea>' +

            '<label style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;font-weight:600;">Forma de pagamento</label>' +
            '<div id="gcm-pm-group" style="display:flex;gap:8px;margin-bottom:10px;">' +
              '<button type="button" class="gcm-pm-btn" data-pm="card">Cartão</button>' +
              '<button type="button" class="gcm-pm-btn" data-pm="pix">PIX</button>' +
            '</div>' +

            '<div id="gcm-cpf-wrap" style="display:none;margin-bottom:10px;">' +
              '<label for="gcm-cpf" style="display:block;font-size:.85rem;color:#333;margin:8px 0 6px;">CPF <span style="color:#c0392b;">*</span></label>' +
              '<input type="text" id="gcm-cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;box-sizing:border-box;">' +
              '<p style="margin:6px 0 0;font-size:.78rem;color:#888;">Exigido pelo Mercado Pago pra gerar o PIX.</p>' +
            '</div>' +

            '<div style="background:#faf6f0;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
              '<span style="color:#666;font-size:.9rem;">Total</span>' +
              '<span id="gcm-total" style="color:#1a1a1a;font-weight:700;font-size:1.1rem;">R$ 0,00</span>' +
            '</div>' +

            '<button type="submit" id="gcm-submit" style="width:100%;padding:14px;border:none;border-radius:12px;background:#f0a05e;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">Pagar e enviar gift card</button>' +
            '<p id="gcm-error" style="color:#c0392b;font-size:.85rem;margin:10px 0 0;min-height:1em;"></p>' +
            '<p style="color:#888;font-size:.78rem;margin:12px 0 0;text-align:center;">O código será enviado por e-mail logo após a confirmação do pagamento.</p>' +
          '</form>' +
        '</div>' +

        // ===== PIX SECTION (escondida até showPixPanel) =====
        '<div id="gcm-pix-section" style="display:none;">' +
          '<p style="margin:0 0 4px;color:#1a1a1a;font-size:1rem;font-weight:600;">Pague com PIX pra liberar o gift card</p>' +
          '<p id="gcm-pix-meta" style="margin:0 0 4px;color:#666;font-size:.85rem;"></p>' +
          '<p id="gcm-pix-expires" style="margin:0 0 14px;color:#666;font-size:.85rem;">Validade: 30 minutos</p>' +
          '<div style="background:#faf6f0;border-radius:12px;padding:16px;margin-bottom:14px;text-align:center;">' +
            '<img id="gcm-pix-qr" alt="QR Code PIX" style="max-width:220px;width:100%;height:auto;margin:0 auto 10px;display:block;background:#fff;border-radius:8px;padding:8px;">' +
            '<p style="margin:0;font-size:.82rem;color:#666;">Escaneie com o app do seu banco</p>' +
          '</div>' +
          '<label style="display:block;font-size:.78rem;color:#666;margin-bottom:6px;">Ou copie e cole o código:</label>' +
          '<div style="display:flex;gap:6px;margin-bottom:14px;">' +
            '<input type="text" id="gcm-pix-code" readonly style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.78rem;font-family:Menlo,Consolas,monospace;background:#fafafa;color:#666;box-sizing:border-box;">' +
            '<button type="button" id="gcm-pix-copy" style="padding:10px 14px;border:1px solid #f0a05e;background:#fff;color:#f0a05e;border-radius:10px;font-weight:600;font-size:.85rem;cursor:pointer;white-space:nowrap;">Copiar</button>' +
          '</div>' +
          '<div id="gcm-pix-status" style="padding:12px 14px;border-radius:10px;background:#fff8ef;border:1px solid #f4c48a;color:#8a5a1a;font-size:.88rem;text-align:center;margin-bottom:10px;">' +
            '<span id="gcm-pix-status-text">⏳ Aguardando confirmação do pagamento...</span>' +
          '</div>' +
          '<button type="button" id="gcm-pix-cancel" style="width:100%;padding:11px;border:1px solid #ddd;background:#fff;color:#666;border-radius:10px;font-weight:600;font-size:.88rem;cursor:pointer;">Cancelar</button>' +
        '</div>' +
      '</div>';

    // CSS dos botões (pill states). Único styleEl, appended ao
    // INNER div pra não criar flex item órfão.
    const styleEl = document.createElement('style');
    styleEl.textContent =
      '#gcm-values .gcm-val{padding:11px 6px;border:1.5px solid #e5d8c5;background:#fff;border-radius:10px;font-weight:600;font-size:.9rem;cursor:pointer;color:#3a3a3a;}' +
      '#gcm-values .gcm-val.gcm-val--active{border-color:#f0a05e;background:#fff8ee;color:#a4663b;}' +
      '#gcm-pm-group .gcm-pm-btn{flex:1;padding:11px 10px;border:1px solid #ddd;background:#fff;color:#666;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;transition:all .15s;}' +
      '#gcm-pm-group .gcm-pm-btn[data-active="1"]{border-color:#f0a05e;background:#fff8ef;color:#1a1a1a;}';
    giftModal.firstElementChild.appendChild(styleEl);

    document.body.appendChild(giftModal);

    // ===== Bindings (uma vez por modal) =====
    const formEl   = giftModal.querySelector('#gcm-form');
    const totalEl  = giftModal.querySelector('#gcm-total');
    const customEl = giftModal.querySelector('#gcm-custom');
    const cpfWrap  = giftModal.querySelector('#gcm-cpf-wrap');
    const cpfInput = giftModal.querySelector('#gcm-cpf');
    const errEl    = giftModal.querySelector('#gcm-error');

    function updateTotal() {
      totalEl.textContent = brl(selectedCentavos);
    }

    // Botões de valor pre-definidos
    giftModal.querySelectorAll('.gcm-val').forEach(function (btn) {
      btn.addEventListener('click', function () {
        giftModal.querySelectorAll('.gcm-val').forEach(b => b.classList.remove('gcm-val--active'));
        btn.classList.add('gcm-val--active');
        selectedCentavos = Number(btn.getAttribute('data-val')) || 0;
        customEl.value = '';
        updateTotal();
      });
    });

    // Valor custom
    customEl.addEventListener('input', function () {
      const v = Number(customEl.value);
      giftModal.querySelectorAll('.gcm-val').forEach(b => b.classList.remove('gcm-val--active'));
      selectedCentavos = isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
      updateTotal();
    });

    // Toggle Cartão / PIX
    function updatePaymentMethodUI() {
      giftModal.querySelectorAll('.gcm-pm-btn').forEach(function (b) {
        if (b.dataset.pm === paymentMethod) b.dataset.active = '1';
        else delete b.dataset.active;
      });
      cpfWrap.style.display = paymentMethod === 'pix' ? 'block' : 'none';
    }
    giftModal.querySelectorAll('.gcm-pm-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        paymentMethod = btn.dataset.pm || 'card';
        updatePaymentMethodUI();
      });
    });

    // Máscara de CPF (visual)
    cpfInput.addEventListener('input', function () {
      const d = (cpfInput.value || '').replace(/\D+/g, '').slice(0, 11);
      if (d.length <= 3) cpfInput.value = d;
      else if (d.length <= 6) cpfInput.value = d.slice(0, 3) + '.' + d.slice(3);
      else if (d.length <= 9) cpfInput.value = d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
      else cpfInput.value = d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    });

    // Fechar
    giftModal.addEventListener('click', function (e) {
      if (e.target === giftModal) closeGiftModal();
    });
    giftModal.querySelector('#gcm-close').addEventListener('click', closeGiftModal);

    // Cancelar PIX
    giftModal.querySelector('#gcm-pix-cancel').addEventListener('click', function () {
      closeGiftModal();
    });

    // Copiar código PIX
    giftModal.querySelector('#gcm-pix-copy').addEventListener('click', function () {
      const codeInput = giftModal.querySelector('#gcm-pix-code');
      const copyBtn = giftModal.querySelector('#gcm-pix-copy');
      codeInput.select();
      const done = function () {
        copyBtn.textContent = 'Copiado!';
        setTimeout(function () { copyBtn.textContent = 'Copiar'; }, 1500);
      };
      try {
        navigator.clipboard.writeText(codeInput.value).then(done, function () {
          if (document.execCommand) document.execCommand('copy');
          done();
        });
      } catch (e) {
        if (document.execCommand) document.execCommand('copy');
        done();
      }
    });

    // ===== Submit =====
    formEl.addEventListener('submit', async function (e) {
      e.preventDefault();
      handleSubmit();
    });

    return giftModal;
  }

  // ===== Open / Close =====
  // Reset COMPLETO do estado ao abrir (não confia em estado prévio).
  function openGiftModal() {
    const m = buildGiftModal();

    // 1. Para qualquer polling que esteja rodando (paranóia)
    stopPixPolling();
    pixGiftCardId = null;

    // 2. Reset visual: form-section visível, pix-section hidden
    const formSection = m.querySelector('#gcm-form-section');
    const pixSection  = m.querySelector('#gcm-pix-section');
    if (formSection) formSection.style.display = 'block';
    if (pixSection)  pixSection.style.display  = 'none';

    // 3. Limpa error text
    const errEl = m.querySelector('#gcm-error');
    if (errEl) errEl.textContent = '';

    // 4. Limpa QR e código (zero ghosts visuais)
    const qrImg = m.querySelector('#gcm-pix-qr');
    const codeInput = m.querySelector('#gcm-pix-code');
    if (qrImg) qrImg.removeAttribute('src');
    if (codeInput) codeInput.value = '';

    // 5. Reset estado JS — paymentMethod default = card (igual fluxo
    // antigo). Valor zerado, botões pill desativados.
    paymentMethod = 'card';
    selectedCentavos = 0;
    m.querySelectorAll('.gcm-val').forEach(b => b.classList.remove('gcm-val--active'));
    m.querySelectorAll('.gcm-pm-btn').forEach(function (b) {
      if (b.dataset.pm === 'card') b.dataset.active = '1';
      else delete b.dataset.active;
    });
    const cpfWrap = m.querySelector('#gcm-cpf-wrap');
    if (cpfWrap) cpfWrap.style.display = 'none';
    const totalEl = m.querySelector('#gcm-total');
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    const submitBtn = m.querySelector('#gcm-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Pagar e enviar gift card';
    }

    // 6. Abre
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeGiftModal() {
    if (!giftModal) return;
    stopPixPolling();
    giftModal.style.display = 'none';
    document.body.style.overflow = '';
    // Reset pra próxima abertura — mesmo padrão do experience modal.
    const formSection = giftModal.querySelector('#gcm-form-section');
    const pixSection  = giftModal.querySelector('#gcm-pix-section');
    if (formSection) formSection.style.display = 'block';
    if (pixSection)  pixSection.style.display  = 'none';
  }

  // ===== Submit handler =====
  // Validação ÚNICA (form), branchea por paymentMethod, faz a chamada
  // adequada e — só se a resposta for válida — chama showPixPanel ou
  // redireciona pra Stripe.
  async function handleSubmit() {
    const errEl     = giftModal.querySelector('#gcm-error');
    const submitBtn = giftModal.querySelector('#gcm-submit');
    errEl.textContent = '';

    const buyerEmail = (giftModal.querySelector('#gcm-buyer-email').value || '').trim();
    const buyerNome  = (giftModal.querySelector('#gcm-buyer-nome').value || '').trim();
    const recEmail   = (giftModal.querySelector('#gcm-rec-email').value || '').trim();
    const recNome    = (giftModal.querySelector('#gcm-rec-nome').value || '').trim();
    const mensagem   = (giftModal.querySelector('#gcm-msg').value || '').trim();
    const cpfDigits  = (giftModal.querySelector('#gcm-cpf').value || '').replace(/\D+/g, '');

    // Validações comuns
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
    if (paymentMethod === 'pix' && !isValidCpfDigits(cpfDigits)) {
      errEl.textContent = 'CPF inválido. PIX via Mercado Pago exige CPF válido.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = paymentMethod === 'pix' ? 'Gerando PIX...' : 'Abrindo pagamento...';

    try {
      if (paymentMethod === 'pix') {
        await submitPix({ buyerEmail, buyerNome, recEmail, recNome, mensagem, cpfDigits });
      } else {
        await submitCard({ buyerEmail, buyerNome, recEmail, recNome, mensagem });
      }
    } catch (err) {
      console.error('[Elarah gift] submit error', err);
      errEl.textContent = 'Erro ao iniciar o pagamento. Tente novamente.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Pagar e enviar gift card';
    }
  }

  // ===== Branch: Cartão (Stripe Checkout) =====
  // Idêntico ao fluxo antigo — redirect pra Stripe. Não toca em
  // showPixPanel nem em polling. Mantém compat 100%.
  async function submitCard(d) {
    const errEl = giftModal.querySelector('#gcm-error');
    const submitBtn = giftModal.querySelector('#gcm-submit');
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
        buyer_email: d.buyerEmail,
        buyer_nome: d.buyerNome,
        recipient_email: d.recEmail,
        recipient_nome: d.recNome,
        mensagem: d.mensagem,
      }),
    });
    const data = await res.json().catch(() => null);
    console.log('[Elarah gift CARD] response status=' + res.status, data);
    if (!res.ok || !data || !data.url) {
      errEl.textContent = (data && (data.message || data.error)) || 'Não foi possível abrir o pagamento.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Pagar e enviar gift card';
      return;
    }
    window.location.href = data.url;
  }

  // ===== Branch: PIX (Mercado Pago) =====
  // Chama create-mp-pix-payment com mode=gift_card. Valida resposta
  // (qr_code_base64 + gift_card_id obrigatórios). Só se válido,
  // chama showPixPanel — que é puro render, sem mais validações.
  async function submitPix(d) {
    const errEl = giftModal.querySelector('#gcm-error');
    const submitBtn = giftModal.querySelector('#gcm-submit');
    const res = await fetch(MP_PIX_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        mode: 'gift_card',
        gift_card_value_centavos: selectedCentavos,
        buyer_email: d.buyerEmail,
        buyer_nome: d.buyerNome,
        recipient_email: d.recEmail,
        recipient_nome: d.recNome,
        mensagem: d.mensagem,
        cpf: d.cpfDigits,
      }),
    });
    const data = await res.json().catch(() => null);
    console.log('[Elarah gift PIX] response status=' + res.status, {
      ok: res.ok,
      keys: data ? Object.keys(data) : null,
      qr_code_base64_len: data && typeof data.qr_code_base64 === 'string' ? data.qr_code_base64.length : null,
      qr_code_present: !!(data && data.qr_code),
      gift_card_id_present: !!(data && data.gift_card_id),
      error: data && data.error,
    });

    const qrB64 = data && typeof data.qr_code_base64 === 'string'
      ? data.qr_code_base64.trim() : '';
    const qrCode = data && typeof data.qr_code === 'string'
      ? data.qr_code.trim() : '';
    const gcId = data && typeof data.gift_card_id === 'string'
      ? data.gift_card_id.trim() : '';

    if (!res.ok || !data || !qrB64 || !gcId) {
      let msg = (data && (data.message || data.error)) || 'Não foi possível gerar o PIX.';
      if (data && data.error === 'cpf_required') {
        msg = 'CPF inválido. Confirme o número e tente de novo.';
      } else if (data && data.error === 'mp_create_failed') {
        msg = 'Mercado Pago não conseguiu gerar o PIX agora. Tente de novo ou pague no cartão.';
      } else if (data && data.error === 'mp_qr_missing') {
        msg = 'Mercado Pago respondeu sem QR code. Tente de novo ou pague no cartão.';
      } else if (res.ok && (!qrB64 || !gcId)) {
        msg = 'Resposta inválida do servidor. Tente de novo ou pague no cartão.';
      }
      errEl.textContent = msg;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Pagar e enviar gift card';
      return;
    }

    // Resposta válida — agora sim, mostra o painel.
    showPixPanel({
      gift_card_id: gcId,
      qr_code_base64: qrB64,
      qr_code: qrCode,
      expires_at: data.expires_at || null,
      amount_total_centavos: data.amount_total_centavos || selectedCentavos,
    });
  }

  // ===== showPixPanel: form-section → pix-section =====
  // Função PURA de render. Não valida (a validação acontece em submitPix
  // antes de chamar). Não chama outros panels. Só troca display e
  // popula campos. Equivalente ao showPixPanel do script.js.
  function showPixPanel(resp) {
    const formSection = giftModal.querySelector('#gcm-form-section');
    const pixSection  = giftModal.querySelector('#gcm-pix-section');
    formSection.style.display = 'none';
    pixSection.style.display = 'block';

    pixGiftCardId = resp.gift_card_id;

    const qrImg     = giftModal.querySelector('#gcm-pix-qr');
    const codeInput = giftModal.querySelector('#gcm-pix-code');
    const metaEl    = giftModal.querySelector('#gcm-pix-meta');
    const expEl     = giftModal.querySelector('#gcm-pix-expires');
    const statusBox = giftModal.querySelector('#gcm-pix-status');
    const statusTxt = giftModal.querySelector('#gcm-pix-status-text');

    qrImg.src = 'data:image/png;base64,' + resp.qr_code_base64;
    codeInput.value = resp.qr_code;
    metaEl.textContent = 'Gift card de ' + brl(resp.amount_total_centavos);

    // Contador de expiração
    const expiresMs = resp.expires_at ? new Date(resp.expires_at).getTime() : NaN;
    const finalExpires = isFinite(expiresMs) && expiresMs > Date.now()
      ? expiresMs
      : (Date.now() + 30 * 60 * 1000);

    function tickExpiry() {
      const ms = finalExpires - Date.now();
      if (!isFinite(ms) || ms <= 0) {
        expEl.textContent = '⚠ QR code expirado. Cancele e gere um novo.';
        expEl.style.color = '#c0392b';
        return false;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      expEl.textContent = 'Expira em ' + m + ':' + (s < 10 ? '0' : '') + s;
      expEl.style.color = '#666';
      return true;
    }
    tickExpiry();
    // O timer de expiração compartilha vida útil com o polling — quando
    // stopPixPolling roda, o setInterval daqui é cleared junto via
    // closure (vamos guardar o handle no array de timers globais).
    const expiryTimer = setInterval(function () {
      if (!tickExpiry()) clearInterval(expiryTimer);
    }, 1000);

    // Status + polling
    statusBox.style.background = '#fff8ef';
    statusBox.style.borderColor = '#f4c48a';
    statusBox.style.color = '#8a5a1a';
    statusTxt.textContent = '⏳ Aguardando confirmação do pagamento...';

    startPixPolling(resp.gift_card_id, expiryTimer);
  }

  // ===== Polling do gift card =====
  // Usa check-mp-payment-status (que aceita gift_card_id). Quando
  // status='active', redireciona pra /success.html?gift=1 — mesmo
  // destino do fluxo de cartão. Sem painel intermediário no modal.
  function startPixPolling(giftCardId, expiryTimer) {
    stopPixPolling();
    pixPollingStartedAt = Date.now();
    console.log('[Elarah gift PIX] polling iniciado pra gift_card', giftCardId);

    const tick = async function () {
      const elapsed = Date.now() - pixPollingStartedAt;
      if (elapsed > PIX_POLLING_TIMEOUT_MS) {
        stopPixPolling();
        if (expiryTimer) clearInterval(expiryTimer);
        const statusBox = giftModal && giftModal.querySelector('#gcm-pix-status');
        const statusTxt = giftModal && giftModal.querySelector('#gcm-pix-status-text');
        if (statusBox) {
          statusBox.style.background = '#fdecea';
          statusBox.style.borderColor = '#f5b4ae';
          statusBox.style.color = '#9c2f22';
        }
        if (statusTxt) statusTxt.textContent = 'Tempo esgotado. Se você já pagou, recarregue a página em alguns minutos.';
        return;
      }

      try {
        const r = await fetch(MP_CHECK_STATUS_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ gift_card_id: giftCardId }),
        });
        const data = await r.json().catch(() => null);
        if (!data) return;

        if (data.gift_card_status === 'active') {
          stopPixPolling();
          if (expiryTimer) clearInterval(expiryTimer);
          console.log('[Elarah gift PIX] pagamento confirmado! redirect pra success');
          window.location.href = '/success.html?gift=1&pix=1&gift_card_id=' + encodeURIComponent(giftCardId);
        } else if (data.gift_card_status === 'cancelled') {
          stopPixPolling();
          if (expiryTimer) clearInterval(expiryTimer);
          const statusBox = giftModal && giftModal.querySelector('#gcm-pix-status');
          const statusTxt = giftModal && giftModal.querySelector('#gcm-pix-status-text');
          if (statusBox) {
            statusBox.style.background = '#fdecea';
            statusBox.style.borderColor = '#f5b4ae';
            statusBox.style.color = '#9c2f22';
          }
          if (statusTxt) statusTxt.textContent = '✗ Pagamento recusado ou cancelado. Tente novamente.';
        }
        // Outros status (pending, in_process) → continua polling
      } catch (e) {
        console.warn('[Elarah gift PIX] polling tick falhou (próximo retry):', e);
      }
    };

    pixPollingHandle = setInterval(tick, PIX_POLLING_INTERVAL_MS);
    tick(); // primeiro tick imediato (não esperar 3s se webhook foi rápido)
  }

  // ===== Wire up botões "Comprar gift card" =====
  document.querySelectorAll('[data-open-giftcard-form]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openGiftModal();
    });
  });

});
