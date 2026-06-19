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

  // -----------------------------------------------------------
  // TAXONOMIA DE OCASIÕES DA ELARAH (item #2)
  // Vocabulário controlado pra classificar conteúdo por ocasião /
  // motivação de presente/experiência. Cada ocasião tem palavras-chave
  // usadas pra auto-classificar posts a partir de tags/legenda na
  // importação. Fonte única — alimenta o <select> do modal, o
  // auto-tagging e a análise "performance por ocasião".
  // -----------------------------------------------------------
  const OCCASIONS = [
    { key: 'namorados',   label: 'Dia dos Namorados',     emoji: '❤️', kw: ['namorado', 'namorada', 'dia dos namorados', 'romance', 'romantico', 'romântico', 'casal', 'amor'] },
    { key: 'galentine',   label: "Galentine's / Singles", emoji: '💛', kw: ['galentine', 'singles day', 'singles', 'single', 'solteir', 'self love', 'selflove'] },
    { key: 'maes',        label: 'Dia das Mães',          emoji: '🌷', kw: ['mãe', 'mae', 'maes', 'mães', 'dia das mães', 'mamãe', 'mamae', 'materna'] },
    { key: 'pais',        label: 'Dia dos Pais',          emoji: '👔', kw: ['pai', 'pais', 'dia dos pais', 'papai', 'paterno'] },
    { key: 'aniversario', label: 'Aniversário',           emoji: '🎂', kw: ['aniversário', 'aniversario', 'niver', 'birthday', 'parabéns', 'parabens'] },
    { key: 'autopresente',label: 'Autopresente',          emoji: '🎁', kw: ['autopresente', 'auto presente', 'self gift', 'pra mim', 'me presentear', 'autocuidado'] },
    { key: 'amigas',      label: 'Experiências c/ amigas', emoji: '👯', kw: ['amigas', 'amigos', 'role', 'rolê', 'turma', 'girls', 'amizade'] },
    { key: 'date',        label: 'Date',                  emoji: '🍷', kw: ['date', 'encontro', 'primeiro encontro', 'a dois', 'date night'] },
    { key: 'familia',     label: 'Família',               emoji: '👨‍👩‍👧', kw: ['família', 'familia', 'familiar', 'em casa', 'reunião', 'reuniao'] },
    { key: 'kids',        label: 'Kids',                  emoji: '🧒', kw: ['kids', 'criança', 'crianca', 'infantil', 'filho', 'filha', 'família com crianças'] },
    { key: 'corporativo', label: 'Corporativo',           emoji: '💼', kw: ['corporativo', 'empresa', 'b2b', 'team building', 'confraternização', 'confraternizacao', 'rh', 'colaboradores'] },
    { key: 'bemestar',    label: 'Bem-estar',             emoji: '🧘', kw: ['bem-estar', 'bem estar', 'relax', 'spa', 'massagem', 'autocuidado', 'wellness', 'mindfulness'] },
    { key: 'criatividade',label: 'Criatividade',          emoji: '🎨', kw: ['criatividade', 'workshop', 'oficina', 'arte', 'pintura', 'ceramica', 'cerâmica', 'diy', 'mão na massa', 'mao na massa'] },
    { key: 'gastronomia', label: 'Gastronomia',           emoji: '🍽️', kw: ['gastronomia', 'comida', 'jantar', 'degustação', 'degustacao', 'harmonização', 'harmonizacao', 'drinks', 'culinária', 'culinaria', 'chef', 'restaurante'] },
  ];

  const OCCASION_LABEL = OCCASIONS.reduce((m, o) => (m[o.key] = o.label, m), {});

  // Auto-classifica uma ocasião a partir de texto livre (tags + legenda
  // + tema/experiência/campanha). Retorna a key da ocasião ou ''.
  // Casa por PALAVRA INTEIRA (não pedaço): normaliza tudo em tokens
  // separados por espaço e procura o termo cercado por espaços. Evita
  // falsos positivos tipo "uNIVERso" virar "niver"/aniversário ou
  // "São Paulo" casar "spa". Sem lookbehind (compatível com Safari antigo).
  function inferOccasion(text) {
    const direct = String(text || '').trim().toLowerCase();
    if (!direct) return '';
    const hay = ' ' + direct.replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
    for (const o of OCCASIONS) {
      if (o.key === direct) return o.key;          // já é a key da taxonomia
      for (const k of o.kw) {
        const token = ' ' + k.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
        if (hay.includes(token)) return o.key;
      }
    }
    return '';
  }

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
  // Normaliza qualquer objeto em post válido. Tolerante: aceita o
  // schema nativo e também linhas já mapeadas do Windsor AI. Como o
  // Windsor está plugado ao Instagram, plataforma/tipo ausentes caem
  // em defaults sensatos (instagram / feed) em vez de descartar a linha.
  // Campos numéricos passam por parseNum (lida com separador de milhar,
  // sufixo k/m e vazios). Schema escalável: além das métricas básicas,
  // guarda alcance, seguidores, visitas ao perfil, cliques, conversões
  // e as dimensões tema / experiência / campanha pra análise cruzada.
  function normalizePost(raw) {
    if (!raw || typeof raw !== 'object') return null;
    let platform = mapPlatform(raw.platform) || 'instagram';
    let type = mapMediaType(raw.type) || 'feed';
    const date = parseDateISO(raw.date);
    if (!date) return null;

    const tags = normalizeTags(raw.tags);
    const caption = raw.caption ? String(raw.caption).slice(0, 2000) : '';
    const experience = raw.experience ? String(raw.experience).trim() : '';
    const campaign = raw.campaign ? String(raw.campaign).trim() : '';

    // Ocasião/tema: se vier explícito, normaliza pra key da taxonomia;
    // senão, infere do texto livre (tags + legenda + experiência + campanha).
    let theme = raw.theme ? String(raw.theme).trim() : '';
    if (theme) {
      theme = inferOccasion(theme) || theme.toLowerCase();
    } else {
      theme = inferOccasion([tags.join(' '), caption, experience, campaign].join(' '));
    }

    return {
      id:            raw.id || uid(),
      platform,
      type,
      date,
      link:          raw.link ? String(raw.link) : '',
      caption,
      tags,
      // Métricas de alcance/engajamento
      views:         parseNum(raw.views),
      reach:         parseNum(raw.reach),
      likes:         parseNum(raw.likes),
      comments:      parseNum(raw.comments),
      saves:         parseNum(raw.saves),
      shares:        parseNum(raw.shares),
      interactions:  parseNum(raw.interactions),
      // Métricas de crescimento e conversão
      followers:     parseNum(raw.followers),
      profileVisits: parseNum(raw.profileVisits),
      linkClicks:    parseNum(raw.linkClicks),
      conversions:   parseNum(raw.conversions),
      // Dimensões de análise da Elarah
      theme,
      experience,
      campaign,
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
    const breakdown = (p.likes || 0) + (p.comments || 0) + (p.saves || 0) + (p.shares || 0);
    // Usa o maior entre o detalhamento e "Interações totais" (Windsor).
    // Cobre os 3 casos: só detalhamento, só total, ou total + detalhamento
    // parcial (ex: CSV com shares/saves mas sem likes/comments — aí o
    // total do Windsor é mais fiel que a soma parcial).
    return Math.max(breakdown, p.interactions || 0);
  }

  // Alcance efetivo: prefere o campo "reach"/"Alcance" quando existe;
  // senão cai em views (Vistas/Visualizações) como aproximação.
  function reachOf(p) {
    return (p.reach || 0) > 0 ? p.reach : (p.views || 0);
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

  // ===========================================================
  // BLOCO 1.2 — MAPEAMENTO WINDSOR AI
  // Dicionário que reconhece os nomes de coluna exportados pelo
  // Windsor AI (em PT-BR e EN) e os converte pro schema interno.
  // Objetivo: o admin exporta o CSV do Windsor e importa aqui SEM
  // editar nada. Várias colunas Windsor podem cair no mesmo campo
  // canônico (ex: "Vistas" e "Visualizações da história" → views):
  // nesse caso pegamos o maior valor não-nulo da linha.
  // ===========================================================

  // Cada chave é o campo canônico interno; os valores são os
  // cabeçalhos (em minúsculas) que mapeiam pra ele.
  const FIELD_ALIASES = {
    // OBS: "dia da semana e número do dia" (ex: "2 terça-feira") NÃO é data
    // e foi deixado de fora de propósito — ele sequestrava o campo de data.
    id: ['id da mídia', 'id da midia', 'media id', 'media_id', 'id da publicação', 'id da publicacao'],
    date: ['date', 'data', 'timestamp', 'data de publicação', 'data de publicacao',
           'publish date', 'created_time', 'post date', 'mídia criada', 'midia criada',
           'media created', 'ano mês', 'ano mes',
           // TikTok (conector Windsor): nome cru "video_create_datetime"
           // — o fallback tira o prefixo "video_" e sobra "create_datetime".
           'create_datetime', 'video_create_datetime', 'create datetime',
           'data de criação', 'data de criacao', 'data de criação do vídeo',
           'data de criacao do video', 'tempo de criação do vídeo', 'tempo de criacao do video'],
    platform: ['platform', 'plataforma', 'source', 'data source', 'datasource', 'fonte', 'fonte de dados', 'rede', 'rede social', 'canal'],
    type: ['type', 'tipo', 'tipo de mídia', 'tipo de midia', 'media type', 'media_type',
           'tipo de produto de mídia', 'tipo de produto de midia', 'media product type',
           'formato', 'format', 'tipo de publicação', 'tipo de publicacao', 'product type'],
    link: ['link', 'permalink', 'url', 'post url', 'link do post', 'media url', 'media_url', 'shortcode url',
           'url permanente para a mídia', 'url permanente para a midia',
           'link permanente para a mídia', 'link permanente para a midia',
           'url da mídia', 'url da midia',
           // TikTok (conector Windsor): "video_share_url" → "share_url"
           'share_url', 'video_share_url', 'url de compartilhamento de vídeo',
           'url de compartilhamento de video', 'url de compartilhamento'],
    caption: ['caption', 'legenda', 'legenda da mídia', 'legenda da midia', 'legenda do vídeo',
              'legenda do video', 'texto', 'descrição', 'descricao', 'description', 'mensagem',
              'conteúdo', 'conteudo'],
    tags: ['tags', 'etiquetas', 'hashtags', 'hashtag', 'palavras-chave', 'palavras chave', 'keywords'],
    views: ['views', 'vistas', 'visualizações', 'visualizacoes', 'visualizações da história',
            'visualizacoes da historia', 'story_views', 'opiniões da mídia', 'opinioes da midia',
            'video views', 'video_views', 'plays', 'reproduções', 'reproducoes',
            'impressions', 'impressões', 'impressoes', 'impressions_total',
            'contagem total de visualizações de vídeos', 'contagem total de visualizacoes de videos',
            'contagem de visualizações de vídeo', 'contagem de visualizacoes de video',
            'visualizações de vídeo', 'visualizacoes de video',
            // TikTok: views POR vídeo é "video_views_count" (tabela Video).
            // O "video_views" cru é total da CONTA — não usar por post.
            'views_count', 'video_views_count'],
    reach: ['reach', 'alcance', 'alcance da mídia', 'alcance da midia', 'contas alcançadas',
            'contas alcancadas', 'accounts reached', 'reached accounts', 'accounts_reached',
            'público alcançado diariamente', 'publico alcancado diariamente',
            // TikTok: alcance único por vídeo (tabela Video).
            'video_reach'],
    likes: ['likes', 'curtidas', 'contagem de curtidas na mídia', 'contagem de curtidas na midia',
            'like count', 'like_count', 'curtidas totais', 'total de curtidas', 'total_likes',
            'curtidas do vídeo', 'curtidas do video'],
    comments: ['comments', 'comentários', 'comentarios', 'contagem de comentários', 'contagem de comentarios',
               'comment count', 'comment_count', 'respostas da história', 'respostas da historia',
               'respostas', 'replies', 'story_replies', 'comments_count'],
    saves: ['saves', 'salvamentos', 'salvos', 'mídia salva', 'midia salva', 'saved', 'bookmarks',
            'itens salvos', 'saved_count', 'contagem total de vídeos favoritos',
            'contagem total de videos favoritos', 'vídeos favoritos', 'videos favoritos',
            'favoritos', 'favorites', 'video_favorites'],
    shares: ['shares', 'compartilhamentos', 'compartilhamentos de mídia', 'compartilhamentos de midia',
             'compartilhamento de histórias', 'compartilhamento de historias',
             'compartilhamentos de histórias', 'compartilhamentos de historias', 'shares totais',
             'story_shares', 'shares_count', 'compartilhamentos de vídeo', 'compartilhamentos de video'],
    interactions: ['interações totais', 'interacoes totais', 'engajamento com a mídia', 'engajamento com a midia',
                   'interactions', 'total interactions', 'total_interactions', 'engajamento',
                   'engagement', 'engajamento total', 'total engagement', 'público engajado', 'publico engajado'],
    followers: ['followers', 'seguidores', 'novos seguidores', 'novos seguidores (1 dia)', 'follows',
                'follower growth', 'crescimento de seguidores', 'seguidores ganhos', 'net followers',
                'follows totais', 'contagem diária de seguidores conquistados',
                'contagem diaria de seguidores conquistados', 'contagem de seguidores conquistados'],
    profileVisits: ['profile visits', 'visitas ao perfil', 'profile views', 'profile_views',
                    'visualizações do perfil', 'visualizacoes do perfil', 'visitas de perfil',
                    'visualizações de perfil', 'visualizacoes de perfil'],
    linkClicks: ['link clicks', 'cliques no link', 'site vinculado', 'links de perfil', 'website clicks',
                 'website_clicks', 'cliques no site', 'link_clicks', 'cliques no website',
                 'cliques em sites de vídeo', 'cliques em sites de video', 'cliques no site de vídeo',
                 'cliques no endereço do vídeo', 'cliques no endereco do video',
                 'cliques no link da bio', 'bio_link_clicks', 'website taps', 'toques no site'],
    conversions: ['conversions', 'conversões', 'conversoes', 'reservas', 'bookings', 'vendas',
                  'purchases', 'compras', 'pedidos', 'reservas confirmadas'],
    username: ['username', 'nome de usuário do instagram', 'nome de usuario do instagram',
               'nome de usuário do instagram (pseudônimo)', 'nome de usuario do instagram (pseudonimo)',
               'nome de usuário', 'nome de usuario', 'nome da conta', 'nome de exibição', 'nome de exibicao',
               'account', 'conta', 'usuário', 'usuario', 'user', 'perfil'],
    theme: ['theme', 'tema', 'assunto', 'topic', 'tópico', 'topico', 'ocasião', 'ocasiao', 'occasion'],
    experience: ['experience', 'experiência', 'experiencia', 'produto', 'product', 'serviço', 'servico'],
    campaign: ['campaign', 'campanha', 'utm_campaign', 'campaign name', 'nome da campanha', 'utm campaign'],
  };

  // Campos numéricos (quando duas colunas mapeiam pro mesmo, pega o maior).
  const NUMERIC_FIELDS = new Set([
    'views', 'reach', 'likes', 'comments', 'saves', 'shares', 'interactions',
    'followers', 'profileVisits', 'linkClicks', 'conversions',
  ]);

  // Índice reverso: cabeçalho → campo canônico (construído 1x).
  const HEADER_INDEX = (function () {
    const idx = {};
    Object.keys(FIELD_ALIASES).forEach(canon => {
      FIELD_ALIASES[canon].forEach(alias => { idx[alias] = canon; });
    });
    return idx;
  })();

  function canonicalField(header) {
    const h = String(header || '').trim().toLowerCase();
    if (HEADER_INDEX[h]) return HEADER_INDEX[h];
    // Fallback: o Windsor exporta nomes técnicos prefixados
    // (media_caption, media_like_count, story_permalink…). Remove o
    // prefixo media_/story_/ig_ e tenta de novo — pega qualquer variante.
    const stripped = h.replace(/^(media|story|video|vídeo|ig|instagram|tiktok)[ _]/, '');
    if (stripped !== h && HEADER_INDEX[stripped]) return HEADER_INDEX[stripped];
    return null;
  }

  // Mapeia "Tipo de mídia" do Windsor (IMAGE/VIDEO/CAROUSEL_ALBUM/REELS/STORY
  // e variações PT) pros tipos internos.
  const MEDIA_TYPE_MAP = {
    image: 'feed', imagem: 'feed', photo: 'feed', foto: 'feed', picture: 'feed', post: 'feed',
    video: 'video', 'vídeo': 'video',
    carousel: 'carrossel', carousel_album: 'carrossel', 'carousel album': 'carrossel',
    carrossel: 'carrossel', album: 'carrossel', 'álbum': 'carrossel', 'albúm': 'carrossel',
    reel: 'reel', reels: 'reel',
    story: 'story', stories: 'story', 'história': 'story', historia: 'story',
    'histórias': 'story', historias: 'story', storie: 'story',
    feed: 'feed', text: 'feed', link: 'feed', article: 'feed',
  };

  function mapMediaType(v) {
    const k = String(v || '').trim().toLowerCase();
    if (!k) return '';
    if (TYPE_LABEL[k]) return k;
    return MEDIA_TYPE_MAP[k] || '';
  }

  function mapPlatform(v) {
    const k = String(v || '').trim().toLowerCase();
    if (!k) return '';
    if (PLATFORM_LABEL[k]) return k;
    if (/tik\s*-?\s*tok/.test(k)) return 'tiktok';
    if (/linkedin/.test(k)) return 'linkedin';
    if (/instagram|\big\b|insta/.test(k)) return 'instagram';
    return '';
  }

  // Parser de número tolerante: lida com separador de milhar (1.234 / 1,234),
  // decimal (1,5), sufixo k/M e células vazias ("—", "n/a").
  function parseNum(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? Math.round(v) : 0;
    let s = String(v).trim().toLowerCase().replace(/\s/g, '');
    if (!s || s === '-' || s === '—' || s === 'n/a' || s === 'null') return 0;
    let mult = 1;
    if (/[kK]$/.test(s)) { mult = 1e3; s = s.slice(0, -1); }
    else if (/[mM]$/.test(s)) { mult = 1e6; s = s.slice(0, -1); }
    if (s.includes('.') && s.includes(',')) {
      // o último separador é o decimal
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (s.includes(',')) {
      const parts = s.split(',');
      s = (parts.length === 2 && parts[1].length <= 2) ? parts[0] + '.' + parts[1] : s.replace(/,/g, '');
    } else if (s.includes('.')) {
      const parts = s.split('.');
      // "1.234" ou "1.234.567" = milhar; "1.5" = decimal
      if (parts.length > 2 || (parts[1] && parts[1].length === 3)) s = s.replace(/\./g, '');
    }
    const n = parseFloat(s) * mult;
    return isFinite(n) && n >= 0 ? Math.round(n) : 0;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  // Converte várias formas de data pra ISO yyyy-mm-dd.
  function parseDateISO(v) {
    if (!v) return '';
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);            // ISO (com ou sem hora)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})/);    // yyyy/mm/dd
    if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
    m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/); // dd/mm/yyyy
    if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
    m = s.match(/^(\d{4})[-\/](\d{1,2})$/);                  // ano-mês (granularidade mensal)
    if (m) return `${m[1]}-${pad2(m[2])}-01`;
    const d = new Date(s);
    return isNaN(d) ? '' : d.toISOString().slice(0, 10);
  }

  // -----------------------------------------------------------
  // CSV PARSER / SERIALIZER
  // Implementação leve, suporta campos entre aspas com vírgulas.
  // Schema esperado (header obrigatório):
  //   platform,type,date,link,views,likes,comments,saves,shares,tags
  // -----------------------------------------------------------
  // Detecta o separador (vírgula, ponto-e-vírgula ou tab) olhando a
  // 1ª linha — Google Sheets/Excel em PT-BR costuma usar ";".
  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/, 1)[0] || '';
    const counts = { ',': 0, ';': 0, '\t': 0 };
    let inQ = false;
    for (const c of firstLine) {
      if (c === '"') inQ = !inQ;
      else if (!inQ && counts[c] != null) counts[c]++;
    }
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || ',';
  }

  // Diagnóstico amigável quando a importação não produz nenhum post.
  // Lê só o cabeçalho e diz o que está faltando (a causa nº1 é não ter
  // uma coluna de DATA real — só "dia da semana" não serve).
  function diagnoseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const delim = detectDelimiter(text);
    const header = (text.split(/\r?\n/, 1)[0] || '').split(delim)
      .map(h => h.replace(/^"|"$/g, '').trim());
    const found = header.map(canonicalField).filter(Boolean);
    const hasDate = found.includes('date');
    const hasMetric = found.some(f => NUMERIC_FIELDS.has(f));
    const recognized = [...new Set(found)];

    if (!hasDate) {
      return 'O CSV não tem uma coluna de DATA real.\n\n' +
             'Detectei: ' + (recognized.length ? recognized.join(', ') : 'nenhuma coluna conhecida') + '.\n\n' +
             'No Windsor, "dia da semana" (week_day_iso) NÃO é uma data. ' +
             'Adicione o campo "Date" (data de publicação) na seção Campos ' +
             'e troque a fonte de "Blended Data" para o Instagram.';
    }
    if (!hasMetric) {
      return 'Encontrei a data, mas nenhuma métrica reconhecida ' +
             '(views, alcance, curtidas, interações, etc.). ' +
             'Selecione as métricas na seção Campos do Windsor.';
    }
    return 'Cabeçalho reconhecido (' + recognized.join(', ') + '), mas as ' +
           'linhas estão sem data válida ou vazias. Confira se a pré-visualização ' +
           'do Windsor não está cheia de "nulo" (sintoma de Blended Data).';
  }

  function parseCSV(text, platformHint) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // remove BOM
    const delim = detectDelimiter(text);
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
        else if (c === delim) { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field); rows.push(row);
          row = []; field = '';
        } else { field += c; }
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];

    // Mapeia cada coluna do header pro campo canônico (nativo OU Windsor).
    const headers = rows[0];
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      if (cells.length === 1 && !cells[0].trim()) continue;
      const raw = {};
      headers.forEach((h, i) => { raw[h] = cells[i]; });
      const obj = canonicalizeRow(raw);
      if (platformHint && !obj.platform) obj.platform = platformHint;
      const post = normalizePost(obj);
      // Pula linhas vazias: sem legenda/tags e com todas as métricas zeradas
      // (ex: linhas de story que só trazem o permalink, sem dados).
      if (post && !isEmptyImport(post)) out.push(post);
    }
    return out;
  }

  // Converte um objeto de chaves arbitrárias (cabeçalhos de CSV ou campos
  // de JSON do Windsor) num objeto com as chaves canônicas internas.
  // Quando dois campos mapeiam pro mesmo canônico numérico, mantém o maior.
  function canonicalizeRow(raw) {
    const obj = {};
    for (const key in raw) {
      const canon = canonicalField(key);
      if (!canon) continue;
      const val = raw[key] == null ? '' : String(raw[key]).trim();
      if (!val) continue;
      if (NUMERIC_FIELDS.has(canon)) {
        const n = parseNum(val);
        if (n > (parseNum(obj[canon]) || 0)) obj[canon] = String(n);
      } else if (!obj[canon]) {
        obj[canon] = val;
      }
    }
    return obj;
  }

  function isEmptyImport(p) {
    if (p.caption || (p.tags && p.tags.length)) return false;
    const total = p.views + p.reach + p.likes + p.comments + p.saves + p.shares +
                  p.interactions + p.followers + p.profileVisits + p.linkClicks + p.conversions;
    return total === 0;
  }

  // Schema completo de exportação — round-trip de todas as dimensões.
  const CSV_COLUMNS = [
    'platform', 'type', 'date', 'link', 'theme', 'experience', 'campaign',
    'views', 'reach', 'likes', 'comments', 'saves', 'shares', 'interactions',
    'followers', 'profileVisits', 'linkClicks', 'conversions', 'tags',
  ];

  function toCSV(posts) {
    const lines = [CSV_COLUMNS.join(',')];
    posts.forEach(p => {
      const row = CSV_COLUMNS.map(col => {
        if (col === 'tags') return (p.tags || []).join(', ');
        return p[col] != null ? p[col] : '';
      }).map(csvCell).join(',');
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
  // BLOCO 1.5 — REMOTE (Supabase + Edge Functions)
  // ------------------------------------------------------------
  // Camada nova que pluga o painel ao backend de integração com
  // redes sociais. Quando há ao menos uma conta conectada via API
  // (Instagram pra começar), `loadPosts()` passa a devolver os
  // posts vindos do banco em vez do localStorage. Posts manuais
  // continuam funcionando (campo is_manual no banco).
  //
  // Compatibilidade:
  //   - Se window.supabaseClient não existir (offline / dev sem
  //     Supabase configurado), tudo recai pro localStorage. Zero
  //     regressão pro modo manual.
  //   - O cache `_remoteCache` é populado por `hydrateFromRemote()`
  //     antes de cada render. As funções de leitura síncrona
  //     (loadPosts) lêem desse cache.
  // ============================================================

  // Edge Functions vivem na mesma origem do Supabase.
  function getSupabaseUrl() {
    // Preferência: cliente já configurado.
    const sb = window.supabaseClient;
    if (sb && typeof sb.supabaseUrl === 'string') return sb.supabaseUrl;
    // Fallback: globais setados em supabase-client.js.
    if (typeof window.SUPABASE_URL === 'string') return window.SUPABASE_URL;
    return null;
  }

  function getSb() {
    return window.supabaseClient || null;
  }

  // Cache em memória do estado vindo do banco. Hidratado por
  // hydrateFromRemote(). loadPosts() lê daqui se há conexão ativa.
  const _remoteCache = {
    accounts: [],          // [{ id, provider, username, status, last_sync_at, ... }]
    posts:    [],          // posts já normalizados pro formato do painel
    loadedAt: 0,
    available: false,      // true se Supabase respondeu com sucesso ao menos 1x
  };

  // Converte uma linha de v_social_posts_enriched pro formato
  // que o resto do painel já consome.
  function remoteRowToPost(row) {
    if (!row) return null;
    const date = row.posted_at ? String(row.posted_at).slice(0, 10) : '';
    return {
      id:        row.id,
      platform: row.provider,
      type:     row.type,
      date,
      link:     row.permalink || '',
      tags:     Array.isArray(row.tags) ? row.tags : [],
      views:    Number(row.views)    || 0,
      likes:    Number(row.likes)    || 0,
      comments: Number(row.comments) || 0,
      saves:    Number(row.saves)    || 0,
      shares:   Number(row.shares)   || 0,
      _remote:  true,
      _isManual: !!row.is_manual,
    };
  }

  async function hydrateFromRemote() {
    const sb = getSb();
    if (!sb) return false;

    try {
      // Contas conectadas (view sem credenciais)
      const { data: accs, error: aErr } = await sb
        .from('v_social_accounts_safe')
        .select('*')
        .order('created_at', { ascending: true });
      if (aErr) throw aErr;
      _remoteCache.accounts = accs || [];

      // Posts vindos da API + manuais salvos no banco
      const { data: posts, error: pErr } = await sb
        .from('v_social_posts_enriched')
        .select('id, account_id, provider, external_id, permalink, type, posted_at, caption, views, likes, comments, saves, shares, tags, is_manual')
        .order('posted_at', { ascending: false })
        .limit(500);
      if (pErr) throw pErr;
      _remoteCache.posts = (posts || []).map(remoteRowToPost).filter(Boolean);
      _remoteCache.loadedAt = Date.now();
      _remoteCache.available = true;
      return true;
    } catch (err) {
      console.warn('[ElarahSocial] hidratação remota falhou — caindo no localStorage.', err);
      _remoteCache.available = false;
      return false;
    }
  }

  // Substitui loadPosts() quando há conexão ativa. Estratégia:
  //   - Conta conectada → usa banco (read-only pra posts da API)
  //   - Senão → localStorage (modo manual original)
  function effectivePostsSource() {
    if (_remoteCache.available && hasConnectedAccount()) return 'remote';
    return 'local';
  }

  function hasConnectedAccount() {
    return _remoteCache.accounts.some(a => a.status === 'active');
  }

  function getInstagramAccount() {
    return _remoteCache.accounts.find(
      a => a.provider === 'instagram' && a.status === 'active'
    ) || null;
  }

  // -----------------------------------------------------------
  // OAuth — inicia a conexão com Instagram via oauth-start.
  // -----------------------------------------------------------
  async function connectInstagram() {
    const sb = getSb();
    if (!sb) {
      alert('Cliente Supabase não está disponível nessa página.');
      return;
    }
    let session;
    try {
      const r = await sb.auth.getSession();
      session = r.data?.session;
    } catch {/* ignore */}
    if (!session) {
      alert('Sessão expirou. Faça login no admin novamente.');
      return;
    }

    const url = getSupabaseUrl();
    if (!url) { alert('SUPABASE_URL não encontrada.'); return; }

    try {
      const res = await fetch(`${url}/functions/v1/oauth-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          provider: 'instagram',
          return_to: window.location.href.split('?')[0],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('[ElarahSocial] conectar Instagram falhou:', err);
      alert('Não foi possível iniciar a conexão: ' + (err.message || err));
    }
  }

  // -----------------------------------------------------------
  // Sync manual — chama sync-instagram e renderiza de novo.
  // -----------------------------------------------------------
  async function syncNow(accountId) {
    const sb = getSb();
    if (!sb) return;
    let session;
    try {
      const r = await sb.auth.getSession();
      session = r.data?.session;
    } catch {/* ignore */}
    if (!session) { alert('Sessão expirou.'); return; }

    const url = getSupabaseUrl();
    const btn = document.getElementById('btn-social-sync');
    if (btn) { btn.disabled = true; btn.textContent = 'Sincronizando…'; }

    try {
      const res = await fetch(`${url}/functions/v1/sync-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ account_id: accountId, trigger: 'manual' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const totals = (data.results || []).reduce(
        (a, r) => ({
          inserted: a.inserted + (r.inserted || 0),
          updated:  a.updated  + (r.updated  || 0),
        }),
        { inserted: 0, updated: 0 },
      );
      showToast('ok',
        `Sincronizado: ${totals.inserted} novos · ${totals.updated} atualizados.`);
      await render();
    } catch (err) {
      console.error('[ElarahSocial] sync falhou:', err);
      showToast('error', 'Falha ao sincronizar: ' + (err.message || err));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '↻ Sincronizar agora'; }
    }
  }

  // -----------------------------------------------------------
  // Toast / banner pós-OAuth
  // -----------------------------------------------------------
  let _toastTimer = null;
  function showToast(kind, message) {
    const el = document.getElementById('social-toast');
    if (!el) return;
    el.className = 'social-toast social-toast--' + kind;
    el.textContent = message;
    el.style.display = 'block';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.display = 'none'; }, 6000);
  }

  function consumeOAuthRedirect() {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('social_connected');
    if (connected === null) return false;

    const provider = params.get('social_provider') || 'plataforma';
    const username = params.get('social_username') || '';
    const error    = params.get('social_error') || '';

    if (connected === '1') {
      showToast('ok',
        `${provider === 'instagram' ? 'Instagram' : provider} conectado${username ? ' como @' + username : ''}.`);
    } else {
      showToast('error', 'Conexão falhou: ' + (error || 'erro desconhecido.'));
    }
    // Limpa a URL pra não disparar de novo num refresh
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, clean);
    return true;
  }

  // -----------------------------------------------------------
  // Renderiza o card de status da(s) conexão(ões).
  // -----------------------------------------------------------
  function renderConnections() {
    const root = document.getElementById('social-connections');
    if (!root) return;
    if (!_remoteCache.accounts.length) {
      root.style.display = 'none';
      root.innerHTML = '';
      return;
    }
    root.style.display = '';
    const html = _remoteCache.accounts.map(acc => {
      const lastSync = acc.last_sync_at
        ? new Date(acc.last_sync_at).toLocaleString('pt-BR')
        : 'nunca';
      const expires = acc.token_expires_at
        ? new Date(acc.token_expires_at).toLocaleDateString('pt-BR')
        : '—';
      const statusClass = 'social-connection__status--' + (acc.status || 'unknown');
      const errorRow = acc.last_sync_error
        ? `<div class="social-connection__error">⚠ ${escapeHTML(acc.last_sync_error)}</div>`
        : '';
      return `
        <div class="social-connection">
          <div class="social-connection__head">
            <div>
              <span class="social-connection__platform">${escapeHTML(PLATFORM_LABEL[acc.provider] || acc.provider)}</span>
              ${acc.username ? `<span class="social-connection__handle">@${escapeHTML(acc.username)}</span>` : ''}
            </div>
            <span class="social-connection__status ${statusClass}">${escapeHTML(acc.status || '?')}</span>
          </div>
          <div class="social-connection__meta">
            Último sync: <strong>${escapeHTML(lastSync)}</strong> · Token expira em <strong>${escapeHTML(expires)}</strong>
          </div>
          ${errorRow}
          <div class="social-connection__actions">
            <button class="admin__add-btn admin__add-btn--ghost" id="btn-social-sync" type="button"
                    data-sync-account="${escapeHTML(acc.id)}">↻ Sincronizar agora</button>
          </div>
        </div>
      `;
    }).join('');
    root.innerHTML = html;

    // Wire dos botões
    root.querySelectorAll('[data-sync-account]').forEach(btn => {
      btn.addEventListener('click', () => syncNow(btn.getAttribute('data-sync-account')));
    });
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
  // Popula o <select> de ocasião a partir da taxonomia (fonte única).
  function fillThemeSelect(selected) {
    const sel = document.getElementById('social-form-theme');
    if (!sel) return;
    sel.innerHTML = '<option value="">—</option>' +
      OCCASIONS.map(o => `<option value="${o.key}">${o.emoji} ${escapeHTML(o.label)}</option>`).join('');
    sel.value = selected || '';
  }

  function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }

  function openModal(post) {
    const modal = document.getElementById('social-modal');
    if (!modal) return;
    const isEdit = !!(post && post.id);
    document.getElementById('social-modal-title').textContent = isEdit ? 'Editar post' : 'Novo post';
    setVal('social-form-id', isEdit ? post.id : '');
    setVal('social-form-platform', (post && post.platform) || 'instagram');
    setVal('social-form-type', (post && post.type) || 'reel');
    setVal('social-form-date', (post && post.date) || todayISO());
    setVal('social-form-link', (post && post.link) || '');
    setVal('social-form-tags', post && post.tags ? post.tags.join(', ') : '');
    fillThemeSelect(post && post.theme);
    setVal('social-form-experience', (post && post.experience) || '');
    setVal('social-form-campaign', (post && post.campaign) || '');
    setVal('social-form-views', (post && post.views) || 0);
    setVal('social-form-reach', (post && post.reach) || 0);
    setVal('social-form-likes', (post && post.likes) || 0);
    setVal('social-form-comments', (post && post.comments) || 0);
    setVal('social-form-saves', (post && post.saves) || 0);
    setVal('social-form-shares', (post && post.shares) || 0);
    setVal('social-form-followers', (post && post.followers) || 0);
    setVal('social-form-profileVisits', (post && post.profileVisits) || 0);
    setVal('social-form-linkClicks', (post && post.linkClicks) || 0);
    setVal('social-form-conversions', (post && post.conversions) || 0);

    const delBtn = document.getElementById('social-form-delete');
    if (delBtn) delBtn.style.display = isEdit ? 'inline-block' : 'none';

    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('social-modal');
    if (modal) modal.style.display = 'none';
  }

  function readModalForm() {
    const v = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    return normalizePost({
      id:            v('social-form-id') || null,
      platform:      v('social-form-platform'),
      type:          v('social-form-type'),
      date:          v('social-form-date'),
      link:          v('social-form-link').trim(),
      tags:          v('social-form-tags'),
      theme:         v('social-form-theme'),
      experience:    v('social-form-experience').trim(),
      campaign:      v('social-form-campaign').trim(),
      views:         v('social-form-views'),
      reach:         v('social-form-reach'),
      likes:         v('social-form-likes'),
      comments:      v('social-form-comments'),
      saves:         v('social-form-saves'),
      shares:        v('social-form-shares'),
      followers:     v('social-form-followers'),
      profileVisits: v('social-form-profileVisits'),
      linkClicks:    v('social-form-linkClicks'),
      conversions:   v('social-form-conversions'),
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
  // MERGE / DEDUPE — usado pelo import CSV e pela sync do Windsor.
  // Dedupe: prefere o ID da mídia (estável entre exports); senão o
  // permalink; senão platform|date|type|legenda. Ids gerados por nós
  // começam com "p_" — esses não servem de chave estável.
  // -----------------------------------------------------------
  function mergePosts(incoming) {
    const existing = loadPosts();
    const isGenId = id => !id || /^p_/.test(id);
    const keyOf = p =>
      !isGenId(p.id) ? 'mid|' + p.id
      : p.link ? 'lnk|' + p.platform + '|' + p.date + '|' + p.link
      : 'cap|' + p.platform + '|' + p.date + '|' + p.type + '|' + (p.caption || '').slice(0, 40);
    const map = {};
    existing.forEach(p => { map[keyOf(p)] = p; });
    let added = 0, updated = 0;
    incoming.forEach(p => {
      const k = keyOf(p);
      if (map[k]) { p.id = map[k].id; map[k] = p; updated++; }
      else        { map[k] = p; added++; }
    });
    savePosts(Object.values(map));
    return { added, updated };
  }

  // ===========================================================
  // BLOCO 1.6 — SINCRONIZAÇÃO AUTOMÁTICA VIA URL DO WINDSOR AI
  // O admin cola UMA ou MAIS URLs do conector (Instagram, TikTok…);
  // ficam no localStorage (atrás do login admin, nunca no código/repo).
  // A cada abertura da aba puxamos os dados frescos de todas as URLs.
  // Aceita resposta JSON (padrão do Windsor) ou CSV.
  // ===========================================================
  const WINDSOR_URL_KEY  = 'elarah.social.windsor.url';   // legado (1 URL)
  const WINDSOR_URLS_KEY = 'elarah.social.windsor.urls';  // atual (lista)
  let _windsorAutoSynced = false; // evita re-sync em loop dentro do render

  function getWindsorUrls() {
    try {
      const raw = localStorage.getItem(WINDSOR_URLS_KEY);
      if (raw) { const a = JSON.parse(raw); if (Array.isArray(a)) return a.filter(Boolean); }
      const legacy = localStorage.getItem(WINDSOR_URL_KEY); // migra a chave antiga
      return legacy ? [legacy] : [];
    } catch (e) { return []; }
  }
  function setWindsorUrls(urls) {
    try {
      localStorage.setItem(WINDSOR_URLS_KEY, JSON.stringify(urls));
      localStorage.removeItem(WINDSOR_URL_KEY);
    } catch (e) {}
  }
  function sanitizeWindsorUrl(u) {
    const s = String(u || '').trim().replace(/^[\]\[\s"']+|[\s"']+$/g, '');
    return /^https:\/\/connectors\.windsor\.ai\//i.test(s) ? s : '';
  }
  // Deduz a plataforma pelo caminho da URL do conector. Casa variações como
  // /tiktok, /tiktok_organic, /instagram, /instagram_business, etc.
  function platformFromWindsorUrl(url) {
    const u = String(url || '').toLowerCase();
    if (/tiktok/.test(u)) return 'tiktok';
    if (/instagram/.test(u)) return 'instagram';
    if (/linkedin/.test(u)) return 'linkedin';
    return ''; // /all ou desconhecido → deixa o campo "Fonte"/default decidir
  }

  // Converte a resposta do conector (JSON ou CSV) em posts normalizados.
  // platformHint preenche a plataforma quando a linha não traz "Fonte".
  function parseWindsorBody(text, contentType, platformHint) {
    const applyHint = (obj) => {
      if (platformHint && !obj.platform) obj.platform = platformHint;
      return obj;
    };
    const looksJSON = /json/i.test(contentType || '') || /^\s*[\[{]/.test(text);
    if (looksJSON) {
      try {
        const j = JSON.parse(text);
        const arr = Array.isArray(j) ? j : (j.data || j.rows || j.results || j.records || []);
        return arr
          .map(o => normalizePost(applyHint(canonicalizeRow(o))))
          .filter(p => p && !isEmptyImport(p));
      } catch (e) { /* não era JSON — tenta CSV */ }
    }
    return parseCSV(text, platformHint);
  }

  // Busca os dados de TODAS as URLs e mescla. silent=true não mostra toasts.
  async function syncFromWindsor(opts) {
    const silent = !!(opts && opts.silent);
    const urls = getWindsorUrls();
    if (!urls.length) { if (!silent) showToast('error', 'Cole a URL do Windsor primeiro (botão 🔗 Windsor AI).'); return; }
    if (!silent) showToast('ok', `Sincronizando ${urls.length} fonte(s) do Windsor…`);

    let all = [], fails = 0;
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const body = await res.text();
        all = all.concat(parseWindsorBody(body, res.headers.get('content-type'), platformFromWindsorUrl(url)));
      } catch (e) {
        console.warn('[Windsor] falha em', url, e);
        fails++;
      }
    }

    if (!all.length) {
      if (!silent) {
        showToast('error', fails
          ? 'Não consegui buscar do Windsor (provável bloqueio de CORS). Posso configurar um proxy no backend — me avise.'
          : 'O Windsor respondeu, mas sem posts válidos. Confira se os campos incluem date + métricas de mídia.');
      }
      return;
    }
    const { added, updated } = mergePosts(all);
    await render();
    if (!silent) {
      const warn = fails ? ` (${fails} fonte(s) falharam)` : '';
      showToast('ok', `Windsor sincronizado: ${added} novos, ${updated} atualizados${warn}.`);
    }
  }

  // Abre o modal com campos separados (Instagram / TikTok), pré-preenchidos
  // com as URLs já salvas (cada uma vai pro campo da sua rede).
  function connectWindsor() {
    const modal = document.getElementById('windsor-modal');
    if (!modal) { return; }
    const urls = getWindsorUrls();
    const ig = urls.find(u => platformFromWindsorUrl(u) === 'instagram') || '';
    const tk = urls.find(u => platformFromWindsorUrl(u) === 'tiktok') || '';
    const igEl = document.getElementById('windsor-url-ig');
    const tkEl = document.getElementById('windsor-url-tk');
    if (igEl) igEl.value = ig;
    if (tkEl) tkEl.value = tk;
    const status = document.getElementById('windsor-modal-status');
    if (status) status.textContent = urls.length ? `${urls.length} fonte(s) conectada(s).` : '';
    modal.style.display = 'flex';
  }

  function closeWindsorModal() {
    const modal = document.getElementById('windsor-modal');
    if (modal) modal.style.display = 'none';
  }

  // Lê os dois campos, valida e salva. Plataforma vem da URL (detecção).
  function saveWindsorModal() {
    const igEl = document.getElementById('windsor-url-ig');
    const tkEl = document.getElementById('windsor-url-tk');
    const urls = [
      sanitizeWindsorUrl(igEl ? igEl.value : ''),
      sanitizeWindsorUrl(tkEl ? tkEl.value : ''),
    ].filter(Boolean);
    if (!urls.length) {
      const status = document.getElementById('windsor-modal-status');
      if (status) { status.style.color = '#c0392b'; status.textContent = 'Cole ao menos uma URL válida (começa com https://connectors.windsor.ai/).'; }
      return;
    }
    setWindsorUrls(urls);
    closeWindsorModal();
    _windsorAutoSynced = true; // sincroniza manualmente agora
    syncFromWindsor({ silent: false });
  }

  // -----------------------------------------------------------
  // CSV IMPORT
  // -----------------------------------------------------------
  function handleCSVImport(file, forcedPlatform) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      // Plataforma: se o botão já forçou (CSV Instagram / CSV TikTok), usa.
      // Senão, se o CSV não tiver coluna "Fonte de dados"/platform, pergunta
      // (sem isso tudo cairia em Instagram por padrão).
      let hint = mapPlatform(forcedPlatform) || '';
      if (!hint && !headerHasPlatform(text)) {
        const ans = (window.prompt(
          'Esse CSV é de qual rede social?\nDigite: instagram, tiktok ou linkedin',
          'instagram') || '').trim().toLowerCase();
        hint = mapPlatform(ans) || '';
      }
      const incoming = parseCSV(text, hint);
      if (!incoming.length) {
        alert('Nenhum post válido encontrado no CSV.\n\n' + diagnoseCSV(text));
        return;
      }
      const { added, updated } = mergePosts(incoming);
      alert(`Importação concluída: ${added} novos, ${updated} atualizados.`);
      render();
    };
    reader.onerror = () => alert('Erro ao ler o arquivo.');
    reader.readAsText(file, 'utf-8');
  }

  // Verifica se o cabeçalho do CSV tem alguma coluna que mapeia pra platform.
  function headerHasPlatform(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const delim = detectDelimiter(text);
    const header = (text.split(/\r?\n/, 1)[0] || '').split(delim)
      .map(h => h.replace(/^"|"$/g, '').trim());
    return header.map(canonicalField).includes('platform');
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

    const windsorBtn = document.getElementById('btn-social-windsor');
    if (windsorBtn) windsorBtn.addEventListener('click', connectWindsor);

    // Modal do Windsor (campos separados Instagram / TikTok)
    const windsorSave = document.getElementById('windsor-save');
    if (windsorSave) windsorSave.addEventListener('click', saveWindsorModal);
    document.querySelectorAll('[data-windsor-close]').forEach(el => {
      el.addEventListener('click', closeWindsorModal);
    });

    const exportBtn = document.getElementById('btn-social-export');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      const posts = loadPosts();
      if (!posts.length) { alert('Sem posts para exportar.'); return; }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile('elarah-social-' + stamp + '.csv', toCSV(posts));
    });

    // Import CSV: botões separados por rede (Instagram / TikTok) + genérico.
    // O botão dispara o input de arquivo guardando a rede a forçar.
    const csvInput = document.getElementById('social-csv-input');
    let _pendingImportPlatform = '';
    const wireImport = (btnId, platform) => {
      const b = document.getElementById(btnId);
      if (b && csvInput) b.addEventListener('click', () => {
        _pendingImportPlatform = platform;
        csvInput.click();
      });
    };
    wireImport('btn-social-import', '');           // genérico (pergunta a rede)
    wireImport('btn-social-import-ig', 'instagram');
    wireImport('btn-social-import-tk', 'tiktok');
    if (csvInput) {
      csvInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        handleCSVImport(file, _pendingImportPlatform);
        _pendingImportPlatform = '';
        csvInput.value = '';
      });
    }

    // Estado vazio: ações inline
    document.querySelectorAll('[data-social-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-social-action');
        if (action === 'add') openModal(null);
        else if (action === 'sample') loadSampleData();
        else if (action === 'windsor') connectWindsor();
        else if (action === 'connect-instagram') connectInstagram();
      });
    });

    // Modal
    document.querySelectorAll('[data-social-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); closeWindsorModal(); }
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

    // Hidrata dados remotos (silencioso — se falhar, segue
    // funcionando com localStorage).
    await hydrateFromRemote();

    // Consome ?social_connected=... se voltou de OAuth.
    consumeOAuthRedirect();

    // Auto-sync do Windsor: na 1ª abertura da aba, se há URL salva,
    // puxa os dados frescos em silêncio. O re-render disparado por
    // syncFromWindsor não reentra aqui (guard _windsorAutoSynced).
    if (getWindsorUrls().length && !_windsorAutoSynced) {
      _windsorAutoSynced = true;
      syncFromWindsor({ silent: true });
    }

    // Decide a fonte: banco (se conectado) ou localStorage.
    const allPosts = effectivePostsSource() === 'remote'
      ? _remoteCache.posts
      : loadPosts();

    const empty = document.getElementById('social-empty');
    const dash  = document.getElementById('social-dashboard');

    // Mostra dashboard se há posts, conta conectada, OU Windsor plugado
    // (mesmo sem posts ainda — a sync pode estar a caminho).
    const showDash = allPosts.length > 0 || hasConnectedAccount() || getWindsorUrls().length > 0;
    if (!showDash) {
      if (empty) empty.style.display = 'block';
      if (dash)  dash.style.display = 'none';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (dash)  dash.style.display = 'block';

    renderConnections();

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
  // seja preguiçosa). Também: se o admin acabou de voltar de
  // OAuth (?social_connected=...), ativa a aba Redes Sociais
  // automaticamente — senão o toast de sucesso some sem ser visto.
  function autoOpenAfterOAuth() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('social_connected')) return;
    const navBtn = document.querySelector('.admin__nav-item[data-panel="social"]');
    if (navBtn) navBtn.click();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindUI();
      autoOpenAfterOAuth();
    });
  } else {
    bindUI();
    autoOpenAfterOAuth();
  }

  window.ElarahSocial = {
    render, loadSampleData, connectInstagram, syncNow,
    // Expostos pro módulo de análise estratégica (admin-social-analysis.js)
    OCCASIONS, OCCASION_LABEL, inferOccasion,
    engagement, reachOf,
  };

})();
