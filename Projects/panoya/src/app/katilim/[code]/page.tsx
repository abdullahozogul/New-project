import Link from 'next/link';
import Runner from '@/experiment/Runner';
import { CODE_RE, normalizeCode } from '@/server/codes';
import { getByCode, viewOf } from '@/server/participants';

export const metadata = { title: 'Katılım', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Participate({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode(decodeURIComponent((await params).code));
  const p = CODE_RE.test(code) ? await getByCode(code) : null;
  if (!p) {
    return (
      <div className="grid min-h-dvh place-items-center bg-p-bg p-4">
        <div className="max-w-sm rounded-lg border border-p-line bg-white p-6 text-center">
          <h1 className="mb-1 text-lg font-semibold">Kod bulunamadı</h1>
          <p className="mb-4 text-sm text-p-muted">Bağlantıdaki katılımcı kodu geçerli değil.</p>
          <Link className="font-semibold text-p-accent" href="/katilim">Kodu elle gir</Link>
        </div>
      </div>
    );
  }
  return <Runner initial={await viewOf(p)} />;
}
