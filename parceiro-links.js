/* =============================================================
   ELARAH — PÁGINA DE LINKS DE PARCEIRO ("link na bio")
   -------------------------------------------------------------
   Monta a lista de experiências de UM parceiro a partir da mesma
   fonte que o site público usa, pra que a página nunca fique
   desatualizada em relação ao catálogo:

     ElarahData.getVisibleExperiences()
       → já aplica is_active (oculta no admin) + cutoff de venda
         + auto-expiração da data
     ElarahData.isExpiredRecurring()
       → derruba recorrente sem nenhuma turma futura

   O vínculo experiência ↔ parceiro é lido de dois lugares
   (os dois modelos que convivem no banco):
     1. experiences.fornecedor_nome        (legado, 1 fornecedor)
     2. experience_suppliers.fornecedor_nome (atual, N por experiência)
   Basta bater em um deles. A comparação é por NOME EXATO — ignora
   acento, maiúscula e espaço sobrando, mas não casa por pedaço. É de
   propósito: com "contém", um parceiro futuro de nome parecido
   ("Ateliê Flor de Lis") apareceria na página de outro. Fornecedor
   escrito diferente do configurado não entra; o ?debug=1 mostra
   exatamente qual nome está gravado em cada experiência.

   Uso (no HTML da página do parceiro):
     ElarahParceiroLinks.init({ nome, match, logo, instagram, ... })

   Diagnóstico: abra a página com ?debug=1 e veja o console —
   lista o que entrou, o que ficou de fora e por quê.
   ============================================================= */

(function (window, document) {
  'use strict';

  var SUPPLIERS_TABLE = 'experience_suppliers';
  var DEBUG = /[?&]debug=1/.test(window.location.search);

  function log() {
    if (!DEBUG) return;
    console.info.apply(console, ['[ParceiroLinks]'].concat([].slice.call(arguments)));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Normaliza pra comparar nome de fornecedor digitado à mão:
  // "Ateliê  Flor de Arte " → "atelie flor de arte"
  function norm(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // ===== Datas =====
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  function dataCurta(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    return DIAS[d.getDay()] + ', ' + dia + '/' + mes;
  }

  // Rótulo de data do card: próxima ocorrência futura quando existe;
  // senão o texto livre do cadastro ("Semanal", "A combinar"…).
  function dataLabel(exp) {
    var futuras = Array.isArray(exp._futureDates) ? exp._futureDates : [];
    if (futuras.length) {
      var label = dataCurta(futuras[0]);
      if (futuras.length > 1) label += ' +' + (futuras.length - 1);
      return label;
    }
    return String(exp.data || '').trim();
  }

  // Esgotada = TODAS as turmas futuras sem vaga. Quando nao da pra
  // afirmar (sem turma datada e sem controle de vagas), devolve false —
  // some da pagina so o que o banco garante que acabou.
  function esgotada(exp, nowMs) {
    var slots = Array.isArray(exp._slots) ? exp._slots : [];
    var futuros = slots.filter(function (sl) {
      if (!sl || sl.isActive === false) return false;
      var ts = sl.eventAt ? new Date(sl.eventAt).getTime() : NaN;
      return isNaN(ts) ? true : ts >= nowMs;
    });
    function temVaga(o) {
      var cap = o.vagasTotal != null ? Number(o.vagasTotal) : null;
      if (cap == null || !(cap > 0)) return true; // sem teto = ilimitada
      var rest = o.vagasRestantes != null ? Number(o.vagasRestantes) : cap;
      return rest > 0;
    }
    if (futuros.length) return !futuros.some(temVaga);
    return !temVaga(exp);
  }

  // "últimas 2" — mesmo selo que o card do site usa.
  function escassezLabel(exp, nowMs) {
    if (!window.ElarahData || !ElarahData.scarcityForCard) return '';
    var n = ElarahData.scarcityForCard(exp, exp._slots || [], nowMs);
    if (n == null) return '';
    return n === 1 ? 'última vaga' : 'últimas ' + n;
  }

  function precoLabel(exp) {
    var vig = (window.ElarahData && ElarahData.precoVigente)
      ? ElarahData.precoVigente(exp) : exp.preco;
    if (window.ElarahData && ElarahData.formatPrecoBR) {
      return ElarahData.formatPrecoBR(vig) || '';
    }
    return String(vig || '');
  }

  // ===== Vínculo com o parceiro =====
  // Nome EXATO (já normalizado dos dois lados). "Ateliê Flor de Arte",
  // "ATELIE FLOR DE ARTE" e "  atelie  flor de arte " são o mesmo nome;
  // "Ateliê Flor de Lis" e "Ateliê Flor de Artes" não são.
  function matchNome(nomeFornecedor, nomesAceitos) {
    var n = norm(nomeFornecedor);
    if (!n) return false;
    return nomesAceitos.indexOf(n) !== -1;
  }

  // IDs de experiências ligadas ao parceiro pela tabela nova (1:N).
  // Leitura pública liberada (sql/elarah_experience_suppliers.sql).
  // Falha aqui não quebra a página: cai só no fornecedor_nome legado.
  async function idsPorSuppliers(termos) {
    var set = new Set();
    var sb = window.supabaseClient;
    if (!sb && window.ElarahSupabase && window.ElarahSupabase.waitClient) {
      sb = await window.ElarahSupabase.waitClient(8000);
    }
    if (!sb) return set;
    try {
      var res = await sb.from(SUPPLIERS_TABLE)
        .select('experience_id, fornecedor_nome')
        .range(0, 9999);
      if (res.error) {
        log('experience_suppliers indisponível:', res.error.message);
        return set;
      }
      (res.data || []).forEach(function (r) {
        if (r && matchNome(r.fornecedor_nome, termos)) set.add(r.experience_id);
      });
    } catch (e) {
      log('experience_suppliers exceção:', e);
    }
    return set;
  }

  // ===== Render =====
  function cardHTML(exp, cfg) {
    var qs = 'experiencia.html?id=' + encodeURIComponent(exp.id);
    if (cfg.utm) {
      qs += '&utm_source=' + encodeURIComponent(cfg.utm) +
            '&utm_medium=parceiro&utm_campaign=link-na-bio';
    }

    var waitlist = exp.ctaMode === 'waitlist';
    var ctaLabel = waitlist ? 'Lista de espera' : 'Reservar';
    var ctaClass = 'afa-card__cta' + (waitlist ? ' afa-card__cta--outline' : '');

    var meta = [];
    var dLabel = dataLabel(exp);
    if (dLabel) meta.push('<span class="afa-card__flag">' + esc(dLabel) + '</span>');
    if (exp._escassez) meta.push('<span class="afa-card__flag afa-card__flag--hot">' + esc(exp._escassez) + '</span>');
    if (exp.bairro) meta.push('<span>' + esc(exp.bairro) + '</span>');
    if (exp.duracao) meta.push('<span>' + esc(exp.duracao) + '</span>');

    var preco = precoLabel(exp);
    // Sem foto (ou foto quebrada) o quadrado nao fica vazio: entra um
    // desenho de flor da identidade da pagina.
    var FLOR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 12.5V22"/><path d="M12 17c-2.2 0-4-1.5-4-3.5"/><path d="M12 19.5c2.2 0 4-1.5 4-3.5"/>' +
      '<circle cx="12" cy="7" r="2.6"/>' +
      '<path d="M12 4.4a2.6 2.6 0 1 0-2.3 3.9M12 4.4a2.6 2.6 0 1 1 2.3 3.9M9.7 8.3a2.6 2.6 0 1 0 2.3 3.9M14.3 8.3a2.6 2.6 0 1 1-2.3 3.9"/>' +
      '</svg>';
    var thumb = exp.imagem
      ? '<img src="' + esc(exp.imagem) + '" alt="" loading="lazy" decoding="async" ' +
        'onerror="this.parentNode.innerHTML=this.parentNode.dataset.fallback">'
      : FLOR;

    return '' +
      '<a class="afa-card" href="' + esc(qs) + '">' +
        '<span class="afa-card__thumb" data-fallback="' + esc(FLOR) + '">' + thumb + '</span>' +
        '<span class="afa-card__body">' +
          '<span class="afa-card__name">' + esc(exp.nome) + '</span>' +
          (meta.length ? '<span class="afa-card__meta">' + meta.join('') + '</span>' : '') +
          (preco ? '<span class="afa-card__price">' + esc(preco) + ' <small>por pessoa</small></span>' : '') +
        '</span>' +
        '<span class="' + ctaClass + '">' + ctaLabel + '</span>' +
      '</a>';
  }

  function chipsHTML(cfg) {
    var out = '';
    if (cfg.instagram) {
      var handle = String(cfg.instagram).replace(/^@/, '');
      out += '<a class="afa__chip" href="https://instagram.com/' + esc(handle) + '" target="_blank" rel="noopener">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<rect x="2" y="2" width="20" height="20" rx="5"></rect>' +
        '<circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"></circle>' +
        '</svg>@' + esc(handle) + '</a>';
    }
    if (cfg.whatsapp) {
      var msg = encodeURIComponent('Oi! Vi seus links na página da Elarah e queria saber mais.');
      out += '<a class="afa__chip" href="https://wa.me/' + esc(cfg.whatsapp) + '?text=' + msg + '" target="_blank" rel="noopener">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z"></path>' +
        '</svg>' + esc(cfg.whatsappLabel || 'WhatsApp') + '</a>';
    }
    return out;
  }

  // Logo do parceiro: só entra se o arquivo existir de verdade.
  // Enquanto não existe, fica o selo tipográfico do HTML — nada de
  // ícone de imagem quebrada.
  function carregarLogo(cfg) {
    var box = document.getElementById('afa-logo');
    if (!box) return;

    // cfg.logo aceita um caminho OU uma lista. Testa um por um e para
    // no primeiro que carregar — assim o arquivo pode ser subido com
    // qualquer uma das grafias/pastas previstas sem precisar editar
    // código. Nenhum carregou: fica o selo tipográfico do HTML.
    //
    // Passar uma lista pra versão antiga (que fazia probe.src = cfg.logo)
    // virava UMA url com vírgulas — 404 silencioso e logo sumido.
    var candidatos = Array.isArray(cfg.logo) ? cfg.logo.slice() : (cfg.logo ? [cfg.logo] : []);
    if (!candidatos.length) return;

    (function tentar(i) {
      if (i >= candidatos.length) {
        log('logo não encontrada em nenhum caminho:', candidatos);
        return;
      }
      var caminho = candidatos[i];
      var probe = new Image();
      probe.onload = function () {
        box.innerHTML = '<img src="' + esc(caminho) + '" alt="' + esc(cfg.nome) + '">';
        log('logo carregada de', caminho);
      };
      probe.onerror = function () { tentar(i + 1); };
      probe.src = caminho;
    })(0);
  }

  function mostrarMensagem(texto) {
    var listEl = document.getElementById('afa-list');
    var emptyEl = document.getElementById('afa-empty');
    if (listEl) { listEl.innerHTML = ''; listEl.setAttribute('aria-busy', 'false'); }
    if (emptyEl) { emptyEl.innerHTML = texto; emptyEl.hidden = false; }
  }

  // ===== Fluxo principal =====
  async function init(cfg) {
    cfg = cfg || {};
    // cfg.match = lista de nomes de fornecedor aceitos (comparação exata).
    var termos = (cfg.match || []).map(norm).filter(Boolean);
    var idsExtra = new Set(cfg.idsExtra || []);

    carregarLogo(cfg);

    // Parceiro sem instagram/whatsapp cadastrados: esconde a faixa em
    // vez de deixar um vão vazio entre o nome e o selo da Elarah.
    var chips = document.getElementById('afa-chips');
    if (chips) {
      var html = chipsHTML(cfg);
      chips.innerHTML = html;
      chips.hidden = !html;
    }

    var listEl = document.getElementById('afa-list');
    if (!listEl) return;

    var experiencias;
    try {
      if (!window.ElarahData || !ElarahData.getVisibleExperiences) {
        throw new Error('ElarahData indisponível');
      }
      // Mesma pipeline das páginas de categoria: visíveis → slots →
      // datas futuras → derruba recorrente vencida.
      experiencias = await ElarahData.getVisibleExperiences();

      var slotMap = new Map();
      try {
        if (ElarahData.loadAllSlots) slotMap = await ElarahData.loadAllSlots();
      } catch (e) { log('slots indisponíveis:', e); }

      var agora = Date.now();
      experiencias.forEach(function (e) {
        e._slots = slotMap.get(e.id) || [];
        e._futureDates = ElarahData.experienceFutureDates
          ? ElarahData.experienceFutureDates(e, e._slots, agora)
          : [];
      });
      if (ElarahData.isExpiredRecurring) {
        experiencias = experiencias.filter(function (e) {
          return !ElarahData.isExpiredRecurring(e, e._slots, agora);
        });
      }
    } catch (e) {
      console.error('[ParceiroLinks] falha ao carregar experiências:', e);
      mostrarMensagem(
        'Não consegui carregar a lista agora. ' +
        '<a href="index.html">Ver experiências na Elarah</a>'
      );
      return;
    }

    var idsSupplier = await idsPorSuppliers(termos);

    var agoraMs = Date.now();
    var doParceiro = experiencias.filter(function (e) {
      return matchNome(e.fornecedorNome, termos) ||
             idsSupplier.has(e.id) ||
             idsExtra.has(e.id);
    });

    // Só entra o que dá pra comprar de verdade: esgotada sai da lista.
    var minhas = doParceiro.filter(function (e) { return !esgotada(e, agoraMs); });
    if (DEBUG && minhas.length !== doParceiro.length) {
      log('esgotadas (fora da lista):', doParceiro
        .filter(function (e) { return esgotada(e, agoraMs); })
        .map(function (e) { return e.nome; }));
    }
    minhas.forEach(function (e) { e._escassez = escassezLabel(e, agoraMs); });

    // Ordena pela próxima data; sem data vai pro fim, desempate por nome.
    minhas.sort(function (a, b) {
      var da = (a._futureDates && a._futureDates[0]) || Infinity;
      var db = (b._futureDates && b._futureDates[0]) || Infinity;
      if (da !== db) return da - db;
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
    });

    if (DEBUG) {
      log('visíveis no site:', experiencias.length, '| do parceiro:', minhas.length);
      log('nomes aceitos (exatos):', termos);
      console.table(experiencias.map(function (e) {
        return {
          nome: e.nome,
          fornecedor_nome: e.fornecedorNome || '—',
          via_suppliers: idsSupplier.has(e.id),
          entrou: matchNome(e.fornecedorNome, termos) || idsSupplier.has(e.id) || idsExtra.has(e.id),
          id: e.id
        };
      }));
    }

    listEl.setAttribute('aria-busy', 'false');

    if (!minhas.length) {
      console.warn(
        '[ParceiroLinks] nenhuma experiência encontrada para "' + (cfg.nome || '') + '". ' +
        'Confira o campo Fornecedor das experiências no admin (ou use idsExtra). ' +
        'Abra esta página com ?debug=1 pra ver a lista completa.'
      );
      mostrarMensagem(
        'Nenhuma turma com vaga aberta neste momento. ' +
        '<a href="index.html">Ver outras experiências na Elarah</a>'
      );
      return;
    }

    listEl.innerHTML = minhas.map(function (e) { return cardHTML(e, cfg); }).join('');
  }

  window.ElarahParceiroLinks = { init: init };
})(window, document);
