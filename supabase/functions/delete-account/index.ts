// =============================================================
// ELARAH — delete-account Edge Function
// -------------------------------------------------------------
// POST /functions/v1/delete-account
//
// Exclui PERMANENTEMENTE a conta do usuário autenticado e seus
// dados pessoais — exigência da Apple (App Store Review Guideline
// 5.1.1) e da LGPD (direito à eliminação, art. 18, VI).
//
// Autenticação: o frontend envia o ACCESS TOKEN do próprio usuário
// no header Authorization (Bearer <access_token>). A função lê o
// usuário desse token e só apaga a conta DELE — nunca de outro.
//
// O que faz, em ordem:
//   1. Identifica o usuário pelo token (auth.getUser).
//   2. Anonimiza registros financeiros que a Elarah precisa manter
//      por obrigação fiscal/contábil (bookings, gift_cards) —
//      remove nome/e-mail/telefone/CPF, mantém o registro da venda.
//      (LGPD permite reter dado necessário a obrigação legal, desde
//      que anonimizado.)
//   3. Apaga dados puramente pessoais (perfil, interesses/favoritos).
//   4. Apaga o usuário do Auth (auth.admin.deleteUser) — o login
//      deixa de existir de vez.
//
// Cada passo é best-effort e isolado: se uma tabela não existir ou
// um passo falhar, seguimos — o essencial (apagar o login) sempre
// tenta rodar. Retornamos o que foi feito pra auditoria.
//
// Variáveis de ambiente:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY   (pra validar o token do usuário)
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Cliente admin (service role) — pode apagar usuário e ignorar RLS.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[delete-account] env ausente");
    return json({ error: "server_misconfigured" }, 500);
  }

  // ===== 1. Identifica o usuário pelo token dele =====
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "missing_token", message: "Faça login novamente." }, 401);

  // Valida o token criando um cliente COM ele e perguntando quem é.
  const userClient = createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: "Bearer " + token } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user?.id) {
    console.warn("[delete-account] token inválido", userErr?.message);
    return json({ error: "invalid_token", message: "Sessão expirada. Faça login novamente." }, 401);
  }
  const uid = user.id;
  const email = user.email ?? null;
  console.info("[delete-account] iniciando exclusão", "uid=" + uid);

  const done: Record<string, unknown> = {};

  // ===== 2. Anonimiza registros financeiros (mantém a venda) =====
  try {
    const { error, count } = await admin
      .from("bookings")
      .update({
        email: "conta-excluida@elarah.com.br",
        nome: "Cliente removido",
        telefone: null,
        user_id: null,
      }, { count: "exact" })
      .eq("user_id", uid);
    if (error) console.warn("[delete-account] anonimizar bookings falhou", error.message);
    else done.bookings_anonimizadas = count ?? 0;
  } catch (e) {
    console.warn("[delete-account] bookings exceção", String(e));
  }

  // Limpa CPF/telefone que possam estar no metadata das bookings.
  try {
    const { data: rows } = await admin
      .from("bookings")
      .select("id, metadata")
      .eq("email", "conta-excluida@elarah.com.br")
      .limit(1000);
    for (const r of rows ?? []) {
      const md = (r as { metadata?: Record<string, unknown> }).metadata;
      if (md && (md.cpf || md.telefone_digits)) {
        const clean = { ...md };
        delete clean.cpf;
        delete clean.telefone_digits;
        await admin.from("bookings").update({ metadata: clean }).eq("id", (r as { id: string }).id);
      }
    }
  } catch (e) {
    console.warn("[delete-account] limpar metadata bookings exceção", String(e));
  }

  // Gift cards comprados pelo usuário — desvincula o comprador.
  try {
    const { error, count } = await admin
      .from("gift_cards")
      .update({
        comprador_user_id: null,
        comprador_email: null,
        comprador_nome: null,
      }, { count: "exact" })
      .eq("comprador_user_id", uid);
    if (error) console.warn("[delete-account] anonimizar gift_cards falhou", error.message);
    else done.gift_cards_desvinculados = count ?? 0;
  } catch (e) {
    console.warn("[delete-account] gift_cards exceção", String(e));
  }

  // ===== 3. Apaga dados puramente pessoais =====
  // Interesses/favoritos.
  try {
    const { error } = await admin.from("interesses").delete().eq("user_id", uid);
    if (!error) done.interesses_removidos = true;
  } catch { /* tabela pode não existir */ }

  // Perfil (nome, telefone, preferências).
  try {
    const { error } = await admin.from("profiles").delete().eq("id", uid);
    if (error) console.warn("[delete-account] delete profile falhou", error.message);
    else done.profile_removido = true;
  } catch (e) {
    console.warn("[delete-account] profile exceção", String(e));
  }

  // ===== 4. Apaga o usuário do Auth (o login some de vez) =====
  let authDeleted = false;
  try {
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) {
      console.error("[delete-account] FALHA ao apagar usuário do Auth", error.message);
      return json(
        {
          error: "auth_delete_failed",
          message:
            "Não foi possível concluir a exclusão agora. Seus dados pessoais foram removidos; " +
            "tente novamente em instantes ou fale com a gente pelo WhatsApp.",
          detail: error.message,
          partial: done,
        },
        500,
      );
    }
    authDeleted = true;
  } catch (e) {
    console.error("[delete-account] deleteUser exceção", String(e));
    return json({ error: "auth_delete_exception", message: "Erro ao excluir a conta.", partial: done }, 500);
  }

  console.info(
    "[delete-account] conta excluída com sucesso",
    "uid=" + uid,
    "email=" + (email ?? "?"),
    "resumo=" + JSON.stringify(done),
  );

  return json({ ok: true, deleted: true, summary: { ...done, auth_user_removido: authDeleted } });
});
