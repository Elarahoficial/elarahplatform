/* =============================================
   ELARAH EXPERIENCES DATA (Supabase)
   Fonte única das experiências para home,
   categoria, presentear e admin.

   Todas as funções são ASYNC e retornam Promises.
   A leitura usa um cache em memória que é
   invalidado em qualquer mutação.
   ============================================= */

(function (window) {
  'use strict';

  const TABLE = 'experiences';
  let cache = null;        // array de experiências
  let cachePromise = null; // evita requisições paralelas

  function sb() {
    return window.supabaseClient || null;
  }

  function dbRowToExperience(row) {
    if (!row) return null;
    const horarios = Array.isArray(row.horarios) ? row.horarios.slice() : [];
    const horario = horarios[0] || row.horario || '';
    return {
      id: row.id,
      nome: row.nome || '',
      categoria: row.categoria || '',
      data: row.data || '',
      duracao: row.duracao || '',
      bairro: row.bairro || '',
      endereco: row.endereco || '',
      inclui: row.inclui || '',
      preco: row.preco || '',
      cor: row.cor || '#f6d5a8,#f0a05e',
      imagem: row.imagem || '',
      descricao: row.descricao || '',
      horario: horario,
      horarios: horarios.length ? horarios : (horario ? [horario] : []),
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || ''
    };
  }

  function experienceToDbRow(exp) {
    const horarios = Array.isArray(exp.horarios) && exp.horarios.length
      ? exp.horarios.map(h => (typeof h === 'string' ? h.trim() : '')).filter(Boolean)
      : (exp.horario ? [String(exp.horario).trim()] : []);
    return {
      nome: (exp.nome || '').trim(),
      categoria: (exp.categoria || '').trim(),
      data: (exp.data || '').trim(),
      duracao: (exp.duracao || '').trim(),
      bairro: (exp.bairro || '').trim(),
      endereco: (exp.endereco || '').trim(),
      inclui: (exp.inclui || '').trim(),
      preco: (exp.preco || '').trim(),
      cor: (exp.cor || '#f6d5a8,#f0a05e').trim(),
      imagem: (exp.imagem || '').trim(),
      descricao: (exp.descricao || '').trim(),
      horario: horarios[0] || '',
      horarios: horarios
    };
  }

  function invalidateCache() {
    cache = null;
    cachePromise = null;
  }

  async function getAllExperiences() {
    if (cache) return cache.slice();
    if (cachePromise) return (await cachePromise).slice();

    const s = sb();
    if (!s) {
      console.warn('[Elarah] Supabase client indisponível — retornando lista vazia.');
      return [];
    }

    cachePromise = (async () => {
      const { data, error } = await s
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('[Elarah] getAllExperiences error', error);
        cachePromise = null;
        return [];
      }
      cache = (data || []).map(dbRowToExperience);
      cachePromise = null;
      return cache;
    })();
    return (await cachePromise).slice();
  }

  async function getExperienceById(id) {
    const all = await getAllExperiences();
    return all.find(e => e.id === id) || null;
  }

  async function addExperience(data) {
    const s = sb();
    if (!s) return null;
    const row = experienceToDbRow(data);
    const { data: inserted, error } = await s
      .from(TABLE)
      .insert(row)
      .select()
      .single();
    if (error) {
      console.error('[Elarah] addExperience error', error);
      return null;
    }
    invalidateCache();
    return dbRowToExperience(inserted);
  }

  async function updateExperience(id, data) {
    const s = sb();
    if (!s) return null;
    const row = experienceToDbRow(data);
    const { data: updated, error } = await s
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[Elarah] updateExperience error', error);
      return null;
    }
    invalidateCache();
    return dbRowToExperience(updated);
  }

  async function deleteExperience(id) {
    const s = sb();
    if (!s) return false;
    const { error } = await s.from(TABLE).delete().eq('id', id);
    if (error) {
      console.error('[Elarah] deleteExperience error', error);
      return false;
    }
    invalidateCache();
    return true;
  }

  async function duplicateExperience(id) {
    const src = await getExperienceById(id);
    if (!src) return null;
    const copy = { ...src };
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    return addExperience(copy);
  }

  window.ElarahData = {
    getAllExperiences,
    getExperienceById,
    addExperience,
    updateExperience,
    deleteExperience,
    duplicateExperience,
    invalidateCache
  };
})(window);
