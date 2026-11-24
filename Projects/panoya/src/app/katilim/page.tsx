import { redirect } from 'next/navigation';
import { Logo } from '@/components/platform/Platform';
import { Icon } from '@/components/Icon';
import { CODE_RE, normalizeCode } from '@/server/codes';
import { getByCode } from '@/server/participants';

export const metadata = { title: 'Davet kodu ile giriş', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Entry({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const raw = (await searchParams).kod;
  let error = '';
  if (raw !== undefined) {
    let code = normalizeCode(raw);
    if (/^[2-9A-HJKMNP-Z]{8}$/.test(code)) code = `PNY-${code.slice(0, 4)}-${code.slice(4)}`;
    else if (/^PNY[2-9A-HJKMNP-Z]{8}$/.test(code)) code = `PNY-${code.slice(3, 7)}-${code.slice(7)}`;
    if (CODE_RE.test(code) && (await getByCode(code))) redirect(`/katilim/${code}`);
    error = 'Bu kod bulunamadı. Lütfen kodu kontrol ediniz.';
  }
  return (
    <div className="flex min-h-dvh flex-col bg-p-bg">
      <header className="border-b border-p-line bg-white"><div className="wrap flex min-h-14 items-center"><Logo href="/" /></div></header>
      <div className="wrap flex flex-1 items-start justify-center py-12">
        <form className="w-full max-w-[420px] rounded-lg border border-p-line bg-white p-6" action="/katilim" method="get">
          <span className="mb-3 grid size-11 place-items-center rounded-full bg-p-accent-soft text-p-accent"><Icon name="lock" /></span>
          <h1 className="mb-1 text-xl font-semibold">Davet kodu ile giriş</h1>
          <p className="mb-5 text-sm text-p-muted">Size iletilen katılımcı kodunu giriniz. Ara verdiyseniz aynı kodla kaldığınız yerden devam edebilirsiniz.</p>
          <label htmlFor="kod" className="text-sm font-semibold">Katılımcı kodu</label>
          <input id="kod" name="kod" required autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="PNY-XXXX-XXXX" defaultValue={raw ?? ''}
            className="mt-1 w-full rounded border border-[#b9c2ce] px-3 py-2.5 font-mono uppercase tracking-wider focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent-soft" />
          {error ? <p role="alert" className="mt-2 text-sm text-bad">{error}</p> : null}
          <button className="mt-4 w-full rounded bg-p-accent px-4 py-2.5 font-semibold text-white hover:bg-p-accent-dark">Devam</button>
        </form>
      </div>
    </div>
  );
}
