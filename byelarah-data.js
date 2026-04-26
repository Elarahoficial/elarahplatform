/* =============================================
   ELARAH — BY ELARAH DATA (Supabase + fallback)
   - Expõe window.ElarahByElarah com leitura dos
     cards da seção "Elarah Originals", CRUD admin
     e persistência do formulário de interesse.
   - Usa fallback local caso Supabase esteja
     indisponível, para não quebrar a home.
   ============================================= */

(function (window) {
  'use strict';

  const ITEMS_TABLE = 'byelarah_items';
  const SUBMISSIONS_TABLE = 'byelarah_submissions';

  // Fallback com os mesmos 3 cards originais da home —
  // usado quando Supabase estiver offline ou a tabela
  // estiver vazia, preservando o visual antigo.
  const FALLBACK_ITEMS = [
    {
      id: 'fallback-pintura',
      slug: 'pintura-aperol',
      nome: 'Pintura de Quadro com Cristal & Aperol Spritz',
      descricao: 'Uma tarde criativa para pintar seu próprio quadro com cristais, acompanhada de um Aperol Spritz.',
      imagem: 'assets/pintura-aperol.png',
      data: '24 de abril',
      local: 'Rua Nova Orleans, 34 – Brooklin, São Paulo',
      horarios: ['10h às 13h', '14h às 17h'],
      tipo: 'participar',
      ordem: 1,
      ativo: true
    },
    {
      id: 'fallback-perfumaria',
      slug: 'perfumaria-criativa',
      nome: 'Oficina de Perfumaria Criativa',
      descricao: 'Descubra notas, combinações e crie uma fragrância única que é a sua cara.',
      imagem: 'assets/perfumariaa.jpg',
      data: 'Data em breve',
      local: '',
      horarios: [],
      tipo: 'espera',
      ordem: 2,
      ativo: true
    },
    {
      id: 'fallback-ourivesaria',
      slug: 'ourivesaria-joia',
      nome: 'Workshop de Ourivesaria: Crie sua Joia',
      descricao: 'Uma vivência para conhecer o processo artesanal e criar algo único.',
      imagem: 'assets/ourivesariaa.jpg',
      data: 'Data em breve',
      local: '',
      horarios: [],
      tipo: 'espera',
      ordem: 3,
      ativo: true
    }
  ];

  let itemsCache = null;
  let itemsPromise = null;

  function sb() {
    return window.supabaseClient || null;
  }

  function invalidate() {
    itemsCache = null;
    itemsPromise = null;
  }

  function rowToItem(row) {
    if (!row) return null;
    let horarios = [];
    if (Array.isArray(row.horarios)) {
      horarios = row.horarios.slice();
    } else if (typeof row.horarios === 'string') {
      try { horarios = JSON.parse(row.horarios); } catch { horarios = []; }
    }
    return {
      id: row.id,
      slug: row.slug || '',
      nome: row.nome || '',
      descricao: row.descricao || '',
      imagem: row.imagem || '',
      data: row.data || '',
      local: row.local || '',
      horarios: Array.isArray(horarios) ? horarios : [],
      tipo: row.tipo || 'espera',
      ordem: row.ordem != null ? row.ordem : 0,
      ativo: row.ativo !== false,
      // Coluna nova de sql/elarah_byelarah_purchasable.sql.
      // Quando preenchido, este item espelha uma experience real
      // (com checkout). Quando null, fluxo de lead WhatsApp. Se a
      // coluna ainda não existe no banco, vira undefined → null.
      experienceId: row.experience_id || null,
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || ''
    };
  }

  function itemToRow(item) {
    const horarios = Array.isArray(item.horarios)
      ? item.horarios.map(h => String(h || '').trim()).filter(Boolean)
      : [];
    const row = {
      slug: (item.slug || '').trim(),
      nome: (item.nome || '').trim(),
      descricao: (item.descricao || '').trim(),
      imagem: (item.imagem || '').trim(),
      data: (item.data || '').trim(),
      local: (item.local || '').trim(),
      horarios: horarios,
      tipo: item.tipo === 'participar' ? 'participar' : 'espera',
      ordem: Number.isFinite(+item.ordem) ? +item.ordem : 0,
      ativo: item.ativo !== false
    };
    // experience_id: aceita camelCase do form admin OU snake_case.
    // Sempre incluído no row (mesmo null) pra que o admin possa
    // explicitamente desvincular setando null. Se a coluna ainda
    // não existe no banco, o Supabase ignora silenciosamente.
    const expId = item.experienceId !== undefined ? item.experienceId : item.experience_id;
    row.experience_id = expId || null;
    return row;
  }

  async function getAllItems() {
    if (itemsCache) return itemsCache.slice();
    if (itemsPromise) return (await itemsPromise).slice();

    const client = sb();
    if (!client) {
      itemsCache = FALLBACK_ITEMS.slice();
      return itemsCache.slice();
    }

    itemsPromise = (async () => {
      try {
        const { data, error } = await client
          .from(ITEMS_TABLE)
          .select('*')
          .order('ordem', { ascending: true })
          .order('created_at', { ascending: true });
        if (error) {
          console.warn('[ElarahByElarah] getAllItems error — fallback:', error.message);
          itemsCache = FALLBACK_ITEMS.slice();
        } else {
          const rows = (data || []).map(rowToItem);
          itemsCache = rows.length ? rows : FALLBACK_ITEMS.slice();
        }
      } catch (e) {
        console.warn('[ElarahByElarah] getAllItems exception — fallback:', e);
        itemsCache = FALLBACK_ITEMS.slice();
      }
      itemsPromise = null;
      return itemsCache;
    })();
    return (await itemsPromise).slice();
  }

  async function getActiveItems() {
    const all = await getAllItems();
    return all.filter(i => i.ativo !== false);
  }

  async function getItemBySlug(slug) {
    const all = await getAllItems();
    return all.find(i => i.slug === slug) || null;
  }

  async function getItemById(id) {
    const all = await getAllItems();
    return all.find(i => i.id === id) || null;
  }

  async function addItem(item) {
    const client = sb();
    if (!client) return null;
    const row = itemToRow(item);
    if (!row.slug) {
      row.slug = (row.nome || 'item').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || ('item-' + Date.now());
    }
    const { data, error } = await client
      .from(ITEMS_TABLE)
      .insert(row)
      .select()
      .single();
    if (error) {
      console.error('[ElarahByElarah] addItem error', error);
      alert('Erro ao criar item: ' + error.message);
      return null;
    }
    invalidate();
    return rowToItem(data);
  }

  async function updateItem(id, item) {
    const client = sb();
    if (!client) return null;
    const row = itemToRow(item);
    const { data, error } = await client
      .from(ITEMS_TABLE)
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[ElarahByElarah] updateItem error', error);
      alert('Erro ao atualizar item: ' + error.message);
      return null;
    }
    invalidate();
    return rowToItem(data);
  }

  async function deleteItem(id) {
    const client = sb();
    if (!client) return false;
    const { error } = await client
      .from(ITEMS_TABLE)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[ElarahByElarah] deleteItem error', error);
      alert('Erro ao remover item: ' + error.message);
      return false;
    }
    invalidate();
    return true;
  }

  // ===== SUBMISSIONS =====

  async function submitInterest(data) {
    // data: { itemSlug, experiencia, tipo, nome, email, telefone, horario }
    const client = sb();
    if (!client) {
      console.warn('[ElarahByElarah] submitInterest: Supabase indisponível.');
      return { ok: false, reason: 'offline' };
    }

    let userId = null;
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session && session.user) userId = session.user.id;
    } catch {}

    const payload = {
      item_slug: data.itemSlug || null,
      experiencia: (data.experiencia || '').trim(),
      tipo: data.tipo === 'participar' ? 'participar' : 'espera',
      nome: (data.nome || '').trim(),
      email: (data.email || '').trim(),
      telefone: (data.telefone || '').trim(),
      horario: data.horario || null,
      user_id: userId,
      metadata: data.metadata || {}
    };

    const { error } = await client
      .from(SUBMISSIONS_TABLE)
      .insert(payload);
    if (error) {
      console.error('[ElarahByElarah] submitInterest error', error);
      return { ok: false, reason: 'error', error: error.message };
    }
    return { ok: true };
  }

  // Limite default alto o bastante pra caber uso real sem estourar
  // o DOM nem o payload. Admin raramente precisa de > 500 ao mesmo
  // tempo; pode passar `limit` explícito pra carregar mais.
  async function getAllSubmissions(limit = 500) {
    const client = sb();
    if (!client) return [];
    let query = client
      .from(SUBMISSIONS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (limit && limit > 0) query = query.limit(limit);
    const { data, error } = await query;
    if (error) {
      console.error('[ElarahByElarah] getAllSubmissions error', error);
      return [];
    }
    return data || [];
  }

  async function updateSubmissionStatus(id, status) {
    const client = sb();
    if (!client) return false;
    const { error } = await client
      .from(SUBMISSIONS_TABLE)
      .update({ status })
      .eq('id', id);
    if (error) {
      console.error('[ElarahByElarah] updateSubmissionStatus error', error);
      return false;
    }
    return true;
  }

  async function deleteSubmission(id) {
    const client = sb();
    if (!client) return false;
    const { error } = await client
      .from(SUBMISSIONS_TABLE)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[ElarahByElarah] deleteSubmission error', error);
      return false;
    }
    return true;
  }

  window.ElarahByElarah = {
    getAllItems,
    getActiveItems,
    getItemBySlug,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    submitInterest,
    getAllSubmissions,
    updateSubmissionStatus,
    deleteSubmission,
    invalidateCache: invalidate
  };
})(window);
