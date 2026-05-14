/*
 * Service Worker do admin Elarah (PWA).
 *
 * Estratégia:
 *   - Requisições para o Supabase (auth + REST) e qualquer cross-origin
 *     dinâmico passam direto pela rede (sem cache). Não queremos servir
 *     dados antigos de prospects/agenda/etc.
 *   - Assets do mesmo origin (HTML/CSS/JS/fontes/imagens) usam
 *     stale-while-revalidate: responde do cache imediatamente e atualiza
 *     em background. Garante app rápido offline-first sem travar updates.
 *   - Bump CACHE_NAME para invalidar caches antigos em deploys.
 */

const CACHE_NAME = 'elarah-admin-v1';

// Precache mínimo: o "shell" do admin. Demais recursos entram via fetch.
const PRECACHE_URLS = [
  '/admin-novo.html',
  '/admin.css',
  '/admin-mobile.css',
  '/admin.js',
  '/admin-mobile.js',
  '/admin-social.js',
  '/styles.css',
  '/supabase-client.js',
  '/supabase-loader.js',
  '/assets/logo.png',
  '/manifest.json'
];

// Hosts que NÃO devem ser cacheados (dados dinâmicos / autenticação).
const NO_CACHE_HOSTS = [
  'supabase.co',
  'supabase.in'
];

self.addEventListener('install', (event) => {
  // Skip waiting: novo SW assume controle assim que possível.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll falha se qualquer recurso 404 — usamos add individual
      // ignorando erros pra ser tolerante a renomeações futuras.
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Falha ao precachear', url, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches antigos (versões anteriores deste SW).
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('elarah-admin-'))
          .map((key) => caches.delete(key))
      );
      // Assume controle de todas as abas abertas imediatamente.
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só intercepta GET. POST/PUT/DELETE passam direto.
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Pula schemes não suportados (chrome-extension://, data:, etc).
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Dados do Supabase: network-only, sem fallback de cache.
  const isSupabase = NO_CACHE_HOSTS.some((host) => url.hostname.endsWith(host));
  if (isSupabase) {
    return; // deixa o browser tratar normalmente
  }

  // Same-origin ou fontes do Google: stale-while-revalidate.
  const sameOrigin = url.origin === self.location.origin;
  const isGoogleFonts =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (!sameOrigin && !isGoogleFonts) return;

  event.respondWith(staleWhileRevalidate(req));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      // Só cacheia respostas válidas (200) e do tipo basic/cors.
      if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
        // Clona porque o stream só pode ser lido uma vez.
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch((err) => {
      // Sem rede: se tinha cache, retorna ele lá em cima.
      // Se não tinha, propaga o erro.
      if (cached) return cached;
      throw err;
    });

  // Stale-while-revalidate: cache se existe, senão espera a rede.
  return cached || networkFetch;
}

// Permite ao app forçar atualização do SW via postMessage.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
