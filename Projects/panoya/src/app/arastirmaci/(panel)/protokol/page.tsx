import { ADS, ROUND_AD_POOL } from '@/protocol/ads';
import { CONDITIONS, COND_LABEL, AD_STATUS_TEXT, companyResponseFor, MODULE_LABEL } from '@/protocol/conditions';
import { TIMING } from '@/protocol/timing';
import { stepLabel, stepsFor } from '@/experiment/steps';
import { Card, PageHead } from '@/components/admin/ui';

export const metadata = { title: 'Protokol' };

const ISSUES = [
  'Devam niyeti ölçeği henüz seçilmedi; 3 örnek madde kullanılıyor (dn_2 ters puanlanır).',
  'Prosedürel ve bilgisel adalet maddeleri "taslak uyarlama"; zamanında geri bildirim ve gerçekçilik maddeleri "taslak çeviri".',
  'Bilgilendirme ve Çalışma 1 onam metnindeki iletişim adresi yer tutucu: "[araştırma e-posta adresi]".',
  'Yaş 18–30 aralığı doğrulanmıyor (referansla aynı); aralık dışı değerler panelde işaretlenir.',
  'Davranış görevi en kısa süresi 90 sn ("gerçek süre danışmanla" notu).',
  'Modül B simülasyon modunda zamanı ilerletme denetimi katılımcıya gösteriliyor (referansta yalnızca demo şeridindeydi).',
  'Kurgusal şirket adlarının gerçek şirketlerle karışmadığı ekipçe kontrol edilmeli (vitrin ilanları dahil).',
];

export default function Protocol() {
  return (
    <>
      <PageHead title="Araştırma protokolü" sub="Salt okunur. Protokol içeriği kaynak kodda src/protocol/ altında tutulur; değişiklikler sürüm kontrolüyle izlenir." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Deneysel koşullar">
          <table className="w-full text-sm"><thead className="text-left text-xs text-r-muted"><tr><th className="pb-1">Koşul</th><th className="pb-1">Şirket yanıtı</th><th className="pb-1">İlan durumu</th></tr></thead><tbody>
            {CONDITIONS.map((c) => { const r = companyResponseFor(c); return <tr key={c} className="border-t border-[#eef0f1]"><td className="py-1.5">{COND_LABEL[c]}</td><td>{r.deliver ? 'Standart ret (aynı metin)' : 'Yanıt yok'}</td><td>{r.deliver ? AD_STATUS_TEXT[r.adStatus] : '—'}</td></tr>; })}
          </tbody></table>
        </Card>
        <Card title="Süreler (saniye)">
          <table className="w-full text-sm"><thead className="text-left text-xs text-r-muted"><tr><th className="pb-1">Süre</th><th className="pb-1">Deney</th><th className="pb-1">Test (kısaltılmış)</th></tr></thead><tbody>
            <tr className="border-t border-[#eef0f1]"><td className="py-1.5">Modül A: şirket yanıtı anı (bekleme)</td><td>{TIMING.roundWait.normal}</td><td>{TIMING.roundWait.fast}</td></tr>
            <tr className="border-t border-[#eef0f1]"><td className="py-1.5">Modül A: yanıttan sonra okuma süresi</td><td>{TIMING.roundRead.normal}</td><td>{TIMING.roundRead.fast}</td></tr>
            <tr className="border-t border-[#eef0f1]"><td className="py-1.5">Davranış görevi en kısa süre</td><td>{TIMING.behaviorMin.normal}</td><td>{TIMING.behaviorMin.fast}</td></tr>
          </tbody></table>
          <p className="mt-2 text-xs text-r-muted">Modül A tur ilanları: {ROUND_AD_POOL.map((k) => ADS[k].co).join(', ')} (katılımcı başına karıştırılır).</p>
        </Card>
        {(['A', 'B'] as const).map((m) => (
          <Card key={m} title={MODULE_LABEL[m]}>
            <ol className="ml-5 list-decimal text-sm">{stepsFor(m, null).map((s) => <li key={s.id} className="py-0.5"><span className="font-mono text-xs text-r-muted">{s.id}</span> · {stepLabel(s.id).replace(/^Tur \d/, 'Tur n')}{s.items.length ? <span className="text-xs text-r-muted"> ({s.items.length} madde)</span> : null}</li>)}</ol>
          </Card>
        ))}
        <Card title="Raporlanan açık konular" className="xl:col-span-2">
          <ul className="ml-5 list-disc space-y-1 text-sm">{ISSUES.map((i) => <li key={i}>{i}</li>)}</ul>
          <p className="mt-2 text-xs text-r-muted">Ayrıntı: docs/01-teknik-dokum.md, bölüm 7–8.</p>
        </Card>
      </div>
    </>
  );
}
