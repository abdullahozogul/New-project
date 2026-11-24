/**
 * Araştırmacı paneli oturumu: ADMIN_PASSWORD ile giriş, HMAC-SHA256 imzalı ve süreli çerez.
 * Web Crypto kullanır; hem Node hem middleware (edge) ortamında çalışır.
 */
export const ADMIN_COOKIE = 'panoya_arastirmaci';
const TTL_SEC = 12 * 3600;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET en az 32 karakter olmalıdır');
  return s;
}

function b64url(buf: ArrayBuffer): string {
  let s = '';
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createSessionToken(): Promise<{ token: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payload = `v1.${exp}`;
  return { token: `${payload}.${await hmac(payload)}`, maxAge: TTL_SEC };
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  try {
    return safeEqual(parts[2], await hmac(`${parts[0]}.${parts[1]}`));
  } catch {
    return false;
  }
}

export async function checkPassword(input: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 12) throw new Error('ADMIN_PASSWORD en az 12 karakter olmalıdır');
  // Sabit süreli karşılaştırma için iki değerin özetini karşılaştır.
  const [a, b] = await Promise.all([hmac(`pw:${input}`), hmac(`pw:${pw}`)]);
  return safeEqual(a, b);
}
