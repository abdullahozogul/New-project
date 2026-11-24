import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, checkPassword, createSessionToken } from '@/server/auth';

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'yerel';
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return NextResponse.json({ error: 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyiniz.' }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const pw = String(form?.get('password') ?? '');
  let okPw = false;
  try {
    okPw = await checkPassword(pw);
  } catch {
    // ADMIN_PASSWORD / SESSION_SECRET ortam değişkenleri eksik ya da kısa.
    return NextResponse.redirect(new URL('/arastirmaci/giris?hata=ayar', req.url), 303);
  }
  if (!okPw) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
    return NextResponse.redirect(new URL('/arastirmaci/giris?hata=1', req.url), 303);
  }
  attempts.delete(ip);
  const { token, maxAge } = await createSessionToken();
  const res = NextResponse.redirect(new URL('/arastirmaci', req.url), 303);
  res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' && !req.url.startsWith('http://localhost'), path: '/', maxAge });
  return res;
}
