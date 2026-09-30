/* =============================================================
   ELARAH — Trocar a reserva sozinha (Minhas compras)
   -------------------------------------------------------------
   Antes a cliente pedia a troca de data no WhatsApp. Agora, dentro do
   prazo de remarcação sem custo, ela troca aqui mesmo:

     1. "Mesma experiência, outra data" → datas à venda no site.
     2. "Outra experiência"             → experiências à venda no site com
        preço igual ou menor que o da compra, e a data de cada uma.

   Só MOSTRA opções — quem decide é a Edge Function cliente-trocar-reserva,
   que confere prazo, vaga, preço e dono da reserva de novo no servidor.
   A Elarah vê cada troca na aba "Trocas e reembolsos" do painel e avisa
   a(s) parceira(s) por lá.

   Reembolso continua sendo com a Elarah: ElarahTrocas.pedirReembolso
   registra o pedido (pra aparecer na mesma aba) enquanto o link abre o
   WhatsApp.

   Autocontido: injeta o próprio CSS. Depende de window.ElarahData
   (experiences-data.js) e window.supabaseClient.
   ============================================================= */
(function (window, document) {
  'use strict';

  var MAX_DATAS = 40;
  var HORA = 3600000;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function D() { return window.ElarahData || null; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // "DD/MM" no fuso de SP (UTC-3) — mesmo rótulo que a reserva guarda.
  function ddmm(ts) {
    var sp = new Date(ts - 3 * HORA);
    return pad(sp.getUTCDate()) + '/' + pad(sp.getUTCMonth() + 1);
  }

  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  function diaSemana(ts) {
    return DIAS[new Date(ts - 3 * HORA).getUTCDay()];
  }

  function normHorario(v) {
    return String(v == null ? '' : v).replace(/[–—]/g, '-').replace(/[\s-]/g, '').toLowerCase();
  }

  // Mesma leitura de preço do servidor (último número do texto, formato BR).
  function precoCentavos(raw) {
    if (raw == null) return null;
    var s = String(raw).replace(/\s/g, '').replace(/^R\$/i, '').replace(/^[^\d]+/, '');
    if (!s) return null;
    var n = Number(s.indexOf(',') !== -1 ? s.replace(/\./g, '').replace(',', '.') : s.replace(/\./g, ''));
    if (!isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }

  function precoLabel(exp) {
    var d = D();
    var p = d && d.precoVigente ? d.precoVigente(exp) : exp.preco;
    return d && d.formatPrecoBR ? d.formatPrecoBR(p) : String(p || '');
  }

  function temVariacoes(exp) {
    return (Array.isArray(exp.variantItems) && exp.variantItems.length > 0) ||
      (Array.isArray(exp.variantOptions) && exp.variantOptions.length > 0);
  }

  function chaveTexto(v) {
    var t = String(v == null ? '' : v);
    if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // "Gêmea" da experiência comprada: outra ficha com o MESMO nome e a
  // MESMA parceira (ex.: a mesma aula cadastrada em duas abas, cada uma com
  // uma data pontual). Pra cliente é a mesma experiência, então as datas
  // dela entram em "Mesma experiência, outra data" — e não na lista de
  // "Outra experiência", onde apareceria repetida com o mesmo nome.
  function ehGemea(exp, booking, atual) {
    if (!exp || exp.id === booking.experiencia_id) return false;
    var nomeRef = atual ? atual.nome : booking.experiencia_nome;
    if (chaveTexto(exp.nome) !== chaveTexto(nomeRef)) return false;
    var fRef = atual ? atual.fornecedorNome : null;
    return !fRef || chaveTexto(exp.fornecedorNome) === chaveTexto(fRef);
  }

  // Pode ser DESTINO de troca pra outra ficha: o servidor recusa as demais.
  function podeSerDestino(exp, precoMax) {
    if (!exp || exp.arquivada || exp.isActive === false || exp.horarioFuncionamento || isKit(exp) || temVariacoes(exp)) return false;
    var p = precoCentavos(exp.preco);
    return !!(p && precoMax && p <= precoMax);
  }

  function precoMaxDe(booking) {
    return Math.max(precoCentavos(booking.preco_label) || 0,
      Number(booking.metadata && booking.metadata.unit_price_centavos) || 0);
  }

  function isKit(exp) {
    var d = D();
    return !!(d && d.isHomeKit && d.isHomeKit(exp));
  }

  // Datas em que a experiência está À VENDA no site pra `qty` pessoas:
  // turma ativa, antes do encerramento de vendas (cutoff) e com vaga.
  // Sem turmas cadastradas, usa a data/horários da própria experiência.
  function datasAVenda(exp, slots, qty, booking) {
    var d = D();
    var now = Date.now();
    var cutoffMs = (d && d.effectiveCutoffHours ? d.effectiveCutoffHours(exp) : 24) * HORA;
    var out = [];
    var ativos = (slots || []).filter(function (s) { return s && s.isActive !== false; });
    if (ativos.length) {
      ativos.forEach(function (s) {
        var ts = s.eventAt ? new Date(s.eventAt).getTime() : NaN;
        if (!isFinite(ts)) ts = d.deriveEventTimestamp(s.data, s.horario, now);
        if (ts == null || !isFinite(ts)) return;
        if (now + cutoffMs > ts) return;
        if (s.vagasTotal != null && (s.vagasRestantes == null || s.vagasRestantes < qty)) return;
        if (booking.slot_id && s.id === booking.slot_id) return;
        out.push({ exp: exp, slotId: s.id, data: String(s.data || '').trim() || ddmm(ts), horario: s.horario || '', ts: ts });
      });
    } else if (exp.data) {
      if (exp.vagasTotal != null && (exp.vagasRestantes == null || exp.vagasRestantes < qty)) return [];
      (exp.horarios && exp.horarios.length ? exp.horarios : [exp.horario]).forEach(function (h) {
        if (!h) return;
        var ts = exp.eventAt ? new Date(exp.eventAt).getTime() : NaN;
        if (!isFinite(ts)) ts = d.deriveEventTimestamp(exp.data, h, now);
        if (ts == null || !isFinite(ts)) return;
        if (now + cutoffMs > ts) return;
        if (exp.id === booking.experiencia_id && !booking.slot_id &&
            String(booking.data || '').trim() === String(exp.data).trim() &&
            normHorario(booking.horario) === normHorario(h)) return;
        out.push({ exp: exp, slotId: null, data: String(exp.data).trim(), horario: h, ts: ts });
      });
    }
    out.sort(function (a, b) { return a.ts - b.ts; });
    return out.slice(0, MAX_DATAS);
  }

  // ===== CSS =====
  function injetarCss() {
    if (document.getElementById('troca-css')) return;
    var css = [
      '.troca-overlay{position:fixed;inset:0;background:rgba(20,16,12,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center;}',
      '@media(min-width:640px){.troca-overlay{align-items:center;}}',
      '.troca-modal{background:#fff;width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:20px 18px 22px;box-sizing:border-box;font-family:inherit;color:#2b2420;}',
      '@media(min-width:640px){.troca-modal{border-radius:18px;padding:24px;}}',
      '.troca-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;}',
      '.troca-title{font-size:1.08rem;font-weight:700;margin:0;line-height:1.3;}',
      '.troca-sub{font-size:.8rem;color:#7a6f68;margin:4px 0 0;line-height:1.45;}',
      '.troca-x{background:none;border:0;font-size:1.4rem;line-height:1;cursor:pointer;color:#7a6f68;padding:2px 6px;}',
      '.troca-opcoes{display:grid;gap:10px;margin-top:6px;}',
      '.troca-opcao{display:block;width:100%;text-align:left;border:1.5px solid #eadfd6;background:#fffaf6;border-radius:12px;padding:13px 14px;cursor:pointer;font:inherit;color:inherit;}',
      '.troca-opcao:hover,.troca-opcao:focus-visible{border-color:#e07b39;}',
      '.troca-opcao strong{display:block;font-size:.92rem;margin-bottom:2px;}',
      '.troca-opcao span{font-size:.78rem;color:#7a6f68;}',
      '.troca-opcao--link{background:#fff;}',
      '.troca-voltar{background:none;border:0;color:#e07b39;font:inherit;font-size:.82rem;font-weight:600;cursor:pointer;padding:0;margin-bottom:10px;}',
      '.troca-busca{width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #ddd;border-radius:10px;font:inherit;font-size:.86rem;margin-bottom:10px;}',
      '.troca-lista{display:grid;gap:8px;}',
      '.troca-exp{border:1px solid #eee;border-radius:12px;padding:10px 12px;cursor:pointer;background:#fff;text-align:left;font:inherit;color:inherit;width:100%;display:flex;gap:10px;align-items:center;}',
      '.troca-exp:hover{border-color:#e07b39;}',
      '.troca-exp img{width:48px;height:48px;border-radius:8px;object-fit:cover;flex:none;background:#f3ece6;}',
      '.troca-exp b{display:block;font-size:.86rem;line-height:1.3;}',
      '.troca-exp small{display:block;font-size:.74rem;color:#7a6f68;margin-top:2px;}',
      '.troca-datas{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;}',
      '.troca-data{border:1.5px solid #eadfd6;border-radius:10px;padding:9px 10px;background:#fff;cursor:pointer;font:inherit;color:inherit;text-align:left;}',
      '.troca-data:hover{border-color:#e07b39;}',
      '.troca-data--on{border-color:#e07b39;background:#fff3ea;}',
      '.troca-data b{display:block;font-size:.86rem;}',
      '.troca-data small{font-size:.74rem;color:#7a6f68;}',
      '.troca-vazio{font-size:.84rem;color:#7a6f68;background:#faf7f4;border-radius:10px;padding:14px;line-height:1.5;}',
      '.troca-resumo{background:#faf7f4;border-radius:12px;padding:12px 14px;font-size:.84rem;line-height:1.55;margin:12px 0;}',
      '.troca-resumo p{margin:0;}',
      '.troca-aviso{font-size:.76rem;color:#8a6a2a;background:#fdf8ee;border:1px solid #efe2c8;border-radius:10px;padding:8px 10px;margin:0 0 12px;line-height:1.45;}',
      '.troca-btn{width:100%;padding:13px;border:0;border-radius:999px;background:#e07b39;color:#fff;font:inherit;font-weight:700;font-size:.92rem;cursor:pointer;}',
      '.troca-btn[disabled]{opacity:.6;cursor:default;}',
      '.troca-erro{color:#b3261e;font-size:.8rem;margin:10px 0 0;}',
      '.troca-ok{text-align:center;padding:10px 4px;}',
      '.troca-ok .troca-emoji{font-size:2.2rem;}',
      '.troca-carregando{font-size:.84rem;color:#7a6f68;padding:16px 0;text-align:center;}',
      '.troca-rodape{font-size:.74rem;color:#7a6f68;margin-top:14px;line-height:1.5;}',
      '.troca-rodape a{color:inherit;font-weight:600;}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'troca-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ===== Modal =====
  function abrir(booking, opts) {
    opts = opts || {};
    injetarCss();
    var qty = Math.max(1, Number(booking.quantidade) || 1);
    var ov = document.createElement('div');
    ov.className = 'troca-overlay';
    ov.innerHTML = '<div class="troca-modal" role="dialog" aria-modal="true" aria-labelledby="troca-title"></div>';
    var box = ov.firstChild;
    document.body.appendChild(ov);
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    var ocupado = false;
    function fechar() {
      if (ocupado) return;
      ov.remove();
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') fechar(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });

    // Reembolso fica aqui dentro (não no card): segue pro WhatsApp da
    // Elarah e registra o pedido pra aba "Trocas e reembolsos".
    var rodape = '<p class="troca-rodape">Prefere reembolso? ' +
      '<a href="' + esc(opts.reembolsoUrl || opts.whatsappUrl || 'https://wa.me/5511914455930') + '" target="_blank" rel="noopener" data-troca-reembolso>Fale com a Elarah no WhatsApp</a>.</p>';

    function topo(titulo, sub) {
      return '<div class="troca-top"><div><h2 class="troca-title" id="troca-title">' + esc(titulo) + '</h2>' +
        (sub ? '<p class="troca-sub">' + sub + '</p>' : '') + '</div>' +
        '<button type="button" class="troca-x" data-troca-fechar aria-label="Fechar">×</button></div>';
    }
    function render(html) {
      box.innerHTML = html;
      var x = box.querySelectorAll('[data-troca-fechar]');
      for (var i = 0; i < x.length; i++) x[i].addEventListener('click', fechar);
      var rb = box.querySelector('[data-troca-reembolso]');
      if (rb) rb.addEventListener('click', function () { pedirReembolso(booking.id); });
    }

    // Passo 1 — o que ela quer fazer.
    function passoInicio() {
      render(
        topo('Remarcar minha reserva',
          '<strong>' + esc(booking.experiencia_nome || 'Experiência') + '</strong> · ' +
          esc(booking.data || '') + ' ' + esc(booking.horario || '') +
          (opts.prazoTexto ? '<br>Remarcação sem custo até ' + esc(opts.prazoTexto) + '.' : '') +
          '<br><strong>Atenção:</strong> dá pra remarcar pela conta só 1 vez.') +
        '<div class="troca-opcoes">' +
          '<button type="button" class="troca-opcao" data-op="mesma"><strong>📅 Mesma experiência, outra data</strong><span>Escolha outro dia ou horário que esteja disponível.</span></button>' +
          '<button type="button" class="troca-opcao" data-op="outra"><strong>🔁 Outra experiência</strong><span>Se preferir, troque por outra experiência de valor igual ou menor.</span></button>' +
        '</div>' + rodape
      );
      box.querySelector('[data-op="mesma"]').addEventListener('click', function () { passoMesma(); });
      box.querySelector('[data-op="outra"]').addEventListener('click', function () { passoOutra(); });
    }

    function carregando(titulo) {
      render(topo(titulo) + '<p class="troca-carregando">Buscando datas disponíveis…</p>');
    }

    // Passo 2a — datas da mesma experiência.
    async function passoMesma() {
      carregando('Escolha a nova data');
      var d = D();
      try {
        var exp = d ? await d.getExperienceById(booking.experiencia_id) : null;
        var ok = exp && exp.isActive !== false && !exp.arquivada && !exp.horarioFuncionamento;
        var datas = ok ? datasAVenda(exp, await d.getSlotsForExperience(exp.id), qty, booking) : [];
        // Datas das fichas "gêmeas" (mesmo nome + mesma parceira).
        var todas = await d.getVisibleExperiences();
        var slotsMap = await d.loadAllSlots();
        var precoMax = precoMaxDe(booking);
        todas.forEach(function (g) {
          if (!ehGemea(g, booking, exp) || !podeSerDestino(g, precoMax)) return;
          datas = datas.concat(datasAVenda(g, (slotsMap && slotsMap.get(g.id)) || [], qty, booking));
        });
        datas.sort(function (a, b) { return a.ts - b.ts; });
        passoDatas(exp || { id: booking.experiencia_id, nome: booking.experiencia_nome }, datas.slice(0, MAX_DATAS), passoInicio, true);
      } catch (e) {
        console.error('[Elarah trocas] erro carregando datas', e);
        render(topo('Escolha a nova data') + '<p class="troca-vazio">Não conseguimos carregar as datas agora. Tente de novo em instantes.</p>' + rodape);
      }
    }

    // Passo 2b — outras experiências elegíveis.
    var cacheElegiveis = null;
    async function passoOutra() {
      carregando('Escolha a nova experiência');
      var d = D();
      try {
        if (!cacheElegiveis) {
          var precoMax = precoMaxDe(booking);
          var atual = await d.getExperienceById(booking.experiencia_id);
          var todas = await d.getVisibleExperiences();
          // Cache global de turmas (uma consulta paginada). Não usa
          // getSlotsForExperience aqui: pra experiência sem turma ele faz
          // uma consulta extra — uma por experiência do catálogo.
          var slotsMap = await d.loadAllSlots();
          var lista = [];
          for (var i = 0; i < todas.length; i++) {
            var e = todas[i];
            if (!e || e.id === booking.experiencia_id || ehGemea(e, booking, atual)) continue;
            if (!podeSerDestino(e, precoMax)) continue;
            var p = precoCentavos(e.preco);
            var datas = datasAVenda(e, (slotsMap && slotsMap.get(e.id)) || [], qty, booking);
            if (!datas.length) continue;
            lista.push({ exp: e, datas: datas, preco: p });
          }
          lista.sort(function (a, b) { return a.datas[0].ts - b.datas[0].ts; });
          cacheElegiveis = { lista: lista, precoMax: precoMax };
        }
        renderOutra('');
      } catch (err) {
        console.error('[Elarah trocas] erro carregando experiências', err);
        render(topo('Escolha a nova experiência') + '<p class="troca-vazio">Não conseguimos carregar as experiências agora. Tente de novo em instantes.</p>' + rodape);
      }
    }

    function renderOutra(filtro) {
      var lista = cacheElegiveis.lista;
      var f = String(filtro || '').toLowerCase().trim();
      var vis = f ? lista.filter(function (it) {
        return (it.exp.nome + ' ' + it.exp.categoria + ' ' + it.exp.bairro).toLowerCase().indexOf(f) !== -1;
      }) : lista;
      var itens = vis.map(function (it) {
        var e = it.exp;
        return '<button type="button" class="troca-exp" data-idx="' + lista.indexOf(it) + '">' +
          (e.imagem ? '<img src="' + esc(e.imagem) + '" alt="" loading="lazy">' : '<img alt="">') +
          '<span><b>' + esc(e.nome) + '</b><small>' + esc(precoLabel(e)) +
          (e.bairro ? ' · ' + esc(e.bairro) : '') + ' · ' + it.datas.length + (it.datas.length === 1 ? ' data' : ' datas') +
          '</small></span></button>';
      }).join('');
      render(
        topo('Escolha a nova experiência', 'Mostrando as experiências à venda no site com valor igual ou menor que o da sua reserva.') +
        '<button type="button" class="troca-voltar" data-voltar>← Voltar</button>' +
        (lista.length ? '<input type="search" class="troca-busca" placeholder="Buscar experiência ou bairro" value="' + esc(filtro) + '">' : '') +
        (lista.length
          ? (vis.length ? '<div class="troca-lista">' + itens + '</div>' : '<p class="troca-vazio">Nada encontrado com essa busca.</p>')
          : '<p class="troca-vazio">No momento não há outra experiência disponível com valor igual ou menor que o da sua. ' +
            'Se quiser trocar por uma mais cara, fale com a Elarah no WhatsApp pra pagar a diferença.</p>') +
        rodape
      );
      box.querySelector('[data-voltar]').addEventListener('click', passoInicio);
      var busca = box.querySelector('.troca-busca');
      if (busca) {
        busca.addEventListener('input', function () {
          var v = busca.value;
          var pos = busca.selectionStart;
          renderOutra(v);
          var nb = box.querySelector('.troca-busca');
          if (nb) { nb.focus(); try { nb.setSelectionRange(pos, pos); } catch (_) {} }
        });
      }
      var bts = box.querySelectorAll('.troca-exp');
      for (var i = 0; i < bts.length; i++) {
        bts[i].addEventListener('click', function () {
          var it = lista[Number(this.getAttribute('data-idx'))];
          passoDatas(it.exp, it.datas, function () { renderOutra(filtro); }, false, it.preco);
        });
      }
    }

    // Passo 3 — escolher a data e confirmar.
    function passoDatas(exp, datas, voltar, mesma, precoNovo) {
      var escolhida = null;
      var titulo = mesma ? 'Escolha a nova data' : (exp ? exp.nome : 'Experiência');
      var sub = mesma
        ? 'Datas de <strong>' + esc(exp ? exp.nome : booking.experiencia_nome) + '</strong> disponíveis no site' + (qty > 1 ? ' para ' + qty + ' pessoas' : '') + '.'
        : esc(precoLabel(exp)) + (exp.bairro ? ' · ' + esc(exp.bairro) : '') + (exp.duracao ? ' · ' + esc(exp.duracao) : '');
      var precoMax = cacheElegiveis ? cacheElegiveis.precoMax : 0;
      var avisoPreco = (!mesma && precoNovo && precoMax && precoNovo < precoMax)
        ? '<p class="troca-aviso">Essa experiência custa menos que a sua. A troca é feita sem devolução da diferença — se preferir reembolso, fale com a Elarah antes de confirmar.</p>'
        : '';
      function desenhar(erro) {
        var chips = datas.map(function (dt, i) {
          return '<button type="button" class="troca-data' + (escolhida === i ? ' troca-data--on' : '') + '" data-i="' + i + '">' +
            '<b>' + esc(diaSemana(dt.ts)) + ', ' + esc(dt.data) + '</b><small>' + esc(dt.horario) + '</small></button>';
        }).join('');
        var dt = escolhida != null ? datas[escolhida] : null;
        render(
          topo(titulo, sub) +
          '<button type="button" class="troca-voltar" data-voltar>← Voltar</button>' +
          (datas.length
            ? '<div class="troca-datas">' + chips + '</div>'
            : '<p class="troca-vazio">' + (mesma
              ? 'Essa experiência não tem outra data disponível no site agora. Você pode trocar por outra experiência ou falar com a Elarah no WhatsApp.'
              : 'Essa experiência não tem data disponível agora.') + '</p>') +
          (dt
            ? '<div class="troca-resumo"><p>❌ <strong>Sai:</strong> ' + esc(booking.experiencia_nome) + ' · ' + esc(booking.data) + ' ' + esc(booking.horario) + '</p>' +
              '<p>✅ <strong>Entra:</strong> ' + esc((dt.exp || exp).nome) + ' · ' + esc(dt.data) + ' ' + esc(dt.horario) + '</p>' +
              (qty > 1 ? '<p>👥 ' + qty + ' vagas</p>' : '') + '</div>' + avisoPreco +
              '<p class="troca-aviso">Depois de confirmar, essa reserva não pode ser remarcada de novo pela conta.</p>' +
              '<button type="button" class="troca-btn" data-confirmar>Confirmar remarcação</button>'
            : '') +
          (erro ? '<p class="troca-erro">' + esc(erro) + '</p>' : '') +
          rodape
        );
        box.querySelector('[data-voltar]').addEventListener('click', voltar);
        var cs = box.querySelectorAll('.troca-data');
        for (var i = 0; i < cs.length; i++) {
          cs[i].addEventListener('click', function () {
            escolhida = Number(this.getAttribute('data-i'));
            desenhar();
            var b = box.querySelector('[data-confirmar]');
            if (b) try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) {}
          });
        }
        var conf = box.querySelector('[data-confirmar]');
        if (conf) conf.addEventListener('click', function () { confirmar(datas[escolhida].exp || exp, datas[escolhida], conf, desenhar); });
      }
      desenhar();
    }

    async function confirmar(exp, dt, btn, redesenhar) {
      var sb = window.supabaseClient;
      if (!sb || !sb.functions) { redesenhar('Não conseguimos conectar agora. Recarregue a página.'); return; }
      ocupado = true;
      btn.disabled = true;
      btn.textContent = 'Remarcando…';
      var res;
      try {
        res = await sb.functions.invoke('cliente-trocar-reserva', {
          body: {
            acao: 'trocar',
            booking_id: booking.id,
            experiencia_id: exp.id,
            slot_id: dt.slotId,
            data: dt.data,
            horario: dt.horario,
          },
        });
      } catch (e) {
        res = { error: e };
      }
      ocupado = false;
      var data = res && res.data;
      if (!data && res && res.error && res.error.context && typeof res.error.context.json === 'function') {
        try { data = await res.error.context.json(); } catch (_) {}
      }
      if (!data || !data.ok) {
        redesenhar((data && data.message) || 'Não conseguimos fazer a troca agora. Tente de novo ou fale com a Elarah.');
        return;
      }
      render(
        '<div class="troca-ok"><div class="troca-emoji">🎉</div>' +
        '<h2 class="troca-title">Reserva remarcada!</h2>' +
        '<p class="troca-sub" style="margin-top:8px;">Agora é <strong>' + esc(exp.nome) + '</strong><br>' +
        esc(dt.data) + ' · ' + esc(dt.horario) + '</p>' +
        '<p class="troca-sub">A confirmação nova chega no seu WhatsApp e e-mail, e a Elarah avisa o parceiro.</p>' +
        '<button type="button" class="troca-btn" data-troca-fechar style="margin-top:14px;">Fechar</button></div>'
      );
      if (typeof opts.onDone === 'function') opts.onDone(data);
    }

    passoInicio();
  }

  // Registra o pedido de reembolso (o WhatsApp abre pelo próprio link).
  function pedirReembolso(bookingId) {
    var sb = window.supabaseClient;
    if (!sb || !sb.functions || !bookingId) return;
    try {
      sb.functions.invoke('cliente-trocar-reserva', { body: { acao: 'reembolso', booking_id: bookingId } })
        .then(function () {}, function (e) { console.warn('[Elarah trocas] registro de reembolso falhou', e); });
    } catch (e) {
      console.warn('[Elarah trocas] registro de reembolso falhou', e);
    }
  }

  window.ElarahTrocas = { abrir: abrir, pedirReembolso: pedirReembolso };
})(window, document);
