// =============================================================
// ELARAH — Constantes da integração com redes sociais
// -------------------------------------------------------------
// Centraliza endpoints, escopos e versões de API. Todas as Edge
// Functions de integração (oauth-start, oauth-callback, sync-*)
// importam daqui pra ficar fácil mudar API version ou escopo
// num único lugar.
// =============================================================

// -----------------------------------------------------------
// INSTAGRAM (Login direto via Instagram Business — sem Facebook)
// -----------------------------------------------------------
// Apps tipo "Empresa" criados após 2024 usam o login direto pelo
// Instagram (não pelo Facebook Login). O fluxo é:
//   1. Authorization: https://www.instagram.com/oauth/authorize
//   2. Token short-lived: POST https://api.instagram.com/oauth/access_token
//   3. Token long-lived (60d): GET https://graph.instagram.com/access_token
//   4. Chamadas: https://graph.instagram.com/v21.0/...
// Documentação: https://developers.facebook.com/docs/instagram-platform/
//               instagram-api-with-instagram-login
export const IG_API_VERSION = "v21.0";

export const IG_OAUTH_DIALOG_URL = "https://www.instagram.com/oauth/authorize";
export const IG_TOKEN_EXCHANGE_URL = "https://api.instagram.com/oauth/access_token";
export const IG_GRAPH_BASE = `https://graph.instagram.com/${IG_API_VERSION}`;
// Endpoint sem versão p/ trocar/refresh do long-lived token:
export const IG_GRAPH_BASE_NOVERSION = "https://graph.instagram.com";

// Escopos mínimos pra ler conteúdo + insights via login direto do IG.
// Esses são DIFERENTES dos scopes via Facebook Login — começam com
// "instagram_business_*" em vez de "instagram_*".
export const IG_INSTAGRAM_SCOPES: readonly string[] = [
  "instagram_business_basic",
  "instagram_business_manage_insights",
];

// Aliases legados — o resto do código ainda referencia META_GRAPH_BASE
// (sync-instagram, social_meta_client). Apontamos pro Instagram Graph
// pra não quebrar tudo de uma vez.
export const META_API_VERSION = IG_API_VERSION;
export const META_GRAPH_BASE = IG_GRAPH_BASE;
export const META_OAUTH_DIALOG_URL = IG_OAUTH_DIALOG_URL;
export const META_INSTAGRAM_SCOPES = IG_INSTAGRAM_SCOPES;

// -----------------------------------------------------------
// PROVIDERS suportados (extensível)
// -----------------------------------------------------------
export type SocialProvider = "instagram" | "tiktok" | "linkedin";

export const SUPPORTED_PROVIDERS: readonly SocialProvider[] = [
  "instagram",
  // tiktok e linkedin entram aqui quando suas Edge Functions
  // de OAuth estiverem prontas.
];

// -----------------------------------------------------------
// Helpers de variável de ambiente — chamada única e validação.
// Se a env var faltar, a função morre cedo com erro claro
// (em vez de quebrar metade do fluxo OAuth e deixar a conexão
// num estado meia-boca).
// -----------------------------------------------------------
export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) {
    throw new Error(`Configuração ausente: variável de ambiente ${name} não está definida.`);
  }
  return v;
}

export function envOrDefault(name: string, fallback: string): string {
  return Deno.env.get(name) ?? fallback;
}
