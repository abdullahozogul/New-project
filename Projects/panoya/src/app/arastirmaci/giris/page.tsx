import { Icon } from '@/components/Icon';

export const metadata = { title: 'Araştırmacı girişi', robots: { index: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const err = (await searchParams).hata;
  return (
    <div className="grid min-h-dvh place-items-center bg-[#eef0f2] p-4">
      <form method="post" action="/api/admin/login" className="w-full max-w-[380px] rounded-lg border border-[#d5d9dc] bg-white p-6">
        <span className="mb-3 grid size-11 place-items-center rounded-full bg-r-accent-soft text-r-accent"><Icon name="flask" /></span>
        <h1 className="text-lg font-semibold">Araştırmacı paneli</h1>
        <p className="mb-4 text-sm text-r-muted">Panoya deney yönetimi. Katılımcı ekranlarından ayrıdır.</p>
        <label htmlFor="pw" className="text-sm font-semibold">Parola</label>
        <input id="pw" name="password" type="password" required autoComplete="current-password" className="r-in mt-1" />
        {err ? <p role="alert" className="mt-2 text-sm text-bad">{err === 'ayar' ? 'Sunucu ayarı eksik: ADMIN_PASSWORD (en az 12) ve SESSION_SECRET (en az 32 karakter) ortam değişkenlerini tanımlayınız.' : 'Parola hatalı.'}</p> : null}
        <button className="mt-4 w-full rounded bg-r-accent px-4 py-2.5 font-semibold text-white">Giriş</button>
      </form>
    </div>
  );
}
