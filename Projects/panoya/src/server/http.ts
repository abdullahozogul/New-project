import 'server-only';
import { NextResponse } from 'next/server';
import { FlowError } from './participants';
import { CODE_RE, normalizeCode } from './codes';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handle(fn: () => Promise<unknown>) {
  try {
    return json(await fn());
  } catch (e) {
    if (e instanceof FlowError) return json({ error: e.message }, e.status);
    console.error('[panoya] beklenmeyen hata', e);
    return json({ error: 'Sunucu hatası' }, 500);
  }
}

export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > maxBytes) throw new FlowError('İstek çok büyük', 413);
  try {
    const v = JSON.parse(text || '{}');
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error();
    return v;
  } catch {
    throw new FlowError('Geçersiz JSON', 400);
  }
}

export async function codeParam(params: Promise<{ code: string }>): Promise<string> {
  const code = normalizeCode(decodeURIComponent((await params).code));
  if (!CODE_RE.test(code)) throw new FlowError('Geçersiz katılımcı kodu', 404);
  return code;
}
