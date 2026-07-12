// =============================================================
// ELARAH — Gera sitemap-experiencias.xml
// -------------------------------------------------------------
// Cada experiência tem uma página em og/<uuid>.html (gerada pelo
// build-og-pages.mjs). A URL canônica/rastreável da experiência é
// experiencia.html?id=<uuid>. Este script lê a pasta og/ e emite
// um sitemap com todas as páginas de experiência — assim o Google
// descobre e indexa as ~150 páginas de produto do site.
//
// Como rodar:
//   node scripts/build-experiences-sitemap.mjs
//
// Depois:
//   git add sitemap-experiencias.xml && git commit && git push
//
// Quando rodar: sempre que rodar o build-og-pages (i.e., depois de
// cadastrar/remover experiências).
// =============================================================

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://elarah.com.br";
const TODAY = new Date().toISOString().slice(0, 10);

const files = (await readdir(path.join(ROOT, "og")))
  .filter((f) => f.endsWith(".html"))
  .map((f) => f.replace(/\.html$/, ""))
  .sort();

const urls = files
  .map(
    (id) =>
      `  <url>\n` +
      `    <loc>${SITE}/experiencia.html?id=${id}</loc>\n` +
      `    <lastmod>${TODAY}</lastmod>\n` +
      `    <changefreq>weekly</changefreq>\n` +
      `    <priority>0.6</priority>\n` +
      `  </url>`
  )
  .join("\n");

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${urls}\n` +
  `</urlset>\n`;

await writeFile(path.join(ROOT, "sitemap-experiencias.xml"), xml, "utf8");
console.log(`sitemap-experiencias.xml gerado com ${files.length} experiências.`);
