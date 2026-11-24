import Link from 'next/link';
import { SiteFrame, ListingCard } from '@/components/site/Site';
import { Icon } from '@/components/Icon';
import { LISTINGS } from '@/platform/showcase';

const CATS: [string, string, number][] = [['Yayıncılık', 'file', 6], ['Çeviri ve yerelleştirme', 'globe', 2], ['İletişim ve içerik', 'pencil', 3], ['Eğitim ve öğretim', 'users', 1]];

export default function Home() {
  return (
    <SiteFrame>
      <section className="border-b border-p-line bg-white">
        <div className="wrap grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] max-[520px]:py-8">
          <div>
            <h1 className="text-[34px] font-bold leading-tight tracking-tight text-p-navy max-[520px]:text-[26px]">Kariyerinde bir sonraki adım burada.</h1>
            <p className="mt-3 max-w-[520px] text-[16px] text-p-muted">Yayıncılık, çeviri ve içerik alanındaki güncel ilanları keşfet, tek profille başvur, başvurularını tek yerden takip et.</p>
            <form action="/ilanlar" className="mt-6 flex flex-col gap-2 rounded-lg border border-p-line bg-white p-2 shadow-[0_2px_12px_rgba(16,24,40,.06)] sm:flex-row">
              <label className="flex flex-1 items-center gap-2 px-2"><Icon name="search" className="text-p-muted" /><input name="q" placeholder="Pozisyon, şirket veya anahtar kelime" className="w-full py-2 outline-none" aria-label="Pozisyon" /></label>
              <label className="flex items-center gap-2 border-p-line px-2 sm:w-48 sm:border-l"><Icon name="pin" className="text-p-muted" /><input name="sehir" placeholder="Şehir" className="w-full py-2 outline-none" aria-label="Şehir" /></label>
              <button className="rounded bg-p-accent px-6 py-2.5 font-semibold text-white hover:bg-p-accent-dark">İş bul</button>
            </form>
            <p className="mt-3 text-[13px] text-p-muted">Popüler: <Link className="text-p-accent hover:underline" href="/ilanlar?q=editör">editör</Link> · <Link className="text-p-accent hover:underline" href="/ilanlar?q=çeviri">çeviri</Link> · <Link className="text-p-accent hover:underline" href="/ilanlar?q=içerik">içerik</Link></p>
          </div>
          <div className="hidden md:block" aria-hidden>
            <div className="relative mx-auto max-w-[360px]">
              {LISTINGS.slice(0, 3).map((a, i) => (
                <div key={a.key} className="mb-3 flex items-center gap-3 rounded-lg border border-p-line bg-white p-3.5 shadow-[0_2px_10px_rgba(16,24,40,.06)]" style={{ marginLeft: i * 22 }}>
                  <span className="grid size-10 place-items-center rounded-md font-bold text-white" style={{ background: a.color }}>{a.ini}</span>
                  <div className="min-w-0"><div className="truncate text-sm font-semibold text-p-accent">{a.title}</div><div className="truncate text-xs text-p-muted">{a.co} · {a.city}</div></div>
                  <span className="ml-auto rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok">Yeni</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="wrap py-8">
        <h2 className="mb-4 text-lg font-semibold">Kategoriler</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATS.map(([c, ic, n]) => (
            <Link key={c} href={`/ilanlar?alan=${encodeURIComponent(c)}`} className="flex items-center gap-3 rounded-md border border-p-line bg-white p-4 hover:border-p-accent">
              <span className="grid size-10 place-items-center rounded-md bg-p-accent-soft text-p-accent"><Icon name={ic as never} /></span>
              <span><span className="block text-sm font-semibold">{c}</span><span className="text-xs text-p-muted">{n} ilan</span></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="wrap pb-6">
        <div className="mb-4 flex items-end justify-between"><h2 className="text-lg font-semibold">Öne çıkan ilanlar</h2><Link href="/ilanlar" className="text-sm font-semibold text-p-accent hover:underline">Tüm ilanlar</Link></div>
        <div className="grid gap-3 md:grid-cols-2">{LISTINGS.slice(0, 6).map((a) => <ListingCard key={a.key} ad={a} />)}</div>
      </section>
      <section className="wrap py-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-p-navy px-6 py-6 text-white sm:flex-row sm:items-center">
          <div><div className="text-lg font-semibold">Yeni mezun musun?</div><p className="text-sm text-white/75">0–2 yıl deneyim arayan ilanları tek tıkla filtrele.</p></div>
          <Link href="/ilanlar?q=yeni mezun" className="rounded bg-white px-5 py-2.5 text-sm font-semibold text-p-navy">Yeni mezun ilanları</Link>
        </div>
      </section>
    </SiteFrame>
  );
}
