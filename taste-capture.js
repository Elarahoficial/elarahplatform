/* =====================================================================
   ELARAH — CAPTURA DE PERFIL DE GOSTO ("experiências com a sua cara")
   ---------------------------------------------------------------------
   POR QUE ISSO NÃO É UM FORMULÁRIO

   Formulário não volta. A prova está em casa: a avaliação pós-
   experiência é 1 clique numa estrela e mesmo assim quase ninguém
   responde. Repetir o mesmo formato com outro assunto daria o mesmo
   resultado. As quatro regras deste widget saem justamente daí:

     1. TOQUE, NÃO DIGITAÇÃO. Chip com emoji. Teclado só aparece
        se a pessoa QUISER escrever (campo livre sempre opcional).
     2. SALVA A CADA TOQUE. Não existe botão "Enviar" que decide se
        o dado existe ou não. Quem tocou 1 chip e fechou a aba já
        deixou o dado — perfil parcial é perfil.
     3. RECOMPENSA EGOÍSTA. "Receba experiências com a sua cara",
        não "ajude a Elarah a melhorar". Avaliação pede favor;
        isto aqui entrega um serviço.
     4. HORA CERTA. Roda no pico emocional — a tela logo depois de
        pagar, quando a pessoa está feliz e não tem mais nada a fazer
        naquela aba.

   COMO USAR

     <script src="taste-capture.js?v=1"></script>
     ElarahTaste.mount({
       container: '#meu-div',
       origem: 'pos_compra',           // pos_compra | avaliacao | quiz | site
       email: 'ana@x.com',             // tudo opcional
       telefone: '11999999999',
       nome: 'Ana',
       bookingId: '...',
       steps: ['tags','companhia','whatsapp'],
       seed: respostaAnterior,        // continua uma coleta em andamento
       force: true                    // ignora o "já respondeu"
     });

   Some sozinho se já respondeu (localStorage) e nunca quebra a página:
   qualquer erro vira no-op silencioso.
   ===================================================================== */

(function (window, document) {
  'use strict';

  var SUPABASE_URL = 'https://nwijxjmenbfyehvscogs.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_HKveTG-kF0ZDsbiHYvwBdA_Kg5PUOlJ';
  var TABLE = 'taste_responses';
  var LS_KEY = 'elarah_taste_done';

  // ===== catálogo de opções =====
  // Os slugs BATEM com public.elarah_slug(experiences.categoria) —
  // é o que faz o match no banco funcionar sem tabela de-para.
  var TAGS = [
    { v: 'ceramica',    e: '🏺', l: 'Cerâmica' },
    { v: 'gastronomia', e: '🍝', l: 'Cozinhar' },
    { v: 'bartenderia', e: '🍸', l: 'Drinks' },
    { v: 'pintura',     e: '🎨', l: 'Pintura' },
    { v: 'tufting',     e: '🧶', l: 'Tufting' },
    { v: 'vela',        e: '🕯️', l: 'Velas' },
    { v: 'perfumaria',  e: '🌸', l: 'Perfumaria' },
    { v: 'sabonete',    e: '🧼', l: 'Sabonetes' },
    { v: 'macrame',     e: '🪢', l: 'Macramê' },
    { v: 'floral',      e: '💐', l: 'Flores' }
  ];

  var COMPANHIA = [
    { v: 'namorado', e: '❤️', l: 'Com meu amor' },
    { v: 'amigas',   e: '👯', l: 'Com as amigas' },
    { v: 'sozinha',  e: '🧘', l: 'Sozinha, pra mim' },
    { v: 'familia',  e: '🏡', l: 'Em família' },
    { v: 'filhos',   e: '🧒', l: 'Com as crianças' },
    { v: 'trabalho', e: '💼', l: 'Com o time do trabalho' }
  ];

  var MOMENTO = [
    { v: 'aniversario', e: '🎂', l: 'Aniversário' },
    { v: 'date',        e: '💕', l: 'Date' },
    { v: 'presente',    e: '🎁', l: 'Presentear alguém' },
    { v: 'autocuidado', e: '🌿', l: 'Cuidar de mim' },
    { v: 'comemorar',   e: '🥂', l: 'Comemorar algo' },
    { v: 'sem_motivo',  e: '✨', l: 'Sem motivo nenhum' }
  ];

  var FAIXA = [
    { v: 'ate_150',  e: '', l: 'até R$150' },
    { v: '150_250',  e: '', l: 'R$150 a R$250' },
    { v: '250_400',  e: '', l: 'R$250 a R$400' },
    { v: '400_mais', e: '', l: 'acima de R$400' }
  ];

  var PASSOS = {
    tags: {
      titulo: 'O que você quer viver?',
      sub: 'Toca no que te interessa — pode ser mais de um.',
      opcoes: TAGS, campo: 'tags', multi: true
    },
    companhia: {
      titulo: 'Com quem você costuma vir?',
      sub: 'Assim a gente te manda o que combina com o seu rolê.',
      opcoes: COMPANHIA, campo: 'companhia', multi: true
    },
    momento: {
      titulo: 'O que costuma te trazer aqui?',
      sub: '',
      opcoes: MOMENTO, campo: 'momento', multi: false
    },
    faixa: {
      titulo: 'Quanto costuma investir?',
      sub: 'Pra não te mandar nada fora da sua realidade.',
      opcoes: FAIXA, campo: 'faixa_preco', multi: false
    }
  };

  // ===== util =====
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Só dígitos, e só aceita se parecer telefone BR de verdade.
  // Telefone errado é pior que telefone nenhum: entra na base e a
  // Elara perde tempo mandando mensagem pro vazio.
  function limpaFone(v) {
    var d = String(v || '').replace(/\D/g, '').replace(/^0+/, '');
    if (d.length === 13 && d.indexOf('55') === 0) d = d.slice(2);
    if (d.length === 12 && d.indexOf('55') === 0) d = d.slice(2);
    return (d.length === 10 || d.length === 11) ? d : '';
  }

  function mascaraFone(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  // ===== CSS (injetado 1x) =====
  // Autocontido de propósito: o widget roda em success.html,
  // avaliar.html e combina-comigo.html, que têm CSS completamente
  // diferentes entre si. Prefixo .etc- pra não vazar em nada.
  var CSS_ID = 'elarah-taste-css';
  function injetaCss() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = [
      '.etc{--etc-accent:#f0a05e;--etc-ink:#2c211a;--etc-soft:#faf6f0;',
      'font-family:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;',
      'background:#fff;border-radius:18px;padding:26px 22px 24px;text-align:left;',
      'box-shadow:0 8px 32px rgba(0,0,0,.07);max-width:520px;margin:24px auto;color:var(--etc-ink);',
      'box-sizing:border-box;}',
      '.etc *{box-sizing:border-box;}',
      '.etc__eyebrow{font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;',
      'color:var(--etc-accent);font-weight:700;margin:0 0 6px;}',
      '.etc__title{font-family:"DM Serif Display",Georgia,serif;font-size:1.45rem;line-height:1.25;',
      'margin:0 0 6px;color:#1a1a1a;font-weight:400;}',
      '.etc__sub{font-size:.9rem;color:#7a6c60;margin:0 0 16px;line-height:1.5;}',
      '.etc__chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 4px;}',
      '.etc__chip{appearance:none;border:1.5px solid #e6dccd;background:#fff;color:var(--etc-ink);',
      'border-radius:999px;padding:10px 15px;font:inherit;font-size:.92rem;font-weight:500;',
      'cursor:pointer;transition:transform .09s,border-color .15s,background .15s;line-height:1.2;}',
      '.etc__chip:active{transform:scale(.95);}',
      '.etc__chip--on{border-color:var(--etc-accent);background:#fff4e8;font-weight:600;}',
      '.etc__chip-e{margin-right:6px;}',
      '.etc__actions{display:flex;align-items:center;gap:12px;margin-top:18px;min-height:46px;}',
      '.etc__next{appearance:none;border:none;background:var(--etc-accent);color:#fff;font:inherit;',
      'font-weight:700;font-size:.98rem;padding:13px 26px;border-radius:999px;cursor:pointer;',
      'opacity:0;pointer-events:none;transition:opacity .2s,transform .09s;}',
      '.etc__next--on{opacity:1;pointer-events:auto;}',
      '.etc__next:active{transform:scale(.97);}',
      '.etc__skip{background:none;border:none;color:#a2968a;font:inherit;font-size:.85rem;',
      'cursor:pointer;padding:8px 2px;text-decoration:underline;text-underline-offset:3px;}',
      '.etc__dots{display:flex;gap:5px;margin:0 0 14px;}',
      '.etc__dot{width:20px;height:3px;border-radius:2px;background:#eee4d6;transition:background .2s;}',
      '.etc__dot--on{background:var(--etc-accent);}',
      '.etc__field{width:100%;border:1.5px solid #e6dccd;border-radius:12px;padding:13px 14px;',
      'font:inherit;font-size:1rem;margin-top:10px;background:#fff;color:var(--etc-ink);}',
      '.etc__field:focus{outline:none;border-color:var(--etc-accent);}',
      '.etc__done{text-align:center;padding:8px 0 4px;}',
      '.etc__done-e{font-size:2.6rem;line-height:1;margin-bottom:8px;}',
      '.etc__err{color:#b3261e;font-size:.85rem;margin-top:10px;}',
      '.etc__mini{font-size:.78rem;color:#a2968a;margin-top:12px;line-height:1.5;}',
      '@media (max-width:420px){.etc{padding:22px 16px;border-radius:16px;}',
      '.etc__chip{padding:9px 13px;font-size:.88rem;}}'
    ].join('');
    document.head.appendChild(s);
  }

  // ===== persistência =====
  // Estratégia dupla de propósito: se o client Supabase estiver na
  // página, usa ele (respeita retry/auth). Se não estiver — é o caso
  // de avaliar.html, que é uma página solta sem o loader — cai no
  // REST direto com a publishable key. Em nenhum dos dois caminhos
  // um erro pode derrubar a página; captura de dado nunca pode
  // atrapalhar quem acabou de comprar.
  function salvar(linha) {
    var sb = window.supabaseClient;
    if (sb && sb.from) {
      return sb.from(TABLE).insert(linha).then(function (r) {
        if (r && r.error) throw r.error;
        return true;
      });
    }
    return fetch(SUPABASE_URL + '/rest/v1/' + TABLE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(linha)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return true;
    });
  }

  function track(nome, meta) {
    try {
      if (window.ElarahAnalytics && window.ElarahAnalytics.track) {
        window.ElarahAnalytics.track(nome, { category: 'taste', metadata: meta || {} });
      }
    } catch (e) {}
  }

  // ===== widget =====
  function mount(opts) {
    try { return montar(opts || {}); } catch (e) { return null; }
  }

  function montar(o) {
    var host = typeof o.container === 'string'
      ? document.querySelector(o.container)
      : (o.container || o.el);
    if (!host) return null;

    var origem = o.origem || 'site';
    var chaveDone = LS_KEY + ':' + origem;

    // Já respondeu neste ponto de captura? Não insiste. Insistir é o
    // jeito mais rápido de a pessoa passar a ignorar tudo que a
    // Elarah manda.
    if (!o.force && lsGet(chaveDone)) { host.innerHTML = ''; return null; }

    injetaCss();

    var passos = (o.steps && o.steps.length ? o.steps : ['tags', 'companhia', 'whatsapp']).slice();
    var idx = 0;
    // Resposta viva: cresce a cada toque e é regravada inteira toda
    // vez. Uma linha por passo no banco, sempre com o estado
    // acumulado — assim a última linha de cada pessoa já é o perfil
    // completo, e as anteriores contam a história.
    var resp = {
      email: o.email || null,
      telefone: o.telefone ? (limpaFone(o.telefone) || null) : null,
      nome: o.nome || null,
      user_id: o.userId || null,
      booking_id: o.bookingId || null,
      origem: origem,
      tags: [],
      companhia: [],
      faixa_preco: null,
      momento: null,
      desejo: null,
      whatsapp_optin: false,
      metadata: Object.assign({
        page: (location.pathname || '').replace(/^\//, '') || 'index.html'
      }, o.metadata || {})
    };

    // seed: continua uma coleta que começou em outro mount. É o que
    // permite entregar a RECOMPENSA NO MEIO — o quiz mostra as
    // experiências recomendadas depois dos chips e só então pede o
    // WhatsApp, e mesmo assim a linha final sai completa (gosto +
    // telefone juntos), que é o que a view precisa pra identificar
    // a pessoa. Sem isso, os chips ficariam numa linha anônima e o
    // telefone noutra, sem nada que ligasse as duas.
    if (o.seed) {
      ['tags', 'companhia'].forEach(function (k) {
        if (Array.isArray(o.seed[k]) && o.seed[k].length) resp[k] = o.seed[k].slice();
      });
      ['faixa_preco', 'momento', 'desejo', 'email', 'nome', 'booking_id', 'user_id']
        .forEach(function (k) { if (o.seed[k]) resp[k] = o.seed[k]; });
      if (o.seed.telefone && !resp.telefone) resp.telefone = limpaFone(o.seed.telefone) || null;
    }

    var box = document.createElement('div');
    box.className = 'etc';
    host.innerHTML = '';
    host.appendChild(box);

    track('taste_widget_view', { origem: origem });

    var salvando = false;
    function persistir(motivo) {
      if (salvando) return Promise.resolve();
      salvando = true;
      var copia = JSON.parse(JSON.stringify(resp));
      copia.metadata = Object.assign({}, copia.metadata, { passo: motivo });
      return salvar(copia)
        .catch(function () { /* silencioso: o dado tenta de novo no próximo passo */ })
        .then(function () { salvando = false; });
    }

    function dots() {
      var h = '<div class="etc__dots">';
      for (var i = 0; i < passos.length; i++) {
        h += '<span class="etc__dot' + (i <= idx ? ' etc__dot--on' : '') + '"></span>';
      }
      return h + '</div>';
    }

    function avancar() {
      idx++;
      if (idx >= passos.length) return fim();
      render();
    }

    function render() {
      var passo = passos[idx];
      if (passo === 'whatsapp') return telaWhatsapp();
      if (passo === 'desejo') return telaDesejo();
      var cfg = PASSOS[passo];
      if (!cfg) return avancar();
      telaChips(cfg);
    }

    function telaChips(cfg) {
      var selecionado = cfg.multi ? resp[cfg.campo] : (resp[cfg.campo] ? [resp[cfg.campo]] : []);
      var html = dots() +
        '<p class="etc__eyebrow">' + esc(o.eyebrow || 'Só pra te conhecer') + '</p>' +
        '<h3 class="etc__title">' + esc(cfg.titulo) + '</h3>' +
        (cfg.sub ? '<p class="etc__sub">' + esc(cfg.sub) + '</p>' : '') +
        '<div class="etc__chips">';
      cfg.opcoes.forEach(function (op) {
        var on = selecionado.indexOf(op.v) >= 0;
        html += '<button type="button" class="etc__chip' + (on ? ' etc__chip--on' : '') +
          '" data-v="' + esc(op.v) + '">' +
          (op.e ? '<span class="etc__chip-e">' + op.e + '</span>' : '') +
          esc(op.l) + '</button>';
      });
      html += '</div><div class="etc__actions">' +
        '<button type="button" class="etc__next" data-next>Continuar</button>' +
        '<button type="button" class="etc__skip" data-skip>pular</button>' +
        '</div>';
      box.innerHTML = html;

      var btnNext = box.querySelector('[data-next]');
      function sincroniza() {
        var tem = cfg.multi ? resp[cfg.campo].length > 0 : !!resp[cfg.campo];
        btnNext.classList.toggle('etc__next--on', tem);
      }
      sincroniza();

      box.querySelectorAll('.etc__chip').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-v');
          if (cfg.multi) {
            var arr = resp[cfg.campo];
            var i = arr.indexOf(v);
            if (i >= 0) arr.splice(i, 1); else arr.push(v);
            b.classList.toggle('etc__chip--on', arr.indexOf(v) >= 0);
          } else {
            resp[cfg.campo] = (resp[cfg.campo] === v) ? null : v;
            box.querySelectorAll('.etc__chip').forEach(function (x) {
              x.classList.toggle('etc__chip--on', x.getAttribute('data-v') === resp[cfg.campo]);
            });
          }
          sincroniza();
          // AQUI está o pulo do gato: grava no toque, não no
          // "Continuar". Quem fecha a aba agora já deixou o dado.
          persistir(cfg.campo);
          track('taste_chip', { origem: origem, campo: cfg.campo, valor: v });
        });
      });

      btnNext.addEventListener('click', function () { persistir(cfg.campo); avancar(); });
      box.querySelector('[data-skip]').addEventListener('click', function () {
        track('taste_skip', { origem: origem, campo: cfg.campo });
        avancar();
      });
    }

    function telaDesejo() {
      box.innerHTML = dots() +
        '<p class="etc__eyebrow">Sua vez</p>' +
        '<h3 class="etc__title">Tem alguma experiência que você sonha em viver?</h3>' +
        '<p class="etc__sub">Se a gente ainda não tem, a gente vai atrás. Sério.</p>' +
        '<input class="etc__field" id="etc-desejo" maxlength="200" ' +
        'placeholder="ex.: aula de vitral, jantar no escuro…">' +
        '<div class="etc__actions">' +
        '<button type="button" class="etc__next etc__next--on" data-next>Continuar</button>' +
        '<button type="button" class="etc__skip" data-skip>pular</button>' +
        '</div>';
      box.querySelector('[data-next]').addEventListener('click', function () {
        var v = (box.querySelector('#etc-desejo').value || '').trim();
        if (v) { resp.desejo = v.slice(0, 200); persistir('desejo'); }
        avancar();
      });
      box.querySelector('[data-skip]').addEventListener('click', avancar);
    }

    function telaWhatsapp() {
      // A troca é explícita: você me dá o WhatsApp, eu te mando só o
      // que combina com o que você acabou de marcar. Nada de
      // "receba nossas novidades".
      var foneVis = resp.telefone ? mascaraFone(resp.telefone) : '';
      box.innerHTML = dots() +
        '<p class="etc__eyebrow">Combinado</p>' +
        '<h3 class="etc__title">Quer receber experiências com a sua cara?</h3>' +
        '<p class="etc__sub">A gente te chama no WhatsApp só quando abrir algo do que você marcou. ' +
        'Sem lista de novidades, sem spam — e você sai quando quiser.</p>' +
        '<input class="etc__field" id="etc-fone" inputmode="numeric" ' +
        'placeholder="(11) 90000-0000" value="' + esc(foneVis) + '">' +
        '<div class="etc__err" id="etc-fone-err" style="display:none;"></div>' +
        '<div class="etc__actions">' +
        '<button type="button" class="etc__next etc__next--on" data-next>Pode me avisar 🧡</button>' +
        '<button type="button" class="etc__skip" data-skip>agora não</button>' +
        '</div>';

      var campo = box.querySelector('#etc-fone');
      var erro = box.querySelector('#etc-fone-err');
      campo.addEventListener('input', function () {
        campo.value = mascaraFone(campo.value);
        erro.style.display = 'none';
      });

      box.querySelector('[data-next]').addEventListener('click', function () {
        var d = limpaFone(campo.value);
        if (!d) {
          erro.textContent = 'Confere o número? Precisa do DDD.';
          erro.style.display = 'block';
          campo.focus();
          return;
        }
        resp.telefone = d;
        resp.whatsapp_optin = true;
        track('taste_whatsapp_optin', { origem: origem });
        persistir('whatsapp').then(fim);
      });

      box.querySelector('[data-skip]').addEventListener('click', function () {
        track('taste_skip', { origem: origem, campo: 'whatsapp' });
        fim();
      });
    }

    function fim() {
      lsSet(chaveDone, String(Date.now()));
      var temTag = resp.tags.length > 0;
      // O agradecimento devolve o que a pessoa marcou. Ver a própria
      // escolha repetida de volta é o que faz parecer que alguém
      // do outro lado leu — e é o que faz ela responder de novo
      // da próxima vez.
      var eco = temTag
        ? 'Anotado: ' + resp.tags.map(function (t) {
            var f = TAGS.filter(function (x) { return x.v === t; })[0];
            return f ? f.l.toLowerCase() : t;
          }).join(', ') + '.'
        : 'Quando abrir algo novo, a gente te conta.';
      box.innerHTML =
        '<div class="etc__done">' +
        '<div class="etc__done-e">🧡</div>' +
        '<h3 class="etc__title">' + (resp.whatsapp_optin ? 'Prontinho!' : 'Obrigada!') + '</h3>' +
        '<p class="etc__sub" style="margin-bottom:0;">' + esc(eco) +
        (resp.whatsapp_optin ? ' A gente te chama no WhatsApp quando tiver a sua cara.' : '') +
        '</p></div>';
      track('taste_complete', {
        origem: origem, tags: resp.tags.length,
        whatsapp: resp.whatsapp_optin, companhia: resp.companhia.length
      });
      if (typeof o.onDone === 'function') { try { o.onDone(resp); } catch (e) {} }
    }

    render();
    return { resposta: resp, destruir: function () { host.innerHTML = ''; } };
  }

  window.ElarahTaste = {
    mount: mount,
    TAGS: TAGS,
    COMPANHIA: COMPANHIA,
    MOMENTO: MOMENTO,
    FAIXA: FAIXA,
    limpaFone: limpaFone,
    // Pra testar sem limpar o localStorage na mão.
    resetar: function (origem) {
      try {
        if (origem) localStorage.removeItem(LS_KEY + ':' + origem);
        else Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf(LS_KEY) === 0) localStorage.removeItem(k);
        });
      } catch (e) {}
    }
  };

})(window, document);
