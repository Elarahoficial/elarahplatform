// =============================================================
// ELARAH — Portão de segurança de WhatsApp (lógica pura, fail-closed)
// -------------------------------------------------------------
// TODO envio de WhatsApp passa por gatedSend(). A lógica é PURA (sem
// Deno/Node/DB específicos): tudo que é I/O entra por `deps`, então a
// MESMA função roda em produção (edge function Deno) e nos testes (Node
// com mocks). Isso deixa os testes exercitarem exatamente o código real.
//
// Princípio: FAIL-CLOSED. Qualquer dúvida, erro, dado ausente ou
// inconsistência resulta em "NÃO ENVIA" — nunca em "envia pra pessoa
// errada" ou "envia de novo".
//
// Escrito em JS puro (ESM) de propósito: Deno importa .js sem problema e
// o harness de teste em Node importa o MESMO arquivo.
// =============================================================

// DDDs válidos no Brasil.
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

// Normaliza pra 55DDNXXXXXXXX. RECUSA (null) qualquer coisa que não seja
// claramente um número BR válido — nunca coage estrangeiro/torto num BR.
export function normalizePhoneBR(raw) {
  let d = String(raw ?? "").replace(/\D+/g, "");
  if (!d) return null;
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2);
  else if (d.length === 12 && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = Number(d.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) return null;
  if (d.length === 11 && d[2] !== "9") return null;
  if (d.length === 10 && !/[2-5]/.test(d[2])) return null;
  return "55" + d;
}

// Mascara pra log/preview: 5511•••••1234 (nunca loga o número inteiro).
export function maskPhone(raw) {
  const d = String(raw ?? "").replace(/\D+/g, "");
  if (d.length < 6) return "•••";
  return d.slice(0, 4) + "•••••" + d.slice(-4);
}

// Bucket determinístico 0–99 a partir de uma string (rollout gradual).
// Determinístico: a mesma reserva cai sempre no mesmo bucket (não usa random).
export function rolloutBucket(str) {
  let h = 2166136261 >>> 0;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 100;
}

// Resultado padronizado de uma tentativa.
function result(sent, reason, extra) {
  return Object.assign({ sent: !!sent, reason: reason || null }, extra || {});
}

// ===== PORTÃO ÚNICO =====
// deps:
//   config: { sendingDisabled:bool, dryRun:bool, isProd:bool, allowlist:Set<string>|null }
//   reserve(dedupeKey, meta) -> { reserved:bool, duplicate:bool, error:bool }
//       (INSERT idempotente na whatsapp_send_log; duplicate = já existe;
//        error = falha de banco → tratamos como FAIL-CLOSED)
//   finalize(dedupeKey, patch)  -> Promise (best-effort; grava status/erro)
//   send({ phone, message, image, caption }) -> { ok, skipped, status, error, id }
//   log(level, msg, fields)  (opcional)
//
// params:
//   kind             string (ex.: "confirmation")
//   dedupeKey        string ÚNICO por (destinatário + tipo + contexto)
//   identifierOk     bool  — o vínculo veio de id/slug/booking_id exato?
//   rawPhone         string — telefone bruto (será validado aqui)
//   suppressed       bool|undefined — "Aguardando experiência" etc.
//   statusAllowed    bool|undefined — status da reserva permite? (fail-closed)
//   message/image/caption
export async function gatedSend(deps, params) {
  const cfg = (deps && deps.config) || {};
  const log = (deps && deps.log) || (() => {});
  const p = params || {};

  // 1) VÍNCULO EXATO obrigatório. Sem identificador confiável → não envia.
  if (p.identifierOk !== true) {
    log("warn", "gate: sem identificador exato", { kind: p.kind });
    return result(false, "missing_identifier");
  }

  // 2) DADO OBRIGATÓRIO (dedupeKey) ausente → não envia.
  if (!p.dedupeKey || typeof p.dedupeKey !== "string") {
    log("warn", "gate: dedupeKey ausente", { kind: p.kind });
    return result(false, "missing_dedupe_key");
  }

  // 3) SUPRESSÃO (aguardando experiência / cancelada / reembolsada etc.).
  //    Fail-closed: só NÃO suprime se veio explicitamente false.
  if (p.suppressed !== false) {
    log("info", "gate: suprimido", { kind: p.kind, key: p.dedupeKey });
    return result(false, "suppressed");
  }

  // 4) STATUS da reserva. Fail-closed: undefined/!==true → não envia.
  if (p.statusAllowed !== true) {
    log("info", "gate: status não permite", { kind: p.kind, key: p.dedupeKey });
    return result(false, "status_not_allowed");
  }

  // 5) TELEFONE. Valida rigoroso; inválido → PULA (nunca coage).
  const phone = normalizePhoneBR(p.rawPhone);
  if (!phone) {
    log("warn", "gate: telefone inválido", { kind: p.kind, masked: maskPhone(p.rawPhone) });
    return result(false, "invalid_phone");
  }

  // (kill switch é aplicado mais abaixo, DEPOIS do modo observação — observe
  //  precisa rodar mesmo com o envio desligado, pois nunca envia.)

  // 7) AMBIENTE. Fora de produção só pode número da allowlist (senão,
  //    staging/preview atingiria cliente real).
  if (cfg.isProd !== true) {
    const allow = cfg.allowlist instanceof Set ? cfg.allowlist : null;
    if (!allow || !allow.has(phone)) {
      log("warn", "gate: bloqueado fora de produção", { kind: p.kind, masked: maskPhone(phone) });
      return result(false, "staging_blocked");
    }
  }

  // 7b) ROLLOUT — ETAPA 1/2: allowlist-only. Mesmo em produção, se
  //     allowlistOnly estiver ligado, só números da allowlist recebem
  //     (só meu número → pequeno grupo de teste). Fora dela → não envia.
  if (cfg.allowlistOnly === true) {
    const allow = cfg.allowlist instanceof Set ? cfg.allowlist : null;
    if (!allow || !allow.has(phone)) {
      return result(false, "not_in_allowlist");
    }
  }

  // 7c) ROLLOUT — ETAPA 3: porcentagem. rolloutPercent libera só uma fração
  //     determinística das reservas (ex.: 10 = poucas reservas reais); 100 =
  //     todos. Determinístico pela dedupeKey.
  //     FAIL-CLOSED: ausente/NaN/não-configurado → 0 (NÃO envia). Nunca
  //     assume 100 "por padrão" — pra liberar geral é preciso setar 100 DE
  //     PROPÓSITO. Mesmo princípio do kill switch (desligado por padrão).
  const pct = Number.isFinite(cfg.rolloutPercent) ? cfg.rolloutPercent : 0;
  if (pct <= 0) {
    return result(false, "rollout_zero");
  }
  if (pct < 100 && rolloutBucket(p.dedupeKey) >= pct) {
    return result(false, "rollout_excluded");
  }

  // 7d) MODO OBSERVAÇÃO: roda TODAS as validações acima (só chega aqui quem
  //     REALMENTE receberia), REGISTRA na send_log com status 'observed' e
  //     NÃO envia. Serve pra validar por dias, em produção, se haveria algum
  //     envio errado — sem enviar. Independe do kill switch (nunca envia).
  //     Usa um namespace próprio ("observe:") pra NÃO consumir a chave de
  //     idempotência real (o envio real depois ainda ocorre).
  if (cfg.observe === true) {
    try {
      await deps.reserve("observe:" + p.dedupeKey, {
        kind: "observe:" + p.kind,
        status: "observed",
        phone_masked: maskPhone(phone),
        booking_id: p.bookingId ?? null,
        experiencia_id: p.experienciaId ?? null,
      });
    } catch (_e) { /* audit best-effort */ }
    log("info", "gate: OBSERVE (registra quem receberia, não envia)", { kind: p.kind, key: p.dedupeKey });
    return result(false, "observed", { observed: true, phone });
  }

  // 8) KILL SWITCH global (aplica só ao envio real).
  if (cfg.sendingDisabled === true) {
    return result(false, "sending_disabled");
  }

  // 9) DRY-RUN: simula ANTES de reservar — assim NÃO grava na send_log e não
  //    "envenena" a chave de idempotência (um envio real depois ainda ocorre).
  if (cfg.dryRun === true) {
    log("info", "gate: DRY-RUN (não reserva, não envia)", { kind: p.kind, key: p.dedupeKey });
    return result(false, "dry_run", { dryRun: true, phone });
  }

  // 9) IDEMPOTÊNCIA: reserva ANTES de enviar. UNIQUE(dedupe_key) no banco
  //    garante que só UM concorrente reserva. Duplicate/erro → não envia.
  let reservation;
  try {
    reservation = await deps.reserve(p.dedupeKey, {
      kind: p.kind,
      phone_masked: maskPhone(phone),
      booking_id: p.bookingId ?? null,
      experiencia_id: p.experienciaId ?? null,
    });
  } catch (e) {
    log("error", "gate: reserve lançou exceção — fail-closed", { key: p.dedupeKey, err: String(e) });
    return result(false, "reserve_exception");
  }
  if (!reservation || reservation.error) {
    // Falha de banco no INSERT → FAIL-CLOSED (não arrisca enviar sem registro).
    return result(false, "reserve_error");
  }
  if (reservation.duplicate) {
    return result(false, "duplicate");
  }

  // 10) ENVIO REAL (só agora). Depois grava o resultado.
  let sendRes;
  try {
    sendRes = await deps.send({
      phone,
      message: p.message,
      image: p.image,
      caption: p.caption,
    });
  } catch (e) {
    try { await deps.finalize(p.dedupeKey, { status: "failed", error: String(e) }); } catch (_e) {}
    log("error", "gate: envio lançou exceção", { key: p.dedupeKey, err: String(e) });
    return result(false, "send_exception");
  }

  const ok = !!(sendRes && sendRes.ok);
  try {
    await deps.finalize(p.dedupeKey, {
      status: ok ? "sent" : "failed",
      provider_id: (sendRes && sendRes.id) || null,
      error: ok ? null : String((sendRes && sendRes.error) || "unknown"),
    });
  } catch (_e) { /* best-effort: a reserva já impede duplicар */ }

  if (!ok) return result(false, (sendRes && sendRes.error) || "send_failed", { phone });
  return result(true, null, { phone, providerId: (sendRes && sendRes.id) || null });
}
