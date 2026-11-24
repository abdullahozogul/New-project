import Link from 'next/link';
import type { ReactNode } from 'react';
import { COND_LABEL, type Condition } from '@/protocol/conditions';

export function PageHead({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-semibold">{title}</h1>{sub ? <p className="mt-0.5 text-sm text-r-muted">{sub}</p> : null}</div>
      {right}
    </div>
  );
}

export function Card({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return <section className={`rounded-lg border border-[#dde1e3] bg-white p-4 ${className}`}>{title ? <h2 className="mb-3 text-sm font-semibold">{title}</h2> : null}{children}</section>;
}

export function ScopeTabs({ base, scope, extra = {} }: { base: string; scope: string; extra?: Record<string, string> }) {
  const tabs: [string, string][] = [['gercek', 'Gerçek katılımcılar'], ['test', 'Test kayıtları'], ['tumu', 'Tümü']];
  return (
    <div className="inline-flex rounded-md border border-[#d5d9dc] bg-white p-0.5 text-sm">
      {tabs.map(([k, l]) => <Link key={k} href={{ pathname: base, query: { ...extra, kapsam: k } }} className={`rounded px-3 py-1.5 ${scope === k ? 'bg-r-accent font-semibold text-white' : 'text-r-muted hover:text-r-ink'}`}>{l}</Link>)}
    </div>
  );
}

const STATUS: Record<string, [string, string]> = {
  olusturuldu: ['Başlamadı', 'bg-[#eef0f3] text-[#5c6576]'],
  devam: ['Devam ediyor', 'bg-[#e7f0fa] text-[#0b5cad]'],
  tamamlandi: ['Tamamlandı', 'bg-ok-soft text-ok'],
  iptal: ['İptal', 'bg-bad-soft text-bad'],
};
export function StatusBadge({ s }: { s: string }) {
  const [l, c] = STATUS[s] ?? [s, ''];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{l}</span>;
}

const COND_CLS: Record<Condition, string> = { ret: 'bg-[#e8eef7] text-[#2d4f7c]', sahte: 'bg-[#f6ecdf] text-[#7a4b12]', ghosting: 'bg-[#efe8f4] text-[#5b3a73]' };
export function CondBadge({ c }: { c: Condition }) {
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold ${COND_CLS[c]}`}>{COND_LABEL[c]}</span>;
}
export function TestBadge() {
  return <span className="inline-block rounded border border-note-line bg-note-bg px-1.5 py-0.5 text-[11px] font-semibold text-note-ink">TEST</span>;
}

export function fmt(d: Date | string | null | undefined) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(d));
}
