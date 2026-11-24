import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ADS } from '@/protocol/ads';
import { COND_LABEL, MODULE_LABEL } from '@/protocol/conditions';
import { stepLabel } from '@/experiment/steps';
import { participantDetail } from '@/server/admin';
import { CODE_RE, normalizeCode } from '@/server/codes';
import { Card, CondBadge, PageHead, StatusBadge, TestBadge, fmt } from '@/components/admin/ui';
import { CopyLink, ParticipantActions } from '@/components/admin/Actions';

export const metadata = { title: 'Katılımcı ayrıntısı' };

const show = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? 'evet' : 'hayır') : v instanceof Date ? fmt(v) : typeof v === 'object' ? JSON.stringify(v) : String(v));

export default async function Detail({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode((await params).code);
  if (!CODE_RE.test(code)) notFound();
  const d = await participantDetail(code);
  if (!d) notFound();
  const { p, steps, responses, events, scores, derived, hasContact } = d;
  const link = `/katilim/${p.code}`;
  return (
    <>
      <PageHead title={p.code} sub={<span className="flex flex-wrap items-center gap-2">{MODULE_LABEL[p.module]} <CondBadge c={p.condition} /> <StatusBadge s={p.status} /> {p.is_test ? <TestBadge /> : null}</span>}
        right={<Link href="/arastirmaci/katilimcilar" className="text-sm font-semibold text-r-accent">← Katılımcılar</Link>} />
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card title="Kayıt">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-r-muted">Koşul</dt><dd>{COND_LABEL[p.condition]} ({p.assignment_method === 'blok' ? 'bloklu rastgele' : 'elle'})</dd>
            <dt className="text-r-muted">Aşama</dt><dd>{p.status === 'tamamlandi' ? 'Tamamlandı' : `${p.step_index}/${steps.length} · ${stepLabel(steps[p.step_index]?.id ?? '')}`}</dd>
            {p.round_order ? <><dt className="text-r-muted">Tur sırası</dt><dd>{p.round_order.map((k) => ADS[k].co).join(' → ')}</dd></> : null}
            {p.chosen_ad ? <><dt className="text-r-muted">Seçilen ilan</dt><dd>{ADS[p.chosen_ad].co}</dd></> : null}
            <dt className="text-r-muted">Oluşturma</dt><dd>{fmt(p.created_at)}</dd>
            <dt className="text-r-muted">Başlangıç</dt><dd>{fmt(p.started_at)}</dd>
            <dt className="text-r-muted">Bitiş</dt><dd>{fmt(p.completed_at)}</dd>
            <dt className="text-r-muted">Son görülme</dt><dd>{fmt(p.last_seen_at)}</dd>
            {p.is_test ? <><dt className="text-r-muted">Test ayarları</dt><dd>{p.fast_mode ? 'kısaltılmış süreler' : 'gerçek süreler'} · notlar {p.show_notes ? 'açık' : 'kapalı'}</dd></> : null}
            {p.label ? <><dt className="text-r-muted">Etiket</dt><dd>{p.label}</dd></> : null}
            <dt className="text-r-muted">İletişim</dt><dd>{hasContact ? 'Kayıtlı (ayrı tabloda, dışa aktarılmaz)' : 'Yok'}</dd>
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-2"><a href={link} target="_blank" rel="noopener" className="rounded bg-r-accent px-3 py-1.5 text-sm font-semibold text-white">Katılımcı ekranını aç</a><CopyLink path={link} /></div>
        </Card>
        <Card title="Ölçek puanları (referans mean())">
          <table className="w-full text-sm"><tbody>
            {Object.entries(scores).map(([k, v]) => <tr key={k} className="border-t border-[#eef0f1] first:border-0"><td className="py-1 pr-2 font-mono text-xs">{k}</td><td className="py-1 text-right tabular-nums">{show(v)}</td></tr>)}
          </tbody></table>
        </Card>
        <Card title="Türetilmiş değişkenler">
          <table className="w-full text-sm"><tbody>
            {Object.entries(derived).map(([k, v]) => <tr key={k} className="border-t border-[#eef0f1] first:border-0"><td className="py-1 pr-2 font-mono text-xs">{k}</td><td className="py-1 text-right text-xs">{show(v)}</td></tr>)}
          </tbody></table>
        </Card>
      </div>
      <Card title="İşlemler" className="mb-4"><ParticipantActions code={p.code} isTest={p.is_test} status={p.status} hasContact={hasContact} /></Card>
      <Card title={`Adım kayıtları (${responses.length}/${steps.length})`} className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-r-muted"><tr><th className="py-1.5 pr-3">#</th><th className="py-1.5 pr-3">Ekran</th><th className="py-1.5 pr-3">Süre</th><th className="py-1.5">Veri</th></tr></thead>
            <tbody>
              {steps.map((s, i) => {
                const r = responses.find((x) => x.step_id === s.id);
                const dur = r?.started_at && r?.finished_at ? Math.round((+new Date(r.finished_at) - +new Date(r.started_at)) / 100) / 10 : null;
                return (
                  <tr key={s.id} className={`border-t border-[#eef0f1] align-top ${!r ? 'text-r-muted' : ''} ${i === p.step_index && p.status === 'devam' ? 'bg-r-accent-soft' : ''}`}>
                    <td className="py-1.5 pr-3 tabular-nums">{i}</td>
                    <td className="py-1.5 pr-3"><div className="font-mono text-xs">{s.id}</div><div className="text-xs">{stepLabel(s.id)}</div></td>
                    <td className="whitespace-nowrap py-1.5 pr-3 text-xs">{dur !== null ? `${dur} sn` : '—'}</td>
                    <td className="py-1.5 font-mono text-xs [overflow-wrap:anywhere]">{r ? Object.entries(r.data).map(([k, v]) => <span key={k} className="mr-2 inline-block"><span className="text-r-muted">{k}=</span>{show(v)}</span>) : i === p.step_index && p.status === 'devam' ? 'Şu anki adım' : 'Henüz yok'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title={`Olaylar (${events.length})`}>
        <ol className="max-h-[420px] overflow-y-auto text-xs">
          {events.map((e, i) => <li key={i} className="flex flex-wrap gap-x-3 border-t border-[#eef0f1] py-1 first:border-0"><span className="tabular-nums text-r-muted">{fmt(e.created_at)}</span><span className="font-semibold">{e.type}</span><span className="font-mono">{e.step_id ?? ''}</span><span className="font-mono text-r-muted">{Object.keys(e.payload).length ? JSON.stringify(e.payload) : ''}</span></li>)}
        </ol>
      </Card>
    </>
  );
}
