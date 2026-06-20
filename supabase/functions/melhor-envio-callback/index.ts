// =============================================================
// ELARAH — melhor-envio-callback Edge Function
// -------------------------------------------------------------
// GET /functions/v1/melhor-envio-callback?code=...&state=...
//
// Endpoint chamado pelo Melhor Envio depois que o admin autoriza o
// app. NÃO recebe JWT — é um redirect do navegador. A autenticidade é
// garantida pelo `state` criado em melhor-envio-connect (CSRF).
//
// IMPORTANTE: esta função precisa de verify_jwt = false (ver
// supabase/config.toml), senão o Supabase responde 401 antes do código
// rodar e a conexão nunca conclui.
//
// Fluxo:
//   1. Valida (consome) o `state`.
//   2. Troca o `code` por access_token + refresh_token.
//   3. Salva os tokens criptografados (saveTokens).
//   4. Redireciona pro return_to (?frete_conectado=1) ou mostra uma
//      página de sucesso simples.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  consumePendingState,
  exchangeCodeForToken,
  saveTokens,
} from "../_shared/melhor_envio.ts";

function htmlPage(title: string, message: string, ok: boolean): Response {
  const color = ok ? "#1a8a4a" : "#c0392b";
  const icon = ok ? "✅" : "⚠️";
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
 body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#faf4ec;color:#2c211a;
   display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;}
 .card{background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.12);
   max-width:440px;padding:36px 32px;text-align:center;}
 .icon{font-size:2.6rem;}
 h1{font-size:1.4rem;margin:14px 0 8px;color:${color};}
 p{color:#6a584a;line-height:1.55;font-size:.96rem;margin:0;}
</style></head><body><div class="card">
 <div class="icon">${icon}</div><h1>${title}</h1><p>${message}</p>
</div></body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function redirect(base: string, params: Record<string, string>): Response {
  let target = base;
  try {
    const url = new URL(base);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    target = url.toString();
  } catch {
    // base inválido — cai pro fallback HTML chamando redirect só com base
  }
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: target, "Cache-Control": "no-store" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  // O Melhor Envio devolveu erro (admin negou, etc.).
  if (errorParam) {
    const consumed = stateParam
      ? await consumePendingState(stateParam)
      : { ok: false, returnTo: null };
    const msg = errorDesc || errorParam;
    if (consumed.returnTo) {
      return redirect(consumed.returnTo, { frete_conectado: "0", frete_erro: msg });
    }
    return htmlPage("Conexão não concluída", msg, false);
  }

  if (!code || !stateParam) {
    return htmlPage(
      "Resposta inválida",
      "O Melhor Envio não enviou os dados esperados (code/state). Tente conectar de novo.",
      false,
    );
  }

  const consumed = await consumePendingState(stateParam);
  if (!consumed.ok) {
    if (consumed.returnTo) {
      return redirect(consumed.returnTo, {
        frete_conectado: "0",
        frete_erro: "Sessão de conexão expirou. Tente novamente.",
      });
    }
    return htmlPage(
      "Sessão expirada",
      "A sessão de conexão expirou ou já foi usada. Volte ao painel e clique em conectar de novo.",
      false,
    );
  }

  try {
    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "");
    const redirectUri = `${supabaseUrl}/functions/v1/melhor-envio-callback`;

    const tok = await exchangeCodeForToken(code, redirectUri);
    await saveTokens(tok);

    console.info("[melhor-envio-callback] conta conectada com sucesso");

    if (consumed.returnTo) {
      return redirect(consumed.returnTo, { frete_conectado: "1" });
    }
    return htmlPage(
      "Frete conectado! 🎉",
      "Sua conta do Melhor Envio foi conectada. A partir de agora a Elarah em " +
        "Casa mostra o preço real dos Correios automaticamente. Pode fechar esta aba.",
      true,
    );
  } catch (err) {
    console.error("[melhor-envio-callback] erro:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (consumed.returnTo) {
      return redirect(consumed.returnTo, { frete_conectado: "0", frete_erro: msg });
    }
    return htmlPage(
      "Algo deu errado",
      "Não foi possível concluir a conexão com o Melhor Envio. Detalhe: " + msg,
      false,
    );
  }
});
