// Copia os arquivos do site (raiz do repositório) para app/www,
// que é a pasta que o Capacitor empacota dentro do app nativo.
//
// Assim o app fica SEMPRE igual ao site: basta rodar `npm run build`
// que a pasta www é regenerada a partir dos arquivos atuais do site.
//
// A pasta www é um artefato de build (está no .gitignore) — não precisa
// ser versionada, ela é recriada a cada build.

import { cp, rm, mkdir, readdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');       // .../app
const repoRoot = resolve(appDir, '..');        // raiz do repositório (o site)
const wwwDir = join(appDir, 'www');

// Diretórios/arquivos que NÃO fazem parte do app do cliente.
// (ferramentas internas, backend, build do app, controle de versão, etc.)
const EXCLUDE = new Set([
  'app',              // o próprio projeto do app
  'node_modules',
  '.git',
  '.github',
  'docs',
  'sql',
  'supabase',
  '.deploy-trigger',
  '.gitignore',
  '.nojekyll',
  'CNAME',
]);

// Prefixos de arquivos internos de administração que não vão pro app público.
const EXCLUDE_PREFIX = ['admin'];

function isExcluded(name) {
  if (EXCLUDE.has(name)) return true;
  return EXCLUDE_PREFIX.some((p) => name.startsWith(p));
}

async function main() {
  // Limpa e recria a pasta www
  if (existsSync(wwwDir)) {
    await rm(wwwDir, { recursive: true, force: true });
  }
  await mkdir(wwwDir, { recursive: true });

  const entries = await readdir(repoRoot, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    if (isExcluded(entry.name)) continue;
    const src = join(repoRoot, entry.name);
    const dest = join(wwwDir, entry.name);
    await cp(src, dest, { recursive: true });
    copied++;
  }

  // Garante que exista um index.html (ponto de entrada do app)
  if (!existsSync(join(wwwDir, 'index.html'))) {
    throw new Error('index.html não encontrado — o app precisa de um index.html na raiz do site.');
  }

  // Copia a ponte nativa para dentro da www.
  await cp(join(appDir, 'native', 'bridge.js'), join(wwwDir, 'capacitor-bridge.js'));

  // Injeta a viewport-fit=cover + a ponte nativa em todas as páginas HTML,
  // sem alterar os arquivos originais do site.
  await patchHtml(wwwDir);

  console.log(`✓ www gerada com ${copied} itens copiados do site em ${wwwDir}`);
}

async function patchHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await patchHtml(full);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    let html = await readFile(full, 'utf8');
    let changed = false;

    // viewport-fit=cover para respeitar a área segura (notch/ilha)
    if (html.includes('viewport') && !html.includes('viewport-fit=cover')) {
      html = html.replace(
        /(<meta[^>]*name=["']viewport["'][^>]*content=["'][^"']*)(["'])/i,
        (m, pre, quote) =>
          pre.includes('viewport-fit') ? m : `${pre}, viewport-fit=cover${quote}`
      );
      changed = true;
    }

    // injeta a ponte nativa antes de </body> (caminho relativo à raiz da www)
    if (!html.includes('capacitor-bridge.js')) {
      const depth = full.slice(dir.length + 1).split(/[\\/]/).length - 1;
      const prefix = depth > 0 ? '../'.repeat(depth) : '';
      const tag = `<script src="${prefix}capacitor-bridge.js" defer></script>`;
      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `  ${tag}\n</body>`);
      } else {
        html += `\n${tag}\n`;
      }
      changed = true;
    }

    if (changed) await writeFile(full, html, 'utf8');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
