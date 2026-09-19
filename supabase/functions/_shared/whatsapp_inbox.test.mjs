// =============================================================
// ELARAH — testes da leitura do webhook do WhatsApp oficial
// -------------------------------------------------------------
//   node supabase/functions/_shared/whatsapp_inbox.test.mjs
//
// Carrega o whatsapp_inbox.ts REAL (Node tira os tipos sozinho) e exercita
// os pontos que quebram calados: assinatura, timestamp em segundos, legenda
// que muda de lugar por tipo de mídia, nome do perfil que vem fora da
// mensagem, e payload com mensagem e status no mesmo evento.
//
// Nada de rede: são funções puras.
// =============================================================

import { createHmac } from "node:crypto";

const WI = await import("./whatsapp_inbox.ts");

let ok = 0, fail = 0;
const out = [];
function check(nome, cond, extra) {
  if (cond) { ok++; out.push("   ✅ " + nome); }
  else { fail++; out.push("   ❌ " + nome + (extra ? " — " + extra : "")); }
}
function head(t) { out.push("\n" + t); }

// ---------- ASSINATURA ----------
head("ASSINATURA — só a Meta escreve na nossa caixa de entrada");
{
  const segredo = "segredo-do-app";
  const corpo = JSON.stringify({ entry: [{ id: "1" }] });
  const boa = "sha256=" + createHmac("sha256", segredo).update(corpo).digest("hex");

  check("assinatura correta passa", await WI.assinaturaConfere(corpo, boa, segredo));
  check("assinatura de OUTRO segredo não passa",
    !(await WI.assinaturaConfere(corpo, "sha256=" +
      createHmac("sha256", "outro").update(corpo).digest("hex"), segredo)));
  check("corpo adulterado não passa",
    !(await WI.assinaturaConfere(corpo + " ", boa, segredo)));
  check("sem header não passa", !(await WI.assinaturaConfere(corpo, null, segredo)));
  check("header sem o prefixo sha256= não passa",
    !(await WI.assinaturaConfere(corpo, boa.replace("sha256=", ""), segredo)));
  // FAIL-CLOSED: sem segredo configurado, recusa tudo. Aceitar seria deixar
  // qualquer um que descubra a URL escrever mensagem falsa.
  check("sem META_APP_SECRET, recusa mesmo com assinatura válida",
    !(await WI.assinaturaConfere(corpo, boa, "")));
  check("comparação de tamanhos diferentes é falsa",
    !WI.igualdadeSegura("abc", "abcd"));
}

// ---------- TIMESTAMP ----------
head("TIMESTAMP — a Meta manda em SEGUNDOS, Date espera milissegundos");
{
  // 1758240000 = 2025-09-19T00:00:00Z. Passar direto pro Date daria 1970 e
  // a conversa apareceria ordenada errado sem ninguém perceber.
  check("segundos viram a data certa",
    WI.instante("1758240000") === new Date(1758240000 * 1000).toISOString(),
    WI.instante("1758240000"));
  check("não cai em 1970", !String(WI.instante("1758240000")).startsWith("1970"));
  check("vazio vira null", WI.instante("") === null);
  check("lixo vira null", WI.instante("ontem") === null);
  check("zero vira null", WI.instante("0") === null);
}

// ---------- MENSAGEM DE TEXTO ----------
head("RECEBIDA — mensagem de texto");
{
  const payload = {
    entry: [{
      changes: [{
        value: {
          contacts: [{ wa_id: "5511999990000", profile: { name: "Maria Silva" } }],
          messages: [{
            id: "wamid.AAA",
            from: "5511999990000",
            timestamp: "1758240000",
            type: "text",
            text: { body: "Oi! Consigo remarcar pra sábado?" },
          }],
        },
      }],
    }],
  };
  const { mensagens, statuses } = WI.lerWebhook(payload);
  check("uma mensagem lida", mensagens.length === 1);
  check("nenhum status", statuses.length === 0);
  const m = mensagens[0];
  check("guarda o wamid (é ele que impede duplicar no reenvio)",
    m.wa_message_id === "wamid.AAA");
  check("telefone só com dígitos", m.telefone === "5511999990000");
  check("nome do perfil vem de contacts[], fora da mensagem",
    m.nome_perfil === "Maria Silva");
  check("o texto", m.texto === "Oi! Consigo remarcar pra sábado?");
  check("guarda o payload cru", !!m.raw);
}

// ---------- MÍDIA ----------
head("RECEBIDA — mídia: a legenda muda de lugar conforme o tipo");
{
  const umaMensagem = (msg) => WI.lerWebhook({
    entry: [{ changes: [{ value: { messages: [msg] } }] }],
  }).mensagens[0];

  const img = umaMensagem({
    id: "wamid.IMG", from: "5511988887777", timestamp: "1758240000", type: "image",
    image: { id: "media-1", mime_type: "image/jpeg", caption: "comprovante" },
  });
  check("imagem: guarda o media_id pra baixar depois", img.media_id === "media-1");
  check("imagem: guarda o mime", img.media_mime === "image/jpeg");
  check("imagem: a legenda vira o texto", img.texto === "comprovante");

  const audio = umaMensagem({
    id: "wamid.AUD", from: "5511988887777", timestamp: "1758240000", type: "audio",
    audio: { id: "media-2", mime_type: "audio/ogg" },
  });
  check("áudio: sem legenda, texto fica null", audio.texto === null);
  check("áudio: media_id guardado", audio.media_id === "media-2");
  check("áudio: tipo preservado", audio.tipo === "audio");

  const doc = umaMensagem({
    id: "wamid.DOC", from: "5511988887777", timestamp: "1758240000", type: "document",
    document: { id: "media-3", mime_type: "application/pdf", caption: "nota fiscal" },
  });
  check("documento: legenda vira texto", doc.texto === "nota fiscal");

  const botao = umaMensagem({
    id: "wamid.BTN", from: "5511988887777", timestamp: "1758240000", type: "button",
    button: { text: "Confirmar presença" },
  });
  check("botão: o texto do botão é o que a pessoa 'disse'",
    botao.texto === "Confirmar presença");
}

// ---------- RESPOSTA A UMA MENSAGEM NOSSA ----------
head("RECEBIDA — resposta citando a nossa mensagem");
{
  const { mensagens } = WI.lerWebhook({
    entry: [{
      changes: [{
        value: {
          messages: [{
            id: "wamid.RESP", from: "5511977776666", timestamp: "1758240000",
            type: "text", text: { body: "pode ser sim" },
            context: { id: "wamid.NOSSA" },
          }],
        },
      }],
    }],
  });
  check("guarda qual mensagem nossa ela respondeu",
    mensagens[0]?.responde_a === "wamid.NOSSA");
}

// ---------- STATUS DE ENVIO ----------
head("ENVIADA — status: a resposta do 'será que chegou?'");
{
  const { mensagens, statuses } = WI.lerWebhook({
    entry: [{
      changes: [{
        value: {
          statuses: [
            { id: "wamid.X", status: "sent", timestamp: "1758240000", recipient_id: "5511999990000" },
            { id: "wamid.X", status: "delivered", timestamp: "1758240060", recipient_id: "5511999990000" },
            { id: "wamid.X", status: "read", timestamp: "1758240120", recipient_id: "5511999990000" },
          ],
        },
      }],
    }],
  });
  check("três status lidos", statuses.length === 3);
  check("nenhuma mensagem recebida", mensagens.length === 0);
  check("na ordem que vieram",
    statuses.map((s) => s.status).join(">") === "sent>delivered>read");
  check("com o telefone do destinatário", statuses[0].telefone === "5511999990000");
}
{
  // FALHA: é aqui que aparece "template não existe", "fora da janela de
  // 24h", "token expirado" — os erros que já custaram horas de investigação.
  const { statuses } = WI.lerWebhook({
    entry: [{
      changes: [{
        value: {
          statuses: [{
            id: "wamid.F", status: "failed", timestamp: "1758240000",
            recipient_id: "5511999990000",
            errors: [{ code: 132000, title: "Número de parâmetros não bate com o template" }],
          }],
        },
      }],
    }],
  });
  check("falha guarda o código do erro", statuses[0]?.erro_codigo === "132000");
  check("e o motivo legível",
    statuses[0]?.erro_titulo === "Número de parâmetros não bate com o template");
  check("status em minúscula", statuses[0]?.status === "failed");
}

// ---------- PAYLOADS ESTRANHOS ----------
head("PAYLOADS ESTRANHOS — não derrubam e não gravam lixo");
{
  check("corpo vazio", WI.lerWebhook({}).mensagens.length === 0);
  check("null", WI.lerWebhook(null).mensagens.length === 0);
  check("entry sem changes", WI.lerWebhook({ entry: [{}] }).mensagens.length === 0);

  // Evento que não é mensagem nem status (mudança de template, qualidade do
  // número). Não é erro — só não interessa aqui.
  check("evento de outro tipo é ignorado", WI.lerWebhook({
    entry: [{ changes: [{ field: "message_template_status_update", value: { event: "APPROVED" } }] }],
  }).mensagens.length === 0);

  // Sem id ou sem telefone não dá pra deduplicar nem saber de quem é:
  // descarta em vez de gravar linha inútil.
  check("mensagem sem id é descartada", WI.lerWebhook({
    entry: [{ changes: [{ value: { messages: [{ from: "5511999990000", type: "text" }] } }] }],
  }).mensagens.length === 0);
  check("mensagem sem telefone é descartada", WI.lerWebhook({
    entry: [{ changes: [{ value: { messages: [{ id: "wamid.Z", type: "text" }] } }] }],
  }).mensagens.length === 0);
}
{
  // Um evento só pode trazer MENSAGEM e STATUS juntos, e vários entry[].
  const { mensagens, statuses } = WI.lerWebhook({
    entry: [
      {
        changes: [{
          value: {
            contacts: [{ wa_id: "5511999990000", profile: { name: "Maria" } }],
            messages: [{ id: "wamid.M1", from: "5511999990000", timestamp: "1758240000", type: "text", text: { body: "oi" } }],
            statuses: [{ id: "wamid.S1", status: "delivered", timestamp: "1758240000", recipient_id: "5511988887777" }],
          },
        }],
      },
      {
        changes: [{
          value: {
            messages: [{ id: "wamid.M2", from: "5511977776666", timestamp: "1758240000", type: "text", text: { body: "boa noite" } }],
          },
        }],
      },
    ],
  });
  check("mensagem e status no mesmo evento, mais de um entry",
    mensagens.length === 2 && statuses.length === 1,
    JSON.stringify({ m: mensagens.length, s: statuses.length }));
  check("o nome do perfil não vaza de um entry pro outro",
    mensagens[0].nome_perfil === "Maria" && mensagens[1].nome_perfil === null);
}

// ---------- JANELA DE 24H ----------
head("JANELA DE 24H — a regra que decide se dá pra responder");
{
  const AGORA = Date.parse("2026-09-19T12:00:00Z");
  const hMenos = (h) => new Date(AGORA - h * 3600_000).toISOString();

  check("mensagem de 1 hora atrás → aberta", WI.janelaDe24hAberta(hMenos(1), AGORA));
  check("de 23h59 → ainda aberta", WI.janelaDe24hAberta(hMenos(23.98), AGORA));
  check("de 24h01 → fechada", !WI.janelaDe24hAberta(hMenos(24.02), AGORA));
  check("de uma semana → fechada", !WI.janelaDe24hAberta(hMenos(168), AGORA));

  // Nunca escreveu: conversa iniciada pela Elarah SEMPRE precisa de
  // template. Tratar null como "aberta" faria a mensagem ser recusada pela
  // Meta com 131047, sem explicação pra quem escreveu.
  check("nunca recebeu mensagem dessa pessoa → fechada", !WI.janelaDe24hAberta(null, AGORA));
  check("string vazia → fechada", !WI.janelaDe24hAberta("", AGORA));
  check("data inválida → fechada", !WI.janelaDe24hAberta("ontem à noite", AGORA));

  check("restam ~23h quando a mensagem tem 1 hora",
    Math.abs(WI.minutosRestantesDaJanela(hMenos(1), AGORA) - 23 * 60) <= 1,
    String(WI.minutosRestantesDaJanela(hMenos(1), AGORA)));
  check("fechada → 0 minutos", WI.minutosRestantesDaJanela(hMenos(30), AGORA) === 0);
  check("sem mensagem → 0 minutos", WI.minutosRestantesDaJanela(null, AGORA) === 0);
}

out.push("\n==== whatsapp-webhook: " + ok + " verificações passaram, " + fail + " falharam ====");
console.log(out.join("\n"));
process.exit(fail ? 1 : 0);
