/* =============================================================
 * ELARAH — pagarme-checkout.js
 * -------------------------------------------------------------
 * Módulo frontend autocontido (sem dependências) que implementa o
 * Checkout Transparente do Pagar.me — o gateway definitivo da Elarah.
 *
 * Responsabilidades:
 *   1. Buscar a PUBLIC KEY (pk_...) do backend (get-pagarme-public-key).
 *   2. TOKENIZAR o cartão no CLIENTE (POST /tokens?appId=pk_...), pra
 *      que número/CVV NUNCA passem pelo nosso servidor (PCI safe).
 *   3. Gerar/propagar o SESSION ID (device/fingerprint) do antifraude.
 *   4. Chamar as Edge Functions:
 *        - create-pagarme-card-payment  (cartão à vista + parcelado)
 *        - create-pagarme-pix-payment   (PIX)
 *
 * Não toca no DOM nem no fluxo existente. Expõe window.ElarahPagarme
 * com uma API pequena; o checkout do script.js chama esses métodos.
 * Assim a "virada" do gateway é uma mudança pequena e reversível
 * (ver docs/pagarme-integracao.md → "Como virar o checkout").
 *
 * Docs Pagar.me:
 *   Tokenização: https://docs.pagar.me/reference/criar-token-cart%C3%A3o-1
 *   Orders:      https://docs.pagar.me/reference (Core API v5)
 * ============================================================= */
(function () {
  'use strict';

  var PAGARME_TOKENS_URL = 'https://api.pagar.me/core/v5/tokens';

  var _cfg = {
    fnBase: 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1',
    anonKey: '', // JWT anon do Supabase (o script.js já tem — passe no init)
  };

  var _publicKeyPromise = null;
  var _publicKey = null;
  var _sessionId = null;

  // ---- init: recebe a base das functions + a anon key do Supabase ----
  function init(opts) {
    opts = opts || {};
    if (opts.fnBase) _cfg.fnBase = String(opts.fnBase).replace(/\/+$/, '');
    if (opts.anonKey) _cfg.anonKey = String(opts.anonKey);
    // Pré-aquece a public key na abertura do checkout (latência menor).
    if (opts.warmUp !== false) getPublicKey().catch(function () {});
    return api;
  }

  function _authHeaders(extra) {
    var h = { 'Content-Type': 'application/json' };
    if (_cfg.anonKey) {
      h['Authorization'] = 'Bearer ' + _cfg.anonKey;
      h['apikey'] = _cfg.anonKey;
    }
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  // ---- Public key (cacheada) ----
  function getPublicKey() {
    if (_publicKey) return Promise.resolve(_publicKey);
    if (_publicKeyPromise) return _publicKeyPromise;
    _publicKeyPromise = fetch(_cfg.fnBase + '/get-pagarme-public-key', {
      method: 'GET',
      headers: _authHeaders(),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _publicKey = (data && data.public_key) || null;
        if (!_publicKey) {
          console.warn('[Elarah Payment/Pagarme] sem PAGARME_PUBLIC_KEY — cartão indisponível.');
        }
        return _publicKey;
      })
      .catch(function (e) {
        console.warn('[Elarah Payment/Pagarme] get-pagarme-public-key falhou.', e);
        _publicKeyPromise = null; // permite retry
        return null;
      });
    return _publicKeyPromise;
  }

  // ---- Session ID (device/fingerprint do antifraude) ----
  // Gera um id estável por sessão do navegador. IMPORTANTE: pra ALIMENTAR
  // de fato o motor antifraude (ClearSale/Pagar.me), o snippet oficial de
  // fingerprint da conta deve ser adicionado à página com o app id do
  // contrato — ver docs/pagarme-integracao.md → "Antifraude / fingerprint".
  // Enquanto isso, este id já vai como session_id (metadata) em toda
  // transação e serve de correlação básica.
  function getSessionId() {
    if (_sessionId) return _sessionId;
    // Se o snippet oficial já populou um id global, usa ele.
    if (window.ELARAH_PAGARME_SESSION_ID) {
      _sessionId = String(window.ELARAH_PAGARME_SESSION_ID);
      return _sessionId;
    }
    try {
      var stored = sessionStorage.getItem('elarah_pagarme_sid');
      if (stored) { _sessionId = stored; return _sessionId; }
    } catch (e) {}
    var sid = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('sid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 12));
    _sessionId = sid;
    try { sessionStorage.setItem('elarah_pagarme_sid', sid); } catch (e) {}
    return _sessionId;
  }

  // ---- Tokenização do cartão (client-side) ----
  // card = { number, holderName, holderDocument, expMonth, expYear, cvv }
  // Retorna o card_token (uso único, expira em 60s). Lança em erro.
  function tokenizeCard(card) {
    return getPublicKey().then(function (pk) {
      if (!pk) throw new Error('pagarme_public_key_missing');
      var body = {
        type: 'card',
        card: {
          number: onlyDigits(card.number),
          holder_name: String(card.holderName || '').trim(),
          exp_month: Number(card.expMonth),
          exp_year: normalizeYear(card.expYear),
          cvv: onlyDigits(card.cvv),
        },
      };
      var doc = onlyDigits(card.holderDocument);
      if (doc) body.card.holder_document = doc;

      // A tokenização autentica SÓ com a public key na query (?appId=).
      // NÃO enviar Authorization aqui (regra do endpoint /tokens).
      return fetch(PAGARME_TOKENS_URL + '?appId=' + encodeURIComponent(pk), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data || !data.id) {
            console.error('[Elarah Payment/Pagarme] tokenização falhou', r.status, data);
            var msg = (data && data.message) || 'Não foi possível validar o cartão. Confira os dados.';
            var err = new Error('tokenize_failed');
            err.userMessage = msg;
            err.detail = data;
            throw err;
          }
          return data.id; // card_token (token_...)
        });
      });
    });
  }

  // ---- Pagamento no CARTÃO ----
  // payload = campos do checkout (experiencia_id, email, nome, cpf, ...)
  //   + card { number, holderName, holderDocument, expMonth, expYear, cvv }
  //   + installments
  function payWithCard(payload) {
    var card = payload.card || {};
    return tokenizeCard(card).then(function (cardToken) {
      var body = Object.assign({}, stripCard(payload), {
        token: cardToken,
        installments: Math.max(1, parseInt(payload.installments, 10) || 1),
        device_id: getSessionId(),
      });
      return fetch(_cfg.fnBase + '/create-pagarme-card-payment', {
        method: 'POST',
        headers: _authHeaders(),
        body: JSON.stringify(body),
      }).then(parseFnResponse);
    });
  }

  // ---- Pagamento no PIX ----
  function payWithPix(payload) {
    var body = Object.assign({}, stripCard(payload), {
      device_id: getSessionId(),
    });
    return fetch(_cfg.fnBase + '/create-pagarme-pix-payment', {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify(body),
    }).then(parseFnResponse);
  }

  // ---- helpers ----
  function parseFnResponse(r) {
    return r.json().then(function (data) {
      if (!r.ok) {
        var err = new Error((data && data.error) || 'checkout_failed');
        err.userMessage = (data && data.message) || 'Não foi possível concluir o pagamento.';
        err.detail = data;
        err.status = r.status;
        throw err;
      }
      return data;
    });
  }

  // Remove o objeto `card` do payload antes de mandar pro backend —
  // dados sensíveis do cartão NUNCA vão pro nosso servidor (só o token).
  function stripCard(payload) {
    var clone = Object.assign({}, payload);
    delete clone.card;
    return clone;
  }

  function onlyDigits(v) { return String(v == null ? '' : v).replace(/\D+/g, ''); }
  function normalizeYear(y) {
    var n = parseInt(onlyDigits(y), 10) || 0;
    if (n < 100) n += 2000; // "27" → 2027
    return n;
  }

  var api = {
    init: init,
    getPublicKey: getPublicKey,
    getSessionId: getSessionId,
    tokenizeCard: tokenizeCard,
    payWithCard: payWithCard,
    payWithPix: payWithPix,
  };

  window.ElarahPagarme = api;
})();
