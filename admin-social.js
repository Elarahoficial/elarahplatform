/* =============================================================
   ELARAH — REDES SOCIAIS (admin)
   Dashboard analítico de posts publicados (Instagram, TikTok,
   LinkedIn). Substituiu o antigo motor de roteiros (admin-content.js).

   Responsabilidade:
   - Persistir posts manualmente cadastrados ou importados via CSV
     (localStorage agora; pronto pra migrar pra Supabase no futuro).
   - Calcular KPIs, comparativos, padrões e ideias acionáveis.
   - NÃO faz fetch externo nem altera DOM fora de #panel-social.

   Decisões de design:
   - Persistência local porque integração com Graph API / TikTok API
     ainda não está pronta. A camada de storage está isolada em
     loadPosts/savePosts pra trocar por fetch sem mexer no resto.
   - Detecção de padrão é rules-based (sem LLM) pra rodar offline,
     ser determinística e auditável. Quando virar API, dá pra
     plugar uma camada de IA por cima sem refazer o pipeline.
   - Engajamento total = likes + comments + saves + shares.
     Taxa de engajamento = engajamento / max(views, 1) * 100.
     Os pesos por métrica estão em METRIC_WEIGHTS (placeholder),
     fáceis de ajustar quando tivermos dados reais o suficiente
     pra calibrar.

   Exposto em window.ElarahSocial = { render }.
   ============================================================= */

(function () {
  'use strict';

  // -----------------------------------------------------------
  // CONSTANTES
  // -----------------------------------------------------------
  const STORAGE_KEY = 'elarah.social.posts.v1';

  const PLATFORM_LABEL = {
    instagram: 'Instagram',
    tiktok:    'TikTok',
    linkedin:  'LinkedIn',
  };

  const TYPE_LABEL = {
    reel:      'Reel',
    story:     'Story',
    feed:      'Feed',
    carrossel: 'Carrossel',
    video:     'Vídeo',
  };

  // Limiar pra um padrão ser considerado "vencedor" / "perdedor".
  // 1.5x acima da média global = vencedor; 0.6x = perdedor.
  // Usa amostra mínima pra evitar barulho de poucos posts.
  const PATTERN = {
    WIN_MULTIPLIER:  1.5,
    LOSE_MULTIPLIER: 0.6,
    MIN_SAMPLE:      2,
  };

  // -----------------------------------------------------------
  // STORAGE LAYER
  // Mantém os posts em localStorage. Quando virar Supabase, só
  // troca essas duas funções por fetch pra public.social_posts.
  // -----------------------------------------------------------
  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizePost).filter(Boolean) : [];
    } catch (e) {
      console.warn('[ElarahSocial] storage corrompido, resetando.', e);
      return [];
    }
  }

  function savePosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('[ElarahSocial] não foi possível salvar.', e);
      alert('Não foi possível salvar — armazenamento local cheio ou bloqueado.');
    }
  }

  function uid() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // Normaliza qualquer objeto em post válido. Garante tipos numéricos
  // pra evitar bugs em soma de string ("5"+"3" = "53").
  function normalizePost(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const platform = String(raw.platform || '').toLowerCase();
    const type = String(raw.type || '').toLowerCase();
    if (!PLATFORM_LABEL[platform] || !TYPE_LABEL[type]) return null;
    const date = String(raw.date || '').slice(0, 10);
    if (!date) return null;
    return {
      id:       raw.id || uid(),
      platform,
      type,
      date,
      link:     raw.link ? String(raw.link) : '',
      tags:     normalizeTags(raw.tags),
      views:    toInt(raw.views),
      likes:    toInt(raw.likes),
      comments: toInt(raw.comments),
      saves:    toInt(raw.saves),
      shares:   toInt(raw.shares),
    };
  }

  function normalizeTags(input) {
    if (!input) return [];
    const arr = Array.isArray(input)
      ? input
      : String(input).split(/[,;]/);
    return arr
      .map(t => String(t).trim().toLowerCase())
      .filter(Boolean)
      .filter((t, i, a) => a.indexOf(t) === i);
  }

  function toInt(v) {
    const n = parseInt(v, 10);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function upsertPost(post) {
    const list = loadPosts();
    const idx = list.findIndex(p => p.id === post.id);
    if (idx >= 0) list[idx] = post;
    else list.push(post);
    savePosts(list);
    return post;
  }

  function deletePost(id) {
    const list = loadPosts().filter(p => p.id !== id);
    savePosts(list);
  }

  // -----------------------------------------------------------
  // HELPERS DE FORMATAÇÃO E DATA
  // -----------------------------------------------------------
  function engagement(p) {
    return (p.likes || 0) + (p.comments || 0) + (p.saves || 0) + (p.shares || 0);
  }

  function engRate(p) {
    return p.views > 0 ? (engagement(p) / p.views) * 100 : 0;
  }

  function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }

  function fmtNum(n) {
    if (n == null || !isFinite(n)) return '—';
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1).replace('.0', '') + 'k';
    return String(Math.round(n));
  }

  function fmtPct(n, digits = 1) {
    if (n == null || !isFinite(n)) return '—';
    return n.toFixed(digits).replace('.', ',') + '%';
  }

  function fmtDateBR(isoDate) {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y.slice(2)}`;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysBetween(aISO, bISO) {
    const a = new Date(aISO + 'T00:00:00');
    const b = new Date(bISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function isoNDaysAgo(n) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // Compara duas séries (atual vs anterior) e devolve {pct, dir}.
  function delta(curr, prev) {
    if (!prev || prev === 0) {
      if (!curr) return { pct: 0, dir: 'flat' };
      return { pct: 100, dir: 'up' };
    }
    const pct = ((curr - prev) / prev) * 100;
    const dir = pct > 1 ? 'up' : pct < -1 ? 'down' : 'flat';
    return { pct, dir };
  }

  function fmtDelta(d) {
    if (!d) return '—';
    const arrow = d.dir === 'up' ? '▲' : d.dir === 'down' ? '▼' : '–';
    return `${arrow} ${Math.abs(d.pct).toFixed(0)}%`;
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // -----------------------------------------------------------
  // CSV PARSER / SERIALIZER
  // Implementação leve, suporta campos entre aspas com vírgulas.
  // Schema esperado (header obrigatório):
  //   platform,type,date,link,views,likes,comments,saves,shares,tags
  // -----------------------------------------------------------
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field); rows.push(row);
          row = []; field = '';
        } else { field += c; }
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];

    const header = rows[0].map(h => h.trim().toLowerCase());
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (cells.length === 1 && !cells[0].trim()) continue;
      const obj = {};
      header.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
      const post = normalizePost(obj);
      if (post) out.push(post);
    }
    return out;
  }

  function toCSV(posts) {
    const header = ['platform','type','date','link','views','likes','comments','saves','shares','tags'];
    const lines = [header.join(',')];
    posts.forEach(p => {
      const row = [
        p.platform, p.type, p.date, p.link,
        p.views, p.likes, p.comments, p.saves, p.shares,
        (p.tags || []).join(', '),
      ].map(csvCell).join(',');
      lines.push(row);
    });
    return lines.join('\n');
  }

  function csvCell(v) {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ============================================================
  // BLOCO 2 — FILTRAGEM, AGREGAÇÕES E DETECÇÃO DE PADRÃO
  // ============================================================

  // Aplica os filtros ativos do painel: plataforma + janela.
  // Range "all" devolve tudo. Datas são comparadas como strings ISO
  // (YYYY-MM-DD), o que ordena/compara naturalmente.
  function filterPosts(posts, opts) {
    const { platform, days } = opts;
    const cutoff = (days === 'all' || !days) ? null : isoNDaysAgo(parseInt(days, 10));
    return posts.filter(p => {
      if (platform && platform !== 'all' && p.platform !== platform) return false;
      if (cutoff && p.date < cutoff) return false;
      return true;
    });
  }

  // Posts do período anterior (mesma duração do filtro atual). Usado
  // pra comparativo "vs período anterior" nos KPIs.
  function priorPeriodPosts(posts, opts) {
    const { platform, days } = opts;
    if (!days || days === 'all') return [];
    const n = parseInt(days, 10);
    const start = isoNDaysAgo(n * 2);
    const end   = isoNDaysAgo(n);
    return posts.filter(p => {
      if (platform && platform !== 'all' && p.platform !== platform) return false;
      return p.date >= start && p.date < end;
    });
  }

  // Estatísticas globais sobre uma lista de posts.
  function aggregate(posts) {
    if (!posts.length) {
      return { posts: 0, views: 0, eng: 0, engAvg: 0, rate: 0,
               likes: 0, comments: 0, saves: 0, shares: 0 };
    }
    const views    = sum(posts.map(p => p.views));
    const likes    = sum(posts.map(p => p.likes));
    const comments = sum(posts.map(p => p.comments));
    const saves    = sum(posts.map(p => p.saves));
    const shares   = sum(posts.map(p => p.shares));
    const eng      = likes + comments + saves + shares;
    return {
      posts:    posts.length,
      views, likes, comments, saves, shares, eng,
      engAvg:   eng / posts.length,
      rate:     views > 0 ? (eng / views) * 100 : 0,
    };
  }

  // Quebra os posts por plataforma e devolve um agregado por uma.
  function aggregateByPlatform(posts) {
    const out = {};
    Object.keys(PLATFORM_LABEL).forEach(p => { out[p] = []; });
    posts.forEach(p => { if (out[p.platform]) out[p.platform].push(p); });
    const result = {};
    Object.keys(out).forEach(k => { result[k] = aggregate(out[k]); });
    return result;
  }

  // Quebra por tipo de conteúdo (Reel/Story/Feed/Carrossel/Vídeo).
  function aggregateByType(posts) {
    const buckets = {};
    Object.keys(TYPE_LABEL).forEach(t => { buckets[t] = []; });
    posts.forEach(p => { if (buckets[p.type]) buckets[p.type].push(p); });
    return Object.keys(buckets).map(t => ({
      type:  t,
      label: TYPE_LABEL[t],
      ...aggregate(buckets[t]),
      savesAvg:  buckets[t].length ? sum(buckets[t].map(p => p.saves))  / buckets[t].length : 0,
      sharesAvg: buckets[t].length ? sum(buckets[t].map(p => p.shares)) / buckets[t].length : 0,
      viewsAvg:  buckets[t].length ? sum(buckets[t].map(p => p.views))  / buckets[t].length : 0,
    }));
  }

  // -----------------------------------------------------------
  // DETECÇÃO DE PADRÃO
  // Procura combinações (tag, par de tags, tipo, plataforma+tipo)
  // que performam significativamente acima ou abaixo da média.
  // Retorna lista ordenada por força do desvio.
  // -----------------------------------------------------------
  function detectPatterns(posts) {
    const patterns = [];
    if (posts.length < PATTERN.MIN_SAMPLE) return patterns;

    const globalRate = avg(posts.map(engRate));
    const globalEng  = avg(posts.map(engagement));

    // 1) Tags individuais — cada tag com 2+ posts vira candidato.
    const tagBuckets = {};
    posts.forEach(p => {
      (p.tags || []).forEach(t => {
        if (!tagBuckets[t]) tagBuckets[t] = [];
        tagBuckets[t].push(p);
      });
    });
    Object.keys(tagBuckets).forEach(tag => {
      const bucket = tagBuckets[tag];
      if (bucket.length < PATTERN.MIN_SAMPLE) return;
      const rate = avg(bucket.map(engRate));
      const mult = globalRate > 0 ? rate / globalRate : 0;
      patterns.push({
        kind: 'tag', key: tag, label: tag,
        sample: bucket.length, rate, globalRate,
        multiplier: mult,
        topType: dominantType(bucket),
        topPlatform: dominantPlatform(bucket),
        sense: mult >= PATTERN.WIN_MULTIPLIER ? 'win'
             : mult <= PATTERN.LOSE_MULTIPLIER ? 'lose' : 'neutral',
      });
    });

    // 2) Pares de tags — combinações que aparecem juntas em 2+ posts.
    const pairBuckets = {};
    posts.forEach(p => {
      const tags = (p.tags || []).slice().sort();
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const key = tags[i] + ' + ' + tags[j];
          if (!pairBuckets[key]) pairBuckets[key] = { tags: [tags[i], tags[j]], posts: [] };
          pairBuckets[key].posts.push(p);
        }
      }
    });
    Object.keys(pairBuckets).forEach(key => {
      const bucket = pairBuckets[key];
      if (bucket.posts.length < PATTERN.MIN_SAMPLE) return;
      const rate = avg(bucket.posts.map(engRate));
      const mult = globalRate > 0 ? rate / globalRate : 0;
      patterns.push({
        kind: 'tag-pair', key, label: key, tags: bucket.tags,
        sample: bucket.posts.length, rate, globalRate,
        multiplier: mult,
        topType: dominantType(bucket.posts),
        topPlatform: dominantPlatform(bucket.posts),
        sense: mult >= PATTERN.WIN_MULTIPLIER ? 'win'
             : mult <= PATTERN.LOSE_MULTIPLIER ? 'lose' : 'neutral',
      });
    });

    // 3) Combinações (plataforma, tipo) — onde cada formato roda melhor.
    const ptBuckets = {};
    posts.forEach(p => {
      const k = p.platform + '|' + p.type;
      if (!ptBuckets[k]) ptBuckets[k] = [];
      ptBuckets[k].push(p);
    });
    Object.keys(ptBuckets).forEach(k => {
      const bucket = ptBuckets[k];
      if (bucket.length < PATTERN.MIN_SAMPLE) return;
      const rate = avg(bucket.map(engRate));
      const mult = globalRate > 0 ? rate / globalRate : 0;
      const [platform, type] = k.split('|');
      patterns.push({
        kind: 'platform-type', key: k,
        label: TYPE_LABEL[type] + ' no ' + PLATFORM_LABEL[platform],
        platform, type,
        sample: bucket.length, rate, globalRate,
        multiplier: mult,
        sense: mult >= PATTERN.WIN_MULTIPLIER ? 'win'
             : mult <= PATTERN.LOSE_MULTIPLIER ? 'lose' : 'neutral',
      });
    });

    // 4) Especialidade por métrica: cada tipo é forte em algo
    //    (carrossel = saves, reel = views, etc). Detecta o tipo
    //    com maior média em cada métrica, comparado ao restante.
    const byType = aggregateByType(posts);
    const metrics = [
      { key: 'saves',  label: 'saves',  field: 'savesAvg'  },
      { key: 'shares', label: 'shares', field: 'sharesAvg' },
      { key: 'views',  label: 'alcance', field: 'viewsAvg' },
    ];
    metrics.forEach(m => {
      const ranked = byType
        .filter(t => t.posts >= PATTERN.MIN_SAMPLE)
        .sort((a, b) => b[m.field] - a[m.field]);
      if (ranked.length < 2) return;
      const top = ranked[0];
      const restAvg = avg(ranked.slice(1).map(r => r[m.field]));
      if (restAvg <= 0) return;
      const mult = top[m.field] / restAvg;
      if (mult < 1.4) return;
      patterns.push({
        kind: 'metric-strength', key: 'strength-' + m.key + '-' + top.type,
        label: top.label + ' lidera em ' + m.label,
        type: top.type, metric: m.label,
        sample: top.posts,
        topValue: top[m.field], restValue: restAvg,
        multiplier: mult,
        // weakSpot: campo onde esse mesmo tipo é pior que a média
        weakSpot: weakestMetric(top, ranked.slice(1)),
        sense: 'strength',
      });
    });

    // Ordena por força do desvio (mais útil primeiro).
    patterns.sort((a, b) => {
      const sa = Math.abs(Math.log((a.multiplier || 1)));
      const sb = Math.abs(Math.log((b.multiplier || 1)));
      return sb - sa;
    });
    return patterns;
  }

  function weakestMetric(target, others) {
    if (!others.length) return null;
    const fields = [
      { field: 'savesAvg',  label: 'saves'  },
      { field: 'sharesAvg', label: 'shares' },
      { field: 'viewsAvg',  label: 'alcance' },
    ];
    let worst = null;
    fields.forEach(f => {
      const restAvg = avg(others.map(o => o[f.field]));
      if (restAvg <= 0) return;
      const ratio = target[f.field] / restAvg;
      if (ratio < 0.7 && (!worst || ratio < worst.ratio)) {
        worst = { ...f, ratio };
      }
    });
    return worst;
  }

  function dominantType(posts) {
    const counts = {};
    posts.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
  }

  function dominantPlatform(posts) {
    const counts = {};
    posts.forEach(p => { counts[p.platform] = (counts[p.platform] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
  }


  // ============================================================
  // BLOCO 3 — INSIGHTS E IDEIAS
  // Transforma padrões frios em frases curtas e acionáveis.
  // ============================================================

  function generateInsights(patterns, posts) {
    const out = [];
    if (!posts.length) return out;

    // a) Padrões vencedores (até 3 mais fortes)
    const wins = patterns.filter(p => p.sense === 'win').slice(0, 3);
    wins.forEach(p => {
      let body;
      if (p.kind === 'tag-pair') {
        const fmt = p.topType ? TYPE_LABEL[p.topType] + 's' : 'Posts';
        body = `Seus <strong>${escapeHTML(fmt)} com ${escapeHTML(p.label)}</strong> performam ${p.multiplier.toFixed(1)}x melhor que a média.`;
      } else if (p.kind === 'tag') {
        const fmt = p.topType ? TYPE_LABEL[p.topType] + 's' : 'Posts';
        body = `Conteúdo com a tag <strong>"${escapeHTML(p.label)}"</strong> (${escapeHTML(fmt.toLowerCase())}) está ${p.multiplier.toFixed(1)}x acima da média.`;
      } else if (p.kind === 'platform-type') {
        body = `<strong>${escapeHTML(p.label)}</strong> performa ${p.multiplier.toFixed(1)}x melhor que a média geral — escala esse formato.`;
      } else {
        return;
      }
      out.push({
        kind: 'win',
        icon: '↑',
        html: body,
        meta: `${p.sample} posts · taxa de eng. ${fmtPct(p.rate)} vs ${fmtPct(p.globalRate)} geral`,
      });
    });

    // b) Forças por métrica (carrossel = saves, reel = views, etc)
    patterns.filter(p => p.sense === 'strength').slice(0, 2).forEach(p => {
      let body = `<strong>${escapeHTML(TYPE_LABEL[p.type])}s</strong> geram ${p.multiplier.toFixed(1)}x mais ${escapeHTML(p.metric)} que outros formatos.`;
      if (p.weakSpot) {
        body += ` Em compensação, têm menos ${escapeHTML(p.weakSpot.label)} (${(p.weakSpot.ratio * 100).toFixed(0)}% da média).`;
      }
      out.push({
        kind: 'watch', icon: '◆', html: body,
        meta: `${p.sample} posts analisados`,
      });
    });

    // c) Padrões perdedores
    const losses = patterns.filter(p => p.sense === 'lose').slice(0, 2);
    losses.forEach(p => {
      let body;
      if (p.kind === 'platform-type') {
        body = `<strong>${escapeHTML(p.label)}</strong> está ${(1 / p.multiplier).toFixed(1)}x abaixo da média — diagnostique ou pause.`;
      } else if (p.kind === 'tag' || p.kind === 'tag-pair') {
        body = `Conteúdo com <strong>"${escapeHTML(p.label)}"</strong> está abaixo da média (${fmtPct(p.rate)} de eng. vs ${fmtPct(p.globalRate)}).`;
      } else {
        return;
      }
      out.push({
        kind: 'alert', icon: '↓', html: body,
        meta: `${p.sample} posts`,
      });
    });

    // d) Diagnóstico específico de Stories — alcance baixo é
    //    sintoma típico de gancho fraco nos primeiros segundos.
    const stories = posts.filter(p => p.type === 'story');
    const others  = posts.filter(p => p.type !== 'story');
    if (stories.length >= PATTERN.MIN_SAMPLE && others.length >= PATTERN.MIN_SAMPLE) {
      const sAvg = avg(stories.map(p => p.views));
      const oAvg = avg(others.map(p => p.views));
      if (oAvg > 0 && sAvg / oAvg < 0.7) {
        out.push({
          kind: 'watch', icon: '◆',
          html: `Stories têm <strong>baixa retenção</strong> — alcance médio ${fmtNum(sAvg)} vs ${fmtNum(oAvg)} dos outros formatos. Revise o gancho dos 2 primeiros segundos.`,
          meta: `${stories.length} stories analisados`,
        });
      }
    }

    return out;
  }

  // -----------------------------------------------------------
  // GERAÇÃO DE IDEIAS
  // Pega os padrões vencedores e templatiza como conteúdo
  // executável (formato + gancho + direção). Lógica rules-based:
  // pronta pra ganhar uma camada de IA por cima sem refazer nada.
  // -----------------------------------------------------------
  const FORMAT_TEMPLATES = {
    reel: {
      label: 'Reel',
      hook: 'Cena curta nos primeiros 2s + 3 takes ritmados + payoff visual',
      exec: 'Vertical 9:16, 15-30s, sem locução robótica. Texto na tela curto. Música em alta nos 2 primeiros segundos.',
    },
    carrossel: {
      label: 'Carrossel',
      hook: 'Capa que prende ("O segredo de…") + 6 slides com 1 ideia cada',
      exec: '6-8 slides, 1080x1350, tipografia consistente. Último slide = CTA suave.',
    },
    story: {
      label: 'Stories',
      hook: '5 frames sequenciais com 1 enquete no meio',
      exec: 'Mistura foto + vídeo curto. Use sticker de pergunta e enquete pra forçar interação.',
    },
    feed: {
      label: 'Feed',
      hook: 'Foto editorial única + legenda em 3 atos (gancho / história / CTA)',
      exec: 'Imagem cinematográfica, paleta da marca. Legenda 4-6 linhas, sem hashtag spam.',
    },
    video: {
      label: 'Vídeo',
      hook: 'Mini-doc 60-90s com 1 personagem + 1 transformação visual',
      exec: 'Edição com B-roll, depoimento ao vivo, payoff emocional no fim.',
    },
  };

  function generateIdeas(patterns, posts) {
    if (!posts.length) return [];

    const ideas = [];
    const winning = patterns.filter(p => p.sense === 'win');
    const used = new Set();

    // Estratégia 1: pegar a combinação de tags vencedora mais forte.
    const topPair = winning.find(p => p.kind === 'tag-pair');
    if (topPair) {
      const fmt = topPair.topType || 'reel';
      ideas.push(buildIdea({
        format: fmt,
        platform: topPair.topPlatform,
        title: capitalize(topPair.tags[0]) + ' + ' + capitalize(topPair.tags[1]),
        hook: `Combine <strong>${escapeHTML(topPair.tags[0])}</strong> com <strong>${escapeHTML(topPair.tags[1])}</strong> — esse cruzamento performa ${topPair.multiplier.toFixed(1)}x melhor.`,
        rationale: `${topPair.sample} posts com essa combinação tiveram taxa de eng. ${fmtPct(topPair.rate)} vs ${fmtPct(topPair.globalRate)} da média.`,
      }));
      used.add(topPair.key);
    }

    // Estratégia 2: melhor par (plataforma, tipo).
    const topPT = winning.find(p => p.kind === 'platform-type' && !used.has(p.key));
    if (topPT) {
      const tagSeed = (winning.find(p => p.kind === 'tag') || {}).label || null;
      ideas.push(buildIdea({
        format: topPT.type,
        platform: topPT.platform,
        title: tagSeed
          ? `${TYPE_LABEL[topPT.type]} sobre "${capitalize(tagSeed)}" no ${PLATFORM_LABEL[topPT.platform]}`
          : `Aposta no ${TYPE_LABEL[topPT.type]} do ${PLATFORM_LABEL[topPT.platform]}`,
        hook: `<strong>${escapeHTML(TYPE_LABEL[topPT.type])} no ${escapeHTML(PLATFORM_LABEL[topPT.platform])}</strong> está ${topPT.multiplier.toFixed(1)}x acima da média geral.`,
        rationale: `Dobrar a frequência desse formato é a aposta mais segura agora — base de ${topPT.sample} posts.`,
      }));
      used.add(topPT.key);
    }

    // Estratégia 3: tag isolada vencedora.
    const topTag = winning.find(p => p.kind === 'tag' && !used.has(p.key));
    if (topTag) {
      const fmt = topTag.topType || 'reel';
      ideas.push(buildIdea({
        format: fmt,
        platform: topTag.topPlatform,
        title: `Aprofundar "${capitalize(topTag.label)}"`,
        hook: `Conteúdo com <strong>"${escapeHTML(topTag.label)}"</strong> está ${topTag.multiplier.toFixed(1)}x acima da média — vale produzir uma série.`,
        rationale: `${topTag.sample} posts com essa tag tiveram taxa ${fmtPct(topTag.rate)} de engajamento.`,
      }));
      used.add(topTag.key);
    }

    // Fallback: se ainda faltam ideias, sugere com base em força por
    // métrica (ex: "carrosséis lideram em saves — produza 1 esta semana")
    while (ideas.length < 3) {
      const strength = patterns.find(p => p.sense === 'strength' && !used.has(p.key));
      if (!strength) break;
      ideas.push(buildIdea({
        format: strength.type,
        platform: null,
        title: `Mais ${TYPE_LABEL[strength.type]} para ${strength.metric}`,
        hook: `Esse formato gera ${strength.multiplier.toFixed(1)}x mais <strong>${escapeHTML(strength.metric)}</strong> que os outros.`,
        rationale: `Bom uso pra ${strength.metric === 'saves' ? 'conteúdo educativo / útil' : strength.metric === 'shares' ? 'mensagem viral / opinião' : 'descoberta de marca'}.`,
      }));
      used.add(strength.key);
    }

    // Garante 3 ideias mesmo com poucos dados — usa formato com
    // mais volume na base como semente neutra.
    while (ideas.length < 3 && posts.length >= 2) {
      const counts = {};
      posts.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
      const fmt = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'reel';
      ideas.push(buildIdea({
        format: fmt,
        platform: null,
        title: `Teste novo ${TYPE_LABEL[fmt]}`,
        hook: 'Sem padrão claro ainda — produza 1 post controlado pra alimentar a base.',
        rationale: 'Adicione tags claras para o sistema cruzar dados na próxima rodada.',
      }));
      break;
    }

    return ideas.slice(0, 3);
  }

  function buildIdea({ format, platform, title, hook, rationale }) {
    const tpl = FORMAT_TEMPLATES[format] || FORMAT_TEMPLATES.reel;
    return {
      format, platform,
      formatLabel: tpl.label,
      title,
      hook,
      exec: tpl.hook + ' · ' + tpl.exec,
      rationale,
    };
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }


  // ============================================================
  // BLOCO 4 — RENDER
  // Cada renderX recebe os dados já processados e atualiza apenas
  // a sua seção do DOM. Sem fetch, sem cálculo aqui — só pintura.
  // ============================================================

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function applyDelta(elId, d, suffix = '') {
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.remove('social-kpi__delta--up', 'social-kpi__delta--down', 'social-kpi__delta--flat');
    if (!d || d.dir === 'flat') {
      el.classList.add('social-kpi__delta--flat');
      el.textContent = suffix || 'estável';
      return;
    }
    el.classList.add('social-kpi__delta--' + d.dir);
    el.textContent = fmtDelta(d) + (suffix ? ' · ' + suffix : '');
  }

  // KPIs principais
  function renderKPIs(curr, prev, hasPrior) {
    setText('social-kpi-posts', curr.posts ? String(curr.posts) : '0');
    setText('social-kpi-reach', fmtNum(curr.views));
    setText('social-kpi-eng',   fmtNum(curr.engAvg));
    setText('social-kpi-rate',  fmtPct(curr.rate));

    if (hasPrior && prev) {
      applyDelta('social-kpi-posts-delta', delta(curr.posts, prev.posts));
      applyDelta('social-kpi-reach-delta', delta(curr.views, prev.views));
      applyDelta('social-kpi-eng-delta',   delta(curr.engAvg, prev.engAvg), 'eng. médio por post');
      applyDelta('social-kpi-rate-delta',  delta(curr.rate, prev.rate),     'taxa de engajamento');
    } else {
      setText('social-kpi-posts-delta', 'sem comparativo');
      setText('social-kpi-reach-delta', 'sem comparativo');
      setText('social-kpi-eng-delta',   'eng. médio por post');
      setText('social-kpi-rate-delta',  'eng / visualizações');
    }
  }

  // Insights (frases) — quando vazio mostra estado neutro.
  function renderInsights(items) {
    const root = document.getElementById('social-insights');
    if (!root) return;
    if (!items.length) {
      root.innerHTML = '<p class="social-insights__empty">Sem padrões claros ainda — adicione mais posts pra o sistema cruzar dados.</p>';
      return;
    }
    root.innerHTML = items.map(it => `
      <div class="social-insight social-insight--${escapeHTML(it.kind)}">
        <div class="social-insight__icon">${escapeHTML(it.icon)}</div>
        <div class="social-insight__body">
          ${it.html}
          <div class="social-insight__meta">${escapeHTML(it.meta || '')}</div>
        </div>
      </div>
    `).join('');
  }

  // Top 3 ideias
  function renderIdeas(items) {
    const root = document.getElementById('social-ideas');
    if (!root) return;
    if (!items.length) {
      root.innerHTML = '<p class="social-ideas__empty">Adicione mais posts (com tags) pra o sistema sugerir ideias.</p>';
      return;
    }
    root.innerHTML = items.map((idea, i) => `
      <div class="social-idea">
        <div class="social-idea__head">
          <span class="social-idea__num">${i + 1}</span>
          <span class="social-idea__format">${escapeHTML(idea.formatLabel)}${idea.platform ? ' · ' + escapeHTML(PLATFORM_LABEL[idea.platform] || '') : ''}</span>
        </div>
        <h3 class="social-idea__title">${escapeHTML(idea.title)}</h3>
        <p class="social-idea__hook"><strong>Gancho:</strong> ${idea.hook}</p>
        <p class="social-idea__exec"><strong>Execução:</strong> ${escapeHTML(idea.exec)}</p>
        <p class="social-idea__rationale">${escapeHTML(idea.rationale)}</p>
      </div>
    `).join('');
  }

  // Performance por plataforma — card por plataforma, com badge
  // mostrando se subiu/caiu vs período anterior.
  function renderPlatforms(currByPlatform, prevByPlatform, hasPrior) {
    const root = document.getElementById('social-platforms');
    if (!root) return;
    const keys = Object.keys(PLATFORM_LABEL);
    const cards = keys.map(k => {
      const c = currByPlatform[k];
      const p = prevByPlatform[k];
      if (!c.posts) return '';
      const d = hasPrior && p ? delta(c.eng, p.eng) : null;
      const badgeCls = d ? 'social-platform__badge--' + d.dir : 'social-platform__badge--flat';
      const badgeTxt = d ? fmtDelta(d) : 'novo';
      return `
        <div class="social-platform">
          <div class="social-platform__head">
            <span class="social-platform__name">${escapeHTML(PLATFORM_LABEL[k])}</span>
            <span class="social-platform__badge ${badgeCls}">${escapeHTML(badgeTxt)}</span>
          </div>
          <div class="social-platform__row"><span>Posts</span><span>${c.posts}</span></div>
          <div class="social-platform__row"><span>Alcance</span><span>${fmtNum(c.views)}</span></div>
          <div class="social-platform__row"><span>Engajamento</span><span>${fmtNum(c.eng)}</span></div>
          <div class="social-platform__row"><span>Taxa de eng.</span><span>${fmtPct(c.rate)}</span></div>
        </div>
      `;
    }).filter(Boolean).join('');
    root.innerHTML = cards || '<p class="social-section__empty">Sem dados.</p>';
  }

  // Tabela de performance por tipo de conteúdo.
  function renderTypes(rows) {
    const tbody = document.getElementById('social-types-body');
    if (!tbody) return;
    const visible = rows.filter(r => r.posts > 0);
    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin__table-empty">Sem dados.</td></tr>';
      return;
    }
    tbody.innerHTML = visible.map(r => `
      <tr>
        <td><strong>${escapeHTML(r.label)}</strong></td>
        <td class="social-num">${r.posts}</td>
        <td class="social-num">${fmtNum(r.viewsAvg)}</td>
        <td class="social-num">${fmtNum(r.engAvg)}</td>
        <td class="social-num">${fmtPct(r.rate)}</td>
        <td class="social-num">${fmtNum(r.savesAvg)}</td>
        <td class="social-num">${fmtNum(r.sharesAvg)}</td>
      </tr>
    `).join('');
  }


  // -----------------------------------------------------------
  // GRÁFICO DE EVOLUÇÃO (Chart.js)
  // -----------------------------------------------------------
  let _chart = null;

  function renderEvolution(posts, range) {
    const canvas = document.getElementById('social-chart-evolution');
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      // Chart.js carrega via defer no admin.html. Reagenda.
      setTimeout(() => renderEvolution(posts, range), 300);
      return;
    }
    if (_chart) { _chart.destroy(); _chart = null; }

    // Janela total: usa o range (em dias) ou o intervalo coberto pelos posts.
    let days = (range && range !== 'all') ? parseInt(range, 10) : 30;
    if (range === 'all' && posts.length) {
      const dates = posts.map(p => p.date).sort();
      days = Math.max(7, daysBetween(dates[0], todayISO()) + 1);
    }

    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const iso = isoNDaysAgo(i);
      buckets.push({ iso, eng: 0, views: 0 });
    }
    const idx = {};
    buckets.forEach((b, i) => { idx[b.iso] = i; });
    posts.forEach(p => {
      if (idx[p.date] != null) {
        const b = buckets[idx[p.date]];
        b.eng   += engagement(p);
        b.views += p.views || 0;
      }
    });

    const labels = buckets.map(b => fmtDateBR(b.iso));
    const eng    = buckets.map(b => b.eng);
    const views  = buckets.map(b => b.views);

    _chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Engajamento', data: eng,
            borderColor: '#C97D6F',
            backgroundColor: 'rgba(201,125,111,0.14)',
            fill: true, tension: 0.35, yAxisID: 'y',
            pointRadius: 2, pointHoverRadius: 5, borderWidth: 2.5,
          },
          {
            label: 'Visualizações', data: views,
            borderColor: '#5C2426',
            backgroundColor: 'rgba(92,36,38,0)',
            fill: false, tension: 0.35, yAxisID: 'y2',
            pointRadius: 2, pointHoverRadius: 5, borderDash: [5, 4], borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: ctx => ' ' + ctx.dataset.label + ': ' + fmtNum(ctx.parsed.y),
            },
          },
        },
        scales: {
          y:  { beginAtZero: true, ticks: { callback: v => fmtNum(v) }, grid: { color: '#f3f3f3' } },
          y2: { beginAtZero: true, position: 'right', ticks: { callback: v => fmtNum(v) }, grid: { display: false } },
          x:  { ticks: { maxTicksLimit: 10, autoSkip: true }, grid: { display: false } },
        },
      },
    });
  }

  // -----------------------------------------------------------
  // TOP / PIORES POSTS
  // -----------------------------------------------------------
  function rankPosts(posts) {
    return posts
      .slice()
      .map(p => ({ post: p, eng: engagement(p), rate: engRate(p) }))
      .sort((a, b) => b.eng - a.eng);
  }

  function renderTopPosts(posts) {
    const root = document.getElementById('social-top-posts');
    if (!root) return;
    const ranked = rankPosts(posts).slice(0, 5);
    if (!ranked.length) {
      root.innerHTML = '<p class="social-section__empty">Sem dados.</p>';
      return;
    }
    root.innerHTML = ranked.map(r => renderRankItem(r)).join('');
  }

  function renderWorstPosts(posts) {
    const root = document.getElementById('social-worst-posts');
    if (!root) return;
    const ranked = rankPosts(posts).filter(r => r.post.views > 0).reverse().slice(0, 5);
    if (!ranked.length) {
      root.innerHTML = '<p class="social-section__empty">Sem dados.</p>';
      return;
    }
    root.innerHTML = ranked.map(r => renderRankItem(r)).join('');
  }

  function renderRankItem({ post, eng, rate }) {
    const tagsHTML = (post.tags || []).slice(0, 3)
      .map(t => `<span class="social-tag">${escapeHTML(t)}</span>`).join('');
    return `
      <div class="social-rank-item">
        <div class="social-rank-item__head">
          <span class="social-rank-item__platform social-rank-item__platform--${escapeHTML(post.platform)}">${escapeHTML(PLATFORM_LABEL[post.platform])}</span>
          <span class="social-rank-item__type">${escapeHTML(TYPE_LABEL[post.type])}</span>
        </div>
        <div class="social-rank-item__metrics">
          <span><b>${fmtNum(eng)}</b> eng.</span>
          <span><b>${fmtNum(post.views)}</b> views</span>
          <span><b>${fmtPct(rate)}</b> taxa</span>
        </div>
        <div class="social-rank-item__date">${fmtDateBR(post.date)}${tagsHTML ? ' · ' + tagsHTML : ''}</div>
      </div>
    `;
  }

  // -----------------------------------------------------------
  // SEMANA ATUAL VS ANTERIOR
  // -----------------------------------------------------------
  function renderWoW(allPosts) {
    const root = document.getElementById('social-wow');
    if (!root) return;

    const thisStart = isoNDaysAgo(7);
    const lastStart = isoNDaysAgo(14);
    const lastEnd   = thisStart;

    const thisWeek = allPosts.filter(p => p.date >= thisStart);
    const lastWeek = allPosts.filter(p => p.date >= lastStart && p.date < lastEnd);

    const tw = aggregate(thisWeek);
    const lw = aggregate(lastWeek);

    if (!tw.posts && !lw.posts) {
      root.innerHTML = '<p class="social-section__empty">Sem dados nas últimas 2 semanas.</p>';
      return;
    }

    const items = [
      { label: 'Posts',           cur: tw.posts,  prev: lw.posts,  fmt: v => String(v) },
      { label: 'Alcance',         cur: tw.views,  prev: lw.views,  fmt: fmtNum },
      { label: 'Engajamento',     cur: tw.eng,    prev: lw.eng,    fmt: fmtNum },
      { label: 'Taxa de eng.',    cur: tw.rate,   prev: lw.rate,   fmt: v => fmtPct(v) },
    ];

    root.innerHTML = items.map(it => {
      const d = delta(it.cur, it.prev);
      const cls = 'social-kpi__delta--' + d.dir;
      return `
        <div class="social-wow-item">
          <div class="social-wow-item__label">${escapeHTML(it.label)}</div>
          <div class="social-wow-item__value">${it.fmt(it.cur)}</div>
          <div class="social-wow-item__delta ${cls}">${fmtDelta(d)} vs sem. anterior (${it.fmt(it.prev)})</div>
        </div>
      `;
    }).join('');
  }

  // -----------------------------------------------------------
  // TABELA DE TODOS OS POSTS (com edição inline via modal)
  // -----------------------------------------------------------
  function renderPostsTable(posts) {
    const tbody = document.getElementById('social-posts-body');
    if (!tbody) return;
    if (!posts.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="admin__table-empty">Sem posts.</td></tr>';
      return;
    }
    const sorted = posts.slice().sort((a, b) => b.date.localeCompare(a.date));
    tbody.innerHTML = sorted.map(p => {
      const tagsHTML = (p.tags || []).slice(0, 4)
        .map(t => `<span class="social-tag">${escapeHTML(t)}</span>`).join('');
      return `
        <tr>
          <td>${fmtDateBR(p.date)}</td>
          <td>${escapeHTML(PLATFORM_LABEL[p.platform])}</td>
          <td>${escapeHTML(TYPE_LABEL[p.type])}</td>
          <td>${tagsHTML || '<span style="color:#bbb;">—</span>'}</td>
          <td class="social-num">${fmtNum(p.views)}</td>
          <td class="social-num">${fmtNum(p.likes)}</td>
          <td class="social-num">${fmtNum(p.comments)}</td>
          <td class="social-num">${fmtNum(p.saves)}</td>
          <td class="social-num">${fmtNum(p.shares)}</td>
          <td class="social-num">${fmtNum(engagement(p))}</td>
          <td>
            <button type="button" class="admin__add-btn admin__add-btn--ghost" data-edit-post="${escapeHTML(p.id)}" style="padding:4px 10px;font-size:.75rem;">Editar</button>
          </td>
        </tr>
      `;
    }).join('');

    // Wire dos botões de edição.
    tbody.querySelectorAll('[data-edit-post]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-post');
        const post = loadPosts().find(p => p.id === id);
        if (post) openModal(post);
      });
    });
  }

  // ============================================================
  // BLOCO 5 — UI / MODAL / IO / INIT
  // ============================================================

  // -----------------------------------------------------------
  // MODAL: novo / editar post
  // -----------------------------------------------------------
  function openModal(post) {
    const modal = document.getElementById('social-modal');
    if (!modal) return;
    const isEdit = !!(post && post.id);
    document.getElementById('social-modal-title').textContent = isEdit ? 'Editar post' : 'Novo post';
    document.getElementById('social-form-id').value        = isEdit ? post.id : '';
    document.getElementById('social-form-platform').value  = (post && post.platform) || 'instagram';
    document.getElementById('social-form-type').value      = (post && post.type) || 'reel';
    document.getElementById('social-form-date').value      = (post && post.date) || todayISO();
    document.getElementById('social-form-link').value      = (post && post.link) || '';
    document.getElementById('social-form-tags').value      = post && post.tags ? post.tags.join(', ') : '';
    document.getElementById('social-form-views').value     = (post && post.views)    || 0;
    document.getElementById('social-form-likes').value     = (post && post.likes)    || 0;
    document.getElementById('social-form-comments').value  = (post && post.comments) || 0;
    document.getElementById('social-form-saves').value     = (post && post.saves)    || 0;
    document.getElementById('social-form-shares').value    = (post && post.shares)   || 0;

    const delBtn = document.getElementById('social-form-delete');
    if (delBtn) delBtn.style.display = isEdit ? 'inline-block' : 'none';

    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('social-modal');
    if (modal) modal.style.display = 'none';
  }

  function readModalForm() {
    return normalizePost({
      id:       document.getElementById('social-form-id').value || null,
      platform: document.getElementById('social-form-platform').value,
      type:     document.getElementById('social-form-type').value,
      date:     document.getElementById('social-form-date').value,
      link:     document.getElementById('social-form-link').value.trim(),
      tags:     document.getElementById('social-form-tags').value,
      views:    document.getElementById('social-form-views').value,
      likes:    document.getElementById('social-form-likes').value,
      comments: document.getElementById('social-form-comments').value,
      saves:    document.getElementById('social-form-saves').value,
      shares:   document.getElementById('social-form-shares').value,
    });
  }

  // -----------------------------------------------------------
  // SAMPLE DATA — pra dar ao usuário uma base instantânea
  // de exploração. ~14 posts com padrões plantados pra
  // exercitar a detecção (combinação "comida + bairro" forte,
  // stories com baixo alcance, carrosséis com saves altos).
  // -----------------------------------------------------------
  function buildSampleData() {
    const today = new Date();
    const iso = (d) => {
      const x = new Date(today);
      x.setDate(x.getDate() - d);
      return x.toISOString().slice(0, 10);
    };
    return [
      // Reels Instagram com "comida + bairro" — padrão vencedor
      { platform:'instagram', type:'reel', date:iso(2),  link:'',
        tags:['comida','vila madalena','presente'],
        views:18400, likes:1320, comments:84, saves:210, shares:96 },
      { platform:'instagram', type:'reel', date:iso(8),  link:'',
        tags:['comida','pinheiros'],
        views:14200, likes:980, comments:71, saves:188, shares:74 },
      { platform:'instagram', type:'reel', date:iso(15), link:'',
        tags:['comida','jardins','curadoria'],
        views:21300, likes:1610, comments:102, saves:244, shares:120 },
      // Reels Instagram sem combinação vencedora — performance média
      { platform:'instagram', type:'reel', date:iso(5),  link:'',
        tags:['ceramica','workshop'],
        views:6200, likes:320, comments:14, saves:42, shares:11 },
      { platform:'instagram', type:'reel', date:iso(20), link:'',
        tags:['mae','presente'],
        views:7400, likes:380, comments:18, saves:51, shares:16 },
      // Carrosséis — fortes em saves, fracos em alcance
      { platform:'instagram', type:'carrossel', date:iso(4),  link:'',
        tags:['curadoria','presente'],
        views:3800, likes:240, comments:12, saves:340, shares:22 },
      { platform:'instagram', type:'carrossel', date:iso(11), link:'',
        tags:['mae','curadoria'],
        views:4100, likes:280, comments:15, saves:402, shares:28 },
      { platform:'instagram', type:'carrossel', date:iso(22), link:'',
        tags:['gastronomia','presente'],
        views:3500, likes:210, comments:9,  saves:288, shares:18 },
      // Stories — baixa retenção
      { platform:'instagram', type:'story', date:iso(3),  link:'',
        tags:['bastidores'], views:2100, likes:64,  comments:3,  saves:8,  shares:5 },
      { platform:'instagram', type:'story', date:iso(10), link:'',
        tags:['bastidores'], views:1880, likes:51,  comments:2,  saves:6,  shares:3 },
      { platform:'instagram', type:'story', date:iso(17), link:'',
        tags:['enquete'],    views:2350, likes:72,  comments:5,  saves:11, shares:7 },
      // TikTok — ainda calibrando
      { platform:'tiktok',    type:'reel', date:iso(6),  link:'',
        tags:['comida','reacao'],
        views:24100, likes:1820, comments:120, saves:140, shares:280 },
      { platform:'tiktok',    type:'video', date:iso(13), link:'',
        tags:['depoimento','mae'],
        views:9200, likes:520, comments:38, saves:48, shares:62 },
      // LinkedIn — formato institucional
      { platform:'linkedin',  type:'feed', date:iso(7),  link:'',
        tags:['curadoria','b2b'],
        views:4800, likes:140, comments:22, saves:18, shares:34 },
      { platform:'linkedin',  type:'carrossel', date:iso(18), link:'',
        tags:['curadoria','case'],
        views:5200, likes:172, comments:28, saves:44, shares:48 },
    ].map(normalizePost).filter(Boolean);
  }

  function loadSampleData() {
    const existing = loadPosts();
    if (existing.length) {
      const ok = confirm('Isso vai substituir os ' + existing.length + ' posts que já estão salvos. Continuar?');
      if (!ok) return;
    }
    savePosts(buildSampleData());
    render();
  }

  // -----------------------------------------------------------
  // CSV IMPORT
  // -----------------------------------------------------------
  function handleCSVImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const incoming = parseCSV(text);
      if (!incoming.length) {
        alert('Nenhum post válido encontrado no CSV. Verifique o cabeçalho:\n\nplatform,type,date,link,views,likes,comments,saves,shares,tags');
        return;
      }
      const existing = loadPosts();
      // Dedupe simples por (platform + date + link). Se já existe,
      // atualiza; senão, insere novo.
      const keyOf = p => p.platform + '|' + p.date + '|' + (p.link || '');
      const map = {};
      existing.forEach(p => { map[keyOf(p)] = p; });
      let added = 0, updated = 0;
      incoming.forEach(p => {
        const k = keyOf(p);
        if (map[k]) { p.id = map[k].id; map[k] = p; updated++; }
        else        { map[k] = p; added++; }
      });
      savePosts(Object.values(map));
      alert(`Importação concluída: ${added} novos, ${updated} atualizados.`);
      render();
    };
    reader.onerror = () => alert('Erro ao ler o arquivo.');
    reader.readAsText(file, 'utf-8');
  }

  // -----------------------------------------------------------
  // BIND DE EVENTOS — chamado uma única vez no init()
  // -----------------------------------------------------------
  let _bound = false;
  function bindUI() {
    if (_bound) return;
    _bound = true;

    // Filtros
    const platformSel = document.getElementById('social-platform');
    const rangeSel    = document.getElementById('social-range');
    if (platformSel) platformSel.addEventListener('change', render);
    if (rangeSel)    rangeSel.addEventListener('change', render);

    // Botões da toolbar
    const addBtn = document.getElementById('btn-social-add');
    if (addBtn) addBtn.addEventListener('click', () => openModal(null));

    const exportBtn = document.getElementById('btn-social-export');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      const posts = loadPosts();
      if (!posts.length) { alert('Sem posts para exportar.'); return; }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile('elarah-social-' + stamp + '.csv', toCSV(posts));
    });

    const importBtn   = document.getElementById('btn-social-import');
    const csvInput    = document.getElementById('social-csv-input');
    if (importBtn && csvInput) {
      importBtn.addEventListener('click', () => csvInput.click());
      csvInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        handleCSVImport(file);
        csvInput.value = '';
      });
    }

    // Estado vazio: ações inline
    document.querySelectorAll('[data-social-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-social-action');
        if (action === 'add') openModal(null);
        else if (action === 'sample') loadSampleData();
      });
    });

    // Modal
    document.querySelectorAll('[data-social-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    const form = document.getElementById('social-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const post = readModalForm();
        if (!post) {
          alert('Preencha plataforma, tipo e data.');
          return;
        }
        upsertPost(post);
        closeModal();
        render();
      });
    }
    const delBtn = document.getElementById('social-form-delete');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        const id = document.getElementById('social-form-id').value;
        if (!id) return;
        if (!confirm('Excluir esse post permanentemente?')) return;
        deletePost(id);
        closeModal();
        render();
      });
    }
  }

  // -----------------------------------------------------------
  // RENDER PRINCIPAL
  // Lê os filtros, monta os agregados, distribui para os
  // renderers de cada seção. Ponto único de orquestração.
  // -----------------------------------------------------------
  async function render() {
    bindUI();

    const allPosts = loadPosts();
    const empty = document.getElementById('social-empty');
    const dash  = document.getElementById('social-dashboard');

    if (!allPosts.length) {
      if (empty) empty.style.display = 'block';
      if (dash)  dash.style.display = 'none';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (dash)  dash.style.display = 'block';

    const platform = (document.getElementById('social-platform') || {}).value || 'all';
    const range    = (document.getElementById('social-range') || {}).value    || '30';

    const curr = filterPosts(allPosts, { platform, days: range });
    const prev = priorPeriodPosts(allPosts, { platform, days: range });
    const hasPrior = (range !== 'all');

    const aggCurr = aggregate(curr);
    const aggPrev = aggregate(prev);

    renderKPIs(aggCurr, aggPrev, hasPrior);

    const patterns = detectPatterns(curr);
    renderInsights(generateInsights(patterns, curr));
    renderIdeas(generateIdeas(patterns, curr));

    // Pra o card "performance por plataforma" sempre fazemos uma
    // visão sem o filtro de plataforma — senão o card é redundante.
    const platformAgnosticCurr = filterPosts(allPosts, { platform: 'all', days: range });
    const platformAgnosticPrev = priorPeriodPosts(allPosts, { platform: 'all', days: range });
    renderPlatforms(
      aggregateByPlatform(platformAgnosticCurr),
      aggregateByPlatform(platformAgnosticPrev),
      hasPrior
    );

    renderTypes(aggregateByType(curr));
    renderEvolution(curr, range);
    renderTopPosts(curr);
    renderWorstPosts(curr);
    renderWoW(allPosts);
    renderPostsTable(allPosts);
  }

  // Bind também no DOMContentLoaded pra garantir os listeners
  // antes do usuário clicar na aba (caso a renderização da aba
  // seja preguiçosa).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUI);
  } else {
    bindUI();
  }

  window.ElarahSocial = { render, loadSampleData };

})();
