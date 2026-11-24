import Link from 'next/link';
import { SiteFrame, ListingCard } from '@/components/site/Site';
import { LISTINGS } from '@/platform/showcase';
import { Icon } from '@/components/Icon';

export const metadata = { title: 'İş ilanları' };

const norm = (s: string) => s.toLocaleLowerCase('tr-TR');

export default async function Listings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const alan = sp.alan ?? '';
  const sehir = (sp.sehir ?? '').trim();
  const words = norm(q).split(/\s+/).filter(Boolean);
  const list = LISTINGS.filter((a) => {
    const hay = norm(`${a.title} ${a.co} ${a.area} ${a.about} ${a.reqs.join(' ')}`);
    return words.every((w) => hay.includes(w)) && (!alan || a.area === alan) && (!sehir || norm(a.city).includes(norm(sehir)));
  });
  const areas = Array.from(new Set(LISTINGS.map((a) => a.area)));
  return (
    <SiteFrame active="ilanlar" q={q}>
      <div className="wrap grid gap-5 py-5 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-md border border-p-line bg-white p-4 text-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold"><Icon name="filter" size={16} />Filtreler</div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-p-muted">Alan</div>
          <ul className="mb-4 space-y-1">
            <li><Link href={{ pathname: '/ilanlar', query: q ? { q } : {} }} className={!alan ? 'font-semibold text-p-accent' : 'hover:text-p-accent'}>Tümü</Link></li>
            {areas.map((a) => <li key={a}><Link href={{ pathname: '/ilanlar', query: { ...(q ? { q } : {}), alan: a } }} className={alan === a ? 'font-semibold text-p-accent' : 'hover:text-p-accent'}>{a}</Link></li>)}
          </ul>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-p-muted">Deneyim</div>
          <p className="text-p-muted">Yeni mezun · 0–2 yıl · 3+ yıl</p>
        </aside>
        <div className="min-w-0">
          <div className="mb-3 text-sm text-p-muted">{q ? <>&quot;{q}&quot; için </> : null}{list.length} ilan</div>
          <div className="flex flex-col gap-3">{list.map((a) => <ListingCard key={a.key} ad={a} />)}</div>
          {!list.length ? <p className="rounded-md border border-p-line bg-white p-6 text-center text-p-muted">Aramanıza uygun ilan bulunamadı.</p> : null}
        </div>
      </div>
    </SiteFrame>
  );
}
