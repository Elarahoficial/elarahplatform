// =============================================================
// ELARAH — Criptografia de tokens (AES-GCM)
// -------------------------------------------------------------
// Cripto simétrica via Web Crypto API (nativa do Deno). A chave
// (256 bits, base64) fica em variável de ambiente
// META_TOKEN_ENCRYPTION_KEY — só Edge Functions a leem.
//
// Formato armazenado: base64( 12B IV ‖ ciphertext ‖ 16B tag )
// AES-GCM já embute o tag no final do ciphertext (Web Crypto faz
// isso por padrão). Então só precisamos prefixar o IV.
//
// Por que AES-GCM e não outro:
//   - Nativo no Web Crypto (zero deps).
//   - Authenticated encryption (impossível alterar cipher sem o
//     decrypt falhar — protege contra adulteração no banco).
//   - Padrão usado por Stripe, AWS KMS etc.
// =============================================================

const ALGO = "AES-GCM";
const IV_BYTES = 12;

// Cache da CryptoKey importada (evita re-importar a cada chamada).
let _cachedKey: CryptoKey | null = null;
let _cachedKeySource: string | null = null;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function loadKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("META_TOKEN_ENCRYPTION_KEY");
  if (!raw) {
    throw new Error(
      "META_TOKEN_ENCRYPTION_KEY não configurada — gere com: " +
      "openssl rand -base64 32",
    );
  }
  if (_cachedKey && _cachedKeySource === raw) return _cachedKey;

  const keyBytes = base64ToBytes(raw);
  if (keyBytes.length !== 32) {
    throw new Error(
      `META_TOKEN_ENCRYPTION_KEY tem ${keyBytes.length} bytes — esperado 32 ` +
      "(256 bits). Gere com: openssl rand -base64 32",
    );
  }

  _cachedKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGO },
    false,
    ["encrypt", "decrypt"],
  );
  _cachedKeySource = raw;
  return _cachedKey;
}

export async function encryptToken(plaintext: string): Promise<string> {
  if (!plaintext) throw new Error("encryptToken: plaintext vazio");
  const key = await loadKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: ALGO, iv }, key, data),
  );

  const blob = new Uint8Array(iv.length + cipher.length);
  blob.set(iv, 0);
  blob.set(cipher, iv.length);
  return bytesToBase64(blob);
}

export async function decryptToken(encoded: string): Promise<string> {
  if (!encoded) throw new Error("decryptToken: ciphertext vazio");
  const key = await loadKey();
  const blob = base64ToBytes(encoded);
  if (blob.length <= IV_BYTES) {
    throw new Error("decryptToken: payload muito curto");
  }
  const iv = blob.slice(0, IV_BYTES);
  const cipher = blob.slice(IV_BYTES);
  const plain = await crypto.subtle.decrypt({ name: ALGO, iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

// Gera um state CSRF aleatório seguro pra fluxo OAuth.
// 32 bytes em hex = 64 chars. Suficiente pra resistir a brute-force.
export function generateOAuthState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
