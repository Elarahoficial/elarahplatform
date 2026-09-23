// =============================================================
// ELARAH — WhatsApp helper (Cloud API oficial da Meta / Z-API)
// -------------------------------------------------------------
// DOIS PROVEDORES, o mesmo portão de segurança:
//
//   * meta (RECOMENDADO) — WhatsApp Cloud API OFICIAL da Meta. É o canal
//     que aguenta disparo pra lista sem risco de o número ser banido.
//     Mensagem iniciada pela empresa (aviso de data, lembrete, feedback,
//     confirmação) PRECISA de template aprovado — ver metaTemplateName() e
//     docs/whatsapp-oficial-meta.md.
//   * zapi (legado) — automatiza um número comum via QR code. Funciona com
//     texto livre, mas a Meta pode banir o número em disparo frio.
//
// Qual entra em ação: OFICIAL por padrão. O número da Elarah vive na Cloud
// API da Meta, então é por lá que tudo sai. O legado só entra com
// WHATSAPP_PROVIDER=zapi explícito (saída de emergência). Nunca há fallback
// silencioso entre os dois: provedor sem credencial = NÃO ENVIA
// (fail-closed), com erro claro.
//
// Cabeçalho de imagem nos templates: a Meta aprova a ESTRUTURA, e a foto vai
// em cada envio — então cada pessoa recebe a foto do evento dela. Ligado por
// secret (META_TEMPLATE_*_IMAGEM), porque cabeçalho a mais ou a menos em
// relação ao template aprovado derruba TODOS os envios.
//
// Secrets (Supabase → Project Settings → Edge Functions → Secrets):
//   -- oficial (Meta) --
//   META_WHATSAPP_TOKEN            token permanente do app/system user
//   META_WHATSAPP_PHONE_NUMBER_ID  ID do número no WhatsApp Manager
//   META_TEMPLATE_LANG             (opcional) idioma dos templates (pt_BR)
//   META_GRAPH_VERSION             (opcional) versão da Graph API
//   META_TEMPLATE_*                (opcional) nome de cada template aprovado
//   META_TEMPLATE_*_IMAGEM         "true" se o template foi aprovado COM
//                                  cabeçalho de imagem (a foto vai por envio)
//   -- legado (Z-API) --
//   ZAPI_INSTANCE_ID / ZAPI_TOKEN / ZAPI_CLIENT_TOKEN / ZAPI_BASE_URL
//
// Adaptador ÚNICO de disparo de WhatsApp, usado por dois recursos:
//   1) whatsapp-broadcast  — disparo em massa pros interessados.
//   2) confirmação de reserva — mensagem automática na hora da compra
//      (stripe/mp/pagarme webhooks + check-mp-payment-status).
//
// Credencial ausente → o envio retorna { ok:false, skipped:true } com erro
// claro; nada quebra enquanto o WhatsApp não está configurado (mesma
// filosofia do _shared/email.ts).
// =============================================================

// Portão de segurança (lógica pura, fail-closed + idempotência). Ver
// _shared/whatsapp_gate.js. TODO envio automatizado passa por gatedSendWhatsApp.
import { gatedSend } from "./whatsapp_gate.js";

const ZAPI_BASE = Deno.env.get("ZAPI_BASE_URL") ?? "https://api.z-api.io";
const INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "";
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";

// ===== Cloud API oficial da Meta =====
const META_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN") ?? "";
const META_PHONE_ID = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID") ?? "";
// `?? default` não basta: uma secret criada em branco no painel do Supabase
// devolve "" (não undefined) e montaria uma URL quebrada. Trim + || cobre os
// dois casos (ausente e vazia).
const META_GRAPH_BASE =
  (Deno.env.get("META_GRAPH_BASE_URL") ?? "").trim().replace(/\/+$/, "") ||
  "https://graph.facebook.com";
const META_GRAPH_VERSION = (Deno.env.get("META_GRAPH_VERSION") ?? "").trim() || "v21.0";
const META_LANG = (Deno.env.get("META_TEMPLATE_LANG") ?? "pt_BR").trim() || "pt_BR";

// Provedor: OFICIAL DA META por padrão. O número da Elarah vive na Cloud API,
// então é por lá que tudo sai. O caminho legado (QR code) segue no arquivo
// só como saída de emergência, e exige WHATSAPP_PROVIDER=zapi explícito —
// ninguém cai nele por acidente.
const PROVIDER: "meta" | "zapi" = (() => {
  const raw = (Deno.env.get("WHATSAPP_PROVIDER") ?? "").trim().toLowerCase();
  if (raw === "zapi" || raw === "z-api" || raw === "legado") return "zapi";
  return "meta";
})();

// A oficial está pronta pra uso (credenciais presentes)? Independe do
// provedor padrão: é o que permite UM fluxo específico — o aviso pra lista
// de interesse, que é disparo frio e não pode arriscar o número — sair pela
// oficial enquanto o resto continua no canal de sempre.
// FLUXOS DESLIGADOS — lista de kinds que NÃO devem sair desta plataforma.
//
// Existem Edge Functions publicadas fora do repositório (whatsapp-lembrete,
// whatsapp-feedback, whatsapp-pendente, agendadas no pg_cron) que já mandam
// alguns destes avisos pela Meta. Sem esta trava, ligar a plataforma na
// oficial faria a cliente receber tudo em DOBRO.
//
// Ex.: WHATSAPP_FLUXOS_DESLIGADOS="reminder48,feedback,pending"
// Kinds: confirmation, reminder48, feedback, pending, instrucoes,
//        fornecedor, byelarah_aviso.
const FLUXOS_DESLIGADOS = new Set(
  (Deno.env.get("WHATSAPP_FLUXOS_DESLIGADOS") ?? "")
    .split(/[,\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean),
);

export function whatsappFluxoDesligado(kind: string): boolean {
  return FLUXOS_DESLIGADOS.has(String(kind ?? "").trim().toLowerCase());
}

// Aviso automático ao parceiro a cada compra paga. Ligado por padrão; pra
// voltar ao envio manual pelo painel, cadastre WHATSAPP_AVISO_FORNECEDOR=false.
const AVISO_FORNECEDOR_ATIVO =
  (Deno.env.get("WHATSAPP_AVISO_FORNECEDOR") ?? "").trim().toLowerCase() !== "false";

export function whatsappOfficialReady(): boolean {
  return !!(META_TOKEN && META_PHONE_ID);
}

export function whatsappProviderName(): "meta" | "zapi" {
  return PROVIDER;
}
export function whatsappIsOfficial(): boolean {
  return PROVIDER === "meta";
}

// DDDs válidos no Brasil (usado pra NUNCA coagir número estrangeiro/torto
// num BR plausível). DEFINIDO AQUI EM CIMA de propósito: normalizePhoneBR o
// usa, e TEST_ALLOWLIST (abaixo) chama normalizePhoneBR na carga do módulo —
// se VALID_DDDS ficasse depois, dava "Cannot access before initialization"
// (crash no boot de TODA função que importa este arquivo).
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

// ===== TRAVAS DE SEGURANÇA (fail-closed) =====
// KILL SWITCH + fail-closed: SÓ envia se WHATSAPP_SENDING_ENABLED === "true".
// Ausente/qualquer outro valor = DESLIGADO — nada sai até habilitar de
// propósito. (Antes era "ligado a menos que false"; agora é o contrário,
// pra manter tudo desligado até a liberação explícita.)
const SENDING_ENABLED =
  (Deno.env.get("WHATSAPP_SENDING_ENABLED") ?? "").trim().toLowerCase() === "true";
const SENDING_DISABLED = !SENDING_ENABLED;
// DRY-RUN: WHATSAPP_DRY_RUN = "true"/"1" → simula (loga) mas NÃO chama a Z-API.
const DRY_RUN = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_DRY_RUN") ?? "").trim().toLowerCase(),
);
// AMBIENTE: só "production" é produção. Fora disso (staging/preview/local),
// exige allowlist — assim um deploy de teste NUNCA atinge cliente real.
const IS_PROD =
  (Deno.env.get("WHATSAPP_ENV") ?? "").trim().toLowerCase() === "production";
// Allowlist de teste (números que PODEM receber fora de produção), por vírgula.
const TEST_ALLOWLIST = new Set(
  (Deno.env.get("WHATSAPP_TEST_ALLOWLIST") ?? "")
    .split(/[,\s]+/)
    .map((x) => normalizePhoneBR(x))
    .filter((x): x is string => !!x),
);

// MODO OBSERVAÇÃO: WHATSAPP_OBSERVE_MODE = "true" → roda tudo em produção,
// registra na whatsapp_send_log quem RECEBERIA, mas NÃO envia. Pra validar
// por dias antes de ligar de verdade.
const OBSERVE_MODE = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_OBSERVE_MODE") ?? "").trim().toLowerCase(),
);
// ROLLOUT ETAPA 1/2: WHATSAPP_ALLOWLIST_ONLY = "true" → mesmo em produção,
// só a allowlist recebe (só meu número → pequeno grupo).
const ALLOWLIST_ONLY = ["1", "true", "yes"].includes(
  (Deno.env.get("WHATSAPP_ALLOWLIST_ONLY") ?? "").trim().toLowerCase(),
);
// ROLLOUT ETAPA 3: WHATSAPP_ROLLOUT_PERCENT = 0..100 (fração de reservas
// reais liberada). Determinístico por dedupe_key.
// FAIL-CLOSED: ausente OU inválido (não-numérico) → 0 (NÃO envia). Nunca
// assume 100. Pra liberar geral é preciso setar WHATSAPP_ROLLOUT_PERCENT=100
// DE PROPÓSITO — mesmo princípio do kill switch (desligado por padrão).
const ROLLOUT_PERCENT = (() => {
  const raw = (Deno.env.get("WHATSAPP_ROLLOUT_PERCENT") ?? "").trim();
  if (raw === "") return 0; // ausente → fail-closed
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0; // inválido → fail-closed
  return Math.max(0, Math.min(100, n));
})();

export function whatsappSendingDisabled(): boolean {
  return SENDING_DISABLED;
}
export function whatsappDryRun(): boolean {
  return DRY_RUN;
}
export function whatsappIsProd(): boolean {
  return IS_PROD;
}
export function whatsappObserveMode(): boolean {
  return OBSERVE_MODE;
}
// True se o número (bruto) está na allowlist de teste. Usado pra travar o
// "testar no meu WhatsApp" — só números autorizados, nunca um estranho.
export function whatsappAllowlistHas(rawPhone: unknown): boolean {
  const p = normalizePhoneBR(typeof rawPhone === "string" ? rawPhone : String(rawPhone ?? ""));
  return !!p && TEST_ALLOWLIST.has(p);
}

// True quando as credenciais mínimas DO PROVEDOR ATIVO existem.
export function whatsappConfigured(): boolean {
  return PROVIDER === "meta" ? !!(META_TOKEN && META_PHONE_ID) : !!(INSTANCE && TOKEN);
}
// Alias — nome usado pelo fluxo de confirmação de reserva.
export const isWhatsAppConfigured = whatsappConfigured;

export interface WaResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  id?: string;
}
// Alias de tipo (compat com o código de confirmação).
export type WhatsAppResult = WaResult;

// Normaliza telefone BR pra E.164 sem "+" (55DDNXXXXXXXX) — formato que a
// Z-API aceita em `phone`. Aceita "(11) 91234-5678", "11912345678",
// "+5511912345678", etc.
//
// SEGURANÇA (fix crítico): NUNCA coage um número estrangeiro/torto num BR
// plausível. Só devolve um número se ele for CLARAMENTE brasileiro válido
// (DDD real + formato de celular/fixo). Qualquer outra coisa → null (o
// chamador PULA o envio, em vez de mandar pra um desconhecido).
export function normalizePhoneBR(raw: string | null | undefined): string | null {
  let d = String(raw ?? "").replace(/\D+/g, "");
  if (!d) return null;
  // Remove o código do país 55 SÓ quando sobra um número nacional válido
  // (55 + 11 díg = 13, ou 55 + 10 díg = 12). Assim "5511..." vira "11...".
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2);
  else if (d.length === 12 && d.startsWith("55")) d = d.slice(2);
  // Agora precisa ser nacional: 11 dígitos (celular) ou 10 (fixo).
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = Number(d.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) return null;
  // Celular (11 díg): o 3º dígito é obrigatoriamente 9.
  if (d.length === 11 && d[2] !== "9") return null;
  // Fixo (10 díg): o 3º dígito vai de 2 a 5. (WhatsApp normalmente só entrega
  // em celular; fixo é aceito aqui mas a Z-API simplesmente não vai achar.)
  // Celular no formato ANTIGO, sem o 9 da frente (ex.: "(48) 9190-7056"):
  // 10 dígitos com o 3º entre 6 e 9 não é fixo — é celular de antes da
  // migração do nono dígito. Todo celular BR hoje tem o 9, então completa.
  // O WhatsApp de contas antigas ainda EXIBE o número assim.
  if (d.length === 10 && /[6-9]/.test(d[2])) d = d.slice(0, 2) + "9" + d.slice(2);
  if (d.length === 10 && !/[2-5]/.test(d[2])) return null;
  return "55" + d;
}
// Alias — nome usado pelo fluxo de confirmação de reserva.
export const normalizeWhatsAppPhoneBR = normalizePhoneBR;

// Núcleo do envio (telefone JÁ normalizado em 55DDNXXXXXXXX).
// ===== CLOUD API OFICIAL (Meta) =====
// Um POST só pra tudo: texto, imagem e template. A Graph API devolve
// { messages:[{id}] } no sucesso e { error:{ code, message } } no erro.
async function metaSend(payload: Record<string, unknown>, phone: string): Promise<WaResult> {
  if (!META_TOKEN || !META_PHONE_ID) {
    return {
      ok: false,
      skipped: true,
      error:
        "META_WHATSAPP_TOKEN/META_WHATSAPP_PHONE_NUMBER_ID ausentes nos secrets do " +
        "Supabase. Cadastre em Edge Functions → Secrets e faça redeploy.",
    };
  }
  const url = `${META_GRAPH_BASE}/${META_GRAPH_VERSION}/${META_PHONE_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + META_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const raw = await res.text().catch(() => "");
    let data: Record<string, unknown> = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { /* corpo não-JSON */ }

    if (!res.ok) {
      const err = (data.error ?? {}) as { code?: number; message?: string; error_data?: { details?: string } };
      const code = Number(err.code ?? 0);
      let friendly = (err.error_data?.details || err.message || raw).slice(0, 300);
      // Tradução dos erros que de fato aparecem em produção.
      if (code === 190) {
        friendly = "Token da Meta expirado/inválido — gere um token permanente (System User). " + friendly;
      } else if (code === 131047) {
        friendly = "Fora da janela de 24h: mensagem iniciada pela empresa exige TEMPLATE aprovado. " + friendly;
      } else if (code === 131026) {
        friendly = "Número não recebe no WhatsApp (sem conta/incompatível). " + friendly;
      } else if (code === 132000 || code === 132001 || code === 132005 || code === 132007 || code === 132012 || code === 132015) {
        friendly = "Template inválido: nome/idioma não existem, não foi aprovado, ou a " +
          "quantidade/formato dos parâmetros não bate com o aprovado. " + friendly;
      } else if (code === 131031 || code === 368) {
        friendly = "Conta do WhatsApp Business restrita pela Meta. " + friendly;
      } else if (code === 130429 || code === 131048) {
        friendly = "Limite de envio da Meta atingido (throughput/qualidade do número). " + friendly;
      }
      console.error(
        "[elarah/whatsapp] Meta rejeitou o envio —",
        "status=" + res.status,
        "code=" + code,
        "phone=" + maskPhoneLocal(phone),
        "body=" + raw.slice(0, 500),
      );
      return { ok: false, status: res.status, error: friendly };
    }

    const messages = (data.messages ?? []) as Array<{ id?: string }>;
    return { ok: true, status: res.status, id: messages[0]?.id };
  } catch (e) {
    console.error("[elarah/whatsapp] exceção durante envio (Meta)", e);
    return { ok: false, error: String(e) };
  }
}

// Máscara local (o maskPhone do portão é importado só onde precisa).
function maskPhoneLocal(raw: unknown): string {
  const d = String(raw ?? "").replace(/\D+/g, "");
  return d.length < 6 ? "•••" : d.slice(0, 4) + "•••••" + d.slice(-4);
}

// ===== TEMPLATES APROVADOS (obrigatórios fora da janela de 24h) =====
// Nome default = o que está em docs/whatsapp-oficial-meta.md pra você
// submeter no WhatsApp Manager. Se aprovar com outro nome, sobrescreva pelo
// secret correspondente — sem mexer em código.
// Nomes dos templates JÁ APROVADOS na conta da Elarah (criados em agosto).
// Cada um pode ser corrigido por secret, sem tocar em código — use o
// diagnóstico (admin-whatsapp-templates) pra conferir nome e nº de variáveis.
const META_TEMPLATE_DEFAULTS: Record<string, string> = {
  // Nomes conferidos no Gerenciador do WhatsApp. Estes quatro fluxos hoje
  // são enviados por OUTRO sistema (ver docs/whatsapp-quem-manda-o-que.md) e
  // ficam em WHATSAPP_FLUXOS_DESLIGADOS — os nomes seguem aqui pro dia em que
  // a plataforma assumir algum deles.
  confirmation: "elarah_confirmacao_reserva",
  reminder48: "elarah_lembrete_2dias",
  feedback: "elarah_feedback",
  pending: "elarah_pagamento_pendente",
  byelarah_aviso: "elarah_inscricoes_abertas",
  // Ainda não existem na conta — criar quando for usar estes fluxos.
  instrucoes: "elarah_instrucoes_pos_compra",
  fornecedor: "elarah_aviso_parceira",
};
const META_TEMPLATE_ENV: Record<string, string> = {
  confirmation: "META_TEMPLATE_CONFIRMACAO",
  reminder48: "META_TEMPLATE_LEMBRETE",
  feedback: "META_TEMPLATE_FEEDBACK",
  pending: "META_TEMPLATE_PENDENTE",
  byelarah_aviso: "META_TEMPLATE_INSCRICOES",
  instrucoes: "META_TEMPLATE_INSTRUCOES",
  fornecedor: "META_TEMPLATE_PARCEIRA",
};

// Templates aprovados COM cabeçalho de imagem. A imagem NÃO faz parte da
// aprovação: a Meta aprova a ESTRUTURA, e cada envio manda a sua foto — então
// cada pessoa recebe a foto do evento em que ELA se inscreveu.
//
// Por que é secret e não default: mandar cabeçalho pra um template aprovado
// SEM cabeçalho faz a Meta recusar TODOS os envios (132000) — e o contrário
// também. Então isto só liga quando você confirma que aprovou o template com
// a imagem.
const META_TEMPLATE_IMAGEM_ENV: Record<string, string> = {
  byelarah_aviso: "META_TEMPLATE_INSCRICOES_IMAGEM",
  confirmation: "META_TEMPLATE_CONFIRMACAO_IMAGEM",
  reminder48: "META_TEMPLATE_LEMBRETE_IMAGEM",
  feedback: "META_TEMPLATE_FEEDBACK_IMAGEM",
  pending: "META_TEMPLATE_PENDENTE_IMAGEM",
};

export function metaTemplateUsaImagem(kind: string): boolean {
  const envKey = META_TEMPLATE_IMAGEM_ENV[kind];
  if (!envKey) return false;
  return ["1", "true", "yes", "sim"].includes(
    (Deno.env.get(envKey) ?? "").trim().toLowerCase(),
  );
}

// A Meta só aceita JPG e PNG no cabeçalho de imagem de um template (webp,
// jfif, gif e afins são recusados — e a mensagem NÃO sai pra aquela pessoa).
// Em vez de perder o aviso por causa do formato da foto, cai no logo da
// Elarah e registra o aviso pra você trocar a imagem no cadastro.
export function imagemAceitaPelaMeta(url: unknown): boolean {
  const limpa = String(url ?? "").split("?")[0].split("#")[0].trim().toLowerCase();
  if (!/^https?:\/\//.test(limpa)) return false;
  return /\.(jpe?g|png)$/.test(limpa);
}

// Limite da Meta pra imagem de cabeçalho.
const META_IMAGEM_MAX_BYTES = 5 * 1024 * 1024;

// Confere a foto ANTES de usá-la no cabeçalho: um HEAD rápido diz o tipo e o
// tamanho reais. A extensão sozinha não basta — uma foto de 8 MB tem .jpg e
// mesmo assim derruba o envio.
//
// Critério de decisão:
//   * resposta clara e RUIM (404, tipo errado, > 5 MB) → logo da Elarah;
//   * resposta clara e boa                              → a foto do evento;
//   * SEM resposta (rede/timeout)                       → mantém a foto.
// Ou seja: só troca por logo com prova de que a foto quebraria o envio —
// uma instabilidade de rede não faz todo mundo receber o logo.
export async function resolverImagemParaTemplate(url: unknown): Promise<string> {
  const logo = experienceImageUrl("");
  if (!imagemAceitaPelaMeta(url)) return logo;
  const alvo = String(url);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(alvo, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn("[elarah/whatsapp] foto do evento inacessível (" + res.status + ") — usando o logo:", alvo);
      return logo;
    }
    const tipo = (res.headers.get("content-type") ?? "").toLowerCase();
    if (tipo && !/^image\/(jpeg|jpg|png)/.test(tipo)) {
      console.warn("[elarah/whatsapp] foto do evento com tipo " + tipo + " (a Meta só aceita jpeg/png) — usando o logo:", alvo);
      return logo;
    }
    const tamanho = Number(res.headers.get("content-length") ?? "0");
    if (Number.isFinite(tamanho) && tamanho > META_IMAGEM_MAX_BYTES) {
      console.warn(
        "[elarah/whatsapp] foto do evento com " + Math.round(tamanho / 1024 / 1024) +
          " MB (limite da Meta: 5 MB) — usando o logo:",
        alvo,
      );
      return logo;
    }
    return alvo;
  } catch (e) {
    // Sem resposta: não é prova de que a foto é ruim. Segue com ela.
    console.warn("[elarah/whatsapp] não deu pra conferir a foto do evento (segue com ela):", alvo, String(e));
    return alvo;
  }
}

export function metaTemplateName(kind: string): string | null {
  const envKey = META_TEMPLATE_ENV[kind];
  const custom = envKey ? (Deno.env.get(envKey) ?? "").trim() : "";
  if (custom) return custom;
  return META_TEMPLATE_DEFAULTS[kind] ?? null;
}

// Parâmetro de template: a Meta REJEITA quebra de linha, tab e 4+ espaços
// seguidos dentro de um parâmetro, e também parâmetro vazio. Normaliza tudo
// pra uma linha e cai num texto neutro quando o dado não existe.
export function metaParam(value: unknown, fallback = "—"): string {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  return (s || fallback).slice(0, 900);
}

export interface MetaTemplateSpec {
  params: string[];       // {{1}}, {{2}}, ... na ordem
  name?: string;          // default: metaTemplateName(kind)
  headerImage?: string;   // só se o template aprovado tiver header de imagem
}

// Envia um template aprovado. É o caminho das mensagens que a Elarah INICIA
// (aviso de data, lembrete, feedback, confirmação) — as únicas que a Meta
// entrega fora da janela de 24h.
export async function sendWhatsAppTemplate(opts: {
  to: unknown;
  kind: string;
  template: MetaTemplateSpec;
}): Promise<WaResult> {
  const phone = normalizePhoneBR(
    typeof opts.to === "string" ? opts.to : String(opts.to ?? ""),
  );
  if (!phone) return { ok: false, error: "invalid_phone" };
  if (SENDING_DISABLED) {
    console.warn("[elarah/whatsapp] KILL SWITCH ligado — template bloqueado");
    return { ok: false, skipped: true, error: "sending_disabled" };
  }
  if (DRY_RUN) {
    console.info("[elarah/whatsapp] DRY-RUN template — NÃO enviado", "kind=" + opts.kind);
    return { ok: true, skipped: true, status: 0 };
  }
  if (!IS_PROD && !TEST_ALLOWLIST.has(phone)) {
    console.warn("[elarah/whatsapp] template fora de produção + fora da allowlist — bloqueado");
    return { ok: false, skipped: true, error: "staging_blocked" };
  }
  const name = (opts.template.name ?? metaTemplateName(opts.kind) ?? "").trim();
  if (!name) {
    return { ok: false, skipped: true, error: "template_nao_configurado:" + opts.kind };
  }
  const components: Record<string, unknown>[] = [];
  if (opts.template.headerImage) {
    components.push({
      type: "header",
      parameters: [{ type: "image", image: { link: opts.template.headerImage } }],
    });
  }
  if (opts.template.params.length) {
    components.push({
      type: "body",
      parameters: opts.template.params.map((t) => ({ type: "text", text: metaParam(t) })),
    });
  }
  return await metaSend({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: { name, language: { code: META_LANG }, components },
  }, phone);
}

async function sendTextCore(phone: string, message: string): Promise<WaResult> {
  if (SENDING_DISABLED) {
    console.warn("[elarah/whatsapp] KILL SWITCH ligado (WHATSAPP_SENDING_ENABLED=false) — envio bloqueado", "phone=" + phone);
    return { ok: false, skipped: true, error: "sending_disabled" };
  }
  if (DRY_RUN) {
    console.info("[elarah/whatsapp] DRY-RUN — NÃO enviado", "msg=" + message.slice(0, 80));
    return { ok: true, skipped: true, status: 0 };
  }
  // Backstop de ambiente: fora de produção, só número da allowlist. Vale até
  // pra chamadas diretas ao adaptador (ex.: teste), não só as gateadas.
  if (!IS_PROD && !TEST_ALLOWLIST.has(phone)) {
    console.warn("[elarah/whatsapp] fora de produção + fora da allowlist — bloqueado");
    return { ok: false, skipped: true, error: "staging_blocked" };
  }
  // OFICIAL: texto livre só é ENTREGUE dentro da janela de 24h (resposta a
  // quem escreveu primeiro). Fora dela a Meta recusa com 131047 — mensagem
  // iniciada pela Elarah vai por sendWhatsAppTemplate().
  if (PROVIDER === "meta") {
    return await metaSend({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: message, preview_url: true },
    }, phone);
  }

  if (!INSTANCE || !TOKEN) {
    return {
      ok: false,
      skipped: true,
      error:
        "ZAPI_INSTANCE_ID/ZAPI_TOKEN ausentes nos secrets do Supabase. " +
        "Cadastre em Edge Functions → Secrets e faça redeploy.",
    };
  }

  const url = `${ZAPI_BASE}/instances/${INSTANCE}/token/${TOKEN}/send-text`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[elarah/whatsapp] Z-API rejeitou o envio —",
        "status=" + res.status,
        "phone=" + phone,
        "body=" + text.slice(0, 500),
      );
      // Mensagens amigáveis pros 4xx mais comuns:
      //   401/403 → Client-Token errado/ausente
      //   4xx "not connected"/"disconnected" → instância deslogada
      let friendly = text.slice(0, 300);
      const low = (text || "").toLowerCase();
      if (res.status === 401 || res.status === 403) {
        friendly = "Client-Token inválido ou ausente (Z-API → Segurança). " + friendly;
      } else if (low.includes("not connected") || low.includes("disconnected") || low.includes("smartphone")) {
        friendly = "Instância Z-API desconectada — reconecte o WhatsApp (QR code) no painel Z-API. " + friendly;
      }
      return { ok: false, status: res.status, error: friendly };
    }

    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const id =
      (data as { messageId?: string }).messageId ??
      (data as { id?: string }).id ??
      (data as { zaapId?: string }).zaapId;
    return { ok: true, status: res.status, id };
  } catch (e) {
    console.error("[elarah/whatsapp] exceção durante envio", e);
    return { ok: false, error: String(e) };
  }
}

// Envia uma mensagem de texto. Aceita as DUAS formas de chamada, pra
// atender os dois recursos sem mudar quem já chama:
//   sendWhatsAppText(phone, message)      → usado pelo whatsapp-broadcast
//   sendWhatsAppText({ to, message })     → usado pelas confirmações
// Em ambos os casos o telefone é normalizado aqui (idempotente).
export async function sendWhatsAppText(
  phoneOrOpts: string | { to: unknown; message: string },
  message?: string,
): Promise<WaResult> {
  let rawPhone: unknown;
  let msg: string;
  if (typeof phoneOrOpts === "object" && phoneOrOpts !== null) {
    rawPhone = phoneOrOpts.to;
    msg = phoneOrOpts.message;
  } else {
    rawPhone = phoneOrOpts;
    msg = message ?? "";
  }
  const phone = normalizePhoneBR(
    typeof rawPhone === "string" ? rawPhone : String(rawPhone ?? ""),
  );
  if (!phone) {
    console.warn("[elarah/whatsapp] telefone inválido — não enviado", String(rawPhone ?? ""));
    return { ok: false, error: "invalid_phone" };
  }
  return sendTextCore(phone, msg);
}

// Envia uma imagem com legenda (caption) pela Z-API. `image` pode ser uma
// URL pública (ex.: foto da experiência) ou um data URI base64. Usado pelas
// mensagens que mostram a foto da experiência (ou o logo da Elarah).
export async function sendWhatsAppImage(opts: {
  to: unknown;
  image: string;
  caption?: string;
}): Promise<WaResult> {
  const phone = normalizePhoneBR(
    typeof opts.to === "string" ? opts.to : String(opts.to ?? ""),
  );
  if (!phone) return { ok: false, error: "invalid_phone" };
  if (SENDING_DISABLED) {
    console.warn("[elarah/whatsapp] KILL SWITCH ligado — imagem bloqueada", "phone=" + phone);
    return { ok: false, skipped: true, error: "sending_disabled" };
  }
  if (DRY_RUN) {
    console.info("[elarah/whatsapp] DRY-RUN imagem — NÃO enviada", "caption=" + (opts.caption ?? "").slice(0, 80));
    return { ok: true, skipped: true, status: 0 };
  }
  if (!IS_PROD && !TEST_ALLOWLIST.has(phone)) {
    console.warn("[elarah/whatsapp] imagem fora de produção + fora da allowlist — bloqueada");
    return { ok: false, skipped: true, error: "staging_blocked" };
  }
  if (!opts.image) {
    // Sem imagem: cai pro texto puro, pra não deixar de avisar o cliente.
    return sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
  }
  if (PROVIDER === "meta") {
    // A Meta só aceita imagem por URL pública (data URI não passa) — nesse
    // caso manda o texto, que é melhor do que não avisar.
    if (!/^https?:\/\//i.test(opts.image)) {
      return sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
    }
    return await metaSend({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "image",
      image: { link: opts.image, caption: opts.caption ?? "" },
    }, phone);
  }
  if (!INSTANCE || !TOKEN) {
    return { ok: false, skipped: true, error: "ZAPI_INSTANCE_ID/ZAPI_TOKEN ausentes." };
  }
  const url = `${ZAPI_BASE}/instances/${INSTANCE}/token/${TOKEN}/send-image`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, image: opts.image, caption: opts.caption ?? "" }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[elarah/whatsapp] Z-API send-image erro", "status=" + res.status, "body=" + text.slice(0, 300));
      // Fallback: se a imagem falhar (URL inacessível etc.), manda o texto.
      const fb = await sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
      return fb.ok ? fb : { ok: false, status: res.status, error: text.slice(0, 300) };
    }
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const id = (data as { messageId?: string }).messageId ?? (data as { id?: string }).id;
    return { ok: true, status: res.status, id };
  } catch (e) {
    console.error("[elarah/whatsapp] exceção send-image", e);
    // Fallback pro texto.
    return sendWhatsAppText({ to: phone, message: opts.caption ?? "" });
  }
}

// ===== Textos das mensagens =====

// Primeiro nome, pra deixar a mensagem pessoal.
function primeiroNome(nome: unknown): string {
  const n = String(nome ?? "").trim();
  return n ? n.split(/\s+/)[0] : "";
}

// Confirmação de reserva — espelha o e-mail "Sua reserva está confirmada ✨".
export function bookingConfirmationWhatsAppText(opts: {
  nome?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horario?: unknown;
  endereco?: unknown;
  bairro?: unknown;
  quantidade?: unknown;
}): string {
  const nome = primeiroNome(opts.nome);
  const saud = nome ? `Oi, ${nome}! ` : "Oi! ";
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const linhas: string[] = [];
  linhas.push(`${saud}Sua reserva na Elarah está confirmada ✨`);
  linhas.push("");
  linhas.push(`*${exp}*`);
  const dataHora = [String(opts.data ?? "").trim(), String(opts.horario ?? "").trim()]
    .filter(Boolean).join(" · ");
  if (dataHora) linhas.push(`🗓️ ${dataHora}`);
  const local = [String(opts.endereco ?? "").trim(), String(opts.bairro ?? "").trim()]
    .filter(Boolean).join(" — ");
  if (local) linhas.push(`📍 ${local}`);
  const qtd = Number(opts.quantidade) || 1;
  if (qtd > 1) linhas.push(`👥 ${qtd} pessoas`);
  linhas.push("");
  linhas.push("Qualquer coisa é só responder por aqui. Até logo! 🧡");
  return linhas.join("\n");
}

interface MsgOpts {
  nome?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horario?: unknown;
  endereco?: unknown;
  bairro?: unknown;
}
function _linhaDataLocal(opts: MsgOpts): string[] {
  const out: string[] = [];
  const dataHora = [String(opts.data ?? "").trim(), String(opts.horario ?? "").trim()]
    .filter(Boolean).join(" · ");
  if (dataHora) out.push(`🗓️ ${dataHora}`);
  const local = [String(opts.endereco ?? "").trim(), String(opts.bairro ?? "").trim()]
    .filter(Boolean).join(" — ");
  if (local) out.push(`📍 ${local}`);
  return out;
}

// Lembrete 48h antes da experiência.
export function reminder48hWhatsAppText(opts: MsgOpts): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Sua experiência na Elarah é daqui a 2 dias 🧡`);
  linhas.push("");
  linhas.push(`*${exp}*`);
  linhas.push(..._linhaDataLocal(opts));
  linhas.push("");
  linhas.push("Tá tudo de pé pra você? Se precisar ajustar algo, é só responder por aqui. A gente te espera! ✨");
  return linhas.join("\n");
}

// Pós-compra / feedback (2 dias depois da experiência) — COM link de avaliação.
export function feedbackWhatsAppText(opts: MsgOpts & { link?: unknown }): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const link = String(opts.link ?? "").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Como foi a sua experiência? 🧡`);
  linhas.push("");
  linhas.push(`Queremos muito saber o que você achou de *${exp}* — leva 1 minutinho e ajuda demais a gente a melhorar.`);
  if (link) {
    linhas.push("");
    linhas.push(`⭐ Avaliar aqui: ${link}`);
  }
  linhas.push("");
  linhas.push("Obrigada por viver isso com a Elarah ✨");
  return linhas.join("\n");
}

// Recuperação de pendente (3–6h depois, se não pagou) — 1x só por reserva.
export function pendingRecoveryWhatsAppText(opts: MsgOpts): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "a experiência").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Vi que você começou a reservar *${exp}* e o pagamento não foi concluído 🙈`);
  linhas.push("");
  linhas.push("Sua vaga ainda pode estar disponível — quer que eu te ajude a finalizar? É só me responder por aqui. 🧡");
  const dl = _linhaDataLocal(opts);
  if (dl.length) { linhas.push(""); linhas.push(...dl); }
  return linhas.join("\n");
}

// ===== AVISO AO PARCEIRO (fornecedor) =====
// Mesma mensagem que o painel monta no botão "Avisar" — a diferença é que
// agora sai sozinha quando a compra é confirmada.
//
// No canal legado a conversa aparece no WhatsApp da Elarah (ela lê a resposta
// da parceira); na oficial vai por template aprovado, com a formatação no
// corpo do template — a mensagem que chega é a mesma nos dois.
export function supplierBookingWhatsAppText(opts: {
  quantidade?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horario?: unknown;
  nomes?: string[];
  telefoneCliente?: unknown;
  emailCliente?: unknown;
  endereco?: unknown;
  bairro?: unknown;
}): string {
  const qtd = Math.max(1, Number(opts.quantidade) || 1);
  const nomes = (opts.nomes ?? []).map((n) => String(n ?? "").trim()).filter(Boolean);
  const exp = String(opts.experienciaNome ?? "(experiência)").trim();
  const data = String(opts.data ?? "(data)").trim() || "(data)";
  const horario = String(opts.horario ?? "(horário)").trim() || "(horário)";

  const lista = nomes.length === 0
    ? "(participante)"
    : nomes.length === 1
    ? nomes[0]
    : nomes.length === 2
    ? nomes[0] + " e " + nomes[1]
    : nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];

  // A QUANTIDADE vem do que foi comprado, não da contagem de nomes: quando a
  // compradora leva alguém e não informa o nome, o parceiro precisa saber
  // que vai ter mais gente do que os nomes na lista.
  const semNome = Math.max(0, qtd - nomes.length);
  const vagas = qtd === 1 ? "*1 vaga confirmada*" : "*" + qtd + " vagas confirmadas*";

  const linhas: string[] = [];
  linhas.push(
    `Oi! Tudo bem? Passando para te avisar que você tem ${vagas} para a experiência ` +
      `*${exp}* no dia *${data}* às *${horario}*.`,
  );
  linhas.push("");
  linhas.push(`👤 *Em nome de:* ${lista}`);
  if (semNome > 0) {
    linhas.push(
      `➕ *Mais ${semNome} ${semNome === 1 ? "pessoa" : "pessoas"}* — a compra foi de ` +
        `${qtd} vagas e o nome não foi informado no checkout.`,
    );
  }
  const tel = formatPhoneBRHuman(opts.telefoneCliente);
  if (tel) linhas.push(`📱 *WhatsApp:* ${tel}`);
  const email = String(opts.emailCliente ?? "").trim();
  if (email) linhas.push(`✉️ *E-mail:* ${email}`);
  const local = [String(opts.endereco ?? "").trim(), String(opts.bairro ?? "").trim()]
    .filter(Boolean).join(" — ");
  if (local) linhas.push(`📍 *Local:* ${local}`);
  linhas.push("");
  linhas.push("O repasse será feito até 48h antes do evento.");
  return linhas.join("\n");
}

// (11) 91234-5678 — pra leitura humana na mensagem do parceiro.
function formatPhoneBRHuman(raw: unknown): string {
  const all = String(raw ?? "").replace(/\D+/g, "");
  const d = all.length > 11 && all.startsWith("55") ? all.slice(2) : all;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(raw ?? "").trim();
}

// Instruções pós-compra da experiência (cadastro do parceiro, sala, link,
// orientações). Sai logo depois da confirmação, como mensagem SEPARADA de
// propósito: é uma AÇÃO que a cliente precisa fazer, e misturada na
// confirmação ela se perde.
//
// O texto vem do cadastro da experiência (experiences.instrucoes_pos_compra),
// então cada experiência diz o que ela precisa — sem nada hardcoded.
export function postPurchaseInstructionsWhatsAppText(opts: {
  nome?: unknown;
  experienciaNome?: unknown;
  instrucoes?: unknown;
}): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "sua experiência").trim();
  const corpo = String(opts.instrucoes ?? "").trim();
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}Só mais um passo pra sua vaga ficar certinha 🧡`);
  linhas.push("");
  linhas.push(`*${exp}*`);
  linhas.push("");
  linhas.push(corpo);
  linhas.push("");
  linhas.push("Qualquer dúvida é só responder por aqui ✨");
  return linhas.join("\n");
}

// Aviso ÚNICO pra lista de interesse de um evento By Elarah: "as inscrições
// abriram". Vai pra quem deixou o contato enquanto o evento ainda estava em
// lista de espera.
//
// UMA mensagem só, de propósito: o texto funciona com data ("🗓️ 24 de abril")
// e sem data ("🗓️ data a confirmar"), então não existe cenário de a pessoa
// receber duas mensagens parecidas. Um template só pra aprovar e manter.
//
// Quem dispara: supabase/functions/byelarah-aviso-data (fila alimentada pela
// trigger de sql/elarah_byelarah_aviso_data.sql).
export function byelarahAvisoWhatsAppText(opts: {
  nome?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horarios?: unknown; // array de strings ou string única
  local?: unknown;
  link?: unknown;
}): string {
  const nome = primeiroNome(opts.nome);
  const exp = String(opts.experienciaNome ?? "a experiência").trim();
  const horarios = Array.isArray(opts.horarios)
    ? opts.horarios.map((h) => String(h ?? "").trim()).filter(Boolean)
    : [String(opts.horarios ?? "").trim()].filter(Boolean);
  const linhas: string[] = [];
  linhas.push(`${nome ? "Oi, " + nome + "! " : "Oi! "}As inscrições abriram ✨`);
  linhas.push("");
  linhas.push(
    `Você se inscreveu pra ser avisada quando *${exp}* abrisse — e as vagas acabaram de entrar no ar.`,
  );
  // No texto livre a linha some quando não há dado; no template ela existe
  // sempre (corpo fixo) e recebe o texto neutro de metaParam.
  const detalhes: string[] = [];
  const data = String(opts.data ?? "").trim();
  if (data) detalhes.push(`🗓️ ${data}`);
  if (horarios.length) detalhes.push(`🕒 ${horarios.join(" ou ")}`);
  const local = String(opts.local ?? "").trim();
  if (local) detalhes.push(`📍 ${local}`);
  if (detalhes.length) {
    linhas.push("");
    linhas.push(...detalhes);
  }
  const link = String(opts.link ?? "").trim();
  if (link) {
    linhas.push("");
    linhas.push(`✨ Garanta a sua aqui: ${link}`);
  }
  linhas.push("");
  linhas.push("As vagas são poucas e quem estava na lista está sabendo primeiro 🧡");
  return linhas.join("\n");
}

// ===== PARÂMETROS DOS TEMPLATES OFICIAIS (Meta) =====
// Cada função devolve os {{1}}, {{2}}, ... na ORDEM do template aprovado.
// O texto dos templates está em docs/whatsapp-oficial-meta.md — mexer aqui
// sem mexer lá (e re-aprovar na Meta) faz a Meta recusar o envio.
//
// Regra de ouro: parâmetro NUNCA vai vazio nem com quebra de linha (a Meta
// recusa) — metaParam() normaliza e aplica o texto neutro de cada campo.
const P_NOME = "tudo bem";                       // "Oi, {{1}}!" sem nome
const P_EXP = "sua experiência na Elarah";
const P_QUANDO = "data a confirmar";
const P_LOCAL = "endereço enviado por aqui";
const P_LINK = "https://elarah.com.br";

function _quandoParam(data: unknown, horario: unknown): string {
  return metaParam(
    [String(data ?? "").trim(), String(horario ?? "").trim()].filter(Boolean).join(" · "),
    P_QUANDO,
  );
}
function _localParam(endereco: unknown, bairro: unknown): string {
  return metaParam(
    [String(endereco ?? "").trim(), String(bairro ?? "").trim()].filter(Boolean).join(" — "),
    P_LOCAL,
  );
}

// elarah_reserva_confirmada — {{1}} nome · {{2}} experiência · {{3}} quando · {{4}} local
export function bookingConfirmationTemplateParams(opts: {
  nome?: unknown; experienciaNome?: unknown; data?: unknown; horario?: unknown;
  endereco?: unknown; bairro?: unknown;
}): string[] {
  return [
    metaParam(primeiroNome(opts.nome), P_NOME),
    metaParam(opts.experienciaNome, P_EXP),
    _quandoParam(opts.data, opts.horario),
    _localParam(opts.endereco, opts.bairro),
  ];
}

// elarah_lembrete_48h — {{1}} nome · {{2}} experiência · {{3}} quando · {{4}} local
export function reminder48hTemplateParams(opts: MsgOpts): string[] {
  return [
    metaParam(primeiroNome(opts.nome), P_NOME),
    metaParam(opts.experienciaNome, P_EXP),
    _quandoParam(opts.data, opts.horario),
    _localParam(opts.endereco, opts.bairro),
  ];
}

// elarah_pedido_feedback — {{1}} nome · {{2}} experiência · {{3}} link de avaliação
export function feedbackTemplateParams(opts: MsgOpts & { link?: unknown }): string[] {
  return [
    metaParam(primeiroNome(opts.nome), P_NOME),
    metaParam(opts.experienciaNome, P_EXP),
    metaParam(opts.link, P_LINK),
  ];
}

// elarah_reserva_pendente — {{1}} nome · {{2}} experiência
export function pendingRecoveryTemplateParams(opts: MsgOpts): string[] {
  return [
    metaParam(primeiroNome(opts.nome), P_NOME),
    metaParam(opts.experienciaNome, P_EXP),
  ];
}

// elarah_instrucoes_pos_compra — {{1}} nome · {{2}} o que fazer
//
// DUAS variáveis, não três. O nome da experiência saiu do template: o
// classificador da Meta recusava o modelo como Marketing enquanto o corpo era
// quase só variável, e com uma a menos (mais texto fixo, âncora explícita na
// compra) ele passou como Utilidade. Não faz falta — a confirmação de reserva
// chega logo antes com experiência, data e horário.
//
// A CONTAGEM tem que bater com o template aprovado: mandar 3 parâmetros num
// modelo de 2 faz a Meta recusar a mensagem inteira.
//
// ATENÇÃO: parâmetro de template não aceita quebra de linha (a Meta recusa),
// então na oficial as instruções viram UM parágrafo. O WhatsApp ainda quebra
// a linha na tela; o que some são as linhas em branco. Texto longo e em vários
// parágrafos rende melhor num template próprio do parceiro, com o texto fixo
// no corpo — ver partnerInstructionsTemplateParams.
export function postPurchaseInstructionsTemplateParams(opts: {
  nome?: unknown; experienciaNome?: unknown; instrucoes?: unknown;
}): string[] {
  return [
    metaParam(primeiroNome(opts.nome), P_NOME),
    metaParam(opts.instrucoes, "te mando os detalhes por aqui"),
  ];
}

// Template PRÓPRIO do parceiro: o texto inteiro fica FIXO no corpo, aprovado
// na Meta, e só o que muda vai como variável. É assim que um texto longo —
// bullets, parágrafos, endereço, estacionamento — chega formatado pela
// oficial, porque variável de template NÃO aceita quebra de linha.
//
// Cada parceiro usa variáveis diferentes, na ordem que quiser:
//   Lado B         → {{1}} nome
//   BARES SP       → {{1}} nome · {{2}} link do formulário
//   THE COZY HOME  → {{1}} nome · {{2}} experiência · {{3}} data · {{4}} horário
//
// Então a ordem é DECLARADA no cadastro do parceiro
// (fornecedores_metadata.instrucoes_variaveis), ex.: "nome, experiencia, data,
// horario". Sai sempre UM parâmetro por item declarado — a Meta recusa a
// mensagem se a contagem não bater com o template.
const INSTR_VARS_PADRAO = ["nome"];

// Nomes aceitos em instrucoes_variaveis → valor. Aceita apelidos e ignora
// acento/caixa/pontuação, porque isso é digitado à mão no painel.
export function partnerInstructionsVarList(raw: unknown): string[] {
  const limpo = String(raw ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // tira acento
    .toLowerCase()
    .replace(/\{\{\s*\d+\s*\}\}/g, " ")              // "{{1}}" não é nome
    .replace(/[^a-z_]+/g, " ")
    .trim();
  const itens = limpo ? limpo.split(/\s+/).filter(Boolean) : [];
  return itens.length ? itens : INSTR_VARS_PADRAO.slice();
}

export function partnerInstructionsTemplateParams(opts: {
  variaveis?: unknown;
  nome?: unknown;
  experienciaNome?: unknown;
  data?: unknown;
  horario?: unknown;
  link?: unknown;
  endereco?: unknown;
  bairro?: unknown;
  quantidade?: unknown;
}): string[] {
  const local = [opts.endereco, opts.bairro]
    .map((x) => String(x ?? "").trim()).filter(Boolean).join(" — ");
  return partnerInstructionsVarList(opts.variaveis).map((v) => {
    switch (v) {
      case "nome":
      case "primeiro_nome":
        return metaParam(primeiroNome(opts.nome), P_NOME);
      case "nome_completo":
        return metaParam(opts.nome, P_NOME);
      case "experiencia":
      case "experiencia_nome":
      case "aula":
      case "evento":
        return metaParam(opts.experienciaNome, P_EXP);
      case "data":
      case "dia":
        return metaParam(opts.data, "na data combinada");
      case "horario":
      case "hora":
        return metaParam(opts.horario, "no horário combinado");
      case "link":
      case "formulario":
      case "cadastro":
        return metaParam(opts.link, "te mando o link por aqui");
      case "local":
      case "endereco":
        return metaParam(local, "te passo o endereço por aqui");
      case "quantidade":
      case "vagas":
        return metaParam(opts.quantidade, "1");
      default:
        // Nome que o código não conhece: manda um valor neutro pra CONTAGEM
        // de parâmetros continuar batendo com o template.
        return metaParam(null);
    }
  });
}

// elarah_aviso_parceira — SETE variáveis, no mesmo formato que a parceira já
// recebe hoje pelo canal legado:
//
//     Oi! Tudo bem? Passando para te avisar que você tem {{1}} para a
//     experiência {{2}} no dia {{3}}.
//
//     👤 Em nome de: {{4}}
//     📱 WhatsApp: {{5}}
//     ✉️ E-mail: {{6}}
//     📍 Local: {{7}}
//
//     O repasse será feito até 48h antes do evento.
//
// Emoji, rótulo e quebra de linha vivem no CORPO do template, que é fixo e
// aprovado — só os VALORES são variáveis. Por isso a mensagem sai idêntica à
// do canal legado, sem a limitação de "parâmetro numa linha só".
//
// A CONTAGEM tem que bater com o template aprovado: mandar 5 num modelo de 7
// (ou o contrário) faz a Meta recusar a mensagem inteira.
export function supplierBookingTemplateParams(opts: {
  quantidade?: unknown; experienciaNome?: unknown; data?: unknown; horario?: unknown;
  nomes?: string[]; telefoneCliente?: unknown; emailCliente?: unknown;
  endereco?: unknown; bairro?: unknown;
}): string[] {
  const qtd = Math.max(1, Number(opts.quantidade) || 1);
  const nomes = (opts.nomes ?? []).map((n) => String(n ?? "").trim()).filter(Boolean);
  const semNome = Math.max(0, qtd - nomes.length);
  const lista = nomes.length ? nomes.join(", ") : "(participante)";
  return [
    metaParam(qtd === 1 ? "1 vaga confirmada" : qtd + " vagas confirmadas"),
    metaParam(opts.experienciaNome, "(experiência)"),
    // "03/10 às 10h00 – 11h30" — o corpo do template já diz "no dia".
    metaParam(
      [String(opts.data ?? "").trim(), String(opts.horario ?? "").trim()].filter(Boolean).join(" às "),
      "(data)",
    ),
    // Quem falta aparece AQUI, junto dos nomes: é o dado que a parceira usa
    // pra saber quanta gente preparar. Linha condicional não existe em
    // template, então o aviso mora dentro do próprio valor.
    metaParam(semNome > 0 ? lista + " + " + semNome + (semNome === 1 ? " pessoa" : " pessoas") +
      " sem nome informado" : lista),
    metaParam(formatPhoneBRHuman(opts.telefoneCliente), "não informado"),
    metaParam(opts.emailCliente, "não informado"),
    metaParam(
      [String(opts.endereco ?? "").trim(), String(opts.bairro ?? "").trim()].filter(Boolean).join(" — "),
      "combinado com a Elarah",
    ),
  ];
}

// elarah_inscricoes_abertas — o ÚNICO template do aviso By Elarah.
// {{1}} nome · {{2}} experiência · {{3}} quando · {{4}} local · {{5}} link
export function byelarahAvisoTemplateParams(opts: {
  nome?: unknown; experienciaNome?: unknown; data?: unknown; horarios?: unknown;
  local?: unknown; link?: unknown;
}): string[] {
  const horarios = Array.isArray(opts.horarios)
    ? opts.horarios.map((h) => String(h ?? "").trim()).filter(Boolean)
    : [String(opts.horarios ?? "").trim()].filter(Boolean);
  return [
    metaParam(primeiroNome(opts.nome), P_NOME),
    metaParam(opts.experienciaNome, P_EXP),
    // Sem data conhecida o corpo do template continua existindo (é fixo),
    // então a linha vira "🗓️ data a confirmar" em vez de sumir.
    metaParam(
      [String(opts.data ?? "").trim(), horarios.join(" ou ")].filter(Boolean).join(" · "),
      P_QUANDO,
    ),
    metaParam(opts.local, P_LOCAL),
    metaParam(opts.link, P_LINK),
  ];
}

// ===== PORTÃO ÚNICO (idempotência + auditoria + fail-closed) =====
// deno-lint-ignore no-explicit-any
type SB = any;

export interface GatedResult extends WaResult {
  sent: boolean;
  reason: string | null;
}

// Envio gateado: reserva na whatsapp_send_log (UNIQUE) ANTES de chamar a
// Z-API. Sob concorrência, só UM reserva; os demais veem duplicate e não
// enviam. Qualquer erro/dúvida = não envia (fail-closed). Ver whatsapp_gate.js.
export async function gatedSendWhatsApp(
  supabase: SB,
  params: {
    kind: string;
    dedupeKey: string;
    identifierOk: boolean;
    rawPhone: unknown;
    suppressed: boolean | undefined;
    statusAllowed: boolean | undefined;
    message?: string;
    image?: string;
    caption?: string;
    // Provedor OFICIAL: parâmetros do template aprovado. Sem isto, na
    // oficial o envio vira texto livre — que a Meta só entrega dentro da
    // janela de 24h. Toda automação (mensagem que a Elarah inicia) manda.
    template?: MetaTemplateSpec;
    // Este envio PREFERE a oficial, mesmo que o provedor padrão seja o
    // legado. Usado pelo aviso à lista de interesse: é disparo frio, o que
    // mais arrisca banimento de número comum. Sem credencial da Meta
    // cadastrada, cai no canal padrão (o comportamento de hoje).
    preferOfficial?: boolean;
    bookingId?: string | null;
    experienciaId?: string | null;
    createdBy?: string | null;
  },
): Promise<GatedResult> {
  // Fluxo desligado de propósito (outro sistema já manda este aviso): nem
  // chega a reservar chave nem a montar mensagem.
  if (whatsappFluxoDesligado(params.kind)) {
    return { ok: false, sent: false, reason: "fluxo_desligado" } as GatedResult;
  }

  const deps = {
    config: {
      sendingDisabled: SENDING_DISABLED,
      dryRun: DRY_RUN,
      isProd: IS_PROD,
      allowlist: TEST_ALLOWLIST,
      observe: OBSERVE_MODE,
      allowlistOnly: ALLOWLIST_ONLY,
      rolloutPercent: ROLLOUT_PERCENT,
    },
    reserve: async (key: string, meta: Record<string, unknown>) => {
      const { error } = await supabase.from("whatsapp_send_log").insert({
        dedupe_key: key,
        kind: meta.kind ?? params.kind,
        booking_id: meta.booking_id ?? null,
        experiencia_id: meta.experiencia_id ?? null,
        phone_masked: meta.phone_masked ?? null,
        // Telefone inteiro e texto: é o lado ENVIADO da conversa na tela de
        // Conversas. Sem o número não dá pra saber a que conversa a mensagem
        // pertence; sem o texto não há o que mostrar. Só admin lê (RLS em
        // sql/elarah_whatsapp_conversas.sql); phone_masked continua aí pra
        // auditoria.
        telefone: meta.telefone ?? null,
        corpo: (params.message ?? params.caption ?? null) as string | null,
        status: (meta.status as string) ?? "pending",
        created_by: params.createdBy ?? null,
      });
      if (!error) return { reserved: true };
      const code = (error as { code?: string }).code;
      if (code === "23505" || /duplicate key|unique/i.test(error.message ?? "")) {
        return { duplicate: true };
      }
      // Qualquer outro erro de banco → FAIL-CLOSED (não envia sem registrar).
      console.error("[whatsapp gate] reserve erro (fail-closed) —", key, error.message);
      return { error: true };
    },
    finalize: async (key: string, patch: Record<string, unknown>) => {
      await supabase.from("whatsapp_send_log")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("dedupe_key", key);
    },
    send: async (o: { phone: string; message?: string; image?: string; caption?: string }) => {
      // Oficial + template aprovado = o caminho das mensagens iniciadas pela
      // Elarah. O texto livre (abaixo) segue valendo pro provedor legado e
      // pra resposta dentro da janela de 24h.
      // A foto só entra se o template aprovado TIVER cabeçalho de imagem
      // (ligado pelo secret correspondente — ver metaTemplateUsaImagem).
      // Mandar cabeçalho num template sem cabeçalho faz a Meta recusar TODOS
      // os envios; e não mandar num template COM cabeçalho, idem. Por isso,
      // quando está ligado, SEMPRE vai uma imagem: a do evento em que a
      // pessoa se inscreveu ou, na falta dela, o logo da Elarah.
      const viaOficial = (PROVIDER === "meta") ||
        (params.preferOfficial === true && whatsappOfficialReady());
      if (viaOficial && params.template) {
        let headerImage: string | undefined = undefined;
        if (metaTemplateUsaImagem(params.kind)) {
          const candidata = params.template.headerImage ?? params.image;
          if (imagemAceitaPelaMeta(candidata)) {
            headerImage = candidata;
          } else {
            // Formato que a Meta recusa (webp/jfif/etc) ou URL inválida:
            // manda o logo pra mensagem CHEGAR. Perder a foto é ruim;
            // perder o aviso inteiro é pior.
            if (candidata) {
              console.warn(
                "[elarah/whatsapp] foto do evento fora do formato aceito pela Meta " +
                  "(só JPG/PNG) — usando o logo:",
                candidata,
              );
            }
            headerImage = experienceImageUrl("");
          }
        }
        return await sendWhatsAppTemplate({
          to: o.phone,
          kind: params.kind,
          template: { ...params.template, headerImage },
        });
      }
      if (o.image) return await sendWhatsAppImage({ to: o.phone, image: o.image, caption: o.caption });
      return await sendWhatsAppText({ to: o.phone, message: o.message ?? o.caption ?? "" });
    },
    // Erro/aviso do portão vai pro log da função (antes era engolido, o que
    // escondia falha real de envio). Info fica de fora pra não poluir.
    log: (level: string, msg: string, fields?: unknown) => {
      if (level === "error") console.error("[whatsapp gate]", msg, fields ?? "");
      else if (level === "warn") console.warn("[whatsapp gate]", msg, fields ?? "");
    },
  };
  return (await gatedSend(deps, params)) as GatedResult;
}

// Chave do parceiro em fornecedores_metadata: o nome normalizado (minúsculo,
// espaços colapsados). Mesma regra do admin (fornecedorKey), porque é ela que
// grava as linhas dessa tabela.
export function fornecedorKeyDeNome(nome: unknown): string {
  return String(nome ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Envia o aviso da compra pro PARCEIRO, sozinho, quando a reserva é paga.
//
// Resolve o WhatsApp do parceiro igual ao painel: nome do fornecedor
// (snapshot da reserva ou o da experiência) → fornecedores_metadata.whatsapp,
// casando por nome normalizado. Sem WhatsApp cadastrado, não faz nada — o
// botão manual do painel continua lá.
//
// Segue o provedor padrão (WHATSAPP_PROVIDER). No legado, a conversa aparece
// no WhatsApp da Elarah e ela vê a resposta da parceira; na oficial, vai pelo
// template elarah_aviso_parceira.
export async function sendSupplierBookingNoticeGated(
  supabase: SB,
  // deno-lint-ignore no-explicit-any
  booking: any,
): Promise<GatedResult | null> {
  const bookingId = String(booking?.id ?? "");
  if (!bookingId) return null;
  if (!AVISO_FORNECEDOR_ATIVO) return null;

  // RELEITURA AUTORITATIVA (fail-closed): status, supressão e os dados da
  // experiência vêm do banco AGORA, não do objeto que o webhook trouxe.
  let statusAllowed = false;
  let suppressed = true;
  let fornecedorNome = "";
  let endereco: unknown = null;
  let bairro: unknown = null;
  // deno-lint-ignore no-explicit-any
  let fresh: any = null;
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "status, aguardando_experiencia, quantidade, nome, telefone, email, metadata, " +
          "data, horario, experiencia_id, experiencia_nome, fornecedor_nome, fornecedor_avisado_at, " +
          "experiences(fornecedor_nome, endereco, bairro)",
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (error || !data) return null;
    fresh = data;
    statusAllowed = data.status === "pago";
    suppressed = data.aguardando_experiencia === true;
    const exp = (data as {
      experiences?: { fornecedor_nome?: unknown; endereco?: unknown; bairro?: unknown };
    }).experiences;
    fornecedorNome = String(data.fornecedor_nome ?? exp?.fornecedor_nome ?? "").trim();
    endereco = exp?.endereco ?? null;
    bairro = exp?.bairro ?? null;
  } catch (_e) {
    return null; // fail-closed
  }

  if (!fornecedorNome) return null;

  // WhatsApp do parceiro: fornecedores_metadata, por nome normalizado.
  let waParceiro = "";
  try {
    const chave = fornecedorKeyDeNome(fornecedorNome);
    const { data } = await supabase
      .from("fornecedores_metadata")
      .select("whatsapp")
      .eq("fornecedor_key", chave)
      .maybeSingle();
    waParceiro = String(data?.whatsapp ?? "").trim();
  } catch (_e) {
    return null;
  }
  if (!waParceiro) return null;   // sem cadastro → segue o botão manual

  // Nomes: compradora + acompanhantes de metadata.participantes, deduplicados.
  const meta = (fresh.metadata ?? {}) as Record<string, unknown>;
  const nomes: string[] = [];
  const vistos = new Set<string>();
  const empurra = (n: unknown) => {
    const nome = String(n ?? "").trim();
    if (!nome) return;
    const chave = nome.toLowerCase().replace(/\s+/g, " ");
    if (vistos.has(chave)) return;
    vistos.add(chave);
    nomes.push(nome);
  };
  empurra(fresh.nome);
  const participantes = meta.participantes;
  if (Array.isArray(participantes)) {
    for (const p of participantes) empurra((p as { nome?: unknown })?.nome);
  }

  const mensagem = supplierBookingWhatsAppText({
    quantidade: fresh.quantidade,
    experienciaNome: fresh.experiencia_nome,
    data: fresh.data,
    horario: fresh.horario,
    nomes,
    telefoneCliente: (meta.telefone_digits as string | undefined) ?? fresh.telefone,
    emailCliente: fresh.email,
    endereco,
    bairro,
  });

  const res = await gatedSendWhatsApp(supabase, {
    kind: "fornecedor",
    dedupeKey: "fornecedor:" + bookingId,
    identifierOk: !!fresh.experiencia_id || !!fornecedorNome,
    rawPhone: waParceiro,
    suppressed,
    statusAllowed,
    message: mensagem,
    caption: mensagem,
    // Segue o provedor PADRÃO: enquanto for o legado, a conversa aparece no
    // WhatsApp da Elarah (ela lê a resposta da parceira). Quando o
    // transacional migrar pra oficial (WHATSAPP_PROVIDER=meta), vai por
    // template aprovado — a formatação fica no corpo do template, então a
    // mensagem continua igual.
    template: {
      params: supplierBookingTemplateParams({
        quantidade: fresh.quantidade,
        experienciaNome: fresh.experiencia_nome,
        data: fresh.data,
        horario: fresh.horario,
        nomes,
        telefoneCliente: (meta.telefone_digits as string | undefined) ?? fresh.telefone,
        emailCliente: fresh.email,
        endereco,
        bairro,
      }),
    },
    bookingId,
    experienciaId: fresh.experiencia_id ?? null,
  });

  // Carimba "avisado" pra lista de Compras mostrar ✓ sem a admin clicar.
  if (res.sent && !fresh.fornecedor_avisado_at) {
    try {
      await supabase.from("bookings")
        .update({ fornecedor_avisado_at: new Date().toISOString() })
        .eq("id", bookingId);
    } catch (e) {
      console.warn("[elarah/whatsapp] avisei a parceira mas não carimbei fornecedor_avisado_at", e);
    }
  }
  return res;
}

// URL pública da foto da experiência (ou logo da Elarah como fallback).
const ELARAH_SITE = "https://elarah.com.br";
export function experienceImageUrl(rawImagem: unknown): string {
  const s = String(rawImagem ?? "").trim();
  if (!s) return ELARAH_SITE + "/assets/logo.png";
  if (/^https?:\/\//i.test(s)) return s;
  return ELARAH_SITE + "/" + s.replace(/^\/+/, "");
}

// Confirmação de reserva GATEADA — caminho ÚNICO das 4 funções de pagamento
// (stripe/mp/pagarme/check-mp). Calcula suppression e status aqui, fail-closed.
export async function sendBookingConfirmationGated(
  supabase: SB,
  // deno-lint-ignore no-explicit-any
  booking: any,
  meta: Record<string, unknown>,
): Promise<GatedResult> {
  const bookingId = String(booking?.id ?? "");
  // RELEITURA AUTORITATIVA (fail-closed): não confia no objeto que o webhook
  // trouxe (pode estar desatualizado). Busca status + aguardando_experiencia
  // + a foto da experiência AGORA. Se a leitura falhar → assume o pior.
  let statusAllowed = false;
  let aguardando: boolean = true;
  let imagem: string = ELARAH_SITE + "/assets/logo.png";
  // Instruções pós-compra (cadastro do parceiro, sala, link).
  // Vêm do PARCEIRO por padrão — a mensagem quase sempre é a mesma pra todas
  // as experiências dele. A experiência só SOBRESCREVE quando tem texto
  // próprio. Os dois vazios = a cliente recebe só a confirmação, como sempre.
  let instrucoes = "";
  // Nome do parceiro dessa reserva, pra buscar o texto padrão dele.
  let fornecedorNome = "";
  if (bookingId) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "status, aguardando_experiencia, fornecedor_nome, " +
            "experiences(imagem, instrucoes_pos_compra, fornecedor_nome)",
        )
        .eq("id", bookingId)
        .maybeSingle();
      if (!error && data) {
        statusAllowed = data.status === "pago";
        aguardando = data.aguardando_experiencia === true ||
          (meta && (meta.aguardando_experiencia === true || meta.suppress_customer_messaging === true));
        const exp = (data as {
          experiences?: {
            imagem?: unknown;
            instrucoes_pos_compra?: unknown;
            fornecedor_nome?: unknown;
          };
        }).experiences;
        imagem = experienceImageUrl(exp?.imagem);
        instrucoes = String(exp?.instrucoes_pos_compra ?? "").trim();
        fornecedorNome = String(
          (data as { fornecedor_nome?: unknown }).fornecedor_nome ??
            exp?.fornecedor_nome ?? "",
        ).trim();
      }
    } catch (_e) {
      // fail-closed: mantém statusAllowed=false / aguardando=true
    }
  }

  // Template PRÓPRIO do parceiro na Meta (texto todo fixo no corpo) e o link
  // que vira {{2}} nele. Só entram quando é o texto do PARCEIRO que vale — se
  // a experiência tem texto próprio, ela manda pelo template genérico.
  let instrTemplate = "";
  let instrLink = "";
  let instrVars = "";

  // Sem texto na experiência → cai no cadastro do parceiro. Uma consulta a
  // mais só nesse caso; se falhar, fica vazio e simplesmente não envia.
  if (!instrucoes && fornecedorNome) {
    try {
      const { data } = await supabase
        .from("fornecedores_metadata")
        .select(
          "instrucoes_pos_compra, instrucoes_template, instrucoes_link, " +
            "instrucoes_variaveis",
        )
        .eq("fornecedor_key", fornecedorKeyDeNome(fornecedorNome))
        .maybeSingle();
      const f = data as {
        instrucoes_pos_compra?: unknown;
        instrucoes_template?: unknown;
        instrucoes_link?: unknown;
        instrucoes_variaveis?: unknown;
      } | null;
      instrucoes = String(f?.instrucoes_pos_compra ?? "").trim();
      instrTemplate = String(f?.instrucoes_template ?? "").trim();
      instrLink = String(f?.instrucoes_link ?? "").trim();
      instrVars = String(f?.instrucoes_variaveis ?? "").trim();
    } catch (_e) {
      instrucoes = "";
      instrTemplate = "";
      instrLink = "";
      instrVars = "";
    }
  }
  const rawPhone = (meta?.telefone_digits as string | undefined) ?? booking?.telefone;
  const texto = bookingConfirmationWhatsAppText({
    nome: booking?.nome,
    experienciaNome: booking?.experiencia_nome ?? "Sua experiência",
    data: booking?.data,
    horario: booking?.horario,
    endereco: (meta?.endereco as string | null) ?? null,
    bairro: (meta?.bairro as string | null) ?? null,
    quantidade: booking?.quantidade ?? null,
  });
  const confirmacao = await gatedSendWhatsApp(supabase, {
    kind: "confirmation",
    dedupeKey: "confirmation:" + String(booking?.id ?? ""),
    identifierOk: !!booking?.id,
    rawPhone,
    suppressed: aguardando ? true : false,
    statusAllowed,
    image: imagem, // foto da experiência (cartão) — provedor legado
    caption: texto,
    message: texto,
    // Provedor oficial: mesma mensagem, via template aprovado.
    template: {
      params: bookingConfirmationTemplateParams({
        nome: booking?.nome,
        experienciaNome: booking?.experiencia_nome ?? "Sua experiência",
        data: booking?.data,
        horario: booking?.horario,
        endereco: (meta?.endereco as string | null) ?? null,
        bairro: (meta?.bairro as string | null) ?? null,
      }),
    },
    bookingId: booking?.id ?? null,
    experienciaId: booking?.experiencia_id ?? null,
  });

  // SEGUNDA MENSAGEM: o que a cliente precisa FAZER. Só quando a experiência
  // tem instrução cadastrada. Passa pelo mesmo portão (chave própria), então:
  // não sai duas vezes, respeita kill switch/rollout/ambiente, e não sai se a
  // reserva não estiver paga ou estiver suprimida.
  //
  // Vai DEPOIS da confirmação de propósito (a ordem importa pra leitura) e
  // não deixa de sair se a confirmação já tinha ido antes ("duplicate") —
  // são duas mensagens independentes.
  //
  // Dois jeitos de mandar, e o portão é o mesmo:
  //   * template PRÓPRIO do parceiro (instrucoes_template) — o texto inteiro
  //     está fixo no corpo, aprovado na Meta, com {{1}} nome (e {{2}} link se
  //     houver). É o único jeito de um texto longo, com bullets e parágrafos,
  //     chegar formatado pela oficial.
  //   * template genérico (elarah_instrucoes_pos_compra) — o texto vai como
  //     variável e, por regra da Meta, sai em UMA linha.
  //
  // Sem texto livre e sem template do parceiro → não há o que mandar. E com
  // só o template do parceiro, o canal legado (texto livre) não tem corpo
  // pra enviar, então esse caso só sai pela oficial.
  const temTemplateParceiro = !!instrTemplate;
  const podeEnviarInstr = !!instrucoes || (temTemplateParceiro && whatsappIsOfficial());
  if (podeEnviarInstr) {
    const textoInstr = instrucoes
      ? postPurchaseInstructionsWhatsAppText({
        nome: booking?.nome,
        experienciaNome: booking?.experiencia_nome ?? "Sua experiência",
        instrucoes,
      })
      : "";
    try {
      const rInstr = await gatedSendWhatsApp(supabase, {
        kind: "instrucoes",
        dedupeKey: "instrucoes:" + bookingId,
        identifierOk: !!booking?.id,
        rawPhone,
        suppressed: aguardando ? true : false,
        statusAllowed,
        message: textoInstr,
        caption: textoInstr,
        template: temTemplateParceiro
          ? {
            name: instrTemplate,
            params: partnerInstructionsTemplateParams({
              variaveis: instrVars,
              nome: booking?.nome,
              experienciaNome: booking?.experiencia_nome,
              data: booking?.data,
              horario: booking?.horario,
              link: instrLink,
              endereco: (meta?.endereco as string | null) ?? null,
              bairro: (meta?.bairro as string | null) ?? null,
              quantidade: booking?.quantidade ?? null,
            }),
          }
          : {
            params: postPurchaseInstructionsTemplateParams({
              nome: booking?.nome,
              experienciaNome: booking?.experiencia_nome ?? "Sua experiência",
              instrucoes,
            }),
          },
        bookingId: booking?.id ?? null,
        experienciaId: booking?.experiencia_id ?? null,
      });
      if (!rInstr.sent && rInstr.reason && rInstr.reason !== "duplicate") {
        console.warn("[elarah/whatsapp] instruções pós-compra não enviadas —", rInstr.reason, bookingId);
      }
    } catch (e) {
      // Nunca derruba a confirmação por causa da segunda mensagem.
      console.error("[elarah/whatsapp] falha ao enviar instruções pós-compra", e);
    }
  }

  // TERCEIRA MENSAGEM, pra OUTRA pessoa: o aviso da compra pra parceira que
  // vai receber a cliente. Mesmo ponto de entrada, então vale pra Stripe,
  // Mercado Pago, Pagar.me e confirmação manual sem tocar em cada webhook.
  try {
    await sendSupplierBookingNoticeGated(supabase, booking);
  } catch (e) {
    console.error("[elarah/whatsapp] falha ao avisar a parceira", e);
  }

  return confirmacao;
}
