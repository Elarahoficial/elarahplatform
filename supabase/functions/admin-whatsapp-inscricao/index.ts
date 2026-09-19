// =============================================================
// ELARAH — admin-whatsapp-inscricao Edge Function
// -------------------------------------------------------------
// Responde e resolve UMA pergunta: "a conta do WhatsApp está entregando as
// mensagens recebidas pro nosso app?"
//
// O PROBLEMA QUE ISSO RESOLVE
//   Configurar o webhook na Meta são DUAS coisas, e a interface não deixa
//   isso claro:
//
//     1. O APP tem uma URL de callback e assina o campo `messages`.
//        (feito no painel de Apps → Webhooks)
//     2. A CONTA DO WHATSAPP (WABA) precisa estar INSCRITA nesse app.
//
//   Faltando a 2, acontece exatamente o que aconteceu aqui: o teste do
//   painel da Meta chega na função (porque ele fala direto com a URL), mas
//   mensagem de verdade não chega nunca, e nenhum erro aparece em lugar
//   nenhum. Silêncio total.
//
//   Isso é `GET/POST /{WABA_ID}/subscribed_apps` na Graph API — não tem
//   botão pra isso em todo layout do painel.
//
// GET  → diagnóstico: quais apps estão inscritos nesta conta (não muda nada)
// POST → inscreve ESTE app na conta (idempotente: rodar de novo não quebra)
//
// Auth: JWT de admin (ou CRON_SECRET / service role).
// Env: META_WHATSAPP_TOKEN, META_WABA_ID.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";

const META_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN") ?? "";
const META_WABA_ID = Deno.env.get("META_WABA_ID") ?? "";
const GRAPH_BASE = (Deno.env.get("META_GRAPH_BASE_URL") ?? "").trim().replace(/\/+$/, "") ||
  "https://graph.facebook.com";
const GRAPH_VERSION = (Deno.env.get("META_GRAPH_VERSION") ?? "").trim() || "v21.0";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: admin logada, ou cron/service role.
  const rawAuth = req.headers.get("Authorization") ?? "";
  const tk = rawAuth.replace(/^Bearer\s+/i, "").trim();
  const isCron = (!!CRON_SECRET && tk === CRON_SECRET) || (!!SERVICE_ROLE && tk === SERVICE_ROLE);
  if (!isCron && !(await authorizeAdmin(rawAuth))) {
    return json({ ok: false, error: "nao_autorizado" }, 401);
  }

  if (!META_TOKEN) {
    return json({
      ok: false,
      error: "falta_token",
      detalhe: "Cadastre META_WHATSAPP_TOKEN nos Secrets do Supabase.",
    }, 400);
  }
  if (!META_WABA_ID) {
    return json({
      ok: false,
      error: "falta_waba_id",
      detalhe: "Cadastre META_WABA_ID nos Secrets do Supabase. É o número que aparece " +
        "como asset_id na URL do Gerenciador do WhatsApp.",
    }, 400);
  }

  const url = `${GRAPH_BASE}/${GRAPH_VERSION}/${META_WABA_ID}/subscribed_apps`;
  const inscrever = req.method === "POST";

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: inscrever ? "POST" : "GET",
      headers: { Authorization: `Bearer ${META_TOKEN}` },
    });
  } catch (e) {
    return json({ ok: false, error: "sem_resposta_da_meta", detalhe: String(e) }, 502);
  }

  const texto = await resposta.text();
  // deno-lint-ignore no-explicit-any
  let corpo: any = null;
  try {
    corpo = JSON.parse(texto);
  } catch (_e) {
    corpo = { raw: texto.slice(0, 500) };
  }

  if (!resposta.ok) {
    // O erro da Meta aqui costuma ser específico e útil: token sem a
    // permissão whatsapp_business_management, WABA_ID errado, app sem
    // acesso à conta. Devolve como veio, sem mascarar.
    return json({
      ok: false,
      error: "meta_recusou",
      status: resposta.status,
      meta: corpo?.error ?? corpo,
      acao: inscrever ? "inscrever" : "consultar",
    }, 400);
  }

  if (inscrever) {
    return json({
      ok: true,
      acao: "inscrever",
      resultado: corpo,
      proximo_passo: "Mande uma mensagem do seu celular pro número da Elarah e confira " +
        "whatsapp_mensagens. Se aparecer, acabou.",
    });
  }

  const apps = Array.isArray(corpo?.data) ? corpo.data : [];
  return json({
    ok: true,
    acao: "consultar",
    waba_id: META_WABA_ID,
    apps_inscritos: apps,
    inscritos: apps.length,
    diagnostico: apps.length
      ? "A conta JÁ entrega pra pelo menos um app. Confira se o app listado é o " +
        "mesmo onde você configurou a URL do webhook — se for outro, as mensagens " +
        "estão indo pra ele."
      : "NENHUM app inscrito: é por isso que mensagem de verdade não chega. " +
        "Chame esta mesma função com POST pra inscrever.",
  });
});
