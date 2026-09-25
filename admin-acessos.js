/* =============================================================
   ELARAH — ACESSO POR PAINEL (equipe)
   -------------------------------------------------------------
   Antes: quem tinha profiles.role = 'admin' via TODAS as abas do
   painel. Não dava pra contratar alguém pro comercial sem entregar
   junto contabilidade, compras, usuários e analytics.

   Agora: a coluna public.profiles.admin_panels (text[]) diz QUAIS
   abas a pessoa vê.
     - admin_panels NULL  → acesso total (é o seu caso, dona da casa)
     - admin_panels = {…} → só as abas listadas aparecem no menu

   O que este arquivo faz:
     1. Guarda o catálogo de abas (chave técnica ↔ nome que aparece).
     2. Guarda os perfis prontos (Eventos, Comercial) pra facilitar
        cadastrar gente nova sem decorar chave de aba.
     3. Esconde do menu o que a pessoa não pode ver e devolve a lista
        do que sobrou (o admin.js usa pra decidir onde abrir).
     4. Desenha o editor de acesso que aparece na aba Usuários.

   IMPORTANTE — o que isto é e o que NÃO é:
   Isto organiza o PAINEL: cada uma entra e vê só o trabalho dela,
   sem se perder em aba que não é da área. Não é um cofre: no banco,
   as duas continuam com role='admin', então quem souber mexer no
   console do navegador ainda alcança os dados. Contrate com isso em
   mente — é controle de trabalho, não de segredo.
   ============================================================= */

(function () {
  'use strict';

  // ===== CATÁLOGO DE ABAS =====
  // A chave é o data-panel do botão no menu (admin.html). O label é
  // só pro editor e pras mensagens — mudar o label não quebra nada,
  // mudar a chave quebra.
  var PAINEIS = [
    { key: 'overview',             label: 'Visão geral',          grupo: 'Hoje' },
    { key: 'insights',             label: 'O que fazer hoje',     grupo: 'Hoje' },
    { key: 'feedbacks',            label: 'Feedbacks',            grupo: 'Hoje' },
    { key: 'postevent',            label: 'Pós-compra',           grupo: 'Hoje' },
    { key: 'conversas',            label: 'Conversas',            grupo: 'Comunicação' },
    { key: 'purchases',            label: 'Compras',              grupo: 'Vendas' },
    { key: 'eventos',              label: 'Eventos',              grupo: 'Vendas' },
    { key: 'eventos-privados',     label: 'Eventos privados',     grupo: 'Vendas' },
    { key: 'giftcards',            label: 'Gift Cards',           grupo: 'Vendas' },
    { key: 'coupons',              label: 'Cupons',               grupo: 'Vendas' },
    { key: 'desconto-geral',       label: 'Desconto geral',       grupo: 'Vendas' },
    { key: 'experiences',          label: 'Experiências',         grupo: 'Catálogo' },
    { key: 'byelarah',             label: 'By Elarah',            grupo: 'Catálogo' },
    { key: 'cotacao',              label: 'Cotação',              grupo: 'Catálogo' },
    { key: 'locais',               label: 'Locais p/ eventos',    grupo: 'Catálogo' },
    { key: 'partners',             label: 'Parceiros',            grupo: 'Pessoas' },
    { key: 'users',                label: 'Usuários',             grupo: 'Pessoas' },
    { key: 'interesses',           label: 'Interesses',           grupo: 'Pessoas' },
    { key: 'prospects',            label: 'Prospecção',           grupo: 'Pessoas' },
    { key: 'b2b-prospects',        label: 'Prospecção B2B',       grupo: 'Pessoas' },
    { key: 'captacao',             label: 'Captação',             grupo: 'Pessoas' },
    { key: 'contabilidade',        label: 'Contabilidade',        grupo: 'Dinheiro' },
    { key: 'analytics',            label: 'Analytics',            grupo: 'Dinheiro' },
    { key: 'broadcast',            label: 'Novidades',            grupo: 'Comunicação' },
    { key: 'calendario-editorial', label: 'Cronograma',           grupo: 'Comunicação' },
    { key: 'datas-comemorativas',  label: 'Datas Comemorativas',  grupo: 'Comunicação' }
  ];

  // ===== PERFIS PRONTOS =====
  // Espelham a tabela que a dona montou (set/2026). Pra dar a uma
  // pessoa nova o mesmo acesso, é só escolher o perfil no editor da
  // aba Usuários — ou rodar o SQL de sql/elarah_equipe_acessos.sql.
  //
  // Duas abas entraram além da tabela, por serem úteis e não mostrarem
  // dinheiro nenhum (marcadas com "+ extra"): tirar é 1 clique no
  // editor da aba Usuários.
  //   Visão geral → contadores (quantas usuárias, parceiras,
  //                 experiências). É a tela de entrada do painel.
  //   Interesses  → lista de quem levantou a mão pedindo experiência:
  //                 é lead na mão pra quem trabalha com venda.
  //
  // O que ficou DE FORA das duas de propósito: Compras, Gift Cards,
  // Cupons, Contabilidade, Analytics, Usuários e Novidades — é onde
  // moram faturamento, dados de pagamento e disparo pra base inteira.
  var PERFIS = {
    eventos: {
      label: 'Orçamentos & Eventos',
      paineis: [
        'overview',          // + extra
        'insights',          // O que fazer hoje
        'feedbacks',
        'eventos',
        'eventos-privados',
        'experiences',
        'byelarah',
        'cotacao',
        'locais',
        'partners'
      ]
    },
    comercial: {
      label: 'Comercial',
      paineis: [
        'overview',          // + extra
        'insights',          // O que fazer hoje
        'feedbacks',
        'experiences',
        'byelarah',
        'partners',
        'prospects',
        'interesses'         // + extra
      ]
    }
  };

  // Escopo de quem está logado agora. null = acesso total.
  var escopoAtual = null;

  function labelDoPainel(key) {
    for (var i = 0; i < PAINEIS.length; i++) {
      if (PAINEIS[i].key === key) return PAINEIS[i].label;
    }
    return key;
  }

  // Aceita null, [], array de chaves ou string vinda do Postgres no
  // formato "{a,b}" (acontece quando o driver não converte text[]).
  // Devolve sempre null (= total) ou array limpo de chaves válidas.
  function normalizar(valor) {
    if (valor == null) return null;
    var lista = valor;
    if (typeof valor === 'string') {
      var s = valor.trim();
      if (!s || s === '{}') return [];
      s = s.replace(/^\{/, '').replace(/\}$/, '');
      lista = s.split(',');
    }
    if (!Array.isArray(lista)) return null;
    var out = [];
    for (var i = 0; i < lista.length; i++) {
      var k = String(lista[i]).trim().replace(/^"|"$/g, '');
      if (k && out.indexOf(k) === -1) out.push(k);
    }
    return out;
  }

  // ===== APLICA O ESCOPO NO MENU =====
  // Esconde os botões que a pessoa não pode ver e, junto, o título do
  // grupo que ficou sem nenhum botão visível (pra não sobrar um
  // "Dinheiro" solto sem nada embaixo).
  //
  // Só ESCONDE — nunca mostra. Aba que já estava escondida no HTML
  // (Prospecção B2B, por exemplo) continua escondida.
  //
  // Devolve a lista de abas visíveis, na ordem do menu. Vazia/null
  // quer dizer acesso total.
  function aplicar(panels) {
    escopoAtual = normalizar(panels);

    var nav = document.querySelector('.admin__nav');
    if (!nav) return escopoAtual;

    // Acesso total: não mexe em nada.
    if (escopoAtual === null) return null;

    var permitidas = escopoAtual;
    var visiveis = [];

    var itens = nav.querySelectorAll('.admin__nav-item[data-panel]');
    for (var i = 0; i < itens.length; i++) {
      var item = itens[i];
      var key = item.getAttribute('data-panel');
      if (permitidas.indexOf(key) === -1) {
        item.style.display = 'none';
        continue;
      }
      // Não desfaz o display:none que o HTML já tinha (aba arquivada).
      if (item.style.display === 'none') continue;
      visiveis.push(key);
    }

    // Títulos de grupo: some se nenhum botão do grupo sobrou.
    var filhos = nav.children;
    var grupoAberto = null;
    var grupoTemItem = false;
    for (var j = 0; j < filhos.length; j++) {
      var el = filhos[j];
      if (el.classList.contains('admin__nav-group')) {
        if (grupoAberto && !grupoTemItem) grupoAberto.style.display = 'none';
        grupoAberto = el;
        grupoTemItem = false;
      } else if (el.classList.contains('admin__nav-item')) {
        if (el.style.display !== 'none') grupoTemItem = true;
      }
    }
    if (grupoAberto && !grupoTemItem) grupoAberto.style.display = 'none';

    console.info('[Elarah Acessos] escopo aplicado:', visiveis);
    return visiveis;
  }

  // Pode abrir esta aba? Usado pelo admin.js pra barrar navegação
  // programática (atalhos internos que pulam pra outra aba).
  function podeVer(panel) {
    if (escopoAtual === null) return true;
    return escopoAtual.indexOf(panel) !== -1;
  }

  // null = a pessoa logada tem acesso total (é dona do painel).
  function meuEscopo() { return escopoAtual; }
  function souAdminTotal() { return escopoAtual === null; }

  // Resumo curto pra mostrar na lista de usuários.
  function resumo(panels) {
    var lista = normalizar(panels);
    if (lista === null) return 'Acesso total';
    if (!lista.length) return 'Nenhuma aba liberada';
    var nomes = lista.map(labelDoPainel);
    if (nomes.length <= 3) return nomes.join(', ');
    return nomes.slice(0, 3).join(', ') + ' +' + (nomes.length - 3);
  }

  // Se o conjunto bate exatamente com um perfil pronto, devolve a
  // chave dele — serve pra deixar o rádio certo marcado no editor.
  function perfilDe(panels) {
    var lista = normalizar(panels);
    if (lista === null) return 'total';
    for (var chave in PERFIS) {
      if (!Object.prototype.hasOwnProperty.call(PERFIS, chave)) continue;
      var alvo = PERFIS[chave].paineis;
      if (alvo.length !== lista.length) continue;
      var igual = true;
      for (var i = 0; i < alvo.length; i++) {
        if (lista.indexOf(alvo[i]) === -1) { igual = false; break; }
      }
      if (igual) return chave;
    }
    return 'custom';
  }

  // ===== EDITOR (aba Usuários) =====
  // Modal simples: escolhe um perfil pronto ou marca aba por aba.
  // Salva direto em public.profiles.admin_panels.
  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function abrirEditor(user, onSalvo) {
    if (!user || !user.id) return;

    var atual = normalizar(user.admin_panels);
    var marcadas = atual === null ? [] : atual.slice();
    // "Acesso total" só vem pré-marcado pra quem JÁ é admin sem escopo.
    // Abrindo pra uma cliente comum (botão "Dar acesso"), o modal
    // começa vazio — dar o painel inteiro tem que ser escolha, nunca
    // o default de um clique distraído.
    var modoTotal = user.role === 'admin' && atual === null;

    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;' +
      'display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto;';

    var grupos = [];
    for (var i = 0; i < PAINEIS.length; i++) {
      var p = PAINEIS[i];
      if (!grupos.length || grupos[grupos.length - 1].nome !== p.grupo) {
        grupos.push({ nome: p.grupo, itens: [] });
      }
      grupos[grupos.length - 1].itens.push(p);
    }

    var checkboxesHtml = grupos.map(function (g) {
      var itens = g.itens.map(function (p) {
        var checked = marcadas.indexOf(p.key) !== -1 ? ' checked' : '';
        return '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:.9rem;cursor:pointer;">' +
                 '<input type="checkbox" data-acesso-painel="' + escapeHtml(p.key) + '"' + checked + '>' +
                 '<span>' + escapeHtml(p.label) + '</span>' +
               '</label>';
      }).join('');
      return '<div style="margin-bottom:14px;">' +
               '<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#9a8f7d;margin-bottom:4px;">' + escapeHtml(g.nome) + '</div>' +
               itens +
             '</div>';
    }).join('');

    var perfisHtml = Object.keys(PERFIS).map(function (chave) {
      return '<button type="button" data-acesso-perfil="' + escapeHtml(chave) + '" ' +
             'style="padding:7px 12px;border:1px solid #e3d9c6;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-size:.82rem;">' +
             escapeHtml(PERFIS[chave].label) + '</button>';
    }).join('');

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:12px;max-width:560px;width:100%;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.2);font-family:inherit;">' +
        '<h2 style="margin:0 0 4px;font-size:1.15rem;">Acesso ao painel</h2>' +
        '<p style="margin:0 0 18px;color:#777;font-size:.86rem;">' +
          escapeHtml(user.nome || user.email || 'Usuária') +
          (user.email ? ' <span style="color:#aaa;">(' + escapeHtml(user.email) + ')</span>' : '') +
        '</p>' +

        '<div style="background:#fbf7f0;border:1px solid #f0e6d6;border-radius:8px;padding:12px 14px;margin-bottom:18px;">' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:.92rem;font-weight:600;cursor:pointer;">' +
            '<input type="checkbox" id="acesso-total"' + (modoTotal ? ' checked' : '') + '>' +
            '<span>Acesso total (vê tudo, como você)</span>' +
          '</label>' +
        '</div>' +

        '<div id="acesso-detalhe" style="' + (modoTotal ? 'opacity:.4;pointer-events:none;' : '') + '">' +
          '<div style="margin-bottom:14px;">' +
            '<div style="font-size:.8rem;color:#666;margin-bottom:6px;">Atalho — usar um perfil pronto:</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + perfisHtml +
              '<button type="button" data-acesso-limpar style="padding:7px 12px;border:1px solid #e3d9c6;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-size:.82rem;color:#999;">Limpar</button>' +
            '</div>' +
          '</div>' +
          '<div style="max-height:320px;overflow:auto;border-top:1px solid #f0ece4;padding-top:14px;">' + checkboxesHtml + '</div>' +
        '</div>' +

        '<div id="acesso-erro" style="display:none;color:#b00;font-size:.85rem;margin-top:12px;"></div>' +

        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">' +
          '<button type="button" id="acesso-cancelar" style="padding:9px 16px;border:1px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-size:.9rem;color:#666;">Cancelar</button>' +
          '<button type="button" id="acesso-salvar" style="padding:9px 18px;border:0;background:#f0a05e;color:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600;font-size:.9rem;">Salvar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var totalEl = overlay.querySelector('#acesso-total');
    var detalheEl = overlay.querySelector('#acesso-detalhe');
    var erroEl = overlay.querySelector('#acesso-erro');

    function setChecks(lista) {
      var boxes = overlay.querySelectorAll('[data-acesso-painel]');
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].checked = lista.indexOf(boxes[i].getAttribute('data-acesso-painel')) !== -1;
      }
    }

    totalEl.addEventListener('change', function () {
      detalheEl.style.opacity = totalEl.checked ? '.4' : '1';
      detalheEl.style.pointerEvents = totalEl.checked ? 'none' : 'auto';
    });

    overlay.querySelectorAll('[data-acesso-perfil]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setChecks(PERFIS[btn.getAttribute('data-acesso-perfil')].paineis);
      });
    });
    var limparBtn = overlay.querySelector('[data-acesso-limpar]');
    if (limparBtn) limparBtn.addEventListener('click', function () { setChecks([]); });

    function fechar() { try { document.body.removeChild(overlay); } catch (e) {} }
    overlay.querySelector('#acesso-cancelar').addEventListener('click', fechar);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) fechar(); });

    overlay.querySelector('#acesso-salvar').addEventListener('click', async function () {
      var btn = this;
      var novo = null;
      if (!totalEl.checked) {
        novo = [];
        var boxes = overlay.querySelectorAll('[data-acesso-painel]');
        for (var i = 0; i < boxes.length; i++) {
          if (boxes[i].checked) novo.push(boxes[i].getAttribute('data-acesso-painel'));
        }
      }

      btn.disabled = true;
      btn.textContent = 'Salvando…';
      erroEl.style.display = 'none';

      var sb = window.supabaseClient;
      if (!sb) {
        erroEl.textContent = 'Supabase não carregou. Recarregue a página e tente de novo.';
        erroEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Salvar';
        return;
      }

      // Quem ganha aba do painel precisa de role='admin' pra passar
      // pelas policies do banco. Quem fica sem nenhuma aba volta a ser
      // usuária comum — é assim que se tira o acesso de alguém.
      var patch;
      if (novo !== null && novo.length === 0) {
        // Nenhuma aba marcada = tirar do painel. Volta a ser cliente
        // comum e zera o escopo, pra não deixar array vazio pendurado
        // (que, num role='admin' futuro, seria acesso total por engano).
        patch = { role: 'user', admin_panels: null };
      } else {
        patch = { role: 'admin', admin_panels: novo };
      }

      var res = await sb.from('profiles').update(patch).eq('id', user.id).select().maybeSingle();
      if (res.error) {
        console.error('[Elarah Acessos] erro salvando admin_panels', res.error);
        var msg = String(res.error.message || res.error);
        erroEl.textContent = /column .*admin_panels/i.test(msg)
          ? 'A coluna admin_panels ainda não existe no banco. Rode sql/elarah_equipe_acessos.sql no SQL Editor do Supabase.'
          : 'Não deu pra salvar: ' + msg;
        erroEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Salvar';
        return;
      }

      fechar();
      if (typeof onSalvo === 'function') onSalvo(res.data || null);
    });
  }

  window.ElarahAcessos = {
    PAINEIS: PAINEIS,
    PERFIS: PERFIS,
    aplicar: aplicar,
    podeVer: podeVer,
    meuEscopo: meuEscopo,
    souAdminTotal: souAdminTotal,
    normalizar: normalizar,
    resumo: resumo,
    perfilDe: perfilDe,
    labelDoPainel: labelDoPainel,
    abrirEditor: abrirEditor
  };
})();
