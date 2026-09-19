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
import {
  byelarahAvisoTemplateParams,
  byelarahAvisoWhatsAppText,
  bookingConfirmationTemplateParams,
  bookingConfirmationWhatsAppText,
  feedbackTemplateParams,
  feedbackWhatsAppText,
  isWhatsAppConfigured,
  pendingRecoveryTemplateParams,
  pendingRecoveryWhatsAppText,
  reminder48hTemplateParams,
  reminder48hWhatsAppText,
  sendWhatsAppImage,
  sendWhatsAppTemplate,
  whatsappAllowlistHas,
  metaTemplateUsaImagem,
  whatsappIsOfficial,
  whatsappOfficialReady,
} from "../_shared/whatsapp.ts";

// Foto de exemplo (uma experiência real do site). Em produção, cada mensagem
// usa a foto da experiência que a pessoa comprou. Se a URL falhar, o envio
// cai pro texto puro automaticamente (fallback no sendWhatsAppImage).
const SAMPLE_IMAGE = "https://elarah.com.br/assets/APEROLPINTURA.jpg";

// Dados de exemplo pros testes (não usa reserva real).
const SAMPLE = {
  nome: "Você",
  experienciaNome: "Aula de Cerâmica",
  data: "12/04",
  horario: "15h00 – 18h00",
  endereco: "Rua Capote Valente, 697 – São Paulo",
  bairro: "Pinheiros",
  quantidade: 1,
};
// Exemplo do aviso By Elarah, com os mesmos dados de um evento real.
// Exemplo do aviso By Elarah. O NOME bate com a SAMPLE_IMAGE de propósito:
// no teste a foto é fixa (imagem de exemplo), e citar outro evento no texto
// dava a impressão de que a foto tinha vindo errada. No envio REAL a foto sai
// do cadastro da experiência — cada pessoa recebe a do evento dela.
const SAMPLE_BYELARAH = {
  nome: "Você",
  experienciaNome: "Pintura de Quadro com Cristal & Aperol Spritz",
  data: "24 de abril",
  horarios: ["10h às 13h", "14h às 17h"],
  local: "Rua Nova Orleans, 34 — Brooklin",
  link: "https://elarah.com.br/index.html#by-elarah-pintura-aperol",
};

function sampleMessage(tipo: string): string {
  if (tipo === "byelarah_date" || tipo === "byelarah" || tipo === "byelarah_aviso") {
    return byelarahAvisoWhatsAppText(SAMPLE_BYELARAH);
  }
  switch (tipo) {
    case "reminder":
      return reminder48hWhatsAppText(SAMPLE);
    case "feedback":
      return feedbackWhatsAppText({ ...SAMPLE, link: "https://elarah.com.br/avaliar.html?exemplo=1" });
    case "pending":
      return pendingRecoveryWhatsAppText(SAMPLE);
    case "confirmation":
    default:
      return bookingConfirmationWhatsAppText(SAMPLE);
  }
}

// No provedor OFICIAL o teste vai pelo MESMO template aprovado que o cliente
// recebe — é o único jeito de o teste ser fiel (e de chegar fora da janela de
// 24h). Texto livre digitado no painel só vale no provedor legado.
function sampleTemplate(tipo: string): { kind: string; params: string[] } {
  if (tipo === "byelarah_date" || tipo === "byelarah" || tipo === "byelarah_aviso") {
    return {
      kind: "byelarah_aviso",
      params: byelarahAvisoTemplateParams(SAMPLE_BYELARAH),
    };
  }
  switch (tipo) {
    case "reminder":
      return { kind: "reminder48", params: reminder48hTemplateParams(SAMPLE) };
    case "feedback":
      return {
        kind: "feedback",
        params: feedbackTemplateParams({
          ...SAMPLE,
          link: "https://elarah.com.br/avaliar.html?exemplo=1",
        }),
      };
    case "pending":
      return { kind: "pending", params: pendingRecoveryTemplateParams(SAMPLE) };
    case "confirmation":
    default:
      return { kind: "confirmation", params: bookingConfirmationTemplateParams(SAMPLE) };
  }
}

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
  const tipo = String(payload.tipo ?? "confirmation").trim();
  // Mensagem: ou a de um TIPO (confirmation/reminder/feedback/pending), ou
  // texto livre.
  const mensagem = String(payload.mensagem ?? "").trim() || sampleMessage(tipo);

  // TRAVA DE SEGURANÇA: só envia pra número na allowlist de teste — nunca
  // pra um estranho, mesmo em produção, mesmo com typo. Configure em
  // WHATSAPP_TEST_ALLOWLIST.
  if (!whatsappAllowlistHas(telefone)) {
    return json({
      ok: false,
      error: "fora_da_allowlist",
      message: "Por segurança, o teste só envia pra números em WHATSAPP_TEST_ALLOWLIST. Adicione o seu número lá primeiro.",
    }, 403);
  }

  const testeUsaOficial = whatsappIsOfficial() ||
    (tipo.startsWith("byelarah") && whatsappOfficialReady());
  if (!isWhatsAppConfigured() && !testeUsaOficial) {
    return json({
      ok: false,
      error: whatsappIsOfficial() ? "meta_nao_configurada" : "zapi_nao_configurado",
      message: whatsappIsOfficial()
        ? "Cadastre META_WHATSAPP_TOKEN e META_WHATSAPP_PHONE_NUMBER_ID nos Secrets do Supabase."
        : "Cadastre ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN nos Secrets do Supabase.",
    }, 422);
  }

  // OFICIAL: manda o template aprovado do tipo escolhido (o mesmo que o
  // cliente recebe). LEGADO: manda a foto + o texto (livre ou de exemplo).
  const tpl = sampleTemplate(tipo);
  // O aviso By Elarah sai pela OFICIAL sempre que ela estiver cadastrada —
  // igualzinho ao envio real — mesmo que o provedor padrão siga o legado.
  const ehAviso = tpl.kind === "byelarah_aviso";
  const usaOficial = whatsappIsOfficial() || (ehAviso && whatsappOfficialReady());
  const result = usaOficial
    ? await sendWhatsAppTemplate({
      to: telefone,
      kind: tpl.kind,
      template: {
        params: tpl.params,
        // Igual ao envio real: a foto só vai se o template foi aprovado com
        // cabeçalho de imagem (secret META_TEMPLATE_*_IMAGEM).
        headerImage: metaTemplateUsaImagem(tpl.kind) ? SAMPLE_IMAGE : undefined,
      },
    })
    : await sendWhatsAppImage({ to: telefone, image: SAMPLE_IMAGE, caption: mensagem });
  if (!result.ok) {
    return json({
      ok: false,
      error: result.error ?? "envio_falhou",
      status: result.status ?? null,
      message: whatsappIsOfficial()
        ? "Não consegui enviar. Confira se o template está APROVADO na Meta com esse nome e idioma, e se o número tem WhatsApp."
        : "Não consegui enviar. Confira se a instância do Z-API está conectada (QR code) e se o número tem WhatsApp.",
    }, 502);
  }
  return json({ ok: true, to: telefone });
});
