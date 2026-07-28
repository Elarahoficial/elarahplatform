// Gera os arquivos-fonte de ícone e splash do app a partir do símbolo da
// marca Elarah (assets/logo-simbolo.png), em JavaScript puro (pngjs), sem
// depender de sharp/ImageMagick.
//
// Saída em app/resources/ — no formato esperado pelo @capacitor/assets:
//   icon.png            1024x1024  (ícone principal)
//   icon-foreground.png 1024x1024  (camada frontal do ícone adaptativo Android)
//   icon-background.png 1024x1024  (camada de fundo do ícone adaptativo Android)
//   splash.png          2732x2732  (tela de abertura, claro)
//   splash-dark.png     2732x2732  (tela de abertura, escuro)
//
// Depois, na máquina de quem for publicar, rode:
//   npx @capacitor/assets generate
// que recorta esses arquivos em todos os tamanhos do Android e iOS.

import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');
const repoRoot = resolve(appDir, '..');
const outDir = join(appDir, 'resources');
mkdirSync(outDir, { recursive: true });

const BRAND_ORANGE = [0xf2, 0x76, 0x23]; // #F27623
const WHITE = [0xff, 0xff, 0xff];
const CREAM = [0xff, 0xf8, 0xf2]; // #FFF8F2 (creme da marca — símbolo na capa)
const DARK = [0x1b, 0x0f, 0x17]; // #1B0F17 (tom escuro do site)

const symbol = PNG.sync.read(readFileSync(join(repoRoot, 'assets', 'logo-simbolo.png')));

// Amostra bilinear de um pixel (x,y em coordenadas da imagem origem) -> [r,g,b,a]
function sampleBilinear(img, fx, fy) {
  const { width: w, height: h, data } = img;
  fx = Math.max(0, Math.min(w - 1, fx));
  fy = Math.max(0, Math.min(h - 1, fy));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const dx = fx - x0;
  const dy = fy - y0;
  const at = (x, y, c) => data[(y * w + x) * 4 + c];
  const out = [];
  for (let c = 0; c < 4; c++) {
    const top = at(x0, y0, c) * (1 - dx) + at(x1, y0, c) * dx;
    const bot = at(x0, y1, c) * (1 - dx) + at(x1, y1, c) * dx;
    out[c] = top * (1 - dy) + bot * dy;
  }
  return out;
}

// Cria uma imagem quadrada com fundo `bg` (ou transparente se null) e o símbolo
// centralizado ocupando `coverage` da largura. Recolore o símbolo para `tint`
// (usa o alfa original do símbolo como máscara).
function compose({ size, bg, tint, coverage }) {
  const png = new PNG({ width: size, height: size });
  const d = png.data;
  // fundo
  for (let i = 0; i < size * size; i++) {
    if (bg) {
      d[i * 4] = bg[0];
      d[i * 4 + 1] = bg[1];
      d[i * 4 + 2] = bg[2];
      d[i * 4 + 3] = 255;
    } else {
      d[i * 4 + 3] = 0; // transparente
    }
  }
  // símbolo centralizado
  const target = Math.round(size * coverage);
  const offset = Math.round((size - target) / 2);
  const scale = symbol.width / target; // origem por pixel de destino
  for (let y = 0; y < target; y++) {
    for (let x = 0; x < target; x++) {
      const s = sampleBilinear(symbol, x * scale, y * scale);
      const a = s[3] / 255;
      if (a <= 0.003) continue;
      const px = offset + x;
      const py = offset + y;
      const idx = (py * size + px) * 4;
      // cor recolorida (tint) usando o alfa do símbolo como máscara
      const dr = d[idx], dg = d[idx + 1], db = d[idx + 2], da = d[idx + 3] / 255;
      const outA = a + da * (1 - a);
      for (let c = 0; c < 3; c++) {
        const src = tint[c];
        const dst = [dr, dg, db][c];
        d[idx + c] = Math.round((src * a + dst * da * (1 - a)) / (outA || 1));
      }
      d[idx + 3] = Math.round(outA * 255);
    }
  }
  return png;
}

function save(name, png) {
  writeFileSync(join(outDir, name), PNG.sync.write(png));
  console.log('  ✓', name, `(${png.width}x${png.height})`);
}

console.log('Gerando ícones e splash em', outDir);
// Ícone principal: símbolo laranja sobre branco
save('icon.png', compose({ size: 1024, bg: WHITE, tint: BRAND_ORANGE, coverage: 0.56 }));
// Ícone adaptativo Android: fundo branco + símbolo laranja na área segura (~56%)
save('icon-background.png', compose({ size: 1024, bg: WHITE, tint: WHITE, coverage: 0 }));
save('icon-foreground.png', compose({ size: 1024, bg: null, tint: BRAND_ORANGE, coverage: 0.52 }));
// Splash claro e escuro — CAPA LARANJA: fundo laranja da marca + símbolo
// creme centralizado (mesma linguagem visual do ícone). Igual nos dois
// modos, pra a capa ser sempre laranja (claro ou escuro).
save('splash.png', compose({ size: 2732, bg: BRAND_ORANGE, tint: CREAM, coverage: 0.30 }));
save('splash-dark.png', compose({ size: 2732, bg: BRAND_ORANGE, tint: CREAM, coverage: 0.30 }));
console.log('Concluído.');
