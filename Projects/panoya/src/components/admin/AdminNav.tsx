'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

const ITEMS: [string, string, IconName][] = [
  ['/arastirmaci', 'Gösterge paneli', 'chart'],
  ['/arastirmaci/katilimcilar', 'Katılımcılar', 'users'],
  ['/arastirmaci/yeni', 'Katılımcı kaydı', 'play'],
  ['/arastirmaci/disa-aktar', 'Verileri dışa aktar', 'download'],
  ['/arastirmaci/protokol', 'Protokol', 'shield'],
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
      {ITEMS.map(([href, label, icon]) => {
        const on = href === '/arastirmaci' ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={`flex items-center gap-2.5 whitespace-nowrap rounded px-3 py-2 text-sm ${on ? 'bg-white/12 font-semibold text-white' : 'text-[#cfd4d2] hover:bg-white/5'}`}><Icon name={icon} size={17} />{label}</Link>;
      })}
    </nav>
  );
}
