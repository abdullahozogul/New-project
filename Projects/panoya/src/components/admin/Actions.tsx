'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ParticipantActions({ code, isTest, status, hasContact }: { code: string; isTest: boolean; status: string; hasContact: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const act = async (action: string, ask: string) => {
    if (!confirm(ask)) return;
    const r = await fetch('/api/admin/participants', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, action }) });
    const b = await r.json().catch(() => ({}));
    setMsg(r.ok ? 'İşlem tamamlandı.' : b.error || 'Hata');
    router.refresh();
  };
  const btn = 'rounded border border-[#d5d9dc] bg-white px-3 py-1.5 text-sm font-semibold hover:bg-[#f4f5f6]';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isTest ? <button className={btn} onClick={() => act('reset', 'Bu test kaydının tüm yanıtları ve olayları silinecek. Devam edilsin mi?')}>Test kaydını sıfırla</button> : null}
      {status !== 'iptal' ? <button className={btn} onClick={() => act('cancel', 'Kod iptal edilecek; katılımcı devam edemez. Veriler silinmez. Devam edilsin mi?')}>Kodu iptal et</button>
        : <button className={btn} onClick={() => act('uncancel', 'İptal kaldırılsın mı?')}>İptali kaldır</button>}
      {hasContact ? <button className={btn} onClick={() => act('purge_contact', 'Ad ve e-posta kalıcı olarak silinecek. Devam edilsin mi?')}>İletişim bilgisini sil</button> : null}
      {msg ? <span className="text-sm text-r-muted">{msg}</span> : null}
    </div>
  );
}

export function CopyLink({ path }: { path: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="rounded border border-[#d5d9dc] bg-white px-2 py-1 text-xs font-semibold" onClick={async () => { await navigator.clipboard.writeText(location.origin + path); setOk(true); setTimeout(() => setOk(false), 1500); }}>
      {ok ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
    </button>
  );
}
