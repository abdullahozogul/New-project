import Link from 'next/link';
import { listParticipants, type Scope } from '@/server/admin';
import { CondBadge, PageHead, ScopeTabs, StatusBadge, TestBadge, fmt } from '@/components/admin/ui';

export const metadata = { title: 'Katılımcılar' };

export default async function Participants({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const scope = (['gercek', 'test', 'tumu'].includes(sp.kapsam ?? '') ? sp.kapsam : 'gercek') as Scope;
  const module = sp.modul === 'A' || sp.modul === 'B' ? sp.modul : '';
  const status = ['olusturuldu', 'devam', 'tamamlandi', 'iptal'].includes(sp.durum ?? '') ? sp.durum! : '';
  const q = (sp.q ?? '').slice(0, 40);
  const rows = await listParticipants({ scope, module, status, q });
  const extra: Record<string, string> = {};
  if (module) extra.modul = module;
  if (status) extra.durum = status;
  if (q) extra.q = q;
  return (
    <>
      <PageHead title="Katılımcılar" sub={`${rows.length} kayıt`} right={<Link href="/arastirmaci/yeni" className="rounded bg-r-accent px-3.5 py-2 text-sm font-semibold text-white">Yeni katılımcı</Link>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ScopeTabs base="/arastirmaci/katilimcilar" scope={scope} extra={extra} />
        <form className="flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="kapsam" value={scope} />
          <select name="modul" defaultValue={module} className="rounded border border-[#d5d9dc] bg-white px-2 py-1.5"><option value="">Tüm modüller</option><option value="A">Modül A</option><option value="B">Modül B</option></select>
          <select name="durum" defaultValue={status} className="rounded border border-[#d5d9dc] bg-white px-2 py-1.5"><option value="">Tüm durumlar</option><option value="olusturuldu">Başlamadı</option><option value="devam">Devam ediyor</option><option value="tamamlandi">Tamamlandı</option><option value="iptal">İptal</option></select>
          <input name="q" defaultValue={q} placeholder="Kod veya etiket" className="rounded border border-[#d5d9dc] bg-white px-2 py-1.5" />
          <button className="rounded border border-[#d5d9dc] bg-white px-3 py-1.5 font-semibold">Filtrele</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#dde1e3] bg-white">
        <table className="w-full text-sm" data-testid="participants-table">
          <thead className="bg-[#f7f8f8] text-left text-xs text-r-muted">
            <tr>{['Kod', 'Modül', 'Koşul', 'Durum', 'Aşama', 'Oluşturma', 'Son görülme', 'Etiket'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#eef0f1] hover:bg-[#fafbfb]">
                <td className="whitespace-nowrap px-3 py-2"><Link href={`/arastirmaci/katilimcilar/${r.code}`} className="font-mono font-semibold text-r-accent hover:underline">{r.code}</Link> {r.is_test ? <TestBadge /> : null}</td>
                <td className="px-3 py-2">{r.module}</td>
                <td className="px-3 py-2"><CondBadge c={r.condition} /></td>
                <td className="px-3 py-2"><StatusBadge s={r.status} /></td>
                <td className="min-w-[200px] px-3 py-2">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded bg-[#eef0f1]"><div className="h-full rounded bg-r-accent" style={{ width: `${(r.step_index / r.total) * 100}%` }} /></div><span className="tabular-nums text-xs text-r-muted">{r.step_index}/{r.total}</span></div>
                  <div className="text-xs">{r.stepName}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{fmt(r.created_at)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{fmt(r.last_seen_at)}</td>
                <td className="px-3 py-2 text-xs">{r.label ?? ''}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={8} className="px-3 py-6 text-center text-r-muted">Kayıt yok.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
