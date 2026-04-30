// =============================================================
// ELARAH — Cliente Meta Graph API
// -------------------------------------------------------------
// Wrapper sobre fetch() com:
//   - URL base padronizada (META_GRAPH_BASE)
//   - Tratamento de erro uniforme (extrai message do payload)
//   - Decrypt do token sob demanda
//   - Paginação automática (seguir cursor "next")
//   - Backoff em rate limit (HTTP 429 / OAuth code 4)
// =============================================================

import { META_GRAPH_BASE } from "./social_config.ts";
import { decryptToken } from "./social_crypto.ts";

interface GraphErrorPayload {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export class GraphAPIError extends Error {
  status: number;
  fbCode?: number;
  fbSubcode?: number;
  fbTraceId?: string;
  constructor(msg: string, status: number, payload?: GraphErrorPayload) {
    super(msg);
    this.status = status;
    this.fbCode = payload?.error?.code;
    this.fbSubcode = payload?.error?.error_subcode;
    this.fbTraceId = payload?.error?.fbtrace_id;
  }
}

// -----------------------------------------------------------
// Cliente vinculado a um access_token (criptografado).
// O decrypt acontece no construtor (uma vez por instância).
// -----------------------------------------------------------
export class MetaGraphClient {
  private accessToken: string | null = null;
  private tokenEnc: string;

  constructor(encryptedAccessToken: string) {
    this.tokenEnc = encryptedAccessToken;
  }

  private async ensureToken(): Promise<string> {
    if (!this.accessToken) {
      this.accessToken = await decryptToken(this.tokenEnc);
    }
    return this.accessToken;
  }

  async get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const token = await this.ensureToken();
    const url = new URL(`${META_GRAPH_BASE}${path}`);
    url.searchParams.set("access_token", token);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    return fetchWithBackoff<T>(url.toString());
  }

  // Itera todas as páginas de um endpoint paginado.
  // Para de seguir paginação quando: terminam os cursors,
  // OR shouldStop(item) retorna true (ex: posts mais antigos
  // que o limite que nos interessa).
  async paginate<T>(
    path: string,
    params: Record<string, string | number | undefined>,
    shouldStop?: (item: T) => boolean,
    maxPages = 10,
  ): Promise<T[]> {
    const all: T[] = [];
    let nextUrl: string | null = null;
    let page = 0;

    while (page < maxPages) {
      page++;
      let payload: { data: T[]; paging?: { next?: string } };
      if (nextUrl) {
        payload = await fetchWithBackoff(nextUrl);
      } else {
        payload = await this.get<{ data: T[]; paging?: { next?: string } }>(path, params);
      }
      const items = payload.data || [];
      for (const item of items) {
        if (shouldStop && shouldStop(item)) return all;
        all.push(item);
      }
      if (!payload.paging?.next) break;
      nextUrl = payload.paging.next;
    }
    return all;
  }
}

// -----------------------------------------------------------
// fetch com backoff exponencial em 429/erro de rate limit.
// -----------------------------------------------------------
async function fetchWithBackoff<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url);
  const text = await res.text();

  if (res.ok) {
    try { return JSON.parse(text) as T; }
    catch { throw new GraphAPIError(`Resposta inválida (não-JSON): ${text.slice(0, 200)}`, res.status); }
  }

  let payload: GraphErrorPayload | undefined;
  let msg = text;
  try {
    payload = JSON.parse(text) as GraphErrorPayload;
    msg = payload.error?.message || text;
  } catch { /* keep raw */ }

  // Códigos de rate limit / temporário do Facebook:
  //   4 = User request limit reached
  //   17 = User request limit reached
  //   32 = Page request limit reached
  //   613 = Calls to this api have exceeded the rate limit
  const code = payload?.error?.code;
  const transient = res.status === 429 || res.status >= 500 || [4, 17, 32, 613].includes(code ?? -1);

  if (transient && attempt < 3) {
    const waitMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
    await new Promise((r) => setTimeout(r, waitMs));
    return fetchWithBackoff<T>(url, attempt + 1);
  }

  throw new GraphAPIError(`Graph API ${res.status}: ${msg}`, res.status, payload);
}
