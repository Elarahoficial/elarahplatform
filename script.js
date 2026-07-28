/* =============================================================
   ELARAH — script.js
   -------------------------------------------------------------
   Versão explícita pra diagnóstico de cache. Se você NÃO vê esse
   log no console do navegador, o browser ou CDN está servindo
   um script.js antigo.
   ============================================================= */
console.info('[Elarah] script.js v28 — cupons: validação via RPC direto (não depende de Edge Function deployada)');

// ===== MOBILE HEADER (compartilhado entre páginas) =====
// Centraliza o comportamento do hambúrguer + dropdown Explorar.
// Idempotente: chamar várias vezes não duplica listeners.
// Usado em script.js (home/categoria/dia-das-mães/oferecer) e
// inline em presentear.js (página standalone que não carrega script.js).
window.initMobileHeader = function () {
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.querySelector('.header__nav');
  if (!toggle || !nav) return;
  if (toggle.dataset.elarahHeaderInit === '1') return;
  toggle.dataset.elarahHeaderInit = '1';

  // Trava/destrava o scroll da página enquanto o menu está aberto.
  // Sem isso, com "Explorar" aberto o menu fica mais alto que a tela e
  // o gesto de arrastar rolava a página (fechando o menu — "subia e
  // saía da tela"). overflow:hidden NÃO segura no iOS Safari; o método
  // confiável é fixar o body compensando o scroll atual, restaurado ao
  // fechar. Com o body travado, o arrasto rola o próprio menu.
  function lockBody() {
    if (document.body.dataset.elarahScrollLock === '1') return;
    const y = window.scrollY || window.pageYOffset || 0;
    document.body.dataset.elarahScrollLock = '1';
    document.body.dataset.elarahScrollY = String(y);
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + y + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockBody() {
    if (document.body.dataset.elarahScrollLock !== '1') return;
    const y = parseInt(document.body.dataset.elarahScrollY || '0', 10);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    delete document.body.dataset.elarahScrollLock;
    delete document.body.dataset.elarahScrollY;
    window.scrollTo(0, y);
  }

  const openMenu = () => { nav.classList.add('mobile-open'); lockBody(); };
  const closeMenu = () => { nav.classList.remove('mobile-open'); unlockBody(); };

  // Exposto para quem precisa fechar o menu (e destravar o scroll) antes
  // de rolar a própria página — ex.: ao tocar numa categoria do Explorar,
  // que rola até a seção de experiências.
  window.elarahCloseMobileMenu = closeMenu;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (nav.classList.contains('mobile-open')) closeMenu();
    else openMenu();
  });

  // Fecha ao clicar fora do menu E fora do botão.
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('mobile-open')) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });

  // Fecha ao clicar em qualquer link dentro do menu.
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Fecha com ESC.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('mobile-open')) closeMenu();
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  let experiences = [];
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.getVisibleExperiences) {
      experiences = await ElarahData.getVisibleExperiences();
    } else if (typeof ElarahData !== 'undefined' && ElarahData.getAllExperiences) {
      experiences = await ElarahData.getAllExperiences();
    }
  } catch (e) {
    console.warn('[Elarah] falha ao carregar experiências, seguindo com lista vazia', e);
    experiences = [];
  }

  // Originals exclusivos (hideFromCategorias=true) só aparecem na
  // seção By Elarah — não nas listagens de carrossel/categoria da home.
  experiences = experiences.filter(function (e) {
    return e && e.hideFromCategorias !== true;
  });

  // Carrega disponibilidade por slot (vagas por horário)
  window._elarahSlotMap = {};
  let slotMapRaw = new Map();
  try {
    if (typeof ElarahData !== 'undefined' && ElarahData.loadAllSlots) {
      var sMap = await ElarahData.loadAllSlots();
      if (sMap && sMap.forEach) {
        slotMapRaw = sMap;
        sMap.forEach(function (slots, expId) {
          var byHorario = {};
          slots.forEach(function (sl) { byHorario[sl.horario] = sl; });
          window._elarahSlotMap[expId] = byHorario;
        });
      }
    }
  } catch (e) { /* tabela pode não existir */ }

  // Pré-calcula as datas futuras de cada experiência (pro filtro de
  // data). Usa os slots — recorrentes têm as datas reais ali.
  const _nowMs = Date.now();
  experiences.forEach(function (e) {
    e._slots = slotMapRaw.get(e.id) || [];
    e._futureDates = (typeof ElarahData !== 'undefined' && ElarahData.experienceFutureDates)
      ? ElarahData.experienceFutureDates(e, e._slots, _nowMs)
      : [];
  });
  // Varredura: recorrente com turmas datadas mas nenhuma ocorrência
  // futura = vencida. Turmas sem data ("Semanal") são agenda aberta e
  // mantêm a experiência na listagem — regra em ElarahData.
  experiences = experiences.filter(function (e) {
    if (typeof ElarahData !== 'undefined' && ElarahData.isExpiredRecurring) {
      return !ElarahData.isExpiredRecurring(e, slotMapRaw.get(e.id) || [], _nowMs);
    }
    return true;
  });

  let activeCategoria = '';
  let activeBairro = '';
  let activeBusca = '';
  let activeDateRange = null;

  const params = new URLSearchParams(window.location.search);
const buscaURL = params.get('busca');
const categoriaURL = params.get('categoria');

if (buscaURL) activeBusca = buscaURL;
if (categoriaURL) activeCategoria = categoriaURL;

  const grid = document.getElementById('experiences-grid');
  const countEl = document.getElementById('experiences-count');
  const emptyEl = document.getElementById('experiences-empty');
  const filterBairro = document.getElementById('filter-bairro');
  const filterCategoria = document.getElementById('filter-categoria');
  const filterBtn = document.getElementById('filter-btn');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // =====================================================
  //  POPULA DROPDOWNS/STRIPS DINAMICAMENTE A PARTIR DO BANCO
  // =====================================================
  // Substitui as options/links hardcoded no HTML por uma lista
  // derivada das experiências reais. Quando o admin cadastra uma
  // experiência com categoria NOVA, ela aparece automaticamente
  // nos filtros na próxima vez que a página carrega.
  function populateFiltersFromExperiences() {
    // --- Categorias únicas do banco ---
    const categoriasSet = new Set();
    const categoriasOriginalCase = new Map();
    (experiences || []).forEach(function (exp) {
      if (!exp || !exp.categoria) return;
      // Kits "em casa" (Kit em casa / Lar em casa) não entram na navegação
      // (menu/faixa de categorias) — acessíveis só pelo link "Elarah em
      // Casa" no topo do header. Mesmo critério de ElarahData.isHomeKit.
      if ((window.ElarahData && ElarahData.isHomeKit)
        ? ElarahData.isHomeKit(exp)
        : String(exp.categoria).toLowerCase().indexOf('em casa') !== -1) return;
      // Uma experiência pode estar em mais de uma aba (ex.: "Barismo |
      // Bartenderia") — cada categoria vira um link/opção separada.
      const cats = (window.ElarahData && ElarahData.categoriasOf)
        ? ElarahData.categoriasOf(exp)
        : [String(exp.categoria).trim()];
      cats.forEach(function (c) {
        if (!c) return;
        const k = c.toLowerCase();
        if (!categoriasSet.has(k)) {
          categoriasSet.add(k);
          categoriasOriginalCase.set(k, c);
        }
      });
    });
    const categorias = Array.from(categoriasOriginalCase.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    // --- Bairros únicos do banco ---
    const bairrosSet = new Set();
    const bairrosMap = new Map();
    (experiences || []).forEach(function (exp) {
      if (!exp || !exp.bairro) return;
      const b = String(exp.bairro).trim();
      if (!b) return;
      const k = b.toLowerCase();
      if (!bairrosSet.has(k)) {
        bairrosSet.add(k);
        bairrosMap.set(k, b);
      }
    });
    const bairros = Array.from(bairrosMap.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });

    console.log('[Elarah Home] filtros dinâmicos:',
      categorias.length + ' categorias,',
      bairros.length + ' bairros');

    // --- Popula o <select id="filter-categoria"> ---
    if (filterCategoria) {
      const current = filterCategoria.value;
      // Mantém o primeiro <option value=""> (Todas as experiências)
      // e substitui todos os outros pelas categorias dinâmicas.
      const first = filterCategoria.querySelector('option[value=""]');
      filterCategoria.innerHTML = '';
      if (first) filterCategoria.appendChild(first);
      else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Todas as experiências';
        filterCategoria.appendChild(placeholder);
      }
      categorias.forEach(function (c) {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        filterCategoria.appendChild(opt);
      });
      // Restaura seleção se ainda existe nas novas options
      if (current && categorias.indexOf(current) !== -1) {
        filterCategoria.value = current;
      } else if (activeCategoria && categorias.indexOf(activeCategoria) !== -1) {
        filterCategoria.value = activeCategoria;
      }
    }

    // --- Popula o <select id="filter-bairro"> ---
    if (filterBairro) {
      const current = filterBairro.value;
      const first = filterBairro.querySelector('option[value=""]');
      filterBairro.innerHTML = '';
      if (first) filterBairro.appendChild(first);
      else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Todos os bairros';
        filterBairro.appendChild(placeholder);
      }
      bairros.forEach(function (b) {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        filterBairro.appendChild(opt);
      });
      if (current && bairros.indexOf(current) !== -1) {
        filterBairro.value = current;
      } else if (activeBairro && bairros.indexOf(activeBairro) !== -1) {
        filterBairro.value = activeBairro;
      }
    }

    // --- Popula o strip de categorias (links .category-link) ---
    // O strip fica dentro de <nav class="categories__inner">. Mantém
    // o link "Todas" + adiciona um link por categoria do banco.
    const categoriesNav = document.querySelector('.categories__inner');
    if (categoriesNav) {
      // Preserva apenas o "Todas" (primeiro link)
      const todasLink = categoriesNav.querySelector('.category-link--active') ||
        categoriesNav.querySelector('.category-link');
      categoriesNav.innerHTML = '';
      if (todasLink) {
        todasLink.classList.add('category-link', 'category-link--active');
        categoriesNav.appendChild(todasLink);
      } else {
        const todas = document.createElement('a');
        todas.href = 'categoria.html';
        todas.className = 'category-link category-link--active';
        todas.textContent = 'Todas';
        categoriesNav.appendChild(todas);
      }
      categorias.forEach(function (c) {
        const a = document.createElement('a');
        a.href = 'categoria.html?cat=' + encodeURIComponent(c);
        a.className = 'category-link';
        a.textContent = c;
        categoriesNav.appendChild(a);
      });
    }
  }

  populateFiltersFromExperiences();

  // Atualizado depois da geração dinâmica (links novos).
  const categoryLinks = document.querySelectorAll('.category-link');

  const MAX_HOME_CARDS = 4;

  function renderCards() {
    if (!grid || !countEl || !emptyEl) return;

    const filtered = experiences.filter((exp) => {
      // Kits "Elarah em Casa" são produto, não experiência: fora da
      // listagem (só aparecem na vitrine própria em-casa.html).
      if (window.ElarahData && ElarahData.isHomeKit && ElarahData.isHomeKit(exp)) return false;
      const matchCat = !activeCategoria ||
        ((window.ElarahData && ElarahData.matchesCategoria)
          ? ElarahData.matchesCategoria(exp, activeCategoria)
          : exp.categoria === activeCategoria);
      const matchBairro = !activeBairro || exp.bairro === activeBairro;

      const textoBusca = activeBusca.toLowerCase();
      const matchBusca =
        !textoBusca ||
        exp.nome.toLowerCase().includes(textoBusca) ||
        exp.categoria.toLowerCase().includes(textoBusca) ||
        exp.bairro.toLowerCase().includes(textoBusca) ||
        exp.endereco.toLowerCase().includes(textoBusca) ||
        exp.inclui.toLowerCase().includes(textoBusca) ||
        exp.data.toLowerCase().includes(textoBusca);

      const matchData = !activeDateRange ||
        ((exp._futureDates || []).some((ts) =>
          ts >= activeDateRange.startMs && ts <= activeDateRange.endMs));

      return matchCat && matchBairro && matchBusca && matchData;
    });

    // Ordem CRONOLÓGICA: a próxima experiência a acontecer aparece
    // primeiro (proxima ocorrencia futura). Empate no mesmo horário cai
    // na ordem manual do admin. Experiencias sem data conhecida
    // (recorrente sem slot programado, one-off com data ausente, etc)
    // vao pro fim.
    filtered.sort(function (a, b) {
      var ta = (a._futureDates && a._futureDates.length) ? a._futureDates[0] : Infinity;
      var tb = (b._futureDates && b._futureDates.length) ? b._futureDates[0] : Infinity;
      if (ta !== tb) return ta - tb;
      var oa = (window.ElarahData && ElarahData.ordemKey) ? ElarahData.ordemKey(a) : Infinity;
      var ob = (window.ElarahData && ElarahData.ordemKey) ? ElarahData.ordemKey(b) : Infinity;
      return oa - ob;
    });

    grid.innerHTML = '';
    emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
    countEl.textContent = filtered.length + ' experiência' + (filtered.length !== 1 ? 's' : '');

    // Remove old "ver mais" link
    const oldLink = document.querySelector('.experiences__ver-mais');
    if (oldLink) oldLink.remove();

    const isFiltered = activeCategoria || activeBairro || activeBusca;
    // Modo feed (admin → /feed.html): sem limite de cards e com
    // shuffle opcional. Ativado via window.__elarahFeedMode antes
    // do script.js carregar. Sem efeito quando flag não está setada
    // (home segue mostrando MAX_HOME_CARDS * 3 = 9 cards).
    const isFeedMode = window.__elarahFeedMode === true;
    let toShow;
    if (isFeedMode) {
      const arr = filtered.slice();
      if (window.__elarahFeedShuffle === true) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
      }
      toShow = arr;
    } else if (activeBusca && document.documentElement.classList.contains('is-app')) {
      // No APP: quando a pessoa DIGITA uma busca ("vela"), a home mostra
      // TODOS os resultados daquele termo e mantém a barra de busca no topo.
      // Antes cortava em MAX_HOME_CARDS e o "Ver todas" ia pra listagem geral
      // (categoria.html), perdendo o que foi digitado. No site normal (sem
      // .is-app) o comportamento continua exatamente igual.
      toShow = filtered;
    } else {
      toShow = isFiltered ? filtered.slice(0, MAX_HOME_CARDS) : filtered.slice(0, MAX_HOME_CARDS * 3);
    }

    toShow.forEach((exp) => {
      grid.appendChild(createCard(exp));
    });

    // Show "Ver mais" if there are more results
    if (filtered.length > toShow.length) {
      const verMais = document.createElement('div');
      verMais.className = 'experiences__ver-mais';
      const href = activeCategoria
        ? 'categoria.html?cat=' + encodeURIComponent(activeCategoria)
        : 'categoria.html';
      verMais.innerHTML = `
        <a href="${href}" class="experiences__ver-mais-btn">
          Ver todas as ${filtered.length} experiências
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </a>
      `;
      grid.parentNode.insertBefore(verMais, grid.nextSibling);
    }

    grid.querySelectorAll('.card__favorite').forEach((btn) => {
      const expId = btn.dataset.id;
      if (typeof ElarahAuth !== 'undefined' && ElarahAuth.isFavorite(expId)) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof ElarahAuth === 'undefined') {
          alert('Não foi possível carregar a sua conta. Recarregue a página.');
          return;
        }
        if (!ElarahAuth.isLoggedIn()) {
          ElarahAuth.openModal('login', 'Faça login para favoritar');
          return;
        }
        const result = ElarahAuth.toggleFavorite(expId);
        if (result && result.success) {
          btn.classList.toggle('active');
        }
      });
    });
  }

  // Hook pra modo feed (admin/feed.html): permite re-render externo
  // (ex: clique no botão "Embaralhar" troca window.__elarahFeedShuffle
  // e chama essa função). Sem efeito em outros contextos.
  if (typeof window !== 'undefined') {
    window.__elarahRenderCards = renderCards;
  }

  function createCard(exp) {
    const colors = (exp.cor || '#f6d5a8,#f0a05e').split(',');
    const card = document.createElement('article');
    card.className = 'card';

    // Horários do card: prioriza os horários REAIS das turmas (slots),
    // incluindo os gerados por recorrência. Assim experiências que só têm
    // horário na recorrência (campo "Horários" vazio) também mostram os
    // botões. Cai pro campo horarios/horario da experiência quando não há
    // slot futuro.
    const _slotHorarios = (typeof ElarahData !== 'undefined' && ElarahData.distinctSlotHorarios)
      ? ElarahData.distinctSlotHorarios(exp._slots || [], Date.now())
      : [];
    // Dedup textual + ordem original. Recorrência popula exp.horarios
    // com 1 entrada por slot (ex: 8 datas × 2 horários = 16 entradas
    // repetidas). Sem dedup, o card mostra 16 chips idênticos.
    const horariosRaw = _slotHorarios.length
      ? _slotHorarios
      : (Array.isArray(exp.horarios) && exp.horarios.length
          ? exp.horarios
          : (exp.horario ? [exp.horario] : []));
    const seenHorarios = new Set();
    const horarios = [];
    horariosRaw.forEach(function (h) {
      var key = String(h || '').trim();
      if (!key || seenHorarios.has(key)) return;
      seenHorarios.add(key);
      horarios.push(h);
    });
    const hasMultipleHorarios = horarios.length > 1;

    // Slot availability lookup (populated by loadSlotAvailability)
    var slotMap = (window._elarahSlotMap && window._elarahSlotMap[exp.id]) || {};

    // Normaliza path: nome solto (ex: "ceramica.jpg") vira "assets/ceramica.jpg".
    // URLs absolutas (http/https) e paths absolutos (/...) passam direto.
    // Aplica NFKD + remove diacríticos pra que arquivos cadastrados com
    // cedilha/acento ("velamaçadoamor.jpg") busquem a versão normalizada
    // ("velamacadoamor.jpg") — convenção dos arquivos do projeto é
    // sempre sem acento. Espaços continuam como estão (URL-encoded
    // pelo browser); admin precisa ajustar manualmente se o arquivo
    // real usa hífen ou underscore no lugar.
    // Também lowercase do basename pra cobrir admin que digitou
    // "PERFUMES.jpg" — convenção do /assets é tudo minúsculo.
    const normalizeImg = function (p) {
      let s = String(p == null ? '' : p).trim();
      if (!s) return '';
      if (/^(https?:\/\/|\/)/i.test(s)) return s;
      s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
      const slash = s.lastIndexOf('/');
      const dir = slash >= 0 ? s.slice(0, slash + 1) : '';
      const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
      if (/^(assets|images|img)\//i.test(s)) {
        return dir.toLowerCase() + file;
      }
      return 'assets/' + file;
    };
    // Fallback por categoria — quando exp.imagem está vazio ou o arquivo
    // não existe, escolhe uma foto representativa da categoria. Sincronizar
    // este map com dia-das-maes.js / categoria.js / presentear.js.
    const CATEGORY_DEFAULT_IMG = {
      'sabonete':    'assets/sabonete.jpg',
      'perfumaria':  'assets/perfumaria.jpg',
      'ceramica':    'assets/ceramica-fria.jpg',
      'tufting':     'assets/tufting1.jpg',
      'pintura':     'assets/pinturataca.jpg',
      'vela':        'assets/velaaromatica.jpg',
      'gastronomia': 'assets/cookies.jpg',
      'macrame':     'assets/macrameee.jpg',
      'floral':      'assets/florseca.jpg',
      'bartenderia': 'assets/drinks.jpg',
    };
    const defaultImgForCategory = function (cat) {
      if (!cat) return '';
      const key = String(cat).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
      return CATEGORY_DEFAULT_IMG[key] || '';
    };
    // Placeholder gradient (usado quando imagem vazia OU falha ao carregar).
    // Encodado em data-attribute pra que o onerror possa trocar inline.
    const placeholderHtml = `<div class="card__image-placeholder" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});"><span>${exp.categoria || ''}</span></div>`;
    const primaryImg = normalizeImg(exp.imagem);
    const catFallback = ""; /* fotos genericas de categoria desativadas: mostra placeholder neutro ate a foto real carregar */
    const imgSrc = primaryImg || catFallback;
    const imageContent = imgSrc
      ? `<img src="${imgSrc}" alt="${exp.nome}" class="card__image-photo" loading="lazy" ` +
        `data-cat-fb="${catFallback}" ` +
        `data-original-src="${imgSrc}" ` +
        `data-fb-html="${placeholderHtml.replace(/"/g, '&quot;')}" ` +
        `onerror="` +
          `if(this.dataset.fbStep==='final')return;` +
          `if(!this.dataset.fbStep&&this.dataset.catFb&&this.src.indexOf(this.dataset.catFb)===-1){` +
            `this.dataset.fbStep='cat';this.src=this.dataset.catFb;return;` +
          `}` +
          `console.warn('[Elarah] imagem do card falhou: '+this.dataset.originalSrc);` +
          `this.dataset.fbStep='final';this.outerHTML=this.dataset.fbHtml;` +
        `">`
      : placeholderHtml;

    // Pacote: se exp.pacoteDatas tem 2+ datas, lista TODAS no card.
    const pacote = Array.isArray(exp.pacoteDatas) ? exp.pacoteDatas.filter(Boolean) : [];
    const isPackage = pacote.length >= 2;
    const horarioSuffix = (!hasMultipleHorarios && horarios[0]) ? ' &middot; ' + horarios[0] : '';
    let horarioLine;
    if (isPackage) {
      horarioLine = pacote.map(function (d, i) {
        return '<span style="display:block;' + (i > 0 ? 'margin-top:3px;' : '') + '"><b style="color:#a05f1e;">' + String(d).replace(/[&<>"]/g, '') + '</b>' +
          horarioSuffix +
        '</span>';
      }).join('');
    } else {
      horarioLine = `${exp.data}${horarioSuffix}`;
    }

    const horariosBlock = hasMultipleHorarios
      ? `<div class="card__horarios">${horarios.map((h, i) => {
          var sl = slotMap[h];
          var soldOut = sl && sl.vagasTotal != null && sl.vagasRestantes != null && sl.vagasRestantes <= 0;
          var label = soldOut ? h + ' (esgotado)' : h;
          var cls = 'card__horario-btn' + (i === 0 && !soldOut ? ' card__horario-btn--active' : '') + (soldOut ? ' card__horario-btn--sold-out' : '');
          return '<button type="button" class="' + cls + '"' + (soldOut ? ' disabled' : '') + ' data-horario="' + h.replace(/"/g, '&quot;') + '">' + label + '</button>';
        }).join('')}</div>`
      : '';

    // Badge laranja pra cada data quando eh pacote (empilha
    // verticalmente). Padrao laranja preservado (CSS .card__badge).
    const badgesHtml = isPackage
      ? pacote.map(function (d, i) {
          var topStyle = i === 0 ? '' : ('top:' + (12 + i * 32) + 'px;');
          return '<span class="card__badge"' + (topStyle ? ' style="' + topStyle + '"' : '') + '>' +
            String(d).replace(/[&<>"]/g, '') +
          '</span>';
        }).join('')
      : `<span class="card__badge">${exp.data}</span>`;

    // Selo de escassez no card (mesma regra honesta da página da
    // experiência) — só aparece quando uma turma futura está enchendo.
    var _scRest = (window.ElarahData && ElarahData.scarcityForSlots)
      ? ElarahData.scarcityForSlots(exp._slots || [], Date.now()) : null;
    var scarcePill = _scRest != null
      ? '<span class="card__scarce" style="position:absolute;left:12px;bottom:12px;background:#c0392b;color:#fff;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px;padding:4px 9px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.28);z-index:3;">' +
          (_scRest === 1 ? 'última vaga' : 'últimas ' + _scRest + ' vagas') +
        '</span>'
      : '';

    card.innerHTML = `
      <div class="card__image">
        ${imageContent}
        <button class="card__favorite" data-id="${exp.nome}_${exp.data}_${horarios[0] || ''}" aria-label="Favoritar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${badgesHtml}
        ${scarcePill}
      </div>
      <div class="card__body">
        <span class="card__category">${(window.ElarahData && ElarahData.categoriaLabel) ? ElarahData.categoriaLabel(exp) : exp.categoria}</span>
        <h3 class="card__title"><a href="experiencia.html?id=${encodeURIComponent(exp.id)}" class="card__title-link">${exp.nome}</a></h3>
        <div class="card__details">
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${horarioLine}
          </p>
          ${horariosBlock}
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${exp.duracao}
          </p>
          <p class="card__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${exp.bairro}
          </p>
          <p class="card__detail card__detail--address">${exp.endereco}</p>
          <p class="card__detail card__detail--includes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            ${exp.inclui}
          </p>
        </div>
        <div class="card__footer">
          <p class="card__price"><strong>${(window.ElarahData && ElarahData.formatPrecoBR ? ElarahData.formatPrecoBR(exp.preco) : exp.preco)}</strong></p>
          ${/\d/.test(String(exp.preco || '')) ? '<p class="card__installments" style="margin:-6px 0 8px;font-size:.72rem;color:#8a7a68;line-height:1.2;">ou até <strong>12x</strong> no cartão</p>' : ''}
          <button type="button" class="card__reserve-btn"
            data-reserve
            data-experience-id="${exp.id}"
            data-experience-nome="${(exp.nome || '').replace(/"/g, '&quot;')}"
            data-analytics="reserve_click"
            data-analytics-category="booking"
            data-analytics-label="${(exp.nome || '').replace(/"/g, '&quot;')}">
            Reservar
          </button>
          <button type="button" class="card__share-btn" data-share-id="${exp.id}" aria-label="Copiar link" title="Copiar link">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
    `;

    if (hasMultipleHorarios) {
      card.querySelectorAll('.card__horario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.querySelectorAll('.card__horario-btn').forEach(b => b.classList.remove('card__horario-btn--active'));
          btn.classList.add('card__horario-btn--active');
          const favBtn = card.querySelector('.card__favorite');
          if (favBtn) {
            favBtn.dataset.id = `${exp.nome}_${exp.data}_${btn.dataset.horario}`;
          }
        });
      });
    }

    // Share button handler
    var shareBtn = card.querySelector('.card__share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var url = window.location.origin + '/experiencia.html?id=' + encodeURIComponent(shareBtn.dataset.shareId);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            shareBtn.innerHTML = '<span style="font-size:.75rem;font-weight:600;color:var(--orange,#f0a05e);">Link copiado!</span>';
            setTimeout(function () {
              shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
            }, 2500);
          });
        } else {
          prompt('Copie o link:', url);
        }
      });
    }

    return card;
  }

  if (categoryLinks.length && filterCategoria) {
    categoryLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activeBusca = '';
        window.history.replaceState({}, '', '/');
        if (searchInput) searchInput.value = '';

        categoryLinks.forEach((c) => c.classList.remove('category-link--active'));
        link.classList.add('category-link--active');

        const text = link.textContent.trim();
        activeCategoria = text === 'Todas' ? '' : text;
        filterCategoria.value = activeCategoria;
        try {
          if (window.ElarahAnalytics && ElarahAnalytics.track) {
            ElarahAnalytics.track('category_filter_used', {
              category: 'navigation',
              targetLabel: text.slice(0, 60),
              targetId: activeCategoria || 'todas',
              metadata: { ui: 'category_link' },
            });
          }
        } catch (_) {}

        renderCards();
      });
    });
  }

  if (filterBtn && filterBairro && filterCategoria) {
    filterBtn.addEventListener('click', () => {
      activeBusca = '';
      window.history.replaceState({}, '', '/');
      if (searchInput) searchInput.value = '';

      activeBairro = filterBairro.value;
      activeCategoria = filterCategoria.value;
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('category_filter_used', {
            category: 'navigation',
            targetLabel: (activeCategoria || 'todas').slice(0, 60),
            targetId: activeCategoria || 'todas',
            metadata: { ui: 'select', bairro: activeBairro || null },
          });
        }
      } catch (_) {}

      if (categoryLinks.length) {
        categoryLinks.forEach((c) => {
          c.classList.remove('category-link--active');
          const text = c.textContent.trim();
          if ((!activeCategoria && text === 'Todas') || text === activeCategoria) {
            c.classList.add('category-link--active');
          }
        });
      }

      renderCards();

      const experienciasEl = document.getElementById('experiencias');
      if (experienciasEl) {
        experienciasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (filterBairro) {
    filterBairro.addEventListener('change', () => {
      activeBairro = filterBairro.value;
      renderCards();
    });
  }

  if (filterCategoria) {
    filterCategoria.addEventListener('change', () => {
      activeCategoria = filterCategoria.value;

      if (categoryLinks.length) {
        categoryLinks.forEach((c) => {
          c.classList.remove('category-link--active');
          const text = c.textContent.trim();
          if ((!activeCategoria && text === 'Todas') || text === activeCategoria) {
            c.classList.add('category-link--active');
          }
        });
      }

      renderCards();
    });
  }

  // Filtro por data — chips rápidos + seletor de data.
  // Só liga na home (onde existe #experiences-grid). Em categoria.html,
  // que carrega script.js + categoria.js, quem cuida disso é o
  // categoria.js — evita wiring duplicado nos mesmos chips.
  if (grid && window.ElarahDateFilter) {
    ElarahDateFilter.init({
      onChange: function (range) {
        activeDateRange = range;
        renderCards();
      },
    });
  }

  function executarBusca() {
    const valor = searchInput?.value.trim();
    if (!valor) return;
    // Tracking — termo de busca (truncado pra evitar PII longa).
    try {
      if (window.ElarahAnalytics && ElarahAnalytics.track) {
        ElarahAnalytics.track('search_used', {
          category: 'navigation',
          targetLabel: valor.slice(0, 80),
          metadata: { term: valor.slice(0, 80) },
        });
      }
    } catch (_) {}
    window.location.href = '/?busca=' + encodeURIComponent(valor);
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', executarBusca);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBusca();
      }
    });
  }

  renderCards();

  const explorarBtn = document.getElementById('explorar-btn');
  const explorarDropdown = document.getElementById('explorar-dropdown');

  if (explorarBtn && explorarDropdown) {
    explorarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      explorarDropdown.classList.toggle('open');

      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) {
        chevron.style.transform = explorarDropdown.classList.contains('open') ? 'rotate(180deg)' : '';
      }
    });

    document.addEventListener('click', () => {
      explorarDropdown.classList.remove('open');
      const chevron = explorarBtn.querySelector('.header__nav-chevron');
      if (chevron) chevron.style.transform = '';
    });

    explorarDropdown.querySelectorAll('.header__dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const text = item.textContent.trim();

        if (grid && filterCategoria) {
          activeBusca = '';
          if (searchInput) searchInput.value = '';

          activeCategoria = text === 'Todas' ? '' : text;

          if (categoryLinks.length) {
            categoryLinks.forEach((c) => {
              c.classList.remove('category-link--active');
              const linkText = c.textContent.trim();
              if ((!activeCategoria && linkText === 'Todas') || linkText === activeCategoria) {
                c.classList.add('category-link--active');
              }
            });
          }

          filterCategoria.value = activeCategoria;
          renderCards();

          // Fecha o menu mobile e destrava o scroll ANTES de rolar até
          // as experiências — com o body travado o scrollIntoView não
          // teria efeito.
          if (window.elarahCloseMobileMenu) window.elarahCloseMobileMenu();

          const experienciasEl = document.getElementById('experiencias');
          if (experienciasEl) {
            experienciasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          const destino = text === 'Todas'
            ? 'categoria.html'
            : 'categoria.html?cat=' + encodeURIComponent(text);
          window.location.href = destino;
        }

        explorarDropdown.classList.remove('open');
        const chevron = explorarBtn.querySelector('.header__nav-chevron');
        if (chevron) chevron.style.transform = '';
      });
    });
  }

  initMobileHeader();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10 ? '0 1px 8px rgba(0,0,0,0.06)' : 'none';
    });
  }

  // ===== ELARAH ORIGINALS DYNAMIC RENDER =====
  // Re-renderiza os cards da seção By Elarah a partir do Supabase
  // assim que estiver disponível, mantendo o HTML estático como
  // fallback visual (sem flash).
  function renderOriginalsGrid(items, opts) {
    var grid = document.querySelector('.originals__grid');
    if (!grid || !Array.isArray(items) || !items.length) return;

    // opts.limit  → mostra só os N primeiros (home). null = todos.
    // opts.verMaisHref → URL do botão "Ver mais" quando há mais que N.
    opts = opts || {};
    var limit = (typeof opts.limit === 'number' && opts.limit > 0) ? opts.limit : null;
    var verMaisHref = opts.verMaisHref || '';
    var totalCount = items.length;
    var renderList = limit ? items.slice(0, limit) : items;

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Trunca um texto perto do limite sem quebrar palavra ao meio.
    // Estratégia: se já cabe inteiro, devolve como está. Senão, corta
    // no último espaço ANTES do limite e adiciona "...". Garante que
    // o teaser do card sempre termine em palavra completa.
    function truncateAtWord(text, max) {
      var s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
      if (s.length <= max) return s;
      var cut = s.slice(0, max);
      // Não corta dentro de uma palavra: anda pra trás até achar espaço.
      var lastSpace = cut.lastIndexOf(' ');
      if (lastSpace > Math.floor(max * 0.6)) cut = cut.slice(0, lastSpace);
      // Remove pontuação solta no fim antes do "..." pra ficar limpo.
      cut = cut.replace(/[\s,;:.!?\-–—]+$/, '');
      return cut + '…';
    }

    // Mapa de fallback por slug/nome — usado SOMENTE pra cards do
    // legado (byelarah_items) que ainda não têm imagem cadastrada.
    // Cards vindos de `experiences` (it.fromExperience===true) NÃO
    // entram aqui: a imagem do admin é fonte da verdade. Se ela
    // falhar, exibe placeholder neutro — nunca substitui pela foto
    // de outra experiência (era o bug "cadastrei foto X mas aparece Y").
    // Fotos fixas antigas desativadas: os cards Originals agora usam SOMENTE a
    // imagem real cadastrada; se faltar, mostram o placeholder neutro (logo) —
    // nunca uma foto antiga hardcoded.
    var ORIGINALS_IMAGE_FALLBACKS = {};
    // Placeholder neutro: a logo. Reusa asset que já está no site.
    // Usado quando uma imagem custom falha de carregar — bem melhor
    // que servir foto aleatória de outra experiência.
    var NEUTRAL_PLACEHOLDER = 'assets/logo.png';
    var DEFAULT_ORIGINALS_IMAGE = NEUTRAL_PLACEHOLDER;

    function normalizeImagePath(p) {
      var s = String(p == null ? '' : p).trim();
      if (!s) return '';
      // URL absoluta — usa como está
      if (/^https?:\/\//i.test(s)) return s;
      // path absoluto local — usa como está
      if (s.charAt(0) === '/') return s;
      // Convenção do /assets: sem acento + tudo minúsculo no basename.
      // Cobre admin que cadastrou "PERFUMES.jpg" / "velamaçadoamor.jpg".
      s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
      var slash = s.lastIndexOf('/');
      var dir = slash >= 0 ? s.slice(0, slash + 1) : '';
      var file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
      if (/^(assets|images|img)\//i.test(s)) {
        return dir.toLowerCase() + file;
      }
      return 'assets/' + file;
    }

    function resolveImage(it) {
      var raw = normalizeImagePath(it.imagem);
      if (raw) return raw;
      // Cards de `experiences` (Originals) NÃO caem em fallback de
      // slug/nome — pra evitar que uma experiência sem foto cadastrada
      // pegue por engano a foto de outra com nome parecido.
      if (it.fromExperience) return NEUTRAL_PLACEHOLDER;
      var bySlug = it.slug && ORIGINALS_IMAGE_FALLBACKS[String(it.slug).toLowerCase()];
      if (bySlug) return bySlug;
      var byName = it.nome && ORIGINALS_IMAGE_FALLBACKS[String(it.nome).toLowerCase()];
      if (byName) return byName;
      return DEFAULT_ORIGINALS_IMAGE;
    }

    // Resolve o fallback do <img onerror>. Pra cards de experiences,
    // SEMPRE retorna o placeholder neutro — bug crítico se a foto
    // cadastrada falhar e o site servir foto de outra experiência.
    // Pra cards do legado, mantém o mapping hardcoded.
    function resolveOnErrorFallback(it) {
      if (it.fromExperience) return NEUTRAL_PLACEHOLDER;
      var bySlug = it.slug && ORIGINALS_IMAGE_FALLBACKS[String(it.slug).toLowerCase()];
      if (bySlug) return bySlug;
      var byName = it.nome && ORIGINALS_IMAGE_FALLBACKS[String(it.nome).toLowerCase()];
      if (byName) return byName;
      return NEUTRAL_PLACEHOLDER;
    }

    var html = renderList.map(function(it) {
      var horariosHtml = '';
      if (Array.isArray(it.horarios) && it.horarios.length) {
        horariosHtml =
          '<p class="originals__card-detail">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
            esc(it.horarios.join(' | ')) +
          '</p>';
      }
      var localHtml = it.local
        ? '<p class="originals__card-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(it.local) + '</p>'
        : '';
      var dataHtml = it.data
        ? '<p class="originals__card-detail' + (it.tipo === 'espera' ? ' originals__card-detail--soon' : '') + '">' +
            (it.tipo === 'espera'
              ? esc(it.data)
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + esc(it.data)) +
          '</p>'
        : '';
      // Descrição:
      //   - tipo='espera' → mantém estilo highlight (estrelinha) usado
      //     historicamente em cards de lista de espera.
      //   - tipo='participar' (Originals compráveis) → teaser discreto
      //     truncado, com a descrição COMPLETA reservada pra modal de
      //     reserva (runDescriptionGate). Mesmo campo do banco, dois
      //     tratamentos visuais distintos.
      var descHtml = '';
      var descRaw = it.descricao ? String(it.descricao).trim() : '';
      if (descRaw) {
        if (it.tipo === 'espera') {
          // A descrição da lista de espera vem do banco e costuma ser
          // longa — despejar inteira estoura o card. Clampa em 3 linhas
          // e oferece "ver mais" (o botão só aparece quando o texto
          // realmente estoura; wiring de overflow logo após o render).
          descHtml = '<div class="originals__card-desc-wrap">' +
            '<p class="originals__card-detail originals__card-detail--highlight">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
              '<span class="originals__card-desc-clamp">' + esc(descRaw) + '</span>' +
            '</p>' +
            '<button type="button" class="originals__card-desc-toggle" aria-expanded="false" hidden>ver mais</button>' +
          '</div>';
        } else {
          // Truncamento inteligente: corta no espaço mais próximo de
          // 120 chars pra não cortar palavra no meio. Se a descrição
          // já cabe inteira, mostra sem "...".
          descHtml = '<p class="originals__card-detail originals__card-detail--teaser">' +
            esc(truncateAtWord(descRaw, 120)) + '</p>';
        }
      }

      // "O que está incluso" — campo `inclui` da experiência. Aceita
      // lista (quebras de linha, ; ou •) ou texto corrido com vírgulas.
      // Normaliza pra itens e mostra cada um com um check.
      var inclusoHtml = '';
      var inclusoRaw = it.incluso ? String(it.incluso).trim() : '';
      if (inclusoRaw) {
        var partes = inclusoRaw.split(/\r?\n|[;•·|]/)
          .map(function (p) { return p.replace(/^[\s\-–—*]+/, '').trim(); })
          .filter(Boolean);
        if (partes.length <= 1) {
          // Sem quebras explícitas: tenta separar por vírgula.
          partes = inclusoRaw.split(',')
            .map(function (p) { return p.trim(); })
            .filter(Boolean);
        }
        if (partes.length) {
          var lis = partes.map(function (p) {
            return '<li>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg>' +
              '<span>' + esc(p) + '</span>' +
            '</li>';
          }).join('');
          inclusoHtml =
            '<div class="originals__card-incluso">' +
              '<span class="originals__card-incluso-label">O que está incluso</span>' +
              '<ul class="originals__card-incluso-list">' + lis + '</ul>' +
            '</div>';
        }
      }

      // CTA dinâmico:
      //   - 'buy'      → checkout direto (botão laranja "Quero participar")
      //   - 'waitlist' → lead via WhatsApp (botão "Entrar na lista de espera")
      // Default: deriva do legado `tipo`. Se o item veio de
      // experiences (it.ctaMode setado), usa ele direto.
      var ctaMode = it.ctaMode === 'buy' || it.ctaMode === 'waitlist'
        ? it.ctaMode
        : (it.tipo === 'participar' ? 'buy' : 'waitlist');

      // Cards de experiências compráveis (Originals) ganham o visual
      // premium (borda dourada + shadow) pra destacar do legado.
      var cardClass = it.fromExperience
        ? 'originals__card originals__card--premium'
        : 'originals__card';
      var btnClass = ctaMode === 'buy'
        ? 'originals__card-btn'
        : 'originals__card-btn originals__card-btn--outline';
      var btnLabel = ctaMode === 'buy'
        ? 'Quero participar'
        : 'Entrar na lista de espera';

      // SOMENTE a imagem real cadastrada. Sem foto real, o espaco fica VAZIO
      // (nada aparece) ate a foto real carregar — nunca mostra foto antiga nem
      // logo no lugar. Se a foto real falhar, some (fica vazio tambem).
      var realImg = normalizeImagePath(it.imagem);
      var imgHtml = realImg
        ? '<img src="' + esc(realImg) + '" alt="' + esc(it.nome) + '" class="originals__image" loading="lazy" onerror="this.style.display=&quot;none&quot;;">'
        : '';

      // Atributos data-* identificam o tipo de fluxo no click handler.
      // CRÍTICO: cards compráveis recebem `data-reserve` — o listener
      // delegado em document (registrado no startCheckout setup, capture
      // phase, com stopImmediatePropagation) intercepta o click e chama
      // startCheckout(btn) usando EXATAMENTE o mesmo pipeline dos cards
      // regulares do site. Sem data-reserve no listener custom dos cards
      // (abaixo), funcionava só se o handler local rodasse antes do global,
      // e qualquer erro de cache/escopo derrubava pra fluxo de lead.
      var dataAttrs =
        ' data-experience="' + esc(it.nome) + '"' +
        ' data-cta-mode="' + esc(ctaMode) + '"' +
        ' data-type="' + esc(it.tipo || '') + '"';
      // data-reserve (→ startCheckout) SOMENTE para cards compráveis
      // (ctaMode === 'buy'). Cards de lista de espera NUNCA podem receber
      // data-reserve: se recebem, o listener global de checkout intercepta
      // o clique em "Entrar na lista de espera" e leva a pessoa pra um
      // "pagamento" de R$ 0,00 — em vez de coletar nome/telefone/e-mail.
      // Sem data-reserve, o clique cai no handler local → openOriginalsModal
      // → submitInterest → byelarah_submissions (aparece em "Respostas do
      // formulário" no admin), que é o comportamento correto de waitlist.
      if (it.fromExperience && it.experienceId && ctaMode === 'buy') {
        dataAttrs += ' data-experience-id="' + esc(it.experienceId) + '"';
        // ✅ data-reserve = listener global vai pegar esse click e
        // disparar startCheckout. Garantia de que cards compráveis
        // SEMPRE caem no fluxo de checkout, sem dependência de
        // funções no escopo local ou ordem de listeners.
        dataAttrs += ' data-reserve';
      }
      if (it.precoLabel) {
        dataAttrs += ' data-experience-preco="' + esc(it.precoLabel) + '"';
      }

      // Badge unificado: TODOS os cards da seção By Elarah usam o
      // mesmo label e estilo (gradient laranja premium). Antes
      // tinha duas variantes ("✨ By Elarah" pros cards de experience
      // e "Original Elarah" preto pros legados) — visualmente
      // inconsistente. Agora é sempre '✨ BY ELARAH' laranja.
      var badgeLabel = '✨ BY ELARAH';

      // Share button: aparece quando o card aponta pra uma experience
      // (it.experienceId) — sem isso nao tem URL canonica pra compartilhar.
      // Cards puros de lista de espera (lead via WhatsApp, sem
      // experience vinculada) nao tem botao, e ai mostra um espaco vazio
      // pra preservar o layout.
      var shareBtnHtml = '';
      if (it.experienceId) {
        shareBtnHtml =
          '<button type="button" class="originals__card-share-btn" ' +
            'data-share-experience-id="' + esc(it.experienceId) + '" ' +
            'aria-label="Copiar link da experiência" title="Copiar link da experiência" ' +
            'style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);color:#a05f1e;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.12);z-index:2;">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
          '</button>';
      }

      return '' +
        '<article class="' + cardClass + '" style="position:relative;">' +
          '<div class="originals__card-image">' +
            imgHtml +
            '<span class="originals__card-badge">' + esc(badgeLabel) + '</span>' +
            shareBtnHtml +
          '</div>' +
          '<div class="originals__card-body">' +
            '<h3 class="originals__card-title">' + esc(it.nome) + '</h3>' +
            '<div class="originals__card-details">' +
              descHtml + inclusoHtml + dataHtml + horariosHtml + localHtml +
            '</div>' +
            '<button class="' + btnClass + '"' + dataAttrs + '>' + esc(btnLabel) + '</button>' +
          '</div>' +
        '</article>';
    }).join('');

    grid.innerHTML = html;

    // Descrições da lista de espera: clampadas em 3 linhas via CSS. O
    // botão "ver mais" só aparece quando o texto realmente estoura as 3
    // linhas (mede overflow depois do layout) e expande/recolhe no clique.
    grid.querySelectorAll('.originals__card-desc-wrap').forEach(function (wrap) {
      var clamp = wrap.querySelector('.originals__card-desc-clamp');
      var toggle = wrap.querySelector('.originals__card-desc-toggle');
      if (!clamp || !toggle) return;
      var revealIfOverflow = function () {
        if (clamp.scrollHeight - clamp.clientHeight > 2) toggle.hidden = false;
      };
      if (window.requestAnimationFrame) window.requestAnimationFrame(revealIfOverflow);
      else revealIfOverflow();
      toggle.addEventListener('click', function () {
        var expanded = clamp.classList.toggle('is-expanded');
        toggle.textContent = expanded ? 'ver menos' : 'ver mais';
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    });

    // "Ver mais": quando a home limita a N cards e existem mais
    // experiências, mostra um botão que leva pra página com todas.
    // Em páginas que exibem tudo (sem limit), remove qualquer botão
    // remanescente pra não duplicar.
    (function () {
      var inner = grid.parentNode;
      if (!inner) return;
      var existing = inner.querySelector('.originals__ver-mais');
      if (limit && verMaisHref && totalCount > limit) {
        if (!existing) {
          existing = document.createElement('div');
          existing.className = 'originals__ver-mais';
          if (grid.nextSibling) inner.insertBefore(existing, grid.nextSibling);
          else inner.appendChild(existing);
        }
        existing.innerHTML =
          '<a href="' + esc(verMaisHref) + '" class="originals__ver-mais-btn">' +
            'Ver todas as ' + totalCount + ' experiências By Elarah' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
          '</a>';
      } else if (existing) {
        existing.parentNode.removeChild(existing);
      }
    })();

    // Share buttons: copia link da experiencia (mesmo formato dos cards
    // das categorias). UX identica: troca o icone por "Link copiado!"
    // e volta depois de 2s.
    grid.querySelectorAll('.originals__card-share-btn').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        var expId = btn.dataset.shareExperienceId;
        if (!expId) return;
        var url = window.location.origin + '/experiencia.html?id=' + encodeURIComponent(expId);
        var originalHtml = btn.innerHTML;
        function showCopied() {
          btn.innerHTML = '<span style="font-size:.7rem;font-weight:700;color:#a05f1e;white-space:nowrap;">Link copiado!</span>';
          btn.style.width = 'auto';
          btn.style.padding = '0 10px';
          setTimeout(function () {
            btn.innerHTML = originalHtml;
            btn.style.width = '36px';
            btn.style.padding = '0';
          }, 2200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(showCopied, function () {
            prompt('Copie o link:', url);
          });
        } else {
          prompt('Copie o link:', url);
        }
      });
    });

    // Re-vincula os cliques nos botões (porque substituímos o HTML).
    // Cards COMPRÁVEIS (com data-reserve) NÃO precisam de listener
    // local — o listener delegado em document, registrado no setup
    // de startCheckout, intercepta em capture phase com
    // stopImmediatePropagation. Aqui só tratamos os cards de lista
    // de espera (lead via WhatsApp).
    grid.querySelectorAll('.originals__card-btn').forEach(function(btn) {
      // Se tem data-reserve, deixa o listener global tratar. Não
      // adiciona handler local — qualquer handler local em bubble
      // phase rodaria DEPOIS do global em capture, mas se o global
      // chamou stopImmediatePropagation, este nunca dispara mesmo.
      // Mantemos o early-return pra clareza de intenção.
      if (btn.hasAttribute('data-reserve')) {
        console.info(
          '[Elarah By Elarah] card "' +
          (btn.getAttribute('data-experience') || '?') +
          '" tem data-reserve — listener global vai disparar startCheckout'
        );
        return;
      }
      // Lista de espera / lead: modal de WhatsApp (comportamento atual).
      btn.addEventListener('click', function () {
        console.info(
          '[Elarah By Elarah] card "' +
          (btn.getAttribute('data-experience') || '?') +
          '" sem data-reserve → fluxo LEAD (openOriginalsModal)'
        );
        openOriginalsModal(
          btn.getAttribute('data-experience'),
          btn.getAttribute('data-type')
        );
      });
    });
  }

  // ===== ELARAH ORIGINALS MODAL =====
  const originalsModal = document.getElementById('originals-modal');
  const originalsModalBackdrop = document.getElementById('originals-modal-backdrop');
  const originalsModalClose = document.getElementById('originals-modal-close');
  const originalsModalTitle = document.getElementById('originals-modal-title');
  const originalsModalDesc = document.getElementById('originals-modal-desc');
  const originalsModalForm = document.getElementById('originals-modal-form');
  const originalsModalBody = document.getElementById('originals-modal-body');
  const originalsModalSuccess = document.getElementById('originals-modal-success');
  const originalsModalExperience = document.getElementById('originals-modal-experience');
  const originalsModalSuccessClose = document.getElementById('originals-modal-success-close');

  async function openOriginalsModal(experienceName, type) {
    if (!originalsModal) return;
    if (originalsModalExperience) originalsModalExperience.value = experienceName;
    if (originalsModalTitle) originalsModalTitle.textContent = experienceName;

    // Tenta resolver a descrição real do item By Elarah (descricao do
    // banco/fallback seeds). Se não houver, cai pro texto genérico.
    // Aproveita o lookup pra também popular dinamicamente o select
    // de horários — antes era hardcoded ("10h às 13h" / "14h às 17h"),
    // o que mostrava sempre os mesmos horários independente do que
    // o admin tinha cadastrado. Agora reflete os horários reais.
    let customDesc = '';
    let matchedItem = null;
    try {
      if (window.ElarahByElarah && typeof ElarahByElarah.getAllItems === 'function') {
        const items = await ElarahByElarah.getAllItems();
        matchedItem = items && items.find(function (i) { return i.nome === experienceName; });
        if (matchedItem && matchedItem.descricao && String(matchedItem.descricao).trim()) {
          customDesc = String(matchedItem.descricao).trim();
          console.log('[Elarah Description Flow] originals: descrição encontrada para', experienceName);
        } else {
          console.warn('[Elarah Description Flow] originals: sem descrição para', experienceName);
        }
      }
    } catch (err) {
      console.warn('[Elarah Description Flow] originals: falha ao buscar descrição', err);
    }

    // Popula horários dinamicamente. Se a experiência tem array
    // `horarios` no banco, substitui as opções hardcoded do <select>.
    // Se não tem (ou se o lookup falhou), preserva o que está no HTML
    // pra não quebrar — fallback conservador.
    var horarioSelect = document.getElementById('originals-horario');
    if (horarioSelect && matchedItem && Array.isArray(matchedItem.horarios) && matchedItem.horarios.length) {
      var validHorarios = matchedItem.horarios
        .map(function (h) { return String(h || '').trim(); })
        .filter(Boolean);
      if (validHorarios.length) {
        // Limpa opções antigas e injeta as do banco.
        horarioSelect.innerHTML = '';
        validHorarios.forEach(function (h) {
          var opt = document.createElement('option');
          opt.value = h;
          opt.textContent = h;
          horarioSelect.appendChild(opt);
        });
        console.log('[Elarah Originals] horários populados do banco:', validHorarios);
      }
    } else if (horarioSelect) {
      console.warn('[Elarah Originals] sem horários no banco — mantendo opções hardcoded como fallback');
    }

    if (originalsModalDesc) {
      if (customDesc) {
        // Preserva quebras de linha como <br>, escapa HTML.
        const escaped = customDesc
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        originalsModalDesc.innerHTML = escaped;
      } else {
        originalsModalDesc.textContent = type === 'participar'
          ? 'Preencha seus dados para registrar seu interesse nessa experiência.'
          : 'Entre na lista de espera e avisaremos você assim que a data for definida.';
      }
    }
    var horarioField = document.getElementById('originals-horario-field');
    if (horarioField) {
      horarioField.style.display = type === 'participar' ? 'block' : 'none';
    }
    const submitBtn = document.getElementById('originals-modal-submit');
    if (submitBtn) {
      submitBtn.textContent = type === 'participar' ? 'Quero participar' : 'Entrar na lista de espera';
    }
    originalsModalBody.style.display = 'block';
    originalsModalSuccess.style.display = 'none';
    originalsModalForm.reset();
    originalsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeOriginalsModal() {
    if (!originalsModal) return;
    originalsModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.originals__card-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openOriginalsModal(btn.dataset.experience, btn.dataset.type);
    });
  });

  if (originalsModalBackdrop) {
    originalsModalBackdrop.addEventListener('click', closeOriginalsModal);
  }
  if (originalsModalClose) {
    originalsModalClose.addEventListener('click', closeOriginalsModal);
  }
  if (originalsModalSuccessClose) {
    originalsModalSuccessClose.addEventListener('click', closeOriginalsModal);
  }

  if (originalsModalForm) {
    originalsModalForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      var submitBtn = document.getElementById('originals-modal-submit');
      if (submitBtn) submitBtn.disabled = true;

      var experiencia = (originalsModalExperience && originalsModalExperience.value) || '';
      var nomeEl = document.getElementById('originals-nome');
      var emailEl = document.getElementById('originals-email');
      var telefoneEl = document.getElementById('originals-telefone');
      var nome = (nomeEl && nomeEl.value) || '';
      var email = (emailEl && emailEl.value) || '';
      var telefone = (telefoneEl && telefoneEl.value) || '';
      var horarioEl = document.getElementById('originals-horario');
      var horarioField = document.getElementById('originals-horario-field');
      var horario = (horarioField && horarioField.style.display !== 'none' && horarioEl)
        ? horarioEl.value : null;
      var tipo = (horarioField && horarioField.style.display !== 'none')
        ? 'participar' : 'espera';

      // Tenta resolver o slug a partir do nome da experiência.
      var itemSlug = null;
      try {
        if (window.ElarahByElarah && ElarahByElarah.getAllItems) {
          var items = await ElarahByElarah.getAllItems();
          var match = items.find(function(i) { return i.nome === experiencia; });
          if (match) itemSlug = match.slug;
        }
      } catch (err) { /* fallback silencioso */ }

      // Persiste no Supabase (se disponível).
      try {
        if (window.ElarahByElarah && ElarahByElarah.submitInterest) {
          await ElarahByElarah.submitInterest({
            itemSlug: itemSlug,
            experiencia: experiencia,
            tipo: tipo,
            nome: nome,
            email: email,
            telefone: telefone,
            horario: horario
          });
        }
      } catch (err) {
        console.warn('[Originals] submitInterest falhou:', err);
      }

      // Registra evento de analytics.
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('byelarah_submission', {
            category: 'byelarah',
            targetId: itemSlug || experiencia,
            targetLabel: experiencia,
            metadata: { tipo: tipo, horario: horario || '' }
          });
        }
      } catch (err) { /* ignore */ }

      if (submitBtn) submitBtn.disabled = false;
      originalsModalBody.style.display = 'none';
      originalsModalSuccess.style.display = 'block';
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && originalsModal && originalsModal.classList.contains('open')) {
      closeOriginalsModal();
    }
  });

  // ===== Hidratação combinada da seção By Elarah =====
  // Combina DUAS fontes:
  //   1. experiences com is_elarah_original = true → cards compráveis
  //      (CTA = checkout direto via startCheckout).
  //   2. byelarah_items (legado) → cards de lista de espera (lead).
  //
  // A fonte (1) é normalizada pro mesmo shape de (2) pra que o
  // renderOriginalsGrid funcione sem precisar saber a origem.
  // Dedup por slug/nome (case-insensitive) — se a mesma experiência
  // existir nos dois lugares (durante a migração), prioriza a fonte
  // de experiences (porque tem checkout). Cards compráveis vêm
  // primeiro pra reforçar conversão visual.
  function experienceToOriginalCard(exp) {
    if (!exp || !exp.id) return null;
    // Dedup textual de horários (recorrência repete o mesmo horario_label
    // pra cada slot/data — sem dedup, 8 datas × 2 horários viram 16
    // chips idênticos no card).
    var horariosRaw = Array.isArray(exp.horarios) && exp.horarios.length
      ? exp.horarios.slice()
      : (exp.horario ? [exp.horario] : []);
    var seenH = new Set();
    var horarios = [];
    horariosRaw.forEach(function (h) {
      var k = String(h || '').trim();
      if (!k || seenH.has(k)) return;
      seenH.add(k);
      horarios.push(h);
    });
    return {
      // Identificação + aparência
      id: 'exp-' + exp.id,
      slug: (exp.nome || '').toLowerCase().replace(/\s+/g, '-'),
      nome: exp.nome || '',
      descricao: exp.descricao || '',
      imagem: exp.imagem || '',
      data: exp.data || '',
      local: [exp.endereco, exp.bairro].filter(Boolean).join(' — '),
      horarios: horarios,
      // CTA: respeita cta_mode da experiência (default 'buy').
      tipo: exp.ctaMode === 'waitlist' ? 'espera' : 'participar',
      ctaMode: exp.ctaMode === 'waitlist' ? 'waitlist' : 'buy',
      ordem: 0,
      ativo: exp.isActive !== false,
      // "O que está incluso" — mesmo campo `inclui` do cadastro da
      // experiência. Exibido como lista com check no card.
      incluso: exp.inclui || '',
      // Marcadores que o renderOriginalsGrid usa pra ligar checkout
      // e aplicar o visual premium.
      fromExperience: true,
      experienceId: exp.id,
      precoLabel: exp.preco || ''
    };
  }

  async function loadByElarahCombined() {
    // Carrega experiences "visíveis" (filtro de cutoff/is_active aplicado)
    // E os byelarah_items em paralelo. Mas além disso, pra qualquer
    // byelarah_item com experience_id, vamos resolver via
    // getExperienceById diretamente (sem filtro) — assim, mesmo se a
    // experience cair fora do getVisibleExperiences (ex: cutoff
    // passado), o card abre o fluxo de checkout. Quem decide se a
    // venda é permitida é o BACKEND (booking_guard valida cutoff
    // novamente lá). UI confiar na fonte do dado, não no filtro.
    var [allExps, allItems] = await Promise.all([
      (window.ElarahData && ElarahData.getVisibleExperiences)
        ? ElarahData.getVisibleExperiences().catch(function () { return []; })
        : Promise.resolve([]),
      (window.ElarahByElarah && ElarahByElarah.getActiveItems)
        ? ElarahByElarah.getActiveItems().catch(function () { return []; })
        : Promise.resolve([])
    ]);

    // Mapa rápido id → experience pra resolver os byelarah_items.
    var expById = new Map();
    (allExps || []).forEach(function (e) {
      if (e && e.id) expById.set(e.id, e);
    });

    // Resolver experiences que NÃO vieram em getVisibleExperiences
    // (ex: cutoff passado). Usa getExperienceById que retorna do cache
    // de getAllExperiences (sem filtro). Se mesmo assim não achar,
    // fallback em lead.
    var experienceIdsFaltando = (allItems || [])
      .map(function (i) { return i && i.experienceId; })
      .filter(function (id) { return id && !expById.has(id); });

    if (experienceIdsFaltando.length && window.ElarahData && ElarahData.getExperienceById) {
      console.info(
        '[Elarah By Elarah] resolvendo ' + experienceIdsFaltando.length +
        ' experience(s) fora do filtro visible — busca direta via getAllExperiences'
      );
      for (var i = 0; i < experienceIdsFaltando.length; i++) {
        try {
          var resolvedExp = await ElarahData.getExperienceById(experienceIdsFaltando[i]);
          if (resolvedExp && resolvedExp.id) {
            expById.set(resolvedExp.id, resolvedExp);
          }
        } catch (e) { /* ignora */ }
      }
    }

    // ===== FALLBACK POR NOME =====
    // Rede de segurança: pra qualquer byelarah_item COM tipo='participar'
    // mas SEM experience_id resolvido (ex: admin marcou comprável mas
    // o sync falhou OU é item legado que tem experience comprável de
    // mesmo nome cadastrada manualmente), tenta achar uma experience
    // visível com nome similar (case-insensitive + trim) e usa ela.
    // Essa busca é em allExps (já carregadas) — sem custo extra de rede.
    function normNome(s) {
      return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
    }
    var nameMap = new Map();
    (allExps || []).forEach(function (e) {
      if (e && e.nome && e.id) nameMap.set(normNome(e.nome), e);
    });
    // Também adiciona experiences do expById (já resolvidas) que podem
    // não estar em allExps (resolved via getExperienceById direto).
    expById.forEach(function (e) {
      if (e && e.nome && e.id) {
        var k = normNome(e.nome);
        if (!nameMap.has(k)) nameMap.set(k, e);
      }
    });

    (allItems || []).forEach(function (item) {
      if (!item || !item.nome) return;
      // Só tenta o fallback por nome se NÃO já tem experienceId resolvido
      // — caso contrário, respeita o vínculo explícito do admin.
      if (item.experienceId && expById.has(item.experienceId)) return;
      // E só faz sentido pra items que querem ser compráveis (tipo='participar').
      if (item.tipo !== 'participar') return;

      var matchedExp = nameMap.get(normNome(item.nome));
      if (matchedExp && matchedExp.isActive !== false) {
        console.info(
          '[Elarah By Elarah] FALLBACK POR NOME: item "' + item.nome +
          '" sem experience_id resolvido — vinculando a experience "' +
          matchedExp.nome + '" (id=' + matchedExp.id + ')'
        );
        // Sobrescreve experience_id em memória só (não persiste no banco).
        // Próximo save no admin grava de verdade.
        item.experienceId = matchedExp.id;
        if (!expById.has(matchedExp.id)) {
          expById.set(matchedExp.id, matchedExp);
        }
      }
    });

    // ===== LOG DE DIAGNÓSTICO =====
    console.info('[Elarah By Elarah] diagnóstico do load:', {
      total_items: (allItems || []).length,
      total_exps_visible: (allExps || []).length,
      exps_resolvidas_total: expById.size,
      items_with_exp_id: (allItems || []).filter(function (i) { return i && i.experienceId; }).length,
    });
    (allItems || []).forEach(function (item, idx) {
      if (!item) return;
      var status = 'lead-fallback';
      var reason = '';
      if (item.experienceId) {
        if (expById.has(item.experienceId)) {
          var exp = expById.get(item.experienceId);
          if (exp.isActive === false) {
            reason = 'experience inativa (isActive=false) — ative no admin';
          } else {
            status = 'CHECKOUT';
            reason = 'experience ativa: ' + exp.id;
          }
        } else {
          reason = 'experience_id=' + item.experienceId +
            ' NÃO encontrada (verificar se existe no banco)';
        }
      } else {
        reason = 'sem experience_id (admin não ligou "É comprável" OU save falhou)';
      }
      console.info(
        '[Elarah By Elarah] item ' + (idx + 1) + '/' + (allItems || []).length + ':',
        item.nome || '?',
        '→',
        status,
        '·',
        reason
      );
    });

    // Set de experience_ids referenciados por algum byelarah_item.
    var referencedExpIds = new Set();
    (allItems || []).forEach(function (it) {
      if (it && it.experienceId) referencedExpIds.add(it.experienceId);
    });

    var combined = [];
    var seen = new Set();
    function keyOf(it) {
      return String(it.slug || it.nome || '').toLowerCase().trim();
    }

    // 1) Cards a partir de byelarah_items. Se tem experience_id e a
    // experience existe e está ativa, transforma em card-experience
    // (botão chama startCheckout). Senão, mantém legado (lead).
    (allItems || []).forEach(function (item) {
      if (!item) return;
      var card;
      if (item.experienceId && expById.has(item.experienceId)) {
        var exp = expById.get(item.experienceId);
        // Experience pode estar inativa (admin desligou "comprável") —
        // se isActive=false, cai no fluxo de lead pra não tentar
        // checkout numa experience desligada.
        if (exp.isActive !== false) {
          card = experienceToOriginalCard(exp);
          // Preserva campos visuais do byelarah_item — fonte da
          // verdade pro CARD (imagem, descrição curta, local label,
          // data label, ordem). Experience é só pra checkout/modal.
          if (card) {
            if (item.imagem) card.imagem = item.imagem;
            if (item.descricao) card.descricao = item.descricao;
            if (item.local) card.local = item.local;
            if (item.data) card.data = item.data;
            if (item.slug) card.slug = item.slug;
            if (item.ordem != null) card.ordem = item.ordem;
            card.legacyItemId = item.id;
          }
        }
      }
      if (!card) {
        // Legado puro (lead WhatsApp).
        card = item;
      }
      var k = keyOf(card);
      if (k && !seen.has(k)) { seen.add(k); combined.push(card); }
    });

    // 2) Experiences puras (Originals criadas direto na aba Experiências
    // sem byelarah_item correspondente). Filtradas por is_elarah_original
    // e desreferenciadas (não duplicar com items acima).
    (allExps || []).forEach(function (exp) {
      if (!exp || exp.isElarahOriginal !== true) return;
      if (referencedExpIds.has(exp.id)) return;
      var card = experienceToOriginalCard(exp);
      if (!card) return;
      var k = keyOf(card);
      if (k && !seen.has(k)) { seen.add(k); combined.push(card); }
    });

    if (combined.length) {
      // Home: só os 3 primeiros + botão "Ver mais" → byelarah.html.
      // Página dedicada (body[data-originals="all"]): mostra todas.
      var showAllOriginals = document.body &&
        document.body.getAttribute('data-originals') === 'all';
      renderOriginalsGrid(
        combined,
        showAllOriginals ? {} : { limit: 3, verMaisHref: 'byelarah.html' }
      );
    } else {
      // Nada cadastrado em byelarah_items + nenhuma experience marcada
      // como Original. O HTML estático da home (cards hardcoded) ainda
      // está visível — esconde a seção inteira pra não mostrar conteúdo
      // velho que o admin já apagou intencionalmente.
      var section = document.getElementById('originals');
      if (section) section.style.display = 'none';
    }
  }
  loadByElarahCombined().catch(function (e) {
    console.warn('[Elarah] loadByElarahCombined falhou', e);
  });

  // ===== GROUP SECTION =====
  var groupBtns = document.querySelectorAll('.group-section__btn');
  var groupForm = document.getElementById('group-form');
  var groupPlaceholder = document.querySelector('.group-section__form-placeholder');
  var groupTipo = document.getElementById('group-tipo');
  var groupFormTitle = document.getElementById('group-form-title');
  var groupFormSaibaMais = document.getElementById('group-form-saibamais');
  var GROUP_EVENT_PAGES = {
    'Aniversário': 'aniversarios.html',
    'Evento corporativo': 'eventos-corporativos.html',
    'Despedida de solteira(o)': 'despedidas.html'
  };
  var groupSuccess = document.getElementById('group-success');
  var groupSuccessClose = document.getElementById('group-success-close');

  groupBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      groupBtns.forEach(function(b) { b.classList.remove('group-section__btn--active'); });
      btn.classList.add('group-section__btn--active');

      if (groupPlaceholder) groupPlaceholder.style.display = 'none';
      if (groupSuccess) groupSuccess.style.display = 'none';
      if (groupForm) {
        groupForm.style.display = 'block';
        groupForm.style.animation = 'none';
        groupForm.offsetHeight;
        groupForm.style.animation = '';
      }
      if (groupTipo) groupTipo.value = btn.dataset.event;
      if (groupFormTitle) groupFormTitle.textContent = btn.dataset.event === 'Evento corporativo'
        ? 'Conte mais sobre seu evento corporativo'
        : btn.dataset.event === 'Aniversário'
          ? 'Conte mais sobre o aniversário'
          : btn.dataset.event === 'Despedida de solteira(o)'
            ? 'Conte mais sobre a despedida'
            : 'Conte mais sobre seu grupo';

      if (groupFormSaibaMais) {
        var pageUrl = GROUP_EVENT_PAGES[btn.dataset.event];
        if (pageUrl) {
          groupFormSaibaMais.href = pageUrl;
          groupFormSaibaMais.style.display = 'inline-block';
        } else {
          groupFormSaibaMais.style.display = 'none';
        }
      }
    });
  });

if (groupForm) {
  groupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var nome = document.getElementById('group-nome').value;
    var whatsapp = document.getElementById('group-whatsapp').value;
    var tipoEvento = document.getElementById('group-tipo').value;
    var pessoas = document.getElementById('group-pessoas').value;
    var data = document.getElementById('group-data').value;
    var experiencia = document.getElementById('group-experiencia').value;
    var observacoes = document.getElementById('group-obs').value;

    const mensagem =
  'Oi! Quero organizar uma experiência com a Elarah ✨%0A%0A' +
  '📌 Tipo de evento: ' + tipoEvento + '%0A' +
  '👤 Nome: ' + nome + '%0A' +
  '📱 WhatsApp: ' + whatsapp + '%0A' +
  '👥 Número de pessoas: ' + pessoas + '%0A' +
  '📅 Data desejada: ' + (data ? data.split('-').reverse().join('/') : 'Não informada') + '%0A' +
  '🎨 Tipo de experiência: ' + (experiencia || 'Ainda não sei') + '%0A' +
  '📝 Observações: ' + (observacoes || 'Nenhuma');

    var numeroElarah = '5511914455930'; // WhatsApp oficial Elarah

    var url = 'https://wa.me/' + numeroElarah + '?text=' + mensagem;

    window.open(url, '_blank');
  });
}

  if (groupSuccessClose) {
    groupSuccessClose.addEventListener('click', function() {
      if (groupSuccess) groupSuccess.style.display = 'none';
      if (groupPlaceholder) groupPlaceholder.style.display = 'flex';
      if (groupForm) groupForm.reset();
      groupBtns.forEach(function(b) { b.classList.remove('group-section__btn--active'); });
    });
  }

  // ===== STORIES READER =====
  var storiesData = [
    {
      title: 'Ideias criativas para um encontro diferente',
      author: 'Por Elarah',
      image: 'assets/experiences/pintura-ceramica.jpg',
      text: '<p>Cansar de fazer sempre a mesma coisa é natural. Jantar fora, cinema, passeio no shopping… tudo tem seu charme, mas existe um mundo de possibilidades quando o assunto é viver algo diferente a dois.</p><p><strong>E se em vez de assistir, vocês fizessem algo juntos?</strong></p><p>Imagina pintar um quadro lado a lado, com uma taça de vinho na mão e uma playlist suave ao fundo. Ou modelar argila em uma oficina de cerâmica, sentindo a textura do barro e criando algo com as próprias mãos — juntos, do zero.</p><p>Essas experiências criam memórias que ficam. Não é sobre o resultado final, mas sobre o processo: rir dos erros, se surpreender com os acertos, descobrir algo novo sobre o outro.</p><p><strong>Algumas ideias para começar:</strong></p><p>Uma aula de gastronomia japonesa, onde vocês preparam sushi lado a lado. Uma oficina de velas perfumadas para levar uma lembrança para casa. Ou até uma sessão de tufting para criar um tapete personalizado.</p><p>Na Elarah, acreditamos que as melhores histórias de amor são escritas offline. E a próxima pode começar aqui.</p>'
    },
    {
      title: 'Experiências para presentear alguém especial',
      author: 'Por Elarah',
      image: 'assets/experiences/vela-floral.jpg',
      text: '<p>Chega de presente genérico. Chega de vale-presente sem alma. Se você quer surpreender alguém de verdade, dê algo que ela vai <strong>sentir, viver e lembrar para sempre</strong>.</p><p>Presentear com experiência é o novo luxo. É mostrar que você pensou, escolheu e quis proporcionar algo que vai muito além do material.</p><p><strong>Para a mãe que merece mais:</strong> uma oficina de perfumaria criativa, onde ela cria sua própria fragrância. Para a amiga que ama novidade: uma aula de bartenderia com drinks autorais. Para aquele casal que tem tudo: uma experiência de pintura em cerâmica com vinho.</p><p>A Elarah oferece gift cards com valor livre e experiências específicas, todas com envio digital imediato. Você pode personalizar com uma mensagem especial e agendar para o dia perfeito.</p><p><strong>É simples:</strong> escolha, personalize, envie. Quem recebe escolhe o melhor dia e vive algo único.</p><p>Porque o melhor presente não se embrulha — se vive.</p>'
    },
    {
      title: 'O que fazer em São Paulo além do óbvio',
      author: 'Por Elarah',
      image: 'assets/experiences/ceo-kitchen.jpg',
      text: '<p>São Paulo é uma cidade que não dorme, não para e não deixa ninguém entediado — desde que você saiba onde procurar.</p><p>Além dos bares descolados e dos restaurantes da moda, existe uma cena criativa crescendo em cada bairro. <strong>Oficinas, ateliês, espaços colaborativos e experiências que transformam a rotina.</strong></p><p>No Brooklin, você pode fazer velas artesanais com aromas exclusivos em um estúdio aconchegante. Em Pinheiros, oficinas de cerâmica que parecem meditação. No Itaim, sessões de tufting onde você cria seu próprio tapete com uma pistola de agulha.</p><p><strong>E a gastronomia?</strong> Aulas imersivas de cozinha japonesa, tailandesa, lamen artesanal — tudo com a mão na massa e ingredientes premium.</p><p>O segredo de São Paulo não está nos guias turísticos. Está nas experiências que só quem vive descobre. E na Elarah, a gente cuida para que cada uma delas seja memorável.</p><p>Saia da tela. Viva a cidade. <strong>Offline is a feeling.</strong></p>'
    }
  ];

  var storyReader = document.getElementById('story-reader');
  var storyReaderBackdrop = document.getElementById('story-reader-backdrop');
  var storyReaderClose = document.getElementById('story-reader-close');
  var storyReaderImage = document.getElementById('story-reader-image');
  var storyReaderTitle = document.getElementById('story-reader-title');
  var storyReaderAuthor = document.getElementById('story-reader-author');
  var storyReaderText = document.getElementById('story-reader-text');

  function openStoryReader(index) {
    var story = storiesData[index];
    if (!story || !storyReader) return;
    storyReaderImage.src = story.image;
    storyReaderImage.alt = story.title;
    storyReaderTitle.textContent = story.title;
    storyReaderAuthor.textContent = story.author;
    storyReaderText.innerHTML = story.text;
    storyReader.classList.add('open');
    storyReader.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeStoryReader() {
    if (!storyReader) return;
    storyReader.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.stories__card').forEach(function(card) {
    card.addEventListener('click', function() {
      var index = parseInt(card.dataset.story, 10);
      openStoryReader(index);
    });
  });

  if (storyReaderBackdrop) storyReaderBackdrop.addEventListener('click', closeStoryReader);
  if (storyReaderClose) storyReaderClose.addEventListener('click', closeStoryReader);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && storyReader && storyReader.classList.contains('open')) {
      closeStoryReader();
    }
  });

  // ===== STRIPE CHECKOUT — Reservar =====
  // Delegação global: qualquer botão com [data-reserve] dispara
  // a Edge Function `create-checkout-session` e redireciona para
  // o Stripe Checkout.
  (function () {
    // Base pra todas as Edge Functions. CHECKOUT_FN_URL continua
    // apontando pra create-checkout-session (cartão/Stripe); as novas
    // funções da Mercado Pago (PIX) e reconcile usam a mesma base.
    const CHECKOUT_FN_BASE =
      'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1';
    const CHECKOUT_FN_URL =
      CHECKOUT_FN_BASE + '/create-checkout-session';
    const MP_PIX_FN_URL =
      CHECKOUT_FN_BASE + '/create-mp-pix-payment';
    const MP_CARD_FN_URL =
      CHECKOUT_FN_BASE + '/create-mp-card-payment';
    const REDEEM_FN_URL =
      CHECKOUT_FN_BASE + '/redeem-gift-card';
    const PAGARME_CHECKOUT_FN_URL =
      CHECKOUT_FN_BASE + '/create-pagarme-checkout';

    // ===== Flag de TESTE do Pagar.me (?pay=pagarme) =====
    // Só ativa com ?pay=pagarme na URL. Quando ativa, roteia TODO o
    // checkout (cartão à vista + parcelado até 12x + Pix) pro checkout
    // hospedado do Pagar.me. SEM esse parâmetro, nada muda — o cliente
    // normal segue no fluxo atual (Stripe/MP). Usada pra validar o
    // Pagar.me em produção-teste antes de virar o padrão.
    const PAY_PAGARME_TEST = (function () {
      var KEY = 'elarah_pay_pagarme';
      try {
        var v = new URLSearchParams(window.location.search).get('pay');
        if (v === 'pagarme') {
          // Persiste o modo teste — o site é multi-página (cada navegação
          // é um page load novo), então sem isso o ?pay se perderia ao ir
          // da home pra experiência/checkout.
          try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
          return true;
        }
        if (v === 'off' || v === 'normal') {
          // Escotilha pra sair do modo teste do Pagar.me.
          try { sessionStorage.removeItem(KEY); } catch (e) {}
          return false;
        }
        // Sem parâmetro na URL: mantém o que ficou guardado na sessão.
        try { return sessionStorage.getItem(KEY) === '1'; } catch (e) {}
      } catch (e) {}
      return false;
    })();

    // ===== Chave de migração do cartão: Mercado Pago → Stripe =====
    // DESLIGADO: o cartão vai pro STRIPE (Checkout), enquanto o motor de
    // risco do Mercado Pago recusa 100% dos cartões (cc_rejected_high_risk).
    // O PIX NÃO é afetado por esta chave — continua no Mercado Pago.
    // Escotilha de emergência: ?mpcard=1 na URL força o cartão de volta
    // pro Mercado Pago (rollback rápido sem depender de deploy).
    const MP_CARD_ENABLED = (function () {
      try {
        var q = new URLSearchParams(window.location.search);
        if (q.get('mpcard') === '0') return false; // força Stripe
        if (q.get('mpcard') === '1') return true;   // força Mercado Pago
      } catch (e) {}
      return false; // ← cartão via STRIPE (MP recusando no cartão)
    })();
    // Anon key do Supabase (JWT). Pode ficar exposta no front — é o
    // "publishable key" do projeto, sem privilégios além do RLS.
    const SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aWp4am1lbmJmeWVodnNjb2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA1MjQsImV4cCI6MjA5MTQyNjUyNH0.HPLrWNczhDxXH3eBLZHhsmrc3Tviah0eUuO1BsULQ-c';

    // =============================================================
    // MercadoPago.js V2 — Checkout Transparente (Secure Fields + Device ID)
    // -------------------------------------------------------------
    // Carrega o SDK oficial da MP sob demanda e busca a PUBLIC KEY do
    // backend (get-mp-public-key). Quando ambos existem, o cartão usa o
    // Checkout Transparente (formulário inline com Secure Fields + Device
    // ID → /v1/payments). Sem public key ou se o SDK falhar, o cartão cai
    // automaticamente no Checkout Pro (redirect) — zero regressão.
    //
    // O SDK, ao inicializar, também injeta o script de segurança da MP
    // (security.js) que popula window.MP_DEVICE_SESSION_ID — o Device ID
    // que enviamos no header X-meli-session-id via backend.
    //
    // Escotilha: ?mptransparent=0 força o Checkout Pro (rollback rápido).
    const MP_SDK_URL = 'https://sdk.mercadopago.com/js/v2';
    const MP_TRANSPARENT_FORCED_OFF = (function () {
      try {
        var q = new URLSearchParams(window.location.search);
        return q.get('mptransparent') === '0';
      } catch (e) { return false; }
    })();

    let _mpSdkPromise = null;
    function loadMercadoPagoSdk() {
      if (window.MercadoPago) return Promise.resolve(window.MercadoPago);
      if (_mpSdkPromise) return _mpSdkPromise;
      _mpSdkPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = MP_SDK_URL;
        s.async = true;
        s.onload = function () {
          if (window.MercadoPago) resolve(window.MercadoPago);
          else reject(new Error('MercadoPago.js carregou sem global MercadoPago'));
        };
        s.onerror = function () { reject(new Error('Falha ao carregar MercadoPago.js')); };
        document.head.appendChild(s);
      });
      return _mpSdkPromise;
    }

    // undefined = ainda não buscado; null = indisponível; string = chave.
    let _mpPublicKey;
    let _mpPublicKeyPromise = null;
    function getMpPublicKey() {
      if (typeof _mpPublicKey !== 'undefined') return Promise.resolve(_mpPublicKey);
      if (_mpPublicKeyPromise) return _mpPublicKeyPromise;
      _mpPublicKeyPromise = fetch(CHECKOUT_FN_BASE + '/get-mp-public-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        },
        body: '{}',
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          _mpPublicKey = (d && d.public_key) ? String(d.public_key) : null;
          if (_mpPublicKey) {
            console.log('[Elarah Payment/MP] Checkout Transparente disponível (public key carregada).');
          } else {
            console.log('[Elarah Payment/MP] sem public key — cartão usará Checkout Pro.');
          }
          return _mpPublicKey;
        })
        .catch(function (e) {
          console.warn('[Elarah Payment/MP] get-mp-public-key falhou — cartão usará Checkout Pro.', e);
          _mpPublicKey = null;
          return null;
        });
      return _mpPublicKeyPromise;
    }

    // Pré-aquece SDK + chave quando o cliente ABRE o checkout (não no
    // load da página, pra não gerar invocações à toa em cada pageview).
    // Chamado por openReservationModal.
    //
    // IMPORTANTE (captura do fingerprint): além de baixar o SDK, já
    // INSTANCIA o MercadoPago aqui. É a instanciação (`new MercadoPago`)
    // que faz o SDK carregar o security.js e gerar o Device ID
    // (window.MP_DEVICE_SESSION_ID). Fazendo isso na ABERTURA do modal, o
    // fingerprint tem vários segundos de folga pra ficar pronto antes de o
    // cliente clicar em pagar — elimina a race que mandava device_id vazio.
    function warmUpMercadoPago() {
      if (MP_TRANSPARENT_FORCED_OFF) return;
      try {
        getMpPublicKey().then(function (pk) {
          if (!pk) return;
          loadMercadoPagoSdk().then(function () {
            try {
              getMpInstance(); // dispara security.js + geração do Device ID
            } catch (e) {}
          }).catch(function () {});
        });
      } catch (e) {}
    }

    // Instância única do MercadoPago (criada quando a public key chega).
    let _mpInstance = null;
    function getMpInstance() {
      if (_mpInstance) return _mpInstance;
      if (!window.MercadoPago || !_mpPublicKey) return null;
      // advancedFraudPrevention:true (default do SDK) é o que carrega o
      // security.js e popula window.MP_DEVICE_SESSION_ID. Deixamos EXPLÍCITO
      // pra não depender do default e pra documentar a intenção.
      _mpInstance = new window.MercadoPago(_mpPublicKey, {
        locale: 'pt-BR',
        advancedFraudPrevention: true,
      });
      console.log('[Elarah MP] MercadoPago instanciado — security.js/fingerprint iniciando…');
      return _mpInstance;
    }

    // Espera o Device ID (fingerprint gerado pelo security.js) ficar
    // disponível. O security.js é carregado de forma assíncrona pelo SDK ao
    // instanciar o MercadoPago; o window.MP_DEVICE_SESSION_ID só aparece um
    // instante depois. Sem esperar, um submit rápido mandaria device_id
    // vazio pro MP (foi o que a análise do MP apontou). Resolve com o valor
    // assim que existir, ou com '' após o timeout (nunca trava pra sempre).
    function waitForDeviceId(timeoutMs) {
      if (typeof timeoutMs !== 'number' || timeoutMs < 0) timeoutMs = 8000;
      var start = Date.now();
      function current() {
        var v = window.MP_DEVICE_SESSION_ID;
        return (typeof v === 'string' && v.length > 0) ? v : '';
      }
      var immediate = current();
      if (immediate) return Promise.resolve({ id: immediate, waitedMs: 0 });
      return new Promise(function (resolve) {
        var poll = setInterval(function () {
          var v = current();
          if (v) {
            clearInterval(poll);
            resolve({ id: v, waitedMs: Date.now() - start });
          } else if (Date.now() - start > timeoutMs) {
            clearInterval(poll);
            resolve({ id: '', waitedMs: Date.now() - start });
          }
        }, 100);
      });
    }

    // ===== Tradução de erros do checkout =====
    // O backend pode retornar códigos técnicos (ex.: vagas_check_failed,
    // experience_sold_out) — sem mensagem humana, isso vaza pro modal e
    // assusta o cliente. Esta tabela traduz códigos conhecidos pra texto
    // em PT-BR. Inclui códigos antigos que podem estar em deploys
    // legados das Edge Functions, pra que NUNCA apareça código cru.
    const CHECKOUT_ERROR_MESSAGES = {
      vagas_check_failed:
        'Não conseguimos verificar a disponibilidade de vagas agora. Recarregue a página e tente de novo, ou nos chame no WhatsApp.',
      experience_sold_out: 'Esta experiência está esgotada.',
      slot_sold_out: 'Este horário está esgotado. Escolha outro horário disponível.',
      experience_cutoff_passed:
        'As reservas para esta experiência já encerraram. Escolha outra data.',
      experience_not_found: 'Experiência não encontrada. Recarregue a página.',
      experience_unavailable: 'Esta experiência não está mais disponível.',
      slot_unavailable: 'Este horário não está mais disponível. Escolha outro.',
      experience_lookup_failed:
        'Erro ao buscar a experiência. Tente novamente em instantes.',
      experiencia_id_required: 'Experiência inválida. Recarregue a página.',
      invalid_price: 'Preço da experiência inválido. Avise no WhatsApp para corrigirmos.',
      gift_card_invalid: 'Cupom inválido ou expirado.',
      gift_card_lookup_failed: 'Erro ao validar o cupom. Tente novamente.',
      coupon_invalid: 'Cupom inválido, expirado ou não vale para esta experiência.',
      gift_card_save_failed:
        'Erro ao registrar o gift card. Tente novamente em instantes.',
      gift_card_min_value: 'Valor do gift card abaixo do mínimo (R$ 50).',
      gift_card_max_value: 'Valor do gift card acima do máximo permitido.',
      recipient_email_required: 'Informe o e-mail do presenteado.',
      stripe_create_failed:
        'Erro ao iniciar o pagamento no Stripe. Tente novamente ou pague no PIX.',
      stripe_line_items_mismatch:
        'Erro interno no cálculo do total. Recarregue a página e tente de novo.',
      mp_create_failed:
        'Não foi possível processar o pagamento agora. Tente de novo ou use outro método.',
      mp_qr_missing:
        'Mercado Pago não devolveu o QR code. Tente novamente ou pague no cartão.',
      payment_method_id_required:
        'Dados do cartão incompletos. Recarregue a página e tente novamente.',
      booking_failed_after_charge:
        'O pagamento foi processado, mas houve um erro ao registrar a reserva. Guarde o código exibido e nos chame no WhatsApp.',
      amount_mismatch:
        'Erro interno no cálculo do total. Recarregue a página e tente novamente.',
      booking_failed:
        'Erro ao registrar sua reserva. Tente novamente ou nos chame no WhatsApp.',
      cpf_required: 'CPF inválido. Use 11 dígitos — PIX exige CPF válido.',
      email_required: 'E-mail é obrigatório para pagar via PIX.',
      server_misconfigured:
        'Pagamento temporariamente indisponível. Avise no WhatsApp.',
      checkout_unexpected_error:
        'Erro inesperado no checkout. Tente novamente em instantes ou nos chame no WhatsApp.',
      method_not_allowed: 'Método inválido. Recarregue a página.',
      invalid_json: 'Erro ao enviar os dados. Recarregue a página.',
    };

    // Recebe a resposta crua do backend (data) + um fallback humano e
    // devolve SEMPRE uma mensagem em português pronta pra mostrar no
    // erro do modal. Prioridade:
    //   1. data.message (já vem em PT do backend novo)
    //   2. tradução de data.error (códigos conhecidos)
    //   3. fallback genérico
    // Nunca devolve um código técnico (ex.: "vagas_check_failed") cru.
    function translateCheckoutError(data, fallback) {
      const fb = fallback || 'Não foi possível processar a reserva. Tente novamente.';
      if (!data) return fb;
      // Mensagem humana já veio do backend.
      if (data.message && typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }
      const code = data.error;
      if (!code) return fb;
      const codeStr = String(code).trim();
      if (Object.prototype.hasOwnProperty.call(CHECKOUT_ERROR_MESSAGES, codeStr)) {
        return CHECKOUT_ERROR_MESSAGES[codeStr];
      }
      // Código desconhecido: loga pra diagnóstico mas mostra fallback
      // genérico — nunca expõe o código cru pro usuário.
      console.warn('[Elarah Payment] código de erro desconhecido do backend:', codeStr);
      return fb;
    }

    function readActiveHorario(triggerEl) {
      if (!triggerEl) return null;
      if (triggerEl.dataset && triggerEl.dataset.horario) {
        return triggerEl.dataset.horario;
      }
      const card = triggerEl.closest && triggerEl.closest('.card, .originals__card, .exp-card');
      if (card) {
        const active = card.querySelector('.card__horario-btn--active');
        if (active && active.dataset && active.dataset.horario) {
          return active.dataset.horario;
        }
        const first = card.querySelector('.card__horario-btn');
        if (first && first.dataset) return first.dataset.horario || null;
        return null;
      }
      const detailActive = document.querySelector('.exp-detail__horario-btn--active:not([disabled])');
      if (detailActive && detailActive.dataset && detailActive.dataset.horario) {
        return detailActive.dataset.horario;
      }
      const detailFirst = document.querySelector('.exp-detail__horario-btn:not([disabled])');
      if (detailFirst && detailFirst.dataset) return detailFirst.dataset.horario || null;
      return null;
    }

    // Lê seleção completa de schedule (data + horario + slot_id) do
    // botão de reserva ou do horário ativo na página de detalhe.
    // Retorna { horario, data, dataLabel, slotId } — qualquer campo
    // pode ser null se não foi setado.
    function readActiveSchedule(triggerEl) {
      var result = { horario: null, data: null, dataLabel: null, slotId: null };
      if (!triggerEl) return result;
      // 1. Trigger explícito (botão Reservar com data-attrs setados pela UI)
      if (triggerEl.dataset) {
        if (triggerEl.dataset.horario) result.horario = triggerEl.dataset.horario;
        if (triggerEl.dataset.data) result.data = triggerEl.dataset.data;
        if (triggerEl.dataset.dataLabel) result.dataLabel = triggerEl.dataset.dataLabel;
        if (triggerEl.dataset.slotId) result.slotId = triggerEl.dataset.slotId;
        if (result.horario) return result;
      }
      // 2. Detail page — botão de horário ativo
      var detailActive = document.querySelector('.exp-detail__horario-btn--active:not([disabled])');
      if (detailActive && detailActive.dataset) {
        result.horario = detailActive.dataset.horario || result.horario;
        result.data = detailActive.dataset.data || result.data;
        result.dataLabel = detailActive.dataset.dataLabel || result.dataLabel;
        result.slotId = detailActive.dataset.slotId || result.slotId;
      }
      return result;
    }

    function readPrecoFromCard(triggerEl) {
      if (!triggerEl) return '';
      const card = triggerEl.closest('.card, .originals__card, .exp-card');
      if (!card) return '';
      const el = card.querySelector('[data-experience-preco], .card__price, .card__preco');
      if (!el) return '';
      return (el.getAttribute('data-experience-preco') || el.textContent || '').trim();
    }

    // "R$ 1.234,50" / "R$383" / "383,00" -> 38300
    function parsePrecoToCents(raw) {
      if (raw == null) return null;
      const text = String(raw).replace(/\s/g, '').replace(/^R\$/i, '');
      if (!text) return null;
      // Formato brasileiro: a vírgula é o separador DECIMAL e o ponto é
      // separador de MILHAR. Sem vírgula, qualquer ponto é milhar — por
      // isso "1.320" = 1320 (e não 1.32). Antes o código usava o texto
      // direto e Number("1.320") virava 1.32, cobrando R$1,32 por R$1.320.
      const norm = text.indexOf(',') !== -1
        ? text.replace(/\./g, '').replace(',', '.')
        : text.replace(/\./g, '');
      const num = Number(norm);
      if (!isFinite(num) || num <= 0) return null;
      return Math.round(num * 100);
    }

    function brl(centavos) {
      var v = Number(centavos || 0) / 100;
      try {
        return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } catch (e) {
        return 'R$ ' + v.toFixed(2).replace('.', ',');
      }
    }

    // Pega e-mail + nome do usuário logado (para pré-preencher o modal
    // de reserva). NÃO retorna o access_token — as Edge Functions usam
    // service role internamente, então o JWT do usuário não serve pra
    // nada lá. Todas as chamadas vão com o anon key (JWT válido, nunca
    // expira).
    //
    // O `nome` é resolvido nessa ordem:
    //   1. profiles.nome (fonte canônica, setada no cadastro)
    //   2. user_metadata.nome / full_name / name (fallback)
    async function getAuthInfo() {
      try {
        if (window.supabaseClient && window.supabaseClient.auth) {
          const { data } = await window.supabaseClient.auth.getSession();
          var session = data && data.session;
          if (session && session.user) {
            let nome = null;
            try {
              const { data: prof } = await window.supabaseClient
                .from('profiles')
                .select('nome')
                .eq('id', session.user.id)
                .maybeSingle();
              if (prof && prof.nome) {
                nome = String(prof.nome).trim() || null;
              }
            } catch (e) {
              console.warn('[Elarah checkout] prefill nome (profile) falhou', e);
            }
            if (!nome) {
              const meta = session.user.user_metadata || {};
              const rawNome = meta.nome || meta.full_name || meta.name || null;
              if (rawNome) nome = String(rawNome).trim() || null;
            }
            return { email: session.user.email || null, nome: nome };
          }
        }
      } catch (e) {
        console.warn('[Elarah checkout] auth lookup falhou', e);
      }
      return { email: null, nome: null };
    }

    // Chave usada pra reter o pedido enquanto o usuário faz login.
    const PENDING_KEY = 'elarah:pendingCheckout';

    function isUserLogged() {
      try {
        if (typeof ElarahAuth !== 'undefined' && ElarahAuth && typeof ElarahAuth.isLoggedIn === 'function') {
          return !!ElarahAuth.isLoggedIn();
        }
      } catch (e) {}
      return false;
    }

    function openLoginModal(msg) {
      // Esconde o spinner do clique de Reservar — mesmo motivo do que está
      // em openReservationModal: transição limpa quando o modal de login abre.
      try { if (window.ElarahReserveSpinner) window.ElarahReserveSpinner.hide(); } catch (e) {}
      try {
        if (typeof ElarahAuth !== 'undefined' && ElarahAuth && typeof ElarahAuth.openModal === 'function') {
          ElarahAuth.openModal('login', msg || 'Faça login para concluir sua reserva');
          return true;
        }
      } catch (e) {}
      return false;
    }

    // ===== Modal de confirmação de reserva (com campo de cupom) =====
    let modalRoot = null;
    function buildReservationModal() {
      if (modalRoot) return modalRoot;
      modalRoot = document.createElement('div');
      modalRoot.id = 'elarah-reserve-modal';
      modalRoot.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(20,12,4,.55);padding:20px;font-family:"DM Sans",sans-serif;';
      modalRoot.innerHTML = ''
        + '<div style="background:#fff;border-radius:18px;max-width:440px;width:100%;padding:28px 28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto;">'
        +   '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:6px;">'
        +     '<h3 id="erm-title" style="font-family:\'DM Serif Display\',serif;font-size:1.35rem;color:#1a1a1a;margin:0;">Confirmar reserva</h3>'
        +     '<button type="button" id="erm-close" aria-label="Fechar" style="background:none;border:none;font-size:24px;line-height:1;color:#999;cursor:pointer;padding:0 4px;">&times;</button>'
        +   '</div>'
        +   // ===== SEÇÃO FORMULÁRIO (default) =====
            '<div id="erm-form-section">'
        +   '<p id="erm-exp" style="margin:0 0 4px;color:#1a1a1a;font-size:1rem;font-weight:600;"></p>'
        +   '<p id="erm-meta" style="margin:0 0 18px;color:#666;font-size:.88rem;"></p>'
        +   // ===== INFO COMPLETA (voucher) — descrição, inclui, onde acontece,
            // horário de funcionamento e aviso, tudo numa tela só (sem tela de
            // descrição separada). Escondido por padrão; ligado via ctx.showFullInfo.
            '<div id="erm-info" style="display:none;margin:0 0 18px;">'
        +     '<div id="erm-info-hours" style="display:none;padding:14px 16px;background:#fbf3e6;border:1px solid #f0dcc0;border-radius:12px;margin-bottom:14px;"><div style="font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a4663b;margin-bottom:6px;">Horário de funcionamento</div><div id="erm-info-hours-text" style="font-size:.92rem;color:#3a2f28;line-height:1.5;font-weight:600;"></div></div>'
        +     '<div id="erm-info-desc" style="font-size:.92rem;color:#3a2f28;line-height:1.6;white-space:pre-line;margin-bottom:14px;"></div>'
        +     '<div id="erm-info-inclui" style="display:none;padding:14px 16px;background:#fff8ee;border:1px solid #f0cfa0;border-radius:12px;margin-bottom:12px;"><div style="font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a4663b;margin-bottom:6px;">O que está incluso</div><div id="erm-info-inclui-text" style="font-size:.9rem;color:#3a2410;line-height:1.5;"></div></div>'
        +     '<div id="erm-info-local" style="display:none;padding:14px 16px;background:#faf6f0;border:1px solid #eadfce;border-radius:12px;margin-bottom:12px;"><div style="font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:6px;">Onde acontece</div><div id="erm-info-local-text" style="font-size:.9rem;color:#3a2410;line-height:1.5;"></div></div>'
        +     '<div id="erm-info-note" style="display:none;padding:12px 14px;background:#fbf3e6;border:1px solid #f0dcc0;border-radius:10px;font-size:.84rem;color:#6b5744;line-height:1.5;"></div>'
        +   '</div>'
        +   // ===== SELETOR DE HORÁRIO (escondido por padrão) =====
            // Renderizado em openReservationModal quando exp.horarios > 1.
            // Sem isso, usuário ficava preso no horário escolhido fora do
            // modal e não conseguia trocar. Botões pill, mesmo padrão do
            // seletor de variante. ctx.horario reflete o escolhido.
            '<div id="erm-horario-section" style="display:none;margin-bottom:14px;">'
        +     '<label style="display:block;font-size:.85rem;color:#333;margin-bottom:8px;font-weight:600;">Horário *</label>'
        +     '<div id="erm-horario-options" style="display:flex;flex-wrap:wrap;gap:8px;"></div>'
        +   '</div>'
        +   // ===== SELETOR DE VARIANTE (escondido por padrão) =====
            // Renderizado dinamicamente em openReservationModal quando
            // ctx.variantOptions tem itens. Cliente escolhe 1 opção
            // (ex: Lagosta / Beijo / Olho grego). Vai como
            // variant_selected no payload do checkout.
            '<div id="erm-variant-section" style="display:none;margin-bottom:14px;">'
        +     '<label id="erm-variant-label" style="display:block;font-size:.85rem;color:#333;margin-bottom:8px;font-weight:600;"></label>'
        +     '<div id="erm-variant-options" style="display:flex;flex-wrap:wrap;gap:8px;"></div>'
        +     '<p id="erm-variant-msg" style="margin:6px 0 0;font-size:.78rem;color:#888;min-height:1em;"></p>'
        +   '</div>'
        +   // ===== SELETOR DE QUANTIDADE =====
            '<div style="margin-bottom:14px;">'
        +     '<label style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">Quantidade de vagas</label>'
        +     '<div style="display:flex;align-items:center;gap:10px;">'
        +       '<button type="button" id="erm-qty-minus" style="width:36px;height:36px;border:1px solid #ddd;border-radius:10px;background:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;">&minus;</button>'
        +       '<span id="erm-qty" style="font-size:1.1rem;font-weight:700;color:#1a1a1a;min-width:24px;text-align:center;">1</span>'
        +       '<button type="button" id="erm-qty-plus" style="width:36px;height:36px;border:1px solid #ddd;border-radius:10px;background:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;">+</button>'
        +     '</div>'
        +   '</div>'
        +   // ===== CONTAINER PARTICIPANTES ADICIONAIS =====
            '<div id="erm-participants" style="margin-bottom:14px;"></div>'
        +   // ===== SELEÇÃO DE MÉTODO DE PAGAMENTO =====
            // Cartão tem repasse de taxa; PIX é o preço limpo. A seleção
            // altera o breakdown acima e o valor final enviado pro Stripe.
            '<div style="margin-bottom:12px;">'
        +     '<label style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">Forma de pagamento</label>'
        +     '<div id="erm-pm-group" style="display:flex;gap:8px;">'
        +       '<button type="button" class="erm-pm-btn" data-pm="card" style="flex:1;padding:11px 10px;border:1px solid #f0a05e;background:#fff8ef;color:#1a1a1a;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;">Cartão</button>'
        +       '<button type="button" class="erm-pm-btn" data-pm="pix" style="flex:1;padding:11px 10px;border:1px solid #ddd;background:#fff;color:#666;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;">PIX</button>'
        +     '</div>'
        +     '<p id="erm-pm-hint" style="margin:6px 0 0;font-size:.78rem;color:#888;min-height:1em;">Cartão tem taxa de processamento. PIX não tem taxa.</p>'
        +   '</div>'
        +   '<div style="background:#faf6f0;border-radius:12px;padding:14px 16px;margin-bottom:16px;">'
        +     '<div style="display:flex;justify-content:space-between;font-size:.88rem;color:#666;"><span>Subtotal</span><span id="erm-subtotal"></span></div>'
        +     '<div id="erm-discount-row" style="display:none;justify-content:space-between;font-size:.88rem;color:#1a8a4a;margin-top:6px;"><span>Gift card</span><span id="erm-discount"></span></div>'
        +     '<div id="erm-fee-row" style="display:none;justify-content:space-between;font-size:.88rem;color:#666;margin-top:6px;"><span>Taxa do cartão</span><span id="erm-fee"></span></div>'
        +     '<div style="display:flex;justify-content:space-between;font-size:1.05rem;color:#1a1a1a;font-weight:700;margin-top:8px;border-top:1px solid #ece4d6;padding-top:8px;"><span>Total</span><span id="erm-total"></span></div>'
        +   '</div>'
        +   // ===== CAMPO EMAIL (visível só em CHECKOUT CONVIDADO — PR F) =====
            // Quando o usuário não está logado e a feature flag de guest
            // checkout está ativa, mostramos o campo email aqui. Criamos
            // conta automaticamente no submit (upgrade silencioso) e
            // mandamos magic link pra definir senha depois.
            '<div id="erm-email-wrap" style="display:none;">'
        +     '<label for="erm-email" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">E-mail <span style="color:#c0392b;">*</span></label>'
        +     '<input id="erm-email" type="email" autocomplete="email" placeholder="voce@email.com" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +     '<p id="erm-email-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Usamos pra te mandar o ingresso e seu acesso à conta.</p>'
        +   '</div>'
        +   // ===== CAMPO NOME COMPLETO (obrigatório) =====
            '<label for="erm-nome" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">Nome completo <span style="color:#c0392b;">*</span></label>'
        +   '<input id="erm-nome" type="text" required autocomplete="name" placeholder="Seu nome completo" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +   '<p id="erm-nome-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Como você quer aparecer na sua reserva.</p>'
        +   // ===== CAMPO TELEFONE / WHATSAPP (obrigatório) =====
            '<label for="erm-telefone" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">WhatsApp <span style="color:#c0392b;">*</span></label>'
        +   '<input id="erm-telefone" type="tel" required inputmode="tel" autocomplete="tel-national" placeholder="(11) 91234-5678" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +   '<p id="erm-telefone-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Usamos pra te avisar sobre a experiência e mudanças de horário.</p>'
        +   // ===== CAMPO CPF (obrigatório só quando método = PIX) =====
            '<div id="erm-cpf-wrap" style="display:none;">'
        +     '<label for="erm-cpf" style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;font-weight:600;">CPF <span style="color:#c0392b;">*</span></label>'
        +     '<input id="erm-cpf" type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" style="width:100%;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:4px;box-sizing:border-box;">'
        +     '<p id="erm-cpf-msg" style="margin:0 0 14px;font-size:.78rem;color:#888;min-height:1em;">Exigido pelo Mercado Pago pra gerar o PIX.</p>'
        +   '</div>'
        +   '<label style="display:block;font-size:.85rem;color:#333;margin-bottom:6px;">Cupom / Gift Card (opcional)</label>'
        +   '<div style="display:flex;gap:8px;">'
        +     '<input id="erm-cupom" type="text" placeholder="ELRH-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" style="flex:1;padding:11px 12px;border:1px solid #ddd;border-radius:10px;font-size:.92rem;text-transform:uppercase;">'
        +     '<button type="button" id="erm-validate" style="padding:11px 14px;border:1px solid #f0a05e;background:#fff;color:#f0a05e;border-radius:10px;font-weight:600;font-size:.88rem;cursor:pointer;white-space:nowrap;">Aplicar</button>'
        +   '</div>'
        +   '<p id="erm-cupom-msg" style="margin:6px 0 0;font-size:.82rem;min-height:1.1em;"></p>'
        +   '<button type="button" id="erm-confirm" style="width:100%;margin-top:18px;padding:14px;border:none;border-radius:12px;background:#f0a05e;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">Confirmar e pagar</button>'
        +   '<p id="erm-error" style="color:#c0392b;font-size:.85rem;margin:10px 0 0;min-height:1em;"></p>'
        +   '</div>' // fim erm-form-section
        +   // ===== SEÇÃO PIX QR CODE (só aparece após gerar o PIX) =====
            '<div id="erm-pix-section" style="display:none;">'
        +     '<p style="margin:0 0 4px;color:#1a1a1a;font-size:1rem;font-weight:600;">Pague com PIX pra confirmar sua reserva</p>'
        +     '<p id="erm-pix-exp" style="margin:0 0 14px;color:#666;font-size:.85rem;"></p>'
        +     '<div style="background:#faf6f0;border-radius:12px;padding:16px;margin-bottom:14px;text-align:center;">'
        +       '<img id="erm-pix-qr" alt="QR Code PIX" style="max-width:220px;width:100%;height:auto;margin:0 auto 10px;display:block;background:#fff;border-radius:8px;padding:8px;">'
        +       '<p style="margin:0;font-size:.82rem;color:#666;">Escaneie com o app do seu banco</p>'
        +     '</div>'
        +     '<label style="display:block;font-size:.78rem;color:#666;margin-bottom:4px;">Ou copie o código PIX:</label>'
        +     '<div style="display:flex;gap:6px;margin-bottom:14px;">'
        +       '<input id="erm-pix-code" type="text" readonly style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.75rem;background:#fafafa;color:#666;font-family:monospace;box-sizing:border-box;">'
        +       '<button type="button" id="erm-pix-copy" style="padding:10px 14px;border:1px solid #f0a05e;background:#fff;color:#f0a05e;border-radius:10px;font-weight:600;font-size:.85rem;cursor:pointer;white-space:nowrap;">Copiar</button>'
        +     '</div>'
        +     '<div id="erm-pix-status" style="padding:12px 14px;border-radius:10px;background:#fff8ef;border:1px solid #f4c48a;color:#8a5a1a;font-size:.88rem;text-align:center;margin-bottom:10px;">'
        +       '<span id="erm-pix-status-text">Aguardando confirmação do pagamento...</span>'
        +       '<div id="erm-pix-spinner" style="display:inline-block;width:12px;height:12px;border:2px solid #f0a05e;border-top-color:transparent;border-radius:50%;margin-left:8px;vertical-align:middle;animation:erm-spin 0.8s linear infinite;"></div>'
        +     '</div>'
        +     '<p id="erm-pix-expires" style="margin:0 0 10px;font-size:.78rem;color:#888;text-align:center;"></p>'
        +     '<button type="button" id="erm-pix-check" style="width:100%;padding:11px;border:1px solid #ddd;background:#fff;color:#666;border-radius:10px;font-weight:600;font-size:.88rem;cursor:pointer;margin-bottom:8px;">Já paguei, verificar agora</button>'
        +     '<button type="button" id="erm-pix-cancel" style="width:100%;padding:11px;border:none;background:transparent;color:#999;border-radius:10px;font-size:.85rem;cursor:pointer;">Cancelar e voltar</button>'
        +     '<style>@keyframes erm-spin { to { transform: rotate(360deg); } }</style>'
        +   '</div>' // fim erm-pix-section
        +   // ===== SEÇÃO CARTÃO — Checkout Transparente (Secure Fields) =====
            // Só aparece quando o cliente escolhe cartão E o Checkout
            // Transparente está disponível. Os campos número/validade/CVV
            // são iframes seguros da MP (Secure Fields → PCI). O restante
            // (nome, CPF, parcelas) são inputs nossos. O Device ID é
            // coletado automaticamente pelo SDK (window.MP_DEVICE_SESSION_ID).
            '<div id="erm-card-section" style="display:none;">'
        +     '<p style="margin:0 0 4px;color:#1a1a1a;font-size:1rem;font-weight:600;">Pague com cartão</p>'
        +     '<p id="erm-card-exp" style="margin:0 0 14px;color:#666;font-size:.85rem;"></p>'
        +     '<form id="erm-card-form">'
        +       '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">Número do cartão</label>'
        +       '<div id="erm-cc-number" style="height:44px;padding:0 12px;border:1px solid #ddd;border-radius:10px;margin-bottom:10px;background:#fff;"></div>'
        +       '<div style="display:flex;gap:10px;">'
        +         '<div style="flex:1;">'
        +           '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">Validade</label>'
        +           '<div id="erm-cc-exp" style="height:44px;padding:0 12px;border:1px solid #ddd;border-radius:10px;margin-bottom:10px;background:#fff;"></div>'
        +         '</div>'
        +         '<div style="flex:1;">'
        +           '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">CVV</label>'
        +           '<div id="erm-cc-cvv" style="height:44px;padding:0 12px;border:1px solid #ddd;border-radius:10px;margin-bottom:10px;background:#fff;"></div>'
        +         '</div>'
        +       '</div>'
        +       '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">Nome impresso no cartão</label>'
        +       '<input id="erm-cc-name" type="text" autocomplete="cc-name" placeholder="Como está no cartão" style="width:100%;height:44px;padding:0 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:10px;box-sizing:border-box;">'
        +       '<div style="display:flex;gap:10px;">'
        +         '<div style="width:120px;">'
        +           '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">Documento</label>'
        +           '<select id="erm-cc-idtype" style="width:100%;height:44px;padding:0 8px;border:1px solid #ddd;border-radius:10px;font-size:.9rem;margin-bottom:10px;background:#fff;box-sizing:border-box;"></select>'
        +         '</div>'
        +         '<div style="flex:1;">'
        +           '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">Número do documento</label>'
        +           '<input id="erm-cc-idnumber" type="text" inputmode="numeric" placeholder="000.000.000-00" style="width:100%;height:44px;padding:0 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:10px;box-sizing:border-box;">'
        +         '</div>'
        +       '</div>'
        +       '<label style="display:block;font-size:.82rem;color:#333;margin-bottom:4px;font-weight:600;">Parcelas</label>'
        +       '<select id="erm-cc-installments" style="width:100%;height:44px;padding:0 12px;border:1px solid #ddd;border-radius:10px;font-size:.95rem;margin-bottom:10px;background:#fff;box-sizing:border-box;"></select>'
        +       '<select id="erm-cc-issuer" style="display:none;"></select>'
        +       '<input id="erm-cc-email" type="hidden">'
        +       '<button type="submit" id="erm-card-pay" style="width:100%;margin-top:8px;padding:14px;border:none;border-radius:12px;background:#f0a05e;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;">Pagar</button>'
        +     '</form>'
        +     '<p id="erm-card-error" style="color:#c0392b;font-size:.85rem;margin:10px 0 0;min-height:1em;"></p>'
        +     '<div id="erm-card-status" style="display:none;padding:12px 14px;border-radius:10px;background:#fff8ef;border:1px solid #f4c48a;color:#8a5a1a;font-size:.88rem;text-align:center;margin-top:12px;">'
        +       '<span id="erm-card-status-text">Confirmando pagamento...</span>'
        +       '<div style="display:inline-block;width:12px;height:12px;border:2px solid #f0a05e;border-top-color:transparent;border-radius:50%;margin-left:8px;vertical-align:middle;animation:erm-spin 0.8s linear infinite;"></div>'
        +     '</div>'
        +     '<div id="erm-card-3ds" style="display:none;margin-top:12px;">'
        +       '<p style="margin:0 0 8px;font-size:.82rem;color:#666;text-align:center;">Autenticação do seu banco — conclua abaixo pra aprovar o pagamento.</p>'
        +       '<iframe id="erm-card-3ds-frame" name="erm-card-3ds-frame" style="width:100%;height:420px;border:1px solid #eee;border-radius:10px;background:#fff;"></iframe>'
        +     '</div>'
        +     '<button type="button" id="erm-card-back" style="width:100%;margin-top:10px;padding:11px;border:none;background:transparent;color:#999;border-radius:10px;font-size:.85rem;cursor:pointer;">Cancelar e voltar</button>'
        +     '<p style="margin:12px 0 0;font-size:.72rem;color:#aaa;text-align:center;">🔒 Dados do cartão protegidos pela Mercado Pago (Secure Fields).</p>'
        +   '</div>' // fim erm-card-section
        + '</div>';
      document.body.appendChild(modalRoot);

      modalRoot.addEventListener('click', function (e) {
        if (e.target === modalRoot) closeReservationModal();
      });
      modalRoot.querySelector('#erm-close').addEventListener('click', closeReservationModal);

      // Máscara simples de telefone BR: formata enquanto digita.
      // (11) 91234-5678 ou (11) 1234-5678 — aceita ambos.
      const telInput = modalRoot.querySelector('#erm-telefone');
      if (telInput) {
        telInput.addEventListener('input', function () {
          const raw = telInput.value.replace(/\D+/g, '').slice(0, 11);
          let formatted = raw;
          if (raw.length >= 1) formatted = '(' + raw.slice(0, 2);
          if (raw.length >= 3) formatted += ') ' + raw.slice(2, raw.length >= 11 ? 7 : 6);
          if (raw.length >= 7) {
            formatted += '-' + raw.slice(raw.length >= 11 ? 7 : 6);
          }
          telInput.value = formatted;
        });
      }

      // Máscara CPF: 000.000.000-00
      const cpfInput = modalRoot.querySelector('#erm-cpf');
      if (cpfInput) {
        cpfInput.addEventListener('input', function () {
          cpfInput.value = formatCpf(cpfInput.value);
        });
      }

      return modalRoot;
    }

    function closeReservationModal() {
      if (!modalRoot) return;
      stopPixPolling();
      stopCardPolling();
      modalRoot.style.display = 'none';
      document.body.style.overflow = '';
      // Volta o modal pro estado "formulário" pra próxima abertura.
      const form = modalRoot.querySelector('#erm-form-section');
      const pix = modalRoot.querySelector('#erm-pix-section');
      const card = modalRoot.querySelector('#erm-card-section');
      if (form) form.style.display = 'block';
      if (pix) pix.style.display = 'none';
      if (card) card.style.display = 'none';
    }

    // ===== PIX polling state =====
    // Gerenciado num só lugar pra facilitar cleanup no close/cancel.
    let pixPollingHandle = null;
    let pixPollingStartedAt = 0;
    const PIX_POLLING_INTERVAL_MS = 3000; // 3s
    const PIX_POLLING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

    function stopPixPolling() {
      if (pixPollingHandle) {
        clearInterval(pixPollingHandle);
        pixPollingHandle = null;
        console.log('[Elarah Payment/MP] polling parado');
      }
    }

    async function pollBookingStatus(bookingId) {
      try {
        if (!window.supabaseClient) return null;
        const { data, error } = await window.supabaseClient
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .maybeSingle();
        if (error) {
          console.warn('[Elarah Payment/MP] polling erro:', error.message);
          return null;
        }
        return data ? data.status : null;
      } catch (e) {
        console.warn('[Elarah Payment/MP] polling exceção:', e);
        return null;
      }
    }

    function startPixPolling(bookingId) {
      stopPixPolling();
      pixPollingStartedAt = Date.now();
      console.log('[Elarah Payment/MP] polling iniciado pra booking', bookingId);
      const tick = async function () {
        const elapsed = Date.now() - pixPollingStartedAt;
        if (elapsed > PIX_POLLING_TIMEOUT_MS) {
          stopPixPolling();
          const statusEl = modalRoot && modalRoot.querySelector('#erm-pix-status');
          const statusText = modalRoot && modalRoot.querySelector('#erm-pix-status-text');
          const spinner = modalRoot && modalRoot.querySelector('#erm-pix-spinner');
          if (statusEl) statusEl.style.background = '#fdecea';
          if (statusEl) statusEl.style.borderColor = '#f5b4ae';
          if (statusEl) statusEl.style.color = '#9c2f22';
          if (statusText) statusText.textContent = 'Tempo esgotado. Se você já pagou, clique em "Já paguei, verificar agora".';
          if (spinner) spinner.style.display = 'none';
          return;
        }
        const status = await pollBookingStatus(bookingId);
        if (status === 'pago') {
          stopPixPolling();
          console.log('[Elarah Payment/MP] pagamento confirmado! redirect pra success');
          window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(bookingId);
        } else if (status === 'cancelado' || status === 'expirado' || status === 'reembolsado') {
          stopPixPolling();
          const statusEl = modalRoot && modalRoot.querySelector('#erm-pix-status');
          const statusText = modalRoot && modalRoot.querySelector('#erm-pix-status-text');
          const spinner = modalRoot && modalRoot.querySelector('#erm-pix-spinner');
          if (statusEl) statusEl.style.background = '#fdecea';
          if (statusEl) statusEl.style.borderColor = '#f5b4ae';
          if (statusEl) statusEl.style.color = '#9c2f22';
          if (statusText) statusText.textContent = 'Pagamento ' + status + '. Feche e tente de novo.';
          if (spinner) spinner.style.display = 'none';
        }
        // status === 'pending' ou null → continua polling
      };
      pixPollingHandle = setInterval(tick, PIX_POLLING_INTERVAL_MS);
      // Tick imediato pra não esperar 3s se o webhook foi rápido.
      tick();
    }

    // Transforma o modal do estado "formulário" pro estado "QR code PIX".
    function showPixPanel(resp, ctx) {
      if (!modalRoot) return;
      const form = modalRoot.querySelector('#erm-form-section');
      const pix = modalRoot.querySelector('#erm-pix-section');
      if (form) form.style.display = 'none';
      if (pix) pix.style.display = 'block';

      // QR code (imagem PNG base64)
      const img = modalRoot.querySelector('#erm-pix-qr');
      if (img && resp.qr_code_base64) {
        img.src = 'data:image/png;base64,' + resp.qr_code_base64;
      }
      // Código copia-e-cola
      const codeInput = modalRoot.querySelector('#erm-pix-code');
      if (codeInput) codeInput.value = resp.qr_code || '';
      // Meta
      const metaEl = modalRoot.querySelector('#erm-pix-exp');
      if (metaEl) metaEl.textContent = [ctx.experienceNome, ctx.horario].filter(Boolean).join(' · ');
      // Expiração
      const expEl = modalRoot.querySelector('#erm-pix-expires');
      if (expEl && resp.expires_at) {
        try {
          const when = new Date(resp.expires_at);
          expEl.textContent = 'Válido até ' + when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { expEl.textContent = ''; }
      }
      // Status reset
      const statusEl = modalRoot.querySelector('#erm-pix-status');
      const statusText = modalRoot.querySelector('#erm-pix-status-text');
      const spinner = modalRoot.querySelector('#erm-pix-spinner');
      if (statusEl) { statusEl.style.background = '#fff8ef'; statusEl.style.borderColor = '#f4c48a'; statusEl.style.color = '#8a5a1a'; }
      if (statusText) statusText.textContent = 'Aguardando confirmação do pagamento...';
      if (spinner) spinner.style.display = 'inline-block';

      // Binds (cada show redefine pra ter closure do ctx/booking atual)
      const copyBtn = modalRoot.querySelector('#erm-pix-copy');
      if (copyBtn) {
        copyBtn.onclick = function () {
          try {
            const codeInputEl = modalRoot.querySelector('#erm-pix-code');
            codeInputEl.select();
            document.execCommand('copy');
            copyBtn.textContent = 'Copiado!';
            setTimeout(function () { copyBtn.textContent = 'Copiar'; }, 1800);
          } catch (e) { console.warn('[Elarah Payment/MP] copy falhou', e); }
        };
      }
      const cancelBtn = modalRoot.querySelector('#erm-pix-cancel');
      if (cancelBtn) {
        cancelBtn.onclick = function () { closeReservationModal(); };
      }
      const checkBtn = modalRoot.querySelector('#erm-pix-check');
      if (checkBtn) {
        checkBtn.onclick = async function () {
          checkBtn.disabled = true;
          checkBtn.textContent = 'Verificando...';
          try {
            // Chama endpoint de reconciliação pra forçar sincronização
            // com a MP (backup do webhook).
            await fetch(CHECKOUT_FN_BASE + '/check-mp-payment-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ booking_id: resp.booking_id }),
            });
          } catch (e) {
            console.warn('[Elarah Payment/MP] check manual falhou:', e);
          }
          checkBtn.disabled = false;
          checkBtn.textContent = 'Já paguei, verificar agora';
          // Tick imediato do polling
          const status = await pollBookingStatus(resp.booking_id);
          if (status === 'pago') {
            stopPixPolling();
            window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(resp.booking_id);
          }
        };
      }

      // Começa polling
      startPixPolling(resp.booking_id);
    }

    // =============================================================
    // CARTÃO — Checkout Transparente (Secure Fields + Device ID)
    // =============================================================
    let _cardFormInstance = null;
    // Guard de reentrância: impede que um duplo-clique / duplo-submit
    // (ex.: Enter + clique) reenvie o MESMO card_token_id → o MP responde
    // 3003 Invalid card_token_id (o token é de uso único).
    let _cardSubmitInFlight = false;
    // Contexto da tentativa atual — guardado pra permitir RE-MONTAR o
    // cardForm a cada nova tentativa (cada montagem gera um token novo).
    let _cardCtx = null;
    let _cardExtra = null;
    let cardPollingHandle = null;
    let cardPollingStartedAt = 0;
    const CARD_POLLING_INTERVAL_MS = 2500;
    const CARD_POLLING_TIMEOUT_MS = 3 * 60 * 1000; // 3 min

    function cardEl(sel) { return modalRoot ? modalRoot.querySelector(sel) : null; }

    function setCardStatus(text) {
      const st = cardEl('#erm-card-status');
      const t = cardEl('#erm-card-status-text');
      if (st) st.style.display = 'block';
      if (t) t.textContent = text;
    }
    function showCardError(msg) {
      const e = cardEl('#erm-card-error');
      if (e) e.textContent = msg || '';
      const pay = cardEl('#erm-card-pay');
      if (pay) { pay.disabled = false; pay.textContent = 'Pagar'; }
      const st = cardEl('#erm-card-status');
      if (st) st.style.display = 'none';
      // Libera um novo submit. (A regeneração do token — quando o anterior
      // foi consumido — é feita por remountCardFormFresh nas branches de
      // falha pós-envio, não aqui, pra não limpar os campos à toa em erros
      // de validação que nem chegaram a criar token.)
      _cardSubmitInFlight = false;
    }
    function setCardProcessing() {
      const pay = cardEl('#erm-card-pay');
      if (pay) { pay.disabled = true; pay.textContent = 'Processando...'; }
      const e = cardEl('#erm-card-error');
      if (e) e.textContent = '';
      setCardStatus('Confirmando pagamento...');
    }

    function stopCardPolling() {
      if (cardPollingHandle) { clearInterval(cardPollingHandle); cardPollingHandle = null; }
    }

    function startCardPolling(bookingId) {
      stopCardPolling();
      cardPollingStartedAt = Date.now();
      const tick = async function () {
        if (Date.now() - cardPollingStartedAt > CARD_POLLING_TIMEOUT_MS) {
          stopCardPolling();
          setCardStatus('Ainda confirmando… você receberá um e-mail assim que o pagamento aprovar.');
          return;
        }
        // Backup do webhook: força reconciliação server-side.
        try {
          await fetch(CHECKOUT_FN_BASE + '/check-mp-payment-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ booking_id: bookingId }),
          });
        } catch (e) {}
        const status = await pollBookingStatus(bookingId);
        if (status === 'pago') {
          stopCardPolling();
          window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(bookingId);
        } else if (status === 'cancelado' || status === 'reembolsado' || status === 'expirado') {
          stopCardPolling();
          showCardError('Pagamento não aprovado. Digite os dados do cartão novamente para tentar, ou pague no PIX.');
          remountCardFormFresh(); // token já foi consumido → recria pra gerar um novo
        }
      };
      cardPollingHandle = setInterval(tick, CARD_POLLING_INTERVAL_MS);
      tick();
    }

    // Traduz status_detail da MP em mensagens claras pro cliente. Cobre
    // os motivos de recusa mais comuns (documentação oficial da MP).
    function translateCardStatusDetail(detail) {
      const map = {
        cc_rejected_bad_filled_card_number: 'Confira o número do cartão.',
        cc_rejected_bad_filled_date: 'Confira a data de validade.',
        cc_rejected_bad_filled_security_code: 'Confira o código de segurança (CVV).',
        cc_rejected_bad_filled_other: 'Confira os dados do cartão.',
        cc_rejected_insufficient_amount: 'Cartão sem saldo/limite suficiente.',
        cc_rejected_high_risk: 'Pagamento recusado por segurança. Tente outro cartão ou pague no PIX.',
        cc_rejected_max_attempts: 'Muitas tentativas. Aguarde um pouco ou use outro cartão.',
        cc_rejected_call_for_authorize: 'Autorize o pagamento com seu banco e tente de novo.',
        cc_rejected_card_disabled: 'Cartão desabilitado. Ligue pro seu banco ou use outro cartão.',
        cc_rejected_duplicated_payment: 'Pagamento duplicado. Confira se já não foi aprovado.',
        cc_rejected_card_error: 'Não foi possível processar o cartão. Tente novamente.',
        cc_rejected_blacklist: 'Pagamento recusado. Tente outro cartão ou pague no PIX.',
        cc_rejected_invalid_installments: 'Parcelamento indisponível pra este cartão.',
        cc_rejected_other_reason: 'O banco recusou o pagamento. Tente outro cartão ou pague no PIX.',
      };
      return (detail && map[detail]) || null;
    }

    // Renderiza o desafio 3-D Secure 2 do banco dentro de um iframe.
    function renderThreeDsChallenge(threeds) {
      const wrap = cardEl('#erm-card-3ds');
      const frame = cardEl('#erm-card-3ds-frame');
      if (!wrap || !frame || !threeds || !threeds.external_resource_url) return;
      setCardStatus('Aguardando a autenticação do seu banco...');
      wrap.style.display = 'block';
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = threeds.external_resource_url;
      form.target = 'erm-card-3ds-frame';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'creq';
      input.value = threeds.creq || '';
      form.appendChild(input);
      document.body.appendChild(form);
      try { form.submit(); } catch (e) { console.warn('[Elarah MP card] 3DS submit falhou', e); }
      setTimeout(function () { try { document.body.removeChild(form); } catch (e) {} }, 1500);
    }

    // Monta e exibe o painel de cartão (Secure Fields). PODE LANÇAR
    // (SDK/chave indisponível) — o chamador cai no Checkout Pro nesse caso.
    async function showCardPanel(ctx, extra) {
      const pk = await getMpPublicKey();
      if (!pk) throw new Error('sem_public_key');
      await loadMercadoPagoSdk();
      const mp = getMpInstance();
      if (!mp || typeof mp.cardForm !== 'function') throw new Error('mp_indisponivel');

      // Só troca o modal DEPOIS de garantir que o SDK está pronto.
      const formSec = modalRoot.querySelector('#erm-form-section');
      const pixSec = modalRoot.querySelector('#erm-pix-section');
      const cardSec = modalRoot.querySelector('#erm-card-section');
      if (formSec) formSec.style.display = 'none';
      if (pixSec) pixSec.style.display = 'none';
      if (cardSec) cardSec.style.display = 'block';

      // Reset visual do painel.
      const errEl = cardEl('#erm-card-error'); if (errEl) errEl.textContent = '';
      const statusEl = cardEl('#erm-card-status'); if (statusEl) statusEl.style.display = 'none';
      const threeDsEl = cardEl('#erm-card-3ds'); if (threeDsEl) threeDsEl.style.display = 'none';
      const payBtn = cardEl('#erm-card-pay');
      if (payBtn) { payBtn.disabled = false; payBtn.textContent = 'Pagar ' + brl(ctx.totalCentavos || 0); }
      const expEl = cardEl('#erm-card-exp');
      if (expEl) expEl.textContent = [ctx.experienceNome, ctx.horario].filter(Boolean).join(' · ');

      const authEmail = (extra && extra.authEmail) || ctx.email || '';
      const emailHidden = cardEl('#erm-cc-email'); if (emailHidden) emailHidden.value = authEmail;
      const nameInput = cardEl('#erm-cc-name'); if (nameInput && ctx.nome) nameInput.value = ctx.nome;
      const idNumber = cardEl('#erm-cc-idnumber'); if (idNumber && ctx.cpf) idNumber.value = formatCpf(ctx.cpf);

      const backBtn = cardEl('#erm-card-back');
      if (backBtn) backBtn.onclick = function () { closeReservationModal(); };

      // Guarda o contexto da tentativa e monta o cardForm. Guardar ctx/extra
      // permite RE-MONTAR o formulário a cada nova tentativa (token de uso
      // único → recriar garante um card_token_id novo por tentativa).
      _cardCtx = ctx;
      _cardExtra = extra;
      _cardSubmitInFlight = false;
      buildCardForm(ctx, extra);
    }

    // Cria (ou recria) a instância do cardForm num estado limpo. Cada
    // montagem produz um cardForm que gera um token NOVO no próximo submit.
    // Como o token do Mercado Pago é de USO ÚNICO, recriar aqui é o que
    // garante um card_token_id novo por tentativa e elimina o 3003
    // (Invalid card_token_id) em retries. Não afeta o pagamento aprovado:
    // a 1ª tentativa sempre usa o token fresco desta montagem.
    function buildCardForm(ctx, extra) {
      const mp = getMpInstance();
      if (!mp || typeof mp.cardForm !== 'function') return null;
      // Desmonta a instância anterior (descarta qualquer token já usado).
      if (_cardFormInstance && typeof _cardFormInstance.unmount === 'function') {
        try { _cardFormInstance.unmount(); } catch (e) {}
      }
      _cardFormInstance = null;
      const amountReais = ((ctx.totalCentavos || 0) / 100).toFixed(2);
      _cardFormInstance = mp.cardForm({
        amount: amountReais,
        iframe: true,
        form: {
          id: 'erm-card-form',
          cardNumber: { id: 'erm-cc-number', placeholder: '0000 0000 0000 0000' },
          expirationDate: { id: 'erm-cc-exp', placeholder: 'MM/AA' },
          securityCode: { id: 'erm-cc-cvv', placeholder: 'CVV' },
          cardholderName: { id: 'erm-cc-name', placeholder: 'Nome impresso no cartão' },
          cardholderEmail: { id: 'erm-cc-email' },
          issuer: { id: 'erm-cc-issuer' },
          installments: { id: 'erm-cc-installments' },
          identificationType: { id: 'erm-cc-idtype' },
          identificationNumber: { id: 'erm-cc-idnumber' },
        },
        callbacks: {
          onFormMounted: function (error) {
            if (error) {
              console.error('[Elarah MP card] cardForm mount error', error);
              showCardError('Não foi possível carregar o formulário do cartão. Recarregue ou pague no PIX.');
            }
          },
          onSubmit: function (event) {
            event.preventDefault();
            submitCardPayment(ctx, extra);
          },
          onError: function (error) {
            console.warn('[Elarah MP card] cardForm error', error);
          },
        },
      });
      return _cardFormInstance;
    }

    // Re-monta o cardForm após uma tentativa que CONSUMIU o token (recusa,
    // erro do backend/MP, ou falha de rede após o envio). A instância antiga
    // — e o token que ela já usou — são descartados; o próximo submit gera
    // um card_token_id NOVO. É a garantia definitiva contra reuso de token.
    function remountCardFormFresh() {
      if (!_cardCtx) return;
      try { buildCardForm(_cardCtx, _cardExtra); }
      catch (e) { console.warn('[Elarah MP card] remount do cardForm falhou', e); }
    }

    // Tokeniza (já feito pelo cardForm) + envia pro backend criar o
    // pagamento no /v1/payments com Device ID.
    async function submitCardPayment(ctx, extra) {
      // Guard de reentrância: se já existe um submit em andamento, ignora
      // este (duplo-clique / Enter + clique). Sem isso, dois submits leriam
      // o mesmo token e o segundo tomaria 3003 Invalid card_token_id.
      if (_cardSubmitInFlight) {
        console.warn('[Elarah MP card] submit já em andamento — ignorando envio duplicado');
        return;
      }
      if (!_cardFormInstance || typeof _cardFormInstance.getCardFormData !== 'function') {
        showCardError('Formulário do cartão não está pronto. Recarregue e tente de novo.');
        return;
      }
      _cardSubmitInFlight = true;
      setCardProcessing();

      let cardData;
      try { cardData = _cardFormInstance.getCardFormData(); }
      catch (e) { showCardError('Confira os dados do cartão.'); return; }
      if (!cardData || !cardData.token) {
        showCardError('Não conseguimos validar o cartão. Confira número, validade e CVV.');
        return;
      }

      // Device ID (fingerprint do security.js). ESPERA ficar disponível
      // antes de criar o pagamento — elimina a race condition que mandava
      // device_id vazio pro MP. Como a instância já foi criada na abertura
      // do modal, na prática ele já está pronto aqui (waitedMs ~0).
      const deviceInfo = await waitForDeviceId(8000);
      const deviceId = deviceInfo.id;

      // ===== Logs de diagnóstico do fingerprint (SEM dado sensível) =====
      // Exposto em window.__elarahMpDeviceDiag pra inspeção fácil no
      // console em produção. NÃO logamos o valor do device id — só se
      // carregou, se gerou, o tamanho e quanto tempo esperamos.
      try {
        window.__elarahMpDeviceDiag = {
          sdk_loaded: !!window.MercadoPago,
          mp_instance_created: !!_mpInstance,
          fingerprint_ready: !!deviceId,
          mp_device_session_id_present: (typeof window.MP_DEVICE_SESSION_ID === 'string' && window.MP_DEVICE_SESSION_ID.length > 0),
          device_id_len: deviceId ? deviceId.length : 0,
          waited_ms: deviceInfo.waitedMs,
          at: new Date().toISOString(),
        };
        console.log('[Elarah MP card] fingerprint diag →', window.__elarahMpDeviceDiag);
      } catch (e) {}

      if (!deviceId) {
        console.warn(
          '[Elarah MP card] MP_DEVICE_SESSION_ID vazio após ' + deviceInfo.waitedMs +
          'ms — security.js pode estar bloqueado (rede/adblock do cliente). ' +
          'O pagamento segue, mas SEM fingerprint. Verifique CSP/extensões.'
        );
      }

      const body = {
        token: cardData.token,
        payment_method_id: cardData.paymentMethodId,
        issuer_id: cardData.issuerId,
        installments: Number(cardData.installments) || 1,
        identification_type: cardData.identificationType || 'CPF',
        device_id: deviceId,
        experiencia_id: ctx.experienceId,
        horario: ctx.horario,
        data: ctx.data || null,
        slot_id: ctx.slotId || null,
        email: ctx.email || (extra && extra.authEmail) || null,
        nome: ctx.nome || null,
        telefone: (extra && extra.telefoneRaw) || null,
        telefone_digits: (extra && extra.telefoneNormalized) || null,
        cupom: ctx.cupomCode || null,
        quantidade: ctx.quantidade || 1,
        participantes: ctx.participantes || [],
        variant_label: ctx.variantLabel || null,
        variant_selected: ctx.variantSelected || null,
        // Preço unitário da opção escolhida (centavos) — dica de segurança
        // pro backend não sair com o valor individual se o banco não
        // resolver o preço da variação. Backend só aceita pra cima.
        variant_price_expected_centavos: ctx.variantSelected ? (ctx.precoCentavos || null) : null,
        cpf: String(cardData.identificationNumber || '').replace(/\D+/g, ''),
      };

      try {
        const res = await fetch(MP_CARD_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(body),
        });
        const resp = await res.json().catch(function () { return null; });

        if (!res.ok || !resp) {
          // O token JÁ foi enviado ao /v1/payments — está consumido.
          // Recria o cardForm pra a próxima tentativa nascer com token novo.
          showCardError(translateCheckoutError(resp, 'Não foi possível processar o cartão. Digite os dados novamente e tente, ou pague no PIX.'));
          remountCardFormFresh();
          return;
        }
        if (resp.direct === true) {
          window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(resp.booking_id || '');
          return;
        }
        if (resp.rejected === true || resp.status === 'rejected' || resp.status === 'cancelled') {
          // Recusa = token consumido. Recria pra o retry gerar um token novo
          // (senão o reenvio do mesmo token daria 3003 Invalid card_token_id).
          showCardError(translateCardStatusDetail(resp.status_detail) || resp.message || 'Pagamento recusado. Digite os dados do cartão novamente para tentar, ou pague no PIX.');
          remountCardFormFresh();
          return;
        }

        // Funil — cartão enviado, aguardando confirmação.
        try {
          if (window.ElarahAnalytics && ElarahAnalytics.track) {
            ElarahAnalytics.track('payment_pending', {
              category: 'checkout',
              targetId: ctx.experienceId || null,
              targetLabel: (ctx.experienceNome || '').slice(0, 120),
              metadata: {
                payment_method: 'card',
                provider: 'mercado_pago',
                integration: 'checkout_transparente',
                booking_id: resp.booking_id,
                total_centavos: ctx.totalCentavos || 0,
              },
            });
          }
        } catch (_) {}

        // 3-D Secure 2: banco pediu autenticação → renderiza o desafio.
        if (resp.three_ds && resp.three_ds.external_resource_url && resp.three_ds.creq) {
          renderThreeDsChallenge(resp.three_ds);
          startCardPolling(resp.booking_id);
          return;
        }

        if (resp.status === 'approved' || resp.status === 'authorized') {
          setCardStatus('Pagamento aprovado! Confirmando sua reserva...');
        } else {
          setCardStatus('Pagamento em análise. Assim que aprovar, você recebe a confirmação por e-mail.');
        }
        startCardPolling(resp.booking_id);
      } catch (e) {
        console.error('[Elarah MP card] submit exception', e);
        // A requisição pode ter saído (token possivelmente consumido) —
        // recria por segurança pra o retry não reusar o mesmo token.
        showCardError('Erro de conexão ao processar o cartão. Digite os dados novamente e tente de novo.');
        remountCardFormFresh();
      }
    }

    let currentReservationCtx = null;

    // ===== Fee config cache =====
    // Busca as taxas do backend uma vez por sessão do navegador. Se
    // o backend não responder, cai no fallback 0/0 (sem repasse) —
    // nunca trava o checkout por causa da taxa. O admin pode mudar
    // os valores via env var; cliente velho pega novos valores no
    // próximo F5.
    // Timeout de 2s pra não travar o modal de checkout se o backend
    // de fee config estiver lento. Se passar de 2s, abortamos e caímos
    // no fallback 0/0 — pagamento NUNCA pode esperar configuração de
    // taxa. O usuário com impulso de compra evapora em segundos.
    const FEE_CONFIG_TIMEOUT_MS = 2000;
    let cachedFeeConfig = null;
    let feeConfigPromise = null;
    async function getFeeConfig() {
      if (cachedFeeConfig) return cachedFeeConfig;
      if (feeConfigPromise) return feeConfigPromise;
      feeConfigPromise = (async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FEE_CONFIG_TIMEOUT_MS);
        try {
          const res = await fetch(CHECKOUT_FN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ mode: 'fee_config' }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const data = await res.json().catch(() => null);
          if (res.ok && data) {
            cachedFeeConfig = {
              percent: Number(data.card_fee_percent || 0),
              fixedCents: Number(data.card_fee_fixed_cents || 0),
            };
            console.log('[Elarah Payment] fee config carregado:', cachedFeeConfig);
          } else {
            console.warn('[Elarah Payment] fee config falhou, usando fallback 0/0', data);
            cachedFeeConfig = { percent: 0, fixedCents: 0 };
          }
        } catch (e) {
          clearTimeout(timeoutId);
          if (e && e.name === 'AbortError') {
            console.warn('[Elarah Payment] fee config timeout em ' + FEE_CONFIG_TIMEOUT_MS + 'ms, fallback 0/0');
          } else {
            console.warn('[Elarah Payment] fee config exceção, fallback 0/0:', e);
          }
          cachedFeeConfig = { percent: 0, fixedCents: 0 };
        }
        return cachedFeeConfig;
      })();
      return feeConfigPromise;
    }

    // Calcula quanto de taxa seria adicionado pra um dado valor de
    // base (em centavos). Espelha o backend (applyCardFee).
    function computeCardFee(baseCents, feeConfig) {
      if (!feeConfig || baseCents <= 0) return 0;
      const pct = Math.round(baseCents * (feeConfig.percent / 100));
      return pct + feeConfig.fixedCents;
    }

    // Re-renderiza subtotal / desconto / taxa / total baseado no
    // estado atual do ctx (cupom aplicado + método escolhido).
    function refreshPriceBreakdown() {
      if (!currentReservationCtx || !modalRoot) return;
      const ctx = currentReservationCtx;
      const root = modalRoot;
      const qty = Math.max(1, ctx.quantidade || 1);
      const unitPrice = ctx.precoCentavos || 0;
      const subtotalCents = unitPrice * qty;
      console.log('[Elarah PRICE] refreshPriceBreakdown: qty=' + qty + ' unitPrice=' + unitPrice + ' subtotal=' + subtotalCents);
      const cupomCents = Number(ctx.cupomCentavos || 0);
      const baseAfterCupom = Math.max(0, subtotalCents - cupomCents);

      let feeCents = 0;
      if (ctx.paymentMethod === 'card' && baseAfterCupom > 0 && ctx.feeConfig) {
        feeCents = computeCardFee(baseAfterCupom, ctx.feeConfig);
      }
      const total = baseAfterCupom + feeCents;

      ctx.totalCentavos = total;
      ctx.feeCents = feeCents;

      root.querySelector('#erm-subtotal').textContent = qty > 1
        ? qty + 'x ' + brl(unitPrice) + ' = ' + brl(subtotalCents)
        : brl(unitPrice);
      root.querySelector('#erm-total').textContent = brl(total);

      const feeRow = root.querySelector('#erm-fee-row');
      if (feeCents > 0) {
        feeRow.style.display = 'flex';
        root.querySelector('#erm-fee').textContent = '+ ' + brl(feeCents);
      } else {
        feeRow.style.display = 'none';
      }

      // Atualiza texto do botão — deixa claro pro usuário.
      const confirmBtn = root.querySelector('#erm-confirm');
      if (total === 0) {
        confirmBtn.textContent = 'Confirmar reserva';
      } else if (ctx.paymentMethod === 'pix') {
        confirmBtn.textContent = 'Confirmar e pagar com PIX';
      } else {
        confirmBtn.textContent = 'Confirmar e pagar com cartão';
      }
    }

    // Visual toggle dos botões Cartão / PIX. Também mostra/esconde
    // o campo CPF (obrigatório só pra PIX via Mercado Pago).
    function updatePaymentMethodButtons() {
      if (!modalRoot || !currentReservationCtx) return;
      const ctx = currentReservationCtx;
      const buttons = modalRoot.querySelectorAll('.erm-pm-btn');
      buttons.forEach(function (btn) {
        const pm = btn.getAttribute('data-pm');
        if (pm === ctx.paymentMethod) {
          btn.style.background = '#fff8ef';
          btn.style.borderColor = '#f0a05e';
          btn.style.color = '#1a1a1a';
        } else {
          btn.style.background = '#fff';
          btn.style.borderColor = '#ddd';
          btn.style.color = '#666';
        }
      });
      const hint = modalRoot.querySelector('#erm-pm-hint');
      if (hint) {
        hint.textContent = ctx.paymentMethod === 'pix'
          ? 'PIX via Mercado Pago — sem taxa. Pague pelo QR Code e a reserva confirma sozinha.'
          : 'Cartão via Mercado Pago — taxa de processamento é repassada ao cliente.';
      }
      // Mostra/esconde campo CPF. O reset do valor NÃO acontece aqui
      // pra preservar o que o usuário digitou se ele alternar entre
      // os dois métodos.
      const cpfWrap = modalRoot.querySelector('#erm-cpf-wrap');
      if (cpfWrap) {
        cpfWrap.style.display = ctx.paymentMethod === 'pix' ? 'block' : 'none';
      }
    }

    // Valida CPF por dígito verificador (espelha o helper do backend).
    function isValidCpfFront(raw) {
      const digits = String(raw || '').replace(/\D+/g, '');
      if (digits.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(digits)) return false;
      const arr = digits.split('').map(Number);
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += arr[i] * (10 - i);
      let d1 = (sum * 10) % 11;
      if (d1 === 10) d1 = 0;
      if (d1 !== arr[9]) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += arr[i] * (11 - i);
      let d2 = (sum * 10) % 11;
      if (d2 === 10) d2 = 0;
      return d2 === arr[10];
    }

    // Formata CPF: 000.000.000-00
    function formatCpf(digits) {
      const d = String(digits || '').replace(/\D+/g, '').slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
      if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
      return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    }

    function openReservationModal(ctx) {
      // Esconde o spinner do clique de Reservar IMEDIATAMENTE quando o
      // modal abre — antes era escondido com 80ms de atraso no finally
      // do startCheckout, o que causava o spinner aparecer sobreposto
      // ao modal por um piscar. Agora a transição é limpa: modal abriu
      // = spinner some.
      try { if (window.ElarahReserveSpinner) window.ElarahReserveSpinner.hide(); } catch (e) {}
      // Pré-aquece o MercadoPago.js (SDK + public key) já na abertura do
      // checkout, pra que os Secure Fields do cartão apareçam sem espera.
      try { warmUpMercadoPago(); } catch (e) {}
      const root = buildReservationModal();
      currentReservationCtx = ctx;
      root.querySelector('#erm-exp').textContent = ctx.experienceNome || 'Experiência';
      var precoFmt = (window.ElarahData && ElarahData.formatPrecoBR) ? ElarahData.formatPrecoBR(ctx.precoLabel) : ctx.precoLabel;
      root.querySelector('#erm-meta').textContent = [ctx.horario, precoFmt]
        .filter(Boolean).join(' · ');

      // Info completa numa tela só (voucher): descrição, inclui, onde
      // acontece, horário de funcionamento e aviso — pra não ter uma tela
      // de descrição separada com a mesma capa.
      (function fillFullInfo() {
        var wrap = root.querySelector('#erm-info');
        if (!wrap) return;
        if (!ctx.showFullInfo) { wrap.style.display = 'none'; return; }
        wrap.style.display = 'block';
        function setBlock(boxId, textId, val) {
          var box = root.querySelector(boxId), txt = root.querySelector(textId);
          var v = (val == null ? '' : String(val)).trim();
          if (box) box.style.display = v ? 'block' : 'none';
          if (txt && v) txt.textContent = v;
        }
        setBlock('#erm-info-hours', '#erm-info-hours-text', ctx.horarioFuncionamento);
        var descEl = root.querySelector('#erm-info-desc');
        if (descEl) {
          var d = (ctx.descricao == null ? '' : String(ctx.descricao)).trim();
          descEl.textContent = d;
          descEl.style.display = d ? 'block' : 'none';
        }
        setBlock('#erm-info-inclui', '#erm-info-inclui-text', ctx.inclui);
        setBlock('#erm-info-local', '#erm-info-local-text', ctx.endereco);
        var note = root.querySelector('#erm-info-note');
        if (note) {
          if (ctx.horarioFuncionamento) {
            note.style.display = 'block';
            note.innerHTML = 'É só reservar. Se quiser, deixe um dia/horário de preferência — mas não precisa. ' +
              '<strong>No momento da compra, a Elarah entra em contato com você no mesmo dia</strong> para acertar o melhor horário, dentro do horário de funcionamento. 🤍';
          } else {
            note.style.display = 'none';
          }
        }
      })();
      root.querySelector('#erm-subtotal').textContent = brl(ctx.precoCentavos);
      root.querySelector('#erm-total').textContent = brl(ctx.precoCentavos);
      root.querySelector('#erm-discount-row').style.display = 'none';
      root.querySelector('#erm-cupom').value = '';
      root.querySelector('#erm-cupom-msg').textContent = '';
      root.querySelector('#erm-cupom-msg').style.color = '#666';
      root.querySelector('#erm-error').textContent = '';
      // Reset + prefill nome — usa o que já veio do auth/profile no ctx.
      const nomeInput = root.querySelector('#erm-nome');
      const nomeMsg = root.querySelector('#erm-nome-msg');
      if (nomeInput) {
        nomeInput.value = (ctx.nome || '').trim();
        if (nomeMsg) {
          nomeMsg.style.color = '#888';
          nomeMsg.textContent = 'Como você quer aparecer na sua reserva.';
        }
      }
      // Reset telefone field — cada reserva começa limpa.
      const telefoneInput = root.querySelector('#erm-telefone');
      if (telefoneInput) {
        telefoneInput.value = '';
        root.querySelector('#erm-telefone-msg').style.color = '#888';
        root.querySelector('#erm-telefone-msg').textContent =
          'Usamos pra te avisar sobre a experiência e mudanças de horário.';
      }
      // [PR F] Modo CHECKOUT CONVIDADO — exibe campo email no modal.
      // No submit, criamos conta automaticamente (signUp) com senha
      // aleatória e disparamos magic link pra pessoa definir senha.
      const emailWrap = root.querySelector('#erm-email-wrap');
      const emailInput = root.querySelector('#erm-email');
      const emailMsg = root.querySelector('#erm-email-msg');
      if (emailWrap) {
        if (ctx.isGuest) {
          emailWrap.style.display = 'block';
          if (emailInput) {
            emailInput.value = '';
            emailInput.required = true;
          }
          if (emailMsg) {
            emailMsg.style.color = '#888';
            emailMsg.textContent = 'Usamos pra te mandar o ingresso e seu acesso à conta.';
          }
        } else {
          emailWrap.style.display = 'none';
          if (emailInput) emailInput.required = false;
        }
      }
      // Reset CPF.
      const cpfInputReset = root.querySelector('#erm-cpf');
      if (cpfInputReset) {
        cpfInputReset.value = '';
        const cpfMsgReset = root.querySelector('#erm-cpf-msg');
        if (cpfMsgReset) {
          cpfMsgReset.style.color = '#888';
          cpfMsgReset.textContent = 'Exigido pelo Mercado Pago pra gerar o PIX.';
        }
      }
      // Garante o estado "formulário" (pode estar no PIX section
      // de uma abertura anterior).
      const formSectionInit = root.querySelector('#erm-form-section');
      const pixSectionInit = root.querySelector('#erm-pix-section');
      if (formSectionInit) formSectionInit.style.display = 'block';
      if (pixSectionInit) pixSectionInit.style.display = 'none';
      stopPixPolling();
      const confirmBtn = root.querySelector('#erm-confirm');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar e pagar';

      // Reset cupom state on context
      ctx.cupomCode = null;
      ctx.cupomCentavos = 0;
      ctx.totalCentavos = ctx.precoCentavos;

      // ===== Seletor de horário =====
      // Quando a experiência tem múltiplos horários, renderiza botões
      // pill pra usuário trocar dentro do modal. ctx.horario começa
      // com o que foi clicado fora (ou o primeiro) e atualiza on-click.
      var horarioSection = root.querySelector('#erm-horario-section');
      var horarioOptsEl = root.querySelector('#erm-horario-options');
      var horariosList = Array.isArray(ctx.horarios) ? ctx.horarios : [];
      if (horarioSection && horarioOptsEl && horariosList.length > 1) {
        horarioSection.style.display = 'block';
        horarioOptsEl.innerHTML = '';
        horariosList.forEach(function (h) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'erm-horario-btn';
          b.dataset.value = h;
          b.textContent = h;
          var isActive = h === ctx.horario;
          b.style.cssText = 'padding:9px 16px;border:1.5px solid ' +
            (isActive ? '#f0a05e' : '#ddd') + ';background:' +
            (isActive ? '#fff8ef' : '#fff') + ';color:' +
            (isActive ? '#1a1a1a' : '#444') +
            ';border-radius:999px;font-size:.86rem;font-weight:600;cursor:pointer;transition:all .15s;';
          b.addEventListener('click', function () {
            if (!currentReservationCtx) return;
            currentReservationCtx.horario = h;
            // Atualiza linha de meta com o novo horário.
            var metaEl = root.querySelector('#erm-meta');
            if (metaEl) {
              var preco2 = (window.ElarahData && ElarahData.formatPrecoBR)
                ? ElarahData.formatPrecoBR(currentReservationCtx.precoLabel)
                : currentReservationCtx.precoLabel;
              metaEl.textContent = [h, preco2].filter(Boolean).join(' · ');
            }
            // Reset visual e marca o escolhido.
            horarioOptsEl.querySelectorAll('.erm-horario-btn').forEach(function (other) {
              if (other.dataset.value === h) {
                other.style.background = '#fff8ef';
                other.style.borderColor = '#f0a05e';
                other.style.color = '#1a1a1a';
              } else {
                other.style.background = '#fff';
                other.style.borderColor = '#ddd';
                other.style.color = '#444';
              }
            });
          });
          horarioOptsEl.appendChild(b);
        });
      } else if (horarioSection) {
        horarioSection.style.display = 'none';
      }

      // ===== Seletor de variante (Pessoa 1 = comprador) =====
      // Quando a experiência tem variantOptions (ex: Pintura → Lagosta /
      // Beijo / Olho grego), renderiza botões pill pro comprador. Cada
      // participante adicional tem o próprio seletor dentro do card dele
      // (renderizado em renderParticipantFields). A escolha do comprador
      // vai em ctx.variantSelected (top-level, mantida pra compat com
      // metadata do Stripe e badge antigo do admin) E em
      // ctx.variantByParticipant[1] (índice 1 = Pessoa 1 = comprador;
      // 2..N = participantes adicionais). Cada participantes[i] também
      // recebe variant_selected antes do submit.
      ctx.variantSelected = null;
      ctx.variantByParticipant = {};
      // Preço-base (usado quando a variante escolhida não tem preço próprio).
      ctx.baseCentavos = ctx.precoCentavos || 0;
      var variantSection = root.querySelector('#erm-variant-section');
      var variantLabelEl = root.querySelector('#erm-variant-label');
      var variantOptsEl = root.querySelector('#erm-variant-options');
      var variantMsgEl = root.querySelector('#erm-variant-msg');
      // Presença de variação = TER OPÇÕES. O rótulo é opcional: se vier
      // vazio, usa "Escolha a sua opção" (mesmo padrão do detalhe e do
      // modal de descrição). Antes isso exigia ctx.variantLabel truthy e
      // uma variação salva sem rótulo sumia do checkout — o cliente
      // escolhia no detalhe mas nunca virava escolha obrigatória aqui.
      if (!ctx.variantLabel && Array.isArray(ctx.variantOptions) && ctx.variantOptions.length) {
        ctx.variantLabel = 'Escolha a sua opção';
      }
      var hasVariantsForExp = !!(
        Array.isArray(ctx.variantOptions) && ctx.variantOptions.length
      );

      // Helper: atualiza o rótulo do seletor do comprador conforme a
      // quantidade. Quando qty > 1, deixa explícito que esta escolha é
      // a da Pessoa 1 (o comprador); cada outra pessoa escolhe no card
      // dela. Quando qty = 1, só "Modelo do quadro *" basta.
      function updateBuyerVariantLabel() {
        if (!variantLabelEl || !hasVariantsForExp) return;
        if ((ctx.quantidade || 1) > 1) {
          variantLabelEl.textContent = 'Pessoa 1 (você) — ' + ctx.variantLabel + ' *';
        } else {
          variantLabelEl.textContent = ctx.variantLabel + ' *';
        }
      }

      if (variantSection && variantOptsEl && hasVariantsForExp) {
        variantSection.style.display = 'block';
        updateBuyerVariantLabel();
        variantOptsEl.innerHTML = '';
        if (variantMsgEl) {
          variantMsgEl.style.color = '#888';
          variantMsgEl.textContent = 'Escolha uma opção pra continuar.';
        }
        ctx.variantOptions.forEach(function (opt) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'erm-variant-btn';
          btn.dataset.value = opt;
          btn.textContent = opt;
          btn.style.cssText = 'padding:9px 16px;border:1.5px solid #ddd;background:#fff;color:#444;border-radius:999px;font-size:.86rem;font-weight:600;cursor:pointer;transition:all .15s;';
          btn.addEventListener('click', function () {
            if (!currentReservationCtx) return;
            currentReservationCtx.variantSelected = opt;
            // Pessoa 1 (comprador) sempre fica no índice 1 em
            // variantByParticipant. Mantém paridade com a numeração que
            // o usuário vê na UI ("Pessoa 1", "Pessoa 2", ...).
            currentReservationCtx.variantByParticipant = currentReservationCtx.variantByParticipant || {};
            currentReservationCtx.variantByParticipant[1] = opt;
            // Atualiza visual: o escolhido vira laranja, os demais voltam ao default.
            variantOptsEl.querySelectorAll('.erm-variant-btn').forEach(function (b) {
              if (b.dataset.value === opt) {
                b.style.background = '#fff8ef';
                b.style.borderColor = '#f0a05e';
                b.style.color = '#1a1a1a';
              } else {
                b.style.background = '#fff';
                b.style.borderColor = '#ddd';
                b.style.color = '#444';
              }
            });
            if (variantMsgEl) {
              variantMsgEl.style.color = '#1a8a4a';
              variantMsgEl.textContent = '✓ ' + ctx.variantLabel + ': ' + opt;
            }
            // Aplica o PREÇO da opção escolhida (Individual/Dupla/Trio com
            // valores diferentes). Sem preço próprio → mantém o preço-base.
            (function applyVariantPrice() {
              var cr = currentReservationCtx;
              var items = cr.variantItems;
              var it = Array.isArray(items)
                ? items.filter(function (x) { return x && x.nome === opt; })[0]
                : null;
              var pc = (it && it.preco && String(it.preco).trim())
                ? parsePrecoToCents(it.preco) : null;
              cr.precoCentavos = pc || cr.baseCentavos || cr.precoCentavos || 0;
              if (pc && it && it.preco) cr.precoLabel = it.preco;
              try {
                var precoFmt2 = (window.ElarahData && ElarahData.formatPrecoBR)
                  ? ElarahData.formatPrecoBR(cr.precoLabel) : cr.precoLabel;
                var metaEl = root.querySelector('#erm-meta');
                if (metaEl) metaEl.textContent = [cr.horario, precoFmt2].filter(Boolean).join(' · ');
              } catch (_e) {}
              try { refreshPriceBreakdown(); } catch (_e) {}
            })();
          });
          variantOptsEl.appendChild(btn);
        });
        // Pré-seleciona a opção já escolhida no modal de descrição, se for
        // da mesma experiência — evita pedir a variação duas vezes. O
        // .click() reusa o handler acima (seta ctx.variantSelected + visual).
        try {
          var _preSel = window.__elarahDescVariant;
          if (_preSel && _preSel.expId === ctx.experienceId && _preSel.selected) {
            var _preBtn = Array.prototype.filter.call(
              variantOptsEl.querySelectorAll('.erm-variant-btn'),
              function (b) { return b.dataset.value === _preSel.selected; }
            )[0];
            if (_preBtn) _preBtn.click();
          }
        } catch (_e) {}
      } else if (variantSection) {
        variantSection.style.display = 'none';
      }

      // ===== Estado do método de pagamento =====
      // Default: cartão — preserva UX atual pra quem já tá acostumado.
      ctx.paymentMethod = ctx.paymentMethod || 'card';
      ctx.feeCents = 0;
      ctx.feeConfig = cachedFeeConfig || null;
      // Esconde a linha de taxa até o fee_config carregar.
      const feeRowInit = root.querySelector('#erm-fee-row');
      if (feeRowInit) feeRowInit.style.display = 'none';
      updatePaymentMethodButtons();
      refreshPriceBreakdown();
      // Busca as taxas assincronamente — quando responder, re-renderiza.
      getFeeConfig().then(function (cfg) {
        if (!currentReservationCtx) return;
        currentReservationCtx.feeConfig = cfg;
        refreshPriceBreakdown();
      });

      // ===== Quantidade + Participantes =====
      ctx.quantidade = 1;
      ctx.participantes = [];
      var qtyEl = root.querySelector('#erm-qty');
      var participantsEl = root.querySelector('#erm-participants');
      if (qtyEl) qtyEl.textContent = '1';
      if (participantsEl) participantsEl.innerHTML = '';

      function renderParticipantFields() {
        if (!participantsEl) { console.warn('[Elarah QTY] participantsEl NAO ENCONTRADO'); return; }
        participantsEl.innerHTML = '';
        console.log('[Elarah QTY] renderParticipantFields: ctx.quantidade=' + ctx.quantidade);
        if (ctx.quantidade <= 1) return;
        for (var i = 2; i <= ctx.quantidade; i++) {
          var div = document.createElement('div');
          div.style.cssText = 'background:#faf6f0;border-radius:12px;padding:14px 16px;margin-bottom:10px;';
          var html =
            '<p style="margin:0 0 8px;font-size:.85rem;font-weight:600;color:#1a1a1a;">Pessoa ' + i + '</p>' +
            '<input type="text" class="erm-part-nome" placeholder="Nome completo *" data-idx="' + i + '" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.9rem;margin-bottom:8px;box-sizing:border-box;">' +
            '<input type="tel" class="erm-part-telefone" placeholder="WhatsApp *" data-idx="' + i + '" inputmode="tel" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.9rem;margin-bottom:6px;box-sizing:border-box;">' +
            '<input type="email" class="erm-part-email" placeholder="E-mail (opcional)" data-idx="' + i + '" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font-size:.9rem;box-sizing:border-box;">';
          // Seletor de variante do participante: cada Pessoa 2..N escolhe
          // o seu próprio quadro/variante. Sem isso, todo mundo herdava
          // a escolha da Pessoa 1 (comprador), o que confundia a operação
          // no dia da experiência.
          if (hasVariantsForExp) {
            html +=
              '<div class="erm-part-variant" data-idx="' + i + '" style="margin-top:10px;padding-top:10px;border-top:1px dashed #e5dccd;">' +
                '<label style="display:block;font-size:.78rem;color:#555;margin-bottom:6px;font-weight:600;">' +
                  htmlEscape(ctx.variantLabel) + ' *' +
                '</label>' +
                '<div class="erm-part-variant-options" data-idx="' + i + '" style="display:flex;flex-wrap:wrap;gap:6px;"></div>' +
                '<p class="erm-part-variant-msg" data-idx="' + i + '" style="margin:6px 0 0;font-size:.74rem;color:#888;min-height:1em;">Escolha pra continuar.</p>' +
              '</div>';
          }
          div.innerHTML = html;
          participantsEl.appendChild(div);

          // Adiciona os botões de variante via JS (closure no idx) pra
          // que cada botão saiba pra qual pessoa está votando. innerHTML
          // não preserva listeners, então tem que ser depois do append.
          if (hasVariantsForExp) {
            (function (capIdx) {
              var optsEl = div.querySelector('.erm-part-variant-options');
              var msgEl = div.querySelector('.erm-part-variant-msg');
              if (!optsEl) return;
              ctx.variantOptions.forEach(function (opt) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'erm-part-variant-btn';
                b.dataset.value = opt;
                b.dataset.idx = String(capIdx);
                b.textContent = opt;
                b.style.cssText = 'padding:7px 14px;border:1.5px solid #ddd;background:#fff;color:#444;border-radius:999px;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;';
                b.addEventListener('click', function () {
                  if (!currentReservationCtx) return;
                  currentReservationCtx.variantByParticipant = currentReservationCtx.variantByParticipant || {};
                  currentReservationCtx.variantByParticipant[capIdx] = opt;
                  optsEl.querySelectorAll('.erm-part-variant-btn').forEach(function (other) {
                    if (other.dataset.value === opt) {
                      other.style.background = '#fff8ef';
                      other.style.borderColor = '#f0a05e';
                      other.style.color = '#1a1a1a';
                    } else {
                      other.style.background = '#fff';
                      other.style.borderColor = '#ddd';
                      other.style.color = '#444';
                    }
                  });
                  if (msgEl) {
                    msgEl.style.color = '#1a8a4a';
                    msgEl.textContent = '✓ ' + ctx.variantLabel + ': ' + opt;
                  }
                });
                optsEl.appendChild(b);
              });
            })(i);
          }
        }
      }

      function updateQty(delta) {
        var newQty = Math.max(1, Math.min(10, ctx.quantidade + delta));
        if (newQty === ctx.quantidade) return;
        ctx.quantidade = newQty;
        if (qtyEl) qtyEl.textContent = String(newQty);
        console.log('[Elarah QTY] quantidade atualizada para', newQty);
        // renderParticipantFields() abaixo wipe os cards de Pessoa 2..N
        // (innerHTML zerado), então nome/telefone/email se perdem
        // visualmente. Pra manter o estado dos dados consistente com o
        // visual, descarta as escolhas de variante das Pessoas 2..N.
        // A escolha da Pessoa 1 (índice 1) sobrevive porque o seletor
        // dela vive no topo do modal e não é re-renderizado.
        if (ctx.variantByParticipant) {
          Object.keys(ctx.variantByParticipant).forEach(function (k) {
            if (Number(k) >= 2) delete ctx.variantByParticipant[k];
          });
        }
        renderParticipantFields();
        updateBuyerVariantLabel();
        refreshPriceBreakdown();
      }

      var minusBtn = root.querySelector('#erm-qty-minus');
      var plusBtn = root.querySelector('#erm-qty-plus');
      console.log('[Elarah QTY] elementos encontrados: qtyEl=' + !!qtyEl + ' participantsEl=' + !!participantsEl + ' minusBtn=' + !!minusBtn + ' plusBtn=' + !!plusBtn);
      if (minusBtn) minusBtn.onclick = function () { updateQty(-1); };
      if (plusBtn) plusBtn.onclick = function () { updateQty(1); };

      root.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Funil step 5 — checkout iniciado (modal abriu). Quem chega
      // até aqui já passou por: page_view → card_click → detail_view
      // → cta_click. Próximas etapas: checkout_submit → payment_*.
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('checkout_started', {
            category: 'checkout',
            targetId: ctx.experienceId || null,
            targetLabel: (ctx.experienceNome || '').slice(0, 120),
            metadata: {
              preco_centavos: ctx.precoCentavos || 0,
              horario: ctx.horario || null,
              has_variants: !!(ctx.variantOptions && ctx.variantOptions.length),
              has_horarios: !!(ctx.horarios && ctx.horarios.length > 1),
            },
          });
        }
      } catch (e) {}

      // Pré-preenche nome + telefone se o usuário já tiver cadastrado
      // no perfil. Usa fetch async sem bloquear o render — se der erro
      // ou demorar, o usuário digita manualmente. Só pré-preenche se o
      // campo ainda estiver vazio (ex.: auth.nome não veio antes da
      // abertura do modal).
      if (nomeInput || telefoneInput) {
        (async function prefillFromProfile() {
          try {
            if (!window.supabaseClient || !window.supabaseClient.auth) return;
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session || !session.user) return;
            const { data: prof, error } = await window.supabaseClient
              .from('profiles')
              .select('nome, telefone')
              .eq('id', session.user.id)
              .maybeSingle();
            if (error) {
              console.warn('[Elarah checkout] prefill profile falhou:', error.message);
              return;
            }
            if (!prof) return;
            if (nomeInput && prof.nome && !nomeInput.value) {
              nomeInput.value = String(prof.nome).trim();
              if (currentReservationCtx) currentReservationCtx.nome = nomeInput.value;
              console.log('[Elarah checkout] nome pré-preenchido do perfil');
            }
            if (telefoneInput && prof.telefone && !telefoneInput.value) {
              telefoneInput.value = prof.telefone;
              console.log('[Elarah checkout] telefone pré-preenchido do perfil');
            }
          } catch (e) {
            console.warn('[Elarah checkout] prefill profile exceção:', e);
          }
        })();
      }

      // Foca nome (ou telefone se o nome já estiver preenchido) pra
      // reduzir atrito.
      setTimeout(function () {
        try {
          if (nomeInput && !nomeInput.value) {
            nomeInput.focus({ preventScroll: true });
          } else if (telefoneInput) {
            telefoneInput.focus({ preventScroll: true });
          }
        } catch (e) {}
      }, 150);

      // Bind buttons (uma vez por abertura, com remoção do antigo)
      const validateBtn = root.querySelector('#erm-validate');
      validateBtn.onclick = function () { handleValidateCupom(); };
      confirmBtn.onclick = function () { handleConfirmReservation(); };

      // ===== Binds dos botões de método de pagamento =====
      // Clicar troca o método no ctx e re-renderiza o breakdown.
      // Não chama backend — tudo local até o confirm final.
      const pmButtons = root.querySelectorAll('.erm-pm-btn');
      pmButtons.forEach(function (btn) {
        btn.onclick = function () {
          if (!currentReservationCtx) return;
          const pm = btn.getAttribute('data-pm');
          if (pm !== 'card' && pm !== 'pix') return;
          if (currentReservationCtx.paymentMethod === pm) return;
          currentReservationCtx.paymentMethod = pm;
          console.log('[Elarah Payment] método trocado para', pm);
          updatePaymentMethodButtons();
          refreshPriceBreakdown();
        };
      });
      root.querySelector('#erm-cupom').onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); handleValidateCupom(); }
      };
      if (nomeInput) {
        nomeInput.onkeydown = function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (telefoneInput) {
              try { telefoneInput.focus({ preventScroll: true }); } catch (err) {}
            } else {
              handleConfirmReservation();
            }
          }
        };
      }
      if (telefoneInput) {
        telefoneInput.onkeydown = function (e) {
          if (e.key === 'Enter') { e.preventDefault(); handleConfirmReservation(); }
        };
      }
    }

    async function handleValidateCupom() {
      if (!currentReservationCtx) return;
      const root = modalRoot;
      const input = root.querySelector('#erm-cupom');
      const msg = root.querySelector('#erm-cupom-msg');
      const code = (input.value || '').trim().toUpperCase();
      if (!code) {
        msg.style.color = '#c0392b';
        msg.textContent = 'Digite um código.';
        return;
      }
      msg.style.color = '#666';
      msg.textContent = 'Validando...';

      // ===== Estratégia em 2 camadas =====
      // (1) Tenta direto via supabaseClient.rpc("preview_coupon") — não
      //     depende de Edge Function nova estar deployada. RPC é
      //     security definer, expõe pra anon, então funciona com a anon
      //     key que já está no client.
      // (2) Se a RPC falha (provavelmente porque sql/elarah_coupons.sql
      //     ainda não rodou no banco), cai pro Edge Function antigo
      //     redeem-gift-card que valida gift_cards legados.
      //
      // Antes era só (2). O problema: o redeem-gift-card deployado no
      // Supabase pode ser uma versão antiga (sem o fallback pra
      // preview_coupon), então um cupom novo aparecia como "código não
      // encontrado". Chamando direto via RPC, ignoramos qualquer drift
      // de deploy de Edge Function.

      // Base do desconto = preço UNITÁRIO × quantidade (o subtotal real).
      // Antes usava só o unitário: pra cupom de porcentagem com 2+
      // ingressos, a tela mostrava um desconto menor (e total maior) do
      // que o backend de fato aplica (que calcula sobre unit × qty).
      // Agora o preview do cupom bate exatamente com o valor cobrado.
      const _qtyForCoupon = Math.max(1, currentReservationCtx.quantidade || 1);
      const amountCentavos = (currentReservationCtx.precoCentavos || 0) * _qtyForCoupon;
      const experienciaId = currentReservationCtx.experienceId || null;

      // ----- Camada 1: preview_coupon via supabaseClient -----
      let validatedCoupon = null;
      try {
        if (window.supabaseClient && experienciaId) {
          const { data: cpData, error: cpErr } = await window.supabaseClient.rpc(
            'preview_coupon',
            {
              p_code: code,
              p_experience_id: experienciaId,
              p_amount_centavos: amountCentavos,
              p_quantidade: _qtyForCoupon,
            }
          );
          if (!cpErr) {
            const row = Array.isArray(cpData) ? cpData[0] : cpData;
            if (row && row.found) {
              validatedCoupon = row;
              console.log('[Elarah checkout] preview_coupon ok', row);
            }
          } else {
            console.warn('[Elarah checkout] preview_coupon RPC erro (fallback gift_card):', cpErr.message);
          }
        }
      } catch (e) {
        console.warn('[Elarah checkout] preview_coupon exceção (fallback gift_card):', e);
      }

      // Se achou cupom e é VÁLIDO, aplica direto e termina.
      if (validatedCoupon && validatedCoupon.valid) {
        const used = Number(validatedCoupon.discount_centavos || 0);
        currentReservationCtx.cupomCode = code;
        currentReservationCtx.cupomCentavos = used;
        msg.style.color = '#1a8a4a';
        const totalCents = amountCentavos;
        const coversFull = used >= totalCents;
        if (coversFull) {
          msg.textContent = 'Cupom cobre 100% — você não paga nada extra.';
        } else if (validatedCoupon.discount_type === 'percent') {
          msg.textContent = '✓ ' + validatedCoupon.discount_value + '% OFF aplicado: ' + brl(used) + ' de desconto.';
        } else {
          msg.textContent = '✓ Cupom aplicado: ' + brl(used) + ' de desconto.';
        }
        const drow = root.querySelector('#erm-discount-row');
        drow.style.display = 'flex';
        root.querySelector('#erm-discount').textContent = '- ' + brl(used);
        refreshPriceBreakdown();
        return;
      }

      // Se achou cupom mas é INVÁLIDO (expirado/restrito/esgotado/desativado),
      // mostra a mensagem do banco direto — não cai pro gift_card,
      // porque o usuário digitou algo que ELE achava ser cupom.
      if (validatedCoupon && !validatedCoupon.valid) {
        msg.style.color = '#c0392b';
        msg.textContent = validatedCoupon.message || 'Cupom inválido.';
        currentReservationCtx.cupomCode = null;
        currentReservationCtx.cupomCentavos = 0;
        root.querySelector('#erm-discount-row').style.display = 'none';
        refreshPriceBreakdown();
        return;
      }

      // ----- Camada 2: gift_card legado via Edge Function -----
      try {
        const res = await fetch(REDEEM_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            code: code,
            amount_centavos: amountCentavos,
            experiencia_id: experienciaId,
            quantidade: _qtyForCoupon,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data || !data.ok) {
          msg.style.color = '#c0392b';
          msg.textContent = (data && (data.message || data.error)) || 'Não foi possível validar o cupom.';
          return;
        }
        if (!data.valid) {
          msg.style.color = '#c0392b';
          msg.textContent = data.message || 'Cupom inválido.';
          currentReservationCtx.cupomCode = null;
          currentReservationCtx.cupomCentavos = 0;
          root.querySelector('#erm-discount-row').style.display = 'none';
          refreshPriceBreakdown();
          return;
        }
        const used = Number(data.used_centavos || 0);
        currentReservationCtx.cupomCode = code;
        currentReservationCtx.cupomCentavos = used;

        msg.style.color = '#1a8a4a';
        const isPercentCoupon = data.kind === 'coupon' && data.discount_type === 'percent';
        if (data.covers_full) {
          msg.textContent = 'Cupom cobre 100% — você não paga nada extra.';
        } else if (isPercentCoupon) {
          msg.textContent = '✓ ' + data.discount_value + '% OFF aplicado: ' + brl(used) + ' de desconto.';
        } else {
          msg.textContent = '✓ Cupom aplicado: ' + brl(used) + ' de desconto.';
        }
        const drow = root.querySelector('#erm-discount-row');
        drow.style.display = 'flex';
        root.querySelector('#erm-discount').textContent = '- ' + brl(used);
        refreshPriceBreakdown();
      } catch (e) {
        console.error('[Elarah checkout] validate cupom', e);
        msg.style.color = '#c0392b';
        msg.textContent = 'Erro ao validar o cupom.';
      }
    }

    // Valida telefone BR: pelo menos 10 dígitos (fixo) ou 11 (celular).
    // Aceita qualquer formato, só conta dígitos. Retorna a versão
    // só-dígitos (E.164 BR: 55 + DDD + número).
    function normalizePhoneBR(raw) {
      const digits = String(raw || '').replace(/\D+/g, '');
      if (digits.length < 10 || digits.length > 13) return null;
      // Se veio com 55 no início e tiver 12 ou 13 chars, remove.
      if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
        return digits.slice(2);
      }
      return digits;
    }

    async function handleConfirmReservation() {
      if (!currentReservationCtx) return;
      const ctx = currentReservationCtx;
      const root = modalRoot;
      const confirmBtn = root.querySelector('#erm-confirm');
      const errEl = root.querySelector('#erm-error');
      errEl.textContent = '';

      // ===== VALIDAÇÃO NOME =====
      const nomeInput = root.querySelector('#erm-nome');
      const nomeMsg = root.querySelector('#erm-nome-msg');
      const nomeRaw = nomeInput ? nomeInput.value.trim().replace(/\s+/g, ' ') : '';
      if (!nomeRaw || nomeRaw.length < 3) {
        if (nomeMsg) {
          nomeMsg.style.color = '#c0392b';
          nomeMsg.textContent = 'Informe seu nome completo.';
        }
        if (nomeInput) {
          try { nomeInput.focus({ preventScroll: true }); } catch (e) {}
        }
        console.warn('[Elarah checkout] nome inválido bloqueou o submit:', nomeRaw);
        return;
      }
      if (nomeMsg) {
        nomeMsg.style.color = '#888';
        nomeMsg.textContent = 'Como você quer aparecer na sua reserva.';
      }
      // Persiste no ctx pra que retries / fallbacks continuem tendo acesso.
      ctx.nome = nomeRaw;

      // ===== VALIDAÇÃO TELEFONE =====
      const telefoneInput = root.querySelector('#erm-telefone');
      const telefoneMsg = root.querySelector('#erm-telefone-msg');
      const telefoneRaw = telefoneInput ? telefoneInput.value.trim() : '';
      const telefoneNormalized = normalizePhoneBR(telefoneRaw);
      if (!telefoneNormalized) {
        if (telefoneMsg) {
          telefoneMsg.style.color = '#c0392b';
          telefoneMsg.textContent = 'Informe um WhatsApp válido com DDD (ex: 11 91234-5678).';
        }
        if (telefoneInput) {
          try { telefoneInput.focus({ preventScroll: true }); } catch (e) {}
        }
        console.warn('[Elarah checkout] telefone inválido bloqueou o submit:', telefoneRaw);
        return;
      }
      if (telefoneMsg) {
        telefoneMsg.style.color = '#888';
        telefoneMsg.textContent = 'Usamos pra te avisar sobre a experiência e mudanças de horário.';
      }
      console.log('[Elarah checkout] telefone válido:', telefoneNormalized);

      // ===== [PR F] VALIDAÇÃO EMAIL (só em checkout convidado) =====
      let guestEmailNorm = '';
      if (ctx.isGuest) {
        const emailInputV = root.querySelector('#erm-email');
        const emailMsgV = root.querySelector('#erm-email-msg');
        const emailRaw = emailInputV ? emailInputV.value.trim().toLowerCase() : '';
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
        if (!emailOk) {
          if (emailMsgV) {
            emailMsgV.style.color = '#c0392b';
            emailMsgV.textContent = 'Informe um e-mail válido.';
          }
          if (emailInputV) { try { emailInputV.focus({ preventScroll: true }); } catch (e) {} }
          return;
        }
        if (emailMsgV) {
          emailMsgV.style.color = '#888';
          emailMsgV.textContent = 'Usamos pra te mandar o ingresso e seu acesso à conta.';
        }
        guestEmailNorm = emailRaw;
        ctx.email = emailRaw;
      }

      // ===== VALIDAÇÃO CPF (só pra PIX) =====
      let cpfDigits = '';
      if (ctx.paymentMethod === 'pix') {
        const cpfInput = root.querySelector('#erm-cpf');
        const cpfMsg = root.querySelector('#erm-cpf-msg');
        const cpfRaw = cpfInput ? cpfInput.value.trim() : '';
        cpfDigits = cpfRaw.replace(/\D+/g, '');
        if (!isValidCpfFront(cpfDigits)) {
          if (cpfMsg) {
            cpfMsg.style.color = '#c0392b';
            cpfMsg.textContent = 'CPF inválido. PIX via Mercado Pago exige CPF válido.';
          }
          if (cpfInput) {
            try { cpfInput.focus({ preventScroll: true }); } catch (e) {}
          }
          console.warn('[Elarah Payment/MP] CPF inválido bloqueou o submit:', cpfDigits);
          return;
        }
        if (cpfMsg) {
          cpfMsg.style.color = '#888';
          cpfMsg.textContent = 'Exigido pelo Mercado Pago pra gerar o PIX.';
        }
        ctx.cpf = cpfDigits;
      }

      // ===== VALIDAÇÃO VARIANTE (Pintura: Lagosta/Beijo/Olho grego) =====
      // Cada pessoa precisa ter escolhido sua variante. Pessoa 1 (você)
      // usa o seletor do topo; Pessoa 2..N usa o seletor dentro do card.
      // Antes só a Pessoa 1 conseguia escolher e o resto herdava — virava
      // bagunça operacional no dia da experiência.
      var hasVariants = !!(ctx.variantLabel && Array.isArray(ctx.variantOptions) && ctx.variantOptions.length);
      if (hasVariants) {
        // Pessoa 1
        if (!ctx.variantSelected) {
          var vMsg = root.querySelector('#erm-variant-msg');
          if (vMsg) {
            vMsg.style.color = '#c0392b';
            vMsg.textContent = 'Escolha uma opção de ' + ctx.variantLabel + ' pra continuar.';
          }
          var vSection = root.querySelector('#erm-variant-section');
          if (vSection) {
            try { vSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
          }
          console.warn('[Elarah checkout] variante (Pessoa 1) não selecionada bloqueou o submit:', ctx.variantLabel);
          return;
        }
        // Mantém variantByParticipant[1] em sincronia com variantSelected
        // (caso o handler do clique não tenha rodado por algum motivo).
        ctx.variantByParticipant = ctx.variantByParticipant || {};
        ctx.variantByParticipant[1] = ctx.variantSelected;
        // Pessoa 2..N (validação acontece no loop abaixo, junto com nome/telefone)
      }

      // ===== VALIDAÇÃO PARTICIPANTES ADICIONAIS =====
      var participantes = [];
      if (ctx.quantidade > 1 && modalRoot) {
        var partNomes = modalRoot.querySelectorAll('.erm-part-nome');
        var partTels = modalRoot.querySelectorAll('.erm-part-telefone');
        var partEmails = modalRoot.querySelectorAll('.erm-part-email');
        var partValid = true;
        for (var pi = 0; pi < partNomes.length; pi++) {
          var pNome = partNomes[pi].value.trim();
          var pTel = partTels[pi] ? partTels[pi].value.trim() : '';
          var pEmail = partEmails[pi] ? partEmails[pi].value.trim() : '';
          var pIdx = pi + 2; // Pessoa 2 em diante (Pessoa 1 é o comprador)
          if (!pNome || pNome.length < 3) {
            partNomes[pi].style.borderColor = '#c0392b';
            errEl.textContent = 'Preencha o nome da Pessoa ' + pIdx + '.';
            try { partNomes[pi].focus({ preventScroll: true }); } catch (e) {}
            partValid = false;
            break;
          }
          partNomes[pi].style.borderColor = '#ddd';
          var pTelNorm = normalizePhoneBR(pTel);
          if (!pTelNorm) {
            partTels[pi].style.borderColor = '#c0392b';
            errEl.textContent = 'Informe o WhatsApp da Pessoa ' + pIdx + '.';
            try { partTels[pi].focus({ preventScroll: true }); } catch (e) {}
            partValid = false;
            break;
          }
          partTels[pi].style.borderColor = '#ddd';
          // Variante por pessoa: bloqueia o submit se faltou alguma.
          var pVariant = null;
          if (hasVariants) {
            pVariant = (ctx.variantByParticipant && ctx.variantByParticipant[pIdx]) || null;
            if (!pVariant) {
              errEl.textContent = 'Escolha o ' + ctx.variantLabel + ' da Pessoa ' + pIdx + '.';
              // Destaca a seção da pessoa
              var partVariantMsg = modalRoot.querySelector('.erm-part-variant-msg[data-idx="' + pIdx + '"]');
              if (partVariantMsg) {
                partVariantMsg.style.color = '#c0392b';
                partVariantMsg.textContent = 'Escolha pra continuar.';
              }
              var partVariantSec = modalRoot.querySelector('.erm-part-variant[data-idx="' + pIdx + '"]');
              if (partVariantSec) {
                try { partVariantSec.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
              }
              console.warn('[Elarah checkout] variante (Pessoa ' + pIdx + ') não selecionada bloqueou o submit');
              partValid = false;
              break;
            }
          }
          participantes.push({
            nome: pNome,
            telefone: pTel,
            telefone_digits: pTelNorm,
            email: pEmail || null,
            // variant_selected fica como undefined quando a experiência
            // não tem variantes — não polui metadata pra experiências
            // sem essa feature.
            variant_selected: pVariant || undefined,
          });
        }
        if (!partValid) return;
      }
      // Inclui o comprador como Pessoa 1 (índice 0 do array, mas Pessoa 1
      // na UI). Quando a experiência tem variantes, anexa a escolha do
      // comprador. Esse array vira metadata.participantes no booking.
      var compradorEntry = {
        nome: nomeRaw,
        telefone: telefoneRaw,
        telefone_digits: telefoneNormalized,
        email: null,
        variant_selected: hasVariants ? (ctx.variantSelected || null) : undefined,
      };
      var allParticipantes = [compradorEntry].concat(participantes);
      ctx.participantes = allParticipantes;

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processando...';

      // ===== [PR F] Checkout convidado — criar conta antes do booking =====
      // Quando o modal está em modo guest, fazemos signUp automático aqui.
      // Senha aleatória forte; pessoa define a real depois via reset-password.
      // Se email já está registrado → caímos pro fluxo de login normal.
      // Se signUp exige confirmação por email → mostra mensagem e bloqueia
      // (não dá pra criar booking sem session autenticada).
      if (ctx.isGuest && guestEmailNorm) {
        try {
          const supa = (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) || null;
          if (!supa || !supa.auth || typeof supa.auth.signUp !== 'function') {
            throw new Error('SDK_NOT_READY');
          }
          // Senha forte aleatória (32 chars base64).
          var pwBytes = new Uint8Array(24);
          (window.crypto || window.msCrypto).getRandomValues(pwBytes);
          var randomPwd = btoa(String.fromCharCode.apply(null, pwBytes))
            .replace(/[+/=]/g, 'x') + 'A1!';
          var signUpRes = await supa.auth.signUp({
            email: guestEmailNorm,
            password: randomPwd,
            options: {
              data: {
                nome: ctx.nome || '',
                telefone: telefoneNormalized || '',
                from_guest_checkout: true,
              }
            }
          });
          if (signUpRes && signUpRes.error) {
            var msg = (signUpRes.error.message || '').toLowerCase();
            if (msg.indexOf('already registered') !== -1 ||
                msg.indexOf('user already registered') !== -1 ||
                msg.indexOf('already exists') !== -1) {
              // Email já tem conta → cai pro login modal
              errEl.textContent = '';
              try { closeReservationModal(); } catch (e) {}
              try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({
                experienceId: ctx.experienceId,
                experienceNome: ctx.experienceNome,
                horario: ctx.horario,
                descriptionAcknowledged: true,
                ts: Date.now(),
              })); } catch (e) {}
              openLoginModal('Você já tem conta com este e-mail. Faça login pra continuar a reserva.');
              confirmBtn.disabled = false;
              confirmBtn.textContent = 'Confirmar e pagar';
              return;
            }
            throw signUpRes.error;
          }
          // Sucesso. Se o projeto exige confirmação por email, session vem null.
          if (!signUpRes.data || !signUpRes.data.session) {
            errEl.textContent = 'Confira seu e-mail pra confirmar sua conta e volte aqui pra finalizar a reserva.';
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar e pagar';
            return;
          }
          // Dispara magic link de reset pra pessoa definir senha real.
          // Fire-and-forget — não bloqueia o checkout.
          try {
            supa.auth.resetPasswordForEmail(guestEmailNorm, {
              redirectTo: (location.origin || '') + '/reset-password.html'
            });
          } catch (e) {}
          console.log('[Elarah Checkout/Guest] conta criada e logada:', guestEmailNorm);
        } catch (e) {
          console.error('[Elarah Checkout/Guest] erro no signUp:', e);
          errEl.textContent = 'Não conseguimos criar sua conta agora. Tente novamente em alguns segundos.';
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirmar e pagar';
          return;
        }
      }

      // Funil step 6 — usuário confirmou no formulário e estamos
      // chamando a edge function de pagamento. Diferencia de
      // checkout_started (modal só abriu) — captura intenção real.
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          ElarahAnalytics.track('checkout_submit', {
            category: 'checkout',
            targetId: ctx.experienceId || null,
            targetLabel: (ctx.experienceNome || '').slice(0, 120),
            metadata: {
              payment_method: ctx.paymentMethod || 'card',
              total_centavos: ctx.totalCentavos || ctx.precoCentavos || 0,
              quantidade: ctx.quantidade || 1,
              has_cupom: !!ctx.cupomCode,
              variant_selected: ctx.variantSelected || null,
            },
          });
        }
      } catch (e) {}

      try {
        const auth = await getAuthInfo();
        const headers = {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        };

        // Side-effect: atualiza telefone + nome no perfil do usuário
        // pra próxima reserva pré-preencher. Fire-and-forget, não
        // bloqueia o fluxo se falhar (RLS/network).
        try {
          if (window.supabaseClient && window.supabaseClient.auth) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user && session.user.id) {
              window.supabaseClient
                .from('profiles')
                .update({ telefone: telefoneRaw, nome: nomeRaw })
                .eq('id', session.user.id)
                .then(function (res) {
                  if (res && res.error) {
                    console.warn('[Elarah checkout] salvar telefone/nome no profile falhou (OK, segue):', res.error.message);
                  } else {
                    console.log('[Elarah checkout] telefone + nome salvos no perfil do usuário');
                  }
                });
            }
          }
        } catch (e) {
          console.warn('[Elarah checkout] não foi possível atualizar profile.telefone:', e);
        }

        // ===== TESTE Pagar.me (?pay=pagarme): checkout hospedado =====
        // Roteia cartão à vista + parcelado + Pix pro Pagar.me. Só entra
        // aqui quem abriu o site com ?pay=pagarme — cliente normal pula.
        if (PAY_PAGARME_TEST) {
          const pagarmeBody = {
            experiencia_id: ctx.experienceId,
            horario: ctx.horario,
            data: ctx.data || null,
            slot_id: ctx.slotId || null,
            email: auth.email || ctx.email,
            nome: ctx.nome || null,
            cpf: cpfDigits,
            telefone: telefoneRaw,
            telefone_digits: telefoneNormalized,
            cupom: ctx.cupomCode || null,
            quantidade: ctx.quantidade || 1,
            participantes: ctx.participantes || [],
            variant_label: ctx.variantLabel || null,
            variant_selected: ctx.variantSelected || null,
          };
          console.log('[Elarah Payment/Pagarme TESTE] criando checkout', {
            total: ctx.totalCentavos || 0,
          });
          const res = await fetch(PAGARME_CHECKOUT_FN_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(pagarmeBody),
          });
          const data = await res.json().catch(function () { return null; });
          if (!res.ok || !data) {
            let msg = translateCheckoutError(data, 'Não foi possível iniciar o pagamento (Pagar.me teste). Confira os dados.');
            if (data && data.detail) {
              msg += ' (Pagar.me: ' + JSON.stringify(data.detail).slice(0, 200) + ')';
            }
            errEl.textContent = msg;
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }
          // Cupom cobriu 100% — vai direto pra success.
          if (data.direct === true) {
            window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(data.booking_id || '');
            return;
          }
          if (data.checkout_url) {
            window.location.href = data.checkout_url;
            return;
          }
          errEl.textContent = 'Resposta inesperada do servidor (sem checkout_url).';
          confirmBtn.disabled = false;
          refreshPriceBreakdown();
          return;
        }

        // ===== Branch: PIX (Mercado Pago) OU Cartão (Stripe) =====
        if (ctx.paymentMethod === 'pix') {
          const pixBody = {
            experiencia_id: ctx.experienceId,
            horario: ctx.horario,
            data: ctx.data || null,
            slot_id: ctx.slotId || null,
            email: auth.email || ctx.email,
            nome: ctx.nome || null,
            cpf: cpfDigits,
            telefone: telefoneRaw,
            telefone_digits: telefoneNormalized,
            cupom: ctx.cupomCode || null,
            quantidade: ctx.quantidade || 1,
            participantes: ctx.participantes || [],
            variant_label: ctx.variantLabel || null,
            variant_selected: ctx.variantSelected || null,
            // Preço unitário da opção escolhida (centavos) — dica de segurança
            // pro backend: se o banco não resolver o preço da variação, ele usa
            // isto (só quando maior que o base) em vez do valor individual.
            variant_price_expected_centavos: ctx.variantSelected ? (ctx.precoCentavos || null) : null,
          };
          console.log('[Elarah CHECKOUT FINAL] PIX payload:', JSON.stringify({
            selectedQuantity: ctx.quantidade,
            unitPrice: ctx.precoCentavos,
            totalPrice: ctx.totalCentavos,
            participantsCount: (ctx.participantes || []).length,
            payloadQuantidade: pixBody.quantidade,
            payloadParticipantes: pixBody.participantes,
          }));
          console.log('[Elarah Payment/MP] criando PIX', {
            base: ctx.precoCentavos,
            cupom: ctx.cupomCentavos || 0,
            total: ctx.totalCentavos || 0,
          });
          const res = await fetch(MP_PIX_FN_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(pixBody),
          });
          const data = await res.json().catch(() => null);

          if (!res.ok || !data) {
            let msg = translateCheckoutError(data, 'Não foi possível gerar o PIX. Tente novamente ou pague no cartão.');
            if (data && data.detail) {
              const d = data.detail;
              const causes = Array.isArray(d.cause)
                ? d.cause.map(function(c) { return c.description; }).filter(Boolean)
                : [];
              const mpDetail = causes.length
                ? causes.join('; ')
                : (d.message || (typeof d === 'string' ? d : JSON.stringify(d)));
              if (mpDetail) msg += ' (MP: ' + mpDetail + ')';
              console.error('[Elarah PIX] MP error detail:', JSON.stringify(d));
            }
            errEl.textContent = msg;
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          if (data.direct === true) {
            // Cupom cobriu 100% — vai direto pra success.
            window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(data.booking_id || '');
            return;
          }

          if (!data.booking_id) {
            errEl.textContent = 'Resposta inesperada do servidor.';
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          // Fallback: se não veio QR inline mas veio ticket_url,
          // redireciona pra página da MP com o PIX.
          if (!data.qr_code_base64 && data.ticket_url) {
            window.location.href = data.ticket_url;
            return;
          }
          if (!data.qr_code_base64) {
            errEl.textContent = 'Resposta inesperada do servidor (QR code ausente).';
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          // Funil — PIX gerado com sucesso, esperando pagamento.
          // Distingue de payment_approved (que vem em success.html).
          try {
            if (window.ElarahAnalytics && ElarahAnalytics.track) {
              ElarahAnalytics.track('payment_pending', {
                category: 'checkout',
                targetId: ctx.experienceId || null,
                targetLabel: (ctx.experienceNome || '').slice(0, 120),
                metadata: {
                  payment_method: 'pix',
                  booking_id: data.booking_id,
                  total_centavos: ctx.totalCentavos || 0,
                },
              });
            }
          } catch (_) {}

          // Troca o modal pro painel de QR code e começa o polling.
          showPixPanel(data, ctx);
          return;
        }

        // ===== Cartão via Mercado Pago =====
        // Preferimos o CHECKOUT TRANSPARENTE (Secure Fields + Device ID,
        // formulário inline → /v1/payments). Só quando ele NÃO está
        // disponível (sem public key / SDK falhou / ?mptransparent=0) é
        // que caímos no Checkout Pro (redirect). A confirmação vem pelo
        // mp-webhook (mesmo fluxo do PIX) nos dois casos.
        if (MP_CARD_ENABLED) {
          // --- Tenta primeiro o Checkout Transparente ---
          if (!MP_TRANSPARENT_FORCED_OFF) {
            let mpPublicKey = null;
            try { mpPublicKey = await getMpPublicKey(); } catch (e) { mpPublicKey = null; }
            if (mpPublicKey) {
              try {
                await showCardPanel(ctx, {
                  telefoneRaw: telefoneRaw,
                  telefoneNormalized: telefoneNormalized,
                  authEmail: auth.email || ctx.email,
                });
                return; // o painel de cartão (Secure Fields) assumiu o fluxo
              } catch (eTransparent) {
                console.warn(
                  '[Elarah MP card] Checkout Transparente indisponível — fallback pro Checkout Pro',
                  eTransparent,
                );
                // Reexibe o formulário (showCardPanel pode ter escondido) e
                // segue pro Checkout Pro abaixo.
                const formSec = root.querySelector('#erm-form-section');
                const cardSec = root.querySelector('#erm-card-section');
                if (formSec) formSec.style.display = 'block';
                if (cardSec) cardSec.style.display = 'none';
              }
            }
          }

          // --- Fallback: Checkout Pro (preference + redirect) ---
          const mpCardBody = {
            experiencia_id: ctx.experienceId,
            horario: ctx.horario,
            data: ctx.data || null,
            slot_id: ctx.slotId || null,
            email: auth.email || ctx.email,
            nome: ctx.nome || null,
            telefone: telefoneRaw,
            telefone_digits: telefoneNormalized,
            cupom: ctx.cupomCode || null,
            quantidade: ctx.quantidade || 1,
            participantes: ctx.participantes || [],
            variant_label: ctx.variantLabel || null,
            variant_selected: ctx.variantSelected || null,
            // Dica de segurança do preço da variação (centavos) — backend
            // só usa se maior que o base. Ver create-checkout-session/guard.
            variant_price_expected_centavos: ctx.variantSelected ? (ctx.precoCentavos || null) : null,
          };
          console.log('[Elarah Payment/MP card] iniciando Checkout Pro', {
            base: ctx.precoCentavos,
            cupom: ctx.cupomCentavos || 0,
            total: ctx.totalCentavos || 0,
          });
          const resMp = await fetch(MP_CARD_FN_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(mpCardBody),
          });
          const dataMp = await resMp.json().catch(() => null);

          if (!resMp.ok || !dataMp) {
            let msg = translateCheckoutError(dataMp, 'Não foi possível iniciar o pagamento no cartão. Tente novamente ou pague no PIX.');
            if (dataMp && dataMp.detail) {
              const d = dataMp.detail;
              const causes = Array.isArray(d.cause)
                ? d.cause.map(function (c) { return c.description; }).filter(Boolean)
                : [];
              const mpDetail = causes.length
                ? causes.join('; ')
                : (d.message || (typeof d === 'string' ? d : JSON.stringify(d)));
              if (mpDetail) msg += ' (MP: ' + mpDetail + ')';
              console.error('[Elarah MP card] MP error detail:', JSON.stringify(d));
            }
            errEl.textContent = msg;
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          // Cupom cobriu 100% — vai direto pra success (nenhum cartão).
          if (dataMp.direct === true) {
            window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(dataMp.booking_id || '');
            return;
          }

          // Em teste (credenciais TEST-), usa o sandbox_init_point.
          const redirectUrl = dataMp.is_test
            ? (dataMp.sandbox_init_point || dataMp.init_point)
            : (dataMp.init_point || dataMp.sandbox_init_point);

          if (!redirectUrl) {
            errEl.textContent = 'Resposta inesperada do servidor (link de pagamento ausente).';
            confirmBtn.disabled = false;
            refreshPriceBreakdown();
            return;
          }

          // Funil — cartão iniciado, redirecionando pro Checkout Pro.
          try {
            if (window.ElarahAnalytics && ElarahAnalytics.track) {
              ElarahAnalytics.track('payment_pending', {
                category: 'checkout',
                targetId: ctx.experienceId || null,
                targetLabel: (ctx.experienceNome || '').slice(0, 120),
                metadata: {
                  payment_method: 'card',
                  provider: 'mercado_pago',
                  booking_id: dataMp.booking_id,
                  total_centavos: ctx.totalCentavos || 0,
                },
              });
            }
          } catch (_) {}

          window.location.href = redirectUrl;
          return;
        }

        // ===== Cartão: Stripe Checkout =====
        const body = {
          experiencia_id: ctx.experienceId,
          horario: ctx.horario,
          data: ctx.data || null,
          slot_id: ctx.slotId || null,
          email: auth.email || ctx.email,
          nome: ctx.nome || null,
          telefone: telefoneRaw,
          telefone_digits: telefoneNormalized,
          cupom: ctx.cupomCode || null,
          payment_method: 'card',
          quantidade: ctx.quantidade || 1,
          participantes: ctx.participantes || [],
          variant_label: ctx.variantLabel || null,
          variant_selected: ctx.variantSelected || null,
          // Dica de segurança do preço da variação (centavos) — backend só
          // usa se maior que o base. Ver create-checkout-session.
          variant_price_expected_centavos: ctx.variantSelected ? (ctx.precoCentavos || null) : null,
        };
        console.log('[Elarah CHECKOUT FINAL] Stripe payload:', JSON.stringify({
          selectedQuantity: ctx.quantidade,
          unitPrice: ctx.precoCentavos,
          totalPrice: ctx.totalCentavos,
          participantsCount: (ctx.participantes || []).length,
          payloadQuantidade: body.quantidade,
          payloadParticipantes: body.participantes,
        }));
        console.log('[Elarah Payment] enviando checkout cartão', {
          base: ctx.precoCentavos,
          cupom: ctx.cupomCentavos || 0,
          fee: ctx.feeCents || 0,
          total: ctx.totalCentavos || 0,
        });
        const res = await fetch(CHECKOUT_FN_URL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          const msg = translateCheckoutError(data, 'Não foi possível processar a reserva. Tente novamente.');
          errEl.textContent = msg;
          confirmBtn.disabled = false;
          refreshPriceBreakdown();
          return;
        }

        // Defesa adicional: alguns deploys legados respondem 200 OK
        // mesmo carregando { error: "..." } no corpo. Sem essa checagem
        // o front segue como sucesso e tenta redirecionar pra undefined.
        if (data.error && !data.url && data.direct !== true) {
          errEl.textContent = translateCheckoutError(data, 'Não foi possível processar a reserva. Tente novamente.');
          confirmBtn.disabled = false;
          refreshPriceBreakdown();
          return;
        }

        if (data.direct === true) {
          window.location.href = '/success.html?direct=1&booking_id=' + encodeURIComponent(data.booking_id || '');
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        errEl.textContent = 'Resposta inesperada do servidor.';
        confirmBtn.disabled = false;
        refreshPriceBreakdown();
      } catch (e) {
        console.error('[Elarah Payment] confirm erro:', e);
        errEl.textContent = 'Erro ao confirmar. Tente novamente.';
        confirmBtn.disabled = false;
        refreshPriceBreakdown();
        // Funnel — checkout falhou. Captura motivo (mensagem do erro
        // truncada) pra agrupar no admin: "top motivos de erro".
        try {
          if (window.ElarahAnalytics && ElarahAnalytics.track) {
            ElarahAnalytics.track('checkout_error', {
              category: 'checkout',
              targetId: ctx.experienceId || null,
              targetLabel: (ctx.experienceNome || '').slice(0, 120),
              metadata: {
                payment_method: ctx.paymentMethod || 'card',
                error_message: String((e && e.message) || e || 'unknown').slice(0, 200),
                stage: 'confirm_exception',
              },
            });
          }
        } catch (_) {}
      }
    }

    // =====================================================
    //  DESCRIPTION GATE — modal intermediária antes do checkout
    // =====================================================
    // Estado do gate. Guard pra impedir que dois cliques em sequência
    // abram duas modais e pra permitir cancelar um gate anterior
    // quando o usuário clica em Reservar de uma experiência diferente.
    let descriptionGateState = {
      open: false,
      currentExpId: null,
      resolve: null, // Promise resolver pendente
      cleanup: null, // Função pra desmontar a modal
    };

    function htmlEscape(str) {
      if (str == null) return '';
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }

    // Converte texto com quebras de linha em <p>s separados,
    // preservando parágrafos da descrição. Escapa HTML.
    function descriptionTextToHtml(text) {
      const raw = String(text || '').trim();
      if (!raw) return '';
      const paragraphs = raw.split(/\n{2,}|\r\n{2,}/);
      return paragraphs
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          // Quebras de linha simples dentro de um parágrafo viram <br>
          const escaped = htmlEscape(p).replace(/\n/g, '<br>');
          return '<p style="margin:0 0 14px;line-height:1.65;color:#3a3a3a;font-size:.95rem;">' + escaped + '</p>';
        })
        .join('');
    }

    // Destrói a modal atual (se existir). Se `resolveWith` for passado,
    // resolve a Promise pendente com esse valor antes de remover o DOM.
    function tearDownDescriptionGate(resolveWith) {
      const s = descriptionGateState;
      if (typeof s.resolve === 'function') {
        try { s.resolve(resolveWith === true); } catch (e) {}
      }
      if (typeof s.cleanup === 'function') {
        try { s.cleanup(); } catch (e) {}
      }
      descriptionGateState = {
        open: false,
        currentExpId: null,
        resolve: null,
        cleanup: null,
      };
      // Libera o scroll do body se não tiver outra modal aberta.
      if (!document.querySelector('.elarah-desc-modal.open')) {
        document.body.style.overflow = '';
      }
    }

    // Ponto de entrada principal. Resolve para `true` se o usuário
    // confirmou o "Continuar para pagamento", `false` caso contrário
    // (inclusive se a experiência não tiver descrição — nesse caso
    // resolvemos true imediatamente pra o fluxo seguir normalmente).
    async function runDescriptionGate(experienceId, experienceNome, triggerBtn) {
      // --- Fast path 1: ElarahData indisponível ---
      if (!window.ElarahData || typeof window.ElarahData.getExperienceById !== 'function') {
        console.warn('[Elarah Description Flow] ElarahData indisponível, indo direto para checkout');
        return true;
      }

      // --- Fast path 2: já tem uma modal aberta pra esta experiência ---
      // (proteção contra double-click no mesmo botão)
      if (descriptionGateState.open && descriptionGateState.currentExpId === experienceId) {
        console.warn('[Elarah Description Flow] modal já aberta pra esta experiência, ignorando clique duplicado');
        return false;
      }

      // --- Fast path 3: existe modal aberta pra OUTRA experiência ---
      // (usuário clicou em Reservar de outra experiência sem fechar)
      if (descriptionGateState.open) {
        console.log('[Elarah Description Flow] fechando modal anterior de outra experiência');
        tearDownDescriptionGate(false);
      }

      // --- Busca a experiência com timeout defensivo ---
      let exp = null;
      try {
        const fetchPromise = window.ElarahData.getExperienceById(experienceId);
        // Timeout de 3s — se ElarahData estiver travado, não bloqueia
        // o checkout. Default: pula a modal e segue direto.
        exp = await Promise.race([
          Promise.resolve(fetchPromise),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
      } catch (e) {
        console.warn('[Elarah Description Flow] falha ao carregar experiência, indo direto para checkout:', e && e.message ? e.message : e);
        return true;
      }

      if (!exp) {
        console.warn('[Elarah Description Flow] experiência não encontrada em ElarahData, indo direto para checkout');
        return true;
      }

      // Voucher / agendamento livre: pula a tela de descrição e vai direto
      // pro checkout — evita duas telas com a mesma capa ("Reservar" →
      // "Continuar para pagamento" viravam duas etapas idênticas).
      if (exp.horarioFuncionamento && String(exp.horarioFuncionamento).trim()) {
        return true;
      }

      // --- Log completo do objeto experiência pra diagnóstico ---
      // Se "descricao" não aparecer aqui ou vier vazia, o problema
      // é nos DADOS (banco/seeds), não no código do modal.
      console.log('[Elarah Description] exp objeto retornado pelo ElarahData:', {
        id: exp.id,
        nome: exp.nome,
        categoria: exp.categoria,
        preco: exp.preco,
        imagem: exp.imagem,
        descricao_present: exp.descricao != null,
        descricao_length: exp.descricao ? String(exp.descricao).length : 0,
        descricao_preview: exp.descricao ? String(exp.descricao).slice(0, 120) + '...' : '(vazio)',
      });

      // --- Checa se existe descrição cadastrada ---
      // Aceita tanto exp.descricao (PT) quanto exp.description (EN)
      // por compatibilidade futura.
      const descRaw = exp.descricao != null ? exp.descricao : exp.description;
      const desc = (descRaw == null ? '' : String(descRaw)).trim();
      if (!desc) {
        console.warn('[Elarah Description Flow] sem descrição (' + experienceId + '), indo direto para checkout');
        return true;
      }

      console.log('[Elarah Description Flow] descrição encontrada (' + desc.length + ' chars), abrindo modal v2');

      // --- Monta e mostra a modal ---
      return new Promise(function (resolve) {
        openDescriptionModal(exp, triggerBtn, resolve);
      });
    }

    function openDescriptionModal(exp, triggerBtn, resolve) {
      const horario = readActiveHorario(triggerBtn) || exp.horario || '';
      const precoLabel = exp.preco || (triggerBtn && triggerBtn.getAttribute('data-experience-preco')) || '';
      const imagem = exp.imagem && String(exp.imagem).trim() ? exp.imagem : '';
      const bairro = exp.bairro || '';
      const data = exp.data || '';
      const duracao = exp.duracao || '';
      const inclui = exp.inclui || '';
      const endereco = exp.endereco || '';

      // Altura inicial e mínima do hero (mobile-first).
      // Ajusta via CSS var no scroll pra efeito collapsible suave.
      const HERO_MAX_PX = 280; // altura inicial em px (desktop)
      const HERO_MIN_PX = 72;  // altura colapsada
      const SCROLL_RANGE = 240; // px de rolagem até colapsar totalmente

      // Root do modal
      const root = document.createElement('div');
      root.className = 'elarah-desc-modal';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Detalhes da experiência: ' + (exp.nome || ''));
      // Diagnóstico: marca a versão da modal no próprio DOM. Dá pra
      // inspecionar no DevTools → Elements e confirmar que é a V2.
      root.setAttribute('data-elarah-modal-version', '2');
      console.log('[Elarah Modal Render OK] openDescriptionModal v2 — hero collapsible, body scroll, footer fixo');
      root.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:10000',
        'display:flex', 'align-items:center', 'justify-content:center',
        'padding:0',
        'background:rgba(20,12,4,0.55)',
        'font-family:"DM Sans",-apple-system,BlinkMacSystemFont,sans-serif',
        'animation:elarahDescFadeIn 180ms ease',
      ].join(';');

      // Keyframes + mobile media queries (injeta só uma vez)
      if (!document.getElementById('elarah-desc-modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'elarah-desc-modal-keyframes';
        style.textContent =
          '@keyframes elarahDescFadeIn{from{opacity:0}to{opacity:1}}' +
          '@keyframes elarahDescSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
          // Scrollbar discreta no body do modal
          '.elarah-desc-modal .elarah-desc-scroll::-webkit-scrollbar{width:6px;}' +
          '.elarah-desc-modal .elarah-desc-scroll::-webkit-scrollbar-thumb{background:#e5d8c5;border-radius:3px;}' +
          '.elarah-desc-modal .elarah-desc-scroll::-webkit-scrollbar-track{background:transparent;}' +
          // Mobile: card full-screen, hero menor
          '@media (max-width:640px){' +
            '.elarah-desc-modal{padding:0 !important;}' +
            '.elarah-desc-modal .elarah-desc-card{border-radius:0 !important;max-height:100vh !important;max-height:100dvh !important;width:100% !important;}' +
            '.elarah-desc-modal .elarah-desc-body{padding:20px 20px 28px !important;}' +
            '.elarah-desc-modal .elarah-desc-title{font-size:1.5rem !important;}' +
            '.elarah-desc-modal .elarah-desc-footer{padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px)) !important;}' +
          '}';
        document.head.appendChild(style);
      }

      // Card — contêiner principal, flex column
      const card = document.createElement('div');
      card.className = 'elarah-desc-card';
      card.style.cssText = [
        'position:relative',
        'background:#fff',
        'border-radius:22px',
        'max-width:680px',
        'width:calc(100% - 24px)',
        'max-height:92vh',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'box-shadow:0 24px 60px rgba(0,0,0,0.28)',
        'animation:elarahDescSlideUp 220ms ease',
      ].join(';');

      // Botão fechar (X) — ABSOLUTO no card inteiro, sempre visível
      // independente de scroll/hero.
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Fechar');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = [
        'position:absolute',
        'top:14px', 'right:14px',
        'width:40px', 'height:40px',
        'border:none',
        'background:rgba(255,255,255,0.95)',
        'border-radius:50%',
        'font-size:26px', 'line-height:1', 'color:#1a1a1a',
        'cursor:pointer',
        'z-index:20',
        'box-shadow:0 3px 12px rgba(0,0,0,0.18)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'padding:0',
        'transition:transform .15s ease',
      ].join(';');
      closeBtn.addEventListener('mouseenter', function () {
        closeBtn.style.transform = 'scale(1.06)';
      });
      closeBtn.addEventListener('mouseleave', function () {
        closeBtn.style.transform = 'scale(1)';
      });

      // ===== HERO (collapsible) =====
      // Wrapper que muda de altura conforme scroll. Começa em HERO_MAX_PX
      // e colapsa até HERO_MIN_PX. position:sticky pra ficar "colando"
      // no topo do scroll container enquanto encolhe.
      const hero = document.createElement('div');
      hero.className = 'elarah-desc-hero';
      hero.style.cssText = [
        'position:sticky',
        'top:0',
        'z-index:5',
        'width:100%',
        'height:' + HERO_MAX_PX + 'px',
        'background:linear-gradient(135deg,#f6d5a8,#f0a05e)',
        'overflow:hidden',
        'flex-shrink:0',
        'transition:height 220ms cubic-bezier(.22,.61,.36,1)',
        'will-change:height',
      ].join(';');

      // Gradient overlay no bottom pro contraste do título (se hover)
      const heroOverlay = document.createElement('div');
      heroOverlay.style.cssText = [
        'position:absolute', 'inset:0',
        'background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,0.35) 100%)',
        'pointer-events:none',
        'transition:opacity 220ms ease',
        'opacity:1',
      ].join(';');

      // Image (se houver)
      let heroImg = null;
      if (imagem) {
        heroImg = document.createElement('img');
        heroImg.src = imagem;
        heroImg.alt = exp.nome || '';
        heroImg.style.cssText = [
          'width:100%', 'height:100%',
          'object-fit:cover',
          'display:block',
          'transition:transform 220ms cubic-bezier(.22,.61,.36,1), opacity 220ms ease',
          'will-change:transform,opacity',
        ].join(';');
        heroImg.onerror = function () {
          if (heroImg) heroImg.style.display = 'none';
          console.warn('[Elarah Description Flow] falha ao carregar imagem:', imagem);
        };
        hero.appendChild(heroImg);
      }
      hero.appendChild(heroOverlay);

      // Título flutuante no hero (aparece sobre a imagem, desaparece ao
      // colapsar porque o próprio hero encolhe).
      const heroTitle = document.createElement('div');
      heroTitle.style.cssText = [
        'position:absolute',
        'left:0', 'right:0', 'bottom:0',
        'padding:20px 24px 22px',
        'color:#fff',
        'text-shadow:0 2px 10px rgba(0,0,0,0.4)',
        'transition:opacity 200ms ease, transform 220ms ease',
        'pointer-events:none',
      ].join(';');
      if (exp.categoria) {
        const catTag = document.createElement('div');
        catTag.textContent = exp.categoria;
        catTag.style.cssText = 'font-size:.7rem;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:6px;opacity:.92;';
        heroTitle.appendChild(catTag);
      }
      const heroTitleH = document.createElement('div');
      heroTitleH.textContent = exp.nome || '';
      heroTitleH.style.cssText = "font-family:'DM Serif Display',Georgia,serif;font-size:1.6rem;font-weight:400;line-height:1.2;";
      heroTitle.appendChild(heroTitleH);
      hero.appendChild(heroTitle);

      // ===== SCROLL CONTAINER =====
      // Contém hero (sticky) + body. Todo o scroll do modal acontece aqui.
      const scrollContainer = document.createElement('div');
      scrollContainer.className = 'elarah-desc-scroll';
      scrollContainer.style.cssText = [
        'flex:1 1 auto',
        'overflow-y:auto',
        '-webkit-overflow-scrolling:touch',
        'position:relative',
      ].join(';');

      // ===== BODY TEXTUAL =====
      const body = document.createElement('div');
      body.className = 'elarah-desc-body';
      body.style.cssText = [
        'padding:28px 32px 32px',
        'background:#fff',
        'position:relative',
      ].join(';');

      // Título repetido no body pra quando o hero colapsa — mais
      // legível que o título over-image. A categoria acima faz eyebrow.
      if (exp.categoria) {
        const cat = document.createElement('div');
        cat.textContent = exp.categoria;
        cat.style.cssText = 'font-size:.7rem;color:#a4663b;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:8px;';
        body.appendChild(cat);
      }
      const title = document.createElement('h2');
      title.className = 'elarah-desc-title';
      title.textContent = exp.nome || '';
      title.style.cssText = "font-family:'DM Serif Display',Georgia,serif;font-size:1.8rem;color:#1a1a1a;margin:0 0 16px;font-weight:400;line-height:1.22;";
      body.appendChild(title);

      // Avaliações reais (prova social): mini-nota AQUI no topo (crédito
      // na hora) + comentários completos LÁ EMBAIXO, antes do botão de
      // reservar. Uma busca só preenche os dois. Lê só aprovadas; sem
      // avaliação, não mostra nada (zero número fake).
      var ratingChipEl = document.createElement('div');
      body.appendChild(ratingChipEl);
      var reviewsBlockEl = document.createElement('div'); // anexado no fim do body
      (function () {
        if (!exp || !exp.id || !window.supabaseClient) return;
        var escR = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; };
        window.supabaseClient.from('reviews').select('nome, nota, comentario, created_at')
          .eq('experiencia_id', exp.id).eq('aprovado', true)
          .order('created_at', { ascending: false }).limit(40)
          .then(function (r) {
            var rows = (r && r.data) || [];
            if (!rows.length) return;
            var soma = 0; rows.forEach(function (x) { soma += Number(x.nota) || 0; });
            var media = soma / rows.length, full = Math.round(media), head = '';
            for (var i = 1; i <= 5; i++) head += (i <= full ? '★' : '☆');
            var n = rows.length;
            ratingChipEl.style.cssText = 'display:flex;align-items:center;gap:7px;margin:-6px 0 18px;';
            ratingChipEl.innerHTML = '<span style="color:#f0a05e;font-size:1rem;letter-spacing:1.5px;">' + head + '</span>' +
              '<strong style="color:#2c211a;font-size:.95rem;">' + media.toFixed(1).replace('.', ',') + '</strong>' +
              '<span style="color:#8a8a8a;font-size:.82rem;">· ' + n + ' avaliação' + (n > 1 ? 'ões' : '') + '</span>';
            var withC = rows.filter(function (x) { return x.comentario && String(x.comentario).trim(); });
            if (!withC.length) return;
            reviewsBlockEl.style.cssText = 'margin-top:10px;';
            reviewsBlockEl.innerHTML = '<div style="font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin:6px 0 12px;">O que diz quem já viveu</div>' +
              withC.slice(0, 6).map(function (x) {
                var nm = x.nome ? escR(x.nome) : 'Cliente'; var st = ''; var nt = Number(x.nota) || 0;
                for (var j = 1; j <= 5; j++) st += (j <= nt ? '★' : '☆');
                return '<div style="padding:11px 0;border-top:1px dashed #f0e8de;"><div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:3px;"><span style="font-weight:600;color:#2c211a;font-size:.9rem;">' + nm + '</span><span style="color:#f0a05e;font-size:.82rem;letter-spacing:1px;">' + st + '</span></div><div style="color:#5a5a5a;font-size:.9rem;line-height:1.5;">' + escR(x.comentario) + '</div></div>';
              }).join('');
          }).catch(function () {});
      })();

      // Meta chips: data · horário · duração · bairro
      const metaBits = [];
      if (data) metaBits.push({ icon: '📅', text: data });
      if (horario) metaBits.push({ icon: '⏱', text: horario });
      if (duracao) metaBits.push({ icon: '⏳', text: duracao });
      if (bairro) metaBits.push({ icon: '📍', text: bairro });
      if (metaBits.length) {
        const meta = document.createElement('div');
        meta.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;';
        metaBits.forEach(function (m) {
          const chip = document.createElement('span');
          chip.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:6px',
            'padding:7px 13px',
            'background:#faf6f0',
            'border:1px solid #f0e8de',
            'border-radius:999px',
            'font-size:.82rem',
            'color:#5a4a3a',
            'white-space:nowrap',
          ].join(';');
          chip.textContent = m.icon + ' ' + m.text;
          meta.appendChild(chip);
        });
        body.appendChild(meta);
      }

      // Divisor sutil
      const divider = document.createElement('div');
      divider.style.cssText = 'height:1px;background:#f0e8de;margin:0 0 22px;';
      body.appendChild(divider);

      // ===== Bloco de ESCOLHA (data/horário + variação/kit) =====
      // Vem ANTES de "Sobre a experiência". Antes esses seletores eram
      // anexados lá no fim do corpo (depois da descrição, includes e
      // endereço), então a data e a escolha de kit ficavam "lá embaixo",
      // difíceis de achar e ler. A seção de schedule e a de variação são
      // preenchidas mais abaixo, mas ancoram AQUI no topo.
      const pickSection = document.createElement('div');
      body.appendChild(pickSection);

      // Seção "Sobre a experiência"
      const descHeader = document.createElement('div');
      descHeader.textContent = 'Sobre a experiência';
      descHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:12px;';
      body.appendChild(descHeader);

      // Descrição (multi-parágrafo, XSS-safe)
      // Agora com mais line-height, font-size e cor mais confortável.
      const descWrap = document.createElement('div');
      descWrap.className = 'elarah-desc-prose';
      descWrap.innerHTML = descriptionTextToHtml(exp.descricao || exp.description || '');
      // Override: seta line-height e font-size mais confortáveis
      // diretamente nos <p>s que descriptionTextToHtml gerou.
      descWrap.querySelectorAll('p').forEach(function (p) {
        p.style.margin = '0 0 16px';
        p.style.lineHeight = '1.72';
        p.style.color = '#3a3a3a';
        p.style.fontSize = '1rem';
      });
      body.appendChild(descWrap);

      // "O que inclui" (se o campo existir)
      if (inclui && String(inclui).trim()) {
        const incluiWrap = document.createElement('div');
        incluiWrap.style.cssText = 'margin-top:28px;padding:18px 20px;background:#fff8ee;border-radius:14px;border:1px solid #f0cfa0;';
        const incluiHeader = document.createElement('div');
        incluiHeader.textContent = 'O que está incluso';
        incluiHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:8px;';
        incluiWrap.appendChild(incluiHeader);
        const incluiText = document.createElement('div');
        incluiText.textContent = String(inclui).trim();
        incluiText.style.cssText = 'font-size:.92rem;color:#3a2410;line-height:1.55;';
        incluiWrap.appendChild(incluiText);
        body.appendChild(incluiWrap);
      }

      // "Onde acontece" (se endereço estiver disponível)
      if (endereco && String(endereco).trim() && bairro) {
        const enderecoWrap = document.createElement('div');
        enderecoWrap.style.cssText = 'margin-top:20px;padding:16px 20px;background:#faf6f0;border-radius:12px;border:1px solid #f0e8de;';
        const enderecoHeader = document.createElement('div');
        enderecoHeader.textContent = 'Onde acontece';
        enderecoHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#666;margin-bottom:6px;';
        enderecoWrap.appendChild(enderecoHeader);
        const enderecoText = document.createElement('div');
        enderecoText.textContent = String(endereco).trim();
        enderecoText.style.cssText = 'font-size:.88rem;color:#444;line-height:1.5;';
        enderecoWrap.appendChild(enderecoText);
        body.appendChild(enderecoWrap);
      }

      // ===== BLOCO DE SCHEDULE (data + horário) =====
      // Carrega slots futuros e renderiza chips de data → horário.
      // Usuário escolhe data primeiro, depois horário daquela data.
      // Selecionado é guardado em scope local — footer button lê esse
      // estado antes de continuar pro checkout.
      var modalSchedSel = { data: null, horario: null, slotId: null, dataLabel: null };

      // ===== Variação (kit/opção) escolhida neste modal =====
      // Deriva as opções de variantItems (rico) ou variantOptions (legado).
      // Quando existir, o seletor abaixo é renderizado e a escolha vira
      // obrigatória (onContinue bloqueia sem seleção). A opção escolhida é
      // propagada pro checkout via window.__elarahDescVariant, que o modal
      // de reserva lê pra pré-selecionar a Pessoa 1.
      var _descVariantItems = (Array.isArray(exp.variantItems) && exp.variantItems.length)
        ? exp.variantItems
        : (Array.isArray(exp.variantOptions) && exp.variantOptions.length
            ? exp.variantOptions.map(function (n) { return { nome: String(n), preco: '', imagem: '' }; })
            : []);
      var _descVariantLabel = exp.variantLabel || 'Escolha a sua opção';
      var modalVariantSel = { label: _descVariantItems.length ? _descVariantLabel : null, selected: null, item: null };
      // Limpa qualquer escolha de uma abertura anterior.
      window.__elarahDescVariant = null;

      var schedSection = document.createElement('div');
      schedSection.style.cssText = 'margin-top:4px;margin-bottom:28px;';
      pickSection.appendChild(schedSection);

      (async function loadSchedule() {
        var allSlots = [];
        try {
          if (window.ElarahData && ElarahData.getSlotsForExperience) {
            allSlots = await ElarahData.getSlotsForExperience(exp.id) || [];
          }
        } catch (e) { /* tabela ausente */ }

        var now = new Date();
        // Janela de antecedência (cutoff): não oferece data que já está
        // dentro do prazo mínimo de compra (default 24h). Antes, o chip
        // aparecia, o cliente clicava pra comprar e só então o backend
        // recusava com "falta menos de 24h" — opção que não deveria existir.
        // Mesma regra de isPubliclyVisible/booking_guard, agora por slot.
        var cutoffH = Number.isFinite(Number(exp.cutoffHours)) ? Number(exp.cutoffHours) : 24;
        var cutoffMs = now.getTime() + cutoffH * 60 * 60 * 1000;
        var futureSlots = allSlots
          .filter(function (s) { return s.isActive !== false; })
          .filter(function (s) { return s.eventAt && new Date(s.eventAt).getTime() >= cutoffMs; })
          .filter(function (s) {
            if (s.vagasTotal == null) return true;
            var rest = s.vagasRestantes != null ? s.vagasRestantes : s.vagasTotal;
            return rest > 0;
          })
          .sort(function (a, b) { return new Date(a.eventAt) - new Date(b.eventAt); });

        if (!futureSlots.length) {
          // Fallback: experiência sem slot configurado → mantém UX antiga
          // (botão Continuar dispara checkout com horario default da experiência)
          schedSection.style.display = 'none';
          return;
        }

        // Agrupa por data (YYYY-MM-DD)
        var byDate = {};
        var dateOrder = [];
        futureSlots.forEach(function (s) {
          var d = new Date(s.eventAt);
          var key = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
          if (!byDate[key]) {
            byDate[key] = {
              key: key,
              dt: d,
              wd: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
              dm: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
              slots: [],
            };
            dateOrder.push(key);
          }
          byDate[key].slots.push(s);
        });

        // Estilos comuns (inline pra não depender de CSS externo)
        var chipCss = function (active) {
          return [
            'padding:10px 14px',
            'border:1.5px solid ' + (active ? '#f0a05e' : '#ddd'),
            'border-radius:999px',
            'background:' + (active ? '#f0a05e' : '#fff'),
            'color:' + (active ? '#fff' : '#555'),
            'font-size:.82rem',
            'font-weight:600',
            'cursor:pointer',
            'font-family:inherit',
            'line-height:1.1',
            'min-width:88px',
            'text-align:center',
            'transition:all .15s',
          ].join(';');
        };
        var horarioChipCss = function (active, soldOut) {
          return [
            'padding:8px 14px',
            'border:1.5px solid ' + (active ? '#f0a05e' : '#ddd'),
            'border-radius:10px',
            'background:' + (active ? '#f0a05e' : '#fff'),
            'color:' + (active ? '#fff' : '#555'),
            'font-size:.85rem',
            'font-weight:600',
            'cursor:' + (soldOut ? 'not-allowed' : 'pointer'),
            'opacity:' + (soldOut ? '.45' : '1'),
            'font-family:inherit',
            'transition:all .15s',
          ].join(';');
        };

        // ===== CHIPS DE DATA =====
        var dataLabel = document.createElement('div');
        dataLabel.textContent = 'Escolha uma data';
        dataLabel.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:10px;';
        schedSection.appendChild(dataLabel);

        var datasWrap = document.createElement('div');
        datasWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;';

        // ===== CHIPS DE HORÁRIO (re-renderizado on date change) =====
        var horarioLabel = document.createElement('div');
        horarioLabel.textContent = 'Escolha um horário';
        horarioLabel.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:10px;';
        var horariosWrap = document.createElement('div');
        horariosWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

        function renderHorarios(dateKey) {
          horariosWrap.innerHTML = '';
          var g = byDate[dateKey];
          if (!g) return;
          var firstActive = true;
          g.slots.forEach(function (s, i) {
            var rest = s.vagasTotal == null ? null : (s.vagasRestantes != null ? s.vagasRestantes : s.vagasTotal);
            var soldOut = rest !== null && rest <= 0;
            var active = !soldOut && firstActive;
            if (active) firstActive = false;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = horarioChipCss(active, soldOut);
            btn.textContent = s.horario + (soldOut ? ' (esgotado)' : '');
            btn.disabled = soldOut;
            if (active) {
              modalSchedSel.horario = s.horario;
              modalSchedSel.slotId = s.id;
              modalSchedSel.data = s.data || g.dm;
              modalSchedSel.dataLabel = g.wd + ', ' + g.dm;
            }
            btn.addEventListener('click', function () {
              if (soldOut) return;
              Array.from(horariosWrap.children).forEach(function (c) {
                c.style.cssText = horarioChipCss(false, c.disabled);
              });
              btn.style.cssText = horarioChipCss(true, false);
              modalSchedSel.horario = s.horario;
              modalSchedSel.slotId = s.id;
              modalSchedSel.data = s.data || g.dm;
              modalSchedSel.dataLabel = g.wd + ', ' + g.dm;
            });
            horariosWrap.appendChild(btn);
          });
        }

        // Renderiza chips de data
        dateOrder.forEach(function (k, i) {
          var g = byDate[k];
          var active = i === 0;
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.style.cssText = chipCss(active);
          btn.innerHTML = '<strong>' + g.wd + '</strong><br><small style="font-size:.68rem;opacity:.75;">' + g.dm + '</small>';
          btn.addEventListener('click', function () {
            Array.from(datasWrap.children).forEach(function (c) {
              c.style.cssText = chipCss(false);
            });
            btn.style.cssText = chipCss(true);
            renderHorarios(k);
          });
          datasWrap.appendChild(btn);
        });
        schedSection.appendChild(datasWrap);
        schedSection.appendChild(horarioLabel);
        schedSection.appendChild(horariosWrap);

        // Estado inicial: primeira data → primeiro horário ativo
        renderHorarios(dateOrder[0]);
      })();

      // ===== SELETOR DE VARIAÇÃO (kit/opção) =====
      // Renderizado quando a experiência tem opções. Escolha obrigatória —
      // onContinue não avança sem seleção. Ao escolher, troca a foto do
      // hero e o preço do rodapé, e guarda a escolha em
      // window.__elarahDescVariant pro checkout.
      if (_descVariantItems.length) {
        var variantSection = document.createElement('div');
        variantSection.style.cssText = 'margin-top:4px;margin-bottom:28px;';
        var variantHeader = document.createElement('div');
        variantHeader.textContent = _descVariantLabel;
        variantHeader.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#a4663b;margin-bottom:10px;';
        variantSection.appendChild(variantHeader);
        var variantBtnsWrap = document.createElement('div');
        variantBtnsWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
        var descVariantMsg = document.createElement('div');
        descVariantMsg.textContent = 'Escolha uma opção pra continuar.';
        descVariantMsg.style.cssText = 'font-size:.74rem;color:#c0392b;margin-top:8px;min-height:1em;display:none;';
        function fmtPrecoDesc(p) {
          return (window.ElarahData && ElarahData.formatPrecoBR) ? ElarahData.formatPrecoBR(p) : p;
        }
        _descVariantItems.forEach(function (it) {
          var b = document.createElement('button');
          b.type = 'button';
          var priceTxt = it.preco ? ' · ' + it.preco : '';
          b.textContent = it.nome + priceTxt;
          b.style.cssText = 'padding:9px 16px;border:1.5px solid #ddd;background:#fff;color:#444;border-radius:999px;font-size:.86rem;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;';
          b.addEventListener('click', function () {
            modalVariantSel.selected = it.nome;
            modalVariantSel.item = it;
            modalVariantSel.label = _descVariantLabel;
            window.__elarahDescVariant = { expId: exp.id, label: _descVariantLabel, selected: it.nome };
            Array.from(variantBtnsWrap.children).forEach(function (other) {
              var on = other === b;
              other.style.background = on ? '#fff8ef' : '#fff';
              other.style.borderColor = on ? '#f0a05e' : '#ddd';
              other.style.color = on ? '#1a1a1a' : '#444';
            });
            descVariantMsg.style.display = 'none';
            // Foto e preço acompanham a opção escolhida (quando definidos).
            if (it.imagem && heroImg) heroImg.src = it.imagem;
            if (root.__elarahPriceEl && it.preco) root.__elarahPriceEl.textContent = fmtPrecoDesc(it.preco);
          });
          variantBtnsWrap.appendChild(b);
        });
        variantSection.appendChild(variantBtnsWrap);
        variantSection.appendChild(descVariantMsg);
        // Escolha do kit/variação vai ANTES da data (pick "o quê" → "quando")
        // e, junto com o schedule, ANTES de "Sobre a experiência".
        pickSection.insertBefore(variantSection, pickSection.firstChild);
        // Refs pro onContinue avisar/rolar até aqui se faltar escolha.
        root.__elarahVariantMsg = descVariantMsg;
        root.__elarahVariantSection = variantSection;
      }

      // Comentários das avaliações — logo antes do botão, como empurrão
      // final na hora de decidir. (A mini-nota já apareceu lá no topo.)
      body.appendChild(reviewsBlockEl);

      // CTA "fechar em grupo" — mesma captura de demanda (aniversário/
      // empresa/turma privada) da página de detalhe (experiencia.html).
      // Este pop-up é a porta de entrada da maioria das experiências
      // (home/categorias), então sem isto o box não aparecia em quase
      // nenhuma. Fica no fim do corpo, logo acima do footer de pagamento.
      (function appendGroupCta() {
        var _waGroupMsg = 'Olá! Quero fechar a experiência "' + (exp.nome || '') +
          '" para um grupo / turma privada. Pode me ajudar com datas e valores?';
        var groupCta = document.createElement('a');
        groupCta.href = 'https://wa.me/5511914455930?text=' + encodeURIComponent(_waGroupMsg);
        groupCta.target = '_blank';
        groupCta.rel = 'noopener';
        groupCta.setAttribute('data-analytics', 'group_whatsapp_click');
        groupCta.setAttribute('data-analytics-category', 'booking');
        groupCta.setAttribute('data-analytics-label', exp.nome || '');
        groupCta.style.cssText = 'display:flex;align-items:center;gap:11px;margin-top:24px;padding:12px 14px;border:1px solid #d8efe0;background:#f3fbf6;border-radius:12px;text-decoration:none;color:#2c5a43;font-size:.8rem;line-height:1.35;';
        groupCta.innerHTML =
          '<svg viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;flex-shrink:0;color:#25D366;"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4 0-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>' +
          '<span><strong style="color:#147a40;">Quer fechar em grupo?</strong> Aniversário, empresa ou turma privada — chama a gente no WhatsApp.</span>';
        body.appendChild(groupCta);
      })();

      // Spacer pra o conteúdo poder rolar além do footer
      const spacer = document.createElement('div');
      spacer.style.cssText = 'height:20px;';
      body.appendChild(spacer);

      scrollContainer.appendChild(hero);
      scrollContainer.appendChild(body);

      // Expõe a seleção pro botão "Continuar" ler na hora do click
      root.__elarahSched = modalSchedSel;

      // ===== FOOTER STICKY =====
      // FORA do scrollContainer, sempre visível.
      const footer = document.createElement('div');
      footer.className = 'elarah-desc-footer';
      footer.style.cssText = [
        'padding:16px 24px',
        'border-top:1px solid #f0e8de',
        'background:#fff',
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'gap:14px',
        'flex-wrap:nowrap',
        'flex-shrink:0',
        'z-index:10',
        'box-shadow:0 -4px 14px rgba(0,0,0,0.04)',
      ].join(';');

      if (precoLabel) {
        const priceTag = document.createElement('div');
        priceTag.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;';
        const priceLabelEl = document.createElement('span');
        priceLabelEl.textContent = 'Valor';
        priceLabelEl.style.cssText = 'font-size:.68rem;color:#999;text-transform:uppercase;letter-spacing:.5px;font-weight:600;';
        const priceValEl = document.createElement('strong');
        priceValEl.textContent = (window.ElarahData && ElarahData.formatPrecoBR)
          ? ElarahData.formatPrecoBR(precoLabel)
          : precoLabel;
        priceValEl.style.cssText = 'font-size:1.15rem;color:#1a1a1a;font-weight:700;';
        priceTag.appendChild(priceLabelEl);
        priceTag.appendChild(priceValEl);
        footer.appendChild(priceTag);
        // Ref pro seletor de variação atualizar o preço ao escolher opção.
        root.__elarahPriceEl = priceValEl;
      }

      const continueBtn = document.createElement('button');
      continueBtn.type = 'button';
      continueBtn.textContent = 'Continuar para pagamento';
      continueBtn.style.cssText = [
        'flex:1 1 auto',
        'min-width:0',
        'padding:15px 22px',
        'border:none',
        'border-radius:999px',
        'background:#f0a05e',
        'color:#fff',
        'font-size:.95rem',
        'font-weight:700',
        'letter-spacing:.3px',
        'cursor:pointer',
        'transition:background .18s ease, transform .12s ease, box-shadow .18s ease',
        'box-shadow:0 4px 14px rgba(240,160,94,0.35)',
      ].join(';');
      continueBtn.addEventListener('mouseenter', function () {
        continueBtn.style.background = '#e08c45';
        continueBtn.style.boxShadow = '0 6px 18px rgba(240,160,94,0.45)';
      });
      continueBtn.addEventListener('mouseleave', function () {
        continueBtn.style.background = '#f0a05e';
        continueBtn.style.boxShadow = '0 4px 14px rgba(240,160,94,0.35)';
      });
      continueBtn.addEventListener('mousedown', function () {
        continueBtn.style.transform = 'scale(0.98)';
      });
      continueBtn.addEventListener('mouseup', function () {
        continueBtn.style.transform = 'scale(1)';
      });
      footer.appendChild(continueBtn);

      // ===== MONTAGEM FINAL =====
      card.appendChild(scrollContainer);
      card.appendChild(footer);
      card.appendChild(closeBtn); // absolute sobre o card inteiro
      root.appendChild(card);
      document.body.appendChild(root);
      document.body.style.overflow = 'hidden';
      root.classList.add('open');
      // Description modal está visível agora — esconde o spinner
      // pra não ficar com camada de blur "dupla" empilhada.
      try { if (window.ElarahReserveSpinner) ElarahReserveSpinner.hide(); } catch (e) {}

      // Funil — etapa intermediária de descrição exibida.
      trackBookingFunnel('description_view', {
        experienceId: exp.id || null,
        experienceNome: exp.nome || null,
      });

      // ===== SCROLL HANDLER — collapsible hero =====
      // Ao rolar, diminui a altura do hero e aplica fade+scale na
      // imagem. Throttle via requestAnimationFrame pra suavidade.
      let rafPending = false;
      function onScroll() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          const st = scrollContainer.scrollTop;
          // progress vai de 0 (hero cheio) a 1 (hero colapsado)
          const progress = Math.max(0, Math.min(1, st / SCROLL_RANGE));
          const newHeight = HERO_MAX_PX - (HERO_MAX_PX - HERO_MIN_PX) * progress;
          hero.style.height = newHeight + 'px';
          if (heroImg) {
            // Pequeno parallax + fade
            const scale = 1 + progress * 0.08;
            const translateY = progress * 18;
            heroImg.style.transform = 'scale(' + scale + ') translateY(-' + translateY + 'px)';
            heroImg.style.opacity = String(1 - progress * 0.45);
          }
          // Esconde o título flutuante conforme colapsa
          heroTitle.style.opacity = String(Math.max(0, 1 - progress * 1.4));
          heroTitle.style.transform = 'translateY(' + (progress * 20) + 'px)';
          // Suaviza o overlay quando o hero fica pequeno
          heroOverlay.style.opacity = String(Math.max(0, 1 - progress * 0.8));
        });
      }
      scrollContainer.addEventListener('scroll', onScroll, { passive: true });

      // ===== HANDLERS =====
      function dismiss(confirmed) {
        document.removeEventListener('keydown', onKey, true);
        root.removeEventListener('click', onBackdrop, true);
        scrollContainer.removeEventListener('scroll', onScroll);
        closeBtn.removeEventListener('click', onClose);
        continueBtn.removeEventListener('click', onContinue);
        root.style.animation = 'elarahDescFadeIn 140ms ease reverse';
        setTimeout(function () {
          if (root.parentNode) root.parentNode.removeChild(root);
        }, 140);
        const wasResolve = descriptionGateState.resolve;
        descriptionGateState = {
          open: false,
          currentExpId: null,
          resolve: null,
          cleanup: null,
        };
        if (!document.querySelector('.elarah-desc-modal.open')) {
          document.body.style.overflow = '';
        }
        if (typeof wasResolve === 'function') {
          // Se confirmou E tem seleção de schedule, passa o objeto
          // pra o caller setar nos data-attrs do botão (UI nova).
          // Senão, passa true (fluxo legado).
          var payload;
          if (confirmed === true) {
            if (modalSchedSel && modalSchedSel.horario) {
              payload = {
                confirmed: true,
                horario: modalSchedSel.horario,
                data: modalSchedSel.data,
                dataLabel: modalSchedSel.dataLabel,
                slotId: modalSchedSel.slotId,
              };
            } else {
              payload = true;
            }
          } else {
            payload = false;
          }
          try { wasResolve(payload); } catch (e) {}
        }
      }

      function onContinue(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        // Guard contra double-click no botão final — desabilita e muda
        // o texto pra avisar o usuário que está processando.
        if (continueBtn.disabled) return;
        // Variação obrigatória: sem opção escolhida, não avança — mostra
        // o aviso e rola até o seletor.
        if (_descVariantItems.length && !modalVariantSel.selected) {
          if (root.__elarahVariantMsg) root.__elarahVariantMsg.style.display = 'block';
          if (root.__elarahVariantSection && root.__elarahVariantSection.scrollIntoView) {
            try { root.__elarahVariantSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_e) {}
          }
          return;
        }
        continueBtn.disabled = true;
        continueBtn.textContent = 'Abrindo pagamento…';
        continueBtn.style.opacity = '0.85';
        continueBtn.style.cursor = 'wait';
        console.log('[Elarah Description Flow] usuário clicou Continuar para pagamento (' + (exp.id || '?') + ')');
        trackBookingFunnel('description_continue', {
          experienceId: exp.id || null,
          experienceNome: exp.nome || null,
        });
        dismiss(true);
      }
      function onClose(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        console.log('[Elarah Description Flow] usuário fechou a modal sem continuar');
        trackBookingFunnel('description_dismiss', {
          experienceId: exp.id || null,
          experienceNome: exp.nome || null,
        });
        dismiss(false);
      }
      function onBackdrop(e) {
        if (e.target === root) { onClose(e); }
      }
      function onKey(e) {
        if (e.key === 'Escape') { onClose(e); }
      }

      closeBtn.addEventListener('click', onClose);
      continueBtn.addEventListener('click', onContinue);
      root.addEventListener('click', onBackdrop, true);
      document.addEventListener('keydown', onKey, true);

      descriptionGateState = {
        open: true,
        currentExpId: exp.id || null,
        resolve: resolve,
        cleanup: function () {
          document.removeEventListener('keydown', onKey, true);
          root.removeEventListener('click', onBackdrop, true);
          scrollContainer.removeEventListener('scroll', onScroll);
          if (root.parentNode) root.parentNode.removeChild(root);
        },
      };

      // Foco inicial no botão Continuar (acessibilidade + mobile).
      // preventScroll evita que o foco auto-role a página por baixo.
      try { continueBtn.focus({ preventScroll: true }); } catch (e) {}
    }

    // ============================================================
    // SPINNER INSTANTÂNEO NO CLIQUE DE "RESERVAR"
    // ------------------------------------------------------------
    // Sprint 1 / PR A do plano de conversão. Sem feedback visual no
    // clique, a pessoa esperava 2-4s em silêncio enquanto o backend
    // carregava dados e achava que o botão tinha quebrado.
    //
    // Overlay leve com spinner + texto. Aparece SÍNCRONO no clique
    // (antes de qualquer await), some quando:
    //   - description modal aparece no DOM (caso comum)
    //   - startCheckout resolve (login modal, reservation modal, erro)
    //   - timeout de segurança de 6s (defensivo, nunca deve ocorrer)
    // ============================================================
    function injectReserveSpinnerStyles() {
      if (document.getElementById('elarah-reserve-spinner-styles')) return;
      const style = document.createElement('style');
      style.id = 'elarah-reserve-spinner-styles';
      style.textContent =
        '.elarah-reserve-spinner{' +
          'position:fixed;inset:0;z-index:10001;' +
          'display:flex;align-items:center;justify-content:center;' +
          'background:rgba(250,246,240,0.78);backdrop-filter:blur(3px);' +
          '-webkit-backdrop-filter:blur(3px);' +
          'opacity:0;pointer-events:none;transition:opacity 160ms ease;' +
          'font-family:"DM Sans",-apple-system,BlinkMacSystemFont,sans-serif;' +
        '}' +
        '.elarah-reserve-spinner.is-active{opacity:1;pointer-events:auto;}' +
        '.elarah-reserve-spinner__box{' +
          'display:flex;flex-direction:column;align-items:center;gap:14px;' +
          'background:#fff;padding:24px 32px;border-radius:18px;' +
          'box-shadow:0 14px 40px rgba(0,0,0,.14);' +
          'animation:elarahReserveSpinFade 220ms ease;' +
        '}' +
        '.elarah-reserve-spinner__dot{' +
          'width:34px;height:34px;' +
          'border:3px solid rgba(240,160,94,.22);' +
          'border-top-color:#f0a05e;border-radius:50%;' +
          'animation:elarahReserveSpin 0.8s linear infinite;' +
        '}' +
        '.elarah-reserve-spinner__label{' +
          'font-size:14px;color:#1a1a1a;font-weight:500;letter-spacing:.1px;' +
        '}' +
        '@keyframes elarahReserveSpin{to{transform:rotate(360deg);}}' +
        '@keyframes elarahReserveSpinFade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}';
      document.head.appendChild(style);
    }

    let reserveSpinnerSafetyTimer = null;
    let reserveSpinnerShownAt = 0;
    // Mínimo de exibição do spinner em ms. Ajustado pra 1,5s — balanço
    // entre dar tempo do cliente LER "Preparando sua reserva…" sem
    // tornar a espera incômoda (2s pareceu lento na primeira iteração).
    const RESERVE_SPINNER_MIN_MS = 1500;
    function showReserveSpinner() {
      try {
        injectReserveSpinnerStyles();
        let overlay = document.getElementById('elarah-reserve-spinner');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'elarah-reserve-spinner';
          overlay.className = 'elarah-reserve-spinner';
          overlay.setAttribute('role', 'status');
          overlay.setAttribute('aria-live', 'polite');
          overlay.innerHTML =
            '<div class="elarah-reserve-spinner__box">' +
              '<div class="elarah-reserve-spinner__dot" aria-hidden="true"></div>' +
              '<div class="elarah-reserve-spinner__label">Preparando sua reserva…</div>' +
            '</div>';
          document.body.appendChild(overlay);
        }
        // Force reflow pra que a transição de opacity rode mesmo
        // recém-criado o elemento.
        void overlay.offsetWidth;
        overlay.classList.add('is-active');
        reserveSpinnerShownAt = Date.now();
        if (reserveSpinnerSafetyTimer) clearTimeout(reserveSpinnerSafetyTimer);
        reserveSpinnerSafetyTimer = setTimeout(hideReserveSpinner, 8000);
      } catch (e) { /* não pode quebrar o checkout */ }
    }
    function hideReserveSpinner() {
      try {
        const overlay = document.getElementById('elarah-reserve-spinner');
        if (overlay) overlay.classList.remove('is-active');
        if (reserveSpinnerSafetyTimer) {
          clearTimeout(reserveSpinnerSafetyTimer);
          reserveSpinnerSafetyTimer = null;
        }
      } catch (e) {}
    }
    // Quanto tempo o spinner já está visível, em ms. 0 se nunca foi
    // mostrado. Usado por startCheckout pra segurar a abertura do modal
    // até completar o mínimo de RESERVE_SPINNER_MIN_MS.
    function getReserveSpinnerElapsedMs() {
      if (!reserveSpinnerShownAt) return 0;
      return Date.now() - reserveSpinnerShownAt;
    }
    // Promise que resolve quando o spinner já ficou visível pelo tempo
    // mínimo. Se já passou, resolve imediato.
    function waitForReserveSpinnerMin() {
      const elapsed = getReserveSpinnerElapsedMs();
      const remaining = RESERVE_SPINNER_MIN_MS - elapsed;
      if (remaining <= 0 || elapsed === 0) return Promise.resolve();
      return new Promise(function (r) { setTimeout(r, remaining); });
    }
    // Exposto pra ser chamado pelos opener de modais (description,
    // login, reservation) sem precisar de import.
    window.ElarahReserveSpinner = { show: showReserveSpinner, hide: hideReserveSpinner };

    // === FUNIL DE RESERVA — INSTRUMENTAÇÃO ===
    // Centraliza os eventos do funil pra que o admin compare o fluxo
    // "gated" (passou pela modal de descrição — origem card da home/
    // categoria) vs "direct" (foi direto pro checkout — origem página
    // de detalhe). device/browser/viewport já são anexados pelo
    // ElarahAnalytics.track, então mobile vs desktop sai de graça.
    function trackBookingFunnel(eventName, meta) {
      try {
        if (!window.ElarahAnalytics || !ElarahAnalytics.track) return;
        meta = meta || {};
        ElarahAnalytics.track(eventName, {
          category: 'booking',
          targetId: meta.experienceId != null ? meta.experienceId : null,
          targetLabel: meta.experienceNome != null ? meta.experienceNome : null,
          metadata: meta.metadata || {},
        });
      } catch (e) {}
    }

    async function startCheckout(btn, opts) {
      opts = opts || {};
      const experienceId = btn.getAttribute('data-experience-id');
      const experienceNome = btn.getAttribute('data-experience-nome') || '';

      if (!experienceId) {
        hideReserveSpinner();
        alert('Não conseguimos identificar essa experiência. Recarregue a página e tente novamente.');
        return;
      }

      // === GATE DE DESCRIÇÃO LIGADO POR PADRÃO ===
      // Mostra a modal de "DESCRIÇÃO COMPLETA" entre o clique em
      // "Reservar"/"Quero participar" e o checkout, pra o cliente ler
      // sobre a experiência antes de pagar.
      //
      // Kill-switch (desliga o gate) caso precise reverter rápido:
      //   - URL: ?desc=0
      //   - DevTools: localStorage.setItem('elarahDescGate','0')
      //   - data-attribute no botão: data-force-description="false"
      function descriptionGateEnabled() {
        try {
          if ((location.search || '').indexOf('desc=0') !== -1) return false;
          if (localStorage.getItem('elarahDescGate') === '0') return false;
          if (btn.dataset && btn.dataset.forceDescription === 'false') return false;
        } catch (e) {}
        return true;
      }
      if (!opts.skipDescription && descriptionGateEnabled()) {
        const proceed = await runDescriptionGate(experienceId, experienceNome, btn);
        if (!proceed) {
          return;
        }
        // Se modal retornou objeto com schedule, propaga pro btn pra
        // que readActiveSchedule pegue data + horario + slot_id do
        // checkout. true (sem objeto) = fluxo legado sem seleção.
        if (proceed && typeof proceed === 'object') {
          if (proceed.horario) btn.dataset.horario = proceed.horario;
          if (proceed.data) btn.dataset.data = proceed.data;
          if (proceed.dataLabel) btn.dataset.dataLabel = proceed.dataLabel;
          if (proceed.slotId) btn.dataset.slotId = proceed.slotId;
        }
      }

      // === [SPRINT 1 / PR F] CHECKOUT CONVIDADO (FEATURE FLAG) ===
      // Quando a flag está ON, pula o login modal. O modal de reserva
      // entra em modo guest (mostra campo email) e cria conta auto no
      // submit. Maior impacto isolado do Sprint 1 (+40% a +80% estimado).
      // Atrás de flag pra rollout controlado — começa OFF.
      //
      // Ativar:
      //   - URL: ?guest=1
      //   - DevTools: localStorage.setItem('elarahGuestCheckout','1')
      // === CHECKOUT CONVIDADO — LIGADO POR PADRÃO (PR G) ===
      // Sprint 1 / Item #1 do plano de conversão — maior impacto isolado.
      // 'Confirm email' do Supabase está OFF, então o signUp client-side
      // retorna session imediatamente e a pessoa segue pro pagamento sem
      // precisar criar senha nem confirmar e-mail.
      //
      // Kill switch (caso precise desligar emergencialmente):
      //   - URL: ?guest=0
      //   - DevTools: localStorage.setItem('elarahGuestCheckout','0')
      // Para forçar ligado em testes (override do kill switch):
      //   - URL: ?guest=1
      //   - DevTools: localStorage.setItem('elarahGuestCheckout','1')
      function guestCheckoutEnabled() {
        try {
          // Kill switch tem precedência.
          if ((location.search || '').indexOf('guest=0') !== -1) return false;
          if (localStorage.getItem('elarahGuestCheckout') === '0') return false;
          // Overrides explícitos.
          if ((location.search || '').indexOf('guest=1') !== -1) return true;
          if (localStorage.getItem('elarahGuestCheckout') === '1') return true;
        } catch (e) {}
        return true;
      }
      const isGuestMode = !isUserLogged() && guestCheckoutEnabled();

      // === GATE DE LOGIN OBRIGATÓRIO ===
      // Pulado quando isGuestMode === true.
      if (!isUserLogged() && !isGuestMode) {
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify({
            experienceId: experienceId,
            experienceNome: experienceNome,
            horario: readActiveHorario(btn),
            descriptionAcknowledged: true,
            ts: Date.now(),
          }));
        } catch (e) {}
        const opened = openLoginModal('Faça login para concluir sua reserva');
        if (!opened) {
          alert('Faça login para concluir sua reserva.');
        }
        return;
      }

      // Tracking — funil step 4 (CTA click). Disparamos AMBOS:
      //   - cta_click  (nome canônico usado no funil do admin)
      //   - reserve_click (legado, mantido por retrocompat)
      try {
        if (window.ElarahAnalytics && ElarahAnalytics.track) {
          const trackPayload = {
            category: 'booking',
            targetId: experienceId,
            targetLabel: experienceNome,
            metadata: { cta_label: 'Reservar', source_page: (location.pathname || '').replace(/^\//, '') || 'index.html' },
          };
          ElarahAnalytics.track('cta_click', trackPayload);
          ElarahAnalytics.track('reserve_click', trackPayload);
        }
      } catch (e) {}

      // Resolve preço (do botão, do card ou do cache de experiências).
      // Sempre tenta buscar a experience pra ter acesso a campos
      // dinâmicos (variantLabel, variantOptions) que nunca vêm via
      // data-attributes do botão.
      let horario = readActiveHorario(btn);
      const scheduleSel = readActiveSchedule(btn);
      let precoLabel = btn.getAttribute('data-experience-preco') || readPrecoFromCard(btn);
      let precoCentavos = parsePrecoToCents(precoLabel);
      let variantLabel = null;
      let variantOptions = [];
      let variantItemsArr = [];
      let horariosArr = [];
      let expDescricao = '', expInclui = '', expEndereco = '', expHorarioFunc = '';

      if (window.ElarahData && typeof ElarahData.getExperienceById === 'function') {
        try {
          const exp = await ElarahData.getExperienceById(experienceId);
          if (exp) {
            expDescricao = exp.descricao || '';
            expInclui = exp.inclui || '';
            expEndereco = [exp.endereco, exp.bairro].filter(Boolean).join(' — ');
            expHorarioFunc = (exp.horarioFuncionamento || '').trim();
            if (!precoLabel || !precoCentavos) {
              precoLabel = exp.preco || precoLabel;
              precoCentavos = parsePrecoToCents(exp.preco) || precoCentavos;
            }
            if (Array.isArray(exp.horarios) && exp.horarios.length) {
              // Dedup textual: recorrência repete o mesmo horario_label pra
              // cada data (ex: 9 segundas × "19h00 – 21h00"). Sem dedup, o
              // seletor de horário do modal virava 9 botões idênticos. Só
              // horários REALMENTE distintos viram opção.
              var _seenH = new Set();
              horariosArr = exp.horarios.filter(function (h) {
                var k = String(h || '').trim();
                if (!k || _seenH.has(k)) return false;
                _seenH.add(k);
                return true;
              });
            } else if (exp.horario) {
              horariosArr = [exp.horario];
            }
            if (!horario) {
              horario = horariosArr[0] || (exp.horario || null);
            }
            // Copia as opções de variação SEMPRE que houver opções —
            // NÃO condiciona ao variantLabel estar preenchido. O rótulo é
            // só o texto do seletor; sua ausência não pode fazer a
            // variação sumir do checkout (a página de detalhe e o modal
            // de descrição já usam "Escolha a sua opção" como padrão).
            // Sem esse fallback, uma variação salva sem rótulo aparecia no
            // detalhe mas nunca virava escolha obrigatória no pagamento.
            if (Array.isArray(exp.variantOptions) && exp.variantOptions.length) {
              variantLabel = exp.variantLabel || 'Escolha a sua opção';
              variantOptions = exp.variantOptions.slice();
            }
            // Itens ricos (nome + preço) — pra o modal cobrar o preço certo
            // de cada opção (Individual/Dupla/Trio com valores diferentes).
            if (Array.isArray(exp.variantItems) && exp.variantItems.length) {
              variantItemsArr = exp.variantItems.slice();
            }
          }
        } catch (e) {}
      }

      if (!precoCentavos) {
        // Fallback: deixa o backend dizer. Sem cupom faz sentido nesse caso.
        precoCentavos = 0;
        precoLabel = precoLabel || '';
      }

      // Em modo guest pulamos getAuthInfo (não tem sessão).
      const auth = isGuestMode ? { email: null, nome: null } : await getAuthInfo();

      // Segura a abertura do modal até o spinner ter completado seu
      // tempo mínimo de exibição (RESERVE_SPINNER_MIN_MS). Se a
      // preparação já demorou mais que esse mínimo, abre na hora.
      // Cria sensação de ritual premium e dá tempo do cliente ler
      // "Preparando sua reserva…".
      try { await waitForReserveSpinnerMin(); } catch (e) {}

      // Funil — abertura do checkout. flow = 'direct' quando pulou a
      // modal de descrição (origem página de detalhe / campanha), ou
      // 'gated' quando o cliente passou pela etapa de descrição.
      var checkoutFlow = (!opts.skipDescription && descriptionGateEnabled())
        ? 'gated'
        : 'direct';
      trackBookingFunnel('checkout_open', {
        experienceId: experienceId,
        experienceNome: experienceNome,
        metadata: { flow: checkoutFlow },
      });

      openReservationModal({
        experienceId: experienceId,
        experienceNome: experienceNome,
        horario: horario,
        // Info completa dentro do checkout (voucher): descrição, inclui,
        // onde acontece, horário de funcionamento e aviso — tudo numa tela
        // só, sem a tela de descrição separada.
        showFullInfo: !!expHorarioFunc,
        descricao: expDescricao,
        inclui: expInclui,
        endereco: expEndereco,
        horarioFuncionamento: expHorarioFunc,
        // Lista completa de horários — se > 1, modal renderiza seletor
        // pra usuário trocar antes de confirmar.
        horarios: horariosArr,
        // Data + slot vindo da nova UI de chips de data (experiencia.html).
        // Em página de card (home/categoria) virão null — backend faz
        // fallback pra busca por (exp_id, horario) como antes.
        data: scheduleSel.data || null,
        dataLabel: scheduleSel.dataLabel || null,
        slotId: scheduleSel.slotId || null,
        precoLabel: precoLabel,
        precoCentavos: precoCentavos,
        // [PR F] modo guest — modal mostra campo email e cria conta no submit
        isGuest: isGuestMode,
        email: auth.email,
        // Pré-preenche com o nome do profile (se disponível). O usuário
        // ainda pode editar no modal antes de confirmar.
        nome: auth.nome || null,
        // Variantes (escolha extra). Vazio = sem seletor no modal.
        variantLabel: variantLabel,
        variantOptions: variantOptions,
        // Itens com preço por opção — o modal cobra o preço da escolhida.
        variantItems: variantItemsArr,
      });
    }

    // Capture phase + stopImmediatePropagation: garante que SOMENTE este
    // handler trate o clique, mesmo se outro script também escutar.
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest
        ? e.target.closest('[data-reserve]')
        : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
      // Spinner síncrono — feedback visual instantâneo no clique.
      // Some via finally + via hideReserveSpinner chamado pelos modais.
      showReserveSpinner();
      // data-skip-description="true" → pula o modal de descrição
      // (usado pela campanha DDN — cliente já viu a página temática,
      // não precisa ver modal de descrição genérico antes do checkout).
      var skipDesc = btn.dataset && btn.dataset.skipDescription === 'true';
      var p = startCheckout(btn, skipDesc ? { skipDescription: true } : undefined);
      if (p && typeof p.finally === 'function') {
        p.finally(function () { setTimeout(hideReserveSpinner, 80); });
      } else {
        setTimeout(hideReserveSpinner, 200);
      }
    }, true);

    // === Retomar checkout pendente após login ===
    // Quando o usuário faz login pelo modal aberto pelo gate de
    // checkout, o Supabase emite SIGNED_IN. Nesse momento, recuperamos
    // a intenção salva em sessionStorage e relançamos o startCheckout
    // automaticamente, encontrando o botão correspondente na página.
    function resumePendingCheckout() {
      let pending = null;
      try {
        const raw = sessionStorage.getItem(PENDING_KEY);
        if (raw) pending = JSON.parse(raw);
      } catch (e) {}
      if (!pending || !pending.experienceId) return;
      // Pendência expira em 30 minutos pra não disparar checkout antigo.
      if (pending.ts && (Date.now() - pending.ts) > 30 * 60 * 1000) {
        try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
        return;
      }
      try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}

      // Tenta achar o botão real na página pra preservar loading state.
      const selector = '[data-reserve][data-experience-id="' + pending.experienceId + '"]';
      // Na retomada pós-login NUNCA re-exibimos a description modal —
      // o usuário já clicou "Continuar para pagamento" antes do login.
      // skipDescription evita dupla exibição (seria pedagogicamente
      // estranho + reduz conversão).
      const resumeOpts = { skipDescription: true };
      const btn = document.querySelector(selector);
      if (btn) {
        startCheckout(btn, resumeOpts);
        return;
      }
      // Fallback: cria um botão fantasma só pra carregar os dados.
      const ghost = document.createElement('button');
      ghost.setAttribute('data-reserve', '');
      ghost.setAttribute('data-experience-id', pending.experienceId);
      if (pending.experienceNome) {
        ghost.setAttribute('data-experience-nome', pending.experienceNome);
      }
      if (pending.horario) {
        ghost.setAttribute('data-horario', pending.horario);
      }
      startCheckout(ghost, resumeOpts);
    }

    // Hook no Supabase: retoma assim que o usuário entra.
    try {
      if (window.supabaseClient && window.supabaseClient.auth &&
          typeof window.supabaseClient.auth.onAuthStateChange === 'function') {
        window.supabaseClient.auth.onAuthStateChange(function (event, session) {
          if (event === 'SIGNED_IN' && session) {
            // Pequeno delay pra UI do modal fechar antes do redirect.
            setTimeout(resumePendingCheckout, 250);
          }
        });
      }
    } catch (e) {
      console.warn('[Elarah checkout] não foi possível ouvir login', e);
    }

    // Caso o usuário já estivesse logado quando abrimos o modal (caso
    // raro de race), tenta retomar logo após o load.
    setTimeout(function () {
      if (isUserLogged()) resumePendingCheckout();
    }, 600);
  })();
});
