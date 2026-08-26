// =============================================================
// ELARAH — resend-gift-card Edge Function
// -------------------------------------------------------------
// POST /functions/v1/resend-gift-card
//   { "gift_card_id": "uuid" }   → reenvia um
//   { "code": "ELRH-..." }       → reenvia um (por código)
//   { "all": true }              → reenvia TODOS os pendentes
//   { "all": true, "dry_run": true } → só LISTA, não envia
//   + "force": true              → ignora as travas abaixo
//
// PARA QUE SERVE
// --------------
// Reenviar o e-mail do gift card pro destinatário. Diferente das
// reservas (que já tinham o botão "Reenviar confirmação"), o gift card
// não tinha NENHUM jeito de reenviar — se o envio falhava na compra
// (cota do Resend estourada, domínio fora do ar), o destinatário ficava
// sem o código e a admin só conseguia resolver copiando na mão.
//
// COMO SABE QUEM ESTÁ PENDENTE
// ----------------------------
// `gift_cards.email_sent_at` só é gravado quando o envio dá certo
// (ver stripe-webhook / mp-webhook / check-mp-payment-status). NULL =
// o destinatário nunca recebeu.
//
// DUAS TRAVAS (ambas puláveis com force:true)
//   1. metadata.source = 'manual_admin' → gift card criado na mão pelo
//      painel. Nunca teve e-mail automático, e a admin normalmente já
//      entregou o código por fora. Reenviar assustaria o cliente.
//   2. email_sent_at já preenchido → já chegou. Não manda duplicado.
//
// SEGURANÇA: só ADMIN (mesmo padrão de admin-send-whatsapp-test).
// Deploy COM verify_jwt (default).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { explainEmailFailure, giftCardEmailHtml, sendEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null;

const COLS = "id, code, status, destinatario_email, destinatario_nome, " +
  "comprador_nome, valor_inicial_centavos, mensagem, expires_at, " +
  "email_sent_at, metadata, created_at";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface GiftCardRow {
  id: string;
  code: string;
  status: string;
  destinatario_email: string | null;
  destinatario_nome: string | null;
  comprador_nome: string | null;
  valor_inicial_centavos: number | null;
  mensagem: string | null;
  expires_at: string | null;
  email_sent_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

function isManual(gc: GiftCardRow): boolean {
  return (gc.metadata ?? {}).source === "manual_admin";
}

// Envia um gift card. Devolve o resultado já em português.
async function enviarUm(
  gc: GiftCardRow,
  force: boolean,
): Promise<Record<string, unknown>> {
  const base = {
    id: gc.id,
    code: gc.code,
    to: gc.destinatario_email,
    nome: gc.destinatario_nome,
  };

  if (!gc.destinatario_email) {
    return { ...base, sent: false, skipped: true, reason: "sem_destinatario",
      message: "Gift card sem e-mail de destinatário cadastrado." };
  }
  if (gc.status !== "active" && !force) {
    return { ...base, sent: false, skipped: true, reason: "nao_ativo",
      message: 'Gift card com status "' + gc.status + '" — só reenvio os ativos.' };
  }
  if (gc.email_sent_at && !force) {
    return { ...base, sent: false, skipped: true, reason: "ja_enviado",
      message: "O e-mail já foi entregue antes. Use force:true pra mandar de novo." };
  }
  if (isManual(gc) && !force) {
    return { ...base, sent: false, skipped: true, reason: "manual_admin",
      message: "Criado à mão no painel — nunca teve e-mail automático. " +
        "Use force:true se quiser mandar mesmo assim." };
  }

  const expLabel = gc.expires_at
    ? new Date(gc.expires_at).toLocaleDateString("pt-BR")
    : null;

  const result = await sendEmail({
    to: gc.destinatario_email,
    subject: "Você recebeu um gift card da Elarah ✨",
    html: giftCardEmailHtml({
      recipientName: gc.destinatario_nome,
      buyerName: gc.comprador_nome,
      code: gc.code,
      valorCentavos: Number(gc.valor_inicial_centavos) || 0,
      message: gc.mensagem,
      expiresAt: expLabel,
    }),
  });

  if (!result.ok) {
    const message = explainEmailFailure(result);
    console.error("[Elarah resend-gift-card] envio falhou",
      "gift_card=" + gc.id, "to=" + gc.destinatario_email, "motivo=" + message);
    return { ...base, sent: false, skipped: false, reason: "email_failed", message };
  }

  // Marca como entregue — assim ele some da lista de pendentes e um
  // segundo clique não duplica o e-mail.
  const { error: upErr } = await admin!
    .from("gift_cards")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", gc.id);
  if (upErr) {
    console.error("[Elarah resend-gift-card] enviado mas email_sent_at não gravou",
      "gift_card=" + gc.id, upErr.message);
  }

  console.info("[Elarah resend-gift-card] ENVIADO",
    "gift_card=" + gc.id, "to=" + gc.destinatario_email);
  return { ...base, sent: true, skipped: false, message: "Enviado." };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!admin) return json({ ok: false, error: "server_misconfigured" }, 500);

  // ===== Autoriza: precisa ser admin =====
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ ok: false, error: "missing_token", message: "Faça login como admin." }, 401);
  }
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller?.id) {
    return json({ ok: false, error: "invalid_token",
      message: "Sessão expirada. Faça login de novo." }, 401);
  }
  const { data: prof, error: profErr } = await admin
    .from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (profErr) return json({ ok: false, error: "authz_check_failed" }, 500);
  if (!prof || prof.role !== "admin") {
    return json({ ok: false, error: "forbidden", message: "Só admin pode usar isto." }, 403);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const force = payload.force === true;
  const dryRun = payload.dry_run === true;

  // ===== Modo lote: todos os pendentes =====
  if (payload.all === true) {
    let q = admin.from("gift_cards").select(COLS).eq("status", "active");
    if (!force) q = q.is("email_sent_at", null);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) {
      return json({ ok: false, error: "db_error", message: error.message }, 500);
    }
    const todos = (data ?? []) as GiftCardRow[];
    // Sem force, os manuais nem entram na fila — não são pendências reais.
    const fila = force ? todos : todos.filter((gc) => !isManual(gc));

    if (dryRun) {
      return json({
        ok: true, dry_run: true, total: fila.length,
        message: fila.length
          ? "Estes seriam enviados. Rode de novo sem dry_run pra enviar."
          : "Nenhum gift card pendente. Está tudo entregue.",
        gift_cards: fila.map((gc) => ({
          id: gc.id, code: gc.code, to: gc.destinatario_email,
          nome: gc.destinatario_nome,
          valor_reais: (Number(gc.valor_inicial_centavos) || 0) / 100,
          criado_em: gc.created_at,
        })),
        ignorados_manuais: force ? 0 : todos.length - fila.length,
      });
    }

    const resultados: Array<Record<string, unknown>> = [];
    for (const gc of fila) resultados.push(await enviarUm(gc, force));
    const enviados = resultados.filter((r) => r.sent).length;
    const falhas = resultados.filter((r) => !r.sent && !r.skipped).length;
    return json({
      ok: true, total: fila.length, enviados, falhas,
      pulados: resultados.filter((r) => r.skipped).length,
      ignorados_manuais: force ? 0 : todos.length - fila.length,
      message: enviados + " enviado(s), " + falhas + " falha(s).",
      resultados,
    });
  }

  // ===== Modo unitário: por id ou por código =====
  const giftCardId = String(payload.gift_card_id ?? "").trim();
  const code = String(payload.code ?? "").trim().toUpperCase();
  if (!giftCardId && !code) {
    return json({ ok: false, error: "missing_target",
      message: 'Informe gift_card_id, code, ou all:true.' }, 400);
  }

  let q = admin.from("gift_cards").select(COLS);
  q = giftCardId ? q.eq("id", giftCardId) : q.eq("code", code);
  const { data, error } = await q.maybeSingle();
  if (error) return json({ ok: false, error: "db_error", message: error.message }, 500);
  if (!data) {
    return json({ ok: false, error: "gift_card_not_found",
      message: "Gift card não encontrado." }, 404);
  }

  const r = await enviarUm(data as GiftCardRow, force);
  if (!r.sent) {
    return json({ ok: false, ...r }, r.reason === "email_failed" ? 502 : 409);
  }
  return json({ ok: true, ...r });
});
