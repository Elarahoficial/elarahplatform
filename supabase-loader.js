/* =============================================
   ELARAH — SUPABASE LIB LOADER (multi-CDN)
   Carrega @supabase/supabase-js com fallback
   automático entre CDNs em caso de falha:

   1. unpkg.com (primário)
   2. cdn.jsdelivr.net
   3. esm.sh

   Causas conhecidas de falha:
   - ERR_QUIC_PROTOCOL_ERROR (Chrome HTTP/3 bloqueado
     em rede do usuário, antivírus, firewall)
   - 404/5xx do CDN
   - Rede corporativa bloqueando domínio
   - Ad-blocker / extensão

   Estratégia:
   - onerror dispara fallback imediato
   - timeout de 5s por CDN (pra cobrir o caso onde
     a conexão TCP estabelece mas o handshake QUIC
     trava sem disparar onerror)
   - supabase-client.js faz polling até 8s aguardando
     window.supabase aparecer
   ============================================= */

(function () {
  'use strict';

  // Se a lib já foi carregada (ex: outro <script> síncrono), nada a fazer.
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    return;
  }

  var CDNS = [
    'https://unpkg.com/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js',
    'https://esm.sh/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js'
  ];

  var CDN_TIMEOUT_MS = 5000;

  function isLoaded() {
    return !!(window.supabase && typeof window.supabase.createClient === 'function');
  }

  function tryLoad(i) {
    if (isLoaded()) return;
    if (i >= CDNS.length) {
      console.error(
        '[Elarah] Todos os CDNs do Supabase falharam. ' +
        'Causa provável: rede bloqueando UDP/443 (QUIC), antivírus, ' +
        'firewall corporativo ou ad-blocker. Tente: aba anônima, ' +
        'outro navegador, ou trocar pra rede 4G no celular.'
      );
      window.__elarahSupabaseLoaderError = 'all_cdns_failed';
      return;
    }

    var url = CDNS[i];
    var s = document.createElement('script');
    s.src = url;
    s.async = true;
    var settled = false;
    var timeoutId;

    function next(reason) {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      // Remove o <script> que falhou pra evitar re-execução acidental.
      try { s.parentNode && s.parentNode.removeChild(s); } catch (e) {}
      console.warn('[Elarah] CDN falhou (' + reason + '): ' + url + ' — tentando próximo');
      tryLoad(i + 1);
    }

    s.onload = function () {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      // Verifica se a lib realmente foi exposta. Se não, é um arquivo
      // diferente do esperado e precisamos cair pro próximo CDN.
      if (!isLoaded()) {
        console.warn('[Elarah] CDN carregou mas window.supabase não existe: ' + url);
        tryLoad(i + 1);
        return;
      }
      console.info('[Elarah] Supabase lib carregada de ' + url);
    };
    s.onerror = function () { next('onerror'); };

    timeoutId = setTimeout(function () {
      if (!isLoaded()) next('timeout ' + CDN_TIMEOUT_MS + 'ms');
    }, CDN_TIMEOUT_MS);

    document.head.appendChild(s);
  }

  tryLoad(0);
})();
