const PBKDF2_ITERATIONS = 100_000;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptMessage(
  plaintext: string,
  passphrase: string,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    enc.encode(plaintext),
  );

  const bundle = {
    v: 1,
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    data: bufToB64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(bundle);
}

export async function decryptMessage(
  encrypted: string,
  passphrase: string,
): Promise<string> {
  const bundle = JSON.parse(encrypted) as {
    salt: string;
    iv: string;
    data: string;
  };
  const key = await deriveKey(passphrase, b64ToBuf(bundle.salt));
  const iv = b64ToBuf(bundle.iv);
  const data = b64ToBuf(bundle.data);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(data),
  );
  return new TextDecoder().decode(plaintext);
}

export async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToB64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}
