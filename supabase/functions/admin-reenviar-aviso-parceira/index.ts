// =============================================================
// ELARAH — admin-reenviar-aviso-parceira Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-reenviar-aviso-parceira
//   { "booking_ids": ["uuid", "uuid", ...] }
//
// Reenvia o aviso da compra pra PARCEIRA pela API oficial da Meta
// (template elarah_aviso_parceira) — o MESMO envio que sai sozinho quando
// a reserva é paga, pelo mesmo portão (sendSupplierBookingNoticeGated).
//
// POR QUE EXISTE
//   Quando o envio automático falha (ex.: template ainda não aprovado), a
//   linha fica em whatsapp_send_log com status='failed' e a chave
//   fornecedor:<booking_id> continua ocupada — nenhuma nova tentativa sai.
//   E o botão "Avisar" do painel só abre o WhatsApp e carimba "avisado" no
//   clique: não prova que a mensagem saiu.
//
// O QUE FAZ, por reserva
//   1. Se já existe envio 'sent' pra ela → NÃO reenvia (duplicate).
//   2. Libera só a linha 'failed' (nunca apaga um envio que saiu).
//   3. Envia pelo portão de sempre (status pago, aguardando_experiencia,
//      WhatsApp da parceira cadastrado, kill switch, rollout).
//   4. Saiu → carimba fornecedor_avisado_at com o horário do envio real.
//
// Auth: JWT de admin (ou CRON_SECRET / service role).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import { sendSupplierBookingNoticeGated } from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

// Um lote por chamada — a Meta aguenta bem mais, mas assim a função não
// estoura o tempo limite e o resultado cabe na tela.
const MAX_POR_CHAMADA = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "metodo_invalido" }, 405);

  const rawAuth = req.headers.get("Authorization") ?? "";
  const tk = rawAuth.replace(/^Bearer\s+/i, "").trim();
  const isCron = (!!CRON_SECRET && tk === CRON_SECRET) || (!!SERVICE_ROLE && tk === SERVICE_ROLE);
  const adminId = isCron ? null : await authorizeAdmin(rawAuth);
  if (!isCron && !adminId) return json({ ok: false, error: "nao_autorizado" }, 401);

  // deno-lint-ignore no-explicit-any
  let corpo: any = null;
  try {
    corpo = await req.json();
  } catch (_e) {
    return json({ ok: false, error: "json_invalido" }, 400);
  }

  const ids = Array.from(
    new Set(
      (Array.isArray(corpo?.booking_ids) ? corpo.booking_ids : [corpo?.booking_id])
        .map((x: unknown) => String(x ?? "").trim())
        .filter((x: string) => UUID_RE.test(x)),
    ),
  ) as string[];
  if (!ids.length) return json({ ok: false, error: "sem_booking_ids" }, 400);
  if (ids.length > MAX_POR_CHAMADA) {
    return json({ ok: false, error: "lote_grande", detalhe: `Máximo ${MAX_POR_CHAMADA} por vez.` }, 400);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json({ ok: false, error: "supabase_nao_configurado" }, 500);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const resultados: Array<Record<string, unknown>> = [];
  for (const id of ids) {
    const chave = "fornecedor:" + id;
    try {
      // 1+2: nunca reenvia o que já saiu; libera só a tentativa que falhou.
      const { data: log } = await supabase
        .from("whatsapp_send_log")
        .select("status")
        .eq("dedupe_key", chave)
        .maybeSingle();
      const anterior = (log as { status?: string } | null)?.status ?? null;
      if (anterior === "sent") {
        resultados.push({ booking_id: id, enviado: false, motivo: "ja_enviado_antes" });
        continue;
      }
      if (anterior) {
        await supabase.from("whatsapp_send_log")
          .delete()
          .eq("dedupe_key", chave)
          .neq("status", "sent");
      }

      const { data: booking } = await supabase
        .from("bookings")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (!booking) {
        resultados.push({ booking_id: id, enviado: false, motivo: "reserva_nao_encontrada" });
        continue;
      }

      // 3: mesmo caminho do envio automático.
      const res = await sendSupplierBookingNoticeGated(supabase, booking);
      if (!res) {
        // null = pulou antes do portão: não paga, sem parceira ou sem
        // WhatsApp cadastrado, ou aviso automático desligado por secret.
        resultados.push({
          booking_id: id,
          enviado: false,
          motivo: "nao_elegivel",
          detalhe: "Reserva não paga, sem parceira, parceira sem WhatsApp cadastrado " +
            "ou WHATSAPP_AVISO_FORNECEDOR=false.",
        });
        continue;
      }

      // 4: carimba com o horário do envio REAL (o do clique no "Avisar" não
      // prova nada).
      if (res.sent) {
        await supabase.from("bookings")
          .update({ fornecedor_avisado_at: new Date().toISOString() })
          .eq("id", id);
      }
      resultados.push({
        booking_id: id,
        enviado: !!res.sent,
        motivo: res.sent ? null : (res.reason ?? "falhou"),
      });
    } catch (e) {
      resultados.push({ booking_id: id, enviado: false, motivo: "excecao", detalhe: String(e) });
    }
  }

  const enviados = resultados.filter((r) => r.enviado).length;
  console.info(
    "[elarah/reenviar-aviso-parceira]",
    "admin=" + (adminId ?? "cron"),
    "pedidos=" + ids.length,
    "enviados=" + enviados,
  );
  return json({ ok: true, enviados, total: ids.length, resultados });
});
