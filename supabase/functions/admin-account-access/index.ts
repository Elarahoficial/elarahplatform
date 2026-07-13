// =============================================================
// ELARAH — admin-account-access Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-account-access
//   body: { email: string }
//
// PARA QUE SERVE
// --------------
// Ferramenta de SUPORTE pra admin destravar o acesso de um cliente
// na hora, SEM depender de nenhum e-mail chegar nele. Resolve o caso
// clássico: cliente tem conta, não lembra a senha, o e-mail de
// recuperação/confirmação não chega (ou ela não quer esperar), e a
// gente não pode perder a venda.
//
// O que faz, dado um e-mail:
//   1. Acha o usuário no Auth.
//   2. Define uma SENHA TEMPORÁRIA nova e CONFIRMA o e-mail
//      (email_confirm=true) — isso também remove a trava de
//      "Email not confirmed" no login.
//   3. Gera também um LINK de acesso direto (recovery) como alternativa.
//   4. Devolve pra admin a senha temporária + o link, pra ela mandar
//      pro cliente por WhatsApp. Cliente entra direto, sem hoops.
//
// SEGURANÇA — crítico, porque isto troca a senha de terceiros:
//   - Só ADMIN. O caller precisa mandar o próprio access token
//     (Authorization: Bearer). Validamos o token, pegamos o usuário e
//     conferimos profiles.role === 'admin'. Qualquer outra coisa → 403.
//   - Deploy COM verify_jwt (default) — o Supabase já barra quem não
//     tem JWT válido antes de rodar; a checagem de role é a 2ª camada.
//
// Variáveis de ambiente:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY   (pra validar o token do caller)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("ANON_KEY") ??
  "";

const DEFAULT_REDIRECT = "https://elarah.com.br/reset-password.html";
const ALLOWED_HOSTS = ["elarah.com.br", "www.elarah.com.br"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

// Senha temporária fácil de ditar por WhatsApp: Elarah-XXXXXX
// (sem caracteres ambíguos 0/O/1/I/l). O cliente troca depois se quiser.
const TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateTempPassword(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += TEMP_ALPHABET[bytes[i] % TEMP_ALPHABET.length];
  return "Elarah-" + out;
}

function isUserNotFound(msg: string): boolean {
  const m = (msg || "").toLowerCase();
  return m.includes("not found") || m.includes("no user") || m.includes("does not exist");
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
    console.error("[admin-account-access] env ausente (SUPABASE_URL/SERVICE_ROLE)");
    return json({ error: "server_misconfigured" }, 500);
  }

  // ===== 1. Autoriza: precisa ser admin =====
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "missing_token", message: "Faça login como admin." }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller?.id) {
    return json({ error: "invalid_token", message: "Sessão expirada. Faça login de novo." }, 401);
  }

  // Confere role=admin no profile do caller (2ª camada além do verify_jwt).
  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();
  if (profErr) {
    console.error("[admin-account-access] erro ao ler profile do caller", profErr.message);
    return json({ error: "authz_check_failed" }, 500);
  }
  if (!prof || prof.role !== "admin") {
    console.warn("[admin-account-access] acesso negado — caller não é admin", caller.id);
    return json({ error: "forbidden", message: "Só admin pode usar isto." }, 403);
  }

  // ===== 2. Lê o e-mail alvo =====
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "invalid_email", message: "Informe um e-mail válido." }, 400);
  }
  const redirectTo = safeRedirect(body.redirectTo);

  // ===== 3. Acha o usuário e gera o link de acesso (recovery) =====
  // generateLink já resolve o usuário pelo e-mail E devolve o link.
  let userId = "";
  let userName: string | null = null;
  let recoveryLink = "";
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      if (isUserNotFound(error.message)) {
        // E-mail sem conta — a admin precisa saber pra orientar o cadastro.
        console.info("[admin-account-access] e-mail sem conta:", email);
        return json({ ok: true, found: false, email });
      }
      console.error("[admin-account-access] generateLink falhou —", error.message);
      return json({ error: "generate_link_failed", detail: error.message }, 500);
    }
    const u = (data as { user?: { id?: string; user_metadata?: Record<string, unknown> } })?.user;
    userId = u?.id ?? "";
    const meta = u?.user_metadata ?? {};
    userName = (meta.nome as string) || (meta.full_name as string) || (meta.name as string) || null;
    recoveryLink = (data as { properties?: { action_link?: string } })?.properties?.action_link ?? "";
  } catch (e) {
    console.error("[admin-account-access] generateLink exceção —", String(e));
    return json({ error: "generate_link_exception" }, 500);
  }

  if (!userId) {
    console.error("[admin-account-access] sem userId para", email);
    return json({ error: "no_user_id" }, 500);
  }

  // ===== 4. Define senha temporária + confirma o e-mail =====
  // email_confirm=true destrava o login de contas nunca confirmadas
  // (a trava "Email not confirmed"), que é justamente o beco sem saída
  // de quem nunca recebeu o e-mail de confirmação.
  const tempPassword = generateTempPassword();
  try {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: tempPassword,
      email_confirm: true,
    });
    if (error) {
      console.error("[admin-account-access] updateUserById falhou —", error.message);
      // Mesmo se a senha falhar, o link de recovery ainda serve — devolve ele.
      return json(
        {
          ok: true,
          found: true,
          email,
          name: userName,
          tempPassword: null,
          recoveryLink,
          warning: "Não consegui definir senha temporária; use o link de acesso.",
        },
      );
    }
  } catch (e) {
    console.error("[admin-account-access] updateUserById exceção —", String(e));
    return json({ ok: true, found: true, email, name: userName, tempPassword: null, recoveryLink }, 200);
  }

  console.info("[admin-account-access] acesso destravado ✓", "email=" + email, "uid=" + userId);
  return json({
    ok: true,
    found: true,
    email,
    name: userName,
    tempPassword,
    recoveryLink,
  });
});
