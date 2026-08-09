const SECRET_ENV_KEY = "PAYMENT_SETTINGS_ENCRYPTION_KEY";

function getEncryptionSecret() {
  return process.env[SECRET_ENV_KEY] || process.env["AUTH_SECRET"] || "";
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getKey() {
  const secret = getEncryptionSecret();
  if (!secret) return null;

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function canEncryptSecrets() {
  return Boolean(getEncryptionSecret());
}

export async function encryptSecret(value: string) {
  const key = await getKey();
  if (!key) throw new Error(`${SECRET_ENV_KEY} or AUTH_SECRET is required to store secrets`);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value)),
  );

  return `${toBase64(iv)}:${toBase64(encrypted)}`;
}

export async function decryptSecret(value: string) {
  const key = await getKey();
  if (!key) return null;

  const [rawIv, rawEncrypted] = value.split(":");
  if (!rawIv || !rawEncrypted) return null;

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(rawIv) },
      key,
      fromBase64(rawEncrypted),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}
