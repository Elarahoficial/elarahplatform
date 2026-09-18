// =============================================================
// ELARAH — admin-whatsapp-templates Edge Function
// -------------------------------------------------------------
// Lê os templates APROVADOS direto da conta do WhatsApp na Meta e compara
// com o que o código manda em cada fluxo. Responde, sem print e sem
// adivinhação:
//
//   * o nome exato de cada template aprovado;
//   * quantas variáveis ({{1}}, {{2}}…) cada um tem;
//   * se tem cabeçalho, e de que tipo (imagem? texto?);
//   * se o nome que o código procura EXISTE;
//   * se a quantidade de parâmetros que o código manda BATE com o template.
//
// É o que evita o erro mais chato da Cloud API: template aprovado com 4
// variáveis recebendo 5 parâmetros — a Meta recusa TODOS os envios daquele
// fluxo, e o motivo só aparece no log.
//
// GET/POST /functions/v1/admin-whatsapp-templates
// Auth: JWT de admin (ou CRON_SECRET / service role).
// Só leitura: não envia mensagem nem altera nada na Meta.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import {
  bookingConfirmationTemplateParams,
  byelarahAvisoTemplateParams,
  feedbackTemplateParams,
  metaTemplateName,
  metaTemplateUsaImagem,
  pendingRecoveryTemplateParams,
  postPurchaseInstructionsTemplateParams,
  reminder48hTemplateParams,
  supplierBookingTemplateParams,
} from "../_shared/whatsapp.ts";

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

// Cada fluxo do sistema: que template ele procura e quantos parâmetros manda.
// Os contadores saem dos MESMOS builders usados no envio real — se alguém
// mudar um builder, este diagnóstico acompanha sozinho.
function fluxos() {
  return [
    { kind: "confirmation", oque: "Confirmação de reserva", params: bookingConfirmationTemplateParams({}) },
    { kind: "reminder48", oque: "Lembrete 2 dias antes", params: reminder48hTemplateParams({}) },
    { kind: "feedback", oque: "Pedido de feedback", params: feedbackTemplateParams({}) },
    { kind: "pending", oque: "Pagamento pendente", params: pendingRecoveryTemplateParams({}) },
    { kind: "byelarah_aviso", oque: "Aviso: inscrições abertas (By Elarah)", params: byelarahAvisoTemplateParams({}) },
    { kind: "instrucoes", oque: "Instruções pós-compra", params: postPurchaseInstructionsTemplateParams({}) },
    { kind: "fornecedor", oque: "Aviso da compra pra parceira", params: supplierBookingTemplateParams({}) },
  ];
}

// Quantas variáveis distintas o corpo do template usa: {{1}}, {{2}}…
function contaVariaveis(texto: string): number {
  const achados = new Set<string>();
  for (const m of String(texto ?? "").matchAll(/\{\{\s*(\d+)\s*\}\}/g)) achados.add(m[1]);
  return achados.size;
}

interface Componente {
  type?: string;
  format?: string;
  text?: string;
  buttons?: unknown[];
}
interface TemplateMeta {
  name?: string;
  status?: string;
  category?: string;
  language?: string;
  components?: Componente[];
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

  // ---- Lista os templates da conta ----
  let templates: TemplateMeta[] = [];
  try {
    const url = `${GRAPH_BASE}/${GRAPH_VERSION}/${META_WABA_ID}/message_templates?limit=200`;
    const res = await fetch(url, { headers: { Authorization: "Bearer " + META_TOKEN } });
    const raw = await res.text();
    if (!res.ok) {
      let detalhe = raw.slice(0, 400);
      try {
        const err = JSON.parse(raw)?.error;
        if (err?.code === 190) detalhe = "Token inválido ou expirado — gere um token permanente. " + (err?.message ?? "");
        else if (err?.message) detalhe = err.message;
      } catch { /* corpo não-JSON */ }
      return json({ ok: false, error: "meta_recusou", status: res.status, detalhe }, 502);
    }
    templates = (JSON.parse(raw)?.data ?? []) as TemplateMeta[];
  } catch (e) {
    return json({ ok: false, error: "falha_na_consulta", detalhe: String(e) }, 502);
  }

  // ---- O que existe na conta ----
  const naConta = templates.map((t) => {
    const comps = t.components ?? [];
    const body = comps.find((c) => (c.type ?? "").toUpperCase() === "BODY");
    const header = comps.find((c) => (c.type ?? "").toUpperCase() === "HEADER");
    const botoes = comps.find((c) => (c.type ?? "").toUpperCase() === "BUTTONS");
    return {
      nome: t.name ?? "",
      status: t.status ?? "",
      categoria: t.category ?? "",
      idioma: t.language ?? "",
      variaveis: contaVariaveis(body?.text ?? ""),
      cabecalho: header ? (header.format ?? "TEXT").toUpperCase() : "(nenhum)",
      tem_botoes: !!botoes,
      corpo: (body?.text ?? "").slice(0, 600),
    };
  });

  // ---- Bate com o que o código manda ----
  const porNome = new Map(naConta.map((t) => [t.nome.toLowerCase(), t]));
  const mapeamento = fluxos().map((f) => {
    const nomeProcurado = metaTemplateName(f.kind) ?? "";
    const achado = porNome.get(nomeProcurado.toLowerCase()) ?? null;
    const mandamos = f.params.length;
    const problemas: string[] = [];
    if (!achado) {
      problemas.push("Template não existe na conta com esse nome — crie, ou aponte o secret pro nome certo.");
    } else {
      if ((achado.status ?? "").toUpperCase() !== "APPROVED") {
        problemas.push(`Status "${achado.status}" — só APPROVED envia.`);
      }
      if (achado.variaveis !== mandamos) {
        problemas.push(
          `O template tem ${achado.variaveis} variável(is) e o código manda ${mandamos}. ` +
            "A Meta recusa TODOS os envios desse fluxo enquanto não bater.",
        );
      }
      const usaImagem = metaTemplateUsaImagem(f.kind);
      if (achado.cabecalho === "IMAGE" && !usaImagem) {
        problemas.push("Template tem cabeçalho de IMAGEM mas o secret de imagem está desligado — vai falhar.");
      }
      if (achado.cabecalho !== "IMAGE" && usaImagem) {
        problemas.push("O secret de imagem está ligado mas o template não tem cabeçalho de imagem — vai falhar.");
      }
      if (achado.tem_botoes) {
        problemas.push("Template tem BOTÕES — o código não manda parâmetro de botão; se o botão for dinâmico, falha.");
      }
      if (achado.idioma && achado.idioma !== ((Deno.env.get("META_TEMPLATE_LANG") ?? "pt_BR").trim() || "pt_BR")) {
        problemas.push(`Idioma do template é "${achado.idioma}" e o código manda "pt_BR" — ajuste META_TEMPLATE_LANG.`);
      }
    }
    return {
      fluxo: f.oque,
      kind: f.kind,
      template_procurado: nomeProcurado,
      existe: !!achado,
      status: achado?.status ?? null,
      variaveis_no_template: achado?.variaveis ?? null,
      variaveis_que_o_codigo_manda: mandamos,
      cabecalho: achado?.cabecalho ?? null,
      ok: !!achado && problemas.length === 0,
      problemas,
    };
  });

  const prontos = mapeamento.filter((m) => m.ok).length;
  return json({
    ok: true,
    resumo: `${prontos} de ${mapeamento.length} fluxos prontos pra enviar pela Meta.`,
    mapeamento,
    templates_na_conta: naConta,
  });
});
