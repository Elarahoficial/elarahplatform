// =============================================================
// ELARAH — automated-notifications Edge Function (cron)
// -------------------------------------------------------------
// Roda de tempos em tempos (pg_cron) e dispara, quando chega a hora:
//   1) Lembrete ~48h antes da experiência
//   2) Pedido de feedback ~2 dias DEPOIS da experiência (com link de avaliação)
//   3) Recuperação de reserva PENDENTE ~3-6h depois (1x)
//
// TUDO passa pelo PORTÃO ÚNICO (gatedSendWhatsApp): idempotência
// (whatsapp_send_log UNIQUE), fail-closed, kill switch, modo observação,
// rollout e allowlist. Em observação, REGISTRA quem receberia e NÃO envia.
//
// No-backfill: cada pass só pega quem está DENTRO da janela de tempo — nunca
// dispara retroativamente pro histórico. Cada envio real carimba a coluna
// de controle (reminder_48h_sent_at / feedback_whatsapp_sent_at /
// pending_recovery_sent_at); em observação a coluna fica null (não consome).
//
// Auth: só cron. Authorization: Bearer <CRON_SECRET | SERVICE_ROLE>.
// Deploy com verify_jwt OFF (não está na allowlist JWT do workflow).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  bookingConfirmationWhatsAppText,
  feedbackWhatsAppText,
  gatedSendWhatsApp,
  pendingRecoveryWhatsAppText,
  reminder48hWhatsAppText,
} from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
// Mesma resolução de SECRET do reviews.standalone.ts — pra o token do link de
// avaliação BATER com o que o avaliar.html valida.
const SECRET = Deno.env.get("BROADCAST_SECRET") || CRON_SECRET || SERVICE_ROLE ||
  "elarah-fallback-secret";
const SITE = "https://elarah.com.br";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const H = 3600_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Token do link de avaliação (idêntico ao reviews: HMAC "review:"+id).
async function reviewToken(bookingId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("review:" + bookingId));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Hora de início a partir de "15h00 – 18h00" / "15:00" etc.
function parseStartHour(raw: string): { hh: number; mm: number } | null {
  if (!raw) return null;
  const head = String(raw).split(/[–—\-]/)[0].trim();
  const m = head.match(/(\d{1,2})(?:[h:](\d{2}))?/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = m[2] ? Number(m[2]) : 0;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

// Timestamp do evento (fuso -03:00). null se não der pra derivar.
function deriveEventTs(dataStr: string | null, horarioStr: string | null, nowMs: number): number | null {
  if (!dataStr) return null;
  const m = String(dataStr).trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const year = m[3] ? (Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3])) : new Date(nowMs).getUTCFullYear();
  const h = parseStartHour(horarioStr || "");
  if (!h) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h.hh)}:${pad(h.mm)}:00-03:00`).getTime();
  return Number.isFinite(ts) ? ts : null;
}

// deno-lint-ignore no-explicit-any
function expImageUrl(b: any): string | undefined {
  const raw = b?.experiences?.imagem ?? null;
  if (!raw) return SITE + "/assets/logo.png";
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return SITE + "/" + s.replace(/^\/+/, "");
}
// deno-lint-ignore no-explicit-any
function phoneOf(b: any): unknown {
  const meta = (b?.metadata ?? {}) as Record<string, unknown>;
  return (meta.telefone_digits as string | undefined) ?? b?.telefone;
}
// deno-lint-ignore no-explicit-any
function localOf(b: any): { endereco: unknown; bairro: unknown } {
  const meta = (b?.metadata ?? {}) as Record<string, unknown>;
  return { endereco: meta.endereco ?? null, bairro: meta.bairro ?? null };
}
// deno-lint-ignore no-explicit-any
function isSuppressed(b: any): boolean {
  const meta = (b?.metadata ?? {}) as Record<string, unknown>;
  return b?.aguardando_experiencia === true ||
    meta.aguardando_experiencia === true || meta.suppress_customer_messaging === true;
}

const SELECT =
  "id, nome, telefone, data, horario, status, experiencia_id, experiencia_nome, aguardando_experiencia, metadata, created_at, reminder_48h_sent_at, feedback_whatsapp_sent_at, pending_recovery_sent_at, experiences(imagem)";

interface PassResult { candidatos: number; enviados: number; observados: number; pulados: number; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // Auth: só cron.
  const tk = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const okAuth = (CRON_SECRET && tk === CRON_SECRET) || (SERVICE_ROLE && tk === SERVICE_ROLE);
  if (!okAuth) return json({ ok: false, error: "nao_autorizado" }, 401);

  const now = Date.now();
  const out: Record<string, PassResult> = {};

  // Helper genérico de um pass.
  async function runPass(
    kind: string,
    column: "reminder_48h_sent_at" | "feedback_whatsapp_sent_at" | "pending_recovery_sent_at",
    expectedStatus: "pago" | "pending",
    rows: unknown[],
    // deno-lint-ignore no-explicit-any
    build: (b: any) => Promise<string>,
  ): Promise<PassResult> {
    const r: PassResult = { candidatos: rows.length, enviados: 0, observados: 0, pulados: 0 };
    for (const raw of rows) {
      // deno-lint-ignore no-explicit-any
      const b = raw as any;
      // RELEITURA AUTORITATIVA NA HORA DO ENVIO (fecha a race: a query em lote
      // pode ter uns minutos; se a reserva foi cancelada/reembolsada/marcada
      // "aguardando" nesse meio tempo, NÃO envia). Fail-closed: leitura
      // falhou/sumiu → pula.
      const { data: fresh, error: freshErr } = await supabase
        .from("bookings")
        .select("status, aguardando_experiencia")
        .eq("id", b.id)
        .maybeSingle();
      if (freshErr || !fresh) { r.pulados++; continue; }
      const statusAllowed = fresh.status === expectedStatus;
      const suppressed = fresh.aguardando_experiencia === true || isSuppressed(b);
      const message = await build(b);
      const res = await gatedSendWhatsApp(supabase, {
        kind,
        dedupeKey: kind + ":" + b.id,
        identifierOk: !!b.id && !!b.experiencia_id,
        rawPhone: phoneOf(b),
        suppressed,
        statusAllowed,
        image: expImageUrl(b),
        caption: message,
        message,
        bookingId: b.id,
        experienciaId: b.experiencia_id,
      });
      if (res.sent) {
        r.enviados++;
        // Carimba SÓ no envio real (observação/dry-run não consome).
        await supabase.from("bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
        await sleep(1200); // respira entre envios reais (anti-bloqueio Z-API)
      } else if (res.reason === "observed" || res.dryRun) {
        r.observados++;
      } else {
        r.pulados++;
      }
    }
    return r;
  }

  // ===== 1) LEMBRETE ~48h antes (evento entre now+36h e now+48h) =====
  {
    const { data } = await supabase.from("bookings").select(SELECT)
      .eq("status", "pago").eq("aguardando_experiencia", false)
      .is("reminder_48h_sent_at", null)
      .not("data", "is", null).limit(300);
    const elig = (data ?? []).filter((b) => {
      // deno-lint-ignore no-explicit-any
      const ts = deriveEventTs((b as any).data, (b as any).horario, now);
      return ts != null && ts >= now + 36 * H && ts <= now + 48 * H;
    });
    out.lembrete = await runPass("reminder48", "reminder_48h_sent_at", "pago", elig, (b) =>
      Promise.resolve(reminder48hWhatsAppText({
        nome: b.nome, experienciaNome: b.experiencia_nome ?? "Sua experiência",
        data: b.data, horario: b.horario, ...localOf(b),
      })));
  }

  // ===== 2) FEEDBACK ~2 dias depois (evento entre now-72h e now-36h) =====
  {
    const { data } = await supabase.from("bookings").select(SELECT)
      .eq("status", "pago").eq("aguardando_experiencia", false)
      .is("feedback_whatsapp_sent_at", null)
      .not("data", "is", null).limit(300);
    const elig = (data ?? []).filter((b) => {
      // deno-lint-ignore no-explicit-any
      const ts = deriveEventTs((b as any).data, (b as any).horario, now);
      return ts != null && ts <= now - 36 * H && ts >= now - 72 * H;
    });
    out.feedback = await runPass("feedback", "feedback_whatsapp_sent_at", "pago", elig, async (b) => {
      const token = await reviewToken(b.id);
      const link = `${SITE}/avaliar.html?b=${encodeURIComponent(b.id)}&t=${token}`;
      return feedbackWhatsAppText({
        nome: b.nome, experienciaNome: b.experiencia_nome ?? "sua experiência", link,
      });
    });
  }

  // ===== 3) RECUPERAÇÃO DE PENDENTE ~3-6h (criada entre now-6h e now-3h) =====
  {
    const { data } = await supabase.from("bookings").select(SELECT)
      .eq("status", "pending")
      .is("pending_recovery_sent_at", null)
      .gte("created_at", new Date(now - 6 * H).toISOString())
      .lte("created_at", new Date(now - 3 * H).toISOString())
      .limit(300);
    out.pendente = await runPass("pending", "pending_recovery_sent_at", "pending", (data ?? []), (b) =>
      Promise.resolve(pendingRecoveryWhatsAppText({
        nome: b.nome, experienciaNome: b.experiencia_nome ?? "a experiência",
        data: b.data, horario: b.horario, ...localOf(b),
      })));
  }

  console.info("[automated-notifications] resumo", JSON.stringify(out));
  return json({ ok: true, resumo: out });
});
