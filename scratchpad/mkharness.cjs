const fs = require('fs');
const path = require('path');
const ROOT = '/home/user/elarahplatform';
let h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
h = h.replace(/<script[\s\S]*?<\/script>/gi, '');
h = h.replace(/<\/head>/i, '  <link rel="stylesheet" href="assets/app-skin.css">\n</head>');

const cats = [
  ['Pintura', 'Pintura & Aperol Spritz Criativo com Cristais e Muito Mais', 'Brooklin · sáb 24 abr', 'R$ 189', 'linear-gradient(135deg,#f4b96b,#e07a53 40%,#7d3d6e)'],
  ['Cerâmica', 'Torno de Cerâmica para Iniciantes', 'Pinheiros · dom 25 abr', 'R$ 220', 'linear-gradient(135deg,#e9b892,#c8895f 45%,#8a5233)'],
  ['Gastronomia', 'Jantar Autoral Harmonizado', 'Jardins · sex 30 abr', 'R$ 340', 'linear-gradient(135deg,#f0c27b,#c9714a 50%,#7a2e2a)'],
  ['Floral', 'Arranjo Floral & Vinho', 'Vila Madalena · sáb 1 mai', 'R$ 175', 'linear-gradient(135deg,#f5c6c8,#d98aa0 45%,#7b5aa6)'],
];
const heart = '<button class="card__favorite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg></button>';
const cards = cats.map((c) => {
  const bairro = c[2].split(' · ')[0];
  return '<div class="card"><div class="card__image"><div class="card__image-placeholder" style="background:' + c[4] + ';"><span>' + c[0] + '</span></div>' + heart + '</div>' +
    '<div class="card__body"><span class="card__category">' + c[0] + '</span>' +
    '<h3 class="card__title"><a class="card__title-link" href="#">' + c[1] + '</a></h3>' +
    '<div class="card__details">' +
    '<p class="card__detail">' + c[2] + '</p>' +
    '<p class="card__detail">2h de duração</p>' +
    '<p class="card__detail">' + bairro + '</p>' +
    '<p class="card__detail card__detail--address">Rua Nova Orleans, 34 – Brooklin, São Paulo</p>' + '<p class="card__detail card__detail--includes">Inclui todos os materiais, avental e uma bebida especial</p>' +
    '</div>' +
    '<div class="card__footer"><p class="card__price"><strong>' + c[3] + '</strong> / pessoa</p>' +
    '<button class="card__reserve-btn">Reservar</button></div></div></div>';
}).join('');
h = h.replace(/(<div class="experiences__grid" id="experiences-grid">)([\s\S]*?)(<\/div>\s*<p class="experiences__empty")/, '$1' + cards + '$3');
h = h.replace(/<\/body>/i, '  <script src="assets/app-skin.js"></script>\n</body>');
fs.writeFileSync(path.join(ROOT, '_appskin-preview.html'), h);
console.log('harness ok, cards injetados:', cats.length);
