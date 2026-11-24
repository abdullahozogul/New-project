'use client';
import { useState } from 'react';
import Link from 'next/link';

type Created = { code: string; module: string; isTest: boolean };

export function CreateForm() {
  const [module, setModule] = useState<'A' | 'B'>('A');
  const [isTest, setIsTest] = useState(false);
  const [condition, setCondition] = useState('blok');
  const [count, setCount] = useState(1);
  const [fast, setFast] = useState(true);
  const [notes, setNotes] = useState(true);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<Created[]>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTest && condition !== 'blok' && !confirm('Gerçek katılımcıya koşulu elle atamak üzeresiniz. Bu, rastgele atamayı devre dışı bırakır ve kayıtta "manuel" olarak işaretlenir. Devam edilsin mi?')) return;
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/participants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ module, condition, count, isTest, fastMode: isTest && fast, showNotes: isTest && notes, label: label || null }) });
    const b = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(b.error || 'Hata'); return; }
    setCreated((c) => [...b.created, ...c]);
  };
  const csv = () => {
    const rows = ['kod,modul,test,baglanti', ...created.map((c) => `${c.code},${c.module},${c.isTest},${location.origin}/katilim/${c.code}`)];
    const url = URL.createObjectURL(new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'panoya_kodlar.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const opt = (on: boolean) => `cursor-pointer rounded border px-3 py-2 text-sm ${on ? 'border-r-accent bg-r-accent-soft font-semibold' : 'border-[#d5d9dc] bg-white'}`;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={submit} className="rounded-lg border border-[#dde1e3] bg-white p-5" data-testid="create-form">
        <fieldset className="mb-4"><legend className="mb-1.5 text-sm font-semibold">Deney modülü</legend>
          <div className="flex flex-wrap gap-2">
            <label className={opt(module === 'A')}><input type="radio" className="sr-only" name="module" checked={module === 'A'} onChange={() => setModule('A')} />Modül A · Laboratuvar</label>
            <label className={opt(module === 'B')}><input type="radio" className="sr-only" name="module" checked={module === 'B'} onChange={() => setModule('B')} />Modül B · E-posta takipli</label>
          </div>
        </fieldset>
        <fieldset className="mb-4"><legend className="mb-1.5 text-sm font-semibold">Kayıt türü</legend>
          <div className="flex flex-wrap gap-2">
            <label className={opt(!isTest)}><input type="radio" className="sr-only" name="kind" checked={!isTest} onChange={() => setIsTest(false)} />Gerçek katılımcı</label>
            <label className={opt(isTest)}><input type="radio" className="sr-only" name="kind" checked={isTest} onChange={() => setIsTest(true)} />Test kaydı (analizden ayrı)</label>
          </div>
        </fieldset>
        <fieldset className="mb-4"><legend className="mb-1.5 text-sm font-semibold">Deneysel koşul</legend>
          <div className="flex flex-wrap gap-2">
            {[['blok', 'Bloklu rastgele atama'], ['ret', 'Zamanında ret'], ['sahte', 'Sahte ilan'], ['ghosting', 'Ghosting']].map(([k, l]) => (
              <label key={k} className={opt(condition === k)}><input type="radio" className="sr-only" name="condition" checked={condition === k} onChange={() => setCondition(k)} />{l}</label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-r-muted">Bloklu atama: her üç kayıtta her koşul bir kez, sıra rastgele ve önceden üretilir{module === 'B' ? ' (Modül B: günlük bloklar)' : ''}. Test kayıtları gerçek sırayı tüketmez.</p>
        </fieldset>
        {isTest ? (
          <fieldset className="mb-4 rounded border border-note-line bg-note-bg p-3"><legend className="px-1 text-sm font-semibold text-note-ink">Test seçenekleri</legend>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} />Süreleri kısalt (bekleme 60→8 sn, okuma 6→2 sn, davranış görevi 90→6 sn)</label>
            <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />Sarı tasarım notlarını göster</label>
          </fieldset>
        ) : <p className="mb-4 text-xs text-r-muted">Gerçek katılımcılarda süreler her zaman protokoldeki gibidir; notlar ve test şeridi gösterilmez.</p>}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">Kayıt sayısı<input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))} className="r-in mt-1 font-normal" /></label>
          <label className="text-sm font-semibold">Etiket (isteğe bağlı)<input value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} placeholder="ör. Lab oturumu 3" className="r-in mt-1 font-normal" /></label>
        </div>
        <p className="mb-3 text-xs text-r-muted">Etikete ad, e-posta gibi kişisel bilgi yazmayınız.</p>
        {err ? <p role="alert" className="mb-2 text-sm text-bad">{err}</p> : null}
        <button disabled={busy} className="rounded bg-r-accent px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Oluşturuluyor…' : 'Katılımcı kodu oluştur'}</button>
      </form>
      <div className="rounded-lg border border-[#dde1e3] bg-white p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Oluşturulan kodlar</h2>{created.length ? <button onClick={csv} className="rounded border border-[#d5d9dc] px-2.5 py-1 text-xs font-semibold">CSV indir</button> : null}</div>
        {created.length ? (
          <ul className="divide-y divide-[#eef0f1] text-sm" data-testid="created-codes">
            {created.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center gap-2 py-2">
                <span className="font-mono font-semibold" data-code={c.code}>{c.code}</span><span className="text-xs text-r-muted">Modül {c.module}{c.isTest ? ' · TEST' : ''}</span>
                <span className="flex-1" />
                <a href={`/katilim/${c.code}`} target="_blank" rel="noopener" className="text-xs font-semibold text-r-accent">Katılımcı ekranı</a>
                <Link href={`/arastirmaci/katilimcilar/${c.code}`} className="text-xs font-semibold text-r-accent">Ayrıntı</Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-r-muted">Henüz kod oluşturulmadı. Katılımcı bağlantısı: <span className="font-mono">/katilim/KOD</span>. Katılımcılar kodu <span className="font-mono">/katilim</span> sayfasına da girebilir.</p>}
      </div>
    </div>
  );
}
