// =============================================================
// ELARAH — admin-whatsapp-responder Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-whatsapp-responder
//   { "telefone": "5511999990000", "texto": "oi, consigo sim!" }
//
// Manda a resposta da Elarah pela API oficial e grava no mesmo lugar de
// onde a tela de Conversas lê. É o que faz a caixa de entrada deixar de ser
// só leitura.
//
// A REGRA DAS 24 HORAS
//   A Meta só entrega TEXTO LIVRE dentro de 24h da última mensagem DA
//   PESSOA. Fora dessa janela, só template aprovado — e a recusa vem com o
//   erro 131047, que sem contexto não diz nada.
//
//   Esta função confere a janela ANTES de tentar, olhando a última
//   mensagem recebida em whatsapp_mensagens, e recusa com uma explicação em
//   português. É melhor a Elarah ler "a janela fechou" do que ver a
//   mensagem sumir sem aviso.
//
// IDEMPOTÊNCIA
//   Diferente das mensagens automáticas, aqui repetir É legítimo: ela pode
//   querer mandar "oi" duas vezes. A chave leva o instante do envio, então
//   cada resposta é única — mas um clique duplo no mesmo segundo ainda cai
//   na mesma chave e não duplica.
//
// Auth: JWT de admin (ou CRON_SECRET / service role).
// Env: META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID,
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import { gatedSendWhatsApp, normalizePhoneBR } from "../_shared/whatsapp.ts";
import { janelaDe24hAberta } from "../_shared/whatsapp_inbox.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

// Limite da Meta pra corpo de mensagem de texto.
const MAX_TEXTO = 4096;

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

  const telefone = normalizePhoneBR(String(corpo?.telefone ?? ""));
  const texto = String(corpo?.texto ?? "").trim();

  if (!telefone) return json({ ok: false, error: "telefone_invalido" }, 400);
  if (!texto) return json({ ok: false, error: "texto_vazio" }, 400);
  if (texto.length > MAX_TEXTO) {
    return json({
      ok: false,
      error: "texto_longo",
      detalhe: `A Meta aceita até ${MAX_TEXTO} caracteres. O seu tem ${texto.length}.`,
    }, 400);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json({ ok: false, error: "supabase_nao_configurado" }, 500);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // ---- A JANELA DE 24H ----
  // Conferida ANTES de tentar. Sem isso a Meta recusa com 131047 e a
  // resposta some sem explicação nenhuma pra quem escreveu.
  let ultimaRecebida: string | null = null;
  try {
    const { data } = await supabase
      .from("whatsapp_mensagens")
      .select("wa_timestamp")
      .eq("telefone", telefone)
      .order("wa_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    ultimaRecebida = (data as { wa_timestamp?: string } | null)?.wa_timestamp ?? null;
  } catch (_e) {
    // Sem leitura, não dá pra afirmar que a janela está aberta.
    ultimaRecebida = null;
  }

  // A conta mora em _shared/whatsapp_inbox.ts, junto com a que a tela usa —
  // duas cópias divergiriam, e o sintoma seria a mensagem sumir sem explicação.
  if (!janelaDe24hAberta(ultimaRecebida)) {
    return json({
      ok: false,
      error: "janela_fechada",
      ultima_recebida_em: ultimaRecebida,
      detalhe: ultimaRecebida
        ? "A última mensagem dela tem mais de 24 horas. Pela regra da Meta, fora dessa " +
          "janela só sai template aprovado — texto livre seria recusado."
        : "Essa pessoa nunca escreveu pra esse número. A Meta só deixa iniciar conversa " +
          "por template aprovado.",
    }, 409);
  }

  // ---- ENVIO ----
  // Passa pelo mesmo portão de sempre: kill switch, ambiente, allowlist e
  // registro. A chave leva o instante, porque repetir uma resposta é
  // legítimo — mas clique duplo no mesmo segundo não duplica.
  const agora = new Date();
  const chave = "resposta:" + telefone + ":" + Math.floor(agora.getTime() / 1000);

  const r = await gatedSendWhatsApp(supabase, {
    kind: "resposta",
    dedupeKey: chave,
    identifierOk: true,
    rawPhone: telefone,
    suppressed: false,
    statusAllowed: true,
    message: texto,
    caption: texto,
    createdBy: adminId,
  });

  if (!r.sent) {
    return json({
      ok: false,
      error: r.reason ?? "nao_enviada",
      detalhe: r.reason === "duplicate"
        ? "Essa mesma resposta já saiu neste segundo."
        : "O envio não passou pelo portão de WhatsApp. Veja os logs da função.",
    }, 400);
  }

  return json({
    ok: true,
    telefone,
    texto,
    enviada_em: agora.toISOString(),
    provider_id: r.providerId ?? null,
  });
});
