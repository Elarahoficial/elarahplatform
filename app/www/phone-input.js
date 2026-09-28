/* =============================================================
   ELARAH — Campo de telefone com seletor de país
   -------------------------------------------------------------
   Por que existe: o campo de WhatsApp era um input só, com máscara
   fixa de Brasil. Dois problemas nasciam daí:

     1. Número estrangeiro não cabia na máscara — "+39 351 743 4071"
        virava "(39) 35174-3407", um número BR que não existe.
     2. Sem saber o país, não dá pra checar se faltou dígito. Um
        celular BR com 10 dígitos pode ser "esqueci o 9" ou pode ser
        um telefone de outro país que realmente tem 10. Chutar é o
        que fazia o painel abrir conversa com a pessoa errada.

   Com o país escolhido na mão, os dois somem: a máscara só vale pro
   Brasil e a contagem de dígitos é conferida contra o país certo.

   Uso:
     ElarahPhone.mount(input)              // liga o seletor no input
     ElarahPhone.mount(input, { value })   // já preenchido
     ElarahPhone.get(input)                // { valid, error, e164, … }
     ElarahPhone.value(input)              // "+55 11 91234-5678"

   Inputs estáticos podem se ligar sozinhos com data-phone-intl.
   ============================================================= */

(function () {
  'use strict';

  // ===== PAÍSES =====
  // len: quantidades de dígitos aceitas no número nacional (sem DDI).
  // Onde a numeração do país varia muito, vai uma faixa generosa —
  // recusar número válido de gente real é pior que aceitar um torto.
  // O Brasil é o único com regra fechada (ver validateBR).
  const COUNTRIES = [
    { iso: 'BR', nome: 'Brasil',              ddi: '55',  flag: '🇧🇷', len: [10, 11] },
    { iso: 'DE', nome: 'Alemanha',            ddi: '49',  flag: '🇩🇪', len: [10, 11] },
    { iso: 'AO', nome: 'Angola',              ddi: '244', flag: '🇦🇴', len: [9] },
    { iso: 'SA', nome: 'Arábia Saudita',      ddi: '966', flag: '🇸🇦', len: [9] },
    { iso: 'AR', nome: 'Argentina',           ddi: '54',  flag: '🇦🇷', len: [10, 11] },
    { iso: 'AU', nome: 'Austrália',           ddi: '61',  flag: '🇦🇺', len: [9] },
    { iso: 'AT', nome: 'Áustria',             ddi: '43',  flag: '🇦🇹', len: [10, 13] },
    { iso: 'BE', nome: 'Bélgica',             ddi: '32',  flag: '🇧🇪', len: [9] },
    { iso: 'BO', nome: 'Bolívia',             ddi: '591', flag: '🇧🇴', len: [8] },
    { iso: 'BG', nome: 'Bulgária',            ddi: '359', flag: '🇧🇬', len: [8, 9] },
    { iso: 'CV', nome: 'Cabo Verde',          ddi: '238', flag: '🇨🇻', len: [7] },
    { iso: 'CA', nome: 'Canadá',              ddi: '1',   flag: '🇨🇦', len: [10] },
    { iso: 'QA', nome: 'Catar',               ddi: '974', flag: '🇶🇦', len: [8] },
    { iso: 'CL', nome: 'Chile',               ddi: '56',  flag: '🇨🇱', len: [9] },
    { iso: 'CN', nome: 'China',               ddi: '86',  flag: '🇨🇳', len: [11] },
    { iso: 'CY', nome: 'Chipre',              ddi: '357', flag: '🇨🇾', len: [8] },
    { iso: 'CO', nome: 'Colômbia',            ddi: '57',  flag: '🇨🇴', len: [10] },
    { iso: 'KR', nome: 'Coreia do Sul',       ddi: '82',  flag: '🇰🇷', len: [9, 10] },
    { iso: 'CR', nome: 'Costa Rica',          ddi: '506', flag: '🇨🇷', len: [8] },
    { iso: 'HR', nome: 'Croácia',             ddi: '385', flag: '🇭🇷', len: [8, 9] },
    { iso: 'CU', nome: 'Cuba',                ddi: '53',  flag: '🇨🇺', len: [8] },
    { iso: 'DK', nome: 'Dinamarca',           ddi: '45',  flag: '🇩🇰', len: [8] },
    { iso: 'EG', nome: 'Egito',               ddi: '20',  flag: '🇪🇬', len: [10] },
    { iso: 'AE', nome: 'Emirados Árabes',     ddi: '971', flag: '🇦🇪', len: [9] },
    { iso: 'EC', nome: 'Equador',             ddi: '593', flag: '🇪🇨', len: [9] },
    { iso: 'SK', nome: 'Eslováquia',          ddi: '421', flag: '🇸🇰', len: [9] },
    { iso: 'SI', nome: 'Eslovênia',           ddi: '386', flag: '🇸🇮', len: [8] },
    { iso: 'ES', nome: 'Espanha',             ddi: '34',  flag: '🇪🇸', len: [9] },
    { iso: 'US', nome: 'Estados Unidos',      ddi: '1',   flag: '🇺🇸', len: [10], principal: true },
    { iso: 'EE', nome: 'Estônia',             ddi: '372', flag: '🇪🇪', len: [7, 8] },
    { iso: 'PH', nome: 'Filipinas',           ddi: '63',  flag: '🇵🇭', len: [10] },
    { iso: 'FI', nome: 'Finlândia',           ddi: '358', flag: '🇫🇮', len: [9, 10] },
    { iso: 'FR', nome: 'França',              ddi: '33',  flag: '🇫🇷', len: [9] },
    { iso: 'GR', nome: 'Grécia',              ddi: '30',  flag: '🇬🇷', len: [10] },
    { iso: 'NL', nome: 'Holanda',             ddi: '31',  flag: '🇳🇱', len: [9] },
    { iso: 'HK', nome: 'Hong Kong',           ddi: '852', flag: '🇭🇰', len: [8] },
    { iso: 'HU', nome: 'Hungria',             ddi: '36',  flag: '🇭🇺', len: [9] },
    { iso: 'IN', nome: 'Índia',               ddi: '91',  flag: '🇮🇳', len: [10] },
    { iso: 'ID', nome: 'Indonésia',           ddi: '62',  flag: '🇮🇩', len: [9, 12] },
    { iso: 'IE', nome: 'Irlanda',             ddi: '353', flag: '🇮🇪', len: [9] },
    { iso: 'IS', nome: 'Islândia',            ddi: '354', flag: '🇮🇸', len: [7] },
    { iso: 'IL', nome: 'Israel',              ddi: '972', flag: '🇮🇱', len: [9] },
    { iso: 'IT', nome: 'Itália',              ddi: '39',  flag: '🇮🇹', len: [9, 11] },
    { iso: 'JP', nome: 'Japão',               ddi: '81',  flag: '🇯🇵', len: [10] },
    { iso: 'LV', nome: 'Letônia',             ddi: '371', flag: '🇱🇻', len: [8] },
    { iso: 'LT', nome: 'Lituânia',            ddi: '370', flag: '🇱🇹', len: [8] },
    { iso: 'LU', nome: 'Luxemburgo',          ddi: '352', flag: '🇱🇺', len: [9] },
    { iso: 'MY', nome: 'Malásia',             ddi: '60',  flag: '🇲🇾', len: [9, 10] },
    { iso: 'MT', nome: 'Malta',               ddi: '356', flag: '🇲🇹', len: [8] },
    { iso: 'MA', nome: 'Marrocos',            ddi: '212', flag: '🇲🇦', len: [9] },
    { iso: 'MX', nome: 'México',              ddi: '52',  flag: '🇲🇽', len: [10] },
    { iso: 'MZ', nome: 'Moçambique',          ddi: '258', flag: '🇲🇿', len: [9] },
    { iso: 'NG', nome: 'Nigéria',             ddi: '234', flag: '🇳🇬', len: [10] },
    { iso: 'NO', nome: 'Noruega',             ddi: '47',  flag: '🇳🇴', len: [8] },
    { iso: 'NZ', nome: 'Nova Zelândia',       ddi: '64',  flag: '🇳🇿', len: [8, 10] },
    { iso: 'PA', nome: 'Panamá',              ddi: '507', flag: '🇵🇦', len: [8] },
    { iso: 'PY', nome: 'Paraguai',            ddi: '595', flag: '🇵🇾', len: [9] },
    { iso: 'PE', nome: 'Peru',                ddi: '51',  flag: '🇵🇪', len: [9] },
    { iso: 'PL', nome: 'Polônia',             ddi: '48',  flag: '🇵🇱', len: [9] },
    { iso: 'PT', nome: 'Portugal',            ddi: '351', flag: '🇵🇹', len: [9] },
    { iso: 'KE', nome: 'Quênia',              ddi: '254', flag: '🇰🇪', len: [9] },
    { iso: 'GB', nome: 'Reino Unido',         ddi: '44',  flag: '🇬🇧', len: [10] },
    { iso: 'CZ', nome: 'República Tcheca',    ddi: '420', flag: '🇨🇿', len: [9] },
    { iso: 'DO', nome: 'República Dominicana',ddi: '1',   flag: '🇩🇴', len: [10] },
    { iso: 'RO', nome: 'Romênia',             ddi: '40',  flag: '🇷🇴', len: [9] },
    { iso: 'RU', nome: 'Rússia',              ddi: '7',   flag: '🇷🇺', len: [10], principal: true },
    { iso: 'RS', nome: 'Sérvia',              ddi: '381', flag: '🇷🇸', len: [8, 9] },
    { iso: 'SG', nome: 'Singapura',           ddi: '65',  flag: '🇸🇬', len: [8] },
    { iso: 'SE', nome: 'Suécia',              ddi: '46',  flag: '🇸🇪', len: [7, 9] },
    { iso: 'CH', nome: 'Suíça',               ddi: '41',  flag: '🇨🇭', len: [9] },
    { iso: 'TH', nome: 'Tailândia',           ddi: '66',  flag: '🇹🇭', len: [9] },
    { iso: 'TW', nome: 'Taiwan',              ddi: '886', flag: '🇹🇼', len: [9] },
    { iso: 'TR', nome: 'Turquia',             ddi: '90',  flag: '🇹🇷', len: [10] },
    { iso: 'UA', nome: 'Ucrânia',             ddi: '380', flag: '🇺🇦', len: [9] },
    { iso: 'UY', nome: 'Uruguai',             ddi: '598', flag: '🇺🇾', len: [8] },
    { iso: 'VE', nome: 'Venezuela',           ddi: '58',  flag: '🇻🇪', len: [10] },
    { iso: 'VN', nome: 'Vietnã',              ddi: '84',  flag: '🇻🇳', len: [9] },
    { iso: 'ZA', nome: 'África do Sul',       ddi: '27',  flag: '🇿🇦', len: [9] },
  ];

  const DEFAULT_ISO = 'BR';
  const byIso = {};
  COUNTRIES.forEach(function (c) { byIso[c.iso] = c; });

  // DDDs que existem no Brasil. Mesma lista do portão de WhatsApp
  // (supabase/functions/_shared/whatsapp_gate.js) — se um dia mudar
  // lá, muda aqui também.
  const DDDS_BR = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55,
    61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99,
  ]);

  function digitsOf(v) { return String(v == null ? '' : v).replace(/\D+/g, ''); }

  // "Italia" tem que achar "Itália" — ninguém digita acento na busca.
  function semAcento(v) {
    const s = String(v == null ? '' : v).toLowerCase();
    try { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    catch (e) { return s; }
  }

  // ===== VALIDAÇÃO =====
  // Devolve null quando está ok, ou a mensagem de erro pra mostrar.
  // As mensagens dizem o que fazer ("faltou 1 dígito"), não só que
  // está errado — é o ponto todo de saber o país.
  function validateBR(d) {
    if (d.length < 10) {
      const faltam = 11 - d.length;
      return 'Faltam ' + faltam + ' dígito' + (faltam > 1 ? 's' : '') +
        '. Celular no Brasil tem 11: DDD + 9 + os 8 números.';
    }
    if (d.length > 11) {
      return 'Sobrou dígito. No Brasil são 11 (DDD + 9 + os 8 números).';
    }
    if (!DDDS_BR.has(Number(d.slice(0, 2)))) {
      return 'DDD ' + d.slice(0, 2) + ' não existe no Brasil. Confira os dois primeiros números.';
    }
    // 11 dígitos = celular, e celular brasileiro começa com 9 depois do DDD.
    if (d.length === 11 && d[2] !== '9') {
      return 'Celular com DDD ' + d.slice(0, 2) + ' começa com 9. Confira o número.';
    }
    // 10 dígitos com 9 na frente é celular a que faltou um número.
    if (d.length === 10 && d[2] === '9') {
      return 'Faltou 1 dígito. Celular tem 11: DDD + 9 + os 8 números.';
    }
    return null;
  }

  function validateFor(country, d) {
    if (!d) return 'Informe o número.';
    if (country.iso === 'BR') return validateBR(d);
    const min = country.len[0];
    const max = country.len.length > 1 ? country.len[1] : country.len[0];
    if (d.length < min) {
      const faltam = min - d.length;
      return 'Faltam ' + faltam + ' dígito' + (faltam > 1 ? 's' : '') +
        '. Número em ' + country.nome + ' tem ' +
        (min === max ? min : min + ' a ' + max) + '.';
    }
    if (d.length > max) {
      return 'Sobrou dígito. Número em ' + country.nome + ' tem ' +
        (min === max ? max : min + ' a ' + max) + '.';
    }
    return null;
  }

  // ===== FORMATAÇÃO =====
  // Só o Brasil ganha máscara de verdade — é o formato que a maioria
  // das pessoas espera ver. Nos outros países agrupamos em blocos de
  // 3 só pra facilitar a leitura, sem inventar um formato local.
  function formatBR(d) {
    if (!d) return '';
    let out = '(' + d.slice(0, 2);
    if (d.length > 2) out += ') ' + d.slice(2, d.length > 10 ? 7 : 6);
    if (d.length > (d.length > 10 ? 7 : 6)) {
      out += '-' + d.slice(d.length > 10 ? 7 : 6);
    }
    return out;
  }

  // Fora do Brasil não inventamos formato local: só quebramos em
  // blocos de 3 pra facilitar a leitura. O último bloco absorve o
  // dígito que sobraria sozinho ("351 743 4071", não "351 743 407 1").
  function groupDigits(d) {
    const partes = [];
    let i = 0;
    while (d.length - i > 4) {
      partes.push(d.slice(i, i + 3));
      i += 3;
    }
    if (i < d.length) partes.push(d.slice(i));
    return partes.join(' ');
  }

  function formatFor(country, d) {
    if (country.iso === 'BR') return formatBR(d);
    return groupDigits(d);
  }

  function maxDigitsFor(country) {
    return country.len.length > 1 ? country.len[1] : country.len[0];
  }

  // ===== PARSE =====
  // Lê um telefone já salvo e descobre país + número nacional.
  // "+39 351 743 4071" → IT. "(11) 91234-5678" → BR (sem DDI, assume
  // o padrão). "5511912345678" → BR pelo 55 na frente.
  function parse(raw, fallbackIso) {
    const text = String(raw == null ? '' : raw).trim();
    const d = digitsOf(text);
    const fallback = byIso[fallbackIso] || byIso[DEFAULT_ISO];
    if (!d) return { country: fallback, national: '' };

    if (text.charAt(0) === '+') {
      // DDI escrito: acha o país pelo prefixo mais longo que casa, e
      // entre países que dividem o mesmo DDI (+1, +7) fica o primeiro
      // cujo tamanho nacional bate.
      const candidatos = COUNTRIES
        .filter(function (c) { return d.indexOf(c.ddi) === 0; })
        .sort(function (a, b) {
          // DDI mais longo primeiro (+351 antes de +35, se houvesse).
          if (b.ddi.length !== a.ddi.length) return b.ddi.length - a.ddi.length;
          // Empate = DDI compartilhado (+1 EUA/Canadá/Rep. Dominicana,
          // +7 Rússia/Cazaquistão). O marcado como principal ganha.
          return (b.principal ? 1 : 0) - (a.principal ? 1 : 0);
        });
      for (let i = 0; i < candidatos.length; i++) {
        const c = candidatos[i];
        const nac = d.slice(c.ddi.length);
        if (!validateFor(c, nac)) return { country: c, national: nac };
      }
      if (candidatos.length) {
        const c = candidatos[0];
        return { country: c, national: d.slice(c.ddi.length) };
      }
      return { country: fallback, national: d };
    }

    // Sem "+": só reconhecemos o 55 do Brasil, porque é o único DDI
    // que aparece colado em número salvo por aqui. Qualquer outro
    // palpite erraria mais do que acertaria.
    if (d.length > 11 && d.indexOf('55') === 0) {
      return { country: byIso.BR, national: d.slice(2) };
    }
    if (d.length <= 11) return { country: fallback, national: d };
    return { country: fallback, national: d };
  }

  // ===== CSS (injetado uma vez) =====
  const CSS = [
    '.elp{position:relative;display:flex;align-items:stretch;gap:0;width:100%;box-sizing:border-box;}',
    // Borda, raio e altura do botão são copiados do input no mount
    // (syncStyles) — cada formulário do site tem o seu, e o botão tem
    // que encostar nele sem emendar torto.
    '.elp__btn{display:flex;align-items:center;gap:5px;flex:0 0 auto;padding:0 9px;border-right:none;',
      'background:#faf8f5;font:inherit;line-height:1;cursor:pointer;color:#333;white-space:nowrap;}',
    '.elp__btn:hover{background:#f4f0e8;}',
    '.elp__btn:focus-visible{outline:2px solid #f0a05e;outline-offset:-2px;}',
    '.elp__flag{font-size:1.05rem;}',
    '.elp__caret{font-size:.6rem;color:#888;}',
    '.elp__input{flex:1 1 auto;min-width:0;}',
    '.elp__pop{position:absolute;z-index:10000;top:calc(100% + 4px);left:0;width:min(320px,100%);max-width:320px;',
      'background:#fff;border:1px solid #e3ddd3;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.16);overflow:hidden;}',
    '.elp__pop[hidden]{display:none;}',
    '.elp__search{width:100%;box-sizing:border-box;padding:10px 12px;border:none;border-bottom:1px solid #eee;',
      'font:inherit;font-size:.9rem;outline:none;}',
    '.elp__list{max-height:240px;overflow-y:auto;margin:0;padding:4px 0;list-style:none;}',
    '.elp__opt{display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:.88rem;cursor:pointer;color:#333;}',
    '.elp__opt:hover,.elp__opt[aria-selected="true"]{background:#f7f2ea;}',
    '.elp__opt-nome{flex:1 1 auto;}',
    '.elp__opt-ddi{color:#888;font-size:.82rem;}',
    '.elp__empty{padding:14px 12px;color:#888;font-size:.85rem;text-align:center;}',
  ].join('');

  let cssInjected = false;
  function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    const el = document.createElement('style');
    el.setAttribute('data-elarah-phone', '');
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // ===== COMPONENTE =====
  const registry = new WeakMap();

  function mount(input, opts) {
    if (!input) return null;
    const existing = registry.get(input);
    if (existing) {
      if (opts && typeof opts.value === 'string') existing.setValue(opts.value);
      return existing;
    }
    injectCss();
    const options = opts || {};

    const parsed = parse(
      typeof options.value === 'string' ? options.value : input.value,
      options.defaultIso || DEFAULT_ISO
    );
    let country = parsed.country;

    // Estrutura: <div.elp><button/><input(original)/><div.elp__pop/></div>
    const wrap = document.createElement('div');
    wrap.className = 'elp';
    input.parentNode.insertBefore(wrap, input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'elp__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');

    wrap.appendChild(btn);
    wrap.appendChild(input);
    input.classList.add('elp__input');
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel-national');

    const pop = document.createElement('div');
    pop.className = 'elp__pop';
    pop.hidden = true;
    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'elp__search';
    search.placeholder = 'Buscar país…';
    search.setAttribute('aria-label', 'Buscar país');
    const list = document.createElement('ul');
    list.className = 'elp__list';
    list.setAttribute('role', 'listbox');
    pop.appendChild(search);
    pop.appendChild(list);
    wrap.appendChild(pop);

    // Copia a borda e o arredondamento do input pro botão, pra dupla
    // parecer um campo só em qualquer formulário (o do checkout, o do
    // cadastro e o da conta têm estilos diferentes entre si).
    function syncStyles() {
      let cs;
      try { cs = window.getComputedStyle(input); } catch (e) { return; }
      const raio = cs.borderTopLeftRadius || '10px';
      btn.style.borderTopWidth = cs.borderTopWidth;
      btn.style.borderBottomWidth = cs.borderBottomWidth;
      btn.style.borderLeftWidth = cs.borderLeftWidth;
      btn.style.borderStyle = cs.borderTopStyle === 'none' ? 'solid' : cs.borderTopStyle;
      btn.style.borderColor = cs.borderTopColor;
      btn.style.borderRightStyle = 'none';
      btn.style.borderRadius = raio + ' 0 0 ' + raio;
      btn.style.fontSize = cs.fontSize;
      input.style.borderTopLeftRadius = '0';
      input.style.borderBottomLeftRadius = '0';
    }

    function renderBtn() {
      btn.innerHTML = '';
      const f = document.createElement('span');
      f.className = 'elp__flag';
      f.textContent = country.flag;
      const d = document.createElement('span');
      d.textContent = '+' + country.ddi;
      const c = document.createElement('span');
      c.className = 'elp__caret';
      c.textContent = '▼';
      btn.appendChild(f);
      btn.appendChild(d);
      btn.appendChild(c);
      btn.setAttribute('aria-label', 'País do telefone: ' + country.nome + ' (+' + country.ddi + ')');
      btn.title = country.nome;
    }

    function placeholderFor(c) {
      if (c.iso === 'BR') return '(11) 91234-5678';
      const n = c.len[0];
      return Array(n + 1).join('0').replace(/(\d{3})(?=\d)/g, '$1 ');
    }

    function renderList(filtro) {
      const q = semAcento(String(filtro || '').trim());
      const qDigits = q.replace(/\D+/g, '');
      const items = COUNTRIES.filter(function (c) {
        if (!q) return true;
        if (semAcento(c.nome).indexOf(q) !== -1) return true;
        if (qDigits && c.ddi.indexOf(qDigits) === 0) return true;
        return c.iso.toLowerCase() === q;
      });
      list.innerHTML = '';
      if (!items.length) {
        const li = document.createElement('li');
        li.className = 'elp__empty';
        li.textContent = 'Nenhum país com esse nome.';
        list.appendChild(li);
        return;
      }
      items.forEach(function (c) {
        const li = document.createElement('li');
        li.className = 'elp__opt';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', c.iso === country.iso ? 'true' : 'false');
        li.dataset.iso = c.iso;
        li.innerHTML =
          '<span class="elp__flag"></span>' +
          '<span class="elp__opt-nome"></span>' +
          '<span class="elp__opt-ddi"></span>';
        li.children[0].textContent = c.flag;
        li.children[1].textContent = c.nome;
        li.children[2].textContent = '+' + c.ddi;
        li.addEventListener('click', function () { pick(c.iso); });
        list.appendChild(li);
      });
    }

    function openPop() {
      renderList('');
      search.value = '';
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      try { search.focus({ preventScroll: true }); } catch (e) { search.focus(); }
    }
    function closePop() {
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    function pick(iso) {
      const c = byIso[iso];
      if (c) {
        country = c;
        renderBtn();
        // Reformata o que já estava digitado pro novo país e corta o
        // excesso, pra não ficar dígito escondido além do limite.
        const d = digitsOf(input.value).slice(0, maxDigitsFor(country));
        input.value = formatFor(country, d);
        input.placeholder = placeholderFor(country);
      }
      closePop();
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
      emitChange();
    }

    function emitChange() {
      if (typeof options.onChange === 'function') {
        try { options.onChange(api.get()); } catch (e) { /* callback do caller */ }
      }
      try {
        input.dispatchEvent(new CustomEvent('elarahphone:change', {
          bubbles: true, detail: api.get(),
        }));
      } catch (e) { /* CustomEvent indisponível: silencioso */ }
    }

    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (pop.hidden) openPop(); else closePop();
    });
    search.addEventListener('input', function () { renderList(search.value); });
    search.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); closePop(); btn.focus(); return; }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const first = list.querySelector('.elp__opt');
        if (first) pick(first.dataset.iso);
      }
    });
    document.addEventListener('click', function (ev) {
      if (!pop.hidden && !wrap.contains(ev.target)) closePop();
    });

    input.addEventListener('input', function () {
      const d = digitsOf(input.value).slice(0, maxDigitsFor(country));
      input.value = formatFor(country, d);
      emitChange();
    });

    // Colar "+39 351 743 4071" troca o país sozinho — é o caminho mais
    // comum de quem copia o número de outro lugar.
    input.addEventListener('paste', function (ev) {
      let texto = '';
      try { texto = (ev.clipboardData || window.clipboardData).getData('text'); } catch (e) { return; }
      if (!texto || texto.trim().charAt(0) !== '+') return;
      ev.preventDefault();
      api.setValue(texto);
      emitChange();
    });

    const api = {
      input: input,
      get country() { return country; },
      setValue: function (raw) {
        const p = parse(raw, country.iso);
        country = p.country;
        renderBtn();
        input.value = formatFor(country, p.national.slice(0, maxDigitsFor(country)));
        input.placeholder = placeholderFor(country);
      },
      setCountry: function (iso) { pick(iso); },
      get: function () {
        const national = digitsOf(input.value);
        const error = validateFor(country, national);
        return {
          country: country.iso,
          nomePais: country.nome,
          ddi: country.ddi,
          national: national,
          // Dígitos E.164 (sem "+") — formato que o wa.me aceita.
          digits: national ? country.ddi + national : '',
          // Texto que vai pro banco. O "+" é o que diz ao painel pra
          // respeitar o DDI em vez de assumir Brasil.
          e164: national ? '+' + country.ddi + ' ' + formatFor(country, national) : '',
          valid: !error,
          error: error,
        };
      },
      destroy: function () {
        registry.delete(input);
        input.classList.remove('elp__input');
        if (wrap.parentNode) {
          wrap.parentNode.insertBefore(input, wrap);
          wrap.parentNode.removeChild(wrap);
        }
      },
    };

    renderBtn();
    syncStyles();
    input.placeholder = placeholderFor(country);
    input.value = formatFor(country, parsed.national.slice(0, maxDigitsFor(country)));
    registry.set(input, api);
    return api;
  }

  function ctrl(input) { return input ? registry.get(input) || null : null; }

  // Inputs estáticos marcados com data-phone-intl se ligam sozinhos.
  function upgradeAll(root) {
    const scope = root || document;
    const nodes = scope.querySelectorAll('input[data-phone-intl]:not(.elp__input)');
    Array.prototype.forEach.call(nodes, function (el) { mount(el); });
  }

  window.ElarahPhone = {
    COUNTRIES: COUNTRIES,
    mount: mount,
    upgradeAll: upgradeAll,
    controller: ctrl,
    parse: parse,
    // Atalhos pra quem só quer ler/escrever o campo.
    get: function (input) {
      const c = ctrl(input);
      if (c) return c.get();
      // Sem componente montado (input que ainda não foi ligado):
      // interpreta o texto cru pra quem chama não quebrar.
      const p = parse(input && input.value, DEFAULT_ISO);
      const error = validateFor(p.country, p.national);
      return {
        country: p.country.iso, nomePais: p.country.nome, ddi: p.country.ddi,
        national: p.national,
        digits: p.national ? p.country.ddi + p.national : '',
        e164: p.national ? '+' + p.country.ddi + ' ' + formatFor(p.country, p.national) : '',
        valid: !error, error: error,
      };
    },
    value: function (input) { return window.ElarahPhone.get(input).e164; },
    set: function (input, raw) {
      const c = ctrl(input);
      if (c) c.setValue(raw);
      else if (input) input.value = raw == null ? '' : String(raw);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { upgradeAll(); });
  } else {
    upgradeAll();
  }
})();
