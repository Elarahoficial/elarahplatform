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

  // ---------- DATAS ----------
  // Parser tolerante: aceita "DD/MM" (ano corrente) ou "DD/MM/AAAA".
  // "Semanal" / vazio devolve null — caller decide como tratar.
  function parseExpDate(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (/semanal/i.test(s)) return null;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (!m) return null;
    const day = +m[1], month = +m[2];
    if (!(day >= 1 && day <= 31) || !(month >= 1 && month <= 12)) return null;
    const year = m[3]
      ? (m[3].length === 2 ? 2000 + +m[3] : +m[3])
      : new Date().getFullYear();
    const d = new Date(year, month - 1, day);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function isoDay(d) { return startOfDay(d).toISOString().slice(0, 10); }
  function diffDays(a, b) {
    return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
  }

  const WEEKDAY_LABEL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  function brDateLabel(d, todayMs) {
    const today = startOfDay(new Date(todayMs));
    const target = startOfDay(d);
    const delta = diffDays(target, today);
    const dd = String(target.getDate()).padStart(2, '0');
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    if (delta === 0) return 'Hoje · ' + dd + '/' + mm;
    if (delta === 1) return 'Amanhã · ' + dd + '/' + mm;
    if (delta > 1 && delta <= 6) return WEEKDAY_LABEL[target.getDay()] + ' · ' + dd + '/' + mm;
    if (delta > 6 && delta <= 13) return WEEKDAY_LABEL[target.getDay()] + ' que vem · ' + dd + '/' + mm;
    return WEEKDAY_LABEL[target.getDay()] + ' · ' + dd + '/' + mm;
  }

  // ---------- ATRIBUIÇÃO DE DIA DE POSTAGEM ----------
  // Regra de negócio (curadoria, sem urgência fake):
  //
  //   Experiência com data marcada (ex: 30/04):
  //     • REELS → posta 3 dias antes do evento (D-3) — peça principal
  //     • FEED  → posta 2 dias antes (D-2) — reforço editorial
  //     • TIKTOK → posta 4 dias antes (D-4) — descoberta
  //     • STORIES → 1 dia antes (D-1) — última chamada elegante
  //     • LINKEDIN → 5 dias antes (D-5) — institucional, B2B
  //
  //   Se o dia ideal já passou (evento muito próximo), o post cai
  //   pra amanhã (não publicamos no passado), mas sinalizamos urgência.
  //
  //   "Semanal" / sem data: vira EVERGREEN. Distribuído como filler
  //   nos dias com menos posts, garantindo pelo menos 1 reels/feed
  //   por dia até onde der.
  const FORMAT_LEAD_DAYS = {
    linkedin: 5,
    tiktok:   4,
    reels:    3,
    feed:     2,
    stories:  1,
  };

  // Gera o calendário: { days: [{ date, label, posts: [block, ...] }, ...], stats }.
  // Cada `block` é { exp, format, headline, body, leadLabel } pronto pro render.
  function buildCalendar(experiences, opts) {
    opts = opts || {};
    const horizon = opts.horizon != null ? opts.horizon : 7; // dias visíveis a partir de amanhã
    const formatFilter = opts.format && opts.format !== 'all' ? opts.format : null;
    const formats = formatFilter
      ? [formatFilter]
      : ['reels', 'stories', 'feed', 'tiktok', 'linkedin'];

    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const lastVisible = addDays(tomorrow, horizon - 1);

    // Map: ISO day → { date, label, posts: [] }
    const dayMap = {};
    function ensureDay(d) {
      const key = isoDay(d);
      if (!dayMap[key]) {
        dayMap[key] = { date: startOfDay(d), label: brDateLabel(d, today.getTime()), posts: [] };
      }
      return dayMap[key];
    }
    function pushPost(d, block) {
      ensureDay(d).posts.push(block);
    }

    function makeBlock(exp, format, leadLabel) {
      const voice = voiceFor(exp.categoria);
      const gen = GENERATORS[format];
      if (!gen) return null;
      const out = gen(exp, voice);
      return {
        exp: exp,
        format: format,
        headline: out.headline,
        body: out.body,
        leadLabel: leadLabel || '',
      };
    }

    // 1ª passada: experiências com DATA fixa.
    const evergreen = []; // experiências sem data (Semanal / vazio)
    let datedCount = 0;

    (experiences || [])
      .filter(e => e && e.isActive !== false)
      .forEach(exp => {
        const expDate = parseExpDate(exp.data);
        if (!expDate) {
          evergreen.push(exp);
          return;
        }
        if (startOfDay(expDate) < today) return; // evento já passou — ignora
        datedCount++;

        formats.forEach(format => {
          const lead = FORMAT_LEAD_DAYS[format] || 0;
          let postDate = addDays(expDate, -lead);
          let leadLabel = '';

          // Se a data ideal de postagem já passou, joga pra amanhã
          // com label de urgência (mas mantém o roteiro — o usuário
          // edita se precisar de mais agressividade).
          if (postDate < tomorrow) {
            postDate = tomorrow;
            const daysUntil = diffDays(expDate, tomorrow);
            if (daysUntil <= 0)      leadLabel = 'Hoje é o dia da experiência';
            else if (daysUntil === 1) leadLabel = 'Última chamada · evento amanhã';
            else                       leadLabel = 'Curto prazo · evento em ' + daysUntil + 'd';
          } else {
            const daysUntil = diffDays(expDate, postDate);
            leadLabel = 'Evento em ' + daysUntil + 'd';
          }

          // Só inclui se o dia de postagem está na janela visível.
          if (postDate > lastVisible) return;

          const block = makeBlock(exp, format, leadLabel);
          if (block) pushPost(postDate, block);
        });
      });

    // 2ª passada: distribui evergreen (Semanal) como filler nos dias
    // com menos posts. Cada experiência evergreen entra com Reels +
    // Feed em dias separados pra esticar a presença na semana.
    // Round-robin sobre a janela visível.
    if (evergreen.length && formats.length) {
      const visibleDays = [];
      for (let i = 0; i < horizon; i++) visibleDays.push(addDays(tomorrow, i));

      // Embaralhamento estável (hash do id) pra que postagens
      // evergreen não fiquem todas no mesmo dia toda semana.
      function stableHash(s) {
        let h = 0; const str = String(s || '');
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return Math.abs(h);
      }

      // Pra cada evergreen, escolhe 1 ou 2 dias diferentes da semana
      // (Reels primário + Feed secundário se ambos estão no filtro).
      const useReels = formats.indexOf('reels') >= 0;
      const useFeed = formats.indexOf('feed') >= 0;
      const useStories = formats.indexOf('stories') >= 0;
      // Stories evergreen só uma vez na semana — não precisa repetir
      // sequência dia após dia.

      evergreen.forEach((exp, idx) => {
        const seed = stableHash(exp.id || exp.nome || idx);
        const dayA = visibleDays[seed % visibleDays.length];
        const dayB = visibleDays[(seed + 3) % visibleDays.length];
        const dayC = visibleDays[(seed + 5) % visibleDays.length];

        if (useReels) {
          const b = makeBlock(exp, 'reels', 'Evergreen · turma semanal');
          if (b) pushPost(dayA, b);
        }
        if (useFeed) {
          const b = makeBlock(exp, 'feed', 'Evergreen · turma semanal');
          if (b) pushPost(dayB, b);
        }
        if (useStories) {
          const b = makeBlock(exp, 'stories', 'Evergreen · turma semanal');
          if (b) pushPost(dayC, b);
        }
        // TikTok / LinkedIn evergreen são opcionais: só entram se o
        // filtro for explícito (formatFilter === 'tiktok' p.ex.) —
        // assim não inundamos a semana de posts institucionais.
        if (formatFilter === 'tiktok') {
          const b = makeBlock(exp, 'tiktok', 'Evergreen · turma semanal');
          if (b) pushPost(visibleDays[(seed + 1) % visibleDays.length], b);
        }
        if (formatFilter === 'linkedin') {
          const b = makeBlock(exp, 'linkedin', 'Evergreen · turma semanal');
          if (b) pushPost(visibleDays[(seed + 2) % visibleDays.length], b);
        }
      });
    }

    // Monta a lista ordenada e filtra a janela [tomorrow, lastVisible].
    const days = Object.keys(dayMap)
      .map(k => dayMap[k])
      .filter(d => d.date >= tomorrow && d.date <= lastVisible)
      .sort((a, b) => a.date - b.date);

    // Garante que dias sem post ainda apareçam (placeholder visual).
    // Sem isso o time pode achar que o sistema "esqueceu" de uma data.
    const allKeys = new Set(days.map(d => isoDay(d.date)));
    for (let i = 0; i < horizon; i++) {
      const d = addDays(tomorrow, i);
      const key = isoDay(d);
      if (!allKeys.has(key)) {
        days.push({ date: startOfDay(d), label: brDateLabel(d, today.getTime()), posts: [] });
      }
    }
    days.sort((a, b) => a.date - b.date);

    let totalPosts = 0;
    days.forEach(d => totalPosts += d.posts.length);

    return {
      days: days,
      stats: {
        datedExperiences: datedCount,
        evergreenExperiences: evergreen.length,
        totalPosts: totalPosts,
        horizon: horizon,
      },
    };
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

  // ---------- RENDER ----------
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // Card visual. Inclui botão de copiar com fallback caso clipboard
  // API não esteja disponível (admin pode rodar em iframe sem perm).
  // O índice é embutido como data-block-idx pra resolver clicks via
  // delegation sem depender de DOM order.
  function renderCard(block, blockIdx) {
    const exp = block.exp || {};
    const fmtBadge =
      '<span class="admin__content-card__format admin__content-card__format--' + block.format + '">' +
      escapeHtml(block.headline) +
      '</span>';

    const lead = block.leadLabel
      ? '<span class="admin__content-card__lead">' + escapeHtml(block.leadLabel) + '</span>'
      : '';

    const meta = [];
    if (exp.categoria) meta.push(escapeHtml(exp.categoria));
    if (exp.data) meta.push('Evento ' + escapeHtml(exp.data));
    if (exp.bairro) meta.push(escapeHtml(exp.bairro));
    if (exp.preco) meta.push(escapeHtml(exp.preco));
    const metaLine = meta.length
      ? '<div class="admin__content-card__meta">' + meta.join(' · ') + '</div>'
      : '';

    return (
      '<article class="admin__content-card" data-format="' + block.format + '" data-block-idx="' + blockIdx + '">' +
        '<header class="admin__content-card__head">' +
          fmtBadge + lead +
          '<button type="button" class="admin__content-card__copy" data-action="copy">Copiar texto</button>' +
        '</header>' +
        '<h3 class="admin__content-card__title">' + escapeHtml(exp.nome || 'Experiência') + '</h3>' +
        metaLine +
        '<pre class="admin__content-card__body">' + escapeHtml(block.body) + '</pre>' +
      '</article>'
    );
  }

  // Renderiza UMA seção de dia: header com data + grid interna de cards.
  // `startIdx` é a posição global do primeiro card no array linear de
  // blocks (usado pelo handler de copy via data-block-idx).
  function renderDay(day, startIdx) {
    const empty = !day.posts.length;
    const countLabel = empty
      ? 'Sem pauta atribuída — bom dia pra calendário em branco ou repostar conteúdo evergreen.'
      : day.posts.length + ' post' + (day.posts.length !== 1 ? 's' : '') + ' previsto' + (day.posts.length !== 1 ? 's' : '');

    const cardsHtml = empty
      ? '<p class="admin__content-day__empty">Sem post programado pra esse dia.</p>'
      : '<div class="admin__content-day__grid">' +
        day.posts.map(function (b, i) { return renderCard(b, startIdx + i); }).join('') +
        '</div>';

    return (
      '<section class="admin__content-day' + (empty ? ' admin__content-day--empty' : '') + '">' +
        '<header class="admin__content-day__head">' +
          '<h2 class="admin__content-day__label">' + escapeHtml(day.label) + '</h2>' +
          '<span class="admin__content-day__count">' + escapeHtml(countLabel) + '</span>' +
        '</header>' +
        cardsHtml +
      '</section>'
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

  // Wira o click handler no container do calendário. Idempotente.
  // Usa o data-block-idx do card (posição no array linear) pra
  // resolver — funciona mesmo com a hierarquia day→grid→card.
  function wireGridClicks(rootEl, blocks) {
    if (!rootEl) return;
    if (rootEl._elarahWired) return;
    rootEl._elarahWired = true;
    rootEl.addEventListener('click', function (ev) {
      const btn = ev.target.closest('[data-action="copy"]');
      if (!btn) return;
      const card = btn.closest('.admin__content-card');
      if (!card) return;
      const idx = Number(card.getAttribute('data-block-idx'));
      const block = blocks[idx];
      if (!block) return;
      const text = '[' + block.headline + '] ' + (block.exp && block.exp.nome ? block.exp.nome : '') + '\n\n' + block.body;
      copyText(text, btn);
    });
  }

  // ---------- ENTRY POINT ----------
  // Função única chamada pelo admin.js no case 'content'. Lê os
  // selects, busca experiências, monta o calendário e renderiza
  // dia-a-dia começando por amanhã.
  async function render() {
    const grid = document.getElementById('content-grid');
    const summary = document.getElementById('content-summary');
    const weekSel = document.getElementById('content-week');
    const fmtSel = document.getElementById('content-format');
    if (!grid) return;

    grid.innerHTML = '<p class="admin__content-empty">Carregando experiências…</p>';

    let experiences = [];
    try {
      if (window.ElarahData && window.ElarahData.getAllExperiences) {
        experiences = await window.ElarahData.getAllExperiences();
      }
    } catch (e) {
      console.warn('[Elarah Content] falha ao buscar experiências', e);
    }

    const horizonRaw = weekSel ? weekSel.value : '7';
    const horizon = horizonRaw === 'all' ? 30 : Math.max(1, Number(horizonRaw) || 7);
    const format = fmtSel ? fmtSel.value : 'all';

    const { days, stats } = buildCalendar(experiences, {
      horizon: horizon,
      format: format,
    });

    if (summary) {
      const fmtLabel = format === 'all' ? 'todos os formatos' : format;
      summary.textContent =
        stats.datedExperiences + ' experiência(s) com data + ' +
        stats.evergreenExperiences + ' semanal(is) · ' +
        stats.totalPosts + ' post(s) programado(s) nos próximos ' +
        horizon + ' dias · ' + fmtLabel + '.';
    }

    if (!days.length) {
      grid.innerHTML = '<p class="admin__content-empty">Sem dados pra montar calendário. Cadastre experiências com data ou use o filtro "Todas as experiências ativas".</p>';
      return;
    }

    // Linearizamos os blocks pra que o handler de copy resolva por
    // data-block-idx — independente da hierarquia day→grid→card.
    const linearBlocks = [];
    let html = '';
    days.forEach(function (day) {
      const startIdx = linearBlocks.length;
      day.posts.forEach(function (b) { linearBlocks.push(b); });
      html += renderDay(day, startIdx);
    });

    grid.innerHTML = html;
    wireGridClicks(grid, linearBlocks);
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
    buildCalendar: buildCalendar, // exposto pra testes/uso externo
    PERSONA: PERSONA,
  };
})();
