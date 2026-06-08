// =============================================================
// ELARAH — Dia dos Namorados
// -------------------------------------------------------------
// Carrega dados REAIS do banco:
//   - campaign_overrides JOIN experiences → vitrine curada
//   - campaign_upcoming_experiences → cards "em breve"
//   - campaign_waitlist (insert) → captura de leads
// =============================================================
(function () {
  'use strict';

  var CAMPAIGN_SLUG = 'dia-dos-namorados';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // ===== Countdown =====
  function updateCountdown() {
    var el = document.getElementById('ddn-countdown');
    if (!el) return;
    var now = new Date();
    var year = now.getFullYear();
    var target = new Date(year + '-06-12T00:00:00-03:00');
    if (now > target) target = new Date((year + 1) + '-06-12T00:00:00-03:00');
    var diffMs = target - now;
    var days = Math.ceil(diffMs / 86400000);
    if (days <= 0) el.innerHTML = '🤍 <strong>É hoje!</strong>';
    else if (days === 1) el.innerHTML = '<strong>Amanhã</strong> é o 12 de junho';
    else el.innerHTML = 'Faltam <strong>' + days + '</strong> dias para o 12 de junho';
  }
  updateCountdown();

  // ===== Gift card chips =====
  document.querySelectorAll('.ddn-gift__value-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.ddn-gift__value-chip').forEach(function (c) {
        c.classList.remove('ddn-gift__value-chip--active');
      });
      chip.classList.add('ddn-gift__value-chip--active');
      var preview = document.querySelector('.ddn-gift__card-preview-value');
      if (preview) preview.textContent = chip.textContent.trim();
    });
  });

  // Aguarda window.supabaseClient ficar pronto (até 5s). Sem isso,
  // se o JS roda antes do supabase-client.js terminar de inicializar,
  // renderVitrine fica preso em "Carregando..." pra sempre.
  function waitForSupabase(timeoutMs) {
    return new Promise(function (resolve) {
      var elapsed = 0;
      var step = 100;
      function check() {
        if (window.supabaseClient) return resolve(window.supabaseClient);
        elapsed += step;
        if (elapsed >= (timeoutMs || 5000)) return resolve(null);
        setTimeout(check, step);
      }
      check();
    });
  }

  function renderEmptyState(grid) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:60px 24px;background:#fff;border-radius:20px;border:1.5px dashed var(--ddn-rose);">' +
        '<div style="width:64px;height:64px;margin:0 auto 18px;background:var(--ddn-rose-soft);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ddn-wine);">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 2v6"/><path d="M12 22v-6"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/>' +
            '<path d="M2 12h6"/><path d="M22 12h-6"/><path d="M4.93 19.07l4.24-4.24"/><path d="M14.83 9.17l4.24-4.24"/>' +
          '</svg>' +
        '</div>' +
        '<h3 style="font-family:\'DM Serif Display\',serif;font-size:1.4rem;color:var(--ddn-ink);margin:0 0 10px;font-weight:400;">Curadoria sendo finalizada</h3>' +
        '<p style="color:var(--ddn-ink-soft);font-size:.95rem;max-width:420px;margin:0 auto;line-height:1.55;">Estamos escolhendo a dedo as experiências mais especiais pra esse dia. Volte logo — ou ' +
          '<a href="categoria.html" style="color:var(--ddn-wine);font-weight:600;text-decoration:underline;">explore todas as experiências</a>.</p>' +
      '</div>';
  }

  function renderErrorState(grid, msg) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px 24px;background:#fff;border-radius:20px;border:1px solid #f4c4c4;">' +
        '<p style="color:#a4332b;font-size:.9rem;margin:0 0 10px;">Não foi possível carregar as experiências agora.</p>' +
        '<p style="color:#888;font-size:.78rem;margin:0;">' + (msg || '') + '</p>' +
        '<a href="categoria.html" style="display:inline-block;margin-top:14px;color:var(--ddn-wine);font-weight:600;text-decoration:underline;">Explore todas as experiências</a>' +
      '</div>';
  }

  // ===== Renderiza vitrine real (campaign_overrides) =====
  async function renderVitrine() {
    var grid = document.getElementById('ddn-grid');
    if (!grid) return;

    console.info('[DDN] renderVitrine: aguardando supabaseClient…');
    var sb = await waitForSupabase(5000);
    if (!sb) {
      console.error('[DDN] supabaseClient não disponível após 5s');
      renderErrorState(grid, 'Conexão indisponível.');
      return;
    }
    console.info('[DDN] supabaseClient pronto, carregando overrides…');

    try {
      var { data: overrides, error: oErr } = await sb
        .from('campaign_overrides')
        .select('id, experience_id, titulo_custom, badge_text, display_order, imagem_custom')
        .eq('campaign_slug', CAMPAIGN_SLUG)
        .eq('is_featured', true)
        .order('display_order', { ascending: true });

      if (oErr) {
        console.error('[DDN] overrides erro:', oErr);
        renderErrorState(grid, oErr.message);
        return;
      }
      console.info('[DDN] overrides retornou:', overrides && overrides.length, 'destaques');

      // Landing mostra SÓ 3 — premium e curado. Resto fica em
      // dia-dos-namorados-todas.html (catalogo completo). Botao "Ver
      // todas" aparece quando ha mais de 3 (cliente sabe que tem mais).
      var totalFeatured = overrides ? overrides.length : 0;
      if (overrides && overrides.length > 3) overrides = overrides.slice(0, 3);
      var verTodasBtn = document.getElementById('ddn-ver-todas');
      if (verTodasBtn && totalFeatured > 3) verTodasBtn.style.display = 'inline-flex';

      if (!overrides || !overrides.length) {
        renderEmptyState(grid);
        return;
      }

      var expIds = overrides.map(function (o) { return o.experience_id; });

      // Janela DDN: campanha de Dia dos Namorados (12 de junho no BR).
      // Antes era "dia 25 do mes atual ate dia 25 do mes seguinte", o
      // que excluia o proprio 12/06 quando o admin abria a pagina
      // DEPOIS de 25/06 — sintoma: experiencia com data 12 de junho
      // aparecia como "sem data disponivel". Agora a janela eh fixa:
      // 25/05 ate 25/07 do ano corrente (com rollover pra ano seguinte
      // se a data ja passou de 25/07).
      var _now = new Date();
      var _ddnYear = _now.getFullYear();
      if (_now > new Date(_ddnYear, 6, 25)) _ddnYear += 1;
      var DDN_START = new Date(_ddnYear, 4, 25).toISOString();   // 25 de maio
      var DDN_END   = new Date(_ddnYear, 6, 25).toISOString();   // 25 de julho
      // Adicionalmente, descarta slots que ja sao passado (mesmo dentro
      // da janela): cliente nao consegue reservar pra data passada.
      var _nowIso = _now.toISOString();

      var [expsRes2, slotsRes] = await Promise.all([
        sb.from('experiences')
          .select('id, nome, categoria, preco, duracao, bairro, imagem, vagas_total, vagas_restantes, is_active')
          .in('id', expIds)
          .eq('is_active', true),
        // Slots disponíveis NA JANELA DDN (não absolutos)
        sb.from('experience_slots')
          .select('experience_id, event_at, vagas_total, vagas_restantes')
          .in('experience_id', expIds)
          .not('is_active', 'is', false)
          .gte('event_at', _nowIso < DDN_START ? DDN_START : _nowIso)
          .lt('event_at', DDN_END)
          .order('event_at', { ascending: true })
          .range(0, 9999),
      ]);
      var exps = expsRes2.data;
      var eErr = expsRes2.error;

      if (eErr) {
        console.error('[DDN] experiences erro:', eErr);
        renderErrorState(grid, eErr.message);
        return;
      }
      console.info('[DDN] experiences retornou:', exps && exps.length, 'ativas (de', expIds.length, 'overrides)');

      // Mapa: experience_id → primeira data DENTRO da janela DDN
      var firstDateInDDN = new Map();
      (slotsRes.data || []).forEach(function (s) {
        if (firstDateInDDN.has(s.experience_id)) return;
        var rest = s.vagas_total == null ? null : (s.vagas_restantes != null ? s.vagas_restantes : s.vagas_total);
        if (rest !== null && rest <= 0) return; // pula esgotados
        firstDateInDDN.set(s.experience_id, s.event_at);
      });

      var expById = new Map();
      (exps || []).forEach(function (e) { expById.set(e.id, e); });

      // Ordena overrides por data cronologica do primeiro slot na
      // janela DDN. Overrides sem slot disponivel (ja passou tudo OU
      // nunca teve slot) vao pro final — eles serao filtrados na
      // proxima etapa antes de renderizar.
      var orderedOverrides = (overrides || []).slice().sort(function (a, b) {
        var da = firstDateInDDN.get(a.experience_id);
        var db = firstDateInDDN.get(b.experience_id);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return new Date(da).getTime() - new Date(db).getTime();
      });

      // Filtra overrides sem proxima data na janela DDN — sao casos de
      // experiencia que ja passou (slots todos no passado) ou que nunca
      // teve slot agendado nessa janela. Cliente nao consegue reservar,
      // entao nao faz sentido mostrar.
      orderedOverrides = orderedOverrides.filter(function (o) {
        if (!firstDateInDDN.has(o.experience_id)) {
          console.info('[DDN] ocultando override sem data futura na janela:', o.experience_id);
          return false;
        }
        return true;
      });

      var cardsHtml = orderedOverrides.map(function (o) {
        var e = expById.get(o.experience_id);
        if (!e) {
          console.warn('[DDN] override aponta pra experience inativa/inexistente:', o.experience_id);
          return '';
        }
        var titulo = (o.titulo_custom && o.titulo_custom.trim()) || e.nome;
        var badge = (o.badge_text && o.badge_text.trim()) || 'Especial Dia dos Namorados';
        // Padronização: usa formatPrecoBR pra garantir "R$ 248" / "R$ 1.290"
        var preco = (window.ElarahData && ElarahData.formatPrecoBR)
          ? ElarahData.formatPrecoBR(e.preco)
          : (e.preco || '');

        // Proxima data NA JANELA DDN. Vai pra cima da imagem como
        // badge (mesmo padrao dos cards normais de categoria.html),
        // pra cliente nao precisar clicar pra ver a data.
        var nextDateInDDN = firstDateInDDN.get(e.id);
        var dataBadge = '';
        if (nextDateInDDN) {
          var dt = new Date(nextDateInDDN);
          var labelData = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          var wd = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          dataBadge = '<span class="ddn-card__date-badge" style="position:absolute;top:14px;right:14px;display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:rgba(255,255,255,0.95);color:#a4332b;border-radius:999px;font-size:.78rem;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.12);z-index:2;">📅 ' + esc(wd) + ', ' + esc(labelData) + '</span>';
        }

        var meta = [];
        if (e.duracao) meta.push('<span class="ddn-card__meta-item">' + esc(e.duracao) + '</span>');
        if (e.bairro) meta.push('<span class="ddn-card__meta-item">' + esc(e.bairro) + '</span>');
        if (e.vagas_total) meta.push('<span class="ddn-card__meta-item">' + esc(e.vagas_total) + ' vagas</span>');

        // Foto: prioriza imagem_custom do override (foto específica da
        // campanha) → fallback pra imagem original da experiência →
        // placeholder colorido.
        var fotoUrl = (o.imagem_custom && o.imagem_custom.trim()) || e.imagem || '';
        var media = fotoUrl
          ? '<img src="' + esc(fotoUrl) + '" alt="' + esc(titulo) + '" onerror="this.style.display=\'none\';this.parentNode.querySelector(\'.ddn-card__placeholder\').style.display=\'flex\';">' +
            '<div class="ddn-card__placeholder" style="display:none;">' + esc(e.categoria || 'Experiência') + '</div>'
          : '<div class="ddn-card__placeholder">' + esc(e.categoria || 'Experiência') + '</div>';

        return '<article class="ddn-card">' +
          '<div class="ddn-card__media" style="position:relative;">' +
            '<span class="ddn-card__badge">' + esc(badge) + '</span>' +
            dataBadge +
            media +
          '</div>' +
          '<div class="ddn-card__body">' +
            (e.categoria ? '<span class="ddn-card__categoria">' + esc(e.categoria) + '</span>' : '') +
            '<h3 class="ddn-card__title">' + esc(titulo) + '</h3>' +
            (meta.length ? '<div class="ddn-card__meta">' + meta.join('') + '</div>' : '') +
            '<div class="ddn-card__price">' +
              '<div>' +
                '<div class="ddn-card__price-label">A partir de</div>' +
                '<div class="ddn-card__price-value">' + esc(preco) + '</div>' +
              '</div>' +
              '<a href="dia-dos-namorados-detalhe.html?id=' + encodeURIComponent(e.id) + '" class="ddn-card__price-cta">Ver experiência →</a>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).filter(Boolean).join('');

      if (!cardsHtml) {
        console.warn('[DDN] todos os overrides apontam pra experiences inativas — empty state');
        renderEmptyState(grid);
        return;
      }
      grid.innerHTML = cardsHtml;
      console.info('[DDN] vitrine renderizada OK');
    } catch (err) {
      console.error('[DDN] renderVitrine exception:', err);
      renderErrorState(grid, err && err.message ? err.message : '');
    }
  }

  // ===== Renderiza "em breve" real =====
  async function renderUpcoming() {
    var section = document.querySelector('.ddn-upcoming__grid');
    if (!section) return;
    var sb = await waitForSupabase(5000);
    if (!sb) {
      console.error('[DDN] supabaseClient indisponível pra upcoming');
      return;
    }

    try {
      var { data, error } = await sb
        .from('campaign_upcoming_experiences')
        .select('*')
        .eq('campaign_slug', CAMPAIGN_SLUG)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[DDN] upcoming erro:', error);
        return;
      }
      console.info('[DDN] upcoming retornou:', data && data.length, 'cards');

      if (!data || !data.length) {
        section.parentElement.parentElement.style.display = 'none';
        return;
      }

      section.innerHTML = data.map(function (r) {
        // Foto grande retangular no topo. Fallback pra ícone se sem imagem.
        var iconDefault = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8c-3 6-3 9 0 12s3 6 0 12-3 6 0 8"/><path d="M14 28a10 10 0 0 0 20 0c0-5-5-9-10-14-5 5-10 9-10 14z"/></svg>';
        var mediaHtml = r.imagem
          ? '<img src="' + esc(r.imagem) + '" alt="' + esc(r.nome) + '" onerror="this.style.display=\'none\';this.parentNode.querySelector(\'.ddn-upcoming-card__media-placeholder\').style.display=\'flex\';"><div class="ddn-upcoming-card__media-placeholder" style="display:none;">' + iconDefault + '</div>'
          : '<div class="ddn-upcoming-card__media-placeholder">' + iconDefault + '</div>';
        return '<article class="ddn-upcoming-card">' +
          '<div class="ddn-upcoming-card__media">' + mediaHtml + '</div>' +
          '<div class="ddn-upcoming-card__body">' +
            '<div class="ddn-upcoming-card__status">' + esc(r.expected_label || 'em breve') + '</div>' +
            '<h3 class="ddn-upcoming-card__title">' + esc(r.nome) + '</h3>' +
            (r.descricao_curta
              ? '<p class="ddn-upcoming-card__desc">' + esc(r.descricao_curta) + '</p>'
              : '<p class="ddn-upcoming-card__desc"></p>') +
            '<button type="button" class="ddn-upcoming-card__cta" data-ddn-waitlist data-upcoming-id="' + esc(r.id) + '" data-upcoming-name="' + esc(r.nome) + '">' +
              'Avise-me quando abrir' +
            '</button>' +
          '</div>' +
        '</article>';
      }).join('');

      wireWaitlistButtons();
      console.info('[DDN] upcoming renderizado OK');
    } catch (err) {
      console.error('[DDN] renderUpcoming exception:', err);
    }
  }

  // ===== Modal de waitlist =====
  var modal      = document.getElementById('ddn-waitlist-modal');
  var closeBtn   = document.getElementById('ddn-waitlist-close');
  var form       = document.getElementById('ddn-waitlist-form');
  var subEl      = document.getElementById('ddn-waitlist-sub');
  var hiddenName = document.getElementById('ddn-waitlist-upcoming-name');
  var formSec    = document.getElementById('ddn-waitlist-form-section');
  var successSec = document.getElementById('ddn-waitlist-success-section');
  var currentUpcomingId = null;
  var currentUpcomingName = null;

  function openModal(upcomingName, upcomingId) {
    if (!modal) return;
    currentUpcomingId = upcomingId || null;
    currentUpcomingName = upcomingName || null;
    if (hiddenName) hiddenName.value = upcomingName || '';
    if (subEl) {
      subEl.innerHTML = upcomingName
        ? 'Deixe seu e-mail e a gente te avisa assim que <strong>' + esc(upcomingName) + '</strong> abrir reservas.'
        : 'Deixe seu e-mail e a gente te avisa assim que essa experiência abrir reservas.';
    }
    if (formSec) formSec.style.display = '';
    if (successSec) successSec.style.display = 'none';
    if (form) form.reset();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var nomeInput = document.getElementById('ddn-waitlist-nome');
      if (nomeInput) nomeInput.focus();
    }, 200);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function wireWaitlistButtons() {
    document.querySelectorAll('[data-ddn-waitlist]').forEach(function (btn) {
      if (btn.__wired) return;
      btn.__wired = true;
      btn.addEventListener('click', function () {
        openModal(btn.dataset.upcomingName || '', btn.dataset.upcomingId || '');
      });
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  // ===== Submit (grava no banco) =====
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var sb = window.supabaseClient;
      if (!sb) {
        alert('Conexão indisponível. Tente novamente em alguns segundos.');
        return;
      }
      var nome = document.getElementById('ddn-waitlist-nome').value.trim();
      var email = document.getElementById('ddn-waitlist-email').value.trim();
      var tel = document.getElementById('ddn-waitlist-tel').value.trim();
      if (!email || email.length < 5) {
        alert('Informe um e-mail válido.');
        return;
      }
      // Telefone obrigatório — comercial precisa contactar leads
      var telDigits = String(tel || '').replace(/\D+/g, '');
      if (telDigits.length < 10) {
        alert('Telefone obrigatório (com DDD). Ex: (11) 91234-5678');
        var telInput = document.getElementById('ddn-waitlist-tel');
        if (telInput) telInput.focus();
        return;
      }

      var submitBtn = form.querySelector('.ddn-waitlist-modal__submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';
      }

      try {
        var payload = {
          campaign_slug: CAMPAIGN_SLUG,
          email: email,
          nome: nome || null,
          telefone: tel || null,
          upcoming_id: currentUpcomingId || null,
          mensagem: currentUpcomingName ? ('Interesse em: ' + currentUpcomingName) : null,
          source: 'landing-ddn',
        };
        var { error } = await sb.from('campaign_waitlist').insert(payload);
        if (error) {
          console.error('[DDN] waitlist insert error:', error);
          alert('Não foi possível registrar agora. Tente em alguns minutos.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar na lista de espera';
          }
          return;
        }
        if (formSec) formSec.style.display = 'none';
        if (successSec) successSec.style.display = '';
      } catch (err) {
        console.error('[DDN] waitlist exception:', err);
        alert('Erro inesperado. Tente novamente.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar na lista de espera';
        }
      }
    });
  }

  // ===== Boot =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderVitrine();
      renderUpcoming();
      wireWaitlistButtons();
    });
  } else {
    renderVitrine();
    renderUpcoming();
    wireWaitlistButtons();
  }
})();
