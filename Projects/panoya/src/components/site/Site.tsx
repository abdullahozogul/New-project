import Link from 'next/link';
import type { ReactNode } from 'react';
import { PlatformHeader } from '@/components/platform/Platform';
import { CompanyLogo } from '@/components/platform/CompanyLogo';
import { Icon } from '@/components/Icon';
import type { ListingAd } from '@/platform/showcase';

export function SiteFrame({ children, active, q }: { children: ReactNode; active?: 'ilanlar'; q?: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-p-bg">
      <PlatformHeader active={active} q={q} />
      <div className="flex-1">{children}</div>
      <footer className="mt-10 border-t border-p-line bg-white">
        <div className="wrap grid gap-6 py-8 text-sm text-p-muted sm:grid-cols-4">
          <div><div className="mb-2 font-semibold text-p-ink">panoya</div><p>Yeni mezunlar ve deneyimli adaylar için kariyer platformu.</p></div>
          <div><div className="mb-2 font-semibold text-p-ink">Adaylar</div><ul className="space-y-1"><li><Link href="/ilanlar" className="hover:text-p-accent">İş ilanları</Link></li><li><Link href="/giris" className="hover:text-p-accent">Giriş yap</Link></li><li><Link href="/katilim" className="hover:text-p-accent">Davet kodu ile giriş</Link></li></ul></div>
          <div><div className="mb-2 font-semibold text-p-ink">İşverenler</div><ul className="space-y-1"><li>İlan yayınla</li><li>Aday havuzu</li></ul></div>
          <div><div className="mb-2 font-semibold text-p-ink">Kurumsal</div><ul className="space-y-1"><li>Hakkımızda</li><li>Gizlilik</li><li>Yardım merkezi</li></ul></div>
        </div>
        <div className="border-t border-p-line"><div className="wrap py-3 text-xs text-p-muted">© 2026 panoya</div></div>
      </footer>
    </div>
  );
}

export function ListingCard({ ad }: { ad: ListingAd }) {
  return (
    <Link href={`/ilanlar/${ad.key}`} className="group flex gap-3.5 rounded-md border border-p-line bg-white p-4 transition-shadow hover:shadow-[0_2px_10px_rgba(16,24,40,.08)]">
      <CompanyLogo ini={ad.ini} color={ad.color} mark={ad.mark} size={48} label={ad.co} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="m-0 font-[650] text-p-accent group-hover:underline">{ad.title}</p>
          <Icon name="bookmark" size={18} className="text-p-muted" />
        </div>
        <p className="mb-1.5 mt-px text-sm">{ad.co}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-p-muted">
          <span className="inline-flex items-center gap-1"><Icon name="pin" size={13} />{ad.city} · {ad.mode}</span>
          <span className="inline-flex items-center gap-1"><Icon name="clock" size={13} />{ad.posted}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-[3px] border border-p-line bg-p-bg px-2 py-0.5 text-xs">{ad.area}</span><span className="rounded-[3px] border border-p-line bg-p-bg px-2 py-0.5 text-xs">Tam zamanlı</span></div>
      </div>
    </Link>
  );
}
