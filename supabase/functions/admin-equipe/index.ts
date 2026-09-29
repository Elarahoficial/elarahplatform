// =============================================================
// ELARAH — admin-equipe Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-equipe
//   body: { acao: 'listar' | 'criar' | 'senha' | 'acesso' | 'remover', ... }
//
// PARA QUE SERVE
// --------------
// A área "Equipe & acessos" (aba Usuários do admin.html) usa isto pra
// cuidar de quem entra no painel SEM a dona precisar abrir o Supabase:
//   listar   → todo mundo com acesso a algum painel + último login
//   criar    → cria o login (e-mail + senha, já confirmado) e define o
//              acesso. Se o e-mail já tem conta, só atualiza acesso/senha.
//   senha    → define uma senha nova (ou gera uma) pra alguém da equipe
//   acesso   → troca o que a pessoa vê
//   remover  → tira o acesso (a conta continua existindo como cliente)
//
// DOIS TIPOS DE ACESSO
//   tipo 'mh'     → SÓ Elarah Mental Health. role='user' (o painel da
//                   Elarah e os dados dela ficam fechados pelo banco) e
//                   admin_panels = ['mental-health', 'mh:<aba>', ...].
//   tipo 'elarah' → equipe do painel Elarah. role='admin' e
//                   admin_panels = abas do admin.html (pode incluir
//                   'mental-health' pra ver as duas plataformas).
//
// SEGURANÇA
//   - Só quem tem ACESSO TOTAL (role='admin' e admin_panels NULL) usa.
//     Equipe com escopo não consegue criar login nem trocar senha.
//   - Senha nunca fica salva em lugar nenhum além do Auth do Supabase
//     (que guarda só o hash). Ela aparece UMA vez, na resposta, pra dona
//     mandar pra pessoa.
//   - Só mexe em senha/acesso de quem já é da equipe (ou está sendo
//     criado agora) — não vira atalho pra trocar senha de cliente.
//
// Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// Abas do painel Mental Health (admin-mh.js → PANELS).
const MH_ABAS = ["visao", "hoje", "eventos", "acomp", "cronograma", "leads", "ideias", "prosp", "captacao"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Senha fácil de ditar: Elarah-XXXX-XXXX (sem 0/O/1/I/l).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function gerarSenha(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  let s = "";
  for (let i = 0; i < b.length; i++) s += ALFABETO[b[i] % ALFABETO.length];
  return "Elarah-" + s.slice(0, 4) + "-" + s.slice(4);
}

function limparLista(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    const k = String(x ?? "").trim();
    if (k && k.length <= 40 && /^[a-z0-9:_-]+$/i.test(k) && !out.includes(k)) out.push(k);
  }
  return out;
}

// Monta role + admin_panels a partir do tipo escolhido na tela.
function montarAcesso(tipo: string, paineis: unknown): { role: string; admin_panels: string[] } | null {
  const lista = limparLista(paineis);
  if (tipo === "mh") {
    const abas = lista.filter((k) => k.startsWith("mh:") && MH_ABAS.includes(k.slice(3)));
    return { role: "user", admin_panels: ["mental-health", ...abas] };
  }
  if (tipo === "elarah") {
    if (!lista.length) return null;
    return { role: "admin", admin_panels: lista };
  }
  return null;
}

function ehEquipe(p: { role?: string | null; admin_panels?: string[] | null } | null): boolean {
  if (!p) return false;
  if (p.role === "admin") return true;
  return Array.isArray(p.admin_panels) && p.admin_panels.includes("mental-health");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!admin) return json({ error: "server_misconfigured" }, 500);

  // ===== 1. Só a dona (acesso total) =====
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "missing_token", message: "Faça login de novo." }, 401);
  const { data: ud, error: ue } = await admin.auth.getUser(token);
  const caller = ud?.user;
  if (ue || !caller?.id) return json({ error: "invalid_token", message: "Sessão expirada. Faça login de novo." }, 401);

  const { data: me } = await admin.from("profiles").select("role, admin_panels").eq("id", caller.id).maybeSingle();
  if (!me || me.role !== "admin" || me.admin_panels != null) {
    return json({ error: "forbidden", message: "Só quem tem acesso total ao painel pode cuidar da equipe." }, 403);
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const acao = String(body.acao ?? "");

  // ===== LISTAR =====
  if (acao === "listar") {
    const { data: rows, error } = await admin
      .from("profiles")
      .select("id, email, nome, role, admin_panels, created_at")
      .or("role.eq.admin,admin_panels.not.is.null")
      .order("email", { ascending: true })
      .limit(200);
    if (error) return json({ error: "list_failed", message: error.message }, 500);
    const equipe = (rows ?? []).filter(ehEquipe);
    const out = [];
    for (const p of equipe) {
      let ultimo: string | null = null;
      try {
        const { data } = await admin.auth.admin.getUserById(p.id);
        ultimo = data?.user?.last_sign_in_at ?? null;
      } catch { /* sem último login não quebra a lista */ }
      out.push({ ...p, ultimo_login: ultimo, sou_eu: p.id === caller.id });
    }
    return json({ ok: true, equipe: out });
  }

  // ===== CRIAR (ou atualizar quem já tem conta) =====
  if (acao === "criar") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const nome = String(body.nome ?? "").trim().slice(0, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid_email", message: "Informe um e-mail válido." }, 400);
    const acesso = montarAcesso(String(body.tipo ?? ""), body.paineis);
    if (!acesso) return json({ error: "invalid_access", message: "Escolha pelo menos uma aba." }, 400);
    let senha = String(body.senha ?? "").trim();
    if (!senha) senha = gerarSenha();
    if (senha.length < 8) return json({ error: "weak_password", message: "A senha precisa ter pelo menos 8 caracteres." }, 400);

    let userId = "";
    let jaExistia = false;
    const { data: cu, error: ce } = await admin.auth.admin.createUser({
      email, password: senha, email_confirm: true, user_metadata: { nome },
    });
    if (ce) {
      if (!/already|registered|exists/i.test(ce.message)) {
        return json({ error: "create_failed", message: ce.message }, 500);
      }
      // E-mail já tem conta: acha pelo profile e só troca senha + acesso.
      jaExistia = true;
      const { data: pe } = await admin.from("profiles").select("id, role, admin_panels").ilike("email", email).maybeSingle();
      if (!pe?.id) {
        return json({ error: "exists_without_profile", message: "Esse e-mail já tem conta, mas não achei o perfil. Rode a PARTE 2 de sql/elarah_equipe_acessos.sql e tente de novo." }, 409);
      }
      if (pe.role === "admin" && pe.admin_panels == null) {
        return json({ error: "is_owner", message: "Esse e-mail já tem acesso total. Não dá pra limitar por aqui." }, 409);
      }
      userId = pe.id;
      const { error: pe2 } = await admin.auth.admin.updateUserById(userId, { password: senha, email_confirm: true });
      if (pe2) return json({ error: "password_failed", message: pe2.message }, 500);
    } else {
      userId = cu?.user?.id ?? "";
    }
    if (!userId) return json({ error: "no_user_id" }, 500);

    // O perfil pode já existir (trigger de cadastro ou conta antiga).
    const { data: atual } = await admin.from("profiles").select("id, role, admin_panels").eq("id", userId).maybeSingle();
    if (atual && atual.role === "admin" && atual.admin_panels == null) {
      return json({ error: "is_owner", message: "Esse e-mail já tem acesso total. Não dá pra limitar por aqui." }, 409);
    }
    let upErr;
    if (atual) {
      const patch: Record<string, unknown> = { role: acesso.role, admin_panels: acesso.admin_panels };
      if (nome) patch.nome = nome;
      ({ error: upErr } = await admin.from("profiles").update(patch).eq("id", userId));
    } else {
      ({ error: upErr } = await admin.from("profiles").insert({
        id: userId, email, nome, telefone: "", cidade: "", role: acesso.role, admin_panels: acesso.admin_panels,
      }));
    }
    if (upErr) return json({ error: "profile_failed", message: upErr.message }, 500);

    return json({ ok: true, id: userId, email, senha, ja_existia: jaExistia, ...acesso });
  }

  // Daqui pra baixo a ação é sobre alguém que JÁ é da equipe.
  const userId = String(body.user_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "invalid_user" }, 400);
  if (userId === caller.id && acao !== "senha") {
    return json({ error: "self", message: "Você não pode mudar o seu próprio acesso por aqui." }, 400);
  }
  const { data: alvo } = await admin.from("profiles").select("id, email, role, admin_panels").eq("id", userId).maybeSingle();
  if (!ehEquipe(alvo)) return json({ error: "not_team", message: "Essa pessoa não é da equipe." }, 404);

  // ===== NOVA SENHA =====
  if (acao === "senha") {
    let senha = String(body.senha ?? "").trim();
    if (!senha) senha = gerarSenha();
    if (senha.length < 8) return json({ error: "weak_password", message: "A senha precisa ter pelo menos 8 caracteres." }, 400);
    const { error } = await admin.auth.admin.updateUserById(userId, { password: senha, email_confirm: true });
    if (error) return json({ error: "password_failed", message: error.message }, 500);
    return json({ ok: true, email: alvo!.email, senha });
  }

  // ===== TROCAR ACESSO =====
  if (acao === "acesso") {
    const acesso = montarAcesso(String(body.tipo ?? ""), body.paineis);
    if (!acesso) return json({ error: "invalid_access", message: "Escolha pelo menos uma aba." }, 400);
    const { error } = await admin.from("profiles").update(acesso).eq("id", userId);
    if (error) return json({ error: "update_failed", message: error.message }, 500);
    return json({ ok: true, ...acesso });
  }

  // ===== TIRAR ACESSO =====
  if (acao === "remover") {
    const { error } = await admin.from("profiles").update({ role: "user", admin_panels: null }).eq("id", userId);
    if (error) return json({ error: "update_failed", message: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
});
