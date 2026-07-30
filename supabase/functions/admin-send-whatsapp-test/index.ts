// =============================================================
// ELARAH — admin-send-whatsapp-test Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-send-whatsapp-test
//   body: { telefone: string, mensagem?: string }
//
// PARA QUE SERVE
// --------------
// Testar rapidamente se o Z-API está configurado e conectado, SEM
// precisar fazer uma compra real. Manda uma mensagem de WhatsApp pro
// número informado usando o mesmo _shared/whatsapp.ts que as confirmações
// automáticas usam.
//
// SEGURANÇA (igual admin-account-access):
//   - Só ADMIN. Valida o access token do caller e confere
//     profiles.role === 'admin'. Deploy COM verify_jwt (default).
//
// Variáveis de ambiente:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ZAPI_INSTANCE_ID / ZAPI_TOKEN / ZAPI_CLIENT_TOKEN (via _shared/whatsapp.ts)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { isWhatsAppConfigured, sendWhatsAppText } from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  if (!admin) return json({ ok: false, error: "server_misconfigured" }, 500);

  // ===== Autoriza: precisa ser admin =====
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "missing_token", message: "Faça login como admin." }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller?.id) {
    return json({ ok: false, error: "invalid_token", message: "Sessão expirada. Faça login de novo." }, 401);
  }
  const { data: prof, error: profErr } = await admin
    .from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (profErr) return json({ ok: false, error: "authz_check_failed" }, 500);
  if (!prof || prof.role !== "admin") {
    return json({ ok: false, error: "forbidden", message: "Só admin pode usar isto." }, 403);
  }

  // ===== Body =====
  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  const telefone = String(payload.telefone ?? "").trim();
  if (!telefone) return json({ ok: false, error: "missing_telefone" }, 400);
  const mensagem = String(payload.mensagem ?? "").trim() ||
    "✅ Teste da Elarah: se você recebeu isto, o WhatsApp automático está funcionando. 🧡";

  if (!isWhatsAppConfigured()) {
    return json({
      ok: false,
      error: "zapi_nao_configurado",
      message: "Cadastre ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN nos Secrets do Supabase.",
    }, 422);
  }

  const result = await sendWhatsAppText({ to: telefone, message: mensagem });
  if (!result.ok) {
    return json({
      ok: false,
      error: result.error ?? "envio_falhou",
      status: result.status ?? null,
      message: "Não consegui enviar. Confira se a instância do Z-API está conectada (QR code) e se o número tem WhatsApp.",
    }, 502);
  }
  return json({ ok: true, to: telefone });
});
