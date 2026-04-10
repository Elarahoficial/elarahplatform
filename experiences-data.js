/* =============================================
   ELARAH EXPERIENCES DATA
   Fonte única de experiências compartilhada entre
   home, categoria, presentear e admin.
   ============================================= */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'elarah_experiences';

  // Dataset inicial (seed) - usado apenas na primeira visita,
  // depois disso o admin é a fonte da verdade via localStorage.
  const DEFAULT_EXPERIENCES = :contentReference[oaicite:1]{index=1};
  function safeParse(json, fallback) {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  // Garante que o dataset existe no localStorage.
  // Na primeira visita copia DEFAULT_EXPERIENCES.
  // Depois disso o admin é a fonte da verdade.
  const DATA_VERSION = 'v3';

function ensureSeeded() {
  const currentVersion = localStorage.getItem(STORAGE_KEY + '_version');
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null || currentVersion !== DATA_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPERIENCES));
    localStorage.setItem(STORAGE_KEY + '_version', DATA_VERSION);
    return DEFAULT_EXPERIENCES.slice();
  }

  return safeParse(raw, DEFAULT_EXPERIENCES.slice());
}

  function getAllExperiences() {
    return ensureSeeded().map(normalizeExperience);
  }

  function normalizeExperience(exp) {
    if (!exp) return exp;
    return {
      id: exp.id || '',
      data: exp.data || '',
      categoria: exp.categoria || '',
      nome: exp.nome || '',
      horario: exp.horario || '',
      duracao: exp.duracao || '',
      bairro: exp.bairro || '',
      endereco: exp.endereco || '',
      inclui: exp.inclui || '',
      preco: exp.preco || '',
      cor: exp.cor || '#f6d5a8,#f0a05e',
      imagem: exp.imagem || '',
      descricao: exp.descricao || '',
      createdAt: exp.createdAt || '',
      updatedAt: exp.updatedAt || ''
    };
  }

  function saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function generateId() {
    return 'exp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function addExperience(data) {
    const all = ensureSeeded();
    const exp = normalizeExperience({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    });
    all.push(exp);
    saveAll(all);
    return exp;
  }

  function updateExperience(id, data) {
    const all = ensureSeeded();
    const idx = all.findIndex(e => e.id === id);
    if (idx === -1) return null;
    all[idx] = normalizeExperience({
      ...all[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    });
    saveAll(all);
    return all[idx];
  }

  function deleteExperience(id) {
    const all = ensureSeeded();
    const filtered = all.filter(e => e.id !== id);
    saveAll(filtered);
  }

  function resetToDefaults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPERIENCES));
  }

  window.ElarahData = {
    STORAGE_KEY,
    getAllExperiences,
    addExperience,
    updateExperience,
    deleteExperience,
    resetToDefaults
  };
})(window);
