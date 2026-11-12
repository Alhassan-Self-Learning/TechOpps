/**
 * Single-password login for hosted deployments.
 *
 * Enabled only when APP_PASSWORD is set (on Vercel). The session cookie holds an expiry time
 * and an HMAC-SHA256 signature of it, keyed with SESSION_SECRET. Uses Web Crypto so it runs in
 * both the proxy and route handlers.
 */

export const SESSION_COOKIE = "techopps_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function secretKeyMaterial(): string {
  // SESSION_SECRET is recommended; falling back to the password keeps setup to one variable.
  return process.env.SESSION_SECRET || `techopps-session:${process.env.APP_PASSWORD ?? ""}`;
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKeyMaterial()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/** Constant-time comparison of two strings (no early exit on the first difference). */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function createSessionValue(now: number = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS;
  return `${expires}.${await sign(String(expires))}`;
}

export async function verifySessionValue(
  value: string | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) * 1000 < now) return false;
  return safeEqual(signature, await sign(expires));
}

/** Compares the submitted password by hashing both sides, so timing doesn't leak length. */
export async function passwordMatches(submitted: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected) return false;
  const [a, b] = await Promise.all(
    [submitted, expected].map(async (s) => toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(s)))),
  );
  return safeEqual(a, b);
}
