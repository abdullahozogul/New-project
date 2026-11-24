'use client';
import type { CompanyResponse } from '@/protocol/conditions';
import type { Mail, MailboxStage } from '@/protocol/emails';
import type { ParticipantView } from './types';

async function call<T>(url: string, init?: RequestInit, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store' });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(body.error || `Sunucu hatası (${r.status})`) as Error & { status?: number };
        err.status = r.status;
        if (r.status < 500) throw err; // istemci hatası: yeniden deneme yok
        lastErr = err;
      } else return body as T;
    } catch (e) {
      const st = (e as { status?: number }).status;
      if (st && st < 500) throw e;
      lastErr = e;
    }
    await new Promise((res) => setTimeout(res, 600 * 2 ** i));
  }
  throw lastErr instanceof Error ? lastErr : new Error('Bağlantı hatası');
}

const base = (code: string) => `/api/p/${encodeURIComponent(code)}`;

export const api = {
  start: (code: string) => call<ParticipantView>(`${base(code)}/start`, { method: 'POST', body: '{}' }),
  submit: (code: string, stepId: string, data: Record<string, unknown>, startedAt: string) =>
    call<ParticipantView>(`${base(code)}/step`, { method: 'POST', body: JSON.stringify({ stepId, data, startedAt, finishedAt: new Date().toISOString() }) }),
  companyResponse: (code: string, stepId: string, elapsedSec: number) =>
    call<CompanyResponse>(`${base(code)}/company-response`, { method: 'POST', body: JSON.stringify({ stepId, elapsedSec }) }),
  mailbox: (code: string, stage: MailboxStage) => call<{ mails: Mail[]; fresh: string | null; clock: string; recipient: string }>(`${base(code)}/mailbox?stage=${stage}`),
  event: (code: string, type: string, stepId: string | null, payload: Record<string, unknown> = {}) =>
    call<{ ok: true }>(`${base(code)}/event`, { method: 'POST', body: JSON.stringify({ type, stepId, payload, clientTs: new Date().toISOString() }) }, 1).catch(() => undefined),
  reset: (code: string) => call<{ ok: true }>(`${base(code)}/reset`, { method: 'POST', body: '{}' }, 0),
};
