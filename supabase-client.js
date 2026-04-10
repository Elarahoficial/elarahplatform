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
    console.error('[Elarah] @supabase/supabase-js não carregado. Verifique o <script> do CDN.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'elarah-auth',
      flowType: 'pkce'
    }
  });

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
})(window);
