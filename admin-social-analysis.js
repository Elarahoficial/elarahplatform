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
        tags: Array.isArray(p.tags) ? p.tags : [],
        views: toInt(p.views), likes: toInt(p.likes),
        comments: toInt(p.comments), saves: toInt(p.saves),
        shares: toInt(p.shares),
      })).filter(p => p.date);
    } catch (e) {
      return [];
    }
  }

  function loadBrand() {
    try {
      const raw = localStorage.getItem(BRAND_KEY);
      if (!raw) return defaultBrand();
      return Object.assign(defaultBrand(), JSON.parse(raw));
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

  function defaultBrand() {
    return {
      nome: 'Elarah',
      username: 'elarahoficial',
      bio: '',
      link: '',
      destaques: '',
      temFoto: true,
      vende: 'Experiências e presentes memoráveis',
      publico: '',
      proposta: '',
      concorrentes: '',
    };
  }

  // -----------------------------------------------------------
  // HELPERS NUMÉRICOS
  // -----------------------------------------------------------
  function toInt(v) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; }
  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  function avg(arr) { return arr.length ? sum(arr) / arr.length : 0; }
  function engagement(p) { return p.likes + p.comments + p.saves + p.shares; }
  function engRate(p) { return p.views > 0 ? (engagement(p) / p.views) * 100 : 0; }
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

  // -----------------------------------------------------------
  // SEÇÃO 1 — POSICIONAMENTO
  // -----------------------------------------------------------
  function sectionPosicionamento(brand) {
    const confusao = [];
    if (!brand.proposta) confusao.push('Proposta de valor não está declarada em 1 frase — o visitante não entende em 3s o que você entrega.');
    if (!brand.publico) confusao.push('Público-alvo não definido — sem isso, o conteúdo tenta falar com todo mundo e não conecta com ninguém.');
    if (!brand.vende) confusao.push('Não está claro o que a marca vende.');
    if (!brand.link) confusao.push('Sem link na bio: não há caminho claro pra ação/compra.');
    if (!confusao.length) confusao.push('Nenhum ponto crítico de confusão — posicionamento bem declarado. Reforce a consistência visual.');

    return card('1. Posicionamento', `
      ${kv('O que a marca vende', brand.vende || '<em>não informado</em>')}
      ${kv('Público-alvo provável', brand.publico || '<em>não informado — preencha no perfil da marca</em>')}
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
  // SEÇÃO 9 — CALENDÁRIO EDITORIAL (30 dias)
  // -----------------------------------------------------------
  function sectionCalendario(posts, brand) {
    const tags = topTags(posts, 5).map(t => t.tag);
    const temas = (tags.length ? tags : ['produto', 'bastidores', 'prova social', 'educativo', 'oferta']);
    const formatos = ['Reel', 'Carrossel', 'Story', 'Reel', 'Feed', 'Carrossel', 'Story'];
    const objetivos = ['Alcance', 'Autoridade', 'Comunidade', 'Alcance', 'Desejo', 'Conversão', 'Relacionamento'];
    const ctas = ['Compartilhe', 'Salve este post', 'Responda na caixinha', 'Marque um amigo', 'Comente "EU"', 'Link na bio', 'Manda no Direct'];
    const ganchos = [
      'POV: você finalmente descobriu',
      '3 erros que você comete com',
      'O segredo por trás de',
      'Ninguém te conta isto sobre',
      'Antes e depois de',
      'Como escolher o melhor',
      'A verdade sobre',
    ];

    const rows = [];
    for (let d = 1; d <= 30; d++) {
      const i = (d - 1) % 7;
      const tema = temas[(d - 1) % temas.length];
      rows.push(`<tr>
        <td>${d}</td>
        <td>${escapeHTML(capitalize(tema))}</td>
        <td>${escapeHTML(ganchos[i])} ${escapeHTML(tema)}</td>
        <td>${formatos[i]}</td>
        <td>${objetivos[i]}</td>
        <td>${ctas[i]}</td>
      </tr>`);
    }
    return card('9. Calendário editorial — 30 dias', `
      <p class="sa-muted">Rotação baseada nos seus temas de melhor desempenho. Ajuste os ganchos ao seu tom de voz.</p>
      <div class="sa-tablewrap"><table class="sa-table sa-table--cal">
        <thead><tr><th>Dia</th><th>Tema</th><th>Gancho</th><th>Formato</th><th>Objetivo</th><th>CTA</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table></div>
    `);
  }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

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
  // RELATÓRIO COMPLETO
  // -----------------------------------------------------------
  function buildReport() {
    const posts = loadPosts();
    const brand = loadBrand();
    const head = `
      <div class="sa-report__head">
        <div>
          <h2 class="sa-report__title">Análise estratégica — @${escapeHTML(brand.username || brand.nome || '')}</h2>
          <p class="sa-muted">Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${posts.length} posts analisados</p>
        </div>
      </div>`;
    return head +
      sectionPosicionamento(brand) +
      sectionBio(brand) +
      sectionConteudo(posts) +
      sectionEngajamento(posts) +
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
    return `
      <div class="sa-brandform" id="sa-brandform">
        <h3 class="sa-card__title">Perfil da marca <small class="sa-muted">(alimenta as seções qualitativas)</small></h3>
        <div class="sa-grid">
          ${f('sa-nome', 'Nome (campo pesquisável)', brand.nome, 'Ex: Elarah | Presentes & Experiências')}
          ${f('sa-username', 'Username (@)', brand.username, 'elarahoficial')}
          ${f('sa-link', 'Link na bio', brand.link, 'https://...')}
          ${f('sa-vende', 'O que vende', brand.vende, 'Experiências e presentes')}
          ${f('sa-publico', 'Público-alvo', brand.publico, 'Ex: mulheres 25-45 que presenteiam')}
          ${f('sa-destaques', 'Destaques (vírgula)', brand.destaques, 'Comece aqui, Avaliações, Ofertas, FAQ')}
        </div>
        ${ta('sa-bio', 'Bio atual', brand.bio, 'Cole a bio exata do perfil')}
        ${ta('sa-proposta', 'Proposta de valor (1 frase)', brand.proposta, 'O que você entrega + pra quem + diferencial')}
        ${ta('sa-concorrentes', 'Concorrentes percebidos (vírgula)', brand.concorrentes, '@concorrente1, @concorrente2')}
        <label class="sa-check"><input type="checkbox" id="sa-temfoto" ${brand.temFoto ? 'checked' : ''}> Tem foto de perfil profissional/legível</label>
        <div class="sa-brandform__actions">
          <button class="admin__add-btn" id="sa-generate" type="button">Gerar análise</button>
        </div>
      </div>`;
  }

  function readBrandForm() {
    const v = (id) => (document.getElementById(id) || {}).value || '';
    return {
      nome: v('sa-nome'), username: v('sa-username').replace(/^@/, ''),
      link: v('sa-link'), vende: v('sa-vende'), publico: v('sa-publico'),
      destaques: v('sa-destaques'), bio: v('sa-bio'), proposta: v('sa-proposta'),
      concorrentes: v('sa-concorrentes'),
      temFoto: !!(document.getElementById('sa-temfoto') || {}).checked,
    };
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
    const brand = readBrandForm();
    saveBrand(brand);
    const rep = document.getElementById('sa-report');
    if (rep) rep.innerHTML = buildReport();
    bindReportUI(); // re-bind nada extra, mas mantém consistência
  }

  function bindReportUI() {
    const back = document.getElementById('sa-back');
    if (back) back.onclick = close;
    const gen = document.getElementById('sa-generate');
    if (gen) gen.onclick = regenerate;
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

  window.ElarahSocialAnalysis = { open, close, render };
})();
