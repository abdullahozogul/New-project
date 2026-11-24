import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFrame, ListingCard } from '@/components/site/Site';
import { CompanyLogo } from '@/components/platform/CompanyLogo';
import { Icon } from '@/components/Icon';
import { LISTINGS, listingBySlug } from '@/platform/showcase';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const ad = listingBySlug((await params).slug);
  return { title: ad ? `${ad.title} – ${ad.co}` : 'İlan bulunamadı' };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const ad = listingBySlug((await params).slug);
  if (!ad) notFound();
  const similar = LISTINGS.filter((l) => l.key !== ad.key && l.area === ad.area).slice(0, 3);
  return (
    <SiteFrame active="ilanlar">
      <div className="wrap grid gap-5 py-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <nav className="mb-2.5 flex items-center gap-1 text-[13px] text-p-muted"><Link href="/ilanlar" className="hover:text-p-accent">İş İlanları</Link><Icon name="chevronRight" size={12} />{ad.area}<Icon name="chevronRight" size={12} />{ad.title}</nav>
          <article className="rounded-md border border-p-line bg-white px-[22px] py-5 max-[520px]:p-4">
            <div className="flex items-start gap-3.5">
              <CompanyLogo ini={ad.ini} color={ad.color} mark={ad.mark} label={ad.co} />
              <div className="min-w-0">
                <h1 className="text-[22px] font-[650] leading-tight">{ad.title}</h1>
                <p className="mb-1.5 mt-0.5 text-[15px]">{ad.co}</p>
                <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13.5px] text-p-muted">
                  <span className="inline-flex items-center gap-1"><Icon name="pin" size={14} />{ad.city} · {ad.mode}</span>
                  <span className="inline-flex items-center gap-1"><Icon name="briefcase" size={14} />Tam zamanlı</span>
                  <span className="inline-flex items-center gap-1"><Icon name="clock" size={14} />{ad.posted} yayınlandı</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href={`/giris?ilan=${ad.key}`} className="rounded border border-p-accent bg-p-accent px-[22px] py-[9px] text-[14.5px] font-semibold text-white hover:bg-p-accent-dark">Başvur</Link>
              <Link href={`/giris?ilan=${ad.key}`} className="inline-flex items-center gap-1.5 rounded border border-p-accent bg-white px-[22px] py-[9px] text-[14.5px] font-semibold text-p-accent hover:bg-p-accent-soft"><Icon name="bookmark" size={16} />Kaydet</Link>
            </div>
            <div className="job-body mt-[18px] border-t border-p-line pt-4 text-[14.5px]">
              <h2 className="mb-1.5 text-[15px] font-semibold">Şirket hakkında</h2><p>{ad.about}</p>
              <h2 className="mb-1.5 mt-4 text-[15px] font-semibold">Görev tanımı</h2><ul>{ad.duties.map((x) => <li key={x}>{x}</li>)}</ul>
              <h2 className="mb-1.5 mt-4 text-[15px] font-semibold">Aranan nitelikler</h2><ul>{ad.reqs.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </article>
        </div>
        <aside className="space-y-4">
          <div className="rounded-md border border-p-line bg-white p-5 text-sm">
            <h3 className="mb-2 font-semibold">Şirket</h3>
            <div className="flex items-center gap-2.5"><CompanyLogo ini={ad.ini} color={ad.color} mark={ad.mark} size={40} label={ad.co} /><div><div className="font-semibold">{ad.co}</div><div className="text-p-muted">{ad.area}</div></div></div>
          </div>
          {similar.length ? <div><h3 className="mb-2 text-[15px] font-semibold">Benzer ilanlar</h3><div className="flex flex-col gap-3">{similar.map((s) => <ListingCard key={s.key} ad={s} />)}</div></div> : null}
        </aside>
      </div>
    </SiteFrame>
  );
}
