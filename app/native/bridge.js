/*
 * Ponte nativa do app Elarah (Capacitor).
 *
 * Este arquivo só é injetado na versão empacotada do app (pasta www gerada
 * no build). Ele NÃO altera o site original. Melhora a experiência dentro
 * do app nativo:
 *   1. Botão "voltar" do Android navega no histórico em vez de fechar o app.
 *   2. Links externos (Instagram, WhatsApp, checkout de pagamento, etc.)
 *      abrem no navegador do sistema, não dentro do app.
 *   3. Esconde a splash screen quando a página termina de carregar.
 *
 * Se o Capacitor não estiver presente (ou seja, aberto no navegador normal
 * do site), o script simplesmente não faz nada.
 */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

  function plugin(name) {
    return (Cap.Plugins && Cap.Plugins[name]) || null;
  }

  // 1) Botão voltar do Android
  var App = plugin('App');
  if (App && App.addListener) {
    App.addListener('backButton', function (e) {
      if (window.history.length > 1 && e.canGoBack !== false) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }

  // 2) Roteamento de links dentro do app
  // O app é servido a partir da raiz (localhost). O host do próprio site.
  var SITE_HOSTS = ['localhost', 'elarah.com.br', 'www.elarah.com.br'];

  function openExternal(url) {
    var Browser = plugin('Browser');
    if (Browser && Browser.open) {
      Browser.open({ url: url });
    } else if (App && App.openUrl) {
      App.openUrl({ url: url });
    } else {
      window.open(url, '_system');
    }
  }

  document.addEventListener(
    'click',
    function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      var u;
      try {
        u = new URL(href, window.location.href);
      } catch (err) {
        return; // deixa o navegador tratar
      }

      var isHttp = u.protocol === 'http:' || u.protocol === 'https:';

      // Esquemas não-http (mailto:, tel:, whatsapp:, etc.) -> sistema
      if (!isHttp) {
        ev.preventDefault();
        openExternal(href);
        return;
      }

      var isSameSite = SITE_HOSTS.indexOf(u.hostname) !== -1;

      // Link externo (outro domínio) ou target=_blank -> navegador do sistema
      if (!isSameSite || a.target === '_blank') {
        ev.preventDefault();
        openExternal(u.href);
        return;
      }

      // Link absoluto para o próprio site (ex.: https://elarah.com.br/experiencia.html)
      // -> navega DENTRO do app, usando o caminho local (offline/consistente).
      if (u.hostname !== 'localhost') {
        ev.preventDefault();
        window.location.assign(u.pathname + u.search + u.hash);
      }
      // Caso contrário (link relativo ou já em localhost): navegação normal.
    },
    true
  );

  // 3) Esconde a splash quando a página carregar
  function hideSplash() {
    var Splash = plugin('SplashScreen');
    if (Splash && Splash.hide) Splash.hide();
  }
  if (document.readyState === 'complete') {
    hideSplash();
  } else {
    window.addEventListener('load', hideSplash);
  }
})();
