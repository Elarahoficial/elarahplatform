/* =============================================================
   ELARAH — MOTOR DE CONTEÚDO (admin)
   Gera roteiros prontos pra Reels, Stories, Feed, TikTok e LinkedIn
   a partir das experiências cadastradas. Usa templates parametrizados
   pela persona "Carolina" (35-55, classe A/B+, presenteadora afetiva)
   e tom da marca (curadoria, memória, tempo de qualidade).

   Responsabilidade única: dada uma lista de experiências, devolve
   blocos de copy editorial. NÃO faz fetch nem manipula DOM fora do
   painel #panel-content. Exposto em window.ElarahContent.
   ============================================================= */

(function () {
  'use strict';

  // ---------- PERSONA ----------
  // Bloco de referência usado por templates pra puxar gatilhos
  // emocionais corretos. Centralizado pra um único ponto de edição.
  const PERSONA = {
    name: 'Carolina',
    triggers: [
      'memória que fica',
      'tempo de qualidade juntas',
      'curadoria confiável',
      'beleza sem ser cafona',
    ],
    avoid: [
      'urgência forçada',
      'desconto agressivo',
      'gírias jovens',
      'cara de e-commerce',
    ],
    voice: 'curada, afetiva, segura, contemplativa',
  };

  // ---------- TOM POR CATEGORIA ----------
  // Cada categoria tem ângulo emocional próprio. Reels de cerâmica
  // não soa igual a reels de gastronomia — mesmo no mesmo template,
  // a frase de abertura e os verbos mudam.
  const CATEGORY_VOICE = {
    'cerâmica': {
      sense: 'tátil',
      verb: 'modelar',
      mood: 'meditativo, mãos sujas de barro, foco silencioso',
      payoff: 'a peça que sai do forno e fica em casa',
    },
    'gastronomia': {
      sense: 'sensorial',
      verb: 'preparar',
      mood: 'cheirinho de casa, riso na cozinha, mesa pronta',
      payoff: 'o sabor que vocês fizeram juntas',
    },
    'tufting': {
      sense: 'criativo',
      verb: 'tufar',
      mood: 'pistola na mão, cores se encaixando, peça crescendo',
      payoff: 'o tapete que vai pra parede da sala',
    },
    'pintura': {
      sense: 'estético',
      verb: 'pintar',
      mood: 'pincel, vinho na taça, conversa que flui',
      payoff: 'a obra que vocês assinam juntas',
    },
    'vela': {
      sense: 'olfativo',
      verb: 'aromar',
      mood: 'cera derretida, fragrância escolhida, calma',
      payoff: 'a vela que perfuma a casa por meses',
    },
    'sabonete': {
      sense: 'olfativo',
      verb: 'criar',
      mood: 'óleos, formas delicadas, ritual de cuidado',
      payoff: 'o sabonete que ela usa pensando em você',
    },
    'macramê': {
      sense: 'manual',
      verb: 'tecer',
      mood: 'fios, nós, peça ganhando corpo devagar',
      payoff: 'a peça artesanal que decora e tem história',
    },
    'floral': {
      sense: 'visual',
      verb: 'arranjar',
      mood: 'flores frescas, tesoura, composição',
      payoff: 'o arranjo que ela leva pra casa',
    },
    'bartenderia': {
      sense: 'sensorial',
      verb: 'preparar',
      mood: 'gelo no copo, cítricos, aprendizado leve',
      payoff: 'o drink que vocês descobriram juntas',
    },
  };

  function voiceFor(categoria) {
    if (!categoria) return CATEGORY_VOICE['gastronomia'];
    const k = String(categoria).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    return CATEGORY_VOICE[k] || {
      sense: 'sensorial',
      verb: 'viver',
      mood: 'momento presente, mãos ocupadas, mente leve',
      payoff: 'a memória que vocês levam',
    };
  }

  // ---------- HELPERS ----------
  function pickHorario(exp) {
    if (Array.isArray(exp.horarios) && exp.horarios.length) return exp.horarios[0];
    return exp.horario || '';
  }

  function expDateLabel(exp) {
    const d = (exp.data || '').trim();
    if (!d) return '';
    if (/semanal/i.test(d)) return 'data flexível, várias turmas na semana';
    return d;
  }

  function expURL(exp) {
    if (!exp || !exp.id) return 'https://elarah.com.br/dia-das-maes.html';
    return 'https://elarah.com.br/experiencia.html?id=' + encodeURIComponent(exp.id);
  }

  function expHashtags(exp) {
    const cat = (exp.categoria || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');
    const base = ['#elarah', '#offlineisafeeling', '#presentearcomafeto', '#experienciaspresentavel'];
    if (cat) base.push('#' + cat);
    base.push('#saopaulo', '#sp', '#diadasmaes');
    return base.join(' ');
  }

  // Filtra experiências cuja data está dentro de N dias a partir de
  // hoje. "Semanal" sempre passa. Datas não-parseáveis também passam
  // (mostram tudo na dúvida).
  function withinDays(exp, days) {
    if (days === 'all' || !days) return true;
    const d = String(exp.data || '').trim();
    if (!d) return true;
    if (/semanal/i.test(d)) return true;
    const m = d.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (!m) return true;
    const day = +m[1], month = +m[2];
    const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear();
    const ts = new Date(year, month - 1, day).getTime();
    if (!Number.isFinite(ts)) return true;
    const diffDays = (ts - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= -1 && diffDays <= +days;
  }

  // ---------- TEMPLATES POR FORMATO ----------
  // Cada template recebe (exp, voice) e devolve { headline, body }.
  // Body pode ter quebras de linha — vai ser preservado no <pre>.

  function reelTemplate(exp, voice) {
    const horario = pickHorario(exp);
    const data = expDateLabel(exp);
    const preco = exp.preco || '';
    const bairro = exp.bairro || '';
    const url = expURL(exp);

    return {
      headline: 'Reels · 30s · vertical',
      body:
`GANCHO (0-3s) — fale olhando pra câmera, fundo limpo:
"O melhor presente esse ano não está numa caixa."

DESENVOLVIMENTO (3-22s) — corte ágil, B-roll da experiência:
[cena 1] Mãos ${voice.verb}, plano fechado.
[cena 2] Duas pessoas rindo durante a aula (mãe e filha, idealmente).
[cena 3] ${voice.payoff} — close no resultado.

VOZ EM OFF (sobre as cenas):
"${exp.nome}. ${exp.duracao || ''}${exp.duracao ? ' de ' : ''}${voice.mood}. ${exp.inclui ? exp.inclui + '. ' : ''}${data ? data + ', ' : ''}${bairro ? bairro + '. ' : ''}A partir de ${preco}."

CTA (22-30s) — aparece o nome da marca + texto sobreposto:
"Reserve em elarah.com.br · curadoria pra presentear quem importa."

LEGENDA (pra postar junto):
${exp.nome}.
Pra quem prefere viver a memória do que ganhar mais uma coisa.
Link na bio → ${url}

ÁUDIO SUGERIDO:
Trilha instrumental contemplativa (piano + cordas). Evite trends barulhentas — não combina com a Carolina.

${expHashtags(exp)}`
    };
  }

  function storiesTemplate(exp, voice) {
    const data = expDateLabel(exp);
    const preco = exp.preco || '';
    const bairro = exp.bairro || '';
    const url = expURL(exp);

    return {
      headline: 'Stories · sequência de 5 frames',
      body:
`FRAME 1 — fundo creme, texto serif grande:
"Toda semana a Elarah escolhe uma experiência."

FRAME 2 — foto da experiência, sem filtro pesado:
"Essa semana a curadoria é: ${exp.nome}."

FRAME 3 — boomerang ou closeup do processo (${voice.mood}):
[texto curto] "${voice.sense.charAt(0).toUpperCase() + voice.sense.slice(1)}, lento, presente."

FRAME 4 — card com info essencial:
${data ? '📅 ' + data : ''}
${bairro ? '📍 ' + bairro : ''}
${preco ? '💛 a partir de ' + preco : ''}
${exp.duracao ? '⏱ ' + exp.duracao : ''}

FRAME 5 — CTA com sticker "Link" ou "Saiba mais":
"Pra presentear ou viver. Toque pra reservar."
→ ${url}

DICA: posta os 5 em sequência num único momento da semana (terça ou quinta de manhã performam melhor pra essa persona). Evite stories repetitivos — Carolina cansa rápido.`
    };
  }

  function feedTemplate(exp, voice) {
    const data = expDateLabel(exp);
    const preco = exp.preco || '';
    const bairro = exp.bairro || '';
    const url = expURL(exp);

    return {
      headline: 'Post de feed · carrossel (3-5 fotos)',
      body:
`IMAGEM 1 (capa) — foto principal da experiência, com pequena tipografia branca:
"${exp.nome}"

IMAGEM 2-4 — detalhes do processo: mãos, materiais, ${voice.mood}.

IMAGEM ÚLTIMA — resultado: ${voice.payoff}.

LEGENDA (pronta pra colar):

Tem coisas que a gente não consegue colocar dentro de uma caixa.

${exp.descricao ? exp.descricao.split('\n')[0] : exp.nome + ' é uma dessas experiências que viram memória.'}

${data ? '📅 ' + data : ''}${data && bairro ? ' · ' : ''}${bairro ? '📍 ' + bairro : ''}
${preco ? 'A partir de ' + preco : ''}${exp.duracao ? ' · ' + exp.duracao : ''}

Reserva no link da bio.
${url}

—
${PERSONA.voice} • ${expHashtags(exp)}

DICA DE PUBLICAÇÃO: terça 19h ou domingo 11h costumam performar melhor pra Carolina (final de tarde corporativo + manhã de café fim de semana).`
    };
  }

  function tiktokTemplate(exp, voice) {
    const url = expURL(exp);

    return {
      headline: 'TikTok · 15-25s · POV ou trend lenta',
      body:
`FORMATO: POV em primeira pessoa, ritmo mais leve que reels (Carolina não está no TikTok pra rir, está pra descobrir).

GANCHO (0-3s) — texto sobreposto grande, áudio baixo:
"Coisas que minha mãe pediu pra parar de comprar pra ela:"
→ corte rápido em 3-4 objetos: chocolate, perfume, flores, vela aleatória.

VIRADA (3-8s):
"Coisas que ela aceitou na hora:"
→ cena de duas pessoas ${voice.verb} juntas na experiência.

PAYOFF (8-15s):
[voz suave em off] "${exp.nome}. ${voice.payoff}."
[texto] "Curadoria Elarah. Link na bio."

CTA (15-25s) — só se a trend pedir extensão:
"Pra mãe, pra você, pra quem você ama. Sem caixa, com memória."

LEGENDA:
não é todo presente que entra dentro de um saco. ${url}

ÁUDIO:
Procurar trends do tipo "things my mom said no to / yes to" — versão lenta. Evite áudios escandalosos. A trend tem que respirar.

OBSERVAÇÃO ESTRATÉGICA:
TikTok pra Elarah hoje serve mais como descoberta + amplificação (a Júlia compartilha e a Carolina vê via WhatsApp). Não force venda direta no TikTok, force narrativa.`
    };
  }

  function linkedinTemplate(exp, voice) {
    const url = expURL(exp);

    return {
      headline: 'LinkedIn · post institucional',
      body:
`Tem um setor que cresce silenciosamente no Brasil: o de experiências como presente corporativo e afetivo.

Na Elarah, observamos um padrão claro entre quem nos procura: mulheres entre 35 e 55 anos, lideranças, mães e filhas, que estão saturadas de presentes materiais e procuram algo que devolva tempo, afeto e memória.

Foi por isso que estruturamos uma curadoria semanal de experiências em São Paulo — workshops de ${exp.categoria || 'criação'}, gastronomia, cerâmica, tufting e mais. Cada experiência é selecionada por critérios de segurança, beleza e relevância afetiva.

Essa semana destacamos: ${exp.nome}.

${exp.descricao ? exp.descricao.split('\n')[0] : voice.payoff + '.'}

Mais do que vender uma aula, estamos vendendo uma forma diferente de cuidar de quem importa. ${url}

#experienciascomopresente #curadoria #saopaulo #afetocorporativo #elarah

OBSERVAÇÃO: LinkedIn é canal-suporte, não principal. Use 1x por semana. Boa pra atrair empresas que querem fazer presente corporativo de fim de ano / dia das mães coletivo.`
    };
  }

  // Map de geradores. Adicionar novo formato é uma entrada aqui.
  const GENERATORS = {
    reels:    reelTemplate,
    stories:  storiesTemplate,
    feed:     feedTemplate,
    tiktok:   tiktokTemplate,
    linkedin: linkedinTemplate,
  };

  // ---------- GERAÇÃO ----------
  // Recebe array de experiências + filtros, devolve array de blocos
  // { exp, format, headline, body }. A view só renderiza.
  function generate(experiences, opts) {
    opts = opts || {};
    const days = opts.days != null ? opts.days : 7;
    const formatFilter = opts.format && opts.format !== 'all' ? opts.format : null;

    const formats = formatFilter
      ? [formatFilter]
      : ['reels', 'stories', 'feed', 'tiktok', 'linkedin'];

    const filtered = (experiences || [])
      .filter(e => e && e.isActive !== false)
      .filter(e => withinDays(e, days));

    const blocks = [];
    filtered.forEach(exp => {
      const voice = voiceFor(exp.categoria);
      formats.forEach(f => {
        const gen = GENERATORS[f];
        if (!gen) return;
        const out = gen(exp, voice);
        blocks.push({
          exp: exp,
          format: f,
          headline: out.headline,
          body: out.body,
        });
      });
    });

    return { blocks: blocks, expCount: filtered.length };
  }

  // ---------- RENDER ----------
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // Card visual. Inclui botão de copiar com fallback caso clipboard
  // API não esteja disponível (admin pode rodar em iframe sem perm).
  function renderCard(block) {
    const exp = block.exp || {};
    const fmtBadge =
      '<span class="admin__content-card__format admin__content-card__format--' + block.format + '">' +
      escapeHtml(block.headline) +
      '</span>';

    const meta = [];
    if (exp.categoria) meta.push(escapeHtml(exp.categoria));
    if (exp.data) meta.push(escapeHtml(exp.data));
    if (exp.bairro) meta.push(escapeHtml(exp.bairro));
    if (exp.preco) meta.push(escapeHtml(exp.preco));
    const metaLine = meta.length
      ? '<div class="admin__content-card__meta">' + meta.join(' · ') + '</div>'
      : '';

    return (
      '<article class="admin__content-card" data-format="' + block.format + '">' +
        '<header class="admin__content-card__head">' +
          fmtBadge +
          '<button type="button" class="admin__content-card__copy" data-action="copy">Copiar texto</button>' +
        '</header>' +
        '<h3 class="admin__content-card__title">' + escapeHtml(exp.nome || 'Experiência') + '</h3>' +
        metaLine +
        '<pre class="admin__content-card__body">' + escapeHtml(block.body) + '</pre>' +
      '</article>'
    );
  }

  function copyText(text, btn) {
    const done = function (ok) {
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = ok ? 'Copiado ✓' : 'Erro ao copiar';
      btn.classList.add('admin__content-card__copy--' + (ok ? 'ok' : 'err'));
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('admin__content-card__copy--ok', 'admin__content-card__copy--err');
      }, 1800);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        return;
      }
    } catch (e) {}
    // Fallback execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(!!ok);
    } catch (e) { done(false); }
  }

  // Wira o click handler na grid. Idempotente.
  function wireGridClicks(gridEl, blocks) {
    if (!gridEl) return;
    if (gridEl._elarahWired) return;
    gridEl._elarahWired = true;
    gridEl.addEventListener('click', function (ev) {
      const btn = ev.target.closest('[data-action="copy"]');
      if (!btn) return;
      const card = btn.closest('.admin__content-card');
      if (!card) return;
      const idx = Array.prototype.indexOf.call(gridEl.children, card);
      const block = blocks[idx];
      if (!block) return;
      const text = '[' + block.headline + '] ' + (block.exp && block.exp.nome ? block.exp.nome : '') + '\n\n' + block.body;
      copyText(text, btn);
    });
  }

  // ---------- ENTRY POINT ----------
  // Função única chamada pelo admin.js no case 'content'. Lê os
  // selects, busca experiências, gera blocos e renderiza.
  async function render() {
    const grid = document.getElementById('content-grid');
    const summary = document.getElementById('content-summary');
    const weekSel = document.getElementById('content-week');
    const fmtSel = document.getElementById('content-format');
    if (!grid) return;

    grid.innerHTML = '<p class="admin__content-empty">Carregando experiências…</p>';

    // Tenta usar o cache de experiências do admin (mesma fonte que
    // o painel de Experiências usa). Se não houver, fallback pra
    // ElarahData direto.
    let experiences = [];
    try {
      if (window.ElarahData && window.ElarahData.getAllExperiences) {
        experiences = await window.ElarahData.getAllExperiences();
      }
    } catch (e) {
      console.warn('[Elarah Content] falha ao buscar experiências', e);
    }

    const days = weekSel ? weekSel.value : '7';
    const format = fmtSel ? fmtSel.value : 'all';
    const numericDays = days === 'all' ? 'all' : Number(days);

    const { blocks, expCount } = generate(experiences, {
      days: numericDays,
      format: format,
    });

    if (summary) {
      if (!expCount) {
        summary.textContent = 'Nenhuma experiência ativa na janela selecionada.';
      } else {
        summary.textContent =
          expCount + ' experiência' + (expCount !== 1 ? 's' : '') +
          ' · ' + blocks.length + ' bloco' + (blocks.length !== 1 ? 's' : '') + ' de conteúdo';
      }
    }

    if (!blocks.length) {
      grid.innerHTML = '<p class="admin__content-empty">Sem conteúdo para os filtros selecionados. Tente ampliar a janela ou cadastrar experiências com data.</p>';
      return;
    }

    grid.innerHTML = blocks.map(renderCard).join('');
    wireGridClicks(grid, blocks);
  }

  // Wire dos selects e do botão "Gerar agora" — idempotente.
  function wireControls() {
    const btn = document.getElementById('btn-refresh-content');
    const weekSel = document.getElementById('content-week');
    const fmtSel = document.getElementById('content-format');
    if (btn && !btn._wired) { btn._wired = true; btn.addEventListener('click', render); }
    if (weekSel && !weekSel._wired) { weekSel._wired = true; weekSel.addEventListener('change', render); }
    if (fmtSel && !fmtSel._wired) { fmtSel._wired = true; fmtSel.addEventListener('change', render); }
  }

  window.ElarahContent = {
    render: function () { wireControls(); return render(); },
    generate: generate,        // exposto pra testes/uso externo
    PERSONA: PERSONA,
  };
})();
