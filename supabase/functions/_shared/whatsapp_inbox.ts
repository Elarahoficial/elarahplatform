// =============================================================
// ELARAH — leitura do webhook do WhatsApp oficial (Cloud API)
// -------------------------------------------------------------
// As partes PURAS do whatsapp-webhook: conferir a assinatura da Meta e
// traduzir o payload dela nas linhas de whatsapp_mensagens /
// whatsapp_status_envio.
//
// Mora aqui, separado do handler, porque é onde estão os detalhes que
// quebram silenciosamente — timestamp em segundos, legenda que muda de
// lugar conforme o tipo de mídia, nome do perfil que vem fora da mensagem.
// Separado, dá pra testar cada um sem subir servidor nem tocar na rede.
// =============================================================

// Comparação em tempo constante: `a === b` vaza, pelo tempo de resposta,
// quantos caracteres do começo bateram — dá pra descobrir a assinatura
// certa byte a byte. Aqui todo par é comparado sempre.
export function igualdadeSegura(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Toda entrega da Meta vem assinada: sha256=HMAC_SHA256(app_secret, corpo cru).
// Confira sobre os BYTES CRUS — re-serializar o JSON muda o corpo e a
// conferência falha. Sem segredo configurado, recusa (fail-closed): melhor
// não gravar nada do que aceitar mensagem forjada por quem achar a URL.
export async function assinaturaConfere(
  corpoCru: string,
  header: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!appSecret) return false;
  const recebida = (header ?? "").trim();
  if (!recebida.startsWith("sha256=")) return false;
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpoCru));
  const esperada = "sha256=" +
    Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return igualdadeSegura(esperada, recebida);
}

// Telefone só com dígitos, como bookings.telefone e o resto do sistema
// guardam. O wa_id da Meta já vem nesse formato, mas nunca confie.
export function soDigitos(v: unknown): string {
  return String(v ?? "").replace(/\D+/g, "");
}

// A Meta manda o timestamp em SEGUNDOS, como string. Date espera
// milissegundos — passar direto dá 1970, e a conversa aparece ordenada
// errado sem ninguém perceber.
export function instante(v: unknown): string | null {
  const seg = Number(String(v ?? "").trim());
  if (!Number.isFinite(seg) || seg <= 0) return null;
  return new Date(seg * 1000).toISOString();
}

export interface LinhaMensagem {
  wa_message_id: string;
  telefone: string;
  nome_perfil: string | null;
  tipo: string;
  texto: string | null;
  media_id: string | null;
  media_mime: string | null;
  responde_a: string | null;
  wa_timestamp: string | null;
  raw: unknown;
}

export interface LinhaStatus {
  wa_message_id: string;
  status: string;
  telefone: string;
  wa_timestamp: string | null;
  erro_codigo: string | null;
  erro_titulo: string | null;
  raw: unknown;
}

// deno-lint-ignore no-explicit-any
function linhaDeMensagem(msg: any, nomePorTelefone: Map<string, string>): LinhaMensagem {
  const telefone = soDigitos(msg?.from);
  // O texto muda de lugar conforme o tipo: corpo em text, legenda em
  // imagem/vídeo/documento, título em botão e lista, emoji em reação.
  const texto = msg?.text?.body ??
    msg?.image?.caption ??
    msg?.video?.caption ??
    msg?.document?.caption ??
    msg?.button?.text ??
    msg?.interactive?.button_reply?.title ??
    msg?.interactive?.list_reply?.title ??
    msg?.reaction?.emoji ??
    null;
  const midia = msg?.image ?? msg?.audio ?? msg?.video ?? msg?.document ?? msg?.sticker ?? null;
  return {
    wa_message_id: String(msg?.id ?? ""),
    telefone,
    nome_perfil: nomePorTelefone.get(telefone) ?? null,
    tipo: String(msg?.type ?? "text"),
    texto: texto != null ? String(texto) : null,
    media_id: midia?.id ? String(midia.id) : null,
    media_mime: midia?.mime_type ? String(midia.mime_type) : null,
    responde_a: msg?.context?.id ? String(msg.context.id) : null,
    wa_timestamp: instante(msg?.timestamp),
    raw: msg ?? null,
  };
}

// deno-lint-ignore no-explicit-any
function linhaDeStatus(st: any): LinhaStatus {
  const erro = Array.isArray(st?.errors) && st.errors.length ? st.errors[0] : null;
  return {
    wa_message_id: String(st?.id ?? ""),
    status: String(st?.status ?? "").toLowerCase(),
    telefone: soDigitos(st?.recipient_id),
    wa_timestamp: instante(st?.timestamp),
    erro_codigo: erro?.code != null ? String(erro.code) : null,
    erro_titulo: erro?.title ? String(erro.title) : (erro?.message ? String(erro.message) : null),
    raw: st ?? null,
  };
}

// Um payload da Meta pode trazer vários entry[], vários changes[], e dentro
// de cada um mensagens E status ao mesmo tempo. Devolve tudo achatado, já
// pronto pro insert, descartando o que vier sem id ou sem telefone.
// deno-lint-ignore no-explicit-any
export function lerWebhook(corpo: any): {
  mensagens: LinhaMensagem[];
  statuses: LinhaStatus[];
} {
  const mensagens: LinhaMensagem[] = [];
  const statuses: LinhaStatus[] = [];
  for (const entry of corpo?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value ?? {};
      // contacts[] traz o nome do perfil de quem escreveu, FORA do
      // messages[] — por isso o mapa antes de percorrer as mensagens.
      const nomePorTelefone = new Map<string, string>();
      for (const c of value?.contacts ?? []) {
        const tel = soDigitos(c?.wa_id);
        const nome = String(c?.profile?.name ?? "").trim();
        if (tel && nome) nomePorTelefone.set(tel, nome);
      }
      for (const msg of value?.messages ?? []) {
        const linha = linhaDeMensagem(msg, nomePorTelefone);
        if (linha.wa_message_id && linha.telefone) mensagens.push(linha);
      }
      for (const st of value?.statuses ?? []) {
        const linha = linhaDeStatus(st);
        if (linha.wa_message_id && linha.status) statuses.push(linha);
      }
    }
  }
  return { mensagens, statuses };
}

// ---------- A JANELA DE 24 HORAS ----------
//
// A Meta só ENTREGA texto livre dentro de 24h da última mensagem DA PESSOA.
// Fora dela, só template aprovado, e a recusa vem como erro 131047 — que
// sem contexto não diz nada a quem escreveu.
//
// Por isso a regra mora aqui, num lugar só: a função de resposta confere
// antes de tentar, e a tela mostra quanto falta antes de deixar escrever.
// Duas cópias dessa conta acabariam divergindo, e o sintoma seria a
// mensagem sumir sem explicação.
//
// Nunca recebeu mensagem dessa pessoa (null) = janela FECHADA: conversa
// iniciada pela Elarah sempre precisa de template.
export function janelaDe24hAberta(
  ultimaRecebidaISO: unknown,
  agoraMs: number = Date.now(),
): boolean {
  const s = String(ultimaRecebidaISO ?? "").trim();
  if (!s) return false;
  const t = new Date(s).getTime();
  if (!Number.isFinite(t)) return false;
  return t > agoraMs - 24 * 60 * 60 * 1000;
}

// Quanto ainda resta da janela, em minutos (0 = fechada). A tela usa pra
// dizer "aberta por mais 3h20" em vez de só "pode responder".
export function minutosRestantesDaJanela(
  ultimaRecebidaISO: unknown,
  agoraMs: number = Date.now(),
): number {
  if (!janelaDe24hAberta(ultimaRecebidaISO, agoraMs)) return 0;
  const t = new Date(String(ultimaRecebidaISO)).getTime();
  const fim = t + 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((fim - agoraMs) / 60000));
}
