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
   ============================================= */

(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://nwijxjmenbfyehvscogs.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HKveTG-kF0ZDsbiHYvwBdA_Kg5PUOlJ';

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
      // Custom fetch wrapper: retry automático em ERR_QUIC_PROTOCOL_ERROR
      // e outros "Failed to fetch" intermitentes. Browsers que tentam
      // HTTP/3 (QUIC) podem falhar quando UDP é bloqueado por
      // firewall/antivírus/extensão; o navegador faz fallback pra
      // HTTP/2 sozinho na próxima tentativa, então o retry geralmente
      // sucede. Backoff exponencial pequeno (200ms, 500ms, 1s).
      const RETRY_DELAYS = [200, 500, 1000];
      async function resilientFetch(input, init) {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        let lastErr;
        for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
          try {
            const resp = await fetch(input, init);
            if (attempt > 0) {
              console.info(
                '[Elarah] fetch sucedeu na tentativa ' + (attempt + 1) +
                ' (URL: ' + url.slice(0, 80) + ')'
              );
            }
            return resp;
          } catch (err) {
            lastErr = err;
            const msg = String((err && err.message) || err);
            // Só faz retry em erros de rede transitórios. Outros
            // erros (CORS, abort) propagam imediatamente.
            const isTransient = /failed to fetch|network|quic|connection|timeout/i.test(msg);
            if (!isTransient || attempt === RETRY_DELAYS.length) {
              if (isTransient) {
                console.error(
                  '[Elarah] fetch falhou em todas as ' + (attempt + 1) +
                  ' tentativas. Último erro: ' + msg + ' (URL: ' + url.slice(0, 80) + '). ' +
                  'Causa provável: rede bloqueando HTTP/3 (QUIC). ' +
                  'Workarounds: (1) chrome://flags → desabilitar QUIC, ' +
                  '(2) trocar de rede (4G no celular), ' +
                  '(3) desabilitar antivírus/extensões temporariamente, ' +
                  '(4) usar Firefox.'
                );
              }
              throw err;
            }
            console.warn(
              '[Elarah] fetch falhou (tentativa ' + (attempt + 1) + '/' +
              (RETRY_DELAYS.length + 1) + '): ' + msg + '. Retry em ' +
              RETRY_DELAYS[attempt] + 'ms...'
            );
            await new Promise(function (r) { setTimeout(r, RETRY_DELAYS[attempt]); });
          }
        }
        throw lastErr;
      }

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
    window.ElarahSupabase = {
      url: SUPABASE_URL,
      client: client,
      siteBase: function () {
        const path = window.location.pathname.replace(/[^/]*$/, '');
        return window.location.origin + path;
      }
    };
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
