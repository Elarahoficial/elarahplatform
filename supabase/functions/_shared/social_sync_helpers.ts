// =============================================================
// ELARAH — Helpers de normalização para sync de posts
// -------------------------------------------------------------
// - Mapeia media_type/media_product_type da Graph API para o
//   nosso vocabulário (reel|story|feed|carrossel|video).
// - Extrai hashtags da legenda como `tags` do post.
// - Decide se um post deve ser re-sincronizado.
// =============================================================

export type PostType = "reel" | "story" | "feed" | "carrossel" | "video";

// Mapeia retorno da Graph API → nosso enum.
//   media_type      = IMAGE | VIDEO | CAROUSEL_ALBUM
//   media_product_type = AD | FEED | STORY | REELS
export function normalizeMediaType(
  mediaType?: string | null,
  productType?: string | null,
): PostType {
  const pt = (productType || "").toUpperCase();
  const mt = (mediaType || "").toUpperCase();

  if (pt === "STORY") return "story";
  if (pt === "REELS") return "reel";
  if (mt === "CAROUSEL_ALBUM") return "carrossel";
  if (mt === "VIDEO") return "video";
  return "feed";
}

// Extrai hashtags da legenda. Retorna tags em lower-case,
// sem o `#`, deduplicadas, espaços trocados por... nada
// (#vilamadalena vira "vilamadalena"). Pra hashtags com
// case mixed (#VilaMadalena) o lower já normaliza.
//
// Decisão: NÃO transformar "#vilamadalena" em "vila madalena"
// automaticamente — quem faz #vilamadalena junto está
// sinalizando que é uma hashtag única, não duas palavras.
// Tags estratégicas (com espaço) são adicionadas pelo time
// manualmente via UI.
const HASHTAG_RE = /#([A-Za-zÀ-ÿ0-9_]{2,64})/g;

export function extractHashtags(caption: string | null | undefined): string[] {
  if (!caption) return [];
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = HASHTAG_RE.exec(caption)) !== null) {
    set.add(m[1].toLowerCase());
  }
  return Array.from(set);
}

// Política de re-sincronização. A Graph API vai aceitar
// qualquer post, mas a gente economiza chamadas:
//   - Posts ≤7 dias  → resync sempre (insights ainda mudam)
//   - Posts 7-30 dias → resync 1x por semana
//   - Posts >30 dias  → não resync (números cristalizaram)
// Além disso: se o post não existe no banco, sync sempre.
export function shouldResync(
  postedAt: Date,
  lastMetricSyncAt: Date | null,
): boolean {
  if (!lastMetricSyncAt) return true;
  const ageDays = (Date.now() - postedAt.getTime()) / 86400000;
  const sinceLastSyncDays =
    (Date.now() - lastMetricSyncAt.getTime()) / 86400000;
  if (ageDays <= 7) return true;
  if (ageDays <= 30) return sinceLastSyncDays >= 7;
  return false;
}

// Faz merge não-destrutivo de tags: preserva tags adicionadas
// manualmente pelo time, mas atualiza as hashtags extraídas
// se a legenda mudou. Estratégia: hashtags vão com prefixo
// "#" pra distinguir das tags estratégicas. Mas como já
// guardamos sem "#" no banco, vamos usar union simples.
//
// Decisão pragmática: merge = união. Tag manual nunca some,
// hashtag nova entra. Em raro caso de duplicidade conceitual
// ("comida" manual + #comida hashtag), vira uma só.
export function mergeTags(existing: string[], extracted: string[]): string[] {
  const set = new Set<string>();
  for (const t of existing) set.add(t.trim().toLowerCase());
  for (const t of extracted) set.add(t.trim().toLowerCase());
  return Array.from(set).filter(Boolean);
}
