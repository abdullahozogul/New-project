import Link from 'next/link';
import { CONDITIONS, COND_LABEL, MODULE_LABEL, type ModuleId } from '@/protocol/conditions';
import { dashboardStats, type Scope } from '@/server/admin';
import { Card, PageHead, ScopeTabs, TestBadge, fmt } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';

export const metadata = { title: 'Gösterge paneli' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ kapsam?: string }> }) {
  const sp = await searchParams;
  const scope = (['gercek', 'test', 'tumu'].includes(sp.kapsam ?? '') ? sp.kapsam : 'gercek') as Scope;
  const { cells, active } = await dashboardStats(scope);
  const sum = (f: (c: (typeof cells)[number]) => boolean) => cells.filter(f).reduce((s, c) => s + c.n, 0);
  return (
    <>
      <PageHead title="Gösterge paneli" sub="Deney ilerlemesi ve koşul dağılımı" right={<ScopeTabs base="/arastirmaci" scope={scope} />} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Kayıtlı', sum(() => true), 'users'],
          ['Başlamadı', sum((c) => c.status === 'olusturuldu'), 'clock'],
          ['Devam ediyor', sum((c) => c.status === 'devam'), 'play'],
          ['Tamamlandı', sum((c) => c.status === 'tamamlandi'), 'check'],
        ].map(([l, n, ic]) => (
          <Card key={l as string}><div className="flex items-center justify-between text-sm text-r-muted">{l}<Icon name={ic as never} size={16} /></div><div className="mt-1 text-2xl font-semibold tabular-nums" data-testid={`stat-${l}`}>{n as number}</div></Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(['A', 'B'] as ModuleId[]).map((m) => {
          const tot = sum((c) => c.module === m);
          const done = sum((c) => c.module === m && c.status === 'tamamlandi');
          const max = Math.max(1, ...CONDITIONS.map((k) => sum((c) => c.module === m && c.condition === k)));
          return (
            <Card key={m} title={MODULE_LABEL[m]}>
              <p className="mb-3 text-sm text-r-muted">{tot} kayıt · {done} tamamlandı</p>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-r-muted"><th className="pb-1.5 font-semibold">Koşul</th><th className="pb-1.5 font-semibold">Dağılım (kayıt)</th><th className="pb-1.5 text-right font-semibold">Kayıt</th><th className="pb-1.5 text-right font-semibold">Tamam.</th></tr></thead>
                <tbody>
                  {CONDITIONS.map((k) => {
                    const n = sum((c) => c.module === m && c.condition === k);
                    const d = sum((c) => c.module === m && c.condition === k && c.status === 'tamamlandi');
                    return (
                      <tr key={k} className="border-t border-[#eef0f1]">
                        <td className="py-2 pr-2">{COND_LABEL[k]}</td>
                        <td className="w-1/2 py-2 pr-3"><div className="h-2.5 rounded bg-[#eef0f1]"><div className="h-full rounded bg-r-accent" style={{ width: `${(n / max) * 100}%` }} /></div></td>
                        <td className="py-2 text-right tabular-nums">{n}</td>
                        <td className="py-2 text-right tabular-nums">{d}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>
      <Card title="Şu anda devam eden katılımcılar" className="mt-4">
        {active.length ? (
          <ul className="divide-y divide-[#eef0f1] text-sm">
            {active.map((a) => (
              <li key={a.code} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <Link href={`/arastirmaci/katilimcilar/${a.code}`} className="font-mono font-semibold text-r-accent hover:underline">{a.code}</Link>
                <span className="text-r-muted">Modül {a.module}</span>{a.isTest ? <TestBadge /> : null}
                <span className="flex-1">{a.step}</span><span className="text-xs text-r-muted">Son görülme: {fmt(a.lastSeen)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-r-muted">Şu anda devam eden katılımcı yok.</p>}
      </Card>
    </>
  );
}
