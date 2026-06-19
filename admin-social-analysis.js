/* =============================================================
   ELARAH — ANÁLISE ESTRATÉGICA DE INSTAGRAM (admin)

   Gera um diagnóstico completo do perfil seguindo o framework de
   10 seções (posicionamento, bio, conteúdo, engajamento, funil,
   concorrência, oportunidades, plano de ação, calendário editorial
   e resumo executivo).

   Responsabilidade:
   - Combinar dados QUANTITATIVOS (posts cadastrados na aba Redes
     Sociais, mesma chave localStorage do admin-social.js) com dados
     QUALITATIVOS da marca (bio, link, posicionamento, concorrentes)
     que o admin preenche num formulário.
   - Produzir um relatório acionável, exportável (imprimir / copiar).

   Decisões de design:
   - Rules-based e offline, igual ao admin-social.js: determinístico
     e auditável. Quando houver Graph API + LLM, dá pra plugar uma
     camada de IA por cima sem refazer o pipeline.
   - Lê os posts direto do localStorage (chave compartilhada) em vez
     de acoplar nas funções privadas do admin-social.js — mantém os
     dois módulos desacoplados.
   - O relatório aparece como overlay DENTRO do painel Redes Sociais
     (não cria nova aba no menu): esconde o dashboard, mostra o
     relatório, e volta no botão "← Voltar ao dashboard".

   Exposto em window.ElarahSocialAnalysis = { open, close, render }.
   ============================================================= */

(function () {
  'use strict';

  // -----------------------------------------------------------
  // CONSTANTES (espelham admin-social.js)
  // -----------------------------------------------------------
  const POSTS_KEY = 'elarah.social.posts.v1';
  const BRAND_KEY = 'elarah.social.brand.v1';

  const TYPE_LABEL = {
    reel: 'Reel', story: 'Story', feed: 'Feed',
    carrossel: 'Carrossel', video: 'Vídeo',
  };

  const PLATFORM_LABEL = { instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn' };
  const PLATFORM_EMOJI = { instagram: '📸', tiktok: '🎵', linkedin: '💼' };

  const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // -----------------------------------------------------------
  // STORAGE
  // -----------------------------------------------------------
  function loadPosts() {
    try {
      const raw = localStorage.getItem(POSTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(p => ({
        platform: String(p.platform || '').toLowerCase(),
        type: String(p.type || '').toLowerCase(),
        date: String(p.date || '').slice(0, 10),
        link: p.link || '',
        caption: p.caption || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        views: toInt(p.views), reach: toInt(p.reach),
        likes: toInt(p.likes), comments: toInt(p.comments),
        saves: toInt(p.saves), shares: toInt(p.shares),
        interactions: toInt(p.interactions),
        followers: toInt(p.followers), profileVisits: toInt(p.profileVisits),
        linkClicks: toInt(p.linkClicks), conversions: toInt(p.conversions),
        theme: p.theme || '', experience: p.experience || '', campaign: p.campaign || '',
      })).filter(p => p.date);
    } catch (e) {
      return [];
    }
  }

  function loadBrand() {
    try {
      const raw = localStorage.getItem(BRAND_KEY);
      if (!raw) return defaultBrand();
      const parsed = JSON.parse(raw);
      const def = defaultBrand();
      // Top-level defaults pra campos que não existirem ainda — sem
      // chamar Object.assign(def, parsed) pra não fazer shallow-merge
      // do byPlatform (perderia uma plataforma).
      Object.keys(def).forEach(k => {
        if (parsed[k] === undefined) parsed[k] = def[k];
      });
      if (!parsed.byPlatform || typeof parsed.byPlatform !== 'object') {
        parsed.byPlatform = def.byPlatform;
      } else {
        if (!parsed.byPlatform.instagram) parsed.byPlatform.instagram = def.byPlatform.instagram;
        if (!parsed.byPlatform.tiktok)    parsed.byPlatform.tiktok    = def.byPlatform.tiktok;
      }
      return migrateBrand(parsed);
    } catch (e) {
      return defaultBrand();
    }
  }

  function saveBrand(brand) {
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
    } catch (e) {
      alert('Não foi possível salvar o perfil da marca (armazenamento cheio ou bloqueado).');
    }
  }

  // Migra schema antigo (campos username/link/bio/destaques no topo) para
  // o novo (byPlatform). Os valores antigos viram do Instagram por padrão,
  // já que era a rede principal antes do split. Idempotente.
  function migrateBrand(brand) {
    if (!brand.byPlatform || typeof brand.byPlatform !== 'object') {
      brand.byPlatform = { instagram: {}, tiktok: {} };
    }
    if (!brand.byPlatform.instagram) brand.byPlatform.instagram = {};
    if (!brand.byPlatform.tiktok) brand.byPlatform.tiktok = {};
    const ig = brand.byPlatform.instagram;
    ['username', 'link', 'bio', 'destaques'].forEach(k => {
      if (brand[k] && !ig[k]) ig[k] = brand[k];
      delete brand[k];
    });
    delete brand.publico; // Agora é inferido — não pedimos mais.
    if (!brand.activePlatform) brand.activePlatform = 'instagram';
    return brand;
  }

  function defaultBrand() {
    return {
      nome: 'Elarah',
      temFoto: true,
      vende: 'Experiências e presentes memoráveis',
      proposta: '',
      concorrentes: '',
      activePlatform: 'instagram',
      byPlatform: {
        instagram: { username: '', link: '', bio: '', destaques: '' },
        tiktok:    { username: '', link: '', bio: '' },
      },
    };
  }

  // Achata o brand pra "view" de uma plataforma: campos globais +
  // campos da plataforma escolhida promovidos pro topo. Resto do
  // código consome brand.username/.link/.bio/.destaques sem saber
  // que houve split.
  function brandForPlatform(brand, platform) {
    const p = (platform === 'tiktok') ? 'tiktok' : 'instagram';
    const per = (brand.byPlatform && brand.byPlatform[p]) || {};
    return Object.assign({}, brand, {
      username:  per.username  || '',
      link:      per.link      || '',
      bio:       per.bio       || '',
      destaques: per.destaques || '',
      _platform: p,
    });
  }

  // -----------------------------------------------------------
  // HELPERS NUMÉRICOS
  // -----------------------------------------------------------
  function toInt(v) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; }
  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  function avg(arr) { return arr.length ? sum(arr) / arr.length : 0; }
  function engagement(p) {
    const b = p.likes + p.comments + p.saves + p.shares;
    return Math.max(b, p.interactions || 0);
  }
  // Alcance efetivo: prefere reach, cai pra views.
  function reachOf(p) { return (p.reach || 0) > 0 ? p.reach : (p.views || 0); }
  function engRate(p) { const r = reachOf(p); return r > 0 ? (engagement(p) / r) * 100 : 0; }

  // Taxonomia de ocasiões: usa a do admin-social.js (fonte única) com
  // fallback local pra robustez se o script ainda não carregou.
  function occasions() {
    return (window.ElarahSocial && window.ElarahSocial.OCCASIONS) || [];
  }
  function occasionLabel(key) {
    const map = (window.ElarahSocial && window.ElarahSocial.OCCASION_LABEL) || {};
    return map[key] || key;
  }
  function occasionEmoji(key) {
    const o = occasions().find(x => x.key === key);
    return o ? o.emoji : '🏷️';
  }
  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'k';
    return String(Math.round(n));
  }
  function fmtPct(n, d = 1) { return (n == null || isNaN(n)) ? '—' : n.toFixed(d) + '%'; }
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function splitList(s) {
    return String(s || '').split(/[,\n;]/).map(x => x.trim()).filter(Boolean);
  }
  function score10(n) { return Math.max(0, Math.min(10, Math.round(n))); }

  // -----------------------------------------------------------
  // AGREGAÇÕES SOBRE OS POSTS
  // -----------------------------------------------------------
  function aggregate(posts) {
    const views = sum(posts.map(p => p.views));
    const eng = sum(posts.map(engagement));
    return {
      n: posts.length, views, eng,
      likes: sum(posts.map(p => p.likes)),
      comments: sum(posts.map(p => p.comments)),
      saves: sum(posts.map(p => p.saves)),
      shares: sum(posts.map(p => p.shares)),
      engAvg: posts.length ? eng / posts.length : 0,
      rate: views > 0 ? (eng / views) * 100 : 0,
    };
  }

  function byType(posts) {
    const out = {};
    posts.forEach(p => { (out[p.type] = out[p.type] || []).push(p); });
    return Object.keys(out).map(t => ({
      type: t, label: TYPE_LABEL[t] || t, posts: out[t],
      n: out[t].length,
      rate: avg(out[t].map(engRate)),
      viewsAvg: avg(out[t].map(p => p.views)),
      savesAvg: avg(out[t].map(p => p.saves)),
      sharesAvg: avg(out[t].map(p => p.shares)),
      engAvg: avg(out[t].map(engagement)),
    })).sort((a, b) => b.rate - a.rate);
  }

  function topTags(posts, limit = 8) {
    const buckets = {};
    posts.forEach(p => (p.tags || []).forEach(t => {
      (buckets[t] = buckets[t] || []).push(p);
    }));
    return Object.keys(buckets).map(t => ({
      tag: t, n: buckets[t].length,
      rate: avg(buckets[t].map(engRate)),
      savesAvg: avg(buckets[t].map(p => p.saves)),
      sharesAvg: avg(buckets[t].map(p => p.shares)),
    })).sort((a, b) => b.n - a.n).slice(0, limit);
  }

  function byWeekday(posts) {
    const buckets = Array.from({ length: 7 }, () => []);
    posts.forEach(p => {
      const d = new Date(p.date + 'T12:00:00');
      if (!isNaN(d)) buckets[d.getDay()].push(p);
    });
    return buckets.map((b, i) => ({
      day: WEEKDAYS[i], n: b.length, rate: avg(b.map(engRate)),
    }));
  }

  function postsPerWeek(posts) {
    if (posts.length < 2) return posts.length;
    const dates = posts.map(p => new Date(p.date + 'T12:00:00').getTime()).filter(t => !isNaN(t));
    if (dates.length < 2) return dates.length;
    const spanDays = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / 86400000);
    return (posts.length / spanDays) * 7;
  }

  // Agregador genérico por uma dimensão qualquer (theme/experience/
  // campaign/type). `keyFn` extrai a chave; linhas vazias são ignoradas.
  // Ordena por conversões → seguidores → engajamento (foco em crescimento).
  function byDimension(posts, keyFn, labelFn) {
    const buckets = {};
    posts.forEach(p => {
      const k = keyFn(p);
      if (!k) return;
      (buckets[k] = buckets[k] || []).push(p);
    });
    return Object.keys(buckets).map(k => {
      const b = buckets[k];
      return {
        key: k, label: labelFn ? labelFn(k) : k, n: b.length,
        reachAvg: avg(b.map(reachOf)),
        engAvg: avg(b.map(engagement)),
        rate: avg(b.map(engRate)),
        savesAvg: avg(b.map(p => p.saves)),
        sharesAvg: avg(b.map(p => p.shares)),
        followers: sum(b.map(p => p.followers)),
        conversions: sum(b.map(p => p.conversions)),
        linkClicks: sum(b.map(p => p.linkClicks)),
      };
    }).sort((a, b) =>
      (b.conversions - a.conversions) || (b.followers - a.followers) || (b.rate - a.rate)
    );
  }

  // -----------------------------------------------------------
  // INFERÊNCIA DE PÚBLICO — heurística rules-based em cima dos posts.
  // Não inferimos gênero (sinal fraco demais nos posts). Usamos:
  //   1. Hashtags geográficas → localização
  //   2. Hashtags temáticas → interesses/categorias
  //   3. Frequência de emojis + tom → faixa etária (proxy fraco mas
  //      melhor que vácuo)
  // Confiança escala com quantidade de posts e diversidade de tags.
  // -----------------------------------------------------------
  const GEO_TERMS = {
    saopaulo: 'São Paulo', sp: 'São Paulo', sampa: 'São Paulo', spzin: 'São Paulo',
    rj: 'Rio de Janeiro', rio: 'Rio de Janeiro', riodejaneiro: 'Rio de Janeiro',
    bh: 'Belo Horizonte', belohorizonte: 'Belo Horizonte',
    curitiba: 'Curitiba', cwb: 'Curitiba',
    poa: 'Porto Alegre', portoalegre: 'Porto Alegre',
    brasilia: 'Brasília', df: 'Brasília',
    salvador: 'Salvador', ssa: 'Salvador',
  };

  const INTEREST_RULES = [
    { kw: /gastronom|comida|cozinha|drinks?|wine|vinho|bar|restaurante|cafe|brunch|jantar|chef/, label: 'gastronomia' },
    { kw: /presente|gift|namorados|maes?|paes?|natal|aniversari|nascimento|amigosecreto/, label: 'presentes e datas' },
    { kw: /experien|workshop|aula|curso|oficina|imersao/, label: 'experiências e aprendizado' },
    { kw: /arte|pintura|cultura|teatro|musica|show|exposicao|museu|cinema/, label: 'arte e cultura' },
    { kw: /yoga|wellness|meditacao|autocuidado|saude|terapia|bem.?estar/, label: 'bem-estar e autocuidado' },
    { kw: /role(s|m)?p?|programa|sair|noite|finde|fimdesemana|dicasp|oquefazer/, label: 'rolês e programas' },
    { kw: /amig|namor|date|casal|encontro/, label: 'vida social e relacionamentos' },
    { kw: /pet|cachorro|gato/, label: 'pets' },
    { kw: /maternidade|familia|filhos|kids|crianca/, label: 'maternidade e família' },
  ];

  function inferAudience(posts, platform) {
    // Filtra pela plataforma se ela tiver posts; senão usa tudo como fallback.
    let scoped = posts;
    if (platform) {
      const f = posts.filter(p => p.platform === platform);
      if (f.length) scoped = f;
    }
    if (!scoped.length) return null;

    const tagCounts = {};
    scoped.forEach(p => {
      (p.tags || []).forEach(t => {
        const k = String(t).toLowerCase().trim().replace(/^#/, '');
        if (k) tagCounts[k] = (tagCounts[k] || 0) + 1;
      });
    });

    // 1) Localização — top hit em GEO_TERMS, considerando tags + legendas
    const geoHits = {};
    Object.keys(GEO_TERMS).forEach(g => {
      let n = tagCounts[g] || 0;
      const re = new RegExp('(^|[^\\p{L}])' + g + '([^\\p{L}]|$)', 'iu');
      scoped.forEach(p => { if (p.caption && re.test(p.caption)) n++; });
      if (n > 0) geoHits[g] = n;
    });
    const topGeo = Object.entries(geoHits).sort((a, b) => b[1] - a[1])[0];
    const localizacao = topGeo ? GEO_TERMS[topGeo[0]] : null;

    // 2) Interesses — agrega tags pela regra das categorias
    const FILLER = new Set(['foryou', 'foryoupage', 'fyp', 'foryourpage', 'explore', 'viral', 'trending']);
    const tagSoup = Object.keys(tagCounts)
      .filter(k => !FILLER.has(k))
      .filter(k => !GEO_TERMS[k])
      .join(' ');
    const interesses = [];
    INTEREST_RULES.forEach(r => { if (r.kw.test(tagSoup)) interesses.push(r.label); });

    // Top tags brutas (auxiliar pra exibir)
    const topTags = Object.entries(tagCounts)
      .filter(([k]) => !FILLER.has(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);

    // 3) Faixa etária — proxy fraco via emojis + tom da legenda
    let totalEmojis = 0, casual = 0, formal = 0, withCap = 0;
    scoped.forEach(p => {
      const cap = p.caption || '';
      if (!cap) return;
      withCap++;
      const em = cap.match(/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/gu) || [];
      totalEmojis += em.length;
      if (/(amoooo|incri|haha|kkkk|salv+a|@@+|aaaa|uhuu|hahaha)/i.test(cap)) casual++;
      if (/(curadoria|exclusiv|premium|elegan|sofistica|seleciona)/i.test(cap)) formal++;
    });
    const emojiRate = withCap ? totalEmojis / withCap : 0;
    let faixa;
    if (emojiRate > 3 && casual >= formal) faixa = '18-30';
    else if (emojiRate > 1) faixa = '25-40';
    else faixa = '30-50';

    // Confiança baseada em volume e diversidade
    let confianca = 'baixa';
    if (scoped.length >= 30 && Object.keys(tagCounts).length >= 15) confianca = 'alta';
    else if (scoped.length >= 10) confianca = 'média';

    return { localizacao, interesses, topTags, faixa, confianca, posts: scoped.length };
  }

  function audienceSummary(aud) {
    if (!aud) return null;
    const parts = [];
    parts.push(`pessoas <strong>${aud.faixa}</strong>`);
    if (aud.localizacao) parts.push(`em <strong>${escapeHTML(aud.localizacao)}</strong>`);
    if (aud.interesses.length) {
      parts.push('interessadas em <strong>' + aud.interesses.slice(0, 4).map(escapeHTML).join(', ') + '</strong>');
    }
    return parts.join(', ');
  }

  // -----------------------------------------------------------
  // SEÇÃO 1 — POSICIONAMENTO
  // -----------------------------------------------------------
  function sectionPosicionamento(brand, posts) {
    const aud = inferAudience(posts || [], brand._platform);
    const audText = audienceSummary(aud);

    const confusao = [];
    if (!brand.proposta) confusao.push('Proposta de valor não está declarada em 1 frase — o visitante não entende em 3s o que você entrega.');
    if (!aud)            confusao.push('Sem posts suficientes para inferir público — importe mais conteúdo pra análise ficar confiável.');
    if (!brand.vende)    confusao.push('Não está claro o que a marca vende.');
    if (!brand.link)     confusao.push('Sem link na bio: não há caminho claro pra ação/compra.');
    if (!confusao.length) confusao.push('Nenhum ponto crítico de confusão — posicionamento bem declarado. Reforce a consistência visual.');

    const audValor = audText
      ? `${audText}<br><small class="sa-muted">Inferido de ${aud.posts} posts · confiança ${aud.confianca}${aud.topTags.length ? ' · tags fortes: #' + aud.topTags.slice(0, 5).map(escapeHTML).join(' #') : ''}</small>`
      : '<em>sem posts suficientes pra inferir</em>';

    return card('1. Posicionamento', `
      ${kv('O que a marca vende', brand.vende || '<em>não informado</em>')}
      ${kv('Público inferido pelos posts', audValor)}
      ${kv('Proposta de valor', brand.proposta || '<em>não informada</em>')}
      ${kv('Diferenciais percebidos', brand.vende ? 'Curadoria e experiência (inferido do que vende). Torne explícito na bio.' : '<em>defina o que te diferencia</em>')}
      <h4 class="sa-h4">Pontos de confusão</h4>
      <ul class="sa-list sa-list--warn">${confusao.map(c => `<li>${escapeHTML(c)}</li>`).join('')}</ul>
    `);
  }

  // -----------------------------------------------------------
  // SEÇÃO 2 — BIO E PERFIL (notas 0-10 rules-based)
  // -----------------------------------------------------------
  function sectionBio(brand) {
    const bio = brand.bio || '';
    const hasCTA = /(link|clique|compre|garanta|agende|reserve|confira|acesse|👇|⬇|↓)/i.test(bio);
    const hasEmoji = /[\u{1F300}-\u{1FAFF}☀-➿]/u.test(bio);
    const items = [
      {
        nome: 'Foto de perfil', nota: brand.temFoto ? 9 : 3,
        obs: brand.temFoto ? 'Tem foto definida. Garanta logo legível em círculo pequeno e alto contraste.' : 'Sem foto profissional definida — primeiro ponto de confiança que falha.',
      },
      {
        nome: 'Nome (campo pesquisável)', nota: score10(brand.nome ? (/(\w+).*(presente|experi|gift|joia|kids|drink|arte)/i.test(brand.nome) ? 9 : 6) : 2),
        obs: brand.nome ? 'O campo Nome é indexado na busca. Use “Marca | Categoria/palavra-chave” pra ser achada.' : 'Defina o nome.',
      },
      {
        nome: 'Username (@)', nota: score10(brand.username ? (brand.username.length <= 15 && !/[._]{2,}|\d{3,}/.test(brand.username) ? 9 : 6) : 2),
        obs: brand.username ? '@' + escapeHTML(brand.username) + ' — curto e limpo ajuda no boca a boca.' : 'Defina o @.',
      },
      {
        nome: 'Bio', nota: score10(bioScore(bio, hasCTA, hasEmoji)),
        obs: bioObs(bio, hasCTA, hasEmoji),
      },
      {
        nome: 'Link', nota: brand.link ? 9 : 1,
        obs: brand.link ? 'Link presente. Considere link-in-bio com múltiplos destinos rastreáveis (UTM).' : 'SEM LINK — maior gargalo de conversão do perfil. Adicione hoje.',
      },
      {
        nome: 'Destaques', nota: destaquesScore(brand.destaques),
        obs: destaquesObs(brand.destaques),
      },
    ];
    const media = avg(items.map(i => i.nota));
    const rows = items.map(i => `
      <div class="sa-score">
        <div class="sa-score__top">
          <span class="sa-score__name">${escapeHTML(i.nome)}</span>
          <span class="sa-score__num sa-score__num--${i.nota >= 7 ? 'good' : i.nota >= 4 ? 'mid' : 'bad'}">${i.nota}/10</span>
        </div>
        <div class="sa-score__bar"><span style="width:${i.nota * 10}%"></span></div>
        <p class="sa-score__obs">${i.obs}</p>
      </div>
    `).join('');

    return card(`2. Bio e perfil <span class="sa-badge">média ${media.toFixed(1)}/10</span>`, rows);
  }

  function bioScore(bio, hasCTA, hasEmoji) {
    if (!bio) return 1;
    let s = 4;
    if (bio.length >= 60 && bio.length <= 150) s += 2; else if (bio.length > 150) s += 1;
    if (hasCTA) s += 2;
    if (hasEmoji) s += 1;
    if (/\n/.test(bio)) s += 1; // quebras = leitura escaneável
    return s;
  }
  function bioObs(bio, hasCTA, hasEmoji) {
    if (!bio) return 'Bio vazia — escreva: o que você entrega + pra quem + 1 CTA. Use quebras de linha.';
    const tips = [];
    if (!hasCTA) tips.push('falta um CTA claro ("👇 reserve")');
    if (!hasEmoji) tips.push('emojis ajudam a escanear');
    if (bio.length > 150) tips.push('está longa — corte pro essencial');
    if (!/\n/.test(bio)) tips.push('use quebras de linha');
    return tips.length ? 'Ajustes: ' + tips.join('; ') + '.' : 'Bio sólida: clara, com CTA e escaneável.';
  }
  function destaquesScore(d) {
    const n = splitList(d).length;
    if (n === 0) return 2;
    if (n >= 4) return 9;
    return 4 + n;
  }
  function destaquesObs(d) {
    const list = splitList(d);
    if (!list.length) return 'Sem destaques informados — crie ao menos 4 (Comece aqui, Avaliações, Como funciona, Ofertas) com capas padronizadas.';
    if (list.length < 4) return `${list.length} destaque(s): ${escapeHTML(list.join(', '))}. Suba pra 4+ cobrindo a jornada (descoberta → prova → oferta).`;
    return `${list.length} destaques cobrindo bem a jornada. Mantenha as capas no padrão visual da marca.`;
  }

  // -----------------------------------------------------------
  // SEÇÃO 3 — CONTEÚDO
  // -----------------------------------------------------------
  function sectionConteudo(posts) {
    if (!posts.length) return card('3. Conteúdo', emptyData('Cadastre posts na aba Redes Sociais pra analisar temas, formatos e ganchos.'));
    const types = byType(posts);
    const tags = topTags(posts, 6);
    const ppw = postsPerWeek(posts);
    const stories = posts.filter(p => p.type === 'story');
    const nonStories = posts.filter(p => p.type !== 'story');
    const shareLeaders = [...posts].sort((a, b) => b.shares - a.shares)[0];
    const saveLeaders = [...posts].sort((a, b) => b.saves - a.saves)[0];
    const withLink = posts.filter(p => p.link).length;

    // gancho proxy: retenção de stories e taxa de eng dos reels
    let ganchoNota = 'média';
    if (stories.length >= 2 && nonStories.length >= 2) {
      const r = avg(stories.map(p => p.views)) / Math.max(1, avg(nonStories.map(p => p.views)));
      ganchoNota = r < 0.7 ? 'fraca (alcance de stories baixo → revise os 2 primeiros segundos)' : 'saudável';
    }

    return card('3. Conteúdo', `
      ${kv('Temas recorrentes', tags.length ? tags.map(t => `<span class="sa-tag">${escapeHTML(t.tag)} <small>${t.n}×</small></span>`).join(' ') : '<em>adicione tags aos posts</em>')}
      ${kv('Formatos utilizados', types.map(t => `${t.label} (${t.n})`).join(' · '))}
      ${kv('Frequência', `${ppw.toFixed(1)} posts/semana ${ppw < 3 ? '— abaixo do ideal (mire 4-6/sem)' : '— ritmo bom'}`)}
      ${kv('Qualidade dos ganchos', `Retenção ${ganchoNota}. Melhor formato por engajamento: <strong>${types[0] ? types[0].label : '—'}</strong> (${fmtPct(types[0] ? types[0].rate : 0)}).`)}
      ${kv('Potencial de viralização', `Sinalizado por compartilhamentos. Líder: ${shareLeaders ? `${TYPE_LABEL[shareLeaders.type] || shareLeaders.type} com ${fmtNum(shareLeaders.shares)} shares` : '—'}. ${avg(posts.map(p => p.shares)) < 5 ? 'Shares baixos no geral — falta conteúdo "compartilhável" (opinião/utilidade).' : 'Boa base de shares.'}`)}
      ${kv('Potencial de conversão', `Saves (intenção) líder: ${saveLeaders ? `${fmtNum(saveLeaders.saves)} saves` : '—'}. ${withLink}/${posts.length} posts levam a um link. ${withLink / posts.length < 0.3 ? 'Poucos posts com link/CTA — perde-se conversão.' : 'Boa cobertura de CTA.'}`)}
    `);
  }

  // -----------------------------------------------------------
  // SEÇÃO 4 — ENGAJAMENTO
  // -----------------------------------------------------------
  function sectionEngajamento(posts) {
    if (!posts.length) return card('4. Engajamento', emptyData('Sem posts pra estimar engajamento.'));
    const agg = aggregate(posts);
    const commentRatio = agg.eng > 0 ? (agg.comments / agg.eng) * 100 : 0;
    const authority = agg.saves + agg.shares;
    const authPct = agg.eng > 0 ? (authority / agg.eng) * 100 : 0;
    return card('4. Engajamento', `
      ${kv('Taxa de engajamento estimada', `${fmtPct(agg.rate)} (eng/visualizações) · ${agg.rate < 2 ? 'baixa' : agg.rate < 5 ? 'mediana' : 'forte'}`)}
      ${kv('Qualidade dos comentários', `Comentários = ${fmtPct(commentRatio)} do engajamento. ${commentRatio < 8 ? 'Pouca conversa — faça perguntas diretas e responda todos os comentários.' : 'Bom nível de conversa.'}`)}
      ${kv('Sinais de comunidade', `${fmtNum(agg.comments)} comentários no período. ${commentRatio >= 8 ? 'Há diálogo — alimente com respostas e Stories de bastidor.' : 'Comunidade ainda fria — provoque respostas (enquetes, caixinha).'}`)}
      ${kv('Sinais de autoridade', `Saves + Shares = ${fmtPct(authPct)} do engajamento. ${authPct >= 25 ? 'Conteúdo é percebido como útil/valioso — sinal forte de autoridade.' : 'Baixa autoridade percebida — produza mais conteúdo educativo/salvável.'}`)}
    `);
  }

  // -----------------------------------------------------------
  // SEÇÃO 5 — FUNIL DE VENDAS
  // -----------------------------------------------------------
  function sectionFunil(posts, brand) {
    const tagText = posts.flatMap(p => p.tags || []).join(' ').toLowerCase();
    const has = (re) => re.test(tagText);
    const withLink = posts.filter(p => p.link).length;
    const reachAvg = avg(posts.map(p => p.views));

    const etapas = [
      { nome: 'Atrai audiência', ok: reachAvg > 0, txt: reachAvg > 0 ? `Alcance médio ${fmtNum(reachAvg)}/post via Reels e conteúdo de descoberta.` : 'Sem dados de alcance.' },
      { nome: 'Gera confiança', ok: has(/depoiment|prova|bastidor|cliente|avalia/), txt: has(/depoiment|prova|bastidor|cliente|avalia/) ? 'Há prova social/bastidores no conteúdo.' : 'Falta prova social (depoimentos, bastidores, clientes reais).' },
      { nome: 'Gera desejo', ok: has(/produto|oferta|experi|presente|lancamento|novidade/), txt: has(/produto|oferta|experi|presente|lancamento|novidade/) ? 'Conteúdo de produto/experiência presente.' : 'Pouca demonstração de produto/experiência gerando desejo.' },
      { nome: 'Converte', ok: !!brand.link && withLink > 0, txt: brand.link ? `${withLink} posts com link + link na bio.` : 'Sem link na bio e/ou sem CTA nos posts — conversão travada.' },
    ];
    const gargalo = etapas.find(e => !e.ok);
    return card('5. Funil de vendas', `
      <div class="sa-funnel">
        ${etapas.map(e => `
          <div class="sa-funnel__step ${e.ok ? 'is-ok' : 'is-gap'}">
            <span class="sa-funnel__dot">${e.ok ? '✓' : '!'}</span>
            <div><strong>${e.nome}</strong><br><small>${escapeHTML(e.txt)}</small></div>
          </div>`).join('')}
      </div>
      <h4 class="sa-h4">Gargalo principal</h4>
      <p class="sa-list--warn" style="padding:10px 14px;border-radius:8px;">${gargalo ? `🚧 <strong>${gargalo.nome}</strong>: ${escapeHTML(gargalo.txt)} — resolva isto antes de escalar tráfego.` : '✅ Funil completo nas 4 etapas. Foque em volume e otimização de cada etapa.'}</p>
    `);
  }

  // -----------------------------------------------------------
  // SEÇÃO 6 — CONCORRÊNCIA
  // -----------------------------------------------------------
  function sectionConcorrencia(brand) {
    const list = splitList(brand.concorrentes);
    if (!list.length) {
      return card('6. Concorrência', emptyData('Liste os concorrentes percebidos no perfil da marca (separados por vírgula) pra gerar o comparativo.'));
    }
    const rows = list.map(c => `
      <tr>
        <td><strong>${escapeHTML(c.replace(/^@/, '@'))}</strong></td>
        <td>Mapear posicionamento</td>
        <td>Auditar formatos/frequência</td>
        <td>Comparar oferta e preço</td>
        <td>Achar lacuna a explorar</td>
      </tr>`).join('');
    return card('6. Concorrência', `
      <p class="sa-muted">Concorrentes percebidos: ${list.map(c => `<span class="sa-tag">${escapeHTML(c)}</span>`).join(' ')}</p>
      <div class="sa-tablewrap"><table class="sa-table">
        <thead><tr><th>Perfil</th><th>Posicionamento</th><th>Conteúdo</th><th>Oferta</th><th>Diferencial p/ explorar</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="sa-muted">Dica: salve 3 posts de melhor desempenho de cada concorrente e identifique o ângulo que eles NÃO cobrem — esse é o seu espaço.</p>
    `);
  }

  // -----------------------------------------------------------
  // SEÇÃO 7 — OPORTUNIDADES
  // -----------------------------------------------------------
  function sectionOportunidades(posts, brand) {
    const tags = topTags(posts, 4).map(t => t.tag);
    const bestFmt = (byType(posts)[0] || {}).label || 'Reels';
    const seed = tags[0] || brand.vende || 'seu produto';
    const seed2 = tags[1] || 'bastidores';

    const crescimento = [
      'Postar Reels 4-5x/semana com gancho nos 2 primeiros segundos',
      'Responder 100% dos comentários na 1ª hora (impulsiona alcance)',
      'Adicionar CTA + link rastreável (UTM) na bio hoje',
      'Criar 4 Destaques cobrindo a jornada (Comece aqui, Prova, Oferta, FAQ)',
      'Usar a caixinha de perguntas nos Stories 3x/semana',
      'Colaborar (collab post) com perfis complementares do mesmo público',
      'Reaproveitar top posts antigos como novos Reels',
      'Publicar nos melhores dias/horários segundo os dados do painel',
      'Fixar 3 posts âncora no topo do feed (oferta, prova, manifesto)',
      `Dobrar o tema vencedor: "${seed}"`,
      'Transformar avaliações de clientes em carrosséis de prova social',
      'Criar uma série semanal recorrente (mesmo nome/horário)',
      'Pedir compartilhamento explícito no fim de Reels úteis',
      'Otimizar legendas com 1ª linha = gancho forte',
      'Fazer parcerias com microinfluenciadores locais',
      'Rodar enquetes pra co-criar conteúdo com a audiência',
      'Stories de bastidor diários pra aquecer a relação',
      'Cross-post Reels no TikTok pra alcance extra',
      'Sequência de boas-vindas no Direct pra novos seguidores',
      'Testar 2 ganchos diferentes pro mesmo conteúdo (A/B)',
    ];

    const conteudo = [
      `"Antes e depois" usando ${seed}`,
      `3 erros que as pessoas cometem com ${seed}`,
      `Bastidores de como ${brand.nome || 'a marca'} prepara ${seed}`,
      `Tutorial rápido: como escolher ${seed}`,
      'Depoimento real de cliente (formato carrossel)',
      `Mitos x verdades sobre ${seed}`,
      `Checklist salvável: ${seed} do jeito certo`,
      'Um dia na rotina da marca',
      `Comparativo: ${seed} vs ${seed2}`,
      'Perguntas frequentes respondidas em vídeo',
      `Top 5 ${seed} mais pedidos`,
      'Resposta a um comentário em vídeo',
      `Tendência do momento aplicada a ${seed}`,
      'Storytelling da origem da marca',
      `"Não compre antes de ver isto" sobre ${seed}`,
      'Unboxing / chegada de produto',
      `Curadoria: presentes pra cada tipo de pessoa`,
      'Por trás do preço: o que está incluso',
      `Reel rápido de transformação com ${seed2}`,
      'Carrossel educativo: passo a passo',
    ];

    const viral = [
      `Reel "POV: você descobriu ${seed}"`,
      'Trend de áudio em alta aplicado ao seu nicho',
      `"Coisas que ninguém te conta sobre ${seed}"`,
      'Reação genuína de cliente (vídeo emocional)',
      'Erro engraçado/bastidor real (humaniza)',
      `Lista polêmica: "${seed} que você deveria parar de fazer"`,
      'Transformação rápida com corte seco (satisfação visual)',
      `Pergunta divisiva que gera comentários ("time A ou time B?")`,
      'Reel "expectativa x realidade"',
      'Tutorial "salve antes que apague" (gera saves em massa)',
    ];

    const conversao = [
      `Oferta com escassez real: "${seed} — últimas unidades"`,
      'Carrossel de prova social → CTA link na bio',
      'Reel demonstração de produto + "link na bio"',
      'Stories sequência: problema → solução → oferta → link',
      'Depoimento em vídeo + cupom exclusivo',
      'Live/tour de produto com CTA fixo',
      '"Como comprar em 3 passos" (remove fricção)',
      'Comparativo de planos/pacotes em carrossel',
      'Garantia/diferencial destacado + CTA',
      'Sequência de Direct automatizada pós-engajamento',
    ];

    return card('7. Oportunidades', `
      ${oppBlock('20 oportunidades de crescimento rápido', crescimento)}
      ${oppBlock('20 ideias de conteúdo com alto potencial', conteudo)}
      ${oppBlock('10 ideias de conteúdo viral', viral)}
      ${oppBlock('10 ideias de conteúdo de conversão', conversao)}
    `);
  }

  function oppBlock(title, items) {
    return `<h4 class="sa-h4">${escapeHTML(title)}</h4>
      <ol class="sa-oplist">${items.map(i => `<li>${escapeHTML(i)}</li>`).join('')}</ol>`;
  }

  // -----------------------------------------------------------
  // SEÇÃO 8 — PLANO DE AÇÃO (30 dias)
  // -----------------------------------------------------------
  function sectionPlano(posts, brand) {
    const alta = [];
    if (!brand.link) alta.push('Adicionar link (link-in-bio rastreável) na bio — destrava conversão.');
    if (!brand.proposta) alta.push('Reescrever a bio com proposta de valor + CTA claros.');
    alta.push('Definir 3 pilares de conteúdo e calendário fixo (4-6 posts/sem).');
    alta.push('Padronizar 4 Destaques cobrindo a jornada de compra.');
    alta.push('Escalar o formato/tema vencedor identificado no painel.');

    const media = [
      'Criar série semanal recorrente pra fidelizar audiência.',
      'Montar banco de 10 ganchos testados pra Reels.',
      'Implementar rotina de resposta a comentários/Direct na 1ª hora.',
      'Coletar e publicar 4 depoimentos de clientes.',
      'Testar 2 collabs com perfis do mesmo público.',
    ];
    const baixa = [
      'Auditar e atualizar capas dos Destaques no padrão visual.',
      'Revisar bios de TikTok/LinkedIn pra consistência de marca.',
      'Arquivar posts antigos fora do posicionamento atual.',
      'Documentar identidade visual (paleta, fontes, tom de voz).',
    ];

    return card('8. Plano de ação — próximos 30 dias', `
      ${planBlock('Prioridade alta', alta, 'high')}
      ${planBlock('Prioridade média', media, 'mid')}
      ${planBlock('Prioridade baixa', baixa, 'low')}
    `);
  }
  function planBlock(title, items, cls) {
    return `<div class="sa-prio sa-prio--${cls}">
      <h4 class="sa-h4">${escapeHTML(title)}</h4>
      <ul class="sa-list">${items.map(i => `<li>${escapeHTML(i)}</li>`).join('')}</ul>
    </div>`;
  }

  // -----------------------------------------------------------
  // SEÇÃO 9 — CALENDÁRIO EDITORIAL (15 dias, ORIENTADO POR DADOS)
  // Usa o desempenho real por ocasião (alcance, shares, saves, eng)
  // pra escolher tema + formato + canal de cada dia. Inclui categorias
  // estratégicas, frequência por canal, horários a testar e
  // oportunidades não exploradas.
  // -----------------------------------------------------------
  const CATEGORY = {
    date: 'Experiências para casais', namorados: 'Experiências para casais',
    galentine: 'Experiências para solteiros', autopresente: 'Bem-estar / Autopresente',
    amigas: 'Experiências com amigas', kids: 'Kids', familia: 'Família',
    gastronomia: 'Gastronomia', criatividade: 'Cerâmica & Criatividade',
    bemestar: 'Bem-estar', corporativo: 'Corporativo (B2B)',
    aniversario: 'Conversão / Presente', maes: 'Datas comemorativas', pais: 'Datas comemorativas',
  };

  function isoAddDays(n) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n);
    return d;
  }

  // Janelas de horário a TESTAR (não há hora no export do Windsor — só data).
  const HOR = {
    ig:    '12h ou 19h–21h (testar)',
    story: '9h / 13h / 19h (testar)',
    tiktok:'19h–22h (testar)',
    linkedin:'ter–qui, 8h–9h (testar)',
    whats: '11h–12h ou 19h (testar)',
  };

  // Núcleo: resolve o plano de 15 dias em itens estruturados, escolhendo
  // o tema de cada dia a partir do desempenho real (rankings por objetivo).
  // Usado tanto pelo relatório quanto pelo gerador da aba Calendário Editorial.
  function computeCalendarRows(posts) {
    if (!posts.length) return [];
    const occ = byDimension(posts, p => p.theme, occasionLabel).filter(r => r.key);
    const RANK = {
      reach:  [...occ].sort((a, b) => b.reachAvg - a.reachAvg),
      shares: [...occ].sort((a, b) => b.sharesAvg - a.sharesAvg),
      saves:  [...occ].sort((a, b) => b.savesAvg - a.savesAvg),
      eng:    [...occ].sort((a, b) => b.rate - a.rate),
    };
    const pick = (src, i, fb) => (RANK[src] || [])[i] || (RANK[src] || [])[0] || { label: fb, key: fb };
    const catOf = o => CATEGORY[o.key] || 'Descoberta da marca';

    const plan = [
      { canal:'Instagram + TikTok', formato:'Reel', obj:'Descoberta / Alcance', src:'reach', hor:HOR.ig,
        hook:t=>`POV: o ${t.toLowerCase()} perfeito pra fugir da rotina em SP existe 🤫`,
        exec:'Corte seco nos 2s, 3 cenas da experiência, texto curto na tela, áudio em alta. Reaproveita no TikTok no mesmo dia.',
        cta:'Compartilha com quem viveria isso' },
      { canal:'Instagram', formato:'Carrossel', obj:'Autoridade / Saves', src:'saves', hor:HOR.ig,
        hook:t=>`Salva esse: guia pra escolher seu ${t.toLowerCase()} ✨`,
        exec:'Capa forte ("Salva esse"), 6–8 slides com 1 ideia cada, último slide = CTA suave.',
        cta:'Salve este post' },
      { canal:'Stories (Instagram)', formato:'Story', obj:'Comunidade', src:'eng', hor:HOR.story,
        hook:t=>`Enquete: qual ${t.toLowerCase()} você faria primeiro? 👀`,
        exec:'3–4 frames + sticker de enquete e caixinha de pergunta. Responde todo mundo (comunidade está fria).',
        cta:'Responde na enquete' },
      { canal:'Instagram + WhatsApp', formato:'Carrossel', obj:'Conversão', src:'saves', hor:HOR.ig,
        hook:t=>`${t}: como reservar em 3 passos (vagas limitadas)`,
        exec:'Prova social + escassez real + passo a passo. Espelha no WhatsApp Comunidade com link de reserva (UTM).',
        cta:'Link na bio / reserve' },
      { canal:'TikTok', formato:'Reel', obj:'Descoberta / Viral', src:'shares', hor:HOR.tiktok,
        hook:t=>`3 experiências de ${t.toLowerCase()} em SP que ninguém te mostrou`,
        exec:'Tendência de áudio do momento aplicada ao nicho. Ritmo rápido, lista numerada na tela.',
        cta:'Salva pra não esquecer' },
      { canal:'Instagram', formato:'Reel', obj:'Experiências para casais', src:null, fixed:'date', hor:HOR.ig,
        hook:t=>`Date diferente em SP: tira as mãos da tela e cria memória real 🍷`,
        exec:'Mostra o casal vivendo a experiência (cerâmica+vinho, jantar). Emoção nos 2 primeiros segundos.',
        cta:'Marca seu par' },
      { canal:'Stories (Instagram)', formato:'Story', obj:'Comunidade / Bastidores', src:null, fixed:'gastronomia', hor:HOR.story,
        hook:t=>`Bastidores: montando a experiência de hoje 👀`,
        exec:'Bastidor real humaniza a marca. Fecha com pergunta ("o que você acha?").',
        cta:'Manda no Direct' },
      { canal:'Instagram + TikTok', formato:'Reel', obj:'O que fazer em SP / Sair da rotina', src:'reach', hor:HOR.tiktok,
        hook:t=>`O que fazer em SP neste fim de semana (sem ser shopping nem bar lotado)`,
        exec:'Série fixa semanal. Roteiro de 3 experiências, 1 delas da Elarah. Vira formato recorrente.',
        cta:'Salva pro fim de semana' },
      { canal:'Instagram', formato:'Carrossel', obj:'Experiências para solteiros', src:null, fixed:'galentine', hor:HOR.ig,
        hook:t=>`Single's day: rolê com as amigas que vale mais que presente 💛`,
        exec:'Carrossel de ideias pra solteiras/amigas. Forte em saves (padrão confirmado nos dados).',
        cta:'Salve e chame as amigas' },
      { canal:'Instagram', formato:'Carrossel', obj:'Cerâmica & Criatividade', src:null, fixed:'criatividade', hor:HOR.ig,
        hook:t=>`O que ninguém te conta antes da sua 1ª oficina de cerâmica 🎨`,
        exec:'Educativo/salvável (criatividade tem saves altos mas alcance baixo → precisa de gancho mais forte).',
        cta:'Salve este post' },
      { canal:'TikTok', formato:'Reel', obj:'Tendências e assuntos do momento', src:'shares', hor:HOR.tiktok,
        hook:t=>`Trend do momento aplicada a ${t.toLowerCase()} 🎵`,
        exec:'Pega áudio/trend em alta e adapta. Baixo custo, alto teto de alcance no TikTok.',
        cta:'Segue pra mais' },
      { canal:'Stories (Instagram)', formato:'Story', obj:'Comunidade / Prova social', src:null, fixed:'gastronomia', hor:HOR.story,
        hook:t=>`Depoimento de quem viveu: "${'foi inesquecível'}" 🗣️`,
        exec:'UGC: reposta print/vídeo de cliente. Confiança + desejo. Pede pra galera responder se já foi.',
        cta:'Conta sua experiência' },
      { canal:'Instagram + WhatsApp', formato:'Reel', obj:'Conversão / Reserva', src:'saves', hor:HOR.whats,
        hook:t=>`Vagas abrindo: ${t.toLowerCase()} com data marcada 👇`,
        exec:'Demonstração da experiência + escassez + link. Dispara também no WhatsApp Comunidade.',
        cta:'Reserve pelo link' },
      { canal:'Instagram', formato:'Reel', obj:'Experiências com amigas', src:null, fixed:'amigas', hor:HOR.ig,
        hook:t=>`Cansou do mesmo rolê? Experiência pra fazer com as amigas 👯`,
        exec:'Energia alta, grupo se divertindo. Amigas tem saves bons mas alcance baixo → investir no gancho.',
        cta:'Marca as amigas' },
      { canal:'LinkedIn + Instagram', formato:'Carrossel', obj:'Corporativo (B2B)', src:null, fixed:'corporativo', hor:HOR.linkedin,
        hook:t=>`Team building que não é happy hour: experiências para empresas`,
        exec:'Case/benefício pra RH. No LinkedIn texto institucional; no IG carrossel. Gera lead B2B.',
        cta:'Fale com a gente' },
    ];

    return plan.map((p, i) => {
      const o = p.src ? pick(p.src, 0, 'Gastronomia') : (occ.find(x => x.key === p.fixed) || { label: occasionLabel(p.fixed), key: p.fixed });
      const dt = isoAddDays(i + 1);
      return {
        dateISO: dt.toISOString().slice(0, 10),
        dataBR: dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dia: WEEKDAYS[dt.getDay()],
        hor: p.hor,
        canal: p.canal,
        formato: p.formato,
        obj: p.obj,
        categoria: catOf(o),
        hook: p.hook(o.label),
        exec: p.exec,
        cta: p.cta,
      };
    });
  }

  // Dicas (frequência, horários, oportunidades) — HTML mostrado na aba.
  function buildCalendarTipsHTML(posts) {
    const freqCard = card('Frequência ideal por canal', `
      <div class="sa-tablewrap"><table class="sa-table">
        <thead><tr><th>Canal</th><th>Frequência</th><th>Por quê (dado)</th></tr></thead>
        <tbody>
          <tr><td><strong>Instagram Feed</strong></td><td>5–6 posts/sem</td><td>Priorize <strong>Reel</strong> (alcance 10,7k) e <strong>Carrossel</strong> (eng. 10,5%). <strong>Pare o Feed estático</strong> (0,2% — está puxando a média pra baixo).</td></tr>
          <tr><td><strong>Instagram Stories</strong></td><td>Diário (5–7/sem)</td><td>Comentários são só 4,6% do eng. — comunidade fria. Story com enquete/caixinha é o caminho mais barato de aquecer.</td></tr>
          <tr><td><strong>TikTok</strong></td><td>5–7/sem</td><td>Alcance alto (85k) com eng. baixo → jogo de descoberta. Reaproveite os Reels do IG, custo quase zero.</td></tr>
          <tr><td><strong>LinkedIn</strong></td><td>1–2/sem</td><td>Corporativo teve 5,6% de eng. — nicho B2B (team building) vale 1 post institucional/semana.</td></tr>
          <tr><td><strong>WhatsApp Comunidade</strong></td><td>2–3/sem</td><td>Canal de conversão direta: drops de vagas, escassez e link de reserva. Resolve o gargalo (conversão travada).</td></tr>
        </tbody>
      </table></div>`);

    // Horários — honestidade sobre o dado.
    const horCard = card('Horários recomendados (a testar)', `
      <p class="sa-list--warn" style="padding:10px 14px;border-radius:8px;">
        ⚠️ O export do Windsor trouxe só a <strong>data</strong>, não a <strong>hora</strong> de publicação — então
        ainda <strong>não dá pra cravar o melhor horário com dado próprio</strong>. As janelas acima são hipóteses
        a testar, baseadas no comportamento do público da Elarah (gente planejando rolê/date à noite e no fim de semana).
      </p>
      <p class="sa-muted">Para destravar isso: no Windsor, adicione o campo de <strong>hora/timestamp</strong> da publicação
      (ou registre o horário ao cadastrar). Depois de ~3–4 semanas, o painel passa a apontar o horário real por dado.
      Enquanto isso, teste 2 janelas por canal e compare alcance/engajamento.</p>`);

    // Oportunidades não exploradas + novos formatos.
    const oppCard = card('Oportunidades não exploradas + novos formatos', `
      <h4 class="sa-h4">Ocasiões que você ainda não captura</h4>
      <ul class="sa-list">
        <li><strong>👔 Dia dos Pais</strong> — comece 3–4 semanas antes; ângulo "experiência > objeto".</li>
        <li><strong>🧒 Kids / Família</strong> — fins de semana e férias; oficinas criativas para crianças.</li>
        <li><strong>🧘 Bem-estar</strong> — recorrente (não depende de data); surfar na pauta de autocuidado.</li>
      </ul>
      <h4 class="sa-h4">Novos formatos sugeridos (pelo comportamento da audiência)</h4>
      <ul class="sa-list">
        <li><strong>Série "O que fazer em SP neste fim de semana"</strong> (Reel semanal) — ataca alcance/descoberta.</li>
        <li><strong>"Duelo de experiências"</strong> (enquete no Story → vira Reel) — ataca a comunidade fria.</li>
        <li><strong>UGC / depoimento de quem viveu</strong> (Reel emocional) — confiança e conversão.</li>
        <li><strong>Carrossel-guia "salva pra depois"</strong> por ocasião — maximiza saves (seu ponto forte).</li>
        <li><strong>Gastronomia como isca de alcance</strong> — é seu maior motor de shares; transforme em série.</li>
      </ul>`);

    return freqCard + horCard + oppCard;
  }

  // Expande "Instagram + TikTok" / "Stories (Instagram)" etc. em uma linha
  // por canal pro content_calendar (cada post do dia vira um item).
  function expandChannels(canalRaw, formato) {
    const low = String(canalRaw).toLowerCase();
    if (/stories/.test(low)) return [{ canal: 'Instagram', tipo: 'Stories' }];
    const out = [];
    if (/instagram/.test(low)) out.push({ canal: 'Instagram', tipo: formato });
    if (/tiktok/.test(low))    out.push({ canal: 'TikTok', tipo: formato });
    if (/linkedin/.test(low))  out.push({ canal: 'LinkedIn', tipo: 'Post' });
    if (/whatsapp/.test(low))  out.push({ canal: 'WhatsApp', tipo: 'Comunidade' });
    return out.length ? out : [{ canal: 'Instagram', tipo: formato }];
  }

  // API pública: plano pronto pra inserir no content_calendar + dicas.
  // Cada dia pode gerar mais de uma linha (um post por canal).
  function buildCalendarPlan() {
    const posts = loadPosts();
    const items = computeCalendarRows(posts);
    const rows = [];
    items.forEach(it => {
      expandChannels(it.canal, it.formato).forEach(ch => {
        rows.push({
          data: it.dateISO,
          canal: ch.canal,
          tipo: ch.tipo,
          ideia: it.hook,
          legenda: it.exec + '\n\nCTA: ' + it.cta,
          observacao: '[auto:redes] ⏰ ' + it.hor + ' · 🎯 ' + it.obj + ' (' + it.categoria + ')',
          status: 'planejado',
        });
      });
    });
    return { rows, tipsHTML: buildCalendarTipsHTML(posts), count: items.length };
  }

  // Seção 9 do relatório vira um atalho curto — o calendário detalhado
  // mora na aba "Calendário Editorial".
  function sectionCalendario(posts, brand) {
    return card('9. Calendário editorial', `
      <p>O calendário de <strong>15 dias orientado por dados</strong> (com data, horário a testar,
      canal, formato, hook, execução e CTA) é gerado direto na aba
      <strong>Calendário Editorial</strong> do admin — clique em <strong>"✨ Gerar do Redes Sociais"</strong> lá.</p>
      <p class="sa-muted">Assim fica visível, editável e organizado por dia/canal, em vez de preso dentro deste relatório.</p>
    `);
  }

  // -----------------------------------------------------------
  // SEÇÃO 10 — RESUMO EXECUTIVO
  // -----------------------------------------------------------
  function sectionResumo(posts, brand) {
    const erros = [];
    if (!brand.link) erros.push('Sem link na bio (conversão travada).');
    if (!brand.proposta) erros.push('Proposta de valor não declarada.');
    if (posts.length && postsPerWeek(posts) < 3) erros.push('Frequência de postagem abaixo do ideal.');
    if (posts.length && avg(posts.map(p => p.shares)) < 5) erros.push('Pouco conteúdo compartilhável (alcance orgânico limitado).');
    if (!splitList(brand.destaques).length) erros.push('Destaques ausentes/incompletos.');
    if (!erros.length) erros.push('Nenhum erro crítico — foco passa a ser volume e otimização.');

    const types = byType(posts);
    const bestFmt = types[0] ? types[0].label : 'Reels';
    const oportunidades = [
      `Escalar ${bestFmt} (seu formato de maior engajamento).`,
      'Transformar prova social em conteúdo recorrente.',
      'Sistematizar ganchos fortes nos 2 primeiros segundos.',
    ];

    let maiorAlavanca;
    if (!brand.link) maiorAlavanca = 'Adicionar link na bio + CTA nos posts — é a mudança que converte alcance em vendas imediatamente.';
    else if (posts.length && postsPerWeek(posts) < 3) maiorAlavanca = `Subir a frequência pra 4-6 posts/semana priorizando ${bestFmt} — alcance cresce de forma composta.`;
    else maiorAlavanca = `Escalar ${bestFmt} com seu tema vencedor e CTA de conversão em cada post.`;

    return card('10. Resumo executivo', `
      <h4 class="sa-h4">Principais erros</h4>
      <ul class="sa-list sa-list--warn">${erros.map(e => `<li>${escapeHTML(e)}</li>`).join('')}</ul>
      <h4 class="sa-h4">Principais oportunidades</h4>
      <ul class="sa-list sa-list--good">${oportunidades.map(o => `<li>${escapeHTML(o)}</li>`).join('')}</ul>
      <h4 class="sa-h4">Ação de maior crescimento imediato</h4>
      <p class="sa-bignote">🚀 ${escapeHTML(maiorAlavanca)}</p>
    `);
  }

  // -----------------------------------------------------------
  // HELPERS DE HTML
  // -----------------------------------------------------------
  function card(title, bodyHTML) {
    return `<section class="sa-card"><h3 class="sa-card__title">${title}</h3>${bodyHTML}</section>`;
  }
  function kv(label, value) {
    return `<div class="sa-kv"><span class="sa-kv__k">${escapeHTML(label)}</span><span class="sa-kv__v">${value}</span></div>`;
  }
  function emptyData(msg) {
    return `<p class="sa-empty">📊 ${escapeHTML(msg)}</p>`;
  }

  // -----------------------------------------------------------
  // PAINEL DE MÉTRICAS-CHAVE (estrutura escalável Windsor)
  // Alcance, engajamento, shares, saves, seguidores, conversão.
  // -----------------------------------------------------------
  function sectionMetricas(posts) {
    if (!posts.length) return card('Métricas-chave (Windsor AI)', emptyData('Importe o CSV do Windsor AI pra ver alcance, engajamento, seguidores e conversões.'));
    const agg = aggregate(posts);
    const reach = sum(posts.map(reachOf));
    const followers = sum(posts.map(p => p.followers));
    const linkClicks = sum(posts.map(p => p.linkClicks));
    const conversions = sum(posts.map(p => p.conversions));
    const cvr = linkClicks > 0 ? (conversions / linkClicks) * 100 : 0;
    const cards = [
      ['Alcance', fmtNum(reach), 'contas/visualizações'],
      ['Engajamento', fmtNum(agg.eng), `taxa ${fmtPct(agg.rate)}`],
      ['Compartilhamentos', fmtNum(agg.shares), 'motor de alcance orgânico'],
      ['Salvamentos', fmtNum(agg.saves), 'intenção de compra'],
      ['Novos seguidores', fmtNum(followers), 'crescimento da comunidade'],
      ['Cliques no link', fmtNum(linkClicks), 'topo da conversão'],
      ['Conversões / reservas', fmtNum(conversions), cvr ? `${fmtPct(cvr)} dos cliques` : 'configure UTM no site'],
    ];
    return card('Métricas-chave (Windsor AI)', `
      <div class="sa-metricgrid">
        ${cards.map(c => `<div class="sa-metric"><span class="sa-metric__v">${c[1]}</span><span class="sa-metric__k">${escapeHTML(c[0])}</span><span class="sa-metric__h">${escapeHTML(c[2])}</span></div>`).join('')}
      </div>
    `);
  }

  // -----------------------------------------------------------
  // DESEMPENHO POR PLATAFORMA (Instagram vs TikTok)
  // Mostra cada rede separada e explica o que cada uma mede — já que
  // o TikTok do Windsor não traz comentários/compartilhamentos por vídeo.
  // -----------------------------------------------------------
  function sectionPlataformas(posts) {
    if (!posts.length) return card('Instagram x TikTok', emptyData('Conecte o Windsor (Instagram e TikTok) ou importe os CSVs pra comparar as duas redes.'));
    const rows = byDimension(posts, p => p.platform, k => PLATFORM_LABEL[k] || k);
    if (rows.length < 1) return '';

    const blocks = rows.map(r => {
      const sub = posts.filter(p => p.platform === r.key);
      const topFmt = byType(sub)[0];
      const topOcc = byDimension(sub, p => p.theme, occasionLabel)[0];
      const isTk = r.key === 'tiktok';
      return `
        <div class="sa-plat">
          <div class="sa-plat__head">${PLATFORM_EMOJI[r.key] || '📱'} <strong>${escapeHTML(r.label)}</strong>
            <span class="sa-muted">· ${r.n} posts</span></div>
          <div class="sa-metricgrid">
            <div class="sa-metric"><span class="sa-metric__v">${fmtNum(sum(sub.map(reachOf)))}</span><span class="sa-metric__k">Alcance</span></div>
            <div class="sa-metric"><span class="sa-metric__v">${fmtPct(r.rate)}</span><span class="sa-metric__k">Taxa de engajamento</span></div>
            <div class="sa-metric"><span class="sa-metric__v">${fmtNum(sum(sub.map(p => p.saves)))}</span><span class="sa-metric__k">Salvamentos</span></div>
            <div class="sa-metric"><span class="sa-metric__v">${fmtNum(r.conversions)}</span><span class="sa-metric__k">Conversões</span></div>
          </div>
          <p class="sa-muted" style="margin-top:8px;">
            Melhor formato: <strong>${topFmt ? escapeHTML(topFmt.label) : '—'}</strong> ·
            Melhor ocasião: <strong>${topOcc ? escapeHTML(topOcc.label) : '—'}</strong>.
            ${isTk
              ? 'No TikTok o engajamento é estimado por <strong>curtidas + favoritos</strong> (o conector não traz comentários/compartilhamentos por vídeo).'
              : 'No Instagram temos o engajamento completo (curtidas, comentários, salvamentos, compartilhamentos).'}
          </p>
        </div>`;
    }).join('');

    return card('Instagram x TikTok — visão por rede', `
      <p class="sa-muted">Os números abaixo são <strong>separados por rede</strong>. Compare onde cada formato e ocasião performa melhor em cada plataforma.</p>
      ${blocks}
    `);
  }

  // Tabela genérica de performance por dimensão.
  function dimensionTable(rows, firstColLabel, withEmoji) {
    if (!rows.length) return null;
    const body = rows.map(r => `<tr>
      <td>${withEmoji ? occasionEmoji(r.key) + ' ' : ''}${escapeHTML(r.label)}</td>
      <td class="sa-num">${r.n}</td>
      <td class="sa-num">${fmtNum(r.reachAvg)}</td>
      <td class="sa-num">${fmtPct(r.rate)}</td>
      <td class="sa-num">${fmtNum(r.savesAvg)}</td>
      <td class="sa-num">${fmtNum(r.sharesAvg)}</td>
      <td class="sa-num">${fmtNum(r.followers)}</td>
      <td class="sa-num">${fmtNum(r.conversions)}</td>
    </tr>`).join('');
    return `<div class="sa-tablewrap"><table class="sa-table">
      <thead><tr>
        <th>${escapeHTML(firstColLabel)}</th><th class="sa-num">Posts</th>
        <th class="sa-num">Alcance méd.</th><th class="sa-num">Taxa eng.</th>
        <th class="sa-num">Saves méd.</th><th class="sa-num">Shares méd.</th>
        <th class="sa-num">Seguidores</th><th class="sa-num">Conversões</th>
      </tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // -----------------------------------------------------------
  // DESEMPENHO POR DIMENSÃO (formato / ocasião / experiência / campanha)
  // -----------------------------------------------------------
  function sectionDimensoes(posts) {
    if (!posts.length) return card('Desempenho por dimensão', emptyData('Sem dados pra cruzar formato, ocasião, experiência e campanha.'));

    const fmtRows = byDimension(posts, p => p.type, k => TYPE_LABEL[k] || k);
    const occRows = byDimension(posts, p => p.theme, occasionLabel);
    const expRows = byDimension(posts, p => p.experience, k => k);
    const cmpRows = byDimension(posts, p => p.campaign, k => k);

    const block = (title, table, emptyMsg) => `<h4 class="sa-h4">${title}</h4>${table || `<p class="sa-empty">${escapeHTML(emptyMsg)}</p>`}`;

    return card('Desempenho por dimensão', `
      ${block('Por formato', dimensionTable(fmtRows, 'Formato', false), 'Sem dados de formato.')}
      ${block('Por ocasião / tema', dimensionTable(occRows, 'Ocasião', true), 'Nenhuma ocasião classificada ainda — taggeie os posts ou deixe o auto-classificador detectar pela legenda.')}
      ${block('Por experiência', dimensionTable(expRows, 'Experiência', false), 'Preencha o campo "Experiência" nos posts pra ver quais experiências da Elarah mais performam.')}
      ${block('Por campanha', dimensionTable(cmpRows, 'Campanha', false), 'Preencha o campo "Campanha" (ou use utm_campaign no CSV) pra comparar campanhas.')}
    `);
  }

  // -----------------------------------------------------------
  // ANÁLISE DEDICADA POR OCASIÃO (item #2)
  // Lê melhor ocasião por interesse (engajamento) e por reserva
  // (conversão), e aponta ocasiões inexploradas.
  // -----------------------------------------------------------
  function sectionOcasioes(posts) {
    const all = occasions();
    if (!all.length) return '';
    const rows = byDimension(posts, p => p.theme, occasionLabel);
    const usados = new Set(rows.map(r => r.key));
    const inexplorados = all.filter(o => !usados.has(o.key));

    if (!rows.length) {
      return card('Inteligência por ocasião — Elarah', `
        <p class="sa-muted">Ainda não há posts classificados por ocasião. Conforme você importar/taggear, esta seção mostra qual ocasião gera mais interesse e mais reservas.</p>
        <h4 class="sa-h4">Ocasiões a cobrir</h4>
        <p>${all.map(o => `<span class="sa-tag">${o.emoji} ${escapeHTML(o.label)}</span>`).join(' ')}</p>
      `);
    }

    const topInteresse = [...rows].sort((a, b) => b.rate - a.rate)[0];
    const topReserva = [...rows].filter(r => r.conversions > 0).sort((a, b) => b.conversions - a.conversions)[0];
    const topSeguidor = [...rows].filter(r => r.followers > 0).sort((a, b) => b.followers - a.followers)[0];

    return card('Inteligência por ocasião — Elarah', `
      <div class="sa-kv"><span class="sa-kv__k">🔥 Mais interesse</span><span class="sa-kv__v">${topInteresse ? `${occasionEmoji(topInteresse.key)} <strong>${escapeHTML(topInteresse.label)}</strong> — ${fmtPct(topInteresse.rate)} de engajamento` : '—'}</span></div>
      <div class="sa-kv"><span class="sa-kv__k">💰 Mais reservas</span><span class="sa-kv__v">${topReserva ? `${occasionEmoji(topReserva.key)} <strong>${escapeHTML(topReserva.label)}</strong> — ${fmtNum(topReserva.conversions)} conversões` : 'Sem conversões registradas (configure UTM/reservas).'}</span></div>
      <div class="sa-kv"><span class="sa-kv__k">📈 Mais seguidores</span><span class="sa-kv__v">${topSeguidor ? `${occasionEmoji(topSeguidor.key)} <strong>${escapeHTML(topSeguidor.label)}</strong> — ${fmtNum(topSeguidor.followers)} novos` : '—'}</span></div>
      <h4 class="sa-h4">Ocasiões ainda não exploradas</h4>
      ${inexplorados.length
        ? `<p>${inexplorados.map(o => `<span class="sa-tag">${o.emoji} ${escapeHTML(o.label)}</span>`).join(' ')}</p>
           <p class="sa-muted">Cada ocasião acima é um calendário de conteúdo + oferta que você ainda não está capturando. Priorize as próximas datas no calendário.</p>`
        : '<p class="sa-muted">Todas as ocasiões já têm conteúdo. Foco passa a ser otimizar a conversão de cada uma.</p>'}
    `);
  }

  // -----------------------------------------------------------
  // RELATÓRIO COMPLETO
  // -----------------------------------------------------------
  function buildReport() {
    const posts = loadPosts();
    const rawBrand = loadBrand();
    // Visão achatada do brand pra plataforma ativa — assim todas as
    // sections continuam consumindo brand.username/.link/.bio/.destaques
    // como antes, mas vêm da rede certa.
    const brand = brandForPlatform(rawBrand, rawBrand.activePlatform);
    // Contagem por rede pra deixar explícito de onde vêm os dados.
    const byNet = {};
    posts.forEach(p => { byNet[p.platform] = (byNet[p.platform] || 0) + 1; });
    const netLine = Object.keys(byNet).length
      ? Object.keys(byNet).map(k => `${PLATFORM_EMOJI[k] || ''} ${PLATFORM_LABEL[k] || k}: ${byNet[k]}`).join('  ·  ')
      : 'sem dados';
    const activeLabel = PLATFORM_LABEL[brand._platform] || brand._platform;
    const activeEmoji = PLATFORM_EMOJI[brand._platform] || '';
    const head = `
      <div class="sa-report__head">
        <div>
          <h2 class="sa-report__title">Análise estratégica — @${escapeHTML(brand.username || brand.nome || '')}</h2>
          <p class="sa-muted">
            Perfil analisado: ${activeEmoji} <strong>${escapeHTML(activeLabel)}</strong> ·
            Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${posts.length} posts · ${netLine}
          </p>
        </div>
      </div>`;
    return head +
      sectionMetricas(posts) +
      sectionPlataformas(posts) +
      sectionPosicionamento(brand, posts) +
      sectionBio(brand) +
      sectionConteudo(posts) +
      sectionEngajamento(posts) +
      sectionDimensoes(posts) +
      sectionOcasioes(posts) +
      sectionFunil(posts, brand) +
      sectionConcorrencia(brand) +
      sectionOportunidades(posts, brand) +
      sectionPlano(posts, brand) +
      sectionCalendario(posts, brand) +
      sectionResumo(posts, brand);
  }

  // -----------------------------------------------------------
  // FORMULÁRIO DE PERFIL DA MARCA
  // -----------------------------------------------------------
  function brandFormHTML(brand) {
    const f = (id, label, val, ph = '') =>
      `<label class="sa-field"><span>${label}</span><input id="${id}" value="${escapeHTML(val)}" placeholder="${escapeHTML(ph)}"></label>`;
    const ta = (id, label, val, ph = '') =>
      `<label class="sa-field sa-field--full"><span>${label}</span><textarea id="${id}" rows="3" placeholder="${escapeHTML(ph)}">${escapeHTML(val)}</textarea></label>`;

    const active = brand.activePlatform === 'tiktok' ? 'tiktok' : 'instagram';
    const ig = (brand.byPlatform && brand.byPlatform.instagram) || {};
    const tt = (brand.byPlatform && brand.byPlatform.tiktok)    || {};
    const per = active === 'tiktok' ? tt : ig;

    const tab = (id, label) =>
      `<button type="button" class="sa-tab ${active === id ? 'sa-tab--active' : ''}" data-platform="${id}">${label}</button>`;

    // Campos por plataforma — Destaques só existe no Instagram.
    const perPlatformFields = active === 'instagram'
      ? `
          ${f('sa-username',  'Username (@)',           per.username,  'elarahoficial')}
          ${f('sa-link',      'Link na bio',            per.link,      'https://...')}
          ${f('sa-destaques', 'Destaques (vírgula)',    per.destaques, 'Comece aqui, Avaliações, Ofertas, FAQ')}
        `
      : `
          ${f('sa-username', 'Username (@)', per.username, 'elarahoficial')}
          ${f('sa-link',     'Link na bio',  per.link,     'https://...')}
        `;

    return `
      <div class="sa-brandform" id="sa-brandform">
        <h3 class="sa-card__title">Perfil da marca <small class="sa-muted">(alimenta as seções qualitativas)</small></h3>

        <h4 class="sa-h4">Comum às duas redes</h4>
        <div class="sa-grid sa-grid--two">
          ${f('sa-nome',  'Nome (campo pesquisável)', brand.nome,  'Ex: Elarah | Presentes & Experiências')}
          ${f('sa-vende', 'O que vende',              brand.vende, 'Experiências e presentes')}
        </div>
        ${ta('sa-proposta',    'Proposta de valor (1 frase)',     brand.proposta,    'O que você entrega + pra quem + diferencial')}
        ${ta('sa-concorrentes','Concorrentes percebidos (vírgula)', brand.concorrentes, '@concorrente1, @concorrente2')}
        <label class="sa-check"><input type="checkbox" id="sa-temfoto" ${brand.temFoto ? 'checked' : ''}> Tem foto de perfil profissional/legível</label>

        <h4 class="sa-h4" style="margin-top:20px">Por plataforma</h4>
        <div class="sa-tabs" id="sa-platform-tabs">
          ${tab('instagram', 'Instagram')}
          ${tab('tiktok',    'TikTok')}
        </div>
        <div class="sa-grid ${active === 'tiktok' ? 'sa-grid--two' : ''}">
          ${perPlatformFields}
        </div>
        ${ta('sa-bio', 'Bio atual', per.bio, 'Cole a bio exata do perfil')}

        <p class="sa-muted" style="margin-top:8px">
          💡 O <strong>público-alvo</strong> agora é inferido automaticamente pela análise — não precisa preencher.
        </p>

        <div class="sa-brandform__actions">
          <button class="admin__add-btn" id="sa-generate" type="button">Gerar análise</button>
        </div>
      </div>`;
  }

  // Lê o form e GRUDA os valores da aba atual no brand existente, pra
  // não apagar o que estava preenchido na outra aba.
  function readBrandForm(existing) {
    const v = (id) => (document.getElementById(id) || {}).value || '';
    const base = existing && existing.byPlatform ? existing : loadBrand();
    const active = base.activePlatform === 'tiktok' ? 'tiktok' : 'instagram';

    const newBrand = Object.assign({}, base, {
      nome:         v('sa-nome'),
      vende:        v('sa-vende'),
      proposta:     v('sa-proposta'),
      concorrentes: v('sa-concorrentes'),
      temFoto:      !!(document.getElementById('sa-temfoto') || {}).checked,
      activePlatform: active,
      byPlatform: Object.assign({}, base.byPlatform),
    });
    const perOld = newBrand.byPlatform[active] || {};
    const perNew = {
      username: v('sa-username').replace(/^@/, ''),
      link:     v('sa-link'),
      bio:      v('sa-bio'),
    };
    if (active === 'instagram') perNew.destaques = v('sa-destaques');
    else perNew.destaques = perOld.destaques || ''; // TikTok não tem destaques no form
    newBrand.byPlatform[active] = Object.assign({}, perOld, perNew);
    return newBrand;
  }

  // -----------------------------------------------------------
  // RENDER / OPEN / CLOSE
  // -----------------------------------------------------------
  function getContainer() { return document.getElementById('social-analysis'); }

  function open() {
    const panel = document.getElementById('panel-social');
    if (!panel) return;
    const dash = document.getElementById('social-dashboard');
    const empty = document.getElementById('social-empty');
    const cont = getContainer();
    if (!cont) return;
    if (dash) dash.style.display = 'none';
    if (empty) empty.style.display = 'none';
    cont.style.display = 'block';
    render();
    cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function close() {
    const cont = getContainer();
    if (cont) cont.style.display = 'none';
    if (window.ElarahSocial && window.ElarahSocial.render) window.ElarahSocial.render();
  }

  function render() {
    const cont = getContainer();
    if (!cont) return;
    const brand = loadBrand();
    cont.innerHTML = `
      <div class="sa-toolbar">
        <button class="admin__add-btn admin__add-btn--ghost" id="sa-back" type="button">← Voltar ao dashboard</button>
        <div class="sa-toolbar__right">
          <button class="admin__add-btn admin__add-btn--ghost" id="sa-copy" type="button">⧉ Copiar relatório</button>
          <button class="admin__add-btn admin__add-btn--ghost" id="sa-print" type="button">🖨 Imprimir / PDF</button>
        </div>
      </div>
      ${brandFormHTML(brand)}
      <div class="sa-report" id="sa-report">${buildReport()}</div>
    `;
    bindReportUI();
  }

  function regenerate() {
    const existing = loadBrand();
    const brand = readBrandForm(existing);
    saveBrand(brand);
    const rep = document.getElementById('sa-report');
    if (rep) rep.innerHTML = buildReport();
    bindReportUI(); // re-bind nada extra, mas mantém consistência
  }

  // Troca de aba do form: salva o que foi digitado na aba atual,
  // atualiza activePlatform, re-renderiza o form inteiro (sem re-gerar
  // o relatório — usuário ainda não pediu).
  function switchPlatformTab(target) {
    if (target !== 'instagram' && target !== 'tiktok') return;
    const existing = loadBrand();
    if (existing.activePlatform === target) return;
    const captured = readBrandForm(existing);
    captured.activePlatform = target;
    saveBrand(captured);
    const form = document.getElementById('sa-brandform');
    if (!form) return;
    // Recria o form inteiro pra refletir a aba ativa
    const wrap = document.createElement('div');
    wrap.innerHTML = brandFormHTML(captured);
    form.replaceWith(wrap.firstElementChild);
    bindReportUI();
  }

  function bindReportUI() {
    const back = document.getElementById('sa-back');
    if (back) back.onclick = close;
    const gen = document.getElementById('sa-generate');
    if (gen) gen.onclick = regenerate;
    // Tabs de plataforma do form
    const tabsWrap = document.getElementById('sa-platform-tabs');
    if (tabsWrap) {
      tabsWrap.querySelectorAll('[data-platform]').forEach(btn => {
        btn.onclick = () => switchPlatformTab(btn.getAttribute('data-platform'));
      });
    }
    const print = document.getElementById('sa-print');
    if (print) print.onclick = () => window.print();
    const copy = document.getElementById('sa-copy');
    if (copy) copy.onclick = () => {
      const rep = document.getElementById('sa-report');
      const text = rep ? rep.innerText : '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(
          () => { copy.textContent = '✓ Copiado'; setTimeout(() => copy.textContent = '⧉ Copiar relatório', 1800); },
          () => alert('Não foi possível copiar.')
        );
      }
    };
  }

  // Botão de abertura no header do painel.
  function bindOpenButton() {
    const btn = document.getElementById('btn-social-analysis');
    if (btn && !btn._saBound) {
      btn._saBound = true;
      btn.addEventListener('click', open);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindOpenButton);
  } else {
    bindOpenButton();
  }

  window.ElarahSocialAnalysis = { open, close, render, buildCalendarPlan };
})();
