/* =============================================================
   ELARAH — Aba "Trocas e reembolsos"
   -------------------------------------------------------------
   A cliente agora troca a reserva sozinha em "Minhas compras"
   (conta-trocas.js → Edge Function cliente-trocar-reserva): mesma
   experiência em outra data, ou outra experiência. Cada troca vira uma
   linha em public.trocas_reserva (sql/elarah_trocas_reserva.sql).

   Esta aba lista essas trocas e deixa o aviso pra parceira a UM clique —
   abre o WhatsApp com a mensagem pronta:

     • Mesma experiência / mesma parceira → 1 botão: REMARCAÇÃO
       ("libera dia X, nova data dia Y").
     • Parceira diferente → 2 botões: pra antiga, CANCELAMENTO (pode liberar
       a vaga, sai do repasse); pra nova, a reserva nova (vaga confirmada).

   O clique carimba o aviso na linha (e, no aviso da parceira nova, também
   bookings.fornecedor_avisado_at — o "Avisar" da aba Compras fica verde).

   Reembolso segue com a Elarah: o "Pedir reembolso" da cliente abre o
   WhatsApp e registra o pedido aqui (tipo 'reembolso') pra não se perder.

   Autocontido: injeta o próprio CSS. Renderiza dentro de #trocas-root.
   ============================================================= */
(function (window, document) {
  'use strict';

  var ROOT_ID = 'trocas-root';
  var filtro = 'pendentes';
  var busca = '';
  var dados = null; // { linhas, waPorFornecedor }

  function sb() { return window.supabaseClient || null; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fornecedorKey(nome) {
    return String(nome || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // Mesmo formato do admin.js (waPhoneDigits): E.164 sem "+"; 10/11
  // dígitos sem DDI = Brasil.
  function waDigits(raw) {
    var text = String(raw == null ? '' : raw).trim();
    var d = text.replace(/\D+/g, '');
    if (!d) return '';
    if (text.charAt(0) === '+') return d;
    if (d.length <= 11) return '55' + d;
    return d;
  }

  // api.whatsapp.com/send em vez de wa.me: o wa.me corrompe emoji fora do
  // BMP (📍 📅) e a parceira recebe "?" no lugar.
  function waUrl(phone, msg) {
    var d = waDigits(phone);
    return 'https://api.whatsapp.com/send/?' + (d ? 'phone=' + d + '&' : '') +
      'text=' + encodeURIComponent(msg || '');
  }

  function telBR(raw) {
    var all = String(raw || '').replace(/\D+/g, '');
    var d = all.length > 11 && all.indexOf('55') === 0 ? all.slice(2) : all;
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return String(raw || '');
  }

  function quando(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function vagas(q) {
    q = Math.max(1, Number(q) || 1);
    return q === 1 ? '1 vaga' : q + ' vagas';
  }

  // ===== Mensagens =====
  function linhasCliente(t, comLocal) {
    var out = [];
    if (t.cliente_nome) out.push('👤 *Em nome de:* ' + t.cliente_nome);
    if (t.cliente_telefone) out.push('📱 *WhatsApp:* ' + telBR(t.cliente_telefone));
    if (t.cliente_email) out.push('✉️ *E-mail:* ' + t.cliente_email);
    if (comLocal && t.para_endereco) out.push('📍 *Local:* ' + t.para_endereco);
    return out;
  }

  function msgRemarcacao(t) {
    var mesmaExp = t.de_experiencia_id === t.para_experiencia_id ||
      String(t.de_experiencia_nome || '').trim().toLowerCase() === String(t.para_experiencia_nome || '').trim().toLowerCase();
    var l = [];
    l.push('Oi! Tudo bem? Passando para te avisar de uma *REMARCAÇÃO* 🔄');
    l.push('');
    l.push('A reserva da experiência *' + (t.de_experiencia_nome || '') + '* (' + vagas(t.quantidade) + ')' +
      ' que estava para o dia *' + (t.de_data || '') + '*' + (t.de_horario ? ' às *' + t.de_horario + '*' : '') +
      ' foi remarcada para ' + (mesmaExp ? '' : '*' + (t.para_experiencia_nome || '') + '* ') +
      'o dia *' + (t.para_data || '') + '* às *' + (t.para_horario || '') + '*.');
    l.push('');
    l.push('❌ *Libera:* ' + (t.de_data || '') + (t.de_horario ? ' · ' + t.de_horario : ''));
    l.push('✅ *Nova data:* ' + (mesmaExp ? '' : (t.para_experiencia_nome || '') + ' · ') + (t.para_data || '') + ' · ' + (t.para_horario || ''));
    l.push('');
    l = l.concat(linhasCliente(t, !mesmaExp));
    l.push('');
    l.push('Obrigada! 🧡');
    return l.join('\n');
  }

  function msgCancelamentoParceiraAntiga(t) {
    var l = [];
    l.push('Oi! Tudo bem? Passando para te avisar que a reserva de *' + (t.cliente_nome || 'cliente') + '*' +
      ' (' + vagas(t.quantidade) + ') para a experiência *' + (t.de_experiencia_nome || '') + '*' +
      ' no dia *' + (t.de_data || '') + '*' + (t.de_horario ? ' às *' + t.de_horario + '*' : '') +
      ' foi *cancelada* — a cliente trocou por outra experiência.');
    l.push('');
    l.push('❌ *Pode liberar:* ' + (t.de_data || '') + (t.de_horario ? ' · ' + t.de_horario : '') + ' (' + vagas(t.quantidade) + ')');
    l.push('');
    l.push('Essa reserva não entra mais no seu repasse. Obrigada! 🧡');
    return l.join('\n');
  }

  function msgNovaReserva(t) {
    var q = Math.max(1, Number(t.quantidade) || 1);
    var l = [];
    l.push('Oi! Tudo bem? Passando para te avisar que você tem *' + (q === 1 ? '1 vaga confirmada' : q + ' vagas confirmadas') + '*' +
      ' para a experiência *' + (t.para_experiencia_nome || '') + '* no dia *' + (t.para_data || '') + '* às *' + (t.para_horario || '') + '*.');
    l.push('');
    l = l.concat(linhasCliente(t, true));
    l.push('');
    l.push('O repasse será feito até 48h antes do evento.');
    return l.join('\n');
  }

  function msgCliente(t) {
    return 'Oi, ' + (String(t.cliente_nome || '').split(' ')[0] || 'tudo bem') + '! Aqui é da Elarah 🧡 ' +
      (t.tipo === 'reembolso'
        ? 'Recebemos seu pedido de reembolso da reserva *' + (t.de_experiencia_nome || '') + '* (' + (t.de_data || '') + ').'
        : 'Vimos a troca da sua reserva para *' + (t.para_experiencia_nome || '') + '* (' + (t.para_data || '') + ' · ' + (t.para_horario || '') + ').');
  }

  // ===== Estado =====
  // Situação da troca (sql/elarah_trocas_reserva_pagamento.sql). Vazio =
  // linha de antes da diferença a pagar = aplicada.
  // A troca deste pagamento já está gravada na reserva (a linha pode ter
  // ficado 'processando' se a gravação dela falhou): conta como aplicada.
  function aplicadaNaReserva(t) {
    var td = t.bookings && t.bookings.metadata && t.bookings.metadata.troca_diferenca;
    return !!(td && td.troca_id === t.id);
  }
  function aplicada(t) { return !t.status || t.status === 'aplicada' || aplicadaNaReserva(t); }
  // Pagou a diferença mas a troca não entrou (data esgotou / reserva mudou):
  // a Elarah precisa resolver com a cliente.
  // 'processando' há mais de 5 min = a função caiu depois de o pagamento
  // aprovar: a cliente pagou e a troca não entrou.
  function processandoTravado(t) {
    return t.status === 'processando' && !aplicadaNaReserva(t) && t.pago_at && Date.now() - new Date(t.pago_at).getTime() > 5 * 60000;
  }
  function pagoComProblema(t) {
    return t.status === 'pago_sem_vaga' || t.status === 'pago_sem_aplicar' || processandoTravado(t);
  }
  // Diferença paga e depois estornada/contestada no gateway.
  function estornado(t) { return t.pagamento_status === 'reembolsado'; }
  // Tentativa que não virou troca (Pix não pago, cartão recusado…): só
  // aparece em "Todas".
  function tentativa(t) { return t.tipo === 'troca' && !aplicada(t) && !pagoComProblema(t); }

  function brl(c) {
    return 'R$ ' + (Number(c || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Sobra da troca por opção mais barata: Pix a devolver (ou crédito que
  // não foi gerado) fica pendente até a Elarah resolver.
  function pixADevolver(t) { return t.devolucao_tipo === 'pix' && !t.reembolso_feito_at; }
  function creditoFalhou(t) { return t.devolucao_tipo === 'credito' && !t.credito_codigo; }

  function pendente(t) {
    // Dinheiro devido à cliente fica pendente mesmo que alguém clique em
    // "Concluir": só some quando o Pix for marcado como devolvido.
    if (pixADevolver(t) || creditoFalhou(t)) return true;
    // Pagou e não entrou / estorno: só sai de Pendentes com a resolução
    // escrita (botão "Resolver") — um clique solto não esconde dinheiro.
    if ((pagoComProblema(t) || estornado(t)) && !t.resolucao) return true;
    if (t.resolvido_at) return false;
    if (t._teste || tentativa(t)) return false;
    if (t.tipo === 'reembolso') return true;
    if (t.modalidade === 'outro_parceiro') return !t.aviso_de_at || !t.aviso_para_at;
    return !t.aviso_para_at;
  }

  async function carregar() {
    var s = sb();
    if (!s) throw new Error('Supabase indisponível. Recarregue a página.');
    // Compra de TESTE (bookings.metadata.teste) vem junto pela chave
    // estrangeira — uma consulta só, sem lista gigante de ids na URL.
    var res = await Promise.all([
      s.from('trocas_reserva').select('*, bookings(metadata)').order('created_at', { ascending: false }).limit(300),
      s.from('fornecedores_metadata').select('fornecedor_key, fornecedor_nome, whatsapp'),
    ]);
    if (res[0].error) {
      // Sem o embed (relação não reconhecida): consulta simples, sem marcar teste.
      console.warn('[Elarah Trocas] embed bookings falhou, lendo sem ele', res[0].error);
      res[0] = await s.from('trocas_reserva').select('*').order('created_at', { ascending: false }).limit(300);
      if (res[0].error) throw res[0].error;
    }
    var wa = new Map();
    (res[1].data || []).forEach(function (f) {
      var k = f.fornecedor_key || fornecedorKey(f.fornecedor_nome);
      if (k && f.whatsapp) wa.set(k, String(f.whatsapp).trim());
    });
    (res[0].data || []).forEach(function (t) {
      var bm = t.bookings && t.bookings.metadata;
      t._teste = !!(bm && bm.teste === true);
    });
    dados = { linhas: res[0].data || [], waPorFornecedor: wa };
  }

  async function marcar(id, campo, bookingId) {
    var s = sb();
    var patch = {};
    patch[campo] = new Date().toISOString();
    var r = await s.from('trocas_reserva').update(patch).eq('id', id);
    if (r.error) {
      console.error('[Elarah Trocas] erro marcando', campo, r.error);
      alert('Não consegui salvar. Tente de novo.\n' + (r.error.message || ''));
      return false;
    }
    // Aviso da parceira da reserva atual → "Avisar" da aba Compras fica verde.
    if (campo === 'aviso_para_at' && bookingId) {
      var r2 = await s.from('bookings').update({ fornecedor_avisado_at: patch[campo] }).eq('id', bookingId);
      if (r2.error) console.warn('[Elarah Trocas] não marquei fornecedor_avisado_at', r2.error);
    }
    var linha = dados && dados.linhas.find(function (t) { return t.id === id; });
    if (linha) linha[campo] = patch[campo];
    return true;
  }

  async function salvarCampos(id, patch) {
    var r = await sb().from('trocas_reserva').update(patch).eq('id', id);
    if (r.error) {
      console.error('[Elarah Trocas] erro salvando', patch, r.error);
      alert('Não consegui salvar. Tente de novo.\n' + (r.error.message || ''));
      return false;
    }
    var linha = dados && dados.linhas.find(function (t) { return t.id === id; });
    if (linha) Object.assign(linha, patch);
    return true;
  }

  async function desmarcar(id, campo) {
    var s = sb();
    var patch = {};
    patch[campo] = null;
    var r = await s.from('trocas_reserva').update(patch).eq('id', id);
    if (r.error) {
      console.error('[Elarah Trocas] erro desmarcando', campo, r.error);
      alert('Não consegui salvar. Tente de novo.\n' + (r.error.message || ''));
      return;
    }
    var l0 = dados && dados.linhas.find(function (t) { return t.id === id; });
    // Aviso desfeito → o "Avisar" da aba Compras volta a vermelho também.
    if (campo === 'aviso_para_at' && l0 && l0.booking_id) {
      await s.from('bookings').update({ fornecedor_avisado_at: null }).eq('id', l0.booking_id);
    }
    var linha = dados && dados.linhas.find(function (t) { return t.id === id; });
    if (linha) linha[campo] = null;
  }

  // ===== Render =====
  function injetarCss() {
    if (document.getElementById('trocas-css')) return;
    var st = document.createElement('style');
    st.id = 'trocas-css';
    st.textContent = [
      '.trc-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px;}',
      '.trc-chip{border:1px solid #ddd;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:.8rem;cursor:pointer;}',
      '.trc-chip--on{background:#2b2420;color:#fff;border-color:#2b2420;}',
      '.trc-busca{flex:1;min-width:200px;padding:7px 12px;border:1px solid #ddd;border-radius:999px;font:inherit;font-size:.82rem;}',
      '.trc-lista{display:grid;gap:12px;}',
      '.trc-card{background:#fff;border:1px solid #e8e4e0;border-radius:12px;padding:14px 16px;}',
      '.trc-card--ok{opacity:.72;}',
      '.trc-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline;margin-bottom:8px;}',
      '.trc-nome{font-weight:700;font-size:.92rem;}',
      '.trc-quando{font-size:.74rem;color:#888;}',
      '.trc-tag{display:inline-block;font-size:.68rem;font-weight:700;border-radius:999px;padding:2px 8px;margin-left:6px;vertical-align:middle;}',
      '.trc-tag--data{background:#e8f1fd;color:#1a5fb4;}',
      '.trc-tag--parc{background:#f1eafd;color:#6b3fb4;}',
      '.trc-tag--outro{background:#fdf0e6;color:#b45a1a;}',
      '.trc-tag--reemb{background:#fdeaea;color:#b3261e;}',
      '.trc-tag--pend{background:#c0392b;color:#fff;}',
      '.trc-fluxo{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;font-size:.82rem;line-height:1.45;}',
      '@media(max-width:700px){.trc-fluxo{grid-template-columns:1fr;}.trc-seta{display:none;}}',
      '.trc-box{background:#faf7f4;border-radius:10px;padding:8px 10px;}',
      '.trc-box small{display:block;color:#888;font-size:.7rem;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;}',
      '.trc-seta{font-size:1.2rem;color:#bbb;}',
      '.trc-contato{font-size:.78rem;color:#555;margin:8px 0 0;}',
      '.trc-acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}',
      '.trc-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;font:inherit;font-size:.76rem;font-weight:700;text-decoration:none;cursor:pointer;border:1px solid transparent;}',
      '.trc-btn--wa{background:#c0392b;color:#fff;}',
      '.trc-btn--wa-ok{background:#e6f4ea;color:#1a8a4a;border-color:#1a8a4a;}',
      '.trc-btn--ghost{background:#fff;color:#555;border-color:#ddd;}',
      '.trc-sem{font-size:.7rem;color:#b3261e;margin-left:2px;}',
      '.trc-vazio{background:#fff;border:1px dashed #ddd;border-radius:12px;padding:22px;text-align:center;color:#888;font-size:.86rem;}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function tagModalidade(t) {
    if (t.tipo === 'reembolso') return '<span class="trc-tag trc-tag--reemb">Pedido de reembolso</span>';
    if (t.modalidade === 'mesma_experiencia') return '<span class="trc-tag trc-tag--data">Outra data</span>';
    if (t.modalidade === 'mesmo_parceiro') return '<span class="trc-tag trc-tag--parc">Outra experiência · mesmo parceiro</span>';
    return '<span class="trc-tag trc-tag--outro">Outra experiência · outro parceiro</span>';
  }

  function botaoAviso(t, campo, rotulo, fornecedor, msg) {
    var wa = dados.waPorFornecedor.get(fornecedorKey(fornecedor)) || '';
    var feito = t[campo];
    var sem = wa ? '' : '<span class="trc-sem" title="Cadastre o WhatsApp em Parceiros">(sem WhatsApp cadastrado)</span>';
    var html = '<a class="trc-btn ' + (feito ? 'trc-btn--wa-ok' : 'trc-btn--wa') + '" href="' + esc(waUrl(wa, msg)) + '" target="_blank" rel="noopener" ' +
      'data-trc-aviso="' + esc(campo) + '" data-trc-id="' + esc(t.id) + '" data-trc-booking="' + esc(t.booking_id || '') + '" ' +
      'title="' + (feito ? 'Avisado em ' + esc(quando(feito)) + '. Clique pra reabrir o WhatsApp.' : 'Abre o WhatsApp com a mensagem pronta e marca como avisado.') + '">' +
      (feito ? '✓ ' : '📲 ') + esc(rotulo) + ' — ' + esc(fornecedor || 'parceiro') +
      (feito ? ' · ' + esc(quando(feito)) : '') + '</a>' + sem;
    if (feito) {
      html += '<button type="button" class="trc-btn trc-btn--ghost" data-trc-desfaz="' + esc(campo) + '" data-trc-id="' + esc(t.id) + '" title="Marcar como não avisado">↺</button>';
    }
    return html;
  }

  function card(t) {
    var reemb = t.tipo === 'reembolso';
    var pend = pendente(t);
    var acoes = [];
    var alerta = '';
    if (pagoComProblema(t)) {
      alerta = '<p style="margin:8px 0 0;padding:8px 10px;border-radius:8px;background:#fdeaea;color:#b3261e;font-size:.8rem;font-weight:600;">' +
        '⚠ A cliente PAGOU ' + esc(brl(t.pagamento_valor_centavos)) + ' de diferença, mas a troca não entrou' +
        (t.status === 'pago_sem_vaga' ? ' — a data esgotou durante o pagamento.' : '.') +
        (t.observacao ? ' (' + esc(t.observacao) + ')' : '') +
        ' A reserva continua na data antiga. Combine outra data com ela ou devolva a diferença.</p>';
    } else if (estornado(t)) {
      alerta = '<p style="margin:8px 0 0;padding:8px 10px;border-radius:8px;background:#fdeaea;color:#b3261e;font-size:.8rem;font-weight:600;">' +
        '⚠ O pagamento da diferença (' + esc(brl(t.pagamento_valor_centavos)) + ') foi ESTORNADO ou contestado no ' +
        (t.pagamento_metodo === 'cartao' ? 'cartão' : 'Pix') + ', mas a troca já tinha sido feita. Revise a reserva com a cliente.</p>';
    } else if (tentativa(t)) {
      var rot = {
        aguardando_pagamento: '⏳ Aguardando pagamento da diferença',
        processando: '⏳ Pagamento aprovado — aplicando a troca',
        pagamento_recusado: '✕ Pagamento não concluído (Pix expirou ou cartão recusado)',
        cancelada: '✕ Tentativa substituída por outra',
        erro_pagamento: '✕ Erro ao gerar a cobrança',
      }[t.status] || t.status;
      alerta = '<p style="margin:8px 0 0;font-size:.78rem;color:#8a6a2a;">' + esc(rot) +
        (t.diferenca_centavos ? ' · ' + esc(brl(t.diferenca_centavos)) : '') + '. A reserva continua como estava.</p>';
    } else if (t.pago_at && t.pagamento_valor_centavos) {
      alerta = '<p style="margin:8px 0 0;font-size:.78rem;color:#1a8a4a;font-weight:600;">💳 Diferença paga: ' +
        esc(brl(t.pagamento_valor_centavos)) + ' no ' + (t.pagamento_metodo === 'cartao'
          ? 'cartão' + (t.pagamento_parcelas > 1 ? ' (' + t.pagamento_parcelas + 'x)' : '')
          : 'Pix') + ' · ' + esc(quando(t.pago_at)) + '</p>';
    }
    if (t.devolucao_tipo === 'pix') {
      var prazo = t.reembolso_prazo ? new Date(t.reembolso_prazo) : null;
      var atrasado = prazo && !t.reembolso_feito_at && prazo.getTime() < Date.now();
      alerta += '<p style="margin:8px 0 0;padding:8px 10px;border-radius:8px;font-size:.8rem;' +
        (t.reembolso_feito_at ? 'background:#e6f4ea;color:#1a8a4a;' : 'background:' + (atrasado ? '#fdeaea;color:#b3261e;' : '#fff6e5;color:#8a5a00;')) + '">' +
        (t.reembolso_feito_at
          ? '✓ Pix de ' + esc(brl(t.devolucao_centavos)) + ' devolvido em ' + esc(quando(t.reembolso_feito_at))
          : '💸 <strong>Devolver ' + esc(brl(t.devolucao_centavos)) + ' por Pix</strong>' +
            (prazo ? ' até ' + esc(quando(t.reembolso_prazo)) + (atrasado ? ' — <strong>ATRASADO</strong>' : '') : '') +
            '<br>Chave: <strong style="user-select:all;">' + esc(t.reembolso_pix_chave || '—') + '</strong>' +
            (t.reembolso_pix_titular ? '<br>Titular: <strong>' + esc(t.reembolso_pix_titular) + '</strong> — confira no app do banco antes de enviar.' : '')) +
        '</p>';
      if (!t.reembolso_feito_at) {
        acoes.push('<button type="button" class="trc-btn trc-btn--wa" data-trc-pixfeito="' + esc(t.id) + '">✓ Pix devolvido</button>');
      }
    } else if (t.devolucao_tipo === 'credito') {
      alerta += t.credito_codigo
        ? '<p style="margin:8px 0 0;font-size:.78rem;color:#1a8a4a;font-weight:600;">🎟 Crédito gerado: ' + esc(t.credito_codigo) +
          ' · ' + esc(brl(t.devolucao_centavos)) + (t.credito_expira_em ? ' · vale até ' + esc(quando(t.credito_expira_em)) : '') + '</p>'
        : '<p style="margin:8px 0 0;padding:8px 10px;border-radius:8px;background:#fdeaea;color:#b3261e;font-size:.8rem;font-weight:600;">' +
          '⚠ O crédito de ' + esc(brl(t.devolucao_centavos)) + ' NÃO foi gerado. Crie o cupom à mão em Cupons (valor fixo, 1 uso, 90 dias), mande pra cliente e registre o código aqui.</p>';
      if (!t.credito_codigo) {
        acoes.push('<button type="button" class="trc-btn trc-btn--wa" data-trc-credito="' + esc(t.id) + '">🎟 Registrar cupom criado</button>');
      }
    }
    if (!aplicada(t)) {
      // Troca que não entrou: nada pra avisar à parceira.
    } else if (t._teste) {
      acoes.push('<span class="trc-btn trc-btn--ghost" style="cursor:default;color:#8a6a2a;" title="Compra de teste — nada é enviado pra parceira">🧪 Compra de teste · aviso ao parceiro desligado</span>');
    } else if (!reemb) {
      if (t.modalidade === 'outro_parceiro') {
        acoes.push(botaoAviso(t, 'aviso_de_at', 'Cancelamento', t.de_fornecedor_nome, msgCancelamentoParceiraAntiga(t)));
        acoes.push(botaoAviso(t, 'aviso_para_at', 'Nova reserva', t.para_fornecedor_nome, msgNovaReserva(t)));
      } else {
        acoes.push(botaoAviso(t, 'aviso_para_at', 'Avisar remarcação', t.para_fornecedor_nome || t.de_fornecedor_nome, msgRemarcacao(t)));
      }
    }
    if (t.cliente_telefone) {
      acoes.push('<a class="trc-btn trc-btn--ghost" href="' + esc(waUrl(t.cliente_telefone, msgCliente(t))) + '" target="_blank" rel="noopener">💬 Falar com a cliente</a>');
    }
    acoes.push(t.resolvido_at
      ? '<button type="button" class="trc-btn trc-btn--ghost" data-trc-reabrir="' + esc(t.id) + '">↺ Reabrir</button>'
      : ((pagoComProblema(t) || estornado(t))
        ? '<button type="button" class="trc-btn trc-btn--wa" data-trc-resolver-nota="' + esc(t.id) + '">✓ Resolver (dizer como)</button>'
        : '<button type="button" class="trc-btn trc-btn--ghost" data-trc-resolver="' + esc(t.id) + '">✓ ' + (reemb ? 'Reembolso resolvido' : 'Concluir') + '</button>'));
    if (t.resolucao) {
      alerta += '<p style="margin:8px 0 0;font-size:.78rem;color:#1a8a4a;">✓ Resolvido: ' + esc(t.resolucao) + '</p>';
    }

    var de = '<div class="trc-box"><small>' + (reemb ? 'Reserva' : 'Era') + '</small>' +
      '<strong>' + esc(t.de_experiencia_nome || '—') + '</strong><br>' +
      esc(t.de_data || '') + (t.de_horario ? ' · ' + esc(t.de_horario) : '') + ' · ' + esc(vagas(t.quantidade)) +
      (t.de_fornecedor_nome ? '<br><span style="color:#888;">' + esc(t.de_fornecedor_nome) + '</span>' : '') + '</div>';
    var para = reemb
      ? '<div class="trc-box"><small>Pedido</small>Reembolso — combinar com a cliente no WhatsApp.' +
        (t.motivo ? '<br><em>' + esc(t.motivo) + '</em>' : '') + '</div>'
      : '<div class="trc-box"><small>' + (aplicada(t) ? 'Ficou' : 'Pediu') + '</small><strong>' + esc(t.para_experiencia_nome || '—') + '</strong><br>' +
        esc(t.para_data || '') + (t.para_horario ? ' · ' + esc(t.para_horario) : '') +
        (t.para_fornecedor_nome ? '<br><span style="color:#888;">' + esc(t.para_fornecedor_nome) + '</span>' : '') + '</div>';

    return '<div class="trc-card' + (pend ? '' : ' trc-card--ok') + '">' +
      '<div class="trc-head"><div><span class="trc-nome">' + esc(t.cliente_nome || t.cliente_email || 'Cliente') + '</span>' +
        tagModalidade(t) + (pend ? '<span class="trc-tag trc-tag--pend">Pendente</span>' : '') + '</div>' +
        '<span class="trc-quando">' + esc(quando(t.created_at)) + (t.resolvido_at ? ' · concluído ' + esc(quando(t.resolvido_at)) : '') + '</span></div>' +
      '<div class="trc-fluxo">' + de + '<span class="trc-seta">→</span>' + para + '</div>' + alerta +
      '<p class="trc-contato">' +
        (t.cliente_telefone ? '📱 ' + esc(telBR(t.cliente_telefone)) + ' ' : '') +
        (t.cliente_email ? '✉️ ' + esc(t.cliente_email) : '') +
        (t.booking_id ? ' · Ref. ' + esc(String(t.booking_id).slice(-8).toUpperCase()) : '') + '</p>' +
      '<div class="trc-acoes">' + acoes.join('') + '</div>' +
    '</div>';
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root || !dados) return;
    var linhas = dados.linhas;
    var q = busca.toLowerCase().trim();
    var vis = linhas.filter(function (t) {
      if (filtro === 'pendentes' && !pendente(t)) return false;
      if (filtro !== 'todas' && filtro !== 'pendentes' && tentativa(t)) return false;
      if (filtro === 'trocas' && t.tipo !== 'troca') return false;
      if (filtro === 'reembolsos' && t.tipo !== 'reembolso' && t.devolucao_tipo !== 'pix' && !estornado(t)) return false;
      if (!q) return true;
      return [t.cliente_nome, t.cliente_email, t.cliente_telefone, t.de_experiencia_nome, t.para_experiencia_nome,
        t.de_fornecedor_nome, t.para_fornecedor_nome].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    var nPend = linhas.filter(pendente).length;
    var chip = function (k, label) {
      return '<button type="button" class="trc-chip' + (filtro === k ? ' trc-chip--on' : '') + '" data-trc-filtro="' + k + '">' + label + '</button>';
    };
    root.innerHTML =
      '<div class="trc-bar">' +
        chip('pendentes', 'Pendentes (' + nPend + ')') + chip('trocas', 'Trocas') + chip('reembolsos', 'Reembolsos') + chip('todas', 'Todas') +
        '<input type="search" class="trc-busca" placeholder="Buscar cliente, experiência ou parceiro" value="' + esc(busca) + '">' +
      '</div>' +
      (vis.length
        ? '<div class="trc-lista">' + vis.map(card).join('') + '</div>'
        : '<div class="trc-vazio">' + (filtro === 'pendentes' ? 'Nada pendente por aqui 🎉' : 'Nenhum registro.') + '</div>');

    var inp = root.querySelector('.trc-busca');
    inp.addEventListener('input', function () {
      busca = inp.value;
      var pos = inp.selectionStart;
      render();
      var n = document.getElementById(ROOT_ID).querySelector('.trc-busca');
      if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} }
    });
  }

  function atualizarContador() {
    var el = document.getElementById('trocas-contador');
    if (!el || !dados) return;
    var n = dados.linhas.filter(pendente).length;
    el.textContent = n ? String(n) : '';
    el.style.display = n ? '' : 'none';
  }

  async function run(force) {
    injetarCss();
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (!dados || force) {
      root.innerHTML = '<div class="trc-vazio">Carregando…</div>';
      try {
        await carregar();
      } catch (e) {
        console.error('[Elarah Trocas] erro ao carregar', e);
        var msg = (e && e.message) || String(e);
        root.innerHTML = '<div class="trc-vazio">' + (/trocas_reserva/.test(msg)
          ? 'A tabela de trocas ainda não existe. Rode <code>sql/elarah_trocas_reserva.sql</code> no SQL Editor do Supabase.'
          : 'Erro ao carregar: ' + esc(msg)) + '</div>';
        return;
      }
    }
    render();
    atualizarContador();
  }

  // Cliques (delegação no root).
  document.addEventListener('click', async function (ev) {
    var root = document.getElementById(ROOT_ID);
    if (!root || !root.contains(ev.target)) return;
    var el;
    if ((el = ev.target.closest('[data-trc-filtro]'))) {
      filtro = el.getAttribute('data-trc-filtro');
      render();
      return;
    }
    if ((el = ev.target.closest('[data-trc-aviso]'))) {
      // Deixa o link abrir o WhatsApp; carimba em paralelo.
      var ok = await marcar(el.getAttribute('data-trc-id'), el.getAttribute('data-trc-aviso'), el.getAttribute('data-trc-booking'));
      if (ok) { render(); atualizarContador(); }
      return;
    }
    if ((el = ev.target.closest('[data-trc-desfaz]'))) {
      await desmarcar(el.getAttribute('data-trc-id'), el.getAttribute('data-trc-desfaz'));
      render(); atualizarContador();
      return;
    }
    if ((el = ev.target.closest('[data-trc-pixfeito]'))) {
      if (!window.confirm('Confirma que o Pix já foi devolvido pra cliente?')) return;
      el.disabled = true;
      await marcar(el.getAttribute('data-trc-pixfeito'), 'reembolso_feito_at');
      render(); atualizarContador();
      return;
    }
    if ((el = ev.target.closest('[data-trc-resolver]'))) {
      el.disabled = true;
      await marcar(el.getAttribute('data-trc-resolver'), 'resolvido_at');
      render(); atualizarContador();
      return;
    }
    if ((el = ev.target.closest('[data-trc-resolver-nota]'))) {
      var idN = el.getAttribute('data-trc-resolver-nota');
      var nota = window.prompt('Como foi resolvido? (ex.: "devolvi R$ 50 por Pix em 02/10" ou "remarquei pra 15/10 no painel")');
      if (!nota || !nota.trim()) return;
      if (await salvarCampos(idN, { resolucao: nota.trim().slice(0, 300), resolvido_at: new Date().toISOString() })) { render(); atualizarContador(); }
      return;
    }
    if ((el = ev.target.closest('[data-trc-credito]'))) {
      var idC = el.getAttribute('data-trc-credito');
      var cod = window.prompt('Código do cupom de crédito que você criou e mandou pra cliente:');
      if (!cod || !cod.trim()) return;
      if (await salvarCampos(idC, { credito_codigo: cod.trim().toUpperCase().slice(0, 60) })) { render(); atualizarContador(); }
      return;
    }
    if ((el = ev.target.closest('[data-trc-reabrir]'))) {
      var idR = el.getAttribute('data-trc-reabrir');
      await desmarcar(idR, 'resolvido_at');
      var lr = dados && dados.linhas.find(function (t) { return t.id === idR; });
      if (lr && lr.resolucao) await salvarCampos(idR, { resolucao: null });
      render(); atualizarContador();
    }
  });

  function init() {
    var btn = document.getElementById('trocas-refresh');
    if (btn) btn.addEventListener('click', function () { run(true); });
    // Contador do menu: carrega uma vez em segundo plano quando o painel abre.
    var tentar = function (n) {
      if (sb()) { run(true).catch(function () {}); return; }
      if (n > 0) setTimeout(function () { tentar(n - 1); }, 1500);
    };
    setTimeout(function () { tentar(6); }, 2500);
  }

  window.ElarahTrocasAdmin = { run: run };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
