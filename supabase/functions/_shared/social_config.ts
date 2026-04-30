// =============================================================
// ELARAH — Constantes da integração com redes sociais
// -------------------------------------------------------------
// Centraliza endpoints, escopos e versões de API. Todas as Edge
// Functions de integração (oauth-start, oauth-callback, sync-*)
// importam daqui pra ficar fácil mudar API version ou escopo
// num único lugar.
// =============================================================

// -----------------------------------------------------------
// META (Instagram + Facebook Login for Business)
// -----------------------------------------------------------
export const META_API_VERSION = "v21.0";

export const META_OAUTH_DIALOG_URL =
  `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`;

export const META_GRAPH_BASE =
  `https://graph.facebook.com/${META_API_VERSION}`;

// Escopos mínimos pra ler insights de Instagram Business.
// Documentação: https://developers.facebook.com/docs/instagram-platform/
export const META_INSTAGRAM_SCOPES: readonly string[] = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
];

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
