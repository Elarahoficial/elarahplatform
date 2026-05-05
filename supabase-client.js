/* =============================================
   ELARAH — SUPABASE CLIENT
   Inicializa o client Supabase usando a
   publishable key (segura no frontend com RLS).

   Padrão antigo: abortava imediatamente se
   window.supabase não estivesse disponível.
   Problema: scripts carregados em paralelo +
   fallback CDN assíncrono (onerror) faziam o
   abort acontecer ANTES do fallback completar.

   Padrão novo: tenta criar o client imediatamente.
   Se window.supabase ainda não existe, faz polling
   a cada 100ms por até 8 segundos esperando o
   CDN finalizar (incluindo fallbacks).

   Resiliência de rede: usa um fetch customizado
   (resilientFetch) que faz retry com backoff em
   falhas de rede (TypeError: Failed to fetch,
   ERR_QUIC_PROTOCOL_ERROR, ERR_CONNECTION_RESET).
   Após o 1º falha QUIC, o Chrome marca o domínio
   como "broken" e cai pra HTTP/2 — então o retry
   quase sempre passa.
   ============================================= */

(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://nwijxjmenbfyehvscogs.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HKveTG-kF0ZDsbiHYvwBdA_Kg5PUOlJ';

  // Fetch com retry em falhas de rede transitórias.
  // Usado para todas as chamadas do Supabase (auth + REST).
  // Não retenta em respostas HTTP de erro (4xx/5xx) — só em
  // falhas onde o fetch lança (sem resposta).
  async function resilientFetch(input, init) {
    const maxAttempts = 4;
    // 0ms (imediato), 700ms, 1500ms, 3000ms
    const backoffs = [0, 700, 1500, 3000];
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (backoffs[attempt] > 0) {
        await new Promise((r) => setTimeout(r, backoffs[attempt]));
      }
      try {
        // Acrescenta cache: 'no-store' apenas se não estiver definido.
        // Não mexe nos headers nem no body — só passa adiante.
        const res = await fetch(input, init);
        return res;
      } catch (e) {
        lastError = e;
        const msg = String((e && e.message) || e || '');
        // Padrão de falha de rede transitória do Chrome/Firefox/Safari:
        //   - TypeError: Failed to fetch (Chrome)
        //   - TypeError: NetworkError when attempting to fetch resource (Firefox)
        //   - TypeError: Load failed (Safari)
        const isNetworkError =
          (e && e.name === 'TypeError') ||
          /failed to fetch|network ?error|load failed|err_/i.test(msg);

        if (!isNetworkError) {
          throw e;
        }
        if (attempt < maxAttempts - 1) {
          console.warn(
            '[Elarah] fetch falhou (' + (attempt + 1) + '/' + maxAttempts +
            '): ' + msg + ' — retry em ' + backoffs[attempt + 1] + 'ms'
          );
        }
      }
    }
    console.error(
      '[Elarah] fetch falhou após ' + maxAttempts + ' tentativas. ' +
      'Provavelmente bloqueio de rede (QUIC/firewall/antivírus). ' +
      'Último erro: ' + ((lastError && lastError.message) || lastError)
    );
    throw lastError;
  }

  // Helper exposto pra outros módulos (experiences-data.js, byelarah-data.js,
  // auth.js, admin.js) aguardarem o client ficar pronto antes de cair em
  // fallback. Resolve race condition onde DOMContentLoaded dispara antes do
  // <script> async do supabase-loader.js terminar de baixar.
  //
  // - Resolve com o client se já existe ou aparecer dentro do timeout
  // - Resolve com null se o loader já reportou falha terminal (sem espera)
  // - Resolve com null se o timeout estourar
  function waitClient(timeoutMs) {
    if (typeof timeoutMs !== 'number' || timeoutMs < 0) timeoutMs = 8000;
    if (window.supabaseClient) return Promise.resolve(window.supabaseClient);
    // Falha terminal já confirmada — não vale a pena esperar.
    if (window.__elarahSupabaseBootError === 'create_failed' ||
        window.__elarahSupabaseBootError === 'client_null' ||
        window.__elarahSupabaseLoaderError === 'all_sources_failed') {
      return Promise.resolve(null);
    }
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      function onReady() { finish(window.supabaseClient || null); }
      window.addEventListener('elarah:supabase-ready', onReady, { once: true });
      // Polling de backup pra cobrir o caso do listener ter sido
      // adicionado depois do dispatchEvent (scripts que rodam tarde).
      var pollId = setInterval(function () {
        if (window.supabaseClient) {
          clearInterval(pollId);
          finish(window.supabaseClient);
        } else if (window.__elarahSupabaseBootError === 'create_failed' ||
                   window.__elarahSupabaseBootError === 'client_null' ||
                   window.__elarahSupabaseLoaderError === 'all_sources_failed') {
          clearInterval(pollId);
          finish(null);
        }
      }, 100);
      setTimeout(function () { clearInterval(pollId); finish(window.supabaseClient || null); }, timeoutMs);
    });
  }

  // Expõe waitClient cedo (mesmo antes do client existir), pra que módulos
  // que carregam logo depois deste script possam usar imediatamente.
  if (!window.ElarahSupabase) {
    window.ElarahSupabase = {};
  }
  window.ElarahSupabase.waitClient = waitClient;

  // Tenta criar o client uma vez. Retorna:
  //   true  → conseguiu (ou já tinha sido criado)
  //   false → window.supabase ainda não disponível, retry
  //   null  → falha terminal (createClient deu erro)
  function tryCreate() {
    if (window.supabaseClient) return true; // já criado em retry anterior
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return false;
    }
    let client;
    try {
      // Implicit flow (hash tokens) é intencional: faz com que os
      // links de confirmação de email e de reset de senha funcionem
      // em qualquer navegador — não dependem do code_verifier PKCE.
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'elarah-auth',
          flowType: 'implicit'
        },
        global: {
          fetch: resilientFetch
        }
      });
    } catch (e) {
      console.error('[Elarah] erro ao chamar createClient:', e);
      window.__elarahSupabaseBootError = 'create_failed';
      return null;
    }
    if (!client) {
      console.error('[Elarah] createClient retornou nulo.');
      window.__elarahSupabaseBootError = 'client_null';
      return null;
    }
    window.supabaseClient = client;
    // Preserva waitClient e qualquer outra coisa que tenha sido posta
    // antes da inicialização (objeto early populado acima).
    var existing = window.ElarahSupabase || {};
    window.ElarahSupabase = Object.assign(existing, {
      url: SUPABASE_URL,
      client: client,
      resilientFetch: resilientFetch,
      waitClient: waitClient,
      siteBase: function () {
        const path = window.location.pathname.replace(/[^/]*$/, '');
        return window.location.origin + path;
      }
    });
    console.info('[Elarah] Supabase client inicializado com sucesso.');
    // Dispara evento custom pra que outros scripts (auth.js etc.)
    // possam reagir se estavam aguardando.
    try {
      window.dispatchEvent(new Event('elarah:supabase-ready'));
    } catch (e) {}
    return true;
  }

  // Tentativa imediata (caso CDN já tenha carregado antes deste script).
  const result = tryCreate();
  if (result === true || result === null) return;

  // Polling: tenta a cada 100ms até 8s. Cobre o caso comum de o CDN
  // primário falhar com ERR_QUIC_PROTOCOL_ERROR / outros erros de
  // rede e o fallback (jsdelivr/esm.sh) levar 1-2s pra carregar
  // assíncrono via onerror handler.
  let attempts = 0;
  const maxAttempts = 80; // 80 × 100ms = 8s
  const intervalId = setInterval(function () {
    attempts++;
    const r = tryCreate();
    if (r === true || r === null) {
      clearInterval(intervalId);
      return;
    }
    if (attempts >= maxAttempts) {
      clearInterval(intervalId);
      console.error(
        '[Elarah] @supabase/supabase-js não carregou após 8s. ' +
        'Causa provável: TODOS os CDNs bloqueados (firewall, ' +
        'ad-blocker, antivírus, rede corporativa, ERR_QUIC_PROTOCOL_ERROR). ' +
        'Tente: (1) aba anônima, (2) outro navegador, (3) outra rede ' +
        '(troca pra 4G no celular pra testar), (4) desabilitar extensões.'
      );
      window.__elarahSupabaseBootError = 'cdn_timeout';
    }
  }, 100);
})(window);
