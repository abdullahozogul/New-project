'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Item } from '@/protocol/scales';
import { STUDY_HEADER } from '@/protocol/texts';
import { useRunner } from '@/experiment/RunnerContext';

export type Answers = Record<string, string | number | null>;

/** Sarı tasarım notu: yalnızca araştırmacı test kaydında ve notlar açıkken görünür (referans note()). */
export function Note({ children }: { children: ReactNode }) {
  const { showNotes } = useRunner();
  if (!showNotes) return null;
  return <div className="my-3 rounded border border-note-line bg-note-bg px-3 py-2 text-[13px] text-note-ink"><strong className="font-semibold">Tasarım notu.</strong> {children}</div>;
}

function Tag({ text }: { text?: string }) {
  const { showNotes } = useRunner();
  if (!text || !showNotes) return null;
  return <span className="ml-1.5 inline-block rounded-[3px] border border-note-line bg-note-bg px-1.5 align-[2px] text-[11px] font-semibold text-note-ink">{text}</span>;
}

/** Referans itemHtml(): tek soru. */
export function ItemField({ it, value, onChange, missing }: { it: Item; value: string | number | null | undefined; onChange: (v: string | number | null) => void; missing: boolean }) {
  const num = it.num !== undefined && it.num !== '' ? <span className="mr-1 text-r-muted">{it.num}.</span> : null;
  const legend = <legend className={`mb-2.5 w-full p-0 text-[15px] ${missing ? 'text-bad' : ''}`}>{num}{it.text}<Tag text={it.tag} /></legend>;
  const fs = `border-0 border-t border-r-line pb-3.5 pt-4 first-of-type:border-t-0 m-0`;
  if (it.type === 'likert') {
    const mw = it.n <= 5 ? '420px' : it.n <= 7 ? '540px' : '100%';
    return (
      <fieldset className={fs} data-id={it.id} data-missing={missing || undefined}>
        {legend}
        <div className="r-scale" style={{ ['--n' as string]: it.n, ['--mw' as string]: mw }}>
          {Array.from({ length: it.n }, (_, k) => k + 1).map((k) => (
            <label key={k}><input type="radio" name={it.id} value={k} checked={value === k} onChange={() => onChange(k)} aria-label={`${k}`} /><span>{k}</span></label>
          ))}
        </div>
        <div className="mt-[5px] flex justify-between gap-3 text-[12.5px] text-r-muted" style={{ maxWidth: mw }}><span>{it.lo}</span><span className="text-right">{it.hi}</span></div>
      </fieldset>
    );
  }
  if (it.type === 'choice') {
    return (
      <fieldset className={fs} data-id={it.id} data-missing={missing || undefined}>
        {legend}
        <div className="flex flex-col gap-1.5">
          {it.options.map((o) => (
            <label key={o} className="r-choice"><input type="radio" name={it.id} value={o} checked={value === o} onChange={() => onChange(o)} /><span>{o}</span></label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (it.type === 'select') {
    return (
      <fieldset className={fs} data-id={it.id} data-missing={missing || undefined}>
        {legend}
        <select className="r-in" name={it.id} id={`f_${it.id}`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Seçiniz</option>
          {it.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </fieldset>
    );
  }
  if (it.type === 'number') {
    return (
      <fieldset className={fs} data-id={it.id} data-missing={missing || undefined}>
        {legend}
        <input className="r-in max-w-[140px]" type="number" inputMode="numeric" min={it.minv} max={it.maxv} name={it.id} id={`f_${it.id}`} value={value ?? ''}
          onChange={(e) => onChange(e.target.value.trim() === '' ? null : Number(e.target.value))} />
      </fieldset>
    );
  }
  if (it.type === 'text') {
    return (
      <fieldset className={fs} data-id={it.id} data-missing={missing || undefined}>
        {legend}
        <textarea className="r-in min-h-24 resize-y" name={it.id} id={`f_${it.id}`} rows={it.rows ?? 4} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
      </fieldset>
    );
  }
  return (
    <fieldset className={fs} data-id={it.id} data-missing={missing || undefined}>
      {legend}
      <input className="r-in" type="text" name={it.id} id={`f_${it.id}`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    </fieldset>
  );
}

/** Referans collect(): boş metin null, sayı Number; doldurma yapılmaz. Tüm maddeler zorunlu. */
export function collect(items: Item[], ans: Answers): { out: Answers; missing: string[] } {
  const out: Answers = {};
  const missing: string[] = [];
  items.forEach((it) => {
    let v = ans[it.id] ?? null;
    if (typeof v === 'string') { v = v.trim(); if (v === '') v = null; }
    if (it.type === 'number' && typeof v === 'number' && !Number.isFinite(v)) v = null;
    out[it.id] = v;
    if (v === null) missing.push(it.id);
  });
  return { out, missing };
}

/** Soru bloğu + eksik vurgulama; form gövdesi olarak kullanılır. */
export function useSurvey(items: Item[]) {
  const [ans, setAns] = useState<Answers>({});
  const [missing, setMissing] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const block = (
    <div ref={containerRef}>
      {items.map((it) => (
        <ItemField key={it.id} it={it} value={ans[it.id]} missing={missing.includes(it.id)} onChange={(v) => { setAns((a) => ({ ...a, [it.id]: v })); setMissing((m) => m.filter((x) => x !== it.id)); }} />
      ))}
    </div>
  );
  const check = (extraMissing: string[] = []) => {
    const { out, missing: miss } = collect(items, ans);
    const all = miss.concat(extraMissing);
    setMissing(all);
    if (all.length) {
      requestAnimationFrame(() => containerRef.current?.querySelector(`[data-id="${all[0]}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return null;
    }
    return out;
  };
  return { block, check, hasMissing: missing.length > 0, ans };
}

export function ResearchShell({ progress, children }: { progress: number; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-r-bg text-r-ink">
      <div className="bg-r-head text-[#f1f3f2]">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
          <span className="font-semibold tracking-[.01em]">{STUDY_HEADER.name}</span><span>{STUDY_HEADER.institution}</span>
        </div>
      </div>
      <div className="h-1 bg-[#cfd4d2]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="İlerleme">
        <i className="block h-full bg-r-accent transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <main className="mx-auto max-w-[760px] px-4 pb-12 pt-[22px]">{children}</main>
    </div>
  );
}

export function ResearchCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[3px] border border-r-line bg-r-paper px-[26px] py-6 max-[520px]:px-4 max-[520px]:py-[18px] ${className}`}>{children}</div>;
}

export function RBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="submit" {...rest} className={`rounded-[3px] bg-r-accent px-[26px] py-2.5 text-[15px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${rest.className ?? ''}`}>{children}</button>;
}

/** Süre dolana kadar pasif kalan düğme durumu (referans minSec / holdButton). */
export function useHold(minSec: number | undefined, sinceMs?: number) {
  const [ready, setReady] = useState(!minSec);
  useEffect(() => {
    if (!minSec) return;
    const t0 = sinceMs ?? performance.now();
    const tick = () => { if ((performance.now() - t0) / 1000 >= minSec) { setReady(true); return true; } return false; };
    if (tick()) return;
    const iv = setInterval(() => { if (tick()) clearInterval(iv); }, 250);
    return () => clearInterval(iv);
  }, [minSec, sinceMs]);
  return ready;
}

export interface ResearchPageProps {
  progress: number;
  section?: string;
  title?: string;
  lead?: ReactNode;
  pre?: ReactNode;
  items: Item[];
  button?: string;
  minSec?: number;
  validate?: (out: Answers) => string[];
  after?: ReactNode;
  onDone: (out: Answers & { rt_sn: number }) => void;
}

/** Referans researchPage(): araştırma ekranında tek sayfa. */
export function ResearchPage(p: ResearchPageProps) {
  const t0 = useRef(performance.now());
  const { block, check, hasMissing, ans } = useSurvey(p.items);
  const ready = useHold(p.minSec, t0.current);
  const [busy, setBusy] = useState(false);
  const [extraErr, setExtraErr] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <ResearchShell progress={p.progress}>
      <ResearchCard>
        {p.section ? <p className="mb-1 text-xs font-semibold uppercase tracking-[.06em] text-r-muted">{p.section}</p> : null}
        {p.title ? <h2 className="mb-1.5 text-[19px] font-[650] [text-wrap:balance]">{p.title}</h2> : null}
        {p.lead ? <p className="mb-3.5 text-r-muted">{p.lead}</p> : null}
        {p.pre}
        <form noValidate onSubmit={(e) => {
          e.preventDefault();
          if (!ready || busy) return;
          const ext = p.validate ? p.validate(ans) : [];
          setExtraErr(ext.length > 0);
          const res = check(ext);
          if (!res) return;
          setBusy(true);
          p.onDone({ ...res, rt_sn: Math.round((performance.now() - t0.current) / 100) / 10 });
        }}>
          {block}
          {hasMissing || extraErr ? <div role="alert" className="mt-2.5 text-[13.5px] text-bad">Lütfen işaretlenmemiş soruları yanıtlayınız.</div> : null}
          <div className="mt-[18px] flex items-center justify-end gap-3">
            {!ready ? <span className="text-[13px] text-r-muted">Lütfen bekleyiniz…</span> : null}
            <RBtn disabled={!ready || busy}>{p.button ?? 'Devam'}</RBtn>
          </div>
        </form>
      </ResearchCard>
      {p.after}
    </ResearchShell>
  );

}

/** Platform ekranının altına gömülü araştırma paneli (referans .r-panel). */
export function ResearchPanel({ head, headRight, children }: { head: string; headRight?: string; children: ReactNode }) {
  return (
    <div className="mt-5 rounded-[3px] border border-r-line border-t-4 border-t-r-head bg-r-paper text-r-ink" data-testid="research-panel">
      <div className="flex flex-wrap justify-between gap-2.5 border-b border-r-line bg-[#f3f4f3] px-4 py-2 text-[12.5px] text-r-muted"><span>{head}</span>{headRight ? <span>{headRight}</span> : null}</div>
      <div className="px-[18px] pb-[18px] pt-1">{children}</div>
    </div>
  );
}
