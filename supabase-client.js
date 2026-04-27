/* =============================================
   ELARAH — SUPABASE CLIENT
   Inicializa o client Supabase usando a
   publishable key (segura no frontend com RLS).
   Deve ser o PRIMEIRO script após o CDN do
   @supabase/supabase-js em toda página.
   ============================================= */

(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://nwijxjmenbfyehvscogs.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HKveTG-kF0ZDsbiHYvwBdA_Kg5PUOlJ';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error(
      '[Elarah] @supabase/supabase-js não carregado. ' +
      'Causa provável: CDN bloqueado/instável (unpkg fora do ar, ' +
      'extensão de browser bloqueando, rede corporativa). ' +
      'Tente abrir em aba anônima ou trocar de rede.'
    );
    // Sinaliza erro de boot pro auth.js mostrar mensagem mais útil
    // que "Supabase indisponível" genérico.
    window.__elarahSupabaseBootError = 'cdn_failed';
    return;
  }

  let client;
  try {
    // Implicit flow (hash tokens) é intencional: faz com que os links
    // de confirmação de email e de reset de senha funcionem em qualquer
    // navegador — não dependem do code_verifier PKCE armazenado no
    // navegador onde o signup/reset foi iniciado.
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'elarah-auth',
        flowType: 'implicit'
      }
    });
  } catch (e) {
    console.error('[Elarah] erro ao inicializar Supabase client:', e);
    window.__elarahSupabaseBootError = 'create_failed';
    return;
  }

  if (!client) {
    console.error('[Elarah] Supabase client veio nulo após createClient.');
    window.__elarahSupabaseBootError = 'client_null';
    return;
  }

  window.supabaseClient = client;
  window.ElarahSupabase = {
    url: SUPABASE_URL,
    client: client,
    // Base usada em links de reset de senha e OAuth redirects.
    // Resolve para a pasta da página atual (ex.: .../elarahplatform/).
    siteBase: function () {
      const path = window.location.pathname.replace(/[^/]*$/, '');
      return window.location.origin + path;
    }
  };
  console.info('[Elarah] Supabase client inicializado com sucesso.');
})(window);
