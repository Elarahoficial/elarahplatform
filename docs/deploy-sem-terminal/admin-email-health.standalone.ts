// =============================================================
// ELARAH — admin-email-health (VERSÃO ARQUIVO ÚNICO)
// -------------------------------------------------------------
// Responde "POR QUE O E-MAIL NÃO CHEGA?" — inclusive o de confirmação
// de compra. Um arquivo só, sem imports de ../_shared, pra colar no
// editor de Edge Functions do Supabase e clicar em Deploy. SEM terminal.
//
// Nome da função (tem que ser EXATAMENTE este):
//   admin-email-health
//
// Deixe o "Verify JWT" LIGADO (o padrão) — a função confere por dentro
// se quem chamou é admin (profiles.role = 'admin').
//
// O que ela faz, SEM enviar nada:
//   1. RESEND_API_KEY existe nos Secrets?
//   2. O Resend aceita essa chave? (GET /domains → 401?)
//   3. Existe algum domínio VERIFICADO? Sem isso a conta do Resend fica
//      em MODO TESTE e só entrega no e-mail do dono da conta — é a causa
//      mais comum de "o cliente não recebeu".
//   4. O domínio de ELARAH_FROM_EMAIL é um dos verificados?
//
// E, se você mandar { "to": "seu@email.com" }, faz um envio REAL e
// devolve o erro cru do Resend traduzido pro português.
//
// Secrets usados (o Supabase injeta os dois primeiros sozinho):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (auto)
//   RESEND_API_KEY        → a chave de envio
//   ELARAH_FROM_EMAIL     → remetente (opcional; padrão contato@elarah.com.br)
//   ADMIN_NOTIFY_EMAILS   → quem recebe aviso de venda (opcional)
//
// A chave NUNCA é devolvida inteira — só os 6 primeiros caracteres.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("ELARAH_FROM_EMAIL") ?? "Elarah <contato@elarah.com.br>";
const ADMIN_NOTIFY_EMAILS = Deno.env.get("ADMIN_NOTIFY_EMAILS") ?? "";
const DEFAULT_ADMIN_EMAIL = "contato.elarah@gmail.com";

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

function adminNotifyRecipients(): string[] {
  const raw = ADMIN_NOTIFY_EMAILS.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
  return raw.length ? raw : [DEFAULT_ADMIN_EMAIL];
}

function fromEmailDomain(fromValue: string): string | null {
  const m = /<([^>]+)>/.exec(fromValue);
  const addr = (m ? m[1] : fromValue).trim();
  const at = addr.lastIndexOf("@");
  return at > 0 ? addr.slice(at + 1).toLowerCase() : null;
}

// 403 "You can only send testing emails to your own email address" — a
// trava é do DESTINATÁRIO, não do remetente. Trocar o FROM não resolve.
function isSandboxRecipientRestriction(status: number, body: string): boolean {
  if (status !== 403) return false;
  const b = (body || "").toLowerCase();
  return b.includes("testing emails") ||
    (b.includes("your own email address") && b.includes("only"));
}

interface DomainInfo { name: string; status: string; region?: string | null }
interface Diagnostics {
  has_api_key: boolean;
  api_key_prefix: string | null;
  from: string;
  from_domain: string | null;
  using_default_from: boolean;
  admin_notify: string[];
  key_valid: boolean | null;
  domains: DomainInfo[];
  from_domain_status: string | null;
  error: string | null;
}

async function resendDiagnostics(): Promise<Diagnostics> {
  const fromDomain = fromEmailDomain(FROM);
  const out: Diagnostics = {
    has_api_key: !!RESEND_API_KEY,
    api_key_prefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 6) + "…" : null,
    from: FROM,
    from_domain: fromDomain,
    using_default_from: !Deno.env.get("ELARAH_FROM_EMAIL"),
    admin_notify: adminNotifyRecipients(),
    key_valid: null,
    domains: [],
    from_domain_status: null,
    error: null,
  };
  if (!RESEND_API_KEY) {
    out.error = "RESEND_API_KEY ausente nos Secrets do Supabase.";
    return out;
  }
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    if (!res.ok) {
      out.key_valid = res.status !== 401;
      out.error = "Resend GET /domains respondeu " + res.status + ": " +
        (await res.text().catch(() => "")).slice(0, 300);
      return out;
    }
    out.key_valid = true;
    const body = await res.json().catch(() => ({} as Record<string, unknown>));
    const list = Array.isArray((body as { data?: unknown }).data)
      ? ((body as { data: Array<Record<string, unknown>> }).data)
      : [];
    out.domains = list.map((d) => ({
      name: String(d.name ?? ""),
      status: String(d.status ?? "?"),
      region: (d.region as string | undefined) ?? null,
    }));
    if (fromDomain) {
      const match = out.domains.find((d) => d.name.toLowerCase() === fromDomain);
      out.from_domain_status = match ? match.status : "nao_cadastrado";
    }
  } catch (e) {
    out.error = "Falha de rede ao consultar o Resend: " + String(e);
  }
  return out;
}

function explainResendDiagnostics(d: Diagnostics): string {
  if (!d.has_api_key) {
    return "❌ RESEND_API_KEY não está cadastrada. NENHUM e-mail sai (nem o de " +
      "compra). Cadastre em Supabase → Project Settings → Edge Functions → " +
      "Secrets e redeploy as functions.";
  }
  if (d.key_valid === false) {
    return "❌ A RESEND_API_KEY é inválida ou foi revogada. Gere outra em " +
      "Resend → API Keys e atualize o Secret.";
  }
  if (d.error) return "⚠️ Não consegui checar a conta do Resend: " + d.error;
  const verified = d.domains.filter((x) => x.status === "verified");
  if (verified.length === 0) {
    return "❌ Nenhum domínio VERIFICADO no Resend. Nesse estado a conta fica " +
      "em modo teste e só entrega no e-mail do dono da conta — por isso os " +
      "clientes não recebem nada. Verifique " + (d.from_domain ?? "seu domínio") +
      " em Resend → Domains (adicionar os registros DNS).";
  }
  if (d.from_domain_status === "nao_cadastrado") {
    return "❌ O remetente configurado (" + d.from + ") usa o domínio " +
      d.from_domain + ", que NÃO está cadastrado no Resend. Domínios " +
      "verificados: " + verified.map((x) => x.name).join(", ") +
      ". Ajuste ELARAH_FROM_EMAIL pra um deles.";
  }
  if (d.from_domain_status && d.from_domain_status !== "verified") {
    return "❌ O domínio " + d.from_domain + " está como \"" +
      d.from_domain_status + "\" no Resend (não verificado). Termine a " +
      "verificação DNS em Resend → Domains.";
  }
  return "✅ Configuração do e-mail OK: chave válida e " + d.from_domain +
    " verificado. Se ainda assim não chega, faça o envio de teste abaixo e " +
    "confira a caixa de spam.";
}

function testEmailHtml(): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#faf6f0;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px 32px;">
    <h1 style="margin:0 0 12px;font-size:20px;">Teste de e-mail da Elarah ✨</h1>
    <p style="margin:0 0 10px;line-height:1.6;">
      Se você está lendo isto, o envio transacional está funcionando.
    </p>
    <p style="margin:0;line-height:1.6;color:#666;font-size:13px;">
      Enviado pelo painel admin (Diagnóstico de e-mail). Nenhum cliente recebeu esta mensagem.
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

  let test: Record<string, unknown> | null = null;
  if (to) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return json({ ok: false, error: "email_invalido", message: "E-mail de teste inválido." }, 400);
    }
    if (!RESEND_API_KEY) {
      test = {
        sent: false,
        to,
        status: null,
        used_fallback_from: false,
        sandbox_restricted: false,
        raw_error: null,
        message: "RESEND_API_KEY não está cadastrada nos Secrets do Supabase — " +
          "nenhum e-mail sai enquanto isso.",
      };
    } else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [to],
          subject: "Teste de e-mail da Elarah ✨",
          html: testEmailHtml(),
        }),
      });
      const raw = res.ok ? "" : await res.text().catch(() => "");
      let message: string;
      if (res.ok) message = "E-mail enviado.";
      else if (isSandboxRecipientRestriction(res.status, raw)) {
        message = "A conta do Resend está em MODO TESTE: sem domínio verificado " +
          "ela só entrega no e-mail do dono da conta. Por isso nenhum cliente " +
          "recebe. Verifique seu domínio em Resend → Domains.";
      } else if (res.status === 401) {
        message = "O Resend recusou a RESEND_API_KEY (inválida ou revogada).";
      } else if (res.status === 403) {
        message = "O Resend recusou o remetente (" + FROM + "). Domínio não verificado.";
      } else message = "Resend respondeu " + res.status + ": " + raw.slice(0, 300);

      test = {
        sent: res.ok,
        to,
        status: res.status,
        used_fallback_from: false,
        sandbox_restricted: !res.ok && isSandboxRecipientRestriction(res.status, raw),
        raw_error: res.ok ? null : raw.slice(0, 800),
        message,
      };
    }
    console.info("[Elarah email-health] envio de teste", "to=" + to, "ok=" + test.sent);
  }

  return json({ ok: true, config: diag, diagnosis, test });
});
