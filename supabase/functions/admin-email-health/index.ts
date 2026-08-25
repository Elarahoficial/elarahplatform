// =============================================================
// ELARAH — admin-email-health Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-email-health
//   body: { to?: string }   // se vier, manda um e-mail de teste real
//
// PARA QUE SERVE
// --------------
// Responder, em uma tela, a pergunta "por que o e-mail não chega?" —
// inclusive o de confirmação de compra. TODO envio da plataforma
// (confirmação de reserva, gift card, recuperação de senha, aviso de
// venda pra admin, mensagem do fornecedor) passa pelo mesmo
// _shared/email.ts → Resend. Se o Resend está mal configurado, nada sai
// e o erro só aparece no log da Edge Function — o pagamento continua
// passando normal, então ninguém percebe.
//
// O que ele checa, SEM enviar nada:
//   1. RESEND_API_KEY existe nos Secrets?
//   2. A chave é aceita pelo Resend (GET /domains → 401?)
//   3. Existe algum domínio VERIFICADO? (sem isso a conta fica em modo
//      teste e o Resend só entrega no e-mail do dono da conta — causa
//      mais comum do "não chega pro cliente")
//   4. O domínio de ELARAH_FROM_EMAIL é um dos verificados?
//
// E, se `to` vier no body, faz um envio REAL e devolve o erro cru do
// Resend traduzido pra português.
//
// SEGURANÇA (igual admin-send-whatsapp-test):
//   - Só ADMIN. Valida o access token e confere profiles.role === 'admin'.
//   - Deploy COM verify_jwt (default).
//   - Nunca devolve a RESEND_API_KEY: só os 6 primeiros caracteres.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  explainEmailFailure,
  explainResendDiagnostics,
  resendDiagnostics,
  sendEmail,
} from "../_shared/email.ts";

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

function testEmailHtml(): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px 32px;">
    <h1 style="margin:0 0 12px;font-size:20px;">Teste de e-mail da Elarah ✨</h1>
    <p style="margin:0 0 10px;line-height:1.6;">
      Se você está lendo isto, o envio transacional está funcionando: a
      RESEND_API_KEY é válida, o domínio do remetente foi aceito e a
      entrega chegou na caixa.
    </p>
    <p style="margin:0;line-height:1.6;color:#666;font-size:13px;">
      Enviado pelo painel admin (Diagnóstico de e-mail). Nenhum cliente
      recebeu esta mensagem.
    </p>
  </div>
</body></html>`;
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
    return json(
      { ok: false, error: "invalid_token", message: "Sessão expirada. Faça login de novo." },
      401,
    );
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
  const to = String(payload.to ?? "").trim();

  // ===== 1. Diagnóstico de configuração (não envia nada) =====
  const diag = await resendDiagnostics();
  const diagnosis = explainResendDiagnostics(diag);
  console.info(
    "[Elarah email-health] diagnóstico",
    "has_key=" + diag.has_api_key,
    "key_valid=" + diag.key_valid,
    "from=" + diag.from,
    "from_domain_status=" + diag.from_domain_status,
    "dominios=" + JSON.stringify(diag.domains),
  );

  // ===== 2. Envio de teste (opcional) =====
  let test: Record<string, unknown> | null = null;
  if (to) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return json({ ok: false, error: "email_invalido", message: "E-mail de teste inválido." }, 400);
    }
    const result = await sendEmail({
      to,
      subject: "Teste de e-mail da Elarah ✨",
      html: testEmailHtml(),
    });
    test = {
      sent: result.ok,
      to,
      status: result.status ?? null,
      used_fallback_from: !!result.usedFallbackFrom,
      sandbox_restricted: !!result.sandboxRestricted,
      raw_error: result.ok ? null : (result.error ?? null),
      message: explainEmailFailure(result),
    };
    console.info(
      "[Elarah email-health] envio de teste",
      "to=" + to,
      "ok=" + result.ok,
      "status=" + (result.status ?? "?"),
    );
  }

  return json({ ok: true, config: diag, diagnosis, test });
});
