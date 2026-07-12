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

  // 4) Compartilhamento nativo
  // Os botões de compartilhar do site apenas copiam o link. Dentro do app,
  // fazemos os MESMOS botões abrirem o menu nativo de compartilhamento
  // (WhatsApp, Instagram, etc.). Sempre compartilhamos a URL pública do site
  // (elarah.com.br), para que o link funcione fora do app também.
  var SHARE_BASE = 'https://elarah.com.br';
  var SHARE_SELECTOR =
    '.card__share-btn, .originals__card-share-btn, #exp-share-btn, .exp-detail__share-btn';

  document.addEventListener(
    'click',
    function (ev) {
      var Share = plugin('Share');
      if (!Share || !Share.share) return; // sem plugin => mantém comportamento do site
      var btn = ev.target && ev.target.closest ? ev.target.closest(SHARE_SELECTOR) : null;
      if (!btn) return;

      // impede o handler original (copiar link) e a navegação do card
      ev.preventDefault();
      ev.stopImmediatePropagation();

      var id = btn.dataset.shareId || btn.dataset.shareExperienceId;
      var url = id
        ? SHARE_BASE + '/experiencia.html?id=' + encodeURIComponent(id)
        : SHARE_BASE + window.location.pathname + window.location.search;

      var nome = (document.title || 'Elarah').split('—')[0].split('|')[0].trim() || 'Elarah';

      Share.share({
        title: 'Elarah',
        text: 'Descubra essa experiência na Elarah: ' + nome,
        url: url,
        dialogTitle: 'Compartilhar experiência',
      }).catch(function () {
        /* usuário cancelou ou plugin indisponível */
      });
    },
    true
  );

  // 5) Notificações push (BASE — precisa de configuração do Firebase/APNs)
  // Aqui deixamos os "ouvintes" prontos. O registro em si NÃO é feito
  // automaticamente para não pedir permissão antes de tudo estar configurado.
  // Depois de configurar o Firebase (Android) e o APNs (iOS), chame:
  //     window.ElarahPush.register()
  // por exemplo após o login, ou num botão "Ativar notificações".
  var Push = plugin('PushNotifications');

  window.ElarahPush = {
    available: !!Push,
    register: function () {
      if (!Push || !Push.requestPermissions) {
        return Promise.reject(new Error('Plugin de push indisponível (rode em um dispositivo).'));
      }
      return Push.requestPermissions().then(function (res) {
        if (res && res.receive === 'granted') {
          return Push.register();
        }
        throw new Error('Permissão de notificações negada pelo usuário.');
      });
    },
  };

  if (Push && Push.addListener) {
    // Token do aparelho — é o que o backend usa para enviar notificações a ELE.
    Push.addListener('registration', function (token) {
      var value = token && token.value;
      console.log('[Elarah] Token de push:', value);
      // TODO: enviar `value` para o backend (Supabase) e salvar junto do usuário.
      window.dispatchEvent(new CustomEvent('elarah:push-token', { detail: value }));
    });

    Push.addListener('registrationError', function (err) {
      console.warn('[Elarah] Erro ao registrar push:', err);
    });

    // Notificação recebida com o app aberto.
    Push.addListener('pushNotificationReceived', function (notification) {
      console.log('[Elarah] Notificação recebida:', notification);
    });

    // Usuário tocou na notificação — navega para a tela indicada em data.url.
    Push.addListener('pushNotificationActionPerformed', function (action) {
      var data = action && action.notification && action.notification.data;
      if (data && data.url) {
        try {
          var u = new URL(data.url, window.location.href);
          window.location.assign(u.pathname + u.search + u.hash);
        } catch (e) {
          /* ignora url inválida */
        }
      }
    });
  }
})();
