// =============================================================
// ELARAH — Eventos Privados / Comercial (aba própria no admin)
// -------------------------------------------------------------
// Painel de acompanhamento da pessoa que cuida de eventos privados
// (aniversário, despedida, corporativo). Três frentes, um lugar só:
//
//   1. PROSPECÇÃO — fila de empresas com WhatsApp/e-mail do RH em
//      1 clique. Meta de 30–50 empresas NOVAS por semana.
//   2. ORÇAMENTO  — pipeline de pedidos com SLA de resposta e
//      cadência de follow-up. É aqui que se ganha ou se perde.
//   3. RESULTADO  — eventos fechados x meta da semana, com a meta
//      saindo do histórico real (não de achismo).
//
// Filosofia: nada aqui é preenchido "pra relatório". Os números
// saem do trabalho que já é registrado — abordagem no CRM B2B,
// orçamento no pipeline, venda no financeiro. Se a régua depende
// de alguém lembrar de atualizar planilha, ela morre em 3 semanas.
//
// 100% client-side, custo zero. Renderiza em #evtpriv-root.
//
// Banco: sql/elarah_eventos_privados_comercial.sql
// Conferência na mão: sql/elarah_eventos_privados_baseline.sql
// =============================================================
(function () {
  'use strict';

  var DAY = 86400000;
  var HOUR = 3600000;

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

  // Data curta "12/ago". Aceita Date, ms ou string ISO/date.
  function dShort(v) {
    if (!v) return '—';
    var d = (v instanceof Date) ? v : new Date(typeof v === 'number' ? v : String(v).length === 10 ? v + 'T12:00:00' : v);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  function dTime(v) {
    var t = ms(v);
    if (t == null) return '—';
    var d = new Date(t);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  // "há 3h" / "há 2d" / "em 4h" — o jeito que a gente lê prazo.
  function rel(t) {
    if (t == null) return '—';
    var diff = t - Date.now();
    var abs = Math.abs(diff);
    var txt;
    if (abs < HOUR) txt = Math.max(1, Math.round(abs / 60000)) + 'min';
    else if (abs < DAY) txt = Math.round(abs / HOUR) + 'h';
    else txt = Math.round(abs / DAY) + 'd';
    return (diff >= 0 ? 'em ' : 'há ') + txt;
  }
  // Segunda-feira 00:00 da semana de `d` (semana comercial começa na segunda).
  function weekStart(d) {
    var x = new Date(d || Date.now());
    x.setHours(0, 0, 0, 0);
    var dow = x.getDay();              // 0=dom
    var back = (dow === 0) ? 6 : dow - 1;
    x.setDate(x.getDate() - back);
    return x.getTime();
  }

  // ----- Links de contato -----
  function waDigits(raw) {
    var d = String(raw || '').replace(/\D+/g, '');
    if (!d) return null;
    return d.length <= 11 ? '55' + d : d;
  }
  // api.whatsapp.com/send em vez de wa.me: wa.me corrompe emoji fora do
  // BMP em alguns clientes (Safari iOS, WhatsApp Web).
  function waLink(raw, msg) {
    var d = waDigits(raw);
    if (!d) return null;
    var base = 'https://api.whatsapp.com/send?phone=' + d;
    return msg ? base + '&text=' + encodeURIComponent(msg) : base;
  }
  function mailLink(email, subject, body) {
    if (!email) return null;
    return 'mailto:' + encodeURIComponent(String(email).trim()) +
           '?subject=' + encodeURIComponent(subject || '') +
           '&body=' + encodeURIComponent(body || '');
  }
  // LinkedIn da empresa → aba "Pessoas" já filtrada por RH/People.
  // Mesma transformação usada na aba Prospecção B2B: serve pra achar
  // o decisor quando não existe WhatsApp nem e-mail cadastrado.
  function linkedinPeople(url) {
    var raw = String(url || '').trim();
    if (!raw) return null;
    var m = raw.match(/^(https?:\/\/(?:www\.)?linkedin\.com\/company\/[^/?#]+)\/?/i);
    if (!m) return raw;
    return m[1].replace(/\/$/, '') + '/people/?keywords=' +
           encodeURIComponent('people OR rh OR cultura OR talent OR gente OR pessoas');
  }

  // ----- Config padrão (espelha os DEFAULTs da tabela) -----
  // Usada enquanto a migration não rodou, pra aba abrir e explicar
  // o que fazer em vez de dar tela branca.
  var CFG_FALLBACK = {
    id: 1,
    meta_prospeccao_min: 30,
    meta_prospeccao_max: 50,
    meta_orcamentos_semana: null,
    meta_eventos_semana: null,
    meta_receita_semana_centavos: null,
    fator_crescimento: 1.3,
    sla_primeira_resposta_horas: 2,
    sla_orcamento_horas: 24,
    expediente_inicio: '09:00',
    expediente_fim: '19:00',
    expediente_dias: [1, 2, 3, 4, 5, 6],
    followup_dias: [1, 3, 7],
    followups_max: 3,
    responsavel_nome: null,
    observacoes: null,
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

  var ORIGENS = [
    { v: 'instagram',      l: 'Instagram' },
    { v: 'whatsapp',       l: 'WhatsApp' },
    { v: 'site',           l: 'Site' },
    { v: 'indicacao',      l: 'Indicação' },
    { v: 'prospeccao_b2b', l: 'Prospecção B2B' },
    { v: 'google',         l: 'Google' },
    { v: 'evento_anterior',l: 'Cliente de evento anterior' },
    { v: 'outro',          l: 'Outro' },
  ];
  function origemLabel(v) {
    var o = ORIGENS.filter(function (x) { return x.v === v; })[0];
    return o ? o.l : (v || '—');
  }

  var STATUS = [
    { v: 'novo',              l: 'Novo',              cor: '#b3261e', bg: '#fdecea' },
    { v: 'respondido',        l: 'Respondido',        cor: '#a4663b', bg: '#fff8ef' },
    { v: 'orcamento_enviado', l: 'Orçamento enviado', cor: '#3068a8', bg: '#e6f0fa' },
    { v: 'negociacao',        l: 'Negociação',        cor: '#7a4f00', bg: '#fdf3d8' },
    { v: 'fechado',           l: 'Fechado',           cor: '#1a8a4a', bg: '#e6f4ea' },
    { v: 'perdido',           l: 'Perdido',           cor: '#777',    bg: '#f1f1f1' },
    { v: 'sem_resposta',      l: 'Sem resposta',      cor: '#777',    bg: '#f1f1f1' },
  ];
  function statusMeta(v) {
    return STATUS.filter(function (x) { return x.v === v; })[0] ||
           { v: v, l: v || '—', cor: '#777', bg: '#f1f1f1' };
  }
  // Status que ainda pedem trabalho — o que conta como "pipeline aberto".
  function isAberto(s) {
    return s === 'novo' || s === 'respondido' || s === 'orcamento_enviado' || s === 'negociacao';
  }

  var INT_TIPOS = [
    { v: 'primeiro_contato',  l: '👋 Primeiro contato' },
    { v: 'respondeu_cliente', l: '💬 Cliente respondeu' },
    { v: 'orcamento_enviado', l: '📋 Orçamento enviado' },
    { v: 'follow_up',         l: '🔁 Follow-up' },
    { v: 'reuniao',           l: '📅 Reunião' },
    { v: 'visita_local',      l: '📍 Visita ao local' },
    { v: 'negociacao',        l: '💼 Negociação' },
    { v: 'fechado',           l: '🎉 Fechado' },
    { v: 'perdido',           l: '❌ Perdido' },
    { v: 'observacao',        l: '📝 Observação' },
  ];
  function intLabel(v) {
    var o = INT_TIPOS.filter(function (x) { return x.v === v; })[0];
    return o ? o.l : (v || '—');
  }

  // =============================================================
  // RELÓGIO DE HORAS ÚTEIS
  // -------------------------------------------------------------
  // SLA de 2h só faz sentido se o relógio parar fora do expediente.
  // Senão, uma mensagem que chega 23h30 nasce estourada às 1h30 e a
  // régua vira piada — ninguém confia num painel que cobra o
  // impossível. Aqui o tempo só corre nos dias e no horário
  // configurados em evento_privado_metas.
  // =============================================================
  function parseHM(s, fb) {
    var m = String(s || '').match(/^(\d{1,2}):(\d{2})/);
    if (!m) return fb;
    return num(m[1]) * 60 + num(m[2]);
  }
  function cfgWindow(cfg) {
    var ini = parseHM(cfg.expediente_inicio, 9 * 60);
    var fim = parseHM(cfg.expediente_fim, 19 * 60);
    if (fim <= ini) fim = ini + 60;   // config inválida não pode travar a conta
    var dias = Array.isArray(cfg.expediente_dias) && cfg.expediente_dias.length
      ? cfg.expediente_dias.map(Number)
      : [1, 2, 3, 4, 5, 6];
    return { ini: ini, fim: fim, dias: dias };
  }
  // Minutos úteis entre dois instantes. Varre dia a dia somando a
  // interseção com a janela de expediente. Teto de 400 dias pra não
  // travar a página com uma data absurda digitada errado.
  function bizMinutes(fromMs, toMs, cfg) {
    if (fromMs == null || toMs == null || toMs <= fromMs) return 0;
    var w = cfgWindow(cfg);
    var total = 0;
    var cursor = new Date(fromMs); cursor.setHours(0, 0, 0, 0);
    var guard = 0;
    while (cursor.getTime() <= toMs && guard++ < 400) {
      if (w.dias.indexOf(cursor.getDay()) !== -1) {
        var dayStart = cursor.getTime();
        var open = dayStart + w.ini * 60000;
        var close = dayStart + w.fim * 60000;
        var a = Math.max(open, fromMs);
        var b = Math.min(close, toMs);
        if (b > a) total += (b - a) / 60000;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return Math.round(total);
  }
  // Instante em que o prazo estoura, dado o início e um SLA em horas
  // ÚTEIS. Anda o relógio pra frente consumindo só expediente.
  function bizDeadline(fromMs, horas, cfg) {
    if (fromMs == null) return null;
    var w = cfgWindow(cfg);
    var restante = num(horas, 2) * 60;
    var cursor = new Date(fromMs); cursor.setHours(0, 0, 0, 0);
    var guard = 0;
    while (guard++ < 400) {
      if (w.dias.indexOf(cursor.getDay()) !== -1) {
        var dayStart = cursor.getTime();
        var open = dayStart + w.ini * 60000;
        var close = dayStart + w.fim * 60000;
        var a = Math.max(open, fromMs);
        if (close > a) {
          var disponivel = (close - a) / 60000;
          if (disponivel >= restante) return a + restante * 60000;
          restante -= disponivel;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return null;
  }
  function horasUteisTxt(minutos) {
    if (minutos == null) return '—';
    if (minutos < 60) return minutos + 'min úteis';
    var h = minutos / 60;
    return (h < 10 ? Math.round(h * 10) / 10 : Math.round(h)) + 'h úteis';
  }

  // =============================================================
  // ESTADO + CARGA
  // =============================================================
  var S = {
    cfg: null,
    leads: [],
    ints: [],        // interações dos leads (feed de atividade)
    eventos: [],     // eventos já fechados (manual_sales normalizado)
    prospects: [],   // empresas do CRM B2B
    b2bFirst: {},    // prospect_id -> ms da PRIMEIRA abordagem
    missing: null,   // nome da tabela que faltou (migration não rodou)
    loading: false,
  };

  // Critério de "venda-evento" — espelha a aba Eventos e a view
  // v_eventos_privados_historico. Mantido igual de propósito: se os
  // dois lugares divergem, a meta deixa de bater com o financeiro e
  // ninguém confia mais no painel.
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

  async function loadAll() {
    var c = sb();
    if (!c) throw new Error('Supabase não carregou.');
    S.missing = null;

    // --- Config (metas + regras) ---
    var cfgRes = await c.from('evento_privado_metas').select('*').eq('id', 1).maybeSingle();
    if (cfgRes.error) {
      // 42P01 = relation does not exist → migration ainda não rodou.
      if (/does not exist|schema cache/i.test(cfgRes.error.message || '')) {
        S.missing = 'evento_privado_metas';
        S.cfg = CFG_FALLBACK;
      } else {
        throw new Error('metas: ' + cfgRes.error.message);
      }
    } else {
      S.cfg = cfgRes.data || CFG_FALLBACK;
    }

    // --- Leads (pipeline de orçamento) ---
    S.leads = [];
    if (!S.missing) {
      var lRes = await c.from('evento_privado_leads').select('*')
        .order('lead_at', { ascending: false }).limit(2000);
      if (lRes.error) {
        if (/does not exist|schema cache/i.test(lRes.error.message || '')) S.missing = 'evento_privado_leads';
        else throw new Error('leads: ' + lRes.error.message);
      } else {
        S.leads = lRes.data || [];
      }
    }

    // --- Interações dos leads (feed de atividade, 60d) ---
    S.ints = [];
    if (!S.missing) {
      var since60 = new Date(Date.now() - 60 * DAY).toISOString();
      var iRes = await c.from('evento_privado_lead_interactions')
        .select('id, lead_id, tipo, descricao, occurred_at')
        .gte('occurred_at', since60)
        .order('occurred_at', { ascending: false }).limit(2000);
      // Ordena no client também: o feed agrupa por dia e uma ordem
      // diferente da esperada embaralharia os blocos de data.
      if (!iRes.error) {
        S.ints = (iRes.data || []).sort(function (a, b) { return (ms(b.occurred_at) || 0) - (ms(a.occurred_at) || 0); });
      }
    }

    // --- Eventos já fechados (financeiro = verdade sobre dinheiro) ---
    var msRes = await c.from('manual_sales')
      .select('id, customer_name, experience_name, sale_date, slot_date, created_at, quantity, ' +
              'total_amount_centavos, payout_amount_centavos, extra_payouts, payment_status, ' +
              'is_event, event_type, event_type_custom')
      .limit(20000);
    if (msRes.error) throw new Error('vendas: ' + msRes.error.message);
    S.eventos = (msRes.data || [])
      .filter(function (s) { return s.payment_status === 'pago' && isEventoSale(s); })
      .map(function (s) {
        var on = s.sale_date ? new Date(s.sale_date + 'T12:00:00').getTime() : ms(s.created_at);
        return {
          id: s.id,
          cliente: s.customer_name,
          experiencia: s.experience_name,
          occurredMs: on,
          dataEvento: s.slot_date,
          pessoas: num(s.quantity),
          tipo: s.event_type,
          tipoCustom: s.event_type_custom,
          total: num(s.total_amount_centavos),
          receita: saleReceita(s),
        };
      })
      .filter(function (s) { return s.occurredMs != null; });

    // --- CRM B2B (fila de prospecção) ---
    var pRes = await c.from('b2b_prospects')
      .select('id, nome, tipo_empresa, funcionarios_faixa, segmento, cidade, site, linkedin_empresa, ' +
              'contato_nome, contato_cargo, contato_email, contato_whatsapp, contato_linkedin, ' +
              'status_comercial, potencial, proxima_acao, proxima_acao_at')
      .limit(5000);
    S.prospects = pRes.error ? [] : (pRes.data || []);

    // --- Primeira abordagem por empresa (conta a meta de 30–50) ---
    // A meta cobra empresa NOVA: follow-up na mesma empresa não conta
    // de novo. Por isso guardamos o MENOR occurred_at por prospect.
    S.b2bFirst = {};
    var biRes = await c.from('b2b_prospect_interactions')
      .select('prospect_id, occurred_at')
      .eq('tipo', 'mensagem_enviada')
      .limit(20000);
    if (!biRes.error) {
      (biRes.data || []).forEach(function (r) {
        var t = ms(r.occurred_at);
        if (t == null) return;
        if (S.b2bFirst[r.prospect_id] == null || t < S.b2bFirst[r.prospect_id]) S.b2bFirst[r.prospect_id] = t;
      });
    }
  }

  // =============================================================
  // MÉTRICAS — histórico → metas → placar da semana
  // =============================================================

  // Baseline: o ritmo REAL dos últimos 90 dias. É daqui que a meta
  // nasce. Sem isso a meta vira número inventado, e número inventado
  // ou é fácil demais (não puxa nada) ou impossível (desmotiva).
  function computeBaseline() {
    var since90 = Date.now() - 90 * DAY;
    var since365 = Date.now() - 365 * DAY;
    var in90 = S.eventos.filter(function (e) { return e.occurredMs >= since90; });
    var in365 = S.eventos.filter(function (e) { return e.occurredMs >= since365; });

    var soma90 = in90.reduce(function (a, e) { return a + e.total; }, 0);
    var ticket90 = in90.length ? Math.round(soma90 / in90.length) : 0;
    var soma365 = in365.reduce(function (a, e) { return a + e.total; }, 0);
    var ticket365 = in365.length ? Math.round(soma365 / in365.length) : 0;

    // Menos de 5 eventos em 90 dias é amostra pequena demais pra
    // definir ticket — cai pro histórico de 12 meses.
    var ticket = (in90.length >= 5 ? ticket90 : (ticket365 || ticket90));

    // Por tipo (12 meses) — mostra qual vertente sustenta o resultado.
    var porTipo = {};
    in365.forEach(function (e) {
      var k = tipoLabel(e.tipo, e.tipoCustom);
      if (!porTipo[k]) porTipo[k] = { label: k, n: 0, total: 0, pessoas: 0 };
      porTipo[k].n++; porTipo[k].total += e.total; porTipo[k].pessoas += e.pessoas;
    });
    var tipos = Object.keys(porTipo).map(function (k) { return porTipo[k]; })
      .sort(function (a, b) { return b.total - a.total; });

    return {
      eventos90: in90.length,
      eventos365: in365.length,
      porSemana: in90.length / (90 / 7),
      ticket: ticket,
      ticket90: ticket90,
      ticket365: ticket365,
      faturamento90: soma90,
      tipos: tipos,
      amostraPequena: in90.length < 5,
    };
  }

  // Conversão orçamento → fechado (180d). Define quantos orçamentos
  // são necessários pra bater a meta de eventos. Sem histórico
  // suficiente usa 25%, que é uma régua conservadora de partida.
  function computeConversao() {
    var since = Date.now() - 180 * DAY;
    var base = S.leads.filter(function (l) {
      var t = ms(l.orcamento_enviado_at);
      return t != null && t >= since;
    });
    var fechados = base.filter(function (l) { return l.status === 'fechado'; }).length;
    if (base.length < 8) return { taxa: 0.25, estimada: true, base: base.length, fechados: fechados };
    return { taxa: Math.max(0.05, fechados / base.length), estimada: false, base: base.length, fechados: fechados };
  }

  // Metas: valor travado na config vence; senão sai do histórico.
  function computeMetas(baseline, conv) {
    var cfg = S.cfg || CFG_FALLBACK;
    var fator = num(cfg.fator_crescimento, 1.3) || 1.3;

    var eventosAuto = Math.max(1, Math.ceil(baseline.porSemana * fator));
    var eventos = cfg.meta_eventos_semana != null ? num(cfg.meta_eventos_semana) : eventosAuto;

    var receitaAuto = eventos * baseline.ticket;
    var receita = cfg.meta_receita_semana_centavos != null ? num(cfg.meta_receita_semana_centavos) : receitaAuto;

    var orcamentosAuto = Math.max(eventos, Math.ceil(eventos / conv.taxa));
    var orcamentos = cfg.meta_orcamentos_semana != null ? num(cfg.meta_orcamentos_semana) : orcamentosAuto;

    return {
      eventos: eventos,
      eventosAuto: eventosAuto,
      eventosTravada: cfg.meta_eventos_semana != null,
      receita: receita,
      receitaTravada: cfg.meta_receita_semana_centavos != null,
      orcamentos: orcamentos,
      orcamentosTravada: cfg.meta_orcamentos_semana != null,
      prospeccaoMin: num(cfg.meta_prospeccao_min, 30),
      prospeccaoMax: num(cfg.meta_prospeccao_max, 50),
      fator: fator,
    };
  }

  // Placar da semana corrente (segunda 00:00 → agora).
  function computeSemana() {
    var cfg = S.cfg || CFG_FALLBACK;
    var wStart = weekStart();
    var wEnd = wStart + 7 * DAY;
    var agora = Date.now();

    // --- Prospecção: empresas NOVAS abordadas nesta semana ---
    var prospeccao = 0;
    Object.keys(S.b2bFirst).forEach(function (pid) {
      var t = S.b2bFirst[pid];
      if (t >= wStart && t < wEnd) prospeccao++;
    });

    // --- Orçamentos enviados nesta semana ---
    var orcamentos = S.leads.filter(function (l) {
      var t = ms(l.orcamento_enviado_at);
      return t != null && t >= wStart && t < wEnd;
    }).length;

    // --- Eventos fechados nesta semana ---
    // Duas fontes possíveis (venda no financeiro e lead marcado como
    // fechado). Deduplicado por manual_sale_id pra um mesmo evento
    // não contar duas vezes quando as duas pontas estão ligadas.
    var fechadosMap = {};
    S.eventos.forEach(function (e) {
      if (e.occurredMs >= wStart && e.occurredMs < wEnd) {
        fechadosMap['ms:' + e.id] = { valor: e.total, fonte: 'venda' };
      }
    });
    S.leads.forEach(function (l) {
      if (l.status !== 'fechado') return;
      var t = ms(l.fechado_at);
      if (t == null || t < wStart || t >= wEnd) return;
      var key = l.manual_sale_id ? ('ms:' + l.manual_sale_id) : ('lead:' + l.id);
      if (fechadosMap[key]) return;   // já contado pela venda
      fechadosMap[key] = { valor: num(l.valor_fechado_centavos), fonte: 'lead' };
    });
    var fechadosKeys = Object.keys(fechadosMap);
    var receita = fechadosKeys.reduce(function (a, k) { return a + fechadosMap[k].valor; }, 0);

    // --- SLA de primeira resposta ---
    // Só entram leads que CHEGARAM nesta semana (medir resposta de
    // lead antigo distorce a semana).
    var slaHoras = num(cfg.sla_primeira_resposta_horas, 2);
    var daSemana = S.leads.filter(function (l) {
      var t = ms(l.lead_at);
      return t != null && t >= wStart && t < wEnd;
    });
    var respondidos = 0, noPrazo = 0, pendentes = 0, estourados = 0, somaMin = 0;
    daSemana.forEach(function (l) {
      var t0 = ms(l.lead_at);
      var t1 = ms(l.primeira_resposta_at);
      if (t1 != null) {
        respondidos++;
        var mins = bizMinutes(t0, t1, cfg);
        somaMin += mins;
        if (mins <= slaHoras * 60) noPrazo++;
      } else {
        pendentes++;
        var dl = bizDeadline(t0, slaHoras, cfg);
        if (dl != null && dl < agora) estourados++;
      }
    });

    return {
      inicio: wStart,
      prospeccao: prospeccao,
      orcamentos: orcamentos,
      eventos: fechadosKeys.length,
      receita: receita,
      leadsNovos: daSemana.length,
      slaRespondidos: respondidos,
      slaNoPrazo: noPrazo,
      slaPendentes: pendentes,
      slaEstourados: estourados,
      slaMediaMin: respondidos ? Math.round(somaMin / respondidos) : null,
      slaPct: respondidos ? Math.round((noPrazo / respondidos) * 100) : null,
    };
  }

  // =============================================================
  // FILA DO DIA — o que está fora do prazo AGORA
  // -------------------------------------------------------------
  // Três baldes, na ordem em que doem: sem primeira resposta →
  // sem orçamento → follow-up vencido. Um lead só aparece no balde
  // mais urgente em que se encaixa.
  // =============================================================
  function computeFila() {
    var cfg = S.cfg || CFG_FALLBACK;
    var agora = Date.now();
    var slaResp = num(cfg.sla_primeira_resposta_horas, 2);
    var slaOrc = num(cfg.sla_orcamento_horas, 24);

    var semResposta = [], semOrcamento = [], followup = [], eventoProximo = [];

    S.leads.forEach(function (l) {
      if (!isAberto(l.status)) return;
      var t0 = ms(l.lead_at);

      if (!l.primeira_resposta_at) {
        var dl = bizDeadline(t0, slaResp, cfg);
        semResposta.push({ lead: l, deadline: dl, atrasado: dl != null && dl < agora });
        return;
      }
      if (!l.orcamento_enviado_at) {
        var dlo = bizDeadline(ms(l.primeira_resposta_at), slaOrc, cfg);
        semOrcamento.push({ lead: l, deadline: dlo, atrasado: dlo != null && dlo < agora });
        return;
      }
      var fu = ms(l.proximo_followup_at);
      if (fu != null && fu <= agora + DAY) {
        followup.push({ lead: l, deadline: fu, atrasado: fu < agora });
      }
    });

    // Evento chegando em ≤ 14 dias com pipeline ainda aberto: é o
    // lead mais caro de perder, porque a data some.
    S.leads.forEach(function (l) {
      if (!isAberto(l.status) || !l.data_evento) return;
      var t = new Date(l.data_evento + 'T12:00:00').getTime();
      if (!isFinite(t)) return;
      var dias = Math.ceil((t - agora) / DAY);
      if (dias >= 0 && dias <= 14) eventoProximo.push({ lead: l, dias: dias, deadline: t });
    });

    function ordena(arr) {
      return arr.sort(function (a, b) {
        var av = a.deadline == null ? Infinity : a.deadline;
        var bv = b.deadline == null ? Infinity : b.deadline;
        return av - bv;
      });
    }
    return {
      semResposta: ordena(semResposta),
      semOrcamento: ordena(semOrcamento),
      followup: ordena(followup),
      eventoProximo: eventoProximo.sort(function (a, b) { return a.dias - b.dias; }),
    };
  }

  // Fila de prospecção: empresas que ainda não receberam a PRIMEIRA
  // abordagem. Ordenadas por potencial e porte (sweet spot 50–500
  // funcionários, que é onde o RH tem verba e time pra ação).
  function computeProspeccao() {
    var SWEET = { '50_100': 3, '101_250': 3, '251_500': 3, '500_plus': 2, '1_49': 1 };
    var POT = { alto: 3, medio: 2, baixo: 1 };
    return S.prospects
      .filter(function (p) {
        if (S.b2bFirst[p.id]) return false;                       // já abordada
        return p.status_comercial === 'nao_contatado';
      })
      .map(function (p) {
        var temCanal = !!(p.contato_whatsapp || p.contato_email);
        return {
          p: p,
          temCanal: temCanal,
          score: (POT[p.potencial] || 2) * 10 + (SWEET[p.funcionarios_faixa] || 1) * 3 + (temCanal ? 5 : 0),
        };
      })
      .sort(function (a, b) { return b.score - a.score; });
  }

  // =============================================================
  // RENDER — blocos visuais
  // =============================================================
  function bar(atual, meta, cor) {
    var pct = meta > 0 ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
    return '<div style="height:6px;background:#eee;border-radius:99px;overflow:hidden;margin-top:8px;">' +
             '<div style="height:100%;width:' + pct + '%;background:' + cor + ';border-radius:99px;transition:width .3s;"></div>' +
           '</div>';
  }
  function card(opts) {
    // opts: { label, valor, meta, sub, cor, pct }
    var cor = opts.cor || '#f0a05e';
    var ok = opts.metaNum != null && opts.atualNum != null && opts.atualNum >= opts.metaNum;
    return '<div style="background:#fff;border:1px solid ' + (ok ? '#bfe3cc' : '#eee') + ';border-radius:12px;padding:14px 16px;flex:1;min-width:190px;">' +
             '<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#999;font-weight:700;">' + esc(opts.label) + '</div>' +
             '<div style="font-size:1.5rem;font-weight:700;color:' + (ok ? '#1a8a4a' : '#333') + ';margin-top:4px;line-height:1.1;">' + opts.valor + '</div>' +
             (opts.meta ? '<div style="font-size:.78rem;color:#888;margin-top:2px;">' + opts.meta + '</div>' : '') +
             (opts.metaNum != null ? bar(opts.atualNum, opts.metaNum, ok ? '#1a8a4a' : cor) : '') +
             (opts.sub ? '<div style="font-size:.75rem;color:#aaa;margin-top:6px;line-height:1.4;">' + opts.sub + '</div>' : '') +
           '</div>';
  }
  function sectionTitle(t, sub, right) {
    return '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:26px 0 10px;">' +
             '<div>' +
               '<h2 style="margin:0;font-size:1.05rem;color:#333;">' + t + '</h2>' +
               (sub ? '<p style="margin:2px 0 0;font-size:.82rem;color:#999;max-width:70ch;line-height:1.5;">' + sub + '</p>' : '') +
             '</div>' +
             (right || '') +
           '</div>';
  }
  function pill(txt, cor, bg) {
    return '<span style="display:inline-block;padding:2px 8px;border-radius:99px;background:' + bg + ';color:' + cor +
           ';font-size:.72rem;font-weight:700;white-space:nowrap;">' + esc(txt) + '</span>';
  }
  function btn(label, attrs, style) {
    return '<button type="button" ' + attrs + ' style="padding:5px 10px;border-radius:6px;font-family:inherit;font-size:.78rem;font-weight:600;cursor:pointer;border:1px solid #ddd;background:#fff;color:#444;' + (style || '') + '">' + label + '</button>';
  }
  // attrs: atributos extras (data-*) pra que abrir o link também
  // dispare um registro — o clique que abre o WhatsApp é o mesmo que
  // marca a ação como feita, sem clique duplo.
  function linkBtn(label, href, style, title, attrs) {
    return '<a href="' + esc(href) + '" target="_blank" rel="noopener"' + (title ? ' title="' + esc(title) + '"' : '') +
           (attrs ? ' ' + attrs : '') +
           ' style="display:inline-block;padding:5px 10px;border-radius:6px;font-family:inherit;font-size:.78rem;font-weight:600;text-decoration:none;border:1px solid #ddd;background:#fff;color:#444;' + (style || '') + '">' + label + '</a>';
  }
  var BTN_WA = 'background:#e6f4ea;border-color:#1a8a4a;color:#1a8a4a;';
  var BTN_MAIL = 'background:#e6f0fa;border-color:#3068a8;color:#3068a8;';
  var BTN_OK = 'background:#1a8a4a;border-color:#1a8a4a;color:#fff;';
  var BTN_PRI = 'background:#f0a05e;border-color:#f0a05e;color:#fff;';

  function empty(txt) {
    return '<div style="padding:14px;border:1px dashed #e0e0e0;border-radius:10px;color:#aaa;font-size:.85rem;">' + txt + '</div>';
  }

  // ----- Mensagens prontas -----
  // Prospecção de RH focada em EVENTO (não em benefício genérico):
  // a pergunta é sobre a próxima data do calendário da empresa, que
  // é o gatilho real de compra.
  function msgProspeccao(p) {
    var cfg = S.cfg || CFG_FALLBACK;
    var quem = (cfg.responsavel_nome && String(cfg.responsavel_nome).trim()) || '';
    var contato = (p.contato_nome && String(p.contato_nome).split(' ')[0]) || '';
    var empresa = p.nome || 'vocês';
    return 'Oi' + (contato ? ' ' + contato : '') + ', tudo bem?\n\n' +
      (quem ? 'Sou ' + quem + ', da Elarah' : 'Aqui é da Elarah') +
      ' — a gente organiza experiências fechadas em São Paulo (cerâmica, coquetelaria, gastronomia, pintura) pra grupos de empresa.\n\n' +
      'Costumam usar pra confraternização, integração de time novo e datas do calendário interno. A gente cuida de tudo: local, fornecedor, material e condução.\n\n' +
      'A ' + empresa + ' tem alguma ação pro time nos próximos meses? Se fizer sentido, te mando um orçamento com 2 ou 3 formatos por faixa de pessoas — sem compromisso.';
  }
  function emailProspeccao(p) {
    return {
      assunto: 'Experiências fechadas pro time da ' + (p.nome || 'sua empresa') + ' — Elarah',
      corpo: msgProspeccao(p) + '\n\nSite: https://elarah.com.br',
    };
  }
  // Primeira resposta a quem pediu orçamento. O objetivo da primeira
  // mensagem não é vender: é confirmar data/pessoas, que é o que
  // trava o orçamento.
  function msgPrimeiraResposta(l) {
    var nome = (l.cliente_nome && String(l.cliente_nome).split(' ')[0]) || '';
    return 'Oi' + (nome ? ' ' + nome : '') + ', tudo bem? Aqui é da Elarah 💛\n\n' +
      'Que legal que pensou na gente pro seu ' + tipoLabel(l.tipo_evento, l.tipo_evento_custom).toLowerCase() + '!\n\n' +
      'Pra montar o orçamento certinho me confirma 3 coisas?\n' +
      '1. Data (ou período) do evento\n' +
      '2. Quantas pessoas mais ou menos\n' +
      '3. Se prefere aqui em um espaço nosso ou em um local de vocês\n\n' +
      'Com isso te mando as opções ainda hoje.';
  }
  function msgFollowup(l, n) {
    var nome = (l.cliente_nome && String(l.cliente_nome).split(' ')[0]) || '';
    if (n <= 1) {
      return 'Oi' + (nome ? ' ' + nome : '') + '! Só passando pra saber se o orçamento chegou direitinho 😊 ' +
             'Qualquer ajuste (data, número de pessoas, formato) eu remonto rapidinho.';
    }
    if (n === 2) {
      return 'Oi' + (nome ? ' ' + nome : '') + ', tudo bem? Sei que a correria é grande. ' +
             'Se quiser, seguro a data pra você por 48h enquanto decide — me avisa que já deixo reservado.';
    }
    return 'Oi' + (nome ? ' ' + nome : '') + '! Última mensagem pra não te encher 🙂 ' +
           'Se não for o momento, sem problema nenhum — me diz que eu guardo seu contato e te aviso quando abrir novas datas.';
  }

  // ----- Linha de lead reutilizada nas filas -----
  function leadLinha(l, prazoTxt, prazoCor, acoes) {
    var st = statusMeta(l.status);
    var canal = [];
    var wa = waLink(l.whatsapp, '');
    if (wa) canal.push(linkBtn('WhatsApp', wa, BTN_WA, 'Abrir conversa'));
    if (l.email) canal.push(linkBtn('E-mail', mailLink(l.email, 'Seu evento na Elarah', ''), BTN_MAIL));
    var det = [];
    if (l.data_evento) det.push('📅 ' + dShort(l.data_evento));
    if (l.pessoas) det.push('👥 ' + l.pessoas);
    if (l.valor_orcado_centavos) det.push('💰 ' + brl(l.valor_orcado_centavos));
    det.push(origemLabel(l.origem));

    return '<div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;padding:10px 12px;border:1px solid #eee;border-radius:10px;background:#fff;margin-bottom:8px;">' +
             '<div style="flex:1;min-width:220px;">' +
               '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
                 '<button type="button" data-ep-open="' + esc(l.id) + '" style="background:none;border:0;padding:0;font-family:inherit;font-size:.95rem;font-weight:700;color:#333;cursor:pointer;text-align:left;">' + esc(l.cliente_nome) + '</button>' +
                 pill(tipoLabel(l.tipo_evento, l.tipo_evento_custom), '#a4663b', '#fff8ef') +
                 pill(st.l, st.cor, st.bg) +
                 (prazoTxt ? pill(prazoTxt, '#fff', prazoCor) : '') +
               '</div>' +
               '<div style="font-size:.78rem;color:#999;margin-top:4px;">' + esc(det.join(' · ')) + '</div>' +
             '</div>' +
             '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' + canal.join('') + (acoes || '') + '</div>' +
           '</div>';
  }

  // =============================================================
  // BLOCO 1 — placar da semana
  // =============================================================
  function blocoPlacar(sem, metas, baseline, conv) {
    var fim = new Date(sem.inicio + 6 * DAY);
    var slaTxt = sem.slaPct == null ? '—' : sem.slaPct + '%';
    var slaSub = sem.slaRespondidos
      ? sem.slaNoPrazo + ' de ' + sem.slaRespondidos + ' no prazo · média ' + horasUteisTxt(sem.slaMediaMin)
      : 'nenhum lead novo respondido ainda';
    if (sem.slaPendentes) {
      slaSub += '<br><b style="color:' + (sem.slaEstourados ? '#b3261e' : '#a4663b') + ';">' +
                sem.slaPendentes + ' esperando' + (sem.slaEstourados ? ' · ' + sem.slaEstourados + ' fora do prazo' : '') + '</b>';
    }

    return '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">' +
             '<h2 style="margin:0;font-size:1.05rem;color:#333;">Placar da semana</h2>' +
             '<span style="font-size:.8rem;color:#aaa;">' + dShort(sem.inicio) + ' a ' + dShort(fim) + ' · atualiza sozinho</span>' +
           '</div>' +
           '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;">' +
             card({
               label: 'Empresas prospectadas',
               valor: String(sem.prospeccao),
               meta: 'meta ' + metas.prospeccaoMin + '–' + metas.prospeccaoMax + ' novas/semana',
               atualNum: sem.prospeccao, metaNum: metas.prospeccaoMin,
               sub: sem.prospeccao >= metas.prospeccaoMax
                 ? 'alvo cheio batido 🎉'
                 : 'faltam ' + Math.max(0, metas.prospeccaoMin - sem.prospeccao) + ' pro mínimo · ' +
                   Math.max(0, metas.prospeccaoMax - sem.prospeccao) + ' pro alvo cheio',
             }) +
             card({
               label: 'Orçamentos enviados',
               valor: String(sem.orcamentos),
               meta: 'meta ' + metas.orcamentos + '/semana',
               atualNum: sem.orcamentos, metaNum: metas.orcamentos,
               sub: 'conversão usada: ' + Math.round(conv.taxa * 100) + '%' + (conv.estimada ? ' (estimada)' : ''),
             }) +
             card({
               label: 'Eventos fechados',
               valor: String(sem.eventos),
               meta: 'meta ' + metas.eventos + '/semana',
               atualNum: sem.eventos, metaNum: metas.eventos,
               sub: metas.eventosTravada ? 'meta travada na mão' : 'meta calculada do histórico',
             }) +
             card({
               label: 'Receita fechada',
               valor: brl(sem.receita),
               meta: 'meta ' + brl(metas.receita),
               atualNum: sem.receita, metaNum: metas.receita,
               sub: 'ticket médio histórico ' + brl(baseline.ticket),
             }) +
             card({
               label: 'Resposta no prazo',
               valor: slaTxt,
               meta: 'SLA ' + num((S.cfg || CFG_FALLBACK).sla_primeira_resposta_horas, 2) + 'h úteis',
               atualNum: sem.slaPct, metaNum: sem.slaPct == null ? null : 100,
               cor: '#3068a8',
               sub: slaSub,
             }) +
           '</div>';
  }

  // =============================================================
  // BLOCO 2 — fila do dia
  // =============================================================
  function blocoFila(fila) {
    var cfg = S.cfg || CFG_FALLBACK;
    var html = sectionTitle('⏱️ Precisa de você agora',
      'Ordenado por quem estoura primeiro. Se esta lista está vazia, o dia está em dia — pode ir pra prospecção.');

    var total = fila.semResposta.length + fila.semOrcamento.length + fila.followup.length;
    if (!total && !fila.eventoProximo.length) {
      html += empty('Nada atrasado. 🎉 Nenhum lead esperando resposta, orçamento ou follow-up.');
      return html;
    }

    if (fila.semResposta.length) {
      html += '<div style="font-size:.82rem;font-weight:700;color:#b3261e;margin:12px 0 8px;">' +
                'Sem primeira resposta (' + fila.semResposta.length + ') — SLA ' +
                num(cfg.sla_primeira_resposta_horas, 2) + 'h úteis</div>';
      fila.semResposta.slice(0, 12).forEach(function (it) {
        var l = it.lead;
        var wa = waLink(l.whatsapp, msgPrimeiraResposta(l));
        var acoes = (wa
          ? linkBtn('Responder + marcar', wa, BTN_OK,
              'Abre o WhatsApp com a mensagem pronta e já marca a primeira resposta',
              'data-ep-mark="resposta" data-ep-id="' + esc(l.id) + '"')
          : '') +
          btn('✓ Respondi', 'data-ep-mark="resposta" data-ep-id="' + esc(l.id) + '"', BTN_OK);
        html += leadLinha(l,
          it.atrasado ? 'atrasado ' + rel(it.deadline) : 'vence ' + rel(it.deadline),
          it.atrasado ? '#b3261e' : '#a4663b',
          acoes);
      });
    }

    if (fila.semOrcamento.length) {
      html += '<div style="font-size:.82rem;font-weight:700;color:#a4663b;margin:16px 0 8px;">' +
                'Respondido mas sem orçamento (' + fila.semOrcamento.length + ') — prazo ' +
                num(cfg.sla_orcamento_horas, 24) + 'h úteis</div>';
      fila.semOrcamento.slice(0, 12).forEach(function (it) {
        html += leadLinha(it.lead,
          it.atrasado ? 'atrasado ' + rel(it.deadline) : 'vence ' + rel(it.deadline),
          it.atrasado ? '#b3261e' : '#a4663b',
          btn('📋 Enviei o orçamento', 'data-ep-mark="orcamento" data-ep-id="' + esc(it.lead.id) + '"', BTN_PRI));
      });
    }

    if (fila.followup.length) {
      html += '<div style="font-size:.82rem;font-weight:700;color:#3068a8;margin:16px 0 8px;">' +
                'Follow-up (' + fila.followup.length + ') — cadência D+' + (cfg.followup_dias || [1, 3, 7]).join(', D+') + '</div>';
      fila.followup.slice(0, 12).forEach(function (it) {
        var l = it.lead;
        var n = num(l.followups_count) + 1;
        var wa = waLink(l.whatsapp, msgFollowup(l, n));
        var acoes = (wa ? linkBtn('Follow-up ' + n + 'º', wa, BTN_WA, 'Abre o WhatsApp com a mensagem do ' + n + 'º toque') : '') +
                    btn('✓ Fiz o follow-up', 'data-ep-mark="followup" data-ep-id="' + esc(l.id) + '"', BTN_OK);
        html += leadLinha(l,
          it.atrasado ? 'atrasado ' + rel(it.deadline) : 'hoje/amanhã',
          it.atrasado ? '#b3261e' : '#3068a8',
          acoes);
      });
    }

    if (fila.eventoProximo.length) {
      html += '<div style="font-size:.82rem;font-weight:700;color:#7a4f00;margin:16px 0 8px;">' +
                '🔥 Evento em até 14 dias e ainda não fechou (' + fila.eventoProximo.length + ')</div>';
      fila.eventoProximo.slice(0, 8).forEach(function (it) {
        html += leadLinha(it.lead, 'evento em ' + it.dias + 'd', '#7a4f00',
          btn('🎉 Fechou', 'data-ep-mark="fechado" data-ep-id="' + esc(it.lead.id) + '"', BTN_OK) +
          btn('Perdeu', 'data-ep-mark="perdido" data-ep-id="' + esc(it.lead.id) + '"'));
      });
    }
    return html;
  }

  // =============================================================
  // BLOCO 3 — prospecção da semana
  // -------------------------------------------------------------
  // A fila que resolve "não sei por onde começar": empresa, contato
  // do RH e o canal já pronto. Clicar em WhatsApp/E-mail abre a
  // mensagem E registra a abordagem — a meta se preenche sozinha.
  // =============================================================
  function blocoProspeccao(prosp, sem, metas) {
    var falta = Math.max(0, metas.prospeccaoMin - sem.prospeccao);
    var right = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
      pill(sem.prospeccao + ' / ' + metas.prospeccaoMin + '–' + metas.prospeccaoMax + ' nesta semana',
           falta ? '#a4663b' : '#1a8a4a', falta ? '#fff8ef' : '#e6f4ea') +
      btn('Abrir CRM B2B completo', 'data-ep-goto="b2b-prospects"') +
    '</div>';

    var html = sectionTitle('🏢 Prospecção da semana',
      'Empresas que ainda <b>não receberam a primeira abordagem</b>, ordenadas por potencial e porte. ' +
      'Clicar em WhatsApp ou E-mail já registra a abordagem no CRM e conta na meta.', right);

    if (!prosp.length) {
      html += empty('Nenhuma empresa nova na fila. Cadastre mais empresas na aba <b>Prospecção B2B</b> — ' +
                    'sem estoque de lead, a meta de ' + metas.prospeccaoMin + '/semana não se sustenta.');
      return html;
    }

    var semCanal = prosp.filter(function (x) { return !x.temCanal; }).length;
    html += '<div class="admin__table-wrap"><table class="admin__table"><thead><tr>' +
              '<th>Empresa</th><th>Contato (RH/People)</th><th>Porte</th><th>Potencial</th><th style="width:230px;">Abordar</th>' +
            '</tr></thead><tbody>';

    var FAIXA = { '1_49': '1–49', '50_100': '50–100 ⭐', '101_250': '101–250 ⭐', '251_500': '251–500 ⭐', '500_plus': '500+' };
    prosp.slice(0, 20).forEach(function (x) {
      var p = x.p;
      var msg = msgProspeccao(p);
      var mail = emailProspeccao(p);
      var wa = waLink(p.contato_whatsapp, msg);
      var acoes = [];
      if (wa) {
        acoes.push(linkBtn('WhatsApp', wa, BTN_WA, 'Abre com a mensagem pronta e registra a abordagem',
          'data-ep-prospect="' + esc(p.id) + '"'));
      }
      if (p.contato_email) {
        acoes.push(linkBtn('E-mail', mailLink(p.contato_email, mail.assunto, mail.corpo), BTN_MAIL,
          'Abre o e-mail pronto e registra a abordagem', 'data-ep-prospect="' + esc(p.id) + '"'));
      }
      if (!wa && !p.contato_email) {
        var lk = linkedinPeople(p.linkedin_empresa);
        if (lk) acoes.push(linkBtn('Achar RH no LinkedIn', lk, 'background:#e1ecf7;border-color:#0a66c2;color:#0a66c2;',
          'Abre a aba Pessoas da empresa filtrada por RH/People'));
        acoes.push(btn('+ contato', 'data-ep-prospect-contato="' + esc(p.id) + '"',
          'border-style:dashed;color:#888;'));
      }
      acoes.push(btn('Registrei', 'data-ep-prospect-log="' + esc(p.id) + '"', 'color:#888;'));

      html += '<tr>' +
        '<td><b>' + esc(p.nome) + '</b>' +
          (p.segmento ? '<div style="font-size:.75rem;color:#aaa;">' + esc(p.segmento) + '</div>' : '') + '</td>' +
        '<td>' + (p.contato_nome ? esc(p.contato_nome) : '<span style="color:#c9a">sem contato</span>') +
          (p.contato_cargo ? '<div style="font-size:.75rem;color:#aaa;">' + esc(p.contato_cargo) + '</div>' : '') + '</td>' +
        '<td style="font-size:.8rem;color:#666;">' + esc(FAIXA[p.funcionarios_faixa] || '—') + '</td>' +
        '<td>' + (p.potencial === 'alto' ? pill('🔥 Alto', '#b3261e', '#fdecea')
                 : p.potencial === 'baixo' ? pill('Baixo', '#777', '#f1f1f1')
                 : pill('Médio', '#a4663b', '#fff8ef')) + '</td>' +
        '<td><div style="display:flex;gap:5px;flex-wrap:wrap;">' + acoes.join('') + '</div></td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';

    html += '<div style="font-size:.78rem;color:#aaa;margin-top:6px;">' +
      prosp.length + ' empresa(s) na fila' +
      (semCanal ? ' · <b>' + semCanal + ' sem WhatsApp nem e-mail</b> — achar o contato do RH é parte da prospecção' : '') +
      '</div>';
    return html;
  }

  // =============================================================
  // BLOCO 4 — pipeline de orçamentos
  // =============================================================
  function blocoPipeline() {
    var abertos = S.leads.filter(function (l) { return isAberto(l.status); });
    var fechados = S.leads.filter(function (l) { return !isAberto(l.status); }).slice(0, 15);

    var right = btn('+ Novo pedido de evento', 'data-ep-new="1"', BTN_PRI + 'padding:8px 14px;font-size:.85rem;');
    var html = sectionTitle('📋 Pipeline de orçamentos (' + abertos.length + ' abertos)',
      'Todo pedido de evento entra aqui — é o que alimenta o SLA, o follow-up e a conversão. ' +
      'Pedido que fica só no WhatsApp não aparece em lugar nenhum e some.', right);

    if (!abertos.length && !fechados.length) {
      html += empty('Nenhum pedido registrado ainda. Clique em <b>+ Novo pedido de evento</b> assim que alguém chamar pedindo orçamento — leva 20 segundos e é o que faz o painel existir.');
      return html;
    }

    if (abertos.length) {
      // Evento mais próximo primeiro: data que chega é prazo que não volta.
      abertos.sort(function (a, b) {
        var av = a.data_evento ? new Date(a.data_evento).getTime() : Infinity;
        var bv = b.data_evento ? new Date(b.data_evento).getTime() : Infinity;
        if (av !== bv) return av - bv;
        return (ms(b.lead_at) || 0) - (ms(a.lead_at) || 0);
      });
      html += '<div class="admin__table-wrap"><table class="admin__table"><thead><tr>' +
                '<th>Cliente</th><th>Tipo</th><th>Data do evento</th><th>Pessoas</th><th>Orçado</th>' +
                '<th>Status</th><th>Chegou</th><th>Próximo passo</th><th style="width:150px;"></th>' +
              '</tr></thead><tbody>';
      abertos.forEach(function (l) {
        var st = statusMeta(l.status);
        var passo = proximoPasso(l);
        html += '<tr>' +
          '<td><button type="button" data-ep-open="' + esc(l.id) + '" style="background:none;border:0;padding:0;font-family:inherit;font-size:.9rem;font-weight:700;color:#333;cursor:pointer;">' + esc(l.cliente_nome) + '</button>' +
            (l.empresa ? '<div style="font-size:.75rem;color:#aaa;">' + esc(l.empresa) + '</div>' : '') + '</td>' +
          '<td style="font-size:.82rem;">' + esc(tipoLabel(l.tipo_evento, l.tipo_evento_custom)) + '</td>' +
          '<td style="font-size:.82rem;">' + (l.data_evento ? dShort(l.data_evento) : '<span style="color:#c9a">a definir</span>') + '</td>' +
          '<td style="font-size:.82rem;">' + (l.pessoas || '—') + '</td>' +
          '<td style="font-size:.82rem;">' + (l.valor_orcado_centavos ? brl(l.valor_orcado_centavos) : '—') + '</td>' +
          '<td>' + pill(st.l, st.cor, st.bg) + '</td>' +
          '<td style="font-size:.78rem;color:#999;">' + rel(ms(l.lead_at)) + '</td>' +
          '<td style="font-size:.8rem;color:' + passo.cor + ';">' + esc(passo.txt) + '</td>' +
          '<td><div style="display:flex;gap:5px;flex-wrap:wrap;">' +
            btn('Abrir', 'data-ep-open="' + esc(l.id) + '"') +
            btn('🎉', 'data-ep-mark="fechado" data-ep-id="' + esc(l.id) + '" title="Marcar como fechado"', BTN_OK) +
          '</div></td>' +
        '</tr>';
      });
      html += '</tbody></table></div>';
    }

    if (fechados.length) {
      html += '<details style="margin-top:10px;"><summary style="cursor:pointer;font-size:.82rem;color:#888;">' +
              'Ver últimos ' + fechados.length + ' encerrados (fechados / perdidos)</summary>' +
              '<div class="admin__table-wrap" style="margin-top:8px;"><table class="admin__table"><thead><tr>' +
              '<th>Cliente</th><th>Tipo</th><th>Status</th><th>Valor</th><th>Motivo / obs</th><th></th>' +
              '</tr></thead><tbody>';
      fechados.forEach(function (l) {
        var st = statusMeta(l.status);
        html += '<tr>' +
          '<td>' + esc(l.cliente_nome) + '</td>' +
          '<td style="font-size:.82rem;">' + esc(tipoLabel(l.tipo_evento, l.tipo_evento_custom)) + '</td>' +
          '<td>' + pill(st.l, st.cor, st.bg) + '</td>' +
          '<td style="font-size:.82rem;">' + brl(l.valor_fechado_centavos || l.valor_orcado_centavos) + '</td>' +
          '<td style="font-size:.78rem;color:#999;">' + esc(l.motivo_perda || l.observacoes || '—') + '</td>' +
          '<td>' + btn('Abrir', 'data-ep-open="' + esc(l.id) + '"') + '</td>' +
        '</tr>';
      });
      html += '</tbody></table></div></details>';
    }
    return html;
  }

  // Próximo passo textual de um lead aberto — o painel diz o que
  // fazer, em vez de deixar a pessoa decidir a prioridade sozinha.
  function proximoPasso(l) {
    var cfg = S.cfg || CFG_FALLBACK;
    var agora = Date.now();
    if (!l.primeira_resposta_at) {
      var dl = bizDeadline(ms(l.lead_at), num(cfg.sla_primeira_resposta_horas, 2), cfg);
      return { txt: 'Responder (' + (dl && dl < agora ? 'atrasado ' : 'vence ') + rel(dl) + ')', cor: dl && dl < agora ? '#b3261e' : '#a4663b' };
    }
    if (!l.orcamento_enviado_at) {
      var dlo = bizDeadline(ms(l.primeira_resposta_at), num(cfg.sla_orcamento_horas, 24), cfg);
      return { txt: 'Enviar orçamento (' + (dlo && dlo < agora ? 'atrasado ' : 'vence ') + rel(dlo) + ')', cor: dlo && dlo < agora ? '#b3261e' : '#a4663b' };
    }
    var fu = ms(l.proximo_followup_at);
    if (fu != null) {
      return { txt: (num(l.followups_count) + 1) + 'º follow-up ' + rel(fu), cor: fu < agora ? '#b3261e' : '#3068a8' };
    }
    var maxFu = num(cfg.followups_max, 3);
    if (num(l.followups_count) >= maxFu) {
      return { txt: 'Cadência esgotada — decidir: negociar ou encerrar', cor: '#7a4f00' };
    }
    return { txt: 'Definir próximo toque', cor: '#999' };
  }

  // =============================================================
  // BLOCO 5 — as regras do jogo
  // -------------------------------------------------------------
  // Escritas a partir da config, não chumbadas no código: mudar a
  // régua é mudar o texto que as duas leem. Regra que mora só na
  // cabeça de alguém não é regra, é expectativa — e expectativa não
  // combinada é o que gera briga depois.
  // =============================================================
  function blocoRegras(metas, conv) {
    var cfg = S.cfg || CFG_FALLBACK;
    var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    var dias = (Array.isArray(cfg.expediente_dias) ? cfg.expediente_dias : [1, 2, 3, 4, 5, 6]).map(function (d) { return DIAS[d] || d; });
    var fu = Array.isArray(cfg.followup_dias) ? cfg.followup_dias : [1, 3, 7];

    var regras = [
      {
        i: '⏱️',
        t: 'Responder em até ' + num(cfg.sla_primeira_resposta_horas, 2) + 'h úteis',
        d: 'Vale pra qualquer pedido de evento, em qualquer canal. O relógio só corre no expediente (' +
           dias.join(', ') + ', ' + String(cfg.expediente_inicio).slice(0, 5) + '–' + String(cfg.expediente_fim).slice(0, 5) + '): ' +
           'mensagem que chega 22h começa a contar na abertura do dia seguinte — <b>não precisa responder fora do horário</b>.',
      },
      {
        i: '📋',
        t: 'Orçamento em até ' + num(cfg.sla_orcamento_horas, 24) + 'h úteis',
        d: 'Contado a partir da primeira conversa. Se faltar informação pra fechar o valor, vale mandar uma <b>faixa de preço</b> dentro do prazo — o que não pode é o cliente ficar sem número.',
      },
      {
        i: '🔁',
        t: 'Follow-up em D+' + fu.join(', D+') + ' — ' + num(cfg.followups_max, 3) + ' toques',
        d: 'Contados do envio do orçamento. Esgotou a cadência sem retorno, o lead vira <b>“sem resposta”</b> e sai do pipeline. Não é desistir: é parar de perseguir quem não respondeu e liberar tempo pra quem respondeu.',
      },
      {
        i: '🏢',
        t: metas.prospeccaoMin + ' a ' + metas.prospeccaoMax + ' empresas novas por semana',
        d: 'Empresa <b>nova</b> — follow-up na mesma empresa não conta de novo. ' + metas.prospeccaoMin + ' é o mínimo aceitável, ' + metas.prospeccaoMax + ' é o alvo cheio. Prospecção é a única frente que não depende de ninguém chegar sozinho.',
      },
      {
        i: '📥',
        t: 'Pedido registrado no mesmo dia',
        d: 'Todo pedido de evento entra no pipeline no dia em que chega, mesmo o que parece frio. O que não está registrado não tem prazo, não entra na conversão e não aparece na conversa de sexta.',
      },
      {
        i: '🎯',
        t: metas.eventos + ' evento(s) e ' + brl(metas.receita) + ' por semana',
        d: metas.eventosTravada
             ? 'Meta travada na mão na configuração.'
             : 'Meta calculada do histórico real: ritmo dos últimos 90 dias × fator ' + metas.fator + '. Com conversão de ' +
               Math.round(conv.taxa * 100) + '%, precisa de <b>' + metas.orcamentos + ' orçamentos</b> na semana pra sustentar.',
      },
      {
        i: '🔥',
        t: 'Evento a menos de 14 dias vem antes de tudo',
        d: 'Data que chega é prazo que não volta. Lead com evento próximo e sem fechamento sobe pro topo da fila automaticamente.',
      },
      {
        i: '📝',
        t: 'Perdeu? Registrar o motivo',
        d: 'Preço, data indisponível, sumiu, escolheu concorrente. Sem o motivo a gente repete o mesmo erro seis vezes antes de perceber que é sempre o mesmo.',
      },
    ];

    var right = btn('⚙️ Editar regras e metas', 'data-ep-cfg="1"', 'padding:8px 14px;font-size:.85rem;');
    var html = sectionTitle('📐 As regras do jogo',
      'Combinado escrito, valendo pras duas. Muda aqui e muda pra todo mundo — inclusive os prazos que o painel cobra.', right);

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
    regras.forEach(function (r) {
      html += '<div style="background:#fff;border:1px solid #eee;border-radius:10px;padding:12px 14px;">' +
                '<div style="font-size:.9rem;font-weight:700;color:#333;">' + r.i + ' ' + r.t + '</div>' +
                '<div style="font-size:.8rem;color:#777;line-height:1.55;margin-top:5px;">' + r.d + '</div>' +
              '</div>';
    });
    html += '</div>';
    if (cfg.observacoes) {
      html += '<div style="margin-top:10px;padding:12px 14px;background:#fff8ef;border:1px solid #f0c97a;border-radius:10px;font-size:.83rem;color:#7a4f00;white-space:pre-wrap;line-height:1.55;">' +
              esc(cfg.observacoes) + '</div>';
    }
    return html;
  }

  // =============================================================
  // BLOCO 6 — de onde vem a meta
  // -------------------------------------------------------------
  // Meta sem origem vira discussão de opinião. Aqui a conta fica
  // aberta: estes são os eventos que a Elarah já fechou.
  // =============================================================
  function blocoHistorico(baseline, conv, metas) {
    var html = sectionTitle('📊 De onde vem a meta',
      'Números reais do financeiro — nenhuma meta aqui é chutada. ' +
      'Pra conferir na mão: <code style="font-size:.78rem;">sql/elarah_eventos_privados_baseline.sql</code>.');

    if (!baseline.eventos365) {
      html += empty('Ainda não há evento pago registrado no financeiro. Enquanto não houver histórico, a meta fica no mínimo de 1 evento/semana — assim que as primeiras vendas entrarem, ela se ajusta sozinha.');
      return html;
    }

    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
      card({ label: 'Eventos (90 dias)', valor: String(baseline.eventos90),
             sub: 'ritmo atual: <b>' + (Math.round(baseline.porSemana * 100) / 100) + '</b> por semana' }) +
      card({ label: 'Eventos (12 meses)', valor: String(baseline.eventos365) }) +
      card({ label: 'Ticket médio', valor: brl(baseline.ticket),
             sub: baseline.amostraPequena
               ? 'poucos eventos em 90 dias — usando a média de 12 meses'
               : '90 dias · 12 meses: ' + brl(baseline.ticket365) }) +
      card({ label: 'Faturamento (90 dias)', valor: brl(baseline.faturamento90) }) +
      card({ label: 'Conversão orçamento→fechado', valor: Math.round(conv.taxa * 100) + '%',
             sub: conv.estimada
               ? 'estimativa inicial (' + conv.base + ' orçamento(s) no histórico — precisa de 8 pra medir de verdade)'
               : conv.fechados + ' fechados em ' + conv.base + ' orçamentos (180 dias)' }) +
    '</div>';

    html += '<div style="margin-top:12px;padding:12px 14px;background:#f7f7f7;border-radius:10px;font-size:.83rem;color:#666;line-height:1.6;">' +
      '<b>A conta da meta:</b> ' + baseline.eventos90 + ' eventos em 90 dias = ' +
      (Math.round(baseline.porSemana * 100) / 100) + '/semana × fator ' + metas.fator + ' = ' +
      '<b>' + metas.eventosAuto + ' evento(s)/semana</b>. A ' + Math.round(conv.taxa * 100) + '% de conversão, ' +
      'isso exige <b>' + metas.orcamentos + ' orçamentos</b> — e, pra alimentar esses orçamentos, a régua de ' +
      metas.prospeccaoMin + '–' + metas.prospeccaoMax + ' empresas novas por semana.' +
      (metas.eventosTravada || metas.receitaTravada || metas.orcamentosTravada
        ? '<br><span style="color:#a4663b;">Alguma meta está travada na mão na configuração — o número exibido no placar é o travado.</span>'
        : '') +
    '</div>';

    if (baseline.tipos.length) {
      html += '<div class="admin__table-wrap" style="margin-top:12px;"><div class="admin__table-header">' +
              '<span class="admin__table-title">Por tipo de evento (12 meses)</span>' +
              '<span class="admin__table-count">onde o dinheiro realmente está</span></div>' +
              '<table class="admin__table"><thead><tr>' +
              '<th>Tipo</th><th>Eventos</th><th>Pessoas/evento</th><th>Ticket médio</th><th>Faturamento</th>' +
              '</tr></thead><tbody>';
      baseline.tipos.forEach(function (t) {
        html += '<tr>' +
          '<td><b>' + esc(t.label) + '</b></td>' +
          '<td>' + t.n + '</td>' +
          '<td>' + (t.n ? Math.round((t.pessoas / t.n) * 10) / 10 : '—') + '</td>' +
          '<td>' + brl(t.n ? Math.round(t.total / t.n) : 0) + '</td>' +
          '<td><b>' + brl(t.total) + '</b></td>' +
        '</tr>';
      });
      html += '</tbody></table></div>';
    }
    return html;
  }

  // =============================================================
  // BLOCO 7 — atividade dos últimos 7 dias
  // -------------------------------------------------------------
  // O "o que ela fez esta semana" pra conversa de sexta: sai do
  // registro do próprio trabalho, não de um relatório escrito à mão.
  // =============================================================
  function blocoAtividade(sem) {
    var since = Date.now() - 7 * DAY;
    var leadById = {};
    S.leads.forEach(function (l) { leadById[l.id] = l; });
    var recentes = S.ints.filter(function (i) { var t = ms(i.occurred_at); return t != null && t >= since; });

    var html = sectionTitle('🗒️ Atividade dos últimos 7 dias',
      'Registro do que aconteceu, na ordem. Serve pra conversa de fechamento da semana — ' +
      'sem precisar reconstruir de memória o que foi feito.');

    var resumo = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;">' +
      card({ label: 'Empresas abordadas (semana)', valor: String(sem.prospeccao) }) +
      card({ label: 'Leads novos (semana)', valor: String(sem.leadsNovos) }) +
      card({ label: 'Orçamentos (semana)', valor: String(sem.orcamentos) }) +
      card({ label: 'Ações registradas (7 dias)', valor: String(recentes.length) }) +
    '</div>';

    if (!recentes.length) {
      return html + resumo + empty('Nenhuma interação registrada nos últimos 7 dias. As ações da fila (responder, enviar orçamento, follow-up) registram sozinhas.');
    }

    var porDia = {};
    recentes.forEach(function (i) {
      var d = new Date(ms(i.occurred_at));
      var k = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      if (!porDia[k]) porDia[k] = [];
      porDia[k].push(i);
    });

    html += resumo + '<div style="background:#fff;border:1px solid #eee;border-radius:10px;padding:6px 14px 12px;">';
    Object.keys(porDia).forEach(function (k) {
      html += '<div style="font-size:.78rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.04em;margin:12px 0 6px;">' + esc(k) + '</div>';
      porDia[k].forEach(function (i) {
        var l = leadById[i.lead_id];
        html += '<div style="display:flex;gap:8px;align-items:baseline;font-size:.83rem;color:#555;padding:3px 0;line-height:1.5;">' +
                  '<span style="color:#bbb;font-size:.75rem;min-width:42px;">' +
                    new Date(ms(i.occurred_at)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
                  '<span>' + esc(intLabel(i.tipo)) + '</span>' +
                  '<b style="color:#333;">' + esc(l ? l.cliente_nome : '—') + '</b>' +
                  (i.descricao ? '<span style="color:#999;">— ' + esc(i.descricao) + '</span>' : '') +
                '</div>';
      });
    });
    html += '</div>';
    return html;
  }

  // Aviso de migration pendente — a aba abre e explica em vez de
  // quebrar com erro cru do Postgres.
  function avisoMigration() {
    return '<div style="padding:14px 16px;background:#fff8ef;border:1px solid #f0c97a;border-radius:10px;margin-bottom:16px;font-size:.87rem;color:#7a4f00;line-height:1.6;">' +
      '<b>Falta rodar a migration.</b> A tabela <code>' + esc(S.missing) + '</code> ainda não existe no banco. ' +
      'Abra o SQL Editor do Supabase e rode <code>sql/elarah_eventos_privados_comercial.sql</code>. ' +
      'Enquanto isso, o painel mostra o histórico de eventos e a fila de prospecção (que já existem), ' +
      'mas o pipeline de orçamentos e as regras salvas ficam indisponíveis.' +
    '</div>';
  }

  // =============================================================
  // RENDER PRINCIPAL
  // =============================================================
  function render() {
    var root = el('evtpriv-root');
    if (!root) return;
    var baseline = computeBaseline();
    var conv = computeConversao();
    var metas = computeMetas(baseline, conv);
    var sem = computeSemana();

    var html = '';
    if (S.missing) html += avisoMigration();
    html += blocoPlacar(sem, metas, baseline, conv);
    if (!S.missing) html += blocoFila(computeFila());
    html += blocoProspeccao(computeProspeccao(), sem, metas);
    if (!S.missing) html += blocoPipeline();
    html += blocoRegras(metas, conv);
    html += blocoHistorico(baseline, conv, metas);
    if (!S.missing) html += blocoAtividade(sem);
    root.innerHTML = html;
  }

  // =============================================================
  // AÇÕES — cada clique vira registro no banco
  // =============================================================
  function parseMoney(txt) {
    var s = String(txt == null ? '' : txt).trim().replace(/[R$\s]/g, '');
    if (!s) return null;
    // "1.500,00" (BR) e "1500.00" (digitado direto) — o separador
    // decimal é o ÚLTIMO símbolo que aparece.
    if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    if (!isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }
  function addDays(baseMs, dias) { return new Date(baseMs + dias * DAY).toISOString(); }

  async function logInteracao(leadId, tipo, descricao) {
    var c = sb();
    if (!c || S.missing) return;
    await c.from('evento_privado_lead_interactions').insert({
      lead_id: leadId, tipo: tipo, descricao: descricao || null,
    });
  }

  async function markAction(id, kind) {
    var c = sb();
    if (!c) return;
    var l = S.leads.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    var cfg = S.cfg || CFG_FALLBACK;
    var agora = Date.now();
    var nowISO = new Date(agora).toISOString();
    var fu = Array.isArray(cfg.followup_dias) && cfg.followup_dias.length ? cfg.followup_dias : [1, 3, 7];
    var patch = null, intTipo = null, intDesc = null;

    if (kind === 'resposta') {
      if (l.primeira_resposta_at) return;             // já marcado — clique repetido não reescreve o histórico
      patch = { primeira_resposta_at: nowISO };
      if (l.status === 'novo') patch.status = 'respondido';
      intTipo = 'primeiro_contato';
      intDesc = 'Primeira resposta em ' + horasUteisTxt(bizMinutes(ms(l.lead_at), agora, cfg));

    } else if (kind === 'orcamento') {
      patch = {
        orcamento_enviado_at: nowISO,
        status: 'orcamento_enviado',
        proximo_followup_at: addDays(agora, num(fu[0], 1)),
      };
      // Não dá pra ter orçamento sem ter respondido: se a primeira
      // resposta não foi marcada, ela aconteceu agora.
      if (!l.primeira_resposta_at) patch.primeira_resposta_at = nowISO;
      intTipo = 'orcamento_enviado';

    } else if (kind === 'followup') {
      var n = num(l.followups_count) + 1;
      patch = { followups_count: n, ultimo_followup_at: nowISO };
      // Próximo toque da cadência; esgotou, o lead sai da fila e vira
      // decisão consciente (negociar ou encerrar) em vez de zumbi.
      var prox = fu[n];
      if (prox != null && n < num(cfg.followups_max, 3)) {
        // Cadência ancorada no envio do orçamento. Se o toque foi feito
        // atrasado, a data seguinte cairia no passado e a fila pediria
        // dois toques no mesmo dia — por isso o piso de +1 dia.
        var alvo = (ms(l.orcamento_enviado_at) || agora) + num(prox, 3) * DAY;
        patch.proximo_followup_at = new Date(Math.max(alvo, agora + DAY)).toISOString();
      } else {
        patch.proximo_followup_at = null;
      }
      intTipo = 'follow_up';
      intDesc = n + 'º toque';

    } else if (kind === 'fechado') {
      var sug = l.valor_fechado_centavos || l.valor_orcado_centavos;
      var v = prompt('Fechou! 🎉 Valor final do evento (R$):', sug ? (sug / 100).toFixed(2).replace('.', ',') : '');
      if (v === null) return;
      var cent = parseMoney(v);
      if (cent == null) { alert('Valor inválido. Use algo como 1500 ou 1.500,00.'); return; }
      patch = { status: 'fechado', fechado_at: nowISO, valor_fechado_centavos: cent, proximo_followup_at: null };
      intTipo = 'fechado';
      intDesc = brl(cent);

    } else if (kind === 'perdido') {
      var motivo = prompt('Por que perdeu? (preço, data indisponível, sumiu, concorrente…)', l.motivo_perda || '');
      if (motivo === null) return;
      patch = { status: 'perdido', motivo_perda: motivo || null, proximo_followup_at: null };
      intTipo = 'perdido';
      intDesc = motivo || null;
    }
    if (!patch) return;

    var upd = await c.from('evento_privado_leads').update(patch).eq('id', id);
    if (upd.error) { alert('Erro ao salvar: ' + upd.error.message); return; }
    if (intTipo) await logInteracao(id, intTipo, intDesc);
    await run();
  }

  // Registrar abordagem de empresa no CRM B2B — é o clique que faz a
  // meta de prospecção andar.
  async function logProspect(id) {
    var c = sb();
    if (!c) return;
    if (S.b2bFirst[id]) return;   // já abordada: não conta duas vezes
    var ins = await c.from('b2b_prospect_interactions').insert({
      prospect_id: id, tipo: 'mensagem_enviada',
      descricao: 'Abordagem de eventos (aba Eventos privados)',
    });
    if (ins.error) { alert('Erro ao registrar: ' + ins.error.message); return; }
    var p = S.prospects.filter(function (x) { return x.id === id; })[0];
    if (p && p.status_comercial === 'nao_contatado') {
      await c.from('b2b_prospects').update({ status_comercial: 'mensagem_enviada' }).eq('id', id);
    }
    await run();
  }

  // Completar contato do RH sem sair da fila (o gargalo mais comum
  // da prospecção é "empresa cadastrada, contato não").
  async function quickContato(id) {
    var c = sb();
    if (!c) return;
    var p = S.prospects.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var wa = prompt('WhatsApp do contato em ' + p.nome + ' (deixe vazio pra pular):', p.contato_whatsapp || '');
    if (wa === null) return;
    var mail = prompt('E-mail do contato em ' + p.nome + ' (deixe vazio pra pular):', p.contato_email || '');
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
    await run();
  }

  // Delegação única no root — sobrevive a todo re-render.
  function wireRoot() {
    var root = el('evtpriv-root');
    if (!root || root.dataset.epWired) return;
    root.dataset.epWired = '1';
    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-ep-open],[data-ep-new],[data-ep-cfg],[data-ep-goto],[data-ep-mark],[data-ep-prospect],[data-ep-prospect-log],[data-ep-prospect-contato]');
      if (!t) return;
      // Links (WhatsApp/e-mail) precisam abrir normalmente: o registro
      // roda em paralelo, sem preventDefault.
      var isLink = t.tagName === 'A';
      if (!isLink) ev.preventDefault();

      if (t.hasAttribute('data-ep-open')) return openLeadModal(t.getAttribute('data-ep-open'));
      if (t.hasAttribute('data-ep-new')) return openLeadModal(null);
      if (t.hasAttribute('data-ep-cfg')) return openCfgModal();
      if (t.hasAttribute('data-ep-goto')) {
        var panel = t.getAttribute('data-ep-goto');
        if (window._adminNavigateToPanel) window._adminNavigateToPanel(panel);
        return;
      }
      if (t.hasAttribute('data-ep-mark')) return void markAction(t.getAttribute('data-ep-id'), t.getAttribute('data-ep-mark'));
      if (t.hasAttribute('data-ep-prospect')) return void logProspect(t.getAttribute('data-ep-prospect'));
      if (t.hasAttribute('data-ep-prospect-log')) return void logProspect(t.getAttribute('data-ep-prospect-log'));
      if (t.hasAttribute('data-ep-prospect-contato')) return void quickContato(t.getAttribute('data-ep-prospect-contato'));
    });
  }

  // =============================================================
  // MODAIS
  // =============================================================
  function pad2(n) { return String(n).padStart(2, '0'); }
  function toLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
           'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function fromLocalInput(v) {
    if (!v) return null;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
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
    m.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:720px;width:100%;padding:24px;font-family:inherit;margin:auto;">' + html + '</div>';
    m.style.display = 'flex';
  }
  function closeModal() {
    var m = el('evtpriv-modal');
    if (m) { m.style.display = 'none'; m.innerHTML = ''; }
  }
  function fieldWrap(label, inner, full) {
    return '<label style="font-size:.8rem;font-weight:600;color:#444;' + (full ? 'grid-column:1/-1;' : '') + '">' + label +
           inner + '</label>';
  }
  var INP = 'margin-top:4px;width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-family:inherit;font-size:.88rem;box-sizing:border-box;';
  var SEL = INP + 'background:#fff;';

  function selectHtml(id, opts, val, vazio, extraStyle) {
    var h = '<select id="' + id + '" style="' + SEL + (extraStyle || '') + '">';
    if (vazio) h += '<option value="">' + esc(vazio) + '</option>';
    opts.forEach(function (o) {
      h += '<option value="' + esc(o.v) + '"' + (o.v === val ? ' selected' : '') + '>' + esc(o.l) + '</option>';
    });
    return h + '</select>';
  }

  // ----- Modal do lead -----
  function openLeadModal(id) {
    if (S.missing) { alert('Rode antes a migration sql/elarah_eventos_privados_comercial.sql.'); return; }
    var l = id ? (S.leads.filter(function (x) { return x.id === id; })[0] || null) : null;
    var novo = !l;
    if (!l) {
      l = { status: 'novo', origem: 'whatsapp', lead_at: new Date().toISOString(),
            responsavel: (S.cfg && S.cfg.responsavel_nome) || '' };
    }
    var money = function (c) { return c == null ? '' : (c / 100).toFixed(2).replace('.', ','); };

    var timeline = '';
    if (!novo) {
      var ints = S.ints.filter(function (i) { return i.lead_id === l.id; });
      timeline =
        '<div style="border-top:1px solid #eee;margin-top:18px;padding-top:14px;">' +
          '<h3 style="margin:0 0 8px;font-size:.92rem;color:#444;">Timeline</h3>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
            selectHtml('ep-int-tipo', INT_TIPOS, 'observacao', null, 'width:auto;margin-top:0;') +
            '<input type="text" id="ep-int-desc" placeholder="O que aconteceu (opcional)" style="' + INP + 'flex:1;min-width:180px;margin-top:0;">' +
            '<button type="button" id="ep-int-add" style="padding:8px 14px;background:#f0a05e;color:#fff;border:0;border-radius:6px;font-family:inherit;font-size:.85rem;font-weight:600;cursor:pointer;">Registrar</button>' +
          '</div>' +
          '<div style="max-height:180px;overflow-y:auto;font-size:.83rem;color:#555;">' +
            (ints.length ? ints.map(function (i) {
              return '<div style="padding:4px 0;border-bottom:1px solid #f4f4f4;">' +
                     '<span style="color:#bbb;">' + dTime(i.occurred_at) + '</span> · ' + esc(intLabel(i.tipo)) +
                     (i.descricao ? ' — ' + esc(i.descricao) : '') + '</div>';
            }).join('') : '<span style="color:#bbb;">Sem registros nos últimos 60 dias.</span>') +
          '</div>' +
        '</div>';
    }

    openModal(
      '<h2 style="margin:0 0 4px;font-size:1.25rem;">' + (novo ? 'Novo pedido de evento' : esc(l.cliente_nome)) + '</h2>' +
      '<p style="margin:0 0 16px;font-size:.83rem;color:#888;">' +
        (novo ? 'Registre assim que a pessoa chamar — é o que liga o cronômetro do SLA.'
              : 'Chegou ' + rel(ms(l.lead_at)) + ' · ' + origemLabel(l.origem)) + '</p>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Cliente</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        fieldWrap('Nome *', '<input type="text" id="ep-nome" required value="' + esc(l.cliente_nome || '') + '" style="' + INP + '">') +
        fieldWrap('Empresa (se corporativo)', '<input type="text" id="ep-empresa" value="' + esc(l.empresa || '') + '" style="' + INP + '">') +
        fieldWrap('WhatsApp', '<input type="tel" id="ep-whats" placeholder="(11) 99999-9999" value="' + esc(l.whatsapp || '') + '" style="' + INP + '">') +
        fieldWrap('E-mail', '<input type="email" id="ep-email" value="' + esc(l.email || '') + '" style="' + INP + '">') +
      '</div>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">O evento</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        fieldWrap('Tipo', selectHtml('ep-tipo', TIPOS, l.tipo_evento, '—')) +
        fieldWrap('Se “Outro”, qual', '<input type="text" id="ep-tipo-custom" value="' + esc(l.tipo_evento_custom || '') + '" style="' + INP + '">') +
        fieldWrap('Data do evento', '<input type="date" id="ep-data" value="' + esc(l.data_evento || '') + '" style="' + INP + '">') +
        fieldWrap('Pessoas', '<input type="number" min="1" id="ep-pessoas" value="' + esc(l.pessoas || '') + '" style="' + INP + '">') +
        fieldWrap('Experiência de interesse', '<input type="text" id="ep-exp" placeholder="cerâmica, coquetelaria…" value="' + esc(l.experiencia_interesse || '') + '" style="' + INP + '">') +
        fieldWrap('Origem', selectHtml('ep-origem', ORIGENS, l.origem || 'outro')) +
      '</div>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Funil e prazos</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px;">' +
        fieldWrap('Status', selectHtml('ep-status', STATUS, l.status || 'novo')) +
        fieldWrap('Responsável', '<input type="text" id="ep-resp" value="' + esc(l.responsavel || '') + '" style="' + INP + '">') +
        fieldWrap('Valor orçado (R$)', '<input type="text" id="ep-orcado" value="' + esc(money(l.valor_orcado_centavos)) + '" style="' + INP + '">') +
        fieldWrap('Valor fechado (R$)', '<input type="text" id="ep-fechado" value="' + esc(money(l.valor_fechado_centavos)) + '" style="' + INP + '">') +
        fieldWrap('Chegou em', '<input type="datetime-local" id="ep-lead-at" value="' + esc(toLocalInput(l.lead_at)) + '" style="' + INP + '">') +
        fieldWrap('1ª resposta', '<input type="datetime-local" id="ep-resp-at" value="' + esc(toLocalInput(l.primeira_resposta_at)) + '" style="' + INP + '">') +
        fieldWrap('Orçamento enviado', '<input type="datetime-local" id="ep-orc-at" value="' + esc(toLocalInput(l.orcamento_enviado_at)) + '" style="' + INP + '">') +
        fieldWrap('Próximo follow-up', '<input type="datetime-local" id="ep-fu-at" value="' + esc(toLocalInput(l.proximo_followup_at)) + '" style="' + INP + '">') +
        fieldWrap('Motivo da perda', '<input type="text" id="ep-motivo" value="' + esc(l.motivo_perda || '') + '" style="' + INP + '">', true) +
        fieldWrap('Observações', '<textarea id="ep-obs" rows="3" style="' + INP + 'resize:vertical;">' + esc(l.observacoes || '') + '</textarea>', true) +
      '</div>' +
      '<p style="font-size:.75rem;color:#aaa;margin:0 0 6px;line-height:1.5;">' +
        '“Chegou em” é quando a pessoa <b>mandou mensagem</b>, não quando você cadastrou — é dele que sai o prazo de resposta.' +
      '</p>' +

      timeline +
      '<div id="ep-modal-msg" style="font-size:.85rem;margin-top:10px;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;">' +
        '<button type="button" id="ep-cancel" style="padding:9px 16px;background:#fff;border:1px solid #ccc;border-radius:6px;font-family:inherit;font-size:.9rem;cursor:pointer;">Fechar</button>' +
        (novo ? '' : '<button type="button" id="ep-delete" style="padding:9px 16px;background:#fff;border:1px solid #c0392b;color:#c0392b;border-radius:6px;font-family:inherit;font-size:.9rem;cursor:pointer;">Excluir</button>') +
        '<button type="button" id="ep-save" style="padding:9px 18px;background:#f0a05e;color:#fff;border:0;border-radius:6px;font-family:inherit;font-size:.9rem;font-weight:600;cursor:pointer;">Salvar</button>' +
      '</div>'
    );

    el('ep-cancel').addEventListener('click', closeModal);
    var delBtn = el('ep-delete');
    if (delBtn) delBtn.addEventListener('click', function () { deleteLead(l.id); });
    el('ep-save').addEventListener('click', function () { saveLead(novo ? null : l.id); });
    var intBtn = el('ep-int-add');
    if (intBtn) intBtn.addEventListener('click', async function () {
      intBtn.disabled = true;
      await logInteracao(l.id, el('ep-int-tipo').value, el('ep-int-desc').value.trim() || null);
      closeModal();
      await run();
    });
  }

  function val(id) { var e = el(id); return e ? String(e.value || '').trim() : ''; }

  async function saveLead(id) {
    var c = sb();
    if (!c) return;
    var msgEl = el('ep-modal-msg');
    var nome = val('ep-nome');
    if (!nome) { if (msgEl) msgEl.innerHTML = '<span style="color:#b3261e;">O nome do cliente é obrigatório.</span>'; return; }

    var orcado = parseMoney(val('ep-orcado'));
    var fechado = parseMoney(val('ep-fechado'));
    var status = val('ep-status') || 'novo';
    var payload = {
      cliente_nome: nome,
      empresa: val('ep-empresa') || null,
      whatsapp: val('ep-whats') || null,
      email: val('ep-email') || null,
      tipo_evento: val('ep-tipo') || null,
      tipo_evento_custom: val('ep-tipo-custom') || null,
      data_evento: val('ep-data') || null,
      pessoas: val('ep-pessoas') ? num(val('ep-pessoas')) : null,
      experiencia_interesse: val('ep-exp') || null,
      origem: val('ep-origem') || 'outro',
      status: status,
      responsavel: val('ep-resp') || null,
      valor_orcado_centavos: orcado,
      valor_fechado_centavos: fechado,
      lead_at: fromLocalInput(val('ep-lead-at')) || new Date().toISOString(),
      primeira_resposta_at: fromLocalInput(val('ep-resp-at')),
      orcamento_enviado_at: fromLocalInput(val('ep-orc-at')),
      proximo_followup_at: fromLocalInput(val('ep-fu-at')),
      motivo_perda: val('ep-motivo') || null,
      observacoes: val('ep-obs') || null,
    };
    // Coerência de status → carimbo. Marcar "fechado" sem data de
    // fechamento tiraria o evento do placar da semana.
    if (status === 'fechado') {
      var atual = id ? (S.leads.filter(function (x) { return x.id === id; })[0] || {}) : {};
      payload.fechado_at = atual.fechado_at || new Date().toISOString();
    } else {
      payload.fechado_at = null;
    }

    if (msgEl) msgEl.innerHTML = '<span style="color:#999;">Salvando…</span>';
    var res = id
      ? await c.from('evento_privado_leads').update(payload).eq('id', id)
      : await c.from('evento_privado_leads').insert(payload);
    if (res.error) {
      if (msgEl) msgEl.innerHTML = '<span style="color:#b3261e;">Erro: ' + esc(res.error.message) + '</span>';
      return;
    }
    closeModal();
    await run();
  }

  async function deleteLead(id) {
    if (!confirm('Excluir este pedido de evento? A timeline vai junto e não dá pra desfazer.')) return;
    var c = sb();
    if (!c) return;
    var res = await c.from('evento_privado_leads').delete().eq('id', id);
    if (res.error) { alert('Erro: ' + res.error.message); return; }
    closeModal();
    await run();
  }

  // ----- Modal de regras e metas -----
  function openCfgModal() {
    if (S.missing) { alert('Rode antes a migration sql/elarah_eventos_privados_comercial.sql.'); return; }
    var cfg = S.cfg || CFG_FALLBACK;
    var DIAS = [{ v: 1, l: 'Seg' }, { v: 2, l: 'Ter' }, { v: 3, l: 'Qua' }, { v: 4, l: 'Qui' },
                { v: 5, l: 'Sex' }, { v: 6, l: 'Sáb' }, { v: 0, l: 'Dom' }];
    var ativos = Array.isArray(cfg.expediente_dias) ? cfg.expediente_dias.map(Number) : [1, 2, 3, 4, 5, 6];

    openModal(
      '<h2 style="margin:0 0 4px;font-size:1.25rem;">Regras e metas</h2>' +
      '<p style="margin:0 0 16px;font-size:.83rem;color:#888;line-height:1.5;">' +
        'Vale pro painel inteiro: é daqui que saem os prazos cobrados na fila e os números do placar. ' +
        'Campos de meta <b>em branco = calculada do histórico</b> (recomendado — ela acompanha o crescimento sozinha).' +
      '</p>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Prazos</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        fieldWrap('Responder em (horas úteis)', '<input type="number" step="0.5" min="0.5" id="cfg-sla-resp" value="' + esc(cfg.sla_primeira_resposta_horas) + '" style="' + INP + '">') +
        fieldWrap('Enviar orçamento em (horas úteis)', '<input type="number" step="1" min="1" id="cfg-sla-orc" value="' + esc(cfg.sla_orcamento_horas) + '" style="' + INP + '">') +
        fieldWrap('Expediente começa', '<input type="time" id="cfg-ini" value="' + esc(String(cfg.expediente_inicio).slice(0, 5)) + '" style="' + INP + '">') +
        fieldWrap('Expediente termina', '<input type="time" id="cfg-fim" value="' + esc(String(cfg.expediente_fim).slice(0, 5)) + '" style="' + INP + '">') +
        fieldWrap('Dias de expediente',
          '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;">' +
            DIAS.map(function (d) {
              return '<label style="font-weight:500;font-size:.82rem;display:flex;align-items:center;gap:4px;">' +
                     '<input type="checkbox" class="cfg-dia" value="' + d.v + '"' + (ativos.indexOf(d.v) !== -1 ? ' checked' : '') + '> ' + d.l + '</label>';
            }).join('') +
          '</div>', true) +
        fieldWrap('Cadência de follow-up (dias após o orçamento)', '<input type="text" id="cfg-fu" placeholder="1,3,7" value="' + esc((cfg.followup_dias || [1, 3, 7]).join(',')) + '" style="' + INP + '">') +
        fieldWrap('Máximo de follow-ups', '<input type="number" min="0" id="cfg-fu-max" value="' + esc(cfg.followups_max) + '" style="' + INP + '">') +
      '</div>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Metas semanais</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        fieldWrap('Prospecção — mínimo', '<input type="number" min="0" id="cfg-pros-min" value="' + esc(cfg.meta_prospeccao_min) + '" style="' + INP + '">') +
        fieldWrap('Prospecção — alvo cheio', '<input type="number" min="0" id="cfg-pros-max" value="' + esc(cfg.meta_prospeccao_max) + '" style="' + INP + '">') +
        fieldWrap('Fator de crescimento sobre o histórico', '<input type="number" step="0.05" min="0.1" id="cfg-fator" value="' + esc(cfg.fator_crescimento) + '" style="' + INP + '">') +
        fieldWrap('Eventos/semana (vazio = automático)', '<input type="number" min="0" id="cfg-meta-eventos" value="' + esc(cfg.meta_eventos_semana == null ? '' : cfg.meta_eventos_semana) + '" style="' + INP + '">') +
        fieldWrap('Orçamentos/semana (vazio = automático)', '<input type="number" min="0" id="cfg-meta-orc" value="' + esc(cfg.meta_orcamentos_semana == null ? '' : cfg.meta_orcamentos_semana) + '" style="' + INP + '">') +
        fieldWrap('Receita/semana R$ (vazio = automático)', '<input type="text" id="cfg-meta-receita" value="' + esc(cfg.meta_receita_semana_centavos == null ? '' : (cfg.meta_receita_semana_centavos / 100).toFixed(2).replace('.', ',')) + '" style="' + INP + '">') +
      '</div>' +

      '<h3 style="margin:0 0 8px;font-size:.9rem;color:#444;border-bottom:1px solid #eee;padding-bottom:5px;">Contexto</h3>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
        fieldWrap('Quem cuida dos eventos privados', '<input type="text" id="cfg-resp" placeholder="Nome — entra nas mensagens prontas" value="' + esc(cfg.responsavel_nome || '') + '" style="' + INP + '">') +
        fieldWrap('Combinados extras (aparecem no card laranja)', '<textarea id="cfg-obs" rows="3" style="' + INP + 'resize:vertical;">' + esc(cfg.observacoes || '') + '</textarea>') +
      '</div>' +

      '<div id="ep-modal-msg" style="font-size:.85rem;margin-top:12px;"></div>' +
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
    var msgEl = el('ep-modal-msg');
    var dias = [];
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-dia'), function (i) {
      if (i.checked) dias.push(num(i.value));
    });
    if (!dias.length) { if (msgEl) msgEl.innerHTML = '<span style="color:#b3261e;">Escolha ao menos um dia de expediente.</span>'; return; }

    var fu = val('cfg-fu').split(',').map(function (x) { return parseInt(x, 10); })
              .filter(function (x) { return isFinite(x) && x >= 0; });
    if (!fu.length) fu = [1, 3, 7];

    var receita = parseMoney(val('cfg-meta-receita'));
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
      meta_receita_semana_centavos: val('cfg-meta-receita') === '' ? null : receita,
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
    closeModal();
    await run();
  }

  // =============================================================
  // BOOT
  // =============================================================
  async function run() {
    if (S.loading) return;
    S.loading = true;
    var root = el('evtpriv-root');
    if (root && !root.dataset.epLoaded) {
      root.innerHTML = '<div style="color:#999;font-size:.9rem;">Lendo metas, pipeline, prospecção e histórico de eventos…</div>';
    }
    try {
      await loadAll();
      render();
      wireRoot();
      if (root) root.dataset.epLoaded = '1';
    } catch (e) {
      if (root) {
        root.innerHTML = '<div style="color:#b3261e;font-size:.9rem;">Falha ao carregar: ' + esc((e && e.message) || e) + '</div>';
      }
      console.error('[EventosPrivados]', e);
    } finally {
      S.loading = false;
    }
  }

  function init() {
    var btn = el('evtpriv-refresh');
    if (btn && !btn.dataset.wired) { btn.dataset.wired = '1'; btn.addEventListener('click', run); }
    var nav = document.querySelector('[data-panel="eventos-privados"]');
    if (nav && !nav.dataset.epWired) {
      nav.dataset.epWired = '1';
      // setTimeout: deixa o admin trocar de painel antes de renderizar.
      nav.addEventListener('click', function () { setTimeout(run, 150); });
    }
    var p = el('panel-eventos-privados');
    if (p && p.classList.contains('admin__panel--active')) run();
  }

  // Exposto pra que outros pontos do admin consigam forçar refresh.
  window.ElarahEventosPrivados = { run: run };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
