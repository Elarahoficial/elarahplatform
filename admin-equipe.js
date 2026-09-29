/* =============================================================
   ELARAH — EQUIPE & ACESSOS (aba Usuários do admin.html)
   -------------------------------------------------------------
   Antes, quem tinha acesso ao painel ficava perdido no meio da lista
   de todas as clientes. Aqui fica só a equipe, num lugar só:
     - quem tem acesso, a qual plataforma e a quais abas
     - último login
     - criar login novo (e-mail + senha, já confirmado)
     - definir senha nova
     - trocar ou tirar o acesso

   Dois tipos de login:
     • Só Elarah Mental Health (parceira) → entra no admin-mh.html e
       vê só as abas marcadas. Não é admin: a Elarah fica fechada pra
       ela pelo banco (sql/elarah_mh_equipe.sql).
     • Equipe Elarah → abas do admin.html (pode incluir a Mental Health).

   Só aparece pra quem tem ACESSO TOTAL. Tudo passa pela Edge Function
   admin-equipe (service role no servidor; a senha nunca é guardada —
   aparece uma vez na tela pra você mandar pra pessoa).
   ============================================================= */
(function () {
  'use strict';

  var MH_ABAS = [
    { key: 'visao', label: 'Visão geral' },
    { key: 'hoje', label: 'O que fazer hoje' },
    { key: 'eventos', label: 'Agenda & datas do RH' },
    { key: 'acomp', label: 'Acompanhamento semanal' },
    { key: 'cronograma', label: 'Cronogramas' },
    { key: 'leads', label: 'Pedidos do site' },
    { key: 'ideias', label: 'Ideias & programa anual' },
    { key: 'prosp', label: 'Prospecção' },
    { key: 'captacao', label: 'Captação' }
  ];
  var LINK_MH = 'https://elarah.com.br/admin-mh.html';
  var LINK_ELARAH = 'https://elarah.com.br/admin.html';

  var equipe = [];
  var montado = false;

  function esc(v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
  function lista(p) {
    if (p == null) return null;
    if (Array.isArray(p)) return p.map(String);
    return String(p).replace(/^\{|\}$/g, '').split(',').map(function (x) { return x.trim().replace(/^"|"$/g, ''); }).filter(Boolean);
  }
  function tipoDe(u) {
    var l = lista(u.admin_panels);
    if (u.role === 'admin' && l === null) return 'total';
    if (u.role === 'admin') return l.indexOf('mental-health') >= 0 ? 'ambas' : 'elarah';
    return 'mh';
  }
  function resumoAcesso(u) {
    var t = tipoDe(u), l = lista(u.admin_panels) || [];
    if (t === 'total') return { tag: 'Acesso total', cor: '#b07b00', det: 'Elarah + Mental Health, tudo' };
    if (t === 'mh') {
      var abas = l.filter(function (k) { return k.indexOf('mh:') === 0; }).map(function (k) { return k.slice(3); });
      var nomes = abas.length ? MH_ABAS.filter(function (a) { return abas.indexOf(a.key) >= 0; }).map(function (a) { return a.label; }) : ['todas as abas'];
      return { tag: 'Só Mental Health', cor: '#2e6a57', det: nomes.join(', ') };
    }
    var A = window.ElarahAcessos;
    var nomesE = l.filter(function (k) { return k.indexOf('mh:') !== 0; }).map(function (k) { return A ? A.labelDoPainel(k) : k; });
    return { tag: t === 'ambas' ? 'Elarah + Mental Health' : 'Só Elarah', cor: '#c2621c', det: nomesE.join(', ') };
  }
  function quando(iso) {
    if (!iso) return 'nunca entrou';
    var d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  async function chamar(corpo) {
    var sb = window.supabaseClient;
    if (!sb) throw new Error('Supabase não carregou. Recarregue a página.');
    var r = await sb.functions.invoke('admin-equipe', { body: corpo });
    if (r.error) {
      var msg = r.error.message || String(r.error);
      try { var ctx = r.error.context; if (ctx && ctx.json) { var j = await ctx.json(); if (j && j.message) msg = j.message; } } catch (_) {}
      if (/not found|404|Failed to send/i.test(msg)) msg = 'A função admin-equipe ainda não foi publicada. Ela sobe sozinha quando a PR entra na branch principal — espere uns minutos e tente de novo.';
      throw new Error(msg);
    }
    if (r.data && r.data.error) throw new Error(r.data.message || r.data.error);
    return r.data;
  }

  // ---------------- Card na aba Usuários ----------------
  function montarCard() {
    var painel = document.getElementById('panel-users');
    if (!painel || document.getElementById('equipe-card')) return;
    var card = document.createElement('div');
    card.className = 'admin__table-wrap';
    card.id = 'equipe-card';
    card.style.marginBottom = '16px';
    card.innerHTML =
      '<div class="admin__table-header" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
        '<span class="admin__table-title">👥 Equipe &amp; acessos</span>' +
        '<button type="button" class="admin__btn admin__btn--primary" data-eq-novo style="white-space:nowrap;">+ Novo acesso</button>' +
      '</div>' +
      '<div style="padding:12px 18px 4px;font-size:.84rem;color:#666;">Só quem entra em algum painel. Crie o login da parceira da Mental Health aqui — ela só enxerga a Mental Health, nas abas que você marcar.</div>' +
      '<div id="equipe-lista" style="padding:8px 18px 18px;"><div style="color:#999;font-size:.88rem;">Carregando…</div></div>';
    var stats = painel.querySelector('.admin__stats');
    if (stats && stats.nextSibling) painel.insertBefore(card, stats.nextSibling);
    else painel.appendChild(card);
  }

  function desenharLista(msgErro) {
    var box = document.getElementById('equipe-lista');
    if (!box) return;
    if (msgErro) { box.innerHTML = '<div style="color:#b00;font-size:.88rem;">' + esc(msgErro) + '</div>'; return; }
    if (!equipe.length) { box.innerHTML = '<div style="color:#999;font-size:.88rem;">Ninguém da equipe ainda.</div>'; return; }
    box.innerHTML =
      '<div style="overflow:auto;"><table class="admin__table" style="min-width:680px;"><thead><tr><th>Pessoa</th><th>Acesso</th><th>Último login</th><th></th></tr></thead><tbody>' +
      equipe.map(function (u) {
        var r = resumoAcesso(u), total = tipoDe(u) === 'total';
        return '<tr>' +
          '<td><b>' + esc(u.nome || '—') + '</b>' + (u.sou_eu ? ' <small style="color:#999;">(você)</small>' : '') + '<br><span style="font-size:.84rem;color:#555;">' + esc(u.email) + '</span></td>' +
          '<td><span style="display:inline-block;font-size:.74rem;font-weight:700;color:#fff;background:' + r.cor + ';border-radius:999px;padding:3px 10px;">' + esc(r.tag) + '</span>' +
            '<div style="font-size:.78rem;color:#777;margin-top:4px;max-width:340px;">' + esc(r.det) + '</div></td>' +
          '<td style="font-size:.84rem;color:#555;white-space:nowrap;">' + esc(quando(u.ultimo_login)) + '</td>' +
          '<td style="white-space:nowrap;text-align:right;">' +
            (total ? '' : '<button type="button" class="admin__btn" data-eq-editar="' + esc(u.id) + '" style="font-size:.8rem;padding:6px 10px;">Editar acesso</button> ') +
            '<button type="button" class="admin__btn" data-eq-senha="' + esc(u.id) + '" style="font-size:.8rem;padding:6px 10px;">Nova senha</button> ' +
            (total ? '' : '<button type="button" class="admin__btn" data-eq-remover="' + esc(u.id) + '" style="font-size:.8rem;padding:6px 10px;color:#b00;">Tirar acesso</button>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  async function carregar() {
    try {
      var d = await chamar({ acao: 'listar' });
      equipe = (d && d.equipe) || [];
      desenharLista();
    } catch (e) { desenharLista(e.message); }
  }

  // ---------------- Modal ----------------
  function modal(html) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto;';
    ov.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:560px;width:100%;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.2);font-family:inherit;">' + html + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-eq-fechar]')) ov.remove(); });
    return ov;
  }
  var INPUT = 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:.9rem;margin-top:4px;';
  var BTN_OK = 'padding:9px 18px;border:0;background:#f0a05e;color:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600;font-size:.9rem;';
  var BTN_NO = 'padding:9px 16px;border:1px solid #ddd;background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;font-size:.9rem;color:#666;';

  function checks(prefixo, itens, marcadas) {
    return itens.map(function (a) {
      return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:.88rem;cursor:pointer;">' +
        '<input type="checkbox" data-eq-aba="' + esc(prefixo + a.key) + '"' + (marcadas.indexOf(prefixo + a.key) >= 0 ? ' checked' : '') + '>' + esc(a.label) + '</label>';
    }).join('');
  }

  function formAcesso(u) {
    var t = u ? tipoDe(u) : 'mh';
    if (t === 'ambas') t = 'elarah';
    var l = u ? (lista(u.admin_panels) || []) : [];
    var mhMarc = t === 'mh' ? l.filter(function (k) { return k.indexOf('mh:') === 0; }) : [];
    if (t === 'mh' && !mhMarc.length) mhMarc = MH_ABAS.map(function (a) { return 'mh:' + a.key; }); // sem abas = todas
    var A = window.ElarahAcessos;
    var elarahItens = A ? A.PAINEIS.map(function (p) { return { key: p.key, label: p.label + (p.key === 'mental-health' ? ' (plataforma inteira)' : '') }; }) : [];
    return '<div style="margin:6px 0 10px;font-size:.84rem;color:#666;">O que essa pessoa pode ver:</div>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border:1px solid #e8e1d6;border-radius:8px;margin-bottom:8px;cursor:pointer;">' +
        '<input type="radio" name="eq-tipo" value="mh"' + (t === 'mh' ? ' checked' : '') + '><span><b>Só Elarah Mental Health</b><br><small style="color:#777;">Parceira. Não vê nada da Elarah.</small></span></label>' +
      '<div data-eq-bloco="mh" style="padding:4px 12px 10px;' + (t === 'mh' ? '' : 'display:none;') + '">' + checks('mh:', MH_ABAS, mhMarc) + '</div>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border:1px solid #e8e1d6;border-radius:8px;margin-bottom:8px;cursor:pointer;">' +
        '<input type="radio" name="eq-tipo" value="elarah"' + (t === 'elarah' ? ' checked' : '') + '><span><b>Equipe Elarah</b><br><small style="color:#777;">Abas do painel Elarah (marque “Elarah Mental Health” pra ver as duas).</small></span></label>' +
      '<div data-eq-bloco="elarah" style="padding:4px 12px 10px;max-height:260px;overflow:auto;' + (t === 'elarah' ? '' : 'display:none;') + '">' + checks('', elarahItens, t === 'elarah' ? l : []) + '</div>';
  }
  function ligarForm(ov) {
    ov.querySelectorAll('input[name="eq-tipo"]').forEach(function (r) {
      r.addEventListener('change', function () {
        ov.querySelectorAll('[data-eq-bloco]').forEach(function (b) { b.style.display = b.getAttribute('data-eq-bloco') === r.value ? '' : 'none'; });
      });
    });
  }
  function lerForm(ov) {
    var tipo = (ov.querySelector('input[name="eq-tipo"]:checked') || {}).value || 'mh';
    var bloco = ov.querySelector('[data-eq-bloco="' + tipo + '"]');
    var paineis = [];
    bloco.querySelectorAll('[data-eq-aba]').forEach(function (c) { if (c.checked) paineis.push(c.getAttribute('data-eq-aba')); });
    if (tipo === 'mh' && paineis.length === MH_ABAS.length) paineis = []; // todas = sem restrição
    return { tipo: tipo, paineis: paineis, vazio: tipo === 'elarah' ? !paineis.length : !bloco.querySelectorAll('[data-eq-aba]:checked').length };
  }

  function mostrarSenha(email, senha, tipo) {
    var link = tipo === 'mh' ? LINK_MH : LINK_ELARAH;
    var plat = tipo === 'mh' ? 'Elarah Mental Health' : 'painel da Elarah';
    var msg = 'Oi! Seu acesso ao ' + plat + ' está pronto 💚\n\n' +
      '1) Entre em https://elarah.com.br com:\n   E-mail: ' + email + '\n   Senha: ' + senha + '\n' +
      '2) Depois abra: ' + link + '\n\nSe quiser, troque a senha em Minha conta.';
    var ov = modal(
      '<h2 style="margin:0 0 6px;font-size:1.15rem;">Acesso pronto ✅</h2>' +
      '<p style="margin:0 0 14px;color:#777;font-size:.86rem;">Anote ou mande agora: por segurança, a senha não fica salva e não aparece de novo. Se perder, é só gerar uma nova.</p>' +
      '<div style="background:#fbf7f0;border:1px solid #f0e6d6;border-radius:8px;padding:12px 14px;font-size:.92rem;">' +
        '<div><b>E-mail:</b> ' + esc(email) + '</div><div style="margin-top:4px;"><b>Senha:</b> <code style="font-size:1rem;">' + esc(senha) + '</code></div>' +
        '<div style="margin-top:4px;"><b>Painel:</b> ' + esc(link) + '</div></div>' +
      '<textarea readonly style="' + INPUT + 'height:150px;margin-top:12px;font-size:.84rem;">' + esc(msg) + '</textarea>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">' +
        '<button type="button" data-eq-copiar style="' + BTN_NO + '">Copiar mensagem</button>' +
        '<button type="button" data-eq-fechar style="' + BTN_OK + '">Pronto</button></div>');
    ov.querySelector('[data-eq-copiar]').addEventListener('click', function () {
      var b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(function () { b.textContent = 'Copiado!'; })
        .catch(function () { ov.querySelector('textarea').select(); document.execCommand('copy'); b.textContent = 'Copiado!'; });
    });
  }

  function abrirNovo() {
    var ov = modal(
      '<h2 style="margin:0 0 4px;font-size:1.15rem;">Novo acesso</h2>' +
      '<p style="margin:0 0 14px;color:#777;font-size:.86rem;">Cria o login já confirmado. Se o e-mail já tiver conta, só troca a senha e o acesso.</p>' +
      '<label style="display:block;font-size:.84rem;color:#555;">Nome<input data-eq-nome style="' + INPUT + '" placeholder="Larissa Setzer"></label>' +
      '<label style="display:block;font-size:.84rem;color:#555;margin-top:10px;">E-mail<input data-eq-email type="email" autocapitalize="off" spellcheck="false" style="' + INPUT + '" placeholder="nome@email.com"></label>' +
      '<label style="display:block;font-size:.84rem;color:#555;margin-top:10px;">Senha <small style="color:#999;">(deixe vazio que a gente gera uma)</small><input data-eq-senhainput type="text" autocomplete="off" style="' + INPUT + '" placeholder="mínimo 8 caracteres"></label>' +
      '<div style="margin-top:14px;">' + formAcesso(null) + '</div>' +
      '<div data-eq-erro style="display:none;color:#b00;font-size:.85rem;margin-top:10px;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">' +
        '<button type="button" data-eq-fechar style="' + BTN_NO + '">Cancelar</button>' +
        '<button type="button" data-eq-salvar style="' + BTN_OK + '">Criar acesso</button></div>');
    ligarForm(ov);
    ov.querySelector('[data-eq-salvar]').addEventListener('click', async function () {
      var btn = this, erro = ov.querySelector('[data-eq-erro]');
      var f = lerForm(ov);
      var email = ov.querySelector('[data-eq-email]').value.trim();
      var senha = ov.querySelector('[data-eq-senhainput]').value.trim();
      erro.style.display = 'none';
      if (!email) { erro.textContent = 'Informe o e-mail.'; erro.style.display = 'block'; return; }
      if (senha && senha.length < 8) { erro.textContent = 'A senha precisa ter pelo menos 8 caracteres.'; erro.style.display = 'block'; return; }
      if (f.vazio) { erro.textContent = 'Marque pelo menos uma aba.'; erro.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = 'Criando…';
      try {
        var d = await chamar({ acao: 'criar', email: email, nome: ov.querySelector('[data-eq-nome]').value.trim(), senha: senha, tipo: f.tipo, paineis: f.paineis });
        ov.remove();
        mostrarSenha(d.email, d.senha, f.tipo);
        carregar();
      } catch (e) {
        erro.textContent = e.message; erro.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Criar acesso';
      }
    });
  }

  function abrirEditar(u) {
    var ov = modal(
      '<h2 style="margin:0 0 4px;font-size:1.15rem;">Editar acesso</h2>' +
      '<p style="margin:0 0 14px;color:#777;font-size:.86rem;">' + esc(u.nome || '') + ' <span style="color:#aaa;">(' + esc(u.email) + ')</span></p>' +
      formAcesso(u) +
      '<div data-eq-erro style="display:none;color:#b00;font-size:.85rem;margin-top:10px;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">' +
        '<button type="button" data-eq-fechar style="' + BTN_NO + '">Cancelar</button>' +
        '<button type="button" data-eq-salvar style="' + BTN_OK + '">Salvar</button></div>');
    ligarForm(ov);
    ov.querySelector('[data-eq-salvar]').addEventListener('click', async function () {
      var btn = this, erro = ov.querySelector('[data-eq-erro]');
      var f = lerForm(ov);
      if (f.vazio) { erro.textContent = 'Marque pelo menos uma aba (ou use “Tirar acesso”).'; erro.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = 'Salvando…';
      try { await chamar({ acao: 'acesso', user_id: u.id, tipo: f.tipo, paineis: f.paineis }); ov.remove(); carregar(); }
      catch (e) { erro.textContent = e.message; erro.style.display = 'block'; btn.disabled = false; btn.textContent = 'Salvar'; }
    });
  }

  function abrirSenha(u) {
    var ov = modal(
      '<h2 style="margin:0 0 4px;font-size:1.15rem;">Nova senha</h2>' +
      '<p style="margin:0 0 14px;color:#777;font-size:.86rem;">' + esc(u.email) + ' — a senha antiga para de funcionar na hora.</p>' +
      '<label style="display:block;font-size:.84rem;color:#555;">Senha nova <small style="color:#999;">(deixe vazio que a gente gera uma)</small><input data-eq-senhainput type="text" autocomplete="off" style="' + INPUT + '" placeholder="mínimo 8 caracteres"></label>' +
      '<div data-eq-erro style="display:none;color:#b00;font-size:.85rem;margin-top:10px;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">' +
        '<button type="button" data-eq-fechar style="' + BTN_NO + '">Cancelar</button>' +
        '<button type="button" data-eq-salvar style="' + BTN_OK + '">Definir senha</button></div>');
    ov.querySelector('[data-eq-salvar]').addEventListener('click', async function () {
      var btn = this, erro = ov.querySelector('[data-eq-erro]');
      var senha = ov.querySelector('[data-eq-senhainput]').value.trim();
      if (senha && senha.length < 8) { erro.textContent = 'A senha precisa ter pelo menos 8 caracteres.'; erro.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = 'Salvando…';
      try {
        var d = await chamar({ acao: 'senha', user_id: u.id, senha: senha });
        ov.remove();
        mostrarSenha(d.email, d.senha, tipoDe(u) === 'mh' ? 'mh' : 'elarah');
      } catch (e) { erro.textContent = e.message; erro.style.display = 'block'; btn.disabled = false; btn.textContent = 'Definir senha'; }
    });
  }

  async function remover(u) {
    if (!confirm('Tirar o acesso de ' + (u.nome || u.email) + '? A conta continua existindo, só não entra mais no painel.')) return;
    try { await chamar({ acao: 'remover', user_id: u.id }); carregar(); }
    catch (e) { alert(e.message); }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-eq-novo],[data-eq-editar],[data-eq-senha],[data-eq-remover]');
    if (!t) return;
    if (t.hasAttribute('data-eq-novo')) return abrirNovo();
    var id = t.getAttribute('data-eq-editar') || t.getAttribute('data-eq-senha') || t.getAttribute('data-eq-remover');
    var u = equipe.filter(function (x) { return x.id === id; })[0];
    if (!u) return;
    if (t.hasAttribute('data-eq-editar')) abrirEditar(u);
    else if (t.hasAttribute('data-eq-senha')) abrirSenha(u);
    else remover(u);
  });

  // Aparece quando a aba Usuários abre (e só pra quem tem acesso total).
  function tentarMontar() {
    var A = window.ElarahAcessos;
    var painel = document.getElementById('panel-users');
    if (!painel || !A || !A.souAdminTotal()) return;
    var ativo = painel.classList.contains('admin__panel--active') || painel.offsetParent !== null;
    if (!ativo) return;
    montarCard();
    if (!montado) { montado = true; carregar(); }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.admin__nav-item[data-panel="users"]')) setTimeout(tentarMontar, 300);
  });

  // admin.html#equipe (link do painel Mental Health) abre direto aqui.
  function irParaEquipe() {
    if (location.hash !== '#equipe') return;
    var t0 = Date.now();
    // O menu só responde depois que o admin.js termina o boot: clica
    // até a aba Usuários abrir de verdade (ou desiste em 20s).
    (function tentar() {
      var painel = document.getElementById('panel-users');
      if (painel && painel.classList.contains('admin__panel--active')) {
        setTimeout(function () {
          tentarMontar();
          var c = document.getElementById('equipe-card'); if (c) c.scrollIntoView({ block: 'start' });
        }, 400);
        return;
      }
      var btn = document.querySelector('.admin__nav-item[data-panel="users"]');
      if (btn && window.ElarahAcessos && document.querySelector('.admin__main')) btn.click();
      if (Date.now() - t0 < 20000) setTimeout(tentar, 500);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', irParaEquipe);
  else irParaEquipe();
})();
