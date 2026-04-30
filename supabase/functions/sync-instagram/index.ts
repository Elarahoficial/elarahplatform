// =============================================================
// ELARAH — sync-instagram Edge Function
// -------------------------------------------------------------
// POST /functions/v1/sync-instagram
//   Body (opcional): { account_id?: "uuid", trigger?: "manual" | "cron" }
//
// Headers (uma das opções):
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>   (cron / pg_net)
//   Authorization: Bearer <jwt do admin>                (uso manual via UI)
//
// O que faz:
//   1. Valida quem chamou (service_role OU admin).
//   2. Lê todas as accounts ativas com provider='instagram'
//      (ou apenas a especificada em account_id).
//   3. Pra cada account, abre uma social_sync_runs e:
//      a. Lista até 50 posts mais recentes via Graph API.
//      b. Pra cada post: decide se re-sync (≤7 dias OU novo).
//      c. Busca insights (métricas avançadas) por tipo.
//      d. Faz upsert em social_posts.
//      e. Insere snapshot em social_post_metrics.
//   4. Inclui Stories (endpoint /stories — válidos só nas
//      primeiras 24h, então perde se o cron falhar).
//   5. Fecha social_sync_runs com status final.
//
// Decisões:
//   - Token usado pra IG é o Page Access Token (em meta.page_access_token_enc),
//     que é o que a Graph API exige pra endpoints /ig_user_id/*.
//   - Métricas variam por tipo:
//       Reel:      plays, reach, total_interactions, saved, shares, likes, comments
//       Feed/Carr: impressions, reach, saved, total_interactions  (likes/comments do objeto media)
//       Story:     impressions, reach, replies, taps_forward, taps_back, exits
//   - Se uma chamada de insights falha (post privado / muito velho),
//     NÃO derruba o sync inteiro — registra "partial" e segue.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";
import { MetaGraphClient, GraphAPIError } from "../_shared/social_meta_client.ts";
import {
  extractHashtags,
  mergeTags,
  normalizeMediaType,
  shouldResync,
  type PostType,
} from "../_shared/social_sync_helpers.ts";
import { requireEnv } from "../_shared/social_config.ts";

// -----------------------------------------------------------
// Tipos da Graph API
// -----------------------------------------------------------
interface IgMediaListItem {
  id: string;
  media_type?: string;
  media_product_type?: string;
  caption?: string;
  permalink?: string;
  timestamp?: string;
  thumbnail_url?: string;
  media_url?: string;
  like_count?: number;
  comments_count?: number;
}

interface IgInsightValue { value?: number | { [k: string]: number } }
interface IgInsightItem  { name: string; values?: IgInsightValue[]; total_value?: { value?: number } }
interface IgInsightsResp { data: IgInsightItem[] }

interface MetricsBag {
  views: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  total_interactions: number;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function emptyMetrics(): MetricsBag {
  return { views: 0, impressions: 0, reach: 0, likes: 0, comments: 0, saves: 0, shares: 0, total_interactions: 0 };
}

function readMetric(insights: IgInsightsResp, name: string): number {
  const item = insights.data.find((d) => d.name === name);
  if (!item) return 0;
  // total_value (novo formato Graph v18+) ou values[0].value (formato antigo)
  if (typeof item.total_value?.value === "number") return item.total_value.value;
  const v = item.values?.[0]?.value;
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    return Object.values(v).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  }
  return 0;
}

// Métricas a pedir por tipo. Lista oficial:
// https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-media/insights
const METRICS_BY_TYPE: Record<PostType, string[]> = {
  reel:      ["plays", "reach", "total_interactions", "saved", "shares", "likes", "comments"],
  video:     ["impressions", "reach", "saved", "total_interactions", "likes", "comments"],
  feed:      ["impressions", "reach", "saved", "total_interactions"],
  carrossel: ["impressions", "reach", "saved", "total_interactions"],
  story:     ["impressions", "reach", "replies", "taps_forward", "taps_back", "exits"],
};

async function fetchInsights(
  client: MetaGraphClient,
  mediaId: string,
  type: PostType,
  fallback: { likes: number; comments: number },
): Promise<MetricsBag> {
  const metric = METRICS_BY_TYPE[type].join(",");
  let raw: IgInsightsResp;
  try {
    raw = await client.get<IgInsightsResp>(`/${mediaId}/insights`, { metric });
  } catch (err) {
    // Insights pode falhar pra posts orgânicos muito antigos ou privados
    // — devolvemos fallback com likes/comments do objeto media.
    if (err instanceof GraphAPIError && (err.status === 400 || err.fbCode === 100)) {
      return { ...emptyMetrics(), likes: fallback.likes, comments: fallback.comments };
    }
    throw err;
  }

  const m = emptyMetrics();
  m.impressions = readMetric(raw, "impressions");
  m.reach       = readMetric(raw, "reach");
  m.saves       = readMetric(raw, "saved");
  m.shares      = readMetric(raw, "shares");
  m.total_interactions = readMetric(raw, "total_interactions");
  // Reel usa "plays", outros usam "impressions" como proxy de views.
  m.views = type === "reel" ? readMetric(raw, "plays") : m.impressions;
  // Likes/comments: alguns endpoints retornam, outros não.
  m.likes    = readMetric(raw, "likes")    || fallback.likes;
  m.comments = readMetric(raw, "comments") || fallback.comments;
  return m;
}

// -----------------------------------------------------------
// Auth — aceita service_role (cron) OU admin JWT (UI)
// -----------------------------------------------------------
async function authorizeRequest(req: Request): Promise<{ ok: boolean; trigger: "cron" | "manual" }> {
  const auth = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return { ok: false, trigger: "manual" };
  const token = m[1];

  // Se for service_role key (cron), aceita.
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (token === serviceRole) return { ok: true, trigger: "cron" };

  // Senão, valida como JWT de admin.
  const adminId = await authorizeAdmin(auth);
  return { ok: !!adminId, trigger: "manual" };
}

// -----------------------------------------------------------
// Sync de uma conta
// -----------------------------------------------------------
interface SyncResult {
  account_id: string;
  username: string | null;
  inserted: number;
  updated: number;
  skipped: number;
  api_calls: number;
  status: "ok" | "partial" | "failed";
  error: string | null;
}

async function syncOneAccount(account: AccountRow, trigger: string): Promise<SyncResult> {
  const sb = getServiceClient();
  const result: SyncResult = {
    account_id: account.id,
    username: account.username,
    inserted: 0, updated: 0, skipped: 0, api_calls: 0,
    status: "ok", error: null,
  };

  // Abre run
  const { data: runRow } = await sb.from("social_sync_runs").insert({
    account_id: account.id,
    provider: account.provider,
    trigger_source: trigger,
    status: "running",
  }).select("id").single();
  const runId = runRow?.id as number | undefined;

  try {
    const pageTokenEnc = (account.meta as Record<string, unknown>)?.page_access_token_enc as string | undefined;
    if (!pageTokenEnc) throw new Error("page_access_token_enc ausente em meta");
    const client = new MetaGraphClient(pageTokenEnc);

    // Fetch posts (media + reels)
    const mediaItems = await client.paginate<IgMediaListItem>(
      `/${account.external_id}/media`,
      {
        fields: "id,media_type,media_product_type,caption,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count",
        limit: 25,
      },
      // Para de paginar ao chegar em posts >90 dias (não vamos sincronizar)
      (item) => {
        if (!item.timestamp) return false;
        const age = (Date.now() - new Date(item.timestamp).getTime()) / 86400000;
        return age > 90;
      },
      4, // max 4 páginas (=100 posts no máximo)
    );
    result.api_calls += 1;

    // Fetch stories (separado — endpoint /stories só retorna stories ativas das últimas 24h)
    let storyItems: IgMediaListItem[] = [];
    try {
      const storyResp = await client.get<{ data: IgMediaListItem[] }>(
        `/${account.external_id}/stories`,
        { fields: "id,media_type,media_product_type,caption,permalink,timestamp,thumbnail_url,media_url" },
      );
      storyItems = storyResp.data || [];
      result.api_calls += 1;
    } catch (err) {
      // Stories podem falhar se o app não tiver permissão ainda. Não bloqueia o resto.
      console.warn("[sync-instagram] /stories falhou:", err instanceof Error ? err.message : err);
    }

    const allMedia = [...mediaItems, ...storyItems];

    // Existing posts no banco (pra saber se é insert ou update + checar last_metric_sync_at)
    const externalIds = allMedia.map((m) => m.id);
    const { data: existingRows } = externalIds.length
      ? await sb
          .from("social_posts")
          .select("id, external_id, last_metric_sync_at, tags")
          .eq("provider", "instagram")
          .in("external_id", externalIds)
      : { data: [] };
    const existingByExt = new Map<string, { id: string; last_metric_sync_at: string | null; tags: string[] }>();
    (existingRows || []).forEach((r) => existingByExt.set(r.external_id, r as never));

    // Loop principal
    for (const media of allMedia) {
      const type = normalizeMediaType(media.media_type, media.media_product_type);
      const postedAt = media.timestamp ? new Date(media.timestamp) : new Date();
      const existing = existingByExt.get(media.id);
      const lastSync = existing?.last_metric_sync_at ? new Date(existing.last_metric_sync_at) : null;

      if (existing && !shouldResync(postedAt, lastSync)) {
        result.skipped += 1;
        continue;
      }

      // Busca insights
      let metrics: MetricsBag;
      try {
        metrics = await fetchInsights(client, media.id, type, {
          likes: media.like_count ?? 0,
          comments: media.comments_count ?? 0,
        });
        result.api_calls += 1;
      } catch (err) {
        console.warn(`[sync-instagram] insights ${media.id} falhou:`, err);
        result.skipped += 1;
        result.status = "partial";
        continue;
      }

      // Tags = hashtags + tags manuais já existentes
      const hashtags = extractHashtags(media.caption);
      const tags = existing ? mergeTags(existing.tags || [], hashtags) : hashtags;

      const upsertPayload = {
        account_id: account.id,
        provider: "instagram" as const,
        external_id: media.id,
        permalink: media.permalink ?? null,
        type,
        posted_at: postedAt.toISOString(),
        caption: media.caption ?? null,
        media_url: media.media_url ?? null,
        thumbnail_url: media.thumbnail_url ?? null,
        views: metrics.views,
        impressions: metrics.impressions,
        reach: metrics.reach,
        likes: metrics.likes,
        comments: metrics.comments,
        saves: metrics.saves,
        shares: metrics.shares,
        total_interactions: metrics.total_interactions,
        tags,
        raw: media as unknown as Record<string, unknown>,
        last_metric_sync_at: new Date().toISOString(),
        is_manual: false,
      };

      const { data: upserted, error: upErr } = await sb
        .from("social_posts")
        .upsert(upsertPayload, { onConflict: "provider,external_id" })
        .select("id")
        .single();

      if (upErr || !upserted) {
        console.error(`[sync-instagram] upsert ${media.id}:`, upErr);
        result.status = "partial";
        continue;
      }

      if (existing) result.updated += 1;
      else result.inserted += 1;

      // Histórico
      await sb.from("social_post_metrics").insert({
        post_id: upserted.id,
        views: metrics.views,
        impressions: metrics.impressions,
        reach: metrics.reach,
        likes: metrics.likes,
        comments: metrics.comments,
        saves: metrics.saves,
        shares: metrics.shares,
        total_interactions: metrics.total_interactions,
      });
    }

    // Atualiza account
    await sb.from("social_accounts").update({
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
      status: "active",
    }).eq("id", account.id);
  } catch (err) {
    result.status = "failed";
    result.error = err instanceof Error ? err.message : String(err);
    console.error("[sync-instagram] erro:", err);
    await sb.from("social_accounts").update({
      last_sync_error: result.error,
      status: "error",
    }).eq("id", account.id);
  } finally {
    if (runId) {
      await sb.from("social_sync_runs").update({
        finished_at: new Date().toISOString(),
        posts_inserted: result.inserted,
        posts_updated: result.updated,
        posts_skipped: result.skipped,
        api_calls: result.api_calls,
        status: result.status,
        error: result.error,
      }).eq("id", runId);
    }
  }

  return result;
}

interface AccountRow {
  id: string;
  provider: string;
  external_id: string;
  username: string | null;
  status: string;
  meta: Record<string, unknown>;
}

// -----------------------------------------------------------
// Handler
// -----------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método não permitido" }, 405);

  try {
    const auth = await authorizeRequest(req);
    if (!auth.ok) return jsonResponse({ ok: false, error: "Não autorizado" }, 401);

    let body: { account_id?: string; trigger?: string } = {};
    try { body = await req.json(); } catch { /* body opcional */ }

    const sb = getServiceClient();
    const query = sb
      .from("social_accounts")
      .select("id, provider, external_id, username, status, meta")
      .eq("provider", "instagram")
      .eq("status", "active");
    if (body.account_id) query.eq("id", body.account_id);

    const { data: accounts, error } = await query;
    if (error) throw new Error(error.message);
    if (!accounts || accounts.length === 0) {
      return jsonResponse({ ok: true, message: "Nenhuma conta Instagram ativa.", results: [] });
    }

    const trigger = body.trigger || auth.trigger;
    const results: SyncResult[] = [];
    for (const acc of accounts as AccountRow[]) {
      const r = await syncOneAccount(acc, trigger);
      results.push(r);
    }
    return jsonResponse({ ok: true, results });
  } catch (err) {
    console.error("[sync-instagram] handler erro:", err);
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
