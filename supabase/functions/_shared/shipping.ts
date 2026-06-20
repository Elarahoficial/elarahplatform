// =============================================================
// ELARAH — Shipping (frete) compartilhado entre Edge Functions
// -------------------------------------------------------------
// Dois modos, escolhidos automaticamente:
//
//   (A) MELHOR ENVIO (quando MELHOR_ENVIO_TOKEN está setado) — preços
//       reais de Correios (PAC/SEDEX) e transportadoras via API. Este
//       é o caminho de produção: assim que o token da conta Melhor
//       Envio é configurado nos secrets do Supabase, o site passa a
//       somar o frete real automaticamente. Aponta pra PRODUÇÃO por
//       padrão; use MELHOR_ENVIO_BASE=sandbox só pra testar.
//
//   (B) ESTIMATIVA (default, sem credenciais) — tabela por região
//       a partir do 1º dígito do CEP de destino. Funciona na hora,
//       valores aproximados. É a ponte enquanto o token não está
//       configurado: já cobra um frete (não fica grátis), mas o
//       preço exato só vem do Melhor Envio (modo A).
//
// Frete grátis continua disponível via SHIPPING_MODE=free (coleta o
// endereço, mas não cobra envio) — usado em promoções pontuais.
//
// Origem do envio: SHIPPING_ORIGIN_CEP (default = CEP de São Paulo).
// Peso/dimensões default pensados pra um kit pequeno (~1kg).
//
// Segurança: o checkout SEMPRE recalcula o frete por aqui no servidor
// (não confia no valor que veio do cliente).
// =============================================================

export interface ShippingOption {
  service: string; // "PAC", "SEDEX", "Frete grátis" ou nome da transportadora
  carrier: string; // "Correios", "Elarah", etc.
  cost_centavos: number;
  delivery_days: number;
  source: "estimativa" | "melhor_envio" | "gratis";
}

export interface ShippingPackage {
  weight_kg?: number;
  width_cm?: number;
  height_cm?: number;
  length_cm?: number;
}

const ORIGIN_CEP = (Deno.env.get("SHIPPING_ORIGIN_CEP") ?? "01310-100").replace(/\D+/g, "");
const MELHOR_ENVIO_TOKEN = Deno.env.get("MELHOR_ENVIO_TOKEN") ?? "";
// Aponta pra PRODUÇÃO por padrão (preços reais). Defina
// MELHOR_ENVIO_BASE=https://sandbox.melhorenvio.com.br só pra testar.
const MELHOR_ENVIO_BASE =
  (Deno.env.get("MELHOR_ENVIO_BASE") ?? "https://www.melhorenvio.com.br").replace(/\/+$/, "");
// Modo de frete quando NÃO há token do Melhor Envio:
//   "estimate" → tabela de estimativa por região (default — já cobra
//                frete aproximado, nunca fica grátis sem querer)
//   "free"     → frete grátis (coleta endereço mesmo assim; use em
//                promoções pontuais)
const SHIPPING_MODE = (Deno.env.get("SHIPPING_MODE") ?? "estimate").toLowerCase();

const DEFAULT_PKG: Required<ShippingPackage> = {
  weight_kg: 1,
  width_cm: 20,
  height_cm: 15,
  length_cm: 20,
};

// Tabela de estimativa por macro-região (1º dígito do CEP de destino).
// Origem assumida: São Paulo. Valores em centavos pra um pacote ~1kg.
// Aproximados — só pra validar; o real vem do Melhor Envio.
const REGION_TABLE: Record<string, { pac: number; sedex: number; pacDays: number; sedexDays: number }> = {
  "0": { pac: 1900, sedex: 2900, pacDays: 3, sedexDays: 1 }, // SP (grande SP / interior)
  "1": { pac: 1900, sedex: 2900, pacDays: 3, sedexDays: 1 }, // SP capital / interior
  "2": { pac: 2500, sedex: 3900, pacDays: 4, sedexDays: 2 }, // RJ / ES
  "3": { pac: 2400, sedex: 3700, pacDays: 4, sedexDays: 2 }, // MG
  "4": { pac: 3600, sedex: 5400, pacDays: 7, sedexDays: 3 }, // BA / SE
  "5": { pac: 3900, sedex: 5900, pacDays: 8, sedexDays: 4 }, // PE / AL / PB / RN
  "6": { pac: 4500, sedex: 6900, pacDays: 10, sedexDays: 5 }, // CE / Norte
  "7": { pac: 3400, sedex: 5200, pacDays: 6, sedexDays: 3 }, // DF / Centro-Oeste
  "8": { pac: 2600, sedex: 4200, pacDays: 5, sedexDays: 2 }, // PR / SC
  "9": { pac: 3200, sedex: 4900, pacDays: 6, sedexDays: 3 }, // RS
};

function cleanCep(cep: string): string {
  return String(cep ?? "").replace(/\D+/g, "");
}

export function isValidCep(cep: string): boolean {
  return cleanCep(cep).length === 8;
}

// Estimativa local — nunca falha, sempre devolve PAC + SEDEX.
export function estimateShipping(cepDest: string, pkg: ShippingPackage = {}): ShippingOption[] {
  const cep = cleanCep(cepDest);
  const region = REGION_TABLE[cep[0] ?? "1"] ?? REGION_TABLE["1"];
  // Acréscimo simples por peso acima de 1kg.
  const weight = Math.max(0.1, Number(pkg.weight_kg ?? DEFAULT_PKG.weight_kg));
  const extraKg = Math.max(0, Math.ceil(weight - 1));
  const extra = extraKg * 600; // +R$6 por kg extra
  return [
    {
      service: "PAC",
      carrier: "Correios",
      cost_centavos: region.pac + extra,
      delivery_days: region.pacDays,
      source: "estimativa",
    },
    {
      service: "SEDEX",
      carrier: "Correios",
      cost_centavos: region.sedex + extra,
      delivery_days: region.sedexDays,
      source: "estimativa",
    },
  ];
}

// Melhor Envio — preços reais. Em qualquer erro, cai na estimativa.
async function melhorEnvioShipping(
  cepDest: string,
  pkg: ShippingPackage,
  token: string,
): Promise<ShippingOption[]> {
  const p = { ...DEFAULT_PKG, ...pkg };
  try {
    const resp = await fetch(`${MELHOR_ENVIO_BASE}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "Elarah (contato.elarah@gmail.com)",
      },
      body: JSON.stringify({
        from: { postal_code: ORIGIN_CEP },
        to: { postal_code: cleanCep(cepDest) },
        package: {
          weight: p.weight_kg,
          width: p.width_cm,
          height: p.height_cm,
          length: p.length_cm,
        },
      }),
    });
    if (!resp.ok) {
      console.warn("[Elarah Shipping] Melhor Envio HTTP", resp.status, "→ fallback estimativa");
      return estimateShipping(cepDest, pkg);
    }
    const data = await resp.json();
    if (!Array.isArray(data)) return estimateShipping(cepDest, pkg);
    const options: ShippingOption[] = data
      .filter((s: Record<string, unknown>) => s && !s.error && s.price)
      .map((s: Record<string, unknown>) => ({
        service: String(s.name ?? "Frete"),
        carrier: String((s.company as Record<string, unknown> | undefined)?.name ?? "Correios"),
        cost_centavos: Math.round(Number(s.price) * 100),
        delivery_days: Number(s.delivery_time ?? 0),
        source: "melhor_envio" as const,
      }))
      .filter((o: ShippingOption) => o.cost_centavos > 0);
    return options.length ? options : estimateShipping(cepDest, pkg);
  } catch (e) {
    console.warn("[Elarah Shipping] Melhor Envio erro", e, "→ fallback estimativa");
    return estimateShipping(cepDest, pkg);
  }
}

// Frete grátis — uma opção só, custo zero. Coletamos o endereço do
// mesmo jeito (necessário pra postar), mas não cobramos pelo envio.
function freeShipping(): ShippingOption[] {
  return [{
    service: "Frete grátis",
    carrier: "Elarah",
    cost_centavos: 0,
    delivery_days: 0,
    source: "gratis",
  }];
}

// Ponto de entrada: devolve as opções de frete pro CEP.
//   1) Tem token Melhor Envio → preços reais dos Correios (produção).
//   2) SHIPPING_MODE=free → frete grátis (promoção pontual).
//   3) Senão → tabela de estimativa por região (default).
export async function getShippingOptions(
  cepDest: string,
  pkg: ShippingPackage = {},
  runtimeToken?: string | null,
): Promise<ShippingOption[]> {
  if (!isValidCep(cepDest)) return [];
  // Token do OAuth (runtimeToken, vindo do banco) tem prioridade. O
  // MELHOR_ENVIO_TOKEN do ambiente continua funcionando como fallback
  // (útil pra testes com token estático).
  const token = (runtimeToken && runtimeToken.trim()) || MELHOR_ENVIO_TOKEN;
  if (token) return await melhorEnvioShipping(cepDest, pkg, token);
  if (SHIPPING_MODE === "free") return freeShipping();
  return estimateShipping(cepDest, pkg);
}

// Recalcula o custo de UM serviço escolhido (usado pelo checkout pra
// não confiar no valor do cliente). Match case-insensitive pelo nome.
export async function quoteForService(
  cepDest: string,
  service: string,
  pkg: ShippingPackage = {},
  runtimeToken?: string | null,
): Promise<ShippingOption | null> {
  const options = await getShippingOptions(cepDest, pkg, runtimeToken);
  if (!options.length) return null;
  const want = String(service ?? "").trim().toLowerCase();
  const found = options.find((o) => o.service.trim().toLowerCase() === want);
  return found ?? null;
}
