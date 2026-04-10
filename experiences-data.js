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
  const DEFAULT_EXPERIENCES = [
    { id: "seed_001", data: "06/04", categoria: "Gastronomia", nome: "Pães Alemães", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#d4e7c5,#8cb369", imagem: "assets/experiences/paes-alemaes.jpg" },
    { id: "seed_002", data: "06/04", categoria: "Gastronomia", nome: "The Art of Lamen", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#e7d4c5,#b38a69", imagem: "assets/experiences/art-of-lemmen.jpg" },
    { id: "seed_003", data: "07/04", categoria: "Gastronomia", nome: "CEO Kitchen (Comida Asiática)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#f6d5a8,#f0a05e", imagem: "assets/experiences/ceo-kitchen.jpg" },
    { id: "seed_004", data: "08/04", categoria: "Gastronomia", nome: "Cozinha Tailandesa", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#d4e7c5,#8cb369", imagem: "assets/experiences/cozinha-tailandesa.jpg" },
    { id: "seed_005", data: "09/04", categoria: "Gastronomia", nome: "Cozinha Japonesa (Sushi/Sashimi)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#e7d4c5,#b38a69", imagem: "assets/experiences/cozinha-japonesa.jpg" },
    { id: "seed_006", data: "10/04", categoria: "Gastronomia", nome: "Torta Salgada", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#f6d5a8,#f0a05e", imagem: "assets/experiences/torta-salgada.jpg" },
    { id: "seed_007", data: "10/04", categoria: "Gastronomia", nome: "Izakaya (Japonesa)", horario: "19h00 – 22h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#d4e7c5,#8cb369", imagem: "assets/experiences/izakaya.jpg" },
    { id: "seed_008", data: "11/04", categoria: "Gastronomia", nome: "Bolo Caseiro da Fazenda", horario: "16h00 – 19h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#e7d4c5,#b38a69", imagem: "assets/experiences/bolo-caseiro.jpg" },
    { id: "seed_009", data: "11/04", categoria: "Gastronomia", nome: "Churrasco sem Churrasqueira", horario: "16h00 – 19h30", duracao: "3h30", bairro: "Jardim das Bandeiras", endereco: "Rua Abegoaria, 538 – São Paulo", inclui: "Aula completa", preco: "R$383", cor: "#f6d5a8,#f0a05e", imagem: "assets/experiences/churrasco.jpg" },
    { id: "seed_010", data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Café Gelado)", horario: "10h30 – 11h30", duracao: "1h", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-cafe.jpg" },
    { id: "seed_011", data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Praia)", horario: "13h00 – 14h30", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-praia.jpg" },
    { id: "seed_012", data: "11/04", categoria: "Vela", nome: "Vela + Home Spray (Floral)", horario: "15h30 – 17h00", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-floral.jpg" },
    { id: "seed_013", data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-taca.jpg" },
    { id: "seed_014", data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "13h30 – 15h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-taca.jpg" },
    { id: "seed_015", data: "11/04", categoria: "Pintura", nome: "Pintura em Taça", horario: "16h00 – 18h00", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-taca.jpg" },
    { id: "seed_016", data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$158", cor: "#d5c5e7,#9369b3", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { id: "seed_017", data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "13h30 – 15h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$158", cor: "#d5c5e7,#9369b3", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { id: "seed_018", data: "11/04", categoria: "Sabonete", nome: "Sabonete Artesanal", horario: "16h00 – 18h00", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$158", cor: "#d5c5e7,#9369b3", imagem: "assets/experiences/sabonete-artesanal.jpg" },
    { id: "seed_019", data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "10h30 – 12h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-personalizada.jpg" },
    { id: "seed_020", data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "13h30 – 15h30", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-personalizada.jpg" },
    { id: "seed_021", data: "11/04", categoria: "Vela", nome: "Vela Personalizada", horario: "16h00 – 18h00", duracao: "2h", bairro: "Brooklin", endereco: "Rua Indiana, 669 – São Paulo", inclui: "Vinho à vontade", preco: "R$262", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-personalizada.jpg" },
    { id: "seed_022", data: "12/04", categoria: "Vela", nome: "Vela (Cerveja & Caipirinha)", horario: "10h30 – 12h00", duracao: "1h30", bairro: "Brooklin", endereco: "Rua Nova York, 345 – São Paulo", inclui: "Coffee break + petisco + cerveja", preco: "R$180", cor: "#f6e6a8,#e0c05e", imagem: "assets/experiences/vela-cerveja.jpg" },
    { id: "seed_023", data: "12/04", categoria: "Pintura", nome: "Pintura em Cerâmica", horario: "15h00 – 18h00", duracao: "3h", bairro: "Pinheiros", endereco: "Rua Capote Valente, 697 – São Paulo", inclui: "Materiais inclusos", preco: "R$360", cor: "#f9d1d1,#e07a7a", imagem: "assets/experiences/pintura-ceramica.jpg" },
    { id: "seed_024", data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Seg)", horario: "19h00 – 21h00", duracao: "2h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$162", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { id: "seed_025", data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Seg)", horario: "09h00 – 12h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { id: "seed_026", data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "17h15 – 19h15", duracao: "2h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$162", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { id: "seed_027", data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "19h30 – 21h30", duracao: "2h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$162", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { id: "seed_028", data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "09h00 – 12h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" },
    { id: "seed_029", data: "Semanal", categoria: "Tufting", nome: "Aula de Tufting (Ter/Qui/Sex)", horario: "14h00 – 17h00", duracao: "3h", bairro: "Itaim", endereco: "Av. Brigadeiro Faria Lima, 1572 - São Paulo", inclui: "Experiência completa", preco: "R$243", cor: "#c5d4e7,#6991b3", imagem: "assets/experiences/tufting.jpg" }
  ];

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
  function ensureSeeded() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPERIENCES));
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
