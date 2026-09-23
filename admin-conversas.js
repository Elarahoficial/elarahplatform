/* =====================================================================
   ELARAH — Conversas de WhatsApp (aba "Conversas" do admin)
   ---------------------------------------------------------------------
   A caixa de entrada do número oficial, no formato que todo mundo já
   sabe usar: lista de conversas à esquerda, o fio da conversa à direita,
   campo de resposta embaixo.

   DE ONDE VEM CADA LADO
     recebidas → public.whatsapp_mensagens   (a Edge Function whatsapp-webhook
                                              grava o que a Meta entrega)
     enviadas  → public.whatsapp_send_log    (todo envio da plataforma passa
                                              pelo portão e registra ali)
     a lista   → public.whatsapp_conversas   (view que junta os dois)

   TEMPO REAL
     Uma inscrição no Realtime do Supabase em whatsapp_mensagens. Mensagem
     que chega aparece na hora, sem recarregar — se for da conversa aberta,
     entra no fio; se for de outra, sobe na lista com o contador.

   A JANELA DE 24 HORAS
     A Meta só entrega texto livre dentro de 24h da última mensagem DA
     PESSOA. Fora dela, só template aprovado. A tela mostra isso ANTES de
     deixar escrever — campo bloqueado e o motivo escrito — porque a
     alternativa é a resposta sumir sem ninguém entender por quê.

   SQL: sql/elarah_whatsapp_inbox.sql + sql/elarah_whatsapp_conversas.sql
   ===================================================================== */
(function () {
  'use strict';

  var estado = {
    conversas: [],
    aberta: null,        // telefone da conversa aberta
    mensagens: [],       // fio da conversa aberta, já ordenado
    canal: null,         // inscrição do Realtime
    carregando: false,
    busca: '',
    ficha: null,         // quem é a pessoa (cruzamento com reservas)
    erro: null           // falha da consulta, mostrada na tela
  };

  function sb() { return window.supabaseClient; }

  // Mesma resolução dos outros módulos do admin: variável global, depois o
  // próprio cliente, e por último o projeto conhecido.
  function urlDoSupabase() {
    try {
      if (window.SUPABASE_URL) return window.SUPABASE_URL;
      var c = sb();
      if (c && c.supabaseUrl) return c.supabaseUrl;
    } catch (_e) {}
    return 'https://nwijxjmenbfyehvscogs.supabase.co';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 5511999990000 → (11) 99999-0000. Número de fora fica como veio.
  function telefoneBonito(tel) {
    var d = String(tel || '').replace(/\D+/g, '');
    if (d.length === 13 && d.slice(0, 2) === '55') d = d.slice(2);
    else if (d.length === 12 && d.slice(0, 2) === '55') d = d.slice(2);
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return String(tel || '');
  }

  // Na lista: "14:32" se é de hoje, "ontem", senão "12/04".
  function quandoCurto(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var hoje = new Date();
    var mesmoDia = d.toDateString() === hoje.toDateString();
    if (mesmoDia) {
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    var ontem = new Date(hoje.getTime() - 86400000);
    if (d.toDateString() === ontem.toDateString()) return 'ontem';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function horaDaBolha(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // Quanto falta da janela de 24h, em texto curto.
  function restaDaJanela(ultimaRecebidaEm) {
    if (!ultimaRecebidaEm) return null;
    var fim = new Date(ultimaRecebidaEm).getTime() + 24 * 3600 * 1000;
    var falta = fim - Date.now();
    if (falta <= 0) return null;
    var h = Math.floor(falta / 3600000);
    var m = Math.floor((falta % 3600000) / 60000);
    return h > 0 ? (h + 'h' + String(m).padStart(2, '0')) : (m + ' min');
  }

  // ===== DADOS =====

  async function carregarConversas() {
    var s = sb();
    if (!s) return [];
    var r = await s.from('whatsapp_conversas')
      .select('*')
      .order('ultima_em', { ascending: false })
      .limit(300);
    if (r.error) {
      // NÃO engole: lista vazia por erro é diferente de lista vazia por não
      // ter conversa, e dizer "nenhuma conversa ainda" quando a consulta
      // falhou manda a pessoa procurar no lugar errado.
      console.error('[Conversas] falha ao listar', r.error.message);
      estado.erro = r.error.message || String(r.error);
      return [];
    }
    estado.erro = null;
    return r.data || [];
  }

  // O fio da conversa: as duas tabelas, juntadas e ordenadas por tempo.
  // São duas consultas de propósito — a view serve pra LISTA (uma linha por
  // telefone); aqui precisamos de cada mensagem, das duas origens.
  // O mesmo celular com e sem o 9 da frente: a Meta grava contas antigas
  // sem o 9 (554891907056), e o que a Elarah envia sai com o 9
  // (5548991907056). O fio junta as duas formas.
  function variantesTelefone(tel) {
    var d = String(tel || '').replace(/\D+/g, '');
    if (/^55\d{2}9\d{8}$/.test(d)) return [d, d.slice(0, 4) + d.slice(5)];
    if (/^55\d{2}[6-9]\d{7}$/.test(d)) return [d, d.slice(0, 4) + '9' + d.slice(4)];
    return [d];
  }

  async function carregarFio(telefone) {
    var s = sb();
    if (!s) return [];
    var tels = variantesTelefone(telefone);
    var res = await Promise.all([
      s.from('whatsapp_mensagens')
        .select('wa_message_id, telefone, nome_perfil, tipo, texto, media_id, media_mime, wa_timestamp, recebida_em')
        .in('telefone', tels)
        .order('wa_timestamp', { ascending: true })
        .limit(500),
      s.from('whatsapp_send_log')
        .select('dedupe_key, kind, corpo, status, error, created_at')
        .in('telefone', tels)
        .order('created_at', { ascending: true })
        .limit(500)
    ]);
    var recebidas = (res[0].data || []).map(function (m) {
      return {
        id: m.wa_message_id,
        direcao: 'recebida',
        texto: m.texto,
        tipo: m.tipo,
        temMidia: !!m.media_id,
        mime: m.media_mime,
        quando: m.wa_timestamp || m.recebida_em,
        nome: m.nome_perfil
      };
    });
    var enviadas = (res[1].data || [])
      // Só o que de fato saiu. 'pending'/'failed' viram aviso, não bolha —
      // mostrar como enviada o que não chegou seria mentir pra quem lê.
      .filter(function (m) { return m.status === 'sent' || m.status === 'failed'; })
      .map(function (m) {
        return {
          id: m.dedupe_key,
          direcao: 'enviada',
          texto: m.corpo,
          kind: m.kind,
          falhou: m.status === 'failed',
          erro: m.error,
          quando: m.created_at
        };
      });
    return recebidas.concat(enviadas).sort(function (a, b) {
      return new Date(a.quando || 0) - new Date(b.quando || 0);
    });
  }

  // Quem é a pessoa: cruza o telefone com as reservas. É o que a tela de
  // conversa de um CRM tem e o WhatsApp não — abrir a conversa e já saber
  // o que ela comprou.
  async function carregarFicha(telefone) {
    var s = sb();
    if (!s) return null;
    var d = String(telefone || '').replace(/\D+/g, '');
    // O telefone da reserva pode estar salvo com ou sem o 55 na frente.
    var semDDI = d.slice(0, 2) === '55' ? d.slice(2) : d;
    try {
      var r = await s.from('bookings')
        .select('id, nome, email, experiencia_nome, data, horario, status, created_at')
        .ilike('telefone', '%' + semDDI + '%')
        .order('created_at', { ascending: false })
        .limit(5);
      if (r.error) return null;
      return r.data || [];
    } catch (_e) { return null; }
  }

  async function marcarComoLida(telefone) {
    var s = sb();
    if (!s) return;
    try {
      await s.from('whatsapp_mensagens')
        .update({ lida_em: new Date().toISOString() })
        .eq('telefone', telefone)
        .is('lida_em', null);
    } catch (_e) { /* não é crítico */ }
  }

  async function enviarResposta(telefone, texto) {
    var s = sb();
    if (!s) return { ok: false, error: 'sem_sessao' };
    var sessao = await s.auth.getSession();
    var jwt = sessao && sessao.data && sessao.data.session
      ? sessao.data.session.access_token : null;
    if (!jwt) return { ok: false, error: 'sem_sessao' };
    var base = urlDoSupabase().replace(/\/+$/, '');
    try {
      var resp = await fetch(base + '/functions/v1/admin-whatsapp-responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
        body: JSON.stringify({ telefone: telefone, texto: texto })
      });
      return await resp.json();
    } catch (e) {
      return { ok: false, error: 'rede', detalhe: String(e) };
    }
  }

  // ===== DESENHO =====

  function desenharLista() {
    var el = document.getElementById('conversas-lista');
    if (!el) return;
    var termo = estado.busca.trim().toLowerCase();
    var itens = estado.conversas.filter(function (c) {
      if (!termo) return true;
      return String(c.nome_perfil || '').toLowerCase().indexOf(termo) >= 0 ||
        String(c.telefone || '').indexOf(termo.replace(/\D+/g, '')) >= 0 ||
        String(c.ultimo_texto || '').toLowerCase().indexOf(termo) >= 0;
    });
    if (estado.erro) {
      el.innerHTML = '<div style="padding:22px 16px;font-size:.8rem;color:#c0392b;line-height:1.6;">' +
        '<b>Não consegui ler as conversas.</b><br><br>' +
        '<code style="font-size:.74rem;word-break:break-word;">' + esc(estado.erro) + '</code>' +
        '<br><br><span style="color:#8a6a45;">Se fala em permissão ou em ' +
        '<code>whatsapp_conversas</code>, falta rodar o GRANT do ' +
        'sql/elarah_whatsapp_conversas.sql.</span></div>';
      return;
    }
    if (!itens.length) {
      el.innerHTML = '<div style="padding:28px 18px;color:#999;font-size:.85rem;text-align:center;">' +
        (termo ? 'Nada encontrado.' : 'Nenhuma conversa ainda.<br><br>' +
          'Assim que alguém responder no WhatsApp da Elarah, aparece aqui na hora.') +
        '</div>';
      return;
    }
    el.innerHTML = itens.map(function (c) {
      var ativa = c.telefone === estado.aberta;
      var nome = c.nome_perfil || telefoneBonito(c.telefone);
      var previa = (c.ultima_direcao === 'enviada' ? 'Você: ' : '') +
        (c.ultimo_texto || '(mídia)');
      return '<button type="button" class="conversa-item" data-tel="' + esc(c.telefone) + '" ' +
        'style="width:100%;text-align:left;border:none;border-bottom:1px solid #f0ece8;' +
        'background:' + (ativa ? '#fdf6ef' : '#fff') + ';padding:12px 14px;cursor:pointer;' +
        'display:flex;gap:11px;align-items:flex-start;font-family:inherit;">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:#f0a05e;color:#fff;' +
            'display:flex;align-items:center;justify-content:center;font-weight:700;' +
            'font-size:.9rem;flex:none;">' + esc(nome.trim().charAt(0).toUpperCase() || '?') + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;">' +
              '<span style="font-weight:600;font-size:.88rem;color:#2b2b2b;overflow:hidden;' +
                'text-overflow:ellipsis;white-space:nowrap;">' + esc(nome) + '</span>' +
              '<span style="font-size:.7rem;color:#999;flex:none;">' + esc(quandoCurto(c.ultima_em)) + '</span>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:2px;">' +
              '<span style="font-size:.78rem;color:#888;overflow:hidden;text-overflow:ellipsis;' +
                'white-space:nowrap;">' + esc(previa) + '</span>' +
              (Number(c.nao_lidas) > 0
                ? '<span style="background:#25d366;color:#fff;border-radius:999px;font-size:.68rem;' +
                  'font-weight:700;padding:1px 7px;flex:none;">' + Number(c.nao_lidas) + '</span>'
                : '') +
            '</div>' +
          '</div>' +
        '</button>';
    }).join('');
    el.querySelectorAll('.conversa-item').forEach(function (b) {
      b.addEventListener('click', function () { abrirConversa(b.getAttribute('data-tel')); });
    });
  }

  function desenharFio() {
    var el = document.getElementById('conversas-fio');
    var cab = document.getElementById('conversas-cabecalho');
    var rodape = document.getElementById('conversas-rodape');
    if (!el || !cab || !rodape) return;

    if (!estado.aberta) {
      cab.innerHTML = '';
      rodape.innerHTML = '';
      el.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;' +
        'color:#aaa;font-size:.9rem;text-align:center;padding:40px;">' +
        'Escolha uma conversa à esquerda.' +
        '</div>';
      return;
    }

    var conv = estado.conversas.filter(function (c) { return c.telefone === estado.aberta; })[0] || {};
    var nome = conv.nome_perfil || telefoneBonito(estado.aberta);
    var resta = restaDaJanela(conv.ultima_recebida_em);

    // ---- cabeçalho: quem é, e o que ela comprou ----
    var fichaHtml = '';
    if (estado.ficha && estado.ficha.length) {
      fichaHtml = estado.ficha.slice(0, 3).map(function (b) {
        return '<span style="font-size:.7rem;color:#8a6a45;background:#fff6ec;border:1px solid #f0e0cc;' +
          'border-radius:999px;padding:2px 9px;white-space:nowrap;">' +
          esc(b.experiencia_nome || 'reserva') +
          (b.data ? ' · ' + esc(b.data) : '') +
          (b.status && b.status !== 'pago' ? ' · ' + esc(b.status) : '') +
          '</span>';
      }).join(' ');
    }
    cab.innerHTML =
      '<div style="display:flex;align-items:center;gap:11px;padding:12px 16px;border-bottom:1px solid #eee;background:#fff;">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:#f0a05e;color:#fff;' +
          'display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;">' +
          esc(nome.trim().charAt(0).toUpperCase() || '?') + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:600;font-size:.92rem;">' + esc(nome) + '</div>' +
          '<div style="font-size:.74rem;color:#999;">' + esc(telefoneBonito(estado.aberta)) + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;max-width:55%;">' + fichaHtml + '</div>' +
      '</div>';

    // ---- o fio ----
    if (!estado.mensagens.length) {
      el.innerHTML = '<div style="padding:40px;text-align:center;color:#aaa;font-size:.85rem;">Sem mensagens.</div>';
    } else {
      el.innerHTML = estado.mensagens.map(function (m) {
        var minha = m.direcao === 'enviada';
        var corpo = m.texto ||
          (m.temMidia ? '📎 ' + (m.mime || 'arquivo') + ' — abrir mídia ainda não está pronto' : '(sem texto)');
        return '<div style="display:flex;justify-content:' + (minha ? 'flex-end' : 'flex-start') + ';margin-bottom:7px;">' +
          '<div style="max-width:72%;background:' + (minha ? '#dcf8c6' : '#fff') + ';' +
            'border:1px solid ' + (minha ? '#cdeab4' : '#eee') + ';border-radius:10px;' +
            'padding:7px 11px 5px;box-shadow:0 1px 1px rgba(0,0,0,.04);">' +
            '<div style="font-size:.86rem;color:#2b2b2b;white-space:pre-wrap;word-break:break-word;">' +
              esc(corpo) + '</div>' +
            '<div style="font-size:.66rem;color:#999;text-align:right;margin-top:3px;">' +
              (minha && m.kind && m.kind !== 'resposta' ? esc(m.kind) + ' · ' : '') +
              esc(horaDaBolha(m.quando)) +
              (m.falhou ? ' · <span style="color:#c0392b;font-weight:600;">falhou</span>' : '') +
            '</div>' +
            (m.falhou && m.erro
              ? '<div style="font-size:.66rem;color:#c0392b;margin-top:2px;">' + esc(m.erro) + '</div>'
              : '') +
          '</div>' +
        '</div>';
      }).join('');
      el.scrollTop = el.scrollHeight;
    }

    // ---- rodapé: responder, se a janela permitir ----
    if (resta) {
      rodape.innerHTML =
        '<div style="border-top:1px solid #eee;background:#fff;padding:10px 12px;">' +
          '<div style="display:flex;gap:8px;align-items:flex-end;">' +
            '<textarea id="conversas-texto" rows="1" placeholder="Escreva uma mensagem…" ' +
              'style="flex:1;resize:none;max-height:120px;padding:10px 12px;border:1px solid #ddd;' +
              'border-radius:20px;font-size:.88rem;font-family:inherit;"></textarea>' +
            '<button type="button" id="conversas-enviar" style="border:none;background:#25d366;' +
              'color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1rem;' +
              'flex:none;">➤</button>' +
          '</div>' +
          '<div id="conversas-aviso" style="font-size:.7rem;color:#999;margin-top:6px;">' +
            'Janela aberta por mais ' + esc(resta) + ' — depois disso só dá pra falar por modelo aprovado.' +
          '</div>' +
        '</div>';
      var campo = document.getElementById('conversas-texto');
      var botao = document.getElementById('conversas-enviar');
      campo.addEventListener('input', function () {
        campo.style.height = 'auto';
        campo.style.height = Math.min(campo.scrollHeight, 120) + 'px';
      });
      campo.addEventListener('keydown', function (e) {
        // Enter manda, Shift+Enter quebra linha — igual ao WhatsApp.
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); botao.click(); }
      });
      botao.addEventListener('click', async function () {
        var texto = campo.value.trim();
        if (!texto) return;
        botao.disabled = true;
        campo.disabled = true;
        var aviso = document.getElementById('conversas-aviso');
        var r = await enviarResposta(estado.aberta, texto);
        if (r && r.ok) {
          campo.value = '';
          campo.style.height = 'auto';
          await abrirConversa(estado.aberta, true);
          carregarEListar();
        } else {
          if (aviso) {
            aviso.innerHTML = '<span style="color:#c0392b;">Não enviou: ' +
              esc((r && (r.detalhe || r.error)) || 'erro desconhecido') + '</span>';
          }
          botao.disabled = false;
          campo.disabled = false;
        }
      });
      campo.focus();
    } else {
      rodape.innerHTML =
        '<div style="border-top:1px solid #eee;background:#fffaf5;padding:14px 16px;font-size:.78rem;color:#8a6a45;">' +
          '<b>A janela de 24 horas fechou.</b> A Meta só entrega texto livre até 24h depois da ' +
          'última mensagem dela. Pra falar agora, seria preciso um modelo aprovado — ' +
          'ou esperar ela escrever de novo, o que reabre a janela.' +
        '</div>';
    }
  }

  // ===== AÇÕES =====

  async function abrirConversa(telefone, semMarcar) {
    estado.aberta = telefone;
    estado.mensagens = [];
    estado.ficha = null;
    desenharLista();
    desenharFio();
    var r = await Promise.all([carregarFio(telefone), carregarFicha(telefone)]);
    estado.mensagens = r[0];
    estado.ficha = r[1];
    desenharFio();
    if (!semMarcar) {
      await marcarComoLida(telefone);
      // Zera o contador na lista sem ir ao banco de novo.
      estado.conversas.forEach(function (c) {
        if (c.telefone === telefone) c.nao_lidas = 0;
      });
      desenharLista();
    }
  }

  async function carregarEListar() {
    estado.conversas = await carregarConversas();
    desenharLista();
    if (estado.aberta) desenharFio();
    var badge = document.getElementById('conversas-contador');
    if (badge) {
      var total = estado.conversas.reduce(function (s, c) { return s + (Number(c.nao_lidas) || 0); }, 0);
      badge.textContent = total ? String(total) : '';
      badge.style.display = total ? 'inline-block' : 'none';
    }
  }

  // ===== TEMPO REAL =====
  // Uma inscrição só, em INSERT de whatsapp_mensagens. Chegou mensagem:
  // se é da conversa aberta, entra no fio na hora; de qualquer jeito a
  // lista é recarregada pra subir a conversa e atualizar o contador.
  function ligarTempoReal() {
    var s = sb();
    if (!s || !s.channel || estado.canal) return;
    try {
      estado.canal = s.channel('conversas-whatsapp')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'whatsapp_mensagens' },
          function (payload) {
            var nova = payload && payload.new;
            if (!nova) return;
            if (nova.telefone === estado.aberta) {
              estado.mensagens.push({
                id: nova.wa_message_id,
                direcao: 'recebida',
                texto: nova.texto,
                tipo: nova.tipo,
                temMidia: !!nova.media_id,
                mime: nova.media_mime,
                quando: nova.wa_timestamp || nova.recebida_em,
                nome: nova.nome_perfil
              });
              desenharFio();
              marcarComoLida(nova.telefone);
            }
            carregarEListar();
          })
        .subscribe();
    } catch (e) {
      console.warn('[Conversas] tempo real indisponível', e);
    }
  }

  // ===== ENTRADA =====

  async function run() {
    if (estado.carregando) return;
    estado.carregando = true;
    try {
      var busca = document.getElementById('conversas-busca');
      if (busca && !busca._ligado) {
        busca._ligado = true;
        busca.addEventListener('input', function () {
          estado.busca = busca.value || '';
          desenharLista();
        });
      }
      var atualizar = document.getElementById('conversas-atualizar');
      if (atualizar && !atualizar._ligado) {
        atualizar._ligado = true;
        atualizar.addEventListener('click', function () { carregarEListar(); });
      }
      await carregarEListar();
      ligarTempoReal();
    } finally {
      estado.carregando = false;
    }
  }

  window.ElarahConversas = { run: run };
})();
