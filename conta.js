document.addEventListener('DOMContentLoaded', () => {
  async function startPage() {
    await ElarahAuth.ready;
    const user = ElarahAuth.getCurrentUser();

    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Admin nunca usa /conta.html — vai direto pro painel.
    if (ElarahAuth.isAdmin()) {
      window.location.href = 'admin.html';
      return;
    }

  // ===== POPULATE SIDEBAR =====
  const initials = (user.nome || '')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarEl = document.getElementById('account-avatar');
  const nameEl = document.getElementById('account-name');
  const emailEl = document.getElementById('account-email');
  const badgeEl = document.getElementById('account-badge');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = user.nome || '';
  if (emailEl) emailEl.textContent = user.email || '';

if (badgeEl) {
  if (user.partnerStatus === 'approved') {
    badgeEl.textContent = 'Parceiro';
    badgeEl.className = 'account__badge account__badge--partner';
  } else if (user.partnerStatus === 'pending') {
    badgeEl.textContent = 'Em análise';
    badgeEl.className = 'account__badge account__badge--user';
  } else if (user.partnerStatus === 'rejected') {
    badgeEl.textContent = 'Revisar cadastro';
    badgeEl.className = 'account__badge account__badge--user';
  } else {
    badgeEl.textContent = 'Usuário';
    badgeEl.className = 'account__badge account__badge--user';
  }
}

  // ===== SECTION NAVIGATION =====
  const menuItems = document.querySelectorAll('.account__menu-item');
  const sections = document.querySelectorAll('.account__section');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;

      menuItems.forEach(m => m.classList.remove('account__menu-item--active'));
      item.classList.add('account__menu-item--active');

      sections.forEach(s => s.classList.remove('account__section--active'));

      const targetSection = document.getElementById('section-' + target);
      if (targetSection) targetSection.classList.add('account__section--active');
    });
  });

  const sectionParam = new URLSearchParams(window.location.search).get('section');
  if (sectionParam) {
    const targetBtn = document.querySelector(`.account__menu-item[data-section="${sectionParam}"]`);
    if (targetBtn) targetBtn.click();
  }

  // ===== HEADER FAVORITES SHORTCUT =====
  const headerFav = document.querySelector('.header__action-btn[aria-label="Favoritos"]');
  if (headerFav) {
    headerFav.addEventListener('click', (e) => {
      e.preventDefault();
      const favoritosBtn = document.querySelector('.account__menu-item[data-section="favoritos"]');
      if (favoritosBtn) favoritosBtn.click();
    });
  }

  // ===== MEUS DADOS FORM =====
  const dadosNome = document.getElementById('dados-nome');
  const dadosEmail = document.getElementById('dados-email');
  const dadosTelefone = document.getElementById('dados-telefone');
  const dadosCidade = document.getElementById('dados-cidade');
  const formDados = document.getElementById('form-dados');

  if (dadosNome) dadosNome.value = user.nome || '';
  if (dadosEmail) dadosEmail.value = user.email || '';
  if (dadosTelefone) dadosTelefone.value = user.telefone || '';
  if (dadosCidade) dadosCidade.value = user.cidade || '';

  if (formDados) {
    formDados.addEventListener('submit', async (e) => {
      e.preventDefault();

      const result = await ElarahAuth.updateUser({
        nome: dadosNome ? dadosNome.value.trim() : '',
        telefone: dadosTelefone ? dadosTelefone.value.trim() : '',
        cidade: dadosCidade ? dadosCidade.value.trim() : ''
      });

      if (result.success) {
        const successEl = document.getElementById('dados-success');
        if (successEl) {
          successEl.classList.add('account__form-success--show');
          setTimeout(() => {
            successEl.classList.remove('account__form-success--show');
          }, 3000);
        }

        if (nameEl) nameEl.textContent = result.user.nome || '';

        const newInitials = (result.user.nome || '')
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        if (avatarEl) avatarEl.textContent = newInitials;

        ElarahAuth.updateHeaderUI();
      }
    });
  }

  // ===== PARTNER SECTION =====
  function renderPartnerSection() {
  const currentUser = ElarahAuth.getCurrentUser();

  const formWrap = document.getElementById('parceiro-form-wrap');
  const pendingWrap = document.getElementById('parceiro-pending');
  const approvedWrap = document.getElementById('parceiro-approved');
  const rejectedWrap = document.getElementById('parceiro-rejected');
  const parceiroInfo = document.getElementById('parceiro-info');

  if (formWrap) formWrap.style.display = 'none';
  if (pendingWrap) pendingWrap.style.display = 'none';
  if (approvedWrap) approvedWrap.style.display = 'none';
  if (rejectedWrap) rejectedWrap.style.display = 'none';

  const pd = currentUser.partnerData || {};

if (currentUser.partnerStatus === 'approved') {
  if (approvedWrap) approvedWrap.style.display = 'block';

  if (parceiroInfo) {
    parceiroInfo.innerHTML = `
      <div class="account__partner-detail"><strong>Nome da marca/empresa</strong><span>${pd.marca || '-'}</span></div>
      <div class="account__partner-detail"><strong>Tipo de experiência</strong><span>${pd.tipo || '-'}</span></div>
      <div class="account__partner-detail"><strong>Bairro / Local de atuação</strong><span>${pd.bairro || '-'}</span></div>
      <div class="account__partner-detail"><strong>Cidade</strong><span>${pd.cidade || '-'}</span></div>
      <div class="account__partner-detail"><strong>Instagram ou site</strong><span>${pd.social || '-'}</span></div>
      <div class="account__partner-detail"><strong>Conte sobre sua experiência</strong><span>${pd.descricao || '-'}</span></div>
    `;
  }

  return;
}

if (currentUser.partnerStatus === 'pending') {
  if (pendingWrap) pendingWrap.style.display = 'block';
  return;
}

if (currentUser.partnerStatus === 'rejected') {
  if (rejectedWrap) rejectedWrap.style.display = 'block';
  return;
}

if (formWrap) formWrap.style.display = 'block';
}

renderPartnerSection();
  
  // ===== PARTNER FORM SUBMIT =====
  const parceiroForm = document.getElementById('form-parceiro');
  if (parceiroForm) {
    parceiroForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const partnerData = {
        marca: document.getElementById('parceiro-marca')?.value.trim() || '',
        tipo: document.getElementById('parceiro-tipo')?.value || '',
        bairro: document.getElementById('parceiro-bairro')?.value.trim() || '',
        cidade: document.getElementById('parceiro-cidade')?.value.trim() || '',
        social: document.getElementById('parceiro-social')?.value.trim() || '',
        descricao: document.getElementById('parceiro-descricao')?.value.trim() || ''
      };

      const result = await ElarahAuth.becomePartner(partnerData);

      if (result.success) {
        if (badgeEl) {
          badgeEl.textContent = 'Em análise';
          badgeEl.className = 'account__badge account__badge--user';
        }

        renderPartnerSection();
      }
    });
  }
  
// ===== FAVORITOS =====
function renderFavoritos() {
  const favoritos = ElarahAuth.getFavorites();
  const empty = document.getElementById('favoritos-empty');
  const lista = document.getElementById('favoritos-lista');

  const imageMap = {
    "Pães Alemães": "assets/experiences/paes-alemaes.jpg",
    "The Art of Lamen": "assets/experiences/art-of-lemmen.jpg",
    "CEO Kitchen (Comida Asiática)": "assets/experiences/ceo-kitchen.jpg",
    "Cozinha Tailandesa": "assets/experiences/cozinha-tailandesa.jpg",
    "Cozinha Japonesa (Sushi/Sashimi)": "assets/experiences/cozinha-japonesa.jpg",
    "Torta Salgada": "assets/experiences/torta-salgada.jpg",
    "Izakaya (Japonesa)": "assets/experiences/izakaya.jpg",
    "Bolo Caseiro da Fazenda": "assets/experiences/bolo-caseiro.jpg",
    "Churrasco sem Churrasqueira": "assets/experiences/churrasco.jpg",
    "Vela + Home Spray (Café Gelado)": "assets/experiences/vela-cafe.jpg",
    "Vela + Home Spray (Praia)": "assets/experiences/vela-praia.jpg",
    "Vela + Home Spray (Floral)": "assets/experiences/vela-floral.jpg",
    "Pintura em Taça": "assets/experiences/pintura-taca.jpg",
    "Sabonete Artesanal": "assets/experiences/sabonete-artesanal.jpg",
    "Vela Personalizada": "assets/experiences/vela-personalizada.jpg",
    "Vela (Cerveja & Caipirinha)": "assets/experiences/vela-cerveja.jpg",
    "Pintura em Cerâmica": "assets/experiences/pintura-ceramica.jpg",
    "Aula de Tufting (Seg)": "assets/experiences/tufting.jpg",
    "Aula de Tufting (Ter/Qui/Sex)": "assets/experiences/tufting.jpg"
  };

  if (!empty || !lista) return;

  if (!favoritos.length) {
    empty.style.display = 'block';
    lista.style.display = 'none';
    lista.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  lista.style.display = 'grid';
lista.style.gridTemplateColumns = '1fr 1fr';
lista.style.gap = '20px';

  lista.innerHTML = favoritos.map(f => {
    const [nome, data, horario] = f.split('_');
    const imagem = imageMap[nome] || '';

    return `
      <div style="
        border: 1px solid #eee;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 20px;
        background: #fff;
      ">
      <div style="
  width: 100%;
  aspect-ratio: 1/1;
  background: #f5f5f5;
">
          ${imagem ? `<img src="${imagem}" alt="${nome}" style="width:100%; height:100%; object-fit:cover; display:block;">` : ''}
        </div>

        <div style="padding:16px;">
          <span style="
            font-size:12px;
            color:#ff6a00;
            font-weight:600;
            letter-spacing:0.5px;
          ">
            EXPERIÊNCIA
          </span>

          <h3 style="
            margin:8px 0;
            font-size:18px;
          ">
            ${nome}
          </h3>

          <p style="
            font-size:14px;
            color:#666;
          ">
            ${data || ''}${horario ? ' · ' + horario : ''}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

renderFavoritos();

  // ============================================================
  //  MINHAS COMPRAS (reservas Stripe + gift cards)
  // ============================================================
  // Carrega uma vez quando o usuário entra na seção (lazy). Fonte:
  //   bookings table      — filtrado via RLS auth.uid() = user_id
  //   gift_cards table    — filtrado via RLS (comprador_user_id
  //                         OU comprador_email OU destinatario_email)
  // Não depende de nenhuma nova coluna nem de service_role — RLS
  // do Supabase já cuida da visibilidade.
  let purchasesLoaded = false;
  let purchasesLoading = false;
  let activePurchasesTab = 'upcoming';

  function parseDataDMYtoDate(text) {
    // Aceita "26/04", "26/04/2025", "26 de abril", "Semanal".
    // Retorna Date ou null quando não conseguir parsear.
    if (!text) return null;
    const s = String(text).trim();
    if (!s) return null;
    // Semanal / recorrente → considera upcoming (não tem data única).
    if (/semanal|mensal|recorrente|toda|todas|sempre/i.test(s)) return null;
    // DD/MM ou DD/MM/YYYY
    const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      let year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        // Se a data DD/MM já passou (mais de 30 dias atrás), assume
        // que é do ano que vem — evita mostrar reservas criadas em
        // dezembro pra janeiro como "past".
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = (today - d) / (1000 * 60 * 60 * 24);
        if (!m[3] && diffDays > 30) {
          const next = new Date(year + 1, month, day);
          if (!isNaN(next.getTime())) return next;
        }
        return d;
      }
    }
    // "26 de abril"
    const months = ['janeiro','fevereiro','março','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const m2 = s.toLowerCase().match(/^(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{4}))?$/);
    if (m2) {
      const day = parseInt(m2[1], 10);
      const idx = months.indexOf(m2[2]);
      const monthIdx = idx === 3 ? 2 : (idx > 3 ? idx - 1 : idx); // março/marco
      const year = m2[3] ? parseInt(m2[3], 10) : new Date().getFullYear();
      if (monthIdx >= 0) {
        const d = new Date(year, monthIdx, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  }

  function classifyBooking(booking) {
    // 1) Status define visibilidade primária.
    const status = booking.status || 'pending';
    if (status === 'cancelado' || status === 'expirado' || status === 'reembolsado') {
      return 'past';
    }
    // 2) status='pago' ou 'pending' → olha a data pra decidir.
    const parsed = parseDataDMYtoDate(booking.data);
    if (!parsed) {
      // Sem data parseável (recorrente ou formato desconhecido) →
      // upcoming se pago, upcoming se pending (ainda não finalizado).
      return 'upcoming';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed >= today ? 'upcoming' : 'past';
  }

  function classifyGiftCard(gc) {
    // Gift cards: active/pending = ainda válido (upcoming).
    // used/expired/cancelled = past.
    const status = gc.status || 'pending';
    if (status === 'active' || status === 'pending') return 'upcoming';
    return 'past';
  }

  function classifyManualSale(ms) {
    // Vendas manuais: cancelado/reembolsado vão pro histórico.
    // Senão, decide pela data do evento (slot_date).
    const status = ms.payment_status || 'pendente';
    if (status === 'cancelado' || status === 'reembolsado') return 'past';
    if (!ms.slot_date) return 'upcoming';
    const parsed = new Date(ms.slot_date + 'T00:00:00');
    if (isNaN(parsed.getTime())) return 'upcoming';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed >= today ? 'upcoming' : 'past';
  }

  function formatBrlCents(cents) {
    if (cents == null) return '';
    return 'R$ ' + (Number(cents) / 100).toFixed(2).replace('.', ',');
  }

  function formatCreatedAt(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  }

  function escapeHtmlLocal(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bookingStatusLabel(status) {
    const map = {
      pago: 'Confirmada',
      pending: 'Pagamento pendente',
      cancelado: 'Cancelada',
      expirado: 'Expirada',
      reembolsado: 'Reembolsada',
    };
    return map[status] || (status || '');
  }

  function giftCardStatusLabel(status) {
    const map = {
      active: 'Ativo',
      pending: 'Pagamento pendente',
      used: 'Usado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return map[status] || (status || '');
  }

  function renderBookingCard(booking, group) {
    const nome = booking.experiencia_nome || 'Experiência';
    const data = booking.data || '';
    const horario = booking.horario || '';
    const priceLabel = booking.preco_label ||
      (booking.amount_total ? formatBrlCents(booking.amount_total) : '');
    const status = booking.status || 'pending';
    const statusLabel = bookingStatusLabel(status);
    // Endereço da experiência — salvo em metadata pelas edge functions
    // de checkout (create-checkout-session / create-mp-pix-payment).
    // Usuário acessa essa tela como referência rápida antes do evento;
    // sem isso, precisa caçar no e-mail de confirmação. Exibido como
    // linha separada com pin pra destacar visualmente do meta padrão.
    const meta = (booking.metadata && typeof booking.metadata === 'object') ? booking.metadata : {};
    const endereco = String(meta.endereco || '').trim();
    const bairro = String(meta.bairro || '').trim();
    // Combina endereco + bairro com separador " — " quando os dois
    // existem. Se só um, usa só ele. Mesma lógica do email de
    // confirmação (_shared/email.ts), pra manter consistência entre
    // o que o usuário vê na tela e o que recebeu por e-mail.
    const localFull = endereco && bairro
      ? endereco + ' — ' + bairro
      : (endereco || bairro || '');
    const metaParts = [];
    if (data) metaParts.push('<span class="purchase-card__meta-item">📅 ' + escapeHtmlLocal(data) + '</span>');
    if (horario) metaParts.push('<span class="purchase-card__meta-item">⏱ ' + escapeHtmlLocal(horario) + '</span>');
    if (priceLabel) metaParts.push('<span class="purchase-card__meta-item purchase-card__price">' + escapeHtmlLocal(priceLabel) + '</span>');
    // Linha do local: só renderiza quando há endereço/bairro disponível.
    // Bookings antigas ou de gift card direto podem não ter — nesse
    // caso o card mantém o layout enxuto sem espaço vazio.
    const localHtml = localFull
      ? '<p class="purchase-card__location" title="' + escapeHtmlLocal(localFull) + '">' +
          '<span class="purchase-card__location-icon" aria-hidden="true">📍</span>' +
          '<span class="purchase-card__location-text">' + escapeHtmlLocal(localFull) + '</span>' +
        '</p>'
      : '';

    return (
      '<article class="purchase-card purchase-card--experience' + (group === 'past' ? ' purchase-card--past' : '') + '">' +
        '<div class="purchase-card__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22">' +
            '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
          '</svg>' +
        '</div>' +
        '<div class="purchase-card__body">' +
          '<div class="purchase-card__head">' +
            '<span class="purchase-card__type">Experiência</span>' +
            '<span class="purchase-card__status purchase-card__status--' + escapeHtmlLocal(status) + '">' + escapeHtmlLocal(statusLabel) + '</span>' +
          '</div>' +
          '<h3 class="purchase-card__title">' + escapeHtmlLocal(nome) + '</h3>' +
          '<div class="purchase-card__meta">' + metaParts.join('') + '</div>' +
          localHtml +
        '</div>' +
      '</article>'
    );
  }

  function renderGiftCardCard(gc, group) {
    const userEmail = (user.email || '').toLowerCase();
    const comprador = (gc.comprador_email || '').toLowerCase();
    const destinatario = (gc.destinatario_email || '').toLowerCase();
    const isBuyer = comprador === userEmail;
    const isRecipient = destinatario === userEmail;
    // Se o usuário é comprador E destinatário (comprou pra si), chama de "Comprado".
    const role = isBuyer ? 'Gift Card (comprado)' : (isRecipient ? 'Gift Card (recebido)' : 'Gift Card');
    const valor = formatBrlCents(gc.valor_inicial_centavos);
    const saldo = formatBrlCents(gc.saldo_centavos);
    const status = gc.status || 'pending';
    const statusLabel = giftCardStatusLabel(status);
    const createdLabel = formatCreatedAt(gc.created_at);

    // Mostra o código só quando for ativo (pending não tem código real).
    const codeDisplay = (status === 'active' && gc.code && !String(gc.code).startsWith('PENDING-'))
      ? gc.code
      : (status === 'pending' ? '—' : (gc.code || ''));

    const meta = [];
    if (createdLabel) meta.push('<span class="purchase-card__meta-item">📅 ' + escapeHtmlLocal(createdLabel) + '</span>');
    if (valor) meta.push('<span class="purchase-card__meta-item purchase-card__price">' + escapeHtmlLocal(valor) + '</span>');
    if (saldo && saldo !== valor) {
      meta.push('<span class="purchase-card__meta-item">Saldo: ' + escapeHtmlLocal(saldo) + '</span>');
    }

    const title = isRecipient && !isBuyer
      ? ('Gift card de ' + (gc.comprador_nome || gc.comprador_email || 'alguém especial'))
      : ('Gift card para ' + (gc.destinatario_nome || gc.destinatario_email || 'alguém'));

    return (
      '<article class="purchase-card purchase-card--gift' + (group === 'past' ? ' purchase-card--past' : '') + '">' +
        '<div class="purchase-card__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22">' +
            '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>' +
          '</svg>' +
        '</div>' +
        '<div class="purchase-card__body">' +
          '<div class="purchase-card__head">' +
            '<span class="purchase-card__type">' + escapeHtmlLocal(role) + '</span>' +
            '<span class="purchase-card__status purchase-card__status--' + escapeHtmlLocal(status) + '">' + escapeHtmlLocal(statusLabel) + '</span>' +
          '</div>' +
          '<h3 class="purchase-card__title">' + escapeHtmlLocal(title) + '</h3>' +
          '<div class="purchase-card__meta">' + meta.join('') + '</div>' +
          (codeDisplay && codeDisplay !== '—'
            ? '<div class="purchase-card__meta" style="margin-top:6px;"><span class="purchase-card__meta-item" style="font-family:Menlo,Consolas,monospace;font-size:.78rem;color:#a4663b;">🏷 ' + escapeHtmlLocal(codeDisplay) + '</span></div>'
            : '') +
        '</div>' +
      '</article>'
    );
  }

  function manualSaleStatusLabel(status) {
    const map = {
      pago: 'Confirmada',
      pendente: 'Pagamento pendente',
      cancelado: 'Cancelada',
      reembolsado: 'Reembolsada',
    };
    return map[status] || (status || '');
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return '';
    const d = new Date(String(isoDate) + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Renderiza uma venda manual como card de experiência. Pro cliente
  // não há distinção visual de "venda manual" (isso é jargão interno
  // do admin) — pra ele é só mais uma experiência comprada.
  function renderManualSaleCard(ms, group) {
    const nome = ms.experiencia_nome || 'Experiência';
    const data = formatDateBR(ms.slot_date);
    const horario = ms.horario || '';
    const priceLabel = ms.amount_total ? formatBrlCents(ms.amount_total) : '';
    const status = ms.payment_status || 'pendente';
    // 'pendente' não tem classe de cor própria no CSS — reusa 'pending'.
    const statusClass = status === 'pendente' ? 'pending' : status;
    const statusLabel = manualSaleStatusLabel(status);

    const metaParts = [];
    if (data) metaParts.push('<span class="purchase-card__meta-item">📅 ' + escapeHtmlLocal(data) + '</span>');
    if (horario) metaParts.push('<span class="purchase-card__meta-item">⏱ ' + escapeHtmlLocal(horario) + '</span>');
    if (priceLabel) metaParts.push('<span class="purchase-card__meta-item purchase-card__price">' + escapeHtmlLocal(priceLabel) + '</span>');

    return (
      '<article class="purchase-card purchase-card--experience' + (group === 'past' ? ' purchase-card--past' : '') + '">' +
        '<div class="purchase-card__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22">' +
            '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
          '</svg>' +
        '</div>' +
        '<div class="purchase-card__body">' +
          '<div class="purchase-card__head">' +
            '<span class="purchase-card__type">Experiência</span>' +
            '<span class="purchase-card__status purchase-card__status--' + escapeHtmlLocal(statusClass) + '">' + escapeHtmlLocal(statusLabel) + '</span>' +
          '</div>' +
          '<h3 class="purchase-card__title">' + escapeHtmlLocal(nome) + '</h3>' +
          '<div class="purchase-card__meta">' + metaParts.join('') + '</div>' +
        '</div>' +
      '</article>'
    );
  }

  async function loadPurchases() {
    if (purchasesLoaded || purchasesLoading) return;
    purchasesLoading = true;

    const loadingEl = document.getElementById('purchases-loading');
    const errorEl = document.getElementById('purchases-error');
    const upcomingList = document.getElementById('purchases-upcoming-list');
    const pastList = document.getElementById('purchases-past-list');

    if (!loadingEl || !upcomingList || !pastList) {
      purchasesLoading = false;
      return;
    }

    const sb = window.supabaseClient;
    if (!sb) {
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      errorEl.textContent = 'Supabase indisponível. Recarregue a página.';
      purchasesLoading = false;
      return;
    }

    try {
      // Busca bookings do usuário (RLS: auth.uid() = user_id) e
      // gift cards onde o usuário é comprador OU destinatário
      // (RLS: gift_cards_owner_read cobre ambos via e-mail).
      const [bookingsRes, giftCardsRes, manualSalesRes] = await Promise.all([
        sb.from('bookings')
          .select('id, experiencia_nome, data, horario, preco_label, amount_total, status, created_at, stripe_session_id, metadata')
          .order('created_at', { ascending: false })
          .limit(200),
        sb.from('gift_cards')
          .select('id, code, valor_inicial_centavos, saldo_centavos, status, comprador_email, comprador_nome, destinatario_email, destinatario_nome, created_at, expires_at')
          .order('created_at', { ascending: false })
          .limit(200),
        // Vendas manuais via RPC (RLS da tabela é admin-only). Falha
        // graciosamente se a migration get_my_manual_sales não rodou.
        sb.rpc('get_my_manual_sales').then(r => r, e => ({ data: [], error: e })),
      ]);

      if (bookingsRes.error) {
        console.error('[Elarah conta] erro ao carregar bookings', bookingsRes.error);
      }
      if (giftCardsRes.error) {
        console.error('[Elarah conta] erro ao carregar gift_cards', giftCardsRes.error);
      }
      if (manualSalesRes && manualSalesRes.error) {
        console.warn('[Elarah conta] get_my_manual_sales indisponível (ok se migration não rodou)', manualSalesRes.error);
      }

      const bookings = bookingsRes.data || [];
      const giftCards = giftCardsRes.data || [];
      const manualSales = (manualSalesRes && manualSalesRes.data) || [];

      const upcoming = [];
      const past = [];

      bookings.forEach(b => {
        const group = classifyBooking(b);
        const entry = { kind: 'booking', data: b, group, sortKey: b.created_at || '' };
        if (group === 'upcoming') upcoming.push(entry);
        else past.push(entry);
      });

      giftCards.forEach(g => {
        const group = classifyGiftCard(g);
        const entry = { kind: 'giftCard', data: g, group, sortKey: g.created_at || '' };
        if (group === 'upcoming') upcoming.push(entry);
        else past.push(entry);
      });

      manualSales.forEach(m => {
        const group = classifyManualSale(m);
        const entry = { kind: 'manualSale', data: m, group, sortKey: m.created_at || '' };
        if (group === 'upcoming') upcoming.push(entry);
        else past.push(entry);
      });

      // Próximas: mais próximas primeiro (ou mais recentes se sem data).
      // Anteriores: mais recentes primeiro.
      upcoming.sort((a, b) => (b.sortKey || '').localeCompare(a.sortKey || ''));
      past.sort((a, b) => (b.sortKey || '').localeCompare(a.sortKey || ''));

      // Render
      function renderGroup(list, entries, emptyId, countId) {
        const emptyEl = document.getElementById(emptyId);
        const countEl = document.getElementById(countId);
        if (countEl) countEl.textContent = String(entries.length);
        if (!entries.length) {
          list.innerHTML = '';
          if (emptyEl) emptyEl.style.display = 'block';
          return;
        }
        if (emptyEl) emptyEl.style.display = 'none';
        list.innerHTML = entries.map(e => {
          if (e.kind === 'booking') return renderBookingCard(e.data, e.group);
          if (e.kind === 'manualSale') return renderManualSaleCard(e.data, e.group);
          return renderGiftCardCard(e.data, e.group);
        }).join('');
      }

      renderGroup(upcomingList, upcoming, 'purchases-upcoming-empty', 'purchases-upcoming-count');
      renderGroup(pastList, past, 'purchases-past-empty', 'purchases-past-count');

      loadingEl.style.display = 'none';
      errorEl.style.display = 'none';
      purchasesLoaded = true;
    } catch (err) {
      console.error('[Elarah conta] exceção ao carregar compras', err);
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      errorEl.textContent = 'Erro ao carregar suas compras. Tente recarregar a página.';
    } finally {
      purchasesLoading = false;
    }
  }

  // Wire sub-tabs (Próximas / Anteriores)
  const purchasesTabs = document.querySelectorAll('[data-purchases-tab]');
  purchasesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.purchasesTab;
      if (target === activePurchasesTab) return;
      activePurchasesTab = target;
      purchasesTabs.forEach(t => {
        const isActive = t.dataset.purchasesTab === target;
        t.classList.toggle('purchases__tab--active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      const upcomingGroup = document.getElementById('purchases-upcoming');
      const pastGroup = document.getElementById('purchases-past');
      if (upcomingGroup) {
        upcomingGroup.classList.toggle('purchases__group--active', target === 'upcoming');
        upcomingGroup.style.display = target === 'upcoming' ? 'block' : 'none';
      }
      if (pastGroup) {
        pastGroup.classList.toggle('purchases__group--active', target === 'past');
        pastGroup.style.display = target === 'past' ? 'block' : 'none';
      }
    });
  });

  // Carrega on-demand quando o usuário clica em "Minhas compras"
  // OU quando chega na página com ?section=compras.
  const comprasMenuBtn = document.querySelector('.account__menu-item[data-section="compras"]');
  if (comprasMenuBtn) {
    comprasMenuBtn.addEventListener('click', () => { loadPurchases(); });
  }
  if (sectionParam === 'compras') {
    loadPurchases();
  }

  // ============================================================
  //  CARTÃO FIDELIDADE
  // ============================================================
  // A cada 10 compras pagas (experiências + gift cards comprados),
  // o usuário ganha um cupom de 20% OFF. A contagem e a emissão dos
  // cupons são feitas server-side pela RPC sync_loyalty_card()
  // (SECURITY DEFINER) — o frontend só renderiza o resultado.
  //
  // Fallback resiliente: se a RPC ainda não estiver no banco (migration
  // sql/elarah_loyalty_card.sql não rodada), o cartão ainda mostra o
  // progresso contando bookings + gift_cards via RLS, sem os cupons.
  let loyaltyLoaded = false;
  let loyaltyLoading = false;

  function renderLoyaltyCard(data) {
    const loadingEl = document.getElementById('loyalty-loading');
    const errorEl = document.getElementById('loyalty-error');
    const cardEl = document.getElementById('loyalty-card');
    const stampsEl = document.getElementById('loyalty-stamps');
    const progressEl = document.getElementById('loyalty-progress');
    const hintEl = document.getElementById('loyalty-hint');
    const rewardsEl = document.getElementById('loyalty-rewards');
    const rewardsListEl = document.getElementById('loyalty-rewards-list');

    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (cardEl) cardEl.style.display = 'block';

    const goal = Number(data.goal) || 10;
    const stamps = Math.max(0, Math.min(goal, Number(data.stamps) || 0));
    const total = Number(data.total_paid) || 0;

    if (progressEl) progressEl.textContent = stamps + ' de ' + goal;

    // Carimbos: os preenchidos ganham a logo da Elarah, os vazios
    // mostram o número da posição.
    if (stampsEl) {
      let html = '';
      for (let n = 1; n <= goal; n++) {
        if (n <= stamps) {
          html += '<div class="loyalty__stamp loyalty__stamp--filled">' +
            '<img src="assets/logo-simbolo.png" alt="" class="loyalty__stamp-logo">' +
            '</div>';
        } else {
          html += '<div class="loyalty__stamp"><span class="loyalty__stamp-num">' + n + '</span></div>';
        }
      }
      stampsEl.innerHTML = html;
    }

    // Mensagem de incentivo.
    if (hintEl) {
      if (total === 0) {
        hintEl.innerHTML = 'Compre sua primeira experiência para começar a carimbar seu cartão!';
      } else if (stamps >= goal) {
        hintEl.innerHTML = 'Cartão completo! 🎉 Seu cupom de <strong>20% OFF</strong> está aqui embaixo.';
      } else {
        const left = goal - stamps;
        hintEl.innerHTML = 'Falta' + (left > 1 ? 'm ' : ' ') + '<strong>' + left + '</strong> ' +
          (left > 1 ? 'compras' : 'compra') + ' para ganhar <strong>20% de desconto</strong>.';
      }
    }

    // Cupons conquistados (só existe quando a RPC respondeu).
    const coupons = Array.isArray(data.coupons) ? data.coupons : [];
    if (rewardsEl && rewardsListEl) {
      if (!coupons.length) {
        rewardsEl.style.display = 'none';
        rewardsListEl.innerHTML = '';
      } else {
        rewardsEl.style.display = 'block';
        rewardsListEl.innerHTML = coupons.map(c => {
          const spent = c.used || c.expired;
          const code = escapeHtmlLocal(c.code || '');
          let metaText;
          if (c.used) {
            metaText = 'Cupom já utilizado';
          } else if (c.expired) {
            metaText = 'Expirado';
          } else {
            metaText = 'Válido até ' + formatCreatedAt(c.valid_until);
          }
          return (
            '<div class="loyalty-coupon' + (spent ? ' loyalty-coupon--spent' : '') + '">' +
              '<div class="loyalty-coupon__badge">' + (Number(c.discount_value) || 20) + '%</div>' +
              '<div class="loyalty-coupon__body">' +
                '<div class="loyalty-coupon__code">' + code + '</div>' +
                '<div class="loyalty-coupon__meta">' + metaText + '</div>' +
              '</div>' +
              (spent ? '' : '<button type="button" class="loyalty-coupon__copy" data-copy-code="' + code + '">Copiar</button>') +
            '</div>'
          );
        }).join('');

        // Wire dos botões de copiar.
        rewardsListEl.querySelectorAll('[data-copy-code]').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-copy-code');
            const done = () => {
              const original = btn.textContent;
              btn.textContent = 'Copiado!';
              setTimeout(() => { btn.textContent = original; }, 1800);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(code).then(done).catch(done);
            } else {
              done();
            }
          });
        });
      }
    }
  }

  // Fallback client-side: conta compras pagas direto das tabelas
  // (sem cupons, que dependem da RPC). Usado se a RPC não existir.
  async function loadLoyaltyFallback(sb) {
    const userEmail = (user.email || '').toLowerCase();
    const [bookingsRes, giftCardsRes] = await Promise.all([
      sb.from('bookings').select('id, status').eq('status', 'pago').limit(500),
      sb.from('gift_cards')
        .select('id, status, comprador_email, comprador_user_id')
        .limit(500),
    ]);

    const paidExp = (bookingsRes.data || []).length;
    const paidGift = (giftCardsRes.data || []).filter(g => {
      const bought = (g.comprador_user_id && g.comprador_user_id === user.id) ||
        ((g.comprador_email || '').toLowerCase() === userEmail);
      const paid = ['active', 'used', 'expired'].includes(g.status);
      return bought && paid;
    }).length;

    const total = paidExp + paidGift;
    const goal = 10;
    const rewards = Math.floor(total / goal);
    let stamps = total - rewards * goal;
    if (stamps === 0 && total > 0) stamps = goal;

    renderLoyaltyCard({
      total_paid: total,
      goal,
      stamps,
      rewards_total: rewards,
      coupons: [],
    });
  }

  async function loadLoyalty() {
    if (loyaltyLoaded || loyaltyLoading) return;
    loyaltyLoading = true;

    const loadingEl = document.getElementById('loyalty-loading');
    const errorEl = document.getElementById('loyalty-error');

    const sb = window.supabaseClient;
    if (!sb) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Supabase indisponível. Recarregue a página.';
      }
      loyaltyLoading = false;
      return;
    }

    try {
      const { data, error } = await sb.rpc('sync_loyalty_card');
      if (error) throw error;
      renderLoyaltyCard(data || {});
      loyaltyLoaded = true;
    } catch (err) {
      // RPC ainda não existe no banco (ou outra falha) → usa o
      // fallback client-side pra ao menos mostrar o progresso.
      console.warn('[Elarah conta] sync_loyalty_card indisponível, usando fallback', err);
      try {
        await loadLoyaltyFallback(sb);
        loyaltyLoaded = true;
      } catch (err2) {
        console.error('[Elarah conta] fallback de fidelidade falhou', err2);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = 'Não foi possível carregar seu cartão. Tente recarregar a página.';
        }
      }
    } finally {
      loyaltyLoading = false;
    }
  }

  const fidelidadeMenuBtn = document.querySelector('.account__menu-item[data-section="fidelidade"]');
  if (fidelidadeMenuBtn) {
    fidelidadeMenuBtn.addEventListener('click', () => { loadLoyalty(); });
  }
  if (sectionParam === 'fidelidade') {
    loadLoyalty();
  }

  // ===== LOGOUT =====
  const logoutBtn = document.getElementById('account-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await ElarahAuth.logout();
      window.location.href = 'index.html';
    });
  }

  // ===== HEADER SEARCH =====
  const searchInput = document.querySelector('.header__search-input');

  function executarBuscaConta() {
    const valor = searchInput?.value.trim();
    if (!valor) return;
    window.location.href = 'index.html?busca=' + encodeURIComponent(valor);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBuscaConta();
      }
    });
  }

  // ===== EXPLORAR DROPDOWN =====
  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

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
          ? 'index.html'
          : 'index.html?categoria=' + encodeURIComponent(text);

        window.location.href = destino;
      });
    });
  }

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
      header.style.boxShadow = window.scrollY > 10
        ? '0 1px 8px rgba(0,0,0,0.06)'
        : 'none';
    });
  }
  }

  startPage();
});
