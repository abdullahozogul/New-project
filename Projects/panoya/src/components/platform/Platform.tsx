'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ADS, AD_FIXED, type Ad, type AdKey } from '@/protocol/ads';
import { COVER_LETTER_MIN } from '@/protocol/scales';
import type { AppRow } from '@/experiment/types';
import { Icon } from '@/components/Icon';
import { CompanyLogo } from './CompanyLogo';

export function Logo({ href }: { href?: string }) {
  const inner = (
    <span className="flex items-center gap-2 text-[21px] font-bold tracking-tight text-p-accent">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden><rect width="26" height="26" rx="6" fill="#0b5cad" /><rect x="6.5" y="7" width="13" height="10" rx="2" fill="none" stroke="#fff" strokeWidth="2" /><path d="M10 20h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
      panoya
    </span>
  );
  return href ? <Link href={href} aria-label="panoya ana sayfa">{inner}</Link> : inner;
}

type NavKey = 'ilanlar' | 'sirketler' | 'basvurular' | 'mesajlar';

/**
 * Platform üst çubuğu. Deney akışında (`inert`) gezinme bağlantıları görseldir; katılımcı akış dışına çıkamaz
 * (referans davranışı). Vitrin sayfalarında bağlantılar çalışır.
 */
export function PlatformHeader({ active, q = '', badge = 0, inert = false }: { active?: NavKey; q?: string; badge?: number; inert?: boolean }) {
  const nav: [NavKey, string, string, IconNameish][] = [
    ['ilanlar', 'İş İlanları', '/ilanlar', 'briefcase'],
    ['basvurular', 'Başvurularım', '/giris', 'file'],
    ['mesajlar', 'Mesajlar', '/giris', 'mail'],
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-p-line bg-white">
      <div className="wrap flex min-h-14 flex-wrap items-center gap-x-5 gap-y-2 py-1.5 max-[520px]:py-2">
        <Logo href={inert ? undefined : '/'} />
        <form role="search" className="flex min-w-[180px] max-w-[440px] flex-1 overflow-hidden rounded border border-p-line bg-p-bg max-[520px]:order-3 max-[520px]:max-w-none max-[520px]:basis-full" action={inert ? undefined : '/ilanlar'} onSubmit={inert ? (e) => e.preventDefault() : undefined}>
          <span className="grid place-items-center pl-2.5 text-p-muted"><Icon name="search" size={16} /></span>
          <input name="q" aria-label="İlan ara" placeholder="Pozisyon, şirket veya anahtar kelime" defaultValue={q} readOnly={inert} className="min-w-0 flex-1 bg-transparent px-2 py-[7px] text-sm outline-none" />
          <button type={inert ? 'button' : 'submit'} className="bg-p-accent px-3.5 text-[13px] font-semibold text-white">Ara</button>
        </form>
        <nav className="ml-auto flex gap-0.5 max-[520px]:order-4 max-[520px]:ml-0 max-[520px]:basis-full max-[520px]:overflow-x-auto" aria-label="Ana menü">
          {nav.map(([k, label, href, icon]) => {
            const cls = `relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 pb-[14px] pt-[16px] text-sm max-[860px]:px-2 max-[860px]:pb-2.5 max-[860px]:pt-3 ${k === active ? 'border-p-ink font-semibold text-p-ink' : 'border-transparent text-p-muted hover:text-p-ink'}`;
            const content = (
              <>
                <Icon name={icon as never} size={16} className="max-[520px]:hidden" />
                {label}
                {k === 'mesajlar' && badge > 0 ? <span data-testid="msg-badge" className="-ml-0.5 rounded-full bg-bad px-[5px] text-[10.5px] font-bold leading-4 text-white">{badge}</span> : null}
              </>
            );
            return inert ? <span key={k} className={cls} data-nav={k} aria-current={k === active ? 'page' : undefined}>{content}</span> : <Link key={k} href={href} className={cls}>{content}</Link>;
          })}
        </nav>
        <span className="grid size-8 place-items-center rounded-full bg-[#c9d3df] text-[#2b3644] max-[520px]:ml-auto max-[520px]:order-2" title="Profil"><Icon name="user" size={16} /></span>
      </div>
    </header>
  );
}
type IconNameish = string;

export function adLogo(ad: Ad, size = 56) {
  return <CompanyLogo ini={ad.ini} color={ad.color} mark={ad.key} size={size} label={ad.co} />;
}

export function JobMeta() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13.5px] text-p-muted">
      <span className="inline-flex items-center gap-1"><Icon name="pin" size={14} />{AD_FIXED.location}</span>
      <span className="inline-flex items-center gap-1"><Icon name="briefcase" size={14} />{AD_FIXED.type}</span>
      <span className="inline-flex items-center gap-1"><Icon name="clock" size={14} />{AD_FIXED.posted}</span>
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-[3px] border border-p-line bg-p-bg px-2 py-0.5 text-[12.5px] text-p-ink">{children}</span>;
}

/** Referans jobDetail(): ilan başlığı, şirket, meta, etiketler, eylemler ve ilan gövdesi. */
export function JobDetail({ ad, actions, bare = false }: { ad: Ad; actions?: ReactNode; bare?: boolean }) {
  return (
    <div className={bare ? '' : 'rounded-md border border-p-line bg-white px-[22px] py-5 max-[520px]:p-4'}>
      <div className="flex items-start gap-3.5">
        {adLogo(ad)}
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-[650] leading-tight max-[520px]:text-[19px]">{ad.title}</h1>
          <p className="mb-1.5 mt-0.5 text-[15px]">{ad.co}</p>
          <JobMeta />
          <div className="mt-3 flex flex-wrap gap-1.5"><Chip>{ad.area}</Chip>{AD_FIXED.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
        </div>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2.5">{actions}</div> : null}
      <div className="job-body mt-[18px] border-t border-p-line pt-4 text-[14.5px]">
        <h4 className="mb-1.5 text-[15px] font-semibold">Şirket hakkında</h4><p>{ad.about}</p>
        <h4 className="mb-1.5 mt-4 text-[15px] font-semibold">Görev tanımı</h4><ul>{ad.duties.map((x) => <li key={x}>{x}</li>)}</ul>
        <h4 className="mb-1.5 mt-4 text-[15px] font-semibold">Aranan nitelikler</h4><ul>{ad.reqs.map((x) => <li key={x}>{x}</li>)}</ul>
        <h4 className="mb-1.5 mt-4 text-[15px] font-semibold">Çalışma koşulları</h4><p>{AD_FIXED.conditions}</p>
      </div>
    </div>
  );
}

export function Btn({ children, ghost, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ghost?: boolean }) {
  return (
    <button type="button" {...rest} className={`rounded border border-p-accent px-[22px] py-[9px] text-[14.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${ghost ? 'bg-white text-p-accent hover:bg-p-accent-soft' : 'bg-p-accent text-white hover:bg-p-accent-dark'} ${rest.className ?? ''}`}>
      {children}
    </button>
  );
}

export function SideSimilar({ keys }: { keys: AdKey[] }) {
  return (
    <div className="rounded-md border border-p-line bg-white px-[22px] py-5">
      <h3 className="mb-2.5 text-[15px] font-semibold">Benzer ilanlar</h3>
      <ul>
        {keys.map((k, i) => { const a = ADS[k]; return (
          <li key={k} className={`flex gap-2.5 text-[13.5px] ${i ? 'border-t border-p-line py-2.5' : 'pb-2.5'}`}>
            {adLogo(a, 40)}
            <div><div className="font-semibold text-p-accent">{a.title}</div><div>{a.co}</div><div className="text-[12.5px] text-p-muted">{AD_FIXED.sideMeta}</div></div>
          </li>
        ); })}
      </ul>
    </div>
  );
}

export function StatusPill({ s }: { s: AppRow['status'] }) {
  if (s === 'rejected') return <span className="inline-block whitespace-nowrap rounded-full bg-bad-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-bad">Olumsuz sonuçlandı</span>;
  if (s === 'new') return <span className="inline-block whitespace-nowrap rounded-full bg-p-accent-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-p-accent">Başvurunuz alındı</span>;
  return <span className="inline-block whitespace-nowrap rounded-full bg-pend-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-pend">Başvurunuz alındı</span>;
}

export function AppsTable({ apps }: { apps: AppRow[] }) {
  if (!apps.length) return <p className="py-1.5 text-sm text-p-muted">Henüz başvurunuz yok.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" data-testid="apps-table">
        <thead><tr>{['Pozisyon', 'Şirket', 'Başvuru', 'Durum'].map((h) => <th key={h} className="border-b border-p-line px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-p-muted">{h}</th>)}</tr></thead>
        <tbody>
          {apps.map((a, i) => (
            <tr key={`${a.key}-${i}`} className="[&:last-child>td]:border-b-0">
              <td className="border-b border-p-line px-2.5 py-[11px] font-semibold">{ADS[a.key].title}</td>
              <td className="border-b border-p-line px-2.5 py-[11px]">{ADS[a.key].co}</td>
              <td className="border-b border-p-line px-2.5 py-[11px] whitespace-nowrap">{a.when}</td>
              <td className="border-b border-p-line px-2.5 py-[11px]" data-st={a.key}><StatusPill s={a.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AppsBox({ apps }: { apps: AppRow[] }) {
  return (
    <div className="rounded-md border border-p-line bg-white">
      <div className="px-[22px] pb-1.5 pt-5"><h3 className="m-0 text-[15px] font-semibold">Başvurularım</h3></div>
      <div className="px-3 pb-1.5"><AppsTable apps={apps} /></div>
    </div>
  );
}

export function Crumbs({ parts }: { parts: string[] }) {
  return <nav aria-label="Konum" className="mb-2.5 flex flex-wrap items-center gap-1 text-[13px] text-p-muted">{parts.map((p, i) => <span key={i} className="inline-flex items-center gap-1">{i ? <Icon name="chevronRight" size={12} /> : null}{p}</span>)}</nav>;
}

export function SuccessAlert({ children }: { children: ReactNode }) {
  return <div role="status" className="flex gap-2.5 rounded border border-p-line border-l-4 border-l-ok bg-ok-soft px-3.5 py-2.5 text-sm"><Icon name="check" size={18} className="mt-0.5 text-ok" /><div>{children}</div></div>;
}

/**
 * Referans applyForm()/wireApplyForm(): öz geçmiş çipi, ön yazı (en az 100 karakter, kırpılmış), gönder düğmesi.
 * `extraValid` false iken gönderilemez (Modül B ek alanları).
 */
export function ApplyForm({ ad, onSend, before, beforeSend, extraValid = true }: { ad: Ad; onSend: (text: string) => void; before?: ReactNode; beforeSend?: ReactNode; extraValid?: boolean }) {
  const [txt, setTxt] = useState('');
  const [sent, setSent] = useState(false);
  const n = txt.trim().length;
  const ok = n >= COVER_LETTER_MIN && extraValid && !sent;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (ok) { setSent(true); onSend(txt.trim()); } }} noValidate>
      <h2 className="mb-1 text-lg font-semibold">Başvuru: {ad.title}</h2>
      <p className="mb-3.5 text-p-muted">{ad.co} · {AD_FIXED.applyMeta}</p>
      {before}
      <div className="mb-3.5 flex flex-col gap-1">
        <span className="text-sm font-semibold">Öz geçmiş</span>
        <span className="inline-flex items-center gap-1.5 self-start rounded-[3px] border border-p-line bg-p-bg px-2 py-1 text-[12.5px]"><Icon name="paperclip" size={14} />Profil öz geçmişi eklendi (ozgecmis.pdf)</span>
      </div>
      <div className="mb-3.5 flex flex-col gap-1">
        <label htmlFor="note_t" className="text-sm font-semibold">Kısa ön yazı</label>
        <textarea id="note_t" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Bu pozisyona neden başvurduğunuzu 2–3 cümleyle yazınız." className="min-h-[120px] w-full resize-y rounded border border-[#b9c2ce] bg-white px-2.5 py-2 focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent-soft" />
        <div className="flex justify-between gap-2 text-[12.5px] text-p-muted"><span>En az {COVER_LETTER_MIN} karakter</span><span id="cnt" className={n >= COVER_LETTER_MIN ? 'text-ok' : ''}>{n} / {COVER_LETTER_MIN}</span></div>
      </div>
      {beforeSend}
      <div className="mt-1 flex flex-wrap gap-2.5"><Btn type="submit" disabled={!ok} id="send">Başvuruyu gönder</Btn></div>
    </form>
  );
}

/** Modül A bekleme turunda platform içi şirket mesajı (referans deliver()). */
export function CompanyMessage({ ad, time, bodyHtml, adStatusHtml }: { ad: Ad; time: string; bodyHtml: string; adStatusHtml: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, []);
  return (
    <div ref={ref} className="mb-3.5 rounded-md border border-p-line bg-white" data-testid="company-message">
      <div className="flex items-center gap-2.5 border-b border-p-line px-3.5 py-3">
        {adLogo(ad, 40)}
        <div><div className="text-sm font-semibold">{ad.co} · İnsan Kaynakları</div><div className="text-[12.5px] text-p-muted">Yeni mesaj · {time} · {ad.title} başvurunuz hakkında</div></div>
      </div>
      <div className="m-text px-3.5 py-3.5 text-[14.5px]" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <div className="rounded-b-md border-t border-p-line bg-p-bg px-3.5 py-2.5 text-[13.5px]" data-testid="ad-status" dangerouslySetInnerHTML={{ __html: adStatusHtml }} />
    </div>
  );
}
