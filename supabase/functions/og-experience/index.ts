// =============================================================
// ELARAH — og-experience Edge Function
// -------------------------------------------------------------
// GET /functions/v1/og-experience?id=<uuid>
//
// Retorna HTML estático com Open Graph dinâmico (og:image,
// og:title, og:description) lido da experiência cadastrada no
// banco. Crawlers (WhatsApp, Facebook, iMessage, Twitter) leem
// as meta tags e geram preview com a imagem real da experiência.
// Visitantes humanos são redirecionados imediatamente pra
// experiencia.html?id=<uuid> via JS — usuário nunca vê esta
// página, só o crawler.
//
// Por que não experiencia.html direto?
//   experiencia.html popula og tags via JavaScript, e o crawler
//   do WhatsApp NÃO roda JS — só lê HTML estático. Esta function
//   resolve isso por experiência (sem precisar criar landing
//   dedicada pra cada uma).
//
// Acesso:
//   Sem JWT — endpoint público (anon). RLS de experiences já
//   permite SELECT pra anon (linha pública).
//
// Tolerância a falhas:
//   - id inválido / experiência não encontrada → HTML genérico
//     com og:image padrão (logo Elarah). Não quebra o crawler.
//   - imagem da experiência sem URL absoluta → resolve relativo
//     a https://elarah.com.br/.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SITE = "https://elarah.com.br";
const FALLBACK_IMAGE = SITE + "/assets/logo.png";
const FALLBACK_TITLE = "Elarah — Experiências em São Paulo";
const FALLBACK_DESC = "Descubra experiências feitas pra desacelerar e conectar.";

// Resolve uma URL de imagem (que pode vir como "assets/foo.jpg",
// "/assets/foo.jpg" ou já absoluta) pra absoluta com base no SITE.
function resolveImage(raw: string | null | undefined): string {
  const s = String(raw || "").trim();
  if (!s) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(s)) return s;
  // Lowercase do basename — convenção do projeto é tudo minúsculo
  // em /assets (mesma normalização do script.js).
  const slash = s.lastIndexOf("/");
  const dir = slash >= 0 ? s.slice(0, slash + 1) : "";
  const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
  const path = (s.startsWith("/") ? "" : "/") +
    (/^assets|images|img\//i.test(s) ? dir.toLowerCase() + file : "assets/" + file);
  return SITE + path;
}

function escapeHtml(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Trunca pra ficar bom no preview (descrições longas viram texto
// truncado no card do WhatsApp/Facebook). 200 chars é o limite
// prático que cabe sem ficar feio.
function truncateDesc(s: string, max = 200): string {
  const t = String(s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function renderHtml(opts: {
  title: string;
  description: string;
  image: string;
  redirectId: string | null;
}): string {
  const { title, description, image } = opts;
  const redirectUrl = opts.redirectId
    ? `${SITE}/experiencia.html?id=${encodeURIComponent(opts.redirectId)}`
    : `${SITE}/`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Elarah">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta property="og:url" content="${escapeHtml(redirectUrl)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="${SITE}/assets/logo.png" type="image/png">

  <!-- IMPORTANTE: nada de meta http-equiv="refresh" aqui.
       O crawler do WhatsApp segue meta refresh e ia parar em
       experiencia.html (que não tem og tags estáticas — só dinâmicas
       via JS, que crawler não roda) → resultado: WhatsApp via como
       "sem preview". Sem o refresh, o crawler lê as og tags acima
       e gera o preview correto. Usuário humano é redirecionado
       pelo JS abaixo (crawler não executa). -->

  <style>
    body{margin:0;font-family:'DM Sans',system-ui,sans-serif;background:#faf6f0;color:#1a1a1a;
      min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;}
    .wrap{max-width:520px;text-align:center;}
    .wrap img{width:100%;max-width:320px;height:auto;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.12);margin-bottom:24px;}
    .wrap h1{font-family:'DM Serif Display',Georgia,serif;font-size:1.5rem;margin:0 0 12px;line-height:1.25;}
    .wrap p{color:#555;font-size:.92rem;margin:0 0 20px;line-height:1.5;}
    .spinner{display:inline-block;width:20px;height:20px;border:3px solid #f0a05e;border-top-color:transparent;
      border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:8px;}
    @keyframes spin{to{transform:rotate(360deg);}}
    a.fallback{display:inline-block;margin-top:14px;padding:12px 24px;background:#f0a05e;color:#fff;
      text-decoration:none;border-radius:999px;font-weight:600;font-size:.92rem;}
  </style>
</head>
<body>
  <div class="wrap">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
    <h1>${escapeHtml(title)}</h1>
    <p><span class="spinner"></span>Te levando para a experiência…</p>
    <a class="fallback" href="${escapeHtml(redirectUrl)}">Ver experiência</a>
  </div>
  <script>
    // Redirect imediato — crawler nao executa, so usuario humano.
    try { window.location.replace(${JSON.stringify(redirectUrl)}); }
    catch (e) { window.location.href = ${JSON.stringify(redirectUrl)}; }
  </script>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").trim();

  // ID ausente → renderiza fallback genérico (não 4xx pra não
  // bagunçar o preview do WhatsApp em caso de link mal formado).
  if (!id) {
    return new Response(renderHtml({
      title: FALLBACK_TITLE,
      description: FALLBACK_DESC,
      image: FALLBACK_IMAGE,
      redirectId: null,
    }), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");

  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESC;
  let image = FALLBACK_IMAGE;

  if (supabaseUrl && serviceKey) {
    try {
      const sb = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await sb
        .from("experiences")
        .select("nome, descricao, imagem")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        title = (data.nome || FALLBACK_TITLE).trim();
        description = truncateDesc(data.descricao || FALLBACK_DESC);
        image = resolveImage(data.imagem);
      }
    } catch (e) {
      console.error("[og-experience] supabase fetch error:", e);
      // Cai no fallback genérico — não quebra preview por erro de DB.
    }
  }

  return new Response(renderHtml({
    title,
    description,
    image,
    redirectId: id,
  }), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Cache: WhatsApp/Facebook re-fazem o crawl às vezes; 5 min é
      // bom equilíbrio entre velocidade e atualizações de imagem.
      "cache-control": "public, max-age=300",
    },
  });
});
