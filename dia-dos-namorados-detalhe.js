// =============================================================
// ELARAH — Dia dos Namorados (página de detalhe da campanha)
// -------------------------------------------------------------
// Lê dados REAIS da experiência + customizações do campaign_overrides:
//   - foto, título, subtítulo, descrição custom da campanha
//   - preço, vagas, duração, bairro: dados reais
//   - chips de data filtrados pela janela DDN
//   - botão Reservar dispara o mesmo modal global do site
//     (data-reserve + atributos pra startCheckout)
// =============================================================
(function () {
  'use strict';

  var CAMPAIGN_SLUG = 'dia-dos-namorados';
  // Janela DINÂMICA: dia 25 do mês atual até dia 25 do mês seguinte
  // (mesma regra do admin pra consistência).
  var _now = new Date();
  // Janela DDN fixa: 25/05 ate 25/07 do ano da campanha. Rollover
  // pra ano seguinte se passou de 25/07. Sintoma quando estava
  // dinamica "mes corrente": 12/06 (data oficial DDN) nao aparecia
  // pra quem abria a pagina depois de 25/06.
  var _ddnYear = _now.getFullYear();
  if (_now > new Date(_ddnYear, 6, 25)) _ddnYear += 1;
  var DDN_START = new Date(_ddnYear, 4, 25);
  var DDN_END   = new Date(_ddnYear, 6, 25);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function waitForSupabase(ms) {
    return new Promise(function (resolve) {
      var elapsed = 0;
      (function check() {
        if (window.supabaseClient) return resolve(window.supabaseClient);
        elapsed += 100;
        if (elapsed >= (ms || 5000)) return resolve(null);
        setTimeout(check, 100);
      })();
    });
  }

  async function load() {
    var container = document.getElementById('ddn-det-content');
    if (!container) return;

    var urlParams = new URLSearchParams(window.location.search);
    var expId = urlParams.get('id');
    if (!expId) {
      container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Link inválido</h2><p><a href="dia-dos-namorados.html">Voltar para a campanha</a></p></div>';
      return;
    }

    var sb = await waitForSupabase(5000);
    if (!sb) {
      container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><p>Conexão indisponível. Recarregue a página.</p></div>';
      return;
    }

    // 1. Carrega tudo em paralelo
    var [expRes, overrideRes, slotsRes] = await Promise.all([
      sb.from('experiences')
        .select('*')
        .eq('id', expId)
        .eq('is_active', true)
        .maybeSingle(),
      sb.from('campaign_overrides')
        .select('*')
        .eq('campaign_slug', CAMPAIGN_SLUG)
        .eq('experience_id', expId)
        .maybeSingle(),
      sb.from('experience_slots')
        .select('*')
        .eq('experience_id', expId)
        .not('is_active', 'is', false)
        .gte('event_at', DDN_START.toISOString())
        .lt('event_at', DDN_END.toISOString())
        .order('event_at', { ascending: true })
        .range(0, 999),
    ]);

    if (!expRes.data) {
      container.innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2>Experiência não encontrada</h2><p><a href="dia-dos-namorados.html">Voltar</a></p></div>';
      return;
    }

    var exp = expRes.data;
    var override = overrideRes.data || {};
    var slots = (slotsRes.data || []).filter(function (s) {
      if (s.vagas_total == null) return true;
      var rest = s.vagas_restantes != null ? s.vagas_restantes : s.vagas_total;
      return rest > 0;
    });

    // 2. Define campos: usa custom da campanha quando preenchido,
    //    senão fallback pra dado real da experiência
    var foto       = (override.imagem_custom && override.imagem_custom.trim()) || exp.imagem || '';
    var titulo     = (override.titulo_custom && override.titulo_custom.trim()) || exp.nome;
    var subtitulo  = (override.subtitulo_custom && override.subtitulo_custom.trim()) || '';
    var descricao  = (override.descricao_custom && override.descricao_custom.trim()) || exp.descricao || '';
    var badge      = (override.badge_text && override.badge_text.trim()) || 'Especial Dia dos Namorados';

    // 3. Atualiza title + meta
    document.getElementById('page-title').textContent = titulo + ' — Dia dos Namorados · Elarah';
    var metaDesc = document.getElementById('meta-desc');
    if (metaDesc) metaDesc.content = (subtitulo || descricao || titulo).slice(0, 160);

    // 4. Renderiza
    var heroImgHtml = foto
      ? '<img class="ddn-det__hero-img" src="' + esc(foto) + '" alt="' + esc(titulo) + '">'
      : '';

    var precoFmt = (window.ElarahData && ElarahData.formatPrecoBR && exp.preco)
      ? ElarahData.formatPrecoBR(exp.preco)
      : (exp.preco || '');

    var metaItems = '';
    if (exp.duracao) {
      metaItems +=
        '<li>' +
          '<span class="ddn-det__meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>' +
          '<span class="ddn-det__meta-text"><span class="ddn-det__meta-label">Duração</span><span class="ddn-det__meta-value">' + esc(exp.duracao) + '</span></span>' +
        '</li>';
    }
    if (exp.bairro) {
      metaItems +=
        '<li>' +
          '<span class="ddn-det__meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></span>' +
          '<span class="ddn-det__meta-text"><span class="ddn-det__meta-label">Onde acontece</span><span class="ddn-det__meta-value">' + esc(exp.bairro) + (exp.endereco ? ' · ' + esc(exp.endereco) : '') + '</span></span>' +
        '</li>';
    }
    if (exp.vagas_total) {
      metaItems +=
        '<li>' +
          '<span class="ddn-det__meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg></span>' +
          '<span class="ddn-det__meta-text"><span class="ddn-det__meta-label">Turma</span><span class="ddn-det__meta-value">' + esc(exp.vagas_total) + ' vagas no total</span></span>' +
        '</li>';
    }

    // Schedule (data → horário)
    var scheduleHtml = '';
    if (slots.length) {
      var byDate = {};
      var dateOrder = [];
      slots.forEach(function (s) {
        var d = new Date(s.event_at);
        var key = d.toISOString().slice(0, 10);
        if (!byDate[key]) {
          byDate[key] = {
            key: key, dt: d,
            wd: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
            dm: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
            slots: [],
          };
          dateOrder.push(key);
        }
        byDate[key].slots.push(s);
      });

      var datasHtml = dateOrder.map(function (k, i) {
        var g = byDate[k];
        return '<button type="button" class="ddn-det__data-btn' + (i === 0 ? ' ddn-det__data-btn--active' : '') + '" data-date-key="' + esc(k) + '">' +
          '<strong>' + esc(g.wd) + '</strong><small>' + esc(g.dm) + '</small>' +
        '</button>';
      }).join('');

      function horariosForDate(k) {
        var g = byDate[k];
        if (!g) return '';
        var picked = false;
        return g.slots.map(function (s) {
          var rest = s.vagas_total == null ? null : (s.vagas_restantes != null ? s.vagas_restantes : s.vagas_total);
          var soldOut = rest !== null && rest <= 0;
          var active = !soldOut && !picked;
          if (active) picked = true;
          return '<button type="button" class="ddn-det__horario-btn' +
            (active ? ' ddn-det__horario-btn--active' : '') +
            (soldOut ? ' ddn-det__horario-btn--sold-out' : '') + '"' +
            (soldOut ? ' disabled' : '') +
            ' data-horario="' + esc(s.horario) + '"' +
            ' data-data="' + esc(s.data || g.dm) + '"' +
            ' data-data-label="' + esc(g.wd + ', ' + g.dm) + '"' +
            ' data-slot-id="' + esc(s.id) + '">' +
            esc(s.horario) + (soldOut ? ' (esgotado)' : '') +
          '</button>';
        }).join('');
      }

      scheduleHtml =
        '<div class="ddn-det__schedule-block">' +
          '<div class="ddn-det__schedule-label">Escolha uma data</div>' +
          '<div class="ddn-det__datas">' + datasHtml + '</div>' +
        '</div>' +
        '<div class="ddn-det__schedule-block">' +
          '<div class="ddn-det__schedule-label">Escolha um horário</div>' +
          '<div class="ddn-det__horarios" id="ddn-det-horarios">' + horariosForDate(dateOrder[0]) + '</div>' +
        '</div>';

      // Expõe globalmente pra wire posterior
      window.__ddnDetData = { byDate: byDate, dateOrder: dateOrder, horariosForDate: horariosForDate };
    } else {
      scheduleHtml = '<div style="background:#fdecea;color:#a4332b;padding:14px;border-radius:10px;font-size:.88rem;text-align:center;">Sem datas disponíveis na campanha do Dia dos Namorados. <a href="experiencia.html?id=' + esc(expId) + '" style="color:var(--ddn-wine);font-weight:600;">Ver todas as datas →</a></div>';
    }

    // CTA "fechar em grupo" — mesma captura de demanda (aniversário/
    // empresa/turma privada) da página padrão (experiencia.html). Aqui a
    // página de detalhe é própria, então replicamos o box com estilo inline
    // pra manter o visual verde do WhatsApp sem depender do CSS externo.
    var _waGroupMsg = 'Olá! Quero fechar a experiência "' + (titulo || '') +
      '" para um grupo / turma privada. Pode me ajudar com datas e valores?';
    var _waSvg = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;flex-shrink:0;color:#25D366;"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4 0-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>';
    var groupHtml =
      '<a class="ddn-det__group-cta" target="_blank" rel="noopener"' +
        ' href="https://wa.me/5511914455930?text=' + encodeURIComponent(_waGroupMsg) + '"' +
        ' data-analytics="group_whatsapp_click" data-analytics-category="booking"' +
        ' data-analytics-label="' + esc(titulo || '') + '"' +
        ' style="display:flex;align-items:center;gap:11px;margin-top:14px;padding:12px 14px;border:1px solid #d8efe0;background:#f3fbf6;border-radius:12px;text-decoration:none;color:#2c5a43;font-size:.8rem;line-height:1.35;">' +
        _waSvg +
        '<span><strong style="color:#147a40;">Quer fechar em grupo?</strong> Aniversário, empresa ou turma privada — chama a gente no WhatsApp.</span>' +
      '</a>';

    container.innerHTML =
      '<a href="dia-dos-namorados.html" class="ddn-det__back">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        'Voltar para a campanha' +
      '</a>' +
      '<section class="ddn-det__hero">' +
        heroImgHtml +
        '<div class="ddn-det__hero-overlay"></div>' +
        '<div class="ddn-det__hero-body">' +
          '<span class="ddn-det__badge">' + esc(badge) + '</span>' +
          '<h1 class="ddn-det__titulo">' + esc(titulo) + '</h1>' +
          (subtitulo ? '<p class="ddn-det__subtitulo">' + esc(subtitulo) + '</p>' : '') +
        '</div>' +
      '</section>' +
      '<div class="ddn-det__grid">' +
        '<div class="ddn-det__content">' +
          (descricao ? '<section><h2 class="ddn-det__section-title">Sobre essa experiência</h2><div class="ddn-det__narrativa">' + esc(descricao) + '</div></section>' : '') +
          (exp.inclui ? '<section class="ddn-det__includes"><div class="ddn-det__includes-label">O que está incluso</div><div class="ddn-det__includes-text">' + esc(exp.inclui) + '</div></section>' : '') +
        '</div>' +
        '<aside class="ddn-det__sidebar">' +
          (precoFmt ? '<div class="ddn-det__preco"><span class="ddn-det__preco-label">A partir de</span><span class="ddn-det__preco-value">' + esc(precoFmt) + '</span></div>' : '') +
          (metaItems ? '<ul class="ddn-det__meta-list">' + metaItems + '</ul>' : '') +
          scheduleHtml +
          '<button type="button" id="ddn-det-reservar" class="ddn-det__reservar"' +
            ' data-reserve' +
            ' data-skip-description="true"' +
            ' data-experience-id="' + esc(exp.id) + '"' +
            ' data-experience-nome="' + esc(titulo) + '"' +
            ' data-experience-preco="' + esc(exp.preco || '') + '"' +
            ' data-analytics="reserve_click"' +
            ' data-analytics-category="booking"' +
            ' data-analytics-label="' + esc(titulo) + '"' +
          '>Reservar nosso momento</button>' +
          '<a href="experiencia.html?id=' + esc(exp.id) + '" class="ddn-det__back-all">Ver todas as datas da experiência</a>' +
          groupHtml +
        '</aside>' +
      '</div>';

    // Wire chips de data → re-renderiza horários
    container.querySelectorAll('.ddn-det__data-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.ddn-det__data-btn').forEach(function (b) {
          b.classList.remove('ddn-det__data-btn--active');
        });
        btn.classList.add('ddn-det__data-btn--active');
        var key = btn.dataset.dateKey;
        var horariosEl = document.getElementById('ddn-det-horarios');
        if (horariosEl && window.__ddnDetData) {
          horariosEl.innerHTML = window.__ddnDetData.horariosForDate(key);
          wireHorarios();
          syncReserveBtn();
        }
      });
    });

    function wireHorarios() {
      container.querySelectorAll('.ddn-det__horario-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          container.querySelectorAll('.ddn-det__horario-btn').forEach(function (b) {
            b.classList.remove('ddn-det__horario-btn--active');
          });
          btn.classList.add('ddn-det__horario-btn--active');
          syncReserveBtn();
        });
      });
    }

    function syncReserveBtn() {
      var reserveBtn = document.getElementById('ddn-det-reservar');
      if (!reserveBtn) return;
      var activeH = container.querySelector('.ddn-det__horario-btn--active:not([disabled])');
      if (activeH) {
        reserveBtn.dataset.horario = activeH.dataset.horario || '';
        reserveBtn.dataset.data = activeH.dataset.data || '';
        reserveBtn.dataset.dataLabel = activeH.dataset.dataLabel || '';
        reserveBtn.dataset.slotId = activeH.dataset.slotId || '';
      }
    }

    wireHorarios();
    syncReserveBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
