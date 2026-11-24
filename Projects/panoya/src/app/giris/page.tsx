import Link from 'next/link';
import { SiteFrame } from '@/components/site/Site';
import { Icon } from '@/components/Icon';

export const metadata = { title: 'Giriş yap' };

export default function Login() {
  return (
    <SiteFrame>
      <div className="wrap flex justify-center py-10">
        <div className="w-full max-w-[420px] rounded-lg border border-p-line bg-white p-6">
          <h1 className="mb-1 text-xl font-semibold">Giriş yap</h1>
          <p className="mb-5 text-sm text-p-muted">Başvuru yapmak ve başvurularını takip etmek için hesabına giriş yap.</p>
          <div className="mb-4 rounded border border-p-line border-l-4 border-l-p-accent bg-p-accent-soft px-3.5 py-2.5 text-sm">Aday hesapları şu anda yalnızca davetli kullanıcılara açıktır.</div>
          <Link href="/katilim" className="flex w-full items-center justify-center gap-2 rounded bg-p-accent px-4 py-2.5 font-semibold text-white hover:bg-p-accent-dark"><Icon name="lock" size={16} />Davet kodu ile giriş</Link>
          <p className="mt-4 text-center text-xs text-p-muted">Davet kodunuz yoksa ilanları inceleyebilirsiniz. <Link href="/ilanlar" className="text-p-accent hover:underline">İş ilanları</Link></p>
        </div>
      </div>
    </SiteFrame>
  );
}
