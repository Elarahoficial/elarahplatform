// =============================================================
// ELARAH — send-password-recovery Edge Function
// -------------------------------------------------------------
// POST /functions/v1/send-password-recovery
//   body: { email: string, redirectTo?: string }
//
// PROBLEMA QUE RESOLVE
// --------------------
// O front usava supabase.auth.resetPasswordForEmail(), que dispara
// o e-mail de recuperação pelo serviço NATIVO do Supabase Auth. Esse
// serviço tem rate limit agressivo (poucos e-mails/hora no projeto
// inteiro, na prática só entrega confiável pra e-mails da equipe) e
// silenciosamente não entregava pra clientes reais. Cliente pedia
// "esqueci minha senha" e o e-mail nunca chegava.
//
// Todo o resto dos e-mails transacionais da Elarah (confirmação de
// reserva, gift card, aviso de venda) já sai pelo Resend e funciona.
// Esta função coloca a recuperação de senha no MESMO caminho:
//   1. Gera o link de recuperação server-side com a service role
//      (auth.admin.generateLink type=recovery). Isso NÃO dispara o
//      e-mail do Supabase — só devolve o action_link.
//   2. Manda esse link pro cliente via Resend (_shared/email.ts).
//
// SEGURANÇA
// ---------
//   - Resposta SEMPRE genérica ({ ok: true }) mesmo quando o e-mail
//     não existe, pra não vazar quais e-mails têm conta (enumeração).
//   - redirectTo é validado contra a allowlist de domínios da Elarah
//     pra evitar open-redirect / phishing. Fora da allowlist → usa o
//     default (https://elarah.com.br/reset-password.html).
//   - Throttle best-effort por e-mail (memória do instance) pra
//     reduzir e-mail bombing.
//
// Variáveis de ambiente:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY            (herdado do _shared/email.ts)
//   ELARAH_FROM_EMAIL         (opcional)
//
// Deploy: --no-verify-jwt (endpoint público, como um "esqueci senha").
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { passwordRecoveryEmailHtml, sendEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Pra onde o link de recuperação leva depois de validado. O front
// pode pedir um redirectTo próprio, mas só aceitamos hosts da Elarah.
const DEFAULT_REDIRECT = "https://elarah.com.br/reset-password.html";
const ALLOWED_HOSTS = ["elarah.com.br", "www.elarah.com.br"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Valida o redirectTo: precisa ser https e apontar pra um host da
// Elarah. Qualquer coisa fora disso vira o default — nunca confiamos
// num redirect arbitrário vindo do cliente (open-redirect/phishing).
function safeRedirect(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return DEFAULT_REDIRECT;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return DEFAULT_REDIRECT;
    if (!ALLOWED_HOSTS.includes(u.hostname)) return DEFAULT_REDIRECT;
    return u.toString();
  } catch {
    return DEFAULT_REDIRECT;
  }
}

// Throttle best-effort por e-mail. Edge Functions são efêmeras, então
// isto só protege dentro de um mesmo instance — é um freio, não uma
// garantia. Suficiente pra cortar um clique repetido / abuso trivial.
const lastSent = new Map<string, number>();
const THROTTLE_MS = 30_000;

// Detecta o erro do generateLink pra e-mail inexistente. Nesses casos
// respondemos ok:true genérico (não vaza existência da conta).
function isUserNotFound(msg: string): boolean {
  const m = (msg || "").toLowerCase();
  return m.includes("not found") || m.includes("no user") ||
    m.includes("user not found") || m.includes("does not exist");
}

const admin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!admin) {
    console.error("[send-password-recovery] env ausente (SUPABASE_URL/SERVICE_ROLE)");
    return json({ error: "server_misconfigured" }, 500);
  }

  // ---- Lê e valida o e-mail ----
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  // Validação leve — só pra descartar lixo óbvio. A resposta é
  // genérica de qualquer forma, então nem precisa ser rígida.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Não vaza nada: responde ok genérico.
    return json({ ok: true });
  }

  const redirectTo = safeRedirect(body.redirectTo);

  // ---- Throttle best-effort ----
  const now = Date.now();
  const prev = lastSent.get(email) ?? 0;
  if (now - prev < THROTTLE_MS) {
    console.info("[send-password-recovery] throttle — ignorando reenvio rápido para", email);
    return json({ ok: true });
  }
  lastSent.set(email, now);

  // ---- Gera o link de recuperação (service role, NÃO dispara e-mail Supabase) ----
  let actionLink = "";
  let nome: string | null = null;
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      // E-mail sem conta: resposta genérica (não vaza existência).
      if (isUserNotFound(error.message)) {
        console.info("[send-password-recovery] e-mail sem conta (resposta genérica):", email);
        return json({ ok: true });
      }
      console.error("[send-password-recovery] generateLink falhou —", error.message);
      // Erro real do servidor — devolve 500 pro front poder cair no
      // fallback nativo (resetPasswordForEmail).
      return json({ error: "generate_link_failed", detail: error.message }, 500);
    }
    const props = (data as { properties?: { action_link?: string; hashed_token?: string } })?.properties ?? {};
    actionLink = props.action_link ?? "";
    // Link BROWSER/DISPOSITIVO-INDEPENDENTE: em vez do action_link (que passa
    // pelo /verify do Supabase e depende de allowlist de redirect + parsing de
    // hash + mesmo navegador), montamos um link direto pra reset-password.html
    // com o token_hash. A página chama verifyOtp() e valida o token na hora —
    // funciona mesmo quando o pedido saiu do app e o link abre no Safari.
    const hashedToken = props.hashed_token ?? "";
    if (hashedToken) {
      const sep = redirectTo.includes("?") ? "&" : "?";
      actionLink = `${redirectTo}${sep}token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
    }
    const u = (data as { user?: { user_metadata?: Record<string, unknown> } })?.user;
    const meta = u?.user_metadata ?? {};
    nome = (meta.nome as string) || (meta.full_name as string) || (meta.name as string) || null;
  } catch (e) {
    console.error("[send-password-recovery] generateLink exceção —", String(e));
    return json({ error: "generate_link_exception" }, 500);
  }

  if (!actionLink) {
    console.error("[send-password-recovery] generateLink sem link para", email);
    return json({ error: "no_action_link" }, 500);
  }

  // ---- Envia o link via Resend (mesmo caminho do resto dos e-mails) ----
  const result = await sendEmail({
    to: email,
    subject: "Redefinir sua senha — Elarah",
    html: passwordRecoveryEmailHtml({ nome, actionLink }),
  });

  if (!result.ok) {
    console.error(
      "[send-password-recovery] FALHA ao enviar e-mail via Resend —",
      "to=" + email,
      "skipped=" + (result.skipped ? "true" : "false"),
      "error=" + (result.error ?? "?"),
    );
    // Deixa o front cair no fallback nativo.
    return json({ error: "email_send_failed", skipped: !!result.skipped }, 502);
  }

  console.info(
    "[send-password-recovery] link de recuperação enviado ✓",
    "to=" + email,
    "resend_id=" + (result.id ?? "?"),
    "fallbackFrom=" + (result.usedFallbackFrom ? "true" : "false"),
  );
  return json({ ok: true });
});
