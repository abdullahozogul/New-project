import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/server/auth';

/** Araştırmacı paneli ve yönetim API'si oturum gerektirir; katılımcı ekranlarından tamamen ayrıdır. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/arastirmaci/giris' || pathname === '/api/admin/login') return NextResponse.next();
  const ok = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/arastirmaci/giris';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/arastirmaci/:path*', '/api/admin/:path*'] };
