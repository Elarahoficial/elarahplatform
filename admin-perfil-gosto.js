/* =====================================================================
   ELARAH — Aba "Perfil de gosto"
   ---------------------------------------------------------------------
   A aba existe pra responder UMA pergunta, que é a pergunta que a
   Elara faz toda vez que sobe uma experiência nova:

        "pra quem eu mando isso?"

   Mandar pra base inteira queima a base e converte pouco. Aqui sai a
   lista curta das pessoas com maior chance de comprar AQUELA
   experiência, ordenada por probabilidade, com o motivo do match
   escrito em português e o WhatsApp já redigido.

   De onde vem a lista (RPC match_pessoas_experiencia, em
   sql/elarah_perfil_gosto.sql):
     - o que a pessoa DECLAROU no widget pós-compra (peso maior)
     - o que ela olhou no site e nunca comprou (dedução, sem perguntar)
     - o que ela já comprou e a nota que deu
     - a faixa de preço que ela mesma disse praticar

   A aba tem 4 blocos:
     1. Termômetro da captura — a coleta está funcionando?
     2. O que o público quer — ranking de desejo agregado
     3. Pra quem eu mando isso? — o matcher (o que dá dinheiro)
     4. Base de pessoas — a lista 360º, com busca e exportação

   Autocontido: injeta o próprio CSS, não depende do admin.js.
   Renderiza dentro de #perfil-gosto-root.
   ===================================================================== */
(function (window, document) {
  'use strict';

  var ROOT_ID = 'perfil-gosto-root';
  var TTL_MS = 5 * 60 * 1000;

  function sb() { return window.supabaseClient || null; }
  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function num(n, casas) {
    var v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0
    });
  }

  function pct(parte, total) {
    if (!total) return '—';
    return num((parte / total) * 100, 0) + '%';
  }

  function dataCurta(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return isNaN(d.getTime()) ? '—'
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  // Rótulos bonitos pros slugs que o widget grava. Se aparecer um slug
  // novo (categoria nova no catálogo), cai no fallback e mostra o
  // próprio slug — nunca fica em branco.
  var ROTULO = {
    ceramica: '🏺 Cerâmica', gastronomia: '🍝 Cozinhar', bartenderia: '🍸 Drinks',
    pintura: '🎨 Pintura', tufting: '🧶 Tufting', vela: '🕯️ Velas',
    perfumaria: '🌸 Perfumaria', sabonete: '🧼 Sabonetes', macrame: '🪢 Macramê',
    floral: '💐 Flores',
    namorado: '❤️ Com o amor', amigas: '👯 Com as amigas', sozinha: '🧘 Sozinha',
    familia: '🏡 Em família', filhos: '🧒 Com as crianças', trabalho: '💼 Trabalho',
    aniversario: '🎂 Aniversário', date: '💕 Date', presente: '🎁 Presentear',
    autocuidado: '🌿 Autocuidado', comemorar: '🥂 Comemorar', sem_motivo: '✨ Sem motivo',
    ate_150: 'até R$150', '150_250': 'R$150–250', '250_400': 'R$250–400',
    '400_mais': 'R$400+',
    pos_compra: 'Pós-compra', avaliacao: 'Avaliação', quiz: 'Quiz',
    whatsapp: 'WhatsApp', admin: 'Cadastro manual', site: 'Site', newsletter: 'Newsletter'
  };
  function rotulo(v) { return ROTULO[v] || String(v || '—'); }

  var ESTAGIO_COR = {
    recorrente: '#1a8a4a', cliente: '#f0a05e', quente: '#c0392b',
    interessada: '#8e6cc4', fria: '#9a9a9a'
  };

  // ===== estado =====
  var state = {
    loaded: false, loading: false, erro: null, atualizadoEm: 0,
    dias: 90,
    stats: null,
    pessoas: [],
    experiencias: [],
    match: { rodando: false, erro: null, linhas: null, alvo: null, somenteWhats: false },
    busca: ''
  };

  // ===== CSS =====
  var CSS_ID = 'elarah-pg-css';
  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = [
      '.pg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:22px;}',
      '.pg-card{background:#fff;border:1px solid #eee4d6;border-radius:14px;padding:16px 18px;}',
      '.pg-card__n{font-size:1.8rem;font-weight:700;color:#1a1a1a;line-height:1.1;}',
      '.pg-card__l{font-size:.78rem;color:#8a7c6f;margin-top:4px;line-height:1.35;}',
      '.pg-sec{background:#fff;border:1px solid #eee4d6;border-radius:16px;padding:20px 22px;margin-bottom:22px;}',
      '.pg-sec__t{font-size:1.05rem;font-weight:700;margin:0 0 4px;color:#1a1a1a;}',
      '.pg-sec__s{font-size:.85rem;color:#8a7c6f;margin:0 0 16px;line-height:1.5;}',
      '.pg-bars{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px;}',
      '.pg-bar{display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:.86rem;}',
      '.pg-bar__l{width:130px;flex:none;color:#4a4038;}',
      '.pg-bar__t{flex:1;height:9px;background:#f4ece0;border-radius:5px;overflow:hidden;}',
      '.pg-bar__f{height:100%;background:#f0a05e;border-radius:5px;}',
      '.pg-bar__n{width:34px;flex:none;text-align:right;color:#8a7c6f;font-variant-numeric:tabular-nums;}',
      '.pg-h{font-size:.76rem;text-transform:uppercase;letter-spacing:.07em;color:#a2968a;',
      'font-weight:700;margin:0 0 9px;}',
      '.pg-ctrl{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px;}',
      '.pg-ctrl select,.pg-ctrl input{border:1px solid #e6dccd;border-radius:9px;padding:9px 11px;',
      'font:inherit;font-size:.88rem;background:#fff;color:#2c211a;}',
      '.pg-ctrl select{min-width:220px;max-width:100%;}',
      '.pg-btn{border:none;background:#f0a05e;color:#fff;font:inherit;font-weight:600;font-size:.88rem;',
      'padding:9px 18px;border-radius:999px;cursor:pointer;}',
      '.pg-btn:disabled{opacity:.55;cursor:default;}',
      '.pg-btn--ghost{background:#fff;color:#8a7c6f;border:1px solid #e6dccd;}',
      '.pg-tbl{width:100%;border-collapse:collapse;font-size:.86rem;}',
      '.pg-tbl th{text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;',
      'color:#a2968a;font-weight:700;padding:8px 10px;border-bottom:1px solid #eee4d6;white-space:nowrap;}',
      '.pg-tbl td{padding:10px;border-bottom:1px solid #f6f0e6;vertical-align:top;}',
      '.pg-tbl tr:hover td{background:#fffaf3;}',
      '.pg-score{display:inline-block;min-width:38px;text-align:center;font-weight:700;',
      'border-radius:7px;padding:3px 7px;font-size:.84rem;}',
      '.pg-why{color:#8a7c6f;font-size:.78rem;line-height:1.45;}',
      '.pg-tag{display:inline-block;background:#faf4ea;border:1px solid #eee4d6;border-radius:999px;',
      'padding:2px 9px;font-size:.74rem;margin:0 4px 4px 0;color:#6b5d50;}',
      '.pg-pill{display:inline-block;border-radius:999px;padding:2px 9px;font-size:.72rem;',
      'font-weight:700;color:#fff;}',
      '.pg-wa{display:inline-block;background:#25d366;color:#fff;border-radius:8px;padding:6px 11px;',
      'font-size:.8rem;font-weight:600;text-decoration:none;white-space:nowrap;}',
      '.pg-wa--off{background:#eee;color:#aaa;pointer-events:none;}',
      '.pg-empty{color:#a2968a;font-size:.88rem;padding:22px 0;text-align:center;line-height:1.6;}',
      '.pg-warn{background:#fff7e8;border:1px solid #f3dcb5;border-radius:12px;padding:14px 16px;',
      'font-size:.85rem;color:#8a6a35;line-height:1.6;margin-bottom:18px;}',
      '.pg-desejo{border-left:3px solid #f0a05e;padding:6px 0 6px 12px;margin-bottom:12px;font-size:.88rem;}',
      '.pg-desejo small{color:#a2968a;display:block;margin-top:3px;font-size:.76rem;}',
      '.pg-scroll{overflow-x:auto;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ===== carga =====
  async function carregar() {
    state.loading = true; state.erro = null;
    var s = sb();
    if (!s) { state.erro = 'Supabase indisponível.'; state.loading = false; return; }
    try {
      var r = await Promise.all([
        s.rpc('taste_capture_stats', { p_dias: state.dias }),
        s.from('taste_pessoas').select('*').order('engajamento', { ascending: false }).limit(2000),
        s.from('experiences').select('id,nome,categoria,preco').order('nome').limit(600)
      ]);
      // O erro mais provável aqui é a migração não ter sido rodada
      // ainda. A mensagem diz exatamente qual arquivo rodar, em vez
      // de mostrar "relation does not exist" pra quem não lê SQL.
      if (r[0].error) throw r[0].error;
      state.stats = r[0].data || null;
      state.pessoas = (r[1].data || []);
      state.experiencias = (r[2].data || []);
      state.loaded = true;
      state.atualizadoEm = Date.now();
    } catch (e) {
      var m = String((e && e.message) || e);
      state.erro = /does not exist|schema cache|not find/i.test(m)
        ? 'Falta rodar a migração: abra o SQL Editor do Supabase e rode sql/elarah_perfil_gosto.sql.'
        : m;
    }
    state.loading = false;
  }

  // ===== o matcher =====
  async function rodarMatch() {
    var s = sb();
    if (!s) return;
    var sel = el('pg-exp');
    var valor = sel ? sel.value : '';
    if (!valor) return;

    state.match.rodando = true;
    state.match.erro = null;
    render();

    var args = { p_limit: 60, p_somente_whatsapp: !!state.match.somenteWhats };
    var alvo;
    if (valor.indexOf('cat:') === 0) {
      args.p_categoria = valor.slice(4);
      alvo = { tipo: 'categoria', nome: rotulo(args.p_categoria), categoria: args.p_categoria };
    } else {
      var exp = state.experiencias.filter(function (x) { return x.id === valor; })[0];
      args.p_experiencia_id = valor;
      alvo = { tipo: 'experiencia', nome: (exp && exp.nome) || '', id: valor,
               categoria: exp && exp.categoria, preco: exp && exp.preco };
    }

    try {
      var r = await s.rpc('match_pessoas_experiencia', args);
      if (r.error) throw r.error;
      state.match.linhas = r.data || [];
      state.match.alvo = alvo;
    } catch (e) {
      state.match.erro = String((e && e.message) || e);
      state.match.linhas = null;
    }
    state.match.rodando = false;
    render();
  }

  // Mensagem de WhatsApp já escrita, personalizada com o NOME e com o
  // MOTIVO do match. "Oi Ana, lembrei de você porque você marcou que
  // queria cerâmica" converte muito mais do que um disparo igual pra
  // todo mundo — e é honesto: ela marcou mesmo.
  function linkWhatsapp(pessoa, alvo) {
    var fone = String(pessoa.telefone || '').replace(/\D/g, '');
    if (!fone) return null;
    if (fone.length <= 11) fone = '55' + fone;
    var primeiro = String(pessoa.nome || '').trim().split(/\s+/)[0] || '';
    // A ordem aqui importa: vale o motivo MAIS FORTE que a pessoa
    // tem. Quem pediu na lista de espera merece "abriu o que você
    // pediu" — dizer "achei que você ia gostar" pra quem pediu com
    // todas as letras soa como disparo automático, que é exatamente
    // a impressão que a gente está tentando evitar.
    var gancho = '';
    var m = pessoa.motivos || [];
    if (m.some(function (x) { return /PEDIU na lista/.test(x); })) {
      gancho = 'abriu exatamente o que você pediu pra eu te avisar';
    } else if (m.some(function (x) { return /disse que quer/.test(x); })) {
      gancho = 'lembrei que você marcou que queria viver isso';
    } else if (m.some(function (x) { return /viu esta experiência/.test(x); })) {
      gancho = 'vi que você deu uma olhadinha nessa e ela abriu de novo';
    } else if (m.some(function (x) { return /histórico com/.test(x); })) {
      gancho = 'lembrei de você';
    } else if (m.some(function (x) { return /recorrente|já comprou/.test(x); })) {
      gancho = 'você que já viveu a Elarah vai gostar dessa';
    } else {
      gancho = 'acho que essa tem a sua cara';
    }
    var txt = 'Oi' + (primeiro ? ' ' + primeiro : '') + '! Aqui é da Elarah 🧡 ' +
      'Abriu "' + (alvo.nome || 'uma experiência nova') + '" e ' + gancho + '. ' +
      'Quer que eu te mande os detalhes?';
    return 'https://wa.me/' + fone + '?text=' + encodeURIComponent(txt);
  }

  // ===== render =====
  function render() {
    var root = el(ROOT_ID);
    if (!root) return;

    if (state.loading && !state.loaded) {
      root.innerHTML = '<div class="pg-empty">Carregando perfis…</div>';
      return;
    }
    if (state.erro && !state.loaded) {
      root.innerHTML = '<div class="pg-warn"><strong>Não consegui carregar.</strong><br>' +
        esc(state.erro) + '</div>';
      return;
    }

    root.innerHTML = blocoTermometro() + blocoDesejo() + blocoMatch() + blocoBase();
    wire();
  }

  function blocoTermometro() {
    var st = state.stats || {};
    var compras = Number(st.compras_periodo || 0);
    var resp = Number(st.respostas_pos_compra || 0);
    var perfis = Number(st.pessoas_com_perfil || 0);
    var whats = Number(st.com_whatsapp || 0);

    var h = '<div class="pg-ctrl">' +
      '<label style="font-size:.85rem;color:#8a7c6f;">Período:</label>' +
      '<select id="pg-dias">' +
      [30, 90, 180, 365].map(function (d) {
        return '<option value="' + d + '"' + (state.dias === d ? ' selected' : '') + '>' +
          'últimos ' + d + ' dias</option>';
      }).join('') +
      '</select></div>';

    h += '<div class="pg-grid">' +
      card(num(perfis), 'pessoas com perfil de gosto na base') +
      card(num(whats), 'autorizaram contato no WhatsApp') +
      card(pct(resp, compras), 'das compras do período responderam<br><small style="color:#bbb;">' +
           num(resp) + ' de ' + num(compras) + '</small>') +
      card(num(st.respostas_total), 'toques registrados no período') +
      '</div>';

    // O alerta só aparece quando realmente não entrou nada. Enquanto
    // a migração não roda ou o site não foi publicado, este bloco é a
    // explicação — e não um painel vazio sem motivo aparente.
    if (!Number(st.respostas_total)) {
      h += '<div class="pg-warn"><strong>Ainda não entrou nenhuma resposta.</strong><br>' +
        'É esperado até a próxima compra acontecer: o widget aparece na tela de ' +
        'confirmação de pagamento e no link de avaliação. Os blocos abaixo já ' +
        'funcionam mesmo assim — o "pra quem eu mando isso" usa o que as pessoas ' +
        '<em>olharam e compraram</em>, que é dado que você já tem.</div>';
    }
    return h;
  }

  function card(n, l) {
    return '<div class="pg-card"><div class="pg-card__n">' + n + '</div>' +
      '<div class="pg-card__l">' + l + '</div></div>';
  }

  function barras(lista, titulo) {
    if (!lista || !lista.length) {
      return '<div><p class="pg-h">' + esc(titulo) + '</p>' +
        '<p style="font-size:.82rem;color:#c0b5a8;">sem dados ainda</p></div>';
    }
    var max = Math.max.apply(null, lista.map(function (x) { return Number(x.n) || 0; })) || 1;
    var h = '<div><p class="pg-h">' + esc(titulo) + '</p>';
    lista.slice(0, 10).forEach(function (x) {
      var p = Math.round((Number(x.n) || 0) / max * 100);
      h += '<div class="pg-bar"><span class="pg-bar__l">' + esc(rotulo(x.tag)) + '</span>' +
        '<span class="pg-bar__t"><span class="pg-bar__f" style="width:' + p + '%;"></span></span>' +
        '<span class="pg-bar__n">' + num(x.n) + '</span></div>';
    });
    return h + '</div>';
  }

  function blocoDesejo() {
    var st = state.stats || {};
    var faixa = st.faixa_preco || {};
    var faixaLista = Object.keys(faixa).map(function (k) { return { tag: k, n: faixa[k] }; })
      .sort(function (a, b) { return b.n - a.n; });

    var h = '<div class="pg-sec">' +
      '<h3 class="pg-sec__t">O que o público quer</h3>' +
      '<p class="pg-sec__s">O que as pessoas marcaram, somado. Serve pra decidir qual ' +
      'experiência buscar com fornecedor — é demanda declarada, não achismo.</p>' +
      '<div class="pg-bars">' +
      barras(st.top_tags, 'Experiências desejadas') +
      barras(st.top_companhia, 'Com quem vêm') +
      barras(st.top_momento, 'Por que saem de casa') +
      barras(faixaLista, 'Quanto investem') +
      '</div>';

    var desejos = st.desejos || [];
    if (desejos.length) {
      h += '<div style="margin-top:24px;"><p class="pg-h">Pedidos escritos à mão ' +
        '(' + num(desejos.length) + ')</p>' +
        '<p style="font-size:.82rem;color:#8a7c6f;margin:-4px 0 14px;">' +
        'Poucas pessoas digitam — quem digita está pedindo de verdade. ' +
        'Cada linha aqui é uma experiência que já tem comprador esperando.</p>';
      desejos.forEach(function (d) {
        h += '<div class="pg-desejo">' + esc(d.texto) +
          '<small>' + esc(d.nome || 'anônima') + ' · ' + dataCurta(d.quando) + '</small></div>';
      });
      h += '</div>';
    }
    return h + '</div>';
  }

  function blocoMatch() {
    var cats = {};
    state.experiencias.forEach(function (e) {
      var c = slug(e.categoria);
      if (c) cats[c] = (cats[c] || 0) + 1;
    });

    var h = '<div class="pg-sec" id="pg-match">' +
      '<h3 class="pg-sec__t">Pra quem eu mando isso?</h3>' +
      '<p class="pg-sec__s">Escolha a experiência que você quer vender. A lista sai ordenada ' +
      'por chance de compra, com o motivo do match e a mensagem de WhatsApp pronta. ' +
      'Mandar pra 20 pessoas certas vende mais do que pra 2.000 aleatórias — e não queima a base.</p>' +
      '<div class="pg-ctrl">' +
      '<select id="pg-exp"><option value="">— escolha a experiência —</option>';

    if (state.experiencias.length) {
      h += '<optgroup label="Experiências do catálogo">';
      state.experiencias.forEach(function (e) {
        h += '<option value="' + esc(e.id) + '">' + esc(e.nome) +
          (e.categoria ? ' · ' + esc(e.categoria) : '') + '</option>';
      });
      h += '</optgroup>';
    }
    var chaves = Object.keys(cats).sort();
    if (chaves.length) {
      h += '<optgroup label="Ou uma categoria inteira">';
      chaves.forEach(function (c) {
        h += '<option value="cat:' + esc(c) + '">' + esc(rotulo(c)) + '</option>';
      });
      h += '</optgroup>';
    }
    h += '</select>' +
      '<label style="font-size:.85rem;color:#8a7c6f;display:flex;align-items:center;gap:6px;">' +
      '<input type="checkbox" id="pg-so-whats"' + (state.match.somenteWhats ? ' checked' : '') +
      '> só quem autorizou WhatsApp</label>' +
      '<button class="pg-btn" id="pg-rodar"' + (state.match.rodando ? ' disabled' : '') + '>' +
      (state.match.rodando ? 'Buscando…' : 'Buscar pessoas') + '</button>';
    if (state.match.linhas && state.match.linhas.length) {
      h += '<button class="pg-btn pg-btn--ghost" id="pg-csv-match">Baixar CSV</button>';
    }
    h += '</div>';

    if (state.match.erro) {
      h += '<div class="pg-warn">' + esc(state.match.erro) + '</div>';
    }

    var linhas = state.match.linhas;
    if (linhas && !linhas.length) {
      h += '<div class="pg-empty">Ninguém pontuou pra essa experiência ainda.<br>' +
        'Conforme as pessoas navegam, compram e respondem o widget, a lista se enche sozinha.</div>';
    } else if (linhas) {
      var comWhats = linhas.filter(function (p) { return p.telefone; }).length;
      h += '<p style="font-size:.85rem;color:#8a7c6f;margin:0 0 12px;">' +
        '<strong>' + num(linhas.length) + (linhas.length === 1 ? ' pessoa' : ' pessoas') + '</strong> pra ' +
        esc((state.match.alvo && state.match.alvo.nome) || '') +
        ' · ' + num(comWhats) + ' com WhatsApp na mão.</p>';
      h += '<div class="pg-scroll"><table class="pg-tbl"><thead><tr>' +
        '<th>Chance</th><th>Pessoa</th><th>Por que ela</th><th>Histórico</th><th></th>' +
        '</tr></thead><tbody>';
      linhas.forEach(function (p) {
        var cor = p.score >= 60 ? '#1a8a4a' : (p.score >= 35 ? '#f0a05e' : '#b9ada0');
        var bg  = p.score >= 60 ? '#e7f7ee' : (p.score >= 35 ? '#fff4e8' : '#f6f3ee');
        var wa = linkWhatsapp(p, state.match.alvo || {});
        h += '<tr>' +
          '<td><span class="pg-score" style="color:' + cor + ';background:' + bg + ';">' +
            num(p.score) + '</span></td>' +
          '<td><strong>' + esc(p.nome || '(sem nome)') + '</strong><br>' +
            '<span style="font-size:.76rem;color:#a2968a;">' + esc(p.email || '') + '</span>' +
            (p.ja_comprou ? '<br><span style="font-size:.74rem;color:#b3261e;">já viveu esta</span>' : '') +
          '</td>' +
          '<td class="pg-why">' + esc((p.motivos || []).join(' · ') || '—') + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<span class="pg-pill" style="background:' + (ESTAGIO_COR[p.estagio] || '#999') + ';">' +
              esc(p.estagio) + '</span><br>' +
            '<span style="font-size:.76rem;color:#8a7c6f;">' +
              num(p.compras) + ' compra(s) · R$ ' + num(p.gasto_reais, 0) + '</span>' +
          '</td>' +
          '<td>' + (wa
            ? '<a class="pg-wa" target="_blank" rel="noopener" href="' + esc(wa) + '">WhatsApp</a>'
            : '<span class="pg-wa pg-wa--off">sem telefone</span>') + '</td>' +
          '</tr>';
      });
      h += '</tbody></table></div>';
    }
    return h + '</div>';
  }

  function slug(v) {
    var s = String(v == null ? '' : v);
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function blocoBase() {
    var q = slug(state.busca);
    var lista = state.pessoas.filter(function (p) {
      if (!q) return true;
      return slug((p.nome || '') + ' ' + (p.email || '') + ' ' +
                  (p.tags || []).join(' ') + ' ' + (p.estagio || '')).indexOf(q) >= 0;
    });

    var h = '<div class="pg-sec">' +
      '<h3 class="pg-sec__t">Base de pessoas</h3>' +
      '<p class="pg-sec__s">Todo mundo que a Elarah conhece, com o gosto que ela declarou ' +
      '(as tags aparecem aqui mesmo sem ninguém ter respondido nada — vêm do que a pessoa ' +
      'olhou e comprou).</p>' +
      '<div class="pg-ctrl">' +
      '<input id="pg-busca" placeholder="buscar por nome, e-mail, tag…" ' +
      'value="' + esc(state.busca) + '" style="min-width:260px;">' +
      '<span style="font-size:.85rem;color:#8a7c6f;">' + num(lista.length) +
      (lista.length === 1 ? ' pessoa' : ' pessoas') + '</span>' +
      '<button class="pg-btn pg-btn--ghost" id="pg-csv-base">Baixar CSV</button>' +
      '</div>';

    if (!lista.length) {
      h += '<div class="pg-empty">Nada por aqui.</div>';
      return h + '</div>';
    }

    h += '<div class="pg-scroll"><table class="pg-tbl"><thead><tr>' +
      '<th>Pessoa</th><th>Estágio</th><th>Gosto</th><th>Com quem</th>' +
      '<th>Compras</th><th>Última</th><th>WhatsApp</th>' +
      '</tr></thead><tbody>';
    lista.slice(0, 300).forEach(function (p) {
      h += '<tr>' +
        '<td><strong>' + esc(p.nome || '(sem nome)') + '</strong><br>' +
          '<span style="font-size:.76rem;color:#a2968a;">' + esc(p.email || '') + '</span></td>' +
        '<td><span class="pg-pill" style="background:' + (ESTAGIO_COR[p.estagio] || '#999') + ';">' +
          esc(p.estagio) + '</span></td>' +
        '<td>' + ((p.tags || []).slice(0, 6).map(function (t) {
            var declarada = (p.tags_declaradas || []).indexOf(t) >= 0;
            // Negrito = ela DISSE. Normal = a gente deduziu do
            // comportamento. A diferença importa na hora de escrever
            // a mensagem: "você marcou que queria" só vale pro negrito.
            return '<span class="pg-tag"' + (declarada ? ' style="font-weight:700;border-color:#f0a05e;"' : '') +
              '>' + esc(rotulo(t)) + '</span>';
          }).join('') || '<span style="color:#c0b5a8;">—</span>') + '</td>' +
        '<td>' + ((p.companhia || []).map(function (c) {
            return '<span class="pg-tag">' + esc(rotulo(c)) + '</span>';
          }).join('') || '<span style="color:#c0b5a8;">—</span>') + '</td>' +
        '<td style="white-space:nowrap;">' + num(p.compras) +
          '<br><span style="font-size:.76rem;color:#8a7c6f;">R$ ' + num(p.gasto_reais, 0) + '</span></td>' +
        '<td style="white-space:nowrap;font-size:.8rem;color:#8a7c6f;">' + dataCurta(p.ultima_compra) + '</td>' +
        '<td>' + (p.whatsapp_optin && p.telefone
          ? '<a class="pg-wa" target="_blank" rel="noopener" href="https://wa.me/' +
            esc(String(p.telefone).replace(/\D/g, '')) + '">falar</a>'
          : '<span style="color:#c0b5a8;font-size:.8rem;">' +
            (p.telefone ? 'sem opt-in' : '—') + '</span>') + '</td>' +
        '</tr>';
    });
    h += '</tbody></table></div>';
    if (lista.length > 300) {
      h += '<p style="font-size:.8rem;color:#a2968a;margin-top:10px;">' +
        'Mostrando as 300 primeiras. Use a busca ou baixe o CSV pra ver todas.</p>';
    }
    return h + '</div>';
  }

  // ===== CSV =====
  function baixarCsv(nome, cabecalho, linhas) {
    function cel(v) {
      if (Array.isArray(v)) v = v.join(' | ');
      return '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    }
    var csv = '﻿' + cabecalho.map(cel).join(';') + '\r\n' +
      linhas.map(function (l) { return l.map(cel).join(';'); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = 'elarah-' + nome + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ===== eventos =====
  function wire() {
    var dias = el('pg-dias');
    if (dias) dias.addEventListener('change', function () {
      state.dias = parseInt(dias.value, 10) || 90;
      run(true);
    });

    var rodar = el('pg-rodar');
    if (rodar) rodar.addEventListener('click', rodarMatch);

    var soW = el('pg-so-whats');
    if (soW) soW.addEventListener('change', function () {
      state.match.somenteWhats = soW.checked;
    });

    var exp = el('pg-exp');
    if (exp) {
      if (state.match.alvo) {
        exp.value = state.match.alvo.tipo === 'categoria'
          ? 'cat:' + state.match.alvo.categoria : state.match.alvo.id;
      }
      // Enter no select dispara a busca — economiza um clique num
      // fluxo que a admin vai repetir várias vezes por semana.
      exp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') rodarMatch();
      });
    }

    var busca = el('pg-busca');
    if (busca) {
      var t = null;
      busca.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.busca = busca.value;
          render();
          // Devolve o foco e o cursor: sem isso a admin perde a
          // digitação a cada re-render.
          var b2 = el('pg-busca');
          if (b2) { b2.focus(); b2.setSelectionRange(b2.value.length, b2.value.length); }
        }, 250);
      });
    }

    var csvM = el('pg-csv-match');
    if (csvM) csvM.addEventListener('click', function () {
      baixarCsv('match',
        ['Score', 'Nome', 'E-mail', 'WhatsApp', 'Motivos', 'Estágio', 'Compras', 'Gasto', 'Já viveu'],
        (state.match.linhas || []).map(function (p) {
          return [p.score, p.nome, p.email, p.telefone, p.motivos, p.estagio,
                  p.compras, p.gasto_reais, p.ja_comprou ? 'sim' : 'não'];
        }));
    });

    var csvB = el('pg-csv-base');
    if (csvB) csvB.addEventListener('click', function () {
      baixarCsv('perfis',
        ['Nome', 'E-mail', 'WhatsApp', 'Opt-in', 'Estágio', 'Gosto declarado',
         'Gosto deduzido', 'Com quem', 'Faixa', 'Momento', 'Desejo',
         'Compras', 'Gasto', 'Última compra'],
        state.pessoas.map(function (p) {
          return [p.nome, p.email, p.telefone, p.whatsapp_optin ? 'sim' : 'não', p.estagio,
                  p.tags_declaradas, p.tags_deduzidas, p.companhia, rotulo(p.faixa_preco),
                  rotulo(p.momento), p.desejo, p.compras, p.gasto_reais, p.ultima_compra];
        }));
    });
  }

  // ===== entrada =====
  async function run(force) {
    injectStyles();
    var velho = !state.atualizadoEm || (Date.now() - state.atualizadoEm) > TTL_MS;
    if (force || velho) { state.loaded = false; state.erro = null; }
    if (!state.loaded && !state.loading) {
      render();
      await carregar();
    }
    render();
  }

  function init() {
    injectStyles();
    var btn = el('pg-refresh');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () { run(true); });
    }
  }

  window.ElarahPerfilGosto = { run: run };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
