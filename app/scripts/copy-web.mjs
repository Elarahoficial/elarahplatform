// copy-web — reconstrói a pasta app/www a partir do site na raiz do repositório.
//
// O app Elarah é um Capacitor WebView: a pasta app/www é uma cópia do site
// (index.html, script.js, styles.css, etc.) MENOS as telas de admin, com o
// script capacitor-bridge.js injetado antes de </body> em cada HTML.
//
// Regenera de forma determinística e idempotente. Roda no build (npm run build)
// antes de `npx cap sync ios`.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';

const REPO = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const WWW = `${REPO}/app/www`;
const BRIDGE_TAG = '  <script src="capacitor-bridge.js" defer></script>';

// Conjunto de arquivos que app/www rastreia hoje (define exatamente o escopo:
// nunca traz admin/*, supabase/*, docs/* etc — só o que já faz parte do bundle).
const wwwFiles = execSync('git ls-files app/www', { cwd: REPO, encoding: 'utf8' })
  .split('\n').filter(Boolean).map(p => p.replace(/^app\/www\//, ''));

// Arquivos que só existem no bundle do app (sem contrapartida na raiz).
const appOnly = new Set(['capacitor-bridge.js', 'codemagic.yaml']);

let copied = 0, injected = 0;
for (const rel of wwwFiles) {
  if (appOnly.has(rel)) continue;
  const src = `${REPO}/${rel}`;
  const dst = `${WWW}/${rel}`;
  if (!existsSync(src)) continue;
  copyFileSync(src, dst);
  copied++;
  if (rel.endsWith('.html')) {
    let html = readFileSync(dst, 'utf8');
    if (!html.includes('capacitor-bridge.js')) {
      const idx = html.lastIndexOf('</body>');
      if (idx !== -1) {
        html = html.slice(0, idx) + BRIDGE_TAG + '\n' + html.slice(idx);
        writeFileSync(dst, html);
        injected++;
      }
    }
  }
}
console.log(`[copy-web] ${copied} arquivos copiados, bridge injetado em ${injected} HTML`);
