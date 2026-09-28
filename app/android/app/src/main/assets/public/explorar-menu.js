/* =====================================================================
   explorar-menu.js
   Popula o dropdown "Explorar" do header com as categorias REAIS das
   experiências, em vez da lista fixa que ficava hardcoded no HTML de
   cada página (e congelava quando novas categorias eram criadas).

   Roda em qualquer página que tenha #explorar-dropdown. Se não
   conseguir os dados, mantém a lista hardcoded como fallback — nunca
   deixa o menu vazio.
   ===================================================================== */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;',
      }[ch];
    });
  }

  // Extrai categorias únicas, ordenadas pt-BR. Ignora categorias que
  // não são de navegação: "Elarah Originals" (vivem na seção By Elarah)
  // e "Kit em casa" (acessível só pelo menu "Elarah em Casa" no topo).
  function categoriasDe(experiences) {
    var map = new Map();
    (experiences || []).forEach(function (e) {
      if (!e || !e.categoria) return;
      // Uma experiência pode estar em duas categorias ("Colagem | Artesanato"):
      // o "|" precisa gerar DOIS itens no menu, um pra cada categoria — nunca
      // um item só com o traço cru. Usa categoriasOf pra separar, igual ao
      // resto do site; sem ele, cai no split manual como fallback.
      var cats = (window.ElarahData &&
                  typeof window.ElarahData.categoriasOf === 'function')
        ? window.ElarahData.categoriasOf(e)
        : String(e.categoria).split('|');
      cats.forEach(function (raw) {
        var c = String(raw).trim();
        if (!c) return;
        var low = c.toLowerCase();
        if (low === 'elarah originals' || low === 'kit em casa') return;
        if (!map.has(low)) map.set(low, c);
      });
    });
    return Array.from(map.values()).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    });
  }

  function buildDropdown(categorias) {
    var dd = document.getElementById('explorar-dropdown');
    if (!dd || !categorias || !categorias.length) return;
    var html = '<a href="categoria.html" class="header__dropdown-item">Todas</a>';
    categorias.forEach(function (c) {
      html += '<a href="categoria.html?cat=' + encodeURIComponent(c) +
        '" class="header__dropdown-item">' + escapeHtml(c) + '</a>';
    });
    dd.innerHTML = html;
  }

  async function load() {
    if (!document.getElementById('explorar-dropdown')) return;
    try {
      // Fonte 1: ElarahData (páginas de experiências) — usa o cache,
      // já considera só experiências publicamente visíveis.
      if (window.ElarahData &&
          typeof window.ElarahData.getVisibleExperiences === 'function') {
        var exps = await window.ElarahData.getVisibleExperiences();
        var cats = categoriasDe(exps);
        if (cats.length) { buildDropdown(cats); return; }
      }
      // Fonte 2: query leve direto no Supabase (páginas sem ElarahData,
      // ex.: sobre, conta). Pega só a coluna categoria das ativas.
      var sb = window.supabaseClient ||
        (window.ElarahSupabase &&
         typeof window.ElarahSupabase.waitClient === 'function'
          ? await window.ElarahSupabase.waitClient(6000)
          : null);
      if (sb) {
        var res = await sb.from('experiences')
          .select('categoria')
          .eq('is_active', true);
        if (res && !res.error && Array.isArray(res.data)) {
          buildDropdown(categoriasDe(res.data));
        }
      }
    } catch (e) {
      /* silencioso — mantém o fallback hardcoded do HTML */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
