/* =====================================================================
   promo.js — DESCONTO GERAL DO SITE (fonte única do navegador)
   ---------------------------------------------------------------------
   Um percentual que vale pra TODAS as experiências ao mesmo tempo,
   com validade. Enquanto a janela estiver aberta:

     preço promocional = PREÇO DO SITE - PERCENTUAL%

   A base é o preço que está no ar (experiences.preco) — o mesmo que a
   cliente vê antes da campanha. É o que faz o banner ser verdade:
   anunciou 20%, ela paga 20% a menos do que pagaria ontem.

   QUEM MANDA É O ADMIN: a configuração (ativo, percentual, início,
   fim, textos) mora na tabela public.desconto_geral e é editada na aba
   "Desconto geral" do painel. Nada aqui é chumbado — sem o banco, ou
   com a linha desligada, o site simplesmente não dá desconto nenhum.

   POR QUE O PADRÃO É "SEM DESCONTO": se a leitura do banco falhar, a
   vitrine mostra o preço cheio e o servidor cobra o preço cheio. Os
   dois erram pro mesmo lado. O contrário — vitrine anunciando 20% que
   a cobrança não honra — seria propaganda enganosa.

   ORDEM DE CARREGAMENTO: quem desenha preço espera por carregar().
   O experiences-data.js faz isso dentro do próprio load do catálogo,
   então nenhuma tela pinta preço antes do desconto ser conhecido.

   ATENÇÃO — A MESMA REGRA EXISTE NO BACKEND:
   supabase/functions/_shared/promo.ts lê a MESMA tabela e recalcula o
   preço na hora de cobrar (o preço nunca vem do cliente). As duas
   implementações precisam concordar na conta; a configuração, essa
   sim, é uma só — o banco.
   ===================================================================== */
(function (window) {
  'use strict';

  // Tabela de linha única com a configuração (sql/elarah_desconto_geral.sql).
  var TABELA = 'desconto_geral';

  // Estado efetivo. Começa desligado: sem resposta do banco, sem
  // desconto — nem na tela, nem na cobrança.
  var CONFIG = {
    ATIVA: false,
    PERCENTUAL: 0,
    INICIO: null,
    FIM: null,
    TITULO: null,
    SUBTITULO: null,
  };

  // Desconto do carrinho (ver bloco DESCONTO DO CARRINHO mais abaixo).
  var CARRINHO_1_PCT = 10;
  var CARRINHO_2_MAIS_PCT = 15;
  // Validade: até 30/09/2026 23h59 (horário de Brasília) — igual ao
  // DESCONTO_CARRINHO_FIM do servidor (_shared/promo.ts).
  var CARRINHO_FIM = '2026-09-30T23:59:59-03:00';

  function carrinhoAtivo() {
    var fim = new Date(CARRINHO_FIM).getTime();
    return !isNaN(fim) && Date.now() <= fim;
  }

  var carregado = false;
  var carregarPromise = null;

  // Lê a configuração do banco. Idempotente: várias chamadas
  // simultâneas compartilham a mesma promise (o catálogo, o banner e
  // a página de detalhe chamam quase ao mesmo tempo).
  function carregar() {
    if (carregarPromise) return carregarPromise;
    carregarPromise = (async function () {
      try {
        var s = window.supabaseClient;
        if (!s && window.ElarahSupabase && typeof window.ElarahSupabase.waitClient === 'function') {
          s = await window.ElarahSupabase.waitClient(8000);
        }
        if (!s) {
          console.info('[Elarah Promo] Supabase indisponível — sem desconto geral.');
          return CONFIG;
        }
        var res = await s.from(TABELA).select('*').eq('id', 1).maybeSingle();
        if (res.error) {
          // Tabela ainda não migrada (sql/elarah_desconto_geral.sql) ou
          // erro de leitura: segue sem desconto.
          console.warn('[Elarah Promo] não foi possível ler o desconto geral:', res.error.message);
          return CONFIG;
        }
        if (res.data) aplicarLinha(res.data);
      } catch (e) {
        console.warn('[Elarah Promo] exceção ao ler o desconto geral:', e);
      } finally {
        carregado = true;
      }
      return CONFIG;
    })();
    return carregarPromise;
  }

  // Row do banco → CONFIG. Tolerante: qualquer campo inválido
  // simplesmente não liga o desconto.
  function aplicarLinha(row) {
    var pct = Number(row.percentual);
    CONFIG.PERCENTUAL = (isFinite(pct) && pct > 0 && pct <= 90) ? Math.round(pct) : 0;
    CONFIG.ATIVA = row.ativo === true && CONFIG.PERCENTUAL > 0;
    CONFIG.INICIO = row.inicio || null;
    CONFIG.FIM = row.fim || null;
    CONFIG.TITULO = (row.titulo && String(row.titulo).trim()) || null;
    CONFIG.SUBTITULO = (row.subtitulo && String(row.subtitulo).trim()) || null;
  }

  // Data final formatada pra usar em texto ("20/09").
  function fimCurto() {
    if (!CONFIG.FIM) return '';
    var d = new Date(CONFIG.FIM);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0');
  }

  // O desconto está valendo AGORA? Datas inválidas ou faltando
  // desligam (falha pro lado seguro: preço normal).
  function geralAtiva() {
    if (!CONFIG.ATIVA || !CONFIG.PERCENTUAL) return false;
    if (!CONFIG.INICIO || !CONFIG.FIM) return false;
    var agora = Date.now();
    var ini = new Date(CONFIG.INICIO).getTime();
    var fim = new Date(CONFIG.FIM).getTime();
    if (isNaN(ini) || isNaN(fim)) return false;
    return agora >= ini && agora <= fim;
  }

  // Aplica o desconto sobre um valor em centavos. Devolve null pra
  // entrada inválida — quem chama decide o fallback.
  // Percentual que a VITRINE mostra: o da campanha geral quando ela
  // está no ar; senão, o desconto do carrinho de 1 pessoa (10%) — o
  // mínimo que qualquer compra de experiência leva.
  function percentualVitrine() {
    if (geralAtiva()) return CONFIG.PERCENTUAL;
    return carrinhoAtivo() ? CARRINHO_1_PCT : 0;
  }

  // A vitrine está mostrando preço com desconto? (campanha geral OU
  // desconto do carrinho). É o que experiences-data.js consulta.
  function ativa() {
    return percentualVitrine() > 0;
  }

  // preço de vitrine (centavos) → preço do site (centavos). Guardado a
  // cada conversão pra o checkout conseguir partir do preço do site
  // exato quando precisa aplicar os 15% (2+ pessoas).
  var BASE_DE = {};

  function centavos(base) {
    var n = Number(base);
    if (!isFinite(n) || n <= 0) return null;
    var pct = percentualVitrine();
    if (!pct) return Math.round(n);
    var com = Math.round(n * (100 - pct) / 100);
    if (!geralAtiva()) BASE_DE[com] = Math.round(n);
    return com;
  }

  // Preço de vitrine → preço do site. Sem registro, desfaz a conta
  // (exato pra preços em reais redondos, que é o catálogo inteiro).
  function baseDe(vitrineCents) {
    var v = Math.round(Number(vitrineCents));
    if (!isFinite(v) || v <= 0) return v;
    if (BASE_DE[v]) return BASE_DE[v];
    if (geralAtiva() || !carrinhoAtivo()) return v;
    return Math.round(v * 100 / (100 - CARRINHO_1_PCT));
  }

  // "R$ 180" → 18000. Mesmo parser do formatPrecoBR (formato BR:
  // vírgula é decimal, ponto é milhar).
  function paraCentavos(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!s) return null;
    var match = s.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*$/);
    if (!match) return null;
    var clean = match[1].replace(/\./g, '').replace(/\s+/g, '').replace(',', '.');
    var n = parseFloat(clean);
    if (!isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }

  // Aplica o desconto num RÓTULO de preço e devolve outro rótulo:
  // "R$ 180" → "R$ 144". Usado nos preços de variação (Individual,
  // Dupla, Trio...), que não têm valor cheio próprio — ali a base do
  // desconto é o preço da própria opção.
  // Texto sem número ("Sob consulta") volta intacto.
  function label(raw) {
    if (!ativa()) return raw;
    var base = paraCentavos(raw);
    if (!base) return raw;
    var com = centavos(base);
    if (!com) return raw;
    return formatar(com);
  }

  // Centavos → "R$ 1.380,50" (centavos só quando existem de verdade).
  function formatar(cents) {
    var n = Number(cents) / 100;
    if (!isFinite(n)) return '';
    var hasCents = n % 1 !== 0;
    return 'R$ ' + n.toLocaleString('pt-BR', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  // Copia uma lista de variações (Individual/Dupla/Trio, kits...)
  // aplicando o desconto no preço de cada opção. Variação não tem
  // valor cheio próprio, então a base é o preço da própria opção.
  //
  // Devolve SEMPRE uma cópia: a lista original (exp.variantItems) é o
  // dado de cadastro que o admin edita e grava no banco — se a gente
  // mexesse nela, um salvar no admin gravaria o preço promocional como
  // preço oficial e o desconto viraria permanente.
  function itensComDesconto(items) {
    if (!Array.isArray(items)) return [];
    if (!ativa()) return items.slice();
    return items.map(function (it) {
      if (!it || typeof it !== 'object') return it;
      var copia = {};
      for (var k in it) { if (Object.prototype.hasOwnProperty.call(it, k)) copia[k] = it[k]; }
      if (copia.preco && String(copia.preco).trim()) copia.preco = label(copia.preco);
      return copia;
    });
  }

  // Textos do aviso. O admin pode escrever os dele nos campos de texto
  // da aba "Desconto geral"; vazio = o site monta sozinho a partir do
  // percentual e da data de fim, que é o que a maioria das campanhas
  // precisa.
  function tituloDoAviso() {
    return CONFIG.TITULO || (CONFIG.PERCENTUAL + '% OFF em todas as experiências');
  }

  // "Acaba hoje à meia-noite" vale mais que "Só até 18/09": quem lê a
  // data precisa parar pra lembrar que dia é hoje; "hoje" é imediato.
  function subtituloDoAviso() {
    if (CONFIG.SUBTITULO) return CONFIG.SUBTITULO;
    if (!CONFIG.FIM) return '';
    var f = new Date(CONFIG.FIM);
    if (isNaN(f.getTime())) return '';
    var agora = new Date();
    var mesmoDia = function (a, b) {
      return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    };
    var amanha = new Date(agora.getTime() + 86400000);
    // Meia-noite "de verdade" inclui 23h59 e 23h59m59s — é assim que a
    // admin escreve o fim de um dia no formulário.
    var viraOdia = f.getHours() === 23 && f.getMinutes() >= 55;
    if (mesmoDia(f, agora)) {
      return viraOdia ? 'Acaba hoje à meia-noite'
        : ('Acaba hoje às ' + f.getHours() + 'h' + (f.getMinutes() ? String(f.getMinutes()).padStart(2, '0') : ''));
    }
    if (mesmoDia(f, amanha)) return viraOdia ? 'Só até amanhã' : 'Só até amanhã';
    return 'Só até ' + fimCurto();
  }

  // ===== DESCONTO DO CARRINHO (progressivo por quantidade) =====
  // Toda experiência no carrinho sai com desconto:
  //   1 pessoa          → 10% OFF
  //   2 pessoas ou mais → 15% OFF em CADA pessoa
  // Só o preço da experiência desconta: a taxa do cartão é calculada
  // depois, em cima do valor descontado, e continua sendo cobrada.
  //
  // NÃO acumula com o desconto geral: com campanha no ar, vale a
  // campanha (o preço na tela já é o dela).
  //
  // A MESMA REGRA EXISTE NO SERVIDOR (_shared/promo.ts,
  // precoFinalCentavos) — é ele quem cobra. As duas contas precisam
  // bater centavo por centavo.

  // Percentual do carrinho pra essa quantidade (0 = não se aplica).
  function carrinhoPct(qtd) {
    if (geralAtiva() || !carrinhoAtivo()) return 0;
    var q = Math.floor(Number(qtd));
    if (!isFinite(q) || q < 1) return 0;
    return q >= 2 ? CARRINHO_2_MAIS_PCT : CARRINHO_1_PCT;
  }

  // Preço UNITÁRIO cobrado pra essa quantidade. `vitrineCents` é o
  // preço que a vitrine/checkout mostram (já com os 10% de 1 pessoa).
  // Com 2+ pessoas, volta ao preço do site e aplica 15% — a mesma conta
  // do servidor (precoFinalCentavos). Com campanha geral no ar, devolve
  // o mesmo valor.
  function carrinhoCentavos(vitrineCents, qtd) {
    var v = Math.round(Number(vitrineCents));
    if (!isFinite(v) || v <= 0) return v;
    if (geralAtiva()) return v;
    // Se o prazo virou com a página aberta, o preço da tela (com 10%)
    // está vencido: volta ao preço do site, que é o que o servidor cobra.
    var base = BASE_DE[v] || baseDe(v);
    var pct = carrinhoPct(qtd);
    var com = Math.round(base * (100 - pct) / 100);
    return com > 0 ? com : base;
  }

  // ===== CONTAGEM REGRESSIVA =====
  // Prazo em horas é o que mais move: a pessoa vê o tempo andando e
  // decide agora. Mas só aparece quando falta POUCO — "acaba em 9d 4h"
  // não apressa ninguém e ainda entrega que dá pra deixar pra depois.
  var LIMITE_CONTAGEM_MS = 48 * 3600 * 1000;

  function msRestantes(fimIso) {
    var fimRef = fimIso || CONFIG.FIM;
    if (!fimRef) return 0;
    var f = new Date(fimRef).getTime();
    return isNaN(f) ? 0 : (f - Date.now());
  }

  // Os SEGUNDOS aparecem sempre, não só no último minuto: é o dígito
  // mudando na frente da pessoa que cria urgência. Um contador parado em
  // "5h12" parece um aviso; o mesmo prazo com o segundo correndo parece
  // um relógio andando contra ela.
  //
  // As unidades maiores somem quando zeram (5h 12min 07s → 12min 07s →
  // 07s), pra frase não carregar zero à toa no fim.
  function rotuloContagem(ms) {
    if (ms <= 0) return '';
    var totalSeg = Math.floor(ms / 1000);
    var h = Math.floor(totalSeg / 3600);
    var m = Math.floor((totalSeg % 3600) / 60);
    var seg = totalSeg % 60;
    var ss = String(seg).padStart(2, '0') + 's';
    if (h >= 1) return 'acaba em ' + h + 'h ' + String(m).padStart(2, '0') + 'min ' + ss;
    if (m >= 1) return 'acaba em ' + m + 'min ' + ss;
    return 'acaba em ' + ss;
  }

  // ===== Aviso no topo do site =====
  // Injetado por JS em vez de copiado no HTML de 50+ páginas: quando a
  // promoção acabar, some de tudo de uma vez.
  function renderBanner() {
    if (!ativa()) return;
    var ehCarrinho = !geralAtiva();
    if (document.getElementById('elarah-promo-bar')) return;
    // Páginas internas (admin) não recebem o aviso.
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('admin') !== -1) return;
    if (ehCarrinho) { renderMesDoCliente(); return; }

    injetarEstilo();

    var bar = document.createElement('div');
    bar.id = 'elarah-promo-bar';
    bar.setAttribute('role', 'status');

    var titulo = document.createElement('strong');
    titulo.className = 'elarah-promo-bar__titulo';
    titulo.textContent = tituloDoAviso();

    var sub = document.createElement('span');
    sub.className = 'elarah-promo-bar__sub';
    sub.textContent = subtituloDoAviso();

    bar.appendChild(titulo);
    bar.appendChild(sub);

    // A contagem é um leitor de tela falando a cada segundo se ficar
    // dentro do role="status" — por isso aria-hidden. O texto fixo ao
    // lado já diz o essencial ("acaba hoje à meia-noite").
    var relogio = document.createElement('span');
    relogio.className = 'elarah-promo-bar__relogio';
    relogio.setAttribute('aria-hidden', 'true');
    bar.appendChild(relogio);

    // Vai como primeiro elemento do body: o header é sticky (não
    // fixed), então a barra rola pra fora e o header continua colando
    // no topo normalmente.
    if (document.body.firstChild) {
      document.body.insertBefore(bar, document.body.firstChild);
    } else {
      document.body.appendChild(bar);
    }

    // Desconto do carrinho não tem prazo: sem contagem (e sem o aviso
    // de "a promoção acabou", que dispararia com a data da campanha
    // geral já vencida).
    iniciarContagem(bar, relogio, null);
  }

  function iniciarContagem(bar, relogio, fimIso) {
    var timer = null;

    function tick() {
      var ms = msRestantes(fimIso);
      if (ms <= 0) {
        if (timer) clearInterval(timer);
        encerrar(bar);
        return;
      }
      relogio.textContent = ms <= LIMITE_CONTAGEM_MS ? rotuloContagem(ms) : '';
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  // Virou a hora com a página aberta. Os preços na tela foram desenhados
  // ANTES do fim e agora estão vencidos — o servidor já voltou a cobrar
  // cheio (ele relê a configuração a cada 30s).
  //
  // NÃO recarrega sozinho de propósito: recarregar apagaria o formulário
  // de quem está no meio do checkout. Em vez disso, avisa e deixa a
  // cliente atualizar quando ela quiser.
  function encerrar(bar) {
    bar.classList.add('elarah-promo-bar--fim');
    bar.textContent = '';

    var texto = document.createElement('strong');
    texto.className = 'elarah-promo-bar__titulo';
    texto.textContent = bar.getAttribute('data-fim-titulo') || 'A promoção acabou';

    var aviso = document.createElement('span');
    aviso.className = 'elarah-promo-bar__sub';
    aviso.textContent = 'Os preços voltaram ao normal.';

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'elarah-promo-bar__btn';
    botao.textContent = 'Atualizar página';
    botao.addEventListener('click', function () { location.reload(); });

    bar.appendChild(texto);
    bar.appendChild(aviso);
    bar.appendChild(botao);
  }

  // =============================================================
  // FAIXA "MÊS DO CLIENTE" (desconto do carrinho)
  // -------------------------------------------------------------
  // Pouco texto, muito impacto, tudo no laranja da marca: ícone de
  // presente, "MÊS DO CLIENTE", selo "ATÉ 15% OFF", uma frase curta que
  // alterna explicando o "até" (10% / 15% com 2+), selo de urgência
  // ("ÚLTIMOS DIAS" / "ÚLTIMO DIA"), relógio em caixinhas e botão.
  // A faixa inteira é clicável e leva pras experiências.
  // =============================================================
  var ICONE_PRESENTE =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/>' +
    '<path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>' +
    '<path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>';

  function renderMesDoCliente() {
    injetarEstiloMesCliente();

    var bar = document.createElement('a');
    bar.id = 'elarah-promo-bar';
    bar.className = 'mc';
    bar.href = '/#experiencias';
    bar.setAttribute('aria-label', 'Mês do Cliente: ' + CARRINHO_1_PCT + '% OFF em qualquer experiência, ' +
      CARRINHO_2_MAIS_PCT + '% OFF por pessoa levando 2 ou mais. Ver experiências.');

    bar.innerHTML =
      '<span class="mc__brilho" aria-hidden="true"></span>' +
      '<span class="mc__linha">' +
        '<span class="mc__tag">' + ICONE_PRESENTE + '<span>Mês do Cliente</span></span>' +
        '<span class="mc__off"><small>até</small><b>' + CARRINHO_2_MAIS_PCT + '%</b><em>OFF</em></span>' +
      '</span>' +
      '<span class="mc__frases" aria-hidden="true">' +
        '<span><b>' + CARRINHO_1_PCT + '%</b> em qualquer experiência</span>' +
        '<span><b>' + CARRINHO_2_MAIS_PCT + '%</b> levando 2 ou mais</span>' +
      '</span>' +
      '<span class="mc__linha">' +
        '<span class="mc__urgente" aria-hidden="true"></span>' +
        '<span class="mc__relogio" aria-hidden="true"></span>' +
        '<span class="mc__cta">Aproveitar <span class="mc__seta">→</span></span>' +
      '</span>';

    if (document.body.firstChild) document.body.insertBefore(bar, document.body.firstChild);
    else document.body.appendChild(bar);

    var relogio = bar.querySelector('.mc__relogio');
    var urgente = bar.querySelector('.mc__urgente');
    var timer = null;
    function caixa(n, un) {
      return '<span class="mc__cx"><b>' + String(n).padStart(2, '0') + '</b><small>' + un + '</small></span>';
    }
    function tick() {
      var ms = msRestantes(CARRINHO_FIM);
      if (ms <= 0) {
        if (timer) clearInterval(timer);
        // Troca o link por uma faixa comum (botão dentro de link não vale).
        var fim = document.createElement('div');
        fim.id = 'elarah-promo-bar';
        fim.setAttribute('role', 'status');
        fim.setAttribute('data-fim-titulo', 'O Mês do Cliente acabou');
        injetarEstilo();
        bar.parentNode.replaceChild(fim, bar);
        encerrar(fim);
        return;
      }
      // Urgência só quando é verdade: último dia / últimos 3 dias.
      var txt = ms <= 86400000 ? 'Último dia' : (ms <= 3 * 86400000 ? 'Últimos dias' : '');
      if (urgente.textContent !== txt) urgente.textContent = txt;
      var t = Math.floor(ms / 1000);
      var d = Math.floor(t / 86400);
      var h = Math.floor((t % 86400) / 3600);
      var m = Math.floor((t % 3600) / 60);
      var sg = t % 60;
      relogio.innerHTML = (d ? caixa(d, 'd') : '') + caixa(h, 'h') + caixa(m, 'm') + caixa(sg, 's');
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  function injetarEstiloMesCliente() {
    if (document.getElementById('elarah-mc-style')) return;
    var st = document.createElement('style');
    st.id = 'elarah-mc-style';
    st.textContent = [
      '#elarah-promo-bar.mc{position:relative;z-index:101;display:flex;align-items:center;justify-content:center;',
      'gap:10px 24px;flex-wrap:wrap;padding:10px 16px;overflow:hidden;text-decoration:none;color:#fff;',
      'font-family:inherit;line-height:1;cursor:pointer;',
      'background:linear-gradient(90deg,#e2833c 0%,#f27623 35%,#f0a05e 65%,#e2833c 100%);',
      'background-size:200% 100%;animation:mcFundo 8s ease-in-out infinite;}',
      '.mc__linha{display:flex;align-items:center;gap:12px;position:relative;z-index:2;}',
      // ícone + MÊS DO CLIENTE
      '.mc__tag{display:inline-flex;align-items:center;gap:8px;font-weight:900;text-transform:uppercase;',
      'letter-spacing:2px;font-size:1.12rem;line-height:1.25;padding-top:2px;color:#fff;',
      'text-shadow:0 2px 0 rgba(160,70,10,.3);}',
      '.mc__tag svg{flex:0 0 auto;filter:drop-shadow(0 2px 0 rgba(160,70,10,.3));animation:mcBalanca 2.4s ease-in-out infinite;transform-origin:50% 90%;}',
      // selo 15% OFF
      '.mc__off{display:inline-flex;align-items:center;gap:4px;padding:6px 12px 6px 10px;border-radius:12px;',
      'background:#fff;color:#c55a12;transform:rotate(-3deg);box-shadow:0 4px 14px rgba(150,60,0,.3);',
      'animation:mcPulse 1.6s ease-in-out infinite;}',
      '.mc__off small{font-size:.62rem;font-weight:800;text-transform:uppercase;writing-mode:vertical-rl;',
      'transform:rotate(180deg);letter-spacing:1px;color:#e2833c;}',
      '.mc__off b{font-size:1.75rem;font-weight:900;letter-spacing:-1px;color:#f27623;}',
      '.mc__off em{font-style:normal;font-weight:900;font-size:.95rem;}',
      // frase que alterna (explica o "até")
      '.mc__frases{position:relative;z-index:2;display:inline-grid;font-size:.92rem;font-weight:700;white-space:nowrap;}',
      '.mc__frases>span{grid-area:1/1;opacity:0;animation:mcFrase 6s ease-in-out infinite;text-align:center;}',
      '.mc__frases>span:nth-child(2){animation-delay:3s;}',
      '.mc__frases b{font-weight:900;font-size:1.05rem;}',
      // ÚLTIMOS DIAS
      '.mc__urgente:not(:empty){display:inline-block;padding:5px 10px;border-radius:999px;background:#b8430b;',
      'color:#fff;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;',
      'box-shadow:0 0 0 2px rgba(255,255,255,.55);animation:mcPisca 1.2s ease-in-out infinite;}',
      '.mc__urgente:empty{display:none;}',
      // relógio: caixinhas brancas, número laranja
      '.mc__relogio{display:flex;align-items:center;gap:5px;}',
      '.mc__cx{display:inline-flex;align-items:baseline;gap:1px;min-width:36px;justify-content:center;padding:6px 6px;',
      'border-radius:8px;background:#fff;color:#e2682a;box-shadow:0 2px 6px rgba(150,60,0,.22);}',
      '.mc__cx b{font-size:1.02rem;font-weight:900;font-variant-numeric:tabular-nums;}',
      '.mc__cx small{font-size:.62rem;font-weight:800;opacity:.8;}',
      // botão
      '.mc__cta{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;',
      'background:#fff;color:#e2682a;font-weight:900;font-size:.88rem;',
      'box-shadow:0 4px 12px rgba(150,60,0,.25);white-space:nowrap;}',
      '.mc__seta{display:inline-block;animation:mcSeta 1.1s ease-in-out infinite;}',
      '#elarah-promo-bar.mc:hover .mc__cta{filter:brightness(1.05);transform:translateY(-1px);}',
      // brilho que atravessa a faixa
      '.mc__brilho{position:absolute;inset:0;z-index:1;pointer-events:none;',
      'background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.28) 50%,transparent 60%);',
      'transform:translateX(-100%);animation:mcBrilho 3.5s ease-in-out infinite;}',
      '@keyframes mcFundo{0%,100%{background-position:0 0}50%{background-position:100% 0}}',
      '@keyframes mcPulse{0%,100%{transform:rotate(-3deg) scale(1)}50%{transform:rotate(-3deg) scale(1.06)}}',
      '@keyframes mcSeta{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}',
      '@keyframes mcBrilho{0%{transform:translateX(-100%)}60%,100%{transform:translateX(100%)}}',
      '@keyframes mcBalanca{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(10deg)}60%{transform:rotate(0)}}',
      '@keyframes mcPisca{0%,100%{opacity:1}50%{opacity:.55}}',
      '@keyframes mcFrase{0%{opacity:0;transform:translateY(6px)}8%,42%{opacity:1;transform:none}50%,100%{opacity:0;transform:translateY(-6px)}}',
      '@media (max-width:640px){',
      '#elarah-promo-bar.mc{gap:7px;padding:9px 10px;flex-direction:column;}',
      '.mc__linha{gap:8px;}',
      '.mc__tag{font-size:.98rem;letter-spacing:1.5px;gap:6px;}',
      '.mc__tag svg{width:18px;height:18px;}',
      '.mc__off b{font-size:1.4rem;}',
      '.mc__frases{font-size:.84rem;}',
      '.mc__urgente:not(:empty){font-size:.62rem;padding:4px 7px;}',
      '.mc__cx{min-width:30px;padding:5px 4px;}',
      '.mc__cx b{font-size:.9rem;}',
      '.mc__cta{padding:7px 12px;font-size:.8rem;}',
      '}',
      '@media (max-width:380px){',
      '.mc__linha{gap:5px;}',
      '.mc__urgente:not(:empty){letter-spacing:.3px;padding:4px 6px;}',
      '.mc__cx{min-width:27px;padding:5px 3px;}',
      '.mc__cta{padding:7px 10px;}',
      '}',
      '@media (prefers-reduced-motion:reduce){',
      '#elarah-promo-bar.mc,.mc__off,.mc__seta,.mc__brilho,.mc__tag svg,.mc__urgente{animation:none!important;}',
      '.mc__frases>span{animation:none!important;opacity:0;}',
      '.mc__frases>span:first-child{opacity:1;}',
      '}',
    ].join('');
    document.head.appendChild(st);
  }

  // CSS da barra num <style> só: inline não cobre media query, e o
  // celular é de onde vem a maior parte do tráfego — sem isto o título
  // e a contagem se espremem numa linha só em tela estreita.
  function injetarEstilo() {
    if (document.getElementById('elarah-promo-bar-style')) return;
    var st = document.createElement('style');
    st.id = 'elarah-promo-bar-style';
    st.textContent = [
      '#elarah-promo-bar{background:linear-gradient(90deg,#f0a05e,#e2833c);color:#fff;',
      'text-align:center;padding:9px 16px;font-family:inherit;font-size:.84rem;',
      'line-height:1.35;font-weight:600;letter-spacing:.2px;position:relative;z-index:101;}',
      '#elarah-promo-bar.elarah-promo-bar--fim{background:#6b6b6b;}',
      '.elarah-promo-bar__titulo{font-weight:800;}',
      '.elarah-promo-bar__sub{font-weight:500;opacity:.92;margin-left:8px;}',
      // A contagem é o único pedaço que muda sozinho: cápsula própria pra
      // o olho achar sem reler a frase inteira. Largura mínima + números
      // tabulares evitam a barra "pulsando" a cada segundo que muda.
      '.elarah-promo-bar__relogio:not(:empty){display:inline-block;margin-left:10px;',
      'padding:2px 10px;border-radius:999px;background:rgba(255,255,255,.22);',
      'font-weight:800;font-variant-numeric:tabular-nums;min-width:152px;}',
      '.elarah-promo-bar__btn{margin-left:10px;padding:3px 12px;border-radius:999px;',
      'border:1px solid rgba(255,255,255,.7);background:transparent;color:#fff;',
      'font-family:inherit;font-size:.78rem;font-weight:700;cursor:pointer;}',
      '@media (max-width:560px){',
      '#elarah-promo-bar{padding:8px 12px;font-size:.78rem;}',
      '.elarah-promo-bar__sub{display:block;margin-left:0;}',
      '.elarah-promo-bar__relogio:not(:empty){margin-left:0;margin-top:3px;}',
      '}',
    ].join('');
    document.head.appendChild(st);
  }

  window.ElarahPromo = {
    CONFIG: CONFIG,
    // Carrega a configuração do banco. Quem desenha preço DEVE esperar
    // por esta promise antes de pintar qualquer valor na tela.
    carregar: carregar,
    carregado: function () { return carregado; },
    ativa: ativa,
    percentual: function () { return CONFIG.PERCENTUAL; },
    centavos: centavos,
    label: label,
    itensComDesconto: itensComDesconto,
    formatar: formatar,
    paraCentavos: paraCentavos,
    fimCurto: fimCurto,
    geralAtiva: geralAtiva,
    carrinhoAtivo: carrinhoAtivo,
    baseDe: baseDe,
    carrinhoPct: carrinhoPct,
    carrinhoCentavos: carrinhoCentavos,
  };

  // O aviso só pode ser desenhado depois de saber se existe desconto —
  // e o body precisa existir pra receber a barra.
  function iniciar() {
    carregar().then(renderBanner).catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})(window);
