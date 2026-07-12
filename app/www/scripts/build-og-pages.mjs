// =============================================================
// ELARAH — Build de landing pages estáticas pra preview do WhatsApp
// -------------------------------------------------------------
// Gera 1 arquivo HTML por experiência em og/<uuid>.html.
// Cada arquivo tem og:image/og:title hardcoded (estático) →
// crawler do WhatsApp lê direto do HTML e gera preview com a
// imagem real da experiência.
//
// Por que isso e não a Edge Function og-experience?
//   - WhatsApp parece ter viés contra URLs em supabase.co
//     (ainda que a função funcione no browser).
//   - GitHub Pages serve estes HTMLs no domínio elarah.com.br,
//     que o WhatsApp já trata bem (vide pintura.html, perfumes.html).
//   - Estratégia idêntica às landings que JÁ funcionam — só
//     escalada pra todas as experiências.
//
// Como rodar:
//   node scripts/build-og-pages.mjs
//
// Depois:
//   git add og/ && git commit -m "regen og pages" && git push
//
// Quando rodar:
//   - Após cadastrar/editar uma experiência no admin.
//   - Pode ser disparado pelo GitHub Action `build-og-pages.yml`
//     também (workflow_dispatch — botão manual).
// =============================================================

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SUPABASE_URL = "https://nwijxjmenbfyehvscogs.supabase.co";
// Publishable key (segura pra usar publicamente — mesma do admin).
const SUPABASE_KEY = "sb_publishable_HKveTG-kF0ZDsbiHYvwBdA_Kg5PUOlJ";
const SITE = "https://elarah.com.br";
const FALLBACK_IMAGE = SITE + "/assets/logo.png";

const CATEGORY_DEFAULT_IMG = {
  "sabonete":    "/assets/sabonete.jpg",
  "perfumaria":  "/assets/perfumaria.jpg",
  "ceramica":    "/assets/ceramica-fria.jpg",
  "tufting":     "/assets/tufting1.jpg",
  "pintura":     "/assets/pinturataca.jpg",
  "vela":        "/assets/velaaromatica.jpg",
  "gastronomia": "/assets/cookies.jpg",
  "macrame":     "/assets/macrameee.jpg",
  "floral":      "/assets/florseca.jpg",
  "bartenderia": "/assets/drinks.jpg",
};

function normalizeCat(cat) {
  return String(cat || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function resolveImage(raw, categoria) {
  const s = String(raw || "").trim();
  if (s) {
    if (/^https?:\/\//i.test(s)) return s;
    const slash = s.lastIndexOf("/");
    const dir = slash >= 0 ? s.slice(0, slash + 1) : "";
    const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
    const p = (s.startsWith("/") ? "" : "/") +
      (/^assets|images|img\//i.test(s) ? dir.toLowerCase() + file : "assets/" + file);
    return SITE + p;
  }
  const fb = CATEGORY_DEFAULT_IMG[normalizeCat(categoria)];
  return fb ? SITE + fb : FALLBACK_IMAGE;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s, max = 200) {
  const t = String(s || "").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

function renderHtml(exp) {
  const title = (exp.nome || "Elarah — Experiências em São Paulo").trim();
  const description = truncate(exp.descricao || "Descubra experiências feitas pra desacelerar e conectar.");
  const image = resolveImage(exp.imagem, exp.categoria);
  const redirectUrl = `${SITE}/experiencia.html?id=${encodeURIComponent(exp.id)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Elarah">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:secure_url" content="${escapeHtml(image)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta property="og:url" content="${escapeHtml(redirectUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta name="description" content="${escapeHtml(description)}">
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${escapeHtml(redirectUrl)}">
<link rel="icon" href="${SITE}/assets/logo.png" type="image/png">
<style>
body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#faf6f0;color:#1a1a1a;text-align:center;padding:40px 20px;}
.wrap{max-width:520px;margin:0 auto;}
img{max-width:320px;width:100%;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.12);}
h1{font-size:1.4rem;margin:24px 0 12px;line-height:1.3;}
p{color:#555;margin:0 0 24px;line-height:1.5;}
a{display:inline-block;padding:14px 32px;background:#f0a05e;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;}
</style>
</head>
<body>
<div class="wrap">
<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<a href="${escapeHtml(redirectUrl)}">Ver experiência</a>
</div>
<script>
// Redirect imediato pra usuário humano. Crawler do WhatsApp não
// executa este JS — só lê as og tags acima e gera o preview.
try{window.location.replace(${JSON.stringify(redirectUrl)});}
catch(e){window.location.href=${JSON.stringify(redirectUrl)};}
</script>
</body>
</html>`;
}

async function fetchExperiences() {
  const url = `${SUPABASE_URL}/rest/v1/experiences?select=id,nome,descricao,imagem,categoria&order=created_at.desc`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase REST falhou: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function main() {
  const dir = path.join(process.cwd(), "og");
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  console.log("[build-og] Buscando experiências…");
  const exps = await fetchExperiences();
  console.log(`[build-og] ${exps.length} experiências encontradas.`);

  let written = 0;
  for (const exp of exps) {
    if (!exp || !exp.id) continue;
    const html = renderHtml(exp);
    const file = path.join(dir, `${exp.id}.html`);
    await writeFile(file, html, "utf-8");
    written++;
  }

  console.log(`[build-og] ${written} arquivos gerados em og/`);
  console.log(`[build-og] Próximo passo: git add og/ && git commit -m "regen og" && git push`);
}

main().catch((err) => {
  console.error("[build-og] FALHOU:", err);
  process.exit(1);
});
