// =============================================================
// ELARAH — og-experience Edge Function (v2 — minimal preview)
// -------------------------------------------------------------
// GET /functions/v1/og-experience?id=<uuid>&name=<opcional>
//
// Retorna HTML MÍNIMO com Open Graph dinâmico pra crawlers do
// WhatsApp/Facebook/iMessage gerarem preview com a imagem real
// da experiência cadastrada.
//
// Mudanças vs v1 (que falhou em gerar preview):
//   - Removido <script> de redirect (crawler agnóstico, mas alguns
//     classificam página com JS como "dinâmica" e pulam preview).
//   - Removido CSS embutido (não afeta crawler, mas reduz HTML).
//   - Removido <meta http-equiv="refresh"> (crawler segue refresh
//     e ia parar em experiencia.html sem og tags).
//   - Adicionado og:image:width/height (WhatsApp prefere imagens
//     com dimensões declaradas).
//   - Fallback robusto por NOME da experiência via ?name=
//     (cobre IDs placeholder de bookings antigos).
//   - HTML totalmente estático: 1 <h1>, 1 <a>, 1 <img>. Só isso.
//   - Headers cdn-cache-control no-store pra evitar Cloudflare
//     servir versões antigas após fix.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SITE = "https://elarah.com.br";
const FALLBACK_IMAGE = SITE + "/assets/logo.png";
const FALLBACK_TITLE = "Elarah — Experiências em São Paulo";
const FALLBACK_DESC = "Descubra experiências feitas pra desacelerar e conectar.";

// Fallback de imagem por categoria — espelho do mapa em script.js,
// pra evitar fallback final genérico quando a experiência não tem
// imagem cadastrada.
const CATEGORY_DEFAULT_IMG: Record<string, string> = {
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

function normalizeCategoria(cat: string): string {
  return String(cat || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function resolveImage(raw: string | null | undefined, categoria: string | null | undefined): string {
  const s = String(raw || "").trim();
  if (s) {
    if (/^https?:\/\//i.test(s)) return s;
    const slash = s.lastIndexOf("/");
    const dir = slash >= 0 ? s.slice(0, slash + 1) : "";
    const file = (slash >= 0 ? s.slice(slash + 1) : s).toLowerCase();
    const path = (s.startsWith("/") ? "" : "/") +
      (/^assets|images|img\//i.test(s) ? dir.toLowerCase() + file : "assets/" + file);
    return SITE + path;
  }
  // Sem imagem cadastrada: tenta fallback por categoria.
  const catKey = normalizeCategoria(categoria || "");
  const catFb = CATEGORY_DEFAULT_IMG[catKey];
  if (catFb) return SITE + catFb;
  return FALLBACK_IMAGE;
}

function escapeHtml(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateDesc(s: string, max = 200): string {
  const t = String(s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

// Detecta UUID v4 padrão. IDs placeholder (00000000-...-000012) não
// passam por esta validação porque a versão é 0, não 4. Retorna true
// pra UUIDs normais; false pra ids antigos / sintéticos.
function isLikelyRealUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function renderHtml(opts: {
  title: string;
  description: string;
  image: string;
  redirectUrl: string;
}): string {
  const { title, description, image, redirectUrl } = opts;
  // HTML mínimo. Sem <script>, sem CSS, sem meta-refresh.
  // O usuário humano clica no link grande no centro.
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
</head>
<body style="font-family:system-ui,sans-serif;background:#faf6f0;color:#1a1a1a;text-align:center;padding:40px 20px;">
<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="max-width:320px;width:100%;border-radius:16px;">
<h1 style="font-size:1.4rem;margin:24px 0 12px;">${escapeHtml(title)}</h1>
<p style="color:#555;max-width:480px;margin:0 auto 24px;line-height:1.5;">${escapeHtml(description)}</p>
<a href="${escapeHtml(redirectUrl)}" style="display:inline-block;padding:14px 32px;background:#f0a05e;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Ver experiência</a>
</body>
</html>`;
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Cache 5 min na borda. cdn-cache-control: no-store evita que
      // proxies (Cloudflare etc.) cacheiem respostas erradas após
      // alterações na função.
      "cache-control": "public, max-age=300",
      "cdn-cache-control": "no-store",
      // Permite embed em qualquer site (preview de WhatsApp etc.)
      "x-frame-options": "SAMEORIGIN",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").trim();
  const nameHint = (url.searchParams.get("name") || "").trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");

  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESC;
  let image = FALLBACK_IMAGE;
  let resolvedExperienceId: string | null = null;

  if (supabaseUrl && serviceKey && (id || nameHint)) {
    try {
      const sb = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Tenta por ID se for UUID válido. IDs placeholder do tipo
      // 00000000-...-000012 (gerados de seeds antigos) não vão bater
      // — caem no fallback por nome.
      let row: { id: string; nome: string; descricao: string | null; imagem: string | null; categoria: string | null } | null = null;
      if (id && isLikelyRealUuid(id)) {
        const { data } = await sb
          .from("experiences")
          .select("id, nome, descricao, imagem, categoria")
          .eq("id", id)
          .maybeSingle();
        if (data) row = data as typeof row;
      }
      // Fallback por nome (se id não bateu OU id era placeholder).
      if (!row && nameHint) {
        const { data } = await sb
          .from("experiences")
          .select("id, nome, descricao, imagem, categoria")
          .ilike("nome", nameHint)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data.length) row = data[0] as typeof row;
      }
      // Último recurso: tenta por id (mesmo se não pareça UUID v4) —
      // suporta seeds antigos que possam ter uuid v3/v0/etc.
      if (!row && id && !isLikelyRealUuid(id)) {
        try {
          const { data } = await sb
            .from("experiences")
            .select("id, nome, descricao, imagem, categoria")
            .eq("id", id)
            .maybeSingle();
          if (data) row = data as typeof row;
        } catch (_) { /* ignora — id inválido pra DB */ }
      }

      if (row) {
        title = (row.nome || FALLBACK_TITLE).trim();
        description = truncateDesc(row.descricao || FALLBACK_DESC);
        image = resolveImage(row.imagem, row.categoria);
        resolvedExperienceId = row.id;
      }
    } catch (e) {
      console.error("[og-experience] supabase fetch error:", e);
    }
  }

  // URL pra onde o usuário humano vai se clicar.
  // Prioriza o id real resolvido (caso o input fosse só nome) e cai
  // pro id original ou home se nada bateu.
  const redirectUrl = resolvedExperienceId
    ? `${SITE}/experiencia.html?id=${encodeURIComponent(resolvedExperienceId)}`
    : (id
      ? `${SITE}/experiencia.html?id=${encodeURIComponent(id)}`
      : `${SITE}/`);

  return htmlResponse(renderHtml({ title, description, image, redirectUrl }));
});
