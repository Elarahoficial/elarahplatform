// =============================================================
// ELARAH — admin-set-aguardando-experiencia Edge Function
// -------------------------------------------------------------
// POST /functions/v1/admin-set-aguardando-experiencia
//   body: { booking_id: string, aguardando: boolean, motivo?: string }
//
// PARA QUE SERVE
// --------------
// Liga/desliga o estado "Aguardando experiência" de uma reserva. Esse
// estado é usado quando o cliente pede (normalmente pelo WhatsApp) pra
// DESMARCAR a experiência SEM reembolso — porque vai remarcar / usar o
// valor em outra experiência mais pra frente.
//
// Ao LIGAR (aguardando = true):
//   1. Marca bookings.aguardando_experiencia = true (+ _at = agora).
//      A partir daí NENHUMA mensagem automática vai pro cliente — as
//      funções de envio checam isCustomerMessagingSuppressed().
//   2. DEVOLVE a vaga da data original pro estoque (a pessoa não vai
//      naquela data). Isso PRECISA rodar no servidor: as RPCs de vaga
//      (increment_slot_vagas / increment_experience_vagas) só têm grant
//      pra service_role — o admin.js (usuário autenticado) não consegue
//      chamá-las direto.
//   3. status continua "pago" (não há reembolso; o valor fica com a
//      Elarah e segue na contabilidade). A reserva segue editável no
//      painel pra a admin remarcar quando o cliente escolher a nova.
//   4. Gera um CUPOM DE CRÉDITO (tabela coupons, valor fixo, uso único,
//      CREDITO_DIAS de validade) com o que a cliente pagou de verdade —
//      com promoção/cupom descontados e SEM a taxa do cartão
//      (pagoPorPessoa × quantidade). Fica em metadata.aguardando_credito,
//      aparece na conta dela e vai por e-mail, pra ela mesma escolher e
//      reservar a nova experiência no site com o código.
//
// Ao DESLIGAR (aguardando = false):
//   - Volta a segurar a vaga (decrement), best-effort. Se a vaga já foi
//     vendida pra outra pessoa nesse meio tempo, desliga mesmo assim e
//     devolve um aviso.
//   - Desativa o cupom de crédito, se ainda não foi usado. Se já foi,
//     mantém e avisa (o crédito já virou outra reserva).
//
// SEGURANÇA (igual admin-account-access):
//   - Só ADMIN. Valida o access token do caller e confere
//     profiles.role === 'admin'. Deploy COM verify_jwt (default).
//
// Variáveis de ambiente:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { CREDITO_DIAS, gerarCodigoCredito, pagoPorPessoa } from "../_shared/troca_cliente.ts";
import { sendEmail } from "../_shared/email.ts";

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

// A reserva "segura" uma vaga enquanto está pending/pago. Nos estados
// liberados (cancelado/expirado/reembolsado) a vaga já voltou — não
// devolver de novo pra não gerar estoque fantasma.
function holdsInventory(status: unknown): boolean {
  return status === "pending" || status === "pago";
}

function brl(c: number): string {
  return "R$ " + (c / 100).toFixed(2).replace(".", ",");
}

function dataBR(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear();
}

// Cupom de crédito já usado: alguma reserva (pendente ou paga) com ele.
// deno-lint-ignore no-explicit-any
async function creditoUsado(sb: any, couponId: string): Promise<boolean> {
  const { data, error } = await sb
    .from("bookings")
    .select("id")
    .eq("coupon_id", couponId)
    .in("status", ["pending", "pago"])
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  if (!admin) {
    console.error("[admin-aguardando] env ausente (SUPABASE_URL/SERVICE_ROLE)");
    return json({ ok: false, error: "server_misconfigured" }, 500);
  }

  // ===== 1. Autoriza: precisa ser admin =====
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "missing_token", message: "Faça login como admin." }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller?.id) {
    return json({ ok: false, error: "invalid_token", message: "Sessão expirada. Faça login de novo." }, 401);
  }
  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();
  if (profErr) {
    console.error("[admin-aguardando] erro ao ler profile do caller", profErr.message);
    return json({ ok: false, error: "authz_check_failed" }, 500);
  }
  if (!prof || prof.role !== "admin") {
    console.warn("[admin-aguardando] acesso negado — caller não é admin", caller.id);
    return json({ ok: false, error: "forbidden", message: "Só admin pode usar isto." }, 403);
  }

  // ===== 2. Lê o body =====
  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  const bookingId = String(payload.booking_id ?? "").trim();
  if (!bookingId) return json({ ok: false, error: "missing_booking_id" }, 400);
  const aguardando = payload.aguardando === true;
  const motivo = String(payload.motivo ?? "").trim();

  // ===== 3. Lê a reserva =====
  const { data: booking, error: readErr } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  if (readErr) {
    console.error("[admin-aguardando] erro ao ler booking", bookingId, readErr.message);
    return json({ ok: false, error: "db_error", detail: readErr.message }, 500);
  }
  if (!booking) return json({ ok: false, error: "booking_not_found" }, 404);

  // deno-lint-ignore no-explicit-any
  const bk = booking as any;
  const already = bk.aguardando_experiencia === true;
  const qty = Math.max(1, Number(bk.quantidade) || 1);
  const meta = (bk.metadata && typeof bk.metadata === "object") ? { ...bk.metadata } : {};
  const vagaJaLiberada = meta.aguardando_experiencia_vaga_liberada === true;

  // No-op idempotente: já está no estado pedido. Exceção: reserva marcada
  // antes do cupom de crédito existir — segue pra gerar o cupom.
  const semCredito = !(meta.aguardando_credito && typeof meta.aguardando_credito === "object" &&
    (meta.aguardando_credito as Record<string, unknown>).coupon_id &&
    !(meta.aguardando_credito as Record<string, unknown>).cancelado_at);
  if (aguardando === already && !(aguardando && semCredito)) {
    return json({ ok: true, aguardando, unchanged: true, vaga_liberada: vagaJaLiberada });
  }

  let vagaLiberada = vagaJaLiberada;
  let warning: string | null = null;

  if (aguardando) {
    // ---- LIGAR: devolve a vaga (uma vez), se ainda segura inventário ----
    if (!vagaJaLiberada && holdsInventory(bk.status)) {
      try {
        if (bk.slot_id) {
          const { error } = await admin.rpc("increment_slot_vagas", { p_slot_id: bk.slot_id, p_qty: qty });
          if (error) throw error;
        } else if (bk.experiencia_id) {
          const { error } = await admin.rpc("increment_experience_vagas", { p_experience_id: bk.experiencia_id, p_qty: qty });
          if (error) throw error;
        }
        vagaLiberada = true;
        meta.aguardando_experiencia_vaga_liberada = true;
      } catch (e) {
        console.error("[admin-aguardando] falha ao devolver vaga", bookingId, String((e as { message?: string })?.message ?? e));
        warning = "Estado marcado, mas não consegui devolver a vaga ao estoque automaticamente. Confira o estoque da experiência manualmente.";
      }
    }
  } else {
    // ---- DESLIGAR: volta a segurar a vaga que foi devolvida ----
    if (vagaJaLiberada && holdsInventory(bk.status)) {
      try {
        let ok = true;
        if (bk.slot_id) {
          const { data, error } = await admin.rpc("decrement_slot_vagas", { p_slot_id: bk.slot_id, p_qty: qty });
          if (error) throw error;
          const row = Array.isArray(data) ? data[0] : data;
          ok = !row || row.ok !== false;
        } else if (bk.experiencia_id) {
          const { data, error } = await admin.rpc("decrement_experience_vagas", { p_experience_id: bk.experiencia_id, p_qty: qty });
          if (error) throw error;
          const row = Array.isArray(data) ? data[0] : data;
          ok = !row || row.ok !== false;
        }
        if (ok) {
          vagaLiberada = false;
          meta.aguardando_experiencia_vaga_liberada = false;
        } else {
          warning = "Desmarquei o estado, mas a vaga não pôde ser re-segurada (provavelmente esgotou). Confira o estoque da experiência.";
        }
      } catch (e) {
        console.error("[admin-aguardando] falha ao re-segurar vaga", bookingId, String((e as { message?: string })?.message ?? e));
        warning = "Desmarquei o estado, mas não consegui re-segurar a vaga automaticamente. Confira o estoque da experiência.";
      }
    }
  }

  // ===== 3b. Cupom de crédito =====
  // deno-lint-ignore no-explicit-any
  const atual: any = (meta.aguardando_credito && typeof meta.aguardando_credito === "object")
    ? { ...meta.aguardando_credito }
    : null;
  let credito: Record<string, unknown> | null = null;
  let creditoNovo = false;

  if (aguardando) {
    const vigente = atual && atual.coupon_id && !atual.cancelado_at &&
      (!atual.valido_ate || new Date(atual.valido_ate).getTime() > Date.now());
    if (vigente) {
      // Religou e o cupom anterior ainda vale: reativa o mesmo código.
      const { error } = await admin.from("coupons").update({ is_active: true }).eq("id", atual.coupon_id);
      if (error) console.error("[admin-aguardando] erro reativando cupom", bookingId, error.message);
      credito = atual;
    } else {
      const porPessoa = pagoPorPessoa(bk, meta, qty);
      const valor = porPessoa != null ? porPessoa * qty : 0;
      if (valor > 0) {
        const validade = new Date(Date.now() + CREDITO_DIAS * 86400_000).toISOString();
        const ref = bookingId.slice(-8).toUpperCase();
        for (let tentativa = 0; tentativa < 3 && !credito; tentativa++) {
          const codigo = gerarCodigoCredito();
          const { data: cup, error: cupErr } = await admin.from("coupons").insert({
            code: codigo,
            nome: "Crédito de experiência guardada",
            descricao: "Crédito da reserva " + ref + " (aguardando experiência) — " + (bk.email ?? ""),
            discount_type: "value",
            discount_value: valor,
            valid_until: validade,
            max_uses: 1,
            is_active: true,
            created_by: caller.id,
            metadata: { origem: "aguardando_experiencia", booking_id: bookingId, email: bk.email ?? null },
          }).select("id").single();
          if (!cupErr && cup) {
            credito = {
              codigo,
              coupon_id: cup.id,
              valor_centavos: valor,
              valido_ate: validade,
              criado_at: new Date().toISOString(),
            };
            creditoNovo = true;
          } else {
            console.error("[admin-aguardando] erro criando cupom de crédito", bookingId, cupErr?.message);
          }
        }
        if (!credito) {
          warning = (warning ? warning + " " : "") +
            "Não consegui gerar o cupom de crédito. Tente desmarcar e marcar de novo.";
        }
      } else {
        warning = (warning ? warning + " " : "") +
          "Não achei o valor pago nessa reserva, então não gerei cupom de crédito. Crie um cupom manual se precisar.";
      }
    }
    if (credito) meta.aguardando_credito = credito;
  } else if (atual && atual.coupon_id && !atual.cancelado_at) {
    try {
      if (await creditoUsado(admin, atual.coupon_id)) {
        warning = (warning ? warning + " " : "") +
          "O cupom de crédito " + atual.codigo + " já foi usado numa nova reserva — continua valendo.";
        atual.usado = true;
      } else {
        const { error } = await admin.from("coupons").update({ is_active: false }).eq("id", atual.coupon_id);
        if (error) throw error;
        atual.cancelado_at = new Date().toISOString();
      }
      meta.aguardando_credito = atual;
    } catch (e) {
      console.error("[admin-aguardando] falha ao desativar cupom", bookingId, String((e as { message?: string })?.message ?? e));
      warning = (warning ? warning + " " : "") +
        "Não consegui desativar o cupom de crédito " + atual.codigo + ". Desative em Cupons.";
    }
  }

  // ===== 4. Histórico de auditoria no metadata =====
  const hist = Array.isArray(meta.aguardando_experiencia_history) ? meta.aguardando_experiencia_history.slice() : [];
  hist.push({
    at: new Date().toISOString(),
    by: caller.id,
    by_email: caller.email ?? null,
    aguardando,
    motivo: motivo || null,
    vaga_liberada: vagaLiberada,
    credito_codigo: credito ? credito.codigo : null,
  });
  meta.aguardando_experiencia_history = hist;

  // ===== 5. Persiste =====
  const update: Record<string, unknown> = {
    aguardando_experiencia: aguardando,
    aguardando_experiencia_at: aguardando ? (already ? (bk.aguardando_experiencia_at ?? new Date().toISOString()) : new Date().toISOString()) : null,
    metadata: meta,
  };
  const { error: updErr } = await admin.from("bookings").update(update).eq("id", bookingId);
  if (updErr) {
    console.error("[admin-aguardando] erro ao salvar", bookingId, updErr.message);
    return json({ ok: false, error: "update_failed", detail: updErr.message }, 500);
  }

  // E-mail com o código (só quando o cupom acabou de ser criado). É o
  // crédito que ela pediu — não é mensagem automática da reserva.
  if (creditoNovo && credito && bk.email) {
    try {
      await sendEmail({
        to: String(bk.email).trim(),
        subject: "Seu crédito Elarah de " + brl(Number(credito.valor_centavos)) + " 🎟",
        html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2b2420;">' +
          "<h2>Seu crédito na Elarah 🧡</h2>" +
          "<p>Oi" + (bk.nome ? ", " + String(bk.nome).split(" ")[0] : "") + "! Guardamos o valor da sua experiência" +
          (bk.experiencia_nome ? " <strong>" + String(bk.experiencia_nome) + "</strong>" : "") +
          " como crédito pra você escolher qualquer outra experiência da Elarah.</p>" +
          '<p style="font-size:22px;font-weight:bold;letter-spacing:1px;background:#fff3ea;border-radius:10px;padding:14px;text-align:center;">' + credito.codigo + "</p>" +
          "<p><strong>Valor:</strong> " + brl(Number(credito.valor_centavos)) + "<br><strong>Válido até:</strong> " + dataBR(String(credito.valido_ate)) + "</p>" +
          "<p>É só escolher a experiência no site e colar o código no campo de cupom na hora de reservar. Vale pra uma compra. O código também fica na sua conta, em Minhas compras.</p>" +
          "</div>",
      });
    } catch (e) {
      console.error("[admin-aguardando] falha ao enviar e-mail do crédito", bookingId, String((e as { message?: string })?.message ?? e));
    }
  }

  console.info(
    "[admin-aguardando] atualizado",
    "booking=" + bookingId,
    "aguardando=" + aguardando,
    "vaga_liberada=" + vagaLiberada,
    warning ? "warning=" + warning : "",
  );
  return json({
    ok: true,
    aguardando,
    vaga_liberada: vagaLiberada,
    warning,
    credito: meta.aguardando_credito ?? null,
    credito_novo: creditoNovo,
  });
});
