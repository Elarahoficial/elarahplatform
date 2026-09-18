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
  function ativa() {
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
  function centavos(base) {
    var n = Number(base);
    if (!isFinite(n) || n <= 0) return null;
    if (!ativa()) return Math.round(n);
    return Math.round(n * (100 - CONFIG.PERCENTUAL) / 100);
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

  // ===== CONTAGEM REGRESSIVA =====
  // Prazo em horas é o que mais move: a pessoa vê o tempo andando e
  // decide agora. Mas só aparece quando falta POUCO — "acaba em 9d 4h"
  // não apressa ninguém e ainda entrega que dá pra deixar pra depois.
  var LIMITE_CONTAGEM_MS = 48 * 3600 * 1000;

  function msRestantes() {
    if (!CONFIG.FIM) return 0;
    var f = new Date(CONFIG.FIM).getTime();
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
    if (document.getElementById('elarah-promo-bar')) return;
    // Páginas internas (admin) não recebem o aviso.
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('admin') !== -1) return;

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

    iniciarContagem(bar, relogio);
  }

  function iniciarContagem(bar, relogio) {
    var timer = null;

    function tick() {
      var ms = msRestantes();
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
    texto.textContent = 'A promoção acabou';

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
