const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = "manfaz_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const ENCRYPTED_PREFIX = "enc:v1:";

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const values = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${bytesToHex(await hmac(secret, expiresAt))}`;
}

export async function verifySessionToken(
  secret: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  return equalBytes(base64UrlToBytes(hexToBase64Url(signature)), await hmac(secret, expiresAt));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBase64Url(value: string): string {
  const bytes = new Uint8Array(value.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? []);
  return bytesToBase64Url(bytes);
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(secret: string, value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(secret), encoder.encode(value)),
  );
  const tag = encrypted.slice(-16);
  const ciphertext = encrypted.slice(0, -16);
  return `${ENCRYPTED_PREFIX}${bytesToBase64Url(iv)}:${bytesToBase64Url(tag)}:${bytesToBase64Url(ciphertext)}`;
}

export async function decryptSecret(secret: string, value: string): Promise<string> {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
  const [, version, ivText, tagText, ciphertextText] = value.split(":");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText) {
    throw new Error("Stored secret has an invalid encryption format");
  }
  const encrypted = new Uint8Array([
    ...base64UrlToBytes(ciphertextText),
    ...base64UrlToBytes(tagText),
  ]);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(ivText) as unknown as ArrayBuffer },
    await encryptionKey(secret),
    encrypted,
  );
  return decoder.decode(plain);
}

export function parseCookies(header: string | null): Record<string, string> {
  return Object.fromEntries(
    (header ?? "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => Boolean(key))
      .map(([key, ...value]) => [key, decodeURIComponent(value.join("="))]),
  );
}

export async function isAdminRequest(request: Request, secret: string): Promise<boolean> {
  return verifySessionToken(secret, parseCookies(request.headers.get("cookie"))[SESSION_COOKIE]);
}

export async function sessionCookie(secret: string, sameSite: "lax" | "none"): Promise<string> {
  const token = await createSessionToken(secret);
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    `SameSite=${sameSite === "none" ? "None" : "Lax"}`,
    "Secure",
  ].join("; ");
}
// --- Platform user sessions -------------------------------------------------
// A separate cookie and a domain-separated signature ("user:<id>.<expiry>"),
// so an admin token can never be replayed as a user session or vice versa.
const USER_SESSION_COOKIE = "orxai_user";
const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

async function signUserSession(secret: string, userId: string, expiresAt: string): Promise<string> {
  return bytesToHex(await hmac(secret, `user:${userId}.${expiresAt}`));
}

export async function createUserSessionToken(secret: string, userId: string): Promise<string> {
  const expiresAt = String(Date.now() + USER_SESSION_MAX_AGE_SECONDS * 1000);
  return `${userId}.${expiresAt}.${await signUserSession(secret, userId, expiresAt)}`;
}

export async function verifyUserSessionToken(secret: string, token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const [userId, expiresAt, signature] = token.split(".");
  if (!userId || !expiresAt || !signature || Number(expiresAt) < Date.now()) return null;
  const expected = await signUserSession(secret, userId, expiresAt);
  return equalBytes(base64UrlToBytes(hexToBase64Url(signature)), base64UrlToBytes(hexToBase64Url(expected))) ? userId : null;
}

export async function getUserIdFromRequest(request: Request, secret: string): Promise<string | null> {
  return verifyUserSessionToken(secret, parseCookies(request.headers.get("cookie"))[USER_SESSION_COOKIE]);
}

export async function userSessionCookie(secret: string, userId: string): Promise<string> {
  const token = await createUserSessionToken(secret, userId);
  return [
    `${USER_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${USER_SESSION_MAX_AGE_SECONDS}`,
    "SameSite=None",
    "Secure",
  ].join("; ");
}

export function clearUserSessionCookie(): string {
  return `${USER_SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`;
}
