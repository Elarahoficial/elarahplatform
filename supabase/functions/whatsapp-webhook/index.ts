// =============================================================
// ELARAH — whatsapp-webhook Edge Function
// -------------------------------------------------------------
// GET  /functions/v1/whatsapp-webhook   verificação da Meta (handshake)
// POST /functions/v1/whatsapp-webhook   mensagens recebidas + status de envio
//
// POR QUE ISSO EXISTE
//   Numa conta WhatsApp Cloud API o número sai do app: mensagem que CHEGA
//   é entregue SÓ num webhook. Sem webhook configurado, a Meta descarta —
//   a resposta da cliente não fica guardada em lugar nenhum. Esta função é
//   o outro lado do telefone.
//
// O QUE ELA GRAVA
//   whatsapp_mensagens      o que chega (texto, mídia, resposta)
//   whatsapp_status_envio   o que acontece com o que a gente mandou
//                           (sent → delivered → read, ou failed com o motivo)
//
// SEGURANÇA
//   Toda entrega da Meta vem assinada em X-Hub-Signature-256:
//   sha256=HMAC_SHA256(META_APP_SECRET, corpo cru). A assinatura é conferida
//   ANTES de qualquer parse, sobre os BYTES CRUS — re-serializar o JSON muda
//   o corpo e quebra a conferência. Sem o segredo configurado, a função
//   recusa tudo (fail-closed): é melhor não gravar nada do que aceitar
//   mensagem forjada por qualquer um que descubra a URL.
//
// POR QUE RESPONDE 200 MESMO QUANDO DÁ ERRO POR DENTRO
//   A Meta reenvia o evento enquanto não receber 200, e DESATIVA o webhook
//   depois de muita falha seguida — aí a gente volta a perder mensagem. Então
//   assinatura inválida é 401 (não é a Meta chamando), e qualquer tropeço
//   nosso depois disso é 200 + log. O reenvio é seguro porque wa_message_id
//   é UNIQUE: gravar duas vezes não duplica.
//
// config.toml: verify_jwt=false (a Meta não manda JWT do Supabase).
// Env: META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN,
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// SQL: sql/elarah_whatsapp_inbox.sql
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assinaturaConfere, lerWebhook } from "../_shared/whatsapp_inbox.ts";

const APP_SECRET = (Deno.env.get("META_APP_SECRET") ?? "").trim();
const VERIFY_TOKEN = (Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") ?? "").trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ---------- handler ----------

serve(async (req) => {
  // GET: handshake. A Meta chama uma vez, ao salvar o webhook no painel, e
  // só aceita a URL se a resposta for o hub.challenge em texto puro.
  if (req.method === "GET") {
    const url = new URL(req.url);
    const modo = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const desafio = url.searchParams.get("hub.challenge");
    if (modo === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN && desafio) {
      return new Response(desafio, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    console.warn("[whatsapp-webhook] verificação recusada", { modo, temToken: !!token });
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  // Corpo CRU primeiro: a assinatura é sobre estes bytes.
  const corpoCru = await req.text();
  if (!APP_SECRET) {
    console.error("[whatsapp-webhook] META_APP_SECRET não configurado — recusando (fail-closed)");
    return new Response("not configured", { status: 401 });
  }
  if (!(await assinaturaConfere(corpoCru, req.headers.get("x-hub-signature-256"), APP_SECRET))) {
    console.warn("[whatsapp-webhook] assinatura inválida — ignorado");
    return new Response("invalid signature", { status: 401 });
  }

  // Daqui pra baixo SEMPRE 200: erro nosso não pode fazer a Meta desativar
  // o webhook. O reenvio é seguro (wa_message_id é UNIQUE).
  try {
    // deno-lint-ignore no-explicit-any
    let corpo: any = null;
    try {
      corpo = JSON.parse(corpoCru);
    } catch (_e) {
      console.error("[whatsapp-webhook] corpo não é JSON");
      return new Response("ok", { status: 200 });
    }

    const { mensagens, statuses } = lerWebhook(corpo);

    if (!mensagens.length && !statuses.length) {
      // Evento que não é mensagem nem status (mudança de template, de
      // qualidade do número). Não é erro — só não interessa aqui.
      return new Response("ok", { status: 200 });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("[whatsapp-webhook] Supabase não configurado — mensagem PERDIDA", {
        mensagens: mensagens.length,
        statuses: statuses.length,
      });
      return new Response("ok", { status: 200 });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // ignoreDuplicates: a Meta reenvia o mesmo evento quando demora a
    // receber 200. Sem isso, cada reenvio viraria erro de UNIQUE no log.
    if (mensagens.length) {
      const { error } = await supabase
        .from("whatsapp_mensagens")
        .upsert(mensagens, { onConflict: "wa_message_id", ignoreDuplicates: true });
      if (error) {
        console.error("[whatsapp-webhook] falha ao gravar mensagens", error.message, mensagens.length);
      } else {
        console.info("[whatsapp-webhook] mensagens gravadas", mensagens.length);
      }
    }

    if (statuses.length) {
      const { error } = await supabase
        .from("whatsapp_status_envio")
        .upsert(statuses, { onConflict: "wa_message_id,status", ignoreDuplicates: true });
      if (error) {
        console.error("[whatsapp-webhook] falha ao gravar status", error.message, statuses.length);
      }
    }
  } catch (e) {
    console.error("[whatsapp-webhook] erro inesperado", String(e));
  }

  return new Response("ok", { status: 200 });
});
