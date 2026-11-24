import { Card, PageHead } from '@/components/admin/ui';
import { Icon } from '@/components/Icon';

export const metadata = { title: 'Verileri dışa aktar' };

const SCOPES: [string, string][] = [['gercek', 'Gerçek katılımcılar'], ['test', 'Test kayıtları'], ['tumu', 'Tümü']];
const MODS: [string, string][] = [['', 'Her iki modül'], ['A', 'Modül A'], ['B', 'Modül B']];

export default function ExportPage() {
  return (
    <>
      <PageHead title="Verileri dışa aktar" sub="CSV (UTF-8, virgülle ayrılmış) veya Excel. Ad ve e-posta hiçbir dosyaya girmez." />
      <form action="/api/admin/export" method="get" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Kapsam">
          <div className="mb-3 flex flex-wrap gap-3 text-sm">{SCOPES.map(([k, l], i) => <label key={k} className="flex items-center gap-1.5"><input type="radio" name="scope" value={k} defaultChecked={i === 0} />{l}</label>)}</div>
          <div className="flex flex-wrap gap-3 text-sm">{MODS.map(([k, l], i) => <label key={k} className="flex items-center gap-1.5"><input type="radio" name="module" value={k} defaultChecked={i === 0} />{l}</label>)}</div>
          <p className="mt-3 text-xs text-r-muted">Analiz için varsayılan kapsam yalnızca gerçek katılımcılardır; test kayıtları ayrı tutulur.</p>
        </Card>
        <Card title="Biçim">
          <div className="space-y-1.5 text-sm">
            <label className="flex items-center gap-1.5"><input type="radio" name="kind" value="genis" defaultChecked />Geniş tablo: katılımcı başına bir satır, tüm maddeler, puanlar ve türetilmiş değişkenler</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="kind" value="uzun" />Uzun tablo: adım başına bir satır (jsPsych veri satırlarına karşılık)</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="kind" value="olaylar" />Olaylar: e-posta açılma/tıklama, şirket yanıtı, devam etme, sekme değişimi</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="kind" value="sozluk" />Değişken sözlüğü</label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button name="format" value="csv" className="inline-flex items-center gap-1.5 rounded bg-r-accent px-3.5 py-2 text-sm font-semibold text-white"><Icon name="download" size={16} />CSV indir</button>
            <button name="format" value="xlsx" className="inline-flex items-center gap-1.5 rounded border border-r-accent bg-white px-3.5 py-2 text-sm font-semibold text-r-accent"><Icon name="download" size={16} />Excel indir (tüm sayfalar)</button>
          </div>
          <p className="mt-2 text-xs text-r-muted">Excel dosyası dört sayfa içerir: katilimcilar, adimlar, olaylar, sozluk.</p>
        </Card>
      </form>
    </>
  );
}
