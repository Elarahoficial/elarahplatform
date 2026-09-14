// =============================================================
// ELARAH — Eventos Privados / Comercial (aba própria no admin)
// -------------------------------------------------------------
// Painel de quem cuida dos eventos fechados (aniversário,
// despedida, corporativo). Duas frentes e um placar:
//
//   1. PROSPECÇÃO — fila de empresas com WhatsApp/e-mail do RH em
//      1 clique. Recolhida por padrão: abre, aborda, fecha.
//   2. REGISTRO DO DIA — contadores. Quantos pedidos chegaram,
//      quantos orçamentos saíram, quantos follow-ups.
//   3. PLACAR — o que foi fechado de verdade, vindo do financeiro,
//      contra a meta calculada do histórico.
//
// POR QUE CONTADOR E NÃO CADASTRO POR LEAD:
// os pedidos chegam o dia inteiro no WhatsApp e já são organizados
// numa lista lá. Cadastrar cada um aqui seria trabalho dobrado — e
// trabalho dobrado não é feito, então o painel passaria a mentir.
// Um número por dia mede ritmo, conversão e meta do mesmo jeito;
// o detalhe de cada conversa fica onde já está.
//
// O QUE NINGUÉM DIGITA: evento fechado e faturamento. Saem sozinhos
// de manual_sales, que é a fonte de verdade sobre dinheiro.
//
// 100% client-side, custo zero. Renderiza em #evtpriv-root.
//
// Banco: sql/elarah_eventos_privados_comercial.sql (metas)
//        sql/elarah_eventos_privados_registro_diario.sql (contador)
// Conferência na mão: sql/elarah_eventos_privados_baseline.sql
// =============================================================
(function () {
  'use strict';

  var DAY = 86400000;

  // ----- Helpers básicos -----
  function el(id) { return document.getElementById(id); }
  function sb() { return window.supabaseClient || null; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function brl(cent) {
    var n = (Number(cent) || 0) / 100;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function num(v, fb) { var n = Number(v); return isFinite(n) ? n : (fb == null ? 0 : fb); }
  function ms(v) { if (!v) return null; var t = new Date(v).getTime(); return isFinite(t) ? t : null; }
  function pad2(n) { return String(n).padStart(2, '0'); }

  // Data local em YYYY-MM-DD. Nunca usar toISOString aqui: ele
  // converte pra UTC e, depois das 21h no Brasil, "hoje" viraria
  // amanhã — o registro cairia no dia errado.
  function dayKey(d) {
    var x = d ? new Date(d) : new Date();
    return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
  }
  function keyToMs(k) { return new Date(String(k) + 'T12:00:00').getTime(); }
  function dShort(v) {
    if (!v) return '—';
    var d = (v instanceof Date) ? v
          : new Date(typeof v === 'number' ? v : (String(v).length === 10 ? v + 'T12:00:00' : v));
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  function dWeekday(k) {
    var d = new Date(keyToMs(k));
    return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  }
  // Segunda 00:00 da semana de `d` — a semana comercial começa na segunda.
  function weekStart(d) {
    var x = new Date(d || Date.now());
    x.setHours(0, 0, 0, 0);
    var dow = x.getDay();
    x.setDate(x.getDate() - (dow === 0 ? 6 : dow - 1));
    return x.getTime();
  }

  // ----- Links de contato -----
  function waDigits(raw) {
    var d = String(raw || '').replace(/\D+/g, '');
    if (!d) return null;
    return d.length <= 11 ? '55' + d : d;
  }
  // api.whatsapp.com/send em vez de wa.me: o wa.me corrompe emoji
  // fora do BMP em alguns clientes (Safari iOS, WhatsApp Web).
  function waLink(raw, msg) {
    var d = waDigits(raw);
    if (!d) return null;
    return 'https://api.whatsapp.com/send?phone=' + d + (msg ? '&text=' + encodeURIComponent(msg) : '');
  }
  function mailLink(email, subject, body) {
    if (!email) return null;
    return 'mailto:' + encodeURIComponent(String(email).trim()) +
           '?subject=' + encodeURIComponent(subject || '') + '&body=' + encodeURIComponent(body || '');
  }
  // LinkedIn da empresa → aba "Pessoas" filtrada por RH/People.
  // Serve pra achar o decisor quando não há WhatsApp nem e-mail.
  function linkedinPeople(url) {
    var raw = String(url || '').trim();
    if (!raw) return null;
    var m = raw.match(/^(https?:\/\/(?:www\.)?linkedin\.com\/company\/[^/?#]+)\/?/i);
    if (!m) return raw;
    return m[1].replace(/\/$/, '') + '/people/?keywords=' +
           encodeURIComponent('people OR rh OR cultura OR talent OR gente OR pessoas');
  }

  // ----- Config padrão (espelha os DEFAULTs da tabela) -----
  var CFG_FALLBACK = {
    id: 1,
    meta_prospeccao_min: 30, meta_prospeccao_max: 50,
    meta_orcamentos_semana: null, meta_eventos_semana: null, meta_receita_semana_centavos: null,
    fator_crescimento: 1.3,
    sla_primeira_resposta_horas: 2, sla_orcamento_horas: 24,
    expediente_inicio: '09:00', expediente_fim: '19:00',
    expediente_dias: [1, 2, 3, 4, 5, 6],
    followup_dias: [1, 3, 7], followups_max: 3,
    responsavel_nome: null, observacoes: null,
    mensagens: {},
  };

  var TIPOS = [
    { v: 'aniversario_adulto', l: 'Aniversário adulto' },
    { v: 'aniversario_kids',   l: 'Aniversário kids' },
    { v: 'despedida_solteira', l: 'Despedida de solteira' },
    { v: 'despedida_solteiro', l: 'Despedida de solteiro' },
    { v: 'corporativo',        l: 'Corporativo' },
    { v: 'meu_grupo',          l: 'Meu grupo' },
    { v: 'outro',              l: 'Outro' },
  ];
  var TIPO_LEGADO = { aniversario: 'Aniversário' };
  function tipoLabel(t, custom) {
    if (!t) return 'Sem tipo';
    if (t === 'outro') return (custom && String(custom).trim()) || 'Outro';
    var o = TIPOS.filter(function (x) { return x.v === t; })[0];
    return o ? o.l : (TIPO_LEGADO[t] || t);
  }

  // Campos do registro diário. Uma lista só: o formulário, o save e
  // as somas da semana derivam daqui — adicionar contador é mexer
  // em um lugar, não em três.
  var CAMPOS = [
    { k: 'pedidos_recebidos',        l: 'Pedidos de orçamento',   dica: 'Quantos pedidos de evento chegaram hoje, em qualquer canal.' },
    { k: 'orcamentos_enviados',      l: 'Orçamentos enviados',    dica: 'Propostas que saíram hoje.' },
    { k: 'followups',                l: 'Follow-ups',             dica: 'Cutucadas em quem já tinha recebido orçamento.' },
    { k: 'empresas_abordadas_extra', l: 'Empresas fora do painel', dica: 'Só as abordadas por fora. As dos botões daqui já contam sozinhas.' },
    { k: 'fora_do_prazo',            l: 'Passaram do prazo',      dica: 'Pedidos que ficaram sem resposta além do SLA. Quase sempre 0.' },
  ];

  // =============================================================
  // ESTADO + CARGA
  // =============================================================
  var S = {
    cfg: null,
    dias: {},        // 'YYYY-MM-DD' -> linha do registro diário
    eventos: [],     // eventos fechados (manual_sales normalizado)
    bookings: [],    // vendas pagas do site (12 meses)
    prospects: [],
    b2bFirst: {},    // prospect_id -> ms da PRIMEIRA abordagem
    diaSel: dayKey(),// dia que o formulário está editando
    det: { prosp: true, msg: true }, // blocos recolhíveis abertos por padrão
    pers: { nome: '', evento: '', empresa: '' }, // personalização das mensagens
    missingMsg: false,
    salvoEm: null,
    missingCfg: false,
    missingDia: false,
    loading: false,
    salvando: false,
  };

  // Critério de "venda-evento" — espelha a aba Eventos e a view
  // v_eventos_privados_historico. Mantido igual de propósito: se os
  // dois divergirem, a meta deixa de bater com o financeiro.
  function isEventoSale(s) {
    if (!s) return false;
    if (s.is_event === false) return false;
    if (s.is_event === true) return true;
    return num(s.quantity) >= 3 || !!s.event_type;
  }
  function saleReceita(s) {
    var payout = num(s.payout_amount_centavos);
    if (Array.isArray(s.extra_payouts)) {
      s.extra_payouts.forEach(function (p) { payout += num(p && p.amount_centavos); });
    }
    return Math.max(0, num(s.total_amount_centavos) - payout);
  }
  function tabelaSumiu(err) {
    return /does not exist|schema cache/i.test((err && err.message) || '');
  }

  async function loadAll() {
    var c = sb();
    if (!c) throw new Error('Supabase não carregou.');
    S.missingCfg = false;
    S.missingDia = false;
    S.missingMsg = false;

    // --- Config (metas + regras) ---
    var cfgRes = await c.from('evento_privado_metas').select('*').eq('id', 1).maybeSingle();
    if (cfgRes.error) {
      if (tabelaSumiu(cfgRes.error)) { S.missingCfg = true; S.cfg = CFG_FALLBACK; }
      else throw new Error('metas: ' + cfgRes.error.message);
    } else {
      S.cfg = cfgRes.data || CFG_FALLBACK;
      // Coluna ausente na linha = migration das mensagens não rodou.
      // Dá pra copiar mesmo assim; só a edição não persiste.
      if (cfgRes.data && cfgRes.data.mensagens === undefined) S.missingMsg = true;
      if (!S.cfg.mensagens) S.cfg.mensagens = {};
    }

    // --- Registro diário (120 dias: cobre a baseline de 90) ---
    S.dias = {};
    var desde = dayKey(new Date(Date.now() - 120 * DAY));
    var dRes = await c.from('evento_privado_dia').select('*').gte('dia', desde).limit(400);
    if (dRes.error) {
      if (tabelaSumiu(dRes.error)) S.missingDia = true;
      else throw new Error('registro diário: ' + dRes.error.message);
    } else {
      (dRes.data || []).forEach(function (r) { S.dias[r.dia] = r; });
    }

    // --- Eventos fechados (financeiro = verdade sobre dinheiro) ---
    var msRes = await c.from('manual_sales')
      .select('id, customer_name, experience_name, sale_date, slot_date, created_at, quantity, ' +
              'total_amount_centavos, payout_amount_centavos, extra_payouts, payment_status, ' +
              'is_event, event_type, event_type_custom')
      .limit(20000);
    if (msRes.error) throw new Error('vendas: ' + msRes.error.message);
    S.eventos = (msRes.data || [])
      .filter(function (s) { return s.payment_status === 'pago' && isEventoSale(s); })
      .map(function (s) {
        return {
          id: s.id,
          cliente: s.customer_name,
          experiencia: s.experience_name,
          occurredMs: s.sale_date ? keyToMs(s.sale_date) : ms(s.created_at),
          dataEvento: s.slot_date,
          pessoas: num(s.quantity),
          tipo: s.event_type,
          tipoCustom: s.event_type_custom,
          total: num(s.total_amount_centavos),
          receita: saleReceita(s),
        };
      })
      .filter(function (s) { return s.occurredMs != null; })
      .sort(function (a, b) { return b.occurredMs - a.occurredMs; });

    // --- Vendas do site (sinal de desejo do público geral) ---
    // Evento fechado é amostra pequena; bookings é o que a cidade
    // inteira escolhe quando olha a vitrine. Os dois juntos dizem o
    // que oferecer: um mostra o que já fechou, o outro o que atrai.
    S.bookings = [];
    var since365 = new Date(Date.now() - 365 * DAY).toISOString();
    var bkRes = await c.from('bookings')
      .select('experiencia_nome, quantidade, amount_total, status, created_at')
      .eq('status', 'pago').gte('created_at', since365).limit(20000);
    if (!bkRes.error) S.bookings = bkRes.data || [];

    // --- CRM B2B (fila de prospecção) ---
    var pRes = await c.from('b2b_prospects')
      .select('id, nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa, ' +
              'contato_nome, contato_cargo, contato_email, contato_whatsapp, contato_linkedin, ' +
              'status_comercial, potencial')
      .limit(5000);
    S.prospects = pRes.error ? [] : (pRes.data || []);

    // --- Primeira abordagem por empresa (é o que a meta cobra) ---
    // Empresa NOVA conta uma vez: follow-up na mesma empresa não
    // conta de novo. Por isso guardamos o menor occurred_at.
    S.b2bFirst = {};
    var biRes = await c.from('b2b_prospect_interactions')
      .select('prospect_id, occurred_at').eq('tipo', 'mensagem_enviada').limit(20000);
    if (!biRes.error) {
      (biRes.data || []).forEach(function (r) {
        var t = ms(r.occurred_at);
        if (t == null) return;
        if (S.b2bFirst[r.prospect_id] == null || t < S.b2bFirst[r.prospect_id]) S.b2bFirst[r.prospect_id] = t;
      });
    }
  }

  // Linha do dia (existente ou zerada, pra o formulário sempre ter o que mostrar).
  function linhaDia(k) {
    var r = S.dias[k];
    if (r) return r;
    var vazio = { dia: k, observacoes: '' };
    CAMPOS.forEach(function (c) { vazio[c.k] = 0; });
    return vazio;
  }
  // Soma um campo do registro diário num intervalo [de, ate).
  function somaPeriodo(campo, deMs, ateMs) {
    var total = 0;
    Object.keys(S.dias).forEach(function (k) {
      var t = keyToMs(k);
      if (t >= deMs && t < ateMs) total += num(S.dias[k][campo]);
    });
    return total;
  }

  // =============================================================
  // MÉTRICAS — histórico → metas → placar da semana
  // =============================================================

  // Baseline: o ritmo REAL dos últimos 90 dias. É daqui que a meta
  // nasce — sem isso ela vira número inventado, e número inventado
  // ou é fácil demais (não puxa nada) ou impossível (desmotiva).
  function computeBaseline() {
    var since90 = Date.now() - 90 * DAY;
    var since365 = Date.now() - 365 * DAY;
    var in90 = S.eventos.filter(function (e) { return e.occurredMs >= since90; });
    var in365 = S.eventos.filter(function (e) { return e.occurredMs >= since365; });

    var soma90 = in90.reduce(function (a, e) { return a + e.total; }, 0);
    var soma365 = in365.reduce(function (a, e) { return a + e.total; }, 0);
    var ticket90 = in90.length ? Math.round(soma90 / in90.length) : 0;
    var ticket365 = in365.length ? Math.round(soma365 / in365.length) : 0;
    // Menos de 5 eventos em 90 dias é amostra pequena demais pra
    // definir ticket — cai pro histórico de 12 meses.
    var ticket = in90.length >= 5 ? ticket90 : (ticket365 || ticket90);

    var porTipo = {};
    in365.forEach(function (e) {
      var k = tipoLabel(e.tipo, e.tipoCustom);
      if (!porTipo[k]) porTipo[k] = { label: k, n: 0, total: 0, pessoas: 0 };
      porTipo[k].n++; porTipo[k].total += e.total; porTipo[k].pessoas += e.pessoas;
    });

    return {
      eventos90: in90.length,
      eventos365: in365.length,
      porSemana: in90.length / (90 / 7),
      ticket: ticket, ticket90: ticket90, ticket365: ticket365,
      faturamento90: soma90,
      tipos: Object.keys(porTipo).map(function (k) { return porTipo[k]; })
                   .sort(function (a, b) { return b.total - a.total; }),
      amostraPequena: in90.length < 5,
    };
  }

  // Conversão orçamento → evento fechado, nos últimos 90 dias.
  // Os dois lados vêm de fontes diferentes e honestas: orçamento do
  // contador dela, evento fechado do financeiro. Com menos de 8
  // orçamentos registrados a amostra não diz nada — usa 25%, régua
  // conservadora de partida.
  function computeConversao(baseline) {
    var since = Date.now() - 90 * DAY;
    var orcamentos = somaPeriodo('orcamentos_enviados', since, Date.now() + DAY);
    if (orcamentos < 8) return { taxa: 0.25, estimada: true, orcamentos: orcamentos, fechados: baseline.eventos90 };
    var taxa = baseline.eventos90 / orcamentos;
    // Trava nos extremos: acima de 100% seria erro de digitação, e
    // 0% travaria a meta de orçamentos no infinito.
    return { taxa: Math.min(1, Math.max(0.05, taxa)), estimada: false, orcamentos: orcamentos, fechados: baseline.eventos90 };
  }

  // Metas: valor travado na config vence; senão sai do histórico.
  function computeMetas(baseline, conv) {
    var cfg = S.cfg || CFG_FALLBACK;
    var fator = num(cfg.fator_crescimento, 1.3) || 1.3;
    var eventosAuto = Math.max(1, Math.ceil(baseline.porSemana * fator));
    var eventos = cfg.meta_eventos_semana != null ? num(cfg.meta_eventos_semana) : eventosAuto;
    var receita = cfg.meta_receita_semana_centavos != null ? num(cfg.meta_receita_semana_centavos) : eventos * baseline.ticket;
    var orcamentosAuto = Math.max(eventos, Math.ceil(eventos / conv.taxa));
    var orcamentos = cfg.meta_orcamentos_semana != null ? num(cfg.meta_orcamentos_semana) : orcamentosAuto;
    return {
      eventos: eventos, eventosAuto: eventosAuto, eventosTravada: cfg.meta_eventos_semana != null,
      receita: receita, receitaTravada: cfg.meta_receita_semana_centavos != null,
      orcamentos: orcamentos, orcamentosTravada: cfg.meta_orcamentos_semana != null,
      prospeccaoMin: num(cfg.meta_prospeccao_min, 30),
      prospeccaoMax: num(cfg.meta_prospeccao_max, 50),
      fator: fator,
    };
  }

  // Placar da semana corrente (segunda 00:00 → domingo).
  function computeSemana() {
    var wStart = weekStart();
    var wEnd = wStart + 7 * DAY;

    // Empresas abordadas pelo painel (automático) + as de fora.
    var pelosBotoes = 0;
    Object.keys(S.b2bFirst).forEach(function (pid) {
      var t = S.b2bFirst[pid];
      if (t >= wStart && t < wEnd) pelosBotoes++;
    });
    var extra = somaPeriodo('empresas_abordadas_extra', wStart, wEnd);

    var fechados = S.eventos.filter(function (e) { return e.occurredMs >= wStart && e.occurredMs < wEnd; });

    return {
      inicio: wStart,
      pedidos: somaPeriodo('pedidos_recebidos', wStart, wEnd),
      orcamentos: somaPeriodo('orcamentos_enviados', wStart, wEnd),
      followups: somaPeriodo('followups', wStart, wEnd),
      foraDoPrazo: somaPeriodo('fora_do_prazo', wStart, wEnd),
      prospeccaoBotoes: pelosBotoes,
      prospeccaoExtra: extra,
      prospeccao: pelosBotoes + extra,
      eventos: fechados.length,
      receita: fechados.reduce(function (a, e) { return a + e.total; }, 0),
      // Quantos dias da semana já têm registro — sem isso não dá pra
      // saber se o placar está baixo ou só não foi preenchido.
      diasRegistrados: (function () {
        var n = 0;
        Object.keys(S.dias).forEach(function (k) {
          var t = keyToMs(k);
          if (t >= wStart && t < wEnd) n++;
        });
        return n;
      })(),
    };
  }

  // =============================================================
  // O QUE MAIS VENDE
  // -------------------------------------------------------------
  // Duas fontes, duas perguntas diferentes:
  //   eventos fechados → o que grupo fechado realmente contrata
  //   vendas do site   → o que a cidade escolhe sozinha (desejo)
  // A segunda é a maior amostra e serve de dica do que oferecer
  // quando o cliente diz "não sei o que escolher".
  //
  // Nome curto: "Drinks & Petiscos - Gin e Moscow Mule" vira
  // "drinks & petiscos". Em mensagem, nome comprido cansa.
  // =============================================================
  function nomeCurto(nome) {
    var n = String(nome || '').split(/\s[-–]\s|:\s|\s\(/)[0].trim();
    return n ? n.toLowerCase() : '';
  }
  function rankear(lista, chaveNome, pessoasFn, valorFn) {
    var mapa = {};
    lista.forEach(function (r) {
      var nome = String(r[chaveNome] || '').trim();
      if (!nome) return;
      var k = nome.toLowerCase();
      if (!mapa[k]) mapa[k] = { nome: nome, curto: nomeCurto(nome), n: 0, pessoas: 0, total: 0 };
      mapa[k].n++;
      mapa[k].pessoas += num(pessoasFn(r));
      mapa[k].total += num(valorFn(r));
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; })
      .sort(function (a, b) { return b.total - a.total || b.n - a.n; });
  }

  function computeTop() {
    var since365 = Date.now() - 365 * DAY;
    var eventos = S.eventos.filter(function (e) { return e.occurredMs >= since365; });

    var porEvento = rankear(eventos, 'experiencia',
      function (e) { return e.pessoas; }, function (e) { return e.total; });

    var porSite = rankear(S.bookings, 'experiencia_nome',
      function (b) { return b.quantidade; }, function (b) { return b.amount_total; });

    // Ranking por tipo de evento: despedida e corporativo não
    // compram a mesma coisa, e a mensagem muda por causa disso.
    var porTipo = {};
    eventos.forEach(function (e) {
      var t = tipoLabel(e.tipo, e.tipoCustom);
      if (!porTipo[t]) porTipo[t] = [];
      porTipo[t].push(e);
    });
    var tipos = Object.keys(porTipo).map(function (t) {
      return { tipo: t, n: porTipo[t].length,
               top: rankear(porTipo[t], 'experiencia',
                            function (e) { return e.pessoas; },
                            function (e) { return e.total; }).slice(0, 3) };
    }).sort(function (a, b) { return b.n - a.n; });

    return { eventos: porEvento, site: porSite, tipos: tipos, amostraEventos: eventos.length };
  }

  // Lista pra mensagem: as 3 campeãs em evento fechado. Sem histórico
  // suficiente, cai nas do site; sem nada, num trio do catálogo real.
  function topExperienciasTexto() {
    var t = computeTop();
    var fonte = t.eventos.length >= 3 ? t.eventos : (t.site.length >= 3 ? t.site : null);
    var nomes = fonte
      ? fonte.slice(0, 3).map(function (x) { return x.curto; })
      : ['cerâmica em torno', 'vela aromática', 'drinks clássicos'];
    // Remove repetição ("vela aromática" e "vela flor" viram um só).
    var vistos = {}, limpos = [];
    nomes.forEach(function (n) {
      var chave = n.split(' ')[0];
      if (vistos[chave]) return;
      vistos[chave] = 1;
      limpos.push(n);
    });
    if (limpos.length < 2) limpos = nomes;
    return limpos.slice(0, 3).join(', ').replace(/,([^,]*)$/, ' e$1');
  }

  // Fila de prospecção: empresas que ainda não receberam a PRIMEIRA
  // abordagem, por potencial e porte (sweet spot 50–500, onde o RH
  // tem verba e time pra ação).
  function computeProspeccao() {
    var SWEET = { '50_100': 3, '101_250': 3, '251_500': 3, '500_plus': 2, '1_49': 1 };
    var POT = { alto: 3, medio: 2, baixo: 1 };
    return S.prospects
      .filter(function (p) { return !S.b2bFirst[p.id] && p.status_comercial === 'nao_contatado'; })
      .map(function (p) {
        var temCanal = !!(p.contato_whatsapp || p.contato_email);
        return { p: p, temCanal: temCanal,
                 score: (POT[p.potencial] || 2) * 10 + (SWEET[p.funcionarios_faixa] || 1) * 3 + (temCanal ? 5 : 0) };
      })
      .sort(function (a, b) { return b.score - a.score; });
  }

  // =============================================================
  // RENDER — helpers visuais
  // =============================================================
  // Grade dos cartões. auto-fill (e não auto-fit) de propósito: com
  // auto-fit, um cartão sozinho na última linha estica pela largura
  // toda e fica deformado ao lado dos outros.
  var GRID = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;';

  function bar(atual, meta, cor) {
    var pct = meta > 0 ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
    return '<div style="height:6px;background:#eee;border-radius:99px;overflow:hidden;margin-top:8px;">' +
             '<div style="height:100%;width:' + pct + '%;background:' + cor + ';border-radius:99px;transition:width .3s;"></div>' +
           '</div>';
  }
  function card(o) {
    var cor = o.cor || '#f0a05e';
    var ok = o.metaNum != null && o.atualNum != null && o.metaNum > 0 && o.atualNum >= o.metaNum;
    return '<div style="background:#fff;border:1px solid ' + (ok ? '#bfe3cc' : '#eee') + ';border-radius:12px;padding:14px 16px;flex:1;min-width:180px;">' +
             '<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#999;font-weight:700;">' + esc(o.label) + '</div>' +
             '<div style="font-size:1.5rem;font-weight:700;color:' + (ok ? '#1a8a4a' : '#333') + ';margin-top:4px;line-height:1.1;">' + o.valor + '</div>' +
             (o.meta ? '<div style="font-size:.78rem;color:#888;margin-top:2px;">' + o.meta + '</div>' : '') +
             (o.metaNum != null ? bar(o.atualNum, o.metaNum, ok ? '#1a8a4a' : cor) : '') +
             (o.sub ? '<div style="font-size:.75rem;color:#aaa;margin-top:6px;line-height:1.4;">' + o.sub + '</div>' : '') +
           '</div>';
  }
  function sectionTitle(t, sub, right) {
    return '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:26px 0 10px;">' +
             '<div><h2 style="margin:0;font-size:1.05rem;color:#333;">' + t + '</h2>' +
             (sub ? '<p style="margin:2px 0 0;font-size:.82rem;color:#999;max-width:70ch;line-height:1.5;">' + sub + '</p>' : '') +
             '</div>' + (right || '') + '</div>';
  }
  function pill(txt, cor, bg) {
    return '<span style="display:inline-block;padding:2px 8px;border-radius:99px;background:' + bg + ';color:' + cor +
           ';font-size:.72rem;font-weight:700;white-space:nowrap;">' + esc(txt) + '</span>';
  }
  function btn(label, attrs, style) {
    return '<button type="button" ' + attrs + ' style="padding:5px 10px;border-radius:6px;font-family:inherit;font-size:.78rem;font-weight:600;cursor:pointer;border:1px solid #ddd;background:#fff;color:#444;' + (style || '') + '">' + label + '</button>';
  }
  // attrs: atributos extras (data-*) pra que abrir o link também
  // dispare o registro — o clique que abre o WhatsApp é o mesmo que
  // marca a abordagem, sem clique duplo.
  function linkBtn(label, href, style, title, attrs) {
    return '<a href="' + esc(href) + '" target="_blank" rel="noopener"' + (title ? ' title="' + esc(title) + '"' : '') +
           (attrs ? ' ' + attrs : '') +
           ' style="display:inline-block;padding:5px 10px;border-radius:6px;font-family:inherit;font-size:.78rem;font-weight:600;text-decoration:none;border:1px solid #ddd;background:#fff;color:#444;' + (style || '') + '">' + label + '</a>';
  }
  var BTN_WA = 'background:#e6f4ea;border-color:#1a8a4a;color:#1a8a4a;';
  var BTN_MAIL = 'background:#e6f0fa;border-color:#3068a8;color:#3068a8;';
  var BTN_PRI = 'background:#f0a05e;border-color:#f0a05e;color:#fff;';
  function empty(txt) {
    return '<div style="padding:14px;border:1px dashed #e0e0e0;border-radius:10px;color:#aaa;font-size:.85rem;">' + txt + '</div>';
  }
  // Bloco recolhível. A aba inteira usa isto pra não abrir cheia:
  // o que é consulta fica fechado, o que é ação fica aberto.
  function detalhes(titulo, resumo, conteudo, aberto, id) {
    return '<details' + (aberto ? ' open' : '') + (id ? ' data-ep-det="' + id + '"' : '') +
           ' style="margin-top:14px;background:#fff;border:1px solid #eee;border-radius:12px;padding:0 16px;">' +
             '<summary style="cursor:pointer;padding:13px 0;font-size:.95rem;font-weight:700;color:#333;list-style:none;">' +
               titulo + (resumo ? '<span style="font-weight:400;color:#aaa;font-size:.82rem;"> — ' + resumo + '</span>' : '') +
             '</summary>' +
             '<div style="padding-bottom:16px;">' + conteudo + '</div>' +
           '</details>';
  }

  // =============================================================
  // MENSAGENS PRONTAS
  // -------------------------------------------------------------
  // Seis textos que cobrem o ciclo inteiro. Ficam no banco (coluna
  // mensagens da config) pra ela ajustar o tom sem depender de
  // deploy; o que está aqui é só o padrão de partida, usado quando
  // a chave não foi editada.
  //
  // Variáveis: {{nome}} {{contato}} {{empresa}} {{evento}}
  //            {{responsavel}}
  // Escritas de propósito em frases que continuam certas quando a
  // variável vem vazia — "Oi , tudo bem?" espanta cliente.
  // =============================================================
  var MSG_PADRAO = {
    prospeccao: {
      titulo: 'Primeira abordagem de empresa',
      quando: 'RH / People que ainda não te conhece',
      texto:
        'Oi {{contato}}, tudo bem? 😊\n\n' +
        'Aqui é {{responsavel}} da Elarah 🧡 — a gente organiza *experiências fechadas em São Paulo* ' +
        'pra grupos de empresa. As mais pedidas agora são {{top_experiencias}} ✨\n\n' +
        'Os times usam muito pra *confraternização*, integração de gente nova e datas do calendário ' +
        'interno. E a gente cuida de tudo: local, fornecedor, material e condução — vocês só ' +
        'aparecem pra aproveitar 🎉\n\n' +
        'Tem alguma ação pro time nos próximos meses? Se fizer sentido pra {{empresa}}, te mando um ' +
        'orçamento com *2 ou 3 formatos* por faixa de pessoas, sem compromisso 🧡',
    },
    primeira_resposta: {
      titulo: 'Primeira resposta a quem pede orçamento',
      quando: 'em até 2h — é a mensagem que segura o cliente',
      texto:
        'Oi {{nome}}, tudo bem? Aqui é da Elarah 🧡\n\n' +
        'Que alegria que você pensou na gente! 🥳\n\n' +
        'Pra eu montar o seu orçamento certinho, me confirma *3 coisinhas*?\n\n' +
        '1️⃣ *Data* (ou o período que você tem em mente)\n' +
        '2️⃣ *Quantas pessoas*, mais ou menos\n' +
        '3️⃣ Se prefere em um *espaço nosso* ou em um *local de vocês*\n\n' +
        'Com isso eu já te mando as opções *ainda hoje* ✨\n\n' +
        'Ah, e as mais pedidas pra grupo agora são {{top_experiencias}} — se quiser, já começo ' +
        'por elas 😍',
    },
    orcamento: {
      titulo: 'Enviando o orçamento',
      quando: 'junto com a proposta',
      texto:
        '{{nome}}, montei as opções pra você 🧡✨\n\n' +
        'Está tudo aí: *o que inclui*, o *valor por pessoa* e o *total*.\n\n' +
        'Qualquer ajuste — data, número de pessoas, formato — eu remonto rapidinho, é só falar 😊\n\n' +
        'Só um detalhe importante: a data fica reservada *depois da confirmação*. Se quiser que eu ' +
        'segure a sua, me avisa que eu já deixo guardada 🧡',
    },
    followup_1: {
      titulo: 'Follow-up 1 — D+1',
      quando: 'um dia depois do orçamento',
      texto:
        'Oi {{nome}}! 😊 Passando rapidinho pra saber se o orçamento chegou direitinho 🧡\n\n' +
        'Qualquer ajuste (data, número de pessoas, formato) eu *remonto na hora* — é só me contar ' +
        'o que você imaginou ✨',
    },
    followup_2: {
      titulo: 'Follow-up 2 — D+3',
      quando: 'três dias depois do orçamento',
      texto:
        'Oi {{nome}}, tudo bem? 🧡 Sei que a correria é grande, então vou ser rapidinha:\n\n' +
        'se quiser, eu *seguro a sua data por 48h* enquanto você decide com calma ⏳\n\n' +
        'É só me mandar um "pode segurar" que eu já deixo reservado 😊',
    },
    followup_3: {
      titulo: 'Follow-up 3 — D+7',
      quando: 'último toque; depois dele, encerra',
      texto:
        'Oi {{nome}}! 🧡 Última mensagem pra não te encher, prometo 🙈\n\n' +
        'Se não for o momento, sem problema *nenhum* — é só me dizer que eu guardo seu contato com ' +
        'carinho e te aviso quando abrir *novas datas* ✨\n\n' +
        'E se mudar de ideia, é só chamar aqui que eu te respondo 😊',
    },
  };
  var MSG_ORDEM = ['prospeccao', 'primeira_resposta', 'orcamento', 'followup_1', 'followup_2', 'followup_3'];
  // Quais contam como follow-up: copiar um destes soma +1 no dia.
  var MSG_FOLLOWUP = { followup_1: 1, followup_2: 1, followup_3: 1 };

  // Texto vigente de uma mensagem: o editado, senão o padrão.
  function msgTexto(chave) {
    var cfg = S.cfg || CFG_FALLBACK;
    var salvo = cfg.mensagens && cfg.mensagens[chave];
    if (salvo && String(salvo).trim()) return String(salvo);
    return (MSG_PADRAO[chave] || {}).texto || '';
  }
  function msgEditada(chave) {
    var cfg = S.cfg || CFG_FALLBACK;
    var salvo = cfg.mensagens && cfg.mensagens[chave];
    return !!(salvo && String(salvo).trim() && String(salvo) !== (MSG_PADRAO[chave] || {}).texto);
  }
  // Troca as variáveis e limpa o rastro das que vieram vazias:
  // " ," vira ",", espaço duplo vira simples. Sem isso, mensagem sem
  // nome sai como "Oi , tudo bem?".
  function preencher(texto, vars) {
    var out = String(texto || '').replace(/\{\{(\w+)\}\}/g, function (_, k) {
      var v = vars && vars[k];
      return v == null ? '' : String(v);
    });
    return out.replace(/[ \t]+([,.!?])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim();
  }
  // Primeiro nome — em mensagem, "Oi Maria" é melhor que "Oi Maria Aparecida da Silva".
  function primeiroNome(v) {
    var s = String(v || '').trim();
    return s ? s.split(/\s+/)[0] : '';
  }

  // ----- Mensagem de prospecção (usada pelos botões da fila) -----
  // Mesmo texto do bloco de mensagens: editar lá muda os botões aqui.
  function msgProspeccao(p) {
    var cfg = S.cfg || CFG_FALLBACK;
    return preencher(msgTexto('prospeccao'), {
      contato: primeiroNome(p.contato_nome),
      empresa: p.nome || 'vocês',
      responsavel: primeiroNome(cfg.responsavel_nome),
      top_experiencias: topExperienciasTexto(),
    });
  }
  // *negrito* é sintaxe do WhatsApp. No corpo de e-mail o asterisco
  // aparece cru, então os marcadores saem — o texto continua igual.
  function semNegritoWhats(txt) {
    return String(txt || '').replace(/\*([^*\n]+)\*/g, '$1');
  }
  function emailProspeccao(p) {
    return {
      assunto: 'Experiências fechadas pro time da ' + (p.nome || 'sua empresa') + ' — Elarah',
      corpo: semNegritoWhats(msgProspeccao(p)) + '\n\nSite: https://elarah.com.br',
    };
  }

  // =============================================================
  // BLOCO 1 — registro do dia
  // -------------------------------------------------------------
  // O único lugar em que alguém digita. Cinco números, botão de +1,
  // salva sozinho. Se isto levar mais de meio minuto por dia, o
  // painel morre em três semanas.
  // =============================================================
  function contador(campo, valor) {
    return '<div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:12px 14px;flex:1;min-width:170px;">' +
             '<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#999;font-weight:700;">' + esc(campo.l) + '</div>' +
             '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">' +
               btn('−', 'data-ep-inc="' + campo.k + '" data-ep-delta="-1" aria-label="menos um"',
                   'width:32px;height:32px;padding:0;font-size:1.1rem;line-height:1;') +
               '<input type="number" min="0" data-ep-num="' + campo.k + '" value="' + num(valor) + '" ' +
                 'style="width:62px;text-align:center;padding:6px;border:1px solid #ddd;border-radius:6px;font-family:inherit;font-size:1.15rem;font-weight:700;color:#333;">' +
               btn('+', 'data-ep-inc="' + campo.k + '" data-ep-delta="1" aria-label="mais um"',
                   'width:32px;height:32px;padding:0;font-size:1.1rem;line-height:1;' + BTN_PRI) +
             '</div>' +
             '<div style="font-size:.72rem;color:#bbb;margin-top:6px;line-height:1.4;">' + esc(campo.dica) + '</div>' +
           '</div>';
  }

  function blocoRegistro() {
    var r = linhaDia(S.diaSel);
    var hoje = dayKey();
    var ontem = dayKey(new Date(Date.now() - DAY));
    var qual = S.diaSel === hoje ? 'hoje' : (S.diaSel === ontem ? 'ontem' : dShort(S.diaSel));

    var atalhos =
      btn('Hoje', 'data-ep-dia="' + hoje + '"', S.diaSel === hoje ? BTN_PRI : '') +
      btn('Ontem', 'data-ep-dia="' + ontem + '"', S.diaSel === ontem ? BTN_PRI : '') +
      '<input type="date" id="ep-dia-sel" value="' + esc(S.diaSel) + '" max="' + esc(hoje) + '" ' +
        'style="padding:5px 8px;border:1px solid #ddd;border-radius:6px;font-family:inherit;font-size:.78rem;">';

    var html = '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
        '<div><h2 style="margin:0;font-size:1.05rem;color:#333;">✍️ Registro de ' + esc(qual) + '</h2>' +
        '<p style="margin:2px 0 0;font-size:.82rem;color:#999;">' +
          'Só os números — os pedidos continuam na lista do WhatsApp. Salva sozinho a cada clique.' +
        '</p></div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' + atalhos +
          '<span id="ep-dia-status" style="font-size:.75rem;color:#bbb;min-width:58px;"></span>' +
        '</div>' +
      '</div>' +
      '<div style="' + GRID + 'margin-top:10px;">' +
        CAMPOS.map(function (c) { return contador(c, r[c.k]); }).join('') +
      '</div>' +
      '<input type="text" data-ep-obs="1" placeholder="Alguma observação do dia (opcional)" value="' + esc(r.observacoes || '') + '" ' +
        'style="margin-top:10px;width:100%;padding:9px 12px;border:1px solid #eee;border-radius:10px;font-family:inherit;font-size:.85rem;box-sizing:border-box;">';
    return html;
  }

  // =============================================================
  // BLOCO 2 — placar da semana
  // =============================================================
  function blocoPlacar(sem, metas, baseline, conv) {
    var fim = new Date(sem.inicio + 6 * DAY);
    var faltaProsp = Math.max(0, metas.prospeccaoMin - sem.prospeccao);

    var alerta = '';
    if (sem.diasRegistrados === 0) {
      alerta = '<div style="margin-top:8px;font-size:.8rem;color:#a4663b;">' +
               'Nenhum dia da semana registrado ainda — orçamentos e pedidos vão aparecer zerados até o primeiro registro.</div>';
    }

    return '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:26px;">' +
             '<h2 style="margin:0;font-size:1.05rem;color:#333;">📊 Placar da semana</h2>' +
             '<span style="font-size:.8rem;color:#aaa;">' + dShort(sem.inicio) + ' a ' + dShort(fim) +
             ' · ' + sem.diasRegistrados + ' dia(s) registrado(s)</span>' +
           '</div>' +
           '<div style="' + GRID + 'margin-top:10px;">' +
             card({ label: 'Eventos fechados', valor: String(sem.eventos),
                    meta: 'meta ' + metas.eventos + '/semana',
                    atualNum: sem.eventos, metaNum: metas.eventos,
                    sub: 'vem sozinho do financeiro' }) +
             card({ label: 'Receita fechada', valor: brl(sem.receita),
                    meta: 'meta ' + brl(metas.receita),
                    atualNum: sem.receita, metaNum: metas.receita,
                    sub: 'ticket médio histórico ' + brl(baseline.ticket) }) +
             card({ label: 'Orçamentos enviados', valor: String(sem.orcamentos),
                    meta: 'meta ' + metas.orcamentos + '/semana',
                    atualNum: sem.orcamentos, metaNum: metas.orcamentos,
                    sub: 'conversão ' + Math.round(conv.taxa * 100) + '%' + (conv.estimada ? ' (estimada)' : '') }) +
             card({ label: 'Empresas prospectadas', valor: String(sem.prospeccao),
                    meta: 'meta ' + metas.prospeccaoMin + '–' + metas.prospeccaoMax + ' novas/semana',
                    atualNum: sem.prospeccao, metaNum: metas.prospeccaoMin,
                    sub: sem.prospeccao >= metas.prospeccaoMax ? 'alvo cheio batido 🎉'
                       : 'faltam ' + faltaProsp + ' pro mínimo' +
                         (sem.prospeccaoExtra ? ' · ' + sem.prospeccaoBotoes + ' pelo painel + ' + sem.prospeccaoExtra + ' por fora' : '') }) +
             card({ label: 'Pedidos recebidos', valor: String(sem.pedidos), cor: '#3068a8',
                    sub: sem.pedidos
                      ? sem.orcamentos + ' viraram orçamento · ' + sem.followups + ' follow-up(s)'
                      : 'demanda que chegou na semana' }) +
             card({ label: 'Passaram do prazo', valor: String(sem.foraDoPrazo), cor: '#b3261e',
                    sub: sem.foraDoPrazo ? 'assunto pra conversa da semana' : 'tudo respondido no prazo 👏' }) +
           '</div>' + alerta;
  }

  // =============================================================
  // BLOCO 3 — prospecção (recolhido por padrão)
  // -------------------------------------------------------------
  // Antes isto era uma aba inteira de CRM. Aqui só o que ela precisa
  // pra trabalhar: quem abordar agora e o canal pronto. O CRM
  // completo continua a um clique, pra cadastro e importação.
  // =============================================================
  function blocoProspeccao(prosp, sem, metas) {
    var FAIXA = { '1_49': '1–49', '50_100': '50–100 ⭐', '101_250': '101–250 ⭐', '251_500': '251–500 ⭐', '500_plus': '500+' };
    var falta = Math.max(0, metas.prospeccaoMin - sem.prospeccao);
    var resumo = sem.prospeccao + ' de ' + metas.prospeccaoMin + '–' + metas.prospeccaoMax + ' nesta semana' +
                 (prosp.length ? ' · ' + prosp.length + ' empresa(s) na fila' : '');

    var conteudo = '';
    if (!prosp.length) {
      conteudo = empty('Nenhuma empresa nova na fila. Cadastre ou importe empresas no CRM completo — ' +
                       'sem estoque de lead não tem como sustentar ' + metas.prospeccaoMin + ' por semana.');
    } else {
      conteudo = '<div style="font-size:.82rem;color:#888;margin-bottom:10px;">' +
          'Ordenadas por potencial e porte. <b>Clicar em WhatsApp ou E-mail já registra a abordagem</b> e conta na meta.' +
          (falta ? ' Faltam <b>' + falta + '</b> pro mínimo da semana.' : ' Mínimo da semana batido 🎉') +
        '</div>' +
        '<div class="admin__table-wrap"><table class="admin__table"><thead><tr>' +
          '<th>Empresa</th><th>Contato (RH/People)</th><th>Porte</th><th>Potencial</th><th style="width:230px;">Abordar</th>' +
        '</tr></thead><tbody>';

      prosp.slice(0, 15).forEach(function (x) {
        var p = x.p;
        var mail = emailProspeccao(p);
        var wa = waLink(p.contato_whatsapp, msgProspeccao(p));
        var acoes = [];
        if (wa) acoes.push(linkBtn('WhatsApp', wa, BTN_WA, 'Abre com a mensagem pronta e registra a abordagem',
                                   'data-ep-prospect="' + esc(p.id) + '"'));
        if (p.contato_email) acoes.push(linkBtn('E-mail', mailLink(p.contato_email, mail.assunto, mail.corpo), BTN_MAIL,
                                                'Abre o e-mail pronto e registra a abordagem', 'data-ep-prospect="' + esc(p.id) + '"'));
        if (!wa && !p.contato_email) {
          var lk = linkedinPeople(p.linkedin_empresa);
          if (lk) acoes.push(linkBtn('Achar RH no LinkedIn', lk, 'background:#e1ecf7;border-color:#0a66c2;color:#0a66c2;',
                                     'Abre a aba Pessoas da empresa filtrada por RH/People'));
          acoes.push(btn('+ contato', 'data-ep-prospect-contato="' + esc(p.id) + '"', 'border-style:dashed;color:#888;'));
        }
        acoes.push(btn('Registrei', 'data-ep-prospect-log="' + esc(p.id) + '"', 'color:#888;'));

        conteudo += '<tr>' +
          '<td><b>' + esc(p.nome) + '</b>' +
            (p.segmento ? '<div style="font-size:.75rem;color:#aaa;">' + esc(p.segmento) + '</div>' : '') + '</td>' +
          '<td>' + (p.contato_nome ? esc(p.contato_nome) : '<span style="color:#c9a;">sem contato</span>') +
            (p.contato_cargo ? '<div style="font-size:.75rem;color:#aaa;">' + esc(p.contato_cargo) + '</div>' : '') + '</td>' +
          '<td style="font-size:.8rem;color:#666;">' + esc(FAIXA[p.funcionarios_faixa] || '—') + '</td>' +
          '<td>' + (p.potencial === 'alto' ? pill('🔥 Alto', '#b3261e', '#fdecea')
                   : p.potencial === 'baixo' ? pill('Baixo', '#777', '#f1f1f1') : pill('Médio', '#a4663b', '#fff8ef')) + '</td>' +
          '<td><div style="display:flex;gap:5px;flex-wrap:wrap;">' + acoes.join('') + '</div></td>' +
        '</tr>';
      });
      conteudo += '</tbody></table></div>';
      var semCanal = prosp.filter(function (x) { return !x.temCanal; }).length;
      if (semCanal) {
        conteudo += '<div style="font-size:.78rem;color:#aaa;margin-top:6px;"><b>' + semCanal +
                    '</b> empresa(s) sem WhatsApp nem e-mail — achar o contato do RH é parte da prospecção.</div>';
      }
    }
    conteudo += '<div style="margin-top:12px;">' +
      btn('Abrir CRM de empresas (cadastrar / importar CSV)', 'data-ep-goto="b2b-prospects"') + '</div>';

    return detalhes('🏢 Prospectar agora', resumo, conteudo, S.det.prosp !== false, 'prosp');
  }

  // =============================================================
  // BLOCO 3.5 — mensagens prontas
  // -------------------------------------------------------------
  // Copiar, colar e enviar. Os campos de personalizar trocam as
  // variáveis na hora da cópia, então ela não precisa caçar
  // "{{nome}}" dentro do texto colado no WhatsApp.
  //
  // Copiar um follow-up soma +1 no contador do dia: a ação que ela
  // já ia fazer vira o registro, em vez de virar mais uma tarefa.
  // =============================================================
  function varsAtuais() {
    var cfg = S.cfg || CFG_FALLBACK;
    return {
      nome: primeiroNome(S.pers.nome),
      contato: primeiroNome(S.pers.nome),
      empresa: (S.pers.empresa || '').trim() || 'vocês',
      evento: (S.pers.evento || '').trim() || 'seu evento',
      responsavel: primeiroNome(cfg.responsavel_nome),
      top_experiencias: topExperienciasTexto(),
    };
  }

  function blocoMensagens() {
    var vars = varsAtuais();
    var personalizar =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">' +
        '<span style="font-size:.78rem;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">Personalizar:</span>' +
        '<input type="text" data-ep-pers="nome" value="' + esc(S.pers.nome) + '" placeholder="Nome do cliente" ' +
          'style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;font-size:.84rem;width:170px;">' +
        '<input type="text" data-ep-pers="evento" value="' + esc(S.pers.evento) + '" placeholder="Tipo de evento ({{evento}})" ' +
          'style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;font-size:.84rem;width:170px;">' +
        '<input type="text" data-ep-pers="empresa" value="' + esc(S.pers.empresa) + '" placeholder="Empresa (se for B2B)" ' +
          'style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;font-size:.84rem;width:170px;">' +
        (S.pers.nome || S.pers.evento || S.pers.empresa
          ? btn('limpar', 'data-ep-pers-clear="1"', 'color:#999;') : '') +
      '</div>' +
      '<div style="font-size:.78rem;color:#aaa;margin-bottom:12px;line-height:1.5;">' +
        'O texto fica com as variáveis à mostra pra você editar — elas são trocadas <b>na hora de copiar</b>. ' +
        'Disponíveis: <code>{{nome}}</code> <code>{{empresa}}</code> <code>{{evento}}</code> ' +
        '<code>{{contato}}</code> <code>{{responsavel}}</code> e <code>{{top_experiencias}}</code> ' +
        '— esta última se preenche sozinha com as <b>3 que mais vendem em evento fechado</b>, ' +
        'então a mensagem acompanha o catálogo sem você reescrever. Campo vazio some da frase sozinho. ' +
        'Pra <b>negrito no WhatsApp</b>, ponha o trecho entre asteriscos: <code>*assim*</code> ' +
        '(no e-mail os asteriscos saem sozinhos). Editar aqui salva pra sempre; o “voltar ao padrão” desfaz.' +
      '</div>';

    var cards = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">';
    MSG_ORDEM.forEach(function (chave) {
      var meta = MSG_PADRAO[chave] || {};
      var texto = msgTexto(chave);
      var preenchido = preencher(texto, vars);
      var previa = preenchido.split('\n')[0];
      if (previa.length > 70) previa = previa.slice(0, 70) + '…';
      var ehFollowup = !!MSG_FOLLOWUP[chave];

      cards +=
        '<div style="background:#fcfcfc;border:1px solid #eee;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;">' +
          '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;">' +
            '<span style="font-size:.88rem;font-weight:700;color:#333;">' + esc(meta.titulo || chave) + '</span>' +
            (msgEditada(chave) ? pill('editada', '#a4663b', '#fff8ef') : '') +
          '</div>' +
          '<div style="font-size:.74rem;color:#aaa;margin-top:2px;">' + esc(meta.quando || '') + '</div>' +
          '<textarea data-ep-msg="' + chave + '" rows="6" spellcheck="true" ' +
            'style="margin-top:8px;width:100%;padding:9px;border:1px solid #e2e2e2;border-radius:8px;font-family:inherit;' +
            'font-size:.83rem;line-height:1.5;resize:vertical;box-sizing:border-box;background:#fff;">' + esc(texto) + '</textarea>' +
          '<div style="font-size:.73rem;color:#bbb;margin-top:6px;line-height:1.4;">Vai copiar: “' + esc(previa) + '”</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
            btn(ehFollowup ? 'Copiar e contar +1' : 'Copiar', 'data-ep-copy="' + chave + '"', BTN_PRI) +
            (msgEditada(chave) ? btn('voltar ao padrão', 'data-ep-msg-reset="' + chave + '"', 'color:#999;') : '') +
          '</div>' +
        '</div>';
    });
    cards += '</div>';

    var aviso = S.missingMsg
      ? '<div style="margin-bottom:12px;padding:10px 12px;background:#fff8ef;border:1px solid #f0c97a;border-radius:8px;' +
        'font-size:.82rem;color:#7a4f00;">Dá pra copiar normalmente, mas <b>a edição não salva</b> enquanto a migration ' +
        '<code>sql/elarah_eventos_privados_mensagens.sql</code> não rodar.</div>'
      : '';

    return detalhes('💬 Mensagens prontas', 'copiar, colar e enviar', aviso + personalizar + cards,
                    S.det.msg !== false, 'msg');
  }

  // =============================================================
  // BLOCO 3.7 — o que mais vende
  // -------------------------------------------------------------
  // Existe pra responder, com dado e não com achismo, a pergunta que
  // o cliente faz em toda conversa: "o que vocês recomendam?".
  // Também é o que alimenta {{top_experiencias}} nas mensagens, então
  // o texto que ela manda acompanha o catálogo sozinho.
  // =============================================================
  function blocoTop() {
    var t = computeTop();
    var linhas = function (arr, unidade) {
      if (!arr.length) return empty('Sem dado suficiente ainda.');
      var h = '<div class="admin__table-wrap"><table class="admin__table"><thead><tr>' +
                '<th>Experiência</th><th>' + unidade + '</th><th>Pessoas</th><th>Faturamento</th><th>Ticket médio</th>' +
              '</tr></thead><tbody>';
      arr.slice(0, 10).forEach(function (x, i) {
        h += '<tr>' +
          '<td>' + (i < 3 ? ['🥇', '🥈', '🥉'][i] + ' ' : '') + '<b>' + esc(x.nome) + '</b></td>' +
          '<td>' + x.n + '</td><td>' + x.pessoas + '</td>' +
          '<td>' + brl(x.total) + '</td>' +
          '<td>' + brl(x.n ? Math.round(x.total / x.n) : 0) + '</td>' +
        '</tr>';
      });
      return h + '</tbody></table></div>';
    };

    var conteudo =
      '<div style="font-size:.82rem;color:#888;margin-bottom:10px;line-height:1.55;">' +
        'Duas perguntas diferentes: <b>evento fechado</b> mostra o que grupo contrata; ' +
        '<b>site</b> mostra o que a cidade escolhe sozinha — amostra bem maior, e boa dica ' +
        'de resposta pro clássico “o que vocês recomendam?”. As 3 primeiras de evento entram ' +
        'automaticamente na variável <code>{{top_experiencias}}</code> das mensagens.' +
      '</div>' +
      '<h4 style="margin:14px 0 6px;font-size:.88rem;color:#444;">Em evento fechado (12 meses · ' +
        t.amostraEventos + ' evento(s))</h4>' + linhas(t.eventos, 'Eventos') +
      '<h4 style="margin:18px 0 6px;font-size:.88rem;color:#444;">No site (12 meses · sinal de desejo)</h4>' +
      linhas(t.site, 'Vendas');

    if (t.tipos.length) {
      conteudo += '<h4 style="margin:18px 0 6px;font-size:.88rem;color:#444;">Campeã de cada tipo de evento</h4>' +
        '<div style="' + GRID + '">';
      t.tipos.forEach(function (g) {
        conteudo += '<div style="background:#fcfcfc;border:1px solid #eee;border-radius:10px;padding:12px 14px;">' +
          '<div style="font-size:.85rem;font-weight:700;color:#333;">' + esc(g.tipo) + '</div>' +
          '<div style="font-size:.73rem;color:#bbb;margin-bottom:6px;">' + g.n + ' evento(s)</div>' +
          (g.top.length
            ? g.top.map(function (x, i) {
                return '<div style="font-size:.8rem;color:#666;line-height:1.6;">' + (i + 1) + '. ' +
                       esc(x.nome) + ' <span style="color:#bbb;">(' + x.n + ')</span></div>';
              }).join('')
            : '<span style="color:#bbb;font-size:.8rem;">—</span>') +
        '</div>';
      });
      conteudo += '</div>';
    }

    var resumo = t.eventos.length
      ? 'campeã: ' + t.eventos[0].curto
      : (t.site.length ? 'campeã no site: ' + t.site[0].curto : 'sem dado ainda');
    return detalhes('🏆 O que mais vende', resumo, conteudo, S.det.top === true, 'top');
  }

  // =============================================================
  // BLOCO 4 — eventos fechados (ninguém digita: vem do financeiro)
  // =============================================================
  function blocoFechados() {
    var since = Date.now() - 60 * DAY;
    var lista = S.eventos.filter(function (e) { return e.occurredMs >= since; });
    var conteudo;
    if (!lista.length) {
      conteudo = empty('Nenhum evento fechado nos últimos 60 dias. Eles aparecem aqui sozinhos quando a venda é registrada ' +
                       'como paga no financeiro — é a aba <b>Eventos</b> que faz esse cadastro.');
    } else {
      conteudo = '<div class="admin__table-wrap"><table class="admin__table"><thead><tr>' +
          '<th>Venda</th><th>Cliente</th><th>Tipo</th><th>Data do evento</th><th>Pessoas</th><th>Total</th><th>Receita Elarah</th>' +
        '</tr></thead><tbody>';
      lista.slice(0, 20).forEach(function (e) {
        conteudo += '<tr>' +
          '<td style="font-size:.8rem;color:#999;">' + dShort(e.occurredMs) + '</td>' +
          '<td><b>' + esc(e.cliente) + '</b>' +
            (e.experiencia ? '<div style="font-size:.75rem;color:#aaa;">' + esc(e.experiencia) + '</div>' : '') + '</td>' +
          '<td style="font-size:.82rem;">' + esc(tipoLabel(e.tipo, e.tipoCustom)) + '</td>' +
          '<td style="font-size:.82rem;">' + (e.dataEvento ? dShort(e.dataEvento) : '—') + '</td>' +
          '<td style="font-size:.82rem;">' + (e.pessoas || '—') + '</td>' +
          '<td style="font-size:.82rem;">' + brl(e.total) + '</td>' +
          '<td style="font-size:.82rem;"><b>' + brl(e.receita) + '</b></td>' +
        '</tr>';
      });
      conteudo += '</tbody></table></div>';
    }
    conteudo += '<div style="margin-top:12px;">' + btn('Registrar evento na aba Eventos', 'data-ep-goto="eventos"') + '</div>';
    return detalhes('🎉 Eventos fechados', lista.length + ' nos últimos 60 dias', conteudo, S.det.fech === true, 'fech');
  }

  // =============================================================
  // BLOCO 5 — as regras do jogo
  // -------------------------------------------------------------
  // Escritas a partir da config, não chumbadas no código: mudar a
  // régua é mudar o texto que as duas leem. Regra que mora só na
  // cabeça de alguém não é regra, é expectativa — e expectativa não
  // combinada vira briga depois.
  // =============================================================
  function blocoRegras(metas, conv) {
    var cfg = S.cfg || CFG_FALLBACK;
    var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    var dias = (Array.isArray(cfg.expediente_dias) ? cfg.expediente_dias : [1, 2, 3, 4, 5, 6])
                 .map(function (d) { return DIAS[d] || d; });
    var fu = Array.isArray(cfg.followup_dias) ? cfg.followup_dias : [1, 3, 7];
    var expediente = dias.join(', ') + ', ' + String(cfg.expediente_inicio).slice(0, 5) + '–' + String(cfg.expediente_fim).slice(0, 5);

    var regras = [
      { i: '⏱️', t: 'Responder em até ' + num(cfg.sla_primeira_resposta_horas, 2) + 'h',
        d: 'Vale pra qualquer pedido de evento, em qualquer canal. Dentro do expediente (' + expediente + ') — ' +
           'mensagem que chega 22h se responde na abertura do dia seguinte. <b>Fora do horário não precisa responder.</b>' },
      { i: '❓', t: 'A primeira resposta já pergunta as 3 coisas',
        d: 'Data, número de pessoas e se é em espaço nosso ou de vocês. Sem essas três, orçamento não fecha — ' +
           'e cada ida e volta a mais é um dia a mais pro cliente esfriar.' },
      { i: '📋', t: 'Orçamento em até ' + num(cfg.sla_orcamento_horas, 24) + 'h',
        d: 'Contado da primeira conversa. Faltou informação pra fechar o valor? Manda uma <b>faixa de preço</b> dentro do prazo. ' +
           'O que não pode é o cliente ficar sem número.' },
      { i: '🔁', t: 'Follow-up em D+' + fu.join(', D+') + ' — ' + num(cfg.followups_max, 3) + ' toques',
        d: 'Contados do envio do orçamento, feitos na lista do WhatsApp. Esgotou sem retorno, para de perseguir ' +
           'e libera tempo pra quem respondeu.' },
      { i: '🏢', t: metas.prospeccaoMin + ' a ' + metas.prospeccaoMax + ' empresas novas por semana',
        d: 'Empresa <b>nova</b> — follow-up na mesma empresa não conta de novo. ' + metas.prospeccaoMin +
           ' é o mínimo, ' + metas.prospeccaoMax + ' é o alvo cheio. É a única frente que não depende de ninguém chegar sozinho.' },
      { i: '🧮', t: 'Fechar o dia no contador',
        d: 'Antes de encerrar, preencher os números do dia aqui em cima. São 30 segundos. ' +
           'Sem isso a semana aparece zerada e não dá pra saber se o problema foi demanda ou conversão.' },
      { i: '🎯', t: metas.eventos + ' evento(s) e ' + brl(metas.receita) + ' por semana',
        d: metas.eventosTravada ? 'Meta travada na mão na configuração.'
           : 'Meta calculada do histórico real: ritmo dos últimos 90 dias × fator ' + metas.fator + '. A ' +
             Math.round(conv.taxa * 100) + '% de conversão, exige <b>' + metas.orcamentos + ' orçamentos</b> na semana.' },
      { i: '📉', t: 'Semana fraca: descobrir de qual lado',
        d: 'Poucos <b>pedidos</b> = problema de demanda, resolve com prospecção e divulgação. ' +
           'Pedidos normais e poucos <b>fechados</b> = problema de conversão, resolve no preço, no prazo e no follow-up.' },
    ];

    var conteudo = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
    regras.forEach(function (r) {
      conteudo += '<div style="background:#fcfcfc;border:1px solid #eee;border-radius:10px;padding:12px 14px;">' +
                    '<div style="font-size:.9rem;font-weight:700;color:#333;">' + r.i + ' ' + r.t + '</div>' +
                    '<div style="font-size:.8rem;color:#777;line-height:1.55;margin-top:5px;">' + r.d + '</div>' +
                  '</div>';
    });
    conteudo += '</div>';
    if (cfg.observacoes) {
      conteudo += '<div style="margin-top:10px;padding:12px 14px;background:#fff8ef;border:1px solid #f0c97a;border-radius:10px;' +
                  'font-size:.83rem;color:#7a4f00;white-space:pre-wrap;line-height:1.55;">' + esc(cfg.observacoes) + '</div>';
    }
    conteudo += '<div style="margin-top:12px;">' + btn('⚙️ Editar regras e metas', 'data-ep-cfg="1"') + '</div>';
    return detalhes('📐 As regras do jogo', 'combinado valendo pras duas', conteudo, S.det.regras === true, 'regras');
  }

  // =============================================================
  // BLOCO 6 — de onde vem a meta
  // =============================================================
  function blocoHistorico(baseline, conv, metas) {
    var conteudo;
    if (!baseline.eventos365) {
      conteudo = empty('Ainda não há evento pago registrado no financeiro. Enquanto não houver histórico, a meta fica no mínimo ' +
                       'de 1 evento por semana — assim que as primeiras vendas entrarem, ela se ajusta sozinha.');
      return detalhes('📈 De onde vem a meta', 'sem histórico ainda', conteudo, false, 'hist');
    }

    conteudo = '<div style="' + GRID + '">' +
      card({ label: 'Eventos (90 dias)', valor: String(baseline.eventos90),
             sub: 'ritmo atual: <b>' + (Math.round(baseline.porSemana * 100) / 100) + '</b> por semana' }) +
      card({ label: 'Eventos (12 meses)', valor: String(baseline.eventos365) }) +
      card({ label: 'Ticket médio', valor: brl(baseline.ticket),
             sub: baseline.amostraPequena ? 'poucos eventos em 90 dias — usando a média de 12 meses'
                                          : '90 dias · 12 meses: ' + brl(baseline.ticket365) }) +
      card({ label: 'Faturamento (90 dias)', valor: brl(baseline.faturamento90) }) +
      card({ label: 'Conversão', valor: Math.round(conv.taxa * 100) + '%',
             sub: conv.estimada
               ? 'estimativa inicial (' + conv.orcamentos + ' orçamento(s) registrados — precisa de 8 pra medir)'
               : conv.fechados + ' fechados / ' + conv.orcamentos + ' orçamentos (90 dias)' }) +
    '</div>' +
    '<div style="margin-top:12px;padding:12px 14px;background:#f7f7f7;border-radius:10px;font-size:.83rem;color:#666;line-height:1.6;">' +
      '<b>A conta da meta:</b> ' + baseline.eventos90 + ' eventos em 90 dias = ' +
      (Math.round(baseline.porSemana * 100) / 100) + '/semana × fator ' + metas.fator + ' = <b>' + metas.eventosAuto +
      ' evento(s)/semana</b>. A ' + Math.round(conv.taxa * 100) + '% de conversão, isso exige <b>' + metas.orcamentos +
      ' orçamentos</b> — e, pra alimentar esses orçamentos, a régua de ' + metas.prospeccaoMin + '–' + metas.prospeccaoMax +
      ' empresas novas por semana.' +
      (metas.eventosTravada || metas.receitaTravada || metas.orcamentosTravada
        ? '<br><span style="color:#a4663b;">Alguma meta está travada na mão — o número do placar é o travado.</span>' : '') +
    '</div>';

    if (baseline.tipos.length) {
      conteudo += '<div class="admin__table-wrap" style="margin-top:12px;"><table class="admin__table"><thead><tr>' +
        '<th>Tipo (12 meses)</th><th>Eventos</th><th>Pessoas/evento</th><th>Ticket médio</th><th>Faturamento</th>' +
        '</tr></thead><tbody>';
      baseline.tipos.forEach(function (t) {
        conteudo += '<tr><td><b>' + esc(t.label) + '</b></td><td>' + t.n + '</td>' +
          '<td>' + (t.n ? Math.round((t.pessoas / t.n) * 10) / 10 : '—') + '</td>' +
          '<td>' + brl(t.n ? Math.round(t.total / t.n) : 0) + '</td>' +
          '<td><b>' + brl(t.total) + '</b></td></tr>';
      });
      conteudo += '</tbody></table></div>';
    }
    conteudo += '<div style="font-size:.78rem;color:#aaa;margin-top:8px;">Pra conferir na mão: ' +
                '<code>sql/elarah_eventos_privados_baseline.sql</code>.</div>';
    return detalhes('📈 De onde vem a meta', 'nenhum número aqui é chutado', conteudo, S.det.hist === true, 'hist');
  }

  // =============================================================
  // BLOCO 7 — as últimas semanas (é a conversa de fechamento)
  // =============================================================
  function blocoSemanas() {
    var linhas = [];
    for (var i = 0; i < 6; i++) {
      var ini = weekStart() - i * 7 * DAY;
      var fim = ini + 7 * DAY;
      var fechados = S.eventos.filter(function (e) { return e.occurredMs >= ini && e.occurredMs < fim; });
      var prosp = 0;
      Object.keys(S.b2bFirst).forEach(function (pid) {
        var t = S.b2bFirst[pid];
        if (t >= ini && t < fim) prosp++;
      });
      linhas.push({
        ini: ini, fim: fim - DAY,
        pedidos: somaPeriodo('pedidos_recebidos', ini, fim),
        orcamentos: somaPeriodo('orcamentos_enviados', ini, fim),
        followups: somaPeriodo('followups', ini, fim),
        prospeccao: prosp + somaPeriodo('empresas_abordadas_extra', ini, fim),
        foraDoPrazo: somaPeriodo('fora_do_prazo', ini, fim),
        eventos: fechados.length,
        receita: fechados.reduce(function (a, e) { return a + e.total; }, 0),
      });
    }

    var conteudo = '<div class="admin__table-wrap"><table class="admin__table"><thead><tr>' +
      '<th>Semana</th><th>Pedidos</th><th>Orçamentos</th><th>Follow-ups</th><th>Prospecção</th>' +
      '<th>Fora do prazo</th><th>Eventos</th><th>Receita</th>' +
      '</tr></thead><tbody>';
    linhas.forEach(function (l, idx) {
      conteudo += '<tr' + (idx === 0 ? ' style="background:#fffdf8;"' : '') + '>' +
        '<td style="font-size:.8rem;">' + dShort(l.ini) + ' a ' + dShort(l.fim) + (idx === 0 ? ' <b>(atual)</b>' : '') + '</td>' +
        '<td>' + l.pedidos + '</td><td>' + l.orcamentos + '</td><td>' + l.followups + '</td>' +
        '<td>' + l.prospeccao + '</td>' +
        '<td' + (l.foraDoPrazo ? ' style="color:#b3261e;font-weight:700;"' : '') + '>' + l.foraDoPrazo + '</td>' +
        '<td><b>' + l.eventos + '</b></td><td>' + brl(l.receita) + '</td>' +
      '</tr>';
    });
    conteudo += '</tbody></table></div>';

    // Últimos dias soltos — pra achar rápido um dia esquecido.
    var faltando = [];
    for (var d = 0; d < 7; d++) {
      var k = dayKey(new Date(Date.now() - d * DAY));
      if (!S.dias[k]) faltando.push(k);
    }
    if (faltando.length) {
      conteudo += '<div style="margin-top:10px;font-size:.8rem;color:#a4663b;">Sem registro: ' +
        faltando.map(function (k) {
          return btn(dWeekday(k) + ' ' + dShort(k), 'data-ep-dia="' + k + '"', 'margin:2px;');
        }).join('') + '</div>';
    }
    return detalhes('🗓️ Últimas 6 semanas', 'o histórico da conversa de sexta', conteudo, S.det.sem === true, 'sem');
  }

  function avisoMigration() {
    var falta = [];
    if (S.missingCfg) falta.push('sql/elarah_eventos_privados_comercial.sql');
    if (S.missingDia) falta.push('sql/elarah_eventos_privados_registro_diario.sql');
    if (!falta.length) return '';
    return '<div style="padding:14px 16px;background:#fff8ef;border:1px solid #f0c97a;border-radius:10px;margin-bottom:16px;' +
      'font-size:.87rem;color:#7a4f00;line-height:1.6;"><b>Falta rodar migration.</b> ' +
      'Abra o SQL Editor do Supabase e rode ' + falta.map(function (f) { return '<code>' + esc(f) + '</code>'; }).join(' e ') + '. ' +
      'Enquanto isso o painel funciona com o que já existe, mas ' +
      (S.missingDia ? 'o registro do dia não salva' : 'as regras editadas não salvam') + '.</div>';
  }

  // =============================================================
  // RENDER PRINCIPAL
  // =============================================================
  function render() {
    var root = el('evtpriv-root');
    if (!root) return;
    var baseline = computeBaseline();
    var conv = computeConversao(baseline);
    var metas = computeMetas(baseline, conv);
    var sem = computeSemana();

    root.innerHTML =
      avisoMigration() +
      blocoRegistro() +
      blocoPlacar(sem, metas, baseline, conv) +
      blocoProspeccao(computeProspeccao(), sem, metas) +
      blocoTop() +
      blocoMensagens() +
      blocoFechados() +
      blocoSemanas() +
      blocoRegras(metas, conv) +
      blocoHistorico(baseline, conv, metas);
    pintarStatus();
  }

  // =============================================================
  // REGISTRO DO DIA — salvar
  // -------------------------------------------------------------
  // Salva sozinho, com debounce: clicar +1 cinco vezes seguidas é
  // uma escrita só. O placar atualiza na hora (estado local), o
  // banco alcança meio segundo depois.
  // =============================================================
  var saveTimer = null;
  function pintarStatus() {
    var e = el('ep-dia-status');
    if (!e) return;
    if (S.missingDia) { e.textContent = 'sem tabela'; e.style.color = '#b3261e'; return; }
    if (S.salvando) { e.textContent = 'salvando…'; e.style.color = '#bbb'; return; }
    e.textContent = S.salvoEm ? 'salvo ✓' : '';
    e.style.color = '#1a8a4a';
  }
  function agendarSave() {
    if (S.missingDia) return;
    S.salvando = true;
    pintarStatus();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(salvarDia, 600);
  }
  async function salvarDia() {
    var c = sb();
    if (!c || S.missingDia) return;
    var k = S.diaSel;
    var r = linhaDia(k);
    var payload = { dia: k, observacoes: (r.observacoes || '').trim() || null };
    CAMPOS.forEach(function (campo) { payload[campo.k] = Math.max(0, num(r[campo.k])); });

    var res = await c.from('evento_privado_dia').upsert(payload, { onConflict: 'dia' });
    S.salvando = false;
    if (res.error) {
      S.salvoEm = null;
      pintarStatus();
      var e = el('ep-dia-status');
      if (e) { e.textContent = 'erro'; e.style.color = '#b3261e'; }
      console.error('[EventosPrivados] salvar dia', res.error);
      alert('Não consegui salvar o registro do dia: ' + res.error.message);
      return;
    }
    S.salvoEm = Date.now();
    pintarStatus();
  }
  function alterar(campo, delta) {
    var r = linhaDia(S.diaSel);
    r[campo] = Math.max(0, num(r[campo]) + delta);
    S.dias[S.diaSel] = r;
    render();
    agendarSave();
  }
  function definir(campo, valor) {
    var r = linhaDia(S.diaSel);
    r[campo] = Math.max(0, num(valor));
    S.dias[S.diaSel] = r;
    render();
    agendarSave();
  }

  // =============================================================
  // MENSAGENS — copiar, editar, restaurar
  // =============================================================
  // Aviso flutuante, fora do #evtpriv-root: o painel se redesenha a
  // cada clique, então um feedback dentro dele sumiria na hora.
  function toast(texto, acaoLabel, acaoFn) {
    var antigo = el('evtpriv-toast');
    if (antigo) antigo.remove();
    var t = document.createElement('div');
    t.id = 'evtpriv-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:10000;' +
      'background:#333;color:#fff;padding:11px 16px;border-radius:10px;font-family:inherit;font-size:.86rem;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;max-width:92vw;';
    t.appendChild(document.createTextNode(texto));
    if (acaoLabel && acaoFn) {
      var a = document.createElement('button');
      a.type = 'button';
      a.textContent = acaoLabel;
      a.style.cssText = 'background:none;border:0;color:#ffd39a;font-family:inherit;font-size:.86rem;font-weight:700;cursor:pointer;padding:0;';
      a.addEventListener('click', function () { t.remove(); acaoFn(); });
      t.appendChild(a);
    }
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, acaoLabel ? 6000 : 2200);
  }

  async function copiarTexto(txt) {
    // navigator.clipboard exige contexto seguro e permissão; quando
    // não rola, o textarea invisível + execCommand ainda funciona.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(txt);
        return true;
      }
    } catch (e) { /* cai no fallback */ }
    try {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  async function copiarMensagem(chave) {
    var txt = preencher(msgTexto(chave), varsAtuais());
    var ok = await copiarTexto(txt);
    if (!ok) {
      // Último recurso: mostra o texto pra copiar na mão em vez de
      // deixar a pessoa achando que copiou.
      prompt('Não consegui copiar sozinho. Selecione e copie:', txt);
      return;
    }
    if (MSG_FOLLOWUP[chave]) {
      alterar('followups', 1);
      toast('Copiado ✓ · +1 follow-up hoje', 'desfazer', function () { alterar('followups', -1); });
    } else {
      toast('Copiado ✓');
    }
  }

  async function salvarMensagem(chave, texto) {
    var cfg = S.cfg || CFG_FALLBACK;
    var mens = Object.assign({}, cfg.mensagens || {});
    var limpo = String(texto == null ? '' : texto);
    // Igual ao padrão (ou vazio) não vira registro: some do JSON e a
    // mensagem volta a seguir o padrão do painel sozinha.
    if (!limpo.trim() || limpo === (MSG_PADRAO[chave] || {}).texto) delete mens[chave];
    else mens[chave] = limpo;
    cfg.mensagens = mens;
    S.cfg = cfg;
    render();

    if (S.missingCfg || S.missingMsg) return;
    var c = sb();
    if (!c) return;
    var res = await c.from('evento_privado_metas').update({ mensagens: mens }).eq('id', 1);
    if (res.error) {
      console.error('[EventosPrivados] salvar mensagem', res.error);
      toast('Não consegui salvar a mensagem: ' + res.error.message);
    }
  }

  // =============================================================
  // PROSPECÇÃO — ações
  // =============================================================
  async function logProspect(id) {
    var c = sb();
    if (!c) return;
    if (S.b2bFirst[id]) return;      // já abordada: não conta duas vezes
    var ins = await c.from('b2b_prospect_interactions').insert({
      prospect_id: id, tipo: 'mensagem_enviada',
      descricao: 'Abordagem de eventos (aba Eventos privados)',
    });
    if (ins.error) { alert('Erro ao registrar: ' + ins.error.message); return; }
    // Estado local primeiro: a linha some da fila e o placar sobe na
    // hora, sem esperar o round-trip.
    S.b2bFirst[id] = Date.now();
    var p = S.prospects.filter(function (x) { return x.id === id; })[0];
    if (p && p.status_comercial === 'nao_contatado') {
      p.status_comercial = 'mensagem_enviada';
      await c.from('b2b_prospects').update({ status_comercial: 'mensagem_enviada' }).eq('id', id);
    }
    render();
  }

  // Completar contato do RH sem sair da fila — o gargalo mais comum
  // da prospecção é "empresa cadastrada, contato não".
  async function quickContato(id) {
    var c = sb();
    if (!c) return;
    var p = S.prospects.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var wa = prompt('WhatsApp do contato em ' + p.nome + ' (vazio pra pular):', p.contato_whatsapp || '');
    if (wa === null) return;
    var mail = prompt('E-mail do contato em ' + p.nome + ' (vazio pra pular):', p.contato_email || '');
    if (mail === null) return;
    var patch = {};
    if (wa.trim()) patch.contato_whatsapp = wa.trim();
    if (mail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) { alert('E-mail inválido.'); return; }
      patch.contato_email = mail.trim();
    }
    if (!Object.keys(patch).length) return;
    var upd = await c.from('b2b_prospects').update(patch).eq('id', id);
    if (upd.error) { alert('Erro: ' + upd.error.message); return; }
    Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
    render();
  }

  // Delegação única no root — sobrevive a todo re-render.
  function wireRoot() {
    var root = el('evtpriv-root');
    if (!root || root.dataset.epWired) return;
    root.dataset.epWired = '1';

    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-ep-inc],[data-ep-dia],[data-ep-cfg],[data-ep-goto],' +
                                '[data-ep-prospect],[data-ep-prospect-log],[data-ep-prospect-contato],' +
                                '[data-ep-copy],[data-ep-msg-reset],[data-ep-pers-clear]');
      if (!t) return;
      // Links (WhatsApp/e-mail) precisam abrir normalmente: o registro
      // roda em paralelo, sem preventDefault.
      if (t.tagName !== 'A') ev.preventDefault();

      if (t.hasAttribute('data-ep-inc')) return alterar(t.getAttribute('data-ep-inc'), num(t.getAttribute('data-ep-delta'), 1));
      if (t.hasAttribute('data-ep-dia')) { S.diaSel = t.getAttribute('data-ep-dia'); return render(); }
      if (t.hasAttribute('data-ep-cfg')) return openCfgModal();
      if (t.hasAttribute('data-ep-goto')) {
        if (window._adminNavigateToPanel) window._adminNavigateToPanel(t.getAttribute('data-ep-goto'));
        return;
      }
      if (t.hasAttribute('data-ep-prospect')) return void logProspect(t.getAttribute('data-ep-prospect'));
      if (t.hasAttribute('data-ep-prospect-log')) return void logProspect(t.getAttribute('data-ep-prospect-log'));
      if (t.hasAttribute('data-ep-prospect-contato')) return void quickContato(t.getAttribute('data-ep-prospect-contato'));
      if (t.hasAttribute('data-ep-copy')) return void copiarMensagem(t.getAttribute('data-ep-copy'));
      if (t.hasAttribute('data-ep-msg-reset')) return void salvarMensagem(t.getAttribute('data-ep-msg-reset'), '');
      if (t.hasAttribute('data-ep-pers-clear')) { S.pers = { nome: '', evento: '', empresa: '' }; return render(); }
    });

    // Campos: 'change' (e não 'input') pra não re-renderizar a cada
    // tecla digitada e roubar o foco de quem está digitando.
    root.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === 'ep-dia-sel') { S.diaSel = t.value || dayKey(); return render(); }
      if (t.hasAttribute && t.hasAttribute('data-ep-num')) return definir(t.getAttribute('data-ep-num'), t.value);
      if (t.hasAttribute && t.hasAttribute('data-ep-msg')) return void salvarMensagem(t.getAttribute('data-ep-msg'), t.value);
      if (t.hasAttribute && t.hasAttribute('data-ep-pers')) {
        S.pers[t.getAttribute('data-ep-pers')] = t.value;
        return render();
      }
      if (t.hasAttribute && t.hasAttribute('data-ep-obs')) {
        var r = linhaDia(S.diaSel);
        r.observacoes = t.value;
        S.dias[S.diaSel] = r;
        return agendarSave();
      }
    });

    // 'toggle' não borbulha — precisa de captura. Guardar o estado
    // aberto/fechado faz o bloco sobreviver ao re-render de cada +1.
    root.addEventListener('toggle', function (ev) {
      var t = ev.target;
      if (t && t.tagName === 'DETAILS' && t.dataset.epDet) S.det[t.dataset.epDet] = t.open;
    }, true);
  }

  // =============================================================
  // MODAL DE REGRAS E METAS
  // =============================================================
  var INP = 'margin-top:4px;width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-family:inherit;font-size:.88rem;box-sizing:border-box;';
  function campo(label, inner, full) {
    return '<label style="font-size:.8rem;font-weight:600;color:#444;' + (full ? 'grid-column:1/-1;' : '') + '">' + label + inner + '</label>';
  }
  function ensureModal() {
    var m = el('evtpriv-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'evtpriv-modal';
    m.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;';
    m.addEventListener('click', function (ev) { if (ev.target === m) closeModal(); });
    document.body.appendChild(m);
    return m;
  }
  function openModal(html) {
    var m = ensureModal();
    m.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:680px;width:100%;padding:24px;font-family:inherit;margin:auto;">' + html + '</div>';
    m.style.display = 'flex';
  }
  function closeModal() {
    var m = el('evtpriv-modal');
    if (m) { m.style.display = 'none'; m.innerHTML = ''; }
  }
  function val(id) { var e = el(id); return e ? String(e.value || '').trim() : ''; }
  function parseMoney(txt) {
    var s = String(txt == null ? '' : txt).trim().replace(/[R$\s]/g, '');
    if (!s) return null;
    // "1.500,00" (BR) e "1500.00" (digitado direto): o separador
    // decimal é o último símbolo que aparece.
    if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    return (isFinite(n) && n >= 0) ? Math.round(n * 100) : null;
  }

  function openCfgModal() {
    if (S.missingCfg) { alert('Rode antes a migration sql/elarah_eventos_privados_comercial.sql.'); return; }
    var cfg = S.cfg || CFG_FALLBACK;
    var DIAS = [{ v: 1, l: 'Seg' }, { v: 2, l: 'Ter' }, { v: 3, l: 'Qua' }, { v: 4, l: 'Qui' },
                { v: 5, l: 'Sex' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' }];
    var ativos = Array.isArray(cfg.expediente_dias) ? cfg.expediente_dias.map(Number) : [1, 2, 3, 4, 5, 6];

    openModal(
      '<h2 style="margin:0 0 4px;font-size:1.25rem;">Regras e metas</h2>' +
      '<p style="margin:0 0 16px;font-size:.83rem;color:#888;line-height:1.5;">' +
        'É daqui que saem os prazos escritos nas regras e os números do placar. ' +
        'Meta <b>em branco = calculada do histórico</b> (recomendado — acompanha o crescimento sozinha).</p>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Prazos</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        campo('Responder em (horas)', '<input type="number" step="0.5" min="0.5" id="cfg-sla-resp" value="' + esc(cfg.sla_primeira_resposta_horas) + '" style="' + INP + '">') +
        campo('Enviar orçamento em (horas)', '<input type="number" step="1" min="1" id="cfg-sla-orc" value="' + esc(cfg.sla_orcamento_horas) + '" style="' + INP + '">') +
        campo('Expediente começa', '<input type="time" id="cfg-ini" value="' + esc(String(cfg.expediente_inicio).slice(0, 5)) + '" style="' + INP + '">') +
        campo('Expediente termina', '<input type="time" id="cfg-fim" value="' + esc(String(cfg.expediente_fim).slice(0, 5)) + '" style="' + INP + '">') +
        campo('Dias de expediente', '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;">' +
          DIAS.map(function (d) {
            return '<label style="font-weight:500;font-size:.82rem;display:flex;align-items:center;gap:4px;">' +
                   '<input type="checkbox" class="cfg-dia" value="' + d.v + '"' + (ativos.indexOf(d.v) !== -1 ? ' checked' : '') + '> ' + d.l + '</label>';
          }).join('') + '</div>', true) +
        campo('Cadência de follow-up (dias após o orçamento)', '<input type="text" id="cfg-fu" placeholder="1,3,7" value="' + esc((cfg.followup_dias || [1, 3, 7]).join(',')) + '" style="' + INP + '">') +
        campo('Máximo de follow-ups', '<input type="number" min="0" id="cfg-fu-max" value="' + esc(cfg.followups_max) + '" style="' + INP + '">') +
      '</div>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Metas semanais</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        campo('Prospecção — mínimo', '<input type="number" min="0" id="cfg-pros-min" value="' + esc(cfg.meta_prospeccao_min) + '" style="' + INP + '">') +
        campo('Prospecção — alvo cheio', '<input type="number" min="0" id="cfg-pros-max" value="' + esc(cfg.meta_prospeccao_max) + '" style="' + INP + '">') +
        campo('Fator de crescimento sobre o histórico', '<input type="number" step="0.05" min="0.1" id="cfg-fator" value="' + esc(cfg.fator_crescimento) + '" style="' + INP + '">') +
        campo('Eventos/semana (vazio = automático)', '<input type="number" min="0" id="cfg-meta-eventos" value="' + esc(cfg.meta_eventos_semana == null ? '' : cfg.meta_eventos_semana) + '" style="' + INP + '">') +
        campo('Orçamentos/semana (vazio = automático)', '<input type="number" min="0" id="cfg-meta-orc" value="' + esc(cfg.meta_orcamentos_semana == null ? '' : cfg.meta_orcamentos_semana) + '" style="' + INP + '">') +
        campo('Receita/semana R$ (vazio = automático)', '<input type="text" id="cfg-meta-receita" value="' + esc(cfg.meta_receita_semana_centavos == null ? '' : (cfg.meta_receita_semana_centavos / 100).toFixed(2).replace('.', ',')) + '" style="' + INP + '">') +
      '</div>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Contexto</h3>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
        campo('Quem cuida dos eventos privados', '<input type="text" id="cfg-resp" placeholder="Nome — entra nas mensagens prontas" value="' + esc(cfg.responsavel_nome || '') + '" style="' + INP + '">') +
        campo('Combinados extras (aparecem no card laranja)', '<textarea id="cfg-obs" rows="3" style="' + INP + 'resize:vertical;">' + esc(cfg.observacoes || '') + '</textarea>') +
      '</div>' +

      '<div id="cfg-msg" style="font-size:.85rem;margin-top:12px;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">' +
        '<button type="button" id="cfg-cancel" style="padding:9px 16px;background:#fff;border:1px solid #ccc;border-radius:6px;font-family:inherit;font-size:.9rem;cursor:pointer;">Cancelar</button>' +
        '<button type="button" id="cfg-save" style="padding:9px 18px;background:#f0a05e;color:#fff;border:0;border-radius:6px;font-family:inherit;font-size:.9rem;font-weight:600;cursor:pointer;">Salvar regras</button>' +
      '</div>'
    );
    el('cfg-cancel').addEventListener('click', closeModal);
    el('cfg-save').addEventListener('click', saveCfg);
  }

  async function saveCfg() {
    var c = sb();
    if (!c) return;
    var msgEl = el('cfg-msg');
    var dias = [];
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-dia'), function (i) {
      if (i.checked) dias.push(num(i.value));
    });
    if (!dias.length) { if (msgEl) msgEl.innerHTML = '<span style="color:#b3261e;">Escolha ao menos um dia de expediente.</span>'; return; }

    var fu = val('cfg-fu').split(',').map(function (x) { return parseInt(x, 10); })
              .filter(function (x) { return isFinite(x) && x >= 0; });
    if (!fu.length) fu = [1, 3, 7];

    var payload = {
      sla_primeira_resposta_horas: num(val('cfg-sla-resp'), 2) || 2,
      sla_orcamento_horas: num(val('cfg-sla-orc'), 24) || 24,
      expediente_inicio: val('cfg-ini') || '09:00',
      expediente_fim: val('cfg-fim') || '19:00',
      expediente_dias: dias,
      followup_dias: fu,
      followups_max: num(val('cfg-fu-max'), 3),
      meta_prospeccao_min: num(val('cfg-pros-min'), 30),
      meta_prospeccao_max: num(val('cfg-pros-max'), 50),
      fator_crescimento: num(val('cfg-fator'), 1.3) || 1.3,
      meta_eventos_semana: val('cfg-meta-eventos') === '' ? null : num(val('cfg-meta-eventos')),
      meta_orcamentos_semana: val('cfg-meta-orc') === '' ? null : num(val('cfg-meta-orc')),
      meta_receita_semana_centavos: val('cfg-meta-receita') === '' ? null : parseMoney(val('cfg-meta-receita')),
      responsavel_nome: val('cfg-resp') || null,
      observacoes: val('cfg-obs') || null,
    };
    if (payload.meta_prospeccao_max < payload.meta_prospeccao_min) {
      if (msgEl) msgEl.innerHTML = '<span style="color:#b3261e;">O alvo cheio não pode ser menor que o mínimo.</span>';
      return;
    }

    if (msgEl) msgEl.innerHTML = '<span style="color:#999;">Salvando…</span>';
    var res = await c.from('evento_privado_metas').upsert(Object.assign({ id: 1 }, payload));
    if (res.error) {
      if (msgEl) msgEl.innerHTML = '<span style="color:#b3261e;">Erro: ' + esc(res.error.message) + '</span>';
      return;
    }
    S.cfg = Object.assign({}, S.cfg || CFG_FALLBACK, payload);
    closeModal();
    render();
  }

  // =============================================================
  // BOOT
  // =============================================================
  async function run() {
    if (S.loading) return;
    S.loading = true;
    var root = el('evtpriv-root');
    if (root && !root.dataset.epLoaded) {
      root.innerHTML = '<div style="color:#999;font-size:.9rem;">Lendo registro, metas, prospecção e histórico de eventos…</div>';
    }
    try {
      await loadAll();
      render();
      wireRoot();
      if (root) root.dataset.epLoaded = '1';
    } catch (e) {
      if (root) root.innerHTML = '<div style="color:#b3261e;font-size:.9rem;">Falha ao carregar: ' + esc((e && e.message) || e) + '</div>';
      console.error('[EventosPrivados]', e);
    } finally {
      S.loading = false;
    }
  }

  function init() {
    var btnR = el('evtpriv-refresh');
    if (btnR && !btnR.dataset.wired) { btnR.dataset.wired = '1'; btnR.addEventListener('click', run); }
    var nav = document.querySelector('[data-panel="eventos-privados"]');
    if (nav && !nav.dataset.epWired) {
      nav.dataset.epWired = '1';
      // setTimeout: deixa o admin trocar de painel antes de renderizar.
      nav.addEventListener('click', function () { setTimeout(run, 150); });
    }
    var p = el('panel-eventos-privados');
    if (p && p.classList.contains('admin__panel--active')) run();
  }

  // Exposto pra que outros pontos do admin forcem refresh.
  window.ElarahEventosPrivados = { run: run };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
