// ===== Acompanhantes =====
// Normaliza a lista de acompanhantes (pessoas além do titular) que vai pra
// coluna dedicada `acompanhantes` (jsonb) da tabela `bookings`.
//
// Formato de saída (exatamente como o checkout pede):
//   [{ "nome": "Maria", "telefone": "11999999999" }]
// telefone = só dígitos, com DDD + número (>= 10 dígitos).
//
// Fonte dos dados, em ordem de preferência:
//   1) payload.acompanhantes — array explícito enviado pelo formulário de
//      checkout (já no formato { nome, telefone }).
//   2) participantes — array com o titular no índice 0 e os acompanhantes
//      em 1..N (cada item pode ter telefone_digits/telefone). Nesse caso
//      descartamos o índice 0 (comprador) e usamos o restante.

export interface Acompanhante {
  nome: string;
  telefone: string;
}

// Um DDD válido no Brasil vai de 11 a 99; com 8 ou 9 dígitos de número
// local, o total fica em 10 ou 11 dígitos. Exigimos >= 10 pra garantir
// que veio DDD + número (nunca só o número solto).
const MIN_PHONE_DIGITS = 10;

export function buildAcompanhantes(
  payload: Record<string, unknown>,
  participantes: unknown,
): Acompanhante[] {
  const explicit = payload?.acompanhantes;
  const source: unknown[] =
    Array.isArray(explicit) && explicit.length
      ? explicit
      : Array.isArray(participantes)
      ? participantes.slice(1)
      : [];

  return source
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      const nome = o.nome != null ? String(o.nome).trim() : "";
      const telefone = String(o.telefone_digits ?? o.telefone ?? "").replace(
        /\D+/g,
        "",
      );
      return { nome, telefone };
    })
    .filter((p) => p.nome.length > 0 && p.telefone.length >= MIN_PHONE_DIGITS);
}
