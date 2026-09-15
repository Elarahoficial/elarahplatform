/* =============================================================
   ELARAH — Aba "Feedbacks" (avaliações pós-experiência)
   -------------------------------------------------------------
   Depois de cada experiência a cliente recebe um link (avaliar.html)
   pra dar nota de 1 a 5 e escrever um comentário. A resposta cai na
   tabela public.reviews (sql/elarah_reviews.sql).

   Esta aba junta as duas pontas:
     - quantos PEDIDOS de feedback saíram (bookings.feedback_solicitado_at
       = WhatsApp manual, bookings.review_request_sent_at = e-mail do cron)
     - quantas RESPOSTAS voltaram (public.reviews), com nota média,
       distribuição, ranking por parceiro e por categoria
     - TODOS os comentários salvos, cada um num menu suspenso

   Filtros: período, faixa de nota (inclusive as acumuladas "até 1★",
   "até 2★", "até 3★"), categoria, parceiro, experiência, presença de
   comentário e busca livre. O objetivo da aba é responder "onde a
   gente precisa melhorar", então o ranking sai por padrão com a pior
   média primeiro.

   Autocontido: injeta o próprio CSS, não depende do admin.js.
   Renderiza dentro de #feedbacks-root.
   ============================================================= */
(function (window, document) {
  'use strict';

  var ROOT_ID = 'feedbacks-root';

  function sb() { return window.supabaseClient || null; }
  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Chave de comparação insensível a caixa/acento — usada pra casar
  // nome de experiência da review com a experiência do catálogo e pra
  // agrupar parceiros escritos com grafia levemente diferente.
  function chave(s) {
    var v = String(s == null ? '' : s);
    // Tira acento (NFD separa a letra do sinal, o range apaga o sinal).
    if (v.normalize) v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return v.toLowerCase().trim();
  }

  function num(n, casas) {
    var v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: casas || 0,
      maximumFractionDigits: casas || 0,
    });
  }

  function pct(parte, total) {
    if (!total) return '—';
    return num((parte / total) * 100, 1) + '%';
  }

  function plural(n, singular, plural_) {
    return num(n) + ' ' + (Number(n) === 1 ? singular : plural_);
  }

  function estrelas(n) {
    var cheia = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return '★★★★★'.slice(0, cheia) + '☆☆☆☆☆'.slice(0, 5 - cheia);
  }

  function dataCurta(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function dataLonga(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  // ===========================================================
  // ESTADO
  // ===========================================================
  var state = {
    loading: false,
    loaded: false,
    erro: null,
    faltaTabelaReviews: false,
    semColunasPedido: false,   // migração de pedido de feedback não rodou
    reviews: [],               // normalizadas
    pedidos: [],               // bookings que já receberam pedido
    bookingsById: new Map(),
    colunasPedido: [],
    colunasPedidoFaltando: [],
    atualizadoEm: null,
  };

  var filtros = {
    periodo: '',        // '', '7', '30', '90', '365'
    de: '',
    ate: '',
    nota: '',           // 'eq:5' | 'lte:3' | 'gte:4'
    categoria: '',
    parceiro: '',
    experiencia: '',    // chave do nome da experiência
    comentario: '',     // '', 'com', 'sem'
    visibilidade: '',   // '', 'visivel', 'oculta'
    busca: '',
    ordem: 'recentes',  // recentes | antigos | nota-asc | nota-desc
    rank: 'pior',       // pior | melhor | volume
  };

  var FILTROS_PADRAO = JSON.parse(JSON.stringify(filtros));

  // ===========================================================
  // CSS
  // ===========================================================
  function injectStyles() {
    if (el('feedbacks-styles')) return;
    var css = [
      '.fb-hint{font-size:.8rem;color:#8a8279;margin:-18px 0 22px;line-height:1.5}',
      '.fb-card{background:#fff;border:1px solid #f0e8de;border-radius:14px;padding:18px 20px;box-shadow:0 4px 16px rgba(0,0,0,.04);margin-bottom:18px}',
      '.fb-card__title{font-size:.95rem;font-weight:700;color:#1a1a1a;margin:0 0 4px}',
      '.fb-card__sub{font-size:.78rem;color:#8a8279;margin:0 0 14px;line-height:1.5}',
      '.fb-filtros{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}',
      '.fb-field{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.fb-field label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9a918a}',
      '.fb-field select,.fb-field input{padding:8px 10px;border:1px solid #e6ddd2;border-radius:8px;background:#fff;font-family:inherit;font-size:.85rem;color:#333;min-width:0;width:100%}',
      '.fb-filtros-acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}',
      '.fb-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fdf3e8;color:#a9622a;font-size:.72rem;font-weight:700}',
      '.fb-dist{display:grid;gap:7px}',
      '.fb-dist__row{display:flex;align-items:center;gap:10px;background:none;border:none;padding:4px 2px;width:100%;text-align:left;cursor:pointer;border-radius:8px;font:inherit}',
      '.fb-dist__row:hover{background:#faf6f0}',
      '.fb-dist__row--on{background:#fdf3e8}',
      '.fb-dist__star{flex:0 0 58px;color:#f0a05e;font-size:.85rem;letter-spacing:1px;white-space:nowrap}',
      '.fb-dist__bar{flex:1 1 auto;height:9px;background:#f4efe8;border-radius:999px;overflow:hidden;min-width:40px}',
      '.fb-dist__fill{display:block;height:100%;border-radius:999px;background:#f0a05e}',
      '.fb-dist__fill--ruim{background:#d4674f}',
      '.fb-dist__num{flex:0 0 auto;font-size:.8rem;font-weight:700;color:#4a443c;white-space:nowrap}',
      '.fb-table{width:100%;border-collapse:collapse;font-size:.85rem}',
      '.fb-table th{text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#9a918a;font-weight:700;padding:0 10px 8px;border-bottom:1px solid #f0e8de;white-space:nowrap}',
      '.fb-table td{padding:9px 10px;border-bottom:1px solid #f7f2eb;color:#3a352f;vertical-align:middle}',
      '.fb-table tr:last-child td{border-bottom:none}',
      '.fb-table__num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.fb-media{font-weight:700;white-space:nowrap}',
      '.fb-media--bom{color:#1a8a4a}',
      '.fb-media--medio{color:#b07b00}',
      '.fb-media--ruim{color:#c0392b}',
      '.fb-mini{display:inline-flex;height:7px;width:90px;border-radius:999px;overflow:hidden;background:#f4efe8;vertical-align:middle}',
      '.fb-mini i{display:block;height:100%}',
      '.fb-com{border:1px solid #f0e8de;border-radius:12px;margin-bottom:8px;background:#fff;overflow:hidden}',
      '.fb-com--ruim{border-color:#f0cfc7}',
      '.fb-com>summary{cursor:pointer;padding:11px 14px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;list-style:none;font-size:.86rem}',
      '.fb-com>summary::-webkit-details-marker{display:none}',
      '.fb-com>summary:hover{background:#faf6f0}',
      '.fb-com[open]>summary{background:#faf6f0;border-bottom:1px solid #f0e8de}',
      '.fb-com__nota{flex:0 0 auto;color:#f0a05e;letter-spacing:1px;font-size:.9rem}',
      '.fb-com__nota--ruim{color:#d4674f}',
      '.fb-com__quem{font-weight:700;color:#1a1a1a}',
      '.fb-com__resumo{color:#6d655d;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px}',
      '.fb-com__data{margin-left:auto;color:#a09890;font-size:.76rem;white-space:nowrap}',
      '.fb-com__body{padding:14px}',
      '.fb-com__texto{font-size:.92rem;line-height:1.6;color:#2a2a2a;white-space:pre-wrap;margin:0 0 12px}',
      '.fb-com__texto--vazio{color:#a09890;font-style:italic}',
      '.fb-com__meta{display:flex;flex-wrap:wrap;gap:6px}',
      '.fb-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:#f7f2eb;color:#6d655d;font-size:.72rem}',
      '.fb-tag b{color:#3a352f;font-weight:700}',
      '.fb-com--oculta{opacity:.72;background:#fbfafa}',
      '.fb-com--oculta .fb-com__resumo{text-decoration:line-through;text-decoration-color:#c9c2bb}',
      '.fb-selo-oculta{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:#ebe6e0;color:#6d655d;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}',
      '.fb-com__acoes{margin-top:12px;padding-top:12px;border-top:1px dashed #f0e8de;display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.fb-btn-ocultar{padding:6px 12px;border-radius:8px;border:1px solid #e0d6ca;background:#fff;color:#6d655d;font-family:inherit;font-size:.78rem;font-weight:700;cursor:pointer}',
      '.fb-btn-ocultar:hover{background:#faf6f0;border-color:#c9bdae}',
      '.fb-btn-ocultar[disabled]{opacity:.55;cursor:default}',
      '.fb-btn-ocultar--mostrar{border-color:#9cc9ac;color:#1a8a4a}',
      '.fb-btn-ocultar--mostrar:hover{background:#f0f8f3;border-color:#1a8a4a}',
      '.fb-acao-msg{font-size:.76rem;color:#8a8279}',
      '.fb-media-dupla{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline;margin-top:10px;font-size:.8rem;color:#8a8279}',
      '.fb-media-dupla b{color:#3a352f}',
      '.fb-vazio{padding:26px 14px;text-align:center;color:#9a918a;font-size:.88rem}',
      '.fb-aviso{background:#fff8ef;border:1px solid #f0d8b4;border-radius:12px;padding:16px 18px;color:#7a5a20;font-size:.88rem;line-height:1.6;margin-bottom:18px}',
      '.fb-aviso code{background:#fff;border:1px solid #f0d8b4;border-radius:5px;padding:1px 6px;font-size:.85em}',
      '.fb-erro{background:#fdecea;border:1px solid #f5c6c0;border-radius:12px;padding:16px 18px;color:#a03026;font-size:.88rem;line-height:1.6;margin-bottom:18px}',
      '@media (max-width:640px){.fb-com__resumo{max-width:100%}.fb-com__data{margin-left:0}}',
    ].join('\n');
    var tag = document.createElement('style');
    tag.id = 'feedbacks-styles';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  // ===========================================================
  // CARGA
  // ===========================================================
  var idx = {
    expById: new Map(),
    expByNome: new Map(),
    fornecedoresByExpId: new Map(),  // experience_suppliers (modelo 1:N)
  };

  function indexarExperiencias(exps) {
    idx.expById = new Map();
    idx.expByNome = new Map();
    (exps || []).forEach(function (e) {
      if (!e) return;
      if (e.id) idx.expById.set(e.id, e);
      var k = chave(e.nome);
      if (k && !idx.expByNome.has(k)) idx.expByNome.set(k, e);
    });
  }

  async function carregarFornecedores() {
    idx.fornecedoresByExpId = new Map();
    var s = sb();
    if (!s) return;
    try {
      var r = await s.from('experience_suppliers')
        .select('experience_id, fornecedor_nome')
        .limit(5000);
      if (r.error) return;                    // tabela opcional — ignora
      (r.data || []).forEach(function (row) {
        if (!row || !row.experience_id) return;
        var nome = String(row.fornecedor_nome || '').trim();
        if (!nome) return;
        var lista = idx.fornecedoresByExpId.get(row.experience_id) || [];
        if (lista.indexOf(nome) === -1) lista.push(nome);
        idx.fornecedoresByExpId.set(row.experience_id, lista);
      });
    } catch (_) { /* opcional */ }
  }

  function tabelaAusente(erro) {
    var m = String((erro && erro.message) || '');
    return /does not exist|could not find the table|schema cache/i.test(m);
  }
  function colunaAusente(erro, coluna) {
    var m = String((erro && erro.message) || '');
    return m.indexOf(coluna) !== -1 && /does not exist|column/i.test(m);
  }

  async function carregarReviews() {
    state.faltaTabelaReviews = false;
    state.reviews = [];
    var s = sb();
    if (!s) throw new Error('Supabase indisponível — recarregue a página.');
    var r = await s.from('reviews').select('*')
      .order('created_at', { ascending: false })
      .limit(10000);
    if (r.error) {
      if (tabelaAusente(r.error)) { state.faltaTabelaReviews = true; return; }
      throw new Error('Não consegui ler as avaliações: ' + r.error.message);
    }
    state.reviews = (r.data || []).map(normalizarReview).filter(Boolean);
  }

  // bookings: só as colunas necessárias.
  var BOOKING_BASE = 'id, experiencia_id, experiencia_nome, fornecedor_nome, nome, email, data, status';

  // Os três canais que pedem avaliação, cada um carimbando a sua coluna.
  // O de cima é o principal hoje: a Edge Function automated-notifications
  // manda o link do avaliar.html no WhatsApp ~2 dias depois do evento.
  // Cada coluna vem de uma migração diferente — se alguma não rodou, a
  // aba segue com as outras e avisa qual SQL falta.
  var COLUNAS_PEDIDO = [
    { col: 'feedback_whatsapp_sent_at', canal: 'WhatsApp automático', sql: 'sql/elarah_bookings_automation_tracking.sql' },
    { col: 'feedback_solicitado_at', canal: 'WhatsApp manual', sql: 'sql/elarah_bookings_feedback.sql' },
    { col: 'review_request_sent_at', canal: 'E-mail', sql: 'sql/elarah_reviews.sql' },
  ];

  async function carregarPedidos() {
    state.pedidos = [];
    state.bookingsById = new Map();
    state.semColunasPedido = false;
    state.colunasPedido = [];
    state.colunasPedidoFaltando = [];
    var s = sb();
    if (!s) return;

    // O PostgREST reclama de uma coluna por vez: a cada erro, tira a que
    // faltou e tenta de novo, até sobrar só o que existe de verdade.
    var disponiveis = COLUNAS_PEDIDO.map(function (c) { return c.col; });
    var rows = null;
    var ultimoErro = null;
    for (var i = 0; i <= COLUNAS_PEDIDO.length; i++) {
      var sel = BOOKING_BASE + (disponiveis.length ? ', ' + disponiveis.join(', ') : '');
      var r = await s.from('bookings').select(sel).limit(50000);
      if (!r.error) { rows = r.data || []; break; }
      ultimoErro = r.error;
      var faltando = disponiveis.filter(function (c) { return colunaAusente(r.error, c); });
      // Erro que não é coluna faltando (permissão, rede) se repetiria igual.
      if (!faltando.length) break;
      disponiveis = disponiveis.filter(function (c) { return faltando.indexOf(c) === -1; });
    }
    if (!rows) {
      console.warn('[Feedbacks] bookings:', ultimoErro && ultimoErro.message);
      throw new Error('Não consegui ler as reservas: ' +
        ((ultimoErro && ultimoErro.message) || 'erro desconhecido'));
    }

    state.colunasPedido = disponiveis;
    state.colunasPedidoFaltando = COLUNAS_PEDIDO.filter(function (c) {
      return disponiveis.indexOf(c.col) === -1;
    });
    state.semColunasPedido = !disponiveis.length;

    rows.forEach(function (b) { if (b && b.id) state.bookingsById.set(b.id, b); });

    state.pedidos = rows.map(function (b) {
      var ts = null;
      var canais = [];
      COLUNAS_PEDIDO.forEach(function (c) {
        if (disponiveis.indexOf(c.col) === -1) return;
        var v = b[c.col];
        if (!v) return;
        canais.push(c.canal);
        var t = Date.parse(v);
        // Quando mais de um canal pediu, vale o pedido mais antigo.
        if (Number.isFinite(t) && (ts == null || t < ts)) ts = t;
      });
      if (!canais.length) return null;
      return {
        bookingId: b.id,
        ts: ts,
        canais: canais,
        experienciaId: b.experiencia_id || null,
        experienciaNome: b.experiencia_nome || '',
        categorias: categoriasDe(b.experiencia_id, b.experiencia_nome),
        parceiro: parceiroDe(b.experiencia_id, b.experiencia_nome, b.fornecedor_nome),
      };
    }).filter(Boolean);
  }

  function expDe(experienciaId, experienciaNome) {
    if (experienciaId && idx.expById.has(experienciaId)) return idx.expById.get(experienciaId);
    var k = chave(experienciaNome);
    if (k && idx.expByNome.has(k)) return idx.expByNome.get(k);
    return null;
  }

  function categoriasDe(experienciaId, experienciaNome) {
    var exp = expDe(experienciaId, experienciaNome);
    if (!exp) return [];
    if (window.ElarahData && window.ElarahData.categoriasOf) {
      return window.ElarahData.categoriasOf(exp) || [];
    }
    var c = String(exp.categoria || '').trim();
    return c ? [c] : [];
  }

  // Parceiro: o gravado na reserva ganha (é o que valia no dia da
  // compra); senão o modelo novo 1:N; senão o campo legado.
  function parceiroDe(experienciaId, experienciaNome, fornecedorDaReserva) {
    var direto = String(fornecedorDaReserva || '').trim();
    if (direto) return direto;
    var exp = expDe(experienciaId, experienciaNome);
    if (exp) {
      var lista = idx.fornecedoresByExpId.get(exp.id);
      if (lista && lista.length) return lista.join(' · ');
      var legado = String(exp.fornecedorNome || '').trim();
      if (legado) return legado;
    }
    return '';
  }

  function normalizarReview(row) {
    if (!row) return null;
    var nota = Number(row.nota);
    if (!Number.isFinite(nota)) nota = 0;
    var booking = (state.bookingsById && row.booking_id)
      ? state.bookingsById.get(row.booking_id) : null;
    var expNome = row.experiencia_nome || (booking && booking.experiencia_nome) || '';
    var expId = row.experiencia_id || (booking && booking.experiencia_id) || null;
    var ts = row.created_at ? Date.parse(row.created_at) : NaN;
    return {
      id: row.id,
      bookingId: row.booking_id || null,
      nota: nota,
      comentario: String(row.comentario || '').trim(),
      nome: String(row.nome || (booking && booking.nome) || '').trim(),
      email: (booking && booking.email) || '',
      visivel: row.aprovado !== false,
      ocultoAt: row.oculto_at || null,
      ts: Number.isFinite(ts) ? ts : null,
      experienciaId: expId,
      experienciaNome: expNome,
      experienciaKey: chave(expNome),
      categorias: categoriasDe(expId, expNome),
      parceiro: parceiroDe(expId, expNome, booking && booking.fornecedor_nome),
      dataEvento: (booking && booking.data) || '',
    };
  }

  async function carregar() {
    if (state.loading) return;
    state.loading = true;
    state.erro = null;
    try {
      var exps = [];
      try {
        if (window.ElarahData && window.ElarahData.getAllExperiences) {
          exps = await window.ElarahData.getAllExperiences();
        }
      } catch (_) { exps = []; }
      indexarExperiencias(exps || []);
      await carregarFornecedores();
      // pedidos primeiro: normalizarReview usa o mapa de bookings pra
      // completar parceiro/cliente quando a review não guardou.
      await carregarPedidos();
      await carregarReviews();
      state.loaded = true;
      state.atualizadoEm = Date.now();
    } catch (e) {
      state.erro = (e && e.message) || String(e);
    } finally {
      state.loading = false;
    }
  }

  // ===========================================================
  // FILTROS
  // ===========================================================
  function janela() {
    var de = null, ate = null;
    if (filtros.de) {
      var d = Date.parse(filtros.de + 'T00:00:00');
      if (Number.isFinite(d)) de = d;
    }
    if (filtros.ate) {
      var a = Date.parse(filtros.ate + 'T23:59:59');
      if (Number.isFinite(a)) ate = a;
    }
    // Período relativo só vale quando nenhuma data foi digitada.
    if (de == null && ate == null && filtros.periodo) {
      var dias = parseInt(filtros.periodo, 10);
      if (Number.isFinite(dias) && dias > 0) de = Date.now() - dias * 86400000;
    }
    return { de: de, ate: ate };
  }

  function dentroDaJanela(ts) {
    var j = janela();
    if (ts == null) return j.de == null && j.ate == null;
    if (j.de != null && ts < j.de) return false;
    if (j.ate != null && ts > j.ate) return false;
    return true;
  }

  function casaCategoria(categorias) {
    if (!filtros.categoria) return true;
    if (filtros.categoria === '__sem__') return !categorias || !categorias.length;
    var alvo = chave(filtros.categoria);
    return (categorias || []).some(function (c) { return chave(c) === alvo; });
  }

  function casaParceiro(parceiro) {
    if (!filtros.parceiro) return true;
    if (filtros.parceiro === '__sem__') return !String(parceiro || '').trim();
    return chave(parceiro) === chave(filtros.parceiro);
  }

  function casaExperiencia(key) {
    if (!filtros.experiencia) return true;
    return key === filtros.experiencia;
  }

  function casaNota(nota) {
    if (!filtros.nota) return true;
    var partes = filtros.nota.split(':');
    var op = partes[0], v = Number(partes[1]);
    if (!Number.isFinite(v)) return true;
    if (op === 'eq') return nota === v;
    if (op === 'lte') return nota <= v;
    if (op === 'gte') return nota >= v;
    return true;
  }

  // Estrutural = o que também existe numa reserva sem resposta. É o
  // recorte usado nos cards de topo, pra que "taxa de resposta" compare
  // o mesmo universo dos dois lados.
  function passaEstrutural(item) {
    return dentroDaJanela(item.ts)
      && casaCategoria(item.categorias)
      && casaParceiro(item.parceiro)
      && casaExperiencia(item.experienciaKey || chave(item.experienciaNome));
  }

  function passaTudo(r) {
    if (!passaEstrutural(r)) return false;
    if (!casaNota(r.nota)) return false;
    if (filtros.comentario === 'com' && !r.comentario) return false;
    if (filtros.comentario === 'sem' && r.comentario) return false;
    if (filtros.visibilidade === 'visivel' && !r.visivel) return false;
    if (filtros.visibilidade === 'oculta' && r.visivel) return false;
    if (filtros.busca) {
      var q = chave(filtros.busca);
      var alvo = chave([r.comentario, r.nome, r.experienciaNome, r.parceiro,
        (r.categorias || []).join(' ')].join(' '));
      if (alvo.indexOf(q) === -1) return false;
    }
    return true;
  }

  function reviewsEstruturais() { return state.reviews.filter(passaEstrutural); }
  function reviewsFiltradas() {
    var lista = state.reviews.filter(passaTudo);
    lista.sort(function (a, b) {
      if (filtros.ordem === 'antigos') return (a.ts || 0) - (b.ts || 0);
      if (filtros.ordem === 'nota-asc') return (a.nota - b.nota) || ((b.ts || 0) - (a.ts || 0));
      if (filtros.ordem === 'nota-desc') return (b.nota - a.nota) || ((b.ts || 0) - (a.ts || 0));
      return (b.ts || 0) - (a.ts || 0);
    });
    return lista;
  }
  function pedidosEstruturais() { return state.pedidos.filter(passaEstrutural); }

  // ===========================================================
  // AGREGAÇÕES
  // ===========================================================
  function resumo(lista) {
    var total = lista.length;
    var soma = 0;
    var dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    var comComentario = 0;
    lista.forEach(function (r) {
      soma += r.nota;
      if (dist[r.nota] != null) dist[r.nota]++;
      if (r.comentario) comComentario++;
    });
    var criticas = dist[1] + dist[2] + dist[3];
    var promotoras = dist[4] + dist[5];
    return {
      total: total,
      media: total ? soma / total : null,
      dist: dist,
      criticas: criticas,
      promotoras: promotoras,
      comComentario: comComentario,
    };
  }

  function agrupar(lista, chaveFn) {
    var mapa = new Map();
    lista.forEach(function (r) {
      var chaves = chaveFn(r);
      (chaves && chaves.length ? chaves : ['— sem registro —']).forEach(function (k) {
        var g = mapa.get(k);
        if (!g) { g = { nome: k, itens: [] }; mapa.set(k, g); }
        g.itens.push(r);
      });
    });
    var out = [];
    mapa.forEach(function (g) {
      var r = resumo(g.itens);
      out.push({ nome: g.nome, total: r.total, media: r.media, dist: r.dist, criticas: r.criticas, promotoras: r.promotoras });
    });
    out.sort(function (a, b) {
      if (filtros.rank === 'volume') return b.total - a.total || (a.media - b.media);
      if (filtros.rank === 'melhor') return (b.media - a.media) || (b.total - a.total);
      return (a.media - b.media) || (b.total - a.total);   // pior primeiro
    });
    return out;
  }

  function classeMedia(m) {
    if (m == null) return '';
    if (m >= 4.5) return 'fb-media--bom';
    if (m >= 3.5) return 'fb-media--medio';
    return 'fb-media--ruim';
  }

  // ===========================================================
  // OPÇÕES DOS SELECTS
  // ===========================================================
  // As opções saem do universo COMPLETO (não do filtrado), senão
  // escolher um parceiro esvaziaria a lista de categorias e prenderia
  // a admin num filtro sem volta.
  function opcoesUnicas(pegar) {
    var mapa = new Map();
    function coletar(item) {
      (pegar(item) || []).forEach(function (v) {
        var nome = String(v || '').trim();
        if (!nome) return;
        var k = chave(nome);
        if (!mapa.has(k)) mapa.set(k, nome);
      });
    }
    state.reviews.forEach(coletar);
    state.pedidos.forEach(coletar);
    var out = [];
    mapa.forEach(function (v) { out.push(v); });
    out.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    return out;
  }

  function optionsHtml(valores, selecionado, extras, rotuloVazio) {
    var html = '<option value="">' + esc(rotuloVazio || 'Todas') + '</option>';
    (extras || []).forEach(function (e) {
      html += '<option value="' + esc(e.v) + '"' + (selecionado === e.v ? ' selected' : '') + '>' + esc(e.label) + '</option>';
    });
    valores.forEach(function (v) {
      html += '<option value="' + esc(v) + '"' + (chave(selecionado) === chave(v) ? ' selected' : '') + '>' + esc(v) + '</option>';
    });
    return html;
  }

  // ===========================================================
  // RENDER
  // ===========================================================
  function render() {
    var root = el(ROOT_ID);
    if (!root) return;

    if (state.erro) {
      root.innerHTML = '<div class="fb-erro"><strong>Não deu pra carregar os feedbacks.</strong><br>' +
        esc(state.erro) + '</div>';
      return;
    }
    if (!state.loaded) {
      root.innerHTML = '<div class="fb-card"><div class="fb-vazio">Carregando feedbacks…</div></div>';
      return;
    }

    var html = '';

    if (state.faltaTabelaReviews) {
      html += '<div class="fb-aviso"><strong>A tabela de avaliações ainda não existe no banco.</strong><br>' +
        'Rode uma vez o arquivo <code>sql/elarah_reviews.sql</code> no SQL Editor do Supabase. ' +
        'Até lá, esta aba mostra só os pedidos de feedback enviados.</div>';
    }
    if (state.colunasPedidoFaltando && state.colunasPedidoFaltando.length) {
      var faltam = state.colunasPedidoFaltando.map(function (c) {
        return '<li>' + esc(c.canal) + ' — falta rodar <code>' + esc(c.sql) + '</code></li>';
      }).join('');
      html += '<div class="fb-aviso"><strong>' +
        (state.semColunasPedido
          ? 'Não achei nenhum registro de pedido de feedback.'
          : 'Um canal de pedido não está sendo contado.') +
        '</strong><ul style="margin:8px 0 0;padding-left:20px">' + faltam + '</ul></div>';
    }

    html += renderFiltros();
    html += renderCards();
    html += renderDistribuicao();
    html += renderRanking();
    html += renderComentarios();

    root.innerHTML = html;
    wire(root);
  }

  function renderFiltros() {
    var categorias = opcoesUnicas(function (i) { return i.categorias; });
    var parceiros = opcoesUnicas(function (i) { return i.parceiro ? [i.parceiro] : []; });
    var experiencias = opcoesUnicas(function (i) { return i.experienciaNome ? [i.experienciaNome] : []; });

    function sel(id, label, inner) {
      return '<div class="fb-field"><label for="' + id + '">' + esc(label) + '</label>' + inner + '</div>';
    }

    var expOptions = '<option value="">Todas</option>' + experiencias.map(function (n) {
      var k = chave(n);
      return '<option value="' + esc(k) + '"' + (filtros.experiencia === k ? ' selected' : '') + '>' + esc(n) + '</option>';
    }).join('');

    var notaOptions = [
      { v: '', label: 'Todas as notas' },
      { v: 'lte:1', label: 'Até 1 ★ (só as piores)' },
      { v: 'lte:2', label: 'Até 2 ★' },
      { v: 'lte:3', label: 'Até 3 ★ (críticas)' },
      { v: 'lte:4', label: 'Até 4 ★' },
      { v: 'gte:4', label: '4 ★ ou mais (promotoras)' },
      { v: 'eq:5', label: 'Exatamente 5 ★' },
      { v: 'eq:4', label: 'Exatamente 4 ★' },
      { v: 'eq:3', label: 'Exatamente 3 ★' },
      { v: 'eq:2', label: 'Exatamente 2 ★' },
      { v: 'eq:1', label: 'Exatamente 1 ★' },
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (filtros.nota === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var periodoOptions = [
      { v: '', label: 'Desde sempre' },
      { v: '7', label: 'Últimos 7 dias' },
      { v: '30', label: 'Últimos 30 dias' },
      { v: '90', label: 'Últimos 90 dias' },
      { v: '365', label: 'Últimos 12 meses' },
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (filtros.periodo === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var comentarioOptions = [
      { v: '', label: 'Com e sem comentário' },
      { v: 'com', label: 'Só com comentário' },
      { v: 'sem', label: 'Só nota, sem texto' },
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (filtros.comentario === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var visibilidadeOptions = [
      { v: '', label: 'Visíveis e ocultas' },
      { v: 'visivel', label: 'Só as que o site mostra' },
      { v: 'oculta', label: 'Só as ocultas' },
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (filtros.visibilidade === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var ordemOptions = [
      { v: 'recentes', label: 'Mais recentes' },
      { v: 'antigos', label: 'Mais antigos' },
      { v: 'nota-asc', label: 'Pior nota primeiro' },
      { v: 'nota-desc', label: 'Melhor nota primeiro' },
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (filtros.ordem === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    return '<div class="fb-card">' +
      '<h2 class="fb-card__title">Filtros</h2>' +
      '<p class="fb-card__sub">Combine à vontade. Datas preenchidas mandam mais que o período rápido.</p>' +
      '<div class="fb-filtros">' +
        sel('fb-f-periodo', 'Período', '<select id="fb-f-periodo">' + periodoOptions + '</select>') +
        sel('fb-f-de', 'De', '<input type="date" id="fb-f-de" value="' + esc(filtros.de) + '">') +
        sel('fb-f-ate', 'Até', '<input type="date" id="fb-f-ate" value="' + esc(filtros.ate) + '">') +
        sel('fb-f-nota', 'Nota', '<select id="fb-f-nota">' + notaOptions + '</select>') +
        sel('fb-f-categoria', 'Categoria', '<select id="fb-f-categoria">' +
          optionsHtml(categorias, filtros.categoria, [{ v: '__sem__', label: '— sem categoria —' }], 'Todas') + '</select>') +
        sel('fb-f-parceiro', 'Parceiro', '<select id="fb-f-parceiro">' +
          optionsHtml(parceiros, filtros.parceiro, [{ v: '__sem__', label: '— sem parceiro —' }], 'Todos') + '</select>') +
        sel('fb-f-experiencia', 'Experiência', '<select id="fb-f-experiencia">' + expOptions + '</select>') +
        sel('fb-f-comentario', 'Comentário', '<select id="fb-f-comentario">' + comentarioOptions + '</select>') +
        sel('fb-f-visibilidade', 'No site', '<select id="fb-f-visibilidade">' + visibilidadeOptions + '</select>') +
        sel('fb-f-ordem', 'Ordenar', '<select id="fb-f-ordem">' + ordemOptions + '</select>') +
        sel('fb-f-busca', 'Buscar no texto', '<input type="search" id="fb-f-busca" placeholder="palavra, cliente, parceiro…" value="' + esc(filtros.busca) + '">') +
      '</div>' +
      '<div class="fb-filtros-acoes">' +
        '<button type="button" class="admin__add-btn admin__add-btn--ghost" id="fb-limpar">Limpar filtros</button>' +
        '<button type="button" class="admin__add-btn admin__add-btn--ghost" id="fb-exportar">↓ Exportar CSV</button>' +
        (state.atualizadoEm ? '<span class="fb-chip">Atualizado ' + esc(dataLonga(state.atualizadoEm)) + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  function renderCards() {
    var revs = reviewsEstruturais();
    var peds = pedidosEstruturais();
    var r = resumo(revs);
    var respondidos = 0;
    if (peds.length) {
      var comResposta = new Set();
      revs.forEach(function (x) { if (x.bookingId) comResposta.add(x.bookingId); });
      peds.forEach(function (p) { if (comResposta.has(p.bookingId)) respondidos++; });
    }

    function card(label, valor, extra, cor) {
      return '<div class="admin__stat">' +
        '<div class="admin__stat-label">' + esc(label) + '</div>' +
        '<div class="admin__stat-value"' + (cor ? ' style="color:' + cor + '"' : '') + '>' + valor + '</div>' +
        (extra ? '<div class="fb-card__sub" style="margin:6px 0 0">' + extra + '</div>' : '') +
      '</div>';
    }

    var taxa = peds.length ? pct(respondidos, peds.length) : '—';

    // Média que o site exibe = só as visíveis. Quando difere da real, a
    // aba mostra as duas lado a lado em vez de deixar passar batido.
    var visiveis = revs.filter(function (x) { return x.visivel; });
    var ocultas = revs.length - visiveis.length;
    var mediaSite = visiveis.length ? resumo(visiveis).media : null;

    // Quebra por canal: ajuda a ver se a automação do WhatsApp está
    // realmente disparando ou se tudo veio do pedido manual.
    var porCanal = new Map();
    peds.forEach(function (p) {
      (p.canais || []).forEach(function (c) { porCanal.set(c, (porCanal.get(c) || 0) + 1); });
    });
    var canaisTxt = [];
    porCanal.forEach(function (qtd, canal) { canaisTxt.push(esc(canal) + ': <strong>' + num(qtd) + '</strong>'); });
    var mediaTxt = r.media == null ? '—' : num(r.media, 2);

    return '<div class="admin__stats">' +
      card('Pedidos enviados', num(peds.length),
        canaisTxt.length ? canaisTxt.join(' · ') : 'Mensagens pedindo avaliação da experiência') +
      card('Respondidas', num(r.total), peds.length
        ? ('Taxa de resposta: <strong>' + taxa + '</strong> — ' + num(respondidos) + ' de ' +
           num(peds.length) + (peds.length !== 1 ? ' pedidos voltaram' : ' pedido voltou') + ' com nota')
        : 'Nenhum pedido registrado ainda') +
      card('Avaliação média', r.media == null ? '—' : (mediaTxt + ' <span style="font-size:.5em;color:#f0a05e;letter-spacing:2px;">' + estrelas(r.media) + '</span>'),
        r.total ? ('Sobre ' + plural(r.total, 'avaliação', 'avaliações') + ' — ocultas incluídas') : '') +
      card('Promotoras (4-5 ★)', r.total ? pct(r.promotoras, r.total) : '—', num(r.promotoras) + ' de ' + num(r.total), '#1a8a4a') +
      card('Críticas (até 3 ★)', r.total ? pct(r.criticas, r.total) : '—', num(r.criticas) + ' de ' + num(r.total) + ' — é onde tem o que melhorar', '#c0392b') +
    '</div>' +
    (ocultas
      ? '<div class="fb-card"><h2 class="fb-card__title">Média real x média que o site mostra</h2>' +
        '<p class="fb-card__sub">' + plural(ocultas, 'avaliação está oculta', 'avaliações estão ocultas') +
          ' do site neste recorte. Os números desta aba usam sempre a média real.</p>' +
        '<div class="fb-media-dupla">' +
          '<span>Média real (tudo): <b>' + num(r.media, 2) + ' ' + estrelas(r.media) + '</b></span>' +
          '<span>Média que o site exibe: <b>' + (mediaSite == null ? '—' : (num(mediaSite, 2) + ' ' + estrelas(mediaSite))) + '</b></span>' +
          (mediaSite != null && r.media != null
            ? '<span>Diferença: <b>' + (mediaSite - r.media >= 0 ? '+' : '') + num(mediaSite - r.media, 2) + '</b></span>'
            : '') +
        '</div></div>'
      : '') +
    '<p class="fb-hint">Os cinco números acima seguem período, categoria, parceiro e experiência. ' +
      'Nota, comentário e busca valem para a lista de comentários lá embaixo.<br>' +
      '“Respondidas” conta toda avaliação recebida; a taxa olha só os pedidos registrados — ' +
      'por isso as duas podem não bater quando alguém avalia sem que o pedido tenha ficado gravado.</p>';
  }

  function renderDistribuicao() {
    var r = resumo(reviewsEstruturais());
    if (!r.total) return '';
    var linhas = [5, 4, 3, 2, 1].map(function (n) {
      var qtd = r.dist[n] || 0;
      var p = r.total ? (qtd / r.total) * 100 : 0;
      var ativo = filtros.nota === ('eq:' + n);
      return '<button type="button" class="fb-dist__row' + (ativo ? ' fb-dist__row--on' : '') + '" data-nota="' + n + '" title="Filtrar só as de ' + n + ' estrela' + (n !== 1 ? 's' : '') + '">' +
        '<span class="fb-dist__star">' + estrelas(n) + '</span>' +
        '<span class="fb-dist__bar"><span class="fb-dist__fill' + (n <= 3 ? ' fb-dist__fill--ruim' : '') + '" style="width:' + p.toFixed(1) + '%"></span></span>' +
        '<span class="fb-dist__num">' + num(qtd) + ' · ' + num(p, 1) + '%</span>' +
      '</button>';
    }).join('');
    return '<div class="fb-card">' +
      '<h2 class="fb-card__title">Distribuição das notas</h2>' +
      '<p class="fb-card__sub">Clique numa linha pra filtrar os comentários por aquela nota.</p>' +
      '<div class="fb-dist">' + linhas + '</div>' +
    '</div>';
  }

  function tabelaRanking(titulo, sub, linhas, rotuloColuna) {
    if (!linhas.length) {
      return '<div class="fb-card"><h2 class="fb-card__title">' + esc(titulo) + '</h2>' +
        '<div class="fb-vazio">Nenhuma avaliação no recorte atual.</div></div>';
    }
    var corpo = linhas.map(function (g) {
      var ruins = g.dist[1] + g.dist[2] + g.dist[3];
      var pBom = g.total ? (g.promotoras / g.total) * 100 : 0;
      return '<tr>' +
        '<td>' + esc(g.nome) + '</td>' +
        '<td class="fb-table__num">' + num(g.total) + '</td>' +
        '<td class="fb-table__num"><span class="fb-media ' + classeMedia(g.media) + '">' +
          num(g.media, 2) + ' ' + estrelas(g.media) + '</span></td>' +
        '<td><span class="fb-mini" title="' + esc(num(g.promotoras) + ' promotoras · ' + num(ruins) + ' críticas') + '">' +
          '<i style="width:' + pBom.toFixed(1) + '%;background:#1a8a4a"></i>' +
          '<i style="width:' + (100 - pBom).toFixed(1) + '%;background:#d4674f"></i></span></td>' +
        '<td class="fb-table__num">' + pct(ruins, g.total) + '</td>' +
      '</tr>';
    }).join('');
    return '<div class="fb-card">' +
      '<h2 class="fb-card__title">' + esc(titulo) + '</h2>' +
      '<p class="fb-card__sub">' + esc(sub) + '</p>' +
      '<div style="overflow-x:auto"><table class="fb-table">' +
        '<thead><tr><th>' + esc(rotuloColuna) + '</th><th class="fb-table__num">Avaliações</th>' +
        '<th class="fb-table__num">Média</th><th>Promotoras vs críticas</th>' +
        '<th class="fb-table__num">% críticas</th></tr></thead>' +
        '<tbody>' + corpo + '</tbody>' +
      '</table></div>' +
    '</div>';
  }

  function renderRanking() {
    var revs = reviewsEstruturais();
    var porParceiro = agrupar(revs, function (r) { return r.parceiro ? [r.parceiro] : []; });
    var porCategoria = agrupar(revs, function (r) { return r.categorias || []; });
    var porExperiencia = agrupar(revs, function (r) { return r.experienciaNome ? [r.experienciaNome] : []; });

    var rankOptions = [
      { v: 'pior', label: 'Pior média primeiro' },
      { v: 'melhor', label: 'Melhor média primeiro' },
      { v: 'volume', label: 'Mais avaliações primeiro' },
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (filtros.rank === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var controle = '<div class="fb-filtros-acoes" style="margin:0 0 14px">' +
      '<div class="fb-field" style="max-width:240px"><label for="fb-f-rank">Ordem dos rankings</label>' +
      '<select id="fb-f-rank">' + rankOptions + '</select></div></div>';

    return controle +
      tabelaRanking('Avaliação por parceiro', 'Uma experiência com mais de um parceiro entra em todos eles.', porParceiro, 'Parceiro') +
      tabelaRanking('Avaliação por categoria', 'Experiência com duas categorias conta nas duas.', porCategoria, 'Categoria') +
      tabelaRanking('Avaliação por experiência', 'Dá pra ver qual experiência puxa a média do parceiro pra baixo.', porExperiencia, 'Experiência');
  }

  function renderComentarios() {
    var lista = reviewsFiltradas();
    var comTexto = lista.filter(function (r) { return !!r.comentario; }).length;
    var ocultasAqui = lista.filter(function (r) { return !r.visivel; }).length;

    var cabecalho = '<div class="fb-card">' +
      '<h2 class="fb-card__title">Comentários</h2>' +
      '<p class="fb-card__sub">' + plural(lista.length, 'avaliação', 'avaliações') +
        ' no filtro atual · ' + num(comTexto) + ' com texto' +
        (ocultasAqui ? ' · ' + num(ocultasAqui) + ' oculta' + (ocultasAqui !== 1 ? 's' : '') + ' do site' : '') +
        '. Clique pra abrir cada uma.</p>' +
      '<div class="fb-filtros-acoes" style="margin:0 0 14px">' +
        '<button type="button" class="admin__add-btn admin__add-btn--ghost" id="fb-abrir-todos">Abrir todos</button>' +
        '<button type="button" class="admin__add-btn admin__add-btn--ghost" id="fb-fechar-todos">Fechar todos</button>' +
      '</div>';

    if (!lista.length) {
      return cabecalho + '<div class="fb-vazio">Nenhuma avaliação bate com esses filtros.</div></div>';
    }

    var itens = lista.map(function (r) {
      var ruim = r.nota <= 3;
      var resumoTxt = r.comentario
        ? (r.comentario.length > 90 ? r.comentario.slice(0, 90) + '…' : r.comentario)
        : 'sem comentário';
      var tags = [];
      if (r.parceiro) tags.push('<span class="fb-tag">Parceiro: <b>' + esc(r.parceiro) + '</b></span>');
      (r.categorias || []).forEach(function (c) { tags.push('<span class="fb-tag">Categoria: <b>' + esc(c) + '</b></span>'); });
      if (r.experienciaNome) tags.push('<span class="fb-tag">Experiência: <b>' + esc(r.experienciaNome) + '</b></span>');
      if (r.dataEvento) tags.push('<span class="fb-tag">Evento: <b>' + esc(r.dataEvento) + '</b></span>');
      if (r.email) tags.push('<span class="fb-tag">E-mail: <b>' + esc(r.email) + '</b></span>');
      tags.push('<span class="fb-tag">Respondida em: <b>' + esc(dataLonga(r.ts)) + '</b></span>');
      if (!r.visivel && r.ocultoAt) {
        tags.push('<span class="fb-tag">Ocultada em: <b>' + esc(dataLonga(r.ocultoAt)) + '</b></span>');
      }

      // Ocultar tira do site (aprovado=false); aqui na aba ela continua
      // contando na média e no ranking — o painel não pode mentir pra
      // quem usa ele pra decidir o que melhorar.
      var acao = r.visivel
        ? '<button type="button" class="fb-btn-ocultar" data-ocultar="' + esc(r.id) + '" data-para="ocultar">' +
            '🚫 Ocultar do site</button>' +
          '<span class="fb-acao-msg">Some da página da experiência. Continua contando aqui.</span>'
        : '<button type="button" class="fb-btn-ocultar fb-btn-ocultar--mostrar" data-ocultar="' + esc(r.id) + '" data-para="mostrar">' +
            '👁 Voltar a mostrar</button>' +
          '<span class="fb-acao-msg">Hoje esta avaliação não aparece pra ninguém no site.</span>';

      return '<details class="fb-com' + (ruim ? ' fb-com--ruim' : '') +
          (r.visivel ? '' : ' fb-com--oculta') + '" data-review="' + esc(r.id) + '">' +
        '<summary>' +
          '<span class="fb-com__nota' + (ruim ? ' fb-com__nota--ruim' : '') + '">' + estrelas(r.nota) + '</span>' +
          '<span class="fb-com__quem">' + esc(r.nome || 'Cliente') + '</span>' +
          (r.visivel ? '' : '<span class="fb-selo-oculta">Oculta</span>') +
          '<span class="fb-com__resumo">' + esc(resumoTxt) + '</span>' +
          '<span class="fb-com__data">' + esc(dataCurta(r.ts)) + '</span>' +
        '</summary>' +
        '<div class="fb-com__body">' +
          '<p class="fb-com__texto' + (r.comentario ? '' : ' fb-com__texto--vazio') + '">' +
            esc(r.comentario || 'A cliente deu a nota mas não escreveu nada.') + '</p>' +
          '<div class="fb-com__meta">' + tags.join('') + '</div>' +
          '<div class="fb-com__acoes">' + acao + '</div>' +
        '</div>' +
      '</details>';
    }).join('');

    return cabecalho + itens + '</div>';
  }

  // ===========================================================
  // EVENTOS
  // ===========================================================
  var buscaTimer = null;

  function wire(root) {
    function onChange(id, campo) {
      var e = el(id);
      if (!e) return;
      e.addEventListener('change', function () {
        filtros[campo] = e.value;
        render();
      });
    }
    onChange('fb-f-periodo', 'periodo');
    onChange('fb-f-de', 'de');
    onChange('fb-f-ate', 'ate');
    onChange('fb-f-nota', 'nota');
    onChange('fb-f-categoria', 'categoria');
    onChange('fb-f-parceiro', 'parceiro');
    onChange('fb-f-experiencia', 'experiencia');
    onChange('fb-f-comentario', 'comentario');
    onChange('fb-f-visibilidade', 'visibilidade');
    onChange('fb-f-ordem', 'ordem');
    onChange('fb-f-rank', 'rank');

    var busca = el('fb-f-busca');
    if (busca) {
      busca.addEventListener('input', function () {
        clearTimeout(buscaTimer);
        buscaTimer = setTimeout(function () {
          filtros.busca = busca.value;
          render();
          // Re-render troca o input: devolve o foco e o cursor no fim.
          var novo = el('fb-f-busca');
          if (novo) {
            try { novo.focus({ preventScroll: true }); } catch (_) { novo.focus(); }
            try { novo.setSelectionRange(novo.value.length, novo.value.length); } catch (_) {}
          }
        }, 300);
      });
    }

    var limpar = el('fb-limpar');
    if (limpar) limpar.addEventListener('click', function () {
      filtros = JSON.parse(JSON.stringify(FILTROS_PADRAO));
      render();
    });

    var exportar = el('fb-exportar');
    if (exportar) exportar.addEventListener('click', exportarCsv);

    root.querySelectorAll('[data-nota]').forEach(function (b) {
      b.addEventListener('click', function () {
        var alvo = 'eq:' + b.dataset.nota;
        filtros.nota = (filtros.nota === alvo) ? '' : alvo;   // clicar de novo desmarca
        render();
      });
    });

    root.querySelectorAll('[data-ocultar]').forEach(function (b) {
      b.addEventListener('click', function () { alternarVisibilidade(b); });
    });

    var abrir = el('fb-abrir-todos');
    var fechar = el('fb-fechar-todos');
    if (abrir) abrir.addEventListener('click', function () {
      root.querySelectorAll('details.fb-com').forEach(function (d) { d.open = true; });
    });
    if (fechar) fechar.addEventListener('click', function () {
      root.querySelectorAll('details.fb-com').forEach(function (d) { d.open = false; });
    });
  }

  // Ocultar = aprovado:false. As duas telas públicas (experiencia.html
  // e o detalhe do script.js) já filtram aprovado=true, então não há
  // nada a mudar no site: virar a chave aqui basta.
  //
  // Requer sql/elarah_reviews_moderacao.sql (policy de update + colunas
  // de auditoria). Sem ela o RLS recusa em silêncio — o PostgREST
  // devolve 0 linhas sem erro, e é isso que o retorno vazio detecta.
  async function alternarVisibilidade(btn) {
    var id = btn.dataset.ocultar;
    var ocultar = btn.dataset.para === 'ocultar';
    if (!id) return;

    var alvo = null;
    for (var i = 0; i < state.reviews.length; i++) {
      if (state.reviews[i].id === id) { alvo = state.reviews[i]; break; }
    }
    var quem = (alvo && alvo.nome) ? ' de ' + alvo.nome : '';
    var pergunta = ocultar
      ? 'Ocultar esta avaliação' + quem + ' do site?\n\nEla some da página da experiência e deixa de contar na nota que o site mostra. Aqui na aba ela continua aparecendo e contando na média real.'
      : 'Voltar a mostrar esta avaliação' + quem + ' no site?';
    if (!confirm(pergunta)) return;

    var textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    try {
      var s = sb();
      if (!s) throw new Error('Supabase indisponível');
      var user = null;
      try { user = (await s.auth.getUser()).data.user; } catch (_) {}

      var payload = { aprovado: !ocultar };
      if (ocultar) {
        payload.oculto_at = new Date().toISOString();
        if (user) payload.oculto_by = user.id;
      }

      var r = await s.from('reviews').update(payload).eq('id', id).select('id, aprovado, oculto_at');
      // Coluna de auditoria ausente: grava só o aprovado, que é o que
      // o site lê. A migração continua pendente, mas a ação funciona.
      if (r.error && (colunaAusente(r.error, 'oculto_at') || colunaAusente(r.error, 'oculto_by'))) {
        r = await s.from('reviews').update({ aprovado: !ocultar }).eq('id', id).select('id, aprovado');
      }
      if (r.error) throw new Error(r.error.message);
      if (!r.data || !r.data.length) {
        throw new Error('o banco não aceitou a mudança. Rode sql/elarah_reviews_moderacao.sql no Supabase — ' +
          'sem ela o admin não tem permissão de editar avaliações.');
      }

      // Atualiza em memória e redesenha, sem repuxar o banco inteiro.
      if (alvo) {
        alvo.visivel = !ocultar;
        alvo.ocultoAt = ocultar ? (r.data[0].oculto_at || new Date().toISOString()) : alvo.ocultoAt;
      }
      var aberto = {};
      document.querySelectorAll('details.fb-com[open]').forEach(function (d) {
        if (d.dataset.review) aberto[d.dataset.review] = true;
      });
      render();
      // Redesenhar fecha os accordions: reabre os que estavam abertos.
      Object.keys(aberto).forEach(function (rid) {
        var d = document.querySelector('details.fb-com[data-review="' + rid + '"]');
        if (d) d.open = true;
      });
    } catch (e) {
      btn.disabled = false;
      btn.textContent = textoOriginal;
      alert('Não consegui ' + (ocultar ? 'ocultar' : 'mostrar') + ': ' + ((e && e.message) || e));
    }
  }

  // CSV com ; e BOM — é o que o Excel em pt-BR abre sem bagunçar
  // acento nem jogar a linha toda numa coluna só.
  function exportarCsv() {
    var lista = reviewsFiltradas();
    if (!lista.length) { alert('Nenhuma avaliação no filtro atual pra exportar.'); return; }
    var cab = ['Data', 'Nota', 'Cliente', 'Experiência', 'Parceiro', 'Categoria', 'Data do evento', 'E-mail', 'No site', 'Comentário'];
    function celula(v) {
      var s = String(v == null ? '' : v).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return '"' + s + '"';
    }
    var linhas = lista.map(function (r) {
      return [
        dataLonga(r.ts), r.nota, r.nome, r.experienciaNome, r.parceiro,
        (r.categorias || []).join(' | '), r.dataEvento, r.email,
        r.visivel ? 'Visível' : 'Oculta', r.comentario,
      ].map(celula).join(';');
    });
    var csv = '﻿' + cab.map(celula).join(';') + '\r\n' + linhas.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'elarah-feedbacks-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ===========================================================
  // ENTRADA
  // ===========================================================
  // Os dados ficam em cache: reabrir a aba não repuxa o banco, a não
  // ser que já tenha passado do TTL ou a admin clique em "Atualizar".
  var TTL_MS = 5 * 60 * 1000;

  async function run(force) {
    injectStyles();
    var velho = !state.atualizadoEm || (Date.now() - state.atualizadoEm) > TTL_MS;
    if (force || velho) { state.loaded = false; state.erro = null; }
    if (!state.loaded && !state.loading) {
      render();                 // mostra "Carregando…"
      await carregar();
    }
    render();
  }

  function init() {
    injectStyles();
    var btn = el('fb-refresh');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', function () { run(true); });
    }
    // Quem abre a aba é o refreshPanel do admin.js (case 'feedbacks').
    // Sem listener próprio de nav aqui pra não disparar duas cargas no
    // mesmo clique.
  }

  window.ElarahFeedbacks = { run: run };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
