/* =============================================
   ELARAH — SUPABASE LIB LOADER

   Estratégia em camadas (do mais confiável pro
   menos confiável):

   1. LOCAL: vendor/supabase-js@2.45.0.js
      Hospedado no mesmo domínio do site.
      Só falha se o site inteiro estiver fora do ar
      ou se houver um ad-blocker bloqueando o path.
      É a opção 100% confiável: imune a
      ERR_QUIC_PROTOCOL_ERROR de unpkg/jsdelivr,
      imune a antivírus interceptando CDNs.

   2. CDNs (fallback, só se o local falhar):
      - cdn.jsdelivr.net
      - unpkg.com
      - esm.sh

   Causas conhecidas de falha em CDN:
   - ERR_QUIC_PROTOCOL_ERROR (Chrome HTTP/3 bloqueado
     em rede do usuário, antivírus, firewall)
   - 404/5xx do CDN
   - Rede corporativa bloqueando domínio
   - Ad-blocker / extensão

   Estratégia técnica:
   - onerror dispara fallback imediato
   - timeout por source (3s pro local, 5s pra CDN)
     pra cobrir o caso onde a conexão estabelece
     mas trava sem disparar onerror
   - supabase-client.js faz polling até 8s aguardando
     window.supabase aparecer
   ============================================= */

(function () {
  'use strict';

  // Se a lib já foi carregada (ex: outro <script> síncrono), nada a fazer.
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    return;
  }

  // Local primeiro (mesmo domínio = imune a problemas de rede com CDN).
  // Depois CDNs como fallback. O caminho local usa relative path pra
  // funcionar tanto em GitHub Pages quanto em domínio custom.
  var SOURCES = [
    { url: 'vendor/supabase-js@2.45.0.js',                                                    timeout: 3000, label: 'local' },
    { url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js', timeout: 5000, label: 'jsdelivr' },
    { url: 'https://unpkg.com/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js',         timeout: 5000, label: 'unpkg' },
    { url: 'https://esm.sh/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js',            timeout: 5000, label: 'esm.sh' }
  ];

  function isLoaded() {
    return !!(window.supabase && typeof window.supabase.createClient === 'function');
  }

  function tryLoad(i) {
    if (isLoaded()) return;
    if (i >= SOURCES.length) {
      console.error(
        '[Elarah] Todas as fontes do Supabase falharam (local + CDNs). ' +
        'Se o site carregou mas isto falhou, é provável ad-blocker/extensão ' +
        'bloqueando a palavra "supabase" no path. Tente: aba anônima, ' +
        'desabilitar extensões (uBlock/AdGuard), ou outro navegador.'
      );
      window.__elarahSupabaseLoaderError = 'all_sources_failed';
      return;
    }

    var src = SOURCES[i];
    var s = document.createElement('script');
    s.src = src.url;
    s.async = true;
    var settled = false;
    var timeoutId;

    function next(reason) {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      try { s.parentNode && s.parentNode.removeChild(s); } catch (e) {}
      console.warn('[Elarah] Fonte falhou [' + src.label + '] (' + reason + '): ' + src.url + ' — tentando próxima');
      tryLoad(i + 1);
    }

    s.onload = function () {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (!isLoaded()) {
        console.warn('[Elarah] [' + src.label + '] carregou mas window.supabase não existe: ' + src.url);
        tryLoad(i + 1);
        return;
      }
      console.info('[Elarah] Supabase lib carregada de [' + src.label + '] ' + src.url);
    };
    s.onerror = function () { next('onerror'); };

    timeoutId = setTimeout(function () {
      if (!isLoaded()) next('timeout ' + src.timeout + 'ms');
    }, src.timeout);

    document.head.appendChild(s);
  }

  tryLoad(0);
})();
