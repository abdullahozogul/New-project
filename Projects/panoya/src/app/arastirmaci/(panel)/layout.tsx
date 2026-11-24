import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata = { title: { default: 'Araştırmacı paneli', template: '%s · Araştırmacı paneli' }, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f4f5f6] text-r-ink md:grid md:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="bg-r-head text-[#e6e9e8] md:min-h-dvh">
        <div className="flex items-center justify-between gap-2 px-4 py-4 md:block">
          <Link href="/arastirmaci" className="flex items-center gap-2 font-semibold"><Icon name="flask" />Panoya · Araştırma</Link>
          <p className="hidden text-xs text-[#aeb5b3] md:mt-1 md:block">Deney yönetimi</p>
        </div>
        <AdminNav />
        <form action="/api/admin/logout" method="post" className="px-4 pb-4 md:mt-6">
          <button className="flex items-center gap-2 text-sm text-[#cfd4d2] hover:text-white"><Icon name="arrowLeft" size={16} />Çıkış yap</button>
        </form>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
